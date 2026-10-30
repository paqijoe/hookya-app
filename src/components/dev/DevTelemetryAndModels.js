"use client";
import { useState } from "react";
import { FlatIcon, DAFTAR_MODEL_OPENROUTER } from "../SharedUI";

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
  const [searchTokenUser, setSearchTokenUser] = useState("");

  const aiModel1Aktif =
    pengaturanPayment?.aiModel1 ||
    pengaturanPayment?.preferredModel ||
    "anthropic/claude-3.5-haiku";
  const aiModel2Aktif =
    pengaturanPayment?.aiModel2 ||
    pengaturanPayment?.preferredModel ||
    "anthropic/claude-3.5-sonnet";

  const [inputCustomAI1, setInputCustomAI1] = useState(aiModel1Aktif);
  const [inputCustomAI2, setInputCustomAI2] = useState(aiModel2Aktif);

  const handleSimpanDualAI = (newModel1, newModel2) => {
    const m1 = (newModel1 || aiModel1Aktif).trim();
    const m2 = (newModel2 || aiModel2Aktif).trim();
    const updated = {
      ...pengaturanPayment,
      aiModel1: m1,
      aiModel2: m2,
      preferredModel: m2,
    };
    setInputCustomAI1(m1);
    setInputCustomAI2(m2);
    setPengaturanPayment(updated);
    simpanPengaturanDevKeDB(updated);
    showToast(`Skema Dual AI disimpan! AI 1: ${m1} | AI 2: ${m2}`);
  };

  const formatTokenSingkat = (n) => {
    const angka = Number(n) || 0;
    if (angka >= 1000000) return `${(angka / 1000000).toFixed(2)}M`;
    if (angka >= 1000) return `${(angka / 1000).toFixed(1)}K`;
    return String(angka);
  };

  const daftarLeaderboardTerfilter = (
    telemetriAgregat?.peringkatUser || []
  ).filter((u) => {
    if (!searchTokenUser.trim()) return true;
    const q = searchTokenUser.toLowerCase();
    return (
      (u.nama || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q)
    );
  });

  if (activeTab === "telemetri") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-[#14141F]">
              Telemetri Finansial & Likuiditas Operasional
            </h2>
            <p className="text-xs text-[#64748B]">
              Ikhtisar uang masuk lunas, beban komputasi token Dual AI, dan margin keuntungan bersih
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-[11px] font-bold text-[#14141F]">
              AI 1 (Brainstorm): {aiModel1Aktif.split("/").pop()}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#14141F] text-[#D4F34A] text-[11px] font-bold">
              AI 2 (Naskah): {aiModel2Aktif.split("/").pop()}
            </span>
          </div>
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
              Akumulasi pemakaian AI 1 & AI 2 di OpenRouter
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
                Atur Skema AI 1 & AI 2
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PANEL UTAMA: SKEMA DUAL AI KUSTOM (AI 1: ASESMEN/BRAINSTORMING vs AI 2: GENERATE NASKAH) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-5">
        <div className="pb-3 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#14141F]">
              Konfigurasi Skema Dual AI (AI 1 Asesmen/Brainstorm & AI 2 Generate Naskah)
            </h2>
            <p className="text-xs text-[#64748B]">
              Pilih dari daftar model OpenRouter atau ketik langsung ID model kustom sesuai kebutuhanmu
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSimpanDualAI(inputCustomAI1, inputCustomAI2)}
            className="cursor-pointer h-10 px-4 rounded-xl bg-[#D4F34A] hover:bg-[#C5E738] text-[#14141F] text-xs font-extrabold flex items-center gap-1.5 self-start shrink-0"
          >
            <FlatIcon name="check" className="w-4 h-4" />
            <span>Simpan AI 1 & AI 2</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* KOTAK AI 1: ASESMEN & BRAINSTORMING */}
          <div className="p-4 rounded-2xl bg-[#F4F5F7] border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md bg-[#14141F] text-[#D4F34A] text-[11px] font-extrabold uppercase">
                AI 1 • Asesmen & Brainstorming Chat
              </span>
              <span className="text-[11px] font-mono font-bold text-[#14141F]">
                Aktif: {aiModel1Aktif.split("/").pop()}
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Digunakan saat tanya-jawab chat topik, menggali 10 masalah audiens, 7 angle produk, dan memilih opsi hook.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#14141F] block">
                Pilih Cepat Model AI 1:
              </label>
              <select
                value={
                  DAFTAR_MODEL_OPENROUTER.some((m) => m.id === inputCustomAI1)
                    ? inputCustomAI1
                    : "__CUSTOM__"
                }
                onChange={(e) => {
                  if (e.target.value !== "__CUSTOM__") {
                    setInputCustomAI1(e.target.value);
                    handleSimpanDualAI(e.target.value, inputCustomAI2);
                  }
                }}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#E2E8F0] text-xs font-bold text-[#14141F]"
              >
                {DAFTAR_MODEL_OPENROUTER.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama} ({m.id})
                  </option>
                ))}
                <option value="__CUSTOM__">Model ID Kustom OpenRouter...</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#64748B] block">
                Atau Ketik Kustom ID Model OpenRouter untuk AI 1:
              </label>
              <input
                type="text"
                value={inputCustomAI1}
                onChange={(e) => setInputCustomAI1(e.target.value)}
                placeholder="Contoh: anthropic/claude-3.5-haiku"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#14141F] font-mono text-xs text-[#14141F]"
              />
            </div>
          </div>

          {/* KOTAK AI 2: GENERATE NASKAH SKRIP */}
          <div className="p-4 rounded-2xl bg-[#F4F5F7] border border-[#14141F] space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md bg-[#D4F34A] text-[#14141F] text-[11px] font-extrabold uppercase">
                AI 2 • Generate Naskah Final
              </span>
              <span className="text-[11px] font-mono font-bold text-[#14141F]">
                Aktif: {aiModel2Aktif.split("/").pop()}
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Digunakan khusus saat pengguna menekan tombol Generate Teks Naskah untuk menyusun skrip akhir yang natural.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#14141F] block">
                Pilih Cepat Model AI 2:
              </label>
              <select
                value={
                  DAFTAR_MODEL_OPENROUTER.some((m) => m.id === inputCustomAI2)
                    ? inputCustomAI2
                    : "__CUSTOM__"
                }
                onChange={(e) => {
                  if (e.target.value !== "__CUSTOM__") {
                    setInputCustomAI2(e.target.value);
                    handleSimpanDualAI(inputCustomAI1, e.target.value);
                  }
                }}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#E2E8F0] text-xs font-bold text-[#14141F]"
              >
                {DAFTAR_MODEL_OPENROUTER.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama} ({m.id})
                  </option>
                ))}
                <option value="__CUSTOM__">Model ID Kustom OpenRouter...</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#64748B] block">
                Atau Ketik Kustom ID Model OpenRouter untuk AI 2:
              </label>
              <input
                type="text"
                value={inputCustomAI2}
                onChange={(e) => setInputCustomAI2(e.target.value)}
                placeholder="Contoh: anthropic/claude-3.5-sonnet"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#14141F] font-mono text-xs text-[#14141F]"
              />
            </div>
          </div>
        </div>

        {/* Katalog Referensi Model & Tarif Biaya */}
        <div className="pt-2 space-y-2.5">
          <span className="text-xs font-bold text-[#14141F] block">
            Katalog Model & Daftar Biaya per 1K Token (Klik tombol di kartu untuk menerapkan ke AI 1 atau AI 2):
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DAFTAR_MODEL_OPENROUTER.map((m) => {
              const isAI1 = aiModel1Aktif === m.id;
              const isAI2 = aiModel2Aktif === m.id;
              const statPemakaian = telemetriAgregat.rekapPerModel?.[m.id] || {
                requests: 0,
                tokens: 0,
                costRp: 0,
              };

              return (
                <div
                  key={m.id}
                  className={`rounded-2xl p-3.5 border flex flex-col justify-between gap-3 ${
                    isAI1 || isAI2
                      ? "border-2 border-[#14141F] bg-[#F8F9FA]"
                      : "border border-[#E2E8F0] bg-white"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-[#F4F5F7] border border-[#E2E8F0] text-[10px] font-bold text-[#14141F] uppercase">
                        {m.provider}
                      </span>
                      <div className="flex items-center gap-1">
                        {isAI1 && (
                          <span className="px-2 py-0.5 rounded bg-[#14141F] text-[#D4F34A] text-[10px] font-extrabold">
                            AI 1 Aktif
                          </span>
                        )}
                        {isAI2 && (
                          <span className="px-2 py-0.5 rounded bg-[#D4F34A] text-[#14141F] text-[10px] font-extrabold">
                            AI 2 Aktif
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-[#14141F]">
                      {m.nama}
                    </h3>
                    <p className="text-[11px] text-[#64748B] leading-snug">
                      {m.ket}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#E2E8F0] text-xs">
                    <div className="grid grid-cols-2 gap-1.5 bg-[#F4F5F7] p-2 rounded-lg">
                      <div>
                        <span className="text-[10px] text-[#64748B] block">
                          Input / 1K:
                        </span>
                        <strong className="font-mono text-[#14141F]">
                          Rp {m.inputPer1kRp}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] block">
                          Output / 1K:
                        </span>
                        <strong className="font-mono text-[#14141F]">
                          Rp {m.outputPer1kRp}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>Terpakai: {statPemakaian.requests}x</span>
                      <strong className="font-mono text-[#14141F]">
                        Rp {statPemakaian.costRp.toLocaleString("id-ID")}
                      </strong>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSimpanDualAI(m.id, aiModel2Aktif)}
                        className={`cursor-pointer py-1.5 rounded-lg text-[11px] font-bold border transition ${
                          isAI1
                            ? "bg-[#14141F] text-[#D4F34A] border-[#14141F]"
                            : "bg-white text-[#14141F] border-[#E2E8F0] hover:border-[#14141F]"
                        }`}
                      >
                        Jadikan AI 1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimpanDualAI(aiModel1Aktif, m.id)}
                        className={`cursor-pointer py-1.5 rounded-lg text-[11px] font-bold border transition ${
                          isAI2
                            ? "bg-[#D4F34A] text-[#14141F] border-[#14141F]"
                            : "bg-white text-[#14141F] border-[#E2E8F0] hover:border-[#14141F]"
                        }`}
                      >
                        Jadikan AI 2
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabel Peringkat & Audit Biaya Token per User */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-base font-bold text-[#14141F]">
              Peringkat & Audit Biaya Penggunaan Token per User
            </h3>
            <p className="text-xs text-[#64748B]">
              Pantau total permintaan AI 1 & AI 2, jumlah token masuk/keluar, dan biaya riil Rupiah setiap pengguna
            </p>
          </div>
          <input
            type="text"
            value={searchTokenUser}
            onChange={(e) => setSearchTokenUser(e.target.value)}
            placeholder="Cari nama, email, atau username..."
            className="w-full md:w-64 h-10 px-3.5 rounded-lg border border-[#E2E8F0] text-xs bg-white focus:border-[#14141F] focus:outline-none"
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
                const boros = u.marginPersen < 40;
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
                            String(u.koin || 0)
                          );
                          if (jml !== null) {
                            updateKoinDatabase(parseInt(jml) || 0, u.id);
                            showToast(`Saldo koin ${u.nama} diperbarui.`);
                          }
                        }}
                        className="cursor-pointer h-9 px-3 rounded-lg bg-[#14141F] text-[#D4F34A] font-bold text-[11px]"
                      >
                        Edit Koin
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}