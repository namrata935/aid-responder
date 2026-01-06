import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import VictimDashboard from "./pages/VictimDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import DonatePage from "./pages/DonatePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Role to route mapping
const ROLE_ROUTES: Record<string, string> = {
  'victim': '/victim',
  'volunteer': '/volunteer',
  'manager': '/coordinator'
};

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: string }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!user.role) {
    return <Navigate to="/role-selection" replace />;
  }
  
  // Compare roles in lowercase to handle case mismatch
  const userRoleLower = user.role.toLowerCase();
  const allowedRoleLower = allowedRole.toLowerCase();
  
  if (userRoleLower !== allowedRoleLower) {
    // Redirect to user's correct dashboard
    const userRoute = ROLE_ROUTES[userRoleLower];
    return <Navigate to={userRoute || '/role-selection'} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/role-selection" element={<RoleSelectionPage />} />
      <Route path="/donate" element={<DonatePage />} />
      
      <Route 
        path="/victim" 
        element={
          <ProtectedRoute allowedRole="victim">
            <VictimDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/volunteer" 
        element={
          <ProtectedRoute allowedRole="volunteer">
            <VolunteerDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/coordinator" 
        element={
          <ProtectedRoute allowedRole="manager">
            <CoordinatorDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;