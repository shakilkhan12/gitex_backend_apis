import { body } from "express-validator";

export const userValidations = [
    body('EmpCode').trim().notEmpty().withMessage('Employee code is required'),
    body('Password').trim().notEmpty().withMessage('Password is required'),
];

export const userLoginValidations = [
    body('EmpCode').trim().notEmpty().withMessage('Employee code is required'),
    body('Password').trim().notEmpty().withMessage('Password is required'),
];
