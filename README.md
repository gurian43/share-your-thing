# share-your-thing
File sharing web app for school project

## Installation and dev env

install deps
```bash
npm i
```

set .env
```.env
PORT={backend_port}
MONGODB_URI={your_uri}
JWT_ACCESS_SECRET={your_access_secret}
RECAPTCHA_PRIVATE_SECRET={your_recaptcha_private_secret}
JWT_REFRESH_SECRET={your_refresh_secret}
```

run backend dev script in root
```bash
npm run dev
```

run frontend dev script in /frontend/
```bash
cd ./frontend
npm run dev
```

## Building for deployment
run build script in root
```bash
npm run build
```

## Running
run start script in root
```bash
npm run start
```