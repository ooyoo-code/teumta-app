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
        workerRating: null
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
        workerRating: null
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
        workerRating: null
    }
];

function defaultState() {
    return {
        gigs: [...SAMPLE_GIGS],
        seekerSchedule: {
            startTime: '11:00',
            endTime: '15:00',
            location: '강남구 역삼동',
            jobType: 'all'
        },
        seekerReservation: null,
        seekerEarnings: 0
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
        return JSON.parse(raw);
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

    setReservation(condition) {
        const state = readState();
        state.seekerReservation = { ...condition, createdAt: Date.now() };
        writeState(state);
    },

    clearReservation() {
        const state = readState();
        state.seekerReservation = null;
        writeState(state);
    },

    postGig(gigData) {
        const state = readState();
        const gig = {
            id: 'gig-' + Date.now(),
            status: 'waiting',
            workerName: null,
            workerRating: null,
            ...gigData
        };
        state.gigs.push(gig);
        writeState(state);
        return gig;
    },

    matchGig(gigId, workerName = '홍길동', workerRating = 4.9) {
        const state = readState();
        const gig = state.gigs.find(g => g.id === gigId);
        if (!gig) return null;
        gig.status = 'matched';
        gig.workerName = workerName;
        gig.workerRating = workerRating;
        state.seekerReservation = null;
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
