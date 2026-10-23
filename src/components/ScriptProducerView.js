"use client"
import { useState, useEffect, useRef } from "react"
import { FlatIcon, StoryVoiceInput, AILoadingBox } from "./SharedUI"

const PILIHAN_DURASI_KONTEN = [
  "15 Detik (Padat & Langsung)",
  "30 Detik (Ringkas)",
  "60 Detik / 1 Menit (Standar)",
  "2 Menit (Pembahasan Mendalam)",
  "3 Menit (Penjelasan Lengkap)",
]

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
    PILIHAN_DURASI_KONTEN[2],
  )

  const [posisiBicara, setPosisiBicara] = useState(
    "Sesuai Positioning Utama Saya",
  )
  const [sumberBeritaMentah, setSumberBeritaMentah] = useState("")
  const [tampilkanJembatanTopik, setTampilkanJembatanTopik] = useState(false)

  const [formProduk, setFormProduk] = useState({
    namaProduk: "",
    brand: "",
    kategoriProduk: "Fashion & Aksesoris",
    hargaPromo: "",
    masalahDipecahkan: "",
    keunggulanSpesifikasi: "",
    buktiHasilCaraPakai: "",
  })

  const [ssProduk, setSsProduk] = useState(null)
  const [ssSpesifikasi, setSsSpesifikasi] = useState(null)
  const [isScanningSS, setIsScanningSS] = useState(false)

  const [formCampaign, setFormCampaign] = useState({
    namaCampaign: "",
    penyelenggara: "",
    tujuanUtama: "",
  })

  // Mengosongkan nama dummy ("Rina", "Dinda") sesuai aturan R-23 & R-38
  const [ugcConfig, setUgcConfig] = useState({
    aktif: false,
    jumlahOrang: 2,
    namaPemeran: ["", ""],
  })

  const [isLoadingIdeTopik, setIsLoadingIdeTopik] = useState(false)
  const [isLoadingOpsi, setIsLoadingOpsi] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isConvertingBentuk, setIsConvertingBentuk] = useState(false)
  const [isChangingDuration, setIsChangingDuration] = useState(false)
  const [isMultiplyingScript, setIsMultiplyingScript] = useState(false)
  const [regeneratingIndex, setRegeneratingIndex] = useState(null)
  const [regenCount, setRegenCount] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLearningDiff, setIsLearningDiff] = useState(false)
  const [errorAsesmenAI, setErrorAsesmenAI] = useState("")

  const [stage1Batches, setStage1Batches] = useState([])
  const [activeBatch1, setActiveBatch1] = useState(0)

  const [stage2Batches, setStage2Batches] = useState([])
  const [activeBatch2, setActiveBatch2] = useState(0)

  const [stage3Batches, setStage3Batches] = useState([])
  const [activeBatch3, setActiveBatch3] = useState(0)

  const coPilotStage1Data = stage1Batches[activeBatch1] || null
  const coPilotStage2Data = stage2Batches[activeBatch2] || null
  const coPilotStage3Data = stage3Batches[activeBatch3] || null

  const [contentBrief, setContentBrief] = useState({
    session_id: "ses_4410",
    selected_framework: "PAS_RELATABLE_BRIDGE",
    target_platform: PILIHAN_DURASI_KONTEN[2],
    core_idea: "",
    chosen_angle: "",
    personal_context_or_story: "",
    injected_reference: { type: "Mekanisme", title: "", summary: "" },
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
  const [targetDurasiUbah, setTargetDurasiUbah] = useState(
    PILIHAN_DURASI_KONTEN[2],
  )

  const [koleksiVariasiGanda, setKoleksiVariasiGanda] = useState([])
  const [indexVariasiAktif, setIndexVariasiAktif] = useState(0)
  const [draftLoaded, setDraftLoaded] = useState(false)

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
          className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg p-3 pr-24 text-base sm:text-sm font-normal text-[#14141f] placeholder:text-slate-400 focus:bg-white focus:border-[#14141f] outline-none transition leading-relaxed"
        />
        <button
          type="button"
          onClick={onTriggerUpgradeVIP}
          title="Fitur Mikrofon Suara khusus Paket VIP (Rp20.000+)"
          className="cursor-pointer absolute right-2 bottom-2 px-2.5 py-1.5 rounded-md bg-slate-200 hover:bg-[#14141f] text-[#14141f] hover:text-[#d4f34a] flex items-center gap-1 text-[11px] font-bold transition"
        >
          <FlatIcon name="lock" className="w-3.5 h-3.5" />
          <span>Mic VIP</span>
        </button>
      </div>
    )
  }

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
        if (Array.isArray(parsed.stage1Batches))
          setStage1Batches(parsed.stage1Batches)
        if (Array.isArray(parsed.stage2Batches))
          setStage2Batches(parsed.stage2Batches)
        if (Array.isArray(parsed.stage3Batches))
          setStage3Batches(parsed.stage3Batches)
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
        stage1Batches,
        stage2Batches,
        stage3Batches,
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
    stage1Batches,
    stage2Batches,
    stage3Batches,
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

  const handleCetakPDF = async () => {
    if (!hasilSkrip) return
    await otomatisSimpanKeArsipUser(
      hasilSkrip,
      "Skrip disimpan ke arsip dan menyiapkan dokumen cetak.",
    )

    const win = window.open("", "_blank", "width=800,height=900")
    if (!win) {
      alert("Izinkan pop-up di browser untuk mencetak PDF.")
      return
    }

    const barisHTML = (hasilSkrip.segmen || [])
      .map(
        (s) => `
        <div style="border:1px solid #cbd5e1; border-radius:8px; padding:14px; margin-bottom:12px;">
          <div style="font-weight:bold; font-size:12px; color:#475569; margin-bottom:6px;">${s.labelMini}</div>
          <div style="font-size:14px; line-height:1.6; white-space:pre-line; margin-bottom:8px;"><strong>Naskah / Dialog:</strong><br/>${
            modeTampilanSkrip === "teks" ? s.teksLayar : s.voiceover
          }</div>
          <div style="font-size:12px; color:#334155; background:#f8fafc; padding:8px; border-radius:6px;"><strong>Arahan Visual:</strong> ${s.visual}</div>
        </div>`,
      )
      .join("")

    const watermarkFooter = !isPremiumUser
      ? `<p style="margin-top:24px; padding-top:12px; border-top:1px dashed #cbd5e1; font-size:12px; color:#475569; font-weight:bold;">Disusun menggunakan Hookya.site</p>`
      : ""

    win.document.write(`
      <html>
        <head>
          <title>Skrip Hookya - ${hasilSkrip.judul}</title>
        </head>
        <body style="font-family:sans-serif; padding:24px; color:#14141f;">
          <h2 style="margin-bottom:4px;">${hasilSkrip.judul}</h2>
          <p style="font-size:12px; color:#64748b; margin-top:0; margin-bottom:20px;">Hookya.site • ${hasilSkrip.waktuDibuat}</p>
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
      showToast("Screenshot produk siap diekstrak.")
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
      showToast("Screenshot spesifikasi siap diekstrak.")
    }
  }

  const handleScanMarketplaceAI = async () => {
    if (!isPremiumUser) {
      onTriggerUpgradeVIP()
      return
    }
    if (!ssProduk && !ssSpesifikasi) {
      alert(
        "Pilih minimal 1 gambar screenshot produk dari marketplace terlebih dahulu.",
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
      if (!res.ok)
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")

      setFormProduk((prev) => ({
        ...prev,
        namaProduk: data.namaProduk || prev.namaProduk,
        brand: data.brand || prev.brand,
        hargaPromo: data.hargaPromo || prev.hargaPromo,
        keunggulanSpesifikasi:
          data.keunggulanSpesifikasi || prev.keunggulanSpesifikasi,
        masalahDipecahkan: data.masalahDipecahkan || prev.masalahDipecahkan,
      }))

      showToast("Informasi produk berhasil disalin dari screenshot.")
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsScanningSS(false)
    }
  }

  const handleUbahJumlahPemeranUGC = (jmlBaru) => {
    const angka = Math.max(2, Math.min(6, parseInt(jmlBaru) || 2))
    const namaLama = [...ugcConfig.namaPemeran]
    const namaBaru = []
    for (let i = 0; i < angka; i++) {
      namaBaru.push(namaLama[i] || "")
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
    showToast("Menyusun 10 ide topik sesuai profilmu...")
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
      if (res.ok && Array.isArray(data.ideTopik) && data.ideTopik.length > 0) {
        setDaftar10IdeTopik(data.ideTopik.slice(0, 10))
        showToast("10 ide topik baru berhasil dimuat.")
      } else {
        showToast("Error sistem, silakan refresh atau hubungi admin.")
      }
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsLoadingIdeTopik(false)
    }
  }

  const panggilTahap1Angle = async (isRegenerateBatch = false) => {
    if (isRegenerateBatch && stage1Batches.length >= 3) {
      showToast(
        "Batas maksimal 3x pencarian opsi sudut pandang telah tercapai.",
      )
      return
    }

    let topikUtama = ""
    let detailPromosiPayload = null

    if (kategoriKonten === "personal") {
      if (!rawTopicInput.trim()) {
        alert(
          "Pilih salah satu kartu ide topik atau ketik topik bahasan terlebih dahulu.",
        )
        return
      }
      const instruksiJembatan =
        posisiBicara !== "Sesuai Positioning Utama Saya"
          ? ` [ POSISI BICARA: Gunakan mode "${posisiBicara}". Jelaskan istilah teknis menggunakan perbandingan sehari-hari yang dekat dengan pengalaman pengguna. ]`
          : ""
      const lampiranBerita = sumberBeritaMentah.trim()
        ? ` [ FAKTA / BERITA SUMBER: "${sumberBeritaMentah.trim()}" ]`
        : ""

      topikUtama = `${rawTopicInput.trim()}${instruksiJembatan}${lampiranBerita}`
    } else {
      if (jenisPromosi === "produk") {
        if (!formProduk.namaProduk.trim()) {
          alert(
            "Isi Nama Produk terlebih dahulu atau gunakan fitur ekstrak screenshot produk.",
          )
          return
        }
        topikUtama = `Promosi Produk ${formProduk.namaProduk} (${formProduk.brand || "-"})`
        detailPromosiPayload = formProduk
      } else {
        if (!formCampaign.namaCampaign.trim()) {
          alert("Isi Nama Gerakan / Campaign terlebih dahulu.")
          return
        }
        topikUtama = `Campaign: ${formCampaign.namaCampaign}`
        detailPromosiPayload = formCampaign
      }
    }

    setStage(1)
    setErrorAsesmenAI("")
    if (!isRegenerateBatch) {
      setStage1Batches([])
      setActiveBatch1(0)
    }
    setIsLoadingOpsi(true)

    const opsiAngleSebelumnya = isRegenerateBatch
      ? stage1Batches.flatMap((b) =>
          (b.angle_options || []).map((a) => a.angle_text),
        )
      : []

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assessment_copilot",
          userId,
          namaUser,
          stageNumber: 1,
          batchKe: isRegenerateBatch ? stage1Batches.length + 1 : 1,
          opsiSebelumnya: opsiAngleSebelumnya,
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
      if (!res.ok)
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")

      setStage1Batches((prev) => {
        const listBaru = isRegenerateBatch ? [...prev, data] : [data]
        setActiveBatch1(listBaru.length - 1)
        return listBaru
      })

      setContentBrief((prev) => ({
        ...prev,
        session_id: `ses_${Date.now().toString().slice(-4)}`,
        target_platform: targetPlatformInput,
        core_idea: data.refined_core_idea || rawTopicInput.trim() || topikUtama,
        chosen_angle: data.angle_options?.[0]?.angle_text || prev.chosen_angle,
      }))
    } catch {
      setErrorAsesmenAI("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsLoadingOpsi(false)
    }
  }

  const panggilTahap2Referensi = async (
    angleTerpilih,
    ceritaUser,
    isRegenerateBatch = false,
  ) => {
    if (isRegenerateBatch && stage2Batches.length >= 3) {
      showToast("Batas maksimal 3x pencarian opsi penjelasan telah tercapai.")
      return
    }

    const finalAngle = angleTerpilih || contentBrief.chosen_angle
    const finalStory = ceritaUser ?? tempStoryInput

    setContentBrief((prev) => ({
      ...prev,
      chosen_angle: finalAngle,
      personal_context_or_story: finalStory,
    }))

    setStage(2)
    setErrorAsesmenAI("")
    if (!isRegenerateBatch) {
      setStage2Batches([])
      setActiveBatch2(0)
    }
    setIsLoadingOpsi(true)

    const opsiRefSebelumnya = isRegenerateBatch
      ? stage2Batches.flatMap((b) => [
          ...(b.relatable_analogies || []),
          ...(b.suggested_solutions || []),
        ])
      : []

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assessment_copilot",
          userId,
          namaUser,
          stageNumber: 2,
          batchKe: isRegenerateBatch ? stage2Batches.length + 1 : 1,
          opsiSebelumnya: opsiRefSebelumnya,
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
      if (!res.ok)
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")

      setStage2Batches((prev) => {
        const listBaru = isRegenerateBatch ? [...prev, data] : [data]
        setActiveBatch2(listBaru.length - 1)
        return listBaru
      })

      const ceritaOtomatis =
        finalStory.trim() ||
        data.relatable_analogies?.[0] ||
        "Situasi sehari-hari."

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
    } catch {
      setErrorAsesmenAI("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsLoadingOpsi(false)
    }
  }

  const panggilTahap3Hook = async (isRegenerateBatch = false) => {
    if (isRegenerateBatch && stage3Batches.length >= 3) {
      showToast("Batas maksimal 3x pencarian opsi Hook telah tercapai.")
      return
    }

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
    if (!isRegenerateBatch) {
      setStage3Batches([])
      setActiveBatch3(0)
    }
    setIsLoadingOpsi(true)

    const opsiHookSebelumnya = isRegenerateBatch
      ? stage3Batches.flatMap((b) =>
          (b.hook_options || []).map((h) =>
            typeof h === "string" ? h : h?.text,
          ),
        )
      : []

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assessment_copilot",
          userId,
          namaUser,
          stageNumber: 3,
          batchKe: isRegenerateBatch ? stage3Batches.length + 1 : 1,
          opsiSebelumnya: opsiHookSebelumnya,
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
      if (!res.ok)
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")

      setStage3Batches((prev) => {
        const listBaru = isRegenerateBatch ? [...prev, data] : [data]
        setActiveBatch3(listBaru.length - 1)
        return listBaru
      })

      const firstHookObj = data.hook_options?.[0]
      const firstHookText =
        typeof firstHookObj === "string"
          ? firstHookObj
          : firstHookObj?.text || ""

      const firstCtaObj = data.cta_options?.[0]
      const firstCtaText =
        typeof firstCtaObj === "string" ? firstCtaObj : firstCtaObj?.text || ""

      setContentBrief((prev) => ({
        ...prev,
        selected_framework:
          data.recommended_framework || "PAS_RELATABLE_BRIDGE",
        locked_hook: firstHookText || prev.locked_hook,
        call_to_action: firstCtaText || prev.call_to_action,
      }))
    } catch {
      setErrorAsesmenAI("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsLoadingOpsi(false)
    }
  }

  const renderBatchSlideBar = (
    batchesArray,
    activeIndex,
    setActiveIndex,
    onRegenerateNewBatch,
    labelOpsi,
  ) => {
    const sisaGenerate = Math.max(0, 3 - batchesArray.length)
    return (
      <div className="bg-[#f4f5f7] p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-600 px-1.5">
            Pilihan {labelOpsi}:
          </span>
          {batchesArray.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeIndex === idx
                  ? "bg-[#14141f] text-[#d4f34a]"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-[#14141f]"
              }`}
            >
              Set {idx + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {batchesArray.length > 1 && (
            <>
              <button
                type="button"
                disabled={activeIndex === 0}
                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                className="cursor-pointer w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center disabled:opacity-40"
              >
                <FlatIcon name="chevronLeft" className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={activeIndex === batchesArray.length - 1}
                onClick={() =>
                  setActiveIndex((i) =>
                    Math.min(batchesArray.length - 1, i + 1),
                  )
                }
                className="cursor-pointer w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center disabled:opacity-40"
              >
                <FlatIcon name="chevronRight" className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            disabled={sisaGenerate === 0 || isLoadingOpsi}
            onClick={onRegenerateNewBatch}
            className="cursor-pointer bg-white hover:bg-[#14141f] text-[#14141f] hover:text-[#d4f34a] border border-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition disabled:opacity-45"
          >
            <FlatIcon name="refresh" className="w-3.5 h-3.5" />
            <span>
              {sisaGenerate > 0
                ? `Cari Opsi Lain (Sisa ${sisaGenerate}x)`
                : "Maksimal 3 Set"}
            </span>
          </button>
        </div>
      </div>
    )
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
      alert("Saldo Koin belum mencukupi. Silakan isi ulang koin.")
      setActiveMenu("topup")
      return
    }

    const pemeranBersih = ugcConfig.namaPemeran.map(
      (n, idx) => n.trim() || `Pemeran ${idx + 1}`,
    )

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
          ugcConfig: { ...ugcConfig, namaPemeran: pemeranBersih },
          customPrompts,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.silentCoinUpdated != null) {
          updateKoinDatabase(data.silentCoinUpdated)
        }
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")
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
      setTargetDurasiUbah(
        contentBrief.target_platform || PILIHAN_DURASI_KONTEN[2],
      )
      setKoleksiVariasiGanda([])
      setIndexVariasiAktif(0)

      const skripBaru = {
        id: Date.now(),
        dbId: null,
        judul: contentBrief.core_idea,
        kategori:
          kategoriKonten === "personal"
            ? "Konten Kreator"
            : jenisPromosi === "produk"
              ? "Promosi Produk & Affiliate"
              : "Promosi Campaign",
        bentuk: ugcConfig.aktif
          ? `Dialog UGC (${ugcConfig.jumlahOrang} Orang: ${pemeranBersih.join(", ")})`
          : bentukKontenFinal,
        waktuDibuat: waktuSekarang,
        metadata: data.metadata || {
          estimated_duration: contentBrief.target_platform,
          framework_used: contentBrief.selected_framework,
        },
        scriptScore: data.script_score || null,
        uploadPack: data.upload_pack || null,
        contentBrief,
        sudahUpload: false,
        tanggalUpload: "",
        segmen: segmenHasil,
      }

      const tersimpan = await simpanAtauUpdateSkripDatabase(skripBaru)
      setHasilSkrip(tersimpan)
      setKoleksiSkripTersimpan((prev) => [tersimpan, ...prev])
      setStage(5)
      showToast("Skrip selesai disusun dan disimpan ke arsip.")
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUbahDurasiSkrip = async (durasiPilihan) => {
    if (!hasilSkrip || isChangingDuration) return
    setTargetDurasiUbah(durasiPilihan)
    setIsChangingDuration(true)
    showToast(`Menyesuaikan panjang naskah ke durasi ${durasiPilihan}...`)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ubah_durasi_skrip",
          userId,
          namaUser,
          personaProfile,
          subyek: hasilSkrip.judul,
          skripSebelumnya: hasilSkrip.segmen,
          durasiTargetBaru: durasiPilihan,
        }),
      })

      const data = await res.json()
      if (!res.ok)
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")

      const skripDiperbarui = {
        ...hasilSkrip,
        metadata: {
          ...(hasilSkrip.metadata || {}),
          estimated_duration: data.estimated_duration || durasiPilihan,
        },
        segmen: data.segmen || hasilSkrip.segmen,
      }
      setHasilSkrip(skripDiperbarui)
      await simpanAtauUpdateSkripDatabase(skripDiperbarui)
      showToast(`Panjang skrip disesuaikan ke ${durasiPilihan}.`)
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsChangingDuration(false)
    }
  }

  const handleGandakanStokSkrip = async (jumlahX, biayaKoin) => {
    if (!hasilSkrip || isMultiplyingScript) return
    if (coins < biayaKoin) {
      alert(
        `Saldo koin belum mencukupi (Perlu ${biayaKoin} Koin untuk membuat ${jumlahX}x variasi skrip). Silakan isi ulang koin.`,
      )
      setActiveMenu("topup")
      return
    }

    setIsMultiplyingScript(true)
    await updateKoinDatabase(coins - biayaKoin)
    showToast(`Menyusun ${jumlahX} variasi skrip berbeda...`)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "multiply_script_variations",
          userId,
          namaUser,
          personaProfile,
          subyek: hasilSkrip.judul,
          skripSebelumnya: hasilSkrip.segmen,
          jumlahMultiplier: jumlahX,
          koinDipakai: biayaKoin,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.silentCoinUpdated != null) {
          updateKoinDatabase(data.silentCoinUpdated)
        }
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")
      }

      const listVariasi = Array.isArray(data.daftarVariasi)
        ? data.daftarVariasi
        : []
      if (listVariasi.length === 0) {
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")
      }

      const waktuSekarang = new Date().toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      const arsipBaruList = []
      for (let i = 0; i < listVariasi.length; i++) {
        const v = listVariasi[i]
        const objekSkripVariasi = {
          id: Date.now() + i + 1,
          dbId: null,
          judul: `${hasilSkrip.judul} (${v.judulVariasi || `Variasi ${i + 1}`})`,
          kategori: hasilSkrip.kategori || "Stok Konten",
          bentuk: hasilSkrip.bentuk,
          waktuDibuat: waktuSekarang,
          metadata: hasilSkrip.metadata,
          sudahUpload: false,
          tanggalUpload: "",
          segmen: v.segmen || hasilSkrip.segmen,
        }
        const tersimpanDB =
          await simpanAtauUpdateSkripDatabase(objekSkripVariasi)
        arsipBaruList.push(tersimpanDB)
      }

      setKoleksiSkripTersimpan((prev) => [...arsipBaruList, ...prev])
      setKoleksiVariasiGanda(arsipBaruList)
      setIndexVariasiAktif(0)
      setHasilSkrip(arsipBaruList[0])
      showToast(`${arsipBaruList.length} variasi skrip baru disimpan ke Arsip.`)
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsMultiplyingScript(false)
    }
  }

  const handleRegenerateSatuKerangka = async (indexBaris, fokusTarget) => {
    if (!hasilSkrip) return
    const hitunganBaru = regenCount + 1

    if (hitunganBaru % 3 === 0) {
      if (coins < 1) {
        alert(
          "Saldo koin tidak mencukupi untuk pembaruan kerangka ke-3. Silakan isi ulang koin.",
        )
        setActiveMenu("topup")
        return
      }
      await updateKoinDatabase(coins - 1)
    }
    setRegenCount(hitunganBaru)

    const segmenLama = hasilSkrip.segmen[indexBaris]
    setRegeneratingIndex(indexBaris)
    showToast(`Memperbarui ${segmenLama.labelMini}...`)

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
      if (!res.ok)
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")

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
      showToast(`${segmenLama.labelMini} diperbarui.`)
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setRegeneratingIndex(null)
    }
  }

  const handleKonversiBentukKontenLain = async () => {
    if (!hasilSkrip || isConvertingBentuk) return
    setIsConvertingBentuk(true)
    showToast(`Mengubah skrip ke format ${targetKonversiBentuk}...`)

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
      if (!res.ok)
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")

      const skripDiperbarui = {
        ...hasilSkrip,
        bentuk: targetKonversiBentuk,
        segmen: data.segmen || hasilSkrip.segmen,
      }
      setBentukKonten(targetKonversiBentuk)
      setHasilSkrip(skripDiperbarui)
      await simpanAtauUpdateSkripDatabase(skripDiperbarui)
      showToast("Format bentuk konten diperbarui.")
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsConvertingBentuk(false)
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
        "Revisi skrip disimpan ke arsip dan kamus gaya bicaramu diperbarui.",
      )
    } finally {
      setIsLearningDiff(false)
    }
  }

  const renderProducerChatBubble = (pesanProduser, subPesan) => (
    <div className="bg-[#14141f] text-white p-4 sm:p-5 rounded-xl flex items-start gap-3.5">
      <div className="w-9 h-9 rounded-lg bg-[#d4f34a] text-[#14141f] font-bold text-xs flex items-center justify-center shrink-0">
        H
      </div>
      <div className="space-y-1 min-w-0 flex-1">
        <div className="text-xs font-bold text-[#d4f34a]">
          Catatan Produser Konten
        </div>
        <p className="text-xs sm:text-sm font-normal leading-relaxed text-white">
          {pesanProduser}
        </p>
        {subPesan && (
          <p className="text-xs text-slate-300 pt-1 font-medium">{subPesan}</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 space-y-6 w-full max-w-full overflow-hidden">
      {/* HEADER TAHAP */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-[#14141f] break-words">
            {stage === 0 && "Buat Skrip Konten"}
            {stage === 1 && "Tahap 1: Pilih Sudut Pandang Bahasan"}
            {stage === 2 && "Tahap 2: Situasi, Penjelasan & Solusi"}
            {stage === 3 && "Tahap 3: Struktur, Kalimat Pembuka (Hook) & CTA"}
            {stage === 4 && "Tahap 4: Periksa Rancangan Konten"}
            {stage === 5 && hasilSkrip?.judul}
          </h2>
          {stage > 0 && stage < 5 && (
            <p className="text-xs text-slate-500 mt-0.5">
              Langkah {stage} dari 4 sebelum penyusunan naskah utuh
            </p>
          )}
        </div>

        {stage > 0 && (
          <div className="flex items-center gap-2">
            {stage < 5 && (
              <button
                type="button"
                onClick={() => setStage(stage - 1)}
                className="cursor-pointer text-xs bg-[#f4f5f7] hover:bg-slate-200 px-3.5 py-2 rounded-lg font-bold transition"
              >
                Kembali
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setStage(0)
                setHasilSkrip(null)
              }}
              className="cursor-pointer text-xs bg-[#14141f] text-[#d4f34a] px-3.5 py-2 rounded-lg font-bold"
            >
              Topik Baru
            </button>
          </div>
        )}
      </div>

      {/* STAGE 0 */}
      {stage === 0 && (
        <div className="space-y-6">
          {/* PILIH KATEGORI */}
          <div className="bg-[#f4f5f7] p-1.5 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-1.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setKategoriKonten("personal")}
              className={`cursor-pointer p-3 rounded-lg text-left transition flex items-center gap-3 ${
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
                  Edukasi, opini lintas topik, cerita harian & hobi
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setKategoriKonten("affiliate")}
              className={`cursor-pointer p-3 rounded-lg text-left transition flex items-center gap-3 ${
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
                  Promosi produk marketplace, UMKM, atau kampanye acara
                </div>
              </div>
            </button>
          </div>

          {/* FORM PERSONAL */}
          {kategoriKonten === "personal" && (
            <div className="space-y-6">
              {/* INPUT UTAMA TOPIK & DURASI DITARUH DI ATAS AGAR LANGSUNG FOKUS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                    Topik Pembahasan
                  </label>
                  {renderAdaptiveVoiceInput({
                    rows: 2,
                    value: rawTopicInput,
                    onChange: setRawTopicInput,
                    placeholder:
                      "Ketik topik yang ingin kamu bahas atau pilih dari daftar ide di bawah...",
                  })}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                    Target Durasi Video
                  </label>
                  <select
                    value={targetPlatformInput}
                    onChange={(e) => setTargetPlatformInput(e.target.value)}
                    className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-3 text-base sm:text-xs font-bold text-[#14141f] outline-none focus:bg-white focus:border-[#14141f]"
                  >
                    {PILIHAN_DURASI_KONTEN.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 10 REFERENSI IDE TOPIK */}
              <div className="bg-[#f4f5f7] p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#14141f]">
                      Rekomendasi Ide Topik Sesuai Profilmu
                    </h3>
                    <p className="text-xs text-slate-600">
                      Klik salah satu kartu untuk memakai topik tersebut.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleGenerate10IdeTopikAI}
                      className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                    >
                      {isLoadingIdeTopik && (
                        <FlatIcon
                          name="refresh"
                          className="w-3.5 h-3.5 animate-spin"
                        />
                      )}
                      <span>
                        {isLoadingIdeTopik ? "Memuat..." : "Muat 10 Ide Baru"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => geserSliderIde("kiri")}
                      className="cursor-pointer w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                    >
                      <FlatIcon name="chevronLeft" className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => geserSliderIde("kanan")}
                      className="cursor-pointer w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                    >
                      <FlatIcon name="chevronRight" className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div
                  ref={sliderIdeRef}
                  className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 snap-x snap-mandatory"
                >
                  {daftar10IdeTopik.map((ide, idx) => {
                    const terpilih = rawTopicInput === ide.judul
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setRawTopicInput(ide.judul)
                          showToast(`Topik dipilih: ${ide.judul}`)
                        }}
                        className={`cursor-pointer snap-start shrink-0 w-64 sm:w-72 p-3.5 rounded-lg border text-left transition ${
                          terpilih
                            ? "bg-[#14141f] text-white border-[#14141f]"
                            : "bg-white text-[#14141f] border-slate-200 hover:border-[#14141f]"
                        }`}
                      >
                        <span
                          className={`text-[11px] font-bold ${
                            terpilih ? "text-[#d4f34a]" : "text-slate-500"
                          }`}
                        >
                          Ide {idx + 1} • {ide.nuansa}
                        </span>
                        <div className="text-xs sm:text-sm font-bold mt-1">
                          {ide.judul}
                        </div>
                        <p
                          className={`text-xs mt-1 leading-snug ${
                            terpilih ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {ide.ringkasan}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* JEMBATAN LINTAS TOPIK TANPA EYEBROW BADGE */}
              <div className="bg-[#f2fce2] border border-[#4d6b14]/25 p-4 rounded-xl space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    setTampilkanJembatanTopik(!tampilkanJembatanTopik)
                  }
                  className="cursor-pointer w-full flex items-center justify-between text-left"
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#14141f]">
                      Pengaturan Topik Lintas Bidang (Opsional)
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Gunakan jika kamu ingin membahas isu di luar keahlian
                      utamamu (misalnya kehutanan, sains, atau berita harian).
                    </p>
                  </div>
                  <FlatIcon
                    name="chevronDown"
                    className={`w-4 h-4 shrink-0 transition ${
                      tampilkanJembatanTopik ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {tampilkanJembatanTopik && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        {
                          id: "Sesuai Positioning Utama Saya",
                          ket: "Gunakan peran dan keahlian utamaku seperti biasa.",
                        },
                        {
                          id: "Pengamat Kritis / Warga Biasa",
                          ket: "Bicara jujur sebagai warga biasa yang menyoroti dampak langsungnya.",
                        },
                        {
                          id: "Jembatan Analogi Keahlianku",
                          ket: "Hubungkan topik ini dengan analogi bisnis, olahraga, atau keseharianku.",
                        },
                        {
                          id: "Pencerita Fakta & Berita",
                          ket: "Ceritakan ulang fakta berita secara runtut dengan bahasa sehari-hari.",
                        },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setPosisiBicara(pos.id)}
                          className={`cursor-pointer p-3 rounded-lg border text-left transition ${
                            posisiBicara === pos.id
                              ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                              : "bg-[#f4f5f7] text-[#14141f] border-slate-200"
                          }`}
                        >
                          <div className="text-xs font-bold">{pos.id}</div>
                          <div className="text-[11px] opacity-80 mt-0.5">
                            {pos.ket}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Cuplikan Berita / Catatan Fakta Sumber (Opsional)
                      </label>
                      {renderAdaptiveVoiceInput({
                        rows: 2,
                        value: sumberBeritaMentah,
                        onChange: setSumberBeritaMentah,
                        placeholder:
                          "Tempelkan kutipan berita atau data sumber yang ingin kamu bahas...",
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setJenisPromosi("produk")}
                  className={`cursor-pointer p-3.5 rounded-xl border text-left transition ${
                    jenisPromosi === "produk"
                      ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                      : "bg-[#f4f5f7] text-slate-700 border-slate-200"
                  }`}
                >
                  <div className="text-xs sm:text-sm font-bold">
                    1. Produk / Barang / Jasa
                  </div>
                  <p className="text-xs font-normal mt-0.5 opacity-80">
                    Ekstrak dari screenshot marketplace atau isi manual.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setJenisPromosi("campaign")}
                  className={`cursor-pointer p-3.5 rounded-xl border text-left transition ${
                    jenisPromosi === "campaign"
                      ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                      : "bg-[#f4f5f7] text-slate-700 border-slate-200"
                  }`}
                >
                  <div className="text-xs sm:text-sm font-bold">
                    2. Campaign / Acara / Komunitas
                  </div>
                  <p className="text-xs font-normal mt-0.5 opacity-80">
                    Ajakan kegiatan sosial, event, atau gerakan komunitas.
                  </p>
                </button>

                <div>
                  <label className="block text-xs font-bold text-[#14141f] mb-1">
                    Target Durasi Video
                  </label>
                  <select
                    value={targetPlatformInput}
                    onChange={(e) => setTargetPlatformInput(e.target.value)}
                    className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-3 text-base sm:text-xs font-bold text-[#14141f] outline-none"
                  >
                    {PILIHAN_DURASI_KONTEN.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {jenisPromosi === "produk" && (
                <div className="bg-[#f4f5f7] p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#14141f]">
                          Ekstrak Otomatis dari Screenshot Marketplace
                        </h4>
                        <p className="text-xs text-slate-500">
                          Unggah tangkapan layar produk Shopee, TikTok Shop,
                          atau Tokopedia untuk menyalin nama, merek, dan
                          spesifikasinya.
                        </p>
                      </div>
                      {!isPremiumUser && (
                        <button
                          type="button"
                          onClick={onTriggerUpgradeVIP}
                          className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                        >
                          <FlatIcon name="lock" className="w-3.5 h-3.5" />
                          <span>Buka Fitur VIP (Rp20.000+)</span>
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
                        className="cursor-pointer border border-dashed border-slate-300 hover:border-[#14141f] bg-[#f4f5f7] rounded-lg p-3 flex items-center gap-3 transition"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#14141f] text-[#d4f34a] flex items-center justify-center shrink-0">
                          <FlatIcon
                            name={isPremiumUser ? "upload" : "lock"}
                            className="w-4 h-4"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#14141f] truncate">
                            {ssProduk
                              ? ssProduk.namaFile
                              : "1. Pilih Screenshot Produk"}
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            Nama produk, merek & harga
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
                        className="cursor-pointer border border-dashed border-slate-300 hover:border-[#14141f] bg-[#f4f5f7] rounded-lg p-3 flex items-center gap-3 transition"
                      >
                        <div className="w-9 h-9 rounded-lg bg-slate-200 text-[#14141f] flex items-center justify-center shrink-0">
                          <FlatIcon
                            name={isPremiumUser ? "upload" : "lock"}
                            className="w-4 h-4"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#14141f] truncate">
                            {ssSpesifikasi
                              ? ssSpesifikasi.namaFile
                              : "2. Pilih Screenshot Spesifikasi (Opsional)"}
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            Detail bahan, ukuran & fitur
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
                          label="Membaca data produk dari gambar screenshot..."
                          onRefresh={handleScanMarketplaceAI}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={handleScanMarketplaceAI}
                          className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] text-xs font-bold py-2.5 rounded-lg"
                        >
                          Salin Data Produk dari Screenshot
                        </button>
                      ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Nama Produk (Wajib)
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
                        placeholder="Masukkan nama produk..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:border-[#14141f]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Merek / Nama Toko (Opsional)
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
                        placeholder="Masukkan nama merek..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:border-[#14141f]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Harga / Promo (Opsional)
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
                        placeholder="Contoh: Rp150.000"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:border-[#14141f]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Fungsi / Masalah yang Diselesaikan (Opsional)
                      </label>
                      {renderAdaptiveVoiceInput({
                        rows: 2,
                        value: formProduk.masalahDipecahkan,
                        onChange: (val) =>
                          setFormProduk({
                            ...formProduk,
                            masalahDipecahkan: val,
                          }),
                        placeholder:
                          "Jelaskan manfaat utama produk bagi pembeli...",
                      })}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#14141f] mb-1">
                        Spesifikasi & Keunggulan Fisik (Opsional)
                      </label>
                      {renderAdaptiveVoiceInput({
                        rows: 2,
                        value: formProduk.keunggulanSpesifikasi,
                        onChange: (val) =>
                          setFormProduk({
                            ...formProduk,
                            keunggulanSpesifikasi: val,
                          }),
                        placeholder:
                          "Tuliskan bahan, ukuran, atau spesifikasi teknis...",
                      })}
                    </div>
                  </div>
                </div>
              )}

              {jenisPromosi === "campaign" && (
                <div className="bg-[#f4f5f7] p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
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
                      placeholder="Nama Gerakan / Acara (Wajib)"
                      className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none"
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
                      className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none"
                    />
                  </div>
                  {renderAdaptiveVoiceInput({
                    rows: 2,
                    value: formCampaign.tujuanUtama,
                    onChange: (val) =>
                      setFormCampaign({ ...formCampaign, tujuanUtama: val }),
                    placeholder:
                      "Jelaskan tujuan kegiatan dan informasi waktu/tempat pelaksanaan...",
                  })}
                </div>
              )}
            </div>
          )}

          {/* PENGATURAN TAMBAHAN: MODE DIALOG UGC */}
          <div className="bg-[#f0eeff] border border-[#5b4bc4]/20 p-4 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#14141f] text-[#d4f34a] flex items-center justify-center shrink-0">
                  <FlatIcon name="users" className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#14141f]">
                    Format Dialog Percakapan (UGC)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Aktifkan jika skrip akan diperankan oleh 2 sampai 4 orang
                    secara bersahutan.
                  </p>
                </div>
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200">
                <input
                  type="checkbox"
                  checked={ugcConfig.aktif}
                  onChange={(e) =>
                    setUgcConfig({ ...ugcConfig, aktif: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#14141f]"
                />
                <span>Gunakan Dialog UGC</span>
              </label>
            </div>

            {ugcConfig.aktif && (
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs font-bold text-[#14141f]">
                    Jumlah Pemeran:
                  </label>
                  {[2, 3, 4].map((jml) => (
                    <button
                      key={jml}
                      type="button"
                      onClick={() => handleUbahJumlahPemeranUGC(jml)}
                      className={`cursor-pointer px-3 py-1 rounded-md text-xs font-bold border ${
                        ugcConfig.jumlahOrang === jml
                          ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                          : "bg-[#f4f5f7] text-slate-700 border-slate-200"
                      }`}
                    >
                      {jml} Orang
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {ugcConfig.namaPemeran.map((namaP, idx) => (
                    <div key={idx}>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Pemeran {idx + 1}
                      </label>
                      <input
                        type="text"
                        value={namaP}
                        onChange={(e) => {
                          const salinan = [...ugcConfig.namaPemeran]
                          salinan[idx] = e.target.value
                          setUgcConfig({ ...ugcConfig, namaPemeran: salinan })
                        }}
                        placeholder={`Nama Pemeran ${idx + 1}`}
                        className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs font-bold outline-none focus:bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => panggilTahap1Angle(false)}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-3.5 rounded-lg hover:opacity-95 transition"
          >
            Lanjutkan ke Pemilihan Sudut Pandang
          </button>
        </div>
      )}

      {stage >= 1 && stage <= 3 && isLoadingOpsi && (
        <AILoadingBox
          label="Menyusun pilihan sudut pandang dan kerangka bahasan..."
          onRefresh={() => {
            if (stage === 1) panggilTahap1Angle(false)
            if (stage === 2)
              panggilTahap2Referensi(
                contentBrief.chosen_angle,
                tempStoryInput,
                false,
              )
            if (stage === 3) panggilTahap3Hook(false)
          }}
        />
      )}

      {stage >= 1 && stage <= 3 && !isLoadingOpsi && errorAsesmenAI && (
        <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-3">
          <p className="text-xs sm:text-sm font-bold text-rose-900">
            {errorAsesmenAI}
          </p>
          <button
            type="button"
            onClick={() => {
              if (stage === 1) panggilTahap1Angle(false)
              if (stage === 2)
                panggilTahap2Referensi(
                  contentBrief.chosen_angle,
                  tempStoryInput,
                  false,
                )
              if (stage === 3) panggilTahap3Hook(false)
            }}
            className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-5 py-2.5 rounded-lg"
          >
            Muat Ulang Proses
          </button>
        </div>
      )}

      {/* TAHAP 1 */}
      {stage === 1 && !isLoadingOpsi && coPilotStage1Data && (
        <div className="space-y-5">
          {renderProducerChatBubble(coPilotStage1Data.co_pilot_message)}

          {renderBatchSlideBar(
            stage1Batches,
            activeBatch1,
            setActiveBatch1,
            () => panggilTahap1Angle(true),
            "Sudut Pandang",
          )}

          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-[#14141f]">
              1. Pilih Sudut Pandang Bahasan (Set {activeBatch1 + 1})
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
                  className={`cursor-pointer w-full text-left p-4 rounded-xl border transition flex items-start justify-between gap-3 ${
                    terpilih
                      ? "bg-[#14141f] text-white border-[#14141f]"
                      : "bg-white text-[#14141f] border-slate-200 hover:border-[#14141f]"
                  }`}
                >
                  <div>
                    <span
                      className={`text-[11px] font-bold ${
                        terpilih ? "text-[#d4f34a]" : "text-slate-500"
                      }`}
                    >
                      Opsi {idx + 1} • {item.type}
                    </span>
                    <div className="text-xs sm:text-sm font-bold mt-0.5">
                      {item.angle_text}
                    </div>
                  </div>
                  {terpilih && (
                    <FlatIcon
                      name="check"
                      className="w-4 h-4 text-[#d4f34a] shrink-0"
                    />
                  )}
                </button>
              )
            })}
          </div>

          <div className="bg-[#f4f5f7] p-4 rounded-xl space-y-2 border border-slate-200">
            <label className="block text-xs font-bold text-[#14141f]">
              2.{" "}
              {coPilotStage1Data.story_prompt_question ||
                "Pengalaman atau detail spesifik yang ingin disertakan (Opsional)"}
            </label>
            {renderAdaptiveVoiceInput({
              rows: 2,
              value: tempStoryInput,
              onChange: setTempStoryInput,
              placeholder:
                "Tuliskan pengalaman singkatmu, atau biarkan kosong untuk memakai contoh situasi di tahap berikutnya...",
            })}
          </div>

          <button
            type="button"
            onClick={() =>
              panggilTahap2Referensi(
                contentBrief.chosen_angle,
                tempStoryInput,
                false,
              )
            }
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-3.5 rounded-lg"
          >
            Lanjutkan ke Penjelasan & Solusi
          </button>
        </div>
      )}

      {/* TAHAP 2 */}
      {stage === 2 && !isLoadingOpsi && coPilotStage2Data && (
        <div className="space-y-5">
          {renderProducerChatBubble(coPilotStage2Data.co_pilot_message)}

          {renderBatchSlideBar(
            stage2Batches,
            activeBatch2,
            setActiveBatch2,
            () =>
              panggilTahap2Referensi(
                contentBrief.chosen_angle,
                tempStoryInput,
                true,
              ),
            "Penjelasan & Solusi",
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              1. Pilih atau Sesuaikan Situasi / Perbandingan (Set{" "}
              {activeBatch2 + 1})
            </label>
            {Array.isArray(coPilotStage2Data.relatable_analogies) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
                {coPilotStage2Data.relatable_analogies.map((ana, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTempStoryInput(ana)}
                    className={`cursor-pointer p-3 rounded-lg border text-left text-xs ${
                      tempStoryInput === ana
                        ? "bg-[#f2fce2] border-[#4d6b14] font-bold text-[#14141f]"
                        : "bg-white border-slate-200 text-slate-700"
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
              placeholder: "Situasi atau perbandingan yang akan dipakai...",
            })}
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-[#14141f]">
              2. Pilih 1 Penjelasan Pendukung
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
                    className={`cursor-pointer p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                      terpilih
                        ? "bg-[#14141f] text-white border-[#14141f]"
                        : "bg-white text-[#14141f] border-slate-200 hover:border-[#14141f]"
                    }`}
                  >
                    <div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          terpilih
                            ? "bg-[#d4f34a] text-[#14141f]"
                            : "bg-[#f4f5f7] text-slate-600"
                        }`}
                      >
                        {refCard.type}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold mt-2">
                        {refCard.title}
                      </h4>
                      <p
                        className={`text-xs font-normal mt-1 leading-relaxed ${
                          terpilih ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
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
              3. Pilih Poin Solusi / Keunggulan
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
                    className={`cursor-pointer w-full text-left p-3.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                      sudahAda
                        ? "bg-[#14141f] text-[#d4f34a] border-[#14141f] font-bold"
                        : "bg-white text-[#14141f] border-slate-200"
                    }`}
                  >
                    <span>{sol}</span>
                    <span className="shrink-0">
                      {sudahAda ? "Dipakai" : "Pilih"}
                    </span>
                  </button>
                )
              })}
            </div>
            <input
              type="text"
              value={tempCustomSolution}
              onChange={(e) => setTempCustomSolution(e.target.value)}
              placeholder="Tambahkan poin solusi sendiri (opsional)..."
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => panggilTahap3Hook(false)}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-3.5 rounded-lg"
          >
            Lanjutkan ke Pemilihan Kalimat Pembuka (Hook)
          </button>
        </div>
      )}

      {/* TAHAP 3 */}
      {stage === 3 && !isLoadingOpsi && coPilotStage3Data && (
        <div className="space-y-5">
          {renderProducerChatBubble(
            coPilotStage3Data.co_pilot_message,
            coPilotStage3Data.framework_reason,
          )}

          {renderBatchSlideBar(
            stage3Batches,
            activeBatch3,
            setActiveBatch3,
            () => panggilTahap3Hook(true),
            "Hook & CTA",
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              1. Pilih Struktur Alur Copywriting
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: "PAS_RELATABLE_BRIDGE",
                  judul: "Masalah, Situasi Relate, Fakta & Solusi (PAS)",
                  ket: "Menyebutkan masalah penonton lalu memberikan langkah penyelesaian.",
                },
                {
                  id: "HSO_STORY",
                  judul: "Cerita Pengalaman (Hook, Story, Offer)",
                  ket: "Mengalir dari kejadian nyata menuju kesimpulan atau rekomendasi.",
                },
                {
                  id: "CONTRARIAN_MYTH_BUSTER",
                  judul: "Koreksi Kebiasaan Keliru vs Fakta",
                  ket: "Meluruskan anggapan umum yang sering merugikan penonton.",
                },
                {
                  id: "BAB_TRANSFORMATION",
                  judul: "Perbandingan Sebelum vs Sesudah (Before - After)",
                  ket: "Menunjukkan kondisi awal sebelum perubahan dan hasil akhirnya.",
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
                  className={`cursor-pointer p-3.5 rounded-xl border text-left transition ${
                    contentBrief.selected_framework === fw.id
                      ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                      : "bg-white text-[#14141f] border-slate-200"
                  }`}
                >
                  <div className="text-xs font-bold">{fw.judul}</div>
                  <div
                    className={`text-[11px] font-normal mt-0.5 ${
                      contentBrief.selected_framework === fw.id
                        ? "text-slate-300"
                        : "text-slate-600"
                    }`}
                  >
                    {fw.ket}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-[#14141f]">
              2. Pilih Kalimat Pembuka / 6 Kategori Hook (Set {activeBatch3 + 1}
              )
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(coPilotStage3Data.hook_options || []).map((hkItem, idx) => {
                const teksHook =
                  typeof hkItem === "string" ? hkItem : hkItem?.text || ""
                const kategoriHook =
                  typeof hkItem === "object" && hkItem?.category
                    ? hkItem.category
                    : `Variasi Hook ${idx + 1}`
                const alasanHook =
                  typeof hkItem === "object" && hkItem?.why_it_works
                    ? hkItem.why_it_works
                    : "Menarik perhatian di 3 detik pertama"
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
                    className={`cursor-pointer p-4 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                      dipilih
                        ? "bg-[#14141f] text-white border-[#14141f]"
                        : "bg-white text-[#14141f] border-slate-200 hover:border-[#14141f]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            dipilih
                              ? "bg-[#d4f34a] text-[#14141f]"
                              : "bg-[#f4f5f7] text-slate-700"
                          }`}
                        >
                          {kategoriHook}
                        </span>
                        {dipilih && (
                          <span className="text-[11px] font-bold text-[#d4f34a]">
                            Dipilih
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm font-bold leading-snug pt-1">
                        {teksHook}
                      </div>
                    </div>
                    <div
                      className={`text-[11px] ${
                        dipilih ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      Fungsi: {alasanHook}
                    </div>
                  </button>
                )
              })}
            </div>
            <input
              type="text"
              value={tempCustomHook}
              onChange={(e) => setTempCustomHook(e.target.value)}
              placeholder="Atau tulis sendiri kalimat pembuka versimu di sini..."
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              3. Pilih Kalimat Penutup & Ajakan (CTA — Set {activeBatch3 + 1})
            </label>
            {(coPilotStage3Data.cta_options || []).map((ctaItem, idx) => {
              const teksCta =
                typeof ctaItem === "string" ? ctaItem : ctaItem?.text || ""
              const kategoriCta =
                typeof ctaItem === "object" && ctaItem?.category
                  ? ctaItem.category
                  : `Pilihan CTA ${idx + 1}`
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
                  className={`cursor-pointer w-full text-left p-3.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                    dipilih
                      ? "bg-[#f2fce2] border-[#4d6b14] font-bold text-[#14141f]"
                      : "bg-white border-slate-200 text-[#14141f]"
                  }`}
                >
                  <div>
                    <span className="text-[11px] font-bold text-[#4d6b14] block">
                      {kategoriCta}
                    </span>
                    <span className="text-xs sm:text-sm">{teksCta}</span>
                  </div>
                  <span className="font-bold shrink-0">
                    {dipilih ? "Dipilih" : "Pilih"}
                  </span>
                </button>
              )
            })}
            <input
              type="text"
              value={tempCustomCTA}
              onChange={(e) => setTempCustomCTA(e.target.value)}
              placeholder="Atau tulis sendiri kalimat ajakan penutup di sini..."
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={lanjutKeTahap4FinalBrief}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-3.5 rounded-lg"
          >
            Periksa Ringkasan Rancangan Skrip
          </button>
        </div>
      )}

      {/* TAHAP 4 */}
      {stage === 4 && (
        <div className="space-y-5">
          <div className="bg-[#f4f5f7] p-5 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div>
              <span className="text-slate-500">Sudut Pandang:</span>{" "}
              <strong>{contentBrief.chosen_angle}</strong>
            </div>
            <div>
              <span className="text-slate-500">Target Durasi:</span>{" "}
              <strong>{contentBrief.target_platform}</strong>
            </div>
            <div>
              <span className="text-slate-500">Struktur Copywriting:</span>{" "}
              <strong>{contentBrief.selected_framework}</strong>
            </div>
            <div>
              <span className="text-slate-500">Format Visual:</span>{" "}
              <strong>
                {ugcConfig.aktif
                  ? `Dialog UGC (${ugcConfig.jumlahOrang} Orang)`
                  : bentukKontenFinal}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Kalimat Pembuka (Hook):</span>{" "}
              <strong className="text-[#4d6b14]">
                {contentBrief.locked_hook}
              </strong>
            </div>
          </div>

          {isGenerating ? (
            <AILoadingBox
              label="Menyusun naskah skrip sesuai durasi dan gaya bicara..."
              onRefresh={handleBuatSkripSekarang}
            />
          ) : (
            <button
              type="button"
              onClick={handleBuatSkripSekarang}
              className="cursor-pointer w-full bg-[#d4f34a] text-[#14141f] font-bold text-sm py-3.5 rounded-lg hover:opacity-95 transition"
            >
              Susun Naskah Skrip Sekarang
            </button>
          )}
        </div>
      )}

      {/* STAGE 5: HASIL SKRIP */}
      {stage === 5 && hasilSkrip && (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
          {/* BAR AKSI UTAMA */}
          <div className="bg-[#14141f] text-white p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={async () => {
                await otomatisSimpanKeArsipUser(
                  hasilSkrip,
                  "Skrip disimpan ke arsip dan membuka layar baca.",
                )
                setModeTeleprompter(true)
              }}
              className="cursor-pointer flex items-center gap-2 bg-[#d4f34a] text-[#14141f] text-xs font-bold px-4 py-2.5 rounded-lg"
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
                    ? `\n\nDisusun menggunakan Hookya.site`
                    : ""
                  navigator.clipboard.writeText(teksInti + teksWatermark)
                  await otomatisSimpanKeArsipUser(
                    hasilSkrip,
                    "Skrip disalin dan disimpan ke arsip.",
                  )
                }}
                title="Salin Skrip & Simpan ke Arsip"
                className="cursor-pointer w-9 h-9 rounded-lg bg-white/10 hover:bg-[#d4f34a] text-white hover:text-[#14141f] flex items-center justify-center transition"
              >
                <FlatIcon name="copy" className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCetakPDF}
                className="cursor-pointer flex items-center gap-1.5 bg-white/10 hover:bg-[#d4f34a] text-white hover:text-[#14141f] text-xs font-bold px-3.5 py-2 rounded-lg transition"
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
                    "Mode edit aktif dan skrip disimpan ke arsip.",
                  )
                  if (firstTextareaRef.current) {
                    firstTextareaRef.current.focus()
                  }
                }}
                className={`cursor-pointer flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition ${
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

          {/* DAFTAR VARIASI JIKA PENGGUNA MENGGANDAKAN SKRIP */}
          {koleksiVariasiGanda.length > 1 && (
            <div className="bg-[#f0eeff] border border-[#5b4bc4]/25 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#14141f]">
                  Daftar Variasi Skrip ({koleksiVariasiGanda.length} Skrip
                  Tersimpan di Arsip)
                </span>
                <span className="text-[11px] text-slate-600">
                  Klik untuk berpindah variasi
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
                {koleksiVariasiGanda.map((vItem, idx) => (
                  <button
                    key={vItem.id || idx}
                    type="button"
                    onClick={() => {
                      setIndexVariasiAktif(idx)
                      setHasilSkrip(vItem)
                    }}
                    className={`cursor-pointer snap-start shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                      indexVariasiAktif === idx
                        ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Variasi {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BAR KONTROL TAMPILAN, DURASI & FORMAT VISUAL */}
          <div className="bg-[#f4f5f7] p-3.5 rounded-xl border border-slate-200 space-y-3 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="grid grid-cols-2 sm:inline-flex bg-white p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setModeTampilanSkrip("voiceover")}
                  className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-bold text-center ${
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
                  className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-bold text-center ${
                    modeTampilanSkrip === "teks"
                      ? "bg-[#14141f] text-[#d4f34a]"
                      : "text-slate-600"
                  }`}
                >
                  Teks di Layar
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={targetDurasiUbah}
                  disabled={isChangingDuration}
                  onChange={(e) => handleUbahDurasiSkrip(e.target.value)}
                  className="flex-1 sm:w-56 bg-white border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs font-bold outline-none"
                >
                  {PILIHAN_DURASI_KONTEN.map((d) => (
                    <option key={d} value={d}>
                      Durasi: {d}
                    </option>
                  ))}
                </select>
                {isChangingDuration && (
                  <div className="w-8 h-8 rounded-lg bg-[#14141f] text-[#d4f34a] flex items-center justify-center shrink-0">
                    <FlatIcon name="refresh" className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full pt-2.5 border-t border-slate-200">
              <select
                value={targetKonversiBentuk}
                onChange={(e) => setTargetKonversiBentuk(e.target.value)}
                className="flex-1 min-w-0 max-w-full truncate bg-white border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs font-bold outline-none"
              >
                {SEPULUH_BENTUK_KONTEN.map((b) => (
                  <option key={b.id} value={b.nama}>
                    {b.nama}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={isConvertingBentuk}
                onClick={handleKonversiBentukKontenLain}
                className="cursor-pointer w-full sm:w-auto bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2 rounded-lg shrink-0 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isConvertingBentuk && (
                  <FlatIcon name="refresh" className="w-4 h-4 animate-spin" />
                )}
                <span>
                  {isConvertingBentuk ? "Mengubah Bentuk..." : "Ubah Bentuk"}
                </span>
              </button>
            </div>
          </div>

          {/* 4 KERANGKA SKRIP UTAMA (TANPA LATAR HIJAU LIME BERLEBIHAN AGAR NYAMAN DIBACA) */}
          <div className="space-y-3.5">
            {hasilSkrip.segmen.map((seg, idx) => {
              const teksAktif =
                modeTampilanSkrip === "teks" ? seg.teksLayar : seg.voiceover
              const sedangRegenBarisIni = regeneratingIndex === idx

              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#14141f] bg-[#f4f5f7] px-2.5 py-1 rounded-md border border-slate-200">
                      {seg.labelMini}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Klik ikon putar untuk mengganti variasi bagian ini
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    <div className="lg:col-span-7 bg-[#f4f5f7] border border-slate-200 rounded-lg p-3.5 flex items-start justify-between gap-2.5">
                      <div className="flex-1 min-w-0">
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
                          className={`w-full bg-white border ${
                            isEditMode
                              ? "border-[#14141f] ring-2 ring-[#d4f34a]"
                              : "border-slate-200"
                          } rounded-lg p-2.5 text-base sm:text-sm font-normal text-[#14141f] leading-relaxed outline-none`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRegenerateSatuKerangka(idx, "skrip")
                        }
                        title="Buat variasi baru khusus kerangka ini"
                        className="cursor-pointer w-8 h-8 rounded-lg bg-white hover:bg-[#14141f] text-[#14141f] hover:text-[#d4f34a] border border-slate-200 flex items-center justify-center shrink-0 transition"
                      >
                        <FlatIcon
                          name="refresh"
                          className={`w-4 h-4 ${
                            sedangRegenBarisIni ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                    </div>

                    <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-3.5 flex items-start justify-between gap-2.5">
                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="text-xs font-bold text-[#14141f] block">
                          Arahan Adegan Visual
                        </span>
                        <p className="text-xs font-normal text-slate-600 leading-relaxed break-words">
                          {seg.visual}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRegenerateSatuKerangka(idx, "visual")
                        }
                        title="Buat variasi visual khusus kerangka ini"
                        className="cursor-pointer w-8 h-8 rounded-lg bg-[#f4f5f7] hover:bg-[#14141f] text-slate-700 hover:text-[#d4f34a] border border-slate-200 flex items-center justify-center shrink-0 transition"
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

          {/* EVALUASI STRUKTUR SKRIP TANPA EYEBROW BADGE */}
          {hasilSkrip.scriptScore && (
            <div className="bg-[#f2fce2] border border-[#4d6b14]/25 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-[#14141f]">
                  Evaluasi Struktur & Retensi Naskah:{" "}
                  {hasilSkrip.scriptScore.hook_strength}
                </h3>
                <p className="text-xs text-slate-700">
                  <strong>Alur Tengah:</strong>{" "}
                  {hasilSkrip.scriptScore.retention_bridge}
                </p>
                <p className="text-xs text-[#4d6b14] font-bold">
                  Catatan Eksekusi: {hasilSkrip.scriptScore.producer_tip}
                </p>
              </div>
              <div className="bg-[#14141f] text-[#d4f34a] px-4 py-2.5 rounded-lg text-center shrink-0">
                <div className="text-xl font-bold leading-none">
                  {hasilSkrip.scriptScore.total_score || 92}/100
                </div>
                <span className="text-[10px] text-white">Skor Struktur</span>
              </div>
            </div>
          )}

          {/* PAKET PELENGKAP UPLOAD */}
          {hasilSkrip.uploadPack && (
            <div className="bg-[#f4f5f7] p-5 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-[#14141f]">
                Kelengkapan Upload (Judul Cover, Caption & Komentar Pertama)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-500 block">
                      1. Teks Judul Cover / Thumbnail
                    </span>
                    <p className="font-bold text-sm text-[#14141f] mt-1">
                      {hasilSkrip.uploadPack.cover_title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        hasilSkrip.uploadPack.cover_title,
                      )
                      showToast("Judul cover disalin.")
                    }}
                    className="cursor-pointer bg-[#f4f5f7] hover:bg-[#14141f] hover:text-[#d4f34a] font-bold py-2 rounded-lg transition"
                  >
                    Salin Judul Cover
                  </button>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-500 block">
                      2. Caption & Hashtag
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
                      showToast("Caption disalin.")
                    }}
                    className="cursor-pointer bg-[#f4f5f7] hover:bg-[#14141f] hover:text-[#d4f34a] font-bold py-2 rounded-lg transition"
                  >
                    Salin Caption
                  </button>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-500 block">
                      3. Komentar Pancingan Pertama
                    </span>
                    <p className="text-slate-700 mt-1">
                      {hasilSkrip.uploadPack.pinned_comment}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        hasilSkrip.uploadPack.pinned_comment,
                      )
                      showToast("Komentar pancingan disalin.")
                    }}
                    className="cursor-pointer bg-[#f4f5f7] hover:bg-[#14141f] hover:text-[#d4f34a] font-bold py-2 rounded-lg transition"
                  >
                    Salin Komentar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GENERATOR VARIASI STOK KONTEN */}
          <div className="bg-[#14141f] text-white p-5 rounded-xl space-y-3">
            <div>
              <h3 className="text-sm font-bold">
                Gandakan Topik Ini Menjadi Beberapa Variasi Skrip
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Buat 2, 5, atau 10 variasi naskah dengan sudut pandang pembuka
                berbeda. Seluruh variasi otomatis tersimpan ke Arsip Skrip.
              </p>
            </div>

            {isMultiplyingScript ? (
              <div className="bg-white/10 p-3.5 rounded-lg flex items-center justify-center gap-2.5 text-xs font-bold text-[#d4f34a]">
                <FlatIcon name="refresh" className="w-4 h-4 animate-spin" />
                <span>Menyusun variasi skrip dan menyimpan ke Arsip...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleGandakanStokSkrip(2, 1)}
                  className="cursor-pointer bg-white/10 hover:bg-[#d4f34a] text-white hover:text-[#14141f] border border-white/15 font-bold text-xs py-2.5 px-4 rounded-lg transition flex items-center justify-between"
                >
                  <span>Buat 2 Variasi Skrip</span>
                  <span className="bg-white/15 px-2 py-0.5 rounded-md text-[11px]">
                    1 Koin
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGandakanStokSkrip(5, 2)}
                  className="cursor-pointer bg-white/10 hover:bg-[#d4f34a] text-white hover:text-[#14141f] border border-white/15 font-bold text-xs py-2.5 px-4 rounded-lg transition flex items-center justify-between"
                >
                  <span>Buat 5 Variasi Skrip</span>
                  <span className="bg-white/15 px-2 py-0.5 rounded-md text-[11px]">
                    2 Koin
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGandakanStokSkrip(10, 3)}
                  className="cursor-pointer bg-[#d4f34a] text-[#14141f] font-bold text-xs py-2.5 px-4 rounded-lg transition flex items-center justify-between"
                >
                  <span>Buat 10 Variasi Skrip</span>
                  <span className="bg-[#14141f] text-[#d4f34a] px-2 py-0.5 rounded-md text-[11px]">
                    3 Koin
                  </span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={isLearningDiff}
            onClick={handleSimpanEditanUser}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-lg"
          >
            {isLearningDiff
              ? "Menyimpan..."
              : "Simpan Revisi Skrip & Perbarui Kamus Gaya Bahasa"}
          </button>
        </div>
      )}
    </div>
  )
}
