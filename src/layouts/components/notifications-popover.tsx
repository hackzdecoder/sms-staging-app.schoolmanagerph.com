import type { IconButtonProps } from '@mui/material/IconButton';
import { useState, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Modal from '@mui/material/Modal';

import { fToNow } from 'src/utils/format-time';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { api } from 'src/routes/api/config';

// ----------------------------------------------------------------------

type NotificationItemProps = {
  id: string;
  type: string;
  title: string;
  isUnRead: boolean;
  description: string;
  avatarUrl: string | null;
  postedAt: string | number | null;
};

export type NotificationsPopoverProps = IconButtonProps & {};

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

export function NotificationsPopover({ sx, ...other }: NotificationsPopoverProps) {
  const [notifications, setNotifications] = useState<NotificationItemProps[]>([]);
  const [allNotifications, setAllNotifications] = useState<NotificationItemProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItemProps | null>(null);

  const unreadNotifications = notifications.filter((item) => item.isUnRead);
  const totalUnRead = unreadNotifications.length;

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      let userId = '';
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.user_id || '';
      }

      const response = await api.get<ApiResponse<MessageRecord[]>>('/messages', {
        params: { user_id: userId },
      });

      const records = response.data.success ? response.data.data ?? [] : [];
      
      if (records.length === 0) {
        const noMessagesItem = {
          id: '0',
          type: 'none',
          title: 'No messages',
          isUnRead: false,
          description: '',
          avatarUrl: null,
          postedAt: null,
        };
        setAllNotifications([noMessagesItem]);
        setNotifications([noMessagesItem]);
      } else {
        const transformed: NotificationItemProps[] = records.map((msg) => ({
          id: msg.id.toString(),
          type: 'mail',
          title: msg.subject,
          isUnRead: msg.status?.toLowerCase() === 'unread',
          description: msg.message || 'No message content',
          avatarUrl: null,
          postedAt: msg.created_at,
        }));
        
        setAllNotifications(transformed);
        
        const unreadOnly = transformed.filter(item => item.isUnRead);
        
        if (unreadOnly.length === 0) {
          setNotifications([{
            id: '0',
            type: 'none',
            title: 'No unread messages',
            isUnRead: false,
            description: 'All messages have been read',
            avatarUrl: null,
            postedAt: null,
          }]);
        } else {
          setNotifications(unreadOnly);
        }
      }
    } catch (error) {
      console.error(error);
      const errorItem = {
        id: '0',
        type: 'none',
        title: 'Error loading messages',
        isUnRead: false,
        description: '',
        avatarUrl: null,
        postedAt: null,
      };
      setAllNotifications([errorItem]);
      setNotifications([errorItem]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.put('/messages/read-all');
      setAllNotifications(prev =>
        prev.map((n) => (n.id !== '0' ? { ...n, isUnRead: false } : n))
      );
      setNotifications([{
        id: '0',
        type: 'none',
        title: 'No unread messages',
        isUnRead: false,
        description: 'All messages have been read',
        avatarUrl: null,
        postedAt: null,
      }]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClickNotification = async (notification: NotificationItemProps) => {
    if (notification.id === '0') return;

    setSelectedNotification(notification);
    setOpenModal(true);

    if (notification.isUnRead) {
      try {
        await api.put(`/messages/${notification.id}/read`);
        setAllNotifications(prev =>
          prev.map((n) => (n.id === notification.id ? { ...n, isUnRead: false } : n))
        );
        setNotifications(prev => 
          prev.filter(n => n.id !== notification.id)
        );
        setSelectedNotification((prev) => prev && { ...prev, isUnRead: false });
        
        const remainingUnread = notifications.filter(n => 
          n.id !== notification.id && n.id !== '0'
        );
        if (remainingUnread.length === 0) {
          setNotifications([{
            id: '0',
            type: 'none',
            title: 'No unread messages',
            isUnRead: false,
            description: 'All messages have been read',
            avatarUrl: null,
            postedAt: null,
          }]);
        }
      } catch (error) {
        console.error('Error marking notification as read', error);
      }
    }
  };

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedNotification(null);
  };

  return (
    <>
      <IconButton color={openPopover ? 'primary' : 'default'} onClick={handleOpenPopover} sx={sx} {...other}>
        <Badge badgeContent={totalUnRead} color="error">
          <Iconify width={24} icon={'solar:bell-bing-bold' as any} />
        </Badge>
      </IconButton>

      {/* Popover */}
      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ 
          paper: { 
            sx: { 
              width: 360, 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column' 
            } 
          } 
        }}
      >
        {/* Header Section */}
        <Box sx={{ 
          py: 2, 
          px: 2.5, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {loading ? 'Loading...' : totalUnRead === 0 
                ? 'No unread messages' 
                : `${totalUnRead} unread message${totalUnRead !== 1 ? 's' : ''}`}
            </Typography>
          </Box>

          {totalUnRead > 0 && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<Iconify icon={'eva:checkmark-circle-2-fill' as any} width={18} />}
              onClick={markAllAsRead}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(33, 150, 243, 0.2)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease'
              }}
            >
              Mark All Read
            </Button>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'solid' }} />

        {/* Notifications List */}
        <Scrollbar fillContent sx={{ minHeight: 240, maxHeight: { xs: 360, sm: 'none' } }}>
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Iconify icon={'eos-icons:loading' as any} width={40} sx={{ color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Loading notifications...
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onClick={() => handleClickNotification(n)} />
              ))}
            </List>
          )}
        </Scrollbar>

        <Divider sx={{ borderStyle: 'solid' }} />

        {/* Footer */}
        <Box sx={{ p: 1.5 }}>
          <Button 
            fullWidth 
            variant="outlined" 
            color="primary"
            size="medium"
            startIcon={<Iconify icon={'mdi:message-text-outline' as any} width={20} />}
            onClick={() => (window.location.href = '/messaging')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              py: 1,
              '&:hover': {
                backgroundColor: 'primary.lighter',
                borderColor: 'primary.main'
              }
            }}
          >
            View All Messages
          </Button>
        </Box>
      </Popover>

      {/* New Modal Design */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 500 },
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 0,
        }}>
          <Box sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            p: 2, 
            borderTopLeftRadius: 8, 
            borderTopRightRadius: 8, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Message Details</Typography>
            <IconButton onClick={handleCloseModal} sx={{ color: 'white' }}>
              <Iconify icon={"eva:close-outline" as any} width={20} height={20} />
            </IconButton>
          </Box>
          
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.dark' }}>
                Message Information
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Subject:</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedNotification?.title || '-'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Chip 
                    label={selectedNotification?.isUnRead ? "Unread" : "Read"} 
                    color={selectedNotification?.isUnRead ? "error" : "success"} 
                    size="small" 
                    sx={{ fontWeight: 500 }} 
                  />
                </Box>
                {selectedNotification?.postedAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Sent:</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {fToNow(selectedNotification.postedAt)}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                Message Content
              </Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                minHeight: 100,
                maxHeight: 300,
                overflow: 'auto'
              }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedNotification?.description || 'No content available'}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ 
            p: 2, 
            borderTop: '1px solid', 
            borderColor: 'divider', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2 
          }}>
            <Button 
              variant="contained"
              onClick={handleCloseModal} 
              sx={{ 
                borderRadius: 1,
                minWidth: 100,
                color: '#222331ff',
                backgroundColor: '#eeeeeeff'
              }}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

