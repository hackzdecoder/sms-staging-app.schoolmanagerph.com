import { Iconify } from 'src/components/iconify';

import type { AccountPopoverProps } from './components/account-popover';

// ----------------------------------------------------------------------

export const _account: AccountPopoverProps['data'] = [
  {
    label: 'Change Email Address',
    href: '/edit-update-email',
    icon: <Iconify width={22} icon={"solar:letter-bold-duotone" as any} />,
  },
  {
    label: 'Change Password',
    href: '/edit-update-password',
    icon: <Iconify width={22} icon={"solar:lock-keyhole-bold-duotone" as any} />,
  },
  {
    label: 'Terms & Conditions',
    href: '#terms',
    icon: <Iconify width={22} icon={"solar:document-text-bold-duotone" as any} />,
  },
  {
    label: 'Acceptable Use Policy',
    href: '#acceptable-use',
    icon: <Iconify width={22} icon={"solar:document-add-bold-duotone" as any} />,
  },
  {
    label: 'Privacy Policy',
    href: '#privacy',
    icon: <Iconify width={22} icon={"solar:shield-bold-duotone" as any} />,
  },
];