FROM node:22-alpine3.20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

#(Vite uses port 5173 by default)
EXPOSE 5173


CMD ["npm", "run", "dev"]