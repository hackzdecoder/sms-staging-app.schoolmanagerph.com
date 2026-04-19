import { CONFIG } from 'src/config-global';
import { MessagingView } from 'src/sections/messaging/view';

// ----------------------------------------------------------------------
export default function Page() {
    return (
        <>
            <title>{`Messages - ${CONFIG.appName}`}</title>
            <MessagingView />
        </>
    );
}
