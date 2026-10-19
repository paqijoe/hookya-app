"use client"
import { useState, useRef } from "react"

// ============================================================================
// 1. KOMPONEN IKON FLAT DESIGN
// ============================================================================
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

// ============================================================================
// 2. MIKROFON HYBRID AI (BEKERJA DI SEMUA BROWSER & HP DENGAN MEDIARECORDER)
// ============================================================================
export function StoryVoiceInput({
  value,
  onChange,
  placeholder,
  rows = 2,
  onNotify,
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const stopAndTranscribe = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop()
    }
  }

  const handleMicToggle = async () => {
    // Jika sedang merekam, klik kedua akan menghentikan rekaman dan mengirim ke AI
    if (isRecording) {
      stopAndTranscribe()
      return
    }

    if (typeof window === "undefined") return

    // Gunakan MediaRecorder agar 100% kompatibel di semua HP & In-App Browser
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

          const audioBlob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          })

          setIsTranscribing(true)
          if (onNotify)
            onNotify("Sedang mengubah rekaman suaramu menjadi teks...")

          const reader = new FileReader()
          reader.onloadend = async () => {
            try {
              const base64Audio = (reader.result || "").toString().split(",")[1]
              const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "transkrip_suara_mic",
                  audioBase64: base64Audio,
                  audioMimeType: recorder.mimeType || "audio/webm",
                }),
              })
              const data = await res.json()
              if (res.ok && data.teks) {
                const gabungan = value ? `${value} ${data.teks}` : data.teks
                onChange(gabungan)
                if (onNotify) onNotify("Suara berhasil diubah menjadi teks!")
              } else {
                if (onNotify)
                  onNotify("Suara kurang terdengar jelas, silakan coba lagi.")
              }
            } catch {
              if (onNotify) onNotify("Gagal memproses transkrip suara.")
            } finally {
              setIsTranscribing(false)
            }
          }
          reader.readAsDataURL(audioBlob)
        }

        mediaRecorderRef.current = recorder
        recorder.start()
        setIsRecording(true)
        if (onNotify)
          onNotify(
            "🎙️ Merekam suara... Klik ikon merah lagi jika selesai bicara.",
          )
      } catch {
        if (onNotify)
          onNotify(
            "Izin mikrofon ditolak oleh browser. Klik ikon gembok di atas browser lalu izinkan Mikrofon.",
          )
      }
    } else {
      if (onNotify) onNotify("Perangkat ini tidak mengizinkan akses mikrofon.")
    }
  }

  return (
    <div className="relative w-full">
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#f4f5f7] border border-slate-200 rounded-2xl p-3.5 pr-12 text-xs sm:text-sm font-normal text-[#14141f] focus:bg-white focus:border-[#14141f] outline-none transition leading-relaxed"
      />
      <button
        type="button"
        disabled={isTranscribing}
        onClick={handleMicToggle}
        title={
          isRecording
            ? "Klik untuk selesai bicara"
            : "Klik untuk mulai bicara dengan mikrofon"
        }
        className={`cursor-pointer absolute right-2.5 bottom-2.5 w-9 h-9 rounded-xl flex items-center justify-center transition shadow-2xs ${
          isRecording
            ? "bg-rose-600 text-white animate-pulse ring-4 ring-rose-300"
            : isTranscribing
              ? "bg-amber-400 text-[#14141f] animate-spin"
              : "bg-[#14141f] text-[#d4f34a] hover:scale-105"
        }`}
      >
        <FlatIcon
          name={isTranscribing ? "refresh" : "mic"}
          className="w-4 h-4"
        />
      </button>
    </div>
  )
}

// ============================================================================
// 3. DROPDOWN DENGAN OPSI "ISI SENDIRI..."
// ============================================================================
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
        <label className="block text-xs font-bold text-[#14141f] tracking-tight">
          {label}
        </label>
      )}
      <select
        value={modeIsiSendiri ? "__CUSTOM__" : value}
        onChange={handleSelectChange}
        className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#14141f] outline-none focus:bg-white focus:border-[#14141f]"
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
          className="w-full bg-white border border-[#14141f] rounded-xl px-3.5 py-2 text-xs font-normal text-[#14141f] outline-none"
        />
      )}
    </div>
  )
}
