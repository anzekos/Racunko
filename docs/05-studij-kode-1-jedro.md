# Študij kode 1/3 – jedro: konfiguracija, baza, avtentikacija, podatkovna plast, API

> Cilj: **razumeti vsako vrstico**, ne le »kaj dela«, ampak *zakaj je tam, kaj se zgodi brez nje in kje jo komisija lahko ujame*. Beri v tem vrstnem redu, z odprto datoteko ob strani. Ob koncu vsakega poglavja je **samopreverjanje** (odgovori so v `04-komisija-strogi-zagovor.md`).
>
> Legenda: `📄 datoteka:vrstice` = kje si; **Zakaj** = razlog; **Če odstraniš** = kaj se zlomi; ⚠️ = past za zagovor.

---

## 0. Pojmi, ki se ponavljajo (nauči se enkrat)

| Pojem | Kaj pomeni v tej aplikaciji |
|---|---|
| `"use client"` | Prva vrstica datoteke → komponenta se izvaja v brskalniku (lahko uporablja `useState`, `localStorage`, `window`). Brez tega je v App Routerju komponenta **strežniška** in hooki ne delujejo. `layout.tsx` in vse `route.ts` te vrstice nimajo. |
| `export async function GET/POST/PUT/DELETE` | V `route.ts` ime funkcije = HTTP metoda. Next sam usmeri `GET /api/invoices` v `GET()` iz `app/api/invoices/route.ts`. `[id]` v imenu mape = dinamični segment → `params.id`. |
| `NextResponse.json(obj, { status })` | Vrne JSON odgovor; privzet status 200. |
| `await request.json()` | Prebere telo zahteve kot JSON (vrže napako, če ni veljaven JSON → ujame `catch` → 500). |
| `useState(x)` | Lokalno stanje komponente; `setX(...)` sproži ponovni izris. `setX(prev => ...)` = funkcijska oblika, varna pri več zaporednih posodobitvah. |
| `useEffect(fn, [deps])` | `fn` se izvede po izrisu, ko se spremeni katera od `deps`; `[]` = enkrat ob montaži; vrnjena funkcija = čiščenje (ob odmontaži ali pred naslednjim zagonom). Ne sme biti `async` – zato se uporablja notranja `async` funkcija. |
| `useMemo(fn, deps)` / `useCallback(fn, deps)` | Shrani izračun/funkcijo, dokler se `deps` ne spremenijo; preprečuje nepotrebno delo in ponovne izrise otrok. |
| `a?.b` | Optional chaining: če je `a` `null/undefined`, vrne `undefined` namesto napake. |
| `a ?? b` | Nullish coalescing: `b` **le**, če je `a` `null` ali `undefined`. Razlika od `a \|\| b`, ki vzame `b` tudi pri `0`, `""`, `false`. ⚠️ V API-ju `data.VLG \|\| 0` pomeni: prazen niz → 0 (želeno); `paid_amount ?? 0` pa dovoli 0 kot vrednost. |
| `x!` | Non-null assertion: TypeScriptu obljubiš, da `x` ni `undefined`. Ob laži pade med izvajanjem. |
| `as any` / `as Customer[]` | Ročno »prepričevanje« tipa; izklopi preverjanje. Pri mysql2 rezultatih je nujno, ker vrača splošen tip. |
| `{ ...obj, k: v }` | Plitka kopija objekta z zamenjanim poljem. React zahteva **nov** objekt, da zazna spremembo. |
| `` `…${x}…` `` | Predlogni niz (template literal). |
| `Promise.all([a, b])` | Vzporedno čaka več obljub; rezultat je polje v istem vrstnem redu. |
| `try / catch / finally` | `finally` se izvede **vedno** (tudi po `return` ali `throw`) – uporabljeno za `connection.release()` in `setLoading(false)`. |
| `parseFloat`, `Number`, `toFixed(2)` | Niz→število; `toFixed` vrne **niz** z 2 decimalkama (zaokroži). `Number(x.toFixed(2))` = zaokroženo število. |
| `toLocaleString("de-DE", …)` | Formatira število z ločili (`1.234,56`). `toLocaleDateString("sl-SI")` → `15. 9. 2026`. |
| `Date` + `toISOString().split("T")[0]` | `2026-09-15T07:00:00.000Z` → `2026-09-15` (format za `<input type="date">`). ⚠️ `toISOString` je v UTC – ob polnoči lokalno lahko vrne prejšnji dan. |
| `localStorage` | Trajni ključ-vrednost shramba brskalnika; obstaja le v brskalniku (zato preverjanje `typeof window`). |
| `fetch(url, { method, headers, body })` | HTTP klic; `response.ok` = status 200–299; `response.json()` prebere telo. |
| `Blob`, `URL.createObjectURL`, `<a download>` | Način, kako brskalnik »prenese« datoteko, ki je nastala v JS-u ali prišla z `fetch`. |
| Tailwind razredi (`flex`, `p-6`, `text-sm`, `print:hidden`, `bg-[#f8ecec]`) | Pomožni CSS razredi; `print:` = velja samo pri tisku; `[#hex]` = poljubna vrednost. |
| `cn(...)` | `lib/utils.ts:4-6` – združi razrede (`clsx`) in reši konflikte Tailwinda (`twMerge`: `p-2 p-4` → `p-4`). |

