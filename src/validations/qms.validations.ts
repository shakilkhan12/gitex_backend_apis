import { body } from "express-validator";

export const qmsValidations = [
   // No validation needed for trigger endpoint as it takes no parameters
];

export const qmsUpdateValidations = [
   body('visit_id')
      .isInt({ min: 1 })
      .withMessage('Visit ID must be a positive integer'),
   
   body('ticket_number')
      .notEmpty()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Ticket number is required and must not exceed 100 characters'),
   
   body('service_english_name')
      .notEmpty()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Service English name is required and must not exceed 255 characters'),
   
   body('service_arabic_name')
      .notEmpty()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Service Arabic name is required and must not exceed 255 characters'),
   
   body('agent_english_name')
      .notEmpty()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Agent English name is required and must not exceed 255 characters'),
   
   body('agent_arabic_name')
      .notEmpty()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Agent Arabic name is required and must not exceed 255 characters'),
   
   body('ticket_date')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Ticket date must be in YYYY-MM-DD format'),
   
   body('issue_time')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
      .withMessage('Issue time must be in HH:MM:SS format'),
   
   body('processing_start_time')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
      .withMessage('Processing start time must be in HH:MM:SS format'),
   
   body('processing_end_time')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
      .withMessage('Processing end time must be in HH:MM:SS format'),
   
   body('waiting_time')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
      .withMessage('Waiting time must be in HH:MM:SS format'),
   
   body('total_processing_time')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
      .withMessage('Total processing time must be in HH:MM:SS format'),
];