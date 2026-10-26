"use client"
import { useState } from "react"
import { FlatIcon, StoryVoiceInput, AILoadingBox } from "./SharedUI"

function ekstrakFrameVideoStabil(file, jumlahFrame = 6) {
  return new Promise((resolve) => {
    let selesai = false
    const finish = (res) => {
      if (!selesai) {
        selesai = true
        resolve(res)
      }
    }
    const timer = setTimeout(() => finish([]), 7000)

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
              const tSeek = setTimeout(r, 700)
              video.onseeked = () => {
                clearTimeout(tSeek)
                try {
                  ctx.drawImage(video, 0, 0, lebar, tinggi)
                  const base64 = canvas
                    .toDataURL("image/jpeg", 0.65)
                    .split(",")[1]
                  if (base64) frames.push(base64)
                } catch {
                  // Abaikan gagal frame tunggal
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

      const targetSampleRate = 8000
      const maxSeconds = Math.min(audioBuffer.duration, 40)
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
  isPremiumUser = true,
  onTriggerUpgradeVIP,
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
  const [regenCount, setRegenCount] = useState(0)
  const [errorRewriteAI, setErrorRewriteAI] = useState("")
  const [hasilRewriteVideo, setHasilRewriteVideo] = useState(null)

  const simpanHasilVideoKeArsip = async (pesan) => {
    if (!hasilRewriteVideo) return
    const waktuSekarang = new Date().toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    const skripSimpan = {
      id: hasilRewriteVideo.savedId || Date.now(),
      dbId: hasilRewriteVideo.dbId || null,
      judul:
        hasilRewriteVideo.intiPesanVideo ||
        sumberVideo.namaFileUpload ||
        "Hasil Ekstrak Video",
      kategori: "Hasil Ekstrak Video",
      bentuk: bentukKontenFinal,
      waktuDibuat: waktuSekarang,
      sudahUpload: false,
      tanggalUpload: "",
      segmen: hasilRewriteVideo.segmen,
    }
    const tersimpan = await simpanAtauUpdateSkripDatabase(skripSimpan)
    setHasilRewriteVideo((prev) => ({
      ...prev,
      savedId: tersimpan.id,
      dbId: tersimpan.dbId,
    }))
    setKoleksiSkripTersimpan((prev) => {
      const ada = prev.some((x) => x.id === tersimpan.id)
      return ada
        ? prev.map((x) => (x.id === tersimpan.id ? tersimpan : x))
        : [tersimpan, ...prev]
    })
    if (pesan) showToast(pesan)
  }

  const handleFileVideoUpload = async (e) => {
    if (!isPremiumUser) {
      onTriggerUpgradeVIP()
      return
    }
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

      if (
        file.type.startsWith("video/") ||
        file.name.match(/\.(mp4|mov|webm|mkv)$/i)
      ) {
        framesData = await ekstrakFrameVideoStabil(file, 6)
      }

      audioData = await ekstrakAudioRinganAman(file)

      if (
        !audioData &&
        framesData.length === 0 &&
        file.size <= 4 * 1024 * 1024
      ) {
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
            mimeType: file.type || "audio/wav",
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

      showToast(`Video "${file.name}" siap diekstrak.`)
    } catch {
      setSumberVideo((prev) => ({ ...prev, sedangEkstrakFile: false }))
    }
  }

  const handleEkstrakVideoSekarang = async () => {
    if (!isPremiumUser) {
      onTriggerUpgradeVIP()
      return
    }
    if (coins < 2) {
      alert(
        "Saldo koin belum mencukupi. Silakan isi ulang koin terlebih dahulu.",
      )
      setActiveMenu("topup")
      return
    }
    if (!sumberVideo.namaFileUpload) {
      setErrorRewriteAI(
        "Silakan pilih dan unggah file video atau audio dari perangkatmu terlebih dahulu.",
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
          data.error || "Error sistem, silakan refresh atau hubungi admin.",
        )
      }

      setHasilRewriteVideo({
        transkripAsliVideo: data.transkripAsliVideo,
        intiPesanVideo: data.intiPesanVideo || sumberVideo.namaFileUpload,
        bedahKompetitor: data.bedahKompetitor || null,
        segmen: Array.isArray(data.segmen) ? data.segmen : [],
      })
      showToast("Teks video selesai disalin dan disusun ulang.")
    } catch {
      setErrorRewriteAI("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateSatuKerangkaVideo = async (indexBaris, fokusTarget) => {
    if (!hasilRewriteVideo) return
    const hitunganBaru = regenCount + 1

    if (hitunganBaru % 3 === 0) {
      if (coins < 1) {
        alert("Saldo koin tidak mencukupi untuk generate ulang ke-3.")
        setActiveMenu("topup")
        return
      }
      await updateKoinDatabase(coins - 1)
    }
    setRegenCount(hitunganBaru)

    const segmenLama = hasilRewriteVideo.segmen[indexBaris]
    setRegeneratingIndex(indexBaris)
    showToast(`Menulis ulang bagian ${segmenLama.labelMini}...`)

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
      if (!res.ok)
        throw new Error("Error sistem, silakan refresh atau hubungi admin.")

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
      showToast(`${segmenLama.labelMini} selesai diperbarui.`)
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setRegeneratingIndex(null)
    }
  }

  return (
    <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 space-y-6 w-full max-w-full overflow-hidden">
      <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
            Salin Teks Asli Video, Bedah Struktur & Susun Skrip Baru
          </h2>
          <p className="text-xs font-normal text-slate-600 mt-0.5">
            Unggah file video dari perangkatmu untuk menyalin teks aslinya,
            membaca pola kalimat pembukanya, dan menulis naskah baru sesuai gaya
            bicaramu.
          </p>
        </div>

        {!isPremiumUser && (
          <button
            type="button"
            onClick={onTriggerUpgradeVIP}
            className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2.5 rounded-lg"
          >
            Upgrade Paket VIP (Rp20.000+)
          </button>
        )}
      </div>

      <label
        onClick={(e) => {
          if (!isPremiumUser) {
            e.preventDefault()
            onTriggerUpgradeVIP()
          }
        }}
        className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-[#14141f] bg-[#f4f5f7] rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2 transition"
      >
        <div className="w-10 h-10 rounded-lg bg-[#14141f] text-[#d4f34a] flex items-center justify-center text-xs font-bold">
          {isPremiumUser ? (
            <FlatIcon name="upload" className="w-5 h-5" />
          ) : (
            "VIP"
          )}
        </div>
        <div className="text-xs sm:text-sm font-bold text-[#14141f] break-all px-2">
          {sumberVideo.sedangEkstrakFile
            ? "Membaca jalur suara dan potongan gambar video..."
            : sumberVideo.namaFileUpload
              ? `Video Siap Dianalisis: ${sumberVideo.namaFileUpload}`
              : "Klik di Sini untuk Upload File Video / Audio (.mp4, .mov, .mp3)"}
        </div>
        <span className="text-xs font-normal text-slate-500">
          {isPremiumUser
            ? "Membaca ucapan suara dan teks di dalam layar video"
            : "Fitur Ekstrak Video khusus pengguna Paket VIP (Rp20.000 ke atas)"}
        </span>
        {isPremiumUser && (
          <input
            type="file"
            accept="video/*,audio/*"
            onChange={handleFileVideoUpload}
            className="hidden"
          />
        )}
      </label>

      <div>
        <label className="block text-xs font-bold text-[#14141f] mb-1.5">
          Topikmu Sendiri / Arah Penulisan Ulang (Opsional)
        </label>
        {isPremiumUser ? (
          <StoryVoiceInput
            rows={2}
            value={sumberVideo.instruksiTambahan}
            onChange={(val) =>
              setSumberVideo({ ...sumberVideo, instruksiTambahan: val })
            }
            placeholder="Contoh: Gunakan struktur video ini untuk membahas produk atau topik saya..."
            onNotify={showToast}
          />
        ) : (
          <textarea
            rows={2}
            value={sumberVideo.instruksiTambahan}
            onChange={(e) =>
              setSumberVideo({
                ...sumberVideo,
                instruksiTambahan: e.target.value,
              })
            }
            placeholder="Contoh: Gunakan struktur video ini untuk membahas produk atau topik saya..."
            className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg p-3.5 text-base sm:text-xs outline-none"
          />
        )}
      </div>

      {isGenerating ? (
        <AILoadingBox
          label="Menyalin teks asli video dan menyusun naskah baru..."
          onRefresh={handleEkstrakVideoSekarang}
        />
      ) : (
        <button
          type="button"
          disabled={sumberVideo.sedangEkstrakFile}
          onClick={handleEkstrakVideoSekarang}
          className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs sm:text-sm py-3.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>
            {isPremiumUser
              ? "Ekstrak Teks Video & Buat Naskah Baru"
              : "Buka Fitur Ekstrak Video (Khusus Paket VIP Rp20.000+)"}
          </span>
        </button>
      )}

      {errorRewriteAI && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 leading-relaxed">
          {errorRewriteAI}
        </div>
      )}

      {!isGenerating && hasilRewriteVideo && (
        <div className="space-y-6 pt-4 border-t border-slate-200">
          {hasilRewriteVideo.bedahKompetitor && (
            <div className="bg-[#f0eeff] border border-[#5b4bc4]/20 p-5 rounded-xl space-y-2.5">
              <div className="text-xs font-bold text-[#14141f]">
                Analisis Struktur Video Sumber
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                  <strong className="block text-[#5b4bc4]">
                    Jenis Kalimat Pembuka:
                  </strong>
                  <span className="text-[#14141f] font-bold">
                    {hasilRewriteVideo.bedahKompetitor.jenisHookAsli}
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                  <strong className="block text-[#5b4bc4]">
                    Fokus Masalah Penonton:
                  </strong>
                  <span className="text-slate-700">
                    {hasilRewriteVideo.bedahKompetitor.pemicuEmosi}
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                  <strong className="block text-[#5b4bc4]">
                    Alur Penjelasan:
                  </strong>
                  <span className="text-slate-700">
                    {hasilRewriteVideo.bedahKompetitor.rahasiaRetensi}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#f4f5f7] p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#14141f]">
                1. Teks Asli di Dalam Video
              </span>
              <button
                type="button"
                onClick={async () => {
                  navigator.clipboard.writeText(
                    hasilRewriteVideo.transkripAsliVideo,
                  )
                  await simpanHasilVideoKeArsip(
                    "Teks asli disalin dan disimpan ke arsip.",
                  )
                }}
                title="Salin Teks Asli & Simpan ke Arsip"
                className="cursor-pointer bg-white border border-slate-300 w-8 h-8 rounded-lg flex items-center justify-center"
              >
                <FlatIcon name="copy" className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs sm:text-sm font-normal text-[#14141f] leading-relaxed whitespace-pre-line bg-white p-4 rounded-lg border border-slate-200">
              {hasilRewriteVideo.transkripAsliVideo}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#14141f]">
                2. Naskah Baru Sesuai Gaya Bicaramu
              </h3>
              <p className="text-xs font-normal text-slate-600">
                Klik ikon putar pada salah satu bagian di bawah untuk menulis
                ulang bagian tersebut.
              </p>
            </div>

            <div className="space-y-3.5">
              {(hasilRewriteVideo.segmen || []).map((seg, idx) => {
                const sedangRegenIni = regeneratingIndex === idx

                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#14141f] bg-[#f4f5f7] px-2.5 py-1 rounded-md border border-slate-200">
                        {seg.labelMini}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {sedangRegenIni
                          ? "Menulis ulang bagian ini..."
                          : "Bisa diedit atau ditulis ulang per bagian"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                      <div className="lg:col-span-7 bg-[#f4f5f7] border border-slate-200 rounded-lg p-3.5 flex items-start justify-between gap-2.5">
                        <div className="flex-1">
                          <textarea
                            rows={3}
                            value={seg.voiceover}
                            onChange={(e) => {
                              const valBaru = e.target.value
                              const listUpdate = hasilRewriteVideo.segmen.map(
                                (s, i) =>
                                  i === idx ? { ...s, voiceover: valBaru } : s,
                              )
                              setHasilRewriteVideo({
                                ...hasilRewriteVideo,
                                segmen: listUpdate,
                              })
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-base sm:text-sm font-normal text-[#14141f] leading-relaxed outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleRegenerateSatuKerangkaVideo(idx, "skrip")
                          }
                          title="Tulis ulang bagian ini"
                          className="cursor-pointer w-8 h-8 rounded-lg bg-white hover:bg-[#14141f] text-[#14141f] hover:text-[#d4f34a] border border-slate-200 flex items-center justify-center shrink-0 transition"
                        >
                          <FlatIcon
                            name="refresh"
                            className={`w-4 h-4 ${
                              sedangRegenIni ? "animate-spin" : ""
                            }`}
                          />
                        </button>
                      </div>

                      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-3.5 flex items-start justify-between gap-2.5">
                        <div className="space-y-1 flex-1">
                          <span className="text-xs font-bold text-[#14141f] block">
                            Arahan Adegan Visual
                          </span>
                          <p className="text-xs font-normal text-slate-600 leading-relaxed">
                            {seg.visual}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleRegenerateSatuKerangkaVideo(idx, "visual")
                          }
                          title="Tulis ulang visual bagian ini"
                          className="cursor-pointer w-8 h-8 rounded-lg bg-[#f4f5f7] hover:bg-[#14141f] text-slate-700 hover:text-[#d4f34a] border border-slate-200 flex items-center justify-center shrink-0 transition"
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
              onClick={() =>
                simpanHasilVideoKeArsip("Skrip disimpan ke menu Arsip.")
              }
              className="cursor-pointer w-full bg-[#d4f34a] text-[#14141f] font-bold text-xs sm:text-sm py-3.5 rounded-lg"
            >
              Simpan ke Arsip Skrip Saya
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
