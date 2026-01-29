import React, { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';

const API = 'https://cryphos.com/api';

const normalizeHex = (v) =>
  String(v || '')
    .replace('#', '')
    .replace(/[^0-9A-Fa-f]/g, '')
    .toUpperCase()
    .slice(0, 6);

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
      setError('Failed to load firms');
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

  const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-900 transition-all bg-white text-gray-900 placeholder:text-gray-400";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 rounded-t-2xl">
          <div className="flex items-center justify-center gap-3">
            {steps.map((step, idx) => (
              <React.Fragment key={step}>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-medium text-sm transition-all ${
                    page >= step 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {page > step ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-12 h-0.5 rounded-full transition-all ${page > step ? 'bg-gray-900' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-500 text-center">
            {page === 1 && 'Ihre Rolle'}
            {page === 2 && (firmAction === 'join' ? 'Firma beitreten' : 'Firma erstellen')}
            {page === 3 && 'Farbe wählen'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {page === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Willkommen!</h2>
                <p className="text-gray-500 mt-1">Wie möchten Sie sich anmelden?</p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setUserType('angestellte')}
                  className={`w-full p-5 rounded-xl border transition-all text-left ${
                    userType === 'angestellte'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        userType === 'angestellte' ? 'border-gray-900' : 'border-gray-300'
                      }`}
                    >
                      {userType === 'angestellte' && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Ich bin Angestellte/r</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Einer bestehenden Firma beitreten</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUserType('unternehmer')}
                  className={`w-full p-5 rounded-xl border transition-all text-left ${
                    userType === 'unternehmer'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        userType === 'unternehmer' ? 'border-gray-900' : 'border-gray-300'
                      }`}
                    >
                      {userType === 'unternehmer' && <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Ich habe eine Firma</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Eine neue Firma erstellen</p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePage1Continue}
                disabled={!userType}
                className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-medium disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Weiter
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {page === 2 && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setPage(1)}
                className="text-gray-500 hover:text-gray-900 flex items-center gap-1.5 text-sm font-medium transition-colors"
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Zurück
              </button>

              {firmAction === 'join' ? (
                <>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Firma auswählen</h2>
                    <p className="text-gray-500 mt-1">Wählen Sie die Firma, der Sie beitreten möchten</p>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {firms.length === 0 ? (
                      <div className="text-gray-400 text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p>Keine Firmen verfügbar</p>
                      </div>
                    ) : (
                      firms.map((firm) => (
                        <button
                          type="button"
                          key={firm.id}
                          onClick={() => setSelectedFirmId(firm.id)}
                          className={`w-full p-4 rounded-xl border transition-all text-left ${
                            selectedFirmId === firm.id
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                          }`}
                          disabled={loading}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{firm.name}</h4>
                              {firm.workers && (
                                <p className="text-sm text-gray-500 mt-0.5">{firm.workers} Mitarbeiter</p>
                              )}
                            </div>
                            {selectedFirmId === firm.id && (
                              <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
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
                    <h2 className="text-xl font-semibold text-gray-900">Neue Firma erstellen</h2>
                    <p className="text-gray-500 mt-1">Geben Sie den Namen Ihrer Firma ein</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Firmenname <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="z.B. Meine Firma GmbH"
                      value={newFirmName}
                      onChange={(e) => setNewFirmName(e.target.value)}
                      className={inputClass}
                      disabled={loading}
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
                className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-medium disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Wird verarbeitet...</span>
                  </>
                ) : (
                  <>
                    Weiter
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}

          {page === 3 && (
            <div className="space-y-6">
              {hasFirm && (
                <button
                  type="button"
                  onClick={() => setPage(2)}
                  className="text-gray-500 hover:text-gray-900 flex items-center gap-1.5 text-sm font-medium transition-colors"
                  disabled={loading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Zurück
                </button>
              )}

              <div>
                <h2 className="text-xl font-semibold text-gray-900">Wählen Sie Ihre Farbe</h2>
                <p className="text-gray-500 mt-1">Diese Farbe identifiziert Sie in Projekten</p>
              </div>

              <div className="space-y-5">
                <div className="flex gap-4 items-start">
                  <div className="relative">
                    <input
                      type="color"
                      value={`#${normalizeHex(hexColor).padEnd(6, '0')}`}
                      onChange={(e) => setHexColor(normalizeHex(e.target.value))}
                      className="w-20 h-20 rounded-xl cursor-pointer border border-gray-300 bg-white"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hex-Code</label>
                    <div className="flex">
                      <span className="flex items-center justify-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-500 font-mono text-sm">
                        #
                      </span>
                      <input
                        type="text"
                        value={normalizeHex(hexColor)}
                        onChange={(e) => setHexColor(normalizeHex(e.target.value))}
                        maxLength={6}
                        placeholder="000000"
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-900 font-mono text-sm transition-all bg-white text-gray-900 placeholder:text-gray-400"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div
                    className="w-20 h-20 rounded-xl border border-gray-300 shadow-inner flex-shrink-0"
                    style={{ backgroundColor: `#${normalizeHex(hexColor).padEnd(6, '0')}` }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oder wählen Sie eine Vorlage:
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {[
                      'EF4444', 'F97316', 'EAB308', '22C55E', '3B82F6', '6366F1', 'A855F7', '000000',
                      'EC4899', '14B8A6', 'F59E0B', 'F87171', '4ADE80', '60A5FA', 'C084FC', '6B7280',
                    ].map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setHexColor(color)}
                        className={`aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                          normalizeHex(hexColor) === color 
                            ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2' 
                            : 'border-transparent hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: `#${color}` }}
                        title={`#${color}`}
                        disabled={loading}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleColorSubmit}
                disabled={loading || normalizeHex(hexColor).length !== 6}
                className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-medium disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Wird gespeichert...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Fertig
                  </>
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