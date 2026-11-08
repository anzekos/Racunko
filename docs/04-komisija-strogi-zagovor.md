# Stroga komisija – zagovor diplome (Računko)

> Ta dokument je **simulacija zagovora pred strogo komisijo**, ki dvomi, da si aplikacijo zasnoval in napisal sam. Komisija ne sprašuje »kaj aplikacija dela«, ampak **»pokažite mi v kodi«, »zakaj ravno tako«, »napišite na tablo«, »kaj se zgodi, če …«**.
>
> **Kako vaditi:** vsako vprašanje preberi, odgovori na glas v največ 60–90 sekundah (pri »pokaži v kodi« odpri datoteko in pokaži vrstico), šele nato odpri »Kaj mora odgovor vsebovati«. Če česa ne veš, pojdi v `05-studij-kode-*.md` na navedeno mesto.
>
> Številke vrstic se nanašajo na stanje kode v tem repozitoriju (veja z dokumentacijo). Če kodo popraviš (glej `06-napake-popravi-pred-zagovorom.md`), se vrstice premaknejo – imena funkcij ostanejo.

---

## Kako komisija razmišlja

1. **Avtorstvo se dokazuje z detajli, ne s pregledom.** Kdor je kodo pisal, ve, *zakaj* je `paid_amount` v telesu zahteve v `snake_case`, drugje pa `camelCase`; ve, kje je 15 dni valute; ve, zakaj je `eval` omejen z regexom.
2. **Komisija bo poskusila v živo.** Ne pripravi le »srečne poti« (prijava → račun → PDF). Pripravi se na to, da bo član komisije kliknil na plačan račun, vpisal vejico, osvežil stran, poklical `/api/customers` brez prijave.
3. **Priznanje pomanjkljivosti = plus. Nepoznavanje lastne pomanjkljivosti = minus.** Vsaka napaka iz razdelka F in G je tvoja prednost, če jo poznaš prej kot komisija.
4. **»Napišite«** pomeni, da moraš znati brez IDE-ja napisati 10–20 vrstic: SQL transakcijo, middleware, useEffect, JOIN.

---

## A. Avtorstvo, proces in orodja (tu komisija začne)

**A1. V `app/layout.tsx` (vrstica 22) piše `generator: 'v0.app'`. Kaj je v0 in kateri del aplikacije je nastal z njim?**
<details><summary>Kaj mora odgovor vsebovati</summary>

- v0 (Vercel) je generator React/Next.js uporabniških vmesnikov iz opisa. Iz njega izvirajo: začetno ogrodje Next.js projekta, mapa `components/ui/*` (shadcn/ui komponente – 50 datotek, uporabljenih je 10: button, card, input, label, textarea, tabs, badge, alert, select, dropdown-menu), `components.json`, `public/placeholder-*`, `styles/globals.css` (podvojen `app/globals.css`), `hooks/use-toast.ts`, `components/theme-provider.tsx`.
- Kaj **ni** iz v0 in je tvoje: podatkovni model in SQL (`scripts/*.sql`, tabela `Stranka` z domeno subvencij), `lib/db-connection.ts`, vse `app/api/**/route.ts`, avtentikacija (`AuthContext`, `login`, `verify`), obrazci računov/ponudb/dobropisov z izračunom DDV, predogledi z A4 postavitvijo, `lib/pdf-generator*.ts` (oklch → hex, vektorski footer, Playwright pot), `app/invoices/ledger/page.tsx`, formule in `eval` logika v `app/customers/page.tsx`.
- Dokaz avtorstva: `reference/original-frontend.html` je tvoja **prvotna** različica (čisti HTML/JS, 971 vrstic, klici na `http://localhost:3000/stranka`), iz katere si logiko formul (`calculateFormula`, `1.22`, `KONTROLA = VLG + Izplacano * Provizija`, avtodopolnjevanje polj) prenesel v React. Komisiji to pokaži.
- Bodi iskren tudi o AI-pomoči: v git zgodovini je 5 commitov avtorja »Claude« (popravki `mailto`, hash gesla, dokumentacija) in commit »commit from cur za pdf« (Cursor). Odgovor: orodja so pomagala pri popravkih in dokumentaciji, arhitekturo, model in glavne tokove si zasnoval sam in jih znaš razložiti do vrstice.
</details>

**A2. Git zgodovina se začne 18. 2. 2026 s commitom, ki vsebuje 124 datotek in 23.529 vrstic naenkrat. Kje je zgodovina razvoja pred tem?**
<details><summary>Kaj mora odgovor vsebovati</summary>

- Prvi commit je **snapshot** obstoječega projekta (repozitorij je bil ustvarjen, ko je aplikacija že delovala). Pred tem si razvijal lokalno / v drugem repozitoriju / iz v0 izvoza.
- Pokaži, kaj se je zgodilo **po** tem (55 commitov): ledger (3. 3.), optimizacija GET z JOIN (4. 3.), poskus in odstranitev straničenja (4. 3.), Playwright PDF (13. 3.), decimalna vejica (8. 4.), popravki e-pošte (28. 4.). To je razvoj, ki ga znaš opisati po korakih – povej, **zakaj** je vsak nastal (npr. ledger: lastnik je hotel Excelu podoben pregled plačil).
</details>

**A3. Zakaj imate v `package.json` 40+ odvisnosti (recharts, embla-carousel, react-hook-form, zod, vaul, cmdk …), ki jih nikjer ne uvažate?**
<details><summary>Kaj mora odgovor vsebovati</summary>

- To so odvisnosti shadcn/ui predloge iz v0. Dejansko uporabljene knjižnice: `next`, `react`, `mysql2`, `jsonwebtoken`, `bcryptjs`, `jspdf`, `html2canvas`, `playwright`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, Radix paketi za 10 uporabljenih komponent, `tailwindcss`.
- Priznaj: čiščenje `package.json` je vzdrževalni dolg; vpliva na velikost `node_modules`, ne na produkcijski bundle (Next uvozi le, kar je uvoženo).
</details>

**A4. Zakaj sta v `next.config.mjs` izklopljena TypeScript in ESLint med gradnjo? Koliko napak se skriva?**
<details><summary>Kaj mora odgovor vsebovati</summary>

- `typescript.ignoreBuildErrors: true`, `eslint.ignoreDuringBuilds: true` (vrstice 3–8). Namen: da gradnja na gostovanju ne pade zaradi tipov (npr. `as any` pri mysql2, `params` tipi v Next 15).
- Moraš vedeti, da to **skriva realne napake**: npr. `XCircle` ni uvožen v `app/invoices/view/[id]/page.tsx`, `downloadOfferPDF` ni uvožen v `app/offers/page.tsx`, podvojen tip `SavedOffer` v `lib/database.ts`. Glej `06-napake-popravi-pred-zagovorom.md` (tam je tudi izpis `tsc`).
- Pravilni odgovor: »Vem, katere napake so; pred oddajo jih odpravim in vklopim preverjanje.«
</details>

**A5. Kaj je `reference/original-frontend.html` in zakaj je v repozitoriju?**
<details><summary>Kaj mora odgovor vsebovati</summary>

- Prvotna verzija modula strank v čistem HTML/JS: tabela z 62 stolpci, sticky stolpec, avtodopolnjevanje, formule z `eval`, `fetch('http://localhost:3000/stranka')` (takrat ločen backend). Služi kot referenca pri prenosu logike v React (`app/customers/page.tsx`). Pokaži vzporednico: `calculateFormula` (html 336 ↔ tsx 618), `1.22` (html 384 ↔ tsx 791), `KONTROLA` (html 410 ↔ tsx 812).
</details>

**A6. Koliko uporabnikov ima aplikacija in kje so shranjeni?**
<details><summary>Kaj mora odgovor vsebovati</summary>

- Enega (administrator). Ni tabele uporabnikov: `ADMIN_USERNAME` in `ADMIN_PASSWORD_HASH` sta okoljski spremenljivki (`app/api/auth/login/route.ts:11-12`), hash narediš s `scripts/generate-hash.js` (bcrypt, 10 krogov).
- Zakaj: naročnik je eno podjetje z enim uporabnikom; tabela uporabnikov bi bila prezgodnja kompleksnost. Kako bi razširil: tabela `Users(id, username, password_hash, role)`, `jwt` payload z `sub`, vloge v middlewaru.
</details>

