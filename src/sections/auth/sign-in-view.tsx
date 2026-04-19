import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useRouter } from 'src/routes/hooks';
import { Iconify } from 'src/components/iconify';
import { api } from 'src/routes/api/config';

interface User {
  user_id: string;
  full_name: string;
  username: string;
  nickname: string;
  email: string;
  name: string;
}

interface LoginResponse {
  success: boolean;
  redirect_to: string;
  message: string;
  user: User;
  token: string;
  token_type?: string;
  requires_email?: boolean;
}

interface Message {
  subject: string;
  message: string;
  date: string;
  status: string;
}

export function SignInView() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [latestMessage, setLatestMessage] = useState<Message | null>(null);

  const handleSignIn = useCallback(async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');
    setLatestMessage(null);

    try {
      const response = await api.post<LoginResponse>('/login', { username, password });
      const data = response.data;

      // Store token and user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Optional: immediately fetch latest message created by backend
      try {
        const msgResponse = await api.get<Message>('/messages/latest', {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        setLatestMessage(msgResponse.data);
      } catch {
        setLatestMessage({ subject: 'Login Notice', message: data.message, date: '', status: 'unread' });
      }

      // Redirect logic
      if (data.requires_email) {
        router.push('/first-user');
      } else {
        router.push(data.redirect_to);
      }

    } catch (err: any) {
      console.error('Login failed:', err);

      if (err.response?.data) {
        const errorData = err.response.data;

        if (err.response.status === 401) {
          setError(errorData.message || 'Invalid username or password');
        } else if (err.response.status === 429) {
          setError(errorData.message || 'Too many login attempts. Please try again later.');
        } else {
          setError(errorData.message || 'Login failed. Please try again.');
        }
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [username, password, router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSignIn();
    }
  }, [handleSignIn, isLoading]);

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        p: 4,
        borderRadius: 2,
        boxShadow: 3,
        width: '100%',
        maxWidth: 400,
        mx: 'auto',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
        }}
      >
        <Box
          component="img"
          src="/assets/images/school-logo.png"
          alt="School Logo"
          sx={{
            width: 50,
            height: 50,
            objectFit: 'contain',
            mb: 2,
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        />
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', letterSpacing: 0.5 }}>
          School<span style={{ color: '#1976d2' }}>MANAGER</span>
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

      {latestMessage && (
        <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
          <strong>{latestMessage.subject}:</strong> {latestMessage.message}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Username"
        value={username}
        onChange={(e) => { setUsername(e.target.value); setError(''); }}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        sx={{ mb: 3 }}
      />

      <Link
        variant="body2"
        color="inherit"
        sx={{ mb: 1.5, cursor: 'pointer' }}
        onClick={() => !isLoading && router.push('/reset-password')}
      >
        Forgot password?
      </Link>

      <TextField
        fullWidth
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => { setPassword(e.target.value); setError(''); }}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={isLoading}>
                <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      <Button
        fullWidth
        size="large"
        color="primary"
        variant="contained"
        onClick={handleSignIn}
        disabled={isLoading}
        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {isLoading ? 'LOGGING IN...' : 'Log in'}
      </Button>
    </Box>
  );
}
