import React, { useState, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { Dashboard } from './components/Dashboard';
import { Methodology } from './components/Methodology';
import { AnalysisResult, ReviewInput } from './types';
import { discoverTaxonomy } from './services/geminiService';
import { performLocalAnalysis, extractTopFreqWords } from './services/localAnalysis';

const App: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
    }
  }, []);

  const handleAnalyze = async (reviews: string[]) => {
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // 1. Prepare Data
      setStatusText('Preparing data...');
      const reviewObjects: ReviewInput[] = reviews.map((text, index) => ({
        id: `rev-${index + 1}`,
        text
      }));
      
      // Yield to UI to show "Preparing"
      await new Promise(r => setTimeout(r, 100));

      // 2. Vocabulary-Guided Discovery Strategy
      // Step A: Global Frequency Analysis (Local)
      // This is the "Smart" part: We scan ALL data to get the top terms (stats objects), 
      // ensuring we don't miss aspects just because our Gemini sample is small.
      // Now includes STEMMING to merge "flavor" and "flavors".
      setStatusText(`Scanning ${reviews.length} reviews for global vocabulary signals...`);
      const topWordStats = extractTopFreqWords(reviewObjects, 100); // Get top 100 stats {word, count}
      // Extract just strings for the Prompt to Gemini
      const topWordStrings = topWordStats.map(s => s.word);
      
      await new Promise(r => setTimeout(r, 100)); // UI Refresh

      // Step B: Qualitative Sampling
      // We still need full sentences to show Gemini *context*.
      const sampleSize = Math.min(15, reviews.length);
      const sampleIndices = new Set<number>();
      while(sampleIndices.size < sampleSize) {
        sampleIndices.add(Math.floor(Math.random() * reviews.length));
      }
      const sampleReviews = Array.from(sampleIndices).map(i => reviews[i]);

      // 3. Call Gemini (Discovery Phase)
      // We pass BOTH the top frequent words (Global Context) and the sample reviews (Local Context)
      setStatusText('Gemini: Discovering taxonomy from vocabulary & samples...');
      const taxonomy = await discoverTaxonomy(sampleReviews, topWordStrings);
      
      // 4. Run Local Analysis (Scale Phase)
      setStatusText(`Local: Applying taxonomy to ${reviews.length} reviews...`);
      const localResult = await performLocalAnalysis(
        reviewObjects, 
        taxonomy,
        (pct) => setProgress(pct)
      );

      setResult({
        reviews: localResult.reviews,
        aspects: localResult.stats,
        topWords: topWordStats, // Pass the statistical proof to the dashboard
        taxonomySource: 'Gemini-ZeroShot',
        processedCount: reviews.length
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
      setStatusText('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
               </svg>
             </div>
             <h1 className="text-xl font-bold tracking-tight text-slate-900">
               Aspect<span className="text-indigo-600">Sense</span>
             </h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">Vocabulary-Guided Pipeline</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {apiKeyMissing && (
           <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  API Key missing. Please ensure <code>process.env.API_KEY</code> is set in your environment.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* Introduction */}
          {!result && !isAnalyzing && (
            <div className="text-center py-10">
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Smart ABSA Pipeline
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500">
                Uses <span className="text-indigo-600 font-semibold">Global Vocabulary Stats</span> + <span className="text-indigo-600 font-semibold">Gemini</span> for accurate discovery at scale (50k+ rows).
              </p>
            </div>
          )}

          {/* Input Area */}
          <InputSection onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
          
          {/* Progress Indicator */}
          {isAnalyzing && (
            <div className="w-full bg-white p-4 rounded-lg border border-slate-200 shadow-sm animate-pulse">
               <div className="flex justify-between text-sm font-medium mb-1">
                 <span className="text-indigo-600">{statusText}</span>
                 <span className="text-slate-500">{progress}%</span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-2.5">
                 <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
               </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Results Dashboard */}
          {result && <Dashboard result={result} />}
          
          {/* Detailed Explanation */}
          <Methodology />
        </div>
      </main>
    </div>
  );
};

export default App;