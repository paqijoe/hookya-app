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

  useEffect(() => {
    if (rawWritingSamples === KALIMAT_DUMMY_LAMA) {
      setRawWritingSamples("")
    }
  }, [rawWritingSamples, setRawWritingSamples])

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
            title="Lihat contoh referensi berdasarkan profilmu"
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
    showToast("Memperbarui matriks positioning dan gaya bicara...")

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

      setPersonaProfile(data)
      await simpanPersonaKeSupabase(data)
      showToast("Profil dan gaya bicara berhasil diperbarui.")
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
          Profil, Positioning, dan Target Penonton
        </h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Data di halaman ini menjadi acuan agar setiap skrip sesuai dengan
          peran, pengalaman, dan cara bicaramu sehari-hari. Klik tombol{" "}
          <strong>i Referensi</strong> di samping label kolom untuk melihat
          rekomendasi berdasarkan jawabanmu.
        </p>
      </div>

      {/* SEKSI 1: IDENTITAS & SAPAAN */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold text-[#14141f]">
          1. Identitas & Kata Sapaan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#14141f] mb-1.5">
              Nama Panggilan
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
              placeholder="Contoh: 27"
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
            label="Sebutan untuk Penonton"
            value={profil.audiencePronounInput}
            options={[
              "Lo / Kalian",
              "Kamu / Teman-teman",
              "Bro / Sis",
              "Bunda / Moms",
              "Bapak / Ibu",
            ]}
            onChange={(val) =>
              setProfil({ ...profil, audiencePronounInput: val })
            }
            placeholderCustom="Ketik panggilan untuk penontonmu..."
          />
        </div>
      </section>

      {/* SEKSI 2: POSITIONING & KEUNIKAN (USP) */}
      <section className="space-y-4 pt-6 border-t border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-[#14141f]">
            2. Positioning & Pengalaman Unik (USP)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Tentukan posisi bicaramu dan pengalaman lapangan yang membedakanmu
            dari kreator lain.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            {renderLabelDenganInfo(
              "Posisi / Peran Otoritas di Mata Penonton",
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
                "Ibu / Bapak Rumah Tangga Cerdas & Hemat",
                "Pebisnis Lokal / UMKM yang Paham Lapangan",
              ]}
              onChange={(val) => setProfil({ ...profil, peranSaatIni: val })}
              placeholderCustom="Ketik peranmu sendiri..."
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Karakter & Gaya Pembawaan",
              "kepribadianSosial",
              (val) => setProfil({ ...profil, kepribadianSosial: val }),
            )}
            <SelectWithCustom
              label=""
              value={profil.kepribadianSosial}
              options={[
                "Santai, jujur, dan peduli seperti kakak senior di warung kopi",
                "Ambivert (Santai kalau sudah kenal, tapi malas tampil berlebihan)",
                "Introvert (Tenang, Pengamat, Suka di Balik Layar)",
                "Ekstrovert (Ekspresif, Suka Ngobrol & Bercerita)",
                "Tegas, lugas, dan langsung ke inti masalah",
              ]}
              onChange={(val) =>
                setProfil({ ...profil, kepribadianSosial: val })
              }
              placeholderCustom="Ketik gaya pembawaanmu sendiri..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            {renderLabelDenganInfo(
              "Topik / Bidang Utama yang Sering Dibahas",
              "minatUtama",
              (val) => setProfil({ ...profil, minatUtama: val }),
            )}
            <input
              type="text"
              value={profil.minatUtama}
              onChange={(e) =>
                setProfil({ ...profil, minatUtama: e.target.value })
              }
              placeholder="Contoh: Bisnis, Keuangan Praktis, Teknologi, Olahraga"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Keunikan Latar Belakangmu (USP)",
              "uspDiriInput",
              (val) => setProfil({ ...profil, uspDiriInput: val }),
            )}
            <input
              type="text"
              value={profil.uspDiriInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, uspDiriInput: e.target.value })
              }
              placeholder="Contoh: Lulusan manajemen yang belajar coding otodidak dan lari rutin"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            {renderLabelDenganInfo(
              "Kebiasaan / Hal Umum yang Paling Kamu Kritisi",
              "opiniKontraInput",
              (val) => setProfil({ ...profil, opiniKontraInput: val }),
            )}
            <input
              type="text"
              value={profil.opiniKontraInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, opiniKontraInput: e.target.value })
              }
              placeholder="Contoh: Kurang suka teori motivasi tanpa hitungan nyata"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Perumpamaan / Analogi yang Sering Kamu Pakai",
              "analogiKhasInput",
              (val) => setProfil({ ...profil, analogiKhasInput: val }),
            )}
            <input
              type="text"
              value={profil.analogiKhasInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, analogiKhasInput: e.target.value })
              }
              placeholder="Contoh: Analogi latihan lari, warung kopi, atau jualan harian"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>
        </div>
      </section>

      {/* SEKSI 3: TARGET PENONTON */}
      <section className="space-y-4 pt-6 border-t border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-[#14141f]">
            3. Karakteristik Target Penonton
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Petakan masalah dan kebutuhan penonton agar kalimat pembuka langsung
            relevan dengan situasi mereka.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            {renderLabelDenganInfo(
              "Siapa Target Penonton Utamamu?",
              "targetSegmenInput",
              (val) => setProfil({ ...profil, targetSegmenInput: val }),
            )}
            <input
              type="text"
              value={profil.targetSegmenInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetSegmenInput: e.target.value })
              }
              placeholder="Contoh: Pekerja muda usia 20-35 tahun yang mencari penghasilan tambahan"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Masalah / Kekhawatiran Terbesar Mereka",
              "targetKetakutanInput",
              (val) => setProfil({ ...profil, targetKetakutanInput: val }),
            )}
            <input
              type="text"
              value={profil.targetKetakutanInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetKetakutanInput: e.target.value })
              }
              placeholder="Contoh: Takut rugi modal, salah beli barang, atau kehabisan waktu"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Hasil Nyata yang Mereka Cari",
              "targetImpianInput",
              (val) => setProfil({ ...profil, targetImpianInput: val }),
            )}
            <input
              type="text"
              value={profil.targetImpianInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetImpianInput: e.target.value })
              }
              placeholder="Contoh: Penghasilan sampingan terukur atau produk yang awet dipakai"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Alasan Mereka Biasanya Ragu Memulai / Membeli",
              "targetKeraguanInput",
              (val) => setProfil({ ...profil, targetKeraguanInput: val }),
            )}
            <input
              type="text"
              value={profil.targetKeraguanInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetKeraguanInput: e.target.value })
              }
              placeholder="Contoh: Merasa sibuk kerja atau belum paham langkah awalnya"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>
        </div>
      </section>

      {/* SEKSI 4: CONTOH KALIMAT ASLI & ANALISIS */}
      <section className="space-y-4 pt-6 border-t border-slate-200">
        {renderLabelDenganInfo(
          "4. Contoh Kalimat Gaya Bicaramu Sehari-hari",
          "rawWritingSamples",
          (val) => setRawWritingSamples(val),
        )}
        <p className="text-xs text-slate-600">
          Tuliskan 2 sampai 3 kalimat sesuai cara ngobrol aslimu. Sistem akan
          mempertahankan pilihan kata dan panjang kalimatmu.
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
            label="Menyusun matriks positioning dan gaya bicara..."
            onRefresh={handleAnalisisGayaBicara}
          />
        ) : (
          <button
            type="button"
            onClick={handleAnalisisGayaBicara}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs sm:text-sm py-3.5 rounded-lg hover:opacity-95 transition"
          >
            Perbarui Matriks Gaya Bicara
          </button>
        )}

        {/* RINGKASAN MATRIKS SAAT INI */}
        <div className="bg-[#f4f5f7] p-5 rounded-xl border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-[#4d6b14]">
            Ringkasan Positioning & Gaya Bicara Aktif
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#14141f] leading-relaxed">
            {personaProfile?.persona_summary}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-[#14141f]">Positioning & USP</div>
              <div className="text-slate-600">
                Peran:{" "}
                <strong className="text-[#14141f]">
                  {personaProfile?.positioning_and_usp?.authority_role ||
                    profil.peranSaatIni}
                </strong>
              </div>
              <div className="text-slate-600">
                USP:{" "}
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
                Kebutuhan:{" "}
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
                  {personaProfile?.linguistic_matrix?.self_pronoun} /{" "}
                  {personaProfile?.linguistic_matrix?.audience_pronoun}
                </strong>
              </div>
              <div className="text-slate-600">
                Kosakata Khas:{" "}
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

      {/* SEKSI 5: FORMAT VISUAL & WAKTU LUANG */}
      <section className="space-y-4 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-bold text-[#14141f]">
          5. Format Eksekusi Visual & Jadwal Produksi
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
          await simpanPersonaKeSupabase(personaProfile)
          setActiveMenu("produksi")
          showToast("Profil disimpan. Silakan mulai membuat skrip.")
        }}
        className="cursor-pointer w-full bg-[#d4f34a] text-[#14141f] font-bold text-sm py-3.5 rounded-lg hover:opacity-95 transition"
      >
        Simpan Profil & Buat Skrip
      </button>
    </div>
  )
}
