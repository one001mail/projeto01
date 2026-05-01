import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield } from "lucide-react";
import { navLinks } from "@/config/navigation";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-mono text-lg font-bold" aria-label="CryptoMix — Página inicial">
          <Shield aria-hidden="true" className="h-5 w-5 text-primary" />
          <span className="text-gradient-green">CryptoMix</span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/mixing">
            <Button variant="hero" size="sm">Iniciar Sessão</Button>
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X aria-hidden="true" className="h-6 w-6" /> : <Menu aria-hidden="true" className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <nav aria-label="Navegação mobile" className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    active ? "text-primary bg-primary/10" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link to="/mixing" onClick={() => setMobileOpen(false)}>
              <Button variant="hero" size="sm" className="w-full mt-2">Iniciar Sessão</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