---

## 1. Konfiguracija projekta

### 📄 `package.json`
- `"scripts"`: `dev` (razvojni strežnik s hot-reload), `build` (produkcijska gradnja), `start` (zagon zgrajene aplikacije), `lint`.
- Ključne odvisnosti, ki jih **dejansko** uporabljaš in moraš znati opisati:
  - `next ^15.5.7`, `react ^18.3.1` – ogrodje (App Router).
  - `mysql2 ^3.15.1` – gonilnik MySQL s Promise API-jem in bazenom povezav (`mysql2/promise`).
  - `jsonwebtoken ^9.0.2` – izdaja in preverjanje JWT (HS256 z `JWT_SECRET`).
  - `bcryptjs ^3.0.2` – čisti JS bcrypt (brez native kompilacije; zato `bcryptjs` in ne `bcrypt` – deluje na deljenem gostovanju).
  - `jspdf ^2.5.1` + `html2canvas ^1.4.1` – rezervna PDF pot v brskalniku (slika → PDF).
  - `playwright ^1.51.1` – strežniška PDF pot (Chromium »print to PDF«). ⚠️ V `package-lock.json` **manjka** (`npm ci` javi »Missing: playwright from lock file«) – na gostovanju, ki uporablja `npm ci`, gradnja pade; popravek: `npm install` in commit lock datoteke.
  - `lucide-react` – ikone. `clsx`, `tailwind-merge`, `class-variance-authority` – za `cn()` in variante gumbov. `@radix-ui/*` – dostopne primitivne komponente pod shadcn/ui. `tailwindcss ^4`, `@tailwindcss/postcss`, `tw-animate-css` – stili.
  - `next-themes`, `sonner`, `recharts`, `zod`, `react-hook-form`, `date-fns`, `embla-carousel-react`, `vaul`, `cmdk`, `input-otp`, `react-resizable-panels`, `react-day-picker`, `@vercel/analytics`, `geist` – **neuporabljene** (predloga). `zod` je edina, ki bi jo bilo vredno začeti uporabljati (validacija API-ja).
- `devDependencies`: `typescript`, `@types/*` (tipi za Node, React, jsonwebtoken, bcryptjs, jspdf), `postcss`, `autoprefixer`.

### 📄 `tsconfig.json`
- `"strict": true` – strogi tipi (a se med gradnjo ignorirajo, glej spodaj).
- `"paths": { "@/*": ["./*"] }` – alias `@/lib/database` → `./lib/database`. Vrstica 32 `"@/contexts/*": ["./contexts/*"]` kaže na mapo, ki **ne obstaja** (konteksti so v `app/contexts`) – ostanek.
- `"jsx": "preserve"`, `"moduleResolution": "bundler"` – Next/SWC skrbi za prevajanje; `"plugins": [{ "name": "next" }]` doda Next tipe (`params`, `Metadata`).
- `"include"` zajame vse `.ts/.tsx` – tudi mrtvo kodo v `components/ui`.

### 📄 `next.config.mjs`
```js
eslint: { ignoreDuringBuilds: true },   // 3-5: lint napake ne ustavijo `next build`
typescript: { ignoreBuildErrors: true },// 6-8: tipne napake ne ustavijo gradnje  ⚠️ skrije F1, F2, F7 iz 04
images: { unoptimized: true },          // 9-11: <Image> ne gre skozi Next optimizator (potrebno pri statičnem izvozu / gostovanju brez Image Optimization API-ja)
```
**Zakaj `unoptimized`:** Next-ov optimizator slik zahteva strežniško funkcijo; na preprostem gostovanju ali pri `output: 'export'` je ni. Posledica: `<Image fill>` je le ovoj okoli `<img>` s CSS-om – logotip se naloži tak, kot je v `public/images`.

### 📄 `components.json`
Konfiguracija shadcn/ui CLI: slog `new-york`, barvna osnova `neutral`, CSS spremenljivke, aliasi. Ta datoteka pove, da so `components/ui/*` generirane s `npx shadcn add …`.

### 📄 `.gitignore`
`node_modules`, `.next`, `.env*` (⚠️ zato v repozitoriju ni nobene skrivnosti – povej, katere spremenljivke so potrebne: `DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, ADMIN_USERNAME, ADMIN_PASSWORD_HASH, JWT_SECRET`, opcijsko `DB_CONNECTION_LIMIT, DB_CONNECT_TIMEOUT_MS, DB_QUEUE_LIMIT, DB_QUERY_TIMEOUT_MS, DB_SLOW_QUERY_WARN_MS`), `*.tsbuildinfo`, `next-env.d.ts`.

