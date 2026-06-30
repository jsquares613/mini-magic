# =============================================================================
# Stage 1 – deps
# Install production + dev dependencies so the build step has everything it needs.
# =============================================================================
FROM node:20-alpine AS deps
WORKDIR /app

# Install libc compat layer required by some native binaries on Alpine
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm ci

# =============================================================================
# Stage 2 – builder
# Compile the Next.js application.
# =============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables – these are embedded at compile time.
# Pass them as --build-arg when calling `docker build`.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# NOTE: SUPABASE_SERVICE_ROLE_KEY and WHATSAPP_NUMBER are server-only secrets.
# Do NOT pass them as build args. Inject them at runtime via `docker run -e`
# or your ECS/EKS task definition.

# Disable Next.js telemetry during the build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# =============================================================================
# Stage 3 – runner (final production image)
# Minimal image: only the Next.js standalone output is copied over.
# =============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy the standalone Next.js output produced by `output: 'standalone'`
# (enabled below). The static assets and public folder are added separately.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# HOSTNAME must be set inline in the shell command so Node.js binds to
# 0.0.0.0 (all interfaces) instead of 127.0.0.1 (localhost only).
# App Runner / ECS TCP health checks come from outside the container and
# cannot reach a process listening only on localhost.
CMD ["/bin/sh", "-c", "HOSTNAME=0.0.0.0 exec node server.js"]
