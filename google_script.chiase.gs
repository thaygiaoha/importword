const SPREADSHEET_ID = "1LlFAI1J0b7YQ84BL674r2kr3wSoW9shgsXSIXVPDypM";
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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
      const sheet = ss.getSheetByName("idgv");
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
     const sheetNH = ss.getSheetByName("nganhang");
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
  const sheet = ss.getSheetByName("idgv");
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
  var sheetAcc = ss.getSheetByName("account");
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
    var sheetNH = ss.getSheetByName("nganhang");
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
    var sheet = ss.getSheetByName("nganhang");
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
    const idgv = (e.parameter.idgv || JSON.parse(e.postData.contents).idgv || "").toString().trim();
    const action = e.parameter.action || JSON.parse(e.postData.contents).action;
    
    const data = JSON.parse(e.postData.contents);
   
   
    const sheetNH = ss.getSheetByName("nganhang");  

    // Thêm vào trong function doPost(e)
    
   // 1. NHÁNH LƯU CẤU HÌNH (Ổn định theo kiểu saveMatrix)
    if (action === 'saveExamConfig') {
      // BƯỚC 1: Xác định file đích (Master hay Hàng xóm)
      const targetSS = getSpreadsheetByTarget(idgv);
      const sheet = targetSS.getSheetByName("exams") || targetSS.insertSheet("exams");
      
      // Tạo tiêu đề nếu sheet mới
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["exams", "IdNumber", "fulltime", "mintime", "tab", "dateclose", "MCQ", "scoremcq", "TF", "scoretf", "SA", "scoresa", "IDimglink"]);
      }

      // Chuẩn bị dữ liệu hàng (Row Data)
      const rowData = [
        data.exams, idgv, data.fulltime, data.mintime, 
        data.tab, data.dateclose, data.MCQ, data.scoremcq, 
        data.TF, data.scoretf, data.SA, data.scoresa, data.IDimglink
      ];

      // BƯỚC 2: Kiểm tra để ghi đè (Chỉ dựa vào Mã đề ở Cột A)
const vals = sheet.getDataRange().getValues();
let rowIndex = -1;

// Làm sạch mã đề trước khi so sánh (xóa khoảng trắng, đưa về chữ in hoa)
const searchExams = data.exams.toString().trim().toUpperCase();

for (let i = 1; i < vals.length; i++) {
  // vals[i][0] là dữ liệu Cột A (Mã đề)
  const cellExams = vals[i][0].toString().trim().toUpperCase();
  
  if (cellExams === searchExams) {
    rowIndex = i + 1; // Tìm thấy hàng chứa mã đề này
    break;
  }
}

// BƯỚC 3: Thực hiện ghi
if (rowIndex > 0) {
  // Nếu đã tồn tại mã đề này -> Ghi đè toàn bộ hàng đó
  sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
} else {
  // Nếu mã đề mới hoàn toàn -> Thêm hàng mới ở cuối
  sheet.appendRow(rowData);
}

