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
            bidang_dipahami: profil.minatUtama,
            kesan_personal_branding: profil.kepribadianSosial,
            penonton_yang_ditarik: profil.targetSegmenInput,
            masalah_penonton: profil.targetKetakutanInput,
            harapan_penonton: profil.targetImpianInput,
            pengalaman_jam_terbang: profil.uspDiriInput,
            peran_saat_berbagi: profil.peranSaatIni,
            hal_yang_dikritisi: profil.opiniKontraInput,
            perumpamaan_harian: profil.analogiKhasInput,
            alasan_penonton_ragu: profil.targetKeraguanInput,
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
            data.insight_singkat || "Pilih salah satu contoh isian di bawah:",
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
            title="Lihat contoh pengisian berdasarkan data sebelumnya"
            className={`cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition shrink-0 border ${
              sedangBuka
                ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                : "bg-white text-slate-600 border-slate-300 hover:border-[#14141f] hover:text-[#14141f]"
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-sm bg-black/10 flex items-center justify-center font-serif italic text-[10px]">
              i
            </span>
            <span>{sedangLoading ? "Memuat..." : "Contoh Isian"}</span>
          </button>
        </div>

        {sedangBuka && (
          <div className="bg-[#f4f5f7] border border-slate-200 rounded-lg p-3 space-y-2">
            {sedangLoading ? (
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 py-1">
                <FlatIcon name="refresh" className="w-3.5 h-3.5 animate-spin" />
                <span>Menyiapkan contoh isian yang pas buat kamu...</span>
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
                        showToast("Contoh isian dimasukkan ke kolom.")
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
    showToast("Menyimpan rencana personal branding & spesifikasi dirimu...")

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
              "Berbagi pengalaman praktik nyata yang sudah dicoba sendiri",
            analogi_khas:
              profil.analogiKhasInput ||
              "Kejadian sehari-hari di rumah atau kerjaan",
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
              "Orang awam atau pemula yang butuh panduan praktis",
            target_ketakutan:
              profil.targetKetakutanInput ||
              "Takut salah langkah, rugi uang, atau buang waktu",
            target_impian:
              profil.targetImpianInput ||
              "Ingin cara yang gampang dipraktikkan dan langsung kelihatan hasilnya",
            target_keraguan:
              profil.targetKeraguanInput ||
              "Bingung harus mulai dari mana dan takut ribet",
          },
          rawWritingSamples:
            rawWritingSamples.trim() ||
            "Santai, akrab, jujur apa adanya, dan langsung ke inti bahasan.",
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
      showToast("Profil & Spesifikasi Personal Diri berhasil disimpan!")
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsGenerating(false)
    }
  }

  const partikelLisanAktif = personaProfile?.voice_dna?.spoken_particles ||
    personaProfile?.linguistic_matrix?.signature_vocabulary || [
      "sih",
      "tuh",
      "kan",
      "deh",
      "banget",
    ]

  return (
    <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 space-y-8">
      {/* HEADER RAMAH PEMULA */}
      <div className="border-b border-slate-200 pb-5">
        <span className="text-[10px] font-bold bg-[#f2fce2] text-[#4d6b14] px-2.5 py-1 rounded-md">
          LANGKAH AWAL KREATOR PEMULA
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-[#14141f] mt-1.5">
          Atur Gaya Ngobrol & Spesifikasi Personal Dirimu
        </h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Tidak perlu bingung soal istilah rumit. Cukup isi halaman ini dengan
          bahasa sehari-hari supaya AI tahu cara ngobrolmu, bidang yang kamu
          pahami, dan pengalaman aslimu. Kalau bingung mengisi suatu kotak, klik
          tombol kecil <strong>i Contoh Isian</strong> di sebelah kanan atas
          kotak tersebut.
        </p>
      </div>

      {/* BAGIAN 1: GAYA NGOBROL & RENCANA PERSONAL BRANDING */}
      <section className="space-y-4">
        <div className="bg-[#f4f5f7] p-4 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-[#14141f]">
            Bagian 1: Gaya Ngobrol & Rencana Personal Branding
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Bagian ini dipakai pada <strong>Fase 1 (Cari Viral Dulu)</strong>{" "}
            supaya kontenmu menarik penonton baru yang tepat dengan gaya sapaan
            yang akrab.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#14141f] mb-1.5">
              Nama Panggilanmu
            </label>
            <input
              type="text"
              value={profil.nama}
              onChange={(e) => setProfil({ ...profil, nama: e.target.value })}
              placeholder="Contoh: Faqih / Rina"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs font-bold outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#14141f] mb-1.5">
              Usia Saat Ini (Tahun)
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
            label="Panggilan untuk Dirimu Sendiri Saat Ngonten"
            value={profil.selfPronounInput}
            options={["Gue", "Aku", "Saya", "Kita", "Bunda / Ayah"]}
            onChange={(val) => setProfil({ ...profil, selfPronounInput: val })}
            placeholderCustom="Ketik panggilan dirimu sendiri..."
          />

          <SelectWithCustom
            label="Panggilan untuk Penontonmu"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            {renderLabelDenganInfo(
              "Bidang atau Hal yang Kamu Pahami Sehari-hari",
              "minatUtama",
              (val) => setProfil({ ...profil, minatUtama: val }),
            )}
            <input
              type="text"
              value={profil.minatUtama}
              onChange={(e) =>
                setProfil({ ...profil, minatUtama: e.target.value })
              }
              placeholder="Contoh: Jualan online, masak harian, olahraga lari, desain, atau ngurus anak"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Rencana Kesan Personal Branding di Mata Penonton",
              "kepribadianSosial",
              (val) => setProfil({ ...profil, kepribadianSosial: val }),
            )}
            <SelectWithCustom
              label=""
              value={profil.kepribadianSosial}
              options={[
                "Santai, jujur, dan peduli seperti kakak senior di warung kopi",
                "Teman ngobrol yang asik, apa adanya, dan nggak menggurui",
                "Tenang, kalem, tapi penjelasannya runtut dan gampang dipahami",
                "Ekspresif, penuh semangat, dan suka bercerita",
                "Tegas, blak-blakan, dan langsung ke inti masalah",
              ]}
              onChange={(val) =>
                setProfil({ ...profil, kepribadianSosial: val })
              }
              placeholderCustom="Ketik kesan pembawaan yang kamu inginkan..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            {renderLabelDenganInfo(
              "Siapa Penonton yang Ingin Kamu Tarik?",
              "targetSegmenInput",
              (val) => setProfil({ ...profil, targetSegmenInput: val }),
            )}
            <input
              type="text"
              value={profil.targetSegmenInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetSegmenInput: e.target.value })
              }
              placeholder="Contoh: Anak muda yang baru mulai usaha atau ibu rumah tangga"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Masalah yang Paling Sering Bikin Mereka Pusing",
              "targetKetakutanInput",
              (val) => setProfil({ ...profil, targetKetakutanInput: val }),
            )}
            <input
              type="text"
              value={profil.targetKetakutanInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetKetakutanInput: e.target.value })
              }
              placeholder="Contoh: Takut rugi uang, salah beli barang, atau capek tapi nggak ada hasil"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Hasil yang Paling Mereka Harapkan",
              "targetImpianInput",
              (val) => setProfil({ ...profil, targetImpianInput: val }),
            )}
            <input
              type="text"
              value={profil.targetImpianInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetImpianInput: e.target.value })
              }
              placeholder="Contoh:Dapat cara praktis yang murah, awet, dan terbukti jalan"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>
        </div>
      </section>

      {/* BAGIAN 2: SPESIFIKASI PERSONAL DIRI (AMUNISI KHUSUS FASE 2 "BANGUN TRUST") */}
      <section className="space-y-4 pt-6 border-t border-slate-200">
        <div className="bg-[#f2fce2] p-4 rounded-xl border border-[#4d6b14]/25">
          <span className="text-[10px] font-bold bg-[#14141f] text-[#d4f34a] px-2 py-0.5 rounded">
            AMUNISI KHUSUS FASE 2 (BANGUN TRUST)
          </span>
          <h3 className="text-sm font-bold text-[#14141f] mt-1">
            Bagian 2: Spesifikasi Personal Dirimu (Pengalaman & Prinsip Asli)
          </h3>
          <p className="text-xs text-slate-700 mt-0.5">
            Penonton baru yang datang dari video viralmu baru akan{" "}
            <strong>percaya (trust)</strong> kalau mereka tahu siapa kamu, apa
            pengalaman nyatamu, dan kejujuranmu di lapangan. Isian di bawah ini
            otomatis ditarik saat kamu membuat skrip{" "}
            <strong>Fase 2: Bangun Trust</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            {renderLabelDenganInfo(
              "Pengalaman Nyata / Jam Terbangmu Selama Ini",
              "uspDiriInput",
              (val) => setProfil({ ...profil, uspDiriInput: val }),
            )}
            <input
              type="text"
              value={profil.uspDiriInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, uspDiriInput: e.target.value })
              }
              placeholder="Contoh: Sudah 3 tahun rutin lari jalan raya & ngurus produksi media yayasan"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Peranmu Saat Berbagi ke Penonton",
              "peranSaatIni",
              (val) => setProfil({ ...profil, peranSaatIni: val }),
            )}
            <SelectWithCustom
              label=""
              value={profil.peranSaatIni}
              options={[
                "Praktisi yang bicara dari hasil coba sendiri di lapangan",
                "Teman seperjuangan yang suka belajar & praktek bareng",
                "Reviewer jujur yang ngomong apa adanya tanpa lebih-lebihin",
                "Kakak senior yang kasih bocoran biar pemula nggak salah jalan",
                "Ibu / Bapak rumah tangga yang paham cara hemat & praktis",
                "Pelaku usaha lokal / UMKM yang ngerti repotnya jualan harian",
              ]}
              onChange={(val) => setProfil({ ...profil, peranSaatIni: val })}
              placeholderCustom="Ketik peranmu saat berbagi..."
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
              placeholder="Contoh: Orang yang suka kasih janji instan tanpa ngajarin prosesnya"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Perumpamaan Sehari-hari yang Suka Kamu Pakai",
              "analogiKhasInput",
              (val) => setProfil({ ...profil, analogiKhasInput: val }),
            )}
            <input
              type="text"
              value={profil.analogiKhasInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, analogiKhasInput: e.target.value })
              }
              placeholder="Contoh: Ibarat latihan lari, ibarat nyeduh kopi, atau ibarat dagang warung"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>

          <div>
            {renderLabelDenganInfo(
              "Alasan Penonton Biasanya Masih Ragu / Takut Mulai",
              "targetKeraguanInput",
              (val) => setProfil({ ...profil, targetKeraguanInput: val }),
            )}
            <input
              type="text"
              value={profil.targetKeraguanInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetKeraguanInput: e.target.value })
              }
              placeholder="Contoh: Takut alatnya mahal, merasa nggak bakat, atau sibuk kerja"
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs outline-none focus:bg-white focus:border-[#14141f]"
            />
          </div>
        </div>
      </section>

      {/* BAGIAN 3: SAMPEL KALIMAT LISAN SEHARI-HARI (PENGUNCI VOICE DNA) */}
      <section className="space-y-4 pt-6 border-t border-slate-200">
        {renderLabelDenganInfo(
          "Bagian 3: Sampel Kalimat Lisanmu Sehari-hari (Pengunci Voice DNA)",
          "rawWritingSamples",
          (val) => setRawWritingSamples(val),
        )}
        <p className="text-xs text-slate-600">
          Ketik atau rekam 2 sampai 3 kalimat persis seperti gaya ngobrolmu ke
          teman. AI akan mengenali kata sambung dan partikel khasmu (seperti{" "}
          <em>sih, tuh, kan, deh, lho, banget</em>) supaya skrip tidak kaku.
        </p>

        {isPremiumUser ? (
          <StoryVoiceInput
            rows={3}
            value={
              rawWritingSamples === KALIMAT_DUMMY_LAMA ? "" : rawWritingSamples
            }
            onChange={setRawWritingSamples}
            placeholder="Contoh pengetikan: Gini bro, jujur ya banyak banget yang boncos gara-gara cuma modal semangat doang tapi eksekusinya ngaco. Intinya simpel, benerin dulu fondasinya baru jalan..."
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
              placeholder="Contoh pengetikan: Gini bro, jujur ya banyak banget yang boncos gara-gara cuma modal semangat doang tapi eksekusinya ngaco. Intinya simpel, benerin dulu fondasinya baru jalan..."
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
            label="Menyimpan Gaya Ngobrol (Voice DNA) dan Spesifikasi Personal Dirimu..."
            onRefresh={handleAnalisisGayaBicara}
          />
        ) : (
          <button
            type="button"
            onClick={handleAnalisisGayaBicara}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs sm:text-sm py-3.5 rounded-lg hover:opacity-95 transition"
          >
            Simpan & Kunci Gaya Ngobrol + Spesifikasi Diri Saya
          </button>
        )}

        {/* RINGKASAN MATRIKS AKTIF */}
        <div className="bg-[#f4f5f7] p-5 rounded-xl border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-[#4d6b14]">
            Ringkasan Profil Kreator Aktif (Siap Dipakai untuk Fase 1, 2 & 3)
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#14141f] leading-relaxed">
            {personaProfile?.persona_summary}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-[#14141f]">
                1. Gaya Ngobrol (Voice DNA)
              </div>
              <div className="text-slate-600">
                Sapaan:{" "}
                <strong className="text-[#14141f]">
                  {personaProfile?.voice_dna?.self_pronoun ||
                    personaProfile?.linguistic_matrix?.self_pronoun ||
                    profil.selfPronounInput}{" "}
                  ke{" "}
                  {personaProfile?.voice_dna?.audience_pronoun ||
                    personaProfile?.linguistic_matrix?.audience_pronoun ||
                    profil.audiencePronounInput}
                </strong>
              </div>
              <div className="text-slate-600">
                Partikel Lisan:{" "}
                <strong className="text-[#14141f]">
                  {Array.isArray(partikelLisanAktif)
                    ? partikelLisanAktif.join(", ")
                    : partikelLisanAktif}
                </strong>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-[#4d6b14]">
                2. Spesifikasi Diri (Amunisi Trust)
              </div>
              <div className="text-slate-600">
                Jam Terbang:{" "}
                <strong className="text-[#14141f]">
                  {personaProfile?.niche_context?.unique_selling_point ||
                    personaProfile?.positioning_and_usp?.unique_selling_point ||
                    profil.uspDiriInput ||
                    "Pengalaman praktik"}
                </strong>
              </div>
              <div className="text-slate-600">
                Peran:{" "}
                <span>
                  {personaProfile?.niche_context?.authority_role ||
                    profil.peranSaatIni}
                </span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="font-bold text-[#5b4bc4]">
                3. Bidang & Target Penonton
              </div>
              <div className="text-slate-600">
                Bidang:{" "}
                <strong className="text-[#14141f]">
                  {personaProfile?.niche_context?.primary_niche ||
                    profil.minatUtama}
                </strong>
              </div>
              <div className="text-slate-600">
                Masalah Penonton:{" "}
                <span>
                  {personaProfile?.niche_context?.deepest_pain_points ||
                    personaProfile?.target_audience?.deepest_pain_points ||
                    profil.targetKetakutanInput ||
                    "Belum diisi"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BAGIAN 4: PILIHAN 10 BENTUK KONTEN VISUAL & JADWAL */}
      <section className="space-y-4 pt-6 border-t border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-[#14141f]">
            Bagian 4: Pilihan 10 Bentuk Konten Visual & Jadwal Ngonten
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Pilih gaya pengambilan gambar yang paling nyaman buat kamu (bisa
            tampil wajah atau tanpa wajah sama sekali).
          </p>
        </div>

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
              Jadwal Waktu Luang Harian untuk Rekaman
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
          showToast("Profil disimpan. Yuk mulai buat skrip kontenmu!")
        }}
        className="cursor-pointer w-full bg-[#d4f34a] text-[#14141f] font-bold text-sm py-3.5 rounded-lg hover:opacity-95 transition"
      >
        Simpan Profil & Lanjut Buat Skrip
      </button>
    </div>
  )
}
