import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Link,
  Button,
  TextField,
  Typography,
  Dialog,
} from '@mui/material';
import { useRouter } from 'src/routes/hooks';
import api from 'src/routes/api/config';
import { Logo } from 'src/components/logo';

interface OtpResponse {
  success: boolean;
  status?: number;
  message?: string;
  data?: {
    username?: string;
    email_hint?: string;
    reset_token?: string;
    first_user_token?: string;
    first_user_token_expiry_at?: string; // ✅ ADD THIS
  };
}

interface OtpSessionResponse {
  success: boolean;
  data?: {
    otp_code_expired_at: string;
    has_otp: boolean;
  };
}

interface OtpViewProps {
  username: string;
  email?: string;
  onOtpVerified?: (token?: string, expiry?: string) => void; // ✅ UPDATED: Accept expiry parameter
}

export function OtpView({ username, email, onOtpVerified }: OtpViewProps) {
  const router = useRouter();
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successDialogMessage, setSuccessDialogMessage] = useState('');
  const [otpExpired, setOtpExpired] = useState(false);
  const [showInvalidAccessDialog, setShowInvalidAccessDialog] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [otpExpiryTime, setOtpExpiryTime] = useState<Date | null>(null);
  const [resetToken, setResetToken] = useState<string>(''); // ✅ FIXED: Declared resetToken
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Parse MySQL datetime string to Date object */
  const parseMySQLDateTime = useCallback((mysqlDateTime: string): Date => {
    const isoString = mysqlDateTime.replace(' ', 'T');
    return new Date(isoString);
  }, []);

  /** Calculate remaining seconds from expiry time */
  const calculateRemainingSeconds = useCallback((expiryTime: Date | null): number => {
    if (!expiryTime) return 0;

    const now = new Date();
    const expiry = new Date(expiryTime);
    const diff = expiry.getTime() - now.getTime();

    const seconds = Math.max(0, Math.ceil(diff / 1000));
    return seconds;
  }, []);

  /** Fetch OTP session on mount */
  useEffect(() => {
    const fetchOtpSession = async () => {
      try {
        const res = await api.get<OtpSessionResponse>('/otp-session', {
          params: { username }
        });

        if (res.data.success && res.data.data && res.data.data.has_otp) {
          const expiryString = res.data.data.otp_code_expired_at;
          const expiry = parseMySQLDateTime(expiryString);
          setOtpExpiryTime(expiry);

          const initialSeconds = calculateRemainingSeconds(expiry);
          const displaySeconds = initialSeconds >= 290 ? 300 : initialSeconds;

          if (displaySeconds <= 0) {
            setOtpExpired(true);
            setShowInvalidAccessDialog(true);
          } else {
            setOtpExpired(false);
            setRemainingSeconds(displaySeconds);
          }
        } else {
          setOtpExpired(true);
          setShowInvalidAccessDialog(true);
        }
      } catch (fetchError) {
        setOtpExpired(true);
        setShowInvalidAccessDialog(true);
      } finally {
        setCheckingSession(false);
      }
    };

    if (username) fetchOtpSession();
    else {
      setCheckingSession(false);
      setOtpExpired(true);
      setShowInvalidAccessDialog(true);
    }
  }, [username, parseMySQLDateTime, calculateRemainingSeconds]);

  /** Start countdown timer when we have expiry time */
  useEffect(() => {
    if (!otpExpiryTime || otpExpired || remainingSeconds <= 0) {
      const cleanup = () => {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      };
      cleanup();
      return cleanup;
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    countdownTimerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setOtpExpired(true);
          setShowInvalidAccessDialog(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [otpExpiryTime, otpExpired, remainingSeconds]);

  /** Auto-focus first input */
  useEffect(() => {
    if (!otpExpired && !checkingSession) {
      inputRefs.current[0]?.focus();
    }
  }, [otpExpired, checkingSession]);

  /** Countdown timer for resend */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  /** Format seconds to seconds-only display */
  const formatTime = useCallback((seconds: number) => {
    if (seconds <= 0) return 'Expired';
    return `${seconds} seconds`;
  }, []);

  /** Validate OTP */
  const validateOtp = useCallback(() => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return false;
    }
    setError('');
    return true;
  }, [otp]);

  /** Input change */
  const handleChange = useCallback((value: string, index: number) => {
    if (otpExpired) return;
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (error) setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }, [otp, otpExpired, error]);

  /** Key down handler */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (otpExpired) return;
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp, otpExpired]);

  /** Clear OTP fields and focus first input */
  const clearOtpFields = useCallback(() => {
    setOtp(Array(6).fill(''));
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 10);
  }, []);

  /** ✅ FIXED: Handle Verify */
  const handleVerify = useCallback(async () => {
    if (otpExpired) return;
    setTouched(true);
    if (!validateOtp()) return;

    setLoading(true);
    try {
      const response = await api.post('/verify-otp', {
        otp_code: otp.join(''),
        username
      }, {
        skipAuthInterceptor: true
      } as any) as { data: OtpResponse };

      const res = response.data;

      if (res.success) {
        // ✅ Get the token AND expiry from response
        const firstUserToken = res.data?.first_user_token;
        const firstUserTokenExpiryAt = res.data?.first_user_token_expiry_at;
        const passwordResetToken = res.data?.reset_token; // ✅ Use reset_token from response
        
        if (firstUserToken) {
          // First-user flow
          setSuccessDialogMessage(`OTP verification was successful! You can now proceed with registration.`);
          
          // ✅ Store token in localStorage immediately
          localStorage.setItem('first_user_token', firstUserToken);
          
          // ✅ Call the callback WITH BOTH token and expiry
          if (onOtpVerified) {
            onOtpVerified(firstUserToken, firstUserTokenExpiryAt);
          }
        } else if (passwordResetToken) {
          // Password reset flow
          setResetToken(passwordResetToken);
          setSuccessDialogMessage(`OTP verification was successful! You can now reset your password.`);
          
          if (onOtpVerified) {
            onOtpVerified(); // Just callback without token
          }
        }
        
        setShowSuccessDialog(true);
      } else {
        setError(res.message ?? 'Verification failed.');
        clearOtpFields();
      }
    } catch (err: any) {
      let errorMessage = err?.response?.data?.message ||
        err?.message ||
        'Verification failed. Please try again.';

      if (err?.response?.status === 400) {
        errorMessage = 'Invalid OTP. Please try again.';
      } else if (err?.response?.status === 410) {
        errorMessage = 'OTP has expired. Please request a new one.';
        setOtpExpired(true);
      }

      setError(errorMessage);
      clearOtpFields();
    } finally {
      setLoading(false);
    }
  }, [otp, username, validateOtp, otpExpired, clearOtpFields, onOtpVerified]);

  /** Press Enter to verify */
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (otpExpired) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  }, [otpExpired, handleVerify]);

  /** ✅ FIXED: Resend OTP */
  const handleResendOtp = useCallback(async () => {
    if (resendCountdown > 0 || otpExpired) return;
    setLoading(true);
    setError('');

    try {
      let response;

      if (email) {
        response = await api.post('/send-otp-first-user',
          {
            username,
            email
          },
          { skipAuthInterceptor: true } as any
        ) as { data: OtpResponse };
      } else {
        response = await api.post('/resend-otp',
          { username },
          { skipAuthInterceptor: true } as any
        ) as { data: OtpResponse };
      }

      const res = response.data;

      if (res.success) {
        clearOtpFields();
        setResendCountdown(30);
        setOtpExpired(false);

        const sessionResponse = await api.get('/otp-session',
          { params: { username } }
        ) as { data: OtpSessionResponse };

        const session = sessionResponse.data;

        if (session.success && session.data?.otp_code_expired_at) {
          const newExpiry = parseMySQLDateTime(session.data.otp_code_expired_at);
          setOtpExpiryTime(newExpiry);
          const newSeconds = calculateRemainingSeconds(newExpiry);
          setRemainingSeconds(newSeconds);
        }

        setSuccessDialogMessage(`A new OTP has been sent to your email.`);
        setShowSuccessDialog(true);
      } else {
        setError(res.message ?? 'Failed to resend OTP.');
      }
    } catch (err: any) {
      let errorMessage = err?.response?.data?.message ||
        err?.message ||
        'Failed to resend OTP. Please try again.';

      if (email && (err?.response?.status === 422 || errorMessage.includes('email') || errorMessage.includes('Email'))) {
        errorMessage = 'Email verification failed. Please go back and re-enter your email.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [resendCountdown, username, email, otpExpired, clearOtpFields, parseMySQLDateTime, calculateRemainingSeconds]);

  /** Dialog handlers */
  const handleSuccessClose = () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    setShowSuccessDialog(false);

    if (resetToken && username) {
      router.push(`/password-reset?token=${resetToken}&username=${encodeURIComponent(username)}&level=1`);
    } else if (onOtpVerified) {
      // First-user flow - callback already called
    } else {
      router.push('/login');
    }
  };

  const handleInvalidAccessClose = () => {
    setShowInvalidAccessDialog(false);
    router.push('/login');
  };

  // Clean up timers on unmount
  useEffect(() => () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  /** Show loader while checking session */
  if (checkingSession) {
    return (
      <Box sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f4f6f8'
      }}>
        <Typography>Verifying...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f4f6f8',
        px: { xs: 1, sm: 0 },
        py: { xs: 1, sm: 1 },
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Scrollable container wrapper */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 2, sm: 3 },
        }}
      >
        <Box
          sx={{
            bgcolor: '#fff',
            p: { xs: 3, sm: 5 },
            borderRadius: { xs: 2, sm: 3 },
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            width: '100%',
            maxWidth: { xs: 'calc(100vw - 32px)', sm: 420 },
            mx: 'auto',
            my: 'auto',
            textAlign: 'center',
            opacity: otpExpired ? 0.6 : 1,
          }}
        >
          {/* Header - Logo Section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: { xs: 3, sm: 4 },
            }}
          >
            <Logo sx={{ alignItems: 'center', justifyContent: 'center' }} />
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              mb: { xs: 2, sm: 2.5 },
              fontSize: { xs: '1rem', sm: '1.1rem' },
            }}
          >
            Verify Your Account
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: { xs: 3, sm: 3.5 },
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
            }}
          >
            Enter the 6-digit OTP sent to your email.
          </Typography>

          {/* OTP Inputs */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 1, sm: 1.5 },
              mb: { xs: 3, sm: 3.5 },
            }}
          >
            {otp.map((digit, index) => (
              <TextField
                key={index}
                inputRef={(el) => (inputRefs.current[index] = el)}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e as React.KeyboardEvent<HTMLInputElement>, index)}
                onKeyPress={(e) => handleKeyPress(e as React.KeyboardEvent<HTMLInputElement>)}
                error={touched && !!error}
                variant="outlined"
                InputProps={{
                  sx: {
                    p: 0,
                    textAlign: 'center',
                    '& input': {
                      textAlign: 'center',
                      fontSize: { xs: 18, sm: 20 },
                      fontWeight: 600,
                      width: { xs: 40, sm: 44 },
                      height: { xs: 45, sm: 50 },
                      padding: 0,
                    },
                  },
                }}
                inputProps={{ maxLength: 1 }}
                disabled={otpExpired || loading}
              />
            ))}
          </Box>

          {/* OTP Countdown Timer */}
          {!otpExpired && otpExpiryTime && remainingSeconds > 0 && (
            <Box
              sx={{
                mt: { xs: 1.5, sm: 2 },
                mb: { xs: 1, sm: 1.5 },
                textAlign: 'center',
                p: { xs: 1, sm: 1.5 },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                }}
              >
                Your OTP will expire in:{' '}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    color: remainingSeconds <= 0 ? 'error.main' :
                      remainingSeconds < 60 ? 'warning.dark' : 'info.dark',
                  }}
                >
                  {formatTime(remainingSeconds)}
                </Typography>
              </Typography>
            </Box>
          )}

          {touched && error && (
            <Typography
              variant="caption"
              color="error"
              sx={{ mb: { xs: 1.5, sm: 2 }, display: 'block' }}
            >
              {error}
            </Typography>
          )}
          {otpExpired && !error && (
            <Typography
              variant="caption"
              color="error"
              sx={{ mb: { xs: 1.5, sm: 2 }, display: 'block' }}
            >
              OTP has expired. Please request a new one.
            </Typography>
          )}

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleVerify}
            disabled={loading || otpExpired}
            sx={{
              mt: { xs: 1.5, sm: 2 },
              py: { xs: 1.1, sm: 1.4 },
              fontWeight: 600,
              borderRadius: 1.8,
            }}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>

          <Link
            variant="body2"
            color={resendCountdown > 0 || otpExpired ? 'text.disabled' : 'text.secondary'}
            sx={{
              display: 'block',
              mt: { xs: 1, sm: 1.5 },
              cursor: resendCountdown > 0 || otpExpired ? 'not-allowed' : 'pointer',
              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
            }}
            onClick={handleResendOtp}
          >
            {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
          </Link>
        </Box>
      </Box>

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={(event, reason) => {
          if (reason === 'backdropClick') {
            return;
          }
          handleSuccessClose();
        }}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 3,
            width: 340,
            textAlign: 'center',
            boxShadow: '0 8px 28px rgba(17, 24, 39, 0.12)'
          }
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            backgroundColor: 'success.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2
          }}>
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Success!
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, whiteSpace: 'pre-line' }}>
            {successDialogMessage}
          </Typography>

          <Button
            variant="contained"
            fullWidth
            sx={{ py: 1.1, borderRadius: 2, fontWeight: 600 }}
            onClick={handleSuccessClose}
          >
            {onOtpVerified ? 'Continue to Registration' : 'Continue to Password Reset'}
          </Button>
        </Box>
      </Dialog>

      {/* Invalid Access Dialog */}
      <Dialog
        open={showInvalidAccessDialog}
        onClose={(event, reason) => {
          if (reason === 'backdropClick') {
            return;
          }
          handleInvalidAccessClose();
        }}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 3,
            width: 340,
            textAlign: 'center',
            boxShadow: '0 8px 28px rgba(17, 24, 39, 0.12)'
          }
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            backgroundColor: 'error.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2
          }}>
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
            Invalid Access
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            OTP has expired or is invalid. Please request a new OTP from the login page.
          </Typography>

          <Button
            variant="contained"
            fullWidth
            sx={{ py: 1.1, borderRadius: 2, fontWeight: 600 }}
            onClick={handleInvalidAccessClose}
          >
            Return to Login Screen
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}