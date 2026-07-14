# KM71 Jukebox Radio — nieuwe website

Statische, responsive site voor www.km71.nl. Geen server of database nodig —
alleen HTML, CSS en JS, dus direct te uploaden naar Hostinger.

Sinds de laatste update is dit een **single-page app**: alle inhoud
(Home/Verzoekjes/Over ons/Contact) staat in één `index.html`, en JavaScript
(`js/router.js`) wisselt welk deel zichtbaar is op basis van het URL-anker
(`#home`, `#verzoekjes`, `#over-ons`, `#contact`). Reden: bij een gewone
meerdere-pagina's-site laadt de browser bij elke klik een hele nieuwe pagina,
wat de audiospeler in de header steeds vernietigde — vandaar dat de muziek
stopte bij het aanvragen van een nummer. Nu blijft de pagina (en dus de
audiospeler) altijd hetzelfde, en wordt alleen de zichtbare sectie gewisseld.

## Belangrijk bij het updaten van css/style.css, js/main.js of js/router.js

Deze bestanden worden in `index.html` geladen met een `?v=2` achter de
bestandsnaam (cache-busting) — Safari bleek deze bestanden hardnekkig te
blijven cachen, zelfs na een harde refresh (Cmd+Shift+R), waardoor de
paginawissel-knoppen niet meer werkten totdat de versie werd opgehoogd.
**Verhoog dat versienummer (`?v=2` → `?v=3` enz.) telkens wanneer je
`css/style.css`, `js/main.js` of `js/router.js` wijzigt**, anders lopen
sommige bezoekers (vooral Safari-gebruikers) tegen een oude, gecachete
versie aan.

## Bestanden

```
km71-website/
├── index.html            Alle pagina's in één bestand (SPA)
├── verzoekjes.html        Redirect-stub → index.html#verzoekjes
├── over-ons.html          Redirect-stub → index.html#over-ons
├── contact.html           Redirect-stub → index.html#contact
├── css/style.css          Alle styling
├── js/main.js             Mobiel menu
├── js/router.js           Wisselt de zichtbare "pagina" o.b.v. het URL-anker
└── assets/favicon.svg     Site-icoon
```

De drie `.html`-bestanden met "redirect-stub" bestaan alleen voor het geval
iemand nog een oude link/bladwijzer naar bijv. `km71.nl/contact.html` heeft —
ze verwijzen direct door naar de juiste plek in `index.html`. Alle echte
inhoud staat in `index.html`.

## Wat je nog zelf moet invullen

Zoek in `index.html` naar `[PLACEHOLDER: ...]` en vul aan:

- **Contact-sectie** (`id="page-contact"`) — telefoonnummer, social media links

## Foto's (nog te uploaden)

`index.html` verwijst naar drie foto's die nog niet in `assets/` staan —
zet ze daar met precies deze bestandsnamen, dan werkt alles automatisch:

- `assets/jukebox.jpg` — de zwart-witfoto van de originele jukebox, gebruikt
  in de hero van de homepage
- `assets/km71-single.jpg` — de KM71-afbeelding met de Philips-single,
  gebruikt bovenaan de "Over ons"-pagina
- `assets/gitaar.jpg` — de gitaarfoto, gebruikt als sfeervolle achtergrond
  achter de genre-tags op de homepage

Zonder deze bestanden tonen de eerste twee een leeg/gebroken beeld-icoontje
en mist de genre-sectie de achtergrondfoto (blijft verder gewoon werken).

Het e-mailadres in de contact-sectie staat bewust *niet* als platte tekst in
de HTML (tegen scrapers) maar wordt via een klein scriptje onderaan
`index.html` samengesteld. Wil je het adres wijzigen? Zoek naar
`var user = "mala";` en `var domain = "km71.nl";` en pas die twee regels aan.

## SAM Broadcaster Cloud koppelen

**Live speler — ingevuld, incl. autoplay, écht doorlopend.** De speler staat
als compacte "mini-player" (`.mini-player`) één keer in de header, en blijft
– omdat dit nu een single-page app is – hetzelfde audio-element tijdens het
navigeren tussen Home/Verzoekjes/Over ons/Contact. Geen enkele onderbreking
meer bij het aanvragen van een nummer. Gebruikt de directe SAM Cloud
stream-URL (station 133256, `rid=280691`) in een native HTML5
`<audio controls autoplay>`-element. Let op: browsers (vooral Safari en
Chrome op mobiel) blokkeren standaard geluid dat automatisch start zonder
gebruikersinteractie bij het eerste bezoek — dat is bewust browserbeleid en
niet te omzeilen vanuit de website zelf; de play-knop in de menubalk staat
dan gewoon klaar.

**Verzoekjes-widget — ingevuld.** De verzoekjes-sectie bevat de SAM Cloud
**Library**-widget (met "Allow request" aan), zodat luisteraars door de hele
bibliotheek kunnen bladeren en een nummer aanvragen. Vereist dat **Settings →
Request Policy → "Enable requests from widgets"** aanstaat in je SAM Cloud
dashboard.

**Historie-widget — ingevuld.** De homepage toont onder "Draaide net" de SAM
Cloud **History**-widget (laatste 6 nummers).

**Wachtrij-widget — ingevuld.** Zowel op de homepage ("Wat er in de wachtrij
staat") als op de verzoekjespagina ("De wachtrij") staat de SAM Cloud
**Line Up**-widget (in SAM Cloud heet de wachtrij dus "Line Up", niet
"Queue"), zodat je kunt zien of een aangevraagd nummer is toegevoegd.

Alle widgets zijn herkleurd naar het amber/donkere thema van de site via het
`theme='{...}'`-attribuut op elke `<sam-widget>`.

**Wanneer een verzoek wordt afgespeeld — instelbaar in SAM Cloud, niet in de
website.** Onder **Station Settings → Request Policy → Request Policy
Rules** bepaal je hoe snel een aanvraag klinkt:

- **Delay request … minutes before it becomes eligible for rotation** — hoe
  lager dit getal, hoe eerder een verzoek überhaupt in aanmerking komt.
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
Volledig responsive (mobiel menu vanaf 720px breedte). De "Verzoekjes"-link
in de menubalk is bewust als knop gestyled (`.nav-cta`) — dat is nu de enige
duidelijke oproep om een nummer aan te vragen; de homepage legt de nadruk op
wat er speelt en in de wachtrij staat.
