import { useState, useCallback } from 'react';
import { Box, Button, Radio, RadioGroup, FormControlLabel, Typography } from '@mui/material';
import { useRouter } from 'src/routes/hooks';
import { Logo } from 'src/components/logo';

export function ResetPasswordRequestLvlOneView() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOptionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedOption) return;

    setIsLoading(true);
    try {
      if (selectedOption === 'self-service') {
        router.push('/reset-password-request-lvl-1');
      } else if (selectedOption === 'admin-assistance') {
        router.push('/reset-password-request-lvl-2');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOption, router]);
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
          }}
        >
          {/* Logo + Title */}
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

          {/* Form Title */}
          <Typography
            variant="h5"
            sx={{
              mb: { xs: 2.5, sm: 3.5 },
              fontWeight: 600,
              textAlign: 'center',
              color: 'text.primary',
              fontSize: { xs: '1rem', sm: '1.1rem' },
            }}
          >
            Reset your Password
          </Typography>

          {/* Form */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
            {/* Radio Options - More compact to match login height */}
            <RadioGroup
              value={selectedOption}
              onChange={handleOptionChange}
              sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
            >
              {/* Option 1 - More compact, no extra padding */}
              <FormControlLabel
                value="self-service"
                control={
                  <Radio
                    size="medium"
                    sx={{
                      '&.Mui-checked': { color: 'primary.main' },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Self-service Password Reset (OTP-based)
                  </Typography>
                }
                sx={{
                  m: 0,
                  py: 1, // Less padding than text fields
                  px: 1,
                  border: 1,
                  borderColor: selectedOption === 'self-service' ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  bgcolor: selectedOption === 'self-service' ? 'primary.50' : 'transparent',
                  alignItems: 'center',
                  minHeight: 40, // Shorter than text fields (56px)
                }}
              />

              {/* Option 2 - More compact, no extra padding */}
              <FormControlLabel
                value="admin-assistance"
                control={
                  <Radio
                    size="medium"
                    sx={{
                      '&.Mui-checked': { color: 'primary.main' },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Request Admin Assistance
                  </Typography>
                }
                sx={{
                  m: 0,
                  py: 1, // Less padding than text fields
                  px: 1,
                  border: 1,
                  borderColor: selectedOption === 'admin-assistance' ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  bgcolor: selectedOption === 'admin-assistance' ? 'primary.50' : 'transparent',
                  alignItems: 'center',
                  minHeight: 40, // Shorter than text fields (56px)
                }}
              />
            </RadioGroup>

            {/* Submit Button - EXACT SAME AS LOGIN */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={!selectedOption || isLoading}
              sx={{
                mt: 1, // SAME AS LOGIN
                py: 1.5,
                fontWeight: 600,
                borderRadius: 1.5,
              }}
            >
              {isLoading ? 'Redirecting...' : 'Continue'}
            </Button>

            {/* Back to Login - EXACT SAME STYLING AS FORGOT PASSWORD */}
            <Box sx={{ textAlign: 'center', pt: 1 }}>
              <Button
                variant="text"
                size="small"
                color="inherit"
                onClick={() => router.push('/login')}
                disabled={isLoading}
                sx={{
                  fontWeight: 500,
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: 'transparent',
                  },
                  ...(isLoading && { pointerEvents: 'none', opacity: 0.5 }),
                }}
              >
                Return to Login Screen
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
