import { CONFIG } from 'src/config-global';
import { EmailUpdateView } from 'src/sections/email-update/view';


// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Edit & Update Email Address - ${CONFIG.appName}`}</title>
            <EmailUpdateView />
        </>
    );
}