**A7. Katere datoteke v projektu so mrtva koda? Naštejte jih brez gledanja.**
<details><summary>Kaj mora odgovor vsebovati</summary>

- `components/document-form.tsx` (generični obrazec, nikjer uvožen), `components/customer-form.tsx` in `components/customer-table.tsx` (uvažata tip `Customer` iz `@/app/page`, ki ga ta datoteka **ne izvaža** – kompilira le zaradi ignoriranih napak), `components/theme-provider.tsx`, `hooks/use-toast.ts`, `components/ui/use-toast.ts`, `components/ui/use-mobile.tsx`, `styles/globals.css`, ~40 datotek v `components/ui/`, funkcije `sendInvoiceEmail`/`sendOfferEmail`/`sendCreditNoteEmail` (uvožene, nikoli klicane), `generateNewInvoiceNumber` (`app/invoices/page.tsx:104-108`), `app/api/send-email/route.ts` (simulacija, nikjer klicana).
- Če to veš, komisija verjame, da si kodo bral vrstico za vrstico.
</details>

**A8. Kje se izvaja ta aplikacija (gostovanje) in kako se to vidi v kodi?**
<details><summary>Kaj mora odgovor vsebovati</summary>

- `scripts/01-create-database.sql:2` `USE kmzavo48_stranke_db;` – predpona uporabnika kaže na cPanel/deljeno gostovanje z MySQL. `lib/db-connection.ts:14-17` zazna serverless okolje (`VERCEL`, `AWS_LAMBDA_FUNCTION_NAME`, `FUNCTIONS_WORKER_RUNTIME`) in zniža `connectionLimit` na 3.
- Ključno: **Playwright (`chromium.launch()`) na Vercelu ne deluje** (ni Chromium binarke, omejitev velikosti funkcije). Če gostuješ na Vercelu, strežniška PDF pot vedno pade in se tiho uporabi rezervna (`html2canvas`). Moraš vedeti, kje aplikacija dejansko teče in kaj se dejansko izvede ob kliku »Prenesi PDF«. Preveri: DevTools → Console → napis »Napaka pri prenosu PDF-ja«.
</details>

---

## B. »Pokažite mi v kodi« (lokacijska vprašanja)

Komisija reče: *odprite datoteko in pokažite vrstico*. Odgovor je `datoteka:vrstica` + en stavek.

| # | Vprašanje | Odgovor |
|---|---|---|
| B1 | Kje je definirana stopnja DDV? | Nikjer centralno. `0.22` v `components/invoice-form.tsx:162`, `offer-form.tsx:97`, `credit-note-form.tsx:97`, `document-form.tsx:126`; `1.22` v `app/customers/page.tsx:791` in `customer-form.tsx:109`. Pomanjkljivost: 6 kopij; pravilno je ena konstanta `VAT_RATE` v `lib/`. |
| B2 | Kje je nastavljena veljavnost žetona JWT? | `app/api/auth/login/route.ts:51` `{ expiresIn: "30d" }`. |
| B3 | Kje je velikost bazena povezav? | `lib/db-connection.ts:17` – `DB_CONNECTION_LIMIT` ali 3 (serverless) / 10. |
| B4 | Kje se preveri, da številka računa še ne obstaja? | `app/api/invoices/route.ts:101-111` (`SELECT id FROM Invoices WHERE invoice_number = ?`, 400 »Račun s to številko že obstaja«). Ni `UNIQUE` omejitve v bazi (kolikor je znano) → tekmovalno stanje. |
| B5 | Kje je 15-dnevna valuta računa? | `components/invoice-form.tsx:125-133` (`due.setDate(due.getDate() + 15)`); pri ponudbi in dobropisu 30 dni (`offer-form.tsx:64`, `credit-note-form.tsx:64`). |
| B6 | Kje se izračuna `KONTROLA` in kaj pomeni? | `app/customers/page.tsx:810-812`: `KONTROLA = VLG + Izplacano × Provizija` – pričakovani prihodek svetovalca: fiksni honorar za vlogo + provizija od izplačanih sredstev. |
| B7 | Kje je SQL, ki reši N+1? | `app/api/invoices/route.ts:9-40` (LEFT JOIN Stranka + InvoiceItems, ORDER BY created_at DESC, ii.id ASC); sestavljanje z `Map` 43-84. |
| B8 | Kje se postavke ob urejanju izbrišejo in znova vstavijo? | `app/api/invoices/[id]/route.ts:106` DELETE, 108-115 INSERT v zanki. |
| B9 | Kje Playwright čaka, da so pisave naložene? | `app/api/invoices/[id]/pdf/route.ts:48-63` (`document.fonts.ready`, poslušanje `load`/`error` na slikah). |
| B10 | Kje se skrijejo gumbi, da ne pridejo v PDF? | Dva mehanizma: CSS `print:hidden` (`invoice-preview.tsx:123`) za Playwright/tisk; ročno `style.display = 'none'` za html2canvas (`lib/pdf-generator.tsx:81-84`, obnova 139-141 in 200-203). |
| B11 | Kje je vektorski footer PDF-ja in zakaj je ločen od slike? | `lib/pdf-generator.tsx:47-75` (`addFooterToPDF`, jsPDF `text`/`line`, barva 147,68,53). HTML footer se iz klona odstrani (90-91), ker rasterski tekst pri 7 pt ni oster. |
| B12 | Kje se oklch barve pretvorijo v hex? | `lib/pdf-generator.tsx:21-44`. Hevristika po podnizih (`0.7`+`0.05` → `#934435`, `0.95` → `#f8ecec`, `0.87` → `#cccccc`), sicer črna. |
| B13 | Kje se odloči med strežniško in brskalniško PDF potjo? | `lib/pdf-generator.tsx:214` `if (invoice.id)` → `fetch('/api/invoices/{id}/pdf')`, ob napaki `.catch` 228-233 → `generateInvoicePDFFromElement`. |
| B14 | Kje je določena struktura JSON telesa za plačilo? | Pošilja `lib/database.ts:465` `{ paid_amount, notes }` (snake_case!), bere `app/api/invoices/[id]/payment/route.ts:10`. |
| B15 | Kje so dovoljeni statusi računa? | Strežnik: `app/api/invoices/[id]/status/route.ts:16` `['draft','sent','paid','cancelled']`; tip: `lib/database.ts:104`. Ponudbe: `accepted/rejected` (`offers/[id]/status/route.ts:15`). |
| B16 | Kje se račun samodejno označi kot poslan? | `lib/email-service.ts:102-110` v `openEmailClient` (če `'id' in invoice && status === 'draft'`), in še enkrat v `app/invoices/list/page.tsx:210-213`. |
| B17 | Kje se preveri žeton ob vsaki navigaciji? | `app/contexts/AuthContext.tsx:26-29` (`useEffect(..., [pathname])` → `checkAuth` → POST `/api/auth/verify`). |
| B18 | Katere strani so ovite v `ProtectedRoute`? | Samo `/` (`app/page.tsx:227-233`) in `/customers` (`app/customers/page.tsx:1493-1501`). Ostale strani varuje le preusmeritev v `AuthContext.checkAuth` (vrstice 51-53, 93-95). |
| B19 | Kje je mock podatke, če baza ne dela? | `app/customers/page.tsx:436-508` (`catch` → `mockData`, `apiError = true`, opozorilo 1033-1039). Samo modul strank; računi ob napaki pokažejo prazen seznam. |
| B20 | Kje se filtrira seznam strank in kako je optimizirano? | `app/customers/page.tsx:535-597` `useMemo` nad `[customers, debouncedSearchTerm, filters, sortConfig]`; `useDebounce` 200-214 (300 ms). |
| B21 | Kje se generira ime PDF datoteke in kaj se odstrani? | `lib/pdf-generator.tsx:16-18` `safeFilenamePart` odstrani `<>:"/\|?*` in kontrolne znake; `app/invoices/list/page.tsx:31-35` druga različica (`[^a-zA-Z0-9]` → odstrani tudi š/č/ž). |
| B22 | Kje strežnik pove brskalniku, naj PDF prenese in ne prikaže? | `app/api/invoices/[id]/pdf/route.ts:78` `Content-Disposition: attachment; filename="…"`. |
| B23 | Kje je definirano, da se datumi prikazujejo slovensko? | `toLocaleDateString("sl-SI")` v predogledih (`invoice-preview.tsx:173-179`), seznamih, e-pošti. Zneski pa `de-DE` (`invoice-preview.tsx:12`, `ledger:85`) – vedeti moraš, zakaj (isti zapis 1.234,56; `sl-SI` v starejših ICU tabelah ni bil zanesljiv). |
| B24 | Kje se sestavi `mailto:` povezava? | `lib/email-service.ts:132-133` (`encodeURIComponent` za subject/body, `window.open`). |
| B25 | Kje se mesečni pogled ledgerja sortira po številki računa? | `app/invoices/ledger/page.tsx:197-204`, s `parseInvoiceNumber` (79-82: odstrani vse ne-števke, `parseInt`). |
| B26 | Kje je `insertId` in od kod pride? | `app/api/invoices/route.ts:132` – `ResultSetHeader` mysql2 po `INSERT`; uporabi se kot `invoice_id` postavk. |
| B27 | Kje `parseFloat` pretvarja zneske iz baze in zakaj je potreben? | `app/api/invoices/route.ts:63-67,79-81`. mysql2 vrača `DECIMAL` kot **niz** (da ne izgubi natančnosti), zato brez `parseFloat` bi `totalPayable.toFixed(2)` v UI vrgel napako. |
| B28 | Kje se pošlje `Authorization: Bearer` glava in kdo jo bere? | Pošlje `AuthContext.tsx:66`; **nihče je ne bere** – `verify/route.ts:11` bere žeton iz telesa. Ostale API poti glave sploh ne pričakujejo. |

