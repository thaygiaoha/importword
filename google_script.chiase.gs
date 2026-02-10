// =====================ADMIN =======================================================
const SPREADSHEET_ID_ADMIN = "1LlFAI1J0b7YQ84BL674r2kr3wSoW9shgsXSIXVPDypM";
const ssAdmin = SpreadsheetApp.openById(SPREADSHEET_ID_ADMIN);
const sheetNH = ssAdmin.getSheetByName("nganhang")
// =====================GV ==========================================================
const SPREADSHEET_ID = "1LlFAI1J0b7YQ84BL674r2kr3wSoW9shgsXSIXVPDypM";
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
// =================================Script ==========================================

function createResponseW(status, message, data = null) {
  const output = { status: status, message: message };
  if (data !== null) output.data = data;
  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
function createResponse(status, message, data) {
  const output = { status: status, message: message };
  if (data) output.data = data;
  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

// Giữ lại resJSON để phục vụ các đoạn code cũ đang gọi tên này
function resJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/*************************************************
 * HÀM DỌN DỮ LIỆU QUIZ HÀNG TUẦN
 *************************************************/
function clearWeeklyQuizData() {
  const sheet = ss.getSheetByName("ketquaQuiZ");
  if (sheet && sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
    console.log("Dữ liệu ketquaQuiZ đã được dọn dẹp.");
  }
}

/*************************************************
 * HÀM XỬ LÝ GET REQUEST
 *************************************************/
function doGet(e) {
  const params = e.parameter;
  const type = params.type;
  const action = params.action;

 // Thêm vào trong function doGet(e)
if (action === 'getQuestionsByCode') {
  const examCode = params.examCode;
  const sheet = ss.getSheetByName("exam_data");
  if (!sheet) return createResponse("error", "Chưa có dữ liệu exam_data");
  
  const data = sheet.getDataRange().getValues();
  const results = [];
  
  for (let i = 1; i < data.length; i++) {
    // Cột A là mã đề
    if (data[i][0].toString() === examCode.toString()) {
      try {
        // Cột C chứa JSON câu hỏi
        results.push(JSON.parse(data[i][2])); 
      } catch(err) {
        results.push(data[i][2]);
      }
    }
  }
  return createResponse("success", "OK", results);
}

  // Xác minh giáo viên

  if (action === 'checkTeacher') {
    try {
      const idInput = (params.idgv || "").toString().trim();
      const sheet = ssAdmin.getSheetByName("idgv");
      if (!sheet) return createResponse("error", "Không tìm thấy sheet idgv");

      // SỬA LỖI: Dùng đúng biến sheet đã khai báo
      const authSetting = sheet.getRange("F2").getValue(); 
      const data = sheet.getDataRange().getValues();

      let found = null;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0].toString().trim() === idInput) {
          found = { name: data[i][1], link: data[i][2] };
          break;
        }
      }

      // Nếu tìm thấy GV
      if (found) {
        return createResponse("success", "OK", { 
          name: found.name, 
          link: found.link,
          isAuthRequired: authSetting == 1 
        });
      } else {
        // Nếu KHÔNG tìm thấy nhưng F2 = 0 thì vẫn cho qua với tư cách Khách
        if (authSetting != 1) {
          return createResponse("success", "Chế độ tự do", { 
            name: "Khách trải nghiệm", 
            link: "",
            isAuthRequired: false 
          });
        }
        return createResponse("error", "ID không tồn tại: " + idInput);
      }
    } catch (err) {
      return createResponse("error", "Lỗi Script: " + err.toString());
    }
  }
  
  
  if (action === 'getLG') {
     const sheetNH = ssAdmin.getSheetByName("nganhang");
    var idTraCuu = params.id;
    if (!idTraCuu) return ContentService.createTextOutput("Thiếu ID rồi!").setMimeType(ContentService.MimeType.TEXT);

    var data = sheetNH.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === idTraCuu.toString().trim()) {
        var loigiai = data[i][4] || ""; 
        
        // Ép kiểu về String để đảm bảo không bị lỗi tệp
        return ContentService.createTextOutput(String(loigiai))
                             .setMimeType(ContentService.MimeType.TEXT);
      }
    }
    return ContentService.createTextOutput("Không tìm thấy ID này!").setMimeType(ContentService.MimeType.TEXT);
  }


   // lấy dạng câu hỏi
  if (action === 'getAppConfig') {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    data: getAppConfig()
  })).setMimeType(ContentService.MimeType.JSON);
}

// 4. KIỂM TRA GIÁO VIÊN (Dành cho Module Giáo viên tạo đề word)
    
   
   // Trong hàm doGet(e) của Google Apps Script
