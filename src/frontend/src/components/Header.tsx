import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin, useGetCart } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ShoppingCart, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import InvitationCodeRedemption from './InvitationCodeRedemption';

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: cart } = useGetCart();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [redemptionOpen, setRedemptionOpen] = useState(false);

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const text = loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login';

  const cartItemCount = cart?.items?.length || 0;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const navLinks = (
    <>
      <Link
        to="/"
        className="text-sm font-medium transition-colors hover:text-primary"
        onClick={() => setMobileMenuOpen(false)}
      >
        Home
      </Link>
      <Link
        to="/plans"
        className="text-sm font-medium transition-colors hover:text-primary"
        onClick={() => setMobileMenuOpen(false)}
      >
        Plans
      </Link>
      {isAuthenticated && (
        <Link
          to="/dashboard"
          className="text-sm font-medium transition-colors hover:text-primary"
          onClick={() => setMobileMenuOpen(false)}
        >
          Dashboard
        </Link>
      )}
      {isAuthenticated && isAdmin && (
        <Link
          to="/admin"
          className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
          onClick={() => setMobileMenuOpen(false)}
        >
          <Shield className="h-4 w-4" />
          Admin
        </Link>
      )}
      {isAuthenticated && !isAdmin && (
        <button
          onClick={() => {
            setRedemptionOpen(true);
            setMobileMenuOpen(false);
          }}
          className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
        >
          <Shield className="h-4 w-4" />
          Redeem Admin Code
        </button>
      )}
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/assets/generated/platform-logo-transparent.dim_200x200.png"
                alt="ServerHost"
                className="h-8 w-8"
              />
              <span className="text-xl font-bold">ServerHost</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">{navLinks}</nav>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <Link to="/dashboard" className="relative">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            <Button
              onClick={handleAuth}
              disabled={disabled}
              variant={isAuthenticated ? 'outline' : 'default'}
              className="hidden md:inline-flex"
            >
              {text}
            </Button>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks}
                  <Button onClick={handleAuth} disabled={disabled} variant={isAuthenticated ? 'outline' : 'default'}>
                    {text}
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <InvitationCodeRedemption open={redemptionOpen} onOpenChange={setRedemptionOpen} />
    </>
  );
}
