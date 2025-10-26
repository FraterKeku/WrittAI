import React, { useState } from 'react';
import { BookDetails } from '../types';
import { BookIcon, ArrowRightIcon, SparklesIcon, UploadIcon } from './common/Icons';
import Loader from './common/Loader';

interface SetupScreenProps {
  onStart: (details: BookDetails, initialContext?: string) => void;
  onFullyGenerate: (details: BookDetails, initialContext?: string) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart, onFullyGenerate }) => {
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [estimatedPages, setEstimatedPages] = useState(100);
  const [initialContext, setInitialContext] = useState<string | undefined>(undefined);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [error, setError] = useState('');

  const isFormValid = title.trim() && objective.trim() && estimatedPages > 0;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsReadingFile(true);
    setError('');
    setFileNames([]);

    try {
      const fileReadPromises = Array.from(files).map(async (file) => {
        let fileContent = '';
        if (file.type === "application/pdf") {
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) throw new Error("PDF library not loaded.");
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;
          const typedArray = new Uint8Array(await file.arrayBuffer());
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
          }
          fileContent = fullText.trim();
        } else {
          fileContent = await file.text();
        }
        return { name: file.name, content: fileContent };
      });

      const results = await Promise.all(fileReadPromises);

      const combinedContext = results
        .map(r => `--- Start of context from file: ${r.name} ---\n\n${r.content}\n\n--- End of context from file: ${r.name} ---`)
        .join('\n\n');
        
      const names = results.map(r => r.name);
      
      setInitialContext(combinedContext);
      setFileNames(names);

    } catch (err) {
      setError("Failed to read one or more files. Please check them and try again.");
      setFileNames([]);
      setInitialContext(undefined);
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleStart = (isFullGenerate: boolean) => {
    if (isFormValid) {
        const details = { title, objective, estimatedPages };
        if (isFullGenerate) {
            onFullyGenerate(details, initialContext);
        } else {
            onStart(details, initialContext);
        }
    }
  };

  return (
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl rounded-lg p-8 transform transition-all hover:scale-105 duration-300">
        <div className="text-center mb-8">
          <BookIcon className="w-16 h-16 mx-auto text-indigo-500" />
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mt-4">WrittAI</h1>
          <p className="text-stone-600 dark:text-stone-300 mt-2">Define your story's foundation.</p>
        </div>
        <form onSubmit={(e) => {e.preventDefault(); handleStart(false)}} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-stone-700 dark:text-stone-300">Book Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., The Last Starlight"
              required
            />
          </div>
          <div>
            <label htmlFor="objective" className="block text-sm font-medium text-stone-700 dark:text-stone-300">Book Objective / Narrative</label>
            <textarea
              id="objective"
              rows={5}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe the main plot, theme, and desired ending of your book..."
              required
            />
          </div>
           <div>
            <label htmlFor="context-upload" className="block text-sm font-medium text-stone-700 dark:text-stone-300">Initial Context (Optional)</label>
            <label className="mt-1 flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-stone-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400">
                <div className="space-y-1 text-center">
                    <UploadIcon className="mx-auto h-12 w-12 text-stone-400"/>
                    <div className="flex text-sm text-stone-600 dark:text-stone-300">
                        <span className="relative bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none">
                            <span>Upload file(s)</span>
                            <input id="context-upload" name="context-upload" type="file" className="sr-only" accept=".pdf,.txt,.md" onChange={handleFileChange} multiple />
                        </span>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">PDF, TXT, MD</p>
                    {isReadingFile && <Loader />}
                    {fileNames.length > 0 && !isReadingFile && <p className="text-xs text-green-500">{fileNames.length} file{fileNames.length > 1 ? 's' : ''} loaded!</p>}
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
            </label>
          </div>
          <div>
            <label htmlFor="estimated-pages" className="block text-sm font-medium text-stone-700 dark:text-stone-300">Estimated Page Count</label>
            <input
              type="number"
              id="estimated-pages"
              value={estimatedPages}
              onChange={(e) => setEstimatedPages(parseInt(e.target.value, 10))}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              min="10"
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              disabled={!isFormValid || isReadingFile}
            >
              Start Writing
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
            <button
              type="button"
              onClick={() => handleStart(true)}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-50 disabled:text-indigo-300 disabled:cursor-not-allowed"
              disabled={!isFormValid || isReadingFile}
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              Fully Generate Book
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
            <p className="text-xs text-stone-500 dark:text-stone-400">
                Please note: This app uses the Google Gemini API. Standard API usage rates and limits may apply. 
                For details, see the <a href="https://ai.google.dev/pricing" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">Google AI pricing page</a>.
            </p>
        </div>
      </div>
  );
};

export default SetupScreen;