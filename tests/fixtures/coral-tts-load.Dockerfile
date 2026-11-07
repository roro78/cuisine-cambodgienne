# Isolated CI load tool only. Never referenced by deploy/coral/compose.yaml.
FROM node:22-bookworm-slim@sha256:9f0dde62d10e7ff7a310ecaebd66225f6b46c17e6cb778449a77b05d3541bea2
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg time && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY scripts/ ./scripts/
COPY src/data/atelier-recette-audio/ ./src/data/atelier-recette-audio/
COPY src/data/atelier-recette-guides/ ./src/data/atelier-recette-guides/
COPY tests/coral-tts-long.test.mjs ./tests/
COPY tests/fixtures/coral-tts-long-process.mjs ./tests/fixtures/
COPY tests/fixtures/coral-memory.mjs ./tests/fixtures/
USER 1000:1000
CMD ["node", "--test", "--test-concurrency=1", "tests/coral-tts-long.test.mjs"]
