'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { translations } from '@/lib/translations';

interface HeroProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  currentLang: 'kh' | 'en'; // 🟢 ទទួល Prop ភាសាពី HomePage
}

export default function HeroSection({ searchTerm, onSearchChange, currentLang }: HeroProps) {
  const t = translations[currentLang];

  const [heroData, setHeroData] = useState({
    systemName: currentLang === 'kh' ? 'ផ្ទះយើង' : 'Our Home',
    heroTitle: t.hero.mainTitle,
    heroSubtitle: t.hero.subtitle,
    heroBackground: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'
  });

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const response = await api.get('/admin/settings');
        if (response.data) {
          setHeroData({
            systemName: response.data.system_name || (currentLang === 'kh' ? 'ផ្ទះយើង' : 'Our Home'),
            heroTitle: response.data.hero_title || t.hero.mainTitle,
            heroSubtitle: response.data.hero_subtitle || t.hero.subtitle,
            heroBackground: response.data.hero_background || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'
          });
        }
      } catch (error) {
        console.error("Error fetching hero data:", error);
      }
    };

    fetchHeroData();
    window.addEventListener('settingsUpdated', fetchHeroData);
    return () => window.removeEventListener('settingsUpdated', fetchHeroData);
  }, [currentLang, t.hero]);

  return (
    <div className="relative overflow-hidden bg-slate-900 text-white py-24 sm:py-32">
      {/* Background Image */}
      <img
        src={heroData.heroBackground}
        alt="Real Estate Cover"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-40 brightness-[0.4]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>

      {/* 🔴 បានលុប Language Toggle Button ចោលដើម្បីកុំឱ្យស្ទួនជាមួយ Navbar */}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide mb-5 backdrop-blur-sm">
          {t.hero.badge}
        </span>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-6 text-white drop-shadow-md">
          {t.hero.mainTitle} <span className="text-indigo-400">{heroData.systemName}</span> <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            {heroData.heroTitle}
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium mb-10 drop-shadow">
          {heroData.heroSubtitle}
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto bg-white p-2 rounded-2xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-slate-200">
          <div className="flex items-center gap-3 w-full px-3 py-2 sm:py-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-slate-400 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.603 10.603z" />
            </svg>
            <input
              type="text"
              placeholder={t.hero.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-sm font-medium"
            />
          </div>
          <button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl sm:rounded-full font-bold text-sm shadow-md transition-colors">
            {t.hero.searchButton}
          </button>
        </div>
      </div>
    </div>
  );
}