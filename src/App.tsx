import { useState, useCallback } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import UsersPage from "@/pages/UsersPage";
import VehiclesPage from "@/pages/VehiclesPage";
import ClaimsPage from "@/pages/ClaimsPage";
import DamageTicketsPage from "@/pages/DamageTicketsPage";
import TransactionsPage from "@/pages/TransactionsPage";
import DisputesPage from "@/pages/DisputesPage";
import InspectionsPage from "@/pages/InspectionsPage";
import ReviewsPage from "@/pages/ReviewsPage";
import FaqsPage from "@/pages/FaqsPage";
import PagesPage from "@/pages/PagesPage";
import PushNotificationsPage from "@/pages/PushNotificationsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import SettingsPage from "@/pages/SettingsPage";
import ProfilePage from "@/pages/ProfilePage";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import SplashScreen from "@/components/SplashScreen";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminDashboardInvalidationBridge } from "@/components/AdminDashboardInvalidationBridge";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="unear-admin-theme">
        <AdminDashboardInvalidationBridge />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              <Route path="/claims" element={<ClaimsPage />} />
              <Route path="/damage-tickets" element={<DamageTicketsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/disputes" element={<DisputesPage />} />
              <Route path="/inspections" element={<InspectionsPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/faqs" element={<FaqsPage />} />
              <Route path="/pages" element={<PagesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/push-notifications" element={<PushNotificationsPage />} />
              <Route path="/activity" element={<Navigate to="/notifications" replace />} />
              <Route path="/roles" element={<Navigate to="/" replace />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
