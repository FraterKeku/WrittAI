import React, { useState } from 'react';
import { BookDetails, HomeTab } from '../types';
import SetupScreen from './SetupScreen';
import LibraryScreen from './LibraryScreen';
import { BookIcon, LibraryIcon } from './common/Icons';

interface HomeScreenProps {
  onStart: (details: BookDetails, initialContext?: string) => void;
  onFullyGenerate: (details: BookDetails, initialContext?: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStart, onFullyGenerate }) => {
  const [activeTab, setActiveTab] = useState<HomeTab>(HomeTab.CREATE);

  return (
    <div className="min-h-[calc(100vh-81px)] flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
                <li className="mr-2" role="presentation">
                    <button 
                        className={`inline-flex items-center gap-2 p-4 border-b-2 rounded-t-lg ${activeTab === HomeTab.CREATE ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}`}
                        onClick={() => setActiveTab(HomeTab.CREATE)}
                        role="tab"
                        aria-controls="create"
                        aria-selected={activeTab === HomeTab.CREATE}
                    >
                        <BookIcon className="w-5 h-5"/>
                        Create New Book
                    </button>
                </li>
                <li className="mr-2" role="presentation">
                    <button 
                         className={`inline-flex items-center gap-2 p-4 border-b-2 rounded-t-lg ${activeTab === HomeTab.LIBRARY ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}`}
                        onClick={() => setActiveTab(HomeTab.LIBRARY)}
                        role="tab"
                        aria-controls="library"
                        aria-selected={activeTab === HomeTab.LIBRARY}
                    >
                        <LibraryIcon className="w-5 h-5"/>
                        Library
                    </button>
                </li>
            </ul>
        </div>
        <div className="flex justify-center">
            <div id="create" role="tabpanel" className={activeTab === HomeTab.CREATE ? 'w-full' : 'hidden'}>
               <SetupScreen onStart={onStart} onFullyGenerate={onFullyGenerate} />
            </div>
            <div id="library" role="tabpanel" className={activeTab === HomeTab.LIBRARY ? 'w-full' : 'hidden'}>
                <LibraryScreen />
            </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;