---

## C. »Razložite vrstico po vrstici« (komisija pokaže odsek)

**C1. `lib/db-connection.ts:41-62` – funkcija `query`.**
```ts
export async function query(sql: string, params?: any[]) {
  const queryTimeout = getNumberEnv('DB_QUERY_TIMEOUT_MS', 15_000)
  const slowQueryWarnMs = getNumberEnv('DB_SLOW_QUERY_WARN_MS', 1_500)
  const connection = await getPool().getConnection()
  const startedAt = Date.now()
  try {
    const [results] = await connection.execute({ sql, values: params ?? [], timeout: queryTimeout } as any)
    return results
  } catch (error) { console.error('Database query error:', error); throw error }
  finally {
    const elapsedMs = Date.now() - startedAt
    if (elapsedMs >= slowQueryWarnMs) console.warn(`Slow DB query (${elapsedMs}ms): ${sql}`)
    connection.release()
  }
}
```
Vprašanja: Zakaj `getConnection()` in ne `pool.execute()`? Zakaj `[results]` v oglatih oklepajih? Zakaj `as any`? Kaj se zgodi, če `release()` pozabiš? Ali `timeout` sploh deluje?
<details><summary>Kaj mora odgovor vsebovati</summary>

- `pool.getConnection()` izposodi eno povezavo; `finally` jo **vedno** vrne (tudi ob napaki) – sicer bazen po 10 napakah »usahne« in vse zahteve visijo (`waitForConnections: true`, `queueLimit: 0` = neomejena čakalna vrsta).
- `execute` vrne `[rows, fields]` – destrukturiranje vzame prvi element. `execute` = pripravljen stavek (prepared statement): parametri `?` gredo ločeno od SQL → **SQL injection ni mogoč**.
- `as any`: mysql2 tipi ne poznajo `timeout` v objektu; po dokumentaciji mysql2 `timeout` per-poizvedba **ni podprt** (to je bila možnost knjižnice `mysql`), zato je verjetno brez učinka – iskren odgovor: »opcija je bila dodana kot zaščita, dejanski učinek moram preveriti; realno omejitev daje `connectTimeout` in MySQL `max_execution_time`.«
- Počasne poizvedbe se le logirajo (1,5 s) – opazovanje, ne ukrep.
- Slabost: vsaka `query` dobi novo povezavo → **transakcija čez več `query` klicev ni mogoča** (glej E2).
</details>

**C2. `app/api/invoices/route.ts:43-86` – sestavljanje iz JOIN vrstic.**
<details><summary>Kaj mora odgovor vsebovati</summary>

- JOIN vrne eno vrstico na **postavko** (račun z 3 postavkami = 3 vrstice, isti `i.id`). `Map` (ključ `row.id`) hrani glavo le enkrat (`if (!invoicesMap.has(row.id))`), postavke dodaja v `items` (`if (row.item_id)` – zaradi `LEFT JOIN` račun brez postavk vrne `item_id = NULL`).
- `ORDER BY i.created_at DESC, ii.id ASC` → računi od najnovejšega, postavke v vrstnem redu vnosa. `Map` ohranja vrstni red vstavljanja → `Array.from(invoicesMap.values())` ohrani sortiranje.
- `id: row.id.toString()` – v UI so ID-ji nizi (URL parametri, `useParams` vrača nize), zato poenotenje.
- `unpaidAmount` izračunan tu (67) in ne v bazi – zato ga ledger računa še enkrat lokalno (`ledger:221`), da se sproti spreminja med tipkanjem.
</details>

**C3. `app/contexts/AuthContext.tsx:38-107` – `checkAuth`.**
<details><summary>Kaj mora odgovor vsebovati</summary>

- `typeof window === 'undefined'` → varovalo za SSR (na strežniku ni `localStorage`).
- Brez žetona: `setLoading(false)` + `router.push('/login')` (razen če že na `/login`).
- Z žetonom: POST `/api/auth/verify` (žeton v glavi *in* telesu; strežnik bere telo). Ob `valid` nastavi `user`; če si na `/login`, te pošlje na `/`. Ob neveljavnem/napaki: pobriše žeton, `user = null`, na `/login`.
- `finally setLoading(false)` → `ProtectedRoute` čaka na to, da odloči med vrtavko/`null`/vsebino.
- Zakaj `[pathname]`: da se preverjanje ponovi po vsaki navigaciji (npr. žeton je medtem potekel). Cena: en POST na vsako navigacijo. Alternativa: preveri enkrat + osveži ob 401.
- Zakaj `router.push` in ne `window.location.href` (komentarji v kodi): SPA navigacija brez polnega reloada – ohrani stanje Reacta in je hitrejša.
</details>

**C4. `components/invoice-form.tsx:145-159` – `updateItem` in `rawValues`.**
<details><summary>Kaj mora odgovor vsebovati</summary>

- Dva vira resnice: `items[i].quantity` (število za izračun) in `rawValues["i-quantity"]` (niz, kot ga tipka uporabnik – da lahko vpiše `1,` in nadaljuje `1,5`, ne da bi se vmes pretvorilo v `1`).
- `parseLocaleNumber` (`lib/utils.ts:8-11`) zamenja **prvo** vejico s piko → `NaN` → 0.
- `newItems[index] = { ...newItems[index], [field]: ... }` = nova kopija objekta (nespremenljivost, da React zazna spremembo); `total = quantity × price` takoj.
- `onBlur` (322-327) normalizira niz na `String(numeric)` → `1,50` postane `1.5`.
- Pomanjkljivosti, ki jih moraš poznati: ključ po **indeksu** – ob brisanju postavke se surove vrednosti zamaknejo; ob nalaganju računa za urejanje se `rawValues` ne počisti; `"1.234,56"` → `1.234` (napačno), ker `parseLocaleNumber` ne odstrani ločila tisočic (ledgerjev `parseAmount` to zna).
</details>

**C5. `lib/pdf-generator.tsx:78-206` – `generateInvoicePDFFromElement`.**
<details><summary>Kaj mora odgovor vsebovati (koraki)</summary>

