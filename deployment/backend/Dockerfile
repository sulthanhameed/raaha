# Build using the backend package directory as context:
# docker build -f deployment/backend/Dockerfile backend
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
USER node
EXPOSE 3001
CMD ["node", "src/index.js"]
