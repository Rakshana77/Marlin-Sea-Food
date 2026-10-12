import { prisma } from '../lib/prisma';
import {
  FishermanAdvanceRepository,
  FishermanAdvanceWithRelations,
  AdvanceLedgerWithRelations
} from '../repositories/fishermanAdvance.repository';
import { AppError } from '../utils/appError';
import { generateAdvanceNumber } from '../utils/billNumber';
import { getMonotonicDate } from '../utils/monotonicDate';
import { assertBusinessDateOpen } from '../utils/dayEnd';
import { DailyRateService } from './dailyRate.service';
import {
  Prisma,
  AdvancePaymentMethod,
  AdvanceStatus,
  AdvanceEntryType,
  LedgerDirection,
  MasterStatus
} from '@prisma/client';

export interface DisburseAdvanceInput {
  fishermanId: string;
  sanctionDate?: string; // YYYY-MM-DD
  amount: string | number;
  paymentMethod: AdvancePaymentMethod;
  paymentRef?: string;
  idempotencyKey?: string;
  notes?: string;
}

export interface RecordRepaymentInput {
  fishermanId: string;
  amount: string | number;
  paymentMethod: AdvancePaymentMethod;
  paymentRef?: string;
  idempotencyKey?: string;
  notes?: string;
}

export interface WriteOffInput {
  fishermanId: string;
  advanceId?: string;
  amount: string | number;
  reason: string;
}

export interface CancelAdvanceInput {
  advanceId: string;
  fishermanId?: string;
  reason?: string;
}

export interface FormattedFishermanAdvance {
  id: string;
  advanceNumber: string;
  fishermanId: string;
  sanctionDate: string;
  disbursedAmount: string;
  paymentMethod: AdvancePaymentMethod;
  paymentRef: string | null;
  status: AdvanceStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  fisherman: {
    id: string;
    name: string;
    countryCode: string;
    mobileNumber: string;
    boatName: string | null;
  };
  createdBy?: {
    id: string;
    name: string;
  } | null;
}

export interface FormattedAdvanceLedgerEntry {
  id: string;
  fishermanId: string;
  advanceId: string | null;
  entryType: AdvanceEntryType;
  direction: LedgerDirection;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  referenceType: string;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  fisherman: {
    id: string;
    name: string;
    countryCode: string;
    mobileNumber: string;
    boatName: string | null;
  };
  advance?: {
    id: string;
    advanceNumber: string;
    sanctionDate: string;
    disbursedAmount: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
  } | null;
}

export interface FishermanAdvanceBalanceSummary {
  fishermanId: string;
  currentBalance: string;
  totalDisbursed: string;
  totalRecovered: string;
  totalWrittenOff: string;
  activeAdvancesCount: number;
}

export class FishermanAdvanceService {
  private readonly repo = new FishermanAdvanceRepository();

  public static formatAdvance(adv: FishermanAdvanceWithRelations): FormattedFishermanAdvance {
    return {
      id: adv.id,
      advanceNumber: adv.advanceNumber,
      fishermanId: adv.fishermanId,
      sanctionDate: DailyRateService.formatDate(adv.sanctionDate),
      disbursedAmount: new Prisma.Decimal(adv.disbursedAmount).toFixed(2),
      paymentMethod: adv.paymentMethod,
      paymentRef: adv.paymentRef,
      status: adv.status,
      notes: adv.notes,
      createdAt: adv.createdAt.toISOString(),
      updatedAt: adv.updatedAt.toISOString(),
      fisherman: adv.fisherman,
      createdBy: adv.createdBy
    };
  }

  public static formatLedgerEntry(entry: AdvanceLedgerWithRelations): FormattedAdvanceLedgerEntry {
    return {
      id: entry.id,
      fishermanId: entry.fishermanId,
      advanceId: entry.advanceId,
      entryType: entry.entryType,
      direction: entry.direction,
      amount: new Prisma.Decimal(entry.amount).toFixed(2),
      balanceBefore: new Prisma.Decimal(entry.balanceBefore).toFixed(2),
      balanceAfter: new Prisma.Decimal(entry.balanceAfter).toFixed(2),
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      notes: entry.notes,
      createdAt: entry.createdAt.toISOString(),
      fisherman: entry.fisherman,
      advance: entry.advance
        ? {
            id: entry.advance.id,
            advanceNumber: entry.advance.advanceNumber,
            sanctionDate: DailyRateService.formatDate(entry.advance.sanctionDate),
            disbursedAmount: new Prisma.Decimal(entry.advance.disbursedAmount).toFixed(2)
          }
        : null,
      createdBy: entry.createdBy
    };
  }