1. Skrij `.print:hidden` gumbe v originalu (da klon podeduje `display:none`).
2. `cloneNode(true)`; iz klona odstrani `.normal-footer` (footer bo vektorski).
3. Začasni `div` fiksne širine `210mm`, `top:-10000px` (izven zaslona, a v DOM-u, da se izriše), bel, Arial 9pt, črna.
4. 300 ms pavza, da se slike/pisave izrišejo.
5. `normalizeColors` na vseh elementih (oklch → hex), še enkrat v `onclone` (html2canvas naredi svoj klon dokumenta).
6. `html2canvas(scale: 3)` ≈ 300 DPI; `useCORS/allowTaint` za slike; `logging:false`.
7. Odstrani začasni div, obnovi gumbe.
8. `jsPDF({ compress: true })`, A4 v mm; širina slike = 210 − 2×10; višina sorazmerno; če presega `availableHeight` (−20 mm za footer) → pomanjšaj in centriraj (»fit to page«, nikoli več strani!).
9. `addImage(canvas, 'PNG', …, 'FAST')` – PNG brez izgub (ostre črke), FAST = Flate stiskanje.
10. `addFooterToPDF` vektorsko; vrni `Blob`.
- `catch`: obnovi gumbe, vrzi naprej.
- Slabosti: raster (tekst ni izbirljiv), samo ena stran, oklch hevristika, 300 ms »magic sleep«.
</details>

**C6. `app/invoices/ledger/page.tsx:125-157` – nalaganje z `cancelled` zastavico.**
<details><summary>Kaj mora odgovor vsebovati</summary>

- IIFE `(async () => {...})()` znotraj `useEffect`, ker `useEffect` ne sme biti `async`.
- `cancelled` v zaprtju (closure): čistilna funkcija (`return () => { cancelled = true }`) prepreči `setState` po odmontiranju (React Strict Mode dvakrat izvede efekt – brez tega bi dobil dva odgovora in morebiti stanje starejšega).
- `localEdits` – kopija `paidAmount/notes` po ID-ju, ki jo uporabnik ureja lokalno; shrani se šele s »Shrani« (`handleSave` 178-194 → `updateInvoicePayment`), nato se posodobi `invoices` in `unpaidAmount`.
</details>

**C7. `app/customers/page.tsx:618-653` – `calculateFormula`.**
<details><summary>Kaj mora odgovor vsebovati</summary>

- Vhod `"vlg * 0.8"`. Najprej `fieldMap` iz `numericFields` (imena v malih črkah → številske vrednosti iz trenutnega obrazca).
- Zamenjava imen z vrednostmi z regexom `\b<ime>\b` (meje besed: `vlg` ne zadene `vlg_z_ddv`, ker je `_` besedni znak).
- Če je rezultat čisto število (`/^-?\d*\.?\d+$/`) → `parseFloat` brez `eval`.
- Bela lista `/^[0-9+\-*/(). ]+$/` – **samo števke, operatorji, oklepaji, pika, presledek**; vsaka črka ali `;` vrne `null` → `eval` nikoli ne dobi identifikatorjev, klicev, `window`, `fetch`. Zaokroži na 2 decimalki.
- Zakaj je vseeno slab vzorec: `eval` je »code smell«, CSP (`unsafe-eval`) ga lahko prepove, `1/0` → `Infinity` ni ujet (`isNaN(Infinity)` je `false`). Alternativa: lasten razčlenjevalnik (glej E4) ali `mathjs`.
- `null` vs `0`: `null` = formula (še) ni veljavna → polje se ne prepiše (uporabnik tipka); `0` = prazno.
</details>

**C8. `app/api/invoices/[id]/pdf/route.ts:37-44` – URL, ki ga odpre Playwright.**
```ts
const origin = request.nextUrl.origin
const targetUrl = `${origin}/invoices/print/${encodeURIComponent(params.id)}`
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(targetUrl, { waitUntil: "networkidle" })
await page.waitForSelector("#invoice-preview-content", { state: "visible", timeout: 30_000 })
```
Vprašanje: Playwright je nov brskalnik brez `localStorage`. Kaj naredi `AuthProvider` na strani `/invoices/print/…`?
<details><summary>Kaj mora odgovor vsebovati</summary>

- `app/invoices/print/[id]/page.tsx` je pod `app/layout.tsx`, torej znotraj `AuthProvider`. `checkAuth` ne najde žetona → `router.push('/login')` (`AuthContext.tsx:51-53`). Vzporedno teče `fetchInvoiceById`. Tekmovalno stanje: element `#invoice-preview-content` se morda za trenutek pokaže, nato stran preide na `/login`; `waitForSelector` po `networkidle` verjetno **ne najde** elementa → po 30 s napaka 500 → odjemalec tiho preklopi na rasterski PDF (`pdf-generator.tsx:228-233`).
- To moraš **preveriti v živo** (DevTools Console; ali je tekst v PDF izbirljiv). Če pade: rešitev je (a) `print` stran izvzeti iz `AuthProvider` (ločen `layout` v `app/invoices/print/`), ker jo doseže le strežnik, ali bolje (b) Playwright ob obisku nastavi žeton: `context.addInitScript(([t]) => localStorage.setItem('token', t), [token])` ali piškotek, in strežniška pot generira kratkoživ žeton.
- Isto za ponudbe/dobropise, kjer je ciljna stran celo `/offers/view/…` z **bočnim menijem in glavo** (`offers/[id]/pdf/route.ts:38`) – tudi če bi delovalo, bi bil v PDF-ju meni.
</details>

---

## D. »Zakaj tako in ne drugače?« (odločitve)

**D1. Zakaj Next.js App Router z API potmi in ne ločen Express backend, kot ste ga imeli v prvi verziji (`localhost:3000/stranka`)?**
<details><summary>Kaj mora odgovor vsebovati</summary>
En projekt, en jezik, deljeni tipi (`lib/database.ts`), eno gostovanje, brez CORS. Slabost: strežniške poti so vezane na Next runtime (Playwright na serverless ne teče), težje horizontalno skaliranje backend-a ločeno od frontenda.
</details>

**D2. Zakaj MySQL in DECIMAL(10,2), ne PostgreSQL ali NoSQL?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Relacijski podatki (1:N stranka→dokumenti→postavke), DECIMAL za denar (brez binarnih zaokrožitev), dostopnost na gostovanju. Vedeti moraš: `DECIMAL(10,2)` = največ 99.999.999,99; mysql2 ga vrača kot niz; v JS se računa z `number` (float) – zaokroževanje je treba narediti eksplicitno.
</details>

**D3. Zakaj JWT in `localStorage`, ne seja s piškotkom?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Brez stanja na strežniku, enostavno (en uporabnik). Slabosti: XSS lahko ukrade žeton; ni preklica (odjava le briše `localStorage`, žeton velja 30 dni). Boljše: `httpOnly; Secure; SameSite=Lax` piškotek (glej E8) + kratek žeton + osvežitveni žeton.
</details>

**D4. Zakaj se izračun DDV izvaja v brskalniku in ga strežnik ne preverja?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Odzivnost (sprotni prikaz). Tveganje: kdorkoli lahko pošlje `POST /api/invoices` s poljubnim `vat`. Pravilno: strežnik ponovno izračuna in zaokroži (E3). Dodatno: ker ni zaokroževanja pred shranjevanjem, se lahko zgodi `osnova + DDV ≠ skupaj` po zaokrožitvi vsakega stolpca posebej v `DECIMAL(10,2)` (primer: 3 × 0,335 = 1,005 → osnova 1,01 v bazi, DDV 0,2211 → 0,22, skupaj 1,2261 → 1,23, a 1,01 + 0,22 = 1,23 – tu se izide, a ni zagotovljeno).
</details>

**D5. Zakaj ob urejanju ne posodobite postavk (UPDATE po ID-ju), ampak vse izbrišete in znova vstavite?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Preprostost: ni potrebno računati razlik (nova/spremenjena/izbrisana). Cena: novi ID-ji postavk, več zapisov, in brez transakcije → če `INSERT` pade po `DELETE`, račun ostane brez postavk.
</details>

**D6. Zakaj `DELETE FROM Invoices` ne izbriše postavk, `DELETE` ponudbe pa najprej izbriše `OfferItems`?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Nedoslednost, ki jo moraš poznati: `offers/[id]/route.ts:132-135` briše postavke ročno (in vrne `error.message` – sled odpravljanja napake tujega ključa), `invoices/[id]/route.ts:133` in `credit-notes` ne. Pravilni odgovor je odvisen od sheme: če je `FOREIGN KEY ... ON DELETE CASCADE`, je ročno brisanje odveč; če FK ni, ostanejo sirote; če je FK brez CASCADE, `DELETE` računa pade s 500. **Vedeti moraš, kaj je v tvoji bazi** (`SHOW CREATE TABLE InvoiceItems`).
</details>

