import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// ============================================================================
// KAMUS 20 POLA PENARIK PENONTON (PENGGANTI ISTILAH PEMICU VIRAL)
// ============================================================================
// ============================================================================
// KAMUS 10 JURUS KONTEN SOSMED (PENGGANTI ISTILAH PEMICU VIRAL)
// ============================================================================
const KAMUS_20_POLA_PENARIK = {
  pov_relate:
    "POV Kejadian Sehari-hari: Mengangkat situasi nyata harian yang bikin banyak orang langsung merasa 'Ini gue banget!'.",
  spill_rahasia:
    "Spill Fakta & Rahasia Dapur: Membongkar fakta unik di lapangan atau rahasia dapur yang jarang diketahui orang awam.",
  pancing_debat:
    "Pancing Debat Komentar: Mengadu dua pilihan atau mengangkat opini berlawanan yang memancing penonton berdebat di kolom komentar.",
  tegur_kebiasaan:
    "Jangan Lakuin Ini (Tegur Kesalahan): Menunjukkan kesalahan sepele yang sering dilakukan orang tanpa sadar hingga bikin rugi/boncos.",
  nebeng_tren:
    "Riding the Wave (Bahas yang Lagi Ramai): Mengaitkan materi dengan fenomena, tren, atau isu yang sedang ramai dibicarakan di sosmed.",
  sentilan_komedi:
    "Roasting Halus & Sindiran Lucu: Menyentil kelakuan sehari-hari penonton dengan gaya bercanda yang santai dan menggelitik.",
  before_after:
    "Bukti Before vs After: Memperlihatkan perbandingan mencolok antara kondisi awal yang bermasalah dan hasil nyata sesudah dibereskan.",
  bahas_nama_besar:
    "Bedah Tokoh / Brand Terkenal: Mengambil pelajaran praktis atau membahas cerita dari sosok populer / merek yang sudah dikenal luas.",
  curhat_emosional:
    "Storytime Bikin Baper / Gemas: Bercerita dari sisi emosional yang membuat penonton ikut merasa gemas, kesal, terharu, atau bangga.",
  eksperimen_pembuktian:
    "Eksperimen & Uji Coba Langsung: Membuktikan langsung klaim, tips, atau cara kerja suatu hal secara nyata di depan kamera.",
};

// ============================================================================
// ATURAN BAHASA LISAN KAMERA & ANTI-SLOP BAHASA INDONESIA
// ============================================================================
const ATURAN_BAHASA_LISAN_KAMERA = `
ATURAN MUTLAK BAHASA LISAN KAMERA (WAJIB DIPATUHI 100%):
1. DAFTAR LARANGAN KERAS (FORBIDDEN):
   - DILARANG memakai kalimat pembuka terjemahan AI: "Pernahkah kamu merasa...", "Bayangkan jika...", "Di era digital yang serba cepat ini...", "Tahukah kamu bahwa...", "Halo semuanya, kembali lagi...", "Mari kita bahas", "Tanpa basa-basi lagi".
   - DILARANG memakai kata brosur/iklan kaku: "Solusi terbaik", "inovatif", "berkualitas tinggi", "dirancang khusus", "meningkatkan produktivitas", "wajib dimiliki", "mengubah hidupmu", "pengalaman tak terlupakan", "membuka potensi", "naik level", "game-changer", "revolusioner".
   - DILARANG memakai struktur kalimat klise AI: "Bukan sekadar X, tapi juga Y", "Tidak hanya X, melainkan Y", "Mulai dari A hingga B, dan semuanya".
   - DILARANG memakai tanda baca kaku: Jangan pernah gunakan karakter em dash, jangan gunakan titik dua (:) di tengah kalimat ucap, dan jangan membuat kalimat panjang lebih dari 15 kata tanpa jeda koma atau titik.
   - DILARANG mengarang angka statistik, riset palsu, atau klaim "para ahli mengatakan".

2. ATURAN JEDA NAPAS & KATA SAMBUNG LISAN (REQUIRED):
   - Setiap kalimat WAJIB enak diucapkan dalam 1 tarikan napas pendek (8 sampai 14 kata per kalimat).
   - Gunakan kata sambung obrolan alami di awal kalimat atau saat berpindah bagian (beat): "Jujur ya...", "Soalnya gini...", "Nah, masalahnya tuh...", "Coba deh perhatiin...", "Makanya kemarin...", "Terus kalau ditanya...", "Padahal aslinya...".
`

