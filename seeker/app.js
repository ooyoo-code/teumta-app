/**
 * 틈타 (Teumta) - Seeker App Logic
 * Data comes from ../shared/db.js. Matching math from ../shared/matching.js.
 * Seeker pool / weekly-availability helpers from ../shared/seekers.js.
 */

// --- Toast Alert Helper ---
function showToast(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '<i class="fa-solid fa-bell"></i>';
    if (type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
    else if (type === 'employer') icon = '<i class="fa-solid fa-briefcase"></i>';

    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            ${icon}
            <span>${message}</span>
        </div>
        <button class="toast-close">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.4s forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4500);
}

// --- AI Matching Hero Stage Machine (idle / searching / result) ---
function setHeroStage(stage) {
    const idle = document.getElementById('seeker-hero-idle');
    const searching = document.getElementById('seeker-hero-searching');
    const result = document.getElementById('seeker-hero-result');

    [idle, searching, result].forEach(el => el.classList.remove('active'));
    if (stage === 'idle') idle.classList.add('active');
    if (stage === 'searching') searching.classList.add('active');
    if (stage === 'result') result.classList.add('active');
}

window.resetSeekerHero = function() {
    setHeroStage('idle');
};

function renderHeroResult(state) {
    const panel = document.getElementById('seeker-hero-result');
    const lastMatched = [...state.gigs].reverse().find(g => g.workerIsMe && g.status === 'matched');

    if (!lastMatched) {
        setHeroStage('idle');
        return;
    }

    panel.innerHTML = `
        <div class="result-card">
            <span class="result-badge success"><i class="fa-solid fa-circle-check"></i> 매칭 성공</span>
            <div class="result-headline">${lastMatched.title} 매칭 완료!</div>
            <p class="result-sub">면접 없이 즉시 확정되었어요. 근무 시작 1시간 전까지는 취소할 수 있어요.</p>
            <div class="result-job-card">
                <div class="job-header">
                    <div class="job-badge-area">
                        <span class="job-title">${lastMatched.title}</span>
                        <span class="job-employer">${lastMatched.employer}</span>
                    </div>
                    <div class="pay-badge"><i class="fa-solid fa-coins"></i> 시급 ${lastMatched.pay.toLocaleString()}원</div>
                </div>
                <div class="detail-item"><i class="fa-solid fa-clock"></i> ${lastMatched.startTime} ~ ${lastMatched.endTime}</div>
                <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${lastMatched.location}</div>
            </div>
            <div class="result-actions">
                <button class="btn-hero-primary" onclick="resetSeekerHero()"><i class="fa-solid fa-bolt"></i> 다른 조건으로 다시 매칭</button>
            </div>
        </div>
    `;
    setHeroStage('result');
}

// --- Notify once per newly-created match (covers matches made by the employer's auto-match too) ---
let notifiedMatchIds = null;
function checkForNewMatches(state) {
    const currentIds = new Set(state.gigs.filter(g => g.workerIsMe && g.status === 'matched').map(g => g.id));
    if (notifiedMatchIds === null) {
        notifiedMatchIds = currentIds; // seed silently on first load, don't notify for pre-existing matches
        return;
    }
    currentIds.forEach(id => {
        if (!notifiedMatchIds.has(id)) {
            const gig = state.gigs.find(g => g.id === id);
            showToast(`🎉 '${gig.title}' 알바에 매칭되었습니다! 근무 시작 1시간 전까지는 취소할 수 있어요.`, 'success');
        }
    });
    notifiedMatchIds = currentIds;
}

// --- Availability Editor: day-strip + hourly slot-grid ---
// Used for both the persistent "main" card and the one-time "onboarding" step.
// Each instance keeps its own working-copy draft in editorState, independent
// of the render(state) loop (so mid-edit taps never get overwritten).
const editorState = {};

function initAvailabilityEditor(prefix, availability) {
    editorState[prefix] = {
        draft: JSON.parse(JSON.stringify(availability)),
        selectedDay: todayKoreanDay()
    };
    renderDayStrip(prefix);
    renderSlotGrid(prefix);
}

