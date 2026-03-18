import os from 'os';

export default {
  platform: () => os.platform(),
  arch: () => os.arch(),
  release: () => os.release(),
  hostname: () => os.hostname(),
  homedir: () => os.homedir(),
  tmpdir: () => os.tmpdir(),
};
