import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, ChevronRight, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const Quiz = ({ predefinedQuiz, userId, lessonId, onComplete }) => {
  const { i18n, t } = useTranslation();

  const [questions, setQuestions] = useState(predefinedQuiz || []);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const checkedRef = useRef(false);

  const isSl = i18n.language === 'sl';

  useEffect(() => {
    const fetchMissingQuiz = async () => {
      if (!questions || questions.length === 0) {
        setLoading(true);

        try {
          const response = await axios.get(
            `${API_URL}/api/get-content/${lessonId}`
          );

          if (
            response.data &&
            response.data.quiz &&
            response.data.quiz.length > 0
          ) {
            setQuestions(response.data.quiz);
          } else {
            setQuestions([]);
          }
        } catch (err) {
          console.error('Napaka pri pridobivanju kviza:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMissingQuiz();
  }, [lessonId, questions.length, userId]);

  const capitalize = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const getBilingualValue = (obj) => {
    if (!obj) return '';
    const currentLang = i18n.language;
    return obj[currentLang] || obj.sl || obj.en || '';
  };

  if (loading) {
    return (
      <div className="w-full max-w-[500px] mx-auto">
        <div className="p-5 text-center bg-white rounded-[1rem] shadow-sm border border-dashed border-[#bfe3f8]">
          <Loader2 className="w-5 h-5 text-[#0a86dd] animate-spin mx-auto mb-2" />

          <p className="text-[11px] text-slate-500 font-medium animate-pulse">
            {t('loading_quiz') ||
              (isSl
                ? 'Sestavljam vprašanja...'
                : 'Composing questions...')}
          </p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="w-full max-w-[500px] mx-auto">
        <div className="p-4 text-center bg-slate-50 rounded-[1rem] border border-slate-100">
          <p className="text-[11px] text-slate-400 italic">
            {t('quiz_unavailable') ||
              (isSl
                ? 'Kviz trenutno ni na voljo.'
                : 'Quiz is currently unavailable.')}
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const displayQuestion = capitalize(
    getBilingualValue(currentQuestion.q)
  );
  const displayOptions =
    getBilingualValue(currentQuestion.options) || [];
  const correctIdx = currentQuestion.a_index;

  const handleCheckAnswer = () => {
    if (
      selected === null ||
      submitted ||
      checkedRef.current
    ) {
      return;
    }

    checkedRef.current = true;

    const isCorrect = selected === correctIdx;

    if (isCorrect) {
      setScore((prev) =>
        Math.min(prev + 1, questions.length)
      );
    }

    setSubmitted(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
      setSubmitted(false);
      checkedRef.current = false;
    } else {
      onComplete({
        total: questions.length,
        correct: Math.min(score, questions.length)
      });
    }
  };

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="bg-white p-1 transition-all animate-in fade-in duration-500">
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-[#0a86dd] uppercase tracking-[0.14em] mb-1">
              {t('quiz_question') ||
                (isSl ? 'VPRAŠANJE' : 'QUESTION')}
            </span>

            <span className="text-[16px] sm:text-[18px] font-black text-slate-800 leading-none">
              {currentIndex + 1}{' '}
              <span className="text-slate-300">/</span>{' '}
              {questions.length}
            </span>
          </div>

          <div className="h-1 w-16 sm:w-20 bg-slate-100 rounded-full overflow-hidden mt-1 shrink-0">
            <div
              className="h-full bg-[#0a86dd] transition-all duration-700 ease-out"
              style={{
                width: `${
                  ((currentIndex + 1) /
                    questions.length) *
                  100
                }%`
              }}
            />
          </div>
        </div>

        <div className="bg-slate-50 px-3 py-3.5 rounded-[0.9rem] border border-slate-100 mb-3 shadow-inner">
          <h3 className="text-[14px] sm:text-[15px] font-bold text-slate-800 leading-5">
            {displayQuestion}
          </h3>
        </div>

        <div className="grid gap-2">
          {displayOptions.map((opt, idx) => {
            const isCorrect = idx === correctIdx;
            const isSelected = selected === idx;

            let btnClass =
              'border-slate-100 bg-white hover:border-[#bfe3f8] hover:bg-[#f3faff] text-slate-600';

            if (submitted) {
              if (isCorrect) {
                btnClass =
                  'border-green-500 bg-green-50 text-green-700 shadow-sm';
              } else if (isSelected) {
                btnClass =
                  'border-red-500 bg-red-50 text-red-700';
              } else {
                btnClass =
                  'border-slate-50 opacity-40 text-slate-400';
              }
            } else if (isSelected) {
              btnClass =
                'border-[#0a86dd] bg-[#e9f5fd] text-[#0a86dd] ring-1 ring-[#d8eefc]';
            }

            return (
              <button
                key={idx}
                disabled={submitted}
                onClick={() => setSelected(idx)}
                className={`w-full px-3 py-2.5 rounded-[0.8rem] text-left font-bold transition-all border flex justify-between items-center group active:scale-[0.98] ${btnClass}`}
              >
                <span className="pr-2 text-[12px] sm:text-[13px] leading-5">
                  {capitalize(opt)}
                </span>

                {submitted && isCorrect && (
                  <CheckCircle2
                    size={14}
                    className="text-green-500 shrink-0"
                  />
                )}

                {submitted &&
                  isSelected &&
                  !isCorrect && (
                    <XCircle
                      size={14}
                      className="text-red-500 shrink-0"
                    />
                  )}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          {!submitted ? (
            <button
              disabled={selected === null}
              onClick={handleCheckAnswer}
              className="w-full py-2.5 bg-[#0a86dd] text-white rounded-[0.8rem] font-black text-[10px] sm:text-[11px] hover:bg-[#086fb8] transition-all disabled:opacity-30 uppercase tracking-[0.1em] shadow-md"
            >
              {t('check_answer') ||
                (isSl
                  ? 'PREVERI ODGOVOR'
                  : 'CHECK ANSWER')}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full py-2.5 bg-[#0a86dd] text-white rounded-[0.8rem] font-black text-[10px] sm:text-[11px] hover:bg-[#086fb8] transition-all animate-in zoom-in-95 duration-300 uppercase tracking-[0.1em] flex items-center justify-center gap-1.5 shadow-md"
            >
              {currentIndex <
              questions.length - 1 ? (
                <>
                  {t('next_question') ||
                    (isSl
                      ? 'NASLEDNJE VPRAŠANJE'
                      : 'NEXT QUESTION')}

                  <ChevronRight size={14} />
                </>
              ) : (
                t('finish_quiz') ||
                (isSl
                  ? 'ZAKLJUČI KVIZ'
                  : 'FINISH QUIZ')
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;