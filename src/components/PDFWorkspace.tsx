'use client';

import { useState } from 'react';
import ConvertToPDF from './pdf-tools/ConvertToPDF';
import CombinePDF from './pdf-tools/CombinePDF';
import PhotoToPDF from './pdf-tools/PhotoToPDF';

type ToolType = 'convert' | 'combine' | 'photo';

export default function PDFWorkspace() {
  const [selectedTool, setSelectedTool] = useState<ToolType>('convert');

  const renderTool = () => {
    switch (selectedTool) {
      case 'convert':
        return <ConvertToPDF />;
      case 'combine':
        return <CombinePDF />;
      case 'photo':
        return <PhotoToPDF />;
      default:
        return <ConvertToPDF />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="window">
        <div className="title-bar">
          <div className="title-bar-text">Select Tool</div>
        </div>
        <div className="window-body" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => setSelectedTool('convert')}
              className={selectedTool === 'convert' ? 'active' : ''}
              style={{ minWidth: '120px', padding: '8px' }}
            >
              Convert to PDF
            </button>
            <button
              onClick={() => setSelectedTool('combine')}
              className={selectedTool === 'combine' ? 'active' : ''}
              style={{ minWidth: '120px', padding: '8px' }}
            >
              Combine PDFs
            </button>
            <button
              onClick={() => setSelectedTool('photo')}
              className={selectedTool === 'photo' ? 'active' : ''}
              style={{ minWidth: '120px', padding: '8px' }}
            >
              Photo to PDF
            </button>
          </div>
        </div>
      </div>
      
      <div className="window">
        <div className="title-bar">
          <div className="title-bar-text">
            {selectedTool === 'convert' && 'Convert to PDF'}
            {selectedTool === 'combine' && 'Combine PDFs'}
            {selectedTool === 'photo' && 'Photo to PDF'}
          </div>
        </div>
        <div className="window-body" style={{ padding: '16px' }}>
          {renderTool()}
        </div>
      </div>
    </div>
  );
} 