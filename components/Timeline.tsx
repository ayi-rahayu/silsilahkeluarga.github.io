
import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Person } from '../types';
import MemberCard from './MemberCard';

const Timeline: React.FC = () => {
  const { people } = useData();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const sortedPeople = useMemo(() => {
    return [...people].sort((a, b) => {
      const aDate = a.birthDate || '9999-12-31';
      const bDate = b.birthDate || '9999-12-31';
      return aDate.localeCompare(bDate);
    });
  }, [people]);

  const getAge = (birthDate?: string, deathDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    return age;
  };

  const getGeneration = (person: Person): number => {
    let gen = 0;
    let current = person;
    while (current.parentId1 || current.parentId2) {
      gen++;
      const parentId = current.parentId1 || current.parentId2;
      const parent = people.find(p => p.id === parentId);
      if (!parent) break;
      current = parent;
    }
    return gen;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <i className="fas fa-clock mr-3 text-indigo-500"></i>
        Timeline Keluarga
      </h2>
      
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="space-y-8">
          {sortedPeople.map((person, index) => {
            const generation = getGeneration(person);
            const age = getAge(person.birthDate, person.deathDate);
            const isAlive = !person.deathDate;
            
            return (
              <div key={person.id} className="relative pl-20">
                {/* Timeline dot */}
                <div 
                  className={`absolute left-5 w-7 h-7 rounded-full border-4 border-white dark:border-gray-800 ${
                    person.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'
                  } shadow-lg cursor-pointer hover:scale-125 transition-transform`}
                  onClick={() => setSelectedPerson(person)}
                  style={{ top: '10px' }}
                ></div>
                
                {/* Content card */}
                <div 
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-md hover:shadow-xl transition-shadow cursor-pointer border-l-4"
                  style={{ borderLeftColor: person.gender === 'Male' ? '#3b82f6' : '#ec4899' }}
                  onClick={() => setSelectedPerson(person)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Photo */}
                      <img 
                        src={person.photo || 'https://via.placeholder.com/80'} 
                        alt={person.fullName}
                        className="w-16 h-16 rounded-full object-cover border-4"
                        style={{ borderColor: person.gender === 'Male' ? '#3b82f6' : '#ec4899' }}
                      />
                      
                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {person.fullName}
                          {person.nickname && (
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                              "{person.nickname}"
                            </span>
                          )}
                        </h3>
                        
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
                          <span className="flex items-center">
                            <i className="fas fa-birthday-cake mr-1 text-indigo-500"></i>
                            {person.birthDate || 'Unknown'}
                            {person.birthPlace && ` - ${person.birthPlace}`}
                          </span>
                          
                          {age !== null && (
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              isAlive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {isAlive ? `${age} tahun` : `${age} tahun (Alm.)`}
                            </span>
                          )}
                          
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                            Generasi {generation + 1}
                          </span>
                        </div>
                        
                        {person.deathDate && (
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <i className="fas fa-cross mr-1"></i>
                            Wafat: {person.deathDate}
                          </div>
                        )}
                        
                        {person.occupation && (
                          <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            <i className="fas fa-briefcase mr-1 text-gray-500"></i>
                            {person.occupation}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Gender icon */}
                    <div className={`text-3xl ${person.gender === 'Male' ? 'text-blue-500' : 'text-pink-500'}`}>
                      <i className={`fas fa-${person.gender === 'Male' ? 'mars' : 'venus'}`}></i>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {selectedPerson && (
        <MemberCard
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
        />
      )}
    </div>
  );
};

export default Timeline;
