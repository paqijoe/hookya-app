"use client"
import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { FlatIcon } from "./SharedUI"

export default function DeveloperDashboardView({
  onSwitchToUserView,
  semuaUserDB,
  daftarTransaksi,
  koleksiSkripTersimpan,
  pengaturanPayment,
  setPengaturanPayment,
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
  const [devTab, setDevTab] = useState("overview") // 'overview' | 'error_logs' | 'transaksi' | 'users' | 'voucher' | 'prompt'
  const [daftarErrorLog, setDaftarErrorLog] = useState([])
  const [voucherBaru, setVoucherBaru] = useState({
    kode: "",
    koin: "100",
    kuota: "25",
  })

  const muatErrorLogs = async () => {
    try {
      const { data } = await supabase
        .from("error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)
      if (data) setDaftarErrorLog(data)
    } catch {
      // Abaikan jika tabel belum ada
    }
  }

  useEffect(() => {
    muatErrorLogs()
  }, [])

  const totalOmzetLunas = daftarTransaksi
    .filter((t) => t.status === "lunas")
    .reduce((acc, cur) => acc + (parseInt(cur.nominal_bayar) || 0), 0)

  const jumlahTransaksiPending = daftarTransaksi.filter(
    (t) => t.status === "pending",
  ).length

  return (
    <div className="min-h-screen bg-[#14141f] text-white flex flex-col font-sans antialiased">
      {/* HEADER KHUSUS DEVELOPER DASHBOARD (DENGAN TOMBOL GANTI TAMPILAN KE USER) */}
      <header className="sticky top-0 z-40 h-16 bg-[#14141f] border-b border-white/10 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#d4f34a] flex items-center justify-center text-[#14141f] font-bold text-base">
            H
          </div>
          <div>
            <span className="font-bold text-sm sm:text-base text-white block leading-none">
              Hookya Developer Console
            </span>
            <span className="text-[11px] text-[#d4f34a]">
              Pusat Manajerial Aplikasi, Pengguna & Pantauan Sistem
            </span>
          </div>
        </div>

        {/* TOMBOL KHUSUS DEVELOPER UNTUK MENGGANTI TAMPILAN MENJADI DASHBOARD USER */}
        <button
          type="button"
          onClick={onSwitchToUserView}
          className="cursor-pointer flex items-center gap-2 bg-[#d4f34a] text-[#14141f] px-4 py-2 rounded-full text-xs font-bold shadow-md hover:opacity-95 transition"
        >
          <FlatIcon name="user" className="w-4 h-4" />
          <span>Ganti Tampilan ke Dashboard User ➔</span>
        </button>
      </header>

      {/* KONTEN MANAJERIAL DEVELOPER */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Navigasi Tab Manajerial */}
        <div className="flex flex-wrap gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
          {[
            { id: "overview", label: "Ringkasan & Analitik" },
            {
              id: "error_logs",
              label: `Laporan Error AI & Auto-Refund (${daftarErrorLog.length})`,
            },
            {
              id: "transaksi",
              label: `Transaksi & Midtrans (${jumlahTransaksiPending} Pending)`,
            },
            { id: "users", label: `Kelola Pengguna (${semuaUserDB.length})` },
            { id: "voucher", label: "Generator Voucher" },
            { id: "prompt", label: "Studio Kendali Prompt AI" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setDevTab(t.id)}
              className={`cursor-pointer px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                devTab === t.id
                  ? "bg-[#d4f34a] text-[#14141f]"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white text-[#14141f] rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-6">
          {/* TAB 1: RINGKASAN MANAJERIAL */}
          {devTab === "overview" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">
                Ringkasan Manajerial Aplikasi Hookya
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#14141f] text-white">
                  <span className="text-xs text-slate-300">
                    Total Omzet Terverifikasi
                  </span>
                  <div className="text-2xl font-bold text-[#d4f34a] mt-1">
                    Rp{totalOmzetLunas.toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-[#f4f5f7] border border-slate-200">
                  <span className="text-xs text-slate-500">
                    Total Pengguna Terdaftar
                  </span>
                  <div className="text-2xl font-bold mt-1">
                    {semuaUserDB.length} Akun
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-[#f4f5f7] border border-slate-200">
                  <span className="text-xs text-slate-500">
                    Total Skrip Diproduksi
                  </span>
                  <div className="text-2xl font-bold mt-1">
                    {koleksiSkripTersimpan.length} Skrip
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200">
                  <span className="text-xs text-rose-700">
                    Laporan Gagal Generate (Auto-Refund)
                  </span>
                  <div className="text-2xl font-bold text-rose-900 mt-1">
                    {daftarErrorLog.length} Kejadian
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LAPORAN ERROR AI & KOMPENSASI KOIN DIAM-DIAM */}
          {devTab === "error_logs" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold">
                    Laporan Error Generate AI & Penggantian Koin Otomatis
                  </h2>
                  <p className="text-xs text-slate-500">
                    Setiap kali pengguna mengalami gagal generate atau video
                    tidak terbaca, sistem otomatis mengembalikan koin mereka di
                    belakang layar dan mencatatnya di sini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={muatErrorLogs}
                  className="cursor-pointer bg-[#f4f5f7] px-3.5 py-2 rounded-xl text-xs font-bold"
                >
                  Muat Ulang Log
                </button>
              </div>

              {daftarErrorLog.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Belum ada laporan error. Seluruh proses generate AI berjalan
                  lancar.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {daftarErrorLog.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="font-bold text-[#14141f]">
                          User: {log.nama_user || "Pengguna"} • Fitur:{" "}
                          <span className="underline">{log.fitur}</span>
                        </div>
                        <p className="text-rose-700 font-normal">
                          Pesan Kendala: {log.pesan_error}
                        </p>
                        <span className="text-[11px] text-slate-400 block">
                          Waktu:{" "}
                          {new Date(log.created_at).toLocaleString("id-ID")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-[#f2fce2] text-[#4d6b14] font-bold px-3 py-1.5 rounded-xl">
                          ✓ +{log.koin_diganti || 1} Koin Otomatis Diganti
                        </span>
                        {log.user_id && (
                          <button
                            type="button"
                            onClick={() => {
                              const u = semuaUserDB.find(
                                (x) => x.id === log.user_id,
                              )
                              if (u) {
                                updateKoinDatabase((u.koin || 0) + 5, u.id)
                                showToast(
                                  `Hadiah ekstra +5 Koin dikirim diam-diam ke ${u.nama}!`,
                                )
                              }
                            }}
                            className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold px-3 py-1.5 rounded-xl"
                          >
                            + Beri Hadiah 5 Koin Lagi
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRANSAKSI & PENGATURAN PAYMENT */}
          {devTab === "transaksi" && (
            <div className="space-y-5">
              <div className="bg-[#f4f5f7] p-5 rounded-3xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold">
                  Pengaturan Pembayaran QRIS & Midtrans
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      Mode Verifikasi Checkout Manual:
                    </label>
                    <select
                      value={pengaturanPayment.modeVerifikasi}
                      onChange={(e) =>
                        setPengaturanPayment({
                          ...pengaturanPayment,
                          modeVerifikasi: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                    >
                      <option value="manual_admin">
                        Verifikasi Manual Admin (Tunggu Klik Terima)
                      </option>
                      <option value="otomatis">Verifikasi Otomatis</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      URL Gambar QRIS Merchant:
                    </label>
                    <input
                      type="text"
                      value={pengaturanPayment.qrisImageUrl}
                      onChange={(e) =>
                        setPengaturanPayment({
                          ...pengaturanPayment,
                          qrisImageUrl: e.target.value,
                        })
                      }
                      placeholder="https://.../qris.png"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {daftarTransaksi.map((trx) => (
                  <div
                    key={trx.id}
                    className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <strong className="font-bold">
                        {trx.invoice_id} • {trx.nama_user} — {trx.nama_paket} (+
                        {trx.jumlah_koin} Koin)
                      </strong>
                      <div className="text-slate-500 mt-0.5">
                        Tagihan: Rp
                        {Number(trx.nominal_bayar).toLocaleString(
                          "id-ID",
                        )} • {trx.metode_bayar}
                      </div>
                    </div>
                    {trx.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => handleApproveTransaksiAdmin(trx)}
                        className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold px-4 py-2 rounded-xl"
                      >
                        ✓ Terima & Kirim Koin
                      </button>
                    ) : (
                      <span className="bg-[#f2fce2] text-[#4d6b14] font-bold px-3 py-1 rounded-full">
                        ✓ Lunas
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: KELOLA PENGGUNA */}
          {devTab === "users" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  Manajemen Akun Pengguna & Koin
                </h2>
                <button
                  type="button"
                  onClick={() => muatUlangDataSupabase()}
                  className="cursor-pointer bg-[#f4f5f7] px-3.5 py-2 rounded-xl text-xs font-bold"
                >
                  Refresh User
                </button>
              </div>
              {semuaUserDB.map((u) => (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-[#f4f5f7] border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-sm">
                      {u.nama} (@
                      {u.username || u.profil_dna?.username || "user"})
                    </div>
                    <div className="text-slate-500">
                      Gmail: {u.email || u.profil_dna?.kontak || "-"} • WA:{" "}
                      {u.whatsapp || u.profil_dna?.whatsapp || "-"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-bold">
                      {u.koin} Koin
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateKoinDatabase((u.koin || 0) + 50, u.id)
                      }
                      className="cursor-pointer bg-[#14141f] text-[#d4f34a] font-bold px-3 py-1.5 rounded-xl"
                    >
                      +50 Koin
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateKoinDatabase(
                          Math.max(0, (u.koin || 0) - 50),
                          u.id,
                        )
                      }
                      className="cursor-pointer bg-white border border-slate-300 font-bold px-3 py-1.5 rounded-xl"
                    >
                      -50 Koin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: GENERATOR VOUCHER */}
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
                    if (!voucherBaru.kode.trim()) return
                    setDaftarVoucher([
                      {
                        kode: voucherBaru.kode.trim().toUpperCase(),
                        koin: parseInt(voucherBaru.koin) || 100,
                        kuota: parseInt(voucherBaru.kuota) || 25,
                        terpakai: 0,
                      },
                      ...daftarVoucher,
                    ])
                    setVoucherBaru({ kode: "", koin: "100", kuota: "25" })
                    showToast("Voucher ditambahkan!")
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
                        daftarVoucher.filter((_, idx) => idx !== i),
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

          {/* TAB 6: STUDIO PROMPT AI */}
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
            Simpan Seluruh Pengaturan Manajerial Developer ke Database
          </button>
        </div>
      </div>
    </div>
  )
}
