import cron from "node-cron";
import { sendTomorrowTestDriveReminders } from "./TsetBookingRemaind";
import logger from "./logger";

export const startCronJobs = () => {
  // Runs every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    logger.info("⏰ Running test drive reminder cron job...");
    await sendTomorrowTestDriveReminders();
  });
};
