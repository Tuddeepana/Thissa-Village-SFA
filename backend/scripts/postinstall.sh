#!/bin/sh
# Vercel Post-Install Script

echo "Running Prisma generate..."
npx prisma generate

echo "Prisma Client generated successfully!"
