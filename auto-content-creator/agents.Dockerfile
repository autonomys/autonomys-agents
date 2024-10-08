# Use Node.js 14 as the base image
FROM node:20

# Set the working directory
WORKDIR /app

# Copy dependency definitions
COPY ./agents/package.json ./agents/yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application's code
COPY ./agents .

# Expose the port the app runs on
EXPOSE ${AGENTS_PORT}

# Start the agents service
CMD ["yarn", "start"]