### 📄 `app/globals.css` (in podvojen `styles/globals.css`)
- 1-2: `@import "tailwindcss"` (Tailwind v4 – brez `tailwind.config.js`), `tw-animate-css`.
- 4: `@custom-variant dark` – temna tema prek razreda `.dark` (ni vklopljena, `ThemeProvider` se ne uporablja).
- 6-40: `:root` z barvami v **oklch** zapisu (`--background: oklch(1 0 0)` = bela; `--primary: oklch(0.205 0 0)` = skoraj črna; `--border: oklch(0.922 0 0)` svetlo siva). ⚠️ To je vir težave s html2canvas (ne razume oklch) → `convertOklchToHex`.
- 77-115: `@theme inline` preslika spremenljivke v Tailwind razrede (`bg-background`, `text-muted-foreground`, `border-border`, `bg-chart-3`…).
- 117-124: `@layer base` – vsi elementi dobijo `border-border`, `body` ozadje/besedilo.
- 126-148: drsnik po meri, `transition: colors 0.2s` na vseh elementih.

### 📄 `app/layout.tsx` (korenska postavitev – strežniška komponenta)
| Vrstice | Kaj | Zakaj |
|---|---|---|
| 1 | `import { AuthProvider }` | Celotna aplikacija je znotraj konteksta prijave. |
| 3, 6-14 | `Geist`, `Geist_Mono` iz `next/font/google` z `variable` | Next pisave prenese ob gradnji in jih streže sam (brez zahtev na Google ob izvajanju); `--font-geist-sans` je CSS spremenljivka, `antialiased` glajenje. |
| 16-23 | `metadata` | `<title>`, `description`, favicon `/images/logo-black.png`; `generator: 'v0.app'` ⚠️ (A1). |
| 25-38 | `RootLayout({ children })` | `<html lang="sl">` (jezik za bralnike zaslona/črkovanje), `<body className="font-sans">`, **`<AuthProvider>{children}</AuthProvider>`** – vsaka stran (tudi `/login` in `/invoices/print/[id]`) je pod njim. |

**Če odstraniš `AuthProvider`:** `useAuth()` vrže »useAuth must be used within an AuthProvider« (`AuthContext.tsx:132-134`).

---

## 2. Podatkovna baza

### 📄 `scripts/01-create-database.sql`
- 1: `CREATE DATABASE` zakomentiran – bazo ustvari gostovanje. 2: `USE kmzavo48_stranke_db;` (predpona uporabnika cPanel).
- 4-68: `CREATE TABLE IF NOT EXISTS Stranka` – 62 stolpcev. Skupine, ki jih moraš znati **po pomenu**:
  - Identiteta: `Stranka` (naziv), `Naslov`, `Kraj_postna_st`, `email`, `ID_DDV` (davčna, npr. `SI12345678`).
  - Projekt: `Ukrep` (vrsta razpisa), `JR` (javni razpis), `Pogodba`.
  - **VLG** = vloga (honorar za pripravo vloge), `VLG_z_DDV` (= VLG × 1,22), `Gotovina_1`, `Status_1`, `Racun_izdal_1`, `Opomba_Ponudba`, `Provizija` (delež, npr. 0.15).
  - **ODL** = odločba (odobrena sredstva), `ODL_z_DDV`, `Gotovina_2`, `Status_2`, `Racun_izdal_2`, `Delež_odločba`, `ODL_izplacano`.
  - **ZAH1…ZAH5** = zahtevki za izplačilo (obroki), vsak s `_z_DDV`, `Gotovina_3..7`, `Status_3..7`, `Racun_izdal_3..7`, `Delež_zah1..5`, `ZAH1..5_izplacano`.
  - Povzetek: `Izplacano` (Σ izplačil), `SKUPAJ` (Σ ODL+ZAH1..5), `KONTROLA` (VLG + Izplacano × Provizija), `Status_8`, `Informacije`.
  - Tipi: `DECIMAL(10,2) DEFAULT 0` za zneske (točna decimalna aritmetika v bazi), `VARCHAR(255)` za besedila, `TEXT` za opombe. Ni `NOT NULL`, ni indeksov razen PK.
