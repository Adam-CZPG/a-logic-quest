# Logic Quest — přijímačky 5 · 7 · 9

Gimnaziya va o'rta maktabga kirish imtihoniga (CERMAT jednotná přijímací zkouška) tayyorlov ilovasi. Web va Android (APK) — bitta kod.

- **Chexiya rejimi:** matematika + chex tili va adabiyoti, 5 / 7 / 9-sinflar uchun alohida.
- **Xalqaro rejim:** faqat matematika — butun dunyo uchun, 14 tilda.
- **To'liq testlar ("celý test"):** har bir fan va sinf uchun 10 seriya × 4 variant = **40 ta test**, har biri CERMAT formatida: 50 ball, matematika 70 daqiqa, chex tili 60 daqiqa.
- **Mavzular ("skupiny úloh"):** TAU'dagi kategoriyalar (Číslo a početní operace, Převody jednotek, Geometrie v rovině, Osová souměrnost …) — har biri cheksiz yangi savollar beradi.
- **Ikki rejim** (TAU kabi): *Simulace* — taymer, xatoni tuzatib bo'lmaydi; *Procvičování* — darhol tekshirish, xatoni tuzatish, yechim.
- **Bugungi reja:** har kuni har bir fandan 3 tadan savol (eng zaif mavzular birinchi), kunlik eslatma bildirishnomasi (Android).
- **Xatolar ustida ishlash**, XP / daraja, ketma-ket kunlar, nishonlar, statistika.
- **Rasmiy CERMAT testlari (2015–2024)** — ular CERMAT'ga tegishli, shuning uchun ilova ularni nusxalamaydi, balki TAU'da ochadi.
- **Test to'plamlarini import qilish** (JSON) — o'qituvchi testlari yoki ruxsat olingan materiallar uchun. Format: [CONTENT.md](CONTENT.md).
- Eski "Logic Quest" jumboq o'yinlari "Hry / Games" bo'limida qoldi.

Tillar: čeština, English, українська, o'zbekcha, русский, Deutsch, español, français, português, polski, Türkçe, 中文, हिन्दी, العربية (RTL).

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
- `src/exam/packs.js` – JSON test to'plamlarini import qilish
- `src/i18n/locales/*.js` – 14 til (`en.js` — asosiy)
- `src/pages/` – Onboarding, Home, Subject, Player, Stats, Settings + eski o'yinlar
- `android/` – Capacitor Android loyihasi
- `.github/workflows/android.yml` – APK'ni bulutda yig'ish

## Huquqiy eslatma

Ilova CERMAT bilan bog'liq emas. Rasmiy testlar CERMAT'ning mualliflik huquqi bilan himoyalangan va [tau.cermat.cz](https://tau.cermat.cz) da bepul. Ularni ilovaga import qilish uchun CERMAT'dan ruxsat oling.
