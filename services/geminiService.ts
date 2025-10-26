import { GoogleGenAI } from "@google/genai";
import { Phase } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNextPage = async (
  objective: string,
  phase: Phase,
  context: string,
  pageCount: number
): Promise<string> => {
  try {
    const prompt = `
      You are an expert ghostwriter creating a book page by page.

      BOOK OBJECTIVE:
      ${objective}

      CURRENT PHASE: ${phase}
      This phase dictates the tone and progression of the narrative.
      - BEGINNING: Introduce characters, setting, and the core conflict.
      - MIDDLE: Develop the plot, raise the stakes, and present challenges.
      - END: Climax, falling action, and resolution of the conflict.

      EXISTING CONTENT (CONTEXT):
      ---
      ${context || 'This is the very first page. Start the story.'}
      ---

      INSTRUCTION:
      Based on all the information above, write the complete text for the next page, which is page number ${pageCount + 1}.
      Your response should ONLY be the text for this new page. Do not add any commentary, titles, page numbers, or formatting like "Page ${pageCount + 1}".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    throw new Error("Failed to generate the next page. Please check your API key and network connection.");
  }
};

export const translateText = async (
  text: string,
  targetLanguage: string = "Brazilian Portuguese"
): Promise<string> => {
  try {
    const prompt = `
      You are an expert translator. Translate the following book text into ${targetLanguage}.
      Preserve the original tone, style, narrative voice, and formatting (like line breaks and paragraphs) as closely as possible.
      Your response should ONLY be the translated text.

      TEXT TO TRANSLATE:
      ---
      ${text}
      ---
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error translating content with Gemini:", error);
    throw new Error(`Failed to translate the text. Please check your API key and network connection.`);
  }
};
