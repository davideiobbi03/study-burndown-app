import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Cell,
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
  Play,
  Pause,
  SkipForward,
  Coffee,
  Volume2,
  VolumeX,
  Repeat,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  LayoutGrid,
  Sun,
  Moon,
  Bell,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  Download,
  Upload,
} from 'lucide-react';

// ============================================================================
// CONFIGURAZIONE CLOUD SYNC (Configurata per il tuo progetto Supabase)
// ============================================================================
const SUPABASE_URL = 'https://lubcesnljpwvgvsnhtcl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_psF0qMa_982qxlfRWaFGHA_JlFL_9zW';
// ============================================================================

// --- UTILITY DATE (Locale, senza slittamenti di fuso orario) ---
function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCurrentTimeStr() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
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

function diffDays(fromDateStr, toDateStr) {
  const a = parseLocalDate(fromDateStr);
  const b = parseLocalDate(toDateStr);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b - a) / msPerDay);
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

function formatMinutesHuman(totalMinutes) {
  const mins = Math.max(0, Math.round(totalMinutes));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// --- MOTORE AUDIO POMODORO (Web Audio API con sblocco contesto e 5 suoni) ---
const POMO_SOUNDS = [
  { id: 'bell', label: 'Campanella Zen' },
  { id: 'chime', label: 'Accordo Armonico' },
  { id: 'digital', label: 'Doppio Bip Digitale' },
  { id: 'marimba', label: 'Marimba Soft' },
  { id: 'gong', label: 'Gong Profondo' },
];

let sharedAudioCtx = null;

function getUnlockedAudioContext() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch (e) {
    console.warn('AudioContext non disponibile:', e);
    return null;
  }
}

function playPomodoroSound(soundType = 'bell', phase = 'study') {
  try {
    const ctx = getUnlockedAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const isStudyEnd = phase === 'study';

    if (soundType === 'bell') {
      const freqs = isStudyEnd ? [880, 1318.51] : [659.25, 880];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.28);
        gain.gain.setValueAtTime(0.001, now + idx * 0.28);
        gain.gain.exponentialRampToValueAtTime(0.24, now + idx * 0.28 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.28 + 1.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.28);
        osc.stop(now + idx * 0.28 + 1.2);
      });
    } else if (soundType === 'chime') {
      const notes = isStudyEnd
        ? [523.25, 659.25, 783.99, 1046.5]
        : [783.99, 659.25, 523.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.001, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.14 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.58);
      });
    } else if (soundType === 'digital') {
      const beeps = isStudyEnd ? [0, 0.18, 0.45, 0.63] : [0, 0.22];
      const freq = isStudyEnd ? 987.77 : 783.99;
      beeps.forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);
        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.13);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.14);
      });
    } else if (soundType === 'marimba') {
      const notes = isStudyEnd ? [440, 554.37, 659.25] : [659.25, 440];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.17);
        gain.gain.setValueAtTime(0.001, now + idx * 0.17);
        gain.gain.exponentialRampToValueAtTime(0.26, now + idx * 0.17 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.17 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.17);
        osc.stop(now + idx * 0.17 + 0.38);
      });
    } else if (soundType === 'gong') {
      const baseFreq = isStudyEnd ? 220 : 196;
      [baseFreq, baseFreq * 1.5, baseFreq * 2].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        const peak = 0.22 / (idx + 1);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.65);
      });
    }
  } catch (e) {
    console.warn('Errore riproduzione suono:', e);
  }
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

const ALL_SECTION_IDS = [
  'burndown',
  'spaced_repetition',
  'progress_log',
  'pomodoro',
  'parameters',
];

const DEFAULT_LAYOUT = {
  left: ['burndown', 'spaced_repetition', 'progress_log'],
  right: ['pomodoro', 'parameters'],
};

