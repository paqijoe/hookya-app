import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// ============================================================================
// ATURAN INTI ANTI-SLOP BAHASA INDONESIA (ADAPTASI SKILL.MD)
// ============================================================================
const ATURAN_ANTISLOP_INDONESIA = `
ATURAN WAJIB ANTI-AI SLOP (WAJIB DIPATUHI DI SETIAP KALIMAT):
1. DILARANG MENGARANG FAKTA ATAU ANGKA (R-17, R-18, R-36):
   - Jangan pernah mengarang angka persentase, statistik, tanggal, nama tokoh, atau testimoni yang tidak diberikan oleh pengguna.
   - Dilarang menulis klaim kosong tanpa bukti seperti: "dipercaya oleh ribuan orang", "terbaik di kelasnya", "kualitas kelas dunia", "terbukti secara ilmiah", atau atribusi kabur seperti "para ahli mengatakan", "penelitian menunjukkan", "banyak orang melaporkan".
   - Gunakan hanya detail produk, spesifikasi, atau pengalaman yang diberikan pengguna. Jika pengguna tidak memberikan angka, jelaskan cara kerja atau manfaat praktisnya secara jujur tanpa mengarang angka.

2. DILARANG MENGGUNAKAN KOSAKATA KLISE AI & HIPERBOLA (R-16, R-36):
   - Jangan gunakan kata atau frasa terjemahan AI berikut: "membuka potensi", "meningkatkan ke level berikutnya", "naik level", "memberdayakan", "menyelami", "bukti nyata", "lanskap", "perjalanan (untuk hal abstrak)", "pengubah permainan", "game-changer", "tanpa hambatan", "mutakhir", "revolusioner", "solusi komprehensif", "menandai momen penting", "memasuki era baru", "di era digital saat ini".

3. DILARANG MENGGUNAKAN FORMULA KALIMAT AI (R-36):
   - Larangan Paralelisme Negatif: Jangan pernah menulis "Bukan sekadar X, tapi Y", "Tidak hanya X, melainkan juga Y", "Lebih dari sekadar X".
   - Larangan Pepatah Palsu: Jangan menulis "X adalah mata uang dari Y", "X bukanlah alat, melainkan cermin".
   - Larangan Pengumuman Meta & Basa-basi: Jangan menulis "Mari kita bahas", "Ini yang perlu kamu tahu", "Tanpa basa-basi lagi", "Di video kali ini kita akan membahas", "Pada intinya", "Pertanyaan sebenarnya adalah", "Semoga membantu".
   - Larangan Rentang Palsu: Jangan menulis "Mulai dari X hingga Y dan semua yang ada di antaranya".
   - Larangan Kesimpulan Kosong: Jangan menutup dengan kalimat "Masa depan terlihat cerah" atau "Langkah besar menuju kesuksesan".

4. ATURAN TANDA BACA, SUBJEK AKTIF, & RITME KALIMAT (R-02, R-36):
   - DILARANG KERAS menggunakan karakter em dash (—) atau tanda hubung ganda (--) di bagian mana pun. Gunakan tanda koma, titik, atau pecah menjadi dua kalimat terpisah.
   - Jangan gunakan huruf kapital penuh (ALL CAPS) pada klausa di tengah kalimat untuk memaksakan penekanan.
   - Jangan gunakan kalimat pasif yang menyembunyikan pelaku, dan jangan beri kata kerja manusia pada benda mati (contoh salah: "produk ini memahami kebutuhanmu"; contoh benar: "sepatu ini menahan tumitmu tetap stabil saat lari").
   - Variasikan panjang kalimat (gabungkan kalimat pendek dan kalimat sedang) agar terdengar seperti ucapan manusia asli saat dibaca keras, bukan potongan kalimat pendek-pendek yang dramatis (staccato drama) atau daftar yang selalu dipaksa berjumlah tiga (rule of three).
   - Gunakan kalimat ringkas: ganti "dalam rangka untuk" menjadi "untuk", ganti "disebabkan oleh fakta bahwa" menjadi "karena".

5. PERTAHANKAN SUARA ASLI PENGGUNA (R-37):
   - Jika pengguna memberikan contoh kalimat asli, ikuti kosakata, sapaan, dan gaya bicaranya tanpa mengubahnya menjadi bahasa iklan yang kaku.

6. SIKLUS AUDIT SEBELUM MENGELUARKAN JSON:
   - Periksa kembali drafmu: Apakah ada klaim/angka yang dikarang sendiri? Apakah ada tanda em dash (—)? Apakah ada frasa "bukan sekadar X tapi Y"? Jika ada, tulis ulang bagian tersebut menjadi kalimat konkret sebelum mengeluarkan JSON.
`

// Pembersih otomatis level kode untuk menghapus em dash (—) dan pola slop yang lolos
function bersihkanStringAntiSlop(teks) {
  if (typeof teks !== "string") return teks
  return (
    teks
      // Hapus em dash (—) dan en dash (–) yang diapit spasi menjadi koma atau titik dua
      .replace(/\s*[—–]\s*/g, ", ")
      .replace(/\s*--\s*/g, ", ")
      // Rapikan koma ganda jika terjadi setelah penggantian
      .replace(/,\s*,/g, ",")
      .replace(/\.\s*,/g, ".")
      // Ganti frasa filler terjemahan AI jika masih lolos
      .replace(/dalam rangka untuk/gi, "untuk")
      .replace(/disebabkan oleh fakta bahwa/gi, "karena")
      .replace(/pada titik waktu ini/gi, "sekarang")
      .trim()
  )
}

