# Riši, razloži, pokaži

**Slovenska družabna igra za 2–4 ekipe.** Igralci rišejo, razlagajo ali kažejo pojme, ekipa pa se premika po igralni poti.

## Trenutno stanje

- 450 ročno kuriranih slovenskih pojmov
- 3 težavnosti
- RAZLOŽI / NARIŠI / POKAŽI
- OPEN runde
- nastavljivo izbijanje nasprotnikov
- risalna površina
- lokalno shranjevanje igre
- brez uporabniškega računa, oglasov ali analitike
- deluje brez internetne povezave

## Android / Google Play

Projekt je pripravljen za Capacitor 8.

- App ID: `si.djstalca.risirazlozipokazi`
- Display name: `Riši, razloži, pokaži`
- Capacitor: `8.5.1`
- Android target SDK: `36`
- Android min SDK: določi Capacitor 8 (24)
- Node.js: 22+

### Prvi Android setup

```bash
npm run android:init
npm run android:open
```

`android:init` namesti odvisnosti, ustvari Android projekt, nastavi API 36, vključi `FLAG_KEEP_SCREEN_ON` in sinhronizira spletne datoteke.

### Po spremembah spletne igre

```bash
npm run android:sync
```

### Release bundle

Ko je nastavljen signing key:

```bash
npm run android:bundle
```

AAB bo nato v `android/app/build/outputs/bundle/release/`.

## Git workflow

Predlagano:
- `main` = stabilna izdaja
- feature veje + PR za večje spremembe
- tagi `v1.0.0`, `v1.1.0`, ...

## Zasebnost

Aplikacija je zasnovana brez strežnika. Trenutno ne pošilja osebnih podatkov iz naprave. Glej `docs/PRIVACY_POLICY.md` in `docs/DATA_SAFETY.md`.
