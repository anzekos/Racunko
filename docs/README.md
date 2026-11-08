# Dokumentacija – Računko

Ta mapa vsebuje celovito dokumentacijo aplikacije **Računko** (sistem za izdajanje računov, ponudb in dobropisov ter vodenje strank za 2KM Consulting d.o.o.).

## Vsebina

| Datoteka | Kaj vsebuje |
|---|---|
| [`01-dokumentacija-aplikacije.md`](./01-dokumentacija-aplikacije.md) | **Celovit opis delovanja** – vsak del kode razložen po domače in razvojno, z diagrami poteka (Mermaid), opisom baze, API-jev, avtentikacije, PDF, e-pošte in vseh modulov. |
| [`02-diplomsko-porocilo.md`](./02-diplomsko-porocilo.md) | **Diplomsko poročilo** – povzetek, abstract, uvod, analiza zahtev, načrtovanje, implementacija, testiranje, rezultati, sklep, viri. Pripravljeno kot predloga za diplomsko delo. |
| [`03-vprasanja-za-zagovor.md`](./03-vprasanja-za-zagovor.md) | **Vprašanja za zagovor** z modelnimi odgovori (10 sklopov: splošno, arhitektura, baza, varnost, DDV, PDF, komponente, testiranje, nadaljnji razvoj, pojmi) + nasveti za predstavitev. |
| [`04-komisija-strogi-zagovor.md`](./04-komisija-strogi-zagovor.md) | **Stroga komisija** – simulacija zagovora, ki preverja avtorstvo: »pokaži v kodi« (28 lokacij), »razloži vrstico po vrstici« (8 odsekov), »zakaj tako« (22 odločitev), »napiši kodo« (14 nalog z rešitvami), »najdi napako« (20 resničnih napak), pasti v živo, hitri test. Odgovori so skriti v razdelkih »Kaj mora odgovor vsebovati«. |
| [`05-studij-kode-1-jedro.md`](./05-studij-kode-1-jedro.md) | **Študij kode 1/3** – pojmi (TS/React/Next), konfiguracija, baza in `db-connection.ts`, avtentikacija, `lib/database.ts`, vse API poti – razloženo po vrsticah, z »zakaj« in »če odstraniš«. |
| [`05-studij-kode-2-ui-pdf-email.md`](./05-studij-kode-2-ui-pdf-email.md) | **Študij kode 2/3** – lupina strani, obrazec in predogled računa, strani (nov/seznam/ogled/print), generiranje PDF (Playwright + html2canvas/jsPDF), e-pošta, tabela razlik ponudbe/dobropisi. |
| [`05-studij-kode-3-stranke-ledger-tokovi.md`](./05-studij-kode-3-stranke-ledger-tokovi.md) | **Študij kode 3/3** – modul strank (formule, `eval`, avtodopolnjevanje, filtri), baza računov (ledger), mrtva koda, sedem tokov od konca do konca, tedenski učni načrt. |
| [`06-napake-popravi-pred-zagovorom.md`](./06-napake-popravi-pred-zagovorom.md) | **Napake in popravki** – 32 preverjenih pomanjkljivosti po prioriteti (sesutja, izguba podatkov, nezaščiten API, tipi), vsaka s popravkom; izpis `tsc` kot dokaz; predlagan vrstni red popravkov. |

## Hiter pregled aplikacije

- **Frontend + backend:** Next.js 15 (App Router), React 18, TypeScript
- **Baza:** MySQL (mysql2, connection pool, parametrizirane poizvedbe)
- **Avtentikacija:** JWT + bcrypt (en administrator, okoljske spremenljivke)
- **Dokumenti:** računi, ponudbe, dobropisi (glava + postavke, status, samodejni DDV 22 %)
- **PDF:** strežniško (Playwright) z rezervo v brskalniku (jsPDF + html2canvas)
- **Analitika:** »Baza računov« – spremljanje plačil po mesecih in letih

> Diagrami so zapisani v sintaksi **Mermaid** in se na GitHubu izrišejo samodejno.
>
> **Priporočen vrstni red učenja:** `05-1` → `05-2` → `05-3` → popravi `06` → vadi z `04` (in `03`).
