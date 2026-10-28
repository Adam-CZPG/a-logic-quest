# Logic Quest

Matematik va mantiqiy jumboqlar o'yini. 120 ta daraja, yulduzchalar, medallar va "Logic Mode" rasmli jumboqlari. Interfeys 4 tilda: English, Русский, Čeština, Nederlands.

O'yin to'liq brauzerda ishlaydi: server, login yoki ma'lumotlar bazasi kerak emas. Progress har bir qurilmaning `localStorage`ida saqlanadi.

## Ishga tushirish

Kerak: [Node.js](https://nodejs.org/) 20 yoki undan yangi.

```bash
npm install
npm run dev
```

Brauzerda terminal ko'rsatgan manzilni oching (odatda http://localhost:5173).

## Build

```bash
npm run build     # tayyor sayt dist/ papkasiga chiqadi
npm run preview   # build natijasini lokal ko'rish
```

`dist/` papkasini istalgan statik hostingga joylash mumkin (Netlify, Vercel, GitHub Pages, Cloudflare Pages). Sahifalar `react-router` orqali ishlagani uchun hostingda barcha manzillarni `index.html`ga yo'naltirish (SPA fallback) yoqilgan bo'lishi kerak.

## Tuzilma

- `src/pages/` – sahifalar: `Home`, `Game` (raqamli jumboq), `LogicGame` (mantiq rejimi), `Achievements`
- `src/lib/gameEngine.js` – darajalarni yaratish va tekshirish
- `src/lib/logicEngine.js` – mantiq jumboqlari
- `src/lib/progress.js` – progress va medallar (`localStorage`)
- `src/lib/i18n.js` – tarjimalar
- `src/lib/sfx.js` – ovoz va tebranish
- `src/components/ui/` – shadcn/ui komponentlari

## Texnologiyalar

React 18, Vite, Tailwind CSS, Framer Motion, shadcn/ui.
