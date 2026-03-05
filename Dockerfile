# ---------- Stage 1: Build React app ----------
FROM node:18-alpine AS build

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build arguments
ARG REACT_APP_SITE_BASE_URL
ARG REACT_APP_API_BASE_URL

# Export env variables for React build
ENV REACT_APP_SITE_BASE_URL=${REACT_APP_SITE_BASE_URL}
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
ENV GENERATE_SOURCEMAP=false

# Build React
RUN echo "Building React with:" && \
    echo "REACT_APP_SITE_BASE_URL=$REACT_APP_SITE_BASE_URL" && \
    echo "REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL" && \
    npm run build


# ---------- Stage 2: Serve with Nginx ----------
FROM nginx:alpine

# Copy build output
COPY --from=build /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]