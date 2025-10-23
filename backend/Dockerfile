FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies including devDependencies for building
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies for production
RUN npm prune --production

EXPOSE 5000

ENV NODE_ENV production
ENV PORT 5000

CMD ["node", "dist/index.js"]