"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FlatIcon, StoryVoiceInput } from "../components/SharedUI";
import AuthFullscreen from "../components/AuthFullscreen";
import PersonaDNAView from "../components/PersonaDNAView";
import ScriptProducerView from "../components/ScriptProducerView";
import VideoExtractorView from "../components/VideoExtractorView";
import DeveloperDashboardView from "../components/DeveloperDashboardView";

const SEPULUH_BENTUK_KONTEN = [
  {
    id: 1,
    nama: "B-Roll Estetik + Teks di Layar (Tanpa Ngomong & Tanpa Wajah)",
    modeDefault: "teks",
    ket: "Cukup rekam suasana/aktivitas, cerita disampaikan 100% lewat teks di layar.",
  },
  {
    id: 2,
    nama: "POV Tangan / Meja + Suara AI TikTok (Tanpa Wajah)",
    modeDefault: "voiceover",
    ket: "Kamera menyorot tangan di meja, naskah dibacakan suara otomatis/voiceover.",
  },
  {
    id: 3,
    nama: "B-Roll Aktivitas + Voiceover Santai (Rekam Suara Belakangan)",
    modeDefault: "voiceover",
    ket: "Rekam kegiatan harianmu dulu, lalu baca naskah santai dari balik layar.",
  },
  {
    id: 4,
    nama: "Talking Head + Teleprompter (Ngobrol Langsung ke Kamera)",
    modeDefault: "voiceover",
    ket: "Tampil wajah percaya diri membaca layar teleprompter Hookya.",
  },
  {
    id: 5,
    nama: "ASMR / Suara Asli Aktivitas + Teks Pendek (Tanpa Bicara)",
    modeDefault: "teks",
    ket: "Tonjolkan suara asli (ketikan, masakan, buka paket) dengan teks singkat.",
  },
  {
    id: 6,
    nama: "Green Screen Reaksi / Komentar Tren & Fakta Unik",
    modeDefault: "voiceover",
    ket: "Tampilkan tangkapan layar artikel/tren di belakangmu lalu berikan opini.",
  },
  {
    id: 7,
    nama: "Vlog Mini Keseharian (A Day in My Life 20 Detik)",
    modeDefault: "voiceover",
    ket: "Gabungan 5-6 klip pendek kegiatanmu dari pagi/malam dengan cerita mengalir.",
  },
  {
    id: 8,
    nama: "Tutorial Layar HP / Laptop (Screen Recording)",
    modeDefault: "voiceover",
    ket: "Rekam layar HP/Laptop saat membagikan tips aplikasi, desain, atau website.",
  },
  {
    id: 9,
    nama: "Sketsa POV Situasi Relatable + Musik Trending",
    modeDefault: "teks",
    ket: "Peragakan ekspresi singkat (1 orang) dengan teks situasi yang sering dialami orang.",
  },
  {
    id: 10,
    nama: "Slide Foto / Carousel Cerita Bergambar (Geser Foto)",
    modeDefault: "teks",
    ket: "Tidak perlu rekam video! Cukup susun 6 foto berurutan dengan teks cerita.",
  },
];

const DEFAULT_PERSONA_PROFILE = {
  user_id: "usr_99281",
  persona_summary:
    "Gaya bicara jujur, santai, namun peduli seperti kakak senior atau teman dekat yang sedang berbagi pengalaman nyata.",
  archetype: {
    primary: "Teman Diskusi Jujur",
    secondary: "Praktisi Berpengalaman",
    authority_stance: "Berbicara dari pengalaman nyata sehari-hari.",
  },
  linguistic_matrix: {
    self_pronoun: "Gue",
    audience_pronoun: "Lo / Kalian",
    greeting_signature: ["Gini bro,", "Jujur ya,", "Coba pikir deh,"],
    favorite_transitions: [
      "Masalahnya gini,",
      "Nah, lucunya adalah...",
      "Intinya simpel:",
    ],
    signature_vocabulary: ["boncos", "valid", "mindset", "eksekusi"],
    forbidden_words: [
      "Anda",
      "Pemirsa",
      "Oleh karena itu",
      "Selain itu",
      "Di era digital saat ini",
      "Kesimpulannya",
    ],
  },
};

