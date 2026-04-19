import { CONFIG } from 'src/config-global';

// import { ResetPasswordRequestLvlOneView } from 'src/sections/';
import { ResetPasswordRequestLvlOneView } from 'src/sections/authentication/reset-password-request-lvl-1';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Reset Password - ${CONFIG.appName}`}</title>

            <ResetPasswordRequestLvlOneView />
        </>
    );
}
