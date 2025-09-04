import { body } from "express-validator";

export const smokingDetectionValidations = [
    body('park_Id')
        .isInt({ min: 1 })
        .withMessage('Park ID must be a valid positive integer'),
    
    body('location')
        .trim()
        .notEmpty()
        .withMessage('Location is required')
        .isLength({ max: 255 })
        .withMessage('Location must not exceed 255 characters'),
    
    body('camera_Id')
        .isInt({ min: 1 })
        .withMessage('Camera ID must be a valid positive integer'),
    
    body('occurrence_date')
        .isISO8601()
        .withMessage('Occurrence date must be a valid date'),
    
    body('occurrence_time')
        .isISO8601()
        .withMessage('Occurrence time must be a valid time'),
    
    body('snap_shot')
        .trim()
        .notEmpty()
        .withMessage('Snap shot is required')
        .isLength({ max: 255 })
        .withMessage('Snap shot must not exceed 255 characters'),
    
    body('posted_to_intranet_date')
        .optional()
        .isISO8601()
        .withMessage('Posted to intranet date must be a valid date'),
    
    body('posted_to_intranet_time')
        .optional()
        .isISO8601()
        .withMessage('Posted to intranet time must be a valid time'),
]; 