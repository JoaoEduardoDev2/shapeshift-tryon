import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Package, Plug, Settings, BarChart3, Scan, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/products", label: "Produtos", icon: Package },
  { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/admin/integrations", label: "Integrações", icon: Plug },
  { path: "/admin/settings", label: "Configurações", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 hidden lg:flex">
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Scan className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">AI Virtual Fit</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground truncate">
            {user?.email}
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={signOut}>
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
