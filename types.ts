
export interface ReviewInput {
  id: string;
  text: string;
}

export enum SentimentLabel {
  POSITIVE = 'Positive',
  NEGATIVE = 'Negative',
  NEUTRAL = 'Neutral',
  MIXED = 'Mixed', // Represents conflicting sentiment in aggregation
}

export interface AspectSegment {
  segment_text: string;
  aspect_category: string;
  sentiment: SentimentLabel;
  sentiment_score: number; // -1 to 1
  reasoning: string;
  trigger_word: string; // The exact word that caused this classification
}

export interface AnalyzedReview {
  review_id: string;
  original_text: string;
  segments: AspectSegment[];
}

export interface AspectDefinition {
  name: string;
  description: string;
  keywords: string[];
}

export interface AspectStats {
  name: string;
  count: number; // Total number of segments (Mentions)
  reviewCount: number; // Number of unique reviews containing this aspect
  positive: number;
  negative: number;
  neutral: number;
  net_sentiment: number;
  confidence: number; // 0 to 1 score indicating reliability (coverage * diversity)
  keywords: string[];
}

export interface WordStat {
  word: string;
  count: number;
  score: number; // The weighted signal score
}

export interface AnalysisResult {
  reviews: AnalyzedReview[];
  aspects: AspectStats[];
  topWords: WordStat[]; // The statistical proof
  taxonomySource: 'Gemini-ZeroShot' | 'Pre-defined';
  processedCount: number;
  warnings: string[]; // Integrity check warnings (e.g., repetitive data)
}

export const SAMPLE_DATASETS: Record<string, string[]> = {
  "Food (Cereal)": [
    "The flavor is absolutely delicious, very chocolatey but not too sweet. However, the packaging was crushed when it arrived.",
    "I love the texture, it's so crunchy and stays fresh in milk. Price is a bit high for the size though.",
    "Disappointed with the ingredients list, too much sugar. The taste is okay, but I expected healthier.",
    "Great value for money! The box is huge. It tastes a bit bland compared to other brands.",
    "Perfect crunch! My kids love the taste. The resealable bag is a game changer.",
    "Smells weird when you open the box. Texture becomes soggy instantly. Not buying again.",
  ],
  "Tech (Headphones)": [
    "The sound quality is amazing, especially the bass. Noise cancellation works great on airplanes.",
    "Battery life is disappointing. It only lasts 4 hours. The ear cups are comfortable though.",
    "Bluetooth connection drops constantly. Very frustrating when on calls. Microphone clarity is poor.",
    "Build quality feels cheap and plastic. For the price, I expected better durability.",
    "Super comfortable for long gaming sessions. The volume control is easy to reach.",
    "Charging case is bulky but the audio fidelity is top notch. Best headphones I've owned."
  ],
  "Skincare (Lotion)": [
    "My skin feels so soft after using this. The scent is very light and pleasant, not overpowering.",
    "Caused a breakout immediately. I have sensitive skin and this was too harsh. Ingredients are questionable.",
    "Very hydrating! Absorbs quickly into the skin without leaving a greasy residue.",
    "The bottle pump is broken. Hard to get the product out. Too expensive for a moisturizer.",
    "Noticed a visible reduction in wrinkles. Texture is creamy and rich.",
    "Smells like chemicals. Did not see any difference in hydration. Waste of money."
  ]
};

export const SAMPLE_REVIEWS = SAMPLE_DATASETS["Food (Cereal)"];
