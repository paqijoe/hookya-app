import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const KAMUS_FORMAT_KONTEN = {
  ugc: "User-Generated Content (UGC): Gaya berbagi pengalaman sebagai pengguna langsung yang jujur, natural, dan terasa seperti rekomendasi teman dekat.",
  edukasi:
    "Educational Content: Membongkar ilmu, cara kerja, atau pengetahuan baru secara runtut sehingga penonton merasa mendapat wawasan baru.",
  entertaining:
    "Entertaining Content: Mengutamakan alur cerita yang seru, menghibur, segar, dan menjaga suasana penonton tetap asik dari awal sampai akhir.",
  inspirational:
    "Inspirational & Motivating Content: Menggerakkan hati, mengubah cara pandang, dan membangkitkan semangat penonton lewat kisah atau perenungan mendalam.",
  interactive:
    "Interactive Content: Melibatkan penonton secara aktif lewat pertanyaan pancingan, tebak pilihan, atau ajakan berpendapat langsung di kolom komentar.",
  testimonial_review:
    "Testimonial and Reviews: Mengulas pengalaman pemakaian nyata, membedah kelebihan dan kekurangan secara objektif, serta menunjukkan bukti hasil.",
  seasonal:
    "Seasonal Content: Mengaitkan bahasan dengan momen khusus, musim, tanggal gajian, bulan puasa/hari raya, atau kejadian yang sedang dirasakan semua orang.",
  tips_trick:
    "Tips & Trick Praktis: Memberikan langkah-langkah taktis dan solusi praktis yang bisa langsung dicoba penonton hari ini.",
  speech_kultum_pidato:
    "Materi Speech, Kultum, & Pidato: Naskah berbicara di depan umum (public speaking, ceramah/kultum, sambutan, atau orasi motivasi) dengan retorika yang berwibawa, menyentuh hati, kaya kosakata, sapaan audiens yang hangat, ilustrasi kisah yang kuat, serta penutup yang berkesan.",
}

const KAMUS_FAKTOR_VIRAL = {
  fakta_realitas:
    "Fakta & Realitas Lapangan: Mengangkat kenyataan nyata di lapangan, fakta mengejutkan, atau kebenaran yang sering diabaikan orang.",
  pro_kontra:
    "Memancing Pro & Kontra: Mengangkat dua sudut pandang berseberangan atau mengkritisi kebiasaan umum sehingga memicu diskusi hangat di komentar.",
  tokoh_brand_terkenal:
    "Membahas Tokoh, Artis, atau Brand Terkenal: Mengambil pelajaran, studi kasus, atau fenomena dari sosok populer maupun merek besar yang sudah dikenal masyarakat luas.",
  komedi:
    "Mengandung Komedi & Sentilan Lucu: Menyampaikan pesan lewat observasi kocak, sentilan santai, atau humor yang membuat penonton tersenyum.",
  emosional:
    "Memancing Emosional Mendalam: Menyentuh sisi perasaan manusiawi penonton (rasa haru, bangga, kesal karena merasa terwakili, atau kagum).",
}

const KAMUS_PENDEKATAN_TRUST = {
  bukti_jam_terbang:
    "Jam Terbang & Pengalaman Lapangan: Menunjukkan berapa lama kreator sudah bergelut di bidang ini dan pelajaran mahal yang sudah dilalui.",
  proses_balik_layar:
    "Proses Jujur di Balik Layar: Memperlihatkan proses kerja asli, ketelitian, atau perjuangan nyata yang jarang dilihat orang.",
  studi_kasus_nyata:
    "Bedah Kasus & Hasil Praktik: Menceritakan masalah nyata yang pernah ditangani beserta langkah penyelesaian dan hasilnya.",
  prinsip_dan_nilai:
    "Prinsip Jujur & Standar Kualitas: Menegaskan hal-hal yang pantang dilakukan kreator demi menjaga kualitas dan kejujuran kepada penonton.",
}

const KAMUS_GAYA_JUALAN = {
  soft_selling:
    "Soft Selling (Jualan Halus lewat Cerita/Edukasi): Masuk lewat masalah harian, cerita kejadian, atau tips bermanfaat terlebih dahulu. Produk/jasa diselipkan secara mulus di tengah ke akhir sebagai solusi alami tanpa kesan memaksa.",
  hard_selling:
    "Hard Selling (Jualan Tegas, To-The-Point & Penawaran Kuat): Langsung tunjukkan masalah utama di detik pertama, pamerkan keunggulan fisik & bukti nyata produk, sebutkan penawaran/harga/keuntungan, dan tutup dengan ajakan beli yang tegas.",
}

const ATURAN_BAHASA_INDONESIA_PRO = `
ATURAN KUALITAS PENULISAN NASKAH (WAJIB DIPATUHI 100%):
1. DILARANG menggunakan karakter em dash atau tanda hubung ganda (--) di bagian mana pun. Gunakan koma, titik, atau kalimat baru.
2. DILARANG menggunakan struktur klise terjemahan AI seperti "Bukan sekadar X, tapi juga Y", "Tidak hanya X, melainkan Y", "Di era digital yang serba cepat ini", "Membuka potensi", "Pengubah permainan (game-changer)".
3. DILARANG mengarang angka statistik atau riset palsu yang tidak ada di input pengguna.
4. Naskah harus terdengar hidup saat dibaca keras oleh manusia (memiliki jembatan antar-kalimat yang mengalir, ritme bicara yang jelas, dan pilihan kata yang tepat sasaran).
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

function getAturanDurasiDanKepadatanRiil({
  durasiStr = "60 Detik (1 Menit)",
  wordDensity = "padat_kaya_kosakata",
  contentFormat = "edukasi",
}) {
  const d = (durasiStr || "").toLowerCase()
  const isPadat = wordDensity !== "irit_ringkas"
  const isSpeech = contentFormat === "speech_kultum_pidato"

  const instruksiGayaKepadatan = isPadat
    ? `MODE KEPADATAN: PADAT BERISI & KAYA KOSAKATA.
