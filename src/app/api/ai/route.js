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

const KAMUS_FORMAT_KONTEN = {
  ugc: "User-Generated Content (UGC): Gaya berbagi pengalaman sebagai pengguna langsung yang jujur, kasual, dan natural.",
  edukasi:
    "Educational Content: Membongkar wawasan, cara kerja, atau kerangka pikir secara runtut dan mudah dipahami.",
  entertaining:
    "Entertaining Content: Mengutamakan alur cerita yang seru, segar, dan menghibur dari awal sampai akhir.",
  inspirational:
    "Inspirational & Motivating: Menggerakkan hati, mengubah pola pikir, dan membangkitkan semangat penonton.",
  interactive:
    "Interactive Content: Melibatkan penonton lewat pertanyaan pancingan, polling, atau debat sehat di kolom komentar.",
  testimonial_review:
    "Testimonial & Reviews: Mengulas pengalaman pemakaian nyata, membedah kelebihan-kekurangan, dan bukti hasil.",
  seasonal:
    "Seasonal Content: Mengaitkan bahasan dengan momen tren, musim, gajian, atau hari besar.",
  tips_trick:
    "Tips & Trick Praktis: Langkah taktis dan solusi praktis yang bisa langsung dicontek penonton hari ini.",
  speech_kultum_pidato:
    "Materi Speech, Kultum, & Pidato: Naskah retorika panggung, ceramah/kultum, atau sambutan dengan sapaan hangat, ilustrasi mendalam, dan penutup berkesan.",
}

const KAMUS_FAKTOR_VIRAL = {
  fakta_realitas:
    "Mengandung Fakta & Realitas: Data riil, realita lapangan, atau kebenaran yang sering diabaikan orang.",
  pro_kontra:
    "Memancing Pro & Kontra: Opini tajam atau membandingkan dua sudut pandang yang memicu diskusi di komentar.",
  tokoh_brand_terkenal:
    "Membahas Tokoh / Brand Terkenal: Mengambil pelajaran atau membedah strategi dari sosok maupun merek populer.",
  komedi:
    "Mengandung Komedi & Sentilan: Ironi sehari-hari, sarkasme halus, atau observasi kocak.",
  emosional:
    "Memancing Emosional: Menyentuh rasa haru, simpati, empati, atau ketakutan tertinggal tren.",
}

const KAMUS_PENDEKATAN_TRUST = {
  studi_kasus_nyata:
    "Studi Kasus / Data Hasil Nyata: Menceritakan masalah nyata yang pernah ditangani beserta langkah penyelesaian dan hasilnya.",
  proses_balik_layar:
    "Dokumentasi Proses / Balik Layar: Memperlihatkan proses kerja asli, ketelitian, atau perjuangan nyata di balik layar.",
  review_kesalahan:
    "Review Kesalahan Diri Sendiri: Menceritakan kesalahan di masa lalu dan pelajaran mahal yang didapat agar penonton tidak ikut rugi.",
  bedah_solusi_teknis:
    "Bedah Solusi Teknis Mendalam: Menunjukkan penguasaan teknis dan jam terbang lapangan secara transparan.",
  bukti_jam_terbang:
    "Jam Terbang & Pengalaman Lapangan: Menunjukkan pengalaman nyata kreator selama bergelut di bidang ini.",
}

const ATURAN_BAHASA_INDONESIA = `
ATURAN PENULISAN NASKAH:
1. Dilarang menggunakan karakter em dash atau tanda hubung ganda (--) di bagian mana pun. Gunakan koma, titik, atau kalimat baru.
2. Dilarang menggunakan kalimat klise terjemahan seperti "Bukan sekadar X, tapi juga Y", "Tidak hanya X, melainkan Y", "Di era digital yang serba cepat ini", "Membuka potensi", atau "Game-changer".
3. Dilarang mengarang klaim statistik palsu yang tidak ada di input pengguna.
4. Gunakan bahasa lisan Indonesia yang mengalir alami saat diucapkan di depan kamera.
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

async function catatTelemetriTokenKeSupabase({
  userId,
  namaUser,
  action,
  detailKeterangan = "",
  promptTokens = 0,
  completionTokens = 0,
  koinDipakai = 0,
}) {
  const supabase = getSupabase()
  if (!supabase || !userId) return

  const inTok = Number(promptTokens) || Math.floor(Math.random() * 450) + 650
  const outTok =
    Number(completionTokens) || Math.floor(Math.random() * 550) + 750
  const totalTok = inTok + outTok
  const biayaRp = Math.max(15, Math.round((totalTok / 1000) * 47.9))

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
        recentLogs: [],
      }

      const isRegen =
        action.includes("Regenerasi") ||
        action === "regenerate_satu_kerangka" ||
        action === "assessment_copilot"

      const logBaru = {
        id: `log_${Date.now()}_${Math.floor(Math.random() * 999)}`,
        waktu: formatWaktuLengkapID(),
        timestamp: new Date().toISOString(),
        username: uRow.username || namaUser || uRow.nama || "user",
        action,
        detail: detailKeterangan || "Proses berhasil dijalankan",
        status: "sukses",
        tokens: totalTok,
        costRp: biayaRp,
        koinDelta: koinDipakai > 0 ? -Math.abs(koinDipakai) : 0,
        refundInfo: "",
      }

      const recentLogs = [logBaru, ...(telLama.recentLogs || [])].slice(0, 60)

      const telemetryBaru = {
        totalRequests: (Number(telLama.totalRequests) || 0) + 1,
        promptTokens: (Number(telLama.promptTokens) || 0) + inTok,
        completionTokens: (Number(telLama.completionTokens) || 0) + outTok,
        totalTokens: (Number(telLama.totalTokens) || 0) + totalTok,
        totalCostRp: (Number(telLama.totalCostRp) || 0) + biayaRp,
        regenRequests: (Number(telLama.regenRequests) || 0) + (isRegen ? 1 : 0),
        lastActive: new Date().toISOString(),
        recentLogs,
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
          regenRequests: 0,
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
    // Ignore logging error
  }
  return koinTerbaru
}

function getAturanDurasiDanKepadatanRiil({
  durasiStr = "60 Detik",
  wordDensity = "padat_kaya_kosakata",
  contentFormat = "edukasi",
}) {
  const d = (durasiStr || "").toLowerCase()
  const isPadat = wordDensity !== "irit_ringkas"
  const isSpeech = contentFormat === "speech_kultum_pidato"

  const instruksiGaya = isPadat
    ? "MODE KEPADATAN: PADAT & KAYA KOSAKATA. Gunakan diksi yang kaya, contoh konkret, dan kalimat transisi yang mengalir utuh."
    : "MODE KEPADATAN: RINGKAS & IRIT KATA. Gunakan kalimat lugas dan langsung ke inti bahasan."

  if (d.includes("15")) {
    return {
      targetDuration: "15 Detik",
      flowStyle: isPadat ? "Padat & Mengena" : "Cepat & Lugas",
      totalSectionsDefault: 3,
      minWordsPerSection: 15,
      totalTargetWords: "40 - 50 Kata",
      instruksiBabak: `TARGET DURASI: 15 DETIK (3 Bagian, Total 40-50 Kata). ${instruksiGaya}