function bersihkanStringAntiSlop(teks) {
  if (typeof teks !== "string") return teks
  return teks
    .replace(/\s*[\u2014\u2013]\s*/g, ", ")
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
// PANDUAN 3 FASE PERSONAL BRANDING + 20 POLA PENARIK PENONTON
// ============================================================================
function susunInstruksiFaseDanPola({
  contentPhase = "fase_1_viral",
  viralTrigger = "bongkar_kesalahan",
  personalSpecs = "",
  personaProfile = {},
}) {
  const deskripsiPola =
    KAMUS_20_POLA_PENARIK[viralTrigger] ||
    KAMUS_20_POLA_PENARIK.bongkar_kesalahan

  const spekDiriProfil =
    personalSpecs ||
    personaProfile?.niche_context?.unique_selling_point ||
    personaProfile?.positioning_and_usp?.unique_selling_point ||
    "Pengalaman praktik langsung di lapangan"

  const peranKreator =
    personaProfile?.niche_context?.authority_role ||
    personaProfile?.positioning_and_usp?.authority_role ||
    "Praktisi yang berbagi pengalaman nyata"

  const halDikritisi =
    personaProfile?.niche_context?.common_enemy ||
    personaProfile?.positioning_and_usp?.common_enemy ||
    "Teori rumit tanpa langkah praktis"

  if (contentPhase === "fase_2_trust") {
    return `
# FASE KONTEN SAAT INI: FASE 2 - BANGUN TRUST (TUNJUKKAN SPESIFIKASI PERSONAL DIRI)
- TUJUAN UTAMA: Membuat penonton yang sudah sering melihat video kreator ini menjadi PERCAYA (Trust) pada jam terbang, kejujuran, dan pengalaman nyata kreator.
- AMUNISI SPESIFIKASI PERSONAL DIRI KREATOR (WAJIB DISELIPKAN SECARA ALAMI KE DALAM SKRIP):
  * Pengalaman / Jam Terbang / Cerita Dibalik Layar: "${spekDiriProfil}"
  * Peran Saat Berbagi: "${peranKreator}"
  * Prinsip Jujur / Hal yang Dikritisi: "${halDikritisi}"
- POLA PENARIK PENONTON YANG DIPILIH (${viralTrigger}): ${deskripsiPola}
- CARA EKSEKUSI: Jangan terdengar sedang menyombongkan diri. Selipkan pengalaman atau jam terbang di atas lewat cerita proses nyata ("Waktu awal gue nyoba...", "Selama ngurusin ini, hal yang paling sering kejadian tuh...").
`
  }

  if (contentPhase === "fase_3_konversi") {
    return `
# FASE KONTEN SAAT INI: FASE 3 - KONVERSI & JUALAN (PRODUK / AFFILIATE / CAMPAIGN)
- TUJUAN UTAMA: Mengubah kepercayaan penonton menjadi tindakan membeli produk atau mengikuti ajakan campaign tanpa terdengar seperti sales brosur.
- POLA PENARIK PENONTON YANG DIPILIH (${viralTrigger}): ${deskripsiPola}
- CARA EKSEKUSI: Buka dengan masalah harian atau pola penarik di atas, terjemahkan spesifikasi produk menjadi pengalaman pemakaian fisik yang nyata, jawab keraguan pembeli, dan tutup dengan ajakan spesifik yang santai.
`
  }

  return `
# FASE KONTEN SAAT INI: FASE 1 - CARI VIRAL DULU (PANCING PENONTON BARU)
- TUJUAN UTAMA: Menarik jangkauan penonton baru seluas mungkin yang belum kenal siapa kreator ini, menggunakan topik yang dekat dengan masalah mereka.
- POLA PENARIK PENONTON YANG DIPILIH (${viralTrigger}): ${deskripsiPola}
- CARA EKSEKUSI: Fokus 100% memancing rasa penasaran, rasa relate, atau diskusi di kolom komentar sejak 3 detik pertama sesuai pola "${deskripsiPola}".
`
}

// ============================================================================
// PEMISAHAN "VOICE DNA" VS "KONTEKS BIDANG" (ANTI-BOCOR TOPIK)
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

# ATURAN KONTEKS (MODE LINTAS TOPIK / BEBAS AKTIF):
- Saat ini user sedang membahas produk/topik: "${topikAtauProduk || "Topik Baru"}".
- Gunakan HANYA gaya bicara, sapaan ("${voiceDNA.sapaan_diri}" ke "${voiceDNA.sapaan_audiens}"), partikel lisan, dan ritme ngobrol dari LAPIS 1 di atas.
- DILARANG KERAS membawa atau membocorkan atribut bidang profil lama (${nicheContext.bidang_utama}) ke dalam naskah ini!
- Fokuskan 100% masalah penonton, perumpamaan, dan alasan ragu khusus untuk produk/topik "${topikAtauProduk || "yang sedang dibahas"}" ini saja.
`
  }

  return `
# LAPIS 1: VOICE DNA KREATOR (WAJIB DIKUNCI & DIPAKAI 100%):
${JSON.stringify(voiceDNA)}

# LAPIS 2: KONTEKS BIDANG & PENONTON PROFIL:
${JSON.stringify(nicheContext)}

# ATURAN FILTER OTOMATIS ANTI-BOCOR TOPIK:
- Bandingkan dulu topik/produk saat ini ("${topikAtauProduk || "Topik Konten"}") dengan Konteks Bidang Profil di Lapis 2.
- Jika SEJALUR, gunakan penuh data Lapis 1 dan Lapis 2.
- Jika BEDA PRODUK / LINTAS TOPIK (misal profil membahas Hijab/Bisnis tapi topik saat ini membahas Makanan/Barang lain), ABAIKAN atribut bidang di Lapis 2 agar tidak bocor! Tetap gunakan Voice DNA (Lapis 1), namun sesuaikan masalah penonton dan perumpamaan 100% ke topik "${topikAtauProduk || "saat ini"}".
`
}

// ============================================================================
// RUMUS DYNAMIC STORY BEATS BERDASARKAN DURASI (3 S/D 8 BAGIAN DINAMIS)
// ============================================================================
function getAturanDynamicStoryBeats(
  durasiStr = "45 - 60 Detik",
  contentPhase = "fase_1_viral",
) {
  const d = (durasiStr || "").toLowerCase()
  const sisipanTrust =
    contentPhase === "fase_2_trust"
      ? "Sertakan 1 bagian khusus yang menceritakan pengalaman nyata / jam terbang kreator di lapangan."
      : contentPhase === "fase_3_konversi"
        ? "Sertakan bagian pengalaman pemakaian fisik produk dan jawaban atas keraguan pembeli."
        : "Fokuskan setiap bagian untuk menjaga rasa penasaran penonton baru sampai akhir."

  if (d.includes("15") || d.includes("30")) {
    return {
      targetDuration: d.includes("15") ? "15 Detik" : "30 Detik",
      flowStyle: "Cepat, Padat & Langsung ke Inti",
      minSections: 3,
      maxSections: 4,
      totalSectionsDefault: d.includes("15") ? 3 : 4,
      instruksiBabak: `
TARGET DURASI: ${d.includes("15") ? "15 DETIK (3 BAGIAN)" : "30 DETIK (4 BAGIAN)"}.
${sisipanTrust}
WAJIB buat array "sections" berjumlah tepat ${d.includes("15") ? "3" : "4"} bagian (beats) dengan alur:
- Bagian 1: Pancingan Awal (Hook Tajam) [0:00 - 0:04]
- Bagian 2: Masalah Inti / Kejadian Nyata [0:04 - 0:12]
- Bagian 3: Inti Solusi / Bukti Pengalaman [0:12 - 0:22]
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
${sisipanTrust}
DILARANG KERAS hanya memanjangkan kalimat di dalam 4 kotak!
WAJIB pecah obrolan menjadi 6 atau 7 bagian ("sections") yang mengalir mulus dengan babak berikut:
- Bagian 1: Pancingan Awal (Hook) [0:00 - 0:05]
- Bagian 2: Cerita Pemicu / Kejadian Nyata di Lapangan [0:05 - 0:22]
- Bagian 3: Kesalahan yang Sering Dilakukan Orang Tanpa Sadar [0:22 - 0:40]
- Bagian 4: Ibarat / Perumpamaan Sehari-hari Biar Gampang Kebayang [0:40 - 0:58]
- Bagian 5: Bedah Cara Kerja / Bukti Jam Terbang & Pengalaman Pakai [0:58 - 1:20]
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
${sisipanTrust}
DILARANG KERAS menumpuk paragraf panjang di dalam 4 kotak!
WAJIB pecah obrolan menjadi 8 bagian ("sections") yang berkesinambungan:
- Bagian 1: Pancingan Awal (Hook) [0:00 - 0:06]
- Bagian 2: Cerita Pemicu / Kejadian Awal [0:06 - 0:25]
- Bagian 3: Kesalahan Umum yang Bikin Rugi Waktu/Biaya [0:25 - 0:48]
- Bagian 4: Ibarat / Perumpamaan Harian [0:48 - 1:10]
- Bagian 5: Bedah Mekanisme / Pengalaman Jam Terbang Kreator [1:10 - 1:35]
- Bagian 6: Studi Kasus / Perbandingan Sebelum vs Sesudah Pakai Cara Ini [1:35 - 2:05]
- Bagian 7: Rincian Langkah Praktis (Step-by-step) & Jawab Keraguan Penonton [2:05 - 2:40]
- Bagian 8: Rangkuman Pengingat & Ajakan Penutup (CTA) [2:40 - 3:00]
ATURAN EMAS: Setiap bagian tetap pendek (2 sampai 3 kalimat lisan enak ucap, 8-14 kata per kalimat) sehingga mata pembaca tidak lelah saat tampil di layar!`,
    }
  }

  return {
    targetDuration: "60 Detik",
    flowStyle: "Obrolan Mengalir & Persuasif",
    minSections: 4,
    maxSections: 5,
    totalSectionsDefault: 5,
    instruksiBabak: `
TARGET DURASI: 45 - 60 DETIK (5 BAGIAN DINAMIS).
${sisipanTrust}
WAJIB buat array "sections" berjumlah 5 bagian (beats) dengan alur:
- Bagian 1: Pancingan Awal (Hook) [0:00 - 0:04]
- Bagian 2: Situasi / Masalah Harian yang Bikin Kesel [0:04 - 0:16]
- Bagian 3: Perumpamaan / Cerita Pengalaman Nyata [0:16 - 0:30]
- Bagian 4: Solusi Praktis / Bukti Pemakaian di Lapangan [0:30 - 0:48]
- Bagian 5: Ajakan Penutup Spesifik (CTA) [0:48 - 1:00]
ATURAN EMAS: Setiap bagian HANYA berisi 2 sampai 3 kalimat lisan pendek (8-14 kata per kalimat) yang saling menyambung alami.`,
  }
}

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
                    "Kamu adalah Produser Konten & Penulis Naskah Video Pendek Indonesia yang memandu kreator pemula melewati 3 Fase (Cari Viral, Bangun Trust, Konversi Jualan). Kamu menulis dengan bahasa lisan kamera yang sangat natural (kalimat pendek 8-14 kata per tarikan napas, memakai kata sambung obrolan sehari-hari, tanpa kata brosur/iklan kaku, tanpa karakter em dash, dan tanpa struktur 'bukan sekadar X tapi Y'). Balas HANYA dalam format JSON yang valid.",
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
      contentPhase = "fase_1_viral",
      viralTrigger = "bongkar_kesalahan",
      personalSpecs = "",
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

    // 1. TOMBOL "i Contoh Isian" PADA PROFILING PEMULA
    if (action === "suggest_profiling_field") {
      const promptSaran = `
Pengguna pemula sedang mengisi kolom "${fieldLabel}" (Kode: "${fieldKey}").
Data jawaban pengguna dari kolom sebelumnya:
${JSON.stringify(accumulatedProfile)}

Berikan 4 contoh isian yang konkret, membumi, dan memakai bahasa sehari-hari yang gampang dipahami pemula.

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

    // 2. SCAN SCREENSHOT PRODUK AFFILIATE (FASE 3: TERJEMAHKAN SPEK KE PENGALAMAN PAKAI)
    if (action === "analyze_marketplace_screenshots") {
      const promptSS = `
Baca gambar screenshot produk atau spesifikasi marketplace yang dilampirkan.
ATURAN KHUSUS FASE 3 (KONVERSI & AFFILIATE):
1. "namaProduk": Salin nama produk dari gambar.
2. "brand": Salin nama merek atau toko yang tertulis di gambar (jika tidak ada, tulis "-").
3. "hargaPromo": Salin angka harga yang terlihat di gambar.
4. "keunggulanSpesifikasi": Jangan hanya menyalin daftar kata teknis kaku, tetapi TERJEMAHKAN spesifikasi yang tertulis di gambar menjadi pengalaman pemakaian fisik yang nyata sehari-hari.
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

    // 3. TRANSKRIP SUARA MIKROFON
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

    // 4. EKSTRAK VIDEO + BEDAH KOMPETITOR
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

    // 5. PROFILING 360° (PISAHKAN VOICE DNA VS SPESIFIKASI PERSONAL DIRI & BIDANG)
    let promptFinal = ""

    if (action === "extract_persona_dna") {
      promptFinal = `
Susun matriks identitas kreator dari data berikut dan pisahkan secara tegas antara LAPIS 1 (Voice DNA / Cara Ngobrol) dan LAPIS 2 (Spesifikasi Personal Diri & Konteks Bidang):
- Data Profil: ${JSON.stringify(onboardingAnswers)}
- Sampel Kalimat Asli Pengguna: "${rawWritingSamples || ""}"

Keluarkan HANYA valid JSON:
{
  "user_id": "${onboardingAnswers?.user_id || "usr_99281"}",
  "persona_summary": "Ringkasan jelas tentang gaya ngobrol pengguna, jam terbang/spesifikasi dirinya, dan fokus bahasan utamanya.",
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
  }
}`
    }

    // 6. TOMBOL PENYELAMAT PEMULA: 10 IDE MATERI SESUAI FASE & POLA PENARIK PENONTON
    else if (action === "buat_10_ide_topik") {
      const instruksiFase = susunInstruksiFaseDanPola({
        contentPhase,
        viralTrigger,
        personalSpecs,
        personaProfile,
      })

      const blokPersona = susunInstruksiPersonaTerpisah(
        personaProfile,
        contextMode,
        personaProfile?.niche_context?.primary_niche || "Bidang Kreator",
      )

      promptFinal = `
Pengguna adalah kreator yang sedang butuh ide materi siap bahas hari ini.
${blokPersona}
${instruksiFase}

TUGAS UTAMA:
Buatkan 10 ide materi konten yang langsung siap diomongkan di depan kamera, di mana setiap ide WAJIB menerapkan Fase Konten dan Pola Penarik Penonton di atas:
- Jika Fase 1 (Cari Viral Dulu): Buat 10 ide yang memancing penonton baru lewat pola "${KAMUS_20_POLA_PENARIK[viralTrigger] || viralTrigger}".
- Jika Fase 2 (Bangun Trust): Buat 10 ide yang menggabungkan pola tersebut dengan cerita Spesifikasi Personal Diri / jam terbang / proses nyata kreator.
- Jika Fase 3 (Konversi & Jualan): Buat 10 ide materi yang mengarahkan penonton dari masalah harian menuju solusi produk/jasa secara halus.

Balas HANYA dalam format JSON:
{
  "ideTopik": [
    {
      "judul": "Judul materi lisan yang konkret...",
      "nuansa": "Label singkat pola penarik...",
      "ringkasan": "1 kalimat panduan apa yang perlu diomongkan di video ini..."
    }
  ]
}`
    }

    // 7. ASESMEN TERPANDU TAHAP 1, 2, DAN 3 (MENYESUAIKAN FASE & 20 POLA PENARIK)
    else if (action === "assessment_copilot") {
      const faseAktif =
        stageInput?.contentPhase || contentPhase || "fase_1_viral"
      const polaAktif =
        stageInput?.viralTrigger || viralTrigger || "bongkar_kesalahan"
      const spekPersonalAktif = stageInput?.personalSpecs || personalSpecs || ""
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

      const blokFaseDanPola = susunInstruksiFaseDanPola({
        contentPhase: faseAktif,
        viralTrigger: polaAktif,
        personalSpecs: spekPersonalAktif,
        personaProfile,
      })

      const infoKonteks = stageInput?.detailPromosi
        ? `DETAIL PRODUK / CAMPAIGN (${stageInput.jenisPromosi}):\n${JSON.stringify(stageInput.detailPromosi)}`
        : `Topik Materi: "${stageInput?.rawTopic}"`

      const catatanHindariDuplikat =
        opsiSebelumnya && opsiSebelumnya.length > 0
          ? `\nPENGGUNA MEMINTA OPSI BARU (SET KE-${batchKe || 2}): Jangan ulangi kalimat pada opsi sebelumnya ini: ${JSON.stringify(opsiSebelumnya)}`
          : ""

      if (stageNumber === 1) {
        promptFinal = `
Kamu adalah Produser Pendamping yang ramah untuk kreator pemula "${namaUser || "Kreator"}".
${blokPersona}
${blokFaseDanPola}

DATA MATERI TAHAP 0:
- ${infoKonteks}
- Target Durasi: "${stageInput?.targetPlatform}"
${catatanHindariDuplikat}

TUGAS TAHAP 1 (3 OPSI SUDUT PANDANG SESUAI FASE & POLA PENARIK):
1. Pada "co_pilot_message", berikan semangat dan panduan singkat dengan bahasa ngobrol yang mudah dipahami pemula tentang cara membawakan topik ini.
2. Rumuskan 1 kalimat inti materi pada "refined_core_idea".
3. Berikan 3 pilihan sudut pandang ("angle_options") dengan bahasa lisan yang tajam:
   - Opsi 1 ("Tegur Kesalahan Umum"): Kebiasaan keliru yang sering dilakukan orang tanpa sadar.
   - Opsi 2 ("Jalan Pintas / Pengalaman Nyata"): ${
     faseAktif === "fase_2_trust"
       ? "Sudut pandang dari jam terbang / pengalaman nyata kreator sendiri di lapangan."
       : "Cara beresin masalahnya secara praktis tanpa ribet."
   }
   - Opsi 3 ("Sudut Pandang Kontras / Beda Sendiri"): Membantah anggapan umum sesuai pola penarik penonton yang dipilih.
4. Pada "story_prompt_question", ajukan 1 pertanyaan santai untuk menggali cerita singkat dari kreator.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "refined_core_idea": "...",
  "angle_options": [
    { "id": "angle_1", "type": "Tegur Kesalahan Umum", "angle_text": "..." },
    { "id": "angle_2", "type": "${
      faseAktif === "fase_2_trust"
        ? "Bukti Jam Terbang & Pengalaman Diri"
        : "Jalan Pintas / Solusi Praktis"
    }", "angle_text": "..." },
    { "id": "angle_3", "type": "Sudut Pandang Kontras", "angle_text": "..." }
  ],
  "story_prompt_question": "..."
}`
      } else if (stageNumber === 2) {
        promptFinal = `
