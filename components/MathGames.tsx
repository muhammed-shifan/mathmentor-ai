import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GameProblem, MentalMathProblem, AlgebraProblem, NumberSequenceProblem, GeometryProblem, Difficulty } from '../types';
import { SigmaIcon, FunctionIcon, StarIcon, TrendingUpIcon, CheckCircleIcon, XCircleIcon, TargetIcon, GeometryIcon, TrophyIcon } from './Icons';
import { getAlgebraExplanation } from '../services/geminiService';
import { playCorrectSound, playIncorrectSound, playTickSound, playGameOverSound, playHighScoreSound } from '../utils/audio';
import { generateSprintProblem, generateAlgebraProblem, generateSequenceProblem, generateGeometryProblem } from '../utils/problemGenerator';

type GameType = 'sprint' | 'algebra' | 'sequence' | 'geometry';
type GameState = 'choosing-game' | 'choosing-difficulty' | 'playing' | 'finished';

const HIGH_SCORES_KEY = 'mathMentorHighScores';

interface IncorrectAnswer {
    problem: GameProblem;
    userAnswer: string;
}

interface GameStats {
    correct: number;
    incorrect: number;
    total: number;
    accuracy: number; // as a percentage
}

interface HighScoreEntry {
    highScore: number;
    lastGameStats?: GameStats;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; colorClass: string }> = ({ icon, label, value, colorClass }) => (
    <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-gray-800/50 p-4 rounded-lg">
        <div className={`flex items-center gap-2 ${colorClass}`}>
            {icon}
            <span className="text-3xl font-bold">{value}</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
);

const AccuracyCircle: React.FC<{ accuracy: number }> = ({ accuracy }) => {
    const size = 100;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (accuracy / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="absolute" width={size} height={size}>
                <circle
                    className="text-slate-200 dark:text-gray-700"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className="text-indigo-500"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
            </svg>
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">{accuracy}%</span>
        </div>
    );
};


