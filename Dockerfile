# GROUNDTRUTH MCP over stdio. Keyless: no secrets, no env.
# Bridges stdio to the live remote server at https://api.groundtruths.xyz/mcp.
FROM node:22-alpine
RUN npm install -g mcp-remote@0.15.2 && npm cache clean --force
USER node
ENTRYPOINT ["mcp-remote", "https://api.groundtruths.xyz/mcp"]
