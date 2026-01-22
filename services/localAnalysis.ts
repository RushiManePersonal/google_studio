import vader from "vader-sentiment";
import { AnalyzedReview, AspectDefinition, AspectSegment, AspectStats, ReviewInput, SentimentLabel, WordStat } from "../types";

// VADER exports an object containing the Analyzer class in the default export
const Analyzer = (vader as any).SentimentIntensityAnalyzer;

/**
 * EXTENDED STOP WORDS LIST - "NOISE FILTER"
 * 
 * Improved for Business Logic:
 * 1. Removes Linking Verbs (stays, becomes, seems, feels) - These describe state, they aren't the aspect itself.
 * 2. Removes Adverbs/Connectors (similarly, however, therefore, also).
 * 3. Removes Quantifiers (many, much, lot, bit).
 */
const STOP_WORDS = new Set([
  // Pronouns & Standard Grammar
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves",
  "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
  "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was",
  "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and",
  "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between",
  "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off",
  "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any",
  "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
  "than", "too", "very", "s", "t", "can", "will", "just", "don", "dont", "should", "now", "could", "would",
  
  // Generic Verbs / Actions (Not Aspects)
  "get", "got", "getting", "buy", "buying", "bought", "make", "made", "makes", "go", "going", "went", 
  "use", "used", "using", "try", "tried", "trying", "know", "think", "thought", "say", "said", "look", "looking",
  "want", "wanted", "need", "needed", "recommend", "purchased", "ordered", "received", "arrived",
  
  // Linking Verbs & States (Crucial for cleaning "stays", "becomes")
  "stay", "stays", "stayed", "become", "becomes", "becoming", "seem", "seems", "seemed", "feel", "feels", "felt",
  "keep", "keeps", "kept", "turn", "turns", "turned",
  
  // Generic Sentiment (Polarity, not Topic)
  "good", "bad", "great", "terrible", "awful", "amazing", "love", "hate", "liked", "disliked", "best", "worst",
  "better", "worse", "nice", "fine", "ok", "okay", "excellent", "poor", "perfect", "definitely", "absolutely",
  "honest", "honestly", "worth", "disappointed", "impressive",
  
  // Adverbs / Connectors / Quantifiers
  "however", "although", "though", "similarly", "finally", "actually", "basically", "literally", "really", 
  "probably", "maybe", "perhaps", "instead", "anyway", "meanwhile", "therefore", "thus", "hence",
  "much", "many", "lot", "lots", "bit", "little", "whole", "entire", "another", "every", "everything",
  
  // Context fillers
  "product", "item", "review", "reviews", "thing", "things", "stuff", "way", "amazon", "star", "stars", "day", 
  "days", "time", "times", "list" // 'list' is usually noise unless 'ingredients list'
]);

/**
 * Lightweight Stemmer
 */
const stemmer = (word: string): string => {
  let w = word.toLowerCase();
  if (w.length < 3) return w;
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('es') && !w.endsWith('aes')) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  if (w.endsWith('ing') && w.length > 5) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('ly') && w.length > 4) return w.slice(0, -2);
  return w;
};

const splitIntoSentences = (text: string): string[] => {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
};

/**
 * CLEAN & ADVANCED TOKENIZER
 */
