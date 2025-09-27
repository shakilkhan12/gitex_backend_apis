import { LandscapingController } from "@/controllers";
import { landscapingValidations } from "@/validations";
import { Router } from "express";

const landscapingRouter = Router();

/**
 * @swagger
 * /landscaping/add:
 *   post:
 *     summary: Add a new landscaping record
 *     tags: [Landscaping]
 *     description: Create a new landscaping record with auto-generated 6-digit case_Id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 description: Image URL of the landscaping area
 *                 example: "https://example.com/landscaping_image.jpg"
 *               name:
 *                 type: string
 *                 description: Name or title of the landscaping case
 *                 example: "Garden Maintenance"
 *               status:
 *                 type: string
 *                 description: Current status of the landscaping work
 *                 example: "pending"
 *               suggestion:
 *                 type: string
 *                 description: Suggestions or notes for the landscaping work
 *                 example: "Need to trim the bushes and water the plants"
 *     responses:
 *       201:
 *         description: Landscaping record created successfully
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
 *                   example: "Landscaping record created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     case_Id:
 *                       type: string
 *                       example: "123456"
 *                     image:
 *                       type: string
 *                       example: "https://example.com/landscaping_image.jpg"
 *                     name:
 *                       type: string
 *                       example: "Garden Maintenance"
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     suggestion:
 *                       type: string
 *                       example: "Need to trim the bushes and water the plants"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation errors"
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
landscapingRouter.post('/add', landscapingValidations, LandscapingController.addLandscaping)

/**
 * @swagger
 * /landscaping/get:
 *   get:
 *     summary: Get all landscaping records
 *     tags: [Landscaping]
 *     description: Retrieve a list of all landscaping records
 *     responses:
 *       200:
 *         description: List of landscaping records retrieved successfully
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
 *                   example: "Landscaping records retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       case_Id:
 *                         type: string
 *                         example: "123456"
 *                       image:
 *                         type: string
 *                         example: "https://example.com/landscaping_image.jpg"
 *                       name:
 *                         type: string
 *                         example: "Garden Maintenance"
 *                       status:
 *                         type: string
 *                         example: "pending"
 *                       suggestion:
 *                         type: string
 *                         example: "Need to trim the bushes and water the plants"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
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
landscapingRouter.get('/get', LandscapingController.viewLandscapings)

export default landscapingRouter; 