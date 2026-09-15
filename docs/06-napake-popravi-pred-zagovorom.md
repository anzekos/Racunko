# Napake in pomanjkljivosti – kaj popraviti pred zagovorom

> Vse spodaj je **preverjeno v kodi** (branje + `npx tsc --noEmit`). Razvrščeno po tem, kako verjetno te komisija ujame v živo. Vsak vnos ima: kje, kaj, posledica, popravek. Ta dokument je tudi tvoj »seznam priznanih pomanjkljivosti« za zagovor – kar popraviš, povej kot »odpravljeno«, kar ne, povej kot »znano, načrt: …«.

---

## Prioriteta 1 – sesutje ali izguba podatkov v živo (popravi obvezno)

### 1. Ogled plačanega računa se sesuje
- **Kje:** `app/invoices/view/[id]/page.tsx:9` (uvoz) in `:168` (uporaba `<XCircle />`).
- **Kaj:** `XCircle` ni uvožen iz `lucide-react`. `tsc`: `error TS2304: Cannot find name 'XCircle'`.
- **Posledica:** ko je `invoice.status === 'paid'`, React poskusi izrisati `XCircle` → `ReferenceError` → bela stran.
- **Popravek:** `import { ArrowLeft, Edit, Copy, CheckCircle, XCircle } from "lucide-react"`.

### 2. »Prenesi PDF« takoj po ustvarjanju ponudbe/dobropisa
- **Kje:** `app/offers/page.tsx:15` uvaža `downloadOfferPDFFromPreview, generateOfferPDFFromElement`, vrstica 126 kliče `downloadOfferPDF`. Enako `app/credit-notes/page.tsx:15/126` (`downloadCreditNotePDF`).
- **`tsc`:** `Cannot find name 'downloadOfferPDF'`, `Cannot find name 'downloadCreditNotePDF'`.
- **Popravek:** uvozi `downloadOfferPDF` (obstaja v `lib/pdf-generator-offer.ts:277`) oz. `downloadCreditNotePDF`; odstrani neuporabljena uvoza.

### 3. Podatki strank iz zavihkov Odločba/Zahtevki/Povzetek se ne shranijo
- **Kje:** `app/api/customers/route.ts:25-48` (INSERT), `app/api/customers/[id]/route.ts:39-65` (UPDATE) – le 15 stolpcev.
- **Posledica:** `ODL, ODL_z_DDV, Gotovina_2..7, Status_2..8, Racun_izdal_2..7, Delež_*, ZAH1..5, ZAH*_z_DDV, *_izplacano, Izplacano, SKUPAJ, KONTROLA, Informacije` se nikoli ne zapišejo. UI jih pokaže do osvežitve (lokalna posodobitev `customers/page.tsx:889`).
- **Popravek:** dinamičen `UPDATE/INSERT` z belo listo stolpcev (`04` E11). Pri INSERT enako: `INSERT INTO Stranka (\`a\`,\`b\`) VALUES (?,?)`.

### 4. Urejanje dokumenta ponastavi valuto
- **Kje:** `components/invoice-form.tsx:125-133` (in `offer-form.tsx:60-67`, `credit-note-form.tsx:60-67`).
- **Kaj:** `useEffect([issueDate])` se sproži po nalaganju za urejanje in prepiše `dueDate`.
- **Popravek:** `04` E9 (računaj v `onChange` datuma izdaje, ne v efektu).

### 5. Podatkovni API je dostopen brez prijave
- **Kje:** vse `app/api/**` razen `auth`. Nobena pot ne bere žetona.
- **Posledica:** `curl https://…/api/customers` vrne vse stranke (osebni podatki, davčne številke); `POST/PUT/DELETE` prav tako brez prijave. `GET /api/test-db` razkrije nastavitve.
- **Popravek:** `middleware.ts` z `jose` (`04` E1) + `authFetch` v `lib/database.ts` + žeton za Playwright. Minimalna različica za zagovor: middleware + glava v `fetch` klicih.

### 6. `npm ci` pade – lock datoteka ni usklajena
- **Kje:** `package-lock.json` ne vsebuje `playwright` (dodan v `package.json` 13. 3.).
- **Kaj:** `npm ci` → »Missing: playwright@1.63.0 from lock file«. Gostovanja, ki uporabljajo `npm ci` (Vercel, CI), gradnje ne izvedejo.
- **Popravek:** `npm install` lokalno in commit posodobljenega `package-lock.json`.

---

## Prioriteta 2 – vidne napake ali nedoslednosti med demonstracijo

