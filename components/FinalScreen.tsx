import React, { useState } from 'react';
import { BookDetails } from '../types';
import { translateText } from '../services/geminiService';
import Loader from './common/Loader';
import { DownloadIcon, TranslateIcon, HomeIcon, LibraryIcon } from './common/Icons';

interface FinalScreenProps {
  bookDetails: BookDetails;
  fullContent: string;
  onGoHome: () => void;
  onSaveToLibrary: (bookData: { title: string; objective: string; content: string; }) => void;
}

const FinalScreen: React.FC<FinalScreenProps> = ({ bookDetails, fullContent, onGoHome, onSaveToLibrary }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleDownload = async () => {
    const { jsPDF } = (window as any).jspdf;
    if (!jsPDF) {
      alert("PDF generation library not loaded. Please try again.");
      return;
    }
    const doc = new jsPDF();
    doc.setFont('times', 'normal');
    doc.setFontSize(12);

    const textToUse = translatedContent || fullContent;
    const lines = doc.splitTextToSize(textToUse, 180); // 180mm margin
    
    const title = bookDetails.title;
    doc.setFontSize(18);
    doc.text(title, 105, 20, { align: 'center' });
    doc.setFontSize(12);
    
    let y = 35;
    for (let i = 0; i < lines.length; i++) {
        if (y > 280) { // page break
            doc.addPage();
            y = 20;
        }
        doc.text(lines[i], 15, y);
        y += 7; // line height
    }
    
    doc.save(`${bookDetails.title}.pdf`);
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    setError(null);
    try {
      const translation = await translateText(fullContent);
      setTranslatedContent(translation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed.");
    } finally {
      setIsTranslating(false);
    }
  };
  
  const handleSaveToLibrary = () => {
    onSaveToLibrary({
        title: bookDetails.title,
        objective: bookDetails.objective,
        content: translatedContent || fullContent,
    });
    setIsSaved(true);
  };

  const contentToDisplay = translatedContent || fullContent;

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg">
      <header className="p-4 border-b border-stone-200 dark:border-gray-700 sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10">
        <div className="flex justify-between items-center">
             <div>
                <h1 className="text-2xl font-bold truncate text-gray-900 dark:text-white">{bookDetails.title}</h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  {translatedContent ? "Completed & Translated" : "Completed Manuscript"}
                </p>
             </div>
             <button onClick={onGoHome} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-gray-700 hover:bg-stone-200 dark:hover:bg-gray-600 rounded-md">
                <HomeIcon className="w-4 h-4" />
                Home
            </button>
        </div>
      </header>
      
      <main className="flex-grow p-6 md:p-8 overflow-y-auto font-serif text-lg leading-relaxed text-stone-800 dark:text-stone-200">
        <div id="book-content" className="prose dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap font-serif text-inherit">{contentToDisplay}</div>
        </div>
      </main>

      <footer className="p-4 border-t border-stone-200 dark:border-gray-700 sticky bottom-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        {error && <p className="text-red-500 text-center text-sm mb-2">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <DownloadIcon className="w-5 h-5 mr-2" />
            Download as PDF
          </button>
          <button
            onClick={handleSaveToLibrary}
            disabled={isSaved}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
          >
            <LibraryIcon className="w-5 h-5 mr-2" />
            {isSaved ? 'Saved!' : 'Add to Library'}
          </button>
          <button
            onClick={handleTranslate}
            disabled={isTranslating || !!translatedContent}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-50 disabled:text-indigo-300 disabled:cursor-not-allowed"
          >
            {isTranslating ? (
              <><Loader size="w-5 h-5 mr-2" /> Translating...</>
            ) : (
              <><TranslateIcon className="w-5 h-5 mr-2" /> Translate to Portuguese (BR)</>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default FinalScreen;