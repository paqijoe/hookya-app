"use client"
import { useState, useEffect, useRef } from "react"

export function formatKoinSingkat(jumlah) {
  const n = Number(jumlah) || 0
  if (n < 1000) return String(n)
  if (n < 10000) {
    const desimal = (n / 1000).toFixed(1).replace(/\.0$/, "")
    return `${desimal}k`
  }
  return `${Math.floor(n / 1000)}k`
}

async function ubahBlobSuaraKeWavBase64(audioBlob) {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer()
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null

    const audioCtx = new AudioCtx()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    audioCtx.close()

    const targetRate = 8000
    const durasiMaks = Math.min(audioBuffer.duration, 45)
    const numSamples = Math.floor(durasiMaks * targetRate)

    const offlineCtx = new OfflineAudioContext(1, numSamples, targetRate)
    const source = offlineCtx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(offlineCtx.destination)
    source.start(0)

    const rendered = await offlineCtx.startRendering()
    const channelData = rendered.getChannelData(0)

    const wavBuffer = new ArrayBuffer(44 + channelData.length * 2)
    const view = new DataView(wavBuffer)
    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i))
      }
    }

    writeStr(0, "RIFF")
    view.setUint32(4, 36 + channelData.length * 2, true)
    writeStr(8, "WAVE")
    writeStr(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, targetRate, true)
    view.setUint32(28, targetRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeStr(36, "data")
    view.setUint32(40, channelData.length * 2, true)

    let offset = 44
    for (let i = 0; i < channelData.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, channelData[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }

    const bytes = new Uint8Array(wavBuffer)
    let binary = ""
    const chunk = 8192
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
    }
    return { base64: btoa(binary), mimeType: "audio/wav" }
  } catch {
    return null
  }
}

