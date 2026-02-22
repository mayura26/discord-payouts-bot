FROM node:20-alpine

# Required for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Deploy slash commands, then run the bot
CMD ["sh", "-c", "node dist/deploy-commands.js && npm start"]
