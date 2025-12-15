# ===============================
# Stage 1: Build dependencies
# ===============================
FROM node:20-alpine AS builder

# Prevent npm from running as root later
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy only dependency files first (cache-friendly)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source
COPY . .

# ===============================
# Stage 2: Runtime (locked down)
# ===============================
FROM node:20-alpine

# Security hardening
ENV NODE_ENV=production
ENV TZ=UTC

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy built app & node_modules
COPY --from=builder /app /app

# Drop privileges
USER app

# Railway injects PORT automatically
EXPOSE 8080

# Healthcheck (optional but recommended)
HEALTHCHECK --interval=30s --timeout=3s --retries=2 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT||8080,path:'/health'},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Start server
CMD ["node","server.js"]
