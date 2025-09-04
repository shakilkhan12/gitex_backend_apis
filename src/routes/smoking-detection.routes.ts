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
 *                 type: integer
 *                 description: ID of the park where smoking was detected
 *                 example: 1
 *               location:
 *                 type: string
 *                 description: Specific location within the park
 *                 example: "Main Entrance Area"
 *               camera_Id:
 *                 type: integer
 *                 description: ID of the camera that detected the smoking
 *                 example: 5
 *               occurrence_date:
 *                 type: string
 *                 format: date
 *                 description: Date when smoking was detected
 *                 example: "2024-01-15"
 *               occurrence_time:
 *                 type: string
 *                 format: time
 *                 description: Time when smoking was detected
 *                 example: "14:30:00"
 *               snap_shot:
 *                 type: string
 *                 description: Image path or URL of the smoking detection
 *                 example: "smoking_detection_20240115_143000.jpg"
 *               posted_to_intranet_date:
 *                 type: string
 *                 format: date
 *                 description: Date when detection was posted to intranet
 *                 example: "2024-01-15"
 *               posted_to_intranet_time:
 *                 type: string
 *                 format: time
 *                 description: Time when detection was posted to intranet
 *                 example: "14:35:00"
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
 *                   example: 1
 *                 location:
 *                   type: string
 *                   example: "Main Entrance Area"
 *                 camera_Id:
 *                   type: integer
 *                   example: 5
 *                 occurrence_date:
 *                   type: string
 *                   format: date
 *                   example: "2024-01-15"
 *                 occurrence_time:
 *                   type: string
 *                   format: time
 *                   example: "14:30:00"
 *                 snap_shot:
 *                   type: string
 *                   example: "smoking_detection_20240115_143000.jpg"
 *                 posted_to_intranet_date:
 *                   type: string
 *                   format: date
 *                   example: "2024-01-15"
 *                 posted_to_intranet_time:
 *                   type: string
 *                   format: time
 *                   example: "14:35:00"
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
 *                     example: 1
 *                   location:
 *                     type: string
 *                     example: "Main Entrance Area"
 *                   camera_Id:
 *                     type: integer
 *                     example: 5
 *                   occurrence_date:
 *                     type: string
 *                     format: date
 *                     example: "2024-01-15"
 *                   occurrence_time:
 *                     type: string
 *                     format: time
 *                     example: "14:30:00"
 *                   snap_shot:
 *                     type: string
 *                     example: "smoking_detection_20240115_143000.jpg"
 *                   posted_to_intranet_date:
 *                     type: string
 *                     format: date
 *                     example: "2024-01-15"
 *                   posted_to_intranet_time:
 *                     type: string
 *                     format: time
 *                     example: "14:35:00"
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

/**
 * @swagger
 * /smoking-detection/update/{id}:
 *   put:
 *     summary: Update smoking detection
 *     tags: [Smoking Detection]
 *     description: Update an existing smoking detection record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Smoking detection ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: string
 *                 description: Updated location
 *               snap_shot:
 *                 type: string
 *                 description: Updated snapshot
 *               description:
 *                 type: string
 *                 description: Updated description
 *               current_status:
 *                 type: string
 *                 description: Updated status
 *     responses:
 *       200:
 *         description: Smoking detection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SmokingDetection'
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: Smoking detection not found
 *       500:
 *         description: Internal server error
 */
smokingDetectionRouter.put('/update/:id', SmokingDetectionController.updateSmokingDetection)

export default smokingDetectionRouter; 