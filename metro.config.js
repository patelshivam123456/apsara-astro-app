const { getDefaultConfig } = require("expo/metro-config");
const exclusionListModule = require("@expo/metro/metro-config/defaults/exclusionList");
const exclusionList = exclusionListModule.default || exclusionListModule;

const config = getDefaultConfig(__dirname);
const root = __dirname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

config.resolver.blockList = exclusionList([
  new RegExp(`${root}/\\.agents/.*`),
  new RegExp(`${root}/\\.codex/.*`),
  new RegExp(`${root}/\\.git/.*`),
  new RegExp(`${root}/dist/.*`)
]);

module.exports = config;
