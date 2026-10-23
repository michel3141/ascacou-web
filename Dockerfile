
FROM node:26

RUN npm install -g corepack \
    && corepack enable

USER node
WORKDIR /workspace

CMD ["sleep", "infinity"]

