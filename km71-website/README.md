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

Deze site is met opzet gebouwd zonder aannames over dingen die ik niet kon
verifiëren. Zoek in de bestanden naar `[PLACEHOLDER: ...]` en vul aan:

- **over-ons.html** — het volledige verhaal achter de jukebox
- **contact.html** — echt e-mailadres, telefoonnummer, social media links
- **assets/** — voeg een echt logo/foto toe indien gewenst

## SAM Broadcaster Cloud widgets inbouwen (verplichte stap)

De site verwijst naar twee widgets die je zelf uit je SAM Cloud dashboard
moet halen (station 133256) — ik heb geen toegang tot je SAM Cloud account,
dus dit kan ik niet voor je invullen.

1. Log in op **https://samcloud.spacial.com**.
2. Ga naar **Settings → Request Policy** en vink **"Enable requests from
   widgets"** aan (en optioneel "Allow listeners to dedicate requests",
   plus een limiet op aantal aanvragen per luisteraar als je dat wilt).
3. Ga naar de **Widgets**-tab in de sidebar.
4. Genereer de **Web Player**-widget (voor de live stream) en kopieer de
   `<iframe>`-code. Plak die in `index.html`, in het blok met het commentaar
   `SAM Broadcaster Cloud — livestream player widget` (vervangt het
   `#player-placeholder`-blok).
5. Genereer de **Request/Song Request**-widget en kopieer die `<iframe>`-code.
   Plak die in `verzoekjes.html`, in het blok met het commentaar
   `SAM Broadcaster Cloud — request/dedication widget` (vervangt het
   `#request-placeholder`-blok).

Beide bestanden bevatten al een voorbeeld-`<iframe>` in commentaar zodat je
ziet waar de code moet komen.

## Lokaal testen

```bash
cd km71-website
python3 -m http.server 8080
```

Open **http://localhost:8080**.

## Uploaden naar Hostinger

Je site staat nu alleen op Hostinger (geen Git-koppeling), dus uploaden gaat
via hPanel:

1. Log in op **hpanel.hostinger.com**.
2. Ga naar **Websites → km71.nl → Bestandsbeheer (File Manager)**.
3. Open de map `public_html`.
4. **Maak eerst een backup** van de huidige inhoud (download of hernoem de
   bestaande bestanden naar bijv. `public_html_oud`) voordat je iets
   overschrijft.
5. Upload alle bestanden uit deze `km71-website/` map naar `public_html`
   (de inhoud van de map, niet de map zelf — `index.html` moet direct in
   `public_html` staan).
6. Open www.km71.nl in de browser en controleer of alles goed laadt,
   inclusief de SAM Cloud widgets.

Alternatief: gebruik de FTP-gegevens onder **Websites → km71.nl → FTP-accounts**
met een FTP-client zoals FileZilla, als je liever niet via de browser upload.

## Design

Kleurenschema: warm goud/amber (`#e8a33d`) op een donkere achtergrond
(`#14100c`) — een retro-jukebox gevoel met een moderne, strakke lay-out.
Volledig responsive (mobiel menu vanaf 720px breedte).
