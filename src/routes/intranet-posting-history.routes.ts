import { IntranetPostingHistoryController } from "@/controllers";
import { intranetPostingHistoryValidations } from "@/validations";
import { Router } from "express";

const intranetPostingHistoryRouter = Router();

/**
 * @swagger
 * /intranet-posting-history/add:
 *   post:
 *     summary: Add a new intranet posting history record
 *     tags: [Intranet Posting History]
 *     description: Create a new intranet posting history record by finding existing record with intranet_id and copying smokingDetectionId and intrusionDetectionId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - intranet_id
 *               - comments
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the intranet posting
 *                 example: "Security Alert Update"
 *               intranet_id:
 *                 type: string
 *                 description: Intranet ID to find existing record
 *                 example: "INTR_001"
 *               comments:
 *                 type: string
 *                 description: Comments for the posting
 *                 example: "Updated security measures implemented"
 *     responses:
 *       201:
 *         description: Intranet posting history record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 title:
 *                   type: string
 *                   example: "Security Alert Update"
 *                 intranet_id:
 *                   type: string
 *                   example: "INTR_001"
 *                 comments:
 *                   type: string
 *                   example: "Updated security measures implemented"
 *                 smokingDetectionId:
 *                   type: integer
 *                   example: 5
 *                 intrusionDetectionId:
 *                   type: integer
 *                   example: 3
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T14:30:00.000Z"
 *                 time:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T14:30:00.000Z"
 *       400:
 *         description: Bad request - validation errors or no existing record found
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
intranetPostingHistoryRouter.post('/add', intranetPostingHistoryValidations, IntranetPostingHistoryController.addIntranetPostingHistory)

/**
 * @swagger
 * /intranet-posting-history/get:
 *   get:
 *     summary: Get all intranet posting history records
 *     tags: [Intranet Posting History]
 *     description: Retrieve a list of all intranet posting history records with related smoking and intrusion detection details
 *     responses:
 *       200:
 *         description: List of intranet posting history records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   title:
 *                     type: string
 *                     example: "Security Alert Update"
 *                   intranet_id:
 *                     type: string
 *                     example: "INTR_001"
 *                   comments:
 *                     type: string
 *                     example: "Updated security measures implemented"
 *                   smokingDetectionId:
 *                     type: integer
 *                     example: 5
 *                   intrusionDetectionId:
 *                     type: integer
 *                     example: 3
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T00:00:00.000Z"
 *                   time:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T14:30:00.000Z"
 *                   smokingDetection:
 *                     type: object
 *                     properties:
 *                       Id:
 *                         type: integer
 *                         example: 5
 *                       location:
 *                         type: string
 *                         example: "Main Entrance"
 *                       parks:
 *                         type: object
 *                         properties:
 *                           park_english_name:
 *                             type: string
 *                             example: "Central Park"
 *                           park_arabic_name:
 *                             type: string
 *                             example: "الحديقة المركزية"
 *                   intrusionDetection:
 *                     type: object
 *                     properties:
 *                       Id:
 *                         type: integer
 *                         example: 3
 *                       location:
 *                         type: string
 *                         example: "Perimeter Fence"
 *                       parks:
 *                         type: object
 *                         properties:
 *                           park_english_name:
 *                             type: string
 *                             example: "Central Park"
 *                           park_arabic_name:
 *                             type: string
 *                             example: "الحديقة المركزية"
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
intranetPostingHistoryRouter.get('/get', IntranetPostingHistoryController.viewIntranetPostingHistory)

/**
 * @swagger
 * /intranet-posting-history/get/{id}:
 *   get:
 *     summary: Get intranet posting history by ID
 *     tags: [Intranet Posting History]
 *     description: Retrieve a specific intranet posting history record by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Intranet posting history ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Intranet posting history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 title:
 *                   type: string
 *                   example: "Security Alert Update"
 *                 intranet_id:
 *                   type: string
 *                   example: "INTR_001"
 *                 comments:
 *                   type: string
 *                   example: "Updated security measures implemented"
 *                 smokingDetectionId:
 *                   type: integer
 *                   example: 5
 *                 intrusionDetectionId:
 *                   type: integer
 *                   example: 3
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T00:00:00.000Z"
 *                 time:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T14:30:00.000Z"
 *                 smokingDetection:
 *                   type: object
 *                   properties:
 *                     Id:
 *                       type: integer
 *                       example: 5
 *                     location:
 *                       type: string
 *                       example: "Main Entrance"
 *                     parks:
 *                       type: object
 *                       properties:
 *                         park_english_name:
 *                           type: string
 *                           example: "Central Park"
 *                         park_arabic_name:
 *                           type: string
 *                           example: "الحديقة المركزية"
 *                 intrusionDetection:
 *                   type: object
 *                   properties:
 *                     Id:
 *                       type: integer
 *                       example: 3
 *                     location:
 *                       type: string
 *                       example: "Perimeter Fence"
 *                     parks:
 *                       type: object
 *                       properties:
 *                         park_english_name:
 *                           type: string
 *                           example: "Central Park"
 *                         park_arabic_name:
 *                           type: string
 *                           example: "الحديقة المركزية"
 *       404:
 *         description: Intranet posting history not found
 *       500:
 *         description: Internal server error
 */
intranetPostingHistoryRouter.get('/get/:id', IntranetPostingHistoryController.getIntranetPostingHistoryById)

export default intranetPostingHistoryRouter;
