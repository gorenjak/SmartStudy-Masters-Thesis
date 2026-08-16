import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowLeft, Trophy, FileText, Image as ImageIcon, Maximize2, X, RotateCcw, AlertCircle, Eye, Lightbulb, Book, Check } from 'lucide-react';
import Quiz from '../components/Quiz';
import Mermaid from '../components/Mermaid';
import Survey from '../components/Survey';
import { v4 as uuidv4 } from 'uuid';
import '../Lesson.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const MindMapCard = React.memo(({
  compact = false,
  t,
  currentMindMap,
  mindMapHighlight,
  onOpen
}) => (
  <div
    role="button"
    tabIndex={0}
    aria-label={t('zoom_in')}
    className={`
      bg-white rounded-[18px] overflow-hidden
      transition-all duration-700
      border
      ${
        mindMapHighlight
          ? 'border-[#7cc7ef] ring-2 ring-[#eef8fe] shadow-md'
          : 'border-slate-100 shadow-sm'
      }
    `}
    onClick={onOpen}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen();
      }
    }}
  >
    <div className="px-3 py-2.5 border-b border-[#e9f5fd] bg-[#f3faff] flex justify-between items-center gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <ImageIcon size={14} className="text-[#0a86dd] shrink-0" />
        <span className="text-[9px] font-black text-[#0a86dd] uppercase tracking-[0.16em] truncate">
          {t('visual_summary')}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-md text-[9px] font-bold text-[#0a86dd] shadow-sm shrink-0">
        <Maximize2 size={11} /> {t('zoom_in')}
      </div>
    </div>

    <div
      className={`flex justify-center items-center bg-white overflow-hidden ${
        compact
          ? 'p-2.5 min-h-[280px]'
          : 'p-3 min-h-[340px]'
      }`}
    >
      <Mermaid chart={currentMindMap} />
    </div>
  </div>
));

