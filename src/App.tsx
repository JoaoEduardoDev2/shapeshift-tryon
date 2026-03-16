import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Mirror from "./pages/Mirror";
import PhotoTryOn from "./pages/PhotoTryOn";
import Admin from "./pages/Admin";
import AdminProducts from "./pages/AdminProducts";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminIntegrations from "./pages/AdminIntegrations";
import AdminSettings from "./pages/AdminSettings";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import LookPage from "./pages/LookPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/mirror" element={<Mirror />} />
            <Route path="/photo" element={<PhotoTryOn />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/integrations" element={<AdminIntegrations />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/look/:id" element={<LookPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
