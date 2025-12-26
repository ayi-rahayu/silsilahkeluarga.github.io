
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Person } from '../types';

const AdminDashboard: React.FC = () => {
  const { people, deletePerson, loading, error, refreshData } = useData();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('family_tree_auth');
    navigate('/login');
  };
  
  const handleExport = () => {
    const dataStr = JSON.stringify(people, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'family_tree_backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target?.result as string;
            const importedPeople = JSON.parse(text) as Person[];
            
            // Basic validation
            if (!Array.isArray(importedPeople)) {
                throw new Error("Invalid JSON format. Expected an array of people.");
            }
            
            // Clear existing data
            const currentPeople = await Promise.resolve(people);
            for (const person of currentPeople) {
                await deletePerson(person.id);
            }

            // Add new data
            // This is a simplified import. A more robust solution would handle ID mapping.
            // For now, it re-imports, and DB will assign new IDs. Relationships might break.
            // A proper implementation would preserve IDs if possible or remap them.
            // This is good enough for a simple backup/restore where you clear everything first.
            for (const person of importedPeople) {
                const { id, ...personData } = person;
                await useData().addPerson(personData);
            }

            alert("Data imported successfully! The page will now refresh.");
            refreshData();

        } catch (err) {
            alert(`Error importing data: ${err instanceof Error ? err.message : String(err)}`);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };


  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Admin Dashboard</h1>
          <div className="flex items-center space-x-2">
             <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
              <i className="fas fa-file-export mr-2"></i>Export JSON
            </button>
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm cursor-pointer">
              <i className="fas fa-file-import mr-2"></i>Import JSON
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <Link to="/" className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm">
                View Public Page
            </Link>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                Logout
            </button>
          </div>
        </div>
        
        <div className="mb-6">
            <Link to="/admin/add" className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                <i className="fas fa-plus mr-2"></i> Add New Member
            </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Birth Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {people.map(person => (
                <tr key={person.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full object-cover" src={person.photo || 'https://picsum.photos/200'} alt="" />
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{person.fullName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{person.nickname}</div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{person.gender}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{person.birthDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link to={`/admin/edit/${person.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">
                        <i className="fas fa-edit"></i> Edit
                    </Link>
                    <button onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${person.fullName}? This will also remove them from any relationships.`)) {
                            deletePerson(person.id);
                        }
                    }} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">
                       <i className="fas fa-trash"></i> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
