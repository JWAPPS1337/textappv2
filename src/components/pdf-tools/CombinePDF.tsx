'use client';

import { useState, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file

export default function CombinePDF() {
  const [files, setFiles] = useState<File[]>([]);
  const [isCombining, setIsCombining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [combinationStatus, setCombinationStatus] = useState<'idle' | 'combining' | 'success' | 'error'>('idle');
  const [outputFileName, setOutputFileName] = useState('Combined_Document.pdf');

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length === 0) return;
    
    // Validate file types
    const invalidFiles = selectedFiles.filter(file => file.type !== 'application/pdf');
    if (invalidFiles.length > 0) {
      setError('Only PDF files are supported.');
      return;
    }
    
    // Validate file sizes
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the ${MAX_FILE_SIZE / (1024 * 1024)}MB size limit.`);
      return;
    }
    
    setFiles(prev => [...prev, ...selectedFiles]);
  }, []);

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setFiles([]);
  };

  const handleCombine = async () => {
    if (files.length < 2) {
      setError('You need at least 2 PDF files to combine.');
      return;
    }
    
    setIsCombining(true);
    setCombinationStatus('combining');
    setError(null);
    
    try {
      // In a real implementation, this would process the PDFs
      // Here we'll simulate the combination with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Normally, this would be a server-side operation to combine PDFs
      mockCombinePDFs(files, outputFileName);
      
      setCombinationStatus('success');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setCombinationStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Combination error:', error);
      setError('An error occurred while combining PDFs. Please try again.');
      setCombinationStatus('error');
    } finally {
      setIsCombining(false);
    }
  };

  // This function simulates combining PDFs
  // In a real implementation, the server would handle this
  const mockCombinePDFs = async (pdfFiles: File[], outputName: string) => {
    try {
      console.log('Starting PDF merge with', pdfFiles.length, 'files');
      
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // Add pages from each PDF
      for (const file of pdfFiles) {
        try {
          console.log('Processing file:', file.name);
          const fileData = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(fileData);
          
          // Get page count
          const pageIndices = pdfDoc.getPageIndices();
          console.log(`File ${file.name} has ${pageIndices.length} pages`);
          
          // Copy pages
          const pages = await mergedPdf.copyPages(pdfDoc, pageIndices);
          pages.forEach(page => mergedPdf.addPage(page));
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          throw new Error(`Failed to process ${file.name}. Make sure it's a valid PDF.`);
        }
      }
      
      // Save the merged PDF
      console.log('Saving merged PDF...');
      const mergedPdfBytes = await mergedPdf.save();
      const mergedPdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      
      // Download the merged PDF
      const url = URL.createObjectURL(mergedPdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = outputName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('PDF merge completed successfully');
    } catch (error) {
      console.error('Error combining PDFs:', error);
      throw new Error('Failed to combine PDFs');
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <fieldset style={{ padding: '8px', marginBottom: '16px' }}>
        <legend>Upload PDFs to Combine</legend>
        
        <div style={{ marginBottom: '16px' }}>
          <div className="sunken-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <p style={{ marginBottom: '8px' }}>
              Upload PDFs to combine
            </p>
            <div className="field-row" style={{ justifyContent: 'center' }}>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                multiple
                style={{ marginBottom: '8px' }}
              />
            </div>
            <p style={{ fontSize: '12px', color: '#666' }}>
              PDF files only (Max 10MB per file)
            </p>
          </div>
        </div>
        
        {error && (
          <div className="status-bar" style={{ margin: '8px 0', padding: '4px', color: 'red' }}>
            {error}
          </div>
        )}
        
        {files.length > 0 && (
          <div>
            <div className="status-bar" style={{ margin: '8px 0', padding: '4px' }}>
              Selected Files: {files.length}
              <button 
                onClick={handleClearAll}
                style={{ marginLeft: '8px', fontSize: '12px' }}
              >
                Clear All
              </button>
            </div>
            
            <div className="sunken-panel" style={{ maxHeight: '200px', overflow: 'auto', marginBottom: '16px' }}>
              <ul className="tree-view">
                {files.map((file, index) => (
                  <li key={index} style={{ padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      onClick={() => handleRemoveFile(index)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="field-row" style={{ marginBottom: '8px' }}>
              <label htmlFor="combinedFileName" style={{ minWidth: '120px' }}>Output filename:</label>
              <input
                id="combinedFileName"
                type="text"
                value={outputFileName}
                onChange={(e) => setOutputFileName(e.target.value)}
                style={{ flexGrow: 1 }}
              />
            </div>
            
            <div className="field-row" style={{ justifyContent: 'center', marginTop: '16px' }}>
              <button
                onClick={handleCombine}
                disabled={isCombining || files.length < 2}
                style={{ minWidth: '120px', padding: '8px' }}
              >
                {isCombining ? 'Combining...' : 'Combine PDFs'}
              </button>
            </div>
            
            {combinationStatus === 'success' && (
              <div className="status-bar" style={{ margin: '8px 0', padding: '4px', color: 'green' }}>
                PDF files combined successfully! Your combined PDF has been downloaded.
              </div>
            )}
            
            {combinationStatus === 'error' && (
              <div className="status-bar" style={{ margin: '8px 0', padding: '4px', color: 'red' }}>
                Failed to combine PDFs. Please try again.
              </div>
            )}
          </div>
        )}
      </fieldset>
    </div>
  );
} 