if (action === "getRouting") {
  const sheet = ssAdmin.getSheetByName("idgv");
  const rows = sheet.getDataRange().getValues();
  const data = [];
  for (var i = 1; i < rows.length; i++) {
    data.push({
      idNumber: rows[i][0], // Cột A
      link: rows[i][2]      // Cột C
    });
  }
  return createResponse("success", "OK", data);
}

  // 1. ĐĂNG KÝ / ĐĂNG NHẬP
  var sheetAcc = ssAdmin.getSheetByName("account");
  if (action === "register") {
    var phone = params.phone;
    var pass = params.pass;
    var rows = sheetAcc.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1].toString() === phone) return ContentService.createTextOutput("exists");
    }
    sheetAcc.appendRow([new Date(), "'" + phone, pass, "VIP0"]);
    return ContentService.createTextOutput("success");
  }

  if (action === "login") {
    var phone = params.phone;
    var pass = params.pass;
    var rows = sheetAcc.getDataRange().getValues();
    
    for (var i = 1; i < rows.length; i++) {
      // Kiểm tra số điện thoại (cột B) và mật khẩu (cột C)
      if (rows[i][1].toString() === phone && rows[i][2].toString() === pass) {
        
        return createResponse("success", "OK", { 
          phoneNumber: rows[i][1].toString(), 
          vip: rows[i][3] ? rows[i][3].toString() : "VIP0",
          name: rows[i][4] ? rows[i][4].toString() : "" // Lấy thêm cột E (tên người dùng)
        });
      }
    }
    return ContentService.createTextOutput("fail");
  }

  // 2. LẤY DANH SÁCH ỨNG DỤNG
  if (params.sheet === "ungdung") {
    var sheet = ss.getSheetByName("ungdung");
    var rows = sheet.getDataRange().getValues();
    var data = [];
    for (var i = 1; i < rows.length; i++) {
      data.push({ name: rows[i][0], icon: rows[i][1], link: rows[i][2] });
    }
    return resJSON(data);
  }

  // 3. TOP 10
  if (type === 'top10') {
    const sheet = ss.getSheetByName("Top10Display");
    if (!sheet) return createResponse("error", "Không tìm thấy sheet Top10Display");
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return createResponse("success", "Chưa có dữ liệu Top 10", []);
    const values = sheet.getRange(2, 1, Math.min(10, lastRow - 1), 10).getValues();
    const top10 = values.map((row, index) => ({
      rank: index + 1, name: row[0], phoneNumber: row[1], score: row[2],
      time: row[3], sotk: row[4], bank: row[5], idPhone: row[9]
    }));
    return createResponse("success", "OK", top10);
  }

  // 4. THỐNG KÊ ĐÁNH GIÁ
  if (type === 'getStats') {
    const stats = { ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    const sheetRate = ss.getSheetByName("danhgia");
    if (sheetRate) {
      const rateData = sheetRate.getDataRange().getValues();
      for (let i = 1; i < rateData.length; i++) {
        const star = parseInt(rateData[i][1]);
        if (star >= 1 && star <= 5) stats.ratings[star]++;
      }
    }
    return createResponse("success", "OK", stats);
  }

  // 5. LẤY MẬT KHẨU (Ô H2)
  if (type === 'getPass') {
    const sheetList = ss.getSheetByName("danhsach");
    const password = sheetList.getRange("H2").getValue();
    return resJSON({ password: password.toString() });
  }

  // 6. XÁC MINH THÍ SINH
  if (type === 'verifyStudent') {
    const idNumber = params.idnumber;
    const sbd = params.sbd;
    const sheet = ss.getSheetByName("danhsach");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][5].toString().trim() === idNumber.trim() && data[i][0].toString().trim() === sbd.trim()) {
        return createResponse("success", "OK", {
          name: data[i][1], class: data[i][2], limit: data[i][3],
          limittab: data[i][4], taikhoanapp: data[i][6], idnumber: idNumber, sbd: sbd
        });
      }
    }
    return createResponse("error", "Thí sinh không tồn tại!");
  }

  // 7. LẤY CÂU HỎI THEO ID
  if (action === 'getQuestionById') {
    var id = params.id;
    var sheetNH = ssAdmin.getSheetByName("nganhang");
    var dataNH = sheetNH.getDataRange().getValues();
    for (var i = 1; i < dataNH.length; i++) {
      if (dataNH[i][0].toString() === id.toString()) {
        return createResponse("success", "OK", {
          idquestion: dataNH[i][0], 
          classTag: dataNH[i][1], 
          question: dataNH[i][2],
          datetime: dataNH[i][3], 
          loigiai: dataNH[i][4]
        });
      }
    }
    return resJSON({ status: 'error' });
  }

  // 8. LẤY MA TRẬN ĐỀ
  if (type === 'getExamCodes') {
    const teacherId = params.idnumber;
    const sheet = ss.getSheetByName("matran");
    const data = sheet.getDataRange().getValues();
    const results = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0].toString().trim() === teacherId.trim() || row[0].toString() === "SYSTEM") {
        try {
          results.push({
            code: row[1].toString(), name: row[2].toString(), topics: JSON.parse(row[3]),
            fixedConfig: {
              duration: parseInt(row[4]), numMC: JSON.parse(row[5]), scoreMC: parseFloat(row[6]),
              mcL3: JSON.parse(row[7]), mcL4: JSON.parse(row[8]), numTF: JSON.parse(row[9]),
              scoreTF: parseFloat(row[10]), tfL3: JSON.parse(row[11]), tfL4: JSON.parse(row[12]),
              numSA: JSON.parse(row[13]), scoreSA: parseFloat(row[14]), saL3: JSON.parse(row[15]), saL4: JSON.parse(row[16])
            }
          });
        } catch (err) {}
      }
    }
    return createResponse("success", "OK", results);
  }

  // 9. LẤY TẤT CẢ CÂU HỎI (Hàm này thầy bị trùng, em gom lại bản chuẩn nhất)
  if (action === "getQuestions") {
    var sheet = ssAdmin.getSheetByName("nganhang");
    var rows = sheet.getDataRange().getValues();
    var questions = [];
    for (var i = 1; i < rows.length; i++) {
      var raw = rows[i][2];
      if (!raw) continue;
      try {
        var jsonText = raw.replace(/(\w+)\s*:/g, '"$1":').replace(/'/g, '"');
        var obj = JSON.parse(jsonText);
        if (!obj.classTag) obj.classTag = rows[i][1];
        obj.loigiai = rows[i][4] || "";
        questions.push(obj);
      } catch (e) {}
    }
    return createResponse("success", "OK", questions);
  }

  return createResponse("error", "Yêu cầu không hợp lệ");
}

