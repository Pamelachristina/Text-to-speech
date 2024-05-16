# Use an official Node runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Bundle app source inside Docker image
COPY . .

# Make port 3000 available outside this container
EXPOSE 3005

# Run the app when the container launches
CMD ["node", "server.js"]