### 7. Strežniški PDF verjetno nikoli ne teče (auth preusmeritev)
- **Kje:** `app/api/invoices/[id]/pdf/route.ts:43-44` odpre `/invoices/print/{id}`, ki je pod `AuthProvider` → brez žetona `router.push('/login')`.
- **Preveri:** klik »Prenesi PDF« → Console: »Napaka pri prenosu PDF-ja: … HTTP 500« pomeni rezervno pot (raster). Odpri PDF: ali je tekst izbirljiv?
- **Popravek:** v `AuthContext.checkAuth` preskoči preverjanje za `pathname.startsWith('/invoices/print')` **in** strežniška pot naj strani posreduje enkratni žeton (npr. `?t=` podpisan z `JWT_SECRET`, veljaven 60 s), ki ga `print` stran pošlje API-ju; ali Playwright `context.addInitScript` z veljavnim žetonom. Za ponudbe/dobropise dodaj `print` strani (`app/offers/print/[id]`, `app/credit-notes/print/[id]`) in spremeni cilj v `offers/[id]/pdf/route.ts:38`.

### 8. Ime PDF datoteke brez `.pdf` pri ponudbah in dobropisih
- **Kje:** `lib/pdf-generator-offer.ts:195`, `lib/pdf-generator-credit-note.ts:195`, `app/api/offers/[id]/pdf/route.ts:72`, `app/api/credit-notes/[id]/pdf/route.ts:72-73`.
- **Popravek:** dodaj `.pdf` (kot `lib/pdf-generator.tsx:211`).

### 9. Vnos količine v obrazcu računa brez oznake in ovoja
- **Kje:** `components/invoice-form.tsx:316-328`.
- **Popravek:** ovij v `<div className="col-span-2 space-y-2"><Label>Količina</Label> … </div>` (kot `offer-form.tsx:243-256`).

### 10. `1.234,56` v obrazcu postane `1.234`
- **Kje:** `lib/utils.ts:8-11` `parseLocaleNumber` (zamenja le prvo vejico).
- **Popravek:** uporabi logiko `parseAmount` iz ledgerja (premakni jo v `lib/utils.ts` in izvozi):
```ts
export function parseLocaleNumber(value: string): number {
  if (typeof value !== 'string') return NaN
  let v = value.trim().replace(/\s/g, '')
  if (v.includes(',') && v.includes('.')) v = v.replace(/\./g, '').replace(',', '.')
  else if (v.includes(',')) v = v.replace(',', '.')
  return parseFloat(v)
}
```

### 11. Surove vrednosti postavk se zamaknejo ob brisanju
- **Kje:** `components/invoice-form.tsx:104,149` (`rawValues` po indeksu).
- **Popravek:** `04` E10.

### 12. Generično sporočilo ob podvojeni številki
- **Kje:** `app/invoices/page.tsx:97` (`alert("Napaka pri shranjevanju računa…")`), čeprav `saveInvoice` vrže `Error("Račun s to številko že obstaja")`.
- **Popravek:** `alert((error as Error).message)`.

### 13. Dvojni `useEffect` na `searchParams` in prenos vseh računov za urejanje
- **Kje:** `app/invoices/page.tsx:35-40` + `:114-124`, `loadInvoiceForEdit` 58-69 (enako ponudbe/dobropisi).
- **Popravek:** en efekt; `const found = await fetchInvoiceById(id)`; `setSaveAsMode(saveAsParam === 'true')` **po** nastavitvi `editingInvoice`.

### 14. Dvojna posodobitev statusa ob e-pošti s seznama
- **Kje:** `app/invoices/list/page.tsx:208-220` (in ponudbe/dobropisi).
- **Popravek:** kliči le `openEmailClient(invoice)` (ta status posodobi sam) in nato `loadInvoices()`.

### 15. Prenos s seznama vedno rasterski
- **Kje:** `app/invoices/list/page.tsx:165-192` (skriti predogled + html2canvas).
- **Popravek:** `handleDownload = (invoice) => downloadInvoicePDF(invoice)` – ima ID, gre skozi strežnik z rezervo. Skriti predogled ostane le za množični prenos (ali tudi tam zamenjaj z zaporednimi `fetch` klici na `/pdf`).

### 16. Prenos PDF pade, če je stranka izbrisana
- **Kje:** `app/invoices/list/page.tsx:32` `invoice.customer.Stranka.replace` (tsc: »possibly 'undefined'«), enako `offers/list:128,174`, `credit-notes/list:127,173`.
- **Popravek:** `(invoice.customer.Stranka ?? "").replace(...)`.

