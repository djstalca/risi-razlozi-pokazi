# Android release signing

Google Play uporablja **Play App Signing**, vendar razvijalec še vedno potrebuje svoj **upload key**, s katerim podpiše AAB pred nalaganjem.

## 1. Ustvari upload key

Primer z JDK `keytool`:

```bash
keytool -genkeypair -v \
  -keystore risi-razlozi-pokazi-upload-key.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000
```

Datoteko `.jks` in gesla shrani izven repozitorija in ju varnostno kopiraj na vsaj dve varni lokaciji.

## 2. Nastavi `keystore.properties`

Po `npm run android:init` kopiraj `keystore.properties.example` v `android/keystore.properties` in popravi vrednosti:

```properties
storeFile=/absolute/path/to/risi-razlozi-pokazi-upload-key.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

`keystore.properties`, `*.jks` in `*.keystore` so v `.gitignore` in se ne smejo commitati.

## 3. Zgradi podpisan AAB

```bash
npm run android:sync
npm run android:bundle
```

Če je `keystore.properties` prisoten, produkcijski patch release build poveže z `signingConfigs.release`.

Končni AAB:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

## 4. Google Play

Ob prvem uploadu v Play Console vključi Play App Signing. Upload key ostane tvoj ključ za prihodnje release builde; Googlov app-signing key pa Google varno upravlja za distribucijo uporabnikom.

## Pravila

- nikoli ne commitaj ključev ali gesel,
- upload key ne pošiljaj po e-pošti ali chatu,
- ne uporabljaj debug keystore za produkcijo,
- pred vsakim releaseom preveri `versionCode` in `versionName`,
- izgubo upload keya rešuj samo skozi uradni Play Console postopek za reset upload keya.
