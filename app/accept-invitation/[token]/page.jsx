'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API = 'https://cryphos.com/api';

function normalizeHex(input) {
  return (input || '')
    .replace('#', '')
    .replace(/[^0-9A-Fa-f]/g, '')
    .toUpperCase()
    .slice(0, 6);
}

export default function AcceptInvitationPage() {
  const router = useRouter();
  const { token: rawToken } = useParams();

  const token = useMemo(() => {
    if (!rawToken) return '';
    return Array.isArray(rawToken) ? rawToken[0] : String(rawToken);
  }, [rawToken]);

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    hex_color: '000000', 
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const hex = normalizeHex(form.hex_color);

    if (!token) return setError('Ungültiger Einladungs-Link (Token fehlt).');
    if (!form.email.trim()) return setError('Bitte E-Mail eingeben.');
    if (!form.username.trim()) return setError('Bitte Benutzername eingeben.');
    if (!form.password || form.password.length < 8) return setError('Passwort muss mindestens 8 Zeichen haben.');
    if (hex.length !== 6) return setError('Bitte eine gültige Farbe auswählen (6-stelliger Hex-Wert).');

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/invitations/accept/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_token: token,
          email: form.email.trim(),
          username: form.username.trim(),
          password: form.password,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          hex_color: hex,
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
        setError(msg);
        return;
      }

      setSuccess(data?.message || 'Einladung angenommen. Konto wurde erstellt.');
      setTimeout(() => router.push('/'), 900); 
    } catch (err) {
      console.error(err);
      setError('Netzwerkfehler. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.10)] overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">Einladung annehmen</h1>
          <p className="text-sm text-gray-600 mt-1">Erstelle dein Konto, um dem Projekt beizutreten.</p>
          <p className="text-xs text-gray-500 mt-2 break-all">Token: {token || '—'}</p>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">Fehler</p>
              <p className="mt-1 text-sm text-red-700 whitespace-pre-line">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-medium text-emerald-900">Erfolg</p>
              <p className="mt-1 text-sm text-emerald-800">{success}</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">E-Mail *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="name@firma.de"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Benutzername *</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setField('username', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="z.B. max.mustermann"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Passwort *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="mindestens 8 Zeichen"
                disabled={loading}
                required
                minLength={8}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Vorname</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setField('first_name', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400
                             focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Nachname</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setField('last_name', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400
                             focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Farbe (hex_color) *</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={`#${normalizeHex(form.hex_color).padEnd(6, '0')}`}
                  onChange={(e) => setField('hex_color', normalizeHex(e.target.value))}
                  className="h-11 w-14 rounded-xl border border-gray-200 bg-white p-1"
                  disabled={loading}
                  aria-label="Color picker"
                />

                <div className="flex-1">
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-gray-200 bg-gray-50 text-gray-700 font-mono">
                      #
                    </span>
                    <input
                      type="text"
                      value={normalizeHex(form.hex_color)}
                      onChange={(e) => setField('hex_color', normalizeHex(e.target.value))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-2.5 rounded-r-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 font-mono
                                 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">6-stellige Hex-Farbe, z.B. 1A73E8</p>
                </div>

        
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Wird bestätigt…' : 'Einladung annehmen'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 hover:bg-gray-50 font-medium"
              disabled={loading}
            >
              Abbrechen
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
