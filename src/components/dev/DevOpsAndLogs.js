"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { FlatIcon, HookyaLogo } from "../SharedUI";

export default function DevOpsAndLogs({
  activeTab,
  telemetriAgregat,
  semuaUserDB,
  pengaturanPayment,
  setPengaturanPayment,
  pinAdminResmi,
  setPinAdminResmi,
  daftarVoucher,
  setDaftarVoucher,
  handleApproveTransaksiAdmin,
  simpanPengaturanDevKeDB,
  muatUlangDataSupabase,
  setZoomBuktiUrl,
  showToast,
}) {
  const [searchDbUser, setSearchDbUser] = useState("");
  const [filterUserTab, setFilterUserTab] = useState("all");
  const [showPassMap, setShowPassMap] = useState({});
  const [kodeVoucherBaru, setKodeVoucherBaru] = useState("");
  const [koinVoucherBaru, setKoinVoucherBaru] = useState(20);

  const brandConfig = pengaturanPayment?.brandConfig || {
    logoPngUrl: "",
    logoGapPx: 6,
    brandText: "OOKYA",
    showBrandText: true,
  };

  const updateBrandConfig = (key, val) => {
    const nextBrand = { ...brandConfig, [key]: val };
    setPengaturanPayment({
      ...pengaturanPayment,
      brandConfig: nextBrand,
    });
  };

  const handleUploadLogoPngAdmin = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 400;
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
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/png");
        const nextBrand = { ...brandConfig, logoPngUrl: dataUrl };
        const updatedPayment = {
          ...pengaturanPayment,
          brandConfig: nextBrand,
        };
        setPengaturanPayment(updatedPayment);
        simpanPengaturanDevKeDB(updatedPayment);
        showToast("File PNG Logo berhasil diunggah dan diterapkan.");
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleUploadQRISAdmin = (e) => {
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
        const dataUrl = canvas.toDataURL("image/png", 0.9);
        const updated = { ...pengaturanPayment, qrisImageUrl: dataUrl };
        setPengaturanPayment(updated);
        simpanPengaturanDevKeDB(updated);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleTolakTransaksi = async (trx) => {
    await supabase
      .from("transactions")
      .update({ status: "ditolak" })
      .eq("id", trx.id);
    if (muatUlangDataSupabase) await muatUlangDataSupabase();
    showToast(`Invoice #${trx.invoice_id} ditolak.`);
  };

  const handlePerpanjang30HariUser = async (u) => {
    const totalHariBaru = (u.sisaHari || 0) + 30;
    const expBaru = new Date(
      Date.now() + totalHariBaru * 24 * 60 * 60 * 1000
    ).toISOString();

    await supabase
      .from("users")
      .update({
        expired_at: expBaru,
        profil_dna: {
          ...(u.profil_dna || {}),
          expired_at: expBaru,
        },
      })
      .eq("id", u.id);

    if (muatUlangDataSupabase) await muatUlangDataSupabase();
    showToast(`Masa aktif ${u.nama} ditambah +30 hari.`);
  };

  const handleExportCSV = () => {
    const header =
      "Nama,Username,Email,WhatsApp,Paket,SisaKoin,SisaHari,TotalToken,BiayaAPI\n";
    const rows = (telemetriAgregat?.peringkatUser || [])
      .map(
        (u) =>
          `"${u.nama || ""}","${u.username || ""}","${u.email || ""}","${
            u.whatsapp || u.profil_dna?.whatsapp || ""
          }","${u.paketLabel}",${u.koin || 0},${u.sisaHari},${u.totTok},${
            u.biayaRp
          }`
      )
      .join("\n");
    const blob = new Blob([header + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hookya_users_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // MENU 3: VERIFIKASI QRIS & PENGATURAN MERCHANT
  if (activeTab === "qris") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
          <div className="pb-3 border-b border-[#E2E8F0]">
            <h2 className="text-lg font-bold text-[#14141F]">
              Konfigurasi QRIS Statis Merchant
            </h2>
            <p className="text-xs text-[#64748B]">
              Kanal penerimaan pembayaran pendaftaran dan top-up koin
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#14141F] mb-1">
                Nomor WhatsApp Admin Finansial
              </label>
              <input
                type="text"
                value={pengaturanPayment.noWaAdmin || ""}
                onChange={(e) =>
                  setPengaturanPayment({
                    ...pengaturanPayment,
                    noWaAdmin: e.target.value,
                  })
                }
                className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141F] mb-1">
                Nama Merchant Terdaftar (NMID)
              </label>
              <input
                type="text"
                value={pengaturanPayment.namaMerchant || ""}
                onChange={(e) =>
                  setPengaturanPayment({
                    ...pengaturanPayment,
                    namaMerchant: e.target.value,
                  })
                }
                className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14141F] mb-1">
                Info Rekening / Nomor NMID Resmi
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
                className="w-full h-11 px-3 rounded-lg border border-[#E2E8F0] text-xs font-mono"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-dashed border-[#E2E8F0] bg-[#F4F5F7] flex items-center gap-3.5">
              <div className="w-20 h-20 bg-white p-1.5 rounded-lg border border-[#E2E8F0] flex items-center justify-center shrink-0">
                {pengaturanPayment.qrisImageUrl ? (
                  <img
                    src={pengaturanPayment.qrisImageUrl}
                    alt="QRIS"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <FlatIcon name="qr" className="w-12 h-12 text-[#14141F]" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-xs font-bold truncate">
                  Gambar QRIS Statis Merchant
                </div>
                <label className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold text-[#14141F] underline">
                  <FlatIcon name="upload" className="w-3.5 h-3.5" />
                  <span>Ganti File Gambar QRIS</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadQRISAdmin}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={() => simpanPengaturanDevKeDB(pengaturanPayment)}
              className="cursor-pointer w-full h-11 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <FlatIcon name="check" className="w-4 h-4" />
              <span>Simpan & Terapkan QRIS</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#14141F]">
                  Antrean Verifikasi Bukti QRIS
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-[#FEF2F2] border border-[#EF4444] text-[#EF4444] text-[11px] font-bold">
                  {telemetriAgregat.trxPending.length} Pending
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Konfirmasi bukti transfer masuk dan kirim otomatis alokasi koin via WhatsApp
              </p>
            </div>
          </div>

          {telemetriAgregat.trxPending.length === 0 ? (
            <p className="text-xs text-[#64748B] py-10 text-center">
              Tidak ada antrean bukti pembayaran QRIS yang menunggu verifikasi.
            </p>
          ) : (
            <div className="space-y-3">
              {telemetriAgregat.trxPending.map((trx) => (
                <div
                  key={trx.id}
                  className="p-4 rounded-2xl border border-[#E2E8F0] bg-white space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">
                          #{trx.invoice_id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#FEF2F2] text-[#EF4444] text-[10px] font-bold">
                          Menunggu Review
                        </span>
                      </div>
                      <div className="text-sm font-bold mt-1">
                        {trx.nama_user}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {trx.nama_paket} (+{trx.jumlah_koin} Koin)
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xl font-bold text-[#14141F] tabular-nums">
                        Rp{" "}
                        {Number(
                          trx.nominal_bayar || trx.nominal_asli || 0
                        ).toLocaleString("id-ID")}
                      </div>
                      <div className="text-[11px] text-[#556500] font-semibold">
                        Kode Unik: {String(trx.nominal_bayar || "").slice(-3)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#E2E8F0]">
                    {trx.bukti_bayar ? (
                      <button
                        type="button"
                        onClick={() => setZoomBuktiUrl(trx.bukti_bayar)}
                        className="cursor-pointer flex items-center gap-2 text-xs font-bold text-[#14141F] hover:underline"
                      >
                        <img
                          src={trx.bukti_bayar}
                          alt="Bukti"
                          className="w-11 h-11 rounded-lg object-cover border border-[#E2E8F0]"
                        />
                        <span>Perbesar Bukti Transfer</span>
                      </button>
                    ) : (
                      <span className="text-xs text-[#64748B]">
                        Tanpa lampiran gambar
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTolakTransaksi(trx)}
                        className="cursor-pointer h-10 px-3 rounded-lg border border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] text-xs font-bold"
                      >
                        Tolak
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveTransaksiAdmin(trx)}
                        className="cursor-pointer h-10 px-4 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold flex items-center gap-1.5"
                      >
                        <FlatIcon name="check" className="w-3.5 h-3.5" />
                        <span>ACC & Kirim Info WA</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // MENU 4: PENGATURAN LOGO PNG, JARAK TEKS, VOUCHER & PIN
  if (activeTab === "branding") {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-lg font-bold text-[#14141F]">
                Pengaturan Logo PNG & Jarak Teks Brand (Header & Laman Login)
              </h2>
              <p className="text-xs text-[#64748B]">
                Unggah file PNG logo kustom dan sesuaikan jarak piksel antara logo dengan tulisan brand
              </p>
            </div>
            <button
              type="button"
              onClick={() => simpanPengaturanDevKeDB(pengaturanPayment)}
              className="cursor-pointer h-11 px-4 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold flex items-center gap-1.5 self-start"
            >
              <FlatIcon name="check" className="w-4 h-4" />
              <span>Simpan Pengaturan Logo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-xl border border-dashed border-[#E2E8F0] bg-[#F4F5F7] flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center p-2 shrink-0">
                  {brandConfig.logoPngUrl ? (
                    <img
                      src={brandConfig.logoPngUrl}
                      alt="Logo Kustom"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <HookyaLogo brandConfig={{ showBrandText: false }} />
                  )}
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <div className="text-xs font-bold text-[#14141F]">
                    File Gambar Logo (.PNG Transparan / .SVG)
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <label className="cursor-pointer px-3.5 py-2 rounded-lg bg-[#14141F] text-[#D4F34A] text-xs font-bold inline-flex items-center gap-1.5">
                      <FlatIcon name="upload" className="w-3.5 h-3.5" />
                      <span>Upload File PNG Logo</span>
                      <input
                        type="file"
                        accept="image/png,image/svg+xml,image/jpeg,image/webp"
                        onChange={handleUploadLogoPngAdmin}
                        className="hidden"
                      />
                    </label>

                    {brandConfig.logoPngUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextBrand = { ...brandConfig, logoPngUrl: "" };
                          const updated = {
                            ...pengaturanPayment,
                            brandConfig: nextBrand,
                          };
                          setPengaturanPayment(updated);
                          simpanPengaturanDevKeDB(updated);
                          showToast("Logo dikembalikan ke default.");
                        }}
                        className="cursor-pointer px-3 py-2 rounded-lg bg-white border border-[#EF4444] text-[#EF4444] text-xs font-bold"
                      >
                        Reset Default
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Jarak Logo & Teks:</span>
                    <span className="px-2 py-0.5 rounded bg-[#D4F34A] text-[#14141F] font-mono">
                      {brandConfig.logoGapPx ?? 6} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    step="1"
                    value={brandConfig.logoGapPx ?? 6}
                    onChange={(e) =>
                      updateBrandConfig("logoGapPx", Number(e.target.value))
                    }
                    className="w-full accent-[#14141F] cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#14141F]">
                      Teks Brand:
                    </label>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold">
                      <input
                        type="checkbox"
                        checked={brandConfig.showBrandText !== false}
                        onChange={(e) =>
                          updateBrandConfig("showBrandText", e.target.checked)
                        }
                        className="w-3.5 h-3.5 accent-[#14141F]"
                      />
                      <span>Tampilkan</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={brandConfig.brandText ?? "OOKYA"}
                    onChange={(e) =>
                      updateBrandConfig("brandText", e.target.value)
                    }
                    className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#F4F5F7] rounded-xl p-4 border border-[#E2E8F0] space-y-3">
              <span className="text-xs font-bold text-[#14141F] uppercase block">
                Pratinjau Header & Login:
              </span>
              <div className="h-14 bg-white rounded-xl border border-[#E2E8F0] px-4 flex items-center justify-between">
                <HookyaLogo brandConfig={brandConfig} subLabel="Bot Naskah" />
                <span className="px-3 py-1 rounded-full bg-[#D4F34A] text-[#14141F] text-[11px] font-bold">
                  1,250 KOIN
                </span>
              </div>
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col items-center">
                <HookyaLogo brandConfig={brandConfig} isLoginScreen={true} />
              </div>
            </div>
          </div>
        </div>

        {/* Pengaturan Voucher & PIN Console */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
          <h3 className="text-base font-bold text-[#14141F]">
            Kelola Kode Voucher Promo & PIN Developer Console
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={kodeVoucherBaru}
                  onChange={(e) =>
                    setKodeVoucherBaru(e.target.value.toUpperCase())
                  }
                  placeholder="KODE VOUCHER..."
                  className="flex-1 h-11 px-3 rounded-lg border border-[#E2E8F0] text-xs font-mono uppercase"
                />
                <input
                  type="number"
                  value={koinVoucherBaru}
                  onChange={(e) => setKoinVoucherBaru(e.target.value)}
                  className="w-20 h-11 px-2.5 rounded-lg border border-[#E2E8F0] text-xs font-bold text-center"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!kodeVoucherBaru.trim()) return;
                    const vBaru = [
                      ...daftarVoucher,
                      {
                        kode: kodeVoucherBaru.trim().toUpperCase(),
                        koin: parseInt(koinVoucherBaru) || 20,
                        kuota: 100,
                        terpakai: 0,
                      },
                    ];
                    setDaftarVoucher(vBaru);
                    setKodeVoucherBaru("");
                    simpanPengaturanDevKeDB(pengaturanPayment);
                  }}
                  className="cursor-pointer h-11 px-4 rounded-lg bg-[#14141F] text-[#D4F34A] text-xs font-bold shrink-0"
                >
                  + Voucher
                </button>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {daftarVoucher.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#F4F5F7] border border-[#E2E8F0] flex items-center justify-between text-xs"
                  >
                    <span className="font-mono font-bold">
                      {v.kode} (+{v.koin} Koin)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDaftarVoucher(
                          daftarVoucher.filter((_, i) => i !== idx)
                        )
                      }
                      className="cursor-pointer text-[#EF4444] font-bold text-[11px]"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#14141F]">
                PIN Akses Developer Console:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pinAdminResmi}
                  onChange={(e) => setPinAdminResmi(e.target.value)}
                  className="flex-1 h-11 px-3 rounded-lg border border-[#E2E8F0] text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => simpanPengaturanDevKeDB(pengaturanPayment)}
                  className="cursor-pointer h-11 px-4 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold"
                >
                  Simpan PIN
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MENU 5: DATABASE PENGGUNA & MANAJEMEN MASA AKTIF KOIN
  if (activeTab === "users") {
    const daftarUserDatabaseTerfilter = (
      telemetriAgregat?.peringkatUser || []
    ).filter((u) => {
      if (filterUserTab === "h3" && !(u.sisaHari > 0 && u.sisaHari <= 3))
        return false;
      if (filterUserTab === "expired" && u.sisaHari !== 0) return false;
      if (filterUserTab === "vip" && !u.is_premium) return false;
      if (!searchDbUser.trim()) return true;
      const q = searchDbUser.toLowerCase();
      return (
        (u.nama || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.whatsapp || u.profil_dna?.whatsapp || "").toLowerCase().includes(q)
      );
    });

    return (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-lg font-bold text-[#14141F]">
              Database Pengguna & Manajemen Masa Aktif Koin
            </h2>
            <p className="text-xs text-[#64748B]">
              Pantau akun aktif, kredensial sandi, kuota sosmed terhubung, dan pengingat koin H-3
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="cursor-pointer h-10 px-3.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F4F5F7] text-xs font-bold flex items-center gap-1.5 self-start"
          >
            <FlatIcon name="upload" className="w-3.5 h-3.5 rotate-180" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "all", label: `Semua User (${semuaUserDB.length})` },
              {
                id: "h3",
                label: `H-3 Koin Hangus (${telemetriAgregat.akunH3Hangus.length})`,
              },
              {
                id: "expired",
                label: `Sudah Hangus (${telemetriAgregat.akunSudahHangus.length})`,
              },
              {
                id: "vip",
                label: `Member VIP (${telemetriAgregat.akunVIP.length})`,
              },
            ].map((tb) => (
              <button
                key={tb.id}
                type="button"
                onClick={() => setFilterUserTab(tb.id)}
                className={`cursor-pointer px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition ${
                  filterUserTab === tb.id
                    ? "bg-[#14141F] text-[#D4F34A]"
                    : "bg-[#F4F5F7] text-[#64748B] hover:text-[#14141F]"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchDbUser}
            onChange={(e) => setSearchDbUser(e.target.value)}
            placeholder="Filter WhatsApp, nama, @username..."
            className="w-full md:w-64 h-10 px-3.5 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:outline-none focus:border-[#14141F]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[11px] text-[#64748B] uppercase bg-[#F4F5F7]">
                <th className="py-3 px-3">Pengguna & Kontak</th>
                <th className="py-3 px-3">Kredensial Sandi</th>
                <th className="py-3 px-3">Sosmed Terkoneksi</th>
                <th className="py-3 px-3">Sisa Koin & Masa Aktif</th>
                <th className="py-3 px-3 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {daftarUserDatabaseTerfilter.map((u) => {
                const listAkunSosmed = Array.isArray(
                  u.profil_dna?.daftarAkunTernak
                )
                  ? u.profil_dna.daftarAkunTernak
                  : [];
                const jmlAkun = Math.max(1, listAkunSosmed.length);
                const waUser = u.whatsapp || u.profil_dna?.whatsapp || "-";
                const sandiAsli =
                  u.password_hash || u.profil_dna?.pin || "12345678";
                const tampilSandi = Boolean(showPassMap[u.id]);

                return (
                  <tr key={u.id} className="hover:bg-[#F4F5F7]/60">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#14141F]">{u.nama}</div>
                      <div className="font-mono text-[11px] text-[#64748B]">
                        @{u.username || "user"} • {waUser}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {tampilSandi ? sandiAsli : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassMap((p) => ({
                              ...p,
                              [u.id]: !p[u.id],
                            }))
                          }
                          className="cursor-pointer px-2 py-1 rounded border border-[#E2E8F0] text-[10px] font-bold bg-white"
                        >
                          {tampilSandi ? "Tutup" : "Lihat"}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold">
                        {jmlAkun}/{u.kuotaSlot} Akun Aktif
                      </div>
                      <div className="text-[11px] text-[#64748B] font-mono truncate max-w-[180px]">
                        {listAkunSosmed.map((a) => a.labelAkun).join(", ") ||
                          `@${u.username || "utama"}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm tabular-nums">
                          {u.koin || 0} Koin
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.sisaHari <= 3
                              ? "bg-[#D4F34A] text-[#14141F]"
                              : "bg-[#F4F5F7] text-[#64748B]"
                          }`}
                        >
                          {u.sisaHari === 0
                            ? "Sudah Hangus"
                            : `Aktif ${u.sisaHari} Hari`}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const bersih = waUser.replace(/\D/g, "");
                            if (!bersih) return;
                            const noWa = bersih.startsWith("08")
                              ? "62" + bersih.slice(1)
                              : bersih;
                            const pesan = encodeURIComponent(
                              `Halo Kak *${u.nama}*, sisa *${
                                u.koin || 0
                              } Koin* Hookya kamu memiliki masa aktif *${
                                u.sisaHari
                              } hari lagi*. Yuk perpanjang paket agar sisa koinmu otomatis diakumulasi (Rollover +30 Hari) di https://hookya.site`
                            );
                            window.open(
                              `https://wa.me/${noWa}?text=${pesan}`,
                              "_blank"
                            );
                          }}
                          className="cursor-pointer h-8 px-2.5 rounded-lg bg-[#14141F] text-[#D4F34A] text-[11px] font-bold"
                        >
                          WA Pengingat
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePerpanjang30HariUser(u)}
                          className="cursor-pointer h-8 px-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#14141F] text-[11px] font-bold"
                        >
                          +30 Hari
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // MENU 6: GLOBAL DEVELOPER BRAIN (REKAMAN PERCAKAPAN SELURUH USER) & LOG BIAYA PENGGUNAAN
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Kolom Kiri: Bank Data Pembelajaran Otak Aplikasi dari Percakapan User (7 Cols) */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
        <div className="pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#14141F]">
              Global Developer Brain (Rekaman Chat & Referensi AI)
            </h2>
            <span className="px-2.5 py-0.5 rounded-md bg-[#D4F34A] text-[#14141F] text-[11px] font-bold">
              {telemetriAgregat.semuaGlobalBrain.length} Percakapan
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Setiap pertanyaan user dan balasan bot otomatis disimpan di sini untuk mempelajari pola konten seluruh user
          </p>
        </div>

        {telemetriAgregat.semuaGlobalBrain.length === 0 ? (
          <p className="text-xs text-[#64748B] py-10 text-center">
            Belum ada rekaman percakapan dari sesi chat pengguna.
          </p>
        ) : (
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {telemetriAgregat.semuaGlobalBrain.map((gb, idx) => (
              <div
                key={gb.id || idx}
                className="p-3.5 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[#14141F]">
                    @{gb.username} • {gb.waktu}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] font-mono text-[10px] font-semibold">
                    {gb.model} (Rp {gb.costRp || 15})
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#14141F] text-white">
                  <strong className="text-[#D4F34A] block text-[10px] uppercase">
                    Input User:
                  </strong>
                  <span>{gb.userPrompt}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] text-[#14141F]">
                  <strong className="text-[#64748B] block text-[10px] uppercase">
                    Respons Bot Hookya:
                  </strong>
                  <span className="line-clamp-3">{gb.botResponse}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kolom Kanan: Rincian Biaya Setiap Penggunaan Fitur Real-Time (5 Cols) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
        <div className="pb-3 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-bold text-[#14141F]">
            Rincian Biaya Setiap Penggunaan
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Daftar log pemanggilan fitur beserta model dan biaya API per eksekusi
          </p>
        </div>

        {telemetriAgregat.semuaLogAktivitas.length === 0 ? (
          <p className="text-xs text-[#64748B] py-10 text-center">
            Belum ada log penggunaan hari ini.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {telemetriAgregat.semuaLogAktivitas.map((lg, i) => (
              <div
                key={lg.id || i}
                className="p-3 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] flex items-start justify-between gap-2 text-xs"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#14141F]">
                      @{lg.username}
                    </span>
                    <span className="text-[10px] text-[#64748B] font-mono">
                      {lg.waktu}
                    </span>
                  </div>
                  <div className="font-bold text-[#14141F] truncate">
                    {lg.action}
                  </div>
                  <div className="text-[11px] text-[#64748B] font-mono">
                    Model: {(lg.model || "gemini-2.5-flash").split("/").pop()} •{" "}
                    {Number(lg.tokens || 0).toLocaleString("id-ID")} Token
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 rounded bg-[#D4F34A] text-[#14141F] font-mono text-[11px] font-bold">
                    Rp {lg.costRp || 15}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}