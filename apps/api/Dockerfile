FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy pre-built application
COPY apps/api/deploy .

# Install production dependencies
RUN pnpm install --prod

# Expose the port
EXPOSE 3003

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3003

# Start the application
CMD ["node", "dist/index.js"]
