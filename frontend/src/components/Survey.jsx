import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ClipboardList, ArrowLeft, CheckCircle2 } from 'lucide-react';
import logo from '../assets/SmartStudy.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const Survey = ({ user, config, onFinish }) => {
  const { t, i18n } = useTranslation();

  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAdvancing, setIsAdvancing] = useState(false);

  const questions = useMemo(
    () => [
      { id: 'sus1', key: 'survey.sus1' },
      { id: 'sus2', key: 'survey.sus2' },
      { id: 'sus3', key: 'survey.sus3' },
      { id: 'sus4', key: 'survey.sus4' },
      { id: 'sus5', key: 'survey.sus5' },
      { id: 'sus6', key: 'survey.sus6' },
      { id: 'sus7', key: 'survey.sus7' },
      { id: 'sus8', key: 'survey.sus8' },
      { id: 'sus9', key: 'survey.sus9' },
      { id: 'sus10', key: 'survey.sus10' },

      { id: 'trust1', key: 'survey.trust1' },
      { id: 'trust2', key: 'survey.trust2' },
      { id: 'trust3', key: 'survey.trust3' },

      { id: 'privacy1', key: 'survey.privacy1' },
      { id: 'privacy2', key: 'survey.privacy2' },
      { id: 'privacy3', key: 'survey.privacy3' },

      { id: 'acceptance1', key: 'survey.acceptance1' },
      { id: 'acceptance2', key: 'survey.acceptance2' },
      { id: 'acceptance3', key: 'survey.acceptance3' },
      
      { id: 'perceivedPersonalization1', key: 'survey.perceivedPersonalization1' },
      { id: 'perceivedPersonalization2', key: 'survey.perceivedPersonalization2' },
      { id: 'perceivedPersonalization3', key: 'survey.perceivedPersonalization3' },
      
      ...(config?.variant === 'adaptive'
        ? [
            { id: 'adaptation_notice', key: 'survey.adaptation_notice' }
          ]
        : [])
    ],
    []
  );

  const currentQuestion = questions[currentStep];
  const currentValue = responses[currentQuestion.id];
  const usesSevenPointScale =
    currentQuestion?.id.startsWith('trust') ||
    currentQuestion?.id.startsWith('privacy') ||
    currentQuestion?.id.startsWith('perceivedPersonalization');
  const scaleValues = usesSevenPointScale
    ? [1, 2, 3, 4, 5, 6, 7]
    : [1, 2, 3, 4, 5];
  const isLastStep = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questions.length) * 100;
  const isComplete = questions.every((q) => typeof responses[q.id] === 'number');

  const handleSelect = (value) => {
    if (isAdvancing || !currentQuestion) return;

    setErrorMsg('');

    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: value
    }));

    if (!isLastStep) {
      setIsAdvancing(true);

      setTimeout(() => {
        setCurrentStep((prev) =>
          Math.min(prev + 1, questions.length - 1)
        );

        setIsAdvancing(false);
      }, 250);
    }
  };

  const handleNext = () => {
    if (typeof currentValue !== 'number') {
      setErrorMsg(t('survey.error_incomplete'));
      return;
    }

    setErrorMsg('');
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setErrorMsg('');

    if (!user?.userId) {
      setErrorMsg(t('survey.error_not_logged_in'));
      return;
    }

    if (!isComplete) {
      setErrorMsg(t('survey.error_incomplete'));
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`${API_URL}/api/submit-survey`, {
        userId: user.userId,
        variant: config?.variant ?? null,
        cognitiveStyle: config?.cognitiveStyle ?? null,
        language: i18n.language,
        responses
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Survey submit error:', error);
      setErrorMsg(t('survey.error_submit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full flex justify-center">
        <div className="max-w-[600px] w-full px-4 pt-4 pb-0 md:px-5 md:pt-5 md:pb-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#0a86dd] rounded-full" />

          <header className="flex items-start gap-3 mb-4 min-h-[96px]">
            <div className="p-2.5 bg-[#0a86dd] rounded-xl text-white shadow-md shrink-0">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <span className="inline-block px-2.5 py-1 bg-indigo-50 text-[#0a86dd] rounded-full text-[10px] font-black uppercase tracking-tight mb-2">
                {t('survey.sus_trust_privacy_acceptance')}
              </span>

              <h2 className="text-lg md:text-xl font-black text-slate-900 leading-tight">
                {t('survey.thank_you_title')}
              </h2>

              <p className="text-[13px] text-slate-600 font-medium mt-1 italic leading-relaxed">
                {t('survey.thank_you_desc')}
              </p>
            </div>
          </header>

          <main className="border-t border-slate-100 h-[260px]" />

          <footer className="flex items-center justify-between pt-2 border-t border-slate-100 min-h-[44px]">
            <img
              src={logo}
              alt="SmartStudy logo"
              className="h-10 w-auto object-contain opacity-80"
            />

            <button
              type="button"
              onClick={() => {
                if (onFinish) onFinish();
              }}
              className="px-4 py-2.5 bg-[#0a86dd] text-white rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-[#086fb8] transition-all flex items-center gap-2 shadow-md active:scale-95"
            >
              {t('finish_research')}
              <ChevronRight size={15} />
            </button>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="max-w-[600px] w-full px-4 pt-4 pb-0 md:px-5 md:pt-5 md:pb-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0a86dd] rounded-full transition-all duration-700 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <header className="flex items-start gap-3 mb-4 min-h-[96px]">
          <div className="p-2.5 bg-[#0a86dd] rounded-xl text-white shadow-md shrink-0">
            <ClipboardList size={18} />
          </div>

          <div>
            <span className="inline-block px-2.5 py-1 bg-indigo-50 text-[#0a86dd] rounded-full text-[10px] font-black uppercase tracking-tight mb-2">
              {t('survey.sus_trust_privacy_acceptance')}
            </span>
            <h2 className="text-lg md:text-[1.6rem] font-black text-slate-900 leading-tight">
              {t('survey.title')}
            </h2>
            <p className="text-[13px] md:text-[14px] text-slate-600 font-medium mt-1 italic leading-relaxed">
              {t('survey.subtitle')}
            </p>
          </div>
        </header>

        {errorMsg && (
          <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        <main className="flex-1 flex flex-col justify-between min-h-[220px]">
          <div
            className={`mb-4 ${
              usesSevenPointScale ? 'min-h-[80px]' : 'min-h-[120px]'
            }`}
          >
            <span className="inline-block px-2.5 py-1 bg-indigo-50 text-[#0a86dd] rounded-full text-[10px] font-black uppercase tracking-tight mb-3">
              {t('quiz_question')} {currentStep + 1} / {questions.length}
            </span>

            <h3 className="text-[1.1rem] md:text-[1.25rem] font-black text-slate-800 leading-snug">
              {t(currentQuestion.key)}
            </h3>
          </div>

          <div className="min-h-[96px]">
            <div
              className={`grid ${
                usesSevenPointScale ? 'grid-cols-7' : 'grid-cols-5'
              } gap-2 mb-3`}
            >
              {scaleValues.map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={isAdvancing}
                  onClick={() => handleSelect(num)}
                  className={`h-12 rounded-xl font-black text-xl transition-all border-2 disabled:cursor-default ${
                    currentValue === num
                      ? 'bg-[#0a86dd] border-[#0a86dd] text-white scale-[1.02] shadow-md'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-[#0a86dd] hover:text-[#0a86dd]'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.12em] px-1">
              <span className="max-w-[95px] leading-snug">
                {t('survey.scale_left')}
              </span>
              <span className="max-w-[95px] text-right leading-snug">
                {t('survey.scale_right')}
              </span>
            </div>
          </div>
        </main>

        <footer className="flex items-center justify-between pt-2 border-t border-slate-100 min-h-[44px]">
          <button
            disabled={currentStep === 0}
            onClick={handleBack}
            className="px-3 py-2 text-slate-500 font-black uppercase text-[11px] tracking-wider hover:text-[#0a86dd] disabled:opacity-0 flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            {i18n.language === 'sl' ? 'Nazaj' : 'Back'}
          </button>

          <div className="w-[150px] flex justify-end items-center">
            {isLastStep && typeof currentValue === 'number' ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !isComplete}
                className="w-[150px] h-[42px] bg-[#0a86dd] text-white rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-[#086fb8] transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-70"
              >
                {isSubmitting ? '...' : t('survey.submit')}
                <ChevronRight size={15} />
              </button>
            ) : (
              <div className="w-[150px] h-[42px]" />
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Survey;