**D7. Zakaj `loadInvoiceForEdit` naloži vse račune in išče po ID-ju, čeprav obstaja `fetchInvoiceById`?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Zgodovinsko (`fetchInvoiceById` je bil dodan pozneje za `view` stran). Pravilno bi bilo `fetchInvoiceById(id)` – ena vrstica namesto celotnega prenosa. Dodatno: ta `useEffect` je v `app/invoices/page.tsx` **dvakrat** (35-40 in 114-124) → dva prenosa vseh računov ob vsakem odprtju z `?edit=`.
</details>

**D8. Zakaj imate tri kopije obrazca (`invoice-form`, `offer-form`, `credit-note-form`) in ne enega generičnega, kot je `document-form.tsx`?**
<details><summary>Kaj mora odgovor vsebovati</summary>
`document-form.tsx` je bil poskus generične komponente, a se razlike (15/30 dni, polje datuma storitve, besedila, statusi, tipi) niso lepo posplošile; kopije so pragmatična odločitev za en projekt. Cena: popravek decimalne vejice si moral narediti trikrat (glej git 8. 4.). Kako bi refaktoriral: en `DocumentForm<T>` s `config` objektom (label, dni valute, polja) – `CustomerAutocomplete` je že deljen (`invoice-form.tsx:31`, uvožen v `offer-form.tsx:13`).
</details>

**D9. Zakaj preverjanje prijave na vsaki navigaciji, ne enkrat ob zagonu?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Da se izteklost/neveljavnost žetona zazna takoj ob navigaciji, ne šele ob API napaki (ki je API tako ali tako ne vrne, ker ni zaščiten). Alternativa: preveri enkrat, potem naj vsak API klic vrne 401 in `AuthContext` ob 401 odjavi.
</details>

**D10. Zakaj Playwright na strežniku in ne samo brskalniški `window.print()` v PDF?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Enoten rezultat neodvisno od brskalnika in uporabnikovih nastavitev tiskanja (robovi, glava/noga), izbirljiv tekst, možnost pošiljanja kot priponka s strežnika. `window.print()` je še vedno na voljo (»Natisni« gumb, `invoice-preview.tsx:25-27`).
</details>

**D11. Zakaj html2canvas s `scale: 3` in PNG, pri dobropisu pa `scale: 2` in JPEG?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Račun je bil optimiziran zadnji (»High-DPI«, PNG brez izgub, `compress: true`, FAST); dobropis ima starejšo verzijo (`compressPNG` → JPEG 0.95, manjša datoteka, artefakti okoli črk). Nedoslednost – poenoti.
</details>

**D12. Zakaj so `paid_amount` in `notes` v tabeli `Invoices`, ne v ločeni tabeli plačil?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Zahteva naročnika: en znesek in ena opomba na račun, urejanje kot v Excelu (ledger). Ločena tabela `Payments(invoice_id, amount, date)` bi omogočila delna plačila z datumi in izpis IOP – navedi kot nadgradnjo.
</details>

**D13. Zakaj `de-DE` za formatiranje zneskov, ko je aplikacija slovenska?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Slovenski in nemški zapis sta enaka (`1.234,56`); `de-DE` je bil izbran kot zanesljivo podprt v vseh brskalnikih/Node ICU. V `email-service.ts:13` je `sl-SI` – nedoslednost, ki jo priznaš.
</details>

**D14. Zakaj `Map` in ne `reduce`/objekt pri sestavljanju računov?**
<details><summary>Kaj mora odgovor vsebovati</summary>
`Map` ohranja vrstni red vstavljanja in ima ključe poljubnega tipa (števila) brez pretvorbe v niz; `has/get/set` so O(1). Objekt s številskimi ključi bi vrstni red **sortiral po ključu** in pokvaril `ORDER BY created_at`.
</details>

**D15. Zakaj obrazec strank hrani `formulaInputs` ločeno od `formData`?**
<details><summary>Kaj mora odgovor vsebovati</summary>
`formData.ODL` je število (rezultat), `formulaInputs.ODL` je niz, ki ga uporabnik tipka (`"vlg*0.8"`). Če bi bilo eno polje, bi se ob vsakem tipkanju formula prepisala z rezultatom. Pomanjkljivost: formula se v bazo ne shrani – po ponovnem odprtju vidiš le število (`handleEdit` 918-922 jo nadomesti s `String(value)`).
</details>

**D16. Zakaj je `id` računa v TypeScriptu `string`, v bazi pa `INT`?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Iz URL-jev (`useParams`, `searchParams.get('edit')`) pridejo nizi; da ne bi primerjal `1 === "1"` (false), so ID-ji poenoteni na nize v API-ju (`row.id.toString()`). `customer.id` pa ostane število (iz `SELECT *`).
</details>

**D17. Zakaj `Suspense` okoli strani z `useSearchParams`?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Next 15 zahteva, da je `useSearchParams` v odjemalski komponenti znotraj `Suspense`, sicer gradnja javi napako pri statični predupodobitvi (»useSearchParams() should be wrapped in a suspense boundary«). `app/invoices/page.tsx:252-258`.
</details>

**D18. Zakaj skriti `InvoicePreview` na `-10000px` za PDF na seznamu, namesto klica strežniške poti?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Seznam nima izrisanega dokumenta; da html2canvas dobi DOM, se predogled začasno izriše izven zaslona (`list/page.tsx:575-584`), po 1000 ms `setTimeout` se zajame. Nedoslednost: gumb »PDF« na seznamu **vedno** uporabi raster, gumb »Prenesi PDF« na `view` strani pa najprej strežnik. Pravilno: na seznamu klicati `downloadInvoicePDF(invoice)` (ima ID) – brez skritega predogleda.
</details>

**D19. Zakaj množični prenos ne naredi ZIP-a?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Brez dodatne knjižnice (JSZip); brskalnik prenese N datotek zaporedno (nekateri brskalniki vprašajo za dovoljenje za več prenosov). Zaporedno s 1000 ms + 100 ms na račun → 20 računov ≈ 25 s. Nadgradnja: strežniški ZIP iz Playwright PDF-jev.
</details>

**D20. Zakaj `bcrypt` (10 krogov) in ne `SHA-256`?**
<details><summary>Kaj mora odgovor vsebovati</summary>
SHA-256 je hiter (milijarde/s na GPU) → slovar/mavrične tabele; bcrypt je namerno počasen (cost 10 ≈ 100 ms), s soljo v hashu (`$2b$10$…`), odporen proti vzporednim napadom. Alternativi: argon2id, scrypt.
</details>

**D21. Zakaj `jsonwebtoken` in ne `jose`? Kaj bi se zgodilo v Next middlewaru?**
<details><summary>Kaj mora odgovor vsebovati</summary>
`jsonwebtoken` uporablja Node `crypto`; Next `middleware.ts` teče na Edge runtimu brez Node API-jev → tam bi moral uporabiti `jose` (`jwtVerify` z Web Crypto). To je razlog, da je middleware v E1 napisan z `jose`.
</details>

**D22. Zakaj sta `DataTable` in `AutocompleteDropdown` definirana znotraj `CustomersPageContent`?**
<details><summary>Kaj mora odgovor vsebovati</summary>
Za dostop do stanja brez podajanja props (zaprtje). Cena: ob vsakem renderju starša nastane **nova funkcija-komponenta** → React jo odmontira in znova montira (izguba fokusa v njenih inputih, ponovni izris 60 stolpcev × N vrstic ob vsakem pritisku tipke v iskalniku). Pravilno: ločeni komponenti s props ali `useMemo`/`useCallback`.
</details>

---

## E. »Napišite kodo« (na tablo ali v urejevalnik)

**E1. Zaščitite vse `/api/*` poti z JWT, razen prijave.**
<details><summary>Referenčna rešitev</summary>

