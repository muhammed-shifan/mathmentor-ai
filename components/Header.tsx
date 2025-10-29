import React from 'react';
import { AppView } from '../types';
import { BrainCircuitIcon, Gamepad2Icon, GraduationCapIcon, HomeIcon, LogOutIcon, BellIcon, TrophyIcon } from './Icons';

interface HeaderProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  user: string | null;
  onSignOut: () => void;
  onOpenReminderModal: () => void;
  hasReminder: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, user, onSignOut, onOpenReminderModal, hasReminder }) => {
  const navItems = [
    { view: AppView.CLASSES, label: 'Classes', icon: HomeIcon },
    { view: AppView.DAILY_CHALLENGE, label: 'Daily Challenge', icon: TrophyIcon },
    { view: AppView.TUTOR, label: 'AI Tutor', icon: BrainCircuitIcon },
    { view: AppView.GAMES, label: 'Math Games', icon: Gamepad2Icon },
  ];

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b border-slate-200 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <GraduationCapIcon className="h-8 w-8 text-indigo-500" />
            <span className="ml-3 text-2xl font-bold text-slate-800 dark:text-white">Math Mentor AI</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden sm:flex sm:space-x-2">
              {navItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => setCurrentView(item.view)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    currentView === item.view
                      ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/30 dark:text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-2" />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-slate-600 dark:text-slate-300">Welcome, {user}!</span>
               <button
                onClick={onOpenReminderModal}
                className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-gray-700/50 transition-colors"
                aria-label="Set Study Reminder"
              >
                  <BellIcon className="w-5 h-5"/>
                  {hasReminder && <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-gray-900"></span>}
              </button>
              <button
                onClick={onSignOut}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-gray-700/50 transition-colors"
                aria-label="Sign Out"
              >
                  <LogOutIcon className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};