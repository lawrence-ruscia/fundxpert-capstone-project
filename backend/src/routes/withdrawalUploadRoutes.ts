// routes/uploadWithdrawalRoutes.ts
import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../config/supabaseClient.config.js';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { isAuthenticatedRequest } from '../controllers/employeeControllers.js';

export const withdrawalUploadRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

withdrawalUploadRouter.post(
  '/upload',
  authMiddleware('Employee'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      if (!isAuthenticatedRequest(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const bucket = 'withdrawal-documents';

      const originalName = req.file.originalname;
      const fileExt = originalName.split('.').pop();
      const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
      const generateFileName = async () => {
        let fileName = originalName;
        let counter = 1;

        while (true) {
          // Check if file exists
          const { data: existingFile } = await supabase.storage
            .from(bucket)
            .list('', { search: fileName });

          if (!existingFile || existingFile.length === 0) {
            return fileName;
          }

          // If exists, increment counter
          fileName = `${baseName}(${counter}).${fileExt}`;
          counter++;
        }
      };

      const fileName = await generateFileName();

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // create a signed URL (1 hour)
      const { data: signedUrl, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(fileName, 3600);

      if (signedError) throw signedError;

      res.status(201).json({
        fileUrl: signedUrl.signedUrl,
        fileName,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      });
    } catch (err) {
      console.error('❌ Supabase upload error:', err);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
);
