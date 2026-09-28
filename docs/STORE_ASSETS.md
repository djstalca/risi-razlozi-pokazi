# Google Play creative assets

Projekt vsebuje skripto `npm run assets:generate`, ki reproducibilno pripravi osnovne Android in Google Play grafične datoteke.

## Generirane datoteke

```text
assets/icon-only.png                1024×1024
assets/icon-foreground.png          1024×1024
assets/icon-background.png          1024×1024
assets/splash.png                   2732×2732
assets/splash-dark.png              2732×2732
store-assets/icon-512.png           512×512
store-assets/feature-graphic-1024x500.png
```

Capacitor nato iz `assets/` generira Android launcher/adaptive icon in splash resources.

## Google Play upload

### App icon
- 512×512 px
- PNG
- uporabi `store-assets/icon-512.png`

### Feature graphic
- 1024×500 px
- JPEG ali 24-bit PNG brez alfa kanala
- uporabi `store-assets/feature-graphic-1024x500.png`

### Screenshots
Ker mora Google Play screenshot prikazovati dejansko izkušnjo v aplikaciji, jih ne generiramo kot marketinške makete. Posnamemo jih iz produkcijskega/debug Android builda.

Za igro pripravimo najmanj 6 portretnih screenshotov pri 1080×1920 ali višje:

1. Začetni zaslon – **Slovenska družabna igra**
2. Nastavitve 2–4 ekip – **Pripravljeni v manj kot minuti**
3. Igralna plošča – **Riši, razloži ali pokaži**
4. Zaslon s pojmom/težavnostjo – **720 slovenskih pojmov**
5. Risalna površina – **Riši neposredno na zaslon**
6. OPEN runda – **Vsi proti vsem**

Prve tri slike naj čim bolj jasno pokažejo dejanski gameplay. Ne dodajaj lažnih UI elementov ali funkcij, ki jih aplikacija nima.

## Branding

- Google Play title: **Riši, razloži, pokaži**
- notranja vizualna znamka: **AKCIJA**
- ključni opis: **slovenska družabna igra**
- uporabljamo lastno grafiko in lastne pojme; ne uporabljamo Activity logotipa, embalaže ali kartic.
