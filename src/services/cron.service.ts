import cron from 'node-cron';
import LandscapingService from './landscaping.service';
import { IrrigationsService } from './irrigations.service';
import UserService from './user.service';

class CronService {
   private static irrigationAfterImageRunning = false;
   private static userSyncRunning = false;
   private static irrigationAfterImageCronTask: any = null;
   private static userSyncCronTask: any = null;
   private static landscapingSectionTasks: Map<string, { task: any; isRunning: boolean; lastExecution: Date | null; nextExecution: Date | null; executeJob?: () => Promise<void> }> = new Map();
   private static irrigationSectionTasks: Map<string, { task: any; isRunning: boolean; lastExecution: Date | null; nextExecution: Date | null; executeJob?: () => Promise<void> }> = new Map();
   private static readonly JOB_TIMEOUT = 60 * 60 * 1000; 
   
   private static readonly TIMEZONE = process.env.TZ || 'Asia/Dubai';

   // Convert time string (HH:MM, HHMM, or HH:MM AM/PM) to cron expression
   private static timeToCronExpression(timeStr: string): string {
      const parsed = this.parseTimeString(timeStr);
      if (!parsed) {
         throw new Error(`Invalid time format: ${timeStr}`);
      }
      return `${parsed.minutes} ${parsed.hours} * * *`;
   }

   // Calculate next execution time from time string
   private static getNextExecutionTime(timeStr: string): Date {
      const parsed = this.parseTimeString(timeStr);
      if (!parsed) {
         throw new Error(`Invalid time format: ${timeStr}`);
      }
      const now = new Date();
      const nextTime = new Date();
      nextTime.setHours(parsed.hours, parsed.minutes, 0, 0);
      
      if (nextTime <= now) {
         nextTime.setDate(nextTime.getDate() + 1);
      }
      
      return nextTime;
   }

   // Parse time string to hours and minutes (handles both 12-hour and 24-hour formats)
   private static parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
      if (!timeStr || typeof timeStr !== 'string') {
         return null;
      }

      const workingTime = timeStr.trim().toUpperCase();
      let hours = 0;
      let minutes = 0;

      // Check for 12-hour format with AM/PM
      const hasAMPM = workingTime.includes('AM') || workingTime.includes('PM');
      
      if (hasAMPM) {
         // Handle 12-hour format: "10:56 PM", "10:56PM", "10:56 PM", etc.
         const timePart = workingTime.replace(/\s*(AM|PM)\s*/i, '').trim();
         const isPM = workingTime.includes('PM');
         
         if (timePart.includes(':')) {
            const [h, m] = timePart.split(':');
            hours = parseInt(h, 10) || 0;
            minutes = parseInt(m, 10) || 0;
            
            // Convert to 24-hour format
            if (isPM && hours !== 12) {
               hours += 12;
            } else if (!isPM && hours === 12) {
               hours = 0;
            }
         } else {
            console.error(`[CronService] Invalid 12-hour format: ${timeStr}`);
            return null;
         }
      } else if (workingTime.includes(':')) {
         // 24-hour format: "HH:MM"
         const [h, m] = workingTime.split(':');
         hours = parseInt(h, 10) || 0;
         minutes = parseInt(m, 10) || 0;
      } else if (workingTime.length === 4) {
         // Format: "HHMM"
         hours = parseInt(workingTime.substring(0, 2), 10) || 0;
         minutes = parseInt(workingTime.substring(2, 4), 10) || 0;
      } else {
         console.error(`[CronService] Invalid time format: ${timeStr}`);
         return null;
      }

