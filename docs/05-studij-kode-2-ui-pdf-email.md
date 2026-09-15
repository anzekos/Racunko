# Študij kode 2/3 – uporabniški vmesnik, obrazci, predogledi, PDF, e-pošta

> Nadaljevanje `05-studij-kode-1-jedro.md`. Tu je vse, kar teče v brskalniku za dokumente (računi, ponudbe, dobropisi). Modul računov je razložen do vrstice; ponudbe in dobropisi so **kopije** – na koncu je seznam razlik, ki jih moraš znati.

---

## 6. Ogrodje strani (vsaka stran ima isto lupino)

Vsaka stran (razen `/login` in `/invoices/print/[id]`) ima isto strukturo:
```tsx
<div className="flex h-screen bg-background">            // cel zaslon, vodoravno
  <Sidebar collapsed={sidebarCollapsed} onToggle={...} />  // fiksen levi meni (w-64 ali w-16)
  <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
    <Header />                                             // 64 px glava
    <main className="flex-1 overflow-hidden">              // preostanek višine
      <div className="h-full overflow-y-auto">             // drsenje samo vsebine
        <div className="p-6"><div className="max-w-6xl mx-auto"> …vsebina… </div></div>
```
**Zakaj `ml-64`/`ml-16`:** `Sidebar` je `position: fixed` (ni v toku dokumenta), zato mora vsebina imeti levi rob enake širine (`w-64` = 16 rem = 256 px). Stanje `sidebarCollapsed` je **lokalno na vsaki strani** (`useState(false)`) → ob navigaciji se meni spet razširi. Izboljšava: stanje v kontekstu ali `localStorage`.

### 📄 `components/sidebar.tsx`
| Vrstice | Razlaga |
|---|---|
| 2 | `"use client"` – zaradi `usePathname`. |
| 10-13 | Props: `collapsed`, `onToggle` (nadzor je v staršu – »controlled component«). |
| 16 | `usePathname()` – trenutna pot za označevanje aktivne postavke. |
| 18-66 | `menuItems` – 9 postavk `{ icon, label, href, active }`. `active` izrazi: `pathname === "/"`; `pathname === "/invoices" && !pathname.includes("/list")` (drugi pogoj je odveč – enakost že izključi `/list`); `pathname.includes("/invoices/list")` (velja tudi za podpoti). ⚠️ `/invoices/view/5` in `/invoices?edit=5` ne osvetlita ničesar (`usePathname` ne vsebuje `?query`). |
| 69-74 | Ovoj: `fixed left-0 top-0 h-full … z-50`, širina po `collapsed`, `transition-all duration-300` (animacija širine). |
| 75-89 | Glava: logotip + naslov (skrita, ko je zloženo), gumb s `ChevronLeft/Right`. |
| 90-102 | `menuItems.map` → `<Link href passHref><Button variant={active ? "secondary" : "ghost"}>` – ⚠️ `<Button>` znotraj `<Link>` = `<a><button>` (neveljaven HTML, deluje). Pravilno: `<Button asChild><Link …/></Button>` (Radix `Slot`). `key={index}` je sprejemljiv, ker je seznam statičen. |
| 103-115 | Noga z logotipom 2KM in »Anže Kos • v4.5« (trdo kodirano). |

### 📄 `components/header.tsx`
Strežniška komponenta (brez `"use client"`, brez stanja). Iskalno polje (11) in trije ikonski gumbi (16-24) **brez funkcij** – dekoracija iz predloge. ⚠️ Komisija vpraša: »Kaj naredi iskalnik?« – odgovori iskreno in povej, kam bi ga vezal (globalno iskanje po strankah/računih).

### 📄 `app/page.tsx` (domača stran)
- 14-25: `HomePageContent` z uro: `setInterval` vsako sekundo → `setCurrentTime(new Date())`; čiščenje `clearInterval` (brez tega bi po odmontaži interval tekel naprej → »memory leak« in `setState` na odmontirani komponenti).
- 17: `const { user, logout } = useAuth()` – ime in vloga v glavi, gumb »Odjava«.
- 33-55: lastna glava (ne `<Header />`) z uporabnikom in odjavo.
- 62-81: pozdrav, logotip (`<Image fill>` v `relative w-48 h-32` – `fill` zahteva starša s `position: relative` in določeno velikostjo), datum `toLocaleDateString("sl-SI", { weekday: "long", … })` → »torek, 15. september 2026«.
- 84-134: dve kartici z `<Link>` na `/customers` in `/invoices`.
- 137-162: »Stanje sistema« – **trdo kodirano** (Testiranje / Aktivno / v4.5).
- 227-233: `HomePage` = `<ProtectedRoute><HomePageContent/></ProtectedRoute>`.

