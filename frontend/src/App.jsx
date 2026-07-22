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
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import VerifyEmail from './pages/VerifyEmail/VerifyEmail';
import Feed from './pages/Feed/Feed';
import Profile from './pages/Profile/Profile';
import Network from './pages/Network/Network';
import Jobs from './pages/Jobs/Jobs';
import Messages from './pages/Messages/Messages';
import Notifications from './pages/Notifications/Notifications';
import Settings from './pages/Settings/Settings';
import OAuthCallback from './pages/OAuthCallback/OAuthCallback';

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