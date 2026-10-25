"use client"
import { useState, useEffect, useRef } from "react"
import { FlatIcon, StoryVoiceInput, AILoadingBox } from "./SharedUI"

const PILIHAN_DURASI_KONTEN = [
  "15 Detik (3 Bagian, 40 - 50 Kata)",
  "30 Detik (4 Bagian, 80 - 95 Kata)",
  "60 Detik / 1 Menit (5 Bagian, 150 - 180 Kata)",
  "2 Menit (6 Bagian, 280 - 330 Kata)",
  "3 Menit (8 Bagian, 430 - 500 Kata)",
]

// 9 Format Konten Utama (Termasuk Speech, Kultum, & Pidato)
const SEMBILAN_FORMAT_KONTEN = [
  {
    id: "ugc",
    judul: "User-Generated Content (UGC)",
    ket: "Gaya berbagi pengalaman sebagai pengguna langsung yang jujur dan natural.",
  },
  {
    id: "edukasi",
    judul: "Educational Content",
    ket: "Membongkar wawasan, cara kerja, atau ilmu baru secara runtut dan mudah dipahami.",
  },
  {
    id: "entertaining",
    judul: "Entertaining Content",
    ket: "Mengutamakan cerita yang seru, menghibur, dan menjaga rasa penasaran penonton.",
  },
  {
    id: "inspirational",
    judul: "Inspirational & Motivating",
    ket: "Menggerakkan hati, mengubah pola pikir, dan membangkitkan semangat penonton.",
  },
  {
    id: "interactive",
    judul: "Interactive Content",
    ket: "Melibatkan penonton lewat pertanyaan, tebak pilihan, dan diskusi di komentar.",
  },
  {
    id: "testimonial_review",
    judul: "Testimonial and Reviews",
    ket: "Mengulas pengalaman pakai nyata, bedah kelebihan-kekurangan, dan bukti hasil.",
  },
  {
    id: "seasonal",
    judul: "Seasonal Content",
    ket: "Konten yang dikaitkan dengan momen khusus, musim, gajian, atau hari besar.",
  },
  {
    id: "tips_trick",
    judul: "Tips & Trick Praktis",
    ket: "Langkah taktis dan solusi praktis yang bisa langsung dicoba penonton hari ini.",
  },
  {
    id: "speech_kultum_pidato",
    judul: "Materi Speech, Kultum, & Pidato",
    ket: "Naskah berbicara di depan umum, ceramah/kultum, sambutan, atau orasi panggung.",
  },
]

// 5 Faktor Pemicu Viral Utama
const LIMA_FAKTOR_VIRAL = [
  {
    id: "fakta_realitas",
    judul: "1. Mengandung Fakta & Realitas",
    ket: "Mengangkat kenyataan lapangan atau kebenaran nyata yang sering diabaikan orang.",
  },
  {
    id: "pro_kontra",
    judul: "2. Memancing Pro & Kontra",
    ket: "Mengangkat dua sudut pandang berbeda yang memicu debat sehat di kolom komentar.",
  },
  {
    id: "tokoh_brand_terkenal",
    judul: "3. Membahas Tokoh / Artis / Brand Terkenal",
    ket: "Mengambil pelajaran atau membedah fenomena dari sosok maupun merek populer.",
  },
  {
    id: "komedi",
    judul: "4. Mengandung Komedi & Sentilan",
    ket: "Menyampaikan pesan lewat observasi kocak, sentilan santai, atau humor segar.",
  },
  {
    id: "emosional",
    judul: "5. Memancing Emosional",
    ket: "Menyentuh perasaan manusiawi penonton (haru, kesal karena terwakili, bangga, kagum).",
  },
]

