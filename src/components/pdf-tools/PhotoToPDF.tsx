'use client';

import { useState, useRef, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { jsPDF } from 'jspdf';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_PHOTOS = 10;

export default function PhotoToPDF() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
  const [outputFileName, setOutputFileName] = useState('Photo_Document.pdf');
  const [activeCamera, setActiveCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'environment' | 'user'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Handle camera setup/teardown
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const setupCamera = async () => {
      try {
        // Get user media
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraMode },
          audio: false
        });
        
        // Set video source
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access camera. Please ensure camera permissions are granted.');
        setActiveCamera(false);
      }
    };
    
    // Setup camera if active
    if (activeCamera) {
      setupCamera();
    }
    
    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeCamera, cameraMode]);
  
  const handleCameraToggle = () => {
    setActiveCamera(prev => !prev);
  };
  
  const handleCameraModeToggle = () => {
    setCameraMode(prev => prev === 'environment' ? 'user' : 'environment');
  };
  
  const capturePhoto = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert the canvas to a data URL and add to photos
    const photoDataUrl = canvas.toDataURL('image/jpeg');
    
    addPhoto(photoDataUrl);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length === 0) return;
    
    // Validate file types
    const invalidFiles = selectedFiles.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('Only image files are supported.');
      return;
    }
    
    // Validate file sizes
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setError(`Some images exceed the ${MAX_FILE_SIZE / (1024 * 1024)}MB size limit.`);
      return;
    }
    
    // Check if adding these photos would exceed the limit
    if (photos.length + selectedFiles.length > MAX_PHOTOS) {
      setError(`Maximum of ${MAX_PHOTOS} photos allowed.`);
      return;
    }
    
    // Process each selected image file
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          addPhoto(result);
        }
      };
      reader.readAsDataURL(file);
    });
  };
  
  const addPhoto = (dataUrl: string) => {
    setPhotos(prev => {
      if (prev.length >= MAX_PHOTOS) {
        setError(`Maximum of ${MAX_PHOTOS} photos allowed.`);
        return prev;
      }
      return [...prev, dataUrl];
    });
  };
  
  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleClearAll = () => {
    setPhotos([]);
  };
  
  const handleConvert = async () => {
    if (photos.length === 0) {
      setError('No photos to convert.');
      return;
    }
    
    setIsConverting(true);
    setConversionStatus('converting');
    setError(null);
    
    try {
      // In a real implementation, this would process the photos
      // Here we'll simulate the conversion with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Normally, this would generate PDF from photos
      mockConvertPhotosToPDF(photos, outputFileName);
      
      setConversionStatus('success');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setConversionStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Conversion error:', error);
      setError('An error occurred while converting photos. Please try again.');
      setConversionStatus('error');
    } finally {
      setIsConverting(false);
    }
  };
  
  // This function converts photos to PDF using jsPDF directly
  const mockConvertPhotosToPDF = async (photoDataUrls: string[], outputName: string) => {
    try {
      console.log('Starting PDF generation with jsPDF...');
      
      // Create a new jsPDF instance
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter'
      });
      
      // Load each image as promise
      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = (err) => reject(err);
          img.src = url;
          img.crossOrigin = 'Anonymous';
        });
      };
      
      // Add each image to the PDF
      for (let i = 0; i < photoDataUrls.length; i++) {
        // Add a new page for images after the first one
        if (i > 0) {
          doc.addPage();
        }
        
        try {
          const img = await loadImage(photoDataUrls[i]);
          
          // Get page dimensions (in inches)
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          
          // Calculate image dimensions to fit within page while maintaining aspect ratio
          const margin = 0.5; // 0.5 inch margin
          const maxWidth = pageWidth - 2 * margin;
          const maxHeight = pageHeight - 2 * margin;
          
          const imgRatio = img.width / img.height;
          let imgWidth = maxWidth;
          let imgHeight = imgWidth / imgRatio;
          
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = imgHeight * imgRatio;
          }
          
          // Center the image on the page
          const xOffset = (pageWidth - imgWidth) / 2;
          const yOffset = (pageHeight - imgHeight) / 2;
          
          // Add the image to the page
          doc.addImage(
            photoDataUrls[i], 
            'JPEG', 
            xOffset, 
            yOffset, 
            imgWidth, 
            imgHeight
          );
          
          console.log(`Added image ${i+1} of ${photoDataUrls.length}`);
        } catch (imgError) {
          console.error(`Error processing image ${i+1}:`, imgError);
        }
      }
      
      // Save the PDF
      doc.save(outputName);
      console.log('PDF saved successfully');
      
    } catch (error) {
      console.error('Error generating PDF from photos:', error);
      throw new Error('Failed to convert photos to PDF');
    }
  };
  
  return (
    <div>
      <fieldset style={{ padding: '8px', marginBottom: '16px' }}>
        <legend>Take or Upload Photos</legend>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
          <button 
            onClick={handleCameraToggle}
            style={{ minWidth: '120px', padding: '8px' }}
          >
            {activeCamera ? 'Disable Camera' : 'Enable Camera'}
          </button>
          
          <label htmlFor="photo-upload" style={{ display: 'block' }}>
            <button 
              onClick={() => document.getElementById('photo-upload')?.click()}
              style={{ minWidth: '120px', padding: '8px' }}
            >
              Upload Photos
            </button>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              multiple
              style={{ display: 'none' }}
            />
          </label>
        </div>
        
        {activeCamera && (
          <div className="sunken-panel" style={{ marginBottom: '16px', padding: '8px' }}>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', backgroundColor: '#000' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            
            <div className="field-row" style={{ justifyContent: 'center', gap: '8px' }}>
              <button onClick={capturePhoto} style={{ minWidth: '100px' }}>
                Capture Photo
              </button>
              <button onClick={handleCameraModeToggle} style={{ minWidth: '100px' }}>
                Switch Camera
              </button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="status-bar" style={{ margin: '8px 0', padding: '4px', color: 'red' }}>
            {error}
          </div>
        )}
        
        {photos.length > 0 && (
          <div>
            <div className="status-bar" style={{ margin: '8px 0', padding: '4px' }}>
              Photos: {photos.length}/{MAX_PHOTOS}
              <button 
                onClick={handleClearAll}
                style={{ marginLeft: '8px', fontSize: '12px' }}
              >
                Clear All
              </button>
            </div>
            
            <div className="sunken-panel" style={{ padding: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                {photos.map((photo, index) => (
                  <div key={index} style={{ position: 'relative', border: '1px solid #ccc', padding: '4px' }}>
                    <img 
                      src={photo} 
                      alt={`Photo ${index + 1}`} 
                      style={{ width: '100%', height: '100px', objectFit: 'cover' }} 
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      style={{ position: 'absolute', top: '4px', right: '4px', padding: '2px 4px', fontSize: '10px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="field-row" style={{ marginBottom: '8px' }}>
              <label htmlFor="photoFileName" style={{ minWidth: '120px' }}>Output filename:</label>
              <input
                id="photoFileName"
                type="text"
                value={outputFileName}
                onChange={(e) => setOutputFileName(e.target.value)}
                style={{ flexGrow: 1 }}
              />
            </div>
            
            <div className="field-row" style={{ justifyContent: 'center', marginTop: '16px' }}>
              <button
                onClick={handleConvert}
                disabled={isConverting || photos.length === 0}
                style={{ minWidth: '120px', padding: '8px' }}
              >
                {isConverting ? 'Converting...' : 'Convert to PDF'}
              </button>
            </div>
            
            {conversionStatus === 'success' && (
              <div className="status-bar" style={{ margin: '8px 0', padding: '4px', color: 'green' }}>
                Photos converted to PDF successfully! Your PDF has been downloaded.
              </div>
            )}
            
            {conversionStatus === 'error' && (
              <div className="status-bar" style={{ margin: '8px 0', padding: '4px', color: 'red' }}>
                Failed to convert photos to PDF. Please try again.
              </div>
            )}
          </div>
        )}
      </fieldset>
      
      {/* Hidden div for PDF generation */}
      <div ref={previewRef} style={{ display: 'none' }} />
    </div>
  );
} 