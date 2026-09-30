import { BaseRepository } from './base.repository';
import { Prisma, Sale } from '@prisma/client';

export type SaleWithRelations = Sale & {
  customer: {
    id: string;
    name: string;
    countryCode: string;
    mobileNumber: string;
    email: string | null;
    address: string | null;
  };
  items: Array<{
    id: string;
    seafoodId: string;
    gradeId: string;
    quantityKg: Prisma.Decimal;
    sellingRate: Prisma.Decimal;
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

export class SaleRepository extends BaseRepository {
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.SaleWhereInput;
    orderBy?: Prisma.SaleOrderByWithRelationInput;
  }): Promise<SaleWithRelations[]> {
    return this.db.sale.findMany({
      skip: params.skip,
      take: params.take,
      where: { deletedAt: null, ...params.where },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            mobileNumber: true,
            email: true,
            address: true
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
          },
          orderBy: {
            paymentDate: 'asc'
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: params.orderBy || { createdAt: 'desc' }
    });
  }

  async count(where?: Prisma.SaleWhereInput): Promise<number> {
    return this.db.sale.count({
      where: { deletedAt: null, ...where }
    });
  }

  async findById(id: string): Promise<SaleWithRelations | null> {
    return this.db.sale.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            mobileNumber: true,
            email: true,
            address: true
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
          },
          orderBy: {
            paymentDate: 'asc'
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

  async findByInvoiceNumber(invoiceNumber: string): Promise<SaleWithRelations | null> {
    return this.db.sale.findFirst({
      where: { invoiceNumber, deletedAt: null },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            mobileNumber: true,
            email: true,
            address: true
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
          },
          orderBy: {
            paymentDate: 'asc'
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

  async findByIdempotencyKey(idempotencyKey: string): Promise<SaleWithRelations | null> {
    return this.db.sale.findFirst({
      where: { idempotencyKey, deletedAt: null },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            countryCode: true,
            mobileNumber: true,
            email: true,
            address: true
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
          },
          orderBy: {
            paymentDate: 'asc'
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
}