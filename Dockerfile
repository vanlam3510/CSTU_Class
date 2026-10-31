FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY server.js words.js ./
COPY public ./public
USER node
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
