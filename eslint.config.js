// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      // Reanimated shared values are mutated via `.value` by design (e.g.
      // `scale.value = withTiming(...)`). The React Compiler immutability rule
      // flags every such assignment as a false positive, so it's disabled here.
      "react-hooks/immutability": "off",
    },
  },
  {
    ignores: [
      "dist/*",
      ".expo/*",
      "node_modules/*",
      "android/*",
      "ios/*",
      "expo-env.d.ts",
    ],
  },
]);
