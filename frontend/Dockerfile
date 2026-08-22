FROM node:18-alpine

WORKDIR /app

# Copy package configurations
COPY package.json ./

# Install packages
RUN npm install

# Copy source
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Dev Server
CMD ["npm", "run", "dev"]
