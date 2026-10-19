"use client"
import { useState, useRef } from "react"
import { FlatIcon, StoryVoiceInput, SelectWithCustom } from "./SharedUI"

export default function ScriptProducerView({
  userId,
  namaUser,
  coins,
  updateKoinDatabase,
  personaProfile,
  setPersonaProfile,
  simpanPersonaKeSupabase,
  bentukKonten,
  setBentukKonten,
  bentukKontenFinal,
  daftar10IdeTopik,
  setDaftar10IdeTopik,
  simpanAtauUpdateSkripDatabase,
  setKoleksiSkripTersimpan,
  hasilSkrip,
  setHasilSkrip,
  stage,
  setStage,
  setActiveMenu,
  showToast,
  customPrompts,
  SEPULUH_BENTUK_KONTEN,
  setModeTeleprompter,
  modeTampilanSkrip,
  setModeTampilanSkrip,
}) {
  const sliderIdeRef = useRef(null)
  const [kategoriKonten, setKategoriKonten] = useState("personal") // 'personal' | 'affiliate'
  const [jenisPromosi, setJenisPromosi] = useState("produk") // 'produk' | 'campaign'

  // State Input Konten Kreator / Personal Branding
  const [rawTopicInput, setRawTopicInput] = useState("")
  const [targetPlatformInput, setTargetPlatformInput] = useState(
    "Reels / TikTok (60 Detik)",
  )

  // State Form Detail Produk (Untuk Promosi Produk / Affiliate)
  const [formProduk, setFormProduk] = useState({
    namaProduk: "",
    brand: "",
    kategoriProduk: "Fashion & Aksesoris",
    hargaPromo: "",
    masalahDipecahkan: "",
    keunggulanSpesifikasi: "",
    buktiHasilCaraPakai: "",
    // Target Buyer Mendetail (Opsional)
    targetUsiaGender: "",
    targetPekerjaanGayaHidup: "",
    targetKeraguanBuyer: "",
    targetAlasanEmosional: "",
  })
  const [tampilkanTargetBuyer, setTampilkanTargetBuyer] = useState(false)

  // State Form Detail Campaign / Gerakan / Event
  const [formCampaign, setFormCampaign] = useState({
    namaCampaign: "",
    penyelenggara: "",
    tujuanUtama: "",
    isuAtauMasalah: "",
    ajakanAksiNyata: "",
    targetPartisipanOpsional: "",
  })

  // State Konfigurasi Konten UGC (Percakapan Multi-Pemeran)
  const [ugcConfig, setUgcConfig] = useState({
    aktif: false,
    jumlahOrang: 2,
    namaPemeran: ["Rina", "Dinda"],
  })

  // State Loading & Co-Pilot 4 Tahap
  const [isLoadingIdeTopik, setIsLoadingIdeTopik] = useState(false)
  const [isLoadingOpsi, setIsLoadingOpsi] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [regeneratingIndex, setRegeneratingIndex] = useState(null)
  const [isLearningDiff, setIsLearningDiff] = useState(false)
  const [errorAsesmenAI, setErrorAsesmenAI] = useState("")

  const [coPilotStage1Data, setCoPilotStage1Data] = useState(null)
  const [coPilotStage2Data, setCoPilotStage2Data] = useState(null)
  const [coPilotStage3Data, setCoPilotStage3Data] = useState(null)

  const [contentBrief, setContentBrief] = useState({
    session_id: "ses_4410",
    selected_framework: "PAS_RELATABLE_BRIDGE",
    target_platform: "Reels / TikTok (60 Detik)",
    core_idea: "",
    chosen_angle: "",
    personal_context_or_story: "",
    injected_reference: { type: "Fakta Psikologi", title: "", summary: "" },
    actionable_solution: [],
    locked_hook: "",
    call_to_action: "",
  })

  const [tempStoryInput, setTempStoryInput] = useState("")
  const [tempCustomSolution, setTempCustomSolution] = useState("")
  const [tempCustomHook, setTempCustomHook] = useState("")
  const [tempCustomCTA, setTempCustomCTA] = useState("")
  const [aiOriginalDraft, setAiOriginalDraft] = useState([])
  const [targetKonversiBentuk, setTargetKonversiBentuk] = useState(
    SEPULUH_BENTUK_KONTEN[9]?.nama || "Slide Foto / Carousel",
  )

  // Pengatur Jumlah Pemeran UGC Dinamis
  const handleUbahJumlahPemeranUGC = (jmlBaru) => {
    const angka = Math.max(2, Math.min(6, parseInt(jmlBaru) || 2))
    const namaLama = [...ugcConfig.namaPemeran]
    const namaBaru = []
    for (let i = 0; i < angka; i++) {
      namaBaru.push(namaLama[i] || `Pemeran ${i + 1}`)
    }
    setUgcConfig({ ...ugcConfig, jumlahOrang: angka, namaPemeran: namaBaru })
  }

  const geserSliderIde = (arah) => {
    if (!sliderIdeRef.current) return
    sliderIdeRef.current.scrollBy({
      left: arah === "kiri" ? -320 : 320,
      behavior: "smooth",
    })
  }

  const handleGenerate10IdeTopikAI = async () => {
    setIsLoadingIdeTopik(true)
    showToast("Sedang meracik 10 ide topik sesuai profilmu...")
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "buat_10_ide_topik",
          userId,
          namaUser,
          personaProfile,
          kategoriKonten,
        }),
      })
      const data = await res.json()
      if (data.silentCoinUpdated != null) {
        updateKoinDatabase(data.silentCoinUpdated)
      }
      if (res.ok && Array.isArray(data.ideTopik) && data.ideTopik.length > 0) {
        setDaftar10IdeTopik(data.ideTopik.slice(0, 10))
        showToast("10 ide topik baru berhasil dimuat.")
      }
    } catch (err) {
      showToast("Info: " + err.message)
    } finally {
      setIsLoadingIdeTopik(false)
    }
  }

  // ============================================================================
  // TAHAP 1: PENAJAMAN SUDUT PANDANG (MENDUKUNG PERSONAL, PRODUK & CAMPAIGN)
  // ============================================================================
  const mulaiTahap1Angle = async () => {
    let topikUtama = ""
    let detailPromosiPayload = null

    if (kategoriKonten === "personal") {
      if (!rawTopicInput.trim()) {
        alert(
          "Silakan pilih kartu ide topik di atas atau ketik topik terlebih dahulu.",
        )
        return
      }
      topikUtama = rawTopicInput.trim()
    } else {
      if (jenisPromosi === "produk") {
        if (
          !formProduk.namaProduk.trim() ||
          !formProduk.keunggulanSpesifikasi.trim()
        ) {
          alert(
            "Silakan isi minimal Nama Produk dan Detail Spesifikasi/Keunggulan Produk.",
          )
          return
        }
        topikUtama = `Promosi Produk ${formProduk.namaProduk} (${formProduk.brand || "Pilihan"})`
        detailPromosiPayload = formProduk
      } else {
        if (
          !formCampaign.namaCampaign.trim() ||
          !formCampaign.tujuanUtama.trim()
        ) {
          alert(
            "Silakan isi minimal Nama Gerakan/Campaign dan Tujuan Utamanya.",
          )
          return
        }
        topikUtama = `Campaign / Gerakan: ${formCampaign.namaCampaign}`
        detailPromosiPayload = formCampaign
      }
    }

    setStage(1)
    setErrorAsesmenAI("")
    setCoPilotStage1Data(null)
    setIsLoadingOpsi(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assessment_copilot",
          userId,
          namaUser,
          stageNumber: 1,
          personaProfile,
          stageInput: {
            rawTopic: topikUtama,
            targetPlatform: targetPlatformInput,
            kategori:
              kategoriKonten === "personal"
                ? "Konten Kreator & Personal Branding"
                : jenisPromosi === "produk"
                  ? "Promosi Produk & Affiliate"
                  : "Promosi Campaign / Gerakan Sosial & Event",
            jenisPromosi:
              kategoriKonten === "affiliate" ? jenisPromosi : "personal",
            detailPromosi: detailPromosiPayload,
          },
          customPrompts,
        }),
      })

      const data = await res.json()
      if (data.silentCoinUpdated != null) {
        updateKoinDatabase(data.silentCoinUpdated)
      }
      if (!res.ok) throw new Error(data.error || "Gagal memuat sudut pandang")

      setCoPilotStage1Data(data)
      setContentBrief((prev) => ({
        ...prev,
        session_id: `ses_${Date.now().toString().slice(-4)}`,
        target_platform: targetPlatformInput,
        core_idea: data.refined_core_idea || topikUtama,
        chosen_angle: data.angle_options?.[0]?.angle_text || "",
      }))
    } catch (err) {
      setErrorAsesmenAI(err.message)
    } finally {
      setIsLoadingOpsi(false)
    }
  }

  // TAHAP 2: FAKTA PENDUKUNG & SOLUSI
  const lanjutKeTahap2Referensi = async (angleTerpilih, ceritaUser) => {
    const finalAngle = angleTerpilih || contentBrief.chosen_angle
    const finalStory = ceritaUser ?? tempStoryInput

    setContentBrief((prev) => ({
      ...prev,
      chosen_angle: finalAngle,
      personal_context_or_story: finalStory,
    }))

    setStage(2)
    setErrorAsesmenAI("")
    setCoPilotStage2Data(null)
    setIsLoadingOpsi(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assessment_copilot",
          userId,
          namaUser,
          stageNumber: 2,
          personaProfile,
          stageInput: {
            coreIdea: contentBrief.core_idea,
            chosenAngle: finalAngle,
            userStory: finalStory,
            detailPromosi:
              kategoriKonten === "affiliate"
                ? jenisPromosi === "produk"
                  ? formProduk
                  : formCampaign
                : null,
          },
          customPrompts,
        }),
      })

      const data = await res.json()
      if (data.silentCoinUpdated != null) {
        updateKoinDatabase(data.silentCoinUpdated)
      }
      if (!res.ok) throw new Error(data.error || "Gagal memuat fakta pendukung")

      setCoPilotStage2Data(data)
      const ceritaOtomatis =
        finalStory.trim() ||
        data.relatable_analogies?.[0] ||
        "Pengalaman nyata sehari-hari."

      setTempStoryInput(ceritaOtomatis)
      setContentBrief((prev) => ({
        ...prev,
        personal_context_or_story: ceritaOtomatis,
        injected_reference:
          data.reference_cards?.[0] || prev.injected_reference,
        actionable_solution: data.suggested_solutions
          ? data.suggested_solutions.slice(0, 2)
          : prev.actionable_solution,
      }))
    } catch (err) {
      setErrorAsesmenAI(err.message)
    } finally {
      setIsLoadingOpsi(false)
    }
  }

  // TAHAP 3: ALUR COPYWRITING, HOOK & CTA
  const lanjutKeTahap3Hook = async () => {
    const solusiFinal = tempCustomSolution.trim()
      ? [...contentBrief.actionable_solution, tempCustomSolution.trim()]
      : contentBrief.actionable_solution

    setContentBrief((prev) => ({
      ...prev,
      personal_context_or_story:
        tempStoryInput || prev.personal_context_or_story,
      actionable_solution: solusiFinal,
    }))

    setStage(3)
    setErrorAsesmenAI("")
    setCoPilotStage3Data(null)
    setIsLoadingOpsi(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assessment_copilot",
          userId,
          namaUser,
          stageNumber: 3,
          personaProfile,
          stageInput: {
            coreIdea: contentBrief.core_idea,
            chosenAngle: contentBrief.chosen_angle,
            personalStory:
              tempStoryInput || contentBrief.personal_context_or_story,
            injectedReference: contentBrief.injected_reference,
            actionableSolutions: solusiFinal,
          },
          customPrompts,
        }),
      })

      const data = await res.json()
      if (data.silentCoinUpdated != null) {
        updateKoinDatabase(data.silentCoinUpdated)
      }
      if (!res.ok) throw new Error(data.error || "Gagal memuat kalimat pembuka")

      setCoPilotStage3Data(data)
      setContentBrief((prev) => ({
        ...prev,
        selected_framework:
          data.recommended_framework || "PAS_RELATABLE_BRIDGE",
        locked_hook: data.hook_options?.[0] || prev.locked_hook,
        call_to_action: data.cta_options?.[0] || prev.call_to_action,
      }))
    } catch (err) {
      setErrorAsesmenAI(err.message)
    } finally {
      setIsLoadingOpsi(false)
    }
  }

  const lanjutKeTahap4FinalBrief = () => {
    setContentBrief((prev) => ({
      ...prev,
      locked_hook: tempCustomHook.trim() || prev.locked_hook,
      call_to_action: tempCustomCTA.trim() || prev.call_to_action,
    }))
    setStage(4)
  }

  // ============================================================================
  // GENERATE SKRIP UTAMA (MENDUKUNG MONOLOG & DIALOG UGC MULTI-PEMERAN)
  // ============================================================================
  const handleBuatSkripSekarang = async () => {
    if (coins < 1) {
      alert("Saldo Koin kamu tidak mencukupi. Silakan isi ulang koin.")
      setActiveMenu("topup")
      return
    }

    setIsGenerating(true)
    // Potong 1 koin terlebih dahulu (jika gagal di server, sistem otomatis mengganti koin di belakang layar)
    const koinSetelahPotong = coins - 1
    await updateKoinDatabase(koinSetelahPotong)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assemble_humanized_script",
          userId,
          namaUser,
          personaProfile,
          contentBrief,
          bentukKonten: bentukKontenFinal,
          ugcConfig,
          customPrompts,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.silentCoinUpdated != null) {
          updateKoinDatabase(data.silentCoinUpdated)
        }
        throw new Error(data.error || "Gagal menyusun skrip")
      }

      const waktuSekarang = new Date().toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      const segmenHasil = Array.isArray(data.segmen) ? data.segmen : []
      setAiOriginalDraft(JSON.parse(JSON.stringify(segmenHasil)))

      const skripBaru = {
        id: Date.now(),
        dbId: null,
        judul: contentBrief.core_idea,
        kategori:
          kategoriKonten === "personal"
            ? "Konten Kreator"
            : jenisPromosi === "produk"
              ? "Promosi Produk & Affiliate"
              : "Promosi Campaign / Gerakan",
        bentuk: ugcConfig.aktif
          ? `Konten UGC Percakapan (${ugcConfig.jumlahOrang} Orang: ${ugcConfig.namaPemeran.join(", ")})`
          : bentukKontenFinal,
        waktuDibuat: waktuSekarang,
        metadata: data.metadata || {
          estimated_duration: "45-60 Detik",
          framework_used: contentBrief.selected_framework,
        },
        personaAlignmentNotes: data.persona_alignment_notes || [],
        contentBrief,
        sudahUpload: false,
        tanggalUpload: "",
        segmen: segmenHasil,
      }

      const tersimpan = await simpanAtauUpdateSkripDatabase(skripBaru)
      setHasilSkrip(tersimpan)
      setKoleksiSkripTersimpan((prev) => [tersimpan, ...prev])
      setStage(5)
      showToast("Skrip berhasil dibuat dan otomatis tersimpan!")
    } catch (err) {
      showToast(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // ============================================================================
  // REGENERATE MANDIRI PER KERANGKA (HANYA MENGUBAH 1 KERANGKA YANG DIKLIK!)
  // ============================================================================
  const handleRegenerateSatuKerangka = async (indexBaris, fokusTarget) => {
    if (!hasilSkrip || regeneratingIndex !== null) return
    const segmenLama = hasilSkrip.segmen[indexBaris]
    setRegeneratingIndex(indexBaris)
    showToast(`Membuat variasi baru khusus untuk ${segmenLama.labelMini}...`)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate_satu_kerangka",
          userId,
          namaUser,
          personaProfile,
          subyek: hasilSkrip.judul,
          segmenTarget: segmenLama,
        }),
      })

      const data = await res.json()
      if (data.silentCoinUpdated != null) {
        updateKoinDatabase(data.silentCoinUpdated)
      }
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui kerangka")

      const segmenUpdate = { ...segmenLama }
      if (fokusTarget === "visual") {
        segmenUpdate.visual = data.visual || segmenLama.visual
      } else {
        segmenUpdate.voiceover = data.voiceover || segmenLama.voiceover
        segmenUpdate.teksLayar = data.teksLayar || segmenLama.teksLayar
        segmenUpdate.visual = data.visual || segmenLama.visual
      }

      // Hanya ganti elemen pada indexBaris yang diklik!
      const daftarSegmenBaru = hasilSkrip.segmen.map((s, idx) =>
        idx === indexBaris ? segmenUpdate : s,
      )

      const skripDiperbarui = { ...hasilSkrip, segmen: daftarSegmenBaru }
      setHasilSkrip(skripDiperbarui)
      await simpanAtauUpdateSkripDatabase(skripDiperbarui)
      showToast(`${segmenLama.labelMini} berhasil diperbarui!`)
    } catch (err) {
      showToast(err.message)
    } finally {
      setRegeneratingIndex(null)
    }
  }

  const handleKonversiBentukKontenLain = async () => {
    if (!hasilSkrip || isGenerating) return
    setIsGenerating(true)
    showToast(`Mengubah skrip ke format "${targetKonversiBentuk}"...`)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ubah_bentuk_konten",
          userId,
          namaUser,
          personaProfile,
          subyek: hasilSkrip.judul,
          skripSebelumnya: hasilSkrip.segmen,
          bentukKontenBaru: targetKonversiBentuk,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengubah format")

      const skripDiperbarui = {
        ...hasilSkrip,
        bentuk: targetKonversiBentuk,
        segmen: data.segmen || hasilSkrip.segmen,
      }
      setBentukKonten(targetKonversiBentuk)
      setHasilSkrip(skripDiperbarui)
      await simpanAtauUpdateSkripDatabase(skripDiperbarui)
      showToast("Format konten berhasil diperbarui.")
    } catch (err) {
      showToast(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSimpanEditanUser = async () => {
    if (!hasilSkrip || isLearningDiff) return
    setIsLearningDiff(true)
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze_script_diff",
          userId,
          namaUser,
          aiDraft: aiOriginalDraft,
          userEditedScript: hasilSkrip.segmen,
          personaProfile,
        }),
      })
      const data = await res.json()
      if (res.ok && data.updated_persona_profile) {
        setPersonaProfile(data.updated_persona_profile)
        await simpanPersonaKeSupabase(data.updated_persona_profile)
      }
      await simpanAtauUpdateSkripDatabase(hasilSkrip)
      showToast("Revisi skrip disimpan & gaya bicaramu telah diperbarui!")
    } finally {
      setIsLearningDiff(false)
    }
  }

  return (
    <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
      {/* HEADER NAVIGASI TAHAP */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
          {stage === 0 && "Buat Skrip Konten Baru"}
          {stage === 1 && "Pilih Sudut Pandang Bahasan"}
          {stage === 2 && "Pilih Fakta Pendukung & Langkah Solusi"}
          {stage === 3 && "Pilih Alur Copywriting & Kalimat Pembuka"}
          {stage === 4 && "Ringkasan Rancangan Kontenmu"}
          {stage === 5 && hasilSkrip?.judul}
        </h2>

        {stage > 0 && (
          <div className="flex items-center gap-2">
            {stage < 5 && (
              <button
                type="button"
                onClick={() => setStage(stage - 1)}
                className="cursor-pointer text-xs bg-[#f4f5f7] px-3.5 py-2 rounded-xl font-bold"
              >
                ← Kembali
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setStage(0)
                setHasilSkrip(null)
              }}
              className="cursor-pointer text-xs bg-[#14141f] text-[#d4f34a] px-3.5 py-2 rounded-xl font-bold"
            >
              Buat Topik Baru
            </button>
          </div>
        )}
      </div>

      {/* =====================================================================
          STAGE 0: FORM INPUT UTAMA (PERSONAL VS PROMOSI PRODUK/CAMPAIGN + MODE UGC)
      ===================================================================== */}
      {stage === 0 && (
        <div className="space-y-6">
          {/* 1. Sakelar Kategori Utama */}
          <div className="bg-[#f4f5f7] p-2 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setKategoriKonten("personal")}
              className={`cursor-pointer p-3.5 rounded-xl text-left transition flex items-center gap-3 ${
                kategoriKonten === "personal"
                  ? "bg-[#14141f] text-[#d4f34a]"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              <FlatIcon name="user" className="w-5 h-5 shrink-0" />
              <div>
                <div className="text-xs sm:text-sm font-bold">
                  Konten Kreator & Personal Branding
                </div>
                <div className="text-xs font-normal opacity-80">
                  Edukasi, Cerita Harian, Hobi & Hiburan
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setKategoriKonten("affiliate")}
              className={`cursor-pointer p-3.5 rounded-xl text-left transition flex items-center gap-3 ${
                kategoriKonten === "affiliate"
                  ? "bg-[#14141f] text-[#d4f34a]"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              <FlatIcon name="bag" className="w-5 h-5 shrink-0" />
              <div>
                <div className="text-xs sm:text-sm font-bold">
                  Konten Promosi, Affiliate & Campaign
                </div>
                <div className="text-xs font-normal opacity-80">
                  Promosi Produk/Jasa, Keranjang Kuning, atau Kampanye Gerakan
                </div>
              </div>
            </button>
          </div>

          {/* 2. PENGATURAN MODE KONTEN UGC (PERCAKAPAN MULTI-PEMERAN) */}
          <div className="bg-[#f0eeff] border border-[#5b4bc4]/20 p-4 sm:p-5 rounded-3xl space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#14141f] text-[#d4f34a] flex items-center justify-center">
                  <FlatIcon name="users" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#14141f]">
                    Mode Konten UGC (Naskah Dialog Percakapan)
                  </h3>
                  <p className="text-xs font-normal text-slate-600">
                    Aktifkan jika kamu ingin skrip berbentuk percakapan beberapa
                    orang dengan alur copywriting yang kuat.
                  </p>
                </div>
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200">
                <input
                  type="checkbox"
                  checked={ugcConfig.aktif}
                  onChange={(e) =>
                    setUgcConfig({ ...ugcConfig, aktif: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#14141f]"
                />
                <span>Gunakan Format Percakapan UGC</span>
              </label>
            </div>

            {ugcConfig.aktif && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs font-bold text-[#14141f]">
                    Jumlah Orang yang Terlibat dalam Percakapan:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[2, 3, 4].map((jml) => (
                      <button
                        key={jml}
                        type="button"
                        onClick={() => handleUbahJumlahPemeranUGC(jml)}
                        className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          ugcConfig.jumlahOrang === jml
                            ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                            : "bg-[#f4f5f7] text-slate-700 border-transparent"
                        }`}
                      >
                        {jml} Orang
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {ugcConfig.namaPemeran.map((namaP, idx) => (
                    <div key={idx}>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Nama Pemeran {idx + 1}:
                      </label>
                      <input
                        type="text"
                        value={namaP}
                        onChange={(e) => {
                          const salinan = [...ugcConfig.namaPemeran]
                          salinan[idx] = e.target.value
                          setUgcConfig({ ...ugcConfig, namaPemeran: salinan })
                        }}
                        placeholder={`Nama Orang ${idx + 1}`}
                        className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* =================================================================
              FORM A: KONTEN KREATOR & PERSONAL BRANDING
          ================================================================= */}
          {kategoriKonten === "personal" && (
            <div className="space-y-5">
              {/* 10 Referensi Ide Slide ke Samping */}
              <div className="bg-[#f4f5f7] p-4 sm:p-5 rounded-3xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#14141f]">
                      10 Referensi Ide Topik Sesuai Profilmu (Geser ke Samping)
                    </h3>
                    <p className="text-xs font-normal text-slate-600">
                      Klik salah satu kartu untuk memilih cepat, atau tentukan
                      sendiri topikmu di bawah.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isLoadingIdeTopik}
                      onClick={handleGenerate10IdeTopikAI}
                      className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3 py-2 rounded-xl"
                    >
                      {isLoadingIdeTopik ? "Memproses..." : "Perbarui 10 Ide"}
                    </button>
                    <button
                      type="button"
                      onClick={() => geserSliderIde("kiri")}
                      className="cursor-pointer w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center"
                    >
                      <FlatIcon name="chevronLeft" className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => geserSliderIde("kanan")}
                      className="cursor-pointer w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center"
                    >
                      <FlatIcon name="chevronRight" className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div
                  ref={sliderIdeRef}
                  className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory"
                >
                  {daftar10IdeTopik.map((ide, idx) => {
                    const terpilih = rawTopicInput === ide.judul
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setRawTopicInput(ide.judul)
                          showToast(`Topik "${ide.judul}" dipilih.`)
                        }}
                        className={`cursor-pointer snap-start shrink-0 w-64 sm:w-72 p-4 rounded-2xl border text-left transition ${
                          terpilih
                            ? "bg-[#d4f34a] text-[#14141f] border-[#14141f]"
                            : "bg-white text-[#14141f] border-slate-200 hover:border-[#14141f]"
                        }`}
                      >
                        <span className="text-[11px] font-bold text-slate-500">
                          Ide #{idx + 1} • {ide.nuansa}
                        </span>
                        <div className="text-xs sm:text-sm font-bold text-[#14141f] mt-1">
                          {ide.judul}
                        </div>
                        <p className="text-xs font-normal text-slate-600 mt-1">
                          {ide.ringkasan}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                    Atau Ketik / Rekam Sendiri Topik Pembahasanmu:
                  </label>
                  <StoryVoiceInput
                    rows={2}
                    value={rawTopicInput}
                    onChange={setRawTopicInput}
                    placeholder="Ketik topik yang ingin kamu bahas atau klik ikon mikrofon..."
                    onNotify={showToast}
                  />
                </div>
                <div>
                  <SelectWithCustom
                    label="Target Durasi Konten:"
                    value={targetPlatformInput}
                    options={[
                      "Reels / TikTok (60 Detik)",
                      "TikTok / Shorts Cepat (30 Detik)",
                      "Storytelling Mendalam (90 Detik)",
                      "Carousel / Slide Foto",
                    ]}
                    onChange={setTargetPlatformInput}
                  />
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              FORM B: KHUSUS KONTEN PROMOSI, AFFILIATE & CAMPAIGN GERAKAN
          ================================================================= */}
          {kategoriKonten === "affiliate" && (
            <div className="space-y-5">
              {/* Pilihan Sub-Jenis Promosi: Produk vs Campaign/Gerakan */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#14141f]">
                  Apa yang Ingin Kamu Pasarkan / Suarakan di Konten Ini?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setJenisPromosi("produk")}
                    className={`cursor-pointer p-4 rounded-2xl border text-left transition ${
                      jenisPromosi === "produk"
                        ? "bg-[#d4f34a] text-[#14141f] border-[#14141f]"
                        : "bg-[#f4f5f7] text-slate-700 border-transparent"
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold">
                      1. Pemasaran Produk / Barang / Jasa (Affiliate & UMKM)
                    </div>
                    <p className="text-xs font-normal mt-0.5 opacity-80">
                      Memasarkan produk fisik, digital, kuliner, atau layanan
                      jasa secara detail.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setJenisPromosi("campaign")}
                    className={`cursor-pointer p-4 rounded-2xl border text-left transition ${
                      jenisPromosi === "campaign"
                        ? "bg-[#d4f34a] text-[#14141f] border-[#14141f]"
                        : "bg-[#f4f5f7] text-slate-700 border-transparent"
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold">
                      2. Campaign / Gerakan Sosial / Event / Komunitas
                    </div>
                    <p className="text-xs font-normal mt-0.5 opacity-80">
                      Memasarkan gerakan positif, acara, kampanye kesadaran,
                      atau ajakan komunitas.
                    </p>
                  </button>
                </div>
              </div>

              {/* SUB-FORM 1: JIKA MEMILIH PEMASARAN PRODUK (MENDETAIL + TARGET BUYER OPSIONAL) */}
              {jenisPromosi === "produk" && (
                <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold text-[#14141f]">
                    Informasi Mendetail Tentang Produk
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Nama Produk (Wajib) *
                      </label>
                      <input
                        type="text"
                        value={formProduk.namaProduk}
                        onChange={(e) =>
                          setFormProduk({
                            ...formProduk,
                            namaProduk: e.target.value,
                          })
                        }
                        placeholder="Contoh: Sepatu Running Hyperblast"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Merek / Brand / Toko
                      </label>
                      <input
                        type="text"
                        value={formProduk.brand}
                        onChange={(e) =>
                          setFormProduk({
                            ...formProduk,
                            brand: e.target.value,
                          })
                        }
                        placeholder="Contoh: Ortuseight"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Harga & Promo Saat Ini
                      </label>
                      <input
                        type="text"
                        value={formProduk.hargaPromo}
                        onChange={(e) =>
                          setFormProduk({
                            ...formProduk,
                            hargaPromo: e.target.value,
                          })
                        }
                        placeholder="Contoh: Rp 300rb (Diskon + Gratis Ongkir)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Masalah Utama yang Diselesaikan Produk Ini:
                      </label>
                      <StoryVoiceInput
                        rows={2}
                        value={formProduk.masalahDipecahkan}
                        onChange={(val) =>
                          setFormProduk({
                            ...formProduk,
                            masalahDipecahkan: val,
                          })
                        }
                        placeholder="Contoh: Kaki sering lecet dan pegal kalau pakai sepatu biasa buat lari jauh..."
                        onNotify={showToast}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Detail Spesifikasi, Bahan & Keunggulan Utama (Wajib) *
                      </label>
                      <StoryVoiceInput
                        rows={2}
                        value={formProduk.keunggulanSpesifikasi}
                        onChange={(val) =>
                          setFormProduk({
                            ...formProduk,
                            keunggulanSpesifikasi: val,
                          })
                        }
                        placeholder="Contoh: Bantalan empuk CumulusFoam, bahan mesh adem, bobot sangat ringan..."
                        onNotify={showToast}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#14141f] mb-1">
                      Cara Pakai / Bukti Hasil Nyata Setelah Pemakaian:
                    </label>
                    <StoryVoiceInput
                      rows={2}
                      value={formProduk.buktiHasilCaraPakai}
                      onChange={(val) =>
                        setFormProduk({
                          ...formProduk,
                          buktiHasilCaraPakai: val,
                        })
                      }
                      placeholder="Contoh: Sudah dipakai lari 10K berkali-kali tetap empuk dan solnya tidak licin..."
                      onNotify={showToast}
                    />
                  </div>

                  {/* Bagian Opsional Mendetail: Target Buyer */}
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() =>
                        setTampilkanTargetBuyer(!tampilkanTargetBuyer)
                      }
                      className="cursor-pointer flex items-center justify-between w-full bg-white p-3.5 rounded-2xl border border-slate-200 text-xs font-bold text-[#14141f]"
                    >
                      <span>
                        🎯 Detail Target Pembeli / Target Buyer (Opsional — Klik
                        untuk Mengisi Detail)
                      </span>
                      <FlatIcon
                        name="chevronDown"
                        className={`w-4 h-4 transition ${
                          tampilkanTargetBuyer ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {tampilkanTargetBuyer && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3 bg-white p-4 rounded-2xl border border-slate-200">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            1. Rentang Usia & Gender Target Pembeli (Opsional):
                          </label>
                          <input
                            type="text"
                            value={formProduk.targetUsiaGender}
                            onChange={(e) =>
                              setFormProduk({
                                ...formProduk,
                                targetUsiaGender: e.target.value,
                              })
                            }
                            placeholder="Contoh: Pria & Wanita usia 20-35 tahun"
                            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            2. Pekerjaan / Gaya Hidup Pembeli (Opsional):
                          </label>
                          <input
                            type="text"
                            value={formProduk.targetPekerjaanGayaHidup}
                            onChange={(e) =>
                              setFormProduk({
                                ...formProduk,
                                targetPekerjaanGayaHidup: e.target.value,
                              })
                            }
                            placeholder="Contoh: Pekerja kantoran yang baru mulai rutin olahraga"
                            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            3. Keraguan Terbesar Mereka Sebelum Membeli
                            (Opsional):
                          </label>
                          <input
                            type="text"
                            value={formProduk.targetKeraguanBuyer}
                            onChange={(e) =>
                              setFormProduk({
                                ...formProduk,
                                targetKeraguanBuyer: e.target.value,
                              })
                            }
                            placeholder="Contoh: Takut ukuran kekecilan atau lem cepat mengelupas"
                            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            4. Alasan Emosional Mereka Ingin Membeli (Opsional):
                          </label>
                          <input
                            type="text"
                            value={formProduk.targetAlasanEmosional}
                            onChange={(e) =>
                              setFormProduk({
                                ...formProduk,
                                targetAlasanEmosional: e.target.value,
                              })
                            }
                            placeholder="Contoh: Ingin tampil keren dan percaya diri saat ikut event lari"
                            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-FORM 2: JIKA MEMILIH CAMPAIGN / GERAKAN SOSIAL / EVENT */}
              {jenisPromosi === "campaign" && (
                <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold text-[#14141f]">
                    Informasi Mendetail Tentang Campaign / Gerakan / Acara
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Nama Gerakan / Campaign / Acara (Wajib) *
                      </label>
                      <input
                        type="text"
                        value={formCampaign.namaCampaign}
                        onChange={(e) =>
                          setFormCampaign({
                            ...formCampaign,
                            namaCampaign: e.target.value,
                          })
                        }
                        placeholder="Contoh: Gerakan 15 Menit Membaca / Workshop Kreator Muda"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Penyelenggara / Komunitas / Inisiator
                      </label>
                      <input
                        type="text"
                        value={formCampaign.penyelenggara}
                        onChange={(e) =>
                          setFormCampaign({
                            ...formCampaign,
                            penyelenggara: e.target.value,
                          })
                        }
                        placeholder="Contoh: Komunitas Teras Koeningan"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Isu / Kebiasaan yang Ingin Diubah lewat Gerakan Ini:
                      </label>
                      <StoryVoiceInput
                        rows={2}
                        value={formCampaign.isuAtauMasalah}
                        onChange={(val) =>
                          setFormCampaign({
                            ...formCampaign,
                            isuAtauMasalah: val,
                          })
                        }
                        placeholder="Contoh: Banyak anak muda yang ingin produktif tapi bingung mulai belajar dari mana..."
                        onNotify={showToast}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Tujuan Utama & Manfaat Mengikuti Campaign Ini (Wajib) *
                      </label>
                      <StoryVoiceInput
                        rows={2}
                        value={formCampaign.tujuanUtama}
                        onChange={(val) =>
                          setFormCampaign({
                            ...formCampaign,
                            tujuanUtama: val,
                          })
                        }
                        placeholder="Contoh: Membuka ruang belajar dan berkumpul gratis untuk meningkatkan skill konten..."
                        onNotify={showToast}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Ajakan Aksi Nyata untuk Penonton:
                      </label>
                      <input
                        type="text"
                        value={formCampaign.ajakanAksiNyata}
                        onChange={(e) =>
                          setFormCampaign({
                            ...formCampaign,
                            ajakanAksiNyata: e.target.value,
                          })
                        }
                        placeholder="Contoh: Daftar gratis lewat link di bio / Ikut tantangan hari ini"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Target Partisipan yang Diajak (Opsional):
                      </label>
                      <input
                        type="text"
                        value={formCampaign.targetPartisipanOpsional}
                        onChange={(e) =>
                          setFormCampaign({
                            ...formCampaign,
                            targetPartisipanOpsional: e.target.value,
                          })
                        }
                        placeholder="Contoh: Pelajar, mahasiswa, dan kreator pemula"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={mulaiTahap1Angle}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl shadow-sm"
          >
            Lanjut Pilih Sudut Pandang Bahasan ➔
          </button>
        </div>
      )}

      {/* LOADING & ERROR HANDLER TAHAP 1-3 */}
      {stage >= 1 && stage <= 3 && isLoadingOpsi && (
        <div className="py-12 px-6 rounded-3xl bg-[#f4f5f7] border border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-[#14141f] text-[#d4f34a] flex items-center justify-center animate-spin">
            <FlatIcon name="refresh" className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-[#14141f]">
            Sistem AI sedang menyusun rekomendasi terbaik untukmu...
          </div>
        </div>
      )}

      {stage >= 1 && stage <= 3 && !isLoadingOpsi && errorAsesmenAI && (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3">
          <p className="text-xs sm:text-sm font-bold text-rose-900">
            {errorAsesmenAI}
          </p>
          <button
            type="button"
            onClick={() => {
              if (stage === 1) mulaiTahap1Angle()
              if (stage === 2)
                lanjutKeTahap2Referensi(
                  contentBrief.chosen_angle,
                  tempStoryInput,
                )
              if (stage === 3) lanjutKeTahap3Hook()
            }}
            className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-5 py-2.5 rounded-xl"
          >
            Coba Muat Ulang
          </button>
        </div>
      )}

      {/* TAHAP 1: PILIH SUDUT PANDANG */}
      {stage === 1 && !isLoadingOpsi && coPilotStage1Data && (
        <div className="space-y-5">
          <div className="bg-[#f4f5f7] p-4 rounded-2xl border border-slate-200">
            <p className="text-xs sm:text-sm font-bold text-[#14141f]">
              {coPilotStage1Data.co_pilot_message}
            </p>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-[#14141f]">
              1. Pilih Sudut Pandang Bahasan yang Paling Kuat:
            </label>
            {(coPilotStage1Data.angle_options || []).map((item, idx) => {
              const terpilih = contentBrief.chosen_angle === item.angle_text
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setContentBrief({
                      ...contentBrief,
                      chosen_angle: item.angle_text,
                    })
                  }
                  className={`cursor-pointer w-full text-left p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                    terpilih
                      ? "bg-[#d4f34a] text-[#14141f] border-[#14141f]"
                      : "bg-white text-[#14141f] border-slate-200 hover:border-[#14141f]"
                  }`}
                >
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase">
                      Pilihan {idx + 1} • {item.type}
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-[#14141f] mt-0.5">
                      {item.angle_text}
                    </div>
                  </div>
                  {terpilih && (
                    <FlatIcon name="check" className="w-4 h-4 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="bg-[#f4f5f7] p-4 rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              2.{" "}
              {coPilotStage1Data.story_prompt_question ||
                "Tambahkan cerita pengalaman singkat (Opsional):"}
            </label>
            <StoryVoiceInput
              rows={2}
              value={tempStoryInput}
              onChange={setTempStoryInput}
              placeholder="Ceritakan singkat atau biarkan kosong agar sistem menyiapkan perumpamaan..."
              onNotify={showToast}
            />
          </div>

          <button
            type="button"
            onClick={() =>
              lanjutKeTahap2Referensi(contentBrief.chosen_angle, tempStoryInput)
            }
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl"
          >
            Lanjut Pilih Fakta Pendukung & Solusi ➔
          </button>
        </div>
      )}

      {/* TAHAP 2: FAKTA PENDUKUNG & SOLUSI */}
      {stage === 2 && !isLoadingOpsi && coPilotStage2Data && (
        <div className="space-y-5">
          <div className="bg-[#f4f5f7] p-4 rounded-2xl border border-slate-200">
            <p className="text-xs sm:text-sm font-bold text-[#14141f]">
              {coPilotStage2Data.co_pilot_message}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              1. Cerita / Perumpamaan Sehari-hari:
            </label>
            {Array.isArray(coPilotStage2Data.relatable_analogies) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
                {coPilotStage2Data.relatable_analogies.map((ana, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTempStoryInput(ana)}
                    className={`cursor-pointer p-3 rounded-xl border text-left text-xs ${
                      tempStoryInput === ana
                        ? "bg-[#f2fce2] border-[#4d6b14] font-bold"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    {ana}
                  </button>
                ))}
              </div>
            )}
            <StoryVoiceInput
              rows={2}
              value={tempStoryInput}
              onChange={setTempStoryInput}
              placeholder="Cerita yang akan dipakai..."
              onNotify={showToast}
            />
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-[#14141f]">
              2. Pilih 1 Fakta / Referensi Pendukung:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(coPilotStage2Data.reference_cards || []).map((refCard, idx) => {
                const terpilih =
                  contentBrief.injected_reference?.title === refCard.title
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setContentBrief({
                        ...contentBrief,
                        injected_reference: refCard,
                      })
                    }
                    className={`cursor-pointer p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                      terpilih
                        ? "bg-[#d4f34a] text-[#14141f] border-[#14141f]"
                        : "bg-white text-[#14141f] border-slate-200"
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-black/10">
                        {refCard.type}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold mt-2">
                        {refCard.title}
                      </h4>
                      <p className="text-xs font-normal text-slate-700 mt-1">
                        {refCard.summary}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              3. Pilih Poin Solusi / Keunggulan Utama:
            </label>
            <div className="space-y-2">
              {(coPilotStage2Data.suggested_solutions || []).map((sol, idx) => {
                const sudahAda = contentBrief.actionable_solution.includes(sol)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const listBaru = sudahAda
                        ? contentBrief.actionable_solution.filter(
                            (s) => s !== sol,
                          )
                        : [...contentBrief.actionable_solution, sol]
                      setContentBrief({
                        ...contentBrief,
                        actionable_solution: listBaru,
                      })
                    }}
                    className={`cursor-pointer w-full text-left p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                      sudahAda
                        ? "bg-[#14141f] text-[#d4f34a] border-[#14141f] font-bold"
                        : "bg-white text-[#14141f] border-slate-200"
                    }`}
                  >
                    <span>{sol}</span>
                    <span>{sudahAda ? "✓ Dipakai" : "+ Pilih"}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={lanjutKeTahap3Hook}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl"
          >
            Lanjut Pilih Kalimat Pembuka & Penutup ➔
          </button>
        </div>
      )}

      {/* TAHAP 3: HOOK & CTA */}
      {stage === 3 && !isLoadingOpsi && coPilotStage3Data && (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              1. Pilih Kalimat Pembuka (3 Detik Pertama):
            </label>
            {(coPilotStage3Data.hook_options || []).map((hk, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setContentBrief({ ...contentBrief, locked_hook: hk })
                  setTempCustomHook("")
                }}
                className={`cursor-pointer w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-2 ${
                  contentBrief.locked_hook === hk && !tempCustomHook
                    ? "bg-[#14141f] text-[#d4f34a] border-[#14141f] font-bold"
                    : "bg-white text-[#14141f] border-slate-200"
                }`}
              >
                <span>"{hk}"</span>
                <span className="text-xs font-bold shrink-0">
                  {contentBrief.locked_hook === hk && !tempCustomHook
                    ? "✓ Dipilih"
                    : "Pilih"}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              2. Pilih Kalimat Penutup & Ajakan Aksi (CTA):
            </label>
            {(coPilotStage3Data.cta_options || []).map((cta, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setContentBrief({ ...contentBrief, call_to_action: cta })
                  setTempCustomCTA("")
                }}
                className={`cursor-pointer w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  contentBrief.call_to_action === cta && !tempCustomCTA
                    ? "bg-[#f2fce2] border-[#4d6b14] font-bold"
                    : "bg-white border-slate-200"
                }`}
              >
                <span>"{cta}"</span>
                <span className="font-bold">
                  {contentBrief.call_to_action === cta && !tempCustomCTA
                    ? "✓ Dipilih"
                    : "Pilih"}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={lanjutKeTahap4FinalBrief}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl"
          >
            Lihat Ringkasan & Buat Skrip ➔
          </button>
        </div>
      )}

      {/* TAHAP 4: RINGKASAN SEBELUM GENERATE */}
      {stage === 4 && (
        <div className="space-y-5">
          <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-3 text-xs">
            <div>
              <span className="text-slate-500">Sudut Pandang:</span>{" "}
              <strong>{contentBrief.chosen_angle}</strong>
            </div>
            <div>
              <span className="text-slate-500">Format Eksekusi:</span>{" "}
              <strong>
                {ugcConfig.aktif
                  ? `Konten UGC Percakapan (${ugcConfig.jumlahOrang} Orang: ${ugcConfig.namaPemeran.join(", ")})`
                  : bentukKontenFinal}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Kalimat Pembuka:</span>{" "}
              <strong className="text-[#4d6b14]">
                "{contentBrief.locked_hook}"
              </strong>
            </div>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleBuatSkripSekarang}
            className="cursor-pointer w-full bg-[#d4f34a] text-[#14141f] font-bold text-sm py-4 rounded-2xl shadow-md flex items-center justify-center gap-2"
          >
            {isGenerating && (
              <FlatIcon name="refresh" className="w-4 h-4 animate-spin" />
            )}
            <span>
              {isGenerating
                ? "Sedang Menyusun Naskah Skrip..."
                : "Buat Skrip Konten Sekarang ➔"}
            </span>
          </button>
        </div>
      )}

      {/* STAGE 5: HASIL SKRIP (REGENERATE MANDIRI PER KERANGKA) */}
      {stage === 5 && hasilSkrip && (
        <div className="space-y-5">
          <div className="bg-[#14141f] text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#d4f34a]">
              {hasilSkrip.bentuk} • {hasilSkrip.waktuDibuat}
            </span>
            <button
              type="button"
              onClick={() => setModeTeleprompter(true)}
              className="cursor-pointer flex items-center gap-1.5 bg-[#d4f34a] text-[#14141f] text-xs font-bold px-4 py-2 rounded-xl"
            >
              <FlatIcon name="tv" className="w-4 h-4" />
              <span>Buka Layar Teleprompter</span>
            </button>
          </div>

          <div className="bg-[#f4f5f7] p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setModeTampilanSkrip("voiceover")}
                className={`cursor-pointer px-3.5 py-2 rounded-lg text-xs font-bold ${
                  modeTampilanSkrip === "voiceover"
                    ? "bg-[#14141f] text-[#d4f34a]"
                    : "text-slate-600"
                }`}
              >
                Naskah Dialog / Voiceover
              </button>
              <button
                type="button"
                onClick={() => setModeTampilanSkrip("teks")}
                className={`cursor-pointer px-3.5 py-2 rounded-lg text-xs font-bold ${
                  modeTampilanSkrip === "teks"
                    ? "bg-[#14141f] text-[#d4f34a]"
                    : "text-slate-600"
                }`}
              >
                Teks di Layar
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={targetKonversiBentuk}
                onChange={(e) => setTargetKonversiBentuk(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
              >
                {SEPULUH_BENTUK_KONTEN.map((b) => (
                  <option key={b.id} value={b.nama}>
                    {b.nama}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleKonversiBentukKontenLain}
                className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3.5 py-2 rounded-xl"
              >
                Ubah Bentuk
              </button>
            </div>
          </div>

          <div className="space-y-3.5">
            {hasilSkrip.segmen.map((seg, idx) => {
              const teksAktif =
                modeTampilanSkrip === "teks" ? seg.teksLayar : seg.voiceover
              const sedangRegenBarisIni = regeneratingIndex === idx

              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#14141f] bg-[#f4f5f7] px-2.5 py-1 rounded-md">
                      {seg.labelMini}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Klik ikon putar untuk mengubah khusus kerangka ini saja
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    <div className="lg:col-span-7 bg-[#d4f34a]/30 border border-[#14141f]/15 rounded-2xl p-4 flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1.5">
                        <textarea
                          rows={4}
                          value={teksAktif}
                          onChange={(e) => {
                            const valBaru = e.target.value
                            const listUpdate = hasilSkrip.segmen.map((s, i) =>
                              i === idx
                                ? modeTampilanSkrip === "teks"
                                  ? { ...s, teksLayar: valBaru }
                                  : { ...s, voiceover: valBaru }
                                : s,
                            )
                            setHasilSkrip({
                              ...hasilSkrip,
                              segmen: listUpdate,
                            })
                          }}
                          className="w-full bg-white/90 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-normal text-[#14141f] leading-relaxed outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={regeneratingIndex !== null}
                        onClick={() =>
                          handleRegenerateSatuKerangka(idx, "skrip")
                        }
                        title="Generate ulang khusus kerangka ini saja"
                        className="cursor-pointer w-9 h-9 rounded-xl bg-white hover:bg-[#14141f] text-[#14141f] hover:text-[#d4f34a] border border-slate-200 flex items-center justify-center shrink-0 transition"
                      >
                        <FlatIcon
                          name="refresh"
                          className={`w-4 h-4 ${
                            sedangRegenBarisIni ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                    </div>

                    <div className="lg:col-span-5 bg-[#f4f5f7] rounded-2xl p-4 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#14141f] block">
                          Arahan Adegan Visual
                        </span>
                        <p className="text-xs font-normal text-slate-700 leading-relaxed">
                          {seg.visual}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={regeneratingIndex !== null}
                        onClick={() =>
                          handleRegenerateSatuKerangka(idx, "visual")
                        }
                        title="Generate ulang visual khusus kerangka ini"
                        className="cursor-pointer w-9 h-9 rounded-xl bg-white hover:bg-[#14141f] text-slate-700 hover:text-[#d4f34a] border border-slate-200 flex items-center justify-center shrink-0 transition"
                      >
                        <FlatIcon
                          name="refresh"
                          className={`w-4 h-4 ${
                            sedangRegenBarisIni ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            disabled={isLearningDiff}
            onClick={handleSimpanEditanUser}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-2xl"
          >
            {isLearningDiff
              ? "Menyimpan..."
              : "Simpan Revisi Skrip & Ingat Gaya Bahasaku"}
          </button>
        </div>
      )}
    </div>
  )
}
