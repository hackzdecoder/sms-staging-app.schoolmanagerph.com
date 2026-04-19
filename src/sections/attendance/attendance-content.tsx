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
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import { Iconify } from 'src/components/iconify';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { api } from 'src/routes/api/config';

// Interfaces
interface AttendanceRecord {
  id: number;
  user_id: string;
  date: string | null;
  time_in: string;
  kiosk_terminal_in: string;
  time_out: string;
  kiosk_terminal_out: string;
  status: string;
  created_at: string;
  updated_at: string;
  student_name: string;
  student_nickname?: string;
  username: string;
}

interface UserOption {
  user_id: string;
  username: string;
  fullname: string;
  attendance_count: number;
}

interface AttendanceRow {
  id: number;
  user_id: string;
  date: string;
  time_in: string;
  kiosk_terminal_in: string;
  time_out: string;
  kiosk_terminal_out: string;
  status: string;
  student_name: string;
  student_nickname?: string;
  isRead: boolean;
  displayDate: string;
  displayName: string;
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

// Attendance API Helper
class AttendanceApi {
  // In AttendanceApi class, update getAttendance method:
  async getAttendance(filters?: {
    startDate?: string;
    endDate?: string;
    user_id?: string;
  }): Promise<AttendanceRecord[]> {
    try {
      const response = await api.get<ApiResponse<AttendanceRecord[]>>('/attendance', {
        params: filters, // This will include startDate and endDate
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      return [];
    }
  }

  async getAttendanceUsers(): Promise<UserOption[]> {
    try {
      const response = await api.get<ApiResponse<UserOption[]>>('/attendance/students');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching attendance users:', error);
      return [];
    }
  }

  async markAsRead(recordId: number): Promise<void> {
    try {
      await api.patch(`/attendance/${recordId}/read`);
    } catch (error) {
      console.error('Error marking record as read:', error);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await api.patch('/attendance/read-all', { user_id: userId });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  async checkUserExists(userId: string): Promise<boolean> {
    try {
      const response = await api.get<ApiResponse<AttendanceRecord[]>>('/attendance', {
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

const attendanceApi = new AttendanceApi();

// Main Component
export function AttendanceContent() {
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof AttendanceRow>('date');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false); // ADD THIS LINE
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRow[]>([]);
  const [showPreloader, setShowPreloader] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRow | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  // --- Helpers
  const formatTime = (timeString: string) => {
    if (!timeString) return '-';
    if (timeString.includes('AM') || timeString.includes('PM')) return timeString;
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => dayjs(dateString).format('MMM DD, YYYY');

  // --- Initial setup
  useEffect(() => {
    const start = dayjs().startOf('month');
    const end = dayjs().endOf('month');
    setStartDate(start);
    setEndDate(end);
  }, []);

  // --- Fetch user and attendance
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await attendanceApi.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Error getting current user:', err);
        setLoading(false);
        setShowPreloader(false);
        setFilterLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (users.length === 1 && !selectedUser) {
      setSelectedUser(users[0].fullname);
    }
  }, [users]);

  const checkUserAndFetchData = async () => {
    if (!currentUser?.user_id) {
      setLoading(false);
      setShowPreloader(false);
      setFilterLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const exists = await attendanceApi.checkUserExists(currentUser.user_id);
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
      setError('An error occurred while fetching attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) checkUserAndFetchData();
  }, [currentUser]);

  const fetchAttendanceUsers = async () => {
    if (!currentUser?.user_id) return;

    setLoadingUsers(true);
    try {
      const userList = await attendanceApi.getAttendanceUsers();
      setUsers(userList);
    } catch (err) {
      console.error('Error fetching attendance users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAttendanceData = async () => {
    if (!currentUser?.user_id || !startDate || !endDate) {
      setLoading(false);
      setShowPreloader(false);
      setFilterLoading(false);
      return;
    }

    setLoading(true);
    setFilterLoading(true);
    setShowPreloader(true);
    setError(null);
    try {
      // ADD DATE FILTERS LIKE MESSAGES DOES:
      const filters: any = {
        user_id: currentUser.user_id,
        // startDate: startDate.format('YYYY-MM-DD'),
        // endDate: endDate.format('YYYY-MM-DD'),
      };

      const data = await attendanceApi.getAttendance(filters);
      const transformedData: AttendanceRow[] = data.map((record: AttendanceRecord) => ({
        id: record.id,
        user_id: String(record.user_id),
        date: record.date || record.created_at,
        time_in: formatTime(record.time_in),
        kiosk_terminal_in: record.kiosk_terminal_in || 'System Kiosk',
        time_out: formatTime(record.time_out),
        kiosk_terminal_out: record.kiosk_terminal_out || 'System Kiosk',
        status: record.status,
        student_name: record.student_name,
        student_nickname: record.student_nickname || '',
        isRead: record.status === 'read',
        displayDate: formatDate(record.date || record.created_at),
        displayName: record.student_name,
      }));

      setAllRecords(transformedData);
      setAttendanceData(transformedData);

      setTimeout(() => {
        setShowPreloader(false);
        setFilterLoading(false);
      }, 500);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setShowPreloader(false);
      setFilterLoading(false);
      setError('Failed to load attendance records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userExists && startDate && endDate && currentUser) {
      fetchAttendanceData();
      fetchAttendanceUsers();
    }
  }, [userExists, startDate, endDate, currentUser]);

  // --- Filter logic
  // useEffect(() => {
  //     let filtered = allRecords;

  //     if (search.trim()) {
  //         const searchLower = search.toLowerCase().trim();
  //         filtered = filtered.filter((record) => {
  //             const searchableFields = [
  //                 record.displayDate,
  //                 record.time_in,
  //                 record.time_out,
  //                 record.kiosk_terminal_in,
  //                 record.kiosk_terminal_out,
  //                 record.student_name,
  //                 record.displayName,
  //                 record.isRead ? 'read' : 'unread'
  //             ];
  //             return searchableFields.some(field => field && field.toString().toLowerCase().includes(searchLower));
  //         });
  //     }

  //     if (selectedUser) {
  //         filtered = filtered.filter(record => record.student_name === selectedUser);
  //     }

  //     setAttendanceData(filtered);
  //     setPage(0);
  // }, [search, selectedUser, allRecords]);

  // --- Handlers
  const handleOpenModal = async (record: AttendanceRow) => {
    setSelectedRecord(record);
    setOpenModal(true);

    if (!record.isRead) {
      await markAsRead(record.id);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedRecord(null);
  };

  const markAsRead = async (id: number) => {
    setUpdatingStatus(id);
    try {
      setAttendanceData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isRead: true, status: 'read' } : r))
      );
      setAllRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isRead: true, status: 'read' } : r))
      );
      await attendanceApi.markAsRead(id);
    } catch (err) {
      setAttendanceData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isRead: false, status: 'unread' } : r))
      );
      setAllRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isRead: false, status: 'unread' } : r))
      );
      alert('Failed to mark record as read. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const markAllAsRead = async () => {
    const unread = attendanceData.filter((r) => !r.isRead);
    if (!unread.length) return;
    setUpdatingStatus(-1);
    try {
      setAttendanceData((prev) => prev.map((r) => ({ ...r, isRead: true, status: 'read' })));
      setAllRecords((prev) => prev.map((r) => ({ ...r, isRead: true, status: 'read' })));
      await attendanceApi.markAllAsRead(currentUser!.user_id);
    } catch (err) {
      setAttendanceData((prev) =>
        prev.map((r) =>
          unread.find((m) => m.id === r.id) ? { ...r, isRead: false, status: 'unread' } : r
        )
      );
      setAllRecords((prev) =>
        prev.map((r) =>
          unread.find((m) => m.id === r.id) ? { ...r, isRead: false, status: 'unread' } : r
        )
      );
      alert('Failed to mark all records as read. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof AttendanceRow) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: Dayjs | null) => {
    const currentDate = dayjs();
    if (!value) return;
    if (value.isAfter(currentDate, 'day')) value = currentDate;
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
    const start = dayjs().startOf('month');
    const end = dayjs().endOf('month');
    setStartDate(start);
    setEndDate(end);
    setPage(0);
  };

  // --- Data processing
  const filteredData = useMemo(() => {
    let filtered = allRecords;

    // 1. DATE FILTER - MAKE IT SIMPLE LIKE MESSAGES
    filtered = filtered.filter((row) => {
      if (!row.date) return false; // Messages returns false if no date
      try {
        const rowDate = dayjs(row.date);
        // EXACT MESSAGES LOGIC:
        if (startDate && rowDate.isBefore(startDate, 'day')) return false;
        if (endDate && rowDate.isAfter(endDate, 'day')) return false;
        return true;
      } catch (err) {
        console.warn('Date parsing error for record:', row.id, row.date);
        return false; // Messages returns false if date parsing fails
      }
    });

    // 2. SEARCH FILTER
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter((record) => {
        const searchableFields = [
          record.displayDate,
          record.time_in,
          record.time_out,
          record.kiosk_terminal_in,
          record.kiosk_terminal_out,
          record.student_name,
          record.displayName,
          record.isRead ? 'read' : 'unread',
        ];
        return searchableFields.some(
          (field) => field && field.toString().toLowerCase().includes(searchLower)
        );
      });
    }

    // 3. USER FILTER
    if (selectedUser) {
      filtered = filtered.filter((record) => record.student_name === selectedUser);
    }

    return filtered;
  }, [allRecords, search, startDate, endDate, selectedUser]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aVal: any = a[orderBy];
      let bVal: any = b[orderBy];
      if (orderBy === 'date') {
        aVal = dayjs(a.date).valueOf();
        bVal = dayjs(b.date).valueOf();
      } else if (orderBy === 'isRead') {
        aVal = a.isRead ? 1 : 0;
        bVal = b.isRead ? 1 : 0;
      } else if (orderBy === 'student_name') {
        aVal = a.displayName.toLowerCase();
        bVal = b.displayName.toLowerCase();
      } else {
        aVal = aVal?.toString().toLowerCase() || '';
        bVal = bVal?.toString().toLowerCase() || '';
      }
      if (typeof aVal === 'number' && typeof bVal === 'number')
        return order === 'asc' ? aVal - bVal : bVal - aVal;
      return order === 'asc'
        ? aVal.toString().localeCompare(bVal.toString())
        : bVal.toString().localeCompare(aVal.toString());
    });
    return sorted;
  }, [filteredData, order, orderBy]);

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
    { id: 'time_in', label: 'TIME IN' },
    { id: 'kiosk_terminal_in', label: 'KIOSK (IN)', align: 'center' },
    { id: 'time_out', label: 'TIME OUT' },
    { id: 'kiosk_terminal_out', label: 'KIOSK (OUT)', align: 'center' },
    { id: 'student_name', label: 'STUDENT NAME' },
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 2,
            }}
          >
            <CircularProgress size={48} />
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Loading attendance records...
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
              onClick={() => {
                setError(null);
                setLoading(true);
                checkUserAndFetchData();
              }}
              sx={{ fontWeight: 600, borderRadius: 2, px: 3, py: 1 }}
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
            <Typography variant="h6">Attendance Records</Typography>
            {showPreloader ? (
              <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 1 }} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {!currentUser && (
                  <Chip label="Please log in" color="warning" size="small" variant="outlined" />
                )}
                {userExists === false && currentUser && (
                  <Chip
                    label="No attendance records"
                    color="error"
                    size="small"
                    variant="outlined"
                  />
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
                    startIcon={<Iconify icon="solar:eye-bold" width={16} height={16} />}
                  >
                    Mark all as read
                  </Button>
                )}
              </Box>
            )}
          </Box>

          {!currentUser && !loading && (
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
                {`There's a problem of attendance records.`}
              </Alert>
            </Box>
          )}

          {currentUser && userExists === false && !showPreloader && !loading && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error.main" variant="h6">
                No attendance records found
              </Typography>
            </Box>
          )}

          {currentUser && userExists === true && (
            <>
              {/* Filters - Optimized for All Devices */}
              <Box sx={{ mb: 3 }}>
                {/* Mobile & Small Tablet Layout */}
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  {/* Row 1: Search - FULL WIDTH */}
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search anything... (time, kiosk, student, etc.)"
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
                    Showing {filteredData.length} of {allRecords.length} records
                    {filteredUnreadCount > 0 && ` • ${filteredUnreadCount} unread`}
                  </Typography>
                </Box>
              )}

              {/* Table Content */}
              {!isMobile ? (
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
                              textAlign: headCell.align || 'left',
                            }}
                          >
                            <TableSortLabel
                              active={orderBy === headCell.id}
                              direction={orderBy === headCell.id ? order : 'asc'}
                              onClick={(e) =>
                                handleRequestSort(e, headCell.id as keyof AttendanceRow)
                              }
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
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'left',
                                gap: 1,
                              }}
                            >
                              <CircularProgress size={24} />
                              <Typography variant="body2" color="text.secondary">
                                Loading attendance records...
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : paginatedData.length > 0 ? (
                        paginatedData.map((row) => (
                          <TableRow
                            hover
                            key={row.id}
                            onClick={() => handleOpenModal(row)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: !row.isRead
                                ? 'rgba(255, 0, 0, 0.08)'
                                : 'transparent',
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
                                    }}
                                  />
                                )}
                                {row.displayDate}
                              </Box>
                            </TableCell>
                            <TableCell align="left">{row.time_in}</TableCell>
                            <TableCell align="center">{row.kiosk_terminal_in}</TableCell>
                            <TableCell align="left">{row.time_out}</TableCell>
                            <TableCell align="center">{row.kiosk_terminal_out}</TableCell>
                            <TableCell align="left">
                              <Typography variant="body2" fontWeight={500}>
                                {row.displayName}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            <Typography color="text.secondary">
                              {allRecords.length === 0
                                ? 'No attendance records found'
                                : 'No records found with current filters'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ px: 2, pb: 2 }}>
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
                        Loading attendance records...
                      </Typography>
                    </Box>
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((row) => (
                      <Accordion
                        key={row.id}
                        sx={{
                          mb: 1.5,
                          borderRadius: 2,
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          '&:before': { display: 'none' },
                          borderColor: !row.isRead ? 'error.main' : 'divider',
                          backgroundColor: !row.isRead
                            ? 'rgba(255, 0, 0, 0.08)'
                            : 'background.paper',
                        }}
                        onChange={async (event, expanded) => {
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
                              color="#ffffff"
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
                                fontWeight={700}
                                fontSize="0.95rem"
                                sx={{ lineHeight: 1.3 }}
                              >
                                {row.displayName}
                              </Typography>

                              <Typography
                                fontSize="0.75rem"
                                sx={{
                                  opacity: 0.85,
                                  color: 'rgba(255, 255, 255, 0.9)',
                                }}
                              >
                                {row.time_in} - {row.time_out}
                              </Typography>

                              <Typography fontWeight={400} fontSize="0.95rem">
                                {row.displayDate}
                              </Typography>
                            </Stack>

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
                              Time In
                            </Typography>
                            <Typography color="text.primary">{row.time_in}</Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography color="primary.dark" fontWeight={600}>
                              Kiosk (In)
                            </Typography>
                            <Typography color="text.secondary">{row.kiosk_terminal_in}</Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography color="error.main" fontWeight={600}>
                              Time Out
                            </Typography>
                            <Typography color="text.primary">{row.time_out}</Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography color="error.main" fontWeight={600}>
                              Kiosk (Out)
                            </Typography>
                            <Typography color="text.secondary">{row.kiosk_terminal_out}</Typography>
                          </Box>
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
                            <Chip
                              label={row.isRead ? 'Read' : 'Unread'}
                              color={row.isRead ? 'success' : 'error'}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  ) : (
                    <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                      {allRecords.length === 0
                        ? 'No attendance records found'
                        : 'No records found with current filters'}
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

      {/* Attendance Details Modal */}
      <Modal open={openModal} onClose={handleCloseModal}>
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
              Attendance Details
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
                Attendance Information
              </Typography>
              <Stack spacing={1.5}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Date:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedRecord?.displayDate || '-'}
                  </Typography>
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Name:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedRecord?.displayName || '-'}
                  </Typography>
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Status:
                  </Typography>
                  <Chip
                    label={selectedRecord?.isRead ? 'Read' : 'Unread'}
                    color={selectedRecord?.isRead ? 'success' : 'error'}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
              </Stack>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}
              >
                Time In Details
              </Typography>
              <Stack spacing={1.5}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Time:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedRecord?.time_in || '-'}
                  </Typography>
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Kiosk / Terminal:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedRecord?.kiosk_terminal_in || '-'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
                Time Out Details
              </Typography>
              <Stack spacing={1.5}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Time:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedRecord?.time_out || '-'}
                  </Typography>
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Kiosk / Terminal:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedRecord?.kiosk_terminal_out || '-'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
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
