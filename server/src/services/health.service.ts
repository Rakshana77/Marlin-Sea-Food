import { env } from '../config/env';
import { prisma } from '../lib/prisma';

export interface HealthStatus {
  status: 'healthy' | 'degraded';
  timestamp: string;
  uptime: number;
  uptimeSeconds: number;
  environment: string;
  version: string;
  database: 'connected' | 'disconnected';
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
}

export class HealthService {
  public static async getHealth(): Promise<HealthStatus> {
    let databaseStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      // 5-second timeout to accommodate remote pooler handshake latency
      await Promise.race([
        prisma.$queryRaw`SELECT 1;`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 5000))
      ]);
      databaseStatus = 'connected';
    } catch {
      databaseStatus = 'disconnected';
    }

    const memoryUsage = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());

    return {
      status: databaseStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: uptimeSec,
      uptimeSeconds: uptimeSec,
      environment: env.NODE_ENV,
      version: '1.0.0',
      database: databaseStatus,
      memory: {
        heapUsedMB: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMB: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
        rssMB: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100
      }
    };
  }
}