Kamu adalah Produser Pendamping untuk "${namaUser || "Kreator"}".
${blokPersona}
${blokFaseDanPola}

DATA TAHAP 1:
- Inti Materi: "${stageInput?.coreIdea}"
- Sudut Pandang Terpilih: "${stageInput?.chosenAngle}"
- Cerita / Spesifikasi Personal dari Kreator: "${stageInput?.userStory || spekPersonalAktif || "(Belum diisi)"}"
- Detail Produk/Campaign (jika ada): ${JSON.stringify(stageInput?.detailPromosi || {})}
${catatanHindariDuplikat}

TUGAS TAHAP 2 (PERUMPAMAAN HARIAN, BUKTI TRUST / SEBAB-AKIBAT, & SOLUSI):
1. Tanggapi secara akrab di "co_pilot_message".
2. Buat 2 pilihan perumpamaan sehari-hari ("relatable_analogies") yang dekat dengan keseharian orang Indonesia.
3. Buat 3 Kartu Penjelasan Konkret ("reference_cards") dengan bahasa ngobrol:
   - Kartu 1 ("Sebab -> Akibat Fisik Nyata"): Jelaskan logika kenapa masalah itu terjadi atau bagaimana solusi bekerja secara fisik.
   - Kartu 2 ("${
     faseAktif === "fase_2_trust"
       ? "Bukti Jam Terbang & Spesifikasi Diri"
       : "Kejadian Spesifik di Lapangan"
   }"): ${
     faseAktif === "fase_2_trust"
       ? "Cara menyelipkan pengalaman nyata / proses di balik layar kreator agar penonton percaya."
       : "Situasi harian yang paling sering dialami penonton terkait hal ini."
   }
   - Kartu 3 ("Pengalaman Pemakaian / Bukti Nyata"): Terjemahkan spesifikasi atau langkah menjadi rasa/hasil nyata saat dipraktikkan.
