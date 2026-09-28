# Release test plan

Vsak kandidat za izdajo mora prestati avtomatske in ročne teste.

## Avtomatsko

`npm run check` preveri:
- sintakso vseh JS datotek,
- 720 unikatnih pojmov,
- 80 pojmov v vsakem difficulty × mode bucketu,
- največ 3 pojmi z isto končno besedo,
- isti pojem se na isti napravi v istem koledarskem dnevu ne ponovi,
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
- ekipe brez imen igralcev,
- ekipe z 1–8 igralci in pravilna rotacija podajalca,
- imena ekip z znaki č, š, ž,
- 30 / 45 / 60 / 90 sekund,
- odštevanje 3–2–1 vključeno in izključeno,
- izbijanje vključeno,
- izbijanje izključeno,
- vse tri težavnosti,
- enkratna menjava pojma pred začetkom runde,
- zamenjani pojem se isti dan ne pojavi več,
- po menjavi je treba novi pojem ponovno razkriti pred začetkom,
- RAZLOŽI,
- NARIŠI,
- POKAŽI,
- OPEN: aktivna ekipa +6,
- OPEN: druga ekipa +4 in aktivna +2,
- OPEN: nihče,
- prihod na cilj z natančnim in preseženim številom polj,
- več ekip na istem polju,
- izbijanje z več ekipami na istem polju,
- razveljavi uspeh/neuspeh v 8 sekundah,
- razveljavi napačno izbrano ekipo pri OPEN,
- razveljavi rezultat, ki bi sicer zaključil igro.
- zmagovalni zaslon pokaže število rund, OPEN rund, uspehe 3/4/5, OPEN zadetke, osvojene točke in najtežji zadetek,
- razveljavitev zadnjega rezultata povrne tudi statistiko.

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
