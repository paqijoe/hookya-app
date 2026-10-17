import { NextResponse } from "next/server"

// Pengurai JSON ekstra tangguh: Tidak akan gagal meskipun AI menyisipkan baris baru atau teks tambahan
function uraiResponsAman(dataRespons, jenisAksi) {
  const parts = dataRespons?.candidates?.[0]?.content?.parts || []
  let teksMentah = ""

  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i]?.text && !parts[i]?.thought) {
      teksMentah = parts[i].text
      break
    }
  }
  if (!teksMentah && parts[0]?.text) {
    teksMentah = parts[0].text
  }

  let bersih = teksMentah
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim()
  const idxMulai = bersih.indexOf("{")
  const idxAkhir = bersih.lastIndexOf("}")
  if (idxMulai !== -1 && idxAkhir !== -1 && idxAkhir > idxMulai) {
    bersih = bersih.substring(idxMulai, idxAkhir + 1)
  }

  try {
    return JSON.parse(bersih)
  } catch {
    // Bersihkan karakter baris baru mentah di dalam string JSON lalu coba lagi
    try {
      const sanitasi = bersih
        .replace(/[\u0000-\u0019]+/g, " ")
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
      return JSON.parse(sanitasi)
    } catch {
      // Fallback aman agar pengguna selalu mendapat hasil tanpa layar error
      if (jenisAksi === "rewrite_video") {
        return {
          transkripTerdeteksi:
            "Konten video telah dianalisis oleh Sistem AI berdasarkan struktur penyampaian dan visualnya.",
          copywritingBaru: bersih.replace(/[{}"]/g, "").trim() || teksMentah,
        }
      }
      throw new Error(
        "Format respons AI perlu dimuat ulang, silakan klik tombol sekali lagi.",
      )
    }
  }
}

// Pembaca URL dengan batas waktu cepat (3.5 detik) agar shortlink vt.tiktok.com tidak pernah macet
async function ekstrakInfoDariURLCepat(url) {
  if (!url || !url.startsWith("http")) return ""

  const fetchDenganTimeout = async (targetUrl, ms = 3500) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ms)
    try {
      const res = await fetch(targetUrl, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
      })
      return res
    } finally {
      clearTimeout(timer)
    }
  }

  try {
    // 1. Ikuti redirect shortlink (seperti https://vt.tiktok.com/...) terlebih dahulu
    let resolvedUrl = url
    try {
      const headRes = await fetchDenganTimeout(url, 3000)
      if (headRes?.url) resolvedUrl = headRes.url
    } catch {
      // Lanjut gunakan URL awal jika gagal resolve redirect
    }

    // 2. Coba ambil data oEmbed TikTok
    if (resolvedUrl.includes("tiktok.com")) {
      const oembedRes = await fetchDenganTimeout(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`,
        3500,
      )
      if (oembedRes.ok) {
        const data = await oembedRes.json()
        return `Judul/Caption Video TikTok: "${data.title || ""}" oleh Kreator: ${data.author_name || ""} (URL: ${resolvedUrl})`
      }
    }

    // 3. Coba Noembed untuk YouTube Shorts / Reels / lainnya
    const noembedRes = await fetchDenganTimeout(
      `https://noembed.com/embed?url=${encodeURIComponent(resolvedUrl)}`,
      3000,
    )
    if (noembedRes.ok) {
      const data = await noembedRes.json()
      if (data.title) {
        return `Judul Video: "${data.title}" oleh ${data.author_name || ""}`
      }
    }
  } catch {
    // Abaikan jika timeout agar proses AI tetap lanjut tanpa macet
  }

  return `Tautan Video Referensi: ${url}`
}

