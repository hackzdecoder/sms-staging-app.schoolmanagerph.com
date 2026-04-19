import { useState, useEffect, useMemo } from 'react';
import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';
import { useNavigate } from 'react-router-dom';
import { api } from 'src/routes/api/config';

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path?: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  action?: () => void;
};

interface MessageRecord {
  id: number;
  user_id: string;
  date: string;
  subject: string;
  message?: string;
  status: string;
  isRead?: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface UnreadCountResponse {
  success: boolean;
  data?: {
    unread_count: number;
  };
  message?: string;
}

export const useNavData = (): NavItem[] => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const logout = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.clear();
    navigate('/login', { replace: true });
  };

  // const fetchUnreadCount = async () => {
  //   try {
  //     // Get current user from localStorage
  //     const userStr = localStorage.getItem('user');
  //     let userId = '';

  //     if (userStr) {
  //       const user = JSON.parse(userStr);
  //       userId = user.user_id || '';
  //     }

  //     // Try the optimized unread-count endpoint first
  //     try {
  //       const response = await api.get<UnreadCountResponse>('/messages/unread-count', {
  //         params: { user_id: userId },
  //       });

  //       if (response.data.success && response.data.data) {
  //         setUnreadCount(response.data.data.unread_count);
  //         return; // Success, exit early
  //       }
  //     } catch (unreadCountError) {
  //       console.log('Unread-count endpoint not available, falling back to messages endpoint');
  //     }

  //     // Fallback: Since backend doesn't support status filter, we'll filter on frontend
  //     const response = await api.get<ApiResponse<MessageRecord[]>>('/messages', {
  //       params: { user_id: userId },
  //     });

  //     if (response.data.success && response.data.data) {
  //       // Filter only unread messages on the frontend
  //       const unreadMessages = response.data.data.filter(
  //         (msg) => msg.status.toLowerCase() === 'unread'
  //       );
  //       setUnreadCount(unreadMessages.length);
  //     } else {
  //       setUnreadCount(0);
  //     }
  //   } catch (err) {
  //     console.error('Failed to fetch unread count:', err);
  //     setUnreadCount(0);
  //   }
  // };

  // useEffect(() => {
  //   fetchUnreadCount();
  //   const interval = setInterval(fetchUnreadCount, 30000);
  //   return () => clearInterval(interval);
  // }, []);

  return useMemo(
    () => [
      { title: 'Dashboard', path: '/dashboard', icon: icon('ic-dashboard') },
      { title: 'Attendance', path: '/attendance', icon: icon('ic-attendance') },
      { title: 'Accounts', path: '/accounts', icon: icon('ic-account') },
      { title: 'Grades', path: '/grades', icon: icon('ic-grades') },
      {
        title: 'Messages',
        path: '/messaging',
        icon: icon('ic-messaging'),
        info: unreadCount > 0 ? <Label color="error">{unreadCount}</Label> : null,
      },
      { title: 'Profile', path: '/profile', icon: icon('ic-profile') },
      { title: 'Logout', icon: icon('ic-power-off'), action: logout },
    ],
    [unreadCount, logout]
  );
};
