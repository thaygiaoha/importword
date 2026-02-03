const SPREADSHEET_ID = "16w4EzHhTyS1CnTfJOWE7QQNM0o2mMQIqePpPK8TEYrg";

/**
 * Import câu hỏi từ Google Docs (Word đã convert)
 * @param {string} fileId - ID Google Docs
 */
function importQuestionBankFromDoc(fileId) {
  const doc = DocumentApp.openById(1BHw1A9ZXhbWCeKVV6OFPhzitlG0HsRnW);
  const text = doc.getBody().getText();

  // Tách từng block { ... }
  const blocks = text.match(/\{[\s\S]*?\}/g);
  if (!blocks || blocks.length === 0) {
    throw new Error("Không tìm thấy câu hỏi dạng { ... }");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName("nganhang");
  if (!sheet) {
    sheet = ss.insertSheet("nganhang");
    sheet.appendRow(["createdAt", "id", "classTag", "questionJSON"]);
  }

  const now = new Date();
  const rows = [];

  blocks.forEach((block, index) => {
    try {
      // Chuẩn hóa thành JSON hợp lệ
      const jsonText = block
        .replace(/(\w+)\s*:/g, '"$1":') // id: -> "id":
        .replace(/'/g, '"');

      const obj = JSON.parse(jsonText);

      if (!obj.id || !obj.classTag) {
        throw new Error("Thiếu id hoặc classTag");
      }

      rows.push([
        now,
        obj.id,
        obj.classTag,
        JSON.stringify(obj)
      ]);
    } catch (err) {
      console.error("Lỗi câu", index + 1, err.message);
    }
  });

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 4).setValues(rows);
  }

  return `Đã import ${rows.length} câu hỏi vào ngân hàng`;
}
