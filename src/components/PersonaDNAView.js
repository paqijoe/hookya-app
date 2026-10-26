"use client"
import { useState, useEffect, useRef } from "react"
import { FlatIcon, AILoadingBox } from "./SharedUI"

const KALIMAT_DUMMY_LAMA =
  "Gini bro, jujur ya banyak banget yang boncos gara-gara cuma modal semangat doang tapi eksekusinya ngaco. Intinya simpel: benerin dulu fondasinya baru jalan."

const SEPULUH_FORMAT_PRIORITAS = [
  "1. Carousel Slide Edukasi",
  "2. Talking Head Video Pendek",
  "3. Infografik Komparasi",
  "4. Screenshot Thread Breakdown",
  "5. Studi Kasus Nyata",
  "6. Point-of-View (POV) Naratif",
  "7. Live Demo & Tutorial",
  "8. Tanya Jawab (Q&A) Interaktif",
  "9. Membongkar Mitos / Red Flag",
  "10. Kurasi Alat & Framework Kerja",
]

export default function PersonaDNAView({
  userId,
  isPremiumUser = true,
  kuotaAkunMaksimal = 2,
  namaPaketAktif = "Paket 10K",
  onTriggerUpgradeVIP,
  profil,
  setProfil,
  rawWritingSamples,
  setRawWritingSamples,
  personaProfile,
  setPersonaProfile,
  bentukKonten,
  setBentukKonten,
  SEPULUH_BENTUK_KONTEN = [],
  setModeTampilanSkrip,
  simpanPersonaKeSupabase,
  setActiveMenu,
  showToast,
  customPrompts,
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeHelperKey, setActiveHelperKey] = useState(null)
  const [loadingHelperKey, setLoadingHelperKey] = useState(null)
  const [helperResults, setHelperResults] = useState({})

  const [namaAkunBaru, setNamaAkunBaru] = useState("")
  const [showFormTambahAkun, setShowFormTambahAkun] = useState(false)

  const [selectedFormats, setSelectedFormats] = useState([
    "1. Carousel Slide Edukasi",
    "2. Talking Head Video Pendek",
    "4. Screenshot Thread Breakdown",
    "5. Studi Kasus Nyata",
    "8. Tanya Jawab (Q&A) Interaktif",
    "9. Membongkar Mitos / Red Flag",
  ])

  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const speechRecRef = useRef(null)

  const daftarAkunTernak = Array.isArray(profil.daftarAkunTernak)
    ? profil.daftarAkunTernak
    : []
  const idAkunAktif = profil.idAkunAktif || "akun_utama"

  useEffect(() => {
    if (rawWritingSamples === KALIMAT_DUMMY_LAMA) {
      setRawWritingSamples("")
    }
  }, [rawWritingSamples, setRawWritingSamples])

  useEffect(() => {
    if (daftarAkunTernak.length > kuotaAkunMaksimal) {
      const idxAktif = daftarAkunTernak.findIndex((a) => a.id === idAkunAktif)
      if (idxAktif >= kuotaAkunMaksimal && daftarAkunTernak[0]) {
        handlePilihAkunTernak(daftarAkunTernak[0], 0)
      }
    }
  }, [kuotaAkunMaksimal, daftarAkunTernak.length])

  const sinkronkanKeDaftarAkun = (
    profilUpdate,
    personaUpdate,
    sampelUpdate,
    bentukUpdate,
  ) => {
    const idTarget = profilUpdate.idAkunAktif || "akun_utama"
    const labelTarget =
      profilUpdate.labelAkunSosmed ||
      profilUpdate.username ||
      profilUpdate.minatUtama ||
      "@akun.utama"

    const itemAkunBaru = {
      id: idTarget,
      createdAtOrder: Date.now(),
      labelAkun: labelTarget.startsWith("@")
        ? labelTarget
        : `@${labelTarget.toLowerCase().replace(/\s+/g, ".")}`,
      nama: profilUpdate.nama || "Kreator",
      usia: profilUpdate.usia || "27",
      gender: profilUpdate.gender || "Laki-laki",
      selfPronounInput: profilUpdate.selfPronounInput || "Gue",
      audiencePronounInput: profilUpdate.audiencePronounInput || "Temen-temen",
      peranSaatIni: profilUpdate.peranSaatIni || "",
      kepribadianSosial:
        profilUpdate.kepribadianSosial || "To-the-point, Tajam, Santai",
      minatUtama: profilUpdate.minatUtama || "",
      uspDiriInput: profilUpdate.uspDiriInput || "",
      opiniKontraInput: profilUpdate.opiniKontraInput || "",
      analogiKhasInput: profilUpdate.analogiKhasInput || "",
      targetSegmenInput: profilUpdate.targetSegmenInput || "",
      targetKetakutanInput: profilUpdate.targetKetakutanInput || "",
      targetImpianInput: profilUpdate.targetImpianInput || "",
      targetKeraguanInput: profilUpdate.targetKeraguanInput || "",
      rawWritingSamples: sampelUpdate ?? rawWritingSamples,
      bentukKonten: bentukUpdate ?? bentukKonten,
      personaProfile: personaUpdate ?? personaProfile,
    }

    const listLama = Array.isArray(profilUpdate.daftarAkunTernak)
      ? profilUpdate.daftarAkunTernak
      : []
    const sudahAda = listLama.some((a) => a.id === idTarget)
    const listBaru = sudahAda
      ? listLama.map((a) =>
          a.id === idTarget
            ? {
                ...itemAkunBaru,
                createdAtOrder: a.createdAtOrder || Date.now(),
              }
            : a,
        )
      : [...listLama, itemAkunBaru]

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `hookya_ternak_akun_${userId || "guest"}`,
          JSON.stringify({
            idAkunAktif: idTarget,
            kuotaAkunMaksimal,
            daftarAkun: listBaru,
          }),
        )
      } catch {
        // Ignore storage error
      }
    }

    return listBaru
  }

  const handlePilihAkunTernak = (akunObj, indexUrutan = 0) => {
    if (!akunObj) return
    if (indexUrutan >= kuotaAkunMaksimal) {
      showToast(
        `Akun "${akunObj.labelAkun}" terkunci karena batas kuota paketmu saat ini (${kuotaAkunMaksimal} akun). Silakan upgrade paket.`,
      )
      setActiveMenu("topup")
      return
    }

    const profilBaru = {
      ...profil,
      idAkunAktif: akunObj.id,
      labelAkunSosmed: akunObj.labelAkun,
      nama: akunObj.nama || profil.nama,
      usia: akunObj.usia || profil.usia,
      gender: akunObj.gender || profil.gender,
      selfPronounInput: akunObj.selfPronounInput || "Gue",
      audiencePronounInput: akunObj.audiencePronounInput || "Temen-temen",
      peranSaatIni: akunObj.peranSaatIni || "",
      kepribadianSosial:
        akunObj.kepribadianSosial || "To-the-point, Tajam, Santai",
      minatUtama: akunObj.minatUtama || "",
      uspDiriInput: akunObj.uspDiriInput || "",
      opiniKontraInput: akunObj.opiniKontraInput || "",
      analogiKhasInput: akunObj.analogiKhasInput || "",
      targetSegmenInput: akunObj.targetSegmenInput || "",
      targetKetakutanInput: akunObj.targetKetakutanInput || "",
      targetImpianInput: akunObj.targetImpianInput || "",
      targetKeraguanInput: akunObj.targetKeraguanInput || "",
    }
    setProfil(profilBaru)
    if (akunObj.rawWritingSamples !== undefined) {
      setRawWritingSamples(akunObj.rawWritingSamples)
    }
    if (akunObj.bentukKonten) {
      setBentukKonten(akunObj.bentukKonten)
    }
    if (akunObj.personaProfile) {
      setPersonaProfile(akunObj.personaProfile)
    }
    showToast(`Berpindah ke profil akun: ${akunObj.labelAkun}`)
  }

  const handleBuatProfilAkunBaru = () => {
    const jumlahSaatIni = Math.max(1, daftarAkunTernak.length)
    if (jumlahSaatIni >= kuotaAkunMaksimal) {
      alert(
        `Kuota profil akun pada ${namaPaketAktif} maksimal ${kuotaAkunMaksimal} akun. Silakan upgrade paket untuk menambah profil akun baru.`,
      )
      setActiveMenu("topup")
      return
    }

    if (!namaAkunBaru.trim()) {
      alert("Masukkan nama atau handle akun sosial media terlebih dahulu.")
      return
    }
    const idBaru = `akun_${Date.now().toString().slice(-5)}`
    const rawLabel = namaAkunBaru.trim()
    const labelBersih = rawLabel.startsWith("@")
      ? rawLabel
      : `@${rawLabel.toLowerCase().replace(/\s+/g, ".")}`

    const listTersimpan = sinkronkanKeDaftarAkun(
      profil,
      personaProfile,
      rawWritingSamples,
      bentukKonten,
    )

    const akunKosong = {
      id: idBaru,
      createdAtOrder: Date.now() + 100,
      labelAkun: labelBersih,
      nama: profil.nama || "Kreator",
      usia: profil.usia || "27",
      gender: profil.gender || "Laki-laki",
      selfPronounInput: "Gue",
      audiencePronounInput: "Temen-temen",
      peranSaatIni: "",
      kepribadianSosial: "To-the-point, Tajam, Santai",
      minatUtama: "",
      uspDiriInput: "",
      opiniKontraInput: "",
      analogiKhasInput: "",
      targetSegmenInput: "",
      targetKetakutanInput: "",
      targetImpianInput: "",
      targetKeraguanInput: "",
      rawWritingSamples: "",
      bentukKonten: bentukKonten,
      personaProfile: personaProfile,
    }

    const daftarUpdate = [...listTersimpan, akunKosong]
    setProfil({
      ...profil,
      idAkunAktif: idBaru,
      labelAkunSosmed: labelBersih,
      minatUtama: "",
      uspDiriInput: "",
      opiniKontraInput: "",
      analogiKhasInput: "",
      targetSegmenInput: "",
      targetKetakutanInput: "",
      daftarAkunTernak: daftarUpdate,
    })
    setRawWritingSamples("")
    setNamaAkunBaru("")
    setShowFormTambahAkun(false)
    showToast(
      `Profil akun "${labelBersih}" dibuat (${daftarUpdate.length}/${kuotaAkunMaksimal} akun).`,
    )
  }

  const applyPresetPersona = (preset) => {
    if (preset === "Praktisi Teknis") {
      setProfil((prev) => ({
        ...prev,
        kepribadianSosial: "To-the-point, Tajam, Santai",
        selfPronounInput: "Gue",
        audiencePronounInput: "Temen-temen",
      }))
    } else if (preset === "Santai & Blak-blakan") {
      setProfil((prev) => ({
        ...prev,
        kepribadianSosial: "Satir, Realistis, Provokatif",
        selfPronounInput: "Gue",
        audiencePronounInput: "Lu",
      }))
    } else if (preset === "Storyteller Filosofis") {
      setProfil((prev) => ({
        ...prev,
        kepribadianSosial: "Formal, Akademis, Terstruktur",
        selfPronounInput: "Saya",
        audiencePronounInput: "Rekan",
      }))
    } else if (preset === "Edukator Ramah") {
      setProfil((prev) => ({
        ...prev,
        kepribadianSosial: "Hangat, Empatik, Mengayomi",
        selfPronounInput: "Aku",
        audiencePronounInput: "Kalian",
      }))
    }
    showToast(`Inspirasi persona "${preset}" diterapkan.`)
  }

  const handleMintaReferensiKolom = async (fieldKey, fieldLabel) => {
    if (activeHelperKey === fieldKey && helperResults[fieldKey]) {
      setActiveHelperKey(null)
      return
    }
    setActiveHelperKey(fieldKey)
    setLoadingHelperKey(fieldKey)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suggest_profiling_field",
          userId,
          namaUser: profil.nama,
          fieldKey,
          fieldLabel,
          accumulatedProfile: {
            nama_akun: profil.labelAkunSosmed || profil.minatUtama,
            nama: profil.nama,
            usia: profil.usia,
            gender: profil.gender,
            sapaan_diri: profil.selfPronounInput,
            sapaan_audiens: profil.audiencePronounInput,
            bidang: profil.minatUtama,
            kesan: profil.kepribadianSosial,
            target: profil.targetSegmenInput,
            masalah: profil.targetKetakutanInput,
          },
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setHelperResults((prev) => ({
          ...prev,
          [fieldKey]: {
            insight: data.insight_singkat || "Pilih salah satu referensi:",
            opsi: Array.isArray(data.pilihan_referensi)
              ? data.pilihan_referensi
              : [],
          },
        }))
      }
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setLoadingHelperKey(null)
    }
  }

  const renderHeaderKolomReferensi = (label, fieldKey, onPilih) => {
    const sedangBuka = activeHelperKey === fieldKey
    const sedangLoading = loadingHelperKey === fieldKey
    const dataRef = helperResults[fieldKey]

    return (
      <div className="mb-1.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#14141F]">
            {label}
          </label>
          <button
            type="button"
            onClick={() => handleMintaReferensiKolom(fieldKey, label)}
            className="cursor-pointer text-[11px] font-semibold text-slate-600 hover:text-[#14141F] flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F3F4F6] border border-[#E2E8F0]"
          >
            <span className="w-3.5 h-3.5 rounded-full border border-slate-400 flex items-center justify-center text-[9px] font-bold">
              i
            </span>
            <span>{sedangLoading ? "..." : "Referensi"}</span>
          </button>
        </div>

        {sedangBuka && dataRef && (
          <div className="bg-[#F3F4F6] p-2.5 rounded-lg border border-[#E2E8F0] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>{dataRef.insight}</span>
              <button
                type="button"
                onClick={() => setActiveHelperKey(null)}
                className="cursor-pointer font-bold text-slate-500"
              >
                Tutup
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(dataRef.opsi || []).map((op, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onPilih(op)
                    setActiveHelperKey(null)
                  }}
                  className="cursor-pointer shrink-0 bg-white hover:bg-[#D4F34A] text-[#14141F] border border-[#E2E8F0] px-2.5 py-1.5 rounded-md text-[11px] font-medium text-left"
                >
                  {op}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const handleToggleRekamSuaraSampel = () => {
    if (!isPremiumUser) {
      onTriggerUpgradeVIP()
      return
    }
    if (isRecordingVoice) {
      if (speechRecRef.current) {
        try {
          speechRecRef.current.stop()
        } catch {
          // Ignore
        }
      }
      setIsRecordingVoice(false)
      return
    }

    if (typeof window === "undefined") return
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRec) {
      try {
        const rec = new SpeechRec()
        rec.lang = "id-ID"
        rec.onstart = () => {
          setIsRecordingVoice(true)
          showToast("Silakan bicara sekarang...")
        }
        rec.onresult = (ev) => {
          const t = ev.results?.[0]?.[0]?.transcript || ""
          if (t) {
            setRawWritingSamples(
              rawWritingSamples ? `${rawWritingSamples} ${t}` : t,
            )
          }
        }
        rec.onend = () => setIsRecordingVoice(false)
        rec.onerror = () => setIsRecordingVoice(false)
        speechRecRef.current = rec
        rec.start()
      } catch {
        setIsRecordingVoice(false)
      }
    } else {
      showToast("Gunakan browser Chrome/Safari terbaru untuk fitur suara.")
    }
  }

  const handleToggleFormatVisual = (namaFormat, idx) => {
    const sudah = selectedFormats.includes(namaFormat)
    const update = sudah
      ? selectedFormats.filter((f) => f !== namaFormat)
      : [...selectedFormats, namaFormat]
    setSelectedFormats(update)

    if (SEPULUH_BENTUK_KONTEN[idx]) {
      setBentukKonten(SEPULUH_BENTUK_KONTEN[idx].nama)
      if (setModeTampilanSkrip) {
        setModeTampilanSkrip(SEPULUH_BENTUK_KONTEN[idx].modeDefault)
      }
    } else {
      setBentukKonten(namaFormat)
    }
  }

  const handleSimpanKonfigurasiProfil = async () => {
    setIsGenerating(true)
    showToast("Menyimpan konfigurasi profil & menganalisis parameter DNA...")

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extract_persona_dna",
          userId,
          namaUser: profil.nama,
          onboardingAnswers: {
            user_id:
              personaProfile?.user_id ||
              `usr_${Date.now().toString().slice(-5)}`,
            nama_akun:
              profil.labelAkunSosmed || profil.minatUtama || "@akun.utama",
            nama: profil.nama,
            usia: profil.usia,
            gender: profil.gender,
            peran_dan_otoritas: profil.peranSaatIni,
            usp_diri: profil.uspDiriInput,
            analogi_khas: profil.analogiKhasInput,
            gaya_kepribadian: profil.kepribadianSosial,
            minat_utama: profil.minatUtama,
            sapaan_diri: profil.selfPronounInput,
            sapaan_audiens: profil.audiencePronounInput,
            pandangan_kontra: profil.opiniKontraInput,
            target_segmen: profil.targetSegmenInput,
            target_ketakutan: profil.targetKetakutanInput,
          },
          rawWritingSamples: rawWritingSamples.trim(),
          customPrompts,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(
          data.error || "Error sistem, silakan refresh atau hubungi admin.",
        )
      }

      const listAkunTerbaru = sinkronkanKeDaftarAkun(
        profil,
        data,
        rawWritingSamples,
        bentukKonten,
      )
      setProfil((prev) => ({
        ...prev,
        daftarAkunTernak: listAkunTerbaru,
      }))
      setPersonaProfile(data)
      await simpanPersonaKeSupabase(data)
      showToast("Konfigurasi profil berhasil disimpan.")
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsGenerating(false)
    }
  }

  const jumlahAkunAktif = Math.min(
    Math.max(1, daftarAkunTernak.length),
    kuotaAkunMaksimal,
  )

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 pb-8">
      {/* 1. TOP MULTI-ACCOUNT MANAGER BAR (SESUAI SCREEN.PNG) */}
      <section className="bg-[#F3F4F6] rounded-xl p-4 border border-[#E2E8F0]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <FlatIcon
              name="users"
              className="w-4 h-4 text-[#14141F] shrink-0"
            />
            <span className="text-xs font-bold text-[#14141F] truncate">
              Daftar Profil Akun Sosial Media ({jumlahAkunAktif}/
              {kuotaAkunMaksimal} Akun Aktif)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (daftarAkunTernak.length >= kuotaAkunMaksimal) {
                alert(
                  `Kuota profil akun kamu sudah penuh (${kuotaAkunMaksimal} akun). Silakan upgrade paket untuk menambah slot akun baru.`,
                )
                setActiveMenu("topup")
                return
              }
              setShowFormTambahAkun(!showFormTambahAkun)
            }}
            className="cursor-pointer shrink-0 bg-white border border-[#C8C5CC] text-xs font-semibold text-[#14141F] px-3 py-1.5 rounded-lg hover:bg-slate-50 transition flex items-center gap-1"
          >
            <FlatIcon name="plus" className="w-3.5 h-3.5" />
            <span>{showFormTambahAkun ? "Batal" : "Buat Profil Baru"}</span>
          </button>
        </div>

        {showFormTambahAkun && (
          <div className="bg-white p-3 rounded-lg border border-[#E2E8F0] flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="text"
              value={namaAkunBaru}
              onChange={(e) => setNamaAkunBaru(e.target.value)}
              placeholder="Contoh: @bisnis.satria atau @satria.spiritual"
              className="flex-1 h-10 bg-[#F3F4F6] border border-[#E2E8F0] rounded-lg px-3 text-base sm:text-xs font-semibold outline-none focus:bg-white focus:border-[#14141F]"
            />
            <button
              type="button"
              onClick={handleBuatProfilAkunBaru}
              className="cursor-pointer h-10 bg-[#D4F34A] text-[#14141F] text-xs font-bold px-4 rounded-lg shrink-0"
            >
              Simpan Profil Baru
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {daftarAkunTernak.length === 0 ? (
            <button
              type="button"
              className="shrink-0 bg-[#D4F34A] text-[#14141F] font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 min-h-[44px]"
            >
              <span className="w-2 h-2 rounded-full bg-[#14141F]" />
              <span>
                {profil.labelAkunSosmed ||
                  `@${(profil.username || profil.nama || "kreator")
                    .toLowerCase()
                    .replace(/\s+/g, ".")}`}
              </span>
              <FlatIcon name="check" className="w-3.5 h-3.5" />
            </button>
          ) : (
            daftarAkunTernak.map((ak, idx) => {
              const sedangAktif = ak.id === idAkunAktif
              const terkunci = idx >= kuotaAkunMaksimal

              if (terkunci) {
                return (
                  <button
                    key={ak.id}
                    type="button"
                    onClick={() => handlePilihAkunTernak(ak, idx)}
                    className="cursor-pointer shrink-0 bg-[#E1E2E4]/70 border border-dashed border-[#C8C5CC] text-slate-600 font-medium px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 min-h-[44px]"
                  >
                    <FlatIcon
                      name="lock"
                      className="w-3.5 h-3.5 text-slate-500"
                    />
                    <span>{ak.labelAkun} • Terkunci (Upgrade Paket)</span>
                  </button>
                )
              }

              return (
                <button
                  key={ak.id}
                  type="button"
                  onClick={() => handlePilihAkunTernak(ak, idx)}
                  className={`cursor-pointer shrink-0 px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 min-h-[44px] transition ${
                    sedangAktif
                      ? "bg-[#D4F34A] text-[#14141F] font-bold"
                      : "bg-white text-[#14141F] border border-[#C8C5CC]/70 font-medium hover:border-[#14141F]"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      sedangAktif ? "bg-[#14141F]" : "bg-slate-300"
                    }`}
                  />
                  <span>{ak.labelAkun}</span>
                  {sedangAktif && (
                    <FlatIcon name="check" className="w-3.5 h-3.5" />
                  )}
                </button>
              )
            })
          )}

          {daftarAkunTernak.length < kuotaAkunMaksimal && (
            <div className="shrink-0 bg-[#E1E2E4]/50 border border-dashed border-[#C8C5CC] text-slate-500 font-medium px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 min-h-[44px]">
              <FlatIcon name="lock" className="w-3.5 h-3.5" />
              <span>Terkunci (Upgrade Paket)</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. BLOCK 1: GAYA NGOBROL & RENCANA PERSONAL BRANDING */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5">
        <div className="border-b border-[#E2E8F0] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FlatIcon name="mic" className="w-5 h-5 text-[#14141F]" />
            <h2 className="text-base font-bold text-[#14141F]">
              Gaya Ngobrol & Rencana Personal Branding
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sesuaikan persona dan cara komunikasi akun ini agar konsisten di
            setiap konten.
          </p>
        </div>

        {/* 3-Column Demographic Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-[#14141F] mb-1.5">
              Nama Panggilan
            </label>
            <input
              type="text"
              value={profil.nama}
              onChange={(e) => setProfil({ ...profil, nama: e.target.value })}
              placeholder="Nama panggilan..."
              className="w-full h-11 px-3 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:outline-none focus:border-[#14141F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14141F] mb-1.5">
              Usia
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={profil.usia || ""}
              onChange={(e) => setProfil({ ...profil, usia: e.target.value })}
              placeholder="27"
              className="w-full h-11 px-3 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:outline-none focus:border-[#14141F]"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-[#14141F] mb-1.5">
              Gender
            </span>
            <div className="grid grid-cols-2 gap-1 h-11 p-1 bg-[#F3F4F6] border border-[#C8C5CC] rounded-lg">
              {[
                { label: "Pria", val: "Laki-laki" },
                { label: "Wanita", val: "Perempuan" },
              ].map((g) => {
                const aktif =
                  profil.gender === g.val || profil.gender === g.label
                return (
                  <button
                    key={g.label}
                    type="button"
                    onClick={() => setProfil({ ...profil, gender: g.val })}
                    className={`cursor-pointer text-xs rounded flex items-center justify-center transition ${
                      aktif
                        ? "bg-[#D4F34A] text-[#14141F] font-bold"
                        : "text-[#14141F] font-medium"
                    }`}
                  >
                    {g.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 2-Column Persona Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            {renderHeaderKolomReferensi("Sebutan Diri", "selfPronoun", (v) =>
              setProfil({ ...profil, selfPronounInput: v }),
            )}
            <div className="relative">
              <select
                value={profil.selfPronounInput || "Gue"}
                onChange={(e) =>
                  setProfil({ ...profil, selfPronounInput: e.target.value })
                }
                className="w-full h-11 px-3 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] appearance-none focus:outline-none focus:border-[#14141F]"
              >
                <option value="Gue">Gue</option>
                <option value="Saya">Saya</option>
                <option value="Aku">Aku</option>
                <option value="Kita">Kita</option>
                <option value="Bunda / Ayah">Bunda / Ayah</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-3.5 text-slate-500">
                <FlatIcon name="chevronDown" className="w-4 h-4" />
              </span>
            </div>
          </div>

          <div>
            {renderHeaderKolomReferensi(
              "Sebutan Penonton",
              "audiencePronoun",
              (v) => setProfil({ ...profil, audiencePronounInput: v }),
            )}
            <div className="relative">
              <select
                value={profil.audiencePronounInput || "Temen-temen"}
                onChange={(e) =>
                  setProfil({
                    ...profil,
                    audiencePronounInput: e.target.value,
                  })
                }
                className="w-full h-11 px-3 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] appearance-none focus:outline-none focus:border-[#14141F]"
              >
                <option value="Temen-temen">Temen-temen</option>
                <option value="Lu">Lu</option>
                <option value="Kalian">Kalian</option>
                <option value="Sobat">Sobat</option>
                <option value="Rekan">Rekan</option>
                <option value="Bunda / Moms">Bunda / Moms</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-3.5 text-slate-500">
                <FlatIcon name="chevronDown" className="w-4 h-4" />
              </span>
            </div>
          </div>

          <div>
            {renderHeaderKolomReferensi(
              "Bidang yang Dipahami",
              "minatUtama",
              (v) => setProfil({ ...profil, minatUtama: v }),
            )}
            <input
              type="text"
              value={profil.minatUtama || ""}
              onChange={(e) =>
                setProfil({ ...profil, minatUtama: e.target.value })
              }
              placeholder="Contoh: SaaS & Productivity / Kuliner / Keuangan"
              className="w-full h-11 px-3 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:outline-none focus:border-[#14141F]"
            />
          </div>

          <div>
            {renderHeaderKolomReferensi(
              "Kesan Personal Branding",
              "kepribadianSosial",
              (v) => setProfil({ ...profil, kepribadianSosial: v }),
            )}
            <div className="relative">
              <select
                value={
                  profil.kepribadianSosial || "To-the-point, Tajam, Santai"
                }
                onChange={(e) =>
                  setProfil({ ...profil, kepribadianSosial: e.target.value })
                }
                className="w-full h-11 px-3 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] appearance-none focus:outline-none focus:border-[#14141F]"
              >
                <option value="To-the-point, Tajam, Santai">
                  To-the-point, Tajam, Santai
                </option>
                <option value="Formal, Akademis, Terstruktur">
                  Formal, Akademis, Terstruktur
                </option>
                <option value="Hangat, Empatik, Mengayomi">
                  Hangat, Empatik, Mengayomi
                </option>
                <option value="Satir, Realistis, Provokatif">
                  Satir, Realistis, Provokatif
                </option>
              </select>
              <span className="pointer-events-none absolute right-3 top-3.5 text-slate-500">
                <FlatIcon name="chevronDown" className="w-4 h-4" />
              </span>
            </div>
          </div>

          <div>
            {renderHeaderKolomReferensi(
              "Target Penonton",
              "targetSegmenInput",
              (v) => setProfil({ ...profil, targetSegmenInput: v }),
            )}
            <input
              type="text"
              value={profil.targetSegmenInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetSegmenInput: e.target.value })
              }
              placeholder="Contoh: Solopreneur & Content Creator pemula"
              className="w-full h-11 px-3 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:outline-none focus:border-[#14141F]"
            />
          </div>

          <div>
            {renderHeaderKolomReferensi(
              "Masalah Utama Penonton",
              "targetKetakutanInput",
              (v) => setProfil({ ...profil, targetKetakutanInput: v }),
            )}
            <input
              type="text"
              value={profil.targetKetakutanInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetKetakutanInput: e.target.value })
              }
              placeholder="Contoh: Bingung ide konten & sulit konsisten"
              className="w-full h-11 px-3 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:outline-none focus:border-[#14141F]"
            />
          </div>
        </div>

        {/* Pilih Inspirasi Persona Cepat */}
        <div className="bg-[#F3F4F6] p-3 rounded-xl border border-[#E2E8F0]">
          <div className="flex items-center gap-1.5 mb-2">
            <FlatIcon name="bolt" className="w-4 h-4 text-[#14141F]" />
            <span className="text-xs font-semibold text-[#14141F]">
              Pilih Inspirasi Persona Cepat:
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              "Praktisi Teknis",
              "Santai & Blak-blakan",
              "Storyteller Filosofis",
              "Edukator Ramah",
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyPresetPersona(preset)}
                className="cursor-pointer shrink-0 bg-white border border-[#C8C5CC] text-[#14141F] hover:border-[#14141F] px-3 py-1.5 rounded-lg text-xs font-medium active:bg-slate-100 transition"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. BLOCK 2: SPESIFIKASI PERSONAL DIRI (AMUNISI FASE 2 TRUST) & SAMPEL KALIMAT */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5">
        <div className="border-b border-[#E2E8F0] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FlatIcon name="shield" className="w-5 h-5 text-[#14141F]" />
            <h2 className="text-base font-bold text-[#14141F]">
              Spesifikasi Personal Diri (Amunisi Fase 2 Trust)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Parameter pembangun kredibilitas dan keaslian konten agar tidak
            terdengar generik.
          </p>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-[#14141F] mb-1.5">
              Jam Terbang / Pengalaman Nyata
            </label>
            <input
              type="text"
              value={profil.uspDiriInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, uspDiriInput: e.target.value })
              }
              placeholder="Contoh: 5 tahun build tech startup & remote engineer"
              className="w-full h-11 px-3 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:outline-none focus:border-[#14141F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14141F] mb-1.5">
              Peran Saat Berbagi
            </label>
            <input
              type="text"
              value={profil.peranSaatIni || ""}
              onChange={(e) =>
                setProfil({ ...profil, peranSaatIni: e.target.value })
              }
              placeholder="Contoh: Praktisi yang berbagi kegagalan & validasi lapangan"
              className="w-full h-11 px-3 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:outline-none focus:border-[#14141F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14141F] mb-1.5">
              Hal yang Dikritisi (Gimmick / Anti-Tesis)
            </label>
            <input
              type="text"
              value={profil.opiniKontraInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, opiniKontraInput: e.target.value })
              }
              placeholder="Contoh: Gimmick motivasi tanpa langkah eksekusi nyata"
              className="w-full h-11 px-3 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:outline-none focus:border-[#14141F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14141F] mb-1.5">
              Perumpamaan Harian
            </label>
            <input
              type="text"
              value={profil.analogiKhasInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, analogiKhasInput: e.target.value })
              }
              placeholder="Contoh: Seperti bumbu masak cepat saji vs masakan rumahan autentik"
              className="w-full h-11 px-3 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:outline-none focus:border-[#14141F]"
            />
          </div>
        </div>

        {/* Sampel Kalimat Gaya Bicara dengan Tombol Hapus & Rekam Suara */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="text-xs font-semibold text-[#14141F]">
              Sampel Kalimat Gaya Bicaramu Sehari-hari
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRawWritingSamples("")}
                className="cursor-pointer text-xs font-semibold text-rose-600 px-2.5 py-1 border border-rose-300 rounded-lg hover:bg-rose-50 transition flex items-center gap-1"
              >
                <FlatIcon name="trash" className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
              <button
                type="button"
                onClick={handleToggleRekamSuaraSampel}
                className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 min-h-[32px] transition ${
                  isRecordingVoice
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-[#D4F34A] text-[#14141F]"
                }`}
              >
                <FlatIcon name="mic" className="w-3.5 h-3.5" />
                <span>{isRecordingVoice ? "Merekam..." : "Rekam Suara"}</span>
              </button>
            </div>
          </div>

          <textarea
            rows={3}
            value={rawWritingSamples}
            onChange={(e) => setRawWritingSamples(e.target.value)}
            placeholder="Ketik atau rekam 2-3 kalimat sesuai cara ngobrol aslimu sehari-hari..."
            className="w-full p-3 bg-white border border-[#C8C5CC] rounded-lg text-base sm:text-sm text-[#14141F] focus:outline-none focus:border-[#14141F] leading-relaxed"
          />
        </div>

        {/* Kartu Analisis Parameter Otomatis Hookya */}
        <div className="bg-[#F3F4F6] border border-[#E2E8F0] rounded-xl p-3 mb-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-[#14141F] font-bold">
            <FlatIcon name="dna" className="w-4 h-4 text-[#14141F]" />
            <span>Analisis Parameter Otomatis Hookya</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#D4F34A] text-[#14141F] text-[11px] font-bold">
              <FlatIcon name="lock" className="w-3 h-3" />
              <span>
                {personaProfile?.dna_badge ||
                  `DNA: ${profil.kepribadianSosial || "Satir-Realistis"} | Direct Tone | Level 4 Trust`}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E1E2E4] text-[#14141F] text-[11px] font-semibold">
              <span>
                {personaProfile?.niche_badge ||
                  `Niche: ${profil.minatUtama || "Kreator"} | Target: ${profil.targetSegmenInput || "Audiens"}`}
              </span>
            </span>
          </div>
        </div>

        {/* 10 Format Eksekusi Visual Prioritas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#14141F]">
              10 Format Eksekusi Visual Prioritas
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {selectedFormats.length} Terpilih
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SEPULUH_FORMAT_PRIORITAS.map((fmt, idx) => {
              const dipilih =
                selectedFormats.includes(fmt) || bentukKonten === fmt
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => handleToggleFormatVisual(fmt, idx)}
                  className={`cursor-pointer p-2.5 rounded-lg border flex items-center justify-between text-left text-xs min-h-[44px] transition ${
                    dipilih
                      ? "bg-[#D4F34A] text-[#14141F] border-[#D4F34A] font-bold"
                      : "bg-white text-[#14141F] border-[#C8C5CC]/70 font-medium hover:border-[#14141F]"
                  }`}
                >
                  <span>{fmt}</span>
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                      dipilih
                        ? "border-[#14141F] bg-[#14141F] text-[#D4F34A]"
                        : "border-slate-300"
                    }`}
                  >
                    {dipilih && <FlatIcon name="check" className="w-3 h-3" />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* BOTTOM STICKY ACTION BAR */}
      <div className="sticky bottom-20 z-20 pt-2">
        {isGenerating ? (
          <AILoadingBox
            label="Menyimpan konfigurasi profil & memperbarui DNA..."
            onRefresh={handleSimpanKonfigurasiProfil}
          />
        ) : (
          <button
            type="button"
            onClick={handleSimpanKonfigurasiProfil}
            className="cursor-pointer w-full h-12 bg-[#D4F34A] text-[#14141F] text-sm font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm border border-[#14141F]/15 active:scale-[0.99] transition"
          >
            <FlatIcon name="bookmark" className="w-4 h-4" />
            <span>Simpan Konfigurasi Profil</span>
          </button>
        )}
      </div>
    </div>
  )
}