4. Berikan 3 langkah solusi atau manfaat konkret ("suggested_solutions").

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "relatable_analogies": ["Ibarat...", "Kayak pas kita..."],
  "reference_cards": [
    { "type": "Sebab -> Akibat Fisik Nyata", "title": "...", "summary": "..." },
    { "type": "${
      faseAktif === "fase_2_trust"
        ? "Spesifikasi Diri & Jam Terbang"
        : "Kejadian Spesifik di Lapangan"
    }", "title": "...", "summary": "..." },
    { "type": "Pengalaman Pemakaian Nyata", "title": "...", "summary": "..." }
  ],
  "suggested_solutions": ["Langkah / Manfaat 1...", "Langkah / Manfaat 2...", "Langkah / Manfaat 3..."]
}`
      } else if (stageNumber === 3) {
        promptFinal = `
Kamu adalah Produser Copywriting Lisan untuk "${namaUser || "Kreator"}".
${blokPersona}
${blokFaseDanPola}

DATA TAHAP 1 & 2:
- Inti Materi: "${stageInput?.coreIdea}"
- Sudut Pandang: "${stageInput?.chosenAngle}"
- Perumpamaan/Cerita: "${stageInput?.personalStory}"
- Penjelasan Pendukung: ${JSON.stringify(stageInput?.injectedReference)}
- Solusi/Manfaat: ${JSON.stringify(stageInput?.actionableSolutions)}
${catatanHindariDuplikat}

