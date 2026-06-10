FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend

# Install frontend deps and build
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

FROM node:18-alpine
WORKDIR /app

# Install backend deps from the repo root package files
COPY package*.json ./
RUN apk add --no-cache --virtual .gyp python3 make g++ \
    && npm ci --production --silent \
    && apk del .gyp

# Copy backend source
COPY backend/ ./

# Copy built frontend into backend (server expects frontend/dist when NODE_ENV=production)
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
EXPOSE 3003

CMD ["node", "server.js"]