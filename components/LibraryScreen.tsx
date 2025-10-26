import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LibraryBook } from '../types';
import * as dbService from '../services/dbService';
import Loader from './common/Loader';
import { LibraryIcon, BookIcon, UploadIcon, MoreVerticalIcon, TrashIcon } from './common/Icons';
import UploadModal from './UploadModal';

const LibraryScreen: React.FC = () => {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);
  const [bookToDelete, setBookToDelete] = useState<LibraryBook | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchBooks = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedBooks = await dbService.getBooks();
      setBooks(storedBooks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load library.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setMenuOpenFor(null);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    if (event.target) {
      event.target.value = ''; // Allow re-uploading the same file
    }
  };

  const handleBookAdded = () => {
    fetchBooks();
  };
  
  const handleToggleMenu = (bookId: number) => {
    setMenuOpenFor(prev => (prev === bookId ? null : bookId));
  };

  const handleDeleteClick = (book: LibraryBook) => {
    setMenuOpenFor(null);
    setBookToDelete(book);
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;

    try {
        await dbService.deleteBook(bookToDelete.id);
        setBooks(prevBooks => prevBooks.filter(book => book.id !== bookToDelete.id));
        setBookToDelete(null);
    } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete the book.");
        setBookToDelete(null); // still close modal on error
    }
  };

  return (
    <>
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">My Library</h2>
                <p className="text-stone-600 dark:text-stone-300 mt-1">All your completed books are stored securely in your browser.</p>
            </div>
            <button
                onClick={handleUploadClick}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <UploadIcon className="w-5 h-5" />
                Upload Book
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.txt,.md" />
        </div>
        
        {isLoading && <div className="flex justify-center p-8"><Loader /></div>}
        {error && <p className="text-red-500 text-center">{error}</p>}
        
        {!isLoading && !error && (
          books.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <LibraryIcon className="mx-auto h-12 w-12 text-stone-400"/>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No books yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Finish writing a book to add it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map(book => (
                <div key={book.id} className="relative bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <button 
                        onClick={() => handleToggleMenu(book.id)} 
                        className="absolute top-2 right-2 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                        aria-label="More options"
                    >
                        <MoreVerticalIcon className="w-5 h-5" />
                    </button>
                    {menuOpenFor === book.id && (
                        <div ref={menuRef} className="absolute top-10 right-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10 w-36">
                            <button 
                                onClick={() => handleDeleteClick(book)}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <TrashIcon className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    )}
                  <BookIcon className="w-8 h-8 text-indigo-500 mb-3" />
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white truncate">{book.title}</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 h-10 overflow-hidden text-ellipsis">{book.objective}</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-3">{new Date(book.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {selectedFile && (
        <UploadModal 
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onBookAdded={handleBookAdded}
        />
      )}
      
      {bookToDelete && (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all animate-fade-in-up">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Deletion</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Are you sure you want to permanently delete "{bookToDelete.title}"? This action cannot be undone.
                    </p>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => setBookToDelete(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmDelete}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Delete
                    </button>
                </div>
            </div>
         </div>
      )}
    </>
  );
};

export default LibraryScreen;