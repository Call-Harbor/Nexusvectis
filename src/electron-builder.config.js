/* eslint-disable no-undef */
module.exports = {
  appId: 'com.fleetai.intellect',
  productName: 'IntellectMode',
  directories: {
    buildResources: 'public',
    output: 'dist_electron',
  },
  files: [
    'dist/**/*',
    'public/electron.js',
    'public/preload.js',
    'node_modules/**/*',
    'package.json',
  ],
  win: {
    target: ['nsis', 'portable'],
    certificateFile: null,
    certificatePassword: null,
    signingHashAlgorithms: ['sha256'],
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'IntellectMode',
  },
  mac: {
    target: ['dmg', 'zip'],
    category: 'public.app-category.utilities',
  },
  linux: {
    target: ['AppImage', 'deb'],
    category: 'Utility',
  },
};