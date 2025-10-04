import { NextFunction, Request, Response } from "express";
import { STATUS } from "@/typescript";
import fs from 'fs';
import path from 'path';

class TestingController {
   public static listImages = async (req: Request, res: Response, next: NextFunction) => {
      try {
         const { folderName } = req.params;
         
         // Validate folder name
         if (!folderName || !['landscaping_images', 'irrigation_images'].includes(folderName)) {
            return res.status(STATUS.BAD_REQUEST).json({
               success: false,
               message: "Invalid folder name. Must be 'landscaping_images' or 'irrigation_images'"
            });
         }

         // Construct the path to the images folder
         const imagesPath = path.join(process.cwd(), '..', 'testing', folderName);
         
         // Check if directory exists
         if (!fs.existsSync(imagesPath)) {
            return res.status(STATUS.NOT_FOUND).json({
               success: false,
               message: `Images folder '${folderName}' not found`
            });
         }

         // Read directory contents
         const files = fs.readdirSync(imagesPath);
         
         // Filter for image files only
         const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
         const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return imageExtensions.includes(ext);
         });

         return res.status(STATUS.SUCCESS).json({
            success: true,
            message: `Found ${imageFiles.length} images in ${folderName}`,
            data: {
               folder: folderName,
               totalFiles: files.length,
               imageFiles: imageFiles,
               count: imageFiles.length
            }
         });

      } catch (error: any) {
         console.error('[TestingController] Error listing images:', error.message);
         return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to list images",
            error: error.message
         });
      }
   }
}

export default TestingController;