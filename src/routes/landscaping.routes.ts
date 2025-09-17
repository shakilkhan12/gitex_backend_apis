import { LandscapingController } from "@/controllers";
import { landscapingValidations } from "@/validations";
import { Router } from "express";

const landscapingRouter = Router();

/**
 * @swagger
 * /landscaping/add:
 *   post:
 *     summary: Add a new landscaping record
 *     tags: [Landscaping]
 *     description: Create a new landscaping record with location and case details
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
 *               - snap_shot
 *               - type
 *               - status
 *             properties:
 *               park_Id:
 *                 type: integer
 *                 description: ID of the park where landscaping work is needed
 *                 example: 1
 *               case_Id:
 *                 type: string
 *                 description: Unique case identifier for the landscaping work
 *                 example: "LANDSCAPE_20240115_001"
 *               location:
 *                 type: string
 *                 description: Specific location within the park where landscaping is needed
 *                 example: "Garden Area"
 *               snap_shot:
 *                 type: string
 *                 description: Image path or URL of the landscaping area
 *                 example: "landscaping_20240115_001.jpg"
 *               type:
 *                 type: string
 *                 enum: [maintenance, planting, pruning, irrigation, cleaning, other]
 *                 description: Type of landscaping work required
 *                 example: "maintenance"
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled]
 *                 description: Current status of the landscaping work
 *                 example: "pending"
 *     responses:
 *       201:
 *         description: Landscaping record created successfully
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
 *                   example: "LANDSCAPE_20240115_001"
 *                 location:
 *                   type: string
 *                   example: "Garden Area"
 *                 snap_shot:
 *                   type: string
 *                   example: "landscaping_20240115_001.jpg"
 *                 type:
 *                   type: string
 *                   enum: [maintenance, planting, pruning, irrigation, cleaning, other]
 *                   example: "maintenance"
 *                 status:
 *                   type: string
 *                   enum: [pending, in_progress, completed, cancelled]
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
landscapingRouter.post('/add', landscapingValidations, LandscapingController.addLandscaping)

/**
 * @swagger
 * /landscaping/get:
 *   get:
 *     summary: Get all landscaping records
 *     tags: [Landscaping]
 *     description: Retrieve a list of all landscaping records with park details
 *     responses:
 *       200:
 *         description: List of landscaping records retrieved successfully
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
 *                     example: "LANDSCAPE_20240115_001"
 *                   location:
 *                     type: string
 *                     example: "Garden Area"
 *                   snap_shot:
 *                     type: string
 *                     example: "landscaping_20240115_001.jpg"
 *                   type:
 *                     type: string
 *                     enum: [maintenance, planting, pruning, irrigation, cleaning, other]
 *                     example: "maintenance"
 *                   status:
 *                     type: string
 *                     enum: [pending, in_progress, completed, cancelled]
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
landscapingRouter.get('/get', LandscapingController.viewLandscapings)

export default landscapingRouter; 