// 4 Pendekatan Membangun Kepercayaan (Khusus Fase 2: Trust)
const EMPAT_PENDEKATAN_TRUST = [
  {
    id: "bukti_jam_terbang",
    judul: "Jam Terbang & Pengalaman Lapangan",
    ket: "Ceritakan berapa lama kamu bergelut di bidang ini dan pelajaran yang sudah dilalui.",
  },
  {
    id: "proses_balik_layar",
    judul: "Proses Jujur di Balik Layar",
    ket: "Tunjukkan proses kerja asli, ketelitian, atau perjuangan yang jarang dilihat orang.",
  },
  {
    id: "studi_kasus_nyata",
    judul: "Bedah Kasus & Hasil Praktik",
    ket: "Ceritakan masalah nyata yang pernah kamu tangani beserta langkah penyelesaiannya.",
  },
  {
    id: "prinsip_dan_nilai",
    judul: "Prinsip Jujur & Standar Kualitas",
    ket: "Tegaskan prinsip kejujuran dan standar yang selalu kamu jaga untuk penonton.",
  },
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

function ambilDaftarBagianSkrip(skripObj) {
  if (!skripObj) return []
  if (Array.isArray(skripObj.sections) && skripObj.sections.length > 0) {
    return skripObj.sections.map((sec, idx) => ({
      partNumber: sec.partNumber || idx + 1,
      partTitle: sec.partTitle || `Bagian ${idx + 1}`,
      estimatedSeconds: sec.estimatedSeconds || "",
      labelMini:
        sec.labelMini ||
        `Bagian ${sec.partNumber || idx + 1} • ${sec.partTitle || `Babak ${idx + 1}`}`,
      spokenText: sec.spokenText || sec.voiceover || "",
      voiceover: sec.spokenText || sec.voiceover || "",
      onScreenText:
        sec.onScreenText ||
        sec.teksLayar ||
        sec.spokenText ||
        sec.voiceover ||
        "",
      teksLayar:
        sec.onScreenText ||
        sec.teksLayar ||
        sec.spokenText ||
        sec.voiceover ||
        "",
      visualCue: sec.visualCue || sec.visual || "",
      visual: sec.visualCue || sec.visual || "",
    }))
  }
  if (Array.isArray(skripObj.segmen) && skripObj.segmen.length > 0) {
    return skripObj.segmen.map((seg, idx) => ({
      partNumber: seg.partNumber || idx + 1,
      partTitle:
        seg.partTitle ||
        (seg.labelMini
          ? seg.labelMini.replace(/^Bagian \d+\s*•\s*/i, "")
          : `Bagian ${idx + 1}`),
      estimatedSeconds: seg.estimatedSeconds || "",
      labelMini: seg.labelMini || `Bagian ${idx + 1}`,
      spokenText: seg.spokenText || seg.voiceover || "",
      voiceover: seg.voiceover || seg.spokenText || "",
      onScreenText: seg.onScreenText || seg.teksLayar || seg.voiceover || "",
      teksLayar: seg.teksLayar || seg.onScreenText || seg.voiceover || "",
      visualCue: seg.visualCue || seg.visual || "",
      visual: seg.visual || seg.visualCue || "",
    }))
  }
  return []
}

function hitungJumlahKataSkrip(daftarBagian) {
  if (!Array.isArray(daftarBagian)) return 0
  const gabungan = daftarBagian
    .map((b) => b.spokenText || b.voiceover || "")
    .join(" ")
    .replace(/\[.*?\]/g, " ")
    .trim()
  if (!gabungan) return 0
  return gabungan.split(/\s+/).filter(Boolean).length
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

  // State Strategi 3 Fase, 9 Format, 5 Faktor Viral, Trust, Soft/Hard Selling, & Kepadatan Kata
  const [contentPhase, setContentPhase] = useState("fase_1_viral")
  const [contentFormat, setContentFormat] = useState("edukasi")
  const [viralTrigger, setViralTrigger] = useState("fakta_realitas")
  const [trustApproach, setTrustApproach] = useState("bukti_jam_terbang")
  const [sellingStyle, setSellingStyle] = useState("soft_selling")
  const [wordDensity, setWordDensity] = useState("padat_kaya_kosakata")
  const [contextMode, setContextMode] = useState("sesuai_niche")

  const [kategoriKonten, setKategoriKonten] = useState("personal")
  const [jenisPromosi, setJenisPromosi] = useState("produk")

  // Daftar Multi-Akun (Ternak Akun) yang tersimpan di localStorage
  const [daftarAkunTersimpan, setDaftarAkunTersimpan] = useState([])
  const [idAkunTerpilih, setIdAkunTerpilih] = useState("akun_utama")

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const rawTernak = localStorage.getItem(
        `hookya_ternak_akun_${userId || "guest"}`,
      )
      if (rawTernak) {
        const parsed = JSON.parse(rawTernak)
        if (Array.isArray(parsed.daftarAkun)) {
          setDaftarAkunTersimpan(parsed.daftarAkun)
        }
        if (parsed.idAkunAktif) {
          setIdAkunTerpilih(parsed.idAkunAktif)
        }
      }
    } catch {
      // Abaikan
    }
  }, [userId])

  const defaultSpekDiri = [
    personaProfile?.niche_context?.unique_selling_point ||
      personaProfile?.positioning_and_usp?.unique_selling_point,
    personaProfile?.niche_context?.authority_role ||
      personaProfile?.positioning_and_usp?.authority_role,
  ]
    .filter(Boolean)
    .join(" • ")

  const [personalSpecsInput, setPersonalSpecsInput] = useState(defaultSpekDiri)

  useEffect(() => {
    if (!personalSpecsInput && defaultSpekDiri) {
      setPersonalSpecsInput(defaultSpekDiri)
    }
  }, [defaultSpekDiri, personalSpecsInput])

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
    content_phase: "fase_1_viral",
    content_format: "edukasi",
    viral_trigger: "fakta_realitas",
    trust_approach: "bukti_jam_terbang",
    selling_style: "soft_selling",
    word_density: "padat_kaya_kosakata",
    personal_specs: "",
    context_mode: "sesuai_niche",
    selected_framework: "PAS_RELATABLE_BRIDGE",
    target_platform: PILIHAN_DURASI_KONTEN[2],
    core_idea: "",
    chosen_angle: "",
    personal_context_or_story: "",
    injected_reference: {
      type: "Fakta & Realitas Sebab-Akibat",
      title: "",
      summary: "",
    },
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

  const handlePilihFaseKonten = (faseBaru) => {
    setContentPhase(faseBaru)
    if (faseBaru === "fase_3_konversi") {
      setKategoriKonten("affiliate")
    } else {
      setKategoriKonten("personal")
    }
    if (faseBaru === "fase_2_trust" && !personalSpecsInput && defaultSpekDiri) {
      setPersonalSpecsInput(defaultSpekDiri)
    }
  }

  const handleGantiAkunCepat = (akunObj) => {
    if (!akunObj) return
    setIdAkunTerpilih(akunObj.id)
    if (akunObj.personaProfile) {
      setPersonaProfile(akunObj.personaProfile)
    }
    if (akunObj.uspDiriInput) {
      setPersonalSpecsInput(akunObj.uspDiriInput)
    }
    showToast(`Menggunakan profil akun: ${akunObj.labelAkun}`)
  }

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
        if (parsed.contentPhase) setContentPhase(parsed.contentPhase)
        if (parsed.contentFormat) setContentFormat(parsed.contentFormat)
        if (parsed.viralTrigger) setViralTrigger(parsed.viralTrigger)
        if (parsed.trustApproach) setTrustApproach(parsed.trustApproach)
        if (parsed.sellingStyle) setSellingStyle(parsed.sellingStyle)
        if (parsed.wordDensity) setWordDensity(parsed.wordDensity)
        if (parsed.personalSpecsInput)
          setPersonalSpecsInput(parsed.personalSpecsInput)
        if (parsed.kategoriKonten) setKategoriKonten(parsed.kategoriKonten)
        if (parsed.jenisPromosi) setJenisPromosi(parsed.jenisPromosi)
        if (parsed.contextMode) setContextMode(parsed.contextMode)
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
        contentPhase,
        contentFormat,
        viralTrigger,
        trustApproach,
        sellingStyle,
        wordDensity,
        personalSpecsInput,
        kategoriKonten,
        jenisPromosi,
        contextMode,
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
    contentPhase,
    contentFormat,
    viralTrigger,
    trustApproach,
    sellingStyle,
    wordDensity,
    personalSpecsInput,
    kategoriKonten,
    jenisPromosi,
    contextMode,
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

    const daftarBagian = ambilDaftarBagianSkrip(hasilSkrip)
    const barisHTML = daftarBagian
      .map(
        (s) => `
        <div style="border:1px solid #cbd5e1; border-radius:8px; padding:14px; margin-bottom:12px;">
          <div style="font-weight:bold; font-size:12px; color:#475569; margin-bottom:6px;">
            Bagian ${s.partNumber} • ${s.partTitle} ${s.estimatedSeconds ? `(${s.estimatedSeconds})` : ""}
          </div>
          <div style="font-size:14px; line-height:1.6; white-space:pre-line; margin-bottom:8px;"><strong>Naskah Lisan / Dialog:</strong><br/>${
            modeTampilanSkrip === "teks" ? s.onScreenText : s.spokenText
          }</div>
          <div style="font-size:12px; color:#334155; background:#f8fafc; padding:8px; border-radius:6px;"><strong>Arahan Adegan Visual:</strong> ${s.visualCue}</div>
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
          <p style="font-size:12px; color:#64748b; margin-top:0; margin-bottom:20px;">
            Hookya.site • ${hasilSkrip.waktuDibuat} • ${daftarBagian.length} Bagian Dinamis
          </p>
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

      showToast(
        "Data produk dan manfaat pemakaian berhasil disalin dari screenshot.",
      )
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
    showToast("Menyusun 10 ide materi sesuai format dan faktor pemicu...")
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "buat_10_ide_topik",
          userId,
          namaUser,
          contentPhase,
          contentFormat,
          viralTrigger,
          trustApproach,
          sellingStyle,
          personalSpecs: personalSpecsInput,
          contextMode,
          personaProfile,
          kategoriKonten,
        }),
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.ideTopik) && data.ideTopik.length > 0) {
        const sepuluhIde = data.ideTopik.slice(0, 10)
        setDaftar10IdeTopik(sepuluhIde)
        if (!rawTopicInput.trim() && sepuluhIde[0]?.judul) {
          setRawTopicInput(sepuluhIde[0].judul)
        }
        showToast("10 ide materi baru berhasil dimuat.")
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

    if (contentPhase !== "fase_3_konversi") {
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
          contentPhase,
          contentFormat,
          viralTrigger,
          trustApproach,
          sellingStyle,
          wordDensity,
          personalSpecs: personalSpecsInput,
          contextMode,
          stageNumber: 1,
          batchKe: isRegenerateBatch ? stage1Batches.length + 1 : 1,
          opsiSebelumnya: opsiAngleSebelumnya,
          personaProfile,
          stageInput: {
            rawTopic: topikUtama,
            contentPhase,
            contentFormat,
            viralTrigger,
            trustApproach,
            sellingStyle,
            wordDensity,
            personalSpecs: personalSpecsInput,
            contextMode,
            targetPlatform: targetPlatformInput,
            kategori:
              contentPhase === "fase_1_viral"
                ? "Fase 1: Cari Viral Dulu"
                : contentPhase === "fase_2_trust"
                  ? "Fase 2: Menciptakan Trust"
                  : "Fase 3: Konten Konversi & Jualan",
            jenisPromosi:
              contentPhase === "fase_3_konversi" ? jenisPromosi : "personal",
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

      if (
        contentPhase === "fase_2_trust" &&
        !tempStoryInput &&
        personalSpecsInput
      ) {
        setTempStoryInput(personalSpecsInput)
      }

      setContentBrief((prev) => ({
        ...prev,
        session_id: `ses_${Date.now().toString().slice(-4)}`,
        content_phase: contentPhase,
        content_format: contentFormat,
        viral_trigger: viralTrigger,
        trust_approach: trustApproach,
        selling_style: sellingStyle,
        word_density: wordDensity,
        personal_specs: personalSpecsInput,
        context_mode: contextMode,
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
      content_phase: contentPhase,
      content_format: contentFormat,
      viral_trigger: viralTrigger,
      trust_approach: trustApproach,
      selling_style: sellingStyle,
      word_density: wordDensity,
      personal_specs: personalSpecsInput,
      context_mode: contextMode,
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
          contentPhase,
          contentFormat,
          viralTrigger,
          trustApproach,
          sellingStyle,
          wordDensity,
          personalSpecs: personalSpecsInput,
          contextMode,
          stageNumber: 2,
          batchKe: isRegenerateBatch ? stage2Batches.length + 1 : 1,
          opsiSebelumnya: opsiRefSebelumnya,
          personaProfile,
          stageInput: {
            contentPhase,
            contentFormat,
            viralTrigger,
            trustApproach,
            sellingStyle,
            wordDensity,
            personalSpecs: personalSpecsInput,
            contextMode,
            coreIdea: contentBrief.core_idea,
            chosenAngle: finalAngle,
            userStory: finalStory,
            detailPromosi:
              contentPhase === "fase_3_konversi"
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
      content_phase: contentPhase,
      content_format: contentFormat,
      viral_trigger: viralTrigger,
      trust_approach: trustApproach,
      selling_style: sellingStyle,
      word_density: wordDensity,
      personal_specs: personalSpecsInput,
      context_mode: contextMode,
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
          contentPhase,
          contentFormat,
          viralTrigger,
          trustApproach,
          sellingStyle,
          wordDensity,
          personalSpecs: personalSpecsInput,
          contextMode,
          stageNumber: 3,
          batchKe: isRegenerateBatch ? stage3Batches.length + 1 : 1,
          opsiSebelumnya: opsiHookSebelumnya,
          personaProfile,
          stageInput: {
            contentPhase,
            contentFormat,
            viralTrigger,
            trustApproach,
            sellingStyle,
            wordDensity,
            personalSpecs: personalSpecsInput,
            contextMode,
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
      content_phase: contentPhase,
      content_format: contentFormat,
      viral_trigger: viralTrigger,
      trust_approach: trustApproach,
      selling_style: sellingStyle,
      word_density: wordDensity,
      personal_specs: personalSpecsInput,
      context_mode: contextMode,
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
          contentPhase,
          contentFormat,
          viralTrigger,
          trustApproach,
          sellingStyle,
          wordDensity,
          personalSpecs: personalSpecsInput,
          contextMode,
          personaProfile,
          contentBrief: {
            ...contentBrief,
            content_phase: contentPhase,
            content_format: contentFormat,
            viral_trigger: viralTrigger,
            trust_approach: trustApproach,
            selling_style: sellingStyle,
            word_density: wordDensity,
            personal_specs: personalSpecsInput,
            context_mode: contextMode,
          },
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

      const sectionsHasil = Array.isArray(data.sections)
        ? data.sections
        : ambilDaftarBagianSkrip(data)
      const segmenHasil = Array.isArray(data.segmen)
        ? data.segmen
        : sectionsHasil.map((sec, idx) => ({
            idSegmen: `BEAT_${sec.partNumber || idx + 1}`,
            partNumber: sec.partNumber || idx + 1,
            partTitle: sec.partTitle || `Bagian ${idx + 1}`,
            estimatedSeconds: sec.estimatedSeconds || "",
            labelMini: `Bagian ${sec.partNumber || idx + 1} • ${sec.partTitle || `Babak ${idx + 1}`}${sec.estimatedSeconds ? ` (${sec.estimatedSeconds})` : ""}`,
            voiceover: sec.spokenText || sec.voiceover || "",
            spokenText: sec.spokenText || sec.voiceover || "",
            teksLayar:
              sec.onScreenText || sec.teksLayar || sec.spokenText || "",
            onScreenText:
              sec.onScreenText || sec.teksLayar || sec.spokenText || "",
            visual: sec.visualCue || sec.visual || "",
            visualCue: sec.visualCue || sec.visual || "",
          }))

      setAiOriginalDraft(JSON.parse(JSON.stringify(segmenHasil)))
      setTargetDurasiUbah(
        contentBrief.target_platform || PILIHAN_DURASI_KONTEN[2],
      )
      setKoleksiVariasiGanda([])
      setIndexVariasiAktif(0)

      const uploadPkg = data.uploadPackage || data.upload_pack || null
      const uploadPackTerformat = uploadPkg
        ? {
            coverTitle: uploadPkg.coverTitle || uploadPkg.cover_title || "",
            caption: uploadPkg.caption || uploadPkg.caption_seo || "",
            pinnedComment:
              uploadPkg.pinnedComment || uploadPkg.pinned_comment || "",
            cover_title: uploadPkg.coverTitle || uploadPkg.cover_title || "",
            caption_seo: uploadPkg.caption || uploadPkg.caption_seo || "",
            pinned_comment:
              uploadPkg.pinnedComment || uploadPkg.pinned_comment || "",
          }
        : null

      const skripBaru = {
        id: Date.now(),
        dbId: null,
        judul: contentBrief.core_idea,
        kategori:
          contentPhase === "fase_1_viral"
            ? "Fase 1: Cari Viral"
            : contentPhase === "fase_2_trust"
              ? "Fase 2: Menciptakan Trust"
              : "Fase 3: Konten Konversi",
        bentuk: ugcConfig.aktif
          ? `Dialog UGC (${ugcConfig.jumlahOrang} Orang: ${pemeranBersih.join(", ")})`
          : bentukKontenFinal,
        waktuDibuat: waktuSekarang,
        targetDuration:
          data.targetDuration || contentBrief.target_platform || "60 Detik",
        flowStyle: data.flowStyle || "Padat & Mengalir",
        totalSections: segmenHasil.length,
        metadata: data.metadata || {
          estimated_duration:
            data.targetDuration || contentBrief.target_platform,
          flow_style: data.flowStyle || "Padat & Mengalir",
          framework_used: contentBrief.selected_framework,
        },
        scriptScore: data.script_score || null,
        uploadPackage: uploadPackTerformat,
        uploadPack: uploadPackTerformat,
        contentBrief,
        sudahUpload: false,
        tanggalUpload: "",
        sections: sectionsHasil,
        segmen: segmenHasil,
      }

      const tersimpan = await simpanAtauUpdateSkripDatabase(skripBaru)
      setHasilSkrip(tersimpan)
      setKoleksiSkripTersimpan((prev) => [tersimpan, ...prev])
      setStage(5)
      showToast(
        `Skrip selesai disusun (${hitungJumlahKataSkrip(segmenHasil)} kata dalam ${segmenHasil.length} bagian) dan disimpan ke arsip.`,
      )
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUbahDurasiSkrip = async (
    durasiPilihan,
    kepadatanOverride = wordDensity,
  ) => {
    if (!hasilSkrip || isChangingDuration) return
    setTargetDurasiUbah(durasiPilihan)
    setIsChangingDuration(true)
    showToast(`Menyesuaikan panjang & kepadatan naskah ke ${durasiPilihan}...`)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ubah_durasi_skrip",
          userId,
          namaUser,
          contentPhase,
          contentFormat,
          viralTrigger,
          trustApproach,
          sellingStyle,
          wordDensity: kepadatanOverride,
          personalSpecs: personalSpecsInput,
          contextMode,
          personaProfile,
          subyek: hasilSkrip.judul,
          skripSebelumnya: ambilDaftarBagianSkrip(hasilSkrip),
          durasiTargetBaru: durasiPilihan,
        }),
      })

      const data = await res.json()
      if (!res.ok)
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")

      const sectionsBaru = Array.isArray(data.sections)
        ? data.sections
        : ambilDaftarBagianSkrip(data)
      const segmenBaru = Array.isArray(data.segmen) ? data.segmen : sectionsBaru

      const skripDiperbarui = {
        ...hasilSkrip,
        targetDuration: data.targetDuration || durasiPilihan,
        flowStyle: data.flowStyle || hasilSkrip.flowStyle || "Padat & Mengalir",
        totalSections: segmenBaru.length,
        metadata: {
          ...(hasilSkrip.metadata || {}),
          estimated_duration:
            data.targetDuration || data.estimated_duration || durasiPilihan,
          flow_style: data.flowStyle || hasilSkrip.metadata?.flow_style,
        },
        sections: sectionsBaru,
        segmen: segmenBaru,
      }
      setHasilSkrip(skripDiperbarui)
      await simpanAtauUpdateSkripDatabase(skripDiperbarui)
      showToast(
        `Naskah disesuaikan ke ${durasiPilihan} (${hitungJumlahKataSkrip(segmenBaru)} kata dalam ${segmenBaru.length} bagian).`,
      )
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
          contentPhase,
          contentFormat,
          viralTrigger,
          trustApproach,
          sellingStyle,
          wordDensity,
          personalSpecs: personalSpecsInput,
          contextMode,
          personaProfile,
          subyek: hasilSkrip.judul,
          skripSebelumnya: ambilDaftarBagianSkrip(hasilSkrip),
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
        const bagVariasi = ambilDaftarBagianSkrip(v)
        const objekSkripVariasi = {
          id: Date.now() + i + 1,
          dbId: null,
          judul: `${hasilSkrip.judul} (${v.judulVariasi || `Variasi ${i + 1}`})`,
          kategori: hasilSkrip.kategori || "Stok Konten",
          bentuk: hasilSkrip.bentuk,
          waktuDibuat: waktuSekarang,
          targetDuration: hasilSkrip.targetDuration,
          flowStyle: hasilSkrip.flowStyle,
          totalSections: bagVariasi.length,
          metadata: hasilSkrip.metadata,
          sudahUpload: false,
          tanggalUpload: "",
          sections: bagVariasi,
          segmen: bagVariasi,
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
          "Saldo koin tidak mencukupi untuk pembaruan bagian ke-3. Silakan isi ulang koin.",
        )
        setActiveMenu("topup")
        return
      }
      await updateKoinDatabase(coins - 1)
    }
    setRegenCount(hitunganBaru)

    const daftarBagianSaatIni = ambilDaftarBagianSkrip(hasilSkrip)
    const bagianLama = daftarBagianSaatIni[indexBaris]
    if (!bagianLama) return

    setRegeneratingIndex(indexBaris)
    showToast(
      `Memperbarui Bagian ${bagianLama.partNumber} (${bagianLama.partTitle})...`,
    )

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate_satu_kerangka",
          userId,
          namaUser,
          contentPhase,
          contentFormat,
          viralTrigger,
          contextMode,
          personaProfile,
          subyek: hasilSkrip.judul,
          segmenTarget: bagianLama,
        }),
      })

      const data = await res.json()
      if (!res.ok)
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")

      const bagianUpdate = { ...bagianLama }
      const visualBaru =
        data.visualCue ||
        data.visual ||
        bagianLama.visualCue ||
        bagianLama.visual
      const spokenBaru =
        data.spokenText ||
        data.voiceover ||
        bagianLama.spokenText ||
        bagianLama.voiceover
      const screenBaru =
        data.onScreenText ||
        data.teksLayar ||
        spokenBaru ||
        bagianLama.onScreenText

      if (fokusTarget === "visual") {
        bagianUpdate.visualCue = visualBaru
        bagianUpdate.visual = visualBaru
      } else {
        bagianUpdate.spokenText = spokenBaru
        bagianUpdate.voiceover = spokenBaru
        bagianUpdate.onScreenText = screenBaru
        bagianUpdate.teksLayar = screenBaru
        bagianUpdate.visualCue = visualBaru
        bagianUpdate.visual = visualBaru
      }

      const daftarBagianBaru = daftarBagianSaatIni.map((s, idx) =>
        idx === indexBaris ? bagianUpdate : s,
      )

      const skripDiperbarui = {
        ...hasilSkrip,
        sections: daftarBagianBaru,
        segmen: daftarBagianBaru,
      }
      setHasilSkrip(skripDiperbarui)
      await simpanAtauUpdateSkripDatabase(skripDiperbarui)
      showToast(`Bagian ${bagianLama.partNumber} selesai diperbarui.`)
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
          contextMode,
          personaProfile,
          subyek: hasilSkrip.judul,
          skripSebelumnya: ambilDaftarBagianSkrip(hasilSkrip),
          bentukKontenBaru: targetKonversiBentuk,
        }),
      })

      const data = await res.json()
      if (!res.ok)
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")

      const bagianKonversi = Array.isArray(data.sections)
        ? data.sections
        : ambilDaftarBagianSkrip(data)

      const skripDiperbarui = {
        ...hasilSkrip,
        bentuk: targetKonversiBentuk,
        sections:
          bagianKonversi.length > 0 ? bagianKonversi : hasilSkrip.sections,
        segmen: bagianKonversi.length > 0 ? bagianKonversi : hasilSkrip.segmen,
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
          userEditedScript: ambilDaftarBagianSkrip(hasilSkrip),
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

  const daftarBagianAktif = ambilDaftarBagianSkrip(hasilSkrip)
  const totalKataSkripAktif = hitungJumlahKataSkrip(daftarBagianAktif)
  const estimasiDetikBacaNormal = Math.round((totalKataSkripAktif / 140) * 60)
  const paketUploadAktif =
    hasilSkrip?.uploadPackage || hasilSkrip?.uploadPack || null
  const infoFormatTerpilih = SEMBILAN_FORMAT_KONTEN.find(
    (f) => f.id === contentFormat,
  )
  const infoFaktorTerpilih = LIMA_FAKTOR_VIRAL.find(
    (v) => v.id === viralTrigger,
  )

  return (
    <div className="bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 space-y-6 w-full max-w-full overflow-hidden">
      {/* HEADER TAHAP TANPA EYEBROW BADGE */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-[#14141f] break-words">
            {stage === 0 && "Buat Skrip Konten"}
            {stage === 1 && "Tahap 1: Pilih Sudut Pandang Bahasan"}
            {stage === 2 && "Tahap 2: Ilustrasi, Bukti Fakta & Solusi"}
            {stage === 3 && "Tahap 3: Struktur, Kalimat Pembuka (Hook) & CTA"}
            {stage === 4 && "Tahap 4: Periksa Rancangan Konten"}
            {stage === 5 && hasilSkrip?.judul}
          </h2>
          {stage > 0 && stage < 5 && (
            <p className="text-xs text-slate-500 mt-0.5">
              Langkah {stage} dari 4 •{" "}
              <strong>{infoFormatTerpilih?.judul}</strong> •{" "}
              <strong>{infoFaktorTerpilih?.judul}</strong>
            </p>
          )}
          {stage === 5 && hasilSkrip && (
            <p className="text-xs text-slate-500 mt-0.5">
              {daftarBagianAktif.length} Bagian Dinamis •{" "}
              <strong>{totalKataSkripAktif} Kata</strong> (Estimasi baca normal:{" "}
              <strong>{estimasiDetikBacaNormal} detik</strong>)
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
          {/* PEMILIH CEPAT PROFIL AKUN (JIKA MEMILIKI MULTI-AKUN TERNAK AKUN) */}
          {daftarAkunTersimpan.length > 1 && (
            <div className="bg-[#f4f5f7] p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#14141f]">
                Profil Akun Aktif:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {daftarAkunTersimpan.map((ak) => (
                  <button
                    key={ak.id}
                    type="button"
                    onClick={() => handleGantiAkunCepat(ak)}
                    className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      idAkunTerpilih === ak.id
                        ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                        : "bg-white text-slate-700 border-slate-200 hover:border-[#14141f]"
                    }`}
                  >
                    {ak.labelAkun}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SEKSI 1: PILIH FASE KONTEN (VIRAL, TRUST, ATAU KONVERSI) */}
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-[#14141f]">
                1. Pilih Fase Tujuan Konten
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Pilih apakah konten ini bertujuan mencari jangkauan viral baru,
                membangun kepercayaan (trust), atau melakukan konversi
                penjualan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "fase_1_viral",
                  judul: "Fase 1: Cari Viral Dulu",
                  ket: "Menjangkau penonton baru seluas mungkin lewat 9 format konten dan 5 faktor pemicu viral.",
                },
                {
                  id: "fase_2_trust",
                  judul: "Fase 2: Menciptakan Trust",
                  ket: "Membangun kepercayaan penonton lewat jam terbang, proses kerja jujur, dan studi kasus nyata.",
                },
                {
                  id: "fase_3_konversi",
                  judul: "Fase 3: Konten Konversi (Jualan)",
                  ket: "Mengubah penonton menjadi pembeli lewat strategi Soft Selling maupun Hard Selling.",
                },
              ].map((f) => {
                const terpilih = contentPhase === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handlePilihFaseKonten(f.id)}
                    className={`cursor-pointer p-3.5 rounded-xl text-left border transition flex items-start justify-between gap-3 ${
                      terpilih
                        ? "bg-[#14141f] text-white border-[#14141f]"
                        : "bg-white text-[#14141f] border-slate-200 hover:border-[#14141f]"
                    }`}
                  >
                    <div>
                      <div
                        className={`text-xs sm:text-sm font-bold ${
                          terpilih ? "text-[#d4f34a]" : "text-[#14141f]"
                        }`}
                      >
                        {f.judul}
                      </div>
                      <p
                        className={`text-xs mt-1 leading-relaxed ${
                          terpilih ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {f.ket}
                      </p>
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

            {/* PANEL KHUSUS FASE 2: PENDEKATAN TRUST & SPESIFIKASI PERSONAL DIRI */}
            {contentPhase === "fase_2_trust" && (
              <div className="bg-[#f2fce2] border border-[#4d6b14]/25 p-4 rounded-xl space-y-3 mt-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#14141f]">
                    Pengaturan Fase 2: Pendekatan Kepercayaan & Spesifikasi Diri
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Pilih sudut pembuktian kepercayaan dan pastikan spesifikasi
                    pengalaman dirimu di bawah sudah sesuai.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {EMPAT_PENDEKATAN_TRUST.map((tr) => {
                    const aktif = trustApproach === tr.id
                    return (
                      <button
                        key={tr.id}
                        type="button"
                        onClick={() => setTrustApproach(tr.id)}
                        className={`cursor-pointer p-3 rounded-lg border text-left transition ${
                          aktif
                            ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                            : "bg-white text-[#14141f] border-slate-200"
                        }`}
                      >
                        <div className="text-xs font-bold">{tr.judul}</div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            aktif ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {tr.ket}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14141f] mb-1">
                    Spesifikasi Personal Diri / Jam Terbang yang Diselipkan ke
                    Skrip
                  </label>
                  <input
                    type="text"
                    value={personalSpecsInput}
                    onChange={(e) => setPersonalSpecsInput(e.target.value)}
                    placeholder="Contoh: Sudah 3 tahun praktik langsung di lapangan dan menangani puluhan kasus..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs font-bold text-[#14141f] outline-none focus:border-[#14141f]"
                  />
                </div>
              </div>
            )}

            {/* PANEL KHUSUS FASE 3: PILIHAN SOFT SELLING VS HARD SELLING */}
            {contentPhase === "fase_3_konversi" && (
              <div className="bg-[#f4f5f7] border border-slate-200 p-4 rounded-xl space-y-3 mt-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#14141f]">
                    Pilih Strategi Penjualan (Soft Selling vs Hard Selling)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tentukan cara menawarkan produk atau campaign di dalam
                    naskah.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSellingStyle("soft_selling")}
                    className={`cursor-pointer p-3.5 rounded-lg border text-left transition ${
                      sellingStyle === "soft_selling"
                        ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                        : "bg-white text-[#14141f] border-slate-200"
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold">
                      Soft Selling (Halus lewat Cerita / Edukasi)
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        sellingStyle === "soft_selling"
                          ? "text-slate-300"
                          : "text-slate-600"
                      }`}
                    >
                      Buka dengan cerita kejadian atau tips bermanfaat, lalu
                      masukkan produk secara alami sebagai solusi di akhir.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSellingStyle("hard_selling")}
                    className={`cursor-pointer p-3.5 rounded-lg border text-left transition ${
                      sellingStyle === "hard_selling"
                        ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                        : "bg-white text-[#14141f] border-slate-200"
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold">
                      Hard Selling (Langsung, Tegas & Penawaran Kuat)
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        sellingStyle === "hard_selling"
                          ? "text-slate-300"
                          : "text-slate-600"
                      }`}
                    >
                      Langsung tunjukkan masalah utama, keunggulan fisik produk,
                      bukti hasil, promo harga, dan ajakan beli tegas.
                    </p>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* SEKSI 2: PILIH 1 DARI 9 FORMAT KONTEN */}
          <section className="space-y-3 pt-6 border-t border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-[#14141f]">
                2. Pilih Format Pembawaan Konten
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Pilih jenis penyampaian konten, mulai dari UGC, Edukasi,
                Hiburan, Tips & Trick, hingga Materi Speech, Kultum, dan Pidato.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SEMBILAN_FORMAT_KONTEN.map((fmt) => {
                const terpilih = contentFormat === fmt.id
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      setContentFormat(fmt.id)
                      if (fmt.id === "ugc") {
                        setUgcConfig((prev) => ({ ...prev, aktif: true }))
                      }
                    }}
                    className={`cursor-pointer p-3.5 rounded-xl text-left border transition flex items-start justify-between gap-2.5 ${
                      terpilih
                        ? "bg-[#14141f] text-white border-[#14141f]"
                        : "bg-white text-[#14141f] border-slate-200 hover:border-[#14141f]"
                    }`}
                  >
                    <div>
                      <div
                        className={`text-xs sm:text-sm font-bold ${
                          terpilih ? "text-[#d4f34a]" : "text-[#14141f]"
                        }`}
                      >
                        {fmt.judul}
                      </div>
                      <p
                        className={`text-xs mt-1 leading-relaxed ${
                          terpilih ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {fmt.ket}
                      </p>
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
          </section>

          {/* SEKSI 3: PILIH 1 DARI 5 FAKTOR PEMICU VIRAL */}
          <section className="space-y-3 pt-6 border-t border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-[#14141f]">
                3. Pilih Faktor Pemicu Perhatian & Viral
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Tentukan unsur psikologis utama yang akan disuntikkan ke dalam
                naskah agar disukai dan dibagikan banyak orang.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LIMA_FAKTOR_VIRAL.map((fv) => {
                const terpilih = viralTrigger === fv.id
                return (
                  <button
                    key={fv.id}
                    type="button"
                    onClick={() => setViralTrigger(fv.id)}
                    className={`cursor-pointer p-3.5 rounded-xl text-left border transition flex items-start justify-between gap-3 ${
                      terpilih
                        ? "bg-[#14141f] text-white border-[#14141f]"
                        : "bg-white text-[#14141f] border-slate-200 hover:border-[#14141f]"
                    }`}
                  >
                    <div>
                      <div
                        className={`text-xs sm:text-sm font-bold ${
                          terpilih ? "text-[#d4f34a]" : "text-[#14141f]"
                        }`}
                      >
                        {fv.judul}
                      </div>
                      <p
                        className={`text-xs mt-1 leading-relaxed ${
                          terpilih ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {fv.ket}
                      </p>
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
          </section>

          {/* SEKSI 4: ATUR DURASI RIIL, KEPADATAN KATA, & KONTEKS BIDANG */}
          <section className="space-y-4 pt-6 border-t border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-[#14141f]">
                4. Pengaturan Durasi Baca Riil, Kepadatan Kata & Konteks Bidang
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Pilih mode <strong>Padat Berisi & Kaya Kosakata</strong> agar
                naskah dijabarkan secara lengkap dan benar-benar memenuhi
                estimasi waktu bicara normal (140 kata per menit).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                  Kepadatan Kalimat & Kosakata
                </label>
                <div className="bg-[#f4f5f7] p-1.5 rounded-xl grid grid-cols-2 gap-1.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setWordDensity("padat_kaya_kosakata")}
                    className={`cursor-pointer p-2.5 rounded-lg text-left transition ${
                      wordDensity === "padat_kaya_kosakata"
                        ? "bg-[#14141f] text-[#d4f34a]"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    <div className="text-xs font-bold">
                      Padat & Kaya Kosakata
                    </div>
                    <div className="text-[11px] opacity-80">
                      Penuh elaborasi & durasi riil utuh
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWordDensity("irit_ringkas")}
                    className={`cursor-pointer p-2.5 rounded-lg text-left transition ${
                      wordDensity === "irit_ringkas"
                        ? "bg-[#14141f] text-[#d4f34a]"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    <div className="text-xs font-bold">Ringkas & Irit Kata</div>
                    <div className="text-[11px] opacity-80">
                      Cepat & langsung ke inti
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                  Saklar Konteks Bidang
                </label>
                <div className="bg-[#f4f5f7] p-1.5 rounded-xl grid grid-cols-2 gap-1.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setContextMode("sesuai_niche")}
                    className={`cursor-pointer p-2.5 rounded-lg text-left transition ${
                      contextMode === "sesuai_niche"
                        ? "bg-[#14141f] text-[#d4f34a]"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    <div className="text-xs font-bold">
                      Sesuai Bidang Profil
                    </div>
                    <div className="text-[11px] opacity-80">
                      Pakai gaya bicara + niche profil
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContextMode("lintas_produk")}
                    className={`cursor-pointer p-2.5 rounded-lg text-left transition ${
                      contextMode === "lintas_produk"
                        ? "bg-[#14141f] text-[#d4f34a]"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    <div className="text-xs font-bold">
                      Lintas Topik / Bebas
                    </div>
                    <div className="text-[11px] opacity-80">
                      Hanya pakai gaya bicara
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                Pilih Target Durasi Baca Riil & Jumlah Bagian
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
          </section>

          {/* SEKSI 5: INPUT MATERI / PRODUK */}
          <section className="space-y-5 pt-6 border-t border-slate-200">
            {contentPhase !== "fase_3_konversi" ? (
              <div className="space-y-5">
                <div className="bg-[#f4f5f7] p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#14141f]">
                        5. Rekomendasi 10 Ide Materi (
                        {infoFormatTerpilih?.judul})
                      </h3>
                      <p className="text-xs text-slate-600">
                        Klik tombol Muat 10 Ide Baru untuk mencari ide topik
                        yang menggabungkan format dan faktor pemicu pilihanmu.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isLoadingIdeTopik}
                        onClick={handleGenerate10IdeTopikAI}
                        className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
                      >
                        {isLoadingIdeTopik && (
                          <FlatIcon
                            name="refresh"
                            className="w-3.5 h-3.5 animate-spin"
                          />
                        )}
                        <span>
                          {isLoadingIdeTopik
                            ? "Memuat..."
                            : "Carikan 10 Ide Materi Baru"}
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

                <div>
                  <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                    Topik Pembahasan (Bisa Pilih dari Kartu di Atas atau Ketik
                    Sendiri)
                  </label>
                  {renderAdaptiveVoiceInput({
                    rows: 2,
                    value: rawTopicInput,
                    onChange: setRawTopicInput,
                    placeholder:
                      "Ketik topik materi, judul kultum/pidato, atau fenomena yang ingin kamu bahas...",
                  })}
                </div>

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
                        Pengaturan Topik Lintas Bidang & Kutipan Sumber
                        (Opsional)
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Gunakan jika kamu ingin menempelkan teks
                        berita/referensi atau mengatur posisi bicara khusus.
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
                            "Tempelkan kutipan berita, dalil, atau data sumber yang ingin kamu bahas...",
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </section>

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
            Lanjutkan ke Ilustrasi & Solusi
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
            "Ilustrasi & Solusi",
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#14141f]">
              1. Pilih atau Sesuaikan Ilustrasi / Perbandingan (Set{" "}
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
              placeholder: "Ilustrasi atau perbandingan yang akan dipakai...",
            })}
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-[#14141f]">
              2. Pilih 1 Pondasi Fakta / Bukti Pengalaman
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
              3. Pilih Poin Bahasan Inti / Solusi
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
              placeholder="Tambahkan poin bahasan atau solusi sendiri (opsional)..."
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
              1. Pilih Struktur Alur Penyampaian
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
                    : "Menarik perhatian di kalimat pertama"
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
              3. Pilih Kalimat Penutup & Ajakan (CTA • Set {activeBatch3 + 1})
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
              <span className="text-slate-500">Fase & Format:</span>{" "}
              <strong>
                {contentPhase === "fase_1_viral"
                  ? "Fase 1: Cari Viral"
                  : contentPhase === "fase_2_trust"
                    ? "Fase 2: Menciptakan Trust"
                    : `Fase 3: Konversi (${sellingStyle === "hard_selling" ? "Hard Selling" : "Soft Selling"})`}{" "}
                • {infoFormatTerpilih?.judul}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Faktor Pemicu & Kepadatan:</span>{" "}
              <strong>
                {infoFaktorTerpilih?.judul} •{" "}
                {wordDensity === "padat_kaya_kosakata"
                  ? "Padat & Kaya Kosakata"
                  : "Ringkas & Irit Kata"}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Sudut Pandang:</span>{" "}
              <strong>{contentBrief.chosen_angle}</strong>
            </div>
            <div>
              <span className="text-slate-500">Target Durasi:</span>{" "}
              <strong>{contentBrief.target_platform}</strong>
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
              label="Menyusun naskah skrip penuh sesuai target jumlah kata dan durasi baca riil..."
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
                  const teksInti = daftarBagianAktif
                    .map(
                      (s) =>
                        `[Bagian ${s.partNumber} • ${s.partTitle}${s.estimatedSeconds ? ` (${s.estimatedSeconds})` : ""}]\n${
                          modeTampilanSkrip === "teks"
                            ? s.onScreenText
                            : s.spokenText
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

          {/* BAR KONTROL TAMPILAN, KEPADATAN KATA, DURASI & FORMAT VISUAL */}
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
                  Naskah Lisan ({totalKataSkripAktif} Kata)
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

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={wordDensity}
                  disabled={isChangingDuration}
                  onChange={(e) => {
                    const densBaru = e.target.value
                    setWordDensity(densBaru)
                    handleUbahDurasiSkrip(targetDurasiUbah, densBaru)
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs font-bold outline-none"
                >
                  <option value="padat_kaya_kosakata">
                    Gaya: Padat & Kaya Kosakata
                  </option>
                  <option value="irit_ringkas">
                    Gaya: Ringkas & Irit Kata
                  </option>
                </select>

                <select
                  value={targetDurasiUbah}
                  disabled={isChangingDuration}
                  onChange={(e) =>
                    handleUbahDurasiSkrip(e.target.value, wordDensity)
                  }
                  className="flex-1 sm:w-60 bg-white border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs font-bold outline-none"
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

          {/* KARTU BAGIAN SKRIP DINAMIS (3 S/D 8 BAGIAN) */}
          <div className="space-y-3.5">
            {daftarBagianAktif.map((sec, idx) => {
              const teksAktif =
                modeTampilanSkrip === "teks" ? sec.onScreenText : sec.spokenText
              const sedangRegenBarisIni = regeneratingIndex === idx

              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#14141f] bg-[#f4f5f7] px-2.5 py-1 rounded-md border border-slate-200">
                        Bagian {sec.partNumber || idx + 1} • {sec.partTitle}
                      </span>
                      {sec.estimatedSeconds && (
                        <span className="text-[11px] font-bold bg-[#f2fce2] text-[#4d6b14] px-2 py-0.5 rounded-md border border-[#4d6b14]/20">
                          {sec.estimatedSeconds}
                        </span>
                      )}
                    </div>
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
                            const listUpdate = daftarBagianAktif.map((s, i) => {
                              if (i !== idx) return s
                              if (modeTampilanSkrip === "teks") {
                                return {
                                  ...s,
                                  onScreenText: valBaru,
                                  teksLayar: valBaru,
                                }
                              }
                              return {
                                ...s,
                                spokenText: valBaru,
                                voiceover: valBaru,
                              }
                            })
                            setHasilSkrip({
                              ...hasilSkrip,
                              sections: listUpdate,
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
                        title="Buat variasi baru khusus bagian ini"
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
                          Arahan Adegan & Intonasi
                        </span>
                        <p className="text-xs font-normal text-slate-600 leading-relaxed break-words">
                          {sec.visualCue}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRegenerateSatuKerangka(idx, "visual")
                        }
                        title="Buat variasi visual khusus bagian ini"
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
                  {hasilSkrip.scriptScore.total_score || 95}/100
                </div>
                <span className="text-[10px] text-white">Skor Struktur</span>
              </div>
            </div>
          )}

          {/* PAKET PELENGKAP UPLOAD */}
          {paketUploadAktif && (
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
                      {paketUploadAktif.coverTitle ||
                        paketUploadAktif.cover_title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        paketUploadAktif.coverTitle ||
                          paketUploadAktif.cover_title ||
                          "",
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
                      {paketUploadAktif.caption || paketUploadAktif.caption_seo}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        paketUploadAktif.caption ||
                          paketUploadAktif.caption_seo ||
                          "",
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
                      {paketUploadAktif.pinnedComment ||
                        paketUploadAktif.pinned_comment}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        paketUploadAktif.pinnedComment ||
                          paketUploadAktif.pinned_comment ||
                          "",
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
