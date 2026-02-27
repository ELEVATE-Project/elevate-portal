FROM node:20

WORKDIR /workspace

# ---------- Environment (CI safe) ----------
ENV NX_DAEMON=false \
    NX_SKIP_NX_CACHE=true \
    NX_CLOUD=false \
    NPM_CONFIG_PROGRESS=false \
    NPM_CONFIG_LOGLEVEL=warn \
    NODE_OPTIONS="--max-old-space-size=8192"

# ---------- Copy dependency files ----------
COPY package.json package-lock.json ./

# ---------- Install dependencies ----------
RUN npm config set registry https://registry.npmjs.org/ \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 2 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm ci --legacy-peer-deps --ignore-scripts

RUN npm rebuild @swc/core || true

COPY . .


ENV NX_DAEMON=false
ENV NX_CLOUD=false
ENV NODE_OPTIONS="--max-old-space-size=8192 "

# ---------- Build apps ----------
# Build all REQUIRED apps used in ecosystem.config.js
RUN npx nx run-many --target=build --projects=shikshagraha-app,registration,content,players --parallel=1


# ---------- Copy Back Strategy ----------
# Guarantee that Next.js finds the .next folder by copying from dist back to source
# Only 'players' builds to dist/mfes/players, others build in-place
RUN cp -r dist/mfes/players/.next mfes/players/

# Also copy public folders back to ensure static assets are found
RUN cp -r dist/mfes/players/public mfes/players/

RUN npm install -g pm2

# Set production env AFTER build
ENV NODE_ENV=production


# Copy and prepare the startup script
COPY scripts/generate-env-config.sh ./scripts/generate-env-config.sh
RUN chmod +x ./scripts/generate-env-config.sh

EXPOSE 3000 4300 4301 4108

CMD ["sh", "-c", "./scripts/generate-env-config.sh && pm2-runtime ecosystem.config.js"]