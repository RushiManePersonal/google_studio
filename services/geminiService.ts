import { GoogleGenAI, Type } from "@google/genai";
import { AspectDefinition } from "../types";

/**
 * Phase B & C: Discovery & Naming
 * Uses Gemini to look at a small sample of data and define the aspects + keywords.
 * This is very cheap (1 API call) but enables the local engine to process 10k+ rows.
 */
export const discoverTaxonomy = async (sampleReviews: string[]): Promise<AspectDefinition[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    I have a dataset of product reviews. I need you to "learn" the aspects of this product so I can run a large-scale analysis locally.
    
    Step 1: Read the sample sentences below.
    Step 2: Identify 4-8 core Aspect Categories (e.g. Flavor, Texture, Price, Packaging, Shipping, Ingredients).
    Step 3: For EACH aspect, provide a list of 15-20 specific keywords, synonyms, or short phrases that would indicate this aspect is being discussed. 
           Include variations (e.g. "tastes", "tasted", "yummy" for Flavor).
    
    Sample Data:
    ${sampleReviews.join("\n")}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-09-2025',
      contents: prompt,
      config: {
        systemInstruction: "You are a specialized NLP Taxonomy generator. You output strict JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aspects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["name", "description", "keywords"]
              }
            }
          },
          required: ["aspects"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    const json = JSON.parse(text);
    return json.aspects || [];

  } catch (error) {
    console.error("Taxonomy Discovery Failed", error);
    throw error;
  }
};