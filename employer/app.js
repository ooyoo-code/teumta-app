/**
 * 틈타 (Teumta) - Employer App Logic
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
    const idle = document.getElementById('employer-hero-idle');
    const searching = document.getElementById('employer-hero-searching');
    const result = document.getElementById('employer-hero-result');

    [idle, searching, result].forEach(el => el.classList.remove('active'));
    if (stage === 'idle') idle.classList.add('active');
    if (stage === 'searching') searching.classList.add('active');
    if (stage === 'result') result.classList.add('active');
}

window.resetEmployerHero = function() {
    setHeroStage('idle');
};

// Trust score shown like Danggeun Market's manner temperature.
function trustBarHtml(trustScore) {
    const pct = Math.min(100, Math.max(0, trustScore));
    const color = trustColor(trustScore);
    return `
        <div class="trust-bar-wrap">
            <div class="trust-bar-track"><div class="trust-bar-fill" style="width:${pct}%; background:${color};"></div></div>
            <span class="trust-bar-label" style="color:${color};"><i class="fa-solid fa-temperature-half"></i> ${trustScore.toFixed(1)}°C</span>
        </div>
    `;
}

// Random auto-match: pool = mock seekers + "me" (if my own registered weekly
// availability covers this gig's day/time), filtered by availability + radius.
function runAutoMatch(gig) {
    const state = db.getState();
    const pool = [...MOCK_SEEKERS, {
        name: state.seekerProfile.name,
        trustScore: state.seekerProfile.trustScore,
        bio: state.seekerProfile.bio,
        location: state.seekerProfile.location,
        availability: state.seekerProfile.availability
    }];
    const eligible = findEligibleSeekers(pool, gig.dayOfWeek, gig);
    const picked = pickRandom(eligible);
    if (picked) db.assignGig(gig.id, picked);
    return picked;
}

function renderHeroResult(gigId) {
    const panel = document.getElementById('employer-hero-result');
    const gig = db.getState().gigs.find(g => g.id === gigId);
    if (!gig) {
        setHeroStage('idle');
        return;
    }

    if (gig.status === 'matched') {
        panel.innerHTML = `
            <div class="result-card">
                <span class="result-badge success"><i class="fa-solid fa-circle-check"></i> 매칭 성공</span>
                <div class="result-headline">${gig.workerName}님이 매칭되었어요!</div>
                <p class="result-sub">등록된 근무 가능 시간이 맞는 구직자 중 랜덤으로 배정되었어요.</p>
                <div class="result-job-card">
                    <div class="worker-profile-mini">
                        <div class="worker-info-mini">
                            <span class="worker-name-mini">${gig.workerName}</span>
                        </div>
                        <span class="detail-item">${gig.title}</span>
                    </div>
                    ${trustBarHtml(gig.workerRating)}
                    ${gig.workerBio ? `<p class="job-desc">${gig.workerBio}</p>` : ''}
                    <div class="detail-item"><i class="fa-solid fa-clock"></i> ${formatGigSchedule(gig)}</div>
                    <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${gig.location}</div>
                </div>
                <div class="result-actions">
                    <button class="btn-hero-primary employer-cta" onclick="resetEmployerHero()"><i class="fa-solid fa-plus"></i> 새 구인 등록하기</button>
                </div>
            </div>
        `;
    } else {
        panel.innerHTML = `
            <div class="result-card">
                <span class="result-badge pending"><i class="fa-solid fa-hourglass-half"></i> 매칭 대기 중</span>
                <div class="result-headline">등록 완료! 아직 조건에 맞는 인재가 없어요</div>
                <p class="result-sub">근무 가능 시간을 등록해둔 구직자 중 조건에 맞는 분이 없었어요. 나중에 구직자가 실시간 매칭을 시도하면 자동으로 연결됩니다.</p>
                <div class="result-job-card pending-card">
                    <div class="job-header">
                        <div class="job-badge-area">
                            <span class="job-title">${gig.title}</span>
                        </div>
                        <div class="pay-badge"><i class="fa-solid fa-coins"></i> 시급 ${gig.pay.toLocaleString()}원</div>
                    </div>
                    <div class="detail-item"><i class="fa-solid fa-clock"></i> ${formatGigSchedule(gig)}</div>
                    <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${gig.location}</div>
                </div>
                <div class="result-actions">
                    <button class="btn-hero-primary employer-cta" onclick="resetEmployerHero()"><i class="fa-solid fa-plus"></i> 새 구인 등록하기</button>
                </div>
            </div>
        `;
    }
    setHeroStage('result');
}

// --- Render ---
function render(state) {
    const myPosted = state.gigs.length;
    const myMatched = state.gigs.filter(g => g.status !== 'waiting').length;

    document.getElementById('employer-active-gigs').textContent = myPosted;
    document.getElementById('employer-matched-gigs').textContent = myMatched;

    const gigList = document.getElementById('employer-gig-list');

    if (state.gigs.length === 0) {
        gigList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <p>아직 등록하신 구인 공고가 없습니다.<br>위 폼을 이용해 첫 긴급 구인을 시작해 보세요!</p>
            </div>
        `;
        return;
    }

    gigList.innerHTML = [...state.gigs].reverse().map(gig => {
        let statusBadge = '';
        let workerPanel = '';
        let cancelBtn = '';

        if (gig.status === 'waiting') {
            statusBadge = `<span class="status-tag status-waiting"><i class="fa-solid fa-spinner"></i> 매칭 대기 중</span>`;
            workerPanel = `<div class="worker-profile-mini"><span style="color:var(--text-muted)">매칭된 인원 없음</span></div>`;
            cancelBtn = `<button class="btn-cancel-teumta" onclick="handleEmployerCancel('${gig.id}')">구인 취소</button>`;
        } else if (gig.status === 'matched') {
            statusBadge = `<span class="status-tag status-matched"><i class="fa-solid fa-handshake"></i> 매칭 완료</span>`;
            workerPanel = `
                <div class="worker-profile-mini">
                    <div class="worker-info-mini">
                        <span class="worker-name-mini">${gig.workerName}</span>
                    </div>
                    <span class="detail-item" style="color:var(--accent-gold-deep)">출근 대기</span>
                </div>
                ${trustBarHtml(gig.workerRating)}
                ${gig.workerBio ? `<p class="job-desc">${gig.workerBio}</p>` : ''}
            `;
            const cutoffPassed = isPastCancelCutoff(gig);
            cancelBtn = `<button class="btn-cancel-teumta" onclick="handleEmployerCancel('${gig.id}')">${cutoffPassed ? '취소 (위약금 발생)' : '취소'}</button>`;
        } else if (gig.status === 'working') {
            statusBadge = `<span class="status-tag status-working"><i class="fa-solid fa-person-digging"></i> 현재 근무 중</span>`;
            workerPanel = `
                <div class="worker-profile-mini">
                    <div class="worker-info-mini">
                        <span class="worker-name-mini">${gig.workerName}</span>
                    </div>
                    <span class="detail-item" style="color:#7C3AED"><i class="fa-solid fa-spinner fa-spin"></i> 열일 중</span>
                </div>
            `;
        } else if (gig.status === 'done') {
            statusBadge = `<span class="status-tag status-done"><i class="fa-solid fa-circle-check"></i> 근무 완료</span>`;
            workerPanel = `
                <div class="worker-profile-mini">
                    <div class="worker-info-mini">
                        <span class="worker-name-mini">${gig.workerName}</span>
                    </div>
                    <button class="btn-action-green" style="flex:none; padding: 4px 10px; font-size:11px;" onclick="handleApprovePayment('${gig.id}')">
                        급여 지급 승인
                    </button>
                </div>
            `;
        }

        return `
            <div class="job-card">
                <div class="job-header">
                    <div class="job-badge-area">
                        <span class="job-title">${gig.title}</span>
                        <span class="job-employer">시급 ${gig.pay.toLocaleString()}원</span>
                    </div>
                    ${statusBadge}
                </div>
                <div class="job-details">
                    <div class="detail-item"><i class="fa-solid fa-clock"></i> ${formatGigSchedule(gig)} (${calculateHours(gig.startTime, gig.endTime)}시간)</div>
                    <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${gig.location}</div>
                </div>
                ${workerPanel}
                ${cancelBtn ? `<div class="job-footer">${cancelBtn}</div>` : ''}
            </div>
        `;
    }).join('');
}

// --- Actions ---
// Date field defaults to today and can't go into the past; the day-of-week badge
// is derived from it automatically (no separate day picker needed).
function todayDateStr() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function updateGigDayLabel() {
    const dateVal = document.getElementById('gig-date').value;
    document.getElementById('gig-day-label').textContent = dateVal ? koreanDayFromDateStr(dateVal) : '-';
}

function resetGigDateField() {
    const dateInput = document.getElementById('gig-date');
    const todayStr = todayDateStr();
    dateInput.min = todayStr;
    dateInput.value = todayStr;
    updateGigDayLabel();
}

document.getElementById('gig-date').addEventListener('change', updateGigDayLabel);

document.getElementById('gig-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('gig-title').value;
    const pay = parseInt(document.getElementById('gig-hourly-pay').value);
    const date = document.getElementById('gig-date').value;
    const startTime = document.getElementById('gig-start-time').value;
    const endTime = document.getElementById('gig-end-time').value;
    const location = document.getElementById('gig-location').value;
    const description = document.getElementById('gig-description').value || '추가 지침이 없습니다.';

    if (!date) {
        showToast('근무 날짜를 선택해주세요.', 'toast');
        return;
    }
    const [startH] = startTime.split(':').map(Number);
    const [endH] = endTime.split(':').map(Number);
    if (startH >= endH) {
        showToast('근무 종료 시간은 시작 시간보다 늦어야 합니다.', 'toast');
        return;
    }

    const gig = db.postGig({
        title, employer: '역삼 틈새 카페', pay,
        date, dayOfWeek: koreanDayFromDateStr(date),
        startTime, endTime, location, description
    });

    showToast('긴급 구인 공고가 등록되었습니다. 실시간으로 매칭이 시작됩니다.', 'employer');
    document.getElementById('gig-form').reset();
    resetGigDateField();

    setHeroStage('searching');

    setTimeout(() => {
        const picked = runAutoMatch(gig);
        if (picked) {
            showToast(`⚡ AI 매칭 성공! 등록된 근무 가능 시간이 맞는 '${picked.name}'님이 랜덤으로 배정되었습니다.`, 'success');
        }
        renderHeroResult(gig.id);
    }, 1400);
});

window.handleApprovePayment = function(gigId) {
    const gig = db.approvePayment(gigId);
    if (!gig) return;
    const hours = calculateHours(gig.startTime, gig.endTime);
    const earned = gig.pay * hours;
    if (gig.workerIsMe) db.addEarnings(earned);
    showToast(`근무 수당 ${earned.toLocaleString()}원 송금이 완료되었습니다.`, 'success');
};

// Employer cancel: free before the 1hr-before-shift cutoff, penalty (split with the platform) after.
window.handleEmployerCancel = function(gigId) {
    const gig = db.getState().gigs.find(g => g.id === gigId);
    if (!gig) return;

    if (gig.status === 'matched' && isPastCancelCutoff(gig)) {
        const { penalty, seekerShare, platformShare } = calculatePenalty(gig);
        const ok = confirm(
            `출근 1시간 이내 취소는 위약금이 발생합니다.\n\n` +
            `위약금: ${penalty.toLocaleString()}원\n` +
            `(구직자 몫 ${seekerShare.toLocaleString()}원 / 플랫폼 몫 ${platformShare.toLocaleString()}원)\n\n` +
            `취소하시겠습니까?`
        );
        if (!ok) return;
        if (gig.workerIsMe) db.addEarnings(seekerShare);
        db.cancelByEmployer(gigId);
        showToast(`위약금 ${penalty.toLocaleString()}원이 발생했습니다 (구직자 ${seekerShare.toLocaleString()}원 / 플랫폼 ${platformShare.toLocaleString()}원). 구인이 취소되었습니다.`, 'info');
    } else {
        if (!confirm('이 구인을 취소하시겠습니까?')) return;
        db.cancelByEmployer(gigId);
        showToast('구인이 취소되었습니다.', 'info');
    }
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
        if (confirm('모든 데이터를 초기화하시겠습니까? (구직자/사장님 앱 양쪽 모두 초기화됩니다)')) {
            db.resetToDefault();
            showToast('데이터가 초기화되었습니다.', 'info');
            setHeroStage('idle');
        }
    });

    document.getElementById('btn-sim-add-jobs').addEventListener('click', () => {
        const mockGigs = [
            { title: '레스토랑 식기세척', employer: '도산 파스타키친', pay: 13000, startTime: '12:00', endTime: '15:00', location: '서초구 서초동', description: '바쁜 점심 시간대 식기 세척 및 주방 보조 업무입니다.' },
            { title: '행사 주차 안내', employer: '코엑스 모빌리티', pay: 14000, startTime: '11:00', endTime: '15:00', location: '강남구 역삼동', description: '오전 야외 이벤트 주차 차선 정리 및 고객 안내 데스크 보조입니다.' },
            { title: '바리스타 보조', employer: '블루보틀 성수', pay: 12500, startTime: '13:00', endTime: '17:00', location: '성동구 성수동', description: '러시 아워에 가벼운 컵 정리, 원두 소분, 바 테이블 위생 정리 보조.' }
        ];
        mockGigs.forEach(g => {
            const gig = db.postGig(g);
            runAutoMatch(gig);
        });
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
    resetGigDateField();
    db.subscribe(render);
});
