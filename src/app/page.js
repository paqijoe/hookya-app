"use client"
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import {
  FlatIcon,
  StoryVoiceInput,
  formatKoinSingkat,
  AvatarCropModal,
} from "../components/SharedUI"
import AuthFullscreen from "../components/AuthFullscreen"
import PersonaDNAView from "../components/PersonaDNAView"
import ScriptProducerView from "../components/ScriptProducerView"
import VideoExtractorView from "../components/VideoExtractorView"
import DeveloperDashboardView from "../components/DeveloperDashboardView"

const SEPULUH_BENTUK_KONTEN = [
  {
    id: 1,
    nama: "B-Roll Estetik + Teks di Layar (Tanpa Ngomong & Tanpa Wajah)",
    modeDefault: "teks",
    ket: "Rekam suasana atau aktivitas, cerita disampaikan lewat teks di layar.",
  },
  {
    id: 2,
    nama: "POV Tangan / Meja + Suara AI TikTok (Tanpa Wajah)",
    modeDefault: "voiceover",
    ket: "Kamera menyorot tangan di meja, naskah dibacakan suara voiceover.",
  },
  {
    id: 3,
    nama: "B-Roll Aktivitas + Voiceover Santai (Rekam Suara Belakangan)",
    modeDefault: "voiceover",
    ket: "Rekam kegiatan harianmu dulu, lalu isi suara naskah dari balik layar.",
  },
  {
    id: 4,
    nama: "Talking Head + Teleprompter (Ngobrol Langsung ke Kamera)",
    modeDefault: "voiceover",
    ket: "Bicara langsung ke kamera sambil membaca tampilan teks Hookya.",
  },
  {
    id: 5,
    nama: "ASMR / Suara Asli Aktivitas + Teks Pendek (Tanpa Bicara)",
    modeDefault: "teks",
    ket: "Gunakan suara asli aktivitas (ketikan, masakan, buka paket) dengan teks singkat.",
  },
  {
    id: 6,
    nama: "Green Screen Reaksi / Komentar Tren & Fakta Unik",
    modeDefault: "voiceover",
    ket: "Tampilkan tangkapan layar berita atau produk di belakangmu lalu berikan tanggapan.",
  },
  {
    id: 7,
    nama: "Vlog Mini Keseharian (A Day in My Life)",
    modeDefault: "voiceover",
    ket: "Gabungan 5 sampai 6 klip pendek kegiatan harian dengan narasi cerita.",
  },
  {
    id: 8,
    nama: "Tutorial Layar HP / Laptop (Screen Recording)",
    modeDefault: "voiceover",
    ket: "Rekam layar HP atau laptop saat menunjukkan langkah penggunaan aplikasi atau website.",
  },
  {
    id: 9,
    nama: "Sketsa POV Situasi Sehari-hari",
    modeDefault: "teks",
    ket: "Peragakan situasi singkat dengan teks kejadian yang sering dialami penonton.",
  },
  {
    id: 10,
    nama: "Slide Foto / Carousel Cerita Bergambar (Geser Foto)",
    modeDefault: "teks",
    ket: "Susun 4 sampai 6 foto berurutan dengan teks penjelasan di setiap halaman.",
  },
]

const DEFAULT_PERSONA_PROFILE = {
  user_id: "usr_99281",
  persona_summary:
    "Gaya bicara jujur, santai, dan langsung membahas praktik nyata sehari-hari.",
  positioning_and_usp: {
    authority_role: "Praktisi & Teman Diskusi",
    unique_selling_point: "Berbagi praktik nyata di lapangan",
    common_enemy: "Teori tanpa langkah praktis",
    personal_analogies: "Kegiatan sehari-hari, kerjaan, dan hobi",
  },
  target_audience: {
    segment_profile: "Anak muda & pekerja produktif",
    deepest_pain_points: "Rugi uang dan waktu",
    secret_desires: "Hasil praktis yang terukur",
    common_objections: "Bingung mulai dari mana",
  },
  linguistic_matrix: {
    self_pronoun: "Gue",
    audience_pronoun: "Lo / Kalian",
    greeting_signature: ["Gini bro,", "Coba pikir deh,"],
    favorite_transitions: ["Masalahnya,", "Intinya simpel:"],
    signature_vocabulary: ["boncos", "valid", "eksekusi"],
    forbidden_words: [
      "membuka potensi",
      "level berikutnya",
      "memberdayakan",
      "menyelami",
      "bukti nyata",
      "lanskap",
      "pengubah permainan",
      "bukan sekadar",
      "di era digital saat ini",
    ],
  },
}

function hitungSisaHariAktif(expiredAtStr) {
  if (!expiredAtStr) return 30
  const target = new Date(expiredAtStr).getTime()
  const sekarang = Date.now()
  const selisih = Math.ceil((target - sekarang) / (1000 * 60 * 60 * 24))
  return Math.max(0, selisih)
}

// Rumus Kuota Profil Akun Sosial Media per Paket:
// 5K = 1 akun | 10K-20K = 2 akun | 25K = 3 akun | 50K = 5 akun | 90K = 10 akun
function hitungKuotaAkunDariPaket(
  namaPaket = "",
  nominal = 0,
  isAdmin = false,
) {
  if (isAdmin) return 10
  const p = (namaPaket || "").toLowerCase()
  const nom = Number(nominal) || 0
  if (p.includes("90") || nom >= 85000) return 10
  if (p.includes("50") || nom >= 45000) return 5
  if (p.includes("25") || nom >= 24000) return 3
  if (
    p.includes("20") ||
    p.includes("15") ||
    p.includes("10") ||
    (nom >= 9000 && nom < 24000)
  ) {
    return 2
  }
  if (
    p.includes("5k") ||
    p.includes("5.000") ||
    p.includes("coba") ||
    nom > 0
  ) {
    return 1
  }
  return 1
}

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

