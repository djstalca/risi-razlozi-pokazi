# Google Play – Data safety osnutek

Za različico 1.0 aplikacije **Riši, razloži, pokaži**:

- Data collected: **No**
- Data shared with third parties: **No**
- Account creation: **No**
- Ads: **No**
- Analytics: **No**
- Location: **No**
- Contacts: **No**
- Photos/videos: **No**
- Microphone: **No**
- Camera: **No**
- Financial information: **No**
- Web browsing/search history: **No**
- Device or other identifiers collected by the app: **No**

## Lokalni podatki

Na napravi se zaradi nadaljevanja igre lahko lokalno shranijo:
- imena ekip in igralcev,
- pozicije ekip,
- uporabljeni pojmi,
- nastavitve igre,
- trenutno stanje igre.

Ti podatki niso poslani razvijalcu ali tretjim osebam in jih uporabnik odstrani z brisanjem podatkov aplikacije oziroma odstranitvijo aplikacije.

## Tehnična kontrola

Produkcijska Android konfiguracija v1.0 namenoma odstrani permission `android.permission.INTERNET`. Aplikacija nima strežnika, analytics SDK-ja ali oglasnega SDK-ja. S tem je offline model preverljiv tudi na ravni Android manifesta.

## Release gate

Pred vsakim Play Console Data safety odgovorom je treba ponovno preveriti:
1. `AndroidManifest.xml`,
2. `package.json` / nameščene Capacitor plugine,
3. morebitne nove SDK-je ali spletne funkcije,
4. dejansko obnašanje release AAB.

Če se doda katerakoli funkcija, ki pošilja podatke iz naprave, se mora ta dokument in Play Console obrazec posodobiti pred izdajo.
