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

  // State Bantuan Referensi AI ("i") per Kolom Pertanyaan
  const [activeHelperKey, setActiveHelperKey] = useState(null)
  const [loadingHelperKey, setLoadingHelperKey] = useState(null)
  const [helperResults, setHelperResults] = useState({})

  useEffect(() => {
    if (rawWritingSamples === KALIMAT_DUMMY_LAMA) {
      setRawWritingSamples("")
    }
  }, [rawWritingSamples, setRawWritingSamples])

  // Fungsi memanggil referensi cerdas berdasarkan akumulasi jawaban sebelumnya
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

  // Komponen Header Label + Tombol Kecil "i Referensi" yang Bersih & Pro
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
            className={`cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition shrink-0 border ${
              sedangBuka
                ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                : "bg-white text-slate-600 border-slate-300 hover:border-[#14141f] hover:text-[#14141f]"
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-black/10 flex items-center justify-center font-serif italic text-[10px]">
              i
            </span>
            <span>{sedangLoading ? "Menganalisis..." : "Referensi"}</span>
          </button>
        </div>

        {/* Laci Pilihan Referensi Kontekstual (Slide Horizontal Hemat Tempat) */}
        {sedangBuka && (
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2">
            {sedangLoading ? (
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 py-1">
                <FlatIcon name="refresh" className="w-3.5 h-3.5 animate-spin" />
                <span>
                  Menyusun referensi khusus dari jawaban profilmu sebelumnya...
                </span>
              </div>
            ) : dataRef ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    💡 {dataRef.insight}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveHelperKey(null)}
                    className="cursor-pointer text-[10px] font-bold text-slate-400 hover:text-[#14141f]"
                  >
                    ✕ Tutup
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
                  {(dataRef.opsi || []).map((itemOpsi, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onPilihOpsi(itemOpsi)
                        showToast("Referensi diterapkan ke kolom!")
                      }}
                      className="cursor-pointer snap-start shrink-0 max-w-xs bg-[#f4f5f7] hover:bg-[#d4f34a] text-[#14141f] border border-slate-200 text-left px-3 py-2 rounded-xl text-[11px] font-medium transition leading-snug"
                    >
                      + {itemOpsi}
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
    showToast(
      "Sedang memetakan Positioning, USP, Target Audiens & Gaya Bicaramu...",
    )

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
      showToast("Profiling 360° & Gaya Bicaramu berhasil diperbarui!")
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-white p-5 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <span className="text-[10px] font-bold bg-[#f2fce2] text-[#4d6b14] px-2.5 py-1 rounded-md">
          PROFILING 360° & PERSONAL POSITIONING
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-[#14141f] mt-1.5">
          Kenali Positioning, USP, Target Audiens & Gaya Bicaramu
        </h2>
        <p className="text-xs font-normal text-slate-600 mt-1 leading-relaxed">
          Klik tombol kecil <strong>ⓘ Referensi</strong> di sebelah kanan
          pertanyaan jika kamu butuh ide rekomendasi instan yang dianalisis dari
          jawabanmu sebelumnya.
        </p>
      </div>

      {/* BAGIAN 1: IDENTITAS & SAPAAN KHAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#14141f] mb-1.5">
            Nama Panggilan:
          </label>
          <input
            type="text"
            value={profil.nama}
            onChange={(e) => setProfil({ ...profil, nama: e.target.value })}
            placeholder="Contoh: Faqih / Hani"
            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs font-bold outline-none focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#14141f] mb-1.5">
            Usia Saat Ini (Tahun):
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={profil.usia || "28"}
            onChange={(e) => setProfil({ ...profil, usia: e.target.value })}
            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs font-bold outline-none focus:bg-white"
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
          label="Sebutan Diri Saat Ngonten:"
          value={profil.selfPronounInput}
          options={["Gue", "Aku", "Saya", "Kita", "Bunda / Ayah"]}
          onChange={(val) => setProfil({ ...profil, selfPronounInput: val })}
          placeholderCustom="Ketik sebutan dirimu sendiri..."
        />

        <SelectWithCustom
          label="Sebutan untuk Penonton:"
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

      {/* BAGIAN 2: POSITIONING & UNIQUE SELLING POINT (USP) DIRI */}
      <div className="bg-[#f4f5f7] p-4 sm:p-5 rounded-3xl border border-slate-200 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#14141f]">
            1. Positioning & Unique Selling Point (USP) Kamu
          </h3>
          <p className="text-xs text-slate-600">
            Bagaimana kamu ingin dikenal oleh penonton dan apa pembeda utamamu
            dibanding kreator lain.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            {renderLabelDenganInfo(
              "Positioning / Peran Otoritasmu:",
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
              placeholderCustom="Ketik positioning dirimu sendiri..."
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Karakter & Gaya Pembawaan:",
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
              "Minat / Bidang Utama yang Sering Dibahas:",
              "minatUtama",
              (val) => setProfil({ ...profil, minatUtama: val }),
            )}
            <input
              type="text"
              value={profil.minatUtama}
              onChange={(e) =>
                setProfil({ ...profil, minatUtama: e.target.value })
              }
              placeholder="Contoh: Bisnis, Keuangan Praktis, Teknologi & Olahraga Lari"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs outline-none"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Unique Selling Point (USP) / Keunikanmu:",
              "uspDiriInput",
              (val) => setProfil({ ...profil, uspDiriInput: val }),
            )}
            <input
              type="text"
              value={profil.uspDiriInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, uspDiriInput: e.target.value })
              }
              placeholder="Contoh: Anak manajemen yang ngoding, pelari rutin & affiliator"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            {renderLabelDenganInfo(
              "Musuh Bersama (Hal yang Paling Kamu Tentang):",
              "opiniKontraInput",
              (val) => setProfil({ ...profil, opiniKontraInput: val }),
            )}
            <input
              type="text"
              value={profil.opiniKontraInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, opiniKontraInput: e.target.value })
              }
              placeholder="Contoh: Menentang teori motivasi kosong tanpa langkah nyata"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs outline-none"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Analogi / Perumpamaan Favoritmu:",
              "analogiKhasInput",
              (val) => setProfil({ ...profil, analogiKhasInput: val }),
            )}
            <input
              type="text"
              value={profil.analogiKhasInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, analogiKhasInput: e.target.value })
              }
              placeholder="Contoh: Suka pakai perumpamaan lari maraton, warung kopi, atau dagang"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs outline-none"
            />
          </div>
        </div>
      </div>

      {/* BAGIAN 3: PSIKOLOGI TARGET AUDIENS (DENGAN TOMBOL "i Referensi" DI SETIAP PERTANYAAN) */}
      <div className="bg-[#f0eeff] p-4 sm:p-5 rounded-3xl border border-[#5b4bc4]/20 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#14141f]">
            2. Peta Psikologi Target Audiens (Penontonmu)
          </h3>
          <p className="text-xs text-slate-600">
            Klik tombol <strong>ⓘ Referensi</strong> di tiap kolom di bawah agar
            AI membantu memetakan psikologi penonton dari Positioning kamu di
            atas.
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
              placeholder="Contoh: Anak muda 20-35 thn yang ingin produktif"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs outline-none"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Ketakutan / Masalah Terbesar Mereka (Pain Points):",
              "targetKetakutanInput",
              (val) => setProfil({ ...profil, targetKetakutanInput: val }),
            )}
            <input
              type="text"
              value={profil.targetKetakutanInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetKetakutanInput: e.target.value })
              }
              placeholder="Contoh: Takut boncos, salah beli barang, atau gaji habis terus"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs outline-none"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Hasil Impian yang Paling Mereka Inginkan (Desires):",
              "targetImpianInput",
              (val) => setProfil({ ...profil, targetImpianInput: val }),
            )}
            <input
              type="text"
              value={profil.targetImpianInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetImpianInput: e.target.value })
              }
              placeholder="Contoh: Penghasilan stabil, badan bugar, atau barang awet"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs outline-none"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Alasan Mereka Biasanya Ragu / Malas Bertindak:",
              "targetKeraguanInput",
              (val) => setProfil({ ...profil, targetKeraguanInput: val }),
            )}
            <input
              type="text"
              value={profil.targetKeraguanInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetKeraguanInput: e.target.value })
              }
              placeholder="Contoh: Merasa tidak punya waktu luang atau takut ribet"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs outline-none"
            />
          </div>
        </div>
      </div>

      {/* BAGIAN 4: JADWAL WAKTU LUANG SISTEM CEKLIS */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm font-bold text-[#14141f]">
            Jadwal Waktu Luang Harianmu (Bisa Ceklis Lebih dari Satu):
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
                    <span className="text-slate-500 font-normal">Jam</span>
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
                      className="w-16 bg-[#f4f5f7] border border-slate-200 rounded-lg px-2 py-1 text-center font-bold text-base sm:text-xs"
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
                      className="w-16 bg-[#f4f5f7] border border-slate-200 rounded-lg px-2 py-1 text-center font-bold text-base sm:text-xs"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* BAGIAN 5: CONTOH GAYA BICARA */}
      <div className="bg-[#f4f5f7] p-4 rounded-2xl border border-slate-200 space-y-2">
        {renderLabelDenganInfo(
          "3. Contoh Kalimat Gaya Bicaramu Sehari-hari:",
          "rawWritingSamples",
          (val) => setRawWritingSamples(val),
        )}
        <p className="text-xs font-normal text-slate-600">
          Ceritakan bebas 2-3 kalimat dengan gaya ngobrol aslimu (atau klik{" "}
          <strong>ⓘ Referensi</strong> di atas untuk melihat contoh kalimat
          sesuai profilmu).
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
              className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 pr-14 text-base sm:text-sm font-normal text-[#14141f] placeholder:text-slate-400 outline-none"
            />
            <button
              type="button"
              onClick={onTriggerUpgradeVIP}
              title="Fitur Mikrofon khusus Paket VIP (Rp20.000+)"
              className="cursor-pointer absolute right-2.5 bottom-2.5 w-9 h-9 rounded-xl bg-slate-200 text-[#14141f] flex items-center justify-center text-xs font-bold"
            >
              👑
            </button>
          </div>
        )}
      </div>

      {isGenerating ? (
        <AILoadingBox
          label="Sedang merumuskan Positioning, USP, Psikologi Audiens & Gaya Bicaramu..."
          onRefresh={handleAnalisisGayaBicara}
        />
      ) : (
        <button
          type="button"
          onClick={handleAnalisisGayaBicara}
          className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs sm:text-sm py-4 rounded-2xl hover:opacity-95 transition flex items-center justify-center gap-2"
        >
          <span>Analisis & Kunci Profiling 360° Saya</span>
        </button>
      )}

      {/* BAGIAN 6: HASIL RINGKASAN POSITIONING, USP & AUDIENS */}
      <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-3">
        <span className="text-[11px] font-bold text-[#4d6b14] bg-[#f2fce2] px-2.5 py-0.5 rounded-md">
          MATRIKS POSITIONING & GAYA BICARAMU SAAT INI
        </span>
        <p className="text-xs sm:text-sm font-bold text-[#14141f] leading-relaxed">
          {personaProfile?.persona_summary}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <div className="font-bold text-[#14141f]">Positioning & USP:</div>
            <div>
              Otoritas:{" "}
              <strong>
                {personaProfile?.positioning_and_usp?.authority_role ||
                  profil.peranSaatIni}
              </strong>
            </div>
            <div>
              USP:{" "}
              <span className="text-slate-600">
                {personaProfile?.positioning_and_usp?.unique_selling_point ||
                  profil.uspDiriInput ||
                  "Praktik nyata"}
              </span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <div className="font-bold text-[#5b4bc4]">Psikologi Penonton:</div>
            <div>
              Ketakutan:{" "}
              <strong>
                {personaProfile?.target_audience?.deepest_pain_points ||
                  profil.targetKetakutanInput ||
                  "Takut gagal / rugi"}
              </strong>
            </div>
            <div>
              Impian:{" "}
              <span className="text-slate-600">
                {personaProfile?.target_audience?.secret_desires ||
                  profil.targetImpianInput ||
                  "Hasil praktis"}
              </span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <div className="font-bold text-[#4d6b14]">Kamus Gaya Bahasa:</div>
            <div>
              Sapaan:{" "}
              <strong>
                {personaProfile?.linguistic_matrix?.self_pronoun} ➔{" "}
                {personaProfile?.linguistic_matrix?.audience_pronoun}
              </strong>
            </div>
            <div>
              Kata Khas:{" "}
              <strong>
                {(
                  personaProfile?.linguistic_matrix?.signature_vocabulary || []
                ).join(", ")}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* BAGIAN 7: PILIHAN 10 BENTUK KONTEN */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <h3 className="text-sm font-bold text-[#14141f]">
          Pilih Bentuk Eksekusi Visual Andalanmu:
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
      </div>

      <button
        type="button"
        onClick={async () => {
          await simpanPersonaKeSupabase(personaProfile)
          setActiveMenu("produksi")
          showToast("Profiling 360° disimpan! Yuk mulai racik skrip kontenmu.")
        }}
        className="cursor-pointer w-full bg-[#d4f34a] text-[#14141f] font-bold text-sm py-4 rounded-2xl shadow-xs"
      >
        Simpan Profiling 360° & Lanjut Buat Skrip ➔
      </button>
    </div>
  )
}
