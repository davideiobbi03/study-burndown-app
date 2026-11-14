import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
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
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Copy,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Layers,
  Award,
  Sliders,
  FileText,
  ArrowRight,
  Undo2,
} from 'lucide-react';

// ============================================================================
// COSTANTI E UTILITÀ PER DATE (IMMUNI A PROBLEMI DI FUSO ORARIO / DST)
// ============================================================================

const STORAGE_KEY = 'uni_study_burndown_plans_v1';
const ACTIVE_EXAM_KEY = 'uni_study_burndown_active_id_v1';

// Giorni della settimana ordinati da Lunedì (1) a Domenica (0) per la UI italiana
const WEEKDAYS_IT = [
  { day: 1, short: 'Lun', full: 'Lunedì' },
  { day: 2, short: 'Mar', full: 'Martedì' },
  { day: 3, short: 'Mer', full: 'Mercoledì' },
  { day: 4, short: 'Gio', full: 'Giovedì' },
  { day: 5, short: 'Ven', full: 'Venerdì' },
  { day: 6, short: 'Sab', full: 'Sabato' },
  { day: 0, short: 'Dom', full: 'Domenica' },
];

const WEEKDAY_NAMES_BY_INDEX = [
  'Domenica',
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
];

const WEEKDAY_SHORT_BY_INDEX = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

/**
 * Restituisce la data locale odierna nel formato YYYY-MM-DD
 */
function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converte una stringa YYYY-MM-DD in un oggetto Date a mezzanotte locale
 */
function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

/**
 * Formatta un oggetto Date locale in YYYY-MM-DD
 */
function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Somma (o sottrae) un numero intero di giorni a una data YYYY-MM-DD
 */
function addDays(dateStr, days) {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}

/**
 * Differenza esatta in giorni di calendario tra due date YYYY-MM-DD (end - start)
 */
