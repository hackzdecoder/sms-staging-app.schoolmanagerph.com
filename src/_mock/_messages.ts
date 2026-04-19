// src/_mock/_messages.ts
import type { MessageItemProps } from 'src/layouts/components/messages-popover';

export const _messages: MessageItemProps[] = [
    {
        id: 1,
        sender: 'Admin',
        subject: 'Welcome to the system 🎉',
        isUnRead: true,
        avatarUrl: null,
        receivedAt: new Date().getTime(),
    },
    {
        id: 2,
        sender: 'Teacher',
        subject: 'Your grades are posted',
        isUnRead: true,
        avatarUrl: null,
        receivedAt: new Date().getTime() - 600000, // 10 minutes ago
    },
    {
        id: 3,
        sender: 'Support',
        subject: 'System maintenance at 9PM',
        isUnRead: false,
        avatarUrl: null,
        receivedAt: new Date().getTime() - 3600000, // 1 hour ago
    },
];
