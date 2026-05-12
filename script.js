
// الأسماء الكاملة (12 عضو + 3 أدمن)
const allNames = [
    "مارتيورس جمال", "نرمين فرج الله", "ميرنا فام", "بيشوي صفوت", "شنوده نصحي", "سيلفيا طلعت", "سيمون سمعان", "كرستينا ميلاد", "ماري بشاي", "ابانوب فرج الله", "امال عادل", "باسم جابر",  // 12 عضو
    "هاله عادل", "دميانه سمعان", "فام روماني",",ويصا مرزق","ماري هاني ","مينا فام","فيولا طلعت"  // 3 أدمن
];

const admins = [
    { username: "admin1", password: "admin123" },
    { username: "admin2", password: "admin123" },
    { username: "admin3", password: "admin123" }
];

const MONTHS_COUNT = 12;
let currentMember = null;
let currentMonth = 0;
let attendanceData = [];

const statusText = {
    'present': 'حاضر ✅',
    'late': 'متأخر ⏰',
    'absent': 'غائب بدون عذر ❌',
    'excused': 'غائب بعذر 📝'
};

// -------------------- تحميل البيانات من جوجل شيت --------------------
async function loadData() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        attendanceData = data.attendance || [];
        return data;
    } catch (error) {
        console.error("خطأ في تحميل البيانات:", error);
        return { members: [], attendance: [] };
    }
}

// -------------------- حفظ البيانات في جوجل شيت --------------------
async function saveToSheet(record) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(record)
        });
        console.log("تم الحفظ:", record);
    } catch (error) {
        console.error("خطأ في الحفظ:", error);
    }
}

// -------------------- حساب النسب --------------------
async function calculatePersonalStats(name, month) {
    await loadData();
    const records = attendanceData.filter(r => r[0] === name && r[1] == month + 1);
    const total = records.length;
    
    let present = 0, excused = 0, absent = 0;
    let totalLateMinutes = 0;
    let lateCount = 0;
    
    records.forEach(r => {
        const status = r[3];
        if (status === 'present' || status === 'late') {
            present++;
            if (status === 'late') {
                lateCount++;
                totalLateMinutes += parseInt(r[5]) || 0;
            }
        }
        else if (status === 'excused') excused++;
        else if (status === 'absent') absent++;
    });
    
    return {
        presentRate: total ? Math.round((present / total) * 100) : 0,
        excusedRate: total ? Math.round((excused / total) * 100) : 0,
        absentRate: total ? Math.round((absent / total) * 100) : 0,
        total: total,
        lateCount: lateCount,
        avgLate: lateCount ? Math.round(totalLateMinutes / lateCount) : 0
    };
}

// -------------------- تسجيل الحالة --------------------
async function recordStatus(status, lateMinutes = 0, actualTime = "") {
    if (!currentMember) return;
    
    const record = [
        currentMember,
        currentMonth + 1,
        new Date().toISOString().split('T')[0],
        status,
        actualTime || new Date().toLocaleTimeString('ar-EG'),
        lateMinutes,
        ""
    ];
    
    await saveToSheet(record);
    await updateMemberView();
}

// -------------------- نافذة التأخير --------------------
function showLateDialog() {
    document.getElementById('lateDialog').classList.remove('hidden');
}

function closeLateDialog() {
    document.getElementById('lateDialog').classList.add('hidden');
}

async function recordLate() {
    const actualTime = document.getElementById('actualTime').value;
    if (!actualTime) {
        alert('يرجى إدخال وقت الحضور');
        return;
    }
    const [hour, minute] = actualTime.split(':').map(Number);
    const lateMinutes = Math.max(0, (hour - 9) * 60 + (minute - 0));
    
    await recordStatus('late', lateMinutes, actualTime);
    closeLateDialog();
}

// -------------------- عرض الأعضاء --------------------
function showMemberList() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('memberScreen').classList.remove('hidden');
    
    const memberList = document.getElementById('memberList');
    memberList.innerHTML = '';
    
    const normalMembers = allNames.slice(0, 19);
    normalMembers.forEach(name => {
        const card = document.createElement('div');
        card.className = 'member-card';
        card.textContent = name;
        card.onclick = () => openMemberDashboard(name);
        memberList.appendChild(card);
    });
}

function openMemberDashboard(name) {
    const isAdminPerson = name.includes("أدمن");
    currentMember = name;
    currentMonth = 0;
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('memberDashboard').classList.remove('hidden');
    document.getElementById('memberName').textContent = name;
    renderMonthsTabs('memberMonthsTabs', true);
    
    const btns = document.querySelectorAll('.status-btn');
    if (isAdminPerson) {
        btns.forEach(btn => btn.style.display = 'flex');
    } else {
        btns.forEach(btn => btn.style.display = 'none');
    }
    
    updateMemberView();
}

