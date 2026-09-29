import { Link, useRouterState } from '@tanstack/react-router'

import Button from '../_controls/Button';

import LoginModal from '../modals/LoginModal';
import { useAuth } from '../../hooks/useAuth';
import { useModal, useToast } from '../../hooks/useOverlayContext';
import CreateAccountModal from '../modals/CreateAccountModal';

import { COLOR_CLASSES, COLOR_ORDER } from '../../utils/palette'
import Toast from '../modals/Toast';

// ref: https://github.com/david4473/Reciped/blob/main/src/components/Header.tsx

/**
 * Header bar appearing on top of all pages.
 *
 * TODO: replace the CF logo with the RCH logo and move CF's to a footer - blocked
 * on the RCH logo asset.
 */
export default function Header() {
  const session = useAuth();
  const { location, } = useRouterState();
  const path = location.pathname;
  
  const { modal, setModal } = useModal();
  const {toastMsg} = useToast();

  const navClass = (active: boolean) =>
    `no-underline border-b-2 cursor-pointer font-sans type-item px-0 pt-1 pb-1.5 bg-transparent transition-colors ${
      active ? 'border-accent text-ink' : 'border-transparent text-muted'
    }`

  const handleLogin = () => { setModal("login"); }
  // logout clears local state before awaiting the server, so the promise is unused.
  const handleLogout = () => { void session.logout(); }
  const handleCreateAccount = () => { setModal("create_account"); }
  const closeModal = () => { setModal(undefined) }

  const renderModal =  () => { 
    // The header only opens the login and create-account modals.
    switch (modal) {
      case "create_account": 
        return <CreateAccountModal onClose={closeModal} />;
      case "login": 
        return <LoginModal onClose={closeModal} />;
      default: 
        return "";
    }
  }

  return (
    <>
    <header className={`sticky top-0 z-50 w-full border-b border-line bg-surface`}>
      <div className="w-full flex gap-0.5">
        {COLOR_ORDER.map((c) => (
          <span key={c} className={`flex-1 h-0.75 ${COLOR_CLASSES[c].fill}`}/>
        ))}
      </div>

      <div className="max-w-260 my-0 mx-auto px-6 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="leading-tight p-0 text-left no-underline">
          <span className="block type-title text-[15px]">Commons Fabric</span>
          <span className="block type-label text-[9.5px]">Community Calendar</span>
        </Link>

        {/* Nav */}
        <nav className="flex gap-5.5 ml-auto mr-2">
          <Link to="/" className={navClass(path === '/')}>Events</Link>
          <Link to="/directory" className={navClass(path === '/directory')}>Directory</Link>
          {/* TODO: about page */}
          {/* <Link to="/about" */}
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-2.5">
          {/* While the session is being restored we do not yet know which pair of
              buttons is correct. Rendering the signed-out pair would flash "Log in"
              at an already signed-in user on every refresh, so hold the space instead. */}
          {session.isLoading ? (
            <div className="h-8.5 w-40" aria-hidden />
          ) : session.isAuthenticated ? (
            <>
              <span className="text-[13px] text-ink font-semibold max-w-40 truncate">{session.user?.fullname}</span>
              <Button variant="tertiary" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="tertiary" onClick={handleLogin}>Log in</Button>
              <Button variant="primary" onClick={handleCreateAccount}>
                Create account
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
    {renderModal()}
    <Toast message={toastMsg}/>
    </>
  )
}