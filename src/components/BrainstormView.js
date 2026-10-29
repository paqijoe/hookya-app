"use client"
import { useState, useEffect, useRef } from "react"
import {
  FlatIcon,
  AILoadingBox,
  TUJUH_ANGLE_PRODUK,
  rekamKetikanKeGudangIngatan,
  ambilDataGudangIngatan,
  simpanAnalisaGudangIngatan,
} from "./SharedUI"

const DAFTAR_FORMAT_SESI = [
  "60s Reel / TikTok",
  "Threads 6 Langkah",
  "Carousel 7 Slide",
  "30s Short Skit / POV",
]

const DAFTAR_TONE_SESI = [
  "Santai & To-the-point",
  "Gaya Persona Akun",
  "Sosmed Santai Formal",
  "Satir & Blak-blakan",
]

const CHIP_PEMBUKA_CEPAT = [
  "Hook Kontroversial Produk Affiliate",
  "Skrip Threads 6 Langkah dari Review Bintang 1-3",
  "Konten POV Behind The Scene (Bangun Trust)",
  "Bedah 10 Masalah Audiens untuk Produk Baru",
]

function kompresGambarChat(file) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const maxDim = 850
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
            previewUrl: dataUrl,
            base64: dataUrl.split(",")[1] || "",
            mimeType: "image/jpeg",
            namaFile: file.name,
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

function buatSesiTopikBaru(nomorUrut = 1, akunDefault = "@akun.utama") {
  const waktuSkr = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return {
    id: `sesi_${Date.now()}`,
    nomorSesi: nomorUrut,
    judul: "Diskusi Topik Konten Baru",
    akunLabel: akunDefault,
    format: "60s Reel / TikTok",
    tone: "Santai & To-the-point",
    statusLabel: "Draf Baru",
    statusTahap: "Sedang diskusi",
    waktuTerakhir: waktuSkr,
    masalahTerpilih: "",
    angleTerpilih: "",
    hookTerpilih: "",
    messages: [
      {
        id: `msg_init_${Date.now()}`,
        role: "assistant",
        waktu: waktuSkr,
        kategoriDeteksi: "pembuka",
        badgeStrategi: "Mode Kilat AI Aktif",
        balasanBot:
          "Halo Creator! Mau bikin konsep naskah untuk apa hari ini? Tuliskan ide mentah, produk yang mau dijual, target audiensmu, atau unggah foto produk maupun screenshot review bintang 1-3. Saya siap memetakan 10 masalah audiens, 7 angle, formula hook 3 detik, dan naskah 6 langkah lengkap.",
        painPoints10: [],
        sevenAngles: [],
        hookOptions: [],
        opsiTujuanMedia: [],
        naskah6Langkah: null,
      },
    ],
  }
}

