import { body } from "express-validator";

export const intranetPostingHistoryValidations = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 255 })
        .withMessage('Title must not exceed 255 characters'),
    
    body('intranet_id')
        .trim()
        .notEmpty()
        .withMessage('Intranet ID is required')
        .isLength({ max: 100 })
        .withMessage('Intranet ID must not exceed 100 characters'),
    
    body('comments')
        .trim()
        .notEmpty()
        .withMessage('Comments are required')
        .isLength({ max: 1000 })
        .withMessage('Comments must not exceed 1000 characters'),
];