TUGAS TAHAP 3 (6 KATEGORI HOOK LISAN KAMERA & 3 CTA SPESIFIK):
1. Berikan pengantar singkat di "co_pilot_message".
2. Pilih 1 alur pembawaan terbaik ("PAS_RELATABLE_BRIDGE", "HSO_STORY", "CONTRARIAN_MYTH_BUSTER", atau "BAB_TRANSFORMATION") beserta alasannya di "framework_reason".
3. WAJIB buat 6 pilihan kalimat pembuka ("hook_options") yang memadukan Pola Penarik Penonton di atas. Setiap Hook maksimal 1 sampai 2 kalimat lisan pendek (maksimal 3 detik ucap, 8-14 kata per kalimat):
   - "Negative / Warning Hook": Peringatan langsung agar penonton tidak rugi/salah langkah.
   - "Positive Outcome Hook": Hasil nyata yang bisa didapat tanpa ribet.
   - "Proof / Trust Hook": Membuka dengan bukti pengalaman nyata atau jam terbang.
   - "Contrarian Hook": Membantah anggapan umum yang ternyata keliru.
   - "Relatable POV Hook": Kejadian harian yang sering bikin kesel/relate.
   - "Curiosity Gap Hook": Membongkar satu penyebab sepele yang jarang disadari.
