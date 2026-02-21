import { Outlet } from '@tanstack/react-router';
import Header from './Header';
import Footer from './Footer';
import ProfileSetupModal from './ProfileSetupModal';
import AdminSetupNotice from './AdminSetupNotice';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-6">
          <AdminSetupNotice />
        </div>
        <Outlet />
      </main>
      <Footer />
      <ProfileSetupModal />
    </div>
  );
}
