import { SmokingDetectionController } from "@/controllers";
import { smokingDetectionValidations } from "@/validations";
import { Router } from "express";

const smokingDetectionRouter = Router();

/**
 * @swagger
 * /smoking-detection/add:
 *   post:
 *     summary: Add a new smoking detection record
 *     tags: [Smoking Detection]
 *     description: Create a new smoking detection record with camera and location details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - park_Id
 *               - location
 *               - camera_Id
 *               - occurrence_date
 *               - occurrence_time
 *               - snap_shot
 *             properties:
 *               park_Id:
 *                 type: string
 *                 description: ID of the park where smoking was detected
 *                 example: "PARK_001"
 *               location:
 *                 type: string
 *                 description: Specific location within the park
 *                 example: "Main Entrance Area"
 *               camera_Id:
 *                 type: string
 *                 description: Camera ID string (e.g., "77") - will be looked up in park_cameras table
 *                 example: "77"
 *               occurrence_date:
 *                 type: string
 *                 format: date-time
 *                 description: Date when smoking was detected (ISO8601 format)
 *                 example: "2024-01-15T00:00:00.000Z"
 *               occurrence_time:
 *                 type: string
 *                 format: time
 *                 description: Time when smoking was detected (HH:MM:SS format)
 *                 example: "14:30:00"
 *               snap_shot:
 *                 type: string
 *                 description: Image path or URL of the smoking detection
 *                 example: "smoking_detection_20240115_143000.jpg"
 *               detection_Id:
 *                 type: string
 *                 description: Unique detection identifier
 *                 example: "SMOKE_20240115_001"
 *               detection_date:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time when detection was processed (ISO8601 format)
 *                 example: "2024-01-15T14:30:00.000Z"
 *               detection_time:
 *                 type: string
 *                 format: time
 *                 description: Time when detection was processed (HH:MM:SS format)
 *                 example: "14:30:00"
 *               description:
 *                 type: string
 *                 description: Detailed description of the smoking detection
 *                 example: "Smoking detected near main entrance"
 *               is_employee:
 *                 type: boolean
 *                 description: Whether the person detected is an employee
 *                 example: false
 *               current_status:
 *                 type: string
 *                 description: Current status of the detection
 *                 example: "active"
 *     responses:
 *       201:
 *         description: Smoking detection record created successfully
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
 *                   example: 37
 *                 location:
 *                   type: string
 *                   example: "Main Entrance Area"
 *                 camera_Id:
 *                   type: integer
 *                   example: 1
 *                 occurrence_date:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T00:00:00.000Z"
 *                 occurrence_time:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T14:30:00.000Z"
 *                 snap_shot:
 *                   type: string
 *                   example: "smoking_detection_20240115_143000.jpg"
 *                 detection_Id:
 *                   type: string
 *                   example: "SMOKE_20240115_001"
 *                 detection_date:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T14:30:00.000Z"
 *                 detection_time:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T14:30:00.000Z"
 *                 description:
 *                   type: string
 *                   example: "Smoking detected near main entrance"
 *                 is_employee:
 *                   type: boolean
 *                   example: false
 *                 current_status:
 *                   type: string
 *                   example: "active"
 *                 posted_to_intranet_date:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T14:35:00.000Z"
 *                 posted_to_intranet_time:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T14:35:00.000Z"
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
smokingDetectionRouter.post('/add', smokingDetectionValidations, SmokingDetectionController.addSmokingDetection)

/**
 * @swagger
 * /smoking-detection/get:
 *   get:
 *     summary: Get all smoking detection records
 *     tags: [Smoking Detection]
 *     description: Retrieve a list of all smoking detection records with park and camera details
 *     responses:
 *       200:
 *         description: List of smoking detection records retrieved successfully
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
 *                     example: 37
 *                   location:
 *                     type: string
 *                     example: "Main Entrance Area"
 *                   camera_Id:
 *                     type: integer
 *                     example: 1
 *                   occurrence_date:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T00:00:00.000Z"
 *                   occurrence_time:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T14:30:00.000Z"
 *                   snap_shot:
 *                     type: string
 *                     example: "smoking_detection_20240115_143000.jpg"
 *                   detection_Id:
 *                     type: string
 *                     example: "SMOKE_20240115_001"
 *                   detection_date:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T14:30:00.000Z"
 *                   detection_time:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T14:30:00.000Z"
 *                   description:
 *                     type: string
 *                     example: "Smoking detected near main entrance"
 *                   is_employee:
 *                     type: boolean
 *                     example: false
 *                   current_status:
 *                     type: string
 *                     example: "active"
 *                   posted_to_intranet_date:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T14:35:00.000Z"
 *                   posted_to_intranet_time:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T14:35:00.000Z"
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
smokingDetectionRouter.get('/get', SmokingDetectionController.viewSmokingDetections)

/**
 * @swagger
 * /smoking-detection/get/{id}:
 *   get:
 *     summary: Get smoking detection by ID
 *     tags: [Smoking Detection]
 *     description: Retrieve a specific smoking detection record by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Smoking detection ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Smoking detection retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SmokingDetection'
 *       404:
 *         description: Smoking detection not found
 *       500:
 *         description: Internal server error
 */
smokingDetectionRouter.get('/get/:id', SmokingDetectionController.getSmokingDetectionById)

export default smokingDetectionRouter; 