function renderDayStrip(prefix) {
    const editor = editorState[prefix];
    const container = document.getElementById(`${prefix}-day-strip`);
    const dates = getWeekDates();

    container.innerHTML = WEEK_DAYS.map((day, i) => {
        const hasSlots = editor.draft[day] && editor.draft[day].enabled;
        const isSelected = editor.selectedDay === day;
        return `
            <button type="button" class="day-tile ${isSelected ? 'selected' : ''} ${hasSlots ? 'has-slots' : ''}" data-day="${day}">
                <span class="day-tile-name">${day}</span>
                <span class="day-tile-date">${dates[i].getDate()}</span>
            </button>
        `;
    }).join('');

    container.querySelectorAll('.day-tile').forEach(btn => {
        btn.addEventListener('click', () => {
            editor.selectedDay = btn.dataset.day;
            renderDayStrip(prefix);
            renderSlotGrid(prefix);
        });
    });
}

function renderSlotGrid(prefix) {
    const editor = editorState[prefix];
    const container = document.getElementById(`${prefix}-slot-grid`);
    const day = editor.draft[editor.selectedDay];
    const slotSet = new Set(day.slots || []);

    const chip = (t) => `<button type="button" class="slot-chip ${(slotSet.has(t) || day.fullDay) ? 'selected' : ''}" data-time="${t}">${t}</button>`;

    container.innerHTML = `
        <div class="slot-grid-header">
            <span class="slot-grid-daylabel">${editor.selectedDay}요일</span>
            <label class="fullday-toggle">
                <input type="checkbox" class="slot-fullday" ${day.fullDay ? 'checked' : ''}> 하루 종일 가능
            </label>
        </div>
        <div class="slot-section-label">오전</div>
        <div class="slot-row">${SLOT_HOURS_AM.map(chip).join('')}</div>
        <div class="slot-section-label">오후</div>
        <div class="slot-row">${SLOT_HOURS_PM.map(chip).join('')}</div>
    `;

    container.querySelector('.slot-fullday').addEventListener('change', (e) => {
        day.fullDay = e.target.checked;
        day.enabled = day.fullDay || day.slots.length > 0;
        renderSlotGrid(prefix);
        renderDayStrip(prefix);
    });

    container.querySelectorAll('.slot-chip').forEach(chipEl => {
        chipEl.addEventListener('click', () => {
            if (day.fullDay) return;
            const t = chipEl.dataset.time;
            const idx = day.slots.indexOf(t);
            if (idx === -1) day.slots.push(t); else day.slots.splice(idx, 1);
            day.enabled = day.slots.length > 0;
            renderSlotGrid(prefix);
            renderDayStrip(prefix);
        });
    });
}

document.getElementById('btn-save-availability').addEventListener('click', () => {
    db.saveSeekerAvailability(editorState.main.draft);
    showToast('정기 근무 가능 시간이 저장되었습니다. 조건에 맞는 긴급 구인이 등록되면 자동 매칭 후보가 돼요.', 'success');
});

// --- First-launch Onboarding: video splash -> intro cards -> availability setup ---
const ONBOARDING_KEY = 'teumta_onboarding_done';

function startSplashSequence() {
    const splash = document.getElementById('splash-screen');
    const video = document.getElementById('splash-video');

    let advanced = false;
    function advance() {
        if (advanced) return;
        advanced = true;
        splash.classList.remove('active');
        document.getElementById('onboarding-cards').classList.add('active');
    }

    // Move on as soon as the clip finishes; fall back to a timer in case
    // autoplay is blocked or the video fails to load.
    video.addEventListener('ended', advance);
    video.addEventListener('error', advance);
    setTimeout(advance, 8000);

    const playPromise = video.play();
    if (playPromise) playPromise.catch(() => {}); // autoplay can be blocked; the fallback timer still advances
}

