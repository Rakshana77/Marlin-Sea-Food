import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

const ROLES = [
  { name: 'SUPER_ADMIN', description: 'Full access across all system modules' },
  { name: 'ADMIN', description: 'Administrative operations excluding destructive system settings' },
  { name: 'BILLING_STAFF', description: 'Purchase and export billing, fishermen and customer entry' },
  { name: 'VIEWER', description: 'Read-only access to dashboard and reporting metrics' }
];

const PERMISSIONS = [
  { code: 'DASHBOARD', name: 'Dashboard Overview', module: 'Analytics' },
  { code: 'FISHERMEN', name: 'Manage Fishermen', module: 'Master Data' },
  { code: 'CUSTOMERS', name: 'Manage Customers', module: 'Master Data' },
  { code: 'EXPORT_COMPANIES', name: 'Manage Export Companies', module: 'Master Data' },
  { code: 'SEAFOOD', name: 'Manage Seafood Master', module: 'Master Data' },
  { code: 'DAILY_RATES', name: 'Manage Daily Rates', module: 'Pricing' },
  { code: 'PURCHASE_BILLS', name: 'Purchase Billing', module: 'Transactions' },
  { code: 'EXPORT_BILLS', name: 'Export Billing', module: 'Transactions' },
  { code: 'STOCK', name: 'Stock Management', module: 'Inventory' },
  { code: 'EXPENSES', name: 'Expense Tracking', module: 'Finance' },
  { code: 'PAYMENTS', name: 'Payment Records', module: 'Finance' },
  { code: 'PROFIT_AND_LOSS', name: 'P&L Reports', module: 'Finance' },
  { code: 'DAY_END', name: 'Day End Close', module: 'Operations' },
  { code: 'MONTH_END', name: 'Month End Close', module: 'Operations' },
  { code: 'REPORTS', name: 'Business Reports', module: 'Reporting' },
  { code: 'SETTINGS', name: 'System Settings', module: 'Settings' },
  { code: 'USER_MANAGEMENT', name: 'User & Role Management', module: 'Administration' },
  { code: 'AUDIT_LOGS', name: 'Audit Log Trail', module: 'Compliance' }
];

const SEAFOOD_CATEGORIES = [
  { name: 'Fish', description: 'Fin fishes such as Seer, Pomfret, Tuna, Mackerel' },
  { name: 'Prawn', description: 'Tiger prawns, White prawns, Vannamei, Flower prawns' },
  { name: 'Crab', description: 'Mud crabs, Blue swimmer crabs, Three spot crabs' },
  { name: 'Squid', description: 'Cuttlefish, Loligo squid, Octopus' },
  { name: 'Mollusk', description: 'Clams, Oysters, Mussels' },
  { name: 'Other', description: 'Miscellaneous marine and freshwater seafood' }
];

const SEAFOOD_GRADES = [
  { name: 'Grade A', description: 'Export quality, top freshness and size tier' },
  { name: 'Grade B', description: 'Standard domestic market quality tier' },
  { name: 'Grade C', description: 'Processing / local commercial tier' }
];

async function main() {
  logger.info('🌱 Starting Phase 3 database seeding...');

  // 1. Seed Roles
  const roleMap = new Map<string, string>();
  for (const role of ROLES) {
    const record = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role
    });
    roleMap.set(record.name, record.id);
  }
  logger.info(`Seeded ${roleMap.size} roles`);

  // 2. Seed Permissions
  const permMap = new Map<string, string>();
  for (const perm of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module },
      create: perm
    });
    permMap.set(record.code, record.id);
  }
  logger.info(`Seeded ${permMap.size} permissions`);

  // 3. Link SUPER_ADMIN to all permissions
  const superAdminRoleId = roleMap.get('SUPER_ADMIN');
  if (superAdminRoleId) {
    for (const permId of permMap.values()) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRoleId,
            permissionId: permId
          }
        },
        update: {},
        create: {
          roleId: superAdminRoleId,
          permissionId: permId
        }
      });
    }
    logger.info('Linked all permissions to SUPER_ADMIN role');
  }

  // 4. Seed Seafood Categories
  for (const cat of SEAFOOD_CATEGORIES) {
    await prisma.seafoodCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat
    });
  }
  logger.info(`Seeded ${SEAFOOD_CATEGORIES.length} seafood categories`);

  // 5. Seed Seafood Grades
  for (const grade of SEAFOOD_GRADES) {
    await prisma.seafoodGrade.upsert({
      where: { name: grade.name },
      update: { description: grade.description },
      create: grade
    });
  }
  logger.info(`Seeded ${SEAFOOD_GRADES.length} seafood grades`);

  logger.info('Phase 3 database seeding completed successfully');
}

main()
  .catch((e) => {
    logger.error({ err: e }, 'Database seed error');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
