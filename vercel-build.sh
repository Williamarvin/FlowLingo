#!/bin/bash

# Build script for Vercel deployment
echo "Starting Vercel build..."

# Build frontend with Vite
echo "Building frontend..."
npx vite build

# Build backend with esbuild, excluding problematic dependencies
echo "Building backend..."
npx esbuild server/index.ts \
  --platform=node \
  --format=esm \
  --bundle \
  --outdir=dist \
  --external:drizzle-orm \
  --external:drizzle-zod \
  --external:@neondatabase/serverless \
  --external:ws \
  --external:express \
  --external:express-session \
  --external:passport \
  --external:passport-local \
  --external:connect-pg-simple

echo "Build complete!"