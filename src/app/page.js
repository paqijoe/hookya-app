"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"
import {
  FlatIcon,
  AvatarCropModal,
  EMPAT_JENDELA_WAKTU,
  ekstrakHargaDariNamaPaket,
  hitungKuotaAkunDariPaket,
  hitungUkuranBytesObjek,
  formatUkuranStorage,
  rekamKetikanKeGudangIngatan,
} from "../components/SharedUI"
import AuthFullscreen from "../components/AuthFullscreen"
import PersonaDNAView from "../components/PersonaDNAView"
import ScriptProducerView from "../components/ScriptProducerView"
import VideoExtractorView from "../components/VideoExtractorView"
import BrainstormView from "../components/BrainstormView"
import NicheProfilingView from "../components/NicheProfilingView"
import DeveloperDashboardView from "../components/DeveloperDashboardView"

const SEPULUH_BENTUK_KONTEN = [
  {
    id: 1,
    nama: "Talking Head Video Pendek (Reels/TikTok)",
    modeDefault: "voiceover",
    ket: "Bicara langsung ke kamera sambil membaca tampilan teks Hookya.",
  },
  {
    id: 2,
    nama: "Carousel Slide Edukasi (Instagram)",
    modeDefault: "teks",
    ket: "Susun 5 sampai 7 slide berurutan dengan poin penjelasan padat.",
  },
  {
    id: 3,
    nama: "Screenshot Thread (Threads / X)",
    modeDefault: "teks",
    ket: "Format utas 6 langkah yang memandu perhatian dari Hook ke CTA.",
  },
  {
    id: 4,
    nama: "B-Roll Aktivitas + Voiceover Santai",
    modeDefault: "voiceover",
    ket: "Rekam kegiatan harianmu dulu, lalu isi suara naskah dari balik layar.",
  },
  {
    id: 5,
    nama: "POV Tangan / Meja + Suara Voiceover",
    modeDefault: "voiceover",
    ket: "Kamera menyorot produk atau meja kerja tanpa menampilkan wajah.",
  },
  {
    id: 6,
    nama: "Green Screen Review & Bedah Fakta",
    modeDefault: "voiceover",
    ket: "Tampilkan tangkapan layar ulasan atau produk di belakangmu.",
  },
  {
    id: 7,
    nama: "Vlog Mini Behind The Scene (Bangun Trust)",
    modeDefault: "voiceover",
    ket: "Gabungan klip pendek kegiatan harian dengan narasi cerita.",
  },
  {
    id: 8,
    nama: "Tutorial Layar HP / Laptop (Screen Recording)",
    modeDefault: "voiceover",
    ket: "Rekam layar saat menunjukkan langkah penggunaan aplikasi atau produk.",
  },
  {
    id: 9,
    nama: "Sketsa POV Situasi Sehari-hari",
    modeDefault: "teks",
    ket: "Peragakan situasi singkat dengan teks kejadian yang relate.",
  },
  {
    id: 10,
    nama: "Materi Speech, Kultum, & Orasi Panggung",
    modeDefault: "voiceover",
    ket: "Naskah berbicara di depan umum dengan retorika yang menyentuh audiens.",
  },
]

const DEFAULT_PERSONA_PROFILE = {
  user_id: "usr_99281",
  account_label: "@cuanistsociety",
  dna_badge: "DNA: Casual Storyteller | Direct Tone | Level 4 Trust",
  niche_badge: "Niche: Bisnis Digital & Edukasi | Target: Gen-Z & Millennial",
  persona_summary:
    "Gaya bicara jujur, santai, dan langsung membahas praktik nyata sehari-hari.",
  positioning_and_usp: {
    authority_role: "Praktisi & Kreator",
    unique_selling_point: "Berbagi praktik nyata di lapangan",
    common_enemy: "Gimmick motivasi tanpa langkah eksekusi nyata",
    personal_analogies: "Kegiatan sehari-hari, kerjaan, dan hobi",
  },
  target_audience: {
    segment_profile: "Anak muda & pekerja produktif",
    deepest_pain_points: "Bingung ide konten & sulit konsisten",
    secret_desires: "Hasil praktis yang terukur",
    common_objections: "Bingung mulai dari mana",
  },
  linguistic_matrix: {
    self_pronoun: "Gue",
    audience_pronoun: "Temen-temen",
    signature_vocabulary: ["sih", "tuh", "kan", "deh"],
  },
}

const DAFTAR_PAKET_KOIN = [
  {
    tier: "STARTER",
    nama: "Paket 5K",
    subjudul: "Cocok untuk coba fitur dasar naskah AI",
    harga: "Rp 5.000",
    nominalAngka: 5000,
    koin: 10,
    kuotaAkun: 1,
    isVIP: false,
    fiturList: ["Generator naskah & hook", "Rollover aktif 30 hari"],
  },
  {
    tier: "REGULER",
    nama: "Paket 10K",
    subjudul: "Pilihan hemat kreator pemula",
    harga: "Rp 10.000",
    nominalAngka: 10000,
    koin: 20,
    kuotaAkun: 2,
    isVIP: false,
    fiturList: ["Multi-angle hook generator", "Rollover aktif 30 hari"],
  },
  {
    tier: "PLUS",
    nama: "Paket 15K",
    subjudul: "Variasi naskah lebih leluasa",
    harga: "Rp 15.000",
    nominalAngka: 15000,
    koin: 30,
    kuotaAkun: 2,
    isVIP: false,
    fiturList: ["Multi-angle hook generator", "Rollover aktif 30 hari"],
  },
  {
    tier: "VIP",
    nama: "Paket 20K VIP",
    subjudul: "Pilihan favorit kreator aktif harian",
    harga: "Rp 20.000",
    nominalAngka: 20000,
    koin: 40,
    kuotaAkun: 2,
    isVIP: true,
    populer: true,
    fiturList: [
      "Prioritas antrian AI engine",
      "Semua fitur ekstrak & skrip",
      "Rollover aktif 30 hari",
    ],
  },
  {
    tier: "VIP TIER 1",
    nama: "Paket 25K VIP",
    subjudul: "Membuka Analisa Niche (Ikigai) + 3 Akun Sosmed",
    harga: "Rp 25.000",
    nominalAngka: 25000,
    koin: 55,
    kuotaAkun: 3,
    isVIP: true,
    fiturList: [
      "Buka fitur Analisa Niche (Ikigai) & 24 Ide Topik",
      "Semua fitur ekstrak & skrip",
      "Rollover aktif 30 hari",
    ],
  },
  {
    tier: "PRO",
    nama: "Paket 50K VIP",
    subjudul: "Produksi konten rutin skala penuh + Analisa Niche",
    harga: "Rp 50.000",
    nominalAngka: 50000,
    koin: 120,
    kuotaAkun: 5,
    isVIP: true,
    bestValue: true,
    fiturList: [
      "Buka fitur Analisa Niche (Ikigai) & 24 Ide Topik",
      "Semua fitur ekstrak & skrip",
      "Rollover aktif 30 hari",
    ],
  },
  {
    tier: "AGENSI / STUDIO",
    nama: "Paket 90K VIP",
    subjudul:
      "Ideal untuk content agency, social media manager, dan batch content creation multi-client.",
    harga: "Rp 90.000",
    nominalAngka: 90000,
    koin: 230,
    kuotaAkun: 10,
    isVIP: true,
    agency: true,
    fiturList: [
      "Akses penuh Analisa Niche (Ikigai) & Dual AI",
      "Maksimal 10 akun persona sosmed",
      "Rollover aktif 30 hari",
    ],
  },
]

const NAMA_BULAN_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
]

const NAMA_HARI_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
]