---

## 7. Modul računi

### Tok »nov račun« (nauči se kot zaporedje)
1. `/invoices` → `InvoicesPageContent` (`loadData`: `Promise.all([fetchCustomers(), fetchInvoices()])` → stranke za avtodopolnjevanje + število računov za kartico).
2. `InvoiceForm` (obrazec) – uporabnik izbere stranko (`CustomerAutocomplete`), vpiše številko, datume, postavke.
3. Ob oddaji `handleSubmit` sestavi objekt `Invoice` in kliče `onInvoiceCreate(invoice, saveAsMode)`.
4. Stran `handleInvoiceCreate` odloči: **Save As** → `saveInvoice`; **urejanje** → `updateInvoice(editingInvoice.id)`; **nov** → `saveInvoice`. Rezultat v `currentInvoice`, `showPreview = true`.
5. `InvoicePreview` izriše dokument; gumbi: Natisni (`window.print`), Prenesi PDF (`onDownload` → `downloadInvoicePDF`), Pošlji po e-pošti (`openEmailClient` **neposredno**, mimo `onSendEmail`).

### 📄 `components/invoice-form.tsx`

**`CustomerAutocomplete` (31-86)** – izvožena, uporabljena tudi v ponudbah/dobropisih.
| Vrstice | Razlaga |
|---|---|
| 32-34 | `query` (besedilo v polju), `showSuggestions`, `filteredCustomers`. |
| 36-40 | Ko starš nastavi `selectedCustomer` (npr. ob urejanju), se v polje vpiše `Stranka`. |
| 42-51 | Ob vsaki spremembi `query` ali `customers`: filtriraj `Stranka?.toLowerCase().includes(query.toLowerCase())` (podniz, ne od začetka), pokaži predloge; prazen niz → skrij. |
| 53-57 | Izbira: vpiši ime, skrij seznam, javi staršu. |
| 60-84 | `<div className="relative">` + `<Input>` + absolutno pozicioniran seznam (`absolute z-10 w-full mt-1 … max-h-60 overflow-y-auto`), `onClick` na vrstici. `onFocus` znova pokaže predloge. ⚠️ Ni tipkovnične navigacije (puščice/Enter) – stran strank jo ima; ni zapiranja ob kliku izven; `key={customer.id}`. |

