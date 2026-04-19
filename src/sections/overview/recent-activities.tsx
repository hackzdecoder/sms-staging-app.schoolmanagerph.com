import type { BoxProps } from '@mui/material/Box';
import type { CardProps } from '@mui/material/Card';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import CardHeader from '@mui/material/CardHeader';
import ListItemText from '@mui/material/ListItemText';
import { Typography } from '@mui/material';

import { fToNow } from 'src/utils/format-time';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

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

type Props = CardProps & {
  title?: string;
  subheader?: string;
  messages?: MessageRecord[];
};

export function RecentActivities({ title, subheader, messages = [], sx, ...other }: Props) {
  const formattedMessages = messages.map((message) => ({
    id: message.id.toString(),
    title: message.subject,
    description: message.message || 'No message content',
    coverUrl: '/assets/icons/glass/ic-messages.svg',
    postedAt: message.created_at,
    status: message.status,
  }));

  return (
    <Card sx={sx} {...other}>
      <CardHeader
        title={title}
        subheader={subheader}
        sx={{ mb: 1 }}
      />

      <Scrollbar sx={{ minHeight: 405 }}>
        <Box sx={{ minWidth: 640 }}>
          {formattedMessages.map((item) => (
            <Item key={item.id} item={item} />
          ))}

          {formattedMessages.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No recent messages
              </Typography>
            </Box>
          )}
        </Box>
      </Scrollbar>

      <Box sx={{ p: 2, textAlign: 'right' }}>
        <Button
          size="small"
          color="inherit"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}
          href="/messaging" // Link to messages page
        >
          View all messages
        </Button>
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

type ItemProps = BoxProps & {
  item: {
    id: string;
    title: string;
    coverUrl: string;
    description: string;
    postedAt: string | number | null;
    status?: string;
  };
};

function Item({ item, sx, ...other }: ItemProps) {
  // Show unread indicator
  const isUnread = item.status?.toLowerCase() === 'unread';

  return (
    <Box
      sx={[
        (theme) => ({
          py: 2,
          px: 3,
          gap: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
          backgroundColor: isUnread ? 'rgba(255, 0, 0, 0.04)' : 'transparent',
          borderLeft: isUnread ? '4px solid' : 'none',
          borderColor: isUnread ? 'error.main' : 'transparent',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Avatar
        variant="rounded"
        alt={item.title}
        src={item.coverUrl}
        sx={{
          width: 48,
          height: 48,
          flexShrink: 0,
          bgcolor: isUnread ? 'error.light' : 'primary.light'
        }}
      >
        {isUnread ? (
          <Iconify icon="solar:eye-closed-bold" width={24} /> // CLOSED eye for UNREAD (not seen)
        ) : (
          <Iconify icon="solar:eye-bold" width={24} /> // OPEN eye for READ (seen)
        )}
      </Avatar>

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Link color="inherit" sx={{ fontWeight: isUnread ? 600 : 400 }}>
              {item.title}
            </Link>
            {isUnread && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                }}
              />
            )}
          </Box>
        }
        secondary={item.description}
        slotProps={{
          primary: { noWrap: true },
          secondary: {
            noWrap: true,
            sx: { mt: 0.5 },
          },
        }}
      />

      <Box sx={{ flexShrink: 0, typography: 'caption', color: 'text.disabled' }}>
        {fToNow(item.postedAt)}
      </Box>
    </Box>
  );
}