4. Buat 3 pilihan kalimat penutup ("cta_options") yang sesuai dengan Fase Konten saat ini.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "recommended_framework": "PAS_RELATABLE_BRIDGE",
  "framework_reason": "...",
  "hook_options": [
    { "category": "Negative / Warning Hook", "why_it_works": "Mencegah penonton melakukan kesalahan yang bikin rugi", "text": "..." },
    { "category": "Positive Outcome Hook", "why_it_works": "Menawarkan jalan keluar praktis tanpa ribet", "text": "..." },
    { "category": "Proof / Trust Hook", "why_it_works": "Membuka dengan bukti pengalaman nyata di lapangan", "text": "..." },
    { "category": "Contrarian Hook", "why_it_works": "Membantah kebiasaan keliru yang sering dipercaya", "text": "..." },
    { "category": "Relatable POV Hook", "why_it_works": "Menyentuh kejadian harian yang sering dialami penonton", "text": "..." },
    { "category": "Curiosity Gap Hook", "why_it_works": "Membongkar satu biang kerok sepele yang jarang disadari", "text": "..." }
  ],
  "cta_options": [
    { "category": "Pancing Diskusi Komentar", "text": "..." },
    { "category": "Simpan & Bagikan ke Teman", "text": "..." },
    { "category": "Cek Produk / Ikuti Akun", "text": "..." }
  ]
}`
      }
    }

    // 8. PENYUSUN SKRIP AKHIR — DYNAMIC STORY BEATS (3 S/D 8 BAGIAN DINAMIS)
    else if (action === "assemble_humanized_script") {
      const faseAktif =
        contentBrief?.content_phase || contentPhase || "fase_1_viral"
      const polaAktif =
        contentBrief?.viral_trigger || viralTrigger || "bongkar_kesalahan"
      const spekPersonalAktif =
        contentBrief?.personal_specs || personalSpecs || ""
      const modeKonteksAktif =
        contentBrief?.context_mode || contextMode || "sesuai_niche"

      const aturanBeats = getAturanDynamicStoryBeats(
        contentBrief?.target_platform || "45 - 60 Detik",
        faseAktif,
      )

      const blokPersona = susunInstruksiPersonaTerpisah(
        personaProfile,
        modeKonteksAktif,
        contentBrief?.core_idea,
      )

      const blokFaseDanPola = susunInstruksiFaseDanPola({
        contentPhase: faseAktif,
        viralTrigger: polaAktif,
        personalSpecs: spekPersonalAktif,
        personaProfile,
      })

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
Susun naskah skrip video menggunakan sistem DYNAMIC STORY BEATS.
${blokPersona}
${blokFaseDanPola}

RANCANGAN KONTEN TERKUNCI:
${JSON.stringify(contentBrief)}

BENTUK EKSEKUSI VISUAL: "${bentukKonten}"
${instruksiUGC}

ATURAN DYNAMIC STORY BEATS & SCALING DURASI:
${aturanBeats.instruksiBabak}

ATURAN WAJIB SETIAP BAGIAN (BEAT):
1. Setiap 1 bagian ("section") HANYA BOLEH berisi 2 sampai 3 kalimat lisan pendek (durasi ucap 10-15 detik, 8-14 kata per kalimat). Jangan pernah menumpuk paragraf panjang dalam 1 bagian!
2. Antar bagian wajib menyambung mulus menggunakan kata penghubung obrolan ("Soalnya gini...", "Nah, masalahnya tuh...", "Coba bayangin...", "Makanya...", "Terus kalau ditanya...") sehingga dari Bagian 1 sampai Bagian terakhir terdengar seperti satu obrolan utuh yang mengalir.

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
    "hook_strength": "Kalimat pembuka langsung masuk ke inti bahasan dengan bahasa lisan.",
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

    // 9. PENGUBAH DURASI SKRIP (TAMBAH / KURANGI JUMLAH BAGIAN 3-8 BEAT)
    else if (action === "ubah_durasi_skrip") {
      const aturanBeats = getAturanDynamicStoryBeats(
        durasiTargetBaru,
        contentPhase,
      )
      const blokPersona = susunInstruksiPersonaTerpisah(
        personaProfile,
        contextMode,
        body.subyek,
      )
      const blokFaseDanPola = susunInstruksiFaseDanPola({
        contentPhase,
        viralTrigger,
        personalSpecs,
        personaProfile,
      })

      promptFinal = `
