"use client"
import { useState, useMemo } from "react"
import { supabase } from "../lib/supabase"
import { FlatIcon, HookyaLogo, hitungKuotaAkunDariPaket } from "./SharedUI"

function hitungSisaHari(expiredAtStr) {
  if (!expiredAtStr) return 30
  const selisih = Math.ceil(
    (new Date(expiredAtStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  return Math.max(0, selisih)
}

export default function DeveloperDashboardView({
  onSwitchToUserView,
  semuaUserDB = [],
  daftarTransaksi = [],
  pengaturanPayment,
  setPengaturanPayment,
  pinAdminResmi,
  setPinAdminResmi,
  daftarVoucher = [],
  setDaftarVoucher,
  updateKoinDatabase,
  handleApproveTransaksiAdmin,
  simpanPengaturanDevKeDB,
  muatUlangDataSupabase,
  showToast,
}) {
  const [activeNav, setActiveNav] = useState("telemetri")
  const [searchTokenUser, setSearchTokenUser] = useState("")
  const [searchDbUser, setSearchDbUser] = useState("")
  const [filterUserTab, setFilterUserTab] = useState("all")
  const [zoomBuktiUrl, setZoomBuktiUrl] = useState(null)
  const [showPassMap, setShowPassMap] = useState({})
  const [kodeVoucherBaru, setKodeVoucherBaru] = useState("")
  const [koinVoucherBaru, setKoinVoucherBaru] = useState(20)

  const telemetriAgregat = useMemo(() => {
    const trxLunas = daftarTransaksi.filter((t) => t.status === "lunas")
    const trxPending = daftarTransaksi.filter((t) => t.status === "pending")

    const totalUangMasuk = trxLunas.reduce(
      (acc, t) =>
        acc + (Number(t.nominal_bayar) || Number(t.nominal_asli) || 0),
      0,
    )

    let totalPromptTokens = 0
    let totalCompletionTokens = 0
    let totalBiayaApi = 0
    const semuaLogAktivitas = []

    const peringkatUser = semuaUserDB.map((u) => {
      const tel = u.profil_dna?.telemetry || {}
      const inTok = Number(tel.promptTokens) || 0
      const outTok = Number(tel.completionTokens) || 0
      const totTok = Number(tel.totalTokens) || inTok + outTok
      const biayaRp =
        Number(tel.totalCostRp) || Math.round((totTok / 1000) * 47.9)
      const reqCount = Number(tel.totalRequests) || 0
      const regenCount = Number(tel.regenRequests) || 0

      totalPromptTokens += inTok
      totalCompletionTokens += outTok
      totalBiayaApi += biayaRp

      if (Array.isArray(tel.recentLogs)) {
        tel.recentLogs.forEach((lg) => {
          semuaLogAktivitas.push({
            ...lg,
            username: u.username || u.nama || "user",
          })
        })
      }

      const trxUserLunas = trxLunas
        .filter((t) => t.user_id === u.id)
        .reduce(
          (s, t) =>
            s + (Number(t.nominal_bayar) || Number(t.nominal_asli) || 0),
          0,
        )

      const nilaiPaketDasar = trxUserLunas || (u.is_premium ? 25000 : 10000)
      const marginPersen =
        nilaiPaketDasar > 0
          ? Math.round(((nilaiPaketDasar - biayaRp) / nilaiPaketDasar) * 100)
          : 75

      const paketLabel =
        u.profil_dna?.paketAktif ||
        (u.is_premium ? "Paket 25K VIP" : "Paket 10K")
      const kuotaSlot = hitungKuotaAkunDariPaket(
        paketLabel,
        nilaiPaketDasar,
        u.role === "admin",
      )

      return {
        ...u,
        paketLabel,
        kuotaSlot,
        reqCount,
        inTok,
        outTok,
        totTok,
        biayaRp,
        regenCount,
        marginPersen: Math.max(-20, Math.min(99, marginPersen)),
        sisaHari: hitungSisaHari(u.expired_at || u.profil_dna?.expired_at),
      }
    })

    peringkatUser.sort((a, b) => b.totTok - a.totTok)
    semuaLogAktivitas.sort(
      (a, b) =>
        new Date(b.timestamp || 0).getTime() -
        new Date(a.timestamp || 0).getTime(),
    )

    const labaBersih = totalUangMasuk - totalBiayaApi
    const marginTotal =
      totalUangMasuk > 0
        ? ((labaBersih / totalUangMasuk) * 100).toFixed(1)
        : "85.0"

    const akunH3Hangus = peringkatUser.filter(
      (u) => u.sisaHari > 0 && u.sisaHari <= 3,
    )
    const akunSudahHangus = peringkatUser.filter((u) => u.sisaHari === 0)
    const akunVIP = peringkatUser.filter((u) => u.is_premium)

    return {
      totalUangMasuk,
      jumlahTrxLunas: trxLunas.length,
      trxPending,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokensGabungan: totalPromptTokens + totalCompletionTokens,
      totalBiayaApi,
      labaBersih,
      marginTotal,
      peringkatUser,
      akunH3Hangus,
      akunSudahHangus,
      akunVIP,
      semuaLogAktivitas: semuaLogAktivitas.slice(0, 15),
    }
  }, [semuaUserDB, daftarTransaksi])

  const handleUploadQRISAdmin = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const maxDim = 600
        let w = img.width
        let h = img.height
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w)
            w = maxDim
          } else {
            w = Math.round((w * maxDim) / h)
            h = maxDim
          }
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL("image/png", 0.9)
        const updated = { ...pengaturanPayment, qrisImageUrl: dataUrl }
        setPengaturanPayment(updated)
        simpanPengaturanDevKeDB(updated)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleTolakTransaksi = async (trx) => {
    await supabase
      .from("transactions")
      .update({ status: "ditolak" })
      .eq("id", trx.id)
    if (muatUlangDataSupabase) await muatUlangDataSupabase()
    showToast(`Invoice #${trx.invoice_id} ditolak.`)
  }

  const handlePerpanjang30HariUser = async (u) => {
    const sisaLama = hitungSisaHari(u.expired_at || u.profil_dna?.expired_at)
    const totalHariBaru = sisaLama + 30
    const expBaru = new Date(
      Date.now() + totalHariBaru * 24 * 60 * 60 * 1000,
    ).toISOString()

    await supabase
      .from("users")
      .update({
        expired_at: expBaru,
        profil_dna: {
          ...(u.profil_dna || {}),
          expired_at: expBaru,
        },
      })
      .eq("id", u.id)

    if (muatUlangDataSupabase) await muatUlangDataSupabase()
    showToast(`Masa aktif ${u.nama} ditambah +30 hari.`)
  }

  const handleExportCSV = () => {
    const header =
      "Nama,Username,Email,WhatsApp,Paket,SisaKoin,SisaHari,TotalToken,BiayaAPI\n"
    const rows = telemetriAgregat.peringkatUser
      .map(
        (u) =>
          `"${u.nama || ""}","${u.username || ""}","${u.email || ""}","${
            u.whatsapp || u.profil_dna?.whatsapp || ""
          }","${u.paketLabel}",${u.koin || 0},${u.sisaHari},${u.totTok},${
            u.biayaRp
          }`,
      )
      .join("\n")
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hookya_users_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const daftarLeaderboardTerfilter = telemetriAgregat.peringkatUser.filter(
    (u) => {
      if (!searchTokenUser.trim()) return true
      const q = searchTokenUser.toLowerCase()
      return (
        (u.nama || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q)
      )
    },
  )

  const daftarUserDatabaseTerfilter = telemetriAgregat.peringkatUser.filter(
    (u) => {
      if (filterUserTab === "h3" && !(u.sisaHari > 0 && u.sisaHari <= 3))
        return false
      if (filterUserTab === "expired" && u.sisaHari !== 0) return false
      if (filterUserTab === "vip" && !u.is_premium) return false
      if (!searchDbUser.trim()) return true
      const q = searchDbUser.toLowerCase()
      return (
        (u.nama || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.whatsapp || u.profil_dna?.whatsapp || "").toLowerCase().includes(q)
      )
    },
  )

  const formatTokenSingkat = (n) => {
    const angka = Number(n) || 0
    if (angka >= 1000000) return `${(angka / 1000000).toFixed(2)}M`
    if (angka >= 1000) return `${(angka / 1000).toFixed(1)}K`
    return String(angka)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#191C1E] font-sans antialiased">
      {zoomBuktiUrl && (
        <div
          onClick={() => setZoomBuktiUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="bg-white p-3 rounded-2xl max-w-md w-full space-y-2">
            <img
              src={zoomBuktiUrl}
              alt="Bukti Transfer"
              className="w-full max-h-[75vh] object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={() => setZoomBuktiUrl(null)}
              className="cursor-pointer w-full py-2.5 bg-[#1B1B26] text-[#D1F047] rounded-lg text-xs font-bold"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-[#E7E8EA] px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HookyaLogo />
          <span className="px-2 py-0.5 rounded bg-[#D1F047] text-[#181E00] text-xs font-bold uppercase tracking-wider">
            Developer Console
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSwitchToUserView}
            className="cursor-pointer h-9 px-3.5 rounded-lg bg-[#1B1B26] text-[#D1F047] text-xs font-bold flex items-center gap-1.5"
          >
            <FlatIcon name="arrowLeft" className="w-4 h-4" />
            <span>Ke Aplikasi User</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-[#D1F047] text-[#181E00] font-bold text-xs flex items-center justify-center">
            OP
          </div>
        </div>
      </header>

      {/* LEFT SIDEBAR (DESKTOP) */}
      <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-60 bg-white border-r border-[#E7E8EA] z-30 flex-col justify-between p-4">
        <div className="space-y-4">
          <div>
            <div className="px-2 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Operasional Inti
            </div>
            <nav className="flex flex-col gap-1 text-xs font-semibold">
              {[
                {
                  id: "telemetri",
                  label: "Telemetri Finansial",
                  href: "#sec-telemetri",
                },
                { id: "token", label: "Token Audit", href: "#sec-token" },
                {
                  id: "qris",
                  label: "Verifikasi QRIS",
                  href: "#sec-verifikasi",
                },
                { id: "users", label: "Database User", href: "#sec-users" },
                {
                  id: "logs",
                  label: "System Logs & Voucher",
                  href: "#sec-logs",
                },
              ].map((m) => (
                <a
                  key={m.id}
                  href={m.href}
                  onClick={() => setActiveNav(m.id)}
                  className={`px-3 py-2.5 rounded-lg transition flex items-center justify-between ${
                    activeNav === m.id
                      ? "bg-[#E7E8EA] text-[#191C1E] font-bold"
                      : "text-slate-600 hover:bg-[#F3F4F6]"
                  }`}
                >
                  <span>{m.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#EDEFF0] border border-[#E1E2E4] text-[11px] space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>Status Mesin AI</span>
            <strong className="text-[#191C1E]">Online</strong>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Total User</span>
            <strong className="text-[#191C1E]">
              {semuaUserDB.length} Akun
            </strong>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="lg:pl-60 pt-16">
        <main className="w-full px-4 sm:px-6 py-6 space-y-8 max-w-7xl mx-auto">
          {/* Operational Subheader Banner */}
          <div className="bg-[#1B1B26] text-white p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#D1F047] text-[#181E00] flex items-center justify-center shrink-0">
                <FlatIcon name="shield" className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                    Console Master Pengendali Operasional
                  </h1>
                  <span className="px-2 py-0.5 rounded bg-[#D1F047]/20 text-[#D1F047] border border-[#D1F047]/30 text-[10px] font-bold uppercase">
                    Superadmin Root
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Audit Keuangan, Alokasi Token LLM, Validasi Gerbang QRIS &
                  Automasi Siklus Pengguna
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => muatUlangDataSupabase && muatUlangDataSupabase()}
              className="cursor-pointer h-9 px-3.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <FlatIcon name="refresh" className="w-4 h-4" />
              <span>Segarkan Data</span>
            </button>
          </div>

          {/* SECTION 1: Financial & Token Telemetry Summary Cards */}
          <section id="sec-telemetri" className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-[#191C1E]">
                Telemetri Finansial & Konsumsi Token
              </h2>
              <p className="text-xs text-slate-500">
                Ikhtisar likuiditas kas operasional, beban komputasi AI, dan
                margin keuntungan bersih berjalan
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Uang Masuk */}
              <div className="bg-white p-5 rounded-xl border border-[#E7E8EA] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-500 uppercase font-bold">
                    Total Uang Masuk (Lunas)
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-[#D1F047]/40 text-[#181E00] flex items-center justify-center">
                    <FlatIcon name="coin" className="w-4 h-4" />
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#191C1E]">
                    Rp {telemetriAgregat.totalUangMasuk.toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="mt-4 pt-2.5 border-t border-[#EDEFF0] text-[11px] text-slate-500">
                  Dari{" "}
                  <strong className="text-[#191C1E]">
                    {telemetriAgregat.jumlahTrxLunas} transaksi
                  </strong>{" "}
                  pendaftaran & top-up koin
                </div>
              </div>

              {/* Card 2: Total Pengeluaran Token API */}
              <div className="bg-white p-5 rounded-xl border border-[#E7E8EA] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-500 uppercase font-bold">
                    Total Pengeluaran Token API
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-[#EDEFF0] text-slate-700 flex items-center justify-center">
                    <FlatIcon name="code" className="w-4 h-4" />
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#191C1E]">
                    Rp {telemetriAgregat.totalBiayaApi.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    <strong className="font-mono text-[#191C1E]">
                      {formatTokenSingkat(telemetriAgregat.totalTokensGabungan)}
                    </strong>{" "}
                    total prompt + completion
                  </div>
                </div>
                <div className="mt-4 pt-2.5 border-t border-[#EDEFF0] text-[11px] text-slate-500">
                  Rata-rata <strong className="text-[#191C1E]">Rp 47,9</strong>{" "}
                  per 1K token model gabungan
                </div>
              </div>

              {/* Card 3: Estimasi Laba Bersih & Margin */}
              <div className="bg-white p-5 rounded-xl border border-[#E7E8EA] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-500 uppercase font-bold">
                    Estimasi Laba Bersih & Margin
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-[#D1F047] text-[#181E00] flex items-center justify-center">
                    <FlatIcon name="chart" className="w-4 h-4" />
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#191C1E]">
                    Rp {telemetriAgregat.labaBersih.toLocaleString("id-ID")}
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[#D1F047]/40 text-[#181E00] text-[11px] font-bold">
                    Margin Bersih: {telemetriAgregat.marginTotal}%
                  </span>
                </div>
                <div className="mt-4 pt-2.5 border-t border-[#EDEFF0] text-[11px] text-slate-500">
                  Uang masuk dikurangi pengeluaran token API
                </div>
              </div>

              {/* Card 4: Tindakan Prioritas Admin */}
              <div className="bg-white p-5 rounded-xl border-2 border-[#D1F047] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-500 uppercase font-bold">
                    Tindakan Prioritas Admin
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-[#F3F4F6] px-3 py-1.5 rounded-lg border border-[#E7E8EA] text-xs">
                    <span>Bukti QRIS Pending</span>
                    <strong className="font-mono text-rose-600">
                      {telemetriAgregat.trxPending.length} Verifikasi
                    </strong>
                  </div>
                  <div className="flex items-center justify-between bg-[#F3F4F6] px-3 py-1.5 rounded-lg border border-[#E7E8EA] text-xs">
                    <span>Koin H-3 Hangus</span>
                    <strong className="font-mono text-[#191C1E]">
                      {telemetriAgregat.akunH3Hangus.length} Akun
                    </strong>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#EDEFF0] text-right">
                  <a
                    href="#sec-verifikasi"
                    className="text-xs font-bold text-[#191C1E] hover:underline"
                  >
                    Buka Antrean Kerja
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Token Audit & User Leaderboard Table */}
          <section
            id="sec-token"
            className="bg-white rounded-xl border border-[#E7E8EA] p-5 space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#EDEFF0]">
              <div>
                <h2 className="text-lg font-bold text-[#191C1E]">
                  Peringkat & Audit Konsumsi Token API per User
                </h2>
                <p className="text-xs text-slate-500">
                  Lacak profil penggunaan AI, biaya riil model backend per akun,
                  dan deteksi regenerasi berlebih
                </p>
              </div>
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  value={searchTokenUser}
                  onChange={(e) => setSearchTokenUser(e.target.value)}
                  placeholder="Cari nama, email, atau username..."
                  className="w-full h-10 px-3.5 rounded-lg border border-[#E7E8EA] text-xs bg-white focus:border-[#191C1E] focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E7E8EA] text-[11px] text-slate-500 uppercase bg-[#F3F4F6]/60">
                    <th className="py-3 px-3">Peringkat</th>
                    <th className="py-3 px-3">Pengguna & Identitas</th>
                    <th className="py-3 px-3">Paket Aktif & Slot</th>
                    <th className="py-3 px-3 text-right">Sisa Koin</th>
                    <th className="py-3 px-3 text-right">Permintaan AI</th>
                    <th className="py-3 px-3">Total Token (In / Out)</th>
                    <th className="py-3 px-3 text-right">Biaya API Riil</th>
                    <th className="py-3 px-3 text-center">Status Margin</th>
                    <th className="py-3 px-3 text-center">Aksi Pengelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEFF0]">
                  {daftarLeaderboardTerfilter.map((u, idx) => {
                    const boros = u.marginPersen < 40 || u.regenCount > 25
                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-[#F3F4F6]/50 transition-colors"
                      >
                        <td className="py-3.5 px-3 font-mono font-bold text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] ${
                              idx === 0
                                ? "bg-[#D1F047] text-[#181E00]"
                                : "bg-[#EDEFF0] text-[#191C1E]"
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-[#191C1E]">
                            {u.nama}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {u.email || u.profil_dna?.kontak}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded bg-[#EDEFF0] text-[#191C1E] font-semibold">
                            {u.paketLabel}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {u.kuotaSlot} Slot Terdaftar
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold">
                          {u.koin || 0} Koin
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono">
                          {u.reqCount} Req
                        </td>
                        <td className="py-3.5 px-3 font-mono">
                          <div className="font-bold">
                            {formatTokenSingkat(u.totTok)} Token
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {formatTokenSingkat(u.inTok)} In /{" "}
                            {formatTokenSingkat(u.outTok)} Out
                          </div>
                        </td>
                        <td
                          className={`py-3.5 px-3 text-right font-mono font-bold ${
                            boros ? "text-rose-600" : "text-[#191C1E]"
                          }`}
                        >
                          Rp {u.biayaRp.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              boros
                                ? "bg-rose-100 text-rose-700"
                                : "bg-[#D1F047]/40 text-[#181E00]"
                            }`}
                          >
                            {boros
                              ? "Boros Regenerate"
                              : `Sehat (Margin ${u.marginPersen}%)`}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const jml = prompt(
                                `Ubah jumlah koin untuk ${u.nama}:`,
                                String(u.koin || 0),
                              )
                              if (jml !== null) {
                                updateKoinDatabase(parseInt(jml) || 0, u.id)
                                showToast(`Koin ${u.nama} diperbarui.`)
                              }
                            }}
                            className="cursor-pointer h-8 px-3 rounded-md bg-[#1B1B26] text-[#D1F047] font-bold text-[11px]"
                          >
                            Atur Koin
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 3: Konfigurasi QRIS Statis & Antrean Verifikasi Bukti QRIS */}
          <section
            id="sec-verifikasi"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Left Column: Konfigurasi QRIS Statis (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-[#E7E8EA] p-5 space-y-4">
              <div className="pb-3 border-b border-[#EDEFF0]">
                <h2 className="text-lg font-bold text-[#191C1E]">
                  Konfigurasi QRIS Statis
                </h2>
                <p className="text-xs text-slate-500">
                  Kanal penerimaan otomatis gateway merchant Hookya
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#191C1E] mb-1">
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
                    className="w-full h-10 px-3 rounded-lg border border-[#E7E8EA] text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#191C1E] mb-1">
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
                    className="w-full h-10 px-3 rounded-lg border border-[#E7E8EA] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#191C1E] mb-1">
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
                    className="w-full h-10 px-3 rounded-lg border border-[#E7E8EA] text-xs font-mono"
                  />
                </div>

                <div className="p-3.5 rounded-lg border border-dashed border-slate-300 bg-[#F3F4F6] flex items-center gap-3.5">
                  <div className="w-20 h-20 bg-white p-1.5 rounded-lg border border-[#E7E8EA] flex items-center justify-center shrink-0">
                    {pengaturanPayment.qrisImageUrl ? (
                      <img
                        src={pengaturanPayment.qrisImageUrl}
                        alt="QRIS"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <FlatIcon
                        name="qr"
                        className="w-12 h-12 text-[#191C1E]"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-xs font-bold truncate">
                      Gambar QRIS Statis Merchant
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold text-[#191C1E] underline">
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
                  className="cursor-pointer w-full h-11 rounded-lg bg-[#D1F047] text-[#181E00] text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <FlatIcon name="check" className="w-4 h-4" />
                  <span>Simpan & Terapkan QRIS</span>
                </button>
              </div>
            </div>

            {/* Right Column: Antrean Verifikasi Bukti QRIS (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-[#E7E8EA] p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDEFF0]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#191C1E]">
                      Antrean Verifikasi Bukti QRIS
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-bold">
                      {telemetriAgregat.trxPending.length} Pending
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Konfirmasi bukti transfer masuk dan trigger otomatis alokasi
                    koin + login WA
                  </p>
                </div>
              </div>

              {telemetriAgregat.trxPending.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Tidak ada antrean bukti pembayaran QRIS yang menunggu
                  verifikasi.
                </p>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {telemetriAgregat.trxPending.map((trx) => (
                    <div
                      key={trx.id}
                      className="p-4 rounded-xl border border-[#E7E8EA] bg-white space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs">
                              #{trx.invoice_id}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                              Menunggu Review
                            </span>
                          </div>
                          <div className="text-sm font-bold mt-1">
                            {trx.nama_user}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {trx.nama_paket} (+{trx.jumlah_koin} Koin)
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <div className="text-xl font-bold text-[#191C1E]">
                            Rp{" "}
                            {Number(
                              trx.nominal_bayar || trx.nominal_asli || 0,
                            ).toLocaleString("id-ID")}
                          </div>
                          <div className="text-[11px] text-[#3F4C00] font-semibold">
                            Kode Unik:{" "}
                            {String(trx.nominal_bayar || "").slice(-3)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#EDEFF0]">
                        {trx.bukti_bayar ? (
                          <button
                            type="button"
                            onClick={() => setZoomBuktiUrl(trx.bukti_bayar)}
                            className="cursor-pointer flex items-center gap-2 text-xs font-bold text-[#191C1E] hover:underline"
                          >
                            <img
                              src={trx.bukti_bayar}
                              alt="Bukti"
                              className="w-11 h-11 rounded-lg object-cover border border-slate-300"
                            />
                            <span>Zoom Bukti Transfer</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Tanpa lampiran gambar
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTolakTransaksi(trx)}
                            className="cursor-pointer h-9 px-3 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold"
                          >
                            Tolak
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveTransaksiAdmin(trx)}
                            className="cursor-pointer h-9 px-3.5 rounded-lg bg-[#1B1B26] text-[#D1F047] text-xs font-bold flex items-center gap-1.5"
                          >
                            <FlatIcon name="check" className="w-3.5 h-3.5" />
                            <span>ACC & Kirim Info Login WA</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 4: Kelola Database Pengguna & Filter H-3 Hangus */}
          <section
            id="sec-users"
            className="bg-white rounded-xl border border-[#E7E8EA] p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EDEFF0]">
              <div>
                <h2 className="text-lg font-bold text-[#191C1E]">
                  Database Pengguna & Manajemen Masa Aktif Koin
                </h2>
                <p className="text-xs text-slate-500">
                  Pantau akun aktif, kredensial sandi, akun sosmed terhubung,
                  dan mitigasi koin hangus
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportCSV}
                className="cursor-pointer h-9 px-3.5 rounded-lg border border-[#E7E8EA] bg-white hover:bg-[#F3F4F6] text-xs font-bold flex items-center gap-1.5 self-start"
              >
                <FlatIcon name="upload" className="w-3.5 h-3.5 rotate-180" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  {
                    id: "all",
                    label: `Semua User (${semuaUserDB.length})`,
                  },
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
                        ? "bg-[#1B1B26] text-[#D1F047]"
                        : "bg-[#F3F4F6] text-slate-600 hover:text-[#191C1E]"
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
                className="w-full md:w-64 h-10 px-3.5 rounded-lg border border-[#E7E8EA] text-xs bg-white focus:outline-none focus:border-[#191C1E]"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E7E8EA] text-[11px] text-slate-500 uppercase bg-[#F3F4F6]/60">
                    <th className="py-3 px-3">Pengguna & Kontak</th>
                    <th className="py-3 px-3">Kredensial Sandi</th>
                    <th className="py-3 px-3">Sosmed Terkoneksi</th>
                    <th className="py-3 px-3">Sisa Koin & Rollover</th>
                    <th className="py-3 px-3 text-center">
                      Tindakan Prioritas
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEFF0]">
                  {daftarUserDatabaseTerfilter.map((u) => {
                    const listAkunSosmed = Array.isArray(
                      u.profil_dna?.daftarAkunTernak,
                    )
                      ? u.profil_dna.daftarAkunTernak
                      : []
                    const jmlAkun = Math.max(1, listAkunSosmed.length)
                    const waUser = u.whatsapp || u.profil_dna?.whatsapp || "-"
                    const sandiAsli =
                      u.password_hash || u.profil_dna?.pin || "12345678"
                    const tampilSandi = Boolean(showPassMap[u.id])

                    return (
                      <tr key={u.id} className="hover:bg-[#F3F4F6]/50">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-[#191C1E]">
                            {u.nama}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">
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
                              className="cursor-pointer px-2 py-1 rounded border border-[#E7E8EA] text-[10px] font-bold bg-white"
                            >
                              {tampilSandi ? "Tutup" : "Lihat"}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold">
                            {jmlAkun}/{u.kuotaSlot} Akun Aktif
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate max-w-[180px]">
                            {listAkunSosmed
                              .map((a) => a.labelAkun)
                              .join(", ") || `@${u.username || "utama"}`}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm">
                              {u.koin || 0} Koin
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.sisaHari <= 3
                                  ? "bg-[#D1F047] text-[#181E00]"
                                  : "bg-[#EDEFF0] text-slate-600"
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
                                const bersih = waUser.replace(/\D/g, "")
                                if (!bersih) return
                                const noWa = bersih.startsWith("08")
                                  ? "62" + bersih.slice(1)
                                  : bersih
                                const pesan = encodeURIComponent(
                                  `Halo Kak *${u.nama}*, sisa *${
                                    u.koin || 0
                                  } Koin* Hookya kamu memiliki masa aktif *${
                                    u.sisaHari
                                  } hari lagi*. Yuk perpanjang paket sebelum masa aktif berakhir agar sisa koinmu otomatis diakumulasi (Rollover +30 Hari) di https://hookya.site`,
                                )
                                window.open(
                                  `https://wa.me/${noWa}?text=${pesan}`,
                                  "_blank",
                                )
                              }}
                              className="cursor-pointer h-8 px-2.5 rounded-lg bg-[#1B1B26] text-[#D1F047] text-[11px] font-bold"
                            >
                              WA Pengingat
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePerpanjang30HariUser(u)}
                              className="cursor-pointer h-8 px-2.5 rounded-lg border border-[#E7E8EA] bg-white hover:border-[#191C1E] text-[11px] font-bold"
                            >
                              +30 Hari
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 5: Live Activity Log & Pengaturan Voucher / PIN */}
          <section
            id="sec-logs"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left: Log Aktivitas Pengguna Real-Time (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-[#E7E8EA] p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDEFF0]">
                <div>
                  <h2 className="text-lg font-bold text-[#191C1E]">
                    Log Aktivitas Pengguna Real-Time
                  </h2>
                  <p className="text-xs text-slate-500">
                    Aliran eksekusi prompt AI, ekstraksi audio & pemakaian token
                  </p>
                </div>
              </div>

              {telemetriAgregat.semuaLogAktivitas.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Belum ada aktivitas panggilan AI yang tercatat hari ini.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {telemetriAgregat.semuaLogAktivitas.map((lg, i) => (
                    <div
                      key={lg.id || i}
                      className="p-3 rounded-lg bg-[#F3F4F6] border border-[#E7E8EA] flex items-start justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#191C1E]">
                            @{lg.username}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {lg.waktu}
                          </span>
                        </div>
                        <div className="font-semibold text-[#191C1E] mt-0.5">
                          {lg.action}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {Number(lg.tokens || 0).toLocaleString("id-ID")} Token
                          terpakai (Biaya: Rp {lg.costRp || 48})
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#D1F047]/40 text-[#181E00] text-[10px] font-bold shrink-0">
                        Sukses
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Kelola Voucher & PIN Admin (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-[#E7E8EA] p-5 space-y-4">
              <div className="pb-3 border-b border-[#EDEFF0]">
                <h2 className="text-lg font-bold text-[#191C1E]">
                  Kelola Voucher Promo & PIN Console
                </h2>
                <p className="text-xs text-slate-500">
                  Buat kode voucher koin gratis dan atur PIN akses Developer
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={kodeVoucherBaru}
                  onChange={(e) =>
                    setKodeVoucherBaru(e.target.value.toUpperCase())
                  }
                  placeholder="KODE VOUCHER..."
                  className="flex-1 h-10 px-3 rounded-lg border border-[#E7E8EA] text-xs font-mono uppercase"
                />
                <input
                  type="number"
                  value={koinVoucherBaru}
                  onChange={(e) => setKoinVoucherBaru(e.target.value)}
                  className="w-20 h-10 px-2.5 rounded-lg border border-[#E7E8EA] text-xs font-bold text-center"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!kodeVoucherBaru.trim()) return
                    const vBaru = [
                      ...daftarVoucher,
                      {
                        kode: kodeVoucherBaru.trim().toUpperCase(),
                        koin: parseInt(koinVoucherBaru) || 20,
                        kuota: 100,
                        terpakai: 0,
                      },
                    ]
                    setDaftarVoucher(vBaru)
                    setKodeVoucherBaru("")
                    simpanPengaturanDevKeDB(pengaturanPayment)
                  }}
                  className="cursor-pointer h-10 px-3.5 rounded-lg bg-[#1B1B26] text-[#D1F047] text-xs font-bold shrink-0"
                >
                  + Voucher
                </button>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {daftarVoucher.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#F3F4F6] border border-[#E7E8EA] flex items-center justify-between text-xs"
                  >
                    <span className="font-mono font-bold">
                      {v.kode} (+{v.koin} Koin)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDaftarVoucher(
                          daftarVoucher.filter((_, i) => i !== idx),
                        )
                      }
                      className="cursor-pointer text-rose-600 font-bold text-[11px]"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#EDEFF0] flex items-center gap-2">
                <input
                  type="text"
                  value={pinAdminResmi}
                  onChange={(e) => setPinAdminResmi(e.target.value)}
                  placeholder="PIN Admin..."
                  className="flex-1 h-10 px-3 rounded-lg border border-[#E7E8EA] text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => simpanPengaturanDevKeDB(pengaturanPayment)}
                  className="cursor-pointer h-10 px-4 rounded-lg bg-[#D1F047] text-[#181E00] text-xs font-bold"
                >
                  Simpan PIN
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