- ⚠️ Stolpci `Delež_odločba` vsebujejo šumnike v imenu – deluje v MySQL z utf8, a je nerodno (v SQL jih je treba citirati z `` ` ``).

### 📄 `scripts/02-seed-sample-data.sql`
Trije testni zapisi (`USE stranke_db` – drugačno ime baze kot v 01 ⚠️ nedoslednost).

### Tabele dokumentov (niso v repozitoriju – rekonstrukcija iz poizvedb)
`Invoices`, `InvoiceItems`, `Offers`, `OfferItems`, `CreditNotes`, `CreditNoteItems`. Stolpce preberi iz `app/api/invoices/route.ts:10-35` in `:114-118`. Referenčni DDL je v `04`, E13. **Dodaj ga v `scripts/03-…sql`** pred zagovorom.

### 📄 `lib/db-connection.ts` (62 vrstic – nauči se na pamet)
| Vrstice | Koda | Razlaga |
|---|---|---|
| 1 | `import mysql from 'mysql2/promise'` | Promise različica (deluje z `await`), ne callback različica. |
| 3 | `let pool: mysql.Pool \| null = null` | **Singleton na ravni modula.** Modul se v Node naloži enkrat na proces → en bazen za vse zahteve. Če bi `createPool` klical v vsaki `route.ts`, bi nastalo N bazenov in baza bi presegla `max_connections`. |
| 5-10 | `getNumberEnv(name, fallback)` | Prebere okoljsko spremenljivko kot število; `Number.isFinite` zavrne `NaN` (npr. `"abc"`) in `Infinity`. |
| 12-35 | `getPool()` | **Leno ustvarjanje** (lazy init): bazen nastane ob prvi poizvedbi, ne ob uvozu modula (uvoz se zgodi tudi pri gradnji, ko baze ni). |
| 14-15 | `isServerless` | Zazna Vercel/AWS Lambda/Azure Functions. Tam vsaka instanca funkcije drži svoj bazen → majhen limit (3), da 20 instanc ne odpre 200 povezav. |
| 17-18 | `connectionLimit`, `connectTimeout` | 3/10 povezav; 30 s za vzpostavitev povezave (deljeno gostovanje je lahko počasno). |
| 20-32 | `mysql.createPool({...})` | `host/user/password/database/port` iz okolja (`Number(process.env.DB_PORT) \|\| 3306`); `waitForConnections: true` = ko so vse zasedene, zahteva **čaka** (ne pade); `queueLimit: 0` = neomejena čakalna vrsta; `enableKeepAlive` + `keepAliveInitialDelay: 10000` = TCP keep-alive po 10 s, da gostovanje/požarni zid ne prekine mirujočih povezav (tipična napaka »ECONNRESET« po nekaj minutah). |
| 37-39 | `getConnection()` | Izposodi eno povezavo (uporabljeno v `test-db`; potrebna za transakcije). |
| 41-62 | `query(sql, params?)` | Glej `04` C1. Tok: vzemi povezavo → `execute` (prepared statement, `?` parametri) → vrni `results` → ob napaki logiraj in **vrzi naprej** (klicatelj vrne 500) → `finally`: izmeri čas, opozori nad 1,5 s, **vedno** `release()`. |

**Če odstraniš `connection.release()`:** po `connectionLimit` poizvedbah aplikacija obvisi (vse čakajo v vrsti). **Če odstraniš `throw error`:** funkcija vrne `undefined`, `result.length` vrže `TypeError` v klicatelju – napaka se zamegli.

**Kaj `execute` vrne:** za `SELECT` polje vrstic (`RowDataPacket[]`), za `INSERT/UPDATE/DELETE` `ResultSetHeader` z `insertId`, `affectedRows`. Ker je tip `any`, koda dela `result.length` (SELECT) in `result.insertId` (INSERT) brez pritožb TypeScripta.

---

## 3. Avtentikacija

### Celoten tok (nauči se kot zgodbo)
1. Uporabnik na `/login` vpiše ime in geslo → `POST /api/auth/login`.
2. Strežnik primerja ime z `ADMIN_USERNAME`, geslo z `bcrypt.compare` proti `ADMIN_PASSWORD_HASH`, izda JWT (30 dni).
3. Brskalnik shrani žeton v `localStorage.token`, `AuthContext.login` nastavi `user` in preusmeri na `/`.
4. Ob vsaki navigaciji `AuthContext.checkAuth` pošlje žeton na `POST /api/auth/verify`; strežnik ga preveri s `jwt.verify`.
5. `ProtectedRoute` (na `/` in `/customers`) pokaže vrtavko, dokler `loading`, in `null` + preusmeritev, če `user` ni.
6. Odjava: pobriše `localStorage`, `user = null`, na `/login`. ⚠️ Žeton ostane veljaven.
7. ⚠️ **Podatkovne API poti žetona ne preverjajo.** Zaščita je le v brskalniku.

### 📄 `scripts/generate-hash.js`
`readline` vprašanje »Vnesi geslo:« → `bcrypt.hashSync(password, 10)` → izpiše hash (`$2b$10$…`, 60 znakov, vsebuje sol). Ta hash gre v `ADMIN_PASSWORD_HASH`. Cost 10 = 2^10 iteracij (~100 ms). Git: »Refactor password input to use readline interface« – prej je bilo geslo trdo v datoteki.

### 📄 `app/api/auth/login/route.ts`
| Vrstice | Razlaga |
|---|---|
| 7 | Destrukturiranje `{ username, password }` iz JSON telesa. |
| 9 | ⚠️ `console.log` uporabniškega imena – v produkciji odstrani (dnevniki). |
| 11-21 | Tri okoljske spremenljivke; če katera manjka → 500 z generičnim sporočilom (ne razkrije, katera). |
| 24-30 | Napačno ime → 401 z **istim** sporočilom kot napačno geslo (ne razkrije, ali ime obstaja). ⚠️ Vendar: `bcrypt.compare` se izvede le pri pravilnem imenu → po **času odziva** je mogoče ugotoviti pravilno ime (timing side channel). Popravek: vedno primerjaj hash (npr. z lažnim hashem). |
| 33 | `await bcrypt.compare(password, hash)` – bcrypt iz hasha prebere sol in cost, ponovno hashira vnos in primerja v konstantnem času. |
| 44-52 | `jwt.sign(payload, secret, { expiresIn: "30d" })` – payload `{ username, role: "admin", timestamp }` (timestamp je odveč – JWT ima `iat`). Podpis HS256 (HMAC-SHA256) s `JWT_SECRET`. Kdor pozna skrivnost, lahko izda poljuben žeton → skrivnost mora biti dolga in naključna. |
| 56-60 | Odgovor `{ success, token, user }`. |
| 61-67 | Vsaka druga napaka → 500. |

### 📄 `app/api/auth/verify/route.ts`
- 7-15: obilo `console.log` (odpravljanje napak; ⚠️ vrstica 15 logira prvih 20 znakov žetona – odstrani).
- 11: `{ token } = await request.json()` – žeton iz **telesa** (ne iz `Authorization` glave, ki jo `AuthContext` tudi pošlje).
- 33-50: `jwt.verify(token, secret)` preveri podpis **in** potek (`exp`); ob napaki (`TokenExpiredError`, `JsonWebTokenError`) vrne 401 `{ valid: false }`. Uspeh: `{ valid: true, user: { username, role } }` iz dekodiranega payloada.
- 60-63: `GET` vrne 405 – dodano, ker je nekaj (prefetch/ročni obisk) klicalo GET in polnilo dnevnik.

### 📄 `app/contexts/AuthContext.tsx`
| Vrstice | Razlaga |
|---|---|
| 1 | `"use client"` – uporablja hooke in `localStorage`. |
| 6-16 | Tipa `User` in `AuthContextType` (`user`, `loading`, `login`, `logout`). |
| 18 | `createContext<AuthContextType \| undefined>(undefined)` – privzeto `undefined`, da `useAuth` zazna uporabo zunaj providerja. |
| 21-24 | Stanje `user`, `loading` (začne `true` → strani najprej pokažejo vrtavko), `router`, `pathname`. |
| 26-29 | `useEffect(() => checkAuth(), [pathname])` – preverjanje ob montaži in ob vsaki spremembi poti. |
| 31-36 | `getBaseUrl()` – `window.location.origin` (absolutni URL). Relativni `/api/auth/verify` bi deloval enako; absolutni je ostanek odpravljanja težave (verjetno pri gostovanju s podmapo/proxyjem). |
| 38-107 | `checkAuth` – glej `04` C3. Ključno: tri izhodne poti (brez žetona / neveljaven / napaka) vse končajo na `/login`, `finally` ugasne `loading`. |
| 109-114 | `login(token, userData)` – shrani žeton, nastavi uporabnika, `router.push("/")`. |
| 116-121 | `logout()` – briše žeton, `user = null`, na `/login`. |
| 123-127 | `Provider value={{ user, loading, login, logout }}` – ⚠️ nov objekt ob vsakem izrisu → vsi porabniki se ponovno izrišejo (pri tej velikosti ni težava; sicer `useMemo`). |
| 130-136 | `useAuth()` – ovoj okoli `useContext` z jasno napako. |

### 📄 `components/ProtectedRoute.tsx`
- 11-15: `useEffect`: ko `loading` konča in `user` ni → `/login`. Odvisnosti `[user, loading, router]`.
- 17-26: med `loading` vrtavka (`animate-spin`, `border-b-2` = samo spodnji rob obarvan → videz krožnega nalagalnika).
- 28-30: `!user` → `null` (nič ne izriše, medtem ko preusmeritev teče).
- 32: sicer `children`.
- ⚠️ Uporabljen le na dveh straneh (`04` B18). Strani računov se ob odsotnosti žetona za trenutek izrišejo (brez podatkov, ker API vrne prazne sezname?) – ne: API **vrne podatke** tudi brez žetona. Strani se izrišejo s podatki, nato `checkAuth` preusmeri. To je vidna varnostna luknja pri demonstraciji.

### 📄 `app/login/page.tsx`
- 12-16: stanje `username`, `password`, `error`, `loading`; `login` iz konteksta. (`useRouter` je uvožen, a neuporabljen.)
- 26-55: `handleSubmit`: `e.preventDefault()` (brez tega bi brskalnik ponovno naložil stran), `setLoading(true)`, `fetch` POST z JSON, ob `response.ok` → `login(data.token, data.user)`, sicer `setError(data.error)`; `catch` → »Napaka pri povezavi s strežnikom«; `finally` → `setLoading(false)`.
- 57-118: obrazec: `<Alert variant="destructive">` za napako; `<Input required autoComplete="username"/"current-password">` (upravljalniki gesel); gumb `disabled={loading}` z besedilom »Prijavljanje…«.
- ⚠️ Ni CSRF zaščite (ni potrebna pri JWT v `localStorage`, bi pa bila pri piškotku), ni omejitve poskusov (rate limiting) – bcrypt to delno blaži.

---

## 4. Podatkovna plast (odjemalec)

### 📄 `lib/utils.ts`
- 4-6 `cn` (glej pojme). 8-11 `parseLocaleNumber(value)`: ni niz → `NaN`; `trim()`, **prva** vejica → pika, `parseFloat`. `parseFloat("1,5".replace)` = 1.5; `"abc"` → `NaN` (klicatelj to pretvori v 0). ⚠️ `"1.234,56"` → `"1.234.56"` → `1.234`.

### 📄 `lib/database.ts` (468 vrstic)
**Vloga:** (1) skupni **tipi** za odjemalec in strežnik, (2) tanek ovoj okoli `fetch` za vsak API. Nobena funkcija tu ne dostopa do baze neposredno (kljub imenu) – uvoz `query` v vrstici 2 je neuporabljen. ⚠️ Ker je datoteka uvožena v odjemalske komponente, bi uvoz `mysql2` prek `./db-connection` v teoriji lahko prišel v brskalnik; Next ga izloči (tree-shaking), a je pravilneje uvoz odstraniti.

| Vrstice | Razlaga |
|---|---|
| 4-10 | ⚠️ Podvojeni `type SavedOffer`/`SavedCreditNote` (F7). Odstrani. |
| 13-77 | `Customer` – vsa polja opcijska (`?`), ker obrazec gradi objekt postopoma (`Partial`) in API vrača `SELECT *`. Imena polj = imena stolpcev (`Stranka`, `ID_DDV`…) – zato v kodi mešanica `PascalCase/snake_case` in `camelCase`. |
| 79-84 | `InvoiceItem { description, quantity, price, total }` – `total` se hrani (ne računa) → v bazi je zapisano, kar je bilo na računu. |
| 86-101 | `Invoice`: `id?: string`; `customer: Customer` (cel objekt, API uporabi le `customer.id`); datumi kot **nizi** `YYYY-MM-DD`; `totalWithoutVat/vat/totalPayable`; ledger polja `paidAmount?`, `unpaidAmount?`, `notes?`. |
| 103-107 | `SavedInvoice extends Invoice` + `status` unija + `createdAt/updatedAt`. Razlika `Invoice` vs `SavedInvoice`: pred/po shranjevanju (zato `'id' in invoice` preverjanja v e-pošti). |
| 109-147 | `Offer/SavedOffer`, `CreditNote/SavedCreditNote` – kopije z drugim imenom številke in statusi (`accepted/rejected` pri ponudbi). |
| 150-161 | `fetchCustomers()` – ⚠️ ob napaki **vrne `[]`** in ne vrže (druge `fetch*` funkcije vržejo). Posledica: obrazec računa ob padli bazi pokaže prazno avtodopolnjevanje brez napake. |
| 163-203 | `createCustomer`, `updateCustomer` – POST/PUT z JSON, ob `!ok` vržejo; ⚠️ `app/customers/page.tsx` ju **ne uporablja** (kliče `fetch` neposredno, 882-903). |
| 206-221 | `saveInvoice` – POST; ob napaki prebere `{ error }` iz telesa (npr. »Račun s to številko že obstaja«) in ga vrže kot `Error` → stran pokaže `alert`. ⚠️ Stran `invoices/page.tsx:97` pokaže **generično** sporočilo, ne `error.message` – uporabnik ne vidi, da je številka podvojena. |
| 223-268 | `fetchInvoices`, `fetchInvoiceById`, `updateInvoice`, `deleteInvoice` – vzorec: `fetch` → `if (!ok) throw` → `json()`. |
| 270-287 | `updateInvoiceStatus(id, status)` – PUT `/status` z `{ status }`. Ista funkcija je podvojena v `lib/email-service.ts:20-37`. |
| 290-455 | Isto za ponudbe in dobropise (kopije). |
| 457-468 | `updateInvoicePayment(id, paidAmount, notes)` – telo `{ paid_amount, notes }` (**snake_case**, ker ga je pisal isti dan kot API, po imenih stolpcev). |

**Vzorec, ki ga moraš znati napisati na pamet:**
```ts
export async function fetchX(): Promise<T[]> {
  const response = await fetch('/api/x')
  if (!response.ok) throw new Error('Napaka pri nalaganju')
  return response.json()
}
```

---

## 5. API poti (strežnik)

### Skupni vzorec vsake `route.ts`
```ts
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db-connection'
export async function METODA(request: NextRequest, { params }: { params: { id: string } }) {
  try { ...query(...)...; return NextResponse.json(rezultat) }
  catch (error) { console.error(...); return NextResponse.json({ error: '...' }, { status: 500 }) }
}
```
⚠️ V Next 15 je `params` **Promise** (`const { id } = await params`). Koda ga bere sinhrono (`params.id`) – deluje z opozorilom v Next 15.x zaradi združljivosti; tipska napaka je skrita. Če nadgradiš na Next 16, se zlomi. Komisija za Next to rada vpraša.

### 📄 `app/api/invoices/route.ts`
**GET (6-94):** ena poizvedba (9-40) z dvema `LEFT JOIN` (stranka lahko manjka → NULL; postavke lahko manjkajo). Izbrani stolpci so poimenovani z aliasi `item_*`, da se ne pomešajo `i.id` in `ii.id`. Sestavljanje 43-84 (`04` C2). 86: `Array.from(map.values())` → JSON polje računov.

**POST (97-157):**
| Vrstice | Razlaga |
|---|---|
| 99 | Telo = objekt `Invoice` iz obrazca (z `customer` objektom, `items`). Ni validacije (⚠️ `04` E3). |
| 101-111 | Podvojena številka → 400 (⚠️ ni atomarno, F17). |
| 113-130 | `INSERT INTO Invoices (...) VALUES (?,…,'draft')` – status vedno `draft`; `serviceDescription \|\| ''` (NULL → prazen niz). Zneski pridejo kot JS `number` → MySQL zaokroži na 2 decimalki ob zapisu v `DECIMAL(10,2)`. |
| 132 | `result.insertId` – nov ID. |
| 134-141 | Zanka `for…of` z `await` v vsaki iteraciji → N poizvedb zaporedno (pri 3–5 postavkah sprejemljivo). Alternativa: en `INSERT … VALUES (?,?,?,?,?),(…)` z `query` in gnezdenim poljem. ⚠️ Brez transakcije (`04` E2). |
| 143-149 | Vrne vhodni objekt + `id`, `status`, `createdAt/updatedAt` (⚠️ časi so **strežnikovi JS** časi, ne tisti iz baze – majhna razlika). |

### 📄 `app/api/invoices/[id]/route.ts`
- **GET (11-74):** dve poizvedbi (glava z JOIN na stranko; postavke). `i.*` vrne vse stolpce v `snake_case`, koda jih ročno preslika v `camelCase` (36-66). ⚠️ Ročna preslikava je na treh mestih (GET vseh, GET enega, ponudbe/dobropisi) – pomanjkljivost: ena funkcija `mapInvoiceRow(row)` bi odpravila 6 kopij.
- **PUT (76-129):** `UPDATE` glave (80-104; `status` se **ne** spreminja tu – ima svojo pot), `DELETE` postavk (106), ponovni `INSERT` (108-115), odgovor `{...invoice, id, updatedAt}`. ⚠️ Ne preveri, ali račun obstaja (0 `affectedRows` → še vedno 200). ⚠️ Ne preveri podvojene številke pri preimenovanju.
- **DELETE (131-142):** `DELETE FROM Invoices WHERE id = ?` – postavke odvisne od FK (`04` D6).

### 📄 `app/api/invoices/[id]/status/route.ts`
- 16-22: bela lista statusov → 400 »Neveljaven status«. Edina validacija vnosa v celotnem API-ju – dober zgled, ki ga citiraš.
- 24-27: `UPDATE … SET status = ?, updated_at = NOW()` – `NOW()` je čas **baze**.

### 📄 `app/api/invoices/[id]/payment/route.ts`
- 10: `{ paid_amount, notes }`; 12-15: `UPDATE … paid_amount = ?, notes = ?, updated_at = NOW()`; `paid_amount ?? 0`, `notes ?? ''` (`??`, da je `0` dovoljen). Ni preverjanja, da je `paid_amount` število ali ≤ `total_payable` (ledger dovoli preplačilo; `unpaid` se v UI reže z `Math.max(0, …)`).

### 📄 `app/api/invoices/[id]/pdf/route.ts` (strežniški PDF)
| Vrstice | Razlaga |
|---|---|
| 2 | `import { chromium } from "playwright"` – pravi Chromium (potrebuje `npx playwright install chromium` na strežniku + sistemske knjižnice). |
| 11-12 | `runtime = "nodejs"` (ne Edge – Playwright potrebuje Node), `dynamic = "force-dynamic"` (nikoli predpomni). |
| 14-16 | `safeFilenamePart` – odstrani znake, prepovedane v imenih datotek (Windows), stisne presledke. |
| 20-35 | Poizvedba le za `invoice_number` in `Stranka` (za ime datoteke); 404, če ni. |
| 37-38 | `origin` iz zahteve (`https://domena`) + pot do **print** strani (brez menija). ⚠️ Za reverse proxy mora `origin` biti javno dosegljiv s strežnika samega (loopback). |
| 40-42 | Zagon brskalnika za **vsako** zahtevo (≈ 0,5–1 s); `newPage`. Optimizacija: en `browser` v singletonu kot `pool`. |
| 43 | `goto(waitUntil: "networkidle")` – čaka, da ≥ 500 ms ni omrežnih zahtev (React je naložil podatke). |
| 44 | `waitForSelector("#invoice-preview-content", visible, 30 s)` – ID iz `invoice-preview.tsx:140`. ⚠️ Auth preusmeritev (`04` C8). |
| 45 | `emulateMedia({ media: "print" })` – aktivira `@media print` pravila in `print:hidden`. |
| 48-63 | V brskalniku: počakaj `document.fonts.ready` in vse `<img>` (`complete` ali dogodek `load/error`, `{ once: true }`). `// @ts-expect-error` je tu **neuporabljen** (TS napaka »Unused directive«). |
| 65-70 | `page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, margin 10 mm })` – `printBackground` je nujen za barvne glave tabele (`bg-[#f8ecec]`). |
| 72 | Ime `"{številka} {stranka}.pdf"`, rezerva `racun.pdf`. |
| 74-81 | `new NextResponse(pdf, { headers })` – `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="…"` (⚠️ šumniki v `filename=` niso RFC-varni; pravilno `filename*=UTF-8''…`), `Cache-Control: no-store`. |
| 82-84 | `finally { await browser.close() }` – brez tega bi vsak klic pustil živ Chromium proces (100+ MB). |

### 📄 `app/api/offers/**` in `app/api/credit-notes/**`
Kopije z zamenjanimi imeni (`o.`/`oi.`/`Offers`/`OfferItems`/`offer_number`; `cn.`/`cni.`/`CreditNotes`/…). **Razlike, ki jih moraš znati:**
1. `offers/[id]/status`: statusi `draft, sent, accepted, rejected`; dobropisi `draft, sent, paid, cancelled` (kot računi).
2. `offers/[id]/route.ts` DELETE (129-145) briše najprej `OfferItems`, nato `Offers`, in v napako vključi `error.message`. Računi/dobropisi brišejo le glavo.
3. `offers/[id]/pdf` in `credit-notes/[id]/pdf` odprejo `/offers/view/…` oz. `/credit-notes/view/…` (strani z menijem), selektor `#offer-preview-content` / `#credit-note-preview-content`; ime datoteke **brez** `.pdf`.
4. GET seznama pri ponudbah/dobropisih **ne** vrača `paid_amount/notes` (le računi imajo ledger).

### 📄 `app/api/customers/route.ts` in `[id]/route.ts`
- GET vseh: `SELECT * FROM Stranka ORDER BY id DESC` (najnovejše prve). `as Customer[]` – tipiziranje rezultata.
- POST (21-64): `INSERT` **15 stolpcev** (`Stranka … Provizija`); `data.X || null` za besedila (prazen niz → NULL), `data.VLG || 0` za zneske. Po vstavljanju `SELECT * WHERE id = insertId` → vrne shranjeni zapis (201 Created). ⚠️ F4: ODL/ZAH/… se ne shranijo.
- PUT (32-81): `UPDATE` istih 15 stolpcev; ⚠️ tu besedila **brez** `|| null` → `undefined` v parametrih → mysql2 vrže »Bind parameters must not contain undefined« (če polje v telesu manjka). Stran vedno pošlje cel objekt, zato ne pade – a je krhko.
- DELETE (84-98): `DELETE FROM Stranka WHERE id = ?` – usoda računov te stranke odvisna od FK (`04` G10).
- ⚠️ `details: error.message` v vseh `catch` (F15).

### 📄 `app/api/test-db/route.ts`
`getConnection()` → `SELECT 1 + 1 AS result` → `release()`; ob napaki vrne `error.message` in katere `DB_*` spremenljivke obstajajo (ne vrednosti). Diagnostika ob namestitvi. ⚠️ Javno dostopno – po namestitvi odstrani ali zaščiti.

### 📄 `app/api/send-email/route.ts`
Simulacija (1 s zamik, `console.log`). Nikjer klicana. Pripravljeno mesto za Resend/SendGrid/Nodemailer.

---

## Samopreverjanje (poglavja 1–5)

1. Zakaj je `pool` deklariran z `let` na vrhu modula in ne znotraj `getPool`?
2. Kaj se zgodi, če `DB_PORT` ni nastavljen? Kaj, če je `"abc"`?
3. Napiši po spominu funkcijo `query` (10 vrstic) in razloži `finally`.
4. Kateri dve stvari preverja `jwt.verify` in katere napake vrže?
5. Zakaj `bcrypt.compare` in ne primerjava `hash === bcrypt.hash(password)`? (sol je naključna → drug hash vsakič)
6. Kje se `loading` v `AuthContext` nastavi na `false` in zakaj v `finally`?
7. Koliko vrstic vrne JOIN poizvedba za 2 računa s 3 in 0 postavkami? (4: 3 + 1 z `item_id = NULL`)
8. Zakaj so datumi v `Invoice` tipa `string`?
9. Kaj vrne `POST /api/invoices` ob neveljavnem JSON telesu? (500 – `request.json()` vrže, ujame zunanji `catch`)
10. Naštej vse vhodne validacije v API-ju. (samo bela lista statusov in preverjanje podvojene številke)
11. Zakaj `runtime = "nodejs"` v PDF poti?
12. Zakaj `Content-Disposition: attachment`?
13. Katerih 15 stolpcev shrani `POST /api/customers`? Katerih 47 ne?
14. Kaj bi se zgodilo, če bi `chromium.launch()` klical brez `finally { browser.close() }`?

*Nadaljuj z `05-studij-kode-2-ui-pdf-email.md`.*
