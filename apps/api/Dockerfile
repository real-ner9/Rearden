FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json turbo.json ./

# Copy packages
COPY packages/ packages/

# Copy api app
COPY apps/api/ apps/api/

# Install all dependencies
RUN npm install

# Generate Prisma client (needs dummy DATABASE_URL at build time)
RUN cd apps/api && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build api
RUN npx turbo run build --filter=api

EXPOSE 3001

WORKDIR /app/apps/api

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