function sanitasiObjekAntiSlop(obj) {
  if (typeof obj === "string") {
    return bersihkanStringAntiSlop(obj)
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitasiObjekAntiSlop(item))
  }
  if (obj && typeof obj === "object") {
    const hasil = {}
    for (const key of Object.keys(obj)) {
      hasil[key] = sanitasiObjekAntiSlop(obj[key])
    }
    return hasil
  }
  return obj
}

function uraiJSONAman(teksMentah) {
  if (!teksMentah) {
    throw new Error("Respons AI kosong")
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
    const parsed = JSON.parse(bersih)
    return sanitasiObjekAntiSlop(parsed)
  } catch {
    const sanitasi = bersih
      .replace(/[\u0000-\u0019]+/g, " ")
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
    const parsed = JSON.parse(sanitasi)
    return sanitasiObjekAntiSlop(parsed)
  }
}

async function catatErrorKeAdminDanRefund({
  userId,
  namaUser,
  fitur,
  pesanErrorAsli,
  koinKompensasi = 1,
}) {
  const supabase = getSupabase()
  if (!supabase) return null
  let koinTerbaru = null
  try {
    if (userId && koinKompensasi > 0) {
      const { data: uRow } = await supabase
        .from("users")
        .select("koin")
        .eq("id", userId)
        .single()
      if (uRow) {
        koinTerbaru = (uRow.koin || 0) + koinKompensasi
        await supabase
          .from("users")
          .update({ koin: koinTerbaru })
          .eq("id", userId)
      }
    }
    await supabase.from("error_logs").insert([
      {
        user_id: userId || null,
        nama_user: namaUser || "Pengguna",
        fitur: fitur || "Sistem AI",
        pesan_error: pesanErrorAsli || "Kendala tidak diketahui",
        koin_diganti: koinKompensasi,
      },
    ])
  } catch {
    // Abaikan jika tabel belum siap
  }
  return koinTerbaru
}

// ============================================================================
// MESIN 1: MULTIMODAL PINTAR (GAMBAR, VIDEO, & SUARA VIA OPENROUTER ATAU GEMINI)
// ============================================================================
async function panggilMultimodalPintar({
  openRouterKey,
  geminiKey,
  promptText,
  imagesList = [],
  audioItem = null,
}) {
  let errorCatatan = ""
  const promptLengkap = `${promptText}\n\n${ATURAN_ANTISLOP_INDONESIA}`

  if (openRouterKey && openRouterKey.trim() !== "") {
    try {
      const contentArray = [{ type: "text", text: promptLengkap }]

      imagesList.forEach((img) => {
        if (img?.data) {
          contentArray.push({
            type: "image_url",
            image_url: {
              url: `data:${img.mimeType || "image/jpeg"};base64,${img.data}`,
            },
          })
        }
      })

      if (audioItem?.data) {
        const formatAudio = (audioItem.mimeType || "").includes("wav")
          ? "wav"
          : (audioItem.mimeType || "").includes("mp3")
            ? "mp3"
            : "ogg"
        contentArray.push({
          type: "input_audio",
          input_audio: {
            data: audioItem.data,
            format: formatAudio,
          },
        })
      }

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://hookya.site",
            "X-Title": "Hookya Multimodal AI",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: "user", content: contentArray }],
            response_format: { type: "json_object" },
            temperature: 0.5,
          }),
        },
      )

      const data = await response.json()
      if (response.ok && data?.choices?.[0]?.message?.content) {
        return uraiJSONAman(data.choices[0].message.content)
      }
      errorCatatan =
        data?.error?.message || "OpenRouter Multimodal gagal merespons"
    } catch (err) {
      errorCatatan = err.message
    }
  }

  if (geminiKey && geminiKey.trim() !== "") {
    const partsPayload = []
    if (audioItem?.data) {
      partsPayload.push({
        inlineData: {
          mimeType: audioItem.mimeType || "audio/wav",
          data: audioItem.data,
        },
      })
    }
    imagesList.forEach((img) => {
      if (img?.data) {
        partsPayload.push({
          inlineData: {
            mimeType: img.mimeType || "image/jpeg",
            data: img.data,
          },
        })
      }
    })
    partsPayload.push({ text: promptLengkap })

    for (const model of ["gemini-2.0-flash", "gemini-2.5-flash"]) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: partsPayload }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.5,
              },
            }),
          },
        )
        const data = await response.json()
        if (response.ok && data?.candidates?.length > 0) {
          const parts = data.candidates[0]?.content?.parts || []
          return uraiJSONAman(parts[0]?.text)
        }
        errorCatatan = data?.error?.message || errorCatatan
      } catch (err) {
        errorCatatan = err.message
      }
    }
  }

  throw new Error(errorCatatan || "Gagal memproses media multimodal")
}

