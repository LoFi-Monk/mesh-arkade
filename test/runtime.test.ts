import test from 'brittle'
import { getFetch, getFs } from '../src/core/runtime.js'

test('getFetch returns a function', (t) => {
  const fetchFn = getFetch()
  t.is(typeof fetchFn, 'function', 'getFetch returns the global fetch function')
})

test('getFs returns an object with readFile and writeFile', (t) => {
  const fsMod = getFs()
  t.is(typeof fsMod.readFile, 'function', 'getFs exposes readFile')
  t.is(typeof fsMod.writeFile, 'function', 'getFs exposes writeFile')
})
