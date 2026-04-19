import { useEffect, useState } from 'react';
import { OtpView } from 'src/sections/authentication/otp/otp-auth';
import { CONFIG } from 'src/config-global';
import { useRouter } from 'src/routes/hooks';

export default function Page() {
    const router = useRouter();
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        const storedUsername = sessionStorage.getItem('otpUsername');
        if (!storedUsername) {
            // Redirect to login if username missing
            router.replace('/login');
        } else {
            setUsername(storedUsername);
        }
    }, [router]);

    if (!username) return null; // nothing rendered while redirecting

    return (
        <>
            <title>{`OTP - ${CONFIG.appName}`}</title>
            <OtpView username={username} />
        </>
    );
}
