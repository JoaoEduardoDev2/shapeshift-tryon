import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scan, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Scan className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">AI Virtual Fit</span>
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          {isHome && (
            <>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">Como Funciona</a>
              <a href="#examples" className="hover:text-foreground transition-colors">Exemplos</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            </>
          )}
          <Link to="/mirror" className="hover:text-foreground transition-colors">Espelho</Link>
          <Link to="/photo" className="hover:text-foreground transition-colors">Foto</Link>
          {isHome && <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>}
          <Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" variant="outline">
                <LogIn className="w-4 h-4" />
                Entrar
              </Button>
            </Link>
          )}
          <Link to="/photo">
            <Button size="sm">Testar Agora</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
