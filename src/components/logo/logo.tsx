// Type imports first
import type { LinkProps } from '@mui/material/Link';

// External libraries
import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

// Custom app routes/components
import { RouterLink } from 'src/routes/components';

// Local files
import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
};

export function Logo({
  sx,
  disabled,
  className,
  href = '',
  isSingle = true,
  ...other
}: LogoProps) {
  return (
    <LogoRoot
      component={href ? RouterLink : Box} // ← KEY FIX: Box when no href
      href={href || undefined} // ← undefined instead of empty string
      aria-label={href ? "Logo" : undefined}
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          gap: 0.2,
          width: isSingle ? 200 : 200,
          height: isSingle ? 75 : 60,
          cursor: href ? 'pointer' : 'default', // ← Only pointer when clickable
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        component="img"
        src="/assets/images/school-logo.png"
        alt="School Logo"
        sx={{ width: isSingle ? '100%' : 140, height: '100%', objectFit: 'contain' }}
      />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'left',
          lineHeight: 1.2,
        }}
      >
        <Typography
          variant="caption"
          component="div"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            letterSpacing: 0.4,
            fontSize: 11,
          }}
        >
          TaparSoft
        </Typography>

        <Typography variant="h6" component="div" sx={{ color: '#000' }}>
          SchoolMANAGER
        </Typography>

        <Typography
          variant="subtitle1"
          component="div"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            fontSize: 9,
            textAlign: 'right',
            letterSpacing: 0.3,
            whiteSpace: 'nowrap',
          }}
        >
          School Management System
        </Typography>
      </Box>
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
