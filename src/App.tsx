import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Events = lazy(() => import("./pages/Events"));
const EventDetails = lazy(() => import("./pages/EventDetails"));
const Login = lazy(() => import("./pages/Login"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const OrganizerDashboard = lazy(() => import("./pages/OrganizerDashboard"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const EditEvent = lazy(() => import("./pages/EditEvent"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminVerify = lazy(() => import("./pages/AdminVerify"));
const PaymentVerify = lazy(() => import("./pages/PaymentVerify"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30s - reduces re-fetching under high traffic
      gcTime: 5 * 60 * 1000, // 5min garbage collection
      retry: 2,
      refetchOnWindowFocus: false, // prevent stampede on tab switch
    },
  },
});

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/organizer" element={<OrganizerDashboard />} />
              <Route path="/events/create" element={<CreateEvent />} />
              <Route path="/events/:id/edit" element={<EditEvent />} />
              <Route path="/admin/verify" element={<AdminVerify />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/payment/verify" element={<PaymentVerify />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
