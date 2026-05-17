/**
 * AI Client — modular abstraction over the Gemini API.
 * Easy to swap for OpenAI or any other provider later.
 */

import { GoogleGenAI } from '@google/genai';

let clientInstance: GoogleGenAI | null = null;
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

function getClient(): GoogleGenAI {
  if (clientInstance) return clientInstance;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Please add it to your .env.local file. ' +
        'Get a free key at https://aistudio.google.com/apikey'
    );
  }

  clientInstance = new GoogleGenAI({ apiKey });
  return clientInstance;
}

export interface AIGenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

/**
 * Generate a text completion from the AI model.
 */
export async function generateText(options: AIGenerateOptions): Promise<string> {
  const client = getClient();
  const { prompt, systemInstruction, temperature = 0.3, maxTokens = 8192, jsonMode = false } = options;
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction || undefined,
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: jsonMode ? 'application/json' : 'text/plain',
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('AI returned an empty response. Please try again.');
  }

  return text;
}

/**
 * Generate structured JSON output from the AI model.
 */
export async function generateJSON<T>(options: AIGenerateOptions): Promise<T> {
  const text = await generateText({ ...options, jsonMode: true });

  try {
    return JSON.parse(text) as T;
  } catch {
    // Try to extract JSON from the response if it has extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        throw new Error('AI returned invalid JSON. Please try again.');
      }
    }
    throw new Error('AI returned invalid JSON. Please try again.');
  }
}
