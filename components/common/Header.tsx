import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { SunIcon, MoonIcon, BookIcon } from './Icons';

const Header = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="sticky top-0 z-30 w-full p-4 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <BookIcon className="w-8 h-8 text-indigo-500" />
                    <span className="text-xl font-bold text-slate-800 dark:text-white">WrittAI</span>
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                </button>
            </div>
        </header>
    );
};

export default Header;