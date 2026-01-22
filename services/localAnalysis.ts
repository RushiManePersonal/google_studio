import { SentimentIntensityAnalyzer } from "vader-sentiment-forward";
import { AnalyzedReview, AspectDefinition, AspectSegment, AspectStats, ReviewInput, SentimentLabel } from "../types";

// Initialize VADER analyzer
const sentimentAnalyzer = new SentimentIntensityAnalyzer();

/**
 * Phase A: Preprocessing & Sentence Splitting
 */
const splitIntoSentences = (text: string): string[] => {
  // Simple regex-based splitting on punctuation
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
};

/**
 * Phase D: Aspect Detection (Local Keyword Matching)
 */
const detectAspect = (sentence: string, taxonomy: AspectDefinition[]): string | null => {
  const normalized = sentence.toLowerCase();
  
  // Check each aspect's keywords against the sentence
  // Optimization: In a real prod environment, we might use Aho-Corasick or pre-compiled Regex
  for (const aspect of taxonomy) {
    for (const keyword of aspect.keywords) {
      // Use word boundary check for better accuracy
      // This is a simple includes check for speed on 10k items
      if (normalized.includes(keyword.toLowerCase())) {
        return aspect.name;
      }
    }
  }
  return null;
};

/**
 * Phase E: Aspect-Wise Sentiment Analysis (VADER)
 */
const analyzeSentiment = (text: string): { label: SentimentLabel; score: number } => {
  const result = sentimentAnalyzer.polarity_scores(text);
  const score = result.compound; // -1.0 to 1.0

  let label = SentimentLabel.NEUTRAL;
  if (score >= 0.05) label = SentimentLabel.POSITIVE;
  else if (score <= -0.05) label = SentimentLabel.NEGATIVE;

  return { label, score };
};

/**
 * Main Local Pipeline Executor
 */
export const performLocalAnalysis = async (
  reviews: ReviewInput[],
  taxonomy: AspectDefinition[],
  onProgress?: (progress: number) => void
): Promise<{ reviews: AnalyzedReview[], stats: AspectStats[] }> => {
  
  const analyzedReviews: AnalyzedReview[] = [];
  const aspectStatsMap = new Map<string, AspectStats>();

  // Initialize stats map
  taxonomy.forEach(aspect => {
    aspectStatsMap.set(aspect.name, {
      name: aspect.name,
      keywords: aspect.keywords,
      count: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      net_sentiment: 0
    });
  });

  const total = reviews.length;
  const BATCH_SIZE = 500; // Yield to main thread every 500 reviews to keep UI responsive

  for (let i = 0; i < total; i++) {
    const review = reviews[i];
    const sentences = splitIntoSentences(review.text);
    const segments: AspectSegment[] = [];

    sentences.forEach(sentence => {
      const aspectName = detectAspect(sentence, taxonomy);
      
      if (aspectName) {
        const { label, score } = analyzeSentiment(sentence);
        
        segments.push({
          segment_text: sentence.trim(),
          aspect_category: aspectName,
          sentiment: label,
          sentiment_score: score,
          reasoning: "Keyword Match" // Local logic doesn't generate reasoning text
        });

        // Update Stats
        const stats = aspectStatsMap.get(aspectName);
        if (stats) {
          stats.count++;
          if (label === SentimentLabel.POSITIVE) stats.positive++;
          else if (label === SentimentLabel.NEGATIVE) stats.negative++;
          else stats.neutral++;
        }
      }
    });

    if (segments.length > 0) {
      analyzedReviews.push({
        review_id: review.id,
        original_text: review.text,
        segments
      });
    }

    // Yield to UI
    if (i % BATCH_SIZE === 0) {
      if (onProgress) onProgress(Math.round((i / total) * 100));
      await new Promise(resolve => setTimeout(resolve, 0)); 
    }
  }

  // Final Stats Calculation
  const aspectStats: AspectStats[] = Array.from(aspectStatsMap.values()).map(stats => ({
    ...stats,
    net_sentiment: stats.count > 0 ? ((stats.positive - stats.negative) / stats.count) : 0
  })).sort((a, b) => b.count - a.count);

  if (onProgress) onProgress(100);

  return { reviews: analyzedReviews, stats: aspectStats };
};