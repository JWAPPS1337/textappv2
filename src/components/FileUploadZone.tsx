'use client';

import { useState, useCallback } from 'react';

type FileUploadZoneProps = {
  uploadedFiles: File[];
  onFileUpload: (files: File[]) => void;
  onFileRemove: (index: number) => void;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

export default function FileUploadZone({ 
  uploadedFiles, 
  onFileUpload, 
  onFileRemove 
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFiles = useCallback((files: File[]) => {
    if (files.length === 0) return [];
    
    setError(null);
    const validFiles: File[] = [];
    
    for (const file of files) {
      // Check if the file is a PDF
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are supported.');
        continue;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds the 5MB size limit.`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    return validFiles;
  }, []);

  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    
    const filesArray = Array.from(fileList);
    const validFiles = validateFiles(filesArray);
    
    if (validFiles.length > 0) {
      onFileUpload(validFiles);
    }
  }, [onFileUpload, validateFiles]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  }, [processFiles]);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div style={{ padding: '8px' }}>
      <div 
        className={`sunken-panel ${isDragging ? 'active' : ''}`}
        style={{ 
          padding: '16px', 
          margin: '8px 0',
          cursor: 'pointer',
          textAlign: 'center'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div>
          <img 
            src="https://win98icons.alexmeub.com/icons/png/file_pdf-0.png" 
            alt="PDF icon" 
            style={{ width: '32px', height: '32px', margin: '0 auto 8px auto', display: 'block' }}
          />
          <p style={{ margin: '8px 0', fontSize: '14px' }}>
            Drag and drop your PDF files here, or
          </p>
          <div className="field-row" style={{ justifyContent: 'center' }}>
            <button 
              onClick={() => {
                const input = document.getElementById('file-upload') as HTMLInputElement;
                if (input) input.click();
              }}
              style={{ margin: '0 auto' }}
            >
              Browse files...
            </button>
            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>
          <p style={{ margin: '8px 0', fontSize: '12px', color: '#666' }}>
            PDF files only (max 5MB per file)
          </p>
        </div>
      </div>
      
      {error && (
        <div className="status-bar" style={{ margin: '8px 0', padding: '4px', color: 'red' }}>
          {error}
        </div>
      )}
      
      {uploadedFiles.length > 0 && (
        <div>
          <div className="status-bar" style={{ margin: '8px 0', padding: '4px' }}>
            Uploaded Files: {uploadedFiles.length}/10
          </div>
          <div className="sunken-panel" style={{ maxHeight: '200px', overflow: 'auto' }}>
            <ul className="tree-view">
              {uploadedFiles.map((file, index) => (
                <li key={`${file.name}-${index}`} style={{ padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img
                      src="https://win98icons.alexmeub.com/icons/png/file_pdf-0.png"
                      alt="PDF file"
                      style={{ width: '16px', height: '16px', marginRight: '8px' }}
                    />
                    <div>
                      <span style={{ fontSize: '14px', display: 'block', fontWeight: 'bold' }}>{file.name}</span>
                      <span style={{ fontSize: '12px', color: '#666' }}>{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onFileRemove(index)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 