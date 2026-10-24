```
name: hookya-master-script-engine
```

```
description: "Master Skill untuk merombak kualitas copywriting lisan, logika
pemisahan Voice DNA vs Konteks Niche, kualitas asesmen Tahap 1-3, dan sistem
Dynamic Story Beats (3-8 bagian dinamis) berdasarkan durasi di aplikasi Hookya
(hookya.site)."
allowed-tools: Read Write Edit Glob Grep
```

```
# hookya-master-script-engine
```

```
> Master Rules untuk Copywriting, Alur Asesmen, & Dynamic Story Beats di
Aplikasi Hookya (`PersonaDNAView.js`, `ScriptProducerView.js`,
`VideoExtractorView.js`)
```

```
> Gunakan skill ini saat memperbarui logika prompt AI, struktur JSON naskah, dan
tampilan kartu skrip di Hookya. **ATURAN MUTLAK UI:** Pertahankan 100% palet
warna dan tema visual yang sudah ada di aplikasi saat ini. Jangan mengubah skema
warna yang sudah disukai pemilik produk.
```

```
## PILAR 1: Aturan Bahasa Lisan Kamera (Anti-Slop Bahasa Indonesia)
```

```
Semua teks yang dihasilkan AI (baik di opsi kartu Asesmen Tahap 1–3 maupun
Naskah Akhir Tahap 4) **WAJIB** menggunakan bahasa lisan manusia Indonesia saat
berbicara di depan kamera TikTok/Reels/Shorts.
```

```
### 1. Daftar Larangan Keras (FORBIDDEN):
```

```
- **Kalimat Pembuka Terjemahan AI:** *"Pernahkah kamu merasa..."*, *"Bayangkan
jika..."*, *"Di era digital yang serba cepat ini..."*, *"Tahukah kamu
bahwa..."*, *"Halo semuanya, kembali lagi..."*.
```

```
- **Kata Brosur/Kaku:** *Solusi terbaik, inovatif, berkualitas tinggi, dirancang
khusus, meningkatkan produktivitas, wajib dimiliki, mengubah hidupmu, pengalaman
tak terlupakan*.
- **Struktur Kalimat AI:** *"Bukan sekadar X, tapi juga Y"*, *"Tidak hanya X,
melainkan Y"*, *"Mulai dari A hingga B, dan semuanya"*.
- **Tanda Baca Kaku:** Dilarang menggunakan *em dash* (`—`), titik dua (`:`) di
tengah kalimat ucap, atau kalimat panjang lebih dari 15 kata tanpa jeda
koma/titik.
```

```
### 2. Aturan Jeda Napas & Kata Sambung Lisan (REQUIRED):
- Setiap kalimat harus enak diucapkan dalam **1 tarikan napas pendek (8–14
kata)**.
```

```
- Gunakan kata sambung obrolan alami di awal kalimat/bagian baru: *"Jujur
ya...", "Soalnya gini...", "Nah, masalahnya tuh...", "Coba deh perhatiin...",
"Makanya kemarin...", "Terus kalau ditanya..."*.
```

```
## PILAR 2: Pemisahan "Voice DNA" vs "Konteks Niche" (Anti-Bocor Topik)
```

```
Untuk mencegah latar belakang profil (misal: profil pasar Hijab) bocor secara
kaku saat user membuat skrip produk/topik lain (misal: bahas Makanan/Kuliner),
pisahkan data `PersonaDNAView.js` menjadi 2 lapis:
```

```
### Lapis 1: Voice DNA (WAJIB DIKUNCI 100% DI SEMUA SKRIP)
Diambil dari `Sampel Kalimat Asli`, `Posisi Bicara`, dan `Gaya Bahasa`:
- **Kata Ganti Orang:** (Aku/Bunda, Gue/Lo, Saya/Teman-teman, Kita/Kalian) harus
konsisten dari awal sampai akhir.
```

```
- **Partikel Lisan:** Tiru partikel khas user (*sih, tuh, kan, deh, lho, banget,
ya*).
```

```
- **Ritme & Sikap Bicara:** Apakah gaya ngobrolnya santai seperti teman, tegas
seperti praktisi, atau antusias seperti reviewer.
```

```
### Lapis 2: Konteks Niche & Target Penonton (KONTEKSTUAL / FLEKSIBEL)
Diambil dari `Latar Belakang/Keunikan Diri`, `Segmen Penonton`, `Masalah Utama
Penonton`, dan `Alasan Ragu`:
```

