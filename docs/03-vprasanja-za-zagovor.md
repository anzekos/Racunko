# Vprašanja za zagovor diplome – z odgovori

> Pripravljena vprašanja, ki bi jih komisija lahko zastavila o aplikaciji **Računko**, razvrščena po sklopih. Pri vsakem je **kratek modelni odgovor**, ki ga lahko poveš s svojimi besedami. Na koncu so še nasveti za predstavitev.

---

## A. Splošno o aplikaciji in odločitvah

**1. Na kratko opišite, kaj vaša aplikacija počne.**
Računko je spletna aplikacija za eno svetovalno podjetje, ki omogoča vodenje strank ter izdajanje računov, ponudb in dobropisov. Vsak dokument se shrani v MySQL bazo, samodejno izračuna DDV (22 %), ga je možno izvoziti v PDF, pripraviti za pošiljanje po e-pošti, v posebnem pogledu »Baza računov« pa se spremlja plačila po mesecih in letih.

**2. Zakaj ste izbrali Next.js in ne npr. ločenega frontenda in backenda?**
Ker je projekt razvijal posameznik za manjše podjetje, je bilo smiselno imeti **en sam projekt**, kjer Next.js (App Router) ponuja tako React frontend kot strežniške poti (`route.ts`). To zmanjša kompleksnost (eno gostovanje, en jezik – TypeScript, deljeni tipi), pohitri razvoj in olajša vzdrževanje.

**3. Zakaj TypeScript namesto čistega JavaScripta?**
Zaradi **statične tipizacije**: tipi (`Invoice`, `Customer`, `InvoiceItem` …) preprečijo cel razred napak že med pisanjem (npr. napačno ime polja), olajšajo samodokončanje in dokumentirajo strukturo podatkov.

**4. Komu je aplikacija namenjena – koliko uporabnikov?**
Enemu uporabniku – administratorju (lastniku podjetja). Zato je avtentikacija zasnovana okrog enega računa, shranjenega v okoljskih spremenljivkah, in ne sistema z registracijo in vlogami.

**5. Kaj pomeni ime modulov VLG, ODL, ZAH v bazi strank?**
Gre za domeno svetovanja pri nepovratnih sredstvih: **VLG** = vloga, **ODL** = odločba (odobreni znesek), **ZAH1–ZAH5** = zahtevki za izplačilo (obroki). To pojasni, zakaj ima tabela `Stranka` toliko stolpcev – sledi celotnemu postopku subvencije in proviziji svetovalca.

---

## B. Arhitektura in potek podatkov

**6. Opišite pot podatkov, ko uporabnik shrani nov račun.**
Obrazec (`invoice-form.tsx`) zbere podatke in pokliče `handleInvoiceCreate`, ta `saveInvoice()` iz `lib/database.ts`, ki pošlje `POST /api/invoices`. Strežniška pot preveri podvojeno številko, z `INSERT` zapiše glavo v `Invoices`, nato v zanki vstavi postavke v `InvoiceItems`, in vrne shranjen račun. Frontend prikaže predogled.

**7. Kako je rešen problem N+1 poizvedb pri seznamu računov?**
Namesto da bi za vsak račun posebej brali postavke, se uporabi **ena poizvedba z `LEFT JOIN`** čez `Invoices`, `Stranka` in `InvoiceItems`. V kodi se rezultati prek `Map` sestavijo nazaj v strukturo (glava + tabela postavk). To zmanjša število klicev na bazo z N+1 na 1.

**8. Zakaj se pri urejanju računa postavke izbrišejo in znova vstavijo?**
Ker je to **najpreprostejši zanesljiv pristop**: ni treba računati razlik (katera postavka je nova, spremenjena, izbrisana). `DELETE FROM InvoiceItems WHERE invoice_id = ?` in nato ponovni `INSERT`-i zagotovijo, da stanje v bazi ustreza obrazcu. Slabost: več zapisov in izguba ID-jev postavk.

**9. Kako frontend ve, ali je uporabnik prijavljen?**
Prek `AuthContext`. Ob nalaganju strani prebere JWT iz `localStorage` in ga pošlje na `/api/auth/verify`. Če je veljaven, nastavi uporabnika; sicer preusmeri na `/login`. Strani so dodatno ovite v `ProtectedRoute`.

**10. Kaj je `lib/database.ts` in zakaj obstaja kot ločena plast?**
To je vmesni sloj med komponentami in API-jem: tipizirane funkcije (`fetchInvoices`, `saveInvoice` …), ki opravijo `fetch`. S tem se **prikaz loči od pridobivanja podatkov** – če se API spremeni, popravimo le to datoteko, ne vseh komponent.

---

## C. Podatkovna baza

