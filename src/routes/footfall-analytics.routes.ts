import { Router } from 'express';
import FootfallAnalyticsController from '@/controllers/footfall-analytics.controller';

const router = Router();

router.post('/footfall-analytics', FootfallAnalyticsController.getFootfallAnalytics);

export default router;
