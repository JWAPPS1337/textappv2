import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const { text, template } = await req.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text content is required' }, 
        { status: 400 }
      );
    }

    // Get API key from environment variable
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is not configured' }, 
        { status: 500 }
      );
    }

    // Construct prompt based on the template type
    let prompt = '';
    
    switch (template) {
      case 'report':
        prompt = `Format the following text as a professional business or technical report. Add appropriate headings, organize content into logical sections, and improve the formatting and structure:

${text}`;
        break;
      case 'whitepaper':
        prompt = `Format the following text as an academic or research whitepaper. Add appropriate headings, organize content into logical sections, improve the formatting and include citations:

${text}`;
        break;
      default: // standard
        prompt = `Format the following text into a clear, well-structured document with appropriate paragraphs:

${text}`;
    }

    // Call the Deepseek API
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a document formatting assistant. Your job is to improve the structure, organization, and formatting of text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Extract the response text from the API response
    const formattedText = response.data.choices[0].message.content;

    return NextResponse.json({ formattedText });
  } catch (error) {
    console.error('AI processing error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process text with AI' },
      { status: 500 }
    );
  }
} 