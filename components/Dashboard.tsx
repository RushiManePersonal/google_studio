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
  const avgSentiment = result.aspects.reduce((acc, curr) => acc + (curr.net_sentiment * curr.count), 0) / (totalSegments || 1);

  const handleAspectClick = (aspect: string) => {
    setSelectedAspect(aspect);
    setPage(1); // Reset to page 1 on filter change
  }

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* SECTION 1: STATISTICAL PROOF (DATA SIGNALS) */}
      {/* This makes the analysis interpretable by showing the inputs that led to the taxonomy */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Corpus Signals (The Proof)
            </h3>
            <p className="text-sm text-slate-500">
                These are the most frequent significant nouns found in your {result.processedCount.toLocaleString()} reviews. 
                Our AI used these exact signals to discover the categories below.
            </p>
        </div>
        
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
            {result.topWords.slice(0, 60).map((stat: WordStat, idx) => {
                // Visual weighting based on frequency rank
                const opacity = Math.max(0.4, 1 - (idx / 60));
                const scale = idx < 5 ? 'text-base font-bold' : idx < 20 ? 'text-sm font-medium' : 'text-xs';
                
                return (
                    <div 
                        key={stat.word} 
                        className={`px-3 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 ${scale}`}
                        style={{ opacity }}
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
          <p className="text-sm font-medium text-slate-500">Reviews Analyzed</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{result.processedCount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Aspects Detected</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{result.aspects.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Mentions Found</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalSegments.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Net Sentiment</p>
          <div className="flex items-center gap-2 mt-1">
            <p className={`text-2xl font-bold ${avgSentiment > 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                   return (
                     <>
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="bg-green-50 p-2 rounded text-green-700 font-medium">{stats.positive} Pos</div>
                        <div className="bg-red-50 p-2 rounded text-red-700 font-medium">{stats.negative} Neg</div>
                        <div className="bg-slate-50 p-2 rounded text-slate-700 font-medium">{stats.neutral} Neu</div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Definition Keywords</h4>
                        <p className="text-xs text-slate-500 mb-2">These terms were used to scan the reviews.</p>
                        <div className="flex flex-wrap gap-2">
                          {(stats.keywords || []).map(k => (
                            <span key={k} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                         <p className="text-xs uppercase font-bold text-slate-400 mb-1">Interpretation</p>
                         <p>
                           Reviews mentioning this aspect tend to be 
                           <span className={`font-semibold ${stats.net_sentiment > 0.2 ? ' text-green-600' : stats.net_sentiment < -0.2 ? ' text-red-600' : ' text-slate-600'}`}>
                             {stats.net_sentiment > 0.2 ? ' Positive' : stats.net_sentiment < -0.2 ? ' Negative' : ' Mixed/Neutral'}
                           </span>.
                           Calculated from {stats.count} distinct text segments.
                         </p>
                      </div>
                     </>
                   )
                 })()}
              </div>
            ) : (
               <div className="grid grid-cols-1 gap-3">
                 {result.aspects.map(aspect => (
                   <div 
                    key={aspect.name} 
                    onClick={() => handleAspectClick(aspect.name)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all group"
                   >
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-100 transition-opacity" />
                        <div>
                          <p className="font-medium text-slate-800">{aspect.name}</p>
                          <p className="text-xs text-slate-500">{(aspect.keywords || []).slice(0,3).join(', ')}</p>
                        </div>
                     </div>
                     <div className="text-right">
                       <span className={`text-sm font-bold ${aspect.net_sentiment > 0 ? 'text-green-600' : aspect.net_sentiment < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                         {aspect.net_sentiment > 0 ? '+' : ''}{aspect.net_sentiment.toFixed(2)}
                       </span>
                       <p className="text-xs text-slate-400">{aspect.count} segs</p>
                     </div>
                   </div>
                 ))}
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
              {filteredReviews.length} matches
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