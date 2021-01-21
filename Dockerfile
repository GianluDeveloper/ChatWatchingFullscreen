FROM node:15-alpine

WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
RUN touch /chat.txt; chmod 777 /chat.txt; chmod 777 /app/lastvideo.txt
CMD npm start
EXPOSE 3000
