
export interface Person {
  id: number;
  fullName: string;
  nickname?: string;
  gender: 'Male' | 'Female';
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  photo?: string; // base64 string
  photoUrl?: string; // URL for Firebase Storage
  occupation?: string;
  education?: string;
  parentId1?: number | null;
  parentId2?: number | null;
  spouseIds?: number[];
  birthOrder?: number; // Urutan kelahiran anak
  _firestoreId?: string; // Internal Firestore document ID
}

export enum ViewMode {
  Tree = 'tree',
  List = 'list',
  Timeline = 'timeline',
}
