# แบบประเมินครู (ฟรี 100%) — GitHub Pages + Google Apps Script + Google Sheets

## โครงสร้างชีตที่ต้องมี
สร้าง Google Sheet (คัดลอก Spreadsheet ID มาใส่ใน `Code.gs`):

### 1) Students
| StudentID | Name | Class |
|---|---|---|
| 65001 | สมชาย ใจดี | ป.6 |
| 65002 | พิมพ์ชนก มากมี | ป.5 |

### 2) Teachers
| Class | Homeroom | Subject | Teacher |
|---|---|---|---|
| ป.6 | ครูอรุณ | คณิตศาสตร์ | ครูสมชาย |
| ป.6 | ครูอรุณ | ภาษาไทย | ครูสมหญิง |
| ป.5 | ครูแสง | วิทยาศาสตร์ | ครูสมปอง |

### 3) Evaluation
สร้างหัวคอลัมน์ไว้ก่อน (หรือให้ Apps Script เติมเมื่อบันทึกครั้งแรก):
`Timestamp, StudentID, Class, Homeroom, Subject, Teacher, Score, Comment`

---

## ตั้งค่า Apps Script
1. เปิด https://script.google.com → New project  
2. สร้างไฟล์ `Code.gs` และวางโค้ดทั้งหมดจากโปรเจกต์นี้  
3. ตั้ง `SHEET_ID` เป็น Spreadsheet ID ของคุณ  
4. ตั้ง `ADMIN_KEY` เป็นรหัสลับ (เช่น สุ่ม 32 ตัวอักษร)  
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - กด Deploy → copy **Web App URL**

## ตั้งค่าไฟล์ฝั่งเว็บ
- เปิด `script.js` และ `dashboard.js` แล้วใส่ `WEB_APP_URL` เป็น URL จากขั้นตอนบน
- อัปโหลด `logo.png` (ถ้าต้องการ)
- Commit ไฟล์ทั้งหมดขึ้น GitHub

## เปิด GitHub Pages
- ไปที่ **Settings → Pages**
- Source: **Deploy from a branch**
- Branch: `main` / Folder: `/ (root)` → Save
- รอ ~1 นาที จะได้ลิงก์ `https://<user>.github.io/<repo>/`
  - ฟอร์ม: `.../index.html`
  - Dashboard: `.../dashboard.html`

## ใช้งาน
- นักเรียน/ผู้ปกครอง → เปิดหน้า `index.html` กรอก
- Dashboard ค่าเฉลี่ย (สาธารณะ) → `dashboard.html` (ไม่มีข้อมูลส่วนบุคคล)
- Summary เชิงลึก (มีคอมเมนต์) เฉพาะผู้ดูแล:
  - เรียก: `WEB_APP_URL?mode=summary_raw&admin_key=YOUR_ADMIN_KEY`
  - ไม่แนะนำให้แชร์ลิงก์นี้สาธารณะ

## หมายเหตุ
- Dropdown ทั้งหมด (ชั้น/ครูประจำชั้น/วิชา/ครูสอน) จะอิงจากชีต `Teachers`
- `student_id` ต้องอยู่ในชีต `Students` และใช้ได้ **ครั้งเดียว**
- หากต้องการจำกัด “หนึ่งวิชาต่อหนึ่งการประเมิน” ให้ปรับเช็คซ้ำใน `doPost` เพิ่มเติม (เช็ค [StudentID, Subject])
