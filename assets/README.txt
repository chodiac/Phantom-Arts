FLOWSTATE — statični sajt
=========================

Fajlovi
-------
index.html                markup, 7 sekcija + nav + footer (srpski)
assets/css/main.css       stilovi + responsive + reduced-motion fallback
assets/js/main.js         GSAP / ScrollTrigger / Lenis interakcije
assets/brand/             logo, favicon, manifest (FLOWSTATE brand paket)
assets/                   ovde ide flowstate-hero.mp4 kad bude spreman

Boje brenda
-----------
Akcenat:   #2D5BFF
Tamna:     #080A0E
Svetla:    #F7F8FA

Lokalni pregled
---------------
Mašina nema Node/Python. Koristi:
  PowerShell:  ./serve.ps1                 -> http://localhost:5173
Ili VS Code "Live Server" ekstenziju (otvori CEO folder, pa "Go Live").

Hero video (ubacivanje, bez menjanja koda osim jedne linije)
-----------------------------------------------------------
Sada hero prikazuje DIZAJNIRAN PLACEHOLDER (tamna mreža + natpis
"FLOWSTATE — MESTO ZA HERO VIDEO"). Nema mrežnog zahteva, konzola čista.

Da pustiš pravi video:
  1. Ubaci fajl:            assets/flowstate-hero.mp4
     (opciono poster)       assets/flowstate-hero-poster.jpg
  2. U assets/js/main.js, CONFIG blok na vrhu, postavi:
        HERO_VIDEO_SRC:    'assets/flowstate-hero.mp4',
        HERO_VIDEO_POSTER: 'assets/flowstate-hero-poster.jpg',

Skripta tada ubacuje <video> sa autoplay + muted + loop + playsinline +
poster, pauzira ga van ekrana, a placeholder se gasi na 'loadeddata'.
Ista fullscreen -> kvadrat animacija koristi isti element.

Brand paket (assets/brand/) — SVE iz originalnog FLOWSTATE paketa
---------------------------------------------------------------
flowstate-logo-horizontal.svg / .png / .webp   header / loader / footer (u kodu: .svg)
flowstate-logo-horizontal-dark.png             render na crnoj sa glowom (referenca)
flowstate-logo-stacked.svg / .png / .webp       uspravni lockup (znak + tekst)
flowstate-mark.svg / .png / .webp               horizontalni znak (meduza)
flowstate-mark-upright.svg                       uspravni znak — izvučen iz stacked lockup-a;
                                                KORISTI SE u sekcijama 02 i 03
flowstate-og-image.png                          social preview (og:image, 1200x630)
favicon.svg / favicon.ico                        favicon (vektor + ico)
favicon-16x16.png / -32x32.png / -512.png        rasteri
apple-touch-icon.png                             iOS ikonica
safari-pinned-tab.svg                            monohromatski pin
site.webmanifest                                 PWA manifest

Sve favicon/OG veze su uvezane u <head> index.html.
Za horizontalni znak u sekcijama 02/03 umesto uspravnog: u index.html
zameni  flowstate-mark-upright.svg  ->  flowstate-mark.svg
(i u main.css .bs__mark / .bmark visinu vrati na manju širinu).

Društvene mreže
---------------
Footer Instagram / Facebook / TikTok / Email su namerno placeholder
linkovi (href="#" data-placeholder). Zameni pravim URL-ovima.

Kontakt forma
-------------
Nije povezana sa backendom. Na submit NE lažira uspeh — prikazuje poruku
da ništa nije poslato. Poveži endpoint u main.js (initContact) kasnije.

Brzina scroll animacija
-----------------------
Podešava se u main.js: dužine pinova (`end: '+=NNN%'`), `scrub`
vrednosti, Lenis `lerp`, i visina `.hero` u main.css (`height: 170vh`).
Manje vrednosti = brže.
