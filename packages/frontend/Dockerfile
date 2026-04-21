FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/frontend/package.json packages/frontend/
RUN npm install --workspace=@report-platform/shared --workspace=@report-platform/frontend --include-workspace-root
COPY packages/shared packages/shared
COPY packages/frontend packages/frontend
RUN npm run build --workspace=@report-platform/shared
RUN npm run build --workspace=@report-platform/frontend

FROM nginx:1.27-alpine
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
