"use client"
import { useState } from "react"
import { FlatIcon, DAFTAR_MODEL_OPENROUTER } from "../SharedUI"

export default function DevTelemetryAndModels({
  activeTab,
  setActiveTab,
  telemetriAgregat,
  pengaturanPayment,
  setPengaturanPayment,
  simpanPengaturanDevKeDB,
  updateKoinDatabase,
  showToast,
}) {
  const [searchTokenUser, setSearchTokenUser] = useState("")

  const modelAktifId =
    pengaturanPayment?.preferredModel || "google/gemini-2.5-flash"

  const handlePilihModelOpenRouter = (modelId) => {
    const updated = {
      ...pengaturanPayment,
      preferredModel: modelId,
    }
    setPengaturanPayment(updated)
    simpanPengaturanDevKeDB(updated)
    showToast(`Model AI utama diubah ke: ${modelId}`)
  }

  const formatTokenSingkat = (n) => {
    const angka = Number(n) || 0
    if (angka >= 1000000) return `${(angka / 1000000).toFixed(2)}M`
    if (angka >= 1000) return `${(angka / 1000).toFixed(1)}K`
    return String(angka)
  }

  const daftarLeaderboardTerfilter = (
    telemetriAgregat?.peringkatUser || []
  ).filter((u) => {
    if (!searchTokenUser.trim()) return true
    const q = searchTokenUser.toLowerCase()
    return (
      (u.nama || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q)
    )
  })

  if (activeTab === "telemetri") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-[#14141F]">
              Telemetri Finansial & Likuiditas Operasional
            </h2>
            <p className="text-xs text-[#64748B]">
              Ikhtisar uang masuk lunas, beban komputasi token AI, dan margin
              keuntungan bersih
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-bold text-[#14141F] self-start">
            Model Aktif: {modelAktifId.split("/").pop()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#64748B] uppercase font-bold tracking-wider">
                Total Uang Masuk (Lunas)
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#D4F34A] text-[#14141F] flex items-center justify-center">
                <FlatIcon name="coin" className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-[#14141F] tabular-nums">
              Rp {telemetriAgregat.totalUangMasuk.toLocaleString("id-ID")}
            </div>
            <div className="mt-4 pt-3 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
              Dari{" "}
              <strong className="text-[#14141F]">
                {telemetriAgregat.jumlahTrxLunas} transaksi
              </strong>{" "}
              pendaftaran & top-up koin
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#64748B] uppercase font-bold tracking-wider">
                Pengeluaran Token API
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#F4F5F7] text-[#14141F] flex items-center justify-center border border-[#E2E8F0]">
                <FlatIcon name="code" className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#14141F] tabular-nums">
                Rp {telemetriAgregat.totalBiayaApi.toLocaleString("id-ID")}
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">
                <strong className="font-mono text-[#14141F]">
                  {formatTokenSingkat(telemetriAgregat.totalTokensGabungan)}
                </strong>{" "}
                total prompt + completion
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
              Dihitung akurat sesuai tarif model OpenRouter
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#64748B] uppercase font-bold tracking-wider">
                Estimasi Laba Bersih
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#D4F34A] text-[#14141F] flex items-center justify-center">
                <FlatIcon name="chart" className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#14141F] tabular-nums">
                Rp {telemetriAgregat.labaBersih.toLocaleString("id-ID")}
              </div>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-[#D4F34A] text-[#14141F] text-[11px] font-bold">
                Margin Bersih: {telemetriAgregat.marginTotal}%
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
              Kas masuk dikurangi total biaya API
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-[#14141F] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#14141F] uppercase font-bold tracking-wider">
                Tindakan Prioritas Admin
              </span>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveTab("qris")}
                className="cursor-pointer w-full flex items-center justify-between bg-[#F4F5F7] hover:bg-[#E2E8F0] px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs transition"
              >
                <span>Bukti QRIS Pending</span>
                <strong className="font-mono text-[#EF4444]">
                  {telemetriAgregat.trxPending.length} Verifikasi
                </strong>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className="cursor-pointer w-full flex items-center justify-between bg-[#F4F5F7] hover:bg-[#E2E8F0] px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs transition"
              >
                <span>Koin H-3 Hangus</span>
                <strong className="font-mono text-[#14141F]">
                  {telemetriAgregat.akunH3Hangus.length} Akun
                </strong>
              </button>
            </div>
            <div className="mt-3 pt-2 border-t border-[#E2E8F0] text-right">
              <button
                type="button"
                onClick={() => setActiveTab("models")}
                className="cursor-pointer text-xs font-bold text-[#14141F] underline"
              >
                Atur Model AI & Biaya
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bagian 1: Pilihan Uji Coba Model OpenRouter & Daftar Biaya */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-lg font-bold text-[#14141F]">
              Pengaturan Uji Coba Model OpenRouter & Daftar Biaya
            </h2>
            <p className="text-xs text-[#64748B]">
              Pilih model AI utama yang akan memproses sesi chat, peracik Hook 3
              detik, dan naskah 6 langkah seluruh pengguna
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-[#D4F34A] text-[#14141F] text-xs font-bold self-start">
            Aktif: {modelAktifId}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {DAFTAR_MODEL_OPENROUTER.map((m) => {
            const sedangDipilih = modelAktifId === m.id
            const statPemakaian = telemetriAgregat.rekapPerModel?.[m.id] || {
              requests: 0,
              tokens: 0,
              costRp: 0,
            }

            return (
              <div
                key={m.id}
                onClick={() => handlePilihModelOpenRouter(m.id)}
                className={`cursor-pointer rounded-2xl p-4 border transition flex flex-col justify-between gap-3 ${
                  sedangDipilih
                    ? "border-2 border-[#14141F] bg-[#F8F9FA]"
                    : "border border-[#E2E8F0] bg-white hover:border-[#14141F]"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#F4F5F7] border border-[#E2E8F0] text-[10px] font-bold text-[#14141F] uppercase">
                      {m.provider}
                    </span>
                    {sedangDipilih ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-[#D4F34A] text-[#14141F] text-[10px] font-extrabold">
                        MODEL AKTIF
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#64748B]">
                        Klik untuk Pakai
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#14141F]">
                      {m.nama}
                    </h3>
                    <span className="text-[11px] font-semibold text-[#556500] block">
                      {m.kategori}
                    </span>
                  </div>

                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {m.ket}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-[#F4F5F7] p-2 rounded-lg">
                    <div>
                      <span className="text-[10px] text-[#64748B] block">
                        Tarif Input / 1K:
                      </span>
                      <strong className="font-mono text-[#14141F]">
                        Rp {m.inputPer1kRp}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block">
                        Tarif Output / 1K:
                      </span>
                      <strong className="font-mono text-[#14141F]">
                        Rp {m.outputPer1kRp}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#64748B] px-1">
                    <span>Terpakai: {statPemakaian.requests}x Req</span>
                    <strong className="font-mono text-[#14141F]">
                      Total: Rp {statPemakaian.costRp.toLocaleString("id-ID")}
                    </strong>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bagian 2: Tabel Peringkat & Audit Biaya Token per User */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-base font-bold text-[#14141F]">
              Peringkat & Audit Biaya Penggunaan Token per User
            </h3>
            <p className="text-xs text-[#64748B]">
              Pantau total permintaan AI, jumlah token masuk/keluar, dan biaya
              riil Rupiah setiap pengguna
            </p>
          </div>
          <input
            type="text"
            value={searchTokenUser}
            onChange={(e) => setSearchTokenUser(e.target.value)}
            placeholder="Cari nama, email, atau username..."
            className="w-full md:w-64 h-11 px-3.5 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:border-[#14141F] focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[11px] text-[#64748B] uppercase bg-[#F4F5F7]">
                <th className="py-3 px-3">Peringkat</th>
                <th className="py-3 px-3">Pengguna</th>
                <th className="py-3 px-3">Paket & Kuota</th>
                <th className="py-3 px-3 text-right">Sisa Koin</th>
                <th className="py-3 px-3 text-right">Request AI</th>
                <th className="py-3 px-3">Total Token (In / Out)</th>
                <th className="py-3 px-3 text-right">Biaya API Riil</th>
                <th className="py-3 px-3 text-center">Status Margin</th>
                <th className="py-3 px-3 text-center">Kelola Koin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {daftarLeaderboardTerfilter.map((u, idx) => {
                const boros = u.marginPersen < 40
                return (
                  <tr key={u.id} className="hover:bg-[#F4F5F7]/60">
                    <td className="py-3.5 px-3 font-mono font-bold text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] ${
                          idx === 0
                            ? "bg-[#D4F34A] text-[#14141F]"
                            : "bg-[#F4F5F7] text-[#14141F]"
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#14141F]">{u.nama}</div>
                      <div className="text-[11px] text-[#64748B] font-mono">
                        {u.email || u.profil_dna?.kontak}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#F4F5F7] border border-[#E2E8F0] text-[#14141F] font-semibold">
                        {u.paketLabel}
                      </span>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        {u.kuotaSlot} Slot Akun
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums">
                      {u.koin || 0} Koin
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                      {u.reqCount}x
                    </td>
                    <td className="py-3.5 px-3 font-mono">
                      <div className="font-bold text-[#14141F]">
                        {formatTokenSingkat(u.totTok)} Token
                      </div>
                      <div className="text-[10px] text-[#64748B]">
                        {formatTokenSingkat(u.inTok)} In /{" "}
                        {formatTokenSingkat(u.outTok)} Out
                      </div>
                    </td>
                    <td
                      className={`py-3.5 px-3 text-right font-mono font-bold tabular-nums ${
                        boros ? "text-[#EF4444]" : "text-[#14141F]"
                      }`}
                    >
                      Rp {u.biayaRp.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          boros
                            ? "bg-[#FEF2F2] text-[#EF4444] border border-[#EF4444]"
                            : "bg-[#D4F34A] text-[#14141F]"
                        }`}
                      >
                        {boros ? "Boros" : `Sehat (${u.marginPersen}%)`}
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
                            showToast(`Saldo koin ${u.nama} diperbarui.`)
                          }
                        }}
                        className="cursor-pointer h-9 px-3 rounded-lg bg-[#14141F] text-[#D4F34A] font-bold text-[11px]"
                      >
                        Edit Koin
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
