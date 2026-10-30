"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  FlatIcon,
  AILoadingBox,
  ENAM_FAKTOR_VIRAL,
  ENAM_BENTUK_KONTEN_TRUST,
  TUJUH_ANGLE_PRODUK,
  ubahBlobSuaraKeWavBase64,
  rekamKetikanKeGudangIngatan,
  ambilDataGudangIngatan,
  simpanAnalisaGudangIngatan,
} from "./SharedUI";

const PILIHAN_TUJUAN_AWAL = [
  {
    id: "Konten Cari Viral",
    judul: "1. Konten Cari Viral",
    ket: "Fokus jangkauan luas, menahan scroll, dan menarik audiens baru.",
  },
  {
    id: "Konten Cari Trust",
    judul: "2. Konten Cari Trust",
    ket: "Membangun kepercayaan & otoritas (balas komentar, tips & trik, studi kasus).",
  },
  {
    id: "Konten Jualan",
    judul: "3. Konten Jualan",
    ket: "Fokus konversi produk atau jasa lewat masalah pembeli, 7 angle & 10 hook.",
  },
];

const PILIHAN_FORMAT_KONTEN = [
  { id: "TikTok / Reels", label: "TikTok / Reels" },
  { id: "Carousel", label: "Carousel (Pilih Jumlah Slide)" },
  { id: "Threads", label: "Threads (Pilih Bentuk Format)" },
];

const PILIHAN_SLIDE_CAROUSEL = [
  "5 Slide Padat",
  "7 Slide Storytelling",
  "10 Slide Edukasi Mendalam",
];

const PILIHAN_MODEL_THREADS = [
  "Threads Utas 6 Langkah Konversi",
  "Threads Utas Storytelling Pengalaman",
  "Threads Single Post Padat & Menohok",
];

const PILIHAN_DURASI_KONTEN = [
  "15 Detik",
  "30 Detik",
  "60 Detik",
  "90 Detik",
  "3 Menit",
];

function kompresGambarChat(file) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
          resolve({
            previewUrl: dataUrl,
            base64: dataUrl.split(",")[1] || "",
            mimeType: "image/jpeg",
            namaFile: file.name,
          });
        };
        img.onerror = () => resolve(null);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    } catch {
      resolve(null);
    }
  });
}

function buatSesiTopikBaru(nomorUrut = 1, akunDefault = "") {
  const waktuSkr = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    id: `sesi_${Date.now()}`,
    nomorSesi: nomorUrut,
    judul: "Diskusi Topik Konten Baru",
    akunLabel: akunDefault || "",
    gunakanPersona: Boolean(akunDefault),
    format: "TikTok / Reels",
    statusLabel: "Draf Baru",
    statusTahap: "Sedang diskusi",
    waktuTerakhir: waktuSkr,
    flowState: {
      tahap: "pilih_tujuan",
      tujuanKonten: "",
      formatKonten: "",
      jumlahSlideCarousel: "",
      modelThreads: "",
      topikAtauProduk: "",
      jenisJualan: "",
      dataProduk: {
        namaProduk: "",
        jenisProduk: "",
        spesifikasi: "",
        fungsiUtama: "",
        harga: "",
      },
      masalahAtauGoals: "",
      faktorAtauAngle: "",
      referensiTambahan: "",
      durasiKonten: "60 Detik",
      hookTerpilih: "",
      ctaTerpilih: "",
    },
    messages: [
      {
        id: `msg_init_${Date.now()}`,
        role: "assistant",
        waktu: waktuSkr,
        tahapBerikutnya: "pilih_tujuan",
        balasanBot:
          "Halo! Pilih tujuan konten yang ingin kamu buat hari ini, atau langsung ketik lengkap ide/produkmu di bawah:",
        opsiPilihanCepat: [
          "Konten Cari Viral",
          "Konten Cari Trust",
          "Konten Jualan",
        ],
        rekomendasi10: [],
        faktorViralPilihan: [],
        sevenAngles: [],
        hookOptions10: [],
        ctaOptions: [],
        tampilkanKartuProduk: false,
        naskahFinal: null,
      },
    ],
  };
}

