import { GoogleGenAI, Type } from "@google/genai";
import { AspectDefinition } from "../types";

/**
 * Phase B & C: Discovery & Naming
 * Uses Gemini to look at a small sample of data AND global vocabulary stats.
 */
export const discoverTaxonomy = async (sampleReviews: string[], topFrequentWords: string[]): Promise<AspectDefinition[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Improved Prompt Strategy:
  // We emphasize that the 'topFrequentWords' are now filtered, high-quality signals (Nouns/Phrases).
  // We ask Gemini to trust these signals to form the category structure.
  const prompt = `
    I have a large dataset of product reviews. I need you to define a comprehensive Aspect Taxonomy (Classification Rules) so I can run a rule-based analysis on the full dataset.
    
    Context 1: High-Confidence Vocabulary Signals
    These are the most frequent nouns and 2-word phrases found in the dataset (N=50k+). 
    I have already filtered out stop words and verbs. 
    [${topFrequentWords.join(", ")}]

    Context 2: Qualitative Context
    Here are a few actual review snippets to understand the sentiment/tone:
    ${sampleReviews.map(s => `- "${s}"`).join("\n")}

    Task:
    1. Analyze the "Vocabulary Signals" to determine the natural clusters of conversation.
       - Example: if you see "shipping", "arrived", "box", "packaging" -> Create a "Shipping & Packaging" aspect.
       - Example: if you see "taste", "flavor", "sweet", "delicious" -> Create a "Taste & Flavor" aspect.
    2. Define the Aspects.
       - Do not limit the number. If the data is complex, create more aspects. If simple, create fewer.
    3. For EACH aspect, provide a list of strict keywords.
       - **CRITICAL**: You MUST include the exact words/phrases from the "Vocabulary Signals" list in the relevant category.
       - Add synonyms and variations (singular/plural) to ensure we catch similar mentions.

    Output strict JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-09-2025',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert NLP Data Scientist. You prefer broad, comprehensive categories over tiny, fragmented ones.",
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