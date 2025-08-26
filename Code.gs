/********** CONFIG **********/
const SPREADSHEET_ID = "1W7mvXJZerwARD4S2bTEJJxWiFdv9kNAdaOtb0Gn8wRs";   // ใส่ ID ของ Google Sheet จริง
const SHEET_STUDENTS = "Students";        // A:StudentID, B:Name, C:Grade
const SHEET_EVAL     = "Evaluation";      // Timestamp, StudentID, Grade, Homeroom, HomeroomScore, Subjects, Comment
/****************************/

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const shStudents = ss.getSheetByName(SHEET_STUDENTS);
    const shEval = ss.getSheetByName(SHEET_EVAL);

    const p = e.parameter;
    const student_id    = (p.student_id || "").trim();
    const grade         = (p.grade || "").trim();
    const homeroom      = (p.homeroom || "").trim();
    const homeroomScore = (p.homeroom_score || "").trim();
    const comment       = (p.comment || "").trim();
    let subjects        = [];
    try { subjects = JSON.parse(p.subjects || "[]"); } catch (_) { subjects = []; }

    // ----- ตรวจ input ขั้นต้น -----
    if (!student_id || !grade || !homeroom || !homeroomScore) {
      return _json({status:"error", message:"กรุณากรอกข้อมูลให้ครบถ้วน"});
    }

    // ----- เช็ครหัสนักเรียนในระบบ -----
    let validIds = new Set();
    if (shStudents.getLastRow() > 1) {  // มีข้อมูลจริง
      const stuRange = shStudents.getRange(2,1,shStudents.getLastRow()-1,1).getValues();
      validIds = new Set(stuRange.map(r => String(r[0]).trim()).filter(x=>x));
    }
    if (!validIds.has(student_id)) {
      return _json({status:"error", message:"❌ ไม่มีรหัสนักเรียนนี้ในระบบ กรุณาแจ้งครูประจำชั้น หรือ เจ้าหน้าที่ IT"});
    }

    // ----- กันส่งซ้ำ -----
    let usedOnce = false;
    if (shEval.getLastRow() > 1) {  // มีข้อมูลจริง
      const evalRange = shEval.getRange(2,2,shEval.getLastRow()-1,1).getValues(); // col B = StudentID
      usedOnce = evalRange.some(r => String(r[0]).trim() === student_id);
    }
    if (usedOnce) {
      return _json({status:"error", message:"⚠️ รหัสนี้ได้ทำแบบประเมินแล้ว ไม่สามารถส่งซ้ำได้"});
    }

    // ----- บันทึกข้อมูล -----
    const now = new Date();
    const subjectStr = subjects.map(s => `(${s.subject}, ${s.teacher}, ${s.score})`).join(", ");

    shEval.appendRow([
      now, student_id, grade, homeroom, Number(homeroomScore), subjectStr, comment
    ]);

    return _json({status:"success", message:"✅ ส่งแบบประเมินสำเร็จ"});
  } catch (err) {
    return _json({status:"error", message:"เกิดข้อผิดพลาด: " + err});
  }
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
/********** DASHBOARD API **********/
function doGet(e) {
  if (e.parameter.mode === "summary") {
    return getSummary();
  }
  return HtmlService.createTemplateFromFile("Dashboard").evaluate()
    .setTitle("Dashboard");
}

function getSummary() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const shEval = ss.getSheetByName(SHEET_EVAL);
    const data = shEval.getDataRange().getValues();
    if (data.length < 2) {
      return _json({subjects:[], homerooms:[], grades:[]});
    }

    const subjectMap={}, homeroomMap={}, gradeMap={};

    for (let i=1; i<data.length; i++) {
      const [ts, studentId, grade, homeroom, homeroomScore, subjects, comment] = data[i];

      // ค่าเฉลี่ยครูประจำชั้น
      if (homeroom && homeroomScore) {
        if (!homeroomMap[homeroom]) homeroomMap[homeroom] = {sum:0,count:0};
        homeroomMap[homeroom].sum += Number(homeroomScore);
        homeroomMap[homeroom].count++;
      }

      // ค่าเฉลี่ยรายวิชา (subjects เก็บเป็น "(คณิตศาสตร์, ครูแนท, 4),(อังกฤษ, ครูออโต้, 5)")
      if (subjects) {
        const arr = subjects.split("),").map(s=>s.replace(/[()]/g,"").trim());
        arr.forEach(item=>{
          if (!item) return;
          const [subj, teacher, score] = item.split(",").map(x=>x.trim());
          const key = `${teacher} (${subj})`;
          if (!subjectMap[key]) subjectMap[key] = {sum:0,count:0};
          subjectMap[key].sum += Number(score);
          subjectMap[key].count++;

          if (grade) {
            if (!gradeMap[grade]) gradeMap[grade] = {sum:0,count:0};
            gradeMap[grade].sum += Number(score);
            gradeMap[grade].count++;
          }
        });
      }
    }

    const subjects = Object.entries(subjectMap).map(([k,v])=>({
      teacher_subject: k,
      avg: +(v.sum/v.count).toFixed(2)
    }));
    const homerooms = Object.entries(homeroomMap).map(([k,v])=>({
      homeroom: k,
      avg: +(v.sum/v.count).toFixed(2)
    }));
    const grades = Object.entries(gradeMap).map(([k,v])=>({
      grade: k,
      avg: +(v.sum/v.count).toFixed(2)
    }));

    return _json({subjects, homerooms, grades});
  } catch(err) {
    return _json({error:err.message});
  }
}
