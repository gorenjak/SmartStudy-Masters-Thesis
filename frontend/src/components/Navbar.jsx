import React, { useState } from 'react';
import { LogOut, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/SmartStudy.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const Navbar = ({
  user,
  config,
  onOpenInstructions,
  onLogout
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState('');

  const currentLanguage =
    i18n.language?.startsWith('en')
      ? 'en'
      : 'sl';

const handleLanguageChange = async (newLanguage) => {
  if (newLanguage === currentLanguage) return;

  await i18n.changeLanguage(newLanguage);

  if (!user?.userId) return;

  try {
    await axios.post(
      `${API_URL}/api/user-init`,
      {
        userId: user.userId,
        accessCode: localStorage.getItem(
          'smartstudy_access_code'
        ),
        language: newLanguage
      }
    );
  } catch (error) {
    console.error(
      'Saving language failed:',
      error.response?.data || error
    );
  }
};

  const handleLogout = () => {
    if (typeof onLogout === 'function') {
      onLogout();
    }

    navigate('/', {
      replace: true
    });
  };

  const handleDeleteUserData = async () => {
    if (!user?.userId || isDeleting) {
      return;
    }

    setDeleteError('');
    setIsDeleting(true);

    try {
      await axios.delete(
        `${API_URL}/api/delete-user-data`,
        {
          data: {
            userId: user.userId
          }
        }
      );

      setShowDeleteModal(false);

      if (typeof onLogout === 'function') {
        onLogout();
      }

      navigate('/', {
        replace: true
      });
    } catch (error) {
      console.error(
        'Deleting user data failed:',
        error
      );

      setDeleteError(
        t('withdrawal.delete_error')
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b px-4 sm:px-6 lg:px-8 py-1.5 flex justify-between items-center sticky top-0 z-50">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center"
          aria-label={t('dashboard')}
        >
          <img
            src={logo}
            alt="SmartStudy"
            className="h-10 w-auto object-contain hover:opacity-80 transition-opacity"
          />
        </button>

        <div className="flex items-center gap-3 sm:gap-5">
          {onOpenInstructions && (
            <button
              type="button"
              onClick={onOpenInstructions}
              className="hidden sm:inline-flex text-[11px] font-bold text-slate-500 hover:text-[#0a86dd] transition-colors"
            >
              {t('instructions.title')}
            </button>
          )}

          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {['sl', 'en'].map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => handleLanguageChange(language)}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  currentLanguage === language
                    ? 'bg-white text-[#0a86dd] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {language}
              </button>
            ))}
          </div>

          <div className="hidden md:block h-8 w-px bg-slate-200" />

          <div className="hidden md:flex flex-col items-end min-w-[300px]">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              {t('login.user_id')}
            </div>

            <div
              className="max-w-[300px] truncate text-[15px] font-semibold text-slate-700"
              title={user?.userId || ''}
            >
              {user?.userId || '—'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDeleteError('');
                setShowDeleteModal(true);
              }}
              title={t('withdrawal.open')}
              aria-label={t('withdrawal.open')}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={18} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title={t('logout')}
              aria-label={t('logout')}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#0a86dd] text-white hover:bg-[#086fb8] transition-colors shadow-sm"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-100 p-6">

            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-4">
              <AlertTriangle size={24} />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-3">
              {t('withdrawal.title')}
            </h2>

            <p className="text-sm text-slate-600 leading-6 mb-4">
              {t('withdrawal.description')}
            </p>

            <div className="rounded-2xl bg-red-50 border border-red-100 p-4 mb-5">
              <p className="text-sm text-red-700 leading-6">
                {t('withdrawal.warning')}
              </p>
            </div>

            {deleteError && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                {t('withdrawal.cancel')}
              </button>

              <button
                type="button"
                onClick={handleDeleteUserData}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    {t('withdrawal.deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />
                    {t('withdrawal.confirm')}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;