**`InvoiceForm` (88-434)**
| Vrstice | Razlaga |
|---|---|
| 88-96 | Props: `customers`, `onInvoiceCreate(invoice, isSaveAs?)`, `onSaveAs`, `loading`, `saving`, `editingInvoice`, `saveAsMode = false`. |
| 97-105 | Stanje: `selectedCustomer`, `invoiceNumber`, `issueDate` (danes v `YYYY-MM-DD`), `dueDate` (`""`, napolni efekt), `serviceDate` (danes), `serviceDescription`, `items` (ena prazna postavka `{ description: "", quantity: 1, price: 0, total: 0 }`), `rawValues` (surovi nizi količin/cen po ključu `"i-quantity"`). |
| 107-122 | **Nalaganje za urejanje:** ob `editingInvoice` kopira vsa polja v stanje; postavke ali ena prazna; v `saveAsMode` izprazni številko (kopija potrebuje novo). Odvisnosti `[editingInvoice, saveAsMode]`. ⚠️ `rawValues` se ne ponastavi. |
| 125-133 | **Valuta +15 dni:** `new Date(issueDate)`, kopija, `setDate(getDate()+15)` (JS sam prenese mesec/leto), `toISOString().split("T")[0]`. ⚠️ Sproži se tudi po 107-122 in **prepiše** shranjeno valuto (`04` F5/E9). |
| 135-143 | `addItem` (spread + nova), `removeItem` (`filter` po indeksu; onemogočeno pri 1 postavki). |
| 145-159 | `updateItem(index, field, value)` – `04` C4. |
| 161-163 | Izpeljane vrednosti **brez stanja** (izračun ob vsakem izrisu): `totalWithoutVat = Σ total`, `vat = ×0.22`, `totalPayable`. To je pravilen React vzorec (ne shranjuj, kar lahko izračunaš). |
| 165-188 | `handleSubmit`: `preventDefault`; validacija (stranka, številka, vsaka postavka ima opis) → `alert`; sestavi `Invoice` z `id: editingInvoice?.id`, postavke brez praznih opisov; `onInvoiceCreate(invoice, saveAsMode)`. ⚠️ Ni validacije količine > 0, cene ≥ 0, datumov (valuta pred izdajo). |
| 191-198 | Med `loading` kartica »Nalagam podatke o strankah…«. |
| 201-280 | Dve kartici v `grid lg:grid-cols-2`: stranka (avtodopolnjevanje + prikaz naslova/kraja/e-pošte/DDV iz izbrane) in podatki računa (številka `required`, `placeholder` odvisen od `saveAsMode`, datum izdaje, valuta, datum storitve – vsi `type="date"`). |
| 282-294 | Opis storitve (`Textarea rows=3`). |
| 296-377 | Postavke: gumb »Dodaj postavko« (`type="button"`, da ne odda obrazca!), vsaka vrstica `grid grid-cols-12 gap-4 items-end`: opis (`col-span-5`), **količina** (⚠️ 316-328 brez `col-span-2` ovoja in `Label` – F6), cena (`col-span-2`), skupaj (`readOnly bg-muted`, `toFixed(2)`), koš (`col-span-1`). Količina/cena: `type="text" inputMode="decimal"` (mobilna tipkovnica s številkami in vejico; `type="number"` bi vejico zavrnil), vrednost `rawValues[...] ?? item.quantity`, `onBlur` normalizira. |
| 361-374 | Povzetek: brez DDV / DDV 22 % / za plačilo (`toFixed(2)` s piko – ⚠️ v predogledu je zapis z vejico; nedoslednost). |
| 379-431 | Gumbi: oddaja (`disabled={saving}`, vrtavka `Loader2 animate-spin`, besedilo po načinu), »Shrani kot nov« (le pri urejanju, ne v saveAs), »Prekliči« v saveAs → ⚠️ `window.location.href = /invoices?edit=…` (polni reload; drugod `router.push`). |

