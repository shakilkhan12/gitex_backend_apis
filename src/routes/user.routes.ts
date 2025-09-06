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
userRouter.put('/update/role/:userId',UserController.updateUserRole)

export default userRouter;
