FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .
ARG VITE_OPENAI_API_URL
ARG VITE_OPENAI_MODEL
ENV VITE_OPENAI_API_URL=$VITE_OPENAI_API_URL
ENV VITE_OPENAI_MODEL=$VITE_OPENAI_MODEL
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache wget
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
