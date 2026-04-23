FROM node:alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build-time env vars injected via docker-compose build.args
ARG VITE_AUTH_API_URL
ARG VITE_BOOK_API_URL
ARG VITE_ORDER_API_URL
ARG VITE_PAYMENT_API_URL
ARG VITE_BLOCKCHAIN_API_URL

ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_BOOK_API_URL=$VITE_BOOK_API_URL
ENV VITE_ORDER_API_URL=$VITE_ORDER_API_URL
ENV VITE_PAYMENT_API_URL=$VITE_PAYMENT_API_URL
ENV VITE_BLOCKCHAIN_API_URL=$VITE_BLOCKCHAIN_API_URL

RUN npm run build

FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
