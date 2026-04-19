import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';

import { Iconify } from 'src/components/iconify';
import { DashboardContent } from 'src/layouts/dashboard';
import { BlankContent } from '../blank-content';

export function BlankView() {
  return (
    <DashboardContent>
      <Box sx={{ mb: 5 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs
          aria-label="breadcrumb"
          separator={
            <Iconify
              icon={"eva:chevron-right-fill" as any}
              width={14}
              sx={{ color: 'text.secondary', mx: 0.5 }}
            />
          }
          sx={{ fontSize: 13, mb: 3, '& a': { color: 'text.secondary' } }}
        >
          <Link
            underline="hover"
            href="/"
            sx={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}
          >
            <Iconify icon={"eva:home-outline" as any} width={16} sx={{ mr: 0.5 }} />
            Dashboard
          </Link>

          <Typography color="text.primary" sx={{ fontWeight: 600 }}>
            Blank Page
          </Typography>
        </Breadcrumbs>

        {/* Page Title */}
        {/* <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            This Page is under maintenance
          </Typography>
        </Box> */}
      </Box>

      <BlankContent />
    </DashboardContent>
  );
}
