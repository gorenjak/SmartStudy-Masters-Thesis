import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, ArrowRight, Library } from 'lucide-react';
// import TopicSearch from '../components/TopicSearch';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const Dashboard = ({ user }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    axios.get(`${API_URL}/api/lessons`)
      .then(res => {
        setLessons(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading lessons", err);
        setLoading(false);
      });
  }, []);

  const getLessonTitle = (lesson) => {
    const lang = i18n.language?.startsWith('en') ? 'en' : 'sl';

    if (lesson.topic && typeof lesson.topic === 'object') {
      return lesson.topic[lang] || lesson.topic['sl'] || t('no_title');
    }

    return lesson.topic || t('unknown_topic');
  };

  return (
    <main className="max-w-6xl mx-auto mt-10 px-6 pb-6">
      
      {/* 1. SEKCIJA: ISKANJE IN GENERIRANJE */}
      <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
          {t('dashboard_title')}
        </h1>

        <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed">
          {t('dashboard_subtitle_2.0')}
        </p>
       {/* 
        <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed">
          {t('dashboard_subtitle')}
        </p>

        <TopicSearch userId={user?.userId} />
      */}
      </div>

      <hr className="border-slate-100 mb-6" />

      {/* 2. SEKCIJA: KNJIŽNICA OBSTOJEČIH LEKCIJ */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-[#0a86dd]">
            <Library size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {t('library_title')}
            </h2>
            <p className="text-slate-500 text-sm italic">
              {t('library_subtitle')}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-[#0a86dd] border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-400 animate-pulse">
            {t('loading_library')}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {lessons.map(lesson => (
            <div 
              key={lesson.lesson_id} 
              onClick={() => navigate(`/lesson/${lesson.lesson_id}`)}
              className="group relative p-8 bg-white rounded-3xl shadow-sm border-2 border-transparent hover:border-[#0a86dd] cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col h-full"
            >
              <div className="w-14 h-14 bg-blue-50 text-[#0a86dd] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#0a86dd] group-hover:text-white transition-all duration-300">
                <BookOpen size={28} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-[#0a86dd] transition-colors">
                {getLessonTitle(lesson)}
              </h3>
              
              <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed flex-grow">
                {t('lesson_card_desc')}
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                <div className="flex items-center text-[#0a86dd] font-bold text-sm">
                  <span className="tracking-widest uppercase">
                    {t('open_lesson')}
                  </span>
                  <ArrowRight
                    size={16}
                    className="ml-2 group-hover:translate-x-2 transition-transform"
                  />
                </div>
              </div>
            </div>
          ))}
          
          {/* PLACEHOLDER KARTICA
          <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-opacity min-h-[250px]">
            <div className="w-12 h-12 rounded-full border-2 border-slate-300 flex items-center justify-center mb-4 text-slate-400 text-xl font-bold">
              +
            </div>
            <p className="text-slate-500 text-sm font-medium">
              {t('add_new_topic_hint')}
            </p>
          </div>  */}
        </div>
      )}
    </main>
  );
};

export default Dashboard;