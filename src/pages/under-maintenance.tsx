import { CONFIG } from 'src/config-global';

import { UnderMaintenanceView } from 'src/sections/under-maintenance/view';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Profile - ${CONFIG.appName}`}</title>

            <UnderMaintenanceView />
        </>
    );
}