**11. Zakaj MySQL in ne npr. PostgreSQL ali NoSQL?**
Podatki so jasno **relacijski** (stranke ↔ dokumenti ↔ postavke), zato je relacijska baza naravna izbira. MySQL je razširjen, stabilen in dobro podprt na gostovanjih; izbira je bila tudi praktična (razpoložljivost pri ponudniku).

**12. Kako preprečujete SQL injection?**
Z **parametriziranimi poizvedbami**: vrednosti se ne lepijo v niz SQL, ampak se podajo kot `?` placeholderji prek `connection.execute({ sql, values })`. Gonilnik jih varno ubeži.

**13. Kaj je »connection pool« in zakaj ga uporabljate?**
Bazenček vnaprej odprtih povezav z bazo. Namesto da za vsako poizvedbo odpremo novo povezavo (počasno), si jih izposojamo in vračamo. Koda ustvari **en sam pool** (lazy init) in v serverless okolju zmanjša število povezav, da ne preobremeni baze.

**14. Kje je shema za tabele Invoices/Offers/CreditNotes?**
V repozitoriju je SQL skripta le za tabelo `Stranka`. Strukturo tabel dokumentov **poznamo iz SQL poizvedb** v API-jih (imena stolpcev, tipi). To je pomanjkljivost – pravilno bi bilo dodati migracijske skripte za vse tabele. (Pošten odgovor, ki kaže, da poznaš stanje.)

**15. Kako so povezane tabele (razmerja)?**
1:N: ena stranka ima več dokumentov (`customer_id` v glavi dokumenta), en dokument ima več postavk (`invoice_id`/`offer_id`/`credit_note_id` v postavki).

---

## D. Avtentikacija in varnost

**16. Kako deluje prijava?**
Strežnik primerja uporabniško ime in z `bcrypt.compare` preveri geslo proti hashu iz okoljske spremenljivke. Ob uspehu izda **JWT** (`jwt.sign`) z veljavnostjo 30 dni. Žeton se shrani v brskalnik in pošilja v preverjanje.

**17. Kaj je JWT in zakaj ste ga uporabili?**
JSON Web Token je podpisan žeton, ki nosi podatke (uporabnik, vloga) in datum poteka. Strežnik ga lahko preveri brez hranjenja seje (stateless). Primeren je za preprosto avtentikacijo brez baze sej.

**18. Zakaj se geslo hrani kot bcrypt hash in ne v čistem besedilu?**
Da ob morebitnem razkritju ni neposredno uporabno. **bcrypt** je počasna, »soljena« hash funkcija (faktor 10), odporna proti napadom s slovarjem in z mavričnimi tabelami. Geslo v aplikaciji nikoli ni shranjeno v berljivi obliki.

**19. Katere varnostne pomanjkljivosti ima vaša rešitev in kako bi jih odpravili? (verjetno vprašanje!)**
Tri glavne:
1. **API ni zaščiten na strežniku** – preverjanje prijave je le v brskalniku. Popravek: Next.js **middleware** ali preverjanje JWT v vsakem `route.ts`.
2. **JWT v `localStorage`** je dovzeten za XSS. Bolje: `httpOnly` piškotek.
3. **`eval()` pri formulah strank** – čeprav omejen z regexom, je tvegan; nadomestil bi ga z varnim razčlenjevalnikom izrazov.
(Iskrenost glede pomanjkljivosti običajno naredi dober vtis.)

**20. Kaj se zgodi, če žeton poteče?**
`/api/auth/verify` vrne neveljaven žeton, `AuthContext` ga pobriše iz `localStorage` in uporabnika preusmeri na `/login`.

**21. Zakaj je `eval()` nevaren in zakaj ste ga vseeno uporabili?**
`eval()` izvede poljuben JavaScript, kar ob nenadzorovanem vnosu omogoča izvajanje zlonamerne kode. Uporabljen je za udobje (uporabnik vpiše formulo kot `vlg*0.8`), vhod pa je **omejen z regularnim izrazom** na števila in osnovne operatorje. Bolje bi bilo uporabiti namensko knjižnico (npr. mathjs).

---

## E. DDV, zneski in poslovna logika

**22. Kako izračunate DDV in skupni znesek?**
`Osnova = Σ(količina × cena)`, `DDV = osnova × 0,22`, `Za plačilo = osnova + DDV`. Stopnja 22 % je splošna stopnja DDV v Sloveniji.

**23. Kje se izračun izvede – na strežniku ali v brskalniku?**
V **brskalniku** (obrazec), izračunane vrednosti pa se pošljejo in shranijo v bazo. To je hitro in odzivno; pomanjkljivost je, da se strežnik na izračun zanaša brez ponovne kontrole.

