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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-blue-600 font-bold text-xl" dir="rtl">
      טוען נתונים...
    </div>
  );

  const scores = store.calculateScores();

  return (
    <div className="min-h-screen p-2 md:p-6 font-sans bg-slate-50 text-slate-800" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6 mt-4 text-center">
          <div className="inline-flex items-center justify-center bg-blue-100 p-3 rounded-2xl mb-3">
            <Users size={32} className="text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">
            כוחות
          </h1>
        </header>

        <div className="flex justify-center mb-6 overflow-x-auto p-1 hide-scrollbar">
          <div className="flex bg-white rounded-xl shadow-sm p-1.5 min-w-max border border-slate-200 gap-1">
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'leaderboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Trophy size={20} />
              <span>מובילים</span>
            </button>
            <button 
              onClick={() => setActiveTab('rank')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'rank' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <ClipboardList size={20} />
              <span>דירוג</span>
            </button>
            <button 
              onClick={() => setActiveTab('teams')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'teams' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Users size={20} />
              <span>עשה כוחות</span>
            </button>
            <button 
              onClick={() => setActiveTab('rebalance')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'rebalance' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <RefreshCw size={20} />
              <span>איזון מחדש</span>
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