export function FlatIcon({ name, className = "w-5 h-5" }) {
  const icons = {
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    bolt: <path d="M13 2L3 14h7v8l10-12h-7V2z" />,
    dna: (
      <path d="M7 2v2c0 4 10 4 10 8s-10 4-10 8v2M17 2v2c0 4-10 4-10 8s10 4 10 8v2M6 6h12M6 18h12M8 12h8" />
    ),
    chart: <path d="M4 20h16M6 16v-5m4 5V8m4 8v-3m4 3V5" />,
    coin: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10m-2.5-7.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="2" width="6" height="11" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0M12 17v4m-3 0h6" />
      </>
    ),
    bag: (
      <>
        <path d="M6 7h12l1 13H5L6 7z" />
        <path d="M9 7V5a3 3 0 0 1 6 0v2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.5-4 14.5-4 16 0" />
      </>
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    scissors: (
      <>
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
      </>
    ),
    bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
    code: <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />,
    upload: (
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    ),
    check: <path d="M5 13l4 4L19 7" />,
    refresh: (
      <path d="M4 12a8 8 0 0 1 13.66-5.66L20 8.68M20 4v4.68h-4.68M20 12a8 8 0 0 1-13.66 5.66L4 15.32M4 20v-4.68h4.68" />
    ),
    tv: (
      <>
        <rect x="3" y="5" width="18" height="12" rx="2" />
        <path d="M8 21h8m-4-4v4" />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
    printer: (
      <>
        <path d="M6 9V2h12v7" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </>
    ),
    edit: (
      <>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </>
    ),
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6L6 18" />,
    chevronDown: <path d="M6 9l6 6 6-6" />,
    chevronLeft: <path d="M15 18l-6-6 6-6" />,
    chevronRight: <path d="M9 18l6-6-6-6" />,
    eye: (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ),
    qr: (
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 19h3M19 14v3" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {icons[name] || icons.bolt}
    </svg>
  )
}

export function AILoadingBox({
  label = "Menyusun data dan naskah skrip...",
  onRefresh,
}) {
  const [detik, setDetik] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setDetik((d) => d + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="py-8 px-5 rounded-xl bg-[#f4f5f7] border border-slate-200 flex flex-col items-center justify-center text-center space-y-2.5">
      <button
        type="button"
        onClick={() => {
          setDetik(0)
          if (onRefresh) onRefresh()
        }}
        title="Klik untuk memuat ulang proses"
        className="cursor-pointer w-10 h-10 rounded-lg bg-[#14141f] text-[#d4f34a] flex items-center justify-center transition hover:opacity-90"
      >
        <FlatIcon name="refresh" className="w-4 h-4 animate-spin" />
      </button>

      <div className="text-xs sm:text-sm font-bold text-[#14141f]">{label}</div>

      <div className="text-xs text-slate-500">
        Waktu proses:{" "}
        <span className="font-bold text-[#14141f]">{detik} detik</span>
      </div>

      {detik >= 30 && (
        <div className="bg-amber-50 border border-amber-300 text-[#14141f] px-4 py-2.5 rounded-lg text-xs space-y-1 max-w-md">
          <div className="font-bold">
            Proses berjalan {detik} detik karena antrean jaringan padat.
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={() => {
                setDetik(0)
                onRefresh()
              }}
              className="cursor-pointer underline text-[#5b4bc4] font-bold block mx-auto"
            >
              Muat Ulang Proses Sekarang
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function StoryVoiceInput({
  value,
  onChange,
  placeholder,
  rows = 2,
  onNotify,
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [detikLoading, setDetikLoading] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const lastBlobRef = useRef(null)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    if (!isTranscribing) {
      setDetikLoading(0)
      return
    }
    const timer = setInterval(() => {
      setDetikLoading((d) => d + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isTranscribing])

  const kirimBlobKeAI = async (audioBlob, mimeAsli) => {
    if (!audioBlob) return
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsTranscribing(true)
    setDetikLoading(0)
    if (onNotify) onNotify("Mengubah rekaman suara menjadi teks...")

    try {
      const hasilWav = await ubahBlobSuaraKeWavBase64(audioBlob)
      let base64Final = hasilWav?.base64 || ""
      let mimeFinal = hasilWav?.mimeType || mimeAsli || "audio/wav"

      if (!base64Final) {
        base64Final = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () =>
            resolve((reader.result || "").toString().split(",")[1] || "")
          reader.onerror = () => resolve("")
          reader.readAsDataURL(audioBlob)
        })
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          action: "transkrip_suara_mic",
          audioBase64: base64Final,
          audioMimeType: mimeFinal,
        }),
      })
      const data = await res.json()
      if (res.ok && data.teks) {
        const gabungan = value ? `${value} ${data.teks}` : data.teks
        onChange(gabungan)
        if (onNotify) onNotify("Rekaman suara berhasil ditulis.")
      } else {
        if (onNotify)
          onNotify("Error sistem, silakan refresh atau hubungi admin.")
      }
    } catch (err) {
      if (err.name !== "AbortError" && onNotify) {
        onNotify("Error sistem, silakan refresh atau hubungi admin.")
      }
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleMicOrRefreshClick = async () => {
    if (isTranscribing) {
      if (lastBlobRef.current) {
        if (onNotify) onNotify("Mengulang proses transkrip suara...")
        kirimBlobKeAI(lastBlobRef.current.blob, lastBlobRef.current.mime)
      } else {
        setIsTranscribing(false)
      }
      return
    }

    if (isRecording) {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop()
      }
      return
    }

    if (typeof window === "undefined") return

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRec && !navigator.userAgent.includes("iPhone")) {
      try {
        const rec = new SpeechRec()
        rec.lang = "id-ID"
        rec.interimResults = false
        rec.maxAlternatives = 1

        rec.onstart = () => {
          setIsRecording(true)
          if (onNotify) onNotify("Merekam suara, silakan bicara...")
        }
        rec.onresult = (event) => {
          const teksHasil = event.results?.[0]?.[0]?.transcript || ""
          if (teksHasil) {
            onChange(value ? `${value} ${teksHasil}` : teksHasil)
            if (onNotify) onNotify("Suara berhasil ditulis.")
          }
        }
        rec.onerror = () => {
          setIsRecording(false)
          mulaiMediaRecorderFallback()
        }
        rec.onend = () => {
          setIsRecording(false)
        }
        rec.start()
        return
      } catch {
        // Fallback ke MediaRecorder
      }
    }

    mulaiMediaRecorderFallback()
  }

  const mulaiMediaRecorderFallback = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })
        const recorder = new MediaRecorder(stream)
        audioChunksRef.current = []

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data)
        }

        recorder.onstop = async () => {
          setIsRecording(false)
          stream.getTracks().forEach((track) => track.stop())

          const mime = recorder.mimeType || "audio/webm"
          const audioBlob = new Blob(audioChunksRef.current, { type: mime })
          lastBlobRef.current = { blob: audioBlob, mime }
          kirimBlobKeAI(audioBlob, mime)
        }

        mediaRecorderRef.current = recorder
        recorder.start()
        setIsRecording(true)
        if (onNotify)
          onNotify("Merekam suara. Tekan tombol merah jika selesai bicara.")
      } catch {
        if (onNotify)
          onNotify(
            "Izin mikrofon belum aktif. Izinkan akses mikrofon di browser.",
          )
      }
    }
  }

  return (
    <div className="relative w-full">
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg p-3 pr-12 text-base sm:text-sm font-normal text-[#14141f] placeholder:text-slate-400 focus:bg-white focus:border-[#14141f] outline-none transition leading-relaxed"
      />
      <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
        {isTranscribing && detikLoading >= 30 && (
          <span className="bg-amber-100 text-[#14141f] border border-amber-300 text-[10px] font-bold px-2 py-1 rounded-md">
            {detikLoading}d • Klik ikon utk ulang
          </span>
        )}
        <button
          type="button"
          onClick={handleMicOrRefreshClick}
          title={
            isTranscribing
              ? "Klik untuk mengulang proses"
              : isRecording
                ? "Klik untuk berhenti merekam"
                : "Rekam suara dengan mikrofon"
          }
          className={`cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center transition ${
            isRecording
              ? "bg-rose-600 text-white animate-pulse"
              : isTranscribing
                ? "bg-amber-400 text-[#14141f]"
                : "bg-[#14141f] text-[#d4f34a] hover:opacity-90"
          }`}
        >
          <FlatIcon
            name={isTranscribing ? "refresh" : "mic"}
            className={`w-4 h-4 ${isTranscribing ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    </div>
  )
}

export function AvatarCropModal({ imageSrc, onCancel, onSaveCrop }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!imageSrc) return
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setImgLoaded(true)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    img.src = imageSrc
  }, [imageSrc])

  useEffect(() => {
    if (!imgLoaded || !canvasRef.current || !imgRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const size = 260
    const img = imgRef.current

    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = "#14141f"
    ctx.fillRect(0, 0, size, size)

    const baseScale = Math.max(size / img.width, size / img.height)
    const finalScale = baseScale * zoom
    const drawW = img.width * finalScale
    const drawH = img.height * finalScale
    const drawX = (size - drawW) / 2 + offset.x
    const drawY = (size - drawH) / 2 + offset.y

    ctx.drawImage(img, drawX, drawY, drawW, drawH)
  }, [imgLoaded, zoom, offset])

  const mulaiGeser = (clientX, clientY) => {
    setDragging(true)
    dragStartRef.current = { x: clientX - offset.x, y: clientY - offset.y }
  }

  const sedangGeser = (clientX, clientY) => {
    if (!dragging) return
    setOffset({
      x: clientX - dragStartRef.current.x,
      y: clientY - dragStartRef.current.y,
    })
  }

  const selesaiGeser = () => setDragging(false)

  const handleSimpan = () => {
    if (!canvasRef.current) return
    const hasilBase64 = canvasRef.current.toDataURL("image/jpeg", 0.85)
    onSaveCrop(hasilBase64)
  }

  if (!imageSrc) return null

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-white text-[#14141f] w-full max-w-sm rounded-2xl p-6 space-y-4 text-center shadow-lg border border-slate-200">
        <div>
          <h3 className="text-base font-bold">Sesuaikan Foto Profil (1:1)</h3>
          <p className="text-xs text-slate-500 mt-1">
            Geser gambar untuk menentukan titik tengah foto yang ingin
            ditampilkan.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="relative w-[260px] h-[260px] rounded-full overflow-hidden border-2 border-[#14141f] touch-none cursor-move">
            <canvas
              ref={canvasRef}
              width={260}
              height={260}
              onMouseDown={(e) => mulaiGeser(e.clientX, e.clientY)}
              onMouseMove={(e) => sedangGeser(e.clientX, e.clientY)}
              onMouseUp={selesaiGeser}
              onMouseLeave={selesaiGeser}
              onTouchStart={(e) => {
                const t = e.touches[0]
                if (t) mulaiGeser(t.clientX, t.clientY)
              }}
              onTouchMove={(e) => {
                const t = e.touches[0]
                if (t) sedangGeser(t.clientX, t.clientY)
              }}
              onTouchEnd={selesaiGeser}
              className="w-full h-full block"
            />
          </div>
        </div>

        <div className="space-y-1 text-left px-1">
          <div className="flex justify-between text-xs font-bold">
            <span>Perbesar:</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-[#14141f]"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer w-1/3 bg-[#f4f5f7] text-[#14141f] font-bold text-xs py-3 rounded-lg"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSimpan}
            className="cursor-pointer flex-1 bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3 rounded-lg"
          >
            Simpan Foto
          </button>
        </div>
      </div>
    </div>
  )
}

export function SelectWithCustom({
  label,
  value,
  options,
  onChange,
  placeholderCustom = "Ketik sendiri sesuai kondisimu...",
}) {
  const isPredefined = options.includes(value)
  const [modeIsiSendiri, setModeIsiSendiri] = useState(
    !isPredefined && Boolean(value),
  )

  const handleSelectChange = (e) => {
    const val = e.target.value
    if (val === "__CUSTOM__") {
      setModeIsiSendiri(true)
      onChange("")
    } else {
      setModeIsiSendiri(false)
      onChange(val)
    }
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-[#14141f]">
          {label}
        </label>
      )}
      <select
        value={modeIsiSendiri ? "__CUSTOM__" : value}
        onChange={handleSelectChange}
        className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-base sm:text-xs font-bold text-[#14141f] outline-none focus:bg-white focus:border-[#14141f]"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option value="__CUSTOM__">Isi Sendiri...</option>
      </select>

      {modeIsiSendiri && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholderCustom}
          autoFocus
          className="w-full bg-white border border-[#14141f] rounded-lg px-3.5 py-2 text-base sm:text-xs font-normal text-[#14141f] outline-none"
        />
      )}
    </div>
  )
}
