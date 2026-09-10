"use client";

import { useGroupData } from '@/hooks/useGroupData';
import { useAuth } from '@/hooks/useAuth';
import Leaderboard from '@/components/Leaderboard';
import RankingForm from '@/components/RankingForm';
import TeamGenerator from '@/components/TeamGenerator';
import ManualRebalance from '@/components/ManualRebalance';
import GroupSettingsPanel from '@/components/GroupSettingsPanel';
import PlayersList from '@/components/PlayersList';
import AuthModal from '@/components/AuthModal';
import { addPlayerToGroup, removePlayerFromGroup, submitRanking, claimPlayer } from '@/lib/firestore';
import { useState, use } from 'react';
import { Users, Trophy, ClipboardList, RefreshCw, Settings, LogIn, Share2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  // Next.js 15 requires unwrapping params with use()
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;
  
  const { group, players, loading, calculateScores, getRankingForRater } = useGroupData(groupId);
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'teams' | 'players' | 'leaderboard' | 'rank' | 'rebalance' | 'settings'>('teams');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl" dir="rtl">טוען קבוצה...</div>;
  if (!group) return <div className="min-h-screen flex items-center justify-center font-bold text-xl text-red-600" dir="rtl">קבוצה לא נמצאה!</div>;

  const scores = calculateScores();
  const isAdmin = user ? group.admins.includes(user.uid) : false;
  
  // Settings checks
  const canSeeRankings = group.settings.showRanking || isAdmin;
  const requireLoginToRank = group.settings.requireLoginToRank;
  const canAddPlayers = !group.settings.strictAdmin || isAdmin;

  // Handle player claim
  const handleClaimAndRank = (raterId: string, rankedIds: string[]) => {
    if (user) {
      // Check if user already claimed someone
      const existingClaim = players.find(p => p.claimedByUserId === user.uid);
      if (!existingClaim) {
        // Claim this player
        claimPlayer(groupId, raterId, user.uid);
      } else if (existingClaim.id !== raterId) {
        alert("אתה כבר משויך לשחקן אחר בקבוצה זו.");
        return;
      }
    }
    
    // Save to local storage so the browser remembers anonymously
    if (typeof window !== 'undefined') {
      localStorage.setItem(`kochot_${groupId}_raterId`, raterId);
    }
    
    submitRanking(groupId, raterId, rankedIds);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('קישור הועתק!');
  };

  return (
    <div className="min-h-screen p-2 md:p-6 font-sans bg-slate-50 text-slate-800" dir="rtl">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <div className="max-w-3xl mx-auto">
        <header className="mb-6 mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-center sm:text-right">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-1">{group.name}</h1>
            <p className="text-sm text-slate-500">
              {players.length} שחקנים רשומים
            </p>
          </div>
          
          <div className="flex gap-2">
            <button onClick={copyLink} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 text-sm">
              <Share2 size={16} /> שתף
            </button>
            {!user ? (
              <button onClick={() => setShowAuthModal(true)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-200 text-sm">
                <LogIn size={16} /> התחבר
              </button>
            ) : (
              <>
                <button onClick={() => router.push('/')} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-700 text-sm">
                  לקבוצות שלי
                </button>
                <button onClick={signOut} className="bg-red-50 text-red-600 px-3 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-100 text-sm" title="התנתק">
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </header>

        <div className="flex justify-center mb-6 overflow-x-auto p-1 hide-scrollbar">
          <div className="flex bg-white rounded-xl shadow-sm p-1.5 min-w-max border border-slate-200 gap-1">
            <button 
              onClick={() => setActiveTab('teams')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'teams' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Users size={20} />
              <span>עשה כוחות</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('players')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'players' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Users size={20} />
              <span>שחקנים</span>
            </button>

            {canSeeRankings && (
              <button 
                onClick={() => setActiveTab('leaderboard')}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'leaderboard' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Trophy size={20} />
                <span>מובילים</span>
              </button>
            )}
            
            <button 
              onClick={() => setActiveTab('rank')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'rank' ? 'bg-fuchsia-50 text-fuchsia-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <ClipboardList size={20} />
              <span>דירוג</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('rebalance')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'rebalance' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <RefreshCw size={20} />
              <span>איזון מחדש</span>
            </button>

            {isAdmin && (
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Settings size={20} />
                <span>הגדרות קבוצה</span>
              </button>
            )}
          </div>
        </div>

        <main className="pb-20">
          {activeTab === 'teams' && <TeamGenerator scores={scores} showScores={canSeeRankings} />}
          {activeTab === 'players' && (
            <PlayersList 
              players={players} 
              onAddPlayer={(name) => addPlayerToGroup(groupId, name)} 
              onRemovePlayer={(playerId) => removePlayerFromGroup(groupId, playerId)}
              canAdd={canAddPlayers} 
            />
          )}
          {activeTab === 'leaderboard' && canSeeRankings && (
            <Leaderboard scores={scores} />
          )}
          {activeTab === 'rank' && (
            <RankingForm 
              groupId={groupId}
              players={players} 
              onSubmitRanking={handleClaimAndRank} 
              getRankingForRater={getRankingForRater} 
              requireLogin={requireLoginToRank}
              user={user}
            />
          )}
          {activeTab === 'rebalance' && <ManualRebalance scores={scores} showScores={canSeeRankings} />}
          {activeTab === 'settings' && isAdmin && (
            <GroupSettingsPanel group={group} />
          )}
        </main>
      </div>
    </div>
  );
}
