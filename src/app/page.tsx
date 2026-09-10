"use client";

import { useKochotStore } from '@/lib/store';
import Leaderboard from '@/components/Leaderboard';
import RankingForm from '@/components/RankingForm';
import TeamGenerator from '@/components/TeamGenerator';
import ManualRebalance from '@/components/ManualRebalance';
import { useState } from 'react';
import { Users, Trophy, ClipboardList, RefreshCw } from 'lucide-react';

export default function Home() {
  const store = useKochotStore();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rank' | 'teams' | 'rebalance'>('leaderboard');

  if (!store.isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600 font-bold text-2xl" dir="rtl">
      טוען נתונים...
    </div>
  );

  const scores = store.calculateScores();

  return (
    <div className="min-h-screen p-2 md:p-6 lg:p-10 font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 mt-6 text-center">
          <div className="inline-flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-3xl shadow-xl mb-6 transform -rotate-3 hover:rotate-0 transition-transform">
            <Users size={56} className="text-white" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 mb-4 tracking-tight drop-shadow-sm">
            כוחות
          </h1>
          <p className="text-gray-600 text-lg md:text-xl font-bold max-w-md mx-auto">
            מערכת חכמה לדירוג שחקנים ויצירת קבוצות מאוזנות
          </p>
        </header>

        <div className="flex justify-center mb-10 overflow-x-auto p-2 hide-scrollbar">
          <div className="flex bg-white rounded-2xl shadow-lg p-2 min-w-max border-2 border-indigo-100 gap-2">
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl font-black text-lg transition-all ${activeTab === 'leaderboard' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md transform scale-105' : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'}`}
            >
              <Trophy size={24} />
              <span className="hidden sm:inline">טבלת מובילים</span>
            </button>
            <button 
              onClick={() => setActiveTab('rank')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl font-black text-lg transition-all ${activeTab === 'rank' ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-md transform scale-105' : 'text-gray-500 hover:bg-fuchsia-50 hover:text-fuchsia-600'}`}
            >
              <ClipboardList size={24} />
              <span className="hidden sm:inline">שלח דירוג</span>
            </button>
            <button 
              onClick={() => setActiveTab('teams')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl font-black text-lg transition-all ${activeTab === 'teams' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md transform scale-105' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
            >
              <Users size={24} />
              <span className="hidden sm:inline">עשה כוחות</span>
            </button>
            <button 
              onClick={() => setActiveTab('rebalance')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl font-black text-lg transition-all ${activeTab === 'rebalance' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md transform scale-105' : 'text-gray-500 hover:bg-teal-50 hover:text-teal-600'}`}
            >
              <RefreshCw size={24} />
              <span className="hidden sm:inline">איזון מחדש</span>
            </button>
          </div>
        </div>

        <main className="pb-20">
          {activeTab === 'leaderboard' && <Leaderboard scores={scores} onAddPlayer={store.addPlayer} />}
          {activeTab === 'rank' && <RankingForm players={store.players} onSubmitRanking={store.addRanking} getRankingForRater={store.getRankingForRater} />}
          {activeTab === 'teams' && <TeamGenerator scores={scores} />}
          {activeTab === 'rebalance' && <ManualRebalance scores={scores} />}
        </main>
      </div>
    </div>
  );
}
