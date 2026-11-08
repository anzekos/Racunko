# Študij kode 3/3 – stranke (formule), baza računov (ledger), mrtva koda, tokovi od konca do konca

> Nadaljevanje `05-studij-kode-2-ui-pdf-email.md`. Modul strank je največja datoteka v projektu (1501 vrstic) in vsebuje **največ tvoje lastne logike** (formule, avtodopolnjevanje, filtri) – komisija bo tu preverjala avtorstvo.

---

## 11. Modul stranke – `app/customers/page.tsx`

### Domena (povej v 3 stavkih)
Podjetje 2KM Consulting svetuje strankam pri prijavah na razpise za nepovratna sredstva. Za vsako stranko spremlja: honorar za **vlogo** (VLG), odobreni znesek po **odločbi** (ODL), do pet **zahtevkov** za izplačilo (ZAH1–ZAH5), kaj je bilo **izplačano**, in **provizijo** svetovalca. `KONTROLA = VLG + Izplačano × Provizija` je pričakovani skupni prihodek svetovalca. Zato ima tabela 62 stolpcev in obrazec šest zavihkov.

### Struktura datoteke
| Vrstice | Kaj |
|---|---|
| 17-81 | `interface Customer` – **tretja** kopija tipa (tu vsa polja obvezna, brez `?`; v `lib/database.ts` opcijska). ⚠️ En vir resnice bi bil `lib/database.ts`. |
| 83-146 | `columns` – 62 imen stolpcev v vrstnem redu tabele (= vrstni red v SQL skripti). |
| 148-185 | `numericFields` – kateri stolpci so števila (za `Number()`, `toFixed(2)`, formule). |
| 187 | `formulaFields = ["ODL","ZAH1".."ZAH5"]` – polja, v katera lahko vpišeš **formulo**. |
| 189-197 | `ddvMap` – osnovni stolpec → stolpec z DDV (`VLG → VLG_z_DDV` …). |
| 200-214 | `useDebounce<T>(value, delay)` – generični hook: ob spremembi `value` nastavi `setTimeout`; čiščenje `clearTimeout` prekliče prejšnjega; `debouncedValue` se posodobi šele, ko 300 ms ni nove spremembe. Namen: filtriranje 62 stolpcev × N strank ne teče ob vsaki tipki. |
| 217-366 | `FiltersAndSearch` – ločena komponenta (zunaj strani, zato se **ne** ustvarja znova ob vsakem izrisu – pravilno). Props so vsi »controlled« (stanje v staršu). `useRef` za fokus vnosa po brisanju (`handleClearSearch` → `setTimeout(focusSearchInput, 0)` – počaka, da se izris konča). Filtri: status (`<select>` iz `statusOptions`), znesek od/do (po `SKUPAJ`), potrditveni polji »samo z emailom«, »samo s pogodbo«; oznaka `!` na gumbu, če je kateri filter aktiven (`Object.values(filters).some(val => val !== "" && val !== false)`); števec »Prikazano X od Y«; opis sortiranja. |
| 368-419 | `CustomersPageContent` – stanje: `customers`, `formData: Partial<Customer>` (obrazec), `editingId`, `apiError`, avtodopolnjevanje strank (`autocompleteData`, `showAutocomplete`, `autocompleteIndex`), avtodopolnjevanje **imen polj v formulah** (`fieldAutocomplete { show, field, suggestions, inputRef }`, `fieldAutocompleteIndex`), `formulaInputs` (surovi nizi formul), iskanje/filtri/sortiranje, `fieldNames` (408-419: mala imena polj, ki jih formula lahko uporabi – vključno s »kratkimi« `delez`, `gotovina`, `skupaj`, ki **niso** v `numericFields` in se v `calculateFormula` **ne** zamenjajo → ostanejo črke → bela lista zavrne → `null`). |
| 421-509 | `loadCustomers` – `fetch("/api/customers")`; `response.ok` → podatki; sicer/`catch` → `apiError = true` + **mock** stranka (demo način; opozorilo 1033-1039). |
| 511-533 | `useCallback` ovojnice (`handleSearchChange`, `handleFilterChange`, `toggleFilters`, `handleResetFilters`) – stabilne reference za `FiltersAndSearch`. |
| 535-597 | `filteredAndSortedCustomers = useMemo(...)`: kopija seznama → iskanje po **vseh** vrednostih (`Object.values(customer).some(v => v?.toString().toLowerCase().includes(term))`) → filter statusa (katerikoli `Status_*` enak) → min/max po `SKUPAJ` → e-pošta/pogodba → sortiranje z `localeCompare(…, "sl", { sensitivity: "base" })` (slovenska abeceda, brez razlike velikih/malih; ⚠️ števila se primerjajo kot nizi: `"9" > "10"`). |
| 599-604 | `handleSort(key)` – isti ključ → obrni smer; nov ključ → `asc`. |
| 606-616 | `statusOptions` – množica vseh `Status_*` vrednosti, sortirana. |
| 618-653 | `calculateFormula(formula, currentData)` – `04` C7. |
| 655-680 | `handleFieldAutocomplete(field, value, input)` – najde **zadnjo besedo pred kazalcem** (`selectionStart`, razbitje po `[\s+\-*/()]`), predlaga do 5 imen polj, ki vsebujejo podniz. |
| 682-719 | `selectFieldSuggestion(s)` – zamenja zadnjo besedo s predlogom + presledek, posodobi `formulaInputs`, **ročno** nastavi `input.value` in sproži `Event("input")` (da React zazna), po 10 ms postavi kazalec (`setSelectionRange`) in fokus, izračuna formulo in posodobi `formData` prek `updateCalculations`. ⚠️ Mešanje neposrednega DOM-a in Reacta – deluje, a je krhko. |
| 721-741 | `handleInputChange(field, value)`: številsko polje → če je formulsko, shrani niz v `formulaInputs` in izračunaj (rezultat `null` = pusti staro vrednost); sicer `Number(value) \|\| 0`; besedilno → niz. Nato **vedno** `updateCalculations`. |
| 743-783 | `handleFormulaKeyDown` – z odprtim seznamom: ↑/↓ premika (`prev < len-1 ? prev+1 : 0` – krožno), Enter/Tab izbere, Esc zapre + `blur`; brez seznama: Enter izračuna formulo, Esc zapre. `e.preventDefault()` prepreči oddajo obrazca/skok fokusa. |
| 785-815 | `updateCalculations(data)` – **srce domene**: za vsak par v `ddvMap`: `X_z_DDV = round2(X × 1.22)`; `SKUPAJ = Σ formulaFields`; `Izplacano = Σ *_izplacano`; `KONTROLA = round2(VLG + Izplacano × Provizija)`. Vrne nov objekt. |
| 817-844 | Avtodopolnjevanje **imena stranke** (v obrazcu): po 2 znakih filtrira do 5 zadetkov; `selectCustomer` prepiše naziv/naslov/kraj/e-pošto/DDV (uporabno pri vnosu nove pogodbe za obstoječo stranko). |
| 846-875 | Tipkovnica za seznam strank (`switch` po `e.key`). |
| 877-912 | `handleSubmit`: `updateCalculations(formData)` → `PUT /api/customers/{id}` (urejanje: lokalno zamenja objekt v seznamu – ⚠️ z izračunanimi polji, ki jih API **ni shranil**, F4) ali `POST` (dodaj odgovor strežnika v seznam); počisti obrazec; `alert`. ⚠️ `response.ok` false → tiho (brez sporočila), a `alert("uspešno")` se vseeno pokaže! |
| 914-923 | `handleEdit(customer)` – napolni obrazec, `formulaInputs` = trenutne številske vrednosti kot nizi. |
| 925-936 | `handleDelete` – `confirm`, `DELETE`, odstrani iz seznama (⚠️ ne preveri `response.ok`). |
| 938-960 | `AutocompleteDropdown` – **komponenta, definirana znotraj** strani (⚠️ `04` D22); izriše predloge z označeno vrstico. |
| 962-1020 | `DataTable` – prav tako znotraj; tabela `min-width: 1500px` (vodoravno drsenje), glava s klikom za sortiranje (`ArrowUpDown`), številska polja `toFixed(2)`, stolpec »Akcije« `sticky right-0` (ostane viden pri drsenju), gumba Uredi/Izbriši. |
| 1022-1491 | Izris: opozorilo demo načina; kartica obrazca s `Tabs` (6 zavihkov: Osnovni podatki, Pogodba, VLG & Provizija, Odločba, Zahtevki, Povzetek); vsak vnos `value={formData.X \|\| ""}` + `onChange={e => handleInputChange("X", e.target.value)}`; formulska polja imajo `onKeyDown`, `onBlur` (skrij seznam), `placeholder="npr. vlg * 0.8"`, `autoComplete="off"`; zavihek Zahtevki je **zanka** `[1,2,3,4,5].map(num => …)` z dinamičnimi imeni polj (`ZAH${num}`, `Gotovina_${num+2}`, `Status_${num+2}` – ker sta `Gotovina_1/2` in `Status_1/2` že za VLG/ODL); Povzetek: `SKUPAJ`, `Izplacano`, `KONTROLA` samo za branje, `Status_8`. Gumba »Dodaj/Posodobi stranko« in »Prekliči urejanje«. Nato kartica seznama s `FiltersAndSearch` + `DataTable`. |
| 1493-1501 | `CustomersPage` = `ProtectedRoute` + `Suspense` + vsebina. |

