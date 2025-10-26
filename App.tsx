import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Phase, BookDetails, LibraryBook } from './types';
import HomeScreen from './components/HomeScreen';
import WritingScreen from './components/WritingScreen';
import UploadPrompt from './components/UploadPrompt';
import FinalScreen from './components/FinalScreen';
import { generateNextPage } from './services/geminiService';
import * as dbService from './services/dbService';
import Loader from './components/common/Loader';
import Header from './components/common/Header';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bookDetails, setBookDetails] = useState<BookDetails | null>(null);
  const [generatedPages, setGeneratedPages] = useState<string[]>([]);
  const [pdfContext, setPdfContext] = useState<string>('');
  const [totalPageCount, setTotalPageCount] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<Phase>(Phase.BEGINNING);

  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [isFullyGenerating, setIsFullyGenerating] = useState(false);
  
  useEffect(() => {
    dbService.initDB().catch(err => {
        console.error("Database initialization failed:", err);
        setError("Your browser does not support the features required for the library. Please update your browser.");
    });
  }, []);

  const resetWritingState = () => {
    setBookDetails(null);
    setGeneratedPages([]);
    setPdfContext('');
    setTotalPageCount(0);
    setCurrentPhase(Phase.BEGINNING);
    setIsAutoGenerating(false);
    setIsFullyGenerating(false);
    setError(null);
    setIsLoading(false);
  };

  const determinePhase = useCallback(() => {
    if (!bookDetails) return;
    const progress = totalPageCount / bookDetails.estimatedPages;
    if (progress < 0.25) setCurrentPhase(Phase.BEGINNING);
    else if (progress < 0.75) setCurrentPhase(Phase.MIDDLE);
    else setCurrentPhase(Phase.END);
  }, [totalPageCount, bookDetails]);

  useEffect(() => { determinePhase(); }, [determinePhase]);

  const handleStartWriting = (details: BookDetails, initialContext?: string, fullyGenerate = false) => {
    resetWritingState();
    setBookDetails(details);
    if(initialContext) setPdfContext(initialContext);
    setIsFullyGenerating(fullyGenerate);
    if(fullyGenerate) setIsAutoGenerating(true); 
    setAppState(AppState.WRITING);
    handleGeneratePage(true, initialContext);
  };
  
  const handleGeneratePage = useCallback(async (isFirstPage: boolean = false, initialContext?: string) => {
    if (!bookDetails || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const context = isFirstPage ? (initialContext || '') : [pdfContext, ...generatedPages].join('\n\n---\n\n');
      const newPage = await generateNextPage(bookDetails.objective, currentPhase, context, totalPageCount);
      setGeneratedPages(prev => [...prev, newPage]);
      setTotalPageCount(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setIsAutoGenerating(false);
      setIsFullyGenerating(false);
    } finally {
      setIsLoading(false);
    }
  }, [bookDetails, currentPhase, totalPageCount, pdfContext, generatedPages, isLoading]);

  useEffect(() => {
    if (!isAutoGenerating || isLoading || appState !== AppState.WRITING) return;
    if (bookDetails && totalPageCount >= bookDetails.estimatedPages) {
        setIsAutoGenerating(false);
        setIsFullyGenerating(false);
        setAppState(AppState.FINAL_REVIEW);
        return;
    }
    if (generatedPages.length > 0 && generatedPages.length % 5 === 0) {
        if (isFullyGenerating) {
            handleSelfUpload();
        } else {
            setAppState(AppState.UPLOAD_PROMPT);
        }
    } else {
        handleGeneratePage();
    }
  }, [generatedPages, isAutoGenerating, isLoading, appState, isFullyGenerating, totalPageCount, bookDetails, handleGeneratePage]);

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;
      const typedArray = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument(typedArray).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
      }
      setPdfContext(fullText.trim());
      setGeneratedPages([]);
      setAppState(AppState.WRITING);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read or process the PDF file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageUpdate = (index: number, newContent: string) => {
    setGeneratedPages(currentPages => currentPages.map((content, i) => (i === index ? newContent : content)));
  };

  const handleSelfUpload = () => {
    setPdfContext(prev => [prev, ...generatedPages].join('\n\n---\n\n').trim());
    setGeneratedPages([]);
    setAppState(AppState.WRITING);
  };
  
  const handleDownloadPdf = () => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    const content = generatedPages.slice(-5).join('\n\n---\n\n');
    const lines = doc.splitTextToSize(content, 180);
    doc.text(lines, 15, 20);
    doc.save(`${bookDetails?.title || 'book'}-pages-${totalPageCount - 4}-${totalPageCount}.pdf`);
  };

  const handleGoHome = () => {
    resetWritingState();
    setAppState(AppState.HOME);
  };

  const handleSaveToLibrary = async (bookData: Omit<LibraryBook, 'id' | 'createdAt'>) => {
    try {
        await dbService.addBook(bookData);
    } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save book to library.");
    }
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.HOME:
        return <HomeScreen onStart={(details, context) => handleStartWriting(details, context, false)} onFullyGenerate={(details, context) => handleStartWriting(details, context, true)} />;
      case AppState.WRITING:
        if (!bookDetails) return <Loader />;
        return <WritingScreen bookDetails={bookDetails} generatedPages={generatedPages} totalPageCount={totalPageCount} currentPhase={currentPhase} isLoading={isLoading} isAutoGenerating={isAutoGenerating} isFullyGenerating={isFullyGenerating} onGenerateNext={() => handleGeneratePage()} onPageUpdate={handlePageUpdate} onAutoGenerateToggle={setIsAutoGenerating}/>;
      case AppState.UPLOAD_PROMPT:
        return <UploadPrompt lastFivePages={generatedPages.slice(-5)} onFileUpload={handlePdfUpload} isLoading={isLoading} totalPages={totalPageCount} onContinue={handleSelfUpload} onDownload={handleDownloadPdf}/>;
      case AppState.FINAL_REVIEW:
        if (!bookDetails) return <Loader />;
        const fullContent = [pdfContext, ...generatedPages].join('\n\n---\n\n').trim();
        return <FinalScreen bookDetails={bookDetails} fullContent={fullContent} onGoHome={handleGoHome} onSaveToLibrary={handleSaveToLibrary} />;
      default: return <div>Invalid state</div>;
    }
  };

  return (
    <div className="dark:text-stone-200">
      <Header />
      {error && (
        <div className="fixed top-20 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 animate-fade-in-down">
          <p><strong>Error:</strong> {error}</p>
          <button onClick={() => setError(null)} className="absolute top-1 right-2 text-lg">&times;</button>
        </div>
      )}
      {(appState === AppState.WRITING && isLoading && totalPageCount === 0) && (
         <div className="fixed inset-0 bg-white/50 dark:bg-black/50 flex flex-col items-center justify-center z-50">
            <Loader size="w-16 h-16" />
            <p className="mt-4 text-xl font-semibold animate-pulse">{isFullyGenerating ? 'Starting full generation...' : 'Crafting your first page...'}</p>
        </div>
      )}
      <main>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;