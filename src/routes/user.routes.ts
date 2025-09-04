import { UserController } from "@/controllers";
import { userLoginValidations } from "@/validations";
import { Router } from "express";

const userRouter = Router();

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User login
 *     tags: [Users]
 *     description: Authenticate user with employee code and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - EmpCode
 *               - Password
 *             properties:
 *               EmpCode:
 *                 type: string
 *                 description: Employee code
 *                 example: "EMP001"
 *               Password:
 *                 type: string
 *                 description: User password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   description: User data from third-party API
 *       400:
 *         description: Bad request - missing credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "EmpCode and Password are required"
 *       500:
 *         description: Internal server error
 */
userRouter.post('/login', userLoginValidations, UserController.login)

/**
 * @swagger
 * /users/get/{personId}:
 *   get:
 *     summary: Get user details with all attendance records
 *     tags: [Users]
 *     description: Retrieve complete user information including office and park attendance, sentiment analysis, and summary statistics
 *     parameters:
 *       - in: path
 *         name: personId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID of the user (matches emp_Id in users table)
 *         example: "EMP001"
 *     responses:
 *       200:
 *         description: User details with attendance records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     Id:
 *                       type: integer
 *                       example: 1
 *                     emp_Id:
 *                       type: string
 *                       example: "EMP001"
 *                     emp__eng_name:
 *                       type: string
 *                       example: "John Smith"
 *                     emp__arabic_name:
 *                       type: string
 *                       example: "جون سميث"
 *                     gender:
 *                       type: string
 *                       example: "Male"
 *                     country_code:
 *                       type: string
 *                       example: "+971"
 *                     phone:
 *                       type: string
 *                       example: "501234567"
 *                     email:
 *                       type: string
 *                       example: "john.smith@example.com"
 *                     dep_eng_name:
 *                       type: string
 *                       example: "IT Department"
 *                     dep_arabic_name:
 *                       type: string
 *                       example: "قسم تقنية المعلومات"
 *                     desig_eng_name:
 *                       type: string
 *                       example: "Software Engineer"
 *                     desig_arabic_name:
 *                       type: string
 *                       example: "مهندس برمجيات"
 *                     unit_eng_name:
 *                       type: string
 *                       example: "Development Unit"
 *                     unit_arabic_name:
 *                       type: string
 *                       example: "وحدة التطوير"
 *                     committe_eng_name:
 *                       type: string
 *                       example: "Technical Committee"
 *                     committe_arabic_name:
 *                       type: string
 *                       example: "اللجنة التقنية"
 *                     ai_engine_access:
 *                       type: boolean
 *                       example: true
 *                     last_login:
 *                       type: string
 *                       format: date-time
 *                     role:
 *                       type: string
 *                       example: "Admin"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 office_attendance:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Id:
 *                         type: integer
 *                         example: 1
 *                       office_Id:
 *                         type: integer
 *                         example: 1
 *                       person_Id:
 *                         type: string
 *                         example: "EMP001"
 *                       attendance_of:
 *                         type: string
 *                         enum: [employee, visitor]
 *                         example: "employee"
 *                       check_in_date:
 *                         type: string
 *                         format: date
 *                         example: "2024-01-15"
 *                       check_in_time:
 *                         type: string
 *                         format: time
 *                         example: "09:00:00"
 *                       check_out_date:
 *                         type: string
 *                         format: date
 *                         example: "2024-01-15"
 *                       check_out_time:
 *                         type: string
 *                         format: time
 *                         example: "17:00:00"
 *                       snap_shot:
 *                         type: string
 *                         example: "attendance1.jpg"
 *                       mood:
 *                         type: string
 *                         example: "Happy"
 *                       offices:
 *                         type: object
 *                         properties:
 *                           office_english_name:
 *                             type: string
 *                             example: "Main Office Building"
 *                           office_arabic_name:
 *                             type: string
 *                             example: "المبنى الرئيسي للمكتب"
 *                           latitude:
 *                             type: number
 *                             example: 25.2048
 *                           longitude:
 *                             type: number
 *                             example: 55.2708
 *                 park_attendance:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Id:
 *                         type: integer
 *                         example: 1
 *                       park_Id:
 *                         type: integer
 *                         example: 1
 *                       person_Id:
 *                         type: string
 *                         example: "EMP001"
 *                       attendance_of:
 *                         type: string
 *                         enum: [employee, visitor]
 *                         example: "visitor"
 *                       check_in_date:
 *                         type: string
 *                         format: date
 *                         example: "2024-01-15"
 *                       check_in_time:
 *                         type: string
 *                         format: time
 *                         example: "14:00:00"
 *                       check_out_date:
 *                         type: string
 *                         format: date
 *                         example: "2024-01-15"
 *                       check_out_time:
 *                         type: string
 *                         format: time
 *                         example: "16:00:00"
 *                       snap_shot:
 *                         type: string
 *                         example: "park_attendance1.jpg"
 *                       mood:
 *                         type: string
 *                         example: "Happy"
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
 *                             example: 25.2048
 *                           longitude:
 *                             type: number
 *                             example: 55.2708
 *                 office_sentiment_analysis:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Id:
 *                         type: integer
 *                         example: 1
 *                       office_Id:
 *                         type: integer
 *                         example: 1
 *                       person_Id:
 *                         type: string
 *                         example: "EMP001"
 *                       sentiment_of:
 *                         type: string
 *                         enum: [employee, visitor]
 *                         example: "employee"
 *                       check_in_sentiment:
 *                         type: string
 *                         example: "Positive"
 *                       offices:
 *                         type: object
 *                         properties:
 *                           office_english_name:
 *                             type: string
 *                             example: "Main Office Building"
 *                           office_arabic_name:
 *                             type: string
 *                             example: "المبنى الرئيسي للمكتب"
 *                           latitude:
 *                             type: number
 *                             example: 25.2048
 *                           longitude:
 *                             type: number
 *                             example: 55.2708
 *                 park_sentiment_analysis:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Id:
 *                         type: integer
 *                         example: 1
 *                       park_Id:
 *                         type: integer
 *                         example: 1
 *                       person_Id:
 *                         type: string
 *                         example: "EMP001"
 *                       sentiment_of:
 *                         type: string
 *                         enum: [employee, visitor]
 *                         example: "visitor"
 *                       check_in_sentiment:
 *                         type: string
 *                         example: "Positive"
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
 *                             example: 25.2048
 *                           longitude:
 *                             type: number
 *                             example: 55.2708
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_office_attendance:
 *                       type: integer
 *                       example: 5
 *                     total_park_attendance:
 *                       type: integer
 *                       example: 3
 *                     total_office_sentiment_records:
 *                       type: integer
 *                       example: 2
 *                     total_park_sentiment_records:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Bad request - personId parameter is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "personId parameter is required"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User does not exist"
 *                 status:
 *                   type: integer
 *                   example: 400
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

export default userRouter;
