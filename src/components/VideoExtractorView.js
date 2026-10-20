"use client"
import { useState } from "react"
import { FlatIcon, StoryVoiceInput } from "./SharedUI"

// 1. Ekstrak 6 tangkapan gambar tajam dari video agar teks di layar video terbaca jelas oleh AI
function ekstrakFrameVideoTajam(file, jumlahFrame = 6) {
  return new Promise((resolve) => {
    let selesai = false
    const finish = (res) => {
      if (!selesai) {
        selesai = true
        resolve(res)
      }
    }
    const timer = setTimeout(() => finish([]), 3500)

    try {
      const video = document.createElement("video")
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const url = URL.createObjectURL(file)

      video.preload = "metadata"
      video.src = url
      video.muted = true
      video.playsInline = true

      const frames = []
      video.onloadeddata = async () => {
        try {
          const durasi = Math.min(video.duration || 4, 60)
          const lebar = 480
          const tinggi =
            Math.round((video.videoHeight / (video.videoWidth || 1)) * lebar) ||
            270
          canvas.width = lebar
          canvas.height = tinggi

          for (let i = 1; i <= jumlahFrame; i++) {
            const t = (durasi / (jumlahFrame + 1)) * i
            await new Promise((r) => {
              const tSeek = setTimeout(r, 500)
              video.onseeked = () => {
                clearTimeout(tSeek)
                try {
                  ctx.drawImage(video, 0, 0, lebar, tinggi)
                  const base64 = canvas
                    .toDataURL("image/jpeg", 0.65)
                    .split(",")[1]
                  if (base64) frames.push(base64)
                } catch {
                  // Abaikan
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
    } catch {
      clearTimeout(timer)
      finish([])
    }
  })
}

// 2. Ekstrak jalur suara (Audio Track) dari video besar menjadi WAV Mono 8kHz ringan (< 1.2 MB)
// Solusi agar video 30MB+ tetap bisa didengar suaranya oleh AI tanpa terkena limit 4.5MB Vercel!
async function ekstrakAudioRinganDariVideo(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null

    const audioCtx = new AudioCtx()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    audioCtx.close()

    // Batasi maksimal 45 detik pertama dengan sample rate 8000Hz Mono (sangat jernih untuk suara manusia & ukuran < 750KB)
    const targetSampleRate = 8000
    const maxSeconds = Math.min(audioBuffer.duration, 45)
    const numSamples = Math.floor(maxSeconds * targetSampleRate)

    const offlineCtx = new OfflineAudioContext(1, numSamples, targetSampleRate)
    const source = offlineCtx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(offlineCtx.destination)
    source.start(0)

    const renderedBuffer = await offlineCtx.startRendering()
    const channelData = renderedBuffer.getChannelData(0)

    // Konversi PCM Float32 ke format file WAV 16-bit
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
    return {
      base64: btoa(binary),
      mimeType: "audio/wav",
    }
  } catch {
    return null
  }
}

export default function VideoExtractorView({
  userId,
  namaUser,
  coins,
  updateKoinDatabase,
  personaProfile,
  bentukKontenFinal,
  simpanAtauUpdateSkripDatabase,
  setKoleksiSkripTersimpan,
  setActiveMenu,
  showToast,
}) {
  const [sumberVideo, setSumberVideo] = useState({
    instruksiTambahan: "",
    framesBase64: [],
    fileBase64: "",
    fileMimeType: "",
    namaFileUpload: "",
    sedangEkstrakFile: false,
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [regeneratingIndex, setRegeneratingIndex] = useState(null)
  const [errorRewriteAI, setErrorRewriteAI] = useState("")
  const [hasilRewriteVideo, setHasilRewriteVideo] = useState(null)
  const [modeTampilanRewrite, setModeTampilanRewrite] = useState("voiceover")

  const handleFileVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErrorRewriteAI("")
    setHasilRewriteVideo(null)
    setSumberVideo((prev) => ({
      ...prev,
      namaFileUpload: file.name,
      sedangEkstrakFile: true,
      framesBase64: [],
      fileBase64: "",
    }))

    try {
      // Jika file kecil (<= 2.8 MB), kirim langsung utuh
      if (file.size <= 2.8 * 1024 * 1024) {
        const reader = new FileReader()
        reader.onload = () => {
          const base64Clean =
            (reader.result || "").toString().split(",")[1] || ""
          setSumberVideo((prev) => ({
            ...prev,
            fileBase64: base64Clean,
            fileMimeType: file.type || "video/mp4",
          }))
        }
        reader.readAsDataURL(file)
      } else {
        // Jika file video besar (> 2.8 MB), ekstrak jalur suara WAV ringan agar lolos batas 4.5MB Vercel
        const audioRingan = await ekstrakAudioRinganDariVideo(file)
        if (audioRingan) {
          setSumberVideo((prev) => ({
            ...prev,
            fileBase64: audioRingan.base64,
            fileMimeType: audioRingan.mimeType,
          }))
        }
      }

      if (file.type.startsWith("video/")) {
        const frames = await ekstrakFrameVideoTajam(file, 6)
        setSumberVideo((prev) => ({
          ...prev,
          framesBase64: frames,
          sedangEkstrakFile: false,
        }))
      } else {
        setSumberVideo((prev) => ({ ...prev, sedangEkstrakFile: false }))
      }
      showToast(`Suara & visual "${file.name}" siap diekstrak.`)
    } catch {
      setSumberVideo((prev) => ({ ...prev, sedangEkstrakFile: false }))
    }
  }

  const handleEkstrakVideoSekarang = async () => {
    if (coins < 2) {
      alert(
        "Saldo koin belum mencukupi. Silakan isi ulang koin terlebih dahulu.",
      )
      setActiveMenu("topup")
      return
    }
    if (!sumberVideo.namaFileUpload) {
      setErrorRewriteAI(
        "ERROR: Silakan pilih dan unggah file video/audio dari perangkatmu terlebih dahulu.",
      )
      return
    }

    setErrorRewriteAI("")
    setHasilRewriteVideo(null)
    setIsGenerating(true)

    await updateKoinDatabase(coins - 2)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rewrite_video",
          userId,
          namaUser,
          personaProfile,
          namaFileVideo: sumberVideo.namaFileUpload,
          detailInput: sumberVideo.instruksiTambahan.trim(),
          framesBase64: sumberVideo.framesBase64,
          mediaBase64: sumberVideo.fileBase64,
          mediaMimeType: sumberVideo.fileMimeType,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.silentCoinUpdated != null) {
          updateKoinDatabase(data.silentCoinUpdated)
        }
        throw new Error(
          data.error ||
            "ERROR: Sistem AI tidak dapat membaca teks/suara dari video ini.",
        )
      }

      setHasilRewriteVideo({
        transkripAsliVideo: data.transkripAsliVideo,
        intiPesanVideo: data.intiPesanVideo || sumberVideo.namaFileUpload,
        segmen: Array.isArray(data.segmen) ? data.segmen : [],
      })
      showToast("Teks asli video berhasil diekstrak dan dipecah per kerangka!")
    } catch (err) {
      setErrorRewriteAI(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateSatuKerangkaVideo = async (indexBaris, fokusTarget) => {
    if (!hasilRewriteVideo || regeneratingIndex !== null) return
    const segmenLama = hasilRewriteVideo.segmen[indexBaris]
    setRegeneratingIndex(indexBaris)
    showToast(`Memperbarui khusus ${segmenLama.labelMini}...`)

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate_satu_kerangka",
          userId,
          namaUser,
          personaProfile,
          subyek: hasilRewriteVideo.intiPesanVideo,
          segmenTarget: segmenLama,
        }),
      })

      const data = await res.json()
      if (data.silentCoinUpdated != null) {
        updateKoinDatabase(data.silentCoinUpdated)
      }
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui kerangka")

      const segmenUpdate = { ...segmenLama }
      if (fokusTarget === "visual") {
        segmenUpdate.visual = data.visual || segmenLama.visual
      } else {
        segmenUpdate.voiceover = data.voiceover || segmenLama.voiceover
        segmenUpdate.teksLayar = data.teksLayar || segmenLama.teksLayar
        segmenUpdate.visual = data.visual || segmenLama.visual
      }

      const listBaru = hasilRewriteVideo.segmen.map((s, idx) =>
        idx === indexBaris ? segmenUpdate : s,
      )

      setHasilRewriteVideo({
        ...hasilRewriteVideo,
        segmen: listBaru,
      })
      showToast(`${segmenLama.labelMini} berhasil diperbarui!`)
    } catch (err) {
      showToast(err.message)
    } finally {
      setRegeneratingIndex(null)
    }
  }

  return (
    <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
          Ekstrak Teks Asli Video & Buat Rekomendasi Copywriting Per Kerangka
        </h2>
        <p className="text-xs font-normal text-slate-600 mt-1">
          Unggah file video dari perangkatmu. Sistem otomatis mengekstrak suara
          asli dan teks layar video, lalu menyusun rekomendasi copywriting baru
          yang dipecah per kerangka.
        </p>
      </div>

      <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-[#14141f] bg-[#f4f5f7] rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-2 transition">
        <div className="w-11 h-11 rounded-2xl bg-[#14141f] text-[#d4f34a] flex items-center justify-center">
          <FlatIcon name="upload" className="w-5 h-5" />
        </div>
        <div className="text-xs sm:text-sm font-bold text-[#14141f] break-all px-2">
          {sumberVideo.sedangEkstrakFile
            ? "Sedang mengekstrak jalur suara & visual video..."
            : sumberVideo.namaFileUpload
              ? `Video Siap Dianalisis: ${sumberVideo.namaFileUpload}`
              : "Klik di Sini untuk Upload File Video / Audio (.mp4, .mov, .mp3)"}
        </div>
        <span className="text-xs font-normal text-slate-500">
          Mendukung video ukuran besar dari HP • Jika video tidak memiliki
          suara/teks yang terbaca, sistem akan melaporkan Error secara jujur
        </span>
        <input
          type="file"
          accept="video/*,audio/*"
          onChange={handleFileVideoUpload}
          className="hidden"
        />
      </label>

      <div>
        <label className="block text-xs font-bold text-[#14141f] mb-1.5">
          Arah Penulisan Ulang yang Kamu Inginkan (Opsional):
        </label>
        <StoryVoiceInput
          rows={2}
          value={sumberVideo.instruksiTambahan}
          onChange={(val) =>
            setSumberVideo({ ...sumberVideo, instruksiTambahan: val })
          }
          placeholder="Contoh: Ubah menjadi cerita santai sesuai pengalamanku..."
          onNotify={showToast}
        />
      </div>

      <button
        type="button"
        disabled={isGenerating || sumberVideo.sedangEkstrakFile}
        onClick={handleEkstrakVideoSekarang}
        className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs sm:text-sm py-4 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isGenerating && (
          <FlatIcon name="refresh" className="w-4 h-4 animate-spin" />
        )}
        <span>
          {isGenerating
            ? "Sedang Membaca Suara/Teks Asli Video & Menyusun Kerangka..."
            : "Ekstrak Teks Asli Video & Buat Copywriting"}
        </span>
      </button>

      {errorRewriteAI && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 leading-relaxed">
          ⚠️ {errorRewriteAI}
        </div>
      )}

      {!isGenerating && hasilRewriteVideo && (
        <div className="space-y-6 pt-4 border-t border-slate-100">
          {/* 1. TEKS ASLI YANG ADA DI VIDEO */}
          <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#14141f]">
                1. Teks Asli yang Ada di Dalam Video:
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    hasilRewriteVideo.transkripAsliVideo,
                  )
                  showToast("Teks asli video berhasil disalin!")
                }}
                className="cursor-pointer bg-white border border-slate-300 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1"
              >
                <FlatIcon name="copy" className="w-3.5 h-3.5" />
                <span>Salin Teks Asli</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm font-normal text-[#14141f] leading-relaxed whitespace-pre-line bg-white p-4 rounded-2xl border border-slate-200">
              {hasilRewriteVideo.transkripAsliVideo}
            </p>
          </div>

          {/* 2. REKOMENDASI COPYWRITING BARU PER KERANGKA */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#14141f]">
                  2. Rekomendasi Copywriting Baru (Dipecah Per Kerangka)
                </h3>
                <p className="text-xs font-normal text-slate-600">
                  Klik ikon putar pada salah satu kerangka di bawah untuk
                  men-generate ulang khusus bagian kerangka tersebut saja.
                </p>
              </div>

              <div className="inline-flex bg-[#f4f5f7] p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setModeTampilanRewrite("voiceover")}
                  className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold ${
                    modeTampilanRewrite === "voiceover"
                      ? "bg-[#14141f] text-[#d4f34a]"
                      : "text-slate-600"
                  }`}
                >
                  Skrip Ngomong
                </button>
                <button
                  type="button"
                  onClick={() => setModeTampilanRewrite("teks")}
                  className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold ${
                    modeTampilanRewrite === "teks"
                      ? "bg-[#14141f] text-[#d4f34a]"
                      : "text-slate-600"
                  }`}
                >
                  Teks di Layar
                </button>
              </div>
            </div>

            <div className="space-y-3.5">
              {(hasilRewriteVideo.segmen || []).map((seg, idx) => {
                const teksAktif =
                  modeTampilanRewrite === "teks" ? seg.teksLayar : seg.voiceover
                const sedangRegenIni = regeneratingIndex === idx

                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#14141f] bg-[#f4f5f7] px-2.5 py-1 rounded-md">
                        {seg.labelMini}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {sedangRegenIni
                          ? "Sedang memperbarui kerangka ini..."
                          : "Bisa diubah atau di-generate ulang per kerangka"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                      <div className="lg:col-span-7 bg-[#d4f34a]/30 border border-[#14141f]/15 rounded-2xl p-4 flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1.5">
                          <textarea
                            rows={3}
                            value={teksAktif}
                            onChange={(e) => {
                              const valBaru = e.target.value
                              const listUpdate = hasilRewriteVideo.segmen.map(
                                (s, i) =>
                                  i === idx
                                    ? modeTampilanRewrite === "teks"
                                      ? { ...s, teksLayar: valBaru }
                                      : { ...s, voiceover: valBaru }
                                    : s,
                              )
                              setHasilRewriteVideo({
                                ...hasilRewriteVideo,
                                segmen: listUpdate,
                              })
                            }}
                            className="w-full bg-white/90 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-normal text-[#14141f] leading-relaxed outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={regeneratingIndex !== null}
                          onClick={() =>
                            handleRegenerateSatuKerangkaVideo(idx, "skrip")
                          }
                          title="Generate ulang khusus kerangka ini saja"
                          className="cursor-pointer w-9 h-9 rounded-xl bg-white hover:bg-[#14141f] text-[#14141f] hover:text-[#d4f34a] border border-slate-200 flex items-center justify-center shrink-0 transition"
                        >
                          <FlatIcon
                            name="refresh"
                            className={`w-4 h-4 ${
                              sedangRegenIni ? "animate-spin" : ""
                            }`}
                          />
                        </button>
                      </div>

                      <div className="lg:col-span-5 bg-[#f4f5f7] rounded-2xl p-4 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-[#14141f] block">
                            Arahan Adegan Visual
                          </span>
                          <p className="text-xs font-normal text-slate-700 leading-relaxed">
                            {seg.visual}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={regeneratingIndex !== null}
                          onClick={() =>
                            handleRegenerateSatuKerangkaVideo(idx, "visual")
                          }
                          title="Generate ulang visual khusus kerangka ini"
                          className="cursor-pointer w-9 h-9 rounded-xl bg-white hover:bg-[#14141f] text-slate-700 hover:text-[#d4f34a] border border-slate-200 flex items-center justify-center shrink-0 transition"
                        >
                          <FlatIcon
                            name="refresh"
                            className={`w-4 h-4 ${
                              sedangRegenIni ? "animate-spin" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={async () => {
                const waktuSekarang = new Date().toLocaleString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                const skripSimpan = {
                  id: Date.now(),
                  dbId: null,
                  judul:
                    hasilRewriteVideo.intiPesanVideo ||
                    sumberVideo.namaFileUpload,
                  kategori: "Hasil Ekstrak Video",
                  bentuk: bentukKontenFinal,
                  waktuDibuat: waktuSekarang,
                  sudahUpload: false,
                  tanggalUpload: "",
                  segmen: hasilRewriteVideo.segmen,
                }
                const tersimpan =
                  await simpanAtauUpdateSkripDatabase(skripSimpan)
                setKoleksiSkripTersimpan((prev) => [tersimpan, ...prev])
                showToast("Skrip berhasil disimpan ke daftar skripmu!")
              }}
              className="cursor-pointer w-full bg-[#d4f34a] text-[#14141f] font-bold text-xs sm:text-sm py-4 rounded-2xl"
            >
              Simpan ke Daftar Skrip Saya
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
