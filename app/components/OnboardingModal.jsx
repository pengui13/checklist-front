'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';

const API = 'https://cryphos.com/api';

const normalizeHex = (v) =>
  String(v || '')
    .replace('#', '')
    .replace(/[^0-9A-Fa-f]/g, '')
    .toUpperCase()
    .slice(0, 6);

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}

// Icons
const CheckIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ChevronRightIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronLeftIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const BuildingIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const UserIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SparklesIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const AlertIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Spinner = ({ className = '' }) => (
  <svg className={classNames('animate-spin', className)} viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const OnboardingModal = ({ isOpen, onClose }) => {
  const [page, setPage] = useState(1);
  const [userType, setUserType] = useState(null);
  const [firmAction, setFirmAction] = useState(null);
  const [firms, setFirms] = useState([]);
  const [selectedFirmId, setSelectedFirmId] = useState(null);
  const [newFirmName, setNewFirmName] = useState('');
  const [hexColor, setHexColor] = useState('000000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const hasFirm = useMemo(() => Boolean(user?.firm), [user]);
  const hasColor = useMemo(() => Boolean(user?.hex_color) || normalizeHex(hexColor).length === 6, [user, hexColor]);

  const steps = useMemo(() => {
    return hasColor ? [1, 2] : [1, 2, 3];
  }, [hasColor]);

  const stepTitles = {
    1: 'Ihre Rolle',
    2: firmAction === 'join' ? 'Firma beitreten' : 'Firma erstellen',
    3: 'Farbe wählen',
  };

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setLoading(false);
    checkUserStatus();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const checkUserStatus = async () => {
    try {
      const response = await fetch(`${API}/auth/user/`, {
        headers: { Authorization: `Bearer ${Cookies.get('access_token')}` },
      });

      const userData = await response.json();
      setUser(userData);

      const _hasFirm = Boolean(userData?.firm);
      const _hasColor = Boolean(userData?.hex_color);

      if (_hasColor) setHexColor(normalizeHex(userData.hex_color));

      if (!_hasFirm) {
        setPage(1);
        return;
      }

      if (_hasFirm && !_hasColor) {
        setPage(3);
        return;
      }

      onClose();
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchFirms = async () => {
    try {
      const response = await fetch(`${API}/organisation/firms/`, {
        headers: { Authorization: `Bearer ${Cookies.get('access_token')}` },
      });
      const data = await response.json();
      setFirms(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      setError('Firmen konnten nicht geladen werden');
      console.error('Error fetching firms:', err);
    }
  };

  const handlePage1Continue = async () => {
    if (!userType) {
      setError('Bitte wählen Sie eine Option');
      return;
    }

    setError('');

    if (userType === 'angestellte') {
      setFirmAction('join');
      await fetchFirms();
    } else {
      setFirmAction('create');
    }

    setPage(2);
  };

  const handlePage2Continue = async () => {
    if (firmAction === 'join' && !selectedFirmId) {
      setError('Bitte wählen Sie eine Firma');
      return;
    }

    if (firmAction === 'create' && !newFirmName.trim()) {
      setError('Bitte geben Sie einen Firmennamen ein');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let firmId = selectedFirmId;

      if (firmAction === 'create') {
        const createResponse = await fetch(`${API}/organisation/firms/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Cookies.get('access_token')}`,
          },
          body: JSON.stringify({ name: newFirmName.trim() }),
        });

        const firmData = await createResponse.json().catch(() => ({}));
        if (!createResponse.ok) {
          throw new Error(firmData?.error || 'Firma konnte nicht erstellt werden');
        }

        firmId = firmData.id;
      }

      const updateResponse = await fetch(`${API}/organisation/join_firm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Cookies.get('access_token')}`,
        },
        body: JSON.stringify({ firm_id: firmId }),
      });

      const updateData = await updateResponse.json().catch(() => ({}));
      if (!updateResponse.ok) {
        throw new Error(updateData?.error || 'Beitritt zur Firma fehlgeschlagen');
      }

      await checkUserStatus();

      const colorAlreadySet = Boolean(user?.hex_color) || normalizeHex(hexColor).length === 6;

      if (colorAlreadySet) {
        onClose();
        window.location.reload();
      } else {
        setPage(3);
      }
    } catch (err) {
      setError(err?.message || 'Netzwerkfehler');
      console.error('Error in page 2:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleColorSubmit = async () => {
    const hex = normalizeHex(hexColor);
    if (!hex || hex.length !== 6) {
      setError('Bitte geben Sie einen gültigen 6-stelligen Hex-Code ein');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/auth/set_color/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Cookies.get('access_token')}`,
        },
        body: JSON.stringify({ hex_color: hex }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        onClose();
        window.location.reload();
      } else {
        setError(data?.error || 'Farbe konnte nicht gespeichert werden');
      }
    } catch (err) {
      setError('Netzwerkfehler');
      console.error('Error setting color:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const presetColors = [
    'EF4444', 'F97316', 'F59E0B', 'EAB308', '84CC16', '22C55E', '14B8A6', '06B6D4',
    '3B82F6', '6366F1', '8B5CF6', 'A855F7', 'D946EF', 'EC4899', 'F43F5E', '000000',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-3xl border border-black/10 bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* CSS Animations */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Progress Header */}
        <div className="border-b border-black/5 bg-white/80 backdrop-blur-xl px-8 py-6">
          <div className="flex items-center justify-center gap-3">
            {steps.map((step, idx) => (
              <React.Fragment key={step}>
                <div
                  className={classNames(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all duration-300',
                    page >= step
                      ? 'bg-black text-white shadow-sm'
                      : 'border border-black/10 bg-white text-black/40'
                  )}
                >
                  {page > step ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    step
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={classNames(
                      'h-0.5 w-12 rounded-full transition-all duration-500',
                      page > step ? 'bg-black' : 'bg-black/10'
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-black/50">
            {stepTitles[page]}
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertIcon className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Page 1: Role Selection */}
          {page === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-black/[0.02]">
                  <SparklesIcon className="h-8 w-8 text-black/70" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-black">Willkommen!</h2>
                <p className="mt-2 text-sm text-black/60">Wie möchten Sie Cryphos nutzen?</p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setUserType('angestellte')}
                  className={classNames(
                    'group w-full rounded-2xl border p-5 text-left transition-all duration-200',
                    userType === 'angestellte'
                      ? 'border-black bg-black/[0.02] shadow-sm'
                      : 'border-black/10 hover:border-black/20 hover:bg-black/[0.01]'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={classNames(
                        'flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-200',
                        userType === 'angestellte'
                          ? 'border-black bg-black text-white'
                          : 'border-black/10 bg-white text-black/60 group-hover:border-black/20'
                      )}
                    >
                      <UserIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-black">Ich bin Angestellte/r</h3>
                      <p className="mt-0.5 text-sm text-black/50">Einer bestehenden Firma beitreten</p>
                    </div>
                    <div
                      className={classNames(
                        'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200',
                        userType === 'angestellte'
                          ? 'border-black bg-black'
                          : 'border-black/20'
                      )}
                    >
                      {userType === 'angestellte' && <CheckIcon className="h-3.5 w-3.5 text-white" />}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUserType('unternehmer')}
                  className={classNames(
                    'group w-full rounded-2xl border p-5 text-left transition-all duration-200',
                    userType === 'unternehmer'
                      ? 'border-black bg-black/[0.02] shadow-sm'
                      : 'border-black/10 hover:border-black/20 hover:bg-black/[0.01]'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={classNames(
                        'flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-200',
                        userType === 'unternehmer'
                          ? 'border-black bg-black text-white'
                          : 'border-black/10 bg-white text-black/60 group-hover:border-black/20'
                      )}
                    >
                      <BuildingIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-black">Ich habe eine Firma</h3>
                      <p className="mt-0.5 text-sm text-black/50">Eine neue Firma erstellen</p>
                    </div>
                    <div
                      className={classNames(
                        'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200',
                        userType === 'unternehmer'
                          ? 'border-black bg-black'
                          : 'border-black/20'
                      )}
                    >
                      {userType === 'unternehmer' && <CheckIcon className="h-3.5 w-3.5 text-white" />}
                    </div>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePage1Continue}
                disabled={!userType}
                className="group w-full rounded-full bg-black py-3.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 disabled:bg-black/20 disabled:text-black/40 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  Weiter
                  <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            </div>
          )}

          {/* Page 2: Firm Selection/Creation */}
          {page === 2 && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={loading}
                className="flex items-center gap-1.5 text-sm font-medium text-black/50 transition-colors hover:text-black disabled:opacity-50"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Zurück
              </button>

              {firmAction === 'join' ? (
                <>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-black">Firma auswählen</h2>
                    <p className="mt-1 text-sm text-black/60">Wählen Sie die Firma, der Sie beitreten möchten</p>
                  </div>

                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {firms.length === 0 ? (
                      <div className="rounded-2xl border border-black/10 bg-black/[0.02] py-12 text-center">
                        <BuildingIcon className="mx-auto h-12 w-12 text-black/20" />
                        <p className="mt-3 text-sm text-black/40">Keine Firmen verfügbar</p>
                      </div>
                    ) : (
                      firms.map((firm) => (
                        <button
                          type="button"
                          key={firm.id}
                          onClick={() => setSelectedFirmId(firm.id)}
                          disabled={loading}
                          className={classNames(
                            'w-full rounded-2xl border p-4 text-left transition-all duration-200',
                            selectedFirmId === firm.id
                              ? 'border-black bg-black/[0.02] shadow-sm'
                              : 'border-black/10 hover:border-black/20 hover:bg-black/[0.01]'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-black">{firm.name}</h4>
                              {firm.workers && (
                                <p className="mt-0.5 text-sm text-black/50">{firm.workers} Mitarbeiter</p>
                              )}
                            </div>
                            {selectedFirmId === firm.id && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black">
                                <CheckIcon className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-black">Neue Firma erstellen</h2>
                    <p className="mt-1 text-sm text-black/60">Geben Sie den Namen Ihrer Firma ein</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-black/70">
                      Firmenname <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="z.B. Meine Firma GmbH"
                      value={newFirmName}
                      onChange={(e) => setNewFirmName(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-black/30 transition-all focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={handlePage2Continue}
                disabled={
                  loading ||
                  (firmAction === 'join' && !selectedFirmId) ||
                  (firmAction === 'create' && !newFirmName.trim())
                }
                className="group w-full rounded-full bg-black py-3.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 disabled:bg-black/20 disabled:text-black/40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Wird verarbeitet...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Weiter
                    <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Page 3: Color Selection */}
          {page === 3 && (
            <div className="space-y-6">
              {hasFirm && (
                <button
                  type="button"
                  onClick={() => setPage(2)}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-sm font-medium text-black/50 transition-colors hover:text-black disabled:opacity-50"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Zurück
                </button>
              )}

              <div>
                <h2 className="text-xl font-semibold tracking-tight text-black">Wählen Sie Ihre Farbe</h2>
                <p className="mt-1 text-sm text-black/60">Diese Farbe identifiziert Sie in Projekten</p>
              </div>

              <div className="space-y-5">
                {/* Color Picker Row */}
                <div className="flex items-center gap-4">
                  {/* Color Input */}
                  <div className="relative">
                    <input
                      type="color"
                      value={`#${normalizeHex(hexColor).padEnd(6, '0')}`}
                      onChange={(e) => setHexColor(normalizeHex(e.target.value))}
                      disabled={loading}
                      className="h-16 w-16 cursor-pointer rounded-2xl border border-black/10 bg-white p-1"
                    />
                  </div>

                  {/* Hex Input */}
                  <div className="flex-1">
                    <label className="mb-1.5 block text-sm font-medium text-black/70">Hex-Code</label>
                    <div className="flex">
                      <span className="flex items-center justify-center rounded-l-xl border border-r-0 border-black/10 bg-black/[0.02] px-3 font-mono text-sm text-black/50">
                        #
                      </span>
                      <input
                        type="text"
                        value={normalizeHex(hexColor)}
                        onChange={(e) => setHexColor(normalizeHex(e.target.value))}
                        maxLength={6}
                        placeholder="000000"
                        disabled={loading}
                        className="flex-1 rounded-r-xl border border-black/10 bg-white px-3 py-2.5 font-mono text-sm text-black placeholder:text-black/30 transition-all focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/5"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div
                    className="h-16 w-16 flex-shrink-0 rounded-2xl border border-black/10 shadow-inner"
                    style={{ backgroundColor: `#${normalizeHex(hexColor).padEnd(6, '0')}` }}
                  />
                </div>

                {/* Preset Colors */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-black/70">
                    Oder wählen Sie eine Vorlage:
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {presetColors.map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setHexColor(color)}
                        disabled={loading}
                        className={classNames(
                          'aspect-square rounded-xl border-2 transition-all duration-200 hover:scale-110',
                          normalizeHex(hexColor) === color
                            ? 'border-black ring-2 ring-black ring-offset-2'
                            : 'border-transparent hover:border-black/20'
                        )}
                        style={{ backgroundColor: `#${color}` }}
                        title={`#${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleColorSubmit}
                disabled={loading || normalizeHex(hexColor).length !== 6}
                className="group w-full rounded-full bg-black py-3.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 disabled:bg-black/20 disabled:text-black/40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Wird gespeichert...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckIcon className="h-4 w-4" />
                    Fertig
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;