  /**
   * 1. Disburse a new cash/bank advance to a fisherman.
   * Atomically records the advance, updates running debt in the ledger, and acquires a row lock.
   */
  async disburseAdvance(
    input: DisburseAdvanceInput,
    userId?: string
  ): Promise<{
    advance: FormattedFishermanAdvance;
    ledgerEntry: FormattedAdvanceLedgerEntry;
    currentBalance: string;
  }> {
    const amountDec = new Prisma.Decimal(input.amount);
    if (amountDec.lessThanOrEqualTo(0)) {
      throw AppError.badRequest('Advance disbursement amount must be greater than zero', 'INVALID_ADVANCE_AMOUNT');
    }

    const dateStr = input.sanctionDate || new Date().toISOString().split('T')[0];
    const sanctionDateObj = DailyRateService.parseDate(dateStr);

    return prisma.$transaction(
      async (tx) => {
        // 1. Lock the Fisherman row FOR UPDATE
        const lockedFishermen = await tx.$queryRaw<Array<{ id: string; name: string; status: MasterStatus }>>`
          SELECT id, name, status
          FROM "Fisherman"
          WHERE id = ${input.fishermanId} AND "deletedAt" IS NULL
          FOR UPDATE
        `;

        if (!lockedFishermen || lockedFishermen.length === 0) {
          throw AppError.notFound('Fisherman not found', 'FISHERMAN_NOT_FOUND');
        }

        if (lockedFishermen[0].status !== MasterStatus.ACTIVE) {
          throw AppError.badRequest('Cannot issue advance to an inactive fisherman', 'FISHERMAN_INACTIVE');
        }

        // Validate business date is not closed
        await assertBusinessDateOpen(tx, sanctionDateObj);

        // Check idempotency
        const idemKey = input.idempotencyKey || input.paymentRef;
        if (idemKey) {
          const existingAdvance = await tx.fishermanAdvance.findFirst({
            where: {
              fishermanId: input.fishermanId,
              paymentRef: idemKey
            },
            include: {
              fisherman: {
                select: {
                  id: true,
                  name: true,
                  countryCode: true,
                  mobileNumber: true,
                  boatName: true
                }
              },
              createdBy: {
                select: {
                  id: true,
                  name: true
                }
              },
              ledgerEntries: {
                include: {
                  fisherman: {
                    select: {
                      id: true,
                      name: true,
                      countryCode: true,
                      mobileNumber: true,
                      boatName: true
                    }
                  },
                  advance: {
                    select: {
                      id: true,
                      advanceNumber: true,
                      sanctionDate: true,
                      disbursedAmount: true
                    }
                  },
                  createdBy: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          });

          if (existingAdvance) {
            const latestEntry = await tx.fishermanAdvanceLedger.findFirst({
              where: { fishermanId: input.fishermanId },
              orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
            });
            const currentBalance = latestEntry ? new Prisma.Decimal(latestEntry.balanceAfter).toFixed(2) : '0.00';
            const disburseLedger = existingAdvance.ledgerEntries?.find((e) => e.entryType === AdvanceEntryType.DISBURSEMENT) || existingAdvance.ledgerEntries?.[0];

            return {
              advance: FishermanAdvanceService.formatAdvance(existingAdvance as FishermanAdvanceWithRelations),
              ledgerEntry: FishermanAdvanceService.formatLedgerEntry(disburseLedger as AdvanceLedgerWithRelations),
              currentBalance
            };
          }
        }

        // 2. Fetch the latest running balance for this fisherman
        const latestEntry = await tx.fishermanAdvanceLedger.findFirst({
          where: { fishermanId: input.fishermanId },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
        });

        const balanceBefore = latestEntry ? new Prisma.Decimal(latestEntry.balanceAfter) : new Prisma.Decimal('0.00');
        const balanceAfter = balanceBefore.add(amountDec).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        // 3. Generate sequential advance number ADV-YYYYMMDD-XXXX
        const advanceNumber = await generateAdvanceNumber(tx, dateStr);

        // 4. Create FishermanAdvance header
        const advance = await tx.fishermanAdvance.create({
          data: {
            advanceNumber,
            fishermanId: input.fishermanId,
            sanctionDate: sanctionDateObj,
            disbursedAmount: amountDec,
            paymentMethod: input.paymentMethod,
            paymentRef: idemKey || null,
            status: AdvanceStatus.ACTIVE,
            notes: input.notes || null,
            createdById: userId || null
          },
          include: {
            fisherman: {
              select: {
                id: true,
                name: true,
                countryCode: true,
                mobileNumber: true,
                boatName: true
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

        // 5. Create immutable FishermanAdvanceLedger entry (DEBIT = Debt increases)
        const ledgerEntry = await tx.fishermanAdvanceLedger.create({
          data: {
            fishermanId: input.fishermanId,
            advanceId: advance.id,
            entryType: AdvanceEntryType.DISBURSEMENT,
            direction: LedgerDirection.DEBIT,
            amount: amountDec,
            balanceBefore,
            balanceAfter,
            referenceType: 'ADVANCE_DISBURSEMENT',
            referenceId: advance.id,
            notes: input.notes || `Disbursed advance ${advanceNumber}`,
            createdById: userId || null,
            createdAt: getMonotonicDate()
          },
          include: {
            fisherman: {
              select: {
                id: true,
                name: true,
                countryCode: true,
                mobileNumber: true,
                boatName: true
              }
            },
            advance: {
              select: {
                id: true,
                advanceNumber: true,
                sanctionDate: true,
                disbursedAmount: true
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

        return {
          advance: FishermanAdvanceService.formatAdvance(advance as FishermanAdvanceWithRelations),
          ledgerEntry: FishermanAdvanceService.formatLedgerEntry(ledgerEntry as AdvanceLedgerWithRelations),
          currentBalance: balanceAfter.toFixed(2)
        };
      },
      {
        maxWait: 15000,
        timeout: 60000
      }
    );
  }

  /**
   * 2. Direct Cash Repayment by the fisherman (without catch sales).
   * Atomically decreases debt in the ledger via CREDIT.
   */
  async recordCashRepayment(
    input: RecordRepaymentInput,
    userId?: string
  ): Promise<{
    ledgerEntry: FormattedAdvanceLedgerEntry;
    currentBalance: string;
  }> {
    const amountDec = new Prisma.Decimal(input.amount);
    if (amountDec.lessThanOrEqualTo(0)) {
      throw AppError.badRequest('Repayment amount must be greater than zero', 'INVALID_REPAYMENT_AMOUNT');
    }

    return prisma.$transaction(
      async (tx) => {
        // Lock Fisherman row FOR UPDATE
        const lockedFishermen = await tx.$queryRaw<Array<{ id: string; name: string; status: MasterStatus }>>`
          SELECT id, name, status
          FROM "Fisherman"
          WHERE id = ${input.fishermanId} AND "deletedAt" IS NULL
          FOR UPDATE
        `;

        if (!lockedFishermen || lockedFishermen.length === 0) {
          throw AppError.notFound('Fisherman not found', 'FISHERMAN_NOT_FOUND');
        }

        // Validate business date is not closed
        await assertBusinessDateOpen(tx, new Date());

        // Check idempotency
        const idemKey = input.idempotencyKey || input.paymentRef;
        if (idemKey) {
          const existingEntry = await tx.fishermanAdvanceLedger.findFirst({
            where: {
              fishermanId: input.fishermanId,
              referenceType: 'DIRECT_CASH_RECEIPT',
              referenceId: idemKey
            },
            include: {
              fisherman: {
                select: {
                  id: true,
                  name: true,
                  countryCode: true,
                  mobileNumber: true,
                  boatName: true
                }
              },
              advance: {
                select: {
                  id: true,
                  advanceNumber: true,
                  sanctionDate: true,
                  disbursedAmount: true
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

          if (existingEntry) {
            const latestEntry = await tx.fishermanAdvanceLedger.findFirst({
              where: { fishermanId: input.fishermanId },
              orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
            });
            return {
              ledgerEntry: FishermanAdvanceService.formatLedgerEntry(existingEntry as AdvanceLedgerWithRelations),
              currentBalance: latestEntry ? new Prisma.Decimal(latestEntry.balanceAfter).toFixed(2) : '0.00'
            };
          }
        }

        const latestEntry = await tx.fishermanAdvanceLedger.findFirst({
          where: { fishermanId: input.fishermanId },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
        });

        const balanceBefore = latestEntry ? new Prisma.Decimal(latestEntry.balanceAfter) : new Prisma.Decimal('0.00');

        if (balanceBefore.lessThanOrEqualTo(0)) {
          throw AppError.badRequest('Fisherman has no outstanding advance balance to repay', 'NO_OUTSTANDING_BALANCE');
        }

        if (amountDec.greaterThan(balanceBefore)) {
          throw AppError.badRequest(
            `Repayment amount (₹${amountDec.toFixed(2)}) exceeds outstanding advance debt (₹${balanceBefore.toFixed(2)})`,
            'EXCESSIVE_REPAYMENT'
          );
        }

        const balanceAfter = balanceBefore.sub(amountDec).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        const ledgerEntry = await tx.fishermanAdvanceLedger.create({
          data: {
            fishermanId: input.fishermanId,
            advanceId: null,
            entryType: AdvanceEntryType.CASH_REPAYMENT,
            direction: LedgerDirection.CREDIT,
            amount: amountDec,
            balanceBefore,
            balanceAfter,
            referenceType: 'DIRECT_CASH_RECEIPT',
            referenceId: idemKey || null,
            notes: input.notes || `Direct cash repayment received via ${input.paymentMethod}`,
            createdById: userId || null,
            createdAt: getMonotonicDate()
          },
          include: {
            fisherman: {
              select: {
                id: true,
                name: true,
                countryCode: true,
                mobileNumber: true,
                boatName: true
              }
            },
            advance: {
              select: {
                id: true,
                advanceNumber: true,
                sanctionDate: true,
                disbursedAmount: true
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

        // If outstanding advance is completely cleared, mark active advances as FULLY_RECOVERED
        if (balanceAfter.isZero()) {
          await tx.fishermanAdvance.updateMany({
            where: { fishermanId: input.fishermanId, status: AdvanceStatus.ACTIVE },
            data: { status: AdvanceStatus.FULLY_RECOVERED }
          });
        }

        return {
          ledgerEntry: FishermanAdvanceService.formatLedgerEntry(ledgerEntry as AdvanceLedgerWithRelations),
          currentBalance: balanceAfter.toFixed(2)
        };
      },
      {
        maxWait: 15000,
        timeout: 60000
      }
    );
  }

  /**
   * 3. Write-Off unrecoverable advance.
   * Decreases the balance via CREDIT and updates advance status to WRITTEN_OFF.
   */
  async writeOffAdvance(
    input: WriteOffInput,
    userId?: string
  ): Promise<{
    ledgerEntry: FormattedAdvanceLedgerEntry;
    currentBalance: string;
  }> {
    const amountDec = new Prisma.Decimal(input.amount);
    if (amountDec.lessThanOrEqualTo(0)) {
      throw AppError.badRequest('Write-off amount must be greater than zero', 'INVALID_WRITEOFF_AMOUNT');
    }

    if (!input.reason || input.reason.trim().length === 0) {
      throw AppError.badRequest('A justification reason is mandatory for an advance write-off', 'WRITEOFF_REASON_REQUIRED');
    }

    return prisma.$transaction(
      async (tx) => {
        // Lock Fisherman row FOR UPDATE
        const lockedFishermen = await tx.$queryRaw<Array<{ id: string; name: string }>>`
          SELECT id, name
          FROM "Fisherman"
          WHERE id = ${input.fishermanId} AND "deletedAt" IS NULL
          FOR UPDATE
        `;

        if (!lockedFishermen || lockedFishermen.length === 0) {
          throw AppError.notFound('Fisherman not found', 'FISHERMAN_NOT_FOUND');
        }

        // Validate business date is not closed
        await assertBusinessDateOpen(tx, new Date());

        const latestEntry = await tx.fishermanAdvanceLedger.findFirst({
          where: { fishermanId: input.fishermanId },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
        });

        const balanceBefore = latestEntry ? new Prisma.Decimal(latestEntry.balanceAfter) : new Prisma.Decimal('0.00');

        if (balanceBefore.lessThanOrEqualTo(0)) {
          throw AppError.badRequest('Fisherman has no outstanding advance balance to write off', 'NO_OUTSTANDING_BALANCE');
        }

        if (amountDec.greaterThan(balanceBefore)) {
          throw AppError.badRequest(
            `Write-off amount (₹${amountDec.toFixed(2)}) exceeds current outstanding debt (₹${balanceBefore.toFixed(2)})`,
            'EXCESSIVE_WRITE_OFF'
          );
        }

        const balanceAfter = balanceBefore.sub(amountDec).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        // If specific advance targeted, mark it as WRITTEN_OFF
        if (input.advanceId) {
          await tx.fishermanAdvance.update({
            where: { id: input.advanceId },
            data: { status: AdvanceStatus.WRITTEN_OFF }
          });
        }

        const ledgerEntry = await tx.fishermanAdvanceLedger.create({
          data: {
            fishermanId: input.fishermanId,
            advanceId: input.advanceId || null,
            entryType: AdvanceEntryType.WRITE_OFF,
            direction: LedgerDirection.CREDIT,
            amount: amountDec,
            balanceBefore,
            balanceAfter,
            referenceType: 'WRITE_OFF_APPROVAL',
            referenceId: input.advanceId || null,
            notes: input.reason.trim(),
            createdById: userId || null,
            createdAt: getMonotonicDate()
          },
          include: {
            fisherman: {
              select: {
                id: true,
                name: true,
                countryCode: true,
                mobileNumber: true,
                boatName: true
              }
            },
            advance: {
              select: {
                id: true,
                advanceNumber: true,
                sanctionDate: true,
                disbursedAmount: true
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

        // If entire debt reached zero, mark any remaining active advances as FULLY_RECOVERED
        if (balanceAfter.isZero()) {
          await tx.fishermanAdvance.updateMany({
            where: { fishermanId: input.fishermanId, status: AdvanceStatus.ACTIVE },
            data: { status: AdvanceStatus.FULLY_RECOVERED }
          });
        }

        return {
          ledgerEntry: FishermanAdvanceService.formatLedgerEntry(ledgerEntry as AdvanceLedgerWithRelations),
          currentBalance: balanceAfter.toFixed(2)
        };
      },
      {
        maxWait: 15000,
        timeout: 60000
      }
    );
  }

  /**
   * 4. Cancel / Void an Advance (when no recovery has occurred).
   * Appends compensating WRITE_OFF / CREDIT ledger event ("Disbursement voided")
   * and transitions advance status to CANCELLED.
   */
  async cancelAdvance(
    input: CancelAdvanceInput,
    userId?: string
  ): Promise<{
    advance: FormattedFishermanAdvance;
    ledgerEntry: FormattedAdvanceLedgerEntry;
    currentBalance: string;
  }> {
    return prisma.$transaction(
      async (tx) => {
        // 1. Fetch advance
        const advance = await tx.fishermanAdvance.findUnique({
          where: { id: input.advanceId }
        });

        if (!advance) {
          throw AppError.notFound('Fisherman advance not found', 'ADVANCE_NOT_FOUND');
        }

        if (input.fishermanId && advance.fishermanId !== input.fishermanId) {
          throw AppError.badRequest('Advance does not belong to specified fisherman', 'INVALID_ADVANCE_REFERENCE');
        }

        const fishermanId = advance.fishermanId;

        // 2. Lock Fisherman row FOR UPDATE
        const lockedFishermen = await tx.$queryRaw<Array<{ id: string; name: string; status: MasterStatus }>>`
          SELECT id, name, status
          FROM "Fisherman"
          WHERE id = ${fishermanId} AND "deletedAt" IS NULL
          FOR UPDATE
        `;

        if (!lockedFishermen || lockedFishermen.length === 0) {
          throw AppError.notFound('Fisherman not found', 'FISHERMAN_NOT_FOUND');
        }

        // 3. Verify business date is open
        await assertBusinessDateOpen(tx, advance.sanctionDate);
        await assertBusinessDateOpen(tx, new Date());

        // 4. Validate advance status
        if (advance.status === AdvanceStatus.CANCELLED) {
          throw AppError.badRequest('Advance is already cancelled', 'ADVANCE_ALREADY_CANCELLED');
        }
        if (advance.status === AdvanceStatus.FULLY_RECOVERED) {
          throw AppError.badRequest('Cannot cancel advance: advance has already been fully recovered', 'ADVANCE_ALREADY_CLOSED');
        }
        if (advance.status === AdvanceStatus.WRITTEN_OFF) {
          throw AppError.badRequest('Cannot cancel advance: advance has already been written off', 'ADVANCE_ALREADY_CLOSED');
        }

        // 5. Verify no recovery has occurred
        const directRecovery = await tx.fishermanAdvanceLedger.findFirst({
          where: {
            fishermanId,
            advanceId: advance.id,
            entryType: AdvanceEntryType.RECOVERY_DEDUCTION
          }
        });

        if (directRecovery) {
          throw AppError.badRequest(
            'Cannot cancel advance: recovery deduction has already occurred against this advance',
            'INVALID_ADVANCE_RECOVERY'
          );
        }

        const latestEntry = await tx.fishermanAdvanceLedger.findFirst({
          where: { fishermanId },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
        });

        const balanceBefore = latestEntry ? new Prisma.Decimal(latestEntry.balanceAfter) : new Prisma.Decimal('0.00');

        if (balanceBefore.lessThan(advance.disbursedAmount)) {
          throw AppError.badRequest(
            `Cannot cancel advance: outstanding balance (₹${balanceBefore.toFixed(2)}) is less than disbursed amount (₹${new Prisma.Decimal(advance.disbursedAmount).toFixed(2)})`,
            'INVALID_ADVANCE_RECOVERY'
          );
        }

        const recoveriesAfter = await tx.fishermanAdvanceLedger.findFirst({
          where: {
            fishermanId,
            entryType: AdvanceEntryType.RECOVERY_DEDUCTION,
            createdAt: { gte: advance.createdAt }
          }
        });

        if (recoveriesAfter) {
          throw AppError.badRequest(
            'Cannot cancel advance: recovery deductions have occurred since this advance was sanctioned',
            'INVALID_ADVANCE_RECOVERY'
          );
        }

        const balanceAfter = balanceBefore.sub(advance.disbursedAmount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        // 6. Update advance status to CANCELLED
        const updatedAdvance = await tx.fishermanAdvance.update({
          where: { id: advance.id },
          data: {
            status: AdvanceStatus.CANCELLED,
            notes: input.reason
              ? (advance.notes ? `${advance.notes} | Cancelled: ${input.reason.trim()}` : `Cancelled: ${input.reason.trim()}`)
              : advance.notes
          },
          include: {
            fisherman: {
              select: {
                id: true,
                name: true,
                countryCode: true,
                mobileNumber: true,
                boatName: true
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

        // 7. Append compensating ledger event (WRITE_OFF / CREDIT "Disbursement voided")
        const ledgerEntry = await tx.fishermanAdvanceLedger.create({
          data: {
            fishermanId,
            advanceId: advance.id,
            entryType: AdvanceEntryType.WRITE_OFF,
            direction: LedgerDirection.CREDIT,
            amount: advance.disbursedAmount,
            balanceBefore,
            balanceAfter,
            referenceType: 'DISBURSEMENT_VOID',
            referenceId: advance.id,
            notes: input.reason ? `Disbursement voided: ${input.reason.trim()}` : `Disbursement voided for advance ${advance.advanceNumber}`,
            createdById: userId || null,
            createdAt: getMonotonicDate()
          },
          include: {
            fisherman: {
              select: {
                id: true,
                name: true,
                countryCode: true,
                mobileNumber: true,
                boatName: true
              }
            },
            advance: {
              select: {
                id: true,
                advanceNumber: true,
                sanctionDate: true,
                disbursedAmount: true
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

        // 8. If entire balance reached 0, mark any active advances as FULLY_RECOVERED
        if (balanceAfter.isZero()) {
          await tx.fishermanAdvance.updateMany({
            where: { fishermanId, status: AdvanceStatus.ACTIVE },
            data: { status: AdvanceStatus.FULLY_RECOVERED }
          });
        }

        return {
          advance: FishermanAdvanceService.formatAdvance(updatedAdvance as FishermanAdvanceWithRelations),
          ledgerEntry: FishermanAdvanceService.formatLedgerEntry(ledgerEntry as AdvanceLedgerWithRelations),
          currentBalance: balanceAfter.toFixed(2)
        };
      },
      {
        maxWait: 15000,
        timeout: 60000
      }
    );
  }

  /**
   * 4. Current Balance & Financial Aggregate Summary for a fisherman.
   */
  async getFishermanAdvanceBalance(
    fishermanId: string,
    tx?: Prisma.TransactionClient
  ): Promise<FishermanAdvanceBalanceSummary> {
    const client = tx || prisma;

    const latest = await client.fishermanAdvanceLedger.findFirst({
      where: { fishermanId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
    });

    const currentBalance = latest ? new Prisma.Decimal(latest.balanceAfter).toFixed(2) : '0.00';

    // Aggregates
    const [disbursedAgg, recoveredAgg, writeOffAgg, activeCount] = await Promise.all([
      client.fishermanAdvanceLedger.aggregate({
        where: {
          fishermanId,
          entryType: { in: [AdvanceEntryType.DISBURSEMENT, AdvanceEntryType.RECOVERY_REVERSAL] }
        },
        _sum: { amount: true }
      }),
      client.fishermanAdvanceLedger.aggregate({
        where: {
          fishermanId,
          entryType: { in: [AdvanceEntryType.RECOVERY_DEDUCTION, AdvanceEntryType.CASH_REPAYMENT] }
        },
        _sum: { amount: true }
      }),
      client.fishermanAdvanceLedger.aggregate({
        where: {
          fishermanId,
          entryType: AdvanceEntryType.WRITE_OFF
        },
        _sum: { amount: true }
      }),
      client.fishermanAdvance.count({
        where: { fishermanId, status: AdvanceStatus.ACTIVE }
      })
    ]);

    return {
      fishermanId,
      currentBalance,
      totalDisbursed: new Prisma.Decimal(disbursedAgg._sum.amount || 0).toFixed(2),
      totalRecovered: new Prisma.Decimal(recoveredAgg._sum.amount || 0).toFixed(2),
      totalWrittenOff: new Prisma.Decimal(writeOffAgg._sum.amount || 0).toFixed(2),
      activeAdvancesCount: activeCount
    };
  }

  /**
   * 5. List Advances with search, date filters, and pagination.
   */
  async getAdvancesList(params: {
    page?: number;
    limit?: number;
    fishermanId?: string;
    status?: AdvanceStatus;
    paymentMethod?: AdvancePaymentMethod;
    fromDate?: string;
    toDate?: string;
    search?: string;
  }): Promise<{ items: FormattedFishermanAdvance[]; total: number; totalPages: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.FishermanAdvanceWhereInput = {};

    if (params.fishermanId) where.fishermanId = params.fishermanId;
    if (params.status) where.status = params.status;
    if (params.paymentMethod) where.paymentMethod = params.paymentMethod;

    if (params.fromDate || params.toDate) {
      where.sanctionDate = {};
      if (params.fromDate) where.sanctionDate.gte = DailyRateService.parseDate(params.fromDate);
      if (params.toDate) where.sanctionDate.lte = DailyRateService.parseDate(params.toDate);
    }

    if (params.search) {
      where.OR = [
        { advanceNumber: { contains: params.search, mode: 'insensitive' } },
        { fisherman: { name: { contains: params.search, mode: 'insensitive' } } },
        { fisherman: { mobileNumber: { contains: params.search } } }
      ];
    }

    const [items, total] = await Promise.all([
      this.repo.findManyAdvances({ skip, take: limit, where }),
      this.repo.countAdvances(where)
    ]);

    return {
      items: items.map(FishermanAdvanceService.formatAdvance),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 6. Retrieve single advance by ID.
   */
  async getAdvanceById(id: string): Promise<FormattedFishermanAdvance> {
    const adv = await this.repo.findAdvanceById(id);
    if (!adv) {
      throw AppError.notFound('Fisherman advance not found', 'ADVANCE_NOT_FOUND');
    }
    return FishermanAdvanceService.formatAdvance(adv);
  }

  /**
   * 7. Query Advance Ledger Audit Entries.
   */
  async getAdvanceLedger(params: {
    page?: number;
    limit?: number;
    fishermanId?: string;
    advanceId?: string;
    entryType?: AdvanceEntryType;
    direction?: LedgerDirection;
    fromDate?: string;
    toDate?: string;
  }): Promise<{ items: FormattedAdvanceLedgerEntry[]; total: number; totalPages: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.FishermanAdvanceLedgerWhereInput = {};

    if (params.fishermanId) where.fishermanId = params.fishermanId;
    if (params.advanceId) where.advanceId = params.advanceId;
    if (params.entryType) where.entryType = params.entryType;
    if (params.direction) where.direction = params.direction;

    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) where.createdAt.gte = DailyRateService.parseDate(params.fromDate);
      if (params.toDate) {
        const endDate = DailyRateService.parseDate(params.toDate);
        endDate.setUTCHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const [items, total] = await Promise.all([
      this.repo.findManyLedgerEntries({ skip, take: limit, where }),
      this.repo.countLedgerEntries(where)
    ]);

    return {
      items: items.map(FishermanAdvanceService.formatLedgerEntry),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }
}
