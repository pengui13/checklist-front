'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { authApi } from '../../api/ApiWrapper.jsx';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

function getInitials(user) {
  const s = user?.username || user?.email || '';
  return (s[0] || '?').toUpperCase();
}

function NavPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={[
        'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-black text-white shadow-sm'
          : 'border border-black/10 bg-white text-black/70 hover:border-black/20 hover:text-black',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export default function Header({ 
  user, 
  activeTab, 
  setActiveTab,
  // External modal control (optional)
  loginOpen: externalLoginOpen,
  registerOpen: externalRegisterOpen,
  onOpenLogin: externalOpenLogin,
  onOpenRegister: externalOpenRegister,
  onCloseModals: externalCloseModals,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Internal modal state (used when external control not provided)
  const [internalLoginOpen, setInternalLoginOpen] = useState(false);
  const [internalRegisterOpen, setInternalRegisterOpen] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // Determine if using external or internal modal control
  const isExternalControl = externalOpenLogin !== undefined;
  
  const loginOpen = isExternalControl ? externalLoginOpen : internalLoginOpen;
  const registerOpen = isExternalControl ? externalRegisterOpen : internalRegisterOpen;

  const roleLabel = useMemo(() => {
    return user?.is_creator ? 'Ersteller' : user?.is_admin ? 'Admin' : 'Benutzer';
  }, [user]);

  const firmName = user?.firm?.name || (typeof user?.firm === 'string' ? user.firm : '');

  // Check if user is logged in
  const isLoggedIn = !!user;

  const closeAll = () => {
    setMenuOpen(false);
    setMobileOpen(false);
  };

  const openLogin = () => {
    if (isExternalControl) {
      externalOpenLogin?.();
    } else {
      setInternalRegisterOpen(false);
      setInternalLoginOpen(true);
    }
    closeAll();
  };

  const openRegister = () => {
    if (isExternalControl) {
      externalOpenRegister?.();
    } else {
      setInternalLoginOpen(false);
      setInternalRegisterOpen(true);
    }
    closeAll();
  };

  const closeModals = () => {
    if (isExternalControl) {
      externalCloseModals?.();
    } else {
      setInternalLoginOpen(false);
      setInternalRegisterOpen(false);
    }
  };

  const handleLogout = async () => {
    closeAll();
    await authApi.logout();
    router.push('/');
  };

  const goToTab = (tab) => {
    closeAll();
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

  useEffect(() => {
    const anyOpen = menuOpen || mobileOpen;
    if (!anyOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeAll();
    };

    const onMouseDown = (e) => {
      if (mobileOpen) return;
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

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    closeAll();
  }, [pathname]);

  const showUsersNav = user?.is_creator || user?.is_admin;
  const onUsersPage = pathname === '/users' || pathname?.startsWith('/users/');
  const onDashboard = pathname === '/dashboard' || pathname?.startsWith('/dashboard');

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={closeAll}
        />
      )}

      {menuOpen && !mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[2px]"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo & Brand */}
          <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-3" onClick={closeAll}>
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden">
              <Image
                src="/logo.png"
                alt="Logo"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-black">
                {firmName || 'Cryphos'}
              </div>
              <div className="text-xs text-black/50">Checklisten Manager</div>
            </div>
          </Link>

          {/* Desktop Navigation - Only show when logged in */}
          {isLoggedIn ? (
            <nav className="hidden items-center gap-2 md:flex">
              <NavPill
                active={onDashboard && activeTab === 'aktuell'}
                onClick={() => goToTab('aktuell')}
              >
                Aktuell
              </NavPill>
              <NavPill
                active={onDashboard && activeTab === 'projekte'}
                onClick={() => goToTab('projekte')}
              >
                Projekte
              </NavPill>
              {showUsersNav && (
                <NavPill active={onUsersPage} onClick={goToUsers}>
                  Benutzer
                </NavPill>
              )}
            </nav>
          ) : (
            <nav className="hidden items-center gap-2 md:flex">
              <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70 shadow-sm">
                Einfach
              </span>
              <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70 shadow-sm">
                Schnell
              </span>
              <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70 shadow-sm">
                Sicher
              </span>
            </nav>
          )}

          {/* Desktop User Menu / Auth Buttons */}
          <div className="hidden items-center gap-2 md:flex">
            {isLoggedIn ? (
              <button
                ref={btnRef}
                onClick={() => setMenuOpen((v) => !v)}
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-3 py-1.5 shadow-sm transition hover:border-black/20"
              >
                {user?.hex_color ? (
                  <div
                    className="h-8 w-8 rounded-full border border-black/10"
                    style={{ backgroundColor: `#${user.hex_color}` }}
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-medium text-white">
                    {getInitials(user)}
                  </div>
                )}
                <span className="text-sm font-medium text-black/80">{user?.username}</span>
                <svg
                  className={`h-4 w-4 text-black/40 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ) : (
              <>
                <button
                  onClick={openLogin}
                  className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/80 shadow-sm transition hover:border-black/20"
                >
                  Anmelden
                </button>
                <button
                  onClick={openRegister}
                  className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                >
                  Registrieren
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="grid h-11 w-11 place-items-center rounded-2xl border border-black/10 bg-white shadow-sm md:hidden"
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Menü"
          >
            <div className="flex flex-col gap-1">
              <span
                className={`block h-0.5 w-5 rounded-full bg-black transition-all duration-200 ${
                  mobileOpen ? 'translate-y-1.5 rotate-45' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-black transition-all duration-200 ${
                  mobileOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-black transition-all duration-200 ${
                  mobileOpen ? '-translate-y-1.5 -rotate-45' : ''
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Menu Expanded */}
        <div
          className={[
            'overflow-hidden border-t border-black/5 md:hidden',
            'transition-all duration-300 ease-out',
            mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
          ].join(' ')}
        >
          <div className="mx-auto max-w-6xl px-6 py-4">
            {isLoggedIn ? (
              <>
                {/* User Info */}
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-black/10 bg-black/[0.02] p-4">
                  {user?.hex_color ? (
                    <div
                      className="h-10 w-10 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: `#${user.hex_color}` }}
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                      {getInitials(user)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-black">{user?.username}</p>
                    <p className="truncate text-xs text-black/50">{user?.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] font-medium text-black/60">
                    {roleLabel}
                  </span>
                </div>

                {/* Navigation Items */}
                <div className="space-y-1">
                  <button
                    onClick={() => goToTab('aktuell')}
                    type="button"
                    className={[
                      'w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition',
                      onDashboard && activeTab === 'aktuell'
                        ? 'bg-black text-white'
                        : 'text-black/70 hover:bg-black/5',
                    ].join(' ')}
                  >
                    Aktuell
                  </button>
                  <button
                    onClick={() => goToTab('projekte')}
                    type="button"
                    className={[
                      'w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition',
                      onDashboard && activeTab === 'projekte'
                        ? 'bg-black text-white'
                        : 'text-black/70 hover:bg-black/5',
                    ].join(' ')}
                  >
                    Projekte
                  </button>
                  {showUsersNav && (
                    <button
                      onClick={goToUsers}
                      type="button"
                      className={[
                        'w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition',
                        onUsersPage ? 'bg-black text-white' : 'text-black/70 hover:bg-black/5',
                      ].join(' ')}
                    >
                      Benutzerverwaltung
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div className="my-3 h-px bg-black/10" />

                {/* Settings & Logout */}
                <div className="space-y-1">
                  <Link
                    href="/profile"
                    onClick={closeAll}
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-black/70 transition hover:bg-black/5"
                  >
                    Profil
                  </Link>
                  <Link
                    href="/settings"
                    onClick={closeAll}
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-black/70 transition hover:bg-black/5"
                  >
                    Einstellungen
                  </Link>
                  <button
                    onClick={handleLogout}
                    type="button"
                    className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Abmelden
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Guest Mobile Menu */}
                <div className="space-y-3">
                  <button
                    onClick={openLogin}
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black/80 transition hover:border-black/20"
                  >
                    Anmelden
                  </button>
                  <button
                    onClick={openRegister}
                    className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Registrieren
                  </button>
                </div>

                {/* Feature Pills */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70 shadow-sm">
                    Einfach
                  </span>
                  <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70 shadow-sm">
                    Schnell
                  </span>
                  <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70 shadow-sm">
                    Sicher
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Dropdown Menu - Only when logged in */}
      {isLoggedIn && menuOpen && !mobileOpen && (
        <div className="fixed right-6 top-[72px] z-[60] w-64">
          <div
            ref={menuRef}
            className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl"
            role="menu"
          >
            {/* User Info */}
            <div className="border-b border-black/5 p-4">
              <div className="flex items-center gap-3">
                {user?.hex_color ? (
                  <div
                    className="h-9 w-9 rounded-full border border-black/10"
                    style={{ backgroundColor: `#${user.hex_color}` }}
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                    {getInitials(user)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-black">{user?.username}</p>
                  <p className="truncate text-xs text-black/50">{user?.email}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full border border-black/10 bg-black/[0.02] px-2 py-0.5 text-[11px] font-medium text-black/60">
                  {roleLabel}
                </span>
                {firmName && (
                  <span className="truncate text-[11px] text-black/40">{firmName}</span>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <Link
                href="/profile"
                onClick={closeAll}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-black/70 transition hover:bg-black/5"
                role="menuitem"
              >
                Profil
              </Link>
              <Link
                href="/settings"
                onClick={closeAll}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-black/70 transition hover:bg-black/5"
                role="menuitem"
              >
                Einstellungen
              </Link>
            </div>

            <div className="border-t border-black/5 p-2">
              <button
                onClick={handleLogout}
                type="button"
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                role="menuitem"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      )}

      <LoginModal
        isOpen={loginOpen}
        onClose={closeModals}
        onSwitchToRegister={openRegister}
      />
      <RegisterModal
        isOpen={registerOpen}
        onClose={closeModals}
        onSwitchToLogin={openLogin}
      />
    </>
  );
}