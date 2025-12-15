-- Add new roles to app_role enum (first migration)
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'vendedor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'financeiro';