export default function HookyaMainApp() {
  const [viewMode, setViewMode] = useState("auth"); // 'auth' | 'user' | 'dev'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopMinimized, setDesktopMinimized] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [activeMenu, setActiveMenu] = useState("produksi");

  const [showPinModal, setShowPinModal] = useState(false);
  const [inputPinDev, setInputPinDev] = useState("");
  const [pinAdminResmi, setPinAdminResmi] = useState("123456");
  const [logoClickCount, setLogoClickCount] = useState(0);

  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [coins, setCoins] = useState(120);
  const [paket, setPaket] = useState("Paket Pemula");
  const [toastMsg, setToastMsg] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const [profil, setProfil] = useState({
    nama: "Kreator",
    username: "",
    kontak: "kreator@gmail.com",
    avatar_url: "",
    usia: "28",
    gender: "Laki-laki",
    peranSaatIni: "Praktisi Bisnis & Kreator Digital",
    kepribadianSosial:
      "Santai, jujur, dan peduli seperti kakak senior di warung kopi",
    minatUtama: "Bisnis, Keuangan Praktis, Teknologi & Olahraga",
    lingkunganRekam: "Kamar / Meja Kerja di Dalam Ruangan",
    waktuFree: "Malam (20:00 - 21:30)",
    selfPronounInput: "Gue",
    audiencePronounInput: "Lo / Kalian",
    prinsipUtamaInput: "Praktik lebih penting dari teori",
    opiniKontraInput: "Kurang suka motivasi kosong tanpa langkah nyata",
  });

  // State Form Usulan Pengembangan & Komplain User
  const [formUsulan, setFormUsulan] = useState({
    kategori: "Usulan Fitur Baru",
    pesan: "",
  });
  const [riwayatUsulanSaya, setRiwayatUsulanSaya] = useState([]);
  const [isSendingUsulan, setIsSendingUsulan] = useState(false);

  const [jadwalFleksibel, setJadwalFleksibel] = useState(false);
  const [jadwalCeklis, setJadwalCeklis] = useState({
    pagi: { aktif: false, mulai: "06:00", selesai: "08:00" },
    siang: { aktif: false, mulai: "12:00", selesai: "14:00" },
    sore: { aktif: false, mulai: "16:00", selesai: "17:30" },
    malam: { aktif: true, mulai: "20:00", selesai: "21:30" },
  });

  useEffect(() => {
    if (jadwalFleksibel) {
      setProfil((prev) => ({
        ...prev,
        waktuFree: "Saya Fleksibel (Bisa Kapan Saja)",
      }));
      return;
    }
    const aktifList = [];
    if (jadwalCeklis.pagi.aktif)
      aktifList.push(
        `Pagi (${jadwalCeklis.pagi.mulai}-${jadwalCeklis.pagi.selesai})`
      );
    if (jadwalCeklis.siang.aktif)
      aktifList.push(
        `Siang (${jadwalCeklis.siang.mulai}-${jadwalCeklis.siang.selesai})`
      );
    if (jadwalCeklis.sore.aktif)
      aktifList.push(
        `Sore (${jadwalCeklis.sore.mulai}-${jadwalCeklis.sore.selesai})`
      );
    if (jadwalCeklis.malam.aktif)
      aktifList.push(
        `Malam (${jadwalCeklis.malam.mulai}-${jadwalCeklis.malam.selesai})`
      );

    setProfil((prev) => ({
      ...prev,
      waktuFree: aktifList.length > 0 ? aktifList.join(", ") : "Fleksibel",
    }));
  }, [jadwalFleksibel, jadwalCeklis]);

  const [rawWritingSamples, setRawWritingSamples] = useState(
    "Gini bro, jujur ya banyak banget yang boncos gara-gara cuma modal semangat doang tapi eksekusinya ngaco. Intinya simpel: benerin dulu fondasinya baru jalan."
  );
  const [personaProfile, setPersonaProfile] = useState(DEFAULT_PERSONA_PROFILE);
  const [bentukKonten, setBentukKonten] = useState(
    SEPULUH_BENTUK_KONTEN[3].nama
  );
  const [deskripsiBentukSendiri, setDeskripsiBentukSendiri] = useState("");
  const bentukKontenFinal = deskripsiBentukSendiri.trim()
    ? `${bentukKonten} — Catatan: ${deskripsiBentukSendiri.trim()}`
    : bentukKonten;

  const [daftar10IdeTopik, setDaftar10IdeTopik] = useState([
    {
      judul: "Menabung di Akhir Bulan Adalah Jebakan Psikologis",
      nuansa: "Membongkar Mitos",
      ringkasan: "Kenapa menunggu uang sisa di akhir bulan selalu gagal.",
    },
    {
      judul: "Kesalahan Memulai Usaha Tanpa Menghitung Arus Kas",
      nuansa: "Kesalahan Umum",
      ringkasan: "Cerita nyata kenapa omzet ramai tapi tabungan kosong.",
    },
    {
      judul: "Berhenti Menunggu Mood, Bangun Rutinitas 15 Menit",
      nuansa: "Tips Praktis",
      ringkasan: "Langkah kecil yang konsisten mengalahkan niat besar.",
    },
  ]);

  const [stage, setStage] = useState(0);
  const [hasilSkrip, setHasilSkrip] = useState(null);
  const [modeTampilanSkrip, setModeTampilanSkrip] = useState("voiceover");
  const [modeTeleprompter, setModeTeleprompter] = useState(false);

  const [koleksiSkripTersimpan, setKoleksiSkripTersimpan] = useState([]);
  const [semuaSkripAdmin, setSemuaSkripAdmin] = useState([]);
  const [formKinerja, setFormKinerja] = useState({});
  const [semuaUserDB, setSemuaUserDB] = useState([]);
  const [daftarTransaksi, setDaftarTransaksi] = useState([]);

  const [checkoutModal, setCheckoutModal] = useState(null);
  const [sedangProsesBayar, setSedangProsesBayar] = useState(false);
  const [inputKodeVoucherUser, setInputKodeVoucherUser] = useState("");

  const [pengaturanPayment, setPengaturanPayment] = useState({
    modeVerifikasi: "otomatis",
    namaMerchant: "HOOKYA OFFICIAL",
    infoRekening: "BCA / SeaBank / GoPay / DANA a.n Admin Hookya",
    qrisImageUrl: "",
    duitkuMerchantCode: "",
    duitkuApiKey: "",
    duitkuIsProduction: false,
  });

  const [daftarVoucher, setDaftarVoucher] = useState([
    { kode: "HOOKYA100", koin: 100, kuota: 50, terpakai: 0 },
    { kode: "GRATIS50", koin: 50, kuota: 100, terpakai: 0 },
  ]);

  const [customPrompts, setCustomPrompts] = useState({
    persona_engine: "Ekstrak sapaan dan kosakata khas pengguna dengan akurat.",
    assessment_copilot: "Berikan 3 pilihan sudut pandang yang tajam.",
    script_humanizer:
      "Tulis dengan bahasa lisan yang mengalir alami saat diucapkan.",
  });

  // Menghasilkan Avatar Default berbasis Gmail / Nama Lengkap jika user belum upload foto custom
  const getAvatarUrlUser = () => {
    if (profil.avatar_url && profil.avatar_url.trim() !== "") {
      return profil.avatar_url;
    }
    const namaBersih = encodeURIComponent(
      profil.nama || profil.kontak || "User"
    );
    return `https://ui-avatars.com/api/?name=${namaBersih}&background=d4f34a&color=14141f&bold=true&size=128`;
  };

  // Handler Upload Foto Profil Custom dari HP/Laptop
  const handleUploadAvatarCustom = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 160;
        canvas.height = 160;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, 160, 160);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

        setProfil((prev) => ({ ...prev, avatar_url: dataUrl }));
        if (userId) {
          await supabase
            .from("users")
            .update({
              avatar_url: dataUrl,
              profil_dna: { ...profil, avatar_url: dataUrl },
            })
            .eq("id", userId);
        }
        showToast("Foto profil kamu berhasil diperbarui!");
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const muatUlangDataSupabase = async (idTarget) => {
    try {
      const { data: userRows } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: true });

      let activeUser = null;

      if (userRows) {
        setSemuaUserDB(userRows);
        const savedId =
          idTarget ||
          (typeof window !== "undefined"
            ? localStorage.getItem("hookya_active_user_id")
            : null);

        activeUser = userRows.find((u) => u.id === savedId);

        const adminRow =
          userRows.find((u) => u.role === "admin") || userRows[0];
        if (adminRow?.profil_dna) {
          if (Array.isArray(adminRow.profil_dna.daftarVoucher)) {
            setDaftarVoucher(adminRow.profil_dna.daftarVoucher);
          }
          if (adminRow.profil_dna.pengaturanPayment) {
            setPengaturanPayment(adminRow.profil_dna.pengaturanPayment);
          }
          if (adminRow.profil_dna.pinAdminResmi) {
            setPinAdminResmi(adminRow.profil_dna.pinAdminResmi);
          }
          if (adminRow.profil_dna.customPrompts) {
            setCustomPrompts(adminRow.profil_dna.customPrompts);
          }
        }

        if (activeUser) {
          setUserId(activeUser.id);
          setUserRole(
            activeUser.role ||
              (activeUser.id === userRows[0]?.id ? "admin" : "user")
          );
          setCoins(activeUser.koin ?? 120);
          setProfil((prev) => ({
            ...prev,
            ...(activeUser.profil_dna || {}),
            nama: activeUser.nama || prev.nama,
            username:
              activeUser.username ||
              activeUser.profil_dna?.username ||
              prev.username,
            kontak:
              activeUser.email ||
              activeUser.profil_dna?.kontak ||
              prev.kontak,
            avatar_url:
              activeUser.avatar_url ||
              activeUser.profil_dna?.avatar_url ||
              prev.avatar_url,
          }));
          if (activeUser.profil_dna?.rawWritingSamples) {
            setRawWritingSamples(activeUser.profil_dna.rawWritingSamples);
          }
          if (activeUser.profil_dna?.personaProfile) {
            setPersonaProfile(activeUser.profil_dna.personaProfile);
          }
          if (activeUser.profil_dna?.bentukKonten) {
            setBentukKonten(activeUser.profil_dna.bentukKonten);
          }
          setViewMode("user");
        }
      }

      const { data: scriptRows } = await supabase
        .from("scripts")
        .select("*")
        .order("created_at", { ascending: false });

      if (scriptRows) {
        const formatBarisSkrip = (row) => ({
          id: row.id,
          dbId: row.id,
          userId: row.user_id,
          judul: row.judul,
          kategori: row.kategori,
          bentuk: row.bentuk_konten,
          waktuDibuat:
            row.segmen_skrip?.meta?.waktuDibuat ||
            new Date(row.created_at).toLocaleDateString("id-ID"),
          segmen: Array.isArray(row.segmen_skrip)
            ? row.segmen_skrip
            : row.segmen_skrip?.segmen || [],
          sudahUpload: Boolean(row.segmen_skrip?.meta?.sudahUpload),
          tanggalUpload: row.segmen_skrip?.meta?.tanggalUpload || "",
          views: row.segmen_skrip?.meta?.views ?? null,
          likes: row.segmen_skrip?.meta?.likes ?? null,
          komen: row.segmen_skrip?.meta?.komen ?? null,
          sudahEvaluasi: Boolean(row.segmen_skrip?.meta?.sudahEvaluasi),
          evaluasiAI: row.segmen_skrip?.meta?.evaluasiAI || "",
        });

        const semuaTerformat = scriptRows.map(formatBarisSkrip);
        setSemuaSkripAdmin(semuaTerformat);

        const idAktifSekarang = activeUser?.id || idTarget;
        if (idAktifSekarang) {
          setKoleksiSkripTersimpan(
            semuaTerformat.filter((s) => s.userId === idAktifSekarang)
          );
        }
      }

      // Muat riwayat usulan milik user aktif
      const idAktifFb = activeUser?.id || idTarget;
      if (idAktifFb) {
        const { data: fbUser } = await supabase
          .from("feedbacks")
          .select("*")
          .eq("user_id", idAktifFb)
          .order("created_at", { ascending: false });
        if (fbUser) setRiwayatUsulanSaya(fbUser);
      }

      const { data: trxRows } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (trxRows) setDaftarTransaksi(trxRows);
    } catch {
      // Abaikan
    }
  };

  useEffect(() => {
    muatUlangDataSupabase();
  }, []);

  const updateKoinDatabase = async (koinBaru, targetUserId = userId) => {
    if (targetUserId === userId) setCoins(koinBaru);
    setSemuaUserDB((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, koin: koinBaru } : u))
    );
    if (!targetUserId) return;
    await supabase
      .from("users")
      .update({ koin: koinBaru })
      .eq("id", targetUserId);
  };

  const simpanPersonaKeSupabase = async (personaTerbaru = personaProfile) => {
    if (!userId) return;
    await supabase
      .from("users")
      .update({
        nama: profil.nama,
        avatar_url: profil.avatar_url,
        profil_dna: {
          ...profil,
          jadwalFleksibel,
          jadwalCeklis,
          rawWritingSamples,
          personaProfile: personaTerbaru,
          bentukKonten,
          deskripsiBentukSendiri,
          customPrompts,
          daftarVoucher,
          pengaturanPayment,
          pinAdminResmi,
        },
      })
      .eq("id", userId);
  };

  const simpanAtauUpdateSkripDatabase = async (skripObj) => {
    const payloadSegmen = {
      segmen: skripObj.segmen,
      meta: {
        waktuDibuat: skripObj.waktuDibuat,
        sudahUpload: skripObj.sudahUpload,
        tanggalUpload: skripObj.tanggalUpload,
        views: skripObj.views,
        likes: skripObj.likes,
        komen: skripObj.komen,
        sudahEvaluasi: skripObj.sudahEvaluasi,
        evaluasiAI: skripObj.evaluasiAI,
      },
    };
    try {
      if (skripObj.dbId) {
        await supabase
          .from("scripts")
          .update({
            judul: skripObj.judul,
            bentuk_konten: skripObj.bentuk,
            segmen_skrip: payloadSegmen,
          })
          .eq("id", skripObj.dbId);
        return skripObj;
      } else {
        const { data } = await supabase
          .from("scripts")
          .insert([
            {
              user_id: userId,
              judul: skripObj.judul,
              kategori: skripObj.kategori,
              bentuk_konten: skripObj.bentuk,
              segmen_skrip: payloadSegmen,
            },
          ])
          .select()
          .single();
        if (data?.id)
          return { ...skripObj, id: data.id, dbId: data.id, userId };
      }
    } catch {
      // Fallback
    }
    return skripObj;
  };

  // Handler Kirim Usulan Pengembangan / Komplain ke Dashboard Developer
  const handleKirimUsulanUser = async (e) => {
    e.preventDefault();
    if (!formUsulan.pesan.trim()) {
      alert("Silakan tuliskan usulan atau keluhanmu terlebih dahulu.");
      return;
    }
    setIsSendingUsulan(true);
    try {
      const payload = {
        user_id: userId,
        nama_user: profil.nama,
        email_user: profil.kontak,
        kategori: formUsulan.kategori,
        pesan: formUsulan.pesan.trim(),
        status: "baru",
      };
      const { data, error } = await supabase
        .from("feedbacks")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;

      setRiwayatUsulanSaya([
        data || { ...payload, id: Date.now(), created_at: new Date() },
        ...riwayatUsulanSaya,
      ]);
      setFormUsulan({ ...formUsulan, pesan: "" });
      showToast(
        "Terima kasih! Usulan/masukan kamu telah dikirim langsung ke Dashboard Developer."
      );
    } catch (err) {
      showToast("Gagal mengirim usulan: " + err.message);
    } finally {
      setIsSendingUsulan(false);
    }
  };

  // Handler Pembelian Paket Koin via Duitku Payment Gateway
  const bukaLayarCheckoutPaket = async (paketObj) => {
    const kodeUnik = Math.floor(101 + Math.random() * 890);
    const nomorInvoice = `INV-${Date.now().toString().slice(-6)}`;

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_gateway_invoice",
          invoiceId: nomorInvoice,
          userId,
          namaUser: profil.nama,
          emailUser: profil.kontak,
          namaPaket: paketObj.nama,
          jumlahKoin: paketObj.koin,
          nominal: paketObj.nominalAngka,
          duitkuConfigClient: {
            merchantCode: pengaturanPayment.duitkuMerchantCode,
            apiKey: pengaturanPayment.duitkuApiKey,
            isProduction: pengaturanPayment.duitkuIsProduction,
          },
        }),
      });
      const data = await res.json();
      if (data.mode === "duitku" && data.redirectUrl) {
        window.open(data.redirectUrl, "_blank");
      }
    } catch {
      // Lanjut buka modal QRIS
    }

    setCheckoutModal({
      invoiceId: nomorInvoice,
      namaPaket: paketObj.nama,
      koin: paketObj.koin,
      nominalAsli: paketObj.nominalAngka,
      kodeUnik,
      nominalBayar: paketObj.nominalAngka + kodeUnik,
    });
  };

  const handleKonfirmasiSudahBayar = async () => {
    if (!checkoutModal) return;
    setSedangProsesBayar(true);
    const statusAwal =
      pengaturanPayment.modeVerifikasi === "otomatis" ? "lunas" : "pending";

    const trxBaru = {
      invoice_id: checkoutModal.invoiceId,
      user_id: userId,
      nama_user: profil.nama,
      nama_paket: checkoutModal.namaPaket,
      jumlah_koin: checkoutModal.koin,
      nominal_asli: checkoutModal.nominalAsli,
      nominal_bayar: checkoutModal.nominalBayar,
      metode_bayar: "Duitku / QRIS",
      status: statusAwal,
    };

    try {
      const { data } = await supabase
        .from("transactions")
        .insert([trxBaru])
        .select()
        .single();
      setDaftarTransaksi([
        data || { ...trxBaru, id: Date.now() },
        ...daftarTransaksi,
      ]);
      if (statusAwal === "lunas") {
        await updateKoinDatabase(coins + checkoutModal.koin);
        setPaket(checkoutModal.namaPaket);
        showToast(
          `Pembayaran terverifikasi! +${checkoutModal.koin} Koin berhasil ditambahkan.`
        );
      } else {
        showToast(
          "Konfirmasi pembayaran diterima dan sedang diverifikasi Admin."
        );
      }
    } finally {
      setSedangProsesBayar(false);
      setCheckoutModal(null);
    }
  };

  const handleKlaimVoucherUser = async () => {
    const kodeBersih = inputKodeVoucherUser.trim().toUpperCase();
    if (!kodeBersih) return;
    const ditemukan = daftarVoucher.find(
      (v) => v.kode.toUpperCase() === kodeBersih
    );
    if (!ditemukan || ditemukan.terpakai >= ditemukan.kuota) {
      alert("Kode voucher tidak ditemukan atau kuota sudah habis.");
      return;
    }
    const tambahan = parseInt(ditemukan.koin) || 50;
    await updateKoinDatabase(coins + tambahan);
    setDaftarVoucher(
      daftarVoucher.map((v) =>
        v.kode.toUpperCase() === kodeBersih
          ? { ...v, terpakai: v.terpakai + 1 }
          : v
      )
    );
    setInputKodeVoucherUser("");
    showToast(`Voucher berhasil diklaim! +${tambahan} Koin ditambahkan.`);
  };

  const handleToggleSudahUpload = async (item, checked) => {
    const tglDefault = checked
      ? item.tanggalUpload || new Date().toISOString().split("T")[0]
      : "";
    const updated = {
      ...item,
      sudahUpload: checked,
      tanggalUpload: tglDefault,
    };
    setKoleksiSkripTersimpan((prev) =>
      prev.map((s) => (s.id === item.id ? updated : s))
    );
    await simpanAtauUpdateSkripDatabase(updated);
  };

  const handleKirimLaporanKinerjaVT = async (item) => {
    const input = formKinerja[item.id] || {};
    const views = parseInt(input.views ?? item.views ?? 0) || 0;
    const likes = parseInt(input.likes ?? item.likes ?? 0) || 0;
    const komen = parseInt(input.komen ?? item.komen ?? 0) || 0;

    setIsGenerating(true);
    let catatanEvaluasi = `Dalam sepekan, konten ini meraih ${views} views, ${likes} like, dan ${komen} komentar.`;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluasi_kinerja_vt",
          userId,
          namaUser: profil.nama,
          dataKinerja: {
            judul: item.judul,
            waktuDibuat: item.waktuDibuat,
            tanggalUpload: item.tanggalUpload,
            views,
            likes,
            komen,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.evaluasiAI) catatanEvaluasi = data.evaluasiAI;
    } catch {
      // Fallback
    }

    const updated = {
      ...item,
      sudahUpload: true,
      tanggalUpload:
        item.tanggalUpload || new Date().toISOString().split("T")[0],
      views,
      likes,
      komen,
      sudahEvaluasi: true,
      evaluasiAI: catatanEvaluasi,
    };

    setKoleksiSkripTersimpan((prev) =>
      prev.map((s) => (s.id === item.id ? updated : s))
    );
    await simpanAtauUpdateSkripDatabase(updated);
    if (!item.sudahEvaluasi) await updateKoinDatabase(coins + 2);
    setIsGenerating(false);
    showToast("Laporan kinerja disimpan & bonus +2 Koin ditambahkan!");
  };

  const isAdminAccount =
    userRole === "admin" ||
    profil.nama?.toLowerCase().includes("faqih") ||
    profil.nama?.toLowerCase().includes("qih") ||
    profil.nama?.toLowerCase().includes("admin") ||
    profil.username?.toLowerCase() === "paqijoe";

  const jumlahMenungguLaporan = koleksiSkripTersimpan.filter(
    (s) => s.sudahUpload && !s.sudahEvaluasi
  ).length;

  // ============================================================================
  // 1. LAYAR LOGIN & PENDAFTARAN FULLSCREEN
  // ============================================================================
  if (viewMode === "auth") {
    return (
      <AuthFullscreen
        onNotify={showToast}
        onAuthSuccess={async (userRow) => {
          if (userRow?.id) {
            if (typeof window !== "undefined") {
              localStorage.setItem("hookya_active_user_id", userRow.id);
            }
            await muatUlangDataSupabase(userRow.id);
          }
          setViewMode("user");
        }}
      />
    );
  }

  // ============================================================================
  // 2. LAYAR DASHBOARD DEVELOPER TERPISAH
  // ============================================================================
  if (viewMode === "dev") {
    return (
      <DeveloperDashboardView
        onSwitchToUserView={() => setViewMode("user")}
        semuaUserDB={semuaUserDB}
        daftarTransaksi={daftarTransaksi}
        koleksiSkripTersimpan={
          semuaSkripAdmin.length > 0 ? semuaSkripAdmin : koleksiSkripTersimpan
        }
        pengaturanPayment={pengaturanPayment}
        setPengaturanPayment={setPengaturanPayment}
        pinAdminResmi={pinAdminResmi}
        setPinAdminResmi={setPinAdminResmi}
        daftarVoucher={daftarVoucher}
        setDaftarVoucher={setDaftarVoucher}
        customPrompts={customPrompts}
        setCustomPrompts={setCustomPrompts}
        updateKoinDatabase={updateKoinDatabase}
        handleApproveTransaksiAdmin={async (trx) => {
          await supabase
            .from("transactions")
            .update({ status: "lunas" })
            .eq("id", trx.id);
          const u = semuaUserDB.find((x) => x.id === trx.user_id);
          await updateKoinDatabase(
            (u?.koin || 0) + (trx.jumlah_koin || 0),
            trx.user_id || userId
          );
          setDaftarTransaksi(
            daftarTransaksi.map((t) =>
              t.id === trx.id ? { ...t, status: "lunas" } : t
            )
          );
          showToast("Transaksi disetujui & koin berhasil dikirim!");
        }}
        simpanPengaturanDevKeDB={() => {
          simpanPersonaKeSupabase(personaProfile);
          showToast("Seluruh pengaturan manajerial & Duitku disimpan!");
        }}
        muatUlangDataSupabase={muatUlangDataSupabase}
        showToast={showToast}
      />
    );
  }

  // ============================================================================
  // 3. LAYAR DASHBOARD PENGGUNA
  // ============================================================================
  const daftarMenuUser = [
    { id: "dna", label: "Profil & Gaya Bicara", icon: "dna" },
    { id: "produksi", label: "Buat Skrip Konten", icon: "bolt" },
    { id: "rewrite", label: "Ekstrak Video ke Skrip", icon: "scissors" },
    {
      id: "tersimpan",
      label: "Skrip & Status Upload",
      icon: "bookmark",
      badge: koleksiSkripTersimpan.length,
    },
    {
      id: "rapor",
      label: "Laporan Kinerja VT",
      icon: "chart",
      badge: jumlahMenungguLaporan,
    },
    { id: "topup", label: "Paket Koin & Voucher", icon: "coin" },
    { id: "usulan", label: "Usulan Pengembangan", icon: "code" },
  ];

  const daftarPaketKoin = [
    {
      nama: "Paket Coba",
      harga: "Rp5.000",
      nominalAngka: 5000,
      koin: 50,
      ket: "Cocok untuk mencoba fitur dasar.",
    },
    {
      nama: "Paket Pemula",
      harga: "Rp10.000",
      nominalAngka: 10000,
      koin: 120,
      ket: "Untuk mulai rutin membuat konten mingguan.",
    },
    {
      nama: "Paket Kreator (Terlaris)",
      harga: "Rp25.000",
      nominalAngka: 25000,
      koin: 400,
      ket: "Kuota melimpah untuk kreator aktif.",
      populer: true,
    },
    {
      nama: "Paket Produser VIP",
      harga: "Rp99.000",
      nominalAngka: 99000,
      koin: 3000,
      ket: "Akses maksimal tanpa batas.",
    },
  ];

  // Komponen Kartu Foto Profil Gmail + Nama Lengkap + Email di atas tombol Keluar pada Sidebar
  const renderSidebarUserCard = (isCompact = false) => (
    <div className="pt-4 mt-4 border-t border-white/10 space-y-2.5 w-full">
      {!isCompact && (
        <div className="bg-white/5 p-3 rounded-2xl border border-white/10 flex items-center gap-3">
          <label
            className="cursor-pointer relative shrink-0 group"
            title="Klik untuk ganti foto profil custom"
          >
            <img
              src={getAvatarUrlUser()}
              alt={profil.nama}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#d4f34a]"
            />
            <span className="absolute -bottom-1 -right-1 bg-[#14141f] text-[#d4f34a] text-[9px] font-bold px-1 rounded border border-[#d4f34a]">
              Ubah
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadAvatarCustom}
              className="hidden"
            />
          </label>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">
              {profil.nama}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {profil.kontak || "kreator@gmail.com"}
            </div>
          </div>
        </div>
      )}

      {isAdminAccount && !isCompact && (
        <button
          type="button"
          onClick={() => {
            setSidebarOpen(false);
            setShowPinModal(true);
          }}
          className="cursor-pointer w-full bg-white/10 hover:bg-white/15 text-[#d4f34a] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
        >
          <FlatIcon name="code" className="w-4 h-4" />
          <span>Dashboard Developer</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          setSidebarOpen(false);
          if (typeof window !== "undefined") {
            localStorage.removeItem("hookya_active_user_id");
          }
          setViewMode("auth");
        }}
        className="cursor-pointer w-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold py-2.5 rounded-xl transition"
      >
        {isCompact ? "✕" : "Keluar / Ganti Akun"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#14141f] flex flex-col font-sans antialiased tracking-tight overflow-x-hidden w-full max-w-[100vw] pt-16">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#14141f] text-[#d4f34a] px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 border border-[#d4f34a]/40 max-w-md">
          <FlatIcon name="check" className="w-4 h-4 shrink-0" />
          <span className="font-normal text-white">{toastMsg}</span>
        </div>
      )}

      {/* =====================================================================
          HEADER FIXED STATIS (TIDAK IKUT BERGESER SAAT DI-SCROLL KE BAWAH)
          KIRI = BURGER | TENGAH = LOGO HOOKYA | KANAN = PROFIL + KOIN
      ===================================================================== */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-[#14141f] text-white px-3 sm:px-6 grid grid-cols-3 items-center shadow-md border-b border-white/10">
        {/* KIRI: Tombol Burger */}
        <div className="flex items-center justify-start">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setSidebarOpen((prev) => !prev);
              } else {
                setDesktopMinimized((prev) => !prev);
              }
            }}
            className="cursor-pointer w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#d4f34a] transition"
          >
            <FlatIcon name="menu" className="w-5 h-5" />
          </button>
        </div>

        {/* TENGAH: Logo Hookya */}
        <div
          onClick={() => {
            setActiveMenu("produksi");
            const hitunganBaru = logoClickCount + 1;
            if (hitunganBaru >= 5) {
              setLogoClickCount(0);
              setShowPinModal(true);
            } else {
              setLogoClickCount(hitunganBaru);
            }
          }}
          className="cursor-pointer flex items-center justify-center gap-2 select-none"
        >
          <div className="w-8 h-8 rounded-xl bg-[#d4f34a] flex items-center justify-center text-[#14141f] font-bold text-sm shrink-0">
            H
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight text-white">
            Hookya
          </span>
        </div>

        {/* KANAN: Profil User + Koin */}
        <div className="flex items-center justify-end">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfilePopup(!showProfilePopup)}
              className="cursor-pointer flex items-center gap-2 bg-white/10 hover:bg-white/15 pl-2 pr-2.5 py-1.5 rounded-full text-xs transition border border-white/15"
            >
              <img
                src={getAvatarUrlUser()}
                alt={profil.nama}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="font-bold text-white truncate max-w-20 sm:max-w-35">
                {profil.nama}
              </span>
              <span className="bg-[#d4f34a] text-[#14141f] font-bold px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                <FlatIcon name="coin" className="w-3 h-3" />
                <span>{coins}</span>
              </span>
            </button>

            {showProfilePopup && (
              <div className="absolute right-0 top-12 mt-2 w-80 bg-white text-[#14141f] rounded-3xl shadow-2xl border border-slate-200 p-5 z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={getAvatarUrlUser()}
                      alt={profil.nama}
                      className="w-10 h-10 rounded-full object-cover border border-slate-300"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm truncate">
                        {profil.nama}
                      </h4>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {profil.kontak}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProfilePopup(false)}
                    className="cursor-pointer w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfilePopup(false);
                      setActiveMenu("dna");
                    }}
                    className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold py-2.5 rounded-xl"
                  >
                    Edit Profil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfilePopup(false);
                      setActiveMenu("topup");
                    }}
                    className="cursor-pointer bg-[#d4f34a] text-[#14141f] text-xs font-bold py-2.5 rounded-xl"
                  >
                    + Isi Koin
                  </button>
                </div>

                {isAdminAccount && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfilePopup(false);
                      setShowPinModal(true);
                    }}
                    className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <FlatIcon name="code" className="w-4 h-4" />
                    <span>Buka Dashboard Developer</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowProfilePopup(false);
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("hookya_active_user_id");
                    }
                    setViewMode("auth");
                  }}
                  className="cursor-pointer w-full bg-[#f4f5f7] text-[#14141f] text-xs font-bold py-2.5 rounded-xl"
                >
                  Keluar / Ganti Akun
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row w-full max-w-full">
        {/* DRAWER SIDEBAR HP */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60"
            />
            <aside className="relative w-72 max-w-[82vw] bg-[#14141f] text-white h-full p-5 flex flex-col justify-between z-10 shadow-2xl overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                  <span className="text-base font-bold text-[#d4f34a]">
                    Menu Hookya
                  </span>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="cursor-pointer w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"
                  >
                    <FlatIcon name="close" className="w-4 h-4" />
                  </button>
                </div>
                <nav className="space-y-1.5 text-xs">
                  {daftarMenuUser.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveMenu(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition cursor-pointer ${
                        activeMenu === item.id
                          ? "bg-[#d4f34a] text-[#14141f] font-bold"
                          : "text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FlatIcon name={item.icon} className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge > 0 && (
                        <span className="bg-[#f3a88f] text-[#14141f] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* FOTO PROFIL GMAIL/CUSTOM + NAMA + EMAIL DI ATAS TOMBOL KELUAR */}
              {renderSidebarUserCard(false)}
            </aside>
          </div>
        )}

        {/* SIDEBAR DESKTOP */}
        <aside
          className={`hidden md:flex flex-col justify-between bg-[#14141f] text-white m-4 rounded-4xl p-4 shrink-0 shadow-xl transition-all duration-300 self-start sticky top-20 ${
            desktopMinimized ? "w-20 items-center" : "w-64"
          }`}
        >
          <nav className="space-y-1.5 text-xs w-full">
            {daftarMenuUser.map((item) => {
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center ${
                    desktopMinimized
                      ? "justify-center p-3.5"
                      : "justify-between px-4 py-3"
                  } rounded-2xl transition cursor-pointer ${
                    isActive
                      ? "bg-[#d4f34a] text-[#14141f] font-bold"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FlatIcon name={item.icon} className="w-5 h-5 shrink-0" />
                    {!desktopMinimized && <span>{item.label}</span>}
                  </div>
                  {!desktopMinimized && item.badge > 0 && (
                    <span className="bg-[#f3a88f] text-[#14141f] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* FOTO PROFIL GMAIL/CUSTOM + NAMA + EMAIL DI ATAS TOMBOL KELUAR */}
          {renderSidebarUserCard(desktopMinimized)}
        </aside>

        {/* AREA KONTEN UTAMA */}
        <main className="flex-1 min-w-0 w-full max-w-5xl p-3 sm:p-5 md:pl-0">
          {activeMenu === "dna" && (
            <PersonaDNAView
              userId={userId}
              profil={profil}
              setProfil={setProfil}
              jadwalFleksibel={jadwalFleksibel}
              setJadwalFleksibel={setJadwalFleksibel}
              jadwalCeklis={jadwalCeklis}
              setJadwalCeklis={setJadwalCeklis}
              rawWritingSamples={rawWritingSamples}
              setRawWritingSamples={setRawWritingSamples}
              personaProfile={personaProfile}
              setPersonaProfile={setPersonaProfile}
              bentukKonten={bentukKonten}
              setBentukKonten={setBentukKonten}
              deskripsiBentukSendiri={deskripsiBentukSendiri}
              setDeskripsiBentukSendiri={setDeskripsiBentukSendiri}
              SEPULUH_BENTUK_KONTEN={SEPULUH_BENTUK_KONTEN}
              setModeTampilanSkrip={setModeTampilanSkrip}
              simpanPersonaKeSupabase={simpanPersonaKeSupabase}
              setActiveMenu={setActiveMenu}
              showToast={showToast}
              customPrompts={customPrompts}
            />
          )}

          {activeMenu === "produksi" && (
            <ScriptProducerView
              userId={userId}
              namaUser={profil.nama}
              coins={coins}
              updateKoinDatabase={updateKoinDatabase}
              personaProfile={personaProfile}
              setPersonaProfile={setPersonaProfile}
              simpanPersonaKeSupabase={simpanPersonaKeSupabase}
              bentukKonten={bentukKonten}
              setBentukKonten={setBentukKonten}
              bentukKontenFinal={bentukKontenFinal}
              daftar10IdeTopik={daftar10IdeTopik}
              setDaftar10IdeTopik={setDaftar10IdeTopik}
              simpanAtauUpdateSkripDatabase={simpanAtauUpdateSkripDatabase}
              setKoleksiSkripTersimpan={setKoleksiSkripTersimpan}
              hasilSkrip={hasilSkrip}
              setHasilSkrip={setHasilSkrip}
              stage={stage}
              setStage={setStage}
              setActiveMenu={setActiveMenu}
              showToast={showToast}
              customPrompts={customPrompts}
              SEPULUH_BENTUK_KONTEN={SEPULUH_BENTUK_KONTEN}
              setModeTeleprompter={setModeTeleprompter}
              modeTampilanSkrip={modeTampilanSkrip}
              setModeTampilanSkrip={setModeTampilanSkrip}
            />
          )}

          {activeMenu === "rewrite" && (
            <VideoExtractorView
              userId={userId}
              namaUser={profil.nama}
              coins={coins}
              updateKoinDatabase={updateKoinDatabase}
              personaProfile={personaProfile}
              bentukKontenFinal={bentukKontenFinal}
              simpanAtauUpdateSkripDatabase={simpanAtauUpdateSkripDatabase}
              setKoleksiSkripTersimpan={setKoleksiSkripTersimpan}
              setActiveMenu={setActiveMenu}
              showToast={showToast}
            />
          )}

          {activeMenu === "tersimpan" && (
            <div className="bg-white p-5 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                    Daftar Skrip Tersimpan & Status Upload Konten
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Ceklis skrip yang sudah kamu rekam dan upload menjadi konten VT.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStage(0);
                    setActiveMenu("produksi");
                  }}
                  className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-4 py-2.5 rounded-xl"
                >
                  + Buat Skrip Baru
                </button>
              </div>

              {koleksiSkripTersimpan.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Belum ada skrip yang disimpan di akunmu.
                </p>
              ) : (
                koleksiSkripTersimpan.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-3xl bg-[#f4f5f7] border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs text-slate-500">
                          Dibuat pada: <strong>{item.waktuDibuat}</strong> •{" "}
                          {item.bentuk}
                        </span>
                        <h4 className="font-bold text-sm sm:text-base mt-0.5">
                          {item.judul}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setHasilSkrip(item);
                          setStage(5);
                          setActiveMenu("produksi");
                        }}
                        className="cursor-pointer bg-white border border-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl"
                      >
                        Buka & Edit Skrip
                      </button>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <label className="cursor-pointer flex items-center gap-2 text-xs font-bold">
                        <input
                          type="checkbox"
                          checked={Boolean(item.sudahUpload)}
                          onChange={(e) =>
                            handleToggleSudahUpload(item, e.target.checked)
                          }
                          className="w-4 h-4 accent-[#14141f]"
                        />
                        <span>Sudah Diupload Menjadi Konten VT</span>
                      </label>
                      {item.sudahUpload && (
                        <input
                          type="date"
                          value={item.tanggalUpload || ""}
                          onChange={(e) => {
                            const updated = {
                              ...item,
                              tanggalUpload: e.target.value,
                            };
                            setKoleksiSkripTersimpan((prev) =>
                              prev.map((s) => (s.id === item.id ? updated : s))
                            );
                            simpanAtauUpdateSkripDatabase(updated);
                          }}
                          className="bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeMenu === "rapor" && (
            <div className="bg-white p-5 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                  Laporan Kinerja VT Sepekan Setelah Upload (Bonus +2 Koin)
                </h2>
              </div>

              {koleksiSkripTersimpan.filter((s) => s.sudahUpload).length ===
              0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Belum ada skrip yang ditandai "Sudah Diupload".
                </p>
              ) : (
                koleksiSkripTersimpan
                  .filter((s) => s.sudahUpload)
                  .map((item) => {
                    const inputSaatIni = formKinerja[item.id] || {
                      views: item.views ?? "",
                      likes: item.likes ?? "",
                      komen: item.komen ?? "",
                    };

                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-3xl bg-[#f4f5f7] border border-slate-200 space-y-3"
                      >
                        <h4 className="font-bold text-sm">{item.judul}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <input
                            type="number"
                            value={inputSaatIni.views}
                            onChange={(e) =>
                              setFormKinerja({
                                ...formKinerja,
                                [item.id]: {
                                  ...inputSaatIni,
                                  views: e.target.value,
                                },
                              })
                            }
                            placeholder="Jumlah Views..."
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                          />
                          <input
                            type="number"
                            value={inputSaatIni.likes}
                            onChange={(e) =>
                              setFormKinerja({
                                ...formKinerja,
                                [item.id]: {
                                  ...inputSaatIni,
                                  likes: e.target.value,
                                },
                              })
                            }
                            placeholder="Jumlah Like..."
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                          />
                          <input
                            type="number"
                            value={inputSaatIni.komen}
                            onChange={(e) =>
                              setFormKinerja({
                                ...formKinerja,
                                [item.id]: {
                                  ...inputSaatIni,
                                  komen: e.target.value,
                                },
                              })
                            }
                            placeholder="Jumlah Komentar..."
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                          />
                          <button
                            type="button"
                            disabled={isGenerating}
                            onClick={() => handleKirimLaporanKinerjaVT(item)}
                            className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold text-xs py-2.5 rounded-xl"
                          >
                            Laporkan (+2 Koin)
                          </button>
                        </div>
                        {item.evaluasiAI && (
                          <p className="text-xs bg-white p-3 rounded-xl">
                            <strong>Evaluasi AI:</strong> {item.evaluasiAI}
                          </p>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {activeMenu === "topup" && (
            <div className="bg-white p-5 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold">
                  Pilih Paket Koin (Duitku / QRIS) & Klaim Voucher
                </h2>
                <div className="flex items-center gap-2 bg-[#f4f5f7] p-1.5 rounded-2xl border border-slate-200">
                  <input
                    type="text"
                    value={inputKodeVoucherUser}
                    onChange={(e) => setInputKodeVoucherUser(e.target.value)}
                    placeholder="Kode Voucher..."
                    className="bg-white rounded-xl px-3 py-2 text-xs font-bold uppercase outline-none w-36"
                  />
                  <button
                    type="button"
                    onClick={handleKlaimVoucherUser}
                    className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold px-3.5 py-2 rounded-xl"
                  >
                    Klaim
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {daftarPaketKoin.map((p) => (
                  <div
                    key={p.nama}
                    className={`p-5 rounded-3xl flex flex-col justify-between ${
                      p.populer
                        ? "bg-[#14141f] text-white shadow-xl"
                        : "bg-[#f4f5f7] text-[#14141f] border border-slate-200"
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-sm">{p.nama}</h3>
                      <div className="text-2xl font-bold mt-1">{p.harga}</div>
                      <span className="text-xs font-bold bg-[#d4f34a] text-[#14141f] px-2.5 py-0.5 rounded mt-2 inline-block">
                        {p.koin} Koin
                      </span>
                      <p className="text-xs opacity-80 mt-2">{p.ket}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => bukaLayarCheckoutPaket(p)}
                      className="cursor-pointer mt-5 w-full bg-[#d4f34a] text-[#14141f] font-bold text-xs py-3 rounded-xl"
                    >
                      Beli Paket ({p.harga})
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MENU 7: USULAN PENGEMBANGAN & KOMPLAIN APLIKASI */}
          {activeMenu === "usulan" && (
            <div className="bg-white p-5 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#14141f]">
                  Usulan Pengembangan & Laporan Kendala Aplikasi
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Punya ide fitur baru atau menemukan kendala saat menggunakan Hookya? Kirimkan masukanmu di bawah ini—pesanmu langsung masuk ke meja kerja Developer kami.
                </p>
              </div>

              <form onSubmit={handleKirimUsulanUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                    Kategori Masukan:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      "Usulan Fitur Baru",
                      "Laporan Bug / Kendala",
                      "Kritik & Saran Tampilan",
                    ].map((kat) => (
                      <button
                        key={kat}
                        type="button"
                        onClick={() =>
                          setFormUsulan({ ...formUsulan, kategori: kat })
                        }
                        className={`cursor-pointer py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                          formUsulan.kategori === kat
                            ? "bg-[#14141f] text-[#d4f34a] border-[#14141f]"
                            : "bg-[#f4f5f7] text-slate-600 border-transparent"
                        }`}
                      >
                        {kat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14141f] mb-1.5">
                    Tuliskan Usulan atau Keluhanmu Secara Detail:
                  </label>
                  <StoryVoiceInput
                    rows={4}
                    value={formUsulan.pesan}
                    onChange={(val) =>
                      setFormUsulan({ ...formUsulan, pesan: val })
                    }
                    placeholder="Ketik usulan pengembangan atau kendala yang kamu alami..."
                    onNotify={showToast}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingUsulan}
                  className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs sm:text-sm py-4 rounded-2xl"
                >
                  {isSendingUsulan
                    ? "Mengirim ke Developer..."
                    : "Kirim Usulan ke Developer Sekarang ➔"}
                </button>
              </form>

              {riwayatUsulanSaya.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold">
                    Riwayat Usulan & Tanggapan Developer
                  </h3>
                  {riwayatUsulanSaya.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{fb.kategori}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 font-bold">
                          Status: {fb.status}
                        </span>
                      </div>
                      <p className="text-slate-700">{fb.pesan}</p>
                      {fb.balasan_dev && (
                        <div className="bg-[#f2fce2] text-[#4d6b14] p-3 rounded-xl font-bold">
                          Balasan Developer: {fb.balasan_dev}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL CHECKOUT DUITKU / QRIS */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#14141f] w-full max-w-md rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold">
              Tagihan {checkoutModal.invoiceId} — {checkoutModal.namaPaket}
            </h3>
            <div className="bg-[#f4f5f7] p-4 rounded-2xl text-center space-y-2">
              {pengaturanPayment.qrisImageUrl ? (
                <img
                  src={pengaturanPayment.qrisImageUrl}
                  alt="QRIS Merchant"
                  className="w-44 h-44 mx-auto rounded-xl object-contain bg-white p-2 border border-slate-200"
                />
              ) : (
                <FlatIcon
                  name="qr"
                  className="w-24 h-24 mx-auto text-[#14141f]"
                />
              )}
              <div className="text-xl font-bold">
                Rp{checkoutModal.nominalBayar.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-slate-500">
                {pengaturanPayment.infoRekening}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCheckoutModal(null)}
                className="cursor-pointer w-1/3 bg-[#f4f5f7] font-bold text-xs py-3 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sedangProsesBayar}
                onClick={handleKonfirmasiSudahBayar}
                className="cursor-pointer flex-1 bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3 rounded-xl"
              >
                Saya Sudah Bayar ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PIN DEVELOPER */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#14141f] w-full max-w-sm rounded-3xl p-6 space-y-4 text-center">
            <h3 className="text-base font-bold">Masuk ke Mode Developer</h3>
            <input
              type="password"
              value={inputPinDev}
              onChange={(e) => setInputPinDev(e.target.value)}
              placeholder="PIN Admin..."
              className="w-full bg-[#f4f5f7] border border-slate-200 rounded-xl px-4 py-3 text-center text-sm font-bold outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="cursor-pointer w-1/3 bg-[#f4f5f7] font-bold text-xs py-3 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (inputPinDev === pinAdminResmi) {
                    setShowPinModal(false);
                    setInputPinDev("");
                    setViewMode("dev");
                  } else {
                    alert("PIN Admin salah.");
                  }
                }}
                className="cursor-pointer flex-1 bg-[#14141f] text-[#d4f34a] font-bold text-xs py-3 rounded-xl"
              >
                Buka Dashboard Dev
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TELEPROMPTER */}
      {modeTeleprompter && hasilSkrip && (
        <div className="fixed inset-0 bg-[#14141f]/95 z-50 flex flex-col justify-between p-6 text-white">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <span className="text-sm font-bold text-[#d4f34a]">
              Layar Teleprompter — {hasilSkrip.judul}
            </span>
            <button
              onClick={() => setModeTeleprompter(false)}
              className="cursor-pointer bg-white/10 px-4 py-2 rounded-xl text-xs font-bold"
            >
              ✕ Tutup
            </button>
          </div>
          <div className="max-w-2xl mx-auto my-auto space-y-6 text-center overflow-y-auto py-6">
            {hasilSkrip.segmen.map((s, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="text-xs text-[#d4f34a] font-bold">
                  {s.labelMini} — [{s.visual}]
                </div>
                <p className="text-xl sm:text-2xl font-bold leading-snug whitespace-pre-line">
                  {modeTampilanSkrip === "teks" ? s.teksLayar : s.voiceover}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}