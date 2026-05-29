module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Allow imports from outside src/ in monorepo setup
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ModuleScopePlugin'
      );
      return webpackConfig;
    },
  },
};
