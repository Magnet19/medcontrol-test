FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
RUN npm install --workspace=@report-platform/shared --workspace=@report-platform/backend --include-workspace-root
COPY packages/shared packages/shared
COPY packages/backend packages/backend
RUN npx prisma generate --schema=packages/shared/prisma/schema.prisma
RUN npm run build --workspace=@report-platform/shared
RUN npm run build --workspace=@report-platform/backend

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/prisma ./packages/shared/prisma
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/backend/dist ./packages/backend/dist
COPY --from=build /app/packages/backend/package.json ./packages/backend/
COPY --from=build /app/package.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy --schema=packages/shared/prisma/schema.prisma && node packages/backend/dist/index.js"]