async function updateMemberView() {
    const stats = await calculatePersonalStats(currentMember, currentMonth);
    document.getElementById('personalStats').innerHTML = `
        <p>✅ الحضور (حاضر + متأخر): ${stats.presentRate}%</p>
        <p>📝 الغياب بعذر: ${stats.excusedRate}%</p>
        <p>❌ الغياب بدون عذر: ${stats.absentRate}%</p>
        <p>📊 إجمالي التسجيلات: ${stats.total}</p>
        ${stats.lateCount > 0 ? `<p>⏰ عدد مرات التأخير: ${stats.lateCount}</p>
        <p>⏱️ متوسط التأخير: ${stats.avgLate} دقيقة</p>` : ''}
    `;
}

function renderMonthsTabs(containerId, isMember = true) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < MONTHS_COUNT; i++) {
        const btn = document.createElement('button');
        btn.className = `month-tab ${i === currentMonth ? 'active' : ''}`;
        btn.textContent = `شهر ${i + 1}`;
        btn.dataset.month = i;
        btn.onclick = () => {
            document.querySelectorAll(`#${containerId} .month-tab`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMonth = i;
            if (isMember) updateMemberView();
            else updateAdminView();
        };
        container.appendChild(btn);
    }
}

// -------------------- الأدمن --------------------
function showAdminLogin() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('adminLoginScreen').classList.remove('hidden');
}

function verifyAdmin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const admin = admins.find(a => a.username === username && a.password === password);
    if (admin) {
        showAdminDashboard();
    } else {
        alert('اسم المستخدم أو كلمة السر خطأ');
    }
}

function showAdminDashboard() {
    currentMonth = 0;
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('adminDashboard').classList.remove('hidden');
    renderMonthsTabs('adminMonthsTabs', false);
    updateAdminView();
}

async function updateAdminView() {
    await loadData();
    const stats = [];
    
    for (const name of allNames) {
        const personalStats = await calculatePersonalStats(name, currentMonth);
        stats.push({ name, ...personalStats });
    }
    
    const bestAttendance = [...stats].sort((a,b) => b.presentRate - a.presentRate)[0];
    const worstAbsence = [...stats].sort((a,b) => b.absentRate - a.absentRate)[0];
    const mostLate = [...stats].sort((a,b) => b.lateCount - a.lateCount)[0];
    
    const adminStatsDiv = document.getElementById('adminStats');
    if (adminStatsDiv) {
        adminStatsDiv.innerHTML = `
            <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; padding:20px; border-radius:15px; margin-bottom:20px;">
                <h3 style="margin:0 0 10px 0;">📊 إحصائيات شهر ${currentMonth + 1}</h3>
                <div style="display:flex; flex-wrap:wrap; gap:20px; justify-content:space-between;">
                    <div>🏆 أعلى نسبة حضور: <strong>${bestAttendance?.name || '-'}</strong> (${bestAttendance?.presentRate || 0}%)</div>
                    <div>⚠️ أعلى غياب بدون عذر: <strong>${worstAbsence?.name || '-'}</strong> (${worstAbsence?.absentRate || 0}%)</div>
                    <div>⏰ أكثر عضو تأخيراً: <strong>${mostLate?.name || '-'}</strong> (${mostLate?.lateCount || 0} مرة)</div>
                </div>
            </div>
        `;
    }
    
    let html = `<div style="overflow-x:auto;"><table style="width:100%; border-collapse:collapse;">`;
    html += `<thead><tr style="background:#667eea; color:white;">
        <th>الاسم</th><th>حضور</th><th>غياب بعذر</th><th>غياب بدون عذر</th><th>عدد التأخير</th><th>متوسط التأخير</th><th>إجمالي</th>
    </tr></thead><tbody>`;
    
    stats.forEach(s => {
        html += `<tr>
            <td>${s.name}</td>
            <td style="color:#48bb78;">${s.presentRate}%</td>
            <td style="color:#4299e1;">${s.excusedRate}%</td>
            <td style="color:#f56565;">${s.absentRate}%</td>
            <td>${s.lateCount}</td>
            <td>${s.avgLate}</td>
            <td>${s.total}</td>
        </tr>`;
    });
    html += `</tbody></table></div>`;
    
    const tableDiv = document.getElementById('allMembersTable');
    if (tableDiv) tableDiv.innerHTML = html;
}

function editMemberFromAdmin(memberName) {
    currentMember = memberName;
    currentMonth = 0;
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('memberDashboard').classList.remove('hidden');
    document.getElementById('memberName').textContent = memberName;
    renderMonthsTabs('memberMonthsTabs', true);
    document.querySelectorAll('.status-btn').forEach(btn => btn.style.display = 'flex');
    updateMemberView();
}

function downloadPDF() {
    const element = document.getElementById('pdf-content');
    if (!element) {
        alert('خطأ في إنشاء التقرير');
        return;
    }
    html2pdf().set({ margin: 10, filename: `تقرير_شهر_${currentMonth+1}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } }).from(element).save();
}

// -------------------- دوال التنقل --------------------
function backToLogin() {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('loginScreen').classList.remove('hidden');
}

function backToMemberList() {
    showMemberList();
}
