import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { Iconify } from 'src/components/iconify';
import api, { APP_BASE_URL } from 'src/routes/api/config';

interface StudentProfileData {
    student_id: string | null;
    fullname: string | null;
    nickname: string | null;
    foreign_name: string | null;
    gender: string | null;
    course: string | null;
    level: string | null;
    section: string | null;
    email: string | null;
    mobile_number: string | null;
    lrn: string | null;
    profile_img: string | null;
    account_status: string | null;
    school_code: string | null;
    school_name: string | null; // Add this field
    gs_access_status: string | null;
    created_at: string | null;
    updated_at: string | null;
    school_level: string | null;
}

interface ApiResponse {
    success: boolean;
    data?: StudentProfileData;
    message?: string;
}

export function ProfileContent() {
    const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStudentProfile();
    }, []);

    const fetchStudentProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get<ApiResponse>('/student-profile');

            if (response.data.success && response.data.data) {
                setProfileData(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch profile data');
            }
        } catch (err: any) {
            setError(`There's a problem of loading profile.`);
        } finally {
            setLoading(false);
        }
    };

    // Format display text
    const formatDisplayText = (value: any): string => {
        if (value === null || value === undefined || value === 'N/A') {
            return 'Not available';
        }

        if (typeof value === 'string' && value.trim() === '') {
            return 'Not available';
        }

        return String(value);
    };

    // Get status color
    const getStatusColor = (status: string | null | undefined) => {
        if (!status) return '#666666';

        const statusLower = status.toLowerCase();
        if (statusLower.includes('active')) return '#059669'; // Emerald 600
        if (statusLower.includes('inactive')) return '#dc2626'; // Red 600
        if (statusLower.includes('pending')) return '#d97706'; // Amber 600
        return '#666666';
    };

    // Get profile image URL
    const getProfileImage = (): string => {
        if (!profileData?.profile_img) {
            return '/static/images/avatars/default-avatar.png';
        }

        return APP_BASE_URL + profileData.profile_img;
    };

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                bgcolor: '#f0f2f5'
            }}>
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={48} sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Loading profile...
                    </Typography>
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{
                p: 3,
                minHeight: '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f0f2f5'
            }}>
                <Box sx={{ maxWidth: 400, textAlign: 'center' }}>
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                    </Alert>
                    <Button
                        variant="contained"
                        onClick={fetchStudentProfile}
                        sx={{
                            fontWeight: 600,
                            borderRadius: 2,
                            px: 3,
                            py: 1
                        }}
                    >
                        Retry
                    </Button>
                </Box>
            </Box>
        );
    }

    if (!profileData) {
        return (
            <Box sx={{
                p: 3,
                minHeight: '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f0f2f5'
            }}>
                <Alert severity="info" sx={{ borderRadius: 2, maxWidth: 400 }}>
                    No profile data available.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 6, px: 3, minHeight: '80vh', bgcolor: '#f0f2f5' }}>
            <Grid container spacing={4}>
                {/* Left Column: Student Profile */}
                <Grid size={{ xs: 12, md: 12 }}>
                    <Box
                        sx={{
                            position: 'relative',
                            borderRadius: 3,
                            overflow: 'hidden',
                            boxShadow: 3,
                            bgcolor: '#fff',
                        }}
                    >
                        {/* Gradient Header */}
                        <Box
                            sx={{
                                height: 160,
                                background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
                            }}
                        />

                        {/* Avatar Overlay */}
                        <Avatar
                            src={getProfileImage()}
                            alt={profileData.fullname || 'Student Avatar'}
                            sx={{
                                width: 120,
                                height: 120,
                                border: '4px solid #fff',
                                position: 'absolute',
                                top: 100,
                                left: 32,
                                boxShadow: 3,
                                bgcolor: '#f5f5f5',
                            }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/static/images/avatars/default-avatar.png';
                            }}
                        />

                        {/* Profile Info */}
                        <Box sx={{ mt: 10, px: 4, pb: 4 }}>
                            {/* Student Name */}
                            <Typography variant="h4" sx={{
                                fontWeight: 700,
                                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                                letterSpacing: '-0.025em',
                                lineHeight: 1.2,
                                color: '#111827',
                                mb: 0.5
                            }}>
                                {formatDisplayText(profileData.fullname)}
                            </Typography>

                            {/* Student Info */}
                            <Typography variant="body1" sx={{
                                color: '#6b7280',
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                fontWeight: 500,
                                lineHeight: 1.6,
                                mb: 4
                            }}>
                                {profileData.school_level?.toUpperCase() === 'COLLEGE' ? (
                                    formatDisplayText(profileData.course) || 'Course not available'
                                ) : (
                                    <>
                                        {profileData.level || profileData.section
                                            ? `${formatDisplayText(profileData.level)} – ${formatDisplayText(profileData.section)}`
                                            : 'Level/Section not available'}
                                    </>
                                )}
                            </Typography>

                            {/* Student Details Grid */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{
                                        p: 2.5,
                                        bgcolor: '#f9f9fb',
                                        borderRadius: 2,
                                        textAlign: 'center',
                                        height: '100%'
                                    }}>
                                        <Typography variant="subtitle2" sx={{
                                            color: '#6b7280',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                            mb: 1
                                        }}>
                                            Student ID
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            fontWeight: 600,
                                            fontSize: '0.9375rem',
                                            color: '#111827'
                                        }}>
                                            {formatDisplayText(profileData.student_id)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{
                                        p: 2.5,
                                        bgcolor: '#f9f9fb',
                                        borderRadius: 2,
                                        textAlign: 'center',
                                        height: '100%'
                                    }}>
                                        <Typography variant="subtitle2" sx={{
                                            color: '#6b7280',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                            mb: 1
                                        }}>
                                            LRN
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            fontWeight: 600,
                                            fontSize: '0.9375rem',
                                            color: '#111827'
                                        }}>
                                            {formatDisplayText(profileData.lrn)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{
                                        p: 2.5,
                                        bgcolor: '#f9f9fb',
                                        borderRadius: 2,
                                        textAlign: 'center',
                                        height: '100%'
                                    }}>
                                        <Typography variant="subtitle2" sx={{
                                            color: '#6b7280',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                            mb: 1
                                        }}>
                                            Email
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            fontWeight: 600,
                                            fontSize: '0.9375rem',
                                            color: '#111827'
                                        }}>
                                            {formatDisplayText(profileData.email)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{
                                        p: 2.5,
                                        bgcolor: '#f9f9fb',
                                        borderRadius: 2,
                                        textAlign: 'center',
                                        height: '100%'
                                    }}>
                                        <Typography variant="subtitle2" sx={{
                                            color: '#6b7280',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                            mb: 1
                                        }}>
                                            Phone
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            fontWeight: 600,
                                            fontSize: '0.9375rem',
                                            color: '#111827'
                                        }}>
                                            {formatDisplayText(profileData.mobile_number)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{
                                        p: 2.5,
                                        bgcolor: '#f9f9fb',
                                        borderRadius: 2,
                                        textAlign: 'center',
                                        height: '100%'
                                    }}>
                                        <Typography variant="subtitle2" sx={{
                                            color: '#6b7280',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                            mb: 1
                                        }}>
                                            Gender
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            fontWeight: 600,
                                            fontSize: '0.9375rem',
                                            color: '#111827'
                                        }}>
                                            {formatDisplayText(profileData.gender)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{
                                        p: 2.5,
                                        bgcolor: '#f9f9fb',
                                        borderRadius: 2,
                                        textAlign: 'center',
                                        height: '100%'
                                    }}>
                                        <Typography variant="subtitle2" sx={{
                                            color: '#6b7280',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                            mb: 1
                                        }}>
                                            School Name
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            fontWeight: 600,
                                            fontSize: '0.9375rem',
                                        }}>
                                            {formatDisplayText(profileData.school_name) || formatDisplayText(profileData.school_code)}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Divider sx={{ mb: 3, borderColor: '#e5e7eb' }} />

                            {/* Additional Information Section */}
                            <Box sx={{
                                p: 3,
                                bgcolor: '#f8fafc',
                                borderRadius: 2,
                                border: '1px solid #e2e8f0'
                            }}>
                                <Typography variant="h6" sx={{
                                    fontWeight: 700,
                                    mb: 3,
                                    fontSize: '1.125rem',
                                    letterSpacing: '-0.015em',
                                    color: '#111827',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    Additional Information
                                </Typography>
                                <Grid container spacing={3}>
                                    {[
                                        { label: 'Nickname', value: profileData.nickname },
                                        { label: 'Foreign Name', value: profileData.foreign_name },
                                    ].map((item, index) => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={index}>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{
                                                    color: '#6b7280',
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem',
                                                    letterSpacing: '0.05em',
                                                    textTransform: 'uppercase',
                                                    mb: 0.5
                                                }}>
                                                    {item.label}
                                                </Typography>
                                                <Typography variant="body1" sx={{
                                                    fontWeight: 600,
                                                    fontSize: '0.9375rem',
                                                    color: item.label === 'Account Status' ? getStatusColor(item.value) : '#111827'
                                                }}>
                                                    {formatDisplayText(item.value)}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}