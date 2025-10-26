import React, { useState, useEffect } from 'react';
import * as dbService from '../services/dbService';
import Loader from './common/Loader';
import { CloseIcon, SaveIcon } from './common/Icons';

interface UploadModalProps {
  file: File;
  onClose: () => void;
  onBookAdded: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ file, onClose, onBookAdded }) => {
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [content, setContent] = useState('');
  const [isParsing, setIsParsing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(file.name.replace(/\.[^/.]+$/, "")); // Pre-fill title from filename

    const parseFile = async () => {
      setIsParsing(true);
      setError('');
      try {
        if (file.type === "application/pdf") {
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) {
            throw new Error("PDF library (pdf.js) not loaded. Please ensure it's included in your HTML.");
          }
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;
          const typedArray = new Uint8Array(await file.arrayBuffer());
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
          }
          setContent(fullText.trim());
        } else {
          const text = await file.text();
          setContent(text);
        }
      } catch (err) {
        setError("Failed to read file. It might be corrupted or in an unsupported format.");
      } finally {
        setIsParsing(false);
      }
    };

    parseFile();
  }, [file]);

  const handleSave = async () => {
    if (!title.trim() || !content || isParsing) return;
    setIsSaving(true);
    setError('');
    try {
      await dbService.addBook({ title, objective, content });
      onBookAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save book to the library.");
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isParsing || isSaving;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-stone-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add Book to Library</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <CloseIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {isParsing ? (
            <div className="flex flex-col items-center justify-center h-48">
              <Loader />
              <p className="mt-2 text-stone-600 dark:text-stone-300">Parsing your file...</p>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="book-title" className="block text-sm font-medium text-stone-700 dark:text-stone-300">Book Title</label>
                <input
                  type="text"
                  id="book-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="book-objective" className="block text-sm font-medium text-stone-700 dark:text-stone-300">Book Objective (Optional)</label>
                <textarea
                  id="book-objective"
                  rows={3}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="A brief summary or theme of the book..."
                />
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">File: <span className="font-medium">{file.name}</span></p>
            </>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-stone-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || isLoading}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {isSaving ? (
                <>
                    <Loader size="w-5 h-5 mr-2"/> Saving...
                </>
            ) : (
                <>
                    <SaveIcon className="w-5 h-5 mr-2"/> Save to Library
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
