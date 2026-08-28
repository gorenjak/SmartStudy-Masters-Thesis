import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { ChevronRight, BrainCircuit } from 'lucide-react';
import logo from '../assets/SmartStudy.png';
import { CircleHelp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const InitialStyleQuiz = ({ user, onComplete }) => {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ageGroup, setAgeGroup] = useState('');
  const [aiUsage, setAiUsage] = useState('');
  const [learningGoal, setLearningGoal] = useState('');

  const [tieChoiceRequired, setTieChoiceRequired] = useState(false);

  const steps = [
    {
      type: 'profile',
      key: 'profile.age',
      value: ageGroup,
      setValue: setAgeGroup,
      options: [
        ['18-19', 'profile.age_18_19'],
        ['20-24', 'profile.age_20_24'],
        ['25-29', 'profile.age_25_29'],
        ['30+', 'profile.age_30_plus']
      ]
    },
    {
      type: 'profile',
      key: 'profile.ai_usage',
      value: aiUsage,
      setValue: setAiUsage,
      options: [
        ['never', 'profile.never'],
        ['rarely', 'profile.rarely'],
        ['sometimes', 'profile.sometimes'],
        ['often', 'profile.often'],
        ['very_often', 'profile.very_often']
      ]
    },
    {
      type: 'profile',
      key: 'profile.learning_goal',
      value: learningGoal,
      setValue: setLearningGoal,
      options: [
        ['quick_understanding', 'profile.goal_quick'],
        ['deep_understanding', 'profile.goal_deep'],
        ['exam_preparation', 'profile.goal_exam'],
        ['revision', 'profile.goal_revision']
      ]
    },
    { type: 'style', id: 'q1', styleType: 'visual', key: 'style_quiz.q1' },
    { type: 'style', id: 'q2', styleType: 'verbal', key: 'style_quiz.q2' },
    { type: 'style', id: 'q3', styleType: 'visual', key: 'style_quiz.q3' },
    { type: 'style', id: 'q4', styleType: 'verbal', key: 'style_quiz.q4' },
    { type: 'style', id: 'q5', styleType: 'visual', key: 'style_quiz.q5' },
    { type: 'style', id: 'q6', styleType: 'verbal', key: 'style_quiz.q6' }
  ];

  const currentItem = steps[currentStep];

  if (!currentItem) {
    return null;
  }

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  const canContinue =
    currentItem.type === 'profile'
      ? !!currentItem.value
      : !!responses[currentItem.id];

  const handleSelect = (value) => {
    if (currentItem.type === 'profile') {
      currentItem.setValue(value);
      return;
    }

    setResponses((prev) => ({
      ...prev,
      [currentItem.id]: value
    }));

    if (currentStep < steps.length - 1) {
      setTimeout(() => {
        setCurrentStep((prev) =>
          Math.min(prev + 1, steps.length - 1)
        );
      }, 400);
    }
  };

  const handleNext = () => {
    if (!canContinue) {
      alert(t('profile.error_incomplete'));
      return;
    }

    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const styleQuestions = steps.filter(
    (step) => step.type === 'style'
  );

  const handleProfileContinue = () => {
    if (!ageGroup || !aiUsage || !learningGoal) {
      alert(t('profile.error_incomplete'));
      return;
    }

    setCurrentStep(0);
  };

  const saveStyle = async (
    finalStyle,
    visualScore,
    verbalScore,
    tieUsed
  ) => {
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/set-user-style`,
        {
          userId: user.userId,
          cognitiveStyle: finalStyle,
          activeStyle: finalStyle,
          language: i18n.language,
          styleQuizResponses: responses,
          visualScore,
          verbalScore,
          tieChoiceUsed: tieUsed,

          ageGroup,
          aiUsage,
          learningGoal
        }
      );

      if (response.status === 200) {
        onComplete(finalStyle, {
          ageGroup,
          aiUsage,
          learningGoal
        });
      }
    } catch (error) {
      console.error('Error saving style:', error);

      alert(
        i18n.language === 'sl'
          ? 'Napaka pri shranjevanju. Poskusite znova.'
          : 'An error occurred while saving. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!ageGroup || !aiUsage || !learningGoal) {
      alert(t('profile.error_incomplete'));
      return;
    }

    let visualScore = 0;
    let verbalScore = 0;

    styleQuestions.forEach((q) => {
      const val = Number(responses[q.id]);

      if (q.styleType === 'visual') {
        visualScore += val;
      } else {
        verbalScore += val;
      }
    });

    if (visualScore === verbalScore) {
      setTieChoiceRequired(true);
      return;
    }

    const finalStyle =
      visualScore > verbalScore
        ? 'visual'
        : 'verbal';

    await saveStyle(
      finalStyle,
      visualScore,
      verbalScore,
      false
    );
  };

  const handleTieChoice = async (selectedStyle) => {
    let visualScore = 0;
    let verbalScore = 0;

    styleQuestions.forEach((q) => {
      const val = Number(responses[q.id]);

      if (q.styleType === 'visual') {
        visualScore += val;
      } else {
        verbalScore += val;
      }
    });

    await saveStyle(
      selectedStyle,
      visualScore,
      verbalScore,
      true
    );
  };

  const ChoiceGroup = ({ label, value, onChange, options }) => (
    <div>
      <label className="block text-[12px] font-black text-slate-600 uppercase tracking-wide mb-2">
        {label}
      </label>

      <div className="space-y-2">
        {options.map((item) => {
          const selected = value === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all ${
                selected
                  ? 'bg-[#eef8fe] border-[#0a86dd] text-[#0a86dd] shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-[#bfe3f8]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selected
                    ? 'border-[#0a86dd]'
                    : 'border-slate-300'
                }`}
              >
                {selected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0a86dd]" />
                )}
              </span>

              <span className="text-sm font-semibold">
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 font-sans text-slate-900">
      <div
        className={`w-full bg-white rounded-[1.75rem] shadow-lg border border-slate-200 p-5 md:p-6 relative overflow-hidden ${
          currentItem.type === 'profile'
            ? 'max-w-2xl'
            : 'max-w-xl'
        }`}
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-200">
          <div
            className="h-full bg-[#0a86dd] transition-all duration-700 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <header className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-3 bg-[#0a86dd] rounded-xl text-white shadow-md shadow-[#0a86dd]-200 shrink-0">
              <BrainCircuit size={22} />
            </div>

            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                {currentItem.type === 'profile'
                  ? t('profile.header_title')
                  : t('style_quiz.title')}
              </h2>

              <p className="text-sm md:text-base text-slate-600 font-medium mt-1 italic leading-snug">
                {currentItem.type === 'profile'
                  ? t('profile.header_description')
                  : t('style_quiz.description')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative group">
              <a
                href="mailto:nina.gorenjak1@student.um.si"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#0a86dd] hover:bg-slate-100 transition"
              >
                <CircleHelp size={18} />
              </a>

              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-slate-900 text-white text-xs p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <p className="font-semibold">
                  {t("login.support_title")}
                </p>

                <p className="mt-1 text-slate-300">
                  nina.gorenjak1@student.um.si
                </p>
              </div>
            </div>

            <div className="inline-flex bg-slate-200 p-0.5 rounded-lg border border-slate-300 shrink-0">
              {['sl', 'en'].map((lng) => (
                <button
                  key={lng}
                  type="button"
                  onClick={() => i18n.changeLanguage(lng)}
                  className={`px-2 py-1 rounded-md text-[11px] font-black uppercase transition-all ${
                    i18n.language === lng
                      ? 'bg-white text-[#0a86dd] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lng}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="min-h-[220px]">
          <div className="mb-4">
            <span className="inline-block px-2.5 py-1 bg-indigo-50 text-[#0a86dd] rounded-full text-[10px] font-black uppercase tracking-tight mb-3">
              {t('quiz_question')} {currentStep + 1} / {steps.length}
            </span>

            <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-snug">
              {t(currentItem.key)}
            </h3>
          </div>

          {currentItem.type === 'profile' ? (
            <div className="space-y-2 mb-4">
              {currentItem.options.map(([value, labelKey]) => {
                const selected = currentItem.value === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleSelect(value)}
                    className={`w-full min-h-[52px] rounded-xl font-black text-[13px] md:text-sm transition-all border-2 flex items-center gap-3 px-4 text-left ${
                      selected
                        ? 'bg-[#0a86dd] border-[#0a86dd] text-white scale-[1.01] shadow-lg shadow-indigo-100'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-[#0a86dd]'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected
                          ? 'border-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {selected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </span>

                    <span>{t(labelKey)}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-5 gap-2.5 mb-4">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSelect(num)}
                    className={`h-12 md:h-12 rounded-xl font-black text-lg md:text-xl transition-all border-2 ${
                      responses[currentItem.id] === num
                        ? 'bg-[#0a86dd] border-[#0a86dd] text-white scale-[1.03] shadow-lg shadow-indigo-100'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-[#0a86dd]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.12em] px-1 mb-6">
                <span className="max-w-[90px] leading-snug">
                  {t('survey.scale_left')}
                </span>

                <span className="max-w-[90px] text-right leading-snug">
                  {t('survey.scale_right')}
                </span>
              </div>
            </>
          )}

          {tieChoiceRequired && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="w-full max-w-2xl bg-white rounded-[1.75rem] border border-slate-200 shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-[#0a86dd] rounded-xl text-white">
                    <BrainCircuit size={22} />
                  </div>

                  <h3 className="text-xl font-black text-slate-900">
                    {t('style_quiz.tie_title')}
                  </h3>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {t('style_quiz.tie_description')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleTieChoice('visual')}
                    className="px-4 py-4 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-bold transition-all duration-200 hover:border-[#0a86dd] hover:text-[#0a86dd] hover:bg-[#eef8fe] active:scale-[0.98] disabled:opacity-60"
                  >
                    {t('style_quiz.tie_visual')}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleTieChoice('verbal')}
                    className="px-4 py-4 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-bold transition-all duration-200 hover:border-[#0a86dd] hover:text-[#0a86dd] hover:bg-[#eef8fe] active:scale-[0.98] disabled:opacity-60"
                  >
                    {t('style_quiz.tie_verbal')}
                  </button>
                </div>

                {isSubmitting && (
                  <p className="mt-4 text-center text-sm font-semibold text-slate-500">
                    {t('style_quiz.saving')}
                  </p>
                )}
              </div>
            </div>
          )}
        </main>

        <footer className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={currentStep === 0}
            onClick={() =>
              setCurrentStep((prev) => Math.max(prev - 1, 0))
            }
            className="px-3 py-2 text-slate-500 font-black uppercase text-[11px] tracking-wider hover:text-[#0a86dd] disabled:opacity-0"
          >
            {t('back_generic')}
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !canContinue}
              className="px-6 py-2.5 bg-[#0a86dd] text-white rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-blue-200 hover:text-slate-500 transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? '...' : t('style_quiz.submit')}
              <ChevronRight size={16} />
            </button>
          ) : currentItem.type === 'profile' ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canContinue}
              className="px-6 py-2.5 bg-[#0a86dd] text-white rounded-xl font-black uppercase tracking-wider text-[11px] hover:bg-blue-200 hover:text-slate-500 transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-70"
            >
              {t('next_generic')}
              <ChevronRight size={16} />
            </button>
          ) : (
            <img
              src={logo}
              alt="SmartStudy logo"
              className="h-8 w-auto object-contain opacity-60"
            />
          )}
        </footer>
      </div>
    </div>
  );
};

export default InitialStyleQuiz;