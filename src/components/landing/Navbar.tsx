import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scan } from "lucide-react";

export function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Scan className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">VTO.ai</span>
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          {isHome && (
            <>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#integration" className="hover:text-foreground transition-colors">Integração</a>
            </>
          )}
          <Link to="/mirror" className="hover:text-foreground transition-colors">Espelho</Link>
          <Link to="/photo" className="hover:text-foreground transition-colors">Foto</Link>
          <Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link>
        </div>

        <Link to="/mirror">
          <Button size="sm">Testar Agora</Button>
        </Link>
      </div>
    </nav>
  );
}
