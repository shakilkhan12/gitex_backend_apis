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

userRouter.get('/get',UserController.getUsers)

/**
 * @swagger
 * /users/get-details:
 *   post:
 *     summary: Get user details by user_Id
 *     tags: [Users]
 *     description: Retrieve detailed user information including role data by providing user_Id in request body
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_Id
 *             properties:
 *               user_Id:
 *                 type: string
 *                 description: Unique user identifier
 *                 example: "36784239eafd68f930b48af7ba423a3a"
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Id:
 *                   type: number
 *                   example: 1
 *                 emp_Id:
 *                   type: string
 *                   example: "27310"
 *                 gender:
 *                   type: string
 *                   example: "M"
 *                 image:
 *                   type: string
 *                   example: "https://example.com/image.jpg"
 *                 emp__eng_name:
 *                   type: string
 *                   example: "Muhammad Usman Shabbir"
 *                 emp__arabic_name:
 *                   type: string
 *                   example: "محمد عثمان شبير"
 *                 country_code:
 *                   type: string
 *                   example: "+971"
 *                 phone:
 *                   type: string
 *                   example: "0501234567"
 *                 email:
 *                   type: string
 *                   example: "mohd.o@shjmun.gov.ae"
 *                 dep_eng_name:
 *                   type: string
 *                   example: "Environment Department"
 *                 dep_arabic_name:
 *                   type: string
 *                   example: "قسم البيئة"
 *                 desig_eng_name:
 *                   type: string
 *                   example: "Computer Software Engineer"
 *                 desig_arabic_name:
 *                   type: string
 *                   example: "مهندس برمجيات"
 *                 unit_eng_name:
 *                   type: string
 *                   example: "IT Support Unit"
 *                 unit_arabic_name:
 *                   type: string
 *                   example: "وحدة الدعم التقني"
 *                 committe_eng_name:
 *                   type: string
 *                   example: "Technical Committee"
 *                 committe_arabic_name:
 *                   type: string
 *                   example: "اللجنة التقنية"
 *                 ai_engine_access:
 *                   type: boolean
 *                   example: true
 *                 last_login:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00Z"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00Z"
 *                 users_roles:
 *                   type: object
 *                   properties:
 *                     role_name:
 *                       type: string
 *                       example: "Super Admin"
 *                     users_permissions:
 *                       type: object
 *                       properties:
 *                         dashboard_view:
 *                           type: boolean
 *                           example: true
 *                         role_permission_view:
 *                           type: boolean
 *                           example: true
 *                         role_permission_add:
 *                           type: boolean
 *                           example: true
 *                         role_permission_update:
 *                           type: boolean
 *                           example: true
 *                         offices_view:
 *                           type: boolean
 *                           example: true
 *                         offices_add:
 *                           type: boolean
 *                           example: true
 *                         offices_update:
 *                           type: boolean
 *                           example: true
 *                         parks_view:
 *                           type: boolean
 *                           example: true
 *                         parks_add:
 *                           type: boolean
 *                           example: true
 *                         parks_update:
 *                           type: boolean
 *                           example: true
 *                         system_report_view:
 *                           type: boolean
 *                           example: true
 *                         alerts_view:
 *                           type: boolean
 *                           example: true
 *                         office_attendance_view:
 *                           type: boolean
 *                           example: true
 *                         office_attendance_add:
 *                           type: boolean
 *                           example: true
 *                         office_attendance_update:
 *                           type: boolean
 *                           example: true
 *                         office_footfall_view:
 *                           type: boolean
 *                           example: true
 *                         office_footfall_add:
 *                           type: boolean
 *                           example: true
 *                         office_footfall_update:
 *                           type: boolean
 *                           example: true
 *                         office_sentimental_view:
 *                           type: boolean
 *                           example: true
 *                         office_sentimental_add:
 *                           type: boolean
 *                           example: true
 *                         office_sentimental_update:
 *                           type: boolean
 *                           example: true
 *                         park_attendance_view:
 *                           type: boolean
 *                           example: true
 *                         park_attendance_add:
 *                           type: boolean
 *                           example: true
 *                         park_attendance_update:
 *                           type: boolean
 *                           example: true
 *                         park_footfall_view:
 *                           type: boolean
 *                           example: true
 *                         park_footfall_add:
 *                           type: boolean
 *                           example: true
 *                         park_footfall_update:
 *                           type: boolean
 *                           example: true
 *                         park_sentimental_view:
 *                           type: boolean
 *                           example: true
 *                         park_sentimental_add:
 *                           type: boolean
 *                           example: true
 *                         park_sentimental_update:
 *                           type: boolean
 *                           example: true
 *                         park_irrigation_view:
 *                           type: boolean
 *                           example: true
 *                         park_irrigation_add:
 *                           type: boolean
 *                           example: true
 *                         park_irrigation_update:
 *                           type: boolean
 *                           example: true
 *                         park_landscaping_view:
 *                           type: boolean
 *                           example: true
 *                         park_landscaping_add:
 *                           type: boolean
 *                           example: true
 *                         park_landscaping_update:
 *                           type: boolean
 *                           example: true
 *                         park_litter_detection_view:
 *                           type: boolean
 *                           example: true
 *                         park_litter_detection_add:
 *                           type: boolean
 *                           example: true
 *                         park_litter_detection_update:
 *                           type: boolean
 *                           example: true
 *                         park_intrusion_detection_view:
 *                           type: boolean
 *                           example: true
 *                         park_intrusion_detection_add:
 *                           type: boolean
 *                           example: true
 *                         park_intrusion_detection_update:
 *                           type: boolean
 *                           example: true
 *                         park_smoking_detection_view:
 *                           type: boolean
 *                           example: true
 *                         park_smoking_detection_add:
 *                           type: boolean
 *                           example: true
 *                         park_smoking_detection_update:
 *                           type: boolean
 *                           example: true
 *                         my_account_view:
 *                           type: boolean
 *                           example: true
 *                         settings_view:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Bad request - missing user_Id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "user_Id is required"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 */
userRouter.post('/get-details', UserController.getUserDetails)

userRouter.put('/update/role/:userId',UserController.updateUserRole)

/**
 * @swagger
 * /users/fetch-employees:
 *   post:
 *     summary: Fetch and store employee listing from third-party API
 *     tags: [Users]
 *     description: Fetches employee data from third-party API and stores it in the database. Updates existing users with new data, creates new users if they don't exist. Expects response format: { "status": "SUCCESS", "code": 200, "data": { "UserListing": [...] } }
 *     responses:
 *       200:
 *         description: Employee listing fetch and store completed successfully
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
 *                   example: "Employee listing fetch and store completed - existing users updated, new users created"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Total number of employees received from API
 *                       example: 150
 *                     processed:
 *                       type: number
 *                       description: Number of employees successfully processed (created or updated)
 *                       example: 148
 *                     errors:
 *                       type: number
 *                       description: Number of employees that failed to process
 *                       example: 2
 *       400:
 *         description: Bad request - API error or configuration issue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Secret key not configured"
 *       500:
 *         description: Internal server error
 */
userRouter.post('/fetch-employees', UserController.fetchAndStoreEmployeeListing)

export default userRouter;
