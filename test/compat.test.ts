import test from 'brittle'
import fs from 'fs'
import crypto from 'crypto'
import path from 'path'

test('global.fetch is a function', (t) => {
  t.is(typeof globalThis.fetch, 'function', 'global.fetch is a function')
})

test('global.process has env and cwd', (t) => {
  t.ok(globalThis.process, 'global.process exists')
  t.ok(globalThis.process.env, 'global.process.env exists')
  t.is(typeof globalThis.process.cwd, 'function', 'global.process.cwd is a function')
})

test('global.Buffer is a constructor', (t) => {
  t.is(typeof globalThis.Buffer, 'function', 'global.Buffer is a function')
  const buf = globalThis.Buffer.from('hello')
  t.is(buf.toString(), 'hello', 'Buffer works')
})

test('require("fs") returns object with readFile/writeFile', (t) => {
  t.is(typeof fs.readFile, 'function', 'fs.readFile is a function')
  t.is(typeof fs.writeFile, 'function', 'fs.writeFile is a function')
})

test('require("crypto") returns object with createHash', (t) => {
  t.is(typeof crypto.createHash, 'function', 'crypto.createHash is a function')
})

test('require("path") returns object with join/resolve', (t) => {
  t.is(typeof path.join, 'function', 'path.join is a function')
  t.is(typeof path.resolve, 'function', 'path.resolve is a function')
})
