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
  // Remove undefined fields
  const cleanPerson = Object.fromEntries(
    Object.entries(person).filter(([_, v]) => v !== undefined)
  );
  const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanPerson);
  // Use hash of docRef.id as number ID
  const numericId = docRef.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return numericId;
};

export const getAllPeople = async (): Promise<Person[]> => {
  const q = query(collection(db, COLLECTION_NAME));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const numericId = doc.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      ...doc.data(),
      id: numericId,
      _firestoreId: doc.id // Keep original Firestore ID
    };
  }) as Person[];
};

export const getPerson = async (id: number): Promise<Person | undefined> => {
  // Find by numeric ID
  const allPeople = await getAllPeople();
  return allPeople.find(p => p.id === id);
};

export const updatePerson = async (person: Person): Promise<Person> => {
  const { id, _firestoreId, ...personData } = person as any;
  // Remove undefined fields
  const cleanData = Object.fromEntries(
    Object.entries(personData).filter(([_, v]) => v !== undefined)
  );
  
  // Find Firestore ID
  if (_firestoreId) {
    const docRef = doc(db, COLLECTION_NAME, _firestoreId);
    await updateDoc(docRef, cleanData);
  } else {
    // Fallback: find by numeric ID
    const allPeople = await getAllPeople();
    const foundPerson = allPeople.find(p => p.id === id) as any;
    if (foundPerson?._firestoreId) {
      const docRef = doc(db, COLLECTION_NAME, foundPerson._firestoreId);
      await updateDoc(docRef, cleanData);
    }
  }
  return person;
};

export const deletePerson = async (id: number): Promise<void> => {
  // Find Firestore ID
  const allPeople = await getAllPeople();
  const foundPerson = allPeople.find(p => p.id === id) as any;
  if (foundPerson?._firestoreId) {
    const docRef = doc(db, COLLECTION_NAME, foundPerson._firestoreId);
    await deleteDoc(docRef);
  }
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
