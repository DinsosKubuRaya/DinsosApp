const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Tambahkan resolver untuk Firebase jika diperlukan
config.resolver.assetExts.push('cjs');

module.exports = config;