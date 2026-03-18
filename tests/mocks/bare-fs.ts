import fs from 'fs';

export default {
  ...fs,
  promises: fs.promises,
  default: fs
};
