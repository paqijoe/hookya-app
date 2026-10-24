import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// ============================================================================
// PILAR 1: ATURAN BAHASA LISAN KAMERA (ANTI-SLOP BAHASA INDONESIA)
// ============================================================================
const ATURAN_BAHASA_LISAN_KAMERA = `
ATURAN MUTLAK BAHASA LISAN KAMERA (PILAR 1 - WAJIB DIPATUHI 100%):
1. DAFTAR LARANGAN KERAS (FORBIDDEN):
   - DILARANG memakai kalimat pembuka terjemahan AI: "Pernahkah kamu merasa...", "Bayangkan jika...", "Di era digital yang serba cepat ini...", "Tahukah kamu bahwa...", "Halo semuanya, kembali lagi...", "Mari kita bahas", "Tanpa basa-basi lagi".
   - DILARANG memakai kata brosur/iklan kaku: "Solusi terbaik", "inovatif", "berkualitas tinggi", "dirancang khusus", "meningkatkan produktivitas", "wajib dimiliki", "mengubah hidupmu", "pengalaman tak terlupakan", "membuka potensi", "naik level", "game-changer", "revolusioner".
   - DILARANG memakai struktur kalimat klise AI: "Bukan sekadar X, tapi juga Y", "Tidak hanya X, melainkan Y", "Mulai dari A hingga B, dan semuanya".
   - DILARANG memakai tanda baca kaku: Jangan pernah gunakan em dash (—), jangan gunakan titik dua (:) di tengah kalimat ucap, dan jangan membuat kalimat panjang lebih dari 15 kata tanpa jeda koma atau titik.
   - DILARANG mengarang angka statistik, riset palsu, atau klaim "para ahli mengatakan".

2. ATURAN JEDA NAPAS & KATA SAMBUNG LISAN (REQUIRED):
   - Setiap kalimat WAJIB enak diucapkan dalam 1 tarikan napas pendek (8 sampai 14 kata per kalimat).
   - Gunakan kata sambung obrolan alami di awal kalimat atau saat berpindah bagian (beat): "Jujur ya...", "Soalnya gini...", "Nah, masalahnya tuh...", "Coba deh perhatiin...", "Makanya kemarin...", "Terus kalau ditanya...", "Padahal aslinya...".
`

// Pembersih otomatis level kode untuk menjamin tidak ada em dash (—) atau kalimat brosur yang lolos
function bersihkanStringAntiSlop(teks) {
  if (typeof teks !== "string") return teks
  return teks
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/\s*--\s*/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/\.\s*,/g, ".")
    .replace(/dalam rangka untuk/gi, "buat")
    .replace(/disebabkan oleh fakta bahwa/gi, "karena")
    .trim()
}

function sanitasiObjekAntiSlop(obj) {
  if (typeof obj === "string") return bersihkanStringAntiSlop(obj)
  if (Array.isArray(obj)) return obj.map((item) => sanitasiObjekAntiSlop(item))
  if (obj && typeof obj === "object") {
    const hasil = {}
    for (const key of Object.keys(obj)) {
      hasil[key] = sanitasiObjekAntiSlop(obj[key])
    }
    return hasil
  }
  return obj
}

// ============================================================================
// PILAR 2: PEMISAHAN "VOICE DNA" VS "KONTEKS NICHE" (ANTI-BOCOR TOPIK)
// ============================================================================
function susunInstruksiPersonaTerpisah(
  personaProfile,
  contextMode,
  topikAtauProduk,
) {
  const voiceDNA = {
    sapaan_diri:
      personaProfile?.voice_dna?.self_pronoun ||
      personaProfile?.linguistic_matrix?.self_pronoun ||
      "Aku",
    sapaan_audiens:
      personaProfile?.voice_dna?.audience_pronoun ||
      personaProfile?.linguistic_matrix?.audience_pronoun ||
      "Kamu",
    partikel_lisan: personaProfile?.voice_dna?.spoken_particles ||
      personaProfile?.linguistic_matrix?.signature_vocabulary || [
        "sih",
        "tuh",
        "kan",
        "deh",
        "banget",
      ],
    gaya_sapaan_awal:
      personaProfile?.voice_dna?.greeting_signature ||
      personaProfile?.linguistic_matrix?.greeting_signature ||
      [],
    transisi_favorit:
      personaProfile?.voice_dna?.favorite_transitions ||
      personaProfile?.linguistic_matrix?.favorite_transitions ||
      [],
    sikap_dan_ritme_bicara:
      personaProfile?.voice_dna?.delivery_style ||
      personaProfile?.positioning_and_usp?.authority_role ||
      "Santai, jujur, dan mengalir seperti ngobrol langsung",
  }

  const nicheContext = {
    peran_dan_keunikan:
      personaProfile?.niche_context?.unique_selling_point ||
      personaProfile?.positioning_and_usp?.unique_selling_point ||
      "",
    bidang_utama:
      personaProfile?.niche_context?.primary_niche ||
      personaProfile?.persona_summary ||
      "",
    segmen_penonton:
      personaProfile?.niche_context?.segment_profile ||
      personaProfile?.target_audience?.segment_profile ||
      "",
    masalah_penonton:
      personaProfile?.niche_context?.deepest_pain_points ||
      personaProfile?.target_audience?.deepest_pain_points ||
      "",
    keinginan_penonton:
      personaProfile?.niche_context?.secret_desires ||
      personaProfile?.target_audience?.secret_desires ||
      "",
    alasan_ragu_penonton:
      personaProfile?.niche_context?.common_objections ||
      personaProfile?.target_audience?.common_objections ||
      "",
  }

  if (contextMode === "lintas_produk") {
    return `
# LAPIS 1: VOICE DNA KREATOR (WAJIB DIKUNCI & DIPAKAI 100%):
${JSON.stringify(voiceDNA)}

# ATURAN KONTEKS (MODE LINTAS PRODUK / BEBAS AKTIF):
- Saat ini user sedang membahas produk/topik: "${topikAtauProduk || "Topik Baru"}".
- Gunakan HANYA gaya bicara, sapaan ("${voiceDNA.sapaan_diri}" ke "${voiceDNA.sapaan_audiens}"), partikel lisan, dan ritme ngobrol dari LAPIS 1 di atas.
- DILARANG KERAS membawa atau membocorkan atribut niche profil lama (${nicheContext.bidang_utama}) ke dalam naskah ini!
- Fokuskan 100% masalah penonton, perumpamaan, dan alasan ragu khusus untuk produk/topik "${topikAtauProduk || "yang sedang dibahas"}" ini saja.
`
  }

  return `
# LAPIS 1: VOICE DNA KREATOR (WAJIB DIKUNCI & DIPAKAI 100%):
${JSON.stringify(voiceDNA)}

# LAPIS 2: KONTEKS NICHE & PSIKOLOGI PENONTON PROFIL:
${JSON.stringify(nicheContext)}

# ATURAN FILTER OTOMATIS ANTI-BOCOR TOPIK:
- Bandingkan dulu topik/produk saat ini ("${topikAtauProduk || "Topik Konten"}") dengan Konteks Niche Profil di Lapis 2.
- Jika SEJALUR, gunakan penuh data Lapis 1 dan Lapis 2.
- Jika BEDA PRODUK / LINTAS TOPIK (misal profil membahas Hijab/Bisnis tapi topik saat ini membahas Makanan/Barang lain), ABAIKAN atribut bidang di Lapis 2 agar tidak bocor! Tetap gunakan Voice DNA (Lapis 1), namun sesuaikan masalah penonton dan perumpamaan 100% ke topik "${topikAtauProduk || "saat ini"}".
`
}