export const MathGames: React.FC = () => {
    const [problem, setProblem] = useState<GameProblem | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameState, setGameState] = useState<GameState>('choosing-game');
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
    const [gameDuration, setGameDuration] = useState(60);
    const [highScores, setHighScores] = useState<{ [key: string]: HighScoreEntry }>({});
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const [incorrectAnswers, setIncorrectAnswers] = useState<IncorrectAnswer[]>([]);
    const [explanations, setExplanations] = useState<Record<string, string>>({});
    const [isFetchingExplanations, setIsFetchingExplanations] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [isShaking, setIsShaking] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            const storedScores = localStorage.getItem(HIGH_SCORES_KEY);
            if (storedScores) {
                const parsedScores = JSON.parse(storedScores);
                 // Migration logic for old format to new format
                const migratedScores: { [key: string]: HighScoreEntry } = {};
                for (const key in parsedScores) {
                    if (typeof parsedScores[key] === 'number') {
                        // Old format: value is just the high score number
                        migratedScores[key] = { highScore: parsedScores[key] };
                    } else if (typeof parsedScores[key] === 'object' && parsedScores[key] !== null && 'highScore' in parsedScores[key]) {
                        // New format: value is an object
                        migratedScores[key] = parsedScores[key];
                    }
                }
                setHighScores(migratedScores);
            }
        } catch (error) {
            console.error("Failed to load high scores from localStorage", error);
        }
    }, []);

    const generateProblem = useCallback(() => {
        if (!difficulty || !selectedGame) return;

        let newProblem: GameProblem;
        switch (selectedGame) {
            case 'sprint':
                newProblem = generateSprintProblem(difficulty);
                break;
            case 'algebra':
                newProblem = generateAlgebraProblem(difficulty);
                break;
            case 'sequence':
                newProblem = generateSequenceProblem(difficulty);
                break;
            case 'geometry':
                newProblem = generateGeometryProblem(difficulty);
                break;
            default:
                return;
        }
        setProblem(newProblem);
    }, [selectedGame, difficulty]);


    const selectGame = (game: GameType) => {
        setSelectedGame(game);
        setGameState('choosing-difficulty');
    };

    const startGame = (level: Difficulty) => {
        setDifficulty(level);
        setScore(0);
        setTimeLeft(gameDuration);
        setGameState('playing');
        setIncorrectAnswers([]);
        timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        if (selectedGame !== 'geometry') {
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    };
    
    useEffect(() => {
        if (gameState === 'playing' && selectedGame) {
            generateProblem();
        }
    }, [gameState, selectedGame, generateProblem]);

    const fetchExplanations = useCallback(async (mistakes: IncorrectAnswer[]) => {
        const algebraMistakes = mistakes.filter(m => m.problem.type === 'algebra');
        if (algebraMistakes.length === 0) return;
    
        setIsFetchingExplanations(true);
        try {
            const newExplanations: Record<string, string> = {};
            const explanationPromises = algebraMistakes.map(async m => {
                const equation = (m.problem as AlgebraProblem).equation;
                if (explanations[equation]) return; // Don't refetch
                
                const explanation = await getAlgebraExplanation(equation);
                newExplanations[equation] = explanation;
            });
            await Promise.all(explanationPromises);
            setExplanations(prev => ({ ...prev, ...newExplanations }));
        } catch (error) {
            console.error("Failed to fetch explanations", error);
            const errorExplanations: Record<string, string> = {};
            algebraMistakes.forEach(m => {
                const equation = (m.problem as AlgebraProblem).equation;
                errorExplanations[equation] = "Sorry, couldn't load the explanation for this problem.";
            });
            setExplanations(prev => ({ ...prev, ...errorExplanations }));
        } finally {
            setIsFetchingExplanations(false);
        }
    }, [explanations]);

    const endGame = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setGameState('finished');
        playGameOverSound();
    
        if (selectedGame && difficulty) {
            const key = `${selectedGame}-${difficulty}`;
            const entry = highScores[key] || { highScore: 0 };
            const currentHighScore = entry.highScore;
    
            // Calculate stats
            const correct = score;
            const incorrect = incorrectAnswers.length;
            const total = correct + incorrect;
            const accuracy = total > 0 ? parseFloat(((correct / total) * 100).toFixed(1)) : 100;
            const newStats: GameStats = { correct, incorrect, total, accuracy };
    
            let newHighScoreValue = currentHighScore;
            if (score > currentHighScore) {
                setIsNewHighScore(true);
                playHighScoreSound();
                newHighScoreValue = score;
            } else {
                setIsNewHighScore(false);
            }
    
            const newEntry: HighScoreEntry = {
                highScore: newHighScoreValue,
                lastGameStats: newStats,
            };
    
            const newHighScores = { ...highScores, [key]: newEntry };
            setHighScores(newHighScores);
            try {
                localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(newHighScores));
            } catch (error) {
                console.error("Failed to save high score to localStorage", error);
            }
        }
    }, [score, selectedGame, difficulty, highScores, incorrectAnswers]);

    useEffect(() => {
        if (timeLeft <= 0 && gameState === 'playing') {
            endGame();
        }
        if (timeLeft > 0 && timeLeft <= 5 && gameState === 'playing') {
            playTickSound();
        }
    }, [timeLeft, gameState, endGame]);
    
    useEffect(() => {
        if (gameState === 'finished' && incorrectAnswers.length > 0) {
            fetchExplanations(incorrectAnswers);
        }
    }, [gameState, incorrectAnswers, fetchExplanations]);

    const handleAnswerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (feedbackMessage || !userAnswer.trim()) return;

        const isCorrect = parseInt(userAnswer, 10) === problem?.answer;

        if (isCorrect) {
            setScore(prev => prev + 1);
            playCorrectSound();
            setUserAnswer('');
            generateProblem();
        } else if (problem) {
            setIncorrectAnswers(prev => [...prev, { problem, userAnswer }]);
            playIncorrectSound();
            setIsShaking(true);
            setFeedbackMessage(`Not quite! The answer was ${problem.answer}.`);

            setTimeout(() => {
                setIsShaking(false);
                setFeedbackMessage(null);
                setUserAnswer('');
                generateProblem();
            }, 1500);
        }
    };
    
    const handleChoiceSubmit = (choice: string) => {
        if (feedbackMessage || !problem || problem.type !== 'geometry') return;

        const isCorrect = choice === problem.answer;

        if (isCorrect) {
            setScore(prev => prev + 1);
            playCorrectSound();
            generateProblem();
        } else {
            setIncorrectAnswers(prev => [...prev, { problem, userAnswer: choice }]);
            playIncorrectSound();
            setIsShaking(true);
            setFeedbackMessage(`Nope! The correct answer was ${problem.answer}.`);

            setTimeout(() => {
                setIsShaking(false);
                setFeedbackMessage(null);
                generateProblem();
            }, 1500);
        }
    };

    const resetGame = () => {
        setGameState('choosing-game');
        setProblem(null);
        setScore(0);
        setTimeLeft(60);
        setGameDuration(60);
        setDifficulty(null);
        setSelectedGame(null);
        setIsNewHighScore(false);
        setIncorrectAnswers([]);
        setExplanations({});
        setIsFetchingExplanations(false);
    };

    const getTopScoreForGame = (game: GameType) => {
        const scores = Object.entries(highScores)
            .filter(([key]) => key.startsWith(game))
            .map(([, value]) => (value as HighScoreEntry).highScore);
        return scores.length > 0 ? Math.max(...scores) : 0;
    };

    const difficultyButtonClasses = "w-full px-6 py-3 text-white font-semibold rounded-lg transition-transform transform hover:scale-105 flex flex-col items-center justify-center shadow-lg";

    const renderProblem = () => {
        if (!problem) return null;
        if (problem.type === 'sprint') {
            return <p className="text-5xl font-bold font-mono tracking-widest">{problem.num1} {problem.operator} {problem.num2}</p>;
        }
        if (problem.type === 'algebra') {
            return <p className="text-5xl font-bold font-mono tracking-widest">{problem.equation}</p>;
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

    const currentHighScore = (selectedGame && difficulty && highScores[`${selectedGame}-${difficulty}`]?.highScore) || 0;
    const lastGameEntry = selectedGame && difficulty && highScores[`${selectedGame}-${difficulty}`];
    const lastStats = lastGameEntry?.lastGameStats;

    const playAgainSameSettings = () => {
        if (difficulty) {
            startGame(difficulty);
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl text-center border dark:border-white/10">
            <h2 className="text-3xl font-bold mb-2">Math Games</h2>
            
            {gameState === 'choosing-game' && (
                <div className="animate-fade-in space-y-4">
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Select a game to test your skills!</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                        <button onClick={() => selectGame('sprint')} className="bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col items-center">
                            <SigmaIcon className="w-12 h-12 mb-3" />
                            <span className="text-xl font-semibold">Mental Math Sprint</span>
                            <span className="text-sm mt-2 opacity-80">High Score: {getTopScoreForGame('sprint')}</span>
                        </button>
                         <button onClick={() => selectGame('algebra')} className="bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col items-center">
                            <FunctionIcon className="w-12 h-12 mb-3" />
                            <span className="text-xl font-semibold">Algebraic Solver</span>
                            <span className="text-sm mt-2 opacity-80">High Score: {getTopScoreForGame('algebra')}</span>
                        </button>
                        <button onClick={() => selectGame('sequence')} className="bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col items-center">
                            <TrendingUpIcon className="w-12 h-12 mb-3" />
                            <span className="text-xl font-semibold">Number Sequences</span>
                            <span className="text-sm mt-2 opacity-80">High Score: {getTopScoreForGame('sequence')}</span>
                        </button>
                         <button onClick={() => selectGame('geometry')} className="bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col items-center">
                            <GeometryIcon className="w-12 h-12 mb-3" />
                            <span className="text-xl font-semibold">Geo Genius</span>
                            <span className="text-sm mt-2 opacity-80">High Score: {getTopScoreForGame('geometry')}</span>
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'choosing-difficulty' && selectedGame && (
                <div className="animate-fade-in">
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Choose your game settings.</p>

                    <div className="mb-8">
                        <h4 className="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-300">Duration</h4>
                        <div className="flex justify-center gap-3">
                            {[30, 60, 90].map(duration => (
                                <button
                                    key={duration}
                                    onClick={() => setGameDuration(duration)}
                                    className={`px-6 py-2 rounded-full font-semibold transition-colors text-sm ${
                                        gameDuration === duration
                                            ? 'bg-indigo-600 text-white shadow'
                                            : 'bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {duration}s
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-3 text-slate-700 dark:text-slate-300">Difficulty</h4>
                        <div className="space-y-4">
                            <button onClick={() => startGame('Easy')} className={`${difficultyButtonClasses} bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700`}>
                                <span className="text-xl">Easy</span>
                                <span className="text-sm opacity-80">High Score: {highScores[`${selectedGame}-Easy`]?.highScore || 0}</span>
                            </button>
                            <button onClick={() => startGame('Medium')} className={`${difficultyButtonClasses} bg-gradient-to-br from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700`}>
                                <span className="text-xl">Medium</span>
                                <span className="text-sm opacity-80">High Score: {highScores[`${selectedGame}-Medium`]?.highScore || 0}</span>
                            </button>
                            <button onClick={() => startGame('Hard')} className={`${difficultyButtonClasses} bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700`}>
                                <span className="text-xl">Hard</span>
                                <span className="text-sm opacity-80">High Score: {highScores[`${selectedGame}-Hard`]?.highScore || 0}</span>
                            </button>
                        </div>
                    </div>
                    
                    <button onClick={() => setGameState('choosing-game')} className="mt-8 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        &larr; Back to game selection
                    </button>
                </div>
            )}

            {gameState === 'playing' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-2xl font-bold">Score: <span className="text-indigo-400">{score}</span></div>
                        <div className="text-2xl font-bold">Time: <span className={`font-mono ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''}`}>{timeLeft}</span></div>
                    </div>

                    <div className="relative my-8 min-h-[160px] flex items-center justify-center">
                         <div className={`transition-all duration-300 ${feedbackMessage ? 'opacity-20 blur-sm' : 'opacity-100'}`}>
                            <div className={isShaking ? 'animate-shake' : ''}>
                                {renderProblem()}
                            </div>
                        </div>
                        {feedbackMessage && (
                            <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
                                <p className="text-xl font-semibold text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">{feedbackMessage}</p>
                            </div>
                        )}
                    </div>
                    
                    {problem?.type === 'geometry' ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                            {problem.options.map(option => (
                                <button
                                    key={option}
                                    onClick={() => handleChoiceSubmit(option)}
                                    disabled={timeLeft <= 0 || !!feedbackMessage}
                                    className="w-full px-4 py-3 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all disabled:opacity-50"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={handleAnswerSubmit}>
                            <input
                                ref={inputRef}
                                type="number"
                                pattern="\\d*"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                className="w-full text-center text-3xl p-3 border-2 border-slate-300 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-50"
                                autoComplete="off"
                                disabled={timeLeft <= 0 || !!feedbackMessage}
                            />
                            <button type="submit" className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:from-slate-400 disabled:to-slate-400 dark:disabled:from-gray-600 disabled:cursor-not-allowed" disabled={!userAnswer.trim() || timeLeft <= 0 || !!feedbackMessage}>
                                Submit
                            </button>
                        </form>
                    )}
                </div>
            )}

            {gameState === 'finished' && selectedGame && difficulty && (
                <div className="animate-fade-in">
                    <h3 className="text-4xl font-bold">Time's Up!</h3>
                    {isNewHighScore && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 text-yellow-300 rounded-lg flex items-center justify-center gap-2 animate-pulse">
                            <StarIcon className="w-6 h-6" />
                            <p className="text-lg font-semibold">New High Score!</p>
                        </div>
                    )}
                    <div className="mt-6 text-2xl">
                        Your Score: <span className="font-bold text-indigo-400">{score}</span>
                    </div>
                    <div className="text-lg text-slate-500 dark:text-slate-400 mb-6">
                        High Score: {currentHighScore}
                    </div>

                    {lastStats && (
                        <div className="grid grid-cols-2 gap-4 text-center my-6">
                            <div className="col-span-2 flex items-center justify-center">
                                <AccuracyCircle accuracy={lastStats.accuracy} />
                            </div>
                            <StatCard icon={<CheckCircleIcon className="w-6 h-6"/>} label="Correct" value={lastStats.correct} colorClass="text-green-500 dark:text-green-400" />
                            <StatCard icon={<XCircleIcon className="w-6 h-6"/>} label="Incorrect" value={lastStats.incorrect} colorClass="text-red-500 dark:text-red-400" />
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                        <button onClick={playAgainSameSettings} className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all">
                            Play Again ({difficulty})
                        </button>
                        <button onClick={resetGame} className="w-full px-6 py-3 bg-slate-500 dark:bg-gray-600 text-white font-semibold rounded-lg hover:bg-slate-600 dark:hover:bg-gray-500 transition-colors">
                            New Game
                        </button>
                    </div>

                    {incorrectAnswers.length > 0 && (
                        <div className="mt-8 text-left">
                            <h4 className="text-xl font-semibold mb-4">Review Your Mistakes</h4>
                            <ul className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                {incorrectAnswers.map((item, index) => (
                                    <li key={index} className="p-4 bg-slate-100 dark:bg-gray-800/50 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Problem:</p>
                                                <p className="font-semibold font-mono text-lg">
                                                    {item.problem.type === 'sprint' && `${item.problem.num1} ${item.problem.operator} ${item.problem.num2}`}
                                                    {item.problem.type === 'algebra' && item.problem.equation}
                                                    {item.problem.type === 'sequence' && item.problem.sequence.join(', ')}
                                                    {item.problem.type === 'geometry' && item.problem.question}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p><span className="text-sm text-red-500">Your answer:</span> <span className="font-semibold">{item.userAnswer}</span></p>
                                                <p><span className="text-sm text-green-500">Correct:</span> <span className="font-semibold">{item.problem.answer}</span></p>
                                            </div>
                                        </div>
                                        {item.problem.type === 'algebra' && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-gray-700">
                                                {isFetchingExplanations && !explanations[item.problem.equation] && <p className="text-sm text-slate-400">Loading explanation...</p>}
                                                {explanations[item.problem.equation] && (
                                                    <div className="prose prose-sm dark:prose-invert max-w-none message-content" dangerouslySetInnerHTML={{ __html: explanations[item.problem.equation].replace(/\n/g, '<br />') }}/>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};