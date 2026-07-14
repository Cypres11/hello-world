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

**Live speler — ingevuld, incl. autoplay, op elke pagina.** De speler staat
niet meer alleen op de homepage, maar als compacte "mini-player" in de
menubalk (`.mini-player`), aanwezig op alle vier de pagina's. Dat voorkomt dat
het geluid stopt zodra iemand naar bijv. de verzoekjes-pagina navigeert —
zonder dat blijft het echt een gewone meerdere-paginas-website, dus bij elke
paginawissel herverbindt de speler wel opnieuw met de live-stream (goed voor
~1 seconde onderbreking, onvermijdelijk bij een normale, niet-single-page
website). Gebruikt de directe SAM Cloud stream-URL (station 133256,
`rid=280691`) in een native HTML5 `<audio controls autoplay>`-element. Let
op: browsers (vooral Safari en Chrome op mobiel) blokkeren standaard geluid
dat automatisch start zonder gebruikersinteractie — dat is bewust
browserbeleid en niet te omzeilen vanuit de website zelf. Op sommige
browsers/bij terugkerende bezoekers start het wel vanzelf; anders staat de
play-knop in de menubalk gewoon klaar.

Wil je het adres van de stream ooit wijzigen? Het staat op 4 plekken (één
per pagina, in de `.mini-player`) — zoek-en-vervang de URL in alle 4 de
HTML-bestanden.

**Verzoekjes-widget — ingevuld.** `verzoekjes.html` bevat de SAM Cloud
**Library**-widget (met "Allow request" aan), zodat luisteraars door de hele
bibliotheek kunnen bladeren en een nummer aanvragen. Vereist dat **Settings →
Request Policy → "Enable requests from widgets"** aanstaat in je SAM Cloud
dashboard.

**Historie-widget — ingevuld.** `index.html` toont onder "Draaide net" de
SAM Cloud **History**-widget (laatste 6 nummers), met dezelfde kleuren als
de rest van de site.

**Wanneer een verzoek wordt afgespeeld — instelbaar in SAM Cloud, niet in de
website.** Onder **Station Settings → Request Policy → Request Policy
Rules** bepaal je hoe snel een aanvraag klinkt:

- **Delay request … minutes before it becomes eligible for rotation** — hoe
  lager dit getal, hoe eerder een verzoek uberhaupt in aanmerking komt.
- **Move request to top of Queue** — kies deze optie (in plaats van "Leave
  request in Request list") om een verzoek zo snel mogelijk, direct na het
  lopende nummer, te laten spelen.

Dit staat volledig los van de website — de widget stuurt alleen de aanvraag
door, de SAM Cloud automation bepaalt wanneer 'm daadwerkelijk klinkt.

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
