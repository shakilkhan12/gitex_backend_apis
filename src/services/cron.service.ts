import cron from 'node-cron';
import LandscapingService from './landscaping.service';
import { IrrigationsService } from './irrigations.service';
import UserService from './user.service';

class CronService {
   private static isRunning = false;
   private static irrigationRunning = false;
   private static userFetchRunning = false;
   private static grassCronTask: any = null;
   private static irrigationCronTask: any = null;
   private static userFetchCronTask: any = null;
   private static readonly JOB_TIMEOUT = 60 * 60 * 1000; 
   
   private static readonly TIMEZONE = process.env.TZ || 'Asia/Dubai';

   public static initializeCronJobs() {
      this.stopCronJobs();
      
      this.isRunning = false;
      this.irrigationRunning = false;
      this.userFetchRunning = false;

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
         console.log('[CronService] Starting morning grass monitoring...');

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

      this.userFetchCronTask = cron.schedule('0 * * * *', async () => {
         const triggerTime = new Date();
         console.log(`[CronService] 🕐 User fetch cron triggered at ${triggerTime.toLocaleString()}`);
         
         if (this.userFetchRunning) {
            console.warn('[CronService] ⚠️ User fetch already running, skipping this execution');
            return;
         }

         this.userFetchRunning = true;
         const startTime = Date.now();
         console.log('[CronService] Starting user fetch...');

         const timeoutId = setTimeout(() => {
            if (this.userFetchRunning) {
               console.error('[CronService] ⚠️ User fetch job timed out after 1 hour, forcing reset');
               this.userFetchRunning = false;
            }
         }, this.JOB_TIMEOUT);

         try {
            const result = await UserService.fetchAndStoreEmployeeListingService();
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log('[CronService] ✅ User fetch completed successfully:', {
               message: result.message,
               summary: result.summary,
               duration: `${duration}s`
            });
         } catch (error: any) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.error('[CronService] ❌ User fetch failed:', {
               error: error.message,
               stack: error.stack,
               duration: `${duration}s`
            });
         } finally {
            clearTimeout(timeoutId);
            this.userFetchRunning = false;
            console.log('[CronService] User fetch job finished, flag reset');
         }
      }, {
         timezone: this.TIMEZONE
      } as any);

      const tasks = cron.getTasks();
      const isGrassTaskActive = this.grassCronTask && Object.keys(tasks).length > 0;
      const isIrrigationTaskActive = this.irrigationCronTask && Object.keys(tasks).length > 0;
      const isUserFetchTaskActive = this.userFetchCronTask && Object.keys(tasks).length > 0;
      
      console.log('[CronService] ✅ Cron jobs initialized successfully');
      console.log('[CronService] Schedule:');
      console.log('[CronService]   - Morning grass monitoring: 07:30 AM daily');
      console.log('[CronService]   - Morning irrigation monitoring: 08:00 AM daily');
      console.log('[CronService]   - User fetch: Every hour');
      console.log('[CronService] Status:');
      console.log('[CronService]   - Grass cron task active:', isGrassTaskActive ? '✅ YES' : '❌ NO');
      console.log('[CronService]   - Irrigation cron task active:', isIrrigationTaskActive ? '✅ YES' : '❌ NO');
      console.log('[CronService]   - User fetch cron task active:', isUserFetchTaskActive ? '✅ YES' : '❌ NO');
      console.log('[CronService]   - Total active tasks:', Object.keys(tasks).length);
      console.log('[CronService]   - Timezone:', this.TIMEZONE);
      
      const now = new Date();
      const nextGrassTime = new Date(now);
      nextGrassTime.setHours(7, 30, 0, 0);
      if (nextGrassTime <= now) {
         nextGrassTime.setDate(nextGrassTime.getDate() + 1);
      }
      
      const nextIrrigationTime = new Date(now);
      nextIrrigationTime.setHours(8, 0, 0, 0);
      if (nextIrrigationTime <= now) {
         nextIrrigationTime.setDate(nextIrrigationTime.getDate() + 1);
      }
      
      const nextUserFetchTime = new Date(now);
      nextUserFetchTime.setHours(now.getHours() + 1, 0, 0, 0);
      
      console.log('[CronService] Next executions:');
      console.log('[CronService]   - Grass monitoring:', nextGrassTime.toLocaleString());
      console.log('[CronService]   - Irrigation monitoring:', nextIrrigationTime.toLocaleString());
      console.log('[CronService]   - User fetch:', nextUserFetchTime.toLocaleString());
      
      if (!isGrassTaskActive || !isIrrigationTaskActive || !isUserFetchTaskActive) {
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
         if (this.userFetchCronTask) {
            this.userFetchCronTask.stop();
            this.userFetchCronTask = null;
         }
         cron.getTasks().forEach((task) => {
            task.stop();
         });
         this.isRunning = false;
         this.irrigationRunning = false;
         this.userFetchRunning = false;
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
      nextIrrigationTime.setHours(8, 0, 0, 0);
      if (nextIrrigationTime <= currentTime) {
         nextIrrigationTime.setDate(nextIrrigationTime.getDate() + 1);
      }
      
      const nextUserFetchTime = new Date(currentTime);
      nextUserFetchTime.setHours(currentTime.getHours() + 1, 0, 0, 0);
      
      return {
         isRunning: this.isRunning,
         irrigationRunning: this.irrigationRunning,
         userFetchRunning: this.userFetchRunning,
         activeTasks: Object.keys(tasks).length,
         tasks: Object.keys(tasks),
         grassTaskActive: !!this.grassCronTask,
         irrigationTaskActive: !!this.irrigationCronTask,
         userFetchTaskActive: !!this.userFetchCronTask,
         timezone: this.TIMEZONE,
         currentTime: {
            utc: currentTime.toISOString(),
            local: currentTime.toLocaleString(),
            timezoneOffset: currentTime.getTimezoneOffset()
         },
         nextExecutions: {
            grassMonitoring: nextGrassTime.toLocaleString(),
            irrigationMonitoring: nextIrrigationTime.toLocaleString(),
            userFetch: nextUserFetchTime.toLocaleString()
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
               schedule: '08:00 AM daily',
               cronExpression: '0 8 * * *',
               timezone: this.TIMEZONE,
               isRunning: this.irrigationRunning,
               isScheduled: !!this.irrigationCronTask,
               nextExecution: nextIrrigationTime.toISOString()
            },
            {
               name: 'User Fetch',
               schedule: 'Every hour',
               cronExpression: '0 * * * *',
               timezone: this.TIMEZONE,
               isRunning: this.userFetchRunning,
               isScheduled: !!this.userFetchCronTask,
               nextExecution: nextUserFetchTime.toISOString()
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
         
         console.log('[CronService] Testing user fetch...');
         const userFetchResult = await UserService.fetchAndStoreEmployeeListingService();
         console.log('[CronService] User fetch test result:', userFetchResult);
         
         return { success: true, grassResult, irrigationResult, userFetchResult };
      } catch (error: any) {
         console.error('[CronService] Manual test failed:', error.message);
         return { success: false, error: error.message };
      }
   }
}

export default CronService;
