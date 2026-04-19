import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Iconify } from 'src/components/iconify';

export function AccountContent() {
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
            {/* Subtle Illustration / Icon */}
            <Box
                sx={{
                    mb: 4,
                    width: 140,
                    height: 140,
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
                <Iconify
                    icon={"eva:file-text-outline" as any}
                    width={70}
                    height={70}
                    sx={{ color: '#4f46e5' }}
                />
            </Box>

            {/* Heading */}
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                Nothing Here Yet
            </Typography>

            {/* Description */}
            <Typography
                variant="body1"
                sx={{ mb: 4, maxWidth: 500, color: 'text.secondary' }}
            >
                This page is currently empty. Any new content or records will appear here.
            </Typography>
        </Box>
    );
}