export const extractTopFreqWords = (reviews: ReviewInput[], limit: number = 100): WordStat[] => {
  const phraseCounts = new Map<string, number>();

  reviews.forEach(review => {
    // PREPROCESSING STRATEGY:
    // 1. Lowercase
    // 2. Remove possessive 's (it's -> it, texture's -> texture)
    // 3. Remove non-alphanumeric (keep spaces)
    // 4. Split
    const cleanText = review.text.toLowerCase()
      .replace(/'s\b/g, '') // Remove 's at end of word (it's -> it, texture's -> texture)
      .replace(/'t\b/g, 't') // don't -> dont
      .replace(/[^\w\s]/g, ' '); // Remove punctuation

    const tokens = cleanText.split(/\s+/)
      .filter(w => w.length > 2) // Remove 1-2 char words
      .filter(w => !STOP_WORDS.has(w)); // First pass stopword removal

    // 1. Single Word Analysis (Unigrams)
    tokens.forEach(w => {
        // We use the word as is for display, assuming stemming is handled loosely
        phraseCounts.set(w, (phraseCounts.get(w) || 0) + 1);
    });

    // 2. Bigram (Phrase) Analysis - "Context Aware"
    // Since we already filtered stopwords from the 'tokens' array, 
    // any adjacent pair in 'tokens' is a candidate for a "Significant Phrase".
    // 
    // Example: "The battery life is good"
    // -> tokens: ["battery", "life"] (assuming "the", "is", "good" are stops)
    // -> Bigram: "battery life" -> Valid!
    //
    // Example: "Texture it's good"
    // -> cleanText: "texture it good"
    // -> tokens: ["texture"] ("it", "good" are stops)
    // -> Bigram: None. -> Garbage removed!
    
    for (let i = 0; i < tokens.length - 1; i++) {
      const w1 = tokens[i];
      const w2 = tokens[i+1];
      
      const bigram = `${w1} ${w2}`;
      phraseCounts.set(bigram, (phraseCounts.get(bigram) || 0) + 1);
    }
  });

  // Filter & Sort
  return Array.from(phraseCounts.entries())
    .filter(([_, count]) => count > 2) // Noise floor
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
};

const detectAspect = (sentence: string, taxonomy: AspectDefinition[]): { aspect: string, trigger: string } | null => {
  const normalized = sentence.toLowerCase();
  
  for (const aspect of taxonomy) {
    // Sort keywords by length desc so we match "customer service" before "service"
    // This prioritizes the Specific over the General
    const sortedKeywords = [...aspect.keywords].sort((a, b) => b.length - a.length);

    for (const keyword of sortedKeywords) {
      // Strict word boundary matching
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`);
      if (regex.test(normalized)) {
        return { aspect: aspect.name, trigger: keyword };
      }
    }
  }
  return null;
};

const analyzeSentiment = (text: string): { label: SentimentLabel; score: number } => {
  try {
    const result = Analyzer.polarity_scores(text);
    const score = result.compound; 
    let label = SentimentLabel.NEUTRAL;
    if (score >= 0.05) label = SentimentLabel.POSITIVE;
    else if (score <= -0.05) label = SentimentLabel.NEGATIVE;
    return { label, score };
  } catch (e) {
    return { label: SentimentLabel.NEUTRAL, score: 0 };
  }
};

export const performLocalAnalysis = async (
  reviews: ReviewInput[],
  taxonomy: AspectDefinition[],
  onProgress?: (progress: number) => void
): Promise<{ reviews: AnalyzedReview[], stats: AspectStats[] }> => {
  
  const analyzedReviews: AnalyzedReview[] = [];
  const aspectStatsMap = new Map<string, AspectStats>();

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
  const BATCH_SIZE = 500; 

  for (let i = 0; i < total; i++) {
    const review = reviews[i];
    const sentences = splitIntoSentences(review.text);
    const segments: AspectSegment[] = [];

    sentences.forEach(sentence => {
      const match = detectAspect(sentence, taxonomy);
      
      if (match) {
        const { label, score } = analyzeSentiment(sentence);
        
        segments.push({
          segment_text: sentence.trim(),
          aspect_category: match.aspect,
          sentiment: label,
          sentiment_score: score,
          reasoning: "Keyword Match",
          trigger_word: match.trigger
        });

        const stats = aspectStatsMap.get(match.aspect);
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

    if (i % BATCH_SIZE === 0) {
      if (onProgress) onProgress(Math.round((i / total) * 100));
      await new Promise(resolve => setTimeout(resolve, 0)); 
    }
  }

  const aspectStats: AspectStats[] = Array.from(aspectStatsMap.values()).map(stats => ({
    ...stats,
    net_sentiment: stats.count > 0 ? ((stats.positive - stats.negative) / stats.count) : 0
  })).sort((a, b) => b.count - a.count);

  if (onProgress) onProgress(100);

  return { reviews: analyzedReviews, stats: aspectStats };
};