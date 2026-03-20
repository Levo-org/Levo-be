import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Conversation from '@/models/Conversation';
import Listening from '@/models/Listening';
import Reading from '@/models/Reading';
import ImportBatch from '@/models/ImportBatch';
import AuditLog from '@/models/AuditLog';
import mongoose from 'mongoose';
import { ApiError } from '@/utils/ApiError';

export class OpsController {
  getDashboard = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // content counts by status per type
      const contentModels = [
        { name: 'vocabulary', model: Vocabulary },
        { name: 'grammar', model: Grammar },
        { name: 'conversation', model: Conversation },
        { name: 'listening', model: Listening },
        { name: 'reading', model: Reading },
      ];

      const contentCountsPromise = Promise.all(
        contentModels.map(async (entry) => {
          const agg = await entry.model.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]);
          const map: Record<string, number> = {};
          for (const e of agg) map[e._id as string] = e.count as number;
          return { type: entry.name, counts: map };
        }),
      );

      // import batch counts by status
      const batchCountsPromise = ImportBatch.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      // last 5 failed batches
      const failedBatchesPromise = ImportBatch.find({ status: 'failed' }).sort({ createdAt: -1 }).limit(5);

      // last 10 audit logs
      const auditLogsPromise = AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('actor', 'name email');

      // publishing activity: count of publish actions in audit logs for 24h, 7d, 30d
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const publishingActivityPromise = Promise.all([
        AuditLog.countDocuments({ action: 'publish', createdAt: { $gte: dayAgo } }),
        AuditLog.countDocuments({ action: 'publish', createdAt: { $gte: weekAgo } }),
        AuditLog.countDocuments({ action: 'publish', createdAt: { $gte: monthAgo } }),
      ]);

      const [contentCounts, batchCounts, failedBatches, recentAuditLogs, publishingActivityCounts] = await Promise.all([
        contentCountsPromise,
        batchCountsPromise,
        failedBatchesPromise,
        auditLogsPromise,
        publishingActivityPromise,
      ]);

      const contentStats: Record<string, Record<string, number>> = {};
      for (const c of contentCounts) contentStats[c.type] = c.counts;

      const batchStats: Record<string, number> = {};
      for (const b of batchCounts) batchStats[b._id as string] = b.count as number;

      const dashboardData = {
        contentStats,
        batchStats,
        recentFailures: failedBatches,
        recentAuditLogs,
        publishingActivity: {
          last24h: publishingActivityCounts[0],
          last7d: publishingActivityCounts[1],
          last30d: publishingActivityCounts[2],
        },
      };

      return ApiResponse.success(res, dashboardData);
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(err);
    }
  };

  getHealth = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const dbState = mongoose.connection.readyState; // 1 = connected

      const collections: Record<string, number> = {};
      const colNames = ['vocabularies', 'grammars', 'conversations', 'listenings', 'readings', 'importbatches', 'auditlogs'];
      for (const name of colNames) {
        try {
          const col = mongoose.connection.collections[name];
          collections[name] = col ? await col.countDocuments() : 0;
        } catch {
          collections[name] = -1;
        }
      }

      return ApiResponse.success(res, {
        db: dbState === 1 ? 'connected' : 'disconnected',
        collections,
      });
    } catch (err) {
      next(err);
    }
  };
}

export default new OpsController();
