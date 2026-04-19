import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import { Iconify } from 'src/components/iconify';
import { api } from 'src/routes/api/config';

// -------------------- API Response Type --------------------
interface UpdateEmailResponse {
  success: boolean;
  message?: string;
  data?: {
    email: string;
  };
  errors?: {
    email?: string[];
  };
}

// -------------------- Component --------------------
export function EmailEditUpdateContent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});

  // -------------------- Email Validation --------------------
  const validate = useCallback(() => {
    const newErrors: { email?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email]);

  // -------------------- Submit Handler --------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setErrors({});

    if (!validate()) return;

    setLoading(true);

    try {
      console.log('Sending email update request:', { email });
      
      const response = await api.post<UpdateEmailResponse>('/update-email', { email });
      console.log('API Response:', response);
      console.log('Response Data:', response.data);
      
      const data = response.data;

      if (data.success === true) {
        setSuccessMessage(data.message || 'Email updated successfully!');
        setEmail(''); // Clear the field after successful update
      } else {
        console.log('API returned success: false', data);
        setErrorMessage(data.message || 'Failed to update email.');
        if (data.errors?.email?.length) {
          setErrors({ email: data.errors.email[0] });
        }
      }
    } catch (error: any) {
      console.error('API Error:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 422) {
        const backendErrors = error.response.data.errors;
        if (backendErrors?.email?.[0]) {
          setErrors({ email: backendErrors.email[0] });
        } else {
          setErrorMessage('Validation error. Please check your input.');
        }
      } else if (error.response?.status === 403) {
        setErrorMessage('Access denied. Please login again.');
      } else if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------- JSX --------------------
  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 480,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 2,
        }}
      >
        {/* Illustration / Icon */}
        <Box
          sx={{
            mb: 3,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 2,
            animation: 'pulse 3s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.05)' },
            },
          }}
        >
          <Iconify icon={"eva:email-outline" as any} width={40} height={40} sx={{ color: '#4f46e5' }} />
        </Box>

        {/* Heading */}
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700, textAlign: 'center' }}>
          Update Your Email
        </Typography>

        {/* Description */}
        <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
          Enter your new email address below to update your account information.
        </Typography>

        {/* Email Input */}
        <TextField
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={validate}
          error={!!errors.email}
          helperText={errors.email}
          fullWidth
          sx={{ mb: 2 }}
          disabled={loading}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          sx={{ py: 1.5, fontWeight: 600, mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Email'}
        </Button>

        {/* Success / Error Messages */}
        {successMessage && (
          <Typography variant="body2" sx={{ color: 'success.main', mt: 1, fontWeight: 500 }}>
            ✓ {successMessage}
          </Typography>
        )}
        {errorMessage && (
          <Typography variant="body2" sx={{ color: 'error.main', mt: 1, fontWeight: 500 }}>
            ✗ {errorMessage}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}