// ============================================================================
// MESIN 2: TEKS & COPYWRITING (DEEPSEEK-V3 / GPT-4O MINI DENGAN PROTOKOL ANTISLOP)
// ============================================================================
async function panggilTeksPintar(openRouterKey, geminiKey, promptText) {
  let errorCatatan = ""
  const promptFinalAntiSlop = `${promptText}\n\n${ATURAN_ANTISLOP_INDONESIA}`

  if (openRouterKey && openRouterKey.trim() !== "") {
    const daftarModel = [
      "deepseek/deepseek-chat",
      "openai/gpt-4o-mini",
      "google/gemini-2.0-flash-001",
    ]
    for (const model of daftarModel) {
      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://hookya.site",
              "X-Title": "Hookya AI Content Producer",
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: "system",
                  content:
                    "Kamu adalah penulis naskah dan copywriter Indonesia yang menulis secara konkret, jujur, dan spesifik. Kamu mematuhi seluruh aturan antislop-copywriting: tidak pernah mengarang fakta atau statistik palsu, tidak pernah menggunakan karakter em dash, tidak pernah menggunakan struktur 'bukan sekadar X tapi Y', dan tidak menggunakan kosakata klise AI. Kamu selalu membalas HANYA dalam format JSON yang valid.",
                },
                { role: "user", content: promptFinalAntiSlop },
              ],
              response_format: { type: "json_object" },
              temperature: 0.68,
            }),
          },
        )

        const data = await response.json()
        if (response.ok && data?.choices?.[0]?.message?.content) {
          return uraiJSONAman(data.choices[0].message.content)
        }
        errorCatatan = data?.error?.message || `Kendala pada ${model}`
      } catch (err) {
        errorCatatan = err.message
      }
    }
  }

  if (geminiKey && geminiKey.trim() !== "") {
    return panggilMultimodalPintar({
      openRouterKey: "",
      geminiKey,
      promptText: promptFinalAntiSlop,
    })
  }

  throw new Error(errorCatatan || "API Key AI belum aktif")
}

function getAturanPanjangDurasi(durasiStr = "60 Detik (1 Menit)") {
  const d = durasiStr.toLowerCase()
  if (d.includes("15")) {
    return {
      estimasi: "15 Detik (Padat & Langsung)",
      instruksi:
        "DURASI 15 DETIK: Total seluruh naskah voiceover dari Kerangka 1 sampai 4 wajib sekitar 35 sampai 45 kata (masing-masing kerangka terdiri dari 1 kalimat langsung yang konkret).",
    }
  }
  if (d.includes("30")) {
    return {
      estimasi: "30 Detik (Ringkas)",
      instruksi:
        "DURASI 30 DETIK: Total seluruh naskah voiceover wajib sekitar 70 sampai 90 kata (masing-masing kerangka terdiri dari 2 kalimat konkret).",
    }
  }
  if (d.includes("2 menit") || d.includes("120")) {
    return {
      estimasi: "2 Menit (Pembahasan Mendalam)",
      instruksi:
        "DURASI 2 MENIT: Total seluruh naskah voiceover wajib sekitar 260 sampai 320 kata. Pada Kerangka 2 dan Kerangka 3, jabarkan menjadi 5 sampai 7 kalimat per kerangka menggunakan contoh konkret, situasi nyata, dan langkah spesifik tanpa kalimat pengisi yang berputar-putar.",
    }
  }
  if (d.includes("3 menit") || d.includes("180")) {
    return {
      estimasi: "3 Menit (Penjelasan Lengkap)",
      instruksi:
        "DURASI 3 MENIT: Total seluruh naskah voiceover wajib mencapai 380 sampai 450 kata. Jabarkan Kerangka 2 dan Kerangka 3 menjadi 7 sampai 10 kalimat yang menjelaskan mekanisme nyata, simulasi situasi, dan rincian langkah praktis secara utuh.",
    }
  }
  return {
    estimasi: "60 Detik / 1 Menit (Standar)",
    instruksi:
      "DURASI 60 DETIK: Total seluruh naskah voiceover wajib sekitar 140 sampai 170 kata. Pastikan Kerangka 2 dan Kerangka 3 masing-masing memiliki 3 sampai 4 kalimat utuh dengan panjang kalimat yang bervariasi secara alami.",
  }
}

