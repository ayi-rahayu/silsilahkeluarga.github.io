import { Person } from '../types';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy 
} from 'firebase/firestore';

const COLLECTION_NAME = 'people';

export const initDB = async (): Promise<void> => {
  // Firebase auto-initializes, no need for manual init
  return Promise.resolve();
};

export const addPerson = async (person: Omit<Person, 'id'>): Promise<number> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), person);
  return parseInt(docRef.id, 36); // Convert string ID to number for compatibility
};

export const getAllPeople = async (): Promise<Person[]> => {
  const q = query(collection(db, COLLECTION_NAME));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: parseInt(doc.id, 36) // Convert Firestore ID to number
  })) as Person[];
};

export const getPerson = async (id: number): Promise<Person | undefined> => {
  const docRef = doc(db, COLLECTION_NAME, id.toString(36));
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      ...docSnap.data(),
      id: parseInt(docSnap.id, 36)
    } as Person;
  }
  return undefined;
};

export const updatePerson = async (person: Person): Promise<Person> => {
  const { id, ...personData } = person;
  const docRef = doc(db, COLLECTION_NAME, id.toString(36));
  await updateDoc(docRef, personData);
  return person;
};

export const deletePerson = async (id: number): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id.toString(36));
  await deleteDoc(docRef);
};

export const exportData = async (): Promise<string> => {
  const people = await getAllPeople();
  return JSON.stringify(people, null, 2);
};

export const importData = async (jsonData: string): Promise<void> => {
  const people = JSON.parse(jsonData) as Person[];
  
  // Clear existing data
  const existingPeople = await getAllPeople();
  for (const person of existingPeople) {
    await deletePerson(person.id);
  }
  
  // Add all people
  for (const person of people) {
    const { id, ...personData } = person;
    await addDoc(collection(db, COLLECTION_NAME), personData);
  }
};
