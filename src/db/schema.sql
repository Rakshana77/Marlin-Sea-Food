-- Create custom buckets for Marlin Sea Food storage attachments
-- Create buckets: company-logos, invoice-pdfs, seafood-images, profile-images
-- (These buckets should be configured to allow public reads and authenticated uploads)

-- 1. Users
CREATE TABLE IF NOT EXISTS Users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Billing Staff',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Fishermen
CREATE TABLE IF NOT EXISTS Fishermen (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country_code TEXT DEFAULT '+91',
  mobile TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  address TEXT DEFAULT 'N/A',
  notes TEXT DEFAULT 'N/A',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Export Companies
CREATE TABLE IF NOT EXISTS Export_Companies (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  country_code TEXT DEFAULT '+91',
  mobile TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL
);

-- 4. Seafood Master
CREATE TABLE IF NOT EXISTS Seafood_Master (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active'
);

-- 5. Daily Rates
CREATE TABLE IF NOT EXISTS Daily_Rates (
  id SERIAL PRIMARY KEY,
  seafood_id TEXT REFERENCES Seafood_Master(id) ON DELETE CASCADE,
  purchase_rate NUMERIC NOT NULL,
  selling_rate NUMERIC NOT NULL,
  effective_date TEXT NOT NULL
);

-- 6. Purchase Bills
CREATE TABLE IF NOT EXISTS Purchase_Bills (
  id TEXT PRIMARY KEY,
  bill_no TEXT UNIQUE,
  fisherman_id TEXT REFERENCES Fishermen(id) ON DELETE CASCADE,
  bill_date TEXT NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  grand_total NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'Cash',
  status TEXT DEFAULT 'Completed'
);

-- 7. Purchase Bill Items
CREATE TABLE IF NOT EXISTS Purchase_Bill_Items (
  id SERIAL PRIMARY KEY,
  purchase_bill_id TEXT REFERENCES Purchase_Bills(id) ON DELETE CASCADE,
  seafood_id TEXT REFERENCES Seafood_Master(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  rate NUMERIC NOT NULL,
  amount NUMERIC NOT NULL
);

-- 8. Export Bills
CREATE TABLE IF NOT EXISTS Export_Bills (
  id TEXT PRIMARY KEY,
  invoice_no TEXT UNIQUE,
  company_id TEXT REFERENCES Export_Companies(id) ON DELETE CASCADE,
  invoice_date TEXT NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  grand_total NUMERIC NOT NULL,
  status TEXT DEFAULT 'Completed'
);

-- 9. Export Bill Items
CREATE TABLE IF NOT EXISTS Export_Bill_Items (
  id SERIAL PRIMARY KEY,
  export_bill_id TEXT REFERENCES Export_Bills(id) ON DELETE CASCADE,
  seafood_id TEXT REFERENCES Seafood_Master(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  rate NUMERIC NOT NULL,
  amount NUMERIC NOT NULL
);

-- 10. Expenses
CREATE TABLE IF NOT EXISTS Expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  expense_date TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_bills_fisherman ON Purchase_Bills(fisherman_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_bill ON Purchase_Bill_Items(purchase_bill_id);
CREATE INDEX IF NOT EXISTS idx_export_bills_company ON Export_Bills(company_id);
CREATE INDEX IF NOT EXISTS idx_export_items_bill ON Export_Bill_Items(export_bill_id);
CREATE INDEX IF NOT EXISTS idx_daily_rates_seafood ON Daily_Rates(seafood_id);

-- Enable Row Level Security (RLS) policies
ALTER TABLE Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE Fishermen ENABLE ROW LEVEL SECURITY;
ALTER TABLE Export_Companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE Seafood_Master ENABLE ROW LEVEL SECURITY;
ALTER TABLE Daily_Rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE Purchase_Bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE Purchase_Bill_Items ENABLE ROW LEVEL SECURITY;
ALTER TABLE Export_Bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE Export_Bill_Items ENABLE ROW LEVEL SECURITY;
ALTER TABLE Expenses ENABLE ROW LEVEL SECURITY;

-- Setup basic anonymous / authenticated access policies
CREATE POLICY "Allow all public access to Users" ON Users FOR ALL USING (true);
CREATE POLICY "Allow all public access to Fishermen" ON Fishermen FOR ALL USING (true);
CREATE POLICY "Allow all public access to Export_Companies" ON Export_Companies FOR ALL USING (true);
CREATE POLICY "Allow all public access to Seafood_Master" ON Seafood_Master FOR ALL USING (true);
CREATE POLICY "Allow all public access to Daily_Rates" ON Daily_Rates FOR ALL USING (true);
CREATE POLICY "Allow all public access to Purchase_Bills" ON Purchase_Bills FOR ALL USING (true);
CREATE POLICY "Allow all public access to Purchase_Bill_Items" ON Purchase_Bill_Items FOR ALL USING (true);
CREATE POLICY "Allow all public access to Export_Bills" ON Export_Bills FOR ALL USING (true);
CREATE POLICY "Allow all public access to Export_Bill_Items" ON Export_Bill_Items FOR ALL USING (true);
CREATE POLICY "Allow all public access to Expenses" ON Expenses FOR ALL USING (true);
