import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateResponse(input, { model = 'gemini-2.0-flash' } = {}) {
  if (!apiKey) throw new Error('Missing REACT_APP_GEMINI_API_KEY');
  if (!input || typeof input !== 'string') throw new Error('Input must be a non-empty string');

  const modelClient = genAI.getGenerativeModel({ model });
  const result = await modelClient.generateContent(input);
  const text = result.response.text();
  console.log(text);
  return text;
}

export default { generateResponse };


