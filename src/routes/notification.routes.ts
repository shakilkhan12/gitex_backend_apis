import { NotificationController } from "@/controllers";
import { Router } from "express";

const notificationRouter = Router();

/**
 * @swagger
 * /notification/create:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *                 example: "litter_detection"
 *               title:
 *                 type: string
 *                 example: "New Litter Detection"
 *               description:
 *                 type: string
 *                 example: "Litter detected at Central Park"
 *     responses:
 *       201:
 *         description: Notification created successfully
 */
notificationRouter.post('/create', NotificationController.createNotification);

/**
 * @swagger
 * /notification/get:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
notificationRouter.get('/get', NotificationController.getAllNotifications);

/**
 * @swagger
 * /notification/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
notificationRouter.get('/unread-count', NotificationController.getUnreadCount);

/**
 * @swagger
 * /notification/mark-read/{id}:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
notificationRouter.put('/mark-read/:id', NotificationController.markAsRead);

/**
 * @swagger
 * /notification/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
notificationRouter.put('/mark-all-read', NotificationController.markAllAsRead);

/**
 * @swagger
 * /notification/delete/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 */
notificationRouter.delete('/delete/:id', NotificationController.deleteNotification);

/**
 * @swagger
 * /notification/test:
 *   post:
 *     summary: Create a test/dummy notification (for testing sockets and real-time updates)
 *     tags: [Notifications]
 *     description: Creates a dummy notification with random or provided data and emits it via socket for testing
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [litter_detection, smoking_detection, intrusion_detection, behavior_alert]
 *                 example: "litter_detection"
 *               title:
 *                 type: string
 *                 example: "Test Notification"
 *               description:
 *                 type: string
 *                 example: "This is a test notification for socket testing"
 *     responses:
 *       201:
 *         description: Test notification created and emitted successfully
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
 *                   example: "Test notification created and emitted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     type:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     is_read:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 */
notificationRouter.post('/test', NotificationController.createTestNotification);

export default notificationRouter;

