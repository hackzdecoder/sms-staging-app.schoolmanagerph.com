import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Link,
  Button,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Dialog,
  DialogContent,
  Checkbox,
  FormControlLabel,
  Stack,
} from '@mui/material';
import { useMediaQuery, useTheme } from '@mui/material';
import { useRouter } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';
import { api } from 'src/routes/api/config';
import axios from 'axios';
import { useTermsConditionsModal, TERMS_CONTENT } from 'src/utils/modal-terms-conditions';
import { Logo } from 'src/components/logo';
import { OtpView } from '../otp/otp-auth';

// -------------------- API Response Type --------------------
interface FirstUserApiResponse {
  success: boolean;
  token?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

// Interface for token validation response
interface TokenValidationResponse {
  success: boolean;
  token?: string;
  message?: string;
  expires_in?: number;
}

// Interface for OTP response
interface OtpResponse {
  success: boolean;
  status?: number;
  message?: string;
  data?: {
    username?: string;
    email_hint?: string;
    reset_token?: string;
    first_user_token?: string;
    first_user_token_expiry_at?: string;
  };
}

// Interface for email pre-fill response
interface UserEmailResponse {
  success: boolean;
  data?: {
    email: string;
    has_email: boolean;
  };
  message?: string;
}

// Fix: Use ReturnType for timer
type TimerType = ReturnType<typeof setInterval> | null;

// ----------------------------------------------------------------------
export function FirstUserView() {
  const router = useRouter();

  // -------------------- State --------------------
  const [form, setForm] = useState({
    username: '',
    fullname: '',
    email: '',
    first_user_token: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStartingCountdown, setIsStartingCountdown] = useState(false);

  // New OTP verification states
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpVerified, setOtpVerified] = useState(() => {
    const persistedOtpVerified = localStorage.getItem('first_user_otp_verified');
    return persistedOtpVerified === 'true';
  });
  const [otpVerificationEmail, setOtpVerificationEmail] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef<TimerType>(null);

  // State for terms checkboxes
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [acceptableUseAccepted, setAcceptableUseAccepted] = useState(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);

  // OTP Success Dialog State
  const [otpSuccessDialog, setOtpSuccessDialog] = useState(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');

  // Ref to prevent multiple email fetch requests
  const hasFetchedEmailRef = useRef(false);

  // Use the modal hook
  const { openModal, closeModal, ModalComponent } = useTermsConditionsModal();

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // -------------------- Countdown Timer Functions --------------------
  const startCountdown = useCallback((seconds: number) => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Set initial state
    setTimeLeft(seconds);
    setIsExpired(false);
    setShowCountdown(true);

    // Start the countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;

        if (newTime <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          setIsExpired(true);
          setShowCountdown(false);
          return 0;
        }
        return newTime;
      });
    }, 1000);
  }, []);

  // Format time for display (MM:SS)
  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // -------------------- Handle Session Expiry --------------------
  useEffect(() => {
    if (isExpired) {
      // Clear all session data
      localStorage.removeItem('first_user_username');
      localStorage.removeItem('first_user_fullname');
      localStorage.removeItem('first_user_otp_verified');
      localStorage.removeItem('first_user_email');
      localStorage.removeItem('first_user_token');

      // Redirect after 3 seconds
      const redirectTimer = setTimeout(() => {
        router.push('/login');
      }, 3000);

      return () => {
        clearTimeout(redirectTimer);
      };
    }
    return undefined;
  }, [isExpired, router]);

  // -------------------- Handlers --------------------
  const handleChange = useCallback(
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: '' }));
    },
    []
  );

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !isLoading && !isExpired) {
        if (!otpVerified) {
          handleSendOtp();
        } else {
          handleSubmit();
        }
      }
    },
    [isLoading, isExpired, otpVerified]
  );

  // -------------------- Pre-fill Email Function --------------------
  const prefillUserEmail = useCallback(async (username: string) => {
    // Prevent multiple API calls
    if (hasFetchedEmailRef.current) return;

    try {
      const response = await api.get<UserEmailResponse>('/get-user-email', {
        params: { username },
      });

      if (response.data.success && response.data.data?.has_email) {
        const existingEmail = response.data.data.email;
        setForm((prev) => ({ ...prev, email: existingEmail }));
        setOtpVerificationEmail(existingEmail);
        localStorage.setItem('first_user_email', existingEmail);
      }
      hasFetchedEmailRef.current = true;
    } catch (error) {
      console.error('Failed to fetch user email:', error);
    }
  }, []);

  // -------------------- OTP Verification Functions --------------------
  const handleSendOtp = useCallback(async () => {
    // Reset timer state when starting OTP flow
    setTimeLeft(0);
    setShowCountdown(false);
    setIsExpired(false);

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Validate email first
    if (!form.email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!emailRegex.test(form.email.trim())) {
      setErrors({ email: 'Invalid email address' });
      return;
    }

    setIsSendingOtp(true);
    setErrors({});
    setOtpSuccessMessage('');

    try {
      // Send OTP to the email
      const response = await api.post<OtpResponse>(
        '/send-otp-first-user',
        {
          username: form.username,
          email: form.email,
        },
        { skipAuthInterceptor: true } as any
      );

      if (response.data.success) {
        setOtpVerificationEmail(form.email);
        localStorage.setItem('first_user_email', form.email);

        const emailHint =
          response.data.data?.email_hint ||
          (form.email
            ? `${form.email.substring(0, 3)}****${form.email.substring(form.email.indexOf('@'))}`
            : 'your email');
        setOtpSuccessMessage(`Check ${emailHint} for the OTP.`);
        setOtpSuccessDialog(true);
      } else {
        setErrors({ email: response.data.message || 'Failed to send OTP' });
      }
    } catch (error: any) {
      setErrors({
        email: error.response?.data?.message || 'Failed to send OTP. Please try again.',
      });
    } finally {
      setIsSendingOtp(false);
    }
  }, [form.email, form.username]);

  const handleOtpVerified = useCallback(
    async (token?: string, expiry?: string) => {
      if (!token) {
        setErrors({ submit: 'OTP verification failed. Please try again.' });
        setShowOtpVerification(false);
        setIsStartingCountdown(false);
        return;
      }

      setOtpVerified(true);
      localStorage.setItem('first_user_otp_verified', 'true');
      setShowOtpVerification(false);

      setIsStartingCountdown(true);

      try {
        localStorage.setItem('first_user_token', token);
        setForm((prev) => ({ ...prev, first_user_token: token }));

        if (expiry) {
          localStorage.setItem('first_user_token_expiry_at', expiry);
        } else {
          console.warn('⚠️ No expiry received from verify-otp response');
          const defaultExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          localStorage.setItem('first_user_token_expiry_at', defaultExpiry);
        }

        const savedExpiry = localStorage.getItem('first_user_token_expiry_at');
        let remainingSeconds = 15 * 60;

        if (savedExpiry) {
          const expiryDate = new Date(savedExpiry);
          const now = new Date();
          const diff = expiryDate.getTime() - now.getTime();
          remainingSeconds = Math.max(0, Math.ceil(diff / 1000));
        }
        startCountdown(remainingSeconds);
        setShowCountdown(true);
      } catch (error) {
        console.error('Failed to start countdown:', error);
        startCountdown(15 * 60);
        setShowCountdown(true);
      } finally {
        setIsStartingCountdown(false);
      }
    },
    [startCountdown]
  );

  // Token Validation on Mount with Pre-fill Email
  useEffect(() => {
    const validateToken = async () => {
      const username = localStorage.getItem('first_user_username');
      const fullname = localStorage.getItem('first_user_fullname');
      const otpVerifiedPersisted = localStorage.getItem('first_user_otp_verified') === 'true';

      if (!username) {
        router.push('/login');
        return;
      }

      setForm((prev) => ({
        ...prev,
        username: username,
        fullname: fullname || username,
      }));

      // ✅ Pre-fill email if exists (only once)
      if (username && !hasFetchedEmailRef.current) {
        await prefillUserEmail(username);
      }

      if (otpVerifiedPersisted) {
        setOtpVerified(true);
        const savedEmail = localStorage.getItem('first_user_email');
        if (savedEmail) {
          setForm((prev) => ({ ...prev, email: savedEmail }));
          setOtpVerificationEmail(savedEmail);
        }

        const savedToken = localStorage.getItem('first_user_token');
        const savedExpiry = localStorage.getItem('first_user_token_expiry_at');

        if (savedToken) {
          setForm((prev) => ({ ...prev, first_user_token: savedToken }));

          if (savedExpiry) {
            const expiryDate = new Date(savedExpiry);
            const now = new Date();
            const diff = expiryDate.getTime() - now.getTime();
            const remainingSeconds = Math.max(0, Math.ceil(diff / 1000));

            if (remainingSeconds > 0) {
              startCountdown(remainingSeconds);
              setShowCountdown(true);
            } else {
              setIsExpired(true);
              localStorage.removeItem('first_user_token');
              localStorage.removeItem('first_user_token_expiry_at');
            }
          } else {
            startCountdown(15 * 60);
            setShowCountdown(true);
          }
        } else {
          setOtpVerified(false);
          localStorage.removeItem('first_user_otp_verified');
        }
      }

      setIsValidatingToken(false);
    };

    validateToken();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [router, startCountdown, prefillUserEmail]);

  // OTP Success Dialog Handler
  const handleOtpSuccessDialogOk = useCallback(() => {
    setOtpSuccessDialog(false);
    setShowOtpVerification(true);
  }, []);

  // -------------------- Validation --------------------
  const validateAllFields = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    const { username, fullname, email } = form;

    if (!username.trim()) newErrors.username = 'Username is required';
    if (!fullname.trim()) newErrors.fullname = 'Fullname is required';
    else if (fullname.trim().length < 3) newErrors.fullname = 'Must be at least 3 characters';

    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!emailRegex.test(email.trim())) newErrors.email = 'Invalid email address';

    if (!termsAccepted) newErrors.terms = 'You must accept the Terms & Conditions';
    if (!acceptableUseAccepted)
      newErrors.acceptableUse = 'You must accept the Acceptable Use Policy';
    if (!privacyPolicyAccepted) newErrors.privacyPolicy = 'You must accept the Privacy Policy';

    setErrors(newErrors);
    return newErrors;
  }, [form, termsAccepted, acceptableUseAccepted, privacyPolicyAccepted]);

  // -------------------- Submit --------------------
  const handleSubmit = useCallback(async () => {
    if (isExpired) {
      setErrors({ submit: 'Session has expired. Please login again.' });
      return;
    }

    if (!otpVerified) {
      setErrors({ submit: 'Please verify your email with OTP first.' });
      return;
    }

    if (!form.first_user_token) {
      setErrors({ submit: 'Session token missing. Please restart the process.' });
      return;
    }

    setErrors({});
    const validationErrors = validateAllFields();
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);

    try {
      const response = await api.post<FirstUserApiResponse>(
        '/update-first-user',
        {
          username: form.username,
          email: form.email,
          first_user_token: form.first_user_token,
          // password intentionally omitted - will be set later in ProfileContent
        },
        { skipAuthInterceptor: true } as any
      );

      if (response.data.success) {
        localStorage.removeItem('first_user_username');
        localStorage.removeItem('first_user_fullname');
        localStorage.removeItem('first_user_otp_verified');
        localStorage.removeItem('first_user_email');
        localStorage.removeItem('first_user_token');

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }
        setIsModalOpen(true);
      } else {
        setErrors({ submit: response.data.message || 'Failed to update user info.' });
      }
    } catch (error: any) {
      if (error.response?.status === 410) {
        localStorage.removeItem('first_user_username');
        localStorage.removeItem('first_user_fullname');
        localStorage.removeItem('first_user_otp_verified');
        localStorage.removeItem('first_user_email');
        localStorage.removeItem('first_user_token');
        setIsExpired(true);
        setErrors({ submit: 'Session has expired. Please login again.' });
        return;
      } else if (error.response?.status === 401) {
        localStorage.removeItem('first_user_username');
        localStorage.removeItem('first_user_fullname');
        localStorage.removeItem('first_user_otp_verified');
        localStorage.removeItem('first_user_email');
        localStorage.removeItem('first_user_token');
        router.push('/login');
        return;
      } else if (error.response?.status === 422) {
        const backendErrors: { [key: string]: string } = {};
        const errorsData = error.response.data.errors;
        if (errorsData) {
          Object.keys(errorsData).forEach((key) => {
            backendErrors[key] = errorsData[key][0];
          });
        }
        setErrors(backendErrors);
      } else if (error.response?.status === 403) {
        setErrors({ submit: error.response.data.message || 'Unauthorized.' });
      } else {
        setErrors({
          submit: error.response?.data?.message || 'Server error occurred. Please try again later.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [form, validateAllFields, router, isExpired, otpVerified]);

  // -------------------- Modal Confirm Handler --------------------
  const handleModalConfirm = () => {
    setIsModalOpen(false);
    router.push('/dashboard');
  };

  // -------------------- Terms Modal Handlers --------------------
  const handleOpenTermsModal = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      openModal({
        title: 'Terms & Conditions',
        content: TERMS_CONTENT.termsAndConditions,
        confirmText: 'I AGREE',
        onConfirm: () => {
          setTermsAccepted(true);
          closeModal();
        },
        size: 'large',
      });
    },
    [openModal, closeModal]
  );

  const handleOpenAcceptableUseModal = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      openModal({
        title: 'Acceptable Use Policy',
        content: TERMS_CONTENT.acceptableUsePolicy,
        confirmText: 'I AGREE',
        onConfirm: () => {
          setAcceptableUseAccepted(true);
          closeModal();
        },
        size: 'large',
      });
    },
    [openModal, closeModal]
  );

  const handleOpenPrivacyPolicyModal = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      openModal({
        title: 'Privacy Policy',
        content: TERMS_CONTENT.privacyPolicy,
        confirmText: 'I ACCEPT',
        onConfirm: () => {
          setPrivacyPolicyAccepted(true);
          closeModal();
        },
        size: 'large',
      });
    },
    [openModal, closeModal]
  );

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // -------------------- Show Loading While Validating Token --------------------
  if (isValidatingToken) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f4f6f8',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body1">Validating session...</Typography>
      </Box>
    );
  }

  // -------------------- Show Expiry Message --------------------
  if (isExpired) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f4f6f8',
          flexDirection: 'column',
          gap: 2,
          p: 3,
        }}
      >
        <Typography variant="h6" color="error" sx={{ fontWeight: 600, textAlign: 'center' }}>
          Session Expired
        </Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', mb: 2 }}>
          Your session has expired. Please login again.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          Redirecting to login page...
        </Typography>
      </Box>
    );
  }

  // -------------------- Show OTP Verification Screen --------------------
  if (showOtpVerification) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          bgcolor: '#f4f6f8',
        }}
      >
        <OtpView username={form.username} email={form.email} onOtpVerified={handleOtpVerified} />
      </Box>
    );
  }

  // -------------------- UI --------------------
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
          }}
        >
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
              mb: { xs: 1, sm: 1 },
              fontWeight: 600,
              textAlign: 'center',
              fontSize: { xs: '1rem', sm: '1.1rem' },
            }}
          >
            {otpVerified ? 'Set Up Your Account' : 'Verify Your Email'}
          </Typography>
          <Typography
            variant="body2"
            sx={{ textAlign: 'center', mb: { xs: 1, sm: 2.2 }, color: 'text.secondary' }}
          >
            {otpVerified
              ? 'Please update your email to continue.'
              : 'Enter your email address to receive a verification code.'}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 } }}>
            <TextField
              fullWidth
              label="Fullname"
              value={form.fullname}
              onChange={handleChange('fullname')}
              onKeyPress={handleKeyPress}
              error={!!errors.fullname}
              helperText={errors.fullname}
              disabled
              size={isMobile ? 'small' : 'medium'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.2 } }}
            />

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              onKeyPress={handleKeyPress}
              error={!!errors.email}
              helperText={errors.email}
              disabled
              size={isMobile ? 'small' : 'medium'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.2 } }}
            />

            {otpVerified && (
              <Box
                sx={{
                  p: 1.5,
                  backgroundColor: '#e7f3ff',
                  borderRadius: 1.5,
                  border: '1px solid #2196f3',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Iconify icon="solar:check-circle-bold" width={20} height={20} color="#2196f3" />
                <Typography variant="body2" sx={{ color: '#1565c0', fontWeight: 500 }}>
                  Email verified: {otpVerificationEmail}
                </Typography>
              </Box>
            )}

            {otpVerified && (
              <Stack spacing={0.5} sx={{ mt: -0.7 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      color="primary"
                      size="small"
                      sx={{ mb: -1 }}
                      disabled={isLoading || isExpired}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ mb: -1 }}>
                      I AGREE to the{' '}
                      <Box
                        component="span"
                        onClick={handleOpenTermsModal}
                        sx={{
                          fontWeight: 600,
                          color: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        Terms & Conditions
                      </Box>
                    </Typography>
                  }
                />
                {errors.terms && (
                  <Typography color="error" variant="caption">
                    {errors.terms}
                  </Typography>
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptableUseAccepted}
                      onChange={(e) => setAcceptableUseAccepted(e.target.checked)}
                      color="primary"
                      size="small"
                      sx={{ mb: -1 }}
                      disabled={isLoading || isExpired}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ mb: -1 }}>
                      I AGREE to the{' '}
                      <Box
                        component="span"
                        onClick={handleOpenAcceptableUseModal}
                        sx={{
                          fontWeight: 600,
                          color: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        Acceptable Use Policy
                      </Box>
                    </Typography>
                  }
                />
                {errors.acceptableUse && (
                  <Typography color="error" variant="caption">
                    {errors.acceptableUse}
                  </Typography>
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={privacyPolicyAccepted}
                      onChange={(e) => setPrivacyPolicyAccepted(e.target.checked)}
                      color="primary"
                      size="small"
                      sx={{ mb: -1 }}
                      disabled={isLoading || isExpired}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ mb: -1 }}>
                      I ACCEPT the{' '}
                      <Box
                        component="span"
                        onClick={handleOpenPrivacyPolicyModal}
                        sx={{
                          fontWeight: 600,
                          color: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        Privacy Policy
                      </Box>
                    </Typography>
                  }
                />
                {errors.privacyPolicy && (
                  <Typography color="error" variant="caption">
                    {errors.privacyPolicy}
                  </Typography>
                )}
              </Stack>
            )}

            {errors.submit && (
              <Typography
                color="error"
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  mt: -1,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                }}
              >
                {errors.submit}
              </Typography>
            )}

            {isStartingCountdown && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 2,
                  p: 2,
                }}
              >
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                  Starting session timer...
                </Typography>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              disabled={
                isLoading ||
                isExpired ||
                isStartingCountdown ||
                isSendingOtp ||
                (otpVerified
                  ? !termsAccepted || !acceptableUseAccepted || !privacyPolicyAccepted
                  : false)
              }
              onClick={otpVerified ? handleSubmit : handleSendOtp}
              sx={{
                py: { xs: 1.1, sm: 1.4 },
                fontWeight: 600,
                borderRadius: 1.8,
                textTransform: 'none',
                boxShadow: 'none',
                backgroundColor: isExpired ? 'grey.400' : undefined,
              }}
            >
              {isExpired
                ? 'SESSION EXPIRED'
                : isStartingCountdown
                  ? 'Starting timer...'
                  : isLoading
                    ? 'Submitting...'
                    : isSendingOtp
                      ? 'Sending OTP...'
                      : otpVerified
                        ? 'Confirm & Continue'
                        : 'Send OTP'}
            </Button>

            {showCountdown && otpVerified && timeLeft > 0 && !isExpired && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: { xs: 2, sm: 3 },
                  p: 1.5,
                  backgroundColor: timeLeft < 180 ? '#fff3cd' : '#e7f3ff',
                  borderRadius: 1.5,
                  border: `1px solid ${timeLeft < 180 ? '#ffc107' : '#2196f3'}`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: timeLeft < 180 ? '#d84315' : '#1565c0',
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  }}
                >
                  Session expires in: {formatTime(timeLeft)}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.3 }}>
              <Link
                variant="body2"
                color="text.secondary"
                sx={{
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: { xs: '0.82rem', sm: '0.875rem' },
                  '&:hover': { color: 'primary.main' },
                  ...((isLoading || isExpired) && { pointerEvents: 'none', opacity: 0.5 }),
                }}
                onClick={() => {
                  if (!isLoading && !isExpired) {
                    localStorage.removeItem('first_user_username');
                    localStorage.removeItem('first_user_fullname');
                    localStorage.removeItem('first_user_otp_verified');
                    localStorage.removeItem('first_user_email');
                    localStorage.removeItem('first_user_token');
                    router.push('/login');
                  }
                }}
              >
                Return to Login Screen
              </Link>
            </Box>
          </Box>
        </Box>
      </Box>

      <ModalComponent />

      {/* OTP SUCCESS DIALOG */}
      <Dialog
        open={otpSuccessDialog}
        onClose={() => {}}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 3,
            width: 340,
            textAlign: 'center',
            boxShadow: '0 8px 28px rgba(17, 24, 39, 0.12)',
          },
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              backgroundColor: 'success.light',
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Success!
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {otpSuccessMessage || 'Check your email for the OTP.'}
          </Typography>

          <Button
            variant="contained"
            fullWidth
            sx={{
              py: 1.1,
              borderRadius: 2,
              fontWeight: 600,
            }}
            onClick={handleOtpSuccessDialogOk}
          >
            OK
          </Button>
        </Box>
      </Dialog>

      {/* SUCCESS MODAL */}
      <Dialog
        open={isModalOpen}
        onClose={() => {}}
        disableEscapeKeyDown
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Account Updated
          </Typography>
          <IconButton
            onClick={handleModalConfirm}
            sx={{
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
            }}
          >
            <Iconify icon="solar:check-circle-bold" width={20} height={20} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.dark' }}>
              Success Information
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Typography variant="body1" fontWeight={500} color="success.main">
                  Account Updated Successfully
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              p: 2,
              bgcolor: 'success.light',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'success.main',
              mt: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: 'success.dark', whiteSpace: 'pre-wrap' }}>
              Your account information has been successfully updated. You can now access your
              dashboard.
            </Typography>
          </Box>
        </DialogContent>

        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'center',
            bgcolor: 'grey.50',
          }}
        >
          <Button
            variant="contained"
            onClick={handleModalConfirm}
            sx={{
              borderRadius: 1,
              px: 4,
              py: 1,
              fontWeight: 600,
            }}
            fullWidth
          >
            Continue to Dashboard
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