// ============================================================================
// PILAR 4: RUMUS DYNAMIC STORY BEATS BERDASARKAN DURASI (3 S/D 8 BAGIAN)
// ============================================================================
function getAturanDynamicStoryBeats(durasiStr = "45 - 60 Detik") {
  const d = (durasiStr || "").toLowerCase()

  if (d.includes("15") || d.includes("30")) {
    return {
      targetDuration: d.includes("15") ? "15 Detik" : "30 Detik",
      flowStyle: "Cepat, Padat & Langsung ke Inti",
      minSections: 3,
      maxSections: 4,
      totalSectionsDefault: d.includes("15") ? 3 : 4,
      instruksiBabak: `
TARGET DURASI: ${d.includes("15") ? "15 DETIK (3 BAGIAN)" : "30 DETIK (4 BAGIAN)"}.
WAJIB buat array "sections" berjumlah tepat ${d.includes("15") ? "3" : "4"} bagian (beats) dengan alur:
- Bagian 1: Pancingan Awal (Hook Tajam) [0:00 - 0:04]
- Bagian 2: Masalah Inti yang Sering Kejadian [0:04 - 0:12]
- Bagian 3: Inti Solusi / Bukti Cepat [0:12 - 0:22]
${d.includes("15") ? "- (Gabungkan ajakan singkat di akhir Bagian 3)" : "- Bagian 4: Ajakan Penutup Singkat (CTA) [0:22 - 0:30]"}
Setiap bagian HANYA BOLEH berisi 2 kalimat lisan pendek (8-12 kata per kalimat).`,
    }
  }

  if (d.includes("90") || d.includes("2 menit") || d.includes("120")) {
    return {
      targetDuration: "2 Menit",
      flowStyle: "Bedah Mendalam & Cerita Mengalir",
      minSections: 6,
      maxSections: 7,
      totalSectionsDefault: 6,
      instruksiBabak: `
TARGET DURASI: 90 DETIK - 2 MENIT (6 SAMPAI 7 BAGIAN DINAMIS).
DILARANG KERAS hanya memanjangkan kalimat di dalam 4 kotak!
WAJIB pecah obrolan menjadi 6 atau 7 bagian ("sections") yang mengalir mulus dengan babak berikut:
- Bagian 1: Pancingan Awal (Hook) [0:00 - 0:05]
- Bagian 2: Cerita Pemicu / Kejadian Nyata di Lapangan [0:05 - 0:22]
- Bagian 3: Kesalahan yang Sering Dilakukan Orang Tanpa Sadar [0:22 - 0:40]
- Bagian 4: Ibarat / Perumpamaan Sehari-hari Biar Gampang Kebayang [0:40 - 0:58]
- Bagian 5: Bedah Cara Kerja / Bukti Pengalaman Pakai [0:58 - 1:20]
- Bagian 6: Menjawab Keraguan Penonton ("Terus gimana kalau...") [1:20 - 1:42]
- Bagian 7: Kesimpulan Singkat & Ajakan Penutup (CTA) [1:42 - 2:00]
ATURAN EMAS: Setiap bagian HANYA berisi 2 sampai 3 kalimat lisan pendek (10-15 detik baca) dan wajib disambung dengan kata penghubung obrolan ("Soalnya gini...", "Nah masalahnya...", "Terus kalau ditanya...").`,
    }
  }

  if (d.includes("2.5") || d.includes("3 menit") || d.includes("180")) {
    return {
      targetDuration: "3 Menit",
      flowStyle: "Storytelling Lengkap, Studi Kasus & Langkah Praktis",
      minSections: 7,
      maxSections: 8,
      totalSectionsDefault: 8,
      instruksiBabak: `
TARGET DURASI: 2.5 - 3 MENIT (7 SAMPAI 8 BAGIAN DINAMIS).
DILARANG KERAS menumpuk paragraf panjang di dalam 4 kotak!
WAJIB pecah obrolan menjadi 8 bagian ("sections") yang berkesinambungan:
- Bagian 1: Pancingan Awal (Hook) [0:00 - 0:06]
- Bagian 2: Cerita Pemicu / Kejadian Awal [0:06 - 0:25]
- Bagian 3: Kesalahan Umum yang Bikin Rugi Waktu/Biaya [0:25 - 0:48]
- Bagian 4: Ibarat / Perumpamaan Harian [0:48 - 1:10]
- Bagian 5: Bedah Mekanisme / Cara Kerja Sebenarnya [1:10 - 1:35]
- Bagian 6: Studi Kasus / Perbandingan Sebelum vs Sesudah Pakai Cara Ini [1:35 - 2:05]
- Bagian 7: Rincian Langkah Praktis (Step-by-step) & Jawab Keraguan Penonton [2:05 - 2:40]
- Bagian 8: Rangkuman Pengingat & Ajakan Penutup (CTA) [2:40 - 3:00]
ATURAN EMAS: Setiap bagian tetap pendek (2 sampai 3 kalimat lisan enak ucap, 8-14 kata per kalimat) sehingga mata pembaca tidak lelah saat tampil di layar!`,
    }
  }

  // Default: 45 - 60 Detik (4 - 5 Bagian)
  return {
    targetDuration: "60 Detik",
    flowStyle: "Obrolan Mengalir & Persuasif",
    minSections: 4,
    maxSections: 5,
    totalSectionsDefault: 5,
    instruksiBabak: `
TARGET DURASI: 45 - 60 DETIK (5 BAGIAN DINAMIS).
WAJIB buat array "sections" berjumlah 5 bagian (beats) dengan alur:
- Bagian 1: Pancingan Awal (Hook) [0:00 - 0:04]
- Bagian 2: Situasi / Masalah Harian yang Bikin Kesel [0:04 - 0:16]
- Bagian 3: Perumpamaan / Alasan Logis Kenapa Itu Kejadian [0:16 - 0:30]
- Bagian 4: Solusi Praktis / Pengalaman Pemakaian Nyata [0:30 - 0:48]
- Bagian 5: Ajakan Penutup Spesifik (CTA) [0:48 - 1:00]
ATURAN EMAS: Setiap bagian HANYA berisi 2 sampai 3 kalimat lisan pendek (8-14 kata per kalimat) yang saling menyambung alami.`,
  }
}

