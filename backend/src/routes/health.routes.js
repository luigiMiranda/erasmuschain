import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'erasmuschain-backend',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;