'use client';

import TreePanel from '../components/TreePanel';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { authApi } from '../../api/ApiWrapper';
import OnboardingModal from '../components/OnboardingModal';
import CreateProject from '../components/CreateProject';
import CreateTask from '../components/CreateTask';
import Header from '../components/Header';

const API = 'http://localhost:8000/api';

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

function getFileIcon(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase();
  const icons = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📽️',
    pptx: '📽️',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    webp: '🖼️',
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    mp4: '🎬',
    mov: '🎬',
    avi: '🎬',
    mp3: '🎵',
    wav: '🎵',
  };
  return icons[ext] || '📎';
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getUserLabel(u) {
  return u?.username || u?.name || u?.email || `User #${u?.id ?? ''}`;
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const k = keyFn(item);
    if (k == null) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

export default function Dashboard() {
  const router = useRouter();
  const token = useMemo(() => Cookies.get('access_token'), []);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('projekte');
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const [rightPanelMode, setRightPanelMode] = useState('info'); 

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [taskDetail, setTaskDetail] = useState(null);
  const [taskDetailLoading, setTaskDetailLoading] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');


  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      router.push('/');
      return;
    }

    (async () => {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);

        const r = await fetch(`${API}/organisation/check_onboarding/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (r.ok) {
          const data = await r.json();
          setNeedsOnboarding(Boolean(data.needs_onboarding));
          if (!data.needs_onboarding) {
            await fetchProjects();
          }
        }
      } catch (e) {
        console.error('Failed to bootstrap:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);


  const fetchProjects = async () => {
    try {
      const r = await fetch(`${API}/organisation/projects/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return;

      const data = await r.json();
      const list = Array.isArray(data) ? data : data?.results || [];
      setProjects(list);

      setSelectedProject((prev) => {
        if (prev && list.some((p) => p.id === prev.id)) return prev;
        return list[0] || null;
      });

      if (!selectedProject && list[0]) {
        setRightPanelMode('info');
        await fetchTasks(list[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch projects:', e);
    }
  };

  const fetchTasks = async (projectId) => {
    if (!projectId) return;
    setTasksLoading(true);
    try {
      const r = await fetch(`${API}/organisation/tasks/?project=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return;

      const data = await r.json();
      const list = Array.isArray(data) ? data : data?.results || [];
      setTasks(list);

      setShowTaskDetail(false);
      setTaskDetail(null);
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchTaskDetail = async (taskId) => {
    setTaskDetailLoading(true);
    try {
      const taskRes = await fetch(`${API}/organisation/tasks/${taskId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!taskRes.ok) return;
      const taskData = await taskRes.json();

      const attachRes = await fetch(`${API}/organisation/tasks/${taskId}/attachments/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let attachments = [];
      if (attachRes.ok) attachments = await attachRes.json();

      setTaskDetail({ ...taskData, attachments });
      setShowTaskDetail(true);
    } catch (e) {
      console.error('Failed to fetch task detail:', e);
    } finally {
      setTaskDetailLoading(false);
    }
  };

  const openInviteModal = () => {
    setInviteEmail('');
    setInviteError('');
    setInviteSuccess('');
    setShowInviteModal(true);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteError('');
    setInviteSuccess('');
  };

  const sendInvitation = async () => {
    if (!selectedProject?.id) return;

    const email = inviteEmail.trim();
    if (!email) {
      setInviteError('Bitte E-Mail eingeben.');
      return;
    }

    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const res = await fetch(`${API}/auth/invitations/send/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          project: selectedProject.id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.detail ||
          (data && typeof data === 'object'
            ? Object.entries(data)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
                .join('\n')
            : 'Ein Fehler ist aufgetreten');
        setInviteError(msg);
        return;
      }

      setInviteSuccess(`Einladung an ${email} wurde gesendet.`);
      setInviteEmail('');
    } catch (e) {
      console.error(e);
      setInviteError('Netzwerkfehler. Bitte versuche es erneut.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    setNeedsOnboarding(false);
    await fetchProjects();
  };

  const handleProjectCreated = async () => {
    setShowCreateProject(false);
    await fetchProjects();
  };

  const handleTaskCreated = async () => {
    setShowCreateTask(false);
    if (selectedProject) await fetchTasks(selectedProject.id);
  };

  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
    setRightPanelMode('info');
    await fetchTasks(project.id);
  };

  const projectPeople = useMemo(() => {
    const usersFromTasks = [];
    for (const t of tasks || []) {
      if (!Array.isArray(t.assigned_users)) continue;
      for (const u of t.assigned_users) {
        if (typeof u === 'object' && u) usersFromTasks.push(u);
      }
    }
    return uniqBy(usersFromTasks, (u) => u.id || u.email);
  }, [tasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-900">
          <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Lade…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 font-medium mb-2">Failed to load user data.</p>
          <button onClick={() => router.push('/')} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingModal isOpen={needsOnboarding} onClose={handleOnboardingComplete} />

      <CreateProject isOpen={showCreateProject} onClose={() => setShowCreateProject(false)} onSuccess={handleProjectCreated} />

      <CreateTask
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projectId={selectedProject?.id}
        existingTasks={tasks}
        onSuccess={handleTaskCreated}
      />

      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(245,245,245,0.55)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeInviteModal();
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-100 shadow-[0_30px_80px_rgba(0,0,0,0.18)] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Benutzer einladen</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Projekt: <span className="font-medium text-gray-900">{selectedProject?.name}</span>
                </p>
              </div>
              <button
                onClick={closeInviteModal}
                className="w-9 h-9 rounded-xl border border-gray-200 text-gray-800 hover:bg-gray-50 flex items-center justify-center"
                disabled={inviteLoading}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5">
              {inviteError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-800">Fehler</p>
                  <p className="mt-1 text-sm text-red-700 whitespace-pre-line">{inviteError}</p>
                </div>
              )}
              {inviteSuccess && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-900">Erfolg</p>
                  <p className="mt-1 text-sm text-emerald-800">{inviteSuccess}</p>
                </div>
              )}

              <label className="block text-sm font-medium text-gray-900 mb-2">E-Mail Adresse</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@firma.de"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                disabled={inviteLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendInvitation();
                  }
                  if (e.key === 'Escape') closeInviteModal();
                }}
              />
              <p className="mt-3 text-xs text-gray-600">
                Der Empfänger bekommt einen Link per E-Mail, um die Einladung anzunehmen.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeInviteModal}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 hover:bg-gray-50"
                disabled={inviteLoading}
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={sendInvitation}
                className="px-4 py-2.5 rounded-xl bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={inviteLoading || !selectedProject}
              >
                {inviteLoading ? 'Sende…' : 'Einladung senden'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTaskDetail && taskDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(245,245,245,0.55)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowTaskDetail(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.18)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusConfig(taskDetail.status).bg} ${getStatusConfig(taskDetail.status).text} border ${getStatusConfig(taskDetail.status).border}`}>
                    {getStatusConfig(taskDetail.status).label}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-lg ${getLevelColor(taskDetail.level).bg} ${getLevelColor(taskDetail.level).text} border ${getLevelColor(taskDetail.level).border}`}>
                    Level {taskDetail.level}
                  </span>
                  {taskDetail.is_veto && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded border border-red-200">
                      VETO
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 truncate">{taskDetail.name}</h2>
              </div>

              <button
                onClick={() => setShowTaskDetail(false)}
                className="w-9 h-9 rounded-xl border border-gray-200 text-gray-800 hover:bg-gray-50 flex items-center justify-center"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {taskDetail.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Beschreibung</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{taskDetail.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Dauer</p>
                  <p className="text-sm font-semibold text-gray-900">{taskDetail.duration} Stunden</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Start</p>
                  <p className="text-sm font-semibold text-gray-900">{fmtDate(taskDetail.start_datetime)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Ende</p>
                  <p className="text-sm font-semibold text-gray-900">{fmtDate(taskDetail.end_datetime)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Zugewiesene Personen{' '}
                  {taskDetail.assigned_users?.length > 0 && (
                    <span className="text-xs font-normal text-gray-500">({taskDetail.assigned_users.length})</span>
                  )}
                </h3>

                {!taskDetail.assigned_users?.length ? (
                  <p className="text-gray-600 text-sm">Keine Personen zugewiesen</p>
                ) : (
                  <div className="space-y-2">
                    {taskDetail.assigned_users.map((u, idx) => {
                      const userObj = typeof u === 'object' ? u : null;
                      const label = userObj ? getUserLabel(userObj) : `User #${u}`;
                      const email = userObj?.email;
                      const initials = (label?.[0] || '?').toUpperCase();

                      return (
                        <div key={userObj?.id || `${u}-${idx}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold text-sm">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
                            {email && <p className="text-xs text-gray-500 truncate">{email}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Anhänge{' '}
                  {taskDetail.attachments?.length > 0 && (
                    <span className="text-xs font-normal text-gray-500">({taskDetail.attachments.length})</span>
                  )}
                </h3>

                {!taskDetail.attachments?.length ? (
                  <p className="text-gray-600 text-sm">Keine Anhänge vorhanden</p>
                ) : (
                  <div className="space-y-2">
                    {taskDetail.attachments.map((a) => {
                      const filename = a.file?.split('/').pop() || a.filename || 'Datei';
                      return (
                        <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-lg">
                            {getFileIcon(filename)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{filename}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(a.file_size)}
                              {a.uploaded_at && <span className="ml-2">• {fmtDate(a.uploaded_at)}</span>}
                            </p>
                          </div>
                          <a
                            href={a.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg bg-black text-white text-xs font-medium hover:bg-gray-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Download
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-white">
              <button onClick={() => setShowTaskDetail(false)} className="w-full px-4 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 font-medium text-sm">
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      <Header user={user} activeTab={activeTab} setActiveTab={setActiveTab} />

      {!needsOnboarding && (
        <main className="w-full mx-auto px-4 sm:px-6 py-6">
          {activeTab === 'aktuell' && (
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-bold text-gray-900">Aktuell</h1>
                <button
                  onClick={() => setShowCreateTask(true)}
                  className="px-4 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 font-medium text-sm disabled:opacity-50"
                  disabled={!selectedProject}
                  title={!selectedProject ? 'Bitte zuerst ein Projekt auswählen' : ''}
                >
                  + Neue Aufgabe
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Keine aktuellen Aufgaben</h3>
                <p className="text-gray-600 text-sm">Wähle ein Projekt aus und erstelle Aufgaben im Tab „Projekte“.</p>
              </div>
            </div>
          )}

   
          {activeTab === 'projekte' && (
            <div className="h-[calc(100vh-110px)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Projekte</h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Wähle ein Projekt links. Rechts: Info oder Aufgabenbaum.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="px-4 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 font-medium text-sm flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Neues Projekt
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
                <aside className="lg:col-span-3 h-full">
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden h-full flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Projekte
                      </h2>
                    </div>

                    {projects.length === 0 ? (
                      <div className="p-6 text-center flex-1 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                          <svg
                            className="w-6 h-6 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-900 font-medium">
                          Keine Projekte
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          Erstelle dein erstes Projekt.
                        </p>
                        <button
                          onClick={() => setShowCreateProject(true)}
                          className="mt-4 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 text-sm font-medium"
                        >
                          Projekt erstellen
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 overflow-y-auto flex-1">
                        {projects.map((p) => {
                          const active = selectedProject?.id === p.id;
                          return (
                            <div key={p.id} className="mb-2">
                              <button
                                onClick={() => handleProjectSelect(p)}
                                className={`w-full text-left px-3 py-3 rounded-xl transition ${
                                  active
                                    ? 'bg-black text-white'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                      active ? 'bg-white/20' : 'bg-gray-100'
                                    }`}
                                  >
                                    <svg
                                      className={`w-4 h-4 ${
                                        active ? 'text-white' : 'text-gray-600'
                                      }`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                      />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-sm font-semibold truncate ${
                                        active ? 'text-white' : 'text-gray-900'
                                      }`}
                                    >
                                      {p.name}
                                    </p>
                                    <p
                                      className={`text-xs truncate ${
                                        active
                                          ? 'text-gray-300'
                                          : 'text-gray-600'
                                      }`}
                                    >
                                      {p.partner?.name || 'Kein Partner'} • Start:{' '}
                                      {fmtDate(p.start_date)}
                                    </p>
                                  </div>
                                </div>
                              </button>

                              {active && (
                                <div className="mt-2 flex gap-2 px-1">
                                  <button
                                    onClick={() => setRightPanelMode('info')}
                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition ${
                                      rightPanelMode === 'info'
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
                                    }`}
                                  >
                                    Info
                                  </button>
                                  <button
                                    onClick={() => setRightPanelMode('tasks')}
                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition ${
                                      rightPanelMode === 'tasks'
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
                                    }`}
                                  >
                                    Aufgaben
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </aside>

                <section className="lg:col-span-9 h-full">
                  {!selectedProject ? (
                    <div className="bg-white border border-gray-200 rounded-2xl h-full flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-7 h-7 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-900 font-semibold">
                          Wähle ein Projekt
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          Rechts erscheinen Infos oder Aufgaben.
                        </p>
                      </div>
                    </div>
                  ) : rightPanelMode === 'tasks' ? (
                    <TreePanel
                      selectedProject={selectedProject}
                      tasks={tasks}
                      tasksLoading={tasksLoading}
                      onCreateTask={() => setShowCreateTask(true)}
                      onFetchTaskDetail={fetchTaskDetail}
                      taskDetailLoading={taskDetailLoading}
                    />
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-2xl h-full flex flex-col">
                      <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">
                          {selectedProject.name}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Projektinformationen
                        </p>
                      </div>

                      <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Partner</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {selectedProject.partner?.name || 'Kein Partner'}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Start</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {fmtDate(selectedProject.start_date)}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <p className="text-sm font-semibold text-gray-900 capitalize">
                              {selectedProject.status}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Wiederholung</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {selectedProject.recurrence_pattern || 'Einmalig'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-900">
                              Beteiligte Personen
                            </h3>
                            <button
                              onClick={openInviteModal}
                              className="px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-800 font-medium"
                            >
                              + Einladen
                            </button>
                          </div>

                          {projectPeople.length === 0 ? (
                            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                              <p className="text-gray-600 text-sm">
                                Noch keine Personen zugewiesen
                              </p>
                              <button
                                onClick={openInviteModal}
                                className="mt-2 px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-800 font-medium"
                              >
                                Erste Person einladen
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {projectPeople.map((person) => {
                                const initials = getUserLabel(person)[0]?.toUpperCase() || '?';
                                return (
                                  <div
                                    key={person.id || person.email}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                                  >
                                    <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold text-sm">
                                      {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {getUserLabel(person)}
                                      </p>
                                      {person.email && (
                                        <p className="text-xs text-gray-500 truncate">
                                          {person.email}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Aufgabenübersicht
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 text-center">
                              <p className="text-2xl font-bold text-blue-700">
                                {tasks.filter(t => t.status === 'new').length}
                              </p>
                              <p className="text-xs text-blue-600 mt-1">Neu</p>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                              <p className="text-2xl font-bold text-emerald-700">
                                {tasks.filter(t => t.status === 'active').length}
                              </p>
                              <p className="text-xs text-emerald-600 mt-1">Aktiv</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                              <p className="text-2xl font-bold text-gray-700">
                                {tasks.filter(t => t.status === 'completed').length}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">Fertig</p>
                            </div>
                            <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-center">
                              <p className="text-2xl font-bold text-red-700">
                                {tasks.filter(t => t.status === 'cancelled').length}
                              </p>
                              <p className="text-xs text-red-600 mt-1">Storniert</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}