### 17. Trdo kodirani »Testiranje« / »v4.5« / nedelujoča glava
- **Kje:** `app/page.tsx:149,157,215`, `components/sidebar.tsx:112`, `components/header.tsx`.
- **Popravek:** različico beri iz `package.json` (`import pkg from '../package.json'`), način iz `process.env.NODE_ENV`; iskalnik v glavi odstrani ali poveži.

---

## Prioriteta 3 – tipi, mrtva koda, kakovost (da lahko vklopiš `tsc` v gradnji)

### 18. Podvojeni tipi `SavedOffer` / `SavedCreditNote`
- **Kje:** `lib/database.ts:4-10` (type alias) in `:123, :143` (interface). `tsc`: `Duplicate identifier`.
- **Posledica:** TypeScript vzame **prvo** definicijo (`SavedInvoice & {…}`), zato ima `SavedOffer.status` tip računa (`paid/cancelled`) in `tsc` v `app/offers/list/page.tsx` javi 5× »comparison appears to be unintentional« za `'accepted'/'rejected'`.
- **Popravek:** izbriši vrstice 4-10.

### 19. Lokalni tipi v `lib/email-service-offer.ts:4-5` in `-credit-note.ts:4-5`
- Uvozi `Offer, SavedOffer` iz `./database` namesto lokalnih `Invoice & {...}` (tsc: »Argument of type 'Offer' is not assignable«).

### 20. `sendInvoiceEmail` – nedefinirana `subject`/`body`
- **Kje:** `lib/email-service.ts:83`. Popravek: izbriši funkcijo (in `sendOfferEmail`, `sendCreditNoteEmail`) ali uporabi `emailData.subject/body`.

### 21. `customer-form.tsx` / `customer-table.tsx` uvažata neobstoječ tip
- **Kje:** `components/customer-form.tsx:11`, `customer-table.tsx:8` (`import type { Customer } from "@/app/page"`).
- **Popravek:** izbriši obe datoteki (nista uporabljeni) ali uvozi tip iz `lib/database`.

### 22. Ena definicija `Customer` in ena konstanta DDV
- Tip `Customer` je na treh mestih (`lib/database.ts`, `app/customers/page.tsx`, `document-form.tsx`); `0.22`/`1.22` na šestih. Popravek: `export const VAT_RATE = 0.22` v `lib/constants.ts`; en `Customer`.

### 23. mysql2 rezultat kot `any`
- `tsc` javi 27× »Property 'length'/'forEach'/'map'/'insertId' does not exist on type 'QueryResult'«. Popravek: v `db-connection.ts` dodaj generično signaturo:
```ts
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  …
  const [results] = await connection.execute(sql, params ?? [])
  return results as T
}
// uporaba: const rows = await query<RowDataPacket[]>(…); const res = await query<ResultSetHeader>(…)
```

### 24. `params` v Next 15 je Promise
- Vse `[id]/route.ts` berejo `params.id` sinhrono. Popravek: `{ params }: { params: Promise<{ id: string }> }` in `const { id } = await params`.

### 25. Neuporabljen `@ts-expect-error` v PDF poteh
- `app/api/*/pdf/route.ts:49` – direktiva brez napake pod njo (`tsc`: »Unused '@ts-expect-error' directive«). Popravek: odstrani vrstico.

### 26. `Buffer` v `NextResponse`
- `app/api/*/pdf/route.ts:74-75` – tipska napaka (`Buffer` ni `BodyInit`). Popravek: `new NextResponse(new Uint8Array(pdf), {...})` ali `Buffer.from(pdf)` z `as any`.

### 27. `handleFilterChange` tip
- `app/customers/page.tsx:515` vs `FiltersAndSearch` prop `(key: string, …)`. Popravek: uskladi tip (`keyof typeof filters`).

### 28. Manjkajoče DDL skripte za dokumente
- Dodaj `scripts/03-create-documents.sql` (`04` E13) + `scripts/04-alter-invoices-payment.sql` (`paid_amount`, `notes`). Z `SHOW CREATE TABLE` preveri FK in `ON DELETE`.

### 29. Brez transakcij in validacije v API-ju
- `04` E2, E3. Vsaj: `zod` shema + transakcija pri POST/PUT dokumentov.

### 30. `console.log` v avtentikaciji
- `app/api/auth/login/route.ts:9`, `verify/route.ts:7-15,35`, `AuthContext.tsx` (vsi 🔄🔍🔐 izpisi). Odstrani pred produkcijo (žeton v dnevnikih).

### 31. `details: error.message` v odgovorih
- `app/api/customers/**` – odstrani ali pusti le v `NODE_ENV === 'development'`.

