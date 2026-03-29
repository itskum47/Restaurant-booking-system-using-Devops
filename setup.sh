#!/bin/bash

# DINE.AI – Complete Setup Script
# Initializes all services and dependencies for the restaurant booking system

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║     DINE.AI - Restaurant Booking System Setup         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required commands
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

commands=("node" "npm" "docker" "docker-compose" "git")
for cmd in "${commands[@]}"; do
  if command -v "$cmd" &> /dev/null; then
    echo -e "${GREEN}✅ $cmd${NC}"
  else
    echo -e "${YELLOW}⚠️  $cmd not found. Please install it.${NC}"
  fi
done

echo ""
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd services/frontend
npm install
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

cd ../../

echo ""
echo -e "${BLUE}📦 Installing other services dependencies...${NC}"

# Install Node.js services
for service in api-gateway restaurant-service notification-service; do
  if [ -f "services/$service/package.json" ]; then
    echo "  Installing $service..."
    cd services/$service
    npm install > /dev/null 2>&1
    cd ../../
    echo -e "${GREEN}  ✅ $service${NC}"
  fi
done

# Install Python services
for service in ai-service booking-service; do
  if [ -f "services/$service/requirements.txt" ]; then
    echo "  $service requires Python setup (see services/$service/README.md)"
  fi
done

echo ""
echo -e "${BLUE}🔧 Setting up environment files...${NC}"

# Check frontend .env
if [ ! -f "services/frontend/.env" ]; then
  echo "Creating services/frontend/.env..."
  cat > services/frontend/.env << EOF
VITE_GEMINI_API_KEY=PASTE_YOUR_KEY_HERE
VITE_API_URL=http://localhost:3000/api
EOF
  echo -e "${YELLOW}⚠️  Update VITE_GEMINI_API_KEY in services/frontend/.env${NC}"
else
  echo -e "${GREEN}✅ services/frontend/.env exists${NC}"
fi

echo ""
echo -e "${BLUE}🐳 Checking Docker setup...${NC}"
if docker-compose config --quiet 2>/dev/null; then
  echo -e "${GREEN}✅ docker-compose.yml is valid${NC}"
else
  echo -e "${YELLOW}⚠️  docker-compose.yml has issues${NC}"
fi

echo ""
echo -e "${BLUE}🏗️  Building frontend...${NC}"
cd services/frontend
npm run build > /dev/null 2>&1
echo -e "${GREEN}✅ Frontend build successful${NC}"
cd ../../

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              SETUP COMPLETE                            ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  Next steps:                                           ║"
echo "║  1. Add Gemini API key to services/frontend/.env       ║"
echo "║  2. Run: docker-compose up                             ║"
echo "║  3. Visit: http://localhost:3000                       ║"
echo "║                                                        ║"
echo "║  Development:                                          ║"
echo "║  - npm run dev (in services/frontend)                  ║"
echo "║  - npm start (in api-gateway/etc)                      ║"
echo "╚════════════════════════════════════════════════════════╝"
