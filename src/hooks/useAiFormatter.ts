import { useState } from 'react';
import axios from 'axios';
import { TemplateType } from '@/components/DocumentWorkspace';

interface UseAiFormatterReturn {
  formatWithAi: (text: string, template: TemplateType) => Promise<string>;
  isFormatting: boolean;
  error: string | null;
}

export default function useAiFormatter(): UseAiFormatterReturn {
  const [isFormatting, setIsFormatting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatWithAi = async (text: string, template: TemplateType): Promise<string> => {
    if (!text || text.trim() === '') {
      setError('Please provide text to format');
      return text;
    }

    setIsFormatting(true);
    setError(null);

    try {
      const response = await axios.post('/api/ai/route', {
        text,
        template
      });

      setIsFormatting(false);
      return response.data.formattedText;
    } catch (err) {
      setIsFormatting(false);
      
      // Extract error message
      let errorMessage = 'Failed to format text with AI';
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
      console.error('AI formatting error:', err);
      
      // Return the original text if there's an error
      return text;
    }
  };

  return {
    formatWithAi,
    isFormatting,
    error
  };
} 