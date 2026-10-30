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

const TARIF_MODEL_OPENROUTER = {
  "anthropic/claude-3.5-sonnet": { inRp: 48.0, outRp: 240.0 },
  "anthropic/claude-3.5-haiku": { inRp: 13.0, outRp: 65.0 },
  "google/gemini-2.5-flash": { inRp: 2.5, outRp: 10.0 },
  "deepseek/deepseek-chat": { inRp: 2.3, outRp: 4.5 },
  "openai/gpt-4o-mini": { inRp: 2.5, outRp: 10.0 },
  "google/gemini-2.0-flash-001": { inRp: 1.8, outRp: 7.2 },
}

function hitungBiayaTokenModelRp(modelId, inTok = 0, outTok = 0) {
  const tarif = TARIF_MODEL_OPENROUTER[modelId] || { inRp: 10.0, outRp: 35.0 }
  const total = (inTok / 1000) * tarif.inRp + (outTok / 1000) * tarif.outRp
  return Math.max(5, Math.round(total))
}

// Membaca konfigurasi AI 1 & AI 2 langsung dari database Admin jika client belum mengirimkannya
async function ambilKonfigurasiDualAIDariDB() {
  const supabase = getSupabase()
  if (!supabase) {
    return {
      aiModel1: "anthropic/claude-3.5-haiku",
      aiModel2: "anthropic/claude-3.5-sonnet",
    }
  }
  try {
    const { data: rows } = await supabase
      .from("users")
      .select("role, profil_dna")
      .order("created_at", { ascending: true })

    if (rows && rows.length > 0) {
      const rowAdmin =
        rows.find(
          (r) =>
            r.profil_dna?.pengaturanPayment?.aiModel1 ||
            r.profil_dna?.pengaturanPayment?.aiModel2 ||
            r.profil_dna?.pengaturanPayment?.preferredModel,
        ) || rows[0]

      const p = rowAdmin?.profil_dna?.pengaturanPayment || {}
      const fallback = p.preferredModel || "google/gemini-2.5-flash"
      return {
        aiModel1: p.aiModel1 || fallback,
        aiModel2: p.aiModel2 || fallback,
      }
    }
  } catch {
    // Ignore DB read error
  }
  return {
    aiModel1: "google/gemini-2.5-flash",
    aiModel2: "anthropic/claude-3.5-sonnet",
  }
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

async function catatTelemetriDanGlobalBrain({
  userId,
  namaUser,
  action,
  peranAI = "AI 1 (Brainstorm)",
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
        action: `[${peranAI}] ${action}`,
        model: modelDigunakan,
        detail: detailKeterangan || `${peranAI} • ${modelDigunakan}`,
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
            model: `${peranAI}: ${modelDigunakan}`,
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
        : `Bagian ${partNumber}`)
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
    labelMini: `Bagian ${sec.partNumber} • ${sec.partTitle}`,
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

// Pemanggil Utama OpenRouter yang mematuhi model pilihan Admin (Claude, GPT, DeepSeek, Gemini, atau Kustom)
async function panggilOpenRouterAtauGemini({
  openRouterKey,
  geminiKey,
  targetModel = "anthropic/claude-3.5-sonnet",
  promptText,
  imagesList = [],
  audioItem = null,
}) {
  let errorCatatan = ""
  const promptLengkap = `${promptText}\n\n${ATURAN_BAHASA_INDONESIA}\nPENTING: Balas HANYA dengan objek JSON valid yang diawali kurung kurawal buka { dan diakhiri kurung kurawal tutup }. Jangan tambahkan teks pengantar di luar JSON.`

  const modelBersih = (targetModel || "google/gemini-2.5-flash").trim()

  // Urutan prioritas: wajib mengeksekusi modelBersih yang dipilih Admin terlebih dahulu
  const urutanModel = [
    modelBersih,
    "anthropic/claude-3.5-haiku",
    "google/gemini-2.5-flash",
    "openai/gpt-4o-mini",
  ].filter((v, i, a) => v && a.indexOf(v) === i)

  if (openRouterKey && openRouterKey.trim() !== "") {
    for (const model of urutanModel) {
      if (
        model.includes("deepseek") &&
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
                "Kamu adalah Master Copywriter & Strategist Konten Hookya untuk TikTok, Reels, Carousel, dan Threads. Balas HANYA dengan JSON murni yang valid.",
            },
            { role: "user", content: promptLengkap },
          ]
        }

        // Gunakan max_tokens 2000 agar OpenRouter tidak menolak Claude karena reservasi saldo tinggi
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openRouterKey.trim()}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://hookya.site",
              "X-Title": "Hookya Dual AI Engine",
            },
            body: JSON.stringify({
              model,
              messages: messagesPayload,
              max_tokens: 2000,
              temperature: 0.68,
            }),
          },
        )

        const data = await response.json()
        if (response.ok && data?.choices?.[0]?.message?.content) {
          const parsed = uraiJSONAman(data.choices[0].message.content)
          return {
            parsed,
            modelUsed: data?.model || model,
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
      preferredModel,
      aiModel1,
      aiModel2,
      personaProfile,
      akunPersonaTerpilih,
      gunakanPersona = false,
      memoryVaultSamples = [],
      pesanUser = "",
      riwayatChat = [],
      flowState = {},
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

    // Pastikan AI 1 (Asesmen/Brainstorm) dan AI 2 (Generate Naskah) terbaca dari body atau DB
    let modelAI1 = aiModel1 || preferredModel || ""
    let modelAI2 = aiModel2 || preferredModel || ""

    if (!modelAI1 || !modelAI2) {
      const dbModels = await ambilKonfigurasiDualAIDariDB()
      if (!modelAI1) modelAI1 = dbModels.aiModel1
      if (!modelAI2) modelAI2 = dbModels.aiModel2
    }

    const sapaanDiri = gunakanPersona
      ? akunPersonaTerpilih?.selfPronounInput ||
        personaProfile?.voice_dna?.self_pronoun ||
        "Gue"
      : "Aku / Saya"
    const sapaanAudiens = gunakanPersona
      ? akunPersonaTerpilih?.audiencePronounInput ||
        personaProfile?.voice_dna?.audience_pronoun ||
        "Temen-temen"
      : "Teman-teman / Kalian"
    const gayaPersona = gunakanPersona
      ? akunPersonaTerpilih?.kepribadianSosial ||
        personaProfile?.voice_dna?.delivery_style ||
        "Santai & To-the-point"
      : "Bahasa sosial media santai yang sopan dan terstruktur"
    const bidangUser =
      akunPersonaTerpilih?.minatUtama ||
      personaProfile?.niche_context?.primary_niche ||
      "Konten Kreator"

    const konteksMemoriUser =
      Array.isArray(memoryVaultSamples) && memoryVaultSamples.length > 0
        ? `REKAMAN GAYA BICARA USER DARI CHAT SEBELUMNYA: ${JSON.stringify(
            memoryVaultSamples.slice(0, 8).map((s) => s.teks),
          )}`
        : ""

    // =========================================================================
    // 1. ANALISA SCREENSHOT PRODUK MARKETPLACE (MENGGUNAKAN AI 1)
    // =========================================================================
    if (action === "analyze_product_card_screenshot") {
      const promptProdukSS = `
Perhatikan gambar produk atau tangkapan layar marketplace yang diunggah ini.
Ekstrak informasi produk ke dalam 5 kolom berikut secara ringkas dan akurat:
1. "namaProduk": Nama produk atau merek yang terlihat.
2. "jenisProduk": Kategori/jenis produk atau jasa.
3. "spesifikasi": Bahan, ukuran, fitur teknis, atau isi paket.
4. "fungsiUtama": Kegunaan utama dan manfaat nyata bagi pembeli.
5. "harga": Harga normal atau harga promo yang tertera (jika tidak terlihat, tulis "-").

Keluarkan HANYA valid JSON:
{
  "namaProduk": "...",
  "jenisProduk": "...",
  "spesifikasi": "...",
  "fungsiUtama": "...",
  "harga": "..."
}`
      const listImg = (uploadedImages || []).map((img) => ({
        mimeType: img.mimeType || "image/jpeg",
        data: img.base64 || img.data,
      }))
      const { parsed, modelUsed, usage } = await panggilOpenRouterAtauGemini({
        openRouterKey,
        geminiKey,
        targetModel: modelAI1,
        promptText: promptProdukSS,
        imagesList: listImg,
      })
      await catatTelemetriDanGlobalBrain({
        userId,
        namaUser,
        action: "Analisa Screenshot Kartu Produk",
        peranAI: "AI 1 (Asesmen)",
        modelDigunakan: modelUsed,
        detailKeterangan: parsed?.namaProduk || "Ekstraksi kartu produk",
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
      })
      return NextResponse.json(parsed)
    }

    // =========================================================================
    // 2. ENDPOINT BRAINSTORMING & ASESMEN CHAT TOPIK (MENGGUNAKAN AI 1)
    // =========================================================================
    if (action === "ai_script_session_chat") {
      const promptAlurTerpadu = `
Kamu adalah "Hookya AI Script Bot" yang memandu pengguna "${
        namaUser || "Creator"
      }" menyusun naskah konten dengan alur tanya-jawab yang terarah.
Gaya Bahasa Aktif: Sapaan Diri "${sapaanDiri}", Sapaan Penonton "${sapaanAudiens}", Gaya "${gayaPersona}", Bidang "${bidangUser}".
${konteksMemoriUser}

STATUS ALUR SAAT INI (flowState):
${JSON.stringify(flowState || {})}

RIWAYAT PERCAKAPAN SEBELUMNYA:
${JSON.stringify((riwayatChat || []).slice(-6))}

INPUT PENGGUNA BARU SAJA:
"${pesanUser || "[Mengunggah Media]"}"

TUGAS ANALISA CERDAS & URUTAN PERTANYAAN:
1. DETEKSI KELENGKAPAN INPUT OTOMATIS:
   - Jika pengguna di awal langsung mengetik deskripsi yang SANGAT LENGKAP (sudah jelas apakah itu Konten Cari Viral / Konten Cari Trust / Konten Jualan, sudah jelas formatnya TikTok/Reels, Carousel, atau Threads, dan sudah jelas topik atau detail produknya), maka JANGAN mengulang pertanyaan yang sudah terjawab! Langsung analisis komponen apa yang belum ada. Jika seluruh komponen sudah terpenuhi, langsung loncat ke tahap "pilih_hook_dan_cta" (berikan 10 pilihan Hook dari berbagai jenis + rekomendasi pilihan CTA agar pengguna tinggal klik Generate Teks).

2. PANDUAN URUTAN TAHAP JIKA INPUT BELUM LENGKAP:
   - Tahap "pilih_tujuan": Tanyakan pengguna mau buat konten apa: (1) Konten Cari Viral, (2) Konten Cari Trust, atau (3) Konten Jualan.
   - Tahap "pilih_format": Tanyakan bentuk format konten:
     * TikTok / Reels
     * Carousel (tentukan berapa slide: 5 Slide, 7 Slide, atau 10 Slide)
     * Threads (tentukan bentuk format Threads: Utas 6 Langkah, Utas Storytelling, atau Single Post Padat)

   - CABANG 1: JIKA MEMILIH "Konten Cari Viral":
     * Langkah A ("viral_topik"): Tanyakan topik apa yang ingin dibahas (bisa diketik, voice note, atau upload foto/video beserta keterangan).
     * Langkah B ("viral_goals_dan_faktor"): Tanyakan goals/tujuan dari topik ini & harapan apa yang diinginkan dari penonton setelah menonton. Berikan 10 rekomendasi arah/goals berdasarkan topik yang disebutkan pada properti "rekomendasi10", serta pandu memilih salah satu dari 6 Faktor Viral (1. Membahas hal besar/terkenal seperti figur/tokoh/brand, 2. Realitas kehidupan yang relate, 3. Memberikan fakta, 4. Unsur komedi, 5. Memancing emosional, 6. Membahas sesuatu yang lagi viral).
     * Langkah C ("viral_referensi"): Tanyakan apakah ada referensi materi tambahan untuk memperkuat topik ini (Ada atau Tidak).
     * Langkah D ("pilih_durasi"): Tanyakan durasi konten yang diinginkan (15 Detik, 30 Detik, 60 Detik, 90 Detik, atau 3 Menit).
     * Langkah E ("pilih_hook_dan_cta"): Berikan 10 rekomendasi Hook dari berbagai macam jenis hook pada properti "hookOptions10" dan berikan rekomendasi pilihan CTA pada properti "ctaOptions".

   - CABANG 2: JIKA MEMILIH "Konten Cari Trust":
     * Langkah A ("trust_brainstorm"): Berikan 6 variasi ide bentuk konten untuk membangun kepercayaan (Trust) audiens ke user (1. Membalas komentar/pertanyaan netizen, 2. Memberikan tips & trik praktis, 3. Bedah studi kasus/proses di balik layar, 4. Membongkar kesalahan umum pemula, 5. Uji coba/eksperimen jujur, 6. Membagikan checklist/kerangka kerja) dan tanyakan topik/pengalaman apa yang ingin diangkat.
     * Langkah B ("trust_referensi"): Tanyakan apakah ada referensi materi tambahan (Ada / Tidak) beserta durasi konten yang diinginkan.
     * Langkah C ("pilih_hook_dan_cta"): Berikan 10 rekomendasi Hook dari berbagai jenis hook pembangun trust pada properti "hookOptions10" dan rekomendasi pilihan CTA pada properti "ctaOptions".

   - CABANG 3: JIKA MEMILIH "Konten Jualan":
     * Langkah A ("jualan_jenis"): Tanyakan mau membuat konten jualan Jasa atau Produk?
     * Langkah B ("jualan_kartu_produk"): Minta pengguna mengisi kartu detail Produk/Jasa (Nama, Jenis, Spesifikasi, Fungsi, Harga, atau Upload Screenshot Produk di Marketplace) dengan mengeset "tampilkanKartuProduk": true.
     * Langkah C ("jualan_10_masalah"): Berdasarkan produk/jasa tersebut, berikan 10 pilihan masalah nyata yang dialami oleh calon pembeli pada properti "rekomendasi10" agar dipilih pengguna.
     * Langkah D ("jualan_7_angle"): Berikan 7 pilihan angle produk pada properti "sevenAngles" supaya konversi fokus (Pemula, Sering Gagal, Hemat Waktu, Sensitif Anggaran, Kecewa Produk Lama/Review 1-3, Sebelum vs Sesudah, Pemakaian Jangka Panjang) sekaligus tanyakan durasi konten.
     * Langkah E ("pilih_hook_dan_cta"): Berikan 10 rekomendasi Hook dari berbagai macam jenis hook jualan pada properti "hookOptions10" dan rekomendasi pilihan CTA pada properti "ctaOptions".

Keluarkan HANYA valid JSON dengan struktur berikut:
{
  "judulSesiTopik": "Judul topik ringkas (4-7 kata)",
  "tahapBerikutnya": "pilih_format | viral_topik | viral_goals_dan_faktor | viral_referensi | trust_brainstorm | trust_referensi | jualan_jenis | jualan_kartu_produk | jualan_10_masalah | jualan_7_angle | pilih_durasi | pilih_hook_dan_cta",
  "terdeteksiTujuan": "Konten Cari Viral | Konten Cari Trust | Konten Jualan | belum_dipilih",
  "terdeteksiFormat": "TikTok / Reels | Carousel | Threads | belum_dipilih",
  "balasanBot": "Tanggapan bot yang natural, ramah, dan langsung menanyakan langkah saat ini secara jelas...",
  "tampilkanKartuProduk": false,
  "opsiPilihanCepat": ["Pilihan 1", "Pilihan 2"],
  "rekomendasi10": [
    "1. ...",
    "2. ...",
    "3. ...",
    "4. ...",
    "5. ...",
    "6. ...",
    "7. ...",
    "8. ...",
    "9. ...",
    "10. ..."
  ],
  "faktorViralPilihan": [
    "1. Membahas Hal Besar / Terkenal (Figur, Tokoh, Brand)",
    "2. Realitas Kehidupan yang Relate ke Penonton",
    "3. Memberikan Sebuah Fakta",
    "4. Mengandung Unsur Komedi",
    "5. Memancing Emosional",
    "6. Membahas Sesuatu yang Lagi Viral"
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
  "hookOptions10": [
    { "nomor": 1, "jenis": "Hook Pertanyaan Menohok", "teksHook": "..." },
    { "nomor": 2, "jenis": "Hook Fakta & Realita", "teksHook": "..." },
    { "nomor": 3, "jenis": "Hook Kontras Sebelum vs Sesudah", "teksHook": "..." },
    { "nomor": 4, "jenis": "Hook Sentil Kesalahan Umum", "teksHook": "..." },
    { "nomor": 5, "jenis": "Hook Cerita Pengalaman Jujur", "teksHook": "..." },
    { "nomor": 6, "jenis": "Hook Pemicu Rasa Penasaran", "teksHook": "..." },
    { "nomor": 7, "jenis": "Hook Sudut Pandang Anti-Mainstream", "teksHook": "..." },
    { "nomor": 8, "jenis": "Hook Masalah Spesifik Audiens", "teksHook": "..." },
    { "nomor": 9, "jenis": "Hook Bukti & Hasil Nyata", "teksHook": "..." },
    { "nomor": 10, "jenis": "Hook Urgensi & Solusi Cepat", "teksHook": "..." }
  ],
  "ctaOptions": [
    { "kategori": "CTA Keputusan Cepat / Langsung Aksi", "teksCta": "..." },
    { "kategori": "CTA untuk yang Masih Ragu / Cek Bukti", "teksCta": "..." },
    { "kategori": "CTA Diskusi Komentar / Simpan Konten", "teksCta": "..." }
  ],
  "analisaGudangIngatan": {
    "reviewSingkat": "1 kalimat ringkasan gaya bicara dan fokus konten user dari input ini.",
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
        targetModel: modelAI1,
        promptText: promptAlurTerpadu,
        imagesList: listImg,
      })

      await catatTelemetriDanGlobalBrain({
        userId,
        namaUser,
        action: "Diskusi Chat Topik",
        peranAI: "AI 1 (Brainstorm)",
        modelDigunakan: modelUsed,
        detailKeterangan: `Tahap: ${parsed?.tahapBerikutnya || "diskusi"}`,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: 0,
        cuplikanPertanyaanUser: pesanUser,
        cuplikanJawabanBot: parsed?.balasanBot || "",
      })

      return NextResponse.json({ ...parsed, modelUsed })
    }

    // =========================================================================
    // 3. ENDPOINT GENERATE NASKAH FINAL (MENGGUNAKAN AI 2)
    // =========================================================================
    if (action === "generate_6step_script") {
      const infoFlow = flowState || {}
      const promptNaskahUtuh = `
Susun 1 Naskah Konten Utuh & Siap Pakai berdasarkan seluruh hasil diskusi berikut:
- Tujuan Konten: "${infoFlow.tujuanKonten || "Konten Kreator"}"
- Bentuk Format: "${
        infoFlow.formatKonten || body.formatKonten || "TikTok / Reels"
      }" ${
        infoFlow.jumlahSlideCarousel ? `(${infoFlow.jumlahSlideCarousel})` : ""
      } ${infoFlow.modelThreads ? `(${infoFlow.modelThreads})` : ""}
- Durasi Target: "${infoFlow.durasiKonten || "60 Detik"}"
- Gaya Bahasa: Sapaan Diri "${sapaanDiri}", Sapaan Penonton "${sapaanAudiens}", Tone "${gayaPersona}"
- Topik / Produk: "${infoFlow.topikAtauProduk || pesanUser || "Konten"}"
${
  infoFlow.dataProduk
    ? `- Spesifikasi Produk/Jasa: ${JSON.stringify(infoFlow.dataProduk)}`
    : ""
}
- Goals / Masalah Audiens: "${infoFlow.masalahAtauGoals || "-"}"
- Faktor Viral / Angle: "${infoFlow.faktorAtauAngle || "-"}"
- Referensi Tambahan: "${infoFlow.referensiTambahan || "Tidak ada"}"
- Kalimat Hook Pembuka Pilihan User: "${
        body.hookTerpilih || infoFlow.hookTerpilih || "Hook pilihan"
      }"
