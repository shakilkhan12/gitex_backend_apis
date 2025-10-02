import { Router } from "express";
import IrrigationsController from "@/controllers/irrigations.controller";

const irrigationsRouter = Router();

/**
 * @swagger
 * /irrigations/monitor-zones:
 *   post:
 *     summary: Monitor irrigation zones and trigger watering if needed
 *     tags: [Irrigations]
 *     responses:
 *       200:
 *         description: Irrigation zone monitoring completed successfully
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
 *                   example: "Irrigation zone monitoring completed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           cameraIndex:
 *                             type: string
 *                             example: "75"
 *                           cameraName:
 *                             type: string
 *                             example: "INSIDE-2"
 *                           zones:
 *                             type: array
 *                             items:
 *                               type: number
 *                             example: [8815034]
 *                           success:
 *                             type: boolean
 *                           wateringTriggered:
 *                             type: boolean
 *                           wateringResult:
 *                             type: object
 *                           cloudinaryUrl:
 *                             type: string
 *                           reason:
 *                             type: string
 *                           error:
 *                             type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to monitor irrigation zones"
 *                 status:
 *                   type: integer
 *                   example: 400
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *                 status:
 *                   type: integer
 *                   example: 500
 */
irrigationsRouter.post('/monitor-zones', IrrigationsController.monitorIrrigationZones)

export default irrigationsRouter;
