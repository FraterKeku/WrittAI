import { LibraryBook } from '../types';

const DB_NAME = 'WrittAIDB';
const DB_VERSION = 1;
const BOOK_STORE_NAME = 'books';

let dbPromise: Promise<IDBDatabase> | null = null;

const getDb = (): Promise<IDBDatabase> => {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                return reject("Your browser doesn't support IndexedDB, which is required for the Library feature.");
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDB error:", request.error);
                reject("Error opening database.");
            };

            request.onsuccess = (event) => {
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(BOOK_STORE_NAME)) {
                    const bookStore = db.createObjectStore(BOOK_STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    bookStore.createIndex('title', 'title', { unique: false });
                }
            };
        });
    }
    return dbPromise;
};

export const initDB = async (): Promise<boolean> => {
    try {
        await getDb();
        return true;
    } catch (error) {
        console.error("Database initialization failed:", error);
        return false;
    }
};

export const addBook = async (book: Omit<LibraryBook, 'id' | 'createdAt'>): Promise<number> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BOOK_STORE_NAME, 'readwrite');
        transaction.onerror = () => reject(transaction.error);
        
        const store = transaction.objectStore(BOOK_STORE_NAME);
        const newBook = { ...book, createdAt: new Date() };
        
        const request = store.add(newBook);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => {
            console.error("Error adding book:", request.error);
            reject("Could not add book to the library.");
        };
    });
};

export const getBooks = async (): Promise<LibraryBook[]> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BOOK_STORE_NAME, 'readonly');
        transaction.onerror = () => reject(transaction.error);

        const store = transaction.objectStore(BOOK_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const result = request.result as LibraryBook[];
            // Ensure `createdAt` is a Date object for reliable sorting.
            result.forEach(book => book.createdAt = new Date(book.createdAt));
            resolve(result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        };

        request.onerror = () => {
            console.error("Error getting books:", request.error);
            reject("Could not retrieve books from the library.");
        };
    });
};

export const deleteBook = async (id: number): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BOOK_STORE_NAME, 'readwrite');
        transaction.onerror = () => reject(transaction.error);

        const store = transaction.objectStore(BOOK_STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        
        request.onerror = () => {
            console.error("Error deleting book:", request.error);
            reject("Could not delete the book from the library.");
        };
    });
};