import type { DailyChallengeProblem, LeaderboardEntry, Difficulty, GameProblem } from '../types';
import { generateSprintProblem, generateAlgebraProblem, generateSequenceProblem, generateGeometryProblem } from '../utils/problemGenerator';

const getTodayDateString = (): string => new Date().toISOString().slice(0, 10);

// Simple seeded PRNG for deterministic "randomness"
const createPRNG = (seedStr: string) => {
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
        seed = (seed * 31 + seedStr.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return () => {
        seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF;
        return (seed >>> 0) / 0xFFFFFFFF;
    };
};


const generateProblemsForDay = (dateString: string): DailyChallengeProblem[] => {
    const prng = createPRNG(dateString);
    const problems: DailyChallengeProblem[] = [];

    // Problem 1: Easy Arithmetic
    problems.push({
        problem: generateSprintProblem('Easy', prng),
        difficulty: 'Easy'
    });

    // Problem 2: Easy Algebra
    problems.push({
        problem: generateAlgebraProblem('Easy', prng),
        difficulty: 'Easy'
    });

    // Problem 3: Medium Sequence
    problems.push({
        problem: generateSequenceProblem('Medium', prng),
        difficulty: 'Medium'
    });
    
    // Problem 4: Medium Geometry
    problems.push({
        problem: generateGeometryProblem('Medium', prng),
        difficulty: 'Medium'
    });

    // Problem 5: Hard Algebra or Sprint
    const hardProblemType = prng() > 0.5 ? 'algebra' : 'sprint';
    if (hardProblemType === 'algebra') {
        problems.push({
            problem: generateAlgebraProblem('Hard', prng),
            difficulty: 'Hard'
        });
    } else {
        problems.push({
            problem: generateSprintProblem('Hard', prng),
            difficulty: 'Hard'
        });
    }

    return problems;
};

export const getDailyChallenge = (): DailyChallengeProblem[] => {
    const today = getTodayDateString();
    const storageKey = `dailyChallenge_${today}`;

    try {
        const storedChallenge = localStorage.getItem(storageKey);
        if (storedChallenge) {
            return JSON.parse(storedChallenge);
        } else {
            // Clear old challenges to save space
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('dailyChallenge_')) {
                    localStorage.removeItem(key);
                }
            });

            const newProblems = generateProblemsForDay(today);
            localStorage.setItem(storageKey, JSON.stringify(newProblems));
            return newProblems;
        }
    } catch (error) {
        console.error("Error with localStorage for daily challenge:", error);
        return generateProblemsForDay(today); // Fallback to generating without storing
    }
};

export const getLeaderboard = (): LeaderboardEntry[] => {
    const today = getTodayDateString();
    const storageKey = `dailyChallengeLeaderboard_${today}`;
    try {
        const storedLeaderboard = localStorage.getItem(storageKey);
        if (storedLeaderboard) {
            return JSON.parse(storedLeaderboard);
        } else {
            // Clear old leaderboards
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('dailyChallengeLeaderboard_')) {
                    localStorage.removeItem(key);
                }
            });
            return [];
        }
    } catch (error) {
        console.error("Error reading leaderboard from localStorage:", error);
        return [];
    }
};

export const saveScoreToLeaderboard = (name: string, score: number, time: number): LeaderboardEntry[] => {
    const today = getTodayDateString();
    const storageKey = `dailyChallengeLeaderboard_${today}`;
    const newEntry: LeaderboardEntry = { name, score, time };

    try {
        const leaderboard = getLeaderboard();
        leaderboard.push(newEntry);
        
        // Sort by score (desc), then by time (asc)
        leaderboard.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.time - b.time;
        });

        const top10 = leaderboard.slice(0, 10);
        localStorage.setItem(storageKey, JSON.stringify(top10));
        return top10;

    } catch (error) {
        console.error("Error saving score to localStorage:", error);
        return [newEntry];
    }
};

const getCompletionData = (): { [date: string]: { [user: string]: boolean } } => {
    try {
        const storedData = localStorage.getItem('dailyChallengeCompletion');
        return storedData ? JSON.parse(storedData) : {};
    } catch (error) {
        return {};
    }
};

export const getCompletionStatus = (user: string): boolean => {
    const today = getTodayDateString();
    const completionData = getCompletionData();
    return completionData[today]?.[user] ?? false;
};

export const markAsCompleted = (user: string) => {
    const today = getTodayDateString();
    const completionData = getCompletionData();
    
    // Create object for today if it doesn't exist
    if (!completionData[today]) {
        completionData[today] = {};
    }
    
    completionData[today][user] = true;
    
    // Clean up old dates
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (completionData[yesterdayStr]) {
        delete completionData[yesterdayStr];
    }
    
    try {
        localStorage.setItem('dailyChallengeCompletion', JSON.stringify(completionData));
    } catch (error) {
        console.error("Error marking challenge as complete:", error);
    }
};