import React, { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './UploadPDF.css';

function UploadPDF() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  function handleChooseFile() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  const handleFileChange = useCallback((file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      return;
    }
    setSelectedFileName(file.name);
    setIsUploading(true);
    
    // Simulate upload delay for better UX
    setTimeout(() => {
      const blobUrl = URL.createObjectURL(file);
      navigate('/viewPDF', { state: { pdfUrl: blobUrl, name: file.name } });
      setIsUploading(false);
    }, 800);
  }, [navigate]);

  function onFileChange(e) {
    const file = e.target.files && e.target.files[0];
    handleFileChange(file);
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  }, [handleFileChange]);

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-card">
          <div className="upload-header">
            <div className="upload-icon">📚</div>
            <h1 className="upload-title">Upload Your PDF</h1>
            <p className="upload-subtitle">
              Transform your documents into interactive learning experiences
            </p>
          </div>

          <div 
            className={`dropzone ${isDragOver ? 'drag-over' : ''} ${selectedFileName ? 'has-file' : ''}`}
            onClick={handleChooseFile}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
          >
            <div className="dropzone-inner">
              <div className="dropzone-icon">
                {isUploading ? (
                  <div className="upload-spinner"></div>
                ) : selectedFileName ? (
                  <div className="file-icon">✓</div>
                ) : (
                  <div className="upload-icon-large">📄</div>
                )}
              </div>
              <div className="dropzone-content">
                {isUploading ? (
                  <div className="uploading-text">
                    <strong>Processing your PDF...</strong>
                    <div className="muted">This will just take a moment</div>
                  </div>
                ) : selectedFileName ? (
                  <div className="file-selected">
                    <strong>Ready to analyze!</strong>
                    <div className="file-name">{selectedFileName}</div>
                    <div className="muted">Click to choose a different file</div>
                  </div>
                ) : (
                  <div className="dropzone-text">
                    <strong>Click to browse</strong> or drag and drop your PDF here
                    <div className="muted">Supports PDF files up to 10MB</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="upload-features">
            <div className="feature">
              <div className="feature-icon">🤖</div>
              <div className="feature-text">
                <strong>AI-Powered Analysis</strong>
                <div className="muted">Generate questions and get instant feedback</div>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">📊</div>
              <div className="feature-text">
                <strong>Smart Grading</strong>
                <div className="muted">Get detailed insights and recommendations</div>
              </div>
            </div>
            <div className="feature">
              <div className="feature-icon">🎯</div>
              <div className="feature-text">
                <strong>Interactive Learning</strong>
                <div className="muted">Chat with your document and learn better</div>
              </div>
            </div>
          </div>

          <div className="upload-actions">
            <button 
              className={`primary-btn ${isUploading ? 'loading' : ''}`} 
              onClick={handleChooseFile}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="btn-spinner"></div>
                  Processing...
                </>
              ) : (
                'Choose PDF File'
              )}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={onFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}

export default UploadPDF;