**24. Kako rešujete decimalna ločila (vejica vs. pika)?**
Polji količina/cena sta besedilni z `inputMode="decimal"`; `parseLocaleNumber()` zamenja vejico s piko, tako da uporabnik lahko piše `1,5` ali `1.5`. V »bazi računov« `parseAmount()` razume tudi tisočice (`1.234,56`).

**25. Ali so možne zaokroževalne napake pri zneskih?**
Da – ker se uporablja tip `number` (plavajoča vejica). Pri financah je to potencialna težava; rešitev bi bila delo s celimi števili (centi) ali z decimalnim tipom ter zaokroževanje na 2 decimalki na enem mestu.

**26. Kakšna je razlika med računom, ponudbo in dobropisom v vaši aplikaciji?**
**Račun** je zahteva za plačilo (statusi do »plačan«). **Ponudba** je predračun (statusi sprejeta/zavrnjena, daljša valuta, besedilo »po opravljeni storitvi bo izdan račun«). **Dobropis** je vračilo/popravek (besedilo govori o »vračilu v 14 dneh«). Tehnično so si zelo podobni (kopija predloge).

**27. Zakaj imajo ponudbe drugačne statuse kot računi?**
Ker je njihov življenjski cikel drugačen: ponudba se **sprejme ali zavrne**, ne »plača«. Račun se izda, pošlje in nato **plača** (ali prekliče).

---

## F. PDF in izvoz

**28. Kako generirate PDF in zakaj na dva načina?**
Prednostno **strežniško z Playwright**: neviden Chromium naloži »čisto« stran dokumenta in jo natisne v A4 PDF z **izbirljivim besedilom**. Če to ne uspe (ali dokument še ni shranjen), se uporabi **rezervna pot v brskalniku** (html2canvas izriše predogled v sliko, jsPDF jo zloži v PDF). Dva načina zagotavljata zanesljivost.

**29. Katera pot je boljša in zakaj?**
Strežniška, ker je tekst **vektorski/izbirljiv**, ostrejši in datoteka manjša. Pot v brskalniku ustvari **sliko** dokumenta (tekst ni izbirljiv), je pa neodvisna od strežniškega okolja.

**30. Omenili ste pretvorbo barv oklch v hex – zakaj?**
Tailwind v4 uporablja sodobni barvni zapis `oklch()`, ki ga **html2canvas ne razume**, zato bi barve v PDF izpadle napačno. Pomožni funkciji `convertOklchToHex`/`normalizeColors` jih pred izrisom pretvorita v `#rrggbb`.

**31. Kako poskrbite, da je PDF videti enako kot na zaslonu?**
Predogled ima namenske `@media print` CSS prilagoditve (velikosti pisav), Playwright pa uporabi `emulateMedia({ media: "print" })` in počaka na naložene pisave in slike (`document.fonts.ready`), da se postavitev ne premakne.

---

## G. Konkretne komponente in koda

**32. Kako deluje samodokončanje stranke v obrazcu?**
`CustomerAutocomplete` filtrira seznam strank po vnesenem nizu (`Stranka.includes(query)`) in v spustnem seznamu ponudi predloge; ob izbiri nastavi izbrano stranko in zapre predloge.

**33. Kaj počne »Shrani kot nov« (Save As)?**
Omogoči **kopiranje** obstoječega dokumenta: isti obrazec se napolni s podatki, a se počisti številka, da vneseš novo. Ob shranjevanju se ustvari nov zapis (ne posodobi obstoječega). Sproži se prek URL parametra `?edit=ID&saveAs=true`.

**34. Kako deluje »Baza računov« (ledger)?**
Prikaže račune po mesecih ali letih, razvrščene po številki računa. V tabeli lahko **na mestu** urejaš plačani znesek in opombe (komponenta `EditableCell`), aplikacija sproti izračuna neplačani del in vsote ter obarva vrstice (zelena=plačano, rumena=delno, bela=neplačano). Shranjevanje gre prek `/api/invoices/:id/payment`.

**35. Kaj je `ProtectedRoute` in kako deluje?**
Ovojna komponenta zaščitenih strani: med preverjanjem prikaže vrtavko, če uporabnika ni, izriše `null` in preusmeri na `/login`, sicer prikaže vsebino.

**36. Zakaj sta v projektu `app/page.tsx` in `customer-form.tsx`, ki oba definirata `Customer`?**
Tip `Customer` je na žalost **podvojen** na več mestih (in v `lib/database.ts`). To je pomanjkljivost – pravilno bi bilo imeti en sam vir resnice (en tip), ki ga vsi uvozijo.

**37. Kaj se zgodi, če baza ni dosegljiva, ko odprete stran s strankami?**
Stran preklopi v **demo način**: naloži vgrajene testne podatke (`mockData`) in pokaže opozorilo, da podatki ne bodo shranjeni. Aplikacija torej ne »pade«.

