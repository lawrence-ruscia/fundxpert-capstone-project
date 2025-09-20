import { Router } from 'express';
import type { Request } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { supabase } from '../config/supabaseClient.config.js';

export const uploadRouter = Router();

const upload = multer({ storage: multer.memoryStorage() }); // keep file in memory

uploadRouter.post(
  '/upload',
  authMiddleware('Employee'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${req.body.user.id}.${fileExt}`;
      const bucket = 'loan-documents';

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      res.status(201).json({ fileUrl: publicUrl.publicUrl });
    } catch (err) {
      console.error('❌ Supabase upload error:', err);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
);
