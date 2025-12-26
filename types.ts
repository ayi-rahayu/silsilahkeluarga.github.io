
export interface Person {
  id: number;
  fullName: string;
  nickname?: string;
  gender: 'Male' | 'Female';
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  photo?: string; // base64 string
  occupation?: string;
  education?: string;
  parentId1?: number | null;
  parentId2?: number | null;
  spouseIds?: number[];
  birthOrder?: number; // Urutan kelahiran anak
}

export enum ViewMode {
  Tree = 'tree',
  List = 'list',
  Timeline = 'timeline',
}