function hitungSisaHariAktif(expiredAtStr) {
  if (!expiredAtStr) return 30
  const selisih = Math.ceil(
    (new Date(expiredAtStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  return Math.max(0, selisih)
}

export default function HookyaMainApp() {
  const [viewMode, setViewMode] = useState("auth")
  const [activeMenu, setActiveMenuState] = useState("chat")
  const [isInsideChatRoom, setIsInsideChatRoomState] = useState(false)
  const [stage, setStageState] = useState(0)
  const [subTabKalender, setSubTabKalender] = useState("jadwal")
  // Sub-tab di dalam menu "Niche": "ikigai" (Analisa Niche Utama) | "produksi" (Asesmen & Editor Naskah) | "ekstrak" (Ekstrak Video)
  const [subTabNiche, setSubTabNiche] = useState("ikigai")
  const [modeTeleprompter, setModeTeleprompter] = useState(false)

  const [selectedPersonaHeader, setSelectedPersonaHeader] = useState("")
  const [prefillTopicFromNiche, setPrefillTopicFromNiche] = useState(null)

  const [showUpgradeVIPModal, setShowUpgradeVIPModal] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [inputPinDev, setInputPinDev] = useState("")
  const [pinAdminResmi, setPinAdminResmi] = useState("123456")

  const [targetHapusSkrip, setTargetHapusSkrip] = useState(null)
  const [sedangMenghapusSkrip, setSedangMenghapusSkrip] = useState(false)
  const [showCleanerInSetting, setShowCleanerInSetting] = useState(false)

  const [userId, setUserId] = useState(null)
  const [userRole, setUserRole] = useState("user")
  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const [expiredAt, setExpiredAt] = useState(null)
  const [sisaHariPaket, setSisaHariPaket] = useState(28)
  const [namaPaketAktif, setNamaPaketAktif] = useState("Paket 25K VIP")
  const [nominalPaketAktif, setNominalPaketAktif] = useState(25000)
  const [kuotaAkunMaksimal, setKuotaAkunMaksimal] = useState(3)
  const [coins, setCoins] = useState(20)
  const [toastMsg, setToastMsg] = useState("")
  const [rawCropImageSrc, setRawCropImageSrc] = useState(null)

  const [profil, setProfil] = useState({
    nama: "Reza Pratama",
    username: "reza.content",
    kontak: "reza.pratama@gmail.com",
    whatsapp: "+62 812-3456-7890",
    avatar_url: "",
    usia: "27",
    gender: "Laki-laki",
    peranSaatIni: "Praktisi yang berbagi kegagalan & validasi lapangan",
    uspDiriInput: "5 tahun pengalaman praktik langsung di lapangan",
    analogiKhasInput: "Seperti bumbu masak cepat saji vs masakan rumahan",
    targetSegmenInput: "Solopreneur & Content Creator pemula",
    targetKetakutanInput: "Bingung ide konten & sulit konsisten",
    targetImpianInput: "Hasil nyata yang praktis dan terukur",
    targetKeraguanInput: "Takut gagal di tengah jalan",
    kepribadianSosial: "To-the-point, Tajam, Santai",
    minatUtama: "Bisnis Digital & Edukasi Finansial",
    selfPronounInput: "Gue",
    audiencePronounInput: "Temen-temen",
    opiniKontraInput: "Gimmick motivasi tanpa langkah eksekusi nyata",
    idAkunAktif: "akun_utama",
    labelAkunSosmed: "@cuanistsociety",
    daftarAkunTernak: [],
    active_niche_profile: null,
    telemetry: { recentLogs: [], globalBrainPairs: [] },
  })

  const [rawWritingSamples, setRawWritingSamples] = useState("")
  const [personaProfile, setPersonaProfile] = useState(DEFAULT_PERSONA_PROFILE)
  const [bentukKonten, setBentukKonten] = useState(
    SEPULUH_BENTUK_KONTEN[0].nama,
  )
  const [daftar10IdeTopik, setDaftar10IdeTopik] = useState([])
  const [hasilSkrip, setHasilSkrip] = useState(null)
  const [modeTampilanSkrip, setModeTampilanSkrip] = useState("voiceover")

  const [koleksiSkripTersimpan, setKoleksiSkripTersimpan] = useState([])
  const [semuaUserDB, setSemuaUserDB] = useState([])
  const [daftarTransaksi, setDaftarTransaksi] = useState([])

  const [keywordCariArsip, setKeywordCariArsip] = useState("")
  const [filterArsipPill, setFilterArsipPill] = useState("all")
  const [urutkanArsipTerbaru, setUrutkanArsipTerbaru] = useState(true)
  const [editingArsipId, setEditingArsipId] = useState(null)
  const [inputJudulArsipBaru, setInputJudulArsipBaru] = useState("")

  const [kalenderBulan, setKalenderBulan] = useState(() =>
    new Date().getMonth(),
  )
  const [kalenderTahun, setKalenderTahun] = useState(() =>
    new Date().getFullYear(),
  )
  const [tanggalKalenderTerpilih, setTanggalKalenderTerpilih] = useState(
    () => new Date().toISOString().split("T")[0],
  )
  const [filterFormatKalender, setFilterFormatKalender] = useState("all")
  const [idSkripPlotTerpilih, setIdSkripPlotTerpilih] = useState("")
  const [jamPublikasiInput, setJamPublikasiInput] = useState(
    EMPAT_JENDELA_WAKTU[3].jam,
  )

  const [tabMenuKoin, setTabMenuKoin] = useState("beli_paket")
  const [filterRiwayatKoin, setFilterRiwayatKoin] = useState("semua")
  const [inputKodeVoucherUser, setInputKodeVoucherUser] = useState("")
  const [checkoutModal, setCheckoutModal] = useState(null)
  const [duitkuInvoiceResult, setDuitkuInvoiceResult] = useState(null)
  const [duitkuPaymentMethod, setDuitkuPaymentMethod] = useState("SP")
  const [buktiBayarBase64, setBuktiBayarBase64] = useState("")
  const [namaFileBukti, setNamaFileBukti] = useState("")
  const [sedangProsesBayar, setSedangProsesBayar] = useState(false)

  const [pengaturanPayment, setPengaturanPayment] = useState({
    modePembayaranAktif: "duitku_otomatis",
    duitkuEnv: "sandbox",
    duitkuMerchantCode: "",
    duitkuApiKey: "",
    preferredModel: "anthropic/claude-3.5-sonnet",
    aiModel1: "anthropic/claude-3.5-haiku",
    aiModel2: "anthropic/claude-3.5-sonnet",
    namaMerchant: "HOOKYA OFFICIAL STORE",
    infoRekening: "NMID: ID1020039201992",
    noWaAdmin: "6281234567890",
    qrisImageUrl: "",
    brandConfig: {
      logoPngUrl: "",
      logoGapPx: 6,
      brandText: "HOOKYA",
      showBrandText: true,
    },
  })

  const [daftarVoucher, setDaftarVoucher] = useState([
    { kode: "HOOKYA20", koin: 20, kuota: 50, terpakai: 0 },
    { kode: "HOOKYACREATOR20", koin: 20, kuota: 50, terpakai: 0 },
  ])

  const [customPrompts, setCustomPrompts] = useState({
    persona_engine: "Ekstrak sapaan dan kosakata khas pengguna dengan akurat.",
    assessment_copilot: "Berikan 3 pilihan sudut pandang yang konkret.",
    script_humanizer:
      "Tulis dengan bahasa lisan yang mengalir alami saat diucapkan.",
  })

  const navStackRef = useRef([
    { menu: "chat", inRoom: false, stage: 0, subTab: "jadwal" },
  ])
  const isPoppingRef = useRef(false)

  useEffect(() => {
    if (typeof document === "undefined") return
    let meta = document.querySelector('meta[name="viewport"]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.name = "viewport"
      document.head.appendChild(meta)
    }
    meta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, interactive-widget=resizes-content",
    )
  }, [])

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 3200)
  }

  const dorongRiwayatNavigasi = (
    menuBaru,
    inRoomBaru,
    stageBaru,
    subTabBaru,
  ) => {
    if (typeof window === "undefined" || isPoppingRef.current) return
    const last = navStackRef.current[navStackRef.current.length - 1]
    if (
      last &&
      last.menu === menuBaru &&
      last.inRoom === inRoomBaru &&
      last.stage === stageBaru &&
      last.subTab === subTabBaru
    ) {
      return
    }
    navStackRef.current.push({
      menu: menuBaru,
      inRoom: inRoomBaru,
      stage: stageBaru,
      subTab: subTabBaru,
    })
    window.history.pushState(
      {
        hookyaInternal: true,
        menu: menuBaru,
        inRoom: inRoomBaru,
        stage: stageBaru,
      },
      "",
    )
  }

  const setIsInsideChatRoom = (val) => {
    setIsInsideChatRoomState(val)
    dorongRiwayatNavigasi(activeMenu, val, stage, subTabKalender)
  }

  const setActiveMenu = (menuTarget) => {
    if (menuTarget === "tersimpan") {
      setSubTabKalender("arsip")
      setActiveMenuState("kalender")
      dorongRiwayatNavigasi("kalender", false, stage, "arsip")
      return
    }
    if (menuTarget === "produksi") {
      setSubTabNiche("produksi")
      setActiveMenuState("niche")
      dorongRiwayatNavigasi("niche", false, stage, subTabKalender)
      return
    }
    if (menuTarget === "rewrite") {
      setSubTabNiche("ekstrak")
      setActiveMenuState("niche")
      dorongRiwayatNavigasi("niche", false, stage, subTabKalender)
      return
    }
    if (menuTarget === "asesmen") {
      setActiveMenuState("niche")
      dorongRiwayatNavigasi("niche", false, stage, subTabKalender)
      return
    }
    if (menuTarget === "brainstorm") {
      setActiveMenuState("chat")
      dorongRiwayatNavigasi("chat", isInsideChatRoom, stage, subTabKalender)
      return
    }
    setActiveMenuState(menuTarget)
    dorongRiwayatNavigasi(menuTarget, false, stage, subTabKalender)
  }

  const setStage = (stageTarget) => {
    setStageState(stageTarget)
    dorongRiwayatNavigasi(
      activeMenu,
      isInsideChatRoom,
      stageTarget,
      subTabKalender,
    )
  }

  const ubahSubTabKalender = (tabTarget) => {
    setSubTabKalender(tabTarget)
    dorongRiwayatNavigasi("kalender", false, stage, tabTarget)
  }

  const handleTombolBackHeader = () => {
    if (activeMenu === "chat" && isInsideChatRoom) {
      setIsInsideChatRoomState(false)
      return
    }
    if (activeMenu === "niche" && stage > 0) {
      setStageState(0)
      return
    }
    if (navStackRef.current.length > 1) {
      navStackRef.current.pop()
      const prev = navStackRef.current[navStackRef.current.length - 1]
      setActiveMenuState(prev.menu || "chat")
      setIsInsideChatRoomState(Boolean(prev.inRoom))
      setStageState(prev.stage ?? 0)
      setSubTabKalender(prev.subTab || "jadwal")
    } else {
      setActiveMenuState("chat")
      setIsInsideChatRoomState(false)
      setStageState(0)
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    window.history.replaceState({ hookyaInternal: true }, "")

    const handlePopState = () => {
      isPoppingRef.current = true
      if (modeTeleprompter) {
        setModeTeleprompter(false)
        window.history.pushState({ hookyaInternal: true }, "")
      } else if (navStackRef.current.length > 1) {
        navStackRef.current.pop()
        const prev = navStackRef.current[navStackRef.current.length - 1]
        setActiveMenuState(prev.menu || "chat")
        setIsInsideChatRoomState(Boolean(prev.inRoom))
        setStageState(prev.stage ?? 0)
        setSubTabKalender(prev.subTab || "jadwal")
      } else {
        setActiveMenuState("chat")
        setIsInsideChatRoomState(false)
        setStageState(0)
        window.history.pushState({ hookyaInternal: true }, "")
      }
      setTimeout(() => {
        isPoppingRef.current = false
      }, 60)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [modeTeleprompter])

  const ubahViewModeStabil = (modeBaru) => {
    setViewMode(modeBaru)
    if (typeof window !== "undefined") {
      if (modeBaru === "dev") {
        sessionStorage.setItem("hookya_active_view_mode", "dev")
      } else {
        sessionStorage.removeItem("hookya_active_view_mode")
      }
    }
  }

  // Sinkronisasi Pre-Fill Otomatis dari Profil Niche ke Persona & Asesmen (Bagian 3 & 9)
  const terapkanPreFillDariProfilNiche = (nicheProf) => {
    if (!nicheProf?.result) return
    const idPilih = nicheProf.selected_niche_id || "n1"
    const cand =
      (nicheProf.result.niche_candidates || []).find((n) => n.id === idPilih) ||
      nicheProf.result.niche_candidates?.[0]
    if (!cand) return

    setPersonaProfile((prev) => ({
      ...prev,
      niche_badge: `Niche: ${cand.name} | Target: ${cand.audience}`,
      target_audience: {
        ...(prev.target_audience || {}),
        segment_profile: cand.audience,
        deepest_pain_points: cand.problem,
      },
      niche_context: {
        ...(prev.niche_context || {}),
        primary_niche: cand.name,
        segment_profile: cand.audience,
        deepest_pain_points: cand.problem,
      },
    }))

    setProfil((prev) => ({
      ...prev,
      minatUtama: cand.name,
      targetSegmenInput: cand.audience,
      targetKetakutanInput: cand.problem,
    }))
  }

  const muatUlangDataSupabase = async (idTarget) => {
    try {
      const { data: trxRows } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
      if (trxRows) setDaftarTransaksi(trxRows)

      const { data: userRows } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true })

      let activeUser = null
      if (userRows && userRows.length > 0) {
        setSemuaUserDB(userRows)
        const savedId =
          idTarget ||
          (typeof window !== "undefined"
            ? localStorage.getItem("hookya_active_user_id")
            : null)

        activeUser = userRows.find((u) => u.id === savedId)

        const configRow =
          userRows.find(
            (u) =>
              u.profil_dna?.pengaturanPayment?.aiModel1 ||
              u.profil_dna?.pengaturanPayment?.aiModel2 ||
              u.profil_dna?.pengaturanPayment?.duitkuMerchantCode,
          ) ||
          userRows.find(
            (u) => u.role === "admin" && u.profil_dna?.pengaturanPayment,
          ) ||
          userRows[0]

        if (configRow?.profil_dna) {
          if (Array.isArray(configRow.profil_dna.daftarVoucher)) {
            setDaftarVoucher(configRow.profil_dna.daftarVoucher)
          }
          if (configRow.profil_dna.pengaturanPayment) {
            setPengaturanPayment((prev) => ({
              ...prev,
              ...configRow.profil_dna.pengaturanPayment,
            }))
          }
          if (configRow.profil_dna.pinAdminResmi) {
            setPinAdminResmi(configRow.profil_dna.pinAdminResmi)
          }
        }

        if (activeUser) {
          const roleAktif =
            activeUser.role ||
            (activeUser.id === userRows[0]?.id ? "admin" : "user")
          const isOwnerOrAdmin =
            roleAktif === "admin" ||
            activeUser.nama?.toLowerCase().includes("faqih") ||
            activeUser.username?.toLowerCase() === "paqijoe"

          const expStr =
            activeUser.expired_at || activeUser.profil_dna?.expired_at
          const sisaHari = isOwnerOrAdmin ? 365 : hitungSisaHariAktif(expStr)

          const trxLunasTerakhir = (trxRows || []).find(
            (t) => t.user_id === activeUser.id && t.status === "lunas",
          )
          const paketTersimpan =
            trxLunasTerakhir?.nama_paket ||
            activeUser.profil_dna?.paketAktif ||
            (activeUser.is_premium ? "Paket 25K VIP" : "Paket 10K")
          const nominalTersimpan = ekstrakHargaDariNamaPaket(
            paketTersimpan,
            trxLunasTerakhir?.nominal_asli ||
              trxLunasTerakhir?.nominal_bayar ||
              0,
          )

          const kuotaHitung = hitungKuotaAkunDariPaket(
            paketTersimpan,
            nominalTersimpan,
            isOwnerOrAdmin,
          )

          setUserId(activeUser.id)
          setUserRole(roleAktif)
          setExpiredAt(expStr)
          setSisaHariPaket(sisaHari)
          setNamaPaketAktif(isOwnerOrAdmin ? "Paket 90K VIP" : paketTersimpan)
          setNominalPaketAktif(isOwnerOrAdmin ? 90000 : nominalTersimpan)
          setKuotaAkunMaksimal(kuotaHitung)
          setIsPremiumUser(
            Boolean(
              isOwnerOrAdmin ||
              activeUser.is_premium ||
              activeUser.profil_dna?.is_premium,
            ),
          )
          setCoins(activeUser.koin ?? 20)

          setProfil((prev) => ({
            ...prev,
            ...(activeUser.profil_dna || {}),
            nama: activeUser.nama || prev.nama,
            username:
              activeUser.username ||
              activeUser.profil_dna?.username ||
              prev.username,
            kontak:
              activeUser.email || activeUser.profil_dna?.kontak || prev.kontak,
            whatsapp:
              activeUser.whatsapp ||
              activeUser.profil_dna?.whatsapp ||
              prev.whatsapp,
            avatar_url:
              activeUser.avatar_url ||
              activeUser.profil_dna?.avatar_url ||
              prev.avatar_url,
          }))
          if (activeUser.profil_dna?.rawWritingSamples) {
            setRawWritingSamples(activeUser.profil_dna.rawWritingSamples)
          }
          if (activeUser.profil_dna?.personaProfile) {
            setPersonaProfile(activeUser.profil_dna.personaProfile)
          }
          if (activeUser.profil_dna?.bentukKonten) {
            setBentukKonten(activeUser.profil_dna.bentukKonten)
          }
          if (activeUser.profil_dna?.active_niche_profile) {
            terapkanPreFillDariProfilNiche(
              activeUser.profil_dna.active_niche_profile,
            )
          }

          const savedSessionMode =
            typeof window !== "undefined"
              ? sessionStorage.getItem("hookya_active_view_mode")
              : null
          setViewMode((prevMode) => {
            if (prevMode === "dev" || savedSessionMode === "dev") {
              return "dev"
            }
            return "user"
          })
        }
      }

      const { data: scriptRows } = await supabase
        .from("scripts")
        .select("*")
        .order("created_at", { ascending: false })

      if (scriptRows) {
        const semuaTerformat = scriptRows.map((row) => {
          const segmenArr = Array.isArray(row.segmen_skrip)
            ? row.segmen_skrip
            : row.segmen_skrip?.segmen || []
          return {
            id: row.id,
            dbId: row.id,
            userId: row.user_id,
            judul: row.judul,
            kategori: row.kategori,
            bentuk: row.bentuk_konten,
            waktuDibuat:
              row.segmen_skrip?.meta?.waktuDibuat ||
              new Date(row.created_at).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            kritikDetail: row.segmen_skrip?.meta?.kritikDetail || null,
            kritikSaran: row.segmen_skrip?.meta?.kritikSaran || "",
            uploadPack: row.segmen_skrip?.meta?.uploadPack || null,
            uploadPackage: row.segmen_skrip?.meta?.uploadPack || null,
            variasiFolder: Array.isArray(row.segmen_skrip?.meta?.variasiFolder)
              ? row.segmen_skrip.meta.variasiFolder
              : [],
            isStarred: Boolean(row.segmen_skrip?.meta?.isStarred),
            jamPublikasi: row.segmen_skrip?.meta?.jamPublikasi || "20:15 WIB",
            sections: segmenArr,
            segmen: segmenArr,
            sudahUpload: Boolean(row.segmen_skrip?.meta?.sudahUpload),
            tanggalUpload: row.segmen_skrip?.meta?.tanggalUpload || "",
          }
        })

        const idAktifSekarang = activeUser?.id || idTarget
        if (idAktifSekarang) {
          const milikUser = semuaTerformat.filter(
            (s) => s.userId === idAktifSekarang,
          )
          setKoleksiSkripTersimpan(milikUser)
          if (milikUser[0]?.id && !idSkripPlotTerpilih) {
            setIdSkripPlotTerpilih(String(milikUser[0].id))
          }
        }
      }
    } catch {
      // Ignore initial load error
    }
  }

  useEffect(() => {
    muatUlangDataSupabase()
  }, [])

  const updateKoinDatabase = async (koinBaru, targetUserId = userId) => {
    if (targetUserId === userId) setCoins(koinBaru)
    setSemuaUserDB((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, koin: koinBaru } : u)),
    )
    if (!targetUserId) return
    await supabase
      .from("users")
      .update({ koin: koinBaru })
      .eq("id", targetUserId)
  }

  const simpanPersonaKeSupabase = async (personaTerbaru = personaProfile) => {
    if (!userId) return
    await supabase
      .from("users")
      .update({
        nama: profil.nama,
        avatar_url: profil.avatar_url,
        profil_dna: {
          ...profil,
          paketAktif: namaPaketAktif,
          kuotaAkunMaksimal,
          is_premium: isPremiumUser,
          expired_at: expiredAt,
          rawWritingSamples,
          personaProfile: personaTerbaru,
          bentukKonten,
          customPrompts,
          daftarVoucher,
          pengaturanPayment,
          pinAdminResmi,
        },
      })
      .eq("id", userId)
  }

  const simpanPengaturanDevPermanen = async (
    paymentOverride = pengaturanPayment,
  ) => {
    try {
      const targetIds = new Set()
      if (userId) targetIds.add(userId)
      if (semuaUserDB[0]?.id) targetIds.add(semuaUserDB[0].id)
      for (const idTarget of targetIds) {
        const rowLama = semuaUserDB.find((u) => u.id === idTarget)
        await supabase
          .from("users")
          .update({
            role: "admin",
            profil_dna: {
              ...(rowLama?.profil_dna || {}),
              pengaturanPayment: paymentOverride,
              daftarVoucher,
              customPrompts,
              pinAdminResmi,
            },
          })
          .eq("id", idTarget)
      }
      await muatUlangDataSupabase(userId)
      showToast("Konfigurasi Dual AI & Duitku Sandbox berhasil disimpan.")
    } catch (err) {
      showToast("Gagal menyimpan: " + err.message)
    }
  }

  const simpanAtauUpdateSkripDatabase = async (skripObj) => {
    const payloadSegmen = {
      segmen: skripObj.segmen || skripObj.sections || [],
      meta: {
        waktuDibuat: skripObj.waktuDibuat,
        kritikDetail: skripObj.kritikDetail || null,
        kritikSaran: skripObj.kritikSaran || "",
        uploadPack: skripObj.uploadPack || skripObj.uploadPackage || null,
        variasiFolder: Array.isArray(skripObj.variasiFolder)
          ? skripObj.variasiFolder
          : [],
        isStarred: Boolean(skripObj.isStarred),
        jamPublikasi: skripObj.jamPublikasi || "20:15 WIB",
        sudahUpload: Boolean(skripObj.sudahUpload),
        tanggalUpload: skripObj.tanggalUpload || "",
      },
    }
    try {
      if (skripObj.dbId) {
        await supabase
          .from("scripts")
          .update({
            judul: skripObj.judul,
            bentuk_konten: skripObj.bentuk,
            segmen_skrip: payloadSegmen,
          })
          .eq("id", skripObj.dbId)
        return skripObj
      } else {
        const { data } = await supabase
          .from("scripts")
          .insert([
            {
              user_id: userId,
              judul: skripObj.judul,
              kategori: skripObj.kategori,
              bentuk_konten: skripObj.bentuk,
              segmen_skrip: payloadSegmen,
            },
          ])
          .select()
          .single()
        if (data?.id) return { ...skripObj, id: data.id, dbId: data.id, userId }
      }
    } catch {
      // Fallback local
    }
    return skripObj
  }

  const handleKonfirmasiHapusSkrip = async () => {
    if (!targetHapusSkrip) return
    setSedangMenghapusSkrip(true)
    try {
      if (targetHapusSkrip.dbId || targetHapusSkrip.id) {
        await supabase
          .from("scripts")
          .delete()
          .eq("id", targetHapusSkrip.dbId || targetHapusSkrip.id)
      }
      setKoleksiSkripTersimpan((prev) =>
        prev.filter((s) => s.id !== targetHapusSkrip.id),
      )
      if (hasilSkrip?.id === targetHapusSkrip.id) {
        setHasilSkrip(null)
        setStage(0)
      }
      showToast(`Naskah "${targetHapusSkrip.judul}" berhasil dihapus.`)
    } catch {
      showToast("Gagal menghapus naskah dari database.")
    } finally {
      setSedangMenghapusSkrip(false)
      setTargetHapusSkrip(null)
    }
  }

  const handleSimpanEditJudulArsip = async (itemArsip) => {
    const judulBersih = inputJudulArsipBaru.trim()
    if (!judulBersih) {
      alert("Judul skrip tidak boleh kosong.")
      return
    }
    rekamKetikanKeGudangIngatan(userId, "Edit Judul Arsip", judulBersih)
    const updated = { ...itemArsip, judul: judulBersih }
    setEditingArsipId(null)
    setKoleksiSkripTersimpan((prev) =>
      prev.map((s) => (s.id === itemArsip.id ? updated : s)),
    )
    if (hasilSkrip?.id === itemArsip.id) {
      setHasilSkrip(updated)
    }
    await simpanAtauUpdateSkripDatabase(updated)
    showToast("Judul skrip berhasil diperbarui.")
  }

  const handleToggleFavoritArsip = async (item) => {
    const updated = { ...item, isStarred: !item.isStarred }
    setKoleksiSkripTersimpan((prev) =>
      prev.map((s) => (s.id === item.id ? updated : s)),
    )
    await simpanAtauUpdateSkripDatabase(updated)
  }

  const handlePlotSkripKeKalender = async () => {
    const targetId =
      idSkripPlotTerpilih ||
      (koleksiSkripTersimpan[0] ? String(koleksiSkripTersimpan[0].id) : "")
    const itemTarget = koleksiSkripTersimpan.find(
      (s) => String(s.id) === String(targetId),
    )
    if (!itemTarget || !tanggalKalenderTerpilih) {
      alert("Pilih skrip dari arsip terlebih dahulu.")
      return
    }

    const updated = {
      ...itemTarget,
      sudahUpload: true,
      tanggalUpload: tanggalKalenderTerpilih,
      jamPublikasi: jamPublikasiInput || "20:15 WIB",
    }
    setKoleksiSkripTersimpan((prev) =>
      prev.map((s) => (s.id === itemTarget.id ? updated : s)),
    )
    await simpanAtauUpdateSkripDatabase(updated)
    showToast(
      `Skrip dijadwalkan ke ${tanggalKalenderTerpilih} (${updated.jamPublikasi}).`,
    )
  }

  const handleLepasJadwalKalender = async (item) => {
    const updated = {
      ...item,
      sudahUpload: false,
      tanggalUpload: "",
    }
    setKoleksiSkripTersimpan((prev) =>
      prev.map((s) => (s.id === item.id ? updated : s)),
    )
    await simpanAtauUpdateSkripDatabase(updated)
    showToast("Skrip dilepas dari jadwal kalender.")
  }

  const handleKlaimVoucherUser = async () => {
    const kodeBersih = inputKodeVoucherUser.trim().toUpperCase()
    if (!kodeBersih) {
      showToast("Masukkan kode voucher promo terlebih dahulu.")
      return
    }
    const ditemukan = daftarVoucher.find(
      (v) => v.kode.toUpperCase() === kodeBersih,
    )
    if (!ditemukan || ditemukan.terpakai >= ditemukan.kuota) {
      alert("Kode kupon tidak ditemukan atau kuota aktivasi telah habis.")
      return
    }
    const tambahan = parseInt(ditemukan.koin) || 20
    await updateKoinDatabase(coins + tambahan)
    setDaftarVoucher(
      daftarVoucher.map((v) =>
        v.kode.toUpperCase() === kodeBersih
          ? { ...v, terpakai: v.terpakai + 1 }
          : v,
      ),
    )
    setInputKodeVoucherUser("")
    showToast(`Voucher valid! +${tambahan} Koin ditambahkan ke saldo aktifmu.`)
  }

  const bukaLayarCheckoutPaket = (paketObj) => {
    const kodeUnik = Math.floor(101 + Math.random() * 499)
    const nomorInvoice = `HKY-${Date.now().toString().slice(-5)}`
    setBuktiBayarBase64("")
    setNamaFileBukti("")
    setDuitkuInvoiceResult(null)
    setCheckoutModal({
      invoiceId: nomorInvoice,
      namaPaket: paketObj.nama,
      koin: paketObj.koin,
      kuotaAkun: paketObj.kuotaAkun,
      nominalAsli: paketObj.nominalAngka,
      kodeUnik,
      nominalBayar: paketObj.nominalAngka + kodeUnik,
    })
  }

  // Membuat Invoice Otomatis via Duitku Sandbox
  const handleBuatInvoiceDuitkuSandbox = async () => {
    if (!checkoutModal || sedangProsesBayar) return
    setSedangProsesBayar(true)
    try {
      const res = await fetch("/api/duitku/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          namaUser: profil.nama,
          emailUser: profil.kontak,
          whatsappUser: profil.whatsapp,
          namaPaket: checkoutModal.namaPaket,
          jumlahKoin: checkoutModal.koin,
          kuotaAkun: checkoutModal.kuotaAkun,
          nominalBayar: checkoutModal.nominalAsli,
          paymentMethod: duitkuPaymentMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat invoice Duitku Sandbox.")
      }
      setDuitkuInvoiceResult(data)
      if (data.paymentUrl) {
        window.open(data.paymentUrl, "_blank")
      }
      showToast("Halaman pembayaran Duitku Sandbox berhasil dibuka!")
    } catch (err) {
      alert(err.message)
    } finally {
      setSedangProsesBayar(false)
    }
  }

  // Mengecek Status Pembayaran Duitku Sandbox secara Langsung
  const handleCekStatusPembayaranDuitku = async () => {
    if (!duitkuInvoiceResult?.invoiceId || sedangProsesBayar) return
    setSedangProsesBayar(true)
    try {
      const res = await fetch("/api/duitku/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check_status",
          merchantOrderId: duitkuInvoiceResult.invoiceId,
        }),
      })
      const data = await res.json()
      if (data.lunas) {
        await muatUlangDataSupabase(userId)
        setCheckoutModal(null)
        setDuitkuInvoiceResult(null)
        showToast(data.statusMessage || "Pembayaran Lunas! Koin bertambah.")
      } else {
        showToast(
          data.statusMessage || "Pembayaran masih menunggu di Duitku Sandbox.",
        )
      }
    } catch {
      showToast("Gagal memeriksa status transaksi.")
    } finally {
      setSedangProsesBayar(false)
    }
  }

  const handleUploadBuktiBayarUser = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNamaFileBukti(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const maxDim = 750
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
        setBuktiBayarBase64(canvas.toDataURL("image/jpeg", 0.75))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleKonfirmasiBayarDanKirimWA = async () => {
    if (!checkoutModal) return
    if (!buktiBayarBase64) {
      alert("Unggah foto bukti pembayaran QRIS terlebih dahulu.")
      return
    }
    setSedangProsesBayar(true)
    const trxBaru = {
      invoice_id: checkoutModal.invoiceId,
      user_id: userId,
      nama_user: profil.nama,
      nama_paket: checkoutModal.namaPaket,
      jumlah_koin: checkoutModal.koin,
      nominal_asli: checkoutModal.nominalAsli,
      nominal_bayar: checkoutModal.nominalBayar,
      metode_bayar: "QRIS Top-Up",
      bukti_bayar: buktiBayarBase64,
      status: "pending",
    }

    try {
      const { data } = await supabase
        .from("transactions")
        .insert([trxBaru])
        .select()
        .single()
      setDaftarTransaksi([
        data || { ...trxBaru, id: Date.now() },
        ...daftarTransaksi,
      ])

      const nomorWA = (pengaturanPayment.noWaAdmin || "6281234567890").replace(
        /\D/g,
        "",
      )
      const nomorWAFinal = nomorWA.startsWith("08")
        ? "62" + nomorWA.slice(1)
        : nomorWA

      const pesanWA = encodeURIComponent(
        `Halo Admin Hookya, saya sudah melakukan pembayaran Top-Up QRIS:\n\n` +
          `Invoice: *#${checkoutModal.invoiceId}*\n` +
          `Akun: *${profil.nama}* (${profil.kontak})\n` +
          `Paket: *${checkoutModal.namaPaket} (+${checkoutModal.koin} Koin)*\n` +
          `Nominal Transfer: *Rp ${checkoutModal.nominalBayar.toLocaleString("id-ID")}*\n\n` +
          `Mohon diperiksa di Console Admin. Terima kasih.`,
      )
      window.open(`https://wa.me/${nomorWAFinal}?text=${pesanWA}`, "_blank")
      showToast("Bukti pembayaran terkirim ke Admin.")
    } finally {
      setSedangProsesBayar(false)
      setCheckoutModal(null)
    }
  }

  // Fungsi Integrasi Tombol "Buat Naskah" dari Ide Topik Niche (Pre-fill Otomatis - Bagian 3 & 9)
  const handleGunakanTopikNicheKeNaskah = ({
    topicIdea,
    nicheCandidate,
    deliveryStyle,
  }) => {
    if (!topicIdea) return
    if (nicheCandidate) {
      terapkanPreFillDariProfilNiche({
        selected_niche_id: nicheCandidate.id,
        result: {
          niche_candidates: [nicheCandidate],
          ikigai: { delivery_style: deliveryStyle },
        },
      })
    }

    const goalMap =
      topicIdea.goal === "conversion"
        ? "Konten Jualan"
        : topicIdea.goal === "engagement"
          ? "Konten Cari Trust"
          : "Konten Cari Viral"

    const durasiLabel = `${topicIdea.est_duration_sec || 30} Detik`
    const ringkasanPreFill = `Buat naskah ${goalMap} untuk topik: "${topicIdea.title}". Target penonton: ${
      nicheCandidate?.audience || "Audiens TikTok"
    }. Masalah audiens: ${
      nicheCandidate?.problem || "-"
    }. Format: ${topicIdea.format} (${durasiLabel}). Gunakan kalimat Hook pembuka ini: "${
      topicIdea.hook
    }"`

    // Simpan ke sesi Chat Topik baru yang langsung terisi otomatis
    const storageKey = `hookya_topic_sessions_v3_${userId || "guest"}`
    const waktuSkr = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })

    const sesiPreFill = {
      id: `sesi_${Date.now()}`,
      nomorSesi: 1,
      judul: topicIdea.title,
      akunLabel: selectedPersonaHeader || "",
      gunakanPersona: Boolean(selectedPersonaHeader),
      format: "TikTok / Reels",
      statusLabel: "Pre-Fill Niche",
      statusTahap: "Siap Generate",
      waktuTerakhir: waktuSkr,
      flowState: {
        tahap: "pilih_hook_dan_cta",
        tujuanKonten: goalMap,
        formatKonten: "TikTok / Reels",
        topikAtauProduk: topicIdea.title,
        masalahAtauGoals: nicheCandidate?.problem || topicIdea.why || "",
        faktorAtauAngle: `${topicIdea.format} • ${deliveryStyle || ""}`,
        durasiKonten: durasiLabel,
        hookTerpilih: topicIdea.hook,
        ctaTerpilih:
          topicIdea.goal === "conversion"
            ? "Cek detail lengkapnya di tautan bio / keranjang kuning sekarang."
            : "Tulis pendapatmu di kolom komentar dan save video ini biar gak hilang!",
      },
      messages: [
        {
          id: `msg_prefill_${Date.now()}`,
          role: "assistant",
          waktu: waktuSkr,
          tahapBerikutnya: "pilih_hook_dan_cta",
          balasanBot: `Data dari Profil Niche (${
            nicheCandidate?.name || "Ikigai"
          }) berhasil diisi otomatis!\n\n• Topik: ${
            topicIdea.title
          }\n• Target Penonton: ${
            nicheCandidate?.audience || "-"
          }\n• Format & Durasi: ${
            topicIdea.format
          } (${durasiLabel})\n\nHook 3 detik dan CTA sudah disiapkan di bawah. Kamu bisa langsung klik "Generate Teks Naskah Sekarang" atau pilih variasi lainnya:`,
          hookOptions10: [
            {
              nomor: 1,
              jenis: `Hook Rekomendasi Niche (${topicIdea.format})`,
              teksHook: topicIdea.hook,
            },
          ],
          ctaOptions: [
            {
              kategori: "CTA Sesuai Goal Topik (" + topicIdea.goal + ")",
              teksCta:
                topicIdea.goal === "conversion"
                  ? "Kalau kamu sering ngalamin hal yang sama, cek solusi lengkapnya di tautan profil ya."
                  : "Gimana menurut pengalamanmu? Ceritain di komentar dan simpan videonya buat dipraktikkan nanti.",
            },
            {
              kategori: "CTA Lugas Satu Arah",
              teksCta:
                "Mau lanjut bahas bagian berikutnya? Cek pinned post di profil sekarang.",
            },
          ],
        },
      ],
    }

    if (typeof window !== "undefined") {
      try {
        const rawLama = localStorage.getItem(storageKey)
        const listLama = rawLama ? JSON.parse(rawLama) : []
        localStorage.setItem(
          storageKey,
          JSON.stringify([sesiPreFill, ...listLama]),
        )
      } catch {
        // Ignore
      }
    }

    setPrefillTopicFromNiche(ringkasanPreFill)
    setDaftar10IdeTopik((prev) => [
      { judul: topicIdea.title, alasan: topicIdea.why || topicIdea.hook },
      ...prev,
    ])
    setIsInsideChatRoom(true)
    setActiveMenu("chat")
    showToast("Topik & Target Penonton otomatis terisi dari Profil Niche!")
  }

  const isAdminAccount =
    userRole === "admin" ||
    profil.nama?.toLowerCase().includes("faqih") ||
    profil.username?.toLowerCase() === "paqijoe"

  const statusVIPFinal = Boolean(isAdminAccount || isPremiumUser)

  const daftarLogTelemetryUser = Array.isArray(profil.telemetry?.recentLogs)
    ? profil.telemetry.recentLogs
    : []

  const daftarTopupUser = daftarTransaksi
    .filter((t) => t.user_id === userId)
    .map((t) => ({
      id: `trx_${t.id}`,
      waktu: t.created_at
        ? new Date(t.created_at).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB"
        : "Baru saja",
      timestamp: t.created_at || new Date().toISOString(),
      action: `Pembelian ${t.nama_paket} (#${t.invoice_id})`,
      detail:
        t.status === "lunas"
          ? `Top-up paket disetujui (+${t.jumlah_koin} Koin)`
          : t.status === "ditolak"
            ? "Pembayaran dibatalkan / ditolak"
            : "Menunggu penyelesaian pembayaran",
      status:
        t.status === "lunas"
          ? "topup_lunas"
          : t.status === "ditolak"
            ? "gagal_refund"
            : "pending",
      koinDelta: t.status === "lunas" ? Number(t.jumlah_koin) || 0 : 0,
      refundInfo: "",
    }))

  const semuaRiwayatKoinUser = [...daftarLogTelemetryUser, ...daftarTopupUser]
    .sort(
      (a, b) =>
        new Date(b.timestamp || 0).getTime() -
        new Date(a.timestamp || 0).getTime(),
    )
    .filter((item) => {
      if (filterRiwayatKoin === "terpakai") return item.koinDelta < 0
      if (filterRiwayatKoin === "refund")
        return item.status === "gagal_refund" || Boolean(item.refundInfo)
      return true
    })

  const jumlahLogGagalRefund = [
    ...daftarLogTelemetryUser,
    ...daftarTopupUser,
  ].filter(
    (item) => item.status === "gagal_refund" || Boolean(item.refundInfo),
  ).length

  const jmlTerjadwal = koleksiSkripTersimpan.filter(
    (s) => s.sudahUpload && s.tanggalUpload,
  ).length

  const arsipTerfilter = koleksiSkripTersimpan
    .filter((item) => {
      if (
        filterArsipPill === "scheduled" &&
        !(item.sudahUpload && item.tanggalUpload)
      )
        return false
      if (
        filterArsipPill === "unscheduled" &&
        item.sudahUpload &&
        item.tanggalUpload
      )
        return false
      if (filterArsipPill === "starred" && !item.isStarred) return false
      if (!keywordCariArsip.trim()) return true
      const q = keywordCariArsip.toLowerCase()
      return (
        (item.judul || "").toLowerCase().includes(q) ||
        (item.bentuk || "").toLowerCase().includes(q) ||
        (item.segmen || []).some((seg) =>
          (seg.spokenText || seg.voiceover || "").toLowerCase().includes(q),
        )
      )
    })
    .sort((a, b) => (urutkanArsipTerbaru ? b.id - a.id : a.id - b.id))

  const buatGridKalenderSeninMinggu = (tahun, bulan) => {
    const hariPertamaMinggu0 = new Date(tahun, bulan, 1).getDay()
    const offsetSenin = (hariPertamaMinggu0 + 6) % 7
    const jumlahHari = new Date(tahun, bulan + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < offsetSenin; i++) cells.push(null)
    for (let d = 1; d <= jumlahHari; d++) {
      const mm = String(bulan + 1).padStart(2, "0")
      const dd = String(d).padStart(2, "0")
      cells.push({ hari: d, iso: `${tahun}-${mm}-${dd}` })
    }
    return cells
  }

  const gridHariKalender = buatGridKalenderSeninMinggu(
    kalenderTahun,
    kalenderBulan,
  )
  const daftarSkripTanggalTerpilih = koleksiSkripTersimpan.filter((s) => {
    if (s.tanggalUpload !== tanggalKalenderTerpilih) return false
    if (filterFormatKalender === "all") return true
    const b = (s.bentuk || "").toLowerCase()
    if (filterFormatKalender === "reels")
      return b.includes("talking") || b.includes("reel") || b.includes("tiktok")
    if (filterFormatKalender === "carousel") return b.includes("carousel")
    if (filterFormatKalender === "thread") return b.includes("thread")
    return true
  })

  const namaHariTerpilih =
    NAMA_HARI_ID[new Date(tanggalKalenderTerpilih).getDay()] || "Hari Ini"

  const semuaOpsiPersonaHeader = [
    profil.labelAkunSosmed || `@${profil.username || "utama"}`,
    ...(Array.isArray(profil.daftarAkunTernak)
      ? profil.daftarAkunTernak.map((a) => a.labelAkun)
      : []),
  ]
    .filter((v, i, arr) => v && arr.indexOf(v) === i)
    .slice(0, kuotaAkunMaksimal)

  const totalBytesArsipDB = hitungUkuranBytesObjek(koleksiSkripTersimpan)
  const kuotaMaksUserBytes = statusVIPFinal ? 5 * 1024 * 1024 : 2 * 1024 * 1024
  const persenVaultNaskah = Math.min(
    100,
    Math.max(2, Math.round((totalBytesArsipDB / kuotaMaksUserBytes) * 100)),
  )

  const sembunyikanBottomNav = activeMenu === "chat" && isInsideChatRoom

  if (viewMode === "auth") {
    return (
      <AuthFullscreen
        onNotify={showToast}
        onAuthSuccess={async (userRow) => {
          if (userRow?.id) {
            if (typeof window !== "undefined") {
              localStorage.setItem("hookya_active_user_id", userRow.id)
              sessionStorage.removeItem("hookya_active_view_mode")
            }
            await muatUlangDataSupabase(userRow.id)
          }
          ubahViewModeStabil("user")
        }}
      />
    )
  }

  if (viewMode === "dev") {
    return (
      <DeveloperDashboardView
        onSwitchToUserView={() => ubahViewModeStabil("user")}
        semuaUserDB={semuaUserDB}
        daftarTransaksi={daftarTransaksi}
        pengaturanPayment={pengaturanPayment}
        setPengaturanPayment={setPengaturanPayment}
        pinAdminResmi={pinAdminResmi}
        setPinAdminResmi={setPinAdminResmi}
        daftarVoucher={daftarVoucher}
        setDaftarVoucher={setDaftarVoucher}
        updateKoinDatabase={updateKoinDatabase}
        handleApproveTransaksiAdmin={async (trx) => {
          await supabase
            .from("transactions")
            .update({ status: "lunas" })
            .eq("id", trx.id)

          const targetU = semuaUserDB.find((x) => x.id === trx.user_id)
          if (targetU) {
            const sisaLama = hitungSisaHariAktif(
              targetU.expired_at || targetU.profil_dna?.expired_at,
            )
            const totalHariBaru = sisaLama + 30
            const expiredBaruISO = new Date(
              Date.now() + totalHariBaru * 24 * 60 * 60 * 1000,
            ).toISOString()
            const totalKoinBaru =
              (targetU.koin || 0) + (parseInt(trx.jumlah_koin) || 0)
            const nominalTrx =
              parseInt(trx.nominal_asli) || parseInt(trx.nominal_bayar) || 0
            const jadiVIP = Boolean(targetU.is_premium) || nominalTrx >= 20000
            const kuotaAkunBaru = hitungKuotaAkunDariPaket(
              trx.nama_paket,
              nominalTrx,
              targetU.role === "admin",
            )

            await supabase
              .from("users")
              .update({
                koin: totalKoinBaru,
                is_premium: jadiVIP,
                expired_at: expiredBaruISO,
                profil_dna: {
                  ...(targetU.profil_dna || {}),
                  statusPendaftaran: "aktif",
                  paketAktif: trx.nama_paket,
                  kuotaAkunMaksimal: kuotaAkunBaru,
                  is_premium: jadiVIP,
                  expired_at: expiredBaruISO,
                },
              })
              .eq("id", targetU.id)
          }
          await muatUlangDataSupabase(userId)
          showToast("Pembayaran di-ACC & koin pengguna diaktifkan.")
        }}
        simpanPengaturanDevKeDB={simpanPengaturanDevPermanen}
        muatUlangDataSupabase={() => muatUlangDataSupabase(userId)}
        showToast={showToast}
      />
    )
  }

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-[#F4F5F7] text-[#14141F] flex flex-col font-sans antialiased overflow-hidden">
      {toastMsg && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 bg-[#14141F] text-[#D4F34A] px-4 py-3 rounded-xl border border-[#14141F] text-xs font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FlatIcon name="check" className="w-4 h-4 shrink-0" />
            <span className="text-white">{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg("")}
            className="text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {targetHapusSkrip && (
        <div className="fixed inset-0 bg-[#14141F]/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#14141F] w-full max-w-sm rounded-2xl p-6 space-y-4 text-center border border-[#14141F]">
            <div className="w-12 h-12 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center mx-auto border border-[#EF4444]">
              <FlatIcon name="trash" className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold">Hapus Naskah Skrip Ini?</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Apakah kamu yakin ingin menghapus naskah{" "}
                <strong>&ldquo;{targetHapusSkrip.judul}&rdquo;</strong> dari
                penyimpanan?
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={sedangMenghapusSkrip}
                onClick={() => setTargetHapusSkrip(null)}
                className="cursor-pointer flex-1 bg-[#F4F5F7] text-[#14141F] font-bold text-xs py-3 rounded-lg border border-[#E2E8F0]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangMenghapusSkrip}
                onClick={handleKonfirmasiHapusSkrip}
                className="cursor-pointer flex-1 bg-[#EF4444] text-white font-bold text-xs py-3 rounded-lg"
              >
                {sedangMenghapusSkrip ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {rawCropImageSrc && (
        <AvatarCropModal
          imageSrc={rawCropImageSrc}
          onCancel={() => setRawCropImageSrc(null)}
          onSaveCrop={async (cropped) => {
            setRawCropImageSrc(null)
            setProfil((p) => ({ ...p, avatar_url: cropped }))
            if (userId) {
              await supabase
                .from("users")
                .update({ avatar_url: cropped })
                .eq("id", userId)
            }
            showToast("Foto profil diperbarui.")
          }}
        />
      )}

      {/* TOP HEADER TERKUNCI STATIS */}
      <header className="shrink-0 h-14 bg-white border-b border-[#E2E8F0] px-3 flex items-center justify-between gap-2 z-40">
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleTombolBackHeader}
            title="Kembali"
            aria-label="Kembali"
            className="cursor-pointer w-9 h-9 rounded-lg hover:bg-[#F4F5F7] flex items-center justify-center text-[#14141F] transition"
          >
            <FlatIcon name="chevronLeft" className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 min-w-0 max-w-[175px] sm:max-w-[230px] mx-auto">
          <select
            value={selectedPersonaHeader}
            onChange={(e) => setSelectedPersonaHeader(e.target.value)}
            className={`w-full h-9 pl-3 pr-7 rounded-lg bg-[#F4F5F7] border border-[#E2E8F0] text-[16px] sm:text-xs font-bold truncate appearance-none cursor-pointer focus:outline-none focus:border-[#14141F] ${
              selectedPersonaHeader ? "text-[#14141F]" : "text-[#64748B]"
            }`}
          >
            <option value="">Pilih Persona</option>
            {semuaOpsiPersonaHeader.map((ak) => (
              <option key={ak} value={ak} className="text-[#14141F]">
                {ak}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B]">
            <FlatIcon name="chevronDown" className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveMenu("topup")}
            className="cursor-pointer flex items-center gap-1 bg-[#D4F34A] hover:bg-[#C5E738] text-[#14141F] px-3 py-1.5 rounded-full text-xs font-extrabold tabular-nums active:scale-95 transition"
          >
            <FlatIcon name="plusCircle" className="w-3.5 h-3.5" />
            <span>{coins.toLocaleString("id-ID")} KOIN</span>
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 w-full overflow-y-auto overscroll-contain px-3 pt-2.5 pb-24">
        <div className={activeMenu === "dna" ? "block" : "hidden"}>
          <PersonaDNAView
            userId={userId}
            isPremiumUser={statusVIPFinal}
            kuotaAkunMaksimal={kuotaAkunMaksimal}
            namaPaketAktif={namaPaketAktif}
            onTriggerUpgradeVIP={() => setActiveMenu("topup")}
            profil={profil}
            setProfil={setProfil}
            rawWritingSamples={rawWritingSamples}
            setRawWritingSamples={setRawWritingSamples}
            personaProfile={personaProfile}
            setPersonaProfile={setPersonaProfile}
            bentukKonten={bentukKonten}
            setBentukKonten={setBentukKonten}
            SEPULUH_BENTUK_KONTEN={SEPULUH_BENTUK_KONTEN}
            setModeTampilanSkrip={setModeTampilanSkrip}
            simpanPersonaKeSupabase={simpanPersonaKeSupabase}
            setActiveMenu={setActiveMenu}
            showToast={showToast}
            customPrompts={customPrompts}
          />
        </div>

        {/* MENU "NICHE": ANALISA NICHE (IKIGAI), ASESMEN/EDITOR NASKAH, & EKSTRAK VIDEO */}
        <div className={activeMenu === "niche" ? "block" : "hidden"}>
          <div className="max-w-3xl mx-auto mb-3 bg-white rounded-2xl p-1.5 border border-[#E2E8F0] grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setSubTabNiche("ikigai")}
              className={`cursor-pointer h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                subTabNiche === "ikigai"
                  ? "bg-[#14141F] text-[#D4F34A]"
                  : "bg-[#F4F5F7] text-[#14141F]"
              }`}
            >
              <FlatIcon name="compass" className="w-4 h-4" />
              <span>Profil Niche</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTabNiche("produksi")}
              className={`cursor-pointer h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                subTabNiche === "produksi"
                  ? "bg-[#14141F] text-[#D4F34A]"
                  : "bg-[#F4F5F7] text-[#14141F]"
              }`}
            >
              <FlatIcon name="edit" className="w-4 h-4" />
              <span>Editor Naskah</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTabNiche("ekstrak")}
              className={`cursor-pointer h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                subTabNiche === "ekstrak"
                  ? "bg-[#14141F] text-[#D4F34A]"
                  : "bg-[#F4F5F7] text-[#14141F]"
              }`}
            >
              <FlatIcon name="mic" className="w-4 h-4" />
              <span>Ekstrak Video</span>
            </button>
          </div>

          <div className={subTabNiche === "ikigai" ? "block" : "hidden"}>
            <NicheProfilingView
              userId={userId}
              namaUser={profil.nama}
              namaPaketAktif={namaPaketAktif}
              nominalPaketAktif={nominalPaketAktif}
              expiredAt={expiredAt}
              isAdmin={isAdminAccount}
              aiModel1={
                pengaturanPayment.aiModel1 ||
                pengaturanPayment.preferredModel ||
                "anthropic/claude-3.5-haiku"
              }
              onUpgradeClick={() => {
                setTabMenuKoin("beli_paket")
                setActiveMenu("topup")
              }}
              onUseTopicForScript={handleGunakanTopikNicheKeNaskah}
              onProfileUpdated={(profBaru) =>
                terapkanPreFillDariProfilNiche(profBaru)
              }
              showToast={showToast}
            />
          </div>

          <div className={subTabNiche === "produksi" ? "block" : "hidden"}>
            <ScriptProducerView
              userId={userId}
              namaUser={profil.nama}
              isPremiumUser={statusVIPFinal}
              kuotaAkunMaksimal={kuotaAkunMaksimal}
              onTriggerUpgradeVIP={() => setActiveMenu("topup")}
              coins={coins}
              updateKoinDatabase={updateKoinDatabase}
              personaProfile={personaProfile}
              setPersonaProfile={setPersonaProfile}
              simpanPersonaKeSupabase={simpanPersonaKeSupabase}
              bentukKonten={bentukKonten}
              setBentukKonten={setBentukKonten}
              bentukKontenFinal={bentukKonten}
              daftar10IdeTopik={daftar10IdeTopik}
              setDaftar10IdeTopik={setDaftar10IdeTopik}
              simpanAtauUpdateSkripDatabase={simpanAtauUpdateSkripDatabase}
              setKoleksiSkripTersimpan={setKoleksiSkripTersimpan}
              hasilSkrip={hasilSkrip}
              setHasilSkrip={setHasilSkrip}
              stage={stage}
              setStage={setStage}
              setActiveMenu={setActiveMenu}
              showToast={showToast}
              customPrompts={customPrompts}
              SEPULUH_BENTUK_KONTEN={SEPULUH_BENTUK_KONTEN}
              setModeTeleprompter={setModeTeleprompter}
              modeTampilanSkrip={modeTampilanSkrip}
              onRefreshDataUser={() => muatUlangDataSupabase(userId)}
            />
          </div>

          <div className={subTabNiche === "ekstrak" ? "block" : "hidden"}>
            <VideoExtractorView
              userId={userId}
              namaUser={profil.nama}
              isPremiumUser={statusVIPFinal}
              onTriggerUpgradeVIP={() => setActiveMenu("topup")}
              coins={coins}
              updateKoinDatabase={updateKoinDatabase}
              personaProfile={personaProfile}
              bentukKontenFinal={bentukKonten}
              simpanAtauUpdateSkripDatabase={simpanAtauUpdateSkripDatabase}
              setKoleksiSkripTersimpan={setKoleksiSkripTersimpan}
              setHasilSkrip={setHasilSkrip}
              setStage={setStage}
              setActiveMenu={setActiveMenu}
              showToast={showToast}
            />
          </div>
        </div>

        {/* MENU UTAMA CHAT PER TOPIK */}
        <div className={activeMenu === "chat" ? "block" : "hidden"}>
          <BrainstormView
            key={prefillTopicFromNiche || "default_brainstorm"}
            userId={userId}
            namaUser={profil.nama}
            isPremiumUser={statusVIPFinal}
            kuotaAkunMaksimal={kuotaAkunMaksimal}
            onTriggerUpgradeVIP={() => setActiveMenu("topup")}
            coins={coins}
            updateKoinDatabase={updateKoinDatabase}
            personaProfile={personaProfile}
            aiModel1={
              pengaturanPayment.aiModel1 ||
              pengaturanPayment.preferredModel ||
              "anthropic/claude-3.5-haiku"
            }
            aiModel2={
              pengaturanPayment.aiModel2 ||
              pengaturanPayment.preferredModel ||
              "anthropic/claude-3.5-sonnet"
            }
            selectedPersonaHeader={selectedPersonaHeader}
            setSelectedPersonaHeader={setSelectedPersonaHeader}
            bentukKontenFinal={bentukKonten}
            simpanAtauUpdateSkripDatabase={simpanAtauUpdateSkripDatabase}
            setKoleksiSkripTersimpan={setKoleksiSkripTersimpan}
            setHasilSkrip={setHasilSkrip}
            setStage={setStage}
            setActiveMenu={setActiveMenu}
            showToast={showToast}
            onRefreshDataUser={() => muatUlangDataSupabase(userId)}
            isInsideChatRoom={isInsideChatRoom}
            setIsInsideChatRoom={setIsInsideChatRoom}
          />
        </div>

        {/* MENU KALENDER & ARSIP NASKAH */}
        {activeMenu === "kalender" && (
          <div className="max-w-3xl mx-auto space-y-3.5 pb-8">
            <div className="bg-white rounded-2xl p-1.5 border border-[#E2E8F0] grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => ubahSubTabKalender("arsip")}
                className={`cursor-pointer h-10 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  subTabKalender === "arsip"
                    ? "bg-[#14141F] text-[#D4F34A]"
                    : "bg-[#F4F5F7] text-[#14141F]"
                }`}
              >
                <FlatIcon name="folder" className="w-4 h-4" />
                <span>Arsip Naskah ({koleksiSkripTersimpan.length})</span>
              </button>

              <button
                type="button"
                onClick={() => ubahSubTabKalender("jadwal")}
                className={`cursor-pointer h-10 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  subTabKalender === "jadwal"
                    ? "bg-[#14141F] text-[#D4F34A]"
                    : "bg-[#F4F5F7] text-[#14141F]"
                }`}
              >
                <FlatIcon name="calendar" className="w-4 h-4" />
                <span>Jadwal Kalender ({jmlTerjadwal})</span>
              </button>
            </div>

            {subTabKalender === "arsip" && (
              <div className="space-y-3.5">
                <section className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-lg font-bold text-[#14141F]">
                        Arsip Naskah Tersimpan
                      </h1>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setUrutkanArsipTerbaru(!urutkanArsipTerbaru)
                      }
                      className="cursor-pointer px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-bold shrink-0"
                    >
                      {urutkanArsipTerbaru ? "Terbaru" : "Terlama"}
                    </button>
                  </div>

                  <div className="relative w-full">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]">
                      <FlatIcon name="search" className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={keywordCariArsip}
                      onChange={(e) => setKeywordCariArsip(e.target.value)}
                      placeholder="Ketik kata kunci judul atau isi materi..."
                      className="w-full h-11 pl-10 pr-16 bg-white rounded-xl border border-[#E2E8F0] text-[16px] sm:text-sm focus:border-[#14141F] focus:outline-none"
                    />
                  </div>
                </section>

                {arsipTerfilter.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center text-xs text-[#64748B]">
                    Belum ada naskah skrip tersimpan.
                  </div>
                ) : (
                  <section className="space-y-3">
                    {arsipTerfilter.map((item) => {
                      const sedangEditJudulIni = editingArsipId === item.id
                      return (
                        <article
                          key={item.id}
                          className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-[#64748B]">
                              {item.waktuDibuat}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleFavoritArsip(item)}
                                className={`cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center ${
                                  item.isStarred
                                    ? "text-[#14141F] bg-[#D4F34A]"
                                    : "text-[#64748B] hover:bg-[#F4F5F7]"
                                }`}
                              >
                                <FlatIcon name="star" className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setTargetHapusSkrip(item)}
                                className="cursor-pointer w-8 h-8 rounded-lg text-[#EF4444] hover:bg-[#FEF2F2] flex items-center justify-center"
                              >
                                <FlatIcon name="trash" className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            {sedangEditJudulIni ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={inputJudulArsipBaru}
                                  onChange={(e) =>
                                    setInputJudulArsipBaru(e.target.value)
                                  }
                                  className="flex-1 h-9 px-3 rounded-lg border border-[#14141F] text-[16px] sm:text-xs font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSimpanEditJudulArsip(item)
                                  }
                                  className="cursor-pointer h-9 px-3 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold"
                                >
                                  Simpan
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <h2 className="text-sm font-bold text-[#14141F]">
                                  {item.judul}
                                </h2>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingArsipId(item.id)
                                    setInputJudulArsipBaru(item.judul || "")
                                  }}
                                  className="cursor-pointer px-2 py-1 rounded bg-[#F4F5F7] text-[11px] font-bold"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setHasilSkrip(item)
                                setStage(5)
                                setActiveMenu("produksi")
                              }}
                              className="cursor-pointer inline-flex items-center gap-1.5 bg-[#D4F34A] text-[#14141F] rounded-lg px-3.5 py-2 text-xs font-bold"
                            >
                              <span>Buka Naskah</span>
                              <FlatIcon
                                name="arrowRight"
                                className="w-3.5 h-3.5"
                              />
                            </button>
                          </div>
                        </article>
                      )
                    })}
                  </section>
                )}
              </div>
            )}

            {subTabKalender === "jadwal" && (
              <div className="space-y-3.5">
                <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#14141F]">
                      Kalender Konten
                    </span>
                    <div className="flex items-center gap-1 bg-[#F4F5F7] px-2 py-1 rounded-lg border border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => {
                          if (kalenderBulan === 0) {
                            setKalenderBulan(11)
                            setKalenderTahun((y) => y - 1)
                          } else {
                            setKalenderBulan((m) => m - 1)
                          }
                        }}
                        className="cursor-pointer w-7 h-7 flex items-center justify-center rounded hover:bg-white"
                      >
                        <FlatIcon name="chevronLeft" className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold px-2">
                        {NAMA_BULAN_ID[kalenderBulan]} {kalenderTahun}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (kalenderBulan === 11) {
                            setKalenderBulan(0)
                            setKalenderTahun((y) => y + 1)
                          } else {
                            setKalenderBulan((m) => m + 1)
                          }
                        }}
                        className="cursor-pointer w-7 h-7 flex items-center justify-center rounded hover:bg-white"
                      >
                        <FlatIcon name="chevronRight" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-[#64748B] py-1">
                    {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map(
                      (d) => (
                        <div key={d}>{d}</div>
                      ),
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {gridHariKalender.map((cell, idx) => {
                      if (!cell)
                        return <div key={`e_${idx}`} className="h-10" />
                      const aktif = tanggalKalenderTerpilih === cell.iso
                      const skripHariIni = koleksiSkripTersimpan.filter(
                        (s) => s.tanggalUpload === cell.iso,
                      )

                      return (
                        <button
                          key={cell.iso}
                          type="button"
                          onClick={() => setTanggalKalenderTerpilih(cell.iso)}
                          className={`cursor-pointer h-10 flex flex-col items-center justify-center rounded-lg relative transition ${
                            aktif
                              ? "bg-[#14141F] text-white font-bold"
                              : skripHariIni.length > 0
                                ? "bg-[#F4F5F7] text-[#14141F] font-bold border border-[#E2E8F0]"
                                : "hover:bg-[#F4F5F7] text-[#14141F]"
                          }`}
                        >
                          <span>{cell.hari}</span>
                          {skripHariIni.length > 0 && (
                            <span className="absolute top-0.5 right-0.5 text-[9px] font-bold px-1 bg-[#D4F34A] text-[#14141F] rounded-full leading-tight">
                              {skripHariIni.length}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] space-y-3">
                  <span className="text-sm font-bold text-[#14141F] block">
                    Jadwalkan Naskah ke {tanggalKalenderTerpilih} (
                    {namaHariTerpilih})
                  </span>

                  <select
                    value={idSkripPlotTerpilih}
                    onChange={(e) => setIdSkripPlotTerpilih(e.target.value)}
                    className="w-full h-11 bg-[#F4F5F7] border border-[#E2E8F0] rounded-lg px-3 text-[16px] sm:text-xs font-bold text-[#14141F] focus:outline-none"
                  >
                    <option value="">-- Pilih Skrip Tersimpan --</option>
                    {koleksiSkripTersimpan.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.judul}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {EMPAT_JENDELA_WAKTU.map((jw) => {
                      const aktif = jamPublikasiInput === jw.jam
                      return (
                        <button
                          key={jw.id}
                          type="button"
                          onClick={() => setJamPublikasiInput(jw.jam)}
                          className={`cursor-pointer p-2.5 rounded-lg border text-left text-xs transition ${
                            aktif
                              ? "bg-[#14141F] text-[#D4F34A] border-[#14141F] font-bold"
                              : "bg-[#F4F5F7] text-[#14141F] border-[#E2E8F0]"
                          }`}
                        >
                          <div className="font-bold">{jw.label}</div>
                          <div className="text-[10px] opacity-80">
                            {jw.rentang}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handlePlotSkripKeKalender}
                    className="cursor-pointer w-full h-11 bg-[#D4F34A] text-[#14141F] font-bold text-xs rounded-lg flex items-center justify-center gap-2"
                  >
                    <FlatIcon name="calendar" className="w-4 h-4" />
                    <span>
                      Jadwalkan ke {tanggalKalenderTerpilih} (
                      {jamPublikasiInput})
                    </span>
                  </button>
                </div>

                <div className="space-y-2">
                  {daftarSkripTanggalTerpilih.map((sk) => (
                    <div
                      key={sk.id}
                      className="bg-white rounded-2xl p-3.5 border border-[#E2E8F0] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded bg-[#D4F34A] text-[#14141F] font-bold">
                            {sk.jamPublikasi || "20:15 WIB"}
                          </span>
                          <span className="text-[#64748B] truncate">
                            {sk.bentuk}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#14141F] truncate">
                          {sk.judul}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setHasilSkrip(sk)
                            setStage(5)
                            setActiveMenu("produksi")
                          }}
                          className="cursor-pointer px-3 h-9 rounded-lg bg-[#F4F5F7] text-xs font-bold"
                        >
                          Buka
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLepasJadwalKalender(sk)}
                          className="cursor-pointer px-3 h-9 rounded-lg bg-[#FEF2F2] text-[#EF4444] text-xs font-bold"
                        >
                          Lepas
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB SETTING */}
        {activeMenu === "setting" && (
          <div className="max-w-2xl mx-auto space-y-5 pb-10">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                  WORKSPACE KREATOR
                </span>
                <h1 className="text-xl font-bold text-[#14141F]">
                  Pengaturan & Akun
                </h1>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#D4F34A] text-[#14141F] text-xs font-extrabold">
                {namaPaketAktif}
              </span>
            </div>

            <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3.5">
              <div className="flex items-center gap-3.5">
                <label className="cursor-pointer relative w-14 h-14 rounded-full bg-[#14141F] text-[#D4F34A] flex items-center justify-center font-extrabold text-lg shrink-0 overflow-hidden border-2 border-[#14141F]">
                  {profil.avatar_url ? (
                    <img
                      src={profil.avatar_url}
                      alt={profil.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(profil.nama || "R")[0].toUpperCase()}</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const reader = new FileReader()
                      reader.onload = (ev) =>
                        setRawCropImageSrc(ev.target.result)
                      reader.readAsDataURL(f)
                    }}
                    className="hidden"
                  />
                </label>

                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-[#14141F] truncate">
                    {profil.nama}
                  </h2>
                  <div className="text-xs font-semibold text-[#64748B]">
                    @{profil.username || "creator"}
                  </div>
                  <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                    {profil.kontak}
                  </div>
                </div>
              </div>

              <div className="bg-[#F4F5F7] rounded-xl p-3.5 border border-[#E2E8F0] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D4F34A] text-[#14141F] flex items-center justify-center shrink-0">
                    <FlatIcon name="coin" className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      HOOKYA COINS
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-extrabold text-[#14141F] tabular-nums">
                        {coins.toLocaleString("id-ID")}
                      </span>
                      <span className="text-xs font-semibold text-[#64748B]">
                        Koin Aktif ({sisaHariPaket} Hari)
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveMenu("topup")}
                  className="cursor-pointer h-10 px-3.5 rounded-xl bg-[#14141F] text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  <FlatIcon
                    name="plusCircle"
                    className="w-4 h-4 text-[#D4F34A]"
                  />
                  <span>Top Up</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveMenu("dna")}
                className="cursor-pointer w-full h-11 rounded-xl bg-[#F4F5F7] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#14141F] text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <FlatIcon name="sliders" className="w-4 h-4" />
                <span>Edit Profil & Persona Kreator</span>
              </button>
            </section>

            <section className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] px-1 block">
                VAULT & PENYIMPANAN DATABASE
              </span>
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#14141F]">
                      Penggunaan Database Riwayat Konten
                    </span>
                    <span className="text-[#64748B] font-semibold">
                      {formatUkuranStorage(totalBytesArsipDB)} /{" "}
                      {statusVIPFinal ? "5.00 MB" : "2.00 MB"} (
                      {persenVaultNaskah}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F4F5F7] overflow-hidden border border-[#E2E8F0]">
                    <div
                      style={{ width: `${persenVaultNaskah}%` }}
                      className="h-full bg-[#D4F34A]"
                    />
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-[#14141F]">
                      Bersihkan Penyimpanan Berdasarkan Riwayat
                    </div>
                    <div className="text-xs text-[#64748B]">
                      {koleksiSkripTersimpan.length} naskah tersimpan
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setShowCleanerInSetting(!showCleanerInSetting)
                    }
                    className="cursor-pointer h-9 px-3 rounded-lg bg-[#F4F5F7] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-xs font-bold text-[#14141F]"
                  >
                    {showCleanerInSetting ? "Tutup" : "Kelola Riwayat"}
                  </button>
                </div>

                {showCleanerInSetting && (
                  <div className="pt-2 border-t border-[#E2E8F0] space-y-2 max-h-56 overflow-y-auto pr-1">
                    {koleksiSkripTersimpan.map((sk) => (
                      <div
                        key={sk.id}
                        className="p-2.5 rounded-lg bg-[#F4F5F7] border border-[#E2E8F0] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[#14141F] truncate">
                            {sk.judul}
                          </div>
                          <div className="text-[10px] text-[#64748B]">
                            {sk.waktuDibuat} •{" "}
                            {formatUkuranStorage(hitungUkuranBytesObjek(sk))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTargetHapusSkrip(sk)}
                          className="cursor-pointer px-2.5 py-1.5 rounded bg-[#FEF2F2] text-[#EF4444] font-bold text-[11px] shrink-0"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] px-1 block">
                SISTEM & DEVELOPER CONSOLE
              </span>
              <div className="bg-white rounded-2xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setTabMenuKoin("rincian_koin")
                    setActiveMenu("topup")
                  }}
                  className="cursor-pointer w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#F4F5F7]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F4F5F7] flex items-center justify-center text-[#14141F]">
                      <FlatIcon name="coin" className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#14141F]">
                        Rincian Penggunaan Koin & Refund
                      </div>
                      <div className="text-xs text-[#64748B]">
                        Cek waktu pemakaian koin dan pengembalian otomatis
                      </div>
                    </div>
                  </div>
                  <FlatIcon
                    name="chevronRight"
                    className="w-4 h-4 text-[#64748B]"
                  />
                </button>

                {isAdminAccount && (
                  <button
                    type="button"
                    onClick={() => setShowPinModal(true)}
                    className="cursor-pointer w-full p-3.5 flex items-center justify-between gap-3 text-left bg-[#D4F34A]/25 hover:bg-[#D4F34A]/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#14141F] text-[#D4F34A] flex items-center justify-center">
                        <FlatIcon name="code" className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#14141F]">
                          Buka Developer Console (Dual AI & Duitku Sandbox)
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          AI 1:{" "}
                          {(pengaturanPayment.aiModel1 || "claude-3.5-haiku")
                            .split("/")
                            .pop()}{" "}
                          • AI 2:{" "}
                          {(pengaturanPayment.aiModel2 || "claude-3.5-sonnet")
                            .split("/")
                            .pop()}
                        </div>
                      </div>
                    </div>
                    <FlatIcon
                      name="chevronRight"
                      className="w-4 h-4 text-[#14141F]"
                    />
                  </button>
                )}
              </div>
            </section>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("hookya_active_user_id")
                  sessionStorage.removeItem("hookya_active_view_mode")
                }
                ubahViewModeStabil("auth")
              }}
              className="cursor-pointer w-full h-11 rounded-xl bg-[#FFECEC] hover:bg-[#FFD8D8] text-[#BA1A1A] font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Keluar dari Akun Hookya</span>
            </button>
          </div>
        )}

        {/* MENU TOPUP KOIN */}
        {activeMenu === "topup" && (
          <div className="max-w-xl mx-auto space-y-4 pb-8">
            <h1 className="text-xl font-bold text-[#14141F]">
              Paket Koin & Riwayat Pemakaian
            </h1>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setTabMenuKoin("beli_paket")}
                className={`cursor-pointer h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  tabMenuKoin === "beli_paket"
                    ? "bg-[#14141F] text-[#D4F34A]"
                    : "bg-[#F4F5F7] text-[#14141F]"
                }`}
              >
                <FlatIcon name="bag" className="w-4 h-4" />
                <span>Beli Paket & Voucher</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTabMenuKoin("rincian_koin")
                  muatUlangDataSupabase(userId)
                }}
                className={`cursor-pointer h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  tabMenuKoin === "rincian_koin"
                    ? "bg-[#14141F] text-[#D4F34A]"
                    : "bg-[#F4F5F7] text-[#14141F]"
                }`}
              >
                <FlatIcon name="clock" className="w-4 h-4" />
                <span>Rincian Penggunaan Koin</span>
                {jumlahLogGagalRefund > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px]">
                    {jumlahLogGagalRefund}
                  </span>
                )}
              </button>
            </div>

            {tabMenuKoin === "beli_paket" && (
              <>
                <section className="bg-white rounded-2xl p-4 border border-[#E2E8F0] space-y-2">
                  <label className="text-xs font-bold text-[#14141F] block">
                    Punya Kode Voucher / Kupon Promo?
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={inputKodeVoucherUser}
                      onChange={(e) =>
                        setInputKodeVoucherUser(e.target.value.toUpperCase())
                      }
                      placeholder="MASUKKAN KODE VOUCHER..."
                      className="flex-1 h-11 bg-[#F4F5F7] border border-[#E2E8F0] rounded-xl px-3.5 text-[16px] sm:text-xs font-bold font-mono uppercase focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleKlaimVoucherUser}
                      className="cursor-pointer h-11 px-4 bg-[#D4F34A] text-[#14141F] text-xs font-bold rounded-xl shrink-0"
                    >
                      Klaim Voucher
                    </button>
                  </div>
                </section>

                <div className="space-y-3.5">
                  {DAFTAR_PAKET_KOIN.map((pk) => {
                    const isHighlighted = Boolean(
                      pk.populer || pk.bestValue || pk.agency,
                    )
                    const hargaPerKoin = Math.round(pk.nominalAngka / pk.koin)

                    return (
                      <article
                        key={pk.nama}
                        className={`bg-white rounded-2xl p-4 sm:p-5 relative overflow-hidden space-y-3.5 transition ${
                          isHighlighted
                            ? "border-2 border-[#14141F]"
                            : "border border-[#E2E8F0]"
                        }`}
                      >
                        {(pk.populer || pk.bestValue || pk.agency) && (
                          <div className="absolute top-0 right-0 bg-[#14141F] text-[#D4F34A] px-3 py-1 rounded-bl-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                            <FlatIcon name="bolt" className="w-3 h-3" />
                            <span>
                              {pk.populer
                                ? "POPULER"
                                : pk.bestValue
                                  ? "BEST VALUE"
                                  : "ULTIMATE"}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          {!isHighlighted ? (
                            <span className="px-2.5 py-0.5 rounded-md bg-[#EDEFF0] text-[#14141F] text-[10px] font-extrabold uppercase tracking-wider">
                              {pk.tier}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#556500]">
                              <FlatIcon name="user" className="w-3.5 h-3.5" />
                              <span>{pk.kuotaAkun} Akun Sosmed</span>
                            </span>
                          )}

                          {!isHighlighted && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#556500]">
                              <FlatIcon name="user" className="w-3.5 h-3.5" />
                              <span>{pk.kuotaAkun} Akun Sosmed</span>
                            </span>
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base sm:text-lg font-extrabold text-[#14141F]">
                              {pk.nama}
                            </h3>
                            {pk.isVIP && (
                              <FlatIcon
                                name="checkCircle"
                                className="w-4 h-4 text-[#14141F]"
                              />
                            )}
                          </div>
                          <p className="text-xs text-[#64748B]">
                            {pk.subjudul}
                          </p>
                        </div>

                        <div className="bg-[#F4F5F7] rounded-xl p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isHighlighted
                                  ? "bg-[#14141F] text-[#D4F34A]"
                                  : "bg-[#E6F48C] text-[#556500]"
                              }`}
                            >
                              <FlatIcon name="coin" className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-extrabold text-[#14141F] tabular-nums leading-none">
                                  {pk.koin}
                                </span>
                                <span className="text-xs font-bold text-[#556500]">
                                  Koin
                                </span>
                              </div>
                              <span className="text-[11px] text-[#64748B] block mt-0.5">
                                Rp {hargaPerKoin.toLocaleString("id-ID")} / koin
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] text-[#64748B] block">
                              Harga
                            </span>
                            <span className="text-base sm:text-lg font-extrabold text-[#14141F] tabular-nums">
                              {pk.harga}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-0.5">
                          {(pk.fiturList || []).map((ft, fIdx) => (
                            <div
                              key={fIdx}
                              className="flex items-center gap-2 text-xs text-[#14141F]"
                            >
                              <FlatIcon
                                name="checkCircle"
                                className={`w-4 h-4 shrink-0 ${
                                  isHighlighted
                                    ? "text-[#14141F]"
                                    : "text-[#556500]"
                                }`}
                              />
                              <span
                                className={
                                  fIdx === 0 && isHighlighted
                                    ? "font-bold"
                                    : "font-medium text-[#47464C]"
                                }
                              >
                                {ft}
                              </span>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => bukaLayarCheckoutPaket(pk)}
                          className={`cursor-pointer w-full h-11 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-[0.99] ${
                            isHighlighted
                              ? "bg-[#14141F] text-[#D4F34A]"
                              : "bg-[#EDEFF0] hover:bg-[#E2E8F0] text-[#14141F]"
                          }`}
                        >
                          <span>
                            {isHighlighted
                              ? "Beli Paket Populer"
                              : "Pilih Paket"}
                          </span>
                          <FlatIcon
                            name={isHighlighted ? "bolt" : "chevronRight"}
                            className="w-4 h-4"
                          />
                        </button>
                      </article>
                    )
                  })}
                </div>
              </>
            )}

            {tabMenuKoin === "rincian_koin" && (
              <div className="space-y-3">
                {semuaRiwayatKoinUser.map((logItem, idx) => {
                  const isGagalRefund = logItem.status === "gagal_refund"
                  const delta = Number(logItem.koinDelta) || 0
                  return (
                    <div
                      key={logItem.id || idx}
                      className="bg-white rounded-2xl p-3.5 border border-[#E2E8F0] flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-[#14141F]">
                          {logItem.action}
                        </div>
                        <div className="text-[#64748B]">{logItem.detail}</div>
                        <div className="text-[11px] text-[#64748B]">
                          {logItem.waktu}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-md font-mono font-bold shrink-0 ${
                          isGagalRefund
                            ? "bg-[#D4F34A] text-[#14141F]"
                            : delta < 0
                              ? "bg-[#14141F] text-[#D4F34A]"
                              : "bg-[#F4F5F7] text-[#14141F]"
                        }`}
                      >
                        {delta > 0 ? `+${delta}` : delta} Koin
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR WARNA PUTIH — MENU "NICHE" MENGGANTIKAN "ASESMEN" */}
      {!sembunyikanBottomNav && (
        <div className="fixed bottom-3 left-4 right-4 z-40 pointer-events-none flex justify-center">
          <nav className="pointer-events-auto bg-white text-[#14141F] rounded-full px-2.5 py-1.5 border border-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.06)] w-full max-w-md flex items-center justify-around">
            <button
              type="button"
              onClick={() => setActiveMenu("niche")}
              className={`cursor-pointer flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition ${
                activeMenu === "niche"
                  ? "bg-[#D4F34A] text-[#14141F] font-extrabold"
                  : "text-[#64748B] hover:text-[#14141F] font-semibold"
              }`}
            >
              <FlatIcon name="compass" className="w-5 h-5" />
              <span className="text-[11px] mt-0.5">Niche</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu("kalender")}
              className={`cursor-pointer flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition ${
                activeMenu === "kalender"
                  ? "bg-[#D4F34A] text-[#14141F] font-extrabold"
                  : "text-[#64748B] hover:text-[#14141F] font-semibold"
              }`}
            >
              <FlatIcon name="calendar" className="w-5 h-5" />
              <span className="text-[11px] mt-0.5">Kalender</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsInsideChatRoom(false)
                setActiveMenu("chat")
              }}
              className={`cursor-pointer flex flex-col items-center justify-center px-5 py-1.5 rounded-full transition ${
                activeMenu === "chat"
                  ? "bg-[#D4F34A] text-[#14141F] font-extrabold"
                  : "text-[#64748B] hover:text-[#14141F] font-semibold"
              }`}
            >
              <FlatIcon name="chat" className="w-5 h-5" />
              <span className="text-[11px] mt-0.5">Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu("setting")}
              className={`cursor-pointer flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition ${
                activeMenu === "setting" || activeMenu === "dna"
                  ? "bg-[#D4F34A] text-[#14141F] font-extrabold"
                  : "text-[#64748B] hover:text-[#14141F] font-semibold"
              }`}
            >
              <FlatIcon name="settings" className="w-5 h-5" />
              <span className="text-[11px] mt-0.5">Setting</span>
            </button>
          </nav>
        </div>
      )}

      {/* MODAL CHECKOUT: MENDUKUNG DUITKU SANDBOX OTOMATIS & QRIS MANUAL */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-[#14141F]/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-[#14141F] w-full max-w-md rounded-2xl p-5 space-y-4 border border-[#14141F]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[10px] font-bold bg-[#D4F34A] text-[#14141F] px-2 py-0.5 rounded-md">
                  Invoice #
                  {duitkuInvoiceResult?.invoiceId || checkoutModal.invoiceId}
                </span>
                <h3 className="text-base font-bold mt-0.5">
                  {checkoutModal.namaPaket} (+{checkoutModal.koin} Koin)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckoutModal(null)
                  setDuitkuInvoiceResult(null)
                }}
                className="cursor-pointer w-8 h-8 rounded-lg bg-[#F4F5F7] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {pengaturanPayment.modePembayaranAktif !== "qris_manual" ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#14141F]">
                      Metode Pembayaran Duitku Sandbox:
                    </span>
                    <span className="text-base font-extrabold text-[#14141F]">
                      Rp {checkoutModal.nominalAsli.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <select
                    value={duitkuPaymentMethod}
                    onChange={(e) => setDuitkuPaymentMethod(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-[#E2E8F0] text-xs font-bold text-[#14141F]"
                  >
                    <option value="SP">
                      QRIS (ShopeePay / GoPay / Dana / BCA)
                    </option>
                    <option value="BV">BCA Virtual Account</option>
                    <option value="M2">Mandiri Virtual Account</option>
                    <option value="BR">BRI Virtual Account</option>
                    <option value="B1">BNI Virtual Account</option>
                    <option value="OV">OVO</option>
                  </select>
                </div>

                {!duitkuInvoiceResult ? (
                  <button
                    type="button"
                    disabled={sedangProsesBayar}
                    onClick={handleBuatInvoiceDuitkuSandbox}
                    className="cursor-pointer w-full h-11 rounded-xl bg-[#D4F34A] text-[#14141F] font-extrabold text-xs flex items-center justify-center gap-2"
                  >
                    <FlatIcon name="bolt" className="w-4 h-4" />
                    <span>
                      {sedangProsesBayar
                        ? "Membuat Tagihan Duitku..."
                        : "Bayar Otomatis via Duitku Sandbox"}
                    </span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#14141F] space-y-2.5 text-xs">
                    <div className="font-bold text-[#14141F]">
                      Tagihan Duitku Sandbox Siap Dibayar:
                    </div>
                    {duitkuInvoiceResult.vaNumber && (
                      <div className="p-2 rounded bg-white border border-[#E2E8F0] font-mono">
                        Nomor VA:{" "}
                        <strong>{duitkuInvoiceResult.vaNumber}</strong>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <a
                        href={duitkuInvoiceResult.paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-10 rounded-lg bg-[#14141F] text-[#D4F34A] font-bold flex items-center justify-center"
                      >
                        Buka Halaman Pembayaran Duitku
                      </a>
                      <button
                        type="button"
                        disabled={sedangProsesBayar}
                        onClick={handleCekStatusPembayaranDuitku}
                        className="cursor-pointer w-full h-10 rounded-lg bg-[#D4F34A] text-[#14141F] font-extrabold"
                      >
                        {sedangProsesBayar
                          ? "Memeriksa Status..."
                          : "Saya Sudah Bayar (Cek Status Otomatis)"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="bg-[#F4F5F7] p-4 rounded-xl text-center space-y-2 border border-[#E2E8F0]">
                  {pengaturanPayment.qrisImageUrl ? (
                    <img
                      src={pengaturanPayment.qrisImageUrl}
                      alt="QRIS Merchant"
                      className="w-48 h-48 mx-auto rounded-lg object-contain bg-white p-2 border border-[#E2E8F0]"
                    />
                  ) : (
                    <FlatIcon
                      name="qr"
                      className="w-28 h-28 mx-auto text-[#14141F]"
                    />
                  )}
                  <div className="text-2xl font-bold text-[#14141F] tabular-nums">
                    Rp {checkoutModal.nominalBayar.toLocaleString("id-ID")}
                  </div>
                </div>

                <label className="cursor-pointer border border-dashed border-[#E2E8F0] bg-[#F4F5F7] rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#14141F] text-[#D4F34A] flex items-center justify-center shrink-0">
                    <FlatIcon name="upload" className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-xs font-bold text-[#14141F] truncate">
                      {namaFileBukti || "Tap untuk Upload Bukti Transfer"}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadBuktiBayarUser}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  disabled={sedangProsesBayar}
                  onClick={handleKonfirmasiBayarDanKirimWA}
                  className="cursor-pointer w-full bg-[#D4F34A] text-[#14141F] font-bold text-xs py-3 rounded-lg"
                >
                  {sedangProsesBayar ? "Mengirim..." : "Konfirmasi ke WA Admin"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL PIN DEVELOPER CONSOLE */}
      {showPinModal && (
        <div className="fixed inset-0 bg-[#14141F]/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#14141F] w-full max-w-sm rounded-2xl p-6 space-y-4 text-center border border-[#14141F]">
            <h3 className="text-base font-bold">Buka Developer Console</h3>
            <input
              type="password"
              value={inputPinDev}
              onChange={(e) => setInputPinDev(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputPinDev === pinAdminResmi) {
                  setShowPinModal(false)
                  setInputPinDev("")
                  ubahViewModeStabil("dev")
                }
              }}
              placeholder="Masukkan PIN Admin..."
              className="w-full bg-[#F4F5F7] border border-[#E2E8F0] rounded-lg px-4 py-3 text-center text-[16px] sm:text-sm font-bold outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="cursor-pointer w-1/3 bg-[#F4F5F7] font-bold text-xs py-3 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (inputPinDev === pinAdminResmi) {
                    setShowPinModal(false)
                    setInputPinDev("")
                    ubahViewModeStabil("dev")
                  } else {
                    alert("PIN Admin belum sesuai.")
                  }
                }}
                className="cursor-pointer flex-1 bg-[#14141F] text-[#D4F34A] font-bold text-xs py-3 rounded-lg"
              >
                Masuk Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TELEPROMPTER */}
      {modeTeleprompter && hasilSkrip && (
        <div className="fixed inset-0 bg-[#14141F] z-50 flex flex-col justify-between p-6 text-white">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <span className="text-sm font-bold text-[#D4F34A]">
              Teleprompter: {hasilSkrip.judul}
            </span>
            <button
              type="button"
              onClick={() => setModeTeleprompter(false)}
              className="cursor-pointer bg-white/10 px-4 py-2 rounded-lg text-xs font-bold"
            >
              Tutup
            </button>
          </div>
          <div className="max-w-2xl mx-auto my-auto space-y-6 text-center overflow-y-auto py-6">
            {(hasilSkrip.sections || hasilSkrip.segmen || []).map((s, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="text-xs text-[#D4F34A] font-bold">
                  Bagian {s.partNumber || idx + 1} • {s.partTitle} (
                  {s.estimatedSeconds})
                </div>
                <p className="text-xl sm:text-2xl font-bold leading-snug whitespace-pre-line">
                  {s.spokenText || s.voiceover}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
