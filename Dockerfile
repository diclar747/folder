# --- Build del frontend ---
FROM node:20-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --legacy-peer-deps
COPY client/ ./
RUN npm run build

# --- Servidor (API + frontend) ---
FROM node:20-alpine
WORKDIR /app/server
ENV NODE_ENV=production SERVE_CLIENT=true PORT=3001
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ ./
COPY --from=client /app/client/dist /app/client/dist
EXPOSE 3001
CMD ["node", "index.js"]
