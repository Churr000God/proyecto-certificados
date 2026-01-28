# Stage 1: Build (Install all dependencies)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Use npm ci for reliable builds
RUN npm ci

# Stage 2: Production (Minimal image)
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy package.json and install only production dependencies
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy application code
COPY --chown=node:node . .

# Security: Run as non-root user
USER node

EXPOSE 3000

CMD ["npm", "start"]
