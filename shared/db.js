/**
 * 틈타 (Teumta) - Shared Data Layer
 *
 * Today this is backed by localStorage + the native `storage` event, so the
 * seeker app and employer app stay in sync as long as they're open in two tabs
 * on the same browser (a real, testable stand-in for "two separate apps talking
 * to each other"). The function names/shapes below are deliberately Firestore-shaped
 * (subscribe/get/set) so swapping the internals for real Firebase later won't
 * require touching seeker/app.js or employer/app.js.
 */

const STORAGE_KEY = 'teumta_mvp_data';
const ME_NAME = '홍길동';

const SAMPLE_GIGS = [
    {
        id: 'gig-1',
        title: '카페 홀 서빙',
        employer: '역삼 스타카페',
        pay: 12000,
        startTime: '11:00',
        endTime: '14:00',
        location: '강남구 역삼동',
        description: '점심 피크 타임 음료 서빙 및 테이블 정리 간단한 보조 업무입니다. 활기차고 밝은 분 환영!',
        status: 'waiting',
        workerName: null,
        workerRating: null,
        workerBio: null,
        workerIsMe: false,
        seekerConfirmed: false,
        employerConfirmed: false
    },
    {
        id: 'gig-2',
        title: '레스토랑 식기세척',
        employer: '도산 파스타키친',
        pay: 13000,
        startTime: '12:00',
        endTime: '15:00',
        location: '서초구 서초동',
        description: '바쁜 점심 시간대 식기 세척 및 주방 보조 업무입니다. 고무장갑 제공, 간단한 식사 제공합니다.',
        status: 'waiting',
        workerName: null,
        workerRating: null,
        workerBio: null,
        workerIsMe: false,
        seekerConfirmed: false,
        employerConfirmed: false
    },
    {
        id: 'gig-3',
        title: '편의점 물류 분류',
        employer: 'GS25 역삼벤처점',
        pay: 11000,
        startTime: '13:00',
        endTime: '15:00',
        location: '강남구 역삼동',
        description: '오후 물류 입고 차량 하차 보조 및 음료 냉장고 진열 업무입니다. 단순 반복 작업입니다.',
        status: 'waiting',
        workerName: null,
        workerRating: null,
        workerBio: null,
        workerIsMe: false
    }
];

function defaultState() {
    return {
        gigs: [...SAMPLE_GIGS],
        // One-time "right now" condition used by the seeker's on-demand instant-match button
        seekerSchedule: {
            startTime: '11:00',
            endTime: '15:00',
            location: '강남구 역삼동',
            jobType: 'all'
        },
        // Persistent recurring weekly availability + profile, used by the employer's random auto-match pool
        seekerProfile: {
            name: ME_NAME,
            bio: '성실하고 책임감 있게 일합니다. 잘 부탁드려요!',
            trustScore: 36.5,
            location: '강남구 역삼동',
            availability: emptyWeeklyAvailability(),
            cancelCount: 0,
            cancelDate: null
        },
        seekerEarnings: 0,
        employerCancelCount: 0,
        employerCancelDate: null
    };
}

// Backfills any fields missing from an older saved schema (e.g. after this file
// adds new state shapes) so existing localStorage data doesn't crash the app.
function withDefaults(state) {
    const defaults = defaultState();
    return {
        ...defaults,
        ...state,
        seekerProfile: { ...defaults.seekerProfile, ...(state.seekerProfile || {}) },
        seekerSchedule: { ...defaults.seekerSchedule, ...(state.seekerSchedule || {}) }
    };
}

function readState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        const initial = defaultState();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
    }
    try {
        return withDefaults(JSON.parse(raw));
    } catch (e) {
        console.error('Failed to parse teumta state, resetting', e);
        const initial = defaultState();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
    }
}

function writeState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Same-tab listeners don't receive the native `storage` event (only other tabs do),
    // so broadcast a matching custom event to keep the current tab's UI in sync too.
    window.dispatchEvent(new CustomEvent('teumta-state-changed'));
}

