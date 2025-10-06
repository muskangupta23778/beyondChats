import logo from './logo.svg';
import Login from './components/Login';
import UploadPDF from './components/UploadPDF';
import PdfViewer from './components/PdfViewer';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { generateResponse } from './services/geminiClient';

function App() {
  // const response = generateResponse('what is 5 factorial. Also explain it in a way that is easy to understand');
  // <h1>{response}</h1>
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/uploadPDF" element={<UploadPDF />} />
        <Route path="/viewPDF" element={<PdfViewer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
