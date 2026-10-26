"use client"
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import {
  FlatIcon,
  HookyaLogo,
  AvatarCropModal,
  hitungKuotaAkunDariPaket,
} from "../components/SharedUI"
import AuthFullscreen from "../components/AuthFullscreen"
import PersonaDNAView from "../components/PersonaDNAView"
import ScriptProducerView from "../components/ScriptProducerView"
import VideoExtractorView from "../components/VideoExtractorView"
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
    nama: "Screenshot Thread (X / Twitter)",
    modeDefault: "teks",
    ket: "Format utas bertahap yang mudah dibagikan ulang ke Instagram.",
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
    nama: "Green Screen Komentar Tren & Fakta",
    modeDefault: "voiceover",
    ket: "Tampilkan tangkapan layar berita atau produk di belakangmu.",
  },
  {
    id: 7,
    nama: "Vlog Mini Keseharian (A Day in My Life)",
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
  account_label: "@akun.utama",
  dna_badge: "DNA: Satir-Realistis | Direct Tone | Level 4 Trust",
  niche_badge: "Niche: Kreator Konten | Target: Gen-Z & Millennial",
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
  const [viewMode, setViewMode] = useState("auth")
  const [activeMenu, setActiveMenu] = useState("produksi")
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showUpgradeVIPModal, setShowUpgradeVIPModal] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [inputPinDev, setInputPinDev] = useState("")
  const [pinAdminResmi, setPinAdminResmi] = useState("123456")

  const [userId, setUserId] = useState(null)
  const [userRole, setUserRole] = useState("user")
  const [isPremiumUser, setIsPremiumUser] = useState(false)
  const [expiredAt, setExpiredAt] = useState(null)
  const [sisaHariPaket, setSisaHariPaket] = useState(30)
  const [namaPaketAktif, setNamaPaketAktif] = useState("Paket 10K")
  const [kuotaAkunMaksimal, setKuotaAkunMaksimal] = useState(2)
  const [coins, setCoins] = useState(20)
  const [toastMsg, setToastMsg] = useState("")
  const [rawCropImageSrc, setRawCropImageSrc] = useState(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 3200)
  }

  const [profil, setProfil] = useState({
    nama: "Kreator",
    username: "kreator",
    kontak: "kreator@gmail.com",
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
    minatUtama: "SaaS & Productivity",
    selfPronounInput: "Gue",
    audiencePronounInput: "Temen-temen",
    opiniKontraInput: "Gimmick motivasi tanpa langkah eksekusi nyata",
    idAkunAktif: "akun_utama",
    labelAkunSosmed: "@satria.creator",
    daftarAkunTernak: [],
  })

  const [rawWritingSamples, setRawWritingSamples] = useState("")
  const [personaProfile, setPersonaProfile] = useState(DEFAULT_PERSONA_PROFILE)
  const [bentukKonten, setBentukKonten] = useState(
    SEPULUH_BENTUK_KONTEN[0].nama,
  )
  const [daftar10IdeTopik, setDaftar10IdeTopik] = useState([])
  const [stage, setStage] = useState(0)
  const [hasilSkrip, setHasilSkrip] = useState(null)
  const [modeTampilanSkrip, setModeTampilanSkrip] = useState("voiceover")
  const [modeTeleprompter, setModeTeleprompter] = useState(false)

  const [koleksiSkripTersimpan, setKoleksiSkripTersimpan] = useState([])
  const [semuaUserDB, setSemuaUserDB] = useState([])
  const [daftarTransaksi, setDaftarTransaksi] = useState([])

  // State Arsip Skrip Tersimpan (Sesuai 1.jpg)
  const [keywordCariArsip, setKeywordCariArsip] = useState("")
  const [filterArsipPill, setFilterArsipPill] = useState("all")
  const [urutkanArsipTerbaru, setUrutkanArsipTerbaru] = useState(true)
  const [folderTerbukaMap, setFolderTerbukaMap] = useState({})
  const [pilihanGandakanArsip, setPilihanGandakanArsip] = useState({})
  const [multiplyingArchiveId, setMultiplyingArchiveId] = useState(null)

  // State Kalender Arsip Konten (Sesuai 7.jpg)
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
  const [jamPublikasiInput, setJamPublikasiInput] = useState("12:00 WIB")

  // State Pembelian Koin & Voucher (Sesuai 8.png)
  const [inputKodeVoucherUser, setInputKodeVoucherUser] = useState("")
  const [checkoutModal, setCheckoutModal] = useState(null)
  const [buktiBayarBase64, setBuktiBayarBase64] = useState("")
  const [namaFileBukti, setNamaFileBukti] = useState("")
  const [sedangProsesBayar, setSedangProsesBayar] = useState(false)

  const [pengaturanPayment, setPengaturanPayment] = useState({
    modePembayaranAktif: "qris_manual",
    namaMerchant: "HOOKYA OFFICIAL STORE",
    infoRekening: "NMID: ID1020039201992",
    noWaAdmin: "6281234567890",
    qrisImageUrl: "",
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
            jamPublikasi: row.segmen_skrip?.meta?.jamPublikasi || "12:00 WIB",
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
      await muatUlangDataSupabase()
      showToast("Konfigurasi sistem berhasil disimpan.")
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
        jamPublikasi: skripObj.jamPublikasi || "12:00 WIB",
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
    showToast(`Menyusun ${jmlX} sub-variasi ke dalam Folder...`)

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
          judul: v.judulVariasi || `Variasi ${kode}`,
          estimasiDetik: v.estimasiDetik || "45 detik",
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
      showToast(`${itemVariasiBaru.length} sub-variasi ditambahkan ke Folder.`)
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
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
      jamPublikasi: jamPublikasiInput || "12:00 WIB",
    }
    setKoleksiSkripTersimpan((prev) =>
      prev.map((s) => (s.id === itemTarget.id ? updated : s)),
    )
    await simpanAtauUpdateSkripDatabase(updated)
    showToast(
      `Skrip berhasil dijadwalkan ke ${tanggalKalenderTerpilih} (${updated.jamPublikasi})!`,
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

  // Filter Arsip Skrip
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

  // Grid Kalender (Sen - Min sesuai 7.jpg)
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
          await muatUlangDataSupabase()
          showToast("Pembayaran di-ACC & info login dikirim ke WA User.")
        }}
        simpanPengaturanDevKeDB={simpanPengaturanDevPermanen}
        muatUlangDataSupabase={muatUlangDataSupabase}
        showToast={showToast}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#191C1E] flex flex-col font-sans antialiased pt-16 pb-24">
      {toastMsg && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 bg-[#14141F] text-[#D4F34A] px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center justify-between gap-2">
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
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#14141F] w-full max-w-sm rounded-2xl p-6 space-y-4 text-center border border-[#E2E8F0]">
            <div className="w-11 h-11 rounded-xl bg-[#14141F] text-[#D4F34A] flex items-center justify-center text-xs font-bold mx-auto">
              VIP
            </div>
            <h3 className="text-base font-bold">
              Fitur Khusus Paket VIP (Rp 20.000+)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upgrade ke Paket VIP untuk membuka fitur Rekam Suara, Scan
              Screenshot Marketplace, Ekstrak Audio Video, dan Kuota Multi-Akun
              lebih besar.
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
                className="cursor-pointer flex-1 bg-[#14141F] text-[#D4F34A] font-bold text-xs py-3 rounded-lg"
              >
                Lihat Paket Koin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIXED TOP HEADER (SESUAI STITCH SHELL) */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-[#E2E8F0] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 max-w-4xl">
          {activeMenu !== "produksi" && (
            <button
              type="button"
              onClick={() => setActiveMenu("produksi")}
              aria-label="Kembali"
              className="cursor-pointer w-9 h-9 rounded-full hover:bg-[#F3F4F6] flex items-center justify-center text-[#14141F]"
            >
              <FlatIcon name="arrowLeft" className="w-5 h-5" />
            </button>
          )}
          <div
            onClick={() => setActiveMenu("produksi")}
            className="cursor-pointer"
          >
            <HookyaLogo />
          </div>
        </div>

        <div className="relative flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveMenu("dna")}
            className={`cursor-pointer hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
              activeMenu === "dna"
                ? "bg-[#14141F] text-[#D4F34A] border-[#14141F]"
                : "bg-[#F3F4F6] text-[#14141F] border-[#E2E8F0]"
            }`}
          >
            <span>
              {profil.labelAkunSosmed || `@${profil.username || "profil"}`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu("topup")}
            className="cursor-pointer flex items-center gap-1.5 bg-[#D4F34A] text-[#14141F] px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs active:scale-95 transition"
          >
            <FlatIcon name="coin" className="w-4 h-4" />
            <span>{coins} Koin</span>
          </button>

          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-label="Profil Akun"
            className="cursor-pointer w-9 h-9 rounded-full bg-[#F3F4F6] border border-[#E2E8F0] text-[#14141F] flex items-center justify-center"
          >
            <FlatIcon name="user" className="w-4 h-4" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-4 z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#14141F] truncate">
                    {profil.nama}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {namaPaketAktif} • Maks {kuotaAkunMaksimal} Akun
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(false)}
                  className="cursor-pointer w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false)
                  setActiveMenu("dna")
                }}
                className="cursor-pointer w-full py-2.5 px-3 rounded-lg bg-[#14141F] text-[#D4F34A] text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <FlatIcon name="dna" className="w-4 h-4" />
                <span>Profil Akun & Gaya Bicara</span>
              </button>

              {isAdminAccount && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false)
                    setShowPinModal(true)
                  }}
                  className="cursor-pointer w-full py-2.5 px-3 rounded-lg bg-[#F3F4F6] hover:bg-slate-200 text-[#14141F] text-xs font-bold flex items-center justify-center gap-1.5"
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
                  }
                  setViewMode("auth")
                }}
                className="cursor-pointer w-full py-2 px-3 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold"
              >
                Keluar / Ganti Akun
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 w-full px-4 pt-4">
        {activeMenu === "dna" && (
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
            bentukKontenFinal={bentukKonten}
            simpanAtauUpdateSkripDatabase={simpanAtauUpdateSkripDatabase}
            setKoleksiSkripTersimpan={setKoleksiSkripTersimpan}
            setHasilSkrip={setHasilSkrip}
            setStage={setStage}
            setActiveMenu={setActiveMenu}
            showToast={showToast}
          />
        )}

        {/* MENU ARSIP SKRIP TERSIMPAN (SESUAI 1.JPG) */}
        {activeMenu === "tersimpan" && (
          <div className="max-w-3xl mx-auto space-y-4 pb-8">
            <section className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    Manajemen Konten
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-[#E7E8EA] px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4D6B14]" />
                    <span>{koleksiSkripTersimpan.length} Total Naskah</span>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#191C1E] tracking-tight">
                  Arsip Skrip Tersimpan
                </h1>
                <p className="text-xs sm:text-sm text-slate-600">
                  Kelola, gandakan variasi hook, dan jadwalkan naskah kontenmu
                  ke kalender publikasi.
                </p>
              </div>

              <div className="relative w-full">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <FlatIcon name="search" className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={keywordCariArsip}
                  onChange={(e) => setKeywordCariArsip(e.target.value)}
                  placeholder="Ketik kata kunci judul atau isi materi..."
                  className="w-full h-12 pl-10 pr-16 bg-white rounded-xl border border-[#C8C5CC] text-base sm:text-sm focus:border-[#14141F] focus:outline-none"
                />
                {keywordCariArsip && (
                  <button
                    type="button"
                    onClick={() => setKeywordCariArsip("")}
                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500"
                  >
                    Hapus
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMenu("kalender")}
                  className="cursor-pointer inline-flex items-center gap-2 bg-white border border-[#C8C5CC] text-[#191C1E] text-xs font-bold rounded-lg px-3.5 py-2.5 min-h-[44px]"
                >
                  <FlatIcon name="calendar" className="w-4 h-4" />
                  <span>Kalender Arsip Konten</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUrutkanArsipTerbaru(!urutkanArsipTerbaru)}
                  className="cursor-pointer px-3 py-2.5 rounded-lg bg-white border border-[#C8C5CC] text-xs font-bold min-h-[44px]"
                >
                  {urutkanArsipTerbaru ? "Terbaru" : "Terlama"}
                </button>
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
                        : "bg-white border border-[#C8C5CC] text-slate-600 font-semibold"
                    }`}
                  >
                    {fp.label}
                  </button>
                ))}
              </div>
            </section>

            {arsipTerfilter.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#C8C5CC] p-8 text-center text-xs text-slate-500">
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

                  return (
                    <article
                      key={item.id}
                      className="bg-white border border-[#C8C5CC] rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-slate-500">
                            {item.waktuDibuat}
                          </span>
                          <span>•</span>
                          {item.sudahUpload && item.tanggalUpload ? (
                            <span className="inline-flex items-center gap-1 bg-[#F2FCE2] text-[#244605] px-2 py-0.5 rounded-md font-semibold">
                              Terjadwal: {item.tanggalUpload}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-[#F3F4F6] text-slate-600 px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                              Belum Terjadwal
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleFavoritArsip(item)}
                          className={`cursor-pointer w-8 h-8 rounded-full flex items-center justify-center ${
                            item.isStarred
                              ? "text-[#14141F]"
                              : "text-slate-300 hover:text-slate-500"
                          }`}
                        >
                          <FlatIcon name="star" className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <h2 className="text-sm sm:text-base font-bold text-[#191C1E] leading-snug">
                          {item.judul}
                        </h2>
                        <div>
                          <span className="inline-flex items-center gap-1 bg-[#F0EEFF] text-[#362B6B] px-2.5 py-0.5 rounded-md text-xs font-semibold">
                            {item.bentuk}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
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
                              : "bg-white border border-[#C8C5CC] text-[#191C1E]"
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
                          className="cursor-pointer inline-flex items-center gap-1.5 bg-[#F3F4F6] hover:bg-slate-200 text-[#191C1E] rounded-lg px-3.5 py-2 text-xs font-bold min-h-[42px]"
                        >
                          <span>Buka Skrip</span>
                          <FlatIcon name="arrowRight" className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isFolderOpen && (
                        <div className="border border-[#C8C5CC] bg-[#F8FAFC] rounded-xl p-3 space-y-2.5">
                          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5 text-[11px]">
                            <span className="font-bold text-[#191C1E] uppercase">
                              {listFolder.length} Sub-Variasi Hook & Angle
                              Materi:
                            </span>
                            <span className="text-slate-500">
                              Auto-Generated
                            </span>
                          </div>

                          {listFolder.length === 0 ? (
                            <p className="text-xs text-slate-500 py-2">
                              Folder masih kosong. Pilih jumlah variasi di bawah
                              lalu klik Buat ke Folder.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {listFolder.map((vf, vIdx) => (
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
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded bg-[#E7E8EA] text-[#191C1E] text-[11px] font-bold flex items-center justify-center shrink-0">
                                      {vf.kodeHuruf ||
                                        String.fromCharCode(65 + vIdx)}
                                    </span>
                                    <p className="text-xs font-semibold text-[#191C1E] truncate">
                                      {vf.judul}
                                    </p>
                                  </div>
                                  <span className="shrink-0 text-[11px] bg-[#F3F4F6] text-slate-600 px-2 py-0.5 rounded">
                                    Buka
                                  </span>
                                </div>
                              ))}
                            </div>
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
                            className="w-full h-11 pl-3 pr-8 bg-white text-[#191C1E] text-xs font-bold rounded-lg border border-[#C8C5CC] appearance-none focus:outline-none"
                          >
                            <option value="2">
                              Gandakan: 2 Variasi (1 Koin)
                            </option>
                            <option value="5">
                              Gandakan: 5 Variasi (2 Koin)
                            </option>
                            <option value="10">
                              Gandakan: 10 Variasi (3 Koin)
                            </option>
                          </select>
                          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                            <FlatIcon name="chevronDown" className="w-4 h-4" />
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={sedangGandakanIni}
                          onClick={() => handleGandakanDariArsip(item)}
                          className="cursor-pointer inline-flex items-center gap-1.5 bg-[#14141F] text-white text-xs font-bold px-4 py-2.5 rounded-lg min-h-[44px] shrink-0 disabled:opacity-50"
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

        {/* MENU KALENDER ARSIP KONTEN (SESUAI 7.JPG) */}
        {activeMenu === "kalender" && (
          <div className="max-w-3xl mx-auto space-y-4 pb-8">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-[#191C1E]">
                  Kalender Arsip Konten
                </h1>
                <div className="flex items-center gap-1 bg-[#EDEFF0] px-2 py-1 rounded-lg">
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

              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#D4F34A]" />
                  <span>
                    <strong className="text-[#191C1E]">
                      {jmlTerjadwal} Skrip
                    </strong>{" "}
                    Terjadwal
                  </span>
                </div>
                <span className="text-[11px] font-semibold bg-[#E7E8EA] px-2.5 py-0.5 rounded">
                  {jmlBelumTerjadwal} Belum Terjadwal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "all", label: "Semua Format" },
                { id: "reels", label: "Reels & TikTok" },
                { id: "carousel", label: "Carousel" },
                { id: "thread", label: "Thread" },
              ].map((flt) => (
                <button
                  key={flt.id}
                  type="button"
                  onClick={() => setFilterFormatKalender(flt.id)}
                  className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
                    filterFormatKalender === flt.id
                      ? "bg-[#14141F] text-white"
                      : "bg-white text-slate-600 border border-[#E2E8F0]"
                  }`}
                >
                  {flt.label}
                </button>
              ))}
            </div>

            {/* Compact Monthly Calendar View */}
            <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#191C1E]">
                  Jadwal Kalender
                </span>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#D4F34A]" />{" "}
                    Terisi
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#14141F]" /> Aktif
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-500 py-1">
                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {gridHariKalender.map((cell, idx) => {
                  if (!cell) return <div key={`e_${idx}`} className="h-10" />
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
                            ? "bg-[#EDEFF0] text-[#191C1E] font-bold"
                            : "hover:bg-[#F3F4F6] text-[#191C1E]"
                      }`}
                    >
                      <span>{cell.hari}</span>
                      {skripHariIni.length > 0 && (
                        <>
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                              aktif ? "bg-[#D4F34A]" : "bg-[#14141F]"
                            }`}
                          />
                          <span className="absolute top-0.5 right-0.5 text-[9px] font-bold px-1 bg-[#D4F34A] text-[#14141F] rounded-full leading-tight">
                            {skripHariIni.length}
                          </span>
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected Date Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-base font-bold text-[#191C1E]">
                    Jadwal: {tanggalKalenderTerpilih}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {daftarSkripTanggalTerpilih.length} Naskah terjadwal siap
                    posting
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-[#D4F34A] text-[#14141F] font-bold rounded-md text-xs">
                  {namaHariTerpilih}
                </span>
              </div>

              {daftarSkripTanggalTerpilih.map((sk) => (
                <div
                  key={sk.id}
                  className="bg-white rounded-2xl p-4 border border-[#E2E8F0] space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#EDEFF0] px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                        <FlatIcon name="clock" className="w-3.5 h-3.5" />
                        <span>{sk.jamPublikasi || "12:00 WIB"}</span>
                      </span>
                      <span className="bg-[#D4F34A] text-[#14141F] font-bold px-2 py-0.5 rounded text-[11px]">
                        {sk.bentuk}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {profil.labelAkunSosmed}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#191C1E]">
                      {sk.judul}
                    </h3>
                    {sk.segmen?.[0]?.spokenText && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        Hook: {sk.segmen[0].spokenText}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[#2A6C00] font-semibold flex items-center gap-1">
                      <FlatIcon name="check" className="w-3.5 h-3.5" />
                      <span>Skrip Lengkap</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setHasilSkrip(sk)
                          setStage(5)
                          setActiveMenu("produksi")
                        }}
                        className="cursor-pointer px-3.5 min-h-[40px] rounded-lg bg-[#EDEFF0] hover:bg-slate-200 text-xs font-bold"
                      >
                        Buka
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLepasJadwalKalender(sk)}
                        className="cursor-pointer px-3.5 min-h-[40px] rounded-lg bg-[#EDEFF0] hover:bg-rose-100 hover:text-rose-700 text-xs font-bold"
                      >
                        Lepas
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Tambahkan Skrip dari Arsip */}
              <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[#D4F34A] text-[#14141F] font-bold flex items-center justify-center">
                    <FlatIcon name="plus" className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-bold text-[#191C1E]">
                    Tambahkan Skrip dari Arsip
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-500 block">
                    Pilih Skrip Tersimpan
                  </label>
                  <div className="relative">
                    <select
                      value={idSkripPlotTerpilih}
                      onChange={(e) => setIdSkripPlotTerpilih(e.target.value)}
                      className="w-full min-h-[44px] bg-[#F3F4F6] rounded-lg px-3 pr-8 text-base sm:text-xs font-semibold text-[#191C1E] appearance-none focus:outline-none"
                    >
                      <option value="">-- Pilih Skrip dari Arsip --</option>
                      {koleksiSkripTersimpan.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.judul}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <FlatIcon name="chevronDown" className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-500 block">
                    Jam Publikasi
                  </label>
                  <input
                    type="text"
                    value={jamPublikasiInput}
                    onChange={(e) => setJamPublikasiInput(e.target.value)}
                    placeholder="Contoh: 12:00 WIB"
                    className="w-full min-h-[44px] bg-[#F3F4F6] rounded-lg px-3 text-base sm:text-xs font-semibold text-[#191C1E] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePlotSkripKeKalender}
                  className="cursor-pointer w-full min-h-[48px] bg-[#D4F34A] text-[#14141F] font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 active:scale-[0.99] transition"
                >
                  <FlatIcon name="calendar" className="w-4 h-4" />
                  <span>Jadwalkan ke {tanggalKalenderTerpilih}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MENU BELI PAKET KOIN HOOKYA (SESUAI 8.PNG) */}
        {activeMenu === "topup" && (
          <div className="max-w-3xl mx-auto space-y-5 pb-8">
            <section className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 bg-[#E7E8EA] px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#D4F34A]" />
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Top-up Akun Hookya
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#191C1E]">
                Beli Paket Koin Hookya
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                Koin digunakan untuk generate naskah AI, ekstrak audio video,
                dan penggandaan variasi naskah.
              </p>
            </section>

            {/* Current Balance Card */}
            <section className="bg-white rounded-xl p-4 border border-[#E2E8F0] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
                    Saldo Koin Aktif
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-bold text-[#191C1E]">
                      {coins}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">
                      Koin ({sisaHariPaket} Hari Aktif)
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#D4F34A] flex items-center justify-center text-[#14141F]">
                  <FlatIcon name="coin" className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-[#F3F4F6] rounded-lg p-2.5 flex items-center gap-2 text-xs text-[#191C1E]">
                <FlatIcon
                  name="check"
                  className="w-4 h-4 text-[#2A6C00] shrink-0"
                />
                <span>
                  Koin aktif diakumulasi dan tidak hangus selama akun aktif.
                </span>
              </div>
            </section>

            {/* Voucher Code Section */}
            <section className="bg-white rounded-xl p-4 border border-[#E2E8F0] space-y-2.5">
              <label className="text-xs font-bold text-[#191C1E] block">
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
                  className="flex-1 h-12 bg-[#F3F4F6] rounded-lg px-4 text-base sm:text-xs font-bold uppercase focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleKlaimVoucherUser}
                  className="cursor-pointer h-12 px-5 bg-[#14141F] text-[#D4F34A] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Klaim Voucher</span>
                  <FlatIcon name="arrowRight" className="w-4 h-4" />
                </button>
              </div>
            </section>

            {/* 7 Coin Packages Grid */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#191C1E]">
                  Pilih Nominal Paket
                </h2>
                <span className="text-xs text-slate-500">7 Opsi Tersedia</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {DAFTAR_PAKET_KOIN.map((pk) => (
                  <article
                    key={pk.nama}
                    className={`bg-white rounded-xl p-4 border border-[#E2E8F0] flex flex-col justify-between relative overflow-hidden ${
                      pk.agency ? "sm:col-span-2 lg:col-span-3" : ""
                    }`}
                  >
                    {pk.populer && (
                      <span className="absolute top-0 right-0 bg-[#E3E0F1] text-[#1B1B26] text-[10px] px-3 py-1 rounded-bl-lg font-bold">
                        Paling Populer
                      </span>
                    )}
                    {pk.bestValue && (
                      <span className="absolute top-0 right-0 bg-[#D4F34A] text-[#14141F] text-[10px] px-3 py-1 rounded-bl-lg font-bold">
                        Best Value
                      </span>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            pk.agency
                              ? "bg-[#14141F] text-white"
                              : "text-slate-500"
                          }`}
                        >
                          {pk.tier}
                        </span>
                        <span className="text-[11px] text-slate-600 bg-[#E7E8EA] px-2 py-0.5 rounded font-semibold">
                          Maks {pk.kuotaAkun} Akun Sosmed
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-[#191C1E]">
                        {pk.nama}
                      </h3>

                      {pk.ket && (
                        <p className="text-xs text-slate-500">{pk.ket}</p>
                      )}

                      <div className="flex items-baseline gap-1.5 pt-1">
                        <span className="text-2xl font-bold text-[#191C1E]">
                          {pk.koin}
                        </span>
                        <span className="text-xs font-bold text-[#556500]">
                          Koin
                        </span>
                      </div>
                      <p className="text-lg font-bold text-[#191C1E]">
                        {pk.harga}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <FlatIcon
                          name="clock"
                          className="w-3.5 h-3.5 text-[#556500]"
                        />
                        <span>Rollover Aktif 30 Hari</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => bukaLayarCheckoutPaket(pk)}
                        className={`cursor-pointer w-full h-11 rounded-lg text-xs font-bold flex items-center justify-center transition ${
                          pk.bestValue
                            ? "bg-[#D4F34A] text-[#14141F]"
                            : pk.populer || pk.agency
                              ? "bg-[#14141F] text-[#D4F34A]"
                              : "bg-[#E7E8EA] text-[#191C1E] hover:bg-slate-300"
                        }`}
                      >
                        Beli
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR (5 ITEMS WITH CENTER "+" BUTTON) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        <div className="max-w-lg mx-auto h-16 px-2 flex items-center justify-around relative">
          <button
            type="button"
            onClick={() => setActiveMenu("rewrite")}
            className={`cursor-pointer flex flex-col items-center justify-center flex-1 py-1 transition ${
              activeMenu === "rewrite"
                ? "text-[#14141F] font-bold"
                : "text-slate-500 hover:text-[#14141F]"
            }`}
          >
            <FlatIcon name="mic" className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">Ekstrak</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu("tersimpan")}
            className={`cursor-pointer flex flex-col items-center justify-center flex-1 py-1 transition ${
              activeMenu === "tersimpan"
                ? "text-[#14141F] font-bold"
                : "text-slate-500 hover:text-[#14141F]"
            }`}
          >
            <FlatIcon name="folder" className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">Arsip</span>
          </button>

          <div className="flex items-center justify-center flex-1 relative">
            <button
              type="button"
              aria-label="Buat Skrip Konten"
              onClick={() => {
                setStage(0)
                setActiveMenu("produksi")
              }}
              className="cursor-pointer absolute -top-6 w-14 h-14 rounded-full bg-[#14141F] text-[#D4F34A] shadow-lg border-2 border-white flex items-center justify-center active:scale-95 transition-transform"
            >
              <FlatIcon name="plus" className="w-7 h-7" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveMenu("kalender")}
            className={`cursor-pointer flex flex-col items-center justify-center flex-1 py-1 transition ${
              activeMenu === "kalender"
                ? "text-[#14141F] font-bold"
                : "text-slate-500 hover:text-[#14141F]"
            }`}
          >
            <FlatIcon name="calendar" className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">Kalender</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenu("topup")}
            className={`cursor-pointer flex flex-col items-center justify-center flex-1 py-1 transition ${
              activeMenu === "topup"
                ? "text-[#14141F] font-bold"
                : "text-slate-500 hover:text-[#14141F]"
            }`}
          >
            <FlatIcon name="coin" className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">Koin</span>
          </button>
        </div>
      </nav>

      {/* MODAL CHECKOUT QRIS */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-[#14141F] w-full max-w-md rounded-2xl p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold bg-[#F2FCE2] text-[#4D6B14] px-2 py-0.5 rounded-md">
                  Invoice #{checkoutModal.invoiceId}
                </span>
                <h3 className="text-base font-bold mt-0.5">
                  {checkoutModal.namaPaket} (+{checkoutModal.koin} Koin)
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

            <div className="bg-[#F4F5F7] p-4 rounded-xl text-center space-y-2 border border-slate-200">
              <div className="text-xs font-bold text-slate-600">
                1. Scan QRIS Statis & Transfer Sesuai Nominal:
              </div>
              {pengaturanPayment.qrisImageUrl ? (
                <img
                  src={pengaturanPayment.qrisImageUrl}
                  alt="QRIS Merchant"
                  className="w-48 h-48 mx-auto rounded-lg object-contain bg-white p-2 border border-slate-200"
                />
              ) : (
                <FlatIcon
                  name="qr"
                  className="w-28 h-28 mx-auto text-[#14141F]"
                />
              )}
              <div className="text-2xl font-bold text-[#14141F]">
                Rp {checkoutModal.nominalBayar.toLocaleString("id-ID")}
              </div>
              <p className="text-[11px] text-slate-500">
                {pengaturanPayment.namaMerchant} (
                {pengaturanPayment.infoRekening})
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#14141F]">
                2. Upload Foto Bukti Pembayaran:
              </label>
              <label className="cursor-pointer border border-dashed border-slate-300 hover:border-[#14141F] bg-[#F4F5F7] rounded-xl p-3.5 flex items-center gap-3">
                {buktiBayarBase64 ? (
                  <img
                    src={buktiBayarBase64}
                    alt="Bukti"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-300 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#14141F] text-[#D4F34A] flex items-center justify-center shrink-0">
                    <FlatIcon name="upload" className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <div className="text-xs font-bold text-[#14141F] truncate">
                    {namaFileBukti || "Tap untuk Pilih Foto Bukti Transfer"}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Format JPG atau PNG
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
                {sedangProsesBayar
                  ? "Mengirim..."
                  : "Konfirmasi & Kirim ke WA Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PIN DEVELOPER CONSOLE */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#14141F] w-full max-w-sm rounded-2xl p-6 space-y-4 text-center">
            <h3 className="text-base font-bold">Buka Developer Console</h3>
            <input
              type="password"
              value={inputPinDev}
              onChange={(e) => setInputPinDev(e.target.value)}
              placeholder="Masukkan PIN Admin..."
              className="w-full bg-[#F4F5F7] border border-slate-200 rounded-lg px-4 py-3 text-center text-base sm:text-sm font-bold outline-none"
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
                    setViewMode("dev")
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
        <div className="fixed inset-0 bg-[#14141F]/95 z-50 flex flex-col justify-between p-6 text-white">
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
