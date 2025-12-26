# Simple static site server for Railway with dynamic port and env var injection
FROM nginx:alpine

# Copy static files to nginx html directory
COPY . /usr/share/nginx/html

# Move nginx config template for environment variable substitution
# Alpine Nginx image automatically runs envsubst on files in /etc/nginx/templates/*.template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Create startup script that injects our custom REELBERLIN_API_URL into config.js
# This runs alongside the default Nginx entrypoint scripts
RUN echo '#!/bin/sh' > /docker-entrypoint.d/40-inject-config.sh && \
    echo 'echo "window.__REELBERLIN_API_URL__ = \"${REELBERLIN_API_URL:-}\";" > /usr/share/nginx/html/config.js' >> /docker-entrypoint.d/40-inject-config.sh && \
    chmod +x /docker-entrypoint.d/40-inject-config.sh

# Default port for local testing, Railway will override this
ENV PORT=80

EXPOSE ${PORT}

CMD ["nginx", "-g", "daemon off;"]
