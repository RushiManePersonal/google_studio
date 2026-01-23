import React, { useState } from 'react';

export const Methodology: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div>
          <h3 className="text-lg font-bold text-slate-900">Methodology & Architecture</h3>
          <p className="text-sm text-slate-500">How we use Statistics (PMI) to separate "Signals" from "Noise"</p>
        </div>
        <svg 
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="p-6 border-t border-slate-200 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
             <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-2">The "PMI" Algorithm</h4>
                <p className="text-sm text-indigo-800 leading-relaxed">
                   We use <strong>Pointwise Mutual Information</strong> to filter noise.
                   <br/><br/>
                   Instead of just counting words (which makes "it's" look important), PMI compares how often two words appear together vs. how often they appear alone.
                   <br/><br/>
                   <em>Result:</em> "Texture it's" gets a low score (Noise). "Battery Life" gets a high score (Signal).
                </p>
             </div>
             <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <h4 className="font-bold text-emerald-900 mb-2">Sentiment Proximity</h4>
                <p className="text-sm text-emerald-800 leading-relaxed">
                   We filter the vocabulary against a <strong>Sentiment Lexicon</strong>. 
                   <br/><br/>
                   A noun is only considered a "Feature" if it is mathematically distinct (High PMI) AND is not an adjective itself. This ensures we identify <em>what</em> users are talking about, not just <em>how</em> they feel.
                </p>
             </div>
          </div>

          <div className="relative">
             <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
             
             {/* Step 1 */}
             <div className="relative pl-12 mb-8">
               <div className="absolute left-0 top-1 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm border-4 border-white">1</div>
               <h4 className="text-base font-bold text-slate-900">Ingestion & Tokenization</h4>
               <p className="text-sm text-slate-600 mt-1">
                 Reviews are broken into streams of tokens. We perform two passes: one for single words, one for pairs.
               </p>
             </div>

             {/* Step 2 */}
             <div className="relative pl-12 mb-8">
               <div className="absolute left-0 top-1 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm border-4 border-white">2</div>
               <h4 className="text-base font-bold text-slate-900">PMI Scoring Engine</h4>
               <p className="text-sm text-slate-600 mt-1">
                 We calculate <span className="font-mono text-xs bg-slate-100 px-1">log(P(x,y) / P(x)P(y))</span> for every phrase. 
                 <br/>This creates a statistical fingerprint of the dataset, automatically discarding grammatical noise without needing a massive blocklist.
               </p>
             </div>

             {/* Step 3 */}
             <div className="relative pl-12 mb-8">
               <div className="absolute left-0 top-1 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm border-4 border-white">3</div>
               <h4 className="text-base font-bold text-slate-900">AI Logic Layer</h4>
               <p className="text-sm text-slate-600 mt-1">
                 Gemini receives the high-PMI signals (e.g., "customer service", "shipping speed") and clusters them into human-readable categories.
               </p>
             </div>

             {/* Step 4 */}
             <div className="relative pl-12">
               <div className="absolute left-0 top-1 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm border-4 border-white">4</div>
               <h4 className="text-base font-bold text-slate-900">Aspect-Based Sentiment</h4>
               <p className="text-sm text-slate-600 mt-1">
                 We map every sentence in the dataset back to the AI-generated categories and score the sentiment using VADER.
               </p>
             </div>
          </div>

        </div>
      )}
    </div>
  );
};