FROM node:22-bookworm-slim AS deps

ARG PNPM_VERSION=11.5.2
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /app

RUN npm install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild @parcel/watcher esbuild sharp vue-demi

FROM deps AS builder

ARG API_BASE=https://api.greasygang.co
ARG GQL_HOST=https://api.greasygang.co/graphql
ARG CALLBACK_URL=https://greasygang.co/auth/callback
ENV API_BASE=$API_BASE
ENV GQL_HOST=$GQL_HOST
ENV CALLBACK_URL=$CALLBACK_URL

COPY . .
RUN pnpm run build

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app

COPY --from=builder --chown=node:node /app/.output ./.output

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
