import { ParkSentimentAnalysisController } from "@/controllers";
import { parkSentimentAnalysisValidations, parkSentimentAnalysisUpdateValidations } from "@/validations";
import { Router } from "express";

const parkSentimentAnalysisRouter = Router();

/**
 * @swagger
 * /park-sentiment-analysis/add:
 *   post:
 *     summary: Add a new park sentiment analysis record
 *     tags: [Park Sentiment Analysis]
 *     description: Create a new park sentiment analysis record with person and camera details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - park_Id
 *               - detection_Id
 *               - check_in_date
 *               - check_in_time
 *               - check_in_sentiment
 *               - entry_camera_Id
 *             properties:
 *               park_Id:
 *                 type: string
 *                 description: ID of the park where sentiment was analyzed
 *                 example: "PARK_001"
 *               person_Id:
 *                 type: string
 *                 description: Optional Employee ID. If provided, the system will look up this emp_Id in the users table and use the corresponding user.Id as the person_Id in the record. If no user is found, person_Id will be set to null, sentiment_of will be set to 'visitor', and person_name will be set to 'Visitor'. If user is found, sentiment_of will be set to 'employee' and person_name will be set to user.emp__eng_name.
 *                 example: "EMP_001"
 *               detection_Id:
 *                 type: string
 *                 description: Unique detection ID for this sentiment analysis record
 *                 example: "DET_001"
 *               gender:
 *                 type: string
 *                 description: Gender of the person
 *                 example: "male"
 *               check_in_image:
 *                 type: string
 *                 description: Optional image path or URL of the check-in capture
 *                 example: "checkin_20240115_100000.jpg"
 *               check_in_date:
 *                 type: string
 *                 format: date
 *                 description: Date when person checked in
 *                 example: "2024-01-15"
 *               check_in_time:
 *                 type: string
 *                 format: time
 *                 description: Time when person checked in
 *                 example: "10:00:00"
 *               check_in_sentiment:
 *                 type: string
 *                 enum: [positive, negative, neutral, happy, sad, angry, surprised, fearful, disgusted]
 *                 description: Sentiment detected at check-in
 *                 example: "happy"
 *               entry_camera_Id:
 *                 type: string
 *                 description: ID of the camera that captured entry
 *                 example: "CAM_001"
 *     responses:
 *       201:
 *         description: Park sentiment analysis record created successfully
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
 *                 person_Id:
 *                   type: string
 *                   example: "5"
 *                 sentiment_of:
 *                   type: string
 *                   enum: [employee, visitor]
 *                   example: "employee"
 *                 check_in_date:
 *                   type: string
 *                   format: date
 *                   example: "2024-01-15"
 *                 check_in_time:
 *                   type: string
 *                   format: time
 *                   example: "10:00:00"
 *                 check_in_sentiment:
 *                   type: string
 *                   enum: [positive, negative, neutral, happy, sad, angry, surprised, fearful, disgusted]
 *                   example: "happy"
 *                 entry_camera_Id:
 *                   type: integer
 *                   example: 5
 *                 check_out_date:
 *                   type: string
 *                   format: date
 *                   example: "2024-01-15"
 *                 check_out_time:
 *                   type: string
 *                   format: time
 *                   example: "18:00:00"
 *                 check_out_capture:
 *                   type: string
 *                   example: "checkout_20240115_180000.jpg"
 *                 exit_camera_Id:
 *                   type: integer
 *                   example: 6
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
parkSentimentAnalysisRouter.post('/add', parkSentimentAnalysisValidations, ParkSentimentAnalysisController.addParkSentimentAnalysis)

/**
 * @swagger
 * /park-sentiment-analysis/get:
 *   get:
 *     summary: Get all park sentiment analysis records
 *     tags: [Park Sentiment Analysis]
 *     description: Retrieve a list of all park sentiment analysis records with park and camera details
 *     responses:
 *       200:
 *         description: List of park sentiment analysis records retrieved successfully
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
 *                   sentiment_of:
 *                     type: string
 *                     enum: [employee, visitor]
 *                     example: "visitor"
 *                   check_in_date:
 *                     type: string
 *                     format: date
 *                     example: "2024-01-15"
 *                   check_in_time:
 *                     type: string
 *                     format: time
 *                     example: "10:00:00"
 *                   check_in_sentiment:
 *                     type: string
 *                     enum: [positive, negative, neutral, happy, sad, angry, surprised, fearful, disgusted]
 *                     example: "happy"
 *                   entry_camera_Id:
 *                     type: integer
 *                     example: 5
 *                   check_out_date:
 *                     type: string
 *                     format: date
 *                     example: "2024-01-15"
 *                   check_out_time:
 *                     type: string
 *                     format: time
 *                     example: "18:00:00"
 *                   check_out_capture:
 *                     type: string
 *                     example: "checkout_20240115_180000.jpg"
 *                   exit_camera_Id:
 *                     type: integer
 *                     example: 6
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
 *                   park_cameras_parks_sentiment_analysis_entry_camera_IdTopark_cameras:
 *                     type: object
 *                     properties:
 *                       camera_english_name:
 *                         type: string
 *                         example: "Entry Camera"
 *                       camera_arabic_name:
 *                         type: string
 *                         example: "كاميرا المدخل"
 *                       ip_address:
 *                         type: string
 *                         example: "192.168.1.100"
 *                   park_cameras_parks_sentiment_analysis_exit_camera_IdTopark_cameras:
 *                     type: object
 *                     properties:
 *                       camera_english_name:
 *                         type: string
 *                         example: "Exit Camera"
 *                       camera_arabic_name:
 *                         type: string
 *                         example: "كاميرا الخروج"
 *                       ip_address:
 *                         type: string
 *                         example: "192.168.1.101"
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
parkSentimentAnalysisRouter.get('/get', ParkSentimentAnalysisController.viewParkSentimentAnalyses)
parkSentimentAnalysisRouter.get('/export/excel', ParkSentimentAnalysisController.exportParkSentimentAnalysesExcel)
parkSentimentAnalysisRouter.get('/export/pdf', ParkSentimentAnalysisController.exportParkSentimentAnalysesPdf)

/**
 * @swagger
 * /park-sentiment-analysis/filters:
 *   get:
 *     summary: Get filters for park sentiment analysis
 *     tags: [Park Sentiment Analysis]
 *     description: Retrieve filter options for park sentiment analysis (employees list)
 *     responses:
 *       200:
 *         description: Filters retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     employees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                           emp_Id:
 *                             type: string
 *                           name_en:
 *                             type: string
 *                           name_ar:
 *                             type: string
 */
