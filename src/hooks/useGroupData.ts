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
    // Pass 1: Calculate raw average scores (ignoring the missing spot)
    const pass1Map = new Map<string, { totalScore: number; count: number }>();
    players.forEach(p => pass1Map.set(p.id, { totalScore: 0, count: 0 }));

    rankings.forEach(ranking => {
      const K = ranking.rankedPlayerIds.length;
      if (K <= 1) return; // Cannot rank just 1 person in raw calculation

      ranking.rankedPlayerIds.forEach((playerId: string, index: number) => {
        const R = index + 1; // 1-based rank
        const score = ((K - R) / (K - 1)) * 100;
        
        const current = pass1Map.get(playerId);
        if (current) {
          current.totalScore += score;
          current.count += 1;
        }
      });
    });

    const pass1Averages = new Map<string, number>();
    players.forEach(p => {
      const data = pass1Map.get(p.id)!;
      pass1Averages.set(p.id, data.count > 0 ? data.totalScore / data.count : 50);
    });

    // Pass 2: Calculate adjusted scores, where each voter "occupies" the slot closest to their Pass 1 average
    const finalMap = new Map<string, { totalScore: number; count: number }>();
    players.forEach(p => finalMap.set(p.id, { totalScore: 0, count: 0 }));

    rankings.forEach(ranking => {
      const K = ranking.rankedPlayerIds.length;
      if (K === 0) return;

      // Voter's estimated strength based on Pass 1
      const voterScore = pass1Averages.get(ranking.raterId) ?? 50;

      // Generate K+1 possible slots from 100 down to 0
      const slots: number[] = [];
      for (let j = 0; j <= K; j++) {
        slots.push(100 * (K - j) / K);
      }

      // Find the slot closest to the voter's score
      let bestJ = 0;
      let minDiff = Infinity;
      for (let j = 0; j <= K; j++) {
        const diff = Math.abs(slots[j] - voterScore);
        if (diff < minDiff) {
          minDiff = diff;
          bestJ = j;
        }
      }

      // Remove the slot that the voter occupies
      slots.splice(bestJ, 1);

      // Distribute remaining K slots to the ranked players
      ranking.rankedPlayerIds.forEach((playerId: string, index: number) => {
        const current = finalMap.get(playerId);
        if (current) {
          current.totalScore += slots[index];
          current.count += 1;
        }
      });
    });

    const playerScores: PlayerScore[] = players.map(p => {
      const data = finalMap.get(p.id)!;
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