- Bagian 1: Pembuka (Hook) [0:00 - 0:04]
- Bagian 2: Inti Masalah & Bukti [0:04 - 0:11]
- Bagian 3: Solusi & CTA [0:11 - 0:15]`,
    }
  }

  if (d.includes("30")) {
    return {
      targetDuration: "30 Detik",
      flowStyle: isPadat ? "Padat Berisi" : "Ringkas & Lugas",
      totalSectionsDefault: 4,
      minWordsPerSection: 20,
      totalTargetWords: "70 - 90 Kata",
      instruksiBabak: `TARGET DURASI: 30 DETIK (4 Bagian, Total 70-90 Kata). ${instruksiGaya}
- Bagian 1: Pembuka (Hook) [0:00 - 0:05]
- Bagian 2: Agitasi Masalah [0:05 - 0:14]
- Bagian 3: Solusi & Pembuktian [0:14 - 0:24]
- Bagian 4: Penutup & CTA [0:24 - 0:30]`,
    }
  }

  if (d.includes("90")) {
    return {
      targetDuration: "90 Detik",
      flowStyle: "Alur Naratif Mengalir",
      totalSectionsDefault: 6,
      minWordsPerSection: 36,
      totalTargetWords: "210 - 240 Kata",
      instruksiBabak: `TARGET DURASI: 90 DETIK (6 Bagian, Total 210-240 Kata). ${instruksiGaya}
Setiap bagian WAJIB terdiri dari 3-4 kalimat utuh (~38 kata per bagian).`,
    }
  }

  if (d.includes("2 menit") || d.includes("120")) {
    return {
      targetDuration: "2 Menit",
      flowStyle: isSpeech ? "Retorika Panggung" : "Bedah Mendalam",
      totalSectionsDefault: 7,
      minWordsPerSection: 42,
      totalTargetWords: "280 - 320 Kata",
      instruksiBabak: `TARGET DURASI: 2 MENIT (7 Bagian, Total 280-320 Kata). ${instruksiGaya}
Setiap bagian WAJIB berisi 4-5 kalimat lengkap (minimal 42 kata per bagian).`,
    }
  }

  if (d.includes("3 menit") || d.includes("180") || d.includes("5 menit")) {
    const is5Menit = d.includes("5 menit")
    return {
      targetDuration: is5Menit ? "5 Menit" : "3 Menit",
      flowStyle: isSpeech
        ? "Orasi / Kultum Utuh"
        : "Storytelling Komprehensif & Kaya Kosakata",
      totalSectionsDefault: is5Menit ? 10 : 8,
      minWordsPerSection: 56,
      totalTargetWords: is5Menit ? "650 - 750 Kata" : "430 - 500 Kata",
      instruksiBabak: `TARGET DURASI RIIL: ${
        is5Menit
          ? "5 MENIT (10 Bagian)"
          : "3 MENIT PENUH (8 Bagian, Total 430-500 Kata)"
      }. ${instruksiGaya}
PERINGATAN MUTLAK: Setiap bagian WAJIB berisi 5 sampai 6 kalimat yang kaya kosakata dan mendalam (minimal 56 kata di setiap bagian):
- Bagian 1: Pembuka (Hook) [0:00 - 0:18]
- Bagian 2: Agitasi Masalah [0:18 - 0:42]
- Bagian 3: Titik Balik & Pembuktian [0:42 - 1:15]
- Bagian 4: Ilustrasi & Perumpamaan Konkret [1:15 - 1:40]
- Bagian 5: Bedah Cara Kerja / Fakta Lapangan [1:40 - 2:05]
- Bagian 6: Studi Kasus Sebelum vs Sesudah [2:05 - 2:25]
- Bagian 7: Langkah Eksekusi Praktis [2:25 - 2:40]
- Bagian 8: Penutup & CTA Kuat [2:40 - 3:00]`,
    }
  }

  return {
    targetDuration: "60 Detik",
    flowStyle: isPadat ? "Mengalir Padat & Kaya Kosakata" : "Lugas & Mengena",
    totalSectionsDefault: 5,
    minWordsPerSection: 30,
    totalTargetWords: "140 - 160 Kata",
    instruksiBabak: `TARGET DURASI: 60 DETIK (5 Bagian, Total 140-160 Kata). ${instruksiGaya}
Setiap bagian WAJIB berisi 3-4 kalimat utuh (~30 kata per bagian).`,
  }
}

function susunInstruksiPersona(
  personaProfile,
  contextMode,
  topikAtauProduk,
  memoryVaultSamples = [],
) {
  const voiceDNA = {
    sapaan_diri:
      personaProfile?.voice_dna?.self_pronoun ||
      personaProfile?.linguistic_matrix?.self_pronoun ||
      "Gue",
    sapaan_audiens:
      personaProfile?.voice_dna?.audience_pronoun ||
      personaProfile?.linguistic_matrix?.audience_pronoun ||
      "Temen-temen",
    partikel_lisan: personaProfile?.voice_dna?.spoken_particles ||
      personaProfile?.linguistic_matrix?.signature_vocabulary || [
        "sih",
        "tuh",
        "kan",
        "deh",
      ],
    sikap_bicara:
      personaProfile?.voice_dna?.delivery_style ||
      personaProfile?.positioning_and_usp?.authority_role ||
      "To-the-point, Tajam, Santai",
  }

  const nicheContext = {
    bidang_utama:
      personaProfile?.niche_context?.primary_niche ||
      personaProfile?.persona_summary ||
      "",
    jam_terbang:
      personaProfile?.niche_context?.unique_selling_point ||
      personaProfile?.positioning_and_usp?.unique_selling_point ||
      "",
    target_penonton:
      personaProfile?.niche_context?.segment_profile ||
      personaProfile?.target_audience?.segment_profile ||
      "",
    masalah_penonton:
      personaProfile?.niche_context?.deepest_pain_points ||
      personaProfile?.target_audience?.deepest_pain_points ||
      "",
  }

  const cuplikanIngatan =
    Array.isArray(memoryVaultSamples) && memoryVaultSamples.length > 0
      ? `\nREKAMAN GUDANG INGATAN (Gaya ketikan & editan asli user dari textbox sebelumnya yang WAJIB ditiru ritme dan pilihan katanya):\n${JSON.stringify(
          memoryVaultSamples.slice(0, 8).map((s) => s.teks),
        )}`
      : ""

  if (contextMode === "lintas_produk") {
    return `VOICE DNA KREATOR: ${JSON.stringify(voiceDNA)}${cuplikanIngatan}
MODE LINTAS TOPIK AKTIF: Fokuskan 100% bahasan pada "${
      topikAtauProduk || "Topik Baru"
    }" tanpa membawa topik bidang lama (${nicheContext.bidang_utama}).`
  }

  return `VOICE DNA KREATOR: ${JSON.stringify(voiceDNA)}
KONTEKS PROFIL AKUN: ${JSON.stringify(nicheContext)}${cuplikanIngatan}`
}

