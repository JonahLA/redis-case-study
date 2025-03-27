FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript for production
RUN npm run build

# Set environment variables
ENV NODE_ENV=production

# Start command for production
CMD ["node", "dist/index.js"]
