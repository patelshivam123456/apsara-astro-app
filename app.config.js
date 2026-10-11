const STAGING_API_URL = "https://staging-api.apsraastro.com";
const PRODUCTION_API_URL = "https://api.apsraastro.com";

const isProduction =
  process.env.EXPO_PUBLIC_APP_ENV === "production" ||
  process.env.EAS_BUILD_PROFILE === "production";

const defaultApiUrl = isProduction ? PRODUCTION_API_URL : STAGING_API_URL;
const apiUrl = process.env.EXPO_PUBLIC_API_URL || defaultApiUrl;
const astroApiUrl = process.env.EXPO_PUBLIC_ASTRO_API_URL || defaultApiUrl;
const transactionApiUrl = process.env.EXPO_PUBLIC_TRANSACTION_API_URL || defaultApiUrl;

module.exports = {
  expo: {
    name: "ApsraAstro",
    slug: "apsara-astro-mobile",
    scheme: "apsaraastro",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/apsra-astro-logo.png",
    userInterfaceStyle: "automatic",
    assetBundlePatterns: ["**/*"],
    plugins: [
      "expo-router",
      "expo-secure-store",
      "@react-native-community/datetimepicker",
      "expo-font",
      "./plugins/withCleartextTraffic",
      "expo-image",
      "expo-sharing",
      "expo-splash-screen"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.apsaraastro.mobile"
    },
    android: {
      package: "com.apsaraastro.mobile",
      permissions: ["INTERNET"],
      adaptiveIcon: {
        foregroundImage: "./src/assets/apsra-astro-logo.png",
        backgroundColor: "#fff7e8"
      }
    },
    extra: {
      router: {
        origin: false
      },
      apiUrl,
      astroApiUrl,
      transactionApiUrl,
      apiUrls: {
        staging: STAGING_API_URL,
        production: PRODUCTION_API_URL
      },
      eas: {
        projectId: "82173d52-de95-4a59-b830-b36228361940"
      }
    },
    owner: "shivam_onecorp2"
  }
};