function normalisasiHasilSkripDinamis(rawObj, aturanDurasi) {
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
      sec.estimatedSeconds || `${idx * 15}s - ${(idx + 1) * 18}s`
    const spokenText = sec.spokenText || sec.voiceover || ""
    const onScreenText = sec.onScreenText || sec.teksLayar || spokenText
    const cameraCue =
      sec.cameraCue ||
      sec.visualCue ||
      sec.visual ||
      "Medium close-up, tatapan mata fokus ke lensa kamera."
    const intonationCue =
      sec.intonationCue ||
      "Tempo bicara terjaga dengan penekanan pada kata kunci utama."
    const visualGabungan =
      sec.visualCue && sec.visualCue.includes("Intonasi")
        ? sec.visualCue
        : `Arahan Kamera: ${cameraCue} | Intonasi Suara: ${intonationCue}`

    return {
      partNumber,
      partTitle,
      estimatedSeconds,
      cameraCue,
      intonationCue,
      visualCue: visualGabungan,
      spokenText,
      onScreenText,
    }
  })

  const segmenSinkron = sectionsBersih.map((sec) => ({
    idSegmen: `BEAT_${sec.partNumber}`,
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

  const kritikDetail = rawObj.kritikDetail || {
    kelebihan:
      rawObj.script_score?.hook_strength ||
      "Pacing hook di 3 detik awal memotong skeptisisme audiens secara langsung.",
    catatanPembawaan:
      rawObj.kritikSaran ||
      rawObj.script_score?.producer_tip ||
      "Hindari intonasi menggurui di bagian tengah. Pertahankan gestur terbuka agar terkesan autentik.",
    kecepatanBicara:
      "Jaga tempo bicara rata-rata di ~140-150 kata per menit untuk mempertahankan retensi penonton.",
  }

  return {
    ...rawObj,
    targetDuration:
      rawObj.targetDuration || aturanDurasi?.targetDuration || "60 Detik",
    flowStyle:
      rawObj.flowStyle || aturanDurasi?.flowStyle || "Padat & Mengalir",
    totalSections: sectionsBersih.length,
    sections: sectionsBersih,
    segmen: segmenSinkron,
    kritikDetail,
    kritikSaran: `${kritikDetail.kelebihan} ${kritikDetail.catatanPembawaan}`,
    uploadPackage: uploadPackageBersih,
    upload_pack: {
      cover_title: uploadPackageBersih.coverTitle,
      caption_seo: uploadPackageBersih.caption,
      pinned_comment: uploadPackageBersih.pinnedComment,
    },
  }
}

async function panggilMultimodalPintar({
  openRouterKey,
  geminiKey,
  promptText,
  imagesList = [],
  audioItem = null,
}) {
  let errorCatatan = ""
  const promptLengkap = `${promptText}\n\n${ATURAN_BAHASA_INDONESIA}\nPENTING: Balas HANYA dengan JSON murni yang diawali { dan diakhiri }.`

  if (openRouterKey && openRouterKey.trim() !== "") {
    const modelMultimodal = [
      "google/gemini-2.0-flash-001",
      "google/gemini-2.5-flash",
      "openai/gpt-4o-mini",
    ]

    for (const model of modelMultimodal) {
      if (
        model === "openai/gpt-4o-mini" &&
        audioItem?.data &&
        imagesList.length === 0
      ) {
        continue
      }

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
              model,
              messages: [{ role: "user", content: contentArray }],
              max_tokens: 3500,
              temperature: 0.4,
            }),
          },
        )

        const data = await response.json()
        if (response.ok && data?.choices?.[0]?.message?.content) {
          const parsed = uraiJSONAman(data.choices[0].message.content)
          return {
            parsed,
            usage: data?.usage || null,
          }
        }
        errorCatatan =
          data?.error?.message || `Multimodal ${model} gagal merespons`
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
                temperature: 0.4,
              },
            }),
          },
        )
        const data = await response.json()
        if (response.ok && data?.candidates?.length > 0) {
          const parts = data.candidates[0]?.content?.parts || []
          const parsed = uraiJSONAman(parts[0]?.text)
          return {
            parsed,
            usage: {
              prompt_tokens: data?.usageMetadata?.promptTokenCount || 800,
              completion_tokens:
                data?.usageMetadata?.candidatesTokenCount || 600,
            },
          }
        }
        errorCatatan = data?.error?.message || errorCatatan
      } catch (err) {
        errorCatatan = err.message
      }
    }
  }

  throw new Error(errorCatatan || "Gagal memproses media multimodal")
}

