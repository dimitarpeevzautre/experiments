const { withGradleProperties, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Sideload-friendly release builds: arm64-only, R8 minify + resource shrink,
 * compressed native libs. Keeps the demo APK ~20MB instead of ~100MB.
 * NOTE: for a Play Store AAB, drop the arm64-only restriction — the bundle
 * should carry all architectures.
 */
const PROPS = [
  ['reactNativeArchitectures', 'arm64-v8a'],
  ['android.enableMinifyInReleaseBuilds', 'true'],
  ['android.enableShrinkResourcesInReleaseBuilds', 'true'],
  ['expo.useLegacyPackaging', 'true'],
];

const KEEP_RULES = `
# Keep the car app service + templates (constructed reflectively from JS descriptors)
-keep class org.birkir.carplay.** { *; }
`;

module.exports = function withCompactRelease(config) {
  config = withGradleProperties(config, (modConfig) => {
    for (const [key, value] of PROPS) {
      modConfig.modResults = modConfig.modResults.filter(
        (item) => !(item.type === 'property' && item.key === key),
      );
      modConfig.modResults.push({ type: 'property', key, value });
    }
    return modConfig;
  });

  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const rulesPath = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app/proguard-rules.pro',
      );
      if (fs.existsSync(rulesPath) && !fs.readFileSync(rulesPath, 'utf8').includes('org.birkir.carplay')) {
        fs.appendFileSync(rulesPath, KEEP_RULES);
      }
      return modConfig;
    },
  ]);

  return config;
};
