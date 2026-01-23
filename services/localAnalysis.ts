import vader from "vader-sentiment";
import { AnalyzedReview, AspectDefinition, AspectSegment, AspectStats, ReviewInput, SentimentLabel, WordStat } from "../types";

// VADER exports an object containing the Analyzer class in the default export
const Analyzer = (vader as any).SentimentIntensityAnalyzer;

/**
 * STOP WORDS
 * Standard list to keep the PMI calculation efficient.
 */
const STOP_WORDS = new Set([
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves",
  "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
  "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was",
  "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and",
  "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between",
  "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off",
  "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any",
  "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
  "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"
]);

/**
 * Basic Singularization
 * Naive implementation to merge "flavors" -> "flavor", "batteries" -> "battery".
 * This helps consolidate signals in the absence of a full lemmatizer.
 */
const singularize = (word: string): string => {
  if (word.length <= 3) return word;
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("s") && !word.endsWith("ss") && !word.endsWith("us")) return word.slice(0, -1);
  return word;
};

/**
 * Advanced Segmentation
 * Split by contrastive conjunctions to isolate sentiments.
 */
const segmentTextIntoClauses = (text: string): string[] => {
  // Replace contrastive conjunctions with a special delimiter, then split on that delimiter + punctuation.
  let processed = text.replace(/([,;]\s+)(but|however|although|yet|while)(\s+)/gi, " | ");
  processed = processed.replace(/(\s+)(but|however|although|yet|while)(\s+)/gi, " | ");
  
  const rawSegments = processed.split(/[|.!?]+/);
  
  return rawSegments
    .map(s => s.trim())
    .filter(s => s.length > 2); 
};

/**
 * Extracts signals using PMI * Document Frequency (DF)
 * This prevents repetitive spam in a single review from hijacking the signals.
 */
export const extractTopFreqWords = (reviews: ReviewInput[], limit: number = 100): WordStat[] => {
  const wordCounts = new Map<string, number>(); // Total occurrences
  const wordDocCounts = new Map<string, Set<string>>(); // Document Frequency (DF)
  
  const pairCounts = new Map<string, number>();
  let totalWords = 0;
  let totalPairs = 0;

  const isSentimentWord = (w: string) => {
    try {
      const res = Analyzer.polarity_scores(w);
      return Math.abs(res.compound) > 0.1;
    } catch (e) {
      return false;
    }
  };

  reviews.forEach(review => {
    const cleanText = review.text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' '); 
    
    const rawTokens = cleanText.split(/\s+/).filter(w => w.length > 2);
    // Apply singularization to consolidate signals
    const tokens = rawTokens.map(singularize);

    tokens.forEach(w => {
      wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
      
      // Track Document Frequency
      if (!wordDocCounts.has(w)) wordDocCounts.set(w, new Set());
      wordDocCounts.get(w)?.add(review.id);
      
      totalWords++;
    });

    for (let i = 0; i < tokens.length - 1; i++) {
      const w1 = tokens[i];
      const w2 = tokens[i+1];
      if (STOP_WORDS.has(w1) || STOP_WORDS.has(w2)) continue;
      const bigram = `${w1} ${w2}`;
      pairCounts.set(bigram, (pairCounts.get(bigram) || 0) + 1);
      totalPairs++;
    }
  });

  const scoredPhrases: { word: string, score: number, type: 'phrase' | 'word' }[] = [];
  const totalDocs = reviews.length;

  // 1. Score Bigrams
  pairCounts.forEach((count, bigram) => {
    if (count < 3) return; 
    const [w1, w2] = bigram.split(' ');
    const p_bigram = count / totalPairs;
    const p_w1 = (wordCounts.get(w1) || 1) / totalWords;
    const p_w2 = (wordCounts.get(w2) || 1) / totalWords;
    
    // PMI Score
    const pmi = Math.log2(p_bigram / (p_w1 * p_w2));
    
    if (pmi > 2) { 
      scoredPhrases.push({ word: bigram, score: count * pmi, type: 'phrase' });
    }
  });

  // 2. Score Unigrams with Signal Weighting
  wordCounts.forEach((count, word) => {
    if (STOP_WORDS.has(word)) return;
    if (count < 3) return;
    if (isSentimentWord(word)) return; // Exclude adjectives/verbs from Vocabulary Signals

    // Signal Weighting = Count * log(DocumentFrequency)
    // This penalizes words that appear 100 times in 1 review (Spam)
    const df = wordDocCounts.get(word)?.size || 0;
    const dfWeight = Math.log2(df + 1); // +1 to avoid log(1)=0 if only 1 doc
    
    // Boost signal if DF is high relative to corpus
    const signalScore = count * dfWeight;

    scoredPhrases.push({ word: word, score: signalScore, type: 'word' });
  });

  return scoredPhrases
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(p => ({ word: p.word, count: Math.round(p.score), score: p.score })); 
};

