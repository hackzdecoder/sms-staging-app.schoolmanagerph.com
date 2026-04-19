import { CONFIG } from 'src/config-global';

// import { ResetPasswordRequestLvlOneView } from 'src/sections/';
import { PasswordResetView } from 'src/sections/authentication/password-reset';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Password Reset - ${CONFIG.appName}`}</title>

            <PasswordResetView />
        </>
    );
}
