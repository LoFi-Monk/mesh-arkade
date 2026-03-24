if (typeof globalThis.fetch === 'undefined') {
  const fetch = await import('fetch')
  globalThis.fetch = fetch.default
}
if (typeof globalThis.process === 'undefined') {
  const process = await import('process')
  globalThis.process = process.default
}
if (typeof globalThis.Buffer === 'undefined') {
  const buffer = await import('buffer')
  globalThis.Buffer = buffer.Buffer
}