- DILARANG KERAS menulis kalimat yang irit, pendek-pendek terputus, atau terlalu singkat.
- Gunakan perbendaharaan kata yang kaya, ekspresif, mengalir, dan penuh elaborasi nyata.
- Setiap bagian ("section") WAJIB dijabarkan secara utuh dengan contoh konkret, penjelasan logis, dan kalimat transisi yang mulus agar target jumlah kata benar-benar tercapai saat dibaca dengan kecepatan normal (140 kata per menit).`
    : `MODE KEPADATAN: RINGKAS & TO-THE-POINT (IRIT KATA).
- Gunakan kalimat yang lugas, padat, langsung menghantam inti bahasan tanpa berputar-putar, namun tetap memenuhi durasi yang diminta.`

  if (d.includes("15")) {
    return {
      targetDuration: "15 Detik",
      flowStyle: isPadat ? "Padat & Mengena" : "Cepat & To-The-Point",
      totalSectionsDefault: 3,
      minWordsPerSection: isPadat ? 15 : 12,
      totalTargetWords: "40 - 50 Kata",
      instruksiBabak: `
TARGET DURASI RIIL: 15 DETIK (Total 40 - 50 kata ucap).
${instruksiGayaKepadatan}
Buat tepat 3 bagian ("sections"):
- Bagian 1: Pembuka / Hook (0:00 - 0:04) -> ~15 kata.
- Bagian 2: Inti Masalah & Bukti Singkat (0:04 - 0:11) -> ~20 kata.
- Bagian 3: Solusi & Ajakan Penutup (0:11 - 0:15) -> ~15 kata.`,
    }
  }

  if (d.includes("30")) {
    return {
      targetDuration: "30 Detik",
      flowStyle: isPadat ? "Padat Berisi" : "Ringkas & Lugas",
      totalSectionsDefault: 4,
      minWordsPerSection: isPadat ? 22 : 18,
      totalTargetWords: "80 - 95 Kata",
      instruksiBabak: `
TARGET DURASI RIIL: 30 DETIK (Total 80 - 95 kata ucap).
${instruksiGayaKepadatan}
Buat tepat 4 bagian ("sections"), di mana masing-masing bagian WAJIB terdiri dari 2 sampai 3 kalimat utuh (~22 kata per bagian):
- Bagian 1: Pembuka / Hook [0:00 - 0:05]
- Bagian 2: Situasi & Masalah Nyata [0:05 - 0:14]
- Bagian 3: Penjelasan Inti & Solusi [0:14 - 0:24]
- Bagian 4: Kesimpulan & Ajakan (CTA) [0:24 - 0:30]`,
    }
  }

  if (d.includes("90") || d.includes("2 menit") || d.includes("120")) {
    return {
      targetDuration: "2 Menit",
      flowStyle: isSpeech
        ? "Retorika Panggung & Mengalir Mendalam"
        : "Bedah Mendalam & Kaya Kosakata",
      totalSectionsDefault: 6,
      minWordsPerSection: isPadat ? 50 : 40,
      totalTargetWords: "280 - 330 Kata",
      instruksiBabak: `
TARGET DURASI RIIL: 2 MENIT PENUH (TOTAL WAJIB 280 SAMPAI 330 KATA UCAP).
${instruksiGayaKepadatan}
PERINGATAN KERAS: Jangan pernah menulis terlalu pendek. Agar saat dibaca benar-benar mencapai 2 menit penuh, kamu WAJIB membuat 6 bagian ("sections"), dan SETIAP BAGIAN WAJIB berisi 4 sampai 5 kalimat lengkap (minimal 45 - 55 kata per bagian):
- Bagian 1: Pembuka & Pengunci Perhatian [0:00 - 0:15] (Minimal 45 kata)
- Bagian 2: Latar Belakang Kejadian / Fenomena Nyata [0:15 - 0:35] (Minimal 50 kata)
- Bagian 3: Bedah Kesalahan Umum / Akar Masalah [0:35 - 1:00] (Minimal 55 kata)
- Bagian 4: Perumpamaan / Ilustrasi Kisah Konkret [1:00 - 1:25] (Minimal 55 kata)
- Bagian 5: Langkah Solusi Utuh & Bukti Pengalaman [1:25 - 1:45] (Minimal 50 kata)
- Bagian 6: Rangkuman Kuat & Ajakan Penutup [1:45 - 2:00] (Minimal 45 kata)`,
    }
  }

  if (d.includes("2.5") || d.includes("3 menit") || d.includes("180")) {
    return {
      targetDuration: "3 Menit",
      flowStyle: isSpeech
        ? "Orasi / Kultum / Pidato Utuh & Menggetarkan"
        : "Storytelling Komprehensif & Kaya Kosakata",
      totalSectionsDefault: 8,
      minWordsPerSection: isPadat ? 60 : 48,
      totalTargetWords: "430 - 500 Kata",
      instruksiBabak: `
