import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import './PdfViewer.css';
import './Dashboard.css';
import './ChatWithPdf.css';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { generateResponse as geminiGenerate } from '../services/geminiClient';

function loadChatsFromStorage() {
  try {
    const raw = localStorage.getItem('bc_chats');
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

function saveChatsToStorage(chats) {
  try { localStorage.setItem('bc_chats', JSON.stringify(chats)); } catch (_) {}
}

function generateTitleFromFirstMessage(messages) {
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser) return 'New chat';
  const t = firstUser.text.trim();
  return t.length > 28 ? t.slice(0, 28) + '…' : (t || 'New chat');
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br/>');
}

function formatAssistantMessage(text) {
  // Escape everything first
  let safe = escapeHtml(text);
  // Remove markdown bold markers around citation labels if present
  safe = safe.replace(/\*\*(According to p\.?\s*\d+\:)\*\*/gi, '$1');
  // Bold all citation labels: According to p. <num>:
  safe = safe.replace(/(According to p\.?\s*\d+\:)/gi, '<strong>$1</strong>');
  // If model provides trailing location like (p. N, lines X–Y), keep as-is (already escaped)
  return safe;
}

async function extractPdfText(url) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  const loadingTask = pdfjsLib.getDocument({ url });
  const pdf = await loadingTask.promise;
  let fullText = '';
  const pages = [];
  const maxPages = Math.min(pdf.numPages, 30);
  for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str).join(' ');
    fullText += `\n\n[Page ${pageNum}]\n${strings}`;
    pages.push({ page: pageNum, text: strings });
    if (fullText.length > 80000) break;
  }
  return { fullText, pages };
}

function buildConversationTranscript(messages, maxTurns = 10) {
  const dialog = messages.filter(m => m.role === 'user' || m.role === 'assistant');
  const recent = dialog.slice(-maxTurns);
  return recent.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
}

async function runChain(messages, context, summary) {
  const question = messages[messages.length - 1]?.text || '';
  const { pdfUrl } = context || {};
  if (!pdfUrl) return 'No PDF provided.';
  const { fullText, pages } = await extractPdfText(pdfUrl);
  const convo = buildConversationTranscript(messages, 10);
  const convoSummary = summary ? `Conversation summary (for continuity):\n${summary}\n\n` : '';
  const pagesBlock = pages
    .slice(0, 30)
    .map(p => `Page ${p.page}:\n${p.text.slice(0, 2000)}`)
    .join('\n\n');
  const prompt = `You are a helpful assistant that MUST answer strictly using ONLY the provided PDF text. If the answer is not present, reply exactly: "I cannot answer from the provided PDF."\n\n${convoSummary}Conversation so far (most recent turns):\n${convo}\n\nPDF_PAGES (use these to locate citations with page numbers):\n${pagesBlock}\n\nRules for your answer:\n- Use ONLY information from the PDF_PAGES above.\n- Include 1–3 citations with page numbers and 2–3 line quotes.\n- Make the citation label bold using Markdown, like: **According to p. <number>:** '<line1>\n<line2>\n<line3>'\n- After each bold citation label, append the location in brackets: (p. <number>, lines <start>–<end>). Example: **According to p. 12:** '...\n...' (p. 12, lines 14–16)\n- If multiple claims come from different pages, include multiple citations.\n- If the question cannot be answered with the PDF, say: "I cannot answer from the provided PDF."\n\nUser question: ${question}\n\nNow provide the answer followed by the citations:`;
  const response = await geminiGenerate(prompt, { model: 'gemini-2.0-flash' });
  return response?.trim() || 'No response';
}

