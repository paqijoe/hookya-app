import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

let CACHED_FAST_MODEL = null

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

  if (!teksMentah) {
    throw new Error(
      "Respons AI kosong, silakan klik ikon putar untuk memuat ulang.",
    )
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
    const sanitasi = bersih
      .replace(/[\u0000-\u0019]+/g, " ")
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
    return JSON.parse(sanitasi)
  }
}

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
    // Abaikan jika gagal log
  }
  return koinTerbaru
}

// Akselerasi panggilan AI: Mematikan jeda thinking internal pada model 2.5 agar 3x lebih cepat tanpa menurunkan kualitas
async function panggilGeminiCepat(apiKey, partsPayload) {
  const daftarKandidat = [
    ...(CACHED_FAST_MODEL ? [CACHED_FAST_MODEL] : []),
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest",
  ]
  const modelUnik = [...new Set(daftarKandidat)]

  let errorTerakhir = ""
  for (const model of modelUnik) {
    try {
      const genConfig = {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
      // Matikan jeda berpikir internal khusus pada model 2.5 agar langsung menghasilkan teks dengan cepat
      if (model.includes("2.5")) {
        genConfig.thinkingConfig = { thinkingBudget: 0 }
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: partsPayload }],
            generationConfig: genConfig,
          }),
        },
      )

      const data = await response.json()
      if (response.ok && data?.candidates?.length > 0) {
        CACHED_FAST_MODEL = model
        return uraiJSONAman(data)
      } else {
        // Jika model menolak parameter thinkingConfig, coba sekali lagi tanpa thinkingConfig
        if (genConfig.thinkingConfig) {
          delete genConfig.thinkingConfig
          const retryRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: partsPayload }],
                generationConfig: genConfig,
              }),
            },
          )
          const retryData = await retryRes.json()
          if (retryRes.ok && retryData?.candidates?.length > 0) {
            CACHED_FAST_MODEL = model
            return uraiJSONAman(retryData)
          }
        }
        errorTerakhir = data?.error?.message || `Model ${model} sedang padat`
      }
    } catch (err) {
      errorTerakhir = err.message
    }
  }

  throw new Error(
    errorTerakhir ||
      "Sistem AI sedang padat, silakan klik ikon putar untuk mengulang.",
  )
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
      productImageBase64,
      productImageMime,
      specImageBase64,
      specImageMime,
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

    if (action === "analyze_marketplace_screenshots") {
      promptFinal = `
Kamu adalah Analis Produk Marketplace (Shopee / TikTok Shop / Tokopedia).
Perhatikan gambar screenshot produk dan spesifikasi yang dilampirkan.
Ekstrak informasi berikut secara akurat:
1. "namaProduk": Nama lengkap produk yang tertera di gambar.
2. "brand": Nama merek / brand / nama toko yang tertera di gambar.
3. "hargaPromo": Harga produk atau diskon yang terlihat di gambar.
4. "keunggulanSpesifikasi": Rangkuman detail spesifikasi, bahan, ukuran, atau keunggulan produk.
5. "masalahDipecahkan": Manfaat utama produk ini bagi pembeli.

Keluarkan HANYA valid JSON:
{
  "namaProduk": "...",
  "brand": "...",
  "hargaPromo": "...",
  "keunggulanSpesifikasi": "...",
  "masalahDipecahkan": "..."
}`

      partsPayload = []
      if (productImageBase64) {
        partsPayload.push({
          inlineData: {
            mimeType: productImageMime || "image/jpeg",
            data: productImageBase64,
          },
        })
      }
      if (specImageBase64) {
        partsPayload.push({
          inlineData: {
            mimeType: specImageMime || "image/jpeg",
            data: specImageBase64,
          },
        })
      }
      partsPayload.push({ text: promptFinal })
    } else if (action === "transkrip_suara_mic") {
      if (!audioBase64) {
        return NextResponse.json(
          { error: "Tidak ada rekaman suara yang diterima." },
          { status: 400 },
        )
      }
      promptFinal = `
Salin rekaman suara pengguna ini menjadi teks Bahasa Indonesia yang rapi.
Balas HANYA dalam format JSON:
{
  "teks": "..."
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
    } else if (action === "extract_persona_dna") {
      promptFinal = `
Analisis profil dan contoh gaya bicara pengguna berikut untuk menyusun matriks gaya bahasa internal yang sangat natural:
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
    } else if (action === "assessment_copilot") {
      const infoKonteks = stageInput?.detailPromosi
        ? `DETAIL PROMOSI (${stageInput.jenisPromosi}):\n${JSON.stringify(stageInput.detailPromosi)}`
        : `Topik Konten Kreator: "${stageInput?.rawTopic}"`

      const ringkasanPersona = {
        sapaan_diri: personaProfile?.linguistic_matrix?.self_pronoun || "Gue",
        sapaan_audiens:
          personaProfile?.linguistic_matrix?.audience_pronoun || "Lo",
        gaya: personaProfile?.persona_summary || "Santai & jujur",
        kata_khas:
          personaProfile?.linguistic_matrix?.signature_vocabulary || [],
      }

      if (stageNumber === 1) {
        promptFinal = `
Kamu adalah Asisten Produser Konten Pribadi dengan gaya bahasa kreator: ${JSON.stringify(ringkasanPersona)}
DATA KONTEN:
- Kategori: "${stageInput?.kategori}"
- ${infoKonteks}
- Durasi: "${stageInput?.targetPlatform}"

TUGAS TAHAP 1:
1. Rumuskan 1 gagasan utama yang tajam pada "refined_core_idea".
2. Berikan **3 Pilihan Sudut Pandang Bahasan** yang memikat penonton (1 Membongkar Mitos, 1 Masalah Nyata Penonton, 1 Solusi/Rahasia Praktis).

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "Sapaan hangat & pengantar memilih sudut pandang...",
  "refined_core_idea": "...",
  "angle_options": [
    { "id": "angle_1", "type": "Membongkar Mitos Umum", "angle_text": "..." },
    { "id": "angle_2", "type": "Masalah / Kesalahan Nyata", "angle_text": "..." },
    { "id": "angle_3", "type": "Solusi / Rahasia Praktis", "angle_text": "..." }
  ],
  "story_prompt_question": "Pertanyaan singkat untuk memancing cerita atau alasan kuat di balik konten ini..."
}`
      } else if (stageNumber === 2) {
        promptFinal = `
Kamu adalah Asisten Produser Konten Pribadi: ${JSON.stringify(ringkasanPersona)}
DATA TAHAP SEBELUMNYA:
- Inti Bahasan: "${stageInput?.coreIdea}"
- Sudut Pandang Terpilih: "${stageInput?.chosenAngle}"
- Cerita: "${stageInput?.userStory || "(Belum diisi)"}"

TUGAS TAHAP 2:
1. Buat **2 pilihan perumpamaan/skenario sehari-hari** ("relatable_analogies").
2. Berikan **3 Kartu Fakta/Referensi Pendukung** ("reference_cards").
3. Berikan **3 poin solusi atau keunggulan konkret** ("suggested_solutions").

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
Kamu adalah Asisten Produser Konten Pribadi: ${JSON.stringify(ringkasanPersona)}
DATA TAHAP 1 & 2:
- Inti Bahasan: "${stageInput?.coreIdea}"
- Sudut Pandang: "${stageInput?.chosenAngle}"
- Cerita/Perumpamaan: "${stageInput?.personalStory}"
- Fakta Pendukung: ${JSON.stringify(stageInput?.injectedReference)}
- Solusi/Keunggulan: ${JSON.stringify(stageInput?.actionableSolutions)}

TUGAS TAHAP 3:
1. Rekomendasikan 1 kerangka terbaik ("PAS_RELATABLE_BRIDGE", "HSO_STORY", "CONTRARIAN_MYTH_BUSTER", atau "BAB_TRANSFORMATION").
2. Buat **3 pilihan kalimat pembuka (Hook 3 detik pertama)** yang sangat kuat sesuai gaya bicara pengguna.
3. Buat **3 pilihan kalimat ajakan penutup (CTA)**.

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
    } else if (action === "assemble_humanized_script") {
      const isModeUGC =
        Boolean(ugcConfig?.aktif) ||
        (bentukKonten && bentukKonten.toLowerCase().includes("ugc"))

      const daftarPemeran = Array.isArray(ugcConfig?.namaPemeran)
        ? ugcConfig.namaPemeran.filter(Boolean).join(", ")
        : "Pemeran 1, Pemeran 2"

      const instruksiUGC = isModeUGC
        ? `
# INSTRUKSI KHUSUS KONTEN UGC (DIALOG PERCAKAPAN ${ugcConfig?.jumlahOrang || 2} ORANG):
- Tulis dalam bentuk **Teks Percakapan / Dialog Saling Bersahutan** antara **${ugcConfig?.jumlahOrang || 2} orang** dengan nama pemeran: **${daftarPemeran}**.
- Alur percakapan WAJIB mengikuti teori copywriting yang kuat sesuai kerangka "${contentBrief?.selected_framework}".`
        : `
# INSTRUKSI SKRIP MONOLOG NATURAL:
- Tulis dengan bahasa lisan yang mengalir alami sesuai sapaan "${personaProfile?.linguistic_matrix?.self_pronoun}" dan "${personaProfile?.linguistic_matrix?.audience_pronoun}".`

      promptFinal = `
Kamu adalah Penulis Skrip Video Pendek & Copywriter Profesional kelas dunia.
Gaya bicara kreator:
${JSON.stringify(personaProfile)}

Rancangan Konten:
${JSON.stringify(contentBrief)}

Bentuk Eksekusi Visual: "${bentukKonten}"
${instruksiUGC}

ATURAN WAJIB:
1. Hindari semua kata kaku berikut: ${JSON.stringify(personaProfile?.linguistic_matrix?.forbidden_words || [])}.
2. Pisahkan setiap 1-2 kalimat dengan baris baru (\\n) agar nyaman dibaca.
3. Tambahkan petunjuk ekspresi/intonasi singkat di dalam kurung siku [...] seperti [Senyum tipis], [Nada serius].
4. Susun dalam 4 kerangka copywriting yang menghantam (Pembuka/Hook, Cerita & Masalah, Bukti & Solusi Utama, Penutup/CTA).

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
    "Penjelasan ramah kenapa alur dan kalimat ini kuat secara copywriting..."
  ]
}`
      partsPayload = [{ text: promptFinal }]
    } else if (action === "rewrite_video") {
      promptFinal = `