const LessonView = ({ user, config, setConfig }) => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [content, setContent] = useState(null);
  const [contentMode, setContentMode] = useState('detailed');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.4);
  const [error, setError] = useState(null);
  const [manualShowMindMap, setManualShowMindMap] = useState(false);
  const [manualShowSummary, setManualShowSummary] = useState(false);
  const [mindMapHighlight, setMindMapHighlight] = useState(false);
  const [summaryHighlight, setSummaryHighlight] = useState(false);

  const [autoSuggestActive, setAutoSuggestActive] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [completedLessonsCount, setCompletedLessonsCount] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsEnabled, setRecommendationsEnabled] = useState(true);
  const [adaptiveReviewSuggestion, setAdaptiveReviewSuggestion] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [hasLoggedReadingEnd, setHasLoggedReadingEnd] = useState(false);
  const [adaptiveHighlighting, setAdaptiveHighlighting] = useState(false);
  const [hasTriggeredAdaptiveHighlighting, setHasTriggeredAdaptiveHighlighting] = useState(false);
  const [showAdaptiveToast, setShowAdaptiveToast] = useState(false);
  const [showReadingEndToast, setShowReadingEndToast] = useState(false);
  const [styleSwitchSuggestion, setStyleSwitchSuggestion] = useState(null);
  const [summaryOpenedFeedback, setSummaryOpenedFeedback] = useState(false);
  const [mindMapOpenedFeedback, setMindMapOpenedFeedback] = useState(false);
  const [quizPulse, setQuizPulse] = useState(false);

  const lessonOpenedAtRef = useRef(Date.now());
  const sessionIdRef = useRef(uuidv4());
  const lessonTopRef = useRef(null);
  const mindMapSectionRef = useRef(null);
  const summarySectionRef = useRef(null);
  const readingEndRef = useRef(null);
  const quizSuggestionRef = useRef(null);
  const maxScrollDepthRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());
  const showQuizRef = useRef(showQuiz);

  const getT = useCallback((field) => {
    if (!field) return '';
    const lang = i18n.language;
    return field[lang] || field.sl || '';
  }, [i18n.language]);

  const getLangArray = useCallback((field) => {
    if (!field) return [];
    const lang = i18n.language;
    return field[lang] || field.sl || [];
  }, [i18n.language]);

  const isAdaptive = config?.variant === 'adaptive';
  const isStatic = config?.variant === 'static';
  const activeStyle = config?.activeStyle || config?.cognitiveStyle;
  const isVisual = activeStyle === 'visual';
  const isVerbal = activeStyle === 'verbal';

  const updateLearningSession = useCallback(async (payload = {}) => {
    try {
      await axios.post(`${API_URL}/api/update-learning-session`, {
        userId: user?.userId,
        lesson_id: id,
        session_id: sessionIdRef.current,
        variant: config?.variant,
        cognitiveStyle: config?.cognitiveStyle,
        activeStyle: activeStyle,
        ...payload
      });
    } catch (error) {
      console.error('Learning session update failed:', error);
    }
  }, [
    user?.userId,
    id,
    config?.variant,
    config?.cognitiveStyle,
    activeStyle
  ]);

  useEffect(() => {
    setError(null);
    setShowQuiz(false);
    setQuizResult(null);
    setManualShowMindMap(false);
    setManualShowSummary(false);
    setAutoSuggestActive(false);
    setHasReachedEnd(false);
    setShowSurvey(false);
    setCompletedLessonsCount(null);
    setRecommendations([]);
    setLoadingRecommendations(false);
    setRecommendationsEnabled(true);
    setAdaptiveReviewSuggestion(false);
    setHasLoggedReadingEnd(false);
    setAdaptiveHighlighting(false);
    setHasTriggeredAdaptiveHighlighting(false);
    setShowAdaptiveToast(false);
    setShowReadingEndToast(false);
    setStyleSwitchSuggestion(null);
    maxScrollDepthRef.current = 0;
    lessonOpenedAtRef.current = Date.now();
    sessionIdRef.current = uuidv4();

    axios.get(`${API_URL}/api/get-content/${id}`)
      .then((res) => {
        if (res.data) {
          setContent(res.data);
          if (res.data.quiz && res.data.quiz.length > 0) {
            setQuizQuestions(res.data.quiz);
          } else {
            setQuizQuestions([]);
          }
        } else {
          setError(t('error_loading_content'));
        }
      })
      .catch((err) => {
        console.error(err);
        setError(t('error_server_unavailable'));
      });

    updateLearningSession();

    return () => {
      const duration = Math.floor((Date.now() - lessonOpenedAtRef.current) / 1000);

      updateLearningSession({
        duration_seconds: duration,
        max_scroll_depth: maxScrollDepthRef.current
      });
    };
  }, [id]);

  const learningGoal = config?.learningGoal || user?.learningGoal;

  const isQuickGoal = learningGoal === 'quick_understanding';
  const isDeepGoal = learningGoal === 'deep_understanding';
  const isExamGoal = learningGoal === 'exam_preparation';
  const isRevisionGoal = learningGoal === 'revision';

  const shouldPrioritizeSummary =
    isQuickGoal ||
    isRevisionGoal ||
    isExamGoal ||
    isDeepGoal;

  const shouldShowKeyTerms =
    isQuickGoal ||
    isDeepGoal ||
    isExamGoal ||
    isRevisionGoal;

  const shouldPrioritizeKeyTerms =
    isExamGoal || isRevisionGoal;

  const shouldPrioritizeDefinitions =
    isDeepGoal || isExamGoal || isRevisionGoal;

  const shouldPrioritizeExamples =
    isDeepGoal || isExamGoal || isRevisionGoal;

  const shouldPrioritizeQuiz =
    isExamGoal;

  const shouldShowSummaryInline =
    shouldPrioritizeSummary && !(isVerbal && isRevisionGoal);

  useEffect(() => {
    if (!isAdaptive) {
      setContentMode('detailed');
      return;
    }

    if (isRevisionGoal) {
      setContentMode('short');
      return;
    }

    if (isQuickGoal) {
      setContentMode('short');
      return;
    }

    if (activeStyle === 'visual') {
      setContentMode('short');
      return;
    }

    setContentMode('detailed');
  }, [
    id,
    isAdaptive,
    activeStyle,
    isRevisionGoal,
    isQuickGoal
  ]);

  useEffect(() => {
    if (!isAdaptive || !isVisual) return;

    setMindMapHighlight(true);

    const timer = setTimeout(() => {
      setMindMapHighlight(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [
    id,
    isAdaptive,
    isVisual
  ]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsZoomed(false);
        setZoomLevel(1.4);
      }
    };

    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    if (isAdaptive && isExamGoal) {
      setAdaptiveHighlighting(true);
    }
  }, [isAdaptive, isExamGoal, id]);

  const topicTitle = getT(content?.topic);
  const introText = getT(content?.common_intro);
  const shortText = getT(content?.verbal_elements?.text_short);
  const detailedText = getT(content?.verbal_elements?.text_detailed);
  const currentMindMap = useMemo(
    () => getT(content?.visual_elements?.mind_map_mermaid),
    [content?.visual_elements?.mind_map_mermaid, i18n.language]
  );

  const summaryBullets = getLangArray(content?.verbal_elements?.summary_bullets);
  const definitions = getLangArray(content?.learning_aids?.definitions);
  const examples = getLangArray(content?.learning_aids?.examples);
  const keyTerms = getLangArray(content?.verbal_elements?.key_terms);

  const displayedText = contentMode === 'short' ? shortText : detailedText;
  const highlightImportantText = (text) => {
    if (!adaptiveHighlighting || !text) return text;

    let highlightedText = text;

    const quizTerms = quizQuestions
      .map((question) => {
        const correctAnswer =
          question?.options?.[i18n.language]?.[question.a_index] ||
          question?.options?.sl?.[question.a_index];

        return correctAnswer;
      })
      .filter(Boolean);

    const importantTerms = [...new Set([
      ...keyTerms,
      ...quizTerms
    ])];

    let highlightedCount = 0;

    importantTerms.forEach((term) => {

      if (highlightedCount >= 3) return;

      if (!term || term.length < 4) return;

      const normalizedTerm = term.trim();

      const baseTerm =
        normalizedTerm.length > 5
          ? normalizedTerm.slice(0, -1)
          : normalizedTerm;

      const escapedTerm =
        baseTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const sentenceRegex = new RegExp(
        `([^.!?]*\\b${escapedTerm}\\w*[^.!?]*[.!?])`,
        'gi'
      );

      highlightedText = highlightedText.replace(
        sentenceRegex,
        (match) => {

          if (highlightedCount >= 3) return match;

          highlightedCount++;

          return `<span class="adaptive-highlight-sentence">${match}</span>`;
        }
      );
    });

    return highlightedText;
  };

  const highlightedDisplayedText = useMemo(() => {
    return highlightImportantText(displayedText);
  }, [
    displayedText,
    adaptiveHighlighting,
    i18n.language,
    quizQuestions,
    keyTerms
  ]);

  const isQuizRelevant = (text) => {
    if (!adaptiveHighlighting || !text || !quizQuestions?.length) {
      return false;
    }

    const lowerText = text.toLowerCase();

    let matchedWords = 0;

    quizQuestions.forEach((question) => {

      const questionText =
        question?.q?.[i18n.language]?.toLowerCase() || '';

      const options =
        question?.options?.[i18n.language] || [];

      const allQuizContent = [
        questionText,
        ...options.map((o) => o.toLowerCase())
      ];

      allQuizContent.forEach((content) => {

        const words = content
          .split(' ')
          .map(word => word.replace(/[.,!?]/g, ''))
          .filter((word) =>
            word.length > 5
          );

        words.forEach((word) => {
          if (lowerText.includes(word)) {
            matchedWords++;
          }
        });
      });
    });

    return matchedWords >= 2;
  };

  const shouldShowCoach = isAdaptive;
  const shouldShowSummaryBlock = isAdaptive && summaryBullets.length > 0;
  const shouldShowDefinitions =
    definitions.length > 0 &&
    (!isAdaptive || isDeepGoal || isExamGoal || isRevisionGoal);

  const shouldShowExamples =
    examples.length > 0 &&
    (!isAdaptive || shouldPrioritizeExamples);

  const shouldPrioritizeMindMap = false;

  const shouldShowMindMapInline =
    !!currentMindMap && (
      isStatic ||
      (isAdaptive && isVerbal && manualShowMindMap)
    );

  const shouldShowMindMapAside =
    !!currentMindMap && !showQuiz && shouldPrioritizeMindMap;

  const shouldShowMindMapReveal =
    !!currentMindMap && isAdaptive && isVerbal && !manualShowMindMap;

  const shouldHideSummaryForVisualDeep =
    isAdaptive &&
    isVisual &&
    (isDeepGoal || isExamGoal || isRevisionGoal) &&
    !manualShowSummary;

  const shouldShowSummaryButton = shouldShowSummaryBlock;
  const shouldShowVisualizationButton = !!currentMindMap;

  const actionButtonsCount =
    (shouldShowSummaryButton ? 1 : 0) +
    (shouldShowVisualizationButton ? 1 : 0);

  const actionButtonsGridClass =
    actionButtonsCount === 2
      ? 'grid grid-cols-2 gap-2'
      : 'grid grid-cols-1 gap-2';

  useEffect(() => {
    if (!autoSuggestActive || showQuiz || !quizSuggestionRef.current) return;

    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        quizSuggestionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      });
    }, 900);

    return () => clearTimeout(timer);
  }, [autoSuggestActive, showQuiz]);

  useEffect(() => {
    if (!autoSuggestActive) return;

    setQuizPulse(true);

    const timer = setTimeout(() => {
      setQuizPulse(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, [autoSuggestActive]);
      
  useEffect(() => {
    if (!content || !isAdaptive || showQuiz || hasReachedEnd || !readingEndRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const timeOnPage = Date.now() - lessonOpenedAtRef.current;

        if (entry.isIntersecting && timeOnPage > 2500 && !hasLoggedReadingEnd) {

          setHasReachedEnd(true);
          setAutoSuggestActive(true);
          setHasLoggedReadingEnd(true);

          if (
            contentMode === 'short' &&
            !isExamGoal &&
            !hasTriggeredAdaptiveHighlighting
          ) {
            setHasTriggeredAdaptiveHighlighting(true);

            setAdaptiveHighlighting(true);

            setShowAdaptiveToast(true);

            setTimeout(() => {
              setShowAdaptiveToast(false);
            }, 5000);

            updateLearningSession({
              adaptive_intervention_triggered: true,
              adaptive_intervention_reason: 'reached_end_short_content',
              adaptive_intervention_type: 'highlighted_key_terms',
              learningGoal
            });
          }

          setShowReadingEndToast(true);

          setTimeout(() => {
            setShowReadingEndToast(false);
          }, 4000);

          updateLearningSession({
            reached_end: true
          });

          observer.disconnect();
        }
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: '0px 0px -8% 0px'
      }
    );

    observer.observe(readingEndRef.current);

    return () => observer.disconnect();
  }, [
    content,
    isAdaptive,
    activeStyle,
    contentMode,
    showQuiz,
    hasReachedEnd,
    hasLoggedReadingEnd,
    hasTriggeredAdaptiveHighlighting,
    isExamGoal,
    learningGoal,
    id
  ]);

  useEffect(() => {
    showQuizRef.current = showQuiz;
  }, [showQuiz]);

  useEffect(() => {
    if (showQuiz) return;

    const handleScroll = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight <= 0) return;

      const currentScroll = window.scrollY;
      const currentTime = Date.now();

      const deltaY = Math.abs(
        currentScroll - lastScrollYRef.current
      );

      const deltaTime =
        currentTime - lastScrollTimeRef.current;

      const scrollSpeed =
        deltaTime > 0 ? deltaY / deltaTime : 0;

      const percent = Math.round(
        (currentScroll / docHeight) * 100
      );

      maxScrollDepthRef.current = Math.max(
        maxScrollDepthRef.current,
        percent
      );

      const timeOnPage =
        Date.now() - lessonOpenedAtRef.current;

      const fastScrolling =
        scrollSpeed > 1.1 &&
        percent > 35 &&
        timeOnPage > 300 &&
        !manualShowMindMap;

      if (
        isAdaptive &&
        !isExamGoal &&
        fastScrolling &&
        !hasTriggeredAdaptiveHighlighting
      ) {
        setHasTriggeredAdaptiveHighlighting(true);

        setTimeout(() => {
          if (showQuizRef.current) return;

          setAdaptiveHighlighting(true);
          setShowAdaptiveToast(true);

          setTimeout(() => {
            setShowAdaptiveToast(false);
          }, 5000);
        }, 1000);

        updateLearningSession({
          adaptive_intervention_triggered: true,
          adaptive_intervention_reason: 'fast_scrolling',
          adaptive_intervention_type: 'highlighted_key_terms',
          learningGoal
        });
      }

      lastScrollYRef.current = currentScroll;
      lastScrollTimeRef.current = currentTime;
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [
    id,
    isAdaptive,
    isExamGoal,
    showQuiz,
    manualShowMindMap,
    hasTriggeredAdaptiveHighlighting,
    learningGoal,
    updateLearningSession
  ]);

  const scrollToRef = (ref, offset = 90, delay = 0) => {
    setTimeout(() => {
      requestAnimationFrame(() => {
        if (!ref.current) return;

        const elementTop =
          ref.current.getBoundingClientRect().top + window.scrollY;

        window.scrollTo({
          top: Math.max(elementTop - offset, 0),
          behavior: 'smooth'
        });
      });
    }, delay);
  };

  const handleManualStyleChange = (newStyle) => {
    if (activeStyle === newStyle) return;

    updateLearningSession({
      cognitiveStyle: config?.cognitiveStyle,
      activeStyle: newStyle,
      manual_style_override: true,
      assigned_style: config?.cognitiveStyle,
      previous_style: activeStyle,
      new_style: newStyle
    });

    setConfig((prev) => ({
      ...prev,
      activeStyle: newStyle
    }));
  };

  const isElementWellPositioned = (ref, offset = 110) => {
    if (!ref.current) return false;

    const rect = ref.current.getBoundingClientRect();

    return (
      rect.top >= offset &&
      rect.top <= offset + 40
    );
  };

  const pulseElement = (setter) => {
    setter(true);

    setTimeout(() => {
      setter(false);
    }, 1600);
  };

  const handleSummaryClick = async () => {
    if (!shouldShowSummaryButton) return;

    await updateLearningSession({
      opened_summary: true
    });

    setSummaryOpenedFeedback(true);

    setTimeout(() => {
      setSummaryOpenedFeedback(false);
    }, 2000);

    if (isAdaptive && isVisual && (isDeepGoal || isExamGoal || isRevisionGoal)) {
      setManualShowSummary(true);
    }

    setTimeout(() => {
      checkStyleSwitchSuggestion();
    }, 300);

    scrollToRef(summarySectionRef, 110, 0);

    setTimeout(() => {
        pulseElement(setSummaryHighlight);
    }, 450);
  };

  const handleVisualizationClick = async () => {
    if (!shouldShowVisualizationButton) return;

    if (isAdaptive && isVerbal && !manualShowMindMap) {
      setManualShowMindMap(true);

      await updateLearningSession({
        opened_visualization: true
      });

      setMindMapOpenedFeedback(true);

      setTimeout(() => {
        setMindMapOpenedFeedback(false);
      }, 2000);

      setTimeout(() => {
        checkStyleSwitchSuggestion();
      }, 300);

      scrollToRef(mindMapSectionRef, 110, 0);

      setTimeout(() => {
          pulseElement(setMindMapHighlight);
      }, 450);

      return;
    }

    await updateLearningSession({
      opened_visualization: true
    });

    setMindMapOpenedFeedback(true);

    setTimeout(() => {
      setMindMapOpenedFeedback(false);
    }, 2000);

    setTimeout(() => {
      checkStyleSwitchSuggestion();
    }, 300);

    scrollToRef(mindMapSectionRef, 110, 200);
  };

  const loadRecommendations = async () => {
    if (!user?.userId || !id) return;

    setLoadingRecommendations(true);

    try {
      const recRes = await axios.post(`${API_URL}/api/recommend-next`, {
        userId: user.userId,
        current_lesson_id: id
      });

      setRecommendations(recRes.data.recommendations || []);
      setRecommendationsEnabled(recRes.data.recommendationsEnabled !== false);
    } catch (err) {
      console.error('Napaka pri nalaganju priporočil:', err);
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const checkStyleSwitchSuggestion = async () => {
    if (!user?.userId || !isAdaptive) return;

    if (!['visual', 'verbal'].includes(activeStyle)) return;

    try {
      const res = await axios.post(`${API_URL}/api/check-style-switch-suggestion`, {
        userId: user.userId,
        activeStyle
      });

      if (res.data.shouldSuggest) {
        await updateLearningSession({
          style_switch_suggested: true,
          style_switch_reason: res.data.trigger || 'interaction_pattern_detected'
        });

        const shouldDelayStyleSuggestion =
          autoSuggestActive || showAdaptiveToast || showReadingEndToast;

        if (shouldDelayStyleSuggestion) {
          setTimeout(() => {
            setStyleSwitchSuggestion(res.data);
          }, 2000);
        } else {
          setStyleSwitchSuggestion(res.data);
        }
      }
    } catch (err) {
      console.error('Style switch suggestion check failed:', err);
    }
  };

  const handleMindMapOpen = useCallback(() => {
    setIsZoomed(true);

    updateLearningSession({
      opened_visualization: true
    });
  }, [updateLearningSession]);

  const renderCoachBanner = () => {
    if (!shouldShowCoach) return null;

    return (
      <div className={`px-3 py-3 rounded-xl border flex items-start gap-2.5 ${
        isVisual
          ? 'bg-blue-50 border-blue-100'
          : 'bg-amber-50 border-amber-100'
      }`}>
        {isVisual ? (
          <Sparkles className="text-[#0a86dd] shrink-0 mt-0.5" size={15} />
        ) : (
          <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={15} />
        )}

        <div className="space-y-1">
          <p className={`text-[13px] italic leading-5 ${
            isVisual ? 'text-blue-900' : 'text-amber-900'
          }`}>
            {isVisual
              ? t('coach_why_visual')
              : t('coach_why_verbal')}
          </p>

          {learningGoal && (
            <p
              className={`mt-2 text-[12px] ${
                isVisual
                  ? 'text-blue-700'
                  : 'text-amber-700'
              }`}
            >
              {t(`learning_goal_short_${learningGoal}`)}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderSummaryBlock = () => {
    if (!shouldShowSummaryBlock) return null;

    const summaryClass = isAdaptive
      ? 'bg-white p-4 rounded-xl border border-blue-100 shadow-sm'
      : 'bg-slate-50 p-4 rounded-xl border border-slate-100';

    const titleClass = isAdaptive
      ? 'text-[9px] font-black text-[#0a86dd] uppercase tracking-[0.16em] block mb-2.5'
      : 'text-[9px] font-black text-slate-500 uppercase tracking-[0.16em] block mb-2.5';

    const dotClass = isAdaptive
      ? 'mt-1.5 w-1.5 h-1.5 rounded-full bg-[#0a86dd] shrink-0'
      : 'mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0';

    return (
      <div
        ref={summarySectionRef}
        className={`${summaryClass} transition-all duration-500 ${
          summaryHighlight
            ? 'ring-4 ring-[#d8eefc] border-[#7cc7ef] shadow-lg shadow-[#d8eefc]/70'
            : ''
        }`}
      >
        <span className={titleClass}>{t('takeaways_title')}</span>
        <ul className="space-y-2">
          {summaryBullets.map((bullet, idx) => (
            <li key={idx} className="flex gap-2.5 text-[13px] text-slate-700 leading-5">
              <span className={dotClass}></span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderManualMindMapReveal = () => {
    if (!shouldShowMindMapReveal) return null;

    return (
      <div
        className={`p-4 border rounded-xl flex flex-col items-center text-center transition-all duration-300 ${
          autoSuggestActive
            ? 'bg-[#eef8fe] border-[#7cc7ef] ring-4 ring-[#d8eefc] shadow-lg shadow-[#d8eefc]/70'
            : 'bg-transparent border-none-dashed border-slate-200'
        }`}
      >
        <p className={`text-[13px] mb-3 leading-5 ${autoSuggestActive ? 'text-[#0a86dd] font-semibold' : 'text-slate-500'}`}>
          {autoSuggestActive ? t('visual_summary_available') : t('adaptive_visual_hidden')}
        </p>
        <button
          onClick={async () => {
            setManualShowMindMap(true);

            await updateLearningSession({
              opened_visualization: true
            });

            setTimeout(() => {
              checkStyleSwitchSuggestion();
            }, 300);

            scrollToRef(mindMapSectionRef, 110, 200);
          }}
          className={`flex items-center gap-2 px-4 py-2 border rounded-full font-bold text-[12px] transition shadow-sm ${
            autoSuggestActive
              ? 'bg-white text-[#0a86dd] border-[#7cc7ef] hover:bg-[#e9f5fd] ring-2 ring-[#d8eefc]'
              : 'bg-white text-[#0a86dd] border-[#bfe3f8] hover:bg-[#e9f5fd]'
          }`}
        >
          <Eye size={14} /> {t('show_visual_summary')}
        </button>
      </div>
    );
  };

  const renderManualSummaryReveal = () => {
    if (!shouldHideSummaryForVisualDeep) return null;

    return (
      <div
        className={`p-4 border rounded-xl flex flex-col items-center text-center transition-all duration-300 ${
          autoSuggestActive
            ? 'bg-[#eef8fe] border-[#7cc7ef] ring-4 ring-[#d8eefc] shadow-lg shadow-[#d8eefc]/70'
            : 'bg-transparent border border-slate-200'
        }`}
      >
        <p className={`text-[13px] mb-3 leading-5 ${
          autoSuggestActive ? 'text-[#0a86dd] font-semibold' : 'text-slate-500'
        }`}>
          {t('summary_available')}
        </p>

        <button
          onClick={async () => {
            setManualShowSummary(true);

            await updateLearningSession({
              opened_summary: true
            });

            setTimeout(() => {
              checkStyleSwitchSuggestion();
            }, 300);

            scrollToRef(summarySectionRef, 110, 200);
          }}
          className={`flex items-center gap-2 px-4 py-2 border rounded-full font-bold text-[12px] transition shadow-sm ${
            autoSuggestActive
              ? 'bg-white text-[#0a86dd] border-[#7cc7ef] hover:bg-[#e9f5fd] ring-2 ring-[#d8eefc]'
              : 'bg-white text-[#0a86dd] border-[#bfe3f8] hover:bg-[#e9f5fd]'
          }`}
        >
          <FileText size={14} /> {t('show_summary')}
        </button>
      </div>
    );
  };

  const renderLessonHeader = ({ centered = false, borderColor = 'border-[#bfe3f8]' }) => (
    <header ref={lessonTopRef} className={centered ? 'text-center' : ''}>
      <h1 className="text-[24px] sm:text-[28px] lg:text-[30px] font-black text-slate-900 tracking-tight leading-[1.15]">
        {topicTitle}
      </h1>

      {introText && (
        centered ? (
          <p className="mt-3 text-[14px] text-slate-500 italic max-w-3xl mx-auto leading-6">
            {introText}
          </p>
        ) : (
          <p className={`mt-3 text-[14px] text-slate-500 italic border-l-4 ${borderColor} pl-3 leading-6`}>
            {introText}
          </p>
        )
      )}
    </header>
  );

  const renderTextBlock = (text, className = '', isAlreadyHighlighted = false) => (
    <div
      className={className}
    >
      <p
        className="text-slate-700 text-[14px] lg:text-[15px] leading-6 whitespace-pre-line font-normal"
        dangerouslySetInnerHTML={{
          __html: isAlreadyHighlighted ? text : highlightImportantText(text)
        }}
      />
    </div>
  );

  const renderMainContent = () => {
    if (!content) return null;

    if (isAdaptive && isVisual) {
      if (isAdaptive && isVisual && isDeepGoal) {
        return (
          <div className="space-y-4 animate-in fade-in duration-700">
            {renderCoachBanner()}

            {adaptiveHighlighting && (
              <div className="bg-[#ebe5f9] border border-[#d7c5fc] text-[#693fc0] px-4 py-3 rounded-xl text-[13px] leading-5 shadow-sm animate-in fade-in duration-500">
                {t('adaptive_highlight_explanation')}
              </div>
            )}

            {renderLessonHeader({ centered: true })}

            <div ref={mindMapSectionRef}>
              <MindMapCard
                compact
                t={t}
                currentMindMap={currentMindMap}
                mindMapHighlight={mindMapHighlight}
                onOpen={handleMindMapOpen}
              />
            </div>

            {renderKeyTerms()}

            {renderDefinitions()}

            {renderExamples()}

            {renderTextBlock(
              highlightedDisplayedText,
              'bg-slate-50 px-4 py-4 rounded-xl border border-slate-100',
              true
            )}

            {autoSuggestActive && !manualShowSummary && (
              <div className="rounded-xl border-2 border-[#7cc7ef] bg-[#eef8fe] px-4 py-3 text-[12px] text-[#0a86dd] font-semibold shadow-md shadow-[#d8eefc]/70 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {t('coach_subtitle')}
              </div>
            )}

            {manualShowSummary
              ? renderSummaryBlock()
              : renderManualSummaryReveal()
            }

            <div ref={readingEndRef} className="h-8" />
          </div>
        );
      }
      return (
        <div className="space-y-4 animate-in fade-in duration-700">
          {renderCoachBanner()}

          {adaptiveHighlighting && (
            <div className="bg-[#ebe5f9] border border-[#d7c5fc] text-[#693fc0] px-4 py-3 rounded-xl text-[13px] leading-5 shadow-sm animate-in fade-in duration-500">
              {t('adaptive_highlight_explanation')}
            </div>
          )}

          {renderLessonHeader({ centered: true })}

          {shouldPrioritizeKeyTerms &&
            !isExamGoal &&
            !isQuickGoal &&
            renderKeyTerms()}

          <div ref={mindMapSectionRef}>
            <MindMapCard
              compact
              t={t}
              currentMindMap={currentMindMap}
              mindMapHighlight={mindMapHighlight}
              onOpen={handleMindMapOpen}
            />
          </div>

          {(isExamGoal || isQuickGoal) && renderKeyTerms()}

          {isExamGoal && autoSuggestActive && !manualShowSummary && (
            <div className="rounded-xl border-2 border-[#7cc7ef] bg-[#eef8fe] px-4 py-3 text-[12px] text-[#0a86dd] font-semibold shadow-md shadow-[#d8eefc]/70 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {t('coach_subtitle')}
            </div>
          )}

          {isExamGoal
            ? (
              manualShowSummary
                ? renderSummaryBlock()
                : renderManualSummaryReveal()
            )
            : (
              !isRevisionGoal &&
              shouldShowSummaryInline &&
              renderSummaryBlock()
            )
          }
          {shouldPrioritizeDefinitions && renderDefinitions()}
          {shouldPrioritizeExamples && renderExamples()}

          {renderTextBlock(
            highlightedDisplayedText,
            'bg-slate-50 px-4 py-4 rounded-xl border border-slate-100',
            true
          )}

          {isRevisionGoal && autoSuggestActive && !manualShowSummary && (
            <div className="rounded-xl border-2 border-[#7cc7ef] bg-[#eef8fe] px-4 py-3 text-[12px] text-[#0a86dd] font-semibold shadow-md shadow-[#d8eefc]/70 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {t('coach_subtitle')}
            </div>
          )}

          {isRevisionGoal && (
            manualShowSummary
              ? renderSummaryBlock()
              : renderManualSummaryReveal()
          )}

          {shouldShowKeyTerms &&
            !shouldPrioritizeKeyTerms &&
            !isQuickGoal &&
            renderKeyTerms()}

          <div ref={readingEndRef} className="h-8" />
        </div>
      );
    }

    if (isAdaptive && isVerbal) {
      return (
        <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
          {renderCoachBanner()}

          {adaptiveHighlighting && (
            <div className="bg-[#f4efff] border border-[#ddd0ff] text-[#6c4db5] px-4 py-3 rounded-xl text-[13px] leading-5 shadow-sm animate-in fade-in duration-500">
              {t('adaptive_highlight_explanation')}
            </div>
          )}

          {renderLessonHeader({ borderColor: 'border-amber-200' })}

          {shouldShowSummaryInline &&
            !(isVerbal && (isDeepGoal || isQuickGoal)) &&
            renderSummaryBlock()}

          {renderTextBlock(
            highlightedDisplayedText,
            'bg-slate-50 px-4 py-4 rounded-xl border border-slate-100',
            true
          )}

          {(isDeepGoal || isQuickGoal || isRevisionGoal) && renderSummaryBlock()}

          {!isDeepGoal &&
            !isQuickGoal &&
            !shouldPrioritizeSummary &&
            renderSummaryBlock()}

          {shouldPrioritizeDefinitions && renderDefinitions()}
          {shouldPrioritizeExamples && renderExamples()}

          {shouldShowKeyTerms &&
            !shouldPrioritizeKeyTerms &&
            !isDeepGoal &&
            renderKeyTerms()}
          
          {isExamGoal && renderKeyTerms()}

          <div ref={readingEndRef} className="h-1" />

          {autoSuggestActive && !manualShowMindMap && (
            <div className="rounded-xl border-2 border-[#7cc7ef] bg-[#eef8fe] px-4 py-3 text-[12px] text-[#0a86dd] font-semibold shadow-md shadow-[#d8eefc]/70 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {t('coach_subtitle')}
            </div>
          )}

          {renderManualMindMapReveal()}
        </div>
      );
    }

    if (isStatic && isVisual) {
      return (
        <div className="space-y-4 animate-in fade-in duration-700">
          {renderLessonHeader({ borderColor: 'border-[#bfe3f8]' })}
          {renderSummaryBlock()}
          {renderTextBlock(
            detailedText,
            'bg-white px-4 py-4 rounded-xl border border-slate-100'
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-in fade-in duration-700">
        {renderLessonHeader({ borderColor: 'border-[#bfe3f8]' })}
        {renderSummaryBlock()}
        {renderTextBlock(
          detailedText,
          'bg-white px-4 py-4 rounded-xl border border-slate-100'
        )}
      </div>
    );
  };

  const renderBottomMindMap = () => {
    if (!shouldShowMindMapInline) return null;

    return (
      <div ref={mindMapSectionRef} className="mt-5">
        <MindMapCard
          t={t}
          currentMindMap={currentMindMap}
          mindMapHighlight={mindMapHighlight}
          onOpen={handleMindMapOpen}
        />
      </div>
    );
  };

  const renderDefinitions = () => {
    if (!shouldShowDefinitions) return null;

    return (
      <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
        <div className="flex items-center gap-2 mb-3 text-amber-700">
          <Book size={15} />
          <span className="font-black uppercase text-[9px] tracking-[0.16em]">
            {t('glossary_of_terms')}
          </span>
        </div>

        <dl className="grid gap-3 md:grid-cols-2">
          {definitions.map((def, i) => (
            <div
              key={i}
              className={`bg-white p-3 rounded-lg shadow-sm border transition-all duration-500 ${
                isQuizRelevant(
                  `${def.term} ${def.definition}`
                )
                  ? 'border-amber-300 bg-amber-200 shadow-lg ring-2 ring-amber-100 scale-[1.01]'
                  : 'border-amber-100/50'
              }`}
            >
              <dt className="font-bold text-amber-900 mb-1 text-[13px]">
                {def.term}
              </dt>
              <dd className="text-[12px] text-amber-800/80 leading-5">
                {def.definition}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    );
  };

  const renderExamples = () => {
    if (!shouldShowExamples) return null;

    return (
      <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
        <div className="flex items-center gap-2 mb-3 text-emerald-700">
          <Lightbulb size={15} />
          <span className="font-black uppercase text-[9px] tracking-[0.16em]">
            {t('practical_examples')}
          </span>
        </div>

        <div className="grid gap-3">
          {examples.map((ex, i) => (
            <div
              key={i}
              className={`flex gap-3 items-start bg-white p-3 rounded-lg border transition-all duration-500 ${
                isQuizRelevant(ex)
                  ? 'border-emerald-300 bg-emerald-200 shadow-lg ring-2 ring-emerald-100 scale-[1.01]'
                  : 'border-emerald-100/50'
              }`}
            >
              <span className="bg-emerald-100 text-emerald-700 w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px]">
                {i + 1}
              </span>
              <p className="text-[12px] text-emerald-800 leading-5">{ex}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderKeyTerms = () => {
    if (!keyTerms.length) return null;

    return (
      <div className="mt-5 flex flex-wrap gap-2">
        {keyTerms.map((term, idx) => (
          <span
            key={idx}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase shadow-sm border tracking-[0.12em] transition-all duration-500 ${
              isQuizRelevant(term)
                ? 'bg-[#dff1ff] border-[#7cc7ef] text-[#0a86dd] shadow-sm'
                : 'bg-white border-[#d8eefc] text-[#0a86dd]'
            }`}
          >
            {term}
          </span>
        ))}
      </div>
    );
  };

  const getMainColumnClass = () => {
    if (showQuiz) return 'col-span-12';
    if (isAdaptive && isVerbal) return 'col-span-12 lg:col-span-8';
    if (isStatic && isVerbal) return 'col-span-12 lg:col-span-8';
    return shouldShowMindMapAside ? 'col-span-12 lg:col-span-7' : 'col-span-12 lg:col-span-8';
  };

  const getAsideColumnClass = () => {
    return shouldShowMindMapAside ? 'col-span-12 lg:col-span-5' : 'col-span-12 lg:col-span-4';
  };

  const quizButtonClass = `w-full py-2.5 text-white rounded-xl font-black shadow-md transition-all duration-300 uppercase flex items-center justify-center gap-2 text-[12px] ${
    isAdaptive && (autoSuggestActive || shouldPrioritizeQuiz)
      ? `bg-green-600 hover:bg-green-700 ring-4 ring-green-200 shadow-lg shadow-green-200/70 scale-[1.04] border-2 border-green-300 ${
          quizPulse ? 'animate-pulse' : ''
        }`
      : 'bg-green-500/90 hover:bg-green-600'
  }`;

  const summaryButtonClass = `py-2 px-2 rounded-xl font-black text-[10px] transition-all duration-300 flex items-center justify-center gap-1.5 border ${
    autoSuggestActive && shouldShowSummaryButton
      ? 'bg-[#e9f5fd] text-[#0a86dd] hover:bg-[#d8eefc] border-[#7cc7ef] ring-4 ring-[#d8eefc] shadow-md'
      : 'bg-[#e9f5fd] text-[#0a86dd] hover:bg-[#d8eefc] border-[#bfe3f8]'
  }`;

  const visualizationButtonClass = `py-2 px-2 rounded-xl font-black text-[10px] transition-all duration-300 flex items-center justify-center gap-1.5 border ${
    autoSuggestActive && shouldShowVisualizationButton
      ? 'bg-[#e9f5fd] text-[#0a86dd] hover:bg-[#d8eefc] border-[#7cc7ef] ring-4 ring-[#d8eefc] shadow-md'
      : 'bg-[#e9f5fd] text-[#0a86dd] hover:bg-[#d8eefc] border-[#bfe3f8]'
  }`;

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={38} />
        <p className="text-slate-600 font-bold">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 text-[#0a86dd] underline"
        >
          {t('back_to_dashboard')}
        </button>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-[#0a86dd] border-t-transparent rounded-full mb-4"></div>
        <p className="italic text-slate-400">{t('loading_lesson')}</p>
      </div>
    );
  }

  const suggestedStyle = styleSwitchSuggestion?.suggestedStyle;

  return (
    <main className="max-w-[1120px] mx-auto mt-4 px-3 sm:px-4 lg:px-5 pb-6">
      <div
        className={`
          fixed bottom-10 right-6 z-[80] flex flex-col gap-2 max-w-sm
          transition-opacity duration-300 pointer-events-none
          ${
            showAdaptiveToast || showReadingEndToast
              ? 'opacity-100'
              : 'opacity-0'
          }
        `}
      >
        {showAdaptiveToast && (
          <div className="bg-[#f4efff] border border-[#ddd0ff] text-[#6c4db5] px-4 py-3 rounded-xl shadow-lg text-[13px] leading-5 font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300">
            {t('adaptive_highlight_explanation')}
          </div>
        )}

        {showReadingEndToast && (
          <div className="bg-[#eef8fe] border border-[#7cc7ef] text-[#0a86dd] px-4 py-3 rounded-xl shadow-lg text-[13px] leading-5 font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300">
            {t('reading_completed_toast')}
          </div>
        )}
      </div>
      {isZoomed && currentMindMap && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center"
          onClick={() => {
            setIsZoomed(false);
            setZoomLevel(1.4);
          }}
        >
          <div
            className="absolute top-4 flex items-center gap-3 z-[110]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-xl flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-28 sm:w-40 h-1.5 accent-[#0a86dd]"
              />
              <span className="text-white font-mono text-sm min-w-[48px]">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(1.4)}
                className="text-white/50 hover:text-white"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            <button
              onClick={() => {
                setIsZoomed(false);
                setZoomLevel(1.4);
              }}
              className="text-white/50 hover:text-white p-2"
            >
              <X size={28} />
            </button>
          </div>

          <div
            className="w-full h-full flex items-center justify-center overflow-auto p-4 sm:p-6"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.15s ease-out'
              }}
              className="bg-white p-4 sm:p-5 rounded-2xl shadow-2xl w-[92vw] max-w-[900px] sm:w-auto sm:min-w-[620px]"
            >
              <Mermaid chart={currentMindMap} />
            </div>
          </div>
        </div>
      )}

      {styleSwitchSuggestion && (
        <div className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-[#d8eefc] shadow-xl max-w-[520px] w-full p-5 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0a86dd] mb-2">
              {t('style_switch_title')}
            </p>

            <p className="text-[14px] font-bold text-slate-800 leading-5">
              {suggestedStyle === 'visual'
                ? t('style_switch_question_visual')
                : t('style_switch_question_verbal')}
            </p>

            <p className="text-[12px] text-slate-500 leading-5 mt-2">
              {suggestedStyle === 'visual'
                ? t('style_switch_text_visual')
                : t('style_switch_text_verbal')}
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!suggestedStyle) return;

                  await updateLearningSession({
                    style_switch_accepted: true,
                    previous_style: activeStyle,
                    new_style: suggestedStyle,
                    manual_style_override: true
                  });

                  await axios.post(`${API_URL}/api/set-user-style`, {
                    userId: user.userId,
                    cognitiveStyle: suggestedStyle,
                    activeStyle: suggestedStyle,
                    language: i18n.language,
                    styleSwitchUsed: true
                  });

                  setConfig((prev) => ({
                    ...prev,
                    cognitiveStyle: suggestedStyle,
                    activeStyle: suggestedStyle
                  }));

                  setStyleSwitchSuggestion(null);
                }}
                className="flex-1 px-4 py-2 bg-[#0a86dd] text-white rounded-xl font-bold hover:bg-[#086fb8] transition text-[12px] shadow-sm"
              >
                {suggestedStyle === 'visual'
                  ? t('switch_to_visual')
                  : t('switch_to_verbal')}
              </button>

              <button
                type="button"
                onClick={async () => {
                  await updateLearningSession({
                    style_switch_rejected: true
                  });

                  await axios.post(`${API_URL}/api/decline-style-switch`, {
                    userId: user.userId
                  });

                  setStyleSwitchSuggestion(null);
                }}
                className="flex-1 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition text-[12px]"
              >
                {t('keep_current_style')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`mb-4 ${showQuiz || showSurvey ? 'flex justify-center' : ''}`}>
        <div
          className={`flex flex-wrap items-center gap-2 text-slate-400 text-[12px] ${
            showQuiz || showSurvey ? 'w-full max-w-[760px] px-4' : ''
          }`}
        >
          {!showSurvey && (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="hover:text-[#0a86dd] transition"
              >
                {t('dashboard')}
              </button>

              {(showQuiz || topicTitle) && <span>/</span>}
            </>
          )}

          <span className="font-bold text-slate-600 break-words">
            {showSurvey ? t('survey.title') : topicTitle}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className={getMainColumnClass()}>
          <div
            className={`bg-white border border-slate-100 shadow-sm mx-auto ${
              showQuiz
                ? 'max-w-[760px] p-4 rounded-2xl'
                : 'p-4 sm:p-5 rounded-[18px]'
            }`}
          >
            {showQuiz ? (
              <div className="animate-in fade-in duration-300 flex justify-center">
                {showSurvey ? (
                  <div className="w-full">
                    <Survey
                      user={user}
                      config={config}
                      onFinish={() => {
                        setConfig(prev => ({
                          ...prev,
                          surveyCompleted: true
                        }));

                        setShowSurvey(false);
                        setShowQuiz(false);
                        setQuizResult(null);
                      }}
                    />
                  </div>
                ) : !quizResult ? (
                  <div className="w-full max-w-[760px]">
                    <div className="mb-3">
                      <button
                        onClick={() => setShowQuiz(false)}
                        className="text-[11px] text-slate-400 font-bold hover:text-[#0a86dd] flex items-center gap-1.5"
                      >
                        <ArrowLeft size={13} /> {t('back_to_learning')}
                      </button>
                    </div>

                    <div className="w-full flex justify-center">
                      <Quiz
                        predefinedQuiz={quizQuestions}
                        userId={user.userId}
                        lessonId={id}
                        onComplete={async (res) => {
                          setQuizResult(res);

                          await updateLearningSession({
                            quiz_completed: true,
                            quiz_score: res.correct,
                            quiz_total: res.total
                          });

                          const quizPercentage = res.total > 0 ? res.correct / res.total : 0;

                          if (isAdaptive && quizPercentage < 0.6) {
                            setAdaptiveReviewSuggestion(true);

                            await updateLearningSession({
                              adaptive_review_suggested: true
                            });
                          } else {
                            setAdaptiveReviewSuggestion(false);
                          }

                          try {
                            await axios.post(`${API_URL}/api/submit-quiz`, {
                              userId: user.userId,
                              lesson_id: id,
                              correct: res.correct,
                              total: res.total
                            });

                            const countRes = await axios.post(
                              `${API_URL}/api/completed-lessons-count`,
                              { userId: user.userId }
                            );

                            const completed = countRes.data.count ?? 0;
                            setCompletedLessonsCount(completed);

                            if (completed >= 3) {
                              setRecommendations([]);
                              setCompletedLessonsCount(completed);
                              return;
                            }

                            if (isAdaptive) {
                              await loadRecommendations();
                            } else {
                              setRecommendations([]);
                            }
                          } catch (err) {
                            console.error('Napaka pri shranjevanju kviza ali štetju lekcij:', err);
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-[520px] text-center py-4 animate-in fade-in duration-300">
                    <Trophy size={36} className="mx-auto text-yellow-400 mb-3" />
                    <h2 className="text-[20px] font-black mb-1.5">
                      {t('lesson_completed')}
                    </h2>

                    <p className="text-[14px] text-slate-600 mb-3">
                      {t('quiz_result')}{' '}
                      <span className="text-[#0a86dd] font-black">
                        {quizResult.correct} / {quizResult.total}
                      </span>
                    </p>
                    {adaptiveReviewSuggestion && (
                      <div className="mt-4 mb-4 rounded-xl border border-[#d8eefc] bg-[#f7fcff] p-4 text-left shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0a86dd] mb-2">
                          {t('adaptive_review_title')}
                        </p>

                        <p className="text-[12px] text-slate-500 leading-5 mb-3">
                          {isVisual
                            ? t('adaptive_review_text_visual')
                            : t('adaptive_review_text_verbal')}
                        </p>

                        <div className="grid grid-cols-1 gap-2">
                          {isVerbal && (
                            <button
                              type="button"
                              onClick={async () => {
                                await updateLearningSession({
                                  adaptive_review_summary_clicked: true,
                                  opened_summary: true
                                });

                                setShowQuiz(false);
                                setQuizResult(null);

                                scrollToRef(summarySectionRef, 110, 200);
                              }}
                              className="px-4 py-2 bg-white text-[#0a86dd] border border-[#bfe3f8] rounded-xl font-bold hover:bg-[#e9f5fd] transition text-[12px]"
                            >
                              {t('open_summary')}
                            </button>
                          )}
                          {isVisual && (
                            <button
                              type="button"
                              onClick={async () => {
                                await updateLearningSession({
                                  adaptive_review_visual_clicked: true,
                                  opened_visualization: true
                                });

                                setShowQuiz(false);
                                setQuizResult(null);

                                scrollToRef(mindMapSectionRef, 110, 200);
                              }}
                              className="px-4 py-2 bg-white text-[#0a86dd] border border-[#bfe3f8] rounded-xl font-bold hover:bg-[#e9f5fd] transition text-[12px]"
                            >
                              {t('open_visualization')}
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            setAdaptiveReviewSuggestion(false);

                            await updateLearningSession({
                              adaptive_review_skipped: true
                            });
                          }}
                          className="mt-2 w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition text-[12px]"
                        >
                          {t('skip_review_suggestion')}
                        </button>
                      </div>
                    )}

                    {completedLessonsCount !== null && completedLessonsCount < 3 && (
                      <p className="text-[12px] text-slate-500 mb-4">
                        {t('lessons_progress', { count: completedLessonsCount, total: 3 })}
                      </p>
                    )}

                    {isAdaptive && completedLessonsCount !== null && completedLessonsCount < 3 && (
                      <div className="mt-4 text-left">
                        <div className="rounded-xl border border-[#d8eefc] bg-[#f7fcff] p-4 shadow-sm">
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0a86dd] mb-2">
                            {t('recommended_next_lesson')}
                          </p>

                          {loadingRecommendations ? (
                            <p className="text-[12px] text-slate-500">
                              {t('loading_recommendation')}
                            </p>
                          ) : recommendations.length > 0 ? (
                            <div>
                              <h3 className="text-[15px] font-bold text-slate-800">
                                {recommendations[0]?.topic?.[i18n.language] ||
                                  recommendations[0]?.topic?.sl ||
                                  recommendations[0]?.lesson_id}
                              </h3>

                              <p className="text-[12px] text-slate-500 mt-1">
                                {recommendations[0]?.reason?.[i18n.language] ||
                                  recommendations[0]?.reason?.sl}
                              </p>

                              <button
                                type="button"
                                onClick={() => {
                                  updateLearningSession({
                                    recommendation_accepted: true,
                                    recommended_lesson_id: recommendations[0]?.lesson_id
                                  });

                                  navigate(`/lesson/${recommendations[0].lesson_id}`);
                                }}
                                className="mt-3 w-full px-4 py-2 bg-[#0a86dd] text-white border border-[#0a86dd] rounded-xl font-bold hover:bg-[#086fb8] shadow-sm transition text-[12px]"
                              >
                                {t('open_recommended_lesson')}
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await updateLearningSession({
                                    recommendation_rejected: true,
                                    recommended_lesson_id: recommendations[0]?.lesson_id
                                  });

                                  navigate('/dashboard');
                                }}
                                className="mt-2 w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition text-[12px]"
                              >
                                {t('skip_recommendation')}
                              </button>
                            </div>
                          ) : !recommendationsEnabled ? (
                            <div>
                              <p className="text-[12px] text-slate-500">
                                {t('recommendations_disabled')}
                              </p>

                              <button
                                type="button"
                                onClick={async () => {
                                  await axios.post(`${API_URL}/api/enable-recommendations`, {
                                    userId: user.userId
                                  });

                                  setRecommendationsEnabled(true);
                                  await loadRecommendations();
                                }}
                                className="mt-3 w-full px-4 py-2 bg-white text-[#0a86dd] border border-[#bfe3f8] rounded-xl font-bold hover:bg-[#e9f5fd] transition text-[12px]"
                              >
                                {t('enable_recommendations')}
                              </button>
                            </div>
                          ) : (
                            <p className="text-[12px] text-slate-500">
                              {t('no_recommendation_available')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {completedLessonsCount !== null && completedLessonsCount >= 3 && (
                      <div className="mb-4 rounded-xl border-2 border-[#7cc7ef] bg-[#eef8fe] px-4 py-3 text-[12px] text-[#0a86dd] font-semibold shadow-md shadow-[#d8eefc]/70">
                        {t('survey_unlocked')}
                      </div>
                    )}

                    <div className="w-full max-w-[520px] mx-auto mt-4 space-y-2">
                      {completedLessonsCount !== null && completedLessonsCount >= 3 && (
                        <button
                          onClick={() => setShowSurvey(true)}
                          className="w-full py-2.5 bg-[#0a86dd] text-white rounded-xl font-bold hover:bg-[#086fb8] shadow-md transition text-[13px]"
                        >
                          {t('open_survey')}
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setQuizResult(null);
                            setShowQuiz(false);
                          }}
                          className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition text-[13px]"
                        >
                          {t('review_material')}
                        </button>

                        {completedLessonsCount >= 3 ? (
                          <button
                            onClick={() => {
                              setShowSurvey(true);
                              setShowQuiz(true);
                              setQuizResult(null);
                            }}
                            className="w-full py-2.5 bg-white text-[#0a86dd] border border-[#bfe3f8] rounded-xl font-bold hover:bg-[#e9f5fd] transition text-[13px]"
                          >
                            {t('finish_research')}
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-2.5 bg-white text-[#0a86dd] border border-[#bfe3f8] rounded-xl font-bold hover:bg-[#e9f5fd] transition text-[13px]"
                          >
                            {t('back_to_dashboard')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-in fade-in duration-300">
                {renderMainContent()}
                {renderBottomMindMap()}

                <div className="mt-5 space-y-4">
                  {!isAdaptive && renderDefinitions()}
                  {!isAdaptive && renderExamples()}
                </div>

                {!isAdaptive && renderKeyTerms()}

              </div>
            )}
          </div>
        </div>

        {!showQuiz && (
          <aside className={getAsideColumnClass()}>
            <div className="lesson-aside-scroll lg:sticky lg:top-16 space-y-4 lg:overflow-y-auto lg:pr-1">
              {shouldShowMindMapAside && (
                <div ref={mindMapSectionRef}>
                  <MindMapCard
                    compact={isAdaptive && isVisual}
                    t={t}
                    currentMindMap={currentMindMap}
                    mindMapHighlight={mindMapHighlight}
                    onOpen={handleMindMapOpen}
                  />
                </div>
              )}

              <div className="bg-white p-3 xl:p-4 rounded-[18px] shadow-sm border border-slate-100">
                <div className="mb-4 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-black text-[#0a86dd] uppercase tracking-[0.16em] leading-none">
                      {isAdaptive ? t('coach_title') : t('interaction')}
                    </span>

                    {isAdaptive && (
                      <button
                        type="button"
                        onClick={() => {
                          updateLearningSession({
                            adaptation_explanation_opened: true
                          });
                          setShowWhy(prev => !prev);
                        }}
                        className="shrink-0 text-[11px] leading-none text-slate-400 hover:text-[#0a86dd] flex items-center gap-1 transition whitespace-nowrap"
                      >
                        ⓘ {t('why_am_i_seeing_this')}
                      </button>
                    )}
                  </div>

                  {isAdaptive && (
                    <div className="mt-1.5 text-[11px] font-bold text-slate-700 leading-4 whitespace-nowrap min-w-0">
                      {t('coach_subtitle')}
                    </div>
                  )}
                </div>

                {isAdaptive && showWhy && (
                  <div className="mb-4 rounded-xl border border-[#d8eefc] bg-[#f3faff] px-3 py-3 text-[12px] text-slate-600 leading-5">
                    <p className="mb-2 font-semibold text-[#0a86dd]">
                      {t('why_explanation_title')}
                    </p>

                    <p className="mb-2">
                      {isVisual ? t('adaptation_explanation_visual') : t('adaptation_explanation_verbal')}
                    </p>

                    <p className="text-[11px] text-slate-500">
                      {t('adaptation_explanation_short')}
                    </p>
                  </div>
                )}

                {isAdaptive && (
                  <>
                    <div className="mb-4 rounded-xl border border-slate-100 bg-white px-3 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          updateLearningSession({
                            privacy_info_clicked: true
                          });
                          setShowPrivacy(prev => !prev);
                        }}
                        className="w-full flex items-center justify-between gap-2 text-left"
                      >
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                          {t('privacy_title')}
                        </span>
                        <span className="text-[11px] text-[#0a86dd]">
                          ⓘ
                        </span>
                      </button>

                      {showPrivacy && (
                        <div className="mt-2 rounded-xl border border-[#d8eefc] bg-[#f3faff] px-3 py-3">
                          <p className="text-[11px] text-slate-600 leading-5">
                            {t('privacy_note')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mb-4 rounded-xl border border-[#d8eefc] bg-[#f7fcff] px-3 py-3 shadow-md">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0a86dd] mb-2">
                        {t('adaptation_controls_title')}
                      </p>

                      <div>
                        <p className="text-[10px] text-slate-500 mb-1">
                          {t('content_mode_title')}
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleManualStyleChange('visual')}
                            className={`py-2 px-2 rounded-xl font-bold text-[11px] transition border ${
                              isVisual
                                ? 'bg-[#0a86dd] text-white border-[#0a86dd]'
                                : 'bg-white text-[#0a86dd] border-[#bfe3f8] hover:bg-[#e9f5fd]'
                            }`}
                          >
                            {t('visual_mode')}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleManualStyleChange('verbal')}
                            className={`py-2 px-2 rounded-xl font-bold text-[11px] transition border ${
                              isVerbal
                                ? 'bg-[#0a86dd] text-white border-[#0a86dd]'
                                : 'bg-white text-[#0a86dd] border-[#bfe3f8] hover:bg-[#e9f5fd]'
                            }`}
                          >
                            {t('verbal_mode')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {isAdaptive && (
                  <div className="p-3 rounded-xl bg-white border border-slate-100 opacity-80 mb-4 text-[12px] text-slate-600 leading-5">
                    {isVisual ? t('display_mode_change_visual') : t('display_mode_change_verbal')}
                  </div>
                )}

                <div
                  ref={quizSuggestionRef}
                  className={`
                    mb-4
                    overflow-hidden
                    transition-all
                    duration-500
                    ${
                      autoSuggestActive
                        ? 'max-h-32 opacity-100'
                        : 'max-h-0 opacity-0'
                    }
                  `}
                >
                  <div
                    className="
                      rounded-xl
                      border-2
                      border-[#7cc7ef]
                      bg-[#eef8fe]
                      px-3
                      py-3
                      text-[12px]
                      text-[#0a86dd]
                      font-semibold
                      shadow-md
                      shadow-[#d8eefc]/70
                    "
                  >
                    {isVerbal ? t('next_step_verbal') : t('next_step_visual')}
                  </div>
                </div>

                {isAdaptive && shouldPrioritizeQuiz && !showQuiz && (
                  <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-3 text-[12px] text-green-700 font-semibold leading-5">
                    {t('exam_goal_quiz_hint')}
                  </div>
                )}

                <button
                  onClick={() => {
                    updateLearningSession({
                      quiz_started: true
                    });

                    setShowQuiz(true);

                    scrollToRef(lessonTopRef, 110, 100);
                  }}
                  className={quizButtonClass}
                >
                  <Sparkles size={16} /> {t('quiz')}
                </button>

                <div className={`mt-4 ${actionButtonsGridClass}`}>
                  {shouldShowSummaryButton && (
                    <button
                      onClick={handleSummaryClick}
                      className={summaryButtonClass}
                    >
                      {summaryOpenedFeedback ? (
                        <>
                          <Check size={13} />
                          {t('opened')}
                        </>
                      ) : (
                        <>
                          <FileText size={13} />
                          {t('summary')}
                        </>
                      )}
                    </button>
                  )}

                  {shouldShowVisualizationButton && (
                    <button
                      onClick={handleVisualizationClick}
                      className={visualizationButtonClass}
                    >
                      {isAdaptive && mindMapOpenedFeedback ? (
                        <>
                          <Check size={13} />
                          {t('opened')}
                        </>
                      ) : (
                        <>
                          <ImageIcon size={13} />
                          {t('visualization')}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </main>
  );
};

export default LessonView;