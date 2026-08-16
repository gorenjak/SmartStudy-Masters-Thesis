import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Copy, KeyRound, Loader2, LogIn, UserPlus, CircleHelp } from 'lucide-react';
import logo from '../assets/SmartStudy1.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = ({ onAuthenticated }) => {
  const { t, i18n } = useTranslation();

  const [view, setView] = useState('start');
  const [userId, setUserId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [createdUser, setCreatedUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const language = i18n.language?.startsWith('en')
    ? 'en'
    : 'sl';

  useEffect(() => {
    const storedUserId = localStorage.getItem(
      'smartstudy_user_id'
    );

    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const resetMessages = () => {
    setError('');
    setCopied(false);
  };

  const createUser = async () => {
    resetMessages();
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/user-init`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            language
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || 'user_creation_failed'
        );
      }

      localStorage.setItem('smartstudy_user_id', data.userId);
      localStorage.setItem('smartstudy_access_code', data.accessCode);

      setUserId(data.userId);
      setAccessCode(data.accessCode);

      setCreatedUser({
        ...data,
        accessCode: data.accessCode
      });

      setView('created');
    } catch (requestError) {
      console.error(
        'Creating pseudonymous user failed:',
        requestError
      );

      setError(t('login.general_error'));
    } finally {
      setLoading(false);
    }
  };

  const authenticateUser = async (event) => {
    event.preventDefault();
    resetMessages();

    const normalizedUserId = userId.trim();
    const normalizedAccessCode = accessCode
      .trim()
      .toUpperCase();

    if (!normalizedUserId || !normalizedAccessCode) {
      setError(t('login.missing_credentials'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/user-init`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: normalizedUserId,
            accessCode: normalizedAccessCode,
            language
          })
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        setError(t('login.invalid_credentials'));
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error || 'authentication_failed'
        );
      }

      localStorage.setItem('smartstudy_user_id', data.userId);
      localStorage.setItem('smartstudy_access_code', normalizedAccessCode);

      onAuthenticated?.(data);
    } catch (requestError) {
      console.error(
        'Pseudonymous login failed:',
        requestError
      );

      setError(t('login.general_error'));
    } finally {
      setLoading(false);
    }
  };

  const copyAccessData = async () => {
    if (!createdUser) {
      return;
    }

    const content = [
      `${t('login.user_id')}: ${createdUser.userId}`,
      `${t('login.access_code')}: ${createdUser.accessCode}`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (copyError) {
      console.error(
        'Copying access data failed:',
        copyError
      );
    }
  };

  const continueWithCreatedUser = () => {
    if (!createdUser) {
      return;
    }

    onAuthenticated?.(createdUser);
  };

  const returnToStart = () => {
    resetMessages();
    setAccessCode('');
    setCreatedUser(null);
    setView('start');
  };

  const showBackButton = view !== 'start';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 px-4 py-6">
      <div className="w-full max-w-[30rem] bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl px-6 py-6 md:px-7 md:py-7 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            {showBackButton && (
              <button
                type="button"
                onClick={returnToStart}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('login.back')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
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
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {['sl', 'en'].map((lng) => (
                <button
                  key={lng}
                  type="button"
                  onClick={() => i18n.changeLanguage(lng)}
                  className={`px-2 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                    language === lng
                      ? 'bg-white text-[#0a86dd] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {lng}
                </button>
              ))}
            </div>
          </div>
        </div>

        <img
          src={logo}
          alt="SmartStudy"
          className="mx-auto mb-5 h-16 md:h-20 w-auto object-contain"
        />

        {view === 'start' && (
          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
              {t('login.welcome_text')}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed mb-6 whitespace-pre-line">
              {t('login.description')}
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setView('create');
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#0a86dd] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0976c3] transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                {t('login.new_session')}
              </button>

              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setView('login');
                }}
                className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                {t('login.existing_session')}
              </button>
            </div>
          </div>
        )}

        {view === 'create' && (
          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
              {t('login.create_title')}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed mb-5 whitespace-pre-line">
              {t('login.create_description')}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={createUser}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#0a86dd] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0976c3] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}

              {t('login.create_button')}
            </button>
          </div>
        )}

        {view === 'created' && createdUser && (
          <div>
            <div className="text-center mb-5">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
                {t('login.access_ready')}
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {t('login.save_data')}
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  {t('login.user_id')}
                </label>

                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs md:text-sm font-mono text-slate-800 break-all">
                  {createdUser.userId}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  {t('login.access_code')}
                </label>

                <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-center text-base font-bold tracking-wider text-[#0a86dd]">
                  {createdUser.accessCode}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={copyAccessData}
              className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors mb-3"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}

              {copied
                ? t('login.copied')
                : t('login.copy')}
            </button>

            <button
              type="button"
              onClick={continueWithCreatedUser}
              className="w-full flex items-center justify-center gap-2 bg-[#0a86dd] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0976c3] transition-colors"
            >
              {t('login.continue')}
            </button>
          </div>
        )}

        {view === 'login' && (
          <div>
            <div className="text-center mb-5">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
                {t('login.login_title')}
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {t('login.login_description')}
              </p>
            </div>

            <form
              onSubmit={authenticateUser}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="user-id"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  {t('login.user_id')}
                </label>

                <input
                  id="user-id"
                  type="text"
                  value={userId}
                  onChange={(event) =>
                    setUserId(event.target.value)
                  }
                  placeholder={t(
                    'login.user_id_placeholder'
                  )}
                  autoComplete="username"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0a86dd] transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="access-code"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  {t('login.access_code')}
                </label>

                <input
                  id="access-code"
                  type="text"
                  value={accessCode}
                  onChange={(event) =>
                    setAccessCode(
                      event.target.value.toUpperCase()
                    )
                  }
                  placeholder={t(
                    'login.access_code_placeholder'
                  )}
                  autoComplete="current-password"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono uppercase tracking-wide outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#0a86dd] transition-all"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#0a86dd] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0976c3] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}

                {t('login.login_button')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;