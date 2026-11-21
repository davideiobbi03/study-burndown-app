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
  Clock,
  Target,
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
  GraduationCap,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Maximize2,
  Minimize2,
  Sparkles,
  Headphones,
  Stethoscope,
  CheckSquare,
  Square,
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

function formatFullDateIT(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatMinutesHuman(totalMinutes) {
  const mins = Math.max(0, Math.round(totalMinutes));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// --- DATI INIZIALI TIROCINI (IMPORTATI DA NOTION) ---
const TIROCINIO_ICONS = [
  '🩸',
  '🩺',
  '👅',
  '🫁',
  '🫀',
  '🦴',
  '💉',
  '🧠',
  '👁️',
  '🏥',
  '👶',
  '🧬',
];

function createDefaultTirocini() {
  return [
    {
      id: 'tir_2',
      name: 'Tirocinio 2',
      verbalizzato: false,
      rotations: [
        {
          id: 'rot_t2_1',
          icon: '🩸',
          name: 'Ematologia',
          durationDays: 5,
          startDate: '2026-07-13',
          endDate: '2026-07-17',
          status: 'done',
        },
        {
          id: 'rot_t2_2',
          icon: '🩺',
          name: 'Interna',
          durationDays: 10,
          startDate: '2026-08-31',
          endDate: '2026-09-11',
          status: 'done',
        },
        {
          id: 'rot_t2_3',
          icon: '👅',
          name: 'Gastro',
          durationDays: 5,
          startDate: '2026-09-21',
          endDate: '2026-09-25',
          status: 'done',
        },
        {
          id: 'rot_t2_4',
          icon: '🫁',
          name: 'Pneumo',
          durationDays: 5,
          startDate: '2026-11-02',
          endDate: '2026-11-06',
          status: 'done',
        },
        {
          id: 'rot_t2_5',
          icon: '🫀',
          name: 'Cardio',
          durationDays: 5,
          startDate: '2026-10-19',
          endDate: '2026-10-23',
          status: 'done',
        },
      ],
    },
    {
      id: 'tir_3',
      name: 'Tirocinio 3',
      verbalizzato: false,
      rotations: [
        {
          id: 'rot_t3_1',
          icon: '🦴',
          name: 'Ortopedia',
          durationDays: 5,
          startDate: '2026-10-12',
          endDate: '2026-10-18',
          status: 'done',
        },
        {
          id: 'rot_t3_2',
          icon: '💉',
          name: 'Vascolare',
          durationDays: 5,
          startDate: '2026-11-16',
          endDate: '2026-11-20',
          status: 'not_started',
        },
      ],
    },
  ];
}

function normalizeTirocini(raw) {
  if (!Array.isArray(raw)) return createDefaultTirocini();
  return raw.map((t, idx) => ({
    id: t.id || `tir_${idx}_${Date.now()}`,
    name: t.name || `Tirocinio ${idx + 1}`,
    verbalizzato: Boolean(t.verbalizzato),
    rotations: Array.isArray(t.rotations)
      ? t.rotations.map((r, rIdx) => ({
          id: r.id || `rot_${idx}_${rIdx}_${Date.now()}`,
          icon: r.icon || '🏥',
          name: r.name || '',
          durationDays: Math.max(1, Number(r.durationDays) || 5),
          startDate: r.startDate || '',
          endDate: r.endDate || '',
          status: ['not_started', 'in_progress', 'done'].includes(r.status)
            ? r.status
            : 'not_started',
        }))
      : [],
  }));
}

// --- DATI INIZIALI LIBRETTO MEDICINA (1° - 6° ANNO) ---
function createDefaultMedYears() {
  return {
    1: [
      {
        id: 'blk_y1_1',
        name: 'Biologia e Genetica',
        subjects: [
          {
            id: 'sub_y1_1a',
            name: 'Biologia Cellulare e Molecolare',
            cfu: 6,
            grade: 28,
            lode: false,
          },
          {
            id: 'sub_y1_1b',
            name: 'Genetica Medica',
            cfu: 4,
            grade: 30,
            lode: true,
          },
        ],
      },
      {
        id: 'blk_y1_2',
        name: 'Istologia ed Embriologia',
        subjects: [
          {
            id: 'sub_y1_2a',
            name: 'Istologia',
            cfu: 6,
            grade: 27,
            lode: false,
          },
          {
            id: 'sub_y1_2b',
            name: 'Embriologia Umana',
            cfu: 3,
            grade: 29,
            lode: false,
          },
        ],
      },
    ],
    2: [],
    3: [],
    4: [
      {
        id: 'blk_y4_1',
        name: 'Medicina di Laboratorio',
        subjects: [
          {
            id: 'sub_y4_1a',
            name: 'Biochimica Clinica',
            cfu: 4,
            grade: null,
            lode: false,
          },
          {
            id: 'sub_y4_1b',
            name: 'Patologia Clinica',
            cfu: 4,
            grade: null,
            lode: false,
          },
        ],
      },
    ],
    5: [],
    6: [],
  };
}

function normalizeMedYears(raw) {
  const base = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  if (!raw || typeof raw !== 'object') return createDefaultMedYears();
  [1, 2, 3, 4, 5, 6].forEach((yr) => {
    base[yr] = Array.isArray(raw[yr]) ? raw[yr] : [];
  });
  return base;
}

// --- CITAZIONI MOTIVAZIONALI POMODORO ---
const POMO_QUOTES = [
  '“La costanza è il mattone fondamentale del successo clinico e accademico.”',
  '“Un capitolo alla volta, un Pomodoro alla volta: la meta si avvicina.”',
  '“La mente focalizzata è il tuo strumento diagnostico più potente.”',
  '“Il successo non viene dai colpi di genio isolati, ma dalla disciplina quotidiana.”',
  '“Rilassati, respira e riparti: il recupero è parte integrante dello studio.”',
  '“Trasforma la complessità in schemi chiari. Tu domini la materia.”',
];

// --- MOTORE AUDIO POMODORO & AMBIENT LO-FI ---
const POMO_SOUNDS = [
  { id: 'bell', label: 'Campanella Zen' },
  { id: 'chime', label: 'Accordo Armonico' },
  { id: 'digital', label: 'Doppio Bip Digitale' },
  { id: 'marimba', label: 'Marimba Soft' },
  { id: 'gong', label: 'Gong Profondo' },
];

const ZEN_AMBIENT_TRACKS = [
  { id: 'lofi', label: 'Lo-Fi Chill' },
  { id: 'rain', label: 'Pioggia Soffice' },
  { id: 'brown', label: 'Rumore Marrone' },
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

class ZenAmbientEngine {
  constructor() {
    this.masterGain = null;
    this.lofiTimer = null;
    this.noiseSource = null;
    this.activeTrack = null;
    this.stepIdx = 0;
  }

  start(trackId, volume = 0.25) {
    const ctx = getUnlockedAudioContext();
    if (!ctx) return;
    this.stop();

    const master = ctx.createGain();
    const safeVol = Math.max(0.01, Math.min(0.6, Number(volume) || 0.25));
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.linearRampToValueAtTime(safeVol, ctx.currentTime + 1.2);
    master.connect(ctx.destination);

    this.masterGain = master;
    this.activeTrack = trackId;

    if (trackId === 'lofi') {
      this._startLofiLoop(ctx, master);
    } else if (trackId === 'rain') {
      this._startFilteredNoise(ctx, master, 'bandpass', 950, 0.7, 0.35);
    } else {
      this._startBrownNoise(ctx, master, 0.45);
    }
  }

  setVolume(volume) {
    if (!this.masterGain || !sharedAudioCtx) return;
    const safeVol = Math.max(0.0001, Math.min(0.6, Number(volume) || 0.0001));
    this.masterGain.gain.setTargetAtTime(
      safeVol,
      sharedAudioCtx.currentTime,
      0.15
    );
  }

  _startBrownNoise(ctx, destination, gainAmount) {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.8;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(340, ctx.currentTime);

    const g = ctx.createGain();
    g.gain.setValueAtTime(gainAmount, ctx.currentTime);

    noise.connect(filter);
    filter.connect(g);
    g.connect(destination);
    noise.start();
    this.noiseSource = noise;
  }

  _startFilteredNoise(ctx, destination, type, freq, q, gainAmount) {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, ctx.currentTime);
    filter.Q.setValueAtTime(q, ctx.currentTime);

    const g = ctx.createGain();
    g.gain.setValueAtTime(gainAmount, ctx.currentTime);

    noise.connect(filter);
    filter.connect(g);
    g.connect(destination);
    noise.start();
    this.noiseSource = noise;
  }

  _startLofiLoop(ctx, destination) {
    const chords = [
      [261.63, 329.63, 392.0, 493.88],
      [220.0, 261.63, 329.63, 392.0],
      [174.61, 220.0, 261.63, 349.23],
      [196.0, 246.94, 293.66, 329.63],
    ];
    const bassNotes = [130.81, 110.0, 87.31, 98.0];

    this._startBrownNoise(ctx, destination, 0.14);

    const triggerStep = () => {
      if (!this.masterGain || this.activeTrack !== 'lofi') return;
      const now = ctx.currentTime;
      const chordIdx = Math.floor(this.stepIdx / 2) % chords.length;
      const isChordHit = this.stepIdx % 2 === 0;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(780, now);
      filter.frequency.exponentialRampToValueAtTime(420, now + 1.7);
      filter.connect(destination);

      if (isChordHit) {
        chords[chordIdx].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
          const detune = (Math.random() - 0.5) * 6;
          osc.frequency.setValueAtTime(freq, now);
          osc.detune.setValueAtTime(detune, now);

          noteGain.gain.setValueAtTime(0.0001, now);
          noteGain.gain.linearRampToValueAtTime(0.065, now + 0.12);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);

          osc.connect(noteGain);
          noteGain.connect(filter);
          osc.start(now);
          osc.stop(now + 2.15);
        });

        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(bassNotes[chordIdx], now);
        bassGain.gain.setValueAtTime(0.0001, now);
        bassGain.gain.linearRampToValueAtTime(0.11, now + 0.08);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);
        bassOsc.connect(bassGain);
        bassGain.connect(destination);
        bassOsc.start(now);
        bassOsc.stop(now + 1.95);
      } else {
        const melodyPool = chords[chordIdx].map((f) => f * 2);
        const pick = melodyPool[(this.stepIdx + chordIdx) % melodyPool.length];
        const lead = ctx.createOscillator();
        const leadGain = ctx.createGain();
        lead.type = 'sine';
        lead.frequency.setValueAtTime(pick, now);
        leadGain.gain.setValueAtTime(0.0001, now);
        leadGain.gain.linearRampToValueAtTime(0.04, now + 0.08);
        leadGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
        lead.connect(leadGain);
        leadGain.connect(filter);
        lead.start(now);
        lead.stop(now + 1.4);
      }

      this.stepIdx += 1;
    };

    triggerStep();
    this.lofiTimer = setInterval(triggerStep, 1800);
  }

  stop() {
    this.activeTrack = null;
    if (this.lofiTimer) {
      clearInterval(this.lofiTimer);
      this.lofiTimer = null;
    }
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch (_) {}
      this.noiseSource = null;
    }
    if (this.masterGain && sharedAudioCtx) {
      try {
        const g = this.masterGain;
        g.gain.setTargetAtTime(0.0001, sharedAudioCtx.currentTime, 0.08);
        setTimeout(() => {
          try {
            g.disconnect();
          } catch (_) {}
        }, 250);
      } catch (_) {}
      this.masterGain = null;
    }
  }
}

const zenAmbientEngine = new ZenAmbientEngine();

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
    whatIfEnabled: false,
    whatIfPace: 20,
    logs: [],
    pomodoroSessions: [],
    srTopics: [],
  };
}

