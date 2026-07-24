FROM node:23-alpine

RUN corepack enable
RUN apk add --no-cache libc6-compat
RUN apk update
RUN npm i -g pnpm@9 --force

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

COPY package*.json ./

COPY . .

RUN pnpm install

RUN NODE_OPTIONS="--max-old-space-size=3072" pnpm run build

CMD ["pnpm", "run", "start:prod"]


