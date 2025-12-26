
import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { Person } from '../types';
import * as db from '../services/db';

interface DataContextProps {
  people: Person[];
  loading: boolean;
  error: string | null;
  refreshData: () => void;
  addPerson: (person: Omit<Person, 'id'>) => Promise<number>;
  updatePerson: (person: Person) => Promise<Person>;
  deletePerson: (id: number) => Promise<void>;
  getPerson: (id: number) => Promise<Person | undefined>;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await db.initDB();
      const allPeople = await db.getAllPeople();
      setPeople(allPeople);
    } catch (err) {
      setError('Failed to load data from the database.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addPerson = async (person: Omit<Person, 'id'>) => {
    const id = await db.addPerson(person);
    await refreshData();
    return id;
  };

  const updatePerson = async (person: Person) => {
    const updated = await db.updatePerson(person);
    await refreshData();
    return updated;
  };

  const deletePerson = async (id: number) => {
    // Before deleting, remove this person's ID from any spouse or parent fields
    const allPeople = await db.getAllPeople();
    for (const p of allPeople) {
        let changed = false;
        if (p.spouseIds?.includes(id)) {
            p.spouseIds = p.spouseIds.filter(spouseId => spouseId !== id);
            changed = true;
        }
        if (p.parentId1 === id) {
            p.parentId1 = null;
            changed = true;
        }
        if (p.parentId2 === id) {
            p.parentId2 = null;
            changed = true;
        }
        if(changed) {
            await db.updatePerson(p);
        }
    }
    
    await db.deletePerson(id);
    await refreshData();
  };

  const getPerson = async (id: number) => {
    return db.getPerson(id);
  }

  return (
    <DataContext.Provider value={{ people, loading, error, refreshData, addPerson, updatePerson, deletePerson, getPerson }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
