import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appId = 'si.djstalca.risirazlozipokazi';
const variables = path.join(root, 'android', 'variables.gradle');
const appGradle = path.join(root, 'android', 'app', 'build.gradle');
const manifest = path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const mainActivity = path.join(root, 'android', 'app', 'src', 'main', 'java', ...appId.split('.'), 'MainActivity.java');

function replaceNumber(text, name, value) {
  const re = new RegExp(`${name}\\s*=\\s*\\d+`);
  return re.test(text) ? text.replace(re, `${name} = ${value}`) : text;
}

if (fs.existsSync(variables)) {
  let v = fs.readFileSync(variables, 'utf8');
  v = replaceNumber(v, 'minSdkVersion', 24);
  v = replaceNumber(v, 'compileSdkVersion', 36);
  v = replaceNumber(v, 'targetSdkVersion', 36);
  fs.writeFileSync(variables, v);
}

if (fs.existsSync(appGradle)) {
  let g = fs.readFileSync(appGradle, 'utf8');
  g = g.replace(/versionCode\s+\d+/, 'versionCode 1');
  g = g.replace(/versionName\s+["'][^"']+["']/, 'versionName "1.0.0"');

  if (!g.includes('def keystoreProperties = new Properties()')) {
    g = `def keystoreProperties = new Properties()\ndef keystorePropertiesFile = rootProject.file('keystore.properties')\ndef hasReleaseKeystore = keystorePropertiesFile.exists()\nif (hasReleaseKeystore) {\n    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))\n}\n\n${g}`;
  }

  if (!g.includes('signingConfigs {')) {
    g = g.replace(
      /android \{\n/,
      `android {\n    signingConfigs {\n        release {\n            if (hasReleaseKeystore) {\n                storeFile file(keystoreProperties['storeFile'])\n                storePassword keystoreProperties['storePassword']\n                keyAlias keystoreProperties['keyAlias']\n                keyPassword keystoreProperties['keyPassword']\n            }\n        }\n    }\n`
    );
  }

  if (!g.includes('if (hasReleaseKeystore) signingConfig signingConfigs.release')) {
    g = g.replace(
      /release \{\n\s*minifyEnabled/,
      `release {\n            if (hasReleaseKeystore) signingConfig signingConfigs.release\n            minifyEnabled`
    );
  }
  fs.writeFileSync(appGradle, g);
}

if (fs.existsSync(manifest)) {
  let m = fs.readFileSync(manifest, 'utf8');

  // Capacitor template already contains allowBackup, so replace it instead of
  // inserting a duplicate attribute. Keep this block safe to run repeatedly.
  if (/android:allowBackup="[^"]*"/.test(m)) {
    m = m.replace(/android:allowBackup="[^"]*"/, 'android:allowBackup="false"');
  } else {
    m = m.replace(/<application\n/, '<application\n        android:allowBackup="false"\n');
  }

  if (/android:usesCleartextTraffic="[^"]*"/.test(m)) {
    m = m.replace(/android:usesCleartextTraffic="[^"]*"/, 'android:usesCleartextTraffic="false"');
  } else {
    m = m.replace(/android:allowBackup="false"\n/, 'android:allowBackup="false"\n        android:usesCleartextTraffic="false"\n');
  }

  m = m.replace(/android:configChanges="([^"]*)"/, (_, value) => {
    const parts = value.split('|').filter(Boolean);
    if (!parts.includes('density')) parts.push('density');
    return `android:configChanges="${[...new Set(parts)].join('|')}"`;
  });

  // The app is intentionally fully offline and has no network feature in v1.0.
  // Removing INTERNET provides an additional technical guarantee for Data Safety.
  m = m.replace(/\n\s*<uses-permission android:name="android\.permission\.INTERNET"\s*\/?>/g, '');

  fs.writeFileSync(manifest, m);
}

if (fs.existsSync(mainActivity)) {
  let a = fs.readFileSync(mainActivity, 'utf8');
  if (!a.includes('FLAG_KEEP_SCREEN_ON')) {
    a = a.replace(
      'import com.getcapacitor.BridgeActivity;',
      'import com.getcapacitor.BridgeActivity;\nimport android.os.Bundle;\nimport android.view.WindowManager;'
    );
    a = a.replace(
      'public class MainActivity extends BridgeActivity {}',
      `public class MainActivity extends BridgeActivity {\n  @Override\n  public void onCreate(Bundle savedInstanceState) {\n    super.onCreate(savedInstanceState);\n    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);\n  }\n}`
    );
    fs.writeFileSync(mainActivity, a);
  }
}

console.log('Android production patch applied: SDK 24/36, release signing, offline/privacy hardening and keep-screen-on.');
