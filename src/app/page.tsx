"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createGroup, getUserGroups, Group } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { Users, LogIn, Plus, ArrowLeft } from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const { user, loading, signOut } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      getUserGroups(user.uid).then(setGroups);
    }
  }, [user]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGroupName.trim()) return;
    
    setCreating(true);
    try {
      const groupId = await createGroup(newGroupName.trim(), user.uid);
      router.push(`/g/${groupId}`);
    } catch (error) {
      console.error(error);
      toast.error('שגיאה ביצירת קבוצה');
    }
    setCreating(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">טוען...</div>;
  }

  return (
    <div className="min-h-screen p-6 font-sans bg-slate-50 text-slate-800" dir="rtl">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <div className="max-w-2xl mx-auto mt-10">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center bg-blue-100 p-4 rounded-3xl mb-4">
            <Users size={48} className="text-blue-600" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-2 tracking-tight">כוחות</h1>
          <p className="text-slate-500 text-lg font-medium">המערכת החכמה לחלוקת קבוצות ספורט</p>
        </header>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          {!user ? (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-6 text-slate-800">התחבר כדי לנהל קבוצות</h2>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 flex items-center gap-3 mx-auto shadow-md transition-colors"
              >
                <LogIn size={24} />
                התחבר למערכת
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                <div className="flex items-center gap-3">
                  {user.photoURL && <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />}
                  <div>
                    <h2 className="font-bold text-slate-800">שלום, {user.displayName}</h2>
                    <span className="text-sm text-slate-500">{user.email}</span>
                  </div>
                </div>
                <button onClick={signOut} className="text-slate-500 hover:text-red-500 text-sm font-bold">התנתק</button>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-xl mb-4 text-slate-800">הקבוצות שלי</h3>
                {groups.length === 0 ? (
                  <p className="text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">עדיין אין לך קבוצות. צור אחת למטה!</p>
                ) : (
                  <div className="space-y-3">
                    {groups.map(g => (
                      <button 
                        key={g.id}
                        onClick={() => router.push(`/g/${g.id}`)}
                        className="w-full bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 p-4 rounded-xl flex justify-between items-center transition-colors group"
                      >
                        <span className="font-bold text-lg text-slate-800 group-hover:text-blue-800">{g.name}</span>
                        <ArrowLeft className="text-slate-400 group-hover:text-blue-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-xl mb-4 text-blue-900">יצירת קבוצה חדשה</h3>
                <form onSubmit={handleCreateGroup} className="flex gap-3">
                  <input 
                    type="text" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="שם הקבוצה (למשל: כדורגל שישי)"
                    className="flex-1 px-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 outline-none font-medium"
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={creating}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 shadow-md"
                  >
                    <Plus size={20} />
                    {creating ? 'יוצר...' : 'צור'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
