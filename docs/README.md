# Dokumentacija – Računko

Ta mapa vsebuje celovito dokumentacijo aplikacije **Računko** (sistem za izdajanje računov, ponudb in dobropisov ter vodenje strank za 2KM Consulting d.o.o.).

## Vsebina

| Datoteka | Kaj vsebuje |
|---|---|
| [`01-dokumentacija-aplikacije.md`](./01-dokumentacija-aplikacije.md) | **Celovit opis delovanja** – vsak del kode razložen po domače in razvojno, z diagrami poteka (Mermaid), opisom baze, API-jev, avtentikacije, PDF, e-pošte in vseh modulov. |
| [`02-diplomsko-porocilo.md`](./02-diplomsko-porocilo.md) | **Diplomsko poročilo** – povzetek, abstract, uvod, analiza zahtev, načrtovanje, implementacija, testiranje, rezultati, sklep, viri. Pripravljeno kot predloga za diplomsko delo. |
| [`03-vprasanja-za-zagovor.md`](./03-vprasanja-za-zagovor.md) | **Vprašanja za zagovor** z modelnimi odgovori (10 sklopov: splošno, arhitektura, baza, varnost, DDV, PDF, komponente, testiranje, nadaljnji razvoj, pojmi) + nasveti za predstavitev. |

## Hiter pregled aplikacije

- **Frontend + backend:** Next.js 15 (App Router), React 18, TypeScript
- **Baza:** MySQL (mysql2, connection pool, parametrizirane poizvedbe)
- **Avtentikacija:** JWT + bcrypt (en administrator, okoljske spremenljivke)
- **Dokumenti:** računi, ponudbe, dobropisi (glava + postavke, status, samodejni DDV 22 %)
- **PDF:** strežniško (Playwright) z rezervo v brskalniku (jsPDF + html2canvas)
- **Analitika:** »Baza računov« – spremljanje plačil po mesecih in letih

> Diagrami so zapisani v sintaksi **Mermaid** in se na GitHubu izrišejo samodejno.