      // Validate hours and minutes
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
         console.error(`[CronService] Invalid hours/minutes: ${hours}:${minutes} for time ${timeStr}`);
         return null;
      }

      return { hours, minutes };
   }

   // Calculate countdown string from next execution time
   private static getCountdown(nextExecution: Date): string {
      const now = new Date();
      const diff = nextExecution.getTime() - now.getTime();
      
      if (diff <= 0) {
         return 'Due now';
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
         return `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
         return `${minutes}m ${seconds}s`;
      } else {
         return `${seconds}s`;
      }
   }

   // Initialize landscaping section cron jobs dynamically
   private static async initializeLandscapingSectionCronJobs() {
      try {
         // Stop existing landscaping section tasks
         this.landscapingSectionTasks.forEach((taskData, time) => {
            if (taskData.task) {
               taskData.task.stop();
            }
         });
         this.landscapingSectionTasks.clear();

         // Get all unique working times
         const workingTimes = await LandscapingService.getAllLandscapingWorkingTimes();
         
         console.log(`[CronService] Found ${workingTimes.length} unique landscaping section working times`);
         if (workingTimes.length > 0) {
            console.log(`[CronService] Landscaping working times:`, workingTimes);
         } else {
            console.warn(`[CronService] ⚠️ No landscaping working times found! Check database for cameras_landscaping_section records.`);
         }

         for (const workingTime of workingTimes) {
            try {
               // Validate time format before creating cron expression
               const parsed = this.parseTimeString(workingTime);
               if (!parsed) {
                  console.error(`[CronService] ⚠️ Skipping invalid working time format: ${workingTime}`);
                  continue;
               }

               const cronExpression = this.timeToCronExpression(workingTime);
               const nextExecution = this.getNextExecutionTime(workingTime);

               // Create a reusable job execution function
               const executeJob = async () => {
                  const taskData = this.landscapingSectionTasks.get(workingTime);
                  if (!taskData) return;

                  if (taskData.isRunning) {
                     console.warn(`[CronService] ⚠️ Landscaping section job for ${workingTime} already running, skipping`);
                     return;
                  }

                  taskData.isRunning = true;
                  taskData.lastExecution = new Date();
                  const startTime = Date.now();

                  const timeoutId = setTimeout(() => {
                     if (taskData.isRunning) {
                        console.error(`[CronService] ⚠️ Landscaping section job for ${workingTime} timed out after 1 hour`);
                        taskData.isRunning = false;
                     }
                  }, this.JOB_TIMEOUT);

                  try {
                     const result = await LandscapingService.monitorLandscapingSectionsService(workingTime);
                     const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                     console.log(`[CronService] ✅ Landscaping section job for ${workingTime} completed:`, {
                        success: result.success,
                        message: result.message,
                        processedSections: result.results?.length || 0,
                        duration: `${duration}s`
                     });
                  } catch (error: any) {
                     const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                     console.error(`[CronService] ❌ Landscaping section job for ${workingTime} failed:`, {
                        error: error.message,
                        duration: `${duration}s`
                     });
                  } finally {
                     clearTimeout(timeoutId);
                     taskData.isRunning = false;
                     taskData.nextExecution = this.getNextExecutionTime(workingTime);
                  }
               };

               const task = cron.schedule(cronExpression, executeJob, {
                  timezone: this.TIMEZONE
               } as any);

               this.landscapingSectionTasks.set(workingTime, {
                  task,
                  isRunning: false,
                  lastExecution: null,
                  nextExecution: nextExecution,
                  executeJob: executeJob // Store the execute function for manual triggering
               });

               // Check if the scheduled time is within 5 minutes - if so, trigger immediately
               const now = new Date();
               const timeDiff = nextExecution.getTime() - now.getTime();
               const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

               if (timeDiff > 0 && timeDiff <= fiveMinutes) {
                  console.log(`[CronService] ⚡ Landscaping section job for ${workingTime} is scheduled within 5 minutes, triggering immediately...`);
                  // Trigger after a short delay to ensure the task is registered
                  setTimeout(() => {
                     executeJob();
                  }, 1000);
               }

               console.log(`[CronService] ✅ Scheduled landscaping section job for ${workingTime} daily (${cronExpression})`);
            } catch (error: any) {
               console.error(`[CronService] ❌ Failed to schedule landscaping section job for ${workingTime}:`, {
                  error: error.message,
                  stack: error.stack,
                  workingTime: workingTime
               });
            }
         }

         console.log(`[CronService] ✅ Initialized ${this.landscapingSectionTasks.size} landscaping section cron jobs`);
      } catch (error: any) {
         console.error('[CronService] ❌ Failed to initialize landscaping section cron jobs:', error.message);
      }
   }

   // Initialize irrigation section cron jobs dynamically
   private static async initializeIrrigationSectionCronJobs() {
      try {
         // Stop existing irrigation section tasks
         this.irrigationSectionTasks.forEach((taskData, time) => {
            if (taskData.task) {
               taskData.task.stop();
            }
         });
         this.irrigationSectionTasks.clear();

         // Get all unique working times
         const workingTimes = await IrrigationsService.getAllIrrigationWorkingTimes();
         
         console.log(`[CronService] Found ${workingTimes.length} unique irrigation section working times`);
         if (workingTimes.length > 0) {
            console.log(`[CronService] Irrigation working times:`, workingTimes);
         } else {
            console.warn(`[CronService] ⚠️ No irrigation working times found! Check database for cameras_irrigation_section records.`);
         }

         for (const workingTime of workingTimes) {
            try {
               // Validate time format before creating cron expression
               const parsed = this.parseTimeString(workingTime);
               if (!parsed) {
                  console.error(`[CronService] ⚠️ Skipping invalid working time format: ${workingTime}`);
                  continue;
               }

               const cronExpression = this.timeToCronExpression(workingTime);
               const nextExecution = this.getNextExecutionTime(workingTime);

               // Create a reusable job execution function
               const executeJob = async () => {
                  const taskData = this.irrigationSectionTasks.get(workingTime);
                  if (!taskData) return;

                  if (taskData.isRunning) {
                     console.warn(`[CronService] ⚠️ Irrigation section job for ${workingTime} already running, skipping`);
                     return;
                  }

                  taskData.isRunning = true;
                  taskData.lastExecution = new Date();
                  const startTime = Date.now();

                  console.log(`[CronService] 💧 Starting irrigation section job for ${workingTime} at ${new Date().toLocaleString()}`);

                  const timeoutId = setTimeout(() => {
                     if (taskData.isRunning) {
                        console.error(`[CronService] ❌ Irrigation section job for ${workingTime} timed out after ${this.JOB_TIMEOUT / 1000}s`);
                        taskData.isRunning = false;
                     }
                  }, this.JOB_TIMEOUT);

                  try {
                     const result = await IrrigationsService.monitorIrrigationSectionsService(workingTime);
                     const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                     console.log(`[CronService] ✅ Irrigation section job for ${workingTime} completed:`, {
                        success: result.success,
                        message: result.message,
                        processedSections: result.results?.length || 0,
                        duration: `${duration}s`
                     });
                  } catch (error: any) {
                     const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                     console.error(`[CronService] ❌ Irrigation section job for ${workingTime} failed:`, {
                        error: error.message,
                        duration: `${duration}s`
                     });
                  } finally {
                     clearTimeout(timeoutId);
                     taskData.isRunning = false;
                     taskData.nextExecution = this.getNextExecutionTime(workingTime);
                  }
               };

               const task = cron.schedule(cronExpression, executeJob, {
                  timezone: this.TIMEZONE
               } as any);

               this.irrigationSectionTasks.set(workingTime, {
                  task,
                  isRunning: false,
                  lastExecution: null,
                  nextExecution: nextExecution,
                  executeJob: executeJob // Store the execute function for manual triggering
               });

               // Check if the scheduled time is within 5 minutes - if so, trigger immediately
               const now = new Date();
               const timeDiff = nextExecution.getTime() - now.getTime();
               const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

               if (timeDiff > 0 && timeDiff <= fiveMinutes) {
                  console.log(`[CronService] ⚡ Irrigation section job for ${workingTime} is scheduled within 5 minutes, triggering immediately...`);
                  // Trigger after a short delay to ensure the task is registered
                  setTimeout(() => {
                     executeJob();
                  }, 1000);
               }

               console.log(`[CronService] ✅ Scheduled irrigation section job for ${workingTime} daily (${cronExpression})`);
            } catch (error: any) {
               console.error(`[CronService] ❌ Failed to schedule irrigation section job for ${workingTime}:`, {
                  error: error.message,
                  stack: error.stack,
                  workingTime: workingTime
               });
            }
         }

         console.log(`[CronService] ✅ Initialized ${this.irrigationSectionTasks.size} irrigation section cron jobs`);
      } catch (error: any) {
         console.error('[CronService] ❌ Failed to initialize irrigation section cron jobs:', error.message);
      }
   }

   public static async initializeCronJobs() {
      this.stopCronJobs();
      
      this.irrigationAfterImageRunning = false;
      this.userSyncRunning = false;

      const currentTime = new Date();
      console.log('[CronService] Initializing cron jobs...');
      console.log('[CronService] Current server time:', {
         local: currentTime.toLocaleString(),
         utc: currentTime.toUTCString(),
         timezone: this.TIMEZONE,
         timezoneOffset: currentTime.getTimezoneOffset()
      });


      // Static grass and irrigation monitoring jobs removed - now handled dynamically by section-based cron jobs

      this.irrigationAfterImageCronTask = cron.schedule('5 6 * * *', async () => {
         const triggerTime = new Date();
         console.log(`[CronService] 🕐 Irrigation after-image update cron triggered at ${triggerTime.toLocaleString()}`);
         
         if (this.irrigationAfterImageRunning) {
            console.warn('[CronService] ⚠️ Irrigation after-image update already running, skipping this execution');
            return;
         }

         this.irrigationAfterImageRunning = true;
         const startTime = Date.now();
         console.log('[CronService] Starting irrigation after-image update...');

         const timeoutId = setTimeout(() => {
            if (this.irrigationAfterImageRunning) {
               console.error('[CronService] ⚠️ Irrigation after-image update job timed out after 1 hour, forcing reset');
               this.irrigationAfterImageRunning = false;
            }
         }, this.JOB_TIMEOUT);

         try {
            const result = await IrrigationsService.updateIrrigationZonesAfterImage();
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log('[CronService] ✅ Irrigation after-image update completed successfully:', {
               success: result.success,
               message: result.message,
               processedCameras: result.results?.length || 0,
               duration: `${duration}s`
            });
         } catch (error: any) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.error('[CronService] ❌ Irrigation after-image update failed:', {
               error: error.message,
               stack: error.stack,
               duration: `${duration}s`
            });
         } finally {
            clearTimeout(timeoutId);
            this.irrigationAfterImageRunning = false;
            console.log('[CronService] Irrigation after-image update job finished, flag reset');
         }
      }, {
         timezone: this.TIMEZONE
      } as any);

      this.userSyncCronTask = cron.schedule('*/30 * * * *', async () => {
         const triggerTime = new Date();
         console.log(`[CronService] 🕐 User sync cron triggered at ${triggerTime.toLocaleString()}`);
         
         if (this.userSyncRunning) {
            console.warn('[CronService] ⚠️ User sync already running, skipping this execution');
            return;
         }

         this.userSyncRunning = true;
         const startTime = Date.now();
         console.log('[CronService] Starting user sync...');

         const timeoutId = setTimeout(() => {
            if (this.userSyncRunning) {
               console.error('[CronService] ⚠️ User sync job timed out after 1 hour, forcing reset');
               this.userSyncRunning = false;
            }
         }, this.JOB_TIMEOUT);

         try {
            const result: any = await UserService.fetchAndStoreEmployeeListingService();
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log('[CronService] ✅ User sync completed successfully:', {
               success: result.message || 'Completed',
               summary: result.summary || {},
               duration: `${duration}s`
            });
         } catch (error: any) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.error('[CronService] ❌ User sync failed:', {
               error: error.message,
               stack: error.stack,
               duration: `${duration}s`
            });
         } finally {
            clearTimeout(timeoutId);
            this.userSyncRunning = false;
            console.log('[CronService] User sync job finished, flag reset');
         }
      }, {
         timezone: this.TIMEZONE
      } as any);

      // Initialize landscaping section cron jobs dynamically
      await this.initializeLandscapingSectionCronJobs();

      // Initialize irrigation section cron jobs dynamically
      await this.initializeIrrigationSectionCronJobs();

      const tasks = cron.getTasks();
      const isIrrigationAfterImageTaskActive = this.irrigationAfterImageCronTask && Object.keys(tasks).length > 0;
      const isUserSyncTaskActive = this.userSyncCronTask && Object.keys(tasks).length > 0;
      
      console.log('[CronService] ✅ Cron jobs initialized successfully');
      console.log('[CronService] Schedule:');
      console.log('[CronService]   - Irrigation after-image update: 06:05 AM daily');
      console.log('[CronService]   - User sync: Every 30 minutes');
      console.log(`[CronService]   - Landscaping section jobs: ${this.landscapingSectionTasks.size} jobs scheduled (daily)`);
      this.landscapingSectionTasks.forEach((taskData, time) => {
         const nextExec = taskData.nextExecution || this.getNextExecutionTime(time);
         const countdown = this.getCountdown(nextExec);
         console.log(`[CronService]     * ${time} daily - Next: ${nextExec.toLocaleString()} (${countdown})`);
      });
      console.log(`[CronService]   - Irrigation section jobs: ${this.irrigationSectionTasks.size} jobs scheduled (daily)`);
      this.irrigationSectionTasks.forEach((taskData, time) => {
         const nextExec = taskData.nextExecution || this.getNextExecutionTime(time);
         const countdown = this.getCountdown(nextExec);
         console.log(`[CronService]     * ${time} daily - Next: ${nextExec.toLocaleString()} (${countdown})`);
      });
      console.log('[CronService] Status:');
      console.log('[CronService]   - Irrigation after-image cron task active:', isIrrigationAfterImageTaskActive ? '✅ YES' : '❌ NO');
      console.log('[CronService]   - User sync cron task active:', isUserSyncTaskActive ? '✅ YES' : '❌ NO');
      console.log(`[CronService]   - Landscaping section tasks active: ${this.landscapingSectionTasks.size} ✅`);
      console.log(`[CronService]   - Irrigation section tasks active: ${this.irrigationSectionTasks.size} ✅`);
      console.log('[CronService]   - Total active tasks:', Object.keys(tasks).length);
      console.log('[CronService]   - Timezone:', this.TIMEZONE);
      
      const now = new Date();
      const nextIrrigationAfterImageTime = new Date(now);
      nextIrrigationAfterImageTime.setHours(6, 5, 0, 0);
      if (nextIrrigationAfterImageTime <= now) {
         nextIrrigationAfterImageTime.setDate(nextIrrigationAfterImageTime.getDate() + 1);
      }

      const nextUserSyncTime = new Date(now);
      nextUserSyncTime.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
      if (nextUserSyncTime <= now) {
         nextUserSyncTime.setHours(nextUserSyncTime.getHours() + 1);
         nextUserSyncTime.setMinutes(0, 0, 0);
      }
      
      console.log('[CronService] Next executions:');
      console.log('[CronService]   - Irrigation after-image update:', nextIrrigationAfterImageTime.toLocaleString(), `(${this.getCountdown(nextIrrigationAfterImageTime)})`);
      console.log('[CronService]   - User sync:', nextUserSyncTime.toLocaleString(), `(${this.getCountdown(nextUserSyncTime)})`);
      
      if (!isIrrigationAfterImageTaskActive || !isUserSyncTaskActive) {
         console.warn('[CronService] ⚠️ WARNING: Some cron tasks may not be active. Server restart may be required.');
      }
   }

   // Refresh landscaping section cron jobs (call this when cameras are added/updated)
   public static async refreshLandscapingSectionCronJobs() {
      console.log('[CronService] Refreshing landscaping section cron jobs...');
      await this.initializeLandscapingSectionCronJobs();
      console.log('[CronService] ✅ Landscaping section cron jobs refreshed');
   }

   // Refresh irrigation section cron jobs (call this when cameras are added/updated)
   public static async refreshIrrigationSectionCronJobs() {
      console.log('[CronService] Refreshing irrigation section cron jobs...');
      await this.initializeIrrigationSectionCronJobs();
      console.log('[CronService] ✅ Irrigation section cron jobs refreshed');
   }

   public static stopCronJobs() {
      console.log('[CronService] Stopping all cron jobs...');
      try {
         if (this.irrigationAfterImageCronTask) {
            this.irrigationAfterImageCronTask.stop();
            this.irrigationAfterImageCronTask = null;
         }
         if (this.userSyncCronTask) {
            this.userSyncCronTask.stop();
            this.userSyncCronTask = null;
         }
         // Stop all landscaping section tasks
         this.landscapingSectionTasks.forEach((taskData, time) => {
            if (taskData.task) {
               taskData.task.stop();
            }
         });
         this.landscapingSectionTasks.clear();
         // Stop all irrigation section tasks
         this.irrigationSectionTasks.forEach((taskData, time) => {
            if (taskData.task) {
               taskData.task.stop();
            }
         });
         this.irrigationSectionTasks.clear();
         cron.getTasks().forEach((task) => {
            task.stop();
         });
         this.irrigationAfterImageRunning = false;
         this.userSyncRunning = false;
         console.log('[CronService] ✅ All cron jobs stopped');
      } catch (error: any) {
         console.error('[CronService] ❌ Error stopping cron jobs:', error.message);
      }
   }

   public static getCronStatus() {
      const tasks = cron.getTasks();
      const currentTime = new Date();

      const nextIrrigationAfterImageTime = new Date(currentTime);
      nextIrrigationAfterImageTime.setHours(6, 5, 0, 0);
      if (nextIrrigationAfterImageTime <= currentTime) {
         nextIrrigationAfterImageTime.setDate(nextIrrigationAfterImageTime.getDate() + 1);
      }
      
      const nextUserSyncTime = new Date(currentTime);
      nextUserSyncTime.setMinutes(Math.ceil(currentTime.getMinutes() / 30) * 30, 0, 0);
      if (nextUserSyncTime <= currentTime) {
         nextUserSyncTime.setHours(nextUserSyncTime.getHours() + 1);
         nextUserSyncTime.setMinutes(0, 0, 0);
      }

      // Build landscaping section jobs with countdown
      const landscapingSectionJobs = Array.from(this.landscapingSectionTasks.entries()).map(([time, taskData]) => {
         const nextExec = taskData.nextExecution || this.getNextExecutionTime(time);
         const countdown = this.getCountdown(nextExec);
         return {
            name: `Landscaping Section - ${time}`,
            schedule: `${time} daily`,
            cronExpression: this.timeToCronExpression(time),
            timezone: this.TIMEZONE,
            isRunning: taskData.isRunning,
            isScheduled: !!taskData.task,
            nextExecution: nextExec.toISOString(),
            countdown: countdown,
            lastExecution: taskData.lastExecution ? taskData.lastExecution.toISOString() : null,
            workingTime: time
         };
      });

      // Build irrigation section jobs with countdown
      const irrigationSectionJobs = Array.from(this.irrigationSectionTasks.entries()).map(([time, taskData]) => {
         const nextExec = taskData.nextExecution || this.getNextExecutionTime(time);
         const countdown = this.getCountdown(nextExec);
         return {
            name: `Irrigation Section - ${time}`,
            schedule: `${time} daily`,
            cronExpression: this.timeToCronExpression(time),
            timezone: this.TIMEZONE,
            isRunning: taskData.isRunning,
            isScheduled: !!taskData.task,
            nextExecution: nextExec.toISOString(),
            countdown: countdown,
            lastExecution: taskData.lastExecution ? taskData.lastExecution.toISOString() : null,
            workingTime: time
         };
      });

      return {
         irrigationAfterImageRunning: this.irrigationAfterImageRunning,
         userSyncRunning: this.userSyncRunning,
         activeTasks: Object.keys(tasks).length,
         tasks: Object.keys(tasks),
         irrigationAfterImageTaskActive: !!this.irrigationAfterImageCronTask,
         userSyncTaskActive: !!this.userSyncCronTask,
         landscapingSectionTasksCount: this.landscapingSectionTasks.size,
         irrigationSectionTasksCount: this.irrigationSectionTasks.size,
         timezone: this.TIMEZONE,
         currentTime: {
            utc: currentTime.toISOString(),
            local: currentTime.toLocaleString(),
            timezoneOffset: currentTime.getTimezoneOffset()
         },
         nextExecutions: {
            irrigationAfterImageUpdate: nextIrrigationAfterImageTime.toLocaleString(),
            userSync: nextUserSyncTime.toLocaleString()
         },
         scheduledJobs: [
            {     
               name: 'Irrigation After-Image Update',
               schedule: '06:05 AM daily',
               cronExpression: '5 6 * * *',
               timezone: this.TIMEZONE,
               isRunning: this.irrigationAfterImageRunning,
               isScheduled: !!this.irrigationAfterImageCronTask,
               nextExecution: nextIrrigationAfterImageTime.toISOString(),
               countdown: this.getCountdown(nextIrrigationAfterImageTime)
            },
            {
               name: 'User Sync',
               schedule: 'Every 30 minutes',
               cronExpression: '*/30 * * * *',
               timezone: this.TIMEZONE,
               isRunning: this.userSyncRunning,
               isScheduled: !!this.userSyncCronTask,
               nextExecution: nextUserSyncTime.toISOString(),
               countdown: this.getCountdown(nextUserSyncTime)
            },
            ...landscapingSectionJobs,
            ...irrigationSectionJobs
         ]
      };
   }

   public static async testCronJobs() {
      console.log('[CronService] Testing cron jobs manually...');
      console.log('[CronService] Current status:', this.getCronStatus());
      
      try {
         console.log('[CronService] Testing grass monitoring...');
         const grassResult = await LandscapingService.monitorParkCamerasService();
         console.log('[CronService] Grass monitoring test result:', grassResult);
         
         console.log('[CronService] Testing irrigation monitoring...');
         const irrigationResult = await IrrigationsService.monitorIrrigationZones();
         console.log('[CronService] Irrigation monitoring test result:', irrigationResult);
         
         console.log('[CronService] Testing irrigation after-image update...');
         const irrigationAfterImageResult = await IrrigationsService.updateIrrigationZonesAfterImage();
         console.log('[CronService] Irrigation after-image update test result:', irrigationAfterImageResult);
         
         console.log('[CronService] Testing user sync...');
         const userSyncResult: any = await UserService.fetchAndStoreEmployeeListingService();
         console.log('[CronService] User sync test result:', userSyncResult);
         
         return { success: true, grassResult, irrigationResult, irrigationAfterImageResult, userSyncResult };
      } catch (error: any) {
         console.error('[CronService] Manual test failed:', error.message);
         return { success: false, error: error.message };
      }
   }
}

export default CronService;
