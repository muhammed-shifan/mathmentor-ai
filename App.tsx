import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { AITutor } from './components/AITutor';
import { MathGames } from './components/MathGames';
import { ClassSelection } from './components/ClassSelection';
import { Welcome } from './components/Welcome';
import { ReminderModal } from './components/ReminderModal';
import { ReminderNotification } from './components/ReminderNotification';
import { useReminder } from './hooks/useReminder';
import { AppView, MathTopic, TutorMode } from './types';
import { DailyChallenge } from './components/DailyChallenge';
import { GraduationCapIcon, BrainCircuitIcon, Gamepad2Icon, HomeIcon, LoaderIcon, TrophyIcon } from './components/Icons';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CLASSES);
  const [selectedTopic, setSelectedTopic] = useState<MathTopic | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { reminderSettings, isReminderDue, setReminder, clearReminder, dismissReminder } = useReminder();
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [initialTutorMode, setInitialTutorMode] = useState<TutorMode>(TutorMode.LESSON);

  useEffect(() => {
    const storedUser = localStorage.getItem('mathMentorUser');
    if (storedUser) {
      setUser(storedUser);
    }
    setIsInitialized(true);
  }, []);

  const handleSignIn = (name: string) => {
    const trimmedName = name.trim();
    if (trimmedName) {
      localStorage.setItem('mathMentorUser', trimmedName);
      setUser(trimmedName);
    }
  };
  
  const handleSignOut = () => {
    localStorage.removeItem('mathMentorUser');
    setUser(null);
    setCurrentView(AppView.CLASSES);
    setSelectedTopic(null);
  };

  const handleSelectTopic = useCallback((topic: MathTopic, mode: TutorMode = TutorMode.LESSON) => {
    setSelectedTopic(topic);
    setInitialTutorMode(mode);
    setCurrentView(AppView.TUTOR);
  }, []);
  
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderIcon className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <Welcome onSignIn={handleSignIn} />;
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.TUTOR:
        return <AITutor selectedTopic={selectedTopic} setSelectedTopic={setSelectedTopic} initialMode={initialTutorMode} />;
      case AppView.GAMES:
        return <MathGames />;
      case AppView.DAILY_CHALLENGE:
        return <DailyChallenge user={user} onBack={() => setCurrentView(AppView.CLASSES)} />;
      case AppView.CLASSES:
      default:
        return <ClassSelection onSelectTopic={handleSelectTopic} user={user} onStartDailyChallenge={() => setCurrentView(AppView.DAILY_CHALLENGE)} />;
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-slate-200 font-sans">
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        user={user}
        onSignOut={handleSignOut}
        onOpenReminderModal={() => setIsReminderModalOpen(true)}
        hasReminder={reminderSettings.isEnabled}
      />
      {isReminderDue && <ReminderNotification onDismiss={dismissReminder} />}
      <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        {renderView()}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-white/10 sm:hidden">
        <nav className="flex justify-around p-2">
            <button onClick={() => setCurrentView(AppView.CLASSES)} className={`flex flex-col items-center justify-center p-2 rounded-lg w-1/4 ${currentView === AppView.CLASSES ? 'text-indigo-500' : 'text-slate-500 dark:text-slate-400'}`}>
                <HomeIcon className="w-6 h-6" />
                <span className="text-xs font-medium">Classes</span>
            </button>
            <button onClick={() => setCurrentView(AppView.DAILY_CHALLENGE)} className={`flex flex-col items-center justify-center p-2 rounded-lg w-1/4 ${currentView === AppView.DAILY_CHALLENGE ? 'text-indigo-500' : 'text-slate-500 dark:text-slate-400'}`}>
                <TrophyIcon className="w-6 h-6" />
                <span className="text-xs font-medium">Daily</span>
            </button>
            <button onClick={() => setCurrentView(AppView.TUTOR)} className={`flex flex-col items-center justify-center p-2 rounded-lg w-1/4 ${currentView === AppView.TUTOR ? 'text-indigo-500' : 'text-slate-500 dark:text-slate-400'}`}>
                <BrainCircuitIcon className="w-6 h-6" />
                <span className="text-xs font-medium">AI Tutor</span>
            </button>
            <button onClick={() => setCurrentView(AppView.GAMES)} className={`flex flex-col items-center justify-center p-2 rounded-lg w-1/4 ${currentView === AppView.GAMES ? 'text-indigo-500' : 'text-slate-500 dark:text-slate-400'}`}>
                <Gamepad2Icon className="w-6 h-6" />
                <span className="text-xs font-medium">Games</span>
            </button>
        </nav>
      </footer>
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        currentSettings={reminderSettings}
        onSetReminder={(day, time) => {
            setReminder(day, time);
            setIsReminderModalOpen(false);
        }}
        onClearReminder={() => {
            clearReminder();
            setIsReminderModalOpen(false);
        }}
      />
    </div>
  );
};

export default App;
