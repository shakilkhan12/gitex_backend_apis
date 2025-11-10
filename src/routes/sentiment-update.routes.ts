import { Router } from 'express'
import SentimentUpdateController from '@/controllers/sentiment-update.controller'

const sentimentUpdateRouter = Router()

/**
 * @swagger
 * /sentiment-update/parks:
 *   post:
 *     summary: Update sentiment analysis for parks
 *     tags: [Sentiment Update]
 *     description: Process all parks sentiment analysis records with images starting with '/uploads' and update their check_in_sentiment and check_out_sentiment fields
 *     responses:
 *       200:
 *         description: Parks sentiment analysis updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Processed 10 parks sentiment analysis records. Updated 8 check-in sentiments and 7 check-out sentiments."
 *                 results:
 *                   type: object
 *                   properties:
 *                     totalRecords:
 *                       type: number
 *                       example: 10
 *                     processedRecords:
 *                       type: number
 *                       example: 10
 *                     updatedCheckIn:
 *                       type: number
 *                       example: 8
 *                     updatedCheckOut:
 *                       type: number
 *                       example: 7
 *                     errors:
 *                       type: number
 *                       example: 0
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                           checkInUpdated:
 *                             type: boolean
 *                           checkOutUpdated:
 *                             type: boolean
 *                           checkInSentiment:
 *                             type: string
 *                           checkOutSentiment:
 *                             type: string
 *                           errors:
 *                             type: array
 *                             items:
 *                               type: string
 *       500:
 *         description: Internal server error
 */
sentimentUpdateRouter.post('/parks', SentimentUpdateController.updateParksSentiment)

/**
 * @swagger
 * /sentiment-update/offices:
 *   post:
 *     summary: Update sentiment analysis for offices
 *     tags: [Sentiment Update]
 *     description: Process all offices sentiment analysis records with images starting with '/uploads' and update their check_in_sentiment and check_out_sentiment fields
 *     responses:
 *       200:
 *         description: Offices sentiment analysis updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Processed 15 offices sentiment analysis records. Updated 12 check-in sentiments and 11 check-out sentiments."
 *                 results:
 *                   type: object
 *                   properties:
 *                     totalRecords:
 *                       type: number
 *                       example: 15
 *                     processedRecords:
 *                       type: number
 *                       example: 15
 *                     updatedCheckIn:
 *                       type: number
 *                       example: 12
 *                     updatedCheckOut:
 *                       type: number
 *                       example: 11
 *                     errors:
 *                       type: number
 *                       example: 0
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                           checkInUpdated:
 *                             type: boolean
 *                           checkOutUpdated:
 *                             type: boolean
 *                           checkInSentiment:
 *                             type: string
 *                           checkOutSentiment:
 *                             type: string
 *                           errors:
 *                             type: array
 *                             items:
 *                               type: string
 *       500:
 *         description: Internal server error
 */
sentimentUpdateRouter.post('/offices', SentimentUpdateController.updateOfficesSentiment)

/**
 * @swagger
 * /sentiment-update/all:
 *   post:
 *     summary: Update sentiment analysis for both parks and offices
 *     tags: [Sentiment Update]
 *     description: Process all parks and offices sentiment analysis records with images starting with '/uploads' and update their sentiment fields
 *     responses:
 *       200:
 *         description: All sentiment analysis updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sentiment analysis update completed for both parks and offices"
 *                 parks:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     results:
 *                       type: object
 *                 offices:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     results:
 *                       type: object
 *       500:
 *         description: Internal server error
 */
sentimentUpdateRouter.post('/all', SentimentUpdateController.updateAllSentiment)

export default sentimentUpdateRouter

