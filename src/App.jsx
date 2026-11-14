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
// CONFIGURAZIONE CLOUD SYNC (Supabase)
// ============================================================================
const SUPABASE_URL = 'https://lubcesnljpwvgvsnhtcl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_psF0qMa_982qxlfRWaFGHA_JlFL_9zW';
// ============================================================================

// --- UTILITY DATE ---
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

// --- MOTORE AUDIO POMODORO ---
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

  const [logMode, setLogMode] = useState('daily');
  const [logDate, setLogDate] = useState(getTodayStr());
  const [logPagesInput, setLogPagesInput] = useState('');

  const [editingLogDate, setEditingLogDate] = useState(null);
  const [editingLogPages, setEditingLogPages] = useState('');

  // --- STATO TIMER POMODORO ---
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

  useEffect(() => {
    if (cloudUrl && cloudAnonKey && cloudSession?.access_token) {
      pullFromCloud(cloudSession, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // --- LOGICA TIMER POMODORO ---
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
        ? 'bg-rose-950/45 border-rose-800/70 text-rose-100'
        : 'bg-rose-50/90 border-rose-200 text-rose-950',
      badge: isDark
        ? 'bg-rose-900/70 text-rose-200 border-rose-700/70'
        : 'bg-rose-100 text-rose-800 border-rose-200',
      iconBg: 'bg-rose-600 text-white',
      lineColor: '#e11d48',
      Icon: AlertOctagon,
    },
  }[analytics.status];

  const StatusIcon = statusStyles.Icon;

  const pomoMinutesDisplay = String(Math.floor(pomoSecondsLeft / 60)).padStart(
    2,
    '0'
  );
  const pomoSecondsDisplay = String(pomoSecondsLeft % 60).padStart(2, '0');

  const cardSurfaceClass = isDark
    ? 'bg-slate-900 border-slate-800'
    : 'bg-white border-slate-200';
  const subPanelClass = isDark
    ? 'bg-slate-800/55 border-slate-700/80'
    : 'bg-slate-50 border-slate-200/80';
  const inputSurfaceClass = isDark
    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const inputMutedSurfaceClass = isDark
    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500'
    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

  const chartGridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const chartTickFill = isDark ? '#94a3b8' : '#64748b';
  const chartAxisStroke = isDark ? '#334155' : '#cbd5e1';

  const renderOrderControls = (sectionId, col, index, totalInCol) => (
    <div
      className={`inline-flex items-center gap-0.5 rounded-lg p-0.5 border transition shrink-0 ${
        isReorderMode
          ? isDark
            ? 'bg-indigo-950/70 border-indigo-700 text-indigo-300 shadow-xs'
            : 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
          : isDark
          ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          : 'bg-slate-50 border-slate-200/80 text-slate-400 hover:text-slate-700'
      }`}
    >
      <button
        type="button"
        onClick={() => moveSectionUp(col, index)}
        disabled={index === 0}
        className={`p-1 rounded disabled:opacity-30 disabled:pointer-events-none transition ${
          isDark ? 'hover:bg-slate-700' : 'hover:bg-white'
        }`}
        title="Sposta sezione in alto"
      >
        <ArrowUp className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => moveSectionDown(col, index)}
        disabled={index === totalInCol - 1}
        className={`p-1 rounded disabled:opacity-30 disabled:pointer-events-none transition ${
          isDark ? 'hover:bg-slate-700' : 'hover:bg-white'
        }`}
        title="Sposta sezione in basso"
      >
        <ArrowDown className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => moveSectionAcross(col, index)}
        className={`p-1 rounded transition ${
          isDark ? 'hover:bg-slate-700' : 'hover:bg-white'
        }`}
        title={
          col === 'left'
            ? 'Sposta nella colonna laterale'
            : 'Sposta nella colonna principale'
        }
      >
        <ArrowLeftRight className="w-3.5 h-3.5" />
      </button>
      <span
        onMouseDown={() => setDragReadyId(sectionId)}
        onMouseUp={() => setDragReadyId(null)}
        className={`p-1 rounded cursor-grab active:cursor-grabbing transition ${
          isDark ? 'hover:bg-slate-700' : 'hover:bg-white'
        }`}
        title="Trascina per riordinare"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </span>
    </div>
  );

  const renderSection = (sectionId, col, index, totalInCol) => {
    const isNarrow = col === 'right' && layout.left.length > 0;
    const isBeingDragged = draggedSection?.id === sectionId;
    const isDropTargetBefore =
      dragOverTarget?.col === col &&
      dragOverTarget?.index === index &&
      draggedSection?.id !== sectionId;

    const orderControls = renderOrderControls(
      sectionId,
      col,
      index,
      totalInCol
    );

    let sectionContent = null;

    if (sectionId === 'burndown') {
      sectionContent = (
        <section
          className={`rounded-2xl border p-4 sm:p-6 shadow-sm ${cardSurfaceClass}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h3
                className={`text-base sm:text-lg font-bold ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                Burn-down Chart — {activeExam.name || 'Esame'}
              </h3>
              <p
                className={`text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Confronto tra discesa ideale, pagine reali rimanenti e
                proiezione futura
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                    isDark
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-3 h-0.5 border-t-2 border-dashed ${
                      isDark ? 'border-slate-400' : 'border-slate-500'
                    }`}
                  />
                  Ideale
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                    isDark
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                      : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: statusStyles.lineColor }}
                  />
                  Reale
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                    isDark
                      ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/60'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  <span className="w-3 h-0.5 border-t-2 border-dotted border-indigo-400" />
                  Proiezione
                </span>
              </div>
              {orderControls}
            </div>
          </div>

          <div
            className={`${
              isNarrow ? 'h-[280px]' : 'h-[320px] sm:h-[360px]'
            } w-full`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={analytics.chartData}
                margin={{ top: 18, right: 16, left: -12, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={chartGridStroke}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: chartTickFill }}
                  tickLine={false}
                  axisLine={{ stroke: chartAxisStroke }}
                  minTickGap={22}
                />
                <YAxis
                  domain={[0, analytics.totalPages]}
                  tick={{ fontSize: 11, fill: chartTickFill }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#020617' : '#0f172a',
                    border: isDark ? '1px solid #1e293b' : 'none',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.35)',
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
                    fill: isDark ? '#818cf8' : '#4f46e5',
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
                      fill: isDark ? '#fbbf24' : '#d97706',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="ideale"
                  stroke={isDark ? '#94a3b8' : '#64748b'}
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
                  stroke={isDark ? '#818cf8' : '#6366f1'}
                  strokeWidth={2.5}
                  strokeDasharray="2 5"
                  dot={false}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      );
    } else if (sectionId === 'spaced_repetition') {
      sectionContent = (
        <section
          className={`rounded-2xl border p-4 sm:p-6 shadow-sm space-y-5 ${cardSurfaceClass}`}
        >
          <div
            className={`flex flex-wrap items-start justify-between gap-3 pb-3 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                  isDark
                    ? 'bg-indigo-950/80 text-indigo-400'
                    : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className={`text-base sm:text-lg font-bold ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  Spaced Repetition &amp; Piano Ripassi
                </h3>
                <p
                  className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Intervalli adattivi automatici (1g → 3g → 7g → 14g → 30g+)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                  srAnalytics.dueTotalCount > 0
                    ? isDark
                      ? 'bg-amber-950/60 text-amber-300 border-amber-800/70'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                    : isDark
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                Oggi: {srAnalytics.dueTotalCount}
              </span>
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                7gg: {srAnalytics.next7DaysCount}
              </span>
              {orderControls}
            </div>
          </div>

          <div
            className={`rounded-xl border p-3.5 sm:p-4 ${
              isDark
                ? 'bg-slate-800/45 border-slate-800'
                : 'bg-slate-50/70 border-slate-200/80'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Carico Ripassi Programmati (14 Giorni)
              </span>
              <div
                className={`flex items-center gap-3 text-[11px] font-medium ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  Oggi / Scaduti
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                  In programma
                </span>
              </div>
            </div>

            <div className="h-[185px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={srAnalytics.forecastChart}
                  margin={{ top: 14, right: 12, left: -22, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={chartGridStroke}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: chartTickFill }}
                    tickLine={false}
                    axisLine={{ stroke: chartAxisStroke }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: chartTickFill }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{
                      fill: isDark ? '#1e293b' : '#e2e8f0',
                      opacity: 0.45,
                    }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div
                          className={`rounded-xl p-3 text-xs shadow-lg max-w-[260px] ${
                            isDark
                              ? 'bg-slate-950 text-slate-50 border border-slate-800'
                              : 'bg-slate-900 text-slate-50'
                          }`}
                        >
                          <div className="font-bold text-slate-200 mb-1">
                            {item.date} — {item.ripassi}{' '}
                            {item.ripassi === 1 ? 'argomento' : 'argomenti'}
                          </div>
                          {item.topicsList && item.topicsList.length > 0 ? (
                            <ul className="space-y-0.5 text-[11px] text-slate-300 list-disc pl-3.5">
                              {item.topicsList.map((title, idx) => (
                                <li key={idx} className="truncate">
                                  {title}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] text-slate-400">
                              Nessun ripasso previsto in questa data.
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />

                  {srAnalytics.examShort && (
                    <ReferenceLine
                      x={srAnalytics.examShort}
                      stroke="#e11d48"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Appello',
                        position: 'top',
                        fill: isDark ? '#fb7185' : '#e11d48',
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    />
                  )}

                  <Bar dataKey="ripassi" radius={[6, 6, 0, 0]} maxBarSize={28}>
                    {srAnalytics.forecastChart.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={
                          entry.isToday
                            ? '#f59e0b'
                            : isDark
                            ? '#818cf8'
                            : '#6366f1'
                        }
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <form
            onSubmit={handleAddSrTopic}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
          >
            <div className="sm:col-span-5">
              <label
                className={`block text-[11px] font-semibold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Argomento / Capitolo studiato
              </label>
              <input
                type="text"
                placeholder="Es. Ciclo dell'urea, Enzimi epatici..."
                value={srTitleInput}
                onChange={(e) => setSrTitleInput(e.target.value)}
                required
                className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                className={`block text-[11px] font-semibold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Rif. Pagine
              </label>
              <input
                type="text"
                placeholder="pp. 45-62"
                value={srPagesInput}
                onChange={(e) => setSrPagesInput(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
              />
            </div>
            <div className="sm:col-span-3">
              <label
                className={`block text-[11px] font-semibold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Studiato il
              </label>
              <input
                type="date"
                value={srStudyDateInput}
                onChange={(e) => setSrStudyDateInput(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Aggiungi
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                className={`inline-flex rounded-xl p-1 ${
                  isDark ? 'bg-slate-800' : 'bg-slate-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSrFilter('due')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    srFilter === 'due'
                      ? isDark
                        ? 'bg-slate-900 text-amber-400 shadow-xs'
                        : 'bg-white text-amber-700 shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Da ripassare oggi ({srAnalytics.dueTotalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSrFilter('upcoming')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    srFilter === 'upcoming'
                      ? isDark
                        ? 'bg-slate-900 text-indigo-400 shadow-xs'
                        : 'bg-white text-indigo-600 shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Prossimi (
                  {srAnalytics.totalTopics - srAnalytics.dueTotalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSrFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    srFilter === 'all'
                      ? isDark
                        ? 'bg-slate-900 text-slate-100 shadow-xs'
                        : 'bg-white text-slate-900 shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tutti ({srAnalytics.totalTopics})
                </button>
              </div>
              <span
                className={`text-[11px] ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Valuta la difficoltà dopo il ripasso per ricalcolare il
                prossimo intervallo
              </span>
            </div>

            {filteredSrTopics.length === 0 ? (
              <div
                className={`rounded-xl border border-dashed p-5 text-center text-xs ${
                  isDark
                    ? 'border-slate-800 text-slate-400 bg-slate-800/30'
                    : 'border-slate-200 text-slate-400 bg-slate-50/40'
                }`}
              >
                {srAnalytics.totalTopics === 0
                  ? 'Nessun argomento in Spaced Repetition. Aggiungi i capitoli studiati sopra per pianificare i ripassi!'
                  : srFilter === 'due'
                  ? 'Nessun ripasso in scadenza oggi! Ottimo lavoro.'
                  : 'Nessun argomento in questa vista.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
                {filteredSrTopics.map((topic) => {
                  const previewHard =
                    topic.repetitions <= 1
                      ? 1
                      : Math.max(1, Math.round(topic.intervalDays * 0.6));
                  const previewGood =
                    topic.repetitions === 0
                      ? 1
                      : topic.repetitions === 1
                      ? 3
                      : topic.repetitions === 2
                      ? 7
                      : Math.round(topic.intervalDays * topic.easeFactor);
                  const previewEasy =
                    topic.repetitions === 0
                      ? 3
                      : topic.repetitions === 1
                      ? 6
                      : Math.round(topic.intervalDays * topic.easeFactor * 1.3);

                  return (
                    <div
                      key={topic.id}
                      className={`rounded-xl border p-3 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        topic.isOverdue
                          ? isDark
                            ? 'bg-rose-950/35 border-rose-800/60'
                            : 'bg-rose-50/50 border-rose-200'
                          : topic.isDueToday
                          ? isDark
                            ? 'bg-amber-950/35 border-amber-800/60'
                            : 'bg-amber-50/50 border-amber-200'
                          : isDark
                          ? 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-sm font-bold truncate ${
                              isDark ? 'text-slate-100' : 'text-slate-900'
                            }`}
                          >
                            {topic.title}
                          </span>
                          {topic.pagesRef && (
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                                isDark
                                  ? 'bg-slate-800 text-slate-300'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {topic.pagesRef}
                            </span>
                          )}
                          {topic.isOverdue && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isDark
                                  ? 'bg-rose-900/70 text-rose-200'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              Scaduto da {Math.abs(topic.deltaDays)}g
                            </span>
                          )}
                          {topic.isDueToday && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isDark
                                  ? 'bg-amber-900/70 text-amber-200'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              Oggi
                            </span>
                          )}
                          {!topic.isDue && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isDark
                                  ? 'bg-indigo-950/80 text-indigo-300'
                                  : 'bg-indigo-50 text-indigo-700'
                              }`}
                            >
                              Tra {topic.deltaDays}g (
                              {formatShortDate(topic.nextReviewDate)})
                            </span>
                          )}
                          {topic.isAfterExam && (
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                isDark
                                  ? 'bg-slate-700 text-slate-300'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                              title="Questo ripasso cade dopo la data dell'appello"
                            >
                              Post-appello
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-[11px] flex flex-wrap items-center gap-x-3 gap-y-0.5 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          <span>
                            Ripassi completati:{' '}
                            <strong
                              className={
                                isDark ? 'text-slate-200' : 'text-slate-700'
                              }
                            >
                              {topic.repetitions}
                            </strong>
                          </span>
                          <span>
                            Intervallo attuale:{' '}
                            <strong
                              className={
                                isDark ? 'text-slate-200' : 'text-slate-700'
                              }
                            >
                              {topic.intervalDays}g
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReviewSrTopic(topic.id, 'hard')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                            isDark
                              ? 'bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 border-rose-800/70'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          }`}
                          title="Difficile: accorcia l'intervallo di ripasso"
                        >
                          Difficile ({previewHard}g)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewSrTopic(topic.id, 'good')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                            isDark
                              ? 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 border-emerald-800/70'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                          title="Buono: avanza al prossimo intervallo standard"
                        >
                          Buono ({previewGood}g)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewSrTopic(topic.id, 'easy')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                            isDark
                              ? 'bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 border-indigo-800/70'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                          }`}
                          title="Facile: estende l'intervallo di ripasso"
                        >
                          Facile ({previewEasy}g)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSrTopic(topic.id)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            isDark
                              ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-950/60'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Elimina argomento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      );
    } else if (sectionId === 'progress_log') {
      sectionContent = (
        <section
          className={`rounded-2xl border p-4 sm:p-6 shadow-sm ${cardSurfaceClass}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3
                className={`text-base sm:text-lg font-bold ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                Aggiornamento Avanzamento
              </h3>
              <p
                className={`text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Registra le pagine studiate oggi o in una data specifica
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`inline-flex rounded-xl p-1 ${
                  isDark ? 'bg-slate-800' : 'bg-slate-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setLogMode('daily')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    logMode === 'daily'
                      ? isDark
                        ? 'bg-slate-900 text-indigo-400 shadow-xs'
                        : 'bg-white text-indigo-600 shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pagine del giorno
                </button>
                <button
                  type="button"
                  onClick={() => setLogMode('cumulative')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    logMode === 'cumulative'
                      ? isDark
                        ? 'bg-slate-900 text-indigo-400 shadow-xs'
                        : 'bg-white text-indigo-600 shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Arrivato a pag. X
                </button>
              </div>
              {orderControls}
            </div>
          </div>

          <form
            onSubmit={handleAddLog}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end mb-6"
          >
            <div className="sm:col-span-4">
              <label
                className={`block text-xs font-semibold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Data
              </label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                required
                className={`w-full rounded-xl border px-3 py-2 text-sm ${inputMutedSurfaceClass}`}
              />
            </div>

            <div className="sm:col-span-5">
              <label
                className={`block text-xs font-semibold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {logMode === 'daily'
                  ? 'Pagine completate nella giornata'
                  : `Pagina totale raggiunta (su ${analytics.totalPages})`}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder={
                  logMode === 'daily'
                    ? 'Es. 22'
                    : `Es. ${Math.min(
                        analytics.totalPages,
                        analytics.completedPages + 20
                      )}`
                }
                value={logPagesInput}
                onChange={(e) => setLogPagesInput(e.target.value)}
                required
                className={`w-full rounded-xl border px-3 py-2 text-sm ${inputMutedSurfaceClass}`}
              />
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Registra
              </button>
            </div>
          </form>

          <div
            className={`border-t pt-4 ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Storico Sessioni ({historyRows.length})
              </h4>
              {historyRows.length > 0 && (
                <span
                  className={`text-xs ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Clicca la matita per correggere un inserimento
                </span>
              )}
            </div>

            {historyRows.length === 0 ? (
              <div
                className={`rounded-xl border border-dashed p-6 text-center text-sm ${
                  isDark
                    ? 'border-slate-800 text-slate-400'
                    : 'border-slate-200 text-slate-400'
                }`}
              >
                Nessuna sessione ancora registrata. Inserisci le prime pagine
                qui sopra!
              </div>
            ) : (
              <div className="overflow-x-auto max-h-64 overflow-y-auto pr-1">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr
                      className={`border-b text-xs ${
                        isDark
                          ? 'border-slate-800 text-slate-400'
                          : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      <th className="py-2 font-semibold">Data</th>
                      <th className="py-2 font-semibold">Pagine del giorno</th>
                      <th className="py-2 font-semibold">Cumulativo</th>
                      <th className="py-2 font-semibold text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      isDark ? 'divide-slate-800/80' : 'divide-slate-100'
                    }`}
                  >
                    {historyRows.map((row) => (
                      <tr
                        key={row.date}
                        className={`transition ${
                          isDark
                            ? 'hover:bg-slate-800/60'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td
                          className={`py-2.5 font-medium ${
                            isDark ? 'text-slate-200' : 'text-slate-800'
                          }`}
                        >
                          {formatShortDate(row.date)}{' '}
                          <span
                            className={`text-xs font-normal ${
                              isDark ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            ({row.weekday})
                          </span>
                          {row.isRestDay && (
                            <span
                              className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                isDark
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              Pausa
                            </span>
                          )}
                        </td>
                        <td className="py-2.5">
                          {editingLogDate === row.date ? (
                            <input
                              type="number"
                              min="0"
                              value={editingLogPages}
                              onChange={(e) =>
                                setEditingLogPages(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter')
                                  handleSaveEditedLog(row.date);
                                if (e.key === 'Escape') setEditingLogDate(null);
                              }}
                              className={`w-20 rounded-lg border px-2 py-1 text-sm font-semibold focus:outline-none ${
                                isDark
                                  ? 'border-indigo-500 bg-slate-800 text-slate-100'
                                  : 'border-indigo-400 bg-white text-slate-900'
                              }`}
                              autoFocus
                            />
                          ) : (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-xs ${
                                isDark
                                  ? 'bg-indigo-950/70 text-indigo-300'
                                  : 'bg-indigo-50 text-indigo-700'
                              }`}
                            >
                              +{row.pages} pag
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-2.5 text-xs ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          {row.cumulative} / {analytics.totalPages} pag
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            {editingLogDate === row.date ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedLog(row.date)}
                                  className={`p-1.5 rounded-lg cursor-pointer ${
                                    isDark
                                      ? 'text-emerald-400 hover:bg-emerald-950/70'
                                      : 'text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title="Salva"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingLogDate(null)}
                                  className={`p-1.5 rounded-lg cursor-pointer ${
                                    isDark
                                      ? 'text-slate-400 hover:bg-slate-800'
                                      : 'text-slate-500 hover:bg-slate-100'
                                  }`}
                                  title="Annulla"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingLogDate(row.date);
                                    setEditingLogPages(String(row.pages));
                                  }}
                                  className={`p-1.5 rounded-lg cursor-pointer ${
                                    isDark
                                      ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
                                      : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                                  }`}
                                  title="Modifica pagine"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLog(row.date)}
                                  className={`p-1.5 rounded-lg cursor-pointer ${
                                    isDark
                                      ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/60'
                                      : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  }`}
                                  title="Elimina riga"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      );
    } else if (sectionId === 'pomodoro') {
      sectionContent = (
        <section
          className={`rounded-2xl border p-4 sm:p-6 shadow-sm space-y-4 ${cardSurfaceClass}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Clock
                  className={`w-4 h-4 ${
                    pomoPhase === 'study'
                      ? isDark
                        ? 'text-indigo-400'
                        : 'text-indigo-600'
                      : isDark
                      ? 'text-emerald-400'
                      : 'text-emerald-600'
                  }`}
                />
                <h3
                  className={`text-base font-bold ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  Timer Pomodoro
                </h3>
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Cicli Studio + Pausa Breve e Lunga
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  getUnlockedAudioContext();
                  const next = !pomoSound;
                  setPomoSound(next);
                  if (next) playPomodoroSound(pomoSoundType, 'study');
                }}
                className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                  pomoSound
                    ? isDark
                      ? 'bg-indigo-950/70 border-indigo-800/70 text-indigo-300'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                    : isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
                title={pomoSound ? 'Suono attivo' : 'Suono disattivato'}
              >
                {pomoSound ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>
              {orderControls}
            </div>
          </div>

          <div
            className={`grid grid-cols-3 gap-1 p-1 rounded-xl ${
              isDark ? 'bg-slate-800' : 'bg-slate-100'
            }`}
          >
            <button
              type="button"
              onClick={() => handlePomoSwitchPhase('study')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                pomoPhase === 'study'
                  ? isDark
                    ? 'bg-slate-900 text-indigo-400 shadow-xs'
                    : 'bg-white text-indigo-600 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Studio
            </button>
            <button
              type="button"
              onClick={() => handlePomoSwitchPhase('short_break')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                pomoPhase === 'short_break'
                  ? isDark
                    ? 'bg-slate-900 text-emerald-400 shadow-xs'
                    : 'bg-white text-emerald-600 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pausa
            </button>
            <button
              type="button"
              onClick={() => handlePomoSwitchPhase('long_break')}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                pomoPhase === 'long_break'
                  ? isDark
                    ? 'bg-slate-900 text-teal-400 shadow-xs'
                    : 'bg-white text-teal-700 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pausa Lunga
            </button>
          </div>

          <div
            className={`rounded-2xl p-4 text-center border transition-colors ${
              pomoPhase === 'study'
                ? isDark
                  ? 'bg-indigo-950/35 border-indigo-800/60'
                  : 'bg-indigo-50/70 border-indigo-100'
                : isDark
                ? 'bg-emerald-950/35 border-emerald-800/60'
                : 'bg-emerald-50/70 border-emerald-100'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 mb-2">
              {[1, 2, 3, 4].map((dot) => (
                <span
                  key={dot}
                  className={`h-2 w-6 rounded-full transition-all ${
                    dot <= pomoCycleCount
                      ? pomoPhase === 'study'
                        ? 'bg-indigo-500'
                        : 'bg-emerald-500'
                      : isDark
                      ? 'bg-slate-700'
                      : 'bg-slate-200'
                  }`}
                  title={`Pomodoro ${dot} di 4 prima della pausa lunga`}
                />
              ))}
            </div>

            <div
              className={`text-4xl sm:text-5xl font-black tracking-tight tabular-nums my-1 ${
                pomoPhase === 'study'
                  ? isDark
                    ? 'text-slate-50'
                    : 'text-slate-900'
                  : isDark
                  ? 'text-emerald-200'
                  : 'text-emerald-950'
              }`}
            >
              {pomoMinutesDisplay}:{pomoSecondsDisplay}
            </div>

            <p
              className={`text-xs font-medium mb-3 ${
                pomoPhase === 'study'
                  ? isDark
                    ? 'text-indigo-300'
                    : 'text-indigo-700'
                  : isDark
                  ? 'text-emerald-300'
                  : 'text-emerald-700'
              }`}
            >
              {pomoPhase === 'study'
                ? `Sessione Studio #${(pomoCycleCount % 4) + 1} di 4`
                : pomoPhase === 'short_break'
                ? 'Pausa breve: sgranchisciti e riposa gli occhi'
                : 'Pausa lunga meritata dopo 4 sessioni!'}
            </p>

            <div
              className={`w-full h-1.5 rounded-full overflow-hidden mb-4 ${
                isDark ? 'bg-slate-800/90' : 'bg-white/80'
              }`}
            >
              <div
                className={`h-full transition-all duration-300 ${
                  pomoPhase === 'study' ? 'bg-indigo-600' : 'bg-emerald-500'
                }`}
                style={{ width: `${pomoStats.progressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleTogglePomoRunning}
                className={`inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-xs transition cursor-pointer ${
                  pomoRunning
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : pomoPhase === 'study'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {pomoRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pausa
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Avvia
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePomoReset}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Azzera timer corrente"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handlePomoSkipPhase}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Salta alla fase successiva"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Durata (min) e Preset
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePomoPreset(25, 5, 15)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                    pomoStudyMin === 25 &&
                    pomoShortBreakMin === 5 &&
                    pomoLongBreakMin === 15
                      ? isDark
                        ? 'bg-indigo-950/80 text-indigo-300'
                        : 'bg-indigo-100 text-indigo-700'
                      : isDark
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  25/5/15
                </button>
                <button
                  type="button"
                  onClick={() => handlePomoPreset(50, 10, 20)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                    pomoStudyMin === 50 &&
                    pomoShortBreakMin === 10 &&
                    pomoLongBreakMin === 20
                      ? isDark
                        ? 'bg-indigo-950/80 text-indigo-300'
                        : 'bg-indigo-100 text-indigo-700'
                      : isDark
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  50/10/20
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label
                  className={`block text-[11px] font-medium mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Studio
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={pomoStudyMin}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value) || 1);
                    setPomoStudyMin(val);
                    if (!pomoRunning && pomoPhase === 'study') {
                      setPomoSecondsLeft(val * 60);
                    }
                  }}
                  className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-semibold ${inputMutedSurfaceClass}`}
                />
              </div>
              <div>
                <label
                  className={`block text-[11px] font-medium mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Pausa
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={pomoShortBreakMin}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value) || 1);
                    setPomoShortBreakMin(val);
                    if (!pomoRunning && pomoPhase === 'short_break') {
                      setPomoSecondsLeft(val * 60);
                    }
                  }}
                  className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-semibold ${inputMutedSurfaceClass}`}
                />
              </div>
              <div>
                <label
                  className={`block text-[11px] font-medium mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  P. Lunga
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={pomoLongBreakMin}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value) || 1);
                    setPomoLongBreakMin(val);
                    if (!pomoRunning && pomoPhase === 'long_break') {
                      setPomoSecondsLeft(val * 60);
                    }
                  }}
                  className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-semibold ${inputMutedSurfaceClass}`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label
                className={`inline-flex items-center gap-2 text-xs cursor-pointer select-none ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pomoAutoContinue}
                  onChange={(e) => setPomoAutoContinue(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Avvio automatico fase successiva
              </label>

              <button
                type="button"
                onClick={handleAddManualPomoSession}
                className={`text-[11px] font-semibold cursor-pointer ${
                  isDark
                    ? 'text-indigo-400 hover:text-indigo-300'
                    : 'text-indigo-600 hover:text-indigo-700'
                }`}
                title="Registra manualmente 1 sessione completata adesso"
              >
                +1 sessione
              </button>
            </div>

            <div
              className={`flex items-center justify-between gap-2 pt-2 border-t ${
                isDark ? 'border-slate-800/80' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Bell
                  className={`w-3.5 h-3.5 shrink-0 ${
                    pomoSound
                      ? isDark
                        ? 'text-indigo-400'
                        : 'text-indigo-600'
                      : isDark
                      ? 'text-slate-500'
                      : 'text-slate-400'
                  }`}
                />
                <select
                  value={pomoSoundType}
                  disabled={!pomoSound}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setPomoSoundType(chosen);
                    getUnlockedAudioContext();
                    playPomodoroSound(chosen, 'study');
                  }}
                  className={`w-full rounded-lg border px-2 py-1 text-xs font-medium truncate disabled:opacity-50 ${inputMutedSurfaceClass}`}
                  title="Scegli la suoneria di fine sessione o pausa"
                >
                  {POMO_SOUNDS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                disabled={!pomoSound}
                onClick={() => {
                  getUnlockedAudioContext();
                  playPomodoroSound(pomoSoundType, 'study');
                }}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition shrink-0 disabled:opacity-40 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="Ascolta anteprima suono"
              >
                Testa
              </button>
            </div>
          </div>

          <div
            className={`pt-3 border-t space-y-2.5 ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}
          >
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`rounded-xl p-2.5 border ${
                  isDark
                    ? 'bg-slate-800/60 border-slate-700/80'
                    : 'bg-slate-50 border-slate-200/70'
                }`}
              >
                <p
                  className={`text-[11px] font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Oggi ({activeExam.name})
                </p>
                <p
                  className={`text-sm font-bold ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  {pomoStats.todayCount} pom ·{' '}
                  <span
                    className={isDark ? 'text-indigo-400' : 'text-indigo-600'}
                  >
                    {formatMinutesHuman(pomoStats.todayMinutes)}
                  </span>
                </p>
              </div>
              <div
                className={`rounded-xl p-2.5 border ${
                  isDark
                    ? 'bg-slate-800/60 border-slate-700/80'
                    : 'bg-slate-50 border-slate-200/70'
                }`}
              >
                <p
                  className={`text-[11px] font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Totale Esame
                </p>
                <p
                  className={`text-sm font-bold ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  {pomoStats.totalCount} pom ·{' '}
                  <span
                    className={isDark ? 'text-slate-300' : 'text-slate-700'}
                  >
                    {formatMinutesHuman(pomoStats.totalMinutes)}
                  </span>
                </p>
              </div>
            </div>

            {pomoStats.sessions.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowPomoHistory((v) => !v)}
                  className={`w-full flex items-center justify-between text-xs font-semibold py-1 cursor-pointer ${
                    isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>
                    Registro sessioni Pomodoro ({pomoStats.sessions.length})
                  </span>
                  <span
                    className={
                      isDark
                        ? 'text-indigo-400 text-[11px]'
                        : 'text-indigo-600 text-[11px]'
                    }
                  >
                    {showPomoHistory ? 'Nascondi' : 'Mostra'}
                  </span>
                </button>

                {showPomoHistory && (
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {pomoStats.sessions.map((s) => (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5 border ${
                          isDark
                            ? 'bg-slate-800/70 border-slate-700/80'
                            : 'bg-slate-50 border-slate-200/60'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Coffee
                            className={`w-3 h-3 ${
                              isDark ? 'text-indigo-400' : 'text-indigo-500'
                            }`}
                          />
                          <span
                            className={`font-semibold ${
                              isDark ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            {s.durationMin} min
                          </span>
                          <span
                            className={`text-[11px] ${
                              isDark ? 'text-slate-400' : 'text-slate-400'
                            }`}
                          >
                            · {formatShortDate(s.date)}{' '}
                            {s.time ? `alle ${s.time}` : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePomoSession(s.id)}
                          className={`p-1 rounded cursor-pointer ${
                            isDark
                              ? 'text-slate-500 hover:text-rose-400'
                              : 'text-slate-400 hover:text-rose-600'
                          }`}
                          title="Elimina sessione"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      );
    } else if (sectionId === 'parameters') {
      sectionContent = (
        <section
          className={`rounded-2xl border p-4 sm:p-6 shadow-sm space-y-5 ${cardSurfaceClass}`}
        >
          <div
            className={`flex items-center justify-between gap-2 pb-3 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                className={`w-4 h-4 ${
                  isDark ? 'text-indigo-400' : 'text-indigo-600'
                }`}
              />
              <h3
                className={`text-base font-bold ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                Parametri Esame
              </h3>
            </div>
            {orderControls}
          </div>

          <div className="space-y-4">
            <div>
              <label
                className={`block text-xs font-semibold mb-1 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Nome Esame / Materia
              </label>
              <input
                ref={sidebarNameInputRef}
                type="text"
                value={activeExam.name}
                onChange={(e) => updateActiveExam({ name: e.target.value })}
                placeholder="Es. Anatomia Patologica"
                className={`w-full rounded-xl border px-3 py-2 text-sm font-medium ${inputMutedSurfaceClass}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  Inizio Studio
                </label>
                <input
                  type="date"
                  value={activeExam.startDate}
                  onChange={(e) =>
                    updateActiveExam({ startDate: e.target.value })
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
                />
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  Data Appello
                </label>
                <input
                  type="date"
                  value={activeExam.examDate}
                  onChange={(e) =>
                    updateActiveExam({ examDate: e.target.value })
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  Pagine Totali
                </label>
                <input
                  type="number"
                  min="1"
                  value={activeExam.totalPages}
                  onChange={(e) =>
                    updateActiveExam({
                      totalPages: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold ${inputMutedSurfaceClass}`}
                />
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  Giorni Ripasso Finale
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
                  className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold ${inputMutedSurfaceClass}`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={`block text-xs font-semibold ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  Giorni di Pausa Settimanali
                </label>
                <span
                  className={`text-[11px] ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {(activeExam.restDays || []).length} selezionati
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => {
                  const active = (activeExam.restDays || []).includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleRestDay(day.id)}
                      className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        active
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isDark
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`rounded-xl p-3.5 border space-y-2 text-xs ${subPanelClass}`}
            >
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  Termine prima lettura:
                </span>
                <span
                  className={`font-bold ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {formatShortDate(analytics.studyDeadline)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  Giorni utili studio totali:
                </span>
                <span
                  className={`font-bold ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {analytics.totalUsefulDays} giorni
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  Giorni utili rimanenti:
                </span>
                <span
                  className={`font-bold ${
                    isDark ? 'text-indigo-400' : 'text-indigo-600'
                  }`}
                >
                  {analytics.remainingUsefulDays} giorni
                </span>
              </div>
            </div>

            <div
              className={`pt-2 border-t flex flex-wrap items-center justify-between gap-2 ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}
            >
              <button
                type="button"
                onClick={handleResetExam}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  confirmReset
                    ? 'bg-rose-600 text-white'
                    : isDark
                    ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/60'
                    : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {confirmReset
                  ? 'Conferma azzeramento log?'
                  : 'Azzera solo log esame'}
              </button>

              {state.exams.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteExam}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isDark
                      ? 'text-rose-400 hover:bg-rose-950/60'
                      : 'text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Elimina esame
                </button>
              )}
            </div>
          </div>
        </section>
      );
    }

    return (
      <div
        key={sectionId}
        draggable={dragReadyId === sectionId}
        onDragStart={(e) => {
          setDraggedSection({ id: sectionId, fromCol: col });
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (
            dragOverTarget?.col !== col ||
            dragOverTarget?.index !== index
          ) {
            setDragOverTarget({ col, index });
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDropSection(col, index);
        }}
        onDragEnd={() => {
          setDraggedSection(null);
          setDragOverTarget(null);
          setDragReadyId(null);
        }}
        className={`relative transition-all duration-200 ${
          isBeingDragged ? 'opacity-45 scale-[0.99]' : ''
        } ${
          isDropTargetBefore
            ? 'ring-2 ring-indigo-500 ring-offset-4 rounded-2xl'
            : ''
        } ${
          isReorderMode
            ? isDark
              ? 'ring-2 ring-indigo-500/45 rounded-2xl'
              : 'ring-2 ring-indigo-300/80 rounded-2xl'
            : ''
        }`}
      >
        {sectionContent}
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* --- HEADER FULL-WIDTH --- */}
      <header
        className={`border-b sticky top-0 z-20 w-full transition-colors duration-200 ${
          isDark
            ? 'bg-slate-900/95 border-slate-800 backdrop-blur-xs'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-xs shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                  StudyBurn
                </span>
                <span
                  className={isDark ? 'text-slate-600' : 'text-slate-300'}
                >
                  •
                </span>
                <span
                  className={`text-xs truncate ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Tracker Esami Universitari
                </span>
              </div>

              {isRenamingHeader ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    ref={headerRenameInputRef}
                    type="text"
                    value={activeExam.name}
                    onChange={(e) =>
                      updateActiveExam({ name: e.target.value })
                    }
                    onBlur={() => setIsRenamingHeader(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        setIsRenamingHeader(false);
                      }
                    }}
                    className={`text-base sm:text-lg font-bold border-b-2 border-indigo-500 bg-transparent focus:outline-none px-0.5 ${
                      isDark ? 'text-slate-50' : 'text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsRenamingHeader(false)}
                    className={`p-1 rounded cursor-pointer ${
                      isDark
                        ? 'text-emerald-400 hover:bg-emerald-950/60'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title="Conferma nome"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRenamingHeader(true)}
                  className="group flex items-center gap-1.5 text-left mt-0.5 cursor-pointer"
                  title="Clicca per rinominare l'esame"
                >
                  <h1
                    className={`text-base sm:text-lg font-bold truncate group-hover:text-indigo-500 transition-colors ${
                      isDark ? 'text-slate-50' : 'text-slate-900'
                    }`}
                  >
                    {activeExam.name || 'Esame senza nome'}
                  </h1>
                  <Edit3
                    className={`w-3.5 h-3.5 transition-colors shrink-0 ${
                      isDark
                        ? 'text-slate-500 group-hover:text-indigo-400'
                        : 'text-slate-400 group-hover:text-indigo-500'
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {undoStack.length > 0 && (
              <button
                type="button"
                onClick={handleUndo}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  isDark
                    ? 'text-slate-300 bg-slate-800 hover:bg-slate-700 border-slate-700'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border-slate-200'
                }`}
                title="Annulla ultima modifica"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Annulla</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowCloudModal(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                cloudSession?.access_token
                  ? cloudStatus === 'error'
                    ? isDark
                      ? 'bg-rose-950/70 text-rose-300 border-rose-800'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                    : isDark
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isDark
                  ? 'text-slate-300 bg-slate-800 hover:bg-slate-700 border-slate-700'
                  : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200'
              }`}
              title="Sincronizzazione Cloud tra MacBook e iPad"
            >
              {cloudSession?.access_token ? (
                cloudStatus === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : cloudStatus === 'error' ? (
                  <CloudOff className="w-3.5 h-3.5" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {cloudSession?.access_token
                  ? cloudStatus === 'syncing'
                    ? 'Sync...'
                    : 'Cloud Attivo'
                  : 'Sync Cloud'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={
                isDark ? 'Passa a modalità chiara' : 'Passa a modalità scura'
              }
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline">
                {isDark ? 'Chiaro' : 'Scuro'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsReorderMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                isReorderMode
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : isCustomLayout
                  ? isDark
                    ? 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80 hover:bg-indigo-900/70'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  : isDark
                  ? 'text-slate-300 bg-slate-800 hover:bg-slate-700 border-slate-700'
                  : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200'
              }`}
              title="Sposta o riordina le sezioni della pagina"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isReorderMode ? 'Fine ordine' : 'Ordina sezioni'}
              </span>
            </button>

            <select
              aria-label="Seleziona esame"
              value={activeExam.id}
              onChange={(e) => {
                setState((prev) => ({
                  ...prev,
                  activeExamId: e.target.value,
                }));
                setIsRenamingHeader(false);
                setConfirmReset(false);
              }}
              className={`rounded-lg border text-xs sm:text-sm font-medium px-2.5 py-1.5 max-w-[170px] sm:max-w-[220px] truncate ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  : 'border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500'
              }`}
            >
              {state.exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name || 'Senza nome'}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleCreateExam}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo</span>
            </button>

            <button
              type="button"
              onClick={handleDuplicateExam}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                isDark
                  ? 'text-slate-300 bg-slate-800 hover:bg-slate-700 border-slate-700'
                  : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200'
              }`}
              title="Duplica questo esame"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Duplica</span>
            </button>

            <button
              type="button"
              onClick={handleLoadDemo}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                isDark
                  ? 'text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900/70 border-indigo-800/80'
                  : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
              }`}
              title="Crea un esame dimostrativo già popolato"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Carica Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- MODALE SYNC CLOUD MULTI-DISPOSITIVO --- */}
      {showCloudModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs"
          onClick={() => setShowCloudModal(false)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl border p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${cardSurfaceClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    isDark
                      ? 'bg-indigo-950/80 text-indigo-400'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    className={`text-base sm:text-lg font-bold ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}
                  >
                    Sincronizzazione Cloud (MacBook ↔ iPad)
                  </h2>
                  <p
                    className={`text-xs ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Accedi con lo stesso account su tutti i tuoi dispositivi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCloudModal(false)}
                className={`p-1.5 rounded-lg cursor-pointer ${
                  isDark
                    ? 'text-slate-400 hover:bg-slate-800'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cloudConflictPayload && (
              <div
                className={`rounded-xl border p-4 space-y-3 ${
                  isDark
                    ? 'bg-amber-950/50 border-amber-800 text-amber-100'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <p className="text-xs font-bold">
                  Trovati dati sia su questo dispositivo che nel tuo account
                  Cloud! Quali vuoi mantenere?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      applyRemotePayload(cloudConflictPayload);
                      cloudSyncReadyRef.current = true;
                      setCloudConflictPayload(null);
                      setLastSyncedAt(getCurrentTimeStr());
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    Scarica dati dal Cloud
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      cloudSyncReadyRef.current = true;
                      setCloudConflictPayload(null);
                      await pushToCloud();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Carica dati di questo dispositivo sul Cloud
                  </button>
                </div>
              </div>
            )}

            {cloudSession?.access_token ? (
              <div className="space-y-4">
                <div
                  className={`rounded-xl border p-4 space-y-2 ${
                    isDark
                      ? 'bg-emerald-950/35 border-emerald-800/70'
                      : 'bg-emerald-50/70 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold ${
                        isDark ? 'text-emerald-300' : 'text-emerald-800'
                      }`}
                    >
                      Connesso come {cloudSession.user?.email}
                    </span>
                    {lastSyncedAt && (
                      <span
                        className={`text-[11px] ${
                          isDark ? 'text-emerald-400' : 'text-emerald-700'
                        }`}
                      >
                        Ultimo sync: {lastSyncedAt}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    Ogni modifica a pagine, esami, timer e ripassi viene salvata
                    automaticamente sul cloud e caricata quando apri
                    l&apos;app su iPad o Mac.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => pullFromCloud(cloudSession, false)}
                    disabled={cloudStatus === 'syncing'}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        cloudStatus === 'syncing' ? 'animate-spin' : ''
                      }`}
                    />
                    Sincronizza ora
                  </button>

                  <button
                    type="button"
                    onClick={handleCloudLogout}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-rose-400 hover:bg-rose-950/60'
                        : 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Disconnetti
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCloudAuthSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div
                    className={`inline-flex rounded-xl p-1 ${
                      isDark ? 'bg-slate-800' : 'bg-slate-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setCloudMessage('');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        authMode === 'login'
                          ? isDark
                            ? 'bg-slate-900 text-indigo-400 shadow-xs'
                            : 'bg-white text-indigo-600 shadow-xs'
                          : isDark
                          ? 'text-slate-400'
                          : 'text-slate-600'
                      }`}
                    >
                      Accedi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setCloudMessage('');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        authMode === 'signup'
                          ? isDark
                            ? 'bg-slate-900 text-indigo-400 shadow-xs'
                            : 'bg-white text-indigo-600 shadow-xs'
                          : isDark
                          ? 'text-slate-400'
                          : 'text-slate-600'
                      }`}
                    >
                      Crea Account
                    </button>
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-semibold mb-1 ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="nome@esempio.it"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                      className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-semibold mb-1 ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      Password (min. 6 caratteri)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                      minLength={6}
                      className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
                    />
                  </div>
                </div>

                {SUPABASE_URL.trim() && SUPABASE_ANON_KEY.trim() && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedServerConfig((v) => !v)}
                      className={`text-[11px] font-semibold cursor-pointer ${
                        isDark
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {showAdvancedServerConfig
                        ? 'Nascondi configurazione server Supabase'
                        : 'Configurazione server Supabase (già attiva)'}
                    </button>
                  </div>
                )}

                {showAdvancedServerConfig && (
                  <div
                    className={`rounded-xl border p-3.5 space-y-3 ${subPanelClass}`}
                  >
                    <p
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      Configurazione Database Supabase
                    </p>
                    <div>
                      <label
                        className={`block text-[11px] font-semibold mb-1 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        Project URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://xyzproject.supabase.co"
                        value={cloudUrl}
                        onChange={(e) => setCloudUrl(e.target.value)}
                        className={`w-full rounded-xl border px-3 py-1.5 text-xs ${inputSurfaceClass}`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-[11px] font-semibold mb-1 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        Anon / Publishable Key
                      </label>
                      <input
                        type="text"
                        placeholder="sb_publishable_..."
                        value={cloudAnonKey}
                        onChange={(e) => setCloudAnonKey(e.target.value)}
                        className={`w-full rounded-xl border px-3 py-1.5 text-xs ${inputSurfaceClass}`}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {authLoading
                    ? 'Connessione in corso...'
                    : authMode === 'login'
                    ? 'Accedi e Sincronizza'
                    : 'Registrati e Sincronizza'}
                </button>
              </form>
            )}

            {cloudMessage && (
              <div
                className={`rounded-xl p-3 text-xs font-medium ${
                  isDark
                    ? 'bg-slate-800 text-amber-300 border border-slate-700'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                {cloudMessage}
              </div>
            )}

            <div
              className={`pt-4 border-t flex flex-wrap items-center justify-between gap-2 ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Backup locale rapido (.json):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportBackupFile}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Esporta
                </button>
                <button
                  type="button"
                  onClick={() => importFileInputRef.current?.click()}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Importa
                </button>
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackupFile}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN DASHBOARD FULL-WIDTH --- */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {isReorderMode && (
          <div
            className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-3 ${
              isDark
                ? 'bg-indigo-950/60 border-indigo-800/80 text-indigo-100'
                : 'bg-indigo-50 border-indigo-200 text-indigo-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutGrid
                className={`w-5 h-5 shrink-0 ${
                  isDark ? 'text-indigo-400' : 'text-indigo-600'
                }`}
              />
              <div>
                <p className="text-sm font-bold">
                  Personalizzazione ordine sezioni attiva
                </p>
                <p
                  className={`text-xs ${
                    isDark ? 'text-indigo-300' : 'text-indigo-800'
                  }`}
                >
                  Usa le frecce su/giù, sposta tra colonna sinistra e destra
                  oppure trascina la maniglia di ogni riquadro.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCustomLayout && (
                <button
                  type="button"
                  onClick={handleResetLayout}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isDark
                      ? 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Ripristina predefinito
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsReorderMode(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
              >
                Fatto
              </button>
            </div>
          </div>
        )}

        {/* 1. BANNER DINAMICO STATO STUDIO */}
        <section
          className={`rounded-2xl border p-4 sm:p-5 transition-colors ${statusStyles.wrapper}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${statusStyles.iconBg}`}
            >
              <StatusIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusStyles.badge}`}
                >
                  {statusStyles.statusTitle}
                </span>
                {analytics.safeReviewDays > 0 && (
                  <span className="text-xs opacity-75">
                    Fine prima lettura prevista entro il{' '}
                    <strong>{formatShortDate(analytics.studyDeadline)}</strong>{' '}
                    ({analytics.safeReviewDays} gg di ripasso finale)
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold leading-snug">
                {statusStyles.statusHeadline}
              </h2>
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                {statusStyles.statusDetail}
              </p>
            </div>
          </div>
        </section>

        {/* 2. RIGA 4 KPI CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between ${cardSurfaceClass}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Completamento
              </span>
              <div
                className={`p-2 rounded-lg ${
                  isDark
                    ? 'bg-indigo-950/80 text-indigo-400'
                    : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div
                className={`text-2xl sm:text-3xl font-extrabold ${
                  isDark ? 'text-slate-50' : 'text-slate-900'
                }`}
              >
                {analytics.completionPct.toFixed(1)}%
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <strong
                  className={isDark ? 'text-slate-200' : 'text-slate-700'}
                >
                  {analytics.completedPages}
                </strong>{' '}
                / {analytics.totalPages} pagine
              </p>
            </div>
            <div
              className={`w-full h-2 rounded-full overflow-hidden ${
                isDark ? 'bg-slate-800' : 'bg-slate-100'
              }`}
            >
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${analytics.completionPct}%` }}
              />
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between ${cardSurfaceClass}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Pagine Rimanenti
              </span>
              <div
                className={`p-2 rounded-lg ${
                  isDark
                    ? 'bg-sky-950/80 text-sky-400'
                    : 'bg-sky-50 text-sky-600'
                }`}
              >
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div
                className={`text-2xl sm:text-3xl font-extrabold ${
                  isDark ? 'text-slate-50' : 'text-slate-900'
                }`}
              >
                {analytics.remainingPages}
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                su {analytics.totalPages} pagine totali
              </p>
            </div>
            <div
              className={`text-xs font-medium ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Ritmo iniziale:{' '}
              <span
                className={`font-semibold ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}
              >
                {analytics.initialMinPace.toFixed(1)} pag/gg
              </span>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between ${cardSurfaceClass}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Ritmo Necessario
              </span>
              <div
                className={`p-2 rounded-lg ${
                  isDark
                    ? 'bg-violet-950/80 text-violet-400'
                    : 'bg-violet-50 text-violet-600'
                }`}
              >
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div
                className={`text-2xl sm:text-3xl font-extrabold ${
                  isDark ? 'text-slate-50' : 'text-slate-900'
                }`}
              >
                {analytics.newRequiredPace.toFixed(1)}
                <span
                  className={`text-sm font-semibold ml-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  pag/gg
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Media reale attuale:{' '}
                <strong
                  className={isDark ? 'text-slate-200' : 'text-slate-700'}
                >
                  {analytics.realDailyAvg.toFixed(1)}
                </strong>{' '}
                pag/gg
              </p>
            </div>
            <div
              className={`text-xs font-medium ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Nei prossimi{' '}
              <span
                className={`font-semibold ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}
              >
                {analytics.remainingUsefulDays} giorni utili
              </span>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between ${cardSurfaceClass}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Countdown Appello
              </span>
              <div
                className={`p-2 rounded-lg ${
                  isDark
                    ? 'bg-amber-950/80 text-amber-400'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div
                className={`text-2xl sm:text-3xl font-extrabold ${
                  isDark ? 'text-slate-50' : 'text-slate-900'
                }`}
              >
                -{analytics.daysToExam}
                <span
                  className={`text-sm font-semibold ml-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  giorni
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Appello il{' '}
                <strong
                  className={isDark ? 'text-slate-200' : 'text-slate-700'}
                >
                  {formatShortDate(activeExam.examDate)}
                </strong>
              </p>
            </div>
            <div
              className={`text-xs font-medium flex items-center gap-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {analytics.remainingUsefulDays} giorni utili di studio
              </span>
            </div>
          </div>
        </section>

        {/* 3. GRIGLIA PRINCIPALE RIORDINABILE (2 COLONNE) */}
        <div
          className={`grid grid-cols-1 ${
            layout.left.length > 0 && layout.right.length > 0
              ? 'lg:grid-cols-12'
              : ''
          } gap-6 items-start`}
        >
          {layout.left.length > 0 && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleDropSection('left', layout.left.length);
              }}
              className={`${
                layout.right.length > 0 ? 'lg:col-span-8' : ''
              } space-y-6`}
            >
              {layout.left.map((secId, idx) =>
                renderSection(secId, 'left', idx, layout.left.length)
              )}
            </div>
          )}

          {layout.right.length > 0 && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleDropSection('right', layout.right.length);
              }}
              className={`${
                layout.left.length > 0 ? 'lg:col-span-4' : ''
              } space-y-6`}
            >
              {layout.right.map((secId, idx) =>
                renderSection(secId, 'right', idx, layout.right.length)
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