// ----------------------------------------------------------------------
function NotificationItem({
  notification,
  onClick,
}: {
  notification: NotificationItemProps;
  onClick?: () => void;
}) {
  if (notification.id === '0') {
    return (
      <Box sx={{ py: 3, textAlign: 'center', width: '100%' }}>
        <Typography variant="subtitle1">{notification.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {notification.description || 'You currently have no notifications'}
        </Typography>
      </Box>
    );
  }

  return (
    <ListItemButton
      onClick={onClick}
      sx={{
        py: 1.5,
        px: 2.5,
        mt: '1px',
        ...(notification.isUnRead && { bgcolor: 'action.selected' }),
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'background.neutral' }}>
          <Iconify
            icon={notification.isUnRead ? ('mdi:email-outline' as any) : ('mdi:email-open-outline' as any)}
            width={20}
            color={notification.isUnRead ? '#d32f2f' : '#4caf50'}
          />
        </Avatar>
      </ListItemAvatar>
      <ListItemText 
        primary={notification.title} 
        secondary={
          <Box component="span">
            <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
              {notification.description?.substring(0, 60)}
              {notification.description && notification.description.length > 60 ? '...' : ''}
            </Typography>
            {notification.postedAt && (
              <Typography variant="caption" component="div" sx={{ color: 'text.disabled', mt: 0.5 }}>
                {fToNow(notification.postedAt)}
              </Typography>
            )}
          </Box>
        } 
      />
    </ListItemButton>
  );
}