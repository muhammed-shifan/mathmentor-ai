import React, { useState, useEffect } from 'react';
import type { ReminderSettings } from '../types';
import { BellIcon, XIcon } from './Icons';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: ReminderSettings;
  onSetReminder: (day: string, time: string) => void;
  onClearReminder: () => void;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, currentSettings, onSetReminder, onClearReminder }) => {
  const [day, setDay] = useState(currentSettings.day);
  const [time, setTime] = useState(currentSettings.time);

  useEffect(() => {
    setDay(currentSettings.day);
    setTime(currentSettings.time);
  }, [currentSettings]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSetReminder(day, time);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="relative w-full max-w-sm p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Close"
        >
          <XIcon className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-full mb-4">
                <BellIcon className="h-8 w-8 text-indigo-500 dark:text-indigo-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Study Reminders</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Set a weekly reminder to keep your math skills sharp.
            </p>
        </div>

        <div className="mt-6 space-y-4">
            <div>
                <label htmlFor="day-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Day of the week
                </label>
                <select
                    id="day-select"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                >
                    {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="time-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Time
                </label>
                <input
                    id="time-input"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
            </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
             <button
                onClick={handleSave}
                className="w-full px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
            >
                Save Reminder
            </button>
            {currentSettings.isEnabled && (
                 <button
                    onClick={onClearReminder}
                    className="w-full px-6 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-transparent hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    Disable Reminders
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
