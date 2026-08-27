const fs = require("fs");
const path = require("path");

async function testParsers() {
  console.log("=== Testing mammoth (DOCX) ===");
  const mammoth = require("mammoth");

  // Create a minimal valid DOCX
  const JSZip = require("jszip");
  const zip = new JSZip();
  zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file("word/_rels/document.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>');
  zip.file("word/document.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Hello World. This is a test document with customer feedback.</w:t></w:r></w:p><w:p><w:r><w:t>The login process is frustrating and slow.</w:t></w:r></w:p><w:p><w:r><w:t>We need dark mode as a feature.</w:t></w:r></w:p></w:body></w:document>');

  const docxBuf = await zip.generateAsync({ type: "nodebuffer" });
  fs.writeFileSync(path.join(process.cwd(), "test.docx"), docxBuf);
  console.log("Created test.docx");

  try {
    const result = await mammoth.extractRawText({ buffer: docxBuf });
    console.log("DOCX extracted:", result.value);
  } catch (e) {
    console.error("DOCX FAILED:", e.message);
  }

  console.log("\n=== Testing pdf-parse (PDF) ===");
  // Create a simple test using a known-working pattern
  try {
    const pdfModule = require("pdf-parse");
    console.log("pdf-parse exports:", Object.keys(pdfModule));

    // Try loading a known tiny PDF from the npm test fixtures
    const testDir = path.dirname(require.resolve("pdf-parse"));
    console.log("pdf-parse location:", testDir);

    // Test with a real tiny PDF buffer
    const tinyPdf = Buffer.from(
      "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n5 0 obj<</Length 44>>stream\nBT /F1 12 Tf 100 700 Td (Hello Test) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \n0000000335 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n429\n%%EOF",
    );

    const pdf = new pdfModule.PDFParse({ data: new Uint8Array(tinyPdf) });
    const textResult = await pdf.getText();
    console.log("PDF extracted:", JSON.stringify(textResult.text));
  } catch (e) {
    console.error("PDF FAILED:", e.message, e.stack?.split("\n")[1]);
  }
}

testParsers().catch(console.error);