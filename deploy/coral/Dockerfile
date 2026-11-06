FROM node:22-bookworm-slim@sha256:9f0dde62d10e7ff7a310ecaebd66225f6b46c17e6cb778449a77b05d3541bea2
ARG SOURCE_REVISION=unversioned
LABEL org.opencontainers.image.source="https://github.com/roro78/cuisine-cambodgienne" \
      org.opencontainers.image.revision="${SOURCE_REVISION}"
WORKDIR /app
COPY scripts/editorial-ai-job-gateway.mjs scripts/private-runtime-secret.mjs \
     scripts/coral-openai-secret.mjs scripts/coral-external-job-provider.mjs \
     scripts/coral-text-api-contract.mjs scripts/coral-chapter-voice-checks.mjs \
     scripts/coral-tts-jobs.mjs scripts/coral-tts-audio.mjs \
     scripts/coral-state-backup.mjs ./scripts/
RUN chmod -R 0555 /app
USER 1000:1000
EXPOSE 18678
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "--input-type=module", "-e", "try{const r=await fetch('http://127.0.0.1:18678/',{signal:AbortSignal.timeout(2000)});process.exit(r.status===401?0:1)}catch{process.exit(1)}"]
CMD ["node", "scripts/editorial-ai-job-gateway.mjs"]
