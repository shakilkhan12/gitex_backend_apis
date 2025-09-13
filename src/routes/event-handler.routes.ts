import { EventHandlerController } from "@/controllers";
import { Router } from "express";

const eventHandlerRouter = Router();

/**
 * @swagger
 * /event-handler/handle:
 *   post:
 *     summary: Handle incoming events
 *     tags: [Event Handler]
 *     description: Process and handle various types of events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Event data to be processed
 *             example:
 *               eventType: "user_action"
 *               timestamp: "2024-01-15T10:30:00Z"
 *               data:
 *                 userId: "12345"
 *                 action: "login"
 *                 metadata:
 *                   ip: "192.168.1.100"
 *                   userAgent: "Mozilla/5.0..."
 *     responses:
 *       200:
 *         description: Event processed successfully
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
 *                   example: "Event processed successfully"
 *                 data:
 *                   type: object
 *                   description: Processed event data
 *                   example:
 *                     eventType: "user_action"
 *                     timestamp: "2024-01-15T10:30:00Z"
 *                     data:
 *                       userId: "12345"
 *                       action: "login"
 *       400:
 *         description: Bad request - missing or invalid event data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Event data is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to process event"
 *                 status:
 *                   type: integer
 *                   example: 500
 */
eventHandlerRouter.post('/handle', EventHandlerController.handleEvent)

export default eventHandlerRouter;
