import 'src/global.css';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import { IconButton } from '@mui/material';
import { SvgColor } from 'src/components/svg-color';
import { usePathname } from 'src/routes/hooks';
import { useAuth } from 'src/routes/hooks/use-auth';

import { ThemeProvider } from 'src/theme/theme-provider';
import api from 'src/routes/api/config';

interface UserResponse {
  user_id: string;
  username: string;
  full_name?: string;
  email?: string;
  account_status: string;
  nickname?: string;
  name?: string;
}

type AppProps = {
  children: React.ReactNode;
};

// Custom hook for desktop detection
function useIsDesktop(breakpoint = 768) {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > breakpoint;
  });

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth > breakpoint);
    };

    checkDesktop();

    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, [breakpoint]);

  return isDesktop;
}

const Footer = () => {
  const navigate = useNavigate();
  const pathname = usePathname();
  const token = localStorage.getItem('auth_token');
  const isLoggedIn = !!token;

  const [companyInfo, setCompanyInfo] = useState<{
    company_name?: string;
    copyright_name?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDesktop = useIsDesktop();

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      setIsLoading(true);
      try {
        const response = await api.post('/trademarks', {
          type: 'company',
        });

        const data = response.data as {
          success: boolean;
          type: string;
          data: {
            id: number;
            copyright_name: string;
            company_name: string;
            created_at: string;
            updated_at: string;
          };
        };

        if (data.success && data.type === 'company') {
          setCompanyInfo({
            company_name: data.data.company_name,
            copyright_name: data.data.copyright_name,
          });
        }
      } catch (error) {
        setCompanyInfo({
          company_name: 'Your Company',
          copyright_name: '© Your Company',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyInfo();
  }, []);

  const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  if (isDesktop) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9,
          p: 2,
          bgcolor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
          gap: 3,
        }}
      >
        {isLoading ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ opacity: 0.7, fontSize: '0.75rem' }}
          >
            Loading...
          </Typography>
        ) : (
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: isLoggedIn ? 'left' : 'center',
              alignItems: isLoggedIn ? 'left' : 'center',
              marginLeft: isLoggedIn ? '20rem' : '',
              zIndex: 9,
              p: 0.9,
              bgcolor: 'background.default',
              borderTop: '1px solid',
              borderColor: 'divider',
              gap: 3,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ opacity: 0.7, fontSize: '0.75rem' }}
            >
              {companyInfo?.copyright_name}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  if (isLoggedIn) {
    const handleDashboardClick = () => navigate('/dashboard');
    const handleAttendanceClick = () => navigate('/attendance');
    const handleAccountsClick = () => navigate('/accounts');
    const handleGradesClick = () => navigate('/grades');
    const handleMessagesClick = () => navigate('/messaging');

    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          zIndex: 9,
          py: 1.5,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          justifyContent: 'center',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
          height: '70px',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 0.5 }}>
          <IconButton
            color={isActive('/grades') ? 'primary' : 'inherit'}
            onClick={handleGradesClick}
            sx={{
              p: 1.5,
              '& > span, & > div': {
                width: 35,
                height: 39,
              },
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'translateY(-1px)',
                transition: 'all 0.15s ease',
              },
              '&.Mui-focusVisible': {
                bgcolor: 'action.focus',
              },
              '&.MuiIconButton-root': {
                borderRadius: '10px',
              },
            }}
          >
            {icon('ic-grades')}
          </IconButton>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              mt: -1.5,
              color: isActive('/grades') ? 'primary.main' : 'text.secondary',
            }}
          >
            Grades
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 0.5 }}>
          <IconButton
            color={isActive('/attendance') ? 'primary' : 'inherit'}
            onClick={handleAttendanceClick}
            sx={{
              p: 1.5,
              '& > span, & > div': {
                width: 35,
                height: 39,
              },
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'translateY(-1px)',
                transition: 'all 0.15s ease',
              },
              '&.Mui-focusVisible': {
                bgcolor: 'action.focus',
              },
              '&.MuiIconButton-root': {
                borderRadius: '10px',
              },
            }}
          >
            {icon('ic-attendance')}
          </IconButton>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              mt: -1.5,
              color: isActive('/attendance') ? 'primary.main' : 'text.secondary',
            }}
          >
            Attendance
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 0.5 }}>
          <IconButton
            color={isActive('/dashboard') ? 'primary' : 'inherit'}
            onClick={handleDashboardClick}
            sx={{
              p: 1.5,
              '& > span, & > div': {
                width: 35,
                height: 39,
              },
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'translateY(-1px)',
                transition: 'all 0.15s ease',
              },
              '&.Mui-focusVisible': {
                bgcolor: 'action.focus',
              },
              '&.MuiIconButton-root': {
                borderRadius: '10px',
              },
            }}
          >
            {icon('ic-dashboard-mobile')}
          </IconButton>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              mt: -1.5,
              color: isActive('/dashboard') ? 'primary.main' : 'text.secondary',
            }}
          >
            Dashboard
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 0.5 }}>
          <IconButton
            color={isActive('/messaging') ? 'primary' : 'inherit'}
            onClick={handleMessagesClick}
            sx={{
              p: 1.5,
              '& > span, & > div': {
                width: 35,
                height: 39,
              },
              position: 'relative',
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'translateY(-1px)',
                transition: 'all 0.15s ease',
              },
              '&.Mui-focusVisible': {
                bgcolor: 'action.focus',
              },
              '&.MuiIconButton-root': {
                borderRadius: '10px',
              },
            }}
          >
            {icon('ic-messaging')}
          </IconButton>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              mt: -1.5,
              color: isActive('/messaging') ? 'primary.main' : 'text.secondary',
            }}
          >
            Messages
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 0.5 }}>
          <IconButton
            color={isActive('/accounts') ? 'primary' : 'inherit'}
            onClick={handleAccountsClick}
            sx={{
              p: 1.5,
              '& > span, & > div': {
                width: 35,
                height: 39,
              },
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'translateY(-1px)',
                transition: 'all 0.15s ease',
              },
              '&.Mui-focusVisible': {
                bgcolor: 'action.focus',
              },
              '&.MuiIconButton-root': {
                borderRadius: '10px',
              },
            }}
          >
            {icon('ic-account')}
          </IconButton>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              mt: -1.5,
              color: isActive('/accounts') ? 'primary.main' : 'text.secondary',
            }}
          >
            Accounts
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9,
        p: 1,
        bgcolor: 'background.default',
        gap: 3,
      }}
    >
      {isLoading ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ opacity: 0.7, fontSize: '0.75rem' }}
        >
          Loading...
        </Typography>
      ) : (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ opacity: 0.7, fontSize: '0.75rem' }}
        >
          {companyInfo?.copyright_name}.
        </Typography>
      )}
    </Box>
  );
};

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
}

