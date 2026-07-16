import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();
const JWT_SECRET = 'sams_erp_secret_key';

// Check connectivity heartbeat
app.get('/api/status', async (req, res) => {
  try {
    // Basic PG raw ping check
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      online: true,
      dbConnected: true,
      environment: process.env.NODE_ENV || 'development',
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    res.json({
      online: true,
      dbConnected: false,
      environment: process.env.NODE_ENV || 'development',
      serverTime: new Date().toISOString(),
      error: 'PostgreSQL connection failed'
    });
  }
});

// --- API Sync Router Endpoint ---
app.post('/api/sync', async (req, res) => {
  const { table, action, recordId, payload, deviceId } = req.body;

  try {
    // Route table updates inside isolated transactions
    if (action === 'delete') {
      if (table === 'seafood') {
        await prisma.seafood.delete({ where: { id: recordId } });
      } else if (table === 'customers') {
        await prisma.fisherman.delete({ where: { id: recordId } });
      } else if (table === 'companies') {
        await prisma.exportCompany.delete({ where: { id: recordId } });
      } else if (table === 'expenses') {
        await prisma.expense.delete({ where: { id: recordId } });
      }
    } else {
      // Upsert operations mapping properties to relational schema fields
      if (table === 'seafood') {
        await prisma.seafood.upsert({
          where: { id: payload.id },
          update: {
            name: payload.name,
            category: payload.category,
            unit: payload.unit,
            description: payload.description,
            img: payload.img,
            status: payload.status
          },
          create: {
            id: payload.id,
            name: payload.name,
            category: payload.category,
            unit: payload.unit,
            description: payload.description,
            img: payload.img,
            status: payload.status
          }
        });
      } else if (table === 'rates') {
        await prisma.dailyRate.create({
          data: {
            seafoodId: payload.seafoodId,
            name: payload.name,
            purchaseRate: parseFloat(payload.purchaseRate),
            sellingRate: parseFloat(payload.sellingRate),
            date: payload.date
          }
        });
      } else if (table === 'customers') {
        await prisma.fisherman.upsert({
          where: { id: payload.id },
          update: {
            name: payload.name,
            countryCode: payload.countryCode,
            mobileNumber: payload.mobileNumber,
            phone: payload.phone,
            whatsappNumber: payload.whatsappNumber,
            village: payload.village,
            bankDetails: payload.bankDetails,
            outstanding: parseFloat(payload.outstanding)
          },
          create: {
            id: payload.id,
            name: payload.name,
            countryCode: payload.countryCode,
            mobileNumber: payload.mobileNumber,
            phone: payload.phone,
            whatsappNumber: payload.whatsappNumber,
            village: payload.village,
            bankDetails: payload.bankDetails,
            outstanding: parseFloat(payload.outstanding)
          }
        });
      } else if (table === 'companies') {
        await prisma.exportCompany.upsert({
          where: { id: payload.id },
          update: {
            name: payload.name,
            address: payload.address,
            gst: payload.gst,
            countryCode: payload.countryCode,
            mobileNumber: payload.mobileNumber,
            phone: payload.phone,
            whatsappNumber: payload.whatsappNumber,
            email: payload.email,
            contactPerson: payload.contactPerson,
            outstanding: parseFloat(payload.outstanding)
          },
          create: {
            id: payload.id,
            name: payload.name,
            address: payload.address,
            gst: payload.gst,
            countryCode: payload.countryCode,
            mobileNumber: payload.mobileNumber,
            phone: payload.phone,
            whatsappNumber: payload.whatsappNumber,
            email: payload.email,
            contactPerson: payload.contactPerson,
            outstanding: parseFloat(payload.outstanding)
          }
        });
      } else if (table === 'purchaseBills') {
        // Relational Nested Transaction: Save Bill & Child items in one query
        await prisma.$transaction(async (tx) => {
          await tx.purchaseBill.upsert({
            where: { id: payload.id },
            update: {
              fishermanId: payload.customerId,
              date: payload.date,
              grandTotal: parseFloat(payload.grandTotal),
              paymentMode: payload.paymentMode,
              remarks: payload.remarks
            },
            create: {
              id: payload.id,
              fishermanId: payload.customerId,
              date: payload.date,
              grandTotal: parseFloat(payload.grandTotal),
              paymentMode: payload.paymentMode,
              remarks: payload.remarks
            }
          });

          // Delete any existing items if updating
          await tx.purchaseBillItem.deleteMany({ where: { purchaseBillId: payload.id } });

          // Add child bill items
          if (payload.items && payload.items.length > 0) {
            await tx.purchaseBillItem.createMany({
              data: payload.items.map(item => ({
                purchaseBillId: payload.id,
                seafoodId: item.seafoodId,
                rate: parseFloat(item.rate),
                weight: parseFloat(item.weight),
                total: parseFloat(item.total)
              }))
            });
          }
        });
      } else if (table === 'exportBills') {
        await prisma.$transaction(async (tx) => {
          await tx.exportBill.upsert({
            where: { id: payload.id },
            update: {
              exportCompanyId: payload.companyId,
              date: payload.date,
              subTotal: parseFloat(payload.subTotal),
              tax: parseFloat(payload.tax),
              transport: parseFloat(payload.transport),
              packing: parseFloat(payload.packing),
              netTotal: parseFloat(payload.netTotal),
              remarks: payload.remarks
            },
            create: {
              id: payload.id,
              exportCompanyId: payload.companyId,
              date: payload.date,
              subTotal: parseFloat(payload.subTotal),
              tax: parseFloat(payload.tax),
              transport: parseFloat(payload.transport),
              packing: parseFloat(payload.packing),
              netTotal: parseFloat(payload.netTotal),
              remarks: payload.remarks
            }
          });

          await tx.exportBillItem.deleteMany({ where: { exportBillId: payload.id } });

          if (payload.items && payload.items.length > 0) {
            await tx.exportBillItem.createMany({
              data: payload.items.map(item => ({
                exportBillId: payload.id,
                seafoodId: item.seafoodId,
                rate: parseFloat(item.rate),
                weight: parseFloat(item.weight),
                total: parseFloat(item.total)
              }))
            });
          }
        });
      } else if (table === 'expenses') {
        await prisma.expense.upsert({
          where: { id: payload.id },
          update: {
            category: payload.category,
            amount: parseFloat(payload.amount),
            remarks: payload.remarks,
            date: payload.date
          },
          create: {
            id: payload.id,
            category: payload.category,
            amount: parseFloat(payload.amount),
            remarks: payload.remarks,
            date: payload.date
          }
        });
      }
    }

    // Register log
    await prisma.auditLog.create({
      data: {
        action: `${action.toUpperCase()} on ${table.toUpperCase()}`,
        details: `ID: ${recordId || payload.id}`,
        deviceId
      }
    });

    res.json({ success: true, message: 'Sync complete' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Meta WhatsApp Cloud API Endpoint simulation
app.post('/api/whatsapp/send', async (req, res) => {
  const { phoneNumber, message } = req.body;
  const randomVal = Math.random();
  if (randomVal > 0.15) {
    res.json({ status: 'Delivered', messageId: `wamid.PG-${Date.now()}` });
  } else {
    res.status(500).json({ status: 'Failed', error: 'Meta Business Cloud queue full' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SAMS PostgreSQL Prisma sync backend active on port ${PORT}`);
});