TARGET DURASI RIIL: 3 MENIT PENUH (TOTAL NASKAH WAJIB 430 SAMPAI 500 KATA UCAP).
${instruksiGayaKepadatan}
PERINGATAN MUTLAK: Kamu WAJIB membuat 8 bagian ("sections"), dan SETIAP BAGIAN WAJIB berisi 5 sampai 6 kalimat yang kaya kosakata dan mendalam (minimal 55 - 65 kata di setiap bagian). Jangan ada bagian yang cuma 1-2 kalimat.
Rincian 8 Bagian Wajib:
- Bagian 1: Pembuka & Pancingan Kuat [0:00 - 0:18] (Minimal 55 kata)
- Bagian 2: Konteks Kejadian / Cerita Pemicu di Lapangan [0:18 - 0:40] (Minimal 60 kata)
- Bagian 3: Bedah Masalah & Kesalahan yang Sering Terjadi [0:40 - 1:05] (Minimal 60 kata)
- Bagian 4: Ilustrasi / Perumpamaan Mendalam Biar Penonton Paham [1:05 - 1:30] (Minimal 60 kata)
- Bagian 5: Penjelasan Cara Kerja / Bukti Nyata / Dalil Logis [1:30 - 1:55] (Minimal 60 kata)
- Bagian 6: Studi Kasus / Perbandingan Sebelum vs Sesudah [1:55 - 2:20] (Minimal 60 kata)
- Bagian 7: Rincian Langkah Praktis & Menjawab Keraguan Audiens [2:20 - 2:42] (Minimal 55 kata)
- Bagian 8: Pesan Kunci Penutup & Ajakan Bertindak [2:42 - 3:00] (Minimal 50 kata)`,
    }
  }

  return {
    targetDuration: "60 Detik (1 Menit)",
    flowStyle: isPadat ? "Mengalir Padat & Kaya Kosakata" : "Lugas & Mengena",
    totalSectionsDefault: 5,
    minWordsPerSection: isPadat ? 34 : 28,
    totalTargetWords: "150 - 180 Kata",
    instruksiBabak: `
TARGET DURASI RIIL: 60 DETIK / 1 MENIT PENUH (TOTAL WAJIB 150 SAMPAI 180 KATA UCAP).
${instruksiGayaKepadatan}
Buat tepat 5 bagian ("sections"), di mana SETIAP BAGIAN WAJIB berisi 3 sampai 4 kalimat utuh (minimal 32 - 38 kata per bagian):
- Bagian 1: Pembuka / Hook [0:00 - 0:08] (~30 kata)
- Bagian 2: Situasi & Masalah Harian [0:08 - 0:20] (~35 kata)
- Bagian 3: Perumpamaan & Alasan Logis [0:20 - 0:34] (~38 kata)
- Bagian 4: Solusi Praktis & Bukti Nyata [0:34 - 0:48] (~38 kata)
- Bagian 5: Kesimpulan & Ajakan Penutup (CTA) [0:48 - 1:00] (~30 kata)`,
  }
}

function susunInstruksiStrategiKonten({
  contentPhase = "fase_1_viral",
  contentFormat = "edukasi",
  viralTrigger = "fakta_realitas",
  trustApproach = "bukti_jam_terbang",
  sellingStyle = "soft_selling",
  personalSpecs = "",
  personaProfile = {},
}) {
  const deskripsiFormat =
    KAMUS_FORMAT_KONTEN[contentFormat] || KAMUS_FORMAT_KONTEN.edukasi
  const deskripsiViral =
    KAMUS_FAKTOR_VIRAL[viralTrigger] || KAMUS_FAKTOR_VIRAL.fakta_realitas
  const deskripsiTrust =
    KAMUS_PENDEKATAN_TRUST[trustApproach] ||
    KAMUS_PENDEKATAN_TRUST.bukti_jam_terbang
  const deskripsiSelling =
    KAMUS_GAYA_JUALAN[sellingStyle] || KAMUS_GAYA_JUALAN.soft_selling

  const spekDiriProfil =
    personalSpecs ||
    personaProfile?.niche_context?.unique_selling_point ||
    personaProfile?.positioning_and_usp?.unique_selling_point ||
    "Pengalaman praktik langsung di lapangan"

  const peranKreator =
    personaProfile?.niche_context?.authority_role ||
    personaProfile?.positioning_and_usp?.authority_role ||
    "Praktisi yang berbagi pengalaman nyata"

  if (contentPhase === "fase_2_trust") {
    return `
# FASE KONTEN: FASE 2 - MENCIPTAKAN TRUST (BANGUN KEPERCAYAAN & KREDIBILITAS)
- FORMAT PEMBAWAAN (${contentFormat}): ${deskripsiFormat}
- PENDEKATAN TRUST UTAMA (${trustApproach}): ${deskripsiTrust}
- FAKTOR PENARIK PERHATIAN (${viralTrigger}): ${deskripsiViral}
- SPESIFIKASI PERSONAL DIRI KREATOR (WAJIB DISELIPKAN KE DALAM NASKAH):
  * Jam Terbang & Pengalaman Nyata: "${spekDiriProfil}"
  * Peran Kreator: "${peranKreator}"
`
  }

  if (contentPhase === "fase_3_konversi") {
    return `
# FASE KONTEN: FASE 3 - KONTEN KONVERSI (FOKUS JUALAN & MONETISASI)
- GAYA JUALAN YANG DIPILIH (${sellingStyle}): ${deskripsiSelling}
- FORMAT PEMBAWAAN (${contentFormat}): ${deskripsiFormat}
- FAKTOR PEMICU PERHATIAN AWAL (${viralTrigger}): ${deskripsiViral}
`
  }

  return `
# FASE KONTEN: FASE 1 - CARI VIRAL DULU (MENJANGKAU PENONTON BARU LUAS)
- FORMAT KONTEN (${contentFormat}): ${deskripsiFormat}
- FAKTOR PEMICU VIRAL UTAMA (${viralTrigger}): ${deskripsiViral}
`
}

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
      ],
    sikap_dan_ritme_bicara:
      personaProfile?.voice_dna?.delivery_style ||
      personaProfile?.positioning_and_usp?.authority_role ||
      "Mengalir natural dan meyakinkan",
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
  }

  if (contextMode === "lintas_produk") {
    return `
