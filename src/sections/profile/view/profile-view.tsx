import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { ProfileContent } from '../profile-content';

// ----------------------------------------------------------------------

export function ProfileView() {
  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Profile
        </Typography>
      </Box>

      {/* Empty state placeholder */}
      {/* <Box
        sx={{
          py: 10,
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography variant="h6">No profile data available</Typography>
        <Typography variant="body2">
          Profile info will appear here once added.
        </Typography>
      </Box> */}
      <ProfileContent />
    </DashboardContent>
  );
}
