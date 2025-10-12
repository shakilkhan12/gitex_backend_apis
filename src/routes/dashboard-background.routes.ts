import { Request, Response, NextFunction } from 'express'
import DashboardService from '@/services/dashboard.service'

const router = require('express').Router()

/**
 * @swagger
 * /dashboard/background:
 *   get:
 *     summary: Get background dashboard data
 *     tags: [Dashboard]
 *     description: Get heavy dashboard data that loads in the background
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for data filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for data filtering
 *     responses:
 *       200:
 *         description: Background dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 footfallVisitors:
 *                   type: object
 *                 footfallSummary:
 *                   type: object
 *                 zoneUsageSummary:
 *                   type: object
 *                 litterDetectionSummary:
 *                   type: object
 *                 sentimentAnalysisToday:
 *                   type: array
 *                 violationSummary:
 *                   type: object
 *                 landscapingData:
 *                   type: array
 *                 plantDiseaseData:
 *                   type: array
 *       500:
 *         description: Internal server error
 */
router.get('/background', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query
    
    // For now, return the full dashboard data as background data
    // In the future, this could be optimized to only return heavy data
    const backgroundData = await DashboardService.getDashboardData(
      startDate as string,
      endDate as string
    )
    
    // Extract only the heavy data parts
    const { 
      footfallVisitors, 
      footfallSummary, 
      zoneUsageSummary, 
      litterDetectionSummary, 
      sentimentAnalysisToday, 
      violationSummary, 
      landscapingData, 
      plantDiseaseData 
    } = backgroundData
    
    res.status(200).json({
      footfallVisitors,
      footfallSummary,
      zoneUsageSummary,
      litterDetectionSummary,
      sentimentAnalysisToday,
      violationSummary,
      landscapingData,
      plantDiseaseData,
    })
  } catch (error) {
    next(error)
  }
})

export default router