async function panggilTeksPintar(openRouterKey, geminiKey, promptText) {
  let errorCatatan = ""
  const promptFinal = `${promptText}\n\n${ATURAN_BAHASA_INDONESIA}`

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
                    "Kamu adalah Master Copywriter, Pakar Personal Branding, dan Penulis Naskah Konten Indonesia. Kamu patuh pada target jumlah kata sesuai durasi bicara manusia (140 kata per menit). Balas HANYA dalam format JSON yang valid.",
                },
                { role: "user", content: promptFinal },
              ],
              response_format: { type: "json_object" },
              max_tokens: 4096,
              temperature: 0.72,
            }),
          },
        )

        const data = await response.json()
        if (response.ok && data?.choices?.[0]?.message?.content) {
          const parsed = uraiJSONAman(data.choices[0].message.content)
          return {
            parsed,
            usage: data?.usage || null,
          }
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
      contentPhase = "fase_1_viral",
      contentFormat = "edukasi",
      viralTrigger = "fakta_realitas",
      trustApproach = "studi_kasus_nyata",
      sellingStyle = "soft_selling",
      wordDensity = "padat_kaya_kosakata",
      personalSpecs = "",
      contextMode = "sesuai_niche",
      catatanAkhirUser = "",
      contentBrief,
      stageInput,
      aiDraft,
      userEditedScript,
      bentukKonten,
      bentukKontenBaru,
      durasiTargetBaru,
      jumlahMultiplier,
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
      transkripMentahInput,
      isBillableRegen,
      // Parameter baru untuk Brainstorm & Gudang Ingatan
      pesanBrainstorm,
      riwayatChatBrainstorm = [],
      gunakanPersona = false,
      akunPersonaTerpilih = null,
      memoryVaultSamples = [],
    } = body

    const geminiKey = process.env.GEMINI_API_KEY
    const openRouterKey = process.env.OPENROUTER_API_KEY

    // =========================================================================
    // ENDPOINT BARU 1: CHAT BRAINSTORM COPYWRITING POWERFUL
    // =========================================================================
    if (action === "brainstorm_chat_script") {
      const instruksiGayaBahasa =
        gunakanPersona && akunPersonaTerpilih
          ? `MODE GAYA BAHASA: GUNAKAN AKUN PERSONA AKTIF (${
              akunPersonaTerpilih.labelAkun || "@akun"
            }).
- Sapaan Diri: "${akunPersonaTerpilih.selfPronounInput || "Gue"}"
- Sapaan Penonton: "${
              akunPersonaTerpilih.audiencePronounInput || "Temen-temen"
            }"
- Bidang: "${akunPersonaTerpilih.minatUtama || "-"}"
- Kesan Pembawaan: "${
              akunPersonaTerpilih.kepribadianSosial ||
              "To-the-point, Tajam, Santai"
            }"
- Jam Terbang / Pengalaman: "${akunPersonaTerpilih.uspDiriInput || "-"}"
- Sampel Kalimat Khas: "${akunPersonaTerpilih.rawWritingSamples || "-"}"`
          : `MODE GAYA BAHASA: DEFAULT (BAHASA SOSIAL MEDIA SANTAI YANG FORMAL).
- Gunakan bahasa Indonesia sosial media yang santai namun tetap sopan, rapi, semi-formal, terstruktur, menggunakan sapaan "Aku / Kamu" atau "Saya / Teman-teman" yang enak didengar semua kalangan.`

      const konteksIngatan =
        Array.isArray(memoryVaultSamples) && memoryVaultSamples.length > 0
          ? `\nREKAMAN GUDANG INGATAN PENGGUNA (Pelajari kebiasaan kata dan gaya berpikir user dari ketikan sebelumnya):\n${JSON.stringify(
              memoryVaultSamples.slice(0, 8).map((s) => s.teks),
            )}`
          : ""

      const promptBrainstorm = `
Pengguna sedang berada di ruang "Brainstorm" dan menjelaskan keinginannya membuat konten secara bebas:
Pesan Pengguna Saat Ini: "${pesanBrainstorm}"
Riwayat Obrolan Sebelumnya: ${JSON.stringify(riwayatChatBrainstorm.slice(-4))}

${instruksiGayaBahasa}
${konteksIngatan}

TUGASMU SEBAGAI MASTER COPYWRITER:
1. Terjemahkan, rapikan, dan pertajam penjelasan mentah dari pengguna di atas menjadi naskah konten dengan teknik copywriting yang sangat kuat (memiliki Hook yang menghentikan scroll, alur persuasi/cerita yang mengikat, bukti/alasan logis, serta Call-To-Action yang jelas).
2. Berikan balasan pengantar yang ramah dan solutif di "balasanProduser" (jelaskan teknik copywriting apa yang kamu terapkan pada naskah ini).
3. Susun naskah lengkap di dalam "naskahHasil" yang berisi 4 sampai 6 bagian ("sections") yang padat berisi.
4. Analisis juga gaya ketikan pengguna dari pesan ini untuk disimpan ke Gudang Ingatan pada objek "analisaGudangIngatan".

Keluarkan HANYA valid JSON dengan struktur berikut:
{
  "balasanProduser": "Penjelasan singkat bagaimana ide mentah kamu dirapikan dengan teknik copywriting...",
  "teknikCopywriting": "Nama Teknik (Misal: Problem-Agitate-Proof-Solution / Story-Bridge-Offer)",
  "naskahHasil": {
    "judul": "Judul Naskah yang Tajam...",
    "targetDuration": "60 Detik",
    "sections": [
      {
        "partNumber": 1,
        "partTitle": "Pembuka (Hook Penghenti Scroll)",
        "estimatedSeconds": "0:00 - 0:08",
        "cameraCue": "Tatap lensa kamera dengan meyakinkan",
        "intonationCue": "Tegas di kalimat pertama",
        "spokenText": "...",
        "onScreenText": "..."
      },
      {
        "partNumber": 2,
        "partTitle": "Situasi & Agitasi Masalah",
        "estimatedSeconds": "0:08 - 0:22",
        "cameraCue": "...",
        "intonationCue": "...",
        "spokenText": "...",
        "onScreenText": "..."
      },
      {
        "partNumber": 3,
        "partTitle": "Inti Bahasan & Bukti Logis",
        "estimatedSeconds": "0:22 - 0:45",
        "cameraCue": "...",
        "intonationCue": "...",
        "spokenText": "...",
        "onScreenText": "..."
      },
      {
        "partNumber": 4,
        "partTitle": "Kesimpulan & Call-To-Action",
        "estimatedSeconds": "0:45 - 1:00",
        "cameraCue": "...",
        "intonationCue": "...",
        "spokenText": "...",
        "onScreenText": "..."
      }
    ],
    "kritikDetail": {
      "kelebihan": "...",
      "catatanPembawaan": "...",
      "kecepatanBicara": "Jaga tempo bicara di ~140-150 kata per menit."
    },
    "uploadPackage": {
      "coverTitle": "...",
      "caption": "...",
      "pinnedComment": "..."
    }
  },
  "analisaGudangIngatan": {
    "reviewSingkat": "1 kalimat review gaya bahasa dan fokus materi yang dipelajari otak AI dari ketikan pengguna...",
    "rincianAnalisa": {
      "gayaBahasaTerdeteksi": "...",
      "kosakataKhasBaru": ["kata 1", "kata 2", "kata 3"],
      "polaKalimat": "...",
      "topikSeringDibahas": "...",
      "saranOptimalisasi": "..."
    }
  }
}`

      const { parsed, usage } = await panggilTeksPintar(
        openRouterKey,
        geminiKey,
        promptBrainstorm,
      )

      if (parsed?.naskahHasil) {
        parsed.naskahHasil = normalisasiHasilSkripDinamis(
          parsed.naskahHasil,
          null,
        )
      }

      await catatTelemetriTokenKeSupabase({
        userId,
        namaUser,
        action: "Brainstorm Copywriting AI",
        detailKeterangan: `Ide: ${(pesanBrainstorm || "").slice(0, 45)}...`,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: 1,
      })

      return NextResponse.json(parsed)
    }

    // =========================================================================
    // ENDPOINT BARU 2: ANALISA OTAK AI GUDANG INGATAN (MEMORY VAULT)
    // =========================================================================
    if (action === "analyze_memory_vault") {
      const promptMemory = `
Kamu adalah Otak AI "Gudang Ingatan" Hookya yang bertugas mempelajari gaya bicara, pilihan kosakata, ritme kalimat, dan pola pikir pengguna dari seluruh rekaman ketikan dan editan teks mereka berikut:
Daftar Sampel Ketikan & Editan Pengguna:
${JSON.stringify(memoryVaultSamples)}

Data Profil Saat Ini:
${JSON.stringify(personaProfile)}

Buat laporan analisa mendalam tentang gaya bahasa asli pengguna ini.
Keluarkan HANYA valid JSON:
{
  "reviewSingkat": "1 kalimat ringkasan tajam tentang karakter gaya bicara dan kebiasaan penulisan pengguna (ditampilkan sebagai teks review utama).",
  "rincianAnalisa": {
    "gayaBahasaTerdeteksi": "Penjelasan karakter suara dan nada bicara pengguna berdasarkan ketikannya...",
    "kosakataKhasBaru": ["kata1", "kata2", "kata3", "kata4", "kata5"],
    "polaKalimat": "Penjelasan panjang-pendek kalimat, cara membuka obrolan, dan cara menyambung ide...",
    "topikSeringDibahas": "Rangkuman tema, masalah, atau sudut pandang yang paling sering diketik pengguna...",
    "saranOptimalisasi": "Saran praktis bagaimana otak AI menggunakan ingatan ini agar skrip berikutnya makin mirip manusia asli."
  }
}`
      const { parsed, usage } = await panggilTeksPintar(
        openRouterKey,
        geminiKey,
        promptMemory,
      )
      await catatTelemetriTokenKeSupabase({
        userId,
        namaUser,
        action: "Analisa Otak AI Gudang Ingatan",
        detailKeterangan: `Mempelajari ${
          (memoryVaultSamples || []).length
        } rekaman ketikan & editan`,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: 0,
      })
      return NextResponse.json(parsed)
    }

    if (action === "suggest_profiling_field") {
      const promptSaran = `
Pengguna sedang menyiapkan profil akun sosial medianya dan mengisi kolom "${fieldLabel}" (Kode: "${fieldKey}").
Data jawaban sebelumnya: ${JSON.stringify(accumulatedProfile)}
Berikan 4 contoh isian singkat, konkret, dan langsung siap dipakai.
Keluarkan HANYA valid JSON:
{
  "insight_singkat": "1 kalimat alasan praktis.",
  "pilihan_referensi": ["Opsi 1", "Opsi 2", "Opsi 3", "Opsi 4"]
}`
      const { parsed, usage } = await panggilTeksPintar(
        openRouterKey,
        geminiKey,
        promptSaran,
      )
      await catatTelemetriTokenKeSupabase({
        userId,
        namaUser,
        action: "Referensi Kolom Profil",
        detailKeterangan: `Kolom: ${fieldLabel}`,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: 0,
      })
      return NextResponse.json(parsed)
    }

    if (action === "analyze_marketplace_screenshots") {
      const promptSS = `
Baca gambar screenshot produk atau spesifikasi marketplace ini.
1. "namaProduk": Nama produk dari gambar.
2. "brand": Nama merek atau toko (jika tidak ada, tulis "-").
3. "hargaPromo": Harga yang terlihat di gambar.
4. "keunggulanSpesifikasi": Terjemahkan spesifikasi teknis di gambar menjadi pengalaman pemakaian fisik yang nyata.
5. "masalahDipecahkan": Masalah pembeli yang langsung terjawab dengan produk ini.
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
      const { parsed, usage } = await panggilMultimodalPintar({
        openRouterKey,
        geminiKey,
        promptText: promptSS,
        imagesList: listImg,
      })
      await catatTelemetriTokenKeSupabase({
        userId,
        namaUser,
        action: "Scan Screenshot Produk Marketplace",
        detailKeterangan: parsed?.namaProduk || "Ekstraksi spesifikasi produk",
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: 0,
      })
      return NextResponse.json(parsed)
    }

    if (action === "transkrip_suara_mic") {
      if (!audioBase64) {
        return NextResponse.json(
          { error: "Error sistem, silakan refresh atau hubungi admin." },
          { status: 400 },
        )
      }
      const promptAudio = `
Dengarkan rekaman suara ini dan salin ucapannya kata demi kata menjadi teks Bahasa Indonesia yang rapi.
Balas HANYA dalam format JSON:
{ "teks": "..." }`
      const { parsed, usage } = await panggilMultimodalPintar({
        openRouterKey,
        geminiKey,
        promptText: promptAudio,
        audioItem: {
          mimeType: audioMimeType || "audio/wav",
          data: audioBase64,
        },
      })
      await catatTelemetriTokenKeSupabase({
        userId,
        namaUser,
        action: "Ketik Suara Mikrofon (Voice Typing)",
        detailKeterangan: "Konversi rekaman suara ke teks",
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: 0,
      })
      return NextResponse.json(parsed)
    }

    if (action === "transkrip_file_video") {
      const promptTranskrip = `
Dengarkan jalur audio dan perhatikan potongan frame video yang dilampirkan.
Salin seluruh ucapan atau teks narasi di dalam video kata demi kata ke dalam "transkripAsliVideo".
Hitung perkiraan jumlah katanya pada "jumlahKata".
Keluarkan HANYA valid JSON:
{
  "transkripAsliVideo": "...",
  "intiPesanVideo": "Judul singkat inti bahasan video...",
  "jumlahKata": 120
}`
      const listFrames = (framesBase64 || []).slice(0, 6).map((f) => ({
        mimeType: "image/jpeg",
        data: f,
      }))
      const itemAudio =
        mediaBase64 && mediaMimeType
          ? { mimeType: mediaMimeType, data: mediaBase64 }
          : null

      const { parsed, usage } = await panggilMultimodalPintar({
        openRouterKey,
        geminiKey,
        promptText: promptTranskrip,
        imagesList: listFrames,
        audioItem: itemAudio,
      })
      await catatTelemetriTokenKeSupabase({
        userId,
        namaUser,
        action: "Urai Audio Video ke Transkrip",
        detailKeterangan: `File: ${namaFileVideo || "video_referensi.mp4"}`,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: 0,
      })
      return NextResponse.json(parsed)
    }

    if (action === "rewrite_video") {
      const instruksiPersona = susunInstruksiPersona(
        personaProfile,
        "lintas_produk",
        detailInput || namaFileVideo,
        memoryVaultSamples,
      )

      if (transkripMentahInput && transkripMentahInput.trim()) {
        const promptTransform = `
Ubah transkrip video referensi berikut menjadi 2 variasi naskah siap pakai yang sesuai dengan Persona Kreator:
${instruksiPersona}
Transkrip Sumber: "${transkripMentahInput}"
Catatan Tambahan: "${detailInput || "-"}"

Keluarkan HANYA valid JSON:
{
  "transkripAsliVideo": "${transkripMentahInput.replace(/"/g, "'")}",
  "intiPesanVideo": "...",
  "bedahKompetitor": {
    "jenisHookAsli": "...",
    "pemicuEmosi": "...",
    "rahasiaRetensi": "..."
  },
  "draftVariasi": [
    {
      "idDraft": "Draft #01",
      "badgeFormat": "Hook Kontras / Anti-Gimmick",
      "judul": "...",
      "cuplikanHook": "...",
      "estimasiDurasi": "45s",
      "struktur": "PAPC (Problem-Agitate-Proof-CTA)",
      "segmen": [
        { "idSegmen": "HOOK", "labelMini": "Bagian 1 • Pembuka (0:00 - 0:08)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "BODY_STORY", "labelMini": "Bagian 2 • Agitasi Masalah (0:08 - 0:22)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "VALUE_SOLUTION", "labelMini": "Bagian 3 • Titik Balik & Solusi (0:22 - 0:38)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "CTA", "labelMini": "Bagian 4 • Penutup & CTA (0:38 - 0:45)", "voiceover": "...", "teksLayar": "...", "visual": "..." }
      ]
    },
    {
      "idDraft": "Draft #02",
      "badgeFormat": "Format Carousel Slide Edukasi",
      "judul": "...",
      "cuplikanHook": "...",
      "estimasiDurasi": "7 Slide Edukasi",
      "struktur": "Poin-poin padat & realistis",
      "segmen": [
        { "idSegmen": "HOOK", "labelMini": "Slide 1 • Judul & Hook", "voiceover": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "BODY_STORY", "labelMini": "Slide 2-3 • Masalah Inti", "voiceover": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "VALUE_SOLUTION", "labelMini": "Slide 4-6 • Langkah Solusi", "voiceover": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "CTA", "labelMini": "Slide 7 • Kesimpulan & CTA", "voiceover": "...", "teksLayar": "...", "visual": "..." }
      ]
    }
  ],
  "segmen": [
    { "idSegmen": "HOOK", "labelMini": "Bagian 1 • Pembuka (0:00 - 0:08)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "BODY_STORY", "labelMini": "Bagian 2 • Situasi & Masalah (0:08 - 0:22)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "VALUE_SOLUTION", "labelMini": "Bagian 3 • Penjelasan & Solusi (0:22 - 0:38)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "CTA", "labelMini": "Bagian 4 • Penutup & Ajakan (0:38 - 0:45)", "voiceover": "...", "teksLayar": "...", "visual": "..." }
  ]
}`
        const { parsed, usage } = await panggilTeksPintar(
          openRouterKey,
          geminiKey,
          promptTransform,
        )
        if (
          Array.isArray(parsed?.draftVariasi) &&
          parsed.draftVariasi[0]?.segmen
        ) {
          parsed.segmen = parsed.draftVariasi[0].segmen
        }
        await catatTelemetriTokenKeSupabase({
          userId,
          namaUser,
          action: "Ekstrak Suara Video ke Naskah",
          detailKeterangan: `Transformasi: ${
            parsed?.intiPesanVideo || namaFileVideo || "Video Referensi"
          }`,
          promptTokens: usage?.prompt_tokens,
          completionTokens: usage?.completion_tokens,
          koinDipakai: 1,
        })
        return NextResponse.json(parsed)
      }
    }

    let promptFinal = ""

    if (action === "extract_persona_dna") {
      promptFinal = `
Susun matriks identitas akun kreator dari data berikut:
- Data Profil Akun: ${JSON.stringify(onboardingAnswers)}
- Sampel Kalimat Lisan Pengguna: "${rawWritingSamples || ""}"
- Rekaman Gudang Ingatan: ${JSON.stringify(
        (memoryVaultSamples || []).slice(0, 6),
      )}

Keluarkan HANYA valid JSON:
{
  "user_id": "${onboardingAnswers?.user_id || "usr_99281"}",
  "account_label": "${
    onboardingAnswers?.nama_akun ||
    onboardingAnswers?.minat_utama ||
    "Akun Utama"
  }",
  "dna_badge": "DNA: ${
    onboardingAnswers?.gaya_kepribadian || "Satir-Realistis"
  } | Direct Tone | Level 4 Trust",
  "niche_badge": "Niche: ${
    onboardingAnswers?.minat_utama || "Kreator"
  } | Target: ${onboardingAnswers?.target_segmen || "Audiens"}",
  "persona_summary": "Ringkasan jelas tentang karakter suara akun ini, jam terbang/spesifikasi dirinya, dan fokus bahasan utamanya.",
  "voice_dna": {
    "self_pronoun": "${onboardingAnswers?.sapaan_diri || "Gue"}",
    "audience_pronoun": "${onboardingAnswers?.sapaan_audiens || "Temen-temen"}",
    "spoken_particles": ["sih", "tuh", "kan", "deh", "banget"],
    "delivery_style": "${
      onboardingAnswers?.gaya_kepribadian || "To-the-point, Tajam, Santai"
    }"
  },
  "niche_context": {
    "primary_niche": "${
      onboardingAnswers?.minat_utama || "Edukasi & Konten Harian"
    }",
    "authority_role": "${onboardingAnswers?.peran_dan_otoritas || "Praktisi"}",
    "unique_selling_point": "${
      onboardingAnswers?.usp_diri || "Berbagi pengalaman praktik langsung"
    }",
    "common_enemy": "${
      onboardingAnswers?.pandangan_kontra ||
      "Gimmick motivasi tanpa langkah eksekusi nyata"
    }",
    "personal_analogies": "${
      onboardingAnswers?.analogi_khas || "Kejadian sehari-hari"
    }",
    "segment_profile": "${onboardingAnswers?.target_segmen || "Penonton umum"}",
    "deepest_pain_points": "${
      onboardingAnswers?.target_ketakutan ||
      "Bingung ide konten & sulit konsisten"
    }",
    "secret_desires": "${
      onboardingAnswers?.target_impian || "Hasil nyata yang langsung terasa"
    }",
    "common_objections": "${
      onboardingAnswers?.target_keraguan || "Bingung mulai dari mana"
    }"
  },
  "positioning_and_usp": {
    "authority_role": "${onboardingAnswers?.peran_dan_otoritas || "Praktisi"}",
    "unique_selling_point": "${
      onboardingAnswers?.usp_diri || "Berbagi pengalaman praktik langsung"
    }",
    "common_enemy": "${
      onboardingAnswers?.pandangan_kontra ||
      "Gimmick motivasi tanpa langkah eksekusi nyata"
    }",
    "personal_analogies": "${
      onboardingAnswers?.analogi_khas || "Kejadian sehari-hari"
    }"
  },
  "target_audience": {
    "segment_profile": "${onboardingAnswers?.target_segmen || "Penonton umum"}",
    "deepest_pain_points": "${
      onboardingAnswers?.target_ketakutan ||
      "Bingung ide konten & sulit konsisten"
    }",
    "secret_desires": "${
      onboardingAnswers?.target_impian || "Hasil nyata yang langsung terasa"
    }",
    "common_objections": "${
      onboardingAnswers?.target_keraguan || "Bingung mulai dari mana"
    }"
  },
  "linguistic_matrix": {
    "self_pronoun": "${onboardingAnswers?.sapaan_diri || "Gue"}",
    "audience_pronoun": "${onboardingAnswers?.sapaan_audiens || "Temen-temen"}",
    "signature_vocabulary": ["sih", "tuh", "kan", "deh"]
  }
}`
    } else if (action === "buat_10_ide_topik") {
      const blokPersona = susunInstruksiPersona(
        personaProfile,
        "sesuai_niche",
        personaProfile?.niche_context?.primary_niche || "Bidang Profil Akun",
        memoryVaultSamples,
      )
      promptFinal = `
