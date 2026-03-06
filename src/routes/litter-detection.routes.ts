import { LitterDetectionController } from "@/controllers";
import { litterDetectionValidations, litterDetectionCompleteValidations } from "@/validations";
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
 *                 type: string
 *                 description: ID of the park where litter was detected
 *                 example: "PARK_001"
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
 *                 format: date-time
 *                 description: Date when litter was detected (ISO8601 format)
 *                 example: "2024-01-15T00:00:00.000Z"
 *               occurrence_time:
 *                 type: string
 *                 format: time
 *                 description: Time when litter was detected (HH:MM:SS format)
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
 *               detection_Id:
 *                 type: string
 *                 description: Unique detection identifier
 *                 example: "LITTER_DETECT_20240115_001"
 *               detection_date:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time when detection was processed (ISO8601 format)
 *                 example: "2024-01-15T10:30:00.000Z"
 *               detection_time:
 *                 type: string
 *                 format: time
 *                 description: Time when detection was processed (HH:MM:SS format)
 *                 example: "10:30:00"
 *               description:
 *                 type: string
 *                 description: Detailed description of the litter detection
 *                 example: "Litter detected in playground area"
 *               current_status:
 *                 type: string
 *                 description: Current status of the detection
 *                 example: "active"
 *               camera_Id:
 *                 type: string
 *                 description: Camera ID string (e.g., "79") - will be looked up in park_cameras table
 *                 example: "CAM_001"
 *               after_image:
 *                 type: string
 *                 description: Image taken after cleanup (if available)
 *                 example: "litter_after_cleanup_20240115_103000.jpg"
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
 *                   example: 37
 *                 case_Id:
 *                   type: string
 *                   example: "LITTER_20240115_001"
 *                 location:
 *                   type: string
 *                   example: "Playground Area"
 *                 occurrence_date:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T00:00:00.000Z"
 *                 occurrence_time:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 snap_shot:
 *                   type: string
 *                   example: "litter_detection_20240115_103000.jpg"
 *                 status:
 *                   type: string
 *                   enum: [pending, in_progress, resolved, closed]
 *                   example: "pending"
 *                 detection_Id:
 *                   type: string
 *                   example: "LITTER_DETECT_20240115_001"
 *                 detection_date:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 detection_time:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 description:
 *                   type: string
 *                   example: "Litter detected in playground area"
 *                 current_status:
 *                   type: string
 *                   example: "active"
 *                 camera_Id:
 *                   type: integer
 *                   example: 1
 *                 after_image:
 *                   type: string
 *                   example: "litter_after_cleanup_20240115_103000.jpg"
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
 *     summary: Get litter detection records with pagination
 *     tags: [Litter Detection]
 *     description: Retrieve a paginated list of litter detection records with park details, search, filtering, and sorting capabilities
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
 *         description: Search term to filter by case ID, location, description, or park name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, resolved, closed, complete]
 *         description: Filter by litter detection status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, occurrence_date, status, location]
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
 *         description: List of litter detection records retrieved successfully
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
 *                   example: "Litter detection records retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                   Id:
 *                     type: integer
 *                     example: 1
 *                   park_Id:
 *                     type: integer
 *                     example: 37
 *                   case_Id:
 *                     type: string
 *                     example: "LITTER_20240115_001"
 *                   location:
 *                     type: string
 *                     example: "Playground Area"
 *                   occurrence_date:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T00:00:00.000Z"
 *                   occurrence_time:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   snap_shot:
 *                     type: string
 *                     example: "litter_detection_20240115_103000.jpg"
 *                   status:
 *                     type: string
 *                     enum: [pending, in_progress, resolved, closed]
 *                     example: "pending"
 *                   detection_Id:
 *                     type: string
 *                     example: "LITTER_DETECT_20240115_001"
 *                   detection_date:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   detection_time:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00.000Z"
 *                   description:
 *                     type: string
 *                     example: "Litter detected in playground area"
 *                   current_status:
 *                     type: string
 *                     example: "active"
 *                   camera_Id:
 *                     type: integer
 *                     example: 1
 *                   after_image:
 *                     type: string
 *                     example: "litter_after_cleanup_20240115_103000.jpg"
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
 *                         example: "Playground Camera"
 *                       camera_arabic_name:
 *                         type: string
 *                         example: "كاميرا الملعب"
 *                       ip_address:
 *                         type: string
 *                         example: "192.168.1.103"
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
litterDetectionRouter.get('/get', LitterDetectionController.viewLitterDetections)
litterDetectionRouter.get('/export/excel', LitterDetectionController.exportLitterDetectionsExcel)
litterDetectionRouter.get('/export/pdf', LitterDetectionController.exportLitterDetectionsPdf)

