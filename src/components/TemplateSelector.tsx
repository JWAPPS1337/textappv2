'use client';

import { TemplateType } from './DocumentWorkspace';

type TemplateSelectorProps = {
  selectedTemplate: TemplateType;
  onTemplateChange: (template: TemplateType) => void;
};

type TemplateOption = {
  value: TemplateType;
  label: string;
  description: string;
};

export default function TemplateSelector({ selectedTemplate, onTemplateChange }: TemplateSelectorProps) {
  const templates: TemplateOption[] = [
    {
      value: 'standard',
      label: 'Standard Document',
      description: 'A simple document with basic formatting',
    },
    {
      value: 'report',
      label: 'Professional Report',
      description: 'Formatted as a business or technical report with sections',
    },
    {
      value: 'whitepaper',
      label: 'Whitepaper',
      description: 'Academic or research-focused format with citations',
    },
  ];

  return (
    <div style={{ padding: '8px' }}>
      <fieldset>
        <legend>Select template type:</legend>
        {templates.map((template) => (
          <div key={template.value} style={{ marginBottom: '8px' }}>
            <div className="field-row">
              <input
                id={`template-${template.value}`}
                type="radio"
                name="template"
                checked={selectedTemplate === template.value}
                onChange={() => onTemplateChange(template.value)}
              />
              <label htmlFor={`template-${template.value}`}>
                {template.label}
              </label>
            </div>
            <div className="field-row" style={{ marginLeft: '20px', fontSize: '12px' }}>
              {template.description}
            </div>
          </div>
        ))}
      </fieldset>
    </div>
  );
} 