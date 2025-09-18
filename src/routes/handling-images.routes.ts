import { Router } from 'express';
import HandlingImagesController from '@/controllers/handling-images.controller';

const router = Router();

router.post('/upload', HandlingImagesController.uploadImage);

export default router;
