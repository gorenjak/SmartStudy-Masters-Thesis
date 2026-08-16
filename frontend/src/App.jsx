import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import './i18n';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LessonView from './pages/LessonView';
import Survey from './components/Survey';
import Navbar from './components/Navbar';
import InitialStyleQuiz from './components/InitialStyleQuiz';
import logo from './assets/SmartStudy.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const SESSION_USER_KEY = 'smartstudy_session_user';
const STORED_USER_ID_KEY = 'smartstudy_user_id';

const initialConfig = {
  variant: 'static',
  cognitiveStyle: null,
  activeStyle: null,
  learningGoal: null,
  surveyCompleted: false
};

function App() {
  const { i18n, t } = useTranslation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [consentGiven, setConsentGiven] =
    useState(false);

  const [instructionsSeen, setInstructionsSeen] =
    useState(false);

  const [showInstructions, setShowInstructions] =
    useState(false);

  const [config, setConfig] =
    useState(initialConfig);

  const normalizeLanguage = useCallback(
    (language) => {
      return language?.startsWith('en') ? 'en' : 'sl';
    },
    []
  );

  const saveSessionUser = useCallback((userData) => {
    if (!userData?.userId) {
      return;
    }

    const {
      accessCode,
      ...safeUserData
    } = userData;

    sessionStorage.setItem(
      SESSION_USER_KEY,
      JSON.stringify(safeUserData)
    );

    localStorage.setItem(
      STORED_USER_ID_KEY,
      safeUserData.userId
    );
  }, []);

  const applyUserData = useCallback(
    (userData, saveSession = true) => {
      if (!userData?.userId) {
        return;
      }

      const normalizedUser = {
        ...userData,
        activeStyle:
          userData.activeStyle ||
          userData.cognitiveStyle ||
          null
      };

      setUser(normalizedUser);

      setConfig({
        variant:
          normalizedUser.variant || 'static',

        cognitiveStyle:
          normalizedUser.cognitiveStyle || null,

        activeStyle:
          normalizedUser.activeStyle || null,

        learningGoal:
          normalizedUser.learningGoal || null,

        surveyCompleted:
          normalizedUser.surveyCompleted === true
      });

      const hasConsent =
        normalizedUser.consentGiven === true;

      const hasSeenInstructions =
        normalizedUser.instructionsSeen === true;

      setConsentGiven(hasConsent);
      setInstructionsSeen(hasSeenInstructions);

      setShowInstructions(
        hasConsent && !hasSeenInstructions
      );

      if (saveSession) {
        saveSessionUser(normalizedUser);
      }
    },
    [
      saveSessionUser
    ]
  );

  useEffect(() => {
    try {
      const storedSessionUser =
        sessionStorage.getItem(SESSION_USER_KEY);

      if (!storedSessionUser) {
        setLoading(false);
        return;
      }

      const parsedUser =
        JSON.parse(storedSessionUser);

      if (!parsedUser?.userId) {
        sessionStorage.removeItem(
          SESSION_USER_KEY
        );

        setLoading(false);
        return;
      }

      applyUserData(parsedUser, false);
    } catch (error) {
      console.error(
        'Restoring SmartStudy session failed:',
        error
      );

      sessionStorage.removeItem(
        SESSION_USER_KEY
      );
    } finally {
      setLoading(false);
    }
  }, [applyUserData]);

  const handleAuthenticated = useCallback(
    (userData) => {
      applyUserData(userData);
      setLoading(false);
    },
    [applyUserData]
  );

  const updateStoredUser = useCallback(
    (updates) => {
      setUser((previousUser) => {
        if (!previousUser) {
          return previousUser;
        }

        const updatedUser = {
          ...previousUser,
          ...updates
        };

        saveSessionUser(updatedUser);

        return updatedUser;
      });
    },
    [saveSessionUser]
  );

  const handleQuizComplete = (
    finalStyle,
    profile
  ) => {
    const learningGoal =
      profile?.learningGoal || null;

    setConfig((previousConfig) => ({
      ...previousConfig,
      cognitiveStyle: finalStyle,
      activeStyle: finalStyle,
      learningGoal
    }));

    updateStoredUser({
      cognitiveStyle: finalStyle,
      activeStyle: finalStyle,
      learningGoal
    });

    if (!instructionsSeen) {
      setShowInstructions(true);
    }
  };

  const handleConsent = async () => {
    if (!user?.userId) {
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/set-consent`,
        {
          userId: user.userId
        }
      );

      setConsentGiven(true);

      updateStoredUser({
        consentGiven: true
      });
    } catch (error) {
      console.error(
        'Consent save failed:',
        error
      );

      alert(t('consent.error'));
    }
  };

  const handleInstructionsClose = async () => {
    if (!user?.userId) {
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/set-instructions-seen`,
        {
          userId: user.userId
        }
      );

      setInstructionsSeen(true);
      setShowInstructions(false);

      updateStoredUser({
        instructionsSeen: true
      });
    } catch (error) {
      console.error(
        'Instructions seen save failed:',
        error
      );

      alert(t('instructions.error'));
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(
      SESSION_USER_KEY
    );

    localStorage.removeItem(
      STORED_USER_ID_KEY
    );

    setUser(null);
    setConsentGiven(false);
    setInstructionsSeen(false);
    setShowInstructions(false);
    setConfig(initialConfig);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />

          <p className="italic text-slate-500 font-medium font-sans">
            {t('loading_message')}
          </p>
        </div>
      </div>
    );
  }

  if (user && !consentGiven) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6">
          <div className="flex items-start justify-between mb-5">
            <img
              src={logo}
              alt="SmartStudy"
              className="h-10 w-auto object-contain"
            />

            <div className="inline-flex bg-slate-200 p-0.5 rounded-lg border border-slate-300">
              {['sl', 'en'].map((language) => {
                const isSelected =
                  normalizeLanguage(
                    i18n.language
                  ) === language;

                return (
                  <button
                    key={language}
                    type="button"
                    onClick={() =>
                      i18n.changeLanguage(language)
                    }
                    className={`px-2 py-1 rounded-md text-[11px] font-black uppercase transition-all ${
                      isSelected
                        ? 'bg-white text-[#0a86dd] shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {language}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-5">
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              {t('consent.title')}
            </h1>

            <p className="text-sm text-slate-600 leading-6">
              {t('consent.desc')}
            </p>
          </div>

          <div className="rounded-2xl bg-[#f3faff] border border-[#d8eefc] p-4 mb-5">
            <p className="text-sm text-slate-700 leading-6">
              {t('consent.note')}
            </p>
          </div>

          <p className="text-xs text-slate-500 leading-5 mb-5">
            {t('consent.retention')}
          </p>

          <button
            type="button"
            onClick={handleConsent}
            className="w-full py-2.5 rounded-xl bg-[#0a86dd] text-white font-semibold text-sm hover:bg-[#086fb8] transition-colors"
          >
            {t('consent.button')}
          </button>
        </div>
      </div>
    );
  }

  if (
    user &&
    config.cognitiveStyle === null
  ) {
    return (
      <InitialStyleQuiz
        user={user}
        onComplete={handleQuizComplete}
      />
    );
  }

  if (user && config.surveyCompleted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 text-center">
          <img
            src={logo}
            alt="SmartStudy"
            className="h-12 w-auto object-contain mx-auto mb-5"
          />

          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            {t('research_completed.title')}
          </h1>

          <p className="text-sm text-slate-600 leading-6 mb-6">
            {t('research_completed.description')}
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-[#0a86dd] text-white font-semibold text-sm hover:bg-[#086fb8] transition-colors"
          >
            {t('logout')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 flex flex-col">
        {user && (
          <Navbar
            user={user}
            config={config}
            onOpenInstructions={() =>
              setShowInstructions(true)
            }
            onLogout={handleLogout}
          />
        )}

        {user && showInstructions && (
          <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4 py-6">
            <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                {t('instructions.title')}
              </h2>

              <p className="text-sm text-slate-600 leading-6 mb-4">
                {t('instructions.text')}
              </p>

              <div className="rounded-2xl bg-[#f3faff] border border-[#d8eefc] p-4 mb-5">
                <p className="text-sm text-slate-700 leading-6">
                  {t('instructions.note')}
                </p>
              </div>

              <button
                type="button"
                onClick={handleInstructionsClose}
                className="w-full py-2.5 rounded-xl bg-[#0a86dd] text-white font-semibold text-sm hover:bg-[#086fb8] transition-colors"
              >
                {t('instructions.button')}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                !user ? (
                  <Login
                    onAuthenticated={
                      handleAuthenticated
                    }
                  />
                ) : (
                  <Navigate
                    to="/dashboard"
                    replace
                  />
                )
              }
            />

            <Route
              path="/dashboard"
              element={
                user ? (
                  <Dashboard user={user} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/lesson/:id"
              element={
                user ? (
                  <LessonView
                    user={user}
                    config={config}
                    setConfig={setConfig}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/survey"
              element={
                user ? (
                  <Survey
                    user={user}
                    config={config}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="*"
              element={
                <Navigate
                  to={
                    user
                      ? '/dashboard'
                      : '/'
                  }
                  replace
                />
              }
            />
          </Routes>
        </div>
        {user && (
          <footer className="w-full bg-white/60 backdrop-blur-md border-t py-2 px-6 flex justify-center items-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <span>
                © {new Date().getFullYear()} SmartStudy. {t('all_rights_reserved')}
              </span>

              <span className="hidden sm:inline text-slate-300">|</span>

              <span>
                {t('footer_contact')}{' '}
                <a
                  href="mailto:nina.gorenjak1@student.um.si"
                  className="underline hover:text-slate-600"
                >
                  nina.gorenjak1@student.um.si
                </a>
              </span>
            </div>
          </footer>
        )}
      </div>
    </Router>
  );
}

export default App;