return createResponse("success", "✅ Đã cập nhật cấu hình mã đề: " + data.exams);
    }
    // 5. UPLOAD DỮ LIỆU ĐỀ THI TỪ WORD (Teacher)
    if (action === 'uploadExamData') {
  const gvSS = getSpreadsheetByTarget(data.idgv);
  // Nếu chưa có sheet exam_data thì nó tự tạo mới
  const sheet = gvSS.getSheetByName("exam_data") || gvSS.insertSheet("exam_data");
  
  const nowObj = new Date();
  const dateStr = Utilities.formatDate(nowObj, "GMT+7", "dd/MM/yyyy HH:mm:ss");
  const yymmdd = Utilities.formatDate(nowObj, "GMT+7", "yyMMdd"); 
  
  // 1. Tính toán ID nối tiếp (ttt) dựa trên dữ liệu đang có trong sheet exam_data
  let tttStart = 1;
  const lastRow = sheet.getLastRow();
  if (lastRow > 0) {
    try {
      const lastId = sheet.getRange(lastRow, 1).getValue().toString();
      // ID: xy + yymmdd + ttt (Lấy 3 số cuối)
      const lastNum = parseInt(lastId.slice(-3), 10); 
      if (!isNaN(lastNum)) tttStart = lastNum + 1;
    } catch(e) { tttStart = 1; }
  }

  // 2. Chuẩn bị mảng để ghi siêu tốc (7 cột cho đầy đủ thông tin thầy cần)
  const rowsToInsert = data.questions.map((qStr, i) => {
    if (!qStr || qStr.length < 20) return null;
    try {
      const q = JSON.parse(qStr);
      
      // Logic ID: Mã tỉnh (2 số đầu classTag) + ngày tháng + STT
      const xy = (q.classTag || "10").toString().slice(0, 2);
      const newId = xy + yymmdd + (tttStart + i).toString().padStart(3, '0');
      
      // Cập nhật ID vào object
      q.id = newId;

      // Cấu trúc hàng: ID | ClassTag | JSON | Ngày nạp | Lời giải | Mã đề | Loại
      return [
        newId, 
        q.classTag || "", 
        JSON.stringify(q), 
        dateStr, 
        q.loigiai || "", 
        data.examCode || "", // Thêm mã đề để thầy lọc theo đề
        q.type || ""
      ];
    } catch (e) { return null; }
  }).filter(row => row !== null);

  // 3. Thực hiện ghi
  if (rowsToInsert.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToInsert.length, 7).setValues(rowsToInsert);
    return createResponse("success", "Đã nạp " + rowsToInsert.length + " câu vào sheet exam_data thành công!");
  } else {
    return createResponse("error", "Dữ liệu không hợp lệ thầy ơi!");
  }
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
  // Định dạng ngày: 260203 (yymmdd)
  var yymmdd = now.getFullYear().toString().slice(-2) + ("0" + (now.getMonth() + 1)).slice(-2) + ("0" + now.getDate()).slice(-2);
  var dateStr = Utilities.formatDate(now, "GMT+7", "dd/MM/yyyy HH:mm:ss");

  var tttStart = 1;
  // Giả sử sheetNH là sheet "nganhang" của thầy
  if (sheetNH.getLastRow() > 1) {
    var lastId = sheetNH.getRange(sheetNH.getLastRow(), 1).getValue().toString();
    if (lastId.length >= 3) {
      var lastNum = parseInt(lastId.slice(-3), 10);
      if (!isNaN(lastNum)) tttStart = lastNum + 1;
    }
  }

  // Mảng để ghi siêu tốc
  var rowsToInsert = [];

  for (var i = 0; i < data.length; i++) {
    var qStr = data[i];
    if (!qStr || qStr.length < 20) continue;

    try {
      // 1. "TẨY RỬA" CHUỖI: Sửa lỗi dấu \ trong TeX (\left, \right...)
      // JSON cần \\ để hiểu dấu \, nên mình nhân đôi các dấu \ đơn lẻ
      var cleanStr = qStr.trim();
      if (cleanStr.startsWith(",")) cleanStr = cleanStr.substring(1).trim();
      if (cleanStr.endsWith(",")) cleanStr = cleanStr.substring(0, cleanStr.length - 1).trim();
      
      // Fix lỗi Bad Escape (như \l, \r trong câu 13, 17 của thầy)
      cleanStr = cleanStr.replace(/\\/g, "\\\\").replace(/\\\\\\\\/g, "\\\\");

      var item = JSON.parse(cleanStr);

      // 2. SINH ID THEO LOGIC CỦA THẦY
      var xy = (item.classTag || "10").toString().slice(0, 2);
      var newId = xy + yymmdd + (tttStart + rowsToInsert.length).toString().padStart(3, '0');

      // 3. CHUẨN BỊ DÒNG GHI (Khớp 5 cột file của thầy)
      // Cột A: ID | B: ClassTag | C: JSON | D: Ngày | E: Lời giải
      rowsToInsert.push([
        newId,
        item.classTag || "",
        JSON.stringify(item),
        dateStr,
        item.loigiai || item.lg || "" // Tự nhận diện cả loigiai hoặc lg
      ]);

    } catch (e) {
      console.log("Lỗi parse câu số " + (i + 1) + ": " + e.message);
    }
  }

  // 4. GHI MỘT NHÁT ĂN NGAY
  if (rowsToInsert.length > 0) {
    sheetNH.getRange(sheetNH.getLastRow() + 1, 1, rowsToInsert.length, 5).setValues(rowsToInsert);
    return createResponse("success", "Đã nạp thành công " + rowsToInsert.length + " câu vào Ngân hàng!");
  } else {
    return createResponse("error", "Không có dữ liệu hợp lệ để nạp thầy ơi!");
  }
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

  } catch (err) {
    return createResponse("error", err.toString());
  } finally {
    lock.releaseLock();
  }
}

/*************************************************
 * CÁC HÀM PHỤ TRỢ (NẰM NGOÀI ĐỂ TRÁNH LỖI)
 *************************************************/
