import cron from 'node-cron';
import LandscapingService from './landscaping.service';
import { IrrigationsService } from './irrigations.service';
import UserService from './user.service';

class CronService {
   private static isRunning = false;
   private static irrigationRunning = false;
   private static irrigationAfterImageRunning = false;
   private static userSyncRunning = false;
   private static grassCronTask: any = null;
   private static irrigationCronTask: any = null;
   private static irrigationAfterImageCronTask: any = null;
   private static userSyncCronTask: any = null;
   private static readonly JOB_TIMEOUT = 60 * 60 * 1000; 
   
   private static readonly TIMEZONE = process.env.TZ || 'Asia/Dubai';

   public static initializeCronJobs() {
      this.stopCronJobs();
      
      this.isRunning = false;
      this.irrigationRunning = false;
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


      this.grassCronTask = cron.schedule('30 7 * * *', async () => {
         const triggerTime = new Date();
         console.log(`[CronService] 🕐 Grass monitoring cron triggered at ${triggerTime.toLocaleString()}`);
         
         if (this.isRunning) {
            console.warn('[CronService] ⚠️ Morning grass monitoring already running, skipping this execution');
            return;
         }

         this.isRunning = true;
         const startTime = Date.now();

         const timeoutId = setTimeout(() => {
            if (this.isRunning) {
               console.error('[CronService] ⚠️ Grass monitoring job timed out after 1 hour, forcing reset');
               this.isRunning = false;
            }
         }, this.JOB_TIMEOUT);

         try {
            const result = await LandscapingService.monitorParkCamerasService();
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log('[CronService] ✅ Morning grass monitoring completed successfully:', {
               success: result.success,
               message: result.message,
               processedCameras: result.results?.length || 0,
               duration: `${duration}s`
            });
         } catch (error: any) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.error('[CronService] ❌ Morning grass monitoring failed:', {
               error: error.message,
               stack: error.stack,
               duration: `${duration}s`
            });
         } finally {
            clearTimeout(timeoutId);
            this.isRunning = false;
            console.log('[CronService] Grass monitoring job finished, flag reset');
         }
      }, {
         timezone: this.TIMEZONE
      } as any);

