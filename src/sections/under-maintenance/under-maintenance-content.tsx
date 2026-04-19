import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Iconify } from 'src/components/iconify';

export function UnderMaintenanceContent() {
    return (
        <Box
            sx={{
                py: 12,
                px: 3,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '70vh',
            }}
        >
            {/* Large Icon */}
            <Box
                sx={{
                    mb: 4,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ffecb3, #ffc107)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 3,
                    animation: 'bounce 2.5s ease-in-out infinite',
                    '@keyframes bounce': {
                        '0%, 100%': { transform: 'translateY(0px)' },
                        '50%': { transform: 'translateY(-15px)' },
                    },
                }}
            >
                <Iconify
                    icon={"eva:alert-triangle-outline" as any}
                    width={60}
                    height={60}
                    sx={{ color: '#fff' }}
                />

            </Box>

            {/* Heading */}
            <Typography variant="h3" sx={{ mb: 2, fontWeight: 700 }}>
                Under Maintenance
            </Typography>

            {/* Description */}
            <Typography variant="h6" sx={{ mb: 4, maxWidth: 500, color: 'text.secondary' }}>
                The Grades section is currently under maintenance. We are working hard to bring it back as soon as possible.
            </Typography>

            {/* Action Button */}
            <Button
                variant="contained"
                color="primary"
                size="large"
                href="/"
                sx={{ px: 4, py: 1.5, fontWeight: 600 }}
            >
                Back to Dashboard
            </Button>
        </Box>
    );
}