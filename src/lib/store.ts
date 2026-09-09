import { useState, useEffect } from 'react';

export type Player = {
  id: string;
  name: string;
};

export type Ranking = {
  id: string;
  raterId: string;
  rankedPlayerIds: string[]; // Ordered from best (0) to worst
  timestamp: number;
};

export type PlayerScore = {
  player: Player;
  score: number;
  rankingsCount: number;
};

// Hook for local storage state
export function useKochotStore() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from local storage on mount
    const savedPlayers = localStorage.getItem('kochot_players');
    const savedRankings = localStorage.getItem('kochot_rankings');
    if (savedPlayers) setPlayers(JSON.parse(savedPlayers));
    if (savedRankings) setRankings(JSON.parse(savedRankings));
    setIsLoaded(true);
  }, []);

  const savePlayers = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    localStorage.setItem('kochot_players', JSON.stringify(newPlayers));
  };

  const saveRankings = (newRankings: Ranking[]) => {
    setRankings(newRankings);
    localStorage.setItem('kochot_rankings', JSON.stringify(newRankings));
  };

  const addPlayer = (name: string) => {
    const newPlayer = { id: Date.now().toString(), name };
    savePlayers([...players, newPlayer]);
  };

  const addRanking = (raterId: string, rankedPlayerIds: string[]) => {
    const newRanking = {
      id: Date.now().toString(),
      raterId,
      rankedPlayerIds,
      timestamp: Date.now(),
    };
    saveRankings([...rankings, newRanking]);
  };

  const calculateScores = (): PlayerScore[] => {
    const scoresMap = new Map<string, { totalScore: number; count: number }>();

    // Initialize map
    players.forEach(p => scoresMap.set(p.id, { totalScore: 0, count: 0 }));

    rankings.forEach(ranking => {
      const K = ranking.rankedPlayerIds.length;
      if (K <= 1) return; // Cannot rank just 1 person

      ranking.rankedPlayerIds.forEach((playerId, index) => {
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
        score: data.count > 0 ? data.totalScore / data.count : 50, // Default to 50 if unranked
        rankingsCount: data.count,
      };
    });

    // Sort by score descending (higher is better)
    return playerScores.sort((a, b) => b.score - a.score);
  };

  return {
    players,
    rankings,
    addPlayer,
    addRanking,
    calculateScores,
    isLoaded,
    clearAll: () => {
      savePlayers([]);
      saveRankings([]);
    }
  };
}
