FROM node:22.5.1-alpine3.20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install && npm run build

COPY ./dist ./

EXPOSE 3000

CMD [ "node", "main.js" ]
