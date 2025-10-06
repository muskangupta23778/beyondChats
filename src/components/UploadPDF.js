import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UploadPDF.css';

function UploadPDF() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [selectedFileName, setSelectedFileName] = useState('');

  function handleChooseFile() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      return;
    }
    setSelectedFileName(file.name);
    const blobUrl = URL.createObjectURL(file);
    navigate('/viewPDF', { state: { pdfUrl: blobUrl, name: file.name } });
  }

  return (
    <div className="upload-page">
      <div className="upload-card">
        <h1 className="upload-title">Upload a PDF</h1>
        <p className="upload-subtitle">Select a PDF to preview it instantly.</p>

        <div className="dropzone" onClick={handleChooseFile} role="button" tabIndex={0}>
          <div className="dropzone-inner">
            <div className="dropzone-icon">📄</div>
            <div className="dropzone-text">
              <strong>Click to choose</strong> or drag and drop
              <div className="muted">PDF up to 10MB</div>
            </div>
          </div>
        </div>

        {selectedFileName ? <div className="file-name">Selected: {selectedFileName}</div> : null}

        <div className="actions">
          <button className="primary" onClick={handleChooseFile}>Choose PDF</button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

export default UploadPDF;


