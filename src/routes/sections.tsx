import type { RouteObject } from 'react-router';
import { ReactNode, lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------
// Lazy-loaded pages
// ----------------------------------------------------------------------

export const LoginPage = lazy(() => import('src/pages/login'));
export const ResetOptions = lazy(() => import('src/pages/reset-options'));
export const ResetPasswordRequestLvlOne = lazy(() => import('src/pages/reset-password-request-lvl-one'));
export const ResetPasswordRequestLvlTwo = lazy(() => import('src/pages/reset-password-request-lvl-two'));
export const PasswordReset = lazy(() => import('src/pages/password-reset'));
export const OtpVerification = lazy(() => import('src/pages/otp-auth'));
export const FirstUser = lazy(() => import('src/pages/first-user'));

export const DashboardPage = lazy(() => import('src/pages/dashboard'));
export const AttendancePage = lazy(() => import('src/pages/attendance'));
export const AccountPage = lazy(() => import('src/pages/accounts'));
export const GradePage = lazy(() => import('src/pages/grades'));
export const MessagingPage = lazy(() => import('src/pages/messaging'));
export const ProfilePage = lazy(() => import('src/pages/profile'));
export const EmailEditUpdate = lazy(() => import('src/pages/email-update'));
export const EmailEditPassword = lazy(() => import('src/pages/password-update'));

export const BlankPage = lazy(() => import('src/pages/blank'));
export const UnderMaintenancePage = lazy(() => import('src/pages/under-maintenance'));

// ----------------------------------------------------------------------
// Loading fallback
// ----------------------------------------------------------------------

const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: {
          bgcolor: 'var(--palette-primary-main)',
        },
      }}
    />
  </Box>
);

// ----------------------------------------------------------------------
// Protected & Guest Routes
// ----------------------------------------------------------------------

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('auth_token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

// ----------------------------------------------------------------------
// Routes Definition
// ----------------------------------------------------------------------

export const routesSection: RouteObject[] = [
  // Root Redirect — '/' redirects based on auth state
  {
    path: '/',
    element: (
      localStorage.getItem('auth_token')
        ? <Navigate to="/dashboard" replace />
        : <Navigate to="/login" replace />
    ),
  },

  // Protected Routes (requires auth)
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'accounts', element: <AccountPage /> },
      { path: 'grades', element: <GradePage /> },
      { path: 'messaging', element: <MessagingPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'edit-update-email', element: <EmailEditUpdate /> },
      { path: 'edit-update-password', element: <EmailEditPassword /> },

      { path: 'blank', element: <BlankPage /> },
      { path: 'under-maintenance', element: <UnderMaintenancePage /> },
    ],
  },

  // Guest-only Routes (redirects if already logged in)
  {
    path: 'login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: 'logout',
    element: (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    ),
  },
  {
    path: 'otp-authentication',
    element: (
      <AuthLayout>
        <OtpVerification />
      </AuthLayout>
    ),
  },
  {
    path: 'first-user',
    element: (
      <AuthLayout>
        <FirstUser />
      </AuthLayout>
    ),
  },
  {
    path: 'reset-options',
    element: (
      <AuthLayout>
        <ResetOptions />
      </AuthLayout>
    ),
  },
  {
    path: 'reset-password-request-lvl-1',
    element: (
      <AuthLayout>
        <ResetPasswordRequestLvlOne />
      </AuthLayout>
    ),
  },
  {
    path: 'reset-password-request-lvl-2',
    element: (
      <AuthLayout>
        <ResetPasswordRequestLvlTwo />
      </AuthLayout>
    ),
  },
  {
    path: 'password-reset',
    element: (
      <AuthLayout>
        <PasswordReset />
      </AuthLayout>
    ),
  },
];
