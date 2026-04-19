import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Iconify } from 'src/components/iconify';

export function GradesContent() {
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





// import Breadcrumbs from '@mui/material/Breadcrumbs';
// import Link from '@mui/material/Link';

// import { Iconify } from 'src/components/iconify';
// // src/sections/grades/grades-content.tsx
// import {
//     Box,
//     Grid,
//     Paper,
//     Typography,
//     Avatar,
//     Chip,
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
//     TablePagination,
//     TextField,
//     InputAdornment,
//     Stack,
// } from '@mui/material';
// import { Iconify } from 'src/components/iconify';
// import { useState, useMemo } from 'react';

// // Grade colors
// const gradeColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
//     'A+': 'success',
//     A: 'success',
//     'A-': 'success',
//     'B+': 'warning',
//     B: 'warning',
//     'C+': 'default',
//     C: 'default',
//     D: 'error',
//     F: 'error',
// };

// // Student info
// const student = {
//     name: 'Sagara Kyosuke',
//     studentId: 'STU-2025-001',
//     email: 'sagara.kyosuke@example.com',
//     gradeLevel: 3,
//     status: 'Active',
//     avatar: '/assets/images/avatars/avatar_1.jpg',
// };

// // All subjects across all years
// const semesterSubjects = [
//     { id: 1, subject: 'Mathematics 101', instructor: 'Prof. Tanaka', grade: 'A', credits: 3, period: '1st Semester 2023-2024' },
//     { id: 2, subject: 'Physics 101', instructor: 'Prof. Suzuki', grade: 'B+', credits: 4, period: '2nd Semester 2023-2024' },
//     { id: 3, subject: 'English 101', instructor: 'Prof. Cruz', grade: 'A-', credits: 3, period: '1st Semester 2024-2025' },
//     { id: 4, subject: 'History 101', instructor: 'Prof. Reyes', grade: 'B', credits: 3, period: '2nd Semester 2024-2025' },
//     { id: 5, subject: 'Physical Education', instructor: 'Coach Santos', grade: 'C+', credits: 2, period: '1st Semester 2024-2025' },
//     // Add more subjects for all years if needed
// ];

// export function GradesContent() {
//     const [searchText, setSearchText] = useState('');
//     const [page, setPage] = useState(0);
//     const [rowsPerPage, setRowsPerPage] = useState(5);

//     // Pagination handlers
//     const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);
//     const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
//         setRowsPerPage(parseInt(event.target.value, 10));
//         setPage(0);
//     };

//     // Filtered data based on search
//     const filteredData = useMemo(
//         () =>
//             semesterSubjects.filter(
//                 (row) =>
//                     row.subject.toLowerCase().includes(searchText.toLowerCase()) ||
//                     row.instructor.toLowerCase().includes(searchText.toLowerCase()) ||
//                     row.period.toLowerCase().includes(searchText.toLowerCase())
//             ),
//         [searchText]
//     );

//     const paginatedData = useMemo(
//         () => filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
//         [filteredData, page, rowsPerPage]
//     );

//     return (
//         <Box>
//             <Grid container spacing={3}>
//                 {/* Left: Student Info */}
//                 <Grid size={{ xs: 12, sm: 6, md: 3 }}>
//                     <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5, borderRadius: 2 }}>
//                         <Avatar
//                             src={student.avatar}
//                             alt={student.name}
//                             sx={{ width: 80, height: 80, mb: 1, border: '2px solid #1976d2' }}
//                         />
//                         <Typography variant="h6">{student.name}</Typography>
//                         <Typography variant="body2" color="text.secondary">
//                             Grade {student.gradeLevel}
//                         </Typography>
//                         <Typography variant="body2" color="text.secondary">
//                             ID: {student.studentId}
//                         </Typography>
//                         <Typography variant="body2" color="text.secondary">
//                             {student.email}
//                         </Typography>
//                         <Chip
//                             label={student.status}
//                             color={student.status === 'Active' ? 'success' : 'default'}
//                             size="small"
//                             sx={{ mt: 1 }}
//                         />
//                     </Paper>
//                 </Grid>

//                 {/* Right: Grades Table */}
//                 <Grid size={{ xs: 12, sm: 6, md: 9 }}>
//                     <Paper sx={{ borderRadius: 2 }}>
//                         <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
//                             <Typography variant="h6">All Subjects</Typography>

//                             {/* Search */}
//                             <TextField
//                                 label="Search by subject, teacher, or semester"
//                                 size="small"
//                                 value={searchText}
//                                 onChange={(e) => setSearchText(e.target.value)}
//                                 fullWidth
//                                 InputProps={{
//                                     endAdornment: (
//                                         <InputAdornment position="end">
//                                             <Iconify icon="eva:search-fill" />
//                                         </InputAdornment>
//                                     ),
//                                 }}
//                             />
//                         </Box>

//                         <TableContainer>
//                             <Table>
//                                 <TableHead>
//                                     <TableRow>
//                                         {['Subject', 'Teacher', 'Semester'].map((label) => (
//                                             <TableCell
//                                                 key={label}
//                                                 sx={{
//                                                     backgroundColor: 'var(--palette-primary-main)',
//                                                     color: '#fff',
//                                                     fontWeight: 600,
//                                                     borderBottom: 'none',
//                                                     textAlign: 'left',
//                                                     py: 1.5,
//                                                 }}
//                                             >
//                                                 {label}
//                                             </TableCell>
//                                         ))}
//                                     </TableRow>
//                                 </TableHead>

//                                 <TableBody>
//                                     {paginatedData.map((row) => (
//                                         <TableRow key={row.id}>
//                                             <TableCell>{row.subject}</TableCell>
//                                             <TableCell>{row.instructor}</TableCell>
//                                             <TableCell>{row.period}</TableCell>
//                                         </TableRow>
//                                     ))}

//                                     {paginatedData.length === 0 && (
//                                         <TableRow>
//                                             <TableCell colSpan={5} align="left">
//                                                 No matching subjects
//                                             </TableCell>
//                                         </TableRow>
//                                     )}
//                                 </TableBody>
//                             </Table>
//                         </TableContainer>


//                         {/* Pagination */}
//                         <TablePagination
//                             rowsPerPageOptions={[5, 10, 25]}
//                             component="div"
//                             count={filteredData.length}
//                             rowsPerPage={rowsPerPage}
//                             page={page}
//                             onPageChange={handleChangePage}
//                             onRowsPerPageChange={handleChangeRowsPerPage}
//                             sx={{
//                                 '.MuiTablePagination-toolbar': { minHeight: 52 },
//                                 '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { color: 'text.secondary' },
//                                 '& .MuiIconButton-root': { color: '#1976d2' },
//                             }}
//                         />
//                     </Paper>
//                 </Grid>
//             </Grid>
//         </Box>
//     );
// }
