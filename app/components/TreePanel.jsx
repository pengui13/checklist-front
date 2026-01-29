'use client';

import { useEffect, useMemo, useState } from 'react';

function safeDate(d) {
  if (!d) return null;
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? null : x;
}

function fmtDate(d) {
  const x = safeDate(d);
  if (!x) return '—';
  return x.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusConfig(status) {
  const configs = {
    new: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Neu' },
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Aktiv' },
    completed: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'Fertig' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Storniert' },
    expired: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Abgelaufen' },
  };
  return configs[status] || configs.new;
}

function getLevelColor(level) {
  const colors = [
    { text: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { text: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
    { text: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
    { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  ];
  return colors[(Math.max(level, 1) - 1) % colors.length];
}

export default function TreePanel({
  selectedProject,
  tasks,
  tasksLoading,
  onCreateTask,
  onOpenTaskDetail, // ✅ NEW: pass the whole task object
}) {
  const [expandedLevels, setExpandedLevels] = useState({});
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const taskLevels = useMemo(() => {
    const sorted = [...(tasks || [])].sort((a, b) => (Number(a.level) || 1) - (Number(b.level) || 1));
    const max = sorted.length ? Math.max(...sorted.map((t) => Number(t.level) || 1)) : 0;

    const levels = {};
    for (let i = 1; i <= max; i++) levels[i] = [];
    for (const t of sorted) {
      const lvl = Number(t.level) || 1;
      if (!levels[lvl]) levels[lvl] = [];
      levels[lvl].push(t);
    }
    return levels;
  }, [tasks]);

  const maxLevel = useMemo(() => Object.keys(taskLevels).length, [taskLevels]);

  const allExpanded = useMemo(() => {
    const keys = Object.keys(taskLevels);
    if (!keys.length) return false;
    return keys.every((k) => Boolean(expandedLevels[k]));
  }, [expandedLevels, taskLevels]);

  useEffect(() => {
    const next = {};
    (tasks || []).forEach((t) => {
      const lvl = Number(t.level) || 1;
      next[lvl] = true;
    });
    setExpandedLevels(next);
    setSelectedTaskId(null);
  }, [tasks]);

  useEffect(() => {
    setExpandedLevels({});
    setSelectedTaskId(null);
  }, [selectedProject?.id]);

  const toggleLevel = (level) => {
    setExpandedLevels((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  return (
    <section className="lg:col-span-9 h-full">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden h-full flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 bg-white">
          {!selectedProject ? (
            <div>
              <h2 className="text-lg font-bold text-gray-900">Aufgabenbaum</h2>
              <p className="text-sm text-gray-600 mt-1">Wähle links ein Projekt aus.</p>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">{selectedProject.name}</h2>
                <p className="text-xs text-gray-600 mt-1">
                  {tasksLoading
                    ? 'Lade Aufgaben…'
                    : `${(tasks || []).length} Aufgabe${(tasks || []).length !== 1 ? 'n' : ''} • ${maxLevel} Level${
                        maxLevel !== 1 ? 's' : ''
                      }`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onCreateTask}
                  disabled={!selectedProject}
                  className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 font-medium text-sm"
                >
                  + Neue Aufgabe
                </button>
              </div>
            </div>
          )}

          {selectedProject && maxLevel > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500 mr-2">Level:</span>

              <button
                onClick={() => {
                  const next = {};
                  Object.keys(taskLevels).forEach((l) => (next[l] = !allExpanded));
                  setExpandedLevels(next);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                  allExpanded ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                Alle
              </button>

              {Object.keys(taskLevels).map((level) => {
                const levelNum = Number(level);
                const c = getLevelColor(levelNum);
                const expanded = Boolean(expandedLevels[level]);

                return (
                  <button
                    key={level}
                    onClick={() => toggleLevel(levelNum)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                      expanded ? `${c.bg} ${c.text} ${c.border}` : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    L{level}
                    <span className="ml-1 opacity-70">({taskLevels[level].length})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!selectedProject ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777" />
                  </svg>
                </div>
                <p className="text-gray-900 font-semibold">Wähle ein Projekt</p>
                <p className="text-gray-600 text-sm mt-1">Dann erscheint hier der Aufgabenbaum.</p>
              </div>
            </div>
          ) : tasksLoading ? (
            <div className="flex items-center gap-3 text-gray-900">
              <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Lade Aufgaben…</span>
            </div>
          ) : (tasks || []).length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-900 font-semibold">Keine Aufgaben vorhanden</p>
                <p className="text-gray-600 text-sm mt-1">Erstelle die erste Aufgabe für dieses Projekt.</p>
                <button
                  onClick={onCreateTask}
                  className="mt-4 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 text-sm font-medium"
                >
                  Aufgabe erstellen
                </button>
              </div>
            </div>
          ) : (
            <div className="font-mono text-sm">
              <div className="flex items-center gap-2 text-gray-900 font-semibold mb-3">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {selectedProject.name}
              </div>

              {Object.entries(taskLevels).map(([level, levelTasks], levelIndex) => {
                const isLastLevel = levelIndex === Object.keys(taskLevels).length - 1;
                const expanded = Boolean(expandedLevels[level]);
                const levelNum = Number(level);
                const c = getLevelColor(levelNum);

                return (
                  <div key={level} className="ml-2">
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-xl group"
                      onClick={() => toggleLevel(levelNum)}
                      title="Level ein-/ausklappen"
                    >
                      <span className="text-gray-300 select-none w-4">{isLastLevel ? '└' : '├'}</span>
                      <span className="text-gray-300 select-none">──</span>
                      <svg className={`w-4 h-4 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <span className={`font-semibold ${c.text}`}>level-{level}/</span>
                      <span className="text-gray-400 text-xs">({levelTasks.length})</span>
                      <svg
                        className={`w-3 h-3 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {expanded && (
                      <div className="ml-6">
                        {levelTasks.map((t, idx) => {
                          const isLastTask = idx === levelTasks.length - 1;
                          const isSelected = selectedTaskId === t.id;
                          const status = getStatusConfig(t.status);

                          return (
                            <div key={t.id}>
                              <div
                                className={`flex items-start gap-2 cursor-pointer -mx-2 px-2 py-2.5 rounded-xl transition ${
                                  isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                                }`}
                                onClick={() => setSelectedTaskId((prev) => (prev === t.id ? null : t.id))}
                              >
                                <span className="text-gray-300 select-none shrink-0 mt-0.5">
                                  {!isLastLevel ? '│' : ' '}
                                  {'   '}
                                  {isLastTask ? '└' : '├'}──
                                </span>

                                <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'} truncate`}>
                                      {t.name}
                                    </span>

                                    {t.is_veto && (
                                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded border border-red-200">
                                        VETO
                                      </span>
                                    )}

                                    <span className={`px-2 py-0.5 text-[10px] rounded-full ${status.bg} ${status.text} border ${status.border}`}>
                                      {status.label}
                                    </span>
                                  </div>

                                  {isSelected && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-xs font-sans">
                                      {t.description && <p className="text-gray-700 leading-relaxed line-clamp-2">{t.description}</p>}

                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600">
                                        <span className="flex items-center gap-1">
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {t.duration}h
                                        </span>

                                        <span className="flex items-center gap-1">
                                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          {fmtDate(t.start_datetime)} → {fmtDate(t.end_datetime)}
                                        </span>

                                        {Array.isArray(t.assigned_users) && (
                                          <span className="flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-1a4 4 0 00-5-3.87M9 20H2v-1a4 4 0 015-3.87m8 4.87v-1a6 6 0 00-12 0v1m12-13a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            {t.assigned_users.length} Personen
                                          </span>
                                        )}

                                        {/* ✅ FIX: no API call, just open modal with existing task data */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenTaskDetail?.(t);
                                          }}
                                          className="ml-auto px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                                        >
                                          Details
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <span className="text-gray-500 text-xs shrink-0 font-sans">{t.duration}h</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="mt-6 pt-4 border-t border-gray-100 text-gray-500 text-xs font-sans">
                {maxLevel} Level{maxLevel !== 1 ? 's' : ''}, {(tasks || []).length} Aufgabe{(tasks || []).length !== 1 ? 'n' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
