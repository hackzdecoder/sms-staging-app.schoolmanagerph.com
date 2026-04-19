import type { CardProps } from '@mui/material/Card';
import type { PaletteColorKey } from 'src/theme/core';
import type { ChartOptions } from 'src/components/chart';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

import { fPercent, fShortenNumber } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = CardProps & {
    title: string;
    total: number;
    percent?: number; // optional
    color?: PaletteColorKey;
    icon: React.ReactNode;
    chart?: { // optional
        series: number[];
        categories: string[];
        options?: ChartOptions;
    };
};

export function DashboardWidgets({
    sx,
    icon,
    title,
    total,
    chart,
    percent,
    color = 'primary',
    ...other
}: Props) {
    const theme = useTheme();

    const chartColors = chart ? [theme.palette[color].dark] : [];

    const chartOptions = useChart({
        chart: { sparkline: { enabled: true } },
        colors: chartColors,
        xaxis: { categories: chart?.categories || [] },
        grid: {
            padding: { top: 6, left: 6, right: 6, bottom: 6 },
        },
        tooltip: {
            y: { formatter: (value: number) => value.toString(), title: { formatter: () => '' } },
        },
        markers: { strokeWidth: 0 },
        ...chart?.options,
    });

    const renderTrending = () =>
        percent !== undefined ? (
            <Box
                sx={{
                    top: 16,
                    gap: 0.5,
                    right: 16,
                    display: 'flex',
                    position: 'absolute',
                    alignItems: 'center',
                }
                }
            >
                <Iconify
                    width={20}
                    icon={percent < 0 ? 'eva:trending-down-fill' : 'eva:trending-up-fill'}
                />
                <Box component="span" sx={{ typography: 'subtitle2' }}>
                    {percent > 0 && '+'}
                    {fPercent(percent)}
                </Box>
            </Box>
        ) : null;

    return (
        <Card
            sx={
                [
                    () => ({
                        p: 3,
                        boxShadow: 'none',
                        position: 'relative',
                        color: `${color}.darker`,
                        backgroundColor: 'common.white',
                        backgroundImage: `linear-gradient(135deg, ${varAlpha(
                            theme.vars.palette[color].lighterChannel,
                            0.48
                        )}, ${varAlpha(theme.vars.palette[color].lightChannel, 0.48)})`,
                    }),
                    ...(Array.isArray(sx) ? sx : [sx]),
                ]
            }
            {...other}
        >
            <Box sx={{ width: 48, height: 48, mb: 3 }}> {icon} </Box>

            {renderTrending()}

            <Box
                sx={
                    {
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-end',
                    }
                }
            >
                <Box sx={{ flexGrow: 1, minWidth: 112 }}>
                    <Box sx={{ mb: 1, typography: 'subtitle2' }}> {title} </Box>
                    < Box sx={{ typography: 'h4' }}> {fShortenNumber(total)} </Box>
                </Box>

                {
                    chart && (
                        <Chart
                            type="line"
                            series={[{ data: chart.series }]}
                            options={chartOptions}
                            sx={{ width: 84, height: 56 }
                            }
                        />
                    )}
            </Box>

            < SvgColor
                src="/assets/background/shape-square.svg"
                sx={{
                    top: 0,
                    left: -20,
                    width: 240,
                    zIndex: -1,
                    height: 240,
                    opacity: 0.24,
                    position: 'absolute',
                    color: `${color}.main`,
                }}
            />
        </Card>
    );
}
