set shell := ["sh", "-uc"]

@install:
    npm install

@build:
    ./node_modules/.bin/tsc --project tsconfig.build.json

@lint:
    ./node_modules/.bin/eslint src test scripts

@test:
    ./node_modules/.bin/vitest

# @coverage:
