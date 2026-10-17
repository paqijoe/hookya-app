"use client"
import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"

// ============================================================================
// 1. KOMPONEN FLAT DESIGN ICON (SVG)
// ============================================================================
function FlatIcon({ name, className = "w-5 h-5" }) {
  const icons = {
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    grid: (
      <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
    ),
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
    trash: <path d="M3 6h18M8 6V4h8v2m-9 0v14h10V6" />,
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
      {icons[name] || icons.grid}
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
    if (onNotify)
      onNotify("Silakan bicara, Sistem AI sedang mendengarkan suara Anda.")

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
        title="Rekam suara menjadi teks"
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
      <label className="block text-xs font-bold text-[#14141f] tracking-tight">
        {label}
      </label>
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
// 4. EKSTRAKTOR FRAME VIDEO DENGAN BATAS WAKTU AMAN
// ============================================================================
function ekstrakFrameDariFileVideoAman(file, jumlahFrame = 3) {
  return new Promise((resolve) => {
    let sudahSelesai = false
    const selesaikan = (hasil) => {
      if (!sudahSelesai) {
        sudahSelesai = true
        resolve(hasil)
      }
    }

    const timerBatas = setTimeout(() => {
      selesaikan([])
    }, 2500)

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
          const durasi = Math.min(video.duration || 3, 30)
          const lebar = 360
          const tinggi =
            Math.round((video.videoHeight / (video.videoWidth || 1)) * lebar) ||
            240
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
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.6)
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
        } catch {
          // Abaikan
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
// 6. GENERATOR 10 REFERENSI IDE TOPIK AWAL BERDASARKAN PROFIL USER
// ============================================================================
function susun10IdeTopikDariProfil(profil, kategori) {
  const minatList = (profil.minatUtama || "Keseharian, Edukasi, Hobi")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const m1 = minatList[0] || "Kegiatan Harian"
  const m2 = minatList[1] || m1
  const peran = profil.peranSaatIni || "Kreator"

  if (kategori === "affiliate") {
    return [
      {
        judul: `Rekomendasi Perlengkapan ${m1} Paling Awet`,
        nuansa: "Review Jujur & Fungsional",
        ringkasan: `Membahas barang andalan yang mempermudah aktivitas ${m1.toLowerCase()} setiap hari.`,
      },
      {
        judul: `Barang Penyelamat Waktu bagi ${peran}`,
        nuansa: "Solusi Masalah Harian",
        ringkasan: `Menunjukkan produk praktis yang menghemat tenaga di sela kesibukan.`,
      },
      {
        judul: `3 Alat Wajib di ${profil.lingkunganRekam.split(" /")[0]}`,
        nuansa: "Rekomendasi Terkurasi",
        ringkasan: `Merangkum produk terbaik yang selalu dipakai saat beraktivitas.`,
      },
      {
        judul: `Jangan Salah Beli Perlengkapan ${m2}, Cek Ini Dulu`,
        nuansa: "Edukasi Sebelum Membeli",
        ringkasan: `Membantu penonton memilih produk berkualitas agar tidak rugi.`,
      },
      {
        judul: `Unboxing & Tes Pemakaian Langsung Produk ${m1}`,
        nuansa: "Pembuktian Kualitas",
        ringkasan: `Memperlihatkan detail bahan dan hasil pemakaian nyata secara jujur.`,
      },
      {
        judul: `Solusi Hemat untuk Pemula di Bidang ${m1}`,
        nuansa: "Rekomendasi Ramah Kantong",
        ringkasan: `Alternatif produk terjangkau dengan fungsi yang tetap maksimal.`,
      },
      {
        judul: `Kesalahan Saat Memilih Produk ${m2} & Solusinya`,
        nuansa: "Tips & Rekomendasi",
        ringkasan: `Mengedukasi penonton sekaligus mengarahkan ke produk yang tepat.`,
      },
      {
        judul: `Rutinitas ${profil.waktuFree.split(" (")[0]} Lebih Nyaman dengan Alat Ini`,
        nuansa: "Storytelling Keseharian",
        ringkasan: `Menyelipkan produk secara halus di dalam cerita aktivitas harian.`,
      },
      {
        judul: `Perbandingan Produk Murah vs Berkualitas untuk ${m1}`,
        nuansa: "Bedah Kualitas",
        ringkasan: `Menjelaskan alasan mengapa produk pilihanmu jauh lebih layak dibeli.`,
      },
      {
        judul: `Satu Barang Kecil yang Mengubah Cara Kerjaku`,
        nuansa: "Pengalaman Pribadi",
        ringkasan: `Cerita singkat perubahan sebelum dan sesudah memakai produk.`,
      },
    ]
  }

  return [
    {
      judul: `Cara Mengatur Waktu antara ${m1} dan Rutinitas ${peran}`,
      nuansa: "Tips Praktis & Pengalaman Nyata",
      ringkasan: `Berbagi trik membagi waktu agar semua kegiatan tetap berjalan seimbang.`,
    },
    {
      judul: `3 Kesalahan Pemula Saat Memulai ${m1}`,
      nuansa: "Edukasi & Tutorial Singkat",
      ringkasan: `Membantu penonton menghindari kesalahan umum berdasarkan pengalamanmu.`,
    },
    {
      judul: `Rutinitas Tenang di ${profil.waktuFree.split(" (")[0]} Setelah Seharian Beraktivitas`,
      nuansa: "Storytelling Keseharian",
      ringkasan: `Menampilkan suasana keseharian yang jujur dan dekat dengan kehidupan penonton.`,
    },
    {
      judul: `Hal yang Baru Aku Sadari di Usia ${profil.usia} Tahun sebagai ${peran}`,
      nuansa: "Refleksi & Cerita Relatable",
      ringkasan: `Cerita reflektif yang memancing penonton seusia untuk ikut berbagi di komentar.`,
    },
    {
      judul: `Cara Tetap Konsisten ${m2} Meski Sering Lelah`,
      nuansa: "Tips Praktis & Pengalaman Nyata",
      ringkasan: `Langkah sederhana menjaga konsistensi tanpa merasa terbebani.`,
    },
    {
      judul: `Persiapan Sederhana Sebelum Mulai ${m1} Setiap Hari`,
      nuansa: "Storytelling Keseharian",
      ringkasan: `Memperlihatkan kebiasaan kecil yang membuat hari lebih terarah.`,
    },
    {
      judul: `Mitos vs Fakta Seputar ${m1} yang Sering Disalahpahami`,
      nuansa: "Edukasi & Tutorial Singkat",
      ringkasan: `Meluruskan anggapan keliru dengan penjelasan yang ringan dan santai.`,
    },
    {
      judul: `Suka Duka Menjalani Peran sebagai ${peran}`,
      nuansa: "Refleksi & Cerita Relatable",
      ringkasan: `Mengangkat sisi manusiawi dari keseharianmu yang jarang diketahui orang.`,
    },
    {
      judul: `Tips Mengatasi Rasa Jenuh Saat Menekuni ${m2}`,
      nuansa: "Tips Praktis & Pengalaman Nyata",
      ringkasan: `Cara mengembalikan semangat ketika motivasi sedang turun.`,
    },
    {
      judul: `Satu Kebiasaan Kecil yang Paling Berdampak di Hidupku`,
      nuansa: "Storytelling Keseharian",
      ringkasan: `Menceritakan perubahan positif dari langkah kecil yang dilakukan rutin.`,
    },
  ]
}

// ============================================================================
// 7. APLIKASI UTAMA HOOKYA
// ============================================================================
export default function HookyaApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopMinimized, setDesktopMinimized] = useState(false)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [activeMenu, setActiveMenu] = useState("topup")

  // === STATE DATABASE & PROSES SISTEM AI ===
  const [userId, setUserId] = useState(null)
  const [dbConnected, setDbConnected] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingOpsi, setIsLoadingOpsi] = useState(false)
  const [isLoadingIdeTopik, setIsLoadingIdeTopik] = useState(false)
  const [errorAsesmenAI, setErrorAsesmenAI] = useState("")
  const [errorRewriteAI, setErrorRewriteAI] = useState("")
  const abortControllerRef = useRef(null)
  const sliderIdeRef = useRef(null)

  const [coins, setCoins] = useState(120)
  const [paket, setPaket] = useState("Paket Pemula")
  const [toastMsg, setToastMsg] = useState("")

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 3500)
  }

  // === STATE PROFIL & DNA ===
  const [profil, setProfil] = useState({
    nama: "Hani",
    usia: "28",
    gender: "Perempuan",
    peranSaatIni: "Ibu / Bapak Rumah Tangga",
    kepribadianSosial:
      "Ambivert (Santai kalau sudah kenal, tapi malas tampil berlebihan)",
    minatUtama: "Mengajar, Edukasi Anak, Menyusui & Rumah Tangga",
    lingkunganRekam: "Kamar / Meja Kerja di Dalam Ruangan",
    waktuFree: "Malam (20:00 - 21:30)",
    hambatanUtama: "Malas / Belum Lancar Ngomong Panjang di Depan Kamera",
    ceritaBebasProfil: "",
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

  const [bentukKonten, setBentukKonten] = useState(
    SEPULUH_BENTUK_KONTEN[6].nama,
  )
  const [deskripsiBentukSendiri, setDeskripsiBentukSendiri] = useState("")

  const bentukKontenFinal = deskripsiBentukSendiri.trim()
    ? `${bentukKonten} — Catatan: ${deskripsiBentukSendiri.trim()}`
    : bentukKonten

  // === STATE WIZARD SKRIP & 10 REFERENSI IDE TOPIK SLIDER ===
  const [kategoriKonten, setKategoriKonten] = useState("personal")
  const [step, setStep] = useState(1)
  const [daftar10IdeTopik, setDaftar10IdeTopik] = useState(() =>
    susun10IdeTopikDariProfil(
      {
        nama: "Hani",
        usia: "28",
        peranSaatIni: "Ibu / Bapak Rumah Tangga",
        minatUtama: "Mengajar, Edukasi Anak, Menyusui & Rumah Tangga",
        lingkunganRekam: "Kamar / Meja Kerja di Dalam Ruangan",
        waktuFree: "Malam (20:00 - 21:30)",
      },
      "personal",
    ),
  )

  useEffect(() => {
    setDaftar10IdeTopik(susun10IdeTopikDariProfil(profil, kategoriKonten))
  }, [profil.minatUtama, profil.peranSaatIni, kategoriKonten])

  const [kontenPersonal, setKontenPersonal] = useState({
    topik: "",
    jenisCerita: "Tips Praktis & Pengalaman Nyata",
    intiPesan: "",
  })

  const [produk, setProduk] = useState({
    nama: "",
    brand: "",
    harga: "",
    promo: "",
    keunggulan: "",
  })

  const [jawaban, setJawaban] = useState({
    audiens: "",
    masalah: "",
    hook: "",
    tone: "",
    format: "",
  })
  const [ceritaAsesmen, setCeritaAsesmen] = useState("")

  const [pertanyaanDinamisAI, setPertanyaanDinamisAI] = useState("")
  const [opsiDinamisAI, setOpsiDinamisAI] = useState([])

  // === STATE HASIL SKRIP & KOLEKSI TERSIMPAN ===
  const [modeTampilanSkrip, setModeTampilanSkrip] = useState("voiceover")
  const [hasilSkrip, setHasilSkrip] = useState(null)
  const [targetKonversiBentuk, setTargetKonversiBentuk] = useState(
    SEPULUH_BENTUK_KONTEN[9].nama,
  )
  const [modeTeleprompter, setModeTeleprompter] = useState(false)

  const [koleksiSkripTersimpan, setKoleksiSkripTersimpan] = useState([])
  const [formKinerja, setFormKinerja] = useState({})

  // === STATE EKSTRAK VIDEO ===
  const [sumberVideo, setSumberVideo] = useState({
    urlAtauNama: "",
    transkripAsli: "",
    instruksiTambahan: "",
    framesBase64: [],
    fileBase64: "",
    fileMimeType: "",
    namaFileUpload: "",
    sedangEkstrakFile: false,
  })
  const [hasilRewriteVideo, setHasilRewriteVideo] = useState(null)

  // ============================================================================
  // 8. STATE SISTEM PEMBAYARAN (CHECKOUT MODAL, INVOICE & PENGATURAN PAYMENT DEV)
  // ============================================================================
  const [checkoutModal, setCheckoutModal] = useState(null) // Menyimpan detail invoice yang sedang dibuka
  const [metodeBayarPilihan, setMetodeBayarPilihan] = useState(
    "QRIS Instan (Semua E-Wallet & M-Banking)",
  )
  const [sedangProsesBayar, setSedangProsesBayar] = useState(false)
  const [daftarTransaksi, setDaftarTransaksi] = useState([])

  // Pengaturan Pembayaran yang bisa diubah di Dashboard Developer
  const [pengaturanPayment, setPengaturanPayment] = useState({
    modeVerifikasi: "otomatis", // 'otomatis' (langsung masuk saat klik konfirmasi) atau 'manual_admin' (menunggu klik Terima dari Developer)
    namaMerchant: "HOOKYA AI PRODUCER",
    infoRekening: "BCA 8410-xxxx-xx / SeaBank / GoPay / Dana a.n Admin Hookya",
    catatanCheckout:
      "Pastikan transfer tepat hingga 3 digit terakhir agar sistem mengenali pembayaranmu secara instan.",
  })

  // === STATE DASHBOARD DEVELOPER ===
  const [devTab, setDevTab] = useState("transaksi") // 'overview', 'transaksi', 'users', 'voucher', 'prompt'
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
    asesmen:
      "Pastikan setiap pertanyaan dan 5 pilihan jawaban selalu mengacu langsung pada Topik Spesifik yang diketik user serta pilihan di langkah sebelumnya.",
    skrip:
      "Gunakan bahasa lisan Indonesia yang mengalir alami dan manusiawi. Pastikan arahan visual menceritakan adegan secara konkret mengikuti kalimat skrip.",
    rewrite:
      "Bedah struktur pesan utama dari video referensi, lalu tulis ulang 100% baru sesuai sudut pandang kreator.",
  })

  // ============================================================================
  // 9. SINKRONISASI SUPABASE (USERS, SCRIPTS, & TRANSACTIONS)
  // ============================================================================
  const muatUlangDataSupabase = async () => {
    try {
      const { data: userRows, error: userErr } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true })

      if (!userErr && userRows) {
        setSemuaUserDB(userRows)
        let activeUser = userRows[0]
        if (!activeUser) {
          const { data: newUser } = await supabase
            .from("users")
            .insert([
              {
                nama: profil.nama,
                koin: 120,
                profil_dna: {
                  ...profil,
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
          setCoins(activeUser.koin ?? 120)
          if (activeUser.profil_dna) {
            setProfil((prev) => ({
              ...prev,
              ...activeUser.profil_dna,
              nama: activeUser.nama || prev.nama,
            }))
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
      }

      // Muat Skrip Tersimpan
      const { data: scriptRows } = await supabase
        .from("scripts")
        .select("*")
        .order("created_at", { ascending: false })

      if (scriptRows) {
        const terformat = scriptRows.map((row) => {
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
            bentuk: row.bentuk_konten || SEPULUH_BENTUK_KONTEN[0].nama,
            createdAtISO: row.created_at,
            waktuDibuat: waktuDibuatStr,
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

      // Muat Riwayat Transaksi Pembayaran
      const { data: trxRows } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })

      if (trxRows) {
        setDaftarTransaksi(trxRows)
      }
    } catch {
      setDbConnected(false)
    }
  }

  useEffect(() => {
    muatUlangDataSupabase()
  }, [])

  const updateKoinDatabase = async (koinBaru, targetUserId = userId) => {
    if (targetUserId === userId) {
      setCoins(koinBaru)
    }
    setSemuaUserDB((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, koin: koinBaru } : u)),
    )
    if (!targetUserId) return
    await supabase
      .from("users")
      .update({ koin: koinBaru })
      .eq("id", targetUserId)
  }

  const handleSimpanProfilDatabase = async () => {
    if (userId) {
      await supabase
        .from("users")
        .update({
          nama: profil.nama,
          profil_dna: {
            ...profil,
            bentukKonten,
            deskripsiBentukSendiri,
            customPrompts,
            daftarVoucher,
            pengaturanPayment,
          },
        })
        .eq("id", userId)
    }
    showToast("Data dan pengaturan berhasil disimpan ke Database.")
  }

  // ============================================================================
  // 10. LOGIKA CHECKOUT & SISTEM PEMBAYARAN (QRIS, KODE UNIK, MIDTRANS, APPROVAL)
  // ============================================================================
  const bukaLayarCheckoutPaket = async (paketObj) => {
    const kodeUnik = Math.floor(101 + Math.random() * 890) // 3 digit kode unik (101 - 990)
    const nominalTagihan = paketObj.nominalAngka + kodeUnik
    const nomorInvoice = `INV-${Date.now().toString().slice(-6)}`

    // Cek apakah Midtrans Server Key aktif di backend
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
      // Lanjut dengan modal checkout internal
    }

    setCheckoutModal({
      invoiceId: nomorInvoice,
      namaPaket: paketObj.nama,
      hargaTeks: paketObj.harga,
      koin: paketObj.koin,
      nominalAsli: paketObj.nominalAngka,
      kodeUnik,
      nominalBayar: nominalTagihan,
      waktuDibuat: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
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
      nama_user: profil.nama || "Kreator",
      nama_paket: checkoutModal.namaPaket,
      jumlah_koin: checkoutModal.koin,
      nominal_asli: checkoutModal.nominalAsli,
      nominal_bayar: checkoutModal.nominalBayar,
      metode_bayar: metodeBayarPilihan,
      status: statusAwal,
    }

    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert([trxBaru])
        .select()
        .single()

      const itemMasuk = data || {
        ...trxBaru,
        id: Date.now(),
        created_at: new Date().toISOString(),
      }

      setDaftarTransaksi([itemMasuk, ...daftarTransaksi])

      if (statusAwal === "lunas") {
        await updateKoinDatabase(coins + checkoutModal.koin)
        setPaket(checkoutModal.namaPaket)
        showToast(
          `Pembayaran ${checkoutModal.invoiceId} terverifikasi! +${checkoutModal.koin} Koin berhasil masuk.`,
        )
      } else {
        showToast(
          `Konfirmasi pembayaran ${checkoutModal.invoiceId} diterima! Menunggu verifikasi Admin di Dashboard Developer.`,
        )
      }

      if (error) {
        // Tetap aman jika tabel transactions belum dibuat di Supabase
        if (statusAwal === "lunas") {
          await updateKoinDatabase(coins + checkoutModal.koin)
        }
      }
    } catch {
      // Fallback
    } finally {
      setSedangProsesBayar(false)
      setCheckoutModal(null)
    }
  }

  // Fungsi Admin/Developer menyetujui pembayaran Pending menjadi Lunas (+Koin otomatis masuk ke user)
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

    // Cari user pemilik transaksi dan tambahkan koinnya
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
    showToast(
      `Transaksi ${trx.invoice_id} disetujui! +${trx.jumlah_koin} Koin telah dikirim ke ${trx.nama_user}.`,
    )
  }

  // ============================================================================
  // 11. FUNGSI SKRIP, ASESMEN, VIDEO & KINERJA VT
  // ============================================================================
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

        if (data?.id) {
          return { ...skripObj, id: data.id, dbId: data.id }
        }
      }
    } catch {
      // Fallback
    }
    return skripObj
  }

  const handleGenerate10IdeTopikAI = async () => {
    setIsLoadingIdeTopik(true)
    showToast(
      "Sistem AI sedang meracik 10 referensi ide topik sesuai profilmu...",
    )
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "buat_10_ide_topik",
          profil,
          kategoriKonten,
        }),
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.ideTopik) && data.ideTopik.length > 0) {
        setDaftar10IdeTopik(data.ideTopik.slice(0, 10))
        showToast("10 referensi ide topik baru berhasil dimuat.")
      } else {
        throw new Error(data.error || "Gagal memuat ide topik")
      }
    } catch (err) {
      showToast("Info Sistem AI: " + err.message)
    } finally {
      setIsLoadingIdeTopik(false)
    }
  }

  const geserSliderIde = (arah) => {
    if (!sliderIdeRef.current) return
    const jarak = arah === "kiri" ? -320 : 320
    sliderIdeRef.current.scrollBy({ left: jarak, behavior: "smooth" })
  }

  const isPersonal = kategoriKonten === "personal"
  const dapatkanSubyekAktif = (topikOverride) => {
    if (topikOverride) return topikOverride
    return isPersonal
      ? kontenPersonal.topik.trim() || "Topik Konten Pilihan"
      : `${produk.nama.trim() || "Produk"} (${produk.brand.trim() || "Brand"})`
  }

  const panggilAsesmenAI = async (
    tahapTarget,
    jawabanTerbaru,
    topikOverride = "",
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    const subyekSekarang = dapatkanSubyekAktif(topikOverride)

    setStep(tahapTarget)
    setCeritaAsesmen("")
    setErrorAsesmenAI("")
    setPertanyaanDinamisAI("")
    setOpsiDinamisAI([])
    setIsLoadingOpsi(true)

    const namaFokusTahap =
      tahapTarget === 2
        ? "Menentukan Karakteristik Target Penonton Spesifik"
        : tahapTarget === 3
          ? "Menggali Masalah atau Keresahan Paling Nyata dari Penonton Tersebut"
          : tahapTarget === 4
            ? "Merancang Kalimat Pembuka 3 Detik Pertama (Hook) yang Menjawab Masalah Tadi"
            : tahapTarget === 5
              ? "Menentukan Gaya Bahasa & Pembawaan Emosi"
              : "Memilih Struktur Alur Penyajian Video"

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          action: "buat_opsi_asesmen",
          profil,
          bentukKonten: bentukKontenFinal,
          kategoriKonten,
          subyek: subyekSekarang,
          detailInput: isPersonal ? kontenPersonal : produk,
          jawaban: jawabanTerbaru,
          tahapAsesmen: namaFokusTahap,
          customPrompts,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat analisis Sistem AI")
      }

      setPertanyaanDinamisAI(
        data.pertanyaanAI ||
          `Pilih pendekatan yang paling sesuai untuk topik "${subyekSekarang}":`,
      )
      setOpsiDinamisAI(Array.isArray(data.opsi) ? data.opsi : [])
    } catch (err) {
      if (err.name !== "AbortError") {
        setErrorAsesmenAI(
          err.message ||
            "Koneksi sedang lambat. Silakan klik tombol Muat Ulang.",
        )
      }
    } finally {
      setIsLoadingOpsi(false)
    }
  }

  const handleGenerateSkripAI = async (formatTerpilih) => {
    if (coins < 1) {
      alert("Saldo Koin kamu tidak mencukupi. Silakan isi ulang koin.")
      setActiveMenu("topup")
      return
    }

    const finalFormat =
      formatTerpilih || jawaban.format || "Alur Cerita Mengalir"
    const jawabanLengkap = { ...jawaban, format: finalFormat }
    setJawaban(jawabanLengkap)
    setCeritaAsesmen("")

    const infoBentuk = SEPULUH_BENTUK_KONTEN.find(
      (b) => b.nama === bentukKonten,
    )
    if (infoBentuk) setModeTampilanSkrip(infoBentuk.modeDefault)

    const subyekSekarang = dapatkanSubyekAktif()
    setIsGenerating(true)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "buat_skrip_utuh",
          profil,
          bentukKonten: bentukKontenFinal,
          kategoriKonten,
          subyek: subyekSekarang,
          detailInput: isPersonal ? kontenPersonal : produk,
          jawaban: jawabanLengkap,
          customPrompts,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menghubungi Sistem AI")

      await updateKoinDatabase(coins - 1)

      const waktuSekarang = new Date().toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      const skripBaru = {
        id: Date.now(),
        dbId: null,
        judul: subyekSekarang,
        kategori: isPersonal
          ? "Konten Kreator & Personal Branding"
          : "Konten Promosi & Affiliate",
        bentuk: bentukKontenFinal,
        createdAtISO: new Date().toISOString(),
        waktuDibuat: waktuSekarang,
        sudahUpload: false,
        tanggalUpload: "",
        views: null,
        likes: null,
        komen: null,
        sudahEvaluasi: false,
        evaluasiAI: "",
        segmen: data.segmen || [],
      }

      const skripTersimpanDB = await simpanAtauUpdateSkripDatabase(skripBaru)
      setHasilSkrip(skripTersimpanDB)
      setKoleksiSkripTersimpan((prev) => [skripTersimpanDB, ...prev])
      setStep(7)
      showToast(
        "Skrip selesai diracik dan otomatis tercatat di daftar skripmu.",
      )
    } catch (err) {
      showToast("Info Sistem AI: " + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKonversiBentukKontenLain = async () => {
    if (!hasilSkrip || isGenerating) return
    setIsGenerating(true)
    showToast(
      `Sistem AI sedang mengubah skrip ke format "${targetKonversiBentuk}"...`,
    )

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ubah_bentuk_konten",
          profil,
          subyek: hasilSkrip.judul,
          skripSebelumnya: hasilSkrip.segmen,
          bentukKontenBaru: targetKonversiBentuk,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengubah bentuk konten")

      const infoTarget = SEPULUH_BENTUK_KONTEN.find(
        (b) => b.nama === targetKonversiBentuk,
      )
      if (infoTarget) setModeTampilanSkrip(infoTarget.modeDefault)

      const skripDiperbarui = {
        ...hasilSkrip,
        bentuk: targetKonversiBentuk,
        segmen: data.segmen || hasilSkrip.segmen,
      }

      setBentukKonten(targetKonversiBentuk)
      setHasilSkrip(skripDiperbarui)
      await simpanAtauUpdateSkripDatabase(skripDiperbarui)
      setKoleksiSkripTersimpan((prev) =>
        prev.map((s) => (s.id === skripDiperbarui.id ? skripDiperbarui : s)),
      )
      showToast("Bentuk konten berhasil diperbarui.")
    } catch (err) {
      showToast("Info Sistem AI: " + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegeneratePerBagian = async (indexBaris, fokusTarget) => {
    if (!hasilSkrip || isGenerating) return
    const segmenLama = hasilSkrip.segmen[indexBaris]

    setIsGenerating(true)
    showToast(`Sistem AI sedang memperbarui ${segmenLama.labelMini}...`)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate_segmen",
          profil,
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
      setKoleksiSkripTersimpan((prev) =>
        prev.map((s) => (s.id === skripDiperbarui.id ? skripDiperbarui : s)),
      )
      showToast("Bagian skrip berhasil diperbarui.")
    } catch (err) {
      showToast("Info Sistem AI: " + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

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
      if (file.type.startsWith("video/")) {
        const frames = await ekstrakFrameDariFileVideoAman(file, 3)
        setSumberVideo((prev) => ({
          ...prev,
          framesBase64: frames,
          sedangEkstrakFile: false,
        }))
        showToast(`File "${file.name}" siap diekstrak oleh Sistem AI.`)
      } else {
        const reader = new FileReader()
        reader.onload = () => {
          const resultStr = reader.result || ""
          const base64Clean = resultStr.toString().split(",")[1] || ""
          setSumberVideo((prev) => ({
            ...prev,
            fileBase64: base64Clean,
            fileMimeType: file.type || "audio/mp3",
            sedangEkstrakFile: false,
          }))
          showToast(`File audio "${file.name}" siap diekstrak.`)
        }
        reader.onerror = () => {
          setSumberVideo((prev) => ({ ...prev, sedangEkstrakFile: false }))
        }
        reader.readAsDataURL(file)
      }
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
    if (
      !sumberVideo.namaFileUpload &&
      !sumberVideo.urlAtauNama.trim() &&
      !sumberVideo.transkripAsli.trim()
    ) {
      setErrorRewriteAI(
        "Silakan pilih file video/audio, tempel tautan URL, atau tuliskan catatan isi video terlebih dahulu.",
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
          profil,
          namaFileVideo: sumberVideo.namaFileUpload,
          urlReferensi: sumberVideo.urlAtauNama.trim(),
          teksReferensi: sumberVideo.transkripAsli.trim(),
          detailInput: sumberVideo.instruksiTambahan.trim(),
          framesBase64: sumberVideo.framesBase64,
          mediaBase64: sumberVideo.fileBase64,
          mediaMimeType: sumberVideo.fileMimeType,
          customPrompts,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses ekstraksi video")
      }

      await updateKoinDatabase(coins - 2)
      setHasilRewriteVideo({
        transkripTerdeteksi:
          data.transkripTerdeteksi ||
          "Berhasil mengekstrak struktur pesan dari video referensi.",
        copywritingBaru:
          data.copywritingBaru ||
          "Naskah copywriting orisinil berhasil disusun.",
        segmen: Array.isArray(data.segmen) ? data.segmen : [],
      })
      showToast("Ekstraksi video & pembuatan copywriting orisinil selesai!")
    } catch (err) {
      setErrorRewriteAI(
        err.message ||
          "Terjadi kendala saat menghubungi Sistem AI. Silakan klik tombol sekali lagi.",
      )
    } finally {
      setIsGenerating(false)
    }
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
        "Status upload dicatat. Sistem akan mengingatkan evaluasi kinerja sepekan setelah tanggal upload.",
      )
    }
  }

  const handleUbahTanggalUpload = async (item, tglBaru) => {
    const updated = {
      ...item,
      sudahUpload: true,
      tanggalUpload: tglBaru,
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
    showToast("Sistem AI sedang mengevaluasi kinerja mingguan kontenmu...")

    let catatanEvaluasi = `Dalam sepekan, konten ini meraih ${views} views, ${likes} like, dan ${komen} komentar. Data interaksi telah disimpan untuk mempertajam pembuatan skrip berikutnya.`

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluasi_kinerja_vt",
          profil,
          subyek: item.judul,
          dataKinerja: {
            waktuDibuat: item.waktuDibuat,
            tanggalUpload: item.tanggalUpload,
            views,
            likes,
            komen,
          },
        }),
      })
      const data = await res.json()
      if (res.ok && data.evaluasiAI) {
        catatanEvaluasi = data.evaluasiAI
      }
    } catch {
      // Abaikan
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
    if (!item.sudahEvaluasi) {
      await updateKoinDatabase(coins + 2)
    }
    setIsGenerating(false)
    showToast("Laporan kinerja konten disimpan dan bonus +2 Koin ditambahkan.")
  }

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
        teks: `Evaluasi sepekan telah selesai dilaporkan`,
        warna: "bg-[#f2fce2] text-[#4d6b14]",
      }
    }
    if (selisihHari <= 0) {
      return {
        teks: `Pengingat Sepekan: Konten ini sudah melewati 7 hari sejak diupload (${labelTarget}). Yuk isi jumlah views, like, dan komentar!`,
        warna: "bg-[#fff0e6] text-[#d97736]",
      }
    }
    return {
      teks: `Jadwal Evaluasi Sepekan: ${labelTarget} (${selisihHari} hari lagi sejak upload)`,
      warna: "bg-[#f0eeff] text-[#5b4bc4]",
    }
  }

  const handleKlaimVoucherUser = async () => {
    const kodeBersih = inputKodeVoucherUser.trim().toUpperCase()
    if (!kodeBersih) return

    const ditemukan = daftarVoucher.find(
      (v) => v.kode.toUpperCase() === kodeBersih,
    )
    if (!ditemukan) {
      alert("Kode voucher tidak ditemukan atau sudah tidak berlaku.")
      return
    }
    if (ditemukan.terpakai >= ditemukan.kuota) {
      alert("Kuota kode voucher ini sudah habis.")
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
    showToast(
      `Voucher "${kodeBersih}" berhasil diklaim! +${tambahan} Koin ditambahkan.`,
    )
  }

  const jumlahMenungguLaporan = koleksiSkripTersimpan.filter(
    (s) => s.sudahUpload && !s.sudahEvaluasi,
  ).length

  const jumlahTransaksiPending = daftarTransaksi.filter(
    (t) => t.status === "pending",
  ).length

  const totalOmzetLunas = daftarTransaksi
    .filter((t) => t.status === "lunas")
    .reduce((acc, cur) => acc + (parseInt(cur.nominal_bayar) || 0), 0)

  const daftarMenu = [
    { id: "dna", label: "Profil & Karakter (DNA)", icon: "dna" },
    { id: "produksi", label: "Buat Skrip Konten", icon: "bolt" },
    { id: "rewrite", label: "Ekstrak & Rewrite Video", icon: "scissors" },
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
    { id: "topup", label: "Paket Koin & Pembayaran", icon: "coin" },
    {
      id: "devprompt",
      label: "Dashboard Developer",
      icon: "code",
      badge: jumlahTransaksiPending,
    },
    { id: "syarat", label: "Syarat & Ketentuan", icon: "shield" },
  ]

  const daftarPaketKoin = [
    {
      nama: "Paket Coba",
      harga: "Rp5.000",
      nominalAngka: 5000,
      koin: 50,
      ket: "Cocok untuk mencoba fitur dasar pembuatan skrip.",
    },
    {
      nama: "Paket Pemula",
      harga: "Rp10.000",
      nominalAngka: 10000,
      koin: 120,
      ket: "Pilihan pas untuk mulai rutin membuat konten mingguan.",
    },
    {
      nama: "Paket Rutin",
      harga: "Rp15.000",
      nominalAngka: 15000,
      koin: 200,
      ket: "Untuk kreator yang mulai konsisten upload setiap hari.",
    },
    {
      nama: "Paket Aktif",
      harga: "Rp20.000",
      nominalAngka: 20000,
      koin: 300,
      ket: "Termasuk bonus koin tambahan untuk eksplorasi ide.",
    },
    {
      nama: "Paket Kreator (Terlaris)",
      harga: "Rp25.000",
      nominalAngka: 25000,
      koin: 400,
      ket: "Kuota melimpah untuk kreator dan affiliator aktif.",
      populer: true,
    },
    {
      nama: "Paket Sultan",
      harga: "Rp50.000",
      nominalAngka: 50000,
      koin: 1000,
      ket: "Untuk produksi konten masif di banyak akun.",
    },
    {
      nama: "Paket Produser VIP",
      harga: "Rp99.000",
      nominalAngka: 99000,
      koin: 3000,
      ket: "Akses maksimal tanpa khawatir kehabisan kuota koin.",
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
          HEADER STICKY MINIMALIS SATU BARIS
      ===================================================================== */}
      <header className="sticky top-0 z-40 h-16 bg-[#14141f] text-white px-3 sm:px-6 flex items-center justify-between shadow-md border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setSidebarOpen(!sidebarOpen)
              } else {
                setDesktopMinimized(!desktopMinimized)
              }
            }}
            className="cursor-pointer w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#d4f34a] transition"
            title="Menu Navigasi"
          >
            <FlatIcon name="menu" className="w-5 h-5" />
          </button>
          <div
            onClick={() => setActiveMenu("produksi")}
            className="cursor-pointer flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-[#d4f34a] flex items-center justify-center text-[#14141f] font-bold text-sm">
              H
            </div>
            <span className="font-bold text-base tracking-tight hidden xs:inline">
              Hookya
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowProfilePopup(!showProfilePopup)}
            className="cursor-pointer flex items-center gap-2 bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full text-xs transition border border-white/10"
          >
            <span className="w-2 h-2 rounded-full bg-[#d4f34a]" />
            <span className="font-normal text-white truncate max-w-[170px] sm:max-w-xs">
              Hai,{" "}
              <strong className="font-bold text-[#d4f34a] underline">
                {profil.nama || "Kreator"}
              </strong>{" "}
              <span className="text-slate-300 hidden sm:inline">
                ({profil.peranSaatIni})
              </span>
            </span>
            <FlatIcon
              name="chevronDown"
              className="w-3.5 h-3.5 text-[#d4f34a]"
            />
          </button>

          {showProfilePopup && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 sm:w-96 bg-white text-[#14141f] rounded-3xl shadow-2xl border border-slate-200 p-5 z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-[11px] font-bold bg-[#f2fce2] text-[#4d6b14] px-2.5 py-0.5 rounded-md">
                    {dbConnected ? "Database Cloud Aktif" : "Sesi Lokal Aktif"}
                  </span>
                  <h4 className="font-bold text-sm mt-1.5">
                    {profil.nama} ({profil.usia} Tahun • {profil.gender})
                  </h4>
                </div>
                <button
                  onClick={() => setShowProfilePopup(false)}
                  className="cursor-pointer w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs font-normal space-y-1.5 text-slate-600">
                <div>
                  <strong className="font-bold text-[#14141f]">
                    Paket Aktif:
                  </strong>{" "}
                  {paket}
                </div>
                <div>
                  <strong className="font-bold text-[#14141f]">Peran:</strong>{" "}
                  {profil.peranSaatIni}
                </div>
                <div>
                  <strong className="font-bold text-[#14141f]">
                    Minat Utama:
                  </strong>{" "}
                  {profil.minatUtama}
                </div>
                <div>
                  <strong className="font-bold text-[#14141f]">
                    Waktu Luang:
                  </strong>{" "}
                  {profil.waktuFree}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    setShowProfilePopup(false)
                    setActiveMenu("dna")
                  }}
                  className="cursor-pointer flex-1 bg-[#14141f] text-[#d4f34a] text-xs font-bold py-2.5 rounded-xl"
                >
                  Edit Profil DNA
                </button>
                <button
                  onClick={() => {
                    setShowProfilePopup(false)
                    setActiveMenu("devprompt")
                  }}
                  className="cursor-pointer flex-1 bg-[#f4f5f7] text-[#14141f] text-xs font-bold py-2.5 rounded-xl"
                >
                  Dashboard Dev
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMenu("rapor")}
            className="hidden sm:flex cursor-pointer items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-bold transition"
          >
            <FlatIcon name="bell" className="w-3.5 h-3.5 text-[#d4f34a]" />
            <span>Kinerja ({koleksiSkripTersimpan.length})</span>
          </button>
          <button
            onClick={() => setActiveMenu("topup")}
            className="cursor-pointer flex items-center gap-1.5 bg-[#d4f34a] text-[#14141f] px-3.5 py-1.5 rounded-full text-xs font-bold"
          >
            <FlatIcon name="coin" className="w-3.5 h-3.5" />
            <span>{coins} Koin</span>
          </button>
        </div>
      </header>

      {/* =====================================================================
          BODY UTAMA: SIDEBAR + KONTEN
      ===================================================================== */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* DRAWER SIDEBAR MOBILE */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60"
            />
            <aside className="relative w-72 max-w-[82vw] bg-[#14141f] text-white h-full p-5 flex flex-col justify-between z-10 shadow-2xl overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-bold text-[#d4f34a]">
                    Menu Navigasi
                  </span>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="cursor-pointer w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"
                  >
                    <FlatIcon name="close" className="w-4 h-4" />
                  </button>
                </div>
                <nav className="space-y-1.5 text-xs">
                  {daftarMenu.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveMenu(item.id)
                        setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition cursor-pointer ${
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

        {/* AREA KONTEN TENGAH */}
        <main className="flex-1 p-3 sm:p-5 md:pl-0 max-w-5xl">
          {/* =======================================================
              MENU 1: PROFIL & KARAKTER (DNA)
          ======================================================= */}
          {activeMenu === "dna" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                  Profil & Karakteristik Kreator
                </h2>
                <p className="text-xs font-normal text-slate-600 mt-1 leading-relaxed">
                  Lengkapi profil di bawah ini agar Sistem AI dapat menyusun
                  rekomendasi topik, jadwal, dan gaya skrip yang menyatu dengan
                  keseharianmu.
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
                    className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                    Usia Saat Ini (Tahun):
                  </label>
                  <input
                    type="number"
                    value={profil.usia}
                    onChange={(e) =>
                      setProfil({ ...profil, usia: e.target.value })
                    }
                    className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                    Gender:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Laki-laki", "Perempuan"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setProfil({ ...profil, gender: g })}
                        className={`cursor-pointer py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                          profil.gender === g
                            ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                            : "bg-[#f4f5f7] text-slate-600 border-transparent"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectWithCustom
                  label="Peran / Aktivitas Utamamu Saat Ini:"
                  value={profil.peranSaatIni}
                  options={[
                    "Pelajar SMP / SMA / SMK",
                    "Mahasiswa / Anak Kos",
                    "Fresh Graduate / Pencari Kerja",
                    "Karyawan / Pekerja & Pebisnis Lokal",
                    "Guru / Tenaga Pendidik",
                    "Freelancer / Pekerja Kreatif",
                    "Ibu / Bapak Rumah Tangga",
                    "Pebisnis / UMKM / Penjual Online",
                  ]}
                  onChange={(val) =>
                    setProfil({ ...profil, peranSaatIni: val })
                  }
                />

                <SelectWithCustom
                  label="Karakter & Kepribadian Sosial:"
                  value={profil.kepribadianSosial}
                  options={[
                    "Introvert (Tenang, Pengamat, Suka di Balik Layar)",
                    "Ambivert (Santai kalau sudah kenal, tapi malas tampil berlebihan)",
                    "Ekstrovert (Ekspresif, Suka Ngobrol & Bercerita)",
                    "Humoris & Suka Bercanda Santai",
                    "Tegas, Lugas & To-The-Point",
                  ]}
                  onChange={(val) =>
                    setProfil({ ...profil, kepribadianSosial: val })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                    Minat / Hobi Utama:
                  </label>
                  <input
                    type="text"
                    value={profil.minatUtama}
                    onChange={(e) =>
                      setProfil({ ...profil, minatUtama: e.target.value })
                    }
                    placeholder="Contoh: Mengajar, Olahraga, Memasak, Teknologi..."
                    className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:bg-white"
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

              <div className="space-y-3 pt-4 border-t border-slate-100">
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

              <div className="space-y-3 pt-4 border-t border-slate-100">
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
                          <div className="text-xs sm:text-sm font-bold text-[#14141f] tracking-tight">
                            {item.nama}
                          </div>
                          <div className="text-xs font-normal text-slate-700 mt-1 leading-relaxed">
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
                    placeholder="Ketik atau gunakan mikrofon untuk mendeskripsikan konsep kontenmu sendiri..."
                    onNotify={showToast}
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  handleSimpanProfilDatabase()
                  setActiveMenu("produksi")
                }}
                className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl hover:opacity-95 transition"
              >
                Simpan Profil & Lanjut Buat Skrip
              </button>
            </div>
          )}

          {/* =======================================================
              MENU 2: BUAT SKRIP KONTEN
          ======================================================= */}
          {activeMenu === "produksi" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="bg-[#f4f5f7] p-2 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setKategoriKonten("personal")
                    setStep(1)
                    setHasilSkrip(null)
                  }}
                  className={`cursor-pointer p-3.5 rounded-xl text-left transition flex items-center gap-3 ${
                    kategoriKonten === "personal"
                      ? "bg-[#14141f] text-[#d4f34a] shadow-xs"
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
                  onClick={() => {
                    setKategoriKonten("affiliate")
                    setStep(1)
                    setHasilSkrip(null)
                  }}
                  className={`cursor-pointer p-3.5 rounded-xl text-left transition flex items-center gap-3 ${
                    kategoriKonten === "affiliate"
                      ? "bg-[#14141f] text-[#d4f34a] shadow-xs"
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

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                  {step === 1 &&
                    (isPersonal
                      ? "Tentukan Ide atau Topik Konten Kreator"
                      : "Masukkan Detail Produk Promosi / Affiliate")}
                  {step === 2 && "Pilih Karakteristik Penonton"}
                  {step === 3 && "Keresahan atau Masalah Utama Penonton"}
                  {step === 4 && "Kalimat Pancingan Pembuka (3 Detik Pertama)"}
                  {step === 5 && "Gaya Bahasa & Pembawaan"}
                  {step === 6 && "Alur Penyajian Video"}
                  {step === 7 && hasilSkrip?.judul}
                </h2>

                {step > 1 && (
                  <div className="flex items-center gap-2">
                    {step >= 2 && step <= 6 && (
                      <button
                        type="button"
                        onClick={() => panggilAsesmenAI(step, jawaban)}
                        className="cursor-pointer flex items-center gap-1.5 text-xs bg-[#f2fce2] hover:bg-[#d4f34a] text-[#14141f] font-bold px-3.5 py-2 rounded-xl transition"
                      >
                        <FlatIcon name="refresh" className="w-3.5 h-3.5" />
                        <span>Muat Ulang AI</span>
                      </button>
                    )}
                    {step < 7 && (
                      <button
                        onClick={() => setStep(step - 1)}
                        className="cursor-pointer text-xs bg-[#f4f5f7] px-3.5 py-2 rounded-xl font-bold"
                      >
                        ← Kembali
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setStep(1)
                        setHasilSkrip(null)
                      }}
                      className="cursor-pointer text-xs bg-[#14141f] text-[#d4f34a] px-3.5 py-2 rounded-xl font-bold"
                    >
                      Buat Baru
                    </button>
                  </div>
                )}
              </div>

              {step === 1 && (
                <div className="space-y-6">
                  <div className="bg-[#f4f5f7] p-4 sm:p-5 rounded-3xl border border-slate-200/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-[#14141f]">
                          10 Referensi Ide Topik Sesuai Profilmu (Geser ke
                          Samping)
                        </h3>
                        <p className="text-xs font-normal text-slate-600">
                          Klik salah satu kartu ide di bawah untuk memilih
                          cepat, atau tentukan sendiri topikmu pada kolom di
                          bawahnya.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isLoadingIdeTopik}
                          onClick={handleGenerate10IdeTopikAI}
                          className="cursor-pointer flex items-center gap-1.5 bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-50"
                        >
                          <FlatIcon
                            name="refresh"
                            className={`w-3.5 h-3.5 ${
                              isLoadingIdeTopik ? "animate-spin" : ""
                            }`}
                          />
                          <span>
                            {isLoadingIdeTopik
                              ? "Memproses..."
                              : "Perbarui 10 Ide AI"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => geserSliderIde("kiri")}
                          className="cursor-pointer w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#14141f] hover:bg-slate-100"
                        >
                          <FlatIcon name="chevronLeft" className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => geserSliderIde("kanan")}
                          className="cursor-pointer w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#14141f] hover:bg-slate-100"
                        >
                          <FlatIcon name="chevronRight" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div
                      ref={sliderIdeRef}
                      className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scrollbar-thin"
                    >
                      {daftar10IdeTopik.map((ide, idx) => {
                        const sedangTerpilih = isPersonal
                          ? kontenPersonal.topik === ide.judul
                          : produk.nama === ide.judul

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (isPersonal) {
                                setKontenPersonal({
                                  topik: ide.judul,
                                  jenisCerita:
                                    ide.nuansa ||
                                    "Tips Praktis & Pengalaman Nyata",
                                  intiPesan: ide.ringkasan || "",
                                })
                              } else {
                                setProduk({
                                  ...produk,
                                  nama: ide.judul,
                                  keunggulan: ide.ringkasan || "",
                                })
                              }
                              showToast(`Topik "${ide.judul}" dipilih.`)
                            }}
                            className={`cursor-pointer snap-start shrink-0 w-64 sm:w-72 p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                              sedangTerpilih
                                ? "bg-[#d4f34a] text-[#14141f] border-[#14141f]"
                                : "bg-white text-[#14141f] border-slate-200 hover:border-[#14141f]"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[11px] font-bold text-slate-500">
                                  Ide #{idx + 1} • {ide.nuansa}
                                </span>
                                {sedangTerpilih && (
                                  <FlatIcon
                                    name="check"
                                    className="w-4 h-4 shrink-0"
                                  />
                                )}
                              </div>
                              <div className="text-xs sm:text-sm font-bold text-[#14141f] leading-snug">
                                {ide.judul}
                              </div>
                              <p className="text-xs font-normal text-slate-600 mt-1.5 leading-relaxed">
                                {ide.ringkasan}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {isPersonal ? (
                    <div className="space-y-4">
                      <div className="border-t border-slate-100 pt-4">
                        <h3 className="text-xs sm:text-sm font-bold text-[#14141f]">
                          Atau Tentukan & Ketik Sendiri Topik Pembahasanmu:
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                            Topik / Judul Konten yang Ingin Dibuat:
                          </label>
                          <input
                            type="text"
                            value={kontenPersonal.topik}
                            onChange={(e) =>
                              setKontenPersonal({
                                ...kontenPersonal,
                                topik: e.target.value,
                              })
                            }
                            placeholder="Ketik topik pilihanmu sendiri di sini..."
                            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-normal outline-none focus:bg-white focus:border-[#14141f]"
                          />
                        </div>
                        <SelectWithCustom
                          label="Nuansa Pembahasan:"
                          value={kontenPersonal.jenisCerita}
                          options={[
                            "Tips Praktis & Pengalaman Nyata",
                            "Storytelling Keseharian",
                            "Edukasi & Tutorial Singkat",
                            "Refleksi & Cerita Relatable",
                            "Hiburan / Komedi Relatable",
                          ]}
                          onChange={(val) =>
                            setKontenPersonal({
                              ...kontenPersonal,
                              jenisCerita: val,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                          Ceritakan Gambaran / Inti Pesan Kontenmu (Bisa Klik
                          Ikon Mic):
                        </label>
                        <StoryVoiceInput
                          rows={2}
                          value={kontenPersonal.intiPesan}
                          onChange={(val) =>
                            setKontenPersonal({
                              ...kontenPersonal,
                              intiPesan: val,
                            })
                          }
                          placeholder="Ceritakan singkat apa yang ingin dibahas..."
                          onNotify={showToast}
                        />
                      </div>

                      <button
                        onClick={() => {
                          if (!kontenPersonal.topik.trim()) {
                            alert(
                              "Silakan pilih salah satu kartu ide di atas atau ketik Topik Konten terlebih dahulu.",
                            )
                            return
                          }
                          const resetJwb = {
                            audiens: "",
                            masalah: "",
                            hook: "",
                            tone: "",
                            format: "",
                          }
                          setJawaban(resetJwb)
                          panggilAsesmenAI(
                            2,
                            resetJwb,
                            kontenPersonal.topik.trim(),
                          )
                        }}
                        className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl shadow-sm"
                      >
                        Analisis Topik Ini dengan Sistem AI ➔
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#14141f] mb-1">
                            Nama / Jenis Produk (Wajib) *
                          </label>
                          <input
                            type="text"
                            value={produk.nama}
                            onChange={(e) =>
                              setProduk({ ...produk, nama: e.target.value })
                            }
                            placeholder="Contoh: Pompa ASI Elektrik / Sepatu Lari"
                            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-normal outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#14141f] mb-1">
                            Nama Merek / Brand (Wajib) *
                          </label>
                          <input
                            type="text"
                            value={produk.brand}
                            onChange={(e) =>
                              setProduk({ ...produk, brand: e.target.value })
                            }
                            placeholder="Contoh: Mutter / Ortuseight"
                            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-normal outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            Kisaran Harga (Opsional)
                          </label>
                          <input
                            type="text"
                            value={produk.harga}
                            onChange={(e) =>
                              setProduk({ ...produk, harga: e.target.value })
                            }
                            placeholder="Contoh: Rp 250 ribuan"
                            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-normal outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            Promo Saat Ini (Opsional)
                          </label>
                          <input
                            type="text"
                            value={produk.promo}
                            onChange={(e) =>
                              setProduk({ ...produk, promo: e.target.value })
                            }
                            placeholder="Contoh: Gratis Ongkir & Diskon"
                            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-normal outline-none focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#14141f] mb-1">
                          Ceritakan Bahan & Keunggulan Produk (Bisa Klik Ikon
                          Mic):
                        </label>
                        <StoryVoiceInput
                          rows={2}
                          value={produk.keunggulan}
                          onChange={(val) =>
                            setProduk({ ...produk, keunggulan: val })
                          }
                          placeholder="Ceritakan kelebihan utama produk ini..."
                          onNotify={showToast}
                        />
                      </div>

                      <button
                        onClick={() => {
                          if (!produk.nama.trim()) {
                            alert("Silakan isi Nama Produk terlebih dahulu.")
                            return
                          }
                          const resetJwb = {
                            audiens: "",
                            masalah: "",
                            hook: "",
                            tone: "",
                            format: "",
                          }
                          setJawaban(resetJwb)
                          panggilAsesmenAI(
                            2,
                            resetJwb,
                            `${produk.nama.trim()} (${produk.brand.trim() || "pilihan"})`,
                          )
                        }}
                        className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-sm py-4 rounded-2xl shadow-sm"
                      >
                        Analisis Produk Ini dengan Sistem AI ➔
                      </button>
                    </div>
                  )}
                </div>
              )}

              {step >= 2 && step <= 6 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-[#14141f] text-[#d4f34a] font-bold px-3 py-1 rounded-lg">
                      Topik: {dapatkanSubyekAktif()}
                    </span>
                    {jawaban.audiens && (
                      <span className="bg-[#f2fce2] text-[#14141f] font-normal px-3 py-1 rounded-lg">
                        Penonton: {jawaban.audiens.slice(0, 45)}...
                      </span>
                    )}
                    {step > 3 && jawaban.masalah && (
                      <span className="bg-[#f4f5f7] text-[#14141f] font-normal px-3 py-1 rounded-lg">
                        Masalah: {jawaban.masalah.slice(0, 45)}...
                      </span>
                    )}
                  </div>

                  {(isLoadingOpsi || isGenerating) && (
                    <div className="py-12 px-6 rounded-3xl bg-[#f4f5f7] border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-11 h-11 rounded-2xl bg-[#14141f] text-[#d4f34a] flex items-center justify-center animate-spin">
                        <FlatIcon name="refresh" className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-[#14141f]">
                          {isGenerating
                            ? "Sistem AI sedang menyusun skrip dan arahan visual..."
                            : "Sistem AI sedang menganalisis pilihanmu..."}
                        </h3>
                        <p className="text-xs font-normal text-slate-600">
                          Menyelaraskan topik "{dapatkanSubyekAktif()}" dengan
                          profilmu.
                        </p>
                      </div>
                    </div>
                  )}

                  {!isLoadingOpsi && errorAsesmenAI && (
                    <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3">
                      <p className="text-xs sm:text-sm font-bold text-rose-900">
                        {errorAsesmenAI}
                      </p>
                      <button
                        type="button"
                        onClick={() => panggilAsesmenAI(step, jawaban)}
                        className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-5 py-2.5 rounded-xl inline-flex items-center gap-2"
                      >
                        <FlatIcon name="refresh" className="w-4 h-4" />
                        <span>Muat Ulang Analisis AI Sekarang</span>
                      </button>
                    </div>
                  )}

                  {!isLoadingOpsi &&
                    !isGenerating &&
                    !errorAsesmenAI &&
                    opsiDinamisAI.length > 0 && (
                      <>
                        <div className="bg-[#f4f5f7] p-4 rounded-2xl border border-slate-200">
                          <span className="text-xs sm:text-sm font-bold text-[#14141f]">
                            {pertanyaanDinamisAI}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {opsiDinamisAI.map((op, idx) => {
                            const kunciState =
                              step === 2
                                ? "audiens"
                                : step === 3
                                  ? "masalah"
                                  : step === 4
                                    ? "hook"
                                    : step === 5
                                      ? "tone"
                                      : "format"

                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  const jawabanUpdate = {
                                    ...jawaban,
                                    [kunciState]: op,
                                  }
                                  setJawaban(jawabanUpdate)
                                  if (step < 6) {
                                    panggilAsesmenAI(step + 1, jawabanUpdate)
                                  } else {
                                    handleGenerateSkripAI(op)
                                  }
                                }}
                                className="cursor-pointer w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-[#14141f] bg-white hover:bg-[#d4f34a] transition flex items-center justify-between gap-3"
                              >
                                <span className="text-xs sm:text-sm font-normal text-[#14141f] leading-relaxed">
                                  {op}
                                </span>
                                <span className="bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3.5 py-1.5 rounded-xl shrink-0">
                                  {step === 6 ? "Buat Skrip" : "Pilih"}
                                </span>
                              </button>
                            )
                          })}
                        </div>

                        <div className="bg-[#f4f5f7] rounded-2xl p-4 space-y-3">
                          <label className="block text-xs font-bold text-[#14141f]">
                            Ingin menuliskan pendekatanmu sendiri? Ketik atau
                            gunakan mikrofon:
                          </label>
                          <StoryVoiceInput
                            rows={2}
                            value={ceritaAsesmen}
                            onChange={setCeritaAsesmen}
                            placeholder="Ceritakan idemu secara bebas di sini..."
                            onNotify={showToast}
                          />
                          <button
                            onClick={() => {
                              if (!ceritaAsesmen.trim()) {
                                alert(
                                  "Ketik atau rekam ceritamu terlebih dahulu.",
                                )
                                return
                              }
                              const kunciState =
                                step === 2
                                  ? "audiens"
                                  : step === 3
                                    ? "masalah"
                                    : step === 4
                                      ? "hook"
                                      : step === 5
                                        ? "tone"
                                        : "format"
                              const jawabanUpdate = {
                                ...jawaban,
                                [kunciState]: ceritaAsesmen.trim(),
                              }
                              setJawaban(jawabanUpdate)
                              if (step < 6) {
                                panggilAsesmenAI(step + 1, jawabanUpdate)
                              } else {
                                handleGenerateSkripAI(ceritaAsesmen.trim())
                              }
                            }}
                            className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2.5 rounded-xl"
                          >
                            Gunakan Pendekatan Ini
                          </button>
                        </div>
                      </>
                    )}
                </div>
              )}

              {step === 7 && hasilSkrip && (
                <div className="space-y-5">
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
                      <span className="text-xs font-normal text-slate-500">
                        Dibuat: {hasilSkrip.waktuDibuat}
                      </span>
                      <button
                        onClick={() => setModeTeleprompter(true)}
                        className="cursor-pointer flex items-center gap-1.5 bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2.5 rounded-xl"
                      >
                        <FlatIcon name="tv" className="w-4 h-4" />
                        <span>Teleprompter</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#f4f5f7] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-[#14141f]">
                        Bentuk Konten: {hasilSkrip.bentuk}
                      </div>
                      <p className="text-xs font-normal text-slate-600 mt-0.5">
                        Ingin mengubah skrip ini ke bentuk konten lain (misal
                        Carousel atau B-Roll)?
                      </p>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
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
                        className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2.5 rounded-xl shrink-0 disabled:opacity-50"
                      >
                        {isGenerating ? "Memproses..." : "Ubah Bentuk Konten"}
                      </button>
                    </div>
                  </div>

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
                          <div className="text-xs font-bold text-slate-500">
                            {seg.labelMini}
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                            <div className="lg:col-span-7 bg-[#d4f34a]/35 border border-[#14141f]/15 rounded-2xl p-4 flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-[#14141f] block">
                                  {modeTampilanSkrip === "teks"
                                    ? "Teks di Layar / Slide"
                                    : "Kalimat Skrip (Voiceover)"}
                                </span>
                                <p className="text-xs sm:text-sm font-normal text-[#14141f] leading-relaxed">
                                  {teksUtamaAktif}
                                </p>
                              </div>

                              <button
                                type="button"
                                disabled={isGenerating}
                                onClick={() =>
                                  handleRegeneratePerBagian(idx, "skrip")
                                }
                                className="cursor-pointer w-9 h-9 rounded-xl bg-white hover:bg-[#14141f] text-[#14141f] hover:text-[#d4f34a] border border-slate-200 flex items-center justify-center shrink-0 transition disabled:opacity-50"
                              >
                                <FlatIcon name="refresh" className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="lg:col-span-5 bg-[#f4f5f7] rounded-2xl p-4 flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-[#14141f] block">
                                  Arahan Visual Adegan
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
                                className="cursor-pointer w-9 h-9 rounded-xl bg-white hover:bg-[#14141f] text-slate-700 hover:text-[#d4f34a] border border-slate-200 flex items-center justify-center shrink-0 transition disabled:opacity-50"
                              >
                                <FlatIcon name="refresh" className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              MENU 3: EKSTRAK VIDEO & URL
          ======================================================= */}
          {activeMenu === "rewrite" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                  Ekstrak Video (Upload File / URL) & Ubah Jadi Copywriting
                  Orisinil
                </h2>
                <p className="text-xs font-normal text-slate-600 mt-1 leading-relaxed">
                  Unggah file video/audio dari perangkatmu atau tempel tautan
                  URL untuk dianalisis oleh Sistem AI dan ditulis ulang sesuai
                  karaktermu.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-[#14141f] bg-[#f4f5f7] rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-2 transition">
                  <div className="w-10 h-10 rounded-xl bg-[#14141f] text-[#d4f34a] flex items-center justify-center">
                    <FlatIcon name="upload" className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-[#14141f] break-all px-2">
                    {sumberVideo.sedangEkstrakFile
                      ? "Sistem AI sedang menyiapkan adegan video..."
                      : sumberVideo.namaFileUpload
                        ? `File Terpilih: ${sumberVideo.namaFileUpload}`
                        : "Klik untuk Upload File Video / Audio (.mp4, .mp3, .wav)"}
                  </div>
                  <span className="text-xs font-normal text-slate-500">
                    Sistem AI akan langsung menganalisis adegan & mengekstrak
                    isinya
                  </span>
                  <input
                    type="file"
                    accept="video/*,audio/*"
                    onChange={handleFileVideoUpload}
                    className="hidden"
                  />
                </label>

                <div className="bg-[#f4f5f7] rounded-2xl p-5 flex flex-col justify-center space-y-2">
                  <label className="text-xs font-bold text-[#14141f]">
                    Atau Tempel Tautan URL Video (TikTok / Reels / Shorts):
                  </label>
                  <input
                    type="text"
                    value={sumberVideo.urlAtauNama}
                    onChange={(e) =>
                      setSumberVideo({
                        ...sumberVideo,
                        urlAtauNama: e.target.value,
                      })
                    }
                    placeholder="https://vt.tiktok.com/..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-normal outline-none"
                  />
                  <span className="text-xs font-normal text-slate-500">
                    Sistem AI otomatis membaca informasi dari tautan video
                    tersebut.
                  </span>
                </div>
              </div>

              {sumberVideo.framesBase64.length > 0 && (
                <div className="bg-[#f4f5f7] p-3.5 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-[#14141f] block">
                    Cuplikan Adegan Video Siap Dianalisis (
                    {sumberVideo.framesBase64.length} Frame):
                  </span>
                  <div className="flex gap-2 overflow-x-auto">
                    {sumberVideo.framesBase64.map((f, i) => (
                      <img
                        key={i}
                        src={`data:image/jpeg;base64,${f}`}
                        alt={`Scene ${i + 1}`}
                        className="h-20 w-auto rounded-xl border border-slate-300 object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                  Teks / Catatan Isi Video (Opsional jika sudah upload file atau
                  URL):
                </label>
                <StoryVoiceInput
                  rows={2}
                  value={sumberVideo.transkripAsli}
                  onChange={(val) =>
                    setSumberVideo({ ...sumberVideo, transkripAsli: val })
                  }
                  placeholder="Bisa dikosongkan jika sudah upload video di atas, atau tambahkan catatan lewat mikrofon..."
                  onNotify={showToast}
                />
              </div>

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
                  placeholder="Contoh: Ubah menjadi gaya bercerita santai sesuai pengalamanku..."
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
                    ? "Sistem AI Sedang Mengekstrak Video & Menyusun Copywriting..."
                    : "Ekstrak Video & Buat Copywriting Orisinil"}
                </span>
              </button>

              {isGenerating && (
                <div className="p-6 rounded-3xl bg-[#f4f5f7] border border-slate-200 text-center space-y-2">
                  <div className="text-xs sm:text-sm font-bold text-[#14141f]">
                    Sistem AI sedang membaca isi video & meracik naskah
                    orisinil...
                  </div>
                  <p className="text-xs font-normal text-slate-600">
                    Mohon tunggu sekitar 5-10 detik hingga hasil ekstraksi dan
                    skrip muncul di bawah ini.
                  </p>
                </div>
              )}

              {!isGenerating && errorRewriteAI && (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold text-rose-900">
                    {errorRewriteAI}
                  </span>
                  <button
                    type="button"
                    onClick={handleRewriteVideoAI}
                    className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Coba Lagi Sekarang
                  </button>
                </div>
              )}

              {!isGenerating && hasilRewriteVideo && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="bg-[#f4f5f7] p-4 rounded-2xl space-y-1">
                    <span className="text-xs font-bold text-[#14141f]">
                      Hasil Analisis Isi Video oleh Sistem AI:
                    </span>
                    <p className="text-xs font-normal text-slate-700 leading-relaxed">
                      {hasilRewriteVideo.transkripTerdeteksi}
                    </p>
                  </div>

                  <div className="bg-[#d4f34a]/35 p-5 rounded-2xl space-y-3 border border-[#14141f]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#14141f]">
                        Hasil Copywriting Orisinil Gaya Kamu:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            hasilRewriteVideo.copywritingBaru,
                          )
                          showToast("Copywriting berhasil disalin!")
                        }}
                        className="cursor-pointer bg-white text-[#14141f] border border-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                      >
                        <FlatIcon name="copy" className="w-3.5 h-3.5" />
                        <span>Salin Teks</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm font-normal text-[#14141f] leading-relaxed">
                      {hasilRewriteVideo.copywritingBaru}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              MENU 4 & 5: SKRIP TERSIMPAN & LAPORAN KINERJA VT SEPEKAN
          ======================================================= */}
          {(activeMenu === "tersimpan" || activeMenu === "rapor") && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                    {activeMenu === "tersimpan"
                      ? "Daftar Skrip Tersimpan & Status Upload Konten"
                      : "Laporan Kinerja VT Sepekan Setelah Upload"}
                  </h2>
                  <p className="text-xs font-normal text-slate-600 mt-1 leading-relaxed">
                    Setiap skrip yang kamu buat otomatis tersimpan beserta waktu
                    pembuatannya. Ceklis skrip yang sudah diupload, isi tanggal
                    uploadnya, dan laporkan jumlah views, like, serta komentar
                    setelah sepekan.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStep(1)
                    setActiveMenu("produksi")
                  }}
                  className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2.5 rounded-xl"
                >
                  + Buat Skrip Baru
                </button>
              </div>

              {koleksiSkripTersimpan.length === 0 ? (
                <div className="text-center py-12 text-xs font-normal text-slate-500">
                  Belum ada skrip yang dibuat. Setiap skrip yang selesai kamu
                  buat akan otomatis muncul di sini.
                </div>
              ) : (
                <div className="space-y-4">
                  {koleksiSkripTersimpan.map((item) => {
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
                        className="p-5 rounded-3xl border border-slate-200 bg-[#f4f5f7] space-y-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="text-xs font-normal text-slate-500">
                              Skrip dibuat pada:{" "}
                              <strong className="font-bold text-[#14141f]">
                                {item.waktuDibuat}
                              </strong>{" "}
                              • {item.bentuk}
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-[#14141f]">
                              {item.judul}
                            </h3>
                          </div>

                          <button
                            onClick={() => {
                              setHasilSkrip(item)
                              setStep(7)
                              setActiveMenu("produksi")
                            }}
                            className="cursor-pointer bg-white border border-slate-300 text-[#14141f] text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-slate-100"
                          >
                            Buka Skrip
                          </button>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                          <label className="cursor-pointer flex items-center gap-2.5 text-xs font-bold text-[#14141f]">
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
                              <span className="font-normal text-slate-600">
                                Tanggal Konten Diupload:
                              </span>
                              <input
                                type="date"
                                value={item.tanggalUpload || ""}
                                onChange={(e) =>
                                  handleUbahTanggalUpload(item, e.target.value)
                                }
                                className="bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#14141f] outline-none"
                              />
                            </div>
                          )}
                        </div>

                        {item.sudahUpload && (
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                            {infoPengingat && (
                              <div
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${infoPengingat.warna}`}
                              >
                                <FlatIcon
                                  name="bell"
                                  className="w-4 h-4 shrink-0"
                                />
                                <span>{infoPengingat.teks}</span>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
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
                                  placeholder="Contoh: 2500"
                                  className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal outline-none"
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
                                  placeholder="Contoh: 180"
                                  className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal outline-none"
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
                                  placeholder="Contoh: 24"
                                  className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal outline-none"
                                />
                              </div>

                              <div className="flex items-end">
                                <button
                                  type="button"
                                  disabled={isGenerating}
                                  onClick={() =>
                                    handleKirimLaporanKinerjaVT(item)
                                  }
                                  className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-2.5 px-3 rounded-xl disabled:opacity-50"
                                >
                                  {item.sudahEvaluasi
                                    ? "Perbarui Kinerja"
                                    : "Laporkan Kinerja"}
                                </button>
                              </div>
                            </div>

                            {item.evaluasiAI && (
                              <div className="bg-[#f4f5f7] p-3.5 rounded-xl text-xs font-normal text-[#14141f] leading-relaxed">
                                <strong className="font-bold block mb-0.5">
                                  Evaluasi Kinerja Sepekan dari Sistem AI:
                                </strong>
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

          {/* =======================================================
              MENU 6: PAKET KOIN & SISTEM PEMBAYARAN (CHECKOUT QRIS + RIWAYAT INVOICE)
          ======================================================= */}
          {activeMenu === "topup" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                    Pilih Paket Koin & Pembayaran (Masa Aktif 30 Hari)
                  </h2>
                  <p className="text-xs font-normal text-slate-600 mt-0.5">
                    Pilih paket di bawah untuk membuka halaman pembayaran QRIS /
                    Transfer, atau tukarkan kode voucher.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-[#f4f5f7] p-1.5 rounded-2xl border border-slate-200">
                  <input
                    type="text"
                    value={inputKodeVoucherUser}
                    onChange={(e) => setInputKodeVoucherUser(e.target.value)}
                    placeholder="Masukkan Kode Voucher..."
                    className="bg-white rounded-xl px-3 py-2 text-xs font-bold uppercase outline-none w-44"
                  />
                  <button
                    type="button"
                    onClick={handleKlaimVoucherUser}
                    className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3.5 py-2 rounded-xl"
                  >
                    Klaim Voucher
                  </button>
                </div>
              </div>

              {/* Grid 7 Paket Koin (Mulai Rp5.000) */}
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
                      <p className="text-xs font-normal opacity-80 mt-2 leading-relaxed">
                        {p.ket}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => bukaLayarCheckoutPaket(p)}
                      className="cursor-pointer mt-5 w-full bg-[#d4f34a] text-[#14141f] font-bold text-xs py-3 rounded-xl hover:opacity-90 transition"
                    >
                      Beli Paket ({p.harga})
                    </button>
                  </div>
                ))}
              </div>

              {/* Riwayat Tagihan & Pembayaran User */}
              {daftarTransaksi.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h3 className="text-sm font-bold text-[#14141f]">
                    Riwayat Pembelian & Status Pembayaranmu
                  </h3>
                  <div className="space-y-2">
                    {daftarTransaksi.slice(0, 5).map((trx) => (
                      <div
                        key={trx.id}
                        className="p-3.5 rounded-2xl bg-[#f4f5f7] border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <strong className="font-bold text-[#14141f]">
                            {trx.invoice_id} — {trx.nama_paket} (+
                            {trx.jumlah_koin} Koin)
                          </strong>
                          <div className="text-slate-500 font-normal mt-0.5">
                            Metode: {trx.metode_bayar} • Tagihan: Rp
                            {Number(trx.nominal_bayar).toLocaleString("id-ID")}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full font-bold ${
                            trx.status === "lunas"
                              ? "bg-[#f2fce2] text-[#4d6b14]"
                              : "bg-[#fff0e6] text-[#d97736]"
                          }`}
                        >
                          {trx.status === "lunas"
                            ? "Lunas & Koin Masuk"
                            : "Menunggu Verifikasi Admin"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              MENU 7: DASHBOARD DEVELOPER LENGKAP (TRANSAKSI, OMZET, USER, VOUCHER, PROMPT)
          ======================================================= */}
          {activeMenu === "devprompt" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-bold bg-[#14141f] text-[#d4f34a] px-3 py-1 rounded-full">
                    DASHBOARD DEVELOPER & ADMIN
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-[#14141f] mt-2">
                    Pusat Kendali Pembayaran, Pengguna, Voucher & Prompt AI
                  </h2>
                </div>

                <div className="inline-flex flex-wrap bg-[#f4f5f7] p-1.5 rounded-2xl gap-1">
                  {[
                    {
                      id: "transaksi",
                      label: `Transaksi & Payment (${daftarTransaksi.length})`,
                    },
                    { id: "overview", label: "Ringkasan Sistem" },
                    { id: "users", label: "Kelola User & Koin" },
                    { id: "voucher", label: "Generator Voucher" },
                    { id: "prompt", label: "Studio Prompt AI" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDevTab(t.id)}
                      className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-bold transition ${
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

              {/* TAB 1: TRANSAKSI, OMZET & PENGATURAN SISTEM PEMBAYARAN */}
              {devTab === "transaksi" && (
                <div className="space-y-6">
                  {/* Statistik Omzet */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-[#14141f] text-white">
                      <span className="text-xs font-normal text-slate-300">
                        Total Omzet Terverifikasi
                      </span>
                      <div className="text-2xl font-bold text-[#d4f34a] mt-1">
                        Rp{totalOmzetLunas.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200">
                      <span className="text-xs font-normal text-slate-500">
                        Transaksi Menunggu Persetujuan
                      </span>
                      <div className="text-2xl font-bold text-[#14141f] mt-1">
                        {jumlahTransaksiPending} Pesanan
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200">
                      <span className="text-xs font-normal text-slate-500">
                        Mode Verifikasi Saat Ini
                      </span>
                      <div className="text-sm font-bold text-[#14141f] mt-1.5">
                        {pengaturanPayment.modeVerifikasi === "otomatis"
                          ? "Otomatis Masuk (Instan)"
                          : "Persetujuan Manual Admin"}
                      </div>
                    </div>
                  </div>

                  {/* Pengaturan Rekening, QRIS & Mode Verifikasi */}
                  <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-4">
                    <h3 className="text-sm font-bold text-[#14141f]">
                      Pengaturan Metode Pembayaran & Verifikasi Checkout
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1">
                          Mode Verifikasi Saat User Klik "Saya Sudah Bayar":
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
                          <option value="otomatis">
                            Verifikasi Otomatis (Koin Langsung Masuk Saat Uji
                            Coba/Gateway)
                          </option>
                          <option value="manual_admin">
                            Verifikasi Manual Admin (Tunggu Diklik Terima di
                            Bawah)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1">
                          Nama Merchant QRIS:
                        </label>
                        <input
                          type="text"
                          value={pengaturanPayment.namaMerchant}
                          onChange={(e) =>
                            setPengaturanPayment({
                              ...pengaturanPayment,
                              namaMerchant: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Nomor Rekening Bank / E-Wallet Tujuan Transfer:
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
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-normal outline-none"
                      />
                    </div>
                  </div>

                  {/* Daftar Pesanan Masuk */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#14141f]">
                        Daftar Pesanan & Transaksi Masuk
                      </h3>
                      <button
                        type="button"
                        onClick={muatUlangDataSupabase}
                        className="cursor-pointer text-xs font-bold bg-[#f4f5f7] px-3 py-1.5 rounded-xl"
                      >
                        Muat Ulang Transaksi
                      </button>
                    </div>

                    {daftarTransaksi.length === 0 ? (
                      <p className="text-xs font-normal text-slate-500 py-6 text-center">
                        Belum ada transaksi pembelian paket koin.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {daftarTransaksi.map((trx) => (
                          <div
                            key={trx.id}
                            className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-[#14141f]">
                                {trx.invoice_id} • {trx.nama_user} membeli{" "}
                                <span className="underline">
                                  {trx.nama_paket}
                                </span>{" "}
                                (+{trx.jumlah_koin} Koin)
                              </div>
                              <div className="text-xs font-normal text-slate-600">
                                Nominal Unik:{" "}
                                <strong className="font-bold text-[#14141f]">
                                  Rp
                                  {Number(trx.nominal_bayar).toLocaleString(
                                    "id-ID",
                                  )}
                                </strong>{" "}
                                • Metode: {trx.metode_bayar}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {trx.status === "pending" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleApproveTransaksiAdmin(trx)
                                  }
                                  className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2 rounded-xl"
                                >
                                  ✓ Terima & Kirim {trx.jumlah_koin} Koin
                                </button>
                              ) : (
                                <span className="bg-[#f2fce2] text-[#4d6b14] text-xs font-bold px-3.5 py-1.5 rounded-full">
                                  ✓ Lunas
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: RINGKASAN SISTEM */}
              {devTab === "overview" && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200">
                    <span className="text-xs font-normal text-slate-500">
                      Total Pengguna Database
                    </span>
                    <div className="text-2xl font-bold text-[#14141f] mt-1">
                      {semuaUserDB.length || 1} User
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200">
                    <span className="text-xs font-normal text-slate-500">
                      Total Skrip Diproduksi
                    </span>
                    <div className="text-2xl font-bold text-[#14141f] mt-1">
                      {koleksiSkripTersimpan.length} Skrip
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200">
                    <span className="text-xs font-normal text-slate-500">
                      Konten Sudah Diupload
                    </span>
                    <div className="text-2xl font-bold text-[#14141f] mt-1">
                      {
                        koleksiSkripTersimpan.filter((s) => s.sudahUpload)
                          .length
                      }{" "}
                      VT
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f2fce2] border border-[#4d6b14]/20">
                    <span className="text-xs font-normal text-[#4d6b14]">
                      Status Koneksi Cloud
                    </span>
                    <div className="text-base font-bold text-[#14141f] mt-1">
                      {dbConnected ? "Supabase & AI Aktif" : "Mode Lokal"}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: KELOLA USER & KOIN */}
              {devTab === "users" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#14141f]">
                      Daftar Pengguna di Tabel `users` Supabase
                    </h3>
                    <button
                      type="button"
                      onClick={muatUlangDataSupabase}
                      className="cursor-pointer text-xs font-bold bg-[#f4f5f7] px-3 py-1.5 rounded-xl"
                    >
                      Muat Ulang Data
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {semuaUserDB.map((u) => (
                      <div
                        key={u.id}
                        className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-sm font-bold text-[#14141f]">
                            {u.nama || "Tanpa Nama"}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              ({u.profil_dna?.peranSaatIni || "Kreator"})
                            </span>
                          </div>
                          <div className="text-xs font-normal text-slate-500">
                            ID: {u.id}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                            Saldo: {u.koin} Koin
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateKoinDatabase((u.koin || 0) + 100, u.id)
                            }
                            className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3 py-1.5 rounded-xl"
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
                            className="cursor-pointer bg-white border border-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl"
                          >
                            -50 Koin
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: GENERATOR VOUCHER */}
              {devTab === "voucher" && (
                <div className="space-y-4">
                  <div className="bg-[#f4f5f7] p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Kode Voucher Baru:
                      </label>
                      <input
                        type="text"
                        value={voucherBaru.kode}
                        onChange={(e) =>
                          setVoucherBaru({
                            ...voucherBaru,
                            kode: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Contoh: BERKAH200"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Jumlah Bonus Koin:
                      </label>
                      <input
                        type="number"
                        value={voucherBaru.koin}
                        onChange={(e) =>
                          setVoucherBaru({
                            ...voucherBaru,
                            koin: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Kuota Klaim:
                      </label>
                      <input
                        type="number"
                        value={voucherBaru.kuota}
                        onChange={(e) =>
                          setVoucherBaru({
                            ...voucherBaru,
                            kuota: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                      />
                    </div>
                    <div className="flex items-end">
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
                          setVoucherBaru({ kode: "", koin: "100", kuota: "25" })
                          showToast("Kode voucher baru berhasil dibuat!")
                        }}
                        className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] text-xs font-bold py-2.5 rounded-xl"
                      >
                        + Buat Voucher
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {daftarVoucher.map((v, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="font-bold text-sm text-[#14141f]">
                            {v.kode}
                          </strong>{" "}
                          <span className="text-slate-500">
                            • Bonus +{v.koin} Koin • Terpakai: {v.terpakai}/
                            {v.kuota}
                          </span>
                        </div>
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
                </div>
              )}

              {/* TAB 5: STUDIO PROMPT AI */}
              {devTab === "prompt" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                      1. Instruksi Prompt untuk Analisis Asesmen Berantai:
                    </label>
                    <textarea
                      rows={3}
                      value={customPrompts.asesmen}
                      onChange={(e) =>
                        setCustomPrompts({
                          ...customPrompts,
                          asesmen: e.target.value,
                        })
                      }
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-2xl p-3.5 text-xs font-normal text-[#14141f] focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                      2. Instruksi Prompt untuk Pembuatan Skrip Utama & Visual:
                    </label>
                    <textarea
                      rows={3}
                      value={customPrompts.skrip}
                      onChange={(e) =>
                        setCustomPrompts({
                          ...customPrompts,
                          skrip: e.target.value,
                        })
                      }
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-2xl p-3.5 text-xs font-normal text-[#14141f] focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                      3. Instruksi Prompt untuk Ekstrak & Rewrite Video:
                    </label>
                    <textarea
                      rows={3}
                      value={customPrompts.rewrite}
                      onChange={(e) =>
                        setCustomPrompts({
                          ...customPrompts,
                          rewrite: e.target.value,
                        })
                      }
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-2xl p-3.5 text-xs font-normal text-[#14141f] focus:bg-white outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleSimpanProfilDatabase}
                className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs sm:text-sm py-4 rounded-2xl"
              >
                Simpan Seluruh Pengaturan Developer ke Database
              </button>
            </div>
          )}

          {/* =======================================================
              MENU: SYARAT & KETENTUAN
          ======================================================= */}
          {activeMenu === "syarat" && (
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                Syarat, Ketentuan & Rincian Koin
              </h2>
              <p className="text-xs font-normal text-slate-600 leading-relaxed">
                • Pembuatan Skrip Utuh: 1 Koin | Pembaruan Per Bagian & Ubah
                Bentuk Konten: Gratis (0 Koin) | Ekstrak & Rewrite Video: 2 Koin
                | Laporan Kinerja VT Sepekan: Bonus +2 Koin.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* =====================================================================
          MODAL CHECKOUT & PEMBAYARAN QRIS / TRANSFER (MUNCUL SAAT KLIK BELI PAKET)
      ===================================================================== */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-[#14141f] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold bg-[#f2fce2] text-[#4d6b14] px-2.5 py-0.5 rounded-md">
                  Tagihan #{checkoutModal.invoiceId}
                </span>
                <h3 className="text-base font-bold text-[#14141f] mt-1">
                  Pembayaran {checkoutModal.namaPaket} (+{checkoutModal.koin}{" "}
                  Koin)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutModal(null)}
                className="cursor-pointer w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Pilihan Metode Pembayaran */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#14141f]">
                Pilih Metode Pembayaran:
              </label>
              <select
                value={metodeBayarPilihan}
                onChange={(e) => setMetodeBayarPilihan(e.target.value)}
                className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
              >
                <option>QRIS Instan (Semua E-Wallet & M-Banking)</option>
                <option>Transfer Bank / SeaBank / BCA</option>
                <option>GoPay / DANA / ShopeePay / OVO</option>
              </select>
            </div>

            {/* Visual QRIS & Rincian Nominal Kode Unik */}
            <div className="bg-[#f4f5f7] p-4 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="text-xs font-bold text-[#14141f]">
                {pengaturanPayment.namaMerchant}
              </div>

              <div className="w-40 h-40 mx-auto bg-white rounded-2xl border-2 border-[#14141f] flex flex-col items-center justify-center p-3 shadow-2xs">
                <FlatIcon name="qr" className="w-24 h-24 text-[#14141f]" />
                <span className="text-[10px] font-bold text-slate-500 mt-1">
                  SCAN QRIS NASIONAL
                </span>
              </div>

              <div className="text-xs font-normal text-slate-600">
                {pengaturanPayment.infoRekening}
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-normal text-slate-500 block">
                  Total Transfer (Termasuk Kode Unik {checkoutModal.kodeUnik}):
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl font-bold text-[#14141f]">
                    Rp{checkoutModal.nominalBayar.toLocaleString("id-ID")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        String(checkoutModal.nominalBayar),
                      )
                      showToast("Nominal unik berhasil disalin!")
                    }}
                    className="cursor-pointer bg-[#f4f5f7] px-2.5 py-1 rounded-lg text-[11px] font-bold"
                  >
                    Salin
                  </button>
                </div>
              </div>

              <p className="text-[11px] font-normal text-slate-500 leading-relaxed">
                {pengaturanPayment.catatanCheckout}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCheckoutModal(null)}
                className="cursor-pointer w-1/3 bg-[#f4f5f7] text-[#14141f] font-bold text-xs py-3.5 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangProsesBayar}
                onClick={handleKonfirmasiSudahBayar}
                className="cursor-pointer flex-1 bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3.5 rounded-xl disabled:opacity-50"
              >
                {sedangProsesBayar
                  ? "Memverifikasi Pembayaran..."
                  : "Saya Sudah Bayar ➔"}
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
                <p className="text-xl sm:text-2xl font-bold leading-snug">
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
