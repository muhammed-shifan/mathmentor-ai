import React, { useState, useEffect, useRef } from 'react';
import { getDailyChallenge, getLeaderboard, saveScoreToLeaderboard, markAsCompleted } from '../services/dailyChallengeService';
import type { DailyChallengeProblem, LeaderboardEntry, GameProblem } from '../types';
import { playCorrectSound, playIncorrectSound, playGameOverSound } from '../utils/audio';
import { TrophyIcon, CheckCircleIcon, XCircleIcon } from './Icons';

interface DailyChallengeProps {
    user: string;
    onBack: () => void;
}

type ChallengeState = 'loading' | 'ready' | 'playing' | 'finished';

const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const milliseconds = (ms % 1000).toString().padStart(3, '0').slice(0, 2);
    return `${minutes}:${seconds}.${milliseconds}`;
};

const renderProblem = (problem: GameProblem | null) => {
    if (!problem) return null;
    if (problem.type === 'sprint') {
        return <p className="text-4xl sm:text-5xl font-bold font-mono tracking-widest">{problem.num1} {problem.operator} {problem.num2}</p>;
    }
    if (problem.type === 'algebra') {
        return <p className="text-4xl sm:text-5xl font-bold font-mono tracking-widest">{problem.equation}</p>;
    }
    if (problem.type === 'sequence') {
        return (
            <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                {problem.sequence.map((item, index) => (
                    <span key={index} className={`text-3xl sm:text-4xl font-bold font-mono p-2 rounded ${item === '?' ? 'text-indigo-400 bg-indigo-500/10' : ''}`}>
                        {item}
                    </span>
                ))}
            </div>
        );
    }
    if (problem.type === 'geometry') {
        return (
            <div className="flex flex-col items-center">
                <problem.shapeComponent className="w-28 h-28 sm:w-32 sm:h-32 mx-auto text-slate-700 dark:text-slate-300" />
                <p className="text-xl sm:text-2xl mt-4 text-center">{problem.question}</p>
            </div>
        );
    }
    return null;
}

