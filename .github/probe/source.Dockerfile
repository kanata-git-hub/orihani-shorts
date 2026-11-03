FROM node:22-trixie-slim@sha256:b0ea3309e53992217c31c10aea3ef3ce47c3fffba7416a1e4a5a60b60373b1ed AS base
FROM base AS pillow-build
RUN apt-get update && apt-get install -y --no-install-recommends g++ python3-dev python3-pip python3-setuptools python3-wheel python3-pybind11 zlib1g-dev libfreetype-dev && rm -rf /var/lib/apt/lists/*
RUN printf '%s\n' 'Pillow==13.0.0 --hash=sha256:cdcd1ba258178f7356d74170c9a81ba4eab6a5d55748bc402a5a2a6fe6be3510' >/tmp/pillow.txt && MAX_CONCURRENCY=2 python3 -m pip --disable-pip-version-check install --no-build-isolation --no-deps --no-cache-dir --no-binary=:all: --require-hashes --target=/opt/pillow -C freetype=enable -C zlib=enable -C jpeg=disable -C tiff=disable -C raqm=disable -C lcms=disable -C webp=disable -C jpeg2000=disable -C imagequant=disable -C xcb=disable -C avif=disable -r /tmp/pillow.txt
FROM base
COPY --from=pillow-build /opt/pillow /opt/pillow
ENV PYTHONPATH=/opt/pillow

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
