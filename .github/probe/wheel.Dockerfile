FROM node:22-trixie-slim@sha256:b0ea3309e53992217c31c10aea3ef3ce47c3fffba7416a1e4a5a60b60373b1ed AS base
FROM base AS pillow-build
RUN apt-get update && apt-get install -y --no-install-recommends python3-pip && rm -rf /var/lib/apt/lists/*
RUN printf '%s\n' 'Pillow==13.0.0 --hash=sha256:5f56499c1a74d2b862beb0c33b8016f99d095858455df9d21583bbbc1c15b582 --hash=sha256:19b66ca0a4d25cc0200b381ce824c7ea090db61427315e73cfb05dbf1b35c369' >/tmp/pillow.txt && python3 -m pip --disable-pip-version-check install --no-deps --no-cache-dir --only-binary=:all: --require-hashes --target=/opt/pillow -r /tmp/pillow.txt
FROM base
COPY --from=pillow-build /opt/pillow/ /usr/local/lib/python3.13/dist-packages/

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ffmpeg fontconfig fonts-noto-cjk python3 libfreetype6 zlib1g tzdata && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN mkdir -p /usr/local/share/fonts/orihani && cp src/KyoboHandwriting2024psw.ttf /usr/local/share/fonts/orihani/ && fc-cache -f && fc-match "Kyobo Handwriting 2024"
RUN npm run build

USER node
EXPOSE 3000

CMD ["npm", "start"]