export default function HookyaMainApp() {
  const [viewMode, setViewMode] = useState("auth")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopMinimized, setDesktopMinimized] = useState(false)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [showDetailKoinPopup, setShowDetailKoinPopup] = useState(false)
  const [showUpgradeVIPModal, setShowUpgradeVIPModal] = useState(false)
  const [activeMenu, setActiveMenu] = useState("produksi")

  const [showPinModal, setShowPinModal] = useState(false)
  const [inputPinDev, setInputPinDev] = useState("")
  const [pinAdminResmi, setPinAdminResmi] = useState("123456")
  const [logoClickCount, setLogoClickCount] = useState(0)

  const [userId, setUserId] = useState(null)
  const [userRole, setUserRole] = useState("user")
  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const [expiredAt, setExpiredAt] = useState(null)
  const [sisaHariPaket, setSisaHariPaket] = useState(30)
  const [namaPaketAktif, setNamaPaketAktif] = useState("Paket 5K (Coba)")
  const [kuotaAkunMaksimal, setKuotaAkunMaksimal] = useState(1)

  const [coins, setCoins] = useState(20)
  const [toastMsg, setToastMsg] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [multiplyingArchiveId, setMultiplyingArchiveId] = useState(null)

  // State Arsip Ringkas, Folder Variasi, Pencarian Keyword, & Kalender Arsip Konten
  const [keywordCariArsip, setKeywordCariArsip] = useState("")
  const [pilihanGandakanArsip, setPilihanGandakanArsip] = useState({})
  const [folderTerbukaMap, setFolderTerbukaMap] = useState({})
  const [kalenderBulan, setKalenderBulan] = useState(() =>
    new Date().getMonth(),
  )
  const [kalenderTahun, setKalenderTahun] = useState(() =>
    new Date().getFullYear(),
  )
  const [tanggalKalenderTerpilih, setTanggalKalenderTerpilih] = useState(
    () => new Date().toISOString().split("T")[0],
  )
  const [idSkripPlotTerpilih, setIdSkripPlotTerpilih] = useState("")

  const [rawCropImageSrc, setRawCropImageSrc] = useState(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 3500)
  }

  const [profil, setProfil] = useState({
    nama: "Kreator",
    username: "",
    kontak: "kreator@gmail.com",
    avatar_url: "",
    usia: "28",
    gender: "Laki-laki",
    peranSaatIni: "Praktisi Bisnis & Kreator yang Bicara dari Pengalaman Nyata",
    uspDiriInput: "",
    analogiKhasInput: "",
    targetSegmenInput: "",
    targetKetakutanInput: "",
    targetImpianInput: "",
    targetKeraguanInput: "",
    kepribadianSosial: "Santai, jujur, dan peduli seperti teman dekat",
    minatUtama: "Bisnis, Keuangan Praktis, Teknologi & Olahraga",
    lingkunganRekam: "Kamar / Meja Kerja di Dalam Ruangan",
    waktuFree: "Malam (20:00 - 21:30)",
    selfPronounInput: "Gue",
    audiencePronounInput: "Lo / Kalian",
    prinsipUtamaInput: "Praktik lebih penting dari teori",
    opiniKontraInput: "Kurang suka teori tanpa langkah praktik",
    idAkunAktif: "akun_utama",
    labelAkunSosmed: "Akun Utama",
    daftarAkunTernak: [],
  })

  const [formUsulan, setFormUsulan] = useState({
    kategori: "Usulan Fitur Baru",
    pesan: "",
  })
  const [riwayatUsulanSaya, setRiwayatUsulanSaya] = useState([])
  const [isSendingUsulan, setIsSendingUsulan] = useState(false)

  const [jadwalFleksibel, setJadwalFleksibel] = useState(false)
  const [jadwalCeklis, setJadwalCeklis] = useState({
    pagi: { aktif: false, mulai: "06:00", selesai: "08:00" },
    siang: { aktif: false, mulai: "12:00", selesai: "14:00" },
    sore: { aktif: false, mulai: "16:00", selesai: "17:30" },
    malam: { aktif: true, mulai: "20:00", selesai: "21:30" },
  })

  useEffect(() => {
    if (jadwalFleksibel) {
      setProfil((prev) => ({
        ...prev,
        waktuFree: "Fleksibel (Kapan Saja)",
      }))
      return
    }
    const aktifList = []
    if (jadwalCeklis.pagi.aktif)
      aktifList.push(
        `Pagi (${jadwalCeklis.pagi.mulai}-${jadwalCeklis.pagi.selesai})`,
      )
    if (jadwalCeklis.siang.aktif)
      aktifList.push(
        `Siang (${jadwalCeklis.siang.mulai}-${jadwalCeklis.siang.selesai})`,
      )
    if (jadwalCeklis.sore.aktif)
      aktifList.push(
        `Sore (${jadwalCeklis.sore.mulai}-${jadwalCeklis.sore.selesai})`,
      )
    if (jadwalCeklis.malam.aktif)
      aktifList.push(
        `Malam (${jadwalCeklis.malam.mulai}-${jadwalCeklis.malam.selesai})`,
      )

    setProfil((prev) => ({
      ...prev,
      waktuFree: aktifList.length > 0 ? aktifList.join(", ") : "Fleksibel",
    }))
  }, [jadwalFleksibel, jadwalCeklis])

  const [rawWritingSamples, setRawWritingSamples] = useState("")
  const [personaProfile, setPersonaProfile] = useState(DEFAULT_PERSONA_PROFILE)
  const [bentukKonten, setBentukKonten] = useState(
    SEPULUH_BENTUK_KONTEN[3].nama,
  )
  const [deskripsiBentukSendiri, setDeskripsiBentukSendiri] = useState("")
  const bentukKontenFinal = deskripsiBentukSendiri.trim()
    ? `${bentukKonten} (Catatan: ${deskripsiBentukSendiri.trim()})`
    : bentukKonten

  const [daftar10IdeTopik, setDaftar10IdeTopik] = useState([])

  const [stage, setStage] = useState(0)
  const [hasilSkrip, setHasilSkrip] = useState(null)
  const [modeTampilanSkrip, setModeTampilanSkrip] = useState("voiceover")
  const [modeTeleprompter, setModeTeleprompter] = useState(false)

  const [koleksiSkripTersimpan, setKoleksiSkripTersimpan] = useState([])
  const [semuaSkripAdmin, setSemuaSkripAdmin] = useState([])
  const [formKinerja, setFormKinerja] = useState({})
  const [semuaUserDB, setSemuaUserDB] = useState([])
  const [daftarTransaksi, setDaftarTransaksi] = useState([])

  const [checkoutModal, setCheckoutModal] = useState(null)
  const [buktiBayarBase64, setBuktiBayarBase64] = useState("")
  const [namaFileBukti, setNamaFileBukti] = useState("")
  const [sedangProsesBayar, setSedangProsesBayar] = useState(false)
  const [inputKodeVoucherUser, setInputKodeVoucherUser] = useState("")

  const [pengaturanPayment, setPengaturanPayment] = useState({
    modePembayaranAktif: "qris_manual",
    modeVerifikasi: "manual_admin",
    namaMerchant: "HOOKYA OFFICIAL",
    infoRekening: "QRIS / BCA / SeaBank / GoPay / DANA a.n Admin Hookya",
    noWaAdmin: "6281234567890",
    qrisImageUrl: "",
    duitkuMerchantCode: "",
    duitkuApiKey: "",
    duitkuIsProduction: false,
  })

  const [daftarVoucher, setDaftarVoucher] = useState([
    { kode: "HOOKYA20", koin: 20, kuota: 50, terpakai: 0 },
    { kode: "GRATIS10", koin: 10, kuota: 100, terpakai: 0 },
  ])

  const [customPrompts, setCustomPrompts] = useState({
    persona_engine: "Ekstrak sapaan dan kosakata khas pengguna dengan akurat.",
    assessment_copilot: "Berikan 3 pilihan sudut pandang yang konkret.",
    script_humanizer:
      "Tulis dengan bahasa lisan yang mengalir alami saat diucapkan.",
  })

  const getAvatarUrlUser = () => {
    if (profil.avatar_url && profil.avatar_url.trim() !== "") {
      return profil.avatar_url
    }
    const namaBersih = encodeURIComponent(
      profil.nama || profil.kontak || "User",
    )
    return `https://ui-avatars.com/api/?name=${namaBersih}&background=d4f34a&color=14141f&bold=true&size=128`
  }

  const handlePilihFileFotoProfil = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setRawCropImageSrc(ev.target.result)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handleSimpanHasilCrop1x1 = async (croppedDataUrl) => {
    setRawCropImageSrc(null)
    setProfil((prev) => ({ ...prev, avatar_url: croppedDataUrl }))
    if (userId) {
      await supabase
        .from("users")
        .update({
          avatar_url: croppedDataUrl,
          profil_dna: { ...profil, avatar_url: croppedDataUrl },
        })
        .eq("id", userId)
    }
    showToast("Foto profil 1:1 berhasil diperbarui.")
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
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75)
        setBuktiBayarBase64(dataUrl)
        showToast("Foto bukti pembayaran berhasil dilampirkan.")
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
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
          userRows.find((u) => u.profil_dna?.pengaturanPayment?.qrisImageUrl) ||
          userRows.find(
            (u) => u.role === "admin" && u.profil_dna?.pengaturanPayment,
          ) ||
          userRows.find((u) => u.profil_dna?.pengaturanPayment) ||
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
          if (configRow.profil_dna.customPrompts) {
            setCustomPrompts(configRow.profil_dna.customPrompts)
          }
        }

        if (activeUser) {
          const roleAktif =
            activeUser.role ||
            (activeUser.id === userRows[0]?.id ? "admin" : "user")
          const isOwnerOrAdmin =
            roleAktif === "admin" ||
            activeUser.nama?.toLowerCase().includes("faqih") ||
            activeUser.nama?.toLowerCase().includes("qih") ||
            activeUser.username?.toLowerCase() === "paqijoe"

          const expStr =
            activeUser.expired_at || activeUser.profil_dna?.expired_at
          const sisaHari = isOwnerOrAdmin ? 365 : hitungSisaHariAktif(expStr)

          // Cek paket terakhir yang lunas dari transaksi atau dari profil_dna
          const trxLunasTerakhir = (trxRows || []).find(
            (t) => t.user_id === activeUser.id && t.status === "lunas",
          )
          const paketTersimpan =
            trxLunasTerakhir?.nama_paket ||
            activeUser.profil_dna?.paketAktif ||
            (activeUser.is_premium ? "Paket 20K VIP" : "Paket 5K (Coba)")
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

          if (!isOwnerOrAdmin && sisaHari === 0 && (activeUser.koin || 0) > 0) {
            setCoins(0)
            await supabase
              .from("users")
              .update({ koin: 0 })
              .eq("id", activeUser.id)
          } else {
            setCoins(activeUser.koin ?? 20)
          }

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
          setViewMode("user")
        }
      }

      const { data: scriptRows } = await supabase
        .from("scripts")
        .select("*")
        .order("created_at", { ascending: false })

      if (scriptRows) {
        const formatBarisSkrip = (row) => {
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
              new Date(row.created_at).toLocaleDateString("id-ID"),
            scriptScore: row.segmen_skrip?.meta?.scriptScore || null,
            kritikSaran: row.segmen_skrip?.meta?.kritikSaran || "",
            uploadPack: row.segmen_skrip?.meta?.uploadPack || null,
            uploadPackage: row.segmen_skrip?.meta?.uploadPack || null,
            variasiFolder: Array.isArray(row.segmen_skrip?.meta?.variasiFolder)
              ? row.segmen_skrip.meta.variasiFolder
              : [],
            sections: segmenArr,
            segmen: segmenArr,
            sudahUpload: Boolean(row.segmen_skrip?.meta?.sudahUpload),
            tanggalUpload: row.segmen_skrip?.meta?.tanggalUpload || "",
            views: row.segmen_skrip?.meta?.views ?? null,
            likes: row.segmen_skrip?.meta?.likes ?? null,
            komen: row.segmen_skrip?.meta?.komen ?? null,
            sudahEvaluasi: Boolean(row.segmen_skrip?.meta?.sudahEvaluasi),
            evaluasiAI: row.segmen_skrip?.meta?.evaluasiAI || "",
          }
        }

        const semuaTerformat = scriptRows.map(formatBarisSkrip)
        setSemuaSkripAdmin(semuaTerformat)

        const idAktifSekarang = activeUser?.id || idTarget
        if (idAktifSekarang) {
          setKoleksiSkripTersimpan(
            semuaTerformat.filter((s) => s.userId === idAktifSekarang),
          )
        }
      }

      const idAktifFb = activeUser?.id || idTarget
      if (idAktifFb) {
        const { data: fbUser } = await supabase
          .from("feedbacks")
          .select("*")
          .eq("user_id", idAktifFb)
          .order("created_at", { ascending: false })
        if (fbUser) setRiwayatUsulanSaya(fbUser)
      }
    } catch {
      // Abaikan
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
          jadwalFleksibel,
          jadwalCeklis,
          rawWritingSamples,
          personaProfile: personaTerbaru,
          bentukKonten,
          deskripsiBentukSendiri,
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
      semuaUserDB
        .filter((u) => u.role === "admin")
        .forEach((u) => targetIds.add(u.id))

      for (const idTarget of targetIds) {
        const rowLama = semuaUserDB.find((u) => u.id === idTarget)
        const dnaLama = rowLama?.profil_dna || {}
        await supabase
          .from("users")
          .update({
            role: "admin",
            profil_dna: {
              ...dnaLama,
              pengaturanPayment: paymentOverride,
              daftarVoucher,
              customPrompts,
              pinAdminResmi,
            },
          })
          .eq("id", idTarget)
      }

      await muatUlangDataSupabase()
      showToast(
        "Gambar QRIS Statis dan Nomor WA Admin berhasil disimpan ke Database.",
      )
    } catch (err) {
      showToast("Gagal menyimpan pengaturan: " + err.message)
    }
  }

  const simpanAtauUpdateSkripDatabase = async (skripObj) => {
    const payloadSegmen = {
      segmen: skripObj.segmen || skripObj.sections || [],
      meta: {
        waktuDibuat: skripObj.waktuDibuat,
        scriptScore: skripObj.scriptScore || null,
        kritikSaran: skripObj.kritikSaran || "",
        uploadPack: skripObj.uploadPack || skripObj.uploadPackage || null,
        variasiFolder: Array.isArray(skripObj.variasiFolder)
          ? skripObj.variasiFolder
          : [],
        sudahUpload: skripObj.sudahUpload,
        tanggalUpload: skripObj.tanggalUpload,
        views: skripObj.views,
        likes: skripObj.likes,
        komen: skripObj.komen,
        sudahEvaluasi: skripObj.sudahEvaluasi,
        evaluasiAI: skripObj.evaluasiAI,
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
      // Fallback
    }
    return skripObj
  }

  // GANDAKAN SKRIP DARI ARSIP -> MASUK KE DALAM 1 FOLDER PADA KARTU TOPIK TERSEBUT
  const handleGandakanDariArsip = async (itemArsip) => {
    if (multiplyingArchiveId) return
    const jmlX = parseInt(pilihanGandakanArsip[itemArsip.id] || "2") || 2
    const biayaKoin = jmlX === 10 ? 3 : jmlX === 5 ? 2 : 1

    if (coins < biayaKoin) {
      alert(
        `Saldo koin belum mencukupi (Perlu ${biayaKoin} Koin untuk membuat ${jmlX}x variasi skrip). Silakan isi ulang koin.`,
      )
      setActiveMenu("topup")
      return
    }

    setMultiplyingArchiveId(itemArsip.id)
    await updateKoinDatabase(coins - biayaKoin)
    showToast(
      `Menyusun ${jmlX} variasi skrip ke dalam Folder "${itemArsip.judul}"...`,
    )

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "multiply_script_variations",
          userId,
          namaUser: profil.nama,
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
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")
      }

      const listVariasi = Array.isArray(data.daftarVariasi)
        ? data.daftarVariasi
        : []
      const waktuSekarang = new Date().toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      const itemVariasiBaru = listVariasi.map((v, i) => ({
        id: Date.now() + i + 1,
        judul: v.judulVariasi || `Variasi ${i + 1}`,
        waktuDibuat: waktuSekarang,
        sections: v.sections || v.segmen || itemArsip.segmen,
        segmen: v.segmen || v.sections || itemArsip.segmen,
      }))

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
      showToast(
        `${itemVariasiBaru.length} variasi berhasil disimpan ke dalam Folder "${itemArsip.judul}".`,
      )
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setMultiplyingArchiveId(null)
    }
  }

  // Fungsi Plot / Jadwalkan Skrip ke Tanggal di Kalender Arsip Konten
  const handlePlotSkripKeTanggalKalender = async (idSkrip, tglTarget) => {
    const itemTarget = koleksiSkripTersimpan.find(
      (s) => String(s.id) === String(idSkrip),
    )
    if (!itemTarget || !tglTarget) return

    const updated = {
      ...itemTarget,
      sudahUpload: true,
      tanggalUpload: tglTarget,
    }
    setKoleksiSkripTersimpan((prev) =>
      prev.map((s) => (s.id === itemTarget.id ? updated : s)),
    )
    await simpanAtauUpdateSkripDatabase(updated)
    setIdSkripPlotTerpilih("")
    showToast(
      `Skrip "${itemTarget.judul}" ditambahkan ke tanggal ${tglTarget}.`,
    )
  }

  const handleHapusSkripDariTanggalKalender = async (item) => {
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

  const handleKirimUsulanUser = async (e) => {
    e.preventDefault()
    if (!formUsulan.pesan.trim()) {
      alert("Silakan tuliskan usulan atau keluhanmu terlebih dahulu.")
      return
    }
    setIsSendingUsulan(true)
    try {
      const payload = {
        user_id: userId,
        nama_user: profil.nama,
        email_user: profil.kontak,
        kategori: formUsulan.kategori,
        pesan: formUsulan.pesan.trim(),
        status: "baru",
      }
      const { data, error } = await supabase
        .from("feedbacks")
        .insert([payload])
        .select()
        .single()
      if (error) throw error

      setRiwayatUsulanSaya([
        data || { ...payload, id: Date.now(), created_at: new Date() },
        ...riwayatUsulanSaya,
      ])
      setFormUsulan({ ...formUsulan, pesan: "" })
      showToast("Usulan kamu telah dikirim ke Dashboard Developer.")
    } catch (err) {
      showToast("Gagal mengirim usulan: " + err.message)
    } finally {
      setIsSendingUsulan(false)
    }
  }

  const bukaLayarCheckoutPaket = async (paketObj) => {
    const kodeUnik = Math.floor(101 + Math.random() * 499)
    const nomorInvoice = `INV-${Date.now().toString().slice(-6)}`
    setBuktiBayarBase64("")
    setNamaFileBukti("")

    if (pengaturanPayment.modePembayaranAktif === "duitku_gateway") {
      try {
        const res = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_gateway_invoice",
            invoiceId: nomorInvoice,
            userId,
            namaUser: profil.nama,
            emailUser: profil.kontak,
            namaPaket: paketObj.nama,
            jumlahKoin: paketObj.koin,
            nominal: paketObj.nominalAngka,
            duitkuConfigClient: {
              merchantCode: pengaturanPayment.duitkuMerchantCode,
              apiKey: pengaturanPayment.duitkuApiKey,
              isProduction: pengaturanPayment.duitkuIsProduction,
            },
          }),
        })
        const data = await res.json()
        if (data.mode === "duitku" && data.redirectUrl) {
          window.open(data.redirectUrl, "_blank")
        }
      } catch {
        // Fallback QRIS
      }
    }

    setCheckoutModal({
      invoiceId: nomorInvoice,
      namaPaket: paketObj.nama,
      koin: paketObj.koin,
      nominalAsli: paketObj.nominalAngka,
      kodeUnik,
      nominalBayar: paketObj.nominalAngka + kodeUnik,
    })
  }

  const handleKonfirmasiBayarDanKirimWA = async () => {
    if (!checkoutModal) return
    if (
      (pengaturanPayment.modePembayaranAktif || "qris_manual") ===
        "qris_manual" &&
      !buktiBayarBase64
    ) {
      alert(
        "Silakan unggah foto atau screenshot bukti pembayaran QRIS terlebih dahulu.",
      )
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
      metode_bayar: "QRIS Top-Up (Bukti Diupload)",
      bukti_bayar: buktiBayarBase64 || null,
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
        : nomorWA.startsWith("8")
          ? "62" + nomorWA
          : nomorWA

      const pesanWA = encodeURIComponent(
        `Halo Admin Hookya.\nSaya sudah melakukan pembayaran Top-Up QRIS dan mengunggah bukti pembayaran di aplikasi:\n\n` +
          `Invoice: *#${checkoutModal.invoiceId}*\n` +
          `Nama Akun: *${profil.nama}* (${profil.kontak})\n` +
          `Paket: *${checkoutModal.namaPaket} (+${checkoutModal.koin} Koin, +30 Hari)*\n` +
          `Nominal Transfer: *Rp${checkoutModal.nominalBayar.toLocaleString("id-ID")}*\n\n` +
          `Mohon diperiksa di Dashboard Admin Hookya. Terima kasih.`,
      )

      window.open(`https://wa.me/${nomorWAFinal}?text=${pesanWA}`, "_blank")
      showToast(
        "Bukti pembayaran disimpan ke Dashboard Admin dan membuka WhatsApp Admin.",
      )
    } finally {
      setSedangProsesBayar(false)
      setCheckoutModal(null)
      setBuktiBayarBase64("")
      setNamaFileBukti("")
    }
  }

  const handleKlaimVoucherUser = async () => {
    const kodeBersih = inputKodeVoucherUser.trim().toUpperCase()
    if (!kodeBersih) return
    const ditemukan = daftarVoucher.find(
      (v) => v.kode.toUpperCase() === kodeBersih,
    )
    if (!ditemukan || ditemukan.terpakai >= ditemukan.kuota) {
      alert("Kode voucher tidak ditemukan atau kuota sudah habis.")
      return
    }
    const tambahan = parseInt(ditemukan.koin) || 10
    await updateKoinDatabase(coins + tambahan)
    setDaftarVoucher(
      daftarVoucher.map((v) =>
        v.kode.toUpperCase() === kodeBersih
          ? { ...v, terpakai: v.terpakai + 1 }
          : v,
      ),
    )
    setInputKodeVoucherUser("")
    showToast(`Voucher diklaim. +${tambahan} Koin ditambahkan.`)
  }

  const handleToggleSudahUpload = async (item, checked) => {
    const tglDefault = checked
      ? item.tanggalUpload || new Date().toISOString().split("T")[0]
      : ""
    const updated = {
      ...item,
      sudahUpload: checked,
      tanggalUpload: tglDefault,
    }
    setKoleksiSkripTersimpan((prev) =>
      prev.map((s) => (s.id === item.id ? updated : s)),
    )
    await simpanAtauUpdateSkripDatabase(updated)
  }

  const handleKirimLaporanKinerjaVT = async (item) => {
    const input = formKinerja[item.id] || {}
    const views = parseInt(input.views ?? item.views ?? 0) || 0
    const likes = parseInt(input.likes ?? item.likes ?? 0) || 0
    const komen = parseInt(input.komen ?? item.komen ?? 0) || 0

    setIsGenerating(true)
    let catatanEvaluasi = `Dalam sepekan, konten ini meraih ${views} views, ${likes} like, dan ${komen} komentar.`

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluasi_kinerja_vt",
          userId,
          namaUser: profil.nama,
          dataKinerja: {
            judul: item.judul,
            waktuDibuat: item.waktuDibuat,
            tanggalUpload: item.tanggalUpload,
            views,
            likes,
            komen,
          },
        }),
      })
      const data = await res.json()
      if (res.ok && data.evaluasiAI) catatanEvaluasi = data.evaluasiAI
    } catch {
      // Fallback
    }

    const updated = {
      ...item,
      sudahUpload: true,
      tanggalUpload:
        item.tanggalUpload || new Date().toISOString().split("T")[0],
      views,
      likes,
      komen,
      sudahEvaluasi: true,
      evaluasiAI: catatanEvaluasi,
    }

    setKoleksiSkripTersimpan((prev) =>
      prev.map((s) => (s.id === item.id ? updated : s)),
    )
    await simpanAtauUpdateSkripDatabase(updated)
    if (!item.sudahEvaluasi) await updateKoinDatabase(coins + 2)
    setIsGenerating(false)
    showToast("Laporan kinerja disimpan.")
  }

  const isAdminAccount =
    userRole === "admin" ||
    profil.nama?.toLowerCase().includes("faqih") ||
    profil.nama?.toLowerCase().includes("qih") ||
    profil.nama?.toLowerCase().includes("admin") ||
    profil.username?.toLowerCase() === "paqijoe"

  const statusVIPFinal = Boolean(isAdminAccount || isPremiumUser)

  const jumlahMenungguLaporan = koleksiSkripTersimpan.filter(
    (s) => s.sudahUpload && !s.sudahEvaluasi,
  ).length

  // Filter Pencarian Keyword pada Arsip Skrip Tersimpan
  const arsipTerfilterKeyword = koleksiSkripTersimpan.filter((item) => {
    if (!keywordCariArsip.trim()) return true
    const q = keywordCariArsip.toLowerCase()
    const cocokJudul = (item.judul || "").toLowerCase().includes(q)
    const cocokKategori = (item.kategori || "").toLowerCase().includes(q)
    const cocokIsi = (item.segmen || []).some((seg) =>
      (seg.spokenText || seg.voiceover || "").toLowerCase().includes(q),
    )
    const cocokFolder = (item.variasiFolder || []).some((vf) =>
      (vf.judul || "").toLowerCase().includes(q),
    )
    return cocokJudul || cocokKategori || cocokIsi || cocokFolder
  })

  // Pembantu Kalender Arsip Konten
  const buatGridTanggalBulan = (tahun, bulan) => {
    const hariPertama = new Date(tahun, bulan, 1).getDay()
    const jumlahHari = new Date(tahun, bulan + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < hariPertama; i++) {
      cells.push(null)
    }
    for (let d = 1; d <= jumlahHari; d++) {
      const mm = String(bulan + 1).padStart(2, "0")
      const dd = String(d).padStart(2, "0")
      cells.push({
        hari: d,
        iso: `${tahun}-${mm}-${dd}`,
      })
    }
    return cells
  }

  const gridHariKalender = buatGridTanggalBulan(kalenderTahun, kalenderBulan)
  const daftarSkripPadaTanggalTerpilih = koleksiSkripTersimpan.filter(
    (s) => s.tanggalUpload === tanggalKalenderTerpilih,
  )

  if (viewMode === "auth") {
    return (
      <AuthFullscreen
        onNotify={showToast}
        onAuthSuccess={async (userRow) => {
          if (userRow?.id) {
            if (typeof window !== "undefined") {
              localStorage.setItem("hookya_active_user_id", userRow.id)
            }
            await muatUlangDataSupabase(userRow.id)
          }
          setViewMode("user")
        }}
      />
    )
  }

  if (viewMode === "dev") {
    return (
      <DeveloperDashboardView
        onSwitchToUserView={() => setViewMode("user")}
        semuaUserDB={semuaUserDB}
        daftarTransaksi={daftarTransaksi}
        koleksiSkripTersimpan={
          semuaSkripAdmin.length > 0 ? semuaSkripAdmin : koleksiSkripTersimpan
        }
        pengaturanPayment={pengaturanPayment}
        setPengaturanPayment={setPengaturanPayment}
        pinAdminResmi={pinAdminResmi}
        setPinAdminResmi={setPinAdminResmi}
        daftarVoucher={daftarVoucher}
        setDaftarVoucher={setDaftarVoucher}
        customPrompts={customPrompts}
        setCustomPrompts={setCustomPrompts}
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
            const isPendaftaranBaru =
              infoCatatan?.tipe === "PENDAFTARAN_BARU" ||
              targetU.profil_dna?.statusPendaftaran === "menunggu_acc_admin"

            const sisaHariLama = isPendaftaranBaru
              ? 0
              : hitungSisaHariAktif(
                  targetU.expired_at || targetU.profil_dna?.expired_at,
                )
            const durasiTambahan = parseInt(infoCatatan?.durasiHari) || 30
            const totalHariBaru = sisaHariLama + durasiTambahan
            const expiredBaruISO = new Date(
              Date.now() + totalHariBaru * 24 * 60 * 60 * 1000,
            ).toISOString()

            const koinDasar = sisaHariLama > 0 ? targetU.koin || 0 : 0
            const totalKoinBaru = koinDasar + (parseInt(trx.jumlah_koin) || 0)

            const nominalTrx =
              parseInt(trx.nominal_asli) || parseInt(trx.nominal_bayar) || 0
            const jadiVIP =
              Boolean(
                infoCatatan?.isVIP ||
                targetU.is_premium ||
                targetU.profil_dna?.is_premium,
              ) || nominalTrx >= 20000

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

            if (targetU.id === userId) {
              setCoins(totalKoinBaru)
              setIsPremiumUser(jadiVIP)
              setNamaPaketAktif(trx.nama_paket)
              setKuotaAkunMaksimal(kuotaAkunBaru)
              setExpiredAt(expiredBaruISO)
              setSisaHariPaket(totalHariBaru)
            }

            const rawWaUser =
              infoCatatan?.whatsapp ||
              targetU.whatsapp ||
              targetU.profil_dna?.whatsapp ||
              ""
            const waBersih = rawWaUser.replace(/\D/g, "")

            if (waBersih) {
              const waFormatted = waBersih.startsWith("08")
                ? "62" + waBersih.slice(1)
                : waBersih.startsWith("8")
                  ? "62" + waBersih
                  : waBersih

              const usernameLogin =
                infoCatatan?.username ||
                targetU.username ||
                targetU.profil_dna?.username ||
                targetU.email
              const emailLogin =
                infoCatatan?.email ||
                targetU.email ||
                targetU.profil_dna?.kontak ||
                "-"
              const passwordLogin =
                infoCatatan?.password ||
                targetU.password_hash ||
                targetU.profil_dna?.pin ||
                "12345678"

              const teksKonfirmasiWA = encodeURIComponent(
                `*KONFIRMASI PEMBAYARAN & AKTIVASI AKUN HOOKYA.SITE*\n\n` +
                  `Halo Kak *${targetU.nama}*, pembayaran kamu telah diverifikasi oleh Admin. Berikut adalah rincian paket dan akunmu:\n\n` +
                  `*RINCIAN PAKET AKTIF:*\n` +
                  `No. Invoice: *#${trx.invoice_id}*\n` +
                  `Nama Paket: *${trx.nama_paket}*\n` +
                  `Kuota Profil Akun Sosmed: *Maksimal ${kuotaAkunBaru} Akun*\n` +
                  `Nominal Pembayaran: *Rp${Number(
                    trx.nominal_bayar,
                  ).toLocaleString("id-ID")} (LUNAS)*\n` +
                  `Jumlah Koin Masuk: *+${trx.jumlah_koin} Koin* (Total Saldo: *${totalKoinBaru} Koin*)\n` +
                  `Durasi Masa Aktif: *${totalHariBaru} Hari*\n\n` +
                  `*INFORMASI LOGIN AKUN:*\n` +
                  `Username: *${usernameLogin}*\n` +
                  `Gmail: *${emailLogin}*\n` +
                  `Password: *${passwordLogin}*\n\n` +
                  `Silakan masuk ke aplikasi melalui: https://hookya.site`,
              )

              window.open(
                `https://wa.me/${waFormatted}?text=${teksKonfirmasiWA}`,
                "_blank",
              )
            }
          }

          setDaftarTransaksi(
            daftarTransaksi.map((t) =>
              t.id === trx.id ? { ...t, status: "lunas" } : t,
            ),
          )
          await muatUlangDataSupabase()
          showToast("Pembayaran di-ACC dan membuka WhatsApp User.")
        }}
        simpanPengaturanDevKeDB={simpanPengaturanDevPermanen}
        muatUlangDataSupabase={muatUlangDataSupabase}
        showToast={showToast}
      />
    )
  }

  const daftarMenuUser = [
    { id: "dna", label: "Profil & Gaya Bicara", icon: "dna" },
    { id: "produksi", label: "Buat Skrip Konten", icon: "bolt" },
    {
      id: "rewrite",
      label: statusVIPFinal ? "Ekstrak Video ke Skrip" : "Ekstrak Video (VIP)",
      icon: "scissors",
    },
    {
      id: "tersimpan",
      label: "Arsip Skrip Tersimpan",
      icon: "bookmark",
      badge: koleksiSkripTersimpan.length,
    },
    {
      id: "kalender",
      label: "Kalender Arsip Konten",
      icon: "calendar",
    },
    {
      id: "rapor",
      label: "Laporan Kinerja VT",
      icon: "chart",
      badge: jumlahMenungguLaporan,
    },
    { id: "topup", label: "Pembelian Paket Koin", icon: "coin" },
    { id: "usulan", label: "Usulan Pengembangan", icon: "code" },
  ]

  const daftarPaketKoin = [
    {
      nama: "Paket 5K (Coba)",
      harga: "Rp5.000",
      nominalAngka: 5000,
      koin: 10,
      kuotaAkun: 1,
      isVIP: false,
      ket: "Aktif 30 Hari • Kuota 1 Profil Akun Sosmed • Akses Buat Skrip Teks & Durasi 15s-3m.",
    },
    {
      nama: "Paket 10K (Pemula)",
      harga: "Rp10.000",
      nominalAngka: 10000,
      koin: 20,
      kuotaAkun: 2,
      isVIP: false,
      ket: "Aktif 30 Hari • Kuota 2 Profil Akun Sosmed • Sisa koin lama tidak hangus (Rollover).",
    },
    {
      nama: "Paket 15K (Hemat)",
      harga: "Rp15.000",
      nominalAngka: 15000,
      koin: 30,
      kuotaAkun: 2,
      isVIP: false,
      ket: "Aktif 30 Hari • Kuota 2 Profil Akun Sosmed • Pilihan hemat untuk skrip mingguan.",
    },
    {
      nama: "Paket 20K VIP",
      harga: "Rp20.000",
      nominalAngka: 20000,
      koin: 40,
      kuotaAkun: 2,
      isVIP: true,
      ket: "Kuota 2 Profil Akun • Buka Fitur VIP: Mic Suara, Scan Produk, Ekstrak Video & Tanpa Watermark.",
    },
    {
      nama: "Paket 25K VIP",
      harga: "Rp25.000",
      nominalAngka: 25000,
      koin: 55,
      kuotaAkun: 3,
      isVIP: true,
      populer: true,
      ket: "Kuota 3 Profil Akun Sosmed • Buka Semua Fitur VIP + 55 Koin untuk Kreator Aktif.",
    },
    {
      nama: "Paket 50K VIP (Pro)",
      harga: "Rp50.000",
      nominalAngka: 50000,
      koin: 120,
      kuotaAkun: 5,
      isVIP: true,
      ket: "Kuota 5 Profil Akun Sosmed • Buka Semua Fitur VIP + 120 Koin untuk Ternak Akun.",
    },
    {
      nama: "Paket 90K VIP (Agensi)",
      harga: "Rp90.000",
      nominalAngka: 90000,
      koin: 230,
      kuotaAkun: 10,
      isVIP: true,
      ket: "Kuota 10 Profil Akun Sosmed • Buka Semua Fitur VIP + 230 Koin untuk Produksi Masif.",
    },
  ]

  const renderSidebarUserCard = (isCompact = false) => (
    <div className="pt-4 mt-4 border-t border-white/10 space-y-2.5 w-full">
      {!isCompact && (
        <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center gap-3">
            <label
              className="cursor-pointer relative shrink-0 group"
              title="Klik untuk ganti dan geser foto profil 1:1"
            >
              <img
                src={getAvatarUrlUser()}
                alt={profil.nama}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#d4f34a]"
              />
              <span className="absolute -bottom-1 -right-1 bg-[#14141f] text-[#d4f34a] text-[9px] font-bold px-1 rounded border border-[#d4f34a]">
                1:1
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePilihFileFotoProfil}
                className="hidden"
              />
            </label>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {profil.nama}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {namaPaketAktif} ({kuotaAkunMaksimal} Akun)
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/10">
            <span className="text-[#d4f34a] font-bold">
              {statusVIPFinal ? "Member VIP" : "Member Standar"}
            </span>
            <span className="text-slate-300">
              Masa Aktif: <strong>{sisaHariPaket} Hari</strong>
            </span>
          </div>
        </div>
      )}

      {isAdminAccount && !isCompact && (
        <button
          type="button"
          onClick={() => {
            setSidebarOpen(false)
            setShowPinModal(true)
          }}
          className="cursor-pointer w-full bg-white/10 hover:bg-white/15 text-[#d4f34a] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
        >
          <FlatIcon name="code" className="w-4 h-4" />
          <span>Dashboard Developer</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          setSidebarOpen(false)
          if (typeof window !== "undefined") {
            localStorage.removeItem("hookya_active_user_id")
          }
          setViewMode("auth")
        }}
        className="cursor-pointer w-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold py-2.5 rounded-xl transition"
      >
        {isCompact ? "Keluar" : "Keluar / Ganti Akun"}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#14141f] flex flex-col font-sans antialiased tracking-tight overflow-x-hidden w-full max-w-[100vw] pt-16">
      <style jsx global>{`
        @media screen and (max-width: 640px) {
          input,
          textarea,
          select {
            font-size: 16px !important;
          }
        }
      `}</style>

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#14141f] text-[#d4f34a] px-5 py-3.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2.5 border border-[#d4f34a]/40 max-w-md">
          <FlatIcon name="check" className="w-4 h-4 shrink-0" />
          <span className="font-normal text-white">{toastMsg}</span>
        </div>
      )}

      {rawCropImageSrc && (
        <AvatarCropModal
          imageSrc={rawCropImageSrc}
          onCancel={() => setRawCropImageSrc(null)}
          onSaveCrop={handleSimpanHasilCrop1x1}
        />
      )}

      {showUpgradeVIPModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#14141f] w-full max-w-md rounded-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#14141f] text-[#d4f34a] flex items-center justify-center text-sm font-bold mx-auto">
              VIP
            </div>
            <h3 className="text-base sm:text-lg font-bold">
              Fitur Khusus Paket VIP (Rp20.000 ke Atas)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fitur <strong>Rekam Suara Mikrofon</strong>,{" "}
              <strong>Scan Screenshot Produk Marketplace</strong>,{" "}
              <strong>Ekstrak Video ke Skrip</strong>, dan{" "}
              <strong>Kuota Multi-Akun Lebih Besar</strong> terbuka untuk
              pengguna paket VIP.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowUpgradeVIPModal(false)}
                className="cursor-pointer w-1/3 bg-[#f4f5f7] font-bold text-xs py-3 rounded-lg"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeVIPModal(false)
                  setActiveMenu("topup")
                }}
                className="cursor-pointer flex-1 bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3 rounded-lg"
              >
                Lihat Pilihan Paket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER STATIS */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-[#14141f] text-white px-3 sm:px-6 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setSidebarOpen((prev) => !prev)
              } else {
                setDesktopMinimized((prev) => !prev)
              }
            }}
            className="cursor-pointer w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#d4f34a] transition"
          >
            <FlatIcon name="menu" className="w-5 h-5" />
          </button>
        </div>

        <div
          onClick={() => {
            setActiveMenu("produksi")
            const hitunganBaru = logoClickCount + 1
            if (hitunganBaru >= 5) {
              setLogoClickCount(0)
              setShowPinModal(true)
            } else {
              setLogoClickCount(hitunganBaru)
            }
          }}
          className="cursor-pointer flex items-center gap-1.5 select-none"
        >
          <div className="w-8 h-8 rounded-xl bg-[#d4f34a] flex items-center justify-center text-[#14141f] font-bold text-sm shrink-0">
            H
          </div>
          <span className="font-bold text-sm sm:text-lg tracking-tight text-white">
            Hookya
          </span>
        </div>

        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setShowProfilePopup(!showProfilePopup)}
            className="cursor-pointer flex items-center gap-1.5 bg-white/10 hover:bg-white/15 pl-1.5 pr-2 py-1.5 rounded-full text-xs transition border border-white/15"
          >
            <img
              src={getAvatarUrlUser()}
              alt={profil.nama}
              className="w-5 h-5 rounded-full object-cover shrink-0"
            />
            <span className="font-bold text-white truncate max-w-[54px] sm:max-w-[120px]">
              {profil.nama}
            </span>
            <span className="bg-[#d4f34a] text-[#14141f] font-bold px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 shrink-0">
              <FlatIcon name="coin" className="w-3 h-3" />
              <span>{formatKoinSingkat(coins)}</span>
            </span>
          </button>

          {showProfilePopup && (
            <div className="absolute right-0 top-12 mt-2 w-80 bg-white text-[#14141f] rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <label
                    className="cursor-pointer relative shrink-0"
                    title="Ubah dan sesuaikan foto profil 1:1"
                  >
                    <img
                      src={getAvatarUrlUser()}
                      alt={profil.nama}
                      className="w-11 h-11 rounded-full object-cover border-2 border-[#14141f]"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-[#d4f34a] text-[#14141f] text-[9px] font-bold px-1 rounded">
                      1:1
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePilihFileFotoProfil}
                      className="hidden"
                    />
                  </label>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm truncate">
                      {profil.nama}
                    </h4>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {namaPaketAktif} • Maks {kuotaAkunMaksimal} Akun
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold bg-[#f2fce2] text-[#4d6b14] px-2 py-0.5 rounded">
                        {coins.toLocaleString("id-ID")} Koin
                      </span>
                      <span className="text-[10px] font-bold bg-[#f4f5f7] text-slate-700 px-2 py-0.5 rounded">
                        Aktif: {sisaHariPaket} Hari
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfilePopup(false)}
                  className="cursor-pointer w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="bg-[#f4f5f7] rounded-xl p-3 border border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowDetailKoinPopup(!showDetailKoinPopup)}
                  className="cursor-pointer w-full flex items-center justify-between text-xs font-bold text-[#14141f]"
                >
                  <span className="flex items-center gap-1.5">
                    <FlatIcon name="coin" className="w-4 h-4 text-[#4d6b14]" />
                    <span>Rincian Penggunaan Koin</span>
                  </span>
                  <FlatIcon
                    name="chevronDown"
                    className={`w-4 h-4 transition ${
                      showDetailKoinPopup ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showDetailKoinPopup && (
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-700 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Buat 1 Skrip Konten Utuh:</span>
                      <strong>1 Koin</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Gandakan 2x / 5x / 10x Skrip:</span>
                      <strong>1 / 2 / 3 Koin</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Tulis Ulang Bagian (Tiap 3x):</span>
                      <strong>1 Koin</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Ekstrak Video ke Skrip (VIP):</span>
                      <strong>2 Koin</strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfilePopup(false)
                    setActiveMenu("dna")
                  }}
                  className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold py-2.5 rounded-lg"
                >
                  Edit Profil
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfilePopup(false)
                    setActiveMenu("topup")
                  }}
                  className="cursor-pointer bg-[#d4f34a] text-[#14141f] text-xs font-bold py-2.5 rounded-lg"
                >
                  + Isi Koin
                </button>
              </div>

              {isAdminAccount && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfilePopup(false)
                    setShowPinModal(true)
                  }}
                  className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5"
                >
                  <FlatIcon name="code" className="w-4 h-4" />
                  <span>Buka Dashboard Developer</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowProfilePopup(false)
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("hookya_active_user_id")
                  }
                  setViewMode("auth")
                }}
                className="cursor-pointer w-full bg-[#f4f5f7] text-[#14141f] text-xs font-bold py-2.5 rounded-lg"
              >
                Keluar / Ganti Akun
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row w-full max-w-full">
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60"
            />
            <aside className="relative w-72 max-w-[82vw] bg-[#14141f] text-white h-full p-5 flex flex-col justify-between z-10 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                  <span className="text-base font-bold text-[#d4f34a]">
                    Menu Hookya
                  </span>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="cursor-pointer w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"
                  >
                    <FlatIcon name="close" className="w-4 h-4" />
                  </button>
                </div>
                <nav className="space-y-1.5 text-xs">
                  {daftarMenuUser.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveMenu(item.id)
                        setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition cursor-pointer ${
                        activeMenu === item.id
                          ? "bg-[#d4f34a] text-[#14141f] font-bold"
                          : "text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FlatIcon name={item.icon} className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge > 0 && (
                        <span className="bg-[#f3a88f] text-[#14141f] text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {renderSidebarUserCard(false)}
            </aside>
          </div>
        )}

        <aside
          className={`hidden md:flex flex-col justify-between bg-[#14141f] text-white m-4 rounded-2xl p-4 shrink-0 transition-all duration-300 self-start sticky top-20 ${
            desktopMinimized ? "w-20 items-center" : "w-64"
          }`}
        >
          <nav className="space-y-1.5 text-xs w-full">
            {daftarMenuUser.map((item) => {
              const isActive = activeMenu === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center ${
                    desktopMinimized
                      ? "justify-center p-3.5"
                      : "justify-between px-4 py-3"
                  } rounded-xl transition cursor-pointer ${
                    isActive
                      ? "bg-[#d4f34a] text-[#14141f] font-bold"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FlatIcon name={item.icon} className="w-5 h-5 shrink-0" />
                    {!desktopMinimized && <span>{item.label}</span>}
                  </div>
                  {!desktopMinimized && item.badge > 0 && (
                    <span className="bg-[#f3a88f] text-[#14141f] text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {renderSidebarUserCard(desktopMinimized)}
        </aside>

        <main className="flex-1 min-w-0 w-full max-w-5xl p-3 sm:p-5 md:pl-0">
          {sisaHariPaket <= 5 && (
            <div className="mb-4 bg-amber-100 border border-amber-300 text-[#14141f] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <strong className="font-bold">
                  {sisaHariPaket === 0
                    ? "Masa Aktif Paket Koinmu Telah Berakhir"
                    : `Masa Aktif Koinmu Tersisa ${sisaHariPaket} Hari Lagi`}
                </strong>
                <p className="text-slate-700 mt-0.5">
                  Perpanjang paket sebelum masa aktif habis agar sisa{" "}
                  <strong>{coins} Koin</strong> kamu tidak hangus dan masa
                  aktifnya langsung ditambah +30 hari.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveMenu("topup")}
                className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold px-4 py-2.5 rounded-lg shrink-0"
              >
                Perpanjang Paket Koin
              </button>
            </div>
          )}

          {activeMenu === "dna" && (
            <PersonaDNAView
              userId={userId}
              isPremiumUser={statusVIPFinal}
              kuotaAkunMaksimal={kuotaAkunMaksimal}
              namaPaketAktif={namaPaketAktif}
              onTriggerUpgradeVIP={() => setShowUpgradeVIPModal(true)}
              profil={profil}
              setProfil={setProfil}
              jadwalFleksibel={jadwalFleksibel}
              setJadwalFleksibel={setJadwalFleksibel}
              jadwalCeklis={jadwalCeklis}
              setJadwalCeklis={setJadwalCeklis}
              rawWritingSamples={rawWritingSamples}
              setRawWritingSamples={setRawWritingSamples}
              personaProfile={personaProfile}
              setPersonaProfile={setPersonaProfile}
              bentukKonten={bentukKonten}
              setBentukKonten={setBentukKonten}
              deskripsiBentukSendiri={deskripsiBentukSendiri}
              setDeskripsiBentukSendiri={setDeskripsiBentukSendiri}
              SEPULUH_BENTUK_KONTEN={SEPULUH_BENTUK_KONTEN}
              setModeTampilanSkrip={setModeTampilanSkrip}
              simpanPersonaKeSupabase={simpanPersonaKeSupabase}
              setActiveMenu={setActiveMenu}
              showToast={showToast}
              customPrompts={customPrompts}
            />
          )}

          {activeMenu === "produksi" && (
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
              bentukKontenFinal={bentukKontenFinal}
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
              setModeTampilanSkrip={setModeTampilanSkrip}
            />
          )}

          {activeMenu === "rewrite" && (
            <VideoExtractorView
              userId={userId}
              namaUser={profil.nama}
              isPremiumUser={statusVIPFinal}
              onTriggerUpgradeVIP={() => setShowUpgradeVIPModal(true)}
              coins={coins}
              updateKoinDatabase={updateKoinDatabase}
              personaProfile={personaProfile}
              bentukKontenFinal={bentukKontenFinal}
              simpanAtauUpdateSkripDatabase={simpanAtauUpdateSkripDatabase}
              setKoleksiSkripTersimpan={setKoleksiSkripTersimpan}
              setActiveMenu={setActiveMenu}
              showToast={showToast}
            />
          )}

          {/* MENU ARSIP SKRIP TERSIMPAN (RINGKAS, PENCARIAN KEYWORD, DROPDOWN GANDAKAN, & FOLDER VARIASI) */}
          {activeMenu === "tersimpan" && (
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                    Arsip Skrip Tersimpan
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Cari skripmu berdasarkan kata kunci, buka folder variasi,
                    atau plot jadwal konten ke kalender.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveMenu("kalender")}
                    className="cursor-pointer bg-[#f4f5f7] hover:bg-slate-200 text-[#14141f] text-xs font-bold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 border border-slate-200"
                  >
                    <FlatIcon name="calendar" className="w-4 h-4" />
                    <span>Kalender Arsip Konten</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStage(0)
                      setActiveMenu("produksi")
                    }}
                    className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2.5 rounded-lg"
                  >
                    + Buat Skrip Baru
                  </button>
                </div>
              </div>

              {/* KOLOM PENCARIAN KEYWORD */}
              <div className="relative">
                <input
                  type="text"
                  value={keywordCariArsip}
                  onChange={(e) => setKeywordCariArsip(e.target.value)}
                  placeholder="Ketik kata kunci judul atau isi materi untuk mencari skrip..."
                  className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-4 py-2.5 pr-16 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
                />
                {keywordCariArsip && (
                  <button
                    type="button"
                    onClick={() => setKeywordCariArsip("")}
                    className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {arsipTerfilterKeyword.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Tidak ada skrip yang ditemukan.
                </p>
              ) : (
                <div className="space-y-3">
                  {arsipTerfilterKeyword.map((item) => {
                    const sedangGandakanIni = multiplyingArchiveId === item.id
                    const listFolder = Array.isArray(item.variasiFolder)
                      ? item.variasiFolder
                      : []
                    const folderTerbuka = Boolean(folderTerbukaMap[item.id])

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-[#f4f5f7] border border-slate-200 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span>{item.waktuDibuat}</span>
                              {item.tanggalUpload && (
                                <span className="bg-[#f2fce2] text-[#4d6b14] font-bold px-2 py-0.5 rounded-md border border-[#4d6b14]/20">
                                  Terjadwal: {item.tanggalUpload}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-[#14141f] mt-0.5 break-words">
                              {item.judul}
                            </h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {listFolder.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setFolderTerbukaMap((prev) => ({
                                    ...prev,
                                    [item.id]: !prev[item.id],
                                  }))
                                }
                                className="cursor-pointer bg-white hover:bg-[#14141f] text-[#14141f] hover:text-[#d4f34a] border border-slate-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
                              >
                                <FlatIcon
                                  name="folder"
                                  className="w-3.5 h-3.5"
                                />
                                <span>
                                  Folder Variasi ({listFolder.length})
                                </span>
                                <FlatIcon
                                  name="chevronDown"
                                  className={`w-3.5 h-3.5 transition ${
                                    folderTerbuka ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setHasilSkrip(item)
                                setStage(5)
                                setActiveMenu("produksi")
                              }}
                              className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3.5 py-2 rounded-lg"
                            >
                              Buka Skrip
                            </button>
                          </div>
                        </div>

                        {/* ISI FOLDER VARIASI (MUNCUL SAAT DIKLIK) */}
                        {folderTerbuka && listFolder.length > 0 && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                            <div className="text-[11px] font-bold text-slate-600">
                              Isi Folder Variasi dari Topik Ini:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {listFolder.map((vf, vIdx) => (
                                <div
                                  key={vf.id || vIdx}
                                  className="p-2.5 rounded-lg bg-[#f4f5f7] border border-slate-200 flex items-center justify-between gap-2 text-xs"
                                >
                                  <span className="font-bold truncate">
                                    {vf.judul || `Variasi ${vIdx + 1}`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setHasilSkrip({
                                        ...item,
                                        judul: `${item.judul} (${vf.judul || `Variasi ${vIdx + 1}`})`,
                                        sections: vf.sections || vf.segmen,
                                        segmen: vf.segmen || vf.sections,
                                      })
                                      setStage(5)
                                      setActiveMenu("produksi")
                                    }}
                                    className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0"
                                  >
                                    Buka
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* BAR RINGKAS: DROPDOWN GANDAKAN MATERI & STATUS UPLOAD */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={pilihanGandakanArsip[item.id] || "2"}
                              disabled={sedangGandakanIni}
                              onChange={(e) =>
                                setPilihanGandakanArsip({
                                  ...pilihanGandakanArsip,
                                  [item.id]: e.target.value,
                                })
                              }
                              className="bg-[#f4f5f7] border border-slate-200 rounded-md px-2.5 py-1.5 text-base sm:text-xs font-bold outline-none"
                            >
                              <option value="2">
                                Gandakan 2 Variasi (1 Koin)
                              </option>
                              <option value="5">
                                Gandakan 5 Variasi (2 Koin)
                              </option>
                              <option value="10">
                                Gandakan 10 Variasi (3 Koin)
                              </option>
                            </select>

                            <button
                              type="button"
                              disabled={sedangGandakanIni}
                              onClick={() => handleGandakanDariArsip(item)}
                              className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {sedangGandakanIni && (
                                <FlatIcon
                                  name="refresh"
                                  className="w-3.5 h-3.5 animate-spin"
                                />
                              )}
                              <span>
                                {sedangGandakanIni
                                  ? "Memproses..."
                                  : "Buat ke Folder"}
                              </span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer flex items-center gap-1.5 font-bold text-slate-700">
                              <input
                                type="checkbox"
                                checked={Boolean(item.sudahUpload)}
                                onChange={(e) =>
                                  handleToggleSudahUpload(
                                    item,
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 accent-[#14141f]"
                              />
                              <span>Jadwalkan / Upload</span>
                            </label>
                            {item.sudahUpload && (
                              <input
                                type="date"
                                value={item.tanggalUpload || ""}
                                onChange={(e) => {
                                  const updated = {
                                    ...item,
                                    tanggalUpload: e.target.value,
                                  }
                                  setKoleksiSkripTersimpan((prev) =>
                                    prev.map((s) =>
                                      s.id === item.id ? updated : s,
                                    ),
                                  )
                                  simpanAtauUpdateSkripDatabase(updated)
                                }}
                                className="bg-[#f4f5f7] border border-slate-200 rounded-md px-2 py-1 text-base sm:text-xs font-bold"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* MENU KALENDER ARSIP KONTEN (KALENDER MINI INTERAKTIF) */}
          {activeMenu === "kalender" && (
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                    Kalender Arsip Konten
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Klik tanggal pada kalender untuk melihat daftar skrip konten
                    pada tanggal tersebut atau menambahkan skrip dari arsip.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMenu("tersimpan")}
                  className="cursor-pointer bg-[#f4f5f7] text-[#14141f] text-xs font-bold px-3.5 py-2 rounded-lg border border-slate-200"
                >
                  Ke Daftar Arsip
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* KOLOM KIRI: KALENDER MINI */}
                <div className="lg:col-span-6 bg-[#f4f5f7] p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
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
                      className="cursor-pointer w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                    >
                      <FlatIcon name="chevronLeft" className="w-4 h-4" />
                    </button>

                    <div className="text-xs sm:text-sm font-bold text-[#14141f]">
                      {NAMA_BULAN_ID[kalenderBulan]} {kalenderTahun}
                    </div>

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
                      className="cursor-pointer w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                    >
                      <FlatIcon name="chevronRight" className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500 pb-1">
                    {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                      (h) => (
                        <div key={h}>{h}</div>
                      ),
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {gridHariKalender.map((cell, idx) => {
                      if (!cell) {
                        return <div key={`empty_${idx}`} className="h-11" />
                      }
                      const sedangDipilih = tanggalKalenderTerpilih === cell.iso
                      const skripHariIni = koleksiSkripTersimpan.filter(
                        (s) => s.tanggalUpload === cell.iso,
                      )

                      return (
                        <button
                          key={cell.iso}
                          type="button"
                          onClick={() => setTanggalKalenderTerpilih(cell.iso)}
                          className={`cursor-pointer h-11 rounded-lg border text-xs font-bold flex flex-col items-center justify-center transition ${
                            sedangDipilih
                              ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                              : skripHariIni.length > 0
                                ? "bg-[#f2fce2] text-[#14141f] border-[#4d6b14]/30"
                                : "bg-white text-[#14141f] border-slate-200 hover:border-[#14141f]"
                          }`}
                        >
                          <span>{cell.hari}</span>
                          {skripHariIni.length > 0 && (
                            <span
                              className={`text-[9px] px-1.5 rounded-sm ${
                                sedangDipilih
                                  ? "bg-[#d4f34a] text-[#14141f]"
                                  : "bg-[#14141f] text-[#d4f34a]"
                              }`}
                            >
                              {skripHariIni.length}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* KOLOM KANAN: DETAIL TANGGAL & PLOT SKRIP DARI ARSIP */}
                <div className="lg:col-span-6 bg-[#f4f5f7] p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#14141f]">
                      Jadwal Konten Tanggal: {tanggalKalenderTerpilih}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {daftarSkripPadaTanggalTerpilih.length > 0
                        ? `Terdapat ${daftarSkripPadaTanggalTerpilih.length} skrip konten pada tanggal ini.`
                        : "Belum ada skrip konten yang diplot pada tanggal ini."}
                    </p>
                  </div>

                  {/* DAFTAR SKRIP YANG ADA PADA TANGGAL TERSEBUT */}
                  {daftarSkripPadaTanggalTerpilih.length > 0 && (
                    <div className="space-y-2">
                      {daftarSkripPadaTanggalTerpilih.map((sk) => (
                        <div
                          key={sk.id}
                          className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[#14141f] truncate">
                              {sk.judul}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {sk.bentuk}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setHasilSkrip(sk)
                                setStage(5)
                                setActiveMenu("produksi")
                              }}
                              className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold px-3 py-1.5 rounded-md"
                            >
                              Buka
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleHapusSkripDariTanggalKalender(sk)
                              }
                              className="cursor-pointer bg-[#f4f5f7] hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold px-2.5 py-1.5 rounded-md border border-slate-200"
                            >
                              Lepas
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAMBAHKAN SKRIP KONTEN DARI ARSIP KE TANGGAL INI */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                    <label className="block text-xs font-bold text-[#14141f]">
                      Tambahkan Skrip Konten dari Arsip ke Tanggal Ini
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={idSkripPlotTerpilih}
                        onChange={(e) => setIdSkripPlotTerpilih(e.target.value)}
                        className="flex-1 bg-[#f4f5f7] border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs font-bold outline-none"
                      >
                        <option value="">
                          -- Pilih Skrip dari Arsip (
                          {koleksiSkripTersimpan.length} Tersedia) --
                        </option>
                        {koleksiSkripTersimpan.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.judul}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!idSkripPlotTerpilih}
                        onClick={() =>
                          handlePlotSkripKeTanggalKalender(
                            idSkripPlotTerpilih,
                            tanggalKalenderTerpilih,
                          )
                        }
                        className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2 rounded-lg shrink-0 disabled:opacity-50"
                      >
                        + Tambahkan ke Tanggal Ini
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === "rapor" && (
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 space-y-5">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                  Laporan Kinerja VT Sepekan Setelah Upload
                </h2>
              </div>

              {koleksiSkripTersimpan.filter((s) => s.sudahUpload).length ===
              0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Belum ada skrip yang dijadwalkan atau diupload.
                </p>
              ) : (
                koleksiSkripTersimpan
                  .filter((s) => s.sudahUpload)
                  .map((item) => {
                    const inputSaatIni = formKinerja[item.id] || {
                      views: item.views ?? "",
                      likes: item.likes ?? "",
                      komen: item.komen ?? "",
                    }

                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-xl bg-[#f4f5f7] border border-slate-200 space-y-3"
                      >
                        <h4 className="font-bold text-sm">{item.judul}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <input
                            type="number"
                            value={inputSaatIni.views}
                            onChange={(e) =>
                              setFormKinerja({
                                ...formKinerja,
                                [item.id]: {
                                  ...inputSaatIni,
                                  views: e.target.value,
                                },
                              })
                            }
                            placeholder="Jumlah Views..."
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs"
                          />
                          <input
                            type="number"
                            value={inputSaatIni.likes}
                            onChange={(e) =>
                              setFormKinerja({
                                ...formKinerja,
                                [item.id]: {
                                  ...inputSaatIni,
                                  likes: e.target.value,
                                },
                              })
                            }
                            placeholder="Jumlah Like..."
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs"
                          />
                          <input
                            type="number"
                            value={inputSaatIni.komen}
                            onChange={(e) =>
                              setFormKinerja({
                                ...formKinerja,
                                [item.id]: {
                                  ...inputSaatIni,
                                  komen: e.target.value,
                                },
                              })
                            }
                            placeholder="Jumlah Komentar..."
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-xs"
                          />
                          <button
                            type="button"
                            disabled={isGenerating}
                            onClick={() => handleKirimLaporanKinerjaVT(item)}
                            className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold text-xs py-2.5 rounded-lg"
                          >
                            Laporkan Kinerja
                          </button>
                        </div>
                        {item.evaluasiAI && (
                          <p className="text-xs bg-white p-3 rounded-lg border border-slate-200">
                            <strong>Catatan Evaluasi:</strong> {item.evaluasiAI}
                          </p>
                        )}
                      </div>
                    )
                  })
              )}
            </div>
          )}

          {/* LAMAN PEMBELIAN PAKET KOIN: CUKUP TAMPILKAN PILIHAN PAKET & KOLOM KODE VOUCHER */}
          {activeMenu === "topup" && (
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#14141f]">
                    Pilih Paket Koin
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Paket aktif: <strong>{namaPaketAktif}</strong> (Kuota{" "}
                    <strong>{kuotaAkunMaksimal} Profil Akun Sosmed</strong> •
                    Masa aktif <strong>{sisaHariPaket} Hari</strong>).
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-[#f4f5f7] p-1.5 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    value={inputKodeVoucherUser}
                    onChange={(e) => setInputKodeVoucherUser(e.target.value)}
                    placeholder="Masukkan Kode Voucher..."
                    className="bg-white rounded-lg px-3 py-2 text-base sm:text-xs font-bold uppercase outline-none w-44 border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleKlaimVoucherUser}
                    className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3.5 py-2 rounded-lg"
                  >
                    Klaim Voucher
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {daftarPaketKoin.map((p) => (
                  <div
                    key={p.nama}
                    className={`p-5 rounded-xl border flex flex-col justify-between ${
                      p.populer
                        ? "bg-[#14141f] text-white border-[#14141f]"
                        : "bg-[#f4f5f7] text-[#14141f] border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-sm">{p.nama}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            p.populer
                              ? "bg-[#d4f34a] text-[#14141f]"
                              : "bg-white text-[#14141f] border border-slate-200"
                          }`}
                        >
                          Maks {p.kuotaAkun} Akun
                        </span>
                      </div>
                      <div className="text-2xl font-bold mt-1">{p.harga}</div>
                      <span className="text-xs font-bold bg-[#d4f34a] text-[#14141f] px-2.5 py-0.5 rounded-md mt-2 inline-block">
                        +{p.koin} Koin (+30 Hari)
                      </span>
                      <p
                        className={`text-xs mt-2.5 leading-relaxed ${
                          p.populer ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {p.ket}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => bukaLayarCheckoutPaket(p)}
                      className="cursor-pointer mt-5 w-full bg-[#d4f34a] text-[#14141f] font-bold text-xs py-3 rounded-lg"
                    >
                      Pilih Paket ({p.harga})
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMenu === "usulan" && (
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                  Usulan Pengembangan & Laporan Kendala Aplikasi
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Kirimkan masukan atau kendala yang kamu alami langsung ke
                  Developer Hookya.
                </p>
              </div>

              <form onSubmit={handleKirimUsulanUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    "Usulan Fitur Baru",
                    "Laporan Bug / Kendala",
                    "Kritik & Saran Tampilan",
                  ].map((kat) => (
                    <button
                      key={kat}
                      type="button"
                      onClick={() =>
                        setFormUsulan({ ...formUsulan, kategori: kat })
                      }
                      className={`cursor-pointer py-2.5 px-3 rounded-lg text-xs font-bold border transition ${
                        formUsulan.kategori === kat
                          ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                          : "bg-[#f4f5f7] text-slate-600 border-slate-200"
                      }`}
                    >
                      {kat}
                    </button>
                  ))}
                </div>

                <StoryVoiceInput
                  rows={4}
                  value={formUsulan.pesan}
                  onChange={(val) =>
                    setFormUsulan({ ...formUsulan, pesan: val })
                  }
                  placeholder="Ketik usulan pengembangan atau kendala yang kamu alami..."
                  onNotify={showToast}
                />

                <button
                  type="submit"
                  disabled={isSendingUsulan}
                  className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs sm:text-sm py-3.5 rounded-lg"
                >
                  {isSendingUsulan
                    ? "Mengirim ke Developer..."
                    : "Kirim Usulan ke Developer"}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* MODAL PEMBAYARAN QRIS MANUAL */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-[#14141f] w-full max-w-md rounded-2xl p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold bg-[#f2fce2] text-[#4d6b14] px-2 py-0.5 rounded-md">
                  Tagihan #{checkoutModal.invoiceId}
                </span>
                <h3 className="text-base font-bold mt-0.5">
                  {checkoutModal.namaPaket} (+{checkoutModal.koin} Koin • +30
                  Hari)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutModal(null)}
                className="cursor-pointer w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#f4f5f7] p-4 rounded-xl text-center space-y-2 border border-slate-200">
              <div className="text-xs font-bold text-slate-600">
                1. Scan QRIS Statis & Bayar Sesuai Nominal Berikut:
              </div>
              {pengaturanPayment.qrisImageUrl ? (
                <img
                  src={pengaturanPayment.qrisImageUrl}
                  alt="QRIS Merchant"
                  className="w-52 h-52 mx-auto rounded-lg object-contain bg-white p-2 border border-slate-200"
                />
              ) : (
                <FlatIcon
                  name="qr"
                  className="w-28 h-28 mx-auto text-[#14141f]"
                />
              )}
              <div className="text-2xl font-bold text-[#14141f]">
                Rp{checkoutModal.nominalBayar.toLocaleString("id-ID")}
              </div>
              <p className="text-[11px] text-slate-500">
                {pengaturanPayment.infoRekening}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#14141f]">
                2. Upload Foto / Screenshot Bukti Pembayaran:
              </label>
              <label className="cursor-pointer border border-dashed border-slate-300 hover:border-[#14141f] bg-[#f4f5f7] rounded-xl p-3.5 flex items-center gap-3 transition">
                {buktiBayarBase64 ? (
                  <img
                    src={buktiBayarBase64}
                    alt="Bukti Bayar"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-300 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#14141f] text-[#d4f34a] flex items-center justify-center shrink-0">
                    <FlatIcon name="upload" className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <div className="text-xs font-bold text-[#14141f] truncate">
                    {namaFileBukti || "Klik untuk Pilih Foto Bukti Transfer"}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Bukti pembayaran akan diperiksa Admin
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadBuktiBayarUser}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCheckoutModal(null)}
                className="cursor-pointer w-1/3 bg-[#f4f5f7] font-bold text-xs py-3 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangProsesBayar}
                onClick={handleKonfirmasiBayarDanKirimWA}
                className="cursor-pointer flex-1 bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3 rounded-lg"
              >
                {sedangProsesBayar
                  ? "Mengirim Bukti..."
                  : "Konfirmasi & Kirim ke WA Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PIN DEVELOPER */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#14141f] w-full max-w-sm rounded-2xl p-6 space-y-4 text-center">
            <h3 className="text-base font-bold">Masuk ke Mode Developer</h3>
            <input
              type="password"
              value={inputPinDev}
              onChange={(e) => setInputPinDev(e.target.value)}
              placeholder="PIN Admin..."
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-4 py-3 text-center text-base sm:text-sm font-bold outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="cursor-pointer w-1/3 bg-[#f4f5f7] font-bold text-xs py-3 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (inputPinDev === pinAdminResmi) {
                    setShowPinModal(false)
                    setInputPinDev("")
                    setViewMode("dev")
                  } else {
                    alert("PIN Admin salah.")
                  }
                }}
                className="cursor-pointer flex-1 bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3 rounded-lg"
              >
                Buka Dashboard Dev
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMPILKAN TEKS (TELEPROMPTER) */}
      {modeTeleprompter && hasilSkrip && (
        <div className="fixed inset-0 bg-[#14141f]/95 z-50 flex flex-col justify-between p-6 text-white">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <span className="text-sm font-bold text-[#d4f34a]">
              Tampilan Teks: {hasilSkrip.judul}
            </span>
            <button
              onClick={() => setModeTeleprompter(false)}
              className="cursor-pointer bg-white/10 px-4 py-2 rounded-lg text-xs font-bold"
            >
              Tutup
            </button>
          </div>
          <div className="max-w-2xl mx-auto my-auto space-y-6 text-center overflow-y-auto py-6">
            {hasilSkrip.segmen.map((s, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="text-xs text-[#d4f34a] font-bold">
                  {s.labelMini || `Bagian ${idx + 1}`} [
                  {s.visual || s.visualCue}]
                </div>
                <p className="text-xl sm:text-2xl font-bold leading-snug whitespace-pre-line">
                  {modeTampilanSkrip === "teks"
                    ? s.teksLayar || s.onScreenText
                    : s.voiceover || s.spokenText}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
