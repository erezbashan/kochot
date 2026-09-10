import { PlayerScore } from '@/hooks/useGroupData';

export type Team = {
  name: string; // 'לבן' or 'שחור'
  players: PlayerScore[];
  totalScore: number;
};

// Helper to calculate total score of an array of players
const calcScore = (players: PlayerScore[]) => players.reduce((sum, p) => sum + p.score, 0);

// Shuffle array
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateTeams(selectedPlayers: PlayerScore[]): { teamWhite: Team, teamBlack: Team } {
  const N = selectedPlayers.length;
  const half = N / 2;
  
  // To avoid always giving the same teams, we will generate a bunch of random valid splits,
  // score them based on the absolute difference between the two teams,
  // and pick randomly from the splits that are "close enough" to the best one.
  
  const NUM_SAMPLES = 5000;
  
  type Split = { white: PlayerScore[], black: PlayerScore[], diff: number };
  let bestSplits: Split[] = [];
  let minDiff = Infinity;
  
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const shuffled = shuffle(selectedPlayers);
    const white = shuffled.slice(0, half);
    const black = shuffled.slice(half);
    
    const whiteScore = calcScore(white);
    const blackScore = calcScore(black);
    const diff = Math.abs(whiteScore - blackScore);
    
    if (diff < minDiff) {
      minDiff = diff;
    }
    bestSplits.push({ white, black, diff });
  }
  
  // Filter splits that are within a small threshold of the absolute best split found
  // For example, within 5 points of the best difference
  const threshold = minDiff + 5.0; 
  const acceptableSplits = bestSplits.filter(s => s.diff <= threshold);
  
  // Pick a random split from the acceptable ones
  const chosenSplit = acceptableSplits[Math.floor(Math.random() * acceptableSplits.length)];
  
  return {
    teamWhite: {
      name: 'לבן',
      players: chosenSplit.white,
      totalScore: calcScore(chosenSplit.white)
    },
    teamBlack: {
      name: 'שחור',
      players: chosenSplit.black,
      totalScore: calcScore(chosenSplit.black)
    }
  };
}

// Rebalance by switching exactly ONE player from teamA and ONE from teamB
// Returns the new rebalanced teams, or null if no switch improves the balance
export function rebalanceTeams(teamA: Team, teamB: Team): { teamA: Team, teamB: Team, swappedOutA: string, swappedOutB: string } | null {
  let currentDiff = Math.abs(teamA.totalScore - teamB.totalScore);
  
  let bestSwap = null;
  let bestDiff = currentDiff;
  
  for (let i = 0; i < teamA.players.length; i++) {
    for (let j = 0; j < teamB.players.length; j++) {
      const pA = teamA.players[i];
      const pB = teamB.players[j];
      
      const newScoreA = teamA.totalScore - pA.score + pB.score;
      const newScoreB = teamB.totalScore - pB.score + pA.score;
      const newDiff = Math.abs(newScoreA - newScoreB);
      
      if (newDiff < bestDiff) {
        bestDiff = newDiff;
        bestSwap = { i, j, pA, pB };
      }
    }
  }
  
  // Only return if it actually improves the balance by at least some margin
  if (bestSwap && bestDiff < currentDiff - 0.1) {
    const newTeamAPlayers = [...teamA.players];
    const newTeamBPlayers = [...teamB.players];
    
    newTeamAPlayers[bestSwap.i] = bestSwap.pB;
    newTeamBPlayers[bestSwap.j] = bestSwap.pA;
    
    return {
      teamA: { ...teamA, players: newTeamAPlayers, totalScore: calcScore(newTeamAPlayers) },
      teamB: { ...teamB, players: newTeamBPlayers, totalScore: calcScore(newTeamBPlayers) },
      swappedOutA: bestSwap.pA.player.name,
      swappedOutB: bestSwap.pB.player.name
    };
  }
  
  return null; // No single swap improves the balance
}