function diffDays(startStr, endStr) {
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

/**
 * Formatta YYYY-MM-DD in GG/MM
 */
function formatShortDate(dateStr) {
  if (!dateStr) return '--/--';
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

/**
 * Formatta YYYY-MM-DD in formato leggibile italiano (es. "Sab 14/11")
 */
function formatDayAndShortDate(dateStr) {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  const dayShort = WEEKDAY_SHORT_BY_INDEX[d.getDay()];
  return `${dayShort} ${formatShortDate(dateStr)}`;
}

/**
 * Restituisce l'indice del giorno della settimana (0=Dom ... 6=Sab)
 */
function getDayOfWeek(dateStr) {
  return parseLocalDate(dateStr).getDay();
}

/**
 * Genera un ID univoco leggero
 */
function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

// ============================================================================
// GENERAZIONE PIANI PREDEFINITI E DEMO AVANZATA
// ============================================================================

/**
 * Crea l'esame predefinito al primo avvio dell'applicazione
 */
function createDefaultExam() {
  const today = getTodayStr();
  return {
    id: 'exam-default-biochimica',
    name: 'Biochimica Clinica',
    startDate: today,
    examDate: addDays(today, 30),
    totalPages: 450,
    reviewMarginDays: 3,
    restDays: [0], // Domenica di riposo
    targetDailyPages: 20,
    logs: [],
  };
}

/**
 * Crea uno scenario di esempio realistico con 12 giorni di storico già compilati
 * utile per testare immediatamente proiezioni, KPI e alert dinamici
 */
function createAdvancedDemoExam() {
  const today = getTodayStr();
  const startDate = addDays(today, -12);
  const examDate = addDays(today, 18);

  const sampleNotes = [
    'Sbobine 1-2: Introduzione e adattamenti cellulari',
    'Capitolo 2: Infiammazione acuta e mediatori chimici',
    'Infiammazione cronica e riparazione tissutale',
    'Capitolo 3: Emodinamica, edema e trombosi',
    'Ripasso rapido + schemi immunopatologia',
    'Neoplasie: nomenclatura e biologia della crescita',
    'Basi molecolari del cancro (oncogeni e oncosoppressori)',
    'Sbobine 8-9: Patologia cardiovascolare',
    'Aterosclerosi e cardiopatia ischemica',
    'Capitolo 6: Patologia dell’apparato respiratorio',
    'Pneumopatie ostruttive e restrittive',
  ];

  // Costruiamo 12 giorni di log realistici (saltando le domeniche e includendo un calo lieve)
  const samplePaces = [24, 22, 20, 18, 25, 16, 15, 22, 19, 14, 17];
  const logs = [];
  let noteIdx = 0;

  for (let i = 12; i >= 1; i--) {
    const dateStr = addDays(today, -i);
    const dow = getDayOfWeek(dateStr);
    // Domenica (0) riposo
    if (dow === 0) continue;

    const pages = samplePaces[noteIdx % samplePaces.length];
    logs.push({
      id: generateId('demo-log'),
      date: dateStr,
      pages,
      note: sampleNotes[noteIdx % sampleNotes.length],
    });
    noteIdx++;
  }

  return {
    id: generateId('exam-demo'),
    name: 'Anatomia Patologica (Demo Avanzata)',
    startDate,
    examDate,
    totalPages: 540,
    reviewMarginDays: 3,
    restDays: [0],
    targetDailyPages: 22,
    logs,
  };
}

// ============================================================================
// MOTORE DI CALCOLO BURN-DOWN, KPI, ALERT E PROIEZIONE FUTURA
// ============================================================================

function computeStudySimulation(exam) {
  const todayStr = getTodayStr();
  const totalPages = Math.max(1, Number(exam.totalPages) || 1);
  const reviewMarginDays = Math.max(0, Number(exam.reviewMarginDays) || 0);
  const restDays = Array.isArray(exam.restDays) ? exam.restDays : [];
  const targetDailyPages = Math.max(1, Number(exam.targetDailyPages) || 1);

  const startDate = exam.startDate || todayStr;
  const examDate = exam.examDate || addDays(startDate, 30);

  // Controllo validità date
  const totalSpanDays = diffDays(startDate, examDate);
  const isInvalidDateRange = totalSpanDays < 0;

  if (isInvalidDateRange) {
    return {
      isInvalidDateRange: true,
      chartData: [],
      kpis: {
        remainingPages: totalPages,
        completedPages: 0,
        completionPercent: 0,
        remainingUsefulDays: 0,
        totalDaysToExam: 0,
        realDailyAverage: 0,
        requiredNewPace: totalPages,
        initialMinPace: totalPages,
        totalUsefulDays: 0,
        elapsedUsefulDays: 0,
        idealRemainingToday: totalPages,
        projectedFinishDate: null,
        lastStudyDay: startDate,
      },
      alert: {
        status: 'red',
        title: 'Intervallo date non valido',
        message:
          'La data dell’appello è precedente alla data di inizio studio. Correggi le date nel pannello di configurazione.',
      },
      dailyTotalsMap: {},
    };
  }

  // Aggrega pagine studiate per singola data YYYY-MM-DD
  const dailyTotalsMap = {};
  const validLogs = Array.isArray(exam.logs) ? exam.logs : [];
  for (const log of validLogs) {
    if (!log.date) continue;
    const p = Math.max(0, Number(log.pages) || 0);
    dailyTotalsMap[log.date] = (dailyTotalsMap[log.date] || 0) + p;
  }

  // Ultimo giorno utile per studiare nuove pagine (prima del margine di ripasso e dell'appello)
  // Se totalSpanDays === 0 (esame oggi), lastStudyDay = startDate
  let lastStudyDay =
    totalSpanDays === 0
      ? startDate
      : addDays(examDate, -1 - reviewMarginDays);

  if (diffDays(startDate, lastStudyDay) < 0) {
    lastStudyDay = startDate;
  }

  // Costruiamo l'elenco di tutti i giorni dal startDate fino a examDate inclusa
  const allDates = [];
  for (let i = 0; i <= totalSpanDays; i++) {
    allDates.push(addDays(startDate, i));
  }

  // Identifica i giorni utili di studio (compresi tra startDate e lastStudyDay, non di riposo)
  let usefulStudyDates = allDates.filter((d) => {
    const inStudyWindow = diffDays(startDate, d) >= 0 && diffDays(d, lastStudyDay) >= 0;
    const isRest = restDays.includes(getDayOfWeek(d));
    return inStudyWindow && !isRest;
  });

  // Fallback di sicurezza se l'utente seleziona tutti e 7 i giorni come riposo
  if (usefulStudyDates.length === 0) {
    usefulStudyDates = allDates.filter(
      (d) => diffDays(startDate, d) >= 0 && diffDays(d, lastStudyDay) >= 0
    );
    if (usefulStudyDates.length === 0) {
      usefulStudyDates = [startDate];
    }
  }

  const totalUsefulDays = usefulStudyDates.length;
  const initialMinPace = totalPages / totalUsefulDays;

  // Calcolo pagine completate totali e fino ad oggi
  const completedPages = validLogs.reduce(
    (sum, item) => sum + (Math.max(0, Number(item.pages) || 0)),
    0
  );
  const remainingPages = Math.max(0, totalPages - completedPages);
  const completionPercent = Math.min(100, (completedPages / totalPages) * 100);

  // Data effettiva di riferimento per "oggi" all'interno della timeline
  const effectiveToday =
    diffDays(startDate, todayStr) < 0
      ? startDate
      : diffDays(todayStr, examDate) < 0
      ? examDate
      : todayStr;

  // Giorni utili trascorsi fino ad oggi (incluso oggi se oggi è un giorno utile)
  const hasStarted = diffDays(startDate, todayStr) >= 0;
  let elapsedUsefulDays = 0;
  if (hasStarted) {
    elapsedUsefulDays = allDates.filter((d) => {
      const upToToday = diffDays(d, effectiveToday) <= 0;
      const inStudyWindow = diffDays(d, lastStudyDay) >= 0;
      const isRest = restDays.includes(getDayOfWeek(d));
      return upToToday && inStudyWindow && !isRest;
    }).length;
    // Garantiamo almeno 1 giorno utile se lo studio è iniziato (per evitare divisioni per 0)
    elapsedUsefulDays = Math.max(1, elapsedUsefulDays);
  }

  // Pagine completate fino a effectiveToday
  const completedUpToToday = validLogs
    .filter((l) => diffDays(l.date, effectiveToday) >= 0)
    .reduce((sum, l) => sum + Math.max(0, Number(l.pages) || 0), 0);

  const realRemainingToday = Math.max(0, totalPages - completedUpToToday);

  // Media reale (pagine per giorno utile trascorso)
  const realDailyAverage =
    hasStarted && elapsedUsefulDays > 0 ? completedUpToToday / elapsedUsefulDays : 0;

  // Giorni utili rimanenti (da domani fino a lastStudyDay se oggi ha già log o è passato;
  // se oggi non ha log ed è giorno utile, includiamo oggi nei giorni utili rimanenti!)
  const todayHasLog = (dailyTotalsMap[todayStr] || 0) > 0;
  const remainingUsefulDays = allDates.filter((d) => {
    const isFutureOrUnloggedToday = todayHasLog
      ? diffDays(todayStr, d) > 0
      : diffDays(todayStr, d) >= 0;
    const inStudyWindow = diffDays(d, lastStudyDay) >= 0;
    const isRest = restDays.includes(getDayOfWeek(d));
    return isFutureOrUnloggedToday && inStudyWindow && !isRest;
  }).length;

  const totalDaysToExam = Math.max(0, diffDays(todayStr, examDate));

  // Nuova media richiesta da oggi/domani in poi
  const requiredNewPace =
    remainingPages === 0
      ? 0
      : remainingUsefulDays > 0
      ? remainingPages / remainingUsefulDays
      : remainingPages;

  // Calcolo serie temporale per il Grafico Burn-down
  let idealRemainingCursor = totalPages;
  let idealRemainingToday = totalPages;

  // Primo passaggio: calcola linea ideale e linea reale giorno per giorno
  const rawSeries = allDates.map((dateStr) => {
    const dow = getDayOfWeek(dateStr);
    const isRest = restDays.includes(dow);
    const isStudyWindow =
      diffDays(startDate, dateStr) >= 0 && diffDays(dateStr, lastStudyDay) >= 0;
    const isReviewDay =
      !isStudyWindow && diffDays(dateStr, examDate) > 0 && reviewMarginDays > 0;
    const isExamDay = dateStr === examDate;

    // Aggiornamento linea ideale
    if (isStudyWindow && !isRest) {
      idealRemainingCursor = Math.max(0, idealRemainingCursor - initialMinPace);
    } else if (!isStudyWindow) {
      idealRemainingCursor = 0;
    }

    const idealVal = Number(idealRemainingCursor.toFixed(1));
    if (dateStr === effectiveToday) {
      idealRemainingToday = idealVal;
    }

    // Linea reale fino a effectiveToday (o fino all'ultimo log se successivo)
    const isPastOrToday = diffDays(dateStr, effectiveToday) >= 0;
    let realVal = null;
    if (isPastOrToday && hasStarted) {
      const doneSoFar = validLogs
        .filter((l) => diffDays(l.date, dateStr) >= 0)
        .reduce((sum, l) => sum + Math.max(0, Number(l.pages) || 0), 0);
      realVal = Math.max(0, totalPages - doneSoFar);
    } else if (!hasStarted && dateStr === startDate) {
      realVal = totalPages;
    }

    return {
      date: dateStr,
      shortDate: formatShortDate(dateStr),
      dayName: WEEKDAY_SHORT_BY_INDEX[dow],
      fullDayName: WEEKDAY_NAMES_BY_INDEX[dow],
      isRest,
      isReviewDay,
      isExamDay,
      pagesLoggedToday: dailyTotalsMap[dateStr] || 0,
      ideal: idealVal,
      real: realVal,
      projected: null,
    };
  });

  // Secondo passaggio: proiezione futura da effectiveToday in poi basata sulla media reale
  let projCursor = realRemainingToday;
  for (let i = 0; i < rawSeries.length; i++) {
    const point = rawSeries[i];
    const diffFromToday = diffDays(effectiveToday, point.date);

    if (diffFromToday === 0 && hasStarted) {
      // Punto di aggancio continuo tra Linea Reale e Proiezione Futura
      point.projected = projCursor;
    } else if (diffFromToday > 0 && hasStarted) {
      if (projCursor > 0 && realDailyAverage > 0 && !point.isRest) {
        projCursor = Math.max(0, projCursor - realDailyAverage);
      }
      point.projected = Number(projCursor.toFixed(1));
    }
  }

  // Calcolo data esatta stimata di fine studio secondo la media reale attuale
  let projectedFinishDate = null;
  if (realRemainingToday === 0) {
    // Trova l'ultima data in cui ha raggiunto 0 pagine
    const sortedLogs = [...validLogs].sort((a, b) => a.date.localeCompare(b.date));
    let acc = 0;
    for (const l of sortedLogs) {
      acc += Math.max(0, Number(l.pages) || 0);
      if (acc >= totalPages) {
        projectedFinishDate = l.date;
        break;
      }
    }
    if (!projectedFinishDate) projectedFinishDate = effectiveToday;
  } else if (realDailyAverage > 0) {
    let simRemaining = realRemainingToday;
    let simDate = effectiveToday;
    // Se oggi non ha ancora log ed è giorno utile, simuliamo che possa studiare da oggi;
    // altrimenti partiamo da domani
    if (!todayHasLog && !restDays.includes(getDayOfWeek(effectiveToday))) {
      simRemaining = Math.max(0, simRemaining - realDailyAverage);
    }
    let safetyCounter = 0;
    while (simRemaining > 0.01 && safetyCounter < 730) {
      simDate = addDays(simDate, 1);
      safetyCounter++;
      if (!restDays.includes(getDayOfWeek(simDate))) {
        simRemaining = Math.max(0, simRemaining - realDailyAverage);
      }
    }
    projectedFinishDate = simDate;
  }

  // ==========================================================================
  // CALCOLO SISTEMA DI ALERT DINAMICO (VERDE / GIALLO / ROSSO)
  // ==========================================================================
  let alert = {
    status: 'green',
    title: 'In linea con la tabella di marcia',
    message: '',
  };

  if (remainingPages === 0) {
    const daysEarly = Math.max(0, diffDays(projectedFinishDate || todayStr, examDate));
    alert = {
      status: 'green',
      title: 'Obiettivo Completato al 100%!',
      message: `Complimenti! Hai completato tutte le ${totalPages} pagine previste${
        daysEarly > 0
          ? ` con ${daysEarly} ${daysEarly === 1 ? 'giorno' : 'giorni'} di anticipo rispetto all’appello.`
          : ' in perfetto orario per l’appello.'
      }`,
    };
  } else if (!hasStarted) {
    alert = {
      status: 'green',
      title: 'Piano programmato e pronto',
      message: `Lo studio inizierà il ${formatShortDate(startDate)}. Ritmo minimo necessario: ${initialMinPace.toFixed(
        1
      )} pag/giorno su ${totalUsefulDays} giorni utili.`,
    };
  } else if (validLogs.length === 0 && todayStr === startDate) {
    alert = {
      status: 'green',
      title: 'Giorno 1: pronto a partire!',
      message: `Inizia registrando le pagine di oggi. Obiettivo giornaliero consigliato: ${Math.ceil(
        initialMinPace
      )} pagine per restare perfettamente in tabella.`,
    };
  } else {
    // Confronto tra pagine rimanenti reali oggi e pagine rimanenti ideali oggi
    const deltaPages = idealRemainingToday - realRemainingToday; // >= 0 significa in anticipo/in linea
    const pagesBehind = Math.max(0, -deltaPages);
    const lagPercent = (pagesBehind / totalPages) * 100;

    if (deltaPages >= -0.5) {
      // VERDE: In linea o in anticipo
      const daysAhead = initialMinPace > 0 ? deltaPages / initialMinPace : 0;
      if (deltaPages < 1) {
        alert = {
          status: 'green',
          title: 'Perfettamente in linea',
          message: `Stai rispettando al millimetro la tabella di marcia (${completedUpToToday}/${totalPages} pagine completate). Mantieni ${requiredNewPace.toFixed(
            1
          )} pag/giorno.`,
        };
      } else {
        alert = {
          status: 'green',
          title: `In anticipo di ${Math.round(deltaPages)} pagine!`,
          message: `Ottimo ritmo: hai accumulato circa ${daysAhead.toFixed(
            1
          )} giorni di vantaggio sulla tabella ideale. Puoi proseguire con ${requiredNewPace.toFixed(
            1
          )} pag/giorno.`,
        };
      }
    } else {
      // Lo studente è indietro rispetto alla linea ideale
      const finishesAfterExam =
        projectedFinishDate !== null && diffDays(examDate, projectedFinishDate) > 0;
      const isNoProgressYet = realDailyAverage <= 0;

      if (lagPercent < 10 && !finishesAfterExam && !isNoProgressYet) {
        // GIALLO: Attenzione (scostamento < 10% e proiezione entro l'appello)
        const recoveryWindow = Math.max(1, Math.min(3, remainingUsefulDays || 1));
        const extraPagesPerDay = Math.ceil(pagesBehind / recoveryWindow);

        alert = {
          status: 'yellow',
          title: `Attenzione: ritardo lieve di ${Math.round(pagesBehind)} pagine (${lagPercent.toFixed(
            1
          )}%)`,
          message: `Aggiungi +${extraPagesPerDay} pag/giorno nei prossimi ${recoveryWindow} ${
            recoveryWindow === 1 ? 'giorno utile' : 'giorni utili'
          } per rientrare perfettamente nella tabella di marcia.`,
        };
      } else {
        // ROSSO: Ritardo critico (>= 10% o proiezione oltre l'appello o 0 pagine studiate)
        if (isNoProgressYet) {
          alert = {
            status: 'red',
            title: `Ritardo critico: ancora 0 pagine registrate`,
            message: `Sei indietro di ${Math.round(
              pagesBehind
            )} pagine rispetto alla tabella ideale. Devi iniziare subito con ${requiredNewPace.toFixed(
              1
            )} pag/giorno per arrivare in tempo all’appello.`,
          };
        } else if (finishesAfterExam) {
          alert = {
            status: 'red',
            title: 'Ritardo critico: proiezione oltre la data dell’appello!',
            message: `Al ritmo attuale (${realDailyAverage.toFixed(
              1
            )} pag/giorno) finirai il ${formatShortDate(
              projectedFinishDate
            )}, dopo l’appello del ${formatShortDate(examDate)}. Devi passare da ${realDailyAverage.toFixed(
              1
            )} a ${requiredNewPace.toFixed(1)} pag/giorno per arrivare in tempo.`,
          };
        } else {
          alert = {
            status: 'red',
            title: `Ritardo critico: indietro di ${Math.round(pagesBehind)} pagine (${lagPercent.toFixed(
              1
            )}%)`,
            message: `Stai erodendo il margine di ripasso finale. Devi accelerare da ${realDailyAverage.toFixed(
              1
            )} a ${requiredNewPace.toFixed(
              1
            )} pag/giorno per chiudere lo studio entro il ${formatShortDate(lastStudyDay)}.`,
          };
        }
      }
    }
  }

  return {
    isInvalidDateRange: false,
    chartData: rawSeries,
    dailyTotalsMap,
    kpis: {
      remainingPages,
      completedPages,
      completionPercent,
      remainingUsefulDays,
      totalDaysToExam,
      realDailyAverage,
      requiredNewPace,
      initialMinPace,
      totalUsefulDays,
      elapsedUsefulDays,
      idealRemainingToday,
      projectedFinishDate,
      lastStudyDay,
      targetDailyPages,
    },
    alert,
  };
}

// ============================================================================
// TOOLTIP PERSONALIZZATO DEL GRAFICO BURN-DOWN
// ============================================================================

function CustomBurnDownTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  if (!data) return null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs max-w-xs">
      <div className="flex items-center justify-between gap-3 border-b border-slate-700/80 pb-2 mb-2">
        <span className="font-bold text-sm text-white">
          {data.fullDayName} {data.shortDate}
        </span>
        {data.isExamDay ? (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
            Appello
          </span>
        ) : data.isReviewDay ? (
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
            Ripasso Finale
          </span>
        ) : data.isRest ? (
          <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
            Riposo
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
            Giorno Studio
          </span>
        )}
      </div>

      <div className="space-y-1.5 tabular-nums">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-300 flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-slate-400 inline-block" />
            Rimanenti Ideali:
          </span>
          <span className="font-semibold text-slate-100">{data.ideal} pag</span>
        </div>

        {data.real !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-emerald-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              Rimanenti Reali:
            </span>
            <span className="font-bold text-white">{data.real} pag</span>
          </div>
        )}

        {data.projected !== null && data.real === null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-indigo-300 flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 border-b-2 border-dotted border-indigo-400 inline-block" />
              Stima Proiettata:
            </span>
            <span className="font-semibold text-indigo-200">{data.projected} pag</span>
          </div>
        )}

        {data.pagesLoggedToday > 0 && (
          <div className="pt-1.5 mt-1.5 border-t border-slate-700/80 flex items-center justify-between gap-4 text-emerald-300">
            <span>Studiate in questa data:</span>
            <span className="font-bold">+{data.pagesLoggedToday} pag</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPALE APPLICAZIONE
// ============================================================================

export default function App() {
  // 1. Stato persistente dei piani di esame salvati su localStorage
  const [exams, setExams] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Errore lettura localStorage:', e);
    }
    return [createDefaultExam()];
  });

  const [activeExamId, setActiveExamId] = useState(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_EXAM_KEY);
      if (savedId) return savedId;
    } catch (e) {
      console.error('Errore lettura activeExamId:', e);
    }
    return 'exam-default-biochimica';
  });

  // Salvataggio automatico su localStorage ad ogni variazione
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
    } catch (e) {
      console.error('Errore salvataggio esami:', e);
    }
  }, [exams]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_EXAM_KEY, activeExamId);
    } catch (e) {
      console.error('Errore salvataggio activeExamId:', e);
    }
  }, [activeExamId]);

  // Esame attualmente selezionato (con fallback al primo disponibile)
  const currentExam = useMemo(() => {
    return exams.find((e) => e.id === activeExamId) || exams[0];
  }, [exams, activeExamId]);

  // Stato UI per conferme inline (nessun window.confirm/alert)
  const [confirmAction, setConfirmAction] = useState(null); // 'reset' | 'delete' | null
  const [toastMessage, setToastMessage] = useState(null);
  const [lastDeletedLog, setLastDeletedLog] = useState(null);

  // Stato UI per la sezione "Registro Avanzamento Reale"
  const [logMode, setLogMode] = useState('incremental'); // 'incremental' | 'cumulative'
  const [logDate, setLogDate] = useState(getTodayStr());
  const [logPagesInput, setLogPagesInput] = useState('');
  const [logNoteInput, setLogNoteInput] = useState('');
  const [logFormError, setLogFormError] = useState('');

  // Stato UI per la modifica inline di una riga dello storico
  const [editingLogId, setEditingLogId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editPages, setEditPages] = useState('');
  const [editNote, setEditNote] = useState('');

  // Visibilità linee nel grafico
  const [visibleLines, setVisibleLines] = useState({
    ideal: true,
    real: true,
    projected: true,
  });

  // Helper per mostrare notifiche non invasive
  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage((prev) => (prev === text ? null : prev));
    }, 3500);
  };

  // Aggiorna i campi dell'esame attivo in tempo reale
  const updateCurrentExam = (updater) => {
    setExams((prev) =>
      prev.map((exam) => {
        if (exam.id !== currentExam.id) return exam;
        return typeof updater === 'function' ? updater(exam) : { ...exam, ...updater };
      })
    );
  };

  // Esegui il motore di simulazione completo
  const simulation = useMemo(() => computeStudySimulation(currentExam), [currentExam]);

  // Calcolo totale pagine già completate fino alla `logDate` selezionata (utile per modalità cumulativa)
  const cumulativeUpToSelectedDate = useMemo(() => {
    if (!currentExam || !Array.isArray(currentExam.logs)) return 0;
    return currentExam.logs
      .filter((l) => diffDays(l.date, logDate) >= 0)
      .reduce((sum, l) => sum + Math.max(0, Number(l.pages) || 0), 0);
  }, [currentExam, logDate]);

  // ==========================================================================
  // GESTIONE MULTI-ESAME (NUOVO, DUPLICA, DEMO AVANZATA, RESET, ELIMINA)
  // ==========================================================================

  const handleCreateNewExam = () => {
    const today = getTodayStr();
    const newExam = {
      id: generateId('exam'),
      name: `Nuovo Esame ${exams.length + 1}`,
      startDate: today,
      examDate: addDays(today, 25),
      totalPages: 300,
      reviewMarginDays: 2,
      restDays: [0],
      targetDailyPages: 15,
      logs: [],
    };
    setExams((prev) => [...prev, newExam]);
    setActiveExamId(newExam.id);
    setConfirmAction(null);
    showToast('Nuovo piano di studio creato!');
  };

  const handleDuplicateExam = () => {
    const cloned = {
      ...currentExam,
      id: generateId('exam-copy'),
      name: `${currentExam.name} (Copia)`,
      logs: currentExam.logs.map((l) => ({ ...l, id: generateId('log') })),
    };
    setExams((prev) => [...prev, cloned]);
    setActiveExamId(cloned.id);
    setConfirmAction(null);
    showToast('Piano duplicato con successo!');
  };

  const handleLoadAdvancedDemo = () => {
    const demoExam = createAdvancedDemoExam();
    setExams((prev) => [demoExam, ...prev]);
    setActiveExamId(demoExam.id);
    setConfirmAction(null);
    showToast('Demo Avanzata con 12 giorni di storico caricata!');
  };

  const handleResetCurrentExam = () => {
    updateCurrentExam((exam) => ({
      ...exam,
      logs: [],
    }));
    setConfirmAction(null);
    setLastDeletedLog(null);
    showToast('Storico pagine azzerato per questo esame.');
  };

  const handleDeleteCurrentExam = () => {
    if (exams.length <= 1) return;
    const remaining = exams.filter((e) => e.id !== currentExam.id);
    setExams(remaining);
    setActiveExamId(remaining[0].id);
    setConfirmAction(null);
    showToast('Esame eliminato.');
  };

  // ==========================================================================
  // GESTIONE REGISTRO AVANZAMENTO E STORICO MODIFICABILE
  // ==========================================================================

  const toggleRestDay = (dayIndex) => {
    updateCurrentExam((exam) => {
      const exists = exam.restDays.includes(dayIndex);
      const nextRestDays = exists
        ? exam.restDays.filter((d) => d !== dayIndex)
        : [...exam.restDays, dayIndex];
      return { ...exam, restDays: nextRestDays };
    });
  };

  const handleAddLog = (e) => {
    e.preventDefault();
    setLogFormError('');

    const rawVal = Number(logPagesInput);
    if (!logDate) {
      setLogFormError('Seleziona una data valida.');
      return;
    }

    if (logMode === 'incremental') {
      if (isNaN(rawVal) || rawVal <= 0) {
        setLogFormError('Inserisci un numero di pagine maggiore di 0.');
        return;
      }

      const newLog = {
        id: generateId('log'),
        date: logDate,
        pages: Math.round(rawVal),
        note: logNoteInput.trim(),
      };

      updateCurrentExam((exam) => ({
        ...exam,
        logs: [...exam.logs, newLog],
      }));

      setLogPagesInput('');
      setLogNoteInput('');
      showToast(`+${newLog.pages} pagine registrate il ${formatShortDate(logDate)}`);
    } else {
      // Modalità cumulativa: "Aggiorna totale completato finora"
      if (isNaN(rawVal) || rawVal < 0) {
        setLogFormError('Inserisci un totale pagine valido.');
        return;
      }
      const targetCumulative = Math.min(currentExam.totalPages, Math.round(rawVal));
      const delta = targetCumulative - cumulativeUpToSelectedDate;

      if (delta <= 0) {
        setLogFormError(
          `Alla data ${formatShortDate(
            logDate
          )} hai già completato ${cumulativeUpToSelectedDate} pagine. Per ridurre il totale modifica una riga nello storico sottostante.`
        );
        return;
      }

      const newLog = {
        id: generateId('log'),
        date: logDate,
        pages: delta,
        note:
          logNoteInput.trim() || `Aggiornamento totale (${targetCumulative} pag completate)`,
      };

      updateCurrentExam((exam) => ({
        ...exam,
        logs: [...exam.logs, newLog],
      }));

      setLogPagesInput('');
      setLogNoteInput('');
      showToast(
        `Totale aggiornato a ${targetCumulative} pag (+${delta} pag il ${formatShortDate(logDate)})`
      );
    }
  };

  const handleQuickAddPages = (amount) => {
    setLogFormError('');
    if (logMode === 'incremental') {
      const current = Number(logPagesInput) || 0;
      setLogPagesInput(String(current + amount));
    } else {
      const base =
        logPagesInput !== '' && !isNaN(Number(logPagesInput))
          ? Number(logPagesInput)
          : cumulativeUpToSelectedDate;
      setLogPagesInput(String(Math.min(currentExam.totalPages, base + amount)));
    }
  };

  const startEditingLog = (log) => {
    setEditingLogId(log.id);
    setEditDate(log.date);
    setEditPages(String(log.pages));
    setEditNote(log.note || '');
  };

  const saveEditedLog = (logId) => {
    const parsedPages = Math.max(1, Math.round(Number(editPages) || 0));
    if (!editDate || parsedPages <= 0) return;

    updateCurrentExam((exam) => ({
      ...exam,
      logs: exam.logs.map((l) =>
        l.id === logId
          ? {
              ...l,
              date: editDate,
              pages: parsedPages,
              note: editNote.trim(),
            }
          : l
      ),
    }));
    setEditingLogId(null);
    showToast('Giornata aggiornata.');
  };

  const deleteLog = (log) => {
    updateCurrentExam((exam) => ({
      ...exam,
      logs: exam.logs.filter((l) => l.id !== log.id),
    }));
    setLastDeletedLog({ examId: currentExam.id, log });
  };

  const undoDeleteLog = () => {
    if (!lastDeletedLog) return;
    setExams((prev) =>
      prev.map((exam) =>
        exam.id === lastDeletedLog.examId
          ? { ...exam, logs: [...exam.logs, lastDeletedLog.log] }
          : exam
      )
    );
    setLastDeletedLog(null);
    showToast('Voce ripristinata nello storico.');
  };

  // Storico ordinato cronologicamente con calcolo cumulativo e pagine rimanenti progressivo
  const enrichedSortedLogs = useMemo(() => {
    const sorted = [...(currentExam.logs || [])].sort((a, b) => a.date.localeCompare(b.date));
    let cumulative = 0;
    return sorted.map((log) => {
      cumulative += Math.max(0, Number(log.pages) || 0);
      const remaining = Math.max(0, (Number(currentExam.totalPages) || 0) - cumulative);
      return {
        ...log,
        cumulative,
        remaining,
      };
    });
  }, [currentExam]);

  // ==========================================================================
  // STILI DINAMICI PER ALERT E LINEA REALE DEL GRAFICO
  // ==========================================================================

  const alertStyles = {
    green: {
      container: 'bg-emerald-50 border-emerald-300 text-emerald-950',
      iconWrap: 'bg-emerald-600 text-white',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      badgeText: 'IN LINEA / IN ANTICIPO',
      strokeColor: '#059669', // emerald-600
      Icon: CheckCircle2,
    },
    yellow: {
      container: 'bg-amber-50 border-amber-300 text-amber-950',
      iconWrap: 'bg-amber-500 text-white',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      badgeText: 'ATTENZIONE • SCOSTAMENTO < 10%',
      strokeColor: '#d97706', // amber-600
      Icon: AlertTriangle,
    },
    red: {
      container: 'bg-rose-50 border-rose-300 text-rose-950',
      iconWrap: 'bg-rose-600 text-white',
      badge: 'bg-rose-100 text-rose-900 border-rose-300',
      badgeText: 'RITARDO CRITICO',
      strokeColor: '#e11d48', // rose-600
      Icon: AlertCircle,
    },
  };

  const currentAlertTheme = alertStyles[simulation.alert.status] || alertStyles.green;
  const AlertIcon = currentAlertTheme.Icon;

  const todayStr = getTodayStr();
  const { kpis } = simulation;

  // Confronto ritmo target iniziale vs ritmo minimo necessario
  const targetDiffFromMin = (Number(currentExam.targetDailyPages) || 0) - kpis.initialMinPace;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-12">
      {/* ====================================================================
          HEADER MULTI-ESAME E AZIONI RAPIDE
      ==================================================================== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Brand + Titolo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                    StudyBurn
                  </h1>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Simulatore Universitario
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Tabella di marcia adattiva, Burn-down Chart e proiezione d’esame
                </p>
              </div>
            </div>

            {/* Controlli Multi-Esame */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Selettore esami salvati */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 max-w-full overflow-x-auto">
                <Layers className="w-4 h-4 text-slate-500 ml-2 shrink-0" />
                <select
                  aria-label="Seleziona esame"
                  value={currentExam.id}
                  onChange={(e) => {
                    setActiveExamId(e.target.value);
                    setConfirmAction(null);
                    setEditingLogId(null);
                  }}
                  className="bg-transparent text-sm font-semibold text-slate-800 pr-2 py-1 focus:outline-none cursor-pointer max-w-[200px] sm:max-w-[260px] truncate"
                >
                  {exams.map((ex) => {
                    const done = (ex.logs || []).reduce(
                      (s, l) => s + (Number(l.pages) || 0),
                      0
                    );
                    const pct = Math.min(
                      100,
                      Math.round((done / Math.max(1, Number(ex.totalPages) || 1)) * 100)
                    );
                    return (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({pct}%)
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                type="button"
                onClick={handleCreateNewExam}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
                title="Crea una nuova tabella di marcia"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuovo Esame</span>
              </button>

              <button
                type="button"
                onClick={handleLoadAdvancedDemo}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
                title="Carica un esame realistico con 12 giorni di storico già compilati"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Carica Demo Avanzata</span>
              </button>

              <button
                type="button"
                onClick={handleDuplicateExam}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                title="Duplica l'esame corrente"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Duplica</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfirmAction((prev) => (prev === 'reset' ? null : 'reset'))
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                title="Azzera i progressi di questo esame"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset</span>
              </button>

              {exams.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction((prev) => (prev === 'delete' ? null : 'delete'))
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium bg-white text-rose-600 border border-slate-200 hover:bg-rose-50 transition cursor-pointer"
                  title="Elimina questo esame"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Barra di conferma inline per Reset o Eliminazione (sostituisce window.confirm) */}
          {confirmAction && (
            <div className="mt-3 p-3 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span>
                {confirmAction === 'reset'
                  ? `Vuoi azzerare tutte le pagine registrate per "${currentExam.name}"?`
                  : `Vuoi eliminare definitivamente il piano "${currentExam.name}"?`}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={
                    confirmAction === 'reset'
                      ? handleResetCurrentExam
                      : handleDeleteCurrentExam
                  }
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 font-semibold text-white cursor-pointer"
                >
                  Conferma
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-medium text-slate-200 cursor-pointer"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Notifica Toast / Undo */}
      {(toastMessage || lastDeletedLog) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-md">
            <span>
              {lastDeletedLog
                ? `Voce del ${formatShortDate(lastDeletedLog.log.date)} (+${
                    lastDeletedLog.log.pages
                  } pag) eliminata.`
                : toastMessage}
            </span>
            <div className="flex items-center gap-2">
              {lastDeletedLog && (
                <button
                  type="button"
                  onClick={undoDeleteLog}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Annulla</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setToastMessage(null);
                  setLastDeletedLog(null);
                }}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Chiudi avviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          CONTENUTO PRINCIPALE DASHBOARD
      ==================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* 1. BANNER DI STATO DINAMICO */}
        <section
          aria-live="polite"
          className={`rounded-2xl border p-4 sm:p-5 transition-colors shadow-xs ${currentAlertTheme.container}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${currentAlertTheme.iconWrap}`}
            >
              <AlertIcon className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className={`text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${currentAlertTheme.badge}`}
                >
                  {currentAlertTheme.badgeText}
                </span>
                <span className="text-xs font-medium opacity-75">
                  Esame: <strong>{currentExam.name}</strong> • Appello:{' '}
                  <strong>{formatShortDate(currentExam.examDate)}</strong>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold leading-snug">
                {simulation.alert.title}
              </h2>
              <p className="text-sm opacity-90 mt-0.5 leading-relaxed">
                {simulation.alert.message}
              </p>
            </div>

            {kpis.projectedFinishDate && kpis.remainingPages > 0 && (
              <div className="sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l border-current/15 pt-3 sm:pt-0 sm:pl-4">
                <div className="text-[11px] uppercase tracking-wider font-semibold opacity-75">
                  Fine stimata attuale
                </div>
                <div className="text-lg font-extrabold tabular-nums">
                  {formatDayAndShortDate(kpis.projectedFinishDate)}
                </div>
                <div className="text-xs opacity-80">
                  Fine studio ideale: {formatShortDate(kpis.lastStudyDay)}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. 4 CARD KPI RIASSUNTIVE */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* KPI 1: Pagine Rimanenti */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Pagine Rimanenti
                </span>
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {kpis.remainingPages}
                </span>
                <span className="text-sm font-medium text-slate-500 tabular-nums">
                  / {currentExam.totalPages} pag
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-medium">
                  Completate: <strong className="tabular-nums">{kpis.completedPages}</strong>
                </span>
                <span className="font-bold text-indigo-600 tabular-nums">
                  {kpis.completionPercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${kpis.completionPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* KPI 2: Giorni Utili Mancanti */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Giorni Utili Mancanti
                </span>
                <Calendar className="w-4 h-4 text-slate-700" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {kpis.remainingUsefulDays}
                </span>
                <span className="text-sm font-medium text-slate-500">
                  {kpis.remainingUsefulDays === 1 ? 'giorno utile' : 'giorni utili'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                All’appello: <strong className="tabular-nums">{kpis.totalDaysToExam} gg</strong>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium tabular-nums">
                {currentExam.reviewMarginDays} gg ripasso
              </span>
            </div>
          </div>

          {/* KPI 3: Media Reale */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Media Reale
                </span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  {kpis.realDailyAverage.toFixed(1)}
                </span>
                <span className="text-sm font-medium text-slate-500">pag/giorno</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 tabular-nums">
                Su {kpis.elapsedUsefulDays} {kpis.elapsedUsefulDays === 1 ? 'gg utile' : 'gg utili'}
              </span>
              {kpis.realDailyAverage >= Number(currentExam.targetDailyPages) ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Target {currentExam.targetDailyPages}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Target {currentExam.targetDailyPages}
                </span>
              )}
            </div>
          </div>

          {/* KPI 4: Nuova Media Richiesta */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Nuova Media Richiesta
                </span>
                <Target className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-extrabold tabular-nums ${
                    kpis.requiredNewPace > kpis.initialMinPace * 1.15
                      ? 'text-rose-600'
                      : kpis.requiredNewPace <= kpis.initialMinPace
                      ? 'text-emerald-600'
                      : 'text-slate-900'
                  }`}
                >
                  {kpis.requiredNewPace.toFixed(1)}
                </span>
                <span className="text-sm font-medium text-slate-500">pag/giorno</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Minimo iniziale:</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {kpis.initialMinPace.toFixed(1)} pag/gg
              </span>
            </div>
          </div>
        </section>

        {/* 3. GRIGLIA PRINCIPALE: GRAFICO + REGISTRO (8 COL) & CONFIGURAZIONE (4 COL) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* COLONNA SINISTRA (8/12): GRAFICO BURN-DOWN + REGISTRO AVANZAMENTO */}
          <div className="xl:col-span-8 space-y-6">
            {/* GRAFICO BURN-DOWN INTERATTIVO */}
            <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Burn-down Chart dello Studio
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Confronto tra discesa ideale, pagine reali rimanenti e proiezione futura
                  </p>
                </div>

                {/* Toggle interattivi delle 3 curve */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleLines((prev) => ({ ...prev, ideal: !prev.ideal }))
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                      visibleLines.ideal
                        ? 'bg-slate-100 border-slate-300 text-slate-800'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="w-3 h-0.5 border-b-2 border-dashed border-slate-500" />
                    <span>Ideale</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setVisibleLines((prev) => ({ ...prev, real: !prev.real }))
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                      visibleLines.real
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: currentAlertTheme.strokeColor }}
                    />
                    <span>Reale</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setVisibleLines((prev) => ({
                        ...prev,
                        projected: !prev.projected,
                      }))
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                      visibleLines.projected
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="w-3 h-0.5 border-b-2 border-dotted border-indigo-500" />
                    <span>Proiezione</span>
                  </button>
                </div>
              </div>

              {simulation.isInvalidDateRange ? (
                <div className="h-72 flex items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-300 text-sm text-slate-500 p-6 text-center">
                  Imposta una data dell’appello uguale o successiva alla data di inizio studio per
                  visualizzare il grafico.
                </div>
              ) : (
                <div className="w-full h-[320px] sm:h-[370px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={simulation.chartData}
                      margin={{ top: 18, right: 16, left: -10, bottom: 8 }}
                    >
                      <defs>
                        <linearGradient id="realAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={currentAlertTheme.strokeColor}
                            stopOpacity={0.14}
                          />
                          <stop
                            offset="95%"
                            stopColor={currentAlertTheme.strokeColor}
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

                      <XAxis
                        dataKey="shortDate"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#cbd5e1' }}
                        minTickGap={26}
                      />

                      <YAxis
                        domain={[0, currentExam.totalPages]}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip content={<CustomBurnDownTooltip />} />

                      {/* Linea verticale Oggi */}
                      {diffDays(currentExam.startDate, todayStr) >= 0 &&
                        diffDays(todayStr, currentExam.examDate) >= 0 && (
                          <ReferenceLine
                            x={formatShortDate(todayStr)}
                            stroke="#0f172a"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{
                              value: 'Oggi',
                              position: 'top',
                              fill: '#0f172a',
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          />
                        )}

                      {/* Linea verticale Inizio Ripasso Finale (se margine > 0) */}
                      {Number(currentExam.reviewMarginDays) > 0 &&
                        diffDays(currentExam.startDate, addDays(kpis.lastStudyDay, 1)) > 0 &&
                        diffDays(addDays(kpis.lastStudyDay, 1), currentExam.examDate) > 0 && (
                          <ReferenceLine
                            x={formatShortDate(addDays(kpis.lastStudyDay, 1))}
                            stroke="#6366f1"
                            strokeDasharray="3 3"
                            strokeWidth={1.2}
                            label={{
                              value: 'Ripasso',
                              position: 'top',
                              fill: '#4f46e5',
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          />
                        )}

                      {/* Linea Ideale (tratteggiata grigio-blu) */}
                      {visibleLines.ideal && (
                        <Line
                          type="monotone"
                          dataKey="ideal"
                          name="Linea Ideale"
                          stroke="#64748b"
                          strokeWidth={2}
                          strokeDasharray="6 4"
                          dot={false}
                          activeDot={{ r: 4, fill: '#475569' }}
                          isAnimationActive={false}
                        />
                      )}

                      {/* Area sottile sotto la Linea Reale */}
                      {visibleLines.real && (
                        <Area
                          type="monotone"
                          dataKey="real"
                          fill="url(#realAreaGradient)"
                          stroke="none"
                          isAnimationActive={false}
                        />
                      )}

                      {/* Linea Reale (continua, colorata dinamicamente) */}
                      {visibleLines.real && (
                        <Line
                          type="monotone"
                          dataKey="real"
                          name="Andamento Reale"
                          stroke={currentAlertTheme.strokeColor}
                          strokeWidth={3}
                          dot={{
                            r: 3,
                            fill: currentAlertTheme.strokeColor,
                            strokeWidth: 1.5,
                            stroke: '#ffffff',
                          }}
                          activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                          connectNulls={false}
                          isAnimationActive={false}
                        />
                      )}

                      {/* Proiezione Futura (linea punteggiata) */}
                      {visibleLines.projected && (
                        <Line
                          type="monotone"
                          dataKey="projected"
                          name="Proiezione Futura"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          strokeDasharray="3 4"
                          dot={false}
                          activeDot={{ r: 4, fill: '#6366f1' }}
                          connectNulls={false}
                          isAnimationActive={false}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Legenda sintetica piè di grafico */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Inizio: <strong className="text-slate-700">{formatShortDate(currentExam.startDate)}</strong>
                  </span>
                  <span>
                    Fine studio prevista:{' '}
                    <strong className="text-slate-700">{formatShortDate(kpis.lastStudyDay)}</strong>
                  </span>
                  <span>
                    Appello: <strong className="text-slate-700">{formatShortDate(currentExam.examDate)}</strong>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  I giorni di riposo mantengono piatta la curva ideale
                </span>
              </div>
            </section>

            {/* REGISTRO AVANZAMENTO REALE E STORICO MODIFICABILE */}
            <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Registro Avanzamento Reale
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Registra le pagine studiate oggi o aggiorna il totale cumulativo raggiunto
                  </p>
                </div>

                {/* Selettore modalità di inserimento */}
                <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 self-start">
                  <button
                    type="button"
                    onClick={() => {
                      setLogMode('incremental');
                      setLogPagesInput('');
                      setLogFormError('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      logMode === 'incremental'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    + Pagine del giorno
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLogMode('cumulative');
                      setLogPagesInput('');
                      setLogFormError('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      logMode === 'cumulative'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Totale completato
                  </button>
                </div>
              </div>

              {/* Form inserimento rapido */}
              <form
                onSubmit={handleAddLog}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Data */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Numero pagine */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {logMode === 'incremental'
                        ? 'Pagine studiate'
                        : 'Nuovo totale pagine'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={currentExam.totalPages * 2}
                      placeholder={
                        logMode === 'incremental'
                          ? 'es. 25'
                          : `Attuale: ${cumulativeUpToSelectedDate}`
                      }
                      value={logPagesInput}
                      onChange={(e) => setLogPagesInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Nota opzionale */}
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Note / Argomento (opzionale)
                    </label>
                    <input
                      type="text"
                      placeholder="es. Capitolo 4 - Enzimi e cinetica"
                      value={logNoteInput}
                      onChange={(e) => setLogNoteInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Pulsanti rapidi + Submit */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-500 mr-1">Rapidi:</span>
                    {[5, 10, 20, 30].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickAddPages(val)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-xs font-semibold text-slate-700 tabular-nums transition cursor-pointer"
                      >
                        +{val} pag
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registra Progresso</span>
                  </button>
                </div>

                {/* Helper contestuale in modalità cumulativa */}
                {logMode === 'cumulative' && (
                  <div className="text-xs text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between">
                    <span>
                      Totale registrato fino al <strong>{formatShortDate(logDate)}</strong>:{' '}
                      <strong className="tabular-nums">{cumulativeUpToSelectedDate} pag</strong>
                    </span>
                    {logPagesInput !== '' &&
                      Number(logPagesInput) > cumulativeUpToSelectedDate && (
                        <span className="font-semibold text-indigo-600 tabular-nums">
                          Verrà aggiunto: +
                          {Math.min(currentExam.totalPages, Math.round(Number(logPagesInput))) -
                            cumulativeUpToSelectedDate}{' '}
                          pag
                        </span>
                      )}
                  </div>
                )}

                {logFormError && (
                  <p className="text-xs font-medium text-rose-600">{logFormError}</p>
                )}
              </form>

              {/* Tabella Storico Modificabile */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>Storico Giornate ({enrichedSortedLogs.length})</span>
                  </h3>
                  {enrichedSortedLogs.length > 0 && (
                    <span className="text-xs text-slate-500">
                      Clicca sull’icona matita per correggere una giornata
                    </span>
                  )}
                </div>

                {enrichedSortedLogs.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
                    <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">
                      Nessuna sessione di studio registrata finora
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Inserisci le pagine studiate oggi qui sopra oppure prova &ldquo;Carica Demo
                      Avanzata&rdquo; nell’header.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                          <th className="py-3 px-3.5 font-semibold">Data</th>
                          <th className="py-3 px-3.5 font-semibold text-right">Pagine</th>
                          <th className="py-3 px-3.5 font-semibold text-right">Cumulativo</th>
                          <th className="py-3 px-3.5 font-semibold text-right hidden sm:table-cell">
                            Rimanenti
                          </th>
                          <th className="py-3 px-3.5 font-semibold">Note</th>
                          <th className="py-3 px-3.5 font-semibold text-right">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[...enrichedSortedLogs].reverse().map((log) => {
                          const isEditing = editingLogId === log.id;

                          return (
                            <tr
                              key={log.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              {/* Data */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-800">
                                {isEditing ? (
                                  <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="px-2 py-1 rounded-lg border border-slate-300 text-xs bg-white"
                                  />
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span>{formatDayAndShortDate(log.date)}</span>
                                    {log.date === todayStr && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                                        Oggi
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Pagine giorno */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap text-right tabular-nums">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="1"
                                    value={editPages}
                                    onChange={(e) => setEditPages(e.target.value)}
                                    className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-xs text-right font-semibold bg-white"
                                  />
                                ) : (
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                                    +{log.pages}
                                  </span>
                                )}
                              </td>

                              {/* Totale cumulativo */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap text-right font-semibold text-slate-700 tabular-nums">
                                {log.cumulative} pag
                              </td>

                              {/* Rimanenti */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap text-right text-slate-500 tabular-nums hidden sm:table-cell">
                                {log.remaining} pag
                              </td>

                              {/* Note */}
                              <td className="py-2.5 px-3.5 text-slate-600 max-w-[180px] sm:max-w-[240px] truncate">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    placeholder="Nota..."
                                    className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs bg-white"
                                  />
                                ) : (
                                  <span title={log.note || ''}>
                                    {log.note || <span className="text-slate-300">—</span>}
                                  </span>
                                )}
                              </td>

                              {/* Azioni inline */}
                              <td className="py-2.5 px-3.5 whitespace-nowrap text-right">
                                {isEditing ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => saveEditedLog(log.id)}
                                      className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                      title="Salva modifica"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingLogId(null)}
                                      className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                      title="Annulla"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => startEditingLog(log)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                                      title="Modifica giornata"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteLog(log)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                      title="Elimina giornata"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ==================================================================
              COLONNA DESTRA (4/12): PANNELLO DI CONFIGURAZIONE INIZIALE
          ================================================================== */}
          <aside className="xl:col-span-4 space-y-6 xl:sticky xl:top-20">
            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Parametri Tabella di Marcia
                  </h2>
                  <p className="text-xs text-slate-500">
                    Modifica in qualsiasi momento con ricalcolo istantaneo
                  </p>
                </div>
              </div>

              {/* Nome dell'esame */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nome dell’esame
                </label>
                <input
                  type="text"
                  value={currentExam.name}
                  onChange={(e) => updateCurrentExam({ name: e.target.value })}
                  placeholder="es. Biochimica Clinica"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Data inizio studio & Data appello */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Inizio studio
                  </label>
                  <input
                    type="date"
                    value={currentExam.startDate}
                    onChange={(e) => updateCurrentExam({ startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Data appello
                  </label>
                  <input
                    type="date"
                    value={currentExam.examDate}
                    onChange={(e) => updateCurrentExam({ examDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Totale pagine & Margine ripasso */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Totale pagine
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={currentExam.totalPages}
                    onChange={(e) =>
                      updateCurrentExam({
                        totalPages: e.target.value === '' ? '' : Math.max(1, Number(e.target.value)),
                      })
                    }
                    onBlur={() => {
                      if (!currentExam.totalPages || Number(currentExam.totalPages) < 1) {
                        updateCurrentExam({ totalPages: 100 });
                      }
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Margine ripasso (gg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={currentExam.reviewMarginDays}
                    onChange={(e) =>
                      updateCurrentExam({
                        reviewMarginDays:
                          e.target.value === '' ? '' : Math.max(0, Number(e.target.value)),
                      })
                    }
                    onBlur={() => {
                      if (currentExam.reviewMarginDays === '') {
                        updateCurrentExam({ reviewMarginDays: 0 });
                      }
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Giorni di riposo settimanali */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Giorni di riposo settimanali
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {currentExam.restDays.length === 0
                      ? 'Nessun riposo'
                      : `${currentExam.restDays.length} off/sett.`}
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAYS_IT.map((wd) => {
                    const isRest = currentExam.restDays.includes(wd.day);
                    return (
                      <button
                        key={wd.day}
                        type="button"
                        onClick={() => toggleRestDay(wd.day)}
                        title={`${wd.full}: ${isRest ? 'Giorno di riposo' : 'Giorno di studio'}`}
                        className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex flex-col items-center justify-center ${
                          isRest
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{wd.short}</span>
                        <span className="text-[9px] font-normal opacity-75 mt-0.5">
                          {isRest ? 'Off' : 'On'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ritmo target iniziale + Confronto automatico */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ritmo target iniziale (pagine/giorno)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={currentExam.targetDailyPages}
                    onChange={(e) =>
                      updateCurrentExam({
                        targetDailyPages:
                          e.target.value === '' ? '' : Math.max(1, Number(e.target.value)),
                      })
                    }
                    onBlur={() => {
                      if (!currentExam.targetDailyPages || Number(currentExam.targetDailyPages) < 1) {
                        updateCurrentExam({ targetDailyPages: 15 });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Box di confronto automatico: Target iniziale vs Ritmo minimo necessario */}
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    targetDiffFromMin >= 0
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/80 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>Giorni utili di studio:</span>
                    <span className="tabular-nums">{kpis.totalUsefulDays} giorni</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Ritmo minimo necessario:</span>
                    <span className="font-bold tabular-nums">
                      {kpis.initialMinPace.toFixed(1)} pag/giorno
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Il tuo target iniziale:</span>
                    <span className="font-bold tabular-nums">
                      {Number(currentExam.targetDailyPages || 0).toFixed(1)} pag/giorno
                    </span>
                  </div>

                  <div className="pt-2 border-t border-current/15 font-medium leading-relaxed">
                    {targetDiffFromMin >= 0 ? (
                      <span className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          Target sostenibile: hai un margine di{' '}
                          <strong className="tabular-nums">
                            +{targetDiffFromMin.toFixed(1)} pag/gg
                          </strong>{' '}
                          rispetto al minimo richiesto.
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>
                          Target inferiore al minimo di{' '}
                          <strong className="tabular-nums">
                            {Math.abs(targetDiffFromMin).toFixed(1)} pag/gg
                          </strong>
                          : aumenta il target o riduci i giorni di riposo per evitare ritardi.
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}