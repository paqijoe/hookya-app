"use client"
import { useState, useEffect, useMemo } from "react"
import { supabase } from "../lib/supabase"
import {
  FlatIcon,
  NICHE_PROFILING_MIN_PLAN_PRICE,
  cekAksesNicheProfiling,
} from "./SharedUI"

// 10 Pertanyaan Mode Quick + 8 Pertanyaan Tambahan Mode Deep (Bagian 4)
const DAFTAR_PERTANYAAN_NICHE = [
  {
    id: "q1_hours",
    mode: "quick",
    aspek: "Konteks Waktu",
    pertanyaan:
      "Berapa jam per minggu yang realistis bisa kamu luangkan untuk bikin konten?",
    tipe: "single",
    essential: true,
    opsi: [
      "Kurang dari 3 jam / minggu (Sangat sibuk)",
      "3 - 7 jam / minggu (1 konten sehari / dua hari sekali)",
      "7 - 14 jam / minggu (Rutin setiap hari)",
      "Lebih dari 14 jam / minggu (Fokus penuh)",
    ],
  },
  {
    id: "q2_goal",
    mode: "quick",
    aspek: "Konteks Tujuan",
    pertanyaan: "Apa tujuan utama kamu bikin konten TikTok saat ini?",
    tipe: "single",
    essential: true,
    opsi: [
      "Jualan produk sendiri (UMKM / Brand sendiri)",
      "TikTok Shop / Afiliasi (Kejar komisi affiliate)",
      "Menawarkan jasa / konsultasi / freelance",
      "Personal branding & bangun otoritas profesi",
      "Cari penghasilan tambahan dari nol",
      "Hobi & berbagi cerita keseharian",
    ],
  },
  {
    id: "q3_love_topics",
    mode: "quick",
    aspek: "Lingkaran Cinta (Love)",
    pertanyaan:
      "Sebutkan 3 topik yang paling sering kamu cari, tonton, atau bahas panjang lebar tanpa disuruh siapa pun.",
    tipe: "text",
    essential: true,
    minLength: 12,
    placeholder:
      "Contoh: Meracik kopi manual brew di rumah, bedah gadget murah awet, dan ngatur gaji UMR biar bisa nabung...",
  },
  {
    id: "q4_love_activity",
    mode: "quick",
    aspek: "Lingkaran Cinta (Love)",
    pertanyaan:
      "Aktivitas atau kegiatan apa yang kalau kamu kerjakan bisa bikin kamu lupa waktu?",
    tipe: "text",
    essential: true,
    minLength: 10,
    placeholder:
      "Contoh: Ngulik desain poster di laptop, beresin kamar/rumah, masak menu praktis, atau ngobrolin strategi jualan...",
  },
  {
    id: "q5_good_at_help",
    mode: "quick",
    aspek: "Lingkaran Kuasai (Good At)",
    pertanyaan:
      "Hal apa yang paling sering orang sekitar minta tolong atau minta saran ke kamu? Ceritakan hasil nyata yang pernah kamu capai.",
    tipe: "text",
    essential: true,
    minLength: 15,
    placeholder:
      "Contoh: Teman sering minta rekomendasi skincare kulit berminyak karena jerawatku sembuh dalam 3 bulan tanpa krim dokter...",
  },
  {
    id: "q6_skills",
    mode: "quick",
    aspek: "Lingkaran Kuasai (Good At)",
    pertanyaan:
      "Pilih skill atau pengalaman nyata yang kamu punya saat ini (bisa pilih lebih dari satu & tambah sendiri):",
    tipe: "multi_custom",
    essential: true,
    opsi: [
      "Jualan / Marketing / Copywriting",
      "Masak / Kuliner / Baking",
      "Skincare / Makeup / Fashion",
      "Gadget / Teknologi / Coding",
      "Desain Grafis / Edit Video",
      "Keuangan Pribadi / Investasi",
      "Olahraga / Lari / Gym / Diet",
      "Parenting / Rumah Tangga",
      "Mengajar / Presentasi / Bahasa",
    ],
    placeholder: "Tambahkan skill/pengalaman spesifik lainnya jika ada...",
  },
  {
    id: "q7_audience_problem",
    mode: "quick",
    aspek: "Lingkaran Dibutuhkan (Need)",
    pertanyaan:
      "Masalah atau keluhan apa yang paling sering kamu lihat dialami orang di sekitarmu atau komunitasmu?",
    tipe: "text",
    essential: true,
    minLength: 12,
    placeholder:
      "Contoh: Banyak ibu muda bingung nyiapin bekal anak yang cepat di pagi hari, atau anak kos sering boncos beli makan online...",
  },
  {
    id: "q8_monetize",
    mode: "quick",
    aspek: "Lingkaran Monetisasi",
    pertanyaan:
      "Cara menghasilkan uang (monetisasi) apa yang paling kamu minati dari TikTok?",
    tipe: "multi",
    essential: true,
    opsi: [
      "Komisi TikTok Shop / Keranjang Kuning Affiliate",
      "Jualan produk fisik / digital milik sendiri",
      "Jualan jasa / kelas / konsultasi",
      "Endorse / Sponsorship brand",
      "Live Streaming & Gift",
      "Belum tahu, ingin dipilihkan yang paling cocok",
    ],
  },
  {
    id: "q9_style",
    mode: "quick",
    aspek: "Gaya Penyampaian",
    pertanyaan:
      "Gaya penyampaian seperti apa yang paling nyaman dan terasa jadi dirimu sendiri?",
    tipe: "single",
    essential: true,
    opsi: [
      "Santai, akrab, seperti ngobrol sama teman dekat",
      "Edukatif, runtut, dan to-the-point",
      "Storytelling (cerita pengalaman & pelajaran hidup)",
      "Tegas, blak-blakan, dan berani beda opini",
      "Tenang, kalem, dan fokus visual estetik",
    ],
  },
  {
    id: "q10_comfort",
    mode: "quick",
    aspek: "Format Tampil",
    pertanyaan: "Seberapa nyaman kamu tampil di depan kamera?",
    tipe: "single",
    essential: true,
    opsi: [
      "Siap tampil wajah & bicara langsung (Talking Head)",
      "Voice-over saja (Rekam aktivitas/produk + isi suara tanpa wajah)",
      "Faceless penuh (Hanya teks di layar + visual B-roll / tangan)",
    ],
  },

  // 8 PERTANYAAN TAMBAHAN KHUSUS MODE DEEP
  {
    id: "q11_deep_proof",
    mode: "deep",
    aspek: "Bukti & Portofolio (Deep)",
    pertanyaan:
      "Apa pencapaian, angka, atau pengalaman nyata yang bisa kamu tunjukkan sebagai bukti ke penonton?",
    tipe: "text",
    essential: false,
    placeholder:
      "Contoh: Pernah turun BB 8 kg dalam 2 bulan, sudah jual 500 pcs produk, atau pengalaman kerja 4 tahun di bidang admin...",
  },
  {
    id: "q12_deep_friends",
    mode: "deep",
    aspek: "Sudut Pandang Orang Terdekat (Deep)",
    pertanyaan: "Apa yang pernah dikatakan orang lain tentang kelebihanmu?",
    tipe: "text_with_template",
    essential: false,
    templateWA:
      "Halo! Aku lagi nyusun konsep konten TikTok nih. Menurut kamu, 1 hal atau topik apa sih yang paling cocok aku bahas karena aku kelihatan paham banget di situ? Makasih ya!",
    placeholder:
      "Contoh: Kata teman-teman aku orangnya sabar banget kalau ngejelasin hal rumit jadi gampang dipahami...",
  },
  {
    id: "q13_deep_past_failure",
    mode: "deep",
    aspek: "Evaluasi Kendala (Deep)",
    pertanyaan:
      "Pernah gagal atau berhenti ngonten sebelumnya? Apa yang bikin kamu malas atau mentok waktu itu?",
    tipe: "text",
    essential: false,
    placeholder:
      "Contoh: Pernah berhenti karena capek ngedit terlalu lama dan kehabisan ide setelah 5 video...",
  },
  {
    id: "q14_deep_gear",
    mode: "deep",
    aspek: "Modal & Peralatan (Deep)",
    pertanyaan: "Peralatan dan modal apa saja yang sudah kamu miliki sekarang?",
    tipe: "multi",
    essential: false,
    opsi: [
      "Hanya HP (Kamera & Mic bawaan HP)",
      "Mic Wireless / Clip-on",
      "Tripod / Ring Light / Pencahayaan",
      "Laptop / PC untuk edit",
      "Budget beli sampel produk untuk direview",
    ],
  },
  {
    id: "q15_deep_inspiration",
    mode: "deep",
    aspek: "Referensi Kreator (Deep)",
    pertanyaan:
      "Sebutkan 1-2 akun TikTok yang kamu kagumi dan apa alasan kamu suka gaya konten mereka?",
    tipe: "text",
    essential: false,
    placeholder:
      "Contoh: Suka akun review jujur yang langsung nunjukin plus minus barang tanpa basa-basi...",
  },
  {
    id: "q16_deep_target_persona",
    mode: "deep",
    aspek: "Detail Audiens (Deep)",
    pertanyaan:
      "Siapa audiens yang paling ingin kamu bantu? (Rentang umur, kondisi mereka, dan masalah utamanya)",
    tipe: "text",
    essential: false,
    placeholder:
      "Contoh: Pekerja kantoran umur 22-30 tahun yang gajinya selalu habis di tengah bulan...",
  },
  {
    id: "q17_deep_3months",
    mode: "deep",
    aspek: "Target 3 Bulan (Deep)",
    pertanyaan:
      "Apa target paling realistis yang ingin kamu capai dalam 3 bulan ke depan?",
    tipe: "text",
    essential: false,
    placeholder:
      "Contoh: Konsisten upload 60 video, pecah telur komisi affiliate rutin setiap minggu...",
  },
  {
    id: "q18_deep_avoid",
    mode: "deep",
    aspek: "Batasan Pribadi (Deep)",
    pertanyaan:
      "Topik atau hal apa yang TIDAK mau kamu bahas sama sekali di kontenmu?",
    tipe: "text",
    essential: false,
    placeholder:
      "Contoh: Tidak mau bahas gosip artis, politik, atau pamer saldo rekening...",
  },
]

// Contoh Statis (Dummy Preview) untuk User yang Belum Berhak (Tanpa Memanggil AI API - Bagian 2)
const DUMMY_PREVIEW_LOCKED = {
  nicheName: "Edukasi Produktivitas & Setup Kerja Hemat untuk Pekerja Hybrid",
  audience:
    "Pekerja muda & freelancer (21-30 tahun) yang sering pegal & kurang fokus kerja di kamar",
  problem:
    "Meja kerja berantakan, budget terbatas untuk beli alat kerja ergonomis",
  angle:
    "Voice-over + POV meja kerja (Review jujur & komparasi sebelum-sesudah)",
  totalScore: 92,
  pillars: [
    "Review Jujur Alat Kerja < Rp150 Ribu",
    "Tips Fokus Kerja Tanpa Burnout",
    "Makeover Sudut Kamar Sempit",
  ],
}

export default function NicheProfilingView({
  userId,
  namaUser,
  namaPaketAktif = "Paket 10K",
  nominalPaketAktif = 10000,
  expiredAt = null,
  isAdmin = false,
  aiModel1 = "anthropic/claude-3.5-haiku",
  onUpgradeClick,
  onUseTopicForScript,
  onProfileUpdated,
  showToast,
}) {
  const draftStorageKey = `hookya_niche_draft_${userId || "guest"}`

  // Cek hak akses berdasarkan harga paket (> Rp20.000) & status kedaluwarsa
  const infoAkses = useMemo(
    () =>
      cekAksesNicheProfiling({
        namaPaket: namaPaketAktif,
        nominalPaket: nominalPaketAktif,
        expiredAt,
        isAdmin,
      }),
    [namaPaketAktif, nominalPaketAktif, expiredAt, isAdmin],
  )

  const [screen, setScreen] = useState("entry") // "entry" | "questionnaire" | "loading" | "report" | "topics"
  const [quizMode, setQuizMode] = useState("quick") // "quick" | "deep"
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [customSkillInput, setCustomSkillInput] = useState("")
  const [validationError, setValidationError] = useState("")
  const [apiErrorMsg, setApiErrorMsg] = useState("")

  const [activeProfile, setActiveProfile] = useState(null)
  const [profilesHistory, setProfilesHistory] = useState([])
  const [topicIdeas, setTopicIdeas] = useState([])
  const [selectedPillarFilter, setSelectedPillarFilter] = useState("ALL")
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false)

  // State edit kustom nama niche & audiens sebelum disimpan
  const [isEditingNicheCustom, setIsEditingNicheCustom] = useState(false)
  const [customNicheName, setCustomNicheName] = useState("")
  const [customNicheAudience, setCustomNicheAudience] = useState("")

  const daftarPertanyaanAktif = useMemo(() => {
    if (quizMode === "deep") return DAFTAR_PERTANYAAN_NICHE
    return DAFTAR_PERTANYAAN_NICHE.filter((q) => q.mode === "quick")
  }, [quizMode])

  // Muat draft lokal & profil aktif dari server saat dibuka
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const rawDraft = localStorage.getItem(draftStorageKey)
        if (rawDraft) {
          const parsed = JSON.parse(rawDraft)
          if (parsed.answers) setAnswers(parsed.answers)
          if (parsed.mode) setQuizMode(parsed.mode)
          if (typeof parsed.stepIndex === "number") {
            setStepIndex(parsed.stepIndex)
          }
        }
      } catch {
        // Ignore local draft parse error
      }
    }

    if (userId && infoAkses.eligible) {
      fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "niche_check_access",
          userId,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.eligible) {
            if (data.activeProfile) setActiveProfile(data.activeProfile)
            if (Array.isArray(data.profilesHistory)) {
              setProfilesHistory(data.profilesHistory)
            }
            if (Array.isArray(data.topicIdeas)) {
              setTopicIdeas(data.topicIdeas)
            }
          }
        })
        .catch(() => {})
    }
  }, [userId, draftStorageKey, infoAkses.eligible])

  const simpanDraftLokal = (
    nextAnswers,
    nextMode = quizMode,
    nextStep = stepIndex,
  ) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          answers: nextAnswers,
          mode: nextMode,
          stepIndex: nextStep,
          updatedAt: new Date().toISOString(),
        }),
      )
    } catch {
      // Ignore storage error
    }
  }

  const pertanyaanSekarang =
    daftarPertanyaanAktif[stepIndex] || daftarPertanyaanAktif[0]

  const nilaiJawabanSekarang = answers[pertanyaanSekarang?.id] || ""

  const ubahJawaban = (val) => {
    setValidationError("")
    const next = { ...answers, [pertanyaanSekarang.id]: val }
    setAnswers(next)
    simpanDraftLokal(next, quizMode, stepIndex)
  }

  const handleToggleMultiOpsi = (opsiTeks) => {
    setValidationError("")
    const arrLama = Array.isArray(nilaiJawabanSekarang)
      ? nilaiJawabanSekarang
      : []
    const sudahAda = arrLama.includes(opsiTeks)
    const arrBaru = sudahAda
      ? arrLama.filter((x) => x !== opsiTeks)
      : [...arrLama, opsiTeks]
    ubahJawaban(arrBaru)
  }

  const handleTambahSkillKustom = () => {
    const bersih = customSkillInput.trim()
    if (!bersih) return
    handleToggleMultiOpsi(bersih)
    setCustomSkillInput("")
  }

  const validasiLangkahSaatIni = () => {
    if (!pertanyaanSekarang.essential) return true
    const val = nilaiJawabanSekarang
    if (Array.isArray(val)) {
      if (val.length === 0) {
        setValidationError("Pilih minimal 1 opsi terlebih dahulu ya.")
        return false
      }
      return true
    }
    const teks = (val || "").toString().trim()
    const minLen = pertanyaanSekarang.minLength || 3
    if (teks.length < minLen) {
      setValidationError(
        `Ceritakan sedikit lebih detail (minimal ${minLen} karakter) supaya analisa Ikigai kamu akurat.`,
      )
      return false
    }
    return true
  }

  const handleLanjutPertanyaan = () => {
    if (!validasiLangkahSaatIni()) return
    if (stepIndex < daftarPertanyaanAktif.length - 1) {
      const nextStep = stepIndex + 1
      setStepIndex(nextStep)
      simpanDraftLokal(answers, quizMode, nextStep)
    } else {
      handleKirimKuesionerKeAI()
    }
  }

  const handleKirimKuesionerKeAI = async () => {
    // Cek Cache: Jangan panggil ulang AI jika jawaban & mode sama persis dengan profil aktif (Bagian 10)
    if (
      activeProfile?.result &&
      activeProfile?.mode === quizMode &&
      JSON.stringify(activeProfile.answers) === JSON.stringify(answers)
    ) {
      setScreen("report")
      showToast("Memuat hasil analisa dari cache karena jawaban belum berubah.")
      return
    }

    setApiErrorMsg("")
    setScreen("loading")

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "niche_ikigai_profiling",
          userId,
          namaUser,
          aiModel1,
          mode: quizMode,
          answers,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(
          data.error || "Gagal memproses Analisa Niche. Silakan coba lagi.",
        )
      }

      setActiveProfile(data.profile)
      if (Array.isArray(data.profilesHistory)) {
        setProfilesHistory(data.profilesHistory)
      }
      if (onProfileUpdated) onProfileUpdated(data.profile)
      setScreen("report")
      showToast("Laporan Analisa Niche (Ikigai) berhasil disusun!")
    } catch (err) {
      setApiErrorMsg(err.message || "Terjadi kendala saat menghubungi AI.")
    }
  }

  const handlePilihKandidatNicheUtama = async (nicheId) => {
    if (!activeProfile) return
    const updatedProfile = {
      ...activeProfile,
      selected_niche_id: nicheId,
      updated_at: new Date().toISOString(),
    }
    setActiveProfile(updatedProfile)
    setIsEditingNicheCustom(false)

    if (userId) {
      try {
        const { data: uRow } = await supabase
          .from("users")
          .select("profil_dna")
          .eq("id", userId)
          .single()
        if (uRow) {
          await supabase
            .from("users")
            .update({
              profil_dna: {
                ...(uRow.profil_dna || {}),
                active_niche_profile: updatedProfile,
              },
            })
            .eq("id", userId)
        }
      } catch {
        // Ignore DB update error
      }
    }
    if (onProfileUpdated) onProfileUpdated(updatedProfile)
    showToast("Niche utama berhasil dikunci sebagai profil aktif!")
  }

  const handleSimpanEditKustomNiche = async () => {
    if (!activeProfile?.result) return
    const selectedId = activeProfile.selected_niche_id || "n1"
    const nextCandidates = (activeProfile.result.niche_candidates || []).map(
      (c) =>
        c.id === selectedId
          ? {
              ...c,
              name: customNicheName.trim() || c.name,
              audience: customNicheAudience.trim() || c.audience,
            }
          : c,
    )
    const updatedProfile = {
      ...activeProfile,
      result: {
        ...activeProfile.result,
        niche_candidates: nextCandidates,
      },
      updated_at: new Date().toISOString(),
    }
    setActiveProfile(updatedProfile)
    setIsEditingNicheCustom(false)

    if (userId) {
      try {
        const { data: uRow } = await supabase
          .from("users")
          .select("profil_dna")
          .eq("id", userId)
          .single()
        if (uRow) {
          await supabase
            .from("users")
            .update({
              profil_dna: {
                ...(uRow.profil_dna || {}),
                active_niche_profile: updatedProfile,
              },
            })
            .eq("id", userId)
        }
      } catch {
        // Ignore
      }
    }
    if (onProfileUpdated) onProfileUpdated(updatedProfile)
    showToast("Perubahan detail niche berhasil disimpan.")
  }

  const handleGenerateIdeTopikNiche = async () => {
    if (!activeProfile || isGeneratingTopics) return
    setIsGeneratingTopics(true)
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "niche_generate_topics",
          userId,
          namaUser,
          aiModel1,
          activeProfile,
          selectedNicheId: activeProfile.selected_niche_id,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal men-generate ide topik.")
      }
      setTopicIdeas(data.topicIdeas || [])
      setSelectedPillarFilter("ALL")
      setScreen("topics")
      showToast(
        `${(data.topicIdeas || []).length} ide topik TikTok siap dieksekusi!`,
      )
    } catch (err) {
      showToast(err.message)
    } finally {
      setIsGeneratingTopics(false)
    }
  }

  const handleUbahStatusIdeTopik = async (topicId, newStatus) => {
    const nextIdeas = topicIdeas.map((t) =>
      t.id === topicId ? { ...t, status: newStatus } : t,
    )
    setTopicIdeas(nextIdeas)
    if (userId) {
      try {
        const { data: uRow } = await supabase
          .from("users")
          .select("profil_dna")
          .eq("id", userId)
          .single()
        if (uRow) {
          await supabase
            .from("users")
            .update({
              profil_dna: {
                ...(uRow.profil_dna || {}),
                niche_topic_ideas: nextIdeas,
              },
            })
            .eq("id", userId)
        }
      } catch {
        // Ignore
      }
    }
  }

  // ============================================================================
  // 1. TAMPILAN TERKUNCI (LOCKED UPSELL VIEW) UNTUK PAKET <= Rp20.000 (BAGIAN 2)
  // ============================================================================
  if (!infoAkses.eligible) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pb-10">
        <div className="bg-white rounded-2xl border-2 border-[#14141F] p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#14141F] text-[#D4F34A] text-[11px] font-extrabold uppercase">
                <FlatIcon name="lock" className="w-3.5 h-3.5" />
                <span>
                  Fitur Terkunci • Paket &gt; Rp
                  {NICHE_PROFILING_MIN_PLAN_PRICE.toLocaleString("id-ID")}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-[#14141F] pt-1">
                Analisa Niche & Generator 24 Ide Topik (Metode Ikigai)
              </h1>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {infoAkses.reason} Temukan ceruk konten yang paling pas antara
                minat, keahlian, kebutuhan penonton, dan potensi komisi tanpa
                perlu bingung lagi mau bahas topik apa setiap hari.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0]">
              <strong className="text-[#14141F] block">
                1. Pemetaan Ikigai
              </strong>
              <span className="text-[11px] text-[#64748B]">
                Bedah irisan Passion, Mission, Vocation, & celah terlemahmu.
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0]">
              <strong className="text-[#14141F] block">
                2. 3-5 Kandidat Niche
              </strong>
              <span className="text-[11px] text-[#64748B]">
                Lengkap dengan skor kelayakan, risiko, dan rencana validasi 14
                hari.
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0]">
              <strong className="text-[#14141F] block">
                3. Auto Pre-Fill Naskah
              </strong>
              <span className="text-[11px] text-[#64748B]">
                Hasilkan 24 ide topik siap pakai & langsung masuk ke pembuat
                skrip.
              </span>
            </div>
          </div>

          {/* Contoh Hasil Statis (Dummy Preview Tanpa Memanggil AI API) */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-dashed border-[#CBD5E1] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
                Contoh Pratinjau Hasil Analisa Niche (Preview Statis)
              </span>
              <span className="px-2 py-0.5 rounded bg-[#D4F34A] text-[#14141F] text-[10px] font-extrabold">
                Skor Kecocokan: {DUMMY_PREVIEW_LOCKED.totalScore}/100
              </span>
            </div>
            <div className="text-sm font-bold text-[#14141F]">
              {DUMMY_PREVIEW_LOCKED.nicheName}
            </div>
            <div className="text-xs text-[#64748B] space-y-1">
              <div>
                <strong className="text-[#14141F]">Target Penonton:</strong>{" "}
                {DUMMY_PREVIEW_LOCKED.audience}
              </div>
              <div>
                <strong className="text-[#14141F]">Masalah Utama:</strong>{" "}
                {DUMMY_PREVIEW_LOCKED.problem}
              </div>
              <div>
                <strong className="text-[#14141F]">Format Konten:</strong>{" "}
                {DUMMY_PREVIEW_LOCKED.angle}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {DUMMY_PREVIEW_LOCKED.pillars.map((pil, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md bg-white border border-[#E2E8F0] text-[11px] font-semibold text-[#14141F]"
                >
                  Pilar #{i + 1}: {pil}
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onUpgradeClick}
            className="cursor-pointer w-full h-12 rounded-xl bg-[#D4F34A] hover:bg-[#C5E738] text-[#14141F] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.99]"
          >
            <FlatIcon name="bolt" className="w-4 h-4" />
            <span>
              Upgrade Paket (&gt; Rp20.000) untuk Membuka Analisa Niche
            </span>
          </button>
        </div>
      </div>
    )
  }

  // ============================================================================
  // 2. LAYAR LOADING SAAT AI MEMPROSES (BAGIAN 8.3)
  // ============================================================================
  if (screen === "loading") {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center space-y-4">
          {!apiErrorMsg ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#14141F] text-[#D4F34A] flex items-center justify-center mx-auto">
                <FlatIcon name="refresh" className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-[#14141F]">
                  Memetakan Lingkaran Ikigai & Kandidat Niche Kamu...
                </h2>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Tenang, proses ini memakan waktu sekitar 10-20 detik. AI
                  sedang membedah irisan keahlian, masalah audiens, bukti nyata,
                  serta menyusun rencana validasi 14 hari untukmu.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center mx-auto border border-[#EF4444]">
                <FlatIcon name="close" className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-[#14141F]">
                  Belum Berhasil Memproses Analisa
                </h2>
                <p className="text-xs text-[#EF4444] font-semibold">
                  {apiErrorMsg}
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen("questionnaire")}
                  className="cursor-pointer flex-1 h-10 rounded-xl bg-[#F4F5F7] text-[#14141F] text-xs font-bold"
                >
                  Kembali ke Kuesioner
                </button>
                <button
                  type="button"
                  onClick={handleKirimKuesionerKeAI}
                  className="cursor-pointer flex-1 h-10 rounded-xl bg-[#D4F34A] text-[#14141F] text-xs font-extrabold"
                >
                  Coba Lagi Sekarang
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ============================================================================
  // 3. LAYAR KUESIONER BERTAHAP 1 PERTANYAAN PER LAYAR (BAGIAN 4 & 8.2)
  // ============================================================================
  if (screen === "questionnaire") {
    const totalSteps = daftarPertanyaanAktif.length
    const persenProgress = Math.round(((stepIndex + 1) / totalSteps) * 100)

    return (
      <div className="max-w-xl mx-auto space-y-4 pb-10">
        {/* Top Bar Progress & Kembali */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                if (stepIndex > 0) {
                  setStepIndex(stepIndex - 1)
                } else {
                  setScreen("entry")
                }
              }}
              className="cursor-pointer inline-flex items-center gap-1 font-bold text-[#14141F] hover:underline"
            >
              <FlatIcon name="chevronLeft" className="w-4 h-4" />
              <span>{stepIndex > 0 ? "Pertanyaan Sebelumnya" : "Kembali"}</span>
            </button>
            <span className="font-mono font-bold text-[#14141F]">
              Langkah {stepIndex + 1} / {totalSteps} ({persenProgress}%)
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#F4F5F7] overflow-hidden border border-[#E2E8F0]">
            <div
              style={{ width: `${persenProgress}%` }}
              className="h-full bg-[#D4F34A] transition-all duration-300"
            />
          </div>
        </div>

        {/* Kartu Pertanyaan Aktif */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
          <div className="space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded bg-[#14141F] text-[#D4F34A] text-[10px] font-extrabold uppercase tracking-wider">
              {pertanyaanSekarang.aspek}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-[#14141F] leading-snug pt-1">
              {pertanyaanSekarang.pertanyaan}
            </h2>
          </div>

          {/* Tipe Pilihan Tunggal (Single) */}
          {pertanyaanSekarang.tipe === "single" && (
            <div className="grid grid-cols-1 gap-2">
              {(pertanyaanSekarang.opsi || []).map((op) => {
                const aktif = nilaiJawabanSekarang === op
                return (
                  <button
                    key={op}
                    type="button"
                    onClick={() => ubahJawaban(op)}
                    className={`cursor-pointer p-3.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between gap-2 transition ${
                      aktif
                        ? "bg-[#14141F] text-[#D4F34A] border-[#14141F]"
                        : "bg-[#F4F5F7] text-[#14141F] border-[#E2E8F0] hover:border-[#14141F]"
                    }`}
                  >
                    <span>{op}</span>
                    {aktif && (
                      <FlatIcon name="check" className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Tipe Multi-Select */}
          {(pertanyaanSekarang.tipe === "multi" ||
            pertanyaanSekarang.tipe === "multi_custom") && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(pertanyaanSekarang.opsi || []).map((op) => {
                  const arrPilih = Array.isArray(nilaiJawabanSekarang)
                    ? nilaiJawabanSekarang
                    : []
                  const aktif = arrPilih.includes(op)
                  return (
                    <button
                      key={op}
                      type="button"
                      onClick={() => handleToggleMultiOpsi(op)}
                      className={`cursor-pointer p-3 rounded-xl border text-left text-xs font-bold flex items-center justify-between gap-2 transition ${
                        aktif
                          ? "bg-[#14141F] text-[#D4F34A] border-[#14141F]"
                          : "bg-[#F4F5F7] text-[#14141F] border-[#E2E8F0]"
                      }`}
                    >
                      <span>{op}</span>
                      {aktif && (
                        <FlatIcon
                          name="check"
                          className="w-3.5 h-3.5 shrink-0"
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              {pertanyaanSekarang.tipe === "multi_custom" && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleTambahSkillKustom()
                      }
                    }}
                    placeholder={pertanyaanSekarang.placeholder}
                    className="flex-1 h-10 px-3 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] text-[16px] sm:text-xs text-[#14141F] focus:outline-none focus:border-[#14141F]"
                  />
                  <button
                    type="button"
                    onClick={handleTambahSkillKustom}
                    className="cursor-pointer h-10 px-3.5 rounded-xl bg-[#14141F] text-[#D4F34A] text-xs font-bold shrink-0"
                  >
                    + Tambah
                  </button>
                </div>
              )}

              {Array.isArray(nilaiJawabanSekarang) &&
                nilaiJawabanSekarang.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {nilaiJawabanSekarang.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#D4F34A] text-[#14141F] text-[11px] font-bold"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleMultiOpsi(item)}
                          className="cursor-pointer ml-1 text-[#14141F]"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* Tipe Teks Bebas & Teks dengan Template WA 3 Teman Terdekat */}
          {(pertanyaanSekarang.tipe === "text" ||
            pertanyaanSekarang.tipe === "text_with_template") && (
            <div className="space-y-2.5">
              {pertanyaanSekarang.templateWA && (
                <div className="p-3 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-2 text-xs">
                  <span className="font-bold text-[#14141F] block">
                    Template Pesan untuk Bertanya ke 3 Orang Terdekat:
                  </span>
                  <p className="text-[#64748B] italic">
                    &ldquo;{pertanyaanSekarang.templateWA}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        pertanyaanSekarang.templateWA,
                      )
                      showToast("Template pesan berhasil disalin!")
                    }}
                    className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#14141F] text-[#D4F34A] text-[11px] font-bold inline-flex items-center gap-1.5"
                  >
                    <FlatIcon name="copy" className="w-3.5 h-3.5" />
                    <span>Salin Template Pesan</span>
                  </button>
                </div>
              )}

              <textarea
                rows={4}
                value={
                  typeof nilaiJawabanSekarang === "string"
                    ? nilaiJawabanSekarang
                    : ""
                }
                onChange={(e) => ubahJawaban(e.target.value)}
                placeholder={pertanyaanSekarang.placeholder}
                className="w-full p-3.5 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] focus:bg-white focus:border-[#14141F] text-[16px] sm:text-sm text-[#14141F] placeholder:text-[#64748B] focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {validationError && (
            <p className="text-xs font-bold text-[#EF4444] bg-[#FEF2F2] p-2.5 rounded-lg border border-[#EF4444]">
              {validationError}
            </p>
          )}

          {/* Tombol Navigasi Bawah Kuesioner */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
            <span className="text-[11px] text-[#64748B]">
              Draft tersimpan otomatis
            </span>

            <div className="flex items-center gap-2">
              {!pertanyaanSekarang.essential && (
                <button
                  type="button"
                  onClick={() => {
                    if (stepIndex < daftarPertanyaanAktif.length - 1) {
                      setStepIndex(stepIndex + 1)
                    } else {
                      handleKirimKuesionerKeAI()
                    }
                  }}
                  className="cursor-pointer h-11 px-4 rounded-xl bg-[#F4F5F7] text-[#64748B] hover:text-[#14141F] text-xs font-bold"
                >
                  Lewati
                </button>
              )}

              <button
                type="button"
                onClick={handleLanjutPertanyaan}
                className="cursor-pointer h-11 px-5 rounded-xl bg-[#D4F34A] hover:bg-[#C5E738] text-[#14141F] text-xs font-extrabold flex items-center gap-1.5"
              >
                <span>
                  {stepIndex === daftarPertanyaanAktif.length - 1
                    ? "Proses Analisa Niche"
                    : "Lanjut"}
                </span>
                <FlatIcon name="arrowRight" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // 4. LAYAR DAFTAR 24 IDE TOPIK TIKTOK PER PILAR (BAGIAN 5.4, 8.6, & 9)
  // ============================================================================
  if (screen === "topics" && activeProfile?.result) {
    const resData = activeProfile.result
    const selectedNicheId = activeProfile.selected_niche_id || "n1"
    const nicheUtama =
      (resData.niche_candidates || []).find((n) => n.id === selectedNicheId) ||
      resData.niche_candidates?.[0]

    const listPilar = (resData.content_pillars || []).filter(
      (p) => !p.niche_id || p.niche_id === selectedNicheId,
    )

    const ideTerfilter = topicIdeas.filter((item) => {
      if (item.status === "dismissed") return false
      if (selectedPillarFilter === "ALL") return true
      return item.pillar_id === selectedPillarFilter
    })

    return (
      <div className="max-w-3xl mx-auto space-y-4 pb-10">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#556500] block">
              Niche Aktif Terpilih
            </span>
            <h2 className="text-base font-extrabold text-[#14141F]">
              {nicheUtama?.name}
            </h2>
            <p className="text-xs text-[#64748B]">
              Target: {nicheUtama?.audience}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScreen("report")}
              className="cursor-pointer h-9 px-3 rounded-lg bg-[#F4F5F7] text-[#14141F] text-xs font-bold border border-[#E2E8F0]"
            >
              Lihat Laporan Ikigai
            </button>
            <button
              type="button"
              disabled={isGeneratingTopics}
              onClick={handleGenerateIdeTopikNiche}
              className="cursor-pointer h-9 px-3 rounded-lg bg-[#14141F] text-[#D4F34A] text-xs font-bold flex items-center gap-1.5"
            >
              <FlatIcon
                name="refresh"
                className={`w-3.5 h-3.5 ${isGeneratingTopics ? "animate-spin" : ""}`}
              />
              <span>Generate Ide Baru</span>
            </button>
          </div>
        </div>

        {/* Filter per Pilar Konten */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedPillarFilter("ALL")}
            className={`cursor-pointer shrink-0 h-9 px-3.5 rounded-full text-xs font-bold transition ${
              selectedPillarFilter === "ALL"
                ? "bg-[#14141F] text-[#D4F34A]"
                : "bg-white text-[#14141F] border border-[#E2E8F0]"
            }`}
          >
            Semua Pilar (
            {topicIdeas.filter((t) => t.status !== "dismissed").length})
          </button>
          {listPilar.map((pil) => (
            <button
              key={pil.id}
              type="button"
              onClick={() => setSelectedPillarFilter(pil.id)}
              className={`cursor-pointer shrink-0 h-9 px-3.5 rounded-full text-xs font-bold transition ${
                selectedPillarFilter === pil.id
                  ? "bg-[#14141F] text-[#D4F34A]"
                  : "bg-white text-[#14141F] border border-[#E2E8F0]"
              }`}
            >
              {pil.name}
            </button>
          ))}
        </div>

        {ideTerfilter.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center space-y-3">
            <p className="text-xs text-[#64748B]">
              Belum ada daftar ide topik untuk pilar ini.
            </p>
            <button
              type="button"
              disabled={isGeneratingTopics}
              onClick={handleGenerateIdeTopikNiche}
              className="cursor-pointer h-10 px-4 rounded-xl bg-[#D4F34A] text-[#14141F] text-xs font-extrabold"
            >
              Generate 24 Ide Topik Sekarang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {ideTerfilter.map((ide, idx) => {
              const namaPilar =
                listPilar.find((p) => p.id === ide.pillar_id)?.name ||
                `Pilar ${ide.pillar_id}`
              return (
                <article
                  key={ide.id || idx}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-[#F4F5F7] border border-[#E2E8F0] text-[10px] font-bold text-[#14141F]">
                        {namaPilar}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#14141F] text-[#D4F34A] text-[10px] font-bold uppercase">
                        {ide.format} • {ide.est_duration_sec}s
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#E6F48C] text-[#14141F] text-[10px] font-bold uppercase">
                        Goal: {ide.goal}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono font-bold text-[#556500]">
                      Prioritas: {ide.priority_score}/5
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-[#14141F]">
                    {ide.title}
                  </h3>

                  <div className="p-2.5 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] text-xs">
                    <strong className="text-[#14141F] block text-[10px] uppercase">
                      Hook 3 Detik Pertama:
                    </strong>
                    <span className="font-bold text-[#14141F]">
                      &ldquo;{ide.hook}&rdquo;
                    </span>
                  </div>

                  {ide.why && (
                    <p className="text-[11px] text-[#64748B]">
                      <strong>Alasan Cocok:</strong> {ide.why}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() =>
                        handleUbahStatusIdeTopik(ide.id, "dismissed")
                      }
                      className="cursor-pointer px-3 h-9 rounded-lg bg-[#F4F5F7] hover:bg-[#FEF2F2] text-[#64748B] hover:text-[#EF4444] text-xs font-bold"
                    >
                      Singkirkan
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleUbahStatusIdeTopik(ide.id, "used")
                        if (onUseTopicForScript) {
                          onUseTopicForScript({
                            topicIdea: ide,
                            nicheCandidate: nicheUtama,
                            deliveryStyle: resData.ikigai?.delivery_style || "",
                          })
                        }
                      }}
                      className="cursor-pointer h-9 px-4 rounded-lg bg-[#D4F34A] hover:bg-[#C5E738] text-[#14141F] text-xs font-extrabold flex items-center gap-1.5"
                    >
                      <FlatIcon name="bolt" className="w-3.5 h-3.5" />
                      <span>
                        {ide.status === "used"
                          ? "Buat Naskah Lagi (Pre-Fill)"
                          : "Buat Naskah (Pre-Fill Otomatis)"}
                      </span>
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ============================================================================
  // 5. LAYAR LAPORAN NICHE LENGKAP SESUAI URUTAN BAGIAN 8.4
  // ============================================================================
  if (screen === "report" && activeProfile?.result) {
    const resData = activeProfile.result
    const ikigai = resData.ikigai || {}
    const inter = resData.intersections || {}
    const candidates = resData.niche_candidates || []
    const rec = resData.recommendation || {}
    const valPlan = resData.validation_plan_14_days || []
    const selectedId =
      activeProfile.selected_niche_id || rec.top_pick_id || candidates[0]?.id
    const kandidatAktif =
      candidates.find((c) => c.id === selectedId) || candidates[0]

    const renderSourceBadge = (source) => {
      if (source === "from_user") {
        return (
          <span className="px-2 py-0.5 rounded bg-[#D4F34A] text-[#14141F] text-[10px] font-bold">
            Dari jawabanmu
          </span>
        )
      }
      if (source === "market_data") {
        return (
          <span className="px-2 py-0.5 rounded bg-[#14141F] text-white text-[10px] font-bold">
            Data pasar
          </span>
        )
      }
      return (
        <span className="px-2 py-0.5 rounded bg-[#FFF4E5] text-[#B45309] text-[10px] font-bold border border-[#F59E0B]/30">
          Asumsi AI (Perlu diuji)
        </span>
      )
    }

    return (
      <div className="max-w-3xl mx-auto space-y-4 pb-12">
        {/* Header Laporan & Tombol Perbarui Profil */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] block">
              Laporan Analisa Niche Ikigai • Versi #{activeProfile.version || 1}{" "}
              ({(activeProfile.mode || "quick").toUpperCase()})
            </span>
            <h1 className="text-lg font-extrabold text-[#14141F]">
              Peta Ikigai & Rekomendasi Niche TikTok Kamu
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStepIndex(0)
                setScreen("entry")
              }}
              className="cursor-pointer h-9 px-3 rounded-lg bg-[#F4F5F7] hover:bg-[#E2E8F0] text-[#14141F] text-xs font-bold border border-[#E2E8F0]"
            >
              Perbarui Profil
            </button>
            <button
              type="button"
              disabled={isGeneratingTopics}
              onClick={handleGenerateIdeTopikNiche}
              className="cursor-pointer h-9 px-3.5 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-extrabold flex items-center gap-1.5"
            >
              <FlatIcon name="bolt" className="w-3.5 h-3.5" />
              <span>
                {isGeneratingTopics
                  ? "Menyusun Topik..."
                  : topicIdeas.length > 0
                    ? `Buka ${topicIdeas.length} Ide Topik`
                    : "Generate 24 Ide Topik"}
              </span>
            </button>
          </div>
        </div>

        {/* Bagian 1: Ringkasan 4 Lingkaran Ikigai */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3">
          <h2 className="text-sm font-extrabold text-[#14141F] uppercase tracking-wider">
            1. Ringkasan 4 Lingkaran Ikigai & Gaya Penyampaian
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-1">
              <strong className="text-[#14141F] block">
                Apa yang Kamu Sukai (Love):
              </strong>
              <p className="text-[#47464C]">
                {(ikigai.love || []).join(" • ") || "-"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-1">
              <strong className="text-[#14141F] block">
                Apa yang Kamu Kuasai (Good At):
              </strong>
              <p className="text-[#47464C]">
                {(ikigai.good_at || []).join(" • ") || "-"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-1">
              <strong className="text-[#14141F] block">
                Masalah yang Dibutuhkan Audiens:
              </strong>
              <p className="text-[#47464C]">
                {(ikigai.audience_need || []).join(" • ") || "-"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-1">
              <strong className="text-[#14141F] block">
                Jalur Monetisasi Potensial:
              </strong>
              <p className="text-[#47464C]">
                {(ikigai.monetizable || []).join(" • ") || "-"}
              </p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#14141F] text-white text-xs flex items-center justify-between gap-2">
            <span>
              <strong className="text-[#D4F34A]">Gaya & Format Nyaman:</strong>{" "}
              {ikigai.delivery_style}
            </span>
          </div>
        </section>

        {/* Bagian 2: Peta Irisan & Celah Terbesar */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3">
          <h2 className="text-sm font-extrabold text-[#14141F] uppercase tracking-wider">
            2. Peta Irisan Ikigai & Evaluasi Celah Terbesar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { key: "passion", label: "Passion (Cinta + Kuasai)" },
              { key: "mission", label: "Mission (Cinta + Butuh)" },
              { key: "vocation", label: "Vocation (Butuh + Cuan)" },
              { key: "profession", label: "Profession (Kuasai + Cuan)" },
            ].map((item) => {
              const obj = inter[item.key] || { score: 3, note: "-" }
              return (
                <div
                  key={item.key}
                  className="p-3 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#14141F] text-[11px]">
                      {item.label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#D4F34A] text-[#14141F] font-mono text-[10px] font-extrabold">
                      {obj.score}/5
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-snug">
                    {obj.note}
                  </p>
                </div>
              )
            })}
          </div>

          {inter.weakest_gap && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#EF4444]/40 text-xs text-[#93000A]">
              <strong>Celah Terbesar yang Perlu Diwaspadai:</strong>{" "}
              {inter.weakest_gap}
            </div>
          )}
        </section>

        {/* Bagian 3: Kartu Kandidat Niche Teratas */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold text-[#14141F] uppercase tracking-wider">
              3. Perbandingan Kandidat Niche ({candidates.length} Kandidat)
            </h2>
            <span className="text-[11px] text-[#64748B]">
              Klik &ldquo;Pilih Jadi Niche Utama&rdquo; untuk mengunci profil
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {candidates.map((cand, idx) => {
              const isSelected = cand.id === selectedId
              const isTopPick = cand.id === rec.top_pick_id

              return (
                <article
                  key={cand.id || idx}
                  className={`bg-white rounded-2xl p-4 space-y-3 transition ${
                    isSelected
                      ? "border-2 border-[#14141F]"
                      : "border border-[#E2E8F0]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-[#14141F] text-white text-[10px] font-bold">
                          Kandidat #{idx + 1}
                        </span>
                        {isTopPick && (
                          <span className="px-2 py-0.5 rounded bg-[#D4F34A] text-[#14141F] text-[10px] font-extrabold">
                            Rekomendasi Utama
                          </span>
                        )}
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded bg-[#10B981] text-white text-[10px] font-extrabold">
                            Niche Aktif Terpilih
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-[#14141F]">
                        {cand.name}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-[#64748B] block">
                        Skor Total
                      </span>
                      <span className="text-xl font-extrabold text-[#14141F] font-mono">
                        {cand.total}/100
                      </span>
                    </div>
                  </div>

                  {/* Bar Skor 5 Kriteria */}
                  <div className="grid grid-cols-5 gap-1.5 bg-[#F4F5F7] p-2.5 rounded-xl text-center text-[11px]">
                    <div>
                      <span className="text-[#64748B] block text-[10px]">
                        Cinta
                      </span>
                      <strong>{cand.scores?.love || 4}/5</strong>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">
                        Skill
                      </span>
                      <strong>{cand.scores?.skill || 4}/5</strong>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">
                        Butuh
                      </span>
                      <strong>{cand.scores?.need || 4}/5</strong>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">
                        Cuan
                      </span>
                      <strong>{cand.scores?.monetize || 4}/5</strong>
                    </div>
                    <div>
                      <span className="text-[#64748B] block text-[10px]">
                        Realistis
                      </span>
                      <strong>{cand.scores?.feasibility || 4}/5</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-[#E2E8F0]">
                      <strong className="block text-[#14141F]">
                        Siapa Penontonnya:
                      </strong>
                      <span className="text-[#47464C]">{cand.audience}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-[#E2E8F0]">
                      <strong className="block text-[#14141F]">
                        Masalah yang Diselesaikan:
                      </strong>
                      <span className="text-[#47464C]">{cand.problem}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-[#E2E8F0]">
                      <strong className="block text-[#14141F]">
                        Format & Pendekatan:
                      </strong>
                      <span className="text-[#47464C]">{cand.angle}</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <div>
                      <strong className="text-[#14141F]">Alasan Cocok:</strong>{" "}
                      <span className="text-[#47464C]">{cand.why_fit}</span>
                    </div>
                    <div>
                      <strong className="text-[#14141F]">
                        Langkah Validasi Pertama:
                      </strong>{" "}
                      <span className="text-[#556500] font-semibold">
                        {cand.first_step}
                      </span>
                    </div>
                  </div>

                  {/* Risiko & Asumsi yang Belum Teruji */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#EF4444]/30">
                      <strong className="text-[#93000A] block text-[11px]">
                        Risiko yang Perlu Diantisipasi:
                      </strong>
                      <ul className="list-disc list-inside text-[#93000A] text-[11px] mt-1 space-y-0.5">
                        {(cand.risks || []).map((rk, i) => (
                          <li key={i}>{rk}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FFF4E5] border border-[#F59E0B]/30">
                      <strong className="text-[#B45309] block text-[11px]">
                        Asumsi yang Belum Teruji:
                      </strong>
                      <ul className="list-disc list-inside text-[#B45309] text-[11px] mt-1 space-y-0.5">
                        {(cand.untested_assumptions || []).map((ua, i) => (
                          <li key={i}>{ua}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Label Sumber Klaim (Evidence Badges) */}
                  {Array.isArray(cand.evidence) && cand.evidence.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-[#64748B] block">
                        Sumber Klaim Analisis:
                      </span>
                      <div className="space-y-1">
                        {cand.evidence.map((ev, eIdx) => (
                          <div
                            key={eIdx}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#F4F5F7] text-xs"
                          >
                            <span className="text-[#14141F]">{ev.claim}</span>
                            {renderSourceBadge(ev.source)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => {
                        handlePilihKandidatNicheUtama(cand.id)
                        setCustomNicheName(cand.name)
                        setCustomNicheAudience(cand.audience)
                        setIsEditingNicheCustom(true)
                      }}
                      className="cursor-pointer px-3 h-9 rounded-lg bg-[#F4F5F7] text-[#14141F] text-xs font-bold"
                    >
                      Edit Detail Niche
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePilihKandidatNicheUtama(cand.id)}
                      className={`cursor-pointer h-9 px-4 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition ${
                        isSelected
                          ? "bg-[#14141F] text-[#D4F34A]"
                          : "bg-[#D4F34A] text-[#14141F]"
                      }`}
                    >
                      <FlatIcon name="check" className="w-3.5 h-3.5" />
                      <span>
                        {isSelected
                          ? "Niche Utama Aktif"
                          : "Pilih Jadi Niche Utama"}
                      </span>
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* Form Edit Kustom Niche Terpilih */}
        {isEditingNicheCustom && kandidatAktif && (
          <section className="bg-white rounded-2xl border-2 border-[#14141F] p-4 space-y-3">
            <h3 className="text-sm font-extrabold text-[#14141F]">
              Sesuaikan Nama Niche & Target Audiens Utama
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold block mb-1">
                  Nama Niche Utama:
                </label>
                <input
                  type="text"
                  value={customNicheName}
                  onChange={(e) => setCustomNicheName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#F4F5F7] border border-[#E2E8F0] text-[16px] sm:text-xs font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Target Penonton:</label>
                <input
                  type="text"
                  value={customNicheAudience}
                  onChange={(e) => setCustomNicheAudience(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#F4F5F7] border border-[#E2E8F0] text-[16px] sm:text-xs font-bold"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditingNicheCustom(false)}
                className="cursor-pointer flex-1 h-9 rounded-lg bg-[#F4F5F7] text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSimpanEditKustomNiche}
                className="cursor-pointer flex-1 h-9 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-extrabold"
              >
                Simpan Perubahan
              </button>
            </div>
          </section>
        )}

        {/* Bagian 4: Rekomendasi & Trade-Off */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-2 text-xs">
          <h2 className="text-sm font-extrabold text-[#14141F] uppercase tracking-wider">
            4. Rekomendasi Analisis & Pertimbangan (Trade-Off)
          </h2>
          <p className="text-[#14141F] leading-relaxed">
            <strong>Alasan Rekomendasi Utama:</strong> {rec.reason}
          </p>
          <p className="text-[#64748B] leading-relaxed">
            <strong>Pertimbangan Antar Kandidat:</strong> {rec.tradeoffs}
          </p>
        </section>

        {/* Bagian 5: Rencana Validasi 14 Hari */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3">
          <h2 className="text-sm font-extrabold text-[#14141F] uppercase tracking-wider">
            5. Rencana Validasi Konten 14 Hari
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {valPlan.map((vp, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-1.5"
              >
                <span className="px-2 py-0.5 rounded bg-[#14141F] text-[#D4F34A] text-[10px] font-extrabold">
                  {vp.day_range}
                </span>
                <p className="font-bold text-[#14141F] pt-1">{vp.task}</p>
                <p className="text-[11px] text-[#556500]">
                  <strong>Target Lulus:</strong> {vp.pass_criteria}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tombol Utama Lanjut ke Generator Ide Topik */}
        <button
          type="button"
          disabled={isGeneratingTopics}
          onClick={handleGenerateIdeTopikNiche}
          className="cursor-pointer w-full h-12 rounded-xl bg-[#D4F34A] hover:bg-[#C5E738] text-[#14141F] font-extrabold text-sm flex items-center justify-center gap-2 transition active:scale-[0.99]"
        >
          <FlatIcon
            name={isGeneratingTopics ? "refresh" : "bolt"}
            className={`w-4 h-4 ${isGeneratingTopics ? "animate-spin" : ""}`}
          />
          <span>
            {isGeneratingTopics
              ? "Menyusun 24 Ide Topik TikTok..."
              : "Lanjut ke Generator Ide Topik (24 Ide Siap Pakai)"}
          </span>
        </button>
      </div>
    )
  }

  // ============================================================================
  // 6. HALAMAN MASUK PROFIL NICHE (ENTRY SCREEN - BAGIAN 8.1)
  // ============================================================================
  const jmlJawabanDraft = Object.keys(answers || {}).length

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-10">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
        <div className="space-y-1">
          <span className="inline-block px-2.5 py-0.5 rounded bg-[#D4F34A] text-[#14141F] text-[10px] font-extrabold uppercase tracking-wider">
            Metode Ikigai Kreator TikTok
          </span>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#14141F] pt-1">
            Temukan Niche & Pilar Konten yang Paling Cocok Buatmu
          </h1>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Jawab kuesioner singkat di bawah agar AI memetakan irisan minat,
            keahlian nyata, masalah penonton, dan jalur komisi terbaikmu.
            Hasilnya langsung mengisi otomatis target penonton & ide topik di
            pembuat naskah.
          </p>
        </div>

        {/* Kartu Profil Aktif Jika Sudah Ada */}
        {activeProfile?.result && (
          <div className="p-4 rounded-xl bg-[#F4F5F7] border border-[#14141F] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-0.5 rounded bg-[#14141F] text-[#D4F34A] text-[10px] font-extrabold">
                Profil Niche Aktif (Versi #{activeProfile.version || 1})
              </span>
              <span className="text-[11px] text-[#64748B]">
                Mode: {(activeProfile.mode || "quick").toUpperCase()}
              </span>
            </div>
            <div className="text-sm font-extrabold text-[#14141F]">
              {(activeProfile.result.niche_candidates || []).find(
                (n) => n.id === activeProfile.selected_niche_id,
              )?.name || activeProfile.result.niche_candidates?.[0]?.name}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setScreen("report")}
                className="cursor-pointer h-9 px-3.5 rounded-lg bg-[#14141F] text-[#D4F34A] text-xs font-bold"
              >
                Buka Laporan Ikigai
              </button>
              <button
                type="button"
                onClick={() => {
                  if (topicIdeas.length > 0) {
                    setScreen("topics")
                  } else {
                    handleGenerateIdeTopikNiche()
                  }
                }}
                className="cursor-pointer h-9 px-3.5 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-extrabold"
              >
                {topicIdeas.length > 0
                  ? `Lihat ${topicIdeas.length} Ide Topik`
                  : "Generate 24 Ide Topik"}
              </button>
            </div>
          </div>
        )}

        {/* Pilihan Mode Quick (~3 Menit) vs Deep (~10 Menit) */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#14141F] block">
            Pilih Mode Kuesioner Analisa Niche:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setQuizMode("quick")}
              className={`cursor-pointer p-4 rounded-xl border text-left space-y-1.5 transition ${
                quizMode === "quick"
                  ? "border-2 border-[#14141F] bg-[#F8F9FA]"
                  : "border border-[#E2E8F0] bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#14141F]">
                  Mode Quick (~3 Menit)
                </span>
                <span className="px-2 py-0.5 rounded bg-[#D4F34A] text-[#14141F] text-[10px] font-extrabold">
                  10 Pertanyaan
                </span>
              </div>
              <p className="text-xs text-[#64748B] leading-snug">
                Fokus pada 4 lingkaran inti Ikigai, tujuan ngonten, gaya bicara,
                dan kenyamanan tampil.
              </p>
            </div>

            <div
              onClick={() => setQuizMode("deep")}
              className={`cursor-pointer p-4 rounded-xl border text-left space-y-1.5 transition ${
                quizMode === "deep"
                  ? "border-2 border-[#14141F] bg-[#F8F9FA]"
                  : "border border-[#E2E8F0] bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#14141F]">
                  Mode Deep (~10 Menit)
                </span>
                <span className="px-2 py-0.5 rounded bg-[#14141F] text-[#D4F34A] text-[10px] font-extrabold">
                  18 Pertanyaan
                </span>
              </div>
              <p className="text-xs text-[#64748B] leading-snug">
                Lebih mendalam: mencakup bukti portofolio, sudut pandang teman,
                peralatan, & target 3 bulan.
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Mulai / Lanjutkan Draft */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setStepIndex(0)
              setScreen("questionnaire")
            }}
            className="cursor-pointer flex-1 h-12 rounded-xl bg-[#D4F34A] hover:bg-[#C5E738] text-[#14141F] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <FlatIcon name="compass" className="w-4 h-4" />
            <span>
              {activeProfile
                ? `Buat Versi Baru (${quizMode.toUpperCase()})`
                : `Mulai Analisa Niche (${quizMode.toUpperCase()})`}
            </span>
          </button>

          {jmlJawabanDraft > 0 && (
            <button
              type="button"
              onClick={() => setScreen("questionnaire")}
              className="cursor-pointer h-12 px-4 rounded-xl bg-[#14141F] text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <span>Lanjutkan Draft ({jmlJawabanDraft} Terisi)</span>
              <FlatIcon name="arrowRight" className="w-4 h-4 text-[#D4F34A]" />
            </button>
          )}
        </div>

        {/* Riwayat Versi Profil Niche */}
        {profilesHistory.length > 1 && (
          <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
            <span className="text-xs font-bold text-[#14141F] block">
              Riwayat Versi Profil Niche Kamu ({profilesHistory.length} Versi):
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {profilesHistory.map((ph) => {
                const topName =
                  (ph.result?.niche_candidates || []).find(
                    (n) => n.id === ph.selected_niche_id,
                  )?.name || ph.result?.niche_candidates?.[0]?.name
                return (
                  <div
                    key={ph.id}
                    onClick={() => {
                      setActiveProfile(ph)
                      setScreen("report")
                    }}
                    className="cursor-pointer p-2.5 rounded-lg bg-[#F4F5F7] hover:bg-[#E2E8F0] border border-[#E2E8F0] flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[#14141F] truncate">
                      Versi #{ph.version} • {topName}
                    </span>
                    <span className="text-[11px] text-[#64748B] shrink-0">
                      {new Date(ph.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