# IDENTITAS SUARA KREATOR (VOICE DNA - WAJIB DIPAKAI):
${JSON.stringify(voiceDNA)}
# MODE KONTEKS LINTAS TOPIK / AKUN BEBAS:
- Fokuskan 100% isi bahasan pada topik/produk saat ini: "${topikAtauProduk || "Topik Baru"}". Jangan membocorkan topik bidang lama (${nicheContext.bidang_utama}).
`
  }

  return `
# IDENTITAS SUARA KREATOR (VOICE DNA):
${JSON.stringify(voiceDNA)}
# KONTEKS BIDANG & PENONTON PROFIL AKTIF:
${JSON.stringify(nicheContext)}
`
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
      sec.estimatedSeconds || `${idx * 15}s - ${(idx + 1) * 18}s`
    const spokenText = sec.spokenText || sec.voiceover || ""
    const onScreenText = sec.onScreenText || sec.teksLayar || spokenText
    const visualCue =
      sec.visualCue || sec.visual || "Tatap kamera dengan intonasi meyakinkan"

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
      rawObj.flowStyle || aturanDurasi?.flowStyle || "Padat & Mengalir",
    totalSections: sectionsBersih.length,
    sections: sectionsBersih,
    segmen: segmenSinkron,
    kritikSaran:
      rawObj.kritikSaran ||
      rawObj.script_score?.producer_tip ||
      "Pastikan kalimat pembuka diucapkan tanpa jeda ragu dan jaga kontak mata dengan lensa kamera.",
    metadata: {
      ...(rawObj.metadata || {}),
      estimated_duration:
        rawObj.targetDuration ||
        rawObj.metadata?.estimated_duration ||
        aturanDurasi?.targetDuration ||
        "60 Detik",
      flow_style:
        rawObj.flowStyle || aturanDurasi?.flowStyle || "Padat & Mengalir",
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
// PERBAIKAN TOTAL MULTIMODAL (MIC, SCREENSHOT, & VIDEO) DI OPENROUTER & GEMINI
// Menghapus `response_format: { type: "json_object" }` pada request multimodal
// karena OpenRouter menolak kombinasi input_audio/image_url + json_object.
// ============================================================================
async function panggilMultimodalPintar({
  openRouterKey,
  geminiKey,
  promptText,
  imagesList = [],
  audioItem = null,
}) {
  let errorCatatan = ""
  const promptLengkap = `${promptText}\n\n${ATURAN_BAHASA_INDONESIA_PRO}\nPENTING: Balas HANYA dengan JSON murni yang diawali kurung kurawal buka { dan diakhiri kurung kurawal tutup } tanpa teks pengantar.`

  if (openRouterKey && openRouterKey.trim() !== "") {
    const modelMultimodal = [
      "google/gemini-2.0-flash-001",
      "google/gemini-2.5-flash",
      "openai/gpt-4o-mini",
    ]

    for (const model of modelMultimodal) {
      // Lewati gpt-4o-mini jika tugasnya berupa audio input murni
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
          return uraiJSONAman(data.choices[0].message.content)
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
  const promptFinal = `${promptText}\n\n${ATURAN_BAHASA_INDONESIA_PRO}`

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
                    "Kamu adalah Master Copywriter, Pakar Personal Branding, sekaligus Penulis Naskah Konten & Public Speaking terbaik di Indonesia. Kamu sangat patuh pada target jumlah kata sesuai durasi bicara manusia (140 kata per menit). Jika diminta durasi 2 atau 3 menit dengan mode Padat & Kaya Kosakata, kamu WAJIB menulis naskah yang panjang, bernas, mengalir mendalam, dan memenuhi jumlah kata minimal di setiap bagian tanpa meringkasnya. Balas HANYA dalam format JSON yang valid.",
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
      contentFormat = "edukasi",
      viralTrigger = "fakta_realitas",
      trustApproach = "bukti_jam_terbang",
      sellingStyle = "soft_selling",
      wordDensity = "padat_kaya_kosakata",
      personalSpecs = "",
      contextMode = "sesuai_niche",
      catatanAkhirUser = "",
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

    // 1. TOMBOL "i Referensi" PADA PROFILING
    if (action === "suggest_profiling_field") {
      const promptSaran = `
Pengguna sedang menyiapkan profil akun media sosialnya dan mengisi kolom "${fieldLabel}" (Kode: "${fieldKey}").
Data jawaban pengguna dari kolom sebelumnya:
${JSON.stringify(accumulatedProfile)}

Berikan 4 contoh isian yang konkret, membumi, dan langsung siap dipakai.

