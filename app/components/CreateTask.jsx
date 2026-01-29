'use client';

import { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';

export default function CreateTask({ isOpen, onClose, projectId, onSuccess, existingTasks = [] }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [duration, setDuration] = useState(2);
  const [level, setLevel] = useState(1);
  
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  const token = useMemo(() => Cookies.get('access_token'), []);

const availableLevels = useMemo(() => {
  if (!existingTasks || existingTasks.length === 0) {
    return [1]; 
  }
  
  const existingLevels = existingTasks.map(t => t.level || 1);
  const maxLevel = Math.max(...existingLevels);
  const nextLevel = maxLevel + 1; 
  
  return Array.from({ length: nextLevel }, (_, i) => i + 1);
}, [existingTasks]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const res = await fetch('https://cryphos.com/api/auth/users/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => []);
        if (!res.ok) {
          console.error(data);
          return;
        }

        setUsers(Array.isArray(data) ? data : (data.results || []));
      } catch (e) {
        console.error(e);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, token]);

  if (!isOpen) return null;

  const toggleUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...picked]);
    e.target.value = '';
  };

  const removeFileAt = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadAttachments = async (taskId) => {
    if (!files.length) return;

    setUploading(true);
    try {
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);
        form.append('task', taskId);

        const res = await fetch(
          `https://cryphos.com/api/organisation/tasks/${taskId}/attachments/`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: form,
          }
        );

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg =
            (data && (data.detail || Object.values(data).flat().join(' '))) ||
            `Fehler beim Hochladen: ${file.name}`;
          throw new Error(msg);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      project: projectId,
      name,
      description,
      duration: Number(duration),
      level: Number(level),
      assigned_users: selectedUserIds,
    };

    if (startDatetime) payload.start_datetime = new Date(startDatetime).toISOString();
    if (endDatetime) payload.end_datetime = new Date(endDatetime).toISOString();

    try {
      const response = await fetch('https://cryphos.com/api/organisation/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const task = await response.json().catch(() => null);

      if (!response.ok) {
        const msg =
          (task && (task.detail || Object.values(task).flat().join(' '))) ||
          'Fehler beim Erstellen der Aufgabe.';
        setError(msg);
        return;
      }

      if (files.length) {
        await uploadAttachments(task.id);
      }

      setName('');
      setDescription('');
      setStartDatetime('');
      setEndDatetime('');
      setDuration(2);
      setLevel(1);
      setSelectedUserIds([]);
      setFiles([]);
      setActiveTab('basic');

      onSuccess?.(task);
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Fehler beim Erstellen der Aufgabe.');
    } finally {
      setLoading(false);
    }
  };
const getLevelLabel = (lvl) => {
  if (lvl === 1) return 'Hauptaufgabe';
  if (lvl === 2) return 'Unteraufgabe';
  return `Sub-Level ${lvl}`;
};

  const getLevelDescription = (lvl) => {
    if (!availableLevels.includes(lvl)) {
      if (lvl === 2) return 'Erst Level 1 erstellen';
      if (lvl === 3) return 'Erst Level 2 erstellen';
    }
    return getLevelLabel(lvl);
  };

  const busy = loading || usersLoading || uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Neue Aufgabe</h2>
            <p className="text-sm text-gray-600 mt-0.5">Erstellen Sie eine Aufgabe für Ihr Projekt</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            disabled={busy}
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-gray-200 bg-white px-6">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'basic'
                ? 'border-black text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Grunddaten
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'advanced'
                ? 'border-black text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Erweitert
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-5">
            {activeTab === 'basic' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Aufgabenname <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="z.B. Projektbericht erstellen"
                    required
                    disabled={busy}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Beschreibung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none"
                    rows={4}
                    placeholder="Beschreiben Sie die Aufgabe im Detail..."
                    required
                    disabled={busy}
                  />
                </div>

            
<div>
  <label className="block text-sm font-semibold text-gray-900 mb-2">
    Task Level <span className="text-red-500">*</span>
  </label>
  <div className="flex flex-wrap gap-3">
    {availableLevels.map((lvl) => {
      const isSelected = level === lvl;
      
      return (
        <button
          key={lvl}
          type="button"
          onClick={() => setLevel(lvl)}
          disabled={busy}
          className={`px-4 py-3 rounded-lg border-2 font-medium transition-all min-w-[100px] ${
            isSelected
              ? 'bg-black text-white border-black shadow-md'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-bold">{lvl}</span>
          </div>
          <p className="text-xs mt-1 opacity-80">
            {getLevelLabel(lvl)}
          </p>
        </button>
      );
    })}
  </div>
</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Dauer (Stunden)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      disabled={busy}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Startdatum
                    </label>
                    <input
                      type="datetime-local"
                      value={startDatetime}
                      onChange={(e) => setStartDatetime(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      disabled={busy}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Fälligkeitsdatum
                  </label>
                  <input
                    type="datetime-local"
                    value={endDatetime}
                    onChange={(e) => setEndDatetime(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    disabled={busy}
                  />
                </div>
              </>
            )}

            {activeTab === 'advanced' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Benutzer zuweisen
                    {selectedUserIds.length > 0 && (
                      <span className="ml-2 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        {selectedUserIds.length} ausgewählt
                      </span>
                    )}
                  </label>

                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-60 overflow-y-auto p-2">
                      {usersLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                          <p className="ml-3 text-sm text-gray-600">Lade Benutzer...</p>
                        </div>
                      ) : users.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">Keine Benutzer gefunden</p>
                      ) : (
                        <div className="space-y-2">
                          {users.map((u) => {
                            const selected = selectedUserIds.includes(u.id);
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => toggleUser(u.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                                  selected
                                    ? 'bg-black text-white border-black shadow-sm'
                                    : 'bg-white text-gray-900 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                                disabled={busy}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                    selected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {(u.username || u.name || u.email || '?')[0].toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">
                                      {u.username || u.name || u.email || `User #${u.id}`}
                                    </div>
                                    {(u.email && (u.username || u.name)) && (
                                      <div className={`text-xs truncate ${selected ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {u.email}
                                      </div>
                                    )}
                                  </div>
                                  {selected && (
                                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Anhänge
                  </label>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      onChange={onPickFiles}
                      className="hidden"
                      id="file-upload"
                      disabled={busy}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer"
                    >
                      <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-600 font-medium">Dateien hochladen</p>
                      <p className="text-xs text-gray-500 mt-1">oder per Drag & Drop</p>
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((f, idx) => (
                        <div
                          key={`${f.name}-${idx}`}
                          className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700 truncate flex-1">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFileAt(idx)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                            disabled={busy}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-white border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
              disabled={busy}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={busy}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Speichern...
                </span>
              ) : uploading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Hochladen...
                </span>
              ) : (
                'Aufgabe erstellen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}