/*************************************************
 * HÀM XỬ LÝ POST REQUEST
 *************************************************/
    function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    const data = JSON.parse(e.postData.contents || "{}");    
    const action = (data.action || "").toString();
    
    const res = (status, message, payload) =>
      ContentService.createTextOutput(
        JSON.stringify({ status, message, data: payload || null })
      ).setMimeType(ContentService.MimeType.JSON);

      // Gửi điểm đề thi từ word
      // 1. Phân loại dựa trên dữ liệu gửi lên
    // Nếu có trường 'sbd' và 'tongdiem' -> Đây là kết quả thi
    if (data.sbd && data.tongdiem) {
      var sheetKetQua = ss.getSheetByName("ketqua");
      sheetKetQua.appendRow([
        data.timestamp, 
        data.exams,     
        data.sbd,       
        data.name,      
        data.class,     
        data.tongdiem,  
        data.time       
      ]);
      return ContentService.createTextOutput("Đã ghi điểm thành công");
    }

    // 2. Nếu sau này thầy gửi dữ liệu đăng ký (có pass, phone...)
    if (data.type === 'register') {
      var sheetUser = ss.getSheetByName("users");
      sheetUser.appendRow([new Date(), data.phone, data.pass]);
      return ContentService.createTextOutput("Đã đăng ký thành công");
    }

   // Ghi kết quả thi lẻ
   if (data.action === "submitExam") {
  try {
    
    const sheetExams = ss.getSheetByName("exams"); 
    
    // Tìm dòng chứa mã đề để biết hàng cần ghi hoặc ghi mới vào sheet kết quả
    // Ở đây mình ví dụ ghi vào cuối sheet "exams" hoặc bạn nên tạo sheet "ketqua" riêng
    const sheetKq = ss.getSheetByName("ketqua") || sheetExams; 

    sheetKq.appendRow([
      data.timestamp,   // Cột A
      data.examCode,    // Cột B (Kiểm tra xem biến này có nhận từ React chưa)
      data.sbd,         // Cột C
      data.name,        // Cột D
      data.className,   // Cột E (Lớp)
      data.tongdiem,    // Cột F
      data.time,        // Cột G
      data.details      // Cột H
    ]);

    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

    

    // =================================================================== TRỘN ĐỀ ===========================================
    
   if (action === "studentGetExam") {
  try {
    const sbd = data.sbd?.toString().trim();
    const examCode = data.examCode?.toString().trim();
    const idgv = data.idgv?.toString().trim();

    const sheetDS = ss.getSheetByName("danhsach");
    const sheetData = ss.getSheetByName("exam_data");
    const sheetExam = ss.getSheetByName("exams");

    // 1. Check học sinh & Cấu hình đề (Thầy giữ logic cũ nhưng dùng .trim() cho chắc)
    const student = sheetDS.getDataRange().getValues().find(r => r[0].toString() == sbd && r[5].toString() == idgv);
    if (!student) return createResponseW("error", "SBD hoặc IDGV không đúng!");

    const exRow = sheetExam.getDataRange().getValues().find(r => r[0].toString() == examCode);
    if (!exRow) return createResponseW("error", "Không tìm thấy mã đề: " + examCode);
    // chuẩn hóa
    const toInt = (v, def = 0) => {
      const n = parseInt(v?.toString().trim(), 10);
      return isNaN(n) ? def : n;
    };

    const toFloat = (v, def = 0) => {
      if (v === null || v === undefined) return def;
      const s = v.toString().replace(",", ".");
      const n = parseFloat(s);
      return isNaN(n) ? def : n;
    };

    const toDateISO = (v) => {
      if (v instanceof Date) {
        return Utilities.formatDate(v, "GMT+7", "yyyy-MM-dd");
      }
      const s = v?.toString().trim();
      return s || "";
    };

    // 2. Lấy câu hỏi - ĐOẠN NÀY QUAN TRỌNG
    const allRows = sheetData.getDataRange().getValues();
    const filteredQuestions = allRows.slice(1)
      .filter(r => r[0].toString().trim() === examCode)
      .map(r => {
        let rawContent = r[4];
        if (!rawContent) return null;
        
        // Nếu là Object thì dùng luôn, nếu là String thì mới Parse
        if (typeof rawContent !== 'string') return rawContent;

        try {
          return JSON.parse(rawContent);
        } catch (e) {
          // Mẹo: Nếu parse lỗi do ký tự đặc biệt, thử "dọn dẹp" chuỗi rồi parse lại
          try {
             let cleanContent = rawContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); 
             return JSON.parse(cleanContent);
          } catch (e2) {
             return { type: "sa", question: rawContent, id: r[1], error: "Lỗi định dạng" };
          }
        }
      })
      .filter(Boolean);

    // 3. Trả về (Em bỏ qua bước trộn để test xem nó có lên đủ câu không đã)
    return createResponseW("success", "OK", {
      studentName: student[1],
      studentClass: student[2],
      duration: toInt(exRow[8], 33),
      minSubmitTime: toInt(exRow[9], 0),     // minitime
      maxTabSwitches: toInt(exRow[10], 3),        // tab limit
      deadline: toDateISO(exRow[11]),     // yyyy-MM-dd
      scoreMCQ: toFloat(exRow[3], 0),
      scoreTF: toFloat(exRow[5], 0),
      scoreSA: toFloat(exRow[7], 0),
      studentName: student[1],
      studentClass: student[2]
     
      questions: filteredQuestions // Gửi hết về xem có đủ không
    });

  } catch (error) {
    return createResponseW("error", "Lỗi GAS: " + error.toString());
  }
}



    // 3 nhánh ghi LG word ==========================================================================================================
      
  if (action === 'saveOnlySolutions') {
  const sheet = ss.getSheetByName("exam_data");
  if (!sheet) return createResponse("error", "Không tìm thấy sheet!");
  
  const lastRow = sheet.getLastRow();
  const solutions = data.solutions; // Mảng các chuỗi {...}
  const examCode = data.examCode;

  // Đọc dữ liệu để làm bản đồ
  const range = sheet.getRange(1, 1, lastRow, 6).getValues(); 
  let updatedCount = 0;

  solutions.forEach(solText => {
    // 1. Thử tìm ID trong khối lời giải
    const idMatch = solText.match(/id\s*:\s*"?([\w.]+)"?/);
    let found = false;

    if (idMatch) {
      const solId = idMatch[1].toString();
      // Dò đúng dòng có Mã đề + ID
      for (let i = 1; i < range.length; i++) {
        if (range[i][0].toString() === examCode.toString() && range[i][1].toString() === solId) {
          sheet.getRange(i + 1, 6).setValue(solText);
          range[i][5] = solText; // Cập nhật vào mảng tạm để tránh ghi đè
          updatedCount++;
          found = true;
          break;
        }
      }
    }

    // 2. Nếu không có ID hoặc không tìm thấy dòng khớp ID -> Tìm dòng trống đầu tiên của mã đề đó
    if (!found) {
      for (let i = 1; i < range.length; i++) {
        if (range[i][0].toString() === examCode.toString() && (!range[i][5] || range[i][5].toString().trim() === "")) {
          sheet.getRange(i + 1, 6).setValue(solText);
          range[i][5] = solText; // Đánh dấu là đã điền
          updatedCount++;
          found = true;
          break;
        }
      }
    }
  });

  return createResponse("success", `Đã nạp xong ${updatedCount} lời giải cho mã ${examCode}!`);
}



    // 2. NHÁNH NẠP CÂU HỎI (Khớp 100% với React ở trên)
    if (action === "saveOnlyQuestions") {
  const sheet = ss.getSheetByName("exam_data") || ss.insertSheet("exam_data");
  const qArray = data.questions;
  const examCode = data.examCode;
  const force = data.force || false; // Nhận lệnh ghi đè từ React

  if (!Array.isArray(qArray)) return createResponse("error", "questions không phải mảng!");

  // --- LOGIC DÒ MÃ EXAMS ---
  const fullData = sheet.getDataRange().getValues();
  const exists = fullData.some(row => row[0].toString() === examCode.toString());

  if (exists && !force) {
    return createResponse("exists", `Mã exams ${examCode} đã có câu hỏi!`);
  }

  // Nếu thầy chọn GHI ĐÈ (force = true), tiến hành xóa các hàng cũ của mã đó
  if (exists && force) {
    // Xóa từ dưới lên để không bị lệch Index
    for (let i = fullData.length - 1; i >= 0; i--) {
      if (fullData[i][0].toString() === examCode.toString()) {
        sheet.deleteRow(i + 1);
      }
    }
  }
  // -------------------------

  const rows = qArray.map(q => ([
    examCode,               // A
    q.id || "",            // B
    q.classTag || "1001.a", // C
    q.type || "mcq",       // D
    q.question || "",      // E
    "",                    // F loigiai
    new Date()             // G
  ]));

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
  return createResponse("success", `Đã nạp ${rows.length} câu vào mã ${examCode}`);
}


// 1. LƯU CẤU HÌNH (Ghi về Spreadsheet của GV) =========================================================================
if (action === "saveExamConfig") {
  // Lấy sheet "exams" từ spreadsheet của GV (ss)
  const sheetExamsGV = ss.getSheetByName("exams") || ss.insertSheet("exams");
  
  const examCode = (data.examCode || "").toString().trim();
  const idgv = (data.idgv || "").toString().trim();
  const cfg = data.config;
  const isForce = e.parameter.force === "true";

  // Quét tìm mã đề trong sheet của GV
  const vals = sheetExamsGV.getDataRange().getValues();
  let existingRow = -1;

  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0] && vals[i][0].toString().trim() === examCode) {
      existingRow = i + 1;
      break;
    }
  }

  // Nếu trùng mã đề ở sheet GV
  if (existingRow !== -1 && !isForce) {
    return createResponse("exists", "Mã đề đã tồn tại trong danh sách của Thầy/Cô!");
  }

  // Dàn quân 12 cột chuẩn vào sheet exams của GV
  const rowData = [
    examCode,           // 1. Mã đề
    idgv,               // 2. IDGV
    cfg.numMCQ,         // 3. Số câu MCQ
    cfg.scoreMCQ,       // 4. Điểm mỗi câu MCQ
    cfg.numTF,          // 5. Số câu Đúng/Sai
    cfg.scoreTF,        // 6. Điểm mỗi câu Đúng/Sai
    cfg.numSA,          // 7. Số câu trả lời ngắn
    cfg.scoreSA,        // 8. Điểm mỗi câu trả lời ngắn
    cfg.duration,       // 9. Thời gian làm bài (phút)
    cfg.mintime,        // 10. Thời gian nộp bài sớm nhất
    cfg.tab,            // 11. Giới hạn chuyển Tab
    cfg.close           // 12. Hạn đóng đề
  ];

  if (existingRow !== -1) {
    // Ghi đè dòng cũ của GV
    sheetExamsGV.getRange(existingRow, 1, 1, 12).setValues([rowData]);
  } else {
    // Thêm dòng mới cho GV
    sheetExamsGV.appendRow(rowData);
  }

  return createResponse("success", "✅ Đã lưu cấu hình đề " + examCode + " vào đúng Spreadsheet của Giáo viên!");
}



    // 1. NHÁNH LỜI GIẢI (saveLG)
   if (action === 'saveLG') {
      var lastRow = sheetNH.getLastRow();
      if (lastRow < 2) return ContentService.createTextOutput("⚠️ Sheet rỗng, chưa có ID để khớp thầy ơi!").setMimeType(ContentService.MimeType.TEXT);

      // 1. Tìm ô trống đầu tiên ở cột E
      var eValues = sheetNH.getRange(1, 5, lastRow, 1).getValues();
      var firstEmptyRow = 0;
      for (var i = 1; i < eValues.length; i++) {
        if (!eValues[i][0] || eValues[i][0].toString().trim() === "") {
          firstEmptyRow = i + 1;
          break;
        }
      }
      if (firstEmptyRow === 0) firstEmptyRow = lastRow + 1;

      // 2. Điền LG và ép ID theo cột A
      var count = 0;
      data.forEach(function(item, index) {
        var targetRow = firstEmptyRow + index;
        
        // Lấy ID "xịn" đang nằm ở cột A của hàng này
        var realId = sheetNH.getRange(targetRow, 1).getValue().toString();
        
        if (realId) {
          var rawLG = item.loigiai || item.lg || "";
          
          // Dùng Regex để tìm "id: ..." hoặc "id:..." và thay bằng ID xịn từ cột A
          // Đoạn này xử lý cả trường hợp có ngoặc kép hoặc không
          var fixedLG = rawLG.replace(/id\s*:\s*["']?\w+["']?/g, 'id: "' + realId + '"');
          
          // Ghi vào cột E
          sheetNH.getRange(targetRow, 5).setValue(fixedLG);
          count++;
        }
      });

      return ContentService.createTextOutput("🚀 Đã xong! Điền tiếp " + count + " lời giải. ID trong LG đã được đồng bộ theo ID câu hỏi.").setMimeType(ContentService.MimeType.TEXT);
    }
    // 2. NHÁNH MA TRẬN (saveMatrix)
    if (action === "saveMatrix") {
      const sheetMatran = ss.getSheetByName("matran") || ss.insertSheet("matran");
      const toStr = (v) => (v != null) ? String(v).trim() : "";
      const toNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
      const toJson = (v) => {
        if (!v || v === "" || (Array.isArray(v) && v.length === 0)) return "[]";
        if (typeof v === 'object') return JSON.stringify(v);
        let s = String(v).trim();
        return s.startsWith("[") ? s : "[" + s + "]";
      };
      const rowData = [
        toStr(data.gvId), toStr(data.makiemtra), toStr(data.name), toJson(data.topics),
        toNum(data.duration), toJson(data.numMC), toNum(data.scoreMC), toJson(data.mcL3),
        toJson(data.mcL4), toJson(data.numTF), toNum(data.scoreTF), toJson(data.tfL3),
        toJson(data.tfL4), toJson(data.numSA), toNum(data.scoreSA), toJson(data.saL3), toJson(data.saL4)
      ];
      const vals = sheetMatran.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = 1; i < vals.length; i++) {
        if (vals[i][0].toString() === toStr(data.gvId) && vals[i][1].toString() === toStr(data.makiemtra)) {
          rowIndex = i + 1; break;
        }
      }
      if (rowIndex > 0) { sheetMatran.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]); } 
      else { sheetMatran.appendRow(rowData); }
      return createResponse("success", "✅ Đã tạo ma trận " + data.makiemtra + " thành công!");
    }

    // 3. NHÁNH LƯU CÂU HỎI MỚI (saveQuestions)
    if (action === 'saveQuestions') {
      var now = new Date();
      var yymmdd = now.getFullYear().toString().slice(-2) + ("0" + (now.getMonth() + 1)).slice(-2) + ("0" + now.getDate()).slice(-2);
      var tttStart = 1;
      if (sheetNH.getLastRow() > 1) {
        var lastId = sheetNH.getRange(sheetNH.getLastRow(), 1).getValue().toString();
        if (lastId.length >= 3) {
          var lastNum = parseInt(lastId.slice(-3), 10);
          if (!isNaN(lastNum)) tttStart = lastNum + 1;
        }
      }
      for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var xy = (item.classTag || "XX").toString().slice(0, 2);
        var newId = xy + yymmdd + (tttStart + i).toString().padStart(3, '0');
        var fixedQuestion = item.question ? item.question.replace(/id\s*:\s*\d+/, "id: " + newId) : "";
        sheetNH.appendRow([newId, item.classTag, fixedQuestion, new Date(), item.lg || ""]);
      }
      return createResponse("success", "Đã lưu " + data.length + " câu hỏi thành công!");
    }

    // 4. XÁC MINH GIÁO VIÊN (verifyGV)
    if (action === "verifyGV") {
      var sheetGV = ss.getSheetByName("idgv");
      var rows = sheetGV.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0].toString().trim() === data.idnumber.toString().trim() && rows[i][1].toString().trim() === data.password.toString().trim()) {
          return resJSON({ status: "success" });
        }
      }
      return resJSON({ status: "error", message: "ID hoặc Mật khẩu GV không đúng!" });
    }

    // 5. CẬP NHẬT CÂU HỎI (updateQuestion)
    if (action === 'updateQuestion') {
      var item = data.data;
      var allRows = sheetNH.getDataRange().getValues();
      for (var i = 1; i < allRows.length; i++) {
        if (allRows[i][0].toString() === item.idquestion.toString()) {
          sheetNH.getRange(i + 1, 2).setValue(item.classTag);
          sheetNH.getRange(i + 1, 3).setValue(item.question);
          sheetNH.getRange(i + 1, 4).setValue(item.datetime);
          sheetNH.getRange(i + 1, 5).setValue(item.loigiai);
          return resJSON({ status: 'success' });
        }
      }
      return resJSON({ status: 'error', message: 'Không tìm thấy ID câu hỏi' });
    }

    // 6. XÁC MINH ADMIN (verifyAdmin)
    if (action === "verifyAdmin") {
      var adminPass = ss.getSheetByName("danhsach").getRange("I2").getValue().toString().trim();
      if (data.password.toString().trim() === adminPass) return resJSON({ status: "success", message: "Chào Admin!" });
      return resJSON({ status: "error", message: "Sai mật khẩu!" });
    }

    // 7. LƯU TỪ WORD (uploadWord)
    if (action === "uploadWord") {
      const sheetExams = ss.getSheetByName("Exams") || ss.insertSheet("Exams");
      const sheetBank = ss.getSheetByName("QuestionBank") || ss.insertSheet("QuestionBank");
      sheetExams.appendRow([data.config.title, data.idNumber, data.config.duration, data.config.minTime, data.config.tabLimit, JSON.stringify(data.config.points)]);
      data.questions.forEach(function (q) { sheetBank.appendRow([data.config.title, q.part, q.type, q.classTag, q.question, q.answer, q.image]); });
      return createResponse("success", "UPLOAD_DONE");
    }

    // 8. NHÁNH THEO TYPE (quiz, rating, ketqua)
    if (data.type === 'rating') {
      let sheetRate = ss.getSheetByName("danhgia") || ss.insertSheet("danhgia");
      sheetRate.appendRow([new Date(), data.stars, data.name, data.class, data.idNumber, data.comment || "", data.taikhoanapp]);
      return createResponse("success", "Đã nhận đánh giá");
    }
    if (data.type === 'quiz') {
      let sheetQuiz = ss.getSheetByName("ketquaQuiZ") || ss.insertSheet("ketquaQuiZ");
      sheetQuiz.appendRow([new Date(), data.examCode || "QUIZ", data.name || "N/A", data.className || "", data.school || "", data.phoneNumber || "", data.score || 0, data.totalTime || "00:00", data.stk || "", data.bank || ""]);
      return createResponse("success", "Đã lưu kết quả Quiz");
    }

    // 9. LƯU KẾT QUẢ THI TỔNG HỢP (Mặc định nếu có data.examCode)
    if (data.examCode) {
      let sheetResult = ss.getSheetByName("ketqua") || ss.insertSheet("ketqua");
      sheetResult.appendRow([new Date(), data.examCode, data.sbd, data.name, data.className, data.score, data.totalTime, JSON.stringify(data.details)]);
      return createResponse("success", "Đã lưu kết quả thi");
    }

    return createResponse("error", "Không khớp lệnh nào!");

   }
   catch (err) {
    return createResponse("error", err.toString());
  } finally {
    lock.releaseLock();
  }
}

