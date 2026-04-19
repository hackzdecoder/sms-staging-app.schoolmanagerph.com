import { CONFIG } from 'src/config-global';

import { LoginView } from 'src/sections/authentication/login';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Login - ${CONFIG.appName}`}</title>

            <LoginView />
        </>
    );
}
