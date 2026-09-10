import { db } from './firebase';
import { 
  collection, doc, getDoc, setDoc, updateDoc, 
  onSnapshot, query, where, addDoc, deleteDoc, getDocs 
} from 'firebase/firestore';

export type GroupSettings = {
  showRanking: boolean;
  requireLoginToRank: boolean;
  strictAdmin: boolean;
};

export type Group = {
  id: string;
  name: string;
  admins: string[];
  settings: GroupSettings;
};

export type Player = {
  id: string;
  name: string;
  claimedByUserId: string | null;
};

export type Ranking = {
  id: string;
  raterId: string;
  rankedPlayerIds: string[];
  timestamp: number;
};

export async function createGroup(name: string, userId: string): Promise<string> {
  // Using uuid or auto-id
  const groupRef = doc(collection(db, 'groups'));
  const newGroup: Group = {
    id: groupRef.id,
    name,
    admins: [userId],
    settings: {
      showRanking: false,
      requireLoginToRank: false,
      strictAdmin: false
    }
  };
  await setDoc(groupRef, newGroup);
  return groupRef.id;
}

export async function getUserGroups(userId: string): Promise<Group[]> {
  const q = query(collection(db, 'groups'), where('admins', 'array-contains', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Group);
}

export async function addPlayerToGroup(groupId: string, name: string): Promise<void> {
  const playerRef = doc(collection(db, `groups/${groupId}/players`));
  await setDoc(playerRef, {
    id: playerRef.id,
    name,
    claimedByUserId: null
  });
}

export async function removePlayerFromGroup(groupId: string, playerId: string): Promise<void> {
  const playerRef = doc(db, `groups/${groupId}/players`, playerId);
  await deleteDoc(playerRef);
}

export async function claimPlayer(groupId: string, playerId: string, userId: string): Promise<void> {
  const playerRef = doc(db, `groups/${groupId}/players`, playerId);
  await updateDoc(playerRef, { claimedByUserId: userId });
}

export async function submitRanking(groupId: string, raterId: string, rankedPlayerIds: string[]): Promise<void> {
  // Overwrite if rater already ranked, else add new
  const q = query(collection(db, `groups/${groupId}/rankings`), where('raterId', '==', raterId));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const existingDoc = snapshot.docs[0];
    await updateDoc(existingDoc.ref, {
      rankedPlayerIds,
      timestamp: Date.now()
    });
  } else {
    const rankingRef = doc(collection(db, `groups/${groupId}/rankings`));
    await setDoc(rankingRef, {
      id: rankingRef.id,
      raterId,
      rankedPlayerIds,
      timestamp: Date.now()
    });
  }
}

export async function updateGroupSettings(groupId: string, settings: Partial<GroupSettings>): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    [`settings.${Object.keys(settings)[0]}`]: Object.values(settings)[0]
  });
}
