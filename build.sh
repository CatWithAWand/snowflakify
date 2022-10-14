#!/usr/bin/env sh

rm -rf ./dist

tsc -p tsconfig.json
tsc -p tsconfig-cjs.json

cat >dist/cjs/package.json <<!EOF
{
    "type": "commonjs"
}
!EOF

cat >dist/mjs/package.json <<!EOF
{
    "type": "module"
}
!EOF
