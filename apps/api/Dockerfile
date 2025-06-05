# Use Node.js 20-alpine as the base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose the application port (3000 by default)
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main.js"]