// Normalisasi Output agar menghasilkan `sections` (Pilar 4) sekaligus `segmen` (Backward Compatible dengan Arsip, PDF & Teleprompter)
function normalisasiHasilSkripDinamis(rawObj, aturanDurasi) {
  if (!rawObj || typeof rawObj !== "object") return rawObj

  const rawSections = Array.isArray(rawObj.sections)
    ? rawObj.sections
    : Array.isArray(rawObj.segmen)
      ? rawObj.segmen.map((s, idx) => ({
          partNumber: idx + 1,
          partTitle:
            s.partTitle ||
            (s.labelMini
              ? s.labelMini.replace(/^Bagian \d+\s*•\s*/i, "")
              : `Bagian ${idx + 1}`),
          estimatedSeconds: s.estimatedSeconds || "",
          visualCue: s.visualCue || s.visual || "",
          spokenText: s.spokenText || s.voiceover || "",
          onScreenText:
            s.onScreenText || s.teksLayar || s.spokenText || s.voiceover || "",
        }))
      : []

  const sectionsBersih = rawSections.map((sec, idx) => {
    const partNumber = sec.partNumber || idx + 1
    const partTitle = sec.partTitle || `Bagian ${partNumber}`
    const estimatedSeconds =
      sec.estimatedSeconds || `${idx * 10}s - ${(idx + 1) * 12}s`
    const spokenText = sec.spokenText || sec.voiceover || ""
    const onScreenText = sec.onScreenText || sec.teksLayar || spokenText
    const visualCue =
      sec.visualCue || sec.visual || "Tatap kamera dengan ekspresi natural"

    return {
      partNumber,
      partTitle,
      estimatedSeconds,
      visualCue,
      spokenText,
      onScreenText,
    }
  })

  // Sinkronkan ke array `segmen` agar komponen lama (Teleprompter di page.js, Database, Arsip) langsung kompatibel 100%
  const segmenSinkron = sectionsBersih.map((sec) => ({
    idSegmen: `BEAT_${sec.partNumber}`,
    partNumber: sec.partNumber,
    partTitle: sec.partTitle,
    estimatedSeconds: sec.estimatedSeconds,
    labelMini: `Bagian ${sec.partNumber} • ${sec.partTitle}${
      sec.estimatedSeconds ? ` (${sec.estimatedSeconds})` : ""
    }`,
    voiceover: sec.spokenText,
    spokenText: sec.spokenText,
    teksLayar: sec.onScreenText,
    onScreenText: sec.onScreenText,
    visual: sec.visualCue,
    visualCue: sec.visualCue,
  }))

  const uploadPkg = rawObj.uploadPackage || rawObj.upload_pack || {}
  const uploadPackageBersih = {
    coverTitle: uploadPkg.coverTitle || uploadPkg.cover_title || "",
    caption: uploadPkg.caption || uploadPkg.caption_seo || "",
    pinnedComment: uploadPkg.pinnedComment || uploadPkg.pinned_comment || "",
  }

  return {
    ...rawObj,
    targetDuration:
      rawObj.targetDuration || aturanDurasi?.targetDuration || "60 Detik",
    flowStyle:
      rawObj.flowStyle || aturanDurasi?.flowStyle || "Obrolan Mengalir",
    totalSections: sectionsBersih.length,
    sections: sectionsBersih,
    segmen: segmenSinkron,
    metadata: {
      ...(rawObj.metadata || {}),
      estimated_duration:
        rawObj.targetDuration ||
        rawObj.metadata?.estimated_duration ||
        aturanDurasi?.targetDuration ||
        "60 Detik",
      flow_style:
        rawObj.flowStyle || aturanDurasi?.flowStyle || "Obrolan Mengalir",
      total_sections: sectionsBersih.length,
    },
    uploadPackage: uploadPackageBersih,
    upload_pack: {
      cover_title: uploadPackageBersih.coverTitle,
      caption_seo: uploadPackageBersih.caption,
      pinned_comment: uploadPackageBersih.pinnedComment,
    },
  }
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
    // Abaikan jika gagal log
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
  const promptLengkap = `${promptText}\n\n${ATURAN_BAHASA_LISAN_KAMERA}`

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
// MESIN 2: TEKS & COPYWRITING LISAN (DEEPSEEK-V3 / GPT-4O MINI)
// ============================================================================
async function panggilTeksPintar(openRouterKey, geminiKey, promptText) {
  let errorCatatan = ""
  const promptFinal = `${promptText}\n\n${ATURAN_BAHASA_LISAN_KAMERA}`

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
              "X-Title": "Hookya Master Script Engine",
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: "system",
                  content:
                    "Kamu adalah Produser Konten & Penulis Naskah Video Pendek Indonesia. Kamu menulis dengan bahasa lisan kamera yang sangat natural (kalimat pendek 8-14 kata per tarikan napas, memakai kata sambung obrolan sehari-hari, tanpa kata brosur/iklan kaku, tanpa em dash, dan tanpa struktur 'bukan sekadar X tapi Y'). Balas HANYA dalam format JSON yang valid.",
                },
                { role: "user", content: promptFinal },
              ],
              response_format: { type: "json_object" },
              temperature: 0.7,
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
      promptText: promptFinal,
    })
  }

  throw new Error(errorCatatan || "API Key AI belum aktif")
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
      contextMode = "sesuai_niche",
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

    // =========================================================================
    // 1. TOMBOL "i Referensi" PADA PROFILING
    // =========================================================================
    if (action === "suggest_profiling_field") {
      const promptSaran = `
Pengguna sedang mengisi kolom "${fieldLabel}" (Kode: "${fieldKey}").
Data jawaban pengguna dari kolom sebelumnya:
${JSON.stringify(accumulatedProfile)}

Berikan 4 contoh isian yang konkret, membumi, dan memakai bahasa sehari-hari (bukan bahasa brosur/CV kaku).

Keluarkan HANYA valid JSON:
{
  "insight_singkat": "1 kalimat alasan praktis kenapa contoh ini pas dengan profilmu.",
  "pilihan_referensi": [
    "Contoh konkret 1...",
    "Contoh konkret 2...",
    "Contoh konkret 3...",
    "Contoh konkret 4..."
  ]
}`
      const hasil = await panggilTeksPintar(
        openRouterKey,
        geminiKey,
        promptSaran,
      )
      return NextResponse.json(hasil)
    }

    // =========================================================================
    // 2. SCAN SCREENSHOT PRODUK AFFILIATE (PILAR 3: TERJEMAHKAN SPEK KE PENGALAMAN PAKAI)
    // =========================================================================
    if (action === "analyze_marketplace_screenshots") {
      const promptSS = `
Baca gambar screenshot produk atau spesifikasi marketplace yang dilampirkan.
ATURAN KHUSUS AFFILIATE (PILAR 3):
1. "namaProduk": Salin nama produk dari gambar.
2. "brand": Salin nama merek atau toko yang tertulis di gambar (jika tidak ada, tulis "-").
3. "hargaPromo": Salin angka harga yang terlihat di gambar.
4. "keunggulanSpesifikasi": Jangan hanya menyalin daftar kata teknis kaku (seperti "Combed 30s, 500ml, 5000mAh"), tetapi TERJEMAHKAN spesifikasi yang tertulis di gambar menjadi pengalaman pemakaian fisik yang nyata (contoh: "Bahan katun tipis yang menyerap keringat, dipakai naik motor siang bolong nggak bikin punggung lembap").
5. "masalahDipecahkan": Kejadian atau kerepotan harian pembeli yang langsung beres kalau pakai barang ini.

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

    // =========================================================================
    // 3. TRANSKRIP SUARA MIKROFON
    // =========================================================================
    if (action === "transkrip_suara_mic") {
      if (!audioBase64) {
        return NextResponse.json(
          { error: "Error sistem, silakan refresh atau hubungi admin." },
          { status: 400 },
        )
      }
      const promptAudio = `
Salin ucapan di dalam rekaman suara ini kata demi kata menjadi teks Bahasa Indonesia.
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

    // =========================================================================
    // 4. EKSTRAK VIDEO + BEDAH KOMPETITOR
    // =========================================================================
    if (action === "rewrite_video") {
      const instruksiPersona = susunInstruksiPersonaTerpisah(
        personaProfile,
        "lintas_produk",
        detailInput || namaFileVideo,
      )

      const promptVideo = `
Tugasmu:
1. Salin kata demi kata ucapan audio atau teks di layar video ke dalam "transkripAsliVideo".
2. Jika video kosong tanpa ucapan maupun teks layar yang terbaca, isi "unreadableError": true.
3. Jelaskan struktur video tersebut pada "bedahKompetitor" ("jenisHookAsli", "pemicuEmosi", "rahasiaRetensi").
4. Tulis naskah baru yang orisinil berdasarkan isi video tersebut menggunakan Voice DNA pengguna:
${instruksiPersona}
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
    { "idSegmen": "HOOK", "labelMini": "Bagian 1 • Pancingan Awal (0:00 - 0:05)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "BODY_STORY", "labelMini": "Bagian 2 • Situasi & Masalah (0:05 - 0:18)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "VALUE_SOLUTION", "labelMini": "Bagian 3 • Cara Kerja & Solusi (0:18 - 0:35)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "CTA", "labelMini": "Bagian 4 • Penutup & Ajakan (0:35 - 0:45)", "voiceover": "...", "teksLayar": "...", "visual": "..." }
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

    // =========================================================================
    // 5. PROFILING 360° (PILAR 2: PISAHKAN LAPIS 1 VOICE DNA VS LAPIS 2 KONTEKS NICHE)
    // =========================================================================
    let promptFinal = ""

    if (action === "extract_persona_dna") {
      promptFinal = `
Susun matriks identitas kreator dari data berikut dan pisahkan secara tegas antara LAPIS 1 (Voice DNA / Cara Ngobrol) dan LAPIS 2 (Konteks Niche & Target Penonton):
- Data Profil: ${JSON.stringify(onboardingAnswers)}
- Sampel Kalimat Asli Pengguna: "${rawWritingSamples || ""}"

TUGAS PEMISAHAN (PILAR 2):
1. "voice_dna" (Lapis 1 - Dikunci di semua skrip): Ekstrak kata ganti diri, sapaan penonton, partikel lisan khas (seperti sih, tuh, kan, deh, lho, banget, ya), kata sambung awal kalimat, serta ritme bicara dari Sampel Kalimat Asli Pengguna.
2. "niche_context" (Lapis 2 - Kontekstual sesuai topik): Petakan bidang utama, keunikan pengalaman (USP), segmen penonton, masalah utama penonton, dan alasan ragu.

Keluarkan HANYA valid JSON:
{
  "user_id": "${onboardingAnswers?.user_id || "usr_99281"}",
  "persona_summary": "Ringkasan lugas tentang cara ngobrol khas pengguna dan fokus bahasan utamanya.",
  "voice_dna": {
    "self_pronoun": "${onboardingAnswers?.sapaan_diri || "Aku"}",
    "audience_pronoun": "${onboardingAnswers?.sapaan_audiens || "Kamu"}",
    "spoken_particles": ["sih", "tuh", "kan", "deh", "banget"],
    "greeting_signature": ["Jujur ya,", "Soalnya gini,", "Coba deh perhatiin,"],
    "favorite_transitions": ["Nah, masalahnya tuh,", "Makanya kemarin,", "Terus kalau ditanya,"],
    "delivery_style": "${onboardingAnswers?.gaya_kepribadian || "Santai, jujur, kalimat pendek 8-14 kata per napas"}"
  },
  "niche_context": {
    "primary_niche": "${onboardingAnswers?.minat_utama || "Konten Harian & Edukasi Praktis"}",
    "authority_role": "${onboardingAnswers?.peran_dan_otoritas || "Praktisi"}",
    "unique_selling_point": "${onboardingAnswers?.usp_diri || "Berbagi pengalaman praktik langsung"}",
    "common_enemy": "${onboardingAnswers?.pandangan_kontra || "Teori rumit tanpa langkah praktis"}",
    "personal_analogies": "${onboardingAnswers?.analogi_khas || "Kejadian sehari-hari"}",
    "segment_profile": "${onboardingAnswers?.target_segmen || "Penonton umum"}",
    "deepest_pain_points": "${onboardingAnswers?.target_ketakutan || "Rugi waktu dan salah langkah"}",
    "secret_desires": "${onboardingAnswers?.target_impian || "Hasil nyata yang langsung terasa"}",
    "common_objections": "${onboardingAnswers?.target_keraguan || "Bingung mulai dari mana"}"
  },
  "positioning_and_usp": {
    "authority_role": "${onboardingAnswers?.peran_dan_otoritas || "Praktisi"}",
    "unique_selling_point": "${onboardingAnswers?.usp_diri || "Berbagi pengalaman praktik langsung"}",
    "common_enemy": "${onboardingAnswers?.pandangan_kontra || "Teori rumit tanpa langkah praktis"}",
    "personal_analogies": "${onboardingAnswers?.analogi_khas || "Kejadian sehari-hari"}"
  },
  "target_audience": {
    "segment_profile": "${onboardingAnswers?.target_segmen || "Penonton umum"}",
    "deepest_pain_points": "${onboardingAnswers?.target_ketakutan || "Rugi waktu dan salah langkah"}",
    "secret_desires": "${onboardingAnswers?.target_impian || "Hasil nyata yang langsung terasa"}",
    "common_objections": "${onboardingAnswers?.target_keraguan || "Bingung mulai dari mana"}"
  },
  "linguistic_matrix": {
    "self_pronoun": "${onboardingAnswers?.sapaan_diri || "Aku"}",
    "audience_pronoun": "${onboardingAnswers?.sapaan_audiens || "Kamu"}",
    "greeting_signature": ["Jujur ya,", "Soalnya gini,"],
    "favorite_transitions": ["Nah, masalahnya tuh,", "Makanya kemarin,"],
    "signature_vocabulary": ["sih", "tuh", "kan", "deh"],
    "forbidden_words": [
      "Pernahkah kamu merasa",
      "Bayangkan jika",
      "Di era digital",
      "Tahukah kamu bahwa",
      "Solusi terbaik",
      "inovatif",
      "berkualitas tinggi",
      "dirancang khusus",
      "wajib dimiliki",
      "mengubah hidupmu",
      "bukan sekadar",
      "tidak hanya"
    ],
    "code_switching_level": "Natural"
  },
  "rhythm_and_delivery": {
    "sentence_length": "1 tarikan napas pendek (8-14 kata per kalimat)",
    "pacing": "Langsung masuk ke masalah nyata dengan kata sambung obrolan"
  }
}`
    }

    // =========================================================================
    // 6. ASESMEN TAHAP 1, 2, DAN 3 (PILAR 1, PILAR 2, & PILAR 3)
    // =========================================================================
    else if (action === "assessment_copilot") {
      const modeKonteksAktif =
        stageInput?.contextMode || contextMode || "sesuai_niche"
      const topikSaatIni =
        stageInput?.rawTopic ||
        stageInput?.coreIdea ||
        stageInput?.detailPromosi?.namaProduk ||
        "Topik Konten"

      const blokPersona = susunInstruksiPersonaTerpisah(
        personaProfile,
        modeKonteksAktif,
        topikSaatIni,
      )

      const infoKonteks = stageInput?.detailPromosi
        ? `DETAIL PROMOSI (${stageInput.jenisPromosi}):\n${JSON.stringify(stageInput.detailPromosi)}`
        : `Topik Bahasan: "${stageInput?.rawTopic}"`

      const catatanHindariDuplikat =
        opsiSebelumnya && opsiSebelumnya.length > 0
          ? `\nPENGGUNA MEMINTA OPSI BARU (SET KE-${batchKe || 2}): Jangan ulangi kalimat pada opsi sebelumnya ini: ${JSON.stringify(opsiSebelumnya)}`
          : ""

      if (stageNumber === 1) {
        promptFinal = `
Kamu adalah Produser Konten pendamping untuk "${namaUser || "Kreator"}".
${blokPersona}

DATA KONTEN TAHAP 0:
- Kategori: "${stageInput?.kategori}"
- ${infoKonteks}
- Target Durasi: "${stageInput?.targetPlatform}"
${catatanHindariDuplikat}

TUGAS TAHAP 1 (PILAR 3 - 3 OPSI SUDUT PANDANG TAJAM & KONKRET):
1. Pada "co_pilot_message", tanggapi topik ini dengan bahasa ngobrol yang akrab dan langsung masuk ke poin menariknya.
2. Rumuskan 1 kalimat inti bahasan pada "refined_core_idea".
3. Berikan 3 pilihan sudut pandang ("angle_options") yang memotret kejadian/masalah spesifik di lapangan menggunakan bahasa lisan (bukan judul makalah kuliah):
   - Opsi 1 ("Bongkar Kesalahan Umum"): Kebiasaan salah yang sering dilakukan orang tanpa sadar saat menghadapi hal ini.
   - Opsi 2 ("Jalan Pintas / Solusi Praktis"): Cara beresin masalahnya tanpa ribet atau tanpa keluar biaya mahal.
   - Opsi 3 ("Sudut Pandang Berlawanan / Kontras"): Membantah anggapan umum yang justru sering bikin orang rugi.
4. Pada "story_prompt_question", tanyakan 1 pertanyaan singkat untuk memancing cerita kejadian nyata atau pengalaman pakai dari kreator.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "refined_core_idea": "...",
  "angle_options": [
    { "id": "angle_1", "type": "Bongkar Kesalahan Umum", "angle_text": "..." },
    { "id": "angle_2", "type": "Jalan Pintas / Solusi Praktis", "angle_text": "..." },
    { "id": "angle_3", "type": "Sudut Pandang Berlawanan / Kontras", "angle_text": "..." }
  ],
  "story_prompt_question": "..."
}`
      } else if (stageNumber === 2) {
        promptFinal = `
Kamu adalah Produser Konten pendamping untuk "${namaUser || "Kreator"}".
${blokPersona}

DATA TAHAP 1:
- Inti Bahasan: "${stageInput?.coreIdea}"
- Sudut Pandang Terpilih: "${stageInput?.chosenAngle}"
- Pengalaman / Detail dari Kreator: "${stageInput?.userStory || "(Belum diisi)"}"
- Detail Produk/Campaign (jika ada): ${JSON.stringify(stageInput?.detailPromosi || {})}
${catatanHindariDuplikat}

TUGAS TAHAP 2 (PILAR 3 - PERUMPAMAAN HARIAN, SEBAB-AKIBAT FISIK, & PENGALAMAN PAKAI NYATA):
1. Tanggapi secara akrab di "co_pilot_message".
2. Buat 2 pilihan perumpamaan sehari-hari ("relatable_analogies") yang sangat dekat dengan keseharian orang Indonesia (contoh gaya: ibarat masak mie kelamaan sampai lembek, ibarat nambal ban bocor halus, ibarat beli baju kekecilan).
3. Buat 3 Kartu Penjelasan Konkret ("reference_cards") dengan bahasa ngobrol:
   - Kartu 1 ("Sebab -> Akibat Fisik Nyata"): Jelaskan logika kenapa masalah itu terjadi atau bagaimana produk bekerja secara fisik (tanpa istilah ilmiah rumit dan tanpa mengarang angka riset palsu).
   - Kartu 2 ("Kejadian Spesifik di Lapangan"): Situasi harian yang paling sering dialami penonton terkait hal ini.
   - Kartu 3 ("Pengalaman Pemakaian / Bukti Nyata"): Jika ini produk Affiliate, terjemahkan spesifikasinya menjadi rasa/pengalaman saat dipakai langsung (misal: dipakai seharian nggak bikin gerah, ditaruh di tas nggak tumpah).
4. Berikan 3 langkah solusi atau manfaat konkret ("suggested_solutions") yang langsung terbayang cara melakukannya.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "relatable_analogies": ["Ibarat...", "Kayak pas kita..."],
  "reference_cards": [
    { "type": "Sebab -> Akibat Fisik Nyata", "title": "...", "summary": "..." },
    { "type": "Kejadian Spesifik di Lapangan", "title": "...", "summary": "..." },
    { "type": "Pengalaman Pemakaian Nyata", "title": "...", "summary": "..." }
  ],
  "suggested_solutions": ["Langkah / Manfaat 1...", "Langkah / Manfaat 2...", "Langkah / Manfaat 3..."]
}`
      } else if (stageNumber === 3) {
        promptFinal = `
