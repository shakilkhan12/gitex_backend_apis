import cron from 'node-cron';
import LandscapingService from './landscaping.service';
import { IrrigationsService } from './irrigations.service';

class CronService {
   private static isRunning = false;
   private static irrigationRunning = false;

   public static initializeCronJobs() {
      // Morning grass monitoring at 07:30 AM every day
      const grassCron = cron.schedule('30 7 * * *', async () => {
         console.log('[CronService] 🕐 Grass monitoring cron triggered at 07:30 AM');
         if (this.isRunning) {
            console.log('[CronService] Morning grass monitoring already running, skipping...');
            return;
         }

         this.isRunning = true;
         console.log('[CronService] Starting morning grass monitoring at 07:30 AM...');

         try {
            const result = await LandscapingService.monitorParkCamerasService();
            console.log('[CronService] Morning grass monitoring completed successfully:', {
               success: result.success,
               message: result.message,
               processedCameras: result.results?.length || 0
            });
         } catch (error: any) {
            console.error('[CronService] Morning grass monitoring failed:', error.message);
         } finally {
            this.isRunning = false;
         }
      });

      // Morning irrigation monitoring at 08:00 AM every day
      const irrigationCron = cron.schedule('0 8 * * *', async () => {
         console.log('[CronService] 🕐 Irrigation monitoring cron triggered at 08:00 AM');
         if (this.irrigationRunning) {
            console.log('[CronService] Morning irrigation monitoring already running, skipping...');
            return;
         }

         this.irrigationRunning = true;
         console.log('[CronService] Starting morning irrigation monitoring at 08:00 AM...');

         try {
            const result = await IrrigationsService.monitorIrrigationZones();
            console.log('[CronService] Morning irrigation monitoring completed successfully:', {
               success: result.success,
               message: result.message,
               processedZones: result.results?.length || 0
            });
         } catch (error: any) {
            console.error('[CronService] Morning irrigation monitoring failed:', error.message);
         } finally {
            this.irrigationRunning = false;
         }
      });

      console.log('[CronService] Cron jobs initialized successfully');
      console.log('[CronService] Morning grass monitoring scheduled for 07:30 AM daily');
      console.log('[CronService] Morning irrigation monitoring scheduled for 08:00 AM daily');
      console.log('[CronService] Grass cron task created:', grassCron ? 'YES' : 'NO');
      console.log('[CronService] Irrigation cron task created:', irrigationCron ? 'YES' : 'NO');
      
      // Test cron expression validity
      const testTime = new Date();
      testTime.setHours(7, 30, 0, 0);
      console.log('[CronService] Next expected execution time (Local):', testTime.toLocaleString());
   }

   public static stopCronJobs() {
      console.log('[CronService] Stopping all cron jobs...');
      cron.getTasks().forEach((task) => {
         task.stop();
      });
      console.log('[CronService] All cron jobs stopped');
   }

   public static getCronStatus() {
      const tasks = cron.getTasks();
      const currentTime = new Date();
      
      return {
         isRunning: this.isRunning,
         irrigationRunning: this.irrigationRunning,
         activeTasks: Object.keys(tasks).length,
         tasks: Object.keys(tasks),
         currentTime: {
            utc: currentTime.toISOString(),
            local: currentTime.toLocaleString()
         },
         scheduledJobs: [
            {
               name: 'Morning Grass Monitoring',
               schedule: '07:30 AM daily',
               cronExpression: '30 7 * * *',
               timezone: 'Local',
               isRunning: this.isRunning
            },
            {
               name: 'Morning Irrigation Monitoring', 
               schedule: '08:00 AM daily',
               cronExpression: '0 8 * * *',
               timezone: 'Local',
               isRunning: this.irrigationRunning
            }
         ]
      };
   }

   // Method to manually test cron jobs
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
         
         return { success: true, grassResult, irrigationResult };
      } catch (error: any) {
         console.error('[CronService] Manual test failed:', error.message);
         return { success: false, error: error.message };
      }
   }
}

export default CronService;