Analisis Profil Akun Sosial Media kreator berikut dan buat 10 rekomendasi ide materi yang spesifik sesuai bidangnya:
${blokPersona}
Format: ${KAMUS_FORMAT_KONTEN[contentFormat] || contentFormat}
Faktor Pemicu: ${KAMUS_FAKTOR_VIRAL[viralTrigger] || viralTrigger}

Balas HANYA dalam format JSON:
{
  "ideTopik": [
    {
      "judul": "Judul materi spesifik sesuai bidang akun ini...",
      "nuansa": "Tingkat Minat: 94%",
      "ringkasan": "1 kalimat penjelasan poin utama yang akan dibahas..."
    }
  ]
}`
    } else if (action === "assessment_copilot") {
      const faseAktif =
        stageInput?.contentPhase || contentPhase || "fase_1_viral"
      const formatAktif =
        stageInput?.contentFormat || contentFormat || "edukasi"
      const faktorViralAktif =
        stageInput?.viralTrigger || viralTrigger || "fakta_realitas"
      const topikSaatIni =
        stageInput?.rawTopic ||
        stageInput?.coreIdea ||
        stageInput?.detailPromosi?.namaProduk ||
        "Topik Konten"

      const blokPersona = susunInstruksiPersona(
        personaProfile,
        stageInput?.contextMode || contextMode,
        topikSaatIni,
        memoryVaultSamples,
      )

      const catatanHindariDuplikat =
        opsiSebelumnya && opsiSebelumnya.length > 0
          ? `\nPENGGUNA MEMINTA SET ARAHAN BARU (SET KE-${
              batchKe || 2
            }): Berikan opsi yang berbeda dari sebelumnya: ${JSON.stringify(
              opsiSebelumnya,
            )}`
          : ""

      promptFinal = `
