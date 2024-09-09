FROM node:22.2.0

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps

RUN npm install nodemon

COPY . .

RUN npm run build

RUN npx prisma generate 

# RUN npx prisma migrate dev --name init

EXPOSE 5000

RUN chown -R node /usr/src/app

USER node

CMD ["npm","run","dev"]