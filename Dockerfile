ARG NODE_VERSION=22.14.0

FROM node:${NODE_VERSION}-alpine

# Specify working directory
WORKDIR /app

# Fix permissions so the `node` user can access `node_modules` and '.cache'
RUN mkdir -p /app/node_modules && \
    chown -R node:node /app
RUN mkdir -p /app/node_modules/.cache && \
    chown -R node:node /app/node_modules

# Copy package.json and package-lock.json first to take advantage of Docker caching.
COPY --chown=node:node package.json package-lock.json ./

# Run the application as a non-root user.
USER node

# Download dependencies
RUN npm ci --omit=dev

# Copy the rest of the application files
COPY --chown=node:node . .

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD ["npm", "start"]