Kamu adalah Produser AI Hookya untuk "${namaUser || "Kreator"}".
${blokPersona}
Topik Materi: "${topikSaatIni}"
Fase: "${faseAktif}" | Format: "${formatAktif}" | Pemicu Viral: "${faktorViralAktif}"
${catatanHindariDuplikat}

Susun paket asesmen terpandu lengkap (Sudut Pandang, 3 Rekomendasi Metafora/Ilustrasi, 3 Ide Fakta Pendukung, 6 Kategori Hook, dan 3 CTA) dalam satu respons JSON.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "Asesmen ini menggali bobot cerita otentik dari kepalamu. Textbox diutamakan agar narasi tidak seragam, sedangkan tombol opsi berfungsi sebagai pemicu referensi saat ide buntu.",
  "refined_core_idea": "${topikSaatIni.replace(/"/g, "'")}",
  "angle_options": [
    { "id": "angle_1", "label": "Angle 1", "type": "Pengalaman Kegagalan Pribadi", "angle_text": "..." },
    { "id": "angle_2", "label": "Angle 2", "type": "Pengamat Kritis / Anti-Gimmick", "angle_text": "..." },
    { "id": "angle_3", "label": "Angle 3", "type": "Panduan Eksekusi Step-by-Step", "angle_text": "..." }
  ],
  "relatable_analogies": [
    { "judul": "Perumpamaan 1", "ringkasan": "Penjelasan singkat...", "teks": "Seperti..." },
    { "judul": "Perumpamaan 2", "ringkasan": "Penjelasan singkat...", "teks": "Seperti..." },
    { "judul": "Perumpamaan 3", "ringkasan": "Penjelasan singkat...", "teks": "Seperti..." }
  ],
  "reference_cards": [
    { "type": "Fakta & Realita Lapangan", "title": "...", "summary": "..." },
    { "type": "Kejadian Spesifik Audiens", "title": "...", "summary": "..." },
    { "type": "Bukti Praktik Nyata", "title": "...", "summary": "..." }
  ],
  "suggested_solutions": ["Langkah 1...", "Langkah 2...", "Langkah 3..."],
  "recommended_framework": "PAS_RELATABLE_BRIDGE",
  "hook_options": [
    { "id": "h1", "badge": "#1", "category": "Anti-Gimmick / Satir", "text": "..." },
    { "id": "h2", "badge": "#2", "category": "Pertanyaan Menohok", "text": "..." },
    { "id": "h3", "badge": "#3", "category": "Pernyataan Kontras", "text": "..." },
    { "id": "h4", "badge": "#4", "category": "Pengakuan Kesalahan", "text": "..." },
    { "id": "h5", "badge": "#5", "category": "Statistik Tak Lazim", "text": "..." },
    { "id": "h6", "badge": "#6", "category": "Larangan Tegas", "text": "..." }
  ],
  "cta_options": [
    { "category": "1. Interaksi Komentar Kata Kunci", "text": "..." },
    { "category": "2. Akses Tautan di Profil / Bio", "text": "..." },
    { "category": "3. Simpan & Bagikan ke Teman", "text": "..." }
  ]
}`
    } else if (action === "assemble_humanized_script") {
      const faseAktif =
        contentBrief?.content_phase || contentPhase || "fase_1_viral"
      const formatAktif =
        contentBrief?.content_format || contentFormat || "edukasi"
      const faktorViralAktif =
        contentBrief?.viral_trigger || viralTrigger || "fakta_realitas"
      const kepadatanKataAktif =
        contentBrief?.word_density || wordDensity || "padat_kaya_kosakata"
      const modeKonteksAktif =
        contentBrief?.context_mode || contextMode || "sesuai_niche"
      const catatanTambahan =
        catatanAkhirUser || contentBrief?.user_final_notes || ""

      const aturanDurasi = getAturanDurasiDanKepadatanRiil({
        durasiStr: contentBrief?.target_platform || "3 Menit",
        wordDensity: kepadatanKataAktif,
        contentFormat: formatAktif,
      })

      const blokPersona = susunInstruksiPersona(
        personaProfile,
        modeKonteksAktif,
        contentBrief?.core_idea,
        memoryVaultSamples,
      )

      promptFinal = `
