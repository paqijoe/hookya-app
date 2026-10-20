"use client"
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { FlatIcon } from "../components/SharedUI"
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
    ket: "Cukup rekam suasana/aktivitas, cerita disampaikan 100% lewat teks di layar.",
  },
  {
    id: 2,
    nama: "POV Tangan / Meja + Suara AI TikTok (Tanpa Wajah)",
    modeDefault: "voiceover",
    ket: "Kamera menyorot tangan di meja, naskah dibacakan suara otomatis/voiceover.",
  },
  {
    id: 3,
    nama: "B-Roll Aktivitas + Voiceover Santai (Rekam Suara Belakangan)",
    modeDefault: "voiceover",
    ket: "Rekam kegiatan harianmu dulu, lalu baca naskah santai dari balik layar.",
  },
  {
    id: 4,
    nama: "Talking Head + Teleprompter (Ngobrol Langsung ke Kamera)",
    modeDefault: "voiceover",
    ket: "Tampil wajah percaya diri membaca layar teleprompter Hookya.",
  },
  {
    id: 5,
    nama: "ASMR / Suara Asli Aktivitas + Teks Pendek (Tanpa Bicara)",
    modeDefault: "teks",
    ket: "Tonjolkan suara asli (ketikan, masakan, buka paket) dengan teks singkat.",
  },
  {
    id: 6,
    nama: "Green Screen Reaksi / Komentar Tren & Fakta Unik",
    modeDefault: "voiceover",
    ket: "Tampilkan tangkapan layar artikel/tren di belakangmu lalu berikan opini.",
  },
  {
    id: 7,
    nama: "Vlog Mini Keseharian (A Day in My Life 20 Detik)",
    modeDefault: "voiceover",
    ket: "Gabungan 5-6 klip pendek kegiatanmu dari pagi/malam dengan cerita mengalir.",
  },
  {
    id: 8,
    nama: "Tutorial Layar HP / Laptop (Screen Recording)",
    modeDefault: "voiceover",
    ket: "Rekam layar HP/Laptop saat membagikan tips aplikasi, desain, atau website.",
  },
  {
    id: 9,
    nama: "Sketsa POV Situasi Relatable + Musik Trending",
    modeDefault: "teks",
    ket: "Peragakan ekspresi singkat (1 orang) dengan teks situasi yang sering dialami orang.",
  },
  {
    id: 10,
    nama: "Slide Foto / Carousel Cerita Bergambar (Geser Foto)",
    modeDefault: "teks",
    ket: "Tidak perlu rekam video! Cukup susun 6 foto berurutan dengan teks cerita.",
  },
]

const DEFAULT_PERSONA_PROFILE = {
  user_id: "usr_99281",
  persona_summary:
    "Gaya bicara jujur, santai, namun peduli seperti kakak senior atau teman dekat yang sedang berbagi pengalaman nyata.",
  archetype: {
    primary: "Teman Diskusi Jujur",
    secondary: "Praktisi Berpengalaman",
    authority_stance: "Berbicara dari pengalaman nyata sehari-hari.",
  },
  linguistic_matrix: {
    self_pronoun: "Gue",
    audience_pronoun: "Lo / Kalian",
    greeting_signature: ["Gini bro,", "Jujur ya,", "Coba pikir deh,"],
    favorite_transitions: [
      "Masalahnya gini,",
      "Nah, lucunya adalah...",
      "Intinya simpel:",
    ],
    signature_vocabulary: ["boncos", "valid", "mindset", "eksekusi"],
    forbidden_words: [
      "Anda",
      "Pemirsa",
      "Oleh karena itu",
      "Selain itu",
      "Di era digital saat ini",
      "Kesimpulannya",
    ],
  },
}

