'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../../api/ApiWrapper';

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    passwordConfirm: '',
  });
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.passwordConfirm) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    setLoading(true);

    try {
      await authApi.register(formData.email, formData.username, formData.password);
      router.push('/dashboard');
    } catch (err) {
      const errorData = err.response?.data;
      // Handle various error formats from dj-rest-auth
      const errorMessage =
        errorData?.username?.[0] ||
        errorData?.email?.[0] ||
        errorData?.password1?.[0] ||
        errorData?.non_field_errors?.[0] ||
        errorData?.detail ||
        'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-black/40 transition hover:bg-black/5 hover:text-black/70"
            type="button"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="px-8 pt-8 pb-2">
            <h2 className="text-2xl font-semibold tracking-tight text-black">Konto erstellen</h2>
            <p className="mt-1 text-sm text-black/60">
              Registrieren Sie sich für Ihr Prüfportal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 pt-4">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black/70">
                  E-Mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder-black/40 outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5"
                  placeholder="max@beispiel.de"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-black/70">
                  Benutzername
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder-black/40 outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5"
                  placeholder="max.mustermann"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-black/70">
                  Passwort
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder-black/40 outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5"
                  placeholder="Mindestens 8 Zeichen"
                />
              </div>

              <div>
                <label htmlFor="passwordConfirm" className="block text-sm font-medium text-black/70">
                  Passwort bestätigen
                </label>
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  required
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-black placeholder-black/40 outline-none transition focus:border-black/30 focus:ring-2 focus:ring-black/5"
                  placeholder="Passwort wiederholen"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-full bg-black py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Registrieren...
                </span>
              ) : (
                'Registrieren'
              )}
            </button>

            <div className="mt-6 text-center text-sm text-black/60">
              Bereits ein Konto?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-medium text-black hover:underline"
              >
                Anmelden
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}