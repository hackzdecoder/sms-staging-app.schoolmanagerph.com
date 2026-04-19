import { CONFIG } from 'src/config-global';
import { GradesView } from 'src/sections/grades/view/grades-view';

export default function Page() {
    return (
        <>
            <title>{`Grades - ${CONFIG.appName}`}</title>
            <GradesView />
        </>
    );
}
