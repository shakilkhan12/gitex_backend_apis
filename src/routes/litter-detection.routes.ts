import { LitterDetectionController } from "@/controllers";
import { litterDetectionValidations } from "@/validations";
import { Router } from "express";

const litterDetectionRouter = Router();

/**
 * @swagger
 * /litter-detection/add:
 *   post:
 *     summary: Add a new litter detection record
 *     tags: [Litter Detection]
 *     description: Create a new litter detection record with location and case details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - park_Id
 *               - case_Id
 *               - location
 *               - occurrence_date
 *               - occurrence_time
 *               - snap_shot
 *               - status
 *             properties:
 *               park_Id:
 *                 type: integer
 *                 description: ID of the park where litter was detected
 *                 example: 1
 *               case_Id:
 *                 type: string
 *                 description: Unique case identifier for the litter detection
 *                 example: "LITTER_20240115_001"
 *               location:
 *                 type: string
 *                 description: Specific location within the park where litter was found
 *                 example: "Playground Area"
 *               occurrence_date:
 *                 type: string
 *                 format: date
 *                 description: Date when litter was detected
 *                 example: "2024-01-15"
 *               occurrence_time:
 *                 type: string
 *                 format: time
 *                 description: Time when litter was detected
 *                 example: "10:30:00"
 *               snap_shot:
 *                 type: string
 *                 description: Image path or URL of the litter detection
 *                 example: "litter_detection_20240115_103000.jpg"
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, resolved, closed]
 *                 description: Current status of the litter case
 *                 example: "pending"
 *     responses:
 *       201:
 *         description: Litter detection record created successfully
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
 *                 case_Id:
 *                   type: string
 *                   example: "LITTER_20240115_001"
 *                 location:
 *                   type: string
 *                   example: "Playground Area"
 *                 occurrence_date:
 *                   type: string
 *                   format: date
 *                   example: "2024-01-15"
 *                 occurrence_time:
 *                   type: string
 *                   format: time
 *                   example: "10:30:00"
 *                 snap_shot:
 *                   type: string
 *                   example: "litter_detection_20240115_103000.jpg"
 *                 status:
 *                   type: string
 *                   enum: [pending, in_progress, resolved, closed]
 *                   example: "pending"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - validation errors or invalid park
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
litterDetectionRouter.post('/add', litterDetectionValidations, LitterDetectionController.addLitterDetection)

/**
 * @swagger
 * /litter-detection/get:
 *   get:
 *     summary: Get all litter detection records
 *     tags: [Litter Detection]
 *     description: Retrieve a list of all litter detection records with park details
 *     responses:
 *       200:
 *         description: List of litter detection records retrieved successfully
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
 *                   case_Id:
 *                     type: string
 *                     example: "LITTER_20240115_001"
 *                   location:
 *                     type: string
 *                     example: "Playground Area"
 *                   occurrence_date:
 *                     type: string
 *                     format: date
 *                     example: "2024-01-15"
 *                   occurrence_time:
 *                     type: string
 *                     format: time
 *                     example: "10:30:00"
 *                   snap_shot:
 *                     type: string
 *                     example: "litter_detection_20240115_103000.jpg"
 *                   status:
 *                     type: string
 *                     enum: [pending, in_progress, resolved, closed]
 *                     example: "pending"
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
litterDetectionRouter.get('/get', LitterDetectionController.viewLitterDetections)

export default litterDetectionRouter; 