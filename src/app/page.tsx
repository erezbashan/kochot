"use client";

import { useKochotStore } from '@/lib/store';
import Leaderboard from '@/components/Leaderboard';
import RankingForm from '@/components/RankingForm';
import TeamGenerator from '@/components/TeamGenerator';
import { useState } from 'react';
import { Users, Trophy, ClipboardList } from 'lucide-react';

export default function Home() {
  const store = useKochotStore();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rank' | 'teams'>('leaderboard');

  if (!store.isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600 font-bold text-xl" dir="rtl">
      טוען נתונים...
    </div>
  );

  const scores = store.calculateScores();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-2 md:p-6 lg:p-10 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 mt-4 text-center">
          <div className="inline-block bg-white p-4 rounded-full shadow-sm mb-4">
            <Users size={40} className="text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3 tracking-tight">
            כוחות
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-medium max-w-sm mx-auto">
            מערכת חכמה לדירוג שחקנים ויצירת קבוצות מאוזנות
          </p>
        </header>

        <div className="flex justify-center mb-8 overflow-x-auto p-1 hide-scrollbar">
          <div className="flex bg-white rounded-xl shadow-sm p-1 min-w-max border border-slate-200">
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm md:text-base transition-all ${activeTab === 'leaderboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Trophy size={18} />
              טבלת מובילים
            </button>
            <button 
              onClick={() => setActiveTab('rank')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm md:text-base transition-all ${activeTab === 'rank' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <ClipboardList size={18} />
              שלח דירוג
            </button>
            <button 
              onClick={() => setActiveTab('teams')}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm md:text-base transition-all ${activeTab === 'teams' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Users size={18} />
              עשה כוחות
            </button>
          </div>
        </div>

        <main className="pb-16 transition-all duration-300 ease-in-out">
          {activeTab === 'leaderboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Leaderboard scores={scores} onAddPlayer={store.addPlayer} />
            </div>
          )}
          {activeTab === 'rank' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <RankingForm players={store.players} onSubmitRanking={store.addRanking} getRankingForRater={store.getRankingForRater} />
            </div>
          )}
          {activeTab === 'teams' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TeamGenerator scores={scores} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
