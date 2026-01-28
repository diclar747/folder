-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla Users
CREATE TABLE IF NOT EXISTS "Users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255) CHECK ("role" IN ('admin', 'user')) DEFAULT 'user',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Links
CREATE TABLE IF NOT EXISTS "Links" (
    "id" VARCHAR(255) PRIMARY KEY,
    "title" VARCHAR(255),
    "description" TEXT,
    "imageUrl" VARCHAR(255),
    "destinationUrl" VARCHAR(255) NOT NULL,
    "createdBy" UUID REFERENCES "Users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Sessions
CREATE TABLE IF NOT EXISTS "Sessions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "linkId" VARCHAR(255) REFERENCES "Links" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "socketId" VARCHAR(255),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "userAgent" VARCHAR(255),
    "ip" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Datos Iniciales (Seed Users)
-- Admin: admin@admin / 1234567
-- User: user@user.com / 1234567

INSERT INTO "Users" ("id", "email", "password", "role", "isActive", "createdAt", "updatedAt")
VALUES 
(gen_random_uuid(), 'admin@admin', '1234567', 'admin', true, NOW(), NOW()),
(gen_random_uuid(), 'user@user.com', '1234567', 'user', true, NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;
