ARG NODE_VERSION=22.14.0

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV=production

# Specify working directory
WORKDIR /app

# Fix permissions so the `node` user can access `node_modules`
RUN chown -R node:node /app

# Copy package.json and package-lock.json first to take advantage of Docker caching.
COPY --chown=node:node package.json package-lock.json ./

# Run the application as a non-root user.
USER node

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev


# Copy the rest of the application files
COPY --chown=node:node . .

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD ["npm", "start"]