export const DailyChallenge: React.FC<DailyChallengeProps> = ({ user, onBack }) => {
    const [challengeState, setChallengeState] = useState<ChallengeState>('loading');
    const [problems, setProblems] = useState<DailyChallengeProblem[]>([]);
    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
    const [score, setScore] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [endTime, setEndTime] = useState<number | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setProblems(getDailyChallenge());
        setLeaderboard(getLeaderboard());
        setChallengeState('ready');
    }, []);

    const startChallenge = () => {
        setCurrentProblemIndex(0);
        setUserAnswers(Array(problems.length).fill(null));
        setScore(0);
        setStartTime(Date.now());
        setEndTime(null);
        setChallengeState('playing');
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleAnswerSubmit = (answer: string) => {
        if (!answer.trim()) return;

        const currentProblem = problems[currentProblemIndex].problem;
        const isCorrect = String(currentProblem.answer) === answer;

        if (isCorrect) {
            playCorrectSound();
            setScore(prev => prev + 1);
        } else {
            playIncorrectSound();
        }

        const newUserAnswers = [...userAnswers];
        newUserAnswers[currentProblemIndex] = answer;
        setUserAnswers(newUserAnswers);

        if (currentProblemIndex < problems.length - 1) {
            setCurrentProblemIndex(prev => prev + 1);
            if (inputRef.current) inputRef.current.value = '';
        } else {
            const finalTime = Date.now();
            setEndTime(finalTime);
            setChallengeState('finished');
            const duration = finalTime - (startTime || finalTime);
            const finalScore = score + (isCorrect ? 1 : 0)
            const newLeaderboard = saveScoreToLeaderboard(user, finalScore, duration);
            setLeaderboard(newLeaderboard);
            markAsCompleted(user);
            playGameOverSound();
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputRef.current) {
            handleAnswerSubmit(inputRef.current.value);
        }
    };

    const currentProblem = problems[currentProblemIndex]?.problem;

    if (challengeState === 'loading') {
        return <div className="text-center">Loading today's challenge...</div>;
    }

    if (challengeState === 'ready') {
        return (
            <div className="max-w-2xl mx-auto p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl text-center border dark:border-white/10 animate-fade-in">
                <TrophyIcon className="w-16 h-16 mx-auto text-yellow-400"/>
                <h2 className="text-3xl font-bold mt-4">Today's Daily Challenge</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    You have <strong>{problems.length} problems</strong> to solve. Your score and time will be added to the leaderboard. Good luck!
                </p>
                <button
                    onClick={startChallenge}
                    className="mt-8 w-full max-w-xs px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                    Start Challenge
                </button>

                <div className="mt-8 w-full">
                    <h3 className="text-xl font-semibold mb-4 flex items-center justify-center gap-2"><TrophyIcon className="w-6 h-6 text-yellow-400" /> Today's Leaderboard</h3>
                    {leaderboard.length > 0 ? (
                        <ol className="space-y-2 text-left">
                            {leaderboard.map((entry, index) => (
                                <li key={index} className="flex justify-between p-3 rounded-lg bg-slate-100 dark:bg-gray-800/50">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-500 dark:text-slate-400 w-6 text-center">#{index + 1}</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{entry.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 font-mono">
                                        <span className="font-bold text-indigo-500 dark:text-indigo-300">{entry.score} pts</span>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">{formatTime(entry.time)}</span>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <div className="text-center p-4 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
                          <p className="text-slate-500 dark:text-slate-400">
                              No scores yet today. Be the first!
                          </p>
                        </div>
                    )}
                </div>

                 <button onClick={onBack} className="mt-8 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    &larr; Back to Classes
                </button>
            </div>
        );
    }
    
    if (challengeState === 'playing') {
        return (
            <div className="max-w-2xl mx-auto p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl text-center border dark:border-white/10 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Daily Challenge</h2>
                    <div className="text-lg font-semibold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-200 px-3 py-1 rounded-full">
                        {currentProblemIndex + 1} / {problems.length}
                    </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${((currentProblemIndex + 1) / problems.length) * 100}%` }}></div>
                </div>
                <div className="relative my-8 min-h-[160px] flex items-center justify-center">
                    {renderProblem(currentProblem)}
                </div>

                {currentProblem?.type === 'geometry' ? (
                     <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                        {currentProblem.options.map(option => (
                            <button
                                key={option}
                                onClick={() => handleAnswerSubmit(option)}
                                className="w-full px-4 py-3 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                ) : (
                    <form onSubmit={handleFormSubmit}>
                        <input
                            ref={inputRef}
                            type="number"
                            pattern="\\d*"
                            className="w-full text-center text-3xl p-3 border-2 border-slate-300 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            autoComplete="off"
                        />
                        <button type="submit" className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all">
                            Submit Answer
                        </button>
                    </form>
                )}
            </div>
        );
    }

    if (challengeState === 'finished') {
        const duration = (endTime || 0) - (startTime || 0);
        return (
            <div className="max-w-4xl mx-auto p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl text-center border dark:border-white/10 animate-fade-in">
                <h2 className="text-3xl font-bold">Challenge Complete!</h2>
                <div className="flex justify-center items-baseline gap-4 mt-4">
                    <p className="text-xl">Your Score: <span className="font-bold text-4xl text-indigo-500">{score} / {problems.length}</span></p>
                    <p className="text-xl">Your Time: <span className="font-bold text-4xl text-indigo-500">{formatTime(duration)}</span></p>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-8 mt-8">
                    {/* Review Section */}
                    <div className="flex-1 text-left">
                        <h3 className="text-xl font-semibold mb-4">Your Results</h3>
                        <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                           {problems.map((p, index) => {
                                const userAnswer = userAnswers[index];
                                const isCorrect = String(p.problem.answer) === userAnswer;
                                return (
                                    <li key={index} className={`p-3 rounded-lg flex items-center gap-3 ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                        {isCorrect ? <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" /> : <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />}
                                        <div className="flex-grow text-sm">
                                            <span className="font-mono">{renderProblem(p.problem)}</span>
                                        </div>
                                        <div className="text-sm text-right">
                                            {!isCorrect && <p className="text-red-500">You: {userAnswer}</p>}
                                            <p className="text-green-500">Ans: {p.problem.answer}</p>
                                        </div>
                                    </li>
                                );
                           })}
                        </ul>
                    </div>
                    {/* Leaderboard Section */}
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-4 flex items-center justify-center gap-2"><TrophyIcon className="w-6 h-6 text-yellow-400" /> Daily Leaderboard</h3>
                        <ol className="space-y-2 text-left">
                            {leaderboard.map((entry, index) => {
                                const isCurrentUser = entry.name === user && entry.score === score && entry.time === duration;
                                return (
                                    <li key={index} className={`flex justify-between p-3 rounded-lg ${isCurrentUser ? 'bg-indigo-500/20 border border-indigo-500' : 'bg-slate-100 dark:bg-gray-800/50'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-slate-500 dark:text-slate-400 w-6">#{index + 1}</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{entry.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 font-mono">
                                            <span className="font-bold text-indigo-500 dark:text-indigo-300">{entry.score} pts</span>
                                            <span className="text-sm text-slate-500 dark:text-slate-400">{formatTime(entry.time)}</span>
                                        </div>
                                    </li>
                                )
                            })}
                        </ol>
                    </div>
                </div>

                <button onClick={onBack} className="mt-8 px-6 py-3 bg-slate-500 dark:bg-gray-600 text-white font-semibold rounded-lg hover:bg-slate-600 dark:hover:bg-gray-500 transition-colors">
                    Back to Classes
                </button>
            </div>
        );
    }

    return null;
};