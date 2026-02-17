#!/bin/bash

# ==========================================
# Ubicar - Deploy Script for cPanel Hosting
# ==========================================

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure your settings."
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Test database connection
echo -e "${YELLOW}🗄️  Testing database connection...${NC}"
node -e "
const { sequelize } = require('./models');
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database connection failed${NC}"
    echo "Please check your database credentials in .env file"
    exit 1
fi

# Sync database models
echo -e "${YELLOW}🏗️  Synchronizing database models...${NC}"
node -e "
const { sequelize } = require('./models');
sequelize.sync({ alter: false })
  .then(() => {
    console.log('✅ Database synchronized');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database sync failed:', err.message);
    process.exit(1);
  });
"

# Seed initial data
echo -e "${YELLOW}🌱 Seeding initial data...${NC}"
node seed.js

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Seeding encountered issues, but continuing...${NC}"
fi

echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "   1. Configure your web server (Apache/Nginx) to proxy to port $(grep PORT .env | cut -d '=' -f2 || echo '3001')"
echo "   2. Or use cPanel 'Setup Node.js App' to configure the application"
echo "   3. Start the server with: node index.js"
echo ""
echo -e "${GREEN}🎉 Ready to go!${NC}"