Kamu adalah Produser Copywriting Lisan untuk "${namaUser || "Kreator"}".
${blokPersona}

DATA TAHAP 1 & 2:
- Inti Bahasan: "${stageInput?.coreIdea}"
- Sudut Pandang: "${stageInput?.chosenAngle}"
- Perumpamaan/Cerita: "${stageInput?.personalStory}"
- Penjelasan Mekanisme: ${JSON.stringify(stageInput?.injectedReference)}
- Solusi/Manfaat: ${JSON.stringify(stageInput?.actionableSolutions)}
${catatanHindariDuplikat}

TUGAS TAHAP 3 (PILAR 3 - 6 KATEGORI HOOK LISAN KAMERA & 3 CTA SPESIFIK):
1. Berikan pengantar singkat di "co_pilot_message".
2. Pilih 1 alur pembawaan terbaik ("PAS_RELATABLE_BRIDGE", "HSO_STORY", "CONTRARIAN_MYTH_BUSTER", atau "BAB_TRANSFORMATION") beserta alasannya di "framework_reason".
3. WAJIB buat 6 pilihan kalimat pembuka ("hook_options"). Setiap Hook maksimal 1–2 kalimat lisan pendek (maksimal 3 detik ucap, 8–14 kata per kalimat) dengan sapaan khas kreator, mengikuti 6 pola ini:
   - "Negative / Warning Hook": Pola peringatan langsung (contoh: "Jangan buru-buru [tindakan] kalau belum cek bagian ini...")
   - "Positive Outcome Hook": Pola hasil nyata tanpa ribet (contoh: "Cuma modal ubah kebiasaan kecil ini, [masalah] langsung beres tanpa perlu [hal ribet].")
   - "Proof Hook": Pola bukti pengalaman duluan (contoh: "Ini yang kejadian setelah [waktu/pengalaman nyata] pakai cara ini buat ngatasin [masalah].")
   - "Contrarian Hook": Pola bantah mitos umum (contoh: "Banyak yang ngira [mitos umum] itu bener, padahal justru itu yang bikin [masalah makin parah].")
   - "Relatable POV Hook": Pola kejadian yang bikin kesel/relate (contoh: "Pasti kesel banget kan pas lagi [situasi harian], tiba-tiba [masalah kejadian]?")
   - "Curiosity Gap Hook": Pola biang kerok sepele (contoh: "Ternyata biang kerok kenapa [masalah susah hilang] tuh cuma gara-gara satu hal sepele ini.")