export default function ChatWithPdf() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const pdfUrl = location.state?.pdfUrl || searchParams.get('pdf');

  const [chats, setChats] = useState(() => loadChatsFromStorage()); // {id: {id, title, messages: []}}
  const [activeId, setActiveId] = useState(() => {
    const ids = Object.keys(loadChatsFromStorage());
    return ids[0] || '';
  });

  const activeChat = useMemo(() => (activeId ? chats[activeId] : null), [activeId, chats]);
  const messages = activeChat?.messages || [{ id: 'sys', role: 'system', text: 'Ask anything about your PDF. I will help!' }];

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [summaryByChat, setSummaryByChat] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bc_chat_summaries') || '{}'); } catch { return {}; }
  });
  const endRef = useRef(null);

  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { saveChatsToStorage(chats); }, [chats]);
  useEffect(() => { try { localStorage.setItem('bc_chat_summaries', JSON.stringify(summaryByChat)); } catch {} }, [summaryByChat]);

  function createNewChat() {
    const id = `c_${Date.now()}`;
    const newChat = { id, title: 'New chat', messages: [{ id: 'sys', role: 'system', text: 'Ask anything about your PDF. I will help!' }] };
    setChats(prev => ({ ...prev, [id]: newChat }));
    setActiveId(id);
    setInput('');
  }

  function deleteChat(id) {
    setChats(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (activeId === id) setActiveId(Object.keys(chats).find(cid => cid !== id) || '');
  }

  async function sendMessage(e) {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    setInput('');

    let idToUse = activeId;
    if (!idToUse) {
      // Auto-create a new chat if none active
      const nid = `c_${Date.now()}`;
      const newChat = { id: nid, title: 'New chat', messages: [{ id: 'sys', role: 'system', text: 'Ask anything about your PDF. I will help!' }] };
      setChats(prev => ({ ...prev, [nid]: newChat }));
      setActiveId(nid);
      idToUse = nid;
    }

    const userMsg = { id: String(Date.now()), role: 'user', text: content };
    setChats(prev => ({
      ...prev,
      [idToUse]: {
        ...prev[idToUse],
        messages: [...(prev[idToUse]?.messages || []), userMsg],
        title: prev[idToUse]?.messages?.length > 1 ? prev[idToUse].title : generateTitleFromFirstMessage([userMsg])
      }
    }));

    // Greeting shortcut: respond immediately to hi/hello/hey variations
    const normalized = content.toLowerCase();
    const isGreeting = /^(hi|hello|hey|hiya|hii|helo|yo|sup)[!.\s]*$/i.test(normalized);
    if (isGreeting) {
      const botMsg = { id: String(Date.now() + 1), role: 'assistant', text: 'Hello, please let me know how can I help you with this PDF.' };
      setChats(prev => ({
        ...prev,
        [idToUse]: { ...prev[idToUse], messages: [...(prev[idToUse]?.messages || []), botMsg] }
      }));
      return;
    }

    setSending(true);
    try {
      const convo = (chats[idToUse]?.messages || []).concat(userMsg);
      const replyText = await runChain(convo, { pdfUrl }, summaryByChat[idToUse]);
      const botMsg = { id: String(Date.now() + 1), role: 'assistant', text: replyText };
      setChats(prev => ({
        ...prev,
        [idToUse]: { ...prev[idToUse], messages: [...(prev[idToUse]?.messages || []), botMsg] }
      }));
      // Optionally keep a rolling summary to stay under token limits
      const transcript = (chats[idToUse]?.messages || []).concat(userMsg, botMsg);
      const keep = transcript.filter(m => m.role === 'user' || m.role === 'assistant').slice(-12);
      const newSummary = keep.map(m => `${m.role === 'user' ? 'U' : 'A'}:${m.text}`).join(' ');
      setSummaryByChat(prev => ({ ...prev, [idToUse]: newSummary.slice(0, 2000) }));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="dashboard-page">
      <main className="dashboard-main chat-layout" style={{ display: 'grid', gridTemplateColumns: '280px 1.1fr 1fr', gap: 16 }}>
        {/* Sidebar */}
        <aside className="chat-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="primary-button" onClick={createNewChat} style={{ width: '100%' }}>＋ New chat</button>
          </div>
          <div style={{ overflow: 'auto', background: '#fff', border: '1px solid #eef0f3', borderRadius: 12 }}>
            {Object.values(chats).length === 0 ? (
              <div style={{ padding: 12, color: '#6b7280' }}>No chats yet</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 8, margin: 0, display: 'grid', gap: 6 }}>
                {Object.values(chats).sort((a, b) => (a.id < b.id ? 1 : -1)).map(c => (
                  <li key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={() => setActiveId(c.id)}
                      className="secondary-button"
                      style={{ textAlign: 'left', padding: '10px 12px', background: activeId === c.id ? '#eef2ff' : '#fff' }}
                    >
                      {c.title || 'Untitled'}
                    </button>
                    <button className="ghost-button" onClick={() => deleteChat(c.id)}>🗑</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Chat pane */}
        <section className="chat-pane" style={{ display: 'flex', flexDirection: 'column', minHeight: '75vh' }}>
          <div className="chat-header" style={{ marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Chat about your PDF</h2>
            <p style={{ margin: 0, color: '#6b7280' }}>Your uploaded document is visible on the right</p>
          </div>

          <div className="chat-thread" style={{ flex: 1, overflow: 'auto', display: 'grid', gap: 10, padding: 8, background: '#ffffff', border: '1px solid #eef0f3', borderRadius: 12 }}>
            {messages.map((m) => (
              <div key={m.id} className={`chat-row ${m.role}`} style={{ justifySelf: m.role === 'user' ? 'end' : 'start', maxWidth: '80%' }}>
                <div className={`chat-bubble ${m.role}`} style={{ background: m.role === 'user' ? 'linear-gradient(135deg, #8b5cf6, #60a5fa)' : '#f3f4f6', color: m.role === 'user' ? '#fff' : '#111827', padding: '10px 12px', borderRadius: 12, boxShadow: '0 6px 14px rgba(16,24,40,0.08)' }}>
                  {m.role === 'assistant' ? (
                    <span dangerouslySetInnerHTML={{ __html: formatAssistantMessage(m.text) }} />
                  ) : (
                    <span>{m.text}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form onSubmit={sendMessage} className="chat-input" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 10 }}>
            <input
              className="text-input"
              placeholder="Ask a question about the PDF..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="primary-button" disabled={sending || !input.trim()}>
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
          <div className="chat-footer-actions" style={{ marginTop: 8 }}>
            <button className="secondary-button" onClick={() => navigate(-1)}>⬅ Back</button>
          </div>
        </section>

        {/* PDF pane */}
        <aside className="pdf-pane chat-pdf-pane" style={{ minHeight: '75vh' }}>
          {!pdfUrl ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h3 className="empty-title">No PDF specified</h3>
              <p className="empty-message">Open this with a pdf query parameter, e.g., /chat?pdf=/path/to.pdf</p>
            </div>
          ) : (
            <iframe title="PDF Preview" src={pdfUrl} className="pdf-frame" style={{ width: '100%', height: '100%', border: '1px solid #eef0f3', borderRadius: 12, background: '#fff' }} />
          )}
        </aside>
      </main>
    </div>
  );
}


