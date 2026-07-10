/**
 * 틈타 (Teumta) - Seeker Pool
 *
 * The real demo seeker ("나") plus a handful of mock seekers, so the employer's
 * auto-match has an actual pool to randomly pick from. Trust score is displayed
 * like Danggeun Market's "매너온도" (manner temperature): starts around 36.5,
 * higher = more trustworthy.
 */

const WEEK_DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const JS_DAY_TO_KOREAN = ['일', '월', '화', '수', '목', '금', '토'];

function todayKoreanDay() {
    return JS_DAY_TO_KOREAN[new Date().getDay()];
}

// dateStr is a "YYYY-MM-DD" string (e.g. from an <input type="date">).
function koreanDayFromDateStr(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return JS_DAY_TO_KOREAN[d.getDay()];
}

// The real seeker's own schedule is edited slot-by-slot (see the day-strip +
// slot-grid UI in seeker/app.js), so it's stored as a set of selected hour
// blocks rather than a single start/end range.
function emptyWeeklyAvailability() {
    const availability = {};
    WEEK_DAYS.forEach(day => {
        availability[day] = { enabled: false, fullDay: false, slots: [] };
    });
    return availability;
}

// Hourly slot labels shown in the availability editor, split into 오전/오후.
const SLOT_HOURS_AM = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00'];
const SLOT_HOURS_PM = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
const SLOT_HOURS_ALL = [...SLOT_HOURS_AM, ...SLOT_HOURS_PM];

function isSeekerAvailable(availability, dayName, gigStart, gigEnd) {
    const day = availability && availability[dayName];
    if (!day || !day.enabled) return false;
    if (day.fullDay) return true;

    if (Array.isArray(day.slots)) {
        const slotSet = new Set(day.slots);
        let cur = timeToMinutes(gigStart);
        const end = timeToMinutes(gigEnd);
        while (cur < end) {
            if (!slotSet.has(minutesToTime(cur))) return false;
            cur += 60;
        }
        return true;
    }

    // Legacy range shape (used by the mock candidate pool).
    return isTimeWithin(day.start, day.end, gigStart, gigEnd);
}

// `count` consecutive dates starting from `baseDate` (today by default), used by the
// day-strip UI so the first tile is always today and swiping right reveals later dates.
// The underlying availability is a recurring weekly pattern (keyed by 월~일), so tiles
// past the first 7 just cycle back to the same weekday buckets with later calendar dates.
function getUpcomingDates(count = 14, baseDate = new Date()) {
    const dates = [];
    for (let i = 0; i < count; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        dates.push(d);
    }
    return dates;
}

// Mock candidate pool: gives the employer's random auto-match something real to draw from.
const MOCK_SEEKERS = [
    {
        id: 'mock-1',
        name: '김민준',
        trustScore: 42.3,
        bio: '카페 홀 서빙 경력 3년차입니다. 손이 빠르고 성실해요!',
        location: '강남구 역삼동',
        availability: {
            월: { enabled: true, fullDay: false, start: '09:00', end: '18:00' },
            화: { enabled: true, fullDay: false, start: '09:00', end: '18:00' },
            수: { enabled: true, fullDay: false, start: '09:00', end: '18:00' },
            목: { enabled: true, fullDay: false, start: '09:00', end: '18:00' },
            금: { enabled: true, fullDay: false, start: '09:00', end: '18:00' },
            토: { enabled: false, fullDay: false, start: '09:00', end: '18:00' },
            일: { enabled: false, fullDay: false, start: '09:00', end: '18:00' }
        }
    },
    {
        id: 'mock-2',
        name: '이서연',
        trustScore: 55.7,
        bio: '주말 풀타임 가능하고 체력 좋습니다. 물류/서빙 다 해봤어요.',
        location: '성동구 성수동',
        availability: {
            월: { enabled: false, fullDay: false, start: '09:00', end: '18:00' },
            화: { enabled: false, fullDay: false, start: '09:00', end: '18:00' },
            수: { enabled: false, fullDay: false, start: '09:00', end: '18:00' },
            목: { enabled: false, fullDay: false, start: '09:00', end: '18:00' },
            금: { enabled: false, fullDay: false, start: '09:00', end: '18:00' },
            토: { enabled: true, fullDay: true, start: '00:00', end: '24:00' },
            일: { enabled: true, fullDay: true, start: '00:00', end: '24:00' }
        }
    },
    {
        id: 'mock-3',
        name: '박지훈',
        trustScore: 33.8,
        bio: '초단기 알바 처음이지만 열심히 하겠습니다!',
        location: '서초구 서초동',
        availability: {
            월: { enabled: true, fullDay: false, start: '11:00', end: '20:00' },
            화: { enabled: true, fullDay: false, start: '11:00', end: '20:00' },
            수: { enabled: false, fullDay: false, start: '09:00', end: '18:00' },
            목: { enabled: true, fullDay: false, start: '11:00', end: '20:00' },
            금: { enabled: true, fullDay: false, start: '11:00', end: '20:00' },
            토: { enabled: true, fullDay: false, start: '11:00', end: '20:00' },
            일: { enabled: false, fullDay: false, start: '09:00', end: '18:00' }
        }
    },
    {
        id: 'mock-4',
        name: '최유나',
        trustScore: 61.2,
        bio: '단골 사장님이 많아요. 지각 한 번 없습니다 :)',
        location: '마포구 서교동',
        availability: {
            월: { enabled: true, fullDay: true, start: '00:00', end: '24:00' },
            화: { enabled: true, fullDay: true, start: '00:00', end: '24:00' },
            수: { enabled: true, fullDay: true, start: '00:00', end: '24:00' },
            목: { enabled: true, fullDay: true, start: '00:00', end: '24:00' },
            금: { enabled: true, fullDay: true, start: '00:00', end: '24:00' },
            토: { enabled: false, fullDay: false, start: '09:00', end: '18:00' },
            일: { enabled: false, fullDay: false, start: '09:00', end: '18:00' }
        }
    }
];

// Returns a color for the trust-temperature bar, Danggeun-manner-style.
function trustColor(score) {
    if (score < 36.5) return '#60A5FA';
    if (score < 45) return '#34D399';
    if (score < 55) return '#FBBF24';
    return '#FB923C';
}
