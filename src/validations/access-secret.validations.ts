import { body } from "express-validator";

export const accessSecretValidations = [
    body('value').trim().notEmpty().withMessage('Secret value is required'),
];