const STORAGE_KEY = 'studyburn_state_v2';
const LAYOUT_STORAGE_KEY = 'studyburn_layout_v1';
const THEME_STORAGE_KEY = 'studyburn_theme_v1';
const POMO_PREFS_STORAGE_KEY = 'studyburn_pomo_prefs_v1';
const POMO_TIMER_STATE_KEY = 'studyburn_pomo_timer_v1';
const CLOUD_CONFIG_STORAGE_KEY = 'studyburn_cloud_config_v1';
const CLOUD_SESSION_STORAGE_KEY = 'studyburn_cloud_session_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('tracker'); // 'tracker' | 'libretto' | 'tirocinio'

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
          return {
            ...parsed,
            exams: parsed.exams.map((ex) => ({
              ...ex,
              whatIfEnabled: Boolean(ex.whatIfEnabled),
              whatIfPace:
                ex.whatIfPace !== undefined && Number(ex.whatIfPace) > 0
                  ? Number(ex.whatIfPace)
                  : Number(ex.targetPace) > 0
                  ? Number(ex.targetPace)
                  : 20,
            })),
            medYears: normalizeMedYears(parsed.medYears),
            tirocini: parsed.tirocini
              ? normalizeTirocini(parsed.tirocini)
              : createDefaultTirocini(),
          };
        }
      }
    } catch (e) {
      console.error('Errore lettura localStorage:', e);
    }
    const initial = createDefaultExam('Biochimica Clinica');
    return {
      exams: [initial],
      activeExamId: initial.id,
      medYears: createDefaultMedYears(),
      tirocini: createDefaultTirocini(),
    };
  });

  // --- STATO PAGINA TIROCINI ---
  const [newTirocinioModuleName, setNewTirocinioModuleName] = useState('');
  const [editingTirocinioId, setEditingTirocinioId] = useState(null);
  const [editingTirocinioTitle, setEditingTirocinioTitle] = useState('');
  const [newRotationDrafts, setNewRotationDrafts] = useState({});
  const [expandedTirocini, setExpandedTirocini] = useState({
    tir_2: true,
    tir_3: true,
  });

  const tirociniList = useMemo(
    () =>
      state.tirocini
        ? normalizeTirocini(state.tirocini)
        : createDefaultTirocini(),
    [state.tirocini]
  );

  const toggleTirocinioExpanded = (tirId) => {
    setExpandedTirocini((prev) => ({
      ...prev,
      [tirId]: !prev[tirId],
    }));
  };

  const areAllTirociniExpanded = useMemo(() => {
    if (tirociniList.length === 0) return false;
    return tirociniList.every((t) => Boolean(expandedTirocini[t.id]));
  }, [tirociniList, expandedTirocini]);

  const handleToggleAllTirocini = () => {
    const nextState = !areAllTirociniExpanded;
    setExpandedTirocini((prev) => {
      const updated = { ...prev };
      tirociniList.forEach((t) => {
        updated[t.id] = nextState;
      });
      return updated;
    });
  };

  const updateTirocini = (updater, saveUndo = true) => {
    setState((prev) => {
      if (saveUndo) {
        setUndoStack((u) => [prev, ...u.slice(0, 9)]);
      }
      const current = prev.tirocini
        ? normalizeTirocini(prev.tirocini)
        : createDefaultTirocini();
      const next = typeof updater === 'function' ? updater(current) : updater;
      return {
        ...prev,
        tirocini: next,
      };
    });
  };

  const handleAddTirocinioModule = (e) => {
    e.preventDefault();
    const clean = newTirocinioModuleName.trim();
    if (!clean) return;
    const newId = `tir_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newMod = {
      id: newId,
      name: clean,
      verbalizzato: false,
      rotations: [],
    };
    updateTirocini((list) => [...list, newMod]);
    setExpandedTirocini((prev) => ({ ...prev, [newId]: true }));
    setNewTirocinioModuleName('');
  };

  const handleRenameTirocinioModule = (tirId) => {
    const clean = editingTirocinioTitle.trim();
    if (!clean) {
      setEditingTirocinioId(null);
      return;
    }
    updateTirocini((list) =>
      list.map((t) => (t.id === tirId ? { ...t, name: clean } : t))
    );
    setEditingTirocinioId(null);
  };

  const handleDeleteTirocinioModule = (tirId) => {
    updateTirocini((list) => list.filter((t) => t.id !== tirId));
  };

  const handleToggleTirocinioVerbalizzato = (tirId) => {
    updateTirocini((list) =>
      list.map((t) =>
        t.id === tirId ? { ...t, verbalizzato: !t.verbalizzato } : t
      )
    );
  };

  const handleAddRotation = (e, tirId) => {
    e.preventDefault();
    const draft = newRotationDrafts[tirId] || {
      icon: '🏥',
      name: '',
      durationDays: 5,
      startDate: '',
      endDate: '',
      status: 'not_started',
    };
    const cleanName = (draft.name || '').trim();
    if (!cleanName) return;

    const newRot = {
      id: `rot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      icon: draft.icon || '🏥',
      name: cleanName,
      durationDays: Math.max(1, Number(draft.durationDays) || 5),
      startDate: draft.startDate || '',
      endDate: draft.endDate || '',
      status: draft.status || 'not_started',
    };

    updateTirocini((list) =>
      list.map((t) =>
        t.id === tirId ? { ...t, rotations: [...t.rotations, newRot] } : t
      )
    );

    setNewRotationDrafts((prev) => ({
      ...prev,
      [tirId]: {
        icon: '🏥',
        name: '',
        durationDays: 5,
        startDate: '',
        endDate: '',
        status: 'not_started',
      },
    }));
  };

  const handleUpdateRotation = (tirId, rotId, patch) => {
    updateTirocini((list) =>
      list.map((t) => {
        if (t.id !== tirId) return t;
        return {
          ...t,
          rotations: t.rotations.map((r) =>
            r.id === rotId ? { ...r, ...patch } : r
          ),
        };
      })
    );
  };

  const handleDeleteRotation = (tirId, rotId) => {
    updateTirocini((list) =>
      list.map((t) =>
        t.id === tirId
          ? { ...t, rotations: t.rotations.filter((r) => r.id !== rotId) }
          : t
      )
    );
  };

  const tirociniStats = useMemo(() => {
    let totalRotations = 0;
    let doneRotations = 0;
    let inProgressRotations = 0;
    let totalDays = 0;
    let doneDays = 0;

    tirociniList.forEach((mod) => {
      (mod.rotations || []).forEach((r) => {
        const d = Math.max(0, Number(r.durationDays) || 0);
        totalRotations += 1;
        totalDays += d;
        if (r.status === 'done') {
          doneRotations += 1;
          doneDays += d;
        } else if (r.status === 'in_progress') {
          inProgressRotations += 1;
        }
      });
    });

    const pct =
      totalDays > 0 ? Math.min(100, (doneDays / totalDays) * 100) : 0;

    return {
      totalRotations,
      doneRotations,
      inProgressRotations,
      totalDays,
      doneDays,
      remainingDays: Math.max(0, totalDays - doneDays),
      pct,
    };
  }, [tirociniList]);

  // --- STATO PAGINA VOTI BLOCCHI (1° - 6° ANNO MEDICINA) ---
  const [selectedMedYear, setSelectedMedYear] = useState(1);
  const [newBlockName, setNewBlockName] = useState('');
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [editingBlockTitle, setEditingBlockTitle] = useState('');
  const [newSubjectDrafts, setNewSubjectDrafts] = useState({});
  const [expandedBlocks, setExpandedBlocks] = useState({});

  const [isBlockReorderMode, setIsBlockReorderMode] = useState(false);
  const [blockDragReadyId, setBlockDragReadyId] = useState(null);
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dragOverBlockIdx, setDragOverBlockIdx] = useState(null);

  const medYears = useMemo(
    () => normalizeMedYears(state.medYears),
    [state.medYears]
  );

  const toggleBlockExpanded = (blockId) => {
    setExpandedBlocks((prev) => ({
      ...prev,
      [blockId]: !prev[blockId],
    }));
  };

  const currentYearBlocks = useMemo(
    () => medYears[selectedMedYear] || [],
    [medYears, selectedMedYear]
  );

  const areAllCurrentBlocksExpanded = useMemo(() => {
    if (currentYearBlocks.length === 0) return false;
    return currentYearBlocks.every((b) => Boolean(expandedBlocks[b.id]));
  }, [currentYearBlocks, expandedBlocks]);

  const handleToggleAllCurrentBlocks = () => {
    const nextState = !areAllCurrentBlocksExpanded;
    setExpandedBlocks((prev) => {
      const updated = { ...prev };
      currentYearBlocks.forEach((b) => {
        updated[b.id] = nextState;
      });
      return updated;
    });
  };

  const updateMedYears = (updater, saveUndo = true) => {
    setState((prev) => {
      if (saveUndo) {
        setUndoStack((u) => [prev, ...u.slice(0, 9)]);
      }
      const currentYears = normalizeMedYears(prev.medYears);
      const nextYears =
        typeof updater === 'function' ? updater(currentYears) : updater;
      return {
        ...prev,
        medYears: nextYears,
      };
    });
  };

  const moveBlockUp = (index) => {
    if (index <= 0) return;
    updateMedYears((yrs) => {
      const list = [...(yrs[selectedMedYear] || [])];
      [list[index - 1], list[index]] = [list[index], list[index - 1]];
      return { ...yrs, [selectedMedYear]: list };
    });
  };

  const moveBlockDown = (index) => {
    if (index >= currentYearBlocks.length - 1) return;
    updateMedYears((yrs) => {
      const list = [...(yrs[selectedMedYear] || [])];
      [list[index], list[index + 1]] = [list[index + 1], list[index]];
      return { ...yrs, [selectedMedYear]: list };
    });
  };

  const handleDropMedBlock = (targetIndex) => {
    if (!draggedBlockId) return;
    updateMedYears((yrs) => {
      const list = [...(yrs[selectedMedYear] || [])];
      const sourceIndex = list.findIndex((b) => b.id === draggedBlockId);
      if (sourceIndex === -1 || sourceIndex === targetIndex) return yrs;
      const [moved] = list.splice(sourceIndex, 1);
      const safeIdx = Math.max(0, Math.min(list.length, targetIndex));
      list.splice(safeIdx, 0, moved);
      return { ...yrs, [selectedMedYear]: list };
    });
    setDraggedBlockId(null);
    setDragOverBlockIdx(null);
    setBlockDragReadyId(null);
  };

  const handleAddMedBlock = (e) => {
    e.preventDefault();
    const cleanName = newBlockName.trim();
    if (!cleanName) return;
    const newId = `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newBlock = {
      id: newId,
      name: cleanName,
      subjects: [],
    };
    updateMedYears((yrs) => ({
      ...yrs,
      [selectedMedYear]: [...yrs[selectedMedYear], newBlock],
    }));
    setExpandedBlocks((prev) => ({ ...prev, [newId]: true }));
    setNewBlockName('');
  };

  const handleRenameMedBlock = (yearNum, blockId) => {
    const clean = editingBlockTitle.trim();
    if (!clean) {
      setEditingBlockId(null);
      return;
    }
    updateMedYears((yrs) => ({
      ...yrs,
      [yearNum]: yrs[yearNum].map((b) =>
        b.id === blockId ? { ...b, name: clean } : b
      ),
    }));
    setEditingBlockId(null);
  };

  const handleDeleteMedBlock = (yearNum, blockId) => {
    updateMedYears((yrs) => ({
      ...yrs,
      [yearNum]: yrs[yearNum].filter((b) => b.id !== blockId),
    }));
  };

  const handleAddMedSubject = (e, yearNum, blockId) => {
    e.preventDefault();
    const draft = newSubjectDrafts[blockId] || {
      name: '',
      cfu: '6',
      grade: '',
    };
    const cleanName = (draft.name || '').trim();
    const cfuVal = Math.max(0.5, Number(draft.cfu) || 0);
    if (!cleanName || cfuVal <= 0) return;

    let gradeVal = null;
    let lodeVal = false;
    if (draft.grade === '30L') {
      gradeVal = 30;
      lodeVal = true;
    } else if (draft.grade !== '' && draft.grade !== null) {
      const parsedGrade = Number(draft.grade);
      if (parsedGrade >= 18 && parsedGrade <= 30) {
        gradeVal = parsedGrade;
      }
    }

    const newSub = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      cfu: cfuVal,
      grade: gradeVal,
      lode: lodeVal,
    };

    updateMedYears((yrs) => ({
      ...yrs,
      [yearNum]: yrs[yearNum].map((b) =>
        b.id === blockId ? { ...b, subjects: [...b.subjects, newSub] } : b
      ),
    }));

    setNewSubjectDrafts((prev) => ({
      ...prev,
      [blockId]: { name: '', cfu: '6', grade: '' },
    }));
  };

  const handleUpdateMedSubject = (yearNum, blockId, subjectId, patch) => {
    updateMedYears((yrs) => ({
      ...yrs,
      [yearNum]: yrs[yearNum].map((b) => {
        if (b.id !== blockId) return b;
        return {
          ...b,
          subjects: b.subjects.map((s) =>
            s.id === subjectId ? { ...s, ...patch } : s
          ),
        };
      }),
    }));
  };

  const handleDeleteMedSubject = (yearNum, blockId, subjectId) => {
    updateMedYears((yrs) => ({
      ...yrs,
      [yearNum]: yrs[yearNum].map((b) =>
        b.id === blockId
          ? { ...b, subjects: b.subjects.filter((s) => s.id !== subjectId) }
          : b
      ),
    }));
  };

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
    if (index >= layout[col].length - 1) return;
    setLayout((prev) => {
      const list = [...prev[col]];
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

  // --- STATO TIMER POMODORO (PERSISTENTE LOCALE + CLOUD) ---
  const initialPomoPrefs = useMemo(() => {
    try {
      const saved = localStorage.getItem(POMO_PREFS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Errore lettura preferenze Pomodoro:', e);
    }
    return {};
  }, []);

  const initialTimerSnapshot = useMemo(() => {
    const defaultStudy = initialPomoPrefs.studyMin || 25;
    try {
      const raw = localStorage.getItem(POMO_TIMER_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const phase = ['study', 'short_break', 'long_break'].includes(
            parsed.phase
          )
            ? parsed.phase
            : 'study';
          const cycleCount = Math.max(
            0,
            Math.min(4, Number(parsed.cycleCount) || 0)
          );
          const running = Boolean(parsed.running);
          const endAt = parsed.endAt ? Number(parsed.endAt) : null;
          let secondsLeft =
            parsed.secondsLeft !== undefined
              ? Math.max(0, Number(parsed.secondsLeft))
              : defaultStudy * 60;

          if (running && endAt) {
            secondsLeft = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
          }

          return {
            phase,
            cycleCount,
            running: running && secondsLeft > 0,
            secondsLeft: secondsLeft > 0 ? secondsLeft : defaultStudy * 60,
            endAt: running && secondsLeft > 0 ? endAt : null,
            activeSessionExamId: parsed.activeSessionExamId || null,
            updatedAt: parsed.updatedAt || 0,
          };
        }
      }
    } catch (e) {
      console.error('Errore lettura stato timer Pomodoro:', e);
    }
    return {
      phase: 'study',
      cycleCount: 0,
      running: false,
      secondsLeft: defaultStudy * 60,
      endAt: null,
      activeSessionExamId: null,
      updatedAt: 0,
    };
  }, [initialPomoPrefs.studyMin]);

  const [pomoStudyMin, setPomoStudyMin] = useState(
    initialPomoPrefs.studyMin || 25
  );
  const [pomoShortBreakMin, setPomoShortBreakMin] = useState(
    initialPomoPrefs.shortBreakMin || 5
  );
  const [pomoLongBreakMin, setPomoLongBreakMin] = useState(
    initialPomoPrefs.longBreakMin || 15
  );
  const [pomoPhase, setPomoPhase] = useState(initialTimerSnapshot.phase);
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState(
    initialTimerSnapshot.secondsLeft
  );
  const [pomoEndAt, setPomoEndAt] = useState(initialTimerSnapshot.endAt);
  const [pomoRunning, setPomoRunning] = useState(initialTimerSnapshot.running);
  const [pomoCycleCount, setPomoCycleCount] = useState(
    initialTimerSnapshot.cycleCount
  );
  const [pomoSessionExamId, setPomoSessionExamId] = useState(
    initialTimerSnapshot.activeSessionExamId
  );
  const [pomoTimerUpdatedAt, setPomoTimerUpdatedAt] = useState(
    initialTimerSnapshot.updatedAt
  );
  const [isPomoFullscreen, setIsPomoFullscreen] = useState(false);
  const [zenGoal, setZenGoal] = useState('');

  // Stato audio ambientale Lo-Fi / Zen (spento di default)
  const [zenAmbientEnabled, setZenAmbientEnabled] = useState(false);
  const [zenAmbientTrack, setZenAmbientTrack] = useState(
    initialPomoPrefs.zenAmbientTrack || 'lofi'
  );
  const [zenAmbientVolume, setZenAmbientVolume] = useState(
    initialPomoPrefs.zenAmbientVolume !== undefined
      ? Number(initialPomoPrefs.zenAmbientVolume)
      : 0.25
  );
  const [zenAmbientOnlyStudy, setZenAmbientOnlyStudy] = useState(
    initialPomoPrefs.zenAmbientOnlyStudy !== undefined
      ? Boolean(initialPomoPrefs.zenAmbientOnlyStudy)
      : true
  );

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
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Gestione audio ambientale nella Sezione Zen
  useEffect(() => {
    const shouldPlayAmbient =
      isPomoFullscreen &&
      zenAmbientEnabled &&
      (!zenAmbientOnlyStudy || pomoPhase === 'study');

    if (shouldPlayAmbient) {
      zenAmbientEngine.start(zenAmbientTrack, zenAmbientVolume);
    } else {
      zenAmbientEngine.stop();
    }
  }, [
    isPomoFullscreen,
    zenAmbientEnabled,
    zenAmbientOnlyStudy,
    zenAmbientTrack,
    zenAmbientVolume,
    pomoPhase,
  ]);

  useEffect(() => {
    return () => {
      zenAmbientEngine.stop();
    };
  }, []);

  // Salva stato timer in localStorage ogni volta che cambia
  useEffect(() => {
    try {
      localStorage.setItem(
        POMO_TIMER_STATE_KEY,
        JSON.stringify({
          phase: pomoPhase,
          cycleCount: pomoCycleCount,
          running: pomoRunning,
          secondsLeft: pomoSecondsLeft,
          endAt: pomoRunning ? pomoEndAt : null,
          activeSessionExamId: pomoSessionExamId,
          updatedAt: pomoTimerUpdatedAt || Date.now(),
        })
      );
    } catch (e) {
      console.error('Errore salvataggio stato timer Pomodoro:', e);
    }
  }, [
    pomoPhase,
    pomoCycleCount,
    pomoRunning,
    pomoSecondsLeft,
    pomoEndAt,
    pomoSessionExamId,
    pomoTimerUpdatedAt,
  ]);

  const enterZenFullscreen = useCallback(async () => {
    setIsPomoFullscreen(true);
    try {
      if (
        document.documentElement.requestFullscreen &&
        !document.fullscreenElement
      ) {
        await document.documentElement.requestFullscreen();
      }
    } catch (_) {}
  }, []);

  const exitZenFullscreen = useCallback(async () => {
    zenAmbientEngine.stop();
    setZenAmbientEnabled(false);
    setIsPomoFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!isPomoFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        exitZenFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isPomoFullscreen, exitZenFullscreen]);

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
          zenAmbientTrack,
          zenAmbientVolume,
          zenAmbientOnlyStudy,
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
    zenAmbientTrack,
    zenAmbientVolume,
    zenAmbientOnlyStudy,
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
      setState((prev) => ({
        ...payload.state,
        exams: payload.state.exams.map((ex) => ({
          ...ex,
          whatIfEnabled: Boolean(ex.whatIfEnabled),
          whatIfPace:
            ex.whatIfPace !== undefined && Number(ex.whatIfPace) > 0
              ? Number(ex.whatIfPace)
              : Number(ex.targetPace) > 0
              ? Number(ex.targetPace)
              : 20,
        })),
        medYears: payload.state.medYears
          ? normalizeMedYears(payload.state.medYears)
          : normalizeMedYears(prev.medYears),
        tirocini: payload.state.tirocini
          ? normalizeTirocini(payload.state.tirocini)
          : prev.tirocini
          ? normalizeTirocini(prev.tirocini)
          : createDefaultTirocini(),
      }));
    }
    if (payload.layout) {
      setLayout(sanitizeLayout(payload.layout));
    }
    if (payload.pomoPrefs) {
      if (payload.pomoPrefs.studyMin) {
        setPomoStudyMin(payload.pomoPrefs.studyMin);
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
      if (payload.pomoPrefs.zenAmbientTrack) {
        setZenAmbientTrack(payload.pomoPrefs.zenAmbientTrack);
      }
      if (payload.pomoPrefs.zenAmbientVolume !== undefined) {
        setZenAmbientVolume(Number(payload.pomoPrefs.zenAmbientVolume));
      }
      if (payload.pomoPrefs.zenAmbientOnlyStudy !== undefined) {
        setZenAmbientOnlyStudy(Boolean(payload.pomoPrefs.zenAmbientOnlyStudy));
      }
    }

    if (payload.pomoTimerState && typeof payload.pomoTimerState === 'object') {
      const ts = payload.pomoTimerState;
      const remoteUpdatedAt = Number(ts.updatedAt || 0);
      setPomoTimerUpdatedAt((localUpdatedAt) => {
        if (remoteUpdatedAt >= localUpdatedAt) {
          const phase = ['study', 'short_break', 'long_break'].includes(ts.phase)
            ? ts.phase
            : 'study';
          const cycle = Math.max(0, Math.min(4, Number(ts.cycleCount) || 0));
          const isRun = Boolean(ts.running);
          const remoteEndAt = ts.endAt ? Number(ts.endAt) : null;
          const fallbackStudy = payload.pomoPrefs?.studyMin || 25;

          let calcLeft =
            ts.secondsLeft !== undefined
              ? Math.max(0, Number(ts.secondsLeft))
              : fallbackStudy * 60;

          if (isRun && remoteEndAt) {
            calcLeft = Math.max(
              0,
              Math.ceil((remoteEndAt - Date.now()) / 1000)
            );
          }

          setPomoPhase(phase);
          setPomoCycleCount(cycle);
          setPomoSessionExamId(ts.activeSessionExamId || null);

          if (isRun && remoteEndAt && calcLeft > 0) {
            setPomoEndAt(remoteEndAt);
            setPomoSecondsLeft(calcLeft);
            setPomoRunning(true);
          } else {
            setPomoEndAt(null);
            setPomoSecondsLeft(calcLeft > 0 ? calcLeft : fallbackStudy * 60);
            setPomoRunning(false);
          }
          return remoteUpdatedAt;
        }
        return localUpdatedAt;
      });
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
          zenAmbientTrack,
          zenAmbientVolume,
          zenAmbientOnlyStudy,
        },
        pomoTimerState: {
          phase: pomoPhase,
          cycleCount: pomoCycleCount,
          running: pomoRunning,
          secondsLeft: pomoSecondsLeft,
          endAt: pomoRunning ? pomoEndAt : null,
          activeSessionExamId: pomoSessionExamId,
          updatedAt: pomoTimerUpdatedAt || Date.now(),
        },
      };

      const doUpsert = async (token) =>
        fetch(`${cloudUrl}/rest/v1/studyburn_profiles?on_conflict=user_id`, {
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
        });

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
      zenAmbientTrack,
      zenAmbientVolume,
      zenAmbientOnlyStudy,
      pomoPhase,
      pomoCycleCount,
      pomoRunning,
      pomoSecondsLeft,
      pomoEndAt,
      pomoSessionExamId,
      pomoTimerUpdatedAt,
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
          if (askOnLocalConflict) {
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
    pomoRunning,
    pomoPhase,
    pomoCycleCount,
    pomoTimerUpdatedAt,
    cloudUrl,
    cloudAnonKey,
    cloudSession,
    pushToCloud,
  ]);

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
        zenAmbientTrack,
        zenAmbientVolume,
        zenAmbientOnlyStudy,
      },
      pomoTimerState: {
        phase: pomoPhase,
        cycleCount: pomoCycleCount,
        running: pomoRunning,
        secondsLeft: pomoSecondsLeft,
        endAt: pomoRunning ? pomoEndAt : null,
        activeSessionExamId: pomoSessionExamId,
        updatedAt: pomoTimerUpdatedAt || Date.now(),
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

  const updateActiveExam = (updater, saveUndo = false, targetExamId = null) => {
    setState((prev) => {
      if (saveUndo) {
        setUndoStack((u) => [prev, ...u.slice(0, 9)]);
      }
      const idToUpdate = targetExamId || prev.activeExamId || prev.exams[0]?.id;
      return {
        ...prev,
        exams: prev.exams.map((ex) =>
          ex.id === idToUpdate
            ? typeof updater === 'function'
              ? updater(ex)
              : { ...ex, ...updater }
            : ex
        ),
      };
    });
  };

  // --- LOGICA TIMER POMODORO (BASATA SU ENDAT PER PERSISTENZA) ---
  const getPhaseMinutes = useCallback(
    (phase) => {
      if (phase === 'study') return Math.max(1, Number(pomoStudyMin) || 25);
      if (phase === 'short_break')
        return Math.max(1, Number(pomoShortBreakMin) || 5);
      return Math.max(1, Number(pomoLongBreakMin) || 15);
    },
    [pomoStudyMin, pomoShortBreakMin, pomoLongBreakMin]
  );

  const handlePhaseCompleted = useCallback(() => {
    if (pomoSoundRef.current) {
      playPomodoroSound(pomoSoundTypeRef.current, pomoPhase);
    }

    const shouldAutoContinue = pomoAutoContinueRef.current;
    const nowTs = Date.now();

    if (pomoPhase === 'study') {
      const completedDuration = getPhaseMinutes('study');
      const targetExamId = pomoSessionExamId || activeExam?.id;
      const newSession = {
        id: `pomo_${nowTs}_${Math.random().toString(36).slice(2, 5)}`,
        date: getTodayStr(),
        time: getCurrentTimeStr(),
        durationMin: completedDuration,
      };
      updateActiveExam(
        (ex) => ({
          ...ex,
          pomodoroSessions: [newSession, ...(ex.pomodoroSessions || [])],
        }),
        false,
        targetExamId
      );

      const nextCycle = pomoCycleCount + 1;
      if (nextCycle >= 4) {
        const nextSecs = getPhaseMinutes('long_break') * 60;
        setPomoCycleCount(4);
        setPomoPhase('long_break');
        setPomoSecondsLeft(nextSecs);
        setPomoEndAt(shouldAutoContinue ? nowTs + nextSecs * 1000 : null);
        setPomoRunning(shouldAutoContinue);
      } else {
        const nextSecs = getPhaseMinutes('short_break') * 60;
        setPomoCycleCount(nextCycle);
        setPomoPhase('short_break');
        setPomoSecondsLeft(nextSecs);
        setPomoEndAt(shouldAutoContinue ? nowTs + nextSecs * 1000 : null);
        setPomoRunning(shouldAutoContinue);
      }
      setPomoTimerUpdatedAt(nowTs);
      setCurrentQuoteIndex((prev) => (prev + 1) % POMO_QUOTES.length);
    } else {
      const nextCycle =
        pomoPhase === 'long_break' || pomoCycleCount >= 4 ? 0 : pomoCycleCount;
      const nextSecs = getPhaseMinutes('study') * 60;
      setPomoCycleCount(nextCycle);
      setPomoPhase('study');
      setPomoSecondsLeft(nextSecs);
      setPomoEndAt(shouldAutoContinue ? nowTs + nextSecs * 1000 : null);
      setPomoRunning(shouldAutoContinue);
      setPomoTimerUpdatedAt(nowTs);
      setCurrentQuoteIndex((prev) => (prev + 1) % POMO_QUOTES.length);
    }
  }, [
    pomoPhase,
    pomoCycleCount,
    pomoSessionExamId,
    activeExam?.id,
    getPhaseMinutes,
  ]);

  useEffect(() => {
    if (!pomoRunning) {
      document.title = 'StudyBurn';
      return;
    }

    const effectiveEndAt = pomoEndAt || Date.now() + pomoSecondsLeft * 1000;
    if (!pomoEndAt) {
      setPomoEndAt(effectiveEndAt);
    }

    let handled = false;
    const phaseLabel =
      pomoPhase === 'study'
        ? 'Studio'
        : pomoPhase === 'short_break'
        ? 'Pausa'
        : 'Pausa Lunga';

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((effectiveEndAt - Date.now()) / 1000)
      );
      setPomoSecondsLeft(remaining);

      const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
      const ss = String(remaining % 60).padStart(2, '0');
      document.title = `${mm}:${ss} ${phaseLabel} — StudyBurn`;

      if (remaining === 0 && !handled) {
        handled = true;
        handlePhaseCompleted();
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [pomoRunning, pomoEndAt, pomoSecondsLeft, pomoPhase, handlePhaseCompleted]);

  const handleTogglePomoRunning = () => {
    getUnlockedAudioContext();
    const nowTs = Date.now();
    if (pomoRunning) {
      const exactRemaining = pomoEndAt
        ? Math.max(0, Math.ceil((pomoEndAt - nowTs) / 1000))
        : pomoSecondsLeft;
      setPomoRunning(false);
      setPomoEndAt(null);
      setPomoSecondsLeft(exactRemaining);
      setPomoTimerUpdatedAt(nowTs);
    } else {
      const baseSecs =
        pomoSecondsLeft > 0 ? pomoSecondsLeft : getPhaseMinutes(pomoPhase) * 60;
      const newEndAt = nowTs + baseSecs * 1000;
      setPomoSecondsLeft(baseSecs);
      setPomoEndAt(newEndAt);
      if (pomoPhase === 'study') {
        setPomoSessionExamId(activeExam?.id || null);
      }
      setPomoRunning(true);
      setPomoTimerUpdatedAt(nowTs);
    }
  };

  const handlePomoSwitchPhase = (targetPhase) => {
    const nowTs = Date.now();
    setPomoRunning(false);
    setPomoEndAt(null);
    if (targetPhase === 'study' && pomoCycleCount >= 4) {
      setPomoCycleCount(0);
    }
    setPomoPhase(targetPhase);
    setPomoSecondsLeft(getPhaseMinutes(targetPhase) * 60);
    setPomoTimerUpdatedAt(nowTs);
    setCurrentQuoteIndex((prev) => (prev + 1) % POMO_QUOTES.length);
  };

  const handlePomoSkipPhase = () => {
    const nowTs = Date.now();
    setPomoRunning(false);
    setPomoEndAt(null);
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
    setPomoTimerUpdatedAt(nowTs);
    setCurrentQuoteIndex((prev) => (prev + 1) % POMO_QUOTES.length);
  };

  const handlePomoReset = () => {
    const nowTs = Date.now();
    setPomoRunning(false);
    setPomoEndAt(null);
    setPomoSecondsLeft(getPhaseMinutes(pomoPhase) * 60);
    setPomoTimerUpdatedAt(nowTs);
  };

  const handlePomoPreset = (studyMins, shortBreakMins, longBreakMins) => {
    const nowTs = Date.now();
    setPomoRunning(false);
    setPomoEndAt(null);
    setPomoStudyMin(studyMins);
    setPomoShortBreakMin(shortBreakMins);
    setPomoLongBreakMin(longBreakMins);
    setPomoPhase('study');
    setPomoSecondsLeft(studyMins * 60);
    setPomoTimerUpdatedAt(nowTs);
  };

  const handleAddManualPomoSession = () => {
    const duration = getPhaseMinutes('study');
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
    setPomoTimerUpdatedAt(Date.now());
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
      ...prev,
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
      ...prev,
      exams: [...prev.exams, copy],
      activeExamId: copy.id,
    }));
    setIsRenamingHeader(true);
  };

  const handleDeleteExam = () => {
    if (state.exams.length <= 1) return;
    setUndoStack((u) => [state, ...u.slice(0, 9)]);
    setState((prev) => {
      const remaining = prev.exams.filter((ex) => ex.id !== activeExam.id);
      return {
        ...prev,
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
      whatIf: null,
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
        whatIf: null,
        isRest,
        isReview,
      });
    });

    const projectionStartDate =
      futureStart > realCutoffDate ? futureStart : realCutoffDate;
    const realStartVal = Math.max(0, totalPages - cumRealPages);
    let estimatedFinishDate = null;

    if (remainingPages === 0) {
      estimatedFinishDate = lastLogDate || today;
    } else if (realDailyAvg > 0) {
      let projRem = remainingPages;
      let projCursor = addDays(projectionStartDate, -1);
      let projSteps = 0;

      for (let i = 0; i < chartData.length; i++) {
        const pt = chartData[i];
        if (pt.rawDate >= projectionStartDate) {
          const isRest = restDays.includes(
            parseLocalDate(pt.rawDate).getDay()
          );
          if (!isRest && projRem > 0) {
            projRem = Math.max(0, Number((projRem - realDailyAvg).toFixed(2)));
            if (projRem <= 0.01 && !estimatedFinishDate) {
              projRem = 0;
              estimatedFinishDate = pt.rawDate;
            }
          }
          pt.proiezione = Number(projRem.toFixed(1));
        }
      }

      if (!estimatedFinishDate && projRem > 0) {
        const lastChartDate =
          chartData[chartData.length - 1]?.rawDate ||
          addDays(projectionStartDate, -1);
        projCursor =
          lastChartDate >= projectionStartDate
            ? lastChartDate
            : addDays(projectionStartDate, -1);
        while (projRem > 0.01 && projSteps < 365) {
          projCursor = addDays(projCursor, 1);
          const isRest = restDays.includes(parseLocalDate(projCursor).getDay());
          if (!isRest) {
            projRem = Math.max(0, projRem - realDailyAvg);
            if (projRem <= 0.01) {
              estimatedFinishDate = projCursor;
              break;
            }
          }
          projSteps++;
        }
      }
    }

    // --- CALCOLO PROIEZIONE WHAT-IF ---
    const whatIfEnabled = Boolean(activeExam.whatIfEnabled);
    const whatIfPace = Math.max(0.5, Number(activeExam.whatIfPace) || 20);
    let whatIfFinishDate = null;
    let whatIfDeltaDaysVsDeadline = null;
    let whatIfVerdict = 'neutral';

    if (whatIfEnabled) {
      if (remainingPages === 0) {
        whatIfFinishDate = lastLogDate || today;
        whatIfDeltaDaysVsDeadline = diffDays(whatIfFinishDate, studyDeadline);
        whatIfVerdict = 'on_time';
      } else {
        let wiRem = remainingPages;
        for (let i = 0; i < chartData.length; i++) {
          const pt = chartData[i];
          if (pt.rawDate === realCutoffDate) {
            pt.whatIf = Number(realStartVal.toFixed(1));
          } else if (pt.rawDate >= projectionStartDate) {
            const isRest = restDays.includes(
              parseLocalDate(pt.rawDate).getDay()
            );
            if (!isRest && wiRem > 0) {
              wiRem = Math.max(0, Number((wiRem - whatIfPace).toFixed(2)));
              if (wiRem <= 0.01 && !whatIfFinishDate) {
                wiRem = 0;
                whatIfFinishDate = pt.rawDate;
              }
            }
            pt.whatIf = Number(wiRem.toFixed(1));
          }
        }

        if (!whatIfFinishDate && wiRem > 0) {
          const lastChartDate =
            chartData[chartData.length - 1]?.rawDate ||
            addDays(projectionStartDate, -1);
          let wiCursor =
            lastChartDate >= projectionStartDate
              ? lastChartDate
              : addDays(projectionStartDate, -1);
          let wiSteps = 0;
          while (wiRem > 0.01 && wiSteps < 365) {
            wiCursor = addDays(wiCursor, 1);
            const isRest = restDays.includes(parseLocalDate(wiCursor).getDay());
            if (!isRest) {
              wiRem = Math.max(0, wiRem - whatIfPace);
              if (wiRem <= 0.01) {
                whatIfFinishDate = wiCursor;
                break;
              }
            }
            wiSteps++;
          }
        }

        if (whatIfFinishDate) {
          whatIfDeltaDaysVsDeadline = diffDays(whatIfFinishDate, studyDeadline);
          if (whatIfFinishDate <= studyDeadline) {
            whatIfVerdict = 'on_time';
          } else if (whatIfFinishDate <= examDate) {
            whatIfVerdict = 'tight';
          } else {
            whatIfVerdict = 'late';
          }
        } else {
          whatIfVerdict = 'late';
        }
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

    const paceGap = newRequiredPace - realDailyAvg;
    const isBehindRequiredPace =
      realDailyAvg > 0 &&
      estimatedFinishDate &&
      estimatedFinishDate > studyDeadline &&
      paceGap > 0.05;

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
      isBehindRequiredPace ||
      (remainingUsefulDays === 0 && remainingPages > 0)
    ) {
      status = 'red';
      statusTitle = 'RITARDO CRITICO';

      if (remainingUsefulDays === 0 && remainingPages > 0) {
        statusHeadline = `Restano ${remainingPages} pagine e non hai più giorni utili prima della scadenza studio.`;
        statusDetail = `Completa le ${remainingPages} pagine rimanenti entro il ${formatShortDate(
          studyDeadline
        )} oppure riduci i giorni di ripasso finale.`;
      } else if (paceGap > 0.05) {
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
        statusDetail = `${finishInfo} Accelera di +${paceGap.toFixed(
          1
        )} pag/giorno nei prossimi ${remainingUsefulDays} giorni utili.`;
      } else {
        statusHeadline = `Sei indietro di ${Math.round(
          delayPages
        )} pagine (${delayPct.toFixed(1)}% del programma).`;
        statusDetail = `Ti servono ${newRequiredPace.toFixed(
          1
        )} pag/giorno nei prossimi ${remainingUsefulDays} giorni utili (ritmo attuale: ${realDailyAvg.toFixed(
          1
        )} pag/gg) per completare il programma entro il ${formatShortDate(
          studyDeadline
        )}.`;
      }
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
      whatIfEnabled,
      whatIfPace,
      whatIfFinishDate,
      whatIfDeltaDaysVsDeadline,
      whatIfVerdict,
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
        ? 'bg-emerald-950/55 border-emerald-800/80 text-emerald-100'
        : 'bg-emerald-50 border-emerald-200 text-emerald-950',
      headlineColor: isDark ? 'text-emerald-50' : 'text-emerald-950',
      detailColor: isDark ? 'text-emerald-200' : 'text-emerald-900',
      badge: isDark
        ? 'bg-emerald-900/80 text-emerald-200 border-emerald-700/80'
        : 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
      lineColor: '#10b981',
      Icon: CheckCircle2,
    },
    yellow: {
      wrapper: isDark
        ? 'bg-amber-950/55 border-amber-800/80 text-amber-100'
        : 'bg-amber-50 border-amber-200 text-amber-950',
      headlineColor: isDark ? 'text-amber-50' : 'text-amber-950',
      detailColor: isDark ? 'text-amber-200' : 'text-amber-900',
      badge: isDark
        ? 'bg-amber-900/80 text-amber-200 border-amber-700/80'
        : 'bg-amber-100 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-500 text-white',
      lineColor: '#f59e0b',
      Icon: AlertTriangle,
    },
    red: {
      wrapper: isDark
        ? 'bg-rose-950/55 border-rose-800/80 text-rose-100'
        : 'bg-rose-50 border-rose-200 text-rose-950',
      headlineColor: isDark ? 'text-rose-50' : 'text-rose-950',
      detailColor: isDark ? 'text-rose-200' : 'text-rose-900',
      badge: isDark
        ? 'bg-rose-900/80 text-rose-200 border-rose-700/80'
        : 'bg-rose-100 text-rose-700 border-rose-200',
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
  const indigoPillClass = isDark
    ? 'bg-indigo-950/75 text-indigo-300 border border-indigo-800/70'
    : 'bg-indigo-50 text-indigo-700 border border-indigo-200';

  const chartGridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const chartTickFill = isDark ? '#94a3b8' : '#64748b';
  const chartAxisStroke = isDark ? '#334155' : '#cbd5e1';

  // Anello radiale SVG per la vista Zen
  const zenRingRadius = 62;
  const zenRingCircumference = 2 * Math.PI * zenRingRadius;
  const zenRingDashOffset =
    zenRingCircumference *
    (1 - Math.min(1, Math.max(0, pomoStats.progressPct / 100)));

  const renderOrderControls = (sectionId, col, index, totalInCol) => {
    const orderBtnClass = `p-1.5 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer ${
      isDark
        ? 'hover:bg-slate-700/80 hover:text-slate-100'
        : 'hover:bg-white hover:text-slate-900 hover:shadow-2xs'
    }`;

    return (
      <div
        role="group"
        aria-label="Controlli posizione sezione"
        className={`inline-flex items-center gap-0.5 rounded-xl p-1 border transition-colors shrink-0 ${
          isReorderMode
            ? isDark
              ? 'bg-indigo-950/80 border-indigo-700/90 text-indigo-300 shadow-xs'
              : 'bg-indigo-50/90 border-indigo-200 text-indigo-700 shadow-xs'
            : isDark
            ? 'bg-slate-800/80 border-slate-700/80 text-slate-400'
            : 'bg-slate-100/80 border-slate-200/80 text-slate-500'
        }`}
      >
        <button
          type="button"
          onClick={() => moveSectionUp(col, index)}
          disabled={index === 0}
          className={orderBtnClass}
          title="Sposta sezione in alto"
          aria-label="Sposta sezione in alto"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => moveSectionDown(col, index)}
          disabled={index === totalInCol - 1}
          className={orderBtnClass}
          title="Sposta sezione in basso"
          aria-label="Sposta sezione in basso"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => moveSectionAcross(col, index)}
          className={orderBtnClass}
          title={
            col === 'left'
              ? 'Sposta nella colonna laterale'
              : 'Sposta nella colonna principale'
          }
          aria-label={
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
          onMouseLeave={() => setDragReadyId(null)}
          className={`p-1.5 rounded-lg cursor-grab active:cursor-grabbing transition ${
            isDark
              ? 'hover:bg-slate-700/80 hover:text-slate-100'
              : 'hover:bg-white hover:text-slate-900'
          }`}
          title="Trascina per riordinare"
          aria-hidden="true"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>
      </div>
    );
  };

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
      const quickWhatIfPresets = Array.from(
        new Set(
          [
            Math.max(1, Math.round(analytics.realDailyAvg) || 15),
            Math.max(1, Math.ceil(analytics.newRequiredPace)),
            Math.max(1, Math.ceil(analytics.newRequiredPace) + 5),
          ].filter((n) => n > 0)
        )
      ).slice(0, 3);

      sectionContent = (
        <section
          className={`rounded-2xl border p-4 sm:p-5 shadow-sm space-y-4 ${cardSurfaceClass}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
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
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: statusStyles.lineColor }}
                  />
                  Reale
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${indigoPillClass}`}
                >
                  <span className="w-3 h-0.5 border-t-2 border-dotted border-indigo-500" />
                  Proiezione
                </span>
                {analytics.whatIfEnabled && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                      isDark
                        ? 'bg-amber-950/70 text-amber-300 border-amber-800/60'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500" />
                    What-If ({analytics.whatIfPace} pag/gg)
                  </span>
                )}
              </div>
              {orderControls}
            </div>
          </div>

          {/* SIMULATORE WHAT-IF */}
          <div
            className={`rounded-xl border p-3 space-y-2.5 ${
              analytics.whatIfEnabled
                ? isDark
                  ? 'bg-amber-950/20 border-amber-800/60'
                  : 'bg-amber-50/55 border-amber-200/90'
                : subPanelClass
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                className={`inline-flex items-center gap-2 text-xs font-bold cursor-pointer select-none ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={analytics.whatIfEnabled}
                  onChange={(e) =>
                    updateActiveExam({ whatIfEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span>Simulazione What-If</span>
              </label>

              {analytics.whatIfEnabled && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`text-[11px] font-medium ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Ritmo ipotetico:
                  </span>
                  <input
                    type="number"
                    min="0.5"
                    max="500"
                    step="0.5"
                    value={activeExam.whatIfPace ?? 20}
                    onChange={(e) =>
                      updateActiveExam({
                        whatIfPace: Math.max(0.5, Number(e.target.value) || 0.5),
                      })
                    }
                    className={`w-20 rounded-lg border px-2 py-1 text-xs font-bold ${inputSurfaceClass}`}
                  />
                  <span
                    className={`text-[11px] font-semibold ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    pag/gg
                  </span>

                  <div className="hidden sm:flex items-center gap-1 ml-1">
                    {quickWhatIfPresets.map((presetVal) => (
                      <button
                        key={presetVal}
                        type="button"
                        onClick={() =>
                          updateActiveExam({ whatIfPace: presetVal })
                        }
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                          Number(analytics.whatIfPace) === presetVal
                            ? isDark
                              ? 'bg-amber-900/80 text-amber-200 border border-amber-700'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {presetVal}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {analytics.whatIfEnabled && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                {analytics.remainingPages === 0 ? (
                  <span
                    className={
                      isDark
                        ? 'text-emerald-300 font-medium'
                        : 'text-emerald-800 font-medium'
                    }
                  >
                    Hai già completato tutte le pagine del programma.
                  </span>
                ) : analytics.whatIfFinishDate ? (
                  <>
                    <div
                      className={isDark ? 'text-slate-300' : 'text-slate-700'}
                    >
                      A{' '}
                      <strong
                        className={
                          isDark ? 'text-amber-300' : 'text-amber-800'
                        }
                      >
                        {analytics.whatIfPace} pag/gg
                      </strong>{' '}
                      finisci la prima lettura il{' '}
                      <strong
                        className={
                          isDark ? 'text-slate-100' : 'text-slate-900'
                        }
                      >
                        {formatShortDate(analytics.whatIfFinishDate)}
                      </strong>{' '}
                      (termine previsto:{' '}
                      <strong>
                        {formatShortDate(analytics.studyDeadline)}
                      </strong>
                      ).
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        analytics.whatIfVerdict === 'on_time'
                          ? isDark
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : analytics.whatIfVerdict === 'tight'
                          ? isDark
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                          : isDark
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                          : 'bg-rose-100 text-rose-700 border-rose-200'
                      }`}
                    >
                      {analytics.whatIfDeltaDaysVsDeadline > 0
                        ? `${analytics.whatIfDeltaDaysVsDeadline} gg in anticipo`
                        : analytics.whatIfDeltaDaysVsDeadline === 0
                        ? 'Esattamente in tempo'
                        : `${Math.abs(
                            analytics.whatIfDeltaDaysVsDeadline
                          )} gg oltre scadenza`}
                    </span>
                  </>
                ) : (
                  <span
                    className={
                      isDark
                        ? 'text-rose-300 font-medium'
                        : 'text-rose-700 font-medium'
                    }
                  >
                    Con questo ritmo non completi le pagine entro l&apos;orizzonte
                    simulato.
                  </span>
                )}
              </div>
            )}
          </div>

          <div
            className={`${
              isNarrow ? 'h-[230px]' : 'h-[240px] sm:h-[275px]'
            } w-full`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={analytics.chartData}
                margin={{ top: 16, right: 16, left: -12, bottom: 4 }}
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
                      whatIf: `What-If (${analytics.whatIfPace} pag/gg)`,
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

                {analytics.whatIfEnabled && (
                  <Line
                    type="monotone"
                    dataKey="whatIf"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    strokeDasharray="5 3"
                    dot={false}
                    connectNulls={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      );
    } else if (sectionId === 'spaced_repetition') {
      sectionContent = (
        <section
          className={`rounded-2xl border p-4 sm:p-5 shadow-sm space-y-4 ${cardSurfaceClass}`}
        >
          <div
            className={`flex flex-wrap items-start justify-between gap-3 pb-3 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`p-2 rounded-xl mt-0.5 shrink-0 ${indigoPillClass}`}
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
            className={`rounded-xl border p-3.5 ${
              isDark
                ? 'bg-slate-800/45 border-slate-800'
                : 'bg-slate-50/70 border-slate-200/80'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
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

            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={srAnalytics.forecastChart}
                  margin={{ top: 12, right: 12, left: -22, bottom: 0 }}
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

                  <Bar dataKey="ripassi" radius={[6, 6, 0, 0]} maxBarSize={26}>
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
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer"
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
                      ? srAnalytics.dueTotalCount > 0
                        ? isDark
                          ? 'bg-slate-900 text-amber-400 shadow-sm'
                          : 'bg-white text-amber-700 shadow-sm'
                        : isDark
                        ? 'bg-slate-900 text-emerald-400 shadow-sm'
                        : 'bg-white text-emerald-700 shadow-sm'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Oggi ({srAnalytics.dueTotalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSrFilter('upcoming')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    srFilter === 'upcoming'
                      ? isDark
                        ? 'bg-slate-900 text-indigo-400 shadow-sm'
                        : 'bg-white text-indigo-600 shadow-sm'
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
                        ? 'bg-slate-900 text-slate-100 shadow-sm'
                        : 'bg-white text-slate-900 shadow-sm'
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
                    : 'border-slate-200 text-slate-500 bg-slate-50/40'
                }`}
              >
                {srAnalytics.totalTopics === 0
                  ? 'Nessun argomento in Spaced Repetition. Aggiungi i capitoli studiati sopra per pianificare i ripassi!'
                  : srFilter === 'due'
                  ? 'Nessun ripasso in scadenza oggi! Ottimo lavoro.'
                  : 'Nessun argomento in questa vista.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5">
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
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${indigoPillClass}`}
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
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
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
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
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
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
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
                          className={`p-2 rounded-lg transition cursor-pointer ${
                            isDark
                              ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-950/60'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Elimina argomento"
                        >
                          <Trash2 className="w-4 h-4" />
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
          className={`rounded-2xl border p-4 sm:p-5 shadow-sm ${cardSurfaceClass}`}
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
                        ? 'bg-slate-900 text-indigo-400 shadow-sm'
                        : 'bg-white text-indigo-600 shadow-sm'
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
                        ? 'bg-slate-900 text-indigo-400 shadow-sm'
                        : 'bg-white text-indigo-600 shadow-sm'
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
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
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
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                Nessuna sessione ancora registrata. Inserisci le prime pagine
                qui sopra!
              </div>
            ) : (
              <div className="overflow-x-auto max-h-60 overflow-y-auto pr-1">
                <table className="w-full text-left border-collapse text-sm min-w-[340px]">
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
                          className={`py-2.5 font-medium whitespace-nowrap ${
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
                        <td className="py-2.5 whitespace-nowrap">
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
                              className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-xs ${indigoPillClass}`}
                            >
                              +{row.pages} pag
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-2.5 text-xs whitespace-nowrap ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          {row.cumulative} / {analytics.totalPages} pag
                        </td>
                        <td className="py-2.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {editingLogDate === row.date ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedLog(row.date)}
                                  className={`p-2 rounded-lg cursor-pointer ${
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
                                  className={`p-2 rounded-lg cursor-pointer ${
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
                                  className={`p-2 rounded-lg cursor-pointer ${
                                    isDark
                                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                  }`}
                                  title="Modifica pagine"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLog(row.date)}
                                  className={`p-2 rounded-lg cursor-pointer ${
                                    isDark
                                      ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/60'
                                      : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  }`}
                                  title="Elimina riga"
                                >
                                  <Trash2 className="w-4 h-4" />
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
      const actionIconBtnClass = `h-10 w-full inline-flex items-center justify-center rounded-xl border transition cursor-pointer ${
        isDark
          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`;

      sectionContent = (
        <section
          className={`rounded-2xl border p-4 sm:p-5 shadow-sm space-y-4 ${cardSurfaceClass}`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Clock
                  className={`w-4 h-4 shrink-0 ${
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
                  className={`text-base font-bold whitespace-nowrap ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  Timer Pomodoro
                </h3>
              </div>
              {orderControls}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={enterZenFullscreen}
                className={`h-9 flex-1 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer whitespace-nowrap ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-emerald-300 hover:bg-slate-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
                title="Apri sezione Focus Zen isolata a schermo intero"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Sezione Zen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  getUnlockedAudioContext();
                  const next = !pomoSound;
                  setPomoSound(next);
                  if (next) playPomodoroSound(pomoSoundType, 'study');
                }}
                className={`h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-xl text-xs transition cursor-pointer ${
                  pomoSound
                    ? indigoPillClass
                    : isDark
                    ? 'bg-slate-800 border border-slate-700 text-slate-500'
                    : 'bg-slate-50 border border-slate-200 text-slate-400'
                }`}
                title={pomoSound ? 'Suono attivo' : 'Suono disattivato'}
              >
                {pomoSound ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
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
              className={`py-2 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                pomoPhase === 'study'
                  ? isDark
                    ? 'bg-slate-900 text-indigo-400 shadow-sm'
                    : 'bg-white text-indigo-600 shadow-sm'
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
              className={`py-2 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                pomoPhase === 'short_break'
                  ? isDark
                    ? 'bg-slate-900 text-emerald-400 shadow-sm'
                    : 'bg-white text-emerald-600 shadow-sm'
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
              className={`py-2 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                pomoPhase === 'long_break'
                  ? isDark
                    ? 'bg-slate-900 text-teal-400 shadow-sm'
                    : 'bg-white text-teal-700 shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pausa Lunga
            </button>
          </div>

          <div
            className={`relative overflow-hidden rounded-2xl p-5 text-center border transition-all duration-700 ${
              pomoPhase === 'study'
                ? isDark
                  ? 'bg-gradient-to-br from-indigo-950/70 via-slate-900 to-indigo-950/40 border-indigo-700/60 shadow-[0_0_25px_rgba(99,102,241,0.15)]'
                  : 'bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/40 border-indigo-200/80 shadow-[0_10px_25px_rgba(99,102,241,0.08)]'
                : isDark
                ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-emerald-950/40 border-emerald-700/60 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
                : 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-emerald-200/80 shadow-[0_10px_25px_rgba(16,185,129,0.08)]'
            }`}
          >
            {pomoRunning && (
              <div
                className={`absolute inset-0 opacity-15 pointer-events-none animate-pulse ${
                  pomoPhase === 'study' ? 'bg-indigo-500' : 'bg-emerald-500'
                }`}
                style={{ filter: 'blur(40px)' }}
              />
            )}

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                {[1, 2, 3, 4].map((dot) => (
                  <span
                    key={dot}
                    className={`h-2.5 w-7 sm:w-6 rounded-full transition-all ${
                      dot <= pomoCycleCount
                        ? pomoPhase === 'study'
                          ? 'bg-indigo-500 shadow-sm'
                          : 'bg-emerald-500 shadow-sm'
                        : isDark
                        ? 'bg-slate-800'
                        : 'bg-slate-200'
                    }`}
                    title={`Pomodoro ${dot} di 4 prima della pausa lunga`}
                  />
                ))}
              </div>

              <div
                className={`text-4xl sm:text-5xl font-black tracking-tight tabular-nums my-1 transition-transform duration-300 ${
                  pomoRunning ? 'scale-102' : 'scale-100'
                } ${
                  pomoPhase === 'study'
                    ? isDark
                      ? 'text-indigo-100'
                      : 'text-slate-900'
                    : isDark
                    ? 'text-emerald-200'
                    : 'text-emerald-950'
                }`}
              >
                {pomoMinutesDisplay}:{pomoSecondsDisplay}
              </div>

              <p
                className={`text-xs font-semibold tracking-wide uppercase mb-3 ${
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
                  ? 'Pausa breve: sgranchisciti e respira'
                  : 'Pausa lunga: ricarica le energie!'}
              </p>

              <div
                className={`mb-4 px-3 py-2.5 rounded-xl text-xs italic font-medium border transition-all ${
                  isDark
                    ? 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                    : 'bg-white/80 border-slate-200/80 text-slate-600'
                }`}
              >
                {POMO_QUOTES[currentQuoteIndex]}
              </div>

              <div
                className={`w-full h-2.5 rounded-full overflow-hidden mb-4 ${
                  isDark
                    ? 'bg-slate-800/90'
                    : pomoPhase === 'study'
                    ? 'bg-indigo-200/60'
                    : 'bg-emerald-200/60'
                }`}
              >
                <div
                  className={`h-full transition-all duration-300 ${
                    pomoPhase === 'study' ? 'bg-indigo-600' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${pomoStats.progressPct}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={handleTogglePomoRunning}
                  className={`h-10 w-full inline-flex items-center justify-center gap-1 px-2 rounded-xl text-xs font-bold text-white shadow-sm transition cursor-pointer ${
                    pomoRunning
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : pomoPhase === 'study'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {pomoRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Pausa</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Avvia</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePomoReset}
                  className={actionIconBtnClass}
                  title="Azzera timer corrente"
                  aria-label="Azzera timer corrente"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handlePomoSkipPhase}
                  className={actionIconBtnClass}
                  title="Salta alla fase successiva"
                  aria-label="Salta alla fase successiva"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={enterZenFullscreen}
                  className={actionIconBtnClass}
                  title="Apri sezione Focus Zen a tutto schermo"
                  aria-label="Apri sezione Focus Zen a tutto schermo"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
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
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePomoPreset(25, 5, 15)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    pomoStudyMin === 25 &&
                    pomoShortBreakMin === 5 &&
                    pomoLongBreakMin === 15
                      ? indigoPillClass
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
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    pomoStudyMin === 50 &&
                    pomoShortBreakMin === 10 &&
                    pomoLongBreakMin === 20
                      ? indigoPillClass
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
                      setPomoTimerUpdatedAt(Date.now());
                    }
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm font-semibold ${inputMutedSurfaceClass}`}
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
                      setPomoTimerUpdatedAt(Date.now());
                    }
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm font-semibold ${inputMutedSurfaceClass}`}
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
                      setPomoTimerUpdatedAt(Date.now());
                    }
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm font-semibold ${inputMutedSurfaceClass}`}
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
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Avvio automatico fase successiva
              </label>

              <button
                type="button"
                onClick={handleAddManualPomoSession}
                className={`text-xs font-semibold cursor-pointer py-1 ${
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
                  className={`w-4 h-4 shrink-0 ${
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
                  className={`w-full rounded-xl border pl-3 pr-8 py-2 text-xs font-medium truncate disabled:opacity-50 ${inputMutedSurfaceClass}`}
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
                className={`h-9 px-3 rounded-xl border text-xs font-semibold transition shrink-0 disabled:opacity-40 cursor-pointer ${
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
                className={`rounded-xl p-3 border ${
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
                className={`rounded-xl p-3 border ${
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
                  className={`w-full flex items-center justify-between text-xs font-semibold py-1.5 cursor-pointer ${
                    isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>
                    Registro sessioni Pomodoro ({pomoStats.sessions.length})
                  </span>
                  <span
                    className={`${
                      isDark ? 'text-indigo-400' : 'text-indigo-600'
                    } text-xs`}
                  >
                    {showPomoHistory ? 'Nascondi' : 'Mostra'}
                  </span>
                </button>

                {showPomoHistory && (
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {pomoStats.sessions.map((s) => (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between text-xs rounded-xl px-3 py-2 border ${
                          isDark
                            ? 'bg-slate-800/70 border-slate-700/80'
                            : 'bg-slate-50 border-slate-200/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Coffee
                            className={`w-3.5 h-3.5 ${
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
                          className={`p-1.5 rounded-lg cursor-pointer ${
                            isDark
                              ? 'text-slate-500 hover:text-rose-400'
                              : 'text-slate-400 hover:text-rose-600'
                          }`}
                          title="Elimina sessione"
                        >
                          <Trash2 className="w-4 h-4" />
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
          className={`rounded-2xl border p-4 sm:p-5 shadow-sm space-y-5 ${cardSurfaceClass}`}
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
                      className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        active
                          ? 'bg-indigo-600 text-white shadow-sm'
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
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  confirmReset
                    ? 'bg-rose-600 text-white'
                    : isDark
                    ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/60'
                    : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                {confirmReset
                  ? 'Conferma azzeramento log?'
                  : 'Azzera solo log esame'}
              </button>

              {state.exams.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteExam}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isDark
                      ? 'text-rose-400 hover:bg-rose-950/60'
                      : 'text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
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
            ? `ring-2 ring-indigo-500 ring-offset-4 ${
                isDark ? 'ring-offset-slate-950' : 'ring-offset-slate-50'
              } rounded-2xl`
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
      className={`min-h-screen w-full text-left transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <style>{`
        html, body, #root {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          display: block !important;
          text-align: left !important;
          -webkit-text-size-adjust: 100%;
        }
        @media (max-width: 639px) {
          input, select, textarea {
            font-size: 16px !important;
          }
        }
        input.no-spinner::-webkit-outer-spin-button,
        input.no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input.no-spinner[type=number] {
          -moz-appearance: textfield;
        }
        @keyframes zenBreathSlow {
          0%, 100% {
            transform: scale(0.94);
            opacity: 0.65;
          }
          50% {
            transform: scale(1.06);
            opacity: 1;
          }
        }
        @keyframes zenAuroraOne {
          0% {
            transform: translate3d(-8%, -6%, 0) scale(1);
          }
          50% {
            transform: translate3d(6%, 5%, 0) scale(1.08);
          }
          100% {
            transform: translate3d(-4%, 8%, 0) scale(0.98);
          }
        }
        @keyframes zenAuroraTwo {
          0% {
            transform: translate3d(8%, 6%, 0) scale(1.05);
          }
          50% {
            transform: translate3d(-7%, -4%, 0) scale(0.96);
          }
          100% {
            transform: translate3d(5%, -7%, 0) scale(1.04);
          }
        }
      `}</style>

      {/* =====================================================================
          SEZIONE DEDICATA: FOCUS ZEN A SCHERMO INTERO (SFONDO DEEP FOCUS)
         ===================================================================== */}
      {isPomoFullscreen && (
        <section
          aria-label="Sezione Focus Zen"
          className={`fixed inset-0 z-50 flex flex-col justify-between p-5 sm:p-10 select-none overflow-y-auto transition-colors duration-700 ${
            pomoPhase === 'study'
              ? isDark
                ? 'bg-[#070d10] text-[#ebf3f1]'
                : 'bg-[#f2f6f4] text-[#12211e]'
              : isDark
              ? 'bg-[#071110] text-[#e7f4f1]'
              : 'bg-[#eef6f4] text-[#102420]'
          }`}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 overflow-hidden"
          >
            <div
              className="absolute -top-[18%] -left-[12%] w-[65vw] h-[65vw] rounded-full blur-3xl opacity-75 transition-colors duration-700"
              style={{
                background:
                  pomoPhase === 'study'
                    ? isDark
                      ? 'radial-gradient(circle, rgba(45, 212, 191, 0.14) 0%, rgba(15, 23, 42, 0) 70%)'
                      : 'radial-gradient(circle, rgba(13, 148, 136, 0.12) 0%, rgba(242, 246, 244, 0) 70%)'
                    : isDark
                    ? 'radial-gradient(circle, rgba(52, 211, 153, 0.16) 0%, rgba(15, 23, 42, 0) 70%)'
                    : 'radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, rgba(238, 246, 244, 0) 70%)',
                animation: 'zenAuroraOne 22s ease-in-out infinite',
              }}
            />

            <div
              className="absolute -bottom-[22%] -right-[14%] w-[70vw] h-[70vw] rounded-full blur-3xl opacity-75 transition-colors duration-700"
              style={{
                background:
                  pomoPhase === 'study'
                    ? isDark
                      ? 'radial-gradient(circle, rgba(56, 189, 248, 0.11) 0%, rgba(7, 13, 16, 0) 70%)'
                      : 'radial-gradient(circle, rgba(129, 140, 248, 0.10) 0%, rgba(242, 246, 244, 0) 70%)'
                    : isDark
                    ? 'radial-gradient(circle, rgba(45, 212, 191, 0.13) 0%, rgba(7, 17, 16, 0) 70%)'
                    : 'radial-gradient(circle, rgba(20, 184, 166, 0.12) 0%, rgba(238, 246, 244, 0) 70%)',
                animation: 'zenAuroraTwo 26s ease-in-out infinite',
              }}
            />

            <div
              className="absolute inset-0"
              style={{
                backgroundImage: isDark
                  ? 'radial-gradient(rgba(226, 232, 240, 0.08) 1px, transparent 1px)'
                  : 'radial-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
                maskImage:
                  'radial-gradient(circle at 50% 50%, black 22%, transparent 78%)',
                WebkitMaskImage:
                  'radial-gradient(circle at 50% 50%, black 22%, transparent 78%)',
              }}
            />

            <div
              className="absolute inset-0"
              style={{
                background: isDark
                  ? 'radial-gradient(circle at 50% 50%, transparent 48%, rgba(4, 8, 10, 0.55) 100%)'
                  : 'radial-gradient(circle at 50% 50%, transparent 52%, rgba(226, 235, 231, 0.45) 100%)',
              }}
            />
          </div>

          <header className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest border backdrop-blur-md ${
                  isDark
                    ? 'bg-white/[0.04] border-white/10 text-teal-200/85'
                    : 'bg-white/75 border-emerald-950/10 text-emerald-950/80'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Sezione Zen · {activeExam?.name || 'Studio'}
              </span>
              <span
                className={`text-xs hidden sm:inline ${
                  isDark ? 'text-white/40' : 'text-emerald-950/45'
                }`}
              >
                ESC per tornare all&apos;app
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  getUnlockedAudioContext();
                  const next = !pomoSound;
                  setPomoSound(next);
                  if (next) playPomodoroSound(pomoSoundType, pomoPhase);
                }}
                className={`p-2.5 rounded-full border backdrop-blur-md transition cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.04] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.09]'
                    : 'bg-white/80 border-emerald-950/10 text-emerald-950/75 hover:text-emerald-950 hover:bg-white'
                }`}
                title={
                  pomoSound ? 'Suoneria fine fase attiva' : 'Suoneria disattivata'
                }
              >
                {pomoSound ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={exitZenFullscreen}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border backdrop-blur-md transition cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.06] border-white/15 text-white/85 hover:bg-white/[0.12]'
                    : 'bg-white/85 border-emerald-950/15 text-emerald-950/85 hover:bg-white shadow-xs'
                }`}
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Esci da Zen</span>
              </button>
            </div>
          </header>

          <main className="relative z-10 max-w-2xl w-full mx-auto text-center my-auto space-y-5 py-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div
                className={`inline-flex rounded-full p-1 border backdrop-blur-md ${
                  isDark
                    ? 'bg-white/[0.03] border-white/10'
                    : 'bg-white/70 border-emerald-950/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handlePomoSwitchPhase('study')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    pomoPhase === 'study'
                      ? isDark
                        ? 'bg-teal-400/20 text-teal-200'
                        : 'bg-emerald-900 text-white'
                      : isDark
                      ? 'text-white/50 hover:text-white/80'
                      : 'text-emerald-950/55 hover:text-emerald-950'
                  }`}
                >
                  Studio
                </button>
                <button
                  type="button"
                  onClick={() => handlePomoSwitchPhase('short_break')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    pomoPhase === 'short_break'
                      ? isDark
                        ? 'bg-emerald-400/20 text-emerald-200'
                        : 'bg-teal-800 text-white'
                      : isDark
                      ? 'text-white/50 hover:text-white/80'
                      : 'text-emerald-950/55 hover:text-emerald-950'
                  }`}
                >
                  Pausa
                </button>
                <button
                  type="button"
                  onClick={() => handlePomoSwitchPhase('long_break')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    pomoPhase === 'long_break'
                      ? isDark
                        ? 'bg-cyan-400/20 text-cyan-200'
                        : 'bg-cyan-900 text-white'
                      : isDark
                      ? 'text-white/50 hover:text-white/80'
                      : 'text-emerald-950/55 hover:text-emerald-950'
                  }`}
                >
                  Pausa Lunga
                </button>
              </div>

              <div
                className={`inline-flex rounded-full p-1 border backdrop-blur-md text-[11px] font-semibold ${
                  isDark
                    ? 'bg-white/[0.03] border-white/10'
                    : 'bg-white/70 border-emerald-950/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handlePomoPreset(25, 5, 15)}
                  className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                    pomoStudyMin === 25 && pomoShortBreakMin === 5
                      ? isDark
                        ? 'bg-white/15 text-teal-200'
                        : 'bg-emerald-900/15 text-emerald-950'
                      : isDark
                      ? 'text-white/50 hover:text-white/80'
                      : 'text-emerald-950/55 hover:text-emerald-950'
                  }`}
                >
                  25/5
                </button>
                <button
                  type="button"
                  onClick={() => handlePomoPreset(50, 10, 20)}
                  className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                    pomoStudyMin === 50 && pomoShortBreakMin === 10
                      ? isDark
                        ? 'bg-white/15 text-teal-200'
                        : 'bg-emerald-900/15 text-emerald-950'
                      : isDark
                      ? 'text-white/50 hover:text-white/80'
                      : 'text-emerald-950/55 hover:text-emerald-950'
                  }`}
                >
                  50/10
                </button>
              </div>
            </div>

            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <svg
                aria-hidden="true"
                className="w-full h-full -rotate-90"
                viewBox="0 0 144 144"
              >
                <circle
                  cx="72"
                  cy="72"
                  r={zenRingRadius}
                  fill="none"
                  strokeWidth="1.5"
                  className={
                    isDark ? 'stroke-white/10' : 'stroke-emerald-950/10'
                  }
                />
                <circle
                  cx="72"
                  cy="72"
                  r={zenRingRadius}
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={zenRingCircumference}
                  strokeDashoffset={zenRingDashOffset}
                  className={`transition-all duration-500 ${
                    pomoPhase === 'study'
                      ? isDark
                        ? 'stroke-teal-300/75'
                        : 'stroke-emerald-800/75'
                      : isDark
                      ? 'stroke-emerald-300/80'
                      : 'stroke-teal-700/80'
                  }`}
                />
              </svg>

              <div
                aria-hidden="true"
                className={`absolute w-16 h-16 rounded-full border flex items-center justify-center ${
                  isDark
                    ? 'border-teal-200/25 bg-teal-300/[0.05]'
                    : 'border-emerald-900/15 bg-emerald-900/[0.04]'
                }`}
                style={{
                  animation: 'zenBreathSlow 8s ease-in-out infinite',
                }}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    pomoPhase === 'study'
                      ? isDark
                        ? 'bg-teal-300/85'
                        : 'bg-emerald-800/80'
                      : isDark
                      ? 'bg-emerald-300/85'
                      : 'bg-teal-700/80'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-7xl sm:text-8xl md:text-9xl font-extralight tracking-tight tabular-nums leading-none">
                {pomoMinutesDisplay}:{pomoSecondsDisplay}
              </div>

              <p
                className={`text-xs sm:text-sm font-medium uppercase tracking-[0.22em] ${
                  isDark ? 'text-teal-200/70' : 'text-emerald-950/65'
                }`}
              >
                {pomoPhase === 'study'
                  ? `Ciclo ${(pomoCycleCount % 4) + 1} di 4 · Deep Focus`
                  : pomoPhase === 'short_break'
                  ? 'Respiro e pausa breve'
                  : 'Riposo profondo · Pausa lunga'}
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <input
                type="text"
                value={zenGoal}
                onChange={(e) => setZenGoal(e.target.value)}
                placeholder="Un solo obiettivo per questo momento..."
                className={`w-full bg-transparent text-center text-sm sm:text-base font-normal border-b pb-2 transition focus:outline-none ${
                  isDark
                    ? 'border-white/15 text-white/90 placeholder-white/30 focus:border-teal-300/60'
                    : 'border-emerald-950/15 text-emerald-950 placeholder-emerald-950/35 focus:border-emerald-900/50'
                }`}
              />
            </div>

            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4].map((dot) => (
                <span
                  key={dot}
                  className={`h-1.5 w-8 rounded-full transition-all ${
                    dot <= pomoCycleCount
                      ? isDark
                        ? 'bg-teal-300/85'
                        : 'bg-emerald-800/80'
                      : isDark
                      ? 'bg-white/10'
                      : 'bg-emerald-950/10'
                  }`}
                />
              ))}
            </div>

            <p
              className={`max-w-lg mx-auto text-xs sm:text-sm italic leading-relaxed ${
                isDark ? 'text-white/55' : 'text-emerald-950/60'
              }`}
            >
              {POMO_QUOTES[currentQuoteIndex]}
            </p>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTogglePomoRunning}
                className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold transition cursor-pointer ${
                  isDark
                    ? 'bg-teal-300 text-slate-950 hover:bg-teal-200'
                    : 'bg-emerald-900 text-white hover:bg-emerald-950 shadow-sm'
                }`}
              >
                {pomoRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pausa</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>
                      {pomoSecondsLeft < getPhaseMinutes(pomoPhase) * 60
                        ? 'Riprendi'
                        : 'Avvia'}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePomoReset}
                className={`p-3.5 rounded-full border backdrop-blur-md transition cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.04] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.09]'
                    : 'bg-white/80 border-emerald-950/10 text-emerald-950/70 hover:text-emerald-950 hover:bg-white'
                }`}
                title="Azzera"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handlePomoSkipPhase}
                className={`p-3.5 rounded-full border backdrop-blur-md transition cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.04] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.09]'
                    : 'bg-white/80 border-emerald-950/10 text-emerald-950/70 hover:text-emerald-950 hover:bg-white'
                }`}
                title="Fase successiva"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div
              className={`max-w-md mx-auto rounded-2xl border backdrop-blur-md px-4 py-3 text-left space-y-2.5 ${
                isDark
                  ? 'bg-white/[0.03] border-white/10'
                  : 'bg-white/75 border-emerald-950/10'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    getUnlockedAudioContext();
                    setZenAmbientEnabled((v) => !v);
                  }}
                  className={`inline-flex items-center gap-2 text-xs font-semibold cursor-pointer ${
                    zenAmbientEnabled
                      ? isDark
                        ? 'text-teal-300'
                        : 'text-emerald-900'
                      : isDark
                      ? 'text-white/65 hover:text-white'
                      : 'text-emerald-950/65 hover:text-emerald-950'
                  }`}
                >
                  <Headphones className="w-4 h-4" />
                  <span>
                    Sottofondo Focus:{' '}
                    {zenAmbientEnabled ? 'Attivo' : 'Spento'}
                  </span>
                </button>

                {zenAmbientEnabled && (
                  <label
                    className={`inline-flex items-center gap-1.5 text-[11px] cursor-pointer ${
                      isDark ? 'text-white/55' : 'text-emerald-950/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={zenAmbientOnlyStudy}
                      onChange={(e) => setZenAmbientOnlyStudy(e.target.checked)}
                      className="rounded"
                    />
                    <span>Solo Studio</span>
                  </label>
                )}
              </div>

              {zenAmbientEnabled && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    {ZEN_AMBIENT_TRACKS.map((tr) => (
                      <button
                        key={tr.id}
                        type="button"
                        onClick={() => setZenAmbientTrack(tr.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                          zenAmbientTrack === tr.id
                            ? isDark
                              ? 'bg-teal-300/20 text-teal-200'
                              : 'bg-emerald-900 text-white'
                            : isDark
                            ? 'text-white/50 hover:text-white/80'
                            : 'text-emerald-950/60 hover:text-emerald-950'
                        }`}
                      >
                        {tr.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="0.05"
                    max="0.55"
                    step="0.05"
                    value={zenAmbientVolume}
                    onChange={(e) => setZenAmbientVolume(Number(e.target.value))}
                    aria-label="Volume sottofondo focus"
                    className="w-24 accent-teal-600 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </main>

          <footer className="relative z-10 max-w-2xl w-full mx-auto space-y-2">
            <div
              className={`w-full h-1 rounded-full overflow-hidden ${
                isDark ? 'bg-white/10' : 'bg-emerald-950/10'
              }`}
            >
              <div
                className={`h-full transition-all duration-300 ${
                  isDark ? 'bg-teal-300/75' : 'bg-emerald-800/75'
                }`}
                style={{ width: `${pomoStats.progressPct}%` }}
              />
            </div>
            <div
              className={`flex items-center justify-between text-[11px] ${
                isDark ? 'text-white/45' : 'text-emerald-950/50'
              }`}
            >
              <span>
                Oggi: {pomoStats.todayCount} pom (
                {formatMinutesHuman(pomoStats.todayMinutes)})
              </span>
              <span>
                {pomoRunning ? 'Attivo in background' : 'In pausa'}
              </span>
            </div>
          </footer>
        </section>
      )}

      {/* --- HEADER FULL-WIDTH --- */}
      <header
        className={`border-b sticky top-0 z-30 w-full transition-colors duration-200 ${
          isDark
            ? 'bg-slate-900 border-slate-800 shadow-md shadow-slate-950/40'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="w-full px-3 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-sm shrink-0">
              {activeTab === 'tracker' ? (
                <BookOpen className="w-5 h-5" />
              ) : activeTab === 'libretto' ? (
                <GraduationCap className="w-5 h-5" />
              ) : (
                <Stethoscope className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isDark ? 'text-indigo-400' : 'text-indigo-600'
                  }`}
                >
                  StudyBurn
                </span>
                <span
                  className={isDark ? 'text-slate-600' : 'text-slate-300'}
                >
                  •
                </span>
                <span
                  className={`text-xs truncate hidden sm:inline ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {activeTab === 'tracker'
                    ? 'Tracker Esami Universitari'
                    : activeTab === 'libretto'
                    ? 'Medicina • Anni & Calcolo Voto Blocchi'
                    : 'Medicina • Registro Reparti & Tirocini Clinici'}
                </span>
              </div>

              {activeTab === 'tracker' ? (
                isRenamingHeader ? (
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
                      className={`text-sm sm:text-lg font-bold border-b-2 border-indigo-600 bg-transparent focus:outline-none px-0.5 ${
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
                    className="group flex items-center gap-1.5 text-left mt-0.5 cursor-pointer max-w-full"
                    title="Clicca per rinominare l'esame"
                  >
                    <h1
                      className={`text-sm sm:text-lg font-bold truncate transition-colors ${
                        isDark
                          ? 'text-slate-50 group-hover:text-indigo-400'
                          : 'text-slate-900 group-hover:text-indigo-600'
                      }`}
                    >
                      {activeExam.name || 'Esame senza nome'}
                    </h1>
                    <Edit3
                      className={`w-3.5 h-3.5 transition-colors shrink-0 ${
                        isDark
                          ? 'text-slate-500 group-hover:text-indigo-400'
                          : 'text-slate-400 group-hover:text-indigo-600'
                      }`}
                    />
                  </button>
                )
              ) : activeTab === 'libretto' ? (
                <h1
                  className={`text-sm sm:text-lg font-bold truncate mt-0.5 ${
                    isDark ? 'text-slate-50' : 'text-slate-900'
                  }`}
                >
                  Calcolatore Voto Blocchi (1° – 6° Anno)
                </h1>
              ) : (
                <h1
                  className={`text-sm sm:text-lg font-bold truncate mt-0.5 ${
                    isDark ? 'text-slate-50' : 'text-slate-900'
                  }`}
                >
                  Tirocini Clinici &amp; Reparti
                </h1>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {pomoRunning && (
              <button
                type="button"
                onClick={enterZenFullscreen}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition cursor-pointer"
                title="Apri Sezione Zen a tutto schermo"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="tabular-nums">
                  {pomoMinutesDisplay}:{pomoSecondsDisplay}
                </span>
              </button>
            )}

            <div
              className={`inline-flex rounded-xl p-1 border ${
                isDark
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-slate-100 border-slate-200/80'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveTab('tracker')}
                className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'tracker'
                    ? isDark
                      ? 'bg-slate-900 text-indigo-400 shadow-sm'
                      : 'bg-white text-indigo-600 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tracker Studio</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('libretto')}
                className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'libretto'
                    ? isDark
                      ? 'bg-slate-900 text-indigo-400 shadow-sm'
                      : 'bg-white text-indigo-600 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Voti Blocchi</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tirocinio')}
                className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'tirocinio'
                    ? isDark
                      ? 'bg-slate-900 text-indigo-400 shadow-sm'
                      : 'bg-white text-indigo-600 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tirocini</span>
              </button>
            </div>

            {undoStack.length > 0 && (
              <button
                type="button"
                onClick={handleUndo}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  isDark
                    ? 'text-slate-300 bg-slate-800 hover:bg-slate-700 border-slate-700'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border-slate-200'
                }`}
                title="Annulla ultima modifica"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Annulla</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowCloudModal(true)}
              className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
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
              title="Sincronizzazione Cloud"
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
                    : 'Cloud'
                  : 'Cloud'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Cambia tema"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>

            {activeTab === 'libretto' && (
              <button
                type="button"
                onClick={() => setIsBlockReorderMode((v) => !v)}
                className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  isBlockReorderMode
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : isDark
                    ? 'text-slate-300 bg-slate-800 hover:bg-slate-700 border-slate-700'
                    : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200'
                }`}
                title="Ordina blocchi"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isBlockReorderMode ? 'Fine' : 'Ordina blocchi'}
                </span>
              </button>
            )}

            {activeTab === 'tracker' && (
              <>
                <button
                  type="button"
                  onClick={() => setIsReorderMode((v) => !v)}
                  className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isReorderMode
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : isCustomLayout
                      ? indigoPillClass
                      : isDark
                      ? 'text-slate-300 bg-slate-800 hover:bg-slate-700 border-slate-700'
                      : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                  title="Ordina sezioni"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {isReorderMode ? 'Fine' : 'Ordina sezioni'}
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
                  className={`rounded-xl border text-xs sm:text-sm font-medium pl-2.5 pr-6 py-1.5 max-w-[140px] sm:max-w-[200px] truncate ${
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
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nuovo</span>
                </button>

                <button
                  type="button"
                  onClick={handleDuplicateExam}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    isDark
                      ? 'text-slate-300 bg-slate-800 hover:bg-slate-700 border-slate-700'
                      : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                  title="Duplica esame"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* --- MODALE SYNC CLOUD MULTI-DISPOSITIVO --- */}
      {showCloudModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          onClick={() => setShowCloudModal(false)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl border p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${cardSurfaceClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${indigoPillClass}`}>
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
                className={`p-2 rounded-lg cursor-pointer ${
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
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
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
                    className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Sovrascrivi Cloud con quelli locali
                  </button>
                </div>
              </div>
            )}

            {cloudSession?.access_token ? (
              <div className="space-y-4">
                <div className={`rounded-xl border p-4 space-y-2 ${subPanelClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-medium ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Account connesso
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        cloudStatus === 'error'
                          ? isDark
                            ? 'bg-rose-900/80 text-rose-200'
                            : 'bg-rose-100 text-rose-700'
                          : isDark
                          ? 'bg-emerald-900/80 text-emerald-200'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {cloudStatus === 'syncing'
                        ? 'Sincronizzazione in corso...'
                        : cloudStatus === 'error'
                        ? 'Errore di connessione'
                        : 'Sincronizzato'}
                    </span>
                  </div>
                  <p
                    className={`text-sm font-bold truncate ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}
                  >
                    {cloudSession.user?.email || 'Utente autenticato'}
                  </p>
                  {lastSyncedAt && (
                    <p
                      className={`text-[11px] ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Ultimo aggiornamento: alle {lastSyncedAt}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => pullFromCloud(cloudSession, false)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Aggiorna dal Cloud
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      cloudSyncReadyRef.current = true;
                      pushToCloud();
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Forza Salvataggio
                  </button>
                </div>

                <div
                  className={`pt-3 border-t flex items-center justify-between ${
                    isDark ? 'border-slate-800' : 'border-slate-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={handleCloudLogout}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isDark
                        ? 'text-rose-400 hover:bg-rose-950/60'
                        : 'text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Disconnetti account
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCloudAuthSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}
                    >
                      {authMode === 'login'
                        ? 'Accedi al tuo profilo Cloud'
                        : 'Crea nuovo account Cloud'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode((m) =>
                          m === 'login' ? 'signup' : 'login'
                        );
                        setCloudMessage('');
                      }}
                      className={`text-xs font-semibold cursor-pointer ${
                        isDark ? 'text-indigo-400' : 'text-indigo-600'
                      }`}
                    >
                      {authMode === 'login'
                        ? 'Non hai un account? Registrati'
                        : 'Hai già un account? Accedi'}
                    </button>
                  </div>

                  <div>
                    <label
                      className={`block text-[11px] font-semibold mb-1 ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="nome@email.it"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                      className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-[11px] font-semibold mb-1 ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="Minimo 6 caratteri"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                      className={`w-full rounded-xl border px-3 py-2 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold shadow-sm transition cursor-pointer"
                  >
                    <Cloud className="w-4 h-4" />
                    {authLoading
                      ? 'Connessione in corso...'
                      : authMode === 'login'
                      ? 'Accedi e Sincronizza'
                      : 'Crea Account e Sincronizza'}
                  </button>
                </div>

                <div
                  className={`pt-2 border-t ${
                    isDark ? 'border-slate-800' : 'border-slate-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setShowAdvancedServerConfig((v) => !v)}
                    className={`w-full flex items-center justify-between text-[11px] font-semibold py-1 cursor-pointer ${
                      isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>Impostazioni server Supabase</span>
                    <span>
                      {showAdvancedServerConfig ? 'Nascondi' : 'Mostra'}
                    </span>
                  </button>

                  {showAdvancedServerConfig && (
                    <div
                      className={`mt-2 space-y-2.5 rounded-xl border p-3 ${subPanelClass}`}
                    >
                      <div>
                        <label
                          className={`block text-[11px] font-semibold mb-1 ${
                            isDark ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          Supabase Project URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://xyzcompany.supabase.co"
                          value={cloudUrl}
                          onChange={(e) => setCloudUrl(e.target.value)}
                          className={`w-full rounded-xl border px-3 py-2 text-xs ${inputSurfaceClass}`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-[11px] font-semibold mb-1 ${
                            isDark ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          Supabase Anon Public Key
                        </label>
                        <input
                          type="text"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                          value={cloudAnonKey}
                          onChange={(e) => setCloudAnonKey(e.target.value)}
                          className={`w-full rounded-xl border px-3 py-2 text-xs ${inputSurfaceClass}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </form>
            )}

            {cloudMessage && (
              <div
                className={`rounded-xl border px-3 py-2.5 text-xs font-medium ${
                  cloudStatus === 'error'
                    ? isDark
                      ? 'bg-rose-950/60 border-rose-800 text-rose-200'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                    : isDark
                    ? 'bg-indigo-950/60 border-indigo-800 text-indigo-200'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                }`}
              >
                {cloudMessage}
              </div>
            )}

            <div
              className={`pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}
            >
              <span
                className={`text-[11px] font-semibold ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Backup locale rapido (JSON):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportBackupFile}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
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
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
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
                  accept="application/json"
                  onChange={handleImportBackupFile}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CONTENUTO PRINCIPALE FULL-WIDTH --- */}
      {activeTab === 'tirocinio' ? (
        <main className="w-full px-3 sm:px-6 lg:px-8 py-5 space-y-5">
          {/* RIEPILOGO GLOBALE TIROCINI */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div
              className={`rounded-2xl border p-4 shadow-sm ${cardSurfaceClass}`}
            >
              <span
                className={`text-xs font-medium block mb-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Giorni Completati
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl sm:text-3xl font-extrabold ${
                    isDark ? 'text-emerald-400' : 'text-emerald-600'
                  }`}
                >
                  {tirociniStats.doneDays}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  / {tirociniStats.totalDays} gg
                </span>
              </div>
              <div
                className={`w-full h-2 rounded-full overflow-hidden mt-3 ${
                  isDark ? 'bg-slate-800' : 'bg-slate-100'
                }`}
              >
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${tirociniStats.pct}%` }}
                />
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 shadow-sm ${cardSurfaceClass}`}
            >
              <span
                className={`text-xs font-medium block mb-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Reparti Svolti
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl sm:text-3xl font-extrabold ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  {tirociniStats.doneRotations}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  su {tirociniStats.totalRotations} reparti
                </span>
              </div>
              <p
                className={`text-xs mt-2 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Avanzamento: {tirociniStats.pct.toFixed(0)}%
              </p>
            </div>

            <div
              className={`rounded-2xl border p-4 shadow-sm ${cardSurfaceClass}`}
            >
              <span
                className={`text-xs font-medium block mb-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Giorni Rimanenti
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl sm:text-3xl font-extrabold ${
                    isDark ? 'text-indigo-400' : 'text-indigo-600'
                  }`}
                >
                  {tirociniStats.remainingDays}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  gg in programma
                </span>
              </div>
              <p
                className={`text-xs mt-2 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {tirociniStats.inProgressRotations > 0
                  ? `${tirociniStats.inProgressRotations} in corso`
                  : 'Pronto per i prossimi turni'}
              </p>
            </div>

            <div
              className={`rounded-2xl border p-4 shadow-sm ${cardSurfaceClass}`}
            >
              <span
                className={`text-xs font-medium block mb-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Moduli Verbalizzati
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl sm:text-3xl font-extrabold ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  {tirociniList.filter((t) => t.verbalizzato).length}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  / {tirociniList.length} moduli
                </span>
              </div>
              <p
                className={`text-xs mt-2 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Spunta &ldquo;Verbalizzazione&rdquo; su ciascun modulo
              </p>
            </div>
          </section>

          {/* BARRA AGGIUNTA NUOVO MODULO TIROCINIO + ESPANDI/COMPRIMI TUTTI */}
          <section
            className={`rounded-2xl border p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 ${cardSurfaceClass}`}
          >
            <div>
              <h2
                className={`text-sm sm:text-base font-bold ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}
              >
                Moduli di Tirocinio Clinico
              </h2>
              <p
                className={`text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Clicca sul titolo o sulla freccia per aprire/chiudere un modulo;
                modifica stato, durata e date direttamente nelle tabelle
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {tirociniList.length > 1 && (
                <button
                  type="button"
                  onClick={handleToggleAllTirocini}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer shrink-0 ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                  <span>
                    {areAllTirociniExpanded ? 'Comprimi tutti' : 'Espandi tutti'}
                  </span>
                </button>
              )}

              <form
                onSubmit={handleAddTirocinioModule}
                className="flex items-center gap-2 flex-1 sm:flex-initial"
              >
                <input
                  type="text"
                  placeholder="Nuovo modulo (es. Tirocinio 4, TPV...)"
                  value={newTirocinioModuleName}
                  onChange={(e) => setNewTirocinioModuleName(e.target.value)}
                  className={`flex-1 sm:w-64 rounded-xl border px-3 py-2 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Modulo
                </button>
              </form>
            </div>
          </section>

          {/* ELENCO MODULI TIROCINIO (A TENDINA / ACCORDION) */}
          <section className="space-y-4">
            {tirociniList.map((mod) => {
              const isModExpanded = Boolean(expandedTirocini[mod.id]);
              const modTotalDays = (mod.rotations || []).reduce(
                (acc, r) => acc + (Number(r.durationDays) || 0),
                0
              );
              const modDoneDays = (mod.rotations || []).reduce(
                (acc, r) =>
                  r.status === 'done'
                    ? acc + (Number(r.durationDays) || 0)
                    : acc,
                0
              );
              const modDoneCount = (mod.rotations || []).filter(
                (r) => r.status === 'done'
              ).length;
              const modInProgressCount = (mod.rotations || []).filter(
                (r) => r.status === 'in_progress'
              ).length;
              const modPct =
                modTotalDays > 0
                  ? Math.min(100, (modDoneDays / modTotalDays) * 100)
                  : 0;

              const draft = newRotationDrafts[mod.id] || {
                icon: '🏥',
                name: '',
                durationDays: 5,
                startDate: '',
                endDate: '',
                status: 'not_started',
              };

              return (
                <div
                  key={mod.id}
                  className={`rounded-2xl border shadow-sm overflow-hidden ${cardSurfaceClass}`}
                >
                  {/* HEADER MODULO TIROCINIO (ACCORDION TRIGGER) */}
                  <div
                    className={`px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 ${
                      isModExpanded
                        ? `border-b ${
                            isDark
                              ? 'border-slate-800 bg-slate-800/35'
                              : 'border-slate-100 bg-slate-50/70'
                          }`
                        : isDark
                        ? 'hover:bg-slate-800/25'
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTirocinioExpanded(mod.id)}
                        className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                          isDark
                            ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                        }`}
                        title={
                          isModExpanded ? 'Chiudi modulo' : 'Espandi modulo'
                        }
                        aria-expanded={isModExpanded}
                      >
                        {isModExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      {editingTirocinioId === mod.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingTirocinioTitle}
                            onChange={(e) =>
                              setEditingTirocinioTitle(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter')
                                handleRenameTirocinioModule(mod.id);
                              if (e.key === 'Escape')
                                setEditingTirocinioId(null);
                            }}
                            autoFocus
                            className={`rounded-lg border px-2.5 py-1 text-sm font-bold ${inputSurfaceClass}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameTirocinioModule(mod.id)}
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-950/40 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleTirocinioExpanded(mod.id)}
                            className="text-left min-w-0 cursor-pointer"
                          >
                            <h3
                              className={`text-base sm:text-lg font-extrabold truncate ${
                                isDark ? 'text-slate-100' : 'text-slate-900'
                              }`}
                            >
                              {mod.name}
                            </h3>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTirocinioId(mod.id);
                              setEditingTirocinioTitle(mod.name);
                            }}
                            className={`p-1 rounded-lg transition cursor-pointer shrink-0 ${
                              isDark
                                ? 'text-slate-500 hover:text-indigo-400 hover:bg-slate-800'
                                : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70'
                            }`}
                            title="Rinomina modulo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                          modTotalDays > 0 && modDoneDays === modTotalDays
                            ? isDark
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/70'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : indigoPillClass
                        }`}
                      >
                        {modDoneDays} / {modTotalDays} gg
                      </span>

                      <span
                        className={`hidden sm:inline text-xs ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        ({modDoneCount}/{(mod.rotations || []).length} reparti
                        {modInProgressCount > 0
                          ? ` · ${modInProgressCount} in corso`
                          : ''}
                        )
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleTirocinioVerbalizzato(mod.id)
                        }
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          mod.verbalizzato
                            ? isDark
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {mod.verbalizzato ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Square className="w-4 h-4 opacity-60" />
                        )}
                        <span>
                          Verbalizzazione: {mod.verbalizzato ? 'Sì' : 'No'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTirocinioModule(mod.id)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          isDark
                            ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-950/60'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title="Elimina modulo tirocinio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* CONTENUTO A TENDINA DEL MODULO */}
                  {isModExpanded && (
                    <>
                      {/* BARRA PROGRESSO MODULO */}
                      <div
                        className={`w-full h-1.5 ${
                          isDark ? 'bg-slate-800' : 'bg-slate-100'
                        }`}
                      >
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${modPct}%` }}
                        />
                      </div>

                      {/* TABELLA REPARTI */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm min-w-[740px]">
                          <thead>
                            <tr
                              className={`border-b text-[11px] uppercase tracking-wider ${
                                isDark
                                  ? 'border-slate-800 text-slate-400 bg-slate-900/60'
                                  : 'border-slate-200 text-slate-500 bg-slate-50/40'
                              }`}
                            >
                              <th className="py-2.5 pl-4 sm:pl-5 pr-2 font-bold">
                                Reparto
                              </th>
                              <th className="py-2.5 px-2 font-bold w-28">
                                Durata (gg)
                              </th>
                              <th className="py-2.5 px-2 font-bold w-36">
                                Stato
                              </th>
                              <th className="py-2.5 px-2 font-bold w-40">
                                Data inizio
                              </th>
                              <th className="py-2.5 px-2 font-bold w-40">
                                Data fine
                              </th>
                              <th className="py-2.5 pl-2 pr-4 sm:pr-5 font-bold text-right w-14">
                                Azioni
                              </th>
                            </tr>
                          </thead>
                          <tbody
                            className={`divide-y ${
                              isDark
                                ? 'divide-slate-800/80'
                                : 'divide-slate-100'
                            }`}
                          >
                            {(mod.rotations || []).length === 0 ? (
                              <tr>
                                <td
                                  colSpan={6}
                                  className={`py-6 text-center text-xs ${
                                    isDark
                                      ? 'text-slate-400'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  Nessun reparto inserito in questo modulo.
                                  Aggiungilo dalla riga qui sotto!
                                </td>
                              </tr>
                            ) : (
                              (mod.rotations || []).map((rot) => {
                                const statusSelectClass =
                                  rot.status === 'done'
                                    ? isDark
                                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : rot.status === 'in_progress'
                                    ? isDark
                                      ? 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                    : isDark
                                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                                    : 'bg-slate-100 text-slate-700 border-slate-200';

                                return (
                                  <tr
                                    key={rot.id}
                                    className={`transition ${
                                      isDark
                                        ? 'hover:bg-slate-800/40'
                                        : 'hover:bg-slate-50/70'
                                    }`}
                                  >
                                    <td className="py-2.5 pl-4 sm:pl-5 pr-2">
                                      <div className="flex items-center gap-2">
                                        <select
                                          aria-label="Icona reparto"
                                          value={rot.icon || '🏥'}
                                          onChange={(e) =>
                                            handleUpdateRotation(
                                              mod.id,
                                              rot.id,
                                              {
                                                icon: e.target.value,
                                              }
                                            )
                                          }
                                          className={`rounded-lg border px-1.5 py-1 text-base cursor-pointer ${
                                            isDark
                                              ? 'bg-slate-800 border-slate-700'
                                              : 'bg-slate-50 border-slate-200'
                                          }`}
                                        >
                                          {TIROCINIO_ICONS.map((ic) => (
                                            <option key={ic} value={ic}>
                                              {ic}
                                            </option>
                                          ))}
                                        </select>
                                        <input
                                          type="text"
                                          value={rot.name}
                                          onChange={(e) =>
                                            handleUpdateRotation(
                                              mod.id,
                                              rot.id,
                                              {
                                                name: e.target.value,
                                              }
                                            )
                                          }
                                          placeholder="Nome reparto..."
                                          className={`w-full rounded-lg border px-2.5 py-1 text-xs sm:text-sm font-semibold ${inputSurfaceClass}`}
                                        />
                                      </div>
                                    </td>

                                    <td className="py-2.5 px-2">
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          min="1"
                                          max="120"
                                          value={rot.durationDays}
                                          onChange={(e) =>
                                            handleUpdateRotation(
                                              mod.id,
                                              rot.id,
                                              {
                                                durationDays: Math.max(
                                                  1,
                                                  Number(e.target.value) || 1
                                                ),
                                              }
                                            )
                                          }
                                          className={`w-16 rounded-lg border px-2 py-1 text-xs sm:text-sm font-bold text-center ${inputSurfaceClass}`}
                                        />
                                        <span
                                          className={`text-xs ${
                                            isDark
                                              ? 'text-slate-400'
                                              : 'text-slate-500'
                                          }`}
                                        >
                                          gg
                                        </span>
                                      </div>
                                    </td>

                                    <td className="py-2.5 px-2">
                                      <select
                                        aria-label="Stato reparto"
                                        value={rot.status || 'not_started'}
                                        onChange={(e) =>
                                          handleUpdateRotation(mod.id, rot.id, {
                                            status: e.target.value,
                                          })
                                        }
                                        className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${statusSelectClass}`}
                                      >
                                        <option value="not_started">
                                          Non iniziato
                                        </option>
                                        <option value="in_progress">
                                          In corso
                                        </option>
                                        <option value="done">Fatto</option>
                                      </select>
                                    </td>

                                    <td className="py-2.5 px-2">
                                      <input
                                        type="date"
                                        value={rot.startDate || ''}
                                        onChange={(e) =>
                                          handleUpdateRotation(mod.id, rot.id, {
                                            startDate: e.target.value,
                                          })
                                        }
                                        className={`w-full rounded-lg border px-2 py-1 text-xs ${inputSurfaceClass}`}
                                      />
                                    </td>

                                    <td className="py-2.5 px-2">
                                      <input
                                        type="date"
                                        value={rot.endDate || ''}
                                        onChange={(e) =>
                                          handleUpdateRotation(mod.id, rot.id, {
                                            endDate: e.target.value,
                                          })
                                        }
                                        className={`w-full rounded-lg border px-2 py-1 text-xs ${inputSurfaceClass}`}
                                      />
                                    </td>

                                    <td className="py-2.5 pl-2 pr-4 sm:pr-5 text-right">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteRotation(mod.id, rot.id)
                                        }
                                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                                          isDark
                                            ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-950/60'
                                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                        }`}
                                        title="Rimuovi reparto"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* FORM AGGIUNTA RAPIDA NUOVO REPARTO */}
                      <form
                        onSubmit={(e) => handleAddRotation(e, mod.id)}
                        className={`px-4 sm:px-5 py-3 border-t grid grid-cols-1 sm:grid-cols-12 gap-2 items-center ${
                          isDark
                            ? 'border-slate-800 bg-slate-900/40'
                            : 'border-slate-100 bg-slate-50/60'
                        }`}
                      >
                        <div className="sm:col-span-4 flex items-center gap-2">
                          <select
                            aria-label="Icona nuovo reparto"
                            value={draft.icon}
                            onChange={(e) =>
                              setNewRotationDrafts((prev) => ({
                                ...prev,
                                [mod.id]: { ...draft, icon: e.target.value },
                              }))
                            }
                            className={`rounded-xl border px-2 py-1.5 text-base cursor-pointer ${inputMutedSurfaceClass}`}
                          >
                            {TIROCINIO_ICONS.map((ic) => (
                              <option key={ic} value={ic}>
                                {ic}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Nuovo reparto (es. Chirurgia Generale)"
                            value={draft.name}
                            onChange={(e) =>
                              setNewRotationDrafts((prev) => ({
                                ...prev,
                                [mod.id]: { ...draft, name: e.target.value },
                              }))
                            }
                            className={`w-full rounded-xl border px-3 py-1.5 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
                          />
                        </div>

                        <div className="sm:col-span-2 flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={draft.durationDays}
                            onChange={(e) =>
                              setNewRotationDrafts((prev) => ({
                                ...prev,
                                [mod.id]: {
                                  ...draft,
                                  durationDays: e.target.value,
                                },
                              }))
                            }
                            className={`w-full rounded-xl border px-2.5 py-1.5 text-xs sm:text-sm font-semibold ${inputMutedSurfaceClass}`}
                          />
                          <span
                            className={`text-xs shrink-0 ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            gg
                          </span>
                        </div>

                        <div className="sm:col-span-2">
                          <select
                            aria-label="Stato nuovo reparto"
                            value={draft.status}
                            onChange={(e) =>
                              setNewRotationDrafts((prev) => ({
                                ...prev,
                                [mod.id]: { ...draft, status: e.target.value },
                              }))
                            }
                            className={`w-full rounded-xl border px-2.5 py-1.5 text-xs font-semibold cursor-pointer ${inputMutedSurfaceClass}`}
                          >
                            <option value="not_started">Non iniziato</option>
                            <option value="in_progress">In corso</option>
                            <option value="done">Fatto</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <input
                            type="date"
                            title="Data inizio"
                            value={draft.startDate}
                            onChange={(e) =>
                              setNewRotationDrafts((prev) => ({
                                ...prev,
                                [mod.id]: {
                                  ...draft,
                                  startDate: e.target.value,
                                },
                              }))
                            }
                            className={`w-full rounded-xl border px-2.5 py-1.5 text-xs ${inputMutedSurfaceClass}`}
                          />
                        </div>

                        <div className="sm:col-span-2 flex items-center gap-2">
                          <input
                            type="date"
                            title="Data fine"
                            value={draft.endDate}
                            onChange={(e) =>
                              setNewRotationDrafts((prev) => ({
                                ...prev,
                                [mod.id]: { ...draft, endDate: e.target.value },
                              }))
                            }
                            className={`w-full rounded-xl border px-2.5 py-1.5 text-xs ${inputMutedSurfaceClass}`}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer shrink-0"
                            title="Aggiungi reparto"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              );
            })}
          </section>
        </main>
      ) : activeTab === 'libretto' ? (
        <main className="w-full px-3 sm:px-6 lg:px-8 py-5 space-y-5">
          {/* SELETTORE ANNI (1° - 6° ANNO) */}
          <section
            className={`rounded-2xl border p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 ${cardSurfaceClass}`}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((yr) => {
                const blocksInYr = medYears[yr] || [];
                const active = selectedMedYear === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedMedYear(yr)}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isDark
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{yr}° Anno</span>
                    {blocksInYr.length > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          active
                            ? 'bg-white/20 text-white'
                            : isDark
                            ? 'bg-slate-700 text-slate-300'
                            : 'bg-white text-slate-600'
                        }`}
                      >
                        {blocksInYr.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {currentYearBlocks.length > 1 && (
                <button
                  type="button"
                  onClick={handleToggleAllCurrentBlocks}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                  <span>
                    {areAllCurrentBlocksExpanded
                      ? 'Comprimi tutti'
                      : 'Espandi tutti'}
                  </span>
                </button>
              )}

              <form
                onSubmit={handleAddMedBlock}
                className="flex items-center gap-2 flex-1 sm:flex-initial"
              >
                <input
                  type="text"
                  placeholder={`Nuovo blocco ${selectedMedYear}° anno...`}
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                  className={`flex-1 sm:w-64 rounded-xl border px-3 py-2 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Blocco
                </button>
              </form>
            </div>
          </section>

          {/* ELENCO BLOCCHI DELL'ANNO SELEZIONATO */}
          {currentYearBlocks.length === 0 ? (
            <div
              className={`rounded-2xl border border-dashed p-10 text-center ${
                isDark
                  ? 'border-slate-800 bg-slate-900/40 text-slate-400'
                  : 'border-slate-300 bg-white text-slate-500'
              }`}
            >
              <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold">
                Nessun blocco inserito per il {selectedMedYear}° anno.
              </p>
              <p className="text-xs mt-1">
                Usa la barra qui sopra per aggiungere un esame integrato e le
                relative materie con CFU e voti!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentYearBlocks.map((block, bIdx) => {
                const isExpanded = Boolean(expandedBlocks[block.id]);
                const totalCfu = (block.subjects || []).reduce(
                  (acc, s) => acc + (Number(s.cfu) || 0),
                  0
                );
                const gradedSubs = (block.subjects || []).filter(
                  (s) =>
                    s.grade !== null &&
                    s.grade !== undefined &&
                    s.grade !== ''
                );
                const gradedCfu = gradedSubs.reduce(
                  (acc, s) => acc + (Number(s.cfu) || 0),
                  0
                );
                const weightedSum = gradedSubs.reduce(
                  (acc, s) => acc + Number(s.grade) * (Number(s.cfu) || 0),
                  0
                );
                const weightedAvg =
                  gradedCfu > 0 ? weightedSum / gradedCfu : null;
                const roundedBlockGrade =
                  weightedAvg !== null ? Math.round(weightedAvg) : null;
                const isAllComplete =
                  (block.subjects || []).length > 0 &&
                  gradedSubs.length === block.subjects.length;

                const subDraft = newSubjectDrafts[block.id] || {
                  name: '',
                  cfu: '6',
                  grade: '',
                };

                return (
                  <div
                    key={block.id}
                    draggable={blockDragReadyId === block.id}
                    onDragStart={(e) => {
                      setDraggedBlockId(block.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverBlockIdx !== bIdx) setDragOverBlockIdx(bIdx);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropMedBlock(bIdx);
                    }}
                    onDragEnd={() => {
                      setDraggedBlockId(null);
                      setDragOverBlockIdx(null);
                      setBlockDragReadyId(null);
                    }}
                    className={`rounded-2xl border shadow-sm overflow-hidden transition ${cardSurfaceClass} ${
                      dragOverBlockIdx === bIdx && draggedBlockId !== block.id
                        ? 'ring-2 ring-indigo-500'
                        : ''
                    }`}
                  >
                    {/* HEADER DEL BLOCCO */}
                    <div
                      className={`px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 ${
                        isExpanded
                          ? `border-b ${
                              isDark
                                ? 'border-slate-800 bg-slate-800/35'
                                : 'border-slate-100 bg-slate-50/70'
                            }`
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleBlockExpanded(block.id)}
                          className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                            isDark
                              ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        {editingBlockId === block.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingBlockTitle}
                              onChange={(e) =>
                                setEditingBlockTitle(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter')
                                  handleRenameMedBlock(
                                    selectedMedYear,
                                    block.id
                                  );
                                if (e.key === 'Escape')
                                  setEditingBlockId(null);
                              }}
                              autoFocus
                              className={`rounded-lg border px-2.5 py-1 text-sm font-bold ${inputSurfaceClass}`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleRenameMedBlock(selectedMedYear, block.id)
                              }
                              className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-950/40 cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleBlockExpanded(block.id)}
                              className="text-left min-w-0 cursor-pointer"
                            >
                              <h3
                                className={`text-sm sm:text-base font-extrabold truncate ${
                                  isDark ? 'text-slate-100' : 'text-slate-900'
                                }`}
                              >
                                {block.name}
                              </h3>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBlockId(block.id);
                                setEditingBlockTitle(block.name);
                              }}
                              className={`p-1 rounded-lg transition cursor-pointer shrink-0 ${
                                isDark
                                  ? 'text-slate-500 hover:text-indigo-400 hover:bg-slate-800'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/70'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                            isDark
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {totalCfu} CFU
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {weightedAvg !== null ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs ${
                                isDark ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              Media pond.:{' '}
                              <strong
                                className={
                                  isDark ? 'text-slate-200' : 'text-slate-800'
                                }
                              >
                                {weightedAvg.toFixed(2)}
                              </strong>
                            </span>
                            <span
                              className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${
                                isAllComplete
                                  ? isDark
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : indigoPillClass
                              }`}
                            >
                              Voto Blocco: {roundedBlockGrade}/30
                            </span>
                          </div>
                        ) : (
                          <span
                            className={`text-xs italic ${
                              isDark ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            Nessun voto inserito
                          </span>
                        )}

                        {isBlockReorderMode && (
                          <div className="inline-flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveBlockUp(bIdx)}
                              disabled={bIdx === 0}
                              className="p-1.5 rounded-lg disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBlockDown(bIdx)}
                              disabled={bIdx === currentYearBlocks.length - 1}
                              className="p-1.5 rounded-lg disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <span
                              onMouseDown={() => setBlockDragReadyId(block.id)}
                              onMouseUp={() => setBlockDragReadyId(null)}
                              className="p-1.5 cursor-grab"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteMedBlock(selectedMedYear, block.id)
                          }
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            isDark
                              ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-950/60'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Elimina blocco"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* CONTENUTO ESPANSO DEL BLOCCO */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 space-y-3">
                        {(block.subjects || []).length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm min-w-[440px]">
                              <thead>
                                <tr
                                  className={`border-b text-[11px] uppercase tracking-wider ${
                                    isDark
                                      ? 'border-slate-800 text-slate-400'
                                      : 'border-slate-200 text-slate-500'
                                  }`}
                                >
                                  <th className="py-2 font-bold">
                                    Modulo / Insegnamento
                                  </th>
                                  <th className="py-2 font-bold w-24">CFU</th>
                                  <th className="py-2 font-bold w-32">Voto</th>
                                  <th className="py-2 font-bold text-right w-14">
                                    Azioni
                                  </th>
                                </tr>
                              </thead>
                              <tbody
                                className={`divide-y ${
                                  isDark
                                    ? 'divide-slate-800/80'
                                    : 'divide-slate-100'
                                }`}
                              >
                                {block.subjects.map((sub) => {
                                  const selectVal =
                                    sub.grade === null ||
                                    sub.grade === undefined
                                      ? ''
                                      : sub.grade === 30 && sub.lode
                                      ? '30L'
                                      : String(sub.grade);

                                  return (
                                    <tr key={sub.id}>
                                      <td className="py-2 pr-2">
                                        <input
                                          type="text"
                                          value={sub.name}
                                          onChange={(e) =>
                                            handleUpdateMedSubject(
                                              selectedMedYear,
                                              block.id,
                                              sub.id,
                                              { name: e.target.value }
                                            )
                                          }
                                          className={`w-full rounded-lg border px-2.5 py-1 text-xs sm:text-sm font-medium ${inputSurfaceClass}`}
                                        />
                                      </td>
                                      <td className="py-2 pr-2">
                                        <input
                                          type="number"
                                          min="0.5"
                                          step="0.5"
                                          value={sub.cfu}
                                          onChange={(e) =>
                                            handleUpdateMedSubject(
                                              selectedMedYear,
                                              block.id,
                                              sub.id,
                                              {
                                                cfu: Math.max(
                                                  0.5,
                                                  Number(e.target.value) || 0.5
                                                ),
                                              }
                                            )
                                          }
                                          className={`w-20 rounded-lg border px-2 py-1 text-xs sm:text-sm font-semibold ${inputSurfaceClass}`}
                                        />
                                      </td>
                                      <td className="py-2 pr-2">
                                        <select
                                          value={selectVal}
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            if (v === '') {
                                              handleUpdateMedSubject(
                                                selectedMedYear,
                                                block.id,
                                                sub.id,
                                                { grade: null, lode: false }
                                              );
                                            } else if (v === '30L') {
                                              handleUpdateMedSubject(
                                                selectedMedYear,
                                                block.id,
                                                sub.id,
                                                { grade: 30, lode: true }
                                              );
                                            } else {
                                              handleUpdateMedSubject(
                                                selectedMedYear,
                                                block.id,
                                                sub.id,
                                                {
                                                  grade: Number(v),
                                                  lode: false,
                                                }
                                              );
                                            }
                                          }}
                                          className={`w-full rounded-lg border px-2 py-1 text-xs sm:text-sm font-bold ${inputSurfaceClass}`}
                                        >
                                          <option value="">— Da dare —</option>
                                          {Array.from(
                                            { length: 13 },
                                            (_, i) => 18 + i
                                          ).map((g) => (
                                            <option key={g} value={String(g)}>
                                              {g}
                                            </option>
                                          ))}
                                          <option value="30L">30 e Lode</option>
                                        </select>
                                      </td>
                                      <td className="py-2 text-right">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteMedSubject(
                                              selectedMedYear,
                                              block.id,
                                              sub.id
                                            )
                                          }
                                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                                            isDark
                                              ? 'text-slate-500 hover:text-rose-400'
                                              : 'text-slate-400 hover:text-rose-600'
                                          }`}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        <form
                          onSubmit={(e) =>
                            handleAddMedSubject(e, selectedMedYear, block.id)
                          }
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-1"
                        >
                          <div className="sm:col-span-6">
                            <input
                              type="text"
                              placeholder="Nuova materia nel blocco..."
                              value={subDraft.name}
                              onChange={(e) =>
                                setNewSubjectDrafts((prev) => ({
                                  ...prev,
                                  [block.id]: {
                                    ...subDraft,
                                    name: e.target.value,
                                  },
                                }))
                              }
                              className={`w-full rounded-xl border px-3 py-1.5 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              placeholder="CFU"
                              value={subDraft.cfu}
                              onChange={(e) =>
                                setNewSubjectDrafts((prev) => ({
                                  ...prev,
                                  [block.id]: {
                                    ...subDraft,
                                    cfu: e.target.value,
                                  },
                                }))
                              }
                              className={`w-full rounded-xl border px-3 py-1.5 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <select
                              value={subDraft.grade}
                              onChange={(e) =>
                                setNewSubjectDrafts((prev) => ({
                                  ...prev,
                                  [block.id]: {
                                    ...subDraft,
                                    grade: e.target.value,
                                  },
                                }))
                              }
                              className={`w-full rounded-xl border px-2.5 py-1.5 text-xs sm:text-sm ${inputMutedSurfaceClass}`}
                            >
                              <option value="">Voto (opz.)</option>
                              {Array.from(
                                { length: 13 },
                                (_, i) => 18 + i
                              ).map((g) => (
                                <option key={g} value={String(g)}>
                                  {g}
                                </option>
                              ))}
                              <option value="30L">30L</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <button
                              type="submit"
                              className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Aggiungi
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      ) : (
        <main className="w-full px-3 sm:px-6 lg:px-8 py-5 space-y-5">
          <section
            aria-live="polite"
            className={`rounded-2xl border p-4 sm:p-5 transition-all duration-300 shadow-sm ${statusStyles.wrapper}`}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className={`p-2.5 rounded-xl shrink-0 shadow-sm ${statusStyles.iconBg}`}
              >
                <StatusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusStyles.badge}`}
                  >
                    {statusStyles.statusTitle}
                  </span>
                  <span className="text-xs opacity-75">
                    • Termine prima lettura:{' '}
                    <strong>{formatShortDate(analytics.studyDeadline)}</strong>
                  </span>
                </div>
                <h2
                  className={`text-sm sm:text-lg font-extrabold leading-snug ${statusStyles.headlineColor}`}
                >
                  {statusStyles.statusHeadline}
                </h2>
                <p
                  className={`text-xs sm:text-sm mt-1 leading-relaxed ${statusStyles.detailColor}`}
                >
                  {statusStyles.statusDetail}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div
              className={`rounded-2xl border p-4 shadow-sm ${cardSurfaceClass}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Avanzamento
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${indigoPillClass}`}
                >
                  {analytics.completionPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl sm:text-3xl font-extrabold ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  {analytics.completedPages}
                </span>
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  / {analytics.totalPages} pag
                </span>
              </div>
              <div
                className={`w-full h-2 rounded-full overflow-hidden mt-3 ${
                  isDark ? 'bg-slate-800' : 'bg-slate-100'
                }`}
              >
                <div
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${analytics.completionPct}%` }}
                />
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 shadow-sm ${cardSurfaceClass}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Tempo Rimanente
                </span>
                <Calendar
                  className={`w-4 h-4 ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl sm:text-3xl font-extrabold ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  {analytics.remainingUsefulDays}
                </span>
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  gg utili studio
                </span>
              </div>
              <p
                className={`text-xs mt-2 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {analytics.daysToExam} gg totali all&apos;appello (
                {analytics.safeReviewDays} ripasso)
              </p>
            </div>

            <div
              className={`rounded-2xl border p-4 shadow-sm ${cardSurfaceClass}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Ritmo Reale Attuale
                </span>
                <Clock
                  className={`w-4 h-4 ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl sm:text-3xl font-extrabold ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  {analytics.realDailyAvg.toFixed(1)}
                </span>
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  pag/giorno
                </span>
              </div>
              <p
                className={`text-xs mt-2 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Ritmo iniziale previsto: {analytics.initialMinPace.toFixed(1)}{' '}
                pag/gg
              </p>
            </div>

            <div
              className={`rounded-2xl border p-4 shadow-sm ${
                analytics.status === 'red'
                  ? isDark
                    ? 'bg-rose-950/35 border-rose-800/80'
                    : 'bg-rose-50/40 border-rose-300'
                  : analytics.status === 'yellow'
                  ? isDark
                    ? 'bg-amber-950/35 border-amber-800/80'
                    : 'bg-amber-50/40 border-amber-300'
                  : cardSurfaceClass
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Nuovo Ritmo Necessario
                </span>
                <Target
                  className={`w-4 h-4 ${
                    analytics.status === 'red'
                      ? isDark
                        ? 'text-rose-400'
                        : 'text-rose-600'
                      : isDark
                      ? 'text-indigo-400'
                      : 'text-indigo-600'
                  }`}
                />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl sm:text-3xl font-extrabold ${
                    analytics.status === 'red'
                      ? isDark
                        ? 'text-rose-400'
                        : 'text-rose-600'
                      : isDark
                      ? 'text-indigo-400'
                      : 'text-indigo-600'
                  }`}
                >
                  {analytics.newRequiredPace.toFixed(1)}
                </span>
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  pag/giorno
                </span>
              </div>
              <p
                className={`text-xs mt-2 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Mancano <strong>{analytics.remainingPages} pagine</strong>
              </p>
            </div>
          </section>

          {(isReorderMode || isCustomLayout) && (
            <div
              className={`rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
                isReorderMode
                  ? isDark
                    ? 'bg-indigo-950/50 border-indigo-800/80'
                    : 'bg-indigo-50/80 border-indigo-200'
                  : isDark
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <LayoutGrid
                  className={`w-4 h-4 shrink-0 ${
                    isDark ? 'text-indigo-400' : 'text-indigo-600'
                  }`}
                />
                <span
                  className={`font-medium ${
                    isDark ? 'text-slate-200' : 'text-slate-700'
                  }`}
                >
                  {isReorderMode
                    ? 'Trascina la maniglia o usa le frecce su ciascuna scheda per spostarla in alto, in basso o tra le colonne.'
                    : 'Disposizione personalizzata attiva.'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isCustomLayout && (
                  <button
                    type="button"
                    onClick={handleResetLayout}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Ripristina layout predefinito
                  </button>
                )}
                {isReorderMode && (
                  <button
                    type="button"
                    onClick={() => setIsReorderMode(false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Fatto
                  </button>
                )}
              </div>
            </div>
          )}

          <div
            className={`grid grid-cols-1 gap-5 items-start ${
              layout.left.length > 0 && layout.right.length > 0
                ? 'lg:grid-cols-12'
                : 'lg:grid-cols-1'
            }`}
          >
            {(layout.left.length > 0 || draggedSection) && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (
                    dragOverTarget?.col !== 'left' ||
                    dragOverTarget?.index !== layout.left.length
                  ) {
                    setDragOverTarget({
                      col: 'left',
                      index: layout.left.length,
                    });
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropSection('left', layout.left.length);
                }}
                className={`${
                  layout.right.length > 0 || draggedSection
                    ? 'lg:col-span-8'
                    : 'lg:col-span-1'
                } space-y-5 min-h-[120px] rounded-2xl transition-colors ${
                  layout.left.length === 0 && draggedSection
                    ? isDark
                      ? 'border-2 border-dashed border-indigo-700 bg-indigo-950/30 p-4'
                      : 'border-2 border-dashed border-indigo-300 bg-indigo-50/40 p-4'
                    : ''
                }`}
              >
                {layout.left.map((secId, idx) =>
                  renderSection(secId, 'left', idx, layout.left.length)
                )}
                {layout.left.length === 0 && draggedSection && (
                  <div
                    className={`h-24 flex items-center justify-center text-xs font-semibold ${
                      isDark ? 'text-indigo-400' : 'text-indigo-600'
                    }`}
                  >
                    Rilascia qui per inserire nella colonna principale
                  </div>
                )}
              </div>
            )}

            {(layout.right.length > 0 || draggedSection) && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (
                    dragOverTarget?.col !== 'right' ||
                    dragOverTarget?.index !== layout.right.length
                  ) {
                    setDragOverTarget({
                      col: 'right',
                      index: layout.right.length,
                    });
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropSection('right', layout.right.length);
                }}
                className={`${
                  layout.left.length > 0 || draggedSection
                    ? 'lg:col-span-4'
                    : 'lg:col-span-1'
                } space-y-5 min-h-[120px] rounded-2xl transition-colors ${
                  layout.right.length === 0 && draggedSection
                    ? isDark
                      ? 'border-2 border-dashed border-indigo-700 bg-indigo-950/30 p-4'
                      : 'border-2 border-dashed border-indigo-300 bg-indigo-50/40 p-4'
                    : ''
                }`}
              >
                {layout.right.map((secId, idx) =>
                  renderSection(secId, 'right', idx, layout.right.length)
                )}
                {layout.right.length === 0 && draggedSection && (
                  <div
                    className={`h-24 flex items-center justify-center text-xs font-semibold ${
                      isDark ? 'text-indigo-400' : 'text-indigo-600'
                    }`}
                  >
                    Rilascia qui per inserire nella colonna laterale
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
