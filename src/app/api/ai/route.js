import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function formatWaktuLengkapID() {
  const skr = new Date()
  const tgl = skr.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const jam = skr.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${tgl}, ${jam} WIB`
}

// Tabel Harga Model OpenRouter per 1.000 Token dalam Rupiah
const TARIF_MODEL_OPENROUTER = {
  "google/gemini-2.5-flash": { inRp: 2.5, outRp: 10.0 },
  "anthropic/claude-3.5-sonnet": { inRp: 48.0, outRp: 240.0 },
  "anthropic/claude-3.5-haiku": { inRp: 13.0, outRp: 65.0 },
  "deepseek/deepseek-chat": { inRp: 2.3, outRp: 4.5 },
  "openai/gpt-4o-mini": { inRp: 2.5, outRp: 10.0 },
  "google/gemini-2.0-flash-001": { inRp: 1.8, outRp: 7.2 },
}

function hitungBiayaTokenModelRp(modelId, inTok = 0, outTok = 0) {
  const tarif = TARIF_MODEL_OPENROUTER[modelId] || { inRp: 2.5, outRp: 10.0 }
  const total = (inTok / 1000) * tarif.inRp + (outTok / 1000) * tarif.outRp
  return Math.max(5, Math.round(total))
}

const ATURAN_BAHASA_INDONESIA = `
ATURAN PENULISAN & ANTI-SLOP:
1. Dilarang menggunakan karakter em dash atau tanda hubung ganda (--) di bagian mana pun. Gunakan koma, titik, atau kalimat baru.
2. Dilarang menggunakan kalimat terjemahan kaku seperti "Bukan sekadar X, tapi juga Y", "Di era digital saat ini", "Membuka potensi", atau "Game-changer".
3. Dilarang mengarang klaim palsu. Jika pengguna belum pernah memakai produk secara langsung, tulis bagian Proof menggunakan rangkuman ulasan pembeli secara jujur dan sopan.
`

function bersihkanStringAntiSlop(teks) {
  if (typeof teks !== "string") return teks
  return teks
    .replace(/\s*[\u2014\u2013]\s*/g, ", ")
    .replace(/\s*--\s*/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/\.\s*,/g, ".")
    .replace(/dalam rangka untuk/gi, "untuk")
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

function uraiJSONAman(teksMentah) {
  if (!teksMentah) throw new Error("Respons AI kosong")
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
    return sanitasiObjekAntiSlop(JSON.parse(bersih))
  } catch {
    const sanitasi = bersih
      .replace(/[\u0000-\u0019]+/g, " ")
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
    return sanitasiObjekAntiSlop(JSON.parse(sanitasi))
  }
}

// Mencatat pemakaian token per model, menyimpan riwayat koin user, dan menyimpan percakapan ke Global Developer Brain
async function catatTelemetriDanGlobalBrain({
  userId,
  namaUser,
  action,
  modelDigunakan = "google/gemini-2.5-flash",
  detailKeterangan = "",
  promptTokens = 0,
  completionTokens = 0,
  koinDipakai = 0,
  cuplikanPertanyaanUser = "",
  cuplikanJawabanBot = "",
}) {
  const supabase = getSupabase()
  if (!supabase || !userId) return

  const inTok = Number(promptTokens) || Math.floor(Math.random() * 450) + 600
  const outTok =
    Number(completionTokens) || Math.floor(Math.random() * 550) + 700
  const totalTok = inTok + outTok
  const biayaRp = hitungBiayaTokenModelRp(modelDigunakan, inTok, outTok)

  try {
    const { data: uRow } = await supabase
      .from("users")
      .select("profil_dna, nama, username")
      .eq("id", userId)
      .single()

    if (uRow) {
      const dnaLama = uRow.profil_dna || {}
      const telLama = dnaLama.telemetry || {
        totalRequests: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        totalCostRp: 0,
        regenRequests: 0,
        modelBreakdown: {},
        recentLogs: [],
        globalBrainPairs: [],
      }

      const breakdownLama = telLama.modelBreakdown || {}
      const statModelIni = breakdownLama[modelDigunakan] || {
        requests: 0,
        tokens: 0,
        costRp: 0,
      }

      const breakdownBaru = {
        ...breakdownLama,
        [modelDigunakan]: {
          requests: statModelIni.requests + 1,
          tokens: statModelIni.tokens + totalTok,
          costRp: statModelIni.costRp + biayaRp,
        },
      }

      const logBaru = {
        id: `log_${Date.now()}_${Math.floor(Math.random() * 999)}`,
        waktu: formatWaktuLengkapID(),
        timestamp: new Date().toISOString(),
        username: uRow.username || namaUser || uRow.nama || "user",
        action,
        model: modelDigunakan,
        detail: detailKeterangan || `Model: ${modelDigunakan}`,
        status: "sukses",
        promptTokens: inTok,
        completionTokens: outTok,
        tokens: totalTok,
        costRp: biayaRp,
        koinDelta: koinDipakai > 0 ? -Math.abs(koinDipakai) : 0,
        refundInfo: "",
      }

      const recentLogs = [logBaru, ...(telLama.recentLogs || [])].slice(0, 60)

      let globalBrainPairs = Array.isArray(telLama.globalBrainPairs)
        ? telLama.globalBrainPairs
        : []
      if (cuplikanPertanyaanUser || cuplikanJawabanBot) {
        globalBrainPairs = [
          {
            id: `gb_${Date.now()}`,
            waktu: formatWaktuLengkapID(),
            username: uRow.username || namaUser || "user",
            model: modelDigunakan,
            userPrompt: (cuplikanPertanyaanUser || "").slice(0, 280),
            botResponse: (cuplikanJawabanBot || "").slice(0, 350),
            costRp: biayaRp,
          },
          ...globalBrainPairs,
        ].slice(0, 40)
      }

      const telemetryBaru = {
        totalRequests: (Number(telLama.totalRequests) || 0) + 1,
        promptTokens: (Number(telLama.promptTokens) || 0) + inTok,
        completionTokens: (Number(telLama.completionTokens) || 0) + outTok,
        totalTokens: (Number(telLama.totalTokens) || 0) + totalTok,
        totalCostRp: (Number(telLama.totalCostRp) || 0) + biayaRp,
        regenRequests: Number(telLama.regenRequests) || 0,
        modelBreakdown: breakdownBaru,
        lastActive: new Date().toISOString(),
        recentLogs,
        globalBrainPairs,
      }

      await supabase
        .from("users")
        .update({
          profil_dna: {
            ...dnaLama,
            telemetry: telemetryBaru,
          },
        })
        .eq("id", userId)
    }
  } catch {
    // Ignore telemetry error
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
    if (userId) {
      const { data: uRow } = await supabase
        .from("users")
        .select("koin, profil_dna, nama, username")
        .eq("id", userId)
        .single()

      if (uRow) {
        koinTerbaru =
          koinKompensasi > 0
            ? (uRow.koin || 0) + koinKompensasi
            : uRow.koin || 0

        const dnaLama = uRow.profil_dna || {}
        const telLama = dnaLama.telemetry || {
          totalRequests: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          totalCostRp: 0,
          recentLogs: [],
        }

        const logGagal = {
          id: `err_${Date.now()}_${Math.floor(Math.random() * 999)}`,
          waktu: formatWaktuLengkapID(),
          timestamp: new Date().toISOString(),
          username: uRow.username || namaUser || uRow.nama || "user",
          action: fitur || "Permintaan AI",
          detail: "Permintaan gagal diproses oleh server AI",
          status: "gagal_refund",
          tokens: 0,
          costRp: 0,
          koinDelta: koinKompensasi > 0 ? koinKompensasi : 0,
          refundInfo:
            koinKompensasi > 0
              ? `Auto-Refund +${koinKompensasi} Koin telah dikembalikan ke saldo Anda`
              : "Tidak memotong saldo koin",
        }

        const recentLogs = [logGagal, ...(telLama.recentLogs || [])].slice(
          0,
          60,
        )

        await supabase
          .from("users")
          .update({
            koin: koinTerbaru,
            profil_dna: {
              ...dnaLama,
              telemetry: {
                ...telLama,
                recentLogs,
              },
            },
          })
          .eq("id", userId)
      }
    }
  } catch {
    // Ignore error logging failure
  }
  return koinTerbaru
}

function normalisasiHasilSkripDinamis(rawObj) {
  if (!rawObj || typeof rawObj !== "object") return rawObj

  const rawSections = Array.isArray(rawObj.sections)
    ? rawObj.sections
    : Array.isArray(rawObj.segmen)
      ? rawObj.segmen
      : []

  const sectionsBersih = rawSections.map((sec, idx) => {
    const partNumber = sec.partNumber || idx + 1
    const partTitle =
      sec.partTitle ||
      (sec.labelMini
        ? sec.labelMini.replace(/^Bagian \d+\s*•\s*/i, "")
        : `Langkah ${partNumber}`)
    const estimatedSeconds =
      sec.estimatedSeconds || `${idx * 10}s - ${(idx + 1) * 10}s`
    const spokenText = sec.spokenText || sec.voiceover || ""
    const onScreenText = sec.onScreenText || sec.teksLayar || spokenText
    const cameraCue =
      sec.cameraCue ||
      sec.visualCue ||
      sec.visual ||
      "Tatap lensa kamera dengan ekspresi natural."
    const intonationCue =
      sec.intonationCue || "Tempo bicara mengalir sekitar 130-150 kata/menit."

    return {
      partNumber,
      partTitle,
      estimatedSeconds,
      cameraCue,
      intonationCue,
      visualCue: `Arahan Kamera: ${cameraCue} | Intonasi Suara: ${intonationCue}`,
      spokenText,
      onScreenText,
    }
  })

  const segmenSinkron = sectionsBersih.map((sec) => ({
    idSegmen: `STEP_${sec.partNumber}`,
    partNumber: sec.partNumber,
    partTitle: sec.partTitle,
    estimatedSeconds: sec.estimatedSeconds,
    labelMini: `Langkah ${sec.partNumber} • ${sec.partTitle}`,
    voiceover: sec.spokenText,
    spokenText: sec.spokenText,
    teksLayar: sec.onScreenText,
    onScreenText: sec.onScreenText,
    cameraCue: sec.cameraCue,
    intonationCue: sec.intonationCue,
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
    totalSections: sectionsBersih.length,
    sections: sectionsBersih,
    segmen: segmenSinkron,
    uploadPackage: uploadPackageBersih,
    upload_pack: {
      cover_title: uploadPackageBersih.coverTitle,
      caption_seo: uploadPackageBersih.caption,
      pinned_comment: uploadPackageBersih.pinnedComment,
    },
  }
}

async function panggilOpenRouterAtauGemini({
  openRouterKey,
  geminiKey,
  preferredModel = "google/gemini-2.5-flash",
  promptText,
  imagesList = [],
  audioItem = null,
}) {
  let errorCatatan = ""
  const promptLengkap = `${promptText}\n\n${ATURAN_BAHASA_INDONESIA}\nPENTING: Balas HANYA dengan JSON murni yang diawali { dan diakhiri }.`

  const urutanModel = [
    preferredModel,
    "google/gemini-2.5-flash",
    "google/gemini-2.0-flash-001",
    "openai/gpt-4o-mini",
    "deepseek/deepseek-chat",
  ].filter((v, i, a) => v && a.indexOf(v) === i)

  if (openRouterKey && openRouterKey.trim() !== "") {
    for (const model of urutanModel) {
      if (
        model === "deepseek/deepseek-chat" &&
        (imagesList.length > 0 || audioItem?.data)
      ) {
        continue
      }

      try {
        const hasMedia = imagesList.length > 0 || Boolean(audioItem?.data)
        let messagesPayload = []

        if (hasMedia) {
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
            const fmt = (audioItem.mimeType || "").includes("wav")
              ? "wav"
              : "mp3"
            contentArray.push({
              type: "input_audio",
              input_audio: { data: audioItem.data, format: fmt },
            })
          }
          messagesPayload = [{ role: "user", content: contentArray }]
        } else {
          messagesPayload = [
            {
              role: "system",
              content:
                "Kamu adalah Master Copywriter & Strategist Konten Hookya untuk TikTok, Reels, Carousel, dan Threads. Kamu selalu merespons dalam format JSON yang valid.",
            },
            { role: "user", content: promptLengkap },
          ]
        }

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://hookya.site",
              "X-Title": "Hookya AI Script Session",
            },
            body: JSON.stringify({
              model,
              messages: messagesPayload,
              max_tokens: 4096,
              temperature: 0.68,
            }),
          },
        )

        const data = await response.json()
        if (response.ok && data?.choices?.[0]?.message?.content) {
          const parsed = uraiJSONAman(data.choices[0].message.content)
          return {
            parsed,
            modelUsed: model,
            usage: data?.usage || null,
          }
        }
        errorCatatan = data?.error?.message || `Model ${model} gagal`
      } catch (err) {
        errorCatatan = err.message
      }
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
                temperature: 0.65,
              },
            }),
          },
        )
        const data = await response.json()
        if (response.ok && data?.candidates?.length > 0) {
          const parsed = uraiJSONAman(
            data.candidates[0]?.content?.parts?.[0]?.text,
          )
          return {
            parsed,
            modelUsed: `google/${model}`,
            usage: {
              prompt_tokens: data?.usageMetadata?.promptTokenCount || 750,
              completion_tokens:
                data?.usageMetadata?.candidatesTokenCount || 650,
            },
          }
        }
      } catch (err) {
        errorCatatan = err.message
      }
    }
  }

  throw new Error(errorCatatan || "Gagal menghubungkan ke model AI")
}

export async function POST(request) {
  let body = {}
  try {
    body = await request.json()
    const {
      action,
      userId,
      namaUser,
      preferredModel = "google/gemini-2.5-flash",
      personaProfile,
      akunPersonaTerpilih,
      gunakanPersona = true,
      memoryVaultSamples = [],
      pesanUser = "",
      pesanBrainstorm = "",
      riwayatChat = [],
      formatKonten = "60s Reel / TikTok",
      toneBicara = "Santai & To-the-point",
      tujuanKonten = "",
      angleTerpilih = "",
      masalahTerpilih = "",
      hookTerpilih = "",
      uploadedImages = [],
      audioBase64,
      audioMimeType,
      framesBase64,
      mediaBase64,
      mediaMimeType,
      namaFileVideo,
      onboardingAnswers,
      rawWritingSamples,
      fieldLabel,
      fieldKey,
      accumulatedProfile,
    } = body

    const geminiKey = process.env.GEMINI_API_KEY
    const openRouterKey = process.env.OPENROUTER_API_KEY

    const sapaanDiri =
      akunPersonaTerpilih?.selfPronounInput ||
      personaProfile?.voice_dna?.self_pronoun ||
      personaProfile?.linguistic_matrix?.self_pronoun ||
      "Gue"
    const sapaanAudiens =
      akunPersonaTerpilih?.audiencePronounInput ||
      personaProfile?.voice_dna?.audience_pronoun ||
      personaProfile?.linguistic_matrix?.audience_pronoun ||
      "Temen-temen"
    const bidangUser =
      akunPersonaTerpilih?.minatUtama ||
      personaProfile?.niche_context?.primary_niche ||
      "Konten Kreator & Affiliate"

    const konteksMemoriUser =
      Array.isArray(memoryVaultSamples) && memoryVaultSamples.length > 0
        ? `REKAMAN GAYA BICARA USER DARI CHAT SEBELUMNYA: ${JSON.stringify(
            memoryVaultSamples.slice(0, 8).map((s) => s.teks),
          )}`
        : ""

    // =========================================================================
    // 1. ENDPOINT UTAMA RUANG CHAT PER TOPIK ("ai_script_session_chat")
    // Menangani: Pertanyaan Iseng, Brainstorming 10 Masalah & 7 Angle,
    // Upload Gambar/Video/Screenshot Review Bintang 1-3, & Peracik 3-5 Hook
    // =========================================================================
    if (
      action === "ai_script_session_chat" ||
      action === "brainstorm_chat_script"
    ) {
      const teksMasukan = (pesanUser || pesanBrainstorm || "").trim()
      const adaGambar =
        Array.isArray(uploadedImages) && uploadedImages.length > 0

      const promptSesiChat = `
Kamu adalah "Hookya AI Script Session Bot" yang sedang berdiskusi di ruang chat dengan kreator "${
        namaUser || "Creator"
      }".
