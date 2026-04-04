import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { spawn } from 'child_process';
import path from 'path';

export class BackupController {
  /**
   * Download database backup
   * GET /api/backup/download
   * Access: Admin only
   */
  downloadBackup = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const databaseUrl = process.env.DATABASE_URL;

      if (!databaseUrl) {
         res.status(500).json({
          status: 'error',
          message: 'DATABASE_URL environment variable is not defined',
        });
        return;
      }

      const date = new Date().toISOString().split('T')[0];
      const fileName = `backup-${date}.sql`;

      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/sql');

      // Use pg_dump to create a backup
      // Assuming the database is PostgreSQL as suggested by the project structure
      const dump = spawn('pg_dump', [databaseUrl]);

      dump.stdout.pipe(res);

      dump.stderr.on('data', (data) => {
        console.error(`pg_dump error: ${data}`);
      });

      dump.on('close', (code) => {
        if (code !== 0) {
          console.error(`pg_dump process exited with code ${code}`);
          if (!res.headersSent) {
            res.status(500).json({
              status: 'error',
              message: 'Database backup failed',
            });
          }
        }
      });
    } catch (error) {
      console.error('Backup controller error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'Internal server error during backup',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };
}

export const backupController = new BackupController();

