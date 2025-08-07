import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
