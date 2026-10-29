"use client"
import { useState, useMemo } from "react"
import { FlatIcon, HookyaLogo, hitungKuotaAkunDariPaket } from "./SharedUI"
import DevTelemetryAndModels from "./dev/DevTelemetryAndModels"
import DevOpsAndLogs from "./dev/DevOpsAndLogs"

function hitungSisaHari(expiredAtStr) {
  if (!expiredAtStr) return 30
  const selisih = Math.ceil(
    (new Date(expiredAtStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  return Math.max(0, selisih)
}

const MENU_DEV_CONSOLE = [
  { id: "telemetri", label: "Telemetri Finansial", icon: "chart" },
  { id: "models", label: "Uji Coba Model & Biaya", icon: "code" },
  { id: "qris", label: "Verifikasi QRIS", icon: "qr" },
  { id: "branding", label: "Logo, Voucher & PIN", icon: "settings" },
  { id: "users", label: "Database User", icon: "users" },
  { id: "brain_logs", label: "Memori Otak AI & Log", icon: "brain" },
]

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
  const [activeTab, setActiveTab] = useState("telemetri")
  const [zoomBuktiUrl, setZoomBuktiUrl] = useState(null)

  const brandConfig = pengaturanPayment?.brandConfig || {
    logoPngUrl: "",
    logoGapPx: 6,
    brandText: "OOKYA",
    showBrandText: true,
  }

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
    const semuaGlobalBrain = []
    const rekapPerModel = {}

    const peringkatUser = semuaUserDB.map((u) => {
      const tel = u.profil_dna?.telemetry || {}
      const inTok = Number(tel.promptTokens) || 0
      const outTok = Number(tel.completionTokens) || 0
      const totTok = Number(tel.totalTokens) || inTok + outTok
      const biayaRp =
        Number(tel.totalCostRp) || Math.round((totTok / 1000) * 12)
      const reqCount = Number(tel.totalRequests) || 0

      totalPromptTokens += inTok
      totalCompletionTokens += outTok
      totalBiayaApi += biayaRp

      if (tel.modelBreakdown && typeof tel.modelBreakdown === "object") {
        Object.entries(tel.modelBreakdown).forEach(([mId, st]) => {
          if (!rekapPerModel[mId]) {
            rekapPerModel[mId] = { requests: 0, tokens: 0, costRp: 0 }
          }
          rekapPerModel[mId].requests += Number(st.requests) || 0
          rekapPerModel[mId].tokens += Number(st.tokens) || 0
          rekapPerModel[mId].costRp += Number(st.costRp) || 0
        })
      }

      if (Array.isArray(tel.recentLogs)) {
        tel.recentLogs.forEach((lg) => {
          semuaLogAktivitas.push({
            ...lg,
            username: u.username || u.nama || "user",
          })
        })
      }

      if (Array.isArray(tel.globalBrainPairs)) {
        tel.globalBrainPairs.forEach((gb) => {
          semuaGlobalBrain.push({
            ...gb,
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
          : 80

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
        : "88.0"

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
      rekapPerModel,
      semuaLogAktivitas: semuaLogAktivitas.slice(0, 40),
      semuaGlobalBrain: semuaGlobalBrain.slice(0, 40),
    }
  }, [semuaUserDB, daftarTransaksi])

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#14141F] font-sans antialiased">
      {zoomBuktiUrl && (
        <div
          onClick={() => setZoomBuktiUrl(null)}
          className="fixed inset-0 z-50 bg-[#14141F]/60 flex items-center justify-center p-4"
        >
          <div className="bg-white p-4 rounded-2xl border border-[#14141F] max-w-md w-full space-y-3">
            <img
              src={zoomBuktiUrl}
              alt="Bukti Transfer"
              className="w-full max-h-[72vh] object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={() => setZoomBuktiUrl(null)}
              className="cursor-pointer w-full h-11 bg-[#14141F] text-[#D4F34A] rounded-lg text-xs font-bold"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HookyaLogo brandConfig={brandConfig} />
          <span className="px-2.5 py-0.5 rounded-md bg-[#D4F34A] text-[#14141F] text-xs font-bold uppercase tracking-wider">
            Developer Console
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => muatUlangDataSupabase && muatUlangDataSupabase()}
            className="cursor-pointer h-10 px-3 rounded-lg bg-[#F4F5F7] hover:bg-[#E2E8F0] text-[#14141F] text-xs font-bold flex items-center gap-1.5 border border-[#E2E8F0]"
          >
            <FlatIcon name="refresh" className="w-4 h-4" />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToUserView}
            className="cursor-pointer h-10 px-3.5 rounded-lg bg-[#14141F] text-[#D4F34A] text-xs font-bold flex items-center gap-1.5"
          >
            <FlatIcon name="arrowLeft" className="w-4 h-4" />
            <span>Ke Aplikasi User</span>
          </button>
        </div>
      </header>

      {/* SIDEBAR KIRI (LAYAR DESKTOP) */}
      <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-[#E2E8F0] z-30 flex-col justify-between p-4">
        <div className="space-y-2">
          <div className="px-2 pb-1 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            Menu Pengendali (Per Layar)
          </div>
          <nav className="flex flex-col gap-1.5">
            {MENU_DEV_CONSOLE.map((item) => {
              const aktif = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`cursor-pointer w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition ${
                    aktif
                      ? "bg-[#14141F] text-[#D4F34A]"
                      : "text-[#14141F] hover:bg-[#F4F5F7]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FlatIcon name={item.icon} className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.id === "qris" &&
                    telemetriAgregat.trxPending.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-[#EF4444] text-white text-[10px]">
                        {telemetriAgregat.trxPending.length}
                      </span>
                    )}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F4F5F7] border border-[#E2E8F0] text-[11px] space-y-1.5">
          <div className="flex justify-between text-[#64748B]">
            <span>Model Aktif</span>
            <strong className="text-[#14141F] truncate max-w-[115px]">
              {(pengaturanPayment?.preferredModel || "gemini-2.5-flash")
                .split("/")
                .pop()}
            </strong>
          </div>
          <div className="flex justify-between text-[#64748B]">
            <span>Total Pengguna</span>
            <strong className="text-[#14141F]">
              {semuaUserDB.length} Akun
            </strong>
          </div>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA (HANYA MERENDER 1 MENU AKTIF) */}
      <div className="lg:pl-64 pt-16">
        {/* Navigasi Tab Horizontal untuk Mobile & Tablet */}
        <div className="lg:hidden bg-white border-b border-[#E2E8F0] px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
          {MENU_DEV_CONSOLE.map((item) => {
            const aktif = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`cursor-pointer shrink-0 h-10 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  aktif
                    ? "bg-[#14141F] text-[#D4F34A]"
                    : "bg-[#F4F5F7] text-[#14141F] border border-[#E2E8F0]"
                }`}
              >
                <FlatIcon name={item.icon} className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        <main className="w-full px-4 sm:px-6 py-6 max-w-6xl mx-auto">
          {(activeTab === "telemetri" || activeTab === "models") && (
            <DevTelemetryAndModels
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              telemetriAgregat={telemetriAgregat}
              pengaturanPayment={pengaturanPayment}
              setPengaturanPayment={setPengaturanPayment}
              simpanPengaturanDevKeDB={simpanPengaturanDevKeDB}
              updateKoinDatabase={updateKoinDatabase}
              showToast={showToast}
            />
          )}

          {(activeTab === "qris" ||
            activeTab === "branding" ||
            activeTab === "users" ||
            activeTab === "brain_logs") && (
            <DevOpsAndLogs
              activeTab={activeTab}
              telemetriAgregat={telemetriAgregat}
              semuaUserDB={semuaUserDB}
              pengaturanPayment={pengaturanPayment}
              setPengaturanPayment={setPengaturanPayment}
              pinAdminResmi={pinAdminResmi}
              setPinAdminResmi={setPinAdminResmi}
              daftarVoucher={daftarVoucher}
              setDaftarVoucher={setDaftarVoucher}
              handleApproveTransaksiAdmin={handleApproveTransaksiAdmin}
              simpanPengaturanDevKeDB={simpanPengaturanDevKeDB}
              muatUlangDataSupabase={muatUlangDataSupabase}
              setZoomBuktiUrl={setZoomBuktiUrl}
              showToast={showToast}
            />
          )}
        </main>
      </div>
    </div>
  )
}
