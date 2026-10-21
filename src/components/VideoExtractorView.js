"use client"
import { useState } from "react"
import { FlatIcon, StoryVoiceInput } from "./SharedUI"

function ekstrakFrameVideoStabil(file, jumlahFrame = 5) {
  return new Promise((resolve) => {
    let selesai = false
    const finish = (res) => {
      if (!selesai) {
        selesai = true
        resolve(res)
      }
    }
    const timer = setTimeout(() => finish([]), 4000)

    try {
      const video = document.createElement("video")
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const url = URL.createObjectURL(file)

      video.preload = "auto"
      video.src = url
      video.muted = true
      video.playsInline = true

      const frames = []
      video.onloadeddata = async () => {
        try {
          const durasi = Math.min(video.duration || 5, 45)
          const lebar = 420
          const tinggi =
            Math.round((video.videoHeight / (video.videoWidth || 1)) * lebar) ||
            260
          canvas.width = lebar
          canvas.height = tinggi

          for (let i = 1; i <= jumlahFrame; i++) {
            const t = (durasi / (jumlahFrame + 1)) * i
            await new Promise((r) => {
              const tSeek = setTimeout(r, 450)
              video.onseeked = () => {
                clearTimeout(tSeek)
                try {
                  ctx.drawImage(video, 0, 0, lebar, tinggi)
                  const base64 = canvas
                    .toDataURL("image/jpeg", 0.55)
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

async function ekstrakAudioRinganAman(file) {
  return new Promise(async (resolve) => {
    const timer = setTimeout(() => resolve(null), 4000)
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

      // Gunakan 6000Hz Mono maksimal 35 detik agar ukuran audio hanya ~400KB (bebas error 413 Vercel)
      const targetSampleRate = 6000
      const maxSeconds = Math.min(audioBuffer.duration, 35)
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
      })
    } catch {
      clearTimeout(timer)
      resolve(null)
    }
  })
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
      let audioData = null
      let framesData = []

      if (file.type.startsWith("video/")) {
        framesData = await ekstrakFrameVideoStabil(file, 5)
      }

      // Ekstrak jalur audio ringan terlebih dahulu agar pasti lolos batas payload server
      audioData = await ekstrakAudioRinganAman(file)

      // Jika browser HP tidak mendukung WebAudio API tetapi ukuran file <= 2.4 MB, kirim file langsung
      if (!audioData && file.size <= 2.4 * 1024 * 1024) {
        const base64Raw = await new Promise((res) => {
          const reader = new FileReader()
          reader.onload = () =>
            res((reader.result || "").toString().split(",")[1] || "")
          reader.onerror = () => res("")
          reader.readAsDataURL(file)
        })
        if (base64Raw) {
          audioData = {
            base64: base64Raw,
            mimeType: file.type || "video/mp4",
          }
        }
      }

      setSumberVideo((prev) => ({
        ...prev,
        framesBase64: framesData,
        fileBase64: audioData?.base64 || "",
        fileMimeType: audioData?.mimeType || "",
        sedangEkstrakFile: false,
      }))

      showToast(`Video "${file.name}" siap diekstrak ke teks!`)
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
      showToast(
        "Teks asli video berhasil diekstrak (-2 Koin) dan dipecah per kerangka!",
      )
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
    <div className="bg-white p-5 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6 w-full max-w-full overflow-hidden">
      <div className="bg-[#f4f5f7] px-4 py-2.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className="font-bold text-[#14141f]">
          ✂️ Ekstrak Video ke Teks & Skrip Baru: 2 Koin
        </span>
        <span className="text-slate-600">
          Generate ulang per kerangka: <strong>Gratis</strong>
        </span>
      </div>

      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
          Ekstrak Teks Asli Video & Buat Rekomendasi Copywriting Per Kerangka
        </h2>
        <p className="text-xs font-normal text-slate-600 mt-1">
          Unggah file video dari perangkatmu. Sistem akan menampilkan teks asli
          yang ada di dalam video tersebut, lalu menyusun rekomendasi
          copywriting baru per kerangka.
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
          Otomatis membaca ucapan suara & teks di dalam layar video
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
            : "Ekstrak Teks Asli Video & Buat Copywriting (Pakai 2 Koin)"}
        </span>
      </button>

      {errorRewriteAI && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 leading-relaxed">
          ⚠️ {errorRewriteAI}
        </div>
      )}

      {!isGenerating && hasilRewriteVideo && (
        <div className="space-y-6 pt-4 border-t border-slate-100">
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
