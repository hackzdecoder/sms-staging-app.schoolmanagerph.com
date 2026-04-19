import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  IconButton,
  Typography,
  InputAdornment,
  Dialog,
  CircularProgress,
} from '@mui/material';
import { useRouter } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';
import api from 'src/routes/api/config';
import { Logo } from 'src/components/logo';

interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  redirect_url?: string;
  redirect?: string;
}

interface ValidateLinkResponse {
  success: boolean;
  valid: boolean;
  message?: string;
  data?: {
    reset_token_expires_at?: string;
    fullname?: string; // ADDED: For displaying fullname
  };
}

export function PasswordResetView() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState(''); // ADDED: For UI display
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [linkExpiredDialogOpen, setLinkExpiredDialogOpen] = useState(false);
  const [linkErrorMessage, setLinkErrorMessage] = useState('');
  const [tokenExpiryTime, setTokenExpiryTime] = useState<Date | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [resetLevel, setResetLevel] = useState(1);

  // Extract token and username from URL
  const queryParams = new URLSearchParams(window.location.search);
  const tokenParam = queryParams.get('token') || '';
  const usernameParam = queryParams.get('username') || '';
  const levelParam = queryParams.get('level') || '1';

  // Generate a unique storage key for this reset session
  const storageKey = `reset_timer_${usernameParam}_${tokenParam}`;

  // Safety check: Prevent any automatic redirects to external URLs
  useEffect(() => {
    const checkForExternalRedirects = () => {
      const currentUrl = window.location.href;
      if (currentUrl.includes('google.com') ||
        currentUrl.includes('http://') ||
        currentUrl.includes('https://')) {
        // If somehow redirected to external site, redirect back to login
        if (!currentUrl.includes(window.location.origin)) {
          console.warn('Blocked external redirect to:', currentUrl);
          router.push('/login');
          return true;
        }
      }
      return false;
    };

    // Check on mount
    if (checkForExternalRedirects()) {
      return undefined;
    }

    // Check periodically (every second) for safety
    const interval = setInterval(() => {
      checkForExternalRedirects();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [router]);

  /** Parse MySQL datetime string to Date object */
  const parseMySQLDateTime = useCallback((mysqlDateTime: string): Date => {
    // MySQL format: "2026-01-09 22:55:55"
    // Replace space with 'T' to make it ISO 8601 compatible
    const isoString = mysqlDateTime.replace(' ', 'T');
    return new Date(isoString);
  }, []);

  /** Calculate remaining seconds from expiry time */
  const calculateRemainingSeconds = useCallback((expiryTime: Date | null): number => {
    if (!expiryTime) return 0;

    const now = new Date();
    const expiry = new Date(expiryTime);
    const diff = expiry.getTime() - now.getTime();

    return Math.max(0, Math.ceil(diff / 1000));
  }, []);

  /** Format seconds to appropriate display based on reset level */
  const formatTime = useCallback((seconds: number) => {
    if (seconds <= 0) return 'Expired';

    // LEVEL 2: 24 hours - Show only hours and minutes (no seconds)
    if (resetLevel === 2) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }

    // LEVEL 1: 5 minutes - Show minutes and seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSecs}s`;
    }
    return `${seconds}s`;
  }, [resetLevel]);

  /** Save timer state to localStorage */
  const saveTimerState = useCallback((seconds: number, expiryTime: Date | null) => {
    if (!tokenParam || !usernameParam) return;

    const timerData = {
      remainingSeconds: seconds,
      expiryTime: expiryTime?.toISOString(),
      lastUpdated: new Date().toISOString(),
      resetLevel: parseInt(levelParam) || 1
    };

    localStorage.setItem(storageKey, JSON.stringify(timerData));
  }, [tokenParam, usernameParam, levelParam, storageKey]);

  /** Load timer state from localStorage */
  const loadTimerState = useCallback((): {
    remainingSeconds: number;
    expiryTime: string | null;
    lastUpdated: string;
    resetLevel: number;
  } | null => {
    if (!tokenParam || !usernameParam) return null;

    const savedData = localStorage.getItem(storageKey);
    if (!savedData) return null;

    try {
      const parsedData = JSON.parse(savedData);

      // Check if saved data is for the same reset level
      const currentLevel = parseInt(levelParam) || 1;
      if (parsedData.resetLevel !== currentLevel) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return parsedData;
    } catch (error) {
      localStorage.removeItem(storageKey);
      return null;
    }
  }, [tokenParam, usernameParam, levelParam, storageKey]);

  /** Clear timer state from localStorage */
  const clearTimerState = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  /** Start countdown timer when we have expiry time */
  useEffect(() => {
    if (!tokenExpiryTime || tokenExpired || remainingSeconds <= 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        const newSeconds = prev - 1;

        // Save updated timer state
        saveTimerState(newSeconds, tokenExpiryTime);

        if (newSeconds <= 0) {
          clearInterval(interval);
          setTokenExpired(true);
          setLinkErrorMessage('This password reset link has expired. Please request a new one.');
          setLinkExpiredDialogOpen(true);
          clearTimerState(); // Clear saved state when expired
          return 0;
        }
        return newSeconds;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [tokenExpiryTime, tokenExpired, remainingSeconds, saveTimerState, clearTimerState]);

  // Check link validity on mount
  useEffect(() => {
    if (!tokenParam || !usernameParam) {
      setLinkErrorMessage('Invalid or missing link parameters.');
      setLinkExpiredDialogOpen(true);
      setIsValidating(false);
      return;
    }

    const validateLink = async () => {
      try {
        setIsValidating(true);

        // First, check if we have saved timer state
        const savedState = loadTimerState();

        if (savedState) {
          const savedExpiryTime = savedState.expiryTime ? new Date(savedState.expiryTime) : null;
          const now = new Date();
          const lastUpdated = new Date(savedState.lastUpdated);
          const timeSinceLastUpdate = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

          // Calculate remaining seconds based on saved state and elapsed time
          const calculatedRemainingSeconds = Math.max(0, savedState.remainingSeconds - timeSinceLastUpdate);

          if (calculatedRemainingSeconds > 0) {
            // Use saved state
            const currentLevel = parseInt(levelParam) || 1;
            setUsername(usernameParam);
            
            // Try to get fullname from localStorage
            const savedFullname = localStorage.getItem(`fullname_${usernameParam}_${tokenParam}`);
            if (savedFullname) {
              setFullname(savedFullname);
            } else {
              setFullname(usernameParam); // Fallback to username
            }
            
            setResetLevel(currentLevel);
            setTokenExpiryTime(savedExpiryTime);
            setRemainingSeconds(calculatedRemainingSeconds);
            setIsValidating(false);
            return;
          } else {
            // Saved timer has expired, clear it
            clearTimerState();
          }
        }

        // No valid saved state, validate with backend
        const res = await api.get<ValidateLinkResponse>('/validate-reset-link', {
          params: {
            username: usernameParam,
            token: tokenParam
          },
        });

        if (!res.data.valid || !res.data.success) {
          setLinkExpiredDialogOpen(true);
          setLinkErrorMessage(res.data.message || 'This link has expired or is invalid.');
          setTokenExpired(true);
          clearTimerState();
        } else {
          const currentLevel = parseInt(levelParam) || 1;
          setUsername(usernameParam);
          
          // Set fullname from backend response or use username as fallback
          if (res.data.data?.fullname) {
            setFullname(res.data.data.fullname);
            // Save fullname to localStorage for persistence
            localStorage.setItem(`fullname_${usernameParam}_${tokenParam}`, res.data.data.fullname);
          } else {
            setFullname(usernameParam);
            localStorage.setItem(`fullname_${usernameParam}_${tokenParam}`, usernameParam);
          }
          
          setResetLevel(currentLevel);

          if (res.data.data?.reset_token_expires_at) {
            const expiry = parseMySQLDateTime(res.data.data.reset_token_expires_at);
            setTokenExpiryTime(expiry);

            const initialSeconds = calculateRemainingSeconds(expiry);
            setRemainingSeconds(initialSeconds);

            // Save initial timer state
            saveTimerState(initialSeconds, expiry);

            if (initialSeconds <= 0) {
              setTokenExpired(true);
              setLinkErrorMessage('This password reset link has expired. Please request a new one.');
              setLinkExpiredDialogOpen(true);
              clearTimerState();
            }
          } else {
            // Fallback: If no expiry from backend, use default based on level
            if (currentLevel === 2) {
              const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
              setTokenExpiryTime(expiry);
              const initialSeconds = 24 * 60 * 60;
              setRemainingSeconds(initialSeconds);
              saveTimerState(initialSeconds, expiry);
            } else {
              const expiry = new Date(Date.now() + 5 * 60 * 1000);
              setTokenExpiryTime(expiry);
              const initialSeconds = 5 * 60;
              setRemainingSeconds(initialSeconds);
              saveTimerState(initialSeconds, expiry);
            }
          }
        }
      } catch (err: any) {
          setLinkExpiredDialogOpen(true);
          if (err.response?.status === 410) {
            setLinkErrorMessage('This password reset link has expired. Please request a new one.');
            setTokenExpired(true);
            // CHECK IF LEVEL 2
            const currentLevel = parseInt(levelParam) || 1;
            if (currentLevel === 2) {
              setResetLevel(2);
            }
          } else if (err.response?.status === 401) {
            setLinkErrorMessage('Invalid reset token.');
            setTokenExpired(true);
            // CHECK IF LEVEL 2
            const currentLevel = parseInt(levelParam) || 1;
            if (currentLevel === 2) {
              setResetLevel(2);
            }
          } else {
            setLinkErrorMessage(err?.response?.data?.message || 'This link has expired or is invalid.');
            setTokenExpired(true);
            // CHECK IF LEVEL 2
            const currentLevel = parseInt(levelParam) || 1;
            if (currentLevel === 2) {
              setResetLevel(2);
            }
          }
          clearTimerState();
        } finally {
          setIsValidating(false);
      }
    };

    validateLink();
  }, [
    tokenParam,
    usernameParam,
    levelParam,
    parseMySQLDateTime,
    calculateRemainingSeconds,
    loadTimerState,
    saveTimerState,
    clearTimerState
  ]);

  // Clear timer state when component unmounts or token expires
  useEffect(() => () => {
    if (tokenExpired) {
      clearTimerState();
    }
  }, [tokenExpired, clearTimerState]);

  // Validation
  const validateAllFields = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';

    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (confirmPassword !== password) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return newErrors;
  }, [username, password, confirmPassword]);

  const validateField = useCallback(
    (field: string, value: string) => {
      const newErrors = { ...errors };

      if (field === 'password') {
        if (!value) newErrors.password = 'Password is required';
        else if (value.length < 8) newErrors.password = 'Password must be at least 8 characters';
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value))
          newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
        else delete newErrors.password;
      }

      if (field === 'confirmPassword') {
        if (!value) newErrors.confirmPassword = 'Please confirm your password';
        else if (value !== password) newErrors.confirmPassword = 'Passwords do not match';
        else delete newErrors.confirmPassword;
      }

      setErrors(newErrors);
    },
    [errors, password]
  );

  // Update the handleReset function
  const handleReset = useCallback(async () => {
    if (tokenExpired) {
      setLinkExpiredDialogOpen(true);
      return;
    }

    setTouched({ password: true, confirmPassword: true });
    const validationErrors = validateAllFields();
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    setErrors({});
    try {
      const payload = {
        username, // Submit username to backend
        token: tokenParam,
        new_password: password,
        new_password_confirmation: confirmPassword,
        password_update_by: parseInt(levelParam) || 1,
      };

      const res = await api.post<ResetPasswordResponse>('/reset-password-update', payload);

      if (res.data.success) {
        // IMMEDIATELY EXPIRE EVERYTHING
        setTokenExpired(true);
        setRemainingSeconds(0);
        clearTimerState();
        
        // Clear the form
        setPassword('');
        setConfirmPassword('');
        
        // Clear fullname from localStorage
        localStorage.removeItem(`fullname_${usernameParam}_${tokenParam}`);
        
        // CRITICAL: Check if this is LEVEL 2 and has Google redirect
        const isLevelTwo = parseInt(levelParam) === 2;
        const hasGoogleRedirect = res.data.redirect_url === 'https://www.google.com/';
        
        if (isLevelTwo && hasGoogleRedirect) {
          // LEVEL 2: Show success message for 3 seconds, then redirect to Google
          setSuccessDialogOpen(true);
          
          // Auto-redirect to Google after 3 seconds
          setTimeout(() => {
            setSuccessDialogOpen(false);
            // SECURITY CHECK: Only redirect to Google, no other domains
            if (res.data.redirect_url === 'https://www.google.com/') {
              window.location.href = 'https://www.google.com/';
            } else {
              // Fallback to login if redirect URL is not Google
              router.push('/login');
            }
          }, 3000);
        } else {
          // LEVEL 1: Normal behavior - just show success dialog
          setSuccessDialogOpen(true);
        }
      } else {
        setErrors({ submit: res.data.message || 'Failed to reset password.' });
      }
    } catch (error: any) {
      if (error.response?.status === 410) {
        setTokenExpired(true);
        setRemainingSeconds(0);
        setLinkErrorMessage('This password reset link has already been used. Please request a new one.');
        setLinkExpiredDialogOpen(true);
        clearTimerState();
        
        // Clear fullname from localStorage
        localStorage.removeItem(`fullname_${usernameParam}_${tokenParam}`);
        
        // If it's level 2, make sure resetLevel is set to 2
        if (parseInt(levelParam) === 2) {
          setResetLevel(2);
        }
      } else if (error.response?.status === 401) {
        setErrors({ submit: 'Invalid reset token.' });
      } else if (error.response?.status === 422) {
        setErrors({ submit: error.response?.data?.message || 'Validation failed.' });
      } else {
        setErrors({ submit: error.response?.data?.message || 'Failed to reset password.' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    username,
    password,
    confirmPassword,
    tokenParam,
    validateAllFields,
    tokenExpired,
    levelParam,
    clearTimerState,
    router,
    usernameParam
  ]);

  // Update handleSuccessClose to handle level 2 redirect
  const handleSuccessClose = () => {
    setSuccessDialogOpen(false);
    setTokenExpired(true);
    setRemainingSeconds(0);
    clearTimerState();
    
    // Clear fullname from localStorage
    localStorage.removeItem(`fullname_${usernameParam}_${tokenParam}`);
    
    // Check if this is level 2 with Google redirect
    const isLevelTwo = parseInt(levelParam) === 2;
    
    if (isLevelTwo) {
      // Level 2: Redirect to Google when user clicks OK
      window.location.href = 'https://www.google.com/';
    } else {
      // Level 1: Normal redirect to login
      router.push('/login');
    }
  };

  const handleLinkExpiredClose = () => {
    setLinkExpiredDialogOpen(false);
    
    // Clear fullname from localStorage
    localStorage.removeItem(`fullname_${usernameParam}_${tokenParam}`);
    
    // Check if this is level 2
    if (resetLevel === 2) {
      // Level 2: Redirect to Google
      window.location.href = 'https://www.google.com/';
    } else {
      // Level 1: Redirect to login
      router.push('/login');
    }
  };

  const handleFieldChange = useCallback(
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (field === 'password') setPassword(value);
      if (field === 'confirmPassword') setConfirmPassword(value);
      if (touched[field]) validateField(field, value);
    },
    [touched, validateField]
  );

  const handleFieldBlur = useCallback(
    (field: string) => () => {
      setTouched(prev => ({ ...prev, [field]: true }));
      const value = field === 'password' ? password : confirmPassword;
      validateField(field, value);
    },
    [password, confirmPassword, validateField]
  );

  // Show loading while validating
  if (isValidating) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f4f6f8',
        }}
      >
        <Box
          sx={{
            bgcolor: '#fff',
            p: 4,
            borderRadius: 3,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            textAlign: 'center',
          }}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>Validating Link...</Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we verify your reset link.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          bgcolor: '#f4f6f8',
          px: { xs: 1, sm: 0 },
          pt: { xs: 5, sm: 4 },
          pb: { xs: 1, sm: 4 },
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Scroll wrapper with proper centering */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            pt: { xs: 2, sm: 0 },
            pb: { xs: 2, sm: 0 },
          }}
        >
          {/* Form container - Now properly contained within scroll wrapper */}
          <Box
            sx={{
              bgcolor: '#fff',
              p: { xs: 3, sm: 5 },
              borderRadius: { xs: 2, sm: 3 },
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              width: '100%',
              maxWidth: { xs: 'calc(100vw - 32px)', sm: 420 },
              mx: 'auto',
              my: { xs: 2, sm: 'auto' },
              flexShrink: 0,
              opacity: tokenExpired ? 0.6 : 1,
            }}
          >
            {/* HEADER */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: { xs: 3, sm: 4 },
              }}
            >
              <Logo sx={{ alignItems: 'center', justifyContent: 'center', }} />
            </Box>

            {/* TITLE */}
            <Typography variant="h5" sx={{ mb: { xs: 2.5, sm: 3.5 }, fontWeight: 600, textAlign: 'center', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
              Reset Password
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 } }}>
              {/* CHANGED: Show Fullname instead of Username */}
              <TextField
                fullWidth
                label="Fullname"
                value={fullname} // Show fullname if available, otherwise username
                disabled
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: '#000000',
                    backgroundColor: '#f5f5f5',
                  },
                }}
              />

              <TextField
                fullWidth
                label={touched.password && errors.password ? errors.password : 'New Password'}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handleFieldChange('password')}
                onBlur={handleFieldBlur('password')}
                error={touched.password && !!errors.password}
                disabled={isLoading || tokenExpired}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} size="small" edge="end" disabled={isLoading || tokenExpired}>
                        <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={20} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : 'Confirm New Password'}
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={handleFieldChange('confirmPassword')}
                onBlur={handleFieldBlur('confirmPassword')}
                error={touched.confirmPassword && !!errors.confirmPassword}
                disabled={isLoading || tokenExpired}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} size="small" edge="end" disabled={isLoading || tokenExpired}>
                        <Iconify icon={showConfirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={20} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Token Countdown Timer */}
              {!tokenExpired && tokenExpiryTime && remainingSeconds > 0 && (
                <Box sx={{
                  mb: 2,
                  textAlign: 'center',
                  p: 1.5,
                }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {resetLevel === 1
                      ? 'Reset link expires in:'
                      : 'Admin reset link expires in:'}{' '}
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: remainingSeconds <= 0 ? 'error.main' :
                          (resetLevel === 1 && remainingSeconds < 60) ? 'warning.dark' :
                            (resetLevel === 2 && remainingSeconds < 3600) ? 'warning.dark' : 'info.dark'
                      }}
                    >
                      {formatTime(remainingSeconds)}
                    </Typography>
                  </Typography>

                  {resetLevel === 2 && remainingSeconds > 3600 && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      (Valid for 24 hours from request)
                    </Typography>
                  )}
                </Box>
              )}

              {errors.submit && (
                <Typography color="error" variant="caption" sx={{ display: 'block', textAlign: 'center', mt: -1 }}>
                  {errors.submit}
                </Typography>
              )}

              {tokenExpired && (
                <Typography color="error" variant="caption" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
                  Reset link has expired. Please request a new one.
                </Typography>
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleReset}
                disabled={isLoading || tokenExpired}
                sx={{ mt: 1.5, py: 1.3, fontWeight: 600, borderRadius: 1.8, textTransform: 'none', boxShadow: 'none' }}
              >
                {isLoading ? 'RESETTING...' : 'SUBMIT'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onClose={() => { }} disableEscapeKeyDown PaperProps={{ sx: { borderRadius: 3, p: 3, width: 340, textAlign: 'center', boxShadow: '0 8px 28px rgba(17, 24, 39, 0.12)' } }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ width: 68, height: 68, borderRadius: '50%', backgroundColor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Success!</Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {resetLevel === 1
              ? 'You have successfully reset/change your password.'
              : 'Password Reset was successful, please give the new password to the user who requested the reset.'}
          </Typography>

          <Button variant="contained" fullWidth sx={{ py: 1.1, borderRadius: 2, fontWeight: 600 }} onClick={handleSuccessClose}>
            OK
          </Button>
        </Box>
      </Dialog>

      {/* Link Expired Dialog */}
      <Dialog open={linkExpiredDialogOpen} onClose={() => { }} disableEscapeKeyDown PaperProps={{ sx: { borderRadius: 3, p: 3, width: 340, textAlign: 'center', boxShadow: '0 8px 28px rgba(17, 24, 39, 0.12)' } }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ width: 68, height: 68, borderRadius: '50%', backgroundColor: 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Link Expired</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>{linkErrorMessage}</Typography>

          <Button variant="contained" fullWidth sx={{ py: 1.1, borderRadius: 2, fontWeight: 600 }} onClick={handleLinkExpiredClose}>
            {resetLevel === 2 ? 'Close' : 'Close'}
          </Button>
        </Box>
      </Dialog>
    </>
  );
}