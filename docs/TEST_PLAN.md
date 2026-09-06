# Release test plan

Vsak kandidat za izdajo mora prestati avtomatske in ročne teste.

## Avtomatsko

`npm run check` preveri:
- sintakso vseh JS datotek,
- 450 unikatnih pojmov,
- 50 pojmov v vsakem difficulty × mode bucketu,
- največ 2 pojma z isto končno besedo,
- osnovno logiko plošče,
- izbijanje vključeno/izključeno,
- OPEN 4+2 brez izbijanja,
- pravilno ustavljanje na cilju.

`npm run android:verify` po ustvarjenem Android projektu preveri:
- Android lint,
- Gradle/JVM teste,
- debug APK build.

## Ročno – naprave

Minimalna matrika pred v1.0:
- Android telefon 360–420 dp širine,
- večji Android telefon,
- Android tablica ali emulator,
- vsaj ena naprava Android 13/14,
- vsaj ena naprava Android 15/16.

## Ročno – glavna pot

- nova igra z 2 ekipama,
- nova igra s 3 ekipami,
- nova igra s 4 ekipami,
- imena ekip z znaki č, š, ž,
- 30 / 45 / 60 / 90 sekund,
- izbijanje vključeno,
- izbijanje izključeno,
- vse tri težavnosti,
- RAZLOŽI,
- NARIŠI,
- POKAŽI,
- OPEN: aktivna ekipa +6,
- OPEN: druga ekipa +4 in aktivna +2,
- OPEN: nihče,
- prihod na cilj z natančnim in preseženim številom polj,
- več ekip na istem polju,
- izbijanje z več ekipami na istem polju.

## Risanje

- risanje s prstom,
- hitri gibi in dolge poteze,
- Razveljavi,
- Počisti,
- Končaj prej,
- čas poteče med risanjem,
- odgovor med risanjem ni nikjer prikazan.

## Življenjski cikel aplikacije

- med rundo daj aplikacijo v ozadje in jo vrni,
- zakleni/odkleni telefon med rundo,
- zapri aplikacijo na plošči in jo ponovno odpri,
- preveri gumb **NADALJUJ IGRO**,
- zapri aplikacijo med časovno rundo in jo ponovno odpri po poteku časa,
- Android Back na vseh zaslonih,
- nova igra izbriše staro stanje šele po potrditvi, kjer je potrditveni dialog predviden.

## UX / dostopnost

- brez horizontalnega scrolla pri 320 dp,
- vse tipke imajo dovolj velike tap tarče,
- kontrast na temni temi,
- sistemski `Reduce motion` izključi pulziranje/animacije,
- figurice so razpoznavne tudi brez same barve zaradi številk,
- status/navigation bar ne prekrivata vsebine,
- slovenski znaki so pravilno prikazani.

## Offline / zasebnost

- izklopi Wi‑Fi in mobilne podatke: celotna igra mora delati,
- brez zahteve po prijavi,
- brez permission promptov za kamero, mikrofon, lokacijo, kontakte ali datoteke,
- stanje igre ostane lokalno,
- preveri deklaracijo Data Safety pred vsakim releaseom, če se dodajo novi SDK-ji.

## Store kandidat

Pred uploadom AAB:
- `npm run check` zelen,
- Android workflow zelen,
- podpisan release AAB,
- preverjen `versionCode` in `versionName`,
- finalni Play Store icon in feature graphic,
- najmanj 6 dejanskih screenshotov,
- Privacy Policy javno dostopna,
- Data Safety in Content Rating ponovno pregledana.
