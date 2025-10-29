import { useState, useEffect, useCallback } from 'react';
import type { ReminderSettings } from '../types';

const REMINDER_SETTINGS_KEY = 'mathMentorReminderSettings';
const NEXT_REMINDER_TIMESTAMP_KEY = 'mathMentorNextReminder';

const getDayIndex = (day: string): number => {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
}

export const useReminder = () => {
    const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
        day: 'Monday',
        time: '17:00',
        isEnabled: false,
    });
    const [isReminderDue, setIsReminderDue] = useState(false);
    // Fix: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility.
    const [checkInterval, setCheckInterval] = useState<ReturnType<typeof setInterval> | null>(null);

    const calculateNextReminderTimestamp = useCallback((settings: ReminderSettings): number => {
        const now = new Date();
        const targetDay = getDayIndex(settings.day);
        const [targetHour, targetMinute] = settings.time.split(':').map(Number);

        const nextReminder = new Date();
        nextReminder.setDate(now.getDate() + (targetDay - now.getDay() + 7) % 7);
        nextReminder.setHours(targetHour, targetMinute, 0, 0);

        // If the calculated time is in the past for today, set it for next week
        if (nextReminder.getTime() < now.getTime()) {
            nextReminder.setDate(nextReminder.getDate() + 7);
        }

        return nextReminder.getTime();
    }, []);

    const checkForReminder = useCallback(() => {
        const nextTimestampStr = localStorage.getItem(NEXT_REMINDER_TIMESTAMP_KEY);
        if (nextTimestampStr) {
            const nextTimestamp = parseInt(nextTimestampStr, 10);
            if (Date.now() >= nextTimestamp) {
                setIsReminderDue(true);
            }
        }
    }, []);
    
    useEffect(() => {
        // Load settings from localStorage on initial mount
        try {
            const storedSettings = localStorage.getItem(REMINDER_SETTINGS_KEY);
            if (storedSettings) {
                setReminderSettings(JSON.parse(storedSettings));
            }
        } catch (error) {
            console.error("Failed to load reminder settings from localStorage", error);
        }
        
        // Initial check
        checkForReminder();

        // Check every minute
        if (checkInterval) clearInterval(checkInterval);
        const intervalId = setInterval(checkForReminder, 60000);
        setCheckInterval(intervalId);

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [checkForReminder]);


    const setReminder = (day: string, time: string) => {
        const newSettings: ReminderSettings = { day, time, isEnabled: true };
        setReminderSettings(newSettings);
        localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(newSettings));

        const nextTimestamp = calculateNextReminderTimestamp(newSettings);
        localStorage.setItem(NEXT_REMINDER_TIMESTAMP_KEY, String(nextTimestamp));
        setIsReminderDue(false); // Reset due status when a new reminder is set
    };

    const clearReminder = () => {
        const newSettings: ReminderSettings = { ...reminderSettings, isEnabled: false };
        setReminderSettings(newSettings);
        localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(newSettings));
        localStorage.removeItem(NEXT_REMINDER_TIMESTAMP_KEY);
        setIsReminderDue(false);
    };

    const dismissReminder = () => {
        setIsReminderDue(false);
        // Recalculate for the *next* week
        const nextTimestamp = calculateNextReminderTimestamp(reminderSettings);
        localStorage.setItem(NEXT_REMINDER_TIMESTAMP_KEY, String(nextTimestamp));
    };

    return {
        reminderSettings,
        isReminderDue,
        setReminder,
        clearReminder,
        dismissReminder,
    };
};