export default function App({ children }: AppProps) {
  useScrollToTop();
  const { logout } = useAuth();

  const [showAccountDeactivatedDialog, setShowAccountDeactivatedDialog] = useState(false);
  const [showSessionExpiredDialog, setShowSessionExpiredDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Function that makes the API call AND HANDLES RESPONSE
    const checkSession = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        const response = await api.post<{ status: string }>('/auto-destroy-session', {});

        if (response.data.status === 'Deactivated') {
          // Stop the interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Show dialog
          setDialogMessage('Your account has been deactivated');
          setShowAccountDeactivatedDialog(true);

          // Clear storage immediately
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          // Stop the interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          setShowSessionExpiredDialog(true);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
    };

    // Start interval
    intervalRef.current = setInterval(checkSession, 1500);

    // Make first request immediately
    checkSession();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  //Also add a listener for when user logs in
  useEffect(() => {
    const handleLogin = () => {
      const token = localStorage.getItem('auth_token');
      if (token && !intervalRef.current) {
        const checkSession = async () => {
          try {
            const response = await api.post<{ status: string }>('/auto-destroy-session', {});

            if (response.data.status === 'Deactivated') {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }

              setDialogMessage('Your account has been deactivated');
              setShowAccountDeactivatedDialog(true);
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
            }
          } catch (error: any) {
            if (error.response?.status === 401) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              setShowSessionExpiredDialog(true);
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
            }
          }
        };

        intervalRef.current = setInterval(checkSession, 1500);
        checkSession();
      }
    };

    // Check immediately
    handleLogin();

    // Also listen for storage changes
    window.addEventListener('storage', handleLogin);

    return () => {
      window.removeEventListener('storage', handleLogin);
    };
  }, []);

  const closeAccountDeactivatedDialog = () => {
    setShowAccountDeactivatedDialog(false);

    // Clear any remaining interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    logout();

    // Force redirect
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  const closeSessionExpiredDialog = () => {
    setShowSessionExpiredDialog(false);

    // Clear any remaining interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    logout();

    // Force redirect
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  return (
    <ThemeProvider>
      {children}
      <Footer />

      {/* Account Deactivated Dialog */}
      <Dialog
        open={showAccountDeactivatedDialog}
        onClose={() => {}}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 3,
            width: 340,
            textAlign: 'center',
            boxShadow: '0 8px 28px rgba(17, 24, 39, 0.12)',
            position: 'fixed',
            zIndex: 99999,
          },
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              backgroundColor: 'error.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Account Deactivated
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {dialogMessage || 'Your account has been deactivated'}
          </Typography>

          <Button
            variant="contained"
            fullWidth
            sx={{ py: 1.1, borderRadius: 2, fontWeight: 600 }}
            onClick={closeAccountDeactivatedDialog}
          >
            OK
          </Button>
        </Box>
      </Dialog>

      {/* Session Expired Dialog */}
      <Dialog
        open={showSessionExpiredDialog}
        onClose={() => {}}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 3,
            width: 340,
            textAlign: 'center',
            boxShadow: '0 8px 28px rgba(17, 24, 39, 0.12)',
            position: 'fixed',
            zIndex: 99999,
          },
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              backgroundColor: 'warning.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Session Expired
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Your session has expired. Please login again.
          </Typography>

          <Button
            variant="contained"
            fullWidth
            sx={{ py: 1.1, borderRadius: 2, fontWeight: 600 }}
            onClick={closeSessionExpiredDialog}
          >
            OK
          </Button>
        </Box>
      </Dialog>
    </ThemeProvider>
  );
}
