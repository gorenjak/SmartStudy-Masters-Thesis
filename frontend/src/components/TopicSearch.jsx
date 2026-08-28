import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const TopicSearch = ({ userId }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationErrorCount, setGenerationErrorCount] = useState(0);
  const [showGenerationError, setShowGenerationError] = useState(false);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsGenerating(true);

    try {
      const response = await fetch(`${API_URL}/api/generate-lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: query,
          userId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGenerationErrorCount(0);
        setDailyLimitReached(false);
        setShowGenerationError(false);
        navigate(`/lesson/${data.lesson_id}`);
      } else {
        if (response.status === 429 && data.error === 'daily_generation_limit') {
          setDailyLimitReached(true);
          setShowGenerationError(true);
          return;
        }

        setDailyLimitReached(false);
        setGenerationErrorCount(prev => prev + 1);
        setShowGenerationError(true);
      }
    } catch (error) {
      console.error("Search error:", error);

      setDailyLimitReached(false);
      setGenerationErrorCount(prev => prev + 1);
      setShowGenerationError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-12 px-4">
      {showGenerationError && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full p-6 text-center">
            <div className="mx-auto mb-4 w-10 h-10 rounded-full bg-[#eef8fe] flex items-center justify-center text-[#0a86dd]">
              <AlertCircle size={22} />
            </div>

            <h3 className="text-[18px] font-black text-slate-900 mb-2">
              {dailyLimitReached
                ? t('daily_generation_limit_title')
                : generationErrorCount >= 2
                  ? t('generation_unavailable')
                  : t('generation_failed_title')}
            </h3>

            <p className="text-[14px] text-slate-500 leading-6 mb-5">
              {dailyLimitReached ? (
                <>
                  {t('daily_generation_limit_line1')}<br />
                  {t('daily_generation_limit_line2')}
                </>
              ) : generationErrorCount >= 2 ? (
                <>
                  {t('generation_use_existing_line1')}<br />
                  {t('generation_use_existing_line2')}
                </>
              ) : (
                <>
                  {t('generation_retry_line1')}<br />
                  {t('generation_retry_line2')}
                </>
              )}
            </p>

            <button
              type="button"
              onClick={() => setShowGenerationError(false)}
              className="w-full h-[42px] bg-[#0a86dd] text-white rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-[#086fb8] transition-all"
            >
              {dailyLimitReached || generationErrorCount >= 2
                ? t('understand')
                : t('try_again')}
            </button>
          </div>
        </div>
      )}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 items-center justify-center">
        <div className="relative flex-1 w-full group">
            <input
            type="text"
            placeholder={t('search_placeholder')}
            className="w-full p-2 pl-12 text-base bg-white border border-slate-200 rounded-xl shadow-sm 
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isGenerating}
            />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        
        <button
            type="submit"
            disabled={isGenerating}
            className="h-[40px] bg-[#0a86dd] text-white px-6 rounded-xl font-semibold text-sm
                    hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center disabled:bg-slate-300 shadow-sm"
        >
            {isGenerating ? (
            <Loader2 className="animate-spin h-4 w-4" />
            ) : (
            <span className="whitespace-nowrap">{t('explore_button')}</span>
            )}
        </button>
        </form>
      
      {isGenerating && (
        <p className="text-center mt-4 text-sm text-slate-500 animate-pulse font-medium">
          {t('generating_message')}
        </p>
      )}
    </div>
  );
};

export default TopicSearch;