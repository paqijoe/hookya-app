import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
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
    return JSON.parse(bersih)
  } catch {
    const sanitasi = bersih
      .replace(/[\u0000-\u0019]+/g, " ")
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
    return JSON.parse(sanitasi)
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
    // Abaikan jika gagal tulis log
  }
  return koinTerbaru
}

// ============================================================================
// MESIN 1: MULTIMODAL PINTAR (GAMBAR, VIDEO, & SUARA VIA OPENROUTER ATAU GEMINI)
// Memastikan fitur Suara & Video tetap jalan 100% memakai Saldo OpenRouter!
// ============================================================================
async function panggilMultimodalPintar({
  openRouterKey,
  geminiKey,
  promptText,
  imagesList = [], // array of { mimeType, data }
  audioItem = null, // { mimeType, data }
}) {
  let errorCatatan = ""

  // JALUR UTAMA: Gunakan Saldo OpenRouter (google/gemini-2.0-flash-001 mendukung Gambar, Frame Video & Audio!)
  if (openRouterKey && openRouterKey.trim() !== "") {
    try {
      const contentArray = [{ type: "text", text: promptText }]

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

  // JALUR CADANGAN: Gunakan Direct Gemini API Key jika ada
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
    partsPayload.push({ text: promptText })

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
// MESIN 2: TEKS & COPYWRITING (DEEPSEEK-V3 / GPT-4O MINI VIA OPENROUTER)
// ============================================================================
async function panggilTeksPintar(openRouterKey, geminiKey, promptText) {
  let errorCatatan = ""

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
                    "Kamu adalah Produser Konten & Copywriter Senior Indonesia yang berbicara sangat luwes, manusiawi, tajam, dan selalu membalas HANYA dalam format JSON yang valid.",
                },
                { role: "user", content: promptText },
              ],
              response_format: { type: "json_object" },
              temperature: 0.75,
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
      promptText,
    })
  }

  throw new Error(errorCatatan || "API Key AI belum aktif")
}