### Primer, ki ga znaš izračunati na pamet
Vnos: `VLG = 1000`, `Provizija = 0.15`, `ODL = "vlg * 0.8"` → ODL = 800, `ODL_z_DDV = 976`; `ZAH1 = "odl / 2"` → 400, `ZAH1_z_DDV = 488`; `ODL_izplacano = 400` → `Izplacano = 400`; `SKUPAJ = 800 + 400 = 1200`; `KONTROLA = 1000 + 400 × 0.15 = 1060`. (Mock podatki v 439-505 so podobni – preveri, da jih znaš razložiti: tam `KONTROLA = 1180 = 1000 + 1200 × 0.15`.)

### Kaj se **ne** shrani (ponovi F4)
`POST/PUT /api/customers` zapišeta le `Stranka, Naslov, Kraj_postna_st, email, ID_DDV, Ukrep, JR, Pogodba, VLG, VLG_z_DDV, Gotovina_1, Status_1, Racun_izdal_1, Opomba_Ponudba, Provizija`. Vse iz zavihkov Odločba, Zahtevki, Povzetek se izgubi ob osvežitvi. Popravek: `04` E11.

---

## 12. Baza računov (ledger) – `app/invoices/ledger/page.tsx`

### Ideja
Excelu podoben pregled: računi po mesecih (ali cel letnik po mesecih), s stolpci brez DDV / DDV / znesek / številka / datum / valuta / **plačano** (uredljivo) / neplačano (izračun) / **opombe** (uredljivo) / Shrani. Vsote pod vsakim mesecem in letne.

