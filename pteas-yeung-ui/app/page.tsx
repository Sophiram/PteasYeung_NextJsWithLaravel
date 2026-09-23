'use client';

import React, { useState } from 'react';
import { useGetRoomsQuery } from '@/store/api/roomsApi';
import { useLanguage } from '@/context/LanguageContext';
import Navbar from '@/app/components/Navbar';
import HeroSection from '@/app/components/HeroSection';
import RoomCard from '@/app/components/RoomCard';
import RoomCardSkeleton from '@/app/components/RoomCardSkeleton';
import Footer from '@/app/components/Footer';
import Loading from '@/app/components/Loading';

const t = {
  kh: {
    allRooms: 'បន្ទប់ជួលទាំងអស់',
    searchResults: 'លទ្ធផលស្វែងរក',
    total: 'សរុប',
    roomsShown: 'បន្ទប់ត្រូវបានបង្ហាញ',
    loadingText: 'កំពុងទាញទិន្នន័យបន្ទប់ជួល...',
    error: 'មិនអាចទាញទិន្នន័យបន្ទប់បានទេ!',
    notFound: 'រកមិនឃើញបន្ទប់ដែលអ្នកចង់បានឡើយ។',
    retry: 'ព្យាយាមម្តងទៀត',
  },
  en: {
    allRooms: 'All Available Rooms',
    searchResults: 'Search Results',
    total: 'Total',
    roomsShown: 'rooms displayed',
    loadingText: 'Loading rooms data...',
    error: 'Failed to fetch rooms data!',
    notFound: '🔍 No rooms match your search.',
    retry: 'Try again',
  },
};

export default function HomePage() {
  const { lang, setLang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: rooms = [], isLoading, isError, refetch } = useGetRoomsQuery();

  const filteredRooms = rooms.filter((room) => {
    const search = searchTerm.toLowerCase();
    return (
      room.room_number?.toLowerCase().includes(search) ||
      room.type?.toLowerCase().includes(search) ||
      room.property?.title?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <div>
        {/* Navbar */}
        <Navbar currentLang={lang} onLangChange={setLang} />

        {/* Hero with search */}
        <HeroSection searchTerm={searchTerm} onSearchChange={setSearchTerm} currentLang={lang} />

        {/* Room listing section */}
        <main id="rooms-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                {searchTerm ? t[lang].searchResults : t[lang].allRooms}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {t[lang].total} {filteredRooms.length} {t[lang].roomsShown}
              </p>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <RoomCardSkeleton key={n} />
              ))}
            </div>
          )}

          {/* Error state */}
          {isError && !isLoading && (
            <div className="text-center py-10">
              <p className="text-rose-500 font-bold mb-3">{t[lang].error}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
              >
                {t[lang].retry}
              </button>
            </div>
          )}

          {/* Empty search result */}
          {!isLoading && !isError && filteredRooms.length === 0 && (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400 font-medium">
              {t[lang].notFound}
            </div>
          )}

          {/* Room grid */}
          {!isLoading && filteredRooms.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
              {filteredRooms.map((room) => (
                <RoomCard key={room.id} room={room} currentLang={lang} />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer currentLang={lang} />
    </div>
  );
}