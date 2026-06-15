import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ModuleAccessProvider } from './hooks/useModuleAccess';
import { AppDataProvider } from './hooks/useAppData';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Projects } from './pages/Projects';
import { Members } from './pages/Members';
import { Admin } from './pages/Admin';
import { Messaging } from './pages/Messaging';
import { Help } from './pages/Help';
import { Tutorial } from './pages/Tutorial';
import { Memos } from './pages/Memos';
import { Landing } from './pages/Landing';
import { GoogleOAuthCallback } from './pages/GoogleOAuthCallback';
import { Calendar } from './pages/Calendar';
import { TracfinDashboard } from './pages/tracfin/TracfinDashboard';
import { TracfinClients } from './pages/tracfin/TracfinClients';
import { TracfinTransactions } from './pages/tracfin/TracfinTransactions';
import { TracfinRiskAssessments } from './pages/tracfin/TracfinRiskAssessments';
import { TracfinAlerts } from './pages/tracfin/TracfinAlerts';
import { TracfinDeclarations } from './pages/tracfin/TracfinDeclarations';
import { TracfinDossiers } from './pages/tracfin/TracfinDossiers';
import { TracfinArchive } from './pages/tracfin/TracfinArchive';
import { TracfinGuide } from './pages/tracfin/TracfinGuide';
import { TracfinImport } from './pages/tracfin/TracfinImport';
import { TracfinMigration } from './pages/tracfin/TracfinMigration';
import { MyDocDashboard } from './pages/mydoc/MyDocDashboard';
import { MyDocDossiers } from './pages/mydoc/MyDocDossiers';
import { MyDocArchive } from './pages/mydoc/MyDocArchive';
import { MyDocChecklist } from './pages/mydoc/MyDocChecklist';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return <AppDataProvider><ModuleAccessProvider>{children}</ModuleAccessProvider></AppDataProvider>;
}

function RootRoute() {
  // Google OAuth redirects to https://www.lotiercollab.com/?code=...&state=...
  // Intercept those params before showing the Landing page.
  const params = new URLSearchParams(window.location.search);
  if (params.get('code') && params.get('state')) {
    return <GoogleOAuthCallback />;
  }
  return <Landing />;
}

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1A3A5C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/tutorial" element={<Tutorial />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/projects/:projectId" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
      <Route path="/members/:memberId" element={<ProtectedRoute><Members /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messaging /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
      <Route path="/memos" element={<ProtectedRoute><Memos /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      <Route path="/oauth/google/callback" element={<GoogleOAuthCallback />} />
      <Route path="/tracfin" element={<ProtectedRoute><TracfinDashboard /></ProtectedRoute>} />
      <Route path="/tracfin/clients" element={<ProtectedRoute><TracfinClients /></ProtectedRoute>} />
      <Route path="/tracfin/transactions" element={<ProtectedRoute><TracfinTransactions /></ProtectedRoute>} />
      <Route path="/tracfin/risques" element={<ProtectedRoute><TracfinRiskAssessments /></ProtectedRoute>} />
      <Route path="/tracfin/alertes" element={<ProtectedRoute><TracfinAlerts /></ProtectedRoute>} />
      <Route path="/tracfin/declarations" element={<ProtectedRoute><TracfinDeclarations /></ProtectedRoute>} />
      <Route path="/tracfin/dossiers" element={<ProtectedRoute><TracfinDossiers /></ProtectedRoute>} />
      <Route path="/tracfin/archive" element={<ProtectedRoute><TracfinArchive /></ProtectedRoute>} />
      <Route path="/tracfin/import" element={<ProtectedRoute><TracfinImport /></ProtectedRoute>} />
      <Route path="/tracfin/migration" element={<ProtectedRoute><TracfinMigration /></ProtectedRoute>} />
      <Route path="/tracfin/guide" element={<ProtectedRoute><TracfinGuide /></ProtectedRoute>} />
      <Route path="/mydoc" element={<ProtectedRoute><MyDocDashboard /></ProtectedRoute>} />
      <Route path="/mydoc/dossiers" element={<ProtectedRoute><MyDocDossiers /></ProtectedRoute>} />
      <Route path="/mydoc/archive" element={<ProtectedRoute><MyDocArchive /></ProtectedRoute>} />
      <Route path="/mydoc/checklist" element={<ProtectedRoute><MyDocChecklist /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
