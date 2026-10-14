#!/bin/sh
# This Dokploy instance has no "Build Args" field for Dockerfile builds, so
# Vite-time variables (VITE_*) can't be injected at `docker build` time from
# the Dokploy UI. Instead, the frontend is built with a fixed placeholder
# baked in, and at container *start* (here) we substitute it with the real
# value from the normal runtime environment variable, which Dokploy's
# "Environment Settings" tab can set.
set -e

if [ -n "$VITE_GOOGLE_MAPS_API_KEY" ]; then
    find /app/client/dist -type f -name '*.js' -exec \
        sed -i "s|__VITE_GOOGLE_MAPS_API_KEY__|$VITE_GOOGLE_MAPS_API_KEY|g" {} +
fi

exec node index.js
