import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class HandlingImagesService {
  public static uploadImage = async (fileBuffer: Buffer, originalName: string) => {
    try {
      if (!fileBuffer) {
        throw new Error('No file provided');
      }

      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${fileBuffer.toString('base64')}`,
        {
          resource_type: 'auto',
          folder: 'handling-images',
          quality: 'auto',
          format: 'auto'
        }
      );

      return {
        image_url: result.secure_url
      };
    } catch (error) {
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
}

export default HandlingImagesService;
