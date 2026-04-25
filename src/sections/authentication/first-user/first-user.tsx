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
import { useTermsConditionsModal, TERMS_CONTENT } from 'src/utils/modal-terms-conditions';
import { Logo } from 'src/components/logo';
import { OtpView } from '../otp/otp-auth';

interface FirstUserApiResponse {
  success: boolean;
  token?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

interface OtpResponse {
  success: boolean;
  status?: number;
  message: string;
  data?: {
    username?: string;
    email_hint?: string;
    reset_token?: string;
    first_user_token?: string;
    first_user_token_expiry_at?: string;
  };
}

interface UserEmailResponse {
  success: boolean;
  data?: {
    email: string;
    fullname?: string;
    has_email: boolean;
  };
  message?: string;
}

type TimerType = ReturnType<typeof setInterval> | null;

export function FirstUserView() {
  const router = useRouter();

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
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerificationEmail, setOtpVerificationEmail] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const timerRef = useRef<TimerType>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [acceptableUseAccepted, setAcceptableUseAccepted] = useState(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [otpSuccessDialog, setOtpSuccessDialog] = useState(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const hasFetchedEmailRef = useRef(false);
  const { openModal, closeModal, ModalComponent } = useTermsConditionsModal();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const startCountdown = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(seconds);
    setIsExpired(false);
    setShowCountdown(true);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsExpired(true);
          setShowCountdown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isExpired) {
      localStorage.removeItem('first_user_username');
      localStorage.removeItem('first_user_fullname');
      localStorage.removeItem('first_user_otp_verified');
      localStorage.removeItem('first_user_email');
      localStorage.removeItem('first_user_token');
      setTimeout(() => router.push('/login'), 3000);
    }
  }, [isExpired, router]);

  const handleChange = useCallback(
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: '' }));
    },
    []
  );

  const prefillUserEmail = useCallback(async (username: string) => {
    if (hasFetchedEmailRef.current) return;
    try {
      const schoolCode = localStorage.getItem('user_school_code');
      if (!schoolCode) {
        hasFetchedEmailRef.current = true;
        return;
      }
      const response = await api.get<UserEmailResponse>('/get-user-email', {
        params: { username, school_code: schoolCode },
      });
      if (response.data.success && response.data.data?.has_email) {
        setForm((prev) => ({ ...prev, email: response.data.data?.email || '' }));
        setOtpVerificationEmail(response.data.data?.email || '');
        localStorage.setItem('first_user_email', response.data.data?.email || '');
      }
      hasFetchedEmailRef.current = true;
    } catch (error) {
      console.error('Failed to fetch user email:', error);
      hasFetchedEmailRef.current = true;
    }
  }, []);

  const handleSendOtp = useCallback(async () => {
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
      // ✅ Get school_code from localStorage
      const schoolCode = localStorage.getItem('user_school_code');

      const response = await api.post<OtpResponse>(
        '/send-otp-first-user',
        {
          username: form.username,
          email: form.email,
          school_code: schoolCode, // ✅ ADD school_code
        },
        { skipAuthInterceptor: true } as any
      );

      if (response.data.success) {
        setOtpVerificationEmail(form.email);
        localStorage.setItem('first_user_email', form.email);

        // Use response.data.message from backend
        const successMessage = response.data.message;
        setOtpSuccessMessage(successMessage);
        setOtpSuccessDialog(true);
      } else {
        setErrors({ email: response.data.message || 'Failed to send OTP' });
      }
    } catch (error: any) {
      setErrors({ email: error.response?.data?.message || 'Failed to send OTP' });
    } finally {
      setIsSendingOtp(false);
    }
  }, [form.email, form.username]);

  const handleOtpVerified = useCallback(
    async (token?: string, expiry?: string) => {
      if (!token) {
        setErrors({ submit: 'OTP verification failed' });
        setShowOtpVerification(false);
        return;
      }
      setOtpVerified(true);
      localStorage.setItem('first_user_otp_verified', 'true');
      setShowOtpVerification(false);
      localStorage.setItem('first_user_token', token);
      setForm((prev) => ({ ...prev, first_user_token: token }));
      if (expiry) {
        localStorage.setItem('first_user_token_expiry_at', expiry);
      }
      startCountdown(15 * 60);
      setShowCountdown(true);
    },
    [startCountdown]
  );

  useEffect(() => {
    const validateToken = async () => {
      const username = localStorage.getItem('first_user_username');
      const fullname = localStorage.getItem('first_user_fullname');

      if (!username) {
        router.push('/login');
        return;
      }

      setForm({
        username: username,
        fullname: fullname || username,
        email: '',
        first_user_token: '',
      });

      await prefillUserEmail(username);

      const savedEmail = localStorage.getItem('first_user_email');
      if (savedEmail) {
        setForm((prev) => ({ ...prev, email: savedEmail }));
        setOtpVerificationEmail(savedEmail);
      }

      const savedToken = localStorage.getItem('first_user_token');
      if (savedToken) {
        setForm((prev) => ({ ...prev, first_user_token: savedToken }));
        setOtpVerified(true);
        const savedExpiry = localStorage.getItem('first_user_token_expiry_at');
        if (savedExpiry) {
          const remainingSeconds = Math.max(
            0,
            Math.ceil((new Date(savedExpiry).getTime() - Date.now()) / 1000)
          );
          if (remainingSeconds > 0) {
            startCountdown(remainingSeconds);
            setShowCountdown(true);
          } else {
            setIsExpired(true);
          }
        } else {
          startCountdown(15 * 60);
          setShowCountdown(true);
        }
      }

      setIsValidatingToken(false);
    };

    validateToken();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [router, startCountdown, prefillUserEmail]);

  const handleOtpSuccessDialogOk = useCallback(() => {
    setOtpSuccessDialog(false);
    setShowOtpVerification(true);
  }, []);

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

  const handleSubmit = useCallback(async () => {
    if (isExpired) {
      setErrors({ submit: 'Session has expired' });
      return;
    }
    if (!otpVerified) {
      setErrors({ submit: 'Please verify your email with OTP first' });
      return;
    }
    if (!form.first_user_token) {
      setErrors({ submit: 'Session token missing' });
      return;
    }

    const validationErrors = validateAllFields();
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    try {
      const response = await api.post<FirstUserApiResponse>(
        '/update-first-user',
        { username: form.username, email: form.email, first_user_token: form.first_user_token },
        { skipAuthInterceptor: true } as any
      );

      if (response.data.success) {
        localStorage.removeItem('first_user_username');
        localStorage.removeItem('first_user_fullname');
        localStorage.removeItem('first_user_otp_verified');
        localStorage.removeItem('first_user_email');
        localStorage.removeItem('first_user_token');
        if (timerRef.current) clearInterval(timerRef.current);
        if (response.data.token) localStorage.setItem('auth_token', response.data.token);
        setIsModalOpen(true);
      } else {
        setErrors({ submit: response.data.message || 'Failed to update' });
      }
    } catch (error: any) {
      if (error.response?.status === 410 || error.response?.status === 401) {
        localStorage.removeItem('first_user_username');
        localStorage.removeItem('first_user_fullname');
        localStorage.removeItem('first_user_otp_verified');
        localStorage.removeItem('first_user_email');
        localStorage.removeItem('first_user_token');
        router.push('/login');
      } else {
        setErrors({ submit: error.response?.data?.message || 'Server error' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [form, validateAllFields, router, isExpired, otpVerified]);

  const handleModalConfirm = () => {
    setIsModalOpen(false);
    router.push('/dashboard');
  };

  const handleOpenTermsModal = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
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
        <Typography variant="body1" sx={{ textAlign: 'center' }}>
          Your session has expired. Please login again.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Redirecting to login page...
        </Typography>
      </Box>
    );
  }

  if (showOtpVerification) {
    return (
      <Box sx={{ position: 'fixed', inset: 0, bgcolor: '#f4f6f8' }}>
        <OtpView
          username={form.username}
          email={form.email}
          schoolCode={localStorage.getItem('user_school_code') || ''}
          onOtpVerified={handleOtpVerified}
        />
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
        p: { xs: 1, sm: 0 },
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
            <Logo />
          </Box>

          <Typography
            variant="h5"
            sx={{
              mb: 1,
              fontWeight: 600,
              textAlign: 'center',
              fontSize: { xs: '1rem', sm: '1.1rem' },
            }}
          >
            {otpVerified ? 'Terms and Policies' : 'Verify Your Email'}
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
              error={!!errors.email}
              helperText={errors.email}
              disabled={otpVerified}
              size={isMobile ? 'small' : 'medium'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.2 } }}
            />

            {otpVerified && (
              <>
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

                <Stack spacing={0.5} sx={{ mt: -0.7 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        color="primary"
                        size="small"
                        disabled={isLoading || isExpired}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I AGREE to the{' '}
                        <Box
                          component="span"
                          onClick={handleOpenTermsModal}
                          sx={{ fontWeight: 600, color: 'primary.main', cursor: 'pointer' }}
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
                        disabled={isLoading || isExpired}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I AGREE to the{' '}
                        <Box
                          component="span"
                          onClick={handleOpenAcceptableUseModal}
                          sx={{ fontWeight: 600, color: 'primary.main', cursor: 'pointer' }}
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
                        disabled={isLoading || isExpired}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I ACCEPT the{' '}
                        <Box
                          component="span"
                          onClick={handleOpenPrivacyPolicyModal}
                          sx={{ fontWeight: 600, color: 'primary.main', cursor: 'pointer' }}
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
              </>
            )}

            {errors.submit && (
              <Typography
                color="error"
                variant="caption"
                sx={{ display: 'block', textAlign: 'center' }}
              >
                {errors.submit}
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              disabled={
                isLoading ||
                isExpired ||
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
              }}
            >
              {isExpired
                ? 'SESSION EXPIRED'
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
                  p: 1.5,
                  backgroundColor: timeLeft < 180 ? '#fff3cd' : '#e7f3ff',
                  borderRadius: 1.5,
                  border: `1px solid ${timeLeft < 180 ? '#ffc107' : '#2196f3'}`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: timeLeft < 180 ? '#d84315' : '#1565c0' }}
                >
                  Session expires in: {formatTime(timeLeft)}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Link
                variant="body2"
                color="text.secondary"
                sx={{ cursor: 'pointer', fontWeight: 500 }}
                onClick={() => {
                  localStorage.removeItem('first_user_username');
                  localStorage.removeItem('first_user_fullname');
                  localStorage.removeItem('first_user_otp_verified');
                  localStorage.removeItem('first_user_email');
                  localStorage.removeItem('first_user_token');
                  router.push('/login');
                }}
              >
                Return to Login Screen
              </Link>
            </Box>
          </Box>
        </Box>
      </Box>

      <ModalComponent />

      <Dialog
        open={otpSuccessDialog}
        onClose={() => {}}
        disableEscapeKeyDown
        PaperProps={{ sx: { borderRadius: 3, p: 3, width: 340, textAlign: 'center' } }}
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
          <Button variant="contained" fullWidth onClick={handleOtpSuccessDialogOk}>
            OK
          </Button>
        </Box>
      </Dialog>

      <Dialog
        open={isModalOpen}
        onClose={() => {}}
        disableEscapeKeyDown
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}
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
          <IconButton onClick={handleModalConfirm} sx={{ color: 'white' }}>
            <Iconify icon="solar:check-circle-bold" />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.dark' }}>
            Success Information
          </Typography>
          <Typography variant="body2" sx={{ color: 'success.dark' }}>
            Your account information has been successfully updated.
          </Typography>
        </DialogContent>
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Button variant="contained" onClick={handleModalConfirm} fullWidth>
            Continue to Dashboard
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
