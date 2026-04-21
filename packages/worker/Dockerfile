FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/worker/package.json packages/worker/
RUN npm install --workspace=@report-platform/shared --workspace=@report-platform/worker --include-workspace-root
COPY packages/shared packages/shared
COPY packages/worker packages/worker
RUN npx prisma generate --schema=packages/shared/prisma/schema.prisma
RUN npm run build --workspace=@report-platform/shared
RUN npm run build --workspace=@report-platform/worker

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/worker/dist ./packages/worker/dist
COPY --from=build /app/packages/worker/package.json ./packages/worker/
COPY --from=build /app/package.json ./
ENV NODE_ENV=production
ENV REPORTS_DIR=/app/packages/worker/dist/reports
CMD ["node", "packages/worker/dist/index.js"]
