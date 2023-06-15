FROM node:16

RUN  mkdir /logs

COPY src/package.json /src/package.json

RUN cd /src; npm install

COPY src/index.js /src/index.js

COPY src/browser-load/* /src/browser-load/

COPY src/approval-load/* /src/approval-load/

COPY src/loan-load/* /src/loan-load/

COPY src/supercar-load/* /src/supercar-load/

COPY src/teastore-load/* /src/teastore-load/

CMD ["node", "/src/index.js"]