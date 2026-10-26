"use client"
import { useState } from "react"
import { FlatIcon, AILoadingBox } from "./SharedUI"

function ekstrakFrameVideoStabil(file, jumlahFrame = 5) {
  return new Promise((resolve) => {
    let selesai = false
    const finish = (res) => {
      if (!selesai) {
        selesai = true
        resolve(res)
      }
    }
    const timer = setTimeout(() => finish([]), 6500)

    try {
      const video = document.createElement("video")
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const url = URL.createObjectURL(file)

      video.preload = "metadata"
      video.muted = true
      video.playsInline = true
      video.setAttribute("playsinline", "")
      video.src = url

      const frames = []
      video.onloadedmetadata = async () => {
        try {
          const durasi = Math.min(Math.max(video.duration || 6, 2), 60)
          const lebar = 480
          const tinggi =
            Math.round((video.videoHeight / (video.videoWidth || 1)) * lebar) ||
            320
          canvas.width = lebar
          canvas.height = tinggi

          for (let i = 1; i <= jumlahFrame; i++) {
            const t = (durasi / (jumlahFrame + 1)) * i
            await new Promise((r) => {
              const tSeek = setTimeout(r, 650)
              video.onseeked = () => {
                clearTimeout(tSeek)
                try {
                  ctx.drawImage(video, 0, 0, lebar, tinggi)
                  const base64 = canvas
                    .toDataURL("image/jpeg", 0.65)
                    .split(",")[1]
                  if (base64) frames.push(base64)
                } catch {
                  // Ignore single frame error
                }
                r()
              }
              video.currentTime = t
            })
          }
        } finally {
          clearTimeout(timer)
          URL.revokeObjectURL(url)
          finish(frames)
        }
      }
      video.onerror = () => {
        clearTimeout(timer)
        URL.revokeObjectURL(url)
        finish([])
      }
      video.load()
    } catch {
      clearTimeout(timer)
      finish([])
    }
  })
}

async function ekstrakAudioRinganAman(file) {
  return new Promise(async (resolve) => {
    const timer = setTimeout(() => resolve(null), 6000)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) {
        clearTimeout(timer)
        return resolve(null)
      }

      const audioCtx = new AudioCtx()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      audioCtx.close()

      const durasiDetik = Math.round(audioBuffer.duration || 45)
      const targetSampleRate = 8000
      const maxSeconds = Math.min(audioBuffer.duration, 45)
      const numSamples = Math.floor(maxSeconds * targetSampleRate)

      const offlineCtx = new OfflineAudioContext(
        1,
        numSamples,
        targetSampleRate,
      )
      const source = offlineCtx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(offlineCtx.destination)
      source.start(0)

      const renderedBuffer = await offlineCtx.startRendering()
      const channelData = renderedBuffer.getChannelData(0)

      const wavBuffer = new ArrayBuffer(44 + channelData.length * 2)
      const view = new DataView(wavBuffer)
      const writeString = (offset, str) => {
        for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i))
        }
      }

      writeString(0, "RIFF")
      view.setUint32(4, 36 + channelData.length * 2, true)
      writeString(8, "WAVE")
      writeString(12, "fmt ")
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, 1, true)
      view.setUint32(24, targetSampleRate, true)
      view.setUint32(28, targetSampleRate * 2, true)
      view.setUint16(32, 2, true)
      view.setUint16(34, 16, true)
      writeString(36, "data")
      view.setUint32(40, channelData.length * 2, true)

      let offset = 44
      for (let i = 0; i < channelData.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, channelData[i]))
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      }

      const bytes = new Uint8Array(wavBuffer)
      let binary = ""
      const chunkSize = 8192
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(
          null,
          bytes.subarray(i, i + chunkSize),
        )
      }
      clearTimeout(timer)
      resolve({
        base64: btoa(binary),
        mimeType: "audio/wav",
        durasiDetik,
      })
    } catch {
      clearTimeout(timer)
      resolve(null)
    }
  })
}

