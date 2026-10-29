"use client"
import { useState, useEffect, useRef } from "react"

// Katalog Model OpenRouter untuk Uji Coba di Developer Console beserta Estimasi Biaya Rupiah per 1K Token
export const DAFTAR_MODEL_OPENROUTER = [
  {
    id: "google/gemini-2.5-flash",
    nama: "Google Gemini 2.5 Flash",
    provider: "Google",
    kategori: "Cepat & Multimodal (Rekomendasi)",
    inputPer1kRp: 2.5,
    outputPer1kRp: 10.0,
    supportVision: true,
    ket: "Sangat cepat untuk meracik Hook 3 detik, 10 masalah audiens, dan scan gambar review.",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    nama: "Anthropic Claude 3.5 Sonnet",
    provider: "Anthropic",
    kategori: "Copywriting & Storytelling Terbaik",
    inputPer1kRp: 48.0,
    outputPer1kRp: 240.0,
    supportVision: true,
    ket: "Gaya bahasa paling manusiawi, tajam merangkai 6 langkah Threads dan membedah emosi audiens.",
  },
  {
    id: "anthropic/claude-3.5-haiku",
    nama: "Anthropic Claude 3.5 Haiku",
    provider: "Anthropic",
    kategori: "Copywriting Cepat & Ekonomis",
    inputPer1kRp: 13.0,
    outputPer1kRp: 65.0,
    supportVision: true,
    ket: "Versi ringan Claude dengan ritme bahasa natural dan biaya token jauh lebih hemat.",
  },
  {
    id: "deepseek/deepseek-chat",
    nama: "DeepSeek V3 / Chat",
    provider: "DeepSeek",
    kategori: "Sangat Hemat & Logis",
    inputPer1kRp: 2.3,
    outputPer1kRp: 4.5,
    supportVision: false,
    ket: "Biaya token paling rendah untuk produksi masif 10 postingan dan 7 angle produk.",
  },
  {
    id: "openai/gpt-4o-mini",
    nama: "OpenAI GPT-4o Mini",
    provider: "OpenAI",
    kategori: "Stabil & Serbaguna",
    inputPer1kRp: 2.5,
    outputPer1kRp: 10.0,
    supportVision: true,
    ket: "Stabil untuk ekstraksi gambar produk marketplace dan struktur JSON konsisten.",
  },
  {
    id: "google/gemini-2.0-flash-001",
    nama: "Google Gemini 2.0 Flash",
    provider: "Google",
    kategori: "Multimodal Audio & Video",
    inputPer1kRp: 1.8,
    outputPer1kRp: 7.2,
    supportVision: true,
    ket: "Handal untuk transkrip suara mikrofon dan ekstraksi jalur audio video.",
  },
]

export const EMPAT_JENDELA_WAKTU = [
  {
    id: "jendela_1",
    label: "Jendela 1 (Pagi)",
    jam: "07:30 WIB",
    rentang: "07:00 - 08:30 WIB",
    ket: "Audiens baru memulai aktivitas & cek HP pagi hari",
  },
  {
    id: "jendela_2",
    label: "Jendela 2 (Siang)",
    jam: "12:15 WIB",
    rentang: "12:00 - 13:30 WIB",
    ket: "Jam istirahat kerja & scroll cepat sambil makan siang",
  },
  {
    id: "jendela_3",
    label: "Jendela 3 (Sore)",
    jam: "16:45 WIB",
    rentang: "16:30 - 18:00 WIB",
    ket: "Waktu pulang kerja & transisi santai sore hari",
  },
  {
    id: "jendela_4",
    label: "Jendela 4 (Malam)",
    jam: "20:15 WIB",
    rentang: "20:00 - 21:30 WIB",
    ket: "Prime time konversi tertinggi untuk baca Threads & checkout",
  },
]

