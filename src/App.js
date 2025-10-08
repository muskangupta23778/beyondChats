import logo from './logo.svg';
import Login from './components/Login';
import Register from './components/Register';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import Navigation from './components/Navigation';
import UploadPDF from './components/UploadPDF';
import PdfViewer from './components/PdfViewer';
import ChatWithPdf from './components/ChatWithPdf';
import './App.css';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { generateResponse } from './services/geminiClient';

function Shell() {
  const location = useLocation();
  const path = location.pathname || '';
  const hideNav = path === '/' || path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/user') || path.startsWith('/admin');
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }
  function RequireAuth({ children }) {
    const token = getCookie('bc_token');
    if (!token) return <Navigate to="/" replace />;
    return children;
  }
  return (
    <>
      {!hideNav && <Navigation />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<RequireAuth><Register /></RequireAuth>} />
        <Route path="/user" element={<RequireAuth><UserDashboard /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
        <Route path="/uploadPDF" element={<RequireAuth><UploadPDF /></RequireAuth>} />
        <Route path="/viewPDF" element={<RequireAuth><PdfViewer /></RequireAuth>} />
        <Route path="/chat" element={<RequireAuth><ChatWithPdf /></RequireAuth>} />
      </Routes>
    </>
  );
}

function App() {
  // const response = generateResponse('what is 5 factorial. Also explain it in a way that is easy to understand');
  // <h1>{response}</h1>
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

export default App;
