const { withAppDelegate } = require("@expo/config-plugins");

module.exports = function withIosSceneLifecycle(config) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== "swift") {
      throw new Error("withIosSceneLifecycle requires a Swift AppDelegate");
    }

    let contents = config.modResults.contents;
    contents = contents.replace(
      "class AppDelegate: ExpoAppDelegate {",
      "class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {"
    );
    // The SDK 57 template starts React Native in AppDelegate. Scene startup
    // must own this instead, including cold-start development-client URLs.
    contents = contents.replace(
      /#if os\(iOS\) \|\| os\(tvOS\)\s+window = UIWindow\(frame: UIScreen\.main\.bounds\)\s+factory\.startReactNative\([\s\S]*?\)\s*#endif/,
      "// ExpoAppSceneDelegate creates the window and starts React Native."
    );
    config.modResults.contents = contents;
    return config;
  });
};
