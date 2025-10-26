import React from 'react';
import Loader from './common/Loader';
import { UploadIcon, DownloadIcon, ArrowRightIcon } from './common/Icons';

interface UploadPromptProps {
  lastFivePages: string[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onContinue: () => void;
  onDownload: () => void;
  isLoading: boolean;
  totalPages: number;
}

const UploadPrompt: React.FC<UploadPromptProps> = ({
  lastFivePages,
  onFileUpload,
  onContinue,
  onDownload,
  isLoading,
  totalPages,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col transform transition-all animate-fade-in-up">
        <div className="p-6 border-b border-stone-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Checkpoint Reached! (Page {totalPages})</h2>
          <p className="text-stone-600 dark:text-stone-400 mt-1">Your book's context is ready to be updated.</p>
        </div>

        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          <div>
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Recommended</h3>
            <p className="text-sm text-stone-600 dark:text-stone-300 mb-3">
              Let the app handle the context and continue writing automatically.
            </p>
            <button
              onClick={onContinue}
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              Continue Automatically
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-gray-400">
                Or
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Manual Options</h3>
            <p className="text-sm text-stone-600 dark:text-stone-300 mb-3">
              If you prefer to manage files yourself, you can download your progress or upload an updated PDF.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onDownload}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center py-3 px-6 border border-stone-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-gray-700 hover:bg-stone-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Download Pages {totalPages - 4}-{totalPages}
              </button>
              <label
                htmlFor="pdf-upload"
                className={`w-full inline-flex items-center justify-center py-3 px-6 border border-stone-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-gray-700 hover:bg-stone-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'cursor-wait' : 'cursor-pointer'}`}
              >
                {isLoading ? (
                  <>
                    <Loader size="w-5 h-5" />
                    <span className="ml-2">Processing...</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-5 h-5 mr-2" />
                    Upload Updated PDF
                  </>
                )}
              </label>
              <input
                id="pdf-upload"
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={onFileUpload}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPrompt;
