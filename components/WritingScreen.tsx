import React, { useState, useEffect, useRef } from 'react';
import { BookDetails, Phase } from '../types';
import Loader from './common/Loader';
import { ArrowRightIcon, EditIcon, SaveIcon } from './common/Icons';

interface WritingScreenProps {
  bookDetails: BookDetails;
  generatedPages: string[];
  totalPageCount: number;
  currentPhase: Phase;
  isLoading: boolean;
  isAutoGenerating: boolean;
  isFullyGenerating: boolean;
  onGenerateNext: () => void;
  onPageUpdate: (index: number, newContent: string) => void;
  onAutoGenerateToggle: (value: boolean) => void;
}

const WritingScreen: React.FC<WritingScreenProps> = ({
  bookDetails,
  generatedPages,
  totalPageCount,
  currentPhase,
  isLoading,
  isAutoGenerating,
  isFullyGenerating,
  onGenerateNext,
  onPageUpdate,
  onAutoGenerateToggle,
}) => {
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [editingPage, setEditingPage] = useState<{ index: number; content: string } | null>(null);

  useEffect(() => {
    if (!editingPage) {
      pageContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [generatedPages, editingPage]);

  const handleEdit = (index: number, content: string) => {
    if (isFullyGenerating) return; // Disable editing during full generation
    setEditingPage({ index, content });
  };

  const handleSave = () => {
    if (editingPage) {
      onPageUpdate(editingPage.index, editingPage.content);
      setEditingPage(null);
    }
  };

  const handleCancel = () => {
    setEditingPage(null);
  };

  const progress = Math.min(100, (totalPageCount / bookDetails.estimatedPages) * 100);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg">
      <header className="p-4 border-b border-stone-200 dark:border-gray-700 sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10">
        <h1 className="text-2xl font-bold truncate text-gray-900 dark:text-white">{bookDetails.title}</h1>
        <div className="flex justify-between items-center text-sm text-stone-500 dark:text-stone-400 mt-1">
          <span>Page: {totalPageCount} / {bookDetails.estimatedPages}</span>
          <div className="flex items-center gap-4">
            {!isFullyGenerating && (
                 <label htmlFor="auto-generate-toggle" className="flex items-center cursor-pointer">
                    <span className="mr-2 text-xs font-medium">Auto-Generate</span>
                    <div className="relative">
                        <input type="checkbox" id="auto-generate-toggle" className="sr-only" checked={isAutoGenerating} onChange={(e) => onAutoGenerateToggle(e.target.checked)} />
                        <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
                        <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
                    </div>
                </label>
            )}
            <span className="font-semibold px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 rounded-full text-xs">{currentPhase}</span>
          </div>
        </div>
        {(isLoading || isFullyGenerating) && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        )}
      </header>

      <main className="flex-grow p-6 md:p-8 overflow-y-auto font-serif text-lg leading-relaxed text-stone-800 dark:text-stone-200">
        {generatedPages.map((pageContent, index) => {
          const isEditing = editingPage?.index === index;
          return (
            <div key={index} className="page-wrapper mb-8 pb-8 border-b-2 border-dashed border-stone-200 dark:border-gray-700 relative group">
              {isEditing ? (
                <div className="flex flex-col">
                  <textarea
                    value={editingPage.content}
                    onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                    className="w-full p-2 font-serif text-lg leading-relaxed bg-indigo-50 dark:bg-gray-700 border border-indigo-300 dark:border-indigo-600 rounded-md"
                    rows={15}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2 self-end">
                    <button onClick={handleCancel} className="text-xs px-3 py-1 rounded bg-stone-200 dark:bg-gray-600 hover:bg-stone-300 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSave} className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 flex items-center"><SaveIcon className="w-4 h-4 mr-1"/>Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap">{pageContent}</p>
                   {!isFullyGenerating && (
                    <button onClick={() => handleEdit(index, pageContent)} className="absolute top-0 right-0 p-2 bg-white/50 dark:bg-gray-800/50 rounded-full text-stone-500 dark:text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <EditIcon className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}
              <span className="block text-center mt-4 text-sm text-stone-400 dark:text-stone-500">
                - {totalPageCount - generatedPages.length + index + 1} -
              </span>
            </div>
          );
        })}
         {isLoading && (
          <div className="flex justify-center items-center p-8">
            <Loader />
            <p className="ml-4 animate-pulse">
                {isFullyGenerating ? `Generating page ${totalPageCount + 1}...` : "The next chapter unfolds..."}
            </p>
          </div>
        )}
        <div ref={pageContainerRef} />
      </main>

      {!isFullyGenerating && (
        <footer className="p-4 border-t border-stone-200 dark:border-gray-700 sticky bottom-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <button
            onClick={onGenerateNext}
            disabled={isLoading || isAutoGenerating}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-wait"
          >
            {isLoading ? (
              <>
                <Loader size="w-5 h-5" />
                <span className="ml-2">Generating...</span>
              </>
            ) : isAutoGenerating ? (
               <>
                <Loader size="w-5 h-5" />
                <span className="ml-2">Auto-Generating...</span>
               </>
            ) : (
              <>
                Generate Next Page
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </footer>
      )}
    </div>
  );
};

export default WritingScreen;