4. Buat 3 pilihan kalimat penutup ("cta_options") yang terdengar natural saat diucapkan di akhir video.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "recommended_framework": "PAS_RELATABLE_BRIDGE",
  "framework_reason": "...",
  "hook_options": [
    { "category": "Negative / Warning Hook", "why_it_works": "Mencegah penonton melakukan kesalahan yang bikin rugi", "text": "..." },
    { "category": "Positive Outcome Hook", "why_it_works": "Menawarkan jalan keluar praktis tanpa ribet", "text": "..." },
    { "category": "Proof Hook", "why_it_works": "Membuka dengan hasil pengalaman nyata", "text": "..." },
    { "category": "Contrarian Hook", "why_it_works": "Membantah kebiasaan keliru yang sering dipercaya", "text": "..." },
    { "category": "Relatable POV Hook", "why_it_works": "Menyentuh kejadian harian yang sering bikin kesel", "text": "..." },
    { "category": "Curiosity Gap Hook", "why_it_works": "Membongkar satu penyebab sepele yang jarang disadari", "text": "..." }
  ],
  "cta_options": [
    { "category": "Pancing Obrolan Komentar", "text": "..." },
    { "category": "Simpan & Bagikan ke Teman", "text": "..." },
    { "category": "Cek Produk / Tindakan Langsung", "text": "..." }
  ]
}`
      }
    }

    // =========================================================================
    // 7. PENYUSUN SKRIP AKHIR — DYNAMIC STORY BEATS (PILAR 1, 2, 4: 3 S/D 8 BAGIAN)
    // =========================================================================
    else if (action === "assemble_humanized_script") {
      const aturanBeats = getAturanDynamicStoryBeats(
        contentBrief?.target_platform || "45 - 60 Detik",
      )
      const modeKonteksAktif =
        contentBrief?.context_mode || contextMode || "sesuai_niche"

      const blokPersona = susunInstruksiPersonaTerpisah(
        personaProfile,
        modeKonteksAktif,
        contentBrief?.core_idea,
      )

      const isModeUGC =
        Boolean(ugcConfig?.aktif) ||
        (bentukKonten && bentukKonten.toLowerCase().includes("ugc"))

      const daftarPemeran = Array.isArray(ugcConfig?.namaPemeran)
        ? ugcConfig.namaPemeran.filter(Boolean).join(", ")
        : "Pemeran 1, Pemeran 2"

      const instruksiUGC = isModeUGC
        ? `\nFORMAT DIALOG UGC (${ugcConfig?.jumlahOrang || 2} ORANG: ${daftarPemeran}): Tulis percakapan saling menyahut yang natural di setiap bagian.`
        : `\nFORMAT MONOLOG LISAN KAMERA: Gunakan sapaan khas kreator secara konsisten.`

      promptFinal = `
