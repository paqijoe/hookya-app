"use client"
import { useState, useEffect } from "react"
import {
  FlatIcon,
  StoryVoiceInput,
  SelectWithCustom,
  AILoadingBox,
} from "./SharedUI"

const KALIMAT_DUMMY_LAMA =
  "Gini bro, jujur ya banyak banget yang boncos gara-gara cuma modal semangat doang tapi eksekusinya ngaco. Intinya simpel: benerin dulu fondasinya baru jalan."

export default function PersonaDNAView({
  userId,
  isPremiumUser = true,
  onTriggerUpgradeVIP,
  profil,
  setProfil,
  jadwalFleksibel,
  setJadwalFleksibel,
  jadwalCeklis,
  setJadwalCeklis,
  rawWritingSamples,
  setRawWritingSamples,
  personaProfile,
  setPersonaProfile,
  bentukKonten,
  setBentukKonten,
  deskripsiBentukSendiri,
  setDeskripsiBentukSendiri,
  SEPULUH_BENTUK_KONTEN,
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

  // State Multi-Profil untuk Kebutuhan Ternak Akun Sosial Media
  const [namaAkunBaru, setNamaAkunBaru] = useState("")
  const [showFormTambahAkun, setShowFormTambahAkun] = useState(false)

  const daftarAkunTernak = Array.isArray(profil.daftarAkunTernak)
    ? profil.daftarAkunTernak
    : []
  const idAkunAktif = profil.idAkunAktif || "akun_utama"

  useEffect(() => {
    if (rawWritingSamples === KALIMAT_DUMMY_LAMA) {
      setRawWritingSamples("")
    }
  }, [rawWritingSamples, setRawWritingSamples])

  // Simpan snapshot profil aktif ke dalam daftarAkunTernak & localStorage agar bisa diakses di ScriptProducerView
  const sinkronkanKeDaftarAkun = (
    profilUpdate,
    personaUpdate,
    sampelUpdate,
    bentukUpdate,
  ) => {
    const idTarget = profilUpdate.idAkunAktif || "akun_utama"
    const labelTarget =
      profilUpdate.labelAkunSosmed || profilUpdate.minatUtama || "Akun Utama"

    const itemAkunBaru = {
      id: idTarget,
      labelAkun: labelTarget,
      nama: profilUpdate.nama || "Kreator",
      usia: profilUpdate.usia || "28",
      gender: profilUpdate.gender || "Laki-laki",
      selfPronounInput: profilUpdate.selfPronounInput || "Gue",
      audiencePronounInput: profilUpdate.audiencePronounInput || "Lo / Kalian",
      peranSaatIni: profilUpdate.peranSaatIni || "",
      kepribadianSosial: profilUpdate.kepribadianSosial || "",
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
      ? listLama.map((a) => (a.id === idTarget ? itemAkunBaru : a))
      : [itemAkunBaru, ...listLama]

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `hookya_ternak_akun_${userId || "guest"}`,
          JSON.stringify({
            idAkunAktif: idTarget,
            daftarAkun: listBaru,
          }),
        )
      } catch {
        // Abaikan
      }
    }

    return listBaru
  }

  // Fungsi Pilih / Ganti Profil Akun Sosial Media
  const handlePilihAkunTernak = (akunObj) => {
    if (!akunObj) return
    const profilBaru = {
      ...profil,
      idAkunAktif: akunObj.id,
      labelAkunSosmed: akunObj.labelAkun,
      nama: akunObj.nama || profil.nama,
      usia: akunObj.usia || profil.usia,
      gender: akunObj.gender || profil.gender,
      selfPronounInput: akunObj.selfPronounInput || "Gue",
      audiencePronounInput: akunObj.audiencePronounInput || "Lo / Kalian",
      peranSaatIni: akunObj.peranSaatIni || "",
      kepribadianSosial: akunObj.kepribadianSosial || "",
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

  // Fungsi Tambah Profil Akun Baru untuk Ternak Akun
  const handleBuatProfilAkunBaru = () => {
    if (!namaAkunBaru.trim()) {
      alert("Masukkan nama atau label akun sosial media terlebih dahulu.")
      return
    }
    const idBaru = `akun_${Date.now().toString().slice(-5)}`
    const labelBersih = namaAkunBaru.trim()

    // Simpan dulu akun yang sedang aktif sebelum mengosongkan form untuk akun baru
    const listTersimpan = sinkronkanKeDaftarAkun(
      profil,
      personaProfile,
      rawWritingSamples,
      bentukKonten,
    )

    const akunKosong = {
      id: idBaru,
      labelAkun: labelBersih,
      nama: profil.nama || "Kreator",
      usia: profil.usia || "28",
      gender: profil.gender || "Laki-laki",
      selfPronounInput: "Aku",
      audiencePronounInput: "Kamu / Teman-teman",
      peranSaatIni:
        "Praktisi Bisnis & Kreator yang Bicara dari Pengalaman Nyata",
      kepribadianSosial:
        "Santai, jujur, dan peduli seperti kakak senior di warung kopi",
      minatUtama: labelBersih,
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
      selfPronounInput: "Aku",
      audiencePronounInput: "Kamu / Teman-teman",
      minatUtama: labelBersih,
      uspDiriInput: "",
      opiniKontraInput: "",
      analogiKhasInput: "",
      targetSegmenInput: "",
      targetKetakutanInput: "",
      targetImpianInput: "",
      targetKeraguanInput: "",
      daftarAkunTernak: daftarUpdate,
    })
    setRawWritingSamples("")
    setNamaAkunBaru("")
    setShowFormTambahAkun(false)
    showToast(
      `Profil akun "${labelBersih}" dibuat. Silakan lengkapi data di bawah lalu klik Perbarui Matriks.`,
    )
  }

  const handleHapusProfilAkun = (idHapus) => {
    if (daftarAkunTernak.length <= 1) {
      alert("Minimal harus ada 1 profil akun aktif.")
      return
    }
    const sisa = daftarAkunTernak.filter((a) => a.id !== idHapus)
    const akunPengganti = sisa[0]
    setProfil((prev) => ({
      ...prev,
      daftarAkunTernak: sisa,
    }))
    handlePilihAkunTernak(akunPengganti)
    showToast("Profil akun dihapus.")
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
            positioning_peran: profil.peranSaatIni,
            karakter: profil.kepribadianSosial,
            usp_keunikan: profil.uspDiriInput,
            musuh_bersama: profil.opiniKontraInput,
            minat_utama: profil.minatUtama,
            analogi_favorit: profil.analogiKhasInput,
            target_penonton: profil.targetSegmenInput,
            ketakutan_penonton: profil.targetKetakutanInput,
            impian_penonton: profil.targetImpianInput,
            keraguan_penonton: profil.targetKeraguanInput,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(
          data.error || "Error sistem, silakan refresh atau hubungi admin.",
        )
      }

      setHelperResults((prev) => ({
        ...prev,
        [fieldKey]: {
          insight:
            data.insight_singkat || "Pilih salah satu referensi di bawah:",
          opsi: Array.isArray(data.pilihan_referensi)
            ? data.pilihan_referensi
            : [],
        },
      }))
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setLoadingHelperKey(null)
    }
  }

  const renderLabelDenganInfo = (labelTeks, fieldKey, onPilihOpsi) => {
    const sedangLoading = loadingHelperKey === fieldKey
    const sedangBuka = activeHelperKey === fieldKey
    const dataRef = helperResults[fieldKey]

    return (
      <div className="space-y-1.5 mb-1.5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold text-[#14141f] leading-snug">
            {labelTeks}
          </label>
          <button
            type="button"
            onClick={() => handleMintaReferensiKolom(fieldKey, labelTeks)}
            title="Lihat contoh referensi berdasarkan profil akunmu"
            className={`cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition shrink-0 border ${
              sedangBuka
                ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                : "bg-white text-slate-600 border-slate-300 hover:border-[#14141f] hover:text-[#14141f]"
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-sm bg-black/10 flex items-center justify-center font-serif italic text-[10px]">
              i
            </span>
            <span>{sedangLoading ? "Memuat..." : "Referensi"}</span>
          </button>
        </div>

        {sedangBuka && (
          <div className="bg-[#f4f5f7] border border-slate-200 rounded-lg p-3 space-y-2">
            {sedangLoading ? (
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 py-1">
                <FlatIcon name="refresh" className="w-3.5 h-3.5 animate-spin" />
                <span>
                  Menyusun referensi dari jawaban profil sebelumnya...
                </span>
              </div>
            ) : dataRef ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-600">
                    {dataRef.insight}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveHelperKey(null)}
                    className="cursor-pointer text-[10px] font-bold text-slate-500 hover:text-[#14141f]"
                  >
                    Tutup
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
                  {(dataRef.opsi || []).map((itemOpsi, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onPilihOpsi(itemOpsi)
                        showToast("Referensi diterapkan ke kolom.")
                      }}
                      className="cursor-pointer snap-start shrink-0 max-w-xs bg-white hover:bg-[#d4f34a] text-[#14141f] border border-slate-200 text-left px-3 py-2 rounded-lg text-[11px] font-medium transition leading-snug"
                    >
                      {itemOpsi}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    )
  }

  const handleAnalisisGayaBicara = async () => {
    setIsGenerating(true)
    showToast("Memperbarui matriks profil akun dan gaya bicara...")

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
              profil.labelAkunSosmed || profil.minatUtama || "Akun Utama",
            nama: profil.nama,
            usia: profil.usia,
            gender: profil.gender,
            peran_dan_otoritas: profil.peranSaatIni,
            usp_diri:
              profil.uspDiriInput ||
              "Berbagi pengalaman praktik nyata yang langsung bisa diterapkan",
            analogi_khas:
              profil.analogiKhasInput || "Kehidupan harian, bisnis & olahraga",
            gaya_kepribadian: profil.kepribadianSosial,
            minat_utama: profil.minatUtama,
            tempat_rekam: profil.lingkunganRekam,
            waktu_luang: profil.waktuFree,
            sapaan_diri: profil.selfPronounInput,
            sapaan_audiens: profil.audiencePronounInput,
            prinsip_utama: profil.prinsipUtamaInput,
            pandangan_kontra: profil.opiniKontraInput,
            target_segmen:
              profil.targetSegmenInput ||
              "Anak muda, kreator pemula, atau pembeli online",
            target_ketakutan:
              profil.targetKetakutanInput ||
              "Takut buang waktu, boncos uang, atau jalan di tempat",
            target_impian:
              profil.targetImpianInput ||
              "Ingin hasil nyata yang praktis dan terbukti berhasil",
            target_keraguan:
              profil.targetKeraguanInput ||
              "Bingung mulai dari mana dan takut gagal",
          },
          rawWritingSamples:
            rawWritingSamples.trim() ||
            "Santai, akrab, jujur, dan langsung ke inti pembahasan.",
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
      showToast("Profil akun dan matriks gaya bicara berhasil disimpan.")
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 space-y-8">
      {/* HEADER HALAMAN TANPA EYEBROW BADGE */}
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
          Profil Akun, Spesifikasi Diri, dan Gaya Bicara
        </h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Kelola satu atau beberapa profil akun sosial media sekaligus (Ternak
          Akun). Setiap profil menyimpan gaya sapaan, bidang bahasan, dan
          spesifikasi pengalaman dirinya masing-masing. Klik tombol{" "}
          <strong>i Referensi</strong> di samping label kolom untuk melihat
          rekomendasi isian.
        </p>
      </div>

      {/* MANAJER MULTI-PROFIL UNTUK TERNAK AKUN SOSIAL MEDIA */}
      <section className="space-y-3 bg-[#f4f5f7] p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#14141f]">
              Daftar Profil Akun Sosial Media (Mode Ternak Akun)
            </h3>
            <p className="text-xs text-slate-600">
              Pilih profil akun yang ingin kamu gunakan atau buat profil baru
              untuk topik/akun yang berbeda.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowFormTambahAkun(!showFormTambahAkun)}
            className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3.5 py-2 rounded-lg"
          >
            {showFormTambahAkun ? "Batal" : "+ Buat Profil Akun Baru"}
          </button>
        </div>

        {showFormTambahAkun && (
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={namaAkunBaru}
              onChange={(e) => setNamaAkunBaru(e.target.value)}
              placeholder="Nama/Niche Akun Baru (Contoh: Akun Kultum & Motivasi / Akun Affiliate Kuliner)"
              className="flex-1 bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2 text-base sm:text-xs font-bold outline-none focus:bg-white focus:border-[#14141f]"
            />
            <button
              type="button"
              onClick={handleBuatProfilAkunBaru}
              className="cursor-pointer bg-[#d4f34a] text-[#14141f] text-xs font-bold px-4 py-2 rounded-lg shrink-0"
            >
              Simpan & Isi Profil Ini
            </button>
          </div>
        )}

        {daftarAkunTernak.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {daftarAkunTernak.map((ak) => {
              const sedangAktif = ak.id === idAkunAktif
              return (
                <div
                  key={ak.id}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition ${
                    sedangAktif
                      ? "bg-[#14141f] text-white border-[#14141f]"
                      : "bg-white text-[#14141f] border-slate-200 hover:border-[#14141f]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handlePilihAkunTernak(ak)}
                    className="cursor-pointer font-bold text-left"
                  >
                    <span className={sedangAktif ? "text-[#d4f34a]" : ""}>
                      {ak.labelAkun}
                    </span>
                    <span className="block text-[10px] font-normal opacity-80">
                      Sapaan: {ak.selfPronounInput}/{ak.audiencePronounInput}
                    </span>
                  </button>
                  {daftarAkunTernak.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleHapusProfilAkun(ak.id)}
                      title="Hapus profil akun ini"
                      className="cursor-pointer text-[10px] px-1.5 py-0.5 rounded-md bg-black/10 hover:bg-rose-600 hover:text-white"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[#14141f] mb-1">
            Label / Nama Profil Akun yang Sedang Diedit
          </label>
          <input
            type="text"
            value={profil.labelAkunSosmed || profil.minatUtama || ""}
            onChange={(e) =>
              setProfil({ ...profil, labelAkunSosmed: e.target.value })
            }
            placeholder="Contoh: Akun Utama Personal Branding / Akun Dakwah / Akun Jualan"
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-base sm:text-xs font-bold outline-none focus:border-[#14141f]"
          />
        </div>
      </section>

      {/* SEKSI 1: GAYA NGOBROL & RENCANA PERSONAL BRANDING */}
      <section className="space-y-4 pt-6 border-t border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-[#14141f]">
            1. Gaya Ngobrol & Rencana Personal Branding
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Bagian ini mengatur identitas sapaan, bidang yang kamu kuasai, serta
            target penonton yang ingin kamu tarik lewat konten viral.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#14141f] mb-1.5">
              Nama Panggilan di Akun Ini
            </label>
            <input
              type="text"
              value={profil.nama}
              onChange={(e) => setProfil({ ...profil, nama: e.target.value })}
              placeholder="Masukkan nama panggilanmu..."
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs font-bold outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#14141f] mb-1.5">
              Usia (Tahun)
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={profil.usia || ""}
              onChange={(e) => setProfil({ ...profil, usia: e.target.value })}
              placeholder="Contoh: 28"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs font-bold outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#14141f] mb-1.5">
              Gender
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["Laki-laki", "Perempuan"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setProfil({ ...profil, gender: g })}
                  className={`cursor-pointer py-2.5 px-3 rounded-lg text-xs font-bold border transition ${
                    profil.gender === g
                      ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                      : "bg-[#f4f5f7] text-slate-600 border-slate-200"
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
            label="Sebutan Diri Saat Bicara di Konten"
            value={profil.selfPronounInput}
            options={["Gue", "Aku", "Saya", "Kita", "Bunda / Ayah"]}
            onChange={(val) => setProfil({ ...profil, selfPronounInput: val })}
            placeholderCustom="Ketik sebutan dirimu sendiri..."
          />

          <SelectWithCustom
            label="Sebutan untuk Penonton / Pendengar"
            value={profil.audiencePronounInput}
            options={[
              "Lo / Kalian",
              "Kamu / Teman-teman",
              "Bro / Sis",
              "Bunda / Moms",
              "Bapak / Ibu / Jamaah",
            ]}
            onChange={(val) =>
              setProfil({ ...profil, audiencePronounInput: val })
            }
            placeholderCustom="Ketik panggilan untuk penontonmu..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            {renderLabelDenganInfo(
              "Bidang atau Topik yang Kamu Pahami di Akun Ini",
              "minatUtama",
              (val) => setProfil({ ...profil, minatUtama: val }),
            )}
            <input
              type="text"
              value={profil.minatUtama}
              onChange={(e) =>
                setProfil({ ...profil, minatUtama: e.target.value })
              }
              placeholder="Contoh: Bisnis praktis, Keuangan, Motivasi & Kultum, Kuliner, Olahraga"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Kesan Personal Branding yang Ingin Dibangun",
              "kepribadianSosial",
              (val) => setProfil({ ...profil, kepribadianSosial: val }),
            )}
            <SelectWithCustom
              label=""
              value={profil.kepribadianSosial}
              options={[
                "Santai, jujur, dan peduli seperti kakak senior di warung kopi",
                "Berwibawa, tenang, dan menyentuh hati saat menyampaikan pesan",
                "Teman ngobrol yang seru, ekspresif, dan suka berbagi cerita",
                "Tegas, lugas, dan langsung membedah inti masalah",
                "Pengamat yang kritis namun tetap santun dan solutif",
              ]}
              onChange={(val) =>
                setProfil({ ...profil, kepribadianSosial: val })
              }
              placeholderCustom="Ketik kesan pembawaanmu sendiri..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            {renderLabelDenganInfo(
              "Siapa Target Penonton yang Ingin Ditarik?",
              "targetSegmenInput",
              (val) => setProfil({ ...profil, targetSegmenInput: val }),
            )}
            <input
              type="text"
              value={profil.targetSegmenInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetSegmenInput: e.target.value })
              }
              placeholder="Contoh: Anak muda produktif, pelaku UMKM, atau ibu rumah tangga"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Masalah / Keresahan Terbesar Mereka",
              "targetKetakutanInput",
              (val) => setProfil({ ...profil, targetKetakutanInput: val }),
            )}
            <input
              type="text"
              value={profil.targetKetakutanInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetKetakutanInput: e.target.value })
              }
              placeholder="Contoh: Takut rugi modal, salah beli barang, atau hidup jalan di tempat"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Harapan / Perubahan yang Mereka Cari",
              "targetImpianInput",
              (val) => setProfil({ ...profil, targetImpianInput: val }),
            )}
            <input
              type="text"
              value={profil.targetImpianInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetImpianInput: e.target.value })
              }
              placeholder="Contoh: Solusi yang praktis, hemat, dan terbukti berhasil"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>
        </div>
      </section>

      {/* SEKSI 2: SPESIFIKASI PERSONAL DIRI (AMUNISI FASE 2 BANGUN TRUST) */}
      <section className="space-y-4 pt-6 border-t border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-[#14141f]">
            2. Spesifikasi Personal Diri (Amunisi Fase 2: Menciptakan Trust)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Isi pengalaman nyata, jam terbang, dan prinsip jujurmu. Data ini
            akan ditarik otomatis saat kamu membuat konten Fase 2 agar penonton
            percaya penuh pada kredibilitasmu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            {renderLabelDenganInfo(
              "Pengalaman Nyata / Jam Terbangmu di Bidang Ini",
              "uspDiriInput",
              (val) => setProfil({ ...profil, uspDiriInput: val }),
            )}
            <input
              type="text"
              value={profil.uspDiriInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, uspDiriInput: e.target.value })
              }
              placeholder="Contoh: Sudah 3 tahun praktik langsung, mengurus produksi media & lari rutin"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Peranmu Saat Berbagi kepada Penonton",
              "peranSaatIni",
              (val) => setProfil({ ...profil, peranSaatIni: val }),
            )}
            <SelectWithCustom
              label=""
              value={profil.peranSaatIni}
              options={[
                "Praktisi Bisnis & Kreator yang Bicara dari Pengalaman Nyata",
                "Teman Seperjuangan yang Suka Belajar & Eksperimen Bareng",
                "Reviewer Jujur Tanpa Basa-basi (Apa Adanya)",
                "Kakak Senior / Mentor Santai di Warung Kopi",
                "Penceramah / Pembicara Publik yang Menyampaikan Pesan Kebaikan",
                "Pebisnis Lokal / UMKM yang Paham Lapangan",
              ]}
              onChange={(val) => setProfil({ ...profil, peranSaatIni: val })}
              placeholderCustom="Ketik peranmu sendiri..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            {renderLabelDenganInfo(
              "Hal yang Paling Sering Kamu Kritisi di Bidangmu",
              "opiniKontraInput",
              (val) => setProfil({ ...profil, opiniKontraInput: val }),
            )}
            <input
              type="text"
              value={profil.opiniKontraInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, opiniKontraInput: e.target.value })
              }
              placeholder="Contoh: Kurang suka teori muluk tanpa hitungan dan langkah nyata"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Perumpamaan Harian yang Sering Kamu Gunakan",
              "analogiKhasInput",
              (val) => setProfil({ ...profil, analogiKhasInput: val }),
            )}
            <input
              type="text"
              value={profil.analogiKhasInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, analogiKhasInput: e.target.value })
              }
              placeholder="Contoh: Analogi latihan lari maraton, warung kopi, atau dagang harian"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Alasan Penonton Biasanya Masih Ragu Memulai / Membeli",
              "targetKeraguanInput",
              (val) => setProfil({ ...profil, targetKeraguanInput: val }),
            )}
            <input
              type="text"
              value={profil.targetKeraguanInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetKeraguanInput: e.target.value })
              }
              placeholder="Contoh: Merasa sibuk kerja atau takut hasilnya tidak sesuai"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>
        </div>
      </section>

      {/* SEKSI 3: SAMPEL KALIMAT LISAN & ANALISIS */}
      <section className="space-y-4 pt-6 border-t border-slate-200">
        {renderLabelDenganInfo(
          "3. Sampel Kalimat Gaya Bicaramu Sehari-hari",
          "rawWritingSamples",
          (val) => setRawWritingSamples(val),
        )}
        <p className="text-xs text-slate-600">
          Tuliskan 2 sampai 3 kalimat sesuai cara bicaramu di akun ini. Sistem
          akan mengunci pilihan kata, sapaan, dan ritme kalimatmu.
        </p>

        {isPremiumUser ? (
          <StoryVoiceInput
            rows={3}
            value={
              rawWritingSamples === KALIMAT_DUMMY_LAMA ? "" : rawWritingSamples
            }
            onChange={setRawWritingSamples}
            placeholder="Contoh pengetikan: Gini bro, jujur ya banyak banget yang boncos gara-gara cuma modal semangat doang tapi eksekusinya ngaco. Intinya simpel: benerin dulu fondasinya baru jalan..."
            onNotify={showToast}
          />
        ) : (
          <div className="relative">
            <textarea
              rows={3}
              value={
                rawWritingSamples === KALIMAT_DUMMY_LAMA
                  ? ""
                  : rawWritingSamples
              }
              onChange={(e) => setRawWritingSamples(e.target.value)}
              placeholder="Contoh pengetikan: Gini bro, jujur ya banyak banget yang boncos gara-gara cuma modal semangat doang tapi eksekusinya ngaco. Intinya simpel: benerin dulu fondasinya baru jalan..."
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg p-3 pr-24 text-base sm:text-sm font-normal text-[#14141f] placeholder:text-slate-400 focus:bg-white focus:border-[#14141f] outline-none"
            />
            <button
              type="button"
              onClick={onTriggerUpgradeVIP}
              title="Fitur Mikrofon khusus Paket VIP (Rp20.000+)"
              className="cursor-pointer absolute right-2 bottom-2 px-2.5 py-1.5 rounded-md bg-slate-200 hover:bg-[#14141f] text-[#14141f] hover:text-[#d4f34a] flex items-center gap-1 text-[11px] font-bold transition"
            >
              <FlatIcon name="lock" className="w-3.5 h-3.5" />
              <span>Mic VIP</span>
            </button>
          </div>
        )}

        {isGenerating ? (
          <AILoadingBox
            label="Menyimpan profil akun dan memperbarui matriks gaya bicara..."
            onRefresh={handleAnalisisGayaBicara}
          />
        ) : (
          <button
            type="button"
            onClick={handleAnalisisGayaBicara}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs sm:text-sm py-3.5 rounded-lg hover:opacity-95 transition"
          >
            Simpan Akun Ini & Perbarui Matriks Gaya Bicara
          </button>
        )}

        {/* RINGKASAN MATRIKS SAAT INI */}
        <div className="bg-[#f4f5f7] p-5 rounded-xl border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-[#4d6b14]">
            Ringkasan Profil Akun Aktif:{" "}
            {profil.labelAkunSosmed || profil.minatUtama || "Akun Utama"}
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#14141f] leading-relaxed">
            {personaProfile?.persona_summary}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-[#14141f]">
                Spesifikasi Diri (Trust)
              </div>
              <div className="text-slate-600">
                Peran:{" "}
                <strong className="text-[#14141f]">
                  {personaProfile?.positioning_and_usp?.authority_role ||
                    profil.peranSaatIni}
                </strong>
              </div>
              <div className="text-slate-600">
                Jam Terbang:{" "}
                <span>
                  {personaProfile?.positioning_and_usp?.unique_selling_point ||
                    profil.uspDiriInput ||
                    "Praktik nyata"}
                </span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-[#5b4bc4]">Target Penonton</div>
              <div className="text-slate-600">
                Masalah:{" "}
                <strong className="text-[#14141f]">
                  {personaProfile?.target_audience?.deepest_pain_points ||
                    profil.targetKetakutanInput ||
                    "Belum diisi"}
                </strong>
              </div>
              <div className="text-slate-600">
                Harapan:{" "}
                <span>
                  {personaProfile?.target_audience?.secret_desires ||
                    profil.targetImpianInput ||
                    "Belum diisi"}
                </span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-[#4d6b14]">Gaya Bahasa</div>
              <div className="text-slate-600">
                Sapaan:{" "}
                <strong className="text-[#14141f]">
                  {personaProfile?.linguistic_matrix?.self_pronoun ||
                    profil.selfPronounInput}{" "}
                  /{" "}
                  {personaProfile?.linguistic_matrix?.audience_pronoun ||
                    profil.audiencePronounInput}
                </strong>
              </div>
              <div className="text-slate-600">
                Partikel Khas:{" "}
                <strong className="text-[#14141f]">
                  {(
                    personaProfile?.linguistic_matrix?.signature_vocabulary ||
                    []
                  ).join(", ")}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEKSI 4: FORMAT VISUAL & WAKTU LUANG */}
      <section className="space-y-4 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-bold text-[#14141f]">
          4. Format Eksekusi Visual & Jadwal Produksi
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                className={`cursor-pointer p-3.5 rounded-xl text-left border transition flex items-center justify-between gap-3 ${
                  terpilih
                    ? "bg-[#14141f] text-white border-[#14141f]"
                    : "bg-[#f4f5f7] text-[#14141f] border-slate-200 hover:border-[#14141f]"
                }`}
              >
                <div>
                  <div
                    className={`text-xs sm:text-sm font-bold ${
                      terpilih ? "text-[#d4f34a]" : "text-[#14141f]"
                    }`}
                  >
                    {item.nama}
                  </div>
                  <div
                    className={`text-xs mt-1 leading-relaxed ${
                      terpilih ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {item.ket}
                  </div>
                </div>
                {terpilih && (
                  <FlatIcon
                    name="check"
                    className="w-4 h-4 text-[#d4f34a] shrink-0"
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <label className="text-xs font-bold text-[#14141f]">
              Jadwal Waktu Luang Harian
            </label>
            <label className="cursor-pointer inline-flex items-center gap-2 bg-[#f2fce2] text-[#14141f] px-3 py-1.5 rounded-lg text-xs font-bold border border-[#4d6b14]/20">
              <input
                type="checkbox"
                checked={jadwalFleksibel}
                onChange={(e) => setJadwalFleksibel(e.target.checked)}
                className="w-4 h-4 accent-[#14141f]"
              />
              <span>Waktu Fleksibel</span>
            </label>
          </div>

          {!jadwalFleksibel && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: "pagi", label: "Pagi" },
                { key: "siang", label: "Siang" },
                { key: "sore", label: "Sore" },
                { key: "malam", label: "Malam" },
              ].map((w) => {
                const slot = jadwalCeklis[w.key]
                return (
                  <div
                    key={w.key}
                    className={`p-3 rounded-lg border transition flex flex-wrap items-center justify-between gap-2 ${
                      slot.aktif
                        ? "bg-white border-[#14141f]"
                        : "bg-[#f4f5f7] border-slate-200 opacity-75"
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
                        placeholder="08:00"
                        className="w-16 bg-[#f4f5f7] border border-slate-200 rounded-md px-2 py-1 text-center font-bold text-base sm:text-xs"
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
                        placeholder="10:00"
                        className="w-16 bg-[#f4f5f7] border border-slate-200 rounded-md px-2 py-1 text-center font-bold text-base sm:text-xs"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <button
        type="button"
        onClick={async () => {
          const listAkunTerbaru = sinkronkanKeDaftarAkun(
            profil,
            personaProfile,
            rawWritingSamples,
            bentukKonten,
          )
          setProfil((prev) => ({
            ...prev,
            daftarAkunTernak: listAkunTerbaru,
          }))
          await simpanPersonaKeSupabase(personaProfile)
          setActiveMenu("produksi")
          showToast("Profil akun disimpan. Silakan mulai membuat skrip.")
        }}
        className="cursor-pointer w-full bg-[#d4f34a] text-[#14141f] font-bold text-sm py-3.5 rounded-lg hover:opacity-95 transition"
      >
        Simpan Profil Akun & Buat Skrip
      </button>
    </div>
  )
}
