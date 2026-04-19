import { CONFIG } from 'src/config-global';

// import { ResetPasswordRequestLvlOneView } from 'src/sections/';
import { ResetPasswordRequestLvlOneView } from 'src/sections/authentication/reset-options';

// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Reset Password - ${CONFIG.appName}`}</title>

            <ResetPasswordRequestLvlOneView />
        </>
    );
}
