FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json server.mjs contact.mjs mail.mjs ./
COPY --chown=node:node public ./public
USER node
ENV NODE_ENV=production
EXPOSE 4173
CMD ["node", "server.mjs"]
