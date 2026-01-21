'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Cookies from 'js-cookie';

function normalizeHex(input) {
  const value = (input || '').replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  return value.slice(0, 6).padEnd(Math.min(6, value.length), '0');
}

function isValidHex6(v) {
  return /^[0-9A-F]{6}$/.test(v);
}

export default function CreateUserModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    hex_color: '000000',
    is_firm_admin: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const firstInputRef = useRef(null);
  const token = useMemo(() => Cookies.get('access_token'), []);

  useEffect(() => {
    firstInputRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createUser();
  };

  const createUser = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        hex_color: normalizeHex(formData.hex_color),
      };

      const response = await fetch('http://localhost:8000/api/auth/users/create/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        onSuccess?.();
        onClose?.();
        return;
      }

      if (typeof data === 'object' && data) {
        const errorMessages = Object.entries(data)
          .map(([key, value]) => {
            if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
            return `${key}: ${value}`;
          })
          .join('\n');
        setError(errorMessages || 'Ein Fehler ist aufgetreten');
      } else {
        setError(data?.error || 'Ein Fehler ist aufgetreten');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const hex = normalizeHex(formData.hex_color);
  const hexOk = isValidHex6(hex);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        backgroundColor: 'rgba(245, 245, 245, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.15)] border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 id="create-user-title" className="text-xl font-semibold text-gray-900">
              Neuer Benutzer
            </h2>
            <p className="text-sm text-gray-700 mt-1">
              Lege einen Benutzer an und optional Admin-Rechte vergeben.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">Fehler</p>
              <p className="mt-1 text-sm text-red-700 whitespace-pre-line">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Benutzername <span className="text-gray-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="z.B. duck"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                E-Mail <span className="text-gray-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="name@firma.de"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Passwort <span className="text-gray-500">*</span>{' '}
                <span className="text-gray-600 font-normal">(min. 8 Zeichen)</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Vorname</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Max"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Nachname</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Mustermann"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Farbe <span className="text-gray-500">*</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="color"
                      value={`#${hexOk ? hex : '000000'}`}
                      onChange={(e) =>
                        setFormData({ ...formData, hex_color: e.target.value.substring(1).toUpperCase() })
                      }
                      className="w-14 h-14 rounded-xl cursor-pointer border border-gray-200 bg-white"
                      aria-label="Farbe auswählen"
                    />
                  </div>

       
                </div>

                <div className="flex-1">
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-gray-200 bg-gray-50 text-gray-800 font-mono">
                      #
                    </span>
                    <input
                      type="text"
                      value={hex}
                      onChange={(e) => setFormData({ ...formData, hex_color: normalizeHex(e.target.value) })}
                      maxLength={6}
                      placeholder="000000"
                      className={`flex-1 px-4 py-2.5 rounded-r-xl border border-l-0 text-gray-900 placeholder:text-gray-400 font-mono
                        focus:outline-none focus:ring-2 focus:ring-black focus:border-black
                        ${hexOk ? 'border-gray-200' : 'border-red-300 focus:ring-red-400 focus:border-red-400'}`}
                    />
                  </div>
                  {!hexOk && (
                    <p className="mt-2 text-xs text-red-700">Bitte 6 Zeichen (0–9, A–F) eingeben.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Admin-Rechte</p>
                  <p className="text-sm text-gray-700">Darf Benutzer verwalten und Projekte administrieren.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_firm_admin: !formData.is_firm_admin })}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition
                    ${formData.is_firm_admin ? 'bg-black' : 'bg-gray-200'}`}
                  aria-pressed={formData.is_firm_admin}
                  aria-label="Admin-Rechte umschalten"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition
                      ${formData.is_firm_admin ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 hover:bg-gray-50 disabled:opacity-60"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !hexOk}
              className="px-4 py-2.5 rounded-xl bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-white disabled:cursor-not-allowed"
            >
              {loading ? 'Wird erstellt…' : 'Benutzer erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
