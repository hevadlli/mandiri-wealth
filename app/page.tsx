"use client";

import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, Cake, Upload, Search, PieChart as PieIcon, Users,
  CheckCircle2, Download, MessageCircle, TrendingUp, Calendar,
  AlertCircle, BarChart3, Zap, Table, Eye, X, Hash, Wallet, ChevronRight, Contact2,
  Target
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

// --- UTILS & FORMATTERS ---
const formatDateIndo = (dateInput: any) => {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  return isNaN(date.getTime()) ? dateInput : date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatRupiah = (num: any) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0
}).format(num || 0);

const calculateAge = (birthDate: any) => {
  if (!birthDate) return "-";
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// --- REUSABLE SUB-COMPONENTS ---
const StatCard = ({ label, val, color, icon }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
    <div className="flex items-center gap-2 mb-2 text-slate-400 font-black uppercase text-[9px] tracking-widest">
      {icon} {label}
    </div>
    <p className={`text-3xl font-black ${color}`}>{val}</p>
  </div>
);

const InfoRow = ({ label, val, color = "text-slate-800" }: any) => (
  <div className="border-b border-slate-50 pb-2">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`font-black uppercase tracking-tight ${color}`}>{val || "-"}</p>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [menu, setMenu] = useState("Monitoring");
  const [searchTerm, setSearchTerm] = useState("");

  // MODAL STATES
  const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // --- DATA HANDLING ---
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      if (typeof bstr !== 'string') return;
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(ws) as any[];
      setData(rawData.map((item, index) => ({
        ...item,
        id: index,
        Status_Approach: String(item.Status_Approach || "Belum").trim(),
        Status_Response: String(item.Status_Response || "Belum Response").trim(),
        Score_Individu: Number(item.Score_Individu) || 0,
      })));
    };
    reader.readAsBinaryString(file);
  };

  // Line 100
  const downloadExcel = () => {
    // Tambahkan validasi agar tidak download file kosong
    if (data.length === 0) return alert("Data kosong!");

    const exportData = data.map(({ id, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Wealth_Export");

    // Perbaikan penamaan file agar tanggalnya benar
    const dateString = new Date().toISOString().split('T');
    XLSX.writeFile(workbook, `Mandiri_Wealth_Update_${dateString}.xlsx`);
  };

  const updateField = (id: number, field: string, newValue: string) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, [field]: newValue } : item));
  };

  // --- ANALYTICS & GROUPING LOGIC ---
  const stats = useMemo(() => {
    const total = data.length;
    const contacted = data.filter(d => d.Status_Approach === 'Sudah').length;
    const success = data.filter(d => d.Status_Response === 'Berhasil').length;
    return {
      total, contacted, success,
      overdue: data.filter(d => d.Target_Date && new Date(d.Target_Date) < new Date() && d.Status_Response !== 'Berhasil').length,
      convRate: contacted > 0 ? ((success / contacted) * 100).toFixed(1) : "0",
      approachChart: [
        { name: 'Sudah', value: contacted, color: '#3B82F6' },
        { name: 'Belum', value: total - contacted, color: '#E2E8F0' }
      ].filter(i => i.value > 0),
      responseChart: [
        { name: 'Berhasil', value: success, color: '#10B981' },
        { name: 'Proses', value: data.filter(d => d.Status_Response?.toLowerCase() === 'proses').length, color: '#F59E0B' },
        { name: 'Ditolak', value: data.filter(d => d.Status_Response?.toLowerCase() === 'ditolak').length, color: '#EF4444' },
        { name: 'Belum', value: data.filter(d => d.Status_Response?.toLowerCase() === 'belum response').length, color: '#94A3B8' }
      ].filter(i => i.value > 0),
      segments: [
        { name: 'High', count: data.filter(d => d.Score_Individu >= 70).length, color: '#1E3A8A' },
        { name: 'Med', count: data.filter(d => d.Score_Individu >= 50 && d.Score_Individu < 70).length, color: '#3B82F6' },
        { name: 'Low', count: data.filter(d => d.Score_Individu < 50).length, color: '#93C5FD' },
      ]
    };
  }, [data]);

  const stackedStats = useMemo(() => {
    let totalInitial = 0;
    let success = 0;
    let rejected = 0;

    data.forEach(item => {
      const val = (Number(item.Potensi_Keluarga) || 0) + (Number(item.Potensi_Wealth) || 0);
      totalInitial += val;
      if (item.Status_Response === 'Berhasil') success += val;
      if (item.Status_Response === 'Ditolak') rejected += val;
    });

    const inProgress = totalInitial - success - rejected;

    // Hitung Persentase
    const getPct = (val: number) => (totalInitial > 0 ? (val / totalInitial) * 100 : 0);

    return {
      total: totalInitial,
      success: { val: success, pct: getPct(success) },
      inProgress: { val: inProgress, pct: getPct(inProgress) },
      rejected: { val: rejected, pct: getPct(rejected) }
    };
  }, [data]);

  const groupedNasabah = useMemo(() => {
    const groups: any = {};
    data.forEach(item => {
      if (!groups[item.Nama_Nasabah]) {
        groups[item.Nama_Nasabah] = {
          Nama_Nasabah: item.Nama_Nasabah,
          CIF: item.CIF,
          NIK: item.NIK_Nasabah,
          // Ambil saldo prioritas nasabah utama (hanya sekali)
          Saldo_Prioritas: Number(item.Saldo) || 0,
          // Tempat menampung total saldo seluruh anggota keluarga
          Total_Aset_Keluarga: 0,
          Max_Score: 0,
          Potential_CIF_Sum: 0,
          Keluarga: []
        };
      }

      groups[item.Nama_Nasabah].Keluarga.push(item);

      // JUMLAHKAN Saldo_Keluarga (saldo individu masing-masing anggota)
      groups[item.Nama_Nasabah].Total_Aset_Keluarga += (Number(item.Saldo_Keluarga) || 0);

      groups[item.Nama_Nasabah].Max_Score = Math.max(groups[item.Nama_Nasabah].Max_Score, item.Score_Individu);
      // Mengonversi masing-masing nilai ke Number secara individu agar jika salah satu kosong (null/undefined) tidak merusak hasil tambah
      groups[item.Nama_Nasabah].Potential_CIF_Sum += (Number(item.Potensi_Keluarga) || 0) + (Number(item.Potensi_Wealth) || 0);
    });

    return Object.values(groups).sort((a: any, b: any) => b.Max_Score - a.Max_Score);
  }, [data]);

  const filteredLeads = useMemo(() => {
    return data.filter(item =>
      item.Nama_Nasabah?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Nama_Keluarga?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.Score_Individu - a.Score_Individu);
  }, [data, searchTerm]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">

      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r p-6 flex flex-col shadow-sm z-20">
        <div className="mb-10 px-2">
          <h1 className="text-2xl font-black text-blue-700 tracking-tighter uppercase italic">Mandiri <span className="text-yellow-500">Wealth</span></h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Jakarta Puncak Emas</p>
        </div>
        <nav className="space-y-1 flex-1">
          {['Monitoring', 'ActiveLeads', 'Birthday'].map((m) => (
            <button key={m} onClick={() => setMenu(m)} className={`w-full flex items-center gap-3 p-3 rounded-2xl font-bold transition-all ${menu === m ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-500 hover:bg-slate-50"}`}>
              {m === 'Monitoring' ? <LayoutDashboard size={20} /> : m === 'ActiveLeads' ? <Table size={20} /> : <Cake size={20} />} {m}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <button onClick={downloadExcel} className="w-full flex items-center justify-center gap-2 p-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-md">
            <Download size={16} /> Export Updated Data
          </button>
          <label className="flex items-center justify-center gap-2 p-3.5 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-blue-50 transition-all text-xs font-bold text-slate-500">
            <Upload size={16} /> Import Excel
            <input type="file" className="hidden" onChange={handleUpload} accept=".xlsx, .csv" />
          </label>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-10">
        {data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40"><Users size={64} className="mb-4" /><h2 className="text-xl font-black italic text-center">Silahkan Import Database Nasabah</h2></div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-10 pb-20">
            <header className="flex justify-between items-end">
              <div><h2 className="text-4xl font-black text-slate-800 uppercase italic tracking-tighter">{menu}</h2></div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Cari Nasabah..." className="pl-12 pr-6 py-3 bg-white border rounded-2xl w-80 outline-none focus:ring-4 focus:ring-blue-50" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </header>

            {/* --- PAGE: MONITORING --- */}
            {menu === "Monitoring" && (
              <div className="space-y-10">
                <div className="grid grid-cols-4 gap-6">
                  <StatCard label="Total Leads" val={stats.total} icon={<Users size={16} />} />
                  <StatCard label="Overdue" val={stats.overdue} color="text-red-600" icon={<AlertCircle size={16} />} />
                  <StatCard label="Closing" val={stats.success} color="text-emerald-600" icon={<CheckCircle2 size={16} />} />
                  <StatCard label="Conv. Rate" val={`${stats.convRate}%`} color="text-blue-600" icon={<TrendingUp size={16} />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2rem] border shadow-sm h-[380px] flex flex-col">
                    <h3 className="font-black text-slate-700 mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><PieIcon size={14} /> Pipeline Status</h3>
                    <div className="flex-1 flex gap-4 overflow-hidden">
                      <div className="flex-1 h-full"><p className="text-[9px] font-black text-center text-slate-400 uppercase mb-2">Approach</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart><Pie data={stats.approachChart} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">{stats.approachChart.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}</Pie><Tooltip /></PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 h-full border-l border-slate-50"><p className="text-[9px] font-black text-center text-slate-400 uppercase mb-2">Response</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart><Pie data={stats.responseChart} innerRadius={0} outerRadius={70} dataKey="value">{stats.responseChart.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}</Pie><Tooltip /><Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} /></PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border shadow-sm h-[380px] flex flex-col">
                    <h3 className="font-black text-slate-700 mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><BarChart3 size={14} /> Potential Segmentation</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.segments} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} width={60} /><Tooltip cursor={{ fill: 'transparent' }} /><Bar dataKey="count" barSize={25}>{stats.segments.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar></BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-10 rounded-[2rem] border shadow-sm space-y-8">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                        <Zap size={16} className="text-yellow-500 fill-yellow-500" />Pipeline Realization Rate
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">DISTRIBUSI POTENSI BERDASARKAN STATUS RESPONSE</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Total Portfolio Value</p>
                      <p className="text-xl font-black text-slate-800 italic">
                        {(stackedStats.total / 1000000000).toFixed(1)}M <span className="text-[10px] text-slate-400">IDR</span>
                      </p>
                    </div>
                  </div>

                  {/* THE STACKED PROGRESS BAR */}
                  <div className="relative">
                    <div className="w-full h-12 bg-slate-100 rounded-2xl flex overflow-hidden shadow-inner border border-slate-50">
                      {/* SEGMENT 1: BERHASIL (GREEN) */}
                      <div
                        style={{ width: `${stackedStats.success.pct}%` }}
                        className="h-full bg-emerald-500 transition-all duration-700 ease-out flex items-center justify-center text-white text-[10px] font-black border-r border-white/20"
                      >
                        {stackedStats.success.pct > 5 && `${stackedStats.success.pct.toFixed(0)}%`}
                      </div>

                      {/* SEGMENT 2: IN PROGRESS (BLUE) */}
                      <div
                        style={{ width: `${stackedStats.inProgress.pct}%` }}
                        className="h-full bg-blue-600 transition-all duration-700 ease-out flex items-center justify-center text-white text-[10px] font-black border-r border-white/20"
                      >
                        {stackedStats.inProgress.pct > 5 && `${stackedStats.inProgress.pct.toFixed(0)}%`}
                      </div>

                      {/* SEGMENT 3: DITOLAK/LOST (GRAY/RED) */}
                      <div
                        style={{ width: `${stackedStats.rejected.pct}%` }}
                        className="h-full bg-slate-300 transition-all duration-700 ease-out flex items-center justify-center text-slate-500 text-[10px] font-black"
                      >
                        {stackedStats.rejected.pct > 5 && `${stackedStats.rejected.pct.toFixed(0)}%`}
                      </div>
                    </div>
                  </div>

                  {/* LEGEND & DETAIL */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <span className="text-[9px] font-black text-slate-400 uppercase">Closing</span>
                      </div>
                      <p className="text-sm font-black text-emerald-600">{(stackedStats.success.val / 1000000000).toFixed(1)}M</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        <span className="text-[9px] font-black text-slate-400 uppercase">Active Pipeline</span>
                      </div>
                      <p className="text-sm font-black text-blue-600">{(stackedStats.inProgress.val / 1000000000).toFixed(1)}M</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-300 rounded-full" />
                        <span className="text-[9px] font-black text-slate-400 uppercase">Rejected/Lost</span>
                      </div>
                      <p className="text-sm font-black text-slate-400">{(stackedStats.rejected.val / 1000000000).toFixed(1)}M</p>
                    </div>
                  </div>
                </div>


                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  {/* Header Section */}
                  <div className="flex justify-between items-center mb-8 px-2">
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                      <Wallet size={16} className="text-blue-600" /> Top Potential Portfolio
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                      Sorted by Max Wealth Score
                    </span>
                  </div>

                  {/* Table Container */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left table-fixed min-w-[850px]">
                      <thead>
                        <tr className="text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-50">
                          <th className="pb-4 text-center w-[25%]">Nasabah Utama</th>
                          <th className="pb-4 text-center w-[25%]">Total Saldo Ekosistem</th>
                          <th className="pb-4 text-center w-[15%]">Potensial</th>
                          <th className="pb-4 text-center w-[15%]">Score</th>
                          <th className="pb-4 text-center w-[20%]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {groupedNasabah.slice(0, 10).map((n: any, i) => (
                          <tr key={i} className="hover:bg-blue-50/40 transition-all group">
                            <td className="py-5 pl-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-black text-slate-700 uppercase tracking-tight group-hover:text-blue-700 transition-colors">
                                  {n.Nama_Nasabah}
                                </span>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">
                                  <Users size={20} /> {n.Keluarga.length} Members
                                </div>
                              </div>
                            </td>

                            <td className="py-5 text-center">
                              <span className="font-black text-emerald-600 text-sm">
                                {formatRupiah(n.Saldo_Prioritas + n.Total_Aset_Keluarga)}
                              </span>
                            </td>

                            {/* CIF Potential Sum (Total seluruh Gap/Score satu keluarga) */}
                            <td className="py-5 text-center">
                              <span className="font-black text-yellow-600 text-sm">
                                {formatRupiah(n.Potential_CIF_Sum)}
                              </span>
                            </td>

                            {/* Max Score (Nilai tertinggi salah satu anggota) */}
                            <td className="py-5 text-center">
                              <span className="font-black text-blue-600 text-lg leading-none">
                                {n.Max_Score.toFixed(1)}
                              </span>
                            </td>


                            <td className="py-5 text-center pr-4">
                              <button
                                onClick={() => setSelectedPortfolio(n)}
                                className="group inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all duration-200"
                              >
                                Portfolio <ChevronRight size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* --- PAGE: ACTIVE LEADS --- */}
            {menu === "ActiveLeads" && (
              <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
                <table className="w-full text-left">
                  <thead><tr className="text-slate-400 text-[10px] uppercase font-black border-b"><th className="pb-6">Nama Keluarga</th><th className="pb-6 text-center">Status Approach</th><th className="pb-6 text-center">Status Response</th><th className="pb-6 text-center">Deadline</th><th className="pb-6 text-center">Score</th><th className="pb-6 text-center">Aksi</th></tr></thead>
                  <tbody>
                    {filteredLeads.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-all border-b border-slate-50">
                        <td className="py-5 font-black uppercase text-slate-800">{row.Nama_Keluarga} <p className="text-[9px] text-slate-400 italic font-bold">Wealth: {row.Nama_Nasabah}</p></td>
                        <td className="text-center">
                          <select
                            value={row.Status_Approach}
                            onChange={(e) => updateField(row.id, 'Status_Approach', e.target.value)} // Pastikan baris ini ada
                            className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border-none ${row.Status_Approach === 'Sudah' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}
                          >
                            <option value="Belum">Belum</option>
                            <option value="Sudah">Sudah</option>
                          </select>
                        </td>
                        <td className="text-center">
                          <select
                            value={row.Status_Response}
                            onChange={(e) => updateField(row.id, 'Status_Response', e.target.value)} // Pastikan baris ini ada
                            className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border-none ${row.Status_Response === 'Berhasil' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}
                          >
                            <option value="Belum">Belum</option>
                            <option value="Proses">Proses</option>
                            <option value="Berhasil">Berhasil</option>
                            <option value="Ditolak">Ditolak</option>
                          </select>
                        </td>
                        <td className="text-center font-bold text-xs">
                          <input
                            type="date"
                            value={row.Target_Date || ""} // Tambahkan fallback string kosong
                            onChange={(e) => updateField(row.id, 'Target_Date', e.target.value)} // Pastikan baris ini ada
                            className="bg-transparent outline-none font-black"
                          />
                        </td>
                        <td className="text-center font-black text-blue-600 text-lg">
                          {Number(row.Score_Individu).toFixed(2)}
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => setSelectedMember(row)}
                            className="group inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-100 active:scale-95 transition-all duration-200"
                          >
                            Portfolio
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button></td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- PAGE: BIRTHDAY --- */}
            {menu === "Birthday" && (
              <div className="space-y-10">
                {(() => {
                  const now = new Date();
                  const currentMonth = now.getMonth();
                  const currentDate = now.getDate();
                  const currentYear = now.getFullYear();

                  const monthLeads = data.filter(item => item.Tanggal_Lahir_Keluarga && new Date(item.Tanggal_Lahir_Keluarga).getMonth() === currentMonth);
                  const bdayToday = monthLeads.filter(item => new Date(item.Tanggal_Lahir_Keluarga).getDate() === currentDate);
                  const bdayOthers = monthLeads.filter(item => new Date(item.Tanggal_Lahir_Keluarga).getDate() !== currentDate).sort((a, b) => new Date(a.Tanggal_Lahir_Keluarga).getDate() - new Date(b.Tanggal_Lahir_Keluarga).getDate());

                  const renderBdayCard = (person: any, status: 'today' | 'upcoming' | 'passed') => {
                    const age = currentYear - new Date(person.Tanggal_Lahir_Keluarga).getFullYear();
                    const isSweet17 = age === 17;
                    const styleClass = status === 'today' ? "border-yellow-200 shadow-xl bg-white" : status === 'passed' ? "border-slate-50 bg-slate-50/50 opacity-60" : "border-slate-100 bg-white";

                    return (
                      <div key={person.id} className={`p-6 rounded-[2rem] border transition-all ${styleClass} relative overflow-hidden group`}>
                        {status === 'today' && <div className="absolute top-0 right-0 bg-yellow-400 text-white text-[8px] font-black px-4 py-1 rounded-bl-2xl uppercase tracking-widest animate-pulse">Hari Ini!</div>}
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${status === 'today' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>{isSweet17 ? "✨" : "🎂"}</div>
                          <div className="flex-1">
                            <p className="font-black uppercase tracking-tight text-slate-800 leading-tight">{person.Nama_Keluarga}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase italic">WEALTH: {person.Nama_Nasabah}</p>
                            <p className={`text-xs font-black mt-2 ${status === 'passed' ? 'text-slate-400' : 'text-blue-600'}`}>{new Date(person.Tanggal_Lahir_Keluarga).getDate()} {now.toLocaleDateString('id-ID', { month: 'long' })}</p>
                            {isSweet17 && status !== 'passed' && <div className="mt-2 bg-indigo-50 text-indigo-700 text-[8px] px-2 py-0.5 rounded-full font-black uppercase inline-block tracking-widest">Potential Sweet 17</div>}
                          </div>
                        </div>
                        <button disabled={status === 'passed'} className={`w-full mt-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 ${status === 'passed' ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white'}`} onClick={() => window.open(`https://wa.me/${person.No_WA}?text=${encodeURIComponent('Selamat ulang tahun!')}`, '_blank')}>
                          <MessageCircle size={14} /> {status === 'passed' ? "Sudah Lewat" : "Kirim WA"}
                        </button>
                      </div>
                    );
                  };

                  if (monthLeads.length === 0) return <div className="bg-white p-20 rounded-[2rem] text-center border-2 border-dashed border-slate-100 italic text-slate-400 uppercase tracking-widest text-xs">Tidak ada ulang tahun bulan ini</div>;
                  return (
                    <div className="space-y-12">
                      {bdayToday.length > 0 && (
                        <div className="space-y-6"><h4 className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-widest"><div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" /> Perayaan Hari Ini</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{bdayToday.map(p => renderBdayCard(p, 'today'))}</div>
                        </div>
                      )}
                      <div className="space-y-6"><h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"><Calendar size={14} /> Mendatang di Bulan Ini</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{bdayOthers.map(p => renderBdayCard(p, new Date(p.Tanggal_Lahir_Keluarga).getDate() < currentDate ? 'passed' : 'upcoming'))}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: PORTFOLIO EXPLORER */}
        {selectedPortfolio && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-5xl h-[80vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
              <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
                <div className="flex gap-6 items-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-2xl font-black italic">{selectedPortfolio.Nama_Nasabah.charAt(0)}</div>
                  <div><p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">CIF: {selectedPortfolio.CIF || "-"}</p><h4 className="text-3xl font-black uppercase italic tracking-tighter">{selectedPortfolio.Nama_Nasabah}</h4></div>
                </div>
                <button onClick={() => setSelectedPortfolio(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                <div className="grid grid-cols-3 gap-6">
                  {/* Saldo Nasabah Utama (Dari kolom Saldo) */}
                  <div className="p-6 bg-slate-50 rounded-[2rem] shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Nasabah</p>
                    <p className="text-xl font-black text-blue-600">{formatRupiah(selectedPortfolio.Saldo_Prioritas)}</p>
                  </div>

                  {/* Total Semua Anggota (Dari kolom Saldo_Keluarga) */}
                  <div className="p-6 bg-slate-50 rounded-[2rem] shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Potensi Nasabah</p>
                    <p className="text-xl font-black text-emerald-600">{formatRupiah(selectedPortfolio.Potential_CIF_Sum)}</p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-[2rem] shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                    <p className="text-xl font-black text-slate-700">{selectedPortfolio.Max_Score.toFixed(2)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h5 className="font-black text-slate-800 uppercase text-xs tracking-widest px-2">Keluarga</h5>
                  <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50"><tr className="text-[9px] font-black uppercase text-slate-400"><th className="p-4">Nama</th><th className="p-4">Hubungan</th><th className="p-4">Saldo</th><th className="p-4">Potensi</th><th className="p-4 text-center px-8">Aksi</th></tr></thead>
                      <tbody className="divide-y">
                        {selectedPortfolio.Keluarga.map((fam: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50 transition-all">
                            <td className="p-4 font-black uppercase text-sm text-slate-700">{fam.Nama_Keluarga}</td>
                            <td className="p-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">{fam.Hubungan_Keluarga || "Anggota"}</td>
                            <td className="p-4 font-black text-emerald-600 text-sm">{formatRupiah(fam.Saldo_Keluarga)}</td>
                            <td className="p-4 font-black text-emerald-600 text-sm">{formatRupiah(fam.Potensi_Keluarga)}</td>
                            <td className="p-4 text-center px-8">
                              <button
                                onClick={() => setSelectedMember(fam)}
                                className="group inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-100 active:scale-95 transition-all duration-200"
                              >
                                Portfolio
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                              </button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: DEEP MEMBER PROFILING (UNIFIED) */}
        {selectedMember && (
          <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
              <div className="bg-blue-700 p-8 text-white flex justify-between items-center">
                <div className="flex items-center gap-4"><Contact2 size={24} /><h6 className="font-black uppercase tracking-[0.2em] text-sm">Deep Information Profile</h6></div>
                <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X /></button>
              </div>
              <div className="p-10 grid grid-cols-2 gap-x-12 gap-y-6 overflow-y-auto max-h-[70vh]">
                <InfoRow label="Nama Lengkap" val={selectedMember.Nama_Keluarga} />
                <InfoRow label="Hubungan Keluarga" val={selectedMember.Hubungan_Keluarga} />
                <InfoRow label="NIK Anggota" val={selectedMember.NIK_Keluarga} />
                <InfoRow label="CIF Keluarga" val={selectedMember.CIF_Keluarga} />
                <InfoRow label="No. Rekening" val={selectedMember.No_Rekening_Keluarga} />
                <InfoRow label="Jenis Kelamin" val={selectedMember.Jenis_Kelamin_Keluarga} />
                <InfoRow label="Tanggal Lahir" val={formatDateIndo(selectedMember.Tanggal_Lahir_Keluarga)} />
                <InfoRow label="Usia" val={`${calculateAge(selectedMember.Tanggal_Lahir_Keluarga)} Tahun`} />
                <InfoRow label="Saldo Individu" val={formatRupiah(selectedMember.Saldo_Keluarga)} color="text-emerald-600" />
                <InfoRow label="Wealth Score" val={selectedMember.Score_Individu.toFixed(2)} color="text-blue-600" />
                <InfoRow label="Status Approach" val={selectedMember.Status_Approach} />
                <InfoRow label="Tgl Approach" val={selectedMember.Tanggal_Approach_Terakhir} />
                <InfoRow label="Status Response" val={selectedMember.Status_Response} />
                <InfoRow label="Tgl Response" val={selectedMember.Tanggal_Response_Terakhir} />
              </div>
              <div className="p-8 bg-slate-50 flex gap-4 border-t border-slate-100">
                <button onClick={() => window.open(`https://wa.me/${selectedMember.No_WA}`, '_blank')} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">
                  <MessageCircle size={16} /> Direct Chat WhatsApp
                </button>
                <button onClick={() => setSelectedMember(null)} className="px-8 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[10px]">Close</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
