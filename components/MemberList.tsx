
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Person } from '../types';

const MemberList: React.FC = () => {
  const { people } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Person; direction: 'asc' | 'desc' } | null>(null);

  const filteredPeople = useMemo(() => {
    return people.filter(person =>
      person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [people, searchTerm]);

  const sortedPeople = useMemo(() => {
    let sortableItems = [...filteredPeople];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key]! < b[sortConfig.key]!) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key]! > b[sortConfig.key]!) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredPeople, sortConfig]);

  const requestSort = (key: keyof Person) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: keyof Person) => {
      if (!sortConfig || sortConfig.key !== key) {
          return <i className="fas fa-sort text-gray-400"></i>;
      }
      if (sortConfig.direction === 'asc') {
          return <i className="fas fa-sort-up"></i>;
      }
      return <i className="fas fa-sort-down"></i>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Family Member List</h2>
          <div className="w-1/3">
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Photo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('fullName')}>
                Full Name {getSortIcon('fullName')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('gender')}>
                Gender {getSortIcon('gender')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('birthDate')}>
                Birth Date {getSortIcon('birthDate')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Death Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Parents (Debug)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedPeople.map(person => (
              <tr key={person.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img className="h-10 w-10 rounded-full object-cover" src={person.photo || 'https://picsum.photos/200'} alt={person.fullName} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{person.fullName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{person.nickname}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{person.gender}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{person.birthDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{person.deathDate || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  P1: {person.parentId1 || 'null'} ({typeof person.parentId1})<br/>
                  P2: {person.parentId2 || 'null'} ({typeof person.parentId2})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberList;