```
- **Aturan Filter Otomatis di Prompt AI:** Bandingkan terlebih dahulu
`Topik/Produk di Tahap 0` dengan `Niche Profil`.
```

```
  - **Jika SEJALUR (Misal: Profil Hijab & Topik Tahap 0 tentang Bahan
Kerudung):** Gunakan seluruh data psikologi penonton dan latar belakang profil
secara penuh.
```

```
  - **Jika LINTAS TOPIK / BEDA PRODUK (Misal: Profil Hijab, tapi Topik Tahap 0
tentang Makanan/Elektronik):** **ABAIKAN DAN JANGAN SEBUT** atribut niche profil
(jangan sebut kata hijab sama sekali!). Tetap gunakan **Voice DNA (Lapis 1)**
milik user, tetapi alihkan masalah penonton, perumpamaan, dan alasan ragu agar
100% fokus pada produk/topik baru yang sedang dibahas di Tahap 0.
```

```
### Implementasi Saklar 1-Klik di UI Tahap 0 (`ScriptProducerView.js`):
Tambahkan pilihan toggle sederhana di Tahap 0 (tanpa mengubah warna tema):
1. **`🎯 Sesuai Niche Profil` (Default):** Pakai Gaya Bicara + Target Pasar
Profil.
```

```
2. **`🎯 Lintas Produk / Bebas`:** Hanya pakai Gaya Bicara & Sapaan Profil,
sedangkan target pasar dan masalah penonton otomatis menyesuaikan produk/topik
yang dimasukkan saat ini.
```

```
## PILAR 3: Standar Kualitas Opsi Asesmen (Tahap 1 s/d Tahap 3)
```

```
Opsi yang muncul di Tahap 1, 2, dan 3 tidak boleh terdengar seperti rangkuman
materi kuliah, melainkan **kalimat pemicu yang tajam dan konkret**:
```

```
### Tahap 1: 3 Opsi Sudut Pandang (Angle)
Setiap kartu harus memotret gesekan/masalah spesifik di lapangan:
```

```
- **Opsi 1 (Bongkar Kesalahan Umum):** Kebiasaan salah yang sering dilakukan
penonton tanpa sadar.
```

```
- **Opsi 2 (Jalan Pintas / Solusi Praktis):** Cara beresin masalah tanpa
ribet/mahal.
```

```
- **Opsi 3 (Sudut Pandang Berlawanan / Kontras):** Membantah asumsi umum yang
sering bikin rugi.
```

```
### Tahap 2: Perumpamaan, Mekanisme/Fakta, & Solusi Praktis
- **Perumpamaan Sehari-hari:** Wajib menggunakan kejadian harian yang dekat
dengan orang Indonesia (misal: ibarat masak mie kelamaan, ibarat nambal ban
bocor halus, ibarat beli baju kekecilan).
```

```
- **Penjelasan Mekanisme/Fakta:** Gunakan alur **Sebab $\rightarrow$ Akibat
Fisik Nyata** dengan bahasa tongkrongan/harian.
```

```
- **Solusi Praktis:** Langkah konkret yang langsung terbayang cara melakukannya.
- **Khusus Jalur Affiliate (Scan Screenshot Marketplace):** Terjemahkan
spesifikasi kaku dari gambar (misal: *"Bahan Combed 30s, 500ml, baterai
5000mAh"*) menjadi **pengalaman pemakaian nyata** (misal: *"Dipakai naik motor
siang bolong nggak bikin punggung basah karena keringat"*).
```

```
### Tahap 3: Pilihan Alur Pembawaan, 6 Kategori Hook, & 3 CTA
Setiap opsi Hook maksimal 1–2 kalimat pendek (maksimal 3 detik ucap):
```

```
1. **Negative / Warning Hook:** *"Jangan buru-buru [tindakan] kalau belum cek
bagian ini..."*
```

```
2. **Positive Outcome Hook:** *"Cuma modal ubah kebiasaan kecil ini, [masalah]
langsung beres tanpa perlu [hal ribet]."*
```

```
3. **Proof Hook:** *"Ini yang kejadian setelah [waktu/pengalaman nyata] pakai
cara ini buat ngatasin [masalah]."*
```

```
4. **Contrarian Hook:** *"Banyak yang ngira [mitos umum] itu bener, padahal
justru itu yang bikin [masalah makin parah]."*
```

```
5. **Relatable POV Hook:** *"Pasti kesel banget kan pas lagi [situasi harian],
tiba-tiba [masalah kejadian]?"*
```

