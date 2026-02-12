# ---------- Base image ----------
FROM node:20

# ---------- Working directory ----------
WORKDIR /workspace

# ---------- Environment (CI safe) ----------
ENV NODE_ENV=production \
    NX_DAEMON=false \
    NX_SKIP_NX_CACHE=true \
    NX_CLOUD=false \
    NPM_CONFIG_PROGRESS=false \
    NPM_CONFIG_LOGLEVEL=warn \
    NODE_OPTIONS="--max-old-space-size=8192"

# ---------- Copy dependency files ----------
COPY package.json package-lock.json ./

# ---------- Harden npm for Jenkins ----------
RUN npm config set registry https://registry.npmjs.org/ \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 2 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm ci --legacy-peer-deps --ignore-scripts

# ---------- Install PM2 ----------
RUN npm install -g pm2

# ---------- Copy source ----------
COPY . .

# ---------- Build ONLY required app ----------
# --verbose ensures Jenkins shows progress
RUN npx nx build shikshagraha-app --verbose

COPY scripts/generate-env-config.sh ./scripts/generate-env-config.sh
RUN chmod +x ./scripts/generate-env-config.sh

EXPOSE 3000 4300 4301 4108

CMD ["sh", "-c", "./scripts/generate-env-config.sh && pm2-runtime ecosystem.config.js"]
