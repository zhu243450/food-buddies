import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { HelmetProvider } from "react-helmet-async";
import { OptimizedLoader } from "@/components/OptimizedLoader";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import Navigation from "@/components/Navigation";
// Critical pages (loaded immediately)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load all other pages to reduce initial bundle
const Profile = lazy(() => import("./pages/Profile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const CreateDinner = lazy(() => import("./pages/CreateDinner"));
const Discover = lazy(() => import("./pages/Discover"));
const DinnerDetail = lazy(() => import("./pages/DinnerDetail"));
const MyDinners = lazy(() => import("./pages/MyDinners"));
const Chat = lazy(() => import("./pages/Chat"));
const ChatList = lazy(() => import("./pages/ChatList"));
const Admin = lazy(() => import("./pages/Admin"));
const Privacy = lazy(() => import("./pages/Privacy").then(module => ({ default: module.Privacy })));
const Terms = lazy(() => import("./pages/Terms").then(module => ({ default: module.Terms })));
const About = lazy(() => import("./pages/About").then(module => ({ default: module.About })));
const Help = lazy(() => import("./pages/Help").then(module => ({ default: module.Help })));
const Notifications = lazy(() => import("./pages/Notifications"));
const Feedback = lazy(() => import("./pages/Feedback"));
const CampaignDetail = lazy(() => import("./pages/CampaignDetail").then(module => ({ default: module.CampaignDetail })));
const CombinedFoodGuide = lazy(() => import("./pages/CombinedFoodGuide").then(module => ({ default: module.CombinedFoodGuide })));
const FAQ = lazy(() => import("./pages/FAQ").then(module => ({ default: module.FAQ })));
const GrowthCenter = lazy(() => import("./pages/GrowthCenter"));
const SocialFeed = lazy(() => import("./pages/SocialFeed"));
const DinnerMap = lazy(() => import("./pages/DinnerMap"));
const DiningReport = lazy(() => import("./pages/DiningReport"));
const DiningBuddies = lazy(() => import("./pages/DiningBuddies"));

import Analytics from "./components/Analytics";
import { Footer } from "./components/Footer";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import "./i18n";

// Routes where bottom navigation should NOT appear
const HIDE_NAV_ROUTES = ['/', '/auth', '/admin'];
const HIDE_NAV_PREFIXES = ['/chat/'];

// Routes where footer should NOT appear (mobile-focused pages)
const HIDE_FOOTER_ROUTES = ['/', '/auth', '/admin', '/chat-list', '/create-dinner', '/notifications', '/feedback', '/dinner-map', '/dining-report'];
const HIDE_FOOTER_PREFIXES = ['/chat/', '/dinner/', '/user/'];

function GlobalNavigation() {
  const location = useLocation();
  const shouldHideNav = HIDE_NAV_ROUTES.includes(location.pathname) || 
    HIDE_NAV_PREFIXES.some(prefix => location.pathname.startsWith(prefix));
  if (shouldHideNav) return null;
  return <Navigation />;
}

function GlobalFooter() {
  const location = useLocation();
  const shouldHideFooter = HIDE_FOOTER_ROUTES.includes(location.pathname) ||
    HIDE_FOOTER_PREFIXES.some(prefix => location.pathname.startsWith(prefix));
  if (shouldHideFooter) return null;
  return <Footer />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 15, // 15 minutes - longer cache
      gcTime: 1000 * 60 * 60 * 2, // 2 hours
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
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
          <PerformanceMonitor />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Analytics />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={
              <Suspense fallback={<OptimizedLoader />}>
                <Profile />
              </Suspense>
            } />
            <Route path="/user/:userId" element={
              <Suspense fallback={<OptimizedLoader />}>
                <UserProfile />
              </Suspense>
            } />
            <Route path="/create-dinner" element={
              <Suspense fallback={<OptimizedLoader />}>
                <CreateDinner />
              </Suspense>
            } />
            <Route path="/discover" element={
              <Suspense fallback={<OptimizedLoader />}>
                <Discover />
              </Suspense>
            } />
            <Route path="/dinner/:id" element={
              <Suspense fallback={<OptimizedLoader />}>
                <DinnerDetail />
              </Suspense>
            } />
            <Route path="/my-dinners" element={<Navigate to="/discover?tab=myDinners" replace />} />
            <Route path="/chat-list" element={
              <Suspense fallback={<OptimizedLoader />}>
                <ChatList />
              </Suspense>
            } />
            <Route path="/chat/:sessionId" element={
              <Suspense fallback={<OptimizedLoader />}>
                <Chat />
              </Suspense>
            } />
            <Route path="/admin" element={
              <Suspense fallback={<OptimizedLoader />}>
                <Admin />
              </Suspense>
            } />
            <Route path="/privacy" element={
              <Suspense fallback={<OptimizedLoader />}>
                <Privacy />
              </Suspense>
            } />
            <Route path="/terms" element={
              <Suspense fallback={<OptimizedLoader />}>
                <Terms />
              </Suspense>
            } />
            <Route path="/about" element={
              <Suspense fallback={<OptimizedLoader />}>
                <About />
              </Suspense>
            } />
            <Route path="/help" element={
              <Suspense fallback={<OptimizedLoader />}>
                <Help />
              </Suspense>
            } />
            <Route path="/notifications" element={
              <Suspense fallback={<OptimizedLoader />}>
                <Notifications />
              </Suspense>
            } />
            <Route path="/feedback" element={
              <Suspense fallback={<OptimizedLoader />}>
                <Feedback />
              </Suspense>
            } />
            <Route path="/campaign/:id" element={
              <Suspense fallback={<OptimizedLoader />}>
                <CampaignDetail />
              </Suspense>
            } />
            <Route path="/city/:city" element={
              <Suspense fallback={<OptimizedLoader />}>
                <CombinedFoodGuide />
              </Suspense>
            } />
            <Route path="/food-guide" element={
              <Suspense fallback={<OptimizedLoader />}>
                <CombinedFoodGuide />
              </Suspense>
            } />
            <Route path="/faq" element={
              <Suspense fallback={<OptimizedLoader />}>
                <FAQ />
              </Suspense>
            } />
            <Route path="/growth" element={
              <Suspense fallback={<OptimizedLoader />}>
                <GrowthCenter />
              </Suspense>
            } />
            <Route path="/social" element={
              <Suspense fallback={<OptimizedLoader />}>
                <SocialFeed />
              </Suspense>
            } />
            <Route path="/dinner-map" element={
              <Suspense fallback={<OptimizedLoader />}>
                <DinnerMap />
              </Suspense>
            } />
            <Route path="/dining-report" element={
              <Suspense fallback={<OptimizedLoader />}>
                <DiningReport />
              </Suspense>
            } />
            <Route path="/dining-buddies" element={
              <Suspense fallback={<OptimizedLoader />}>
                <DiningBuddies />
              </Suspense>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            <GlobalNavigation />
            <GlobalFooter />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