/**
 * @swagger
 * /litter-detection/assign:
 *   post:
 *     summary: Assign a litter detection case to a user
 *     tags: [Litter Detection]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - litterDetectionId
 *               - userId
 *             properties:
 *               litterDetectionId:
 *                 type: integer
 *                 description: ID of the litter detection case to assign
 *                 example: 1
 *               userId:
 *                 type: integer
 *                 description: ID of the user to assign the case to
 *                 example: 123
 *               title:
 *                 type: string
 *                 description: Title for the assignment
 *                 example: "Assign to John Doe"
 *               comments:
 *                 type: string
 *                 description: Comments for the assignment
 *                 example: "Litter detection case assigned to John Doe"
 *     responses:
 *       200:
 *         description: Litter detection case assigned successfully
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
 *                   example: "Litter detection case assigned successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     litterDetectionId:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 123
 *                     ticketId:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: Litter detection case not found
 *       500:
 *         description: Internal server error
 */
litterDetectionRouter.post('/assign', LitterDetectionController.assignLitterDetection)

/**
 * @swagger
 * /litter-detection/complete:
 *   post:
 *     summary: Complete a litter detection case
 *     tags: [Litter Detection]
 *     description: Mark a litter detection case as completed by creating a ticket details record with status "Completed" and updating the litter detection status to "complete". Returns a message if the case is already closed.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - comments
 *               - image
 *             properties:
 *               id:
 *                 type: integer
 *                 description: ID of the litter detection record to complete
 *                 example: 1
 *               comments:
 *                 type: string
 *                 description: Comments about the completion of the litter detection
 *                 example: "Litter has been cleaned up successfully. Area is now clean."
 *               image:
 *                 type: string
 *                 format: url
 *                 description: URL of the image showing the completed work
 *                 example: "https://example.com/images/litter_cleanup_completed.jpg"
 *     responses:
 *       201:
 *         description: Litter detection case completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 litterDetection:
 *                   type: object
 *                   properties:
 *                     Id:
 *                       type: integer
 *                       example: 1
 *                     park_Id:
 *                       type: integer
 *                       example: 37
 *                     case_Id:
 *                       type: string
 *                       example: "LITTER_20240115_001"
 *                     location:
 *                       type: string
 *                       example: "Playground Area"
 *                     occurrence_date:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T00:00:00.000Z"
 *                     occurrence_time:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     snap_shot:
 *                       type: string
 *                       example: "litter_detection_20240115_103000.jpg"
 *                     status:
 *                       type: string
 *                       example: "complete"
 *                     detection_Id:
 *                       type: string
 *                       example: "LITTER_DETECT_20240115_001"
 *                     description:
 *                       type: string
 *                       example: "Litter detected in playground area"
 *                     current_status:
 *                       type: string
 *                       example: "active"
 *                     parks:
 *                       type: object
 *                       properties:
 *                         park_english_name:
 *                           type: string
 *                           example: "Central Park"
 *                         park_arabic_name:
 *                           type: string
 *                           example: "الحديقة المركزية"
 *                         latitude:
 *                           type: number
 *                           example: 25.3314
 *                         longitude:
 *                           type: number
 *                           example: 56.3419
 *                     park_cameras:
 *                       type: object
 *                       properties:
 *                         camera_english_name:
 *                           type: string
 *                           example: "Playground Camera"
 *                         camera_arabic_name:
 *                           type: string
 *                           example: "كاميرا الملعب"
 *                         ip_address:
 *                           type: string
 *                           example: "192.168.1.103"
 *                 ticketDetails:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     status:
 *                       type: string
 *                       example: "Completed"
 *                     date:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T14:30:00.000Z"
 *                     time:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T14:30:00.000Z"
 *                     comments:
 *                       type: string
 *                       example: "Litter has been cleaned up successfully. Area is now clean."
 *                     image:
 *                       type: string
 *                       example: "https://example.com/images/litter_cleanup_completed.jpg"
 *                     litterDetectionId:
 *                       type: integer
 *                       example: 1
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       200:
 *         description: Case already closed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Case already closed"
 *                 litterDetection:
 *                   type: object
 *                   properties:
 *                     Id:
 *                       type: integer
 *                       example: 1
 *                     status:
 *                       type: string
 *                       example: "complete"
 *                     location:
 *                       type: string
 *                       example: "Playground Area"
 *                 ticketDetails:
 *                   type: null
 *                   example: null
 *       400:
 *         description: Bad request - validation errors
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
 *       404:
 *         description: Litter detection record not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Litter detection record not found"
 *                 status:
 *                   type: integer
 *                   example: 404
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
litterDetectionRouter.post('/check-condition', litterDetectionCompleteValidations, LitterDetectionController.completeLitterDetection)

export default litterDetectionRouter; 