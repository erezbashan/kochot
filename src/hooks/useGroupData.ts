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
      const now = Date.now();
      const allPlayers = snapshot.docs.map(doc => doc.data() as Player);
      const activePlayers = allPlayers.filter(p => !p.isGuest || (p.expiresAt && p.expiresAt > now));
      setPlayers(activePlayers);
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

  const normalPlayers = players.filter(p => !p.isGuest);
  const guestPlayers = players.filter(p => p.isGuest);

  const calculateScores = (): PlayerScore[] => {
    // Pass 1: Calculate raw average scores (ignoring the missing spot)
    const pass1Map = new Map<string, { totalScore: number; count: number }>();
    normalPlayers.forEach(p => pass1Map.set(p.id, { totalScore: 0, count: 0 }));

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
    normalPlayers.forEach(p => {
      const data = pass1Map.get(p.id)!;
      pass1Averages.set(p.id, data.count > 0 ? data.totalScore / data.count : 50);
    });

    // Pass 2: Calculate adjusted scores using N slots
    const finalMap = new Map<string, { totalScore: number; count: number }>();
    normalPlayers.forEach(p => finalMap.set(p.id, { totalScore: 0, count: 0 }));

    const N = normalPlayers.length;

    rankings.forEach(ranking => {
      const K = ranking.rankedPlayerIds.length;
      if (K === 0 || N <= 1) return;

      // Generate N possible slots from 100 down to 0
      const slots: number[] = [];
      for (let j = 0; j < N; j++) {
        slots.push(100 * (N - 1 - j) / (N - 1));
      }

      // Determine which players were NOT ranked by this voter (this includes the voter themselves AND "לא מכיר" players)
      const rankedSet = new Set(ranking.rankedPlayerIds);
      const unrankedIds = normalPlayers.filter(p => !rankedSet.has(p.id)).map(p => p.id);

      // Each unranked player absorbs the available slot closest to their Pass 1 average
      unrankedIds.forEach(id => {
        const baselineScore = pass1Averages.get(id) ?? 50;
        let bestJ = 0;
        let minDiff = Infinity;
        for (let j = 0; j < slots.length; j++) {
          const diff = Math.abs(slots[j] - baselineScore);
          if (diff < minDiff) {
            minDiff = diff;
            bestJ = j;
          }
        }
        slots.splice(bestJ, 1); // Remove the absorbed slot
      });

      // The remaining slots are given to the ranked players in the order they were ranked
      ranking.rankedPlayerIds.forEach((playerId: string, index: number) => {
        const current = finalMap.get(playerId);
        if (current) {
          current.totalScore += slots[index];
          current.count += 1;
        }
      });
    });

    const normalScores: PlayerScore[] = normalPlayers.map(p => {
      const data = finalMap.get(p.id)!;
      return {
        player: p,
        score: data.count > 0 ? data.totalScore / data.count : 50,
        rankingsCount: data.count,
      };
    });

    const guestScores: PlayerScore[] = guestPlayers.map(p => ({
      player: p,
      score: p.guestScore ?? 50,
      rankingsCount: 0
    }));

    return [...normalScores.sort((a, b) => b.score - a.score), ...guestScores];
  };

  const getRankingForRater = (raterId: string) => {
    return rankings.find(r => r.raterId === raterId);
  };

  return { group, players: normalPlayers, allActivePlayers: players, rankings, loading, calculateScores, getRankingForRater };
}
