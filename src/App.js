import logo from './logo.svg';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import Navigation from './components/Navigation';
import UploadPDF from './components/UploadPDF';
import PdfViewer from './components/PdfViewer';
import './App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { generateResponse } from './services/geminiClient';

function Shell() {
  const location = useLocation();
  const path = location.pathname || '';
  const hideNav = path.startsWith('/login') || path.startsWith('/user') || path.startsWith('/admin');
  return (
    <>
      {!hideNav && <Navigation />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/uploadPDF" element={<UploadPDF />} />
        <Route path="/viewPDF" element={<PdfViewer />} />
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
