"use client"
import { useState, useEffect, useRef } from "react"
import { FlatIcon, StoryVoiceInput, SelectWithCustom } from "./SharedUI"

// Kompres gambar screenshot marketplace agar ringan (< 200KB) dan cepat dibaca AI
function kompresGambarScreenshot(file) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const maxDim = 900
          let w = img.width
          let h = img.height
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w)
              w = maxDim
            } else {
              w = Math.round((w * maxDim) / h)
              h = maxDim
            }
          }
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext("2d")
          ctx.drawImage(img, 0, 0, w, h)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.75)
          resolve({
            base64: dataUrl.split(",")[1] || "",
            mimeType: "image/jpeg",
            previewUrl: dataUrl,
          })
        }
        img.onerror = () => resolve(null)
        img.src = e.target.result
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    } catch {
      resolve(null)
    }
  })
}

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
  const storageKey = `hookya_draft_asesmen_${userId || "guest"}`

  const [kategoriKonten, setKategoriKonten] = useState("personal")
  const [jenisPromosi, setJenisPromosi] = useState("produk")

  const [rawTopicInput, setRawTopicInput] = useState("")
  const [targetPlatformInput, setTargetPlatformInput] = useState(
    "Reels / TikTok (60 Detik)",
  )

  // State Form Produk (Masalah, Spesifikasi, dan Cara Pakai kini OPSIONAL)
  const [formProduk, setFormProduk] = useState({
    namaProduk: "",
    brand: "",
    kategoriProduk: "Fashion & Aksesoris",
    hargaPromo: "",
    masalahDipecahkan: "",
    keunggulanSpesifikasi: "",
    buktiHasilCaraPakai: "",
    targetUsiaGender: "",
    targetPekerjaanGayaHidup: "",
    targetKeraguanBuyer: "",
    targetAlasanEmosional: "",
  })
  const [tampilkanTargetBuyer, setTampilkanTargetBuyer] = useState(false)

  // State Screenshot Produk & Spesifikasi Marketplace
  const [ssProduk, setSsProduk] = useState(null)
  const [ssSpesifikasi, setSsSpesifikasi] = useState(null)
  const [isScanningSS, setIsScanningSS] = useState(false)

  const [formCampaign, setFormCampaign] = useState({
    namaCampaign: "",
    penyelenggara: "",
    tujuanUtama: "",
    isuAtauMasalah: "",
    ajakanAksiNyata: "",
    targetPartisipanOpsional: "",
  })

  const [ugcConfig, setUgcConfig] = useState({
    aktif: false,
    jumlahOrang: 2,
    namaPemeran: ["Rina", "Dinda"],
  })

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
  const [draftLoaded, setDraftLoaded] = useState(false)

  // ============================================================================
  // 1. AUTO-LOAD & AUTO-SAVE DRAFT (ANTI-HILANG SAAT JARINGAN ERROR / PINDAH APK)
  // ============================================================================
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const savedRaw = localStorage.getItem(storageKey)
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw)
        if (parsed.kategoriKonten) setKategoriKonten(parsed.kategoriKonten)
        if (parsed.jenisPromosi) setJenisPromosi(parsed.jenisPromosi)
        if (parsed.rawTopicInput) setRawTopicInput(parsed.rawTopicInput)
        if (parsed.targetPlatformInput)
          setTargetPlatformInput(parsed.targetPlatformInput)
        if (parsed.formProduk) setFormProduk(parsed.formProduk)
        if (parsed.formCampaign) setFormCampaign(parsed.formCampaign)
        if (parsed.ugcConfig) setUgcConfig(parsed.ugcConfig)
        if (parsed.contentBrief) setContentBrief(parsed.contentBrief)
        if (parsed.coPilotStage1Data)
          setCoPilotStage1Data(parsed.coPilotStage1Data)
        if (parsed.coPilotStage2Data)
          setCoPilotStage2Data(parsed.coPilotStage2Data)
        if (parsed.coPilotStage3Data)
          setCoPilotStage3Data(parsed.coPilotStage3Data)
        if (parsed.tempStoryInput) setTempStoryInput(parsed.tempStoryInput)
        if (
          typeof parsed.savedStage === "number" &&
          parsed.savedStage >= 0 &&
          parsed.savedStage <= 4 &&
          !hasilSkrip
        ) {
          setStage(parsed.savedStage)
        }
      }
    } catch {
      // Abaikan jika gagal baca storage
    } finally {
      setDraftLoaded(true)
    }
  }, [storageKey])

  useEffect(() => {
    if (!draftLoaded || typeof window === "undefined") return
    try {
      const payloadSimpan = {
        kategoriKonten,
        jenisPromosi,
        rawTopicInput,
        targetPlatformInput,
        formProduk,
        formCampaign,
        ugcConfig,
        contentBrief,
        coPilotStage1Data,
        coPilotStage2Data,
        coPilotStage3Data,
        tempStoryInput,
        savedStage: stage <= 4 ? stage : 0,
      }
      localStorage.setItem(storageKey, JSON.stringify(payloadSimpan))
    } catch {
      // Abaikan jika kuota storage penuh
    }
  }, [
    draftLoaded,
    storageKey,
    kategoriKonten,
    jenisPromosi,
    rawTopicInput,
    targetPlatformInput,
    formProduk,
    formCampaign,
    ugcConfig,
    contentBrief,
    coPilotStage1Data,
    coPilotStage2Data,
    coPilotStage3Data,
    tempStoryInput,
    stage,
  ])

  // ============================================================================
  // 2. HANDLER UPLOAD & SCAN SCREENSHOT PRODUK / SPESIFIKASI MARKETPLACE
  // ============================================================================
  const handleUploadSSProduk = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const hasil = await kompresGambarScreenshot(file)
    if (hasil) {
      setSsProduk({ ...hasil, namaFile: file.name })
      showToast("Screenshot produk siap di-scan!")
    }
  }

  const handleUploadSSSpesifikasi = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const hasil = await kompresGambarScreenshot(file)
    if (hasil) {
      setSsSpesifikasi({ ...hasil, namaFile: file.name })
      showToast("Screenshot spesifikasi produk siap di-scan!")
    }
  }

  const handleScanMarketplaceAI = async () => {
    if (!ssProduk && !ssSpesifikasi) {
      alert(
        "Silakan pilih minimal 1 gambar Screenshot Produk dari Marketplace terlebih dahulu.",
      )
      return
    }

    setIsScanningSS(true)
    showToast(
      "AI sedang membaca nama produk, merek & spesifikasi dari screenshot...",
    )

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze_marketplace_screenshots",
          userId,
          namaUser,
          productImageBase64: ssProduk?.base64 || "",
          productImageMime: ssProduk?.mimeType || "image/jpeg",
          specImageBase64: ssSpesifikasi?.base64 || "",
          specImageMime: ssSpesifikasi?.mimeType || "image/jpeg",
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal membaca screenshot")

      setFormProduk((prev) => ({
        ...prev,
        namaProduk: data.namaProduk || prev.namaProduk,
        brand: data.brand || prev.brand,
        hargaPromo: data.hargaPromo || prev.hargaPromo,
        keunggulanSpesifikasi:
          data.keunggulanSpesifikasi || prev.keunggulanSpesifikasi,
        masalahDipecahkan: data.masalahDipecahkan || prev.masalahDipecahkan,
      }))

      showToast(
        "Berhasil! Nama produk, merek, dan spesifikasi otomatis terisi dari screenshot.",
      )
    } catch (err) {
      showToast("Info Scan: " + err.message)
    } finally {
      setIsScanningSS(false)
    }
  }

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
  // TAHAP 1: PENAJAMAN SUDUT PANDANG (MASALAH/SPESIFIKASI/CARA PAKAI OPSIONAL)
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
        if (!formProduk.namaProduk.trim()) {
          alert(
            "Silakan isi Nama Produk terlebih dahulu (atau gunakan fitur Scan Screenshot Produk di atas).",
          )
          return
        }
        topikUtama = `Promosi Produk ${formProduk.namaProduk} (${formProduk.brand || "Pilihan Terbaik"})`
        detailPromosiPayload = formProduk
      } else {
        if (!formCampaign.namaCampaign.trim()) {
          alert("Silakan isi Nama Gerakan / Campaign terlebih dahulu.")
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

  const handleBuatSkripSekarang = async () => {
    if (coins < 1) {
      alert("Saldo Koin kamu tidak mencukupi. Silakan isi ulang koin.")
      setActiveMenu("topup")
      return
    }

    setIsGenerating(true)
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
      showToast("Skrip berhasil dibuat (-1 Koin) dan otomatis tersimpan!")
    } catch (err) {
      showToast(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

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
    <div className="bg-white p-4 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6 w-full max-w-full overflow-hidden">
      {/* BANNER KETERANGAN PENGGUNAAN KOIN & INDIKATOR AUTO-SAVE */}
      <div className="bg-[#f4f5f7] px-4 py-2.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 font-bold text-[#14141f]">
          <FlatIcon name="coin" className="w-4 h-4 text-[#4d6b14]" />
          <span>Info Koin & Auto-Save Aktif:</span>
          <span className="text-[10px] font-normal text-slate-500">
            (Isian form otomatis tersimpan meski pindah aplikasi)
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-slate-600">
          <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
            Scan Produk & Riset: <strong>Gratis</strong>
          </span>
          <span className="bg-[#f2fce2] text-[#4d6b14] px-2 py-0.5 rounded-md font-bold">
            Buat Skrip Utuh: 1 Koin
          </span>
        </div>
      </div>

      {/* HEADER NAVIGASI TAHAP */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <h2 className="text-base sm:text-xl font-bold text-[#14141f] break-words">
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

      {/* STAGE 0 */}
      {stage === 0 && (
        <div className="space-y-6">
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

          {/* MODE UGC PERCAKAPAN */}
          <div className="bg-[#f0eeff] border border-[#5b4bc4]/20 p-4 sm:p-5 rounded-3xl space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#14141f] text-[#d4f34a] flex items-center justify-center shrink-0">
                  <FlatIcon name="users" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#14141f]">
                    Mode Konten UGC (Naskah Dialog Percakapan)
                  </h3>
                  <p className="text-xs font-normal text-slate-600">
                    Hasilkan teks percakapan beberapa orang yang mengalir
                    natural sesuai alur copywriting.
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
                <span>Aktifkan Format Percakapan UGC</span>
              </label>
            </div>

            {ugcConfig.aktif && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs font-bold text-[#14141f]">
                    Jumlah Orang dalam Percakapan:
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

          {/* FORM PERSONAL */}
          {kategoriKonten === "personal" && (
            <div className="space-y-5">
              <div className="bg-[#f4f5f7] p-4 sm:p-5 rounded-3xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#14141f]">
                      10 Referensi Ide Topik Sesuai Profilmu (Geser ke Samping)
                    </h3>
                    <p className="text-xs font-normal text-slate-600">
                      Klik salah satu kartu di bawah atau ketik sendiri topikmu
                      pada kolom di bawahnya.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isLoadingIdeTopik}
                      onClick={handleGenerate10IdeTopikAI}
                      className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3 py-2 rounded-xl"
                    >
                      {isLoadingIdeTopik
                        ? "Memproses..."
                        : "Perbarui 10 Ide (Gratis)"}
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

          {/* FORM PROMOSI PRODUK VS CAMPAIGN */}
          {kategoriKonten === "affiliate" && (
            <div className="space-y-5">
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
                    Bisa scan screenshot marketplace otomatis atau ketik manual.
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
                    Memasarkan gerakan positif, acara, atau ajakan komunitas.
                  </p>
                </button>
              </div>

              {jenisPromosi === "produk" && (
                <div className="bg-[#f4f5f7] p-4 sm:p-5 rounded-3xl border border-slate-200 space-y-4">
                  {/* FITUR BARU: SCAN SCREENSHOT PRODUK & SPESIFIKASI DARI MARKETPLACE */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold bg-[#f2fce2] text-[#4d6b14] px-2 py-0.5 rounded">
                          FITUR CEPAT AFFILIATOR
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-[#14141f] mt-1">
                          Isi Otomatis dari Screenshot Marketplace (Shopee /
                          TikTok Shop / Tokopedia)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Unggah screenshot halaman produk & spesifikasi, AI
                          akan otomatis menuliskan nama produk, merek, dan
                          keunggulannya untukmu.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Kotak 1: Screenshot Produk Utama */}
                      <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-[#14141f] bg-[#f4f5f7] rounded-2xl p-3.5 flex items-center gap-3 transition">
                        {ssProduk?.previewUrl ? (
                          <img
                            src={ssProduk.previewUrl}
                            alt="SS Produk"
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-300"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#14141f] text-[#d4f34a] flex items-center justify-center shrink-0">
                            <FlatIcon name="upload" className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#14141f] truncate">
                            {ssProduk
                              ? ssProduk.namaFile
                              : "1. Upload Screenshot Produk"}
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            Untuk membaca Nama Produk, Merk & Harga
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadSSProduk}
                          className="hidden"
                        />
                      </label>

                      {/* Kotak 2: Screenshot Spesifikasi Produk (Opsional) */}
                      <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-[#14141f] bg-[#f4f5f7] rounded-2xl p-3.5 flex items-center gap-3 transition">
                        {ssSpesifikasi?.previewUrl ? (
                          <img
                            src={ssSpesifikasi.previewUrl}
                            alt="SS Spesifikasi"
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-300"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-200 text-[#14141f] flex items-center justify-center shrink-0">
                            <FlatIcon name="upload" className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#14141f] truncate">
                            {ssSpesifikasi
                              ? ssSpesifikasi.namaFile
                              : "2. Screenshot Spesifikasi (Opsional)"}
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            Untuk membaca Detail Bahan & Keunggulan
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadSSSpesifikasi}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {(ssProduk || ssSpesifikasi) && (
                      <button
                        type="button"
                        disabled={isScanningSS}
                        onClick={handleScanMarketplaceAI}
                        className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                      >
                        {isScanningSS && (
                          <FlatIcon
                            name="refresh"
                            className="w-4 h-4 animate-spin"
                          />
                        )}
                        <span>
                          {isScanningSS
                            ? "Sedang Membaca Screenshot Marketplace..."
                            : "✨ Ekstrak Nama Produk, Merk & Spesifikasi dari Screenshot (Gratis)"}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* FORM DETAIL PRODUK (MASALAH, SPESIFIKASI & CARA PAKAI KINI OPSIONAL) */}
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
                        Merek / Brand / Toko (Opsional)
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
                        Harga & Promo Saat Ini (Opsional)
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
                        placeholder="Contoh: Rp 300rb (Gratis Ongkir)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Masalah Utama yang Diselesaikan (Opsional):
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
                        placeholder="Opsional (Jika dikosongkan, AI akan merumuskan otomatis)..."
                        onNotify={showToast}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Detail Spesifikasi, Bahan & Keunggulan (Opsional):
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
                        placeholder="Opsional (Otomatis terisi jika scan screenshot spesifikasi)..."
                        onNotify={showToast}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#14141f] mb-1">
                      Cara Pakai / Bukti Hasil Pemakaian (Opsional):
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
                      placeholder="Opsional: Ceritakan singkat cara pakai atau hasilnya..."
                      onNotify={showToast}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() =>
                        setTampilkanTargetBuyer(!tampilkanTargetBuyer)
                      }
                      className="cursor-pointer flex items-center justify-between w-full bg-white p-3.5 rounded-2xl border border-slate-200 text-xs font-bold text-[#14141f]"
                    >
                      <span>
                        Detail Target Pembeli / Target Buyer (Opsional — Klik
                        untuk Mengisi)
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
                        <input
                          type="text"
                          value={formProduk.targetUsiaGender}
                          onChange={(e) =>
                            setFormProduk({
                              ...formProduk,
                              targetUsiaGender: e.target.value,
                            })
                          }
                          placeholder="Usia & Gender Target Pembeli (Opsional)"
                          className="bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={formProduk.targetPekerjaanGayaHidup}
                          onChange={(e) =>
                            setFormProduk({
                              ...formProduk,
                              targetPekerjaanGayaHidup: e.target.value,
                            })
                          }
                          placeholder="Pekerjaan / Gaya Hidup Pembeli (Opsional)"
                          className="bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={formProduk.targetKeraguanBuyer}
                          onChange={(e) =>
                            setFormProduk({
                              ...formProduk,
                              targetKeraguanBuyer: e.target.value,
                            })
                          }
                          placeholder="Keraguan Terbesar Mereka Sebelum Membeli (Opsional)"
                          className="bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={formProduk.targetAlasanEmosional}
                          onChange={(e) =>
                            setFormProduk({
                              ...formProduk,
                              targetAlasanEmosional: e.target.value,
                            })
                          }
                          placeholder="Alasan Emosional Mereka Ingin Membeli (Opsional)"
                          className="bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {jenisPromosi === "campaign" && (
                <div className="bg-[#f4f5f7] p-4 sm:p-5 rounded-3xl border border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold text-[#14141f]">
                    Informasi Campaign / Gerakan / Acara
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <input
                      type="text"
                      value={formCampaign.namaCampaign}
                      onChange={(e) =>
                        setFormCampaign({
                          ...formCampaign,
                          namaCampaign: e.target.value,
                        })
                      }
                      placeholder="Nama Gerakan / Campaign / Acara (Wajib) *"
                      className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                    />
                    <input
                      type="text"
                      value={formCampaign.penyelenggara}
                      onChange={(e) =>
                        setFormCampaign({
                          ...formCampaign,
                          penyelenggara: e.target.value,
                        })
                      }
                      placeholder="Penyelenggara / Komunitas (Opsional)"
                      className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                    />
                  </div>
                  <StoryVoiceInput
                    rows={2}
                    value={formCampaign.isuAtauMasalah}
                    onChange={(val) =>
                      setFormCampaign({ ...formCampaign, isuAtauMasalah: val })
                    }
                    placeholder="Isu atau kebiasaan yang ingin diubah (Opsional)..."
                    onNotify={showToast}
                  />
                  <StoryVoiceInput
                    rows={2}
                    value={formCampaign.tujuanUtama}
                    onChange={(val) =>
                      setFormCampaign({ ...formCampaign, tujuanUtama: val })
                    }
                    placeholder="Tujuan utama & manfaat mengikuti gerakan/campaign ini (Opsional)..."
                    onNotify={showToast}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <input
                      type="text"
                      value={formCampaign.ajakanAksiNyata}
                      onChange={(e) =>
                        setFormCampaign({
                          ...formCampaign,
                          ajakanAksiNyata: e.target.value,
                        })
                      }
                      placeholder="Ajakan Aksi Nyata (Opsional)"
                      className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                    />
                    <input
                      type="text"
                      value={formCampaign.targetPartisipanOpsional}
                      onChange={(e) =>
                        setFormCampaign({
                          ...formCampaign,
                          targetPartisipanOpsional: e.target.value,
                        })
                      }
                      placeholder="Target Partisipan yang Diajak (Opsional)"
                      className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                    />
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
            Lanjut Pilih Sudut Pandang Bahasan (Gratis) ➔
          </button>
        </div>
      )}

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

      {/* TAHAP 1 */}
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
            Lanjut Pilih Fakta Pendukung & Solusi (Gratis) ➔
          </button>
        </div>
      )}

      {/* TAHAP 2 */}
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
            <input
              type="text"
              value={tempCustomSolution}
              onChange={(e) => setTempCustomSolution(e.target.value)}
              placeholder="Tambahkan poin solusi versi kamu sendiri (opsional)..."
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
            />
          </div>

          <button
            type="button"
            onClick={lanjutKeTahap3Hook}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl"
          >
            Lanjut Pilih Alur Copywriting & Kalimat Pembuka (Gratis) ➔
          </button>
        </div>
      )}

      {/* TAHAP 3 */}
      {stage === 3 && !isLoadingOpsi && coPilotStage3Data && (
        <div className="space-y-5">
          <div className="bg-[#f4f5f7] p-4 rounded-2xl border border-slate-200 space-y-1">
            <p className="text-xs sm:text-sm font-bold text-[#14141f]">
              {coPilotStage3Data.co_pilot_message}
            </p>
            <p className="text-xs text-slate-600">
              {coPilotStage3Data.framework_reason}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              1. Pilih Kerangka Alur Cerita Copywriting:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: "PAS_RELATABLE_BRIDGE",
                  judul: "Masalah ➔ Cerita Relate ➔ Fakta ➔ Solusi",
                  ket: "Membuat penonton merasa dipahami lalu diberi jalan keluar yang logis.",
                },
                {
                  id: "HSO_STORY",
                  judul: "Alur Cerita Pengalaman (Hook - Story - Offer)",
                  ket: "Mengalir dari pengalaman nyata menuju kesimpulan atau rekomendasi.",
                },
                {
                  id: "CONTRARIAN_MYTH_BUSTER",
                  judul: "Bongkar Mitos Umum vs Fakta Sebenarnya",
                  ket: "Mematahkan anggapan keliru dengan bukti yang membuka mata penonton.",
                },
                {
                  id: "BAB_TRANSFORMATION",
                  judul: "Perubahan Sebelum vs Sesudah (Before - After)",
                  ket: "Menunjukkan perbandingan kondisi awal dan hasil nyata setelah perubahan.",
                },
              ].map((fw) => (
                <button
                  key={fw.id}
                  type="button"
                  onClick={() =>
                    setContentBrief({
                      ...contentBrief,
                      selected_framework: fw.id,
                    })
                  }
                  className={`cursor-pointer p-3.5 rounded-2xl border text-left transition ${
                    contentBrief.selected_framework === fw.id
                      ? "bg-[#d4f34a] text-[#14141f] border-[#14141f]"
                      : "bg-white text-[#14141f] border-slate-200"
                  }`}
                >
                  <div className="text-xs font-bold">{fw.judul}</div>
                  <div className="text-[11px] font-normal text-slate-600 mt-0.5">
                    {fw.ket}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              2. Pilih Kalimat Pembuka (3 Detik Pertama):
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
            <input
              type="text"
              value={tempCustomHook}
              onChange={(e) => setTempCustomHook(e.target.value)}
              placeholder="Atau ketik sendiri kalimat pembuka versimu di sini..."
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              3. Pilih Kalimat Penutup & Ajakan Aksi (CTA):
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
            <input
              type="text"
              value={tempCustomCTA}
              onChange={(e) => setTempCustomCTA(e.target.value)}
              placeholder="Atau ketik sendiri kalimat ajakan penutup versimu di sini..."
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={lanjutKeTahap4FinalBrief}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl"
          >
            Lihat Ringkasan Rancangan Skrip ➔
          </button>
        </div>
      )}

      {/* TAHAP 4 */}
      {stage === 4 && (
        <div className="space-y-5">
          <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-3 text-xs">
            <div>
              <span className="text-slate-500">Sudut Pandang:</span>{" "}
              <strong>{contentBrief.chosen_angle}</strong>
            </div>
            <div>
              <span className="text-slate-500">Alur Copywriting:</span>{" "}
              <strong>{contentBrief.selected_framework}</strong>
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
                : "Buat Skrip Konten Sekarang (Pakai 1 Koin) ➔"}
            </span>
          </button>
        </div>
      )}

      {/* STAGE 5 */}
      {stage === 5 && hasilSkrip && (
        <div className="space-y-5 w-full max-w-full overflow-hidden">
          <div className="bg-[#14141f] text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#d4f34a] break-words">
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

          <div className="bg-[#f4f5f7] p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="grid grid-cols-2 sm:inline-flex bg-white p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setModeTampilanSkrip("voiceover")}
                className={`cursor-pointer px-3 py-2 rounded-lg text-xs font-bold text-center ${
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
                className={`cursor-pointer px-3 py-2 rounded-lg text-xs font-bold text-center ${
                  modeTampilanSkrip === "teks"
                    ? "bg-[#14141f] text-[#d4f34a]"
                    : "text-slate-600"
                }`}
              >
                Teks di Layar
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto min-w-0">
              <select
                value={targetKonversiBentuk}
                onChange={(e) => setTargetKonversiBentuk(e.target.value)}
                className="w-full sm:w-64 min-w-0 max-w-full truncate bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
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
                className="cursor-pointer w-full sm:w-auto bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2.5 rounded-xl shrink-0"
              >
                Ubah Bentuk (Gratis)
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
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#14141f] bg-[#f4f5f7] px-2.5 py-1 rounded-md">
                      {seg.labelMini}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Klik ikon putar untuk ganti variasi kerangka ini (Gratis)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    <div className="lg:col-span-7 bg-[#d4f34a]/30 border border-[#14141f]/15 rounded-2xl p-3.5 sm:p-4 flex items-start justify-between gap-2.5">
                      <div className="flex-1 min-w-0 space-y-1.5">
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

                    <div className="lg:col-span-5 bg-[#f4f5f7] rounded-2xl p-3.5 sm:p-4 flex items-start justify-between gap-2.5">
                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="text-xs font-bold text-[#14141f] block">
                          Arahan Adegan Visual
                        </span>
                        <p className="text-xs font-normal text-slate-700 leading-relaxed break-words">
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
              : "Simpan Revisi Skrip & Ingat Gaya Bahasaku (Gratis)"}
          </button>
        </div>
      )}
    </div>
  )
}
