import * as fs from 'fs';
import * as path from 'path';

class HandlingImagesService {
  private static detectImageFormat(buffer: Buffer): string {
    try {
      if (buffer.length >= 4) {
        if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
          return 'jpg';
        }
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
          return 'png';
        }
        if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
          return 'gif';
        }
        if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
          return 'bmp';
        }
        if (buffer.length >= 12 && 
            buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
            buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
          return 'webp';
        }
      }
      
      return 'jpg';
    } catch (error) {
      return 'jpg';
    }
  }

  public static uploadImage = async (fileBuffer: Buffer, originalName: string) => {
    try {
      if (!fileBuffer) {
        throw new Error('No file provided');
      }

      // Validate buffer has content
      if (fileBuffer.length === 0) {
        throw new Error('Empty image buffer');
      }

      const uploadDir = path.join(process.cwd(), 'uploads', 'event-images');
      
      // Detect image format directly from buffer
      const imageFormat = this.detectImageFormat(fileBuffer);
      const fileName = `${Date.now()}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}.${imageFormat}`;
      const filePath = path.join(uploadDir, fileName);
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, fileBuffer);
      
      const imageUrl = `/uploads/event-images/${fileName}`;
      
      return {
        image_url: imageUrl
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload image: ${errorMessage}`);
    }
  };
}

export default HandlingImagesService;
