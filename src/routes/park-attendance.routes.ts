import { ParkAttendanceController } from "@/controllers";
import { parkAttendanceValidations } from "@/validations";
import { Router } from "express";

const parkAttendanceRouter = Router();

/**
 * @swagger
 * /park-attendance/add:
 *   post:
 *     summary: Add a new park attendance record
 *     tags: [Park Attendance]
 *     description: Create a new park attendance record with person and timing details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - park_Id
 *               - person_Id
 *               - attendance_of
 *               - check_in_date
 *               - check_in_time
 *               - snap_shot
 *               - mood
 *             properties:
 *               park_Id:
 *                 type: integer
 *                 description: ID of the park where attendance is recorded
 *                 example: 1
 *               person_Id:
 *                 type: string
 *                 description: ID of the person whose attendance is recorded
 *                 example: "PERSON_001"
 *               attendance_of:
 *                 type: string
 *                 enum: [employee, visitor]
 *                 description: Type of person (employee or visitor)
 *                 example: "visitor"
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
 *               snap_shot:
 *                 type: string
 *                 description: Image path or URL of the attendance capture
 *                 example: "attendance_20240115_100000.jpg"
 *               mood:
 *                 type: string
 *                 enum: [happy, sad, angry, neutral, excited, tired, stressed, relaxed, focused, distracted]
 *                 description: Mood of the person at check-in
 *                 example: "excited"
 *     responses:
 *       201:
 *         description: Park attendance record created successfully
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
 *                   example: "PERSON_001"
 *                 attendance_of:
 *                   type: string
 *                   enum: [employee, visitor]
 *                   example: "visitor"
 *                 check_in_date:
 *                   type: string
 *                   format: date
 *                   example: "2024-01-15"
 *                 check_in_time:
 *                   type: string
 *                   format: time
 *                   example: "10:00:00"
 *                 check_out_date:
 *                   type: string
 *                   format: date
 *                   example: "2024-01-15"
 *                 check_out_time:
 *                   type: string
 *                   format: time
 *                   example: "18:00:00"
 *                 snap_shot:
 *                   type: string
 *                   example: "attendance_20240115_100000.jpg"
 *                 mood:
 *                   type: string
 *                   enum: [happy, sad, angry, neutral, excited, tired, stressed, relaxed, focused, distracted]
 *                   example: "excited"
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
parkAttendanceRouter.post('/add', parkAttendanceValidations, ParkAttendanceController.addParkAttendance)

/**
 * @swagger
 * /park-attendance/get:
 *   get:
 *     summary: Get all park attendance records
 *     tags: [Park Attendance]
 *     description: Retrieve a list of all park attendance records with park details
 *     responses:
 *       200:
 *         description: List of park attendance records retrieved successfully
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
 *                   attendance_of:
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
 *                   check_out_date:
 *                     type: string
 *                     format: date
 *                     example: "2024-01-15"
 *                   check_out_time:
 *                     type: string
 *                     format: time
 *                     example: "18:00:00"
 *                   snap_shot:
 *                     type: string
 *                     example: "attendance_20240115_100000.jpg"
 *                   mood:
 *                     type: string
 *                     enum: [happy, sad, angry, neutral, excited, tired, stressed, relaxed, focused, distracted]
 *                     example: "excited"
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
parkAttendanceRouter.get('/get', ParkAttendanceController.viewParkAttendances)

export default parkAttendanceRouter; 