// Panduan panjang kata berdasarkan pilihan durasi pengguna
function getAturanPanjangDurasi(durasiStr = "60 Detik (1 Menit)") {
  const d = durasiStr.toLowerCase()
  if (d.includes("15")) {
    return {
      estimasi: "15 Detik (Sangat Padat & Cepat)",
      instruksi:
        "DURASI 15 DETIK (SUPER PADAT): Total seluruh naskah voiceover dari Kerangka 1 sampai 4 wajib sekitar 35–45 kata saja (masing-masing kerangka 1 kalimat pendek yang langsung menghantam inti).",
    }
  }
  if (d.includes("30")) {
    return {
      estimasi: "30 Detik (Ringkas & To-The-Point)",
      instruksi:
        "DURASI 30 DETIK: Total seluruh naskah voiceover wajib sekitar 70–90 kata (masing-masing kerangka terdiri dari 2 kalimat yang padat dan mengalir cepat).",
    }
  }
  if (d.includes("2 menit") || d.includes("120")) {
    return {
      estimasi: "2 Menit (Storytelling & Bedah Mendalam)",
      instruksi:
        "DURASI 2 MENIT (MENDALAM & PANJANG): DILARANG menulis terlalu pendek! Total seluruh naskah voiceover WAJIB sekitar 260–320 kata. Pada Kerangka 2 (Cerita/Masalah) dan Kerangka 3 (Solusi/Bukti), jabarkan secara mendalam menjadi 5–7 kalimat per kerangka lengkap dengan contoh nyata, analogi, dan detail langkah demi langkah.",
    }
  }
  if (d.includes("3 menit") || d.includes("180")) {
    return {
      estimasi: "3 Menit (Edukasi Lengkap & Komprehensif)",
      instruksi:
        "DURASI 3 MENIT (SANGAT MENDALAM & EKSTENSI PENUH): DILARANG KERAS menulis pendek! Total seluruh naskah voiceover WAJIB mencapai 380–450 kata. Jabarkan setiap kerangka (terutama Kerangka 2 dan Kerangka 3) menjadi 7–10 kalimat panjang yang mengupas tuntas latar belakang masalah, studi kasus/perumpamaan, rincian poin demi poin, serta argumen penutup yang sangat kuat.",
    }
  }
  return {
    estimasi: "60 Detik / 1 Menit (Standar Ideal)",
    instruksi:
      "DURASI 60 DETIK (1 MENIT IDEAL): Total seluruh naskah voiceover wajib sekitar 140–170 kata. Pastikan Kerangka 2 dan Kerangka 3 masing-masing memiliki 3–4 kalimat utuh yang mengalir enak dan tidak terkesan terburu-buru.",
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

    // =========================================================================
    // 1. TOMBOL "i" (SARAN REFERENSI AI BERDASARKAN AKUMULASI PROFILING)
    // =========================================================================
    if (action === "suggest_profiling_field") {
      const promptSaran = `
Kamu adalah Konsultan Personal Branding & Copywriting.
Pengguna sedang mengisi formulir Profiling 360° dirinya.
Berikut adalah AKUMULASI JAWABAN PENGGUNA DARI PERTANYAAN SEBELUMNYA:
${JSON.stringify(accumulatedProfile)}

Saat ini pengguna mengklik tombol bantuan "i" pada kolom:
- Nama Kolom: "${fieldLabel}" (Kode: "${fieldKey}")

TUGASMU:
Berdasarkan akumulasi data pengguna di atas (perannya, usianya, minatnya, sapaannya), berikan **4 rekomendasi isian yang sangat spesifik, realistis, dan siap pakai** untuk kolom "${fieldLabel}" tersebut agar pengguna tinggal mengklik salah satunya.

Keluarkan HANYA valid JSON:
{
  "insight_singkat": "1 kalimat alasan kenapa pilihan di bawah cocok dengan profilmu...",
  "pilihan_referensi": [
    "Pilihan spesifik 1...",
    "Pilihan spesifik 2...",
    "Pilihan spesifik 3...",
    "Pilihan spesifik 4..."
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
    // 2. SCAN SCREENSHOT PRODUK & SPESIFIKASI MARKETPLACE (MULTIMODAL)
    // =========================================================================
    if (action === "analyze_marketplace_screenshots") {
      const promptSS = `
Kamu adalah Analis Produk Marketplace (Shopee / TikTok Shop / Tokopedia).
Perhatikan gambar screenshot produk dan spesifikasi yang dilampirkan.
Ekstrak informasi berikut secara akurat:
1. "namaProduk": Nama lengkap produk yang tertera di gambar.
2. "brand": Nama merek / brand / nama toko yang tertera di gambar.
3. "hargaPromo": Harga produk atau diskon yang terlihat di gambar.
4. "keunggulanSpesifikasi": Rangkuman detail spesifikasi, bahan, ukuran, atau keunggulan produk.
5. "masalahDipecahkan": Masalah utama pembeli yang diselesaikan oleh produk ini.

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
    // 3. TRANSKRIP SUARA MIKROFON (MULTIMODAL VIA OPENROUTER / GEMINI)
    // =========================================================================
    if (action === "transkrip_suara_mic") {
      if (!audioBase64) {
        return NextResponse.json(
          { error: "Error sistem, silakan refresh atau hubungi admin." },
          { status: 400 },
        )
      }
      const promptAudio = `
Dengarkan rekaman suara ini dan salin persis ucapannya menjadi teks Bahasa Indonesia yang rapi.
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
    // 4. EKSTRAK VIDEO + BEDAH KOMPETITOR (MULTIMODAL VIA OPENROUTER / GEMINI)
    // =========================================================================
    if (action === "rewrite_video") {
      const promptVideo = `
Kamu adalah Mesin Transkripsi Video Presisi & Analis Konten Viral.
1. Dengarkan suara ucapan pada audio yang dilampirkan DAN baca seluruh teks/subtitle/visual yang tampak pada potongan gambar frame video.
2. Tuliskan **Teks Asli yang Ada di Dalam Video** ke dalam "transkripAsliVideo".
3. Jika benar-benar kosong tanpa suara dan tanpa visual yang bisa dibaca sama sekali, isi "unreadableError": true.
4. Bedah **Mengapa Video Ini Menarik** pada "bedahKompetitor" ("jenisHookAsli", "pemicuEmosi", "rahasiaRetensi").
5. Buat rekomendasi Copywriting baru yang 100% orisinil sesuai Positioning & Gaya Bicara pengguna:
${JSON.stringify(personaProfile)}
   Catatan tambahan: "${detailInput || "-"}"
   Pecah ke dalam 4 kerangka ("segmen": HOOK, BODY_STORY, VALUE_SOLUTION, CTA).

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
          pesanErrorAsli: "Video tidak memiliki suara/teks yang terbaca",
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
    // 5. PROFILING 360°
    // =========================================================================
    let promptFinal = ""

    if (action === "extract_persona_dna") {
      promptFinal = `
Analisis data Profiling 360° (Positioning, Unique Selling Point, Psikologi Target Audiens, dan Contoh Gaya Bicara) pengguna berikut untuk menyusun matriks identitas konten yang 100% personal:
- Data Onboarding Lengkap: ${JSON.stringify(onboardingAnswers)}
- Contoh Kalimat Asli Pengguna: "${rawWritingSamples || "Santai, jujur, langsung ke inti pembahasan."}"

Keluarkan HANYA valid JSON:
{
  "user_id": "${onboardingAnswers?.user_id || "usr_99281"}",
  "persona_summary": "Ringkasan tajam tentang Positioning, USP, dan gaya bicara khas pengguna...",
  "positioning_and_usp": {
    "authority_role": "${onboardingAnswers?.peran_dan_otoritas || "Praktisi & Teman Diskusi"}",
    "unique_selling_point": "${onboardingAnswers?.usp_diri || "Berbagi praktik nyata tanpa teori rumit"}",
    "common_enemy": "${onboardingAnswers?.pandangan_kontra || "Basa-basi motivasi kosong tanpa langkah nyata"}",
    "personal_analogies": "${onboardingAnswers?.analogi_khas || "Kehidupan sehari-hari, kerjaan, dan hobi"}"
  },
  "target_audience": {
    "segment_profile": "${onboardingAnswers?.target_segmen || "Anak muda & pekerja produktif"}",
    "deepest_pain_points": "${onboardingAnswers?.target_ketakutan || "Takut jalan di tempat & boncos uang/waktu"}",
    "secret_desires": "${onboardingAnswers?.target_impian || "Hasil nyata yang praktis dan terukur"}",
    "common_objections": "${onboardingAnswers?.target_keraguan || "Merasa sibuk, bingung mulai dari mana, atau takut gagal"}"
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
    "sentence_length": "Pendek, lisan, maksimal 12-14 kata per kalimat",
    "pacing": "Cepat di awal, mengalir di tengah, tegas di akhir"
  }
}`
    }

    // =========================================================================
    // 6. INTERACTIVE PRODUCER CHAT (MENDUKUNG REGENERATE BATCH 1, 2, 3 BERBEDA)
    // =========================================================================
    else if (action === "assessment_copilot") {
      const infoKonteks = stageInput?.detailPromosi
        ? `DETAIL PROMOSI (${stageInput.jenisPromosi}):\n${JSON.stringify(stageInput.detailPromosi)}`
        : `Topik Konten Kreator: "${stageInput?.rawTopic}"`

      const catatanHindariDuplikat =
        opsiSebelumnya && opsiSebelumnya.length > 0
          ? `\nCATATAN PENTING (BATCH KE-${batchKe || 2}): Pengguna meminta alternatif pilihan baru! DILARANG mengulang kalimat pilihan sebelumnya berikut ini, berikan sudut pandang/kalimat yang 100% BERBEDA dan lebih segar: ${JSON.stringify(opsiSebelumnya)}`
          : ""

      if (stageNumber === 1) {
        promptFinal = `
Kamu adalah Produser Konten Pribadi yang sedang mengobrol akrab 1-on-1 dengan kreator "${namaUser || "Sobat"}".
Data Positioning, USP, Gaya Bahasa & Target Audiens kreator:
${JSON.stringify(personaProfile)}

DATA KONTEN:
- Kategori: "${stageInput?.kategori}"
- ${infoKonteks}
- Durasi Target: "${stageInput?.targetPlatform}"
${catatanHindariDuplikat}

TUGAS TAHAP 1:
1. Pada "co_pilot_message", balas layaknya produser manusia yang antusias mengomentari ide topik tersebut dan mengaitkannya dengan Positioning/USP kreator serta rasa sakit target audiensnya.
2. Rumuskan 1 gagasan inti pada "refined_core_idea".
3. Berikan **3 Pilihan Sudut Pandang (Angle)** yang tajam dan berbeda.
4. Pada "story_prompt_question", ajukan 1 pertanyaan obrolan santai.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "refined_core_idea": "...",
  "angle_options": [
    { "id": "angle_1", "type": "Contrarian / Bongkar Mitos", "angle_text": "..." },
    { "id": "angle_2", "type": "Pain-Point Target Audiens", "angle_text": "..." },
    { "id": "angle_3", "type": "USP & Solusi Praktis", "angle_text": "..." }
  ],
  "story_prompt_question": "..."
}`
      } else if (stageNumber === 2) {
        promptFinal = `
Kamu adalah Produser Konten Pribadi untuk "${namaUser || "Sobat"}":
${JSON.stringify(personaProfile)}

DATA TAHAP 1:
- Inti Bahasan: "${stageInput?.coreIdea}"
- Sudut Pandang Terpilih: "${stageInput?.chosenAngle}"
- Balasan Cerita Kreator: "${stageInput?.userStory || "(Minta dicarikan perumpamaan yang relate)"}"
${catatanHindariDuplikat}

TUGAS TAHAP 2:
1. Tanggapi pilihan kreator dengan akrab di "co_pilot_message".
2. Buat **2 pilihan perumpamaan/analogi sehari-hari** ("relatable_analogies").
3. Berikan **3 Kartu Fakta/Bukti Pendukung** ("reference_cards").
4. Berikan **3 poin solusi atau keunggulan unik (USP)** ("suggested_solutions").

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "relatable_analogies": ["Analogi 1...", "Analogi 2..."],
  "reference_cards": [
    { "type": "Psikologi Target Audiens", "title": "...", "summary": "..." },
    { "type": "Bukti & Logika Lapangan", "title": "...", "summary": "..." },
    { "type": "Fenomena Sehari-hari", "title": "...", "summary": "..." }
  ],
  "suggested_solutions": ["Solusi/USP 1...", "Solusi/USP 2...", "Solusi/USP 3..."]
}`
      } else if (stageNumber === 3) {
        promptFinal = `
Kamu adalah Pakar Copywriting & Produser Konten Pribadi untuk "${namaUser || "Sobat"}":
${JSON.stringify(personaProfile)}

DATA TAHAP 1 & 2:
- Inti Bahasan: "${stageInput?.coreIdea}"
- Sudut Pandang: "${stageInput?.chosenAngle}"
- Cerita/Analogi: "${stageInput?.personalStory}"
- Bukti Pendukung: ${JSON.stringify(stageInput?.injectedReference)}
- Solusi/USP: ${JSON.stringify(stageInput?.actionableSolutions)}
${catatanHindariDuplikat}

TUGAS TAHAP 3 (6 Jenis Hook Psikologis Copywriting & 3 Jenis CTA):
1. Sampaikan saran pengunci 3 detik pertama di "co_pilot_message".
2. Rekomendasikan 1 kerangka copywriting terbaik ("PAS_RELATABLE_BRIDGE", "HSO_STORY", "CONTRARIAN_MYTH_BUSTER", atau "BAB_TRANSFORMATION").
3. WAJIB buatkan **6 Pilihan Kalimat Pembuka (Hook 3 Detik Pertama)** pada "hook_options" (Negative Hook, Positive Hook, Proof Hook, Contrarian Hook, Relatable POV Hook, Curiosity Gap Hook).
4. WAJIB buatkan **3 Pilihan Kalimat Penutup (CTA)** pada "cta_options" (Engagement Bait, Save & Share, Conversion).

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "...",
  "recommended_framework": "PAS_RELATABLE_BRIDGE",
  "framework_reason": "...",
  "hook_options": [
    { "category": "Negative / Warning Hook", "why_it_works": "Memicu rasa takut rugi di 3 detik awal", "text": "..." },
    { "category": "Positive / Dream Outcome Hook", "why_it_works": "Menawarkan hasil impian yang spesifik", "text": "..." },
    { "category": "Proof / Result-First Hook", "why_it_works": "Membuka dengan bukti nyata sehingga langsung dipercaya", "text": "..." },
    { "category": "Contrarian / Myth-Buster Hook", "why_it_works": "Mematahkan keyakinan umum penonton", "text": "..." },
    { "category": "Relatable / POV Hook", "why_it_works": "Membuat target audiens merasa sangat dipahami", "text": "..." },
    { "category": "Curiosity Gap / Secret Hook", "why_it_works": "Membuka rasa penasaran yang mengunci retensi", "text": "..." }
  ],
  "cta_options": [
    { "category": "Engagement Bait (Pancing Komentar)", "text": "..." },
    { "category": "Save & Share (Pancing Simpan/Bagikan)", "text": "..." },
    { "category": "Conversion (Arahkan Beli / Cek Profil)", "text": "..." }
  ]
}`
      }
    }

    // =========================================================================
    // 7. PENYUSUN SKRIP UTAMA DENGAN PENGATUR DURASI (15 DETIK S/D 3 MENIT)
    // =========================================================================
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
        ? `\n# INSTRUKSI KHUSUS KONTEN UGC (DIALOG PERCAKAPAN ${ugcConfig?.jumlahOrang || 2} ORANG: ${daftarPemeran}): Tulis dalam bentuk dialog saling bersahutan yang sangat natural.`
        : `\n# INSTRUKSI SKRIP MONOLOG 100% PERSONAL: Tulis dengan bahasa lisan yang mengalir alami sesuai sapaan "${personaProfile?.linguistic_matrix?.self_pronoun}" dan "${personaProfile?.linguistic_matrix?.audience_pronoun}".`

      promptFinal = `
Kamu adalah Copywriter Video Pendek & Produser Eksekutif Kelas Dunia.
Profil 360° Kreator (Positioning, USP, Target Audiens & Gaya Bahasa):
${JSON.stringify(personaProfile)}

Rancangan Konten Terkunci:
${JSON.stringify(contentBrief)}

Bentuk Eksekusi Visual: "${bentukKonten}"
${instruksiUGC}

# ATURAN PANJANG & KEDALAMAN NASKAH SESUAI DURASI PILIHAN USER:
${aturanDurasi.instruksi}

ATURAN WAJIB COPYWRITING:
1. Hindari semua kata kaku berikut: ${JSON.stringify(personaProfile?.linguistic_matrix?.forbidden_words || [])}.
2. Pisahkan setiap 1-2 kalimat dengan baris baru (\\n) agar nyaman dibaca.
3. Tambahkan petunjuk ekspresi/intonasi di dalam kurung siku [...] seperti [Tatapan serius], [Senyum tipis].
4. Susun dalam 4 kerangka copywriting yang mengunci retensi (HOOK, BODY_STORY, VALUE_SOLUTION, CTA) dengan panjang kalimat yang WAJIB mematuhi aturan durasi di atas!
5. Berikan Evaluasi Skor Skrip ("script_score") & Paket Siap Upload ("upload_pack": cover_title, caption_seo, pinned_comment).

Keluarkan HANYA valid JSON:
{
  "metadata": {
    "estimated_duration": "${aturanDurasi.estimasi}",
    "framework_used": "${contentBrief?.selected_framework || "PAS_RELATABLE_BRIDGE"}",
    "is_ugc": ${isModeUGC}
  },
  "script_score": {
    "total_score": 93,
    "hook_strength": "...",
    "retention_bridge": "...",
    "producer_tip": "..."
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
      "labelMini": "Kerangka 2 • Cerita, Agitasi Masalah & Penahan Scroll",
      "voiceover": "...",
      "teksLayar": "...",
      "visual": "..."
    },
    {
      "idSegmen": "VALUE_SOLUTION",
      "labelMini": "Kerangka 3 • Bukti, USP & Solusi Utama",
      "voiceover": "...",
      "teksLayar": "...",
      "visual": "..."
    },
    {
      "idSegmen": "CTA",
      "labelMini": "Kerangka 4 • Penutup & Ajakan Aksi (CTA)",
      "voiceover": "...",
      "teksLayar": "...",
      "visual": "..."
    }
  ]
}`
    }

    // =========================================================================
    // 8. UBAH DURASI SKRIP (PADATKAN ATAU PERLUAS: 15s, 30s, 60s, 2m, 3m)
    // =========================================================================
    else if (action === "ubah_durasi_skrip") {
      const aturanDurasi = getAturanPanjangDurasi(durasiTargetBaru)
      promptFinal = `
Kamu adalah Editor Copywriting Senior.
Profil gaya bicara kreator:
${JSON.stringify(personaProfile)}

Topik Skrip: "${body.subyek || "Konten Video"}"
Skrip Saat Ini:
${JSON.stringify(skripSebelumnya)}

TUGASMU:
Tulis ulang dan sesuaikan panjang/kedalaman ke-4 kerangka skrip di atas agar pas dengan target durasi baru: **"${durasiTargetBaru}"**.
${aturanDurasi.instruksi}

Keluarkan HANYA valid JSON:
{
  "estimated_duration": "${aturanDurasi.estimasi}",
  "segmen": [
    { "idSegmen": "HOOK", "labelMini": "Kerangka 1 • Pembuka (Hook)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "BODY_STORY", "labelMini": "Kerangka 2 • Cerita & Masalah", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "VALUE_SOLUTION", "labelMini": "Kerangka 3 • Bukti & Solusi Utama", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "CTA", "labelMini": "Kerangka 4 • Penutup & Ajakan (CTA)", "voiceover": "...", "teksLayar": "...", "visual": "..." }
  ]
}`
    }

    // =========================================================================
    // 9. GENERATOR STOK KONTEN MASSAL (2X, 5X, ATAU 10X VARIASI SKRIP SEKALIGUS)
    // =========================================================================
    else if (action === "multiply_script_variations") {
      const jml = Math.min(10, Math.max(2, parseInt(jumlahMultiplier) || 2))
      promptFinal = `
Kamu adalah Produser Konten Massal & Pakar Copywriting.
Profil gaya bicara kreator:
${JSON.stringify(personaProfile)}

Topik Induk: "${body.subyek || "Konten Kreator"}"
Skrip Induk Saat Ini:
${JSON.stringify(skripSebelumnya)}

TUGAS UTAMA:
Gandakan skrip induk di atas menjadi **${jml} Naskah Skrip Konten Baru yang Berbeda Sudut Pandang & Berbeda Jenis Hook-nya** (agar pengguna punya ${jml} stok video siap rekam untuk topik/produk ini tanpa terlihat mengulang konten yang sama).
Setiap variasi wajib memiliki:
- "judulVariasi": Judul sudut pandang unik + jenis Hook yang dipakai.
- "segmen": 4 kerangka lengkap (HOOK, BODY_STORY, VALUE_SOLUTION, CTA) dengan bahasa lisan khas kreator.

Keluarkan HANYA valid JSON:
{
  "daftarVariasi": [
    {
      "judulVariasi": "Variasi #1: [Sudut Pandang Unik / Jenis Hook]",
      "segmen": [
        { "idSegmen": "HOOK", "labelMini": "Kerangka 1 • Pembuka (Hook)", "voiceover": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "BODY_STORY", "labelMini": "Kerangka 2 • Cerita & Masalah", "voiceover": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "VALUE_SOLUTION", "labelMini": "Kerangka 3 • Bukti & Solusi", "voiceover": "...", "teksLayar": "...", "visual": "..." },
        { "idSegmen": "CTA", "labelMini": "Kerangka 4 • Penutup (CTA)", "voiceover": "...", "teksLayar": "...", "visual": "..." }
      ]
    }
  ]
}`
    } else if (action === "regenerate_satu_kerangka") {
      promptFinal = `
Kamu adalah Copywriter Profesional dengan profil kreator berikut:
${JSON.stringify(personaProfile)}

Konteks Topik: "${body.subyek || "Konten Video"}"
Tulis ulang **SATU kerangka spesifik ini saja** ("${segmenTarget?.labelMini}") agar menjadi variasi kalimat baru yang lebih segar dan menghantam:
- Kalimat saat ini: "${segmenTarget?.voiceover}"
- Teks layar saat ini: "${segmenTarget?.teksLayar}"
- Visual saat ini: "${segmenTarget?.visual}"

Keluarkan HANYA valid JSON:
{
  "voiceover": "...",
  "teksLayar": "...",
  "visual": "..."
}`
    } else if (action === "analyze_script_diff") {
      promptFinal = `
Bandingkan draf awal dengan hasil editan pengguna:
- Draf Awal: ${JSON.stringify(aiDraft)}
- Editan Pengguna: ${JSON.stringify(userEditedScript)}
- Profil Saat Ini: ${JSON.stringify(personaProfile)}

Keluarkan HANYA valid JSON:
{
  "learning_summary": ["Gaya pilihan katamu telah disimpan."],
  "updated_persona_profile": ${JSON.stringify(personaProfile)}
}`
    } else if (action === "buat_10_ide_topik") {
      promptFinal = `
Buatkan 10 ide topik konten yang sangat relevan dengan Positioning, USP, dan Target Audiens dari kreator berikut:
${JSON.stringify(personaProfile)}
Balas HANYA dalam format JSON:
{
  "ideTopik": [
    { "judul": "...", "nuansa": "...", "ringkasan": "..." }
  ]
}`
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
    } else if (action === "evaluasi_kinerja_vt") {
      promptFinal = `
Berikan evaluasi singkat (2-3 kalimat membangun) untuk kinerja konten mingguan berikut:
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
    // Catat detail error teknis sebenarnya ke Dashboard Admin & kembalikan koin diam-diam
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

    // JANGAN tampilkan pesan error limit/AI ke user agar citra aplikasi tetap terjaga!
    return NextResponse.json(
      {
        error: "Error sistem, silakan refresh atau hubungi admin.",
        silentCoinUpdated: koinGanti,
      },
      { status: 500 },
    )
  }
}
