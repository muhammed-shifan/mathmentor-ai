import React, { useState } from 'react';
import { GraduationCapIcon } from './Icons';

interface WelcomeProps {
  onSignIn: (name: string) => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onSignIn }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSignIn(name.trim());
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent animate-fade-in">
      <div className="w-full max-w-md p-8 space-y-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl text-center border dark:border-white/10">
        <div className="flex flex-col items-center">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4">
                <GraduationCapIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Welcome to Math Mentor AI</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Your personal AI-powered math tutor.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="sr-only">Your Name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 text-lg text-center bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-full focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              placeholder="What's your name?"
            />
          </div>
          
          <button
            type="submit"
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-all transform hover:scale-105 disabled:opacity-50"
            disabled={!name.trim()}
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
};