Ubah durasi dan jumlah babak obrolan dari naskah skrip berikut menggunakan aturan DYNAMIC STORY BEATS.
${blokPersona}
${blokFaseDanPola}

Topik Skrip: "${body.subyek || "Konten Video"}"
Naskah Skrip Saat Ini:
${JSON.stringify(skripSebelumnya)}

ATURAN SCALING DURASI BARU ("${durasiTargetBaru}"):
${aturanBeats.instruksiBabak}

PERINGATAN KERAS:
- DILARANG hanya memanjangkan kalimat di dalam 4 kotak lama!
- Kamu WAJIB mengubah jumlah item di dalam array "sections" menjadi ${aturanBeats.minSections} sampai ${aturanBeats.maxSections} bagian sesuai tabel durasi di atas.
- Setiap bagian tetap hanya boleh berisi 2 sampai 3 kalimat lisan pendek (8-14 kata per kalimat) dan saling menyambung alami.

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

    // 10. GENERATOR STOK KONTEN MASSAL (2X, 5X, 10X VARIASI SKRIP)
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
      const blokFaseDanPola = susunInstruksiFaseDanPola({
        contentPhase,
        viralTrigger,
        personalSpecs,
        personaProfile,
      })

      promptFinal = `
Buat ${jml} variasi naskah skrip baru yang berbeda sudut pandang dan berbeda kalimat pembuka (Hook)-nya dari skrip induk berikut.
${blokPersona}
${blokFaseDanPola}

Topik Induk: "${body.subyek || "Konten Kreator"}"
Skrip Induk Saat Ini (${jumlahBeatInduk} Bagian):
${JSON.stringify(skripSebelumnya)}

ATURAN:
- Setiap variasi wajib terdiri dari ${jumlahBeatInduk} bagian ("sections") yang mengalir dengan bahasa lisan kamera (2-3 kalimat pendek per bagian).
- Setiap variasi wajib mengangkat sudut pandang atau pola pembuka yang berbeda agar bisa diunggah di hari yang berbeda.

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
