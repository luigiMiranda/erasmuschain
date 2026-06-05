FROM node:22-alpine

WORKDIR /app

# Install wget per healthcheck
RUN apk add --no-cache wget

# Copia package.json e installa dipendenze
COPY package.json package-lock.json* ./
RUN npm install

# Copia il resto del backend
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]