function initOnboardingCards() {
    const track = document.getElementById('onboarding-track');
    const dots = document.querySelectorAll('#onboarding-dots .dot');
    const nextBtn = document.getElementById('btn-onboarding-next');
    const cardCount = track.children.length;
    let index = 0;

    function updateControls() {
        dots.forEach((d, di) => d.classList.toggle('active', di === index));
        nextBtn.textContent = index === cardCount - 1 ? '시작하기' : '다음';
    }

    function goTo(i) {
        index = Math.max(0, Math.min(cardCount - 1, i));
        track.scrollTo({ left: track.clientWidth * index, behavior: 'smooth' });
        updateControls();
    }

    track.addEventListener('scroll', () => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== index) { index = i; updateControls(); }
    });

    nextBtn.addEventListener('click', () => {
        if (index < cardCount - 1) {
            goTo(index + 1);
            return;
        }
        document.getElementById('onboarding-cards').classList.remove('active');
        document.getElementById('onboarding-availability-step').classList.add('active');
        initAvailabilityEditor('onboarding', db.getState().seekerProfile.availability);
    });
}

document.getElementById('btn-onboarding-finish').addEventListener('click', () => {
    db.saveSeekerAvailability(editorState.onboarding.draft);
    localStorage.setItem(ONBOARDING_KEY, '1');
    document.getElementById('onboarding-overlay').remove();
    initAvailabilityEditor('main', db.getState().seekerProfile.availability);
    showToast('근무 가능 시간이 등록되었습니다. 틈타를 시작해보세요!', 'success');
});