Profil Persona Aktif (${
        gunakanPersona ? "Aktif" : "Default Sosmed Santai Formal"
      }):
- Sapaan Diri: "${sapaanDiri}" | Sapaan Penonton: "${sapaanAudiens}"
- Bidang: "${bidangUser}" | Format Target: "${formatKonten}" | Tone: "${toneBicara}"
${konteksMemoriUser}

Riwayat Diskusi di Topik Ini:
${JSON.stringify((riwayatChat || []).slice(-6))}

Pesan / Input Pengguna Sekarang:
"${teksMasukan || (adaGambar ? "[Mengunggah Gambar/Screenshot]" : "Halo")}"
${tujuanKonten ? `Tujuan Konten yang Dipilih: "${tujuanKonten}"` : ""}
${angleTerpilih ? `Angle yang Dipilih: "${angleTerpilih}"` : ""}
${masalahTerpilih ? `Masalah Audiens yang Disetujui: "${masalahTerpilih}"` : ""}

ATURAN RESPONS CERDAS SESUAI KONDISI INPUT:
1. JIKA PENGGUNA MENGUNGGAH GAMBAR / SCREENSHOT:
   - Apabila gambar tersebut adalah foto produk atau suasana aktivitas, jelaskan apa yang kamu lihat, lalu tanyakan pengguna ingin mengarahkannya menjadi bentuk konten apa: (a) Konten Cari Viral, (b) Konten Meningkatkan Trust (POV / Behind the Scene), atau (c) Konten Jualan (Formula 6 Langkah).
   - Apabila gambar tersebut adalah SCREENSHOT REVIEW BINTANG RENDAH (1-3) dari marketplace, bedah keluhan nyata pembeli ("tidak sesuai ekspektasi", "cepat rusak", "hasil tidak kelihatan", "susah dipakai"), tarik pemicu emosinya, lalu susun rekomendasi Angle & 3-5 opsi Hook yang menjawab keluhan tersebut.
