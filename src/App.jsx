import React, { useEffect, useRef, useState } from 'react';
import {
Users,
BookOpen,
UserCheck,
Settings,
Plus,
Trash2,
Edit3,
GraduationCap,
Home,
ArrowLeft,
X,
Check,
ChevronRight,
Save,
Info,
Copy,
Printer
} from 'lucide-react';

const MonthlyReportView = ({ classId, students, classes, teachers, dailyLogs, indicators, onClose }) => {
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));

  const activeClass = classes.find(c => c.id === classId);
  const classStudents = students.filter(s => s.classId === classId);
  const teacher = teachers.find(t => t.id === activeClass?.teacherId);
  const [reportYear, reportMonthNumber] = reportMonth.split('-').map(Number);
  const daysInMonth = new Date(reportYear, reportMonthNumber, 0).getDate();
  const reportDates = Object.keys(dailyLogs)
    .map(logKey => {
      const [date, logClassId] = logKey.split('_');
      return logClassId === classId && date.startsWith(reportMonth) ? date : null;
    })
    .filter(Boolean)
    .sort();

  const reportDateCount = new Set(reportDates).size;
  const formatPercent = (value) => `${value.toFixed(1)}%`;

  const monthlyData = classStudents.map(student => {
    const studentLogs = {};
    indicators.forEach(ind => studentLogs[ind.id] = 0);

    const applicableIndicators = indicators.filter(ind => !(ind.id === 'makeup' && student.gender === 'L'));
    const totalPossibleChecks = daysInMonth * applicableIndicators.length;

    Object.keys(dailyLogs).forEach(logKey => {
      const [date, logClassId] = logKey.split('_');
      if (logClassId === classId && date.startsWith(reportMonth)) {
        const log = dailyLogs[logKey];
        if (log[student.id]) {
          indicators.forEach(ind => {
            if (log[student.id][ind.id]) {
              studentLogs[ind.id]++;
            }
          });
        }
      }
    });

    const percentageLogs = indicators.reduce((acc, ind) => {
      const isExcluded = ind.id === 'makeup' && student.gender === 'L';

      if (isExcluded || totalPossibleChecks === 0) {
        acc[ind.id] = null;
        return acc;
      }

      acc[ind.id] = (studentLogs[ind.id] / totalPossibleChecks) * 100;
      return acc;
    }, {});

    const totalPercentage = applicableIndicators.reduce((sum, ind) => {
      return sum + (percentageLogs[ind.id] || 0);
    }, 0);

    return {
      ...student,
      logs: studentLogs,
      percentageLogs,
      totalPercentage,
      applicableIndicatorCount: applicableIndicators.length
    };
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 animate-fade-in print:bg-white print:p-0 print:items-start print:justify-start">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh] animate-scale-in print:shadow-none print:rounded-none print:max-h-full print:w-full">
        <header className="p-4 border-b flex items-center justify-between no-print">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-black text-blue-900">Laporan Bulanan: Kelas {activeClass?.name}</h3>
            <input
              type="month"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1 text-sm font-bold"
            />
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={18} /></button>
        </header>
        <main id="printable-area" className="flex-1 overflow-y-auto p-6 custom-scrollbar print:overflow-visible print:p-4">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold">JURNAL KEDISIPLINAN SISWA</h1>
            <h2 className="text-lg font-semibold">SMPIT IKHTIAR</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-8 text-sm mb-6 print:grid-cols-2">
            <p><span className="font-bold w-24 inline-block">Kelas</span>: {activeClass?.name}</p>
            <p><span className="font-bold w-24 inline-block">Wali Kelas</span>: {teacher?.name}</p>
            <p><span className="font-bold w-24 inline-block">Bulan</span>: {new Date(reportMonth).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
            <p><span className="font-bold w-24 inline-block">Jumlah Siswa</span>: {classStudents.length}</p>
            <p><span className="font-bold w-24 inline-block">Hari Bulan Ini</span>: {daysInMonth}</p>
            <p><span className="font-bold w-24 inline-block">Hari Dicatat</span>: {reportDateCount}</p>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-gray-100 print:bg-gray-100">
              <tr>
                <th className="p-2 border font-bold text-gray-700 w-1/4">Nama Siswa</th>
                {indicators.map(ind => <th key={ind.id} className="p-2 border font-bold text-gray-700 text-center text-[10px]">{ind.label}</th>)}
                <th className="p-2 border font-bold text-gray-700 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(student => {
                return (
                  <tr key={student.id} className="even:bg-gray-50">
                    <td className="p-2 border font-semibold">{student.name}</td>
                    {indicators.map(ind => (
                      <td key={ind.id} className="p-2 border text-center">
                        {student.percentageLogs[ind.id] === null ? '-' : (student.logs[ind.id] > 0 ? student.logs[ind.id] : '-')}
                      </td>
                    ))}
                    <td className="p-2 border text-center font-bold">
                      {student.applicableIndicatorCount > 0 && daysInMonth > 0 ? formatPercent(student.totalPercentage) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </main>
        <footer className="p-4 border-t flex justify-end gap-3 no-print">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold rounded-lg hover:bg-gray-100">Tutup</button>
          <button onClick={handlePrint} className="bg-blue-900 text-white px-6 py-2 text-sm font-bold rounded-lg flex items-center gap-2">
            <Printer size={16} />
            Cetak
          </button>
        </footer>
      </div>
    </div>
  );
};

const App = () => {
  const defaultTeachers = [
    { id: '1', name: 'Ust. Ahmad Fauzi, S.Pd' },
    { id: '2', name: 'Ustz. Siti Aminah, M.Pd' }
  ];
  const defaultClasses = [
    { id: '1', name: 'VII A', teacherId: '1' },
    { id: '2', name: 'VIII B', teacherId: '2' }
  ];
  const defaultStudents = [
    { id: '1', name: 'Ahmad Zaki', classId: '1', gender: 'L' },
    { id: '2', name: 'Fatimah Az-Zahra', classId: '1', gender: 'P' },
    { id: '3', name: 'Muhammad Ali', classId: '2', gender: 'L' },
    { id: '4', name: 'Siti Khadijah', classId: '1', gender: 'P' },
    { id: '5', name: 'Umar Bin Khattab', classId: '1', gender: 'L' }
  ];

  const getStaggerStyle = (index, step = 70) => ({
    animationDelay: `${index * step}ms`
  });

  const getInitialState = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error(`Gagal membaca data ${key} dari localStorage`, error);
      return defaultValue;
    }
  };

  const syncTimeoutRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const lastRemoteUpdatedAtRef = useRef(null);
  const isSavingRef = useRef(false);

  // State Navigasi
  const [currentView, setCurrentView] = useState('home');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [batchModeClassId, setBatchModeClassId] = useState(null);
  const [isReportViewOpen, setIsReportViewOpen] = useState(false);

  // Indikator Kedisiplinan (konstan, tidak perlu state)
  const indicators = [
    { id: 'ontime', label: 'Tepat Waktu', color: 'bg-emerald-500' },
    { id: 'uniform', label: 'Seragam Rapi', color: 'bg-emerald-500' },
    { id: 'shoes', label: 'Sepatu', color: 'bg-emerald-500' },
    { id: 'hair_ciput', label: 'Ciput/Rambut', color: 'bg-emerald-500' },
    { id: 'socks', label: 'Kaos Kaki', color: 'bg-emerald-500' },
    { id: 'cleaning', label: 'Kebersihan', color: 'bg-emerald-500' },
    { id: 'no_hp', label: 'Bawa HP', color: 'bg-emerald-500' },
    { id: 'makeup', label: 'Makeup (P)', color: 'bg-emerald-500' },
    { id: 'attitude', label: 'Sopan Santun', color: 'bg-emerald-500' },
    { id: 'orderly', label: 'Tertib Belajar', color: 'bg-emerald-500' },
    { id: 'prayer', label: 'Sholat Tertib', color: 'bg-emerald-500' }
  ];

  // State Data with localStorage persistence
  const [teachers, setTeachers] = useState(() => getInitialState('teachers', defaultTeachers));
  const [classes, setClasses] = useState(() => getInitialState('classes', defaultClasses));
  const [students, setStudents] = useState(() => getInitialState('students', defaultStudents));
  const [dailyLogs, setDailyLogs] = useState(() => getInitialState('dailyLogs', {}));
  const [hasHydratedData, setHasHydratedData] = useState(false);
  const [storageMode, setStorageMode] = useState('local');
  const [isRemoteSyncAvailable, setIsRemoteSyncAvailable] = useState(false);
  const [syncState, setSyncState] = useState('idle');

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingItem, setEditingItem] = useState(null);
  const [newInput, setNewInput] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassTeacherId, setNewClassTeacherId] = useState('');

  const exportBackup = () => {
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: 'disiplin-smpit-ikhtiar',
      data: {
        teachers,
        classes,
        students,
        dailyLogs
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const exportDate = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `backup-disiplin-${exportDate}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const triggerImportBackup = () => {
    const fileInput = document.getElementById('backup-file-input');
    fileInput?.click();
  };

  const importBackup = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const fileContent = await file.text();
      const parsed = JSON.parse(fileContent);
      const backup = parsed?.data || parsed;

      const nextTeachers = Array.isArray(backup?.teachers) ? backup.teachers : null;
      const nextClasses = Array.isArray(backup?.classes) ? backup.classes : null;
      const nextStudents = Array.isArray(backup?.students) ? backup.students : null;
      const nextDailyLogs =
        backup?.dailyLogs && typeof backup.dailyLogs === 'object' && !Array.isArray(backup.dailyLogs)
          ? backup.dailyLogs
          : null;

      if (!nextTeachers || !nextClasses || !nextStudents || !nextDailyLogs) {
        throw new Error('Format file backup tidak valid.');
      }

      const isConfirmed = window.confirm(
        `Restore backup akan menimpa data saat ini.\n\nGuru: ${nextTeachers.length}\nKelas: ${nextClasses.length}\nSiswa: ${nextStudents.length}\n\nLanjutkan?`
      );

      if (!isConfirmed) {
        event.target.value = '';
        return;
      }

      setTeachers(nextTeachers);
      setClasses(nextClasses);
      setStudents(nextStudents);
      setDailyLogs(nextDailyLogs);
      setCurrentView('home');
      setSelectedClassId(null);
      setIsReportViewOpen(false);
      setEditingItem(null);
      setBatchModeClassId(null);

      alert('Backup berhasil dipulihkan.');
    } catch (error) {
      console.error('Gagal import backup', error);
      alert('File backup tidak bisa dibaca. Pastikan format JSON backup valid.');
    } finally {
      event.target.value = '';
    }
  };

  const applyRemoteData = (remoteData) => {
    if (Array.isArray(remoteData?.teachers)) setTeachers(remoteData.teachers);
    if (Array.isArray(remoteData?.classes)) setClasses(remoteData.classes);
    if (Array.isArray(remoteData?.students)) setStudents(remoteData.students);
    if (remoteData?.dailyLogs && typeof remoteData.dailyLogs === 'object' && !Array.isArray(remoteData.dailyLogs)) {
      setDailyLogs(remoteData.dailyLogs);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const loadRemoteState = async () => {
      try {
        const response = await fetch('/api/state', {
          headers: {
            Accept: 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Gagal memuat data database (${response.status})`);
        }

        const result = await response.json();
        const remoteData = result?.data;
        lastRemoteUpdatedAtRef.current = result?.updatedAt || null;
        setIsRemoteSyncAvailable(true);

        if (isCancelled) {
          return;
        }

        if (!remoteData) {
          // Database aktif, tapi belum ada data tersimpan.
          setStorageMode('database');
          setSyncState('saved');
          return;
        }

        applyRemoteData(remoteData);

        setStorageMode('database');
        setSyncState('saved');
      } catch (error) {
        console.error('Mode database belum aktif, pakai localStorage.', error);
        if (!isCancelled) {
          setStorageMode('local');
          setIsRemoteSyncAvailable(false);
        }
      } finally {
        if (!isCancelled) {
          setHasHydratedData(true);
        }
      }
    };

    loadRemoteState();

    return () => {
      isCancelled = true;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Effects to save data to localStorage on change
  useEffect(() => {
    localStorage.setItem('teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('dailyLogs', JSON.stringify(dailyLogs));
  }, [dailyLogs]);

  useEffect(() => {
    if (!hasHydratedData || !isRemoteSyncAvailable) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setSyncState('saving');
        isSavingRef.current = true;

        const response = await fetch('/api/state', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            teachers,
            classes,
            students,
            dailyLogs
          })
        });

        if (!response.ok) {
          throw new Error(`Gagal menyimpan ke database (${response.status})`);
        }

        const result = await response.json();
        lastRemoteUpdatedAtRef.current = result?.updatedAt || null;
        setStorageMode('database');
        setSyncState('saved');
      } catch (error) {
        console.error('Sinkronisasi database gagal, data tetap aman di localStorage.', error);
        setStorageMode('local');
        setIsRemoteSyncAvailable(false);
        setSyncState('error');
      } finally {
        isSavingRef.current = false;
      }
    }, 500);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [teachers, classes, students, dailyLogs, hasHydratedData, isRemoteSyncAvailable]);

  useEffect(() => {
    if (!hasHydratedData || !isRemoteSyncAvailable) return;

    const pollRemoteState = async () => {
      if (isSavingRef.current) return;

      try {
        const response = await fetch('/api/state', {
          headers: {
            Accept: 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Gagal polling database (${response.status})`);
        }

        const result = await response.json();
        const remoteUpdatedAt = result?.updatedAt || null;
        const remoteData = result?.data;

        if (!remoteUpdatedAt || remoteUpdatedAt === lastRemoteUpdatedAtRef.current) {
          return;
        }

        lastRemoteUpdatedAtRef.current = remoteUpdatedAt;

        if (remoteData) {
          applyRemoteData(remoteData);
          setStorageMode('database');
          setSyncState('saved');
        }
      } catch (error) {
        console.error('Polling database gagal.', error);
      }
    };

    syncIntervalRef.current = setInterval(pollRemoteState, 5000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [hasHydratedData, isRemoteSyncAvailable]);

// --- LOGIC FUNCTIONS ---
const toggleStatus = (studentId, indicatorId) => {
const logKey = `${selectedDate}_${selectedClassId}`;
const currentLogs = dailyLogs[logKey] || {};
const studentLogs = currentLogs[studentId] || {};
setDailyLogs({
...dailyLogs,
[logKey]: {
...currentLogs,
[studentId]: {
...studentLogs,
[indicatorId]: !studentLogs[indicatorId]
}
}
});
};

const getStatus = (studentId, indicatorId) => {
const logKey = `${selectedDate}_${selectedClassId}`;
return dailyLogs[logKey]?.[studentId]?.[indicatorId] || false;
};

const getApplicableIndicators = (student) => {
return indicators.filter(ind => !(ind.id === 'makeup' && student.gender === 'L'));
};

const handleCheckAllStudent = (student) => {
const logKey = `${selectedDate}_${selectedClassId}`;
const currentLogs = dailyLogs[logKey] || {};
const studentLogs = currentLogs[student.id] || {};
const nextStudentLogs = { ...studentLogs };

getApplicableIndicators(student).forEach(indicator => {
nextStudentLogs[indicator.id] = true;
});

setDailyLogs({
...dailyLogs,
[logKey]: {
...currentLogs,
[student.id]: nextStudentLogs
}
});
};

const handleAddTeacher = (name) => {
if (!name) return;
setTeachers([...teachers, { id: Date.now().toString(), name }]);
};

const handleUpdateTeacher = (id, newName) => {
setTeachers(teachers.map(t => t.id === id ? { ...t, name: newName } : t));
setEditingItem(null);
};

const handleAddClass = (name, teacherId) => {
if (!name || !teacherId) return;
setClasses([...classes, { id: Date.now().toString(), name, teacherId }]);
};

const handleUpdateClass = (id, newName, newTeacherId) => {
setClasses(classes.map(c => c.id === id ? { ...c, name: newName, teacherId: newTeacherId } : c));
setEditingItem(null);
};

const handleAddStudent = (name, classId, gender) => {
if (!name || !classId || !gender) return;
setStudents([...students, { id: Date.now().toString(), name, classId, gender: gender.toUpperCase() }]);
};

const handleBatchAddStudents = (text, classId) => {
if (!text) return;
const lines = text.split('\n');
const newStudentsBatch = [];
lines.forEach(line => {
if (line.trim()) {
const parts = line.split(/[,,|]/);
if (parts.length >= 2) {
const name = parts[0].trim();
let gender = parts[1].trim().toUpperCase();
if (gender.includes('L')) gender = 'L';
else if (gender.includes('P')) gender = 'P';
else gender = 'L';
if (name) {
newStudentsBatch.push({ id: (Date.now() + Math.random()).toString(), name, classId, gender });
}
}
}
});
if (newStudentsBatch.length > 0) {
setStudents([...students, ...newStudentsBatch]);
setBatchModeClassId(null);
alert(`${newStudentsBatch.length} siswa berhasil ditambahkan.`);
}
};

const handleUpdateStudent = (id, newName, newGender) => {
setStudents(students.map(s => s.id === id ? { ...s, name: newName, gender: newGender } : s));
setEditingItem(null);
};

const handleDelete = (type, id) => {
if (!window.confirm("Hapus data ini?")) return;
if (type === 'teacher') setTeachers(teachers.filter(t => t.id !== id));
if (type === 'class') {
setClasses(classes.filter(c => c.id !== id));
setStudents(students.filter(s => s.classId !== id));
}
if (type === 'student') setStudents(students.filter(s => s.id !== id));
};

// --- UI COMPONENTS ---
const renderTopHeader = () => (
<header className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
<div className="max-w-full mx-auto px-4 sm:px-6">
<div className="flex items-center justify-between h-14">
<div className="flex items-center gap-3">
<div className="bg-white p-1 rounded-full animate-soft-float">
<GraduationCap className="text-blue-900" size={20} />
</div>
<h1 className="text-sm font-bold tracking-tight hidden sm:block">SMPIT IKHTIAR UNHAS</h1>
</div>

<nav className="flex items-center gap-1 bg-blue-900/40 rounded-lg p-0.5 border border-blue-800">
<button
onClick={() => setCurrentView('home')}
className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${currentView === 'home' ? 'bg-gold text-white shadow-sm' : 'hover:bg-blue-800 text-blue-200'}`}
>
<Home size={14} /> Beranda
</button>
<button
onClick={() => setCurrentView('admin')}
className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${currentView === 'admin' ? 'bg-gold text-white shadow-sm' : 'hover:bg-blue-800 text-blue-200'}`}
>
<Settings size={14} /> Admin
</button>
</nav>

<div className="flex items-center gap-3">
<span className="text-[10px] font-bold opacity-80 hidden md:block">{new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
<span className={`hidden md:inline-flex items-center rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
storageMode === 'database'
? 'bg-emerald-100 text-emerald-700'
: 'bg-amber-100 text-amber-700'
}`}>
{storageMode === 'database'
? syncState === 'saving'
  ? 'Sync DB'
  : 'DB Aktif'
: 'Mode Lokal'}
</span>
<button
onClick={exportBackup}
className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold border border-blue-800 bg-blue-900/40 hover:bg-blue-800 text-blue-100"
title="Unduh backup data"
>
<Save size={13} /> Backup
</button>
<button
onClick={triggerImportBackup}
className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold border border-blue-800 bg-blue-900/40 hover:bg-blue-800 text-blue-100"
title="Pulihkan data dari backup"
>
<Copy size={13} /> Restore
</button>
<div className="w-7 h-7 rounded-full bg-gold text-white flex items-center justify-center text-[10px] font-bold shadow-sm">AD</div>
</div>
</div>
</div>
</header>
);

const renderHomeView = () => (
<div className="max-w-7xl mx-auto p-6">
<div className="mb-6">
<h2 className="text-xl font-extrabold text-blue-900">Pilih Kelas</h2>
<p className="text-[11px] text-gray-500 font-medium">Klik kelas untuk mulai mengisi jurnal kedisiplinan.</p>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
{classes.map(c => (
<button
key={c.id}
onClick={() => { setSelectedClassId(c.id); setCurrentView('journal'); }}
className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-gold transition-all hover:shadow-md hover:-translate-y-1 text-left animate-fade-up animate-delay-fill"
style={getStaggerStyle(classes.findIndex(item => item.id === c.id))}
>
<div className="w-10 h-10 bg-blue-50 text-blue-900 rounded-xl flex items-center justify-center mb-3 group-hover:bg-gold group-hover:text-white transition-colors">
<BookOpen size={20} />
</div>
<h3 className="text-lg font-bold text-blue-900">Kelas {c.name}</h3>
<p className="text-[10px] text-gray-400 mt-1">Wali: {teachers.find(t => t.id === c.teacherId)?.name || '-'}</p>
</button>
))}
</div>
</div>
);

const renderJournalTableView = () => {
const activeClass = classes.find(c => c.id === selectedClassId);
const classStudents = students.filter(s => s.classId === selectedClassId);

return (
<div className="max-w-full mx-auto p-4 animate-fade-up">
<div className="flex flex-wrap items-center justify-between mb-4 gap-3 bg-white p-3 rounded-xl shadow-sm border animate-fade-up">
<div className="flex items-center gap-3">
<button onClick={() => setCurrentView('home')} className="p-2 bg-blue-50 text-blue-900 rounded-lg hover:bg-blue-100 transition-all hover:-translate-x-1">
<ArrowLeft size={18} />
</button>
<h2 className="text-sm font-black text-blue-900 uppercase">Jurnal Kelas {activeClass?.name}</h2>
</div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100">
          <span className="text-[10px] font-black text-blue-900 uppercase">Tanggal:</span>
          <input
            type="date"
            className="bg-transparent outline-none text-[11px] font-bold cursor-pointer text-blue-800"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsReportViewOpen(true)}
          className="flex items-center gap-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg border border-gray-200 transition-all hover:-translate-y-0.5 hover:shadow-sm"
        >
          <Printer size={14} />
          <span>Laporan</span>
        </button>
      </div>
</div>

<div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-scale-in">
<div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
<table className="w-full text-left border-collapse text-[10px]">
<thead className="bg-blue-900 text-white sticky top-0 z-30">
<tr>
<th className="px-4 py-3 font-bold border-r border-blue-800 sticky left-0 bg-blue-900 z-40 w-56 uppercase tracking-widest shadow-md">Nama Siswa</th>
{indicators.map(ind => (
<th key={ind.id} className="px-2 py-3 text-center font-bold text-[8px] uppercase tracking-tighter min-w-[85px] leading-tight border-r border-blue-800/20">
{ind.label}
</th>
))}
</tr>
</thead>
<tbody className="divide-y divide-gray-100">
{classStudents.map((student, idx) => (
<tr key={student.id} className={`${idx % 2 === 0 ? 'bg-white hover:bg-blue-50/20' : 'bg-gray-50/40 hover:bg-blue-50/20'} animate-fade-up animate-delay-fill`} style={getStaggerStyle(idx, 35)}>
<td className="px-4 py-2 border-r sticky left-0 bg-inherit z-10 shadow-sm">
<div className="flex items-start justify-between gap-2">
<div className="min-w-0 flex-1">
<div className="flex items-center gap-2">
<span className="font-bold text-blue-900 truncate" title={student.name}>{student.name}</span>
<span className={`text-[8px] font-bold px-1 rounded ${student.gender === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
{student.gender}
</span>
</div>
<button
onClick={() => handleCheckAllStudent(student)}
className="mt-1 text-[8px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md hover:bg-emerald-100 transition-all"
>
Cek All
</button>
</div>
</div>
</td>
{indicators.map(ind => {
const isMakeupHidden = ind.id === 'makeup' && student.gender === 'L';
const isActive = getStatus(student.id, ind.id);
return (
<td key={ind.id} className="px-1 py-1.5 text-center border-r border-gray-100">
{isMakeupHidden ? (
<div className="text-gray-200">-</div>
) : (
<button
onClick={() => toggleStatus(student.id, ind.id)}
className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all transform active:scale-90 hover:-translate-y-0.5 border ${
isActive
? `${ind.color} text-white shadow-sm border-transparent animate-status-pop`
: 'bg-white border-gray-200 text-gray-200 hover:border-gray-400'
}`}
>
{isActive ? <Check size={16} strokeWidth={4} /> : <div className="w-1 h-1 rounded-full bg-gray-200" />}
</button>
)}
</td>
);
})}
</tr>
))}
</tbody>
</table>
</div>
<div className="p-4 bg-gray-50 border-t flex flex-col items-center gap-4">
<div className="flex gap-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
<div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-emerald-500"></div> Ya</div>
<div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-white border border-gray-300"></div> Tidak</div>
</div>
<button
onClick={() => { alert("Data tersimpan!"); setCurrentView('home'); }}
className="bg-blue-900 hover:bg-blue-800 text-white px-10 py-3 rounded-xl text-sm font-black flex items-center gap-2 shadow-md transition-all uppercase hover:-translate-y-1 hover:shadow-xl animate-soft-pulse"
>
<Save size={16} /> Simpan
</button>
</div>
</div>
</div>
);
};

const renderAdminView = () => (
<div className="max-w-7xl mx-auto p-6">
<div className="flex space-x-1 mb-6 bg-white p-1 rounded-xl shadow-sm border inline-flex overflow-hidden">
{['dashboard', 'guru', 'kelas'].map(tab => (
<button
key={tab}
onClick={() => { setAdminTab(tab); setEditingItem(null); }}
className={`py-1.5 px-5 font-bold text-[10px] uppercase tracking-widest rounded-lg ${adminTab === tab ? 'bg-blue-900 text-white shadow-sm' : 'text-gray-400 hover:text-blue-900'}`}
>
{tab}
</button>
))}
</div>

{adminTab === 'dashboard' && (
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
{[
{ label: 'Guru', val: teachers.length, icon: Users, col: 'border-blue-900' },
{ label: 'Kelas', val: classes.length, icon: BookOpen, col: 'border-gold' },
{ label: 'Siswa', val: students.length, icon: UserCheck, col: 'border-emerald-500' }
].map((s, i) => (
<div key={i} className={`bg-white p-5 rounded-2xl shadow border-l-4 animate-fade-up animate-delay-fill hover:-translate-y-1 transition-all ${s.col}`} style={getStaggerStyle(i)}>
<p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">{s.label}</p>
<h4 className="text-2xl font-black text-blue-900 mt-1">{s.val}</h4>
</div>
))}
</div>
)}

{adminTab === 'guru' && (
<div className="space-y-4 max-w-2xl">
<div className="bg-white p-4 rounded-xl shadow-sm flex gap-2 border border-gray-100 animate-fade-up">
<input
type="text"
placeholder="Nama Guru..."
className="flex-1 bg-gray-50 border-none rounded-lg px-4 py-2 text-xs font-bold text-blue-900"
value={newInput}
onChange={(e) => setNewInput(e.target.value)}
/>
<button
onClick={() => { handleAddTeacher(newInput); setNewInput(''); }}
className="bg-blue-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all hover:-translate-y-0.5 hover:shadow-md"
>
Tambah
</button>
</div>
<div className="bg-white rounded-xl shadow-sm overflow-hidden border animate-scale-in">
<table className="w-full text-left text-xs">
<tbody className="divide-y">
{teachers.map(t => (
<tr key={t.id} className="hover:bg-gray-50 group transition-colors">
<td className="px-4 py-3 font-bold text-blue-900">
{editingItem?.id === t.id && editingItem.type === 'teacher' ? (
<input className="bg-white border rounded px-2 py-1 w-full" defaultValue={t.name} onKeyDown={(e) => e.key === 'Enter' && handleUpdateTeacher(t.id, e.target.value)} />
) : t.name}
</td>
<td className="px-4 py-3 text-right space-x-2">
<button onClick={() => setEditingItem({id: t.id, type: 'teacher'})} className="text-blue-500"><Edit3 size={14}/></button>
<button onClick={() => handleDelete('teacher', t.id)} className="text-red-400"><Trash2 size={14}/></button>
</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
)}

{adminTab === 'kelas' && (
<div className="space-y-6">
<div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-fade-up">
<h4 className="text-sm font-black text-blue-900 uppercase tracking-wide">Tambah Kelas</h4>
<p className="text-[10px] text-gray-500 font-medium mt-1">Buat kelas baru, lalu tambah siswa langsung di dalam kartu kelas.</p>
<div className="grid grid-cols-1 md:grid-cols-[1fr,220px,120px] gap-2 mt-3">
<input
type="text"
placeholder="Contoh: VII A"
className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-xs font-bold text-blue-900 outline-none"
value={newClassName}
onChange={(e) => setNewClassName(e.target.value)}
/>
<select
className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold text-blue-900 outline-none"
value={newClassTeacherId}
onChange={(e) => setNewClassTeacherId(e.target.value)}
>
<option value="">Pilih wali kelas</option>
{teachers.map(teacher => (
<option key={teacher.id} value={teacher.id}>{teacher.name}</option>
))}
</select>
<button
onClick={() => {
handleAddClass(newClassName, newClassTeacherId);
setNewClassName('');
setNewClassTeacherId('');
}}
className="bg-blue-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all hover:-translate-y-0.5 hover:shadow-md"
>
Tambah
</button>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
{classes.map(c => (
<div key={c.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border-t-4 border-blue-900 flex flex-col h-fit animate-fade-up animate-delay-fill hover:-translate-y-1 transition-all" style={getStaggerStyle(classes.findIndex(item => item.id === c.id))}>
<div className="p-4 bg-gray-50/50 flex justify-between items-center border-b">
<div>
<h5 className="font-black text-blue-900 text-sm tracking-tight">KELAS {c.name}</h5>
<p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider">Wali: {teachers.find(t => t.id === c.teacherId)?.name}</p>
</div>
<div className="flex gap-1">
<button onClick={() => handleDelete('class', c.id)} className="text-red-300 hover:text-red-500 p-1.5"><Trash2 size={14} /></button>
</div>
</div>
<div className="p-4">
<div className="flex justify-between items-center mb-3">
<span className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Siswa ({students.filter(s => s.classId === c.id).length})</span>
<button
onClick={() => setBatchModeClassId(batchModeClassId === c.id ? null : c.id)}
className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50"
>
{batchModeClassId === c.id ? 'Tutup Batch' : 'Batch'}
</button>
</div>

<div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar mb-4">
{students.filter(s => s.classId === c.id).map(s => (
<div key={s.id} className="flex justify-between items-center text-[10px] p-2 bg-gray-50 rounded-lg group">
<div className="flex items-center gap-2">
<span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[8px] ${s.gender === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>{s.gender}</span>
<span className="font-bold text-gray-700">{s.name}</span>
</div>
<button onClick={() => handleDelete('student', s.id)} className="text-red-300 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
</div>
))}
</div>
{batchModeClassId === c.id ? (
<div className="space-y-2">
<textarea
id={`batchInput-${c.id}`}
className="w-full text-[10px] bg-blue-50 border border-blue-100 rounded-lg p-2 font-bold focus:ring-1 focus:ring-blue-400 outline-none"
rows="4"
placeholder="Format: Nama, L/P"
></textarea>
<button
onClick={() => { const el = document.getElementById(`batchInput-${c.id}`); handleBatchAddStudents(el.value, c.id); el.value = ''; }}
className="w-full bg-blue-900 text-white py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm"
>
Unggah Batch
</button>
</div>
) : (
<div className="flex gap-1.5">
<input id={`newName-${c.id}`} className="flex-1 text-[10px] bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 font-bold outline-none" placeholder="Nama siswa..." />
<select id={`newGender-${c.id}`} className="bg-gray-50 border border-gray-100 rounded-lg px-1 font-bold text-[10px]">
<option value="L">L</option><option value="P">P</option>
</select>
<button onClick={() => { const nEl = document.getElementById(`newName-${c.id}`); const gEl = document.getElementById(`newGender-${c.id}`); handleAddStudent(nEl.value, c.id, gEl.value); nEl.value = ''; }} className="bg-emerald-500 text-white p-1.5 rounded-lg">
<Plus size={16} />
</button>
</div>
)}
</div>
</div>
))}
</div>
</div>
)}
</div>
);

return (
<div className="min-h-screen bg-gray-100 font-sans">
      <input
        id="backup-file-input"
        type="file"
        accept="application/json"
        onChange={importBackup}
        className="hidden"
      />
      <div className="non-printable">
        {renderTopHeader()}
        <main>
          {currentView === 'home' && renderHomeView()}
          {currentView === 'journal' && renderJournalTableView()}
          {currentView === 'admin' && renderAdminView()}
        </main>
      </div>
      <div className="printable-container">
        {isReportViewOpen && <MonthlyReportView 
          classId={selectedClassId}
          students={students}
          classes={classes}
          teachers={teachers}
          dailyLogs={dailyLogs}
          indicators={indicators}
          onClose={() => setIsReportViewOpen(false)}
        />}
      </div>
    </div>
);
};
export default App;