```ts
// middleware.ts (koren projekta) – Edge runtime, zato jose
import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"

const PUBLIC = new Set(["/api/auth/login", "/api/auth/verify"])

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC.has(pathname)) return NextResponse.next()

  const header = req.headers.get("authorization") ?? ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.cookies.get("token")?.value
  if (!token) return NextResponse.json({ error: "Nepooblaščen dostop" }, { status: 401 })

  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!))
    return NextResponse.next()
  } catch {
    return NextResponse.json({ error: "Neveljaven žeton" }, { status: 401 })
  }
}

export const config = { matcher: ["/api/:path*"] }
```
In odjemalec mora glavo **pošiljati** – en ovoj v `lib/database.ts`:
```ts
function authFetch(input: string, init: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return fetch(input, { ...init, headers: { ...(init.headers ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
}
```
Ne pozabi: Playwright PDF pot potem potrebuje žeton (strani `print` kličejo `/api/invoices/[id]`) – strežnik naj pri `newContext()` doda `addInitScript`, ki nastavi `localStorage.token` na kratkoživ žeton, ki ga podpiše sam.
</details>

**E2. Shranjevanje računa naredite atomarno (transakcija).**
<details><summary>Referenčna rešitev</summary>

```ts
import { getConnection } from "@/lib/db-connection"

const conn = await getConnection()          // ISTA povezava za vse stavke!
try {
  await conn.beginTransaction()
  const [res] = await conn.execute(
    `INSERT INTO Invoices (invoice_number, customer_id, service_description, issue_date, due_date, service_date,
       total_without_vat, vat, total_payable, status) VALUES (?,?,?,?,?,?,?,?,?,'draft')`,
    [n, customerId, desc, issue, due, service, base, vat, total]
  )
  const invoiceId = (res as any).insertId
  for (const it of items) {
    await conn.execute(
      `INSERT INTO InvoiceItems (invoice_id, description, quantity, price, total) VALUES (?,?,?,?,?)`,
      [invoiceId, it.description, it.quantity, it.price, it.total]
    )
  }
  await conn.commit()
} catch (e) {
  await conn.rollback()
  throw e
} finally {
  conn.release()
}
```
Ključna točka za komisijo: `query()` iz `db-connection.ts` za vsak klic vzame **drugo** povezavo iz bazena, zato transakcija čez `query()` ni mogoča – potrebna je ena `connection`.
</details>

**E3. Strežnik naj ne zaupa zneskom iz brskalnika.**
<details><summary>Referenčna rešitev</summary>

```ts
import { z } from "zod"   // že v odvisnostih
const VAT_RATE = 0.22
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

const ItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().finite().nonnegative(),
  price: z.number().finite(),
})
const InvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  customer: z.object({ id: z.number().int().positive() }),
  serviceDescription: z.string().default(""),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(ItemSchema).min(1),
})

const parsed = InvoiceSchema.safeParse(await request.json())
if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

const items = parsed.data.items.map(i => ({ ...i, total: round2(i.quantity * i.price) }))
const base = round2(items.reduce((s, i) => s + i.total, 0))
const vat = round2(base * VAT_RATE)
const total = round2(base + vat)
```
</details>

**E4. Zamenjajte `eval` z varnim razčlenjevalnikom aritmetičnih izrazov.**
<details><summary>Referenčna rešitev (rekurzivni spust)</summary>

```ts
// Slovnica:  expr := term (('+'|'-') term)* ; term := factor (('*'|'/') factor)* ;
//            factor := number | '(' expr ')' | '-' factor
export function evaluate(src: string): number {
  let i = 0
  const ws = () => { while (src[i] === " ") i++ }
  const number = () => {
    ws(); const start = i
    while (/[0-9.]/.test(src[i] ?? "")) i++
    if (start === i) throw new Error(`Pričakovano število na mestu ${i}`)
    return parseFloat(src.slice(start, i))
  }
  const factor = (): number => {
    ws()
    if (src[i] === "(") { i++; const v = expr(); ws(); if (src[i++] !== ")") throw new Error("Manjka )"); return v }
    if (src[i] === "-") { i++; return -factor() }
    return number()
  }
  const term = (): number => {
    let v = factor()
    for (;;) { ws(); const op = src[i]; if (op !== "*" && op !== "/") return v; i++; const r = factor(); v = op === "*" ? v * r : v / r }
  }
  const expr = (): number => {
    let v = term()
    for (;;) { ws(); const op = src[i]; if (op !== "+" && op !== "-") return v; i++; const r = term(); v = op === "+" ? v + r : v - r }
  }
  const v = expr(); ws()
  if (i !== src.length) throw new Error(`Nepričakovan znak na mestu ${i}`)
  if (!Number.isFinite(v)) throw new Error("Rezultat ni število")
  return v
}
```
V `calculateFormula` nadomesti `eval(expression)` z `evaluate(expression)`; zamenjava imen polj ostane enaka.
</details>

**E5. Samodejno številčenje računov po letu (`2026-001`).**
<details><summary>Referenčna rešitev</summary>

```ts
// znotraj transakcije (glej E2), da dva hkratna zahtevka ne dobita iste številke
const year = new Date(issueDate).getFullYear()
const [rows] = await conn.execute(
  `SELECT invoice_number FROM Invoices WHERE invoice_number LIKE ?
   ORDER BY CAST(SUBSTRING_INDEX(invoice_number, '-', -1) AS UNSIGNED) DESC LIMIT 1 FOR UPDATE`,
  [`${year}-%`]
)
const last = (rows as any[])[0]?.invoice_number as string | undefined
const next = last ? Number(last.split("-").pop()) + 1 : 1
const invoiceNumber = `${year}-${String(next).padStart(3, "0")}`
```
Plus `UNIQUE INDEX (invoice_number)` v bazi, da je zaščita tudi, če nekdo številko vpiše ročno. Vedeti: `FOR UPDATE` zaklene vrstico do `COMMIT` (InnoDB); brez transakcije je neuporaben.
</details>

**E6. Pretvorba sprejete ponudbe v račun z enim klikom.**
<details><summary>Referenčna rešitev (skica)</summary>

```ts
// POST /api/offers/[id]/convert  { invoiceNumber }
const [[offer]] = await conn.query(`SELECT * FROM Offers WHERE id = ?`, [id]) as any
const [items] = await conn.query(`SELECT description, quantity, price, total FROM OfferItems WHERE offer_id = ?`, [id]) as any
await conn.beginTransaction()
const [res] = await conn.execute(`INSERT INTO Invoices (...) VALUES (...)`, [invoiceNumber, offer.customer_id, offer.service_description, today, today+15, today, offer.total_without_vat, offer.vat, offer.total_payable])
for (const it of items) await conn.execute(`INSERT INTO InvoiceItems (...) VALUES (?,?,?,?,?)`, [res.insertId, ...])
await conn.execute(`UPDATE Offers SET status='accepted' WHERE id = ?`, [id])
await conn.commit()
return NextResponse.json({ invoiceId: res.insertId })
```
UI: gumb na `offers/view` → `router.push('/invoices/view/' + invoiceId)`.
</details>

**E7. Straničenje seznama računov (`?page=2&pageSize=20`) – zakaj `LIMIT` na JOIN ne deluje?**
<details><summary>Referenčna rešitev</summary>

Ker JOIN vrne eno vrstico na postavko, bi `LIMIT 20` odrezal postavke in ne računov. Zato dva koraka:
```ts
const [ids] = await conn.query(`SELECT id FROM Invoices ORDER BY created_at DESC LIMIT ? OFFSET ?`, [pageSize, (page-1)*pageSize])
if (!ids.length) return NextResponse.json({ items: [], total })
const [rows] = await conn.query(`SELECT ... FROM Invoices i LEFT JOIN Stranka s ... LEFT JOIN InvoiceItems ii ...
                                 WHERE i.id IN (?) ORDER BY i.created_at DESC, ii.id ASC`, [ids.map(r => r.id)])
const [[{ total }]] = await conn.query(`SELECT COUNT(*) AS total FROM Invoices`)
```
(mysql2 `query` razširi polje v `IN (?)`; `execute` tega ne zna – še ena razlika, ki jo komisija rada vpraša.) Git zgodovina kaže, da si straničenje dodal in odstranil 4. 3. – povej zakaj (ledger potrebuje vse račune za vsote po mesecih; pri < 1000 računih ni bilo potrebe).
</details>

**E8. Prijava s `httpOnly` piškotkom namesto `localStorage`.**
<details><summary>Referenčna rešitev</summary>