/*************************************************
 * CÁC HÀM PHỤ TRỢ (NẰM NGOÀI ĐỂ TRÁNH LỖI)
 *************************************************/
function getLinkFromRouting(idNumber) {
  const sheet = ssAdmin.getSheetByName("idgv");
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    // Cột A: idNumber, Cột C: linkscript
    if (data[i][0].toString().trim() === idNumber.toString().trim()) {
      return data[i][2].toString().trim();
    }
  }
  return null;
}

function getSpreadsheetByTarget(targetId) {
  // 1. Nếu không có ID, dùng ngay file hiện tại (Active)
  if (!targetId || targetId.toString().trim() === "") return SpreadsheetApp.getActiveSpreadsheet();
  
  const sheet = ssAdmin.getSheetByName("idgv");
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    // Cột A: idNumber, Cột C: linkscript
    if (rows[i][0].toString().trim() === targetId.toString().trim()) {
      let url = rows[i][2].toString().trim();
      if (url && url.startsWith("http")) {
        try {
          // Nếu link là file Master thì trả về luôn
          if (url.indexOf(ss.getId()) !== -1) return ss;
          return SpreadsheetApp.openByUrl(url);
        } catch (e) {
          console.log("Lỗi mở file riêng, chuyển về file hiện tại.");
        }
      }
      break; 
    }
  }

  // 2. QUAN TRỌNG: Nếu duyệt hết mà không thấy targetId trong bảng idgv 
  // (Nghĩa là GV tự do hoặc ID mới chưa đăng ký)
  // TRẢ VỀ file hiện tại (getActive) thay vì ép vào file Master cố định
  return SpreadsheetApp.getActiveSpreadsheet(); 
}