export async function POST(request) {
  let body = {}
  try {
    body = await request.json()
    const {
      action,
      userId,
      namaUser,
      onboardingAnswers,
      rawWritingSamples,
      personaProfile,
      contentBrief,
      stageNumber,
      stageInput,
      aiDraft,
      userEditedScript,
      bentukKonten,
      bentukKontenBaru,
      durasiTargetBaru,
      jumlahMultiplier,
      ugcConfig,
      segmenTarget,
      skripSebelumnya,
      namaFileVideo,
      detailInput,
      framesBase64,
      mediaBase64,
      mediaMimeType,
      audioBase64,
      audioMimeType,
      productImageBase64,
      productImageMime,
      specImageBase64,
      specImageMime,
      fieldKey,
      fieldLabel,
      accumulatedProfile,
      batchKe,
      opsiSebelumnya,
      dataKinerja,
    } = body

    const geminiKey = process.env.GEMINI_API_KEY
    const openRouterKey = process.env.OPENROUTER_API_KEY

    // 1. TOMBOL "i" (SARAN REFERENSI PROFILING TANPA SLOP)
    if (action === "suggest_profiling_field") {
      const promptSaran = `
Pengguna sedang mengisi kolom "${fieldLabel}" (Kode: "${fieldKey}").
Data jawaban pengguna dari kolom sebelumnya:
${JSON.stringify(accumulatedProfile)}

Berikan 4 contoh isian yang konkret, spesifik, dan langsung menyebutkan fakta atau situasi sehari-hari tanpa kata-kata klise AI.

Keluarkan HANYA valid JSON:
{
  "insight_singkat": "1 kalimat alasan praktis kenapa opsi ini cocok dengan data sebelumnya.",
  "pilihan_referensi": [
    "Opsi spesifik 1...",
    "Opsi spesifik 2...",
    "Opsi spesifik 3...",
    "Opsi spesifik 4..."
  ]
}`
      const hasil = await panggilTeksPintar(
        openRouterKey,
        geminiKey,
        promptSaran,
      )
      return NextResponse.json(hasil)
    }

    // 2. SCAN SCREENSHOT MARKETPLACE (HANYA FAKTA DARI GAMBAR, DILARANG MENGARANG)
    if (action === "analyze_marketplace_screenshots") {
      const promptSS = `
Baca gambar screenshot produk atau spesifikasi marketplace yang dilampirkan.
Salin hanya fakta yang benar-benar tertulis di dalam gambar. Jika suatu informasi (seperti merek atau harga) tidak tertulis di gambar, tulis "-" dan jangan menebak atau mengarang klaim sendiri.
1. "namaProduk": Nama produk persis dari gambar.
2. "brand": Merek atau nama toko yang tertulis di gambar.
3. "hargaPromo": Angka harga yang tertulis di gambar.
4. "keunggulanSpesifikasi": Daftar bahan, ukuran, atau fitur teknis yang tertulis di gambar.
5. "masalahDipecahkan": Fungsi praktis barang tersebut dalam pemakaian sehari-hari.

Keluarkan HANYA valid JSON:
{
  "namaProduk": "...",
  "brand": "...",
  "hargaPromo": "...",
  "keunggulanSpesifikasi": "...",
  "masalahDipecahkan": "..."
}`

      const listImg = []
      if (productImageBase64) {
        listImg.push({
          mimeType: productImageMime || "image/jpeg",
          data: productImageBase64,
        })
      }
      if (specImageBase64) {
        listImg.push({
          mimeType: specImageMime || "image/jpeg",
          data: specImageBase64,
        })
      }

      const hasil = await panggilMultimodalPintar({
        openRouterKey,
        geminiKey,
        promptText: promptSS,
        imagesList: listImg,
      })
      return NextResponse.json(hasil)
    }

    // 3. TRANSKRIP SUARA MIKROFON
    if (action === "transkrip_suara_mic") {
      if (!audioBase64) {
        return NextResponse.json(
          { error: "Error sistem, silakan refresh atau hubungi admin." },
          { status: 400 },
        )
      }
      const promptAudio = `
Salin ucapan di dalam rekaman suara ini kata demi kata menjadi teks Bahasa Indonesia. Jangan menambahkan kata sendiri.
Balas HANYA dalam format JSON:
{
  "teks": "..."
}`
      const hasil = await panggilMultimodalPintar({
        openRouterKey,
        geminiKey,
        promptText: promptAudio,
        audioItem: {
          mimeType: audioMimeType || "audio/wav",
          data: audioBase64,
        },
      })
      return NextResponse.json(hasil)
    }

    // 4. EKSTRAK VIDEO + BEDAH KOMPETITOR
    if (action === "rewrite_video") {
      const promptVideo = `
Tugasmu:
1. Salin kata demi kata ucapan audio atau teks yang tertulis di layar video ke dalam "transkripAsliVideo". Jangan mengarang kata yang tidak ada di video.
2. Jika video benar-benar kosong tanpa ucapan maupun teks layar yang terbaca, isi "unreadableError": true.
3. Jelaskan secara konkret struktur video tersebut pada "bedahKompetitor" ("jenisHookAsli", "pemicuEmosi", "rahasiaRetensi") tanpa hiperbola.
4. Tulis naskah baru yang orisinil berdasarkan fakta di dalam video tersebut menggunakan gaya bicara pengguna:
${JSON.stringify(personaProfile)}
   Catatan tambahan pengguna: "${detailInput || "-"}"

Keluarkan HANYA valid JSON:
{
  "unreadableError": false,
  "errorReason": "",
  "transkripAsliVideo": "...",
  "intiPesanVideo": "...",
  "bedahKompetitor": {
    "jenisHookAsli": "...",
    "pemicuEmosi": "...",
    "rahasiaRetensi": "..."
  },
  "segmen": [
    { "idSegmen": "HOOK", "labelMini": "Kerangka 1 • Pembuka (Hook)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "BODY_STORY", "labelMini": "Kerangka 2 • Cerita & Masalah", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "VALUE_SOLUTION", "labelMini": "Kerangka 3 • Isi Utama & Solusi", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "CTA", "labelMini": "Kerangka 4 • Penutup & Ajakan", "voiceover": "...", "teksLayar": "...", "visual": "..." }
  ]
}`

      const listFrames = (framesBase64 || []).slice(0, 5).map((f) => ({
        mimeType: "image/jpeg",
        data: f,
      }))
      const itemAudio =
        mediaBase64 && mediaMimeType
          ? { mimeType: mediaMimeType, data: mediaBase64 }
          : null

      const hasilParsed = await panggilMultimodalPintar({
        openRouterKey,
        geminiKey,
        promptText: promptVideo,
        imagesList: listFrames,
        audioItem: itemAudio,
      })

      if (hasilParsed?.unreadableError) {
        const koinGanti = await catatErrorKeAdminDanRefund({
          userId,
          namaUser,
          fitur: `Ekstrak Video (${namaFileVideo || "File"})`,
          pesanErrorAsli: "Video tidak memiliki suara atau teks yang terbaca",
          koinKompensasi: 2,
        })
        return NextResponse.json(
          {
            error: "Error sistem, silakan refresh atau hubungi admin.",
            silentCoinUpdated: koinGanti,
          },
          { status: 422 },
        )
      }

      return NextResponse.json(hasilParsed)
    }

    // 5. PROFILING 360° (MEMPERTAHANKAN SUARA ASLI PENGGUNA SESUAI R-37)
    let promptFinal = ""

    if (action === "extract_persona_dna") {
      promptFinal = `
Susun matriks gaya bahasa dan positioning pengguna dari data berikut:
- Data Profil: ${JSON.stringify(onboardingAnswers)}
- Sampel Tulisan Asli Pengguna: "${rawWritingSamples || ""}"

ATURAN KALIBRASI SUARA (R-37):
- Jika pengguna memberikan Sampel Tulisan Asli, pelajari panjang kalimatnya, kata ganti orangnya, dan pilihan katanya. Pertahankan ciri khas tersebut.
- Masukkan daftar kata klise AI ke dalam "forbidden_words" agar selalu diblokir saat pembuatan skrip.

Keluarkan HANYA valid JSON:
{
  "user_id": "${onboardingAnswers?.user_id || "usr_99281"}",
  "persona_summary": "Ringkasan lugas tentang peran, keunikan pengalaman, dan cara bicara pengguna.",
  "positioning_and_usp": {
    "authority_role": "${onboardingAnswers?.peran_dan_otoritas || "Praktisi"}",
    "unique_selling_point": "${onboardingAnswers?.usp_diri || "Berbagi praktik nyata"}",
    "common_enemy": "${onboardingAnswers?.pandangan_kontra || "Teori tanpa langkah praktis"}",
    "personal_analogies": "${onboardingAnswers?.analogi_khas || "Kegiatan harian"}"
  },
  "target_audience": {
    "segment_profile": "${onboardingAnswers?.target_segmen || "Penonton umum"}",
    "deepest_pain_points": "${onboardingAnswers?.target_ketakutan || "Rugi waktu dan biaya"}",
    "secret_desires": "${onboardingAnswers?.target_impian || "Hasil yang terukur"}",
    "common_objections": "${onboardingAnswers?.target_keraguan || "Bingung memulai dari mana"}"
  },
  "linguistic_matrix": {
    "self_pronoun": "${onboardingAnswers?.sapaan_diri || "Aku"}",
    "audience_pronoun": "${onboardingAnswers?.sapaan_audiens || "Kamu"}",
    "greeting_signature": ["...", "..."],
    "favorite_transitions": ["...", "..."],
    "signature_vocabulary": ["...", "..."],
    "forbidden_words": [
      "membuka potensi",
      "level berikutnya",
      "memberdayakan",
      "menyelami",
      "bukti nyata",
      "lanskap",
      "pengubah permainan",
      "game-changer",
      "tanpa hambatan",
      "mutakhir",
      "revolusioner",
      "bukan sekadar",
      "tidak hanya",
      "di era digital saat ini",
      "mari kita bahas",
      "tanpa basa-basi",
      "para ahli mengatakan"
    ],
    "code_switching_level": "Natural"
  },
  "rhythm_and_delivery": {
    "sentence_length": "Variasi kalimat pendek dan sedang yang alami saat diucapkan",
    "pacing": "Langsung masuk ke pokok bahasan tanpa pengantar bertele-tele"
  }
}`
    }

    // 6. INTERACTIVE PRODUCER CHAT (TAHAP 1, 2, 3 BEBAS HALUSINASI & BEBAS SLOP)
    else if (action === "assessment_copilot") {
      const infoKonteks = stageInput?.detailPromosi
        ? `DETAIL PROMOSI (${stageInput.jenisPromosi}):\n${JSON.stringify(stageInput.detailPromosi)}`
        : `Topik Konten Kreator: "${stageInput?.rawTopic}"`

      const catatanHindariDuplikat =
        opsiSebelumnya && opsiSebelumnya.length > 0
          ? `\nPENGGUNA MEMINTA OPSI BARU (SET KE-${batchKe || 2}): Berikan sudut pandang atau kalimat yang berbeda dari daftar sebelumnya ini: ${JSON.stringify(opsiSebelumnya)}`
          : ""

      if (stageNumber === 1) {
        promptFinal = `
Kamu adalah rekan diskusi konten untuk "${namaUser || "Kreator"}".
Profil Kreator:
${JSON.stringify(personaProfile)}

DATA KONTEN:
- Kategori: "${stageInput?.kategori}"
- ${infoKonteks}
- Durasi Target: "${stageInput?.targetPlatform}"
${catatanHindariDuplikat}

TUGAS TAHAP 1:
1. Pada "co_pilot_message", berikan tanggapan langsung yang membahas inti topik tanpa kalimat basa-basi pembuka.
2. Rumuskan 1 gagasan pokok yang spesifik pada "refined_core_idea".
3. Berikan 3 pilihan sudut pandang ("angle_options") yang konkret dan menyebutkan situasi nyata (jangan gunakan struktur "Bukan sekadar X tapi Y").
4. Pada "story_prompt_question", tanyakan 1 hal spesifik tentang pengalaman nyata atau detail produk yang dimiliki pengguna terkait topik ini.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "refined_core_idea": "...",
  "angle_options": [
    { "id": "angle_1", "type": "Koreksi Kesalahan Umum", "angle_text": "..." },
    { "id": "angle_2", "type": "Masalah Spesifik Penonton", "angle_text": "..." },
    { "id": "angle_3", "type": "Cara Kerja & Langkah Praktis", "angle_text": "..." }
  ],
  "story_prompt_question": "..."
}`
      } else if (stageNumber === 2) {
        promptFinal = `
Kamu adalah rekan diskusi konten untuk "${namaUser || "Kreator"}":
${JSON.stringify(personaProfile)}

DATA TAHAP 1:
- Inti Bahasan: "${stageInput?.coreIdea}"
- Sudut Pandang Terpilih: "${stageInput?.chosenAngle}"
- Pengalaman / Detail dari Pengguna: "${stageInput?.userStory || "(Tidak diisi)"}"
- Detail Produk/Campaign (jika ada): ${JSON.stringify(stageInput?.detailPromosi || {})}
${catatanHindariDuplikat}

TUGAS TAHAP 2 (PENTING - DILARANG MENGARANG STATISTIK ATAU KLAIM PALSU):
1. Tanggapi secara lugas di "co_pilot_message".
2. Buat 2 perbandingan atau situasi sehari-hari ("relatable_analogies") yang mempermudah penonton memahami topik.
3. Buat 3 Kartu Penjelasan Konkret ("reference_cards"). DILARANG mengarang angka riset, persentase palsu, atau klaim "para ahli mengatakan". Gunakan hanya:
   - Kartu 1 ("Mekanisme / Sebab-Akibat"): Penjelasan logis bagaimana masalah atau produk tersebut bekerja.
   - Kartu 2 ("Situasi Nyata di Lapangan"): Gambaran kejadian spesifik yang dialami target penonton.
   - Kartu 3 ("Detail / Spesifikasi Faktual"): Fakta dari input pengguna (jika pengguna belum memasukkan angka/detail spesifik, tuliskan poin fakta mekanis tanpa mengarang angka).
4. Berikan 3 langkah tindakan atau manfaat spesifik ("suggested_solutions").

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "relatable_analogies": ["Situasi 1...", "Situasi 2..."],
  "reference_cards": [
    { "type": "Mekanisme & Sebab-Akibat", "title": "...", "summary": "..." },
    { "type": "Situasi Nyata Penonton", "title": "...", "summary": "..." },
    { "type": "Fakta & Detail Spesifik", "title": "...", "summary": "..." }
  ],
  "suggested_solutions": ["Langkah 1...", "Langkah 2...", "Langkah 3..."]
}`
      } else if (stageNumber === 3) {
        promptFinal = `
Kamu adalah rekan diskusi copywriting untuk "${namaUser || "Kreator"}":
${JSON.stringify(personaProfile)}

DATA TAHAP 1 & 2:
- Inti Bahasan: "${stageInput?.coreIdea}"
- Sudut Pandang: "${stageInput?.chosenAngle}"
- Situasi/Pengalaman: "${stageInput?.personalStory}"
- Penjelasan Pendukung: ${JSON.stringify(stageInput?.injectedReference)}
- Solusi/Langkah: ${JSON.stringify(stageInput?.actionableSolutions)}
${catatanHindariDuplikat}

TUGAS TAHAP 3:
1. Sampaikan saran singkat di "co_pilot_message".
2. Pilih 1 alur struktur ("PAS_RELATABLE_BRIDGE", "HSO_STORY", "CONTRARIAN_MYTH_BUSTER", atau "BAB_TRANSFORMATION") beserta alasan praktisnya di "framework_reason".
3. Buat 6 kalimat pembuka ("hook_options") yang langsung masuk ke pokok masalah atau situasi nyata di kalimat pertama. DILARANG menggunakan em dash (—), dILARANG mengarang angka palsu, dan dilarang menggunakan kalimat "Bukan sekadar X tapi Y".
4. Buat 3 kalimat ajakan penutup ("cta_options") yang spesifik menyebutkan tindakan yang harus dilakukan penonton (R-15).

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "recommended_framework": "PAS_RELATABLE_BRIDGE",
  "framework_reason": "...",
  "hook_options": [
    { "category": "Negative / Warning Hook", "why_it_works": "Menyebutkan risiko nyata yang sering diabaikan", "text": "..." },
    { "category": "Positive / Dream Outcome Hook", "why_it_works": "Menyebutkan hasil spesifik yang bisa dicapai", "text": "..." },
    { "category": "Proof / Result-First Hook", "why_it_works": "Membuka dengan hasil atau perubahan nyata", "text": "..." },
    { "category": "Contrarian / Myth-Buster Hook", "why_it_works": "Mengoreksi kebiasaan keliru yang sering dilakukan", "text": "..." },
    { "category": "Relatable / POV Hook", "why_it_works": "Menggambarkan kejadian spesifik yang dialami penonton", "text": "..." },
    { "category": "Curiosity Gap / Secret Hook", "why_it_works": "Menunjukkan detail penting yang jarang diperhatikan", "text": "..." }
  ],
  "cta_options": [
    { "category": "Diskusi Komentar", "text": "..." },
    { "category": "Simpan & Bagikan", "text": "..." },
    { "category": "Tindakan Langsung / Cek Produk", "text": "..." }
  ]
}`
      }
    }

    // 7. PENYUSUN SKRIP UTAMA (TUNDUK PENUH PADA SKILL.MD + AUDIT LOOP)
    else if (action === "assemble_humanized_script") {
      const aturanDurasi = getAturanPanjangDurasi(
        contentBrief?.target_platform || "60 Detik (1 Menit)",
      )

      const isModeUGC =
        Boolean(ugcConfig?.aktif) ||
        (bentukKonten && bentukKonten.toLowerCase().includes("ugc"))

      const daftarPemeran = Array.isArray(ugcConfig?.namaPemeran)
        ? ugcConfig.namaPemeran.filter(Boolean).join(", ")
        : "Pemeran 1, Pemeran 2"

      const instruksiUGC = isModeUGC
        ? `\nFORMAT DIALOG UGC (${ugcConfig?.jumlahOrang || 2} ORANG: ${daftarPemeran}): Tulis percakapan timbal balik yang langsung membahas topik tanpa basa-basi sapaan chatbot.`
        : `\nFORMAT MONOLOG PERSONAL: Gunakan sapaan "${personaProfile?.linguistic_matrix?.self_pronoun}" dan "${personaProfile?.linguistic_matrix?.audience_pronoun}" sesuai karakter pengguna.`

      promptFinal = `
Tulis naskah skrip konten berdasarkan data berikut:
Profil Kreator:
${JSON.stringify(personaProfile)}

Rancangan Konten:
${JSON.stringify(contentBrief)}

Bentuk Visual: "${bentukKonten}"
${instruksiUGC}

ATURAN DURASI:
${aturanDurasi.instruksi}

INSTRUKSI PENULISAN & AUDIT ANTI-SLOP:
1. Gunakan kalimat aktif yang menyebutkan pelaku dengan jelas.
2. Jangan tambahkan fakta, klaim, nomor, atau testimoni yang tidak ada di dalam Rancangan Konten di atas.
3. Jangan gunakan em dash (—) atau tanda hubung ganda (--).
4. Pisahkan setiap 1 sampai 2 kalimat dengan baris baru (\\n) agar mudah dibaca.
5. Tambahkan arahan ekspresi atau gerakan singkat di dalam kurung siku, misalnya [Menunjuk ke arah produk] atau [Nada bicara tenang].
6. Isi juga evaluasi "script_score" dan "upload_pack" (judul cover, caption, dan komentar pertama) dengan bahasa yang lugas tanpa emoji berlebihan dan tanpa kata klise AI.

Keluarkan HANYA valid JSON:
{
  "metadata": {
    "estimated_duration": "${aturanDurasi.estimasi}",
    "framework_used": "${contentBrief?.selected_framework || "PAS_RELATABLE_BRIDGE"}",
    "is_ugc": ${isModeUGC}
  },
  "script_score": {
    "total_score": 92,
    "hook_strength": "Kalimat pembuka langsung menyebutkan masalah spesifik tanpa pengantar bertele-tele.",
    "retention_bridge": "Alur kalimat mengalir dari masalah ke langkah praktis menggunakan contoh konkret.",
    "producer_tip": "Pastikan kalimat pertama diucapkan langsung saat rekaman dimulai tanpa jeda kosong."
  },
  "upload_pack": {
    "cover_title": "...",
    "caption_seo": "...",
    "pinned_comment": "..."
  },
  "segmen": [
    {
      "idSegmen": "HOOK",
      "labelMini": "Kerangka 1 • Pembuka (Hook 0-4 Detik)",
      "voiceover": "...",
      "teksLayar": "...",
      "visual": "..."
    },
    {
      "idSegmen": "BODY_STORY",
      "labelMini": "Kerangka 2 • Situasi & Masalah",
      "voiceover": "...",
      "teksLayar": "...",
      "visual": "..."
    },
    {
      "idSegmen": "VALUE_SOLUTION",
      "labelMini": "Kerangka 3 • Cara Kerja & Solusi",
      "voiceover": "...",
      "teksLayar": "...",
      "visual": "..."
    },
    {
      "idSegmen": "CTA",
      "labelMini": "Kerangka 4 • Penutup & Ajakan (CTA)",
      "voiceover": "...",
      "teksLayar": "...",
      "visual": "..."
    }
  ]
}`
    }

    // 8. UBAH DURASI SKRIP (15s - 3m)
    else if (action === "ubah_durasi_skrip") {
      const aturanDurasi = getAturanPanjangDurasi(durasiTargetBaru)
      promptFinal = `
Sesuaikan panjang ke-4 kerangka skrip di bawah ini agar memenuhi target durasi baru: "${durasiTargetBaru}".
Profil gaya bicara kreator:
${JSON.stringify(personaProfile)}

Topik Skrip: "${body.subyek || "Konten Video"}"
Skrip Saat Ini:
${JSON.stringify(skripSebelumnya)}

${aturanDurasi.instruksi}
Ingat: Jangan mengarang klaim atau angka palsu saat memperluas skrip. Perluas dengan menjelaskan langkah praktis, cara kerja, atau contoh situasi nyata secara konkret.

Keluarkan HANYA valid JSON:
{
  "estimated_duration": "${aturanDurasi.estimasi}",
  "segmen": [
    { "idSegmen": "HOOK", "labelMini": "Kerangka 1 • Pembuka (Hook)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "BODY_STORY", "labelMini": "Kerangka 2 • Situasi & Masalah", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "VALUE_SOLUTION", "labelMini": "Kerangka 3 • Cara Kerja & Solusi", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "CTA", "labelMini": "Kerangka 4 • Penutup & Ajakan (CTA)", "voiceover": "...", "teksLayar": "...", "visual": "..." }
  ]
}`
    }

    // 9. GENERATOR STOK KONTEN MASSAL (2X, 5X, 10X VARIASI SKRIP)
    else if (action === "multiply_script_variations") {
      const jml = Math.min(10, Math.max(2, parseInt(jumlahMultiplier) || 2))
      promptFinal = `
Buat ${jml} variasi naskah skrip yang berbeda sudut pandang pembahasannya dari skrip induk berikut.
Profil gaya bicara kreator:
${JSON.stringify(personaProfile)}

Topik Induk: "${body.subyek || "Konten Kreator"}"
Skrip Induk:
${JSON.stringify(skripSebelumnya)}

ATURAN:
- Setiap variasi wajib mengangkat sudut situasi atau kalimat pembuka (Hook) yang berbeda.
- Tetap gunakan hanya fakta yang ada di skrip induk tanpa mengarang klaim palsu atau menggunakan em dash (—).

Keluarkan HANYA valid JSON:
{
  "daftarVariasi": [
    {
      "judulVariasi": "Variasi 1 (Sudut Pandang Spesifik)",
      "segmen": [
        { "idSegmen": "HOOK", "labelMini": "Kerangka 1 • Pembuka (Hook)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "BODY_STORY", "labelMini": "Kerangka 2 • Situasi & Masalah", "voiceover": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "VALUE_SOLUTION", "labelMini": "Kerangka 3 • Cara Kerja & Solusi", "voiceover": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "CTA", "labelMini": "Kerangka 4 • Penutup (CTA)", "voiceover": "...", "teksLayar": "...", "visual": "..." }
      ]
    }
  ]
}`
    } else if (action === "regenerate_satu_kerangka") {
      promptFinal = `
Tulis ulang satu bagian kerangka ini saja ("${segmenTarget?.labelMini}") dengan kalimat baru yang konkret dan langsung ke inti bahasan.
Profil kreator: ${JSON.stringify(personaProfile)}
Topik: "${body.subyek || "Konten Video"}"
Kalimat saat ini: ${JSON.stringify(segmenTarget)}

Keluarkan HANYA valid JSON:
{
  "voiceover": "...",
  "teksLayar": "...",
  "visual": "..."
}`
    } else if (action === "analyze_script_diff") {
      promptFinal = `
Pelajari perubahan kata yang dilakukan pengguna antara draf awal dan hasil editannya untuk menyelaraskan kamus gaya bahasa pengguna:
- Draf Awal: ${JSON.stringify(aiDraft)}
- Editan Pengguna: ${JSON.stringify(userEditedScript)}
- Profil Saat Ini: ${JSON.stringify(personaProfile)}

Keluarkan HANYA valid JSON:
{
  "learning_summary": ["Pilihan kata dari revisimu telah disimpan ke profil."],
  "updated_persona_profile": ${JSON.stringify(personaProfile)}
}`
    } else if (action === "buat_10_ide_topik") {
      promptFinal = `
Buat 10 ide topik konten yang spesifik dan praktis sesuai pengalaman, peran, serta masalah penonton dari kreator berikut:
${JSON.stringify(personaProfile)}

Jangan gunakan judul klise seperti "Rahasia Sukses" atau "Membuka Potensi". Tuliskan topik masalah atau kegiatan yang spesifik.
Balas HANYA dalam format JSON:
{
  "ideTopik": [
    { "judul": "...", "nuansa": "...", "ringkasan": "..." }
  ]
}`
    } else if (action === "ubah_bentuk_konten") {
      promptFinal = `
Sesuaikan ke-4 kerangka skrip berikut ke dalam format eksekusi visual: "${bentukKontenBaru}".
Skrip saat ini: ${JSON.stringify(skripSebelumnya)}
Balas HANYA dalam format JSON:
{
  "segmen": [
    { "idSegmen": "HOOK", "labelMini": "Kerangka 1 • Pembuka", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "BODY_STORY", "labelMini": "Kerangka 2 • Situasi & Masalah", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "VALUE_SOLUTION", "labelMini": "Kerangka 3 • Cara Kerja & Solusi", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "CTA", "labelMini": "Kerangka 4 • Penutup", "voiceover": "...", "teksLayar": "...", "visual": "..." }
  ]
}`
    } else if (action === "evaluasi_kinerja_vt") {
      promptFinal = `
Berikan evaluasi singkat dan objektif dalam 2 kalimat berdasarkan angka metrik kinerja konten berikut tanpa pujian berlebihan:
${JSON.stringify(dataKinerja)}
Balas HANYA dalam format JSON:
{ "evaluasiAI": "..." }`
    }

    const hasilParsed = await panggilTeksPintar(
      openRouterKey,
      geminiKey,
      promptFinal,
    )

    return NextResponse.json(hasilParsed)
  } catch (err) {
    const koinKompensasi =
      body?.action === "rewrite_video"
        ? 2
        : body?.action === "assemble_humanized_script"
          ? 1
          : body?.action === "multiply_script_variations"
            ? parseInt(body?.koinDipakai) || 1
            : 0

    const koinGanti = await catatErrorKeAdminDanRefund({
      userId: body?.userId,
      namaUser: body?.namaUser,
      fitur: body?.action || "Fitur AI",
      pesanErrorAsli: err.message || "Gagal memproses AI",
      koinKompensasi,
    })

    return NextResponse.json(
      {
        error: "Error sistem, silakan refresh atau hubungi admin.",
        silentCoinUpdated: koinGanti,
      },
      { status: 500 },
    )
  }
}
