import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { useState, useEffect, useCallback } from 'react';

import { DashboardContent } from 'src/layouts/dashboard';
import { DashboardWidgets } from '../dashboard-widgets';
import { RecentActivities } from '../recent-activities';
import { useRouter } from 'src/routes/hooks';
import { api } from 'src/routes/api/config';

// Interfaces
interface AttendanceRecord {
  id: number;
  user_id: string;
  date: string;
  time_in: string;
  kiosk_terminal_in: string;
  time_out: string;
  kiosk_terminal_out: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface MessageRecord {
  id: number;
  user_id: string;
  date: string;
  subject: string;
  message?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ----------------------------------------------------------------------

// Helper function to get greeting based on Philippine Standard Time (UTC+8)
const getGreeting = (time: Date): string => {
  // Get current hour in Philippine Standard Time (UTC+8)
  const utcHour = time.getUTCHours();
  const phHour = (utcHour + 8) % 24; // Convert to Philippine Time

  // Following your definition:
  // Morning = 12:00 AM - 12:00 PM
  // Afternoon = 12:00 PM - 5:00/6:00 PM
  // Evening = 5:00/6:00 PM - bedtime

  // Using 6:00 PM as the transition from Afternoon to Evening
  if (phHour >= 0 && phHour < 12) {
    return 'Good morning';
  } else if (phHour >= 12 && phHour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
};

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const router = useRouter();

  const [attendanceCount, setAttendanceCount] = useState(0);
  const [attendanceUnread, setAttendanceUnread] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const [recentMessages, setRecentMessages] = useState<MessageRecord[]>([]);
  const [nickname, setNickname] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('Good Day');

  // Loading states
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Function to handle time updates from header
  const handleTimeChange = useCallback((time: Date) => {
    const newGreeting = getGreeting(time);
    setGreeting(newGreeting);
  }, []);

  // Fetch functions
  const fetchRecentMessages = async () => {
    setLoadingRecent(true);
    try {
      const userStr = localStorage.getItem('user');
      const userId = userStr ? JSON.parse(userStr).user_id || '' : '';

      const response = await api.get<ApiResponse<MessageRecord[]>>('/messages', {
        params: { user_id: userId },
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setRecentMessages(
          data
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
        );
      }
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      setRecentMessages([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  const fetchAttendanceStats = async () => {
    setLoadingAttendance(true);
    try {
      const userStr = localStorage.getItem('user');
      const userId = userStr ? JSON.parse(userStr).user_id || '' : '';

      const response = await api.get<ApiResponse<AttendanceRecord[]>>('/attendance', {
        params: { user_id: userId },
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setAttendanceCount(data.length);
        setAttendanceUnread(data.filter((r) => r.status.toLowerCase() === 'unread').length);
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      setAttendanceCount(0);
      setAttendanceUnread(0);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchMessagesStats = async () => {
    setLoadingMessages(true);
    try {
      const userStr = localStorage.getItem('user');
      const userId = userStr ? JSON.parse(userStr).user_id || '' : '';

      try {
        const unreadResponse = await api.get<{ success: boolean; data?: { unread_count: number } }>(
          '/messages/unread-count',
          {
            params: { user_id: userId },
          }
        );

        if (unreadResponse.data.success && unreadResponse.data.data) {
          setMessagesUnread(unreadResponse.data.data.unread_count);

          const totalResponse = await api.get<ApiResponse<MessageRecord[]>>('/messages', {
            params: { user_id: userId },
          });

          if (totalResponse.data.success && totalResponse.data.data) {
            setMessagesCount(totalResponse.data.data.length);
          }
          return;
        }
      } catch {
        console.log('Unread-count endpoint not available, using fallback');
      }

      const response = await api.get<ApiResponse<MessageRecord[]>>('/messages', {
        params: { user_id: userId },
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setMessagesCount(data.length);
        setMessagesUnread(data.filter((m) => m.status.toLowerCase() === 'unread').length);
      }
    } catch (error) {
      console.error('Error fetching messages stats:', error);
      setMessagesCount(0);
      setMessagesUnread(0);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setNickname(user.nickname || user.full_name || user.username || '');
    }

    // Set initial greeting based on current time
    setGreeting(getGreeting(new Date()));

    fetchAttendanceStats();
    fetchMessagesStats();
    fetchRecentMessages();

    const interval = setInterval(() => {
      fetchAttendanceStats();
      fetchMessagesStats();
      fetchRecentMessages();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        {greeting} {nickname || 'User'}!
      </Typography>

      <Grid container spacing={3}>
        {/* Attendance Records Widget */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box
            onClick={() => router.push('/attendance')}
            sx={{ cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
          >
            {loadingAttendance ? (
              <Skeleton variant="rectangular" height={120} />
            ) : (
              <DashboardWidgets
                title="Attendance Records"
                total={attendanceCount}
                color="secondary"
                icon={<img alt="Attendance" src="/assets/icons/glass/ic-calendar.svg" />}
              />
            )}
          </Box>
          {!loadingAttendance && attendanceUnread > 0 && (
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="error" sx={{ fontWeight: 'bold' }}>
                {attendanceUnread} unread records
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Messages Widget */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Box
            onClick={() => router.push('/messaging')}
            sx={{ cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
          >
            {loadingMessages ? (
              <Skeleton variant="rectangular" height={120} />
            ) : (
              <DashboardWidgets
                title="Messages & Announcements"
                total={messagesCount}
                color="error"
                icon={<img alt="Messages" src="/assets/icons/navbar/ic-messages-danger.svg" />}
              />
            )}
          </Box>
          {!loadingMessages && messagesUnread > 0 && (
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="error" sx={{ fontWeight: 'bold' }}>
                {messagesUnread} unread messages
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Recent Messages */}
        <Grid size={{ xs: 12, md: 12, lg: 12 }}>
          {loadingRecent ? (
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          ) : (
            <RecentActivities
              title="Recent Messages"
              subheader={`Latest ${recentMessages.length} messages`}
              messages={recentMessages}
            />
          )}
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