2. JIKA PENGGUNA BARU MENYAPA / BERTANYA UMUM (Misal: "Saya mau bikin konten" / pertanyaan santai):
   - Tanggapi dengan ramah sesuai gaya bicaranya, tanyakan produk/topik apa yang ingin dibahas hari ini untuk format ${formatKonten}, dan berikan 4 chip ide pembuka.
3. JIKA PENGGUNA SEDANG BRAINSTORMING TOPIK / PRODUK:
   - Fokus pada audiens: gali dan siapkan **10 Masalah Spesifik Audiens (painPoints10)** yang paling sering dialami target penonton agar pengguna bisa memilih/menyetujui masalah mana yang mau diangkat.
   - Siapkan juga **7 Angle Berbeda (sevenAngles)** untuk produk/topik tersebut (Pemula, Sering Gagal, Hemat Waktu, Sensitif Anggaran, Kecewa Produk Lama/Review 1-3, Sebelum vs Sesudah, Pemakaian Jangka Panjang).
   - Jika pengguna mengarah ke Konten Jualan, ingatkan pengguna bahwa mereka juga bisa mengunggah screenshot keluhan review bintang terendah (bintang 1-3) agar skripnya makin tajam.
4. RACIK 3 SAMPAI 5 OPSI HOOK TAJAM (hookOptions) SESUAI 5 ATURAN HOOK:
   - Kalimat singkat (1 ide utama dalam 1 kalimat).
   - Sebutkan akibat / rasa sakitnya jika masalah dibiarkan.
   - Sesuai gaya bahasa persona (${sapaanDiri}/${sapaanAudiens}).
   - Variasikan pola pembuka (Opsi 1: Pertanyaan & Sentil Ego, Opsi 2: Kontras Sebelum vs Sesudah, Opsi 3: Temuan Pengalaman/Riset Jujur).
   - Hindari clickbait berlebihan tanpa bukti.

