# Google Play Console – priprava za v1.0

Ta dokument je delovni obrazec za prvo objavo aplikacije **Riši, razloži, pokaži**.

## Identiteta aplikacije

- App name: **Riši, razloži, pokaži**
- Vizualna znamka v aplikaciji: **AKCIJA**
- Package ID: `si.djstalca.risirazlozipokazi`
- Version name: `1.0.0`
- Version code: `1`
- Kategorija: **Game / Word**
- Cena v1.0: **brezplačno**
- Ads: **Ne**
- In-app purchases: **Ne**
- Account/login: **Ne**
- Internet za igranje: **Ni potreben**

## App content deklaracije

### App access
**All functionality is available without special access.**

Ni prijave, naročnine ali druge omejitve dostopa.

### Ads
**No, my app does not contain ads.**

### Data safety
Trenutni tehnični model:
- aplikacija nima Android INTERNET permissiona,
- nima analitike,
- nima oglasnih SDK-jev,
- nima strežnika,
- nima login sistema,
- imena ekip in stanje igre ostanejo lokalno na napravi.

Pred oddajo uporabi `docs/DATA_SAFETY.md` in ponovno preveri odvisnosti.

### Target audience
Predlog za v1.0: **13+ / splošna publika**, ne aplikacija posebej zasnovana za otroke.

Razlog: gre za splošno družabno igro za družine, prijatelje in zabave; grafika in listing nista usmerjena posebej v majhne otroke. Končno izbiro mora razvijalec potrditi glede na dejansko trženje aplikacije.

### Content rating
Izpolni IARC vprašalnik po osnutku `docs/CONTENT_RATING.md`. Aplikacije na Google Play ne smejo ostati brez vsebinske ocene.

### News / Health / Financial / Government
Ne.

## Store listing

Besedilo je pripravljeno v `docs/PLAY_STORE_LISTING.md`.

Potrebni vizualni elementi:
- 512×512 app icon,
- 1024×500 feature graphic,
- dejanski screenshots aplikacije.

Osnovna ikona in feature graphic se generirata z:

```bash
npm run assets:generate
```

Screenshoti morajo nastati iz dejanske aplikacije; načrt je v `docs/STORE_ASSETS.md`.

## Privacy policy

Besedilo je pripravljeno v `docs/PRIVACY_POLICY.md` in kot HTML v `www/privacy.html`.

Pred oddajo potrebujemo:
1. javni podporni/kontaktni e-mail,
2. javno HTTPS povezavo do pravilnika o zasebnosti.

Repo je zaseben, zato datoteka v zasebnem GitHub repozitoriju sama po sebi ni ustrezen javni Privacy Policy URL. Dokument lahko objavimo na tvoji domeni ali v ločenem javnem statičnem repozitoriju/hostingu.

## Release

Pred prvo oddajo:

```bash
npm ci
npm run check
npm run android:sync
npm run android:verify
```

Nato ustvari in varno shrani upload key po `docs/SIGNING.md`, nastavi `android/keystore.properties` in zgradi:

```bash
npm run android:bundle
```

Končni AAB:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

## Test track

Najprej uporabi **Internal testing** za svoje naprave in najbližje testerje. Če Play Console za tvoj tip osebnega developer računa zahteva dodatno closed-testing obdobje pred Production accessom, sledi točno prikazanim zahtevam v tvojem Play Console računu.

## Kaj je namensko izven repozitorija

V GitHub ne sodijo:
- `.jks` / `.keystore`,
- `keystore.properties` z gesli,
- Play Console credentials,
- osebni identifikacijski dokumenti,
- drugi developer-account verification podatki.