Susun naskah skrip lengkap dengan struktur Story Beats yang memenuhi target durasi riil dan kepadatan kosakata berikut.
${blokPersona}
Fase: ${faseAktif} (${KAMUS_PENDEKATAN_TRUST[trustApproach] || ""})
Format: ${KAMUS_FORMAT_KONTEN[formatAktif] || formatAktif}
Pemicu Viral: ${KAMUS_FAKTOR_VIRAL[faktorViralAktif] || faktorViralAktif}
Rancangan Konten: ${JSON.stringify(contentBrief)}
Bentuk Eksekusi Visual: "${bentukKonten}"
${catatanTambahan ? `INSTRUKSI KOREKSI AKHIR PENGGUNA: "${catatanTambahan}"` : ""}

ATURAN DURASI RIIL & JUMLAH KATA:
${aturanDurasi.instruksiBabak}
- Total target kata seluruh naskah: ${aturanDurasi.totalTargetWords}.
- Setiap bagian ("section") WAJIB memiliki minimal ${aturanDurasi.minWordsPerSection} kata pada "spokenText".

Keluarkan HANYA valid JSON:
{
  "targetDuration": "${aturanDurasi.targetDuration}",
  "flowStyle": "${aturanDurasi.flowStyle}",
  "totalSections": ${aturanDurasi.totalSectionsDefault},
  "sections": [
    {
      "partNumber": 1,
      "partTitle": "Pembuka (Hook)",
      "estimatedSeconds": "0:00 - 0:18",
      "cameraCue": "Medium close-up, tatapan mata tajam ke lensa, ekspresi skeptis lalu mengangguk lambat.",
      "intonationCue": "Tempo cepat di 5 detik pertama, penekanan tegas pada kata kunci utama.",
      "spokenText": "...",
      "onScreenText": "..."
    }
  ],
  "kritikDetail": {
    "kelebihan": "...",
    "catatanPembawaan": "...",
    "kecepatanBicara": "Jaga tempo bicara rata-rata di ~150-160 WPM untuk mempertahankan retensi short-form video."
  },
  "uploadPackage": {
    "coverTitle": "...",
    "caption": "...",
    "pinnedComment": "..."
  }
}`

      const { parsed, usage } = await panggilTeksPintar(
        openRouterKey,
        geminiKey,
        promptFinal,
      )
      const hasilNormal = normalisasiHasilSkripDinamis(parsed, aturanDurasi)
      await catatTelemetriTokenKeSupabase({
        userId,
        namaUser,
        action: "Buat Naskah Skrip Konten",
        detailKeterangan: `Topik: ${
          contentBrief?.core_idea || "Naskah Baru"
        } (${aturanDurasi.targetDuration})`,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: 1,
      })
      return NextResponse.json(hasilNormal)
    } else if (action === "ubah_durasi_skrip") {
      const aturanDurasi = getAturanDurasiDanKepadatanRiil({
        durasiStr: durasiTargetBaru,
        wordDensity,
        contentFormat,
      })
      const blokPersona = susunInstruksiPersona(
        personaProfile,
        contextMode,
        body.subyek,
        memoryVaultSamples,
      )

      promptFinal = `
Sesuaikan panjang dan jumlah bagian naskah berikut agar memenuhi target durasi baru: "${durasiTargetBaru}" (${aturanDurasi.totalTargetWords}).
${blokPersona}
Topik: "${body.subyek || "Konten Video"}"
Naskah Saat Ini: ${JSON.stringify(skripSebelumnya)}
${aturanDurasi.instruksiBabak}

Keluarkan HANYA valid JSON:
{
  "targetDuration": "${aturanDurasi.targetDuration}",
  "flowStyle": "${aturanDurasi.flowStyle}",
  "totalSections": ${aturanDurasi.totalSectionsDefault},
  "sections": [
    {
      "partNumber": 1,
      "partTitle": "Pembuka (Hook)",
      "estimatedSeconds": "0:00 - 0:15",
      "cameraCue": "...",
      "intonationCue": "...",
      "spokenText": "...",
      "onScreenText": "..."
    }
  ]
}`
      const { parsed, usage } = await panggilTeksPintar(
        openRouterKey,
        geminiKey,
        promptFinal,
      )
      const hasilNormal = normalisasiHasilSkripDinamis(parsed, aturanDurasi)
      await catatTelemetriTokenKeSupabase({
        userId,
        namaUser,
        action: `Ubah Durasi Naskah (${aturanDurasi.targetDuration})`,
        detailKeterangan: `Skrip: ${body.subyek || "Naskah"}`,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: 0,
      })
      return NextResponse.json(hasilNormal)
    } else if (action === "multiply_script_variations") {
      const jml = Math.min(10, Math.max(2, parseInt(jumlahMultiplier) || 2))
      const blokPersona = susunInstruksiPersona(
        personaProfile,
        contextMode,
        body.subyek,
        memoryVaultSamples,
      )

      promptFinal = `
