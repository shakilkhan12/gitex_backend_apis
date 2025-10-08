import EventBufferController from "@/controllers/event-buffer.controller";
import { Router } from "express";

const eventBufferRouter = Router();

/**
 * @swagger
 * /api/event-buffer/stats:
 *   get:
 *     summary: Get event buffer statistics
 *     description: Returns statistics about the event buffer including total sources, total events, and details per source
 *     tags: [Event Buffer]
 *     responses:
 *       200:
 *         description: Buffer statistics retrieved successfully
 *       500:
 *         description: Server error
 */
eventBufferRouter.get("/stats", EventBufferController.getBufferStats);

/**
 * @swagger
 * /api/event-buffer/event/{srcIndex}:
 *   get:
 *     summary: Get latest event for a specific srcIndex
 *     description: Retrieves the most recent event for the specified camera/source index
 *     tags: [Event Buffer]
 *     parameters:
 *       - in: path
 *         name: srcIndex
 *         required: true
 *         schema:
 *           type: string
 *         description: The source/camera index to query
 *       - in: query
 *         name: maxAge
 *         schema:
 *           type: integer
 *         description: Maximum age of event in seconds (default 3600)
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *       404:
 *         description: No recent event found
 *       400:
 *         description: Invalid request
 */
eventBufferRouter.get("/event/:srcIndex", EventBufferController.getEventBySrcIndex);

/**
 * @swagger
 * /api/event-buffer/events/{srcIndex}:
 *   get:
 *     summary: Get all recent events for a specific srcIndex
 *     description: Retrieves all recent events for the specified camera/source index
 *     tags: [Event Buffer]
 *     parameters:
 *       - in: path
 *         name: srcIndex
 *         required: true
 *         schema:
 *           type: string
 *         description: The source/camera index to query
 *       - in: query
 *         name: maxAge
 *         schema:
 *           type: integer
 *         description: Maximum age of events in seconds (default 3600)
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *       400:
 *         description: Invalid request
 */
eventBufferRouter.get("/events/:srcIndex", EventBufferController.getAllEventsBySrcIndex);

/**
 * @swagger
 * /api/event-buffer/clear:
 *   post:
 *     summary: Clear the event buffer
 *     description: Clears all events from the buffer (for testing/debugging purposes)
 *     tags: [Event Buffer]
 *     responses:
 *       200:
 *         description: Buffer cleared successfully
 *       500:
 *         description: Server error
 */
eventBufferRouter.post("/clear", EventBufferController.clearBuffer);

export default eventBufferRouter;