Kamu adalah Mesin Transkripsi Video Presisi & Pakar Copywriting.

TUGAS UTAMA:
1. Dengarkan suara ucapan pada audio yang dilampirkan DAN baca seluruh teks/subtitle/visual yang tampak pada gambar potongan frame video yang dilampirkan.
2. Tuliskan **Teks Asli yang Ada di Dalam Video** secara akurat ke dalam kolom "transkripAsliVideo".
3. Jika tidak ada suara ucapan manusia sama sekali DAN tidak ada teks/informasi visual yang bisa dibaca di layar video, barulah isi "unreadableError": true.
4. Buat rekomendasi Copywriting baru yang 100% orisinil sesuai gaya bicara pengguna:
${JSON.stringify(personaProfile)}
   Catatan tambahan pengguna: "${detailInput || "-"}"
   Pecah rekomendasi copywriting baru tersebut ke dalam **4 kerangka terpisah** pada array "segmen".

Keluarkan HANYA valid JSON:
{
  "unreadableError": false,
  "errorReason": "",
  "transkripAsliVideo": "Teks asli kata demi kata dari ucapan suara atau teks layar di dalam video...",
  "intiPesanVideo": "1 kalimat topik utama video...",
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
        framesBase64.slice(0, 5).forEach((f) => {
          if (f) {
            partsPayload.push({
              inlineData: { mimeType: "image/jpeg", data: f },
            })
          }
        })
      }
      partsPayload.push({ text: promptFinal })
    } else if (action === "regenerate_satu_kerangka") {
      promptFinal = `
Kamu adalah Copywriter Profesional dengan gaya bicara berikut:
${JSON.stringify(personaProfile)}

Konteks Topik/Video: "${body.subyek || "Konten Video"}"
Tugasmu HANYA menulis ulang **SATU kerangka spesifik ini saja** yaitu: **"${segmenTarget?.labelMini}"** agar menjadi variasi kalimat baru yang lebih segar dan kuat:
- Kalimat saat ini: "${segmenTarget?.voiceover}"
- Teks layar saat ini: "${segmenTarget?.teksLayar}"
- Visual saat ini: "${segmenTarget?.visual}"

Keluarkan HANYA valid JSON untuk 1 kerangka ini:
{
  "voiceover": "...",
  "teksLayar": "...",
  "visual": "..."
}`
      partsPayload = [{ text: promptFinal }]
    } else if (action === "analyze_script_diff") {
      promptFinal = `
Bandingkan draf awal dengan hasil editan pengguna untuk memperbarui kebiasaan gaya bicara mereka:
- Draf Awal: ${JSON.stringify(aiDraft)}
- Editan Pengguna: ${JSON.stringify(userEditedScript)}
- Profil Saat Ini: ${JSON.stringify(personaProfile)}

Keluarkan HANYA valid JSON:
{
  "learning_summary": ["Gaya pilihan katamu telah disimpan."],
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

    const hasilParsed = await panggilGeminiCepat(apiKey, partsPayload)

    if (action === "rewrite_video" && hasilParsed?.unreadableError) {
      const koinGanti = await catatErrorDanGantiKoinDiamDiam({
        userId,
        namaUser,
        fitur: `Ekstrak Video (${namaFileVideo || "File"})`,
        pesanError:
          hasilParsed.errorReason ||
          "Video tidak memiliki suara bicara maupun teks layar",
        koinKompensasi: 2,
      })

      return NextResponse.json(
        {
          error:
            "ERROR: Video yang diunggah hanya berisi musik/visual tanpa ucapan suara maupun teks yang dapat dibaca.",
          silentCoinUpdated: koinGanti,
        },
        { status: 422 },
      )
    }

    return NextResponse.json(hasilParsed)
  } catch (err) {
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
          (err.message || "Kendala koneksi") +
          "). Silakan klik ikon putar untuk mencoba lagi.",
        silentCoinUpdated: koinGanti,
      },
      { status: 500 },
    )
  }
}
