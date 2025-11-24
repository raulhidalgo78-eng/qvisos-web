-- Add features column to ads table to store dynamic fields
ALTER TABLE ads ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;
