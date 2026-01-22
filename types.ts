export interface ReviewInput {
  id: string;
  text: string;
}

export enum SentimentLabel {
  POSITIVE = 'Positive',
  NEGATIVE = 'Negative',
  NEUTRAL = 'Neutral',
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
  count: number;
  positive: number;
  negative: number;
  neutral: number;
  net_sentiment: number;
  keywords: string[];
}

export interface WordStat {
  word: string;
  count: number;
}

export interface AnalysisResult {
  reviews: AnalyzedReview[];
  aspects: AspectStats[];
  topWords: WordStat[]; // The statistical proof
  taxonomySource: 'Gemini-ZeroShot' | 'Pre-defined';
  processedCount: number;
}

export const SAMPLE_REVIEWS: string[] = [
  "The flavor is absolutely delicious, very chocolatey but not too sweet. However, the packaging was crushed when it arrived.",
  "I love the texture, it's so crunchy and stays fresh in milk. Price is a bit high for the size though.",
  "Disappointed with the ingredients list, too much sugar. The taste is okay, but I expected healthier.",
  "Great value for money! The box is huge. It tastes a bit bland compared to other brands.",
  "Perfect crunch! My kids love the taste. The resealable bag is a game changer.",
  "Smells weird when you open the box. Texture becomes soggy instantly. Not buying again.",
];