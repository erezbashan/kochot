import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { Group, Player, Ranking } from '@/lib/firestore';

export type PlayerScore = {
  player: Player;
  score: number;
  rankingsCount: number;
};

export function useGroupData(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;

    const groupRef = doc(db, 'groups', groupId);
    const playersRef = collection(db, `groups/${groupId}/players`);
    const rankingsRef = collection(db, `groups/${groupId}/rankings`);

    let isGroupLoaded = false;
    let isPlayersLoaded = false;
    let isRankingsLoaded = false;

    const checkLoaded = () => {
      if (isGroupLoaded && isPlayersLoaded && isRankingsLoaded) {
        setLoading(false);
      }
    };

    const unsubGroup = onSnapshot(groupRef, (doc) => {
      if (doc.exists()) {
        setGroup(doc.data() as Group);
      } else {
        setGroup(null);
      }
      isGroupLoaded = true;
      checkLoaded();
    });

    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      setPlayers(snapshot.docs.map(doc => doc.data() as Player));
      isPlayersLoaded = true;
      checkLoaded();
    });

    const unsubRankings = onSnapshot(rankingsRef, (snapshot) => {
      setRankings(snapshot.docs.map(doc => doc.data() as Ranking));
      isRankingsLoaded = true;
      checkLoaded();
    });

    return () => {
      unsubGroup();
      unsubPlayers();
      unsubRankings();
    };
  }, [groupId]);

  const calculateScores = (): PlayerScore[] => {
    const scoresMap = new Map<string, { totalScore: number; count: number }>();

    players.forEach(p => scoresMap.set(p.id, { totalScore: 0, count: 0 }));

    rankings.forEach(ranking => {
      const K = ranking.rankedPlayerIds.length;
      if (K <= 1) return; // Cannot rank just 1 person

      ranking.rankedPlayerIds.forEach((playerId: string, index: number) => {
        const R = index + 1; // 1-based rank
        const score = ((K - R) / (K - 1)) * 100;
        
        const current = scoresMap.get(playerId);
        if (current) {
          current.totalScore += score;
          current.count += 1;
        }
      });
    });

    const playerScores: PlayerScore[] = players.map(p => {
      const data = scoresMap.get(p.id)!;
      return {
        player: p,
        score: data.count > 0 ? data.totalScore / data.count : 50,
        rankingsCount: data.count,
      };
    });

    return playerScores.sort((a, b) => b.score - a.score);
  };

  const getRankingForRater = (raterId: string) => {
    return rankings.find(r => r.raterId === raterId);
  };

  return { group, players, rankings, loading, calculateScores, getRankingForRater };
}