function replaceIdInBlock(block, newId) {
  if (block.match(/id\s*:\s*\d+/)) return block.replace(/id\s*:\s*\d+/, "id: " + newId);
  return block.replace("{", "{\nid: " + newId + ",");
}


function getAppConfig() {  
  var sheetCD = ssAdmin.getSheetByName("dangcd");
  var dataCD = sheetCD.getDataRange().getValues();
  
  var topics = [];
  var classesMap = {}; // Dùng để lọc danh sách lớp không trùng lặp

  // Chạy từ dòng 2 (bỏ tiêu đề)
  for (var i = 1; i < dataCD.length; i++) {
    var lop = dataCD[i][0];   // Cột A: lop
    var idcd = dataCD[i][1];  // Cột B: idcd
    var namecd = dataCD[i][2]; // Cột C: namecd

    if (lop) {
      // 1. Đẩy vào danh sách chuyên đề
      topics.push({
        grade: lop,
        id: idcd,
        name: namecd
      });

      // 2. Thu thập danh sách lớp (để nạp vào CLASS_ID bên React)
      // Ví dụ: Trong sheet có lớp 10, 11, 12 thì CLASS_ID sẽ có các lớp tương ứng
      classesMap[lop] = true;
    }
  }

  return {
    topics: topics,
    classes: Object.keys(classesMap).sort(function(a, b){ return a - b; }) // Trả về [9, 10, 11, 12] chẳng hạn
  };
}
function parseDocByParagraph_(docId) {
  const body = DocumentApp.openById(docId).getBody();
  const paras = body.getParagraphs();

  let part = "";
  let current = null;
  const questions = [];

  paras.forEach(p => {
    const text = p.getText().trim();
    if (!text) return;

    // PHẦN
    if (/^Phần\s*I/i.test(text)) part = "MCQ";
    if (/^Phần\s*II/i.test(text)) part = "TF";
    if (/^Phần\s*III/i.test(text)) part = "SA";

    // CÂU HỎI
    if (/^Câu\s+\d+/i.test(text)) {
      if (current) questions.push(current);
      current = {
        part,
        question: text,
        options: [],
        answers: [],
        key: ""
      };
      return;
    }

    if (!current) return;

    // PHẦN III – KEY
    if (part === "SA") {
      const m = text.match(/<key\s*=\s*([^>]+)>/i);
      if (m) current.key = m[1].trim();
      else current.question += "\n" + text;
      return;
    }

    // PHẦN I & II – OPTION
    if (/^[A-D]\./.test(text)) {
      const letter = text[0];
      const isUnderline = hasUnderline_(p);
      current.options.push(text);

      if (isUnderline) {
        current.answers.push(letter);
      }
    } else {
      current.question += "\n" + text;
    }
  });

  if (current) questions.push(current);
  return questions;
}
// kiểm tra gạch chân
function hasUnderline_(paragraph) {
  const text = paragraph.editAsText();
  for (let i = 0; i < text.getText().length; i++) {
    if (text.getUnderline(i)) return true;
  }
  return false;
}
// chuẩn hóa trước khi ghi exam_data
function normalizeQuestion_(q) {
  if (q.part === "MCQ") {
    return {
      type: "MCQ",
      answer: q.answers[0] || ""
    };
  }

  if (q.part === "TF") {
    return {
      type: "TF",
      answer: q.answers.join(",")
    };
  }

  if (q.part === "SA") {
    return {
      type: "SA",
      answer: q.key
    };
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ==== Ghi exam_data


function parseQuestionFromCell(text, id) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const qLine = lines.find(l => l.startsWith('?'));
  const question = qLine ? qLine.slice(1).trim() : '';
  const options = lines.filter(l => /^[A-D]\./.test(l)).map(l => l.slice(2).trim());
  const ansLine = lines.find(l => l.startsWith('='));
  const ansIndex = ansLine ? ansLine.replace('=', '').trim().charCodeAt(0) - 65 : -1;
  return { id, type: 'mcq', question, o: options, a: options[ansIndex] || '' };
}