Keluarkan HANYA valid JSON dengan struktur berikut:
{
  "judulSesiTopik": "Judul topik ringkas (4-7 kata) dari bahasan ini",
  "kategoriDeteksi": "chat_umum | eksplorasi_10_masalah | analisis_media_upload | siap_pilih_hook",
  "badgeStrategi": "Strategi Retensi ${formatKonten}",
  "balasanBot": "Jawaban obrolan yang natural, solutif, dan langsung mengarahkan langkah selanjutnya...",
  "pertanyaanTindakLanjut": "Pertanyaan singkat ke user (misal memilih 1 dari 10 masalah, memilih tujuan konten dari gambar, atau meminta screenshot review bintang 1-3 jika jualan)",
  "opsiTujuanMedia": [
    "Konten Cari Viral (Jangkauan Luas)",
    "Konten Meningkatkan Trust (POV / Behind the Scene)",
    "Konten Jualan & Konversi (Formula 6 Langkah)"
  ],
  "painPoints10": [
    "1. Masalah nyata audiens pertama...",
    "2. Masalah nyata audiens kedua...",
    "3. Masalah nyata audiens ketiga...",
    "4. Masalah nyata audiens keempat...",
    "5. Masalah nyata audiens kelima...",
    "6. Masalah nyata audiens keenam...",
    "7. Masalah nyata audiens ketujuh...",
    "8. Masalah nyata audiens kedelapan...",
    "9. Masalah nyata audiens kesembilan...",
    "10. Masalah nyata audiens kesepuluh..."
  ],
  "sevenAngles": [
    { "id": "pemula", "label": "Angle 1: Kebutuhan Pemula", "ide": "..." },
    { "id": "sering_gagal", "label": "Angle 2: Sering Gagal / Boncos", "ide": "..." },
    { "id": "hemat_waktu", "label": "Angle 3: Butuh Hemat Waktu", "ide": "..." },
    { "id": "sensitif_anggaran", "label": "Angle 4: Sensitif Anggaran", "ide": "..." },
    { "id": "kecewa_review", "label": "Angle 5: Trauma Review Bintang 1-3", "ide": "..." },
    { "id": "sebelum_sesudah", "label": "Angle 6: Sebelum vs Sesudah", "ide": "..." },
    { "id": "jangka_panjang", "label": "Angle 7: Pemakaian Jangka Panjang", "ide": "..." }
  ],
  "hookOptions": [
    {
      "nomor": 1,
      "kategori": "HOOK FOMO & SENTIL EGO",
      "badgeMetrik": "Potensi Viral 94%",
      "teksHook": "...",
      "tipeVisual": "Zoom-in cepat + teks bold di 3 detik awal"
    },
    {
      "nomor": 2,
      "kategori": "HOOK KONTRAS & AKIBAT MASALAH",
      "badgeMetrik": "Retensi 89%",
      "teksHook": "...",
      "tipeVisual": "Tunjukkan perbandingan sebelum vs sesudah"
    },
    {
      "nomor": 3,
      "kategori": "HOOK PENGALAMAN & RISET REVIEW",
      "badgeMetrik": "Konversi Tinggi",
      "teksHook": "...",
      "tipeVisual": "POV tangan memegang produk / tangkapan layar ulasan"
    }
  ],
  "analisaGudangIngatan": {
    "reviewSingkat": "1 kalimat ringkasan gaya bicara dan minat konten user dari pesan ini.",
    "rincianAnalisa": {
      "gayaBahasaTerdeteksi": "...",
      "kosakataKhasBaru": ["kata1", "kata2", "kata3"],
      "polaKalimat": "...",
      "topikSeringDibahas": "...",
      "saranOptimalisasi": "..."
    }
  }
}`

      const listImg = (uploadedImages || []).map((img) => ({
        mimeType: img.mimeType || "image/jpeg",
        data: img.base64 || img.data,
      }))

      const { parsed, modelUsed, usage } = await panggilOpenRouterAtauGemini({
        openRouterKey,
        geminiKey,
        preferredModel,
        promptText: promptSesiChat,
        imagesList: listImg,
      })

      await catatTelemetriDanGlobalBrain({
        userId,
        namaUser,
        action: "Chat Sesi Topik & Peracik Hook",
        modelDigunakan: modelUsed,
        detailKeterangan: `Topik: ${parsed?.judulSesiTopik || teksMasukan.slice(0, 35)}`,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: 0,
        cuplikanPertanyaanUser: teksMasukan,
        cuplikanJawabanBot: parsed?.balasanBot || "",
      })

      return NextResponse.json({ ...parsed, modelUsed })
    }

    // =========================================================================
    // 2. ENDPOINT GENERATE NASKAH PENUH 6 LANGKAH ("generate_6step_script")
    // (Hook -> Masalah -> Curiosity -> Solusi -> Proof Kata Kunci Review -> 3 Variasi CTA)
    // =========================================================================
    if (action === "generate_6step_script") {
      const promptEnamLangkah = `