```ts
// login/route.ts
const res = NextResponse.json({ success: true, user: { username, role: "admin" } })
res.cookies.set("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 })
return res
// verify / middleware: req.cookies.get("token")?.value
// logout/route.ts: res.cookies.set("token", "", { maxAge: 0, path: "/" })
```
`AuthContext` potem ne bere `localStorage`, ampak le kliče `/api/auth/verify` (piškotek gre samodejno, `credentials: "same-origin"`). Odjemalski JS do žetona ne pride → XSS ga ne more ukrasti.
</details>

**E9. Popravite napako, da urejanje računa prepiše ročno vpisano valuto.**
<details><summary>Referenčna rešitev</summary>

Vzrok: `useEffect([issueDate])` (`invoice-form.tsx:125-133`) se sproži tudi, ko `editingInvoice` nastavi `issueDate`, in prepiše `dueDate`. Popravek – računaj le ob **uporabnikovi** spremembi:
```tsx
const handleIssueDateChange = (value: string) => {
  setIssueDate(value)
  const d = new Date(value); d.setDate(d.getDate() + 15)
  setDueDate(d.toISOString().split("T")[0])
}
// <Input id="issue-date" type="date" value={issueDate} onChange={e => handleIssueDateChange(e.target.value)} />
// useEffect z [issueDate] odstrani; začetni dueDate nastavi v useState-u ali v useEffect-u z [] enkrat.
```
</details>

**E10. Popravite zamik `rawValues` ob brisanju postavke.**
<details><summary>Referenčna rešitev</summary>

Surovi niz naj živi **na postavki**, ne v ločenem slovarju po indeksu:
```ts
type FormItem = InvoiceItem & { quantityRaw?: string; priceRaw?: string }
// updateItem: newItems[index] = { ...item, [field]: num, [`${field}Raw`]: value }
// value={item.quantityRaw ?? String(item.quantity)}
// pri oddaji: items.map(({ quantityRaw, priceRaw, ...rest }) => rest)
```
Brisanje postavke potem odnese tudi njen surovi niz; nalaganje za urejanje ne pušča starih vrednosti.
</details>

**E11. API strank naj shrani vse stolpce (danes shrani 15 od 62).**
<details><summary>Referenčna rešitev</summary>

```ts
const ALLOWED = ["Stranka","Naslov","Kraj_postna_st","email","ID_DDV","Ukrep","JR","Pogodba","VLG","VLG_z_DDV", /* … vsi stolpci iz 01-create-database.sql … */ "SKUPAJ","KONTROLA"] as const
const keys = ALLOWED.filter(k => k in data)
if (!keys.length) return NextResponse.json({ error: "Ni podatkov" }, { status: 400 })
await query(
  `UPDATE Stranka SET ${keys.map(k => `\`${k}\` = ?`).join(", ")} WHERE id = ?`,
  [...keys.map(k => (data as any)[k] ?? null), params.id]
)
```
Bela lista imen stolpcev je obvezna – imena stolpcev **ne morejo** biti parametri `?`, zato bi brez nje uporabnik lahko vrinil SQL prek imena ključa.
</details>

**E12. Napišite enotski test za `parseAmount` (ledger) in `parseLocaleNumber`.**
<details><summary>Referenčna rešitev (Vitest)</summary>

```ts
import { describe, it, expect } from "vitest"
import { parseLocaleNumber } from "@/lib/utils"
import { parseAmount } from "@/lib/amount"   // parseAmount je treba premakniti iz strani v lib in izvoziti

describe("parseAmount", () => {
  it("slovenski zapis s tisočicami", () => expect(parseAmount("1.234,56")).toBe(1234.56))
  it("samo vejica", () => expect(parseAmount("12,5")).toBe(12.5))
  it("samo pika", () => expect(parseAmount("12.5")).toBe(12.5))
  it("presledki", () => expect(parseAmount("1 234,50")).toBe(1234.5))
  it("prazno in smeti", () => { expect(parseAmount("")).toBe(0); expect(parseAmount("abc")).toBe(0) })
})
describe("parseLocaleNumber", () => {
  it("vejica → pika", () => expect(parseLocaleNumber("1,5")).toBe(1.5))
  it("NE zna tisočic (znana omejitev)", () => expect(parseLocaleNumber("1.234,56")).toBe(1.234))
})
```
Komisija: »Zakaj testov ni?« – iskren odgovor + pokaži, da veš, kako bi jih napisal in katere funkcije so čiste (testabilne): `parseAmount`, `parseLocaleNumber`, `parseInvoiceNumber`, `calculateFormula`, `updateCalculations`, `safeFilenamePart`, sestavljanje iz JOIN vrstic.
</details>

**E13. Napišite `CREATE TABLE` za `Invoices` in `InvoiceItems`, kot ju uporablja vaša koda.**
<details><summary>Referenčna rešitev (rekonstrukcija iz poizvedb – preveri s `SHOW CREATE TABLE`)</summary>

```sql
CREATE TABLE Invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id INT NULL,
  service_description TEXT,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  service_date DATE NOT NULL,
  total_without_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
  vat DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_payable DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,        -- dodano 3. 3. 2026 (ledger)
  notes TEXT,                                          -- dodano 3. 3. 2026 (ledger)
  status ENUM('draft','sent','paid','cancelled') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES Stranka(id) ON DELETE SET NULL
);
CREATE TABLE InvoiceItems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (invoice_id) REFERENCES Invoices(id) ON DELETE CASCADE
);
-- Offers/OfferItems in CreditNotes/CreditNoteItems: enako, s stolpci offer_number / credit_note_number,
-- status ENUM('draft','sent','accepted','rejected') pri ponudbah.
```
Te skripte **dodaj v `scripts/`** – komisija bo vprašala, kje je shema dokumentov (v repozitoriju je le `Stranka`).
</details>

**E14. Napišite `useEffect`, ki naloži račun po ID-ju in pravilno obravnava odmontiranje.**
<details><summary>Referenčna rešitev</summary>

```tsx
useEffect(() => {
  if (!id) return
  const ac = new AbortController()
  fetch(`/api/invoices/${id}`, { signal: ac.signal })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    .then(setInvoice)
    .catch(e => { if (e.name !== "AbortError") setError(e.message) })
  return () => ac.abort()
}, [id])
```
Razloži: odvisnost `[id]`, čiščenje z `AbortController` (ali `cancelled` zastavico kot v ledgerju), zakaj `useEffect` ne sme biti `async`.
</details>

---

## F. »Najdite napako« (komisija pokaže odsek – vse so resnične)

