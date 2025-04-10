'use client';

import { DocumentStyle } from './DocumentWorkspace';

type StyleControlsProps = {
  documentStyle: DocumentStyle;
  onStyleChange: (newStyle: Partial<DocumentStyle>) => void;
};

export default function StyleControls({ documentStyle, onStyleChange }: StyleControlsProps) {
  const fontFamilies = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
  ];

  const fontSizes = [
    '12px',
    '14px',
    '16px',
    '18px',
    '20px',
    '24px',
    '28px',
    '32px',
  ];

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ marginBottom: '15px' }}>
        <div className="field-row-stacked">
          <label htmlFor="fontFamily">Font Family</label>
          <select
            id="fontFamily"
            value={documentStyle.fontFamily}
            onChange={(e) => onStyleChange({ fontFamily: e.target.value })}
          >
            {fontFamilies.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <div className="field-row-stacked">
          <label htmlFor="fontSize">Font Size</label>
          <select
            id="fontSize"
            value={documentStyle.fontSize}
            onChange={(e) => onStyleChange({ fontSize: e.target.value })}
          >
            {fontSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <div className="field-row-stacked">
          <label htmlFor="textColor">Text Color</label>
          <input
            type="color"
            id="textColor"
            value={documentStyle.textColor}
            onChange={(e) => onStyleChange({ textColor: e.target.value })}
            style={{ width: '100%', height: '30px' }}
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <fieldset>
          <legend>Text Alignment</legend>
          <div className="field-row">
            <input
              id="alignment-left"
              type="radio"
              name="alignment"
              checked={documentStyle.alignment === 'left'}
              onChange={() => onStyleChange({ alignment: 'left' })}
            />
            <label htmlFor="alignment-left">Left</label>
          </div>
          <div className="field-row">
            <input
              id="alignment-center"
              type="radio"
              name="alignment"
              checked={documentStyle.alignment === 'center'}
              onChange={() => onStyleChange({ alignment: 'center' })}
            />
            <label htmlFor="alignment-center">Center</label>
          </div>
          <div className="field-row">
            <input
              id="alignment-right"
              type="radio"
              name="alignment"
              checked={documentStyle.alignment === 'right'}
              onChange={() => onStyleChange({ alignment: 'right' })}
            />
            <label htmlFor="alignment-right">Right</label>
          </div>
          <div className="field-row">
            <input
              id="alignment-justify"
              type="radio"
              name="alignment"
              checked={documentStyle.alignment === 'justify'}
              onChange={() => onStyleChange({ alignment: 'justify' })}
            />
            <label htmlFor="alignment-justify">Justify</label>
          </div>
        </fieldset>
      </div>
    </div>
  );
} 