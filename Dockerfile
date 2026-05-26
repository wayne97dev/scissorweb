# Universal image for the Duel RPS backend — works on Railway, Fly.io,
# Render (Docker), or any container host. The server runs via tsx (no compile),
# which sidesteps @solana/web3.js's CJS/ESM require quirk under plain node.
FROM node:20-slim
WORKDIR /app

# Install workspace deps first for better layer caching.
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY server/package.json ./server/package.json
COPY web/package.json ./web/package.json
RUN npm ci

# App source + build the shared package (server imports @rps/shared/dist).
COPY . .
RUN npm run build:shared

ENV NODE_ENV=production
ENV DEMO_MODE=true
ENV CLIENT_ORIGIN=*
ENV SOLANA_RPC=https://api.devnet.solana.com
ENV PORT=4000
EXPOSE 4000

# Host platforms that inject $PORT will override the default above.
CMD ["npm", "run", "start", "--workspace", "server"]
