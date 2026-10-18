"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"

// ============================================================================
// 1. KOMPONEN IKON FLAT DESIGN
// ============================================================================
function FlatIcon({ name, className = "w-5 h-5" }) {
  const icons = {
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    bolt: <path d="M13 2L3 14h7v8l10-12h-7V2z" />,
    dna: (
      <path d="M7 2v2c0 4 10 4 10 8s-10 4-10 8v2M17 2v2c0 4-10 4-10 8s10 4 10 8v2M6 6h12M6 18h12M8 12h8" />
    ),
    chart: <path d="M4 20h16M6 16v-5m4 5V8m4 8v-3m4 3V5" />,
    coin: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10m-2.5-7.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="2" width="6" height="11" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0M12 17v4m-3 0h6" />
      </>
    ),
    bag: (
      <>
        <path d="M6 7h12l1 13H5L6 7z" />
        <path d="M9 7V5a3 3 0 0 1 6 0v2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.5-4 14.5-4 16 0" />
      </>
    ),
    scissors: (
      <>
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
      </>
    ),
    bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    code: <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />,
    upload: (
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    ),
    check: <path d="M5 13l4 4L19 7" />,
    refresh: (
      <path d="M4 12a8 8 0 0 1 13.66-5.66L20 8.68M20 4v4.68h-4.68M20 12a8 8 0 0 1-13.66 5.66L4 15.32M4 20v-4.68h4.68" />
    ),
    tv: (
      <>
        <rect x="3" y="5" width="18" height="12" rx="2" />
        <path d="M8 21h8m-4-4v4" />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6L6 18" />,
    chevronDown: <path d="M6 9l6 6 6-6" />,
    chevronLeft: <path d="M15 18l-6-6 6-6" />,
    chevronRight: <path d="M9 18l6-6-6-6" />,
    bell: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    qr: (
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 19h3M19 14v3" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {icons[name] || icons.bolt}
    </svg>
  )
}

// ============================================================================
// 2. KOMPONEN KOTAK CERITA DENGAN IKON MIC SAJA
// ============================================================================
function StoryVoiceInput({ value, onChange, placeholder, rows = 2, onNotify }) {
  const [isListening, setIsListening] = useState(false)

  const handleMicClick = () => {
    if (typeof window === "undefined") return
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      if (onNotify)
        onNotify("Browser ini belum mendukung fitur rekaman suara langsung.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "id-ID"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setIsListening(true)
    if (onNotify) onNotify("Silakan bicara...")

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      const gabungan = value ? `${value} ${transcript}` : transcript
      onChange(gabungan)
      setIsListening(false)
      if (onNotify) onNotify("Suara berhasil diubah menjadi teks.")
    }

    recognition.onerror = () => {
      setIsListening(false)
      if (onNotify)
        onNotify("Pastikan izin mikrofon di browser sudah diaktifkan.")
    }

    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  return (
    <div className="relative w-full">
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#f4f5f7] border border-slate-200 rounded-2xl p-3.5 pr-12 text-xs sm:text-sm font-normal text-[#14141f] focus:bg-white focus:border-[#14141f] outline-none transition leading-relaxed"
      />
      <button
        type="button"
        onClick={handleMicClick}
        title="Rekam suara"
        className={`cursor-pointer absolute right-2.5 bottom-2.5 w-9 h-9 rounded-xl flex items-center justify-center transition shadow-2xs ${
          isListening
            ? "bg-rose-500 text-white animate-pulse"
            : "bg-[#14141f] text-[#d4f34a] hover:scale-105"
        }`}
      >
        <FlatIcon name="mic" className="w-4 h-4" />
      </button>
    </div>
  )
}

// ============================================================================
// 3. KOMPONEN DROPDOWN DENGAN OPSI "ISI SENDIRI..."
// ============================================================================
function SelectWithCustom({
  label,
  value,
  options,
  onChange,
  placeholderCustom = "Ketik sendiri sesuai kondisimu...",
}) {
  const isPredefined = options.includes(value)
  const [modeIsiSendiri, setModeIsiSendiri] = useState(
    !isPredefined && Boolean(value),
  )

  const handleSelectChange = (e) => {
    const val = e.target.value
    if (val === "__CUSTOM__") {
      setModeIsiSendiri(true)
      onChange("")
    } else {
      setModeIsiSendiri(false)
      onChange(val)
    }
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-[#14141f] tracking-tight">
          {label}
        </label>
      )}
      <select
        value={modeIsiSendiri ? "__CUSTOM__" : value}
        onChange={handleSelectChange}
        className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#14141f] outline-none focus:bg-white focus:border-[#14141f]"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option value="__CUSTOM__">Isi Sendiri...</option>
      </select>

      {modeIsiSendiri && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholderCustom}
          autoFocus
          className="w-full bg-white border border-[#14141f] rounded-xl px-3.5 py-2 text-xs font-normal text-[#14141f] outline-none"
        />
      )}
    </div>
  )
}

// ============================================================================
// 4. EKSTRAKTOR FRAME & AUDIO VIDEO OTOMATIS DI BROWSER
// ============================================================================
function ekstrakFrameDariFileVideoAman(file, jumlahFrame = 4) {
  return new Promise((resolve) => {
    let sudahSelesai = false
    const selesaikan = (hasil) => {
      if (!sudahSelesai) {
        sudahSelesai = true
        resolve(hasil)
      }
    }

    const timerBatas = setTimeout(() => selesaikan([]), 3000)

    try {
      const video = document.createElement("video")
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const url = URL.createObjectURL(file)

      video.preload = "metadata"
      video.src = url
      video.muted = true
      video.playsInline = true

      const daftarFrame = []

      video.onloadeddata = async () => {
        try {
          const durasi = Math.min(video.duration || 4, 45)
          const lebar = 420
          const tinggi =
            Math.round((video.videoHeight / (video.videoWidth || 1)) * lebar) ||
            260
          canvas.width = lebar
          canvas.height = tinggi

          for (let i = 1; i <= jumlahFrame; i++) {
            const waktuTarget = (durasi / (jumlahFrame + 1)) * i
            await new Promise((resSeek) => {
              const tSeek = setTimeout(resSeek, 500)
              video.onseeked = () => {
                clearTimeout(tSeek)
                try {
                  ctx.drawImage(video, 0, 0, lebar, tinggi)
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.65)
                  const base64Clean = dataUrl.split(",")[1]
                  if (base64Clean) daftarFrame.push(base64Clean)
                } catch {
                  // Abaikan
                }
                resSeek()
              }
              video.currentTime = waktuTarget
            })
          }
        } finally {
          clearTimeout(timerBatas)
          URL.revokeObjectURL(url)
          selesaikan(daftarFrame)
        }
      }

      video.onerror = () => {
        clearTimeout(timerBatas)
        URL.revokeObjectURL(url)
        selesaikan([])
      }
    } catch {
      clearTimeout(timerBatas)
      selesaikan([])
    }
  })
}

// ============================================================================
// 5. DAFTAR 10 VARIASI BENTUK KONTEN ANDALAN
// ============================================================================
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

// ============================================================================
// 6. DATA INTERNAL DI BALIK LAYAR (TIDAK DITAMPILKAN MENTAH KE PENGGUNA AWAM)
// ============================================================================
const DEFAULT_PERSONA_PROFILE = {
  user_id: "usr_99281",
  persona_summary:
    "Gaya bicara jujur, santai, namun peduli seperti kakak senior atau teman dekat yang sedang berbagi pengalaman nyata.",
  archetype: {
    primary: "Teman Diskusi Jujur",
    secondary: "Praktisi Berpengalaman",
    authority_stance:
      "Berbicara dari pengalaman dan praktik nyata sehari-hari.",
  },
  linguistic_matrix: {
    self_pronoun: "Gue",
    audience_pronoun: "Lo / Kalian",
    greeting_signature: ["Gini bro,", "Jujur ya,", "Coba pikir deh,"],
    favorite_transitions: [
      "Masalahnya gini,",
      "Nah, lucunya adalah...",
      "Padahal aslinya,",
      "Intinya simpel:",
    ],
    signature_vocabulary: ["boncos", "valid", "mindset", "eksekusi", "ngaco"],
    forbidden_words: [
      "Anda",
      "Pemirsa",
      "Oleh karena itu",
      "Selain itu",
      "Di era digital saat ini",
      "Kesimpulannya",
      "Mari kita bahas",
      "Tidak dapat dipungkiri",
    ],
    code_switching_level: "Natural sehari-hari",
  },
  rhythm_and_delivery: {
    sentence_length: "Pendek, jelas, maksimal 10-14 kata per kalimat",
    pacing:
      "Cepat dan memikat di awal, mengalir santai di tengah, tegas di akhir",
    humor_style: "Santai dan menertawakan pengalaman masa lalu sendiri",
    rhetorical_habit: "Sering melempar pertanyaan singkat lalu dijawab sendiri",
  },
  belief_system: {
    core_values: ["Praktik lebih penting dari teori", "Konsistensi sederhana"],
    contrarian_views: ["Kurang suka teori rumit yang sulit dipraktikkan"],
  },
}

const DEFAULT_CONTENT_BRIEF = {
  session_id: "ses_4410",
  selected_framework: "PAS_RELATABLE_BRIDGE",
  target_platform: "Reels / TikTok (60 Detik)",
  core_idea: "",
  chosen_angle: "",
  personal_context_or_story: "",
  injected_reference: {
    type: "Fakta Psikologi",
    title: "",
    summary: "",
  },
  actionable_solution: [],
  locked_hook: "",
  call_to_action: "",
}

