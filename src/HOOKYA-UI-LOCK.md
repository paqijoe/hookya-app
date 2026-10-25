# HOOKYA UI LOCK & DESIGN SYSTEM GUIDELINES

> **STATUS: MUTLAK & TERKUNCI (DO NOT VIOLATE)**
> File ini adalah kontrak desain antarmuka (UI) aplikasi Hookya. Setiap penambahan fitur, perombakan alur, atau perbaikan bug **WAJIB** mematuhi seluruh aturan kelas CSS, radius sudut, warna, dan tata letak di dalam dokumen ini. Dilarang mengubah gaya visual yang sudah ada.

---

## 1. Palet Warna Resmi (Strict Color Tokens)

Jangan pernah menambahkan warna Tailwind baru di luar daftar ini:

- **Primary Dark (Tombol Utama / Kartu Aktif / Header):** `#14141f` (`bg-[#14141f]`, `text-[#14141f]`, `border-[#14141f]`)
- **Primary Accent (Teks Sorotan / Tombol Aksi Utama):** `#d4f34a` (`bg-[#d4f34a]`, `text-[#d4f34a]`)
- **Surface Utama (Latar Kontainer Halaman & Kartu):** `#ffffff` (`bg-white`)
- **Surface Sekunder (Latar Input, Panel Kontrol, & Kartu Non-Aktif):** `#f4f5f7` (`bg-[#f4f5f7]`)
- **Aksen Hijau Lembut (Info / Evaluasi / Panel Opsional):** Latar `bg-[#f2fce2]`, Teks `text-[#4d6b14]`, Border `border-[#4d6b14]/25` atau `border-[#4d6b14]/20`
- **Aksen Ungu Lembut (Panel UGC / Variasi / Target):** Latar `bg-[#f0eeff]`, Teks `text-[#5b4bc4]`, Border `border-[#5b4bc4]/20` atau `border-[#5b4bc4]/25`
- **Border Standar:** `border-slate-200` (atau `border-slate-300` khusus garis putus-putus `border-dashed`)
- **Teks Sekunder & Deskripsi:** `text-slate-600` dan `text-slate-500`
- **Pesan Error:** Latar `bg-rose-50`, Border `border-rose-200`, Teks `text-rose-900`

---

## 2. Hierarki Sudut Lengkungan (Border Radius Lock)

Dilarang menggunakan `rounded-3xl`, `rounded-4xl`, atau `rounded-full` pada kontainer dan tombol biasa. Gunakan skala terkunci berikut:

1. **Kontainer Utama Halaman (`PersonaDNAView`, `ScriptProducerView`, dll.):**
   - Wajib: `bg-white p-4 sm:p-8 rounded-2xl border border-slate-200` (Tanpa `shadow-sm` atau `shadow-xl`).
2. **Panel Grup / Kartu Pilihan / Kotak Chat Produser:**
   - Wajib: `rounded-xl border border-slate-200`.
3. **Tombol (`<button>`), Input (`<input>`), Dropdown (`<select>`), Textarea, & Kartu Bagian Dalam:**
   - Wajib: `rounded-lg`.
4. **Badge Kecil di Dalam Kartu / Tombol Mikro (seperti tombol `i Referensi` atau jam):**
   - Wajib: `rounded-md`.

---

## 3. Larangan Keras Elemen "AI Slop" pada UI (FORBIDDEN)

### A. DILARANG Menggunakan _Eyebrow Badge_ di Atas Judul

- **SALAH (Dilarang):** Menaruh `<span className="text-[10px] font-bold bg-[#14141f] text-[#d4f34a] px-2 py-0.5 rounded">LANGKAH 1</span>` di atas `<h2>` atau `<h3>`.
- **BENAR (Wajib):** Langsung gunakan nomor pada judul `<h3 className="text-sm font-bold text-[#14141f]">1. Judul Bagian</h3>` diikuti deskripsi `<p className="text-xs text-slate-600 mt-0.5">Penjelasan singkat...</p>`.

### B. DILARANG Menggunakan Emoji Dekoratif di UI

- **SALAH (Dilarang):** Memakai emoji seperti `🎯`, `👑`, `🚀`, `🔥`, `⚡`, `✨`, `💡`, `📚` pada judul, label, maupun teks tombol.
- **BENAR (Wajib):** Gunakan teks lugas atau komponen `<FlatIcon name="..." className="w-4 h-4" />` dari `SharedUI.js`. Untuk penanda fitur terkunci, gunakan `<FlatIcon name="lock" className="w-3.5 h-3.5" />` + teks `VIP`.

### C. DILARANG Memakai Latar Hijau Lime Mencolok pada Area Baca Skrip

- **SALAH (Dilarang):** `bg-[#d4f34a]/30` pada kolom textarea hasil skrip karena melelahkan mata pembaca.
- **BENAR (Wajib):** Gunakan latar netral `bg-[#f4f5f7] border border-slate-200 rounded-lg p-3.5` untuk membungkus `<textarea className="w-full bg-white border border-slate-200 rounded-lg p-2.5 ...">`.

### D. DILARANG Memakai `ring-2` atau `shadow-xl` pada Kartu Pilihan Biasa

- `ring-2 ring-[#d4f34a]` HANYA boleh dipakai pada `<textarea>` saat mode edit aktif (`isEditMode === true`).
- Untuk kartu pilihan (seperti pilihan Fase, Jurus, Sudut Pandang, Hook, atau Bentuk Visual), gunakan pola _state_ aktif di bawah ini.

---

## 4. Pola Standar Komponen Terkunci (Copy-Paste Pattern)

### A. Pola Pemisah Antar Seksi (`<section>`)

Jangan membungkus judul seksi dengan kotak warna. Gunakan garis pemisah atas (`border-t`):

```jsx
<section className="space-y-4 pt-6 border-t border-slate-200">
  <div>
    <h3 className="text-sm font-bold text-[#14141f]">2. Judul Seksi</h3>
    <p className="text-xs text-slate-600 mt-0.5">
      Deskripsi singkat seksi ini.
    </p>
  </div>
  {/* Isi form atau grid di sini */}
</section>
```
