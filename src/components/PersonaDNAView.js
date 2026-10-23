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

  // Bersihkan otomatis jika state masih menyimpan kalimat dummy lama
  useEffect(() => {
    if (rawWritingSamples === KALIMAT_DUMMY_LAMA) {
      setRawWritingSamples("")
    }
  }, [rawWritingSamples, setRawWritingSamples])

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
        throw new Error(data.error || "Gagal mempelajari gaya bicara")
      }

      setPersonaProfile(data)
      await simpanPersonaKeSupabase(data)
      showToast("Profiling 360° & Gaya Bicaramu berhasil diperbarui!")
    } catch (err) {
      showToast("Info: " + err.message)
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
          Data di halaman ini menjadi fondasi utama agar setiap skrip yang
          dihasilkan 100% personal, punya karakter kuat, dan tepat sasaran ke
          psikologi penontonmu.
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
            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:bg-white"
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
          <SelectWithCustom
            label="Positioning / Peran Otoritasmu di Mata Penonton:"
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

          <SelectWithCustom
            label="Karakter & Gaya Pembawaan:"
            value={profil.kepribadianSosial}
            options={[
              "Santai, jujur, dan peduli seperti kakak senior di warung kopi",
              "Ambivert (Santai kalau sudah kenal, tapi malas tampil berlebihan)",
              "Introvert (Tenang, Pengamat, Suka di Balik Layar)",
              "Ekstrovert (Ekspresif, Suka Ngobrol & Bercerita)",
              "Tegas, lugas, dan langsung ke inti masalah",
            ]}
            onChange={(val) => setProfil({ ...profil, kepribadianSosial: val })}
            placeholderCustom="Ketik gaya pembawaanmu sendiri..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#14141f] mb-1.5">
              Unique Selling Point (USP) / Keunikan Latar Belakangmu:
            </label>
            <input
              type="text"
              value={profil.uspDiriInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, uspDiriInput: e.target.value })
              }
              placeholder="Contoh: Anak manajemen yang ngoding, pelari rutin & affiliator"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#14141f] mb-1.5">
              Musuh Bersama (Hal yang Paling Kamu Tentang di Topikmu):
            </label>
            <input
              type="text"
              value={profil.opiniKontraInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, opiniKontraInput: e.target.value })
              }
              placeholder="Contoh: Menentang teori motivasi kosong tanpa langkah nyata"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#14141f] mb-1.5">
              Minat / Bidang Utama yang Sering Kamu Bahas:
            </label>
            <input
              type="text"
              value={profil.minatUtama}
              onChange={(e) =>
                setProfil({ ...profil, minatUtama: e.target.value })
              }
              placeholder="Contoh: Bisnis, Keuangan Praktis, Teknologi & Olahraga Lari"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#14141f] mb-1.5">
              Analogi / Perumpamaan Favoritmu Saat Menjelaskan Sesuatu:
            </label>
            <input
              type="text"
              value={profil.analogiKhasInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, analogiKhasInput: e.target.value })
              }
              placeholder="Contoh: Suka pakai perumpamaan lari maraton, tongkrongan, atau dagang"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
            />
          </div>
        </div>
      </div>

      {/* BAGIAN 3: PSIKOLOGI TARGET AUDIENS (PENONTONMU) */}
      <div className="bg-[#f0eeff] p-4 sm:p-5 rounded-3xl border border-[#5b4bc4]/20 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#14141f]">
            2. Peta Psikologi Target Audiens (Penontonmu)
          </h3>
          <p className="text-xs text-slate-600">
            Agar kalimat Hook dan isi skrip tepat menusuk ke masalah dan
            keinginan penontonmu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#14141f] mb-1.5">
              Siapa Target Penonton Utamamu?
            </label>
            <input
              type="text"
              value={profil.targetSegmenInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetSegmenInput: e.target.value })
              }
              placeholder="Contoh: Anak muda 20-35 thn yang ingin produktif / cari penghasilan tambahan"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#14141f] mb-1.5">
              Ketakutan / Masalah Terbesar Mereka Saat Ini (Pain Points):
            </label>
            <input
              type="text"
              value={profil.targetKetakutanInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetKetakutanInput: e.target.value })
              }
              placeholder="Contoh: Takut boncos, takut salah beli barang, atau gaji habis terus"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#14141f] mb-1.5">
              Hasil Impian yang Paling Mereka Inginkan (Secret Desires):
            </label>
            <input
              type="text"
              value={profil.targetImpianInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetImpianInput: e.target.value })
              }
              placeholder="Contoh: Punya penghasilan stabil, badan bugar, atau barang awet murah"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#14141f] mb-1.5">
              Alasan Mereka Biasanya Ragu / Malas Bertindak (Objections):
            </label>
            <input
              type="text"
              value={profil.targetKeraguanInput || ""}
              onChange={(e) =>
                setProfil({ ...profil, targetKeraguanInput: e.target.value })
              }
              placeholder="Contoh: Ngerasa nggak punya waktu luang atau takut ribet"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
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
                      placeholder="10:00"
                      className="w-16 bg-[#f4f5f7] border border-slate-200 rounded-lg px-2 py-1 text-center font-bold text-xs"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* BAGIAN 5: CONTOH GAYA BICARA (MURNI PLACEHOLDER CONTOH PENGETIKAN & KUNCI MIC UNTUK PAKET < 20RB) */}
      <div className="bg-[#f4f5f7] p-4 rounded-2xl border border-slate-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="block text-xs font-bold text-[#14141f]">
            3. Contoh Gaya Bicaramu Sehari-hari:
          </label>
          {!isPremiumUser && (
            <button
              type="button"
              onClick={onTriggerUpgradeVIP}
              className="cursor-pointer text-[11px] font-bold bg-[#14141f] text-[#d4f34a] px-2.5 py-1 rounded-lg"
            >
              👑 Fitur Rekam Suara Mic Khusus Paket Rp25.000+
            </button>
          )}
        </div>
        <p className="text-xs font-normal text-slate-600">
          Ceritakan bebas 2-3 kalimat dengan gaya ngobrol aslimu. Sistem akan
          mengenali kata sambung dan kosakata khas yang sering kamu gunakan.
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
              className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 pr-14 text-xs sm:text-sm font-normal text-[#14141f] placeholder:text-slate-400 outline-none"
            />
            <button
              type="button"
              onClick={onTriggerUpgradeVIP}
              title="Fitur Mikrofon khusus Paket Kreator (Rp25.000) ke atas"
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