```
6. **Curiosity Gap Hook:** *"Ternyata biang kerok kenapa [masalah susah hilang]
tuh cuma gara-gara satu hal sepele ini."*
```

```
## PILAR 4: Sistem "Dynamic Story Beats" (Menggantikan 4 Kerangka Kaku)
```

```
**HAPUS** pembatasan kaku 4 kotak (`Hook, Situasi, Cara Kerja, CTA`). Gantikan
dengan sistem **Bagian Dinamis (`sections` array: mulai dari 3 hingga 8
bagian)** yang menyesuaikan **Target Durasi** dan **Gaya Alur**.
```

```
### 1. Aturan Emas Setiap Bagian (Beat):
- Setiap 1 bagian (`section`) **HANYA BOLEH berisi 2–3 kalimat lisan pendek
(durasi baca 10–15 detik)**.
- Jangan pernah membuat 1 kotak berisi paragraf panjang yang melelahkan mata!
- Antar bagian wajib tersambung dengan kata penghubung obrolan sehingga jika
dibaca dari Bagian 1 sampai akhir terasa seperti **satu obrolan utuh yang
mengalir luwes**.
```

```
### 2. Rumus Penyesuaian Jumlah Bagian Berdasarkan Durasi (Duration Scaling):
Saat user memilih durasi di awal ATAU mengubah durasi skrip yang sudah jadi
(misal dari **30 Detik dinaikkan ke 2 Menit**):
- **DILARANG KERAS** hanya memanjangkan kalimat dengan kata-kata bertele-tele di
dalam 4 kotak!
- **WAJIB MENAMBAH JUMLAH BAGIAN (BABAK OBROLAN BARU)** dengan rincian berikut:
```

```
| Target Durasi | Jumlah Bagian (`sections`) | Struktur Babak Obrolan yang
Dibentuk Otomatis |
| :--- | :--- | :--- |
| **15 – 30 Detik** | **3 – 4 Bagian** | 1. Hook Tajam $\rightarrow$ 2. Relate
Masalah Inti $\rightarrow$ 3. Inti Solusi/Bukti Cepat $\rightarrow$ 4. CTA
Singkat |
| **45 – 60 Detik** | **4 – 5 Bagian** | 1. Hook $\rightarrow$ 2.
Situasi/Masalah Harian $\rightarrow$ 3. Perumpamaan/Alasan Logis $\rightarrow$
4. Solusi/Pengalaman Pakai $\rightarrow$ 5. CTA |
| **90 Detik – 2 Menit** | **6 – 7 Bagian** | 1. Hook $\rightarrow$ 2. Cerita
Pemicu/Kejadian Nyata $\rightarrow$ 3. Kesalahan yang Sering Dilakukan Orang $
\rightarrow$ 4. Ibarat/Perumpamaan Sehari-hari $\rightarrow$ 5. Bedah Cara
Kerja/Bukti Produk $\rightarrow$ 6. Menjawab Keraguan Penonton (*"Terus gimana
kalau..."*) $\rightarrow$ 7. Kesimpulan & CTA |
| **2.5 – 3 Menit** | **7 – 8 Bagian** | Sama seperti 2 Menit, ditambah babak:
**Studi Kasus / Perbandingan Sebelum vs Sesudah** dan **Rincian Langkah Praktis
(Step-by-step)**. |
```

```
### 3. Struktur Output JSON Baru untuk Naskah Akhir (Tahap 4 & Pengubah Durasi):
```json
{
  "targetDuration": "2 Menit",
  "flowStyle": "Bedah Mendalam & Cerita Mengalir",
  "totalSections": 6,
  "sections": [
    {
      "partNumber": 1,
      "partTitle": "Pancingan Awal (Hook)",
      "estimatedSeconds": "0:00 - 0:05",
      "visualCue": "Tunjuk ke arah kamera, ekspresi serius tapi santai",
      "spokenText": "Kalimat hook pendek 1-2 kalimat sesuai gaya bicara user..."
    },
    {
      "partNumber": 2,
      "partTitle": "Kejadian yang Sering Bikin Kesel",
      "estimatedSeconds": "0:05 - 0:20",
      "visualCue": "Nada bicara merendah seperti sedang curhat ke teman",
      "spokenText": "Soalnya gini, kemarin aja masih banyak yang..."
    }
  ],
```

```
  "uploadPackage": {
    "coverTitle": "...",
    "caption": "...",
    "pinnedComment": "..."
  }
}
```

