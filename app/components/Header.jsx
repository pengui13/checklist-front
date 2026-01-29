'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '../../api/ApiWrapper.jsx';

function getInitials(user) {
  const s = user?.username || user?.email || '';
  return (s[0] || '?').toUpperCase();
}

export default function Header({ user, activeTab, setActiveTab }) {
  const [menuOpen, setMenuOpen] = useState(false); // desktop profile dropdown
  const [mobileOpen, setMobileOpen] = useState(false); // mobile/tablet expanded header
  const router = useRouter();
  const pathname = usePathname();

  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const roleLabel = useMemo(() => {
    return user?.is_creator ? 'Ersteller' : user?.is_admin ? 'Admin' : 'Benutzer';
  }, [user]);

  const firmName = user?.firm?.name || (typeof user?.firm === 'string' ? user.firm : '');

  const closeAll = () => {
    setMenuOpen(false);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    closeAll();
    await authApi.logout();
    router.push('/');
  };

  // IMPORTANT FIX:
  // From /users, clicking "Aktuell/Projekte" must navigate to /dashboard and set tab.
  const goToTab = (tab) => {
    closeAll();

    // If you are already on /dashboard, just switch state.
    // Otherwise navigate to /dashboard with tab in query.
    if (pathname?.startsWith('/dashboard')) {
      if (typeof setActiveTab === 'function') setActiveTab(tab);
      return;
    }

    router.push(`/dashboard?tab=${encodeURIComponent(tab)}`);
  };

  const goToUsers = () => {
    closeAll();
    router.push('/users');
  };

  // Close on Escape + click outside desktop dropdown
  useEffect(() => {
    const anyOpen = menuOpen || mobileOpen;
    if (!anyOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeAll();
    };

    const onMouseDown = (e) => {
      // if mobile is open, let overlay handle outside click
      if (mobileOpen) return;

      // desktop dropdown outside click
      const t = e.target;
      if (menuRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [menuOpen, mobileOpen]);

  // Prevent background scroll when mobile sheet is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // If route changes, close menus (prevents stuck overlays)
  useEffect(() => {
    closeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const showUsersNav = user?.is_creator || user?.is_admin;
  const onUsersPage = pathname === '/users' || pathname?.startsWith('/users/');
  const onDashboard = pathname === '/dashboard' || pathname?.startsWith('/dashboard');

  const headerTitle = onUsersPage
    ? 'Benutzerverwaltung'
    : activeTab === 'aktuell'
      ? 'Aktuell'
      : activeTab === 'projekte'
        ? 'Projekte'
        : 'Dashboard';

  return (
    <>
      {/* Overlay for mobile expanded header */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-md"
          style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
          onClick={closeAll}
        />
      )}

      {/* Overlay for desktop dropdown */}
      {menuOpen && !mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm"
          style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <header className="sticky top-0 z-50">
        <div
          className="border-b border-white/30 bg-white/70 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
          style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex justify-between items-center gap-3">
              {/* Desktop nav */}
              <nav className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => goToTab('aktuell')}
                  className={[
                    'px-3 py-2 rounded-xl text-base font-medium transition',
                    onDashboard && activeTab === 'aktuell'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-200/60',
                  ].join(' ')}
                  type="button"
                >
                  Aktuell
                </button>

                <button
                  onClick={() => goToTab('projekte')}
                  className={[
                    'px-3 py-2 rounded-xl text-base font-medium transition',
                    onDashboard && activeTab === 'projekte'
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-200/60',
                  ].join(' ')}
                  type="button"
                >
                  Projekte
                </button>

                {showUsersNav && (
                  <button
                    onClick={goToUsers}
                    className={[
                      'px-3 py-2 rounded-xl text-base font-medium transition',
                      onUsersPage ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/60',
                    ].join(' ')}
                    type="button"
                  >
                    Benutzerverwaltung
                  </button>
                )}
              </nav>

              {/* Mobile title */}
              <div className="lg:hidden flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center font-bold">
                  P
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{headerTitle}</p>
                  <p className="text-xs text-gray-600 truncate">{firmName || 'Organisation'}</p>
                </div>
              </div>

              {/* Desktop user dropdown button */}
              <div className="hidden lg:block relative">
                <button
                  ref={btnRef}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-gray-200/50 transition border border-white/30 bg-white/45"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {user?.hex_color ? (
                    <div
                      className="w-10 h-10 rounded-full border border-gray-200 shadow-sm"
                      style={{ backgroundColor: `#${user.hex_color}` }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold">
                      {getInitials(user)}
                    </div>
                  )}

                  <div className="text-right leading-tight">
                    <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                    {firmName && <p className="text-xs text-gray-600">{firmName}</p>}
                    <p className="text-xs text-gray-500">{roleLabel}</p>
                  </div>

                  <div className="flex flex-col gap-1.5 pl-1">
                    <span className="block w-5 h-0.5 bg-gray-800 rounded" />
                    <span className="block w-5 h-0.5 bg-gray-800 rounded opacity-80" />
                    <span className="block w-5 h-0.5 bg-gray-800 rounded opacity-60" />
                  </div>
                </button>
              </div>

              {/* Mobile/Tablet expand button */}
              <button
                className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-white/30 bg-white/45 hover:bg-gray-200/50 transition"
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-expanded={mobileOpen}
                aria-label="Menü"
              >
                <div className="flex flex-col gap-1.5">
                  <span className={`block w-5 h-0.5 bg-gray-900 rounded transition ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
                  <span className={`block w-5 h-0.5 bg-gray-900 rounded transition ${mobileOpen ? 'opacity-0' : 'opacity-80'}`} />
                  <span className={`block w-5 h-0.5 bg-gray-900 rounded transition ${mobileOpen ? '-translate-y-2 -rotate-45' : 'opacity-60'}`} />
                </div>
              </button>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200/70 to-transparent" />

          {/* Mobile/Tablet expandable sheet */}
          <div
            className={[
              'lg:hidden overflow-hidden',
              'transition-all duration-300 ease-out',
              mobileOpen ? 'max-h-[560px] opacity-100' : 'max-h-0 opacity-0',
            ].join(' ')}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
              <div
                className={[
                  'rounded-2xl border border-white/40 bg-white/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.10)]',
                  'transition-transform duration-300 ease-out',
                  mobileOpen ? 'translate-y-0' : '-translate-y-2',
                ].join(' ')}
                style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
              >
                {/* User summary */}
                <div className="p-4 border-b border-gray-200/70 flex items-center gap-3">
                  {user?.hex_color ? (
                    <div
                      className="w-11 h-11 rounded-full border border-gray-200 shadow-sm shrink-0"
                      style={{ backgroundColor: `#${user.hex_color}` }}
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold shrink-0">
                      {getInitials(user)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.username}</p>
                    <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {firmName ? `Firma: ${firmName} • ${roleLabel}` : roleLabel}
                    </p>
                  </div>

                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                    {roleLabel}
                  </span>
                </div>

                {/* Tabs/actions */}
                <div className="p-2">
                  <button
                    onClick={() => goToTab('aktuell')}
                    className={[
                      'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition',
                      onDashboard && activeTab === 'aktuell' ? 'bg-black text-white' : 'text-gray-800 hover:bg-gray-100',
                    ].join(' ')}
                    type="button"
                  >
                    Aktuell
                  </button>

                  <button
                    onClick={() => goToTab('projekte')}
                    className={[
                      'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition mt-1',
                      onDashboard && activeTab === 'projekte' ? 'bg-black text-white' : 'text-gray-800 hover:bg-gray-100',
                    ].join(' ')}
                    type="button"
                  >
                    Projekte
                  </button>

                  {showUsersNav && (
                    <button
                      onClick={goToUsers}
                      className={[
                        'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition mt-1',
                        onUsersPage ? 'bg-black text-white' : 'text-gray-800 hover:bg-gray-100',
                      ].join(' ')}
                      type="button"
                    >
                      Benutzerverwaltung
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-200/70">
                  <Link href="/profile" onClick={closeAll} className="block px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-100 transition">
                    Profil
                  </Link>
                  <Link href="/settings" onClick={closeAll} className="block px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-100 transition">
                    Einstellungen
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 transition"
                    type="button"
                  >
                    Abmelden
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop dropdown menu */}
      {menuOpen && !mobileOpen && (
        <div className="fixed right-4 sm:right-6 top-[76px] z-[60] w-72">
          <div
            ref={menuRef}
            className="rounded-2xl border border-white/50 bg-white/92 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden"
            style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
            role="menu"
          >
            <div className="px-4 py-3 border-b border-gray-200/70">
              <div className="flex items-center gap-3">
                {user?.hex_color ? (
                  <div className="w-9 h-9 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: `#${user.hex_color}` }} />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold text-sm">
                    {getInitials(user)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.username}</p>
                  <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                </div>

                <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                  {roleLabel}
                </span>
              </div>

              {firmName && <p className="mt-2 text-xs text-gray-600 truncate">Firma: {firmName}</p>}
            </div>

            <div className="py-2">
              <Link href="/profile" onClick={closeAll} className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-100 transition" role="menuitem">
                Profil
              </Link>
              <Link href="/settings" onClick={closeAll} className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-100 transition" role="menuitem">
                Einstellungen
              </Link>
            </div>

            <div className="border-t border-gray-200/70 py-2">
              <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition" type="button" role="menuitem">
                Abmelden
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