Susun Naskah Konten Lengkap menggunakan **FORMULA 6 LANGKAH** untuk format "${formatKonten}" dengan nada bicara "${toneBicara}".
Persona Kreator: Sapaan Diri "${sapaanDiri}", Sapaan Penonton "${sapaanAudiens}", Bidang "${bidangUser}".
${konteksMemoriUser}

 Konteks Diskusi Topik:
- Topik / Produk: "${pesanUser || "Konten Kreator"}"
- Masalah Audiens yang Diangkat: "${masalahTerpilih || "Masalah nyata audiens"}"
- Angle yang Dipilih: "${angleTerpilih || "Angle relevan"}"
- Kalimat Hook Pembuka yang Dikunci: "${hookTerpilih || "Hook pilihan"}"

WAJIB IKUTI 6 LANGKAH STRUKTUR BERIKUT SECARA BERURUTAN PADA "sections":
1. Langkah 1 • Hook (Pemicu Emosi): Gunakan kalimat singkat yang memancing reaksi ("kesal", "lega", "takut rugi", atau "penasaran") dan sebutkan akibatnya jika masalah dibiarkan.
2. Langkah 2 • Masalah (Keluhan Nyata): Petakan rasa "kok aku gini ya" dari keluhan nyata audiens atau review bintang 1-3 marketplace ("tidak sesuai ekspektasi", "hasil tidak kelihatan", "susah dipakai").
3. Langkah 3 • Curiosity (Jembatan Penasaran): Tahan pembaca dengan janji kecil yang spesifik ("ternyata kuncinya ada di..." atau "yang bikin orang gagal itu karena...") tanpa overclaim.
4. Langkah 4 • Solusi (Singkat & Fokus Hasil): Tautkan produk/solusi ke masalah dalam 2-4 poin padat. Tarik kembali dari fitur ke hasil nyata yang berubah setelah pemakaian.
5. Langkah 5 • Proof (Bukti Jujur & Kata Kunci Review): Jawab celah keraguan secara bertanggung jawab. WAJIB sisipkan kata kunci pencari informasi seperti "review", "pengalaman", "hasil", "sebelum-sesudah", atau "jangka waktu pemakaian" yang dikombinasikan dengan nama produk/solusi.
6. Langkah 6 • CTA Satu Arah: Tutup dengan ajakan spesifik satu arah menuju link bio atau pinned post.

