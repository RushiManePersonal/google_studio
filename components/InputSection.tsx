import React, { useState } from 'react';
import { SAMPLE_REVIEWS } from '../types';

interface InputSectionProps {
  onAnalyze: (reviews: string[]) => void;
  isAnalyzing: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isAnalyzing }) => {
  const [inputText, setInputText] = useState('');

  const handleSample = () => {
    setInputText(SAMPLE_REVIEWS.join('\n\n'));
  };

  const handleSimulateLargeData = () => {
    // Generate 5000 reviews by permuting sample data
    const largeData = [];
    const modifiers = ["Really", "Honestly", "I think", "Actually", "To be honest"];
    const endings = [".", "!", "!!", "..."];
    
    for (let i = 0; i < 5000; i++) {
      const base = SAMPLE_REVIEWS[i % SAMPLE_REVIEWS.length];
      const mod = modifiers[i % modifiers.length];
      const end = endings[i % endings.length];
      // Create slight variations so they aren't identical strings
      largeData.push(`${mod}, ${base.toLowerCase().slice(0, -1)}${end} #${i}`);
    }
    setInputText(largeData.join('\n'));
    // Auto-scroll to top of textarea to show data
    const textarea = document.querySelector('textarea');
    if(textarea) textarea.scrollTop = 0;
  };

  const handleAnalyze = () => {
    if (!inputText.trim()) return;
    const reviews = inputText.split(/\n+/).filter(line => line.trim().length > 0);
    onAnalyze(reviews);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Data Input</h2>
          <p className="text-sm text-slate-500">Paste product reviews (one per line). Supports 10k+ lines.</p>
        </div>
        <div className="flex gap-3">
           <button
            onClick={handleSample}
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 hover:underline"
          >
            Load Sample (6)
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={handleSimulateLargeData}
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 hover:underline"
          >
            Simulate 5,000 Reviews
          </button>
        </div>
      </div>
      
      <textarea
        className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-sm resize-none"
        placeholder="Paste your reviews here..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        disabled={isAnalyzing}
      />
      
      <div className="mt-4 flex justify-between items-center">
         <span className="text-xs text-slate-400">
           {inputText ? `${inputText.split(/\n+/).filter(l => l.trim()).length} lines detected` : ''}
         </span>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !inputText.trim()}
          className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all transform active:scale-95 flex items-center gap-2
            ${isAnalyzing || !inputText.trim() 
              ? 'bg-slate-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Run Analysis'
          )}
        </button>
      </div>
    </div>
  );
};