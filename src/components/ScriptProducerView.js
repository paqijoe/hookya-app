"use client"
import { useState, useEffect, useRef } from "react"
import {
  FlatIcon,
  StoryVoiceInput,
  AILoadingBox,
  rekamKetikanKeGudangIngatan,
  ambilDataGudangIngatan,
  simpanAnalisaGudangIngatan,
} from "./SharedUI"

const PILIHAN_DURASI_KONTEN = [
  "15 Detik (3 Bagian, 40-50 Kata)",
  "30 Detik (4 Bagian, 70-90 Kata)",
  "60 Detik (5 Bagian, 140-160 Kata)",
  "90 Detik (6 Bagian, 210-240 Kata)",
  "2 Menit (7 Bagian, 280-320 Kata)",
  "3 Menit (8 Bagian, 430-500 Kata)",
]

const SEMBILAN_FORMAT_KONTEN = [
  {
    id: "ugc",
    judul: "User-Generated Content (UGC)",
    ket: "Gaya kasual POV pengguna asli",
  },
  {
    id: "edukasi",
    judul: "Educational Content",
    ket: "Pemberian ilmu & kerangka pikir",
  },
  {
    id: "entertaining",
    judul: "Entertaining Content",
    ket: "Lucu, santai, dan menghibur",
  },
  {
    id: "inspirational",
    judul: "Inspirational & Motivating",
    ket: "Bangkitkan semangat pantang menyerah",
  },
  {
    id: "interactive",
    judul: "Interactive Content",
    ket: "Kuis, polling, & pemicu debat komentar",
  },
  {
    id: "testimonial_review",
    judul: "Testimonial & Reviews",
    ket: "Bedah hasil riil kepuasan pemakaian",
  },
  {
    id: "seasonal",
    judul: "Seasonal Content",
    ket: "Momen tren, hari raya, atau akhir tahun",
  },
  {
    id: "tips_trick",
    judul: "Tips & Trick Praktis",
    ket: "Langkah instan siap contek langsung",
  },
  {
    id: "speech_kultum_pidato",
    judul: "Materi Speech, Kultum, & Pidato",
    ket: "Retorika panggung & nasihat mendalam",
  },
]

const LIMA_FAKTOR_VIRAL = [
  {
    id: "fakta_realitas",
    badge: "Faktor 1",
    judul: "Mengandung Fakta & Realitas",
    ket: "Data riil, realita lapangan, atau fakta mencengangkan.",
  },
  {
    id: "pro_kontra",
    badge: "Faktor 2",
    judul: "Memancing Pro & Kontra",
    ket: "Opini tajam atau membongkar mitos populer pasar.",
  },
  {
    id: "tokoh_brand_terkenal",
    badge: "Faktor 3",
    judul: "Membahas Tokoh / Brand Terkenal",
    ket: "Bedah strategi brand besar, figur publik, atau fenomena populer.",
  },
  {
    id: "komedi",
    badge: "Faktor 4",
    judul: "Mengandung Komedi & Sentilan",
    ket: "Ironi sehari-hari, sarkasme halus, atau sentilan santai.",
  },
  {
    id: "emosional",
    badge: "Faktor 5",
    judul: "Memancing Emosional",
    ket: "Rasa haru, simpati, empati, atau takut tertinggal tren.",
  },
]

const EMPAT_PENDEKATAN_TRUST = [
  {
    id: "studi_kasus_nyata",
    judul: "1. Studi Kasus / Data Hasil Nyata",
  },
  {
    id: "proses_balik_layar",
    judul: "2. Dokumentasi Proses / Balik Layar",
  },
  {
    id: "review_kesalahan",
    judul: "3. Review Kesalahan Diri Sendiri",
  },
  {
    id: "bedah_solusi_teknis",
    judul: "4. Bedah Solusi Teknis Mendalam",
  },
]

