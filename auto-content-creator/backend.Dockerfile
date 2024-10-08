# Use Node.js 14 as the base image
FROM node:20

# Set the working directory
WORKDIR /app

# Copy dependency definitions
COPY ./backend/package.json ./backend/yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application's code
COPY ./backend .

# Expose the port the backend runs on
EXPOSE ${BACKEND_PORT}

# Start the backend server
CMD ["yarn", "start"]