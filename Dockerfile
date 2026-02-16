FROM node:20

WORKDIR /workspace

COPY package*.json ./

RUN npm install --legacy-peer-deps --ignore-scripts

RUN npm rebuild @swc/core || true

COPY . .


ENV NX_DAEMON=false
ENV NX_CLOUD=false
ENV NODE_OPTIONS="--max-old-space-size=8192 "

RUN npx nx run-many --target=build --projects=shikshagraha-app, --parallel=1

RUN npm install -g pm2


# Copy and prepare the startup script
COPY scripts/generate-env-config.sh ./scripts/generate-env-config.sh
RUN chmod +x ./scripts/generate-env-config.sh

EXPOSE 3000

CMD ["sh", "-c", "./scripts/generate-env-config.sh && pm2-runtime ecosystem.config.js"]