### 📄 `components/invoice-preview.tsx` (dokument A4)
| Vrstice | Razlaga |
|---|---|
| 11-16 | `formatNumber` – `toLocaleString('de-DE', {2 decimalki})` → `1.234,56`. |
| 18-22 | Props: `invoice: Invoice` (ne `SavedInvoice` – deluje tudi pred shranjevanjem), `onDownload`, `onSendEmail`. |
| 25-35 | `handlePrint` → `window.print()`; `handleDirectDownload` → `onDownload()`; `handleDirectEmail` → **`openEmailClient(invoice)`** iz `lib/email-service` (⚠️ `onSendEmail` prop ni nikoli klican – mrtvi prop). |
| 40-120 | `<style jsx>` (styled-jsx, obseg le ta komponenta): blok `@media print` z `!important` velikostmi v **pt** (tisk: 10 pt telo, 7 pt podatki podjetja, 8 pt tabela) in blok za zaslon v **rem**. Razredi `.invoice-*` so na elementih spodaj. Zakaj dva bloka: na zaslonu udobno, v PDF-ju kompaktno, da gre na eno stran. |
| 123-136 | Gumbi z `print:hidden` (Tailwind: `@media print { display: none }`) – zato jih Playwright (`emulateMedia print`) ne izriše; html2canvas jih skrije ročno. |
| 139-140 | `<Card className="max-w-4xl mx-auto"><CardContent id="invoice-preview-content" className="p-8 print:p-0 invoice-preview-content">` – **ta `id` iščeta** `pdf-generator` (`getElementById`) in Playwright (`waitForSelector`). |
| 142-155 | Logotip desno zgoraj: `relative w-35 h-18` (Tailwind v4 dovoli poljubne številke = 35×0.25 rem) + `<Image fill priority onError>`. |
| 157 | `<hr className="border-[#934435] border-1 mb-6" />` – bordo črta (barva podjetja). |
| 160-198 | Mreža 2 stolpca: levo stranka (naziv krepko, naslov, kraj, e-pošta, ID za DDV) + datumi (`Ljubljana:` = kraj in datum izdaje; `Valuta`; `Datum opr. storitve` – vsi `toLocaleDateString("sl-SI")`); desno podatki izdajatelja (MŠ, ID DDV, osnovni kapital, sodni register, IBAN, banka, SWIFT) – **obvezne sestavine računa po ZDDV-1/ZGD-1** (to komisija rada vpraša: kaj mora račun vsebovati). |
| 201-207 | »Račun: {številka}« (`text-xl`), `<hr>`. |
| 210-215 | Opis storitve le, če obstaja; `whitespace-pre-wrap` ohrani prelome vrstic iz `Textarea`. |
| 218-259 | Tabela: `border-collapse`, glava `bg-[#f8ecec]` (svetlo rožnata), stolpci Postavka/Količina/Cena/Skupaj (`text-right` za številke), `tfoot` s tremi vrsticami (`colSpan={3}`): brez DDV, DDV 22 %, za plačilo. `key={index}` (postavke nimajo ID-ja). |
| 262-273 | Plačilni podatki: TRR, sklic = številka računa, opozorilo o zamudnih obrestih, zahvala. `pr-80` (odmik desno, da je znesek poravnan pod tabelo). |
| 276-289 | Podpis: naziv + slika podpisa (`w-45 h-26`). |
| 292-300 | `normal-footer` – HTML noga za zaslon/Playwright; html2canvas pot jo odstrani in nariše vektorsko. |

### 📄 `app/invoices/page.tsx` (nov račun / urejanje / predogled)
| Vrstice | Razlaga |
|---|---|
| 19-29 | Stanje: `customers`, `sidebarCollapsed`, `currentInvoice` (za predogled), `editingInvoice` (za obrazec), `showPreview`, `loading`, `invoiceCount`, `saving`, `saveAsMode`. |
| 31-33 | Ob montaži `loadData()`. |
| 35-40 in 114-124 | ⚠️ **Dva** efekta na `[searchParams]`: oba kličeta `loadInvoiceForEdit(editId)`; drugi še `setSaveAsMode(true)` pri `?saveAs=true` (F9). Vrstni red: prvi efekt nastavi `saveAsMode=false` (v `loadInvoiceForEdit`, ki je async → izvede se **pozneje**), drugi `true` takoj → **tekmovalno stanje**: `loadInvoiceForEdit` iz prvega efekta po prenosu pokliče `setSaveAsMode(false)` in lahko prepiše `true`. Deluje po sreči (oba klica `loadInvoiceForEdit` končata s `false`, a `setSaveAsMode(true)` iz drugega efekta je bil sinhron in prej…). Razčleni si to – komisija bo vprašala, kaj se zgodi ob `?edit=5&saveAs=true`. Pravilen popravek: en efekt, `fetchInvoiceById`, `saveAsMode` nastavi **po** nalaganju. |
| 43-56 | `loadData` – vzporedno; `finally setLoading(false)`. |
| 58-69 | `loadInvoiceForEdit` – ⚠️ prenese vse račune, `find(inv => inv.id === id)` (nizi). |
| 71-101 | `handleInvoiceCreate(invoiceData, isSaveAs)` – tri veje (`04` §7 tok); `setInvoiceCount(prev => prev + 1)`; `alert` ob napaki (⚠️ generično sporočilo, izgubi »številka že obstaja«). |
| 104-108 | `generateNewInvoiceNumber` – mrtva (`RAC-{timestamp}-{random}`); zakomentirana uporaba v 80. |
| 110-112 | `handleSaveAs` → `saveAsMode = true` (gumb v obrazcu). |
| 126-131 | `handleBackToForm` – ponastavi vse (nov prazen obrazec). |
| 133-137 | `handleDownloadPDF` → `downloadInvoicePDF(currentInvoice)` – ⚠️ tip `Invoice` namesto `SavedInvoice` (TS napaka; ob izvajanju OK, ker ima `id`). |
| 139-148 | `handleSendEmail` – **nikoli klican** (predogled kliče `openEmailClient` sam). |
| 150-156 | `handleEditInvoice` – iz predogleda nazaj v obrazec z istim računom. |
| 169-213 | Način obrazca: naslov po stanju (»Shrani račun kot nov« / »Urejanje računa« / »Generiranje računov«), kartica »Aktivni računi {invoiceCount}« kot `<Link>` na seznam, `<InvoiceForm …/>`. |
| 215-242 | Način predogleda: »Nazaj na obrazec«, »Uredi račun«, `<InvoicePreview invoice={currentInvoice} …/>`. |
| 252-258 | `Suspense` ovoj (`04` D17). ⚠️ Stran **ni** v `ProtectedRoute`. |