const detectAspect = (textSegment: string, taxonomy: AspectDefinition[]): { aspect: string, trigger: string } | null => {
  const normalized = textSegment.toLowerCase();
  let bestMatch: { aspect: string, trigger: string } | null = null;
  
  for (const aspect of taxonomy) {
    for (const keyword of aspect.keywords) {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`);
      if (regex.test(normalized)) {
        if (!bestMatch || keyword.length > bestMatch.trigger.length) {
          bestMatch = { aspect: aspect.name, trigger: keyword };
        }
      }
    }
  }
  return bestMatch;
};

const calibrateSentiment = (score: number, text: string): number => {
  if (score === 0) return 0;
  let calibrated = score;
  if (calibrated > 0.85) calibrated = 0.85;
  if (calibrated < -0.85) calibrated = -0.85;

  const intensifiers = ["absolutely", "extremely", "perfect", "worst", "terrible", "amazing", "love", "hate", "best", "awful"];
  if (intensifiers.some(i => text.toLowerCase().includes(i))) {
    return score; 
  }
  return calibrated;
};

const analyzeSentiment = (text: string): { label: SentimentLabel; score: number } => {
  try {
    const result = Analyzer.polarity_scores(text);
    const score = calibrateSentiment(result.compound, text); 
    
    let label = SentimentLabel.NEUTRAL;
    if (score >= 0.05) label = SentimentLabel.POSITIVE;
    else if (score <= -0.05) label = SentimentLabel.NEGATIVE;
    
    return { label, score };
  } catch (e) {
    return { label: SentimentLabel.NEUTRAL, score: 0 };
  }
};

/**
 * Checks for dataset manipulation or extremely low quality
 */
export const checkDatasetIntegrity = (reviews: ReviewInput[], topWords: WordStat[]): string[] => {
  const warnings: string[] = [];
  
  // 1. Repetition Check
  const uniqueTexts = new Set(reviews.map(r => r.text.trim()));
  const repetitionRate = 1 - (uniqueTexts.size / reviews.length);
  if (repetitionRate > 0.3) {
    warnings.push("High repetition detected: >30% of reviews are identical duplicates.");
  }

  // 2. Entropy Check (simplified via Vocabulary concentration)
  // If top 3 words account for > 50% of signal score mass, it's likely synthetic or spammy
  if (topWords.length > 5) {
    const totalScore = topWords.reduce((acc, w) => acc + w.score, 0);
    const top3Score = topWords.slice(0, 3).reduce((acc, w) => acc + w.score, 0);
    if ((top3Score / totalScore) > 0.6) {
      warnings.push("Low signal entropy: Dataset is dominated by just 2-3 keywords. Results may be skewed.");
    }
  }

  return warnings;
};

export const performLocalAnalysis = async (
  reviews: ReviewInput[],
  taxonomy: AspectDefinition[],
  onProgress?: (progress: number) => void
): Promise<{ reviews: AnalyzedReview[], stats: AspectStats[] }> => {
  
  const analyzedReviews: AnalyzedReview[] = [];
  
  const aspectAggregates = new Map<string, {
    count: number;
    reviewIds: Set<string>;
    scoreSum: number;
    posCount: number;
    negCount: number;
    neuCount: number;
    keywords: string[];
    uniqueTriggers: Set<string>;
  }>();

  taxonomy.forEach(aspect => {
    aspectAggregates.set(aspect.name, {
      count: 0,
      reviewIds: new Set(),
      scoreSum: 0,
      posCount: 0,
      negCount: 0,
      neuCount: 0,
      keywords: aspect.keywords,
      uniqueTriggers: new Set()
    });
  });

  const total = reviews.length;
  const BATCH_SIZE = 500; 

  for (let i = 0; i < total; i++) {
    const review = reviews[i];
    const segmentsList = segmentTextIntoClauses(review.text);
    const matchedSegments: AspectSegment[] = [];

    segmentsList.forEach(segmentText => {
      const match = detectAspect(segmentText, taxonomy);
      
      if (match) {
        const { label, score } = analyzeSentiment(segmentText);
        
        matchedSegments.push({
          segment_text: segmentText,
          aspect_category: match.aspect,
          sentiment: label,
          sentiment_score: score,
          reasoning: "Keyword Match",
          trigger_word: match.trigger
        });

        const agg = aspectAggregates.get(match.aspect);
        if (agg) {
          agg.count++;
          agg.reviewIds.add(review.id);
          agg.scoreSum += score;
          agg.uniqueTriggers.add(match.trigger); // Track diversity for confidence
          
          if (label === SentimentLabel.POSITIVE) agg.posCount++;
          else if (label === SentimentLabel.NEGATIVE) agg.negCount++;
          else agg.neuCount++;
        }
      }
    });

    if (matchedSegments.length > 0) {
      analyzedReviews.push({
        review_id: review.id,
        original_text: review.text,
        segments: matchedSegments
      });
    }

    if (i % BATCH_SIZE === 0) {
      if (onProgress) onProgress(Math.round((i / total) * 100));
      await new Promise(resolve => setTimeout(resolve, 0)); 
    }
  }

  const aspectStats: AspectStats[] = Array.from(aspectAggregates.entries()).map(([name, agg]) => {
    const avgSentiment = agg.count > 0 ? (agg.scoreSum / agg.count) : 0;
    
    // Confidence Calculation
    // 1. Coverage Score: Logarithmic scale of unique documents (diminishing returns after ~50 docs)
    const coverageScore = Math.min(1, Math.log2(agg.reviewIds.size + 1) / Math.log2(50));
    
    // 2. Diversity Score: Are we triggering on just 1 word ("price") or many ("cost", "value", "cheap")?
    const diversityScore = Math.min(1, agg.uniqueTriggers.size / 3); 

    // Final Confidence: Average of Coverage and Diversity
    const confidence = (coverageScore * 0.7) + (diversityScore * 0.3);

    return {
      name,
      keywords: agg.keywords,
      count: agg.count,
      reviewCount: agg.reviewIds.size,
      positive: agg.posCount,
      negative: agg.negCount,
      neutral: agg.neuCount,
      net_sentiment: avgSentiment,
      confidence: parseFloat(confidence.toFixed(2))
    };
  }).sort((a, b) => b.count - a.count);

  if (onProgress) onProgress(100);

  return { reviews: analyzedReviews, stats: aspectStats };
};