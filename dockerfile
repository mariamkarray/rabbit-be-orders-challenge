# Use an official Node.js runtime as the base image
FROM node:22.11.0-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies using Yarn
RUN yarn install --production

# Copy the rest of the application code
COPY . .

RUN yarn prisma generate --schema src/prisma

# Set the environment variable for production
ENV NODE_ENV=production

# Expose the application port
EXPOSE 8080

# Start the application
CMD ["yarn", "start:prod"]
