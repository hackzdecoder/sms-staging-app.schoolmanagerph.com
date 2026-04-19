import { useState, useEffect } from 'react';
import type { AppBarProps } from '@mui/material/AppBar';
import type { ContainerProps } from '@mui/material/Container';
import type { Theme, SxProps, CSSObject, Breakpoint } from '@mui/material/styles';

import { useScrollOffsetTop } from 'minimal-shared/hooks';
import { varAlpha, mergeClasses } from 'minimal-shared/utils';

import AppBar from '@mui/material/AppBar';
import { styled } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

import { layoutClasses } from './classes';

// ----------------------------------------------------------------------

export type HeaderSectionProps = AppBarProps & {
  layoutQuery?: Breakpoint;
  disableOffset?: boolean;
  disableElevation?: boolean;
  showClock?: boolean;
  clockValue?: Date | string | null;
  clockFormat?: '12h' | '24h';
  // Add onTimeChange prop to pass time to parent
  onTimeChange?: (time: Date) => void;
  slots?: {
    leftArea?: React.ReactNode;
    rightArea?: React.ReactNode;
    topArea?: React.ReactNode;
    centerArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
  slotProps?: {
    container?: ContainerProps;
    centerArea?: React.ComponentProps<'div'> & { sx?: SxProps<Theme> };
  };
};

export function HeaderSection({
  sx,
  slots,
  slotProps,
  className,
  disableOffset,
  disableElevation,
  layoutQuery = 'md',
  showClock = false,
  clockValue = null,
  clockFormat = '12h',
  onTimeChange,
  ...other
}: HeaderSectionProps) {
  const { offsetTop: isOffset } = useScrollOffsetTop();

  return (
    <HeaderRoot
      position="sticky"
      color="transparent"
      isOffset={isOffset}
      disableOffset={disableOffset}
      disableElevation={disableElevation}
      className={mergeClasses([layoutClasses.header, className])}
      sx={[
        (theme) => ({
          ...(isOffset && {
            '--color': `var(--offset-color, ${theme.vars.palette.text.primary})`,
          }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {slots?.topArea}

      <HeaderContainer layoutQuery={layoutQuery} {...slotProps?.container}>
        {showClock ? (
          <DigitalClock
            initialValue={clockValue}
            format={clockFormat}
            onTimeChange={onTimeChange}
          />
        ) : (
          slots?.leftArea
        )}

        <HeaderCenterArea {...slotProps?.centerArea}>{slots?.centerArea}</HeaderCenterArea>

        {slots?.rightArea}
      </HeaderContainer>

      {slots?.bottomArea}
    </HeaderRoot>
  );
}

// ----------------------------------------------------------------------

interface DigitalClockProps {
  initialValue?: Date | string | null;
  format?: '12h' | '24h';
  onTimeChange?: (time: Date) => void;
}

const DigitalClock = ({ initialValue = null, format = '12h', onTimeChange }: DigitalClockProps) => {
  const [time, setTime] = useState<Date>(
    initialValue
      ? typeof initialValue === 'string'
        ? new Date(initialValue)
        : initialValue
      : new Date()
  );

  useEffect(() => {
    // Notify parent of time change
    if (onTimeChange) {
      onTimeChange(time);
    }
  }, [time, onTimeChange]);

  useEffect(() => {
    if (!initialValue) {
      const timer = setInterval(() => {
        const newTime = new Date();
        setTime(newTime);
        // Notify parent on each update
        if (onTimeChange) {
          onTimeChange(newTime);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
    return undefined;
  }, [initialValue, onTimeChange]);

  const formatTime = (date: Date) => {
    if (format === '24h') {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    } else {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const ampm = hours >= 12 ? 'PM' : 'AM';

      const hours12 = hours % 12 || 12;

      const formattedHours = hours12.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const formattedSeconds = seconds.toString().padStart(2, '0');

      return `${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
    }
  };

  return (
    <>
      <style>
        {`
          @font-face {
            font-family: 'DS-Digital';
            font-style: normal;
            font-weight: normal;
            font-display: swap;
            src: url('/assets/fonts/DS-DIGII.TTF') format('truetype');
          }
        `}
      </style>
      <Box
        sx={{
          fontFamily: "'DS-Digital', 'Digital-7', 'Segment7Standard', 'Courier New', monospace",
          fontSize: {
            xs: '1rem',
            sm: '1.125rem',
            md: '1.25rem',
          },
          fontWeight: 'normal',
          color: (theme) => (theme.palette.mode === 'dark' ? '#B0B0B0' : '#666666'),
          letterSpacing: '3px',
          fontVariantNumeric: 'tabular-nums',
          textShadow: 'none',
        }}
      >
        {formatTime(time)}
      </Box>
    </>
  );
};

// ----------------------------------------------------------------------

type HeaderRootProps = Pick<HeaderSectionProps, 'disableOffset' | 'disableElevation'> & {
  isOffset: boolean;
};

const HeaderRoot = styled(AppBar, {
  shouldForwardProp: (prop: string) =>
    !['isOffset', 'disableOffset', 'disableElevation', 'sx'].includes(prop),
})<HeaderRootProps>(({ isOffset, disableOffset, disableElevation, theme }) => {
  const pauseZindex = { top: -1, bottom: -2 };

  const pauseStyles: CSSObject = {
    opacity: 0,
    content: '""',
    visibility: 'hidden',
    position: 'absolute',
    transition: theme.transitions.create(['opacity', 'visibility'], {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.shorter,
    }),
  };

  const bgStyles: CSSObject = {
    ...pauseStyles,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: pauseZindex.top,
    backdropFilter: `blur(6px)`,
    WebkitBackdropFilter: `blur(6px)`,
    backgroundColor: varAlpha(theme.vars.palette.background.defaultChannel, 0.8),
    ...(isOffset && {
      opacity: 1,
      visibility: 'visible',
    }),
  };

  const shadowStyles: CSSObject = {
    ...pauseStyles,
    left: 0,
    right: 0,
    bottom: 0,
    height: 24,
    margin: 'auto',
    borderRadius: '50%',
    width: `calc(100% - 48px)`,
    zIndex: pauseZindex.bottom,
    boxShadow: theme.vars.customShadows.z8,
    ...(isOffset && { opacity: 0.48, visibility: 'visible' }),
  };

  return {
    boxShadow: 'none',
    zIndex: 'var(--layout-header-zIndex)',
    ...(!disableOffset && { '&::before': bgStyles }),
    ...(!disableElevation && { '&::after': shadowStyles }),
  };
});

const HeaderContainer = styled(Container, {
  shouldForwardProp: (prop: string) => !['layoutQuery', 'sx'].includes(prop),
})<Pick<HeaderSectionProps, 'layoutQuery'>>(({ layoutQuery = 'md', theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: 'var(--color)',
  height: 'var(--layout-header-mobile-height)',
  [theme.breakpoints.up(layoutQuery)]: { height: 'var(--layout-header-desktop-height)' },
}));

const HeaderCenterArea = styled('div')(() => ({
  display: 'flex',
  flex: '1 1 auto',
  justifyContent: 'center',
}));
