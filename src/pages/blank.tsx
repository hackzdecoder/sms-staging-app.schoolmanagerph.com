import { CONFIG } from 'src/config-global';
import { BlankView } from 'src/sections/blank/view';


// ----------------------------------------------------------------------

export default function Page() {
    return (
        <>
            <title>{`Blank - ${CONFIG.appName}`}</title>
            <BlankView />
        </>
    );
}
