import { CONFIG } from 'src/config-global';

import { AttendanceView } from 'src/sections/attendance/view';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Attendance - ${CONFIG.appName}`}</title>
            <AttendanceView />
        </>
    );
}