### 📄 `app/invoices/list/page.tsx` (seznam)
| Vrstice | Razlaga |
|---|---|
| 31-35 | `generatePDFFilename` – ⚠️ `Stranka.replace` brez `?.` (F14); `[^a-zA-Z0-9]` → š/č/ž postanejo presledki. |
| 37-46 | Stanje: `invoices`, `filteredInvoices`, `loading`, `searchQuery`, `pdfInvoice` (kateri račun je trenutno v skritem predogledu), `selectedInvoices: string[]` (ID-ji), `isBulkDownloading`. |
| 52-65 | Filtriranje kot efekt v ločeno stanje (po številki, stranki, statusu; `includes` malih črk). Alternativa: `useMemo` (kot stranke). |
| 67-78 | `loadInvoices` – nastavi oba seznama. |
| 81-107 | Izbira: `toggleInvoiceSelection` (dodaj/odstrani ID), `toggleSelectAll` (vsi filtrirani ali nič), `isAllSelected`, `isSomeSelected` (za ikono). |
| 110-163 | **Množični prenos:** za vsak izbrani račun: `setPdfInvoice(invoice)` → izriše skriti `<InvoicePreview>` (575-584) → `setTimeout 1000 ms` (čas za izris in slike) → `getElementById('invoice-preview-content')` → `generateInvoicePDFFromElement` (raster) → `<a download>` klik → po 100 ms `revokeObjectURL` + `resolve()` → `finally setPdfInvoice(null)`. `await new Promise(async (resolve) => …)` – ⚠️ anti-vzorec (napake znotraj `async` izvršitelja se ne prenesejo v `reject`), a tu vsaka pot kliče `resolve()`. Skupaj ≈ 1,1 s × N. Na koncu počisti izbiro. |
| 165-192 | Posamezni prenos – ista rasterska pot z 1000 ms. ⚠️ Ne uporablja strežniške poti, čeprav ima ID (`04` D18). |
| 194-206 | Brisanje s `confirm`, nato `loadInvoices` in odstranitev iz izbire. |
| 208-220 | E-pošta: če `draft` → `updateInvoiceStatus('sent')` + `loadInvoices()`; nato `openEmailClient(invoice)` s **starim** objektom (F11). |
| 222-244 | Označi plačan / neplačan (`paid` ↔ `sent`) s `confirm`. |
| 246-248 | Uredi → `/invoices?edit={id}`. |
| 250-282 | `getStatusBadge` (barve/oznake po statusu; `badges[status as keyof typeof badges]` = varno indeksiranje v TS), `getInvoiceCardClass` (zelena kartica plačan, modra poslan). |
| 312-361 | Štiri statistične kartice (`invoices.filter(i => i.status === 'draft').length` …). |
| 364-405 | Iskanje + vrstica množičnih akcij (le, ko je kaj izbrano). |
| 408-568 | Seznam: glava z »Izberi vse«, stanja `loading` / prazno / seznam; vsaka kartica: gumb izbire (ikoni `CheckSquare`/`Square`), ikona statusa, naslov, badge, stranka/datum/znesek (`toFixed(2)` ⚠️ pika), »Ustvarjeno« (`toLocaleString`), gumbi Poglej/Uredi/PDF/E-pošta/Plačan-Neplačan/Izbriši. `ring-2 ring-primary` ob izbiri. |
| 575-584 | Skriti predogled (`position: fixed; left: -10000px; width: 210mm`) – izriše se le, ko `pdfInvoice` ni `null`. |