parkSentimentAnalysisRouter.get('/filters', ParkSentimentAnalysisController.getParkSentimentAnalysisFilters)

/**
 * @swagger
 * /park-sentiment-analysis/update/{detection_Id}:
 *   put:
 *     summary: Update a park sentiment analysis record by detection ID
 *     tags: [Park Sentiment Analysis]
 *     description: Update an existing park sentiment analysis record using the detection ID
 *     parameters:
 *       - in: path
 *         name: detection_Id
 *         required: true
 *         schema:
 *           type: string
 *         description: The detection ID of the park sentiment analysis record to update
 *         example: "DET_001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               detection_Id:
 *                 type: string
 *                 description: Unique detection ID for this sentiment analysis record
 *                 example: "DET_001"
 *               check_out_date:
 *                 type: string
 *                 format: date
 *                 description: Date when person checked out
 *                 example: "2024-01-15"
 *               check_out_time:
 *                 type: string
 *                 format: time
 *                 description: Time when person checked out
 *                 example: "18:00:00"
 *               check_out_capture:
 *                 type: string
 *                 description: Image path or URL of check-out capture
 *                 example: "checkout_20240115_180000.jpg"
 *               check_out_sentiment:
 *                 type: string
 *                 description: Sentiment detected at check-out
 *                 example: "satisfied"
 *               exit_camera_Id:
 *                 type: string
 *                 description: ID of the camera that captured exit
 *                 example: "CAM_002"
 *     responses:
 *       200:
 *         description: Park sentiment analysis record updated successfully
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
 *                 person_Id:
 *                   type: string
 *                   example: "5"
 *                 detection_Id:
 *                   type: string
 *                   example: "DET_001"
 *                 sentiment_of:
 *                   type: string
 *                   enum: [employee, visitor]
 *                   example: "employee"
 *                 check_in_date:
 *                   type: string
 *                   format: date
 *                   example: "2024-01-15"
 *                 check_in_time:
 *                   type: string
 *                   format: time
 *                   example: "10:00:00"
 *                 check_in_sentiment:
 *                   type: string
 *                   example: "happy"
 *                 entry_camera_Id:
 *                   type: integer
 *                   example: 1
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
 *       404:
 *         description: Park sentiment analysis record not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Park sentiment analysis not found with the provided detection ID"
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
parkSentimentAnalysisRouter.put('/update/:detection_Id', parkSentimentAnalysisUpdateValidations, ParkSentimentAnalysisController.updateParkSentimentAnalysis)

export default parkSentimentAnalysisRouter; 