function getLinkFromRouting(idNumber) {
  const sheet = ss.getSheetByName("idgv");
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
  
  const sheet = ss.getSheetByName("idgv");
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetCD = ss.getSheetByName("dangcd");
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
// ==== Ghi exam_data
function writeQuestionsToExamData(examId, questions) {
  const sheet =
    ss.getSheetByName("exam_data") ||
    ss.insertSheet("exam_data");

  // Tạo header nếu sheet trống
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "examId",
      "id",
      "classTag",
      "part",
      "type",
      "question",
      "options",
      "statements",
      "answer",
      "createdAt"
    ]);
  }

  const rows = questions.map(q => [
    examId,
    q.id,
    q.classTag,
    q.part,
    q.type,
    q.question,
    q.o ? JSON.stringify(q.o) : "",
    q.s ? JSON.stringify(q.s) : "",
    q.a || "",
    new Date()
  ]);

  sheet.getRange(
    sheet.getLastRow() + 1,
    1,
    rows.length,
    rows[0].length
  ).setValues(rows);

  return {
    status: "success",
    total: rows.length
  };
}
function importWordToExamData(docId, examId) {
  const questions = parseWordToQuestions(docId, examId); // HÀM BÓC WORD CỦA THẦY

  if (!questions || !questions.length) {
    return createResponse("error", "Không có câu hỏi để ghi");
  }

  const result = writeQuestionsToExamData(examId, questions);
  return createResponse("success", "Đã ghi exam_data", result);
}
function saveToExamData(examCode, questions, ss) {
  let sheetData = ss.getSheetByName("exam_data") || ss.insertSheet("exam_data");
  
  // 1. Tạo tiêu đề nếu sheet mới tinh
  if (sheetData.getLastRow() === 0) {
    sheetData.appendRow(["exams", "questionJSON"]);
  }
  
  // 2. Xóa các câu cũ của mã đề này (để tránh ghi đè/trùng lặp)
  const lastRow = sheetData.getLastRow();
  if (lastRow > 1) {
    const data = sheetData.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i][0] == examCode) {
        sheetData.deleteRow(i + 2); // +2 vì data bắt đầu từ hàng 2
      }
    }
  }

  // 3. CHUẨN HÓA DỮ LIỆU: Biến mảng Object thành mảng hàng để ghi vào Sheet
  // Mỗi hàng gồm: [Mã đề, Nội dung câu hỏi dạng chữ]
  const rowsToInsert = questions.map(function(q) {
    return [
      examCode.toString(), 
      JSON.stringify(q) // Quan trọng: Phải stringify để lưu vào 1 ô duy nhất
    ];
  });

  // 4. Ghi một phát ăn luôn (Batch Update)
  if (rowsToInsert.length > 0) {
    sheetData.getRange(sheetData.getLastRow() + 1, 1, rowsToInsert.length, 2).setValues(rowsToInsert);
  }
}
function parseQuestionFromCell(text, id) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const qLine = lines.find(l => l.startsWith('?'));
  const question = qLine ? qLine.slice(1).trim() : '';
  const options = lines.filter(l => /^[A-D]\./.test(l)).map(l => l.slice(2).trim());
  const ansLine = lines.find(l => l.startsWith('='));
  const ansIndex = ansLine ? ansLine.replace('=', '').trim().charCodeAt(0) - 65 : -1;
  return { id, type: 'mcq', question, o: options, a: options[ansIndex] || '' };
}
function uploadExamData(data) {
  try {
    const targetSS = getSpreadsheetByTarget(data.idgv);
    const sheet = targetSS.getSheetByName("exam_data") || targetSS.insertSheet("exam_data");
    
    // --- PHẦN LOGIC SINH ID CỦA THẦY ---
    var now = new Date();
    // Lấy yymmdd (ví dụ: 260203)
    var yymmdd = now.getFullYear().toString().slice(-2) + ("0" + (now.getMonth() + 1)).slice(-2) + ("0" + now.getDate()).slice(-2);
    
    var tttStart = 1;
    if (sheet.getLastRow() > 1) {
      var lastId = sheet.getRange(sheet.getLastRow(), 1).getValue().toString();
      if (lastId.length >= 3) {
        var lastNum = parseInt(lastId.slice(-3), 10);
        if (!isNaN(lastNum)) tttStart = lastNum + 1;
      }
    }
    // ----------------------------------

    data.questions.forEach((qStr, i) => {
      if (qStr.length < 20) return;
      
      try {
        const q = JSON.parse(qStr);
        
        // Logic tạo ID mới: Lấy 2 số đầu ClassTag (mã tỉnh/lớp) + ngày tháng + số thứ tự
        var xy = (q.classTag || "XX").toString().slice(0, 2);
        var newId = xy + yymmdd + (tttStart + i).toString().padStart(3, '0');

        // Ghi nội dung hiển thị (Câu hỏi + Đáp án)
        var displayString = "❓ " + (q.question || "");
        if (q.o) displayString += "\n🔹 " + q.o.join("\n🔹 ");
        if (q.a) displayString += "\n✅ Đ/A: " + q.a;

        // Cập nhật lại ID trong chuỗi JSON để máy đọc cho khớp
        q.id = newId; 

        // Ghi vào Sheet theo đúng thứ tự thầy muốn
        sheet.appendRow([
          newId,             // Cột A: ID tự sinh
          q.classTag || "",  // Cột B: ClassTag
          displayString,    // Cột C: Nội dung câu hỏi (đã gộp phương án)
          now,               // Cột D: Ngày nạp
          q.loigiai || "",   // Cột E: Lời giải tách riêng (Nạp riêng ở đây nè thầy!)
          JSON.stringify(q), // Cột F: Toàn bộ JSON gốc (để sau này App lôi ra dùng)
          data.examCode      // Cột G: Mã đề
        ]);
      } catch (e) {
        console.log("Lỗi câu " + i + ": " + e.message);
      }
    });

    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      message: "Đã sinh ID và nạp " + data.questions.length + " câu thành công!" 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
