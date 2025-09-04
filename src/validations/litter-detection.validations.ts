import { body } from "express-validator";

export const litterDetectionValidations = [
    body('park_Id')
        .isInt({ min: 1 })
        .withMessage('Park ID must be a valid positive integer'),
    
    body('case_Id')
        .trim()
        .notEmpty()
        .withMessage('Case ID is required')
        .isLength({ max: 255 })
        .withMessage('Case ID must not exceed 255 characters'),
    
    body('location')
        .trim()
        .notEmpty()
        .withMessage('Location is required')
        .isLength({ max: 255 })
        .withMessage('Location must not exceed 255 characters'),
    
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
    
    body('status')
        .trim()
        .notEmpty()
        .withMessage('Status is required')
        .isLength({ max: 50 })
        .withMessage('Status must not exceed 50 characters')
        // .isIn(['pending', 'in_progress', 'resolved', 'closed'])
        // .withMessage('Status must be one of: pending, in_progress, resolved, closed'),
]; 