---

## H. Testiranje, uvedba in vzdrževanje

**38. Kako ste aplikacijo testirali?**
Pretežno **ročno** – preizkus vseh tokov (prijava, CRUD, PDF, e-pošta, ledger), diagnostika baze prek `/api/test-db`, preverjanje robnih primerov vnosa (decimalke, podvojene številke, obvezna polja). Avtomatiziranih testov (enotskih/integracijskih) ni – to je možna nadgradnja.

**39. Kako se aplikacija konfigurira za drugo okolje?**
Prek **okoljskih spremenljivk**: `DB_HOST/USER/PASSWORD/NAME/PORT`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET` (in opcijske `DB_*` nastavitve). Koda zazna serverless okolje in prilagodi pool.

**40. Zakaj so v `next.config.mjs` izklopljene TypeScript in ESLint napake med gradnjo?**
Da gradnja uspe tudi ob manjših, neusodnih napakah in se pohitri razvoj. To je **kompromis** – v produkciji je tveganje, da se skrije prava napaka; priporočljivo bi bilo postopno odpravljanje in vklop preverjanj.

**41. Kako bi aplikacijo pripravili za pravo pošiljanje e-pošte?**
Pot `/api/send-email` je zdaj simulacija. Vključil bi storitev (npr. Resend/SendGrid/Nodemailer s SMTP), na strežniku zgeneriral PDF (Playwright) in ga pripel kot priponko, namesto da odpiram uporabnikov `mailto:`.

---

## I. Nadaljnji razvoj

**42. Katere funkcionalnosti bi dodali kot naslednje?**
(1) strežniško zaščito API-ja, (2) pravo e-pošto s priponko, (3) samodejno številčenje dokumentov, (4) pretvorbo ponudbe v račun z enim klikom, (5) nadzorno ploščo z grafi (recharts je že na voljo), (6) izvoz e-računov (e-SLOG/UBL), (7) decimalno aritmetiko za zneske, (8) podporo več uporabnikom z vlogami.

**43. Kako bi aplikacija lahko podpirala več podjetij (multi-tenant)?**
Dodal bi tabelo podjetij in `company_id` v vse zapise, avtentikacijo razširil na več uporabnikov z vlogami, podatke pa filtriral po podjetju (ter to uveljavil tudi v poizvedbah).

**44. Kako bi izboljšali zmogljivost pri velikem številu računov?**
Dodal bi **straničenje in indekse** v bazi (`invoice_number`, `customer_id`, `issue_date`), prenesel iskanje/filtre na strežnik (SQL `WHERE`/`LIMIT`) namesto v brskalnik, ter pri množičnem PDF uporabil paralelizacijo/strežniško generiranje.

---

## J. Hitra ponovitev pojmov (za zbranost pred zagovorom)

- **Next.js App Router** – usmerjanje po mapah; `page.tsx` = stran, `route.ts` = API.
- **React Context** – globalno stanje (tu: prijava) brez podajanja prek vseh komponent.
- **JWT** – podpisan žeton za sejo brez stanja.
- **bcrypt** – počasna soljena hash funkcija za gesla.
- **Connection pool** – ponovno uporabljene povezave z bazo.
- **Parametrizirane poizvedbe** – zaščita pred SQL injection.
- **N+1 problem** – preveč poizvedb; rešitev z `JOIN`.
- **DDV 22 %** – splošna stopnja v RS.
- **Playwright** – strežniško tiskanje strani v PDF.
- **html2canvas + jsPDF** – PDF iz slike v brskalniku.
- **oklch → hex** – pretvorba barv za združljivost s PDF.

---

## Nasveti za predstavitev (zagovor)

1. **Začni z demom živega toka:** prijava → nova stranka → nov račun → PDF → ledger. Komisija najbolje razume na primeru.
2. **Pripravi 1 diagram arhitekture** (iz `docs/01`, pogl. 3) in ga pokaži – pokaže širok pregled.
3. **Vnaprej priznaj 2–3 pomanjkljivosti** in povej rešitev (vpr. 19, 25, 40). To prepreči, da te »ujamejo«, in pokaže zrelost.
4. **Poznaj svojo bazo:** znaj na pamet razmerja in zakaj toliko stolpcev v `Stranka` (domena subvencij).
5. **Imej pripravljen en kos kode**, ki ga znaš razložiti vrstico za vrstico (npr. `POST /api/invoices` ali `generateInvoicePDFFromElement`).
6. **Poveži z zakonodajo:** DDV 22 %, sklic na TRR, zamudne obresti – pokaže poslovni kontekst.
7. **Govori v plasteh:** najprej »kaj« (po domače), nato »kako« (tehnično) – enako kot je strukturirana dokumentacija.