// --- Render ---
function render(state) {
    checkForNewMatches(state);

    document.getElementById('seeker-earnings').textContent = state.seekerEarnings.toLocaleString();

    document.getElementById('seeker-start-time').value = state.seekerSchedule.startTime;
    document.getElementById('seeker-end-time').value = state.seekerSchedule.endTime;
    document.getElementById('seeker-location').value = state.seekerSchedule.location;
    document.getElementById('seeker-job-type').value = state.seekerSchedule.jobType;
    if (state.seekerSchedule.radiusKm) {
        document.getElementById('seeker-radius').value = String(state.seekerSchedule.radiusKm);
    }

    renderHeroResult(state);

    // My active / finished gigs
    const activeList = document.getElementById('seeker-active-list');
    const myGigs = state.gigs.filter(g => g.workerIsMe);

    if (myGigs.length === 0) {
        activeList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar-minus"></i>
                <p>현재 매칭되었거나 근무 완료한 일정이 없습니다.</p>
            </div>
        `;
    } else {
        activeList.innerHTML = myGigs.map(gig => {
            let statusLabel = '';
            let actionBtn = '';
            let cancelBtn = '';

            if (gig.status === 'matched') {
                statusLabel = `<span class="status-tag status-matched"><i class="fa-solid fa-handshake"></i> 매칭완료</span>`;
                actionBtn = `<button class="btn-action-green" onclick="handleStartWork('${gig.id}')"><i class="fa-solid fa-play"></i> 출근 체크</button>`;
                if (isPastCancelCutoff(gig)) {
                    cancelBtn = `<span class="detail-item cancel-locked-note"><i class="fa-solid fa-lock"></i> 출근 1시간 전이라 취소할 수 없어요</span>`;
                } else {
                    cancelBtn = `<button class="btn-cancel-teumta" onclick="handleSeekerCancel('${gig.id}')">틈타 취소</button>`;
                }
            } else if (gig.status === 'working') {
                statusLabel = `<span class="status-tag status-working"><i class="fa-solid fa-person-digging"></i> 근무중</span>`;
                actionBtn = `<button class="btn-action-green" onclick="handleEndWork('${gig.id}')"><i class="fa-solid fa-stop"></i> 퇴근 체크</button>`;
            } else if (gig.status === 'done') {
                statusLabel = `<span class="status-tag status-done"><i class="fa-solid fa-circle-check"></i> 정산완료 (+${(gig.pay * calculateHours(gig.startTime, gig.endTime)).toLocaleString()}원)</span>`;
                actionBtn = `<span class="detail-item" style="color: #067A55; font-weight: 600; font-size:12px; margin-left:auto;"><i class="fa-solid fa-wallet"></i> 계좌 입금 완료</span>`;
            }

            return `
                <div class="job-card">
                    <div class="job-header">
                        <div class="job-badge-area">
                            <span class="job-title">${gig.title}</span>
                            <span class="job-employer">${gig.employer}</span>
                        </div>
                        <div class="pay-badge"><i class="fa-solid fa-coins"></i> 시급 ${gig.pay.toLocaleString()}원</div>
                    </div>
                    <div class="job-details">
                        <div class="detail-item"><i class="fa-solid fa-clock"></i> ${formatGigSchedule(gig)} (${calculateHours(gig.startTime, gig.endTime)}시간)</div>
                        <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${gig.location}</div>
                    </div>
                    <div class="job-footer" style="align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top:10px;">
                        ${statusLabel}
                        ${actionBtn}
                    </div>
                    ${cancelBtn ? `<div class="job-footer">${cancelBtn}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    // Recommended gigs: real distance-radius + time + job-type match, closest first
    const recommendedList = document.getElementById('seeker-job-list');
    const radiusKm = Number(document.getElementById('seeker-radius').value);
    const matches = findMatchingGigs(state.gigs, state.seekerSchedule, radiusKm);

    if (matches.length === 0) {
        recommendedList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-magnifying-glass-chart"></i>
                <p>일치하는 틈새 알바가 없습니다.<br>매칭 반경 또는 가능 스케줄을 늘려보세요!</p>
            </div>
        `;
    } else {
        recommendedList.innerHTML = matches.map(gig => `
            <div class="job-card">
                <div class="job-header">
                    <div class="job-badge-area">
                        <span class="job-title">${gig.title}</span>
                        <span class="job-employer">${gig.employer} · ${gig.distanceKm.toFixed(1)}km</span>
                    </div>
                    <div class="pay-badge"><i class="fa-solid fa-coins"></i> 시급 ${gig.pay.toLocaleString()}원</div>
                </div>
                <div class="job-details">
                    <div class="detail-item"><i class="fa-solid fa-clock"></i> ${formatGigSchedule(gig)} (${calculateHours(gig.startTime, gig.endTime)}시간)</div>
                    <div class="detail-item"><i class="fa-solid fa-route"></i> 내 위치에서 ${gig.distanceKm.toFixed(1)}km</div>
                </div>
                <p class="job-desc">${gig.description}</p>
                <div class="job-footer">
                    <button class="btn-quick-apply" onclick="handleQuickApply('${gig.id}')">
                        <i class="fa-solid fa-bolt"></i> 1초만에 바로 매칭 (면접없음)
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// --- Actions ---
document.getElementById('btn-realtime-match').addEventListener('click', () => {
    const startTime = document.getElementById('seeker-start-time').value;
    const endTime = document.getElementById('seeker-end-time').value;
    const location = document.getElementById('seeker-location').value;
    const jobType = document.getElementById('seeker-job-type').value;
    const radiusKm = Number(document.getElementById('seeker-radius').value);

    const [startH] = startTime.split(':').map(Number);
    const [endH] = endTime.split(':').map(Number);
    if (startH >= endH) {
        showToast('종료 시간은 시작 시간보다 늦어야 합니다.', 'toast');
        return;
    }

    const condition = { startTime, endTime, location, jobType, radiusKm };
    db.saveSeekerSchedule(condition);

    setHeroStage('searching');

    setTimeout(() => {
        const state = db.getState();
        const candidates = findMatchingGigs(state.gigs, condition, radiusKm);

        if (candidates.length > 0) {
            const top = candidates.slice(0, 2).sort((a, b) => b.pay - a.pay)[0];
            db.assignGig(top.id, { name: db.ME_NAME, trustScore: state.seekerProfile.trustScore, bio: state.seekerProfile.bio });
            showToast(`⚡ 실시간 매칭 성공! '${top.title}' (${top.employer}, ${top.distanceKm.toFixed(1)}km) 근무가 면접 없이 즉시 확정되었습니다.`, 'success');
        } else {
            showToast('지금 당장 매칭 가능한 일자리가 없어요. 정기 근무 가능 시간을 등록해두시면, 나중에 조건에 맞는 구인이 올라올 때 자동으로 매칭 후보가 됩니다!', 'info');
            setHeroStage('idle');
        }
    }, 1400);
});

window.handleQuickApply = function(gigId) {
    const state = db.getState();
    db.assignGig(gigId, { name: db.ME_NAME, trustScore: state.seekerProfile.trustScore, bio: state.seekerProfile.bio });
    showToast('축하합니다! 틈새 알바가 즉시 매칭되었습니다. 면접 없이 확정되었습니다.', 'success');
};

window.handleStartWork = function(gigId) {
    db.startWork(gigId);
    showToast('출근 도장이 찍혔습니다! 사장님께 근무 시작이 전달됩니다.', 'info');
};

window.handleEndWork = function(gigId) {
    db.endWork(gigId);
    showToast('퇴근 도장이 찍혔습니다. 사장님 승인 후 정산됩니다.', 'info');
};

// Seeker-initiated cancel: only allowed before the 1hr-before-shift cutoff.
// Per spec, cancelling immediately frees the slot up for another candidate.
window.handleSeekerCancel = function(gigId) {
    const state = db.getState();
    const gig = state.gigs.find(g => g.id === gigId);
    if (!gig) return;

    if (isPastCancelCutoff(gig)) {
        showToast('출근 1시간 전에는 취소할 수 없습니다.', 'info');
        return;
    }
    if (!confirm('정말 이 근무를 취소하시겠습니까? 취소하면 다른 구직자에게 자리가 넘어갑니다.')) return;

    db.cancelBySeeker(gigId);
    showToast('매칭이 취소되었습니다. 다른 구직자를 찾는 중이에요...', 'info');

    // Re-run auto-match among the mock pool (the cancelling seeker is naturally excluded).
    setTimeout(() => {
        const freshGig = db.getState().gigs.find(g => g.id === gigId);
        if (!freshGig || freshGig.status !== 'waiting') return;
        const eligible = findEligibleSeekers(MOCK_SEEKERS, freshGig.dayOfWeek, freshGig);
        const picked = pickRandom(eligible);
        if (picked) db.assignGig(gigId, picked);
    }, 1200);
};

// --- Simulator Utilities ---
function initSimulator() {
    const toggleBtn = document.getElementById('btn-toggle-sim');
    const simBody = document.getElementById('sim-body');

    toggleBtn.addEventListener('click', () => {
        simBody.classList.toggle('active');
        toggleBtn.classList.toggle('rotated');
    });

    document.getElementById('btn-sim-reset').addEventListener('click', () => {
        if (confirm('모든 데이터를 초기화하시겠습니까? (구직자/사장님 앱 양쪽 모두 초기화되고, 첫 실행 온보딩도 다시 보여집니다)')) {
            db.resetToDefault();
            localStorage.removeItem(ONBOARDING_KEY);
            location.reload();
        }
    });

    document.getElementById('btn-sim-add-jobs').addEventListener('click', () => {
        db.postGig({ title: '레스토랑 식기세척', employer: '도산 파스타키친', pay: 13000, startTime: '12:00', endTime: '15:00', location: '서초구 서초동', description: '바쁜 점심 시간대 식기 세척 및 주방 보조 업무입니다.' });
        db.postGig({ title: '행사 주차 안내', employer: '코엑스 모빌리티', pay: 14000, startTime: '11:00', endTime: '15:00', location: '강남구 역삼동', description: '오전 야외 이벤트 주차 차선 정리 및 고객 안내 데스크 보조입니다.' });
        db.postGig({ title: '바리스타 보조', employer: '블루보틀 성수', pay: 12500, startTime: '13:00', endTime: '17:00', location: '성동구 성수동', description: '러시 아워에 가벼운 컵 정리, 원두 소분, 바 테이블 위생 정리 보조.' });
        showToast('새로운 가상 구인 공고 3개가 생성되었습니다!', 'success');
    });
}

// --- Helper ---
function calculateHours(startTime, endTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM - (startH * 60 + startM)) / 60;
}

// --- App Entrypoint ---
window.addEventListener('DOMContentLoaded', () => {
    initSimulator();
    initAvailabilityEditor('main', db.getState().seekerProfile.availability);

    if (localStorage.getItem(ONBOARDING_KEY)) {
        document.getElementById('onboarding-overlay').remove();
    } else {
        startSplashSequence();
        initOnboardingCards();
    }

    db.subscribe(render);
});
