# Test to'plami formati (JSON)

Ilovada: **Sozlamalar → Test to'plamlari → To'plam yuklash**. To'liq misol: [`content-packs/example-pack.json`](content-packs/example-pack.json).

```json
{
  "name": "To'plam nomi",
  "questions": [ ... ],   // mavzular ("skupiny úloh") ichiga qo'shiladi
  "tests": [ ... ]        // "celý test" bo'limida alohida test bo'lib chiqadi
}
```

## Savol maydonlari

| Maydon | Majburiy | Izoh |
|---|---|---|
| `subject` | ✓ | `"math"` yoki `"czech"` |
| `type` | ✓ | `choice`, `number`, `text`, `tf`, `match` |
| `text` | ✓ | savol matni |
| `topic` | | mavzu id: `cislo`, `zlomky`, `slovni`, `jednotky`, `grafy`, `umernost`, `procenta`, `vyrazy`, `rovina`, `prostor`, `konstrukce`, `aplikace`, `soumernost`, `pravopis`, `tvaroslovi`, `skladba`, `slovni_zasoba`, `porozumeni`, `sloh`, `literatura` |
| `grade` yoki `grades` | | `7` yoki `[5, 9]` (oraliq) |
| `points` | | ball (standart 1) |
| `context` | | "Výchozí text k úloze" — umumiy matn |
| `group` | | bir xil `group` + `context` → 4.1, 4.2 … raqamlanadi |
| `source` | | matn manbasi (kontekst ostida) |
| `explain` | | yechim (mashq rejimida ko'rsatiladi) |
| `prefix`, `unit` | | javob maydoni oldidan / keyin: `"o"` … `"litrů"` |

## Turlar bo'yicha `answer`

- **choice** — `options: [...]`, `answer`: to'g'ri variant indeksi (0 = A).
- **number** — `answer`: son yoki sonlar ro'yxati. Bola `2,5`, `2.5` yoki `5/2` yozsa ham qabul qilinadi. `tolerance` ixtiyoriy.
- **text** — `answer`: qabul qilinadigan javoblar ro'yxati. Katta-kichik harf va bo'shliqlar hisobga olinmaydi, diakritika (č, ř, ů) esa hisobga olinadi. Bir nechta so'z vergul bilan: `"brzy, smáli"`.
- **tf** — `statements: [...]`, `answer: [true, false, …]`. CERMAT kabi: hammasi to'g'ri → to'liq ball, bitta xato → 1 ball kam.
- **match** — `left: [...]`, `right: [...]`, `answer`: har bir chap element uchun o'ngdagi indeks.

## Test (`tests`) maydonlari

`title`, `subject`, `grade`, `minutes` (ixtiyoriy — bo'lsa simulyatsiya rejimi taymer bilan), `questions`.
