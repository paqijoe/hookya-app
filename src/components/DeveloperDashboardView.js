"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FlatIcon } from "./SharedUI";

// Fungsi pembantu menghitung sisa hari masa aktif koin pengguna
function hitungSisaHariUser(expiredAtStr) {
  if (!expiredAtStr) return 30;
  const target = new Date(expiredAtStr).getTime();
  const sekarang = Date.now();
  const selisih = Math.ceil((target - sekarang) / (1000 * 60 * 60 * 24));
  return Math.max(0, selisih);
}

// Format nomor WA ke awalan 628 untuk wa.me
function formatNomorWA(nomor) {
  const bersih = (nomor || "").replace(/\D/g, "");
  if (!bersih) return "";
  if (bersih.startsWith("08")) return "62" + bersih.slice(1);
  if (bersih.startsWith("8")) return "62" + bersih;
  return bersih;
}

export default function DeveloperDashboardView({
  onSwitchToUserView,
  semuaUserDB,
  daftarTransaksi,
  koleksiSkripTersimpan,
  pengaturanPayment,
  setPengaturanPayment,
  pinAdminResmi,
  setPinAdminResmi,
  daftarVoucher,
  setDaftarVoucher,
  customPrompts,
  setCustomPrompts,
  updateKoinDatabase,
  handleApproveTransaksiAdmin,
  simpanPengaturanDevKeDB,
  muatUlangDataSupabase,
  showToast,
}) {
  const [devTab, setDevTab] = useState("overview");
  const [daftarErrorLog, setDaftarErrorLog] = useState([]);
  const [daftarUsulan, setDaftarUsulan] = useState([]);
  const [balasanInput, setBalasanInput] = useState({});
  const [previewBuktiImg, setPreviewBuktiImg] = useState(null);

  // Filter Manajemen 10.000 User & Filter Transaksi
  const [filterUserMode, setFilterUserMode] = useState("semua"); // 'semua' | 'h3_hangus' | 'sudah_hangus' | 'vip'
  const [cariUserQuery, setCariUserQuery] = useState("");
  const [filterTrxMode, setFilterTrxMode] = useState("semua"); // 'semua' | 'pending' | 'lunas'

  const [voucherBaru, setVoucherBaru] = useState({
    kode: "",
    koin: "20",
    kuota: "25",
  });

  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    email: "",
    password: "",
  });

  const muatErrorDanUsulan = async () => {
    try {
      const { data: errRows } = await supabase
        .from("error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (errRows) setDaftarErrorLog(errRows);

      const { data: fbRows } = await supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false });
      if (fbRows) setDaftarUsulan(fbRows);
    } catch {
      // Abaikan
    }
  };

  useEffect(() => {
    muatErrorDanUsulan();
  }, []);

  const handleUploadGambarQRISAdmin = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 600;
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
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setPengaturanPayment({
          ...pengaturanPayment,
          qrisImageUrl: dataUrl,
        });
        showToast(
          "Gambar QRIS berhasil dimuat! Jangan lupa klik Simpan di bawah."
        );
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleTanggapiUsulan = async (fb, statusBaru) => {
    const teksBalasan = balasanInput[fb.id] ?? fb.balasan_dev ?? "";
    try {
      await supabase
        .from("feedbacks")
        .update({ status: statusBaru, balasan_dev: teksBalasan })
        .eq("id", fb.id);

      setDaftarUsulan((prev) =>
        prev.map((item) =>
          item.id === fb.id
            ? { ...item, status: statusBaru, balasan_dev: teksBalasan }
            : item
        )
      );
      showToast("Status usulan/komplain berhasil diperbarui!");
    } catch (err) {
      showToast("Gagal memperbarui usulan: " + err.message);
    }
  };

  const handleSimpanEmailPasswordUser = async (uId) => {
    try {
      const updatePayload = {};
      if (editUserForm.email.trim()) {
        updatePayload.email = editUserForm.email.trim().toLowerCase();
      }
      if (editUserForm.password.trim()) {
        updatePayload.password_hash = editUserForm.password.trim();
      }
      await supabase.from("users").update(updatePayload).eq("id", uId);
      setEditingUserId(null);
      await muatUlangDataSupabase();
      showToast("Email & Password akun berhasil diperbarui!");
    } catch (err) {
      showToast("Gagal memperbarui akun: " + err.message);
    }
  };

  // Kirim Pengingat Koin Hampir Hangus ke WA User (Modal Rp0 Tanpa API WA)
  const kirimWAPengingatHangus = (u, sisaHari) => {
    const noWA = formatNomorWA(u.whatsapp || u.profil_dna?.whatsapp);
    if (!noWA) {
      alert("Pengguna ini belum mencantumkan nomor WhatsApp.");
      return;
    }
    const pesan =
      sisaHari > 0
        ? `Halo Kak *${u.nama}*! 👋\n\nKami dari tim *Hookya.site* ingin mengingatkan bahwa masa aktif paket kamu tinggal *${sisaHari} hari lagi*.\n\nSaat ini kamu masih memiliki sisa *${u.koin || 0} Koin*. Yuk perpanjang paketmu mulai Rp5.000 / Rp10.000 saja sebelum masa aktif habis, supaya sisa *${u.koin || 0} Koin* kamu *tidak hangus* dan masa aktifnya langsung diakumulasikan +30 hari! 🚀\n\nCek di sini ya: https://hookya.site`
        : `Halo Kak *${u.nama}*! 👋\n\nMasa aktif paket *Hookya.site* kamu saat ini sudah berakhir. Yuk aktifkan kembali paket koinmu (atau upgrade ke *Paket Kreator Rp25.000* untuk membuka fitur Mikrofon, Scan Produk Shopee/TikTok & Ekstrak Video Kompetitor) di https://hookya.site 🚀`;

    window.open(
      `https://wa.me/${noWA}?text=${encodeURIComponent(pesan)}`,
      "_blank"
    );
  };

  // Toggle Status VIP (>= 20rb) Manual oleh Admin
  const handleToggleVIPUser = async (u) => {
    const statusBaru = !Boolean(u.is_premium || u.profil_dna?.is_premium);
    try {
      await supabase
        .from("users")
        .update({
          is_premium: statusBaru,
          profil_dna: { ...(u.profil_dna || {}), is_premium: statusBaru },
        })
        .eq("id", u.id);
      await muatUlangDataSupabase();
      showToast(
        `Status akun ${u.nama} diubah menjadi ${
          statusBaru ? "👑 Member VIP (>= 20rb)" : "Member Standar"
        }`
      );
    } catch (err) {
      showToast("Gagal mengubah status VIP: " + err.message);
    }
  };

  // Perpanjang Masa Aktif +30 Hari (Rollover) oleh Admin
  const handleTambah30HariUser = async (u) => {
    const sisaHari = hitungSisaHariUser(
      u.expired_at || u.profil_dna?.expired_at
    );
    const totalHariBaru = sisaHari + 30;
    const tglBaru = new Date(
      Date.now() + totalHariBaru * 24 * 60 * 60 * 1000
    ).toISOString();

    try {
      await supabase
        .from("users")
        .update({
          expired_at: tglBaru,
          profil_dna: { ...(u.profil_dna || {}), expired_at: tglBaru },
        })
        .eq("id", u.id);
      await muatUlangDataSupabase();
      showToast(
        `Masa aktif ${u.nama} diakumulasikan menjadi ${totalHariBaru} hari!`
      );
    } catch (err) {
      showToast("Gagal menambah masa aktif: " + err.message);
    }
  };

  const totalOmzetLunas = daftarTransaksi
    .filter((t) => t.status === "lunas")
    .reduce((acc, cur) => acc + (parseInt(cur.nominal_bayar) || 0), 0);

  const jumlahTransaksiPending = daftarTransaksi.filter(
    (t) => t.status === "pending"
  ).length;

  const daftarUserH3Hangus = semuaUserDB.filter((u) => {
    const sisa = hitungSisaHariUser(u.expired_at || u.profil_dna?.expired_at);
    return sisa >= 1 && sisa <= 3;
  });

  const daftarUserTerfilter = semuaUserDB.filter((u) => {
    const sisa = hitungSisaHariUser(u.expired_at || u.profil_dna?.expired_at);
    const isVIP = Boolean(u.is_premium || u.profil_dna?.is_premium);

    if (filterUserMode === "h3_hangus" && !(sisa >= 1 && sisa <= 3))
      return false;
    if (filterUserMode === "sudah_hangus" && sisa > 0) return false;
    if (filterUserMode === "vip" && !isVIP) return false;

    if (cariUserQuery.trim()) {
      const q = cariUserQuery.toLowerCase();
      const cocokNama = u.nama?.toLowerCase().includes(q);
      const cocokEmail = (u.email || u.profil_dna?.kontak || "")
        .toLowerCase()
        .includes(q);
      const cocokWA = (u.whatsapp || u.profil_dna?.whatsapp || "").includes(q);
      return cocokNama || cocokEmail || cocokWA;
    }
    return true;
  });

  const daftarTransaksiTerfilter = daftarTransaksi.filter((t) => {
    if (filterTrxMode === "pending") return t.status === "pending";
    if (filterTrxMode === "lunas") return t.status === "lunas";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#14141f] text-white flex flex-col font-sans antialiased overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-[#14141f] border-b border-white/10 px-4 sm:px-8 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#d4f34a] flex items-center justify-center text-[#14141f] font-bold text-base shrink-0">
            H
          </div>
          <div>
            <span className="font-bold text-sm sm:text-base text-white block leading-none">
              Hookya Developer Console
            </span>
            <span className="text-[11px] text-[#d4f34a] hidden sm:inline">
              Kendali 10.000 User, Filter H-3 Koin Hangus & Verifikasi QRIS
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSwitchToUserView}
          className="cursor-pointer flex items-center gap-2 bg-[#d4f34a] text-[#14141f] px-3.5 py-2 rounded-full text-xs font-bold shadow-md hover:opacity-95 transition shrink-0"
        >
          <FlatIcon name="user" className="w-4 h-4" />
          <span>Ke Dashboard User ➔</span>
        </button>
      </header>

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 pt-20 sm:pt-24 space-y-6">
        <div className="flex flex-wrap gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
          {[
            { id: "overview", label: "Ringkasan & PIN Dev" },
            {
              id: "users",
              label: `Kelola User & H-3 Hangus (${daftarUserH3Hangus.length} Siap Tagih)`,
            },
            {
              id: "transaksi",
              label: `Verifikasi Pembayaran (${jumlahTransaksiPending} Pending)`,
            },
            {
              id: "usulan",
              label: `Usulan & Komplain (${daftarUsulan.length})`,
            },
            {
              id: "error_logs",
              label: `Laporan Error AI (${daftarErrorLog.length})`,
            },
            { id: "voucher", label: "Generator Voucher" },
            { id: "prompt", label: "Studio Prompt AI" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setDevTab(t.id)}
              className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                devTab === t.id
                  ? "bg-[#d4f34a] text-[#14141f]"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white text-[#14141f] rounded-4xl p-5 sm:p-8 shadow-xl space-y-6">
          {/* TAB 1: RINGKASAN & PIN DEVELOPER */}
          {devTab === "overview" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">
                Ringkasan Bisnis Margin 90% & Kendali Operasional
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#14141f] text-white">
                  <span className="text-xs text-slate-300">
                    Total Omzet Lunas
                  </span>
                  <div className="text-2xl font-bold text-[#d4f34a] mt-1">
                    Rp{totalOmzetLunas.toLocaleString("id-ID")}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Estimasi Laba Bersih (~90%): Rp
                    {Math.round(totalOmzetLunas * 0.9).toLocaleString("id-ID")}
                  </span>
                </div>

                <div
                  onClick={() => {
                    setFilterUserMode("h3_hangus");
                    setDevTab("users");
                  }}
                  className="cursor-pointer p-5 rounded-2xl bg-[#fff0e6] border border-[#d97736]/30 hover:scale-[1.01] transition"
                >
                  <span className="text-xs font-bold text-[#d97736]">
                    🚨 User H-3 Koin Hangus
                  </span>
                  <div className="text-2xl font-bold text-[#14141f] mt-1">
                    {daftarUserH3Hangus.length} User
                  </div>
                  <span className="text-[10px] text-slate-600 underline block mt-1">
                    Klik untuk tagih via WA Manual ➔
                  </span>
                </div>

                <div
                  onClick={() => {
                    setFilterTrxMode("pending");
                    setDevTab("transaksi");
                  }}
                  className="cursor-pointer p-5 rounded-2xl bg-[#f4f5f7] border border-slate-200 hover:scale-[1.01] transition"
                >
                  <span className="text-xs text-slate-500">
                    Bukti QRIS Menunggu Cek
                  </span>
                  <div className="text-2xl font-bold text-amber-600 mt-1">
                    {jumlahTransaksiPending} Bukti
                  </div>
                  <span className="text-[10px] text-slate-600 underline block mt-1">
                    Klik untuk verifikasi ➔
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#f2fce2] border border-[#4d6b14]/30 space-y-1.5">
                  <label className="text-xs font-bold text-[#4d6b14] block">
                    Ubah PIN Akses Developer:
                  </label>
                  <input
                    type="text"
                    value={pinAdminResmi}
                    onChange={(e) => setPinAdminResmi(e.target.value)}
                    placeholder="Contoh: 123456"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-[#14141f] outline-none"
                  />
                  <span className="text-[10px] text-slate-600 block">
                    Klik Simpan di bawah setelah mengubah PIN.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KELOLA PENGGUNA + FILTER H-3 KOIN HANGUS + WA MANUAL */}
          {devTab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">
                    Database Pengguna, Filter H-3 Koin Hangus & Pengingat WA
                  </h2>
                  <p className="text-xs text-slate-500">
                    Filter pengguna yang masa aktifnya tinggal 1–3 hari lalu klik tombol WA untuk mengirim pesan pengingat perpanjangan paket.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => muatUlangDataSupabase()}
                  className="cursor-pointer bg-[#f4f5f7] px-3.5 py-2 rounded-xl text-xs font-bold"
                >
                  Refresh Data User
                </button>
              </div>

              {/* BAR FILTER CEPAT & PENCARIAN */}
              <div className="bg-[#f4f5f7] p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      id: "semua",
                      label: `Semua User (${semuaUserDB.length})`,
                    },
                    {
                      id: "h3_hangus",
                      label: `🚨 H-3 Koin Hangus (${daftarUserH3Hangus.length})`,
                    },
                    { id: "sudah_hangus", label: "❌ Sudah Hangus (0 Hari)" },
                    { id: "vip", label: "👑 Member VIP (>= 20rb)" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterUserMode(f.id)}
                      className={`cursor-pointer px-3 py-2 rounded-xl text-xs font-bold transition ${
                        filterUserMode === f.id
                          ? "bg-[#14141f] text-[#d4f34a]"
                          : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={cariUserQuery}
                  onChange={(e) => setCariUserQuery(e.target.value)}
                  placeholder="Cari nama, Gmail, atau No WA..."
                  className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs outline-none sm:w-64"
                />
              </div>

              {daftarUserTerfilter.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Tidak ada pengguna yang cocok dengan filter ini.
                </p>
              ) : (
                <div className="space-y-3">
                  {daftarUserTerfilter.map((u) => {
                    const emailSaatIni =
                      u.email || u.profil_dna?.kontak || "Belum diatur";
                    const passwordSaatIni =
                      u.password_hash || u.profil_dna?.pin || "12345678";
                    const sisaHari = hitungSisaHariUser(
                      u.expired_at || u.profil_dna?.expired_at
                    );
                    const isVIP = Boolean(
                      u.is_premium ||
                        u.profil_dna?.is_premium ||
                        u.role === "admin"
                    );

                    return (
                      <div
                        key={u.id}
                        className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200 space-y-3 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-[#14141f]">
                                {u.nama} (@
                                {u.username ||
                                  u.profil_dna?.username ||
                                  u.nama?.toLowerCase()}
                                )
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isVIP
                                    ? "bg-[#14141f] text-[#d4f34a]"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {isVIP
                                  ? "👑 VIP (Fitur Lengkap)"
                                  : "Member Standar (< 20rb)"}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  sisaHari === 0
                                    ? "bg-rose-100 text-rose-700"
                                    : sisaHari <= 3
                                    ? "bg-amber-200 text-[#14141f]"
                                    : "bg-[#f2fce2] text-[#4d6b14]"
                                }`}
                              >
                                {sisaHari === 0
                                  ? "❌ Paket Hangus (0 Hari)"
                                  : `⏳ Aktif ${sisaHari} Hari Lagi`}
                              </span>
                            </div>

                            <div className="text-slate-600">
                              Gmail: <strong>{emailSaatIni}</strong> • Password:{" "}
                              <strong>{passwordSaatIni}</strong> • WA:{" "}
                              <strong>
                                {u.whatsapp || u.profil_dna?.whatsapp || "-"}
                              </strong>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => kirimWAPengingatHangus(u, sisaHari)}
                              className="cursor-pointer bg-[#f2fce2] hover:bg-[#d4f34a] text-[#14141f] border border-[#4d6b14]/30 font-bold px-3 py-1.5 rounded-xl"
                            >
                              📲 WA Pengingat
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleVIPUser(u)}
                              className="cursor-pointer bg-white border border-slate-300 font-bold px-2.5 py-1.5 rounded-xl"
                              title="Ubah status akses fitur >= 20rb"
                            >
                              {isVIP ? "Cabut VIP" : "Jadikan 👑 VIP"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTambah30HariUser(u)}
                              className="cursor-pointer bg-white border border-slate-300 font-bold px-2.5 py-1.5 rounded-xl"
                            >
                              +30 Hari
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingUserId(
                                  editingUserId === u.id ? null : u.id
                                );
                                setEditUserForm({
                                  email:
                                    u.email || u.profil_dna?.kontak || "",
                                  password:
                                    u.password_hash ||
                                    u.profil_dna?.pin ||
                                    "",
                                });
                              }}
                              className="cursor-pointer bg-white border border-slate-300 font-bold px-2.5 py-1.5 rounded-xl"
                            >
                              Edit Akun
                            </button>

                            <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-bold">
                              {u.koin} Koin
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateKoinDatabase((u.koin || 0) + 20, u.id)
                              }
                              className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold px-3 py-1.5 rounded-xl"
                            >
                              +20 Koin
                            </button>
                          </div>
                        </div>

                        {editingUserId === u.id && (
                          <div className="bg-white p-3.5 rounded-xl border border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <input
                              type="email"
                              value={editUserForm.email}
                              onChange={(e) =>
                                setEditUserForm({
                                  ...editUserForm,
                                  email: e.target.value,
                                })
                              }
                              placeholder="Email Gmail baru..."
                              className="bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                            />
                            <input
                              type="text"
                              value={editUserForm.password}
                              onChange={(e) =>
                                setEditUserForm({
                                  ...editUserForm,
                                  password: e.target.value,
                                })
                              }
                              placeholder="Password baru (min 8 karakter)..."
                              className="bg-[#f4f5f7] border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSimpanEmailPasswordUser(u.id)}
                              className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold py-2 rounded-xl"
                            >
                              Simpan Perubahan
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PENGATURAN QRIS MANUAL / PAYMENT GATEWAY & VERIFIKASI BUKTI BAYAR */}
          {devTab === "transaksi" && (
            <div className="space-y-6">
              <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-4">
                <div>
                  <h3 className="text-sm font-bold">
                    Sakelar Utama Sistem Pembayaran (Bisa Diganti Sewaktu-waktu)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilih "QRIS Manual + Upload Bukti + WA Admin" sembari menunggu akun Payment Gateway siap.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPengaturanPayment({
                        ...pengaturanPayment,
                        modePembayaranAktif: "qris_manual",
                        modeVerifikasi: "manual_admin",
                      })
                    }
                    className={`cursor-pointer p-4 rounded-2xl border text-left transition ${
                      (pengaturanPayment.modePembayaranAktif ||
                        "qris_manual") === "qris_manual"
                        ? "bg-[#d4f34a] text-[#14141f] border-[#14141f]"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold">
                      1. Mode QRIS Manual (Upload Bukti + Notif WA Admin)
                    </div>
                    <p className="text-[11px] mt-0.5 opacity-85">
                      User scan QRIS sesuai nominal unik, upload foto bukti bayar, dan masuk ke arsip di bawah.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPengaturanPayment({
                        ...pengaturanPayment,
                        modePembayaranAktif: "duitku_gateway",
                      })
                    }
                    className={`cursor-pointer p-4 rounded-2xl border text-left transition ${
                      pengaturanPayment.modePembayaranAktif === "duitku_gateway"
                        ? "bg-[#d4f34a] text-[#14141f] border-[#14141f]"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold">
                      2. Mode Payment Gateway Otomatis (Duitku Ready)
                    </div>
                    <p className="text-[11px] mt-0.5 opacity-85">
                      User diarahkan otomatis ke checkout Duitku dan koin + masa aktif bertambah otomatis.
                    </p>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      Nomor WhatsApp Admin (Penerima Notifikasi):
                    </label>
                    <input
                      type="tel"
                      value={pengaturanPayment.noWaAdmin || "6281234567890"}
                      onChange={(e) =>
                        setPengaturanPayment({
                          ...pengaturanPayment,
                          noWaAdmin: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      placeholder="Contoh: 6281234567890"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">
                      Info Nama Merchant / Rekening Tujuan:
                    </label>
                    <input
                      type="text"
                      value={pengaturanPayment.infoRekening || ""}
                      onChange={(e) =>
                        setPengaturanPayment({
                          ...pengaturanPayment,
                          infoRekening: e.target.value,
                        })
                      }
                      placeholder="QRIS / BCA / SeaBank a.n Faqih"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">
                      Upload Gambar QRIS dari HP/Laptop:
                    </label>
                    <label className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] rounded-xl px-3.5 py-2.5 text-xs font-bold flex items-center justify-center gap-2">
                      <FlatIcon name="upload" className="w-4 h-4" />
                      <span>Pilih Gambar QRIS</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadGambarQRISAdmin}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* FILTER STATUS TRANSAKSI */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      id: "semua",
                      label: `Semua Transaksi (${daftarTransaksi.length})`,
                    },
                    {
                      id: "pending",
                      label: `⏳ Menunggu Verifikasi (${jumlahTransaksiPending})`,
                    },
                    { id: "lunas", label: "✓ Terverifikasi Lunas" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterTrxMode(f.id)}
                      className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-bold ${
                        filterTrxMode === f.id
                          ? "bg-[#14141f] text-[#d4f34a]"
                          : "bg-[#f4f5f7] text-slate-600"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => muatUlangDataSupabase()}
                  className="cursor-pointer bg-[#f4f5f7] px-3.5 py-2 rounded-xl text-xs font-bold"
                >
                  Refresh Bukti Masuk
                </button>
              </div>

              <div className="space-y-3">
                {daftarTransaksiTerfilter.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">
                    Belum ada transaksi pada filter ini.
                  </p>
                ) : (
                  daftarTransaksiTerfilter.map((trx) => (
                    <div
                      key={trx.id}
                      className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-3.5">
                        {trx.bukti_bayar ? (
                          <img
                            src={trx.bukti_bayar}
                            alt="Bukti Transfer"
                            onClick={() => setPreviewBuktiImg(trx.bukti_bayar)}
                            className="cursor-pointer w-16 h-16 rounded-xl object-cover border-2 border-[#14141f] shrink-0 hover:scale-105 transition"
                            title="Klik untuk memperbesar foto bukti transfer"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 text-center p-1 shrink-0">
                            Tanpa Foto
                          </div>
                        )}

                        <div className="space-y-1">
                          <strong className="font-bold text-sm block">
                            {trx.invoice_id} • {trx.nama_user} — {trx.nama_paket}{" "}
                            (+{trx.jumlah_koin} Koin)
                          </strong>
                          <div className="text-slate-600">
                            Nominal Dibayar:{" "}
                            <strong className="text-[#14141f]">
                              Rp
                              {Number(trx.nominal_bayar).toLocaleString("id-ID")}
                            </strong>{" "}
                            • Metode: {trx.metode_bayar}
                          </div>
                          {trx.bukti_bayar && (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewBuktiImg(trx.bukti_bayar)
                              }
                              className="cursor-pointer text-[11px] font-bold text-[#5b4bc4] underline"
                            >
                              🔍 Lihat Foto Bukti Pembayaran Ukuran Penuh
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {trx.status === "pending" ? (
                          <button
                            type="button"
                            onClick={() => handleApproveTransaksiAdmin(trx)}
                            className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold px-4 py-2.5 rounded-xl shadow-xs"
                          >
                            ✓ Terima Bukti, Aktifkan +30 Hari & Kirim WA
                          </button>
                        ) : (
                          <span className="bg-[#f2fce2] text-[#4d6b14] font-bold px-3.5 py-1.5 rounded-full">
                            ✓ Terverifikasi Lunas
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: USULAN & KOMPLAIN USER */}
          {devTab === "usulan" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">
                  Kotak Masuk Usulan Pengembangan & Komplain Pengguna
                </h2>
                <button
                  type="button"
                  onClick={muatErrorDanUsulan}
                  className="cursor-pointer bg-[#f4f5f7] px-3.5 py-2 rounded-xl text-xs font-bold"
                >
                  Refresh Usulan
                </button>
              </div>

              {daftarUsulan.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Belum ada usulan atau komplain yang dikirim pengguna.
                </p>
              ) : (
                <div className="space-y-3">
                  {daftarUsulan.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200 space-y-3 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#14141f] text-[#d4f34a] mr-2">
                            {fb.kategori}
                          </span>
                          <strong>{fb.nama_user}</strong> ({fb.email_user || "-"})
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Status: <strong>{fb.status}</strong>
                        </span>
                      </div>
                      <p className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#14141f]">
                        {fb.pesan}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={
                            balasanInput[fb.id] !== undefined
                              ? balasanInput[fb.id]
                              : fb.balasan_dev || ""
                          }
                          onChange={(e) =>
                            setBalasanInput({
                              ...balasanInput,
                              [fb.id]: e.target.value,
                            })
                          }
                          placeholder="Tulis balasan developer..."
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleTanggapiUsulan(fb, "ditindaklanjuti")
                          }
                          className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold px-4 py-2 rounded-xl shrink-0"
                        >
                          Simpan Balasan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: LAPORAN ERROR AI */}
          {devTab === "error_logs" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">
                Laporan Error Generate AI & Auto-Refund Koin
              </h2>
              {daftarErrorLog.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold">
                      User: {log.nama_user} • Fitur: {log.fitur}
                    </div>
                    <p className="text-rose-700">{log.pesan_error}</p>
                  </div>
                  <span className="bg-[#f2fce2] text-[#4d6b14] font-bold px-3 py-1.5 rounded-xl">
                    ✓ +{log.koin_diganti || 1} Koin Diganti
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: GENERATOR VOUCHER */}
          {devTab === "voucher" && (
            <div className="space-y-4">
              <div className="bg-[#f4f5f7] p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={voucherBaru.kode}
                  onChange={(e) =>
                    setVoucherBaru({
                      ...voucherBaru,
                      kode: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Kode Voucher"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase"
                />
                <input
                  type="number"
                  value={voucherBaru.koin}
                  onChange={(e) =>
                    setVoucherBaru({ ...voucherBaru, koin: e.target.value })
                  }
                  placeholder="Jumlah Koin"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
                <input
                  type="number"
                  value={voucherBaru.kuota}
                  onChange={(e) =>
                    setVoucherBaru({ ...voucherBaru, kuota: e.target.value })
                  }
                  placeholder="Kuota"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!voucherBaru.kode.trim()) return;
                    setDaftarVoucher([
                      {
                        kode: voucherBaru.kode.trim().toUpperCase(),
                        koin: parseInt(voucherBaru.koin) || 20,
                        kuota: parseInt(voucherBaru.kuota) || 25,
                        terpakai: 0,
                      },
                      ...daftarVoucher,
                    ]);
                    setVoucherBaru({ kode: "", koin: "20", kuota: "25" });
                    showToast("Voucher ditambahkan!");
                  }}
                  className="cursor-pointer bg-[#14141f] text-[#d4f34a] text-xs font-bold py-2.5 rounded-xl"
                >
                  + Buat Voucher
                </button>
              </div>

              {daftarVoucher.map((v, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-[#f4f5f7] border border-slate-200 flex items-center justify-between text-xs"
                >
                  <span>
                    <strong>{v.kode}</strong> (+{v.koin} Koin • Terpakai{" "}
                    {v.terpakai}/{v.kuota})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDaftarVoucher(
                        daftarVoucher.filter((_, idx) => idx !== i)
                      )
                    }
                    className="cursor-pointer text-rose-600 font-bold"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 7: STUDIO PROMPT AI */}
          {devTab === "prompt" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">
                  1. Instruksi Sistem Analisis Gaya Bicara:
                </label>
                <textarea
                  rows={2}
                  value={customPrompts.persona_engine}
                  onChange={(e) =>
                    setCustomPrompts({
                      ...customPrompts,
                      persona_engine: e.target.value,
                    })
                  }
                  className="w-full bg-[#f4f5f7] border border-slate-200 rounded-2xl p-3 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  2. Instruksi Sistem Co-Pilot 4 Tahap:
                </label>
                <textarea
                  rows={2}
                  value={customPrompts.assessment_copilot}
                  onChange={(e) =>
                    setCustomPrompts({
                      ...customPrompts,
                      assessment_copilot: e.target.value,
                    })
                  }
                  className="w-full bg-[#f4f5f7] border border-slate-200 rounded-2xl p-3 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  3. Instruksi Sistem Penyusun Skrip & UGC:
                </label>
                <textarea
                  rows={2}
                  value={customPrompts.script_humanizer}
                  onChange={(e) =>
                    setCustomPrompts({
                      ...customPrompts,
                      script_humanizer: e.target.value,
                    })
                  }
                  className="w-full bg-[#f4f5f7] border border-slate-200 rounded-2xl p-3 text-xs"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={simpanPengaturanDevKeDB}
            className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] font-bold text-xs py-4 rounded-2xl"
          >
            Simpan Seluruh Pengaturan Manajerial, QRIS/PG & PIN Developer ke Database
          </button>
        </div>
      </div>

      {/* MODAL PREVIEW FOTO BUKTI PEMBAYARAN UKURAN PENUH */}
      {previewBuktiImg && (
        <div
          onClick={() => setPreviewBuktiImg(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white p-4 rounded-3xl max-w-md w-full space-y-3 text-center">
            <div className="text-xs font-bold text-[#14141f]">
              Foto Bukti Pembayaran User
            </div>
            <img
              src={previewBuktiImg}
              alt="Bukti Penuh"
              className="w-full max-h-[70vh] object-contain rounded-2xl border border-slate-200"
            />
            <button
              type="button"
              onClick={() => setPreviewBuktiImg(null)}
              className="cursor-pointer w-full bg-[#14141f] text-[#d4f34a] text-xs font-bold py-3 rounded-xl"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}