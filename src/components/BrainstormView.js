"use client"
import { useState, useEffect, useRef } from "react"
import {
  FlatIcon,
  StoryVoiceInput,
  AILoadingBox,
  rekamKetikanKeGudangIngatan,
  ambilDataGudangIngatan,
  simpanAnalisaGudangIngatan,
} from "./SharedUI"

export default function BrainstormView({
  userId,
  namaUser,
  isPremiumUser = true,
  kuotaAkunMaksimal = 2,
  onTriggerUpgradeVIP,
  coins,
  updateKoinDatabase,
  personaProfile,
  bentukKontenFinal,
  simpanAtauUpdateSkripDatabase,
  setKoleksiSkripTersimpan,
  setHasilSkrip,
  setStage,
  setActiveMenu,
  showToast,
  onRefreshDataUser,
}) {
  const chatBottomRef = useRef(null)
  const storageChatKey = `hookya_brainstorm_chat_${userId || "guest"}`

  const [pesanInput, setPesanInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Saklar "Gunakan Akun Persona" (Default: false -> Bahasa Sosial Media Santai yang Formal)
  const [gunakanPersona, setGunakanPersona] = useState(false)
  const [daftarAkunSosmed, setDaftarAkunSosmed] = useState([])
  const [indexAkunTerpilih, setIndexAkunTerpilih] = useState(0)

  // State Gudang Ingatan (Otak AI)
  const [memoryVault, setMemoryVault] = useState({
    samples: [],
    reviewSingkat: "",
    rincianAnalisa: null,
  })
  const [bukaRincianIngatan, setBukaRincianIngatan] = useState(false)

  const [riwayatChat, setRiwayatChat] = useState([
    {
      id: "welcome_msg",
      role: "assistant",
      waktu: "Siap Membantu",
      balasanProduser:
        "Ceritakan secara bebas kamu mau membuat konten tentang apa, poin apa saja yang ingin disampaikan, atau masalah apa yang ingin dibahas. Aku akan merapikannya menjadi naskah siap rekam dengan teknik copywriting yang kuat.",
      teknikCopywriting: "Mode Brainstorm Copywriting",
      naskahHasil: null,
    },
  ])

  useEffect(() => {
    if (typeof window === "undefined") return
    setMemoryVault(ambilDataGudangIngatan(userId))

    try {
      const rawTernak = localStorage.getItem(
        `hookya_ternak_akun_${userId || "guest"}`,
      )
      if (rawTernak) {
        const parsed = JSON.parse(rawTernak)
        if (Array.isArray(parsed.daftarAkun) && parsed.daftarAkun.length > 0) {
          setDaftarAkunSosmed(parsed.daftarAkun)
        }
      }
    } catch {
      // Ignore storage error
    }

    try {
      const savedChat = localStorage.getItem(storageChatKey)
      if (savedChat) {
        const parsedChat = JSON.parse(savedChat)
        if (Array.isArray(parsedChat) && parsedChat.length > 0) {
          setRiwayatChat(parsedChat)
        }
      }
    } catch {
      // Ignore chat storage error
    }
  }, [userId, storageChatKey])

  const simpanChatKeLokal = (listChatBaru) => {
    setRiwayatChat(listChatBaru)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          storageChatKey,
          JSON.stringify(listChatBaru.slice(-15)),
        )
      } catch {
        // Ignore storage error
      }
    }
  }

  const akunPersonaAktif = daftarAkunSosmed[indexAkunTerpilih] || {
    id: "akun_utama",
    labelAkun: personaProfile?.account_label || `@${namaUser || "utama"}`,
    selfPronounInput:
      personaProfile?.voice_dna?.self_pronoun ||
      personaProfile?.linguistic_matrix?.self_pronoun ||
      "Gue",
    audiencePronounInput:
      personaProfile?.voice_dna?.audience_pronoun ||
      personaProfile?.linguistic_matrix?.audience_pronoun ||
      "Temen-temen",
    minatUtama:
      personaProfile?.niche_context?.primary_niche || "Konten Kreator",
    kepribadianSosial:
      personaProfile?.voice_dna?.delivery_style ||
      "To-the-point, Tajam, Santai",
    uspDiriInput:
      personaProfile?.niche_context?.unique_selling_point ||
      "Pengalaman praktik nyata",
  }

  const handleKirimBrainstorm = async () => {
    const teksBersih = pesanInput.trim()
    if (!teksBersih || isGenerating) {
      if (!teksBersih) {
        alert("Tuliskan ide atau penjelasan konten yang ingin kamu buat.")
      }
      return
    }

    if (coins < 1) {
      alert(
        "Saldo koin belum mencukupi (Perlu 1 Koin). Silakan isi ulang koin.",
      )
      setActiveMenu("topup")
      return
    }

    // Rekam ketikan ke Gudang Ingatan
    const vaultTerbaru = rekamKetikanKeGudangIngatan(
      userId,
      "Chat Brainstorm",
      teksBersih,
    )
    if (vaultTerbaru) setMemoryVault(vaultTerbaru)

    const jamSekarang = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })

    const pesanUserBaru = {
      id: `usr_${Date.now()}`,
      role: "user",
      waktu: jamSekarang,
      teks: teksBersih,
      modeBahasa: gunakanPersona
        ? `Persona: ${akunPersonaAktif.labelAkun}`
        : "Default: Sosmed Santai Formal",
    }

    const listSementara = [...riwayatChat, pesanUserBaru]
    simpanChatKeLokal(listSementara)
    setPesanInput("")
    setIsGenerating(true)

    await updateKoinDatabase(coins - 1)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "brainstorm_chat_script",
          userId,
          namaUser,
          pesanBrainstorm: teksBersih,
          riwayatChatBrainstorm: listSementara
            .filter((m) => m.role === "user")
            .map((m) => m.teks),
          gunakanPersona,
          akunPersonaTerpilih: gunakanPersona
            ? akunPersonaTerpilihData()
            : null,
          personaProfile,
          memoryVaultSamples: (vaultTerbaru || memoryVault).samples || [],
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.silentCoinUpdated != null) {
          updateKoinDatabase(data.silentCoinUpdated)
        }
        if (onRefreshDataUser) onRefreshDataUser()
        throw new Error("Gagal memproses brainstorm")
      }

      if (data.analisaGudangIngatan) {
        const vaultDisimpan = simpanAnalisaGudangIngatan(
          userId,
          data.analisaGudangIngatan,
        )
        if (vaultDisimpan) setMemoryVault(vaultDisimpan)
      }

      const balasanAIBaru = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        waktu: jamSekarang,
        balasanProduser:
          data.balasanProduser ||
          "Berikut adalah naskah yang sudah dirapikan dengan struktur copywriting:",
        teknikCopywriting:
          data.teknikCopywriting || "Copywriting Persuasif Hookya",
        naskahHasil: data.naskahHasil || null,
      }

      const listFinal = [...listSementara, balasanAIBaru]
      simpanChatKeLokal(listFinal)
      if (onRefreshDataUser) onRefreshDataUser()

      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 150)
    } catch {
      showToast(
        "Request gagal diproses. Koin Anda telah dikembalikan otomatis (Auto-Refund).",
      )
    } finally {
      setIsGenerating(false)
    }
  }

  function akunPersonaTerpilihData() {
    if (daftarAkunSosmed.length > 0 && daftarAkunSosmed[indexAkunTerpilih]) {
      return daftarAkunSosmed[indexAkunTerpilih]
    }
    return akunPersonaAktif
  }

  const handleSimpanNaskahBrainstorm = async (
    naskahObj,
    bukaDiEditor = false,
  ) => {
    if (!naskahObj) return
    const waktuSekarang = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

    const sectionsArr = Array.isArray(naskahObj.sections)
      ? naskahObj.sections
      : Array.isArray(naskahObj.segmen)
        ? naskahObj.segmen
        : []

    const skripBaru = {
      id: Date.now(),
      dbId: null,
      judul: naskahObj.judul || "Hasil Brainstorm Copywriting",
      kategori: "Brainstorm Copywriting",
      bentuk: bentukKontenFinal || "Talking Head Video Pendek (Reels/TikTok)",
      waktuDibuat: waktuSekarang,
      targetDuration: naskahObj.targetDuration || "60 Detik",
      kritikDetail: naskahObj.kritikDetail || null,
      uploadPackage: naskahObj.uploadPackage || null,
      uploadPack: naskahObj.uploadPackage || null,
      variasiFolder: [],
      sudahUpload: false,
      tanggalUpload: "",
      sections: sectionsArr,
      segmen: sectionsArr,
    }

    const tersimpan = await simpanAtauUpdateSkripDatabase(skripBaru)
    setKoleksiSkripTersimpan((prev) => [tersimpan, ...prev])

    if (bukaDiEditor) {
      setHasilSkrip(tersimpan)
      setStage(5)
      setActiveMenu("produksi")
    } else {
      showToast(
        `Naskah "${tersimpan.judul}" disimpan ke Arsip (di menu Kalender).`,
      )
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 pb-10">
      {/* Header Brainstorm */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D4F34A]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Asisten Copywriting Interaktif
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#14141F] mt-0.5">
              Brainstorm Ide ke Naskah
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
              Jelaskan secara bebas kamu mau membuat konten apa dan membahas
              apa. Sistem AI akan menerjemahkan dan merapikannya menjadi naskah
              dengan teknik copywriting yang kuat.
            </p>
          </div>
          {riwayatChat.length > 1 && (
            <button
              type="button"
              onClick={() => {
                simpanChatKeLokal([riwayatChat[0]])
                showToast("Riwayat obrolan Brainstorm dibersihkan.")
              }}
              className="cursor-pointer shrink-0 px-3 py-1.5 rounded-lg bg-[#F3F4F6] hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold border border-[#E2E8F0]"
            >
              Bersihkan Chat
            </button>
          )}
        </div>

        {/* Kartu Ringkas Gudang Ingatan (Klik untuk buka rincian analisa) */}
        <div className="bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] p-3 space-y-2">
          <button
            type="button"
            onClick={() => setBukaRincianIngatan(!bukaRincianIngatan)}
            className="cursor-pointer w-full flex items-center justify-between gap-2 text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#14141F] text-[#D4F34A] flex items-center justify-center shrink-0">
                <FlatIcon name="brain" className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#14141F] block">
                  Gudang Ingatan Otak AI ({(memoryVault.samples || []).length}{" "}
                  Rekaman Dipelajari)
                </span>
                <p className="text-[11px] text-slate-600 truncate">
                  {memoryVault.reviewSingkat ||
                    "Klik untuk melihat hasil analisa gaya bahasa dari ketikanmu"}
                </p>
              </div>
            </div>
            <FlatIcon
              name="chevronDown"
              className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                bukaRincianIngatan ? "rotate-180" : ""
              }`}
            />
          </button>

          {bukaRincianIngatan && (
            <div className="pt-2.5 border-t border-[#E2E8F0] space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] space-y-1.5">
                <div className="font-bold text-[#14141F]">
                  Review Analisa Otak AI:
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {memoryVault.reviewSingkat}
                </p>
                {memoryVault.rincianAnalisa && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px]">
                    <div className="p-2 rounded bg-[#F3F4F6]">
                      <strong className="block text-[#14141F]">
                        Gaya Bahasa Terdeteksi:
                      </strong>
                      <span className="text-slate-600">
                        {memoryVault.rincianAnalisa.gayaBahasaTerdeteksi || "-"}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#F3F4F6]">
                      <strong className="block text-[#14141F]">
                        Pola Kalimat & Ritme:
                      </strong>
                      <span className="text-slate-600">
                        {memoryVault.rincianAnalisa.polaKalimat || "-"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Area Riwayat Percakapan Brainstorm */}
      <section className="space-y-3.5">
        {riwayatChat.map((msg) => {
          if (msg.role === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[88%] sm:max-w-[78%] bg-[#14141F] text-white rounded-2xl rounded-tr-sm p-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-[10px] text-[#D4F34A] font-bold">
                    <span>{msg.modeBahasa}</span>
                    <span className="text-slate-400">{msg.waktu}</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {msg.teks}
                  </p>
                </div>
              </div>
            )
          }

          const naskah = msg.naskahHasil
          const sections = Array.isArray(naskah?.sections)
            ? naskah.sections
            : []

          return (
            <div key={msg.id} className="flex justify-start">
              <div className="w-full bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#D4F34A] text-[#14141F] font-extrabold text-xs flex items-center justify-center">
                      H
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#14141F] block">
                        Copywriter AI Hookya
                      </span>
                      <span className="text-[10px] font-semibold text-[#4D6B14] bg-[#F2FCE2] px-2 py-0.5 rounded">
                        {msg.teknikCopywriting}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {msg.waktu}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {msg.balasanProduser}
                </p>

                {naskah && sections.length > 0 && (
                  <div className="bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] p-3.5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          Draf Naskah Copywriting Siap Pakai
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-[#14141F]">
                          {naskah.judul}
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold bg-[#D4F34A] text-[#14141F] px-2.5 py-1 rounded-md">
                        {sections.length} Bagian
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {sections.map((sec, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-lg border border-[#E2E8F0] space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-[#14141F]">
                              Bagian {sec.partNumber || idx + 1} •{" "}
                              {sec.partTitle}
                            </span>
                            <span className="text-[#4D6B14]">
                              {sec.estimatedSeconds}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-[#14141F] leading-relaxed whitespace-pre-line">
                            {sec.spokenText || sec.voiceover}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleSimpanNaskahBrainstorm(naskah, true)
                        }
                        className="cursor-pointer flex-1 min-h-[42px] px-3.5 py-2 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <FlatIcon name="tv" className="w-4 h-4" />
                        <span>Buka di Editor & Teleprompter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleSimpanNaskahBrainstorm(naskah, false)
                        }
                        className="cursor-pointer min-h-[42px] px-3.5 py-2 rounded-lg bg-[#14141F] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <FlatIcon name="bookmark" className="w-4 h-4" />
                        <span>Simpan ke Arsip</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const teksGabung = sections
                            .map(
                              (s) =>
                                `[Bagian ${s.partNumber} • ${s.partTitle}]\n${
                                  s.spokenText || s.voiceover
                                }`,
                            )
                            .join("\n\n")
                          navigator.clipboard.writeText(teksGabung)
                          showToast("Naskah hasil Brainstorm disalin.")
                        }}
                        className="cursor-pointer min-h-[42px] px-3 py-2 rounded-lg bg-white border border-[#C8C5CC] text-[#14141F] text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <FlatIcon name="copy" className="w-4 h-4" />
                        <span>Salin</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {isGenerating && (
          <AILoadingBox
            label="Menerjemahkan penjelasanmu menjadi naskah dengan teknik copywriting..."
            onRefresh={handleKirimBrainstorm}
          />
        )}
        <div ref={chatBottomRef} />
      </section>

      {/* Panel Input Brainstorm & Saklar Slide "Gunakan Akun Persona" */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setGunakanPersona(!gunakanPersona)}
            className={`cursor-pointer min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border transition ${
              gunakanPersona
                ? "bg-[#14141F] text-[#D4F34A] border-[#14141F]"
                : "bg-[#F3F4F6] text-[#14141F] border-[#E2E8F0]"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                gunakanPersona ? "bg-[#D4F34A]" : "bg-slate-400"
              }`}
            />
            <span>Gunakan Akun Persona</span>
          </button>

          <span className="text-[11px] text-slate-500">
            {gunakanPersona
              ? `Memakai gaya bicara ${akunPersonaAktif.labelAkun}`
              : "Default: Bahasa sosial media santai yang formal"}
          </span>
        </div>

        {/* Pilihan Slide ke Samping saat "Gunakan Akun Persona" Aktif */}
        {gunakanPersona && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5">
            {daftarAkunSosmed.length === 0 ? (
              <button
                type="button"
                className="shrink-0 px-3.5 py-2 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold flex items-center gap-1.5"
              >
                <span>{akunPersonaAktif.labelAkun}</span>
                <FlatIcon name="check" className="w-3.5 h-3.5" />
              </button>
            ) : (
              daftarAkunSosmed.map((ak, idx) => {
                const terkunci = idx >= kuotaAkunMaksimal
                const dipilih = indexAkunTerpilih === idx && !terkunci

                return (
                  <button
                    key={ak.id || idx}
                    type="button"
                    onClick={() => {
                      if (terkunci) {
                        showToast(
                          `Akun ${ak.labelAkun} terkunci karena kuota paket aktif (${kuotaAkunMaksimal} akun).`,
                        )
                        setActiveMenu("topup")
                        return
                      }
                      setIndexAkunTerpilih(idx)
                      showToast(`Menggunakan persona ${ak.labelAkun}`)
                    }}
                    className={`cursor-pointer shrink-0 min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border transition ${
                      terkunci
                        ? "bg-slate-100 text-slate-400 border-dashed border-slate-300"
                        : dipilih
                          ? "bg-[#D4F34A] text-[#14141F] border-[#14141F] font-bold"
                          : "bg-[#F8F9FA] text-[#14141F] border-[#E2E8F0] font-semibold hover:border-[#14141F]"
                    }`}
                  >
                    {terkunci && (
                      <FlatIcon name="lock" className="w-3.5 h-3.5" />
                    )}
                    <span>{ak.labelAkun}</span>
                    {dipilih && (
                      <FlatIcon name="check" className="w-3.5 h-3.5" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        )}

        <StoryVoiceInput
          rows={3}
          value={pesanInput}
          onChange={setPesanInput}
          userId={userId}
          memorySourceLabel="Chat Brainstorm"
          placeholder="Ceritakan mau bikin konten apa, isinya apa, atau tempel draf kasar kamu di sini..."
          onNotify={showToast}
        />

        <button
          type="button"
          disabled={isGenerating}
          onClick={handleKirimBrainstorm}
          className="cursor-pointer w-full min-h-[48px] bg-[#14141F] text-[#D4F34A] text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.99] transition disabled:opacity-50"
        >
          <FlatIcon name="send" className="w-4 h-4" />
          <span>
            {isGenerating
              ? "Meracik Naskah Copywriting..."
              : "Ubah Jadi Naskah Copywriting Kuat (1 Koin)"}
          </span>
        </button>
      </section>
    </div>
  )
}
