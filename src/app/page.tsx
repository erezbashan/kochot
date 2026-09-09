"use client";

import { useKochotStore } from '@/lib/store';
import Leaderboard from '@/components/Leaderboard';
import RankingForm from '@/components/RankingForm';
import TeamGenerator from '@/components/TeamGenerator';
import { useState } from 'react';

export default function Home() {
  const store = useKochotStore();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rank' | 'teams'>('leaderboard');

  if (!store.isLoaded) return <div className="p-8 text-center" dir="rtl">טוען...</div>;

  const scores = store.calculateScores();

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-2 md:p-8 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 mt-4 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-blue-900 mb-2">כוחות (Kochot)</h1>
          <p className="text-gray-600 text-sm md:text-base">נהל שחקנים, דרג, וצור קבוצות מאוזנות</p>
        </header>

        <div className="flex justify-center mb-6 overflow-x-auto p-1">
          <div className="flex gap-2 min-w-max">
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 md:py-3 rounded-lg font-bold text-sm md:text-base transition-colors ${activeTab === 'leaderboard' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              טבלת מובילים
            </button>
            <button 
              onClick={() => setActiveTab('rank')}
              className={`px-4 py-2 md:py-3 rounded-lg font-bold text-sm md:text-base transition-colors ${activeTab === 'rank' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              שלח דירוג
            </button>
            <button 
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 md:py-3 rounded-lg font-bold text-sm md:text-base transition-colors ${activeTab === 'teams' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              עשה כוחות
            </button>
          </div>
        </div>

        <main className="pb-10">
          {activeTab === 'leaderboard' && (
            <Leaderboard scores={scores} onAddPlayer={store.addPlayer} />
          )}
          {activeTab === 'rank' && (
            <RankingForm players={store.players} onSubmitRanking={store.addRanking} />
          )}
          {activeTab === 'teams' && (
            <TeamGenerator scores={scores} />
          )}
        </main>
      </div>
    </div>
  );
}
