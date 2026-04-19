import { CONFIG } from 'src/config-global';

import { FirstUserView } from 'src/sections/authentication/first-user';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`First User - ${CONFIG.appName}`}</title>
            <FirstUserView />
        </>
    );
}
