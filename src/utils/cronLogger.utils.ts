import * as fs from 'fs';
import * as path from 'path';

export class CronLogger {
   private static logDir = path.join(process.cwd(), 'logs', 'cron');
   private static serviceName: string;
   private static logFilePath: string;

   /**
    * Initialize logger for a specific service
    * @param serviceName - Name of the service (e.g., 'landscaping', 'irrigation')
    */
   public static initialize(serviceName: string): void {
      this.serviceName = serviceName;
      
      // Ensure logs directory exists
      if (!fs.existsSync(this.logDir)) {
         fs.mkdirSync(this.logDir, { recursive: true });
      }

      // Create daily log file path
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const fileName = `${serviceName}_${dateStr}.txt`;
      this.logFilePath = path.join(this.logDir, fileName);
   }

   /**
    * Write a log entry to the daily log file
    * @param message - Log message to write
    * @param includeTimestamp - Whether to include timestamp (default: true)
    */
   public static log(message: string, includeTimestamp: boolean = true): void {
      try {
         const timestamp = includeTimestamp 
            ? new Date().toISOString() 
            : '';
         const logEntry = includeTimestamp 
            ? `[${timestamp}] ${message}\n`
            : `${message}\n`;

         // Append to log file
         fs.appendFileSync(this.logFilePath, logEntry, 'utf8');
      } catch (error: any) {
         // Fallback to console if file write fails
         console.error(`[CronLogger] Failed to write log: ${error.message}`);
         console.log(message);
      }
   }

   /**
    * Write a separator line for a new cron job run
    * @param workingTime - The working time for this cron job
    */
   public static startJobRun(workingTime: string): void {
      const separator = '='.repeat(80);
      const timestamp = new Date().toISOString();
      const header = `\n${separator}\n[${timestamp}] Starting ${this.serviceName} cron job - Working Time: ${workingTime}\n${separator}\n`;
      
      fs.appendFileSync(this.logFilePath, header, 'utf8');
   }

   /**
    * Write a summary at the end of a cron job run
    * @param summary - Summary object with job statistics
    */
   public static endJobRun(summary: {
      workingTime: string;
      totalSections: number;
      processed: number;
      successful: number;
      failed: number;
      duration: string;
      additionalInfo?: any;
   }): void {
      const separator = '-'.repeat(80);
      const timestamp = new Date().toISOString();
      const footer = `\n${separator}\n[${timestamp}] Completed ${this.serviceName} cron job - Working Time: ${summary.workingTime}\n`;
      const stats = `Summary:
   - Total sections: ${summary.totalSections}
   - Processed: ${summary.processed}
   - Successful: ${summary.successful}
   - Failed: ${summary.failed}
   - Duration: ${summary.duration}s\n`;
      
      let additionalInfo = '';
      if (summary.additionalInfo) {
         additionalInfo = `Additional Info:\n${JSON.stringify(summary.additionalInfo, null, 2)}\n`;
      }
      
      const endSeparator = '='.repeat(80);
      const fullFooter = `${footer}${stats}${additionalInfo}${endSeparator}\n\n`;
      
      fs.appendFileSync(this.logFilePath, fullFooter, 'utf8');
   }

   /**
    * Capture console.log output and redirect to file
    * This creates a wrapper that logs both to console and file
    */
   public static createLogFunction(originalLog: typeof console.log): typeof console.log {
      return (...args: any[]) => {
         // Call original console.log
         originalLog(...args);
         
         // Also write to file
         const message = args.map(arg => {
            if (typeof arg === 'object') {
               try {
                  return JSON.stringify(arg, null, 2);
               } catch {
                  return String(arg);
               }
            }
            return String(arg);
         }).join(' ');
         
         this.log(message, true);
      };
   }

   /**
    * Get the current log file path
    */
   public static getLogFilePath(): string {
      return this.logFilePath;
   }
}