Susun naskah skrip video menggunakan sistem DYNAMIC STORY BEATS (PILAR 4).
${blokPersona}

RANCANGAN KONTEN TERKUNCI:
${JSON.stringify(contentBrief)}

BENTUK EKSEKUSI VISUAL: "${bentukKonten}"
${instruksiUGC}

ATURAN DYNAMIC STORY BEATS & SCALING DURASI (PILAR 4):
${aturanBeats.instruksiBabak}

ATURAN WAJIB SETIAP BAGIAN (BEAT):
1. Setiap 1 bagian ("section") HANYA BOLEH berisi 2 sampai 3 kalimat lisan pendek (durasi ucap 10-15 detik, 8-14 kata per kalimat). Jangan pernah menumpuk paragraf panjang dalam 1 bagian!
2. Antar bagian wajib menyambung mulus menggunakan kata penghubung obrolan ("Soalnya gini...", "Nah, masalahnya tuh...", "Coba bayangin...", "Makanya...", "Terus kalau ditanya...") sehingga dari Bagian 1 sampai Bagian terakhir terdengar seperti satu obrolan utuh yang mengalir.
3. Pada setiap bagian, sertakan:
   - "partNumber": Nomor urut bagian (1, 2, 3, dst.)
   - "partTitle": Judul babak obrolan yang spesifik
   - "estimatedSeconds": Rentang detik (contoh: "0:00 - 0:05")
   - "visualCue": Arahan ekspresi wajah, intonasi, atau gerakan tangan/kamera yang konkret
   - "spokenText": Naskah ucapan lisan kamera (2-3 kalimat pendek)
   - "onScreenText": Teks singkat padat untuk tulisan di layar video

