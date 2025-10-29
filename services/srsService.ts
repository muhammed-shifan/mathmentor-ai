import { MATH_TOPICS } from '../constants';
import type { MathTopic, SRSTopicData } from '../types';

const SRS_DATA_KEY = 'mathMentorSRSData';

// --- Helper Functions ---
const getSRSData = (): Record<string, SRSTopicData> => {
    try {
        const data = localStorage.getItem(SRS_DATA_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error("Error reading SRS data from localStorage:", error);
        return {};
    }
};

const saveSRSData = (data: Record<string, SRSTopicData>) => {
    try {
        localStorage.setItem(SRS_DATA_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Error saving SRS data to localStorage:", error);
    }
};

// Spacing intervals in milliseconds
const REVIEW_INTERVALS: { [key: number]: number } = {
    0: 4 * 60 * 60 * 1000,      // 4 hours
    1: 8 * 60 * 60 * 1000,      // 8 hours
    2: 24 * 60 * 60 * 1000,     // 1 day
    3: 3 * 24 * 60 * 60 * 1000,   // 3 days
    4: 7 * 24 * 60 * 60 * 1000,   // 1 week
    5: 14 * 24 * 60 * 60 * 1000,  // 2 weeks
};

// --- Exported Functions ---

/**
 * Gets a list of topics that are due for review.
 */
export const getTopicsForReview = (): MathTopic[] => {
    const srsData = getSRSData();
    const now = Date.now();
    
    const topicsForReviewNames = Object.keys(srsData).filter(topicName => {
        const topicData = srsData[topicName];
        return topicData.nextReview <= now;
    });

    // Map names back to the full MathTopic objects
    return MATH_TOPICS.filter(topic => topicsForReviewNames.includes(topic.name));
};

/**
 * Records the performance on a quiz for a specific topic, updating its strength and scheduling the next review.
 */
// FIX: Changed function signature to accept a single object argument to resolve a compiler error at the call site.
export const recordPerformance = ({ topicName, score }: { topicName: string, score: number }) => {
    const srsData = getSRSData();
    const now = Date.now();

    let topicData: SRSTopicData = srsData[topicName] || {
        strength: 0,
        lastReviewed: 0,
        nextReview: 0,
    };

    // Update strength based on score
    if (score >= 90) {
        topicData.strength = Math.min(topicData.strength + 1, 5);
    } else if (score < 60) {
        topicData.strength = Math.max(topicData.strength - 1, 0);
    }
    // Otherwise, strength remains the same.

    topicData.lastReviewed = now;
    topicData.nextReview = now + (REVIEW_INTERVALS[topicData.strength] || REVIEW_INTERVALS[0]);

    srsData[topicName] = topicData;
    saveSRSData(srsData);
};

/**
 * Updates the last reviewed timestamp for a topic.
 * This is called when a review is started, but before the quiz is graded.
 */
export const updateReviewTimestamp = (topicName: string) => {
    const srsData = getSRSData();
    const now = Date.now();

    const topicData = srsData[topicName];
    
    if (topicData) {
        topicData.lastReviewed = now;
        // Optimistically push the next review date forward so it doesn't immediately show up again if the user leaves the page before finishing a quiz.
        // The 'real' next review date will be set by recordPerformance.
        topicData.nextReview = now + (REVIEW_INTERVALS[topicData.strength] || REVIEW_INTERVALS[0]);
        srsData[topicName] = topicData;
        saveSRSData(srsData);
    } else {
        // If the topic has never been seen in SRS, create a new entry.
        // This might happen if a user starts a "Review" from the AI Tutor without having a lesson first.
        // We assume average performance to kickstart the SRS cycle.
        // FIX: Update call to match the new signature of `recordPerformance`.
        recordPerformance({ topicName, score: 75 });
    }
};
