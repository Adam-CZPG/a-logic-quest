# TryFixPass (GBLine Technology) — imtihonga tayyorlov (Chexiya · Slovakiya · Germaniya · butun dunyo)

Maktab imtihonlariga tayyorlov ilovasi. Web va Android (APK) — bitta kod. Barcha topshiriqlar o'zimizniki yoki ilova tomonidan yaratiladi; ilova hech qaysi imtihon tashkiloti bilan bog'liq emas.

- **🇨🇿 Chexiya:** gimnaziyaga qabul (5 / 7 / 9-sinf) — matematika + chex tili, qo'shimcha ingliz tili.
- **🇩🇪 Germaniya:** Bundesland tanlanadi; 4-sinf (gimnaziyaga o'tish: Probeunterricht / Eignungstest / tavsiya) va 10-sinf (MSA, ZP10 …) — Mathe, Deutsch, Englisch.
- **🇸🇰 Slovakiya:** 5-sinf (8 yillik gimnaziya qabuli) va 9-sinf (Testovanie 9 / o'rta maktab qabuli) — matematika, slovak tili, ingliz tili.
- **🌍 Boshqa davlatlar:** matematika + ingliz tili.
- **Ingliz tili** CEFR darajasida: 5-sinf → A1, 7 → A2, 9–10 → B1 (grammatika, zamonlar, lug'at, muloqot, o'z matnlarimiz bilan o'qish).
- **To'liq testlar:** har fan va sinf uchun 40 ta (4 daraja × 10), har biri 50 ball. **Mavzular:** har mavzuda 5 ta to'plam.
- **Yashil progress:** yechilgan test/to'plam yashil bo'ladi; hammasi yashil bo'lgach yangi "kolo" yangi topshiriqlar bilan boshlanadi (ball va statistika saqlanadi).
- **Ikki rejim:** *Simulyatsiya* (taymer, tuzatishsiz) va *Mashq* (darhol tekshirish, yechim).
- **Bugungi reja:** har fandan 3 tadan savol, kunlik eslatma (Android). Xatolar ustida ishlash, XP, nishonlar, statistika.
- **⚔️ Duel (serversiz):** bola 10 ta savolni yechadi va havolani WhatsApp/Telegram/SMS orqali yuboradi; do'sti xuddi shu savollarni yechadi (ilovasiz, brauzerda ham), natija havola orqali qaytadi. G'olibga 👑 toj, har bir o'yinchida o'z davlati va tili bayrog'i.
- **🏆 Haftalik liga va do'stlar (Supabase):** ixtiyoriy. 30 kishilik guruhlar, XP bo'yicha reyting, eng yaxshi 7 tasi yuqori ligaga (Bronza → Kumush → Oltin → Safir → Olmos), oxirgi 5 tasi pastga. Do'stlarni 6 belgili kod orqali kuzatish. Ism, matn, chat yo'q – faqat hayvon + raqam (masalan «Liška 427»), davlat va til bayrog'i. «Meni ligadan o'chirish» – serverdagi hamma narsa o'chadi.
- **Do'stni taklif qilish:** WhatsApp, Telegram, Viber, SMS yoki telefonning ulashish menyusi orqali.

Interfeys tillari: čeština, slovenčina, українська, English, русский, Deutsch.

**Ma'lumotlar yangilanishda saqlanadi:** GitHub'dagi test APK'lari doim bitta ochiq kalit (`android/app/logicquest.keystore`) bilan imzolanadi, shuning uchun yangi test versiya eskisining ustiga o'rnatiladi va bolaning ismi va natijalari o'chmaydi.

## Google Play

- Ilova ID: **`com.gbline.gbexam`** (birinchi yuklashdan keyin o'zgarmaydi).
- Play uchun `.aab` fayl **yopiq upload kalit** bilan imzolanadi. U repoda emas, faqat GitHub Secrets'da saqlanadi: `UPLOAD_KEYSTORE_BASE64`, `UPLOAD_KEYSTORE_PASSWORD`, `UPLOAD_KEY_ALIAS`, `UPLOAD_KEY_PASSWORD`. Secret qo'yilgach `v*` tegi yoki qo'lda ishga tushirish (Actions → Run workflow) `TryFixPass-*.aab` faylini yaratadi.
- Kalit yaratish (bir marta, o'z kompyuteringizda): `keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`, so'ng `base64 -w0 upload.jks` natijasini `UPLOAD_KEYSTORE_BASE64` ga qo'ying. `upload.jks` va parolni xavfsiz joyda saqlang.
- Play Console'da **Play App Signing** yoqiladi: Google asosiy kalitni o'zi saqlaydi, upload kalit yo'qolsa uni Google orqali almashtirish mumkin.
- Eski boshqotirma o'yinlari (Logic Quest) TryFixPass'dan olib tashlangan – ular MAT MATSTERFA ilovasiga ko'chiriladi (`src/pages/MOVED-GAMES.md`).

## Savollar qayerdan keladi va nega doim to'g'ri

Barcha savollar original. Matematika savollari kod orqali yaratiladi va **javobni kod hisoblaydi** — qo'lda yozilgan javob yo'q, shuning uchun xato bo'lmaydi. Chex tili savollari tekshirilgan so'z ro'yxatlari (vyjmenovaná slova, vzory, slovní druhy …) va qo'lda yozilgan original matnlardan olinadi.

`npm run selftest` har bir sinf, mavzu va tilda ~30 000 ta savol yaratib tekshiradi: javob variantlari to'g'ri, to'g'ri javob qabul qilinadi, noto'g'risi qabul qilinmaydi, har bir test aynan 50 ball, tarjimalarda hech bir kalit tushib qolmagan.

## Ishga tushirish (web)

Kerak: [Node.js](https://nodejs.org/) 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run selftest   # barcha savollarni tekshirish
npm run build      # tayyor sayt dist/ papkasida
```

## Android APK

**Eng oson yo'l — GitHub o'zi yig'adi.** Har bir `git push`dan keyin GitHub → *Actions* → *Android APK* → oxirgi ishga tushish → pastda **Artifacts → LogicQuest-apk**. ZIP ichidagi `.apk` faylni telefonga o'tkazib o'rnating ("noma'lum manbalardan o'rnatish"ga ruxsat bering).

Versiya chiqarish: `git tag v2.0.0 && git push --tags` — APK *Releases* sahifasida paydo bo'ladi.

**Kompyuterda yig'ish** (Android Studio + JDK 21 kerak):

```bash
npm run android:sync   # web'ni yig'ib android/ ga ko'chiradi
npm run android:open   # Android Studio'da ochadi → Run ▶
```

## Tuzilma

- `src/exam/taxonomy.js` – sinflar, fanlar, mavzular, test rejalari (har biri 50 ball)
- `src/exam/generators/math.js` – matematika generatorlari (5/7/9)
- `src/exam/generators/czech.js` – chex tili: so'z ro'yxatlari, original matnlar
- `src/exam/engine.js` – testlar, mavzu to'plamlari, kunlik reja
- `src/exam/checker.js` – javobni tekshirish (2,5 = 2.5 = 5/2; ANO/NE qisman ball)
- `src/exam/stats.js` – XP, ketma-ketlik, statistika, xatolar, nishonlar
- `src/i18n/locales/*.js` – 14 til (`en.js` — asosiy)
- `src/pages/` – Onboarding, Home, Subject, Player, Stats, Settings + eski o'yinlar
- `android/` – Capacitor Android loyihasi
- `.github/workflows/android.yml` – APK'ni bulutda yig'ish

## Huquqiy eslatma

Chexiya bo'limidagi testlar CERMAT standarti bo'yicha namunaviy testlar: format bir xil, topshiriqlar esa to'liq o'zimizniki. CERMAT'ning asl testlarini ilovaga (masalan, test to'plami sifatida) qo'shish kerak bo'lsa, avval ulardan ruxsat oling.


## Duel havolalari (GitHub Pages)

Duel havolasi `https://adam-czpg.github.io/a-logic-quest/#/d?d=…` ko'rinishida bo'ladi. Bu sahifa faqat duel uchun (`VITE_WEB_DUEL=1`) – qolgan imkoniyatlar faqat ilovada.
Bir martalik sozlash: GitHub → repo → **Settings → Pages → Source: GitHub Actions**. Shundan keyin `main` ga har bir push sahifani avtomatik yangilaydi (`.github/workflows/pages.yml`).
Ilova o'rnatilgan telefonda `gbexam://d?d=…` havolasi to'g'ridan-to'g'ri ilovani ochadi.


## Liga serveri (Supabase)

Loyiha: `kids-language-game` (tashkilot `gbline-ai`), alohida `gbexam` sxemasi – boshqa ilovaning ma'lumotlariga tegilmaydi.
- Jadvallar: `gbexam.players`, `gbexam.weekly`, `gbexam.follows` – ilovadan to'g'ridan-to'g'ri o'qib/yozib bo'lmaydi (RLS, ruxsat yo'q).
- Ilova faqat `public.gbexam_*` funksiyalarini chaqiradi; har biri telefonning maxfiy kalitini tekshiradi.
- Himoyalar: bir chaqiruvda ≤ 600 XP, kuniga ≤ 3000 XP; daqiqasiga ≤ 60 yangi o'yinchi; 100 tadan ortiq follow yo'q.
- Ilova kodidagi kalit (`sb_publishable_…`) ochiq bo'lishi mumkin – u faqat shu funksiyalarni chaqira oladi.