| Vrstice | Razlaga |
|---|---|
| 11-14 | `MONTHS` – slovenska imena (indeks 0 = Januar, kot `Date.getMonth()`). |
| 16-17 | `LocalEdit = { paidAmount, notes }`, `ViewMode = "month" \| "year"`. |
| 19-33 | `parseAmount(val)`: odstrani presledke; če ima **vejico in piko** → pika je tisočica (odstrani), vejica → pika; če le vejica → pika; `parseFloat`; `NaN → 0`. Razume `1.234,56`, `1234,56`, `1234.56`. ⚠️ `1,234.56` (angleški zapis) → `1.23456` … `1234.56`? Ne: vejica+pika → odstrani pike → `1,23456` → `1.23456`. Napačno za angleški zapis – sprejemljivo (slovenski uporabnik). |
| 35-76 | `EditableCell({ value, type, onSave })`: dva načina – prikaz (`<span onClick>`; `local \|\| "—"`) in urejanje (`<input autoFocus>`); `useEffect([value])` sinhronizira lokalno kopijo, ko se od zunaj spremeni; **shrani** ob `onBlur` in Enter, **prekliči** ob Escape (povrne `value`). To je lokalna potrditev – še ne v bazo. |
| 79-82 | `parseInvoiceNumber("2024-001")` → `2024001` (vse ne-števke odstrani) – za sortiranje. ⚠️ `RAC-2024-1` in `2024-01` dasta isto → nedeterministično; dovolj za konsistentno številčenje. |
| 84-85 | `fmt` – `de-DE`, 2 decimalki. |
| 87-110 | Inline slogi tabele (`TABLE_STYLE`, `TH_STYLE`, `TD_STYLE`) – ne Tailwind, ker so bile vrednosti fino nastavljene (12 px Arial, tanki robovi) za gost, »excelovski« videz. |
| 112-123 | Stanje: `invoices`, `loading`, `saving` (ID računa, ki se shranjuje – onemogoči le njegov gumb), `viewMode`, `year`, `month` (privzeto trenutni), `localEdits` (slovar po ID-ju). |
| 125-157 | Nalaganje s `cancelled` (`04` C6); inicializira `localEdits` iz `paidAmount ?? 0`, `notes ?? ""`. |
| 159-167 | `prevMonth/nextMonth` – prehod čez december/januar spremeni leto. |
| 169-176 | `handlePaidChange` (niz → `parseAmount` → število), `handleNotesChange` – v `localEdits`. |
| 178-194 | `handleSave(id)` – `updateInvoicePayment` → posodobi `invoices` (tudi `unpaidAmount`) → `saving = null`. |
| 197-204 | `monthInvoices` – `useMemo`: filtriraj po letu in mesecu `issueDate`, sortiraj po `parseInvoiceNumber`. |
| 207-216 | `yearData` – 12 praznih polj (`Array.from({ length: 12 }, () => [])` – **ne** `new Array(12).fill([])`, ker bi to delilo isto polje!), razporedi račune po mesecu, sortiraj vsak mesec. |
| 218-230 | `calcTotals(list)` – `reduce` v objekt `{ cena, ddv, znesek, placano, neplacano, count }`; plačano vzame iz `localEdits` (sprotno), `neplacano` reže na `≥ 0` (preplačilo ne zniža vsote). |
| 232-237 | `monthTotals`, `yearTotals` – `useMemo` z `localEdits` v odvisnostih (vsote se spreminjajo med tipkanjem). |
| 239-243 | `quickMonths` – zadnjih 24 mesecev za `<select>` (`new Date(y, m - i, 1)` – JS normalizira negativne mesece). |
| 245-248 | `availableYears` – iz podatkov, padajoče. |
| 251-311 | `renderInvoiceRow(inv)` – `unpaid = max(0, total − paid)`; `isPaid = unpaid <= 0`; `isPartial = paid > 0 && !isPaid`; ozadje zeleno/rumeno/belo; celice; »Storitev« = opisi postavk združeni z `, ` ali `serviceDescription`; **Plačano** = `EditableCell` (prazno, če 0); **Neplačano** rdeče/zeleno s `✓`; **Opombe** = `EditableCell`; gumb Shrani (ikona `Save`, med shranjevanjem `...`). ⚠️ 264/270 `color: "oklch"` (neveljavno). |
| 313-326 | `renderTotalsRow(totals, label, bg)` – vrstica vsot s `colSpan`. |
| 328-345 | Glava tabele (12 stolpcev; `Plačano` zeleno, `Neplačano` rdeče ozadje). |
| 347-571 | Izris: glava strani s preklopom Mesec/Letni pregled; v mesečnem načinu `<select>` zadnjih 24 mesecev + ◀ ▶; v letnem `<select>` let + ◀ ▶; 5 statističnih kartic (računi, brez DDV, z DDV, plačano zeleno, neplačano rdeče); tabela: mesečni pogled (vrstice + vsota) ali letni (za vsak mesec z računi: naslovna vrstica, vrstice, vsota meseca; na koncu temna vrstica »LETNI SKUPAJ«); namigi pod tabelo. ⚠️ 509 fragment brez `key` (F13). |