export default function HookyaMainApp() {
  const [viewMode, setViewMode] = useState("auth") // 'auth' | 'user' | 'dev'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopMinimized, setDesktopMinimized] = useState(false)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [activeMenu, setActiveMenu] = useState("produksi")

  // Keamanan PIN Admin Dinamis & Pemicu Rahasia (Klik Logo 5x atau Akun Admin)
  const [showPinModal, setShowPinModal] = useState(false)
  const [inputPinDev, setInputPinDev] = useState("")
  const [pinAdminResmi, setPinAdminResmi] = useState("123456")
  const [logoClickCount, setLogoClickCount] = useState(0)

  const [userId, setUserId] = useState(null)
  const [userRole, setUserRole] = useState("user")
  const [coins, setCoins] = useState(120)
  const [paket, setPaket] = useState("Paket Pemula")
  const [toastMsg, setToastMsg] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 3500)
  }

  const [profil, setProfil] = useState({
    nama: "Kreator",
    usia: "28",
    gender: "Laki-laki",
    peranSaatIni: "Praktisi Bisnis & Kreator Digital",
    kepribadianSosial:
      "Santai, jujur, dan peduli seperti kakak senior di warung kopi",
    minatUtama: "Bisnis, Keuangan Praktis, Teknologi & Olahraga",
    lingkunganRekam: "Kamar / Meja Kerja di Dalam Ruangan",
    waktuFree: "Malam (20:00 - 21:30)",
    selfPronounInput: "Gue",
    audiencePronounInput: "Lo / Kalian",
    prinsipUtamaInput: "Praktik lebih penting dari teori",
    opiniKontraInput: "Kurang suka motivasi kosong tanpa langkah nyata",
  })

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
        waktuFree: "Saya Fleksibel (Bisa Kapan Saja)",
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

  const [rawWritingSamples, setRawWritingSamples] = useState(
    "Gini bro, jujur ya banyak banget yang boncos gara-gara cuma modal semangat doang tapi eksekusinya ngaco. Intinya simpel: benerin dulu fondasinya baru jalan.",
  )
  const [personaProfile, setPersonaProfile] = useState(DEFAULT_PERSONA_PROFILE)
  const [bentukKonten, setBentukKonten] = useState(
    SEPULUH_BENTUK_KONTEN[3].nama,
  )
  const [deskripsiBentukSendiri, setDeskripsiBentukSendiri] = useState("")
  const bentukKontenFinal = deskripsiBentukSendiri.trim()
    ? `${bentukKonten} — Catatan: ${deskripsiBentukSendiri.trim()}`
    : bentukKonten

  const [daftar10IdeTopik, setDaftar10IdeTopik] = useState([
    {
      judul: "Menabung di Akhir Bulan Adalah Jebakan Psikologis",
      nuansa: "Membongkar Mitos",
      ringkasan: "Kenapa menunggu uang sisa di akhir bulan selalu gagal.",
    },
    {
      judul: "Kesalahan Memulai Usaha Tanpa Menghitung Arus Kas",
      nuansa: "Kesalahan Umum",
      ringkasan: "Cerita nyata kenapa omzet ramai tapi tabungan kosong.",
    },
    {
      judul: "Berhenti Menunggu Mood, Bangun Rutinitas 15 Menit",
      nuansa: "Tips Praktis",
      ringkasan: "Langkah kecil yang konsisten mengalahkan niat besar.",
    },
    {
      judul: "Kenapa Terlalu Banyak Nonton Tutorial Bikin Gagal Mulai",
      nuansa: "Membongkar Mitos",
      ringkasan: "Praktik langsung jauh lebih berharga daripada sekadar teori.",
    },
    {
      judul: "3 Kebiasaan Pagi yang Diam-diam Menguras Energi Harian",
      nuansa: "Kesalahan Umum",
      ringkasan: "Cara sederhana menjaga fokus sejak bangun tidur.",
    },
    {
      judul: "Cara Mengatur Gaji Bulanan Biar Nggak Habis di Minggu Pertama",
      nuansa: "Tips Praktis",
      ringkasan: "Strategi memisahkan rekening tabungan dan belanja harian.",
    },
    {
      judul: "Jebakan Beli Barang Murah Tapi Malah Rugi Dua Kali",
      nuansa: "Pengalaman Pribadi",
      ringkasan: "Memilih barang berkualitas yang awet dipakai bertahun-tahun.",
    },
    {
      judul: "Cara Tetap Konsisten Olahraga di Tengah Kesibukan Kerja",
      nuansa: "Tips Praktis",
      ringkasan: "Menjaga kebugaran tubuh tanpa harus ke tempat gym mahal.",
    },
    {
      judul: "Bedanya Sibuk Produktif vs Sibuk yang Bikin Jalan di Tempat",
      nuansa: "Membongkar Mitos",
      ringkasan: "Fokus mengerjakan 1 prioritas utama setiap hari.",
    },
    {
      judul: "Satu Prinsip Sederhana yang Mengubah Cara Mengambil Keputusan",
      nuansa: "Cerita Keseharian",
      ringkasan:
        "Belajar dari kesalahan masa lalu untuk hasil yang lebih baik.",
    },
  ])

  const [stage, setStage] = useState(0)
  const [hasilSkrip, setHasilSkrip] = useState(null)
  const [modeTampilanSkrip, setModeTampilanSkrip] = useState("voiceover")
  const [modeTeleprompter, setModeTeleprompter] = useState(false)

  // Koleksi skrip khusus milik user yang sedang login vs seluruh skrip untuk statistik Developer
  const [koleksiSkripTersimpan, setKoleksiSkripTersimpan] = useState([])
  const [semuaSkripAdmin, setSemuaSkripAdmin] = useState([])
  const [formKinerja, setFormKinerja] = useState({})
  const [semuaUserDB, setSemuaUserDB] = useState([])
  const [daftarTransaksi, setDaftarTransaksi] = useState([])

  const [checkoutModal, setCheckoutModal] = useState(null)
  const [metodeBayarPilihan, setMetodeBayarPilihan] = useState(
    "QRIS Instan (Semua E-Wallet & M-Banking)",
  )
  const [sedangProsesBayar, setSedangProsesBayar] = useState(false)
  const [inputKodeVoucherUser, setInputKodeVoucherUser] = useState("")

  const [pengaturanPayment, setPengaturanPayment] = useState({
    modeVerifikasi: "otomatis",
    namaMerchant: "HOOKYA OFFICIAL",
    infoRekening: "BCA / SeaBank / GoPay / DANA a.n Admin Hookya",
    qrisImageUrl: "",
  })

  const [daftarVoucher, setDaftarVoucher] = useState([
    { kode: "HOOKYA100", koin: 100, kuota: 50, terpakai: 0 },
    { kode: "GRATIS50", koin: 50, kuota: 100, terpakai: 0 },
  ])

  const [customPrompts, setCustomPrompts] = useState({
    persona_engine: "Ekstrak sapaan dan kosakata khas pengguna dengan akurat.",
    assessment_copilot: "Berikan 3 pilihan sudut pandang yang tajam.",
    script_humanizer:
      "Tulis dengan bahasa lisan yang mengalir alami saat diucapkan.",
  })

  // ============================================================================
  // SINKRONISASI SUPABASE DENGAN ISOLASI SKRIP PER AKUN PENGGUNA
  // ============================================================================
  const muatUlangDataSupabase = async (idTarget) => {
    try {
      const { data: userRows } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true })

      let activeUser = null

      if (userRows) {
        setSemuaUserDB(userRows)
        const savedId =
          idTarget ||
          (typeof window !== "undefined"
            ? localStorage.getItem("hookya_active_user_id")
            : null)

        activeUser = userRows.find((u) => u.id === savedId)

        // Ambil pengaturan global (Voucher, Payment, PIN Admin) dari akun pertama/admin jika ada
        const adminRow = userRows.find((u) => u.role === "admin") || userRows[0]
        if (adminRow?.profil_dna) {
          if (Array.isArray(adminRow.profil_dna.daftarVoucher)) {
            setDaftarVoucher(adminRow.profil_dna.daftarVoucher)
          }
          if (adminRow.profil_dna.pengaturanPayment) {
            setPengaturanPayment(adminRow.profil_dna.pengaturanPayment)
          }
          if (adminRow.profil_dna.pinAdminResmi) {
            setPinAdminResmi(adminRow.profil_dna.pinAdminResmi)
          }
          if (adminRow.profil_dna.customPrompts) {
            setCustomPrompts(adminRow.profil_dna.customPrompts)
          }
        }

        if (activeUser) {
          setUserId(activeUser.id)
          setUserRole(
            activeUser.role ||
              (activeUser.id === userRows[0]?.id ? "admin" : "user"),
          )
          setCoins(activeUser.koin ?? 120)
          setProfil((prev) => ({
            ...prev,
            ...(activeUser.profil_dna || {}),
            nama: activeUser.nama || prev.nama,
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
          if (activeUser.profil_dna?.deskripsiBentukSendiri) {
            setDeskripsiBentukSendiri(
              activeUser.profil_dna.deskripsiBentukSendiri,
            )
          }
          if (activeUser.profil_dna?.jadwalCeklis) {
            setJadwalCeklis(activeUser.profil_dna.jadwalCeklis)
          }
          if (typeof activeUser.profil_dna?.jadwalFleksibel === "boolean") {
            setJadwalFleksibel(activeUser.profil_dna.jadwalFleksibel)
          }
          setViewMode("user")
        }
      }

      const { data: scriptRows } = await supabase
        .from("scripts")
        .select("*")
        .order("created_at", { ascending: false })

      if (scriptRows) {
        const formatBarisSkrip = (row) => ({
          id: row.id,
          dbId: row.id,
          userId: row.user_id,
          judul: row.judul,
          kategori: row.kategori,
          bentuk: row.bentuk_konten,
          waktuDibuat:
            row.segmen_skrip?.meta?.waktuDibuat ||
            new Date(row.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          segmen: Array.isArray(row.segmen_skrip)
            ? row.segmen_skrip
            : row.segmen_skrip?.segmen || [],
          sudahUpload: Boolean(row.segmen_skrip?.meta?.sudahUpload),
          tanggalUpload: row.segmen_skrip?.meta?.tanggalUpload || "",
          views: row.segmen_skrip?.meta?.views ?? null,
          likes: row.segmen_skrip?.meta?.likes ?? null,
          komen: row.segmen_skrip?.meta?.komen ?? null,
          sudahEvaluasi: Boolean(row.segmen_skrip?.meta?.sudahEvaluasi),
          evaluasiAI: row.segmen_skrip?.meta?.evaluasiAI || "",
        })

        const semuaTerformat = scriptRows.map(formatBarisSkrip)
        setSemuaSkripAdmin(semuaTerformat)

        // ISOLASI DATA: Pengguna hanya melihat skrip miliknya sendiri!
        const idAktifSekarang = activeUser?.id || idTarget
        if (idAktifSekarang) {
          setKoleksiSkripTersimpan(
            semuaTerformat.filter((s) => s.userId === idAktifSekarang),
          )
        } else {
          setKoleksiSkripTersimpan([])
        }
      }

      const { data: trxRows } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
      if (trxRows) setDaftarTransaksi(trxRows)
    } catch {
      // Fallback
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
        profil_dna: {
          ...profil,
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

  const simpanAtauUpdateSkripDatabase = async (skripObj) => {
    const payloadSegmen = {
      segmen: skripObj.segmen,
      meta: {
        waktuDibuat: skripObj.waktuDibuat,
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

  // Hitung Pengingat Evaluasi 7 Hari (Sepekan) Setelah Tanggal Upload
  const hitungStatusPengingatSepekan = (tglUploadStr, sudahEvaluasi) => {
    if (!tglUploadStr) return null
    const tglUpload = new Date(tglUploadStr)
    const tglTargetSepekan = new Date(
      tglUpload.getTime() + 7 * 24 * 60 * 60 * 1000,
    )
    const sekarang = new Date()
    const selisihHari = Math.ceil(
      (tglTargetSepekan.getTime() - sekarang.getTime()) / (1000 * 60 * 60 * 24),
    )
    const labelTarget = tglTargetSepekan.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

    if (sudahEvaluasi) {
      return {
        siapEvaluasi: false,
        teks: `Evaluasi kinerja sepekan telah selesai dilaporkan`,
        warna: "bg-[#f2fce2] text-[#4d6b14]",
      }
    }
    if (selisihHari <= 0) {
      return {
        siapEvaluasi: true,
        teks: `Pengingat Sepekan: Konten ini sudah melewati 7 hari sejak diupload (${labelTarget}). Yuk laporkan jumlah views, like, dan komentar!`,
        warna: "bg-[#fff0e6] text-[#d97736]",
      }
    }
    return {
      siapEvaluasi: false,
      teks: `Jadwal Evaluasi Sepekan: ${labelTarget} (${selisihHari} hari lagi sejak diupload)`,
      warna: "bg-[#f0eeff] text-[#5b4bc4]",
    }
  }

  // Handler Pembelian Paket Koin
  const bukaLayarCheckoutPaket = async (paketObj) => {
    const kodeUnik = Math.floor(101 + Math.random() * 890)
    const nomorInvoice = `INV-${Date.now().toString().slice(-6)}`

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_gateway_invoice",
          invoiceId: nomorInvoice,
          userId,
          namaUser: profil.nama,
          namaPaket: paketObj.nama,
          jumlahKoin: paketObj.koin,
          nominal: paketObj.nominalAngka,
        }),
      })
      const data = await res.json()
      if (data.mode === "midtrans" && data.redirectUrl) {
        window.open(data.redirectUrl, "_blank")
      }
    } catch {
      // Lanjut buka modal QRIS
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

  const handleKonfirmasiSudahBayar = async () => {
    if (!checkoutModal) return
    setSedangProsesBayar(true)
    const statusAwal =
      pengaturanPayment.modeVerifikasi === "otomatis" ? "lunas" : "pending"

    const trxBaru = {
      invoice_id: checkoutModal.invoiceId,
      user_id: userId,
      nama_user: profil.nama,
      nama_paket: checkoutModal.namaPaket,
      jumlah_koin: checkoutModal.koin,
      nominal_asli: checkoutModal.nominalAsli,
      nominal_bayar: checkoutModal.nominalBayar,
      metode_bayar: metodeBayarPilihan,
      status: statusAwal,
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
      if (statusAwal === "lunas") {
        await updateKoinDatabase(coins + checkoutModal.koin)
        setPaket(checkoutModal.namaPaket)
        showToast(
          `Pembayaran terverifikasi! +${checkoutModal.koin} Koin berhasil ditambahkan.`,
        )
      } else {
        showToast(
          "Konfirmasi pembayaran diterima dan sedang diverifikasi Admin.",
        )
      }
    } finally {
      setSedangProsesBayar(false)
      setCheckoutModal(null)
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
    const tambahan = parseInt(ditemukan.koin) || 50
    await updateKoinDatabase(coins + tambahan)
    setDaftarVoucher(
      daftarVoucher.map((v) =>
        v.kode.toUpperCase() === kodeBersih
          ? { ...v, terpakai: v.terpakai + 1 }
          : v,
      ),
    )
    setInputKodeVoucherUser("")
    showToast(`Voucher berhasil diklaim! +${tambahan} Koin ditambahkan.`)
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
    if (checked) {
      showToast(
        "Status upload dicatat! Sistem akan mengingatkan evaluasi kinerja sepekan setelah tanggal upload.",
      )
    }
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
    showToast("Laporan kinerja disimpan & bonus +2 Koin ditambahkan!")
  }

  // Cek apakah pengguna yang login adalah Admin/Developer
  const isAdminAccount =
    userRole === "admin" ||
    profil.nama?.toLowerCase().includes("faqih") ||
    profil.nama?.toLowerCase().includes("admin") ||
    profil.username?.toLowerCase() === "paqijoe"

  const jumlahMenungguLaporan = koleksiSkripTersimpan.filter(
    (s) => s.sudahUpload && !s.sudahEvaluasi,
  ).length

  // ============================================================================
  // 1. LAYAR LOGIN & PENDAFTARAN FULLSCREEN
  // ============================================================================
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

  // ============================================================================
  // 2. LAYAR DASHBOARD DEVELOPER TERPISAH
  // ============================================================================
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
          const u = semuaUserDB.find((x) => x.id === trx.user_id)
          await updateKoinDatabase(
            (u?.koin || 0) + (trx.jumlah_koin || 0),
            trx.user_id || userId,
          )
          setDaftarTransaksi(
            daftarTransaksi.map((t) =>
              t.id === trx.id ? { ...t, status: "lunas" } : t,
            ),
          )
          showToast("Transaksi disetujui & koin berhasil dikirim!")
        }}
        simpanPengaturanDevKeDB={() => {
          simpanPersonaKeSupabase(personaProfile)
          showToast("Seluruh pengaturan manajerial Developer disimpan!")
        }}
        muatUlangDataSupabase={muatUlangDataSupabase}
        showToast={showToast}
      />
    )
  }

  // ============================================================================
  // 3. LAYAR DASHBOARD PENGGUNA
  // ============================================================================
  const daftarMenuUser = [
    { id: "dna", label: "Profil & Gaya Bicara", icon: "dna" },
    { id: "produksi", label: "Buat Skrip Konten", icon: "bolt" },
    { id: "rewrite", label: "Ekstrak Video ke Skrip", icon: "scissors" },
    {
      id: "tersimpan",
      label: "Skrip & Status Upload",
      icon: "bookmark",
      badge: koleksiSkripTersimpan.length,
    },
    {
      id: "rapor",
      label: "Laporan Kinerja VT",
      icon: "chart",
      badge: jumlahMenungguLaporan,
    },
    { id: "topup", label: "Paket Koin & Voucher", icon: "coin" },
  ]

  const daftarPaketKoin = [
    {
      nama: "Paket Coba",
      harga: "Rp5.000",
      nominalAngka: 5000,
      koin: 50,
      ket: "Cocok untuk mencoba fitur dasar.",
    },
    {
      nama: "Paket Pemula",
      harga: "Rp10.000",
      nominalAngka: 10000,
      koin: 120,
      ket: "Untuk mulai rutin membuat konten mingguan.",
    },
    {
      nama: "Paket Rutin",
      harga: "Rp15.000",
      nominalAngka: 15000,
      koin: 200,
      ket: "Untuk kreator yang konsisten upload harian.",
    },
    {
      nama: "Paket Aktif",
      harga: "Rp20.000",
      nominalAngka: 20000,
      koin: 300,
      ket: "Termasuk bonus koin eksplorasi ide.",
    },
    {
      nama: "Paket Kreator (Terlaris)",
      harga: "Rp25.000",
      nominalAngka: 25000,
      koin: 400,
      ket: "Kuota melimpah untuk kreator aktif.",
      populer: true,
    },
    {
      nama: "Paket Sultan",
      harga: "Rp50.000",
      nominalAngka: 50000,
      koin: 1000,
      ket: "Untuk produksi konten masif.",
    },
    {
      nama: "Paket Produser VIP",
      harga: "Rp99.000",
      nominalAngka: 99000,
      koin: 3000,
      ket: "Akses maksimal tanpa batas.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#14141f] flex flex-col font-sans antialiased tracking-tight">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#14141f] text-[#d4f34a] px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 border border-[#d4f34a]/40 max-w-md">
          <FlatIcon name="check" className="w-4 h-4 shrink-0" />
          <span className="font-normal text-white">{toastMsg}</span>
        </div>
      )}

      {/* HEADER STICKY: KIRI = BURGER | TENGAH = LOGO HOOKYA | KANAN = PROFIL USER + KOIN */}
      <header className="sticky top-0 z-40 h-16 bg-[#14141f] text-white px-3 sm:px-6 flex items-center justify-between shadow-md border-b border-white/10 relative">
        <div className="flex items-center gap-2">
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

        {/* TENGAH: LOGO HOOKYA (Klik 5x berturut-turut juga membuka PIN Developer) */}
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
          className="cursor-pointer absolute left-1/2 -translate-x-1/2 flex items-center gap-2 select-none"
        >
          <div className="w-8 h-8 rounded-xl bg-[#d4f34a] flex items-center justify-center text-[#14141f] font-bold text-sm">
            H
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight text-white">
            Hookya
          </span>
        </div>

        {/* KANAN: PROFIL USER + KOIN */}
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowProfilePopup(!showProfilePopup)}
            className="cursor-pointer flex items-center gap-2 bg-white/10 hover:bg-white/15 pl-3 pr-2.5 py-1.5 rounded-full text-xs transition border border-white/15"
          >
            <span className="w-2 h-2 rounded-full bg-[#d4f34a]" />
            <span className="font-bold text-white truncate max-w-[90px] sm:max-w-[140px]">
              {profil.nama}
            </span>
            <span className="bg-[#d4f34a] text-[#14141f] font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1">
              <FlatIcon name="coin" className="w-3 h-3" />
              <span>{coins}</span>
            </span>
            <FlatIcon
              name="chevronDown"
              className="w-3.5 h-3.5 text-[#d4f34a]"
            />
          </button>

          {showProfilePopup && (
            <div className="absolute right-0 top-12 mt-2 w-80 bg-white text-[#14141f] rounded-3xl shadow-2xl border border-slate-200 p-5 z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-[11px] font-bold bg-[#f2fce2] text-[#4d6b14] px-2 py-0.5 rounded">
                    {paket} • {coins} Koin
                  </span>
                  <h4 className="font-bold text-sm mt-1">
                    {profil.nama} ({profil.peranSaatIni})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfilePopup(false)}
                  className="cursor-pointer w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div>
                  <strong className="text-[#14141f]">Sapaan:</strong>{" "}
                  {personaProfile?.linguistic_matrix?.self_pronoun} ➔{" "}
                  {personaProfile?.linguistic_matrix?.audience_pronoun}
                </div>
                <div>
                  <strong className="text-[#14141f]">Waktu Luang:</strong>{" "}
                  {profil.waktuFree}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfilePopup(false)
                    setActiveMenu("dna")
                  }}
                  className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold py-2.5 rounded-xl"
                >
                  Edit Profil
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfilePopup(false)
                    setActiveMenu("topup")
                  }}
                  className="cursor-pointer bg-[#d4f34a] text-[#14141f] text-xs font-bold py-2.5 rounded-xl"
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
                  className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
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
                className="cursor-pointer w-full bg-[#f4f5f7] text-[#14141f] text-xs font-bold py-2.5 rounded-xl"
              >
                Keluar / Ganti Akun (Logout)
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* DRAWER SIDEBAR HP */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60"
            />
            <aside className="relative w-72 max-w-[82vw] bg-[#14141f] text-white h-full p-5 flex flex-col justify-between z-10 shadow-2xl">
              <div>
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                  <span className="text-base font-bold text-[#d4f34a]">
                    Menu Hookya
                  </span>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="cursor-pointer w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"
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
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition cursor-pointer ${
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
                        <span className="bg-[#f3a88f] text-[#14141f] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {isAdminAccount && (
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false)
                    setShowPinModal(true)
                  }}
                  className="cursor-pointer w-full bg-white/10 text-[#d4f34a] text-xs font-bold py-3 rounded-xl"
                >
                  Buka Dashboard Developer
                </button>
              )}
            </aside>
          </div>
        )}

        {/* SIDEBAR DESKTOP */}
        <aside
          className={`hidden md:flex flex-col justify-between bg-[#14141f] text-white m-4 rounded-[2rem] p-4 shrink-0 shadow-xl transition-all duration-300 self-start sticky top-20 ${
            desktopMinimized ? "w-20 items-center" : "w-60"
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
                  } rounded-2xl transition cursor-pointer ${
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
                    <span className="bg-[#f3a88f] text-[#14141f] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {!desktopMinimized && isAdminAccount && (
            <button
              type="button"
              onClick={() => setShowPinModal(true)}
              className="cursor-pointer mt-6 w-full bg-white/10 hover:bg-white/15 text-[#d4f34a] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
            >
              <FlatIcon name="code" className="w-4 h-4" />
              <span>Dashboard Developer</span>
            </button>
          )}
        </aside>

        {/* AREA KONTEN UTAMA */}
        <main className="flex-1 p-3 sm:p-5 md:pl-0 max-w-5xl">
          {/* MENU 1: PROFIL & GAYA BICARA LENGKAP */}
          {activeMenu === "dna" && (
            <PersonaDNAView
              userId={userId}
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

          {/* MENU 2: BUAT SKRIP KONTEN */}
          {activeMenu === "produksi" && (
            <ScriptProducerView
              userId={userId}
              namaUser={profil.nama}
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

          {/* MENU 3: EKSTRAK VIDEO KE SKRIP */}
          {activeMenu === "rewrite" && (
            <VideoExtractorView
              userId={userId}
              namaUser={profil.nama}
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

          {/* MENU 4: SKRIP TERSIMPAN & STATUS UPLOAD */}
          {activeMenu === "tersimpan" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                    Daftar Skrip Tersimpan & Status Upload Konten
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Ceklis skrip yang sudah kamu rekam dan upload menjadi konten
                    VT, lalu isi tanggal uploadnya agar sistem menjadwalkan
                    pengingat evaluasi sepekan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStage(0)
                    setActiveMenu("produksi")
                  }}
                  className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2.5 rounded-xl"
                >
                  + Buat Skrip Baru
                </button>
              </div>

              {koleksiSkripTersimpan.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Belum ada skrip yang disimpan di akunmu.
                </p>
              ) : (
                koleksiSkripTersimpan.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-3xl bg-[#f4f5f7] border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs text-slate-500">
                          Dibuat pada: <strong>{item.waktuDibuat}</strong> •{" "}
                          {item.bentuk}
                        </span>
                        <h4 className="font-bold text-sm sm:text-base mt-0.5">
                          {item.judul}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setHasilSkrip(item)
                          setStage(5)
                          setActiveMenu("produksi")
                        }}
                        className="cursor-pointer bg-white border border-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl"
                      >
                        Buka & Edit Skrip
                      </button>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <label className="cursor-pointer flex items-center gap-2 text-xs font-bold">
                        <input
                          type="checkbox"
                          checked={Boolean(item.sudahUpload)}
                          onChange={(e) =>
                            handleToggleSudahUpload(item, e.target.checked)
                          }
                          className="w-4 h-4 accent-[#14141f]"
                        />
                        <span>Sudah Diupload Menjadi Konten VT</span>
                      </label>
                      {item.sudahUpload && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-600">
                            Tanggal Konten Diupload:
                          </span>
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
                            className="bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* MENU 5: LAPORAN KINERJA VT SEPEKAN SETELAH UPLOAD */}
          {activeMenu === "rapor" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                  Laporan Kinerja VT Sepekan Setelah Upload (+2 Koin)
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Pantau pengingat evaluasi 7 hari untuk setiap skrip yang sudah
                  kamu upload menjadi konten, lalu masukkan jumlah views, like,
                  dan komentar.
                </p>
              </div>

              {koleksiSkripTersimpan.filter((s) => s.sudahUpload).length ===
              0 ? (
                <div className="text-center py-10 space-y-3">
                  <p className="text-xs text-slate-500">
                    Belum ada skrip yang ditandai "Sudah Diupload". Silakan
                    ceklis skrip yang sudah kamu upload di menu Skrip & Status
                    Upload.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveMenu("tersimpan")}
                    className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2.5 rounded-xl"
                  >
                    Ke Menu Skrip & Status Upload
                  </button>
                </div>
              ) : (
                koleksiSkripTersimpan
                  .filter((s) => s.sudahUpload)
                  .map((item) => {
                    const infoPengingat = hitungStatusPengingatSepekan(
                      item.tanggalUpload,
                      item.sudahEvaluasi,
                    )
                    const inputSaatIni = formKinerja[item.id] || {
                      views: item.views ?? "",
                      likes: item.likes ?? "",
                      komen: item.komen ?? "",
                    }

                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-3xl bg-[#f4f5f7] border border-slate-200 space-y-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-xs text-slate-500">
                              Diupload pada:{" "}
                              <strong>{item.tanggalUpload || "-"}</strong>
                            </span>
                            <h4 className="font-bold text-sm sm:text-base">
                              {item.judul}
                            </h4>
                          </div>
                        </div>

                        {infoPengingat && (
                          <div
                            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold ${infoPengingat.warna}`}
                          >
                            {infoPengingat.teks}
                          </div>
                        )}

                        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Jumlah Views:
                              </label>
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
                                placeholder="Contoh: 3500"
                                className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Jumlah Like:
                              </label>
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
                                placeholder="Contoh: 210"
                                className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                Jumlah Komentar:
                              </label>
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
                                placeholder="Contoh: 35"
                                className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                type="button"
                                disabled={isGenerating}
                                onClick={() =>
                                  handleKirimLaporanKinerjaVT(item)
                                }
                                className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-2.5 rounded-xl"
                              >
                                {item.sudahEvaluasi
                                  ? "Perbarui Kinerja"
                                  : "Laporkan Kinerja"}
                              </button>
                            </div>
                          </div>

                          {item.evaluasiAI && (
                            <p className="text-xs bg-[#f4f5f7] p-3.5 rounded-xl leading-relaxed">
                              <strong className="block mb-0.5">
                                Evaluasi Kinerja Sepekan dari Sistem AI:
                              </strong>
                              {item.evaluasiAI}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          )}

          {/* MENU 6: PAKET KOIN & VOUCHER */}
          {activeMenu === "topup" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold">
                  Pilih Paket Koin & Klaim Voucher
                </h2>
                <div className="flex items-center gap-2 bg-[#f4f5f7] p-1.5 rounded-2xl border border-slate-200">
                  <input
                    type="text"
                    value={inputKodeVoucherUser}
                    onChange={(e) => setInputKodeVoucherUser(e.target.value)}
                    placeholder="Kode Voucher..."
                    className="bg-white rounded-xl px-3 py-2 text-xs font-bold uppercase outline-none w-36"
                  />
                  <button
                    type="button"
                    onClick={handleKlaimVoucherUser}
                    className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3.5 py-2 rounded-xl"
                  >
                    Klaim
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {daftarPaketKoin.map((p) => (
                  <div
                    key={p.nama}
                    className={`p-5 rounded-3xl flex flex-col justify-between ${
                      p.populer
                        ? "bg-[#14141f] text-white shadow-xl"
                        : "bg-[#f4f5f7] text-[#14141f] border border-slate-200"
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-sm">{p.nama}</h3>
                      <div className="text-2xl font-bold mt-1">{p.harga}</div>
                      <span className="text-xs font-bold bg-[#d4f34a] text-[#14141f] px-2.5 py-0.5 rounded mt-2 inline-block">
                        {p.koin} Koin
                      </span>
                      <p className="text-xs opacity-80 mt-2">{p.ket}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => bukaLayarCheckoutPaket(p)}
                      className="cursor-pointer mt-5 w-full bg-[#d4f34a] text-[#14141f] font-bold text-xs py-3 rounded-xl"
                    >
                      Beli Paket ({p.harga})
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL CHECKOUT QRIS / MIDTRANS */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#14141f] w-full max-w-md rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold">
              Tagihan {checkoutModal.invoiceId} — {checkoutModal.namaPaket}
            </h3>
            <div className="bg-[#f4f5f7] p-4 rounded-2xl text-center space-y-2">
              {pengaturanPayment.qrisImageUrl ? (
                <img
                  src={pengaturanPayment.qrisImageUrl}
                  alt="QRIS Merchant"
                  className="w-44 h-44 mx-auto rounded-xl object-contain bg-white p-2 border border-slate-200"
                />
              ) : (
                <FlatIcon
                  name="qr"
                  className="w-24 h-24 mx-auto text-[#14141f]"
                />
              )}
              <div className="text-xl font-bold">
                Rp{checkoutModal.nominalBayar.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-slate-500">
                {pengaturanPayment.infoRekening}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCheckoutModal(null)}
                className="cursor-pointer w-1/3 bg-[#f4f5f7] font-bold text-xs py-3 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangProsesBayar}
                onClick={handleKonfirmasiSudahBayar}
                className="cursor-pointer flex-1 bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3 rounded-xl"
              >
                Saya Sudah Bayar ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PIN UNTUK BERALIH KE DASHBOARD DEVELOPER TERPISAH */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#14141f] w-full max-w-sm rounded-3xl p-6 space-y-4 text-center">
            <h3 className="text-base font-bold">Masuk ke Mode Developer</h3>
            <p className="text-xs text-slate-500">
              Masukkan PIN Admin untuk beralih ke layar penuh Dashboard
              Manajerial Developer
            </p>
            <input
              type="password"
              value={inputPinDev}
              onChange={(e) => setInputPinDev(e.target.value)}
              placeholder="PIN Admin..."
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-4 py-3 text-center text-sm font-bold outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="cursor-pointer w-1/3 bg-[#f4f5f7] font-bold text-xs py-3 rounded-xl"
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
                className="cursor-pointer flex-1 bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3 rounded-xl"
              >
                Buka Dashboard Dev
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TELEPROMPTER */}
      {modeTeleprompter && hasilSkrip && (
        <div className="fixed inset-0 bg-[#14141f]/95 z-50 flex flex-col justify-between p-6 text-white">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <span className="text-sm font-bold text-[#d4f34a]">
              Layar Teleprompter — {hasilSkrip.judul}
            </span>
            <button
              onClick={() => setModeTeleprompter(false)}
              className="cursor-pointer bg-white/10 px-4 py-2 rounded-xl text-xs font-bold"
            >
              ✕ Tutup
            </button>
          </div>
          <div className="max-w-2xl mx-auto my-auto space-y-6 text-center overflow-y-auto py-6">
            {hasilSkrip.segmen.map((s, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="text-xs text-[#d4f34a] font-bold">
                  {s.labelMini} — [{s.visual}]
                </div>
                <p className="text-xl sm:text-2xl font-bold leading-snug whitespace-pre-line">
                  {modeTampilanSkrip === "teks" ? s.teksLayar : s.voiceover}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
