# Release checklist

Google Play ime: **Riši, razloži, pokaži**  
Brand v aplikaciji: **AKCIJA**

## Pred prvim Play Store uploadom
- [ ] potrdi dokončni package ID `si.djstalca.risirazlozipokazi` (po prvi objavi ga ni mogoče zamenjati)
- [ ] izdelaj finalno app ikono 512×512
- [ ] izdelaj adaptive Android icon
- [ ] pripravi splash screen
- [ ] dodaj kontaktni e-mail v privacy policy
- [ ] ustvari Play Console aplikacijo
- [ ] ustvari upload signing key in ga varno shrani
- [ ] pripravi 2–8 Play Store screenshotov
- [ ] pripravi feature graphic 1024×500
- [ ] izpolni Content rating
- [ ] izpolni Data safety
- [ ] izpolni App access (brez prijave)
- [ ] izpolni Ads declaration (No)
- [ ] izpolni Target audience
- [ ] preveri pravice do imena, grafike in vseh pojmov
- [ ] build z targetSdk 36
- [ ] test na vsaj telefonu in tablici
- [ ] test offline
- [ ] test Android Back gumba
- [ ] test rotacije in ponovnega odpiranja aplikacije
- [ ] test 2, 3 in 4 ekip
- [ ] test vseh treh načinov
- [ ] test OPEN in izbijanja
- [ ] test risanja
- [ ] pregled slovenskih pojmov

## Release
- [ ] `npm run check`
- [ ] `npm run android:sync`
- [ ] Android Studio lint
- [ ] `npm run android:bundle`
- [ ] preveri podpis AAB
- [ ] upload v Internal testing
- [ ] nato Closed testing / Production glede na zahteve računa
