import { HttpException } from "@/utils/HttpException.utils";
import { NextFunction, Request, Response } from "express";

export const errorHandler = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
        const status: number = error.status || 500;
        const message: string = error.message || 'Something went wrong';
        
        // Log detailed error information
        console.error(`[ErrorHandler] ${req.method} ${req.path} - Status: ${status}`, {
            message: error.message,
            stack: error.stack,
            body: req.body,
            query: req.query,
            params: req.params,
            timestamp: new Date().toISOString()
        });
        
        res.status(status).json({ 
            message,
            status,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        });     
}