export const TUJUH_ANGLE_PRODUK = [
  {
    id: "pemula",
    judul: "1. Kebutuhan Pemula",
    ket: "Untuk audiens yang baru mau mulai dan butuh langkah paling gampang.",
  },
  {
    id: "sering_gagal",
    judul: "2. Sering Gagal / Boncos",
    ket: "Untuk audiens yang sudah coba berbagai cara tapi hasilnya nihil.",
  },
  {
    id: "hemat_waktu",
    judul: "3. Butuh Hemat Waktu",
    ket: "Untuk pekerja sibuk yang butuh solusi praktis tanpa ribet.",
  },
  {
    id: "sensitif_anggaran",
    judul: "4. Sensitif Anggaran",
    ket: "Fokus pada penghematan biaya dan nilai manfaat dibanding harga.",
  },
  {
    id: "kecewa_produk_lama",
    judul: "5. Kecewa Produk Lain (Review 1-3)",
    ket: "Menjawab trauma pembeli dari keluhan bintang rendah di marketplace.",
  },
  {
    id: "sebelum_sesudah",
    judul: "6. Kontras Sebelum vs Sesudah",
    ket: "Menonjolkan perubahan nyata sebelum dan setelah pemakaian.",
  },
  {
    id: "jangka_panjang",
    judul: "7. Pemakaian Jangka Panjang",
    ket: "Membahas daya tahan, konsistensi hasil, dan pengalaman jujur.",
  },
]

export function hitungBiayaModelRp(
  modelId,
  promptTokens = 0,
  completionTokens = 0,
) {
  const m =
    DAFTAR_MODEL_OPENROUTER.find((x) => x.id === modelId) ||
    DAFTAR_MODEL_OPENROUTER[0]
  const biayaIn = (Number(promptTokens) / 1000) * m.inputPer1kRp
  const biayaOut = (Number(completionTokens) / 1000) * m.outputPer1kRp
  return Math.max(5, Math.round(biayaIn + biayaOut))
}

export function formatKoinSingkat(jumlah) {
  const n = Number(jumlah) || 0
  if (n < 1000) return String(n)
  return n.toLocaleString("id-ID")
}

export function hitungKuotaAkunDariPaket(
  namaPaket = "",
  nominal = 0,
  isAdmin = false,
) {
  if (isAdmin) return 10
  const p = (namaPaket || "").toLowerCase()
  const nom = Number(nominal) || 0
  if (p.includes("90") || nom >= 85000) return 10
  if (p.includes("50") || nom >= 45000) return 5
  if (p.includes("25") || nom >= 24000) return 3
  if (
    p.includes("20") ||
    p.includes("15") ||
    p.includes("10") ||
    (nom >= 9000 && nom < 24000)
  ) {
    return 2
  }
  return 1
}

