import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const variables = path.join(root, 'android', 'variables.gradle');
const mainActivity = path.join(root, 'android', 'app', 'src', 'main', 'java', ...'si.djstalca.risirazlozipokazi'.split('.'), 'MainActivity.java');

if (fs.existsSync(variables)) {
  let v = fs.readFileSync(variables, 'utf8');
  v = v.replace(/compileSdkVersion\s*=\s*\d+/, 'compileSdkVersion = 36');
  v = v.replace(/targetSdkVersion\s*=\s*\d+/, 'targetSdkVersion = 36');
  fs.writeFileSync(variables, v);
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
      `public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
  }
}`
    );
    fs.writeFileSync(mainActivity, a);
  }
}

console.log('Android production patch applied: target/compile SDK 36 + keep screen on.');
