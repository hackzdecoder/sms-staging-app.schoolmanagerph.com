import { CONFIG } from 'src/config-global';

// import { ResetPasswordLvlOneView } from 'src/sections/';
import { ResetPasswordRequestLvlTwoView } from 'src/sections/authentication/reset-password-request-lvl-2';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Reset Password - ${CONFIG.appName}`}</title>

            <ResetPasswordRequestLvlTwoView />
        </>
    );
}