SIAPKAN JUGA 3 VARIASI CTA BERBEDA MOTIVASI PADA "ctaVariations" (Semuanya mengarah ke tindakan yang sama, namun kalimatnya disesuaikan psikologi audiens):
- "cepat": Untuk audiens yang butuh keputusan cepat (kalimat ringkas langsung menuju link/pinned post).
- "ragu": Untuk audiens yang masih ragu (mengajak cek detail manfaat dan bukti pengalaman terkait).
- "hasil": Untuk audiens pemburu hasil (menonjolkan timeline waktu pemakaian dan ekspektasi realistis).

Keluarkan HANYA valid JSON:
{
  "judul": "Judul Naskah 6 Langkah...",
  "formatKonten": "${formatKonten}",
  "targetDuration": "${formatKonten}",
  "kataKunciReviewTerpakai": ["review", "pengalaman", "hasil", "sebelum-sesudah"],
  "sections": [
    {
      "partNumber": 1,
      "partTitle": "Hook (Pemicu Emosi)",
      "estimatedSeconds": "0:00 - 0:06",
      "cameraCue": "...",
      "intonationCue": "...",
      "spokenText": "...",
      "onScreenText": "..."
    },
    {
      "partNumber": 2,
      "partTitle": "Masalah (Keluhan Nyata)",
      "estimatedSeconds": "0:06 - 0:16",
      "cameraCue": "...",
      "intonationCue": "...",
      "spokenText": "...",
      "onScreenText": "..."
    },
    {
      "partNumber": 3,
      "partTitle": "Curiosity (Jembatan Penasaran)",
      "estimatedSeconds": "0:16 - 0:26",
      "cameraCue": "...",
      "intonationCue": "...",
      "spokenText": "...",
      "onScreenText": "..."
    },
    {
      "partNumber": 4,
      "partTitle": "Solusi (2-4 Poin Hasil Nyata)",
      "estimatedSeconds": "0:26 - 0:40",
      "cameraCue": "...",
      "intonationCue": "...",
      "spokenText": "...",
      "onScreenText": "..."
    },
    {
      "partNumber": 5,
      "partTitle": "Proof (Bukti & Kata Kunci Review)",
      "estimatedSeconds": "0:40 - 0:52",
      "cameraCue": "...",
      "intonationCue": "...",
      "spokenText": "...",
      "onScreenText": "..."
    },
    {
      "partNumber": 6,
      "partTitle": "CTA Satu Arah",
      "estimatedSeconds": "0:52 - 1:00",
      "cameraCue": "...",
      "intonationCue": "...",
      "spokenText": "...",
      "onScreenText": "..."
    }
  ],
  "ctaVariations": {
    "keputusanCepat": "Kalimat CTA untuk yang butuh keputusan cepat...",
    "masihRagu": "Kalimat CTA untuk yang masih ragu...",
    "pemburuHasil": "Kalimat CTA dengan timeline & ekspektasi realistis..."
  },
  "kritikDetail": {
    "kelebihan": "...",
    "catatanPembawaan": "...",
    "kecepatanBicara": "Jaga tempo bicara di ~135-150 kata per menit."
  },
  "uploadPackage": {
    "coverTitle": "...",
    "caption": "...",
    "pinnedComment": "..."
  }
}`

      const { parsed, modelUsed, usage } = await panggilOpenRouterAtauGemini({
        openRouterKey,
        geminiKey,
        preferredModel,
        promptText: promptEnamLangkah,
      })

      const hasilNormal = normalisasiHasilSkripDinamis(parsed)

      await catatTelemetriDanGlobalBrain({
        userId,
        namaUser,
        action: `Generate Skrip 6 Langkah (${formatKonten})`,
        modelDigunakan: modelUsed,
        detailKeterangan: `Topik: ${hasilNormal?.judul || pesanUser}`,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: 1,
        cuplikanPertanyaanUser: `Generate 6 Langkah: ${pesanUser} | Hook: ${hookTerpilih}`,
        cuplikanJawabanBot: hasilNormal?.sections?.[0]?.spokenText || "",
      })

      return NextResponse.json({ ...hasilNormal, modelUsed })
    }

    // =========================================================================
    // 3. ENDPOINT ANALISA GUDANG INGATAN & EKSTRAK PERSONA DNA
    // =========================================================================
    if (action === "analyze_memory_vault") {
      const promptMemory = `