### 📄 `app/invoices/view/[id]/page.tsx` (ogled)
- 15: `useParams()` → `{ id }`; 21-25: efekt `[params.id]` → `loadInvoice` (`fetchInvoiceById`), ob napaki `alert` + nazaj na seznam.
- 41-45 prenos (strežniška pot, ker ima ID); 47-58 `handleSendEmail` (nikoli klican – glej predogled); 60-70 uredi / **shrani kot nov** (`?edit=ID&saveAs=true`); 72-100 označi plačan/neplačan (`confirm`, nato `loadInvoice` za osvežitev; ⚠️ 93 brez `await` – deluje, a nedosledno).
- 134-148 badge statusa (plačan/poslan/osnutek; `cancelled` ni obravnavan → prikaže »Osnutek«); 152-171 gumbi; ⚠️ 168 `XCircle` **ni uvožen** (F1 – sesutje pri plačanem računu).
- 183-187 `<InvoicePreview>`.

### 📄 `app/invoices/print/[id]/page.tsx` (samo za Playwright/tisk)
- Brez menija in glave; 12-18: `fetchInvoiceById(id).then(setInvoice).catch(() => setInvoice(null))`; 20-26: »Nalagam račun…« dokler ni podatkov; 28-32: `<div className="min-h-screen bg-white p-6 print:p-0"><InvoicePreview …/>`.
- ⚠️ Pod `AuthProvider` → preusmeritev na `/login` brez žetona (`04` C8). Rešitev: v `app/invoices/print/` dodaj lasten `layout.tsx`, ki **ne** uporablja `AuthProvider` – a pozor, korenski `app/layout.tsx` ga vseeno ovije (gnezdenje). Zato prava rešitev: `AuthProvider` naj preskoči preverjanje, če `pathname.startsWith('/invoices/print')` (in te strani zaščiti drugače, npr. z enkratnim žetonom v URL-ju, ki ga preveri API).

---

## 8. Generiranje PDF

### 📄 `lib/pdf-generator.tsx` (računi – referenčna implementacija)
| Vrstice | Razlaga |
|---|---|
| 1-3 | Uvoz tipa `SavedInvoice`, `jsPDF`, `html2canvas` (⚠️ ti dve knjižnici sta veliki ~500 kB – naložita se le na straneh, ki uvozijo ta modul). |
| 5-14 | `downloadBlob(blob, filename)` – `URL.createObjectURL` (začasen `blob:` URL), skrit `<a download>` dodan v DOM, `click()`, odstranitev, `revokeObjectURL` (sprosti pomnilnik). Standardni vzorec prenosa iz JS. |
| 16-18 | `safeFilenamePart`. |
| 21-27 | `convertOklchToHex` – če vrednost vsebuje `oklch`, ugani po podnizih (glej `04` B12). Hevristika izhaja iz konkretnih izračunanih vrednosti Tailwind palete (npr. `gray-300 = oklch(0.872 0.01 258.338)` → `#cccccc`-ish). Vse ostalo (npr. `--foreground oklch(0.145 0 0)`) → črna. |
| 30-44 | `normalizeColors(el)` – `getComputedStyle` (dejanska, izračunana vrednost), za `color`, `backgroundColor`, `borderColor` prepiše inline slog s hex. ⚠️ Ne pokrije `borderTopColor` posebej, `outline`, `boxShadow`, gradientov. |
| 47-75 | `addFooterToPDF(pdf, invoice)` – enote mm (A4 = 210×297). `footerY = 297-10`; črta od `x=20` do `190` pri `y = footerY-18`; besedilo 7 pt, barva (147,68,53) = `#934435`, `helvetica` (vgrajena pisava jsPDF – ⚠️ **brez šumnikov**: »Športna« se izriše kot »Športna«? Ne – standardna Helvetica v jsPDF podpira le WinAnsi; `Š` je v WinAnsi (0x8A), zato deluje; `č/ž` sta v Windows-1250, **ne** v WinAnsi → lahko izpadeta napačno. Preveri v PDF-ju!). Vrstice pri `footerY-14, -10, -6, -2`, poravnava desno pri `x = 190`. Parameter `invoice` ni uporabljen. |
| 78-206 | `generateInvoicePDFFromElement` – `04` C5. Dodatno: 82 `querySelectorAll('.print\\:hidden')` – dvojna poševnica, ker je `:` v CSS selektorju poseben znak; 99 `width: '210mm'` = razlog, da je razmerje enako A4; 121-135 `html2canvas` opcije: `scale: 3.0` (3× DPR → ~288 DPI), `useCORS` (slike z drugih domen), `allowTaint` (dovoli »okužen« canvas – potem `toDataURL` ne bi delal, a `addImage(canvas)` bere piksle interno), `imageTimeout: 0` (brez omejitve), `onclone` (html2canvas naredi svoj klon dokumenta – barve normaliziraj še tam); 160-161 višina slike sorazmerno; 174-179 če višja od razpoložljive, pomanjšaj (ohrani razmerje, centriraj); 181-190 `addImage(canvas, 'PNG', x, y, w, h, alias?, 'FAST')`. |
| 208-263 | `downloadInvoicePDFFromPreview(invoice, previewElementId)` – ime datoteke; **če ima ID** → `fetch('/api/invoices/{id}/pdf')` → `res.blob()` → `downloadBlob`; `.catch` → rezerva z elementom iz DOM-a; drugi `.catch` → `alert`; `.finally` → kazalec nazaj. `document.body.style.cursor = "wait"` = vizualna povratna informacija. **Brez ID-ja** (neshranjen račun) → samo rezerva. |
| 266-268 | `downloadInvoicePDF(invoice)` – alias s privzetim ID-jem elementa. |

