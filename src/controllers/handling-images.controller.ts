import { NextFunction, Request, Response } from 'express';
import { STATUS } from '@/typescript';
import HandlingImagesService from '@/services/handling-images.service';

class HandlingImagesController {
  public static uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.body.file;
      
      if (!file) {
        return res.status(STATUS.BAD_REQUEST).json({
          error: 'No file provided'
        });
      }

      const fileBuffer = Buffer.from(file, 'base64');
      const result = await HandlingImagesService.uploadImage(fileBuffer, 'uploaded-image');
      
      return res.status(STATUS.SUCCESS).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default HandlingImagesController;