### Vprašanja, ki jih tu pričakuj
- »Zakaj plačano ni takoj shranjeno ob `onBlur`?« – Namerno: uporabnik lahko popravi več celic in shrani; manj klicev; jasna potrditev. Alternativa: samodejno shranjevanje z `debounce`.
- »Kaj če je `paid > total`?« – `unpaid` 0, vrstica zelena, vsota `placano` vključuje preplačilo. Ni opozorila.
- »Zakaj mesec po `issueDate` in ne `created_at`?« – DDV obdobje se veže na datum izdaje/storitve.

---

## 13. Mrtva koda in ostanki (poznaj jih, da te ne presenetijo)

| Datoteka | Status | Kaj bi rekel komisiji |
|---|---|---|
| `components/document-form.tsx` | neuporabljena | Poskus generičnega obrazca (`type: 'invoice' \| 'quote' \| 'credit-note' \| 'contract'`), s `Select` stranke namesto avtodopolnjevanja in 14-dnevno valuto. Opuščen v korist treh specializiranih obrazcev. |
| `components/customer-form.tsx`, `customer-table.tsx` | neuporabljeni, **ne prevedeta se** (uvoz `Customer` iz `@/app/page`) | Prva verzija modula strank (4 zavihki, tabela s skrivanjem stolpcev in straničenjem 10/stran, gumb »Izvozi« brez funkcije). Nadomeščena z `app/customers/page.tsx`. Vsebuje isto logiko izračunov (`calculateDerivedValues`) – dokaz, da je bila logika prenesena. |
| `components/theme-provider.tsx` | neuporabljen | Ovoj `next-themes`; temna tema ni vklopljena. |
| `hooks/use-toast.ts`, `components/ui/use-toast.ts`, `components/ui/toaster.tsx`, `sonner.tsx` | neuporabljeni | Sistem obvestil – aplikacija uporablja `alert()`/`confirm()`. Nadgradnja: zamenjaj `alert` s `toast`. |
| `hooks/use-mobile.ts`, `components/ui/use-mobile.tsx` | neuporabljena | `matchMedia` hook za < 768 px. |
| `styles/globals.css` | podvojen `app/globals.css` | Ostanek predloge; uporablja se `app/globals.css` (uvoz v `layout.tsx:4`). |
| `components/ui/*` (≈40 od 50) | neuporabljene | shadcn/ui paket; uporabljenih 10. |
| `app/api/send-email/route.ts` | neuporabljena | Simulacija; mesto za pravo pošiljanje. |
| `lib/email-service*.ts` → `send*Email` | neuporabljene (uvožene) | Načrtovana strežniška pot; `openEmailClient` je dejanska. |
| `app/invoices/page.tsx` → `generateNewInvoiceNumber`, `handleSendEmail` | neuporabljeni | Samodejno številčenje je bilo zamišljeno, a opuščeno (uporabnik vpiše številko sam). |
| `lib/database.ts` → `createCustomer`, `updateCustomer`, uvoz `query` | neuporabljeni | Stran strank kliče `fetch` neposredno. |
| `reference/original-frontend.html` | referenca | Prvotna aplikacija (glej `04` A5). |
| `public/placeholder-*` | neuporabljene | Predloga. |

