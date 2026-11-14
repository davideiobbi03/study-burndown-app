import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  RotateCcw,
  Copy,
  Sparkles,
  Clock,
  Target,
  Layers,
  Undo2,
  SlidersHorizontal,
} from 'lucide-react';

// --- UTILITY DATE (Locale, senza slittamenti di fuso orario) ---
function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateStr, days) {
  const dt = parseLocalDate(dateStr);
  dt.setDate(dt.getDate() + days);
  return formatDateStr(dt);
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

const WEEKDAYS = [
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mer' },
  { id: 4, label: 'Gio' },
  { id: 5, label: 'Ven' },
  { id: 6, label: 'Sab' },
  { id: 0, label: 'Dom' },
];

const WEEKDAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

function createDefaultExam(name = 'Biochimica Clinica') {
  const today = getTodayStr();
  return {
    id: `exam_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    startDate: today,
    examDate: addDays(today, 30),
    totalPages: 450,
    reviewDays: 3,
    restDays: [0],
    targetPace: 20,
    logs: [],
  };
}

function createDemoExam() {
  const today = getTodayStr();
  const startDate = addDays(today, -11);
  const examDate = addDays(today, 18);
  const sampleDaily = [22, 18, 25, 15, 20, 12, 0, 24, 19, 16, 21, 14];
  const logs = [];

  for (let i = 0; i < 12; i++) {
    const d = addDays(startDate, i);
    const pages = sampleDaily[i] ?? 18;
    if (pages > 0) {
      logs.push({ date: d, pages });
    }
  }

  return {
    id: `exam_demo_${Date.now()}`,
    name: 'Patologia Clinica (Demo)',
    startDate,
    examDate,
    totalPages: 520,
    reviewDays: 3,
    restDays: [0],
    targetPace: 22,
    logs,
  };
}

const STORAGE_KEY = 'studyburn_state_v2';

export default function App() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.exams) && parsed.exams.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Errore lettura localStorage:', e);
    }
    const initial = createDefaultExam('Biochimica Clinica');
    return {
      exams: [initial],
      activeExamId: initial.id,
    };
  });

  const [undoStack, setUndoStack] = useState([]);
  const [isRenamingHeader, setIsRenamingHeader] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const [logMode, setLogMode] = useState('daily');
  const [logDate, setLogDate] = useState(getTodayStr());
  const [logPagesInput, setLogPagesInput] = useState('');

  const [editingLogDate, setEditingLogDate] = useState(null);
  const [editingLogPages, setEditingLogPages] = useState('');

  const headerRenameInputRef = useRef(null);
  const sidebarNameInputRef = useRef(null);

  useEffect(() => {
    document.title = 'StudyBurn — Simulatore Universitario';
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Errore salvataggio localStorage:', e);
    }
  }, [state]);

  useEffect(() => {
    if (isRenamingHeader && headerRenameInputRef.current) {
      headerRenameInputRef.current.focus();
      headerRenameInputRef.current.select();
    }
  }, [isRenamingHeader]);

  const activeExam = useMemo(() => {
    return (
      state.exams.find((ex) => ex.id === state.activeExamId) || state.exams[0]
    );
  }, [state]);

  const updateActiveExam = (updater, saveUndo = false) => {
    setState((prev) => {
      if (saveUndo) {
        setUndoStack((u) => [prev, ...u.slice(0, 9)]);
      }
      return {
        ...prev,
        exams: prev.exams.map((ex) =>
          ex.id === activeExam.id
            ? typeof updater === 'function'
              ? updater(ex)
              : { ...ex, ...updater }
            : ex
        ),
      };
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const [lastState, ...rest] = undoStack;
    setState(lastState);
    setUndoStack(rest);
  };

  const handleCreateExam = () => {
    const count = state.exams.length + 1;
    const newExam = createDefaultExam(`Nuovo Esame ${count}`);
    setUndoStack((u) => [state, ...u.slice(0, 9)]);
    setState((prev) => ({
      exams: [...prev.exams, newExam],
      activeExamId: newExam.id,
    }));
    setLogDate(getTodayStr());
    setIsRenamingHeader(true);
  };

  const handleDuplicateExam = () => {
    const copy = {
      ...activeExam,
      id: `exam_${Date.now()}`,
      name: `${activeExam.name || 'Esame'} (Copia)`,
      logs: activeExam.logs.map((l) => ({ ...l })),
    };
    setUndoStack((u) => [state, ...u.slice(0, 9)]);
    setState((prev) => ({
      exams: [...prev.exams, copy],
      activeExamId: copy.id,
    }));
    setIsRenamingHeader(true);
  };

  const handleLoadDemo = () => {
    const demo = createDemoExam();
    setUndoStack((u) => [state, ...u.slice(0, 9)]);
    setState((prev) => ({
      exams: [...prev.exams, demo],
      activeExamId: demo.id,
    }));
    setLogDate(getTodayStr());
    setIsRenamingHeader(false);
  };

  const handleDeleteExam = () => {
    if (state.exams.length <= 1) return;
    setUndoStack((u) => [state, ...u.slice(0, 9)]);
    setState((prev) => {
      const remaining = prev.exams.filter((ex) => ex.id !== activeExam.id);
      return {
        exams: remaining,
        activeExamId: remaining[0].id,
      };
    });
  };

  const handleResetExam = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    updateActiveExam({ logs: [] }, true);
    setConfirmReset(false);
  };

  const toggleRestDay = (dayId) => {
    const current = activeExam.restDays || [];
    if (!current.includes(dayId) && current.length >= 6) return;
    const updated = current.includes(dayId)
      ? current.filter((d) => d !== dayId)
      : [...current, dayId];
    updateActiveExam({ restDays: updated });
  };

  const handleAddLog = (e) => {
    e.preventDefault();
    const val = Number(logPagesInput);
    if (isNaN(val) || val < 0 || !logDate) return;

    const sortedLogs = [...(activeExam.logs || [])].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    if (logMode === 'daily') {
      if (val === 0) return;
      const existingIdx = sortedLogs.findIndex((l) => l.date === logDate);
      if (existingIdx >= 0) {
        sortedLogs[existingIdx] = {
          ...sortedLogs[existingIdx],
          pages: sortedLogs[existingIdx].pages + val,
        };
      } else {
        sortedLogs.push({ date: logDate, pages: val });
      }
    } else {
      const beforeSum = sortedLogs
        .filter((l) => l.date < logDate)
        .reduce((acc, l) => acc + l.pages, 0);
      const pagesForThisDay = Math.max(0, val - beforeSum);
      const existingIdx = sortedLogs.findIndex((l) => l.date === logDate);
      if (existingIdx >= 0) {
        if (pagesForThisDay === 0) {
          sortedLogs.splice(existingIdx, 1);
        } else {
          sortedLogs[existingIdx] = { date: logDate, pages: pagesForThisDay };
        }
      } else if (pagesForThisDay > 0) {
        sortedLogs.push({ date: logDate, pages: pagesForThisDay });
      }
    }

    sortedLogs.sort((a, b) => a.date.localeCompare(b.date));
    updateActiveExam({ logs: sortedLogs }, true);
    setLogPagesInput('');
  };

  const handleSaveEditedLog = (date) => {
    const val = Number(editingLogPages);
    if (isNaN(val) || val < 0) return;
    const updated =
      val === 0
        ? activeExam.logs.filter((l) => l.date !== date)
        : activeExam.logs.map((l) =>
            l.date === date ? { ...l, pages: val } : l
          );
    updateActiveExam({ logs: updated }, true);
    setEditingLogDate(null);
  };

  const handleDeleteLog = (date) => {
    const updated = activeExam.logs.filter((l) => l.date !== date);
    updateActiveExam({ logs: updated }, true);
  };

  const analytics = useMemo(() => {
    const today = getTodayStr();
    const totalPages = Math.max(1, Number(activeExam.totalPages) || 1);
    const startDate = activeExam.startDate || today;
    const examDate =
      activeExam.examDate && activeExam.examDate >= startDate
        ? activeExam.examDate
        : addDays(startDate, 14);
    const restDays = activeExam.restDays || [];

    const allDates = [];
    let cursor = startDate;
    let safety = 0;
    while (cursor <= examDate && safety < 730) {
      allDates.push(cursor);
      cursor = addDays(cursor, 1);
      safety++;
    }

    const totalCalendarDays = Math.max(1, allDates.length);
    const safeReviewDays = Math.min(
      Math.max(0, Number(activeExam.reviewDays) || 0),
      Math.max(0, totalCalendarDays - 1)
    );
    const studyDeadline = addDays(examDate, -safeReviewDays);

    const logMap = {};
    (activeExam.logs || []).forEach((l) => {
      logMap[l.date] = (logMap[l.date] || 0) + Number(l.pages || 0);
    });

    const completedPages = Object.values(logMap).reduce((a, b) => a + b, 0);
    const remainingPages = Math.max(0, totalPages - completedPages);
    const completionPct = Math.min(100, (completedPages / totalPages) * 100);

    const studyDates = allDates.filter((d) => d <= studyDeadline);
    const usefulStudyDates = studyDates.filter(
      (d) => !restDays.includes(parseLocalDate(d).getDay())
    );
    const totalUsefulDays = Math.max(1, usefulStudyDates.length);
    const initialMinPace = totalPages / totalUsefulDays;

    const loggedToday = (logMap[today] || 0) > 0;
    const futureStart = loggedToday ? addDays(today, 1) : today;
    const remainingUsefulDaysRaw = usefulStudyDates.filter(
      (d) => d >= futureStart
    ).length;
    const remainingUsefulDays = Math.max(0, remainingUsefulDaysRaw);

    const daysToExam = Math.max(
      0,
      allDates.filter((d) => d >= today).length - 1
    );

    const elapsedUsefulDates = usefulStudyDates.filter((d) =>
      loggedToday ? d <= today : d < today
    );
    const activeLoggedDaysCount = Object.keys(logMap).filter(
      (d) => logMap[d] > 0
    ).length;
    const denominatorDays = Math.max(
      1,
      elapsedUsefulDates.length,
      activeLoggedDaysCount
    );
    const realDailyAvg =
      completedPages > 0 ? completedPages / denominatorDays : 0;

    const newRequiredPace =
      remainingPages === 0
        ? 0
        : remainingUsefulDays > 0
        ? remainingPages / remainingUsefulDays
        : remainingPages;

    const chartData = [];
    chartData.push({
      date: 'Inizio',
      rawDate: addDays(startDate, -1),
      ideale: totalPages,
      reale: totalPages,
      proiezione: today < startDate ? totalPages : null,
      isRest: false,
      isReview: false,
    });

    let cumIdealPages = 0;
    let cumRealPages = 0;
    const lastLogDate = Object.keys(logMap).sort().pop() || '';
    const realCutoffDate = today > lastLogDate ? today : lastLogDate;

    Object.keys(logMap).forEach((d) => {
      if (d < startDate) cumRealPages += logMap[d];
    });

    let idealRemainingAtCutoff = totalPages;

    allDates.forEach((d) => {
      const dayOfWeek = parseLocalDate(d).getDay();
      const isRest = restDays.includes(dayOfWeek);
      const isReview = d > studyDeadline;

      if (!isReview && !isRest) {
        cumIdealPages += initialMinPace;
      }
      const idealeVal = Math.max(
        0,
        Number((totalPages - cumIdealPages).toFixed(1))
      );

      if (logMap[d]) {
        cumRealPages += logMap[d];
      }
      const realeVal =
        d <= realCutoffDate ? Math.max(0, totalPages - cumRealPages) : null;

      if (d <= realCutoffDate) {
        idealRemainingAtCutoff = idealeVal;
      }

      chartData.push({
        date: formatShortDate(d),
        rawDate: d,
        ideale: idealeVal,
        reale: realeVal,
        proiezione: d === realCutoffDate ? realeVal : null,
        isRest,
        isReview,
      });
    });

    let estimatedFinishDate = null;
    if (remainingPages === 0) {
      estimatedFinishDate = lastLogDate || today;
    } else if (realDailyAvg > 0) {
      let projRem = remainingPages;
      let projCursor = realCutoffDate;
      let projSteps = 0;

      for (let i = 0; i < chartData.length; i++) {
        const pt = chartData[i];
        if (pt.rawDate > realCutoffDate) {
          const isRest = restDays.includes(
            parseLocalDate(pt.rawDate).getDay()
          );
          if (!isRest && projRem > 0) {
            projRem = Math.max(0, Number((projRem - realDailyAvg).toFixed(1)));
            if (projRem === 0 && !estimatedFinishDate) {
              estimatedFinishDate = pt.rawDate;
            }
          }
          pt.proiezione = projRem;
        }
      }

      while (projRem > 0 && projSteps < 365) {
        projCursor = addDays(projCursor, 1);
        const isRest = restDays.includes(parseLocalDate(projCursor).getDay());
        if (!isRest) {
          projRem = Math.max(0, projRem - realDailyAvg);
          if (projRem === 0) {
            estimatedFinishDate = projCursor;
            break;
          }
        }
        projSteps++;
      }
    }

    const idealCompletedByNow = Math.max(
      0,
      totalPages - idealRemainingAtCutoff
    );
    const pagesDelta = completedPages - idealCompletedByNow;
    const delayPages = Math.max(0, -pagesDelta);
    const delayPct = (delayPages / totalPages) * 100;

    let status = 'green';
    let statusTitle = 'IN LINEA / IN ANTICIPO';
    let statusHeadline = '';
    let statusDetail = '';

    if (remainingPages === 0) {
      status = 'green';
      statusTitle = 'OBIETTIVO COMPLETATO';
      statusHeadline = 'Hai completato il 100% delle pagine previste!';
      statusDetail =
        'Puoi dedicare i giorni rimanenti al ripasso generale e alla consolidazione.';
    } else if (completedPages === 0 && today <= startDate) {
      status = 'green';
      statusTitle = 'IN LINEA / IN ANTICIPO';
      statusHeadline = 'Giorno 1: pronto a partire!';
      statusDetail = `Inizia registrando le pagine di oggi. Obiettivo giornaliero consigliato: ${Math.ceil(
        initialMinPace
      )} pagine per restare perfettamente in tabella.`;
    } else if (
      delayPct >= 10 ||
      (realDailyAvg > 0 &&
        estimatedFinishDate &&
        estimatedFinishDate > studyDeadline) ||
      (remainingUsefulDays === 0 && remainingPages > 0)
    ) {
      status = 'red';
      statusTitle = 'RITARDO CRITICO';
      const finishInfo = estimatedFinishDate
        ? `Con il ritmo attuale (${realDailyAvg.toFixed(
            1
          )} pag/gg) finirai il ${formatShortDate(
            estimatedFinishDate
          )}, oltre la scadenza studio (${formatShortDate(studyDeadline)}).`
        : 'Non hai ancora registrato abbastanza pagine rispetto alla tabella di marcia.';
      statusHeadline = `Devi passare da ${realDailyAvg.toFixed(
        1
      )} a ${newRequiredPace.toFixed(1)} pag/giorno per arrivare in tempo.`;
      statusDetail = `${finishInfo} Accelera di +${Math.max(
        0,
        newRequiredPace - realDailyAvg
      ).toFixed(1)} pag/giorno nei prossimi ${remainingUsefulDays} giorni utili.`;
    } else if (delayPages > 0) {
      status = 'yellow';
      statusTitle = 'ATTENZIONE (LIEVE RITARDO)';
      const recoveryDays = Math.min(3, Math.max(1, remainingUsefulDays));
      const extraPerDay = Math.ceil(delayPages / recoveryDays);
      statusHeadline = `Sei indietro di ${Math.round(
        delayPages
      )} pagine (${delayPct.toFixed(1)}% del programma).`;
      statusDetail = `Ti basta aggiungere +${extraPerDay} pagine extra al giorno nei prossimi ${recoveryDays} giorni utili (arrivando a ${Math.ceil(
        initialMinPace + extraPerDay
      )} pag/gg) per rientrare in linea.`;
    } else {
      status = 'green';
      statusTitle = 'IN LINEA / IN ANTICIPO';
      const daysAhead = Math.floor(pagesDelta / Math.max(1, initialMinPace));
      statusHeadline =
        daysAhead >= 1
          ? `Ottimo ritmo! Hai accumulato ${daysAhead} ${
              daysAhead === 1 ? 'giorno' : 'giorni'
            } di vantaggio.`
          : 'Sei perfettamente in linea con la tabella di marcia!';
      statusDetail = `Mantieni una media di almeno ${newRequiredPace.toFixed(
        1
      )} pag/giorno per arrivare al ripasso finale senza stress.`;
    }

    return {
      totalPages,
      completedPages,
      remainingPages,
      completionPct,
      totalUsefulDays,
      remainingUsefulDays,
      daysToExam,
      safeReviewDays,
      studyDeadline,
      initialMinPace,
      realDailyAvg,
      newRequiredPace,
      chartData,
      todayShort: formatShortDate(today),
      reviewShort: safeReviewDays > 0 ? formatShortDate(studyDeadline) : null,
      status,
      statusTitle,
      statusHeadline,
      statusDetail,
    };
  }, [activeExam]);

  const historyRows = useMemo(() => {
    const sorted = [...(activeExam.logs || [])].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    let running = 0;
    return sorted
      .map((item) => {
        running += Number(item.pages || 0);
        const dayIdx = parseLocalDate(item.date).getDay();
        return {
          ...item,
          cumulative: running,
          weekday: WEEKDAY_NAMES[dayIdx],
          isRestDay: (activeExam.restDays || []).includes(dayIdx),
        };
      })
      .reverse();
  }, [activeExam]);

  const statusStyles = {
    green: {
      wrapper: 'bg-emerald-50/90 border-emerald-200 text-emerald-950',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
      lineColor: '#10b981',
      Icon: CheckCircle2,
    },
    yellow: {
      wrapper: 'bg-amber-50/90 border-amber-200 text-amber-950',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-500 text-white',
      lineColor: '#f59e0b',
      Icon: AlertTriangle,
    },
    red: {
      wrapper: 'bg-rose-50/90 border-rose-200 text-rose-950',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      iconBg: 'bg-rose-600 text-white',
      lineColor: '#e11d48',
      Icon: AlertOctagon,
    },
  }[analytics.status];

  const StatusIcon = statusStyles.Icon;

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans pb-14">
      {/* Reset stili predefiniti Vite per occupare il 100% dello schermo senza fasce scure */}
      <style>{`
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          min-height: 100vh !important;
          display: block !important;
          background-color: #f8fafc !important;
          text-align: left !important;
        }
      `}</style>

      {/* HEADER A LARGHEZZA PIENA */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  StudyBurn
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Simulatore Universitario
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tabella di marcia adattiva, Burn-down Chart e proiezione
                d&apos;esame
              </p>
            </div>
          </div>

          {/* Controlli Multi-Esame & Rinomina Rapida */}
          <div className="flex flex-wrap items-center gap-2">
            {isRenamingHeader ? (
              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-300 rounded-xl px-2.5 py-1">
                <input
                  ref={headerRenameInputRef}
                  type="text"
                  value={activeExam.name ?? ''}
                  placeholder="Nome materia..."
                  onChange={(e) => updateActiveExam({ name: e.target.value })}
                  onBlur={() => {
                    if (!activeExam.name || !activeExam.name.trim()) {
                      updateActiveExam({ name: 'Esame senza nome' });
                    }
                    setIsRenamingHeader(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      if (!activeExam.name || !activeExam.name.trim()) {
                        updateActiveExam({ name: 'Esame senza nome' });
                      }
                      setIsRenamingHeader(false);
                    }
                  }}
                  className="bg-white text-sm font-semibold text-slate-900 px-2.5 py-1 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-56"
                />
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (!activeExam.name || !activeExam.name.trim()) {
                      updateActiveExam({ name: 'Esame senza nome' });
                    }
                    setIsRenamingHeader(false);
                  }}
                  className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  title="Conferma nome"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
                <div className="flex items-center gap-1.5 pl-2">
                  <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    value={activeExam.id}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        activeExamId: e.target.value,
                      }))
                    }
                    className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 pr-2 py-1 focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[230px] truncate"
                  >
                    {state.exams.map((ex) => {
                      const done = (ex.logs || []).reduce(
                        (s, l) => s + Number(l.pages || 0),
                        0
                      );
                      const pct = Math.min(
                        100,
                        Math.round((done / Math.max(1, ex.totalPages)) * 100)
                      );
                      return (
                        <option key={ex.id} value={ex.id}>
                          {ex.name || 'Esame senza nome'} ({pct}%)
                        </option>
                      );
                    })}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRenamingHeader(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-indigo-700 hover:bg-white transition"
                  title="Rinomina materia"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Rinomina</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateExam}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuovo Esame
            </button>

            <button
              type="button"
              onClick={handleLoadDemo}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Carica Demo Avanzata
            </button>

            <button
              type="button"
              onClick={handleDuplicateExam}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white text-slate-700 border border-slate-200 text-xs font-medium hover:bg-slate-50 transition"
              title="Duplica esame corrente"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Duplica</span>
            </button>

            <button
              type="button"
              onClick={handleResetExam}
              className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition ${
                confirmReset
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Azzera i progressi di questo esame"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{confirmReset ? 'Conferma Reset?' : 'Reset'}</span>
            </button>

            {state.exams.length > 1 && (
              <button
                type="button"
                onClick={handleDeleteExam}
                className="inline-flex items-center p-2 rounded-xl bg-white text-rose-600 border border-slate-200 hover:bg-rose-50 transition"
                title="Elimina questo esame"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CONTENUTO PRINCIPALE A LARGHEZZA PIENA */}
      <main className="w-full px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* BANNER DI STATO DINAMICO */}
        <section
          className={`rounded-2xl border p-4 sm:p-5 transition-colors shadow-sm ${statusStyles.wrapper}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${statusStyles.iconBg}`}
            >
              <StatusIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusStyles.badge}`}
                >
                  {analytics.statusTitle}
                </span>
                <button
                  type="button"
                  onClick={() => setIsRenamingHeader(true)}
                  className="font-semibold text-slate-700 hover:text-indigo-700 inline-flex items-center gap-1 underline decoration-dotted underline-offset-4"
                  title="Clicca per modificare il nome della materia"
                >
                  Esame: {activeExam.name || 'Esame senza nome'}
                  <Edit3 className="w-3 h-3 opacity-70" />
                </button>
                <span className="text-slate-400">•</span>
                <span className="font-semibold text-slate-700">
                  Appello: {formatShortDate(activeExam.examDate)}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {analytics.statusHeadline}
              </h2>
              <p className="text-xs sm:text-sm opacity-90">
                {analytics.statusDetail}
              </p>
            </div>
          </div>
        </section>

        {/* 4 CARD KPI IN TEMPO REALE */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Pagine Rimanenti</span>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {analytics.remainingPages}
              </span>
              <span className="text-sm font-medium text-slate-400">
                / {analytics.totalPages} pag
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${analytics.completionPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Completate:{' '}
                  <strong className="text-slate-700">
                    {analytics.completedPages}
                  </strong>
                </span>
                <span className="font-semibold text-indigo-600">
                  {analytics.completionPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Giorni Utili Mancanti</span>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {analytics.remainingUsefulDays}
              </span>
              <span className="text-sm font-medium text-slate-400">
                giorni utili
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>
                All&apos;appello:{' '}
                <strong className="text-slate-700">
                  {analytics.daysToExam} gg
                </strong>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                {analytics.safeReviewDays} gg ripasso
              </span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Media Reale</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {analytics.realDailyAvg.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-slate-400">
                pag/giorno
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>Su {analytics.totalUsefulDays} gg utili</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold border border-amber-200/70">
                Target {activeExam.targetPace || 0}
              </span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Nuova Media Richiesta</span>
              <Target className="w-4 h-4 text-rose-400" />
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span
                className={`text-3xl font-extrabold ${
                  analytics.newRequiredPace > analytics.initialMinPace * 1.15
                    ? 'text-rose-600'
                    : 'text-emerald-600'
                }`}
              >
                {analytics.newRequiredPace.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-slate-400">
                pag/giorno
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>Minimo iniziale:</span>
              <strong className="text-slate-700">
                {analytics.initialMinPace.toFixed(1)} pag/gg
              </strong>
            </div>
          </div>
        </section>

        {/* GRIGLIA PRINCIPALE: GRAFICO + REGISTRO A SINISTRA | PARAMETRI A DESTRA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLONNA SINISTRA (8 col) */}
          <div className="lg:col-span-8 space-y-6">
            {/* BURN-DOWN CHART */}
            <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Burn-down Chart — {activeExam.name || 'Esame'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confronto tra discesa ideale, pagine reali rimanenti e
                    proiezione futura
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-500" />
                    Ideale
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: statusStyles.lineColor }}
                    />
                    Reale
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                    <span className="w-3 h-0.5 border-t-2 border-dotted border-indigo-500" />
                    Proiezione
                  </span>
                </div>
              </div>

              <div className="h-[340px] sm:h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={analytics.chartData}
                    margin={{ top: 18, right: 16, left: -12, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      minTickGap={22}
                    />
                    <YAxis
                      domain={[0, analytics.totalPages]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                      }}
                      labelStyle={{
                        fontWeight: 700,
                        marginBottom: '4px',
                        color: '#e2e8f0',
                      }}
                      formatter={(value, name) => {
                        const labels = {
                          ideale: 'Ideale rimanenti',
                          reale: 'Reale rimanenti',
                          proiezione: 'Proiezione stimata',
                        };
                        return [`${value} pag`, labels[name] || name];
                      }}
                    />

                    <ReferenceLine
                      x={analytics.todayShort}
                      stroke="#6366f1"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Oggi',
                        position: 'top',
                        fill: '#4f46e5',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    />

                    {analytics.reviewShort && (
                      <ReferenceLine
                        x={analytics.reviewShort}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        label={{
                          value: 'Ripasso',
                          position: 'top',
                          fill: '#d97706',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      />
                    )}

                    <Line
                      type="monotone"
                      dataKey="ideale"
                      stroke="#64748b"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="reale"
                      stroke={statusStyles.lineColor}
                      strokeWidth={3}
                      dot={{ r: 3, fill: statusStyles.lineColor }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="proiezione"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      strokeDasharray="2 5"
                      dot={false}
                      connectNulls={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* REGISTRO AVANZAMENTO REALE E STORICO */}
            <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Registro Avanzamento Reale
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inserisci le pagine studiate oggi o aggiorna il totale
                    completato finora
                  </p>
                </div>

                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start">
                  <button
                    type="button"
                    onClick={() => setLogMode('daily')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      logMode === 'daily'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    + Pagine del giorno
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogMode('cumulative')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      logMode === 'cumulative'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Totale completato
                  </button>
                </div>
              </div>

              <form
                onSubmit={handleAddLog}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-50 p-3.5 rounded-xl border border-slate-200/80"
              >
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data studio
                  </label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {logMode === 'daily'
                      ? 'Pagine studiate nella giornata'
                      : `Totale pagine completate (su ${analytics.totalPages})`}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={analytics.totalPages * 2}
                    placeholder={
                      logMode === 'daily'
                        ? 'Es. 20'
                        : `Attuale: ${analytics.completedPages}`
                    }
                    value={logPagesInput}
                    onChange={(e) => setLogPagesInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Registra
                  </button>
                </div>

                {logMode === 'daily' && (
                  <div className="sm:col-span-12 flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-medium text-slate-500">
                      Aggiunta rapida:
                    </span>
                    {[5, 10, 20, 30].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          setLogPagesInput((prev) =>
                            String((Number(prev) || 0) + preset)
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition"
                      >
                        +{preset} pag
                      </button>
                    ))}
                  </div>
                )}
              </form>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Storico Giornate Registrate ({historyRows.length})
                  </h4>
                  {undoStack.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      Annulla ultima modifica
                    </button>
                  )}
                </div>

                {historyRows.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    Nessuna sessione registrata finora. Inserisci le prime pagine
                    studiate qui sopra per attivare la linea reale e la
                    proiezione.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-2.5 px-3">Data</th>
                          <th className="py-2.5 px-3">Pagine Giorno</th>
                          <th className="py-2.5 px-3">Totale Cumulato</th>
                          <th className="py-2.5 px-3 text-right">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historyRows.map((row) => (
                          <tr
                            key={row.date}
                            className="hover:bg-slate-50/80 transition"
                          >
                            <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                              <span>{formatShortDate(row.date)}</span>
                              <span className="ml-1.5 text-xs text-slate-400">
                                ({row.weekday})
                              </span>
                              {row.isRestDay && (
                                <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  Riposo
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3">
                              {editingLogDate === row.date ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={editingLogPages}
                                  onChange={(e) =>
                                    setEditingLogPages(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveEditedLog(row.date);
                                    } else if (e.key === 'Escape') {
                                      setEditingLogDate(null);
                                    }
                                  }}
                                  className="w-20 px-2 py-1 rounded-lg border border-indigo-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-bold text-indigo-700">
                                  +{row.pages} pag
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-slate-600">
                              {row.cumulative} / {analytics.totalPages} pag
                            </td>

                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              {editingLogDate === row.date ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSaveEditedLog(row.date)
                                    }
                                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                    title="Salva"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingLogDate(null)}
                                    className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                                    title="Annulla"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingLogDate(row.date);
                                      setEditingLogPages(String(row.pages));
                                    }}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                    title="Modifica pagine"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLog(row.date)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                                    title="Elimina giornata"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* COLONNA DESTRA: PANNELLO CONFIGURAZIONE (4 col) */}
          <aside className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-start gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 mt-0.5">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Parametri Tabella di Marcia
                </h3>
                <p className="text-xs text-slate-500">
                  Modifica in qualsiasi momento con ricalcolo istantaneo
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nome dell&apos;esame / materia
                </label>
                <input
                  ref={sidebarNameInputRef}
                  type="text"
                  value={activeExam.name ?? ''}
                  placeholder="Es. Biochimica Clinica, Endocrinologia..."
                  onChange={(e) => updateActiveExam({ name: e.target.value })}
                  onBlur={() => {
                    if (!activeExam.name || !activeExam.name.trim()) {
                      updateActiveExam({ name: 'Esame senza nome' });
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Inizio studio
                  </label>
                  <input
                    type="date"
                    value={activeExam.startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      if (!newStart) return;
                      updateActiveExam((ex) => ({
                        ...ex,
                        startDate: newStart,
                        examDate:
                          ex.examDate < newStart
                            ? addDays(newStart, 7)
                            : ex.examDate,
                      }));
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Data appello
                  </label>
                  <input
                    type="date"
                    value={activeExam.examDate}
                    min={activeExam.startDate}
                    onChange={(e) => {
                      const newExamDate = e.target.value;
                      if (!newExamDate) return;
                      updateActiveExam({ examDate: newExamDate });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Totale pagine
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={activeExam.totalPages}
                    onChange={(e) =>
                      updateActiveExam({
                        totalPages: Math.max(1, Number(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Giorni ripasso finale
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={activeExam.reviewDays}
                    onChange={(e) =>
                      updateActiveExam({
                        reviewDays: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Giorni di riposo settimanali
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {(activeExam.restDays || []).length} off/sett
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAYS.map((day) => {
                    const isSelected = (activeExam.restDays || []).includes(
                      day.id
                    );
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleRestDay(day.id)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Ritmo target iniziale (pag/giorno)
                  </label>
                  <span className="text-[11px] font-semibold text-indigo-600">
                    Minimo: {analytics.initialMinPace.toFixed(1)} pag/gg
                  </span>
                </div>

                <input
                  type="number"
                  min="1"
                  max="500"
                  value={activeExam.targetPace}
                  onChange={(e) =>
                    updateActiveExam({
                      targetPace: Math.max(1, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    (Number(activeExam.targetPace) || 0) >=
                    analytics.initialMinPace
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}
                >
                  {(Number(activeExam.targetPace) || 0) >=
                  analytics.initialMinPace ? (
                    <>
                      <strong>Target sostenibile:</strong> con{' '}
                      <strong>{activeExam.targetPace} pag/giorno</strong>{' '}
                      superi il minimo necessario di{' '}
                      <strong>
                        +
                        {(
                          (Number(activeExam.targetPace) || 0) -
                          analytics.initialMinPace
                        ).toFixed(1)}{' '}
                        pag/gg
                      </strong>{' '}
                      su {analytics.totalUsefulDays} giorni utili.
                    </>
                  ) : (
                    <>
                      <strong>Target inferiore al minimo:</strong> per finire{' '}
                      {analytics.totalPages} pagine in{' '}
                      {analytics.totalUsefulDays} giorni utili servono almeno{' '}
                      <strong>
                        {analytics.initialMinPace.toFixed(1)} pag/giorno
                      </strong>{' '}
                      (+
                      {(
                        analytics.initialMinPace -
                        (Number(activeExam.targetPace) || 0)
                      ).toFixed(1)}{' '}
                      pag/gg rispetto al target).
                    </>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