Analisis gaya bicara, kosakata khas, ritme kalimat, dan kecenderungan topik dari rekaman chat & ketikan pengguna berikut:
${JSON.stringify(memoryVaultSamples)}

Keluarkan HANYA valid JSON:
{
  "reviewSingkat": "1 kalimat ringkasan tajam tentang karakter gaya bicara dan kebiasaan ngonten pengguna.",
  "rincianAnalisa": {
    "gayaBahasaTerdeteksi": "...",
    "kosakataKhasBaru": ["kata1", "kata2", "kata3", "kata4"],
    "polaKalimat": "...",
    "topikSeringDibahas": "...",
    "saranOptimalisasi": "..."
  }
}`
      const { parsed, modelUsed, usage } = await panggilOpenRouterAtauGemini({
        openRouterKey,
        geminiKey,
        preferredModel,
        promptText: promptMemory,
      })
      await catatTelemetriDanGlobalBrain({
        userId,
        namaUser,
        action: "Analisa Otak AI Gudang Ingatan",
        modelDigunakan: modelUsed,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
      })
      return NextResponse.json(parsed)
    }

    if (action === "extract_persona_dna") {
      const promptPersona = `
Susun matriks identitas akun kreator dari data berikut:
- Data Profil Akun: ${JSON.stringify(onboardingAnswers)}
- Sampel Kalimat Lisan Pengguna: "${rawWritingSamples || ""}"

Keluarkan HANYA valid JSON:
{
  "user_id": "${onboardingAnswers?.user_id || "usr_99281"}",
  "account_label": "${onboardingAnswers?.nama_akun || "@akun.utama"}",
  "dna_badge": "DNA: ${
    onboardingAnswers?.gaya_kepribadian || "Casual Storyteller"
  } | Direct Tone",
  "niche_badge": "Niche: ${
    onboardingAnswers?.minat_utama || "Kreator"
  } | Target: ${onboardingAnswers?.target_segmen || "Audiens"}",
  "persona_summary": "Ringkasan karakter suara akun ini.",
  "voice_dna": {
    "self_pronoun": "${onboardingAnswers?.sapaan_diri || "Gue"}",
    "audience_pronoun": "${onboardingAnswers?.sapaan_audiens || "Temen-temen"}",
    "spoken_particles": ["sih", "tuh", "kan", "deh"],
    "delivery_style": "${
      onboardingAnswers?.gaya_kepribadian || "To-the-point, Tajam, Santai"
    }"
  },
  "niche_context": {
    "primary_niche": "${onboardingAnswers?.minat_utama || "Bisnis & Edukasi"}",
    "unique_selling_point": "${
      onboardingAnswers?.usp_diri || "Pengalaman praktik nyata"
    }",
    "segment_profile": "${onboardingAnswers?.target_segmen || "Audiens umum"}",
    "deepest_pain_points": "${
      onboardingAnswers?.target_ketakutan || "Bingung mulai dari mana"
    }"
  }
}`
      const { parsed, modelUsed, usage } = await panggilOpenRouterAtauGemini({
        openRouterKey,
        geminiKey,
        preferredModel,
        promptText: promptPersona,
      })
      await catatTelemetriDanGlobalBrain({
        userId,
        namaUser,
        action: "Simpan & Analisis Profil Persona",
        modelDigunakan: modelUsed,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
      })
      return NextResponse.json(parsed)
    }

    if (action === "suggest_profiling_field") {
      const promptSaran = `
