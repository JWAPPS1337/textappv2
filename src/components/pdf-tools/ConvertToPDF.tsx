'use client';

import { useState } from 'react';
import { saveAs } from 'file-saver';
import mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';

type SupportedFileType = 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'txt' | 'rtf' | 'html' | 'jpg' | 'jpeg' | 'png';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export default function ConvertToPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
  const [outputFileName, setOutputFileName] = useState('');
  const [conversionProgress, setConversionProgress] = useState(0);

  const supportedFileTypes: SupportedFileType[] = [
    'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'html', 'jpg', 'jpeg', 'png'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;
    
    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File exceeds the 10MB size limit.`);
      return;
    }
    
    // Check file type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() as SupportedFileType;
    if (!supportedFileTypes.includes(fileExtension)) {
      setError(`File type .${fileExtension} is not supported. Please select a supported file type.`);
      return;
    }
    
    setFile(selectedFile);
    setOutputFileName(selectedFile.name.split('.')[0] + '.pdf');
  };

  const handleConvert = async () => {
    if (!file) return;
    
    setIsConverting(true);
    setConversionStatus('converting');
    setError(null);
    setConversionProgress(0);
    
    try {
      // For image or simple text files, we can convert directly in the browser
      if (file.type.startsWith('image/')) {
        await convertImageToPdf(file);
      } 
      // For DOCX files, we can use Mammoth.js to convert to HTML first
      else if (file.name.endsWith('.docx')) {
        await convertDocxToPdf(file);
      }
      // For more complex files like DOC, XLS, PPT, use the server API
      else {
        await convertUsingServerApi(file);
      }
      
      setConversionStatus('success');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setConversionStatus('idle');
        setConversionProgress(0);
      }, 3000);
      
    } catch (error) {
      console.error('Conversion error:', error);
      setError('An error occurred during conversion. Please try again.');
      setConversionStatus('error');
    } finally {
      setIsConverting(false);
    }
  };

  // Convert DOCX to PDF using Mammoth.js (client-side)
  const convertDocxToPdf = async (file: File) => {
    setConversionProgress(10);
    
    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    setConversionProgress(30);
    
    // Convert DOCX to HTML using Mammoth with style options
    const result = await mammoth.convertToHtml({ 
      arrayBuffer,
      // @ts-ignore - styleMap is a valid option but not in the type definitions
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        "p[style-name='List Paragraph'] => ul > li:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
      ] 
    });
    const html = result.value;
    setConversionProgress(60);
    
    // Create a styled container for the HTML content
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.padding = '40px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.lineHeight = '1.5';
    
    // Add CSS styles to preserve formatting
    const style = document.createElement('style');
    style.textContent = `
      h1, h2, h3, h4, h5, h6 { margin-top: 1em; margin-bottom: 0.5em; font-weight: bold; }
      h1 { font-size: 2em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.17em; }
      h4 { font-size: 1em; }
      h5 { font-size: 0.83em; }
      h6 { font-size: 0.67em; }
      p { margin: 1em 0; }
      ul, ol { margin: 1em 0; padding-left: 2em; }
      li { margin: 0.5em 0; }
      table { border-collapse: collapse; width: 100%; margin: 1em 0; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
      blockquote { margin: 1em 0; padding: 0.5em 1em; border-left: 3px solid #ccc; background-color: #f9f9f9; }
      img { max-width: 100%; height: auto; }
    `;
    container.appendChild(style);
    
    // Use html2pdf to convert the HTML to PDF with better options
    const opt = {
      margin: 0.5,
      filename: outputFileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait' as 'portrait',
        compress: true,
        precision: 2,
      }
    };
    
    setConversionProgress(80);
    await html2pdf().from(container).set(opt).save();
    setConversionProgress(100);
  };

  // Convert images to PDF directly in the browser
  const convertImageToPdf = async (file: File) => {
    setConversionProgress(20);
    
    // Read the image file
    const reader = new FileReader();
    
    return new Promise<void>((resolve, reject) => {
      reader.onload = async function(event) {
        try {
          if (event.target && event.target.result) {
            const img = document.createElement('img');
            img.src = event.target.result as string;
            
            img.onload = async function() {
              try {
                setConversionProgress(50);
                
                // Create a container for the image with proper styling
                const container = document.createElement('div');
                container.style.padding = '0';
                container.style.margin = '0';
                container.style.backgroundColor = 'white';
                container.style.textAlign = 'center';
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.position = 'relative';
                
                // Add image title
                const title = document.createElement('div');
                title.style.padding = '15px';
                title.style.fontFamily = 'Arial, sans-serif';
                title.style.fontSize = '16px';
                title.style.fontWeight = 'bold';
                title.style.borderBottom = '1px solid #eee';
                title.style.marginBottom = '20px';
                title.textContent = file.name.replace(/\.\w+$/, '');
                container.appendChild(title);
                
                // Set optimal dimensions for the image
                const imgContainer = document.createElement('div');
                imgContainer.style.margin = '0 auto';
                imgContainer.style.padding = '20px';
                
                // Determine if image is landscape or portrait
                const isLandscape = img.width > img.height;
                
                // Adjust image style based on orientation
                img.style.maxWidth = isLandscape ? '100%' : '80%';
                img.style.maxHeight = isLandscape ? '80vh' : '100%';
                img.style.objectFit = 'contain';
                img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                img.style.borderRadius = '4px';
                
                // Add the image to its container
                imgContainer.appendChild(img);
                container.appendChild(imgContainer);
                
                // Add metadata footer
                const footer = document.createElement('div');
                footer.style.marginTop = '20px';
                footer.style.borderTop = '1px solid #eee';
                footer.style.padding = '10px';
                footer.style.fontSize = '10px';
                footer.style.color = '#666';
                footer.style.fontFamily = 'Arial, sans-serif';
                
                // Include image details in the footer
                const date = new Date().toLocaleDateString();
                footer.textContent = `Original filename: ${file.name} • Date converted: ${date} • Original dimensions: ${img.naturalWidth}×${img.naturalHeight}px`;
                container.appendChild(footer);
                
                // Use html2pdf with optimized settings for image quality
                const opt = {
                  margin: 0,
                  filename: outputFileName,
                  image: { 
                    type: 'jpeg', 
                    quality: 0.98 
                  },
                  html2canvas: { 
                    scale: 2, 
                    useCORS: true,
                    letterRendering: true,
                    imageTimeout: 0,
                    logging: false
                  },
                  jsPDF: { 
                    unit: 'in', 
                    format: isLandscape ? 'letter' : 'letter',
                    orientation: isLandscape ? 'landscape' as 'landscape' : 'portrait' as 'portrait',
                    compress: true,
                    precision: 16,
                    putOnlyUsedFonts: true
                  }
                };
                
                setConversionProgress(80);
                await html2pdf().from(container).set(opt).save();
                setConversionProgress(100);
                resolve();
              } catch (error) {
                reject(error);
              }
            };
            
            img.onerror = function() {
              reject(new Error('Failed to load image'));
            };
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = function() {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  // For file types that can't be converted in the browser, use the server API
  const convertUsingServerApi = async (file: File) => {
    setConversionProgress(10);
    
    // Create form data to send the file
    const formData = new FormData();
    formData.append('file', file);
    
    setConversionProgress(30);
    
    // Send the file to the server for conversion
    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData,
    });
    
    setConversionProgress(60);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Conversion failed');
    }
    
    setConversionProgress(80);
    
    // If successful, download the converted file
    window.location.href = `/api/convert/download?fileId=${data.fileId}`;
    
    setConversionProgress(100);
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
        <legend>Upload File to Convert</legend>
        
        <div style={{ marginBottom: '16px' }}>
          <div className="sunken-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <p style={{ marginBottom: '8px' }}>
              Upload any file to convert to PDF
            </p>
            <div className="field-row" style={{ justifyContent: 'center' }}>
              <input
                id="file-upload"
                type="file"
                accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.html,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                style={{ marginBottom: '8px' }}
              />
            </div>
            <p style={{ fontSize: '12px', color: '#666' }}>
              Supported formats: DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF, HTML, JPG, PNG (Max 10MB)
            </p>
          </div>
        </div>
        
        {error && (
          <div className="status-bar" style={{ margin: '8px 0', padding: '4px', color: 'red' }}>
            {error}
          </div>
        )}
        
        {file && (
          <div>
            <div className="field-row" style={{ padding: '8px', border: '1px solid #ccc', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <img
                  src="https://win98icons.alexmeub.com/icons/png/file_document-0.png"
                  alt="Document file"
                  style={{ width: '24px', height: '24px', marginRight: '8px' }}
                />
                <div>
                  <span style={{ fontSize: '14px', display: 'block', fontWeight: 'bold' }}>{file.name}</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>{formatFileSize(file.size)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
              >
                Remove
              </button>
            </div>
            
            <div className="field-row" style={{ marginBottom: '8px' }}>
              <label htmlFor="outputFileName" style={{ minWidth: '100px' }}>Output filename:</label>
              <input
                id="outputFileName"
                type="text"
                value={outputFileName}
                onChange={(e) => setOutputFileName(e.target.value)}
                style={{ flexGrow: 1 }}
              />
            </div>
            
            <div className="field-row" style={{ justifyContent: 'center', marginTop: '16px' }}>
              <button
                onClick={handleConvert}
                disabled={isConverting || !file}
                style={{ minWidth: '120px', padding: '8px' }}
              >
                {isConverting ? 'Converting...' : 'Convert to PDF'}
              </button>
            </div>
            
            {isConverting && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ height: '20px', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${conversionProgress}%`, 
                      backgroundColor: '#3f8cf5',
                      transition: 'width 0.3s ease'
                    }} 
                  />
                </div>
                <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '12px' }}>
                  {conversionProgress}% complete
                </div>
              </div>
            )}
            
            {conversionStatus === 'success' && (
              <div className="status-bar" style={{ margin: '8px 0', padding: '4px', color: 'green' }}>
                Conversion successful! Your PDF has been downloaded.
              </div>
            )}
            
            {conversionStatus === 'error' && (
              <div className="status-bar" style={{ margin: '8px 0', padding: '4px', color: 'red' }}>
                Conversion failed. Please try again.
              </div>
            )}
          </div>
        )}
      </fieldset>
    </div>
  );
} 