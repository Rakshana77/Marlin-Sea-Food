import { BaseRepository } from './base.repository';
import { Prisma, PurchaseBill } from '@prisma/client';

export type PurchaseBillWithRelations = PurchaseBill & {
  fisherman: {
    id: string;
    name: string;
    countryCode: string;
    mobileNumber: string;
  };
  items: Array<{
    id: string;
    seafoodId: string;
    gradeId: string;
    quantityKg: Prisma.Decimal;
    purchaseRate: Prisma.Decimal;
    amount: Prisma.Decimal;
    seafood: {
      id: string;
      name: string;
      unit: string;
      category?: {
        id: string;
        name: string;
      };
    };
    grade: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
  payments: Array<{
    id: string;
    amount: Prisma.Decimal;
    paymentMethod: string;
    paymentStatus: string;
    paymentDate: Date;
    referenceNumber: string | null;
    notes: string | null;
  }>;
  createdBy?: {
    id: string;
    name: string;
  } | null;
};

export class PurchaseBillRepository extends BaseRepository {
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.PurchaseBillWhereInput;
    orderBy?: Prisma.PurchaseBillOrderByWithRelationInput;
  }): Promise<PurchaseBillWithRelations[]> {
    return this.db.purchaseBill.findMany({
      skip: params.skip,
      take: params.take,
      where: { deletedAt: null, ...params.where },
      include: {
        fisherman: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            mobileNumber: true
          }
        },
        items: {
          include: {
            seafood: {
              select: {
                id: true,
                name: true,
                unit: true,
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            grade: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            paymentStatus: true,
            paymentDate: true,
            referenceNumber: true,
            notes: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: params.orderBy || [{ billDate: 'desc' }, { createdAt: 'desc' }]
    });
  }

  async count(where?: Prisma.PurchaseBillWhereInput): Promise<number> {
    return this.db.purchaseBill.count({
      where: { deletedAt: null, ...where }
    });
  }

  async findById(id: string): Promise<PurchaseBillWithRelations | null> {
    return this.db.purchaseBill.findFirst({
      where: { id, deletedAt: null },
      include: {
        fisherman: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            mobileNumber: true
          }
        },
        items: {
          include: {
            seafood: {
              select: {
                id: true,
                name: true,
                unit: true,
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            grade: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            paymentStatus: true,
            paymentDate: true,
            referenceNumber: true,
            notes: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async findByBillNumber(billNumber: string): Promise<PurchaseBill | null> {
    return this.db.purchaseBill.findUnique({
      where: { billNumber }
    });
  }
}
