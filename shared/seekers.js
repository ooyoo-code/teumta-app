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

function emptyWeeklyAvailability() {
    const availability = {};
    WEEK_DAYS.forEach(day => {
        availability[day] = { enabled: false, fullDay: false, start: '09:00', end: '18:00' };
    });
    return availability;
}

function isSeekerAvailable(availability, dayName, gigStart, gigEnd) {
    const day = availability && availability[dayName];
    if (!day || !day.enabled) return false;
    if (day.fullDay) return true;
    return isTimeWithin(day.start, day.end, gigStart, gigEnd);
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
