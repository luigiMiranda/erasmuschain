import { Router } from 'express';
import multer from 'multer';
import { uploadFileToPinata } from '../services/pinata.service.js';
import { BadRequestError, InternalServerError } from '../utils/http-errors.js';
import { env } from '../config/env.js';

const router = Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new BadRequestError('Solo file PDF sono consentiti.', 'Invalid mimetype'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024,
  },
});

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nessun file ricevuto.',
      });
    }

    const { cid } = await uploadFileToPinata(req.file.buffer, req.file.originalname);

    const gatewayUrl = `${env.pinataGatewayBaseUrl}/${cid}`;

    return res.json({
      success: true,
      cid,
      gatewayUrl,
    });
  } catch (err) {
    next(err);
  }
});

export default router;