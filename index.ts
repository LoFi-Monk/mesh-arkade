/// <reference path="./types/pear.d.ts" />

export {}

const { versions } = Pear
console.log('Pear terminal application running')
console.log(await versions())
