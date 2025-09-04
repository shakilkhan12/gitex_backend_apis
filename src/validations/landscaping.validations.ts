import { body } from "express-validator";

export const landscapingValidations = [
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
    
    body('snap_shot')
        .trim()
        .notEmpty()
        .withMessage('Snap shot is required')
        .isLength({ max: 255 })
        .withMessage('Snap shot must not exceed 255 characters'),
    
    body('type')
        .trim()
        .notEmpty()
        .withMessage('Type is required')
        .isLength({ max: 100 })
        .withMessage('Type must not exceed 100 characters')
        // .isIn(['maintenance', 'planting', 'pruning', 'irrigation', 'cleaning', 'other'])
        // .withMessage('Type must be one of: maintenance, planting, pruning, irrigation, cleaning, other')
        ,
    
    body('status')
        .trim()
        .notEmpty()
        .withMessage('Status is required')
        .isLength({ max: 50 })
        .withMessage('Status must not exceed 50 characters')
        .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
        .withMessage('Status must be one of: pending, in_progress, completed, cancelled'),
]; 