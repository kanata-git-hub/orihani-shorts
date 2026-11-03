# The manifest list covers amd64 and arm64. Refresh it alongside the runtime audit.
FROM node:22-trixie-slim@sha256:2117f713a417f3aff682ac8f5bc2ebbdf1beed51f36e67ab1e0fd3866b6d2d8f AS base
FROM base AS pillow-build
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ python3-dev python3-pip python3-wheel zlib1g-dev libfreetype-dev \
    && rm -rf /var/lib/apt/lists/*
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 PIP_NO_CACHE_DIR=1
COPY docker/pillow-build.txt docker/pillow-source.txt /tmp/
RUN python3 -m pip install --no-deps --only-binary=:all: --require-hashes \
    --target=/tmp/build-deps -r /tmp/pillow-build.txt
ENV PYTHONPATH=/tmp/build-deps
RUN python3 -m pip download --no-build-isolation --no-deps --no-binary=:all: \
    --require-hashes --dest=/tmp/src -r /tmp/pillow-source.txt \
    && MAX_CONCURRENCY=2 python3 -m pip install --no-index --no-build-isolation \
      --no-deps --no-compile --target=/opt/pillow \
      -C freetype=enable -C zlib=enable -C jpeg=disable -C tiff=disable \
      -C raqm=disable -C lcms=disable -C webp=disable -C jpeg2000=disable \
      -C imagequant=disable -C xcb=disable -C avif=disable /tmp/src/pillow-*.tar.gz

FROM base AS caption-runtime
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ffmpeg fontconfig fonts-noto-cjk python3 libfreetype6 zlib1g tzdata \
    && rm -rf /var/lib/apt/lists/*
# Debian's default site directory works even with a sanitized subprocess environment.
COPY --from=pillow-build /opt/pillow/ /usr/local/lib/python3.13/dist-packages/

FROM caption-runtime
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN mkdir -p /usr/local/share/fonts/orihani && cp src/KyoboHandwriting2024psw.ttf /usr/local/share/fonts/orihani/ && fc-cache -f && fc-match "Kyobo Handwriting 2024"
RUN npm run build

USER node
EXPOSE 3000

CMD ["npm", "start"]
