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
          <p className="text-sm text-slate-500">Why we chose "Traceable AI" over "Black Box Embeddings"</p>
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
                <h4 className="font-bold text-indigo-900 mb-2">Why not Vector Embeddings?</h4>
                <p className="text-sm text-indigo-800 leading-relaxed">
                   While embeddings (like BERT) are powerful, they are "Black Boxes." When a model says a review is about "Price" based on a vector distance of 0.42, a business user cannot verify <em>why</em>.
                   <br/><br/>
                   Additionally, running high-quality Transformers on 50,000 reviews inside a browser requires downloading 100MB+ models, which hurts performance.
                </p>
             </div>
             <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <h4 className="font-bold text-emerald-900 mb-2">Our "Glass Box" Solution</h4>
                <p className="text-sm text-emerald-800 leading-relaxed">
                   We prioritize <strong>Traceability</strong>. Every categorization in this app is triggered by a specific keyword or phrase that you can see.
                   <br/><br/>
                   To solve the "Context" problem without vectors, we use <strong>Bigram Analysis</strong> (detecting 2-word phrases like "Battery Life" vs "Life") combined with Gemini's reasoning to build the rule set.
                </p>
             </div>
          </div>

          <div className="relative">
             <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
             
             {/* Step 1 */}
             <div className="relative pl-12 mb-8">
               <div className="absolute left-0 top-1 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm border-4 border-white">1</div>
               <h4 className="text-base font-bold text-slate-900">Secure Ingestion</h4>
               <p className="text-sm text-slate-600 mt-1">
                 All 50k+ reviews are processed locally. No data leaves your machine except for the small, anonymized statistical fingerprint sent to Gemini.
               </p>
             </div>

             {/* Step 2 */}
             <div className="relative pl-12 mb-8">
               <div className="absolute left-0 top-1 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm border-4 border-white">2</div>
               <h4 className="text-base font-bold text-slate-900">Context-Aware Signal Extraction</h4>
               <p className="text-sm text-slate-600 mt-1">
                 We scan the entire dataset for <strong>Bigrams</strong> (2-word phrases). 
                 <br/>This allows us to distinguish between specific concepts (e.g., "Fast Shipping" vs "Product Speed") before we even categorize them.
                 <br/><span className="font-mono text-xs text-slate-400">Technique: N-Gram Tokenization + Stopword Filtering</span>
               </p>
             </div>

             {/* Step 3 */}
             <div className="relative pl-12 mb-8">
               <div className="absolute left-0 top-1 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm border-4 border-white">3</div>
               <h4 className="text-base font-bold text-slate-900">AI Taxonomy Generation</h4>
               <p className="text-sm text-slate-600 mt-1">
                 Gemini analyzes the "Signals" (Step 2) to build a dynamic Logic Layer.
                 <br/>It decides the number of categories based on the data complexity, not a hardcoded limit.
               </p>
             </div>

             {/* Step 4 */}
             <div className="relative pl-12">
               <div className="absolute left-0 top-1 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm border-4 border-white">4</div>
               <h4 className="text-base font-bold text-slate-900">Deterministic Scoring</h4>
               <p className="text-sm text-slate-600 mt-1">
                 We apply the AI-generated rules to the full dataset using VADER sentiment analysis.
                 <br/>Results are 100% reproducible and explainable.
               </p>
             </div>
          </div>

        </div>
      )}
    </div>
  );
};