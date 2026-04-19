import type { IconButtonProps } from '@mui/material/IconButton';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';

import { fToNow } from 'src/utils/format-time';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export type MessageItemProps = {
    id: string | number;
    sender: string;
    subject: string;
    isUnRead: boolean;
    avatarUrl?: string | null;
    receivedAt?: string | number | null;
};

export type MessagesPopoverProps = IconButtonProps & {
    data?: MessageItemProps[];
};

// ----------------------------------------------------------------------

export function MessagesPopover({ data = [], sx, ...other }: MessagesPopoverProps) {
    const [messages, setMessages] = useState(data);
    const totalUnRead = messages.filter((msg) => msg.isUnRead).length;
    const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

    const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        setOpenPopover(event.currentTarget);
    }, []);

    const handleClosePopover = useCallback(() => {
        setOpenPopover(null);
    }, []);

    const handleMarkAllAsRead = useCallback(() => {
        setMessages((prev) => prev.map((msg) => ({ ...msg, isUnRead: false })));
    }, []);

    return (
        <>
            <IconButton
                color={openPopover ? 'primary' : 'default'}
                onClick={handleOpenPopover}
                sx={sx}
                {...other}
            >
                <Badge badgeContent={totalUnRead} color="error">
                    {/* changed icon from email to user group */}
                    {/* <Iconify width={24} icon={"mdi:account-group" as any} /> */}
                    <Iconify width={24} icon={"solar:letter-bold-duotone" as any} />
                </Badge>
            </IconButton>

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
                            flexDirection: 'column',
                        },
                    },
                }}
            >
                {/* Header */}
                <Box sx={{ py: 2, pl: 2.5, pr: 1.5, display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">Messages</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            You have {totalUnRead} unread messages
                        </Typography>
                    </Box>
                    {totalUnRead > 0 && (
                        <Tooltip title="Mark all as read">
                            <IconButton color="primary" onClick={handleMarkAllAsRead}>
                                <Iconify icon="eva:done-all-fill" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>

                <Divider sx={{ borderStyle: 'dashed' }} />

                {/* Scrollable Messages */}
                <Scrollbar fillContent sx={{ minHeight: 240, maxHeight: { xs: 360, sm: 'none' } }}>
                    <List
                        disablePadding
                        subheader={
                            <ListSubheader disableSticky sx={{ py: 1, px: 2.5, typography: 'overline' }}>
                                New
                            </ListSubheader>
                        }
                    >
                        {messages.slice(0, 2).map((msg) => (
                            <MessageItem key={msg.id} message={msg} />
                        ))}
                    </List>

                    <List
                        disablePadding
                        subheader={
                            <ListSubheader disableSticky sx={{ py: 1, px: 2.5, typography: 'overline' }}>
                                Earlier
                            </ListSubheader>
                        }
                    >
                        {messages.slice(2).map((msg) => (
                            <MessageItem key={msg.id} message={msg} />
                        ))}
                    </List>
                </Scrollbar>

                <Divider sx={{ borderStyle: 'dashed' }} />

                {/* Footer */}
                <Box sx={{ p: 1 }}>
                    <Button fullWidth disableRipple color="inherit">
                        View all
                    </Button>
                </Box>
            </Popover>
        </>
    );
}

// ----------------------------------------------------------------------

function MessageItem({ message }: { message: MessageItemProps }) {
    return (
        <ListItemButton
            sx={{
                py: 1.5,
                px: 2.5,
                mt: '1px',
                ...(message.isUnRead && { bgcolor: 'action.selected' }),
            }}
        >
            <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    {message.avatarUrl ? <img src={message.avatarUrl} alt={message.sender} /> : message.sender.charAt(0)}
                </Avatar>
            </ListItemAvatar>

            <ListItemText
                primary={
                    <Typography variant="subtitle2" noWrap>
                        {message.sender}
                        <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
                            &nbsp; {message.subject}
                        </Typography>
                    </Typography>
                }
                secondary={
                    message.receivedAt && (
                        <Typography
                            variant="caption"
                            sx={{ mt: 0.5, gap: 0.5, display: 'flex', alignItems: 'center', color: 'text.disabled' }}
                        >
                            <Iconify width={14} icon="solar:clock-circle-outline" />
                            {fToNow(message.receivedAt)}
                        </Typography>
                    )
                }
            />
        </ListItemButton>
    );
}