function sanitizeLayout(raw) {
  if (!raw || !Array.isArray(raw.left) || !Array.isArray(raw.right)) {
    return DEFAULT_LAYOUT;
  }
  const seen = new Set();
  const cleanLeft = [];
  const cleanRight = [];

  raw.left.forEach((id) => {
    if (ALL_SECTION_IDS.includes(id) && !seen.has(id)) {
      seen.add(id);
      cleanLeft.push(id);
    }
  });
  raw.right.forEach((id) => {
    if (ALL_SECTION_IDS.includes(id) && !seen.has(id)) {
      seen.add(id);
      cleanRight.push(id);
    }
  });

  ALL_SECTION_IDS.forEach((id) => {
    if (!seen.has(id)) {
      if (DEFAULT_LAYOUT.left.includes(id)) cleanLeft.push(id);
      else cleanRight.push(id);
    }
  });

  return { left: cleanLeft, right: cleanRight };
}

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
    pomodoroSessions: [],
    srTopics: [],
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
    pomodoroSessions: [
      { id: 'p_1', date: addDays(today, -1), time: '16:30', durationMin: 50 },
      { id: 'p_2', date: addDays(today, -1), time: '17:35', durationMin: 50 },
      { id: 'p_3', date: today, time: '09:45', durationMin: 25 },
    ],
    srTopics: [
      {
        id: 'sr_1',
        title: 'Marcatori cardiaci (Troponine, BNP)',
        pagesRef: 'pp. 18-42',
        createdDate: addDays(today, -8),
        lastReviewDate: addDays(today, -4),
        nextReviewDate: addDays(today, -1),
        intervalDays: 3,
        repetitions: 1,
        easeFactor: 2.3,
        lastRating: 'hard',
      },
      {
        id: 'sr_2',
        title: 'Emocromo e anemie microcitiche',
        pagesRef: 'pp. 43-78',
        createdDate: addDays(today, -7),
        lastReviewDate: addDays(today, -3),
        nextReviewDate: today,
        intervalDays: 3,
        repetitions: 1,
        easeFactor: 2.5,
        lastRating: 'good',
      },
      {
        id: 'sr_3',
        title: 'Cascata coagulativa e PT/aPTT',
        pagesRef: 'pp. 79-110',
        createdDate: addDays(today, -1),
        lastReviewDate: addDays(today, -1),
        nextReviewDate: today,
        intervalDays: 1,
        repetitions: 0,
        easeFactor: 2.5,
        lastRating: null,
      },
      {
        id: 'sr_4',
        title: 'Funzionalità renale, eGFR e proteinuria',
        pagesRef: 'pp. 111-145',
        createdDate: addDays(today, -5),
        lastReviewDate: addDays(today, -2),
        nextReviewDate: addDays(today, 2),
        intervalDays: 4,
        repetitions: 2,
        easeFactor: 2.6,
        lastRating: 'easy',
      },
      {
        id: 'sr_5',
        title: 'Enzimi epatici e itteri',
        pagesRef: 'pp. 146-180',
        createdDate: addDays(today, -6),
        lastReviewDate: addDays(today, -1),
        nextReviewDate: addDays(today, 5),
        intervalDays: 6,
        repetitions: 2,
        easeFactor: 2.5,
        lastRating: 'good',
      },
    ],
  };
}

function hasMeaningfulProgress(examState) {
  if (!examState || !Array.isArray(examState.exams)) return false;
  if (examState.exams.length > 1) return true;
  const ex = examState.exams[0];
  if (!ex) return false;
  return (
    (ex.logs && ex.logs.length > 0) ||
    (ex.srTopics && ex.srTopics.length > 0) ||
    (ex.pomodoroSessions && ex.pomodoroSessions.length > 0)
  );
}

const STORAGE_KEY = 'studyburn_state_v2';
const LAYOUT_STORAGE_KEY = 'studyburn_layout_v1';
const THEME_STORAGE_KEY = 'studyburn_theme_v1';
const POMO_PREFS_STORAGE_KEY = 'studyburn_pomo_prefs_v1';
const CLOUD_CONFIG_STORAGE_KEY = 'studyburn_cloud_config_v1';
const CLOUD_SESSION_STORAGE_KEY = 'studyburn_cloud_session_v1';

