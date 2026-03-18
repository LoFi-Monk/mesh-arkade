export default {
  connect: () => ({
    on: () => {},
    write: () => {},
    destroy: () => {},
  }),
  Socket: class {
    connect() {}
    on() {}
    write() {}
    destroy() {}
  }
};
