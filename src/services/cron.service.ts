import cron from 'node-cron';
import LandscapingService from './landscaping.service';
import { IrrigationsService } from './irrigations.service';

class CronService {
   private static isRunning = false;
   private static irrigationRunning = false;

   public static initializeCronJobs() {
      console.log('[CronService] Initializing cron jobs...');

      // Morning grass monitoring at 7:00 AM every day
      cron.schedule('0 7 * * *', async () => {
         if (this.isRunning) {
            console.log('[CronService] Morning grass monitoring already running, skipping...');
            return;
         }

         this.isRunning = true;
         console.log('[CronService] Starting morning grass monitoring at 7:00 AM...');

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
      }, {
         timezone: "Asia/Dubai" 
      });

      // Morning irrigation monitoring at 8:00 AM every day
      cron.schedule('0 8 * * *', async () => {
         if (this.irrigationRunning) {
            console.log('[CronService] Morning irrigation monitoring already running, skipping...');
            return;
         }

         this.irrigationRunning = true;
         console.log('[CronService] Starting morning irrigation monitoring at 8:00 AM...');

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
      }, {
         timezone: "Asia/Dubai" 
      });

      console.log('[CronService] Cron jobs initialized successfully');
      console.log('[CronService] Morning grass monitoring scheduled for 7:00 AM daily');
      console.log('[CronService] Morning irrigation monitoring scheduled for 8:00 AM daily');
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
      return {
         isRunning: this.isRunning,
         irrigationRunning: this.irrigationRunning,
         activeTasks: Object.keys(tasks).length,
         tasks: Object.keys(tasks),
         scheduledJobs: [
            {
               name: 'Morning Grass Monitoring',
               schedule: '7:00 AM daily',
               timezone: 'Asia/Dubai',
               isRunning: this.isRunning
            },
            {
               name: 'Morning Irrigation Monitoring', 
               schedule: '8:00 AM daily',
               timezone: 'Asia/Dubai',
               isRunning: this.irrigationRunning
            }
         ]
      };
   }
}

export default CronService;
