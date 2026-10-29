"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"
import {
  FlatIcon,
  HookyaLogo,
  AvatarCropModal,
  EMPAT_JENDELA_WAKTU,
  hitungKuotaAkunDariPaket,
  rekamKetikanKeGudangIngatan,
} from "../components/SharedUI"
import AuthFullscreen from "../components/AuthFullscreen"
import PersonaDNAView from "../components/PersonaDNAView"
import ScriptProducerView from "../components/ScriptProducerView"
import VideoExtractorView from "../components/VideoExtractorView"
import BrainstormView from "../components/BrainstormView"
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
    tier: "Starter",
    nama: "Paket 5K",
    harga: "Rp 5.000",
    nominalAngka: 5000,
    koin: 10,
    kuotaAkun: 1,
    isVIP: false,
  },
  {
    tier: "Reguler",
    nama: "Paket 10K",
    harga: "Rp 10.000",
    nominalAngka: 10000,
    koin: 20,
    kuotaAkun: 2,
    isVIP: false,
  },
  {
    tier: "Plus",
    nama: "Paket 15K",
    harga: "Rp 15.000",
    nominalAngka: 15000,
    koin: 30,
    kuotaAkun: 2,
    isVIP: false,
  },
  {
    tier: "VIP",
    nama: "Paket 20K VIP",
    harga: "Rp 20.000",
    nominalAngka: 20000,
    koin: 40,
    kuotaAkun: 2,
    isVIP: true,
    populer: true,
  },
  {
    tier: "VIP Tier 1",
    nama: "Paket 25K VIP",
    harga: "Rp 25.000",
    nominalAngka: 25000,
    koin: 55,
    kuotaAkun: 3,
    isVIP: true,
  },
  {
    tier: "Pro",
    nama: "Paket 50K VIP",
    harga: "Rp 50.000",
    nominalAngka: 50000,
    koin: 120,
    kuotaAkun: 5,
    isVIP: true,
    bestValue: true,
  },
  {
    tier: "Agensi / Studio",
    nama: "Paket 90K VIP",
    harga: "Rp 90.000",
    nominalAngka: 90000,
    koin: 230,
    kuotaAkun: 10,
    isVIP: true,
    agency: true,
    ket: "Ideal untuk content agency, social media manager, dan batch content creation multi-client.",
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
  // SELURUH DEKLARASI STATE DILETAKKAN DI ATAS SEBELUM USEEFFECT
  const [viewMode, setViewMode] = useState("auth")
  const [activeMenu, setActiveMenuState] = useState("chat")
  const [stage, setStageState] = useState(0)
  const [subTabKalender, setSubTabKalender] = useState("jadwal")
  const [subTabAsesmen, setSubTabAsesmen] = useState("produksi")
  const [modeTeleprompter, setModeTeleprompter] = useState(false)

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showUpgradeVIPModal, setShowUpgradeVIPModal] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [inputPinDev, setInputPinDev] = useState("")
  const [pinAdminResmi, setPinAdminResmi] = useState("123456")

  const [targetHapusSkrip, setTargetHapusSkrip] = useState(null)
  const [sedangMenghapusSkrip, setSedangMenghapusSkrip] = useState(false)

  const [userId, setUserId] = useState(null)
  const [userRole, setUserRole] = useState("user")
  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const [expiredAt, setExpiredAt] = useState(null)
  const [sisaHariPaket, setSisaHariPaket] = useState(28)
  const [namaPaketAktif, setNamaPaketAktif] = useState("Paket 25K VIP")
  const [kuotaAkunMaksimal, setKuotaAkunMaksimal] = useState(3)
  const [coins, setCoins] = useState(20)
  const [toastMsg, setToastMsg] = useState("")
  const [rawCropImageSrc, setRawCropImageSrc] = useState(null)

  // Preferensi halaman Setting (sesuai screen3.png)
  const [autoHookFormula, setAutoHookFormula] = useState(true)
  const [autoArchiveNaskah, setAutoArchiveNaskah] = useState(true)
  const [ukuranCacheLokal, setUkuranCacheLokal] = useState("1.4 MB")

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

  // State Arsip & Kalender 4 Jendela Waktu
  const [keywordCariArsip, setKeywordCariArsip] = useState("")
  const [filterArsipPill, setFilterArsipPill] = useState("all")
  const [urutkanArsipTerbaru, setUrutkanArsipTerbaru] = useState(true)
  const [folderTerbukaMap, setFolderTerbukaMap] = useState({})
  const [pilihanGandakanArsip, setPilihanGandakanArsip] = useState({})
  const [multiplyingArchiveId, setMultiplyingArchiveId] = useState(null)
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

  // State Top-Up & Riwayat Penggunaan Koin
  const [tabMenuKoin, setTabMenuKoin] = useState("beli_paket")
  const [filterRiwayatKoin, setFilterRiwayatKoin] = useState("semua")
  const [inputKodeVoucherUser, setInputKodeVoucherUser] = useState("")
  const [checkoutModal, setCheckoutModal] = useState(null)
  const [buktiBayarBase64, setBuktiBayarBase64] = useState("")
  const [namaFileBukti, setNamaFileBukti] = useState("")
  const [sedangProsesBayar, setSedangProsesBayar] = useState(false)

  const [pengaturanPayment, setPengaturanPayment] = useState({
    modePembayaranAktif: "qris_manual",
    preferredModel: "google/gemini-2.5-flash",
    namaMerchant: "HOOKYA OFFICIAL STORE",
    infoRekening: "NMID: ID1020039201992",
    noWaAdmin: "6281234567890",
    qrisImageUrl: "",
    brandConfig: {
      logoPngUrl: "",
      logoGapPx: 6,
      brandText: "OOKYA",
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

  const navStackRef = useRef([{ menu: "chat", stage: 0, subTab: "jadwal" }])
  const isPoppingRef = useRef(false)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 3200)
  }

  const dorongRiwayatNavigasi = (menuBaru, stageBaru, subTabBaru) => {
    if (typeof window === "undefined" || isPoppingRef.current) return
    const last = navStackRef.current[navStackRef.current.length - 1]
    if (
      last &&
      last.menu === menuBaru &&
      last.stage === stageBaru &&
      last.subTab === subTabBaru
    ) {
      return
    }
    navStackRef.current.push({
      menu: menuBaru,
      stage: stageBaru,
      subTab: subTabBaru,
    })
    window.history.pushState(
      { hookyaInternal: true, menu: menuBaru, stage: stageBaru },
      "",
    )
  }

  const setActiveMenu = (menuTarget) => {
    if (menuTarget === "tersimpan") {
      setSubTabKalender("arsip")
      setActiveMenuState("kalender")
      dorongRiwayatNavigasi("kalender", stage, "arsip")
      return
    }
    if (menuTarget === "produksi") {
      setSubTabAsesmen("produksi")
      setActiveMenuState("asesmen")
      dorongRiwayatNavigasi("asesmen", stage, subTabKalender)
      return
    }
    if (menuTarget === "rewrite") {
      setSubTabAsesmen("ekstrak")
      setActiveMenuState("asesmen")
      dorongRiwayatNavigasi("asesmen", stage, subTabKalender)
      return
    }
    if (menuTarget === "brainstorm") {
      setActiveMenuState("chat")
      dorongRiwayatNavigasi("chat", stage, subTabKalender)
      return
    }
    setActiveMenuState(menuTarget)
    dorongRiwayatNavigasi(menuTarget, stage, subTabKalender)
  }

  const setStage = (stageTarget) => {
    setStageState(stageTarget)
    dorongRiwayatNavigasi(activeMenu, stageTarget, subTabKalender)
  }

  const ubahSubTabKalender = (tabTarget) => {
    setSubTabKalender(tabTarget)
    dorongRiwayatNavigasi("kalender", stage, tabTarget)
  }

  const handleTombolBackAplikasi = () => {
    if (navStackRef.current.length > 1) {
      navStackRef.current.pop()
      const prev = navStackRef.current[navStackRef.current.length - 1]
      setActiveMenuState(prev.menu || "chat")
      setStageState(prev.stage ?? 0)
      setSubTabKalender(prev.subTab || "jadwal")
    } else {
      setActiveMenuState("chat")
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
        setStageState(prev.stage ?? 0)
        setSubTabKalender(prev.subTab || "jadwal")
      } else {
        setActiveMenuState("chat")
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
              u.profil_dna?.pengaturanPayment?.brandConfig?.logoPngUrl ||
              u.profil_dna?.pengaturanPayment?.qrisImageUrl ||
              u.profil_dna?.pengaturanPayment?.preferredModel,
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
          const nominalTersimpan =
            trxLunasTerakhir?.nominal_asli ||
            trxLunasTerakhir?.nominal_bayar ||
            0

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
      showToast("Konfigurasi sistem, Model AI & Logo berhasil disimpan.")
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

  const handleGandakanDariArsip = async (itemArsip) => {
    if (multiplyingArchiveId) return
    const jmlX = parseInt(pilihanGandakanArsip[itemArsip.id] || "2") || 2
    const biayaKoin = jmlX === 10 ? 3 : jmlX === 5 ? 2 : 1

    if (coins < biayaKoin) {
      alert(`Saldo koin belum mencukupi (Perlu ${biayaKoin} Koin).`)
      setActiveMenu("topup")
      return
    }

    setMultiplyingArchiveId(itemArsip.id)
    await updateKoinDatabase(coins - biayaKoin)
    showToast(`Menyusun ${jmlX} sub-variasi angle ke dalam Folder...`)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "multiply_script_variations",
          userId,
          namaUser: profil.nama,
          preferredModel: pengaturanPayment.preferredModel,
          personaProfile,
          subyek: itemArsip.judul,
          skripSebelumnya: itemArsip.segmen,
          jumlahMultiplier: jmlX,
          koinDipakai: biayaKoin,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.silentCoinUpdated != null) {
          updateKoinDatabase(data.silentCoinUpdated)
        }
        await muatUlangDataSupabase(userId)
        throw new Error("Gagal menggandakan")
      }

      const listVariasi = Array.isArray(data.daftarVariasi)
        ? data.daftarVariasi
        : []
      const itemVariasiBaru = listVariasi.map((v, i) => {
        const kode = v.kodeHuruf || String.fromCharCode(65 + i)
        return {
          id: Date.now() + i + 1,
          kodeHuruf: kode,
          judul: v.judulVariasi || `Variasi Angle ${kode}`,
          estimasiDetik: v.estimasiDetik || "60 detik",
          sections: v.sections || v.segmen || itemArsip.segmen,
          segmen: v.segmen || v.sections || itemArsip.segmen,
        }
      })

      const folderUpdate = [
        ...(Array.isArray(itemArsip.variasiFolder)
          ? itemArsip.variasiFolder
          : []),
        ...itemVariasiBaru,
      ]

      const skripIndukDiperbarui = {
        ...itemArsip,
        variasiFolder: folderUpdate,
      }
      const tersimpanDB =
        await simpanAtauUpdateSkripDatabase(skripIndukDiperbarui)

      setKoleksiSkripTersimpan((prev) =>
        prev.map((s) => (s.id === itemArsip.id ? tersimpanDB : s)),
      )
      setFolderTerbukaMap((prev) => ({ ...prev, [itemArsip.id]: true }))
      await muatUlangDataSupabase(userId)
      showToast(
        `${itemVariasiBaru.length} variasi angle ditambahkan ke Folder.`,
      )
    } catch {
      showToast(
        "Request gagal diproses. Koin Anda telah dikembalikan otomatis (Auto-Refund).",
      )
    } finally {
      setMultiplyingArchiveId(null)
    }
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
          ? `Top-up paket disetujui Admin (+${t.jumlah_koin} Koin)`
          : t.status === "ditolak"
            ? "Bukti transfer ditolak / tidak sesuai"
            : "Menunggu verifikasi bukti transfer oleh Admin",
      status:
        t.status === "lunas"
          ? "topup_lunas"
          : t.status === "ditolak"
            ? "gagal_refund"
            : "pending",
      koinDelta: t.status === "lunas" ? Number(t.jumlah_koin) || 0 : 0,
      refundInfo:
        t.status === "ditolak"
          ? "Silakan unggah ulang bukti transfer yang sesuai"
          : "",
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
  const jmlBelumTerjadwal = koleksiSkripTersimpan.length - jmlTerjadwal

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

  const daftarAkunTerkoneksiSetting =
    Array.isArray(profil.daftarAkunTernak) && profil.daftarAkunTernak.length > 0
      ? profil.daftarAkunTernak
      : [
          {
            id: "tt_1",
            kode: "TT",
            labelAkun: profil.labelAkunSosmed || "@cuanistsociety",
            info: "TikTok • 8 topik aktif",
          },
          {
            id: "ig_2",
            kode: "IG",
            labelAkun: "@hookya.official",
            info: "Instagram • 4 topik aktif",
          },
          {
            id: "yt_3",
            kode: "YT",
            labelAkun: `@${profil.username || "creator"}.shorts`,
            info: "YouTube • Siap sync",
          },
        ]

  const persenVaultNaskah = Math.min(
    100,
    Math.max(4, koleksiSkripTersimpan.length),
  )

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

          let infoCatatan = null
          try {
            if (trx.catatan_user) infoCatatan = JSON.parse(trx.catatan_user)
          } catch {
            infoCatatan = null
          }

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

            const rawWaUser =
              infoCatatan?.whatsapp ||
              targetU.whatsapp ||
              targetU.profil_dna?.whatsapp ||
              ""
            const waBersih = rawWaUser.replace(/\D/g, "")
            if (waBersih) {
              const waFormatted = waBersih.startsWith("08")
                ? "62" + waBersih.slice(1)
                : waBersih
              const usernameLogin =
                infoCatatan?.username || targetU.username || targetU.email
              const passwordLogin =
                infoCatatan?.password ||
                targetU.password_hash ||
                targetU.profil_dna?.pin ||
                "12345678"

              const teksWA = encodeURIComponent(
                `*KONFIRMASI AKTIVASI PAKET HOOKYA*\n\n` +
                  `Halo Kak *${targetU.nama}*, pembayaran Invoice *#${trx.invoice_id}* (${trx.nama_paket}) telah diverifikasi:\n` +
                  `• Tambahan Koin: *+${trx.jumlah_koin} Koin* (Total: *${totalKoinBaru} Koin*)\n` +
                  `• Kuota Akun Sosmed: *Maks ${kuotaAkunBaru} Akun*\n` +
                  `• Username: *${usernameLogin}*\n` +
                  `• Password: *${passwordLogin}*\n\n` +
                  `Silakan login di: https://hookya.site`,
              )
              window.open(
                `https://wa.me/${waFormatted}?text=${teksWA}`,
                "_blank",
              )
            }
          }
          await muatUlangDataSupabase(userId)
          showToast("Pembayaran di-ACC & info login dikirim ke WA User.")
        }}
        simpanPengaturanDevKeDB={simpanPengaturanDevPermanen}
        muatUlangDataSupabase={() => muatUlangDataSupabase(userId)}
        showToast={showToast}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#14141F] flex flex-col font-sans antialiased pt-16 pb-28">
      {toastMsg && (
        <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-50 bg-[#14141F] text-[#D4F34A] px-4 py-3 rounded-xl border border-[#14141F] text-xs font-bold flex items-center justify-between gap-2">
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

      {/* POPUP KONFIRMASI HAPUS NASKAH */}
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
                <strong>&ldquo;{targetHapusSkrip.judul}&rdquo;</strong> beserta
                seluruh sub-variasi di dalam foldernya?
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
                {sedangMenghapusSkrip ? "Menghapus..." : "Ya, Hapus Naskah"}
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

      {showUpgradeVIPModal && (
        <div className="fixed inset-0 bg-[#14141F]/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#14141F] w-full max-w-sm rounded-2xl p-6 space-y-4 text-center border border-[#14141F]">
            <div className="w-11 h-11 rounded-xl bg-[#14141F] text-[#D4F34A] flex items-center justify-center text-xs font-bold mx-auto">
              VIP
            </div>
            <h3 className="text-base font-bold">
              Fitur Khusus Paket VIP (Rp 20.000+)
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Upgrade ke Paket VIP untuk membuka fitur Rekam Suara, Scan
              Screenshot Review Bintang 1-3, Ekstrak Audio Video, dan Kuota
              Multi-Akun lebih besar.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowUpgradeVIPModal(false)}
                className="cursor-pointer w-1/3 bg-[#F4F5F7] font-bold text-xs py-3 rounded-lg"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeVIPModal(false)
                  setActiveMenu("topup")
                }}
                className="cursor-pointer flex-1 bg-[#D4F34A] text-[#14141F] font-bold text-xs py-3 rounded-lg"
              >
                Lihat Paket Koin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER (SESUAI SCREEN.JPG & SCREEN3.PNG) */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-[#E2E8F0] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 max-w-4xl">
          {(activeMenu !== "chat" || stage > 0) && (
            <button
              type="button"
              onClick={handleTombolBackAplikasi}
              aria-label="Kembali"
              className="cursor-pointer w-9 h-9 rounded-lg hover:bg-[#F4F5F7] flex items-center justify-center text-[#14141F]"
            >
              <FlatIcon name="arrowLeft" className="w-5 h-5" />
            </button>
          )}
          <div
            onClick={() => {
              setStage(0)
              setActiveMenu("chat")
            }}
            className="cursor-pointer"
          >
            <HookyaLogo
              brandConfig={pengaturanPayment.brandConfig}
              subLabel={activeMenu === "setting" ? "Setting" : "Bot Naskah"}
            />
          </div>
        </div>

        <div className="relative flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveMenu("topup")}
            className="cursor-pointer flex items-center gap-1.5 bg-[#D4F34A] hover:bg-[#C5E738] text-[#14141F] px-3.5 py-1.5 rounded-full text-xs font-bold tabular-nums active:scale-95 transition"
          >
            <FlatIcon name="plusCircle" className="w-4 h-4" />
            <span>{coins.toLocaleString("id-ID")} KOIN</span>
          </button>

          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-label="Menu Profil"
            className="cursor-pointer w-9 h-9 rounded-full bg-[#14141F] text-white flex items-center justify-center"
          >
            <FlatIcon name="user" className="w-4 h-4" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl border border-[#14141F] p-4 z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#14141F] truncate">
                    {profil.nama}
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    {namaPaketAktif} • Maks {kuotaAkunMaksimal} Akun
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(false)}
                  className="cursor-pointer w-7 h-7 rounded-lg bg-[#F4F5F7] flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false)
                  setActiveMenu("setting")
                }}
                className="cursor-pointer w-full py-2.5 px-3 rounded-lg bg-[#14141F] text-[#D4F34A] text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <FlatIcon name="settings" className="w-4 h-4" />
                <span>Pengaturan & Akun</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false)
                  setTabMenuKoin("rincian_koin")
                  setActiveMenu("topup")
                }}
                className="cursor-pointer w-full py-2.5 px-3 rounded-lg bg-[#F4F5F7] hover:bg-[#E2E8F0] text-[#14141F] text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <FlatIcon name="coin" className="w-4 h-4" />
                <span>Rincian Penggunaan Koin & Refund</span>
              </button>

              {isAdminAccount && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false)
                    setShowPinModal(true)
                  }}
                  className="cursor-pointer w-full py-2.5 px-3 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <FlatIcon name="code" className="w-4 h-4" />
                  <span>Buka Developer Console</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false)
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("hookya_active_user_id")
                    sessionStorage.removeItem("hookya_active_view_mode")
                  }
                  ubahViewModeStabil("auth")
                }}
                className="cursor-pointer w-full py-2 px-3 rounded-lg bg-[#FEF2F2] text-[#EF4444] text-xs font-bold"
              >
                Keluar dari Akun Hookya
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN WORKSPACE — PERSISTENT MOUNT AGAR CHAT & EKSTRAK VIDEO TIDAK HILANG SAAT PINDAH TAB */}
      <main className="flex-1 w-full px-4 pt-4">
        {/* SUBVIEW EDIT PROFIL & PERSONA KREATOR */}
        <div className={activeMenu === "dna" ? "block" : "hidden"}>
          <PersonaDNAView
            userId={userId}
            isPremiumUser={statusVIPFinal}
            kuotaAkunMaksimal={kuotaAkunMaksimal}
            namaPaketAktif={namaPaketAktif}
            onTriggerUpgradeVIP={() => setShowUpgradeVIPModal(true)}
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

        {/* TAB 1: ASESMEN & EKSTRAK AUDIO VIDEO */}
        <div className={activeMenu === "asesmen" ? "block" : "hidden"}>
          <div className="max-w-4xl mx-auto mb-4 bg-white rounded-2xl p-2 border border-[#E2E8F0] grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSubTabAsesmen("produksi")}
              className={`cursor-pointer min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                subTabAsesmen === "produksi"
                  ? "bg-[#14141F] text-[#D4F34A]"
                  : "bg-[#F4F5F7] text-[#14141F]"
              }`}
            >
              <FlatIcon name="edit" className="w-4 h-4" />
              <span>Asesmen & Editor Skrip</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTabAsesmen("ekstrak")}
              className={`cursor-pointer min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                subTabAsesmen === "ekstrak"
                  ? "bg-[#14141F] text-[#D4F34A]"
                  : "bg-[#F4F5F7] text-[#14141F]"
              }`}
            >
              <FlatIcon name="mic" className="w-4 h-4" />
              <span>Ekstrak Suara Video ke Naskah</span>
            </button>
          </div>

          <div className={subTabAsesmen === "produksi" ? "block" : "hidden"}>
            <ScriptProducerView
              userId={userId}
              namaUser={profil.nama}
              isPremiumUser={statusVIPFinal}
              kuotaAkunMaksimal={kuotaAkunMaksimal}
              onTriggerUpgradeVIP={() => setShowUpgradeVIPModal(true)}
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

          <div className={subTabAsesmen === "ekstrak" ? "block" : "hidden"}>
            <VideoExtractorView
              userId={userId}
              namaUser={profil.nama}
              isPremiumUser={statusVIPFinal}
              onTriggerUpgradeVIP={() => setShowUpgradeVIPModal(true)}
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

        {/* TAB 3 (DEFAULT UTAMA): CHAT PER TOPIK ("AI SCRIPT SESSION") */}
        <div className={activeMenu === "chat" ? "block" : "hidden"}>
          <BrainstormView
            userId={userId}
            namaUser={profil.nama}
            isPremiumUser={statusVIPFinal}
            kuotaAkunMaksimal={kuotaAkunMaksimal}
            onTriggerUpgradeVIP={() => setShowUpgradeVIPModal(true)}
            coins={coins}
            updateKoinDatabase={updateKoinDatabase}
            personaProfile={personaProfile}
            preferredModel={
              pengaturanPayment.preferredModel || "google/gemini-2.5-flash"
            }
            bentukKontenFinal={bentukKonten}
            simpanAtauUpdateSkripDatabase={simpanAtauUpdateSkripDatabase}
            setKoleksiSkripTersimpan={setKoleksiSkripTersimpan}
            setHasilSkrip={setHasilSkrip}
            setStage={setStage}
            setActiveMenu={setActiveMenu}
            showToast={showToast}
            onRefreshDataUser={() => muatUlangDataSupabase(userId)}
          />
        </div>

        {/* TAB 2: KALENDER (10 POSTINGAN + 4 JENDELA WAKTU) & ARSIP NASKAH */}
        {activeMenu === "kalender" && (
          <div className="max-w-3xl mx-auto space-y-4 pb-8">
            <div className="bg-white rounded-2xl p-2 border border-[#E2E8F0] grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => ubahSubTabKalender("arsip")}
                className={`cursor-pointer min-h-[46px] px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
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
                className={`cursor-pointer min-h-[46px] px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                  subTabKalender === "jadwal"
                    ? "bg-[#14141F] text-[#D4F34A]"
                    : "bg-[#F4F5F7] text-[#14141F]"
                }`}
              >
                <FlatIcon name="calendar" className="w-4 h-4" />
                <span>Jadwal 4 Jendela Waktu ({jmlTerjadwal})</span>
              </button>
            </div>

            {subTabKalender === "arsip" && (
              <div className="space-y-4">
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl font-bold text-[#14141F]">
                        Folder Vault & Arsip Naskah
                      </h1>
                      <p className="text-xs text-[#64748B]">
                        Kelola seluruh naskah 6 langkah, gandakan hingga 10
                        postingan dari 7 angle, edit judul, atau hapus naskah.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setUrutkanArsipTerbaru(!urutkanArsipTerbaru)
                      }
                      className="cursor-pointer px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] text-xs font-bold shrink-0"
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
                      className="w-full h-12 pl-10 pr-16 bg-white rounded-xl border border-[#E2E8F0] text-base sm:text-sm focus:border-[#14141F] focus:outline-none"
                    />
                    {keywordCariArsip && (
                      <button
                        type="button"
                        onClick={() => setKeywordCariArsip("")}
                        className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B]"
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {[
                      {
                        id: "all",
                        label: `Semua (${koleksiSkripTersimpan.length})`,
                      },
                      {
                        id: "unscheduled",
                        label: `Belum Terjadwal (${jmlBelumTerjadwal})`,
                      },
                      {
                        id: "scheduled",
                        label: `Terjadwal (${jmlTerjadwal})`,
                      },
                      { id: "starred", label: "Favorit" },
                    ].map((fp) => (
                      <button
                        key={fp.id}
                        type="button"
                        onClick={() => setFilterArsipPill(fp.id)}
                        className={`cursor-pointer shrink-0 px-3.5 py-1.5 rounded-full text-xs transition ${
                          filterArsipPill === fp.id
                            ? "bg-[#D4F34A] text-[#14141F] font-bold"
                            : "bg-white border border-[#E2E8F0] text-[#64748B] font-semibold"
                        }`}
                      >
                        {fp.label}
                      </button>
                    ))}
                  </div>
                </section>

                {arsipTerfilter.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center text-xs text-[#64748B]">
                    Belum ada naskah skrip yang sesuai filter pencarian.
                  </div>
                ) : (
                  <section className="space-y-3.5">
                    {arsipTerfilter.map((item) => {
                      const listFolder = Array.isArray(item.variasiFolder)
                        ? item.variasiFolder
                        : []
                      const isFolderOpen = Boolean(folderTerbukaMap[item.id])
                      const sedangGandakanIni = multiplyingArchiveId === item.id
                      const sedangEditJudulIni = editingArsipId === item.id

                      return (
                        <article
                          key={item.id}
                          className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="text-[#64748B]">
                                {item.waktuDibuat}
                              </span>
                              <span>•</span>
                              {item.sudahUpload && item.tanggalUpload ? (
                                <span className="inline-flex items-center gap-1 bg-[#D4F34A] text-[#14141F] px-2 py-0.5 rounded-md font-bold">
                                  Terjadwal: {item.tanggalUpload} (
                                  {item.jamPublikasi || "20:15 WIB"})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-[#F4F5F7] text-[#64748B] px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                                  Belum Terjadwal
                                </span>
                              )}
                            </div>

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

                          <div className="space-y-1.5">
                            {sedangEditJudulIni ? (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={inputJudulArsipBaru}
                                  onChange={(e) =>
                                    setInputJudulArsipBaru(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleSimpanEditJudulArsip(item)
                                  }}
                                  autoFocus
                                  className="flex-1 h-10 px-3 rounded-lg border border-[#14141F] text-base sm:text-xs font-bold text-[#14141F] focus:outline-none"
                                />
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSimpanEditJudulArsip(item)
                                    }
                                    className="cursor-pointer h-10 px-3.5 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold"
                                  >
                                    Simpan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingArsipId(null)}
                                    className="cursor-pointer h-10 px-3 rounded-lg bg-[#F4F5F7] text-[#64748B] text-xs font-bold"
                                  >
                                    Batal
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <h2 className="text-sm sm:text-base font-bold text-[#14141F] leading-snug">
                                  {item.judul}
                                </h2>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingArsipId(item.id)
                                    setInputJudulArsipBaru(item.judul || "")
                                  }}
                                  className="cursor-pointer shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F4F5F7] text-[#14141F] text-[11px] font-bold border border-[#E2E8F0]"
                                >
                                  <FlatIcon name="edit" className="w-3 h-3" />
                                  <span>Edit Judul</span>
                                </button>
                              </div>
                            )}

                            <div>
                              <span className="inline-flex items-center gap-1 bg-[#F4F5F7] text-[#14141F] px-2.5 py-0.5 rounded-md text-xs font-semibold border border-[#E2E8F0]">
                                {item.bentuk}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setFolderTerbukaMap((p) => ({
                                  ...p,
                                  [item.id]: !p[item.id],
                                }))
                              }
                              className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold min-h-[42px] transition ${
                                isFolderOpen
                                  ? "bg-[#14141F] text-[#D4F34A]"
                                  : "bg-white border border-[#E2E8F0] text-[#14141F]"
                              }`}
                            >
                              <FlatIcon
                                name={isFolderOpen ? "folderOpen" : "folder"}
                                className="w-4 h-4"
                              />
                              <span>Folder Variasi ({listFolder.length})</span>
                              <FlatIcon
                                name="chevronDown"
                                className={`w-3.5 h-3.5 transition-transform ${
                                  isFolderOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setHasilSkrip(item)
                                setStage(5)
                                setActiveMenu("produksi")
                              }}
                              className="cursor-pointer inline-flex items-center gap-1.5 bg-[#D4F34A] text-[#14141F] rounded-lg px-3.5 py-2 text-xs font-bold min-h-[42px]"
                            >
                              <span>Buka Skrip</span>
                              <FlatIcon
                                name="arrowRight"
                                className="w-3.5 h-3.5"
                              />
                            </button>
                          </div>

                          {isFolderOpen && (
                            <div className="border border-[#E2E8F0] bg-[#F4F5F7] rounded-xl p-3 space-y-2">
                              {listFolder.length === 0 ? (
                                <p className="text-xs text-[#64748B] py-1">
                                  Belum ada sub-variasi. Pilih jumlah variasi di
                                  bawah lalu klik Buat ke Folder.
                                </p>
                              ) : (
                                listFolder.map((vf, vIdx) => (
                                  <div
                                    key={vf.id || vIdx}
                                    onClick={() => {
                                      setHasilSkrip({
                                        ...item,
                                        judul: `${item.judul} (${vf.judul})`,
                                        sections: vf.sections || vf.segmen,
                                        segmen: vf.segmen || vf.sections,
                                      })
                                      setStage(5)
                                      setActiveMenu("produksi")
                                    }}
                                    className="cursor-pointer flex items-center justify-between gap-2 p-2.5 bg-white rounded-lg border border-[#E2E8F0] hover:border-[#14141F]"
                                  >
                                    <span className="text-xs font-bold text-[#14141F] truncate">
                                      {vf.kodeHuruf ||
                                        String.fromCharCode(65 + vIdx)}
                                      . {vf.judul}
                                    </span>
                                    <span className="text-[11px] font-bold text-[#14141F] bg-[#D4F34A] px-2 py-0.5 rounded">
                                      Buka
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          <div className="border-t border-[#E2E8F0] pt-3 flex items-center justify-between gap-2">
                            <div className="relative flex-1">
                              <select
                                value={pilihanGandakanArsip[item.id] || "2"}
                                disabled={sedangGandakanIni}
                                onChange={(e) =>
                                  setPilihanGandakanArsip({
                                    ...pilihanGandakanArsip,
                                    [item.id]: e.target.value,
                                  })
                                }
                                className="w-full h-11 pl-3 pr-8 bg-white text-[#14141F] text-xs font-bold rounded-lg border border-[#E2E8F0] appearance-none focus:outline-none"
                              >
                                <option value="2">
                                  Gandakan: 2 Angle (1 Koin)
                                </option>
                                <option value="5">
                                  Gandakan: 5 Angle (2 Koin)
                                </option>
                                <option value="10">
                                  Batch 10 Postingan (3 Koin)
                                </option>
                              </select>
                              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B]">
                                <FlatIcon
                                  name="chevronDown"
                                  className="w-4 h-4"
                                />
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={sedangGandakanIni}
                              onClick={() => handleGandakanDariArsip(item)}
                              className="cursor-pointer inline-flex items-center gap-1.5 bg-[#14141F] text-white text-xs font-bold px-4 py-2.5 rounded-lg min-h-[44px] shrink-0"
                            >
                              <FlatIcon
                                name={sedangGandakanIni ? "refresh" : "plus"}
                                className={`w-4 h-4 text-[#D4F34A] ${
                                  sedangGandakanIni ? "animate-spin" : ""
                                }`}
                              />
                              <span>
                                {sedangGandakanIni
                                  ? "Memproses..."
                                  : "Buat ke Folder"}
                              </span>
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
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#14141F]">
                      Kalender Eksekusi Rutin (10 Postingan + 4 Jendela Waktu)
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

                {/* Kotak Jadwalkan dengan Preset 4 Jendela Waktu */}
                <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#14141F]">
                      Jadwalkan Naskah ke {tanggalKalenderTerpilih} (
                      {namaHariTerpilih})
                    </span>
                    <span className="text-[11px] font-bold text-[#556500]">
                      4 Jendela Waktu
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#64748B] block">
                      Pilih Naskah dari Vault Arsip:
                    </label>
                    <select
                      value={idSkripPlotTerpilih}
                      onChange={(e) => setIdSkripPlotTerpilih(e.target.value)}
                      className="w-full h-11 bg-[#F4F5F7] border border-[#E2E8F0] rounded-lg px-3 text-xs font-bold text-[#14141F] focus:outline-none"
                    >
                      <option value="">-- Pilih Skrip Tersimpan --</option>
                      {koleksiSkripTersimpan.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.judul}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-[#64748B] block">
                      Pilih 1 dari 4 Jendela Waktu Terbaik:
                    </label>
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
                  </div>

                  <button
                    type="button"
                    onClick={handlePlotSkripKeKalender}
                    className="cursor-pointer w-full h-12 bg-[#D4F34A] text-[#14141F] font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2"
                  >
                    <FlatIcon name="calendar" className="w-4 h-4" />
                    <span>
                      Jadwalkan ke {tanggalKalenderTerpilih} (
                      {jamPublikasiInput})
                    </span>
                  </button>
                </div>

                {/* Daftar Skrip Terjadwal pada Tanggal Terpilih */}
                <div className="space-y-2.5">
                  {daftarSkripTanggalTerpilih.map((sk) => (
                    <div
                      key={sk.id}
                      className="bg-white rounded-2xl p-4 border border-[#E2E8F0] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
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

        {/* TAB 4: SETTING ("WORKSPACE KREATOR: PENGATURAN & AKUN" SESUAI SCREEN3.PNG) */}
        {activeMenu === "setting" && (
          <div className="max-w-2xl mx-auto space-y-6 pb-10">
            {/* Heading Workspace Kreator */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                  WORKSPACE KREATOR
                </span>
                <h1 className="text-2xl font-bold text-[#14141F]">
                  Pengaturan & Akun
                </h1>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#D4F34A] text-[#14141F] text-xs font-extrabold">
                PRO CREATOR
              </span>
            </div>

            {/* Kartu Profil Utama & Saldo Hookya Coins */}
            <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
              <div className="flex items-center gap-3.5">
                <label className="cursor-pointer relative w-16 h-16 rounded-full bg-[#14141F] text-[#D4F34A] flex items-center justify-center font-extrabold text-xl shrink-0 overflow-hidden border-2 border-[#14141F]">
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
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-bold text-[#14141F] truncate">
                      {profil.nama}
                    </h2>
                    <span className="w-4 h-4 rounded-full bg-[#D4F34A] text-[#14141F] flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#64748B]">
                    @{profil.username || "creator"}
                  </div>
                  <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                    {profil.kontak} • {profil.whatsapp || "+62 812-xxxx-xxxx"}
                  </div>
                </div>
              </div>

              {/* Kotak Hookya Coins + Tombol Top Up */}
              <div className="bg-[#F4F5F7] rounded-xl p-4 border border-[#E2E8F0] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#D4F34A] text-[#14141F] flex items-center justify-center shrink-0">
                    <FlatIcon name="coin" className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      HOOKYA COINS
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-[#14141F] tabular-nums">
                        {coins.toLocaleString("id-ID")}
                      </span>
                      <span className="text-xs font-semibold text-[#64748B]">
                        Koin Aktif
                      </span>
                    </div>
                    <span className="text-[11px] text-[#64748B] block">
                      Rollover {sisaHariPaket} hari lagi
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveMenu("topup")}
                  className="cursor-pointer h-11 px-4 rounded-xl bg-[#14141F] text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
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
                className="cursor-pointer w-full h-12 rounded-xl bg-[#F4F5F7] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#14141F] text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <FlatIcon name="sliders" className="w-4 h-4" />
                <span>Edit Profil & Persona Kreator</span>
              </button>
            </section>

            {/* Seksi: PREFERENSI AI & NASKAH */}
            <section className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] px-1 block">
                PREFERENSI AI & NASKAH
              </span>
              <div className="bg-white rounded-2xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveMenu("dna")}
                  className="cursor-pointer w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#F4F5F7]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F5F7] flex items-center justify-center text-[#14141F]">
                      <FlatIcon name="brain" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#14141F]">
                        Gaya Bicara & Persona AI
                      </div>
                      <div className="text-xs text-[#64748B]">
                        {profil.kepribadianSosial ||
                          "Casual Storyteller (Gen-Z Focus)"}
                      </div>
                    </div>
                  </div>
                  <FlatIcon
                    name="chevronRight"
                    className="w-4 h-4 text-[#64748B]"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMenu("dna")}
                  className="cursor-pointer w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#F4F5F7]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F5F7] flex items-center justify-center text-[#14141F]">
                      <FlatIcon name="clock" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#14141F]">
                        Format Default Konten
                      </div>
                      <div className="text-xs text-[#64748B]">
                        {bentukKonten || "60 Detik High-Retention Preset"}
                      </div>
                    </div>
                  </div>
                  <FlatIcon
                    name="chevronRight"
                    className="w-4 h-4 text-[#64748B]"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMenu("dna")}
                  className="cursor-pointer w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#F4F5F7]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F5F7] flex items-center justify-center text-[#14141F]">
                      <FlatIcon name="dna" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#14141F]">
                        Target Niche & Audiens
                      </div>
                      <div className="text-xs text-[#64748B]">
                        {profil.minatUtama ||
                          "Bisnis Digital & Edukasi Finansial"}
                      </div>
                    </div>
                  </div>
                  <FlatIcon
                    name="chevronRight"
                    className="w-4 h-4 text-[#64748B]"
                  />
                </button>

                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F5F7] flex items-center justify-center text-[#14141F]">
                      <FlatIcon name="bolt" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#14141F]">
                        Formula Hook Otomatis
                      </div>
                      <div className="text-xs text-[#64748B]">
                        Generate 3-5 variasi hook per topik di Chat
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoHookFormula(!autoHookFormula)}
                    className={`cursor-pointer w-12 h-7 rounded-full p-1 transition flex items-center ${
                      autoHookFormula
                        ? "bg-[#D4F34A] justify-end"
                        : "bg-[#E2E8F0] justify-start"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white border border-[#14141F]/20" />
                  </button>
                </div>
              </div>
            </section>

            {/* Seksi: AKUN TERHUBUNG */}
            <section className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  AKUN TERHUBUNG ({daftarAkunTerkoneksiSetting.length})
                </span>
                <span className="text-[11px] font-semibold text-[#64748B]">
                  Auto-Sync On
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3">
                {daftarAkunTerkoneksiSetting.map((ak, i) => (
                  <div
                    key={ak.id || i}
                    className="p-3 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#14141F] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                        {ak.kode || (i === 0 ? "TT" : i === 1 ? "IG" : "YT")}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#14141F] truncate">
                          {ak.labelAkun}
                        </div>
                        <div className="text-xs text-[#64748B] truncate">
                          {ak.info ||
                            `${ak.minatUtama || "Multi-Platform"} • Aktif`}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#D4F34A] text-[#14141F] text-[11px] font-bold shrink-0">
                      Aktif
                    </span>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setActiveMenu("dna")}
                  className="cursor-pointer w-full h-11 rounded-xl bg-[#F4F5F7] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#14141F] text-xs font-bold flex items-center justify-center gap-2"
                >
                  <FlatIcon name="plus" className="w-4 h-4" />
                  <span>Hubungkan Akun Baru</span>
                </button>
              </div>
            </section>

            {/* Seksi: VAULT & PENYIMPANAN */}
            <section className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] px-1 block">
                VAULT & PENYIMPANAN
              </span>
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#14141F]">
                      Folder Vault Naskah
                    </span>
                    <span className="text-[#64748B] font-semibold">
                      {koleksiSkripTersimpan.length} / 100 Topik (
                      {persenVaultNaskah}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#F4F5F7] overflow-hidden border border-[#E2E8F0]">
                    <div
                      style={{ width: `${persenVaultNaskah}%` }}
                      className="h-full bg-[#D4F34A]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-[#14141F]">
                      Auto-Archive Naskah
                    </div>
                    <div className="text-xs text-[#64748B]">
                      Arsipkan topik selesai setelah 7 hari
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoArchiveNaskah(!autoArchiveNaskah)}
                    className={`cursor-pointer w-12 h-7 rounded-full p-1 transition flex items-center ${
                      autoArchiveNaskah
                        ? "bg-[#D4F34A] justify-end"
                        : "bg-[#E2E8F0] justify-start"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white border border-[#14141F]/20" />
                  </button>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-[#14141F]">
                      Cache AI & Draft Lokal
                    </div>
                    <div className="text-xs text-[#64748B]">
                      {ukuranCacheLokal} tersimpan di perangkat
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUkuranCacheLokal("0.1 MB")
                      showToast("Cache draf lokal berhasil dibersihkan.")
                    }}
                    className="cursor-pointer h-9 px-3.5 rounded-lg bg-[#F4F5F7] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-xs font-bold text-[#14141F]"
                  >
                    Bersihkan
                  </button>
                </div>
              </div>
            </section>

            {/* Seksi: DUKUNGAN, RINCIAN KOIN & DEVELOPER CONSOLE */}
            <section className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] px-1 block">
                DUKUNGAN, LOG KOIN & SISTEM
              </span>
              <div className="bg-white rounded-2xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setTabMenuKoin("rincian_koin")
                    setActiveMenu("topup")
                  }}
                  className="cursor-pointer w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#F4F5F7]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F5F7] flex items-center justify-center text-[#14141F]">
                      <FlatIcon name="coin" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#14141F]">
                        Rincian Penggunaan Koin & Status Auto-Refund
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
                    className="cursor-pointer w-full p-4 flex items-center justify-between gap-3 text-left bg-[#D4F34A]/25 hover:bg-[#D4F34A]/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#14141F] text-[#D4F34A] flex items-center justify-center">
                        <FlatIcon name="code" className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#14141F]">
                          Buka Developer Console (Uji Model OpenRouter)
                        </div>
                        <div className="text-xs text-[#64748B]">
                          Model aktif: {pengaturanPayment.preferredModel}
                        </div>
                      </div>
                    </div>
                    <FlatIcon
                      name="chevronRight"
                      className="w-4 h-4 text-[#14141F]"
                    />
                  </button>
                )}

                <a
                  href={`https://wa.me/${(
                    pengaturanPayment.noWaAdmin || "6281234567890"
                  ).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#F4F5F7]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F5F7] flex items-center justify-center text-[#14141F]">
                      <FlatIcon name="phone" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#14141F]">
                        Bantuan CS & WhatsApp Support
                      </div>
                      <div className="text-xs text-[#64748B]">
                        Respons cepat &lt; 15 menit
                      </div>
                    </div>
                  </div>
                  <FlatIcon
                    name="arrowRight"
                    className="w-4 h-4 text-[#64748B]"
                  />
                </a>

                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F5F7] flex items-center justify-center text-[#14141F]">
                      <FlatIcon name="shield" className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#14141F]">
                        Versi Aplikasi
                      </div>
                      <div className="text-xs text-[#64748B]">
                        Hookya Build Production
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#14141F]">
                    v2.4.0
                  </span>
                </div>
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
              className="cursor-pointer w-full h-12 rounded-xl bg-[#FFECEC] hover:bg-[#FFD8D8] text-[#BA1A1A] font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <span>Keluar dari Akun Hookya</span>
            </button>

            <p className="text-center text-[11px] text-[#64748B]">
              ID Perangkat: HK-8891-JKT • Sesi diamankan dengan enkripsi
            </p>
          </div>
        )}

        {/* MENU KOIN: BELI PAKET KOIN + TAB RINCIAN PENGGUNAAN KOIN & REFUND */}
        {activeMenu === "topup" && (
          <div className="max-w-3xl mx-auto space-y-5 pb-8">
            <section className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 bg-[#E7E8EA] px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#D4F34A]" />
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Manajemen Saldo & Paket Koin
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#14141F]">
                Paket Koin & Riwayat Pemakaian
              </h1>
            </section>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setTabMenuKoin("beli_paket")}
                className={`cursor-pointer min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
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
                className={`cursor-pointer min-h-[44px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
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
                <section className="bg-white rounded-2xl p-4 border border-[#E2E8F0] space-y-2.5">
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
                      placeholder="MASUKKAN KODE VOUCHER PROMO..."
                      className="flex-1 h-12 bg-[#F4F5F7] border border-[#E2E8F0] rounded-lg px-4 text-base sm:text-xs font-bold font-mono uppercase focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleKlaimVoucherUser}
                      className="cursor-pointer h-12 px-5 bg-[#D4F34A] text-[#14141F] text-xs font-bold rounded-lg shrink-0"
                    >
                      Klaim Voucher
                    </button>
                  </div>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {DAFTAR_PAKET_KOIN.map((pk) => (
                    <article
                      key={pk.nama}
                      className={`bg-white rounded-2xl p-4 border border-[#E2E8F0] flex flex-col justify-between relative overflow-hidden ${
                        pk.agency ? "sm:col-span-2 lg:col-span-3" : ""
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-[#64748B]">
                            {pk.tier}
                          </span>
                          <span className="text-[11px] text-[#14141F] bg-[#F4F5F7] px-2 py-0.5 rounded font-semibold">
                            Maks {pk.kuotaAkun} Akun
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#14141F]">
                          {pk.nama}
                        </h3>
                        <div className="flex items-baseline gap-1.5 pt-1">
                          <span className="text-2xl font-bold text-[#14141F] tabular-nums">
                            {pk.koin}
                          </span>
                          <span className="text-xs font-bold text-[#556500]">
                            Koin
                          </span>
                        </div>
                        <p className="text-lg font-bold text-[#14141F]">
                          {pk.harga}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => bukaLayarCheckoutPaket(pk)}
                        className={`cursor-pointer w-full h-11 mt-4 rounded-lg text-xs font-bold flex items-center justify-center transition ${
                          pk.bestValue
                            ? "bg-[#D4F34A] text-[#14141F]"
                            : "bg-[#14141F] text-white"
                        }`}
                      >
                        Beli Paket
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}

            {tabMenuKoin === "rincian_koin" && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: "semua", label: "Semua Riwayat" },
                    { id: "terpakai", label: "Pemakaian Koin" },
                    {
                      id: "refund",
                      label: `Request Gagal & Refund (${jumlahLogGagalRefund})`,
                    },
                  ].map((flt) => (
                    <button
                      key={flt.id}
                      type="button"
                      onClick={() => setFilterRiwayatKoin(flt.id)}
                      className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 ${
                        filterRiwayatKoin === flt.id
                          ? "bg-[#14141F] text-[#D4F34A]"
                          : "bg-white border border-[#E2E8F0] text-[#64748B]"
                      }`}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>

                {semuaRiwayatKoinUser.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center text-xs text-[#64748B]">
                    Belum ada riwayat penggunaan koin.
                  </div>
                ) : (
                  semuaRiwayatKoinUser.map((logItem, idx) => {
                    const isGagalRefund = logItem.status === "gagal_refund"
                    const delta = Number(logItem.koinDelta) || 0
                    return (
                      <div
                        key={logItem.id || idx}
                        className="bg-white rounded-2xl p-4 border border-[#E2E8F0] flex items-start justify-between gap-2 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-[#14141F]">
                            {logItem.action}
                          </div>
                          <div className="text-[#64748B]">{logItem.detail}</div>
                          <div className="text-[11px] text-[#64748B]">
                            {logItem.waktu}
                          </div>
                          {logItem.refundInfo && (
                            <div className="text-[#10B981] font-bold">
                              {logItem.refundInfo}
                            </div>
                          )}
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
                  })
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FLOATING PILL BOTTOM NAVIGATION BAR (4 ITEMS SESUAI SCREEN.JPG & SCREEN3.PNG) */}
      <div className="fixed bottom-4 left-4 right-4 z-40 pointer-events-none flex justify-center">
        <nav className="pointer-events-auto bg-[#14141F] text-white rounded-full px-3 py-2 border border-white/10 w-full max-w-md flex items-center justify-around">
          <button
            type="button"
            onClick={() => setActiveMenu("asesmen")}
            className={`cursor-pointer flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition ${
              activeMenu === "asesmen"
                ? "bg-white/15 text-[#D4F34A] font-bold"
                : "text-white/70 hover:text-white"
            }`}
          >
            <FlatIcon name="edit" className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">Asesmen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu("kalender")}
            className={`cursor-pointer flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition ${
              activeMenu === "kalender"
                ? "bg-white/15 text-[#D4F34A] font-bold"
                : "text-white/70 hover:text-white"
            }`}
          >
            <FlatIcon name="calendar" className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">Kalender</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu("chat")}
            className={`cursor-pointer flex flex-col items-center justify-center px-5 py-1.5 rounded-full transition relative ${
              activeMenu === "chat"
                ? "bg-white/15 text-[#D4F34A] font-bold"
                : "text-white/70 hover:text-white"
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
                ? "bg-white/15 text-[#D4F34A] font-bold"
                : "text-white/70 hover:text-white"
            }`}
          >
            <FlatIcon name="settings" className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">Setting</span>
          </button>
        </nav>
      </div>

      {/* MODAL CHECKOUT QRIS */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-[#14141F]/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-[#14141F] w-full max-w-md rounded-2xl p-6 space-y-4 border border-[#14141F]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[10px] font-bold bg-[#D4F34A] text-[#14141F] px-2 py-0.5 rounded-md">
                  Invoice #{checkoutModal.invoiceId}
                </span>
                <h3 className="text-base font-bold mt-0.5">
                  {checkoutModal.namaPaket} (+{checkoutModal.koin} Koin)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutModal(null)}
                className="cursor-pointer w-8 h-8 rounded-lg bg-[#F4F5F7] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCheckoutModal(null)}
                className="cursor-pointer w-1/3 bg-[#F4F5F7] font-bold text-xs py-3 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangProsesBayar}
                onClick={handleKonfirmasiBayarDanKirimWA}
                className="cursor-pointer flex-1 bg-[#D4F34A] text-[#14141F] font-bold text-xs py-3 rounded-lg"
              >
                {sedangProsesBayar ? "Mengirim..." : "Konfirmasi ke WA Admin"}
              </button>
            </div>
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
              className="w-full bg-[#F4F5F7] border border-[#E2E8F0] rounded-lg px-4 py-3 text-center text-base sm:text-sm font-bold outline-none"
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
                  Langkah {s.partNumber || idx + 1} • {s.partTitle} (
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