- Kalimat CTA Penutup Pilihan User: "${
        body.ctaTerpilih || infoFlow.ctaTerpilih || "CTA pilihan"
      }"
${konteksMemoriUser}

ATURAN STRUKTUR NASKAH:
- Jika Konten Jualan atau Threads, gunakan alur 6 langkah yang mengalir mulus (1. Hook Pemicu Emosi, 2. Masalah Keluhan Nyata, 3. Curiosity Jembatan Penasaran, 4. Solusi Fokus Hasil, 5. Proof Jujur dengan Kata Kunci Review seperti "review", "pengalaman", "hasil", "sebelum-sesudah", 6. CTA Satu Arah).
- Jika Carousel, susun bagian ("sections") sesuai jumlah slide yang diminta (Slide 1 Hook, Slide Pertengahan Isi, Slide Terakhir CTA).
- Jika Konten Cari Viral atau Konten Cari Trust di TikTok/Reels, susun bagian ("sections") sesuai durasi yang diminta dengan transisi yang menahan retensi penonton sampai akhir.
- Cukup hasilkan 1 naskah terbaik yang langsung siap direkam/diposting.

Keluarkan HANYA valid JSON:
{
  "judul": "Judul Naskah...",
  "formatKonten": "${
    infoFlow.formatKonten || body.formatKonten || "TikTok / Reels"
  }",
  "targetDuration": "${infoFlow.durasiKonten || "60 Detik"}",
  "sections": [
    {
      "partNumber": 1,
      "partTitle": "Pembuka (Hook)",
      "estimatedSeconds": "0:00 - 0:06",
      "cameraCue": "...",
      "intonationCue": "...",
      "spokenText": "...",
      "onScreenText": "..."
    }
  ],
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
        targetModel: modelAI2,
        promptText: promptNaskahUtuh,
      })

      const hasilNormal = normalisasiHasilSkripDinamis(parsed)

      await catatTelemetriDanGlobalBrain({
        userId,
        namaUser,
        action: `Generate Naskah (${infoFlow.tujuanKonten || "Konten"})`,
        peranAI: "AI 2 (Generate Naskah)",
        modelDigunakan: modelUsed,
        detailKeterangan: `Judul: ${hasilNormal?.judul || "Naskah Baru"}`,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: 1,
        cuplikanPertanyaanUser: `Generate Naskah: ${
          infoFlow.topikAtauProduk || pesanUser
        }`,
        cuplikanJawabanBot: hasilNormal?.sections?.[0]?.spokenText || "",
      })

      return NextResponse.json({ ...hasilNormal, modelUsed })
    }

    // =========================================================================
    // 4. ENDPOINT PENDUKUNG (OTOMATIS MEMILIH AI 1 ATAU AI 2 SESUAI TUGAS)
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
        targetModel: modelAI1,
        promptText: promptMemory,
      })
      await catatTelemetriDanGlobalBrain({
        userId,
        namaUser,
        action: "Analisa Otak AI Gudang Ingatan",
        peranAI: "AI 1 (Asesmen)",
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
        targetModel: modelAI1,
        promptText: promptPersona,
      })
      await catatTelemetriDanGlobalBrain({
        userId,
        namaUser,
        action: "Simpan & Analisis Profil Persona",
        peranAI: "AI 1 (Asesmen)",
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
        targetModel: modelAI1,
        promptText: promptSaran,
      })
      return NextResponse.json(parsed)
    }

    if (action === "transkrip_suara_mic") {
      const promptAudio = `Salin rekaman suara ini kata demi kata menjadi teks Bahasa Indonesia yang rapi. Balas HANYA JSON: { "teks": "..." }`
      const { parsed } = await panggilOpenRouterAtauGemini({
        openRouterKey,
        geminiKey,
        targetModel: "google/gemini-2.0-flash-001",
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
Salin isi ucapan dari media ini ke "transkripAsliVideo" dan buat 1 draf naskah utuh pada "draftVariasi".
Keluarkan HANYA valid JSON:
{
  "transkripAsliVideo": "...",
  "intiPesanVideo": "...",
  "draftVariasi": [
    {
      "idDraft": "Draft #01",
      "badgeFormat": "Naskah Siap Rekam",
      "judul": "...",
      "cuplikanHook": "...",
      "estimasiDurasi": "60s",
      "struktur": "Hook - Masalah - Curiosity - Solusi - Proof - CTA",
      "segmen": [
        { "idSegmen": "STEP_1", "partNumber": 1, "partTitle": "Hook", "labelMini": "Bagian 1 • Hook", "voiceover": "...", "spokenText": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "STEP_2", "partNumber": 2, "partTitle": "Isi & Solusi", "labelMini": "Bagian 2 • Isi", "voiceover": "...", "spokenText": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "STEP_3", "partNumber": 3, "partTitle": "Penutup & CTA", "labelMini": "Bagian 3 • CTA", "voiceover": "...", "spokenText": "...", "teksLayar": "...", "visual": "..." }
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
        targetModel: action === "rewrite_video" ? modelAI2 : modelAI1,
        promptText: promptVid,
        imagesList: listFrames,
        audioItem: itemAudio,
      })
      await catatTelemetriDanGlobalBrain({
        userId,
        namaUser,
        action: `Ekstrak Video ke Naskah (${namaFileVideo || "video"})`,
        peranAI:
          action === "rewrite_video"
            ? "AI 2 (Generate Naskah)"
            : "AI 1 (Asesmen)",
        modelDigunakan: modelUsed,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: action === "rewrite_video" ? 1 : 0,
      })
      return NextResponse.json(parsed)
    }

    const isGenerateNaskahAction =
      action === "assemble_humanized_script" ||
      action === "multiply_script_variations" ||
      action === "ubah_durasi_skrip" ||
      action === "ubah_bentuk_konten" ||
      action === "regenerate_satu_kerangka"

    const modelTargetFallback = isGenerateNaskahAction ? modelAI2 : modelAI1

    const promptFallback = `
Susun respons JSON untuk "${action || "konten"}" pada topik "${
      body.subyek || body.contentBrief?.core_idea || "Konten"
    }".
Data: ${JSON.stringify(
      body.skripSebelumnya || body.contentBrief || body.stageInput || {},
    )}
Keluarkan HANYA valid JSON.`

    const { parsed, modelUsed, usage } = await panggilOpenRouterAtauGemini({
      openRouterKey,
      geminiKey,
      targetModel: modelTargetFallback,
      promptText: promptFallback,
    })
    const norm = normalisasiHasilSkripDinamis(parsed)
    await catatTelemetriDanGlobalBrain({
      userId,
      namaUser,
      action: action || "AI Script Action",
      peranAI: isGenerateNaskahAction
        ? "AI 2 (Generate Naskah)"
        : "AI 1 (Asesmen)",
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
