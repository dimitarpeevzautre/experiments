const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Declares this app as an Android Auto templated app:
 * - res/xml/automotive_app_desc.xml with <uses name="template" />
 * - <meta-data com.google.android.gms.car.application> pointing at it
 *
 * The CarAppService itself ships in react-native-carplay's library manifest
 * and is merged in automatically.
 */
const AUTOMOTIVE_APP_DESC = `<?xml version="1.0" encoding="utf-8"?>
<automotiveApp>
  <uses name="template" />
</automotiveApp>
`;

function withAndroidAuto(config) {
  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const xmlDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app/src/main/res/xml',
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'automotive_app_desc.xml'), AUTOMOTIVE_APP_DESC);
      return modConfig;
    },
  ]);

  config = withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];
    if (application) {
      application['meta-data'] = application['meta-data'] ?? [];
      const already = application['meta-data'].some(
        (item) => item.$['android:name'] === 'com.google.android.gms.car.application',
      );
      if (!already) {
        application['meta-data'].push({
          $: {
            'android:name': 'com.google.android.gms.car.application',
            'android:resource': '@xml/automotive_app_desc',
          },
        });
      }
    }
    return modConfig;
  });

  return config;
}

module.exports = withAndroidAuto;
