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
  // We ask Gemini to trust these signals to form the category structure, BUT to expand the lexicon significantly.
  const prompt = `
    I have a large dataset of product reviews. I need you to define a comprehensive Aspect Taxonomy (Classification Rules) so I can run a rule-based analysis on the full dataset.
    
    Context 1: High-Confidence Vocabulary Signals
    These are the most frequent nouns and 2-word phrases found in the dataset (N=50k+). 
    I have already filtered out stop words and verbs. 
    **Use these signals as the PRIMARY source for defining categories.**
    [${topFrequentWords.join(", ")}]

    Context 2: Qualitative Context
    Here are a few actual review snippets to understand the sentiment/tone (use only for context, not for structure):
    ${sampleReviews.map(s => `- "${s}"`).join("\n")}

    Task:
    1. Analyze the "Vocabulary Signals" to determine the natural clusters of conversation.
       - Example: "shipping", "arrived", "box" -> "Shipping & Packaging".
       - Example: "flavor", "sweet", "bland" -> "Taste & Flavor".
    2. Define the Aspects.
    3. For EACH aspect, provide a list of **comprehensive trigger words**.
       - **CRITICAL**: You must include NOT JUST NOUNS, but also **Adjectives** and **Verbs** that strongly imply the aspect (Implicit Aspects).
       - **Examples of expansion required**:
         - If the aspect is "Price/Value", include: "price", "cost", "value", "expensive", "cheap", "worth it", "deal", "ripoff", "portion size", "waste of money".
         - If the aspect is "Taste/Flavor", include: "taste", "flavor", "delicious", "yummy", "gross", "bland", "sweet", "salty", "bitter", "artificial", "tasty", "mouthfeel".
         - If the aspect is "Ingredients/Health", include: "ingredients", "natural", "artificial", "sugar", "chemical", "healthy", "clean", "processed", "additives".
         - If the aspect is "Texture", include: "texture", "crunchy", "soggy", "hard", "soft", "chewy", "chalky", "crumbly".
       - **EXCLUSION RULE**: Do NOT include generic domain nouns (like "bar", "product", "item", "snack") as triggers. They cause false positives.
       - **Specificity**: Prefer "battery life" over "life", "customer service" over "service".

    Output strict JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-09-2025',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert NLP Data Scientist. You prefer broad, comprehensive categories. You ensure that every aspect has a rich list of trigger keywords (nouns, adjectives, verbs) to maximize recall. You include both positive and negative sentiment indicators as triggers.",
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