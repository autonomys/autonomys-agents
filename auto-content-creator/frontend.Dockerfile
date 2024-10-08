# Use Node.js 20 as the base image
FROM node:20

# Set the working directory
WORKDIR /app

# Copy dependency definitions
COPY ./frontend/package.json ./frontend/yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application's code
COPY ./frontend .

# Expose the port the frontend runs on
EXPOSE ${FRONTEND_PORT}

# Start the frontend application
CMD ["yarn", "dev", "--host", "0.0.0.0"]