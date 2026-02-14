
import cron from 'node-cron';
import { generateDailyCleaningTasks } from './cleanerService';

// Initialize scheduled jobs
export const initScheduledJobs = () => {
    console.log('[Scheduler] Initializing scheduled jobs...');

    // Schedule: Daily Hostel Task Generation at 6:00 AM
    // Cron format: Minute Hour DayMonth Month DayWeek
    cron.schedule('0 6 * * *', async () => {
        console.log('[Scheduler] Running Daily Hostel Task Generation...');
        try {
            const result = await generateDailyCleaningTasks(new Date());
            console.log('[Scheduler] Task Generation Result:', result.message);
        } catch (error) {
            console.error('[Scheduler] Failed to generate daily tasks:', error);
        }
    });

    console.log('[Scheduler] Jobs scheduled successfully.');
};
