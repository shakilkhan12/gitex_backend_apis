import { AccessSecretController } from "@/controllers";
import { Router } from "express";

const accessSecretRouter = Router();

/**
 * @swagger
 * /access-secret/update:
 *   post:
 *     summary: Update access secret
 *     tags: [Access Secret]
 *     description: Update the access secret from the third-party API
 *     responses:
 *       200:
 *         description: Access secret updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Id:
 *                   type: integer
 *                   example: 1
 *                 value:
 *                   type: string
 *                   example: "secret_key_value"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 */
accessSecretRouter.post('/update', AccessSecretController.updateAccessSecret)

/**
 * @swagger
 * /access-secret/start-cron:
 *   post:
 *     summary: Start cron job
 *     tags: [Access Secret]
 *     description: Start the cron job for automatically updating access secrets
 *     responses:
 *       200:
 *         description: Cron job started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cron job started successfully"
 *       500:
 *         description: Internal server error
 */
accessSecretRouter.post('/start-cron', AccessSecretController.startCronJob)

export default accessSecretRouter;
