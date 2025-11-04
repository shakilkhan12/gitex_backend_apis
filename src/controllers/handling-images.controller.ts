import { NextFunction, Request, Response } from 'express';
import { STATUS } from '@/typescript';
import HandlingImagesService from '@/services/handling-images.service';

class HandlingImagesController {
  public static uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.body.file;
      console.log(file);
      
      if (!file) {
        return res.status(STATUS.BAD_REQUEST).json({
          error: 'No file provided'
        });
      }

      let base64String = file;
      if (file.startsWith('data:')) {
        base64String = file.split(',')[1];
      }
      
      const fileBuffer = Buffer.from(base64String, 'base64');
      const result = await HandlingImagesService.uploadImage(fileBuffer, 'uploaded-image');
      
      return res.status(STATUS.SUCCESS).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default HandlingImagesController;
