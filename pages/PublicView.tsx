
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FamilyTree from '../components/FamilyTree';
import MemberList from '../components/MemberList';
import Timeline from '../components/Timeline';
import { ViewMode } from '../types';
import { useData } from '../contexts/DataContext';

const PublicView: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Tree);
  const { loading, error, people } = useData();

  const renderContent = () => {
    if (loading) return <div className="text-center p-10"><i className="fas fa-spinner fa-spin mr-2"></i> Loading family data...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
    if (people.length === 0) {
      return (
        <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Welcome to Your Family Tree!</h2>
          <p className="mb-6">It looks like your family tree is empty. Get started by adding the first family member.</p>
          <Link to="/admin" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <i className="fas fa-user-plus mr-2"></i> Go to Admin Panel
          </Link>
        </div>
      );
    }
    
    switch (viewMode) {
      case ViewMode.Tree:
        return <FamilyTree />;
      case ViewMode.List:
        return <MemberList />;
      case ViewMode.Timeline:
        return <Timeline />;
      default:
        return <FamilyTree />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          <i className="fas fa-sitemap mr-3 text-indigo-500"></i>
          Silsilah Keluarga
        </h1>
        <div className="flex items-center space-x-4">
            <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                <button 
                    onClick={() => setViewMode(ViewMode.Tree)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === ViewMode.Tree ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                    <i className="fas fa-tree mr-1"></i> Tree
                </button>
                <button 
                    onClick={() => setViewMode(ViewMode.List)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === ViewMode.List ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                    <i className="fas fa-list mr-1"></i> List
                </button>
                <button 
                    onClick={() => setViewMode(ViewMode.Timeline)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === ViewMode.Timeline ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                    <i className="fas fa-timeline mr-1"></i> Timeline
                </button>
            </div>
          <Link to="/admin" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
            <i className="fas fa-user-shield mr-2"></i> Admin
          </Link>
        </div>
      </header>
      <main className="p-4">
        {renderContent()}
      </main>
    </div>
  );
};

export default PublicView;
