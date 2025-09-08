import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import CreateDinner from "./pages/CreateDinner";
import Discover from "./pages/Discover";
import DinnerDetail from "./pages/DinnerDetail";
import MyDinners from "./pages/MyDinners";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { About } from "./pages/About";
import { Help } from "./pages/Help";
import Notifications from "./pages/Notifications";
import Feedback from "./pages/Feedback";
import { CampaignDetail } from "./pages/CampaignDetail";

// Lazy load less critical pages
const CityPage = lazy(() => import("./pages/CityPage").then(module => ({ default: module.CityPage })));
const FoodGuide = lazy(() => import("./pages/FoodGuide").then(module => ({ default: module.FoodGuide })));
const FAQ = lazy(() => import("./pages/FAQ").then(module => ({ default: module.FAQ })));

import Analytics from "./components/Analytics";
import { Footer } from "./components/Footer";
import { useTranslation } from "react-i18next";
import "./i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold text-destructive">{t('error.title')}</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <button 
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          {t('error.reload')}
        </button>
      </div>
    </div>
  );
}

const App = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Analytics />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/create-dinner" element={<CreateDinner />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/dinner/:id" element={<DinnerDetail />} />
            <Route path="/my-dinners" element={<MyDinners />} />
            <Route path="/chat-list" element={<ChatList />} />
            <Route path="/chat/:sessionId" element={<Chat />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Help />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/campaign/:id" element={<CampaignDetail />} />
            <Route path="/city/:city" element={
              <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">加载中...</div>}>
                <CityPage />
              </Suspense>
            } />
            <Route path="/food-guide" element={
              <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">加载中...</div>}>
                <FoodGuide />
              </Suspense>
            } />
            <Route path="/faq" element={
              <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">加载中...</div>}>
                <FAQ />
              </Suspense>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