---

## 14. Tokovi od konca do konca (za zagovor – povej brez gledanja)

### T1. Prijava
`/login` → `handleSubmit` → `POST /api/auth/login` `{username, password}` → strežnik: env preverjanje → `username === ADMIN_USERNAME` → `bcrypt.compare` → `jwt.sign` (30 d) → `{ token, user }` → `AuthContext.login`: `localStorage.token`, `setUser`, `router.push('/')` → `/` se izriše: `AuthProvider` efekt (`pathname` = `/`) → `checkAuth` → `POST /api/auth/verify` → `valid` → `ProtectedRoute` pokaže vsebino.

### T2. Nov račun do PDF-ja
`/invoices` → `loadData` (2 vzporedna GET) → obrazec → `handleSubmit` (validacija, `Invoice`) → `handleInvoiceCreate` → `saveInvoice` → `POST /api/invoices` → preverjanje številke → `INSERT Invoices` → `insertId` → N × `INSERT InvoiceItems` → odgovor z `id` → `currentInvoice`, `showPreview` → `InvoicePreview` → »Prenesi PDF« → `onDownload` → `downloadInvoicePDF` → `downloadInvoicePDFFromPreview` → ima `id` → `GET /api/invoices/{id}/pdf` → strežnik: poizvedba za ime → Playwright: `goto /invoices/print/{id}` (⚠️ auth) → `waitForSelector` → `emulateMedia(print)` → pisave/slike → `page.pdf(A4)` → `Content-Disposition` → odjemalec `blob` → `downloadBlob`. Ob napaki: `generateInvoicePDFFromElement` (html2canvas → jsPDF) → `downloadBlob`.

