import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { FishermanService } from '../src/services/fisherman.service';
import { CustomerService } from '../src/services/customer.service';
import { ExportCompanyService } from '../src/services/exportCompany.service';
import { SeafoodCategoryService } from '../src/services/seafoodCategory.service';
import { SeafoodGradeService } from '../src/services/seafoodGrade.service';
import { SeafoodService } from '../src/services/seafood.service';
import { UserService } from '../src/services/user.service';
import { RoleService } from '../src/services/role.service';
import { PermissionService } from '../src/services/permission.service';
import { AppError } from '../src/utils/appError';

describe('Phase 3 Core Master Data Tests', () => {
  const fishermanService = new FishermanService();
  const customerService = new CustomerService();
  const exportCompanyService = new ExportCompanyService();
  const categoryService = new SeafoodCategoryService();
  const gradeService = new SeafoodGradeService();
  const seafoodService = new SeafoodService();
  const userService = new UserService();
  const roleService = new RoleService();
  const permissionService = new PermissionService();

  const testSuffix = Date.now().toString().slice(-6);
  let createdFishermanId: string;
  let createdCategoryId: string;
  let createdGradeId: string;
  let createdSeafoodId: string;
  let createdCustomerId: string;
  let createdExportCompanyId: string;
  let createdUserId: string;

  before(async () => {
    // Ensure database connection
    await prisma.$queryRaw`SELECT 1;`;
  });

  after(async () => {
    // Clean up created test entities
    if (createdUserId) await prisma.user.deleteMany({ where: { id: createdUserId } });
    if (createdSeafoodId) await prisma.seafood.deleteMany({ where: { id: createdSeafoodId } });
    if (createdCategoryId) await prisma.seafoodCategory.deleteMany({ where: { id: createdCategoryId } });
    if (createdGradeId) await prisma.seafoodGrade.deleteMany({ where: { id: createdGradeId } });
    if (createdFishermanId) await prisma.fisherman.deleteMany({ where: { id: createdFishermanId } });
    if (createdCustomerId) await prisma.customer.deleteMany({ where: { id: createdCustomerId } });
    if (createdExportCompanyId) await prisma.exportCompany.deleteMany({ where: { id: createdExportCompanyId } });
  });

  test('Database schema verification: Prisma queries database models cleanly', async () => {
    const roles = await prisma.role.findMany({ take: 1 });
    assert.ok(Array.isArray(roles), 'Roles array should be returned');
  });

  test('Roles and permissions relationships: Seeded SUPER_ADMIN has linked permissions', async () => {
    const superAdmin = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
      include: { permissions: { include: { permission: true } } }
    });
    assert.ok(superAdmin, 'SUPER_ADMIN role must exist');
    assert.ok(superAdmin.permissions.length > 0, 'SUPER_ADMIN must have linked permissions');
  });

  test('Fisherman creation: Successfully creates a fisherman with required fields', async () => {
    const phone = `9840${testSuffix}`;
    const fisherman = await fishermanService.createFisherman({
      name: `Ramesh Fisherman ${testSuffix}`,
      countryCode: '+91',
      mobileNumber: phone,
      boatName: 'Sea Queen',
      boatRegistration: `IND-${testSuffix}`
    });

    createdFishermanId = fisherman.id;
    assert.strictEqual(fisherman.name, `Ramesh Fisherman ${testSuffix}`);
    assert.strictEqual(fisherman.countryCode, '+91');
    assert.strictEqual(fisherman.mobileNumber, phone);
    assert.strictEqual(fisherman.status, 'ACTIVE');
  });

  test('Duplicate fisherman handling: Prevents duplicate (countryCode, mobileNumber)', async () => {
    const phone = `9840${testSuffix}`;
    await assert.rejects(
      async () => {
        await fishermanService.createFisherman({
          name: 'Duplicate Fisherman',
          countryCode: '+91',
          mobileNumber: phone
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'CONFLICT');
        return true;
      }
    );
  });

  test('Customer creation: Successfully creates a customer record', async () => {
    const phone = `9940${testSuffix}`;
    const customer = await customerService.createCustomer({
      name: `Ocean Fresh Customer ${testSuffix}`,
      countryCode: '+91',
      mobileNumber: phone,
      email: `customer${testSuffix}@example.com`,
      address: 'Harbour Road, Chennai'
    });

    createdCustomerId = customer.id;
    assert.strictEqual(customer.name, `Ocean Fresh Customer ${testSuffix}`);
    assert.strictEqual(customer.status, 'ACTIVE');
  });

  test('Export Company creation: Successfully creates an export company with GST/tax details', async () => {
    const company = await exportCompanyService.createExportCompany({
      companyName: `Global Seafood Exports ${testSuffix}`,
      contactPerson: 'Mr. Mansoor',
      countryCode: '+91',
      mobileNumber: `9740${testSuffix}`,
      email: `export${testSuffix}@example.com`,
      taxNumber: `33ABCDE${testSuffix}F1Z5`
    });

    createdExportCompanyId = company.id;
    assert.strictEqual(company.companyName, `Global Seafood Exports ${testSuffix}`);
    assert.strictEqual(company.taxNumber, `33ABCDE${testSuffix}F1Z5`);
  });

  test('Seafood category creation: Creates unique category', async () => {
    const catName = `Shellfish_${testSuffix}`;
    const cat = await categoryService.createCategory({
      name: catName,
      description: 'Test category for mollusks and shellfish'
    });

    createdCategoryId = cat.id;
    assert.strictEqual(cat.name, catName);
    assert.strictEqual(cat.active, true);
  });

  test('Seafood grade creation: Creates unique grade', async () => {
    const gradeName = `Grade_Special_${testSuffix}`;
    const grade = await gradeService.createGrade({
      name: gradeName,
      description: 'Super Premium Grade'
    });

    createdGradeId = grade.id;
    assert.strictEqual(grade.name, gradeName);
  });

  test('Seafood creation: Successfully creates seafood linked to category', async () => {
    const seafood = await seafoodService.createSeafood({
      name: `Tiger Prawn ${testSuffix}`,
      categoryId: createdCategoryId,
      unit: 'KG',
      description: 'High grade export tiger prawns'
    });

    createdSeafoodId = seafood.id;
    assert.strictEqual(seafood.name, `Tiger Prawn ${testSuffix}`);
    assert.strictEqual(seafood.categoryId, createdCategoryId);
    assert.strictEqual(seafood.unit, 'KG');
    assert.strictEqual(seafood.category.name, `Shellfish_${testSuffix}`);
  });

  test('Foreign-key validation: Fails with 400 when categoryId does not exist', async () => {
    await assert.rejects(
      async () => {
        await seafoodService.createSeafood({
          name: 'Invalid Fish',
          categoryId: '00000000-0000-0000-0000-000000000000'
        });
      },
      (err: AppError) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  test('User creation & security: Hashes password and NEVER returns passwordHash', async () => {
    const superAdminRole = await roleService.getRoleById(
      (await prisma.role.findFirstOrThrow({ where: { name: 'SUPER_ADMIN' } })).id
    );

    const user = await userService.createUser({
      name: `Staff Member ${testSuffix}`,
      email: `staff_${testSuffix}@marlinfish.com`,
      password: 'SecurePassword123!',
      roleId: superAdminRole.id
    });

    createdUserId = user.id;
    assert.strictEqual(user.name, `Staff Member ${testSuffix}`);
    assert.strictEqual(user.email, `staff_${testSuffix}@marlinfish.com`);
    assert.strictEqual(user.roleId, superAdminRole.id);

    // CRITICAL: passwordHash must NOT be present on user object
    // @ts-expect-error Checking that passwordHash is omitted
    assert.strictEqual(user.passwordHash, undefined, 'passwordHash must be omitted from return payload');

    // Verify raw database row has hashed password
    const rawUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.notStrictEqual(rawUser.passwordHash, 'SecurePassword123!');
    assert.ok(rawUser.passwordHash.includes(':'), 'Password must be stored as salt:hash');
  });

  test('Permission listing: Returns seeded permissions grouped by module', async () => {
    const permissions = await permissionService.getPermissions();
    assert.ok(permissions.length >= 18, 'At least 18 permissions must exist');
    const modules = new Set(permissions.map((p) => p.module));
    assert.ok(modules.has('Master Data'), 'Master Data module permissions must exist');
    assert.ok(modules.has('Finance'), 'Finance module permissions must exist');
  });
});