      this.irrigationCronTask = cron.schedule('30 5 * * *', async () => {
         const triggerTime = new Date();
         console.log(`[CronService] 🕐 Irrigation monitoring cron triggered at ${triggerTime.toLocaleString()}`);
         
         if (this.irrigationRunning) {
            console.warn('[CronService] ⚠️ Morning irrigation monitoring already running, skipping this execution');
            return;
         }

         this.irrigationRunning = true;
         const startTime = Date.now();
         console.log('[CronService] Starting morning irrigation monitoring...');

         const timeoutId = setTimeout(() => {
            if (this.irrigationRunning) {
               console.error('[CronService] ⚠️ Irrigation monitoring job timed out after 1 hour, forcing reset');
               this.irrigationRunning = false;
            }
         }, this.JOB_TIMEOUT);

         try {
            const result = await IrrigationsService.monitorIrrigationZones();
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log('[CronService] ✅ Morning irrigation monitoring completed successfully:', {
               success: result.success,
               message: result.message,
               processedZones: result.results?.length || 0,
               duration: `${duration}s`
            });
         } catch (error: any) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.error('[CronService] ❌ Morning irrigation monitoring failed:', {
               error: error.message,
               stack: error.stack,
               duration: `${duration}s`
            });
         } finally {
            clearTimeout(timeoutId);
            this.irrigationRunning = false;
            console.log('[CronService] Irrigation monitoring job finished, flag reset');
         }
      }, {
         timezone: this.TIMEZONE
      } as any);

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
            const result = await UserService.fetchAndStoreEmployeeListingService();
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

      const tasks = cron.getTasks();
      const isGrassTaskActive = this.grassCronTask && Object.keys(tasks).length > 0;
      const isIrrigationTaskActive = this.irrigationCronTask && Object.keys(tasks).length > 0;
      const isIrrigationAfterImageTaskActive = this.irrigationAfterImageCronTask && Object.keys(tasks).length > 0;
      const isUserSyncTaskActive = this.userSyncCronTask && Object.keys(tasks).length > 0;
      
      console.log('[CronService] ✅ Cron jobs initialized successfully');
      console.log('[CronService] Schedule:');
      console.log('[CronService]   - Morning grass monitoring: 07:30 AM daily');
      console.log('[CronService]   - Morning irrigation monitoring: 05:30 AM daily');
      console.log('[CronService]   - Evening irrigation after-image update: 06:05 AM daily');
      console.log('[CronService]   - User sync: Every 30 minutes');
      console.log('[CronService] Status:');
      console.log('[CronService]   - Grass cron task active:', isGrassTaskActive ? '✅ YES' : '❌ NO');
      console.log('[CronService]   - Irrigation cron task active:', isIrrigationTaskActive ? '✅ YES' : '❌ NO');
      console.log('[CronService]   - Irrigation after-image cron task active:', isIrrigationAfterImageTaskActive ? '✅ YES' : '❌ NO');
      console.log('[CronService]   - User sync cron task active:', isUserSyncTaskActive ? '✅ YES' : '❌ NO');
      console.log('[CronService]   - Total active tasks:', Object.keys(tasks).length);
      console.log('[CronService]   - Timezone:', this.TIMEZONE);
      
      const now = new Date();
      const nextGrassTime = new Date(now);
      nextGrassTime.setHours(7, 30, 0, 0);
      if (nextGrassTime <= now) {
         nextGrassTime.setDate(nextGrassTime.getDate() + 1);
      }
      
      const nextIrrigationTime = new Date(now);
      nextIrrigationTime.setHours(5, 30, 0, 0);
      if (nextIrrigationTime <= now) {
         nextIrrigationTime.setDate(nextIrrigationTime.getDate() + 1);
      }

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
      console.log('[CronService]   - Grass monitoring:', nextGrassTime.toLocaleString());
      console.log('[CronService]   - Irrigation monitoring:', nextIrrigationTime.toLocaleString());
      console.log('[CronService]   - Irrigation after-image update:', nextIrrigationAfterImageTime.toLocaleString());
      console.log('[CronService]   - User sync:', nextUserSyncTime.toLocaleString());
      
      if (!isGrassTaskActive || !isIrrigationTaskActive || !isIrrigationAfterImageTaskActive || !isUserSyncTaskActive) {
         console.warn('[CronService] ⚠️ WARNING: Some cron tasks may not be active. Server restart may be required.');
      }
   }

   public static stopCronJobs() {
      console.log('[CronService] Stopping all cron jobs...');
      try {
         if (this.grassCronTask) {
            this.grassCronTask.stop();
            this.grassCronTask = null;
         }
         if (this.irrigationCronTask) {
            this.irrigationCronTask.stop();
            this.irrigationCronTask = null;
         }
         if (this.irrigationAfterImageCronTask) {
            this.irrigationAfterImageCronTask.stop();
            this.irrigationAfterImageCronTask = null;
         }
         if (this.userSyncCronTask) {
            this.userSyncCronTask.stop();
            this.userSyncCronTask = null;
         }
         cron.getTasks().forEach((task) => {
            task.stop();
         });
         this.isRunning = false;
         this.irrigationRunning = false;
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
      
      const nextGrassTime = new Date(currentTime);
      nextGrassTime.setHours(7, 30, 0, 0);
      if (nextGrassTime <= currentTime) {
         nextGrassTime.setDate(nextGrassTime.getDate() + 1);
      }
      
      const nextIrrigationTime = new Date(currentTime);
      nextIrrigationTime.setHours(5, 30, 0, 0);
      if (nextIrrigationTime <= currentTime) {
         nextIrrigationTime.setDate(nextIrrigationTime.getDate() + 1);
      }

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

      return {
         isRunning: this.isRunning,
         irrigationRunning: this.irrigationRunning,
         irrigationAfterImageRunning: this.irrigationAfterImageRunning,
         userSyncRunning: this.userSyncRunning,
         activeTasks: Object.keys(tasks).length,
         tasks: Object.keys(tasks),
         grassTaskActive: !!this.grassCronTask,
         irrigationTaskActive: !!this.irrigationCronTask,
         irrigationAfterImageTaskActive: !!this.irrigationAfterImageCronTask,
         userSyncTaskActive: !!this.userSyncCronTask,
         timezone: this.TIMEZONE,
         currentTime: {
            utc: currentTime.toISOString(),
            local: currentTime.toLocaleString(),
            timezoneOffset: currentTime.getTimezoneOffset()
         },
         nextExecutions: {
            grassMonitoring: nextGrassTime.toLocaleString(),
            irrigationMonitoring: nextIrrigationTime.toLocaleString(),
            irrigationAfterImageUpdate: nextIrrigationAfterImageTime.toLocaleString(),
            userSync: nextUserSyncTime.toLocaleString()
         },
         scheduledJobs: [
            {
               name: 'Morning Grass Monitoring',
               schedule: '07:30 AM daily',
               cronExpression: '30 7 * * *',
               timezone: this.TIMEZONE,
               isRunning: this.isRunning,
               isScheduled: !!this.grassCronTask,
               nextExecution: nextGrassTime.toISOString()
            },
            {
               name: 'Morning Irrigation Monitoring', 
               schedule: '05:30 AM daily',
               cronExpression: '30 5 * * *',
               timezone: this.TIMEZONE,
               isRunning: this.irrigationRunning,
               isScheduled: !!this.irrigationCronTask,
               nextExecution: nextIrrigationTime.toISOString()
            },
            {
               name: 'Evening Irrigation After-Image Update',
               schedule: '06:05 AM daily',
               cronExpression: '5 6 * * *',
               timezone: this.TIMEZONE,
               isRunning: this.irrigationAfterImageRunning,
               isScheduled: !!this.irrigationAfterImageCronTask,
               nextExecution: nextIrrigationAfterImageTime.toISOString()
            },
            {
               name: 'User Sync',
               schedule: 'Every 30 minutes',
               cronExpression: '*/30 * * * *',
               timezone: this.TIMEZONE,
               isRunning: this.userSyncRunning,
               isScheduled: !!this.userSyncCronTask,
               nextExecution: nextUserSyncTime.toISOString()
            }
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
         const userSyncResult = await UserService.fetchAndStoreEmployeeListingService();
         console.log('[CronService] User sync test result:', userSyncResult);
         
         return { success: true, grassResult, irrigationResult, irrigationAfterImageResult, userSyncResult };
      } catch (error: any) {
         console.error('[CronService] Manual test failed:', error.message);
         return { success: false, error: error.message };
      }
   }
}

export default CronService;
