FROM node:22-trixie-slim@sha256:b0ea3309e53992217c31c10aea3ef3ce47c3fffba7416a1e4a5a60b60373b1ed AS base
FROM base AS pillow-build
RUN apt-get update && apt-get install -y --no-install-recommends g++ python3-dev python3-pip python3-wheel zlib1g-dev libfreetype-dev && rm -rf /var/lib/apt/lists/*
RUN printf '%s\n' 'setuptools==80.9.0 --hash=sha256:062d34222ad13e0cc312a4c02d73f059e86a4acbfbdea8f8f76b28c99f306922' 'pybind11==3.0.1 --hash=sha256:aa8f0aa6e0a94d3b64adfc38f560f33f15e589be2175e103c0a33c6bce55ee89' > /tmp/build-tools.txt && python3 -m pip --disable-pip-version-check install --no-deps --no-cache-dir --only-binary=:all: --require-hashes --target=/tmp/build-deps -r /tmp/build-tools.txt
ENV PYTHONPATH=/tmp/build-deps
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
