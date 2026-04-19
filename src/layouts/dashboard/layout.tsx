import { merge } from 'es-toolkit';

// External
import { useBoolean } from 'minimal-shared/hooks';

// MUI
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import type { Breakpoint } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

// Internal mock data
import { _langs, _notifications } from 'src/_mock';
import { _messages } from 'src/_mock/_messages';

// Core layout
import { layoutClasses } from '../core/classes';
import { HeaderSection } from '../core/header-section';
import type { HeaderSectionProps } from '../core/header-section';
import { LayoutSection } from '../core/layout-section';
import type { LayoutSectionProps } from '../core/layout-section';
import { MainSection } from '../core/main-section';
import type { MainSectionProps } from '../core/main-section';

// Nav config
import { _account } from '../nav-config-account';
import { useNavData } from '../nav-config-dashboard';
import { _workspaces } from '../nav-config-workspace';

// Sibling imports
import { dashboardLayoutVars } from './css-vars';
import { NavDesktop, NavMobile } from './nav';

// Components
import { AccountPopover } from '../components/account-popover';
import { MenuButton } from '../components/menu-button';
import { NotificationsPopover } from '../components/notifications-popover';
import { Searchbar } from '../components/searchbar';

// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type DashboardLayoutProps = LayoutBaseProps & {
  layoutQuery?: Breakpoint;
  slotProps?: {
    header?: HeaderSectionProps;
    main?: MainSectionProps;
  };
};

export function DashboardLayout({
  sx,
  cssVars,
  children,
  slotProps,
  layoutQuery = 'lg',
}: DashboardLayoutProps) {
  const theme = useTheme();
  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  const navData = useNavData();

  const renderHeader = () => {
    const headerSlotProps: HeaderSectionProps['slotProps'] = {
      container: { maxWidth: false },
    };

    const headerSlots: HeaderSectionProps['slots'] = {
      topArea: (
        <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
          This is an info Alert.
        </Alert>
      ),
      leftArea: (
        <>
          <MenuButton
            onClick={onOpen}
            sx={{ mr: 1, ml: -1, [theme.breakpoints.up(layoutQuery)]: { display: 'none' } }}
          />
          <NavMobile data={navData} open={open} onClose={onClose} workspaces={_workspaces} />
        </>
      ),
      rightArea: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 0.75 } }}>
          <Searchbar />
          <NotificationsPopover />
          <AccountPopover data={_account} />
        </Box>
      ),
    };

    return (
      <HeaderSection
        disableElevation
        layoutQuery={layoutQuery}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
        sx={{
          backgroundColor: '#fff',
          boxShadow: theme.shadows[3],
          borderRadius: 2,
          margin: theme.spacing(1, 2),
          width: `calc(100% - ${theme.spacing(4)})`,
          zIndex: theme.zIndex.appBar,
          position: 'sticky',
          top: theme.spacing(1),
          ...(slotProps?.header?.sx as object),
        }}
      />
    );
  };

  return (
    <LayoutSection
      headerSection={renderHeader()}
      sidebarSection={<NavDesktop data={navData} layoutQuery={layoutQuery} workspaces={_workspaces} />}
      footerSection={null}
      cssVars={{ ...dashboardLayoutVars(theme), ...cssVars }}
      sx={[
        {
          [`& .${layoutClasses.sidebarContainer}`]: {
            [theme.breakpoints.up(layoutQuery)]: {
              pl: 'var(--layout-nav-vertical-width)',
              transition: theme.transitions.create(['padding-left'], {
                easing: 'var(--layout-transition-easing)',
                duration: 'var(--layout-transition-duration)',
              }),
            },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <MainSection {...slotProps?.main}>{children}</MainSection>
    </LayoutSection>
  );
}
