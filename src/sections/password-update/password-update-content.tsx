import { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { api } from 'src/routes/api/config';

export function PasswordEditUpdateContent() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Show/hide password state
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!newPassword) newErrors.newPassword = 'New password is required';
    else if (newPassword.length < 8) newErrors.newPassword = 'Minimum 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword))
      newErrors.newPassword = 'Must include uppercase, lowercase, and number';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm new password';
    else if (confirmPassword !== newPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentPassword, newPassword, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validate()) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setErrorMessage('You are not logged in. Please log in first.');
      return;
    }

    setLoading(true);
    try {
      await api.post(
        '/update-password',
        {
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          skipAuthInterceptor: true, // ✅ prevent auto logout
        } as any // TypeScript happy, no TS error
      );

      setSuccessMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      setLogoutModalOpen(true);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setErrorMessage(err.response.data.message);
      } else if (err.response?.status === 422) { // FIXED: Add 422 status check
        if (err.response.data?.errors) {
          setErrors(err.response.data.errors);
        }
        if (err.response.data?.message) {
          setErrorMessage(err.response.data.message);
        }
      } else if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  return (
    <Box sx={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
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
            background: 'linear-gradient(135deg, #fde2e2, #fca5a5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 2,
            animation: 'pulse 3s ease-in-out infinite',
            '@keyframes pulse': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.05)' } },
          }}
        >
          <Iconify icon={'eva:lock-outline' as any} width={40} height={40} sx={{ color: '#ef4444' }} />
        </Box>

        {/* Heading */}
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700, textAlign: 'center' }}>
          Update Your Password
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
          Enter your current password and a new password to update your account security.
        </Typography>

        {/* Current Password */}
        <TextField
          label="Current Password"
          type={showCurrent ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={!!errors.currentPassword}
          helperText={errors.currentPassword}
          fullWidth
          sx={{ mb: 2 }}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowCurrent(!showCurrent)} edge="end" size="small" disabled={loading}>
                  <Iconify icon={showCurrent ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={20} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* New Password */}
        <TextField
          label="New Password"
          type={showNew ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={!!errors.newPassword}
          helperText={errors.newPassword}
          fullWidth
          sx={{ mb: 2 }}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowNew(!showNew)} edge="end" size="small" disabled={loading}>
                  <Iconify icon={showNew ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={20} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Confirm Password */}
        <TextField
          label="Confirm New Password"
          type={showConfirm ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          fullWidth
          sx={{ mb: 2 }}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small" disabled={loading}>
                  <Iconify icon={showConfirm ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={20} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Submit */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          sx={{ py: 1.5, fontWeight: 600, mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
        </Button>

        {/* Messages */}
        {successMessage && <Typography variant="body2" sx={{ color: 'success.main', mt: 1 }}>{successMessage}</Typography>}
        {errorMessage && <Typography variant="body2" sx={{ color: 'error.main', mt: 1 }}>{errorMessage}</Typography>}
      </Paper>

      {/* Logout Modal */}
      <Dialog open={logoutModalOpen} onClose={() => setLogoutModalOpen(false)}>
        <DialogTitle>Password Updated</DialogTitle>
        <DialogContent>
          <Typography>Your password has been updated. Do you want to log out now?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutModalOpen(false)}>Stay Logged In</Button>
          <Button color="error" onClick={handleLogout}>Log Out</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