const EMPAT_FRAMEWORK_ALUR = [
  {
    id: "PAS_RELATABLE_BRIDGE",
    kode: "PAPC",
    judul: "Problem - Agitate - Proof - CTA",
    ket: "Klasik efektif memecah skeptisisme",
  },
  {
    id: "HSO_STORY",
    kode: "HSO",
    judul: "Hook - Story - Offer",
    ket: "Penceritaan personal penuh empati",
  },
  {
    id: "CONTRARIAN_MYTH_BUSTER",
    kode: "Contrarian",
    judul: "Mitos Umum vs Realita Sebenarnya",
    ket: "Membongkar asumsi salah audiens",
  },
  {
    id: "BAB_TRANSFORMATION",
    kode: "BAB",
    judul: "Before - After - Bridge",
    ket: "Transformasi kondisi dari titik nol",
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
  const rawList =
    Array.isArray(skripObj.sections) && skripObj.sections.length > 0
      ? skripObj.sections
      : Array.isArray(skripObj.segmen)
        ? skripObj.segmen
        : []

  return rawList.map((sec, idx) => ({
    partNumber: sec.partNumber || idx + 1,
    partTitle:
      sec.partTitle ||
      (sec.labelMini
        ? sec.labelMini.replace(/^Bagian \d+\s*•\s*/i, "")
        : `Bagian ${idx + 1}`),
    estimatedSeconds:
      sec.estimatedSeconds || `${idx * 15}s - ${(idx + 1) * 18}s`,
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
    cameraCue:
      sec.cameraCue || "Medium close-up, tatapan mata fokus ke lensa kamera.",
    intonationCue:
      sec.intonationCue ||
      "Tempo bicara terjaga dengan penekanan pada kata kunci utama.",
    visualCue: sec.visualCue || sec.visual || "",
    visual: sec.visualCue || sec.visual || "",
  }))
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
  kuotaAkunMaksimal = 2,
  onTriggerUpgradeVIP,
  coins,
  updateKoinDatabase,
  personaProfile,
  setPersonaProfile,
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
  SEPULUH_BENTUK_KONTEN = [],
  setModeTeleprompter,
  onRefreshDataUser,
}) {
  const firstTextareaRef = useRef(null)

  const [contentPhase, setContentPhase] = useState("fase_2_trust")
  const [contentFormat, setContentFormat] = useState("edukasi")
  const [viralTrigger, setViralTrigger] = useState("fakta_realitas")
  const [trustApproach, setTrustApproach] = useState("studi_kasus_nyata")
  const [sellingStyle, setSellingStyle] = useState("soft_selling")
  const [wordDensity, setWordDensity] = useState("padat_kaya_kosakata")
  const [contextMode, setContextMode] = useState("sesuai_niche")
  const [targetPlatformInput, setTargetPlatformInput] = useState(
    PILIHAN_DURASI_KONTEN[5],
  )

  // State Gudang Ingatan (Otak AI)
  const [memoryVault, setMemoryVault] = useState({
    samples: [],
    reviewSingkat: "",
    rincianAnalisa: null,
  })
  const [bukaRincianIngatan, setBukaRincianIngatan] = useState(false)
  const [isAnalyzingMemory, setIsAnalyzingMemory] = useState(false)

  // State Edit Judul Naskah di Layar Hasil Akhir (Stage 5)
  const [isEditingJudulHasil, setIsEditingJudulHasil] = useState(false)
  const [inputJudulHasilBaru, setInputJudulHasilBaru] = useState("")

  useEffect(() => {
    if (hasilSkrip?.judul) {
      setInputJudulHasilBaru(hasilSkrip.judul)
      setIsEditingJudulHasil(false)
    }
  }, [hasilSkrip?.id, hasilSkrip?.judul])

  const [daftarAkunTersimpan, setDaftarAkunTersimpan] = useState([])
  const [idAkunTerpilih, setIdAkunTerpilih] = useState("akun_utama")

  useEffect(() => {
    if (typeof window === "undefined") return
    setMemoryVault(ambilDataGudangIngatan(userId))
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
      // Ignore storage error
    }
  }, [userId])

  const defaultSpekDiri =
    personaProfile?.niche_context?.unique_selling_point ||
    personaProfile?.positioning_and_usp?.unique_selling_point ||
    ""

  const [personalSpecsInput, setPersonalSpecsInput] = useState(defaultSpekDiri)
  const [rawTopicInput, setRawTopicInput] = useState("")

  const [formProduk, setFormProduk] = useState({
    namaProduk: "",
    brand: "",
    hargaPromo: "",
    masalahDipecahkan: "",
    keunggulanSpesifikasi: "",
  })
  const [ssProduk, setSsProduk] = useState(null)
  const [ssSpesifikasi, setSsSpesifikasi] = useState(null)
  const [isScanningSS, setIsScanningSS] = useState(false)

  const [assessmentBatches, setAssessmentBatches] = useState([])
  const [activeBatchIdx, setActiveBatchIdx] = useState(0)
  const currentAssessment = assessmentBatches[activeBatchIdx] || null

  const [chosenAngle, setChosenAngle] = useState("")
  const [pengalamanInput, setPengalamanInput] = useState("")
  const [ilustrasiInput, setIlustrasiInput] = useState("")
  const [showRekomendasiIlustrasi, setShowRekomendasiIlustrasi] =
    useState(false)
  const [faktaInput, setFaktaInput] = useState("")
  const [showRekomendasiFakta, setShowRekomendasiFakta] = useState(false)
  const [selectedFramework, setSelectedFramework] = useState(
    "PAS_RELATABLE_BRIDGE",
  )
  const [lockedHook, setLockedHook] = useState("")
  const [callToAction, setCallToAction] = useState("")
  const [koreksiAkhirInput, setKoreksiAkhirInput] = useState("")

  const [isLoadingIdeTopik, setIsLoadingIdeTopik] = useState(false)
  const [isLoadingOpsi, setIsLoadingOpsi] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isConvertingBentuk, setIsConvertingBentuk] = useState(false)
  const [isChangingDuration, setIsChangingDuration] = useState(false)
  const [isMultiplyingScript, setIsMultiplyingScript] = useState(false)
  const [regeneratingIndex, setRegeneratingIndex] = useState(null)
  const [regenCount, setRegenCount] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)

  const [openVisualMap, setOpenVisualMap] = useState({ 0: true })
  const [targetDurasiUbah, setTargetDurasiUbah] = useState(
    PILIHAN_DURASI_KONTEN[5],
  )
  const [targetKonversiBentuk, setTargetKonversiBentuk] = useState(
    SEPULUH_BENTUK_KONTEN[0]?.nama ||
      "Talking Head Video Pendek (Reels/TikTok)",
  )
  const [pilihanMultiplierDropdown, setPilihanMultiplierDropdown] =
    useState("2")

  const handleAnalisisGudangIngatan = async () => {
    const vaultSekarang = ambilDataGudangIngatan(userId)
    if (!vaultSekarang.samples || vaultSekarang.samples.length === 0) {
      showToast(
        "Ketik ide topik atau edit kalimat naskah terlebih dahulu agar Gudang Ingatan memiliki rekaman teks.",
      )
      return
    }

    setIsAnalyzingMemory(true)
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze_memory_vault",
          userId,
          namaUser,
          memoryVaultSamples: vaultSekarang.samples,
          personaProfile,
        }),
      })
      const data = await res.json()
      if (res.ok && data.reviewSingkat) {
        const disimpan = simpanAnalisaGudangIngatan(userId, data)
        if (disimpan) setMemoryVault(disimpan)
        setBukaRincianIngatan(true)
        showToast("Otak AI selesai memperbarui analisa dari Gudang Ingatan.")
      }
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsAnalyzingMemory(false)
    }
  }

  const renderPanelGudangIngatan = () => (
    <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#14141F] text-[#D4F34A] flex items-center justify-center shrink-0">
            <FlatIcon name="brain" className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-[#14141F] block truncate">
              Gudang Ingatan Otak AI ({(memoryVault.samples || []).length}{" "}
              Ketikan & Editan Terekam)
            </span>
            <span className="text-[11px] text-slate-500 block truncate">
              Otomatis mempelajari gaya bahasamu dari setiap textbox dan revisi
              naskah
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={isAnalyzingMemory}
          onClick={handleAnalisisGudangIngatan}
          className="cursor-pointer shrink-0 px-3 py-1.5 rounded-lg bg-[#14141F] text-[#D4F34A] text-[11px] font-bold flex items-center gap-1"
        >
          <FlatIcon
            name="refresh"
            className={`w-3.5 h-3.5 ${isAnalyzingMemory ? "animate-spin" : ""}`}
          />
          <span>
            {isAnalyzingMemory ? "Menganalisa..." : "Analisa Otak AI"}
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setBukaRincianIngatan(!bukaRincianIngatan)}
        className="cursor-pointer w-full text-left p-3 rounded-xl bg-[#F8F9FA] border border-[#E2E8F0] hover:border-[#14141F] transition space-y-1"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#4D6B14] bg-[#F2FCE2] px-2 py-0.5 rounded">
            Teks Review Analisa Otak AI (Klik untuk Lihat Rincian)
          </span>
          <FlatIcon
            name="chevronDown"
            className={`w-4 h-4 text-slate-500 transition-transform ${
              bukaRincianIngatan ? "rotate-180" : ""
            }`}
          />
        </div>
        <p className="text-xs font-semibold text-[#14141F] leading-relaxed">
          {memoryVault.reviewSingkat ||
            "Setiap kalimat yang kamu ketik atau edit di halaman ini direkam ke Gudang Ingatan agar naskah berikutnya semakin mirip gaya bicaramu."}
        </p>
      </button>

      {bukaRincianIngatan && (
        <div className="bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] p-3.5 space-y-2.5 text-xs">
          <div className="font-bold text-[#14141F] border-b border-[#E2E8F0] pb-1.5">
            Rincian Analisa Gaya Bahasa dari Gudang Ingatan:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0]">
              <strong className="block text-[#14141F] mb-0.5">
                Gaya Bahasa Terdeteksi:
              </strong>
              <span className="text-slate-600">
                {memoryVault.rincianAnalisa?.gayaBahasaTerdeteksi ||
                  personaProfile?.voice_dna?.delivery_style ||
                  "Mengalir natural dan langsung ke inti bahasan."}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0]">
              <strong className="block text-[#14141F] mb-0.5">
                Pola Kalimat & Transisi:
              </strong>
              <span className="text-slate-600">
                {memoryVault.rincianAnalisa?.polaKalimat ||
                  "Kalimat lugas dengan penekanan pada contoh kejadian nyata."}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0]">
              <strong className="block text-[#14141F] mb-0.5">
                Kosakata Khas Baru:
              </strong>
              <span className="text-slate-600">
                {Array.isArray(memoryVault.rincianAnalisa?.kosakataKhasBaru)
                  ? memoryVault.rincianAnalisa.kosakataKhasBaru.join(", ")
                  : "Terekam dari ketikan textbox"}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0]">
              <strong className="block text-[#14141F] mb-0.5">
                Saran Optimalisasi Otak AI:
              </strong>
              <span className="text-slate-600">
                {memoryVault.rincianAnalisa?.saranOptimalisasi ||
                  "Gunakan tombol Analisa Otak AI setelah mengetik atau mengedit naskah."}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  )

  const handleSimpanJudulHasil = async () => {
    if (!hasilSkrip) return
    const judulBersih = inputJudulHasilBaru.trim()
    if (!judulBersih) {
      alert("Judul skrip tidak boleh kosong.")
      return
    }
    const vBaru = rekamKetikanKeGudangIngatan(
      userId,
      "Edit Judul Naskah",
      judulBersih,
    )
    if (vBaru) setMemoryVault(vBaru)

    const skripUpdate = { ...hasilSkrip, judul: judulBersih }
    setHasilSkrip(skripUpdate)
    setIsEditingJudulHasil(false)
    const tersimpan = await simpanAtauUpdateSkripDatabase(skripUpdate)
    setKoleksiSkripTersimpan((prev) =>
      prev.map((item) => (item.id === tersimpan.id ? tersimpan : item)),
    )
    showToast("Judul skrip berhasil diperbarui.")
  }

  const handleGantiAkunCepat = (akunObj, idxUrutan = 0) => {
    if (!akunObj) return
    if (idxUrutan >= kuotaAkunMaksimal) {
      showToast(
        `Akun "${akunObj.labelAkun}" terkunci karena batas kuota paketmu (${kuotaAkunMaksimal} akun).`,
      )
      setActiveMenu("topup")
      return
    }
    setIdAkunTerpilih(akunObj.id)
    if (akunObj.personaProfile) {
      setPersonaProfile(akunObj.personaProfile)
    }
    if (akunObj.uspDiriInput) {
      setPersonalSpecsInput(akunObj.uspDiriInput)
    }
    showToast(`Profil penulisan aktif: ${akunObj.labelAkun}`)
  }

  const handleUbahContextMode = (modeBaru) => {
    setContextMode(modeBaru)
    if (modeBaru === "lintas_produk") {
      setDaftar10IdeTopik([])
    }
  }

  const handleGenerate10IdeTopikAI = async () => {
    if (contextMode === "lintas_produk") {
      setDaftar10IdeTopik([])
      showToast("Mode Lintas Topik aktif. Silakan ketik topik bebas di atas.")
      return
    }
    setIsLoadingIdeTopik(true)
    const vaultAktif = ambilDataGudangIngatan(userId)
    showToast("Menganalisis profil akun untuk mencari 10 ide materi...")
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
          contextMode: "sesuai_niche",
          personaProfile,
          memoryVaultSamples: vaultAktif.samples || [],
        }),
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.ideTopik) && data.ideTopik.length > 0) {
        setDaftar10IdeTopik(data.ideTopik.slice(0, 10))
        showToast("10 rekomendasi ide dari profil akun berhasil dimuat.")
      } else {
        showToast("Error sistem, silakan refresh atau hubungi admin.")
      }
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsLoadingIdeTopik(false)
    }
  }

  const handleScanMarketplaceAI = async () => {
    if (!isPremiumUser) {
      onTriggerUpgradeVIP()
      return
    }
    if (!ssProduk && !ssSpesifikasi) {
      alert("Pilih minimal 1 gambar screenshot produk terlebih dahulu.")
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
      if (res.ok) {
        const namaP = data.namaProduk || formProduk.namaProduk
        setFormProduk((prev) => ({
          ...prev,
          namaProduk: namaP,
          brand: data.brand || prev.brand,
          hargaPromo: data.hargaPromo || prev.hargaPromo,
          keunggulanSpesifikasi:
            data.keunggulanSpesifikasi || prev.keunggulanSpesifikasi,
          masalahDipecahkan: data.masalahDipecahkan || prev.masalahDipecahkan,
        }))
        if (namaP && !rawTopicInput.trim()) {
          setRawTopicInput(`Promosi ${namaP} (${data.masalahDipecahkan || ""})`)
        }
        showToast("Data produk berhasil diekstrak dari screenshot.")
      }
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsScanningSS(false)
    }
  }

  const handleMuatOpsiAsesmen = async (isNewSet = false) => {
    if (isNewSet && assessmentBatches.length >= 3) {
      showToast("Maksimal 3 Set arahan telah tercapai.")
      return
    }

    const topikAktif =
      rawTopicInput.trim() ||
      (contentPhase === "fase_3_konversi" && formProduk.namaProduk
        ? `Promosi ${formProduk.namaProduk}`
        : "")

    if (!topikAktif) {
      alert(
        "Tuliskan topik bahasan di kolom Input Topik Mandiri atau pilih salah satu kartu Rekomendasi Ide terlebih dahulu.",
      )
      return
    }

    const vBaru = rekamKetikanKeGudangIngatan(
      userId,
      "Input Topik Mandiri",
      topikAktif,
    )
    if (vBaru) setMemoryVault(vBaru)

    setIsLoadingOpsi(true)
    if (!isNewSet) {
      setStage(1)
      setPengalamanInput("")
      setIlustrasiInput("")
      setFaktaInput("")
      setKoreksiAkhirInput("")
      setShowRekomendasiIlustrasi(false)
      setShowRekomendasiFakta(false)
    }

    const opsiSebelumnya = isNewSet
      ? assessmentBatches.flatMap((b) =>
          (b.angle_options || []).map((a) => a.angle_text),
        )
      : []

    const vaultAktif = vBaru || ambilDataGudangIngatan(userId)

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
          batchKe: isNewSet ? assessmentBatches.length + 1 : 1,
          opsiSebelumnya,
          personaProfile,
          memoryVaultSamples: vaultAktif.samples || [],
          stageInput: {
            rawTopic: topikAktif,
            contentPhase,
            contentFormat,
            viralTrigger,
            trustApproach,
            sellingStyle,
            wordDensity,
            personalSpecs: personalSpecsInput,
            contextMode,
            targetPlatform: targetPlatformInput,
            detailPromosi:
              contentPhase === "fase_3_konversi" ? formProduk : null,
          },
          customPrompts,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error("Gagal memuat asesmen")

      setAssessmentBatches((prev) => {
        const listBaru = isNewSet ? [...prev, data] : [data]
        setActiveBatchIdx(listBaru.length - 1)
        return listBaru
      })

      if (data.angle_options?.[0]?.angle_text) {
        setChosenAngle(data.angle_options[0].angle_text)
      }
      if (data.recommended_framework) {
        setSelectedFramework(data.recommended_framework)
      }
      const firstHook = data.hook_options?.[0]
      if (firstHook) {
        setLockedHook(
          typeof firstHook === "string" ? firstHook : firstHook.text || "",
        )
      }
      const firstCta = data.cta_options?.[0]
      if (firstCta) {
        setCallToAction(
          typeof firstCta === "string" ? firstCta : firstCta.text || "",
        )
      }
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsLoadingOpsi(false)
    }
  }

  const handleBuatSkripSekarang = async () => {
    if (coins < 1) {
      alert("Saldo Koin belum mencukupi. Silakan isi ulang koin.")
      setActiveMenu("topup")
      return
    }

    // Rekam seluruh input asesmen ke Gudang Ingatan
    if (pengalamanInput.trim()) {
      rekamKetikanKeGudangIngatan(userId, "Pengalaman Asesmen", pengalamanInput)
    }
    if (ilustrasiInput.trim()) {
      rekamKetikanKeGudangIngatan(userId, "Ilustrasi Asesmen", ilustrasiInput)
    }
    if (faktaInput.trim()) {
      rekamKetikanKeGudangIngatan(userId, "Pondasi Fakta", faktaInput)
    }
    if (koreksiAkhirInput.trim()) {
      rekamKetikanKeGudangIngatan(userId, "Koreksi Akhir", koreksiAkhirInput)
    }

    const vaultTerbaru = ambilDataGudangIngatan(userId)
    setMemoryVault(vaultTerbaru)

    const topikInti =
      rawTopicInput.trim() ||
      currentAssessment?.refined_core_idea ||
      "Topik Konten Hookya"

    const briefFinal = {
      content_phase: contentPhase,
      content_format: contentFormat,
      viral_trigger: viralTrigger,
      trust_approach: trustApproach,
      selling_style: sellingStyle,
      word_density: wordDensity,
      personal_specs: personalSpecsInput,
      context_mode: contextMode,
      selected_framework: selectedFramework,
      target_platform: targetPlatformInput,
      core_idea: topikInti,
      chosen_angle: chosenAngle || "Sudut pandang utama kreator",
      personal_context_or_story: [pengalamanInput.trim(), ilustrasiInput.trim()]
        .filter(Boolean)
        .join(" | "),
      injected_reference: {
        type: "Fakta & Alasan Masuk Akal",
        title: "Pondasi Argumen",
        summary: faktaInput.trim(),
      },
      locked_hook: lockedHook,
      call_to_action: callToAction,
      user_final_notes: koreksiAkhirInput.trim(),
    }

    setIsGenerating(true)
    await updateKoinDatabase(coins - 1)

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
          catatanAkhirUser: koreksiAkhirInput.trim(),
          personaProfile,
          memoryVaultSamples: vaultTerbaru.samples || [],
          contentBrief: briefFinal,
          bentukKonten: bentukKontenFinal,
          customPrompts,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.silentCoinUpdated != null) {
          updateKoinDatabase(data.silentCoinUpdated)
        }
        if (onRefreshDataUser) onRefreshDataUser()
        throw new Error("Error sistem")
      }

      const waktuSekarang = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })

      const sectionsHasil = ambilDaftarBagianSkrip(data)
      setTargetDurasiUbah(targetPlatformInput)
      setOpenVisualMap({ 0: true })

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
        judul: topikInti,
        kategori:
          contentPhase === "fase_1_viral"
            ? "Fase 1: Cari Viral"
            : contentPhase === "fase_2_trust"
              ? "Fase 2: Menciptakan Trust"
              : "Fase 3: Konten Konversi",
        bentuk: bentukKontenFinal,
        waktuDibuat: waktuSekarang,
        targetDuration: data.targetDuration || targetPlatformInput,
        flowStyle: data.flowStyle || "Padat & Mengalir",
        totalSections: sectionsHasil.length,
        kritikDetail: data.kritikDetail || null,
        kritikSaran: data.kritikSaran || "",
        uploadPackage: uploadPackTerformat,
        uploadPack: uploadPackTerformat,
        variasiFolder: [],
        contentBrief: briefFinal,
        sudahUpload: false,
        tanggalUpload: "",
        sections: sectionsHasil,
        segmen: sectionsHasil,
      }

      const tersimpan = await simpanAtauUpdateSkripDatabase(skripBaru)
      setHasilSkrip(tersimpan)
      setKoleksiSkripTersimpan((prev) => [tersimpan, ...prev])
      setStage(5)
      if (onRefreshDataUser) onRefreshDataUser()
      showToast("Naskah skrip selesai disusun dan disimpan ke Arsip.")
    } catch {
      showToast(
        "Request gagal diproses. Koin Anda telah dikembalikan otomatis (Auto-Refund).",
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUbahDurasiSkrip = async (
    durasiPilihan = targetDurasiUbah,
    kepadatanOverride = wordDensity,
  ) => {
    if (!hasilSkrip || isChangingDuration) return
    setIsChangingDuration(true)
    const vaultAktif = ambilDataGudangIngatan(userId)
    showToast(`Menyesuaikan durasi naskah ke ${durasiPilihan}...`)

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
          memoryVaultSamples: vaultAktif.samples || [],
          subyek: hasilSkrip.judul,
          skripSebelumnya: ambilDaftarBagianSkrip(hasilSkrip),
          durasiTargetBaru: durasiPilihan,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error("Gagal ubah durasi")

      const sectionsBaru = ambilDaftarBagianSkrip(data)
      const skripDiperbarui = {
        ...hasilSkrip,
        targetDuration: data.targetDuration || durasiPilihan,
        totalSections: sectionsBaru.length,
        sections: sectionsBaru,
        segmen: sectionsBaru,
      }
      setHasilSkrip(skripDiperbarui)
      await simpanAtauUpdateSkripDatabase(skripDiperbarui)
      if (onRefreshDataUser) onRefreshDataUser()
      showToast(
        `Durasi diperbarui (${sectionsBaru.length} Bagian, ${hitungJumlahKataSkrip(
          sectionsBaru,
        )} Kata).`,
      )
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsChangingDuration(false)
    }
  }

  const handleKonversiBentukKontenLain = async () => {
    if (!hasilSkrip || isConvertingBentuk) return
    setIsConvertingBentuk(true)
    showToast(`Mengubah bentuk naskah ke ${targetKonversiBentuk}...`)

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
      if (!res.ok) throw new Error("Gagal ubah bentuk")

      const bagianKonversi = ambilDaftarBagianSkrip(data)
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
      if (onRefreshDataUser) onRefreshDataUser()
      showToast("Bentuk eksekusi visual berhasil diperbarui.")
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsConvertingBentuk(false)
    }
  }

  const handleRegenerateSatuKerangka = async (indexBaris, fokusTarget) => {
    if (!hasilSkrip) return
    const hitunganBaru = regenCount + 1
    const potongKoinRegen = hitunganBaru % 3 === 0

    if (potongKoinRegen) {
      if (coins < 1) {
        alert("Saldo koin tidak mencukupi untuk pembaruan bagian ke-3.")
        setActiveMenu("topup")
        return
      }
      await updateKoinDatabase(coins - 1)
    }
    setRegenCount(hitunganBaru)

    const daftarBagianSaatIni = ambilDaftarBagianSkrip(hasilSkrip)
    const bagianLama = daftarBagianSaatIni[indexBaris]
    if (!bagianLama) return

    const vaultAktif = ambilDataGudangIngatan(userId)
    setRegeneratingIndex(indexBaris)
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
          memoryVaultSamples: vaultAktif.samples || [],
          subyek: hasilSkrip.judul,
          segmenTarget: bagianLama,
          isBillableRegen: potongKoinRegen,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.silentCoinUpdated != null) {
          updateKoinDatabase(data.silentCoinUpdated)
        }
        if (onRefreshDataUser) onRefreshDataUser()
        throw new Error("Gagal regenerasi bagian")
      }

      const bagianUpdate = { ...bagianLama }
      if (fokusTarget === "visual") {
        bagianUpdate.cameraCue = data.cameraCue || bagianLama.cameraCue
        bagianUpdate.intonationCue =
          data.intonationCue || bagianLama.intonationCue
        bagianUpdate.visualCue =
          data.visualCue ||
          `Arahan Kamera: ${bagianUpdate.cameraCue} | Intonasi Suara: ${bagianUpdate.intonationCue}`
      } else {
        const spokenBaru =
          data.spokenText || data.voiceover || bagianLama.spokenText
        bagianUpdate.spokenText = spokenBaru
        bagianUpdate.voiceover = spokenBaru
        bagianUpdate.onScreenText =
          data.onScreenText || data.teksLayar || spokenBaru
      }

      const listBaru = daftarBagianSaatIni.map((s, idx) =>
        idx === indexBaris ? bagianUpdate : s,
      )
      const skripDiperbarui = {
        ...hasilSkrip,
        sections: listBaru,
        segmen: listBaru,
      }
      setHasilSkrip(skripDiperbarui)
      await simpanAtauUpdateSkripDatabase(skripDiperbarui)
      if (onRefreshDataUser) onRefreshDataUser()
      showToast(`Bagian ${bagianLama.partNumber} berhasil diperbarui.`)
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setRegeneratingIndex(null)
    }
  }

  const handleGandakanViaDropdown = async () => {
    const jumlahX = parseInt(pilihanMultiplierDropdown) || 2
    const biayaKoin = jumlahX === 10 ? 3 : jumlahX === 5 ? 2 : 1
    if (!hasilSkrip || isMultiplyingScript) return
    if (coins < biayaKoin) {
      alert(`Saldo koin belum mencukupi (Perlu ${biayaKoin} Koin).`)
      setActiveMenu("topup")
      return
    }

    setIsMultiplyingScript(true)
    await updateKoinDatabase(coins - biayaKoin)
    const vaultAktif = ambilDataGudangIngatan(userId)
    showToast(`Menyusun ${jumlahX} variasi skrip ke dalam Folder Arsip...`)

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
          memoryVaultSamples: vaultAktif.samples || [],
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
        if (onRefreshDataUser) onRefreshDataUser()
        throw new Error("Gagal menggandakan skrip")
      }

      const listVariasi = Array.isArray(data.daftarVariasi)
        ? data.daftarVariasi
        : []
      const itemFolderBaru = listVariasi.map((v, i) => {
        const bagVariasi = ambilDaftarBagianSkrip(v)
        const kode = v.kodeHuruf || String.fromCharCode(65 + i)
        return {
          id: Date.now() + i + 1,
          kodeHuruf: kode,
          judul: v.judulVariasi || `Variasi ${kode}`,
          estimasiDetik: v.estimasiDetik || "45 detik",
          sections: bagVariasi,
          segmen: bagVariasi,
        }
      })

      const folderGabungan = [
        ...(Array.isArray(hasilSkrip.variasiFolder)
          ? hasilSkrip.variasiFolder
          : []),
        ...itemFolderBaru,
      ]

      const skripIndukUpdate = {
        ...hasilSkrip,
        variasiFolder: folderGabungan,
      }
      const tersimpanDB = await simpanAtauUpdateSkripDatabase(skripIndukUpdate)
      setHasilSkrip(tersimpanDB)
      setKoleksiSkripTersimpan((prev) =>
        prev.map((item) => (item.id === tersimpanDB.id ? tersimpanDB : item)),
      )
      if (onRefreshDataUser) onRefreshDataUser()
      showToast(
        `${itemFolderBaru.length} variasi disimpan ke Folder "${hasilSkrip.judul}" di Arsip.`,
      )
    } catch {
      showToast(
        "Gagal menggandakan skrip. Koin Anda telah dikembalikan otomatis.",
      )
    } finally {
      setIsMultiplyingScript(false)
    }
  }

  const handleCetakPDF = () => {
    if (!hasilSkrip) return
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
            Bagian ${s.partNumber} • ${s.partTitle} (${s.estimatedSeconds})
          </div>
          <div style="font-size:14px; line-height:1.6; white-space:pre-line; margin-bottom:8px;">${s.spokenText}</div>
          <div style="font-size:12px; color:#334155; background:#f8fafc; padding:8px; border-radius:6px;">
            <strong>Arahan Kamera:</strong> ${s.cameraCue}<br/>
            <strong>Intonasi Suara:</strong> ${s.intonationCue}
          </div>
        </div>`,
      )
      .join("")

    win.document.write(`
      <html>
        <head><title>Skrip Hookya - ${hasilSkrip.judul}</title></head>
        <body style="font-family:sans-serif; padding:24px; color:#14141f;">
          <h2>${hasilSkrip.judul}</h2>
          <p style="font-size:12px; color:#64748b;">Hookya • ${hasilSkrip.waktuDibuat} • ${daftarBagian.length} Bagian</p>
          ${barisHTML}
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `)
    win.document.close()
  }

  const daftarBagianAktif = ambilDaftarBagianSkrip(hasilSkrip)
  const totalKataSkripAktif = hitungJumlahKataSkrip(daftarBagianAktif)
  const estimasiDetikBaca = Math.round((totalKataSkripAktif / 140) * 60)
  const paketUploadAktif =
    hasilSkrip?.uploadPackage || hasilSkrip?.uploadPack || null
  const kritikObj = hasilSkrip?.kritikDetail || {
    kelebihan:
      "Pacing hook di 3 detik awal sangat agresif dan memotong skeptisisme audiens secara instan.",
    catatanPembawaan:
      hasilSkrip?.kritikSaran ||
      "Hindari intonasi menggurui di bagian tengah. Pertahankan gestur tangan terbuka agar terkesan autentik.",
    kecepatanBicara:
      "Jaga tempo bicara rata-rata di ~150-160 WPM untuk mempertahankan retensi short-form video.",
  }

  const infoFormatAktif = SEMBILAN_FORMAT_KONTEN.find(
    (f) => f.id === contentFormat,
  )
  const infoFaktorAktif = LIMA_FAKTOR_VIRAL.find((v) => v.id === viralTrigger)

  // ============================================================================
  // LAYAR HASIL AKHIR NASKAH SKRIP (STAGE 5)
  // ============================================================================
  if (stage === 5 && hasilSkrip) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-5 pb-10">
        {/* 1. Header & Fitur Edit Judul Naskah */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-[#4E6100] bg-[#D4F34A]/35 px-2.5 py-0.5 rounded-md font-bold tracking-wider uppercase">
              DRAFT NASKAH FINAL • SIAP PRODUKSI
            </span>
            <button
              type="button"
              onClick={() => {
                setStage(0)
                setHasilSkrip(null)
              }}
              className="cursor-pointer text-xs font-bold bg-[#F4F5F7] hover:bg-slate-200 text-[#14141F] px-3 py-1.5 rounded-lg"
            >
              + Buat Topik Baru
            </button>
          </div>

          {isEditingJudulHasil ? (
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                value={inputJudulHasilBaru}
                onChange={(e) => setInputJudulHasilBaru(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSimpanJudulHasil()
                }}
                autoFocus
                placeholder="Ketik judul skrip baru..."
                className="flex-1 h-11 px-3.5 rounded-lg border-2 border-[#14141F] bg-white text-base sm:text-sm font-bold text-[#14141F] focus:outline-none"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSimpanJudulHasil}
                  className="cursor-pointer h-11 px-4 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold"
                >
                  Simpan Judul
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputJudulHasilBaru(hasilSkrip.judul || "")
                    setIsEditingJudulHasil(false)
                  }}
                  className="cursor-pointer h-11 px-3 rounded-lg bg-[#F4F5F7] text-slate-600 text-xs font-bold"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-lg sm:text-xl font-bold text-[#14141F] leading-snug">
                {hasilSkrip.judul}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setInputJudulHasilBaru(hasilSkrip.judul || "")
                  setIsEditingJudulHasil(true)
                }}
                title="Edit Judul Naskah"
                className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4F5F7] hover:bg-slate-200 text-[#14141F] text-xs font-bold border border-[#E2E8F0] transition"
              >
                <FlatIcon name="edit" className="w-3.5 h-3.5" />
                <span>Edit Judul</span>
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="bg-[#F4F5F7] px-2.5 py-1 rounded-md font-semibold text-[#14141F]">
              {daftarBagianAktif.length} Bagian Dinamis
            </span>
            <span className="bg-[#F4F5F7] px-2.5 py-1 rounded-md font-semibold text-[#14141F]">
              {totalKataSkripAktif} Kata (Estimasi baca: {estimasiDetikBaca}{" "}
              detik)
            </span>
            <span className="bg-[#F4F5F7] px-2.5 py-1 rounded-md">
              {hasilSkrip.bentuk}
            </span>
          </div>
        </div>

        {/* Panel Gudang Ingatan Otak AI di Layar Hasil Akhir */}
        {renderPanelGudangIngatan()}

        {/* 2. Top Dark Action Bar */}
        <div className="bg-[#1B1B26] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setModeTeleprompter(true)}
              className="cursor-pointer h-10 px-3.5 bg-[#D4F34A] text-[#14141F] text-xs font-bold rounded-lg flex items-center gap-1.5 active:scale-95 transition"
            >
              <FlatIcon name="tv" className="w-4 h-4" />
              <span>Tampilkan Teks</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const teksSalin = daftarBagianAktif
                  .map(
                    (s) =>
                      `[Bagian ${s.partNumber} • ${s.partTitle} (${s.estimatedSeconds})]\n${s.spokenText}`,
                  )
                  .join("\n\n")
                navigator.clipboard.writeText(teksSalin)
                showToast("Seluruh naskah skrip berhasil disalin.")
              }}
              className="cursor-pointer h-10 px-3 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <FlatIcon name="copy" className="w-4 h-4" />
              <span>Salin</span>
            </button>

            <button
              type="button"
              onClick={handleCetakPDF}
              className="cursor-pointer h-10 px-3 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <FlatIcon name="printer" className="w-4 h-4" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsEditMode((prev) => !prev)
                if (firstTextareaRef.current) firstTextareaRef.current.focus()
              }}
              className={`cursor-pointer h-10 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                isEditMode
                  ? "bg-[#D4F34A] text-[#14141F]"
                  : "bg-white/15 hover:bg-white/25 text-white"
              }`}
            >
              <FlatIcon name="edit" className="w-4 h-4" />
              <span>Edit Naskah</span>
            </button>
          </div>
        </div>

        {/* 3. Compact Control Bar */}
        <div className="bg-[#F3F4F6] rounded-xl p-3 flex flex-col gap-2.5 border border-[#E2E8F0]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 flex items-center bg-white rounded-lg px-3 h-11 border border-[#E2E8F0]">
              <select
                value={wordDensity}
                onChange={(e) => setWordDensity(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-[#14141F] focus:outline-none cursor-pointer"
              >
                <option value="padat_kaya_kosakata">
                  Gaya: Padat & Kaya Kosakata
                </option>
                <option value="irit_ringkas">Gaya: Ringkas & Irit Kata</option>
              </select>
            </div>

            <div className="flex-1 flex items-center bg-white rounded-lg px-3 h-11 border border-[#E2E8F0]">
              <select
                value={targetDurasiUbah}
                onChange={(e) => setTargetDurasiUbah(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-[#14141F] focus:outline-none cursor-pointer"
              >
                {PILIHAN_DURASI_KONTEN.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={isChangingDuration}
              onClick={() =>
                handleUbahDurasiSkrip(targetDurasiUbah, wordDensity)
              }
              className="cursor-pointer h-11 px-4 bg-[#14141F] text-[#D4F34A] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <FlatIcon
                name="refresh"
                className={`w-4 h-4 ${
                  isChangingDuration ? "animate-spin" : ""
                }`}
              />
              <span>{isChangingDuration ? "Memproses..." : "Ubah Durasi"}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 flex items-center bg-white rounded-lg px-3 h-11 border border-[#E2E8F0]">
              <select
                value={targetKonversiBentuk}
                onChange={(e) => setTargetKonversiBentuk(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-[#14141F] focus:outline-none cursor-pointer"
              >
                {SEPULUH_BENTUK_KONTEN.map((b) => (
                  <option key={b.id} value={b.nama}>
                    {b.nama}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={isConvertingBentuk}
              onClick={handleKonversiBentukKontenLain}
              className="cursor-pointer h-11 px-4 bg-[#14141F] text-[#D4F34A] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <FlatIcon
                name="refresh"
                className={`w-4 h-4 ${
                  isConvertingBentuk ? "animate-spin" : ""
                }`}
              />
              <span>{isConvertingBentuk ? "Memproses..." : "Ubah Bentuk"}</span>
            </button>
          </div>
        </div>

        {/* 4. Dynamic Story Beats List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-[#14141F]">
              Struktur Ketukan Cerita (Story Beats)
            </span>
            <span className="text-xs text-slate-500">
              Menampilkan {daftarBagianAktif.length} Bagian
            </span>
          </div>

          {daftarBagianAktif.map((sec, idx) => {
            const isVisualOpen = Boolean(openVisualMap[idx])
            const sedangRegenIni = regeneratingIndex === idx

            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-4 border border-[#E2E8F0] space-y-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-[#E7E8EA] text-[#14141F] px-2.5 py-1 rounded-md font-bold">
                      Bagian {sec.partNumber || idx + 1} • {sec.partTitle}
                    </span>
                    {sec.estimatedSeconds && (
                      <span className="text-xs bg-[#D4F34A] text-[#14141F] px-2 py-0.5 rounded-md font-semibold">
                        {sec.estimatedSeconds}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setOpenVisualMap((prev) => ({
                        ...prev,
                        [idx]: !prev[idx],
                      }))
                    }
                    className="cursor-pointer h-8 px-2.5 text-slate-600 hover:text-[#14141F] text-xs font-semibold flex items-center gap-1 rounded-md bg-[#F4F5F7]"
                  >
                    <span>Arahan Adegan & Intonasi</span>
                    <FlatIcon
                      name="chevronDown"
                      className={`w-4 h-4 transition-transform ${
                        isVisualOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                <div className="relative flex items-start gap-2 bg-[#F3F4F6] rounded-lg p-2.5 border border-[#E2E8F0]">
                  <textarea
                    ref={idx === 0 ? firstTextareaRef : null}
                    rows={3}
                    value={sec.spokenText}
                    onChange={(e) => {
                      const valBaru = e.target.value
                      const listUpdate = daftarBagianAktif.map((s, i) =>
                        i === idx
                          ? { ...s, spokenText: valBaru, voiceover: valBaru }
                          : s,
                      )
                      const skripEdit = {
                        ...hasilSkrip,
                        sections: listUpdate,
                        segmen: listUpdate,
                      }
                      setHasilSkrip(skripEdit)
                    }}
                    onBlur={(e) => {
                      const vBaru = rekamKetikanKeGudangIngatan(
                        userId,
                        `Edit Naskah Bagian ${sec.partNumber || idx + 1}`,
                        e.target.value,
                      )
                      if (vBaru) setMemoryVault(vBaru)
                      simpanAtauUpdateSkripDatabase(hasilSkrip)
                    }}
                    className={`w-full bg-transparent text-base sm:text-sm text-[#14141F] resize-none focus:outline-none leading-relaxed ${
                      isEditMode
                        ? "bg-white p-2 rounded border border-[#14141F]"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRegenerateSatuKerangka(idx, "skrip")}
                    title="Regenerasi Kalimat Ini"
                    className="cursor-pointer w-8 h-8 rounded-md bg-white hover:bg-[#14141F] text-[#14141F] hover:text-[#D4F34A] border border-[#E2E8F0] flex items-center justify-center shrink-0 transition"
                  >
                    <FlatIcon
                      name="refresh"
                      className={`w-4 h-4 ${
                        sedangRegenIni ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                </div>

                {isVisualOpen && (
                  <div className="bg-[#F8F9FA] rounded-lg p-3 border border-[#E2E8F0] flex items-start justify-between gap-2">
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-[#14141F] shrink-0">
                          Arahan Kamera:
                        </span>
                        <span>{sec.cameraCue}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-[#14141F] shrink-0">
                          Intonasi Suara:
                        </span>
                        <span>{sec.intonationCue}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleRegenerateSatuKerangka(idx, "visual")
                      }
                      title="Regenerasi Arahan Adegan"
                      className="cursor-pointer w-8 h-8 rounded-md bg-white hover:bg-[#14141F] text-[#14141F] hover:text-[#D4F34A] border border-[#E2E8F0] flex items-center justify-center shrink-0 transition"
                    >
                      <FlatIcon name="refresh" className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 5. Kritik & Saran Pembawaan Naskah */}
        <div className="bg-[#F5FBD4] border border-[#D4F34A] rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <FlatIcon name="bolt" className="w-5 h-5 text-[#4E6100]" />
            <h3 className="text-base font-bold text-[#364300]">
              Kritik & Saran Pembawaan Naskah
            </h3>
          </div>
          <div className="space-y-1.5 text-xs sm:text-sm text-[#14141F]">
            <div className="flex items-start gap-2">
              <span className="font-bold text-[#4E6100] shrink-0">
                • Kelebihan:
              </span>
              <span>{kritikObj.kelebihan}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-[#4E6100] shrink-0">
                • Catatan Pembawaan:
              </span>
              <span>{kritikObj.catatanPembawaan}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-[#4E6100] shrink-0">
                • Kecepatan Bicara:
              </span>
              <span>{kritikObj.kecepatanBicara}</span>
            </div>
          </div>
        </div>

        {/* 6. Kelengkapan Publikasi Konten (Siap Salin) */}
        {paketUploadAktif && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-[#14141F]">
                Kelengkapan Publikasi Konten (Siap Salin)
              </h3>
              <span className="text-[11px] font-bold text-[#556500] uppercase tracking-wider">
                3 Elemen Lengkap
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#F3F4F6] p-3 rounded-xl border border-[#E2E8F0]">
              <div className="bg-white rounded-lg p-3.5 border border-[#E2E8F0] flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 block">
                    Judul Cover Video
                  </span>
                  <p className="text-sm font-bold text-[#14141F]">
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
                    showToast("Judul Cover Video disalin.")
                  }}
                  className="cursor-pointer h-9 px-3 bg-[#14141F] text-[#D4F34A] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <FlatIcon name="copy" className="w-3.5 h-3.5" />
                  <span>Salin Judul Cover</span>
                </button>
              </div>

              <div className="bg-white rounded-lg p-3.5 border border-[#E2E8F0] flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 block">
                    SEO Caption & Tagar
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
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
                    showToast("SEO Caption & Tagar disalin.")
                  }}
                  className="cursor-pointer h-9 px-3 bg-[#14141F] text-[#D4F34A] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <FlatIcon name="copy" className="w-3.5 h-3.5" />
                  <span>Salin Caption</span>
                </button>
              </div>

              <div className="bg-white rounded-lg p-3.5 border border-[#E2E8F0] flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-500 block">
                    Komentar Pertama Dipin
                  </span>
                  <p className="text-xs text-[#14141F] leading-relaxed">
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
                    showToast("Komentar Pertama disalin.")
                  }}
                  className="cursor-pointer h-9 px-3 bg-[#F3F4F6] hover:bg-slate-200 text-[#14141F] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border border-[#E2E8F0]"
                >
                  <FlatIcon name="copy" className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. Compact Multiply Script Bar */}
        <div className="bg-[#14141F] rounded-xl p-4 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FlatIcon name="folder" className="w-5 h-5 text-[#D4F34A]" />
              <span className="text-sm font-bold text-white">
                Gandakan Topik Ini ke Dalam Folder Arsip
              </span>
            </div>
            <span className="text-xs text-white/60 block mt-0.5">
              Hasilkan variasi angle & hook otomatis ke dalam 1 folder di menu
              Kalender/Arsip
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-[#232336] rounded-lg px-3 h-11 flex items-center flex-1 sm:flex-initial">
              <select
                value={pilihanMultiplierDropdown}
                disabled={isMultiplyingScript}
                onChange={(e) => setPilihanMultiplierDropdown(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer w-full"
              >
                <option className="text-black" value="2">
                  Buat 2 Variasi Skrip (1 Koin)
                </option>
                <option className="text-black" value="5">
                  Buat 5 Variasi Skrip (2 Koin)
                </option>
                <option className="text-black" value="10">
                  Buat 10 Variasi Skrip (3 Koin)
                </option>
              </select>
            </div>
            <button
              type="button"
              disabled={isMultiplyingScript}
              onClick={handleGandakanViaDropdown}
              className="cursor-pointer h-11 px-4 bg-[#D4F34A] text-[#14141F] rounded-lg flex items-center justify-center gap-1.5 font-bold text-xs shrink-0 active:scale-95 transition disabled:opacity-50"
            >
              <FlatIcon
                name={isMultiplyingScript ? "refresh" : "plus"}
                className={`w-4 h-4 ${
                  isMultiplyingScript ? "animate-spin" : ""
                }`}
              />
              <span>{isMultiplyingScript ? "Memproses..." : "Gandakan"}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // LAYAR BUAT SKRIP KONTEN & ASESMEN (BAGIAN A & BAGIAN B)
  // ============================================================================
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-10">
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Profil Penulisan Aktif
            </span>
            <p className="text-sm font-semibold text-[#14141F]">
              Pilih persona akun sosial mediamu:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {daftarAkunTersimpan.length === 0 ? (
              <button
                type="button"
                className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#14141F] text-white text-xs font-bold flex items-center gap-2 border border-[#14141F]"
              >
                <span className="w-2 h-2 rounded-full bg-[#D4F34A]" />
                <span>
                  Akun Utama (
                  {personaProfile?.account_label || namaUser || "Kreator"})
                </span>
                <span className="bg-[#D4F34A] text-[#14141F] text-[10px] px-1.5 py-0.5 rounded font-extrabold">
                  Aktif
                </span>
              </button>
            ) : (
              daftarAkunTersimpan.map((ak, idx) => {
                const aktif = idAkunTerpilih === ak.id
                const terkunci = idx >= kuotaAkunMaksimal

                if (terkunci) {
                  return (
                    <button
                      key={ak.id}
                      type="button"
                      onClick={() => handleGantiAkunCepat(ak, idx)}
                      className="cursor-pointer min-h-[44px] px-3.5 py-2 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold flex items-center gap-1.5 border border-dashed border-slate-300"
                    >
                      <FlatIcon name="lock" className="w-3.5 h-3.5" />
                      <span>{ak.labelAkun} [Terkunci]</span>
                    </button>
                  )
                }

                return (
                  <button
                    key={ak.id}
                    type="button"
                    onClick={() => handleGantiAkunCepat(ak, idx)}
                    className={`cursor-pointer min-h-[44px] px-3.5 py-2 rounded-lg text-xs flex items-center gap-2 border transition ${
                      aktif
                        ? "bg-[#14141F] text-white border-[#14141F] font-bold"
                        : "bg-[#F4F5F7] hover:bg-slate-200 text-[#14141F] border-[#E2E8F0] font-semibold"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        aktif ? "bg-[#D4F34A]" : "bg-slate-400"
                      }`}
                    />
                    <span>{ak.labelAkun}</span>
                    {aktif && (
                      <span className="bg-[#D4F34A] text-[#14141F] text-[10px] px-1.5 py-0.5 rounded font-extrabold">
                        Aktif
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* Kartu Gudang Ingatan Otak AI */}
      {renderPanelGudangIngatan()}

      <div className="space-y-6">
        <div className="flex items-center gap-3 pt-1">
          <div className="w-7 h-7 rounded-lg bg-[#14141F] text-[#D4F34A] flex items-center justify-center font-bold text-xs">
            A
          </div>
          <h2 className="text-lg font-bold text-[#14141F] tracking-tight">
            Bagian A: Pengaturan Arah & Topik Naskah
          </h2>
        </div>

        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#14141F]">
                1. Pilih Fase Tujuan Konten
              </h3>
              <p className="text-xs text-slate-500">
                Pilih satu target utama yang ingin dicapai melalui naskah ini
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-[#F4F5F7] px-2.5 py-1 rounded-md border border-[#E2E8F0]">
              Wajib Pilih 1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: "fase_1_viral",
                fase: "Fase 1",
                judul: "Cari Viral Dulu",
                ket: "Fokus jangkauan luas (Reach/Views), memecah algoritma, dan mengumpulkan audiens baru.",
                footer: "Topik Relatable & Polemik",
              },
              {
                id: "fase_2_trust",
                fase: "Fase 2",
                judul: "Menciptakan Trust (Otoritas)",
                ket: "Membangun kredibilitas, pembuktian keahlian, dan hubungan personal yang kokoh.",
                footer: "Panel Otoritas Aktif",
              },
              {
                id: "fase_3_konversi",
                fase: "Fase 3",
                judul: "Konten Konversi (Jualan)",
                ket: "Mengarahkan audiens klik link bio, beli produk digital/fisik, atau konsultasi DM.",
                footer: "Scanner Bukti Produk",
              },
            ].map((item) => {
              const aktif = contentPhase === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setContentPhase(item.id)}
                  className={`cursor-pointer p-3.5 rounded-xl border-2 text-left transition h-full flex flex-col justify-between ${
                    aktif
                      ? "border-[#14141F] bg-[#FAFAFB]"
                      : "border-[#E2E8F0] bg-white hover:border-slate-400"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold text-[#14141F] uppercase tracking-wider">
                        {item.fase}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          aktif
                            ? "border-[#14141F] bg-[#14141F]"
                            : "border-slate-300"
                        }`}
                      >
                        {aktif && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D4F34A]" />
                        )}
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-[#14141F] mb-1">
                      {item.judul}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item.ket}
                    </p>
                  </div>
                  <div
                    className={`mt-3 pt-2 border-t border-[#E2E8F0]/70 flex items-center text-[11px] font-bold ${
                      aktif ? "text-[#4D6B14]" : "text-slate-500"
                    }`}
                  >
                    <span>{item.footer}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {contentPhase === "fase_2_trust" && (
            <div className="bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] p-4 space-y-3.5">
              <span className="text-xs font-bold text-[#14141F] flex items-center gap-1.5">
                <FlatIcon name="shield" className="w-4 h-4 text-[#4D6B14]" />
                <span>4 Pendekatan Membangun Trust (Pilih Salah Satu):</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {EMPAT_PENDEKATAN_TRUST.map((tr) => {
                  const aktif = trustApproach === tr.id
                  return (
                    <button
                      key={tr.id}
                      type="button"
                      onClick={() => setTrustApproach(tr.id)}
                      className={`cursor-pointer min-h-[44px] p-2.5 rounded-lg text-left text-xs flex items-start gap-2 transition ${
                        aktif
                          ? "border-2 border-[#14141F] bg-white font-bold text-[#14141F]"
                          : "border border-[#E2E8F0] bg-white hover:border-slate-400 font-semibold text-[#14141F]"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                          aktif ? "bg-[#D4F34A]" : "bg-slate-300"
                        }`}
                      />
                      <span>{tr.judul}</span>
                    </button>
                  )
                })}
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#14141F]">
                    Spesifikasi Personal Diri / Jam Terbang yang Ingin Diangkat:
                  </label>
                  <button
                    type="button"
                    onClick={() => setPersonalSpecsInput("")}
                    className="cursor-pointer text-xs text-rose-500 hover:text-rose-700 font-semibold"
                  >
                    Hapus
                  </button>
                </div>
                <input
                  type="text"
                  value={personalSpecsInput}
                  onChange={(e) => setPersonalSpecsInput(e.target.value)}
                  onBlur={() => {
                    const v = rekamKetikanKeGudangIngatan(
                      userId,
                      "Jam Terbang Fase 2",
                      personalSpecsInput,
                    )
                    if (v) setMemoryVault(v)
                  }}
                  placeholder="Contoh: 5 tahun mengelola usaha & 120 klien produk..."
                  className="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-[#14141F] focus:outline-none focus:border-[#14141F]"
                />
              </div>
            </div>
          )}

          {contentPhase === "fase_3_konversi" && (
            <div className="bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#14141F]">
                  Mode Konversi Penjualan:
                </span>
                <div className="inline-flex rounded-lg border border-[#E2E8F0] p-0.5 bg-[#F4F5F7]">
                  <button
                    type="button"
                    onClick={() => setSellingStyle("soft_selling")}
                    className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-bold transition ${
                      sellingStyle === "soft_selling"
                        ? "bg-[#14141F] text-[#D4F34A]"
                        : "text-slate-600"
                    }`}
                  >
                    Soft Selling
                  </button>
                  <button
                    type="button"
                    onClick={() => setSellingStyle("hard_selling")}
                    className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-bold transition ${
                      sellingStyle === "hard_selling"
                        ? "bg-[#14141F] text-[#D4F34A]"
                        : "text-slate-600"
                    }`}
                  >
                    Hard Selling
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="cursor-pointer border border-dashed border-[#C8C5CC] bg-white rounded-lg p-3 flex items-center gap-2.5 text-xs">
                  <FlatIcon name="upload" className="w-4 h-4 text-[#14141F]" />
                  <span className="font-semibold truncate">
                    {ssProduk
                      ? ssProduk.namaFile
                      : "1. Upload Screenshot Produk (Opsional)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const res = await kompresGambarScreenshot(f)
                      if (res) setSsProduk({ ...res, namaFile: f.name })
                    }}
                    className="hidden"
                  />
                </label>

                <label className="cursor-pointer border border-dashed border-[#C8C5CC] bg-white rounded-lg p-3 flex items-center gap-2.5 text-xs">
                  <FlatIcon name="upload" className="w-4 h-4 text-[#14141F]" />
                  <span className="font-semibold truncate">
                    {ssSpesifikasi
                      ? ssSpesifikasi.namaFile
                      : "2. Upload Screenshot Spesifikasi"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const res = await kompresGambarScreenshot(f)
                      if (res) setSsSpesifikasi({ ...res, namaFile: f.name })
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {(ssProduk || ssSpesifikasi) && (
                <button
                  type="button"
                  disabled={isScanningSS}
                  onClick={handleScanMarketplaceAI}
                  className="cursor-pointer w-full bg-[#14141F] text-[#D4F34A] text-xs font-bold py-2.5 rounded-lg"
                >
                  {isScanningSS
                    ? "Mengekstrak Data Produk..."
                    : "Ekstrak Data Produk dari Screenshot"}
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={formProduk.namaProduk}
                  onChange={(e) =>
                    setFormProduk({ ...formProduk, namaProduk: e.target.value })
                  }
                  placeholder="Nama Produk..."
                  className="h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-base sm:text-xs"
                />
                <input
                  type="text"
                  value={formProduk.hargaPromo}
                  onChange={(e) =>
                    setFormProduk({ ...formProduk, hargaPromo: e.target.value })
                  }
                  placeholder="Harga / Promo (Opsional)..."
                  className="h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-base sm:text-xs"
                />
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#14141F]">
                2. Pilih Format Pembawaan Konten
              </h3>
              <p className="text-xs text-slate-500">
                Grid 3x3 pola eksekusi penyampaian pesan
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-[#F4F5F7] px-2.5 py-1 rounded-md border border-[#E2E8F0]">
              9 Format Tersedia
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SEMBILAN_FORMAT_KONTEN.map((fmt) => {
              const aktif = contentFormat === fmt.id
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setContentFormat(fmt.id)}
                  className={`cursor-pointer p-3 rounded-xl text-left transition flex items-center gap-3 min-h-[52px] ${
                    aktif
                      ? "border-2 border-[#14141F] bg-[#FAFAFB]"
                      : "border border-[#E2E8F0] bg-white hover:border-slate-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      aktif
                        ? "bg-[#14141F] text-[#D4F34A]"
                        : "bg-[#F4F5F7] text-[#14141F]"
                    }`}
                  >
                    <FlatIcon name="bolt" className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#14141F] truncate">
                        {fmt.judul}
                      </p>
                      {aktif && (
                        <span className="w-2 h-2 rounded-full bg-[#D4F34A] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {fmt.ket}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#14141F]">
                3. Pilih Faktor Pemicu Perhatian & Viral
              </h3>
              <p className="text-xs text-slate-500">
                Pemicu psikologis retensi audiens di 3 detik pertama
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-[#F4F5F7] px-2.5 py-1 rounded-md border border-[#E2E8F0]">
              5 Opsi Psikologis
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {LIMA_FAKTOR_VIRAL.map((fv) => {
              const aktif = viralTrigger === fv.id
              return (
                <button
                  key={fv.id}
                  type="button"
                  onClick={() => setViralTrigger(fv.id)}
                  className={`cursor-pointer p-3 rounded-xl text-left transition flex flex-col justify-between h-full ${
                    aktif
                      ? "border-2 border-[#14141F] bg-[#FAFAFB]"
                      : "border border-[#E2E8F0] bg-white hover:border-slate-400"
                  }`}
                >
                  <div className="space-y-1">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded inline-block ${
                        aktif
                          ? "bg-[#D4F34A]/50 text-[#14141F]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {fv.badge}
                    </span>
                    <h4 className="text-xs font-bold text-[#14141F] pt-1">
                      {fv.judul}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {fv.ket}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-2 ${
                      aktif ? "text-[#4D6B14]" : "text-slate-400"
                    }`}
                  >
                    {aktif ? "Terpilih" : "Tersedia"}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#14141F]">
              4. Kepadatan Kata, Konteks Bidang & Durasi Riil
            </h3>
            <p className="text-xs text-slate-500">
              Parameter teknis panjang naskah dan pembatasan kosakata naskah
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#14141F] block">
                Kepadatan Kata (Vocabulary Density):
              </label>
              <div className="grid grid-cols-2 p-1 bg-[#F4F5F7] rounded-lg border border-[#E2E8F0] gap-1">
                <button
                  type="button"
                  onClick={() => setWordDensity("padat_kaya_kosakata")}
                  className={`cursor-pointer min-h-[44px] px-2 py-1.5 rounded-md text-xs transition ${
                    wordDensity === "padat_kaya_kosakata"
                      ? "bg-white text-[#14141F] font-bold border border-slate-200"
                      : "text-slate-500 font-semibold"
                  }`}
                >
                  Padat & Kaya Kosakata
                </button>
                <button
                  type="button"
                  onClick={() => setWordDensity("irit_ringkas")}
                  className={`cursor-pointer min-h-[44px] px-2 py-1.5 rounded-md text-xs transition ${
                    wordDensity === "irit_ringkas"
                      ? "bg-white text-[#14141F] font-bold border border-slate-200"
                      : "text-slate-500 font-semibold"
                  }`}
                >
                  Ringkas & Irit Kata
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#14141F] block">
                Konteks Bidang Pembahasan:
              </label>
              <div className="grid grid-cols-2 p-1 bg-[#F4F5F7] rounded-lg border border-[#E2E8F0] gap-1">
                <button
                  type="button"
                  onClick={() => handleUbahContextMode("sesuai_niche")}
                  className={`cursor-pointer min-h-[44px] px-2 py-1.5 rounded-md text-xs transition ${
                    contextMode === "sesuai_niche"
                      ? "bg-white text-[#14141F] font-bold border border-slate-200"
                      : "text-slate-500 font-semibold"
                  }`}
                >
                  Sesuai Bidang Profil
                </button>
                <button
                  type="button"
                  onClick={() => handleUbahContextMode("lintas_produk")}
                  className={`cursor-pointer min-h-[44px] px-2 py-1.5 rounded-md text-xs transition ${
                    contextMode === "lintas_produk"
                      ? "bg-white text-[#14141F] font-bold border border-slate-200"
                      : "text-slate-500 font-semibold"
                  }`}
                >
                  Lintas Topik / Bebas
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#14141F] block">
                Target Durasi Baca Riil (Audio Pacing):
              </label>
              <div className="relative">
                <select
                  value={targetPlatformInput}
                  onChange={(e) => setTargetPlatformInput(e.target.value)}
                  className="w-full min-h-[44px] text-base sm:text-xs px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-[#14141F] font-semibold appearance-none focus:outline-none focus:border-[#14141F] pr-9"
                >
                  {PILIHAN_DURASI_KONTEN.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-3 text-slate-500">
                  <FlatIcon name="chevronDown" className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#14141F]">
              5. Input Topik Mandiri
            </h3>
            <p className="text-xs text-slate-500">
              Tulis ide atau topik bebasmu sendiri, atau pilih rekomendasi
              otomatis di bawahnya
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#14141F]">
                Topik / Ide Utama yang Ingin Dibahas:
              </label>
              <button
                type="button"
                onClick={() => setRawTopicInput("")}
                className="cursor-pointer text-xs text-rose-500 hover:text-rose-700 font-semibold"
              >
                Hapus
              </button>
            </div>

            <StoryVoiceInput
              rows={3}
              value={rawTopicInput}
              onChange={(val) => {
                setRawTopicInput(val)
              }}
              userId={userId}
              memorySourceLabel="Input Topik Mandiri"
              placeholder="Tuliskan topik bahasan, keresahan yang ingin diangkat, atau tempel draf ide kasarmu di sini..."
              onNotify={showToast}
            />
          </div>

          {contextMode === "sesuai_niche" && (
            <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-[#14141F] flex items-center gap-1.5">
                    <FlatIcon name="dna" className="w-4 h-4 text-[#4D6B14]" />
                    <span>
                      Rekomendasi Ide Materi dari Analisis Profil Akun
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Diekstrak otomatis dari niche profil akun yang sedang aktif
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isLoadingIdeTopik}
                  onClick={handleGenerate10IdeTopikAI}
                  className="cursor-pointer min-h-[44px] px-3.5 py-2 rounded-lg bg-[#14141F] text-white hover:bg-black text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <FlatIcon
                    name={isLoadingIdeTopik ? "refresh" : "search"}
                    className={`w-4 h-4 text-[#D4F34A] ${
                      isLoadingIdeTopik ? "animate-spin" : ""
                    }`}
                  />
                  <span>
                    {isLoadingIdeTopik
                      ? "Menganalisis Profil..."
                      : "Analisis Profil & Cari 10 Ide"}
                  </span>
                </button>
              </div>

              {daftar10IdeTopik.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
                  {daftar10IdeTopik.map((ide, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setRawTopicInput(ide.judul)
                        showToast(`Topik dipilih: ${ide.judul}`)
                      }}
                      className="min-w-[260px] max-w-[280px] p-3 rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] hover:border-[#14141F] cursor-pointer transition flex flex-col justify-between shrink-0"
                    >
                      <div>
                        <span className="text-[10px] font-extrabold text-[#4D6B14] bg-[#F2FCE2] px-2 py-0.5 rounded">
                          Rekomendasi #{String(idx + 1).padStart(2, "0")}
                        </span>
                        <p className="text-xs font-bold text-[#14141F] mt-1.5 leading-snug">
                          {ide.judul}
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          {ide.nuansa || "Relevan"}
                        </span>
                        <span className="font-bold text-[#14141F] flex items-center gap-1">
                          Pilih{" "}
                          <FlatIcon name="arrowRight" className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={isLoadingOpsi}
            onClick={() => handleMuatOpsiAsesmen(false)}
            className="cursor-pointer w-full min-h-[48px] bg-[#14141F] text-[#D4F34A] text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition"
          >
            <FlatIcon
              name={isLoadingOpsi ? "refresh" : "bolt"}
              className={`w-4 h-4 ${isLoadingOpsi ? "animate-spin" : ""}`}
            />
            <span>
              {isLoadingOpsi
                ? "Menyusun Opsi Asesmen Terpandu..."
                : "Muat Opsi Sudut Pandang, Ilustrasi & Hook (Bagian B)"}
            </span>
          </button>
        </section>
      </div>

      <div className="space-y-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#14141F] text-[#D4F34A] flex items-center justify-center font-bold text-xs">
            B
          </div>
          <h2 className="text-lg font-bold text-[#14141F] tracking-tight">
            Bagian B: Tahap Asesmen Terpandu (Textbox-First)
          </h2>
        </div>

        {isLoadingOpsi && (
          <AILoadingBox
            label="Menyusun opsi sudut pandang, metafora, dan kategori hook..."
            onRefresh={() => handleMuatOpsiAsesmen(false)}
          />
        )}

        <section className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="bg-[#14141F] text-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#D4F34A] block">
                  Catatan Produser AI Hookya
                </span>
                <h3 className="text-base sm:text-lg font-bold leading-tight">
                  Konstruksi Retensi & Eksplorasi Multi-Angle
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {currentAssessment?.co_pilot_message ||
                    "Asesmen ini menggali bobot cerita otentik dari kepalamu. Textbox diutamakan agar narasi tidak seragam, sedangkan tombol opsi berfungsi sebagai pemicu referensi saat ide buntu."}
                </p>
              </div>
              <div className="hidden sm:block text-right shrink-0">
                <span className="text-xs font-semibold text-slate-400 block">
                  Sesi Asesmen
                </span>
                <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded">
                  Aktif • {targetPlatformInput.split("(")[0]}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#F8F9FA] px-4 py-2.5 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#14141F] mr-1">
                Pilihan Set Arahan:
              </span>
              {[0, 1, 2].map((idx) => {
                const tersedia = Boolean(assessmentBatches[idx])
                const aktif = activeBatchIdx === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!tersedia}
                    onClick={() => setActiveBatchIdx(idx)}
                    className={`cursor-pointer min-h-[36px] px-3 py-1 rounded-md text-xs transition ${
                      aktif && tersedia
                        ? "bg-[#14141F] text-white font-bold"
                        : "bg-white text-slate-500 border border-[#E2E8F0] font-semibold disabled:opacity-40"
                    }`}
                  >
                    Set {idx + 1}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              disabled={assessmentBatches.length >= 3 || isLoadingOpsi}
              onClick={() => handleMuatOpsiAsesmen(true)}
              className="cursor-pointer min-h-[36px] px-3 py-1.5 rounded-lg border border-[#14141F] bg-white hover:bg-slate-50 text-xs font-bold text-[#14141F] flex items-center gap-1.5 transition disabled:opacity-40"
            >
              <FlatIcon name="refresh" className="w-3.5 h-3.5" />
              <span>
                Cari Opsi Lain (Sisa{" "}
                {Math.max(0, 3 - Math.max(1, assessmentBatches.length))}x)
              </span>
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#14141F]">
              1. Pilih Sudut Pandang Bahasan (Angle)
            </h3>
            <p className="text-xs text-slate-500">
              Tentukan lensa penceritaan utama dan tuliskan pengalaman spesifik
              jika ada
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              currentAssessment?.angle_options || [
                {
                  label: "Angle 1",
                  type: "Pengalaman Kegagalan Pribadi",
                  angle_text:
                    "Menggunakan sudut pandang pribadi yang pernah rugi dan belajar dari kesalahan nyata di lapangan.",
                },
                {
                  label: "Angle 2",
                  type: "Pengamat Kritis / Anti-Gimmick",
                  angle_text:
                    "Membongkar tren yang salah kaprah di kalangan pemula dengan nada jujur dan realistis.",
                },
                {
                  label: "Angle 3",
                  type: "Panduan Eksekusi Step-by-Step",
                  angle_text:
                    "Struktur taktis tanpa basa-basi langsung ke langkah penyelamatan dan solusi praktis.",
                },
              ]
            ).map((ang, idx) => {
              const dipilih = chosenAngle === ang.angle_text
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setChosenAngle(ang.angle_text)}
                  className={`cursor-pointer p-3.5 rounded-xl text-left transition h-full flex flex-col justify-between ${
                    dipilih
                      ? "border-2 border-[#14141F] bg-[#FAFAFB]"
                      : "border border-[#E2E8F0] bg-white hover:border-slate-400"
                  }`}
                >
                  <div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        dipilih
                          ? "bg-[#D4F34A]/50 text-[#14141F]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {ang.label || `Angle ${idx + 1}`}
                    </span>
                    <h4 className="text-xs font-bold text-[#14141F] mt-1.5">
                      {ang.type}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-tight mt-1">
                      {ang.angle_text}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-2 ${
                      dipilih ? "text-[#4D6B14]" : "text-slate-400"
                    }`}
                  >
                    {dipilih ? "Terpilih" : "Tersedia"}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#14141F]">
                Catatan Pengalaman Personal Spesifik (Opsional):
              </label>
              <button
                type="button"
                onClick={() => setPengalamanInput("")}
                className="cursor-pointer text-xs text-rose-500 hover:text-rose-700 font-semibold"
              >
                Hapus
              </button>
            </div>
            <StoryVoiceInput
              rows={2}
              value={pengalamanInput}
              onChange={setPengalamanInput}
              userId={userId}
              memorySourceLabel="Pengalaman Personal"
              placeholder="Tuliskan pengalaman nyata singkat jika ingin dimasukkan ke dalam cerita..."
              onNotify={showToast}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#14141F]">
                2. Ilustrasi / Perumpamaan Sehari-hari (Opsional)
              </h3>
              <p className="text-xs text-slate-500">
                Gunakan metafora konkret agar konsep rumit dipahami dalam 5
                detik
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setShowRekomendasiIlustrasi(!showRekomendasiIlustrasi)
              }
              className="cursor-pointer min-h-[44px] px-3.5 py-1.5 rounded-lg border border-[#14141F] bg-white hover:bg-slate-50 text-xs font-bold text-[#14141F] flex items-center gap-1.5 shrink-0 transition"
            >
              <FlatIcon name="bolt" className="w-4 h-4 text-[#4D6B14]" />
              <span>
                {showRekomendasiIlustrasi
                  ? "Sembunyikan Rekomendasi"
                  : "Minta Rekomendasi Ilustrasi"}
              </span>
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#14141F]">
                Tuliskan Ilustrasi atau Metafora Sendiri:
              </label>
              <button
                type="button"
                onClick={() => setIlustrasiInput("")}
                className="cursor-pointer text-xs text-rose-500 hover:text-rose-700 font-semibold"
              >
                Hapus
              </button>
            </div>
            <StoryVoiceInput
              rows={2}
              value={ilustrasiInput}
              onChange={setIlustrasiInput}
              userId={userId}
              memorySourceLabel="Ilustrasi & Metafora"
              placeholder="Ketik perumpamaan versimu sendiri, atau klik tombol Minta Rekomendasi Ilustrasi..."
              onNotify={showToast}
            />
          </div>

          {showRekomendasiIlustrasi && (
            <div className="bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] p-3.5 space-y-2.5">
              <span className="text-[11px] font-bold text-[#14141F] uppercase tracking-wider block">
                3 Pilihan Metafora Rekomendasi AI:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  currentAssessment?.relatable_analogies || [
                    {
                      judul: "Helm Balap Tanpa Motor",
                      ringkasan:
                        "Perumpamaan beli tools mahal tapi belum ada pembeli.",
                      teks: "Seperti beli helm balap F1 tapi motornya sendiri belum kebeli.",
                    },
                    {
                      judul: "Pesta Tanpa Undangan",
                      ringkasan:
                        "Perumpamaan membangun produk 2 bulan tanpa validasi pasar.",
                      teks: "Seperti masak rendang 10 porsi buat pesta yang tamunya belum diundang.",
                    },
                    {
                      judul: "Brankas Dinding Kardus",
                      ringkasan:
                        "Perumpamaan terlalu rumit di awal tanpa fondasi dasar.",
                      teks: "Seperti pasang pintu brankas baja di rumah yang dindingnya dari kardus.",
                    },
                  ]
                ).map((item, idx) => {
                  const judulMeta =
                    typeof item === "string"
                      ? `Metafora #${idx + 1}`
                      : item.judul
                  const ketMeta =
                    typeof item === "string" ? item : item.ringkasan
                  const teksIsi =
                    typeof item === "string"
                      ? item
                      : item.teks || item.ringkasan

                  return (
                    <div
                      key={idx}
                      onClick={() => setIlustrasiInput(teksIsi)}
                      className="p-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#14141F] cursor-pointer text-xs transition"
                    >
                      <p className="font-bold text-[#14141F]">{judulMeta}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {ketMeta}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#14141F]">
                3. Pondasi Fakta & Alasan Masuk Akal
              </h3>
              <p className="text-xs text-slate-500">
                Kenyataan lapangan, alasan masuk akal, atau bukti nyata apa yang
                membuat penonton percaya pada bahasanmu ini?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRekomendasiFakta(!showRekomendasiFakta)}
              className="cursor-pointer min-h-[44px] px-3.5 py-1.5 rounded-lg border border-[#14141F] bg-white hover:bg-slate-50 text-xs font-bold text-[#14141F] flex items-center gap-1.5 shrink-0 transition"
            >
              <FlatIcon name="search" className="w-4 h-4" />
              <span>
                {showRekomendasiFakta
                  ? "Sembunyikan Ide Fakta"
                  : "Lihat Ide Fakta Pendukung"}
              </span>
            </button>
          </div>

          {showRekomendasiFakta &&
            Array.isArray(currentAssessment?.reference_cards) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {currentAssessment.reference_cards.map((rc, idx) => (
                  <div
                    key={idx}
                    onClick={() => setFaktaInput(`${rc.title}: ${rc.summary}`)}
                    className="p-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8F9FA] hover:border-[#14141F] cursor-pointer text-xs transition"
                  >
                    <p className="font-bold text-[#14141F]">{rc.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {rc.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#14141F]">
                Argumen Fakta Lapangan yang Ingin Kamu Pakai:
              </label>
              <button
                type="button"
                onClick={() => setFaktaInput("")}
                className="cursor-pointer text-xs text-rose-500 hover:text-rose-700 font-semibold"
              >
                Hapus
              </button>
            </div>
            <StoryVoiceInput
              rows={2}
              value={faktaInput}
              onChange={setFaktaInput}
              userId={userId}
              memorySourceLabel="Pondasi Fakta"
              placeholder="Tuliskan data, realita lapangan, atau argumen logis yang sulit dibantah penonton..."
              onNotify={showToast}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 space-y-5">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#14141F]">
              4. Struktur Alur, Formula Hook & Call-To-Action
            </h3>
            <p className="text-xs text-slate-500">
              Atur kerangka penceritaan agar alur mengalir mulus ke penutup
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#14141F] block">
              Pilih Struktur Kerangka Naskah:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {EMPAT_FRAMEWORK_ALUR.map((fw) => {
                const dipilih = selectedFramework === fw.id
                return (
                  <button
                    key={fw.id}
                    type="button"
                    onClick={() => setSelectedFramework(fw.id)}
                    className={`cursor-pointer p-3 rounded-xl text-left transition h-full ${
                      dipilih
                        ? "border-2 border-[#14141F] bg-[#FAFAFB]"
                        : "border border-[#E2E8F0] bg-white hover:border-slate-400"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        dipilih
                          ? "bg-[#D4F34A]/50 text-[#14141F]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {fw.kode}
                    </span>
                    <p className="text-xs font-bold text-[#14141F] mt-1">
                      {fw.judul}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {fw.ket}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#14141F] block">
              Pilih 1 dari 6 Kategori Pembuka (Hook 3 Detik Pertama):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {(
                currentAssessment?.hook_options || [
                  {
                    badge: "#1",
                    category: "Anti-Gimmick / Satir",
                    text: "Anti-Gimmick / Satir",
                  },
                  {
                    badge: "#2",
                    category: "Pertanyaan Menohok",
                    text: "Pertanyaan Menohok",
                  },
                  {
                    badge: "#3",
                    category: "Pernyataan Kontras",
                    text: "Pernyataan Kontras",
                  },
                  {
                    badge: "#4",
                    category: "Pengakuan Kesalahan",
                    text: "Pengakuan Kesalahan",
                  },
                  {
                    badge: "#5",
                    category: "Statistik Tak Lazim",
                    text: "Statistik Tak Lazim",
                  },
                  {
                    badge: "#6",
                    category: "Larangan Tegas",
                    text: "Larangan Tegas",
                  },
                ]
              ).map((hk, idx) => {
                const nilaiHook = hk.text || hk.category
                const aktif = lockedHook === nilaiHook
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLockedHook(nilaiHook)}
                    className={`cursor-pointer p-2.5 rounded-lg text-left text-xs transition ${
                      aktif
                        ? "border-2 border-[#14141F] bg-[#14141F] text-white font-bold"
                        : "border border-[#E2E8F0] bg-[#F8F9FA] hover:border-slate-400 text-[#14141F] font-semibold"
                    }`}
                  >
                    <span
                      className={`block text-[10px] ${
                        aktif ? "text-[#D4F34A]" : "text-slate-400"
                      }`}
                    >
                      {hk.badge || `#${idx + 1}`}
                    </span>
                    <span className="line-clamp-2">{hk.category}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#14141F] block">
              Pilih Target Penutup (Call-to-Action):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                currentAssessment?.cta_options || [
                  {
                    category: "1. Interaksi Komentar Kata Kunci",
                    text: "Komen kata kunci di bawah buat diskusi lebih lanjut.",
                  },
                  {
                    category: "2. Akses Tautan di Profil / Bio",
                    text: "Cek link di bio untuk coba langsung panduannya.",
                  },
                  {
                    category: "3. Simpan & Bagikan ke Teman",
                    text: "Save video ini biar gak hilang saat kamu butuh nanti.",
                  },
                ]
              ).map((ct, idx) => {
                const teksCta = ct.text || ct.category
                const dipilih = callToAction === teksCta
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCallToAction(teksCta)}
                    className={`cursor-pointer p-3 rounded-xl text-left transition ${
                      dipilih
                        ? "border-2 border-[#14141F] bg-[#FAFAFB]"
                        : "border border-[#E2E8F0] bg-white hover:border-slate-400"
                    }`}
                  >
                    <p className="text-xs font-bold text-[#14141F]">
                      {ct.category}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {teksCta}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#14141F]">
              5. Tahap Periksa Rancangan Konten
            </h3>
            <p className="text-xs text-slate-500">
              Tinjau keselarasan instruksi sebelum generator AI menyusun naskah
              utuh
            </p>
          </div>

          <div className="bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] p-4 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#14141F] block">
              Ringkasan Konfigurasi Naskah:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Tujuan:</span>
                <span className="font-bold text-[#14141F]">
                  {contentPhase === "fase_1_viral"
                    ? "Fase 1 (Cari Viral)"
                    : contentPhase === "fase_2_trust"
                      ? "Fase 2 (Trust & Otoritas)"
                      : "Fase 3 (Konversi Jualan)"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Format:</span>
                <span className="font-bold text-[#14141F]">
                  {infoFormatAktif?.judul}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Durasi Riil:</span>
                <span className="font-bold text-[#14141F]">
                  {targetPlatformInput.split("(")[0]}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Pemicu Viral:</span>
                <span className="font-bold text-[#14141F]">
                  {infoFaktorAktif?.judul}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#14141F]">
                Catatan Tambahan / Koreksi Akhir Sebelum Naskah Dibuat
                (Opsional):
              </label>
              <button
                type="button"
                onClick={() => setKoreksiAkhirInput("")}
                className="cursor-pointer text-xs text-rose-500 hover:text-rose-700 font-semibold"
              >
                Hapus
              </button>
            </div>
            <StoryVoiceInput
              rows={2}
              value={koreksiAkhirInput}
              onChange={setKoreksiAkhirInput}
              userId={userId}
              memorySourceLabel="Koreksi Akhir Asesmen"
              placeholder="Masukkan instruksi khusus untuk memastikan hasil naskah sesuai keinginanmu..."
              onNotify={showToast}
            />
          </div>

          <div className="pt-2">
            {isGenerating ? (
              <AILoadingBox
                label="Menyusun naskah skrip penuh sesuai target jumlah kata..."
                onRefresh={handleBuatSkripSekarang}
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleBuatSkripSekarang}
                  className="cursor-pointer w-full min-h-[52px] px-6 py-3.5 rounded-xl bg-[#D4F34A] hover:opacity-95 text-[#14141F] font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 border border-[#14141F] active:scale-[0.99] transition"
                >
                  <FlatIcon name="edit" className="w-5 h-5" />
                  <span>Susun Naskah Skrip Sekarang (Potong 1 Koin)</span>
                </button>
                <p className="text-center text-xs text-slate-500 font-medium mt-2">
                  Estimasi waktu proses: ~5-8 detik • Menghasilkan naskah siap
                  rekam & teleprompter
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