function formatDetikKeMenit(detik = 0) {
  const m = String(Math.floor(detik / 60)).padStart(2, "0")
  const s = String(detik % 60).padStart(2, "0")
  return `${m}:${s}`
}

export default function VideoExtractorView({
  userId,
  namaUser,
  isPremiumUser = true,
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
}) {
  const [fileInfo, setFileInfo] = useState({
    namaFile: "",
    ukuranMB: "",
    durasiTeks: "00:00",
    framesBase64: [],
    audioBase64: "",
    audioMime: "",
    sedangUraiAudio: false,
  })

  const [transkripAsli, setTranskripAsli] = useState("")
  const [isEditingTranskrip, setIsEditingTranskrip] = useState(false)
  const [isTranscribingFile, setIsTranscribingFile] = useState(false)
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [daftarDraftVariasi, setDaftarDraftVariasi] = useState([])

  const handlePilihFileMedia = async (e) => {
    if (!isPremiumUser) {
      onTriggerUpgradeVIP()
      return
    }
    const file = e.target.files?.[0]
    if (!file) return

    const ukuran = (file.size / (1024 * 1024)).toFixed(1)
    setFileInfo({
      namaFile: file.name,
      ukuranMB: `${ukuran} MB`,
      durasiTeks: "00:45",
      framesBase64: [],
      audioBase64: "",
      audioMime: "",
      sedangUraiAudio: true,
    })
    setDaftarDraftVariasi([])

    try {
      let frames = []
      if (
        file.type.startsWith("video/") ||
        file.name.match(/\.(mp4|mov|webm|mkv)$/i)
      ) {
        frames = await ekstrakFrameVideoStabil(file, 5)
      }
      const audioRes = await ekstrakAudioRinganAman(file)
      const durTeks = formatDetikKeMenit(audioRes?.durasiDetik || 45)

      setFileInfo({
        namaFile: file.name,
        ukuranMB: `${ukuran} MB`,
        durasiTeks: durTeks,
        framesBase64: frames,
        audioBase64: audioRes?.base64 || "",
        audioMime: audioRes?.mimeType || "audio/wav",
        sedangUraiAudio: false,
      })

      setIsTranscribingFile(true)
      showToast("Mengurai jalur suara menjadi transkrip teks asli...")

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transkrip_file_video",
          userId,
          namaUser,
          namaFileVideo: file.name,
          framesBase64: frames,
          mediaBase64: audioRes?.base64 || "",
          mediaMimeType: audioRes?.mimeType || "audio/wav",
        }),
      })
      const data = await res.json()
      if (res.ok && data.transkripAsliVideo) {
        setTranskripAsli(data.transkripAsliVideo)
        showToast("100% Audio terurai menjadi transkrip teks.")
      } else {
        showToast(
          "Audio siap. Kamu juga bisa mengetik atau mengedit transkrip secara manual.",
        )
      }
    } catch {
      setFileInfo((prev) => ({ ...prev, sedangUraiAudio: false }))
    } finally {
      setIsTranscribingFile(false)
    }
  }

  const handleTransformasiNaskahPersona = async () => {
    if (!isPremiumUser) {
      onTriggerUpgradeVIP()
      return
    }
    if (!transkripAsli.trim() && !fileInfo.namaFile) {
      alert(
        "Unggah file video/audio terlebih dahulu atau ketik transkrip pada kotak Tahap 1.",
      )
      return
    }
    if (coins < 1) {
      alert("Saldo koin belum mencukupi (Perlu 1 Koin).")
      setActiveMenu("topup")
      return
    }

    setIsSynthesizing(true)
    await updateKoinDatabase(coins - 1)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rewrite_video",
          userId,
          namaUser,
          personaProfile,
          namaFileVideo: fileInfo.namaFile || "video_referensi.mp4",
          transkripMentahInput: transkripAsli.trim(),
          framesBase64: fileInfo.framesBase64,
          mediaBase64: fileInfo.audioBase64,
          mediaMimeType: fileInfo.audioMime,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.silentCoinUpdated != null) {
          updateKoinDatabase(data.silentCoinUpdated)
        }
        throw new Error("Gagal transformasi naskah")
      }

      if (data.transkripAsliVideo && !transkripAsli.trim()) {
        setTranskripAsli(data.transkripAsliVideo)
      }

      const drafts = Array.isArray(data.draftVariasi)
        ? data.draftVariasi
        : [
            {
              idDraft: "Draft #01",
              badgeFormat: "Hook Kontras / Anti-Gimmick",
              judul: data.intiPesanVideo || "Hasil Transformasi Naskah Persona",
              cuplikanHook: data.segmen?.[0]?.voiceover || "",
              estimasiDurasi: "45s",
              struktur: "PAPC (Problem-Agitate-Proof-CTA)",
              segmen: data.segmen || [],
            },
          ]

      setDaftarDraftVariasi(drafts)
      showToast("2 variasi draf naskah sesuai profilmu siap digunakan.")
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsSynthesizing(false)
    }
  }

  const handleSimpanDraftKeArsip = async (draftItem, bukaLangsung = false) => {
    const waktuSekarang = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

    const skripBaru = {
      id: Date.now(),
      dbId: null,
      judul: draftItem.judul || "Hasil Ekstrak Suara Video",
      kategori: "Ekstrak Audio Video",
      bentuk: draftItem.badgeFormat || bentukKontenFinal,
      waktuDibuat: waktuSekarang,
      sudahUpload: false,
      tanggalUpload: "",
      sections: draftItem.segmen || [],
      segmen: draftItem.segmen || [],
      variasiFolder: [],
    }

    const tersimpan = await simpanAtauUpdateSkripDatabase(skripBaru)
    setKoleksiSkripTersimpan((prev) => [tersimpan, ...prev])

    if (bukaLangsung && setHasilSkrip && setStage) {
      setHasilSkrip(tersimpan)
      setStage(5)
      setActiveMenu("produksi")
    } else {
      showToast(`"${tersimpan.judul}" disimpan ke Arsip.`)
    }
  }

  const jumlahKataTranskrip = transkripAsli.trim()
    ? transkripAsli.trim().split(/\s+/).filter(Boolean).length
    : 0

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header / Intro Banner */}
      <section className="space-y-3 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D4F34A]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Alur Audio Cerdas
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#14141F] tracking-tight">
            Ekstrak Suara Video ke Naskah
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Unggah video referensi atau rekaman suara untuk diubah otomatis
            menjadi skrip konten berkarakter unik sesuai gaya bicaramu.
          </p>
        </div>

        <div className="flex items-start gap-2.5 p-3 bg-[#F3F4F6] rounded-lg border border-[#E2E8F0] text-slate-600 text-xs">
          <span className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 text-[#14141F]">
            i
          </span>
          <span>
            Mendukung format .mp4, .mov, .mp3 • Hanya mengambil jalur audio
            tanpa menyimpan file video besar.
          </span>
        </div>
      </section>

      {/* Audio / Video Upload Box */}
      <section className="space-y-4">
        <label
          onClick={(e) => {
            if (!isPremiumUser) {
              e.preventDefault()
              onTriggerUpgradeVIP()
            }
          }}
          className="cursor-pointer flex flex-col items-center justify-center p-6 bg-white rounded-xl text-center gap-2.5 border-2 border-dashed border-slate-300 hover:border-[#14141F] transition"
        >
          <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#14141F]">
            <FlatIcon name="upload" className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#14141F]">
              Tarik file ke sini atau ketuk untuk telusuri
            </p>
            <div className="flex items-center justify-center gap-1.5 flex-wrap text-[11px]">
              <span className="px-2 py-0.5 bg-[#EDEFF0] text-slate-600 rounded font-semibold">
                .MP4
              </span>
              <span className="px-2 py-0.5 bg-[#EDEFF0] text-slate-600 rounded font-semibold">
                .MOV
              </span>
              <span className="px-2 py-0.5 bg-[#EDEFF0] text-slate-600 rounded font-semibold">
                .MP3
              </span>
              <span className="text-slate-500">(Maks 150MB)</span>
            </div>
          </div>
          <span className="mt-1 bg-[#14141F] text-white rounded-lg py-2.5 px-5 text-xs font-bold min-h-[44px] w-full max-w-xs flex items-center justify-center gap-2">
            <FlatIcon name="upload" className="w-4 h-4" />
            <span>Pilih File dari Perangkat</span>
          </span>
          {isPremiumUser && (
            <input
              type="file"
              accept="video/*,audio/*"
              onChange={handlePilihFileMedia}
              className="hidden"
            />
          )}
        </label>

        {/* Active File Card & Waveform Display */}
        {fileInfo.namaFile && (
          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#EDEFF0] flex items-center justify-center shrink-0 text-[#14141F]">
                  <FlatIcon name="tv" className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-[#14141F] block truncate">
                    {fileInfo.namaFile}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {fileInfo.ukuranMB} • Durasi {fileInfo.durasiTeks}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 bg-[#D4F34A] text-[#14141F]">
                {fileInfo.sedangUraiAudio
                  ? "Mengurai Audio..."
                  : "100% Audio Terurai"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1 h-9 px-3 bg-[#F3F4F6] rounded-lg overflow-hidden py-1.5">
              {[
                3, 5, 7, 4, 6, 8, 5, 7, 3, 6, 8, 4, 7, 5, 8, 6, 3, 7, 5, 6, 4,
                7, 3, 6, 5, 8, 4, 6, 3, 5,
              ].map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h * 3}px` }}
                  className="w-1 bg-[#D4F34A] rounded-full"
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Step 1 Box: Transkrip Suara Asli */}
      <section className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-[#F3F4F6] border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#14141F] text-white rounded text-xs font-bold">
              Tahap 1
            </span>
            <h2 className="text-sm font-bold text-[#14141F]">
              Transkrip Suara Asli
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Original Voice Audio
          </span>
        </div>

        <div className="p-4 space-y-3">
          {isTranscribingFile ? (
            <AILoadingBox label="Menyalin ucapan suara dari file media..." />
          ) : (
            <textarea
              rows={4}
              readOnly={!isEditingTranskrip && Boolean(transkripAsli)}
              value={transkripAsli}
              onChange={(e) => setTranskripAsli(e.target.value)}
              placeholder="Unggah file video/audio di atas untuk mengekstrak transkrip suara asli secara otomatis, atau ketik/tempel transkrip secara manual di sini..."
              className={`w-full p-3 rounded-lg text-base sm:text-sm text-[#14141F] leading-relaxed focus:outline-none ${
                isEditingTranskrip || !transkripAsli
                  ? "bg-[#F8F9FA] border border-[#14141F]"
                  : "bg-white border border-[#E2E8F0]"
              }`}
            />
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <FlatIcon name="clock" className="w-4 h-4" />
              <span>
                {jumlahKataTranskrip} Kata • Durasi Suara: {fileInfo.durasiTeks}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingTranskrip(!isEditingTranskrip)}
                className="cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#EDEFF0] text-[#14141F] text-xs font-semibold min-h-[40px]"
              >
                <FlatIcon name="edit" className="w-3.5 h-3.5" />
                <span>
                  {isEditingTranskrip ? "Selesai Edit" : "Edit Manual"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!transkripAsli.trim()) return
                  navigator.clipboard.writeText(transkripAsli)
                  showToast("Transkrip asli berhasil disalin.")
                }}
                className="cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#EDEFF0] text-[#14141F] text-xs font-semibold min-h-[40px]"
              >
                <FlatIcon name="copy" className="w-3.5 h-3.5" />
                <span>Salin Transkrip</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2 Box: Transformasi Naskah Persona */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[#14141F] text-white rounded text-xs font-bold">
            Tahap 2
          </span>
          <h2 className="text-base font-bold text-[#14141F]">
            Transformasi Naskah Persona
          </h2>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#D4F34A]/20 border border-[#D4F34A]/60">
          <div className="w-6 h-6 rounded-full bg-[#D4F34A] text-[#14141F] flex items-center justify-center shrink-0 font-bold">
            <FlatIcon name="check" className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-[#14141F] block truncate">
              Persona Aktif:{" "}
              {personaProfile?.account_label || namaUser || "@akun.utama"}
            </span>
            <span className="text-[11px] text-slate-600 block truncate">
              Karakteristik:{" "}
              {personaProfile?.voice_dna?.delivery_style ||
                "Gaya Bicara Khas Kreator"}{" "}
              • {personaProfile?.niche_context?.primary_niche || "Multi-Topik"}
            </span>
          </div>
        </div>

        {isSynthesizing ? (
          <AILoadingBox
            label="Mentransformasi transkrip menjadi naskah sesuai profil personamu..."
            onRefresh={handleTransformasiNaskahPersona}
          />
        ) : (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleTransformasiNaskahPersona}
              className="cursor-pointer w-full bg-[#14141F] text-[#D4F34A] min-h-[48px] py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <FlatIcon name="bolt" className="w-4 h-4" />
              <span>Ubah Jadi Naskah Sesuai Profil Saya</span>
            </button>
            <div className="text-center text-[11px] text-slate-500">
              Biaya proses: Potong 1 Koin Hookya
            </div>
          </div>
        )}

        {/* Resulting Script Draft Cards */}
        {daftarDraftVariasi.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#14141F]">
                Hasil Variasi Draft ({daftarDraftVariasi.length} Siap Pakai)
              </span>
              <span className="text-[11px] text-slate-500">
                Model: Hookya-Synthesize-v2
              </span>
            </div>

            {daftarDraftVariasi.map((dr, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-[#E2E8F0] space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                      idx === 0
                        ? "bg-[#F0EEFF] text-[#3B2D71]"
                        : "bg-[#F2FCE2] text-[#225414]"
                    }`}
                  >
                    {dr.badgeFormat || `Variasi #${idx + 1}`}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {dr.idDraft || `Draft #0${idx + 1}`}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#14141F] leading-snug">
                  {dr.judul}
                </h3>

                {dr.cuplikanHook && (
                  <div className="p-3 bg-[#F3F4F6] rounded-lg text-xs text-[#14141F] italic leading-relaxed">
                    &ldquo;{dr.cuplikanHook}&rdquo;
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600">
                  {dr.estimasiDurasi && (
                    <span className="px-2 py-1 bg-[#EDEFF0] rounded font-medium">
                      Estimasi: {dr.estimasiDurasi}
                    </span>
                  )}
                  {dr.struktur && (
                    <span className="px-2 py-1 bg-[#EDEFF0] rounded font-medium">
                      {dr.struktur}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSimpanDraftKeArsip(dr, true)}
                    className="cursor-pointer flex-1 bg-[#D4F34A] text-[#14141F] font-bold text-xs py-2.5 px-3 rounded-lg min-h-[44px] flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <FlatIcon name="check" className="w-4 h-4" />
                    <span>Gunakan Skrip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimpanDraftKeArsip(dr, false)}
                    className="cursor-pointer px-3.5 py-2.5 rounded-lg bg-[#EDEFF0] text-[#14141F] text-xs font-semibold min-h-[44px] flex items-center justify-center gap-1.5"
                  >
                    <FlatIcon name="bookmark" className="w-4 h-4" />
                    <span>Simpan ke Arsip</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
