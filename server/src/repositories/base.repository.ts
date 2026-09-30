import { prisma } from '../lib/prisma';

/**
 * Base repository pattern foundation for data access abstraction
 */
export abstract class BaseRepository {
  protected readonly db = prisma;
}
