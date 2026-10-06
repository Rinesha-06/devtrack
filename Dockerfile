# ============================================================
# DevTrack Multi-Stage Production Dockerfile (Google Cloud Run)
# Optimized for Fast Startup, Scale-to-Zero, and Lowest Memory Footprint
# ============================================================

# --- Stage 1: Frontend Build ---
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Backend Build ---
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

# --- Stage 3: Production Runtime ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install only production dependencies
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled backend
COPY --from=backend-builder /app/backend/dist ./dist

# Copy compiled frontend into dist/public and ../frontend/dist for static serving
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose Cloud Run port
EXPOSE 8080

# Non-root security user
USER node

# Start DevTrack Unified Server
CMD ["node", "dist/index.js"]