### 📄 `lib/pdf-generator-offer.ts` in `lib/pdf-generator-credit-note.ts`
Kopije z razlikami (nauči se jih):
| Razlika | Ponudba | Dobropis |
|---|---|---|
| `html2canvas.scale` | 3.0 | **2.0** |
| Format slike | PNG, `addImage(canvas)` | `canvas.toDataURL('image/png')` → `compressPNG` → **JPEG 0.95** → `addImage(dataUrl, 'JPEG')` |
| `jsPDF` | `new jsPDF({ compress: true })` | `new jsPDF('p','mm','a4', true)` (isti pomen, stara sintaksa) |
| Čakanje | 300 ms | 500 ms |
| `removeContainer: true` | ne | da |
| Ime datoteke | brez `.pdf` (⚠️), `[^a-zA-Z0-9-]` | brez `.pdf` (⚠️), `[^a-zA-Z0-9]` |
| Prenos | koda za `<a download>` je **trikrat podvojena** (brez `downloadBlob`) | enako |
| `compressPNG` | – | `new Image()` → `canvas.drawImage` → `toDataURL('image/jpeg', q)`; `Promise` z `onload` |

### 📄 `app/api/*/pdf/route.ts` – glej 1. del (§5).

---

## 9. E-pošta

### 📄 `lib/email-service.ts`
| Vrstice | Razlaga |
|---|---|
| 3-9 | `EmailData` (nikjer zares uporabljen za pošiljanje). |
| 12-17 | `formatNumber` z `Intl.NumberFormat('sl-SI')` (⚠️ tu `sl-SI`, v predogledu `de-DE`). |
| 20-37 | `updateInvoiceStatus` – **kopija** funkcije iz `lib/database.ts:270`. |
| 39-91 | `sendInvoiceEmail` – mrtva in pokvarjena (83: `subject`, `body` nista v obsegu – sta polji `emailData`). Če bi jo poklical → `ReferenceError`. |
| 93-134 | `openEmailClient(invoice, recipientEmail?)`: e-pošta iz parametra ali `invoice.customer.email` (brez → `alert`); če `'id' in invoice && status === 'draft'` → `updateInvoiceStatus(id, 'sent')` (napaka se le logira – e-pošta se vseeno odpre); sestavi `subject` in `body` (predloga s številko, datumi `sl-SI`, zneskom, TRR, sklicem `SI00 {številka}`); `mailto:` z `encodeURIComponent` (presledki → `%20`, nove vrstice → `%0A`); `window.open(mailtoLink, "_blank")` → odpre privzeti poštni odjemalec. ⚠️ **Priponke prek `mailto:` ni** – uporabnik mora PDF ročno pripeti. To povej brez zadrege in navedi rešitev (strežniško pošiljanje s Playwright PDF-jem kot priponko, npr. Nodemailer). |

