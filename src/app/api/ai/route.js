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

// ============================================================================
// JALUR 1: GOOGLE GEMINI 2.5 / 2.0 (MEMBLOKIR MODEL 3.8 AGAR BEBAS LIMIT 20X)
// Digunakan untuk Multimodal (Video/Audio/Screenshot) & Fallback Teks jika OpenRouter belum diisi
// ============================================================================
async function panggilGeminiAman(apiKey, partsPayload, isLightTask = false) {
  const urutanModel = isLightTask
    ? [
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
      ]
    : ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"]

  let errorTerakhir = ""
  for (const model of urutanModel) {
    try {
      const genConfig = {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
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
        const parts = data.candidates[0]?.content?.parts || []
        let teksMentah = ""
        for (let i = parts.length - 1; i >= 0; i--) {
          if (parts[i]?.text && !parts[i]?.thought) {
            teksMentah = parts[i].text
            break
          }
        }
        return uraiJSONAman(teksMentah || parts[0]?.text)
      } else {
        errorTerakhir = data?.error?.message || `Kendala pada ${model}`
      }
    } catch (err) {
      errorTerakhir = err.message
    }
  }

  throw new Error(errorTerakhir || "Server AI sedang padat, silakan coba lagi.")
}

// ============================================================================
// JALUR 2: OPENROUTER (DEEPSEEK-V3 & GPT-4O MINI) — HPP ~Rp18 / SKRIP & BAHASA LUWES
// ============================================================================
async function panggilOpenRouterAtauFallback(
  openRouterKey,
  geminiKey,
  promptText,
  isLightTask = false,
) {
  if (openRouterKey && openRouterKey.trim() !== "") {
    const modelUrutan = ["deepseek/deepseek-chat", "openai/gpt-4o-mini"]
    for (const model of modelUrutan) {
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
                    "Kamu adalah Produser Konten & Copywriter Senior Indonesia yang berbicara sangat luwes, manusiawi, dan selalu membalas HANYA dalam format JSON yang valid.",
                },
                { role: "user", content: promptText },
              ],
              response_format: { type: "json_object" },
              temperature: 0.72,
            }),
          },
        )

        const data = await response.json()
        if (response.ok && data?.choices?.[0]?.message?.content) {
          return uraiJSONAman(data.choices[0].message.content)
        }
      } catch {
        // Lanjut ke model berikutnya
      }
    }
  }

  // Fallback otomatis ke Gemini 2.5 Flash/Lite jika OpenRouter belum dipasang
  if (!geminiKey) {
    throw new Error("API Key belum terpasang di server Vercel.")
  }
  return panggilGeminiAman(geminiKey, [{ text: promptText }], isLightTask)
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

    const geminiKey = process.env.GEMINI_API_KEY
    const openRouterKey = process.env.OPENROUTER_API_KEY

    let promptFinal = ""
    let partsPayload = []
    let isMultimodalTask = false
    let isLightTask = false

    // =========================================================================
    // 1. SCAN SCREENSHOT PRODUK & SPESIFIKASI MARKETPLACE (MULTIMODAL)
    // =========================================================================
    if (action === "analyze_marketplace_screenshots") {
      isMultimodalTask = true
      promptFinal = `
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
    }

    // =========================================================================
    // 2. TRANSKRIP SUARA MIKROFON (MULTIMODAL)
    // =========================================================================
    else if (action === "transkrip_suara_mic") {
      isMultimodalTask = true
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
    }

    // =========================================================================
    // 3. EKSTRAK VIDEO + BEDAH RUMUS VIRAL KOMPETITOR (MULTIMODAL)
    // =========================================================================
    else if (action === "rewrite_video") {
      isMultimodalTask = true
      promptFinal = `
Kamu adalah Mesin Transkripsi Video Presisi & Analis Konten Viral.

TUGAS UTAMA:
1. Dengarkan suara ucapan pada audio yang dilampirkan DAN baca seluruh teks/subtitle/visual yang tampak pada gambar potongan frame video yang dilampirkan.
2. Tuliskan **Teks Asli yang Ada di Dalam Video** secara akurat ke dalam kolom "transkripAsliVideo".
3. Jika tidak ada suara ucapan manusia sama sekali DAN tidak ada teks/informasi visual yang bisa dibaca di layar video, barulah isi "unreadableError": true.
4. Bedah **Mengapa Video Kompetitor Ini Menarik/Viral** pada objek "bedahKompetitor":
   - "jenisHookAsli": Jenis hook yang dipakai video tersebut (misal: Negative Hook / Proof Hook / POV Relatable).
   - "pemicuEmosi": Emosi penonton yang disentuh (misal: Rasa takut rugi, penasaran, atau merasa terwakili).
   - "rahasiaRetensi": Alasan penonton bertahan menonton video ini.
5. Buat rekomendasi Copywriting baru yang 100% orisinil sesuai Positioning, USP & Gaya Bicara pengguna:
${JSON.stringify(personaProfile)}
   Catatan tambahan pengguna: "${detailInput || "-"}"
   Pecah rekomendasi copywriting baru tersebut ke dalam **4 kerangka terpisah** pada array "segmen".

Keluarkan HANYA valid JSON:
{
  "unreadableError": false,
  "errorReason": "",
  "transkripAsliVideo": "Teks asli kata demi kata dari ucapan suara atau teks layar di dalam video...",
  "intiPesanVideo": "1 kalimat topik utama video...",
  "bedahKompetitor": {
    "jenisHookAsli": "...",
    "pemicuEmosi": "...",
    "rahasiaRetensi": "..."
  },
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
    }

    // =========================================================================
    // 4. PROFILING 360°: POSITIONING, USP, & PSIKOLOGI TARGET AUDIENS
    // =========================================================================
    else if (action === "extract_persona_dna") {
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
    // 5. INTERACTIVE PRODUCER CHAT (ASESMEN 3 TAHAP + 6 TEORI HOOK + 3 CTA)
    // =========================================================================
    else if (action === "assessment_copilot") {
      isLightTask = true
      const infoKonteks = stageInput?.detailPromosi
        ? `DETAIL PROMOSI (${stageInput.jenisPromosi}):\n${JSON.stringify(stageInput.detailPromosi)}`
        : `Topik Konten Kreator: "${stageInput?.rawTopic}"`

      if (stageNumber === 1) {
        promptFinal = `
Kamu adalah Produser Konten Pribadi yang sedang mengobrol akrab 1-on-1 (seperti chat WhatsApp) dengan kreator bernama "${namaUser || "Sobat"}".
Data Positioning, USP, Gaya Bahasa & Target Audiens kreator:
${JSON.stringify(personaProfile)}

DATA KONTEN YANG INGIN DIBUAT:
- Kategori: "${stageInput?.kategori}"
- ${infoKonteks}
- Durasi: "${stageInput?.targetPlatform}"
- Catatan Diskusi Tambahan dari Kreator: "${stageInput?.chatReplyUser || "-"}"

TUGAS TAHAP 1 (Respon Obrolan Manusiawi & Penajaman Positioning Angle):
1. Pada "co_pilot_message", balas layaknya manusia/produser yang antusias mengomentari ide topik tersebut, kaitkan dengan Positioning/USP kreator dan rasa sakit (*pain point*) target audiensnya menggunakan sapaan akrab ("${personaProfile?.linguistic_matrix?.self_pronoun}" / "${personaProfile?.linguistic_matrix?.audience_pronoun}").
2. Rumuskan 1 gagasan inti pada "refined_core_idea".
3. Berikan **3 Pilihan Sudut Pandang (Angle)** yang tajam:
   - Angle 1: **Contrarian / Bongkar Mitos** (Melawan kesalahpahaman umum audiens)
   - Angle 2: **Pain-Point / Masalah Spesifik** (Menyentuh ketakutan/masalah terdalam target audiens)
   - Angle 3: **USP / Rahasia Praktis** (Menonjolkan keunikan solusi/pengalaman kreator)
4. Pada "story_prompt_question", ajukan 1 pertanyaan obrolan santai untuk memancing cerita pengalaman pribadi atau pendapat jujur kreator.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "Obrolan hangat produser yang mengomentari topik & mengaitkannya dengan audiens...",
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
Kamu adalah Produser Konten Pribadi yang sedang ngobrol akrab dengan "${namaUser || "Sobat"}":
${JSON.stringify(personaProfile)}

DATA TAHAP 1:
- Inti Bahasan: "${stageInput?.coreIdea}"
- Sudut Pandang Terpilih: "${stageInput?.chosenAngle}"
- Balasan Cerita / Obrolan Kreator: "${stageInput?.userStory || "(Kreator minta dicarikan perumpamaan yang relate)"}"

TUGAS TAHAP 2 (Jembatan Relate, Fakta Psikologi & Solusi):
1. Pada "co_pilot_message", tanggapi cerita/pilihan sudut pandang kreator dengan hangat seperti teman diskusi, lalu jelaskan singkat kenapa kita perlu menyelipkan perumpamaan & bukti agar penonton tidak scroll.
2. Buat **2 pilihan perumpamaan/analogi sehari-hari** ("relatable_analogies") yang sangat nyambung dengan kebiasaan target audiens kreator.
3. Berikan **3 Kartu Fakta/Bukti Pendukung** ("reference_cards": 1 Psikologi Audiens, 1 Bukti Lapangan/Angka Logis, 1 Fenomena Nyata).
4. Berikan **3 poin solusi atau keunggulan unik (USP)** ("suggested_solutions") yang menjawab keraguan penonton.

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

TUGAS TAHAP 3 (6 Jenis Hook Psikologis Copywriting & 3 Jenis CTA):
1. Pada "co_pilot_message", sampaikan secara akrab strategi mengunci penonton di 3 detik pertama.
2. Rekomendasikan 1 kerangka copywriting terbaik ("PAS_RELATABLE_BRIDGE", "HSO_STORY", "CONTRARIAN_MYTH_BUSTER", atau "BAB_TRANSFORMATION") beserta alasan singkatnya di "framework_reason".
3. WAJIB buatkan **6 Pilihan Kalimat Pembuka (Hook 3 Detik Pertama)** pada "hook_options" berdasarkan 6 teori psikologi copywriting berikut (gunakan bahasa lisan khas kreator):
   - **Negative / Warning Hook**: Memicu rasa takut rugi / kesalahan fatal.
   - **Positive / Dream Outcome Hook**: Menjanjikan hasil impian yang spesifik & masuk akal.
   - **Proof / Result-First Hook**: Menunjukkan bukti nyata / hasil duluan di detik pertama.
   - **Contrarian / Myth-Buster Hook**: Menabrak anggapan umum yang dipercaya banyak orang.
   - **Relatable / POV Hook**: Menyentuh situasi spesifik yang sedang dialami target audiens.
   - **Curiosity Gap / Secret Hook**: Membuka celah penasaran yang membuat penonton wajib nonton sampai habis.
4. WAJIB buatkan **3 Pilihan Kalimat Penutup (CTA)** pada "cta_options" lengkap dengan kategorinya:
   - **Engagement Bait CTA**: Memancing penonton berdebat/bercerita di kolom komentar.
   - **Save & Share CTA**: Memicu penonton menyimpan video atau membagikan ke teman.
   - **Soft/Hard Conversion CTA**: Mengarahkan penonton mengecek produk/link/profil secara persuasif tanpa terkesan memaksa.

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
    // 6. PENYUSUN SKRIP END-TO-END + SKOR POTENSI VIRAL + PAKET UPLOAD LENGKAP
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
- Tulis dalam bentuk **Teks Percakapan / Dialog Saling Bersahutan** antara **${ugcConfig?.jumlahOrang || 2} orang** dengan nama pemeran: **${daftarPemeran}**.
- Alur percakapan WAJIB mengikuti teori copywriting yang kuat sesuai kerangka "${contentBrief?.selected_framework}".`
        : `
# INSTRUKSI SKRIP MONOLOG 100% PERSONAL:
- Tulis dengan bahasa lisan yang mengalir alami sesuai sapaan "${personaProfile?.linguistic_matrix?.self_pronoun}" dan "${personaProfile?.linguistic_matrix?.audience_pronoun}", serta tonjolkan Positioning & USP kreator.`

      promptFinal = `
Kamu adalah Copywriter Video Pendek & Produser Eksekutif Kelas Dunia.
Profil 360° Kreator (Positioning, USP, Target Audiens & Gaya Bahasa):
${JSON.stringify(personaProfile)}

Rancangan Konten Terkunci:
${JSON.stringify(contentBrief)}

Bentuk Eksekusi Visual: "${bentukKonten}"
${instruksiUGC}

ATURAN WAJIB COPYWRITING:
1. Hindari semua kata kaku berikut: ${JSON.stringify(personaProfile?.linguistic_matrix?.forbidden_words || [])}.
2. Pisahkan setiap 1-2 kalimat dengan baris baru (\\n) agar ritme baca di teleprompter sangat enak.
3. Tambahkan petunjuk ekspresi/intonasi di dalam kurung siku [...] seperti [Tatapan serius], [Senyum tipis].
4. Susun dalam 4 kerangka copywriting yang mengunci retensi (HOOK, BODY_STORY dengan Open Loop penahan scroll, VALUE_SOLUTION yang menonjolkan USP, dan CTA).
5. Berikan **Evaluasi Skor Skrip ("script_score")** dari 85–98 beserta analisis kekuatan Hook, kekuatan Retensi Tengah, dan 1 tips eksekusi singkat.
6. Berikan **Paket Siap Upload ("upload_pack")** yang berisi:
   - "cover_title": Teks singkat (maksimal 5-7 kata) yang memancing klik untuk dipasang di Cover/Thumbnail video.
   - "caption_seo": Caption TikTok/Reels yang engaging + 5 hashtag tertarget sesuai topik dan target audiens.
   - "pinned_comment": 1 kalimat komentar pertama dari kreator untuk di-pin guna memancing penonton membalas di kolom komentar.

Keluarkan HANYA valid JSON:
{
  "metadata": {
    "estimated_duration": "45-60 Detik",
    "framework_used": "${contentBrief?.selected_framework || "PAS_RELATABLE_BRIDGE"}",
    "is_ugc": ${isModeUGC}
  },
  "script_score": {
    "total_score": 92,
    "hook_strength": "Sangat Kuat — Langsung menyentuh rasa penasaran/ketakutan audiens di 3 detik awal.",
    "retention_bridge": "Alur cerita memakai kalimat pendek yang menahan penonton agar tidak scroll.",
    "producer_tip": "Pastikan 3 detik pertama diucapkan tanpa jeda napas panjang dan tatap lensa kamera."
  },
  "upload_pack": {
    "cover_title": "Teks Judul Cover / Thumbnail Singkat...",
    "caption_seo": "Caption menarik beserta #hashtag1 #hashtag2...",
    "pinned_comment": "Komentar pancingan pertama untuk di-pin..."
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
  ],
  "persona_alignment_notes": [
    "Penjelasan bagaimana skrip ini sudah disesuaikan dengan Positioning & Target Audiensmu..."
  ]
}`
    } else if (action === "regenerate_satu_kerangka") {
      isLightTask = true
      promptFinal = `
Kamu adalah Copywriter Profesional dengan profil kreator berikut:
${JSON.stringify(personaProfile)}

Konteks Topik/Video: "${body.subyek || "Konten Video"}"
Tugasmu HANYA menulis ulang **SATU kerangka spesifik ini saja** yaitu: **"${segmenTarget?.labelMini}"** agar menjadi variasi kalimat baru yang lebih tajam dan kuat secara copywriting:
- Kalimat saat ini: "${segmenTarget?.voiceover}"
- Teks layar saat ini: "${segmenTarget?.teksLayar}"
- Visual saat ini: "${segmenTarget?.visual}"

Keluarkan HANYA valid JSON untuk 1 kerangka ini:
{
  "voiceover": "...",
  "teksLayar": "...",
  "visual": "..."
}`
    } else if (action === "analyze_script_diff") {
      isLightTask = true
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
    } else if (action === "buat_10_ide_topik") {
      isLightTask = true
      promptFinal = `
Buatkan 10 ide topik konten yang sangat relevan dengan Positioning, USP, dan Ketakutan/Impian Target Audiens dari kreator berikut:
${JSON.stringify(personaProfile)}
Balas HANYA dalam format JSON:
{
  "ideTopik": [
    { "judul": "...", "nuansa": "...", "ringkasan": "..." }
  ]
}`
    } else if (action === "ubah_bentuk_konten") {
      isLightTask = true
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
      isLightTask = true
      promptFinal = `
Berikan evaluasi singkat (2-3 kalimat membangun) untuk kinerja konten mingguan berikut dan saran jenis Hook untuk konten selanjutnya:
${JSON.stringify(dataKinerja)}
Balas HANYA dalam format JSON:
{ "evaluasiAI": "..." }`
    }

    // EKSEKUSI ROUTING: MULTIMODAL -> GEMINI 2.5 | TEKS -> OPENROUTER (FALLBACK GEMINI 2.5)
    let hasilParsed
    if (isMultimodalTask) {
      if (!geminiKey) {
        return NextResponse.json(
          { error: "Kunci API Gemini belum dipasang di server." },
          { status: 500 },
        )
      }
      hasilParsed = await panggilGeminiAman(geminiKey, partsPayload, false)
    } else {
      hasilParsed = await panggilOpenRouterAtauFallback(
        openRouterKey,
        geminiKey,
        promptFinal,
        isLightTask,
      )
    }

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
