import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Link,
  Button,
  TextField,
  IconButton,
  Typography,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useRouter } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';
import { api } from 'src/routes/api/config';
import { Logo } from 'src/components/logo';

interface LoginResponse {
  token?: string;
  user?: {
    user_id: number;
    username: string;
    email?: string;
    full_name?: string;
    nickname?: string;
    name?: string;
  };
  redirect_to?: string;
  requires_email?: boolean;
  success?: boolean;
  message?: string;
  // first_user_token?: string;
}

export function LoginView() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/dashboard');
    }

    // NEW: Clear any first-user tokens when arriving at login page
    localStorage.removeItem('first_user_username');
    localStorage.removeItem('first_user_token');
  }, [router]);

  const validateAllFields = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return newErrors;
  }, [username, password]);

  const validateField = useCallback(
    (name: string, value: string) => {
      const newErrors = { ...errors };
      if (name === 'username') {
        if (!value.trim()) newErrors.username = 'Username is required';
        else delete newErrors.username;
      }
      if (name === 'password') {
        if (!value) newErrors.password = 'Password is required';
        else delete newErrors.password;
      }
      setErrors(newErrors);
    },
    [errors]
  );

  // Update the handleSignIn function:
  const handleSignIn = useCallback(async () => {
    setTouched({ username: true, password: true });
    const validationErrors = validateAllFields();
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);
    setErrors({}); // clear previous submit errors
    try {
      const response = await api.post<LoginResponse>(
        '/login',
        { username, password },
        { skipAuthInterceptor: true } as any
      );

      if (response.data.success) {
        // Save token if available
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }

        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        // Redirect based on backend response
        const redirectPath = response.data.redirect_to ?? '/dashboard';

        // ✅ FIXED: Only store username and fullname for first-user flow
        if (redirectPath === '/first-user') {
          localStorage.setItem('first_user_username', username);
          
          // Store full_name for display
          if (response.data.user?.full_name) {
            localStorage.setItem('first_user_fullname', response.data.user.full_name);
          } else {
            localStorage.setItem('first_user_fullname', username); // Fallback
          }
          
          // ❌ DO NOT store first_user_token here
          // Token will be generated AFTER OTP verification
        }

        router.push(redirectPath);
      } else {
        setErrors({ submit: response.data.message || 'Login failed.' });
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Invalid username or password';
      setErrors({ submit: message });
    } finally {
      setIsLoading(false);
    }
  }, [username, password, router, validateAllFields]);

  const handleFieldChange = useCallback(
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (field === 'username') setUsername(value);
      if (field === 'password') setPassword(value);
      if (touched[field]) validateField(field, value);
    },
    [touched, validateField]
  );

  const handleFieldBlur = useCallback(
    (field: string) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validateField(field, field === 'username' ? username : password);
    },
    [username, password, validateField]
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f4f6f8',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSignIn();
        }}
        sx={{
          bgcolor: '#fff',
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {/* Logo - Keep original size */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, marginLeft: -6.5 }}>
          <Logo />
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          sx={{
            textAlign: 'center',
            fontWeight: 600,
            color: 'text.primary',
            mb: 1,
          }}
        >
          Login to your account
        </Typography>

        {/* Form Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={handleFieldChange('username')}
            onBlur={handleFieldBlur('username')}
            error={touched.username && !!errors.username}
            helperText={touched.username && errors.username}
            disabled={isLoading}
            size="medium"
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handleFieldChange('password')}
            onBlur={handleFieldBlur('password')}
            error={touched.password && !!errors.password}
            helperText={touched.password && errors.password}
            disabled={isLoading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    disabled={isLoading}
                  >
                    <Iconify
                      icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                      width={20}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            size="medium"
          />

          {/* Keep me signed in */}
          <FormControlLabel
            control={
              <Checkbox
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                disabled={isLoading}
                size="small"
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                Keep me signed in
              </Typography>
            }
            sx={{ mt: -1 }}
          />

          {/* Submit Error */}
          {errors.submit && (
            <Typography
              color="error"
              variant="body2"
              sx={{
                textAlign: 'center',
                bgcolor: 'error.lighter',
                p: 1,
                borderRadius: 1,
              }}
            >
              {errors.submit}
            </Typography>
          )}

          {/* Login Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            disabled={isLoading}
            sx={{
              mt: 1,
              py: 1.5,
              fontWeight: 600,
              borderRadius: 1.5,
            }}
          >
            {isLoading ? 'Signing in...' : 'Log in'}
          </Button>

          {/* Forgot Password Link */}
          <Box sx={{ textAlign: 'center', pt: 1 }}>
            <Link
              variant="body2"
              color="text.secondary"
              sx={{
                cursor: 'pointer',
                fontWeight: 500,
                '&:hover': { color: 'primary.main' },
                ...(isLoading && { pointerEvents: 'none', opacity: 0.5 }),
              }}
              onClick={() => !isLoading && router.push('/reset-options')}
            >
              Forgot password?
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}