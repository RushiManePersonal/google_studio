import React, { useState } from 'react';
import { AnalysisResult, AnalyzedReview, AspectStats, SentimentLabel, WordStat } from '../types';
import { AspectChart } from './AspectChart';

interface DashboardProps {
  result: AnalysisResult;
}

export const Dashboard: React.FC<DashboardProps> = ({ result }) => {
  const [selectedAspect, setSelectedAspect] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const filteredReviews = selectedAspect
    ? result.reviews.filter(r => r.segments.some(s => s.aspect_category === selectedAspect))
    : result.reviews;

  // Pagination Logic
  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const displayReviews = filteredReviews.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Calculate high-level metrics
  const totalSegments = result.aspects.reduce((acc, curr) => acc + curr.count, 0);
  // Weighted Average for Global Sentiment
  const globalSentimentNum = result.aspects.reduce((acc, curr) => acc + (curr.net_sentiment * curr.count), 0);
  const avgSentiment = totalSegments > 0 ? globalSentimentNum / totalSegments : 0;

  const handleAspectClick = (aspect: string) => {
    setSelectedAspect(aspect);
    setPage(1); // Reset to page 1 on filter change
  }

  // Helper to determine if an aspect is "Mixed"
  const getAspectSentimentStatus = (stats: AspectStats) => {
    const total = stats.count;
    if (total === 0) return { label: 'Neutral', color: 'text-slate-500' };

    // If both Positive and Negative are significant (>15% each), it's mixed
    const posRatio = stats.positive / total;
    const negRatio = stats.negative / total;
    
    if (posRatio > 0.15 && negRatio > 0.15) {
      return { 
        label: 'Mixed', 
        color: 'text-amber-600', 
        bg: 'bg-amber-100',
        borderColor: 'border-amber-200' 
      };
    }

    if (stats.net_sentiment > 0.1) return { label: 'Positive', color: 'text-green-600', bg: 'bg-green-100', borderColor: 'border-green-200' };
    if (stats.net_sentiment < -0.1) return { label: 'Negative', color: 'text-red-600', bg: 'bg-red-100', borderColor: 'border-red-200' };
    return { label: 'Neutral', color: 'text-slate-500', bg: 'bg-slate-100', borderColor: 'border-slate-200' };
  };

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* WARNINGS SECTION */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Dataset Integrity Warnings
          </h3>
          <ul className="list-disc list-inside text-sm text-amber-700">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* SECTION 1: STATISTICAL PROOF (DATA SIGNALS) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Corpus Signals (Token Frequency × Document Coverage)
            </h3>
            <p className="text-sm text-slate-500">
                These are the top nouns/phrases weighted by their <strong>Signal Strength</strong>. 
                Words that appear frequently but only in a few reviews (spam/repetition) are penalized.
            </p>
        </div>
        
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
            {result.topWords.slice(0, 60).map((stat: WordStat, idx) => {
                const opacity = Math.max(0.4, 1 - (idx / 60));
                const scale = idx < 5 ? 'text-base font-bold' : idx < 20 ? 'text-sm font-medium' : 'text-xs';
                
                return (
                    <div 
                        key={stat.word} 
                        className={`px-3 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 ${scale}`}
                        style={{ opacity }}
                        title={`Score: ${stat.score.toFixed(1)}`}
                    >
                        <span>{stat.word}</span>
                        <span className="bg-white px-1.5 rounded text-[10px] text-slate-400 font-mono shadow-sm">
                            {stat.count}
                        </span>
                    </div>
                );
            })}
        </div>
      </div>

      {/* SECTION 2: SENTIMENT METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Reviews Analyzed</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{result.processedCount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Aspects Discovered</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{result.aspects.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Specific Mentions (Clauses)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalSegments.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Weighted Avg Sentiment</p>
          <div className="flex items-center gap-2 mt-1">
            <p className={`text-2xl font-bold ${avgSentiment > 0.05 ? 'text-green-600' : avgSentiment < -0.05 ? 'text-red-600' : 'text-slate-600'}`}>
              {avgSentiment > 0 ? '+' : ''}{avgSentiment.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Aspect Sentiment Distribution</h3>
            {selectedAspect && (
              <button 
                onClick={() => handleAspectClick(null as any)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>
          <AspectChart 
            data={result.aspects} 
            onAspectClick={handleAspectClick} 
            selectedAspect={selectedAspect}
          />
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">Click a bar to filter reviews below</p>
          </div>
        </div>

        {/* Aspect Details / Keywords */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[480px]">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {selectedAspect ? `${selectedAspect} Details` : 'Aspect Summary'}
          </h3>
          <div className="flex-1 overflow-y-auto pr-2">
            {selectedAspect ? (
              <div className="space-y-4">
                 {(() => {
                   const stats = result.aspects.find(a => a.name === selectedAspect);
                   if (!stats) return null;
                   const status = getAspectSentimentStatus(stats);
                   
                   return (
                     <>
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="bg-green-50 p-2 rounded text-green-700 font-medium">{stats.positive} Pos</div>
                        <div className="bg-red-50 p-2 rounded text-red-700 font-medium">{stats.negative} Neg</div>
                        <div className="bg-slate-50 p-2 rounded text-slate-700 font-medium">{stats.neutral} Neu</div>
                      </div>
                      
                      <div className="flex items-center gap-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                        <div>
                            <p className="text-xs text-indigo-500 uppercase font-bold">Total Mentions</p>
                            <p className="text-lg font-bold text-indigo-700">{stats.count}</p>
                            <p className="text-[10px] text-indigo-400">Clauses</p>
                        </div>
                        <div className="w-px h-8 bg-indigo-200"></div>
                        <div>
                            <p className="text-xs text-indigo-500 uppercase font-bold">Review Coverage</p>
                            <p className="text-lg font-bold text-indigo-700">{stats.reviewCount}</p>
                            <p className="text-[10px] text-indigo-400">Documents</p>
                        </div>
                         <div className="w-px h-8 bg-indigo-200"></div>
                        <div>
                             <p className="text-xs text-indigo-500 uppercase font-bold">Confidence</p>
                             <p className={`text-lg font-bold ${stats.confidence > 0.6 ? 'text-green-600' : 'text-amber-500'}`}>
                                {(stats.confidence * 100).toFixed(0)}%
                             </p>
                             <p className="text-[10px] text-indigo-400">Reliability</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Definition Keywords</h4>
                        <p className="text-xs text-slate-500 mb-2">Words that trigger this aspect (Longer matches prioritized):</p>
                        <div className="flex flex-wrap gap-2">
                          {(stats.keywords || []).map(k => (
                            <span key={k} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full border border-slate-200">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                     </>
                   )
                 })()}
              </div>
            ) : (
               <div className="grid grid-cols-1 gap-3">
                 {result.aspects.map(aspect => {
                    const status = getAspectSentimentStatus(aspect);
                    return (
                       <div 
                        key={aspect.name} 
                        onClick={() => handleAspectClick(aspect.name)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all group"
                       >
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity" />
                            <div>
                              <p className="font-medium text-slate-800 flex items-center gap-2">
                                {aspect.name}
                                {status.label === 'Mixed' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 font-bold">
                                        Mixed
                                    </span>
                                )}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-semibold">{aspect.reviewCount}</span> docs
                                <span className="text-slate-300">|</span>
                                <span title="Confidence Score">{(aspect.confidence * 100).toFixed(0)}% conf</span>
                              </div>
                            </div>
                         </div>
                         <div className="text-right">
                           <span className={`text-sm font-bold ${aspect.net_sentiment > 0.1 ? 'text-green-600' : aspect.net_sentiment < -0.1 ? 'text-red-600' : 'text-slate-500'}`}>
                             {aspect.net_sentiment > 0 ? '+' : ''}{aspect.net_sentiment.toFixed(2)}
                           </span>
                         </div>
                       </div>
                    );
                 })}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: REVIEWS WITH TRACEABILITY */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-slate-900">
            {selectedAspect ? `Reviews mentioning "${selectedAspect}"` : 'Review Analysis Breakdown'}
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded">
              {filteredReviews.length} documents
            </span>
            {/* Simple Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                >
                  ←
                </button>
                <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
                 <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {displayReviews.map((review) => (
            <div key={review.review_id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="mb-3">
                <p className="text-slate-800 leading-relaxed text-sm sm:text-base font-serif">"{review.original_text}"</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {review.segments
                  .filter(s => !selectedAspect || s.aspect_category === selectedAspect)
                  .map((segment, idx) => (
                  <div key={idx} className={`
                    flex flex-col gap-1 px-3 py-2 rounded-md border text-xs sm:text-sm
                    ${segment.sentiment === SentimentLabel.POSITIVE ? 'bg-green-50 border-green-100 text-green-900' : 
                      segment.sentiment === SentimentLabel.NEGATIVE ? 'bg-red-50 border-red-100 text-red-900' : 
                      'bg-slate-50 border-slate-200 text-slate-900'}
                  `}>
                    <div className="flex items-center gap-2">
                         <span className="font-bold uppercase text-[10px] tracking-wide opacity-70">{segment.aspect_category}</span>
                         <span className={`px-1 rounded text-[10px] border ${
                            segment.sentiment === SentimentLabel.POSITIVE ? 'border-green-200 bg-green-100' :
                            segment.sentiment === SentimentLabel.NEGATIVE ? 'border-red-200 bg-red-100' : 'border-slate-200 bg-slate-100'
                         }`}>
                             {segment.sentiment_score.toFixed(2)}
                         </span>
                    </div>
                    <div>
                        <span className="italic">"...{segment.segment_text}..."</span>
                    </div>
                    <div className="mt-1 pt-1 border-t border-black/5 text-[10px] opacity-70">
                        Triggered by: <span className="font-mono font-bold">{segment.trigger_word}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredReviews.length === 0 && (
             <div className="p-12 text-center text-slate-400">
               No reviews found matching the criteria.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};