import { OfficeAttendanceController } from "@/controllers";
import { officeAttendanceValidations } from "@/validations";
import { Router } from "express";

const officeAttendanceRouter = Router();

/**
 * @swagger
 * /office-attendance/add:
 *   post:
 *     summary: Add a new office attendance record
 *     tags: [Office Attendance]
 *     description: Create a new office attendance record with person and timing details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - office_Id
 *               - person_Id
 *               - attendance_of
 *               - check_in_date
 *               - check_in_time
 *               - snap_shot
 *               - mood
 *             properties:
 *               office_Id:
 *                 type: integer
 *                 description: ID of the office where attendance is recorded
 *                 example: 1
 *               person_Id:
 *                 type: string
 *                 description: ID of the person whose attendance is recorded
 *                 example: "PERSON_001"
 *               attendance_of:
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
 *               snap_shot:
 *                 type: string
 *                 description: Image path or URL of the attendance capture
 *                 example: "attendance_20240115_090000.jpg"
 *               mood:
 *                 type: string
 *                 enum: [happy, sad, angry, neutral, excited, tired, stressed, relaxed, focused, distracted]
 *                 description: Mood of the person at check-in
 *                 example: "happy"
 *     responses:
 *       201:
 *         description: Office attendance record created successfully
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
 *                 attendance_of:
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
 *                 check_out_date:
 *                   type: string
 *                   format: date
 *                   example: "2024-01-15"
 *                 check_out_time:
 *                   type: string
 *                   format: time
 *                   example: "17:00:00"
 *                 snap_shot:
 *                   type: string
 *                   example: "attendance_20240115_090000.jpg"
 *                 mood:
 *                   type: string
 *                   enum: [happy, sad, angry, neutral, excited, tired, stressed, relaxed, focused, distracted]
 *                   example: "happy"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - validation errors or invalid office
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
officeAttendanceRouter.post('/add', officeAttendanceValidations, OfficeAttendanceController.addOfficeAttendance)

/**
 * @swagger
 * /office-attendance/get:
 *   get:
 *     summary: Get all office attendance records
 *     tags: [Office Attendance]
 *     description: Retrieve a list of all office attendance records with office details
 *     responses:
 *       200:
 *         description: List of office attendance records retrieved successfully
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
 *                   attendance_of:
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
 *                   check_out_date:
 *                     type: string
 *                     format: date
 *                     example: "2024-01-15"
 *                   check_out_time:
 *                     type: string
 *                     format: time
 *                     example: "17:00:00"
 *                   snap_shot:
 *                     type: string
 *                     example: "attendance_20240115_090000.jpg"
 *                   mood:
 *                     type: string
 *                     enum: [happy, sad, angry, neutral, excited, tired, stressed, relaxed, focused, distracted]
 *                     example: "happy"
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
officeAttendanceRouter.get('/get', OfficeAttendanceController.viewOfficeAttendances)

export default officeAttendanceRouter; 