Berikan 4 contoh isian singkat dan siap pakai untuk kolom profil "${fieldLabel}" (${fieldKey}).
Data profil saat ini: ${JSON.stringify(accumulatedProfile)}
Keluarkan HANYA valid JSON:
{
  "insight_singkat": "Pilih salah satu referensi berikut:",
  "pilihan_referensi": ["Opsi 1", "Opsi 2", "Opsi 3", "Opsi 4"]
}`
      const { parsed } = await panggilOpenRouterAtauGemini({
        openRouterKey,
        geminiKey,
        preferredModel,
        promptText: promptSaran,
      })
      return NextResponse.json(parsed)
    }

    if (action === "transkrip_suara_mic") {
      const promptAudio = `Salin rekaman suara ini kata demi kata menjadi teks Bahasa Indonesia yang rapi. Balas HANYA JSON: { "teks": "..." }`
      const { parsed } = await panggilOpenRouterAtauGemini({
        openRouterKey,
        geminiKey,
        preferredModel: "google/gemini-2.0-flash-001",
        promptText: promptAudio,
        audioItem: {
          mimeType: audioMimeType || "audio/wav",
          data: audioBase64,
        },
      })
      return NextResponse.json(parsed)
    }

    if (action === "transkrip_file_video" || action === "rewrite_video") {
      const promptVid = `
Salin isi ucapan dari media ini ke "transkripAsliVideo" dan buat 2 variasi draf naskah 6 langkah pada "draftVariasi".
Keluarkan HANYA valid JSON:
{
  "transkripAsliVideo": "...",
  "intiPesanVideo": "...",
  "draftVariasi": [
    {
      "idDraft": "Draft #01",
      "badgeFormat": "Formula 6 Langkah • Hook Kontras",
      "judul": "...",
      "cuplikanHook": "...",
      "estimasiDurasi": "60s",
      "struktur": "Hook - Masalah - Curiosity - Solusi - Proof - CTA",
      "segmen": [
        { "idSegmen": "STEP_1", "partNumber": 1, "partTitle": "Hook", "labelMini": "Langkah 1 • Hook", "voiceover": "...", "spokenText": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "STEP_2", "partNumber": 2, "partTitle": "Masalah", "labelMini": "Langkah 2 • Masalah", "voiceover": "...", "spokenText": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "STEP_3", "partNumber": 3, "partTitle": "Curiosity", "labelMini": "Langkah 3 • Curiosity", "voiceover": "...", "spokenText": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "STEP_4", "partNumber": 4, "partTitle": "Solusi", "labelMini": "Langkah 4 • Solusi", "voiceover": "...", "spokenText": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "STEP_5", "partNumber": 5, "partTitle": "Proof Review", "labelMini": "Langkah 5 • Proof", "voiceover": "...", "spokenText": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "STEP_6", "partNumber": 6, "partTitle": "CTA", "labelMini": "Langkah 6 • CTA", "voiceover": "...", "spokenText": "...", "teksLayar": "...", "visual": "..." }
      ]
    }
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
      const { parsed, modelUsed, usage } = await panggilOpenRouterAtauGemini({
        openRouterKey,
        geminiKey,
        preferredModel: "google/gemini-2.0-flash-001",
        promptText: promptVid,
        imagesList: listFrames,
        audioItem: itemAudio,
      })
      await catatTelemetriDanGlobalBrain({
        userId,
        namaUser,
        action: `Ekstrak Video ke Naskah (${namaFileVideo || "video"})`,
        modelDigunakan: modelUsed,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: action === "rewrite_video" ? 1 : 0,
      })
      return NextResponse.json(parsed)
    }

    // Fallback untuk endpoint legacy (multiply_script_variations, ubah_durasi_skrip, dll.)
    const promptGeneric = `
Buat variasi atau pembaruan naskah dengan struktur 6 langkah (Hook, Masalah, Curiosity, Solusi, Proof dengan kata kunci review, CTA) untuk topik "${
      body.subyek || body.contentBrief?.core_idea || "Konten"
    }".
Data sebelumnya: ${JSON.stringify(body.skripSebelumnya || body.contentBrief || {})}
Keluarkan HANYA valid JSON yang memiliki "sections" dan "daftarVariasi".`

    const { parsed, modelUsed, usage } = await panggilOpenRouterAtauGemini({
      openRouterKey,
      geminiKey,
      preferredModel,
      promptText: promptGeneric,
    })
    const norm = normalisasiHasilSkripDinamis(parsed)
    await catatTelemetriDanGlobalBrain({
      userId,
      namaUser,
      action: action || "AI Script Action",
      modelDigunakan: modelUsed,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      koinDipakai: parseInt(body?.koinDipakai) || 0,
    })
    return NextResponse.json(norm)
  } catch (err) {
    const potongKoin =
      body?.action === "generate_6step_script" ||
      body?.action === "rewrite_video" ||
      body?.action === "assemble_humanized_script"
        ? 1
        : body?.action === "multiply_script_variations"
          ? parseInt(body?.koinDipakai) || 1
          : 0

    const koinGanti = await catatErrorKeAdminDanRefund({
      userId: body?.userId,
      namaUser: body?.namaUser,
      fitur: body?.action || "Ai Script Session",
      pesanErrorAsli: err.message || "Gagal memproses AI",
      koinKompensasi: potongKoin,
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
