import { IntrusionDetectionController } from "@/controllers";
import { intrusionDetectionValidations } from "@/validations";
import { Router } from "express";

const intrusionDetectionRouter = Router();

intrusionDetectionRouter.post('/add', intrusionDetectionValidations, IntrusionDetectionController.addIntrusionDetection)

/**
 * @swagger
 * /intrusion-detection/get:
 *   get:
 *     summary: Get intrusion detection records with pagination
 *     tags: [Intrusion Detection]
 *     description: Retrieve a paginated list of intrusion detection records with park details, search, filtering, and sorting capabilities
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter by location, description, detection ID, or park name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, resolved, closed, complete]
 *         description: Filter by intrusion detection status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, occurrence_date, current_status, location]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of intrusion detection records retrieved successfully
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
 *                   example: "Intrusion detection records retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Id:
 *                         type: integer
 *                         example: 1
 *                       park_Id:
 *                         type: integer
 *                         example: 37
 *                       location:
 *                         type: string
 *                         example: "Main Entrance"
 *                       occurrence_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T00:00:00.000Z"
 *                       occurrence_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *                       snap_shot:
 *                         type: string
 *                         example: "intrusion_detection_20240115_103000.jpg"
 *                       detection_Id:
 *                         type: string
 *                         example: "INTRUSION_DETECT_20240115_001"
 *                       detection_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *                       detection_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00.000Z"
 *                       description:
 *                         type: string
 *                         example: "Unauthorized person detected at main entrance"
 *                       is_employee:
 *                         type: boolean
 *                         example: false
 *                       current_status:
 *                         type: string
 *                         example: "pending"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       parks:
 *                         type: object
 *                         properties:
 *                           park_english_name:
 *                             type: string
 *                             example: "Central Park"
 *                           park_arabic_name:
 *                             type: string
 *                             example: "الحديقة المركزية"
 *                           latitude:
 *                             type: number
 *                             example: 25.3314
 *                           longitude:
 *                             type: number
 *                             example: 56.3419
 *                       park_cameras:
 *                         type: object
 *                         properties:
 *                           camera_english_name:
 *                             type: string
 *                             example: "Main Entrance Camera"
 *                           camera_arabic_name:
 *                             type: string
 *                             example: "كاميرا المدخل الرئيسي"
 *                           ip_address:
 *                             type: string
 *                             example: "192.168.1.104"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalCount:
 *                       type: integer
 *                       example: 50
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *                     nextPage:
 *                       type: integer
 *                       nullable: true
 *                       example: 2
 *                     previousPage:
 *                       type: integer
 *                       nullable: true
 *                       example: null
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
intrusionDetectionRouter.get('/get', IntrusionDetectionController.viewIntrusionDetections)

intrusionDetectionRouter.get('/get/:id', IntrusionDetectionController.getIntrusionDetectionById)

intrusionDetectionRouter.put('/update/:id', IntrusionDetectionController.updateIntrusionDetection)

export default intrusionDetectionRouter;
