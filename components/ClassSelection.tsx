import React, { useState, useEffect } from 'react';
import { MATH_TOPICS } from '../constants';
import type { MathTopic } from '../types';
import { TutorMode } from '../types';
import { getCompletionStatus } from '../services/dailyChallengeService';
import { getTopicsForReview, updateReviewTimestamp } from '../services/srsService';
import { TrophyIcon, CheckCircleIcon, BookCheckIcon } from './Icons';

interface ClassSelectionProps {
  onSelectTopic: (topic: MathTopic, mode?: TutorMode) => void;
  user: string;
  onStartDailyChallenge: () => void;
}

const TopicCard: React.FC<{ topic: MathTopic; onClick: () => void }> = ({ topic, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white dark:bg-gray-900 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col items-center text-center w-full border border-transparent dark:hover:border-indigo-500/50 dark:hover:bg-gray-800/50"
  >
    <div className="bg-indigo-100 dark:bg-indigo-500/20 p-4 rounded-full mb-4">
      <topic.icon className="w-8 h-8 text-indigo-500 dark:text-indigo-300" />
    </div>
    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">{topic.name}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400">{topic.description}</p>
  </button>
);

const DailyChallengeCard: React.FC<{ user: string; onStart: () => void; }> = ({ user, onStart }) => {
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    setIsCompleted(getCompletionStatus(user));
  }, [user]);

  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 flex flex-col sm:flex-row items-center justify-between text-white animate-fade-in">
        <div className="flex items-center mb-4 sm:mb-0">
            <TrophyIcon className="w-12 h-12 text-yellow-300 mr-4" />
            <div>
                <h3 className="text-2xl font-bold">Daily Challenge</h3>
                <p className="text-indigo-200">A unique set of 5 problems every day. How high can you score?</p>
            </div>
        </div>
        <button
            onClick={onStart}
            disabled={isCompleted}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 transform hover:scale-105 ${
                isCompleted 
                ? 'bg-green-500 text-white cursor-default' 
                : 'bg-white text-indigo-600 hover:bg-yellow-300 hover:text-black'
            }`}
        >
            {isCompleted ? <><CheckCircleIcon className="w-5 h-5"/> Completed!</> : 'Start Challenge'}
        </button>
    </div>
  );
};


export const ClassSelection: React.FC<ClassSelectionProps> = ({ onSelectTopic, user, onStartDailyChallenge }) => {
  const [reviewTopics, setReviewTopics] = useState<MathTopic[]>([]);

  useEffect(() => {
    setReviewTopics(getTopicsForReview());
  }, []);

  const handleSelectReviewTopic = (topic: MathTopic) => {
    onSelectTopic(topic, TutorMode.REVIEW);
    // Optimistically update UI and SRS data
    updateReviewTimestamp(topic.name);
    setReviewTopics(prev => prev.filter(t => t.name !== topic.name));
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
          Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600">{user}!</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400">
          Select a subject to start learning with your AI mentor, or jump into a game to test your skills!
        </p>
      </div>

      {reviewTopics.length > 0 && (
          <div className="mb-12 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
              <BookCheckIcon className="w-7 h-7 text-indigo-500"/>
              Review Queue
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {reviewTopics.map(topic => (
                 <button
                    key={topic.name}
                    onClick={() => handleSelectReviewTopic(topic)}
                    className="bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 p-4 flex items-center gap-3 text-left w-full border dark:hover:border-indigo-500/50"
                  >
                    <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-full">
                      <topic.icon className="w-5 h-5 text-indigo-500 dark:text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{topic.name}</h3>
                    </div>
                 </button>
              ))}
            </div>
          </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <DailyChallengeCard user={user} onStart={onStartDailyChallenge} />
        {MATH_TOPICS.map((topic) => (
          <TopicCard key={topic.name} topic={topic} onClick={() => onSelectTopic(topic)} />
        ))}
      </div>
    </div>
  );
};