// ============================================================================
// 7. APLIKASI UTAMA HOOKYA
// ============================================================================
export default function HookyaApp() {
  // === STATE NAVIGASI & DRAWER MOBILE ===
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopMinimized, setDesktopMinimized] = useState(false)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [activeMenu, setActiveMenu] = useState("produksi")

  // === STATE SISTEM LOGIN / REGISTER MULTI-USER ===
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState("login") // 'login' atau 'register'
  const [authForm, setAuthForm] = useState({
    nama: "",
    kontak: "",
    pin: "",
  })

  // === STATE DATABASE & LOADING ===
  const [userId, setUserId] = useState(null)
  const [dbConnected, setDbConnected] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingOpsi, setIsLoadingOpsi] = useState(false)
  const [isLoadingIdeTopik, setIsLoadingIdeTopik] = useState(false)
  const [isLearningDiff, setIsLearningDiff] = useState(false)
  const [errorAsesmenAI, setErrorAsesmenAI] = useState("")
  const [errorRewriteAI, setErrorRewriteAI] = useState("")
  const sliderIdeRef = useRef(null)

  const [coins, setCoins] = useState(120)
  const [paket, setPaket] = useState("Paket Pemula")
  const [toastMsg, setToastMsg] = useState("")

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 3500)
  }

  // === STATE PROFIL & GAYA BICARA PENGGUNA (RAMAH AWAM, TANPA ISTILAH TEKNIS) ===
  const [profil, setProfil] = useState({
    nama: "Joni",
    kontak: "joni@hookya.id",
    pin: "1234",
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
    prinsipUtamaInput: "Praktik lebih penting dari teori, jujur meski pahit",
    opiniKontraInput: "Kurang suka motivasi kosong tanpa langkah nyata",
  })

  const [rawWritingSamples, setRawWritingSamples] = useState(
    "Gini bro, jujur ya banyak banget yang boncos gara-gara cuma modal semangat doang tapi eksekusinya ngaco. Masalahnya gini, kalau kita cuma ikut-ikutan tren tanpa paham dasarnya, ujung-ujungnya capek sendiri. Intinya simpel: benerin dulu fondasinya baru jalan.",
  )

  // Disimpan di balik layar untuk AI
  const [personaProfile, setPersonaProfile] = useState(DEFAULT_PERSONA_PROFILE)

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
        waktuFree: "Fleksibel (Bisa Kapan Saja)",
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

  const [bentukKonten, setBentukKonten] = useState(
    SEPULUH_BENTUK_KONTEN[3].nama,
  )
  const [deskripsiBentukSendiri, setDeskripsiBentukSendiri] = useState("")
  const bentukKontenFinal = deskripsiBentukSendiri.trim()
    ? `${bentukKonten} — Catatan: ${deskripsiBentukSendiri.trim()}`
    : bentukKonten

  // === STATE PEMBUATAN SKRIP 4 TAHAP ===
  const [kategoriKonten, setKategoriKonten] = useState("personal")
  const [stage, setStage] = useState(0)

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
      judul: "Jebakan Beli Barang Murah Tapi Malah Руgi Dua Kali",
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

  const [rawTopicInput, setRawTopicInput] = useState("")
  const [targetPlatformInput, setTargetPlatformInput] = useState(
    "Reels / TikTok (60 Detik)",
  )

  const [coPilotStage1Data, setCoPilotStage1Data] = useState(null)
  const [coPilotStage2Data, setCoPilotStage2Data] = useState(null)
  const [coPilotStage3Data, setCoPilotStage3Data] = useState(null)
  const [contentBrief, setContentBrief] = useState(DEFAULT_CONTENT_BRIEF)

  const [tempStoryInput, setTempStoryInput] = useState("")
  const [tempCustomSolution, setTempCustomSolution] = useState("")
  const [tempCustomHook, setTempCustomHook] = useState("")
  const [tempCustomCTA, setTempCustomCTA] = useState("")

  // === STATE HASIL SKRIP & PEMBELAJARAN GAYA BICARA ===
  const [modeTampilanSkrip, setModeTampilanSkrip] = useState("voiceover")
  const [hasilSkrip, setHasilSkrip] = useState(null)
  const [aiOriginalDraft, setAiOriginalDraft] = useState([])
  const [diffLearningNotes, setDiffLearningNotes] = useState([])
  const [targetKonversiBentuk, setTargetKonversiBentuk] = useState(
    SEPULUH_BENTUK_KONTEN[9].nama,
  )
  const [modeTeleprompter, setModeTeleprompter] = useState(false)

  const [koleksiSkripTersimpan, setKoleksiSkripTersimpan] = useState([])
  const [formKinerja, setFormKinerja] = useState({})

  // === STATE EKSTRAK VIDEO (TANPA URL, MURNI UPLOAD FILE + PECAHAN PER KERANGKA) ===
  const [sumberVideo, setSumberVideo] = useState({
    transkripAsli: "",
    instruksiTambahan: "",
    framesBase64: [],
    fileBase64: "",
    fileMimeType: "",
    namaFileUpload: "",
    sedangEkstrakFile: false,
  })
  const [hasilRewriteVideo, setHasilRewriteVideo] = useState(null)
  const [modeTampilanRewrite, setModeTampilanRewrite] = useState("voiceover")

  // === STATE PEMBAYARAN & DASHBOARD DEVELOPER KOMPLEKS BER-PIN ===
  const [checkoutModal, setCheckoutModal] = useState(null)
  const [metodeBayarPilihan, setMetodeBayarPilihan] = useState(
    "QRIS Instan (Semua E-Wallet & M-Banking)",
  )
  const [sedangProsesBayar, setSedangProsesBayar] = useState(false)
  const [daftarTransaksi, setDaftarTransaksi] = useState([])

  const [pengaturanPayment, setPengaturanPayment] = useState({
    modeVerifikasi: "otomatis",
    namaMerchant: "HOOKYA OFFICIAL",
    infoRekening: "BCA / SeaBank / GoPay / DANA a.n Admin Hookya",
    qrisImageUrl: "",
    midtransClientKey: "",
    catatanCheckout:
      "Pastikan transfer tepat hingga 3 digit terakhir agar sistem mengenali pembayaranmu secara cepat.",
  })

  // Keamanan PIN Dashboard Developer
  const [isDevUnlocked, setIsDevUnlocked] = useState(false)
  const [inputPinDev, setInputPinDev] = useState("")
  const [pinAdminResmi, setPinAdminResmi] = useState("123456")

  const [devTab, setDevTab] = useState("overview") // 'overview', 'transaksi', 'users', 'voucher', 'prompt'
  const [semuaUserDB, setSemuaUserDB] = useState([])
  const [daftarVoucher, setDaftarVoucher] = useState([
    { kode: "HOOKYA100", koin: 100, kuota: 50, terpakai: 0 },
    { kode: "GRATIS50", koin: 50, kuota: 100, terpakai: 0 },
  ])
  const [voucherBaru, setVoucherBaru] = useState({
    kode: "",
    koin: "100",
    kuota: "25",
  })
  const [inputKodeVoucherUser, setInputKodeVoucherUser] = useState("")

  const [customPrompts, setCustomPrompts] = useState({
    persona_engine:
      "Ekstrak sapaan diri, sapaan penonton, kata transisi lisan, kosakata khas, dan kata formal yang dihindari dengan akurat.",
    assessment_copilot:
      "Berikan 3 pilihan sudut pandang yang tajam di Tahap 1, 3 fakta pendukung di Tahap 2, dan 3 kalimat pembuka memikat di Tahap 3.",
    script_humanizer:
      "Tulis dengan bahasa lisan yang mengalir alami saat diucapkan, maksimal 14 kata per baris untuk layar teleprompter.",
  })

  // ============================================================================
  // 8. SINKRONISASI SUPABASE & MANAJEMEN AKUN MULTI-USER
  // ============================================================================
  const muatDataPenggunaDariSupabase = async (targetIdSimpanan) => {
    try {
      const { data: userRows, error: userErr } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true })

      if (!userErr && userRows) {
        setSemuaUserDB(userRows)
        const savedId =
          targetIdSimpanan ||
          (typeof window !== "undefined"
            ? localStorage.getItem("hookya_active_user_id")
            : null)

        let activeUser = userRows.find((u) => u.id === savedId) || userRows[0]

        if (!activeUser) {
          const { data: newUser } = await supabase
            .from("users")
            .insert([
              {
                nama: profil.nama,
                koin: 120,
                profil_dna: {
                  ...profil,
                  rawWritingSamples,
                  personaProfile,
                  bentukKonten,
                  customPrompts,
                  pengaturanPayment,
                },
              },
            ])
            .select()
            .single()
          activeUser = newUser
          if (newUser) setSemuaUserDB([newUser])
        }

        if (activeUser) {
          setUserId(activeUser.id)
          if (typeof window !== "undefined") {
            localStorage.setItem("hookya_active_user_id", activeUser.id)
          }
          setCoins(activeUser.koin ?? 120)
          if (activeUser.profil_dna) {
            setProfil((prev) => ({
              ...prev,
              ...activeUser.profil_dna,
              nama: activeUser.nama || prev.nama,
            }))
            if (activeUser.profil_dna.rawWritingSamples) {
              setRawWritingSamples(activeUser.profil_dna.rawWritingSamples)
            }
            if (activeUser.profil_dna.personaProfile) {
              setPersonaProfile(activeUser.profil_dna.personaProfile)
            }
            if (activeUser.profil_dna.bentukKonten) {
              setBentukKonten(activeUser.profil_dna.bentukKonten)
            }
            if (activeUser.profil_dna.customPrompts) {
              setCustomPrompts(activeUser.profil_dna.customPrompts)
            }
            if (Array.isArray(activeUser.profil_dna.daftarVoucher)) {
              setDaftarVoucher(activeUser.profil_dna.daftarVoucher)
            }
            if (activeUser.profil_dna.pengaturanPayment) {
              setPengaturanPayment(activeUser.profil_dna.pengaturanPayment)
            }
          }
          setDbConnected(true)
        }

        // Ambil skrip milik pengguna aktif
        const { data: scriptRows } = await supabase
          .from("scripts")
          .select("*")
          .order("created_at", { ascending: false })

        if (scriptRows) {
          const milikUser = activeUser
            ? scriptRows.filter(
                (r) => !r.user_id || r.user_id === activeUser.id,
              )
            : scriptRows

          const terformat = milikUser.map((row) => {
            const rawSegmen = row.segmen_skrip
            const isWrapped =
              rawSegmen &&
              !Array.isArray(rawSegmen) &&
              Array.isArray(rawSegmen.segmen)

            const segmenList = isWrapped
              ? rawSegmen.segmen
              : Array.isArray(rawSegmen)
                ? rawSegmen
                : []

            const meta = isWrapped ? rawSegmen.meta || {} : {}
            const waktuDibuatStr =
              meta.waktuDibuat ||
              new Date(row.created_at).toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })

            return {
              id: row.id,
              dbId: row.id,
              judul: row.judul,
              kategori: row.kategori,
              bentuk: row.bentuk_konten || SEPULUH_BENTUK_KONTEN[3].nama,
              waktuDibuat: waktuDibuatStr,
              metadata: meta.metadata || null,
              personaAlignmentNotes: meta.personaAlignmentNotes || [],
              sudahUpload: Boolean(meta.sudahUpload),
              tanggalUpload: meta.tanggalUpload || "",
              views: meta.views ?? null,
              likes: meta.likes ?? null,
              komen: meta.komen ?? null,
              sudahEvaluasi: Boolean(meta.sudahEvaluasi),
              evaluasiAI: meta.evaluasiAI || "",
              segmen: segmenList,
            }
          })
          setKoleksiSkripTersimpan(terformat)
        }

        const { data: trxRows } = await supabase
          .from("transactions")
          .select("*")
          .order("created_at", { ascending: false })

        if (trxRows) setDaftarTransaksi(trxRows)
      }
    } catch {
      setDbConnected(false)
    }
  }

  useEffect(() => {
    muatDataPenggunaDariSupabase()
  }, [])

  // Fungsi Login / Register Akun Baru (Multi-User)
  const handleProsesAuthUser = async () => {
    const namaBersih = authForm.nama.trim()
    const kontakBersih = authForm.kontak.trim().toLowerCase()
    const pinBersih = authForm.pin.trim() || "1234"

    if (!namaBersih) {
      alert("Silakan masukkan Nama Panggilan kamu.")
      return
    }

    if (authMode === "login") {
      const ditemukan = semuaUserDB.find(
        (u) =>
          u.nama?.toLowerCase() === namaBersih.toLowerCase() ||
          (kontakBersih &&
            u.profil_dna?.kontak?.toLowerCase() === kontakBersih),
      )

      if (!ditemukan) {
        alert(
          "Akun belum ditemukan. Silakan pilih tab 'Daftar Akun Baru' untuk membuat akun.",
        )
        return
      }

      if (ditemukan.profil_dna?.pin && ditemukan.profil_dna.pin !== pinBersih) {
        alert("PIN / Kata Sandi yang kamu masukkan belum sesuai.")
        return
      }

      await muatDataPenggunaDariSupabase(ditemukan.id)
      setIsLoggedIn(true)
      setShowAuthModal(false)
      showToast(`Selamat datang kembali, ${ditemukan.nama}!`)
    } else {
      // Daftar Akun Baru di Supabase
      const profilAwal = {
        ...profil,
        nama: namaBersih,
        kontak: kontakBersih,
        pin: pinBersih,
      }

      try {
        const { data: newUser, error } = await supabase
          .from("users")
          .insert([
            {
              nama: namaBersih,
              koin: 50, // Bonus koin pendaftaran pengguna baru
              profil_dna: {
                ...profilAwal,
                rawWritingSamples,
                personaProfile: {
                  ...DEFAULT_PERSONA_PROFILE,
                  user_id: `usr_${Date.now().toString().slice(-5)}`,
                },
                bentukKonten,
              },
            },
          ])
          .select()
          .single()

        if (error) throw error

        if (newUser) {
          await muatDataPenggunaDariSupabase(newUser.id)
          setIsLoggedIn(true)
          setShowAuthModal(false)
          setActiveMenu("dna")
          showToast(
            `Akun "${namaBersih}" berhasil dibuat! Silakan lengkapi gaya bicaramu.`,
          )
        }
      } catch {
        setProfil(profilAwal)
        setIsLoggedIn(true)
        setShowAuthModal(false)
        showToast(`Selamat datang, ${namaBersih}!`)
      }
    }
  }

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
    if (userId) {
      await supabase
        .from("users")
        .update({
          nama: profil.nama,
          profil_dna: {
            ...profil,
            rawWritingSamples,
            personaProfile: personaTerbaru,
            bentukKonten,
            deskripsiBentukSendiri,
            customPrompts,
            daftarVoucher,
            pengaturanPayment,
          },
        })
        .eq("id", userId)
    }
  }

  // ============================================================================
  // 9. HANDLER ANALISIS GAYA BICARA PENGGUNA (BEKERJA DI BALIK LAYAR)
  // ============================================================================
  const handleEkstrakVoiceDNA = async () => {
    setIsGenerating(true)
    showToast("Sistem AI sedang mempelajari karakteristik dan gaya bicaramu...")

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extract_persona_dna",
          onboardingAnswers: {
            user_id:
              personaProfile.user_id ||
              `usr_${Date.now().toString().slice(-5)}`,
            nama: profil.nama,
            usia: profil.usia,
            gender: profil.gender,
            peran_dan_otoritas: profil.peranSaatIni,
            gaya_kepribadian: profil.kepribadianSosial,
            minat_utama: profil.minatUtama,
            sapaan_diri: profil.selfPronounInput,
            sapaan_audiens: profil.audiencePronounInput,
            prinsip_utama: profil.prinsipUtamaInput,
            pandangan_kontra: profil.opiniKontraInput,
          },
          rawWritingSamples,
          customPrompts,
        }),
      })

      const data = await res.json()
      if (!res.ok)
        throw new Error(data.error || "Gagal mempelajari gaya bicara")

      setPersonaProfile(data)
      await simpanPersonaKeSupabase(data)
      showToast("Gaya bicara dan karaktermu berhasil disimpan!")
    } catch (err) {
      showToast("Info Sistem AI: " + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // ============================================================================
  // 10. HANDLER PEMBUATAN SKRIP 4 TAHAP (TANPA ISTILAH TEKNIS)
  // ============================================================================
  const mulaiTahap1Angle = async (topikPilihan) => {
    const topikBersih = topikPilihan || rawTopicInput.trim()
    if (!topikBersih) {
      alert(
        "Silakan pilih salah satu ide topik di atas atau ketik topik terlebih dahulu.",
      )
      return
    }

    setRawTopicInput(topikBersih)
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
          stageNumber: 1,
          personaProfile,
          stageInput: {
            rawTopic: topikBersih,
            targetPlatform: targetPlatformInput,
            kategori: kategoriKonten,
          },
          customPrompts,
        }),
      })

      const data = await res.json()
      if (!res.ok)
        throw new Error(data.error || "Gagal memuat pilihan sudut pandang")

      setCoPilotStage1Data(data)
      setContentBrief((prev) => ({
        ...prev,
        session_id: `ses_${Date.now().toString().slice(-4)}`,
        target_platform: targetPlatformInput,
        core_idea: data.refined_core_idea || topikBersih,
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
          stageNumber: 2,
          personaProfile,
          stageInput: {
            coreIdea: contentBrief.core_idea,
            chosenAngle: finalAngle,
            userStory: finalStory,
          },
          customPrompts,
        }),
      })

      const data = await res.json()
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
      if (!res.ok) throw new Error(data.error || "Gagal memuat kalimat pembuka")

      setCoPilotStage3Data(data)
      setContentBrief((prev) => ({
        ...prev,
        selected_framework:
          data.recommended_framework || "PAS_RELATABLE_BRIDGE",
        locked_hook: data.hook_options?.[0] || prev.locked_hook,
        call_to_action: data.cta_options?.[0] || prev.call_to_action,
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
    showToast(
      "Rangkuman konten siap! Klik tombol Buat Skrip untuk menyusun naskah.",
    )
  }

  // ============================================================================
  // 11. PENYUSUN SKRIP UTAMA & SIMPAN KE DATABASE
  // ============================================================================
  const simpanAtauUpdateSkripDatabase = async (skripObj) => {
    const payloadSegmen = {
      segmen: skripObj.segmen,
      meta: {
        waktuDibuat: skripObj.waktuDibuat,
        metadata: skripObj.metadata,
        personaAlignmentNotes: skripObj.personaAlignmentNotes,
        contentBrief: skripObj.contentBrief,
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

        if (data?.id) {
          return { ...skripObj, id: data.id, dbId: data.id }
        }
      }
    } catch {
      // Fallback
    }
    return skripObj
  }

  const handleAssembleHumanizedScript = async () => {
    if (coins < 1) {
      alert("Saldo Koin kamu tidak mencukupi. Silakan isi ulang koin.")
      setActiveMenu("topup")
      return
    }

    const infoBentuk = SEPULUH_BENTUK_KONTEN.find(
      (b) => b.nama === bentukKonten,
    )
    if (infoBentuk) setModeTampilanSkrip(infoBentuk.modeDefault)

    setIsGenerating(true)
    setDiffLearningNotes([])
    showToast("Sistem AI sedang menulis skrip sesuai gaya bicaramu...")

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assemble_humanized_script",
          personaProfile,
          contentBrief,
          bentukKonten: bentukKontenFinal,
          customPrompts,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyusun skrip")

      await updateKoinDatabase(coins - 1)

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
            ? "Konten Kreator & Personal Branding"
            : "Konten Promosi & Affiliate",
        bentuk: bentukKontenFinal,
        waktuDibuat: waktuSekarang,
        metadata: data.metadata || {
          estimated_duration: "45-60 Detik",
          framework_used: contentBrief.selected_framework,
          target_platform: contentBrief.target_platform,
        },
        personaAlignmentNotes: Array.isArray(data.persona_alignment_notes)
          ? data.persona_alignment_notes
          : [],
        contentBrief,
        sudahUpload: false,
        tanggalUpload: "",
        views: null,
        likes: null,
        komen: null,
        sudahEvaluasi: false,
        evaluasiAI: "",
        segmen: segmenHasil,
      }

      const skripTersimpanDB = await simpanAtauUpdateSkripDatabase(skripBaru)
      setHasilSkrip(skripTersimpanDB)
      setKoleksiSkripTersimpan((prev) => [skripTersimpanDB, ...prev])
      setStage(5)
      showToast("Skrip selesai dibuat dan otomatis tersimpan!")
    } catch (err) {
      showToast("Info Sistem AI: " + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRunSelfLearningDiff = async () => {
    if (!hasilSkrip || isLearningDiff) return
    setIsLearningDiff(true)
    showToast("Sistem AI sedang mempelajari revisi kalimatmu...")

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze_script_diff",
          aiDraft:
            aiOriginalDraft.length > 0 ? aiOriginalDraft : hasilSkrip.segmen,
          userEditedScript: hasilSkrip.segmen,
          personaProfile,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan perubahan")

      if (data.updated_persona_profile) {
        setPersonaProfile(data.updated_persona_profile)
        await simpanPersonaKeSupabase(data.updated_persona_profile)
      }
      if (Array.isArray(data.learning_summary)) {
        setDiffLearningNotes(data.learning_summary)
      }

      await simpanAtauUpdateSkripDatabase(hasilSkrip)
      setKoleksiSkripTersimpan((prev) =>
        prev.map((s) => (s.id === hasilSkrip.id ? hasilSkrip : s)),
      )
      setAiOriginalDraft(JSON.parse(JSON.stringify(hasilSkrip.segmen)))

      showToast("Perubahan skrip disimpan & gaya bicaramu berhasil diperbarui!")
    } catch (err) {
      showToast("Info Sistem AI: " + err.message)
    } finally {
      setIsLearningDiff(false)
    }
  }

  // ============================================================================
  // 12. HANDLER EKSTRAK VIDEO (TEKS ASLI VIDEO + PECAHAN PER KERANGKA & REGENERATE)
  // ============================================================================
  const handleFileVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErrorRewriteAI("")
    setSumberVideo((prev) => ({
      ...prev,
      namaFileUpload: file.name,
      sedangEkstrakFile: true,
      framesBase64: [],
      fileBase64: "",
    }))

    try {
      // Baca base64 file video/audio (jika ukuran <= 15MB kirim langsung agar suara aslinya terdengar utuh oleh AI)
      if (file.size <= 15 * 1024 * 1024) {
        const reader = new FileReader()
        reader.onload = () => {
          const base64Clean =
            (reader.result || "").toString().split(",")[1] || ""
          setSumberVideo((prev) => ({
            ...prev,
            fileBase64: base64Clean,
            fileMimeType: file.type || "video/mp4",
          }))
        }
        reader.readAsDataURL(file)
      }

      if (file.type.startsWith("video/")) {
        const frames = await ekstrakFrameDariFileVideoAman(file, 4)
        setSumberVideo((prev) => ({
          ...prev,
          framesBase64: frames,
          sedangEkstrakFile: false,
        }))
      } else {
        setSumberVideo((prev) => ({ ...prev, sedangEkstrakFile: false }))
      }
      showToast(`Video "${file.name}" siap diekstrak teks aslinya.`)
    } catch {
      setSumberVideo((prev) => ({ ...prev, sedangEkstrakFile: false }))
    }
  }

  const handleRewriteVideoAI = async () => {
    if (coins < 2) {
      alert(
        "Saldo koin belum mencukupi. Silakan isi ulang koin terlebih dahulu.",
      )
      setActiveMenu("topup")
      return
    }
    if (!sumberVideo.namaFileUpload && !sumberVideo.transkripAsli.trim()) {
      setErrorRewriteAI(
        "Silakan pilih file video/audio dari perangkatmu terlebih dahulu.",
      )
      return
    }

    setErrorRewriteAI("")
    setHasilRewriteVideo(null)
    setIsGenerating(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rewrite_video",
          personaProfile,
          namaFileVideo: sumberVideo.namaFileUpload,
          teksReferensi: sumberVideo.transkripAsli.trim(),
          detailInput: sumberVideo.instruksiTambahan.trim(),
          framesBase64: sumberVideo.framesBase64,
          mediaBase64: sumberVideo.fileBase64,
          mediaMimeType: sumberVideo.fileMimeType,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengekstrak video")

      await updateKoinDatabase(coins - 2)
      setHasilRewriteVideo({
        transkripAsliVideo:
          data.transkripAsliVideo ||
          data.transkripTerdeteksi ||
          sumberVideo.transkripAsli,
        intiPesanVideo: data.intiPesanVideo || "",
        segmen: Array.isArray(data.segmen) ? data.segmen : [],
      })
      showToast("Teks asli video berhasil diekstrak dan dipecah per kerangka!")
    } catch (err) {
      setErrorRewriteAI(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // Fungsi Regenerate Per Kerangka Khusus di Menu Ekstrak Video
  const handleRegenerateSegmenVideo = async (indexBaris, fokusTarget) => {
    if (!hasilRewriteVideo || isGenerating) return
    const segmenLama = hasilRewriteVideo.segmen[indexBaris]
    setIsGenerating(true)
    showToast(`Membuat variasi baru untuk ${segmenLama.labelMini}...`)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate_segmen",
          personaProfile,
          bentukKonten: bentukKontenFinal,
          subyek:
            hasilRewriteVideo.intiPesanVideo ||
            sumberVideo.namaFileUpload ||
            "Konten Video",
          segmenTarget: segmenLama,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui kerangka")

      const segmenUpdate = { ...segmenLama }
      if (fokusTarget === "visual") {
        segmenUpdate.visual = data.visual || segmenLama.visual
      } else {
        segmenUpdate.voiceover = data.voiceover || segmenLama.voiceover
        segmenUpdate.teksLayar = data.teksLayar || segmenLama.teksLayar
        segmenUpdate.visual = data.visual || segmenLama.visual
      }

      const listBaru = hasilRewriteVideo.segmen.map((s, i) =>
        i === indexBaris ? segmenUpdate : s,
      )
      setHasilRewriteVideo({ ...hasilRewriteVideo, segmen: listBaru })
      showToast(`${segmenLama.labelMini} berhasil diperbarui!`)
    } catch (err) {
      showToast("Info Sistem AI: " + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // Fungsi Regenerate Per Kerangka di Menu Skrip Utama
  const handleRegeneratePerBagian = async (indexBaris, fokusTarget) => {
    if (!hasilSkrip || isGenerating) return
    const segmenLama = hasilSkrip.segmen[indexBaris]
    setIsGenerating(true)
    showToast(`Memperbarui ${segmenLama.labelMini}...`)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate_segmen",
          personaProfile,
          bentukKonten: hasilSkrip.bentuk,
          subyek: hasilSkrip.judul,
          segmenTarget: segmenLama,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui bagian")

      const segmenUpdate = { ...segmenLama }
      if (fokusTarget === "visual") {
        segmenUpdate.visual = data.visual || segmenLama.visual
      } else {
        segmenUpdate.voiceover = data.voiceover || segmenLama.voiceover
        segmenUpdate.teksLayar = data.teksLayar || segmenLama.teksLayar
        segmenUpdate.visual = data.visual || segmenLama.visual
      }

      const daftarSegmenBaru = hasilSkrip.segmen.map((s, i) =>
        i === indexBaris ? segmenUpdate : s,
      )
      const skripDiperbarui = { ...hasilSkrip, segmen: daftarSegmenBaru }
      setHasilSkrip(skripDiperbarui)
      await simpanAtauUpdateSkripDatabase(skripDiperbarui)
      showToast("Bagian skrip berhasil diperbarui.")
    } catch (err) {
      showToast("Info Sistem AI: " + err.message)
    } finally {
      setIsGenerating(false)
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
          personaProfile,
          subyek: hasilSkrip.judul,
          skripSebelumnya: hasilSkrip.segmen,
          bentukKontenBaru: targetKonversiBentuk,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengubah bentuk konten")

      const skripDiperbarui = {
        ...hasilSkrip,
        bentuk: targetKonversiBentuk,
        segmen: data.segmen || hasilSkrip.segmen,
      }
      setBentukKonten(targetKonversiBentuk)
      setHasilSkrip(skripDiperbarui)
      await simpanAtauUpdateSkripDatabase(skripDiperbarui)
      showToast("Bentuk konten berhasil diperbarui.")
    } catch (err) {
      showToast("Info Sistem AI: " + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate10IdeTopikAI = async () => {
    setIsLoadingIdeTopik(true)
    showToast("Sistem AI sedang meracik 10 ide topik baru sesuai profilmu...")
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "buat_10_ide_topik",
          personaProfile,
          kategoriKonten,
        }),
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.ideTopik) && data.ideTopik.length > 0) {
        setDaftar10IdeTopik(data.ideTopik.slice(0, 10))
        showToast("10 referensi ide topik baru berhasil dimuat.")
      }
    } catch (err) {
      showToast("Info Sistem AI: " + err.message)
    } finally {
      setIsLoadingIdeTopik(false)
    }
  }

  const geserSliderIde = (arah) => {
    if (!sliderIdeRef.current) return
    sliderIdeRef.current.scrollBy({
      left: arah === "kiri" ? -320 : 320,
      behavior: "smooth",
    })
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

  const handleUbahTanggalUpload = async (item, tglBaru) => {
    const updated = { ...item, sudahUpload: true, tanggalUpload: tglBaru }
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
    showToast("Laporan kinerja disimpan & +2 Koin ditambahkan.")
  }

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
          namaPaket: paketObj.nama,
          nominal: paketObj.nominalAngka,
          namaUser: profil.nama,
        }),
      })
      const data = await res.json()
      if (data.mode === "midtrans" && data.redirectUrl) {
        window.open(data.redirectUrl, "_blank")
      }
    } catch {
      // Lanjut modal QRIS internal
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
          `Pembayaran terverifikasi! +${checkoutModal.koin} Koin masuk.`,
        )
      } else {
        showToast("Konfirmasi diterima, menunggu persetujuan Admin.")
      }
    } finally {
      setSedangProsesBayar(false)
      setCheckoutModal(null)
    }
  }

  const handleApproveTransaksiAdmin = async (trx) => {
    if (trx.status === "lunas") return
    try {
      await supabase
        .from("transactions")
        .update({ status: "lunas" })
        .eq("id", trx.id)
    } catch {
      // Abaikan
    }
    const targetUser = semuaUserDB.find((u) => u.id === trx.user_id)
    const koinSekarang = targetUser ? targetUser.koin || 0 : coins
    await updateKoinDatabase(
      koinSekarang + (trx.jumlah_koin || 0),
      trx.user_id || userId,
    )
    setDaftarTransaksi(
      daftarTransaksi.map((t) =>
        t.id === trx.id ? { ...t, status: "lunas" } : t,
      ),
    )
    showToast(`Transaksi ${trx.invoice_id} disetujui!`)
  }

  const handleKlaimVoucherUser = async () => {
    const kodeBersih = inputKodeVoucherUser.trim().toUpperCase()
    if (!kodeBersih) return
    const ditemukan = daftarVoucher.find(
      (v) => v.kode.toUpperCase() === kodeBersih,
    )
    if (!ditemukan || ditemukan.terpakai >= ditemukan.kuota) {
      alert("Kode voucher tidak valid atau kuota sudah habis.")
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

  const totalOmzetLunas = daftarTransaksi
    .filter((t) => t.status === "lunas")
    .reduce((acc, cur) => acc + (parseInt(cur.nominal_bayar) || 0), 0)

  const jumlahTransaksiPending = daftarTransaksi.filter(
    (t) => t.status === "pending",
  ).length

  const daftarMenu = [
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
    {
      id: "devprompt",
      label: "Dashboard Developer",
      icon: "code",
      badge: jumlahTransaksiPending,
    },
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
      {/* NOTIFIKASI TOAST */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#14141f] text-[#d4f34a] px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 border border-[#d4f34a]/40 max-w-md">
          <FlatIcon name="check" className="w-4 h-4 shrink-0" />
          <span className="font-normal text-white">{toastMsg}</span>
        </div>
      )}

      {/* =====================================================================
          HEADER STICKY SESUAI PERMINTAAN:
          KIRI = BURGER MENU | TENGAH = LOGO HOOKYA | KANAN = PROFIL USER + KOIN
      ===================================================================== */}
      <header className="sticky top-0 z-40 h-16 bg-[#14141f] text-white px-3 sm:px-6 flex items-center justify-between shadow-md border-b border-white/10 relative">
        {/* KIRI: Tombol Burger Menu (Berfungsi di HP & Desktop) */}
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
            aria-label="Buka Menu"
          >
            <FlatIcon name="menu" className="w-5 h-5" />
          </button>
        </div>

        {/* TENGAH: Logo Hookya */}
        <div
          onClick={() => setActiveMenu("produksi")}
          className="cursor-pointer absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-xl bg-[#d4f34a] flex items-center justify-center text-[#14141f] font-bold text-sm shadow-xs">
            H
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight text-white">
            Hookya
          </span>
        </div>

        {/* KANAN: Gabungan Tempat Profil User & Koin */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setShowProfilePopup(!showProfilePopup)}
            className="cursor-pointer flex items-center gap-2 bg-white/10 hover:bg-white/15 pl-3 pr-2.5 py-1.5 rounded-full text-xs transition border border-white/15"
          >
            <span className="w-2 h-2 rounded-full bg-[#d4f34a]" />
            <span className="font-bold text-white truncate max-w-[90px] sm:max-w-[140px]">
              {profil.nama || "Kreator"}
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

          {/* Pop-up Rincian Profil User, Koin & Ganti Akun di Sebelah Kanan */}
          {showProfilePopup && (
            <div className="absolute right-0 top-12 mt-2 w-80 sm:w-96 bg-white text-[#14141f] rounded-3xl shadow-2xl border border-slate-200 p-5 z-50 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold bg-[#f2fce2] text-[#4d6b14] px-2.5 py-0.5 rounded-md">
                    {paket} • {coins} Koin Tersedia
                  </span>
                  <h4 className="font-bold text-sm mt-1.5">
                    Halo, {profil.nama} ({profil.peranSaatIni})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfilePopup(false)}
                  className="cursor-pointer w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs font-normal space-y-1.5 text-slate-600">
                <div>
                  <strong className="font-bold text-[#14141f]">
                    Gaya Bicara:
                  </strong>{" "}
                  {personaProfile.persona_summary}
                </div>
                <div>
                  <strong className="font-bold text-[#14141f]">
                    Sapaan Khas:
                  </strong>{" "}
                  {personaProfile.linguistic_matrix?.self_pronoun} ➔{" "}
                  {personaProfile.linguistic_matrix?.audience_pronoun}
                </div>
                <div>
                  <strong className="font-bold text-[#14141f]">
                    Waktu Luang:
                  </strong>{" "}
                  {profil.waktuFree}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfilePopup(false)
                    setActiveMenu("dna")
                  }}
                  className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold py-2.5 rounded-xl"
                >
                  Edit Profil Saya
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfilePopup(false)
                    setActiveMenu("topup")
                  }}
                  className="cursor-pointer bg-[#d4f34a] text-[#14141f] text-xs font-bold py-2.5 rounded-xl"
                >
                  + Isi Ulang Koin
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowProfilePopup(false)
                  setShowAuthModal(true)
                }}
                className="cursor-pointer w-full bg-[#f4f5f7] hover:bg-slate-200 text-[#14141f] text-xs font-bold py-2.5 rounded-xl border border-slate-200"
              >
                Ganti Akun / Masuk Akun Lain
              </button>
            </div>
          )}
        </div>
      </header>

      {/* =====================================================================
          BODY UTAMA: DRAWER SIDEBAR HP + SIDEBAR DESKTOP + KONTEN
      ===================================================================== */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* DRAWER SIDEBAR KHUSUS RASIO HP (BERFUNGSI SAAT TOMBOL BURGER DIKLIK) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <aside className="relative w-72 max-w-[82vw] bg-[#14141f] text-white h-full p-5 flex flex-col justify-between z-10 shadow-2xl overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#d4f34a] flex items-center justify-center text-[#14141f] font-bold text-sm">
                      H
                    </div>
                    <span className="text-base font-bold text-white">
                      Menu Hookya
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="cursor-pointer w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white"
                  >
                    <FlatIcon name="close" className="w-4 h-4" />
                  </button>
                </div>

                <nav className="space-y-1.5 text-xs">
                  {daftarMenu.map((item) => (
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
                          : "text-slate-300 font-normal hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FlatIcon
                          name={item.icon}
                          className="w-4 h-4 shrink-0"
                        />
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

              <div className="pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false)
                    setShowAuthModal(true)
                  }}
                  className="cursor-pointer w-full bg-white/10 text-white text-xs font-bold py-3 rounded-xl"
                >
                  Ganti Akun Pengguna
                </button>
              </div>
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
            {daftarMenu.map((item) => {
              const isActive = activeMenu === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveMenu(item.id)}
                  title={item.label}
                  className={`w-full flex items-center ${
                    desktopMinimized
                      ? "justify-center p-3.5"
                      : "justify-between px-4 py-3"
                  } rounded-2xl transition cursor-pointer ${
                    isActive
                      ? "bg-[#d4f34a] text-[#14141f] font-bold shadow-md"
                      : "text-slate-300 font-normal hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FlatIcon name={item.icon} className="w-5 h-5 shrink-0" />
                    {!desktopMinimized && (
                      <span className="text-left">{item.label}</span>
                    )}
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
        </aside>

        {/* AREA KONTEN UTAMA */}
        <main className="flex-1 p-3 sm:p-5 md:pl-0 max-w-5xl">
          {/* =================================================================
              MENU 1: PROFIL & GAYA BICARA (BERSIH TANPA ISTILAH TEKNIS & JSON)
          ================================================================= */}
          {activeMenu === "dna" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                  Kenali Dirimu & Gaya Bicaramu Sehari-hari
                </h2>
                <p className="text-xs font-normal text-slate-600 mt-1 leading-relaxed">
                  Atur profil dan cara bicaramu di bawah ini agar setiap skrip
                  yang dibuat terdengar natural seperti ucapanmu sendiri, bukan
                  seperti tulisan robot.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#14141f] mb-1.5">
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
                <div>
                  <SelectWithCustom
                    label="Sebutan Diri Saat Ngonten:"
                    value={profil.selfPronounInput}
                    options={["Gue", "Aku", "Saya", "Kita"]}
                    onChange={(val) =>
                      setProfil({ ...profil, selfPronounInput: val })
                    }
                  />
                </div>
                <div>
                  <SelectWithCustom
                    label="Sebutan untuk Penonton:"
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectWithCustom
                  label="Peran / Aktivitas Utamamu Saat Ini:"
                  value={profil.peranSaatIni}
                  options={[
                    "Praktisi Bisnis & Kreator Digital",
                    "Karyawan / Pekerja & Pebisnis Lokal",
                    "Guru / Tenaga Pendidik",
                    "Mahasiswa / Anak Kos",
                    "Pelajar SMP / SMA / SMK",
                    "Ibu / Bapak Rumah Tangga",
                    "Pebisnis / UMKM / Penjual Online",
                  ]}
                  onChange={(val) =>
                    setProfil({ ...profil, peranSaatIni: val })
                  }
                />

                <SelectWithCustom
                  label="Karakter & Gaya Pembawaan:"
                  value={profil.kepribadianSosial}
                  options={[
                    "Santai, jujur, dan peduli seperti kakak senior di warung kopi",
                    "Akrab dan hangat seperti teman tongkrongan",
                    "Tegas, lugas, dan langsung ke inti masalah",
                    "Kalem, tenang, dan suka bercerita dari pengalaman",
                  ]}
                  onChange={(val) =>
                    setProfil({ ...profil, kepribadianSosial: val })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                    Minat / Bidang yang Sering Kamu Bahas:
                  </label>
                  <input
                    type="text"
                    value={profil.minatUtama}
                    onChange={(e) =>
                      setProfil({ ...profil, minatUtama: e.target.value })
                    }
                    className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-normal outline-none"
                  />
                </div>
                <SelectWithCustom
                  label="Tempat Rekaman Utama:"
                  value={profil.lingkunganRekam}
                  options={[
                    "Kamar / Meja Kerja di Dalam Ruangan",
                    "Kamar Kos / Meja Belajar Sederhana",
                    "Ruang Kelas / Tempat Kerja",
                    "Ruang Keluarga / Dapur Rumah",
                    "Luar Ruangan / Alam Terbuka",
                  ]}
                  onChange={(val) =>
                    setProfil({ ...profil, lingkunganRekam: val })
                  }
                />
              </div>

              {/* Jadwal Waktu Luang Ceklis */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm font-bold text-[#14141f]">
                    Jadwal Waktu Luang Harianmu:
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-[#f2fce2] text-[#14141f] px-3.5 py-1.5 rounded-xl text-xs font-bold border border-[#14141f]/15">
                    <input
                      type="checkbox"
                      checked={jadwalFleksibel}
                      onChange={(e) => setJadwalFleksibel(e.target.checked)}
                      className="w-4 h-4 accent-[#14141f]"
                    />
                    <span>Saya Fleksibel (Bisa Kapan Saja)</span>
                  </label>
                </div>

                {!jadwalFleksibel && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "pagi", label: "Pagi Hari" },
                      { key: "siang", label: "Siang Hari" },
                      { key: "sore", label: "Sore Hari" },
                      { key: "malam", label: "Malam Hari" },
                    ].map((w) => {
                      const slot = jadwalCeklis[w.key]
                      return (
                        <div
                          key={w.key}
                          className={`p-3.5 rounded-2xl border transition flex flex-wrap items-center justify-between gap-2 ${
                            slot.aktif
                              ? "bg-white border-[#14141f]"
                              : "bg-[#f4f5f7] border-transparent opacity-75"
                          }`}
                        >
                          <label className="cursor-pointer flex items-center gap-2 text-xs font-bold">
                            <input
                              type="checkbox"
                              checked={slot.aktif}
                              onChange={(e) =>
                                setJadwalCeklis({
                                  ...jadwalCeklis,
                                  [w.key]: { ...slot, aktif: e.target.checked },
                                })
                              }
                              className="w-4 h-4 accent-[#14141f]"
                            />
                            <span>{w.label}</span>
                          </label>

                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-500 font-normal">
                              Jam
                            </span>
                            <input
                              type="text"
                              value={slot.mulai}
                              onChange={(e) =>
                                setJadwalCeklis({
                                  ...jadwalCeklis,
                                  [w.key]: {
                                    ...slot,
                                    aktif: true,
                                    mulai: e.target.value,
                                  },
                                })
                              }
                              className="w-16 bg-[#f4f5f7] border border-slate-200 rounded-lg px-2 py-1 text-center font-bold text-xs"
                            />
                            <span>-</span>
                            <input
                              type="text"
                              value={slot.selesai}
                              onChange={(e) =>
                                setJadwalCeklis({
                                  ...jadwalCeklis,
                                  [w.key]: {
                                    ...slot,
                                    aktif: true,
                                    selesai: e.target.value,
                                  },
                                })
                              }
                              className="w-16 bg-[#f4f5f7] border border-slate-200 rounded-lg px-2 py-1 text-center font-bold text-xs"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Contoh Kalimat / Suara Asli Pengguna (Tanpa Istilah Teknis) */}
              <div className="bg-[#f4f5f7] p-4 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-[#14141f]">
                  Contoh Gaya Bicaramu Sehari-hari (Bisa Ketik atau Klik Ikon
                  Mikrofon):
                </label>
                <p className="text-xs font-normal text-slate-600">
                  Coba ceritakan bebas 2-3 kalimat dengan gaya ngobrol aslimu.
                  Sistem akan mengenali kata-kata khas yang sering kamu pakai.
                </p>
                <StoryVoiceInput
                  rows={3}
                  value={rawWritingSamples}
                  onChange={setRawWritingSamples}
                  placeholder="Contoh: Gini bro, jujur ya banyak banget yang boncos gara-gara..."
                  onNotify={showToast}
                />
              </div>

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleEkstrakVoiceDNA}
                className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs sm:text-sm py-4 rounded-2xl hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating && (
                  <FlatIcon name="refresh" className="w-4 h-4 animate-spin" />
                )}
                <span>
                  {isGenerating
                    ? "Sistem Sedang Mempelajari Gaya Bicaramu..."
                    : "Analisis & Simpan Gaya Bicara Saya"}
                </span>
              </button>

              {/* Ringkasan Gaya Bicara yang Ramah Awam */}
              <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-[#4d6b14] bg-[#f2fce2] px-2.5 py-0.5 rounded-md">
                  RINGKASAN GAYA BICARAMU SAAT INI
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#14141f] leading-relaxed">
                  {personaProfile.persona_summary}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <div className="font-bold text-[#14141f]">
                      Kata & Sapaan Khas Kamu:
                    </div>
                    <div>
                      Sapaan:{" "}
                      <strong>
                        {personaProfile.linguistic_matrix?.self_pronoun} ➔{" "}
                        {personaProfile.linguistic_matrix?.audience_pronoun}
                      </strong>
                    </div>
                    <div>
                      Pembuka:{" "}
                      {(
                        personaProfile.linguistic_matrix?.greeting_signature ||
                        []
                      ).join(" | ")}
                    </div>
                    <div>
                      Kata Khas:{" "}
                      <strong className="text-[#4d6b14]">
                        {(
                          personaProfile.linguistic_matrix
                            ?.signature_vocabulary || []
                        ).join(", ")}
                      </strong>
                    </div>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <div className="font-bold text-rose-700">
                      Kata Kaku yang Otomatis Dihindari:
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {(
                        personaProfile.linguistic_matrix?.forbidden_words || []
                      ).join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pilihan 10 Bentuk Konten + Kotak Deskripsi Sendiri */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-sm font-bold text-[#14141f]">
                  Pilih Bentuk Konten Andalanmu:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SEPULUH_BENTUK_KONTEN.map((item) => {
                    const terpilih = bentukKonten === item.nama
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setBentukKonten(item.nama)
                          setModeTampilanSkrip(item.modeDefault)
                        }}
                        className={`cursor-pointer p-4 rounded-2xl text-left border transition flex items-center justify-between gap-3 ${
                          terpilih
                            ? "bg-[#d4f34a] text-[#14141f] border-[#14141f]"
                            : "bg-[#f4f5f7] text-[#14141f] border-transparent hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-[#14141f]">
                            {item.nama}
                          </div>
                          <div className="text-xs font-normal text-slate-700 mt-1">
                            {item.ket}
                          </div>
                        </div>
                        {terpilih && (
                          <FlatIcon name="check" className="w-4 h-4 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="bg-[#f4f5f7] rounded-2xl p-4 space-y-2">
                  <label className="block text-xs font-bold text-[#14141f]">
                    Deskripsikan Sendiri Bentuk Konten yang Kamu Inginkan
                    (Opsional):
                  </label>
                  <StoryVoiceInput
                    rows={2}
                    value={deskripsiBentukSendiri}
                    onChange={setDeskripsiBentukSendiri}
                    placeholder="Ketik atau gunakan mikrofon untuk menjelaskan konsep videomu sendiri..."
                    onNotify={showToast}
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  simpanPersonaKeSupabase(personaProfile)
                  setActiveMenu("produksi")
                  showToast("Profil disimpan! Yuk mulai buat skrip kontenmu.")
                }}
                className="cursor-pointer w-full bg-[#d4f34a] text-[#14141f] font-bold text-sm py-4 rounded-2xl"
              >
                Simpan Profil & Lanjut Buat Skrip ➔
              </button>
            </div>
          )}

          {/* =================================================================
              MENU 2: BUAT SKRIP KONTEN (BAHASA SEHARI-HARI TANPA JSON MENTAH)
          ================================================================= */}
          {activeMenu === "produksi" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                    {stage === 0 && "Tentukan Ide atau Pilih Referensi Topik"}
                    {stage === 1 &&
                      "Pilih Sudut Pandang Bahasan & Cerita Pengalamanmu"}
                    {stage === 2 && "Pilih Fakta Pendukung & Langkah Solusi"}
                    {stage === 3 &&
                      "Pilih Kalimat Pembuka (3 Detik Awal) & Penutup"}
                    {stage === 4 && "Ringkasan Rancangan Kontenmu"}
                    {stage === 5 && hasilSkrip?.judul}
                  </h2>
                </div>

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
                      Topik Baru
                    </button>
                  </div>
                )}
              </div>

              {/* STAGE 0: PILIH TOPIK */}
              {stage === 0 && (
                <div className="space-y-6">
                  <div className="bg-[#f4f5f7] p-2 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
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
                          Edukasi, Cerita Harian, Hobi & Hiburan
                        </div>
                      </div>
                    </button>

                    <button
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
                          Konten Promosi & Affiliate
                        </div>
                        <div className="text-xs font-normal opacity-80">
                          Review Produk & Keranjang Kuning
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* 10 Referensi Ide Slide ke Samping */}
                  <div className="bg-[#f4f5f7] p-4 sm:p-5 rounded-3xl border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-[#14141f]">
                          10 Ide Topik Rekomendasi Sesuai Profilmu (Geser ke
                          Samping)
                        </h3>
                        <p className="text-xs font-normal text-slate-600">
                          Klik salah satu kartu ide di bawah, atau tuliskan
                          sendiri topikmu pada kolom di bawahnya.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isLoadingIdeTopik}
                          onClick={handleGenerate10IdeTopikAI}
                          className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3 py-2 rounded-xl"
                        >
                          {isLoadingIdeTopik
                            ? "Memproses..."
                            : "Perbarui 10 Ide"}
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
                        Atau Tentukan & Ketik Sendiri Topik / Produk yang Ingin
                        Dibahas:
                      </label>
                      <StoryVoiceInput
                        rows={2}
                        value={rawTopicInput}
                        onChange={setRawTopicInput}
                        placeholder="Ketik topik atau gunakan mikrofon..."
                        onNotify={showToast}
                      />
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

                  <button
                    type="button"
                    onClick={() => mulaiTahap1Angle(rawTopicInput)}
                    className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl"
                  >
                    Lanjut Pilih Sudut Pandang Bahasan ➔
                  </button>
                </div>
              )}

              {/* LOADING & ERROR HANDLER */}
              {stage >= 1 && stage <= 3 && isLoadingOpsi && (
                <div className="py-12 px-6 rounded-3xl bg-[#f4f5f7] border border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#14141f] text-[#d4f34a] flex items-center justify-center animate-spin">
                    <FlatIcon name="refresh" className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-[#14141f]">
                    Sistem AI sedang menyiapkan pilihan terbaik untuk
                    kontenmu...
                  </div>
                </div>
              )}

              {stage >= 1 && stage <= 3 && !isLoadingOpsi && errorAsesmenAI && (
                <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3">
                  <p className="text-xs sm:text-sm font-bold text-rose-900">
                    {errorAsesmenAI}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (stage === 1) mulaiTahap1Angle(rawTopicInput)
                      if (stage === 2)
                        lanjutKeTahap2Referensi(
                          contentBrief.chosen_angle,
                          tempStoryInput,
                        )
                      if (stage === 3) lanjutKeTahap3Hook()
                    }}
                    className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-5 py-2.5 rounded-xl"
                  >
                    Muat Ulang Sekarang
                  </button>
                </div>
              )}

              {/* TAHAP 1: SUDUT PANDANG & CERITA */}
              {stage === 1 && !isLoadingOpsi && coPilotStage1Data && (
                <div className="space-y-5">
                  <div className="bg-[#f4f5f7] p-4 rounded-2xl border border-slate-200 space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-[#14141f] leading-relaxed">
                      {coPilotStage1Data.co_pilot_message}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-[#14141f]">
                      1. Pilih Sudut Pandang Bahasan yang Paling Kamu Suka:
                    </label>
                    {(coPilotStage1Data.angle_options || []).map(
                      (item, idx) => {
                        const terpilih =
                          contentBrief.chosen_angle === item.angle_text
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
                                Pilihan {idx + 1} • {item.type}
                              </span>
                              <div className="text-xs sm:text-sm font-bold text-[#14141f] mt-0.5">
                                {item.angle_text}
                              </div>
                            </div>
                            {terpilih && (
                              <FlatIcon
                                name="check"
                                className="w-4 h-4 shrink-0"
                              />
                            )}
                          </button>
                        )
                      },
                    )}
                  </div>

                  <div className="bg-[#f4f5f7] p-4 rounded-2xl space-y-2">
                    <label className="block text-xs font-bold text-[#14141f]">
                      2.{" "}
                      {coPilotStage1Data.story_prompt_question ||
                        "Punya pengalaman pribadi singkat soal topik ini? (Opsional)"}
                    </label>
                    <p className="text-xs font-normal text-slate-500">
                      Jika belum ada cerita pribadi, kosongkan saja—di langkah
                      berikutnya sistem akan menyiapkan contoh perumpamaan
                      sehari-hari untukmu.
                    </p>
                    <StoryVoiceInput
                      rows={2}
                      value={tempStoryInput}
                      onChange={setTempStoryInput}
                      placeholder="Ceritakan singkat pengalamanmu atau klik ikon mikrofon..."
                      onNotify={showToast}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      lanjutKeTahap2Referensi(
                        contentBrief.chosen_angle,
                        tempStoryInput,
                      )
                    }
                    className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl"
                  >
                    Lanjut Pilih Fakta Pendukung & Solusi ➔
                  </button>
                </div>
              )}

              {/* TAHAP 2: FAKTA PENDUKUNG & SOLUSI */}
              {stage === 2 && !isLoadingOpsi && coPilotStage2Data && (
                <div className="space-y-5">
                  <div className="bg-[#f4f5f7] p-4 rounded-2xl border border-slate-200">
                    <p className="text-xs sm:text-sm font-bold text-[#14141f] leading-relaxed">
                      {coPilotStage2Data.co_pilot_message}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#14141f]">
                      1. Cerita Pengalaman / Perumpamaan Sehari-hari:
                    </label>
                    {Array.isArray(coPilotStage2Data.relatable_analogies) &&
                      coPilotStage2Data.relatable_analogies.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
                          {coPilotStage2Data.relatable_analogies.map(
                            (ana, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setTempStoryInput(ana)}
                                className={`cursor-pointer p-3 rounded-xl border text-left text-xs transition ${
                                  tempStoryInput === ana
                                    ? "bg-[#f2fce2] border-[#4d6b14] font-bold"
                                    : "bg-white border-slate-200 font-normal"
                                }`}
                              >
                                <span className="block font-bold text-[11px] text-[#4d6b14] mb-0.5">
                                  Pilihan Perumpamaan #{idx + 1}:
                                </span>
                                {ana}
                              </button>
                            ),
                          )}
                        </div>
                      )}
                    <StoryVoiceInput
                      rows={2}
                      value={tempStoryInput}
                      onChange={setTempStoryInput}
                      placeholder="Cerita atau perumpamaan yang akan dimasukkan ke skrip..."
                      onNotify={showToast}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-[#14141f]">
                      2. Pilih 1 Fakta / Referensi Pendukung Biar Kontenmu Makin
                      Kuat:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(coPilotStage2Data.reference_cards || []).map(
                        (refCard, idx) => {
                          const terpilih =
                            contentBrief.injected_reference?.title ===
                            refCard.title
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
                                  : "bg-white text-[#14141f] border-slate-200 hover:border-[#14141f]"
                              }`}
                            >
                              <div>
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-black/10">
                                  {refCard.type}
                                </span>
                                <h4 className="text-xs sm:text-sm font-bold mt-2">
                                  {refCard.title}
                                </h4>
                                <p className="text-xs font-normal text-slate-700 mt-1 leading-relaxed">
                                  {refCard.summary}
                                </p>
                              </div>
                              <div className="mt-3 text-[11px] font-bold underline">
                                {terpilih ? "✓ Dipilih" : "Pilih Fakta Ini"}
                              </div>
                            </button>
                          )
                        },
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#14141f]">
                      3. Pilih Langkah Solusi Praktis untuk Penonton:
                    </label>
                    <div className="space-y-2">
                      {(coPilotStage2Data.suggested_solutions || []).map(
                        (sol, idx) => {
                          const sudahAda =
                            contentBrief.actionable_solution.includes(sol)
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
                              className={`cursor-pointer w-full text-left p-3.5 rounded-xl border text-xs transition flex items-center justify-between gap-2 ${
                                sudahAda
                                  ? "bg-[#14141f] text-[#d4f34a] border-[#14141f] font-bold"
                                  : "bg-white text-[#14141f] border-slate-200 font-normal"
                              }`}
                            >
                              <span>{sol}</span>
                              <span>{sudahAda ? "✓ Dipakai" : "+ Pilih"}</span>
                            </button>
                          )
                        },
                      )}
                    </div>
                    <input
                      type="text"
                      value={tempCustomSolution}
                      onChange={(e) => setTempCustomSolution(e.target.value)}
                      placeholder="Tambahkan langkah solusi versi kamu sendiri (opsional)..."
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-normal outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={lanjutKeTahap3Hook}
                    className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl"
                  >
                    Lanjut Pilih Kalimat Pembuka & Penutup ➔
                  </button>
                </div>
              )}

              {/* TAHAP 3: ALUR CERITA, HOOK & CTA */}
              {stage === 3 && !isLoadingOpsi && coPilotStage3Data && (
                <div className="space-y-5">
                  <div className="bg-[#f4f5f7] p-4 rounded-2xl border border-slate-200 space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-[#14141f]">
                      {coPilotStage3Data.co_pilot_message}
                    </p>
                    <p className="text-xs font-normal text-slate-600">
                      {coPilotStage3Data.framework_reason}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#14141f]">
                      1. Pilih Gaya Alur Cerita Video:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          id: "PAS_RELATABLE_BRIDGE",
                          judul: "Masalah ➔ Cerita Relate ➔ Fakta ➔ Solusi",
                          ket: "Cocok untuk membuat penonton merasa dipahami lalu diberi jalan keluar.",
                        },
                        {
                          id: "HSO_STORY",
                          judul:
                            "Alur Cerita Pengalaman Pribadi (Storytelling)",
                          ket: "Mengalir dari pengalaman nyata menuju pelajaran penting.",
                        },
                        {
                          id: "CONTRARIAN_MYTH_BUSTER",
                          judul: "Bongkar Mitos Umum vs Fakta Sebenarnya",
                          ket: "Mematahkan anggapan yang salah dengan bukti kuat.",
                        },
                        {
                          id: "BAB_TRANSFORMATION",
                          judul:
                            "Perubahan Sebelum vs Sesudah (Before - After)",
                          ket: "Menunjukkan perbandingan kondisi awal dan hasil akhir.",
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

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#14141f]">
                      2. Pilih Kalimat Pembuka (3 Detik Pertama):
                    </label>
                    <div className="space-y-2">
                      {(coPilotStage3Data.hook_options || []).map((hk, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setContentBrief({
                              ...contentBrief,
                              locked_hook: hk,
                            })
                            setTempCustomHook("")
                          }}
                          className={`cursor-pointer w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm transition flex items-center justify-between gap-2 ${
                            contentBrief.locked_hook === hk && !tempCustomHook
                              ? "bg-[#14141f] text-[#d4f34a] border-[#14141f] font-bold"
                              : "bg-white text-[#14141f] border-slate-200 font-normal"
                          }`}
                        >
                          <span>"{hk}"</span>
                          <span className="text-xs font-bold shrink-0">
                            {contentBrief.locked_hook === hk && !tempCustomHook
                              ? "✓ Dipilih"
                              : "Pilih"}
                          </span>
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={tempCustomHook}
                      onChange={(e) => setTempCustomHook(e.target.value)}
                      placeholder="Atau ketik sendiri kalimat pembuka yang kamu inginkan..."
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-normal outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#14141f]">
                      3. Pilih Kalimat Penutup & Ajakan Komentar:
                    </label>
                    <div className="space-y-2">
                      {(coPilotStage3Data.cta_options || []).map((cta, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setContentBrief({
                              ...contentBrief,
                              call_to_action: cta,
                            })
                            setTempCustomCTA("")
                          }}
                          className={`cursor-pointer w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between gap-2 ${
                            contentBrief.call_to_action === cta &&
                            !tempCustomCTA
                              ? "bg-[#f2fce2] border-[#4d6b14] font-bold text-[#14141f]"
                              : "bg-white border-slate-200 font-normal text-slate-700"
                          }`}
                        >
                          <span>"{cta}"</span>
                          <span className="font-bold">
                            {contentBrief.call_to_action === cta &&
                            !tempCustomCTA
                              ? "✓ Dipilih"
                              : "Pilih"}
                          </span>
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={tempCustomCTA}
                      onChange={(e) => setTempCustomCTA(e.target.value)}
                      placeholder="Atau ketik kalimat penutup versimu sendiri..."
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-normal outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={lanjutKeTahap4FinalBrief}
                    className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl"
                  >
                    Lihat Ringkasan & Buat Skrip ➔
                  </button>
                </div>
              )}

              {/* TAHAP 4: RINGKASAN BERSIH (TANPA KOTAK JSON MENTAH & TANPA KATA ASSEMBLER) */}
              {stage === 4 && (
                <div className="space-y-5">
                  <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-3">
                    <span className="text-[11px] font-bold bg-[#14141f] text-[#d4f34a] px-2.5 py-0.5 rounded-md">
                      SIAP DISUSUN MENJADI SKRIP
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                        <div>
                          <span className="text-slate-500 block">
                            Topik & Sudut Pandang:
                          </span>
                          <strong className="text-[#14141f]">
                            {contentBrief.chosen_angle}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">
                            Cerita / Perumpamaan:
                          </span>
                          <span className="text-slate-700">
                            {contentBrief.personal_context_or_story}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                        <div>
                          <span className="text-slate-500 block">
                            Fakta Pendukung (
                            {contentBrief.injected_reference?.type}):
                          </span>
                          <strong className="text-[#14141f]">
                            {contentBrief.injected_reference?.title}
                          </strong>{" "}
                          — {contentBrief.injected_reference?.summary}
                        </div>
                        <div>
                          <span className="text-slate-500 block">
                            Kalimat Pembuka:
                          </span>
                          <strong className="text-[#4d6b14]">
                            "{contentBrief.locked_hook}"
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={handleAssembleHumanizedScript}
                    className="cursor-pointer w-full bg-[#d4f34a] text-[#14141f] font-bold text-sm py-4 rounded-2xl shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
                  >
                    {isGenerating && (
                      <FlatIcon
                        name="refresh"
                        className="w-4 h-4 animate-spin"
                      />
                    )}
                    <span>
                      {isGenerating
                        ? "Sedang Menyusun Skrip Kontenmu..."
                        : "Buat Skrip Konten Sekarang ➔"}
                    </span>
                  </button>
                </div>
              )}

              {/* STAGE 5: HASIL SKRIP UTAMA */}
              {stage === 5 && hasilSkrip && (
                <div className="space-y-5">
                  <div className="bg-[#14141f] text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="bg-[#d4f34a] text-[#14141f] font-bold px-2.5 py-1 rounded-lg">
                        Estimasi Durasi:{" "}
                        {hasilSkrip.metadata?.estimated_duration ||
                          "45-60 Detik"}
                      </span>
                      <span className="bg-white/10 px-2.5 py-1 rounded-lg">
                        Dibuat: {hasilSkrip.waktuDibuat}
                      </span>
                    </div>

                    <button
                      onClick={() => setModeTeleprompter(true)}
                      className="cursor-pointer flex items-center gap-1.5 bg-[#d4f34a] text-[#14141f] text-xs font-bold px-4 py-2 rounded-xl"
                    >
                      <FlatIcon name="tv" className="w-4 h-4" />
                      <span>Buka Layar Teleprompter</span>
                    </button>
                  </div>

                  <div className="bg-[#f4f5f7] p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex bg-white p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setModeTampilanSkrip("voiceover")}
                        className={`cursor-pointer px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                          modeTampilanSkrip === "voiceover"
                            ? "bg-[#14141f] text-[#d4f34a]"
                            : "text-slate-600 font-normal"
                        }`}
                      >
                        Skrip Ngomong / Voiceover
                      </button>
                      <button
                        onClick={() => setModeTampilanSkrip("teks")}
                        className={`cursor-pointer px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                          modeTampilanSkrip === "teks"
                            ? "bg-[#14141f] text-[#d4f34a]"
                            : "text-slate-600 font-normal"
                        }`}
                      >
                        Teks di Layar (Text on Screen)
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={targetKonversiBentuk}
                        onChange={(e) =>
                          setTargetKonversiBentuk(e.target.value)
                        }
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#14141f] outline-none"
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
                        className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3.5 py-2 rounded-xl shrink-0"
                      >
                        Ubah Bentuk Konten
                      </button>
                    </div>
                  </div>

                  {/* Daftar Bagian Skrip */}
                  <div className="space-y-3.5">
                    {hasilSkrip.segmen.map((seg, idx) => {
                      const teksUtamaAktif =
                        modeTampilanSkrip === "teks"
                          ? seg.teksLayar
                          : seg.voiceover

                      return (
                        <div
                          key={idx}
                          className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#14141f] bg-[#f4f5f7] px-2.5 py-1 rounded-md">
                              {seg.labelMini}
                            </span>
                            <span className="text-[11px] font-normal text-slate-500">
                              Bisa diedit langsung atau klik ikon putar untuk
                              ganti variasi
                            </span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                            <div className="lg:col-span-7 bg-[#d4f34a]/30 border border-[#14141f]/15 rounded-2xl p-4 flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-1.5">
                                <span className="text-xs font-bold text-[#14141f] block">
                                  {modeTampilanSkrip === "teks"
                                    ? "Teks di Layar / Slide:"
                                    : "Kalimat Skrip (Voiceover):"}
                                </span>
                                <textarea
                                  rows={3}
                                  value={teksUtamaAktif}
                                  onChange={(e) => {
                                    const valBaru = e.target.value
                                    const listUpdate = hasilSkrip.segmen.map(
                                      (s, i) =>
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
                                  className="w-full bg-white/80 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-normal text-[#14141f] leading-relaxed outline-none focus:bg-white focus:border-[#14141f]"
                                />
                              </div>

                              <button
                                type="button"
                                disabled={isGenerating}
                                onClick={() =>
                                  handleRegeneratePerBagian(idx, "skrip")
                                }
                                title="Buat variasi skrip baru untuk bagian ini"
                                className="cursor-pointer w-9 h-9 rounded-xl bg-white hover:bg-[#14141f] text-[#14141f] hover:text-[#d4f34a] border border-slate-200 flex items-center justify-center shrink-0 transition"
                              >
                                <FlatIcon name="refresh" className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="lg:col-span-5 bg-[#f4f5f7] rounded-2xl p-4 flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-[#14141f] block">
                                  Arahan Adegan Visual
                                </span>
                                <p className="text-xs font-normal text-slate-700 leading-relaxed">
                                  {seg.visual}
                                </p>
                              </div>

                              <button
                                type="button"
                                disabled={isGenerating}
                                onClick={() =>
                                  handleRegeneratePerBagian(idx, "visual")
                                }
                                title="Buat variasi arahan visual baru"
                                className="cursor-pointer w-9 h-9 rounded-xl bg-white hover:bg-[#14141f] text-slate-700 hover:text-[#d4f34a] border border-slate-200 flex items-center justify-center shrink-0 transition"
                              >
                                <FlatIcon name="refresh" className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Tombol Simpan Editan & Sesuaikan Gaya Bicara Otomatis */}
                  <div className="bg-[#f2fce2] border border-[#4d6b14]/25 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#14141f]">
                        Sudah Mengubah Kata di Skrip Atas Sesuai Selera Kamu?
                      </h4>
                      <p className="text-xs font-normal text-slate-700">
                        Klik tombol di samping agar sistem menyimpan revisimu
                        sekaligus mengingat pilihan katamu untuk skrip
                        berikutnya.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isLearningDiff}
                      onClick={handleRunSelfLearningDiff}
                      className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-5 py-3 rounded-xl shrink-0 disabled:opacity-50"
                    >
                      {isLearningDiff
                        ? "Menyimpan..."
                        : "Simpan Perubahan & Ingat Gaya Bahasaku"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              MENU 3: EKSTRAK VIDEO KE SKRIP (TANPA URL, TEKS ASLI VIDEO + PECAHAN PER KERANGKA)
          ================================================================= */}
          {activeMenu === "rewrite" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                  Ekstrak Teks Asli Video & Ubah Jadi Skrip Copywriting Baru
                </h2>
                <p className="text-xs font-normal text-slate-600 mt-1">
                  Unggah video dari HP atau laptopmu. Sistem akan menampilkan
                  teks asli yang ada di dalam video tersebut, lalu membuatkan
                  rekomendasi copywriting baru yang dipecah per kerangka.
                </p>
              </div>

              {/* Kotak Upload File Video / Audio (Tanpa Kolom URL) */}
              <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-[#14141f] bg-[#f4f5f7] rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-2 transition">
                <div className="w-11 h-11 rounded-2xl bg-[#14141f] text-[#d4f34a] flex items-center justify-center">
                  <FlatIcon name="upload" className="w-5 h-5" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#14141f] break-all px-2">
                  {sumberVideo.sedangEkstrakFile
                    ? "Sedang membaca video..."
                    : sumberVideo.namaFileUpload
                      ? `Video Terpilih: ${sumberVideo.namaFileUpload}`
                      : "Klik di Sini untuk Upload File Video / Audio (.mp4, .mov, .mp3)"}
                </div>
                <span className="text-xs font-normal text-slate-500">
                  Sistem otomatis menyalin ucapan/teks asli di dalam video dan
                  menyusun skrip baru per kerangka
                </span>
                <input
                  type="file"
                  accept="video/*,audio/*"
                  onChange={handleFileVideoUpload}
                  className="hidden"
                />
              </label>

              <div>
                <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                  Arah Penulisan Ulang yang Kamu Inginkan (Opsional):
                </label>
                <StoryVoiceInput
                  rows={2}
                  value={sumberVideo.instruksiTambahan}
                  onChange={(val) =>
                    setSumberVideo({ ...sumberVideo, instruksiTambahan: val })
                  }
                  placeholder="Contoh: Ubah menjadi cerita santai sesuai pengalamanku..."
                  onNotify={showToast}
                />
              </div>

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleRewriteVideoAI}
                className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs sm:text-sm py-4 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating && (
                  <FlatIcon name="refresh" className="w-4 h-4 animate-spin" />
                )}
                <span>
                  {isGenerating
                    ? "Sedang Mengekstrak Teks Asli Video & Menyusun Kerangka..."
                    : "Ekstrak Teks Video & Buat Rekomendasi Skrip"}
                </span>
              </button>

              {errorRewriteAI && (
                <div className="p-4 rounded-2xl bg-rose-50 text-xs font-bold text-rose-900">
                  {errorRewriteAI}
                </div>
              )}

              {/* HASIL EKSTRAK VIDEO: 1. TEKS ASLI DI VIDEO -> 2. REKOMENDASI PER KERANGKA */}
              {!isGenerating && hasilRewriteVideo && (
                <div className="space-y-6 pt-4 border-t border-slate-100">
                  {/* 1. Kotak Teks Asli yang Ada di Video */}
                  <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#14141f]">
                        1. Teks Asli yang Ada di Dalam Video:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            hasilRewriteVideo.transkripAsliVideo,
                          )
                          showToast("Teks asli video berhasil disalin!")
                        }}
                        className="cursor-pointer bg-white border border-slate-300 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1"
                      >
                        <FlatIcon name="copy" className="w-3.5 h-3.5" />
                        <span>Salin Teks Asli</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm font-normal text-slate-700 leading-relaxed whitespace-pre-line bg-white p-4 rounded-2xl border border-slate-200">
                      {hasilRewriteVideo.transkripAsliVideo}
                    </p>
                  </div>

                  {/* 2. Rekomendasi Copywriting yang Dipecah Per Kerangka & Bisa Diubah / Generate Ulang */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-[#14141f]">
                          2. Rekomendasi Copywriting Baru (Dipecah Per Kerangka)
                        </h3>
                        <p className="text-xs font-normal text-slate-600">
                          Setiap kerangka di bawah ini bisa kamu ubah langsung
                          kalimatnya atau klik ikon putar di kanan untuk minta
                          variasi baru.
                        </p>
                      </div>

                      <div className="inline-flex bg-[#f4f5f7] p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setModeTampilanRewrite("voiceover")}
                          className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold ${
                            modeTampilanRewrite === "voiceover"
                              ? "bg-[#14141f] text-[#d4f34a]"
                              : "text-slate-600"
                          }`}
                        >
                          Skrip Ngomong
                        </button>
                        <button
                          type="button"
                          onClick={() => setModeTampilanRewrite("teks")}
                          className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold ${
                            modeTampilanRewrite === "teks"
                              ? "bg-[#14141f] text-[#d4f34a]"
                              : "text-slate-600"
                          }`}
                        >
                          Teks di Layar
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      {(hasilRewriteVideo.segmen || []).map((seg, idx) => {
                        const teksAktif =
                          modeTampilanRewrite === "teks"
                            ? seg.teksLayar
                            : seg.voiceover

                        return (
                          <div
                            key={idx}
                            className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-3"
                          >
                            <span className="text-xs font-bold text-[#14141f] bg-[#f4f5f7] px-2.5 py-1 rounded-md inline-block">
                              {seg.labelMini}
                            </span>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                              {/* Kolom Copywriting per Kerangka (Bisa Diedit + Regenerate Ikon) */}
                              <div className="lg:col-span-7 bg-[#d4f34a]/30 border border-[#14141f]/15 rounded-2xl p-4 flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-1.5">
                                  <span className="text-xs font-bold text-[#14141f] block">
                                    {modeTampilanRewrite === "teks"
                                      ? "Teks di Layar (Bisa Diedit):"
                                      : "Kalimat Copywriting (Bisa Diedit):"}
                                  </span>
                                  <textarea
                                    rows={3}
                                    value={teksAktif}
                                    onChange={(e) => {
                                      const valBaru = e.target.value
                                      const listUpdate =
                                        hasilRewriteVideo.segmen.map((s, i) =>
                                          i === idx
                                            ? modeTampilanRewrite === "teks"
                                              ? { ...s, teksLayar: valBaru }
                                              : { ...s, voiceover: valBaru }
                                            : s,
                                        )
                                      setHasilRewriteVideo({
                                        ...hasilRewriteVideo,
                                        segmen: listUpdate,
                                      })
                                    }}
                                    className="w-full bg-white/80 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-normal text-[#14141f] leading-relaxed outline-none focus:bg-white"
                                  />
                                </div>

                                <button
                                  type="button"
                                  disabled={isGenerating}
                                  onClick={() =>
                                    handleRegenerateSegmenVideo(idx, "skrip")
                                  }
                                  title="Generate ulang copywriting kerangka ini"
                                  className="cursor-pointer w-9 h-9 rounded-xl bg-white hover:bg-[#14141f] text-[#14141f] hover:text-[#d4f34a] border border-slate-200 flex items-center justify-center shrink-0 transition"
                                >
                                  <FlatIcon
                                    name="refresh"
                                    className="w-4 h-4"
                                  />
                                </button>
                              </div>

                              {/* Kolom Arahan Visual per Kerangka */}
                              <div className="lg:col-span-5 bg-[#f4f5f7] rounded-2xl p-4 flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-[#14141f] block">
                                    Arahan Adegan Visual
                                  </span>
                                  <p className="text-xs font-normal text-slate-700 leading-relaxed">
                                    {seg.visual}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  disabled={isGenerating}
                                  onClick={() =>
                                    handleRegenerateSegmenVideo(idx, "visual")
                                  }
                                  title="Generate ulang arahan visual kerangka ini"
                                  className="cursor-pointer w-9 h-9 rounded-xl bg-white hover:bg-[#14141f] text-slate-700 hover:text-[#d4f34a] border border-slate-200 flex items-center justify-center shrink-0 transition"
                                >
                                  <FlatIcon
                                    name="refresh"
                                    className="w-4 h-4"
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const waktuSekarang = new Date().toLocaleString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                        const skripSimpan = {
                          id: Date.now(),
                          dbId: null,
                          judul:
                            hasilRewriteVideo.intiPesanVideo ||
                            sumberVideo.namaFileUpload ||
                            "Skrip Hasil Ekstrak Video",
                          kategori: "Hasil Ekstrak Video",
                          bentuk: bentukKontenFinal,
                          waktuDibuat: waktuSekarang,
                          sudahUpload: false,
                          tanggalUpload: "",
                          segmen: hasilRewriteVideo.segmen,
                        }
                        const tersimpan =
                          await simpanAtauUpdateSkripDatabase(skripSimpan)
                        setKoleksiSkripTersimpan((prev) => [tersimpan, ...prev])
                        showToast(
                          "Skrip hasil ekstrak video berhasil disimpan ke daftar skripmu!",
                        )
                      }}
                      className="cursor-pointer w-full bg-[#d4f34a] text-[#14141f] font-bold text-xs sm:text-sm py-4 rounded-2xl"
                    >
                      Simpan ke Daftar Skrip Saya
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              MENU 4 & 5: SKRIP TERSIMPAN & LAPORAN KINERJA VT SEPEKAN
          ================================================================= */}
          {(activeMenu === "tersimpan" || activeMenu === "rapor") && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                {activeMenu === "tersimpan"
                  ? "Daftar Skrip Tersimpan & Status Upload"
                  : "Laporan Kinerja VT Sepekan Setelah Upload"}
              </h2>

              {koleksiSkripTersimpan.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Belum ada skrip yang disimpan.
                </p>
              ) : (
                <div className="space-y-4">
                  {koleksiSkripTersimpan.map((item) => {
                    const inputSaatIni = formKinerja[item.id] || {
                      views: item.views ?? "",
                      likes: item.likes ?? "",
                      komen: item.komen ?? "",
                    }

                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-3xl border border-slate-200 bg-[#f4f5f7] space-y-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <span className="text-xs text-slate-500">
                              Dibuat: <strong>{item.waktuDibuat}</strong> •{" "}
                              {item.bentuk}
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-[#14141f] mt-0.5">
                              {item.judul}
                            </h3>
                          </div>
                          <button
                            onClick={() => {
                              setHasilSkrip(item)
                              setAiOriginalDraft(
                                JSON.parse(JSON.stringify(item.segmen || [])),
                              )
                              setStage(5)
                              setActiveMenu("produksi")
                            }}
                            className="cursor-pointer bg-white border border-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl"
                          >
                            Buka & Edit Skrip
                          </button>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
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
                            <input
                              type="date"
                              value={item.tanggalUpload || ""}
                              onChange={(e) =>
                                handleUbahTanggalUpload(item, e.target.value)
                              }
                              className="bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                            />
                          )}
                        </div>

                        {item.sudahUpload && (
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
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
                                className="bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs"
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
                                className="bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs"
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
                                className="bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleKirimLaporanKinerjaVT(item)
                                }
                                className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold text-xs py-2.5 rounded-xl"
                              >
                                Laporkan Kinerja
                              </button>
                            </div>
                            {item.evaluasiAI && (
                              <div className="bg-[#f4f5f7] p-3 rounded-xl text-xs">
                                <strong>Evaluasi Kinerja:</strong>{" "}
                                {item.evaluasiAI}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              MENU 6: PAKET KOIN & VOUCHER
          ================================================================= */}
          {activeMenu === "topup" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                    Pilih Paket Koin Hookya (Masa Aktif 30 Hari)
                  </h2>
                  <p className="text-xs font-normal text-slate-600 mt-0.5">
                    Pilih paket di bawah untuk membuka halaman pembayaran QRIS /
                    Midtrans, atau klaim kode voucher.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-[#f4f5f7] p-1.5 rounded-2xl border border-slate-200">
                  <input
                    type="text"
                    value={inputKodeVoucherUser}
                    onChange={(e) => setInputKodeVoucherUser(e.target.value)}
                    placeholder="Kode Voucher..."
                    className="bg-white rounded-xl px-3 py-2 text-xs font-bold uppercase outline-none w-40"
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
                      <div className="text-xs font-bold mt-2 text-[#14141f] bg-[#d4f34a] inline-block px-2.5 py-0.5 rounded-md">
                        {p.koin} Koin
                      </div>
                      <p className="text-xs font-normal opacity-80 mt-2">
                        {p.ket}
                      </p>
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

          {/* =================================================================
              MENU 7: DASHBOARD DEVELOPER KOMPLEKS (DILINDUNGI PIN ADMIN)
          ================================================================= */}
          {activeMenu === "devprompt" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              {!isDevUnlocked ? (
                <div className="max-w-sm mx-auto py-10 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#14141f] text-[#d4f34a] flex items-center justify-center mx-auto">
                    <FlatIcon name="lock" className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#14141f]">
                      Area Khusus Developer & Admin
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Masukkan PIN Admin untuk membuka pusat kendali pengguna,
                      transaksi Midtrans/QRIS, dan prompt AI. (PIN Default:
                      123456)
                    </p>
                  </div>
                  <input
                    type="password"
                    value={inputPinDev}
                    onChange={(e) => setInputPinDev(e.target.value)}
                    placeholder="Masukkan PIN Admin..."
                    className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-4 py-3 text-center text-sm font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (inputPinDev === pinAdminResmi) {
                        setIsDevUnlocked(true)
                        showToast("Akses Dashboard Developer dibuka.")
                      } else {
                        alert("PIN Admin tidak sesuai.")
                      }
                    }}
                    className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
                  >
                    Buka Dashboard Developer
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[11px] font-bold bg-[#14141f] text-[#d4f34a] px-3 py-1 rounded-full">
                        DASHBOARD DEVELOPER & ADMIN
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold text-[#14141f] mt-2">
                        Pusat Kendali Bisnis, Midtrans/QRIS, User & Sistem AI
                      </h2>
                    </div>

                    <div className="inline-flex flex-wrap bg-[#f4f5f7] p-1.5 rounded-2xl gap-1">
                      {[
                        { id: "overview", label: "Analitik & Omzet" },
                        {
                          id: "transaksi",
                          label: `Transaksi & Midtrans (${daftarTransaksi.length})`,
                        },
                        {
                          id: "users",
                          label: `Manajemen User (${semuaUserDB.length})`,
                        },
                        { id: "voucher", label: "Voucher Promo" },
                        { id: "prompt", label: "Studio Prompt & JSON" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setDevTab(t.id)}
                          className={`cursor-pointer px-3 py-2 rounded-xl text-xs font-bold transition ${
                            devTab === t.id
                              ? "bg-[#14141f] text-[#d4f34a]"
                              : "text-slate-600 font-normal hover:bg-white"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TAB 1: ANALITIK & OMZET */}
                  {devTab === "overview" && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-[#14141f] text-white">
                        <span className="text-xs text-slate-300">
                          Total Omzet Lunas
                        </span>
                        <div className="text-2xl font-bold text-[#d4f34a] mt-1">
                          Rp{totalOmzetLunas.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200">
                        <span className="text-xs text-slate-500">
                          Total Akun Terdaftar
                        </span>
                        <div className="text-2xl font-bold text-[#14141f] mt-1">
                          {semuaUserDB.length} User
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200">
                        <span className="text-xs text-slate-500">
                          Total Skrip Tersimpan
                        </span>
                        <div className="text-2xl font-bold text-[#14141f] mt-1">
                          {koleksiSkripTersimpan.length} Skrip
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#f2fce2] border border-[#4d6b14]/20">
                        <span className="text-xs text-[#4d6b14]">
                          PIN Admin Saat Ini
                        </span>
                        <input
                          type="text"
                          value={pinAdminResmi}
                          onChange={(e) => setPinAdminResmi(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: TRANSAKSI, QRIS CUSTOM & MIDTRANS */}
                  {devTab === "transaksi" && (
                    <div className="space-y-5">
                      <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-4">
                        <h3 className="text-sm font-bold text-[#14141f]">
                          Konfigurasi Payment Gateway (Midtrans & QRIS Merchant)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold mb-1">
                              Mode Verifikasi Pembayaran:
                            </label>
                            <select
                              value={pengaturanPayment.modeVerifikasi}
                              onChange={(e) =>
                                setPengaturanPayment({
                                  ...pengaturanPayment,
                                  modeVerifikasi: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                            >
                              <option value="manual_admin">
                                Verifikasi Manual Admin (Aman untuk Publik —
                                Tunggu Klik Terima)
                              </option>
                              <option value="otomatis">
                                Otomatis Masuk (Untuk Midtrans Aktif / Mode Uji
                                Coba)
                              </option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1">
                              URL Gambar QRIS Asli Kamu (Opsional):
                            </label>
                            <input
                              type="text"
                              value={pengaturanPayment.qrisImageUrl}
                              onChange={(e) =>
                                setPengaturanPayment({
                                  ...pengaturanPayment,
                                  qrisImageUrl: e.target.value,
                                })
                              }
                              placeholder="https://.../qris-saya.png"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1">
                            Info Rekening Bank / E-Wallet Tujuan:
                          </label>
                          <input
                            type="text"
                            value={pengaturanPayment.infoRekening}
                            onChange={(e) =>
                              setPengaturanPayment({
                                ...pengaturanPayment,
                                infoRekening: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <h3 className="text-sm font-bold text-[#14141f]">
                          Daftar Pesanan Paket Koin
                        </h3>
                        {daftarTransaksi.map((trx) => (
                          <div
                            key={trx.id}
                            className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <strong className="font-bold">
                                {trx.invoice_id} • {trx.nama_user} —{" "}
                                {trx.nama_paket} (+{trx.jumlah_koin} Koin)
                              </strong>
                              <div className="text-slate-500 mt-0.5">
                                Nominal Unik: Rp
                                {Number(trx.nominal_bayar).toLocaleString(
                                  "id-ID",
                                )}{" "}
                                • Metode: {trx.metode_bayar}
                              </div>
                            </div>
                            {trx.status === "pending" ? (
                              <button
                                type="button"
                                onClick={() => handleApproveTransaksiAdmin(trx)}
                                className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold px-4 py-2 rounded-xl"
                              >
                                ✓ Terima & Kirim Koin
                              </button>
                            ) : (
                              <span className="bg-[#f2fce2] text-[#4d6b14] font-bold px-3 py-1 rounded-full">
                                ✓ Lunas
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MANAJEMEN USER */}
                  {devTab === "users" && (
                    <div className="space-y-3">
                      {semuaUserDB.map((u) => (
                        <div
                          key={u.id}
                          className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-sm">{u.nama}</div>
                            <div className="text-slate-500">
                              Kontak: {u.profil_dna?.kontak || "-"} • Peran:{" "}
                              {u.profil_dna?.peranSaatIni || "Kreator"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-bold">
                              {u.koin} Koin
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateKoinDatabase((u.koin || 0) + 100, u.id)
                              }
                              className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold px-3 py-1.5 rounded-xl"
                            >
                              +100 Koin
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateKoinDatabase(
                                  Math.max(0, (u.koin || 0) - 50),
                                  u.id,
                                )
                              }
                              className="cursor-pointer bg-white border border-slate-300 font-bold px-3 py-1.5 rounded-xl"
                            >
                              -50 Koin
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 4: VOUCHER PROMO */}
                  {devTab === "voucher" && (
                    <div className="space-y-4">
                      <div className="bg-[#f4f5f7] p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input
                          type="text"
                          value={voucherBaru.kode}
                          onChange={(e) =>
                            setVoucherBaru({
                              ...voucherBaru,
                              kode: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="Kode (misal: PROMO100)"
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase"
                        />
                        <input
                          type="number"
                          value={voucherBaru.koin}
                          onChange={(e) =>
                            setVoucherBaru({
                              ...voucherBaru,
                              koin: e.target.value,
                            })
                          }
                          placeholder="Bonus Koin"
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                        />
                        <input
                          type="number"
                          value={voucherBaru.kuota}
                          onChange={(e) =>
                            setVoucherBaru({
                              ...voucherBaru,
                              kuota: e.target.value,
                            })
                          }
                          placeholder="Kuota"
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!voucherBaru.kode.trim()) return
                            setDaftarVoucher([
                              {
                                kode: voucherBaru.kode.trim().toUpperCase(),
                                koin: parseInt(voucherBaru.koin) || 100,
                                kuota: parseInt(voucherBaru.kuota) || 25,
                                terpakai: 0,
                              },
                              ...daftarVoucher,
                            ])
                            setVoucherBaru({
                              kode: "",
                              koin: "100",
                              kuota: "25",
                            })
                            showToast("Voucher berhasil ditambahkan!")
                          }}
                          className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold py-2.5 rounded-xl"
                        >
                          + Buat Voucher
                        </button>
                      </div>

                      {daftarVoucher.map((v, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-[#f4f5f7] border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <span>
                            <strong>{v.kode}</strong> (+{v.koin} Koin • Terpakai{" "}
                            {v.terpakai}/{v.kuota})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setDaftarVoucher(
                                daftarVoucher.filter((_, idx) => idx !== i),
                              )
                            }
                            className="cursor-pointer text-rose-600 font-bold"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 5: STUDIO PROMPT & INSPEKTUR JSON (KHUSUS DEVELOPER) */}
                  {devTab === "prompt" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold mb-1">
                          1. Instruksi Sistem Analisis Gaya Bicara (Persona
                          Engine):
                        </label>
                        <textarea
                          rows={2}
                          value={customPrompts.persona_engine}
                          onChange={(e) =>
                            setCustomPrompts({
                              ...customPrompts,
                              persona_engine: e.target.value,
                            })
                          }
                          className="w-full bg-[#f4f5f7] border border-slate-200 rounded-2xl p-3 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">
                          2. Instruksi Sistem Asesmen 4 Tahap (Co-Pilot):
                        </label>
                        <textarea
                          rows={2}
                          value={customPrompts.assessment_copilot}
                          onChange={(e) =>
                            setCustomPrompts({
                              ...customPrompts,
                              assessment_copilot: e.target.value,
                            })
                          }
                          className="w-full bg-[#f4f5f7] border border-slate-200 rounded-2xl p-3 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">
                          3. Instruksi Sistem Penyusun Skrip Natural:
                        </label>
                        <textarea
                          rows={2}
                          value={customPrompts.script_humanizer}
                          onChange={(e) =>
                            setCustomPrompts({
                              ...customPrompts,
                              script_humanizer: e.target.value,
                            })
                          }
                          className="w-full bg-[#f4f5f7] border border-slate-200 rounded-2xl p-3 text-xs"
                        />
                      </div>

                      {/* JSON Mentah hanya ditampilkan di dalam ruang Developer ini */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold mb-1">
                          Inspektur JSON Internal (`persona_profile.json` &
                          `content_brief.json` — Hanya Terlihat oleh Developer):
                        </label>
                        <pre className="bg-[#14141f] text-[#d4f34a] p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-60">
                          {JSON.stringify(
                            { personaProfile, contentBrief },
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      simpanPersonaKeSupabase(personaProfile)
                      showToast(
                        "Seluruh pengaturan Developer disimpan ke Database!",
                      )
                    }}
                    className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-4 rounded-2xl"
                  >
                    Simpan Pengaturan Developer ke Database
                  </button>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* =====================================================================
          MODAL LOGIN / REGISTER AKUN MULTI-USER
      ===================================================================== */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#14141f] w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold">
                {authMode === "login"
                  ? "Masuk ke Akun Hookya"
                  : "Daftar Akun Kreator Baru (+50 Koin Gratis)"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="cursor-pointer w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#f4f5f7] p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`cursor-pointer py-2 rounded-xl text-xs font-bold ${
                  authMode === "login"
                    ? "bg-[#14141f] text-[#d4f34a]"
                    : "text-slate-600"
                }`}
              >
                Masuk Akun
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`cursor-pointer py-2 rounded-xl text-xs font-bold ${
                  authMode === "register"
                    ? "bg-[#14141f] text-[#d4f34a]"
                    : "text-slate-600"
                }`}
              >
                Daftar Akun Baru
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">
                  Nama Panggilan:
                </label>
                <input
                  type="text"
                  value={authForm.nama}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, nama: e.target.value })
                  }
                  placeholder="Contoh: Rina / Budi"
                  className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  Email / No. WhatsApp:
                </label>
                <input
                  type="text"
                  value={authForm.kontak}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, kontak: e.target.value })
                  }
                  placeholder="Contoh: 0812xxxx / email@gmail.com"
                  className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  PIN 4 Angka / Kata Sandi:
                </label>
                <input
                  type="password"
                  value={authForm.pin}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, pin: e.target.value })
                  }
                  placeholder="Contoh: 1234"
                  className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleProsesAuthUser}
              className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl"
            >
              {authMode === "login"
                ? "Masuk Sekarang ➔"
                : "Buat Akun & Klaim 50 Koin Pertama ➔"}
            </button>
          </div>
        </div>
      )}

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
                onClick={() => setCheckoutModal(null)}
                className="cursor-pointer w-1/3 bg-[#f4f5f7] font-bold text-xs py-3 rounded-xl"
              >
                Batal
              </button>
              <button
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
