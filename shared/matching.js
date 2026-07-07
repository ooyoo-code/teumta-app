/**
 * 틈타 (Teumta) - Shared Matching Engine
 * Pure functions only: no DOM, no storage. Used by both the seeker app and the employer app.
 */

// Real Seoul neighborhood coordinates (lat/lng) for the fixed location options.
// Swap this for live geocoding (e.g. Kakao Local API) once seekers/employers can enter free-form addresses.
const LOCATIONS = {
    '강남구 역삼동': { lat: 37.5006, lng: 127.0364 },
    '서초구 서초동': { lat: 37.4837, lng: 127.0324 },
    '마포구 서교동': { lat: 37.5531, lng: 126.9151 },
    '성동구 성수동': { lat: 37.5445, lng: 127.0559 }
};

const DEFAULT_MATCH_RADIUS_KM = 5;

// Haversine formula: great-circle distance between two lat/lng points, in km.
function haversineDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function getDistanceKm(locationNameA, locationNameB) {
    const a = LOCATIONS[locationNameA];
    const b = LOCATIONS[locationNameB];
    if (!a || !b) return null;
    return haversineDistanceKm(a.lat, a.lng, b.lat, b.lng);
}

// Formats: "09:00", "13:00" etc. Seeker can work if their available window covers the whole gig window.
function isTimeWithin(seekerStart, seekerEnd, gigStart, gigEnd) {
    const [sStartH, sStartM] = seekerStart.split(':').map(Number);
    const [sEndH, sEndM] = seekerEnd.split(':').map(Number);
    const [gStartH, gStartM] = gigStart.split(':').map(Number);
    const [gEndH, gEndM] = gigEnd.split(':').map(Number);

    const sStart = sStartH * 60 + sStartM;
    const sEnd = sEndH * 60 + sEndM;
    const gStart = gStartH * 60 + gStartM;
    const gEnd = gEndH * 60 + gEndM;

    return (sStart <= gStart) && (sEnd >= gEnd);
}

function isJobTypeMatch(jobType, gigTitle) {
    return jobType === 'all' || jobType === gigTitle;
}

// "7/8(수) 12:00 ~ 15:00" when the gig carries a date, otherwise just the time range
// (older/mock data that predates the date field).
function formatGigSchedule(gig) {
    if (gig.date) {
        const [, m, d] = gig.date.split('-');
        return `${parseInt(m, 10)}/${parseInt(d, 10)}(${gig.dayOfWeek}) ${gig.startTime} ~ ${gig.endTime}`;
    }
    return `${gig.startTime} ~ ${gig.endTime}`;
}

function calculateHours(startTime, endTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM - (startH * 60 + startM)) / 60;
}

// Find gigs that satisfy a seeker condition (time / job type / distance radius), status must be 'waiting'.
// Returns matches sorted by distance (closest first), each annotated with distanceKm.
function findMatchingGigs(gigs, condition, maxRadiusKm = DEFAULT_MATCH_RADIUS_KM) {
    return gigs
        .filter(gig => gig.status === 'waiting')
        .map(gig => ({ gig, distanceKm: getDistanceKm(condition.location, gig.location) }))
        .filter(({ gig, distanceKm }) => {
            if (distanceKm === null || distanceKm > maxRadiusKm) return false;
            if (!isTimeWithin(condition.startTime, condition.endTime, gig.startTime, gig.endTime)) return false;
            if (!isJobTypeMatch(condition.jobType, gig.title)) return false;
            return true;
        })
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .map(({ gig, distanceKm }) => ({ ...gig, distanceKm }));
}

// --- Employer-side auto-match: random pick among seekers whose registered weekly
// availability covers the gig's day/time (and who are within the match radius). ---
function findEligibleSeekers(candidates, dayName, gig, maxRadiusKm = DEFAULT_MATCH_RADIUS_KM) {
    return candidates
        .filter(seeker => isSeekerAvailable(seeker.availability, dayName, gig.startTime, gig.endTime))
        .map(seeker => ({ seeker, distanceKm: getDistanceKm(seeker.location, gig.location) }))
        .filter(({ distanceKm }) => distanceKm !== null && distanceKm <= maxRadiusKm)
        .map(({ seeker, distanceKm }) => ({ ...seeker, distanceKm }));
}

function pickRandom(list) {
    if (!list || list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
}

// --- Cancellation cutoff / penalty rules ---
// Shifts are always "today" in this MVP (no date picker yet), so the cutoff is
// computed against the real current time on the day's HH:MM.
const CANCEL_CUTOFF_HOURS = 1;
const PENALTY_RATE = 0.3;       // 30% of the shift's total pay
const PENALTY_SEEKER_SHARE = 0.5; // seeker keeps half the penalty, platform keeps the other half

// `gig.date` is a "YYYY-MM-DD" string; falls back to today for any older data that predates it.
function shiftStartDate(gig) {
    const [h, m] = gig.startTime.split(':').map(Number);
    const d = gig.date ? new Date(gig.date + 'T00:00:00') : new Date();
    d.setHours(h, m, 0, 0);
    return d;
}

function isPastCancelCutoff(gig, cutoffHours = CANCEL_CUTOFF_HOURS) {
    const cutoff = new Date(shiftStartDate(gig).getTime() - cutoffHours * 60 * 60 * 1000);
    return new Date() >= cutoff;
}

function calculatePenalty(gig) {
    const total = gig.pay * calculateHours(gig.startTime, gig.endTime);
    const penalty = Math.round(total * PENALTY_RATE);
    const seekerShare = Math.round(penalty * PENALTY_SEEKER_SHARE);
    const platformShare = penalty - seekerShare;
    return { penalty, seekerShare, platformShare };
}
