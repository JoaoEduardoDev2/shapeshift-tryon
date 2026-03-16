import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import Landing from "./pages/Landing";
import Mirror from "./pages/Mirror";
import PhotoTryOn from "./pages/PhotoTryOn";
import Admin from "./pages/Admin";
import AdminProducts from "./pages/AdminProducts";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminIntegrations from "./pages/AdminIntegrations";
import AdminSettings from "./pages/AdminSettings";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Paywall from "./pages/Paywall";
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
            <Route path="/admin" element={<SubscriptionGuard><Admin /></SubscriptionGuard>} />
            <Route path="/admin/products" element={<SubscriptionGuard><AdminProducts /></SubscriptionGuard>} />
            <Route path="/admin/analytics" element={<SubscriptionGuard><AdminAnalytics /></SubscriptionGuard>} />
            <Route path="/admin/integrations" element={<SubscriptionGuard><AdminIntegrations /></SubscriptionGuard>} />
            <Route path="/admin/settings" element={<SubscriptionGuard><AdminSettings /></SubscriptionGuard>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/paywall" element={<Paywall />} />
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
