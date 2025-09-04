import { BehaviorAlertsController } from "@/controllers";
import { behaviorAlertsValidations } from "@/validations";
import { Router } from "express";

const behaviorAlertsRouter = Router();

/**
 * @swagger
 * /behavior-alerts/add:
 *   post:
 *     summary: Add a new behavior alert record
 *     tags: [Behavior Alerts]
 *     description: Create a new behavior alert record with person and camera details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - park_Id
 *               - person_Id
 *               - camera_Id
 *               - detected_behaviour
 *               - snap_shot
 *             properties:
 *               park_Id:
 *                 type: integer
 *                 description: ID of the park where behavior was detected
 *                 example: 1
 *               person_Id:
 *                 type: string
 *                 description: ID of the person involved in the behavior
 *                 example: "PERSON_001"
 *               camera_Id:
 *                 type: integer
 *                 description: ID of the camera that detected the behavior
 *                 example: 5
 *               detected_behaviour:
 *                 type: string
 *                 enum: [fighting, vandalism, trespassing, suspicious_activity, crowding, other]
 *                 description: Type of behavior that was detected
 *                 example: "fighting"
 *               snap_shot:
 *                 type: string
 *                 description: Image path or URL of the behavior detection
 *                 example: "behavior_alert_20240115_143000.jpg"
 *     responses:
 *       201:
 *         description: Behavior alert record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Id:
 *                   type: integer
 *                   example: 1
 *                 park_Id:
 *                   type: integer
 *                   example: 2
 *                 person_Id:
 *                   type: string
 *                   example: "PERSON_001"
 *                 camera_Id:
 *                   type: integer
 *                   example: 71
 *                 detected_behaviour:
 *                   type: string
 *                   example: "Fall Down"
 *                 snap_shot:
 *                   type: string
 *                   example: "behavior_alert_20240115_143000.jpg"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - validation errors or invalid park/camera
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                       param:
 *                         type: string
 *                       location:
 *                         type: string
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
behaviorAlertsRouter.post('/add', behaviorAlertsValidations, BehaviorAlertsController.addBehaviorAlert)

/**
 * @swagger
 * /behavior-alerts/get:
 *   get:
 *     summary: Get all behavior alert records
 *     tags: [Behavior Alerts]
 *     description: Retrieve a list of all behavior alert records with park and camera details
 *     responses:
 *       200:
 *         description: List of behavior alert records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Id:
 *                     type: integer
 *                     example: 1
 *                   park_Id:
 *                     type: integer
 *                     example: 1
 *                   person_Id:
 *                     type: string
 *                     example: "PERSON_001"
 *                   camera_Id:
 *                     type: integer
 *                     example: 5
 *                   detected_behaviour:
 *                     type: string
 *                     enum: [fighting, vandalism, trespassing, suspicious_activity, crowding, other]
 *                     example: "fighting"
 *                   snap_shot:
 *                     type: string
 *                     example: "behavior_alert_20240115_143000.jpg"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   parks:
 *                     type: object
 *                     properties:
 *                       park_english_name:
 *                         type: string
 *                         example: "Central Park"
 *                       park_arabic_name:
 *                         type: string
 *                         example: "الحديقة المركزية"
 *                       latitude:
 *                         type: number
 *                         example: 25.3314
 *                       longitude:
 *                         type: number
 *                         example: 56.3419
 *                   park_cameras:
 *                     type: object
 *                     properties:
 *                       camera_english_name:
 *                         type: string
 *                         example: "Main Entrance Camera"
 *                       camera_arabic_name:
 *                         type: string
 *                         example: "كاميرا المدخل الرئيسي"
 *                       ip_address:
 *                         type: string
 *                         example: "192.168.1.100"
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
behaviorAlertsRouter.get('/get', BehaviorAlertsController.viewBehaviorAlerts)

export default behaviorAlertsRouter; 