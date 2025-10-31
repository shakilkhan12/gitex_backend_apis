import OptimizedComponentApisController from "@/controllers/optimized-component-apis.controller";
import { Router } from "express";

const optimizedComponentApisRouter = Router();

// Welcome Card API - Only attendance and violation data
optimizedComponentApisRouter.get('/welcome-card', OptimizedComponentApisController.getWelcomeCardData);

// Gender Count Card API - Only footfall visitor data
optimizedComponentApisRouter.get('/gender-count', OptimizedComponentApisController.getGenderCountData);

// Website Analytics API - Only sentiment data
optimizedComponentApisRouter.get('/website-analytics', OptimizedComponentApisController.getWebsiteAnalyticsData);

// Earning Reports API - Only footfall summary data
optimizedComponentApisRouter.get('/earning-reports', OptimizedComponentApisController.getEarningReportsData);

// Notifications Card API - Only violation summary data
optimizedComponentApisRouter.get('/notifications', OptimizedComponentApisController.getNotificationsData);

// Park Live Stats API - Only zone usage data
optimizedComponentApisRouter.get('/park-live-stats', OptimizedComponentApisController.getParkLiveStatsData);

// Controller Usage API - Only zone usage data
optimizedComponentApisRouter.get('/zone-usage', OptimizedComponentApisController.getZoneUsageData);

// Daily Logs Card API - Only sentiment analysis data
optimizedComponentApisRouter.get('/daily-logs', OptimizedComponentApisController.getDailyLogsData);

// Violation Summary API - Only violation summary data
optimizedComponentApisRouter.get('/violation-summary', OptimizedComponentApisController.getViolationSummaryData);

// Littering Frequency API - Only litter detection data
optimizedComponentApisRouter.get('/littering-frequency', OptimizedComponentApisController.getLitteringFrequencyData);

// Irrigation Log API - Only irrigation data
optimizedComponentApisRouter.get('/irrigation-log', OptimizedComponentApisController.getIrrigationLogData);

// Plant Disease API - Only plant disease data
optimizedComponentApisRouter.get('/plant-disease', OptimizedComponentApisController.getPlantDiseaseData);

export default optimizedComponentApisRouter;
