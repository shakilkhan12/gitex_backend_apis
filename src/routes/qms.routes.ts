import { QMSController } from "@/controllers";
import { qmsValidations, qmsUpdateValidations } from "@/validations";
import { Router } from "express";

const qmsRouter = Router();

/**
 * @swagger
 * /qms/trigger:
 *   get:
 *     summary: Trigger QMS visit (AI Engine Integration)
 *     tags: [QMS]
 *     description: Trigger the AI engine to capture visitor image and return visit details
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: No parameters required for trigger
 *     responses:
 *       201:
 *         description: QMS visit triggered successfully
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
 *                   example: "QMS visit triggered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     visit_id:
 *                       type: integer
 *                       example: 1
 *                     visitor_id:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     gender:
 *                       type: string
 *                       example: "Male"
 *                     age_group:
 *                       type: string
 *                       example: "Young Adult (18-30)"
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
qmsRouter.get('/trigger', qmsValidations, QMSController.triggerQMSVisit)

/**
 * @swagger
 * /qms/update-visit:
 *   post:
 *     summary: Update QMS visit with ticket details
 *     tags: [QMS]
 *     description: Update the visit record with complete ticket and service information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visit_id
 *               - ticket_number
 *               - service_english_name
 *               - service_arabic_name
 *               - agent_english_name
 *               - agent_arabic_name
 *               - ticket_date
 *               - issue_time
 *               - processing_start_time
 *               - processing_end_time
 *               - waiting_time
 *               - total_processing_time
 *             properties:
 *               visit_id:
 *                 type: integer
 *                 description: Unique visit ID received from trigger API
 *                 example: 1
 *               ticket_number:
 *                 type: string
 *                 description: Ticket number
 *                 example: "CON 1001"
 *               service_english_name:
 *                 type: string
 *                 description: Service name in English
 *                 example: "Contract Renewal"
 *               service_arabic_name:
 *                 type: string
 *                 description: Service name in Arabic
 *                 example: "تجديد العقد"
 *               agent_english_name:
 *                 type: string
 *                 description: Agent name in English
 *                 example: "Usman Shabbir"
 *               agent_arabic_name:
 *                 type: string
 *                 description: Agent name in Arabic
 *                 example: "عثمان شبير"
 *               ticket_date:
 *                 type: string
 *                 format: date
 *                 description: Ticket date
 *                 example: "2025-09-17"
 *               issue_time:
 *                 type: string
 *                 format: time
 *                 description: Issue time
 *                 example: "09:00:00"
 *               processing_start_time:
 *                 type: string
 *                 format: time
 *                 description: Processing start time
 *                 example: "09:01:00"
 *               processing_end_time:
 *                 type: string
 *                 format: time
 *                 description: Processing end time
 *                 example: "09:05:00"
 *               waiting_time:
 *                 type: string
 *                 format: time
 *                 description: Waiting time
 *                 example: "00:00:00"
 *               total_processing_time:
 *                 type: string
 *                 format: time
 *                 description: Total processing time
 *                 example: "00:04:00"
 *     responses:
 *       200:
 *         description: QMS visit updated successfully
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
 *                   example: "QMS visit updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     visit_id:
 *                       type: integer
 *                       example: 1
 *                     visitor_id:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     gender:
 *                       type: string
 *                       example: "Male"
 *                     age_group:
 *                       type: string
 *                       example: "Young Adult (18-30)"
 *                     ticket_number:
 *                       type: string
 *                       example: "CON 1001"
 *                     service_english_name:
 *                       type: string
 *                       example: "Contract Renewal"
 *                     service_arabic_name:
 *                       type: string
 *                       example: "تجديد العقد"
 *                     agent_english_name:
 *                       type: string
 *                       example: "Usman Shabbir"
 *                     agent_arabic_name:
 *                       type: string
 *                       example: "عثمان شبير"
 *                     status:
 *                       type: string
 *                       example: "Completed"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: Visit record not found
 *       500:
 *         description: Internal server error
 */
qmsRouter.post('/update-visit', qmsUpdateValidations, QMSController.updateQMSVisit)

/**
 * @swagger
 * /qms/history:
 *   get:
 *     summary: Get QMS history
 *     tags: [QMS]
 *     description: Retrieve all QMS visit history records
 *     responses:
 *       200:
 *         description: QMS history retrieved successfully
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
 *                   example: "QMS history retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       visit_id:
 *                         type: integer
 *                         example: 1
 *                       visitor_id:
 *                         type: integer
 *                         nullable: true
 *                         example: null
 *                       gender:
 *                         type: string
 *                         example: "Male"
 *                       age_group:
 *                         type: string
 *                         example: "Young Adult (18-30)"
 *                       ticket_number:
 *                         type: string
 *                         example: "CON 1001"
 *                       service_english_name:
 *                         type: string
 *                         example: "Contract Renewal"
 *                       service_arabic_name:
 *                         type: string
 *                         example: "تجديد العقد"
 *                       agent_english_name:
 *                         type: string
 *                         example: "Usman Shabbir"
 *                       agent_arabic_name:
 *                         type: string
 *                         example: "عثمان شبير"
 *                       ticket_date:
 *                         type: string
 *                         format: date
 *                         example: "2025-09-17"
 *                       issue_time:
 *                         type: string
 *                         format: time
 *                         example: "09:00:00"
 *                       processing_start_time:
 *                         type: string
 *                         format: time
 *                         example: "09:01:00"
 *                       processing_end_time:
 *                         type: string
 *                         format: time
 *                         example: "09:05:00"
 *                       waiting_time:
 *                         type: string
 *                         format: time
 *                         example: "00:00:00"
 *                       total_processing_time:
 *                         type: string
 *                         format: time
 *                         example: "00:04:00"
 *                       entry_image:
 *                         type: string
 *                         example: "https://cloudinary.com/image.jpg"
 *                       entry_camera:
 *                         type: string
 *                         example: "288"
 *                       entry_mode:
 *                         type: string
 *                         example: "AI_Detection"
 *                       status:
 *                         type: string
 *                         example: "Completed"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Internal server error
 */
qmsRouter.get('/history', QMSController.viewQMSHistory)
qmsRouter.get('/history/export/excel', QMSController.exportQMSHistoryExcel)
qmsRouter.get('/history/export/pdf', QMSController.exportQMSHistoryPdf)

export default qmsRouter;