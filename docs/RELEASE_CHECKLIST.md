# Release checklist

Google Play ime: **Riši, razloži, pokaži**  
Brand v aplikaciji: **AKCIJA**  
Package ID: **`si.djstalca.risirazlozipokazi`**

## Pripravljeno v repozitoriju

- [x] Capacitor 8 Android projekt
- [x] min SDK 24
- [x] compile/target SDK 36
- [x] versionName 1.0.0 / versionCode 1
- [x] Java 21 CI
- [x] Android lint + test + debug build gate
- [x] avtomatski JS syntax gate
- [x] avtomatski game-rule testi
- [x] avtomatski quality gate za 720 slovenskih pojmov
- [x] Continue Game / robusten restore stanja
- [x] Android Back obnašanje
- [x] keep-screen-on med uporabo aplikacije
- [x] safe-area / edge-to-edge mobile layout
- [x] reduced-motion podpora
- [x] Android backup izključen
- [x] cleartext promet izključen
- [x] Android INTERNET permission odstranjen za offline v1.0
- [x] release signing konfiguracija brez skrivnosti v repozitoriju
- [x] launcher/adaptive icon generator
- [x] splash generator
- [x] Play Store icon 512×512 generator
- [x] feature graphic 1024×500 generator
- [x] Play Store listing besedilo
- [x] Data Safety osnutek
- [x] Content Rating osnutek
- [x] Privacy Policy Markdown + HTML
- [x] Pravilnik o zasebnosti dostopen znotraj aplikacije
- [x] testni načrt

## Potrebujemo pred javno objavo

- [ ] potrdi, da package ID `si.djstalca.risirazlozipokazi` ostane dokončen
- [ ] javni support/kontaktni e-mail za Privacy Policy in Play listing
- [ ] javni HTTPS Privacy Policy URL
- [ ] Play Console developer account in verifikacija
- [ ] zasebni upload signing key + varna backup kopija
- [ ] dejanski screenshoti aplikacije iz telefona/tablice
- [ ] ročni test na fizičnem Android telefonu
- [ ] ročni test na tablici ali tablet emulatorju
- [ ] končni pregled Play Console Target audience
- [ ] končni IARC Content rating vprašalnik
- [ ] končni Data Safety obrazec
- [ ] App access: brez prijave
- [ ] Ads declaration: No
- [ ] če je osebni developer račun ustvarjen po 13. 11. 2023: Closed testing z najmanj 12 testerji, neprekinjeno 14 dni

## Release gate

```bash
npm ci
npm run check
npm run android:sync
npm run android:verify
```

Nato z nastavljenim upload keyem:

```bash
npm run android:bundle
```

Pred uploadom preveri:
- [ ] AAB je podpisan z upload keyem
- [ ] `versionCode` je višji od prejšnje Play izdaje
- [ ] app icon / feature graphic / screenshots so finalni
- [ ] Privacy Policy URL je javno dostopen brez prijave
- [ ] noben secret ali keystore ni v GitHubu
- [ ] Internal testing install uspe na fizični napravi

Šele nato: **Production**.
