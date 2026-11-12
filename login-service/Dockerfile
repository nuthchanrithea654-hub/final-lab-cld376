
# Use Node.js image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy application code
COPY --chown=node:node server.js ./

# Run as non-root user
USER node

# Expose Login port
EXPOSE 3002

# Start Login Service
CMD ["node", "server.js"]