export default function App() {
  // --- STATO MODALITÀ SCURA ---
  const [isDark, setIsDark] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        return true;
      }
    } catch (e) {
      console.error('Errore lettura tema:', e);
    }
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', isDark);
    } catch (e) {
      console.error('Errore salvataggio tema:', e);
    }
  }, [isDark]);

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

  // --- STATO ORDINAMENTO SEZIONI ---
  const [layout, setLayout] = useState(() => {
    try {
      const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (savedLayout) {
        return sanitizeLayout(JSON.parse(savedLayout));
      }
    } catch (e) {
      console.error('Errore lettura layout localStorage:', e);
    }
    return DEFAULT_LAYOUT;
  });

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [dragReadyId, setDragReadyId] = useState(null);
  const [draggedSection, setDraggedSection] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch (e) {
      console.error('Errore salvataggio layout localStorage:', e);
    }
  }, [layout]);

  const isCustomLayout = useMemo(() => {
    return JSON.stringify(layout) !== JSON.stringify(DEFAULT_LAYOUT);
  }, [layout]);

  const moveSectionUp = (col, index) => {
    if (index <= 0) return;
    setLayout((prev) => {
      const list = [...prev[col]];
      [list[index - 1], list[index]] = [list[index], list[index - 1]];
      return { ...prev, [col]: list };
    });
  };

  const moveSectionDown = (col, index) => {
    setLayout((prev) => {
      const list = [...prev[col]];
      if (index >= list.length - 1) return prev;
      [list[index], list[index + 1]] = [list[index + 1], list[index]];
      return { ...prev, [col]: list };
    });
  };

  const moveSectionAcross = (fromCol, index) => {
    const toCol = fromCol === 'left' ? 'right' : 'left';
    setLayout((prev) => {
      const source = [...prev[fromCol]];
      const [moved] = source.splice(index, 1);
      if (!moved) return prev;
      const target = [...prev[toCol], moved];
      return { ...prev, [fromCol]: source, [toCol]: target };
    });
  };

  const handleDropSection = (targetCol, targetIndex) => {
    if (!draggedSection) return;
    const { id, fromCol } = draggedSection;

    setLayout((prev) => {
      const source = [...prev[fromCol]];
      const sourceIndex = source.indexOf(id);
      if (sourceIndex === -1) return prev;

      source.splice(sourceIndex, 1);

      if (fromCol === targetCol) {
        const adjustedIndex =
          sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        const safeIdx = Math.max(0, Math.min(source.length, adjustedIndex));
        source.splice(safeIdx, 0, id);
        return { ...prev, [fromCol]: source };
      } else {
        const dest = [...prev[targetCol]];
        const safeIdx = Math.max(0, Math.min(dest.length, targetIndex));
        dest.splice(safeIdx, 0, id);
        return { ...prev, [fromCol]: source, [targetCol]: dest };
      }
    });

    setDraggedSection(null);
    setDragOverTarget(null);
    setDragReadyId(null);
  };

  const handleResetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    setIsReorderMode(false);
  };

  const [undoStack, setUndoStack] = useState([]);
  const [isRenamingHeader, setIsRenamingHeader] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Stato registro pagine
  const [logMode, setLogMode] = useState('daily');
  const [logDate, setLogDate] = useState(getTodayStr());
  const [logPagesInput, setLogPagesInput] = useState('');

  const [editingLogDate, setEditingLogDate] = useState(null);
  const [editingLogPages, setEditingLogPages] = useState('');

  // --- STATO TIMER POMODORO CLASSICO ---
  const initialPomoPrefs = useMemo(() => {
    try {
      const saved = localStorage.getItem(POMO_PREFS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Errore lettura preferenze Pomodoro:', e);
    }
    return {};
  }, []);

  const [pomoStudyMin, setPomoStudyMin] = useState(
    initialPomoPrefs.studyMin || 25
  );
  const [pomoShortBreakMin, setPomoShortBreakMin] = useState(
    initialPomoPrefs.shortBreakMin || 5
  );
  const [pomoLongBreakMin, setPomoLongBreakMin] = useState(
    initialPomoPrefs.longBreakMin || 15
  );
  const [pomoPhase, setPomoPhase] = useState('study');
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState(
    (initialPomoPrefs.studyMin || 25) * 60
  );
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoCycleCount, setPomoCycleCount] = useState(0);
  const [pomoAutoContinue, setPomoAutoContinue] = useState(
    Boolean(initialPomoPrefs.autoContinue)
  );
  const [pomoSound, setPomoSound] = useState(
    initialPomoPrefs.soundEnabled !== undefined
      ? Boolean(initialPomoPrefs.soundEnabled)
      : true
  );
  const [pomoSoundType, setPomoSoundType] = useState(
    initialPomoPrefs.soundType || 'bell'
  );
  const [showPomoHistory, setShowPomoHistory] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        POMO_PREFS_STORAGE_KEY,
        JSON.stringify({
          studyMin: pomoStudyMin,
          shortBreakMin: pomoShortBreakMin,
          longBreakMin: pomoLongBreakMin,
          autoContinue: pomoAutoContinue,
          soundEnabled: pomoSound,
          soundType: pomoSoundType,
        })
      );
    } catch (e) {
      console.error('Errore salvataggio preferenze Pomodoro:', e);
    }
  }, [
    pomoStudyMin,
    pomoShortBreakMin,
    pomoLongBreakMin,
    pomoAutoContinue,
    pomoSound,
    pomoSoundType,
  ]);

  const pomoAutoContinueRef = useRef(pomoAutoContinue);
  const pomoSoundRef = useRef(pomoSound);
  const pomoSoundTypeRef = useRef(pomoSoundType);
  useEffect(() => {
    pomoAutoContinueRef.current = pomoAutoContinue;
  }, [pomoAutoContinue]);
  useEffect(() => {
    pomoSoundRef.current = pomoSound;
  }, [pomoSound]);
  useEffect(() => {
    pomoSoundTypeRef.current = pomoSoundType;
  }, [pomoSoundType]);

  // --- STATO CLOUD SYNC MULTI-DISPOSITIVO ---
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [cloudUrl, setCloudUrl] = useState(() => {
    if (SUPABASE_URL.trim()) return SUPABASE_URL.trim().replace(/\/$/, '');
    try {
      const saved = JSON.parse(
        localStorage.getItem(CLOUD_CONFIG_STORAGE_KEY) || '{}'
      );
      return (saved.url || '').trim().replace(/\/$/, '');
    } catch {
      return '';
    }
  });
  const [cloudAnonKey, setCloudAnonKey] = useState(() => {
    if (SUPABASE_ANON_KEY.trim()) return SUPABASE_ANON_KEY.trim();
    try {
      const saved = JSON.parse(
        localStorage.getItem(CLOUD_CONFIG_STORAGE_KEY) || '{}'
      );
      return (saved.anonKey || '').trim();
    } catch {
      return '';
    }
  });
  const [showAdvancedServerConfig, setShowAdvancedServerConfig] = useState(
    () => !SUPABASE_URL.trim() || !SUPABASE_ANON_KEY.trim()
  );
  const [cloudSession, setCloudSession] = useState(() => {
    try {
      const saved = localStorage.getItem(CLOUD_SESSION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('idle');
  const [cloudMessage, setCloudMessage] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [cloudConflictPayload, setCloudConflictPayload] = useState(null);

  const cloudSyncReadyRef = useRef(false);
  const skipNextAutoPushRef = useRef(false);
  const importFileInputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        CLOUD_CONFIG_STORAGE_KEY,
        JSON.stringify({ url: cloudUrl, anonKey: cloudAnonKey })
      );
    } catch (e) {
      console.error('Errore salvataggio config cloud:', e);
    }
  }, [cloudUrl, cloudAnonKey]);

  useEffect(() => {
    try {
      if (cloudSession) {
        localStorage.setItem(
          CLOUD_SESSION_STORAGE_KEY,
          JSON.stringify(cloudSession)
        );
      } else {
        localStorage.removeItem(CLOUD_SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Errore salvataggio sessione cloud:', e);
    }
  }, [cloudSession]);

  const applyRemotePayload = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') return;
    skipNextAutoPushRef.current = true;
    if (
      payload.state &&
      Array.isArray(payload.state.exams) &&
      payload.state.exams.length > 0
    ) {
      setState(payload.state);
    }
    if (payload.layout) {
      setLayout(sanitizeLayout(payload.layout));
    }
    if (payload.pomoPrefs) {
      if (payload.pomoPrefs.studyMin) {
        setPomoStudyMin(payload.pomoPrefs.studyMin);
        setPomoSecondsLeft(payload.pomoPrefs.studyMin * 60);
      }
      if (payload.pomoPrefs.shortBreakMin) {
        setPomoShortBreakMin(payload.pomoPrefs.shortBreakMin);
      }
      if (payload.pomoPrefs.longBreakMin) {
        setPomoLongBreakMin(payload.pomoPrefs.longBreakMin);
      }
      if (payload.pomoPrefs.autoContinue !== undefined) {
        setPomoAutoContinue(Boolean(payload.pomoPrefs.autoContinue));
      }
      if (payload.pomoPrefs.soundEnabled !== undefined) {
        setPomoSound(Boolean(payload.pomoPrefs.soundEnabled));
      }
      if (payload.pomoPrefs.soundType) {
        setPomoSoundType(payload.pomoPrefs.soundType);
      }
    }
  }, []);

  const refreshCloudToken = useCallback(
    async (sessionObj) => {
      if (!cloudUrl || !cloudAnonKey || !sessionObj?.refresh_token) return null;
      try {
        const res = await fetch(
          `${cloudUrl}/auth/v1/token?grant_type=refresh_token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: cloudAnonKey,
            },
            body: JSON.stringify({ refresh_token: sessionObj.refresh_token }),
          }
        );
        if (!res.ok) return null;
        const data = await res.json();
        const updatedSession = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || sessionObj.refresh_token,
          user: data.user || sessionObj.user,
        };
        setCloudSession(updatedSession);
        return updatedSession;
      } catch {
        return null;
      }
    },
    [cloudUrl, cloudAnonKey]
  );

  const pushToCloud = useCallback(
    async (sessionOverride = null, customSnapshot = null) => {
      const activeSess = sessionOverride || cloudSession;
      if (
        !cloudUrl ||
        !cloudAnonKey ||
        !activeSess?.access_token ||
        !activeSess?.user?.id
      ) {
        return false;
      }

      setCloudStatus('syncing');
      const snapshot = customSnapshot || {
        state,
        layout,
        pomoPrefs: {
          studyMin: pomoStudyMin,
          shortBreakMin: pomoShortBreakMin,
          longBreakMin: pomoLongBreakMin,
          autoContinue: pomoAutoContinue,
          soundEnabled: pomoSound,
          soundType: pomoSoundType,
        },
      };

      const doUpsert = async (token) =>
        fetch(
          `${cloudUrl}/rest/v1/studyburn_profiles?on_conflict=user_id`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: cloudAnonKey,
              Authorization: `Bearer ${token}`,
              Prefer: 'resolution=merge-duplicates,return=minimal',
            },
            body: JSON.stringify({
              user_id: activeSess.user.id,
              payload: snapshot,
              updated_at: new Date().toISOString(),
            }),
          }
        );

      try {
        let res = await doUpsert(activeSess.access_token);
        if (res.status === 401) {
          const refreshed = await refreshCloudToken(activeSess);
          if (refreshed) {
            res = await doUpsert(refreshed.access_token);
          }
        }

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Errore HTTP ${res.status}`);
        }

        setCloudStatus('synced');
        setCloudMessage('');
        setLastSyncedAt(getCurrentTimeStr());
        return true;
      } catch (err) {
        console.error('Errore salvataggio cloud:', err);
        setCloudStatus('error');
        setCloudMessage(
          'Errore durante il salvataggio sul cloud. Verifica la tabella Supabase.'
        );
        return false;
      }
    },
    [
      cloudUrl,
      cloudAnonKey,
      cloudSession,
      state,
      layout,
      pomoStudyMin,
      pomoShortBreakMin,
      pomoLongBreakMin,
      pomoAutoContinue,
      pomoSound,
      pomoSoundType,
      refreshCloudToken,
    ]
  );

  const pullFromCloud = useCallback(
    async (sessionOverride = null, askOnLocalConflict = false) => {
      const activeSess = sessionOverride || cloudSession;
      if (
        !cloudUrl ||
        !cloudAnonKey ||
        !activeSess?.access_token ||
        !activeSess?.user?.id
      ) {
        return null;
      }

      setCloudStatus('syncing');

      const doSelect = async (token) =>
        fetch(
          `${cloudUrl}/rest/v1/studyburn_profiles?user_id=eq.${activeSess.user.id}&select=payload,updated_at`,
          {
            method: 'GET',
            headers: {
              apikey: cloudAnonKey,
              Authorization: `Bearer ${token}`,
            },
          }
        );

      try {
        let res = await doSelect(activeSess.access_token);
        if (res.status === 401) {
          const refreshed = await refreshCloudToken(activeSess);
          if (refreshed) {
            res = await doSelect(refreshed.access_token);
          }
        }

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Errore HTTP ${res.status}`);
        }

        const rows = await res.json();
        const remoteRow = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

        if (remoteRow && remoteRow.payload && remoteRow.payload.state) {
          if (askOnLocalConflict && hasMeaningfulProgress(state)) {
            setCloudConflictPayload(remoteRow.payload);
            setCloudStatus('synced');
            return remoteRow.payload;
          }
          applyRemotePayload(remoteRow.payload);
          cloudSyncReadyRef.current = true;
          setCloudStatus('synced');
          setCloudMessage('');
          setLastSyncedAt(getCurrentTimeStr());
          return remoteRow.payload;
        } else {
          cloudSyncReadyRef.current = true;
          await pushToCloud(activeSess);
          return null;
        }
      } catch (err) {
        console.error('Errore lettura cloud:', err);
        setCloudStatus('error');
        setCloudMessage(
          'Impossibile leggere dal cloud. Controlla URL, chiave API o tabella SQL.'
        );
        return null;
      }
    },
    [
      cloudUrl,
      cloudAnonKey,
      cloudSession,
      state,
      applyRemotePayload,
      pushToCloud,
      refreshCloudToken,
    ]
  );

  // Pull automatico all'avvio se già loggato
  useEffect(() => {
    if (cloudUrl && cloudAnonKey && cloudSession?.access_token) {
      pullFromCloud(cloudSession, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-sync debounced ogni volta che cambiano esami, layout o preferenze
  useEffect(() => {
    if (
      !cloudUrl ||
      !cloudAnonKey ||
      !cloudSession?.access_token ||
      !cloudSyncReadyRef.current
    ) {
      return;
    }
    if (skipNextAutoPushRef.current) {
      skipNextAutoPushRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      pushToCloud();
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    state,
    layout,
    pomoStudyMin,
    pomoShortBreakMin,
    pomoLongBreakMin,
    pomoAutoContinue,
    pomoSound,
    pomoSoundType,
    cloudUrl,
    cloudAnonKey,
    cloudSession,
    pushToCloud,
  ]);

  // Pull automatico quando torni sulla scheda/app da un altro dispositivo
  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState === 'visible' &&
        cloudUrl &&
        cloudAnonKey &&
        cloudSession?.access_token &&
        cloudSyncReadyRef.current
      ) {
        pullFromCloud(cloudSession, false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, [cloudUrl, cloudAnonKey, cloudSession, pullFromCloud]);

  const handleCloudAuthSubmit = async (e) => {
    e.preventDefault();
    const cleanUrl = cloudUrl.trim().replace(/\/$/, '');
    const cleanKey = cloudAnonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setCloudMessage('Inserisci prima Project URL e Anon Key di Supabase.');
      setShowAdvancedServerConfig(true);
      return;
    }
    if (!authEmail.trim() || !authPassword) {
      setCloudMessage('Inserisci email e password.');
      return;
    }

    setAuthLoading(true);
    setCloudMessage('');

    try {
      const endpoint =
        authMode === 'signup'
          ? `${cleanUrl}/auth/v1/signup`
          : `${cleanUrl}/auth/v1/token?grant_type=password`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: cleanKey,
        },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error_description ||
            data.msg ||
            data.message ||
            'Credenziali non valide.'
        );
      }

      if (!data.access_token) {
        setCloudMessage(
          'Account creato! Controlla la tua email per confermare (oppure disattiva "Confirm email" su Supabase).'
        );
        setAuthLoading(false);
        return;
      }

      const newSess = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      };
      setCloudUrl(cleanUrl);
      setCloudAnonKey(cleanKey);
      setCloudSession(newSess);
      setAuthPassword('');

      await pullFromCloud(newSess, true);
    } catch (err) {
      setCloudMessage(err.message || 'Errore di autenticazione.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCloudLogout = () => {
    cloudSyncReadyRef.current = false;
    setCloudSession(null);
    setCloudConflictPayload(null);
    setCloudStatus('idle');
    setCloudMessage('');
    setLastSyncedAt(null);
  };

  const handleExportBackupFile = () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      state,
      layout,
      pomoPrefs: {
        studyMin: pomoStudyMin,
        shortBreakMin: pomoShortBreakMin,
        longBreakMin: pomoLongBreakMin,
        autoContinue: pomoAutoContinue,
        soundEnabled: pomoSound,
        soundType: pomoSoundType,
      },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyburn-backup-${getTodayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackupFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        if (parsed && parsed.state && Array.isArray(parsed.state.exams)) {
          applyRemotePayload(parsed);
          if (cloudSession?.access_token) {
            cloudSyncReadyRef.current = true;
            pushToCloud(cloudSession, parsed);
          }
          setCloudMessage('Backup importato con successo!');
        } else {
          setCloudMessage('File di backup non valido.');
        }
      } catch {
        setCloudMessage('Impossibile leggere il file selezionato.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- STATO SPACED REPETITION ---
  const [srTitleInput, setSrTitleInput] = useState('');
  const [srPagesInput, setSrPagesInput] = useState('');
  const [srStudyDateInput, setSrStudyDateInput] = useState(getTodayStr());
  const [srFilter, setSrFilter] = useState('due');

  const headerRenameInputRef = useRef(null);
  const sidebarNameInputRef = useRef(null);

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

  // --- LOGICA TICK TIMER POMODORO CLASSICO ---
  useEffect(() => {
    if (!pomoRunning) {
      document.title = 'StudyBurn';
      return;
    }

    const endTime = Date.now() + pomoSecondsLeft * 1000;
    let handled = false;

    const phaseLabel =
      pomoPhase === 'study'
        ? 'Studio'
        : pomoPhase === 'short_break'
        ? 'Pausa'
        : 'Pausa Lunga';

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setPomoSecondsLeft(remaining);

      const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
      const ss = String(remaining % 60).padStart(2, '0');
      document.title = `${mm}:${ss} ${phaseLabel} — StudyBurn`;

      if (remaining === 0 && !handled) {
        handled = true;
        clearInterval(interval);

        if (pomoSoundRef.current) {
          playPomodoroSound(pomoSoundTypeRef.current, pomoPhase);
        }

        const shouldAutoContinue = pomoAutoContinueRef.current;

        if (pomoPhase === 'study') {
          const completedDuration = Math.max(1, Number(pomoStudyMin) || 25);
          const newSession = {
            id: `pomo_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            date: getTodayStr(),
            time: getCurrentTimeStr(),
            durationMin: completedDuration,
          };
          updateActiveExam((ex) => ({
            ...ex,
            pomodoroSessions: [newSession, ...(ex.pomodoroSessions || [])],
          }));

          const nextCycle = pomoCycleCount + 1;
          if (nextCycle >= 4) {
            setPomoCycleCount(4);
            setPomoPhase('long_break');
            setPomoSecondsLeft(Math.max(1, Number(pomoLongBreakMin) || 15) * 60);
          } else {
            setPomoCycleCount(nextCycle);
            setPomoPhase('short_break');
            setPomoSecondsLeft(
              Math.max(1, Number(pomoShortBreakMin) || 5) * 60
            );
          }
          setPomoRunning(shouldAutoContinue);
        } else {
          if (pomoPhase === 'long_break' || pomoCycleCount >= 4) {
            setPomoCycleCount(0);
          }
          setPomoPhase('study');
          setPomoSecondsLeft(Math.max(1, Number(pomoStudyMin) || 25) * 60);
          setPomoRunning(shouldAutoContinue);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [
    pomoRunning,
    pomoPhase,
    pomoCycleCount,
    pomoStudyMin,
    pomoShortBreakMin,
    pomoLongBreakMin,
  ]);

  const getPhaseMinutes = (phase) => {
    if (phase === 'study') return Math.max(1, Number(pomoStudyMin) || 25);
    if (phase === 'short_break')
      return Math.max(1, Number(pomoShortBreakMin) || 5);
    return Math.max(1, Number(pomoLongBreakMin) || 15);
  };

  const handleTogglePomoRunning = () => {
    getUnlockedAudioContext();
    setPomoRunning((r) => !r);
  };

  const handlePomoSwitchPhase = (targetPhase) => {
    setPomoRunning(false);
    if (targetPhase === 'study' && pomoCycleCount >= 4) {
      setPomoCycleCount(0);
    }
    setPomoPhase(targetPhase);
    setPomoSecondsLeft(getPhaseMinutes(targetPhase) * 60);
  };

  const handlePomoSkipPhase = () => {
    setPomoRunning(false);
    if (pomoPhase === 'study') {
      const nextCycle = pomoCycleCount + 1;
      if (nextCycle >= 4) {
        setPomoCycleCount(4);
        setPomoPhase('long_break');
        setPomoSecondsLeft(getPhaseMinutes('long_break') * 60);
      } else {
        setPomoCycleCount(nextCycle);
        setPomoPhase('short_break');
        setPomoSecondsLeft(getPhaseMinutes('short_break') * 60);
      }
    } else {
      if (pomoPhase === 'long_break' || pomoCycleCount >= 4) {
        setPomoCycleCount(0);
      }
      setPomoPhase('study');
      setPomoSecondsLeft(getPhaseMinutes('study') * 60);
    }
  };

  const handlePomoReset = () => {
    setPomoRunning(false);
    setPomoSecondsLeft(getPhaseMinutes(pomoPhase) * 60);
  };

  const handlePomoPreset = (studyMins, shortBreakMins, longBreakMins) => {
    setPomoRunning(false);
    setPomoStudyMin(studyMins);
    setPomoShortBreakMin(shortBreakMins);
    setPomoLongBreakMin(longBreakMins);
    setPomoPhase('study');
    setPomoSecondsLeft(studyMins * 60);
  };

  const handleAddManualPomoSession = () => {
    const duration = Math.max(1, Number(pomoStudyMin) || 25);
    const manualSession = {
      id: `pomo_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      date: getTodayStr(),
      time: getCurrentTimeStr(),
      durationMin: duration,
    };
    updateActiveExam((ex) => ({
      ...ex,
      pomodoroSessions: [manualSession, ...(ex.pomodoroSessions || [])],
    }));
    setPomoCycleCount((c) => (c >= 4 ? 1 : c + 1));
  };

  const handleDeletePomoSession = (sessionId) => {
    updateActiveExam((ex) => ({
      ...ex,
      pomodoroSessions: (ex.pomodoroSessions || []).filter(
        (s) => s.id !== sessionId
      ),
    }));
  };

  const pomoStats = useMemo(() => {
    const today = getTodayStr();
    const sessions = activeExam.pomodoroSessions || [];
    const todaySessions = sessions.filter((s) => s.date === today);
    const totalMinutes = sessions.reduce(
      (sum, s) => sum + Number(s.durationMin || 0),
      0
    );
    const todayMinutes = todaySessions.reduce(
      (sum, s) => sum + Number(s.durationMin || 0),
      0
    );
    const phaseTotalSeconds =
      (pomoPhase === 'study'
        ? Math.max(1, Number(pomoStudyMin) || 25)
        : pomoPhase === 'short_break'
        ? Math.max(1, Number(pomoShortBreakMin) || 5)
        : Math.max(1, Number(pomoLongBreakMin) || 15)) * 60;
    const progressPct = Math.min(
      100,
      Math.max(
        0,
        ((phaseTotalSeconds - pomoSecondsLeft) / phaseTotalSeconds) * 100
      )
    );

    return {
      sessions,
      todayCount: todaySessions.length,
      todayMinutes,
      totalCount: sessions.length,
      totalMinutes,
      progressPct,
    };
  }, [
    activeExam,
    pomoPhase,
    pomoStudyMin,
    pomoShortBreakMin,
    pomoLongBreakMin,
    pomoSecondsLeft,
  ]);

  // --- LOGICA SPACED REPETITION ---
  const handleAddSrTopic = (e) => {
    e.preventDefault();
    const cleanTitle = srTitleInput.trim();
    if (!cleanTitle) return;

    const baseDate = srStudyDateInput || getTodayStr();
    const newTopic = {
      id: `sr_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      title: cleanTitle,
      pagesRef: srPagesInput.trim(),
      createdDate: baseDate,
      lastReviewDate: baseDate,
      nextReviewDate: addDays(baseDate, 1),
      intervalDays: 1,
      repetitions: 0,
      easeFactor: 2.5,
      lastRating: null,
    };

    updateActiveExam(
      (ex) => ({
        ...ex,
        srTopics: [newTopic, ...(ex.srTopics || [])],
      }),
      true
    );

    setSrTitleInput('');
    setSrPagesInput('');
  };

  const handleReviewSrTopic = (topicId, rating) => {
    const today = getTodayStr();
    updateActiveExam(
      (ex) => ({
        ...ex,
        srTopics: (ex.srTopics || []).map((topic) => {
          if (topic.id !== topicId) return topic;

          const currentReps = Number(topic.repetitions || 0);
          const currentInterval = Math.max(1, Number(topic.intervalDays || 1));
          const currentEase = Number(topic.easeFactor || 2.5);

          let nextInterval = 1;
          let nextReps = currentReps;
          let nextEase = currentEase;

          if (rating === 'hard') {
            nextInterval =
              currentReps <= 1
                ? 1
                : Math.max(1, Math.round(currentInterval * 0.6));
            nextReps = Math.max(0, currentReps);
            nextEase = Math.max(1.3, Number((currentEase - 0.2).toFixed(2)));
          } else if (rating === 'good') {
            if (currentReps === 0) nextInterval = 1;
            else if (currentReps === 1) nextInterval = 3;
            else if (currentReps === 2) nextInterval = 7;
            else nextInterval = Math.round(currentInterval * currentEase);
            nextReps = currentReps + 1;
          } else if (rating === 'easy') {
            if (currentReps === 0) nextInterval = 3;
            else if (currentReps === 1) nextInterval = 6;
            else nextInterval = Math.round(currentInterval * currentEase * 1.3);
            nextReps = currentReps + 1;
            nextEase = Math.min(3.2, Number((currentEase + 0.15).toFixed(2)));
          }

          return {
            ...topic,
            lastReviewDate: today,
            nextReviewDate: addDays(today, nextInterval),
            intervalDays: nextInterval,
            repetitions: nextReps,
            easeFactor: nextEase,
            lastRating: rating,
          };
        }),
      }),
      true
    );
  };

  const handleDeleteSrTopic = (topicId) => {
    updateActiveExam(
      (ex) => ({
        ...ex,
        srTopics: (ex.srTopics || []).filter((t) => t.id !== topicId),
      }),
      true
    );
  };

  const srAnalytics = useMemo(() => {
    const today = getTodayStr();
    const topics = activeExam.srTopics || [];

    const enriched = topics
      .map((t) => {
        const deltaDays = diffDays(today, t.nextReviewDate);
        return {
          ...t,
          deltaDays,
          isOverdue: deltaDays < 0,
          isDueToday: deltaDays === 0,
          isDue: deltaDays <= 0,
          isAfterExam:
            activeExam.examDate && t.nextReviewDate > activeExam.examDate,
        };
      })
      .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate));

    const overdueCount = enriched.filter((t) => t.isOverdue).length;
    const dueTodayCount = enriched.filter((t) => t.isDueToday).length;
    const dueTotalCount = overdueCount + dueTodayCount;
    const next7DaysCount = enriched.filter(
      (t) => t.deltaDays > 0 && t.deltaDays <= 7
    ).length;

    const forecastChart = [];
    for (let i = 0; i < 14; i++) {
      const dateStr = addDays(today, i);
      const scheduledForDay = enriched.filter((t) =>
        i === 0 ? t.nextReviewDate <= today : t.nextReviewDate === dateStr
      );
      forecastChart.push({
        date: i === 0 ? 'Oggi' : formatShortDate(dateStr),
        rawDate: dateStr,
        ripassi: scheduledForDay.length,
        topicsList: scheduledForDay.map((t) => t.title),
        isToday: i === 0,
      });
    }

    const examShort = activeExam.examDate
      ? formatShortDate(activeExam.examDate)
      : null;

    return {
      allTopics: enriched,
      overdueCount,
      dueTodayCount,
      dueTotalCount,
      next7DaysCount,
      totalTopics: enriched.length,
      forecastChart,
      examShort,
    };
  }, [activeExam]);

  const filteredSrTopics = useMemo(() => {
    if (srFilter === 'due') {
      return srAnalytics.allTopics.filter((t) => t.isDue);
    }
    if (srFilter === 'upcoming') {
      return srAnalytics.allTopics.filter((t) => !t.isDue);
    }
    return srAnalytics.allTopics;
  }, [srAnalytics, srFilter]);

  // --- GESTIONE ESAMI E REGISTRO PAGINE ---
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
    setSrStudyDateInput(getTodayStr());
    setIsRenamingHeader(true);
  };

  const handleDuplicateExam = () => {
    const copy = {
      ...activeExam,
      id: `exam_${Date.now()}`,
      name: `${activeExam.name || 'Esame'} (Copia)`,
      logs: activeExam.logs.map((l) => ({ ...l })),
      pomodoroSessions: (activeExam.pomodoroSessions || []).map((s) => ({
        ...s,
      })),
      srTopics: (activeExam.srTopics || []).map((t) => ({ ...t })),
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
    setSrStudyDateInput(getTodayStr());
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
    updateActiveExam({ logs: [], pomodoroSessions: [], srTopics: [] }, true);
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
      wrapper: isDark
        ? 'bg-emerald-950/45 border-emerald-800/70 text-emerald-100'
        : 'bg-emerald-50/90 border-emerald-200 text-emerald-950',
      badge: isDark
        ? 'bg-emerald-900/70 text-emerald-200 border-emerald-700/70'
        : 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
      lineColor: '#10b981',
      Icon: CheckCircle2,
    },
    yellow: {
      wrapper: isDark
        ? 'bg-amber-950/45 border-amber-800/70 text-amber-100'
        : 'bg-amber-50/90 border-amber-200 text-amber-950',
      badge: isDark
        ? 'bg-amber-900/70 text-amber-200 border-amber-700/70'
        : 'bg-amber-100 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-500 text-white',
      lineColor: '#f59e0b',
      Icon: AlertTriangle,
    },
    red: {
      wrapper: isDark
        ? 'bg-rose-
