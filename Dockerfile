# Simple static site server for Railway with env var injection
FROM nginx:alpine

# Copy static files to nginx html directory
COPY . /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create startup script that injects env vars
RUN echo '#!/bin/sh' > /docker-entrypoint.d/40-inject-config.sh && \
    echo 'echo "window.__REELBERLIN_API_URL__ = \"${REELBERLIN_API_URL:-}\";" > /usr/share/nginx/html/config.js' >> /docker-entrypoint.d/40-inject-config.sh && \
    chmod +x /docker-entrypoint.d/40-inject-config.sh

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
