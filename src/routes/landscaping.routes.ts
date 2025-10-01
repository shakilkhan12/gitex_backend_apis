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
 *     description: Create a new landscaping record with auto-generated 6-digit case_Id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 description: Image URL of the landscaping area
 *                 example: "https://example.com/landscaping_image.jpg"
 *               name:
 *                 type: string
 *                 description: Name or title of the landscaping case
 *                 example: "Garden Maintenance"
 *               status:
 *                 type: string
 *                 description: Current status of the landscaping work
 *                 example: "pending"
 *               suggestion:
 *                 type: string
 *                 description: Suggestions or notes for the landscaping work
 *                 example: "Need to trim the bushes and water the plants"
 *     responses:
 *       201:
 *         description: Landscaping record created successfully
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
 *                   example: "Landscaping record created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     case_Id:
 *                       type: string
 *                       example: "123456"
 *                     image:
 *                       type: string
 *                       example: "https://example.com/landscaping_image.jpg"
 *                     name:
 *                       type: string
 *                       example: "Garden Maintenance"
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     suggestion:
 *                       type: string
 *                       example: "Need to trim the bushes and water the plants"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation errors"
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
 *     description: Retrieve a list of all landscaping records
 *     responses:
 *       200:
 *         description: List of landscaping records retrieved successfully
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
 *                   example: "Landscaping records retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       case_Id:
 *                         type: string
 *                         example: "123456"
 *                       image:
 *                         type: string
 *                         example: "https://example.com/landscaping_image.jpg"
 *                       name:
 *                         type: string
 *                         example: "Garden Maintenance"
 *                       status:
 *                         type: string
 *                         example: "pending"
 *                       suggestion:
 *                         type: string
 *                         example: "Need to trim the bushes and water the plants"
 *                       parks:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           Id:
 *                             type: integer
 *                             example: 1
 *                           park_Id:
 *                             type: string
 *                             example: "PARK001"
 *                           park_english_name:
 *                             type: string
 *                             example: "Central Park"
 *                           park_arabic_name:
 *                             type: string
 *                             example: "الحديقة المركزية"
 *                           image:
 *                             type: string
 *                             example: "https://example.com/park_image.jpg"
 *                           latitude:
 *                             type: number
 *                             example: 25.2048
 *                           longitude:
 *                             type: number
 *                             example: 55.2708
 *                           location:
 *                             type: string
 *                             example: "Dubai, UAE"
 *                       assignedUser:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           Id:
 *                             type: integer
 *                             example: 123
 *                           emp__eng_name:
 *                             type: string
 *                             example: "John Doe"
 *                           dep_eng_name:
 *                             type: string
 *                             example: "Maintenance Department"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
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

/**
 * @swagger
 * /landscaping/assign:
 *   post:
 *     summary: Assign landscaping case to a user
 *     tags: [Landscaping]
 *     description: Assign a landscaping case to a user and create history record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - landscapingId
 *               - userId
 *             properties:
 *               landscapingId:
 *                 type: integer
 *                 description: ID of the landscaping case to assign
 *                 example: 1
 *               userId:
 *                 type: integer
 *                 description: ID of the user to assign the case to
 *                 example: 123
 *               title:
 *                 type: string
 *                 description: Title for the assignment history
 *                 example: "Assigned to user"
 *               comments:
 *                 type: string
 *                 description: Comments for the assignment
 *                 example: "Landscaping case assigned to user"
 *     responses:
 *       200:
 *         description: Landscaping case assigned successfully
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
 *                   example: "Landscaping case assigned successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     landscapingId:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 123
 *                     historyId:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: Landscaping case or user not found
 *       500:
 *         description: Internal server error
 */
landscapingRouter.post('/assign', LandscapingController.assignLandscaping)

/**
 * @swagger
 * /landscaping/mark-completed:
 *   post:
 *     summary: Mark a landscaping case as completed
 *     tags: [Landscaping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - landscapingId
 *             properties:
 *               landscapingId:
 *                 type: integer
 *                 description: ID of the landscaping case to mark as completed
 *                 example: 1
 *               userId:
 *                 type: integer
 *                 description: ID of the user who is marking as completed
 *                 example: 123
 *               title:
 *                 type: string
 *                 description: Title for the history entry
 *                 example: "Marked as Completed"
 *               comments:
 *                 type: string
 *                 description: Comments for the history entry
 *                 example: "Landscaping case has been marked as completed"
 *               image:
 *                 type: string
 *                 description: URL of the completion image
 *                 example: "https://cloudinary.com/image.jpg"
 *     responses:
 *       200:
 *         description: Landscaping case marked as completed successfully
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
 *                   example: "Landscaping case marked as completed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     landscapingId:
 *                       type: integer
 *                       example: 1
 *                     historyId:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: Landscaping case not found
 *       500:
 *         description: Internal server error
 */
landscapingRouter.post('/mark-completed', LandscapingController.markAsCompleted)

/**
 * @swagger
 * /landscaping/monitor-cameras:
 *   post:
 *     summary: Monitor park cameras and create landscaping records
 *     tags: [Landscaping]
 *     description: Captures images from park cameras, processes them through Cloudinary and Gemini API, and creates landscaping records for grass monitoring
 *     requestBody:
 *       description: Optional payload for testing specific camera or providing credentials
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               apikey:
 *                 type: string
 *                 description: HIK Vision API key
 *                 example: "59315117"
 *               secretKey:
 *                 type: string
 *                 description: HIK Vision secret key
 *                 example: "TWpBeU5TOHhNQzh3TVE9PQ=="
 *               cameraIndex:
 *                 type: string
 *                 description: Specific camera index to test (optional)
 *                 example: "188"
 *     responses:
 *       200:
 *         description: Park camera monitoring completed successfully
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
 *                   example: "Park camera monitoring completed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Processed 5 cameras"
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           cameraId:
 *                             type: string
 *                             example: "188"
 *                           parkName:
 *                             type: string
 *                             example: "Central Park"
 *                           success:
 *                             type: boolean
 *                             example: true
 *                           landscapingId:
 *                             type: integer
 *                             example: 123
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
landscapingRouter.post('/monitor-cameras', LandscapingController.monitorParkCameras)

export default landscapingRouter; 