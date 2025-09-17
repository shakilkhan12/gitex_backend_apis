import { OfficeSentimentAnalysisController } from "@/controllers";
import { officeSentimentAnalysisValidations } from "@/validations";
import { Router } from "express";

const officeSentimentAnalysisRouter = Router();

/**
 * @swagger
 * /office-sentiment-analysis/add:
 *   post:
 *     summary: Add a new office sentiment analysis record
 *     tags: [Office Sentiment Analysis]
 *     description: Create a new office sentiment analysis record with person and camera details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - office_Id
 *               - person_Id
 *               - sentiment_of
 *               - check_in_date
 *               - check_in_time
 *               - check_in_sentiment
 *               - entry_camera_Id
 *             properties:
 *               office_Id:
 *                 type: integer
 *                 description: ID of the office where sentiment was analyzed
 *                 example: 1
 *               person_Id:
 *                 type: string
 *                 description: ID of the person whose sentiment was analyzed
 *                 example: "PERSON_001"
 *               sentiment_of:
 *                 type: string
 *                 enum: [employee, visitor]
 *                 description: Type of person (employee or visitor)
 *                 example: "employee"
 *               check_in_date:
 *                 type: string
 *                 format: date
 *                 description: Date when person checked in
 *                 example: "2024-01-15"
 *               check_in_time:
 *                 type: string
 *                 format: time
 *                 description: Time when person checked in
 *                 example: "09:00:00"
 *               check_in_sentiment:
 *                 type: string
 *                 enum: [positive, negative, neutral, happy, sad, angry, surprised, fearful, disgusted]
 *                 description: Sentiment detected at check-in
 *                 example: "positive"
 *               entry_camera_Id:
 *                 type: integer
 *                 description: ID of the camera that captured entry
 *                 example: 5
 *               check_out_date:
 *                 type: string
 *                 format: date
 *                 description: Date when person checked out
 *                 example: "2024-01-15"
 *               check_out_time:
 *                 type: string
 *                 format: time
 *                 description: Time when person checked out
 *                 example: "17:00:00"
 *               check_out_capture:
 *                 type: string
 *                 description: Image path or URL of check-out capture
 *                 example: "checkout_20240115_170000.jpg"
 *               exit_camera_Id:
 *                 type: integer
 *                 description: ID of the camera that captured exit
 *                 example: 6
 *     responses:
 *       201:
 *         description: Office sentiment analysis record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Id:
 *                   type: integer
 *                   example: 1
 *                 office_Id:
 *                   type: integer
 *                   example: 1
 *                 person_Id:
 *                   type: string
 *                   example: "PERSON_001"
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
 *                   example: "09:00:00"
 *                 check_in_sentiment:
 *                   type: string
 *                   enum: [positive, negative, neutral, happy, sad, angry, surprised, fearful, disgusted]
 *                   example: "positive"
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
 *                   example: "17:00:00"
 *                 check_out_capture:
 *                   type: string
 *                   example: "checkout_20240115_170000.jpg"
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
 *         description: Bad request - validation errors or invalid office/camera
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
officeSentimentAnalysisRouter.post('/add', officeSentimentAnalysisValidations, OfficeSentimentAnalysisController.addOfficeSentimentAnalysis)

/**
 * @swagger
 * /office-sentiment-analysis/get:
 *   get:
 *     summary: Get all office sentiment analysis records
 *     tags: [Office Sentiment Analysis]
 *     description: Retrieve a list of all office sentiment analysis records with office and camera details
 *     responses:
 *       200:
 *         description: List of office sentiment analysis records retrieved successfully
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
 *                   office_Id:
 *                     type: integer
 *                     example: 1
 *                   person_Id:
 *                     type: string
 *                     example: "PERSON_001"
 *                   sentiment_of:
 *                     type: string
 *                     enum: [employee, visitor]
 *                     example: "employee"
 *                   check_in_date:
 *                     type: string
 *                     format: date
 *                     example: "2024-01-15"
 *                   check_in_time:
 *                     type: string
 *                     format: time
 *                     example: "09:00:00"
 *                   check_in_sentiment:
 *                     type: string
 *                     enum: [positive, negative, neutral, happy, sad, angry, surprised, fearful, disgusted]
 *                     example: "positive"
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
 *                     example: "17:00:00"
 *                   check_out_capture:
 *                     type: string
 *                     example: "checkout_20240115_170000.jpg"
 *                   exit_camera_Id:
 *                     type: integer
 *                     example: 6
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   offices:
 *                     type: object
 *                     properties:
 *                       office_english_name:
 *                         type: string
 *                         example: "Main Office"
 *                       office_arabic_name:
 *                         type: string
 *                         example: "المكتب الرئيسي"
 *                       latitude:
 *                         type: number
 *                         example: 25.3314
 *                       longitude:
 *                         type: number
 *                         example: 56.3419
 *                   offices_cameras_offices_sentiment_analysis_entry_camera_IdTooffices_cameras:
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
 *                   offices_cameras_offices_sentiment_analysis_exit_camera_IdTooffices_cameras:
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
officeSentimentAnalysisRouter.get('/get', OfficeSentimentAnalysisController.viewOfficeSentimentAnalyses)

export default officeSentimentAnalysisRouter; 