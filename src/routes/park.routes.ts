import { ParkController } from "@/controllers";
import { parkValidations } from "@/validations";
import { Router } from "express";

const parkRouter = Router();

/**
 * @swagger
 * /parks/add:
 *   post:
 *     summary: Add a new park
 *     tags: [Parks]
 *     description: Create a new park with the provided details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - park_Id
 *               - park_english_name
 *               - park_arabic_name
 *               - image
 *               - latitude
 *               - longitude
 *             properties:
 *               park_Id:
 *                 type: string
 *                 description: Unique park identifier
 *                 example: "PARK001"
 *               park_english_name:
 *                 type: string
 *                 description: Park name in English
 *                 example: "Central Park"
 *               park_arabic_name:
 *                 type: string
 *                 description: Park name in Arabic
 *                 example: "الحديقة المركزية"
 *               image:
 *                 type: string
 *                 description: Park image URL or path
 *                 example: "park_image.jpg"
 *               latitude:
 *                 type: number
 *                 format: float
 *                 description: Park latitude coordinate
 *                 example: 25.3314
 *               longitude:
 *                 type: number
 *                 format: float
 *                 description: Park longitude coordinate
 *                 example: 56.3419
 *     responses:
 *       201:
 *         description: Park created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Park'
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
parkRouter.post('/add', parkValidations, ParkController.addPark)

/**
 * @swagger
 * /parks/get:
 *   get:
 *     summary: Get all parks
 *     tags: [Parks]
 *     description: Retrieve a list of all parks in the system
 *     responses:
 *       200:
 *         description: List of parks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Park'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
parkRouter.get('/get', ParkController.viewParks)

/**
 * @swagger
 * /parks/get/{id}:
 *   get:
 *     summary: Get park by ID
 *     tags: [Parks]
 *     description: Retrieve a specific park by its database ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Park database ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Park retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Park'
 *       404:
 *         description: Park not found
 *       500:
 *         description: Internal server error
 */
parkRouter.get('/get/:id', ParkController.getParkById)

/**
 * @swagger
 * /parks/get/parkId/{parkId}:
 *   get:
 *     summary: Get park by park ID
 *     tags: [Parks]
 *     description: Retrieve a specific park by its park ID
 *     parameters:
 *       - in: path
 *         name: parkId
 *         required: true
 *         schema:
 *           type: string
 *         description: Park ID
 *         example: "PARK001"
 *     responses:
 *       200:
 *         description: Park retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Park'
 *       404:
 *         description: Park not found
 *       500:
 *         description: Internal server error
 */
parkRouter.get('/get/parkId/:parkId', ParkController.getParkByParkId)

/**
 * @swagger
 * /parks/statistics/{id}:
 *   get:
 *     summary: Get park statistics
 *     tags: [Parks]
 *     description: Retrieve statistics for a specific park
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Park database ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Park statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attendance:
 *                   type: integer
 *                   description: Number of attendance records
 *                 sentimentAnalysis:
 *                   type: integer
 *                   description: Number of sentiment analysis records
 *                 behaviorAlerts:
 *                   type: integer
 *                   description: Number of behavior alert records
 *                 intrusionDetection:
 *                   type: integer
 *                   description: Number of intrusion detection records
 *                 smokingDetection:
 *                   type: integer
 *                   description: Number of smoking detection records
 *                 landscaping:
 *                   type: integer
 *                   description: Number of landscaping records
 *                 litterDetection:
 *                   type: integer
 *                   description: Number of litter detection records
 *                 irrigationJobs:
 *                   type: integer
 *                   description: Number of irrigation job records
 *                 footfallAnalysis:
 *                   type: integer
 *                   description: Number of footfall analysis records
 *       404:
 *         description: Park not found
 *       500:
 *         description: Internal server error
 */
parkRouter.get('/statistics/:id', ParkController.getParkStatistics)

export default parkRouter;