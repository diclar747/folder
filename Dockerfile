# --- Build del frontend ---
FROM node:20-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --legacy-peer-deps
COPY client/ ./
# No build-arg support in this Dokploy install for Dockerfile builds, so the
# Google Maps key can't be injected at build time from its UI. Bake in a
# placeholder instead; docker-entrypoint.sh swaps it for the real runtime
# env var (set in Dokploy's "Environment Settings") when the container starts.
ENV VITE_GOOGLE_MAPS_API_KEY=__VITE_GOOGLE_MAPS_API_KEY__
RUN npm run build

# --- Servidor (API + frontend) ---
FROM node:20-alpine
WORKDIR /app/server
ENV NODE_ENV=production SERVE_CLIENT=true PORT=3001 UPLOAD_DIR=/app/uploads
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ ./
COPY --from=client /app/client/dist /app/client/dist
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
VOLUME /app/uploads
EXPOSE 3001
CMD ["/app/docker-entrypoint.sh"]
