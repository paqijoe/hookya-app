import { NextResponse } from "next/server"

// Pengurai JSON tangguh agar respons AI selalu bersih
function uraiResponsAman(dataRespons) {
  const parts = dataRespons?.candidates?.[0]?.content?.parts || []
  let teksMentah = ""

  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i]?.text && !parts[i]?.thought) {
      teksMentah = parts[i].text
      break
    }
  }
  if (!teksMentah && parts[0]?.text) {
    teksMentah = parts[0].text
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

// Memanggil Sistem AI dengan deteksi otomatis model terbaru yang aktif
async function panggilSistemAI(apiKey, partsPayload) {
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
      const modelTersedia = (listData.models || [])
        .filter(
          (m) =>
            m.supportedGenerationMethods?.includes("generateContent") &&
            m.name.includes("gemini") &&
            !m.name.includes("2.0") &&
            !m.name.includes("2.5") &&
            !m.name.includes("1.5"),
        )
        .map((m) => m.name.replace("models/", ""))

      if (modelTersedia.length > 0) {
        const modelFlash = modelTersedia.filter((n) => n.includes("flash"))
        kandidatModel = [
          ...new Set([...modelFlash, ...modelTersedia, ...kandidatModel]),
        ]
      }
    }
  } catch {
    // Gunakan daftar kandidatModel default
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
              temperature: 0.75,
            },
          }),
        },
      )

      const data = await response.json()
      if (response.ok) {
        return uraiResponsAman(data)
      } else {
        errorTerakhir = data?.error?.message || `Kendala pada model ${model}`
      }
    } catch (err) {
      errorTerakhir = err.message
    }
  }

  throw new Error(errorTerakhir || "Sistem AI sedang padat, silakan coba lagi.")
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      action,
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
      segmenTarget,
      skripSebelumnya,
      namaFileVideo,
      teksReferensi,
      detailInput,
      framesBase64,
      mediaBase64,
      mediaMimeType,
      dataKinerja,
      customPrompts,
    } = body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Kunci API belum dipasang di file .env.local" },
        { status: 500 },
      )
    }

    let promptFinal = ""
    let partsPayload = []

    // =========================================================================
    // 1. PERSONA ENGINE (BEKERJA DI BALIK LAYAR MENGHASILKAN persona_profile.json)
    // =========================================================================
    if (action === "extract_persona_dna") {
      promptFinal = `
# ROLE
Kamu adalah Expert Computational Linguist dan Persona Architect. Analisis jawaban pengguna serta contoh kalimat/suara asli mereka untuk mengekstrak gaya bicara mereka ke dalam format JSON internal.
${customPrompts?.persona_engine ? `\n# INSTRUKSI TAMBAHAN DEVELOPER:\n${customPrompts.persona_engine}\n` : ""}

# INPUT DATA
1. Data Profil & Kebiasaan Bicara: ${JSON.stringify(onboardingAnswers)}
2. Contoh Kalimat / Rekaman Suara Asli Pengguna: "${rawWritingSamples || "Gaya bicara santai, jujur, langsung ke inti pembahasan tanpa basa-basi."}"

# ATURAN PENTING
Gunakan bahasa Indonesia yang ramah dan mudah dipahami di dalam seluruh isi nilai JSON.

# OUTPUT FORMAT
Keluarkan HANYA valid JSON dengan skema berikut:
{
  "user_id": "${onboardingAnswers?.user_id || "usr_99281"}",
  "persona_summary": "Ringkasan gaya bicara pengguna dalam bahasa sehari-hari yang mudah dipahami...",
  "archetype": {
    "primary": "Karakter Utama (misal: Kakak Senior yang Jujur / Teman Diskusi Santai)",
    "secondary": "Karakter Pendukung (misal: Praktisi Berpengalaman)",
    "authority_stance": "..."
  },
  "linguistic_matrix": {
    "self_pronoun": "...",
    "audience_pronoun": "...",
    "greeting_signature": ["...", "...", "..."],
    "favorite_transitions": ["...", "...", "...", "..."],
    "signature_vocabulary": ["...", "...", "...", "...", "..."],
    "forbidden_words": ["Anda", "Pemirsa", "Oleh karena itu", "Selain itu", "Di era digital saat ini", "Kesimpulannya", "Mari kita bahas", "Tidak dapat dipungkiri"],
    "code_switching_level": "..."
  },
  "rhythm_and_delivery": {
    "sentence_length": "...",
    "pacing": "...",
    "humor_style": "...",
    "rhetorical_habit": "..."
  },
  "belief_system": {
    "core_values": ["...", "...", "..."],
    "contrarian_views": ["...", "..."]
  }
}`
      partsPayload = [{ text: promptFinal }]
    }

    // =========================================================================
    // 2. INTERACTIVE ASSESSMENT CO-PILOT (4 TAHAP TANPA ISTILAH TEKNIS)
    // =========================================================================
    else if (action === "assessment_copilot") {
      const instruksiDev = customPrompts?.assessment_copilot || ""

      if (stageNumber === 1) {
        promptFinal = `
# ROLE
Kamu adalah Asisten Produser Konten Pribadi untuk kreator dengan gaya bicara berikut:
<user_persona>
${JSON.stringify(personaProfile, null, 2)}
</user_persona>
${instruksiDev ? `\n# INSTRUKSI TAMBAHAN DEVELOPER:\n${instruksiDev}\n` : ""}

# TAHAP 1: Penajaman Sudut Pandang Bahasan
Pengguna ingin membuat konten dengan topik awal:
- Topik Awal: "${stageInput?.rawTopic}"
- Target Durasi: "${stageInput?.targetPlatform || "Reels / TikTok (60 Detik)"}"
- Kategori: "${stageInput?.kategori || "Konten Kreator & Personal Branding"}"

Tugasmu:
1. Pertajam topik tersebut menjadi 1 gagasan utama yang kuat.
2. Berikan **3 Pilihan Sudut Pandang Bahasan** (1 Membongkar Mitos Umum, 1 Kesalahan yang Sering Terjadi, 1 Cara Praktis yang Jarang Disadari).
3. Gunakan bahasa sehari-hari yang ramah (JANGAN gunakan istilah teknis koding seperti JSON, core_idea, archetype, atau linguistic_matrix).

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "Sapaan akrab sesuai gaya bahasa pengguna & ajakan memilih sudut pandang...",
  "refined_core_idea": "Gagasan inti yang sudah dipertajam...",
  "angle_options": [
    {
      "id": "angle_1",
      "type": "Membongkar Mitos Umum",
      "angle_text": "..."
    },
    {
      "id": "angle_2",
      "type": "Kesalahan yang Sering Terjadi",
      "angle_text": "..."
    },
    {
      "id": "angle_3",
      "type": "Cara Praktis & Logis",
      "angle_text": "..."
    }
  ],
  "story_prompt_question": "Pertanyaan santai untuk memancing cerita atau pengalaman pribadi pengguna soal topik ini..."
}`
      } else if (stageNumber === 2) {
        promptFinal = `
