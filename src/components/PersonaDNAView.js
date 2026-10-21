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

  // Bersihkan otomatis jika state masih menyimpan kalimat dummy bawaan lama
  useEffect(() => {
    if (rawWritingSamples === KALIMAT_DUMMY_LAMA) {
      setRawWritingSamples("")
    }
  }, [rawWritingSamples, setRawWritingSamples])

  const handleAnalisisGayaBicara = async () => {
    setIsGenerating(true)
    showToast("Sedang mempelajari karakteristik dan gaya bicaramu...")

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
            gaya_kepribadian: profil.kepribadianSosial,
            minat_utama: profil.minatUtama,
            tempat_rekam: profil.lingkunganRekam,
            waktu_luang: profil.waktuFree,
            sapaan_diri: profil.selfPronounInput,
            sapaan_audiens: profil.audiencePronounInput,
            prinsip_utama: profil.prinsipUtamaInput,
            pandangan_kontra: profil.opiniKontraInput,
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
      showToast("Profil dan gaya bicaramu berhasil diperbarui!")
    } catch (err) {
      showToast("Info: " + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-white p-5 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
          Kenali Dirimu & Gaya Bicaramu Sehari-hari
        </h2>
        <p className="text-xs font-normal text-slate-600 mt-1 leading-relaxed">
          Lengkapi profil, jadwal waktu luang, dan contoh kalimat aslimu di
          bawah ini agar setiap skrip yang dibuat terdengar natural seperti
          ucapanmu sendiri.
        </p>
      </div>

      {/* 1. IDENTITAS DASAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#14141f] mb-1.5">
            Nama Panggilan:
          </label>
          <input
            type="text"
            value={profil.nama}
            onChange={(e) => setProfil({ ...profil, nama: e.target.value })}
            placeholder="Contoh: Hani / Budi"
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

      {/* 2. SAPAAN KHAS & PERAN */}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectWithCustom
          label="Peran / Aktivitas Utamamu Saat Ini:"
          value={profil.peranSaatIni}
          options={[
            "Praktisi Bisnis & Kreator Digital",
            "Karyawan / Pekerja & Pebisnis Lokal",
            "Guru / Tenaga Pendidik",
            "Ibu / Bapak Rumah Tangga",
            "Mahasiswa / Anak Kos",
            "Pelajar SMP / SMA / SMK",
            "Freelancer / Pekerja Kreatif",
            "Pebisnis / UMKM / Penjual Online",
          ]}
          onChange={(val) => setProfil({ ...profil, peranSaatIni: val })}
          placeholderCustom="Ketik peran atau pekerjaanmu sendiri..."
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
            "Humoris & suka bercanda santai",
          ]}
          onChange={(val) => setProfil({ ...profil, kepribadianSosial: val })}
          placeholderCustom="Ketik gaya pembawaanmu sendiri..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#14141f] mb-1.5">
            Minat / Hobi / Bidang yang Sering Kamu Bahas:
          </label>
          <input
            type="text"
            value={profil.minatUtama}
            onChange={(e) =>
              setProfil({ ...profil, minatUtama: e.target.value })
            }
            placeholder="Contoh: Mengajar, Olahraga Lari, Keuangan, Memasak..."
            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-normal outline-none focus:bg-white"
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
          onChange={(val) => setProfil({ ...profil, lingkunganRekam: val })}
          placeholderCustom="Ketik lokasi rekamanmu sendiri..."
        />
      </div>

      {/* 3. PRINSIP & SUDUT PANDANG KHAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#14141f] mb-1.5">
            Prinsip Utama yang Kamu Pegang Saat Berbagi Konten:
          </label>
          <input
            type="text"
            value={profil.prinsipUtamaInput || ""}
            onChange={(e) =>
              setProfil({ ...profil, prinsipUtamaInput: e.target.value })
            }
            placeholder="Contoh: Praktik nyata lebih penting dari sekadar teori"
            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-normal outline-none focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#14141f] mb-1.5">
            Hal / Kebiasaan Umum yang Kurang Kamu Sukai:
          </label>
          <input
            type="text"
            value={profil.opiniKontraInput || ""}
            onChange={(e) =>
              setProfil({ ...profil, opiniKontraInput: e.target.value })
            }
            placeholder="Contoh: Kurang suka janji manis instan tanpa usaha"
            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-normal outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* 4. JADWAL WAKTU LUANG SISTEM CEKLIS */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
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

      {/* 5. CONTOH GAYA BICARA (MURNI PLACEHOLDER CONTOH PENGETIKAN, BUKAN TEKS TERKETIK) */}
      <div className="bg-[#f4f5f7] p-4 rounded-2xl border border-slate-200 space-y-2">
        <label className="block text-xs font-bold text-[#14141f]">
          Contoh Gaya Bicaramu Sehari-hari (Bisa Ketik atau Klik Ikon Mikrofon):
        </label>
        <p className="text-xs font-normal text-slate-600">
          Ceritakan bebas 2-3 kalimat dengan gaya ngobrol aslimu. Sistem akan
          mengenali kata sambung dan kosakata khas yang sering kamu gunakan.
        </p>
        <StoryVoiceInput
          rows={3}
          value={
            rawWritingSamples === KALIMAT_DUMMY_LAMA ? "" : rawWritingSamples
          }
          onChange={setRawWritingSamples}
          placeholder="Contoh pengetikan: Gini bro, jujur ya banyak banget yang boncos gara-gara cuma modal semangat doang tapi eksekusinya ngaco. Intinya simpel: benerin dulu fondasinya baru jalan..."
          onNotify={showToast}
        />
      </div>

      {isGenerating ? (
        <AILoadingBox
          label="Sedang mempelajari gaya bicara dan kosakata khasmu..."
          onRefresh={handleAnalisisGayaBicara}
        />
      ) : (
        <button
          type="button"
          onClick={handleAnalisisGayaBicara}
          className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs sm:text-sm py-4 rounded-2xl hover:opacity-95 transition flex items-center justify-center gap-2"
        >
          <span>Analisis & Perbarui Gaya Bicara Saya</span>
        </button>
      )}

      {/* 6. RINGKASAN GAYA BICARA */}
      <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-3">
        <span className="text-[11px] font-bold text-[#4d6b14] bg-[#f2fce2] px-2.5 py-0.5 rounded-md">
          RINGKASAN GAYA BICARAMU SAAT INI
        </span>
        <p className="text-xs sm:text-sm font-bold text-[#14141f] leading-relaxed">
          {personaProfile?.persona_summary}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <div className="font-bold text-[#14141f]">
              Kata & Sapaan Khas Kamu:
            </div>
            <div>
              Sapaan:{" "}
              <strong>
                {personaProfile?.linguistic_matrix?.self_pronoun} ➔{" "}
                {personaProfile?.linguistic_matrix?.audience_pronoun}
              </strong>
            </div>
            <div>
              Pembuka:{" "}
              {(
                personaProfile?.linguistic_matrix?.greeting_signature || []
              ).join(" | ")}
            </div>
            <div>
              Kata Khas:{" "}
              <strong className="text-[#4d6b14]">
                {(
                  personaProfile?.linguistic_matrix?.signature_vocabulary || []
                ).join(", ")}
              </strong>
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <div className="font-bold text-rose-700">
              Kata Kaku yang Otomatis Dihindari:
            </div>
            <p className="text-slate-600 leading-relaxed">
              {(personaProfile?.linguistic_matrix?.forbidden_words || []).join(
                ", ",
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 7. PILIHAN 10 BENTUK KONTEN */}
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

        <div className="bg-[#f4f5f7] rounded-2xl p-4 space-y-2">
          <label className="block text-xs font-bold text-[#14141f]">
            Deskripsikan Sendiri Bentuk Konten yang Kamu Inginkan (Opsional):
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
        type="button"
        onClick={async () => {
          await simpanPersonaKeSupabase(personaProfile)
          setActiveMenu("produksi")
          showToast("Profil disimpan! Yuk mulai buat skrip kontenmu.")
        }}
        className="cursor-pointer w-full bg-[#d4f34a] text-[#14141f] font-bold text-sm py-4 rounded-2xl shadow-xs"
      >
        Simpan Profil & Lanjut Buat Skrip ➔
      </button>
    </div>
  )
}
