// src/_mock/_attendance.ts

export const _attendance = Array.from({ length: 50 }, (_, i) => {
    const id = i + 1;
    const date = new Date(2025, 9, id); // October 2025
    const pad = (n: number) => n.toString().padStart(2, '0');

    // Random time generator helper
    const randomTime = (startHour: number, endHour: number) => {
        const hour = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
        const minute = Math.floor(Math.random() * 60);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${pad(displayHour)}:${pad(minute)} ${ampm}`;
    };

    // Random terminal
    const kiosks = ['Terminal A', 'Terminal B', 'Terminal C', 'Terminal D'];

    return {
        id,
        date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        timeIn: randomTime(7, 10),
        kioskIn: kiosks[Math.floor(Math.random() * kiosks.length)],
        timeOut: randomTime(16, 19),
        kioskOut: kiosks[Math.floor(Math.random() * kiosks.length)],
    };
});