### T3. Urejanje računa
Seznam »Uredi« → `router.push('/invoices?edit=ID')` → efekt(a) `[searchParams]` → `loadInvoiceForEdit` (vsi računi → `find`) → `editingInvoice` → obrazec efekt `[editingInvoice]` napolni polja (⚠️ efekt `[issueDate]` prepiše valuto) → oddaja → `updateInvoice` → `PUT /api/invoices/ID` → `UPDATE` glava, `DELETE` postavke, `INSERT` postavke → predogled.

### T4. »Shrani kot nov«
`view` → `/invoices?edit=ID&saveAs=true` → `editingInvoice` + `saveAsMode` → obrazec izprazni številko → oddaja z `isSaveAs = true` → `saveInvoice` (POST, nov zapis) → predogled nove kopije.

### T5. E-pošta
Predogled »Pošlji po e-pošti« → `openEmailClient(invoice)` → e-pošta stranke (ali `alert`) → če `draft`: `PUT /api/invoices/ID/status {sent}` → sestavi subject/body → `window.open('mailto:…')` → uporabnik v poštnem odjemalcu ročno pripne PDF.

### T6. Ledger – vpis plačila
`/invoices/ledger` → `fetchInvoices` → `localEdits` → klik na celico Plačano → `EditableCell` → Enter/blur → `handlePaidChange` (`parseAmount`) → vsote se preračunajo (`useMemo` z `localEdits`) → »Shrani« → `updateInvoicePayment` → `PUT /api/invoices/ID/payment {paid_amount, notes}` → `UPDATE … NOW()` → lokalno `invoices` posodobljen.

### T7. Stranka s formulo
`/customers` → `loadCustomers` (ali mock) → zavihek Odločba → tipkanje `vl` → `handleFieldAutocomplete` predlaga `vlg`, `vlg_z_ddv` → Tab → `selectFieldSuggestion` → `vlg ` → tipkanje `* 0.8` → `handleInputChange` → `calculateFormula` (zamenjava `vlg` → `1000`, bela lista, `eval("1000 * 0.8")`) → `updateCalculations` (DDV, SKUPAJ, Izplacano, KONTROLA) → »Dodaj stranko« → `POST /api/customers` (⚠️ 15 stolpcev) → seznam.

---

## 15. Kako se učiti do zagovora (načrt)

1. **Dan 1:** `05-1` §0–2 (pojmi, konfiguracija, baza) + napiši `query` in `getPool` na pamet.
2. **Dan 2:** §3–5 (avtentikacija, podatkovna plast, API) + nariši tok T1 in T2 na papir brez gledanja.
3. **Dan 3:** `05-2` §6–8 (ogrodje, obrazec, predogled, PDF) + ročno sledi `generateInvoicePDFFromElement` po korakih.
4. **Dan 4:** §9–10 + `05-3` §11 (e-pošta, razlike modulov, stranke) + izračunaj primer KONTROLA na pamet.
5. **Dan 5:** §12–14 (ledger, mrtva koda, tokovi) + popravi napake iz `06` (vsaj F1, F2, F4, F5, E1) in jih znaj razložiti.
6. **Dan 6:** `04` v celoti kot simulacija: naj te nekdo sprašuje naključna vprašanja; odgovori v 60 s.
7. **Dan 7:** demo v živo po scenariju G (poskusi vse pasti sam).

*Konec študija kode. Seznam napak in popravkov: `06-napake-popravi-pred-zagovorom.md`.*