export default function BrainstormView({
  userId,
  namaUser,
  kuotaAkunMaksimal = 2,
  coins,
  updateKoinDatabase,
  personaProfile,
  aiModel1 = "anthropic/claude-3.5-haiku",
  aiModel2 = "anthropic/claude-3.5-sonnet",
  selectedPersonaHeader = "",
  setSelectedPersonaHeader,
  simpanAtauUpdateSkripDatabase,
  setKoleksiSkripTersimpan,
  setHasilSkrip,
  setStage,
  setActiveMenu,
  showToast,
  onRefreshDataUser,
  isInsideChatRoom,
  setIsInsideChatRoom,
}) {
  const latestBotMsgRef = useRef(null);
  const textareaInputRef = useRef(null);
  const speechRecRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const baseTextBeforeRecRef = useRef("");

  const storageSessionsKey = `hookya_topic_sessions_v3_${userId || "guest"}`;

  const [internalSubView, setInternalSubView] = useState("list");
  const subView =
    isInsideChatRoom !== undefined
      ? isInsideChatRoom
        ? "chat"
        : "list"
      : internalSubView;

  const ubahSubView = (modeBaru) => {
    setInternalSubView(modeBaru);
    if (setIsInsideChatRoom) {
      setIsInsideChatRoom(modeBaru === "chat");
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filterAkunPill, setFilterAkunPill] = useState("ALL");
  const [openSwipeId, setOpenSwipeId] = useState(null);

  const [daftarAkunSosmed, setDaftarAkunSosmed] = useState([]);
  const [daftarSesiTopik, setDaftarSesiTopik] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");

  const [pesanInput, setPesanInput] = useState("");
  const [isExpandedTextbox, setIsExpandedTextbox] = useState(false);
  const pesanInputRef = useRef("");
  useEffect(() => {
    pesanInputRef.current = pesanInput;
  }, [pesanInput]);

  useEffect(() => {
    const el = textareaInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const batasTinggi = isExpandedTextbox ? 280 : 190;
    const tinggiBaru = Math.min(el.scrollHeight, batasTinggi);
    el.style.height = `${Math.max(36, tinggiBaru)}px`;
  }, [pesanInput, isExpandedTextbox]);

  const [lampiranMedia, setLampiranMedia] = useState([]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [isTranscribingMic, setIsTranscribingMic] = useState(false);
  const [isScanningProductSS, setIsScanningProductSS] = useState(false);

  const [formKartuProduk, setFormKartuProduk] = useState({
    namaProduk: "",
    jenisProduk: "",
    spesifikasi: "",
    fungsiUtama: "",
    harga: "",
  });

  const akunDefaultLabel =
    personaProfile?.account_label ||
    `@${(namaUser || "creator").toLowerCase().replace(/\s+/g, ".")}`;

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const rawTernak = localStorage.getItem(
        `hookya_ternak_akun_${userId || "guest"}`
      );
      if (rawTernak) {
        const parsed = JSON.parse(rawTernak);
        if (Array.isArray(parsed.daftarAkun) && parsed.daftarAkun.length > 0) {
          setDaftarAkunSosmed(parsed.daftarAkun);
        }
      }
    } catch {
      // Ignore storage error
    }

    try {
      const rawSesi = localStorage.getItem(storageSessionsKey);
      if (rawSesi) {
        const parsedSesi = JSON.parse(rawSesi);
        if (Array.isArray(parsedSesi) && parsedSesi.length > 0) {
          setDaftarSesiTopik(parsedSesi);
          setActiveSessionId(parsedSesi[0].id);
          return;
        }
      }
    } catch {
      // Ignore parse error
    }

    const sesiAwal = buatSesiTopikBaru(1, selectedPersonaHeader || "");
    setDaftarSesiTopik([sesiAwal]);
    setActiveSessionId(sesiAwal.id);
  }, [userId, storageSessionsKey]);

  const simpanDaftarSesiKeStorageDanDB = async (listBaru) => {
    setDaftarSesiTopik(listBaru);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageSessionsKey, JSON.stringify(listBaru));
      } catch {
        // Ignore local quota error
      }
    }
    if (userId) {
      try {
        const { data: uRow } = await supabase
          .from("users")
          .select("profil_dna")
          .eq("id", userId)
          .single();
        if (uRow) {
          const ringkasanDB = listBaru.slice(0, 25).map((s) => ({
            id: s.id,
            nomorSesi: s.nomorSesi,
            judul: s.judul,
            akunLabel: s.akunLabel,
            gunakanPersona: s.gunakanPersona,
            format: s.format,
            statusLabel: s.statusLabel,
            statusTahap: s.statusTahap,
            waktuTerakhir: s.waktuTerakhir,
            flowState: s.flowState,
            messages: (s.messages || []).slice(-12).map((m) => ({
              ...m,
              images: [],
            })),
          }));
          await supabase
            .from("users")
            .update({
              profil_dna: {
                ...(uRow.profil_dna || {}),
                chat_sessions_backup: ringkasanDB,
              },
            })
            .eq("id", userId);
        }
      } catch {
        // Ignore background sync error
      }
    }
  };

  const sesiAktif =
    daftarSesiTopik.find((s) => s.id === activeSessionId) ||
    daftarSesiTopik[0] ||
    buatSesiTopikBaru(1, selectedPersonaHeader || "");

  const flowAktif = sesiAktif.flowState || {};

  // Sinkronisasi pilihan persona dari tengah Header ke sesi aktif
  useEffect(() => {
    if (!sesiAktif?.id) return;
    const pakaiPersona = Boolean(selectedPersonaHeader);
    if (
      sesiAktif.akunLabel !== selectedPersonaHeader ||
      Boolean(sesiAktif.gunakanPersona) !== pakaiPersona
    ) {
      const listUpdate = daftarSesiTopik.map((s) =>
        s.id === sesiAktif.id
          ? {
              ...s,
              akunLabel: selectedPersonaHeader || "",
              gunakanPersona: pakaiPersona,
            }
          : s
      );
      setDaftarSesiTopik(listUpdate);
    }
  }, [selectedPersonaHeader]);

  useEffect(() => {
    if (flowAktif.dataProduk) {
      setFormKartuProduk((prev) => ({
        ...prev,
        ...flowAktif.dataProduk,
      }));
    }
  }, [sesiAktif.id]);

  const gulirKePesanBaruBotTanpaAreaKosong = () => {
    setTimeout(() => {
      if (latestBotMsgRef.current) {
        latestBotMsgRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, 100);
  };

  const updateSesiAktif = (perubahanObj) => {
    const listUpdate = daftarSesiTopik.map((s) =>
      s.id === sesiAktif.id ? { ...s, ...perubahanObj } : s
    );
    simpanDaftarSesiKeStorageDanDB(listUpdate);
  };

  const handleBuatTopikBaru = () => {
    const nomorBaru = daftarSesiTopik.length + 1;
    const baru = buatSesiTopikBaru(nomorBaru, selectedPersonaHeader || "");
    const listBaru = [baru, ...daftarSesiTopik];
    simpanDaftarSesiKeStorageDanDB(listBaru);
    setActiveSessionId(baru.id);
    ubahSubView("chat");
    setPesanInput("");
    setLampiranMedia([]);
  };

  const handleHapusSesiTopik = (idTarget) => {
    const sisa = daftarSesiTopik.filter((s) => s.id !== idTarget);
    if (sisa.length === 0) {
      const baru = buatSesiTopikBaru(1, selectedPersonaHeader || "");
      simpanDaftarSesiKeStorageDanDB([baru]);
      setActiveSessionId(baru.id);
    } else {
      simpanDaftarSesiKeStorageDanDB(sisa);
      if (activeSessionId === idTarget) {
        setActiveSessionId(sisa[0].id);
      }
    }
    setOpenSwipeId(null);
    showToast("Sesi topik berhasil dihapus.");
  };

  const kirimBlobVoiceNoteKeAI = async (audioBlob, mimeAsli) => {
    if (!audioBlob || audioBlob.size < 200) return;
    setIsTranscribingMic(true);
    try {
      const hasilWav = await ubahBlobSuaraKeWavBase64(audioBlob);
      let base64Final = hasilWav?.base64 || "";
      let mimeFinal = hasilWav?.mimeType || mimeAsli || "audio/wav";

      if (!base64Final) {
        base64Final = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve((reader.result || "").toString().split(",")[1] || "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(audioBlob);
        });
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
      });
      const data = await res.json();
      if (res.ok && data.teks) {
        const teksSebelumnya = (pesanInputRef.current || "").trim();
        const gabungan = teksSebelumnya
          ? `${teksSebelumnya} ${data.teks}`
          : data.teks;
        setPesanInput(gabungan);
        rekamKetikanKeGudangIngatan(userId, "Voice Note Chat", gabungan);
        showToast("Rekaman suara ditambahkan ke teks.");
      }
    } catch {
      showToast("Gagal menerjemahkan suara.");
    } finally {
      setIsTranscribingMic(false);
    }
  };

  const mulaiMediaRecorderFallback = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("Browser tidak mendukung mikrofon.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        setIsRecordingMic(false);
        stream.getTracks().forEach((track) => track.stop());
        const mime = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        kirimBlobVoiceNoteKeAI(audioBlob, mime);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingMic(true);
      showToast("Mic ON: Silakan bicara. Pencet sekali lagi untuk Off Record.");
    } catch {
      showToast("Izinkan akses mikrofon di browser kamu.");
    }
  };

  const handleToggleVoiceNoteInput = () => {
    if (isTranscribingMic) return;

    if (isRecordingMic) {
      if (speechRecRef.current) {
        try {
          speechRecRef.current.stop();
        } catch {
          // Ignore stop error
        }
        speechRecRef.current = null;
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      } else {
        setIsRecordingMic(false);
      }
      showToast("Mic OFF: Rekaman dihentikan, teks tersimpan.");
      return;
    }

    baseTextBeforeRecRef.current = (pesanInputRef.current || "").trim();

    if (typeof window === "undefined") return;
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRec && !navigator.userAgent.includes("iPhone")) {
      try {
        const rec = new SpeechRec();
        rec.lang = "id-ID";
        rec.continuous = true;
        rec.interimResults = true;

        rec.onstart = () => {
          setIsRecordingMic(true);
          showToast(
            "Mic ON: Silakan bicara. Pencet sekali lagi untuk Off Record."
          );
        };

        rec.onresult = (ev) => {
          let transkripSesiIni = "";
          for (let i = 0; i < ev.results.length; i++) {
            transkripSesiIni += ev.results[i][0].transcript + " ";
          }
          const bersih = transkripSesiIni.trim();
          if (bersih) {
            const gabungan = baseTextBeforeRecRef.current
              ? `${baseTextBeforeRecRef.current} ${bersih}`
              : bersih;
            setPesanInput(gabungan);
          }
        };

        rec.onerror = () => {
          setIsRecordingMic(false);
          speechRecRef.current = null;
        };

        rec.onend = () => {
          setIsRecordingMic(false);
          speechRecRef.current = null;
          if (pesanInputRef.current) {
            rekamKetikanKeGudangIngatan(
              userId,
              "Voice Note Chat",
              pesanInputRef.current
            );
          }
        };

        speechRecRef.current = rec;
        rec.start();
        return;
      } catch {
        // Fallback to MediaRecorder
      }
    }

    mulaiMediaRecorderFallback();
  };

  const handlePilihMediaUpload = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 2);
    if (files.length === 0) return;
    const hasil = [];
    for (const f of files) {
      if (f.type.startsWith("image/")) {
        const k = await kompresGambarChat(f);
        if (k) hasil.push({ ...k, tipeMedia: "foto" });
      } else {
        hasil.push({
          previewUrl: "",
          base64: "",
          mimeType: f.type || "video/mp4",
          namaFile: f.name,
          tipeMedia: "video",
        });
      }
    }
    setLampiranMedia((prev) => [...prev, ...hasil].slice(0, 2));
    e.target.value = "";
  };

  const handleScanScreenshotProduk = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanningProductSS(true);
    showToast("Menganalisa screenshot produk dari marketplace...");
    try {
      const k = await kompresGambarChat(file);
      if (!k) throw new Error("Gagal membaca gambar");

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze_product_card_screenshot",
          userId,
          namaUser,
          aiModel1,
          aiModel2,
          uploadedImages: [k],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const nextProduk = {
          namaProduk: data.namaProduk || formKartuProduk.namaProduk,
          jenisProduk: data.jenisProduk || formKartuProduk.jenisProduk,
          spesifikasi: data.spesifikasi || formKartuProduk.spesifikasi,
          fungsiUtama: data.fungsiUtama || formKartuProduk.fungsiUtama,
          harga: data.harga || formKartuProduk.harga,
        };
        setFormKartuProduk(nextProduk);
        showToast("Data produk berhasil diekstrak dari screenshot!");
      }
    } catch {
      showToast("Gagal menganalisa screenshot produk.");
    } finally {
      setIsScanningProductSS(false);
      e.target.value = "";
    }
  };

  // Mengirim pesan ke AI 1 (Asesmen & Brainstorming)
  const handleKirimPesanKeBot = async ({
    teksOverride = null,
    flowPatch = {},
  } = {}) => {
    const teksFinal = (
      teksOverride !== null ? teksOverride : pesanInput
    ).trim();
    if (!teksFinal && lampiranMedia.length === 0) return;
    if (isSendingChat) return;

    const waktuSkr = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (teksFinal) {
      rekamKetikanKeGudangIngatan(userId, "Chat Sesi Topik", teksFinal);
    }

    const flowTerbaru = {
      ...flowAktif,
      ...flowPatch,
    };

    const msgUser = {
      id: `usr_${Date.now()}`,
      role: "user",
      waktu: waktuSkr,
      teks:
        teksFinal ||
        `[Mengunggah ${lampiranMedia.map((m) => m.namaFile).join(", ")}]`,
      images: lampiranMedia
        .filter((m) => m.previewUrl)
        .map((m) => m.previewUrl),
    };

    const messagesSementara = [...(sesiAktif.messages || []), msgUser];
    const judulSementara =
      sesiAktif.judul === "Diskusi Topik Konten Baru" &&
      teksFinal &&
      !teksFinal.startsWith("Saya pilih:")
        ? teksFinal.slice(0, 48)
        : sesiAktif.judul;

    const aktifPakaiPersona = Boolean(selectedPersonaHeader);
    const labelPersonaAktif = selectedPersonaHeader || "";

    updateSesiAktif({
      judul: judulSementara,
      akunLabel: labelPersonaAktif,
      gunakanPersona: aktifPakaiPersona,
      waktuTerakhir: waktuSkr,
      flowState: flowTerbaru,
      messages: messagesSementara,
    });

    const gambarDikirim = lampiranMedia.filter((m) => m.base64);
    if (teksOverride === null) {
      setPesanInput("");
      setIsExpandedTextbox(false);
    }
    setLampiranMedia([]);
    setIsSendingChat(true);

    try {
      const akunObj = daftarAkunSosmed.find(
        (a) => a.labelAkun === labelPersonaAktif
      );

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ai_script_session_chat",
          userId,
          namaUser,
          aiModel1,
          aiModel2,
          pesanUser: msgUser.teks,
          riwayatChat: messagesSementara
            .slice(-6)
            .map((m) => ({
              role: m.role,
              content: m.teks || m.balasanBot || "",
            })),
          flowState: flowTerbaru,
          gunakanPersona: aktifPakaiPersona,
          akunPersonaTerpilih: aktifPakaiPersona ? akunObj : null,
          personaProfile,
          memoryVaultSamples: ambilDataGudangIngatan(userId).samples || [],
          uploadedImages: gambarDikirim,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses chat");

      if (data.analisaGudangIngatan) {
        simpanAnalisaGudangIngatan(userId, data.analisaGudangIngatan);
      }

      const nextFlow = {
        ...flowTerbaru,
        tahap: data.tahapBerikutnya || flowTerbaru.tahap,
        tujuanKonten:
          data.terdeteksiTujuan && data.terdeteksiTujuan !== "belum_dipilih"
            ? data.terdeteksiTujuan
            : flowTerbaru.tujuanKonten,
        formatKonten:
          data.terdeteksiFormat && data.terdeteksiFormat !== "belum_dipilih"
            ? data.terdeteksiFormat
            : flowTerbaru.formatKonten,
      };

      const msgBot = {
        id: `bot_${Date.now()}`,
        role: "assistant",
        waktu: waktuSkr,
        tahapBerikutnya: data.tahapBerikutnya || "diskusi",
        balasanBot:
          data.balasanBot ||
          "Silakan pilih atau lengkapi langkah berikut untuk melanjutkan:",
        tampilkanKartuProduk: Boolean(data.tampilkanKartuProduk),
        opsiPilihanCepat: Array.isArray(data.opsiPilihanCepat)
          ? data.opsiPilihanCepat
          : [],
        rekomendasi10: Array.isArray(data.rekomendasi10)
          ? data.rekomendasi10
          : [],
        faktorViralPilihan: Array.isArray(data.faktorViralPilihan)
          ? data.faktorViralPilihan
          : [],
        sevenAngles: Array.isArray(data.sevenAngles) ? data.sevenAngles : [],
        hookOptions10: Array.isArray(data.hookOptions10)
          ? data.hookOptions10
          : [],
        ctaOptions: Array.isArray(data.ctaOptions) ? data.ctaOptions : [],
        naskahFinal: null,
      };

      const judulFinal =
        sesiAktif.judul === "Diskusi Topik Konten Baru" && data.judulSesiTopik
          ? data.judulSesiTopik
          : judulSementara;

      updateSesiAktif({
        judul: judulFinal,
        format: nextFlow.formatKonten || sesiAktif.format,
        waktuTerakhir: waktuSkr,
        statusTahap: "Sedang diskusi",
        flowState: nextFlow,
        messages: [...messagesSementara, msgBot],
      });

      if (onRefreshDataUser) onRefreshDataUser();
      gulirKePesanBaruBotTanpaAreaKosong();
    } catch {
      showToast("Error sistem, silakan refresh atau hubungi admin.");
    } finally {
      setIsSendingChat(false);
    }
  };

  // Menyusun Naskah Akhir menggunakan AI 2 (Generate Naskah)
  const handleGenerateSatuNaskahUtuh = async () => {
    if (isGeneratingScript) return;
    if (coins < 1) {
      alert("Saldo koin belum mencukupi (Perlu 1 Koin). Silakan Top-Up koin.");
      setActiveMenu("topup");
      return;
    }

    setIsGeneratingScript(true);
    await updateKoinDatabase(coins - 1);

    const waktuSkr = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const aktifPakaiPersona = Boolean(selectedPersonaHeader);
    const labelPersonaAktif = selectedPersonaHeader || "";

    try {
      const akunObj = daftarAkunSosmed.find(
        (a) => a.labelAkun === labelPersonaAktif
      );

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_6step_script",
          userId,
          namaUser,
          aiModel1,
          aiModel2,
          pesanUser: flowAktif.topikAtauProduk || sesiAktif.judul,
          formatKonten: flowAktif.formatKonten || sesiAktif.format,
          flowState: flowAktif,
          hookTerpilih: flowAktif.hookTerpilih,
          ctaTerpilih: flowAktif.ctaTerpilih,
          gunakanPersona: aktifPakaiPersona,
          akunPersonaTerpilih: aktifPakaiPersona ? akunObj : null,
          personaProfile,
          memoryVaultSamples: ambilDataGudangIngatan(userId).samples || [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.silentCoinUpdated != null) {
          updateKoinDatabase(data.silentCoinUpdated);
        }
        if (onRefreshDataUser) onRefreshDataUser();
        throw new Error("Gagal menyusun naskah");
      }

      const tglHariIni = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const skripBaru = {
        id: Date.now(),
        dbId: null,
        judul: data.judul || sesiAktif.judul,
        kategori: flowAktif.tujuanKonten || "Naskah AI",
        bentuk:
          flowAktif.formatKonten || sesiAktif.format || "TikTok / Reels",
        akunLabel: labelPersonaAktif || "Mode Umum",
        waktuDibuat: tglHariIni,
        targetDuration:
          data.targetDuration || flowAktif.durasiKonten || "60 Detik",
        kritikDetail: data.kritikDetail || null,
        uploadPackage: data.uploadPackage || null,
        uploadPack: data.uploadPackage || null,
        variasiFolder: [],
        sudahUpload: false,
        tanggalUpload: "",
        sections: data.sections || [],
        segmen: data.segmen || data.sections || [],
      };

      const tersimpanDB = await simpanAtauUpdateSkripDatabase(skripBaru);
      setKoleksiSkripTersimpan((prev) => [tersimpanDB, ...prev]);

      const msgNaskah = {
        id: `script_${Date.now()}`,
        role: "assistant",
        waktu: waktuSkr,
        tahapBerikutnya: "selesai_naskah",
        balasanBot:
          "Berikut adalah naskah lengkap yang sudah disusun sesuai pilihanmu dan otomatis tersimpan ke Arsip:",
        naskahFinal: tersimpanDB,
      };

      updateSesiAktif({
        statusLabel: "Siap Rekam",
        statusTahap: "AI Final",
        waktuTerakhir: waktuSkr,
        messages: [...(sesiAktif.messages || []), msgNaskah],
      });

      if (onRefreshDataUser) onRefreshDataUser();
      showToast("Naskah selesai disusun & tersimpan ke Arsip.");
      gulirKePesanBaruBotTanpaAreaKosong();
    } catch {
      showToast(
        "Request gagal diproses. Koin Anda telah dikembalikan otomatis (Auto-Refund)."
      );
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const semuaAkunUnik = [
    akunDefaultLabel,
    ...daftarAkunSosmed.map((a) => a.labelAkun),
  ].filter((v, i, arr) => v && arr.indexOf(v) === i);

  const daftarSesiTerfilter = daftarSesiTopik.filter((s) => {
    if (filterAkunPill !== "ALL" && s.akunLabel !== filterAkunPill) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.judul || "").toLowerCase().includes(q) ||
      (s.format || "").toLowerCase().includes(q) ||
      (s.akunLabel || "").toLowerCase().includes(q)
    );
  });

  // ============================================================================
  // TAMPILAN 1: HALAMAN LIST CHAT TOPIK
  // ============================================================================
  if (subView === "list") {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-3 pb-10">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative flex items-center bg-white rounded-xl border border-[#E2E8F0] px-3 h-11">
            <FlatIcon
              name="search"
              className="w-4 h-4 text-[#64748B] shrink-0 mr-2"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik naskah, percakapan bot..."
              className="w-full bg-transparent text-[16px] sm:text-sm text-[#14141F] placeholder:text-[#64748B] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="cursor-pointer text-xs font-bold text-[#64748B] px-1"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleBuatTopikBaru}
            title="Buat Sesi Topik Baru"
            className="cursor-pointer w-11 h-11 rounded-xl bg-[#D4F34A] hover:bg-[#C5E738] text-[#14141F] flex items-center justify-center shrink-0 active:scale-95 transition"
          >
            <FlatIcon name="plus" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterAkunPill("ALL")}
            className={`cursor-pointer shrink-0 h-9 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
              filterAkunPill === "ALL"
                ? "bg-[#14141F] text-white"
                : "bg-white text-[#14141F] border border-[#E2E8F0]"
            }`}
          >
            <span>Semua Akun</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filterAkunPill === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-[#F4F5F7] text-[#14141F]"
              }`}
            >
              {daftarSesiTopik.length}
            </span>
          </button>

          {semuaAkunUnik.slice(0, kuotaAkunMaksimal).map((akLabel) => {
            const jmlSesiAkun = daftarSesiTopik.filter(
              (s) => s.akunLabel === akLabel
            ).length;
            const aktif = filterAkunPill === akLabel;

            return (
              <button
                key={akLabel}
                type="button"
                onClick={() => setFilterAkunPill(akLabel)}
                className={`cursor-pointer shrink-0 h-9 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition ${
                  aktif
                    ? "bg-[#14141F] text-[#D4F34A] border-[#14141F]"
                    : "bg-white text-[#14141F] border-[#E2E8F0]"
                }`}
              >
                <span className="truncate max-w-[140px]">{akLabel}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#F4F5F7] text-[#14141F] text-[10px]">
                  {jmlSesiAkun}
                </span>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] divide-y divide-[#E2E8F0] overflow-hidden">
          {daftarSesiTerfilter.map((sesi, idx) => {
            const sedangBukaAksi = openSwipeId === sesi.id;
            const isSiapRekam = sesi.statusLabel === "Siap Rekam";

            return (
              <div
                key={sesi.id}
                className="relative flex items-stretch justify-between transition hover:bg-[#F4F5F7]/60"
              >
                <div
                  onClick={() => {
                    setActiveSessionId(sesi.id);
                    if (setSelectedPersonaHeader) {
                      setSelectedPersonaHeader(
                        sesi.gunakanPersona ? sesi.akunLabel || "" : ""
                      );
                    }
                    ubahSubView("chat");
                  }}
                  className="cursor-pointer flex-1 p-3.5 space-y-1.5 min-w-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#14141F] leading-snug line-clamp-2">
                      {sesi.judul}
                    </h3>
                    <span className="text-[11px] text-[#64748B] shrink-0">
                      {sesi.waktuTerakhir}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-[#F4F5F7] text-[#14141F] font-semibold border border-[#E2E8F0]">
                      {sesi.flowState?.tujuanKonten || sesi.format}
                    </span>
                    <span className="text-[#64748B]">
                      Sesi #{sesi.nomorSesi || daftarSesiTopik.length - idx}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="px-2 py-0.5 rounded bg-[#F4F5F7] text-[#14141F] text-[11px] font-semibold truncate max-w-[140px]">
                        {sesi.gunakanPersona && sesi.akunLabel
                          ? sesi.akunLabel
                          : "Tanpa Persona"}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSiapRekam
                            ? "bg-[#D4F34A] text-[#14141F]"
                            : "bg-[#FFF4E5] text-[#B45309]"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{sesi.statusLabel || "Draf Baru"}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenSwipeId(sedangBukaAksi ? null : sesi.id);
                      }}
                      className="cursor-pointer px-2 py-0.5 rounded bg-[#F4F5F7] hover:bg-[#E2E8F0] text-xs font-bold text-[#14141F] shrink-0"
                    >
                      •••
                    </button>
                  </div>
                </div>

                {sedangBukaAksi && (
                  <div className="flex items-stretch shrink-0 border-l border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => handleHapusSesiTopik(sesi.id)}
                      className="cursor-pointer w-16 bg-[#FFECEC] hover:bg-[#FFD8D8] text-[#BA1A1A] flex flex-col items-center justify-center gap-1 text-[11px] font-bold"
                    >
                      <FlatIcon name="trash" className="w-4 h-4" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================================================
  // TAMPILAN 2: RUANG CHAT TOPIK (BALON BOT TANPA EKOR & TEXTBOX TANPA JEDA KANAN)
  // ============================================================================
  const listMessages = sesiAktif.messages || [];
  const lastBotIndex = listMessages.reduce(
    (acc, m, idx) => (m.role === "assistant" ? idx : acc),
    0
  );

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-full">
      {/* AREA ISI CHAT YANG BISA DISCROLL TANPA MENGGESER HEADER */}
      <div className="flex-1 space-y-2.5 pt-1 pb-24 px-1">
        {listMessages.map((msg, mIdx) => {
          // BALON CHAT USER (KANAN, HITAM #14141F)
          if (msg.role === "user") {
            return (
              <div
                key={msg.id || mIdx}
                className="flex items-end justify-end pr-1"
              >
                <div className="relative max-w-[85%] bg-[#14141F] text-white rounded-2xl rounded-br-sm px-3 py-2">
                  {Array.isArray(msg.images) && msg.images.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap pb-1.5">
                      {msg.images.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt="Upload User"
                          className="w-20 h-20 rounded-lg object-cover border border-white/20"
                        />
                      ))}
                    </div>
                  )}
                  <div className="text-xs sm:text-sm leading-snug whitespace-pre-line break-words">
                    <span>{msg.teks}</span>
                    <span className="inline-block float-right text-[10px] text-white/60 ml-2.5 mt-1 leading-none select-none">
                      {msg.waktu}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // BALON CHAT BOT (KIRI, PUTIH #FFFFFF TANPA EKOR)
          const isLatestBotMsg = mIdx === lastBotIndex;
          const tahap = msg.tahapBerikutnya || "";
          const skripFinal = msg.naskahFinal;

          return (
            <div
              key={msg.id || mIdx}
              ref={isLatestBotMsg ? latestBotMsgRef : null}
              className="flex items-end justify-start"
            >
              <div className="w-full max-w-[94%] sm:max-w-[88%] bg-white border border-[#E2E8F0] rounded-2xl px-3.5 py-2.5 space-y-2">
                <p className="text-xs sm:text-sm text-[#14141F] leading-snug whitespace-pre-line break-words">
                  {msg.balasanBot}
                </p>

                {/* 1. PILIH TUJUAN KONTEN AWAL */}
                {tahap === "pilih_tujuan" && (
                  <div className="grid grid-cols-1 gap-1.5 pt-0.5">
                    {PILIHAN_TUJUAN_AWAL.map((tj) => (
                      <button
                        key={tj.id}
                        type="button"
                        onClick={() =>
                          handleKirimPesanKeBot({
                            teksOverride: `Saya pilih: ${tj.id}`,
                            flowPatch: {
                              tahap: "pilih_format",
                              tujuanKonten: tj.id,
                            },
                          })
                        }
                        className="cursor-pointer px-3 py-2 rounded-xl bg-[#F4F5F7] hover:bg-[#D4F34A] border border-[#E2E8F0] text-left transition"
                      >
                        <div className="text-xs font-bold text-[#14141F]">
                          {tj.judul}
                        </div>
                        <div className="text-[11px] text-[#64748B] leading-tight mt-0.5">
                          {tj.ket}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. PILIH BENTUK FORMAT */}
                {tahap === "pilih_format" && (
                  <div className="space-y-2 pt-0.5">
                    <div className="grid grid-cols-1 gap-1.5">
                      {PILIHAN_FORMAT_KONTEN.map((fmt) => {
                        const dipilih = flowAktif.formatKonten === fmt.id;
                        return (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() => {
                              if (fmt.id === "TikTok / Reels") {
                                handleKirimPesanKeBot({
                                  teksOverride: "Bentuk konten: TikTok / Reels",
                                  flowPatch: {
                                    formatKonten: "TikTok / Reels",
                                  },
                                });
                              } else {
                                updateSesiAktif({
                                  flowState: {
                                    ...flowAktif,
                                    formatKonten: fmt.id,
                                  },
                                });
                              }
                            }}
                            className={`cursor-pointer px-3 py-2 rounded-xl border text-xs font-bold text-left transition ${
                              dipilih
                                ? "bg-[#14141F] text-[#D4F34A] border-[#14141F]"
                                : "bg-[#F4F5F7] text-[#14141F] border-[#E2E8F0] hover:bg-[#D4F34A]"
                            }`}
                          >
                            {fmt.label}
                          </button>
                        );
                      })}
                    </div>

                    {flowAktif.formatKonten === "Carousel" && (
                      <div className="p-2.5 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-1.5">
                        <span className="text-[11px] font-bold text-[#14141F] block">
                          Pilih Jumlah Slide Carousel:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {PILIHAN_SLIDE_CAROUSEL.map((sl) => (
                            <button
                              key={sl}
                              type="button"
                              onClick={() =>
                                handleKirimPesanKeBot({
                                  teksOverride: `Bentuk konten: Carousel (${sl})`,
                                  flowPatch: {
                                    formatKonten: "Carousel",
                                    jumlahSlideCarousel: sl,
                                  },
                                })
                              }
                              className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#D4F34A] text-xs font-bold text-[#14141F] border border-[#E2E8F0]"
                            >
                              {sl}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {flowAktif.formatKonten === "Threads" && (
                      <div className="p-2.5 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-1.5">
                        <span className="text-[11px] font-bold text-[#14141F] block">
                          Pilih Bentuk Format Threads:
                        </span>
                        <div className="flex flex-col gap-1">
                          {PILIHAN_MODEL_THREADS.map((mt) => (
                            <button
                              key={mt}
                              type="button"
                              onClick={() =>
                                handleKirimPesanKeBot({
                                  teksOverride: `Bentuk konten: ${mt}`,
                                  flowPatch: {
                                    formatKonten: "Threads",
                                    modelThreads: mt,
                                  },
                                })
                              }
                              className="cursor-pointer px-2.5 py-2 rounded-lg bg-white hover:bg-[#D4F34A] text-xs font-bold text-[#14141F] border border-[#E2E8F0] text-left"
                            >
                              {mt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. CABANG TRUST: 6 VARIASI BENTUK KONTEN TRUST */}
                {tahap === "trust_brainstorm" && (
                  <div className="space-y-1.5 pt-0.5">
                    <span className="text-[11px] font-bold text-[#14141F] block">
                      Pilih Ide Bentuk Konten Pembangun Trust:
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {ENAM_BENTUK_KONTEN_TRUST.map((tr) => (
                        <button
                          key={tr.id}
                          type="button"
                          onClick={() =>
                            handleKirimPesanKeBot({
                              teksOverride: `Pendekatan konten trust: ${tr.label}`,
                              flowPatch: { faktorAtauAngle: tr.label },
                            })
                          }
                          className="cursor-pointer px-2.5 py-2 rounded-xl bg-[#F4F5F7] hover:bg-[#D4F34A] border border-[#E2E8F0] text-left transition"
                        >
                          <div className="text-xs font-bold text-[#14141F]">
                            {tr.label}
                          </div>
                          <div className="text-[11px] text-[#64748B] leading-tight mt-0.5">
                            {tr.ket}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. CABANG JUALAN: PILIH JASA ATAU PRODUK */}
                {tahap === "jualan_jenis" && (
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    {["Konten Jualan Produk", "Konten Jualan Jasa"].map(
                      (jns) => (
                        <button
                          key={jns}
                          type="button"
                          onClick={() =>
                            handleKirimPesanKeBot({
                              teksOverride: `Saya mau membuat ${jns}`,
                              flowPatch: {
                                jenisJualan: jns,
                                tahap: "jualan_kartu_produk",
                              },
                            })
                          }
                          className="cursor-pointer px-2.5 py-2.5 rounded-xl bg-[#F4F5F7] hover:bg-[#D4F34A] border border-[#E2E8F0] text-xs font-bold text-[#14141F] text-center"
                        >
                          {jns}
                        </button>
                      )
                    )}
                  </div>
                )}

                {/* 5. CABANG JUALAN: KARTU DETAIL PRODUK/JASA */}
                {(msg.tampilkanKartuProduk ||
                  tahap === "jualan_kartu_produk") && (
                  <div className="bg-[#F8F9FA] rounded-xl border border-[#14141F] p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#14141F]">
                        Kartu Detail Produk / Jasa
                      </span>
                      <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-[#14141F] text-[#D4F34A] text-[11px] font-bold inline-flex items-center gap-1">
                        <FlatIcon name="upload" className="w-3 h-3" />
                        <span>
                          {isScanningProductSS
                            ? "Menganalisa..."
                            : "Upload Screenshot Produk"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScanScreenshotProduk}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="font-bold text-[#14141F] block mb-0.5">
                          Nama Produk / Jasa:
                        </label>
                        <input
                          type="text"
                          value={formKartuProduk.namaProduk}
                          onChange={(e) =>
                            setFormKartuProduk({
                              ...formKartuProduk,
                              namaProduk: e.target.value,
                            })
                          }
                          placeholder="Nama produk..."
                          className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#E2E8F0] text-[16px] sm:text-xs text-[#14141F]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-[#14141F] block mb-0.5">
                          Jenis Produk:
                        </label>
                        <input
                          type="text"
                          value={formKartuProduk.jenisProduk}
                          onChange={(e) =>
                            setFormKartuProduk({
                              ...formKartuProduk,
                              jenisProduk: e.target.value,
                            })
                          }
                          placeholder="Kategori..."
                          className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#E2E8F0] text-[16px] sm:text-xs text-[#14141F]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-[#14141F] block mb-0.5">
                          Spesifikasi:
                        </label>
                        <input
                          type="text"
                          value={formKartuProduk.spesifikasi}
                          onChange={(e) =>
                            setFormKartuProduk({
                              ...formKartuProduk,
                              spesifikasi: e.target.value,
                            })
                          }
                          placeholder="Bahan, fitur, ukuran..."
                          className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#E2E8F0] text-[16px] sm:text-xs text-[#14141F]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-[#14141F] block mb-0.5">
                          Harga:
                        </label>
                        <input
                          type="text"
                          value={formKartuProduk.harga}
                          onChange={(e) =>
                            setFormKartuProduk({
                              ...formKartuProduk,
                              harga: e.target.value,
                            })
                          }
                          placeholder="Rp..."
                          className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#E2E8F0] text-[16px] sm:text-xs text-[#14141F]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-bold text-[#14141F] block mb-0.5">
                          Fungsi Utama:
                        </label>
                        <input
                          type="text"
                          value={formKartuProduk.fungsiUtama}
                          onChange={(e) =>
                            setFormKartuProduk({
                              ...formKartuProduk,
                              fungsiUtama: e.target.value,
                            })
                          }
                          placeholder="Manfaat utama bagi pembeli..."
                          className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#E2E8F0] text-[16px] sm:text-xs text-[#14141F]"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const ringkasan = `Produk: ${formKartuProduk.namaProduk} (${formKartuProduk.jenisProduk}) | Spek: ${formKartuProduk.spesifikasi} | Fungsi: ${formKartuProduk.fungsiUtama} | Harga: ${formKartuProduk.harga}`;
                        handleKirimPesanKeBot({
                          teksOverride: ringkasan,
                          flowPatch: {
                            topikAtauProduk: formKartuProduk.namaProduk,
                            dataProduk: formKartuProduk,
                            tahap: "jualan_10_masalah",
                          },
                        });
                      }}
                      className="cursor-pointer w-full h-9 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <FlatIcon name="check" className="w-3.5 h-3.5" />
                      <span>Simpan Produk & Lihat 10 Masalah Pembeli</span>
                    </button>
                  </div>
                )}

                {/* 6. 10 REKOMENDASI (GOALS VIRAL ATAU 10 MASALAH CALON PEMBELI) */}
                {Array.isArray(msg.rekomendasi10) &&
                  msg.rekomendasi10.length > 0 && (
                    <div className="bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] p-2.5 space-y-1.5">
                      <span className="text-[11px] font-bold text-[#14141F] block">
                        Pilih 1 dari 10 Rekomendasi Berikut:
                      </span>
                      <div className="grid grid-cols-1 gap-1 max-h-52 overflow-y-auto pr-1">
                        {msg.rekomendasi10.map((rek, rIdx) => {
                          const dipilih = flowAktif.masalahAtauGoals === rek;
                          return (
                            <button
                              key={rIdx}
                              type="button"
                              onClick={() =>
                                handleKirimPesanKeBot({
                                  teksOverride: `Saya pilih: ${rek}`,
                                  flowPatch: { masalahAtauGoals: rek },
                                })
                              }
                              className={`cursor-pointer px-2.5 py-2 rounded-lg text-left text-xs border transition ${
                                dipilih
                                  ? "bg-[#14141F] text-[#D4F34A] border-[#14141F] font-bold"
                                  : "bg-white text-[#14141F] border-[#E2E8F0] hover:border-[#14141F]"
                              }`}
                            >
                              {rek}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* 7. PILIHAN 6 FAKTOR VIRAL */}
                {(tahap === "viral_goals_dan_faktor" ||
                  (Array.isArray(msg.faktorViralPilihan) &&
                    msg.faktorViralPilihan.length > 0)) &&
                  flowAktif.tujuanKonten === "Konten Cari Viral" && (
                    <div className="space-y-1.5 pt-0.5">
                      <span className="text-[11px] font-bold text-[#14141F] block">
                        Pilih 1 Faktor Pemicu Viral:
                      </span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {ENAM_FAKTOR_VIRAL.map((fv) => {
                          const dipilih =
                            flowAktif.faktorAtauAngle === fv.label;
                          return (
                            <button
                              key={fv.id}
                              type="button"
                              onClick={() =>
                                handleKirimPesanKeBot({
                                  teksOverride: `Faktor viral pilihan: ${fv.label}`,
                                  flowPatch: { faktorAtauAngle: fv.label },
                                })
                              }
                              className={`cursor-pointer px-2.5 py-2 rounded-xl border text-left text-xs transition ${
                                dipilih
                                  ? "bg-[#14141F] text-[#D4F34A] border-[#14141F] font-bold"
                                  : "bg-[#F4F5F7] text-[#14141F] border-[#E2E8F0] hover:border-[#14141F]"
                              }`}
                            >
                              <div className="font-bold">{fv.label}</div>
                              <div className="text-[10px] opacity-80 leading-tight mt-0.5">
                                {fv.ket}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* 8. PERTANYAAN REFERENSI MATERI TAMBAHAN */}
                {(tahap === "viral_referensi" ||
                  tahap === "trust_referensi") && (
                  <div className="p-2.5 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-1.5">
                    <span className="text-[11px] font-bold text-[#14141F] block">
                      Ada referensi tambahan (teks / voice note / foto / video)?
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          showToast(
                            "Silakan ketik, rekam voice note, atau klik ikon penjepit kertas di bawah."
                          )
                        }
                        className="cursor-pointer px-3 py-1.5 rounded-lg bg-white border border-[#14141F] text-xs font-bold text-[#14141F]"
                      >
                        Ada (Input di Bawah)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleKirimPesanKeBot({
                            teksOverride:
                              "Tidak ada referensi tambahan, lanjut ke pemilihan durasi.",
                            flowPatch: {
                              referensiTambahan: "Tidak ada",
                              tahap: "pilih_durasi",
                            },
                          })
                        }
                        className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#14141F] text-[#D4F34A] text-xs font-bold"
                      >
                        Tidak Ada, Lanjut Durasi
                      </button>
                    </div>
                  </div>
                )}

                {/* 9. 7 PILIHAN ANGLE PRODUK */}
                {(tahap === "jualan_7_angle" ||
                  (Array.isArray(msg.sevenAngles) &&
                    msg.sevenAngles.length > 0)) &&
                  flowAktif.tujuanKonten === "Konten Jualan" && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#14141F] block">
                        Pilih 1 dari 7 Angle Produk:
                      </span>
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {(msg.sevenAngles?.length > 0
                          ? msg.sevenAngles
                          : TUJUH_ANGLE_PRODUK
                        ).map((ang, aIdx) => {
                          const labelAng = ang.label || ang.judul;
                          const ketAng = ang.ide || ang.ket;
                          const aktif =
                            flowAktif.faktorAtauAngle === labelAng;
                          return (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() =>
                                handleKirimPesanKeBot({
                                  teksOverride: `Saya pilih ${labelAng}`,
                                  flowPatch: { faktorAtauAngle: labelAng },
                                })
                              }
                              className={`cursor-pointer shrink-0 w-48 p-2.5 rounded-xl border text-left transition ${
                                aktif
                                  ? "bg-[#14141F] text-white border-[#14141F]"
                                  : "bg-[#F4F5F7] text-[#14141F] border-[#E2E8F0]"
                              }`}
                            >
                              <div
                                className={`text-xs font-bold ${
                                  aktif ? "text-[#D4F34A]" : "text-[#14141F]"
                                }`}
                              >
                                {labelAng}
                              </div>
                              <p
                                className={`text-[10px] mt-0.5 line-clamp-2 ${
                                  aktif ? "text-white/80" : "text-[#64748B]"
                                }`}
                              >
                                {ketAng}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* 10. PILIH DURASI KONTEN */}
                {(tahap === "pilih_durasi" ||
                  tahap === "jualan_7_angle" ||
                  tahap === "trust_referensi") && (
                  <div className="space-y-1 pt-0.5">
                    <span className="text-[11px] font-bold text-[#14141F] block">
                      Pilih Durasi Konten:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PILIHAN_DURASI_KONTEN.map((dur) => {
                        const aktif = flowAktif.durasiKonten === dur;
                        return (
                          <button
                            key={dur}
                            type="button"
                            onClick={() =>
                              handleKirimPesanKeBot({
                                teksOverride: `Durasi konten: ${dur}. Tampilkan pilihan Hook dan CTA.`,
                                flowPatch: {
                                  durasiKonten: dur,
                                  tahap: "pilih_hook_dan_cta",
                                },
                              })
                            }
                            className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                              aktif
                                ? "bg-[#14141F] text-[#D4F34A] border-[#14141F]"
                                : "bg-[#F4F5F7] text-[#14141F] border-[#E2E8F0] hover:bg-[#D4F34A]"
                            }`}
                          >
                            {dur}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 11. 10 REKOMENDASI HOOK + PILIHAN CTA + GENERATE 1 TEKS */}
                {Array.isArray(msg.hookOptions10) &&
                  msg.hookOptions10.length > 0 && (
                    <div className="space-y-2.5 pt-0.5">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-[#14141F] block">
                          Pilih 1 dari {msg.hookOptions10.length} Jenis Hook:
                        </span>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {msg.hookOptions10.map((hk, hIdx) => {
                            const dipilih =
                              flowAktif.hookTerpilih === hk.teksHook;
                            return (
                              <button
                                key={hIdx}
                                type="button"
                                onClick={() =>
                                  updateSesiAktif({
                                    flowState: {
                                      ...flowAktif,
                                      hookTerpilih: hk.teksHook,
                                    },
                                  })
                                }
                                className={`cursor-pointer w-full px-2.5 py-2 rounded-xl border text-left transition space-y-0.5 ${
                                  dipilih
                                    ? "bg-[#14141F] text-white border-[#14141F]"
                                    : "bg-[#F4F5F7] text-[#14141F] border-[#E2E8F0]"
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase">
                                  <span
                                    className={
                                      dipilih
                                        ? "text-[#D4F34A]"
                                        : "text-[#64748B]"
                                    }
                                  >
                                    #{hk.nomor || hIdx + 1} • {hk.jenis}
                                  </span>
                                  {dipilih && (
                                    <span className="bg-[#D4F34A] text-[#14141F] px-1.5 py-0.5 rounded">
                                      Dipilih
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-bold leading-snug">
                                  &ldquo;{hk.teksHook}&rdquo;
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {Array.isArray(msg.ctaOptions) &&
                        msg.ctaOptions.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-[#14141F] block">
                              Pilih Rekomendasi CTA:
                            </span>
                            <div className="grid grid-cols-1 gap-1.5">
                              {msg.ctaOptions.map((ct, cIdx) => {
                                const dipilih =
                                  flowAktif.ctaTerpilih === ct.teksCta;
                                return (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    onClick={() =>
                                      updateSesiAktif({
                                        flowState: {
                                          ...flowAktif,
                                          ctaTerpilih: ct.teksCta,
                                        },
                                      })
                                    }
                                    className={`cursor-pointer px-2.5 py-2 rounded-xl border text-left transition ${
                                      dipilih
                                        ? "bg-[#14141F] text-white border-[#14141F]"
                                        : "bg-[#F4F5F7] text-[#14141F] border-[#E2E8F0]"
                                    }`}
                                  >
                                    <div
                                      className={`text-[10px] font-bold uppercase ${
                                        dipilih
                                          ? "text-[#D4F34A]"
                                          : "text-[#64748B]"
                                      }`}
                                    >
                                      {ct.kategori}
                                    </div>
                                    <div className="text-xs font-bold mt-0.5">
                                      &ldquo;{ct.teksCta}&rdquo;
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      <button
                        type="button"
                        disabled={isGeneratingScript}
                        onClick={handleGenerateSatuNaskahUtuh}
                        className="cursor-pointer w-full h-11 px-3.5 rounded-xl bg-[#D4F34A] hover:bg-[#C5E738] text-[#14141F] font-extrabold text-xs flex items-center justify-between gap-2 transition active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-1.5">
                          <FlatIcon name="bolt" className="w-4 h-4" />
                          <span>Generate Teks Naskah Sekarang</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#14141F] text-[#D4F34A] text-[10px] font-bold">
                          1 Koin
                        </span>
                      </button>
                    </div>
                  )}

                {/* 12. TAMPILAN 1 NASKAH FINAL UTUH */}
                {skripFinal && (
                  <div className="bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] p-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-[#14141F] truncate">
                        {skripFinal.judul}
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-[#D4F34A] text-[#14141F] text-[10px] font-bold shrink-0">
                        {skripFinal.targetDuration}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {(skripFinal.sections || []).map((sec, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-[#14141F]">
                              Bagian {sec.partNumber || sIdx + 1} •{" "}
                              {sec.partTitle}
                            </span>
                            <span className="text-[#556500]">
                              {sec.estimatedSeconds}
                            </span>
                          </div>
                          <p className="text-xs text-[#14141F] leading-snug whitespace-pre-line">
                            {sec.spokenText || sec.voiceover}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const teksSalin = (skripFinal.sections || [])
                            .map(
                              (s) =>
                                `[${s.partTitle}]\n${
                                  s.spokenText || s.voiceover
                                }`
                            )
                            .join("\n\n");
                          navigator.clipboard.writeText(teksSalin);
                          showToast("Naskah berhasil disalin.");
                        }}
                        className="cursor-pointer flex-1 h-9 px-3 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <FlatIcon name="copy" className="w-3.5 h-3.5" />
                        <span>Salin Naskah</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setHasilSkrip(skripFinal);
                          setStage(5);
                          setActiveMenu("produksi");
                        }}
                        className="cursor-pointer h-9 px-3 rounded-lg bg-[#14141F] text-white text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <FlatIcon name="tv" className="w-3.5 h-3.5" />
                        <span>Teleprompter</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-0.5">
                  <span className="text-[10px] text-[#64748B] leading-none select-none">
                    {msg.waktu}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {(isSendingChat || isGeneratingScript) && (
          <AILoadingBox
            onRefresh={() => {
              const lastUserMsg = [...listMessages]
                .reverse()
                .find((m) => m.role === "user");
              if (lastUserMsg) {
                handleKirimPesanKeBot({ teksOverride: lastUserMsg.teks });
              }
            }}
          />
        )}
      </div>

      {/* BAR INPUT TEKS STATIS DI BAWAH TANPA JEDA KOSONG DI SEBELAH KANAN */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#F4F5F7] border-t border-[#E2E8F0] px-2.5 py-2">
        <div className="max-w-2xl mx-auto space-y-1.5">
          {lampiranMedia.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-[#E2E8F0]">
              {lampiranMedia.map((m, i) => (
                <div
                  key={i}
                  className="relative flex items-center gap-1 bg-[#F4F5F7] px-2 py-1 rounded-lg text-[11px] font-bold"
                >
                  {m.previewUrl ? (
                    <img
                      src={m.previewUrl}
                      alt="Media"
                      className="w-6 h-6 rounded object-cover"
                    />
                  ) : (
                    <FlatIcon name="tv" className="w-3.5 h-3.5" />
                  )}
                  <span className="truncate max-w-[110px]">{m.namaFile}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setLampiranMedia((prev) =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                    className="cursor-pointer ml-1 text-[#EF4444]"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-1.5">
            <label
              title="Lampirkan Foto atau Video"
              className="cursor-pointer w-10 h-10 rounded-xl bg-white hover:bg-[#F4F5F7] border border-[#E2E8F0] text-[#14141F] flex items-center justify-center shrink-0 transition"
            >
              <FlatIcon name="paperclip" className="w-4 h-4" />
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handlePilihMediaUpload}
                className="hidden"
              />
            </label>

            {/* Kotak Textbox Tanpa Jeda Kosong: Teks penuh di kiri, ikon rapat di kolom kanan */}
            <div className="flex-1 min-w-0 flex items-end gap-1 bg-white rounded-xl border border-[#14141F] pl-2.5 pr-1.5 py-1">
              <textarea
                ref={textareaInputRef}
                rows={1}
                value={pesanInput}
                onChange={(e) => setPesanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleKirimPesanKeBot();
                  }
                }}
                placeholder={
                  isRecordingMic
                    ? "Mic ON: Silakan bicara..."
                    : "Tulis pesan atau ide konten..."
                }
                className={`flex-1 min-w-0 bg-transparent text-[16px] sm:text-sm text-[#14141F] placeholder:text-[#64748B] focus:outline-none resize-none leading-5 overflow-y-auto py-0.5 ${
                  isExpandedTextbox ? "max-h-[280px]" : "max-h-[190px]"
                }`}
              />

              <div className="flex flex-col items-center justify-between self-stretch shrink-0 py-0.5 gap-1">
                {(pesanInput.length > 35 ||
                  pesanInput.includes("\n") ||
                  isExpandedTextbox) ? (
                  <button
                    type="button"
                    onClick={() => setIsExpandedTextbox(!isExpandedTextbox)}
                    title={
                      isExpandedTextbox
                        ? "Kecilkan Kotak Teks"
                        : "Perluas Kotak Teks"
                    }
                    className="cursor-pointer w-6 h-6 rounded-md bg-[#F4F5F7] hover:bg-[#E2E8F0] text-[#14141F] flex items-center justify-center"
                  >
                    <FlatIcon
                      name={isExpandedTextbox ? "minimize" : "expand"}
                      className="w-3 h-3"
                    />
                  </button>
                ) : (
                  <span className="w-6 h-1" />
                )}

                <button
                  type="button"
                  onClick={handleToggleVoiceNoteInput}
                  title={
                    isRecordingMic
                      ? "Klik untuk Off Record"
                      : "Klik untuk Voice Note (Menyambung Teks)"
                  }
                  className={`cursor-pointer w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                    isRecordingMic
                      ? "bg-[#EF4444] text-white animate-pulse"
                      : isTranscribingMic
                      ? "bg-[#D4F34A] text-[#14141F]"
                      : "text-[#14141F] hover:bg-[#F4F5F7]"
                  }`}
                >
                  <FlatIcon name="mic" className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={isSendingChat}
              onClick={() => handleKirimPesanKeBot()}
              aria-label="Kirim Pesan"
              className="cursor-pointer w-10 h-10 rounded-xl bg-[#D4F34A] hover:bg-[#C5E738] text-[#14141F] flex items-center justify-center shrink-0 active:scale-95 transition disabled:opacity-50"
            >
              <FlatIcon name="arrowUp" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}