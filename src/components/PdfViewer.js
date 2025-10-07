import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { generateResponse as geminiGenerate } from '../services/geminiClient';
import { useLocation, useNavigate } from 'react-router-dom';
import './PdfViewer.css';

function PdfViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const pdfUrl = location.state?.pdfUrl;
  const name = location.state?.name;
  const [activeMobileTab, setActiveMobileTab] = useState('chat');
  const [theme, setTheme] = useState('light');
  const [messages, setMessages] = useState([
    { id: 'm1', role: 'assistant', text: 'Ask me anything about your PDF.', at: new Date() },
  ]);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionSet, setQuestionSet] = useState(null);
  const [answers, setAnswers] = useState({ mcq: {}, short: {}, long: {} });
  const [grading, setGrading] = useState({ loading: false, result: null, error: null });
  const listRef = useRef(null);

  const backendUrl = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSend(textOverride) {
    const content = (textOverride ?? draft).trim();
    if (!content) return;
    const userMsg = { id: `u-${Date.now()}`, role: 'user', text: content, at: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setDraft('');
    setIsTyping(true);
    // Simulate assistant reply for demo UX
    setTimeout(() => {
      const reply = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: 'Thanks! In a real app, I would analyze the PDF and respond here.',
        at: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 700);
  }

  const canShowChat = useMemo(() => activeMobileTab === 'chat', [activeMobileTab]);
  const canShowPdf = useMemo(() => activeMobileTab === 'pdf', [activeMobileTab]);

  async function extractPdfText(url) {
    // Use worker again for performance
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    const loadingTask = pdfjsLib.getDocument({ url });
    const pdf = await loadingTask.promise;
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 30); // cap pages for performance
    for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str).join(' ');
      fullText += `\n\n[Page ${pageNum}]\n${strings}`;
      if (fullText.length > 80000) break; // guard for very large PDFs
    }
    return fullText;
  }

  async function generateQuestions() {
    if (!pdfUrl || isGenerating) return;
    setIsGenerating(true);
    try {
      const text = await extractPdfText(pdfUrl);
      const snippet = text.slice(0, 20000); // limit token usage
      const prompt = `You are a helpful assistant generating questions strictly in JSON. Based ONLY on the provided PDF text, create:
{
  "mcqs": 5 items, each: {"question": string, "options": ["A","B","C","D"], "answerIndex": 0-3},
  "short": 2 items, each: {"question": string},
  "long": 1 item, with: {"question": string}
}
Rules: Output VALID JSON only, no markdown, no backticks, no explanations. Keep questions concise and unambiguous.
PDF_TEXT_START\n${snippet}\nPDF_TEXT_END`;
      const jsonText = await geminiGenerate(prompt, { model: 'gemini-2.0-flash' });
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (e) {
        // Attempt to salvage JSON if model included extra text
        const start = jsonText.indexOf('{');
        const end = jsonText.lastIndexOf('}');
        parsed = JSON.parse(jsonText.slice(start, end + 1));
      }
      setQuestionSet(parsed);
      // initialize answers state
      setAnswers({ mcq: {}, short: {}, long: {} });
      setActiveMobileTab('chat');
    } catch (err) {
      setQuestionSet({ error: 'Failed to generate questions. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  }

  function onSelectMcq(qIdx, optionIdx) {
    setAnswers((prev) => ({ ...prev, mcq: { ...prev.mcq, [qIdx]: optionIdx } }));
  }

  function onShortChange(qIdx, text) {
    setAnswers((prev) => ({ ...prev, short: { ...prev.short, [qIdx]: text } }));
  }

  function onLongChange(qIdx, text) {
    setAnswers((prev) => ({ ...prev, long: { ...prev.long, [qIdx]: text } }));
  }

  async function submitForGrading() {
    if (!questionSet) return;
    setGrading({ loading: true, result: null, error: null });
    try {
      const pdfText = await extractPdfText(pdfUrl);
      const payload = {
        questions: questionSet,
        answers,
        rubric: {
          mcq: { correct: 1 },
          short: { min: 1, max: 5 },
          long: { min: 5, max: 15 },
        },
      };
      const gradingPrompt = `You are a strict but fair grader. Using ONLY the provided PDF_TEXT and QUESTIONS, grade the ANSWERS.
Return STRICT JSON with this shape:
{
  "mcq": { "scores": number[], "total": number },
  "short": { "scores": number[], "total": number, "feedback": string[] },
  "long": { "scores": number[], "total": number, "feedback": string[] },
  "overall": {
    "total": number,
    "max": number,
    "improvements": string[],
    "strengths": string[],
    "weaknesses": string[],
    "recommendations": { "title": string, "url": string }[]
  }
}
Rules:
- MCQ: +1 for each correct, 0 otherwise.
- Short: integer 1..5; evaluate correctness, completeness, clarity.
- Long: integer 5..15; evaluate depth, structure, evidence, alignment to PDF.
- Provide actionable improvements.
- Provide at least 3 concise strengths and 3 weaknesses.
- Provide at least 3 YouTube recommendations with direct video URLs (no playlists), each with a short, descriptive title; ensure topics match weak areas.
PDF_TEXT_START\n${pdfText.slice(0, 25000)}\nPDF_TEXT_END\n
QUESTIONS_AND_ANSWERS_START\n${JSON.stringify(payload)}\nQUESTIONS_AND_ANSWERS_END`;

      const jsonText = await geminiGenerate(gradingPrompt, { model: 'gemini-2.0-flash' });
      console.log("jsonText", jsonText);
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (e) {
        const start = jsonText.indexOf('{');
        const end = jsonText.lastIndexOf('}');
        parsed = JSON.parse(jsonText.slice(start, end + 1));
      }
      setGrading({ loading: false, result: parsed, error: null });

      // Compute percentage and post activity
      try {
        const total = Number(parsed?.overall?.total || 0);
        const max = Number(parsed?.overall?.max || 0);
        const pct = max > 0 ? Math.round((total / max) * 100) : 0;
        let email = '';
        try {
          const userRaw = getCookie('bc_user');
          if (userRaw) {
            const userObj = JSON.parse(userRaw);
            email = userObj?.email || '';
          }
        } catch (_) {}
        if (email) {
          const token = getCookie('bc_token');
          const headers = { 'Content-Type': 'application/json' };
          console.log("token", token);
          if (token) headers['Authorization'] = `Bearer ${token}`;
          await fetch(`${backendUrl}/api/activity`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email, result: `${pct}%` })
          });
        }
      } catch (_) {
        // ignore activity post errors for now
      }
    } catch (err) {
      setGrading({ loading: false, result: null, error: 'Failed to grade. Please try again.' });
    }
  }

  if (!pdfUrl) {
    return (
      <div className="viewer-page">
        <div className="viewer-card">
          <p>No PDF provided.</p>
          <button className="primary" onClick={() => navigate('/uploadPDF')}>Go to upload</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`viewer-page ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <div className="viewer-header">
        <div className="viewer-title">{name || 'PDF Preview'}</div>
        <div className="viewer-actions">
          <button
            className="secondary"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <a className="secondary" href={pdfUrl} download={name || 'document.pdf'}>Download</a>
          <button className="secondary" onClick={() => navigate('/uploadPDF')}>Upload another</button>
        </div>
      </div>

      {/* Mobile tab toggles */}
      <div className="viewer-tabs">
        <button
          className={`tab ${activeMobileTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveMobileTab('chat')}
        >Chat</button>
        <button
          className={`tab ${activeMobileTab === 'pdf' ? 'active' : ''}`}
          onClick={() => setActiveMobileTab('pdf')}
        >PDF</button>
      </div>

      <div className="viewer-split">
        <section className={`chat-pane ${canShowChat ? 'show-mobile' : 'hide-mobile'}`}>
          <div className="chat-surface">
            {!questionSet && (
              <div className="question-cta">
                <p className="hint">Generate questions from this PDF</p>
                <button className="primary" onClick={generateQuestions} disabled={isGenerating}>
                  {isGenerating ? 'Generating…' : 'Generate questions'}
                </button>
              </div>
            )}

            {questionSet && !questionSet.error && (
              <div className="question-list">
                <div className="q-toolbar">
                  <button className="secondary" onClick={() => { setGrading({ loading: false, result: null, error: null }); generateQuestions(); }} disabled={isGenerating}>
                    {isGenerating ? 'Generating…' : 'Generate new questions'}
                  </button>
                </div>
                <div className="q-section">
                  <h3>Multiple choice</h3>
                  {(questionSet.mcqs || []).map((q, idx) => (
                    <div key={`mcq-${idx}`} className="q-card">
                      <div className="q-text">{idx + 1}. {q.question}</div>
                      <div className="q-options">
                        {(q.options || []).map((opt, i) => (
                          <label key={`opt-${i}`} className="q-option">
                            <input
                              type="radio"
                              name={`mcq-${idx}`}
                              checked={answers.mcq[idx] === i}
                              onChange={() => onSelectMcq(idx, i)}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="q-section">
                  <h3>Short answer</h3>
                  {(questionSet.short || []).map((q, idx) => (
                    <div key={`short-${idx}`} className="q-card">
                      <div className="q-text">{idx + 1}. {q.question}</div>
                      <textarea
                        className="q-input"
                        rows={2}
                        placeholder="Your answer"
                        value={answers.short[idx] || ''}
                        onChange={(e) => onShortChange(idx, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="q-section">
                  <h3>Long answer</h3>
                  {Array.isArray(questionSet.long) ? (
                    questionSet.long.map((q, idx) => (
                      <div key={`long-${idx}`} className="q-card">
                        <div className="q-text">{q.question}</div>
                        <textarea
                          className="q-input"
                          rows={6}
                          placeholder="Your answer"
                          value={answers.long[idx] || ''}
                          onChange={(e) => onLongChange(idx, e.target.value)}
                        />
                      </div>
                    ))
                  ) : (
                    questionSet.long ? (
                      <div className="q-card">
                        <div className="q-text">{questionSet.long.question}</div>
                        <textarea
                          className="q-input"
                          rows={6}
                          placeholder="Your answer"
                          value={answers.long[0] || ''}
                          onChange={(e) => onLongChange(0, e.target.value)}
                        />
                      </div>
                    ) : null
                  )}
                </div>

                <div className="q-actions">
                  <button className="primary" onClick={submitForGrading} disabled={grading.loading}>
                    {grading.loading ? 'Grading…' : 'Submit for grading'}
                  </button>
                </div>
              </div>
            )}

            {questionSet && questionSet.error && (
              <div className="question-error">{questionSet.error}</div>
            )}

            {grading.result && (
              <div className="grading-results">
                <h3>Results</h3>
                <div className="scores">
                  <div>MCQ: {grading.result.mcq?.total ?? 0}</div>
                  <div>Short: {grading.result.short?.total ?? 0}</div>
                  <div>Long: {grading.result.long?.total ?? 0}</div>
                  <div>Overall: {grading.result.overall?.total ?? 0} / {grading.result.overall?.max ?? 0}</div>
                </div>
                {Array.isArray(grading.result.overall?.improvements) && grading.result.overall.improvements.length > 0 && (
                  <div className="improvements">
                    <h4>What can be improved</h4>
                    <ul>
                      {grading.result.overall.improvements.map((it, i) => (
                        <li key={`imp-${i}`}>{it}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(Array.isArray(grading.result.overall?.strengths) && grading.result.overall.strengths.length > 0) && (
                  <div className="strengths">
                    <h4>Strengths</h4>
                    <ul>
                      {grading.result.overall.strengths.map((it, i) => (
                        <li key={`str-${i}`}>{it}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(Array.isArray(grading.result.overall?.weaknesses) && grading.result.overall.weaknesses.length > 0) && (
                  <div className="weaknesses">
                    <h4>Weaknesses</h4>
                    <ul>
                      {grading.result.overall.weaknesses.map((it, i) => (
                        <li key={`weak-${i}`}>{it}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(Array.isArray(grading.result.overall?.recommendations) && grading.result.overall.recommendations.length > 0) && (
                  <div className="recommendations">
                    <h4>Recommended videos</h4>
                    <ul>
                      {grading.result.overall.recommendations.map((r, i) => (
                        <li key={`rec-${i}`}>
                          <a className="link" href={r.url} target="_blank" rel="noreferrer">{r.title || r.url}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className={`pdf-pane ${canShowPdf ? 'show-mobile' : 'hide-mobile'}`}>
          <div className="viewer-frame">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer fileUrl={pdfUrl} />
            </Worker>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PdfViewer;


