import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { MessageProvider } from './context/MessageContext';
import { OnlineStatusProvider } from './context/OnlineStatusContext';
import { AIContextProvider } from './contexts/AIContext';

// Layout wrappers
import MainLayout from './layouts/MainLayout/MainLayout';
import AuthLayout from './layouts/AuthLayout/AuthLayout';

// Route guards
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import GuestRoute from './components/GuestRoute/GuestRoute';

// Lazy-loaded pages for code splitting
const Login = lazy(() => import('./pages/auth/Login/Login'));
const Register = lazy(() => import('./pages/auth/Register/Register'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword/ResetPassword'));
const Feed = lazy(() => import('./pages/Student/Feed/Feed'));
const Profile = lazy(() => import('./pages/Student/Profile/Profile'));
const Network = lazy(() => import('./pages/Student/Network/Network'));
const Jobs = lazy(() => import('./pages/Student/Jobs/Jobs'));
const Messages = lazy(() => import('./pages/Student/Messages/Messages'));
const Notifications = lazy(() => import('./pages/Student/Notifications/Notifications'));
const Settings = lazy(() => import('./pages/Student/Settings/Settings'));
const OAuthCallback = lazy(() => import('./pages/Student/OAuthCallback/OAuthCallback'));
const SearchResults = lazy(() => import('./pages/Student/SearchResults/SearchResults'));


//Recruiter
const RecruiterDashboard = lazy(() => import('./pages/recruiter/Dashboard/Dashboard'));
const RecruiterProfile = lazy(() => import('./pages/recruiter/Profile/Profile'));
const CompanyAssociation = lazy(() => import('./pages/recruiter/CompanyAssociation/CompanyAssociation'));
const JoinCompany = lazy(() => import('./pages/recruiter/JoinCompany/JoinCompany'));
const CreateCompany = lazy(() => import('./pages/recruiter/CreateCompany/CreateCompany'));
const JobList = lazy(() => import('./pages/recruiter/JobManagement/JobList'));
const CreateJob = lazy(() => import('./pages/recruiter/JobManagement/CreateJob'));
const ApplicantManagement = lazy(() => import('./pages/recruiter/Applicants/ApplicantManagement'));
const InterviewManagement = lazy(() => import('./pages/recruiter/InterviewManagement/InterviewManagement'));
const OfferManagement = lazy(() => import('./pages/recruiter/OfferManagement/OfferManagement'));
const HiringOnboarding = lazy(() => import('./pages/recruiter/HiringOnboarding/HiringOnboarding'));
const RecruiterMessages = lazy(() => import('./pages/recruiter/Messages/Messages'));
const StudentInterviews = lazy(() => import('./pages/Student/Interviews/StudentInterviews'));
const StudentOffers = lazy(() => import('./pages/Student/Offers/StudentOffers'));
const StudentOnboarding = lazy(() => import('./pages/Student/Onboarding/Onboarding'));
const AIAssistant = lazy(() => import('./pages/Student/AIAssistant'));

const RecruiterTalentPool = lazy(() => import('./pages/recruiter/TalentPool/TalentPool'));
const RecruiterTalentPoolCandidate = lazy(() => import('./pages/recruiter/TalentPool/TalentPoolCandidate'));
const RecruiterTalentCollections = lazy(() => import('./pages/recruiter/TalentPool/TalentCollections'));

import RecruiterProtectedRoute from './components/RecruiterProtectedRoute/RecruiterProtectedRoute';
import Loader from './components/Loader/Loader';

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <Loader size={40} />
  </div>
);

function App() {
  return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ThemeProvider>
            <SocketProvider>
              <NotificationProvider>
                <AIContextProvider>
                <OnlineStatusProvider>
                <Routes>
              {/* ── Public / Guest Routes ── */}
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <AuthLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Login />
                      </Suspense>
                    </AuthLayout>
                  </GuestRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestRoute>
                    <AuthLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Register />
                      </Suspense>
                    </AuthLayout>
                  </GuestRoute>
                }
              />
              <Route
                path="/verify-email/:token"
                element={
                  <AuthLayout>
                    <Suspense fallback={<PageLoader />}>
                      <VerifyEmail />
                    </Suspense>
                  </AuthLayout>
                }
              />
              <Route
                path="/verify-email"
                element={
                  <AuthLayout>
                    <Suspense fallback={<PageLoader />}>
                      <VerifyEmail />
                    </Suspense>
                  </AuthLayout>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <AuthLayout>
                    <Suspense fallback={<PageLoader />}>
                      <ForgotPassword />
                    </Suspense>
                  </AuthLayout>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <AuthLayout>
                    <Suspense fallback={<PageLoader />}>
                      <ResetPassword />
                    </Suspense>
                  </AuthLayout>
                }
              />
              <Route
                path="/oauth/callback"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <OAuthCallback />
                  </Suspense>
                }
              />
               
               {/* ── Protected / Authenticated Routes ── */}
               <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Feed />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/network"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Network />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Jobs />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <MessageProvider>
                      <MainLayout>
                        <Suspense fallback={<PageLoader />}>
                          <Messages />
                        </Suspense>
                      </MainLayout>
                    </MessageProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages/:conversationId"
                element={
                  <ProtectedRoute>
                    <MessageProvider>
                      <MainLayout>
                        <Suspense fallback={<PageLoader />}>
                          <Messages />
                        </Suspense>
                      </MainLayout>
                    </MessageProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Notifications />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/me"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Profile />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
        {/* Recruiter Auth Routes */}
<Route path="/recruiter/login" element={
  <GuestRoute>
    <AuthLayout>
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    </AuthLayout>
  </GuestRoute>
} />
<Route path="/recruiter/register" element={
  <GuestRoute>
    <AuthLayout>
      <Suspense fallback={<PageLoader />}>
        <Register />
      </Suspense>
    </AuthLayout>
  </GuestRoute>
} />
              <Route
                path="/profile/:userId"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Profile />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Suspense fallback={<PageLoader />}>
                        <Settings />
                      </Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            <Route path="/recruiter/dashboard" element={
  <ProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <RecruiterDashboard />
      </Suspense>
    </MainLayout>
  </ProtectedRoute>
} />
            <Route path="/recruiter/profile" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <RecruiterProfile />
      </Suspense>
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/company-association" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <CompanyAssociation />
      </Suspense>
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/company/join" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <JoinCompany />
      </Suspense>
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/company/create" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <CreateCompany />
      </Suspense>
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/jobs" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <JobList />
      </Suspense>
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/jobs/create" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <CreateJob />
      </Suspense>
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/jobs/:id/edit" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <CreateJob />
      </Suspense>
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/jobs/:id/duplicate" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <CreateJob />
      </Suspense>
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/applicants" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <ApplicantManagement />
      </Suspense>
    </MainLayout>
  </RecruiterProtectedRoute>
} />
            <Route path="/recruiter/interviews" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <InterviewManagement />
      </Suspense>
    </MainLayout>
  </RecruiterProtectedRoute>
} />
<Route path="/recruiter/offers" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <OfferManagement />
      </Suspense>
    </MainLayout>
  </RecruiterProtectedRoute>
} />
             <Route path="/recruiter/hiring" element={
  <RecruiterProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <HiringOnboarding />
      </Suspense>
    </MainLayout>
  </RecruiterProtectedRoute>
} />
             <Route path="/recruiter/hiring/:id" element={
   <RecruiterProtectedRoute>
     <MainLayout>
       <Suspense fallback={<PageLoader />}>
         <HiringOnboarding />
       </Suspense>
     </MainLayout>
   </RecruiterProtectedRoute>
} />
             <Route path="/recruiter/messages" element={
  <RecruiterProtectedRoute>
    <MessageProvider>
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <RecruiterMessages />
      </Suspense>
    </MainLayout>
    </MessageProvider>
  </RecruiterProtectedRoute>
} />
             <Route path="/recruiter/talent-pool" element={
   <RecruiterProtectedRoute>
     <MainLayout>
       <Suspense fallback={<PageLoader />}>
         <RecruiterTalentPool />
       </Suspense>
     </MainLayout>
   </RecruiterProtectedRoute>
 } />
             <Route path="/recruiter/talent-pool/candidate/:id" element={
   <RecruiterProtectedRoute>
     <MainLayout>
       <Suspense fallback={<PageLoader />}>
         <RecruiterTalentPoolCandidate />
       </Suspense>
     </MainLayout>
   </RecruiterProtectedRoute>
 } />
             <Route path="/recruiter/talent-pool/collections" element={
   <RecruiterProtectedRoute>
     <MainLayout>
       <Suspense fallback={<PageLoader />}>
         <RecruiterTalentCollections />
       </Suspense>
     </MainLayout>
   </RecruiterProtectedRoute>
 } />
                <Route
                 path="/search" 
                 element={
                 <ProtectedRoute>
                  <MainLayout>
                    <Suspense fallback={<PageLoader />}>
                      <SearchResults />
                    </Suspense>
                   </MainLayout>
                  </ProtectedRoute>} />
                <Route
                  path="/interviews"
                  element={
                  <ProtectedRoute>
                   <MainLayout>
                     <Suspense fallback={<PageLoader />}>
                       <StudentInterviews />
                     </Suspense>
                    </MainLayout>
                   </ProtectedRoute>} />
                <Route
                  path="/offers"
                  element={
                  <ProtectedRoute>
                   <MainLayout>
                     <Suspense fallback={<PageLoader />}>
                       <StudentOffers />
                     </Suspense>
                    </MainLayout>
                   </ProtectedRoute>} />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Suspense fallback={<PageLoader />}>
                          <StudentOnboarding />
                        </Suspense>
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
               <Route
                  path="/ai-assistant"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Suspense fallback={<PageLoader />}>
                          <AIAssistant />
                        </Suspense>
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
            </OnlineStatusProvider>
          </AIContextProvider>
        </NotificationProvider>
     </SocketProvider>
   </ThemeProvider>
 </AuthProvider>
      </Router>
   );
 }

 export default App;