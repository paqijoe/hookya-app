"use client"
import { useState, useEffect, useRef } from "react"
import {
  FlatIcon,
  StoryVoiceInput,
  SelectWithCustom,
  AILoadingBox,
} from "./SharedUI"

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
  isPremiumUser = true,
  onTriggerUpgradeVIP,
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
  const firstTextareaRef = useRef(null)
  const storageKey = `hookya_draft_asesmen_${userId || "guest"}`

  const [kategoriKonten, setKategoriKonten] = useState("personal")
  const [jenisPromosi, setJenisPromosi] = useState("produk")

  const [rawTopicInput, setRawTopicInput] = useState("")
  const [targetPlatformInput, setTargetPlatformInput] = useState(
    "Reels / TikTok (60 Detik)",
  )

  // Jembatan Lintas Topik (Untuk membahas topik dadakan di luar keahlian, misal Kehutanan/Berita)
  const [posisiBicara, setPosisiBicara] = useState(
    "Sesuai Positioning Utama Saya",
  )
  const [sumberBeritaMentah, setSumberBeritaMentah] = useState("")
  const [tampilkanJembatanTopik, setTampilkanJembatanTopik] = useState(false)

  // Balasan Chat Bebas ke Produser AI
  const [chatReplyUser, setChatReplyUser] = useState("")

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
  const [regenCount, setRegenCount] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
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

  // Komponen Input Adaptif (Mengunci fitur Mic untuk paket di bawah Rp20.000)
  const renderAdaptiveVoiceInput = ({
    rows = 2,
    value,
    onChange,
    placeholder,
  }) => {
    if (isPremiumUser) {
      return (
        <StoryVoiceInput
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onNotify={showToast}
        />
      )
    }
    return (
      <div className="relative w-full">
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#f4f5f7] border border-slate-200 rounded-2xl p-3.5 pr-14 text-xs sm:text-sm font-normal text-[#14141f] placeholder:text-slate-400 focus:bg-white focus:border-[#14141f] outline-none transition leading-relaxed"
        />
        <button
          type="button"
          onClick={onTriggerUpgradeVIP}
          title="Fitur Mikrofon Suara khusus Paket Rp25.000+"
          className="cursor-pointer absolute right-2.5 bottom-2.5 w-9 h-9 rounded-xl bg-slate-200 hover:bg-[#14141f] text-[#14141f] hover:text-[#d4f34a] flex items-center justify-center text-xs font-bold transition"
        >
          👑
        </button>
      </div>
    )
  }

  // AUTO-LOAD & AUTO-SAVE DRAFT
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const savedRaw = localStorage.getItem(storageKey)
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw)
        if (parsed.kategoriKonten) setKategoriKonten(parsed.kategoriKonten)
        if (parsed.jenisPromosi) setJenisPromosi(parsed.jenisPromosi)
        if (parsed.rawTopicInput) setRawTopicInput(parsed.rawTopicInput)
        if (parsed.posisiBicara) setPosisiBicara(parsed.posisiBicara)
        if (parsed.sumberBeritaMentah)
          setSumberBeritaMentah(parsed.sumberBeritaMentah)
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
      // Abaikan
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
        posisiBicara,
        sumberBeritaMentah,
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
      // Abaikan
    }
  }, [
    draftLoaded,
    storageKey,
    kategoriKonten,
    jenisPromosi,
    rawTopicInput,
    posisiBicara,
    sumberBeritaMentah,
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

  const otomatisSimpanKeArsipUser = async (skripTarget, pesanNotif) => {
    if (!skripTarget) return
    const tersimpan = await simpanAtauUpdateSkripDatabase(skripTarget)
    setHasilSkrip(tersimpan)
    setKoleksiSkripTersimpan((prev) => {
      const sudahAda = prev.some((item) => item.id === tersimpan.id)
      if (sudahAda) {
        return prev.map((item) => (item.id === tersimpan.id ? tersimpan : item))
      }
      return [tersimpan, ...prev]
    })
    if (pesanNotif) showToast(pesanNotif)
  }

  // Cetak PDF (Dilengkapi Watermark untuk Member Standar < Rp20.000)
  const handleCetakPDF = async () => {
    if (!hasilSkrip) return
    await otomatisSimpanKeArsipUser(
      hasilSkrip,
      "Skrip otomatis disimpan ke arsip & menyiapkan PDF...",
    )

    const win = window.open("", "_blank", "width=800,height=900")
    if (!win) {
      alert("Izinkan pop-up di browser untuk mencetak PDF.")
      return
    }

    const barisHTML = (hasilSkrip.segmen || [])
      .map(
        (s) => `
        <div style="border:1px solid #cbd5e1; border-radius:12px; padding:14px; margin-bottom:12px;">
          <div style="font-weight:bold; font-size:12px; color:#475569; margin-bottom:6px;">${s.labelMini}</div>
          <div style="font-size:14px; line-height:1.6; white-space:pre-line; margin-bottom:8px;"><strong>Naskah / Dialog:</strong><br/>${
            modeTampilanSkrip === "teks" ? s.teksLayar : s.voiceover
          }</div>
          <div style="font-size:12px; color:#334155; background:#f8fafc; padding:8px; border-radius:8px;"><strong>Arahan Visual:</strong> ${s.visual}</div>
        </div>`,
      )
      .join("")

    const watermarkFooter = !isPremiumUser
      ? `<p style="margin-top:24px; padding-top:12px; border-top:1px dashed #cbd5e1; font-size:12px; color:#475569; font-weight:bold;">✨ Skrip ini diracik dalam 5 detik menggunakan AI Copywriting Hookya.site</p>`
      : ""

    win.document.write(`
      <html>
        <head>
          <title>Skrip Hookya - ${hasilSkrip.judul}</title>
        </head>
        <body style="font-family:sans-serif; padding:24px; color:#14141f;">
          <h2 style="margin-bottom:4px;">${hasilSkrip.judul}</h2>
          <p style="font-size:12px; color:#64748b; margin-top:0; margin-bottom:20px;">Dibuat di Hookya.site • ${hasilSkrip.waktuDibuat}</p>
          ${barisHTML}
          ${watermarkFooter}
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `)
    win.document.close()
  }

  const handleUploadSSProduk = async (e) => {
    if (!isPremiumUser) {
      onTriggerUpgradeVIP()
      return
    }
    const file = e.target.files?.[0]
    if (!file) return
    const hasil = await kompresGambarScreenshot(file)
    if (hasil) {
      setSsProduk({ ...hasil, namaFile: file.name })
      showToast("Screenshot produk siap diekstrak!")
    }
  }

  const handleUploadSSSpesifikasi = async (e) => {
    if (!isPremiumUser) {
      onTriggerUpgradeVIP()
      return
    }
    const file = e.target.files?.[0]
    if (!file) return
    const hasil = await kompresGambarScreenshot(file)
    if (hasil) {
      setSsSpesifikasi({ ...hasil, namaFile: file.name })
      showToast("Screenshot spesifikasi produk siap diekstrak!")
    }
  }

  const handleScanMarketplaceAI = async () => {
    if (!isPremiumUser) {
      onTriggerUpgradeVIP()
      return
    }
    if (!ssProduk && !ssSpesifikasi) {
      alert(
        "Silakan pilih minimal 1 gambar Screenshot Produk dari Marketplace terlebih dahulu.",
      )
      return
    }

    setIsScanningSS(true)
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
        "Nama produk, merek, dan spesifikasi otomatis terisi dari screenshot!",
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
    showToast("Sedang meracik 10 ide topik sesuai Positioning & Audiensmu...")
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

  // TAHAP 1: MULAI DISKUSI PRODUSER + JEMBATAN LINTAS TOPIK
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
      const instruksiJembatan =
        posisiBicara !== "Sesuai Positioning Utama Saya"
          ? ` [ INSTRUKSI POSISI BICARA KHUSUS: Gunakan mode "${posisiBicara}". Karena ini mungkin topik lintas bidang/dadakan, JANGAN terdengar seperti pakar kaku atau berita TV. Terjemahkan istilah teknis menjadi analogi sehari-hari yang dekat dengan keahlian kreator! ]`
          : ""
      const lampiranBerita = sumberBeritaMentah.trim()
        ? ` [ SUMBER BERITA/FAKTA MENTAH YANG INGIN DIBAHAS: "${sumberBeritaMentah.trim()}" ]`
        : ""

      topikUtama = `${rawTopicInput.trim()}${instruksiJembatan}${lampiranBerita}`
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
            chatReplyUser,
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
        core_idea: data.refined_core_idea || rawTopicInput.trim() || topikUtama,
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
      const firstHookObj = data.hook_options?.[0]
      const firstHookText =
        typeof firstHookObj === "string"
          ? firstHookObj
          : firstHookObj?.text || prev.locked_hook

      const firstCtaObj = data.cta_options?.[0]
      const firstCtaText =
        typeof firstCtaObj === "string"
          ? firstCtaObj
          : firstCtaObj?.text || prev.call_to_action

      setContentBrief((prev) => ({
        ...prev,
        selected_framework:
          data.recommended_framework || "PAS_RELATABLE_BRIDGE",
        locked_hook: firstHookText,
        call_to_action: firstCtaText,
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
      alert("Saldo Koin kamu belum mencukupi. Silakan isi ulang koin.")
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
        scriptScore: data.script_score || null,
        uploadPack: data.upload_pack || null,
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

  // SETIAP 3X REGENERATE KERANGKA OTOMATIS TERHITUNG 1 KOIN
  const handleRegenerateSatuKerangka = async (indexBaris, fokusTarget) => {
    if (!hasilSkrip) return
    const hitunganBaru = regenCount + 1

    if (hitunganBaru % 3 === 0) {
      if (coins < 1) {
        alert(
          "Saldo koin kamu tidak mencukupi untuk generate ulang ke-3. Silakan isi ulang koin.",
        )
        setActiveMenu("topup")
        return
      }
      await updateKoinDatabase(coins - 1)
    }
    setRegenCount(hitunganBaru)

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
      await otomatisSimpanKeArsipUser(
        hasilSkrip,
        "Revisi skrip disimpan ke arsip & gaya bicaramu diperbarui!",
      )
    } finally {
      setIsLearningDiff(false)
    }
  }

  // Komponen Balon Chat Produser Manusiawi
  const renderProducerChatBubble = (pesanProduser, subPesan) => (
    <div className="bg-[#14141f] text-white p-4 sm:p-5 rounded-3xl flex items-start gap-3.5 shadow-md">
      <div className="w-10 h-10 rounded-2xl bg-[#d4f34a] text-[#14141f] font-bold text-xs flex items-center justify-center shrink-0">
        AI
      </div>
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#d4f34a]">
            Produser Pribadi Hookya
          </span>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
            100% Personal
          </span>
        </div>
        <p className="text-xs sm:text-sm font-normal leading-relaxed text-white">
          {pesanProduser}
        </p>
        {subPesan && (
          <p className="text-xs text-[#d4f34a] pt-1 font-bold">{subPesan}</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="bg-white p-4 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <h2 className="text-base sm:text-xl font-bold text-[#14141f] break-words">
          {stage === 0 && "Buat Skrip Konten Baru"}
          {stage === 1 && "Diskusi Tahap 1: Pilih Sudut Pandang (Angle)"}
          {stage === 2 && "Diskusi Tahap 2: Analogi Relate, Bukti & USP"}
          {stage === 3 &&
            "Diskusi Tahap 3: 6 Teori Hook Copywriting & Jenis CTA"}
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
                  Edukasi, Opini Lintas Topik, Cerita Harian & Hobi
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

          {/* FORM PERSONAL + JEMBATAN LINTAS TOPIK (UNTUK TOPIK DADAKAN DI LUAR KEAHLIAN) */}
          {kategoriKonten === "personal" && (
            <div className="space-y-5">
              <div className="bg-[#f4f5f7] p-4 sm:p-5 rounded-3xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#14141f]">
                      10 Referensi Ide Topik Sesuai Positioning & Audiensmu
                    </h3>
                    <p className="text-xs font-normal text-slate-600">
                      Klik salah satu kartu di bawah atau ketik bebas topik
                      dadakan apa pun di kolom bawah.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleGenerate10IdeTopikAI}
                      className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5"
                    >
                      {isLoadingIdeTopik && (
                        <FlatIcon
                          name="refresh"
                          className="w-3.5 h-3.5 animate-spin"
                        />
                      )}
                      <span>
                        {isLoadingIdeTopik ? "Memproses..." : "Perbarui 10 Ide"}
                      </span>
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
                    Ketik Bebas Topik yang Ingin Kamu Bahas (Termasuk Topik
                    Dadakan / Lintas Bidang):
                  </label>
                  {renderAdaptiveVoiceInput({
                    rows: 2,
                    value: rawTopicInput,
                    onChange: setRawTopicInput,
                    placeholder:
                      "Contoh: Isu kerusakan hutan Kalimantan, kebiasaan menabung, atau topik viral hari ini...",
                  })}
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

              {/* FITUR JEMBATAN LINTAS TOPIK (PERSPECTIVE BRIDGE) */}
              <div className="bg-[#f2fce2] border border-[#4d6b14]/25 p-4 rounded-3xl space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    setTampilkanJembatanTopik(!tampilkanJembatanTopik)
                  }
                  className="cursor-pointer w-full flex items-center justify-between text-left"
                >
                  <div>
                    <span className="text-[10px] font-bold bg-[#14141f] text-[#d4f34a] px-2 py-0.5 rounded">
                      JEMBATAN LINTAS TOPIK (OPSIONAL)
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#14141f] mt-1">
                      Ingin Membahas Topik di Luar Keahlianmu (Misal: Kehutanan,
                      Berita Viral, Sains)? Klik di Sini
                    </h4>
                  </div>
                  <FlatIcon
                    name="chevronDown"
                    className={`w-4 h-4 transition ${
                      tampilkanJembatanTopik ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {tampilkanJembatanTopik && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3.5 pt-3">
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                        Pilih Posisi Bicaramu pada Topik Ini (Agar Tidak
                        Terdengar Kaku / Sok Pakar):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          {
                            id: "Sesuai Positioning Utama Saya",
                            ket: "Gunakan keahlian & otoritas utamaku seperti biasa.",
                          },
                          {
                            id: "Pengamat Kritis / Warga Biasa (Bahas Topik di Luar Keahlian)",
                            ket: "Bicara jujur sebagai orang awam yang kritis & meresahkan dampaknya.",
                          },
                          {
                            id: "Jembatan Lintas Bidang (Tarik Topik Ini ke Analogi Keahlianku)",
                            ket: "Bahas isu ini menggunakan kacamata/analogi bisnis, olahraga, atau keseharianku.",
                          },
                          {
                            id: "Storyteller / Kurator Kasus & Berita Viral",
                            ket: "Ceritakan ulang fakta/berita rumit dengan bahasa tongkrongan yang seru.",
                          },
                        ].map((pos) => (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => setPosisiBicara(pos.id)}
                            className={`cursor-pointer p-3 rounded-xl border text-left transition ${
                              posisiBicara === pos.id
                                ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                                : "bg-[#f4f5f7] text-[#14141f] border-transparent"
                            }`}
                          >
                            <div className="text-xs font-bold">{pos.id}</div>
                            <div className="text-[11px] opacity-80 mt-0.5">
                              {pos.ket}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Tempel Cuplikan Berita / Fakta Mentah yang Ingin Kamu
                        Bahas (Opsional):
                      </label>
                      {renderAdaptiveVoiceInput({
                        rows: 2,
                        value: sumberBeritaMentah,
                        onChange: setSumberBeritaMentah,
                        placeholder:
                          "Copy-paste potongan berita/fakta di sini, AI akan menerjemahkannya menjadi bahasa ngobrol aslimu...",
                      })}
                    </div>
                  </div>
                )}
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
                  {/* SCAN SCREENSHOT PRODUK MARKETPLACE (DIKUNCI UNTUK MEMBER DI BAWAH 20RB) */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold bg-[#f2fce2] text-[#4d6b14] px-2 py-0.5 rounded">
                          FITUR CEPAT AFFILIATOR{" "}
                          {!isPremiumUser && "👑 KHUSUS PAKET Rp25.000+"}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-[#14141f] mt-1">
                          Isi Otomatis dari Screenshot Marketplace (Shopee /
                          TikTok Shop / Tokopedia)
                        </h4>
                      </div>
                      {!isPremiumUser && (
                        <button
                          type="button"
                          onClick={onTriggerUpgradeVIP}
                          className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3 py-1.5 rounded-xl"
                        >
                          👑 Buka Fitur Scan Produk
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        onClick={(e) => {
                          if (!isPremiumUser) {
                            e.preventDefault()
                            onTriggerUpgradeVIP()
                          }
                        }}
                        className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-[#14141f] bg-[#f4f5f7] rounded-2xl p-3.5 flex items-center gap-3 transition"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#14141f] text-[#d4f34a] flex items-center justify-center shrink-0">
                          {isPremiumUser ? (
                            <FlatIcon name="upload" className="w-4 h-4" />
                          ) : (
                            <span>👑</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#14141f] truncate">
                            {ssProduk
                              ? ssProduk.namaFile
                              : "1. Upload Screenshot Produk"}
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            Deteksi Nama Produk, Merk & Harga
                          </span>
                        </div>
                        {isPremiumUser && (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadSSProduk}
                            className="hidden"
                          />
                        )}
                      </label>

                      <label
                        onClick={(e) => {
                          if (!isPremiumUser) {
                            e.preventDefault()
                            onTriggerUpgradeVIP()
                          }
                        }}
                        className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-[#14141f] bg-[#f4f5f7] rounded-2xl p-3.5 flex items-center gap-3 transition"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-200 text-[#14141f] flex items-center justify-center shrink-0">
                          {isPremiumUser ? (
                            <FlatIcon name="upload" className="w-4 h-4" />
                          ) : (
                            <span>👑</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#14141f] truncate">
                            {ssSpesifikasi
                              ? ssSpesifikasi.namaFile
                              : "2. Screenshot Spesifikasi (Opsional)"}
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            Deteksi Detail Bahan & Keunggulan
                          </span>
                        </div>
                        {isPremiumUser && (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadSSSpesifikasi}
                            className="hidden"
                          />
                        )}
                      </label>
                    </div>

                    {(ssProduk || ssSpesifikasi) &&
                      (isScanningSS ? (
                        <AILoadingBox
                          label="Sedang membaca nama produk, merek & spesifikasi dari screenshot..."
                          onRefresh={handleScanMarketplaceAI}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={handleScanMarketplaceAI}
                          className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] text-xs font-bold py-3 rounded-xl"
                        >
                          ✨ Ekstrak Nama Produk, Merk & Spesifikasi dari
                          Screenshot
                        </button>
                      ))}
                  </div>

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
                      {renderAdaptiveVoiceInput({
                        rows: 2,
                        value: formProduk.masalahDipecahkan,
                        onChange: (val) =>
                          setFormProduk({
                            ...formProduk,
                            masalahDipecahkan: val,
                          }),
                        placeholder: "Opsional...",
                      })}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Detail Spesifikasi, Bahan & Keunggulan (Opsional):
                      </label>
                      {renderAdaptiveVoiceInput({
                        rows: 2,
                        value: formProduk.keunggulanSpesifikasi,
                        onChange: (val) =>
                          setFormProduk({
                            ...formProduk,
                            keunggulanSpesifikasi: val,
                          }),
                        placeholder: "Opsional...",
                      })}
                    </div>
                  </div>
                </div>
              )}

              {jenisPromosi === "campaign" && (
                <div className="bg-[#f4f5f7] p-4 sm:p-5 rounded-3xl border border-slate-200 space-y-4">
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
                  {renderAdaptiveVoiceInput({
                    rows: 2,
                    value: formCampaign.tujuanUtama,
                    onChange: (val) =>
                      setFormCampaign({ ...formCampaign, tujuanUtama: val }),
                    placeholder:
                      "Tujuan utama & manfaat mengikuti gerakan/campaign ini (Opsional)...",
                  })}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={mulaiTahap1Angle}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl shadow-sm"
          >
            Mulai Diskusi dengan Produser AI ➔
          </button>
        </div>
      )}

      {/* LOADING DENGAN TIMER DETIK KE-30 & KLIK IKON PUTAR UNTUK REFRESH */}
      {stage >= 1 && stage <= 3 && isLoadingOpsi && (
        <AILoadingBox
          label="Produser AI sedang meracik strategi & kalimat copywriting untukmu..."
          onRefresh={() => {
            if (stage === 1) mulaiTahap1Angle()
            if (stage === 2)
              lanjutKeTahap2Referensi(contentBrief.chosen_angle, tempStoryInput)
            if (stage === 3) lanjutKeTahap3Hook()
          }}
        />
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

      {/* TAHAP 1: CHAT PRODUSER & PILIH ANGLE */}
      {stage === 1 && !isLoadingOpsi && coPilotStage1Data && (
        <div className="space-y-5">
          {renderProducerChatBubble(coPilotStage1Data.co_pilot_message)}

          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-[#14141f]">
              1. Pilih Sudut Pandang (Angle) Copywriting yang Paling Menohok:
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
                      Angle #{idx + 1} • {item.type}
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

          <div className="bg-[#f4f5f7] p-4 rounded-2xl space-y-2 border border-slate-200">
            <label className="block text-xs font-bold text-[#14141f]">
              2. Balas Obrolan Produser AI:{" "}
              {coPilotStage1Data.story_prompt_question ||
                "Ada cerita/opini singkat yang mau kamu selipkan? (Opsional)"}
            </label>
            {renderAdaptiveVoiceInput({
              rows: 2,
              value: tempStoryInput,
              onChange: setTempStoryInput,
              placeholder:
                "Balas santai seperti chat teman, atau biarkan kosong agar Produser AI menyiapkan perumpamaan otomatis...",
            })}
          </div>

          <button
            type="button"
            onClick={() =>
              lanjutKeTahap2Referensi(contentBrief.chosen_angle, tempStoryInput)
            }
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl"
          >
            Lanjut Pilih Analogi & Bukti Pendukung ➔
          </button>
        </div>
      )}

      {/* TAHAP 2: ANALOGI, FAKTA & USP */}
      {stage === 2 && !isLoadingOpsi && coPilotStage2Data && (
        <div className="space-y-5">
          {renderProducerChatBubble(coPilotStage2Data.co_pilot_message)}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              1. Pilih atau Edit Analogi / Perumpamaan Sehari-hari:
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
            {renderAdaptiveVoiceInput({
              rows: 2,
              value: tempStoryInput,
              onChange: setTempStoryInput,
              placeholder: "Cerita / perumpamaan yang akan dipakai...",
            })}
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-[#14141f]">
              2. Pilih 1 Fakta / Referensi Penguat Argumen:
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
              3. Pilih Poin Solusi / Unique Selling Point (USP):
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
            Lanjut Pilih dari 6 Jenis Hook Copywriting ➔
          </button>
        </div>
      )}

      {/* TAHAP 3: 6 KATEGORI HOOK COPYWRITING & 3 KATEGORI CTA */}
      {stage === 3 && !isLoadingOpsi && coPilotStage3Data && (
        <div className="space-y-5">
          {renderProducerChatBubble(
            coPilotStage3Data.co_pilot_message,
            coPilotStage3Data.framework_reason,
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              1. Pilih Kerangka Alur Copywriting:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: "PAS_RELATABLE_BRIDGE",
                  judul: "Masalah ➔ Jembatan Relate ➔ Fakta ➔ Solusi (PAS)",
                  ket: "Menyentuh titik sakit penonton lalu memberi jalan keluar logis.",
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

          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-[#14141f]">
              2. Pilih Kalimat Pembuka (6 Jenis Hook Psikologi Copywriting):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(coPilotStage3Data.hook_options || []).map((hkItem, idx) => {
                const teksHook =
                  typeof hkItem === "string" ? hkItem : hkItem?.text || ""
                const kategoriHook =
                  typeof hkItem === "object" && hkItem?.category
                    ? hkItem.category
                    : `Variasi Hook #${idx + 1}`
                const alasanHook =
                  typeof hkItem === "object" && hkItem?.why_it_works
                    ? hkItem.why_it_works
                    : "Mengunci perhatian di 3 detik pertama"
                const dipilih =
                  contentBrief.locked_hook === teksHook && !tempCustomHook

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setContentBrief({
                        ...contentBrief,
                        locked_hook: teksHook,
                      })
                      setTempCustomHook("")
                    }}
                    className={`cursor-pointer p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                      dipilih
                        ? "bg-[#14141f] text-white border-[#14141f] shadow-md"
                        : "bg-white text-[#14141f] border-slate-200 hover:border-[#14141f]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            dipilih
                              ? "bg-[#d4f34a] text-[#14141f]"
                              : "bg-[#f4f5f7] text-slate-700"
                          }`}
                        >
                          {kategoriHook}
                        </span>
                        {dipilih && (
                          <span className="text-[11px] font-bold text-[#d4f34a]">
                            ✓ Dipilih
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm font-bold leading-snug pt-1">
                        "{teksHook}"
                      </div>
                    </div>
                    <div
                      className={`text-[11px] ${
                        dipilih ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      💡 {alasanHook}
                    </div>
                  </button>
                )
              })}
            </div>
            <input
              type="text"
              value={tempCustomHook}
              onChange={(e) => setTempCustomHook(e.target.value)}
              placeholder="Atau ketik sendiri kalimat Hook pembuka versimu di sini..."
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              3. Pilih Jenis Kalimat Penutup & Ajakan Aksi (CTA):
            </label>
            {(coPilotStage3Data.cta_options || []).map((ctaItem, idx) => {
              const teksCta =
                typeof ctaItem === "string" ? ctaItem : ctaItem?.text || ""
              const kategoriCta =
                typeof ctaItem === "object" && ctaItem?.category
                  ? ctaItem.category
                  : `Pilihan CTA #${idx + 1}`
              const dipilih =
                contentBrief.call_to_action === teksCta && !tempCustomCTA

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setContentBrief({
                      ...contentBrief,
                      call_to_action: teksCta,
                    })
                    setTempCustomCTA("")
                  }}
                  className={`cursor-pointer w-full text-left p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    dipilih
                      ? "bg-[#f2fce2] border-[#4d6b14] font-bold"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#4d6b14] block">
                      {kategoriCta}
                    </span>
                    <span className="text-xs sm:text-sm">"{teksCta}"</span>
                  </div>
                  <span className="font-bold shrink-0">
                    {dipilih ? "✓ Dipilih" : "Pilih"}
                  </span>
                </button>
              )
            })}
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
              <span className="text-slate-500">Kalimat Pembuka (Hook):</span>{" "}
              <strong className="text-[#4d6b14]">
                "{contentBrief.locked_hook}"
              </strong>
            </div>
          </div>

          {isGenerating ? (
            <AILoadingBox
              label="Sedang meracik skrip 100% personal, menghitung Skor Retensi & menyiapkan Paket Upload..."
              onRefresh={handleBuatSkripSekarang}
            />
          ) : (
            <button
              type="button"
              onClick={handleBuatSkripSekarang}
              className="cursor-pointer w-full bg-[#d4f34a] text-[#14141f] font-bold text-sm py-4 rounded-2xl shadow-md flex items-center justify-center gap-2"
            >
              <span>Buat Skrip Konten Sekarang ➔</span>
            </button>
          )}
        </div>
      )}

      {/* STAGE 5: HASIL SKRIP END-TO-END (SKOR SKRIP + 4 KERANGKA + PAKET UPLOAD CAPTION/COVER) */}
      {stage === 5 && hasilSkrip && (
        <div className="space-y-5 w-full max-w-full overflow-hidden">
          <div className="bg-[#14141f] text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={async () => {
                await otomatisSimpanKeArsipUser(
                  hasilSkrip,
                  "Skrip disimpan ke arsip & membuka tampilan teks!",
                )
                setModeTeleprompter(true)
              }}
              className="cursor-pointer flex items-center gap-2 bg-[#d4f34a] text-[#14141f] text-xs font-bold px-4 py-2.5 rounded-xl"
            >
              <FlatIcon name="tv" className="w-4 h-4" />
              <span>Tampilkan Teks</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const teksInti = (hasilSkrip.segmen || [])
                    .map(
                      (s) =>
                        `[${s.labelMini}]\n${
                          modeTampilanSkrip === "teks"
                            ? s.teksLayar
                            : s.voiceover
                        }`,
                    )
                    .join("\n\n")
                  const teksWatermark = !isPremiumUser
                    ? `\n\n---\n✨ Dirancang dalam 5 detik menggunakan AI Copywriting Hookya.site`
                    : ""
                  navigator.clipboard.writeText(teksInti + teksWatermark)
                  await otomatisSimpanKeArsipUser(
                    hasilSkrip,
                    "Skrip berhasil disalin & otomatis tersimpan ke arsip!",
                  )
                }}
                title="Salin Skrip & Simpan ke Arsip"
                className="cursor-pointer w-10 h-10 rounded-xl bg-white/10 hover:bg-[#d4f34a] text-white hover:text-[#14141f] flex items-center justify-center transition"
              >
                <FlatIcon name="copy" className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCetakPDF}
                className="cursor-pointer flex items-center gap-1.5 bg-white/10 hover:bg-[#d4f34a] text-white hover:text-[#14141f] text-xs font-bold px-3.5 py-2.5 rounded-xl transition"
              >
                <FlatIcon name="printer" className="w-4 h-4" />
                <span>Cetak PDF</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIsEditMode((prev) => !prev)
                  await otomatisSimpanKeArsipUser(
                    hasilSkrip,
                    "Mode edit aktif & skrip otomatis tersimpan ke arsip!",
                  )
                  if (firstTextareaRef.current) {
                    firstTextareaRef.current.focus()
                  }
                }}
                className={`cursor-pointer flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl transition ${
                  isEditMode
                    ? "bg-[#d4f34a] text-[#14141f]"
                    : "bg-white/10 hover:bg-[#d4f34a] text-white hover:text-[#14141f]"
                }`}
              >
                <FlatIcon name="edit" className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* KARTU SKOR POTENSI VIRAL & EVALUASI RETENSI SKRIP */}
          {hasilSkrip.scriptScore && (
            <div className="bg-[#f2fce2] border border-[#4d6b14]/25 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase bg-[#14141f] text-[#d4f34a] px-2.5 py-0.5 rounded">
                  AI COPYWRITING & RETENTION SCORE
                </span>
                <div className="text-xs sm:text-sm font-bold text-[#14141f] pt-1">
                  {hasilSkrip.scriptScore.hook_strength}
                </div>
                <p className="text-xs text-slate-700">
                  <strong>Jembatan Retensi:</strong>{" "}
                  {hasilSkrip.scriptScore.retention_bridge}
                </p>
                <p className="text-xs text-[#4d6b14] font-bold">
                  💡 Tips Produser: {hasilSkrip.scriptScore.producer_tip}
                </p>
              </div>
              <div className="bg-[#14141f] text-[#d4f34a] px-5 py-3 rounded-2xl text-center shrink-0">
                <div className="text-2xl font-bold leading-none">
                  {hasilSkrip.scriptScore.total_score || 92}/100
                </div>
                <span className="text-[10px] text-white">Skor Skrip</span>
              </div>
            </div>
          )}

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
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#14141f] bg-[#f4f5f7] px-2.5 py-1 rounded-md">
                      {seg.labelMini}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Klik ikon putar untuk ganti variasi kerangka ini
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    <div className="lg:col-span-7 bg-[#d4f34a]/30 border border-[#14141f]/15 rounded-2xl p-3.5 sm:p-4 flex items-start justify-between gap-2.5">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <textarea
                          ref={idx === 0 ? firstTextareaRef : null}
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
                          className={`w-full bg-white/90 border ${
                            isEditMode
                              ? "border-[#14141f] ring-2 ring-[#d4f34a]"
                              : "border-slate-300"
                          } rounded-xl p-2.5 text-xs sm:text-sm font-normal text-[#14141f] leading-relaxed outline-none`}
                        />
                      </div>

                      <button
                        type="button"
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

          {/* PAKET EKSEKUSI KONTEN SIAP UPLOAD (JUDUL COVER + CAPTION SEO + PINNED COMMENT) */}
          {hasilSkrip.uploadPack && (
            <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold bg-[#14141f] text-[#d4f34a] px-2.5 py-0.5 rounded">
                    END-TO-END UPLOAD PACK
                  </span>
                  <h3 className="text-sm font-bold text-[#14141f] mt-1">
                    Paket Siap Upload (Judul Cover, Caption SEO & Pinned
                    Comment)
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-500 block">
                      1. Teks Judul Cover / Thumbnail:
                    </span>
                    <p className="font-bold text-sm text-[#14141f] mt-1">
                      "{hasilSkrip.uploadPack.cover_title}"
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        hasilSkrip.uploadPack.cover_title,
                      )
                      showToast("Judul Cover berhasil disalin!")
                    }}
                    className="cursor-pointer bg-[#f4f5f7] hover:bg-[#14141f] hover:text-[#d4f34a] font-bold py-2 rounded-xl transition"
                  >
                    Salin Judul Cover
                  </button>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-500 block">
                      2. Caption SEO & Hashtag:
                    </span>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      {hasilSkrip.uploadPack.caption_seo}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        hasilSkrip.uploadPack.caption_seo,
                      )
                      showToast("Caption & Hashtag berhasil disalin!")
                    }}
                    className="cursor-pointer bg-[#f4f5f7] hover:bg-[#14141f] hover:text-[#d4f34a] font-bold py-2 rounded-xl transition"
                  >
                    Salin Caption SEO
                  </button>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-500 block">
                      3. Komentar Pancingan (Pin Comment):
                    </span>
                    <p className="text-slate-700 mt-1 italic">
                      "{hasilSkrip.uploadPack.pinned_comment}"
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        hasilSkrip.uploadPack.pinned_comment,
                      )
                      showToast("Komentar pancingan berhasil disalin!")
                    }}
                    className="cursor-pointer bg-[#f4f5f7] hover:bg-[#14141f] hover:text-[#d4f34a] font-bold py-2 rounded-xl transition"
                  >
                    Salin Pinned Comment
                  </button>
                </div>
              </div>
            </div>
          )}

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