// Memanggil Sistem AI (Dikunci hanya pada model generasi terbaru yang aktif)
async function panggilSistemAI(apiKey, partsPayload, jenisAksi) {
  const kandidatModel = [
    "gemini-3.8-flash",
    "gemini-3.0-flash",
    "gemini-3-flash-preview",
    "gemini-flash-latest",
  ]

  let errorTerakhir = ""

  for (const model of kandidatModel) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: partsPayload }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.75,
            },
          }),
        },
      )

      const data = await response.json()
      if (response.ok) {
        return uraiResponsAman(data, jenisAksi)
      } else {
        const msg = data?.error?.message || ""
        // Jangan timpa pesan error jika model hanya tidak ditemukan, lanjut ke kandidat berikutnya
        errorTerakhir = msg || `Kendala pada model ${model}`
      }
    } catch (err) {
      errorTerakhir = err.message
    }
  }

  throw new Error(
    errorTerakhir || "Sistem AI sedang padat, silakan klik tombol sekali lagi.",
  )
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      action,
      profil,
      bentukKonten,
      kategoriKonten,
      subyek,
      detailInput,
      jawaban,
      tahapAsesmen,
      segmenTarget,
      skripSebelumnya,
      bentukKontenBaru,
      teksReferensi,
      urlReferensi,
      namaFileVideo,
      framesBase64,
      mediaBase64,
      mediaMimeType,
      dataKinerja,
      customPrompts,
    } = body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Kunci API belum dipasang di file .env.local" },
        { status: 500 },
      )
    }

    const konteksProfil = `
[PROFIL KREATOR]
- Nama & Usia: ${profil?.nama || "Kreator"} (${profil?.usia || "25"} tahun, ${profil?.gender || ""})
- Peran/Aktivitas: ${profil?.peranSaatIni || "Kreator"}
- Karakter Sosial: ${profil?.kepribadianSosial || "Santai"}
- Minat/Bidang: ${profil?.minatUtama || "-"}
- Lokasi & Jadwal: ${profil?.lingkunganRekam || "Dalam ruangan"} | Waktu Luang: ${profil?.waktuFree || "Fleksibel"}
- Hambatan Utama: ${profil?.hambatanUtama || "-"}
- Bentuk Konten Pilihan: ${bentukKonten || "B-Roll + Teks di Layar"}
`

    let promptFinal = ""
    let partsPayload = []

    // 1. GENERATE 10 IDE TOPIK
    if (action === "buat_10_ide_topik") {
      promptFinal = `
Kamu adalah Perancang Strategi Konten Kreatif.
${konteksProfil}

Buatkan tepat 10 referensi ide topik pembahasan konten yang segar, spesifik, dan sangat cocok dengan profil kreator di atas untuk kategori: ${
        kategoriKonten === "personal"
          ? "Konten Kreator & Personal Branding (Edukasi, Cerita Harian, Hobi, atau Hiburan)"
          : "Konten Promosi & Affiliate (Ide Produk yang Relevan dengan Keseharian Kreator)"
      }.

Balas HANYA dalam format JSON murni:
{
  "ideTopik": [
    {
      "judul": "Judul topik singkat...",
      "nuansa": "Tips Praktis & Pengalaman Nyata",
      "ringkasan": "1 kalimat penjelasan singkat..."
    }
  ]
}`
      partsPayload = [{ text: promptFinal }]
    }

    // 2. ASESMEN BERANTAI
    else if (action === "buat_opsi_asesmen") {
      const instruksiDev = customPrompts?.asesmen || ""
      promptFinal = `
Kamu adalah Konsultan Strategi Konten Pribadi.
${konteksProfil}
${instruksiDev ? `INSTRUKSI KHUSUS:\n${instruksiDev}\n` : ""}

ATURAN UTAMA: Fokuskan analisis 80% pada Topik Spesifik ("${subyek}") dan pilihan jawaban sebelumnya.

DATA KONTEN SAAT INI:
- Kategori: ${kategoriKonten === "personal" ? "Konten Kreator & Personal Branding" : "Konten Promosi & Affiliate"}
- Topik / Produk Utama: "${subyek}"
- Rincian Awal: ${JSON.stringify(detailInput)}
- Jawaban Sebelumnya:
  * Target Penonton: ${jawaban?.audiens || "(Tahap awal)"}
  * Masalah Penonton: ${jawaban?.masalah || "(Belum dipilih)"}
  * Gaya Hook: ${jawaban?.hook || "(Belum dipilih)"}
  * Pembawaan Bahasa: ${jawaban?.tone || "(Belum dipilih)"}

Susun 1 kalimat pertanyaan dan 5 opsi jawaban yang menyambung langsung dari jawaban sebelumnya untuk tahap: "${tahapAsesmen}".

Balas HANYA dalam format JSON murni:
{
  "pertanyaanAI": "Kalimat pertanyaan yang jelas dan nyambung...",
  "opsi": [
    "Pilihan spesifik 1...",
    "Pilihan spesifik 2...",
    "Pilihan spesifik 3...",
    "Pilihan spesifik 4...",
    "Pilihan spesifik 5..."
  ]
}`
      partsPayload = [{ text: promptFinal }]
    }

    // 3. BUAT SKRIP UTUH 6 BAGIAN
    else if (action === "buat_skrip_utuh") {
      const instruksiDev = customPrompts?.skrip || ""
      promptFinal = `
Kamu adalah Produser Konten & Copywriter Profesional.
${konteksProfil}
${instruksiDev ? `INSTRUKSI KHUSUS:\n${instruksiDev}\n` : ""}

KEPUTUSAN ASESMEN PENGGUNA:
- Kategori: ${kategoriKonten === "personal" ? "Konten Kreator & Personal Branding" : "Konten Promosi & Affiliate"}
- Topik / Produk Utama: "${subyek}"
- Detail Input: ${JSON.stringify(detailInput)}
- Target Penonton: ${jawaban?.audiens}
- Masalah Penonton: ${jawaban?.masalah}
- Pendekatan Hook: ${jawaban?.hook}
- Gaya Bahasa: ${jawaban?.tone}
- Alur Penyajian: ${jawaban?.format}

Susun skrip 6 bagian (Hook, Foreshadow, Problem, Solution, Payoff, CTA) yang natural, manusiawi, dan sesuai bentuk konten "${bentukKonten}".
- "voiceover": Kalimat ucapan lisan yang mengalir alami.
- "teksLayar": Teks ringkas untuk ditampilkan di layar (Text-on-Screen).
- "visual": Arahan pengambilan gambar yang rinci dan mengikuti isi kalimat skrip pada bagian tersebut.

Balas HANYA dalam format JSON murni:
{
  "segmen": [
    { "idSegmen": "Hook", "labelMini": "Bagian 1 • Pembuka (0-3d)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "Foreshadow", "labelMini": "Bagian 2 • Janji Awal (3-6d)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "Problem", "labelMini": "Bagian 3 • Masalah (6-12d)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "Solution", "labelMini": "Bagian 4 • Solusi (12-20d)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "Payoff", "labelMini": "Bagian 5 • Bukti Hasil (20-25d)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "CTA", "labelMini": "Bagian 6 • Penutup (25-30d)", "voiceover": "...", "teksLayar": "...", "visual": "..." }
  ]
}`
      partsPayload = [{ text: promptFinal }]
    }

    // 4. UBAH BENTUK KONTEN
    else if (action === "ubah_bentuk_konten") {
      promptFinal = `
Kamu adalah Produser Konten Multi-Format.
${konteksProfil}
Skrip saat ini tentang "${subyek}":
${JSON.stringify(skripSebelumnya)}

Ubahlah seluruh skrip dan arahan visual di atas agar pas dengan bentuk konten baru: "${bentukKontenBaru}".
Balas HANYA dalam format JSON murni:
{
  "segmen": [
    { "idSegmen": "Hook", "labelMini": "Bagian 1 • Pembuka", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "Foreshadow", "labelMini": "Bagian 2 • Janji Awal", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "Problem", "labelMini": "Bagian 3 • Masalah", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "Solution", "labelMini": "Bagian 4 • Solusi", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "Payoff", "labelMini": "Bagian 5 • Bukti Hasil", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "CTA", "labelMini": "Bagian 6 • Penutup", "voiceover": "...", "teksLayar": "...", "visual": "..." }
  ]
}`
      partsPayload = [{ text: promptFinal }]
    }

    // 5. REGENERATE PER BAGIAN
    else if (action === "regenerate_segmen") {
      promptFinal = `
Kamu adalah Produser Konten.
${konteksProfil}
Topik: "${subyek}" | Bentuk Konten: "${bentukKonten}"

Perbarui bagian "${segmenTarget?.labelMini}" berikut menjadi variasi baru yang lebih segar dan arahan visualnya mengikuti kalimat skrip baru:
- Voiceover lama: ${segmenTarget?.voiceover}
- Teks Layar lama: ${segmenTarget?.teksLayar}
- Visual lama: ${segmenTarget?.visual}

Balas HANYA dalam format JSON murni:
{
  "voiceover": "...",
  "teksLayar": "...",
  "visual": "..."
}`
      partsPayload = [{ text: promptFinal }]
    }

    // 6. EKSTRAK VIDEO (UPLOAD FILE / URL) & REWRITE ORISINIL
    else if (action === "rewrite_video") {
      const instruksiDev = customPrompts?.rewrite || ""
      const infoURL = urlReferensi
        ? await ekstrakInfoDariURLCepat(urlReferensi)
        : ""

      promptFinal = `
Kamu adalah Pakar Analisis Konten Video & Copywriter Orisinil.
${konteksProfil}
${instruksiDev ? `INSTRUKSI KHUSUS:\n${instruksiDev}\n` : ""}

DATA SUMBER VIDEO YANG DIANALISIS:
- File Video yang Diunggah: ${namaFileVideo || "Tidak ada file"}
- Tautan URL Video: ${urlReferensi || "Tidak ada URL"}
- Informasi dari URL: ${infoURL || "-"}
- Catatan / Transkrip dari Pengguna: ${teksReferensi || "(Analisis langsung dari visual/file/tautan video di atas)"}
- Arah Penulisan Ulang yang Diinginkan: ${detailInput || "Ubah menjadi naskah copywriting baru yang 100% orisinil, kuat, dan sesuai dengan profil saya"}

TUGASMU:
1. Analisis isi, alur adegan, atau pesan utama dari video tersebut dan tuliskan pada "transkripTerdeteksi".
2. Buat naskah Copywriting baru yang 100% orisinil, mengalir alami, dan siap pakai pada "copywritingBaru".
3. Susun juga ke dalam 6 bagian skrip ("segmen") lengkap dengan voiceover, teksLayar, dan arahan visual agar pengguna bisa langsung memakainya untuk syuting.

Balas HANYA dalam format JSON murni:
{
  "transkripTerdeteksi": "Ringkasan isi/adegan/pesan utama dari video referensi...",
  "copywritingBaru": "Naskah copywriting utuh yang 100% orisinil dengan gaya bahasa kreator...",
  "segmen": [
    { "idSegmen": "Hook", "labelMini": "Bagian 1 • Pembuka (0-3d)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "Foreshadow", "labelMini": "Bagian 2 • Janji Awal (3-6d)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "Problem", "labelMini": "Bagian 3 • Masalah (6-12d)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "Solution", "labelMini": "Bagian 4 • Solusi (12-20d)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "Payoff", "labelMini": "Bagian 5 • Bukti Hasil (20-25d)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "CTA", "labelMini": "Bagian 6 • Penutup (25-30d)", "voiceover": "...", "teksLayar": "...", "visual": "..." }
  ]
}`

      partsPayload = []
      if (Array.isArray(framesBase64) && framesBase64.length > 0) {
        framesBase64.slice(0, 3).forEach((frameData) => {
          if (frameData) {
            partsPayload.push({
              inlineData: {
                mimeType: "image/jpeg",
                data: frameData,
              },
            })
          }
        })
      } else if (mediaBase64 && mediaMimeType) {
        partsPayload.push({
          inlineData: {
            mimeType: mediaMimeType,
            data: mediaBase64,
          },
        })
      }
      partsPayload.push({ text: promptFinal })
    }

    // 7. EVALUASI KINERJA VT SEPEKAN
    else if (action === "evaluasi_kinerja_vt") {
      promptFinal = `
Kamu adalah Analis Performa Konten TikTok & Mentor Kreator.
${konteksProfil}

DATA KINERJA KONTEN SEPEKAN SETELAH UPLOAD:
- Judul / Topik Konten: "${subyek}"
- Tanggal Dibuat: ${dataKinerja?.waktuDibuat || "-"}
- Tanggal Diupload: ${dataKinerja?.tanggalUpload || "-"}
- Jumlah Views: ${dataKinerja?.views || 0}
- Jumlah Like: ${dataKinerja?.likes || 0}
- Jumlah Komentar: ${dataKinerja?.komen || 0}

Berikan evaluasi singkat (2-3 kalimat yang konstruktif dan mudah dipahami) mengenai rasio interaksi tersebut serta 1 saran konkret untuk konten berikutnya.
Balas HANYA dalam format JSON murni:
{
  "evaluasiAI": "..."
}`
      partsPayload = [{ text: promptFinal }]
    }

    const hasilParsed = await panggilSistemAI(apiKey, partsPayload, action)
    return NextResponse.json(hasilParsed)
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Terjadi kendala pada Sistem AI" },
      { status: 500 },
    )
  }
}
