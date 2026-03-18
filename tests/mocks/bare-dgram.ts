export default {
  createSocket: () => ({
    bind: () => {},
    on: () => {},
    send: () => {},
    close: () => {},
    address: () => ({ port: 12345, address: '127.0.0.1' }),
  })
};
