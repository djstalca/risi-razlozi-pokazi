# Riši, razloži, pokaži

**Slovenska družabna igra za 2–4 ekipe.** Igralci rišejo, razlagajo ali kažejo pojme, ekipa pa se premika po igralni poti.

## Igra

- 720 ročno kuriranih slovenskih pojmov
- 3 težavnosti
- RAZLOŽI / NARIŠI / POKAŽI
- OPEN runde
- nastavljivo izbijanje nasprotnikov
- risanje neposredno na zaslon
- jasne, oštevilčene figurice ekip
- nadaljevanje prekinjene igre
- dnevno preprečevanje ponavljanja že prikazanih pojmov
- lokalno shranjevanje stanja
- brez uporabniškega računa, oglasov ali analitike
- v1.0 brez Android INTERNET permissiona

## Android / Google Play

- Package ID: `si.djstalca.risirazlozipokazi`
- Display name: `Riši, razloži, pokaži`
- Visual brand: `AKCIJA`
- Version: `1.0.0` / code `1`
- Capacitor: `8.5.1`
- Android min SDK: `24`
- Android compile/target SDK: `36`
- Node.js: `22+`
- Java/JDK: `21`

Native Android projekt je **tracked v repozitoriju**. Po kloniranju ga ni treba ponovno ustvarjati.

## Razvoj

```bash
npm ci
npm run check
npm run android:sync
npm run android:open
```

`android:sync` regenerira brand assets, sinhronizira Capacitor in ponovno uporabi produkcijske Android hardening nastavitve.

## QA

```bash
npm run check
npm run android:verify
```

`npm run check` preveri JS sintakso, kakovost/strukturo baze pojmov in avtomatske teste igralne logike.

`npm run android:verify` zažene Android lint, teste in zgradi debug APK.

Celoten ročni testni načrt: `docs/TEST_PLAN.md`.

## Play Store release

1. Nastavi svoj zasebni upload key po `docs/SIGNING.md`.
2. Zaženi:

```bash
npm run android:sync
npm run android:bundle
```

3. AAB bo v:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Play Console priprava:
- `docs/PLAY_CONSOLE.md`
- `docs/PLAY_STORE_LISTING.md`
- `docs/DATA_SAFETY.md`
- `docs/CONTENT_RATING.md`
- `docs/PRIVACY_POLICY.md`
- `docs/STORE_ASSETS.md`
- `docs/RELEASE_CHECKLIST.md`

## Brand assets

```bash
npm run assets:generate
```

Skripta reproducibilno pripravi Android ikone/splash vhodne datoteke ter Play Store 512×512 icon in 1024×500 feature graphic.

## Varnost in zasebnost

- ni login sistema,
- ni strežnika,
- ni analytics ali ad SDK-ja,
- Android backup je izključen,
- cleartext network promet je izključen,
- INTERNET permission je odstranjen,
- save game ostane lokalno na napravi.

Realni signing ključi, gesla in Play Console credentials nikoli ne sodijo v GitHub.