# ROLE
Kamu adalah Asisten Produser Konten Pribadi untuk kreator berikut:
<user_persona>
${JSON.stringify(personaProfile, null, 2)}
</user_persona>

# TAHAP 2: Tambahan Fakta Pendukung, Analogi & Solusi
Data dari pilihan sebelumnya:
- Inti Bahasan: "${stageInput?.coreIdea}"
- Sudut Pandang Terpilih: "${stageInput?.chosenAngle}"
- Cerita Pengalaman Pengguna: "${stageInput?.userStory || "(Pengguna belum menuliskan cerita pribadi)"}"

Tugasmu:
1. Buatkan **2 pilihan perumpamaan/analogi sehari-hari** (\`relatable_analogies\`) yang sangat dekat dengan kehidupan penonton.
2. Berikan **3 Kartu Fakta/Referensi Pendukung (\`reference_cards\`)** dalam bahasa Indonesia yang mudah dimengerti (1 Fakta Psikologi, 1 Data/Fakta Menarik, 1 Fenomena Sehari-hari).
3. Berikan **3 saran langkah solusi praktis (\`suggested_solutions\`)** yang bisa langsung dipraktikkan penonton.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "Tanggapan hangat atas sudut pandang pengguna & ajakan memilih fakta pendukung...",
  "relatable_analogies": [
    "Perumpamaan sehari-hari 1 yang mudah dibayangkan penonton...",
    "Perumpamaan sehari-hari 2..."
  ],
  "reference_cards": [
    {
      "type": "Fakta Psikologi",
      "title": "Judul prinsip/fakta psikologi...",
      "summary": "Penjelasan singkat dengan bahasa obrolan santai..."
    },
    {
      "type": "Data & Fakta Lapangan",
      "title": "Judul fakta menarik...",
      "summary": "Penjelasan singkat fakta tersebut..."
    },
    {
      "type": "Fenomena Sehari-hari",
      "title": "Judul kebiasaan/fenomena nyata...",
      "summary": "Penjelasan singkat fenomena tersebut..."
    }
  ],
  "suggested_solutions": [
    "Langkah solusi praktis 1...",
    "Langkah solusi praktis 2...",
    "Langkah solusi praktis 3..."
  ]
}`
      } else if (stageNumber === 3) {
        promptFinal = `
# ROLE
Kamu adalah Asisten Produser Konten Pribadi untuk kreator berikut:
<user_persona>
${JSON.stringify(personaProfile, null, 2)}
</user_persona>

# TAHAP 3: Pemilihan Alur Cerita & Kalimat Pembuka (3 Detik Pertama)
Data sebelumnya:
- Inti Bahasan: "${stageInput?.coreIdea}"
- Sudut Pandang: "${stageInput?.chosenAngle}"
- Cerita/Perumpamaan: "${stageInput?.personalStory}"
- Fakta Pendukung: ${JSON.stringify(stageInput?.injectedReference)}
- Solusi Praktis: ${JSON.stringify(stageInput?.actionableSolutions)}

Tugasmu:
1. Pilih 1 dari 4 alur cerita terbaik (\`PAS_RELATABLE_BRIDGE\`, \`HSO_STORY\`, \`CONTRARIAN_MYTH_BUSTER\`, atau \`BAB_TRANSFORMATION\`) dan berikan alasan singkat dengan bahasa yang ramah.
2. Buat **3 pilihan kalimat pembuka (3 detik pertama)** menggunakan sapaan dan kosakata khas pengguna.
3. Buat **3 pilihan kalimat penutup (ajakan komentar/simpan)** di akhir video.

Keluarkan HANYA valid JSON:
{
  "co_pilot_message": "Saran alur cerita terbaik & pilihan kalimat pembuka...",
  "recommended_framework": "PAS_RELATABLE_BRIDGE",
  "framework_reason": "Alasan singkat dengan bahasa sederhana...",
  "hook_options": [
    "Kalimat pembuka 1 dengan gaya bicara asli pengguna...",
    "Kalimat pembuka 2 dengan gaya bicara asli pengguna...",
    "Kalimat pembuka 3 dengan gaya bicara asli pengguna..."
  ],
  "cta_options": [
    "Kalimat penutup 1 yang memancing penonton berkomentar...",
    "Kalimat penutup 2...",
    "Kalimat penutup 3..."
  ]
}`
      }
      partsPayload = [{ text: promptFinal }]
    }

    // =========================================================================
    // 3. PENYUSUN SKRIP NATURAL (TANPA MENYEBUT ISTILAH TEKNIS DI LAYAR USER)
    // =========================================================================
    else if (action === "assemble_humanized_script") {
      const instruksiDev = customPrompts?.script_humanizer || ""
      promptFinal = `
# ROLE
Kamu adalah Penulis Skrip Video Pendek kelas dunia. Tugasmu adalah menulis skrip yang ketika dibaca keras-keras terdengar 100% seperti obrolan spontan manusia asli sesuai gaya bicara kreator ini:
<persona_dna>
${JSON.stringify(personaProfile, null, 2)}
</persona_dna>

# RANCANGAN KONTEN
<content_brief>
${JSON.stringify(contentBrief, null, 2)}
</content_brief>

# BENTUK VISUAL PILIHAN: "${bentukKonten || "Talking Head + Teleprompter"}"
${instruksiDev ? `\n# INSTRUKSI TAMBAHAN DEVELOPER:\n${instruksiDev}\n` : ""}

# ATURAN WAJIB (ANTI-KAKU & RAMAH PENGGUNA AWAM)
1. Gunakan bahasa lisan sesuai sapaan diri (\`${personaProfile?.linguistic_matrix?.self_pronoun}\`) dan sapaan penonton (\`${personaProfile?.linguistic_matrix?.audience_pronoun}\`).
2. DILARANG KERAS menggunakan kata kaku di dalam daftar larangan: ${JSON.stringify(personaProfile?.linguistic_matrix?.forbidden_words || [])}.
3. Pisahkan setiap 1-2 kalimat dengan baris baru (\\n) agar nyaman dibaca di Teleprompter (maksimal 14 kata per baris).
4. Berikan petunjuk ekspresi/intonasi singkat di dalam kurung siku \`[...]\` seperti \`[Jeda 1 detik]\`, \`[Nada serius]\`, \`[Senyum santai]\`.
5. PENTING: Pada bagian \`persona_alignment_notes\`, jelaskan dengan bahasa manusia sehari-hari yang ramah. DILARANG KERAS menuliskan istilah koding seperti \`linguistic_matrix\`, \`forbidden_words\`, \`self_pronoun\`, atau \`JSON\`.

Keluarkan HANYA valid JSON:
{
  "metadata": {
    "estimated_duration": "Estimasi durasi baca (misal: 45-60 Detik)",
    "framework_used": "${contentBrief?.selected_framework || "PAS_RELATABLE_BRIDGE"}",
    "target_platform": "${contentBrief?.target_platform || "Reels / TikTok (60 Detik)"}"
  },
  "segmen": [
    {
      "idSegmen": "HOOK",
      "labelMini": "Bagian 1 • Pembuka (0-4 Detik)",
      "voiceover": "Kalimat ucapan lisan pembuka...",
      "teksLayar": "Teks singkat di layar video...",
      "visual": "Arahan gerakan kamera & ekspresi wajah yang rinci..."
    },
    {
      "idSegmen": "BODY_STORY",
      "labelMini": "Bagian 2 • Cerita & Fakta Pendukung",
      "voiceover": "Kalimat lisan cerita & fakta pendukung dengan bahasa obrolan...",
      "teksLayar": "Teks singkat di layar...",
      "visual": "Arahan adegan visual rinci..."
    },
    {
      "idSegmen": "VALUE_SOLUTION",
      "labelMini": "Bagian 3 • Solusi Praktis",
      "voiceover": "Kalimat lisan langkah solusi yang jelas...",
      "teksLayar": "Teks singkat poin solusi...",
      "visual": "Arahan adegan visual memperagakan solusi..."
    },
    {
      "idSegmen": "CTA",
      "labelMini": "Bagian 4 • Penutup & Ajakan Interaksi",
      "voiceover": "Kalimat lisan penutup...",
      "teksLayar": "Teks singkat ajakan komentar/simpan...",
      "visual": "Arahan adegan penutup..."
    }
  ],
  "persona_alignment_notes": [
    "Penjelasan ramah kenapa pilihan kata di skrip ini sudah pas dengan gaya bicaramu sehari-hari...",
    "Penjelasan ramah bagaimana fakta pendukung disampaikan dengan gaya obrolan santai..."
  ]
}`
      partsPayload = [{ text: promptFinal }]
    }

    // =========================================================================
    // 4. PEMBELAJARAN OTOMATIS DARI EDITAN USER (TANPA ISTILAH TEKNIS)
    // =========================================================================
    else if (action === "analyze_script_diff") {
      promptFinal = `
# ROLE
Kamu adalah Analis Gaya Bahasa. Bandingkan draf skrip awal dengan hasil editan pengguna untuk memperbarui profil gaya bicara mereka.

- Draf Awal: ${JSON.stringify(aiDraft)}
- Hasil Editan Pengguna: ${JSON.stringify(userEditedScript)}
- Profil Gaya Bicara Saat Ini: ${JSON.stringify(personaProfile, null, 2)}

Tugasmu:
1. Pelajari kata apa yang dihapus/diganti oleh pengguna dan kata khas baru apa yang mereka tambahkan.
2. Perbarui objek \`updated_persona_profile\`.
3. Tuliskan 2 poin ringkasan di \`learning_summary\` menggunakan bahasa sehari-hari yang ramah (JANGAN menyebut istilah teknis seperti \`forbidden_words\` atau \`signature_vocabulary\`, gunakan istilah "daftar kata yang dihindari" dan "kosakata khas kamu").

Keluarkan HANYA valid JSON:
{
  "learning_summary": [
    "Sistem mencatat kamu lebih suka menggunakan kata '...' dibanding '...'...",
    "Gaya bicaramu telah diperbarui untuk pembuatan skrip berikutnya..."
  ],
  "updated_persona_profile": ${JSON.stringify(personaProfile)}
}`
      partsPayload = [{ text: promptFinal }]
    }

    // =========================================================================
    // 5. EKSTRAK VIDEO (TRANSKRIP TEKS ASLI VIDEO + PECAHAN PER KERANGKA)
    // =========================================================================
    else if (action === "rewrite_video") {
      promptFinal = `
# ROLE
Kamu adalah Pakar Transkripsi Video & Penulis Ulang Copywriting Konten.
Gaya bicara kreator yang wajib kamu gunakan untuk menulis ulang:
<persona_dna>
${JSON.stringify(personaProfile, null, 2)}
</persona_dna>

DATA VIDEO YANG DIUNGGAH:
- Nama File Video: "${namaFileVideo || "Video Referensi"}"
- Catatan Tambahan Pengguna: "${teksReferensi || "-"}"
- Arah Penulisan Ulang yang Diinginkan: "${detailInput || "Tulis ulang menjadi konten baru yang 100% orisinil dengan gaya bicaraku, dibagi per bagian kerangka."}"

TUGAS UTAMAMU:
1. Dengarkan suara ucapan dan baca seluruh teks yang tampil di dalam video/adegan yang dilampirkan. Tuliskan **Teks Asli yang Ada di Video (Transkrip Kata demi Kata / Kalimat Asli Video)** pada kolom \`transkripAsliVideo\`.
2. Buat rekomendasi Copywriting baru yang 100% orisinil sesuai gaya bicara kreator dan **pecah ke dalam 4 kerangka berurutan (\`segmen\`)** lengkap dengan Kalimat Bicara (\`voiceover\`), Teks di Layar (\`teksLayar\`), dan Arahan Visual Rinci (\`visual\`) agar pengguna bisa mengedit atau men-generate ulang per kerangka!

Keluarkan HANYA valid JSON:
{
  "transkripAsliVideo": "Teks asli kata demi kata yang diucapkan atau tertulis di dalam video yang diunggah...",
  "intiPesanVideo": "Ringkasan 1 kalimat tentang topik video tersebut...",
  "segmen": [
    {
      "idSegmen": "HOOK",
      "labelMini": "Kerangka 1 • Pembuka (Hook 0-4 Detik)",
      "voiceover": "Kalimat copywriting pembuka baru yang orisinil dengan gaya bicara user...",
      "teksLayar": "Teks singkat di layar untuk pembuka...",
      "visual": "Arahan adegan kamera yang rinci mengikuti kalimat pembuka..."
    },
    {
      "idSegmen": "BODY_STORY",
      "labelMini": "Kerangka 2 • Cerita & Masalah Penonton",
      "voiceover": "Kalimat copywriting bagian cerita/masalah yang orisinil...",
      "teksLayar": "Teks singkat di layar untuk bagian masalah...",
      "visual": "Arahan adegan kamera bagian cerita/masalah..."
    },
    {
      "idSegmen": "VALUE_SOLUTION",
      "labelMini": "Kerangka 3 • Isi Utama & Solusi",
      "voiceover": "Kalimat copywriting bagian isi utama/solusi yang orisinil...",
      "teksLayar": "Teks singkat di layar untuk poin solusi...",
      "visual": "Arahan adegan kamera memperagakan solusi..."
    },
    {
      "idSegmen": "CTA",
      "labelMini": "Kerangka 4 • Penutup & Ajakan Interaksi",
      "voiceover": "Kalimat copywriting penutup yang orisinil...",
      "teksLayar": "Teks singkat di layar untuk penutup...",
      "visual": "Arahan adegan penutup..."
    }
  ]
}`

      partsPayload = []
      // Prioritaskan pengiriman file video/audio utuh jika ukurannya memungkinkan agar AI mendengar suara aslinya
      if (mediaBase64 && mediaMimeType) {
        partsPayload.push({
          inlineData: { mimeType: mediaMimeType, data: mediaBase64 },
        })
      }
      // Sertakan juga cuplikan frame visual video agar AI membaca teks di dalam layar video
      if (Array.isArray(framesBase64) && framesBase64.length > 0) {
        framesBase64.slice(0, 4).forEach((frameData) => {
          if (frameData) {
            partsPayload.push({
              inlineData: { mimeType: "image/jpeg", data: frameData },
            })
          }
        })
      }
      partsPayload.push({ text: promptFinal })
    }

    // =========================================================================
    // 6. AKSI PENDUKUNG: 10 IDE TOPIK, REGENERATE PER KERANGKA, UBAH BENTUK, EVALUASI VT
    // =========================================================================
    else if (action === "buat_10_ide_topik") {
      promptFinal = `
Buatkan 10 ide topik konten yang menarik dan cocok untuk kreator dengan profil berikut:
${JSON.stringify(personaProfile, null, 2)}
Balas HANYA dalam format JSON:
{
  "ideTopik": [
    {
      "judul": "Judul topik menarik...",
      "nuansa": "Membongkar Mitos / Tips Praktis / Cerita Keseharian",
      "ringkasan": "1 kalimat penjelasan singkat..."
    }
  ]
}`
      partsPayload = [{ text: promptFinal }]
    } else if (action === "regenerate_segmen") {
      promptFinal = `
Kamu adalah Penulis Copywriting dengan gaya bicara berikut:
${JSON.stringify(personaProfile, null, 2)}

Buatkan 1 variasi BARU yang lebih segar dan kuat untuk bagian "${segmenTarget?.labelMini}" berikut:
- Kalimat bicara lama: ${segmenTarget?.voiceover}
- Teks layar lama: ${segmenTarget?.teksLayar}
- Arahan visual lama: ${segmenTarget?.visual}

Pastikan arahan visual baru mengikuti kalimat skrip baru secara rinci.
Balas HANYA dalam format JSON:
{
  "voiceover": "...",
  "teksLayar": "...",
  "visual": "..."
}`
      partsPayload = [{ text: promptFinal }]
    } else if (action === "ubah_bentuk_konten") {
      promptFinal = `
Adaptasikan skrip berikut menjadi bentuk konten baru: "${bentukKontenBaru}" dengan tetap menjaga gaya bicara kreator:
${JSON.stringify(personaProfile, null, 2)}

Skrip saat ini:
${JSON.stringify(skripSebelumnya)}

Balas HANYA dalam format JSON:
{
  "segmen": [
    { "idSegmen": "HOOK", "labelMini": "Bagian 1 • Pembuka", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "BODY_STORY", "labelMini": "Bagian 2 • Cerita & Masalah", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "VALUE_SOLUTION", "labelMini": "Bagian 3 • Isi & Solusi", "voiceover": "...", "teksLayar": "...", "visual": "..." },
    { "idSegmen": "CTA", "labelMini": "Bagian 4 • Penutup", "voiceover": "...", "teksLayar": "...", "visual": "..." }
  ]
}`
      partsPayload = [{ text: promptFinal }]
    } else if (action === "evaluasi_kinerja_vt") {
      promptFinal = `
Berikan evaluasi singkat (2-3 kalimat ramah & membangun) untuk kinerja video mingguan berikut:
${JSON.stringify(dataKinerja)}
Balas HANYA dalam format JSON:
{
  "evaluasiAI": "..."
}`
      partsPayload = [{ text: promptFinal }]
    }

    const hasilParsed = await panggilSistemAI(apiKey, partsPayload)
    return NextResponse.json(hasilParsed)
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Terjadi kendala pada Sistem AI" },
      { status: 500 },
    )
  }
}