Buat ${jml} sub-variasi naskah skrip baru dengan sudut pandang dan Hook berbeda dari skrip induk berikut.
${blokPersona}
Topik Induk: "${body.subyek || "Konten Kreator"}"
Skrip Induk: ${JSON.stringify(skripSebelumnya)}

Keluarkan HANYA valid JSON:
{
  "daftarVariasi": [
    {
      "kodeHuruf": "A",
      "judulVariasi": "Variasi A: Sudut Pandang Kontras (Hook Kuat)",
      "estimasiDetik": "45 detik",
      "sections": [
        {
          "partNumber": 1,
          "partTitle": "Pembuka (Hook)",
          "estimatedSeconds": "0:00 - 0:10",
          "cameraCue": "...",
          "intonationCue": "...",
          "spokenText": "...",
          "onScreenText": "..."
        }
      ]
    }
  ]
}`
      const { parsed, usage } = await panggilTeksPintar(
        openRouterKey,
        geminiKey,
        promptFinal,
      )
      if (Array.isArray(parsed?.daftarVariasi)) {
        parsed.daftarVariasi = parsed.daftarVariasi.map((v, idx) => {
          const norm = normalisasiHasilSkripDinamis(v, null)
          const kode = String.fromCharCode(65 + idx)
          return {
            ...v,
            kodeHuruf: v.kodeHuruf || kode,
            judulVariasi:
              v.judulVariasi || `Variasi ${kode}: Sudut Pandang Baru`,
            estimasiDetik: v.estimasiDetik || "45 detik",
            sections: norm.sections,
            segmen: norm.segmen,
          }
        })
      }
      await catatTelemetriTokenKeSupabase({
        userId,
        namaUser,
        action: `Gandakan ${jml} Variasi ke Folder Arsip`,
        detailKeterangan: `Topik Induk: ${body.subyek || "Naskah"}`,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: parseInt(body?.koinDipakai) || 1,
      })
      return NextResponse.json(parsed)
    } else if (action === "regenerate_satu_kerangka") {
      const blokPersona = susunInstruksiPersona(
        personaProfile,
        contextMode,
        body.subyek,
        memoryVaultSamples,
      )
      promptFinal = `
Tulis ulang SATU bagian naskah ini saja ("${
        segmenTarget?.partTitle || segmenTarget?.labelMini
      }") dengan variasi kalimat baru yang tetap padat.
${blokPersona}
Topik: "${body.subyek || "Konten Video"}"
Bagian saat ini: ${JSON.stringify(segmenTarget)}

Keluarkan HANYA valid JSON:
{
  "spokenText": "...",
  "onScreenText": "...",
  "cameraCue": "...",
  "intonationCue": "...",
  "visualCue": "...",
  "voiceover": "...",
  "teksLayar": "...",
  "visual": "..."
}`
      const { parsed, usage } = await panggilTeksPintar(
        openRouterKey,
        geminiKey,
        promptFinal,
      )
      await catatTelemetriTokenKeSupabase({
        userId,
        namaUser,
        action: `Regenerasi Bagian Skrip (${
          segmenTarget?.partTitle || "Bagian"
        })`,
        detailKeterangan: isBillableRegen
          ? "Pembaruan ke-3 (Potong 1 Koin)"
          : "Pembaruan bagian gratis",
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: isBillableRegen ? 1 : 0,
      })
      return NextResponse.json(parsed)
    } else if (action === "analyze_script_diff") {
      promptFinal = `
Pelajari perubahan kata yang dilakukan pengguna antara draf awal dan hasil editannya:
- Draf Awal: ${JSON.stringify(aiDraft)}
- Editan Pengguna: ${JSON.stringify(userEditedScript)}
- Profil Saat Ini: ${JSON.stringify(personaProfile)}
Keluarkan HANYA valid JSON:
{
  "learning_summary": ["Pilihan kosakata dari revisimu telah disimpan ke profil akun ini."],
  "updated_persona_profile": ${JSON.stringify(personaProfile)}
}`
    } else if (action === "ubah_bentuk_konten") {
      promptFinal = `
Sesuaikan naskah skrip berikut ke dalam format eksekusi visual baru: "${bentukKontenBaru}".
Skrip saat ini: ${JSON.stringify(skripSebelumnya)}
Keluarkan HANYA valid JSON:
{
  "sections": [
    {
      "partNumber": 1,
      "partTitle": "...",
      "estimatedSeconds": "0:00 - 0:12",
      "cameraCue": "...",
      "intonationCue": "...",
      "spokenText": "...",
      "onScreenText": "..."
    }
  ]
}`
      const { parsed, usage } = await panggilTeksPintar(
        openRouterKey,
        geminiKey,
        promptFinal,
      )
      const hasilNormal = normalisasiHasilSkripDinamis(parsed, null)
      await catatTelemetriTokenKeSupabase({
        userId,
        namaUser,
        action: `Ubah Bentuk Konten (${bentukKontenBaru})`,
        detailKeterangan: `Skrip: ${body.subyek || "Naskah"}`,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        koinDipakai: 0,
      })
      return NextResponse.json(hasilNormal)
    } else if (action === "evaluasi_kinerja_vt") {
      promptFinal = `
Berikan evaluasi singkat dan praktis dalam 2 kalimat berdasarkan angka metrik kinerja konten berikut:
${JSON.stringify(dataKinerja)}
Balas HANYA dalam format JSON:
{ "evaluasiAI": "..." }`
    }

    const { parsed, usage } = await panggilTeksPintar(
      openRouterKey,
      geminiKey,
      promptFinal,
    )
    await catatTelemetriTokenKeSupabase({
      userId,
      namaUser,
      action:
        action === "extract_persona_dna"
          ? "Analisis & Simpan Profil DNA"
          : action === "buat_10_ide_topik"
            ? "Analisis Profil & Cari 10 Ide Materi"
            : action === "assessment_copilot"
              ? "Muat Opsi Asesmen Terpandu"
              : action || "Permintaan AI",
      detailKeterangan: "Proses AI selesai",
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      koinDipakai: 0,
    })

    return NextResponse.json(parsed)
  } catch (err) {
    const namaFiturGagal =
      body?.action === "brainstorm_chat_script"
        ? "Brainstorm Copywriting AI"
        : body?.action === "rewrite_video"
          ? "Ekstrak Suara Video ke Naskah"
          : body?.action === "assemble_humanized_script"
            ? "Buat Naskah Skrip Konten"
            : body?.action === "multiply_script_variations"
              ? `Gandakan ${body?.jumlahMultiplier || 2} Variasi Skrip`
              : body?.action === "regenerate_satu_kerangka"
                ? "Regenerasi Bagian Skrip"
                : body?.action || "Fitur AI"

    const koinKompensasi =
      body?.action === "brainstorm_chat_script" ||
      body?.action === "rewrite_video" ||
      body?.action === "assemble_humanized_script"
        ? 1
        : body?.action === "multiply_script_variations"
          ? parseInt(body?.koinDipakai) || 1
          : body?.action === "regenerate_satu_kerangka" && body?.isBillableRegen
            ? 1
            : 0

    const koinGanti = await catatErrorKeAdminDanRefund({
      userId: body?.userId,
      namaUser: body?.namaUser,
      fitur: namaFiturGagal,
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
