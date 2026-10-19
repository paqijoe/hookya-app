import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function uraiJSONAman(dataRespons) {
  const parts = dataRespons?.candidates?.[0]?.content?.parts || []
  let teksMentah = ""

  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i]?.text && !parts[i]?.thought) {
      teksMentah = parts[i].text
      break
    }
  }
  if (!teksMentah && parts[0]?.text) teksMentah = parts[0].text

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
    const sanitasi = bersih
      .replace(/[\u0000-\u0019]+/g, " ")
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
    return JSON.parse(sanitasi)
  }
}

// Mencatat error ke Admin & mengganti/menambah koin user secara diam-diam di belakang layar
async function catatErrorDanGantiKoinDiamDiam({
  userId,
  namaUser,
  fitur,
  pesanError,
  koinKompensasi = 1,
}) {
  const supabase = getSupabase()
  if (!supabase) return null

  let koinTerbaru = null
  try {
    if (userId) {
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
        fitur: fitur || "Generate AI",
        pesan_error: pesanError || "Gagal memproses respons AI",
        koin_diganti: koinKompensasi,
      },
    ])
  } catch {
    // Abaikan jika gagal menulis log
  }
  return koinTerbaru
}

async function panggilGeminiAI(apiKey, partsPayload) {
  let kandidatModel = [
    "gemini-3.0-flash",
    "gemini-3.8-flash",
    "gemini-3-flash-preview",
    "gemini-flash-latest",
  ]

  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    )
    if (listRes.ok) {
      const listData = await listRes.json()
      const aktif = (listData.models || [])
        .filter(
          (m) =>
            m.supportedGenerationMethods?.includes("generateContent") &&
            m.name.includes("gemini") &&
            !m.name.includes("2.0") &&
            !m.name.includes("2.5") &&
            !m.name.includes("1.5"),
        )
        .map((m) => m.name.replace("models/", ""))

      if (aktif.length > 0) {
        const flashOnly = aktif.filter((n) => n.includes("flash"))
        kandidatModel = [...new Set([...flashOnly, ...aktif, ...kandidatModel])]
      }
    }
  } catch {
    // Gunakan daftar kandidat default
  }

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
              temperature: 0.65,
            },
          }),
        },
      )

      const data = await response.json()
      if (response.ok) {
        return uraiJSONAman(data)
      } else {
        errorTerakhir = data?.error?.message || `Kendala pada model ${model}`
      }
    } catch (err) {
      errorTerakhir = err.message
    }
  }

  throw new Error(errorTerakhir || "Sistem AI tidak dapat merespons saat ini.")
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
      dataKinerja,
      customPrompts,
    } = body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Kunci API belum dipasang di server." },
        { status: 500 },
      )
    }

    let promptFinal = ""
    let partsPayload = []

    // =========================================================================
    // 1. TRANSKRIP SUARA MIKROFON HYBRID (SOLUSI MIC JALAN DI SEMUA HP/BROWSER)
    // =========================================================================
    if (action === "transkrip_suara_mic") {
      if (!audioBase64) {
        return NextResponse.json(
          { error: "Tidak ada rekaman suara yang diterima." },
          { status: 400 },
        )
      }
      promptFinal = `
Dengarkan rekaman suara pengguna ini dan salin persis ucapannya menjadi teks Bahasa Indonesia yang rapi.
Jika tidak ada suara ucapan manusia sama sekali, kembalikan string kosong pada "teks".
Balas HANYA dalam format JSON:
{
  "teks": "Hasil transkrip ucapan pengguna..."
}`
      partsPayload = [
        {
          inlineData: {
            mimeType: audioMimeType || "audio/webm",
            data: audioBase64,
          },
        },
        { text: promptFinal },
      ]
    }

    // =========================================================================
    // 2. ANALISIS GAYA BICARA PENGGUNA (PERSONA ENGINE DI BALIK LAYAR)
    // =========================================================================
    else if (action === "extract_persona_dna") {
      promptFinal = `
Analisis profil dan contoh gaya bicara pengguna berikut untuk menyusun matriks gaya bahasa internal:
- Data Profil: ${JSON.stringify(onboardingAnswers)}
- Contoh Kalimat Asli Pengguna: "${rawWritingSamples || "Santai, jujur, langsung ke inti pembahasan."}"

Keluarkan HANYA valid JSON:
{
  "user_id": "${onboardingAnswers?.user_id || "usr_99281"}",
  "persona_summary": "Ringkasan gaya bicara pengguna dalam bahasa sehari-hari yang ramah...",
  "archetype": {
    "primary": "Teman Diskusi Jujur",
    "secondary": "Praktisi Berpengalaman",
    "authority_stance": "..."
  },
  "linguistic_matrix": {
    "self_pronoun": "${onboardingAnswers?.sapaan_diri || "Aku"}",
    "audience_pronoun": "${onboardingAnswers?.sapaan_audiens || "Kamu"}",
    "greeting_signature": ["...", "...", "..."],
    "favorite_transitions": ["...", "...", "..."],
    "signature_vocabulary": ["...", "...", "..."],
    "forbidden_words": ["Anda", "Pemirsa", "Oleh karena itu", "Selain itu", "Di era digital saat ini", "Kesimpulannya", "Tidak dapat dipungkiri"],
    "code_switching_level": "Natural"
  },
  "rhythm_and_delivery": {
    "sentence_length": "Pendek, jelas, maksimal 12-14 kata per kalimat",
    "pacing": "Cepat di awal, mengalir di tengah, tegas di akhir",
    "humor_style": "Santai",
    "rhetorical_habit": "Kalimat aktif dan akrab"
  },
  "belief_system": {
    "core_values": ["Praktik nyata", "Kejujuran"],
    "contrarian_views": ["Menghindari basa-basi rumit"]
  }
}`
      partsPayload = [{ text: promptFinal }]
    }

    // =========================================================================
    // 3. CO-PILOT 4 TAHAP (MENDUKUNG PERSONAL BRANDING, PRODUK AFFILIATE, & CAMPAIGN/GERAKAN)
    // =========================================================================
    else if (action === "assessment_copilot") {
      const infoKonteks = stageInput?.detailPromosi
        ? `DETAIL PROMOSI (${stageInput.jenisPromosi}):\n${JSON.stringify(stageInput.detailPromosi, null, 2)}`
        : `Topik Konten Kreator: "${stageInput?.rawTopic}"`

      if (stageNumber === 1) {
        promptFinal = `
Kamu adalah Asisten Produser Konten Pribadi dengan gaya bahasa kreator berikut:
${JSON.stringify(personaProfile, null, 2)}

DATA KONTEN YANG INGIN DIBUAT:
- Kategori: "${stageInput?.kategori}"
- ${infoKonteks}
- Durasi & Platform: "${stageInput?.targetPlatform}"

TUGAS TAHAP 1 (Penajaman Sudut Pandang):
1. Rumuskan 1 gagasan utama yang tajam pada "refined_core_idea".
2. Berikan **3 Pilihan Sudut Pandang Bahasan** yang memikat penonton:
   - Pilihan 1: Membongkar Mitos / Kesalahpahaman Umum
   - Pilihan 2: Mengangkat Masalah / Kesalahan yang Sering Dialami Target Penonton
   - Pilihan 3: Solusi / Rahasia Praktis yang Bikin Penasaran
3. Gunakan bahasa sehari-hari yang ramah tanpa istilah koding.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "Sapaan hangat & pengantar memilih sudut pandang...",
  "refined_core_idea": "...",
  "angle_options": [
    { "id": "angle_1", "type": "Membongkar Mitos Umum", "angle_text": "..." },
    { "id": "angle_2", "type": "Masalah / Kesalahan Nyata", "angle_text": "..." },
    { "id": "angle_3", "type": "Solusi / Rahasia Praktis", "angle_text": "..." }
  ],
  "story_prompt_question": "Pertanyaan singkat untuk memancing cerita atau alasan kuat di balik konten/produk/campaign ini..."
}`
      } else if (stageNumber === 2) {
        promptFinal = `
Kamu adalah Asisten Produser Konten Pribadi:
${JSON.stringify(personaProfile, null, 2)}

DATA TAHAP SEBELUMNYA:
- Inti Bahasan: "${stageInput?.coreIdea}"
- Sudut Pandang Terpilih: "${stageInput?.chosenAngle}"
- Cerita / Latar Belakang: "${stageInput?.userStory || "(Belum diisi)"}"
- Detail Produk/Campaign (jika ada): ${JSON.stringify(stageInput?.detailPromosi || {})}

TUGAS TAHAP 2 (Fakta Pendukung, Perumpamaan & Solusi):
1. Buat **2 pilihan perumpamaan/skenario sehari-hari** ("relatable_analogies") yang sangat dekat dengan penonton.
2. Berikan **3 Kartu Fakta/Referensi Pendukung** ("reference_cards": 1 Fakta Psikologi Penonton, 1 Bukti/Data Lapangan, 1 Fenomena Sehari-hari).
3. Berikan **3 poin solusi atau keunggulan konkret** ("suggested_solutions") yang menjawab masalah penonton.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "Tanggapan hangat & ajakan memilih fakta pendukung serta solusi...",
  "relatable_analogies": ["Perumpamaan 1...", "Perumpamaan 2..."],
  "reference_cards": [
    { "type": "Fakta Psikologi", "title": "...", "summary": "..." },
    { "type": "Bukti & Data Lapangan", "title": "...", "summary": "..." },
    { "type": "Fenomena Nyata", "title": "...", "summary": "..." }
  ],
  "suggested_solutions": ["Langkah/Poin 1...", "Langkah/Poin 2...", "Langkah/Poin 3..."]
}`
      } else if (stageNumber === 3) {
        promptFinal = `
Kamu adalah Asisten Produser Konten Pribadi:
${JSON.stringify(personaProfile, null, 2)}

DATA TAHAP 1 & 2:
- Inti Bahasan: "${stageInput?.coreIdea}"
- Sudut Pandang: "${stageInput?.chosenAngle}"
- Cerita/Perumpamaan: "${stageInput?.personalStory}"
- Fakta Pendukung: ${JSON.stringify(stageInput?.injectedReference)}
- Solusi/Keunggulan: ${JSON.stringify(stageInput?.actionableSolutions)}

TUGAS TAHAP 3 (Alur Copywriting, Kalimat Pembuka 3 Detik Awal & Ajakan Penutup):
1. Rekomendasikan 1 kerangka terbaik ("PAS_RELATABLE_BRIDGE", "HSO_STORY", "CONTRARIAN_MYTH_BUSTER", atau "BAB_TRANSFORMATION").
2. Buat **3 pilihan kalimat pembuka (Hook 3 detik pertama)** menggunakan sapaan dan kosakata khas pengguna.
3. Buat **3 pilihan kalimat ajakan penutup (CTA)** yang memancing komentar atau tindakan penonton.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "Saran alur cerita & pilihan kalimat pembuka...",
  "recommended_framework": "PAS_RELATABLE_BRIDGE",
  "framework_reason": "Alasan singkat dengan bahasa sederhana...",
  "hook_options": ["Kalimat pembuka 1...", "Kalimat pembuka 2...", "Kalimat pembuka 3..."],
  "cta_options": ["Kalimat penutup 1...", "Kalimat penutup 2...", "Kalimat penutup 3..."]
}`
      }
      partsPayload = [{ text: promptFinal }]
    }

    // =========================================================================
    // 4. PENYUSUN SKRIP UTAMA + MODE KONTEN UGC (PERCAKAPAN MULTI-PEMERAN)
    // =========================================================================
    else if (action === "assemble_humanized_script") {
      const isModeUGC =
        Boolean(ugcConfig?.aktif) ||
        (bentukKonten && bentukKonten.toLowerCase().includes("ugc"))

      const daftarPemeran = Array.isArray(ugcConfig?.namaPemeran)
        ? ugcConfig.namaPemeran.filter(Boolean).join(", ")
        : "Pemeran 1, Pemeran 2"

      const instruksiUGC = isModeUGC
        ? `
# INSTRUKSI KHUSUS KONTEN UGC (DIALOG PERCAKAPAN ${ugcConfig?.jumlahOrang || 2} ORANG):
- Konten ini WAJIB ditulis dalam bentuk **Teks Percakapan / Dialog Saling Bersahutan** antara **${ugcConfig?.jumlahOrang || 2} orang** dengan nama pemeran: **${daftarPemeran}**.
- Pada setiap bagian kerangka ("voiceover"), tuliskan nama pemeran diikuti titik dua dan kalimat dialognya secara bergantian yang terdengar sangat natural seperti obrolan nyata (Contoh: "${ugcConfig?.namaPemeran?.[0] || "Rina"}: [Nada penasaran] Eh, kamu sadar nggak sih...\\n${ugcConfig?.namaPemeran?.[1] || "Dinda"}: Iya bener banget, dulu aku juga...").
- Alur percakapan dari Bagian 1 sampai Bagian 4 WAJIB mengikuti teori copywriting yang sangat kuat sesuai kerangka "${contentBrief?.selected_framework}" (Memancing rasa penasaran di awal, membongkar masalah/cerita di tengah, membuktikan solusi/produk/campaign secara meyakinkan, dan ditutup dengan ajakan bertindak).`
        : `
# INSTRUKSI SKRIP MONOLOG NATURAL:
- Tulis dengan bahasa lisan yang mengalir alami sesuai sapaan "${personaProfile?.linguistic_matrix?.self_pronoun}" dan "${personaProfile?.linguistic_matrix?.audience_pronoun}".`

      promptFinal = `
Kamu adalah Penulis Skrip Video Pendek & Copywriter Profesional.
Gaya bicara kreator:
${JSON.stringify(personaProfile, null, 2)}

Rancangan Konten:
${JSON.stringify(contentBrief, null, 2)}

Bentuk Eksekusi Visual: "${bentukKonten}"
${instruksiUGC}

ATURAN WAJIB:
1. Hindari semua kata kaku berikut: ${JSON.stringify(personaProfile?.linguistic_matrix?.forbidden_words || [])}.
2. Pisahkan setiap 1-2 kalimat dengan baris baru (\\n) agar nyaman dibaca.
3. Tambahkan petunjuk ekspresi/intonasi singkat di dalam kurung siku [...] seperti [Tertawa kecil], [Nada serius], [Menunjuk produk].
4. Susun dalam 4 kerangka copywriting yang kuat (Pembuka/Hook, Cerita & Masalah, Isi Utama & Solusi, Penutup/CTA).

Keluarkan HANYA valid JSON:
{
  "metadata": {
    "estimated_duration": "45-60 Detik",
    "framework_used": "${contentBrief?.selected_framework || "PAS_RELATABLE_BRIDGE"}",
    "is_ugc": ${isModeUGC}
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
      "labelMini": "Kerangka 2 • Cerita & Masalah Penonton",
      "voiceover": "...",
      "teksLayar": "...",
      "visual": "..."
    },
    {
      "idSegmen": "VALUE_SOLUTION",
      "labelMini": "Kerangka 3 • Bukti & Solusi Utama",
      "voiceover": "...",
      "teksLayar": "...",
      "visual": "..."
    },
    {
      "idSegmen": "CTA",
      "labelMini": "Kerangka 4 • Penutup & Ajakan Aksi",
      "voiceover": "...",
      "teksLayar": "...",
      "visual": "..."
    }
  ],
  "persona_alignment_notes": [
    "Penjelasan ramah kenapa alur dan kalimat ini kuat secara copywriting...",
    "Penjelasan ramah bagaimana gaya bahasa disesuaikan dengan karaktermu..."
  ]
}`
      partsPayload = [{ text: promptFinal }]
    }

    // =========================================================================
    // 5. EKSTRAK VIDEO AKURAT (ANTI-NGACO: WAJIB LAPOR ERROR JIKA TIDAK TERBACA)
    // =========================================================================
    else if (action === "rewrite_video") {
      promptFinal = `
Kamu adalah Mesin Transkripsi Video Presisi & Pakar Copywriting.

ATURAN KEAKURATAN MUTLAK (DILARANG KERAS MENGARANG / HALUSINASI):
1. Periksa file video/audio dan tangkapan layar video yang dilampirkan.
2. Salin **kata demi kata secara akurat** apa yang benar-benar diucapkan di audio video ATAU teks yang benar-benar tertulis di dalam gambar video ke dalam kolom "transkripAsliVideo".
3. JIKA video tidak memiliki suara ucapan yang terdengar jelas DAN tidak memiliki teks yang dapat dibaca di layar (atau file rusak/kosong), kamu **DILARANG KERAS MENEBAK ATAU MENGARANG CERITA SENDIRI**. Dalam kondisi tersebut, kamu WAJIB mengisi:
   - "unreadableError": true
   - "errorReason": "Penjelasan jujur kenapa video tidak bisa dibaca (misal: Video hanya berisi musik tanpa suara bicara dan tidak ada teks yang terbaca di layar)."
4. HANYA JIKA teks/suara asli di video berhasil terbaca dengan jelas ("unreadableError": false), buatkan rekomendasi Copywriting baru yang 100% orisinil sesuai gaya bicara pengguna:
${JSON.stringify(personaProfile, null, 2)}
   Catatan tambahan pengguna: "${detailInput || "-"}"
   Pecah rekomendasi copywriting baru tersebut ke dalam **4 kerangka terpisah** pada array "segmen".

Keluarkan HANYA valid JSON:
{
  "unreadableError": false,
  "errorReason": "",
  "transkripAsliVideo": "Teks asli kata demi kata dari dalam video...",
  "intiPesanVideo": "1 kalimat topik video...",
  "segmen": [
    {
      "idSegmen": "HOOK",
      "labelMini": "Kerangka 1 • Pembuka (Hook)",
      "voiceover": "...",
      "teksLayar": "...",
      "visual": "..."
    },
    {
      "idSegmen": "BODY_STORY",
      "labelMini": "Kerangka 2 • Cerita & Masalah",
      "voiceover": "...",
      "teksLayar": "...",
      "visual": "..."
    },
    {
      "idSegmen": "VALUE_SOLUTION",
      "labelMini": "Kerangka 3 • Isi Utama & Solusi",
      "voiceover": "...",
      "teksLayar": "...",
      "visual": "..."
    },
    {
      "idSegmen": "CTA",
      "labelMini": "Kerangka 4 • Penutup & Ajakan",
      "voiceover": "...",
      "teksLayar": "...",
      "visual": "..."
    }
  ]
}`

      partsPayload = []
      if (mediaBase64 && mediaMimeType) {
        partsPayload.push({
          inlineData: { mimeType: mediaMimeType, data: mediaBase64 },
        })
      }
      if (Array.isArray(framesBase64) && framesBase64.length > 0) {
        framesBase64.slice(0, 4).forEach((f) => {
          if (f) {
            partsPayload.push({
              inlineData: { mimeType: "image/jpeg", data: f },
            })
          }
        })
      }
      partsPayload.push({ text: promptFinal })
    }

    // =========================================================================
    // 6. REGENERATE 1 KERANGKA SPESIFIK (HANYA MENGUBAH KERANGKA YANG DIKLIK!)
    // =========================================================================
    else if (action === "regenerate_satu_kerangka") {
      promptFinal = `
Kamu adalah Copywriter Profesional dengan gaya bicara berikut:
${JSON.stringify(personaProfile, null, 2)}

 Konteks Topik/Video: "${body.subyek || "Konten Video"}"
 Tugasmu HANYA menulis ulang **SATU kerangka spesifik ini saja** yaitu: **"${segmenTarget?.labelMini}"** agar menjadi variasi kalimat baru yang lebih kuat dan segar (jangan menulis kerangka lain!):
- Kalimat saat ini: "${segmenTarget?.voiceover}"
- Teks layar saat ini: "${segmenTarget?.teksLayar}"
- Visual saat ini: "${segmenTarget?.visual}"

Keluarkan HANYA valid JSON untuk 1 kerangka ini:
{
  "voiceover": "Kalimat baru khusus untuk ${segmenTarget?.labelMini}...",
  "teksLayar": "Teks layar baru khusus untuk ${segmenTarget?.labelMini}...",
  "visual": "Arahan visual baru yang mengikuti kalimat di atas..."
}`
      partsPayload = [{ text: promptFinal }]
    }

    // =========================================================================
    // 7. AKSI PENDUKUNG LAINNYA (DIFF ANALYZER, 10 IDE, UBAH BENTUK, EVALUASI)
    // =========================================================================
    else if (action === "analyze_script_diff") {
      promptFinal = `
Bandingkan draf awal dengan hasil editan pengguna untuk memperbarui kebiasaan gaya bicara mereka:
- Draf Awal: ${JSON.stringify(aiDraft)}
- Editan Pengguna: ${JSON.stringify(userEditedScript)}
- Profil Saat Ini: ${JSON.stringify(personaProfile)}

Keluarkan HANYA valid JSON:
{
  "learning_summary": [
    "Gaya pilihan katamu telah disimpan untuk pembuatan skrip berikutnya."
  ],
  "updated_persona_profile": ${JSON.stringify(personaProfile)}
}`
      partsPayload = [{ text: promptFinal }]
    } else if (action === "buat_10_ide_topik") {
      promptFinal = `
Buatkan 10 ide topik konten yang segar sesuai profil berikut:
${JSON.stringify(personaProfile)}
Balas HANYA dalam format JSON:
{
  "ideTopik": [
    { "judul": "...", "nuansa": "...", "ringkasan": "..." }
  ]
}`
      partsPayload = [{ text: promptFinal }]
    } else if (action === "ubah_bentuk_konten") {
      promptFinal = `
Adaptasikan ke-4 kerangka skrip berikut menjadi bentuk konten: "${bentukKontenBaru}".
Skrip saat ini: ${JSON.stringify(skripSebelumnya)}
Balas HANYA dalam format JSON:
{
  "segmen": [
    { "idSegmen": "HOOK", "labelMini": "Kerangka 1 • Pembuka", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "BODY_STORY", "labelMini": "Kerangka 2 • Cerita & Masalah", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "VALUE_SOLUTION", "labelMini": "Kerangka 3 • Isi & Solusi", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "CTA", "labelMini": "Kerangka 4 • Penutup", "voiceover": "...", "teksLayar": "...", "visual": "..." }
  ]
}`
      partsPayload = [{ text: promptFinal }]
    } else if (action === "evaluasi_kinerja_vt") {
      promptFinal = `
Berikan evaluasi singkat (2-3 kalimat membangun) untuk kinerja konten mingguan berikut:
${JSON.stringify(dataKinerja)}
Balas HANYA dalam format JSON:
{ "evaluasiAI": "..." }`
      partsPayload = [{ text: promptFinal }]
    }

    const hasilParsed = await panggilGeminiAI(apiKey, partsPayload)

    // Jika pada Ekstrak Video AI menyatakan video tidak terbaca (unreadableError: true),
    // catat ke Admin & kembalikan koin user secara diam-diam di belakang layar!
    if (action === "rewrite_video" && hasilParsed?.unreadableError) {
      const koinGanti = await catatErrorDanGantiKoinDiamDiam({
        userId,
        namaUser,
        fitur: `Ekstrak Video (${namaFileVideo || "File"})`,
        pesanError:
          hasilParsed.errorReason ||
          "Audio/teks di dalam video tidak terbaca dengan jelas",
        koinKompensasi: 2, // Kembalikan 2 koin ekstrak video secara diam-diam
      })

      return NextResponse.json(
        {
          error:
            "ERROR: Sistem AI tidak dapat membaca suara atau teks di dalam video ini karena audio kurang jelas atau video hanya berisi musik latar tanpa teks.",
          silentCoinUpdated: koinGanti,
        },
        { status: 422 },
      )
    }

    return NextResponse.json(hasilParsed)
  } catch (err) {
    // Setiap kali terjadi error/gagal generate, laporkan ke tabel Admin & ganti koin diam-diam
    const koinKompensasi = body?.action === "rewrite_video" ? 2 : 1
    const koinGanti = await catatErrorDanGantiKoinDiamDiam({
      userId: body?.userId,
      namaUser: body?.namaUser,
      fitur: body?.action || "Fitur AI",
      pesanError: err.message,
      koinKompensasi,
    })

    return NextResponse.json(
      {
        error:
          "ERROR: Sistem AI gagal memproses permintaan ini (" +
          (err.message || "Koneksi terputus") +
          "). Silakan coba kembali.",
        silentCoinUpdated: koinGanti,
      },
      { status: 500 },
    )
  }
}