Keluarkan HANYA valid JSON dengan struktur berikut:
{
  "targetDuration": "${aturanBeats.targetDuration}",
  "flowStyle": "${aturanBeats.flowStyle}",
  "totalSections": ${aturanBeats.totalSectionsDefault},
  "sections": [
    {
      "partNumber": 1,
      "partTitle": "Pancingan Awal (Hook)",
      "estimatedSeconds": "0:00 - 0:05",
      "visualCue": "...",
      "spokenText": "...",
      "onScreenText": "..."
    }
  ],
  "script_score": {
    "total_score": 94,
    "hook_strength": "Kalimat pembuka langsung masuk ke inti masalah dengan bahasa lisan.",
    "retention_bridge": "Setiap bagian terdiri dari 2-3 kalimat pendek yang tersambung dengan kata penghubung obrolan.",
    "producer_tip": "Jaga intonasi tetap santai seperti sedang ngobrol berdua dengan teman."
  },
  "uploadPackage": {
    "coverTitle": "...",
    "caption": "...",
    "pinnedComment": "..."
  }
}`

      const hasilMentah = await panggilTeksPintar(
        openRouterKey,
        geminiKey,
        promptFinal,
      )
      const hasilNormal = normalisasiHasilSkripDinamis(hasilMentah, aturanBeats)
      return NextResponse.json(hasilNormal)
    }

    // =========================================================================
    // 8. PENGUBAH DURASI SKRIP (PILAR 4: TAMBAH/KURANGI JUMLAH BAGIAN DINAMIS 3-8 BEAT)
    // =========================================================================
    else if (action === "ubah_durasi_skrip") {
      const aturanBeats = getAturanDynamicStoryBeats(durasiTargetBaru)
      const blokPersona = susunInstruksiPersonaTerpisah(
        personaProfile,
        contextMode,
        body.subyek,
      )

      promptFinal = `
Ubah durasi dan jumlah babak obrolan dari naskah skrip berikut menggunakan aturan DYNAMIC STORY BEATS (PILAR 4).
${blokPersona}

Topik Skrip: "${body.subyek || "Konten Video"}"
Naskah Skrip Saat Ini:
${JSON.stringify(skripSebelumnya)}

ATURAN SCALING DURASI BARU ("${durasiTargetBaru}"):
${aturanBeats.instruksiBabak}

PERINGATAN KERAS:
- DILARANG hanya memanjangkan kalimat di dalam 4 kotak lama!
- Kamu WAJIB mengubah jumlah item di dalam array "sections" menjadi ${aturanBeats.minSections} sampai ${aturanBeats.maxSections} bagian sesuai tabel durasi di atas.
- Setiap bagian tetap hanya boleh berisi 2–3 kalimat lisan pendek (8–14 kata per kalimat) dan saling menyambung alami dari bagian pertama sampai bagian terakhir.

