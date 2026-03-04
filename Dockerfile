FROM node:22-alpine AS development

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

COPY prisma /app/prisma

COPY prisma.config.ts .