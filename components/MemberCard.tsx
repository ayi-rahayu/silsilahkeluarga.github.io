
import React from 'react';
import { Person } from '../types';
import { useData } from '../contexts/DataContext';

interface MemberCardProps {
  person: Person;
  onClose: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ person, onClose }) => {
  const { people } = useData();

  const getPersonName = (id: number | null | undefined) => {
    if (!id) return 'Unknown';
    return people.find(p => p.id === id)?.fullName || 'Unknown';
  };

  const spouses = person.spouseIds?.map(id => getPersonName(id)).join(', ');
  
  const parents = [person.parentId1, person.parentId2]
    .filter(id => id)
    .map(id => getPersonName(id))
    .filter(name => name !== 'Unknown');
  const parentsText = parents.length > 0 ? parents.join(', ') : 'Unknown';

  return (
    <div className="absolute top-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-200 dark:border-gray-700 animate-fade-in-right">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
        <i className="fas fa-times"></i>
      </button>
      <div className="flex flex-col items-center">
        <img src={person.photo || 'https://picsum.photos/200'} alt={person.fullName} className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-indigo-400" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{person.fullName}</h3>
        {person.nickname && <p className="text-sm text-gray-500 dark:text-gray-400">"{person.nickname}"</p>}
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{person.gender}</p>
      </div>
      <div className="mt-6 space-y-3 text-sm">
        <InfoRow icon="fas fa-birthday-cake" label="Born" value={person.birthDate ? `${person.birthDate} in ${person.birthPlace || 'N/A'}` : 'N/A'} />
        {person.deathDate && <InfoRow icon="fas fa-cross" label="Died" value={person.deathDate} />}
        <InfoRow icon="fas fa-briefcase" label="Occupation" value={person.occupation || 'N/A'} />
        <InfoRow icon="fas fa-user-graduate" label="Education" value={person.education || 'N/A'} />
        <hr className="my-3 border-gray-200 dark:border-gray-600"/>
        <InfoRow icon="fas fa-users" label="Parents" value={parentsText} />
        {spouses && <InfoRow icon="fas fa-heart" label="Spouse(s)" value={spouses} />}
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start">
    <i className={`${icon} w-5 text-center text-gray-400 dark:text-gray-500 mt-1`}></i>
    <div className="ml-3">
      <p className="font-semibold text-gray-700 dark:text-gray-300">{label}</p>
      <p className="text-gray-600 dark:text-gray-400">{value}</p>
    </div>
  </div>
);

export default MemberCard;
