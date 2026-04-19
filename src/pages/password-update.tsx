import { CONFIG } from 'src/config-global';
import { PasswordUpdateView } from 'src/sections/password-update/view';


// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Edit & Update Password - ${CONFIG.appName}`}</title>
            <PasswordUpdateView />
        </>
    );
}
