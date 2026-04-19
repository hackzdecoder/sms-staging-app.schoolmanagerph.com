import type { IconButtonProps } from '@mui/material/IconButton';
import { useState, useCallback, useEffect } from 'react';

import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useRouter, usePathname } from 'src/routes/hooks';
import api, { APP_BASE_URL } from 'src/routes/api/config';
import { useTermsConditionsModal, TERMS_CONTENT } from 'src/utils/modal-terms-conditions'; // Add this import

// ----------------------------------------------------------------------

export type AccountPopoverProps = IconButtonProps & {
  data?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    info?: React.ReactNode;
  }[];
};

interface StudentProfileData {
  student_id: string | null;
  fullname: string | null;
  nickname: string | null;
  profile_img: string | null;
  [key: string]: any;
}

export function AccountPopover({ data = [], sx, ...other }: AccountPopoverProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string>('');

  // Add modal hook
  const { openModal, ModalComponent } = useTermsConditionsModal();

  // Load user data and fetch profile
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Get user data from localStorage
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUserData(parsedUser);
        }

        // 2. Fetch profile image from API (SAME AS ProfileContent)
        const response = await api.get<{ success: boolean; data?: StudentProfileData }>('/student-profile');

        if (response.data.success && response.data.data?.profile_img) {
          const imgUrl = response.data.data.profile_img;
          // Construct full URL (SAME AS ProfileContent)
          const fullUrl = imgUrl.startsWith('http') ? imgUrl : APP_BASE_URL + imgUrl;
          setProfileImage(fullUrl);
        }
      } catch (error) {
        console.error('Failed to load profile data:', error);
      }
    };

    loadData();
  }, []);

  // Get user's display name
  const getDisplayName = () => {
    if (userData) {
      return userData.full_name || userData.nickname || userData.name || userData.username || 'User';
    }
    return 'User';
  };

  // Get user's avatar/initials
  const getAvatarInitials = () => {
    const displayName = getDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
  };

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleClickItem = useCallback(
    async (path: string) => {
      handleClosePopover();

      // Handle modal opens for terms/policies
      if (path === '#terms') {
        openModal({
          title: 'Terms and Conditions',
          content: TERMS_CONTENT.termsAndConditions,
          size: 'large',
        });
        return;
      }

      if (path === '#acceptable-use') {
        openModal({
          title: 'Acceptable Use Policy',
          content: TERMS_CONTENT.acceptableUsePolicy,
          size: 'large',
        });
        return;
      }

      if (path === '#privacy') {
        openModal({
          title: 'Privacy Policy',
          content: TERMS_CONTENT.privacyPolicy,
          size: 'large',
        });
        return;
      }

      if (path === '/logout') {
        try {
          // 1. Call backend logout endpoint to invalidate token
          await api.post('/logout');
        } catch (error) {
          // Even if backend fails, continue with frontend logout
          console.log('Backend logout failed, continuing with frontend logout');
        }

        // 2. Clear all frontend storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');

        // 3. Clear API authorization header
        delete api.defaults.headers.common['Authorization'];

        // 4. Redirect to login page
        router.push('/login');
        return;
      }

      // Normal navigation for other menu items
      router.push(path);
    },
    [handleClosePopover, router, openModal]
  );

  return (
    <>
      <IconButton
        onClick={handleOpenPopover}
        sx={{
          p: '2px',
          width: 40,
          height: 40,
          background: (theme: any) =>
            `conic-gradient(${theme.palette.primary.light}, ${theme.palette.warning.light}, ${theme.palette.primary.light})`,
          ...sx,
        }}
        {...other}
      >
        <Avatar
          src={profileImage}
          alt={getDisplayName()}
          sx={{
            width: 1,
            height: 1,
            bgcolor: profileImage ? 'transparent' : 'primary.main',
            fontSize: '1rem',
            fontWeight: 600,
          }}
          onError={handleImageError}
          imgProps={{
            onError: handleImageError
          }}
        >
          {!profileImage && getAvatarInitials()}
        </Avatar>
      </IconButton>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 240,
            overflow: 'visible',
            mt: 1.5,
          },
        }}
      >
        {/* User Info Section */}
        {userData && (
          <>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                src={profileImage}
                alt={getDisplayName()}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: profileImage ? 'transparent' : 'primary.main',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
                onError={handleImageError}
              >
                {!profileImage && getAvatarInitials()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {getDisplayName()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  {userData.email || userData.username}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ borderStyle: 'dashed' }} />
          </>
        )}

        <MenuList
          disablePadding
          sx={{
            p: 1,
            gap: 0.5,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
              [`&.${menuItemClasses.selected}`]: {
                color: 'text.primary',
                bgcolor: 'action.selected',
                fontWeight: 'fontWeightSemiBold',
              },
            },
          }}
        >
          {data.map((option) => (
            <MenuItem
              key={option.label}
              selected={option.href === pathname}
              onClick={() => handleClickItem(option.href)}
            >
              {option.icon}
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </Popover>

      {/* Render the modal component */}
      <ModalComponent />
    </>
  );
}