export function rekamKetikanKeGudangIngatan(userId, sumberKolom, teksKetikan) {
  if (typeof window === "undefined") return null
  const bersih = (teksKetikan || "").trim()
  if (bersih.length < 10) return null

  const storageKey = `hookya_memory_vault_${userId || "guest"}`
  try {
    const raw = localStorage.getItem(storageKey)
    const lama = raw
      ? JSON.parse(raw)
      : {
          samples: [],
          reviewSingkat:
            "Otak AI sedang mengumpulkan pola kalimat dan gaya ngonten dari percakapanmu.",
          rincianAnalisa: null,
          lastUpdated: null,
        }

    const sudahAda = (lama.samples || []).some((s) => s.teks === bersih)
    if (sudahAda) return lama

    const sampelBaru = {
      id: `mem_${Date.now()}`,
      sumber: sumberKolom || "Chat Sesi",
      teks: bersih.slice(0, 350),
      waktu: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    const listSamples = [sampelBaru, ...(lama.samples || [])].slice(0, 40)
    const dataUpdate = {
      ...lama,
      samples: listSamples,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(storageKey, JSON.stringify(dataUpdate))
    return dataUpdate
  } catch {
    return null
  }
}

export function ambilDataGudangIngatan(userId) {
  if (typeof window === "undefined") {
    return { samples: [], reviewSingkat: "", rincianAnalisa: null }
  }
  const storageKey = `hookya_memory_vault_${userId || "guest"}`
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore parse error
  }
  return {
    samples: [],
    reviewSingkat:
      "Otak aplikasi otomatis mempelajari setiap chat dan voice note yang kamu kirim untuk mengenali gaya bicaramu.",
    rincianAnalisa: null,
  }
}

export function simpanAnalisaGudangIngatan(userId, objekAnalisa) {
  if (typeof window === "undefined") return null
  const storageKey = `hookya_memory_vault_${userId || "guest"}`
  try {
    const lama = ambilDataGudangIngatan(userId)
    const baru = {
      ...lama,
      reviewSingkat:
        objekAnalisa?.reviewSingkat ||
        lama.reviewSingkat ||
        "Gaya bicara pengguna berhasil dianalisis.",
      rincianAnalisa: objekAnalisa?.rincianAnalisa || objekAnalisa || null,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(storageKey, JSON.stringify(baru))
    return baru
  } catch {
    return null
  }
}

export function HookyaMark({ className = "w-8 h-8", fill = "#14141F" }) {
  return (
    <svg viewBox="0 0 248 248" fill="none" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M79 54C62.4315 54 49 67.4315 49 84C49 97.4 57.9 108.7 70.3 112.6C62 119.5 50 134.5 50 164C50 180.569 63.4315 194 80 194C96.5685 194 110 180.569 110 164C110 152 118 144 128 144C138 144 146 152 146 164C146 180.569 159.431 194 176 194C192.569 194 206 180.569 206 164C206 134.5 194 119.5 185.7 112.6C198.1 108.7 207 97.4 207 84C207 67.4315 193.569 54 177 54C160.431 54 147 67.4315 147 84C147 92 141 98 133 98C125 98 119 92 119 84C119 67.4315 105.569 54 89 54H79Z"
        fill={fill}
      />
      <circle cx="177" cy="84" r="28" fill={fill} />
    </svg>
  )
}

export function HookyaLogo({
  className = "h-7",
  brandConfig = null,
  isLoginScreen = false,
  subLabel = "",
}) {
  const customLogoUrl = brandConfig?.logoPngUrl || ""
  const gapPx =
    brandConfig?.logoGapPx !== undefined ? Number(brandConfig.logoGapPx) : 6
  const teksBrand =
    brandConfig?.brandText !== undefined ? brandConfig.brandText : "OOKYA"
  const tampilkanTeks = brandConfig?.showBrandText !== false

  if (isLoginScreen) {
    return (
      <div
        style={{ gap: `${gapPx}px` }}
        className="inline-flex flex-col items-center justify-center select-none"
      >
        {customLogoUrl ? (
          <img
            src={customLogoUrl}
            alt="Logo Brand"
            className="w-16 h-16 object-contain"
          />
        ) : (
          <HookyaMark className="w-16 h-16" fill="#14141F" />
        )}
        {tampilkanTeks && teksBrand && (
          <span className="font-extrabold text-sm tracking-[0.16em] text-[#14141F]">
            {teksBrand}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
    >
      <div style={{ gap: `${gapPx}px` }} className="inline-flex items-center">
        {customLogoUrl ? (
          <img
            src={customLogoUrl}
            alt="Logo Brand"
            className="h-7 w-auto object-contain shrink-0"
          />
        ) : (
          <HookyaMark className="w-7 h-7 shrink-0" fill="#14141F" />
        )}
        {tampilkanTeks && teksBrand && (
          <span className="font-extrabold text-base tracking-[0.14em] text-[#14141F]">
            {teksBrand}
          </span>
        )}
      </div>
      {subLabel && (
        <div className="border-l border-[#E2E8F0] pl-2.5 leading-tight hidden xs:block">
          <span className="text-xs font-bold text-[#14141F] block">Hookya</span>
          <span className="text-[10px] text-[#64748B] block">{subLabel}</span>
        </div>
      )}
    </div>
  )
}

async function ubahBlobSuaraKeWavBase64(audioBlob) {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer()
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null

    const audioCtx = new AudioCtx()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    audioCtx.close()

    const targetRate = 12000
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
    arrowLeft: <path d="M19 12H5M12 19l-7-7 7-7" />,
    arrowRight: <path d="M5 12h14M12 5l7 7-7 7" />,
    arrowUp: <path d="M12 19V5M5 12l7-7 7 7" />,
    plus: <path d="M12 5v14M5 12h14" />,
    plusCircle: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    bolt: <path d="M13 2L3 14h7v8l10-12h-7V2z" />,
    dna: (
      <path d="M7 2v2c0 4 10 4 10 8s-10 4-10 8v2M17 2v2c0 4-10 4-10 8s10 4 10 8v2M6 6h12M6 18h12M8 12h8" />
    ),
    brain: (
      <>
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
      </>
    ),
    bot: (
      <>
        <rect x="4" y="7" width="16" height="12" rx="3" />
        <path d="M12 3v4M8 12h.01M16 12h.01M9 16h6" />
      </>
    ),
    chat: (
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    ),
    send: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    sliders: (
      <>
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </>
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
    folder: (
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    ),
    folderOpen: (
      <path d="M2 19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2l-2-8H4l-2 8zM2 11V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v3" />
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 15" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
    star: (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    ),
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    trash: (
      <>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
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
    at: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
      </>
    ),
    mail: (
      <>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
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
  label = "Bot Hookya sedang meracik respons untukmu...",
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
    <div className="py-6 px-5 rounded-2xl bg-white border border-[#E2E8F0] flex flex-col items-center justify-center text-center space-y-2.5">
      <button
        type="button"
        onClick={() => {
          setDetik(0)
          if (onRefresh) onRefresh()
        }}
        title="Klik untuk mengulang proses"
        className="cursor-pointer w-10 h-10 rounded-xl bg-[#14141F] text-[#D4F34A] flex items-center justify-center transition"
      >
        <FlatIcon name="refresh" className="w-4 h-4 animate-spin" />
      </button>

      <div className="text-xs sm:text-sm font-bold text-[#14141F]">{label}</div>

      <div className="text-[11px] font-semibold text-[#64748B]">
        Waktu berjalan: <span className="text-[#14141F]">{detik} detik</span>
      </div>

      {detik >= 25 && onRefresh && (
        <button
          type="button"
          onClick={() => {
            setDetik(0)
            onRefresh()
          }}
          className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold"
        >
          Muat Ulang Proses
        </button>
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
  userId = "guest",
  memorySourceLabel = "Ketikan Textbox",
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const speechRecRef = useRef(null)
  const audioChunksRef = useRef([])
  const valueRef = useRef(value)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  const kirimBlobKeAI = async (audioBlob, mimeAsli) => {
    if (!audioBlob || audioBlob.size < 200) return
    setIsTranscribing(true)
    if (onNotify) onNotify("Mengubah rekaman suaramu menjadi teks...")

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
        body: JSON.stringify({
          action: "transkrip_suara_mic",
          userId,
          audioBase64: base64Final,
          audioMimeType: mimeFinal,
        }),
      })
      const data = await res.json()
      if (res.ok && data.teks) {
        const teksLama = (valueRef.current || "").trim()
        const gabungan = teksLama ? `${teksLama} ${data.teks}` : data.teks
        onChange(gabungan)
        rekamKetikanKeGudangIngatan(userId, memorySourceLabel, gabungan)
        if (onNotify) onNotify("Suara berhasil diubah menjadi teks.")
      }
    } catch {
      if (onNotify)
        onNotify("Error sistem, silakan refresh atau hubungi admin.")
    } finally {
      setIsTranscribing(false)
    }
  }

  const mulaiMediaRecorder = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (onNotify) onNotify("Browser ini tidak mendukung perekaman mikrofon.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        setIsRecording(false)
        stream.getTracks().forEach((track) => track.stop())
        const mime = recorder.mimeType || "audio/webm"
        const audioBlob = new Blob(audioChunksRef.current, { type: mime })
        kirimBlobKeAI(audioBlob, mime)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      if (onNotify)
        onNotify("Merekam suara... Klik lagi setelah selesai bicara.")
    } catch {
      if (onNotify)
        onNotify("Izinkan akses mikrofon di browser kamu terlebih dahulu.")
    }
  }

  const handleMicClick = () => {
    if (isTranscribing) return
    if (isRecording) {
      if (speechRecRef.current) {
        try {
          speechRecRef.current.stop()
        } catch {
          // Ignore stop error
        }
        speechRecRef.current = null
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop()
      } else {
        setIsRecording(false)
      }
      return
    }

    if (typeof window === "undefined") return
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRec && !navigator.userAgent.includes("iPhone")) {
      try {
        const rec = new SpeechRec()
        rec.lang = "id-ID"
        rec.continuous = false
        rec.interimResults = false
        let dapatHasil = false

        rec.onstart = () => {
          setIsRecording(true)
          if (onNotify) onNotify("Silakan bicara sekarang...")
        }
        rec.onresult = (event) => {
          const teksHasil = event.results?.[0]?.[0]?.transcript || ""
          if (teksHasil) {
            dapatHasil = true
            const teksLama = (valueRef.current || "").trim()
            const gabungan = teksLama ? `${teksLama} ${teksHasil}` : teksHasil
            onChange(gabungan)
            rekamKetikanKeGudangIngatan(userId, memorySourceLabel, gabungan)
            if (onNotify) onNotify("Suara berhasil ditulis.")
          }
        }
        rec.onerror = () => {
          setIsRecording(false)
          speechRecRef.current = null
          if (!dapatHasil) mulaiMediaRecorder()
        }
        rec.onend = () => {
          setIsRecording(false)
          speechRecRef.current = null
        }
        speechRecRef.current = rec
        rec.start()
        return
      } catch {
        // Fallback to MediaRecorder
      }
    }
    mulaiMediaRecorder()
  }

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] focus-within:border-[#14141F] focus-within:bg-white transition overflow-hidden">
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          if (value && value.trim().length >= 10) {
            rekamKetikanKeGudangIngatan(userId, memorySourceLabel, value)
          }
        }}
        placeholder={placeholder}
        className="w-full text-base sm:text-sm p-3.5 bg-transparent text-[#14141F] placeholder:text-[#64748B] focus:outline-none resize-none leading-relaxed"
      />
      <div className="flex items-center justify-between px-3.5 py-2 border-t border-[#E2E8F0] bg-white">
        <span className="text-[11px] text-[#64748B]">
          {isRecording
            ? "Merekam suara... Klik Stop untuk selesai"
            : isTranscribing
              ? "Mengubah suara menjadi teks..."
              : "Terekam otomatis ke Gudang Ingatan AI"}
        </span>
        <div className="flex items-center gap-1.5">
          {value && value.trim().length > 0 && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="cursor-pointer px-2.5 py-1 rounded-lg border border-[#EF4444]/30 bg-[#FEF2F2] text-[#EF4444] text-xs font-semibold flex items-center gap-1 transition"
            >
              <FlatIcon name="trash" className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleMicClick}
            className={`cursor-pointer px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              isRecording
                ? "bg-[#EF4444] text-white animate-pulse"
                : isTranscribing
                  ? "bg-[#D4F34A] text-[#14141F]"
                  : "bg-[#D4F34A] text-[#14141F] hover:bg-[#C5E738]"
            }`}
          >
            <FlatIcon
              name={isTranscribing ? "refresh" : "mic"}
              className={`w-3.5 h-3.5 ${isTranscribing ? "animate-spin" : ""}`}
            />
            <span>{isRecording ? "Stop" : "Rekam Suara"}</span>
          </button>
        </div>
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
    ctx.fillStyle = "#14141F"
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

  if (!imageSrc) return null

  return (
    <div className="fixed inset-0 bg-[#14141F]/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white text-[#14141F] w-full max-w-sm rounded-2xl p-6 space-y-4 text-center border border-[#14141F]">
        <div>
          <h3 className="text-base font-bold">Sesuaikan Foto Profil (1:1)</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Geser gambar untuk menentukan posisi tengah foto.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="relative w-[260px] h-[260px] rounded-full overflow-hidden border-2 border-[#14141F] touch-none cursor-move">
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

        <div className="space-y-1 text-left px-2">
          <div className="flex justify-between text-xs font-bold">
            <span>Perbesar / Perkecil:</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-[#14141F]"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer w-1/3 bg-[#F4F5F7] text-[#14141F] font-bold text-xs py-3 rounded-lg"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              if (!canvasRef.current) return
              onSaveCrop(canvasRef.current.toDataURL("image/jpeg", 0.85))
            }}
            className="cursor-pointer flex-1 bg-[#D4F34A] text-[#14141F] font-bold text-xs py-3 rounded-lg"
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

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-[#14141F]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={modeIsiSendiri ? "__CUSTOM__" : value}
          onChange={(e) => {
            if (e.target.value === "__CUSTOM__") {
              setModeIsiSendiri(true)
              onChange("")
            } else {
              setModeIsiSendiri(false)
              onChange(e.target.value)
            }
          }}
          className="w-full h-11 bg-white border border-[#E2E8F0] rounded-lg px-3.5 pr-9 text-base sm:text-sm font-medium text-[#14141F] appearance-none focus:outline-none focus:border-[#14141F]"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          <option value="__CUSTOM__">Isi Sendiri...</option>
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]">
          <FlatIcon name="chevronDown" className="w-4 h-4" />
        </span>
      </div>

      {modeIsiSendiri && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholderCustom}
          autoFocus
          className="w-full h-11 bg-white border border-[#14141F] rounded-lg px-3.5 text-base sm:text-sm text-[#14141F] outline-none"
        />
      )}
    </div>
  )
}
