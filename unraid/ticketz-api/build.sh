#!/bin/bash

# Versión
VERSION="1.0.0"

# Construir la imagen
docker build -t ticketz/ticketz-api:${VERSION} -t ticketz/ticketz-api:latest -f unraid/ticketz-api/Dockerfile .

# Subir la imagen a Docker Hub
docker push ticketz/ticketz-api:${VERSION}
docker push ticketz/ticketz-api:latest 