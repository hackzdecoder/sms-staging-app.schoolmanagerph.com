import { useState, useMemo, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import useMediaQuery from '@mui/material/useMediaQuery';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Iconify } from 'src/components/iconify';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { api } from 'src/routes/api/config';

// Interfaces
interface MessageRecord {
  id: number;
  user_id: string;
  date: string;
  subject: string;
  message?: string;
  status: string;
  created_at: string;
  updated_at: string;
  full_name?: string; // This should come from backend
}

// Update UserOption interface to match backend response:
interface UserOption {
  user_id: string;
  fullname: string; // From backend: m.full_name as fullname
  message_count?: number;
}

interface MessageRow {
  id: number;
  user_id: string;
  date: string;
  subject: string;
  message?: string;
  status: string;
  isRead: boolean;
  displayDate: string;
  full_name?: string; // Add this
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface User {
  user_id: string;
  username: string;
  email: string;
  full_name?: string;
}

type Order = 'asc' | 'desc';

// API Service
class MessagesApi {
  async getMessages(filters?: {
    startDate?: string;
    endDate?: string;
    user_id?: string;
  }): Promise<MessageRecord[]> {
    try {
      const response = await api.get<ApiResponse<MessageRecord[]>>('/messages', {
        params: filters,
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async getMessagesUsers(): Promise<UserOption[]> {
    try {
      const response = await api.get<ApiResponse<UserOption[]>>('/messages/students');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching messages users:', error);
      return [];
    }
  }

  async markAsRead(recordId: number): Promise<void> {
    try {
      await api.put(`/messages/${recordId}/read`);
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await api.put('/messages/read-all', { user_id: userId });
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  async checkUserExists(userId: string): Promise<boolean> {
    try {
      const response = await api.get<ApiResponse<MessageRecord[]>>('/messages', {
        params: { user_id: userId },
      });
      return (response.data.data || []).length > 0;
    } catch (error) {
      console.error('Error checking user:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = localStorage.getItem('auth_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
        };
      }

      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await api.get<User>('/user');
        return response.data || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }
}

const messagesApi = new MessagesApi();

// Preloader Skeleton Component
const MessagesSkeleton = ({ isMobile = false }: { isMobile?: boolean }) => {
  if (isMobile) {
    return (
      <Box>
        {[1, 2, 3].map((item) => (
          <Box
            key={item}
            sx={{
              mb: 2,
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton variant="text" width="40%" height={30} />
                <Skeleton variant="circular" width={20} height={20} />
              </Box>
              <Skeleton variant="text" width="80%" height={25} />
              <Skeleton variant="text" width="60%" height={20} />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pt: 1,
                }}
              >
                <Skeleton variant="text" width="20%" height={25} />
                <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
              </Box>
            </Stack>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {['DATE', 'SUBJECT', 'STUDENT NAME', 'STATUS'].map(
              (
                header // Updated
              ) => (
                <TableCell
                  key={header}
                  sx={{
                    bgcolor: 'primary.main',
                    color: '#fff',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  {header}
                </TableCell>
              )
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {[1, 2, 3, 4, 5].map((row) => (
            <TableRow key={row}>
              <TableCell align="center">
                <Box
                  sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}
                >
                  <Skeleton variant="circular" width={8} height={8} />
                  <Skeleton variant="text" width={100} height={25} />
                </Box>
              </TableCell>
              <TableCell align="center">
                <Skeleton variant="text" width="80%" height={25} sx={{ mx: 'auto' }} />
              </TableCell>
              <TableCell align="center">
                {' '}
                {/* Added */}
                <Skeleton variant="text" width="60%" height={25} sx={{ mx: 'auto' }} />
              </TableCell>
              <TableCell align="center">
                <Skeleton
                  variant="rectangular"
                  width={100}
                  height={36}
                  sx={{ mx: 'auto', borderRadius: 1 }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Main Component
export function MessagingContent() {
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof MessageRow>('date');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().endOf('month'));
  const [openModal, setOpenModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageRow | null>(null);
  const [messagesData, setMessagesData] = useState<MessageRow[]>([]);
  const [allMessages, setAllMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showPreloader, setShowPreloader] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isMobile = useMediaQuery('(max-width:600px)');
  const today = dayjs();

  // ================== Effects ==================

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await messagesApi.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to get current user:', err);
        setInitialLoad(false);
        setLoading(false);
        setShowPreloader(false);
        setFilterLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  const checkUserAndFetchData = async () => {
    if (!currentUser?.user_id) {
      setInitialLoad(false);
      setLoading(false);
      setShowPreloader(false);
      setFilterLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const exists = await messagesApi.checkUserExists(currentUser.user_id);
      setUserExists(exists);

      setTimeout(() => {
        setShowPreloader(false);
        setFilterLoading(false);
      }, 800);
    } catch (err) {
      console.error('Error checking user:', err);
      setUserExists(false);
      setShowPreloader(false);
      setFilterLoading(false);
      setError('An error occurred while fetching messages');
    } finally {
      setInitialLoad(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) checkUserAndFetchData();
  }, [currentUser]);

  const fetchMessagesUsers = async () => {
    if (!currentUser?.user_id) return;

    setLoadingUsers(true);
    try {
      const userList = await messagesApi.getMessagesUsers();
      setUsers(userList);
    } catch (err) {
      console.error('Error fetching messages users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMessagesData = async () => {
    if (!currentUser?.user_id || !startDate || !endDate) {
      setLoading(false);
      setShowPreloader(false);
      setFilterLoading(false);
      return;
    }

    setLoading(true);
    setFilterLoading(true);
    setShowPreloader(true);
    try {
      const filters: any = {
        user_id: currentUser.user_id,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      };
      const data = await messagesApi.getMessages(filters);
      const transformed: MessageRow[] = data.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        date: r.date,
        subject: r.subject,
        message: r.message,
        status: r.status,
        isRead: r.status === 'read',
        displayDate: dayjs(r.date).format('MMM DD, YYYY'),
        full_name: r.full_name,
      }));

      setAllMessages(transformed);
      setMessagesData(transformed);

      setTimeout(() => {
        setShowPreloader(false);
        setFilterLoading(false);
      }, 500);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setShowPreloader(false);
      setFilterLoading(false);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userExists && startDate && endDate && currentUser && !initialLoad) {
      fetchMessagesData();
      fetchMessagesUsers();
    }
  }, [userExists, startDate, endDate, currentUser, initialLoad]);

  // ================== Handlers ==================

  const markAsRead = async (id: number) => {
    setUpdatingStatus(id);
    try {
      setMessagesData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isRead: true, status: 'read' } : r))
      );
      setAllMessages((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isRead: true, status: 'read' } : r))
      );
      await messagesApi.markAsRead(id);
    } catch (err) {
      setMessagesData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isRead: false, status: 'unread' } : r))
      );
      setAllMessages((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isRead: false, status: 'unread' } : r))
      );
      alert('Failed to mark message as read. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const markAllAsRead = async () => {
    const unread = messagesData.filter((r) => !r.isRead);
    if (!unread.length) return;
    setUpdatingStatus(-1);
    try {
      setMessagesData((prev) => prev.map((r) => ({ ...r, isRead: true, status: 'read' })));
      setAllMessages((prev) => prev.map((r) => ({ ...r, isRead: true, status: 'read' })));
      await messagesApi.markAllAsRead(currentUser!.user_id);
    } catch (err) {
      setMessagesData((prev) =>
        prev.map((r) =>
          unread.find((m) => m.id === r.id) ? { ...r, isRead: false, status: 'unread' } : r
        )
      );
      setAllMessages((prev) =>
        prev.map((r) =>
          unread.find((m) => m.id === r.id) ? { ...r, isRead: false, status: 'unread' } : r
        )
      );
      alert('Failed to mark all messages as read. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleRowClick = async (message: MessageRow) => {
    setSelectedMessage(message);
    setOpenModal(true);
    if (!message.isRead) await markAsRead(message.id);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedMessage(null);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: Dayjs | null) => {
    if (!value) return;
    if (value.isAfter(today, 'day')) value = today;
    if (type === 'start') {
      if (endDate && value.isAfter(endDate, 'day')) value = endDate;
      setStartDate(value);
    } else {
      if (startDate && value.isBefore(startDate, 'day')) value = startDate;
      setEndDate(value);
    }
  };

  const handleReset = () => {
    setSearch('');
    setSelectedUser('');
    setStartDate(today.startOf('day'));
    setEndDate(today.endOf('day'));
    setPage(0);
  };

  const handleRequestSort = (e: React.MouseEvent<unknown>, property: keyof MessageRow) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    if (users.length === 1 && !selectedUser) {
      setSelectedUser(users[0].fullname);
    }
  }, [users]);

  const formatDisplayDate = (date: string) => dayjs(date).format('MMM DD, YYYY');

  // ================== Filtering & Sorting ==================
  const filteredData = useMemo(() => {
    let filtered = allMessages;

    filtered = filtered.filter((row) => {
      const rowDate = dayjs(row.date);
      if (startDate && rowDate.isBefore(startDate, 'day')) return false;
      if (endDate && rowDate.isAfter(endDate, 'day')) return false;
      return true;
    });

    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter((row) => {
        const fields = [
          row.subject,
          row.message,
          row.status,
          row.displayDate,
          row.full_name,
          row.isRead ? 'read' : 'unread',
        ];
        return fields.some((f) => f && f.toString().toLowerCase().includes(searchLower));
      });
    }

    if (selectedUser) {
      filtered = filtered.filter((row) => row.full_name === selectedUser);
    }

    return filtered;
  }, [allMessages, search, startDate, endDate, selectedUser]);

  const sortedData = useMemo(
    () =>
      [...filteredData].sort((a, b) => {
        let aVal: any = a[orderBy];
        let bVal: any = b[orderBy];
        if (orderBy === 'date') {
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
        } else if (orderBy === 'isRead') {
          aVal = a.isRead ? 1 : 0;
          bVal = b.isRead ? 1 : 0;
        } else if (orderBy === 'full_name') {
          aVal = (a.full_name || '').toLowerCase();
          bVal = (b.full_name || '').toLowerCase();
        } else if (orderBy === 'subject') {
          aVal = (a.subject || '').toLowerCase();
          bVal = (b.subject || '').toLowerCase();
        } else {
          aVal = aVal?.toString().toLowerCase() || '';
          bVal = bVal?.toString().toLowerCase() || '';
        }
        if (typeof aVal === 'number' && typeof bVal === 'number')
          return order === 'asc' ? aVal - bVal : bVal - aVal;
        return order === 'asc'
          ? aVal.toString().localeCompare(bVal.toString())
          : bVal.toString().localeCompare(aVal.toString());
      }),
    [filteredData, order, orderBy]
  );

  const paginatedData = useMemo(
    () => sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedData, page, rowsPerPage]
  );
  const filteredUnreadCount = useMemo(
    () => filteredData.filter((r) => !r.isRead).length,
    [filteredData]
  );

  const tableHeaders = [
    { id: 'date', label: 'DATE' },
    { id: 'subject', label: 'SUBJECT' },
    { id: 'full_name', label: 'STUDENT NAME' }, // Added
    { id: 'isRead', label: 'STATUS' },
  ];

  // ================== Early Return States ==================

  if (loading && showPreloader) {
    return (
      <Paper
        sx={{
          width: '100%',
          overflow: 'hidden',
          boxShadow: 3,
          borderRadius: 2,
          minHeight: '60vh',
          bgcolor: '#f0f2f5',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
            p: 3,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Loading messages...
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  }

  if (error && !loading) {
    return (
      <Paper
        sx={{
          width: '100%',
          overflow: 'hidden',
          boxShadow: 3,
          borderRadius: 2,
          minHeight: '60vh',
          bgcolor: '#f0f2f5',
        }}
      >
        <Box
          sx={{
            p: 3,
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ maxWidth: 400, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={checkUserAndFetchData}
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
              }}
            >
              Retry
            </Button>
          </Box>
        </Box>
      </Paper>
    );
  }

  // ================== JSX ==================
  return (
    <>
      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3, borderRadius: 2 }}>
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6">Messages</Typography>
            {showPreloader ? (
              <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 1 }} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {!currentUser && !initialLoad && (
                  <Chip label="Please log in" color="warning" size="small" variant="outlined" />
                )}
                {userExists === false && currentUser && (
                  <Chip label="No messages found" color="error" size="small" variant="outlined" />
                )}
                {userExists === true && filteredUnreadCount > 0 && (
                  <Chip
                    label={`${filteredUnreadCount} unread`}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                )}
                {userExists === true && filteredUnreadCount > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={markAllAsRead}
                    disabled={updatingStatus === -1}
                    startIcon={
                      updatingStatus === -1 ? (
                        <Iconify icon="solar:restart-bold" width={16} height={16} />
                      ) : (
                        <Iconify icon="solar:eye-bold" width={16} height={16} />
                      )
                    }
                  >
                    {updatingStatus === -1 ? 'Marking...' : 'Mark all as read'}
                  </Button>
                )}
              </Box>
            )}
          </Box>

          {!currentUser && !initialLoad && !loading && (
            <Box
              sx={{
                p: 3,
                minHeight: '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Alert severity="warning" sx={{ borderRadius: 2, maxWidth: 400 }}>
                {`There's a problem of messages records.`}
              </Alert>
            </Box>
          )}

          {currentUser && userExists === false && !showPreloader && !loading && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error" variant="h6">
                No messages records found
              </Typography>
            </Box>
          )}

          {currentUser && userExists === true && (
            <>
              {/* Filters - Optimized for All Devices (Same as Attendance) */}
              <Box sx={{ mb: 3 }}>
                {/* Mobile & Small Tablet Layout */}
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  {/* Row 1: Search - FULL WIDTH */}
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search anything... (subject, status, date, etc.)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{
                      width: '100%',
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        height: 48,
                        fontSize: '0.95rem',
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Iconify icon="eva:search-fill" width={20} height={20} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Row 2: Dropdown - FULL WIDTH */}
                  <FormControl
                    size="small"
                    sx={{
                      width: '100%',
                      mb: 2,
                    }}
                  >
                    <Select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      displayEmpty
                      sx={{
                        height: 48,
                        fontSize: '0.95rem',
                        width: '100%',
                      }}
                      disabled={loadingUsers || users.length <= 1}
                    >
                      <MenuItem value="">Display All</MenuItem>
                      {users.map((user, index) => (
                        <MenuItem
                          key={`${user.user_id}-${user.fullname}-${index}`}
                          value={user.fullname}
                        >
                          {user.fullname}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Row 3: Date Pickers - FLEX ROW */}
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box
                      sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' }, 
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <DatePicker
                        label="From"
                        value={startDate}
                        onChange={(v) => handleCustomDateChange('start', v)}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: {
                              '& .MuiInputBase-root': {
                                height: 48,
                              },
                            },
                          },
                        }}
                      />
                      <DatePicker
                        label="To"
                        value={endDate}
                        onChange={(v) => handleCustomDateChange('end', v)}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: {
                              '& .MuiInputBase-root': {
                                height: 48,
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  </LocalizationProvider>

                  {/* Row 4: Reset Button - FULL WIDTH AT THE END */}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleReset}
                    sx={{
                      width: '100%',
                      height: 48,
                      fontSize: '0.95rem',
                    }}
                  >
                    Reset
                  </Button>
                </Box>

                {/* Desktop & Large Tablet Layout */}
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ flexWrap: 'wrap', gap: 2 }}
                  >
                    {/* Search - Takes 30% width */}
                    <TextField
                      variant="outlined"
                      size="small"
                      placeholder="Search anything..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      sx={{
                        flex: { md: 3, lg: 4 },
                        '& .MuiOutlinedInput-root': {
                          height: 40,
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Iconify icon="eva:search-fill" width={18} height={18} />
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* Dropdown - Fixed width */}
                    <FormControl
                      size="small"
                      sx={{
                        minWidth: 200,
                        flexShrink: 0,
                      }}
                    >
                      <Select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        displayEmpty
                        sx={{ height: 40 }}
                        disabled={loadingUsers || users.length <= 1}
                      >
                        <MenuItem value="">Display All</MenuItem>
                        {users.map((user, index) => (
                          <MenuItem
                            key={`${user.user_id}-${user.fullname}-${index}`}
                            value={user.fullname}
                          >
                            {user.fullname}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Date Pickers - Take remaining space */}
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{ flex: { md: 4, lg: 5 }, minWidth: 0 }}
                      >
                        <DatePicker
                          label="From"
                          value={startDate}
                          onChange={(v) => handleCustomDateChange('start', v)}
                          slotProps={{
                            textField: {
                              size: 'small',
                              sx: { flex: 1 },
                            },
                          }}
                        />
                        <DatePicker
                          label="To"
                          value={endDate}
                          onChange={(v) => handleCustomDateChange('end', v)}
                          slotProps={{
                            textField: {
                              size: 'small',
                              sx: { flex: 1 },
                            },
                          }}
                        />
                      </Stack>
                    </LocalizationProvider>

                    {/* Reset Button */}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleReset}
                      sx={{
                        height: 40,
                        minWidth: 100,
                        flexShrink: 0,
                      }}
                    >
                      Reset
                    </Button>
                  </Stack>
                </Box>
              </Box>

              {/* Search Info */}
              {!showPreloader && (search || startDate || endDate || selectedUser) && (
                <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {search && `Search: "${search}" `}
                    {startDate && `From: ${startDate.format('MMM DD, YYYY')} `}
                    {endDate && `To: ${endDate.format('MMM DD, YYYY')}`} &nbsp; &nbsp; &nbsp;
                    Showing {filteredData.length} of {allMessages.length} messages
                    {filteredUnreadCount > 0 && ` • ${filteredUnreadCount} unread`}
                  </Typography>
                </Box>
              )}

              {/* Table or Accordion - Preloader or Content */}
              {showPreloader ? (
                <MessagesSkeleton isMobile={isMobile} />
              ) : !isMobile ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {tableHeaders.map((headCell) => (
                          <TableCell
                            key={headCell.id}
                            sx={{
                              bgcolor: 'primary.main',
                              color: '#fff',
                              fontWeight: 600,
                              textAlign: 'left',
                            }}
                          >
                            <TableSortLabel
                              active={orderBy === headCell.id}
                              direction={orderBy === headCell.id ? order : 'asc'}
                              onClick={(e) => handleRequestSort(e, headCell.id as keyof MessageRow)}
                              sx={{
                                color: 'rgba(255,255,255,0.75)',
                                '&.Mui-active, &:hover': { color: '#fff !important' },
                                '& .MuiTableSortLabel-icon': { color: '#fff !important' },
                              }}
                            >
                              {headCell.label}
                            </TableSortLabel>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {filterLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <CircularProgress size={24} />
                              <Typography variant="body2" color="text.secondary">
                                Loading messages...
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : paginatedData.length > 0 ? (
                        paginatedData.map((row) => (
                          <TableRow
                            key={row.id}
                            hover
                            onClick={() => handleRowClick(row)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: !row.isRead
                                ? 'rgba(255, 0, 0, 0.08)'
                                : 'transparent',
                              transition: 'background-color 0.3s',
                              '&:hover': {
                                backgroundColor: !row.isRead
                                  ? 'rgba(255, 0, 0, 0.12)'
                                  : 'rgba(0, 0, 0, 0.04)',
                              },
                            }}
                          >
                            <TableCell align="left">
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'left',
                                  alignItems: 'left',
                                  gap: 1,
                                }}
                              >
                                {!row.isRead && (
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      bgcolor: 'error.main',
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                                <Typography variant="body2">
                                  {formatDisplayDate(row.date)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="left">{row.subject}</TableCell>
                            {/* Added Student Name Column */}
                            <TableCell align="left">
                              <Typography variant="body2" fontWeight={500}>
                                {row.full_name || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="left">
                              <Button
                                variant="outlined"
                                size="small"
                                color={row.isRead ? 'success' : 'error'}
                                startIcon={
                                  <Iconify
                                    icon={row.isRead ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                                  />
                                }
                                sx={{ minWidth: '100px', pointerEvents: 'none' }}
                              >
                                {row.isRead ? 'Read' : 'Unread'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            {' '}
                            {/* Changed colSpan from 3 to 4 */}
                            <Typography color="text.secondary">
                              {search.trim()
                                ? `No messages found for "${search}"`
                                : 'No messages found for selected period'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box>
                  {filterLoading ? (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        py: 3,
                        gap: 1,
                      }}
                    >
                      <CircularProgress size={24} />
                      <Typography variant="body2" color="text.secondary">
                        Loading messages...
                      </Typography>
                    </Box>
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((row) => (
                      <Accordion
                        key={row.id}
                        sx={{
                          mb: 2,
                          overflow: 'hidden',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          '&:before': { display: 'none' },
                          border: '1px solid',
                          borderColor: !row.isRead ? 'error.main' : 'divider',
                          bgcolor: !row.isRead ? 'rgba(255, 0, 0, 0.08)' : 'background.paper',
                        }}
                        onChange={async (e, expanded) => {
                          if (expanded && !row.isRead) {
                            await markAsRead(row.id);
                          }
                        }}
                      >
                        <AccordionSummary
                          expandIcon={
                            <Iconify
                              icon="eva:arrow-ios-downward-fill"
                              width={20}
                              height={20}
                              color="#ffffff" // Force white color
                            />
                          }
                          sx={{
                            bgcolor: !row.isRead ? 'error.light' : 'primary.main',
                            color: '#fff',
                            px: 2,
                            py: 1.5,
                            '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1 },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              width: '100%',
                            }}
                          >
                            <Stack direction="column" spacing={0.5} sx={{ flex: 1 }}>
                              <Typography
                                fontWeight={400}
                                fontSize="0.95rem"
                                sx={{ lineHeight: 1.3 }}
                              >
                                {row.full_name}
                              </Typography>
                              <Typography
                                fontWeight={700}
                                fontSize="0.95rem"
                                sx={{ lineHeight: 1.3 }}
                              >
                                {row.subject}
                              </Typography>

                              <Typography
                                fontSize="0.75rem"
                                sx={{
                                  opacity: 0.85,
                                  color: 'rgba(255, 255, 255, 0.9)',
                                }}
                              >
                                {dayjs(row.date).format('MMM DD, YYYY')}
                              </Typography>
                            </Stack>

                            {/* New chip aligned to the right with proper spacing */}
                            {!row.isRead && (
                              <Chip
                                label="New"
                                color="error"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  ml: 2,
                                  alignSelf: 'flex-start',
                                  mt: 0.5,
                                }}
                              />
                            )}
                          </Box>
                        </AccordionSummary>

                        <AccordionDetails
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                            py: 2,
                            px: 2,
                            bgcolor: 'background.paper',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography color="primary.dark" fontWeight={600}>
                              Date
                            </Typography>
                            <Typography color="text.primary">
                              {formatDisplayDate(row.date)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography color="primary.dark" fontWeight={600}>
                              Subject
                            </Typography>
                            <Typography color="text.primary">{row.subject}</Typography>
                          </Box>
                          {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography color="primary.dark" fontWeight={600}>Name</Typography>
                                                        <Typography color="text.primary" fontWeight={500}>{row.full_name || 'N/A'}</Typography>
                                                    </Box> */}
                          {row.message && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Typography color="primary.dark" fontWeight={600}>
                                Message
                              </Typography>
                              <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                {row.message}
                              </Typography>
                            </Box>
                          )}
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              pt: 1,
                              borderTop: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <Typography color="text.secondary" fontWeight={600}>
                              Status
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              color={row.isRead ? 'success' : 'error'}
                              startIcon={
                                <Iconify
                                  icon={row.isRead ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                                />
                              }
                              sx={{ minWidth: '100px', pointerEvents: 'none' }}
                            >
                              {row.isRead ? 'Read' : 'Unread'}
                            </Button>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                      {search.trim()
                        ? `No messages found for ${search}`
                        : 'No messages found for selected period'}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Pagination */}
              {!showPreloader && !filterLoading && userExists && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={sortedData.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Message Details Modal */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="message-details-modal"
        aria-describedby="message-details-description"
        disableEscapeKeyDown={false}
      >
        <Box
          sx={{
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
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: 2,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Message Details
            </Typography>
            <IconButton onClick={handleCloseModal} sx={{ color: 'white' }}>
              <Iconify icon={'eva:close-outline' as any} width={20} height={20} />
            </IconButton>
          </Box>

          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 2, color: 'primary.dark' }}
              >
                Message Information
              </Typography>
              <Stack spacing={1.5}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Date:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedMessage ? formatDisplayDate(selectedMessage.date) : '-'}
                  </Typography>
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Subject:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedMessage?.subject || '-'}
                  </Typography>
                </Box>
                {/* Added Student Name in Modal */}
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Name:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedMessage?.full_name || 'N/A'}
                  </Typography>
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Status:
                  </Typography>
                  <Chip
                    label={selectedMessage?.isRead ? 'Read' : 'Unread'}
                    color={selectedMessage?.isRead ? 'success' : 'error'}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
              </Stack>
            </Box>

            <Divider sx={{ my: 2 }} />

            {selectedMessage?.message && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}
                >
                  Message Content
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedMessage.message}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              onClick={handleCloseModal}
              sx={{ borderRadius: 1 }}
              fullWidth
            >
              OK
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
