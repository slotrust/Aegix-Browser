import React, { useEffect, useState } from 'react';
import { useBrowserStore } from '../store/useBrowserStore';
import { Search, Globe, Shield, ExternalLink, Sparkles } from 'lucide-react';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export function InternalSearch({ query }: { query: string }) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(true);
  const { activeTabId, navigate } = useBrowserStore();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setAiLoading(true);
    setAiSummary('');

    // Use our proxy API to get real web search results
    const fetchSearch = async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (!active) return;

        if (data && data.length > 0) {
          setResults(data);
        } else {
          setResults([{
             title: "No results found", snippet: "Please try another query.", url: "#"
          }]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    // AI Overview using Gemini API
    const fetchAiSummary = async () => {
      try {
        const res = await fetch(`/api/search-summary?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (active) {
            setAiSummary(data.summary || "No summary available.");
        }
      } catch (err) {
         if (active) setAiSummary("Couldn't generate AI overview at this time.");
      } finally {
         if (active) setAiLoading(false);
      }
    };

    fetchSearch();
    fetchAiSummary();

    return () => { active = false; };
  }, [query]);

  return (
    <div className="w-full h-full bg-[#1C1E20] overflow-y-auto pt-8">
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <header className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-800">
          <div className="w-12 h-12 bg-[#fb542b] rounded-lg flex items-center justify-center">
            <Search className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-100">Aegix Search</h1>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <Shield size={14} className="text-[#fb542b]" /> Real privacy, real results
            </p>
          </div>
        </header>

        {query.trim().length > 0 && (
           <div className="mb-8 bg-[#2A2B2D]/50 border border-[#0077AA]/40 rounded-xl p-5 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#44EEFF]/5 rounded-bl-full pointer-events-none" />
             <div className="flex items-center gap-2 mb-3 text-[#44EEFF]">
               <Sparkles size={20} />
               <h2 className="font-semibold text-lg">Aegix AI Overview</h2>
             </div>
             {aiLoading ? (
                <div className="space-y-2 animate-pulse mt-2">
                  <div className="h-4 bg-gray-700 w-full rounded" />
                  <div className="h-4 bg-gray-700 w-5/6 rounded" />
                  <div className="h-4 bg-gray-700 w-4/6 rounded" />
                </div>
             ) : (
                <p className="text-gray-200 text-sm leading-relaxed relative z-10">{aiSummary}</p>
             )}
           </div>
        )}

        {loading ? (
          <div className="space-y-8 animate-pulse">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="max-w-2xl">
                 <div className="h-4 bg-gray-800 w-48 rounded mb-2" />
                 <div className="h-6 bg-gray-800 w-3/4 rounded mb-2" />
                 <div className="h-4 bg-gray-800 w-full rounded mb-1" />
                 <div className="h-4 bg-gray-800 w-5/6 rounded" />
               </div>
             ))}
          </div>
        ) : (
          <div className="space-y-8">
            <p className="text-sm text-gray-400">
              Showing results for <span className="font-semibold text-gray-200">{query}</span> from open sources
            </p>
            
            {results.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-100 mb-2">No direct results found</h3>
                <p className="text-gray-500">We searched securely but couldn't find matches. Try different keywords.</p>
              </div>
            ) : (
              results.map((result, i) => (
                <div key={i} className="max-w-2xl group">
                  <div className="flex items-center text-sm text-gray-400 mb-1 gap-2">
                    {result.url && result.url !== '#' && (
                      <img src={`https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}&sz=32`} className="w-4 h-4 rounded-sm" alt="" />
                    )}
                    <span className="truncate">{result.url}</span>
                  </div>
                  <button 
                    onClick={() => activeTabId && navigate(activeTabId, result.url)}
                    className="text-xl text-[#8EBBFF] hover:underline font-medium text-left mb-1 flex items-center gap-2"
                  >
                    {result.title}
                  </button>
                  <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
                    {result.snippet}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