### 32. Ostanki: `color: "oklch"`, fragment brez `key`, `tsconfig` alias `@/contexts/*`, `useRouter` v `login/page.tsx`, `generateNewInvoiceNumber`, `handleSendEmail`, `styles/globals.css`, neuporabljene odvisnosti.

---

## Izpis `npx tsc --noEmit` (brez `components/ui/*`, 76 napak) – dokaz za A4

```
app/api/credit-notes/[id]/pdf/route.ts(30,21): TS2339 Property 'length' does not exist on type 'QueryResult'.
app/api/credit-notes/[id]/pdf/route.ts(49,9):  TS2578 Unused '@ts-expect-error' directive.
app/api/credit-notes/[id]/pdf/route.ts(75,31): TS2345 Argument of type 'Buffer' is not assignable to parameter of type 'BodyInit'.
app/api/credit-notes/route.ts(124,33):         TS2339 Property 'insertId' does not exist on type 'QueryResult'.
app/api/invoices/route.ts(45,12):              TS2339 Property 'forEach' does not exist on type 'QueryResult'.
app/api/invoices/route.ts(132,30):             TS2339 Property 'insertId' does not exist on type 'QueryResult'.
  … (skupaj 27 podobnih za QueryResult v vseh route.ts)
app/credit-notes/list/page.tsx(127,36):        TS18048 'creditNote.customer.Stranka' is possibly 'undefined'.
app/credit-notes/page.tsx(126,7):              TS2304 Cannot find name 'downloadCreditNotePDF'.
app/credit-notes/page.tsx(133,25):             TS2345 Argument of type 'CreditNote' is not assignable to parameter of type 'CreditNote | SavedCreditNote'.
app/customers/page.tsx(1472,23):               TS2322 Type '(key: "status" | … , value: any) => void' is not assignable to type '(key: string, value: any) => void'.
app/invoices/list/page.tsx(32,24):             TS18048 'invoice.customer.Stranka' is possibly 'undefined'.
app/invoices/page.tsx(135,26):                 TS2345 Argument of type 'Invoice' is not assignable to parameter of type 'SavedInvoice'.
app/invoices/view/[id]/page.tsx(168,30):       TS2304 Cannot find name 'XCircle'.
app/offers/list/page.tsx(339,49):              TS2367 comparison … '"draft" | "sent" | "paid" | "cancelled"' and '"accepted"' have no overlap.
  … (5× v offers/list, 8× v offers/view)
app/offers/page.tsx(126,7):                    TS2304 Cannot find name 'downloadOfferPDF'.
app/offers/page.tsx(133,25):                   TS2345 Argument of type 'Offer' is not assignable to parameter of type 'Offer | SavedOffer'.
components/customer-form.tsx(11,15):           TS2614 Module '"@/app/page"' has no exported member 'Customer'.
components/customer-table.tsx(8,15):           TS2614 Module '"@/app/page"' has no exported member 'Customer'.
lib/database.ts(4,13):                         TS2300 Duplicate identifier 'SavedOffer'.
lib/database.ts(8,13):                         TS2300 Duplicate identifier 'SavedCreditNote'.
lib/email-service.ts(83,70):                   TS2304 Cannot find name 'subject'.
lib/email-service.ts(83,106):                  TS2304 Cannot find name 'body'.
lib/email-service-offer.ts(52,32):             TS2339 Property 'status' does not exist on type 'Offer'.
```
(Celoten izpis dobiš z `npm install && npx tsc --noEmit | grep -v components/ui`.)

---

## Predlagan vrstni red popravkov (≈ 1 dan dela)

1. **(15 min)** 1, 2, 8, 9, 16, 18, 19, 20, 21, 25 – uvozi, tipi, končnice, ovoj količine, brisanje mrtve kode.
2. **(1 h)** 3 – dinamični INSERT/UPDATE strank z belo listo; preveri z osvežitvijo.
3. **(30 min)** 4, 10, 11, 12, 13, 14 – obrazci in strani računov (nato kopiraj v ponudbe/dobropise).
4. **(2 h)** 5 – `middleware.ts` + `authFetch`; preveri s `curl` (401) in v aplikaciji (deluje).
5. **(1–2 h)** 7 – print strani za vse tri dokumente + žeton za Playwright; preveri izbirljiv tekst v PDF-ju.
6. **(30 min)** 6, 28 – `npm install`, lock; DDL skripte iz `SHOW CREATE TABLE`.
7. **(po želji)** 22, 23, 24, 29 – konstanta DDV, generični `query<T>`, `await params`, zod + transakcije; nato v `next.config.mjs` vklopi `ignoreBuildErrors: false`.

Po vsakem koraku: `npx tsc --noEmit | grep -v components/ui | wc -l` naj pada proti 0.
