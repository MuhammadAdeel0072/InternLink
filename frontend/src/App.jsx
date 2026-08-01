import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout wrappers
import MainLayout from './layouts/MainLayout/MainLayout';
import AuthLayout from './layouts/AuthLayout/AuthLayout';

// Route guards
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import GuestRoute from './components/GuestRoute/GuestRoute';

// Pages - Import from folders
import Login from './pages/auth/Login/Login';
import Register from './pages/auth/Register/Register';
import VerifyEmail from './pages/auth/VerifyEmail/VerifyEmail';
import Feed from './pages/Student/Feed/Feed';
import Profile from './pages/Student/Profile/Profile';
import Network from './pages/Student/Network/Network';
import Jobs from './pages/Student/Jobs/Jobs';
import Messages from './pages/Student/Messages/Messages';
import Notifications from './pages/Student/Notifications/Notifications';
import Settings from './pages/Student/Settings/Settings';
import OAuthCallback from './pages/Student/OAuthCallback/OAuthCallback';
import SearchResults from './pages/Student/SearchResults/SearchResults';


//Recruiter
import RecruiterDashboard from './pages/recruiter/Dashboard/Dashboard';
import RecruiterProfile from './pages/recruiter/Profile/Profile';
import CompanyAssociation from './pages/recruiter/CompanyAssociation/CompanyAssociation';
import JoinCompany from './pages/recruiter/JoinCompany/JoinCompany';
import CreateCompany from './pages/recruiter/CreateCompany/CreateCompany';
import JobList from './pages/recruiter/JobManagement/JobList';
import CreateJob from './pages/recruiter/JobManagement/CreateJob';
import ApplicantManagement from './pages/recruiter/Applicants/ApplicantManagement';
import RecruiterProtectedRoute from './components/RecruiterProtectedRoute/RecruiterProtectedRoute';
function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <Routes>
              {/* ── Public / Guest Routes ── */}
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <AuthLayout>
                      <Login />
                    </AuthLayout>
                  </GuestRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestRoute>
                    <AuthLayout>
                      <Register />
                    </AuthLayout>
                  </GuestRoute>
                }
              />
              <Route
                path="/verify-email"
                element={
                  <AuthLayout>
                    <VerifyEmail />
                  </AuthLayout>
                }
              />
              <Route
                path="/oauth/callback"
                element={<OAuthCallback />}
              />
              
              {/* ── Protected / Authenticated Routes ── */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Feed />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/network"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Network />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Jobs />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Messages />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages/:conversationId"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Messages />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Notifications />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/me"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Profile />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
        {/* Recruiter Auth Routes */}
<Route path="/recruiter/login" element={
  <GuestRoute>
    <AuthLayout>
      <Login />
    </AuthLayout>
  </GuestRoute>
} />
<Route path="/recruiter/register" element={
  <GuestRoute>
    <AuthLayout>
      <Register />
    </AuthLayout>
  </GuestRoute>
} />
              <Route
                path="/profile/:userId"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Profile />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Settings />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            <Route path="/recruiter/dashboard" element={
  <ProtectedRoute>
    <MainLayout>
      <RecruiterDashboard />
    </MainLayout>
  </ProtectedRoute>
} />
            <Route path="/recruiter/profile" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <RecruiterProfile />
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/company-association" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <CompanyAssociation />
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/company/join" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <JoinCompany />
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/company/create" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <CreateCompany />
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/jobs" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <JobList />
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/jobs/create" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <CreateJob />
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/jobs/:id/edit" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <CreateJob />
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/jobs/:id/duplicate" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <CreateJob />
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/applicants" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <ApplicantManagement />
    </MainLayout>
  </RecruiterProtectedRoute>
} />
              <Route
               path="/search" 
               element={
               <ProtectedRoute>
                <MainLayout>
                  <SearchResults />
                  </MainLayout>
                </ProtectedRoute>} />
              {/* ── Catch-all / 404 ── */}
              <Route
                path="*"
                element={
                  <AuthLayout>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        gap: '16px',
                        textAlign: 'center',
                        padding: '24px'
                      }}
                    >
                      <h1
                        style={{
                          fontSize: '5rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-display)',
                          background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        404
                      </h1>
                      <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                        This page doesn't exist.
                      </p>
                      <a
                        href="/"
                        className="btn btn-primary"
                        style={{ marginTop: '12px' }}
                      >
                        Back to Feed
                      </a>
                    </div>
                  </AuthLayout>
                }
              />
            </Routes>
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;