FROM node:12.16-alpine3.11
WORKDIR /nile
RUN apk add curl
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.16.0/bin/linux/amd64/kubectl
RUN chmod +x ./kubectl
RUN mv ./kubectl /usr/local/bin/kubectl

COPY ./dist ./dist
RUN yarn
ENTRYPOINT [ "node", "dist" ];