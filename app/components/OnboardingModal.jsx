import React, { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';

const API = 'http://localhost:8000/api';

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
      setError('Please select an option');
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
      setError('Please select a firm');
      return;
    }

    if (firmAction === 'create' && !newFirmName.trim()) {
      setError('Please enter a firm name');
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
          throw new Error(firmData?.error || 'Failed to create firm');
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
        throw new Error(updateData?.error || 'Failed to join firm');
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
      setError(err?.message || 'Network error');
      console.error('Error in page 2:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleColorSubmit = async () => {
    const hex = normalizeHex(hexColor);
    if (!hex || hex.length !== 6) {
      setError('Please enter a valid 6-character hex color');
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
        setError(data?.error || 'Failed to set color');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error setting color:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gray-100 px-8 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    page >= step ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-2 ${page > step ? 'bg-black' : 'bg-gray-300'}`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 text-sm text-gray-600 text-center">
            {page === 1 && 'Ihre Rolle'}
            {page === 2 && 'Firma auswählen'}
            {page === 3 && 'Farbe wählen'}
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          {page === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Willkommen! Wie möchten Sie sich anmelden?
              </h2>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setUserType('angestellte')}
                  className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                    userType === 'angestellte'
                      ? 'border-black bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        userType === 'angestellte' ? 'border-black' : 'border-gray-400'
                      }`}
                    >
                      {userType === 'angestellte' && <div className="w-3 h-3 rounded-full bg-black" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">Ich bin Angestellte/r</h3>
                      <p className="text-sm text-gray-600">Einer bestehenden Firma beitreten</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUserType('unternehmer')}
                  className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                    userType === 'unternehmer'
                      ? 'border-black bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        userType === 'unternehmer' ? 'border-black' : 'border-gray-400'
                      }`}
                    >
                      {userType === 'unternehmer' && <div className="w-3 h-3 rounded-full bg-black" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">Ich habe eine Firma</h3>
                      <p className="text-sm text-gray-600">Eine neue Firma erstellen</p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePage1Continue}
                disabled={!userType}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  userType
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Weiter
              </button>
            </div>
          )}

          {page === 2 && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setPage(1)}
                className="text-gray-600 hover:text-black flex items-center gap-2"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Zurück
              </button>

              {firmAction === 'join' ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">Firma auswählen</h2>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {firms.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Keine Firmen verfügbar</p>
                    ) : (
                      firms.map((firm) => (
                        <button
                          type="button"
                          key={firm.id}
                          onClick={() => setSelectedFirmId(firm.id)}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            selectedFirmId === firm.id
                              ? 'border-black bg-gray-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          disabled={loading}
                        >
                          <h4 className="font-semibold text-gray-900">{firm.name}</h4>
                          <p className="text-sm text-gray-600">{firm.workers ?? ''} Mitarbeiter</p>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">Neue Firma erstellen</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Firmenname</label>
                    <input
                      type="text"
                      placeholder="z.B. Meine Firma GmbH"
                      value={newFirmName}
                      onChange={(e) => setNewFirmName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
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
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  loading ||
                  (firmAction === 'join' && !selectedFirmId) ||
                  (firmAction === 'create' && !newFirmName.trim())
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {loading ? 'Wird verarbeitet…' : 'Weiter'}
              </button>
            </div>
          )}

          {page === 3 && (
            <div className="space-y-6">
              {hasFirm && (
                <button
                  type="button"
                  onClick={() => setPage(2)}
                  className="text-gray-600 hover:text-black flex items-center gap-2"
                  disabled={loading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Zurück
                </button>
              )}

              <h2 className="text-2xl font-bold text-gray-900">Wählen Sie Ihre Farbe</h2>

              <p className="text-gray-600">
                Diese Farbe wird verwendet, um Sie in Projekten zu identifizieren.
              </p>

              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <input
                    type="color"
                    value={`#${normalizeHex(hexColor).padEnd(6, '0')}`}
                    onChange={(e) => setHexColor(normalizeHex(e.target.value))}
                    className="w-24 h-24 rounded-lg cursor-pointer border-2 border-gray-300"
                    disabled={loading}
                  />

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hex-Code</label>
                    <div className="flex gap-2">
                      <span className="flex items-center justify-center px-4 bg-gray-100 border-2 border-gray-300 rounded-l-lg text-gray-700 font-mono">
                        #
                      </span>
                      <input
                        type="text"
                        value={normalizeHex(hexColor)}
                        onChange={(e) => setHexColor(normalizeHex(e.target.value))}
                        maxLength={6}
                        placeholder="000000"
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-black font-mono text-lg text-gray-900"
                        disabled={loading}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">6-stelliger Hexadezimalcode (z.B. FF5733)</p>
                  </div>

                  <div
                    className="w-24 h-24 rounded-lg border-2 border-gray-300 shadow-inner"
                    style={{ backgroundColor: `#${normalizeHex(hexColor).padEnd(6, '0')}` }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oder wählen Sie eine Vorlage:
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {[
                      'FF0000','FF7F00','FFFF00','00FF00','0000FF','4B0082','9400D3','000000',
                      'FF1493','00CED1','FFD700','FF6347','32CD32','1E90FF','FF69B4','808080',
                    ].map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setHexColor(color)}
                        className={`w-full aspect-square rounded-lg border-2 transition-all ${
                          normalizeHex(hexColor) === color ? 'border-black scale-110' : 'border-gray-300 hover:border-gray-400'
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
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  loading || normalizeHex(hexColor).length !== 6
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {loading ? 'Wird gespeichert…' : 'Fertig'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
