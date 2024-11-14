set shell := ["sh", "-uc"]

@test:
    ./node_modules/.bin/vitest

@install:
    npm install

@build:
    ./node_modules/.bin/tsc --project tsconfig.build.json

@lint:
    ./node_modules/.bin/eslint src test scripts

@publish: build
    npm run publish

@coverage:
    ./node_modules/.bin/vitest run --coverage ; open reports/coverage/index.html