Keluarkan HANYA valid JSON:
{
  "targetDuration": "${aturanBeats.targetDuration}",
  "flowStyle": "${aturanBeats.flowStyle}",
  "totalSections": ${aturanBeats.totalSectionsDefault},
  "sections": [
    {
      "partNumber": 1,
      "partTitle": "Pancingan Awal (Hook)",
      "estimatedSeconds": "0:00 - 0:05",
      "visualCue": "...",
      "spokenText": "...",
      "onScreenText": "..."
    }
  ]
}`

      const hasilMentah = await panggilTeksPintar(
        openRouterKey,
        geminiKey,
        promptFinal,
      )
      const hasilNormal = normalisasiHasilSkripDinamis(hasilMentah, aturanBeats)
      return NextResponse.json(hasilNormal)
    }

    // =========================================================================
    // 9. GENERATOR STOK KONTEN MASSAL (2X, 5X, 10X VARIASI DENGAN DYNAMIC SECTIONS)
    // =========================================================================
    else if (action === "multiply_script_variations") {
      const jml = Math.min(10, Math.max(2, parseInt(jumlahMultiplier) || 2))
      const jumlahBeatInduk =
        Array.isArray(skripSebelumnya) && skripSebelumnya.length >= 3
          ? skripSebelumnya.length
          : 4

      const blokPersona = susunInstruksiPersonaTerpisah(
        personaProfile,
        contextMode,
        body.subyek,
      )

      promptFinal = `
Buat ${jml} variasi naskah skrip baru yang berbeda sudut pandang dan berbeda kalimat pembuka (Hook)-nya dari skrip induk berikut.
${blokPersona}

Topik Induk: "${body.subyek || "Konten Kreator"}"
Skrip Induk Saat Ini (${jumlahBeatInduk} Bagian):
${JSON.stringify(skripSebelumnya)}

ATURAN:
- Setiap variasi wajib terdiri dari ${jumlahBeatInduk} bagian ("sections") yang mengalir dengan bahasa lisan kamera (2-3 kalimat pendek per bagian).
- Setiap variasi wajib mengangkat sudut pandang atau jenis Hook yang berbeda agar bisa diunggah di hari yang berbeda.

Keluarkan HANYA valid JSON:
{
  "daftarVariasi": [
    {
      "judulVariasi": "Variasi 1: [Sudut Pandang Spesifik]",
      "sections": [
        {
          "partNumber": 1,
          "partTitle": "Pancingan Awal (Hook)",
          "estimatedSeconds": "0:00 - 0:05",
          "visualCue": "...",
          "spokenText": "...",
          "onScreenText": "..."
        }
      ]
    }
  ]
}`

      const hasilMentah = await panggilTeksPintar(
        openRouterKey,
        geminiKey,
        promptFinal,
      )

      if (Array.isArray(hasilMentah?.daftarVariasi)) {
        hasilMentah.daftarVariasi = hasilMentah.daftarVariasi.map((v) => {
          const norm = normalisasiHasilSkripDinamis(v, null)
          return {
            ...v,
            judulVariasi: v.judulVariasi,
            sections: norm.sections,
            segmen: norm.segmen,
          }
        })
      }
      return NextResponse.json(hasilMentah)
    } else if (action === "regenerate_satu_kerangka") {
      const blokPersona = susunInstruksiPersonaTerpisah(
        personaProfile,
        contextMode,
        body.subyek,
      )

      promptFinal = `
Tulis ulang SATU bagian naskah ini saja ("${segmenTarget?.partTitle || segmenTarget?.labelMini}") dengan variasi kalimat lisan baru yang tetap pendek (2-3 kalimat, 8-14 kata per kalimat) dan menyambung enak.
${blokPersona}
Topik: "${body.subyek || "Konten Video"}"
Bagian saat ini: ${JSON.stringify(segmenTarget)}

Keluarkan HANYA valid JSON:
{
  "spokenText": "...",
  "onScreenText": "...",
  "visualCue": "...",
  "voiceover": "...",
  "teksLayar": "...",
  "visual": "..."
}`
    } else if (action === "analyze_script_diff") {
      promptFinal = `
Pelajari perubahan kata yang dilakukan pengguna antara draf awal dan hasil editannya untuk menyelaraskan Voice DNA pengguna:
- Draf Awal: ${JSON.stringify(aiDraft)}
- Editan Pengguna: ${JSON.stringify(userEditedScript)}
- Profil Saat Ini: ${JSON.stringify(personaProfile)}

Keluarkan HANYA valid JSON:
{
  "learning_summary": ["Gaya kalimat lisan dari revisimu telah disimpan ke Voice DNA."],
  "updated_persona_profile": ${JSON.stringify(personaProfile)}
}`
    } else if (action === "buat_10_ide_topik") {
      promptFinal = `
Buat 10 ide topik konten yang konkret, membumi, dan langsung menyentuh masalah harian penonton berdasarkan profil kreator berikut:
${JSON.stringify(personaProfile)}

Jangan gunakan judul klise seperti "Rahasia Sukses" atau "Membuka Potensi".
Balas HANYA dalam format JSON:
{
  "ideTopik": [
    { "judul": "...", "nuansa": "...", "ringkasan": "..." }
  ]
}`
    } else if (action === "ubah_bentuk_konten") {
      const jumlahBagianSaatIni = Array.isArray(skripSebelumnya)
        ? skripSebelumnya.length
        : 4
      promptFinal = `
Sesuaikan ke-${jumlahBagianSaatIni} bagian naskah skrip berikut ke dalam format eksekusi visual baru: "${bentukKontenBaru}".
Pertahankan jumlah bagian (${jumlahBagianSaatIni} bagian) dan pastikan setiap bagian tetap terdiri dari 2-3 kalimat lisan pendek yang mengalir.
Skrip saat ini: ${JSON.stringify(skripSebelumnya)}

Keluarkan HANYA valid JSON:
{
  "sections": [
    {
      "partNumber": 1,
      "partTitle": "...",
      "estimatedSeconds": "0:00 - 0:05",
      "visualCue": "...",
      "spokenText": "...",
      "onScreenText": "..."
    }
  ]
}`

      const hasilMentah = await panggilTeksPintar(
        openRouterKey,
        geminiKey,
        promptFinal,
      )
      const hasilNormal = normalisasiHasilSkripDinamis(hasilMentah, null)
      return NextResponse.json(hasilNormal)
    } else if (action === "evaluasi_kinerja_vt") {
      promptFinal = `
Berikan evaluasi singkat dan praktis dalam 2 kalimat berdasarkan angka metrik kinerja konten berikut:
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
