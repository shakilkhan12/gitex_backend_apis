import { body } from "express-validator";

export const smokingDetectionValidations = [
    body('park_Id')
        .isString()
        .withMessage('Park ID must be a valid string'),
    
    body('location')
        .trim()
        .notEmpty()
        .withMessage('Location is required')
        .isLength({ max: 255 })
        .withMessage('Location must not exceed 255 characters'),
    
    body('camera_Id')
        .optional()
        .isString()
        .withMessage('Camera ID must be a valid string'),
    
    body('occurrence_date')
        .isISO8601()
        .withMessage('Occurrence date must be a valid date'),
    
    body('occurrence_time')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage('Occurrence time must be in HH:MM:SS format'),
    
    body('snap_shot')
        .trim()
        .notEmpty()
        .withMessage('Snap shot is required')
        .isLength({ max: 255 })
        .withMessage('Snap shot must not exceed 255 characters'),
    
    body('detection_Id')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Detection ID must not exceed 100 characters'),
    
    body('detection_date')
        .optional()
        .isISO8601()
        .withMessage('Detection date must be a valid date'),
    
    body('detection_time')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage('Detection time must be in HH:MM:SS format'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    
    body('is_employee')
        .optional()
        .isBoolean()
        .withMessage('Is employee must be a boolean value'),
    
    body('current_status')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Current status must not exceed 100 characters'),
    
    body('posted_to_intranet_date')
        .optional()
        .isISO8601()
        .withMessage('Posted to intranet date must be a valid date'),
    
    body('posted_to_intranet_time')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .withMessage('Posted to intranet time must be in HH:MM:SS format'),
]; 