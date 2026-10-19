"use client"
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import {
  FlatIcon,
  StoryVoiceInput,
  SelectWithCustom,
} from "../components/SharedUI"
import AuthFullscreen from "../components/AuthFullscreen"
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
  // Mode Layar Utama: 'auth' (Login/Daftar Fullscreen) | 'user' (Dashboard Pengguna) | 'dev' (Dashboard Manajerial Developer Terpisah)
  const [viewMode, setViewMode] = useState("auth")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopMinimized, setDesktopMinimized] = useState(false)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [activeMenu, setActiveMenu] = useState("produksi")

  // Modal PIN untuk masuk ke Dashboard Developer Terpisah
  const [showPinModal, setShowPinModal] = useState(false)
  const [inputPinDev, setInputPinDev] = useState("")
  const pinAdminResmi = "123456"

  const [userId, setUserId] = useState(null)
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
    peranSaatIni: "Praktisi Bisnis & Kreator Digital",
    kepribadianSosial:
      "Santai, jujur, dan peduli seperti kakak senior di warung kopi",
    minatUtama: "Bisnis, Keuangan Praktis, Teknologi & Olahraga",
    lingkunganRekam: "Kamar / Meja Kerja di Dalam Ruangan",
    waktuFree: "Fleksibel",
    selfPronounInput: "Gue",
    audiencePronounInput: "Lo / Kalian",
  })

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
  ])

  const [stage, setStage] = useState(0)
  const [hasilSkrip, setHasilSkrip] = useState(null)
  const [modeTampilanSkrip, setModeTampilanSkrip] = useState("voiceover")
  const [modeTeleprompter, setModeTeleprompter] = useState(false)

  const [koleksiSkripTersimpan, setKoleksiSkripTersimpan] = useState([])
  const [formKinerja, setFormKinerja] = useState({})
  const [semuaUserDB, setSemuaUserDB] = useState([])
  const [daftarTransaksi, setDaftarTransaksi] = useState([])
  const [checkoutModal, setCheckoutModal] = useState(null)
  const [inputKodeVoucherUser, setInputKodeVoucherUser] = useState("")

  const [pengaturanPayment, setPengaturanPayment] = useState({
    modeVerifikasi: "otomatis",
    namaMerchant: "HOOKYA OFFICIAL",
    infoRekening: "BCA / SeaBank / GoPay / DANA a.n Admin Hookya",
    qrisImageUrl: "",
  })

  const [daftarVoucher, setDaftarVoucher] = useState([
    { kode: "HOOKYA100", koin: 100, kuota: 50, terpakai: 0 },
  ])

  const [customPrompts, setCustomPrompts] = useState({
    persona_engine: "Ekstrak sapaan dan kosakata khas pengguna dengan akurat.",
    assessment_copilot: "Berikan 3 pilihan sudut pandang yang tajam.",
    script_humanizer:
      "Tulis dengan bahasa lisan yang mengalir alami saat diucapkan.",
  })

  const muatUlangDataSupabase = async (idTarget) => {
    try {
      const { data: userRows } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true })

      if (userRows) {
        setSemuaUserDB(userRows)
        const savedId =
          idTarget ||
          (typeof window !== "undefined"
            ? localStorage.getItem("hookya_active_user_id")
            : null)

        const activeUser = userRows.find((u) => u.id === savedId)
        if (activeUser) {
          setUserId(activeUser.id)
          setCoins(activeUser.koin ?? 120)
          setProfil((prev) => ({
            ...prev,
            ...(activeUser.profil_dna || {}),
            nama: activeUser.nama || prev.nama,
          }))
          if (activeUser.profil_dna?.personaProfile) {
            setPersonaProfile(activeUser.profil_dna.personaProfile)
          }
          setViewMode("user")
        }
      }

      const { data: scriptRows } = await supabase
        .from("scripts")
        .select("*")
        .order("created_at", { ascending: false })

      if (scriptRows) {
        setKoleksiSkripTersimpan(
          scriptRows.map((row) => ({
            id: row.id,
            dbId: row.id,
            judul: row.judul,
            kategori: row.kategori,
            bentuk: row.bentuk_konten,
            waktuDibuat: new Date(row.created_at).toLocaleDateString("id-ID"),
            segmen: Array.isArray(row.segmen_skrip)
              ? row.segmen_skrip
              : row.segmen_skrip?.segmen || [],
            sudahUpload: Boolean(row.segmen_skrip?.meta?.sudahUpload),
            tanggalUpload: row.segmen_skrip?.meta?.tanggalUpload || "",
            views: row.segmen_skrip?.meta?.views ?? null,
            likes: row.segmen_skrip?.meta?.likes ?? null,
            komen: row.segmen_skrip?.meta?.komen ?? null,
            evaluasiAI: row.segmen_skrip?.meta?.evaluasiAI || "",
          })),
        )
      }

      const { data: trxRows } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
      if (trxRows) setDaftarTransaksi(trxRows)
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
        profil_dna: {
          ...profil,
          rawWritingSamples,
          personaProfile: personaTerbaru,
          bentukKonten,
          customPrompts,
          daftarVoucher,
          pengaturanPayment,
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
        if (data?.id) return { ...skripObj, id: data.id, dbId: data.id }
      }
    } catch {
      // Fallback
    }
    return skripObj
  }

  // ============================================================================
  // 1. JIKA MODE = 'auth' -> TAMPILKAN LAMAN LOGIN / PENDAFTARAN FULLSCREEN
  // ============================================================================
  if (viewMode === "auth") {
    return (
      <AuthFullscreen
        onNotify={showToast}
        onAuthSuccess={(userRow) => {
          if (userRow?.id) {
            setUserId(userRow.id)
            if (typeof window !== "undefined") {
              localStorage.setItem("hookya_active_user_id", userRow.id)
            }
            setCoins(userRow.koin ?? 50)
            setProfil((prev) => ({
              ...prev,
              ...(userRow.profil_dna || {}),
              nama: userRow.nama || prev.nama,
            }))
          }
          setViewMode("user")
        }}
      />
    )
  }

  // ============================================================================
  // 2. JIKA MODE = 'dev' -> TAMPILKAN DASHBOARD DEVELOPER TERPISAH (MURNI MANAJERIAL)
  // ============================================================================
  if (viewMode === "dev") {
    return (
      <DeveloperDashboardView
        onSwitchToUserView={() => setViewMode("user")}
        semuaUserDB={semuaUserDB}
        daftarTransaksi={daftarTransaksi}
        koleksiSkripTersimpan={koleksiSkripTersimpan}
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
          showToast("Transaksi disetujui & koin dikirim!")
        }}
        simpanPengaturanDevKeDB={() => {
          simpanPersonaKeSupabase(personaProfile)
          showToast("Pengaturan manajerial disimpan!")
        }}
        muatUlangDataSupabase={muatUlangDataSupabase}
        showToast={showToast}
      />
    )
  }

  // ============================================================================
  // 3. JIKA MODE = 'user' -> TAMPILKAN DASHBOARD PENGGUNA (FOKUS KREATOR)
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
    { id: "rapor", label: "Laporan Kinerja VT", icon: "chart" },
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
      ket: "Untuk mulai rutin membuat konten.",
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

      {/* HEADER STICKY: KIRI = BURGER | TENGAH = LOGO HOOKYA | KANAN = PROFIL + KOIN */}
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

        {/* TENGAH: LOGO HOOKYA */}
        <div
          onClick={() => setActiveMenu("produksi")}
          className="cursor-pointer absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
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
                  <h4 className="font-bold text-sm mt-1">{profil.nama}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfilePopup(false)}
                  className="cursor-pointer w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowProfilePopup(false)
                  setShowPinModal(true)
                }}
                className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
              >
                <FlatIcon name="code" className="w-4 h-4" />
                <span>Buka Dashboard Developer (Admin)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowProfilePopup(false)
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
                    Menu Navigasi
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
                    </button>
                  ))}
                </nav>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false)
                  setShowPinModal(true)
                }}
                className="cursor-pointer w-full bg-white/10 text-[#d4f34a] text-xs font-bold py-3 rounded-xl"
              >
                ⚙️ Mode Developer
              </button>
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
                </button>
              )
            })}
          </nav>

          {!desktopMinimized && (
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

        {/* AREA KONTEN UTAMA USER */}
        <main className="flex-1 p-3 sm:p-5 md:pl-0 max-w-5xl">
          {activeMenu === "dna" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-5">
              <h2 className="text-lg sm:text-xl font-bold">
                Profil & Gaya Bicaramu Sehari-hari
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Nama Panggilan:
                  </label>
                  <input
                    type="text"
                    value={profil.nama}
                    onChange={(e) =>
                      setProfil({ ...profil, nama: e.target.value })
                    }
                    className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                  />
                </div>
                <SelectWithCustom
                  label="Sebutan Diri:"
                  value={profil.selfPronounInput}
                  options={["Gue", "Aku", "Saya", "Kita"]}
                  onChange={(val) =>
                    setProfil({ ...profil, selfPronounInput: val })
                  }
                />
                <SelectWithCustom
                  label="Sebutan Penonton:"
                  value={profil.audiencePronounInput}
                  options={[
                    "Lo / Kalian",
                    "Kamu / Teman-teman",
                    "Bro / Sis",
                    "Bunda / Moms",
                  ]}
                  onChange={(val) =>
                    setProfil({ ...profil, audiencePronounInput: val })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  Contoh Gaya Bicaramu (Bisa Ketik atau Klik Ikon Mikrofon):
                </label>
                <StoryVoiceInput
                  rows={3}
                  value={rawWritingSamples}
                  onChange={setRawWritingSamples}
                  placeholder="Ceritakan 2-3 kalimat dengan gaya ngobrol aslimu..."
                  onNotify={showToast}
                />
              </div>

              <button
                type="button"
                disabled={isGenerating}
                onClick={async () => {
                  setIsGenerating(true)
                  try {
                    const res = await fetch("/api/ai", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "extract_persona_dna",
                        userId,
                        namaUser: profil.nama,
                        onboardingAnswers: {
                          nama: profil.nama,
                          sapaan_diri: profil.selfPronounInput,
                          sapaan_audiens: profil.audiencePronounInput,
                        },
                        rawWritingSamples,
                      }),
                    })
                    const data = await res.json()
                    if (res.ok) {
                      setPersonaProfile(data)
                      await simpanPersonaKeSupabase(data)
                      showToast("Profil & gaya bicara berhasil disimpan!")
                      setActiveMenu("produksi")
                    }
                  } finally {
                    setIsGenerating(false)
                  }
                }}
                className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-4 rounded-2xl"
              >
                {isGenerating
                  ? "Mempelajari Gaya Bicaramu..."
                  : "Simpan Profil & Lanjut Buat Skrip ➔"}
              </button>
            </div>
          )}

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

          {(activeMenu === "tersimpan" || activeMenu === "rapor") && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-5">
              <h2 className="text-lg font-bold">
                Daftar Skrip Tersimpan & Laporan Kinerja VT
              </h2>
              {koleksiSkripTersimpan.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs text-slate-500">
                      {item.waktuDibuat} • {item.bentuk}
                    </span>
                    <h4 className="font-bold text-sm">{item.judul}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHasilSkrip(item)
                      setStage(5)
                      setActiveMenu("produksi")
                    }}
                    className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Buka Skrip
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeMenu === "topup" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-lg font-bold">Pilih Paket Koin Hookya</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {daftarPaketKoin.map((p) => (
                  <div
                    key={p.nama}
                    className={`p-5 rounded-3xl flex flex-col justify-between ${
                      p.populer
                        ? "bg-[#14141f] text-white"
                        : "bg-[#f4f5f7] text-[#14141f]"
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-sm">{p.nama}</h3>
                      <div className="text-2xl font-bold mt-1">{p.harga}</div>
                      <span className="text-xs font-bold bg-[#d4f34a] text-[#14141f] px-2 py-0.5 rounded mt-2 inline-block">
                        {p.koin} Koin
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCheckoutModal({
                          invoiceId: `INV-${Date.now().toString().slice(-5)}`,
                          namaPaket: p.nama,
                          koin: p.koin,
                          nominalBayar:
                            p.nominalAngka +
                            Math.floor(100 + Math.random() * 800),
                        })
                      }
                      className="cursor-pointer mt-5 w-full bg-[#d4f34a] text-[#14141f] font-bold text-xs py-3 rounded-xl"
                    >
                      Beli Paket
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL PIN UNTUK BERALIH KE DASHBOARD DEVELOPER TERPISAH */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#14141f] w-full max-w-sm rounded-3xl p-6 space-y-4 text-center">
            <h3 className="text-base font-bold">Masuk ke Mode Developer</h3>
            <p className="text-xs text-slate-500">
              Masukkan PIN Admin untuk beralih ke layar penuh Dashboard
              Manajerial Developer (PIN: 123456)
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
