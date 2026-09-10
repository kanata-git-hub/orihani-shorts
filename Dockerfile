FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fontconfig fonts-noto-cjk && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN mkdir -p /usr/local/share/fonts/orihani && cp src/KyoboHandwriting2024psw.ttf /usr/local/share/fonts/orihani/ && fc-cache -f && fc-match "Kyobo Handwriting 2024"
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