| # | Odsek | Kaj je narobe | Posledica |
|---|---|---|---|
| F1 | `app/invoices/view/[id]/page.tsx:9` in `:168` | `XCircle` uporabljen, ni uvožen | Ogled **plačanega** računa vrže `ReferenceError` – stran se sesuje (build to skrije zaradi `ignoreBuildErrors`). |
| F2 | `app/offers/page.tsx:15` in `:126` | kliče `downloadOfferPDF`, uvožen je `downloadOfferPDFFromPreview` | »Prenesi PDF« takoj po ustvarjanju ponudbe vrže `ReferenceError`. Enako `app/credit-notes/page.tsx:126` (`downloadCreditNotePDF`). |
| F3 | `app/offers/page.tsx:133` | `openEmailClient(currentOffer, 'offer')` – drugi parameter je `recipientEmail` | Popravek iz 28. 4. je zgrešil to datoteko. Se **ne pokaže**, ker `OfferPreview` gumb kliče `openEmailClient(offer)` neposredno (`offer-preview.tsx:33-35`) in `onSendEmail` sploh ne uporabi. Dvojno vprašanje: najdi napako *in* razloži, zakaj se ne vidi. |
| F4 | `app/api/customers/route.ts:25-48`, `[id]/route.ts:39-65` | INSERT/UPDATE zapišeta 15 stolpcev | ODL, ZAH1–5, deleži, izplačila, SKUPAJ, KONTROLA se **nikoli ne shranijo**. Po osvežitvi strani so 0. Tabela jih pokaže le do osvežitve (`customers/page.tsx:889` lokalno nadomesti objekt). |
| F5 | `components/invoice-form.tsx:107-133` | efekt `[issueDate]` prepiše `dueDate` po nalaganju za urejanje | Vsako urejanje računa ponastavi valuto na +15 dni (ponudba/dobropis +30). |
| F6 | `components/invoice-form.tsx:316-328` | vnos količine je brez ovoja `col-span-2` in brez `Label` | Postavitev vrstice postavke je pokvarjena (količina zavzame 1 stolpec, brez naslova). Primerjaj z `offer-form.tsx:243-256`. |
| F7 | `lib/database.ts:4-10` in `:123,143` | `SavedOffer`/`SavedCreditNote` definirana dvakrat (type + interface) | TS napaka »Duplicate identifier«; prva definicija je napačna (`SavedInvoice & { offerNumber }` vsebuje `invoiceNumber`). |
| F8 | `lib/email-service.ts:83` | `subject`, `body` nista definirana (sta v `emailData`) | `sendInvoiceEmail` bi vrgel `ReferenceError`; ni klicana (mrtva koda). |
| F9 | `app/invoices/page.tsx:35-40` + `:114-124` | isti `useEffect` dvakrat | Dva prenosa vseh računov; drugi še nastavi `saveAsMode`. |
| F10 | `app/api/offers/[id]/pdf/route.ts:38,72` | cilj `/offers/view/…` (z menijem), ime datoteke brez `.pdf` | PDF bi vseboval bočni meni; prenesena datoteka brez končnice (tudi `pdf-generator-offer.ts:195`, `-credit-note.ts:195`). |
| F11 | `app/invoices/list/page.tsx:208-215` | po `updateInvoiceStatus` + `loadInvoices` kliče `openEmailClient(invoice)` s **starim** objektom (`status: 'draft'`) | `openEmailClient` status posodobi še enkrat → dva `PUT`. |
| F12 | `app/invoices/ledger/page.tsx:264,270` | `color: "oklch"` | Neveljavna CSS vrednost – brskalnik jo ignorira (ostanek). |
| F13 | `app/invoices/ledger/page.tsx:509` | `<>` v `map` brez `key` (ključ je na notranjem `<tr>`) | React opozorilo »Each child in a list should have a unique key«. |
| F14 | `app/invoices/list/page.tsx:32` | `invoice.customer.Stranka.replace(...)` brez `?.` | Če je stranka izbrisana (`customer_id` → NULL, LEFT JOIN), prenos PDF s seznama vrže `TypeError`. |
| F15 | `app/api/customers/route.ts:15,61` | `details: error.message` v odgovoru | Uhajanje internih sporočil baze (imena tabel, stolpcev) odjemalcu. |
| F16 | `app/contexts/AuthContext.tsx:116-121` | odjava le briše `localStorage` | Žeton ostane veljaven 30 dni; ukraden žeton se ne da preklicati. |
| F17 | `app/api/invoices/route.ts:101-111` | preverjanje podvojene številke + INSERT nista atomarna | Dva hkratna zahtevka z isto številko → oba uspeta (če ni `UNIQUE`). |
| F18 | `components/offer-form.tsx:39,116` | `serviceDate` ni v obrazcu, a se shrani današnji datum | Ponudba dobi »datum opravljene storitve« = datum vnosa, brez vedenja uporabnika. |
| F19 | `tsconfig.json:32` | `"@/contexts/*": ["./contexts/*"]` – mapa ne obstaja (`app/contexts`) | Neuporabljen alias; kaže na premik datoteke. |
| F20 | `lib/db-connection.ts:49` | `timeout` v `execute` (`as any`) | mysql2 te opcije (verjetno) ne podpira → brez učinka. Preveri v dokumentaciji in povej rezultat. |

---

## G. Pasti v živo (kaj bo komisija poskusila med demonstracijo)

1. **»Odprite plačan račun.«** → F1 (sesutje). Popravi pred zagovorom.
2. **»Ustvarite ponudbo in prenesite PDF.«** → F2. Popravi.
3. **»Vpišite stranko z ODL formulo `vlg*0.8`, shranite, osvežite stran.«** → F4 (vrednosti izginejo).
4. **»Uredite obstoječ račun, nič ne spremenite, shranite.«** → F5 (valuta se spremeni).
5. **»Odprite nov zavihek brez prijave in pojdite na `/api/customers`.«** → celoten seznam strank z e-pošto in davčnimi številkami brez prijave. Isto `/api/invoices`, `/api/test-db`. **To je najresnejša točka; E1 jo reši.**
6. **»V količino vpišite `1.234,56`.«** → `1,234` (parseLocaleNumber), medtem ko ledger `1.234,56` razume. Razloži razliko med `parseLocaleNumber` in `parseAmount`.
7. **»Prenesite PDF ponudbe z ogleda.«** → datoteka brez `.pdf` (F10).
8. **»Odprite PDF računa in poskusite označiti besedilo.«** → če ni izbirljivo, je tekla rezervna pot (C8/A8). Vedi, katera pot je tekla in zakaj.
9. **»Pokažite shemo tabele Invoices.«** → v repozitoriju je ni (E13).
10. **»Izbrišite stranko, ki ima račune.«** → odvisno od FK: napaka 500, ali računi s `customer: { Stranka: null }` → F14 pri prenosu.
11. **»Kaj naredi iskalno polje v glavi?«** → nič (`components/header.tsx:11`, ikone zvonec/nastavitve/uporabnik brez funkcij). Priznaj: dekorativno iz predloge.
12. **»Na domači strani piše 'Način delovanja: Testiranje' in 'v4.5'. Kje se to nastavi?«** → trdo kodirano (`app/page.tsx:149,157,215`, `sidebar.tsx:112`).
13. **»Kliknite 'Pošlji po e-pošti' na ogledu računa – ali se status osveži?«** → ne; predogled kliče `openEmailClient` mimo `onSendEmail`, zato `handleSendEmail` (ki bi ponovno naložil račun) ni nikoli klican.
14. **»Pritisnite F5 med tipkanjem plačila v ledgerju.«** → neshranjene lokalne spremembe izginejo (namerno: shrani se z gumbom).
15. **»Kaj se zgodi, če je `JWT_SECRET` prazen?«** → prijava vrne 500 »Konfiguracija strežnika ni pravilna« (`login/route.ts:15-21`).

---

## H. Hitri test (5 minut pred zagovorom)

Odgovori v enem stavku, brez gledanja:
1. Koliko poizvedb naredi `GET /api/invoices`? (1) In `GET /api/invoices/5`? (2)
2. Kaj vrne `POST /api/invoices` ob podvojeni številki? (400 + `{ error }`; `saveInvoice` to sporočilo prebere `error.error` in vrže `Error`).
3. Kaj se zgodi z računom `draft` ob kliku na e-pošto? (`sent`, prek `openEmailClient`).
4. Kje se odloči barva vrstice v ledgerju? (`renderInvoiceRow`: zelena plačano `#f0fdf4`, rumena delno `#fefce8`, bela).
5. Zakaj `Number.isFinite` v `getNumberEnv`? (`Number("abc")` je `NaN`; `NaN` ne sme postati `connectionLimit`).
6. Katere strani so `"use client"` in zakaj? (vse strani in komponente s stanjem/hooki; `layout.tsx` in `route.ts` niso).
7. Kaj pomeni `!` v `invoice.id!`? (non-null assertion – TS naj verjame, da ni `undefined`; ob napaki runtime pade).
8. Kaj naredi `?? []` v `values: params ?? []`? (privzeto prazno polje, če `params` ni podan; `??` reagira le na `null/undefined`, ne na `0`/`""`).
9. Zakaj `encodeURIComponent(params.id)` v URL-ju za Playwright? (varno kodiranje – ID iz URL-ja bi lahko vseboval posebne znake).
10. Kaj naredi `preferCSSPageSize: true` pri `page.pdf`? (če CSS določa `@page size`, ima prednost pred `format: "A4"`).

---

*Nadaljuj z `05-studij-kode-1-jedro.md` (konfiguracija, baza, avtentikacija, API), `05-studij-kode-2-ui-pdf-email.md` (obrazci, predogledi, PDF, e-pošta), `05-studij-kode-3-stranke-ledger-tokovi.md` (stranke, ledger, tokovi) in `06-napake-popravi-pred-zagovorom.md`.*
