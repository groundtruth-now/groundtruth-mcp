# GROUNDTRUTH MCP server over stdio (src/index.js). Keyless: no secrets needed.
# Optional env: GROUNDTRUTH_API_KEY (x-api-key).
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
USER node
ENTRYPOINT ["node", "src/index.js"]