export default function BrainstormView({
  userId,
  namaUser,
  kuotaAkunMaksimal = 2,
  coins,
  updateKoinDatabase,
  personaProfile,
  preferredModel = "google/gemini-2.5-flash",
  simpanAtauUpdateSkripDatabase,
  setKoleksiSkripTersimpan,
  setHasilSkrip,
  setStage,
  setActiveMenu,
  showToast,
  onRefreshDataUser,
}) {
  const chatEndRef = useRef(null)
  const speechRecRef = useRef(null)
  const storageSessionsKey = `hookya_topic_sessions_v2_${userId || "guest"}`

  // Mode layar: "list" (Daftar Sesi Topik sesuai screen.jpg) atau "chat" (Ruang Chat sesuai 2_2.png)
  const [subView, setSubView] = useState("chat")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterAkunPill, setFilterAkunPill] = useState("ALL")
  const [openSwipeId, setOpenSwipeId] = useState(null)

  const [daftarAkunSosmed, setDaftarAkunSosmed] = useState([])
  const [daftarSesiTopik, setDaftarSesiTopik] = useState([])
  const [activeSessionId, setActiveSessionId] = useState("")

  const [pesanInput, setPesanInput] = useState("")
  const [lampiranGambar, setLampiranGambar] = useState([])
  const [isSendingChat, setIsSendingChat] = useState(false)
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [isListeningMic, setIsListeningMic] = useState(false)

  // State Gudang Ingatan
  const [memoryVault, setMemoryVault] = useState({
    samples: [],
    reviewSingkat: "",
    rincianAnalisa: null,
  })
  const [showMemoryDetail, setShowMemoryDetail] = useState(false)

  // State pilihan CTA di dalam kartu naskah 6 langkah
  const [activeCtaTabMap, setActiveCtaTabMap] = useState({})

  const akunDefaultLabel =
    personaProfile?.account_label ||
    `@${(namaUser || "creator").toLowerCase().replace(/\s+/g, ".")}`

  useEffect(() => {
    if (typeof window === "undefined") return
    setMemoryVault(ambilDataGudangIngatan(userId))

    try {
      const rawTernak = localStorage.getItem(
        `hookya_ternak_akun_${userId || "guest"}`,
      )
      if (rawTernak) {
        const parsed = JSON.parse(rawTernak)
        if (Array.isArray(parsed.daftarAkun) && parsed.daftarAkun.length > 0) {
          setDaftarAkunSosmed(parsed.daftarAkun)
        }
      }
    } catch {
      // Ignore storage read error
    }

    try {
      const rawSesi = localStorage.getItem(storageSessionsKey)
      if (rawSesi) {
        const parsedSesi = JSON.parse(rawSesi)
        if (Array.isArray(parsedSesi) && parsedSesi.length > 0) {
          setDaftarSesiTopik(parsedSesi)
          setActiveSessionId(parsedSesi[0].id)
          return
        }
      }
    } catch {
      // Ignore session parse error
    }

    const sesiAwal = buatSesiTopikBaru(1, akunDefaultLabel)
    setDaftarSesiTopik([sesiAwal])
    setActiveSessionId(sesiAwal.id)
  }, [userId, storageSessionsKey, akunDefaultLabel])

  const simpanDaftarSesiKeLokal = (listBaru) => {
    setDaftarSesiTopik(listBaru)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          storageSessionsKey,
          JSON.stringify(listBaru.slice(0, 35)),
        )
      } catch {
        // Ignore quota error
      }
    }
  }

  const sesiAktif =
    daftarSesiTopik.find((s) => s.id === activeSessionId) ||
    daftarSesiTopik[0] ||
    buatSesiTopikBaru(1, akunDefaultLabel)

  const updateSesiAktif = (perubahanObj) => {
    const listUpdate = daftarSesiTopik.map((s) =>
      s.id === sesiAktif.id ? { ...s, ...perubahanObj } : s,
    )
    simpanDaftarSesiKeLokal(listUpdate)
  }

  const handleBuatTopikBaru = () => {
    const nomorBaru = daftarSesiTopik.length + 1
    const akunAktif =
      filterAkunPill !== "ALL" ? filterAkunPill : akunDefaultLabel
    const baru = buatSesiTopikBaru(nomorBaru, akunAktif)
    const listBaru = [baru, ...daftarSesiTopik]
    simpanDaftarSesiKeLokal(listBaru)
    setActiveSessionId(baru.id)
    setSubView("chat")
    setPesanInput("")
    setLampiranGambar([])
  }

  const handleHapusSesiTopik = (idTarget) => {
    const sisa = daftarSesiTopik.filter((s) => s.id !== idTarget)
    if (sisa.length === 0) {
      const baru = buatSesiTopikBaru(1, akunDefaultLabel)
      simpanDaftarSesiKeLokal([baru])
      setActiveSessionId(baru.id)
    } else {
      simpanDaftarSesiKeLokal(sisa)
      if (activeSessionId === idTarget) {
        setActiveSessionId(sisa[0].id)
      }
    }
    setOpenSwipeId(null)
    showToast("Sesi topik berhasil dihapus.")
  }

  const handlePilihGambarUpload = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 2)
    if (files.length === 0) return
    const hasilKompres = []
    for (const f of files) {
      const k = await kompresGambarChat(f)
      if (k) hasilKompres.push(k)
    }
    setLampiranGambar((prev) => [...prev, ...hasilKompres].slice(0, 2))
    e.target.value = ""
  }

  const handleToggleMicInput = () => {
    if (typeof window === "undefined") return
    if (isListeningMic && speechRecRef.current) {
      try {
        speechRecRef.current.stop()
      } catch {
        // Ignore stop error
      }
      setIsListeningMic(false)
      return
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) {
      showToast("Gunakan Chrome atau Safari terbaru untuk fitur dikte suara.")
      return
    }

    try {
      const rec = new SpeechRec()
      rec.lang = "id-ID"
      rec.onstart = () => {
        setIsListeningMic(true)
        showToast("Silakan bicara, suara sedang diubah ke teks...")
      }
      rec.onresult = (ev) => {
        const hasil = ev.results?.[0]?.[0]?.transcript || ""
        if (hasil) {
          setPesanInput((prev) => (prev ? `${prev} ${hasil}` : hasil))
          rekamKetikanKeGudangIngatan(userId, "Voice Note Chat", hasil)
        }
      }
      rec.onend = () => setIsListeningMic(false)
      rec.onerror = () => setIsListeningMic(false)
      speechRecRef.current = rec
      rec.start()
    } catch {
      setIsListeningMic(false)
    }
  }

  const handleKirimPesanKeBot = async ({
    teksOverride = null,
    tujuanOverride = "",
    angleOverride = "",
    masalahOverride = "",
  } = {}) => {
    const teksFinal = (teksOverride !== null ? teksOverride : pesanInput).trim()
    if (!teksFinal && lampiranGambar.length === 0) return
    if (isSendingChat) return

    const waktuSkr = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })

    if (teksFinal) {
      const vBaru = rekamKetikanKeGudangIngatan(
        userId,
        "Chat Sesi Topik",
        teksFinal,
      )
      if (vBaru) setMemoryVault(vBaru)
    }

    const msgUser = {
      id: `usr_${Date.now()}`,
      role: "user",
      waktu: waktuSkr,
      teks:
        teksFinal ||
        "Tolong analisis gambar yang saya unggah ini untuk dijadikan konsep konten.",
      images: lampiranGambar.map((g) => g.previewUrl),
    }

    const messagesSementara = [...(sesiAktif.messages || []), msgUser]
    const judulSementara =
      sesiAktif.judul === "Diskusi Topik Konten Baru" && teksFinal
        ? teksFinal.slice(0, 48)
        : sesiAktif.judul

    updateSesiAktif({
      judul: judulSementara,
      waktuTerakhir: waktuSkr,
      masalahTerpilih: masalahOverride || sesiAktif.masalahTerpilih,
      angleTerpilih: angleOverride || sesiAktif.angleTerpilih,
      messages: messagesSementara,
    })

    const gambarDikirim = [...lampiranGambar]
    if (teksOverride === null) setPesanInput("")
    setLampiranGambar([])
    setIsSendingChat(true)

    try {
      const akunObj = daftarAkunSosmed.find(
        (a) => a.labelAkun === sesiAktif.akunLabel,
      )

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ai_script_session_chat",
          userId,
          namaUser,
          preferredModel,
          pesanUser: msgUser.teks,
          riwayatChat: messagesSementara.slice(-6).map((m) => ({
            role: m.role,
            content: m.teks || m.balasanBot || "",
          })),
          formatKonten: sesiAktif.format,
          toneBicara: sesiAktif.tone,
          tujuanKonten: tujuanOverride,
          angleTerpilih: angleOverride || sesiAktif.angleTerpilih,
          masalahTerpilih: masalahOverride || sesiAktif.masalahTerpilih,
          gunakanPersona: sesiAktif.tone !== "Sosmed Santai Formal",
          akunPersonaTerpilih: akunObj || null,
          personaProfile,
          memoryVaultSamples: ambilDataGudangIngatan(userId).samples || [],
          uploadedImages: gambarDikirim,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memproses chat")

      if (data.analisaGudangIngatan) {
        const vDisimpan = simpanAnalisaGudangIngatan(
          userId,
          data.analisaGudangIngatan,
        )
        if (vDisimpan) setMemoryVault(vDisimpan)
      }

      const msgBot = {
        id: `bot_${Date.now()}`,
        role: "assistant",
        waktu: waktuSkr,
        modelUsed: data.modelUsed || preferredModel,
        kategoriDeteksi: data.kategoriDeteksi || "siap_pilih_hook",
        badgeStrategi: data.badgeStrategi || `Strategi ${sesiAktif.format}`,
        balasanBot:
          data.balasanBot || "Berikut hasil pemetaan strategi kontenmu:",
        pertanyaanTindakLanjut: data.pertanyaanTindakLanjut || "",
        opsiTujuanMedia: Array.isArray(data.opsiTujuanMedia)
          ? data.opsiTujuanMedia
          : [],
        painPoints10: Array.isArray(data.painPoints10) ? data.painPoints10 : [],
        sevenAngles: Array.isArray(data.sevenAngles) ? data.sevenAngles : [],
        hookOptions: Array.isArray(data.hookOptions) ? data.hookOptions : [],
        naskah6Langkah: null,
      }

      const judulFinal =
        sesiAktif.judul === "Diskusi Topik Konten Baru" && data.judulSesiTopik
          ? data.judulSesiTopik
          : judulSementara

      updateSesiAktif({
        judul: judulFinal,
        waktuTerakhir: waktuSkr,
        statusTahap: "Sedang diskusi",
        messages: [...messagesSementara, msgBot],
      })

      if (onRefreshDataUser) onRefreshDataUser()
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 120)
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsSendingChat(false)
    }
  }

  const handleGenerateNaskah6Langkah = async (opsiHookObj) => {
    if (isGeneratingScript) return
    if (coins < 1) {
      alert("Saldo koin belum mencukupi (Perlu 1 Koin). Silakan Top-Up koin.")
      setActiveMenu("topup")
      return
    }

    const teksHook =
      typeof opsiHookObj === "string"
        ? opsiHookObj
        : opsiHookObj?.teksHook || ""

    setIsGeneratingScript(true)
    await updateKoinDatabase(coins - 1)

    const waktuSkr = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })

    try {
      const akunObj = daftarAkunSosmed.find(
        (a) => a.labelAkun === sesiAktif.akunLabel,
      )

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_6step_script",
          userId,
          namaUser,
          preferredModel,
          pesanUser: sesiAktif.judul,
          formatKonten: sesiAktif.format,
          toneBicara: sesiAktif.tone,
          masalahTerpilih: sesiAktif.masalahTerpilih,
          angleTerpilih: sesiAktif.angleTerpilih,
          hookTerpilih: teksHook,
          akunPersonaTerpilih: akunObj || null,
          personaProfile,
          memoryVaultSamples: ambilDataGudangIngatan(userId).samples || [],
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.silentCoinUpdated != null) {
          updateKoinDatabase(data.silentCoinUpdated)
        }
        if (onRefreshDataUser) onRefreshDataUser()
        throw new Error("Gagal menyusun naskah 6 langkah")
      }

      const tglHariIni = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })

      const skripBaru = {
        id: Date.now(),
        dbId: null,
        judul: data.judul || sesiAktif.judul,
        kategori: "Formula 6 Langkah",
        bentuk: sesiAktif.format,
        akunLabel: sesiAktif.akunLabel,
        waktuDibuat: tglHariIni,
        targetDuration: data.targetDuration || sesiAktif.format,
        kataKunciReviewTerpakai: data.kataKunciReviewTerpakai || [
          "review",
          "pengalaman",
          "hasil",
        ],
        ctaVariations: data.ctaVariations || null,
        kritikDetail: data.kritikDetail || null,
        uploadPackage: data.uploadPackage || null,
        uploadPack: data.uploadPackage || null,
        variasiFolder: [],
        sudahUpload: false,
        tanggalUpload: "",
        sections: data.sections || [],
        segmen: data.segmen || data.sections || [],
      }

      const tersimpanDB = await simpanAtauUpdateSkripDatabase(skripBaru)
      setKoleksiSkripTersimpan((prev) => [tersimpanDB, ...prev])

      const msgNaskah = {
        id: `script_${Date.now()}`,
        role: "assistant",
        waktu: waktuSkr,
        modelUsed: data.modelUsed || preferredModel,
        badgeStrategi: "Formula 6 Langkah Selesai",
        balasanBot:
          "Naskah 6 Langkah (Hook -> Masalah -> Curiosity -> Solusi -> Proof Kata Kunci Review -> 3 Variasi CTA) selesai disusun dan otomatis tersimpan ke Arsip.",
        naskah6Langkah: tersimpanDB,
      }

      updateSesiAktif({
        hookTerpilih: teksHook,
        statusLabel: "Siap Rekam",
        statusTahap: "Draf disetujui",
        waktuTerakhir: waktuSkr,
        messages: [...(sesiAktif.messages || []), msgNaskah],
      })

      if (onRefreshDataUser) onRefreshDataUser()
      showToast("Naskah 6 Langkah berhasil dibuat & disimpan ke Arsip.")
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 150)
    } catch {
      showToast(
        "Request gagal diproses. Koin Anda telah dikembalikan otomatis (Auto-Refund).",
      )
    } finally {
      setIsGeneratingScript(false)
    }
  }

  const semuaAkunUnik = [
    akunDefaultLabel,
    ...daftarAkunSosmed.map((a) => a.labelAkun),
  ].filter((v, i, arr) => v && arr.indexOf(v) === i)

  const daftarSesiTerfilter = daftarSesiTopik.filter((s) => {
    if (filterAkunPill !== "ALL" && s.akunLabel !== filterAkunPill) {
      return false
    }
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (s.judul || "").toLowerCase().includes(q) ||
      (s.format || "").toLowerCase().includes(q) ||
      (s.akunLabel || "").toLowerCase().includes(q)
    )
  })

  // ============================================================================
  // TAMPILAN 1: DAFTAR SESI TOPIK (SESUAI SCREEN.JPG)
  // ============================================================================
  if (subView === "list") {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 pb-12">
        {/* Search Bar & Tombol + Buat Topik Baru */}
        <div className="flex items-center gap-2.5">
          <div className="flex-1 relative flex items-center bg-white rounded-xl border border-[#E2E8F0] px-3.5 h-12">
            <FlatIcon
              name="search"
              className="w-4 h-4 text-[#64748B] shrink-0 mr-2.5"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik naskah, percakapan bot..."
              className="w-full bg-transparent text-base sm:text-sm text-[#14141F] placeholder:text-[#64748B] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="cursor-pointer text-xs font-bold text-[#64748B] px-1.5"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleBuatTopikBaru}
            title="Buat Sesi Topik Baru"
            className="cursor-pointer w-12 h-12 rounded-xl bg-[#D4F34A] hover:bg-[#C5E738] text-[#14141F] flex items-center justify-center shrink-0 active:scale-95 transition"
          >
            <FlatIcon name="plus" className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Pills Akun Sosial Media */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterAkunPill("ALL")}
            className={`cursor-pointer shrink-0 h-10 px-4 rounded-full text-xs font-bold flex items-center gap-2 transition ${
              filterAkunPill === "ALL"
                ? "bg-[#14141F] text-white"
                : "bg-white text-[#14141F] border border-[#E2E8F0]"
            }`}
          >
            <span>Semua Akun</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filterAkunPill === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-[#F4F5F7] text-[#14141F]"
              }`}
            >
              {daftarSesiTopik.length}
            </span>
          </button>

          {semuaAkunUnik.map((akLabel, idx) => {
            const jmlSesiAkun = daftarSesiTopik.filter(
              (s) => s.akunLabel === akLabel,
            ).length
            const aktif = filterAkunPill === akLabel
            const terkunci = idx >= kuotaAkunMaksimal

            return (
              <button
                key={akLabel}
                type="button"
                onClick={() => {
                  if (terkunci) {
                    showToast("Upgrade paket untuk membuka filter akun ini.")
                    setActiveMenu("topup")
                    return
                  }
                  setFilterAkunPill(akLabel)
                }}
                className={`cursor-pointer shrink-0 h-10 px-4 rounded-full text-xs font-bold flex items-center gap-2 border transition ${
                  aktif
                    ? "bg-[#14141F] text-[#D4F34A] border-[#14141F]"
                    : "bg-white text-[#14141F] border-[#E2E8F0]"
                }`}
              >
                <span>{akLabel}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#F4F5F7] text-[#14141F] text-[10px]">
                  {jmlSesiAkun}
                </span>
              </button>
            )
          })}
        </div>

        {/* Kartu Ringkas Gudang Ingatan Otak AI */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3.5 space-y-2">
          <button
            type="button"
            onClick={() => setShowMemoryDetail(!showMemoryDetail)}
            className="cursor-pointer w-full flex items-center justify-between gap-2 text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#14141F] text-[#D4F34A] flex items-center justify-center shrink-0">
                <FlatIcon name="brain" className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#14141F] block">
                  Gudang Ingatan Otak AI ({(memoryVault.samples || []).length}{" "}
                  Rekaman Dipelajari)
                </span>
                <p className="text-[11px] text-[#64748B] truncate">
                  {memoryVault.reviewSingkat}
                </p>
              </div>
            </div>
            <FlatIcon
              name="chevronDown"
              className={`w-4 h-4 text-[#64748B] transition-transform ${
                showMemoryDetail ? "rotate-180" : ""
              }`}
            />
          </button>

          {showMemoryDetail && (
            <div className="pt-2 border-t border-[#E2E8F0] text-xs text-[#14141F] space-y-1.5">
              <p className="text-[#64748B]">{memoryVault.reviewSingkat}</p>
              {memoryVault.rincianAnalisa && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#F4F5F7]">
                    <strong className="block">Gaya Bahasa Terdeteksi:</strong>
                    <span>
                      {memoryVault.rincianAnalisa.gayaBahasaTerdeteksi || "-"}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#F4F5F7]">
                    <strong className="block">Pola Kalimat:</strong>
                    <span>{memoryVault.rincianAnalisa.polaKalimat || "-"}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Daftar Baris Sesi Topik (Sesuai screen.jpg) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] overflow-hidden">
          {daftarSesiTerfilter.map((sesi, idx) => {
            const sedangBukaAksi = openSwipeId === sesi.id
            const isSiapRekam = sesi.statusLabel === "Siap Rekam"
            const isSudahUpload = sesi.statusLabel === "Sudah Diupload"

            return (
              <div
                key={sesi.id}
                className="relative flex items-stretch justify-between transition hover:bg-[#F4F5F7]/60"
              >
                <div
                  onClick={() => {
                    setActiveSessionId(sesi.id)
                    setSubView("chat")
                  }}
                  className="cursor-pointer flex-1 p-4 space-y-2 min-w-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-[#14141F] leading-snug line-clamp-2">
                      {sesi.judul}
                    </h3>
                    <span className="text-[11px] text-[#64748B] shrink-0">
                      {sesi.waktuTerakhir}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-[#F4F5F7] text-[#14141F] font-semibold border border-[#E2E8F0]">
                      {sesi.format}
                    </span>
                    <span className="text-[#64748B]">
                      Sesi Bot #{sesi.nomorSesi || daftarSesiTopik.length - idx}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#F4F5F7] text-[#14141F] text-[11px] font-semibold">
                        {sesi.akunLabel}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isSudahUpload
                            ? "bg-[#E6F9F0] text-[#059669]"
                            : isSiapRekam
                              ? "bg-[#D4F34A] text-[#14141F]"
                              : "bg-[#FFF4E5] text-[#B45309]"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{sesi.statusLabel || "Draf Belum Diupload"}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#64748B] font-medium flex items-center gap-1">
                        <FlatIcon name="bot" className="w-3.5 h-3.5" />
                        <span>{sesi.statusTahap || "Sedang diskusi"}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenSwipeId(sedangBukaAksi ? null : sesi.id)
                        }}
                        className="cursor-pointer px-2 py-1 rounded bg-[#F4F5F7] hover:bg-[#E2E8F0] text-xs font-bold text-[#14141F]"
                      >
                        •••
                      </button>
                    </div>
                  </div>
                </div>

                {/* Panel Aksi Arsip & Hapus (Sesuai screen.jpg) */}
                {sedangBukaAksi && (
                  <div className="flex items-stretch shrink-0 border-l border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = daftarSesiTopik.map((x) =>
                          x.id === sesi.id
                            ? {
                                ...x,
                                statusTahap: "Arsip",
                                statusLabel: "Siap Rekam",
                              }
                            : x,
                        )
                        simpanDaftarSesiKeLokal(updated)
                        setOpenSwipeId(null)
                        showToast("Sesi topik ditandai ke Arsip.")
                      }}
                      className="cursor-pointer w-16 bg-[#F3F4F6] hover:bg-[#E2E8F0] text-[#14141F] flex flex-col items-center justify-center gap-1 text-[11px] font-bold"
                    >
                      <FlatIcon name="folder" className="w-4 h-4" />
                      <span>Arsip</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHapusSesiTopik(sesi.id)}
                      className="cursor-pointer w-16 bg-[#FFECEC] hover:bg-[#FFD8D8] text-[#BA1A1A] flex flex-col items-center justify-center gap-1 text-[11px] font-bold"
                    >
                      <FlatIcon name="trash" className="w-4 h-4" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Banner Bawah Mulai Diskusi Topik Baru (Sesuai screen.jpg) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#D4F34A] text-[#14141F] flex items-center justify-center shrink-0">
              <FlatIcon name="bot" className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#14141F] truncate">
                Mulai Diskusi Topik Baru
              </div>
              <p className="text-xs text-[#64748B] truncate">
                Rancang naskah otomatis dengan Formula 6 Langkah
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBuatTopikBaru}
            className="cursor-pointer h-11 px-4 rounded-xl bg-[#14141F] text-white text-xs font-bold shrink-0 flex items-center gap-1.5"
          >
            <FlatIcon name="plus" className="w-4 h-4 text-[#D4F34A]" />
            <span>Buat Topik AI</span>
          </button>
        </div>
      </div>
    )
  }

  // ============================================================================
  // TAMPILAN 2: RUANG CHAT "AI SCRIPT SESSION" (SESUAI 2_2.PNG)
  // ============================================================================
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 pb-12">
      {/* Sub-Header Bar Sesi Chat: Tombol Daftar Topik, Pemilih Akun, & Nomor Sesi */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubView("list")}
            title="Lihat Semua Daftar Sesi Topik"
            className="cursor-pointer h-9 px-3 rounded-lg bg-[#F4F5F7] hover:bg-[#E2E8F0] text-[#14141F] text-xs font-bold flex items-center gap-1.5"
          >
            <FlatIcon name="arrowLeft" className="w-4 h-4" />
            <span>Daftar Topik ({daftarSesiTopik.length})</span>
          </button>

          {/* Dropdown Akun Aktif (@cuanistsociety) */}
          <div className="relative">
            <select
              value={sesiAktif.akunLabel || akunDefaultLabel}
              onChange={(e) => updateSesiAktif({ akunLabel: e.target.value })}
              className="h-9 pl-3 pr-7 rounded-full bg-[#F4F5F7] border border-[#E2E8F0] text-xs font-bold text-[#14141F] appearance-none cursor-pointer focus:outline-none"
            >
              {semuaAkunUnik.slice(0, kuotaAkunMaksimal).map((ak) => (
                <option key={ak} value={ak}>
                  {ak}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#14141F]">
              <FlatIcon name="chevronDown" className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F5F7] text-xs font-bold text-[#14141F]">
            <span className="w-2 h-2 rounded-full bg-[#D4F34A]" />
            <span>
              Sesi #{sesiAktif.nomorSesi || 1}: {sesiAktif.statusLabel}
            </span>
          </span>

          <button
            type="button"
            onClick={handleBuatTopikBaru}
            title="Topik Baru"
            className="cursor-pointer h-9 px-2.5 rounded-lg bg-[#14141F] text-[#D4F34A] text-xs font-bold flex items-center gap-1"
          >
            <FlatIcon name="plus" className="w-4 h-4" />
            <span className="hidden sm:inline">Topik Baru</span>
          </button>
        </div>
      </div>

      {/* Kartu Banner Atas: MODE KILAT AI - Peracik Hook 3 Detik (Sesuai 2_2.png) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <span className="inline-block px-2 py-0.5 rounded bg-[#14141F] text-[#D4F34A] text-[10px] font-extrabold uppercase tracking-wider">
            MODE KILAT AI
          </span>
          <h2 className="text-lg font-bold text-[#14141F] leading-tight">
            Peracik Hook 3 Detik & Alur 6 Langkah
          </h2>
          <p className="text-xs text-[#64748B]">
            Algoritma retensi aktif untuk TikTok, IG Reels, Carousel & Threads
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#F4F5F7] border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#14141F]">
          <FlatIcon name="bolt" className="w-6 h-6" />
        </div>
      </div>

      {/* Aliran Gelembung Percakapan Sesi Ini */}
      <div className="space-y-4">
        {(sesiAktif.messages || []).map((msg, mIdx) => {
          if (msg.role === "user") {
            return (
              <div
                key={msg.id || mIdx}
                className="flex items-start justify-end gap-2.5"
              >
                <div className="max-w-[85%] bg-[#14141F] text-white rounded-2xl p-4 space-y-2">
                  {Array.isArray(msg.images) && msg.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap pb-1">
                      {msg.images.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt="Upload User"
                          className="w-24 h-24 rounded-lg object-cover border border-white/20"
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {msg.teks}
                  </p>
                  <div className="text-right text-[10px] text-white/60">
                    {msg.waktu}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#14141F] text-white flex items-center justify-center shrink-0 mt-1">
                  <FlatIcon name="user" className="w-4 h-4" />
                </div>
              </div>
            )
          }

          const hasHookOptions =
            Array.isArray(msg.hookOptions) && msg.hookOptions.length > 0
          const hasPainPoints =
            Array.isArray(msg.painPoints10) && msg.painPoints10.length > 0
          const hasSevenAngles =
            Array.isArray(msg.sevenAngles) && msg.sevenAngles.length > 0
          const hasMediaChoices =
            Array.isArray(msg.opsiTujuanMedia) && msg.opsiTujuanMedia.length > 0
          const skrip6 = msg.naskah6Langkah

          return (
            <div
              key={msg.id || mIdx}
              className="flex items-start justify-start gap-2.5"
            >
              <div className="w-8 h-8 rounded-full bg-[#14141F] text-[#D4F34A] flex items-center justify-center shrink-0 mt-1">
                <FlatIcon name="bolt" className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3.5">
                  {/* Baris Label Strategi & Status Analisis */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded bg-[#14141F] text-[#D4F34A] text-[11px] font-bold">
                      {msg.badgeStrategi || "Strategi Retensi 60s"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#14141F]">
                      <span className="w-4 h-4 rounded-full bg-[#14141F] text-[#D4F34A] flex items-center justify-center">
                        <FlatIcon name="check" className="w-2.5 h-2.5" />
                      </span>
                      <span>Analisis tuntas</span>
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#14141F] leading-relaxed whitespace-pre-line">
                    {msg.balasanBot}
                  </p>

                  {msg.pertanyaanTindakLanjut && (
                    <div className="p-3 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] text-xs font-semibold text-[#14141F]">
                      {msg.pertanyaanTindakLanjut}
                    </div>
                  )}

                  {/* Pilihan Tujuan Konten saat User Upload Gambar/Video */}
                  {hasMediaChoices && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#64748B] uppercase block">
                        Pilih Arah Konten dari Media Ini:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {msg.opsiTujuanMedia.map((opsi, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              handleKirimPesanKeBot({
                                teksOverride: `Saya pilih arah: ${opsi}`,
                                tujuanOverride: opsi,
                              })
                            }
                            className="cursor-pointer px-3 py-2 rounded-lg bg-[#F4F5F7] hover:bg-[#D4F34A] text-[#14141F] text-xs font-bold border border-[#E2E8F0] transition"
                          >
                            {opsi}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Daftar 10 Masalah Spesifik Audiens (Klik untuk Approve) */}
                  {hasPainPoints && (
                    <div className="bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#14141F]">
                          10 Masalah Nyata Audiens (Klik yang Ingin Diangkat):
                        </span>
                        <span className="text-[10px] font-bold text-[#64748B]">
                          Approve 1 Masalah
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1">
                        {msg.painPoints10.map((pp, pIdx) => {
                          const terpilih = sesiAktif.masalahTerpilih === pp
                          return (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => {
                                updateSesiAktif({ masalahTerpilih: pp })
                                showToast("Masalah audiens dikunci.")
                              }}
                              className={`cursor-pointer p-2.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 border transition ${
                                terpilih
                                  ? "bg-[#14141F] text-[#D4F34A] border-[#14141F] font-bold"
                                  : "bg-white text-[#14141F] border-[#E2E8F0] hover:border-[#14141F]"
                              }`}
                            >
                              <span>{pp}</span>
                              {terpilih && (
                                <FlatIcon
                                  name="check"
                                  className="w-3.5 h-3.5 shrink-0"
                                />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Daftar 7 Angle Berbeda untuk 1 Produk */}
                  {hasSevenAngles && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#14141F] block">
                        Pilih 1 dari 7 Angle Produk Agar Konversi Fokus:
                      </span>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {(msg.sevenAngles.length > 0
                          ? msg.sevenAngles
                          : TUJUH_ANGLE_PRODUK
                        ).map((ang, aIdx) => {
                          const labelAng = ang.label || ang.judul
                          const ketAng = ang.ide || ang.ket
                          const aktif = sesiAktif.angleTerpilih === labelAng
                          return (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() => {
                                updateSesiAktif({ angleTerpilih: labelAng })
                                showToast(`Angle dipilih: ${labelAng}`)
                              }}
                              className={`cursor-pointer shrink-0 w-56 p-3 rounded-xl border text-left transition ${
                                aktif
                                  ? "bg-[#14141F] text-white border-[#14141F]"
                                  : "bg-[#F4F5F7] text-[#14141F] border-[#E2E8F0] hover:border-[#14141F]"
                              }`}
                            >
                              <div
                                className={`text-xs font-bold ${
                                  aktif ? "text-[#D4F34A]" : "text-[#14141F]"
                                }`}
                              >
                                {labelAng}
                              </div>
                              <p
                                className={`text-[11px] mt-1 line-clamp-2 ${
                                  aktif ? "text-white/80" : "text-[#64748B]"
                                }`}
                              >
                                {ketAng}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Kartu Opsi Hook 1, 2, 3 & Tombol Generate Script Penuh (Sesuai 2_2.png) */}
                  {hasHookOptions && (
                    <div className="space-y-3 pt-1">
                      {msg.hookOptions.map((hk, hIdx) => (
                        <div
                          key={hIdx}
                          className="bg-[#F4F5F7] rounded-xl p-3.5 border border-[#E2E8F0] space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#14141F] text-white text-[11px] font-bold flex items-center justify-center">
                                {hk.nomor || hIdx + 1}
                              </span>
                              <span className="text-xs font-extrabold text-[#14141F] uppercase">
                                {hk.kategori}
                              </span>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                hIdx === 0
                                  ? "bg-[#D4F34A] text-[#14141F]"
                                  : "bg-[#E2E8F0] text-[#14141F]"
                              }`}
                            >
                              {hk.badgeMetrik || "Retensi Tinggi"}
                            </span>
                          </div>

                          <p className="text-sm sm:text-base font-bold italic text-[#14141F] leading-snug">
                            &ldquo;{hk.teksHook}&rdquo;
                          </p>

                          {hk.tipeVisual && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                              <FlatIcon name="eye" className="w-3.5 h-3.5" />
                              <span>Tipe Visual: {hk.tipeVisual}</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Tombol Eksekusi Pilihan Hook Sesuai 2_2.png */}
                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          disabled={isGeneratingScript}
                          onClick={() =>
                            handleGenerateNaskah6Langkah(msg.hookOptions[0])
                          }
                          className="cursor-pointer w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#D4F34A] hover:bg-[#C5E738] text-[#14141F] font-bold text-xs sm:text-sm flex items-center justify-between gap-2 transition active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-2">
                            <FlatIcon name="bolt" className="w-4 h-4" />
                            <span>Pilih Opsi 1 & Generate Script Penuh</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-[#14141F]/10 text-[#14141F] text-[11px] font-extrabold">
                            1 Koin
                          </span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          {msg.hookOptions[1] && (
                            <button
                              type="button"
                              disabled={isGeneratingScript}
                              onClick={() =>
                                handleGenerateNaskah6Langkah(msg.hookOptions[1])
                              }
                              className="cursor-pointer min-h-[44px] px-3 py-2 rounded-xl bg-[#F4F5F7] hover:bg-[#E2E8F0] text-[#14141F] text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                              <FlatIcon name="check" className="w-3.5 h-3.5" />
                              <span>Pilih Opsi 2 (1 Koin)</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isSendingChat}
                            onClick={() =>
                              handleKirimPesanKeBot({
                                teksOverride:
                                  "Buatkan 3 variasi Hook lain dengan pola pembuka berbeda (sebutkan akibat masalah & hindari clickbait).",
                              })
                            }
                            className="cursor-pointer min-h-[44px] px-3 py-2 rounded-xl bg-[#F4F5F7] hover:bg-[#E2E8F0] text-[#14141F] text-xs font-bold flex items-center justify-center gap-1.5"
                          >
                            <FlatIcon name="refresh" className="w-3.5 h-3.5" />
                            <span>Minta 3 Variasi Lain</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tampilan Hasil Naskah 6 Langkah + Kata Kunci Review + 3 Variasi CTA */}
                  {skrip6 && (
                    <div className="bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] p-3.5 space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#64748B] block">
                            Naskah Formula 6 Langkah Siap Pakai
                          </span>
                          <h4 className="text-sm font-bold text-[#14141F]">
                            {skrip6.judul}
                          </h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-[#D4F34A] text-[#14141F] text-[11px] font-bold">
                          6 Langkah Utuh
                        </span>
                      </div>

                      {/* Tag Kata Kunci Review yang Disisipkan */}
                      {Array.isArray(skrip6.kataKunciReviewTerpakai) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-[#64748B]">
                            Kata Kunci Review:
                          </span>
                          {skrip6.kataKunciReviewTerpakai.map((kw, kIdx) => (
                            <span
                              key={kIdx}
                              className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[10px] font-bold text-[#14141F]"
                            >
                              #{kw}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        {(skrip6.sections || []).map((sec, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-white p-3 rounded-lg border border-[#E2E8F0] space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-[#14141F]">
                                Langkah {sec.partNumber || sIdx + 1} •{" "}
                                {sec.partTitle}
                              </span>
                              <span className="text-[#556500]">
                                {sec.estimatedSeconds}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-[#14141F] leading-relaxed whitespace-pre-line">
                              {sec.spokenText || sec.voiceover}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Pemilih 3 Variasi CTA Berbeda Motivasi */}
                      {skrip6.ctaVariations && (
                        <div className="bg-white rounded-lg p-3 border border-[#E2E8F0] space-y-2">
                          <span className="text-[11px] font-bold text-[#14141F] block">
                            3 Variasi CTA Satu Arah (Pilih Sesuai Motivasi
                            Audiens):
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              {
                                key: "keputusanCepat",
                                label: "Keputusan Cepat",
                              },
                              { key: "masihRagu", label: "Masih Ragu" },
                              { key: "pemburuHasil", label: "Pemburu Hasil" },
                            ].map((tab) => {
                              const aktifTab =
                                (activeCtaTabMap[msg.id] ||
                                  "keputusanCepat") === tab.key
                              return (
                                <button
                                  key={tab.key}
                                  type="button"
                                  onClick={() =>
                                    setActiveCtaTabMap((p) => ({
                                      ...p,
                                      [msg.id]: tab.key,
                                    }))
                                  }
                                  className={`cursor-pointer py-1.5 px-2 rounded text-[11px] font-bold transition ${
                                    aktifTab
                                      ? "bg-[#14141F] text-[#D4F34A]"
                                      : "bg-[#F4F5F7] text-[#64748B]"
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              )
                            })}
                          </div>
                          <p className="text-xs text-[#14141F] font-semibold bg-[#F4F5F7] p-2.5 rounded">
                            &ldquo;
                            {skrip6.ctaVariations[
                              activeCtaTabMap[msg.id] || "keputusanCepat"
                            ] || skrip6.ctaVariations.keputusanCepat}
                            &rdquo;
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setHasilSkrip(skrip6)
                            setStage(5)
                            setActiveMenu("produksi")
                          }}
                          className="cursor-pointer flex-1 min-h-[42px] px-3 py-2 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <FlatIcon name="tv" className="w-4 h-4" />
                          <span>Buka Editor & Teleprompter</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveMenu("kalender")}
                          className="cursor-pointer min-h-[42px] px-3 py-2 rounded-lg bg-[#14141F] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <FlatIcon name="calendar" className="w-4 h-4" />
                          <span>Jadwalkan (4 Jendela Waktu)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-[#64748B] flex items-center justify-between pt-1">
                    <span>
                      Baru saja • Hookya Engine (
                      {(msg.modelUsed || preferredModel).split("/").pop()})
                    </span>
                    <span>{msg.waktu}</span>
                  </div>
                </div>

                {/* Quick Starter Chips pada Pesan Pembuka (Sesuai 2_2.png) */}
                {mIdx === 0 && (sesiAktif.messages || []).length === 1 && (
                  <div className="flex flex-col items-start gap-2">
                    {CHIP_PEMBUKA_CEPAT.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() =>
                          handleKirimPesanKeBot({ teksOverride: chip })
                        }
                        className="cursor-pointer px-3.5 py-2 rounded-full bg-white hover:bg-[#D4F34A] text-[#14141F] text-xs font-semibold border border-[#E2E8F0] transition"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {(isSendingChat || isGeneratingScript) && (
          <AILoadingBox
            label={
              isGeneratingScript
                ? "Menyusun Naskah Formula 6 Langkah + Kata Kunci Review + 3 Variasi CTA..."
                : "Menganalisis audiens, memetakan 10 masalah & meracik opsi Hook 3 detik..."
            }
          />
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Panel Kontrol Bawah: Target Durasi, Format, Tone & Kotak Input Chat (Sesuai 2_2.png) */}
      <div className="space-y-2.5 pt-2">
        {/* Bar Target Durasi & Pacing */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F4F5F7] flex items-center justify-center text-[#14141F]">
              <FlatIcon name="clock" className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#14141F]">
                Target Durasi & Pacing Formula 6 Langkah
              </div>
              <div className="text-[11px] text-[#64748B]">
                Estimasi 130-150 kata • Alur Hook ke Masalah, Curiosity, Solusi,
                Proof & CTA
              </div>
            </div>
          </div>
          <span className="text-xs font-extrabold text-[#14141F] shrink-0">
            {sesiAktif.format.split(" ")[0]}
          </span>
        </div>

        {/* Pemilih Format & Tone (Sesuai 2_2.png) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="relative shrink-0">
            <select
              value={sesiAktif.format}
              onChange={(e) => updateSesiAktif({ format: e.target.value })}
              className="h-10 pl-3.5 pr-8 rounded-full bg-white border border-[#E2E8F0] text-xs font-bold text-[#14141F] appearance-none cursor-pointer focus:outline-none"
            >
              {DAFTAR_FORMAT_SESI.map((fmt) => (
                <option key={fmt} value={fmt}>
                  Format: {fmt}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#14141F]">
              <FlatIcon name="chevronDown" className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="relative shrink-0">
            <select
              value={sesiAktif.tone}
              onChange={(e) => updateSesiAktif({ tone: e.target.value })}
              className="h-10 pl-3.5 pr-8 rounded-full bg-white border border-[#E2E8F0] text-xs font-bold text-[#14141F] appearance-none cursor-pointer focus:outline-none"
            >
              {DAFTAR_TONE_SESI.map((tn) => (
                <option key={tn} value={tn}>
                  Tone: {tn}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#14141F]">
              <FlatIcon name="chevronDown" className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Pratinjau Gambar / Screenshot Review Bintang 1-3 yang Akan Dikirim */}
        {lampiranGambar.length > 0 && (
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-[#E2E8F0]">
            {lampiranGambar.map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={img.previewUrl}
                  alt="Lampiran"
                  className="w-14 h-14 rounded-lg object-cover border border-[#E2E8F0]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setLampiranGambar((prev) =>
                      prev.filter((_, idx) => idx !== i),
                    )
                  }
                  className="cursor-pointer absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#14141F] text-white text-[10px] font-bold flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
            <span className="text-xs font-semibold text-[#64748B]">
              Siap dianalisis (Foto Produk / Screenshot Review Bintang 1-3)
            </span>
          </div>
        )}

        {/* Bar Input Chat Utama: Tombol + Upload Media, Input Teks, Mic, & Tombol Kirim Lime (Sesuai 2_2.png) */}
        <div className="flex items-center gap-2">
          <label
            title="Upload Foto Produk atau Screenshot Review Bintang 1-3"
            className="cursor-pointer w-12 h-12 rounded-xl bg-white hover:bg-[#F4F5F7] border border-[#E2E8F0] text-[#14141F] flex items-center justify-center shrink-0 transition"
          >
            <FlatIcon name="plusCircle" className="w-5 h-5" />
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePilihGambarUpload}
              className="hidden"
            />
          </label>

          <div className="flex-1 flex items-center bg-white rounded-xl border border-[#E2E8F0] focus-within:border-[#14141F] px-3.5 h-12">
            <input
              type="text"
              value={pesanInput}
              onChange={(e) => setPesanInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleKirimPesanKeBot()
                }
              }}
              placeholder="Tulis ide skrip, produk, atau upload review bintang 1-3..."
              className="w-full bg-transparent text-base sm:text-sm text-[#14141F] placeholder:text-[#64748B] focus:outline-none"
            />

            <button
              type="button"
              onClick={handleToggleMicInput}
              title="Ketik dengan Suara"
              className={`cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
                isListeningMic
                  ? "bg-[#EF4444] text-white animate-pulse"
                  : "text-[#14141F] hover:bg-[#F4F5F7]"
              }`}
            >
              <FlatIcon name="mic" className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={isSendingChat}
            onClick={() => handleKirimPesanKeBot()}
            aria-label="Kirim Pesan"
            className="cursor-pointer w-12 h-12 rounded-xl bg-[#D4F34A] hover:bg-[#C5E738] text-[#14141F] flex items-center justify-center shrink-0 active:scale-95 transition disabled:opacity-50"
          >
            <FlatIcon name="arrowUp" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