Keluarkan HANYA valid JSON:
{
  "insight_singkat": "1 kalimat alasan praktis kenapa contoh ini pas dengan profil akunmu.",
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

    // 2. SCAN SCREENSHOT PRODUK AFFILIATE
    if (action === "analyze_marketplace_screenshots") {
      const promptSS = `
Baca gambar screenshot produk atau spesifikasi marketplace yang dilampirkan.
1. "namaProduk": Salin nama produk dari gambar.
2. "brand": Salin nama merek atau toko yang tertulis di gambar (jika tidak ada, tulis "-").
3. "hargaPromo": Salin angka harga yang terlihat di gambar.
4. "keunggulanSpesifikasi": Terjemahkan spesifikasi teknis yang tertulis di gambar menjadi pengalaman pemakaian fisik yang nyata dan meyakinkan calon pembeli.
5. "masalahDipecahkan": Masalah atau kebutuhan pembeli yang langsung terjawab dengan produk ini.

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
Dengarkan rekaman suara ini dan salin ucapannya kata demi kata menjadi teks Bahasa Indonesia yang rapi.
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
1. Perhatikan seluruh potongan gambar frame video (termasuk teks/subtitle di layar dan adegan visual) SERTA dengarkan audio (jika ada) untuk menyalin isi video ke dalam "transkripAsliVideo".
2. Jika tidak ada suara ucapan, tuliskan narasi lengkap dari teks layar atau rangkaian adegan visual yang terlihat di video ke dalam "transkripAsliVideo" (jangan dikosongkan selama ada gambar frame yang terlihat).
3. Jelaskan struktur video tersebut pada "bedahKompetitor" ("jenisHookAsli", "pemicuEmosi", "rahasiaRetensi").
4. Tulis naskah baru yang orisinil dan padat berisi berdasarkan isi video tersebut menggunakan Voice DNA pengguna:
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
    { "idSegmen": "HOOK", "labelMini": "Bagian 1 • Pembuka (0:00 - 0:08)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "BODY_STORY", "labelMini": "Bagian 2 • Situasi & Masalah (0:08 - 0:25)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "VALUE_SOLUTION", "labelMini": "Bagian 3 • Penjelasan & Solusi (0:25 - 0:45)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "CTA", "labelMini": "Bagian 4 • Penutup & Ajakan (0:45 - 1:00)", "voiceover": "...", "teksLayar": "...", "visual": "..." }
  ]
}`

      const listFrames = (framesBase64 || []).slice(0, 6).map((f) => ({
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

      return NextResponse.json(hasilParsed)
    }

    // 5. PROFILING AKUN (MENDUKUNG MULTI-PROFIL TERNAK AKUN)
    let promptFinal = ""

    if (action === "extract_persona_dna") {
      promptFinal = `
Susun matriks identitas akun kreator dari data berikut:
- Data Profil Akun: ${JSON.stringify(onboardingAnswers)}
- Sampel Kalimat Lisan Pengguna: "${rawWritingSamples || ""}"

Keluarkan HANYA valid JSON:
{
  "user_id": "${onboardingAnswers?.user_id || "usr_99281"}",
  "account_label": "${onboardingAnswers?.nama_akun || onboardingAnswers?.minat_utama || "Akun Utama"}",
  "persona_summary": "Ringkasan jelas tentang karakter suara akun ini, jam terbang/spesifikasi dirinya, dan fokus bahasan utamanya.",
  "voice_dna": {
    "self_pronoun": "${onboardingAnswers?.sapaan_diri || "Aku"}",
    "audience_pronoun": "${onboardingAnswers?.sapaan_audiens || "Kamu"}",
    "spoken_particles": ["sih", "tuh", "kan", "deh", "banget"],
    "greeting_signature": ["Jujur ya,", "Soalnya gini,", "Coba perhatiin,"],
    "favorite_transitions": ["Nah, masalahnya,", "Makanya,", "Terus kalau ditanya,"],
    "delivery_style": "${onboardingAnswers?.gaya_kepribadian || "Mengalir natural, jelas, dan meyakinkan"}"
  },
  "niche_context": {
    "primary_niche": "${onboardingAnswers?.minat_utama || "Edukasi & Konten Harian"}",
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
    "favorite_transitions": ["Nah, masalahnya,", "Makanya,"],
    "signature_vocabulary": ["sih", "tuh", "kan", "deh"],
    "forbidden_words": [
      "Pernahkah kamu merasa",
      "Bayangkan jika",
      "Di era digital",
      "Solusi terbaik",
      "bukan sekadar"
    ],
    "code_switching_level": "Natural"
  }
}`
    }

    // 6. GENERATOR 10 IDE MATERI (MURNI HASIL ANALISIS PROFIL AKUN YANG DIPILIH)
    else if (action === "buat_10_ide_topik") {
      const instruksiStrategi = susunInstruksiStrategiKonten({
        contentPhase,
        contentFormat,
        viralTrigger,
        trustApproach,
        sellingStyle,
        personalSpecs,
        personaProfile,
      })

      const blokPersona = susunInstruksiPersonaTerpisah(
        personaProfile,
        "sesuai_niche",
        personaProfile?.niche_context?.primary_niche || "Bidang Profil Akun",
      )

      promptFinal = `
Analisis secara mendalam Profil Akun Sosial Media kreator berikut (Bidang Utama, Spesifikasi Jam Terbang, Masalah Penonton, dan Harapan Penonton) untuk menghasilkan 10 rekomendasi ide materi yang 100% spesifik pada akun tersebut:
${blokPersona}
${instruksiStrategi}

TUGAS UTAMA:
Buatkan 10 ide materi konten yang spesifik, nyata, dan langsung menjawab masalah penonton dari profil akun di atas, dengan menggabungkan Format Konten (${KAMUS_FORMAT_KONTEN[contentFormat] || contentFormat}) dan Faktor Pemicu (${KAMUS_FAKTOR_VIRAL[viralTrigger] || viralTrigger}).

Balas HANYA dalam format JSON:
{
  "ideTopik": [
    {
      "judul": "Judul materi spesifik sesuai bidang akun ini...",
      "nuansa": "Format & Faktor Pemicu...",
      "ringkasan": "1 kalimat penjelasan poin utama yang akan dibahas..."
    }
  ]
}`
    }

    // 7. ASESMEN TERPANDU TAHAP 1, 2, DAN 3
    else if (action === "assessment_copilot") {
      const faseAktif =
        stageInput?.contentPhase || contentPhase || "fase_1_viral"
      const formatAktif =
        stageInput?.contentFormat || contentFormat || "edukasi"
      const faktorViralAktif =
        stageInput?.viralTrigger || viralTrigger || "fakta_realitas"
      const pendekatanTrustAktif =
        stageInput?.trustApproach || trustApproach || "bukti_jam_terbang"
      const gayaJualanAktif =
        stageInput?.sellingStyle || sellingStyle || "soft_selling"
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

      const blokStrategi = susunInstruksiStrategiKonten({
        contentPhase: faseAktif,
        contentFormat: formatAktif,
        viralTrigger: faktorViralAktif,
        trustApproach: pendekatanTrustAktif,
        sellingStyle: gayaJualanAktif,
        personalSpecs: spekPersonalAktif,
        personaProfile,
      })

      const infoKonteks = stageInput?.detailPromosi
        ? `DETAIL PRODUK / CAMPAIGN (${stageInput.jenisPromosi}):\n${JSON.stringify(stageInput.detailPromosi)}`
        : `Topik Materi: "${stageInput?.rawTopic}"`

      const catatanHindariDuplikat =
        opsiSebelumnya && opsiSebelumnya.length > 0
          ? `\nPENGGUNA MEMINTA OPSI BARU (SET KE-${batchKe || 2}): Berikan opsi yang berbeda dari daftar sebelumnya ini: ${JSON.stringify(opsiSebelumnya)}`
          : ""

      if (stageNumber === 1) {
        promptFinal = `
Kamu adalah Produser & Mentor Konten Pendamping untuk "${namaUser || "Kreator"}".
${blokPersona}
${blokStrategi}

DATA MATERI TAHAP 0:
- ${infoKonteks}
- Target Durasi: "${stageInput?.targetPlatform}"
${catatanHindariDuplikat}

TUGAS TAHAP 1 (3 OPSI SUDUT PANDANG TAJAM SESUAI FORMAT & FAKTOR VIRAL):
1. Pada "co_pilot_message", berikan arahan singkat yang jelas tentang bagaimana membawakan topik ini.
2. Rumuskan 1 kalimat inti materi pada "refined_core_idea".
3. Berikan 3 pilihan sudut pandang ("angle_options") yang konkret dan mendalam.
4. Pada "story_prompt_question", tanyakan 1 pertanyaan yang mudah dimengerti untuk menggali kisah, contoh kasus, atau pengalaman kreator.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "refined_core_idea": "...",
  "angle_options": [
    { "id": "angle_1", "type": "Realitas & Fakta Lapangan", "angle_text": "..." },
    { "id": "angle_2", "type": "Pendekatan Utama Format", "angle_text": "..." },
    { "id": "angle_3", "type": "Sudut Pandang Pemicu Diskusi", "angle_text": "..." }
  ],
  "story_prompt_question": "..."
}`
      } else if (stageNumber === 2) {
        promptFinal = `
Kamu adalah Produser Pendamping untuk "${namaUser || "Kreator"}".
${blokPersona}
${blokStrategi}

DATA TAHAP 1:
- Inti Materi: "${stageInput?.coreIdea}"
- Sudut Pandang Terpilih: "${stageInput?.chosenAngle}"
- Pengalaman / Detail dari Kreator: "${stageInput?.userStory || "(Belum diisi)"}"
- Detail Produk/Campaign (jika ada): ${JSON.stringify(stageInput?.detailPromosi || {})}
${catatanHindariDuplikat}

TUGAS TAHAP 2 (REKOMENDASI ILUSTRASI, PONDASI FAKTA, & POIN ISI UTAMA):
1. Tanggapi secara jelas di "co_pilot_message".
2. Buat 3 pilihan perumpamaan atau ilustrasi kisah sehari-hari ("relatable_analogies") yang membuat materi ini langsung terbayang jelas.
3. Buat 3 pilihan Pondasi Fakta / Alasan Logis ("reference_cards") yang mudah dipahami pengguna.
4. Berikan 3 poin bahasan inti atau solusi ("suggested_solutions") yang kaya dan berbobot untuk mengisi tubuh naskah.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "relatable_analogies": ["Ilustrasi 1...", "Ilustrasi 2...", "Ilustrasi 3..."],
  "reference_cards": [
    { "type": "Fakta & Alasan Logis", "title": "...", "summary": "..." },
    { "type": "Kejadian Nyata di Lapangan", "title": "...", "summary": "..." },
    { "type": "Bukti Hasil & Praktik Nyata", "title": "...", "summary": "..." }
  ],
  "suggested_solutions": ["Poin Isi / Solusi 1...", "Poin Isi / Solusi 2...", "Poin Isi / Solusi 3..."]
}`
      } else if (stageNumber === 3) {
        promptFinal = `
Kamu adalah Master Copywriter & Public Speaker untuk "${namaUser || "Kreator"}".
${blokPersona}
${blokStrategi}

DATA TAHAP 1 & 2:
- Inti Materi: "${stageInput?.coreIdea}"
- Sudut Pandang: "${stageInput?.chosenAngle}"
- Ilustrasi/Cerita: "${stageInput?.personalStory || "(Opsional)"}"
- Pondasi Fakta: ${JSON.stringify(stageInput?.injectedReference)}
- Poin Isi/Solusi: ${JSON.stringify(stageInput?.actionableSolutions)}
${catatanHindariDuplikat}

TUGAS TAHAP 3 (6 KATEGORI KALIMAT PEMBUKA / HOOK & 3 KALIMAT PENUTUP / CTA):
1. Berikan pengantar singkat di "co_pilot_message".
2. Pilih 1 struktur alur terbaik ("PAS_RELATABLE_BRIDGE", "HSO_STORY", "CONTRARIAN_MYTH_BUSTER", atau "BAB_TRANSFORMATION") beserta alasannya di "framework_reason".
3. WAJIB buat 6 pilihan kalimat pembuka ("hook_options") yang kuat.
4. Buat 3 pilihan kalimat penutup ("cta_options") yang kuat sesuai tujuan Fase (${faseAktif}).

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "recommended_framework": "PAS_RELATABLE_BRIDGE",
  "framework_reason": "...",
  "hook_options": [
    { "category": "Negative / Warning Hook", "why_it_works": "Mengingatkan kesalahan fatal yang sering terjadi", "text": "..." },
    { "category": "Positive Outcome Hook", "why_it_works": "Menawarkan hasil nyata yang diinginkan audiens", "text": "..." },
    { "category": "Proof / Reality Hook", "why_it_works": "Membuka dengan fakta realitas atau bukti pengalaman", "text": "..." },
    { "category": "Contrarian / Pro-Kontra Hook", "why_it_works": "Memancing diskusi dan menahan perhatian sejak kalimat pertama", "text": "..." },
    { "category": "Relatable / Emotional Hook", "why_it_works": "Menyentuh situasi dan perasaan yang dekat dengan audiens", "text": "..." },
    { "category": "Curiosity / Famous Case Hook", "why_it_works": "Membangkitkan rasa ingin tahu hingga akhir", "text": "..." }
  ],
  "cta_options": [
    { "category": "Pancing Interaksi & Komentar", "text": "..." },
    { "category": "Simpan & Bagikan Manfaat", "text": "..." },
    { "category": "Ajakan Bertindak / Penutup Kuat", "text": "..." }
  ]
}`
      }
    }

    // 8. PENYUSUN SKRIP AKHIR — FULL DURATION, CATATAN AKHIR USER & KRITIK/SARAN
    else if (action === "assemble_humanized_script") {
      const faseAktif =
        contentBrief?.content_phase || contentPhase || "fase_1_viral"
      const formatAktif =
        contentBrief?.content_format || contentFormat || "edukasi"
      const faktorViralAktif =
        contentBrief?.viral_trigger || viralTrigger || "fakta_realitas"
      const pendekatanTrustAktif =
        contentBrief?.trust_approach || trustApproach || "bukti_jam_terbang"
      const gayaJualanAktif =
        contentBrief?.selling_style || sellingStyle || "soft_selling"
      const kepadatanKataAktif =
        contentBrief?.word_density || wordDensity || "padat_kaya_kosakata"
      const spekPersonalAktif =
        contentBrief?.personal_specs || personalSpecs || ""
      const modeKonteksAktif =
        contentBrief?.context_mode || contextMode || "sesuai_niche"
      const catatanTambahan =
        catatanAkhirUser || contentBrief?.user_final_notes || ""

      const aturanDurasi = getAturanDurasiDanKepadatanRiil({
        durasiStr: contentBrief?.target_platform || "60 Detik (1 Menit)",
        wordDensity: kepadatanKataAktif,
        contentFormat: formatAktif,
      })

      const blokPersona = susunInstruksiPersonaTerpisah(
        personaProfile,
        modeKonteksAktif,
        contentBrief?.core_idea,
      )

      const blokStrategi = susunInstruksiStrategiKonten({
        contentPhase: faseAktif,
        contentFormat: formatAktif,
        viralTrigger: faktorViralAktif,
        trustApproach: pendekatanTrustAktif,
        sellingStyle: gayaJualanAktif,
        personalSpecs: spekPersonalAktif,
        personaProfile,
      })

      const isModeUGC =
        Boolean(ugcConfig?.aktif) ||
        formatAktif === "ugc" ||
        (bentukKonten && bentukKonten.toLowerCase().includes("ugc"))

      const daftarPemeran = Array.isArray(ugcConfig?.namaPemeran)
        ? ugcConfig.namaPemeran.filter(Boolean).join(", ")
        : "Pemeran 1, Pemeran 2"

      const instruksiUGC =
        isModeUGC && ugcConfig?.aktif
          ? `\nFORMAT DIALOG UGC (${ugcConfig?.jumlahOrang || 2} ORANG: ${daftarPemeran}): Tulis percakapan saling menyahut yang hidup dan mendalam di setiap bagian.`
          : `\nFORMAT PENYAMPAIAN LISAN: Gunakan sapaan khas kreator secara konsisten dan mengalir.`

      const instruksiCatatanAkhir = catatanTambahan.trim()
        ? `\n# INSTRUKSI KHUSUS / KOREKSI AKHIR DARI PENGGUNA (WAJIB DIIKUTI 100%):\n"${catatanTambahan.trim()}"\n`
        : ""

      promptFinal = `
Susun naskah skrip lengkap yang memenuhi target durasi bicara riil dan kepadatan kosakata berikut.
${blokPersona}
${blokStrategi}

RANCANGAN KONTEN TERKUNCI:
${JSON.stringify(contentBrief)}
${instruksiCatatanAkhir}
BENTUK EKSEKUSI VISUAL: "${bentukKonten}"
${instruksiUGC}

# ATURAN MUTLAK DURASI RIIL & JUMLAH KATA (WAJIB DITAATI 100%):
${aturanDurasi.instruksiBabak}
- Total target kata seluruh naskah: **${aturanDurasi.totalTargetWords}**.
- Setiap bagian ("section") WAJIB memiliki minimal **${aturanDurasi.minWordsPerSection} kata** pada kolom "spokenText".
- Berikan juga "kritikSaran" (2-3 kalimat kritik objektif terhadap titik lemah draf topik ini beserta saran praktis cara membawakannya agar lebih kuat di depan penonton).

Keluarkan HANYA valid JSON dengan struktur berikut:
{
  "targetDuration": "${aturanDurasi.targetDuration}",
  "flowStyle": "${aturanDurasi.flowStyle}",
  "totalSections": ${aturanDurasi.totalSectionsDefault},
  "sections": [
    {
      "partNumber": 1,
      "partTitle": "Pembuka (Hook)",
      "estimatedSeconds": "0:00 - 0:10",
      "visualCue": "...",
      "spokenText": "Tulis naskah ucapan yang lengkap, bernas, kaya kosakata, dan memenuhi jumlah kata minimal bagian ini...",
      "onScreenText": "Teks inti di layar..."
    }
  ],
  "kritikSaran": "Kritik objektif dan saran pembawaan naskah ini...",
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
      const hasilNormal = normalisasiHasilSkripDinamis(
        hasilMentah,
        aturanDurasi,
      )
      return NextResponse.json(hasilNormal)
    }

    // 9. PENGUBAH DURASI & KEPADATAN SKRIP
    else if (action === "ubah_durasi_skrip") {
      const aturanDurasi = getAturanDurasiDanKepadatanRiil({
        durasiStr: durasiTargetBaru,
        wordDensity,
        contentFormat,
      })

      const blokPersona = susunInstruksiPersonaTerpisah(
        personaProfile,
        contextMode,
        body.subyek,
      )
      const blokStrategi = susunInstruksiStrategiKonten({
        contentPhase,
        contentFormat,
        viralTrigger,
        trustApproach,
        sellingStyle,
        personalSpecs,
        personaProfile,
      })

      promptFinal = `
Tulis ulang dan sesuaikan panjang serta jumlah bagian dari naskah skrip berikut agar benar-benar memenuhi target durasi bicara riil: "${durasiTargetBaru}" (Total Target Kata: ${aturanDurasi.totalTargetWords}).
${blokPersona}
${blokStrategi}

Topik Skrip: "${body.subyek || "Konten Video"}"
Naskah Skrip Saat Ini:
${JSON.stringify(skripSebelumnya)}

# ATURAN EKSPANSI / PENYESUAIAN DURASI BARU:
${aturanDurasi.instruksiBabak}
- Buat tepat ${aturanDurasi.totalSectionsDefault} bagian ("sections").
- Setiap bagian WAJIB memiliki minimal ${aturanDurasi.minWordsPerSection} kata pada "spokenText" agar saat dibaca keras benar-benar mencapai durasi ${aturanDurasi.targetDuration}.

Keluarkan HANYA valid JSON:
{
  "targetDuration": "${aturanDurasi.targetDuration}",
  "flowStyle": "${aturanDurasi.flowStyle}",
  "totalSections": ${aturanDurasi.totalSectionsDefault},
  "sections": [
    {
      "partNumber": 1,
      "partTitle": "Pembuka (Hook)",
      "estimatedSeconds": "0:00 - 0:12",
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
      const hasilNormal = normalisasiHasilSkripDinamis(
        hasilMentah,
        aturanDurasi,
      )
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
      const blokStrategi = susunInstruksiStrategiKonten({
        contentPhase,
        contentFormat,
        viralTrigger,
        trustApproach,
        sellingStyle,
        personalSpecs,
        personaProfile,
      })

      promptFinal = `
Buat ${jml} variasi naskah skrip baru yang berbeda sudut pandang dan berbeda kalimat pembuka (Hook)-nya dari skrip induk berikut.
${blokPersona}
${blokStrategi}

Topik Induk: "${body.subyek || "Konten Kreator"}"
Skrip Induk Saat Ini (${jumlahBeatInduk} Bagian):
${JSON.stringify(skripSebelumnya)}

ATURAN:
- Setiap variasi wajib terdiri dari ${jumlahBeatInduk} bagian ("sections") dengan panjang kalimat yang sama padatnya dengan skrip induk.
- Setiap variasi wajib mengangkat sudut pandang atau pemicu perhatian yang berbeda.

Keluarkan HANYA valid JSON:
{
  "daftarVariasi": [
    {
      "judulVariasi": "Variasi 1: [Sudut Pandang Spesifik]",
      "sections": [
        {
          "partNumber": 1,
          "partTitle": "Pembuka (Hook)",
          "estimatedSeconds": "0:00 - 0:10",
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
Tulis ulang SATU bagian naskah ini saja ("${segmenTarget?.partTitle || segmenTarget?.labelMini}") dengan variasi kalimat baru yang lebih kuat, kaya kosakata, dan mempertahankan kepadatan panjang katanya.
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
  "learning_summary": ["Gaya kalimat dan pilihan kosakata dari revisimu telah disimpan ke profil akun ini."],
  "updated_persona_profile": ${JSON.stringify(personaProfile)}
}`
    } else if (action === "ubah_bentuk_konten") {
      const jumlahBagianSaatIni = Array.isArray(skripSebelumnya)
        ? skripSebelumnya.length
        : 4
      promptFinal = `
Sesuaikan ke-${jumlahBagianSaatIni} bagian naskah skrip berikut ke dalam format eksekusi visual baru: "${bentukKontenBaru}".
Pertahankan jumlah bagian (${jumlahBagianSaatIni} bagian) dan pertahankan kepadatan jumlah kata di setiap bagiannya.
Skrip saat ini: ${JSON.stringify(skripSebelumnya)}

Keluarkan HANYA valid JSON:
{
  "sections": [
    {
      "partNumber": 1,
      "partTitle": "...",
      "estimatedSeconds": "0:00 - 0:10",
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
