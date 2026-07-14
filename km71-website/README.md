# KM71 Jukebox Radio — nieuwe website

Statische, responsive site voor www.km71.nl. Geen server of database nodig —
alleen HTML, CSS en JS, dus direct te uploaden naar Hostinger.

## Bestanden

```
km71-website/
├── index.html        Home — hero, live player, genres
├── verzoekjes.html    Song requests — SAM Cloud request-widget
├── over-ons.html      Verhaal van de jukebox / Koornmarkt 71
├── contact.html        Contactgegevens
├── css/style.css       Alle styling
├── js/main.js          Mobiel menu
└── assets/favicon.svg  Site-icoon
```

## Wat je nog zelf moet invullen

Zoek in de bestanden naar `[PLACEHOLDER: ...]` en vul aan:

- **over-ons.html** — het volledige verhaal achter de jukebox
- **contact.html** — telefoonnummer, social media links
- **assets/** — voeg een echt logo/foto toe indien gewenst

Het e-mailadres in `contact.html` staat bewust *niet* als platte tekst in de
HTML (tegen scrapers) maar wordt via een klein scriptje aan het eind van het
bestand samengesteld. Wil je het adres wijzigen? Zoek in `contact.html` naar
`var user = "mala";` en `var domain = "km71.nl";` en pas die twee regels aan.

## SAM Broadcaster Cloud koppelen

**Live speler — ingevuld, incl. autoplay.** `index.html` gebruikt de directe
SAM Cloud stream-URL (station 133256, `rid=280691`) in een native HTML5
`<audio>`-element met het `autoplay`-attribuut, plus een fallback-link voor
browsers die de stream niet inline afspelen. Let op: browsers (vooral Safari
en Chrome op mobiel) blokkeren standaard geluid dat automatisch start zonder
gebruikersinteractie — dat is bewust browserbeleid en niet te omzeilen vanuit
de website zelf. Op sommige browsers/bij terugkerende bezoekers start het wel
vanzelf; anders staat de play-knop gewoon klaar.

**Verzoekjes-widget — ingevuld.** `verzoekjes.html` bevat de SAM Cloud
**Library**-widget (met "Allow request" aan), zodat luisteraars door de hele
bibliotheek kunnen bladeren en een nummer aanvragen. Vereist dat **Settings →
Request Policy → "Enable requests from widgets"** aanstaat in je SAM Cloud
dashboard.

**Historie-widget — nog te doen.** Wil je op de homepage laten zien wat er
al gedraaid heeft?

1. Log in op **https://samcloud.spacial.com**.
2. Ga naar **Widgets → Web Widgets → Add Widget**.
3. Zet **Widget type** op **History**, stel kleuren/aantal items naar smaak
   in, en klik **Generate Code**.
4. Stuur mij de gegenereerde `<sam-widget type="history" ...>`-code, of plak
   'm zelf in `index.html` in het blok met het commentaar
   `SAM Broadcaster Cloud — History widget` (vervangt het
   `#history-placeholder`-blok). De benodigde `<script>`-regel staat al in
   de `<head>` van `index.html`.

## Lokaal testen

```bash
cd km71-website
python3 -m http.server 8080
```

Open **http://localhost:8080**.

## Uploaden naar Hostinger

De site staat live op **www.km71.nl**, geüpload naar
`~/domains/km71.nl/public_html/` op de Hostinger-server via SSH:

```bash
ssh -p 65002 GEBRUIKERSNAAM@HOSTNAAM
cd ~/domains/km71.nl/public_html
# bestanden uploaden/vervangen, bijv. via scp vanaf je Mac:
# scp -P 65002 km71-website/index.html GEBRUIKERSNAAM@HOSTNAAM:~/domains/km71.nl/public_html/
```

Belangrijk: nieuw geüploade bestanden moeten **644**-rechten hebben (mappen
**755**), anders krijg je een 403 Forbidden — de webserver mag dan de
bestanden niet lezen. Na uploaden zo nodig fixen:

```bash
chmod 644 *.html *.md
find css js assets -type f -exec chmod 644 {} \;
find css js assets -type d -exec chmod 755 {} \;
```

## Design

Kleurenschema: warm goud/amber (`#e8a33d`) op een donkere achtergrond
(`#14100c`) — een retro-jukebox gevoel met een moderne, strakke lay-out.
Volledig responsive (mobiel menu vanaf 720px breedte).
