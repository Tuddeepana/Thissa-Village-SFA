import { Router } from 'express';
import { backupController } from '../controllers/backup.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/rbac.middleware';

const router = Router();

/**
 * @route   GET /api/backup/download
 * @desc    Download database backup
 * @access  Private (Admin only)
 */
router.get('/download', authenticate, adminOnly, backupController.downloadBackup);

export default router;

