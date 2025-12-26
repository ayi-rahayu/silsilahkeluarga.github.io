
import { Person } from '../types';

const DB_NAME = 'FamilyTreeDB';
const DB_VERSION = 1;
const STORE_NAME = 'people';

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', event);
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

export const addPerson = (person: Omit<Person, 'id'>): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(person);

    request.onsuccess = (event) => {
      resolve((event.target as IDBRequest).result as number);
    };

    request.onerror = (event) => {
      console.error('Error adding person:', event);
      reject('Error adding person');
    };
  });
};

export const getAllPeople = (): Promise<Person[]> => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error('Error getting all people:', event);
      reject('Error getting all people');
    };
  });
};

export const getPerson = (id: number): Promise<Person | undefined> => {
    return new Promise(async (resolve, reject) => {
        const db = await initDB();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error(`Error getting person with id ${id}:`, event);
            reject('Error getting person');
        };
    });
};

export const updatePerson = (person: Person): Promise<Person> => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(person);

    request.onsuccess = () => {
      resolve(person);
    };

    request.onerror = (event) => {
      console.error('Error updating person:', event);
      reject('Error updating person');
    };
  });
};

export const deletePerson = (id: number): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error('Error deleting person:', event);
      reject('Error deleting person');
    };
  });
};

export const exportData = async (): Promise<string> => {
  const people = await getAllPeople();
  return JSON.stringify(people, null, 2);
};

export const importData = async (jsonData: string): Promise<void> => {
  const people = JSON.parse(jsonData) as Person[];
  const db = await initDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  // Clear existing data
  await new Promise((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => resolve(true);
    clearRequest.onerror = () => reject('Error clearing data');
  });
  
  // Add all people
  for (const person of people) {
    await new Promise((resolve, reject) => {
      const addRequest = store.add(person);
      addRequest.onsuccess = () => resolve(true);
      addRequest.onerror = () => reject('Error importing person');
    });
  }
};