### 📄 `lib/email-service-offer.ts`, `lib/email-service-credit-note.ts`
Kopije; razlike: lastni lokalni tipi `Offer = Invoice & { offerNumber }` (⚠️ neusklajeni z `lib/database.ts` → TS napake pri klicih), besedilo (ponudba: »Veljavnost«, »Po opravljeni storitvi…«; dobropis: »Znesek vračila«, »Vračilo … v roku 14 dni«, sklic na št. dobropisa), poti `/api/offers/{id}/status`.

---

## 10. Ponudbe in dobropisi – seznam razlik (vse ostalo je kopija računov)

| Kje | Račun | Ponudba | Dobropis |
|---|---|---|---|
| Številka | `invoiceNumber` / `invoice_number` | `offerNumber` / `offer_number` (placeholder `P-2024-001`) | `creditNoteNumber` / `credit_note_number` |
| Valuta | +15 dni (»Valuta (15 dni)«) | +30 dni (»Veljavnost do«) | +30 dni (»Valuta«) |
| Datum storitve v obrazcu | da | **ne** (a se shrani današnji) | da |
| Statusi | draft/sent/paid/cancelled | draft/sent/**accepted/rejected** | draft/sent/paid/cancelled |
| Gumbi v seznamu | plačan/neplačan | sprejeta/zavrnjena (skrita, ko je odločeno) | plačan/neplačan |
| Barve kartic | zelena paid, modra sent | zelena accepted, modra sent, **rdeča rejected** | kot račun |
| Predogled – besedilo | »Skupaj za plačilo«, TRR, sklic, zamudne obresti | »Po opravljeni storitvi bo izdan račun za plačilo.«, sklic na št. ponudbe, brez zamudnih obresti | »Skupaj za **vračilo**«, »Znesek vračila na TRR«, »Vračilo zneska bo izvedeno v roku 14 dni.« |
| Predogled – velikosti pisav | 10/7/8 pt (kompaktno) | 12/9/9 pt (večje – starejša verzija) | kot ponudba |
| Ikona v meniju | `FileText` | `TrendingUp` | `Receipt` |
| Print stran | `/invoices/print/[id]` | **ni** (PDF pot cilja `/offers/view`) | ni |
| Ledger (plačila) | da (`paid_amount`, `notes`) | ne | ne |
| Strežniški PDF datoteka | `… .pdf` | brez končnice | brez končnice |
| DELETE API | le glava | **postavke + glava** | le glava |
| Popravek `openEmailClient(x, 'offer')` | – | zgrešen v `app/offers/page.tsx:133` | popravljen povsod |

---

## Samopreverjanje (poglavja 6–10)

1. Zakaj ima `Sidebar` `position: fixed` in kako to vpliva na vsebino?
2. Zakaj gumb »Dodaj postavko« potrebuje `type="button"`?
3. Kaj se zgodi z `dueDate`, ko odpreš račun za urejanje? Napiši popravek.
4. Kateri element mora obstajati, da PDF sploh nastane, in kje je definiran?
5. Kaj naredi `print:hidden` in kdo ga spoštuje (Playwright da, html2canvas ne)?
6. Zakaj `useCORS: true` in kdaj bi bil potreben?
7. Zakaj se noga v rasterski poti riše vektorsko?
8. Kaj naredi `URL.revokeObjectURL` in kaj se zgodi brez njega?
9. Zakaj `mailto:` ne more imeti priponke in kaj je alternativa?
10. Naštej 5 razlik med ponudbo in računom v kodi.
11. Ob kliku »Pošlji po e-pošti« na `view` strani: katere funkcije se izvedejo v katerem vrstnem redu? (`handleDirectEmail` → `openEmailClient` → `updateInvoiceStatus` → `window.open`)
12. Zakaj skriti predogled na seznamu potrebuje `width: 210mm`?

*Nadaljuj z `05-studij-kode-3-stranke-ledger-tokovi.md`.*