const db = {
    ME_NAME,

    getState: readState,

    resetToDefault() {
        writeState(defaultState());
    },

    // Fires `callback(state)` immediately, then again whenever the data changes
    // (this tab or another tab/app sharing the same origin).
    subscribe(callback) {
        const fire = () => callback(readState());
        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEY) fire();
        });
        window.addEventListener('teumta-state-changed', fire);
        fire();
    },

    saveSeekerSchedule(schedule) {
        const state = readState();
        state.seekerSchedule = schedule;
        writeState(state);
    },

    saveSeekerAvailability(availability) {
        const state = readState();
        state.seekerProfile.availability = availability;
        writeState(state);
    },

    postGig(gigData) {
        const state = readState();
        const gig = {
            id: 'gig-' + Date.now(),
            dayOfWeek: todayKoreanDay(),
            status: 'waiting',
            workerName: null,
            workerRating: null,
            workerBio: null,
            workerIsMe: false,
            seekerConfirmed: false,
            employerConfirmed: false,
            ...gigData
        };
        state.gigs.push(gig);
        writeState(state);
        return gig;
    },

    // Direct assignment used by: seeker's own instant-match, quick-apply, and the
    // employer's random auto-match (which decides *who* gets picked beforehand).
    assignGig(gigId, worker) {
        const state = readState();
        const gig = state.gigs.find(g => g.id === gigId);
        if (!gig) return null;
        gig.status = 'matched';
        gig.workerName = worker.name;
        gig.workerRating = worker.trustScore;
        gig.workerBio = worker.bio || null;
        gig.workerIsMe = worker.name === ME_NAME;
        gig.matchedAt = Date.now();
        // A fresh match always starts out unconfirmed on both sides.
        gig.seekerConfirmed = false;
        gig.employerConfirmed = false;
        writeState(state);
        return gig;
    },

    confirmBySeeker(gigId) {
        const state = readState();
        const gig = state.gigs.find(g => g.id === gigId);
        if (!gig) return null;
        gig.seekerConfirmed = true;
        writeState(state);
        return gig;
    },

    confirmByEmployer(gigId) {
        const state = readState();
        const gig = state.gigs.find(g => g.id === gigId);
        if (!gig) return null;
        gig.employerConfirmed = true;
        writeState(state);
        return gig;
    },

    // Seeker cancels their own matched shift (only allowed before the 1hr-before cutoff
    // and under the daily limit; those rules are enforced in the UI layer, not here).
    // Gig goes back to the open pool.
    cancelBySeeker(gigId) {
        const state = readState();
        const gig = state.gigs.find(g => g.id === gigId);
        if (!gig) return null;
        gig.status = 'waiting';
        gig.workerName = null;
        gig.workerRating = null;
        gig.workerBio = null;
        gig.workerIsMe = false;
        gig.seekerConfirmed = false;
        writeState(state);
        return gig;
    },

    // Returns { count, limit, canCancel } for the seeker's cancellations today.
    getSeekerCancelStatus() {
        const state = readState();
        const today = todayDateStr();
        const count = state.seekerProfile.cancelDate === today ? (state.seekerProfile.cancelCount || 0) : 0;
        return { count, limit: SEEKER_DAILY_CANCEL_LIMIT, canCancel: count < SEEKER_DAILY_CANCEL_LIMIT };
    },

    incrementSeekerCancelCount() {
        const state = readState();
        const today = todayDateStr();
        if (state.seekerProfile.cancelDate !== today) {
            state.seekerProfile.cancelDate = today;
            state.seekerProfile.cancelCount = 0;
        }
        state.seekerProfile.cancelCount += 1;
        writeState(state);
    },

    // Returns { count, limit, canCancel } for the employer's free (pre-confirmation) cancellations today.
    getEmployerCancelStatus() {
        const state = readState();
        const today = todayDateStr();
        const count = state.employerCancelDate === today ? (state.employerCancelCount || 0) : 0;
        return { count, limit: EMPLOYER_DAILY_CANCEL_LIMIT, canCancel: count < EMPLOYER_DAILY_CANCEL_LIMIT };
    },

    incrementEmployerCancelCount() {
        const state = readState();
        const today = todayDateStr();
        if (state.employerCancelDate !== today) {
            state.employerCancelDate = today;
            state.employerCancelCount = 0;
        }
        state.employerCancelCount += 1;
        writeState(state);
    },

    // Employer cancels a posted/matched gig outright (penalty, if any, is computed in the UI layer).
    cancelByEmployer(gigId) {
        const state = readState();
        const idx = state.gigs.findIndex(g => g.id === gigId);
        if (idx === -1) return null;
        const gig = state.gigs[idx];
        state.gigs.splice(idx, 1);
        writeState(state);
        return gig;
    },

    startWork(gigId) {
        const state = readState();
        const gig = state.gigs.find(g => g.id === gigId);
        if (!gig) return;
        gig.status = 'working';
        writeState(state);
    },

    endWork(gigId) {
        const state = readState();
        const gig = state.gigs.find(g => g.id === gigId);
        if (!gig) return;
        gig.status = 'done';
        writeState(state);
    },

    approvePayment(gigId) {
        const state = readState();
        const idx = state.gigs.findIndex(g => g.id === gigId);
        if (idx === -1) return null;
        const gig = state.gigs[idx];
        state.gigs.splice(idx, 1);
        writeState(state);
        return gig;
    },

    addEarnings(amount) {
        const state = readState();
        state.seekerEarnings += amount;
        writeState(state);
    }
};
