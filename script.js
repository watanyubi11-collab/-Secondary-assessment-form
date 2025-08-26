// ===== ตั้งค่าของคุณ =====
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzir8f3QRbNkx8qYPiuMm0pcF2-rqIErK5GmwxQJKSpDMy8LDlkxxF4mFUuv6Wy5BQw/exec";
// ========================

const $ = (sel) => document.querySelector(sel);
const msg = $("#msg");
const gradeSel = $("#grade");
const homeroomSel = $("#homeroom");
const subjectSel = $("#subject");
const teacherSel = $("#teacher");

let optionsCache = {};   // เก็บ mapping ของชั้น → { homerooms:[...], subjects:{subject:[teacher,...]} }

async function loadGrades() {
  try{
    const res = await fetch(`${WEB_APP_URL}?mode=meta`, {method:"GET"});
    const data = await res.json(); // {grades:[...]}
    (data.grades||[]).forEach(g=>{
      const opt=document.createElement("option"); opt.value=g; opt.textContent=g; gradeSel.appendChild(opt);
    });
  }catch(e){ msg.textContent="โหลดรายชื่อชั้นเรียนไม่สำเร็จ"; msg.style.color="crimson"; }
}

async function loadOptionsByGrade(grade){
  homeroomSel.innerHTML = `<option value="">— เลือกครูประจำชั้น —</option>`;
  subjectSel.innerHTML  = `<option value="">— เลือกวิชา —</option>`;
  teacherSel.innerHTML  = `<option value="">— เลือกครูผู้สอน —</option>`;
  if(!grade) return;

  if(!optionsCache[grade]){
    const res = await fetch(`${WEB_APP_URL}?mode=options&grade=${encodeURIComponent(grade)}`);
    const data = await res.json(); // { homerooms:[...], subjects:{subj:[teacher,...]} }
    optionsCache[grade]=data;
  }
  const data=optionsCache[grade];

  data.homerooms.forEach(h=>{
    const o=document.createElement("option"); o.value=h; o.textContent=h; homeroomSel.appendChild(o);
  });
  Object.keys(data.subjects).forEach(s=>{
    const o=document.createElement("option"); o.value=s; o.textContent=s; subjectSel.appendChild(o);
  });
}

function populateTeachers(){
  teacherSel.innerHTML = `<option value="">— เลือกครูผู้สอน —</option>`;
  const grade=gradeSel.value, subj=subjectSel.value;
  if(!grade||!subj) return;
  const teachers = (optionsCache[grade]?.subjects?.[subj])||[];
  teachers.forEach(t=>{
    const o=document.createElement("option"); o.value=t; o.textContent=t; teacherSel.appendChild(o);
  });
}

document.addEventListener("DOMContentLoaded", ()=>{
  loadGrades();
  gradeSel.addEventListener("change", e=>loadOptionsByGrade(e.target.value));
  subjectSel.addEventListener("change", populateTeachers);

  $("#evalForm").addEventListener("submit", async (e)=>{
    e.preventDefault();
    msg.textContent="กำลังส่งข้อมูล..."; msg.style.color="#374151";

    const payload={
      student_id: $("#student_id").value.trim(),
      grade: gradeSel.value,
      homeroom: homeroomSel.value,
      subject: subjectSel.value,
      teacher: teacherSel.value,
      score: Number($("#score").value),
      comment: $("#comment").value.trim()
    };

    // ตรวจหน้าเว็บขั้นต้น
    if(!payload.student_id||!payload.grade||!payload.homeroom||!payload.subject||!payload.teacher||!(payload.score>=1&&payload.score<=10)){
      msg.textContent="กรอกข้อมูลให้ครบถ้วนและถูกต้องค่ะ/ครับ"; msg.style.color="crimson"; return;
    }

    try{
      const res = await fetch(WEB_APP_URL, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });
      const out = await res.json();
      if(out.status==="success"){
        msg.textContent="ส่งแบบประเมินเรียบร้อย ขอบคุณค่ะ/ครับ 💖"; msg.style.color="green";
        e.target.reset();
        homeroomSel.innerHTML=`<option value="">— เลือกครูประจำชั้น —</option>`;
        subjectSel.innerHTML=`<option value="">— เลือกวิชา —</option>`;
        teacherSel.innerHTML=`<option value="">— เลือกครูผู้สอน —</option>`;
      }else{
        msg.textContent = out.message || "ส่งไม่สำเร็จ";
        msg.style.color="crimson";
      }
    }catch(err){
      msg.textContent = "ขัดข้องชั่วคราว ลองใหม่อีกครั้ง"; msg.style.color="crimson";
    }
  });
});
