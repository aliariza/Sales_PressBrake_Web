import { getQuoteById } from "./quoteService.js";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LEFT = 48;
const RIGHT = PAGE_WIDTH - 48;
const TOP = PAGE_HEIGHT - 48;
const COMPANY_NAME = "Sales Press Brake";
const COMPANY_LINES = [
  "Endustriyel Cozumler ve Tekliflendirme Hizmetleri",
  "Ankara, Turkiye",
  "info@salespressbrake.local  |  +90 530 000 0000"
];

function sanitizeText(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .trim();
}

function escapePdfText(value) {
  return sanitizeText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatNumber(value, suffix = "") {
  const parsed = Number(value || 0);
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(parsed)}${suffix}`;
}

function formatDate(value) {
  const parsed = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("en-CA").format(parsed);
}

function textWidthEstimate(text, fontSize) {
  return sanitizeText(text).length * fontSize * 0.52;
}

function wrapText(text, fontSize, maxWidth) {
  const normalized = sanitizeText(text);
  if (!normalized) {
    return [""];
  }

  const words = normalized.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (textWidthEstimate(candidate, fontSize) <= maxWidth || !currentLine) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function makeText(x, y, text, size = 11) {
  return `BT /F1 ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`;
}

function makeBoldText(x, y, text, size = 11) {
  return `BT /F2 ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`;
}

function makeLine(x1, y1, x2, y2, width = 1) {
  return `${width} w ${x1} ${y1} m ${x2} ${y2} l S`;
}

function makeRect(x, y, width, height, lineWidth = 1) {
  return `${lineWidth} w ${x} ${y} ${width} ${height} re S`;
}

function makeFilledRect(x, y, width, height, fillRgb = [0.95, 0.97, 1], strokeRgb = [0.78, 0.84, 0.9]) {
  const [fr, fg, fb] = fillRgb;
  const [sr, sg, sb] = strokeRgb;
  return `${fr} ${fg} ${fb} rg ${sr} ${sg} ${sb} RG 1 w ${x} ${y} ${width} ${height} re B 0 0 0 rg 0 0 0 RG`;
}

function buildItems(quote) {
  const items = [
    {
      code: "MAKINE",
      name: quote.machineModelSnapshot,
      quantity: "1",
      unitPrice: formatCurrency(quote.machinePriceUsd),
      amount: formatCurrency(quote.machinePriceUsd)
    }
  ];

  if (quote.toolingNameSnapshot) {
    items.push({
      code: "TAKIM",
      name: quote.toolingNameSnapshot,
      quantity: "1",
      unitPrice: formatCurrency(0),
      amount: formatCurrency(0)
    });
  }

  for (const option of quote.selectedOptions || []) {
    items.push({
      code: option.code,
      name: option.name,
      quantity: "1",
      unitPrice: formatCurrency(option.priceUsd),
      amount: formatCurrency(option.priceUsd)
    });
  }

  return items;
}

function integerToWords(number) {
  const ones = [
    "sifir",
    "bir",
    "iki",
    "uc",
    "dort",
    "bes",
    "alti",
    "yedi",
    "sekiz",
    "dokuz",
    "on",
    "on bir",
    "on iki",
    "on uc",
    "on dort",
    "on bes",
    "on alti",
    "on yedi",
    "on sekiz",
    "on dokuz"
  ];
  const tens = ["", "", "yirmi", "otuz", "kirk", "elli", "altmis", "yetmis", "seksen", "doksan"];

  if (number < 20) {
    return ones[number];
  }

  if (number < 100) {
    const remainder = number % 10;
    return remainder ? `${tens[Math.floor(number / 10)]}-${ones[remainder]}` : tens[Math.floor(number / 10)];
  }

  if (number < 1000) {
    const remainder = number % 100;
    return remainder
      ? `${ones[Math.floor(number / 100)]} yuz ${integerToWords(remainder)}`
      : `${ones[Math.floor(number / 100)]} yuz`;
  }

  if (number < 1000000) {
    const remainder = number % 1000;
    return remainder
      ? `${integerToWords(Math.floor(number / 1000))} bin ${integerToWords(remainder)}`
      : `${integerToWords(Math.floor(number / 1000))} bin`;
  }

  const remainder = number % 1000000;
  return remainder
    ? `${integerToWords(Math.floor(number / 1000000))} milyon ${integerToWords(remainder)}`
    : `${integerToWords(Math.floor(number / 1000000))} milyon`;
}

function amountToWords(value) {
  const amount = Number(value || 0);
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  const dollarWords = integerToWords(Math.max(dollars, 0));
  const centWords = integerToWords(Math.max(cents, 0));

  return `${dollarWords} dolar ve ${centWords} sent`.replace(/^./, (letter) =>
    letter.toUpperCase()
  );
}

function addWrappedText(operations, x, y, text, size, maxWidth, lineHeight) {
  const lines = wrapText(text, size, maxWidth);

  lines.forEach((line, index) => {
    operations.push(makeText(x, y - index * lineHeight, line, size));
  });

  return y - lines.length * lineHeight;
}

function buildPdfContent(quote) {
  const operations = [];
  let y = TOP;

  operations.push(makeFilledRect(LEFT, TOP - 76, RIGHT - LEFT, 84, [0.92, 0.96, 1], [0.7, 0.8, 0.9]));
  operations.push(makeBoldText(LEFT + 16, y - 6, COMPANY_NAME, 22));
  operations.push(makeText(LEFT + 16, y - 26, COMPANY_LINES[0], 10));
  operations.push(makeText(LEFT + 16, y - 40, COMPANY_LINES[1], 10));
  operations.push(makeText(LEFT + 16, y - 54, COMPANY_LINES[2], 10));

  operations.push(makeBoldText(RIGHT - 132, y - 6, "TEKLIF", 18));
  operations.push(makeText(RIGHT - 132, y - 28, `Teklif No: ${quote.quoteCode}`, 10));
  operations.push(makeText(RIGHT - 132, y - 42, `Tarih: ${formatDate(quote.createdAt || quote.createdAtLegacy)}`, 10));
  operations.push(makeText(RIGHT - 132, y - 56, `Gecerlilik: ${formatDate(quote.createdAt || quote.createdAtLegacy)}`, 10));
  y -= 102;

  operations.push(makeFilledRect(LEFT, y - 108, 236, 108, [0.985, 0.989, 0.997], [0.8, 0.84, 0.9]));
  operations.push(makeFilledRect(LEFT + 262, y - 108, 237, 108, [0.985, 0.989, 0.997], [0.8, 0.84, 0.9]));
  operations.push(makeBoldText(LEFT + 14, y - 18, "Musteri", 13));
  operations.push(makeBoldText(LEFT + 276, y - 18, "Proje Detaylari", 13));
  y -= 36;

  const customerLines = [
    quote.customer.name,
    quote.customer.attention ? `Yetkili: ${quote.customer.attention}` : "",
    quote.customer.address,
    `Tel: ${quote.customer.tel}`,
    quote.customer.email ? `E-posta: ${quote.customer.email}` : "",
    `Vergi Dairesi: ${quote.customer.taxOffice}`
  ].filter(Boolean);

  let customerY = y;
  customerLines.forEach((line) => {
    customerY = addWrappedText(operations, LEFT + 14, customerY, line, 10, 208, 13);
  });

  const projectLines = [
    `Malzeme: ${quote.materialNameSnapshot}`,
    `Kalinlik: ${formatNumber(quote.thicknessMm, " mm")}`,
    `Bukum Boyu: ${formatNumber(quote.bendLengthMm, " mm")}`,
    `Makine: ${quote.machineModelSnapshot}`,
    `Takim: ${quote.toolingNameSnapshot || "-"}`,
    `Opsiyon: ${(quote.selectedOptions || []).length}`
  ];

  let projectY = y;
  projectLines.forEach((line) => {
    projectY = addWrappedText(operations, LEFT + 276, projectY, line, 10, 209, 13);
  });

  y = Math.min(customerY, projectY) - 18;

  const tableTop = y;
  const columns = {
    code: LEFT,
    description: LEFT + 82,
    qty: RIGHT - 150,
    unitPrice: RIGHT - 102,
    amount: RIGHT - 48
  };

  operations.push(makeFilledRect(LEFT, tableTop - 18, RIGHT - LEFT, 20, [0.92, 0.96, 1], [0.72, 0.8, 0.9]));
  operations.push(makeBoldText(columns.code + 6, tableTop - 5, "Kod", 10));
  operations.push(makeBoldText(columns.description + 6, tableTop - 5, "Aciklama", 10));
  operations.push(makeBoldText(columns.qty, tableTop - 5, "Adet", 10));
  operations.push(makeBoldText(columns.unitPrice - 4, tableTop - 5, "Birim", 10));
  operations.push(makeBoldText(columns.amount - 12, tableTop - 5, "Tutar", 10));

  y = tableTop - 32;
  const items = buildItems(quote);
  for (const item of items) {
    const wrappedName = wrapText(item.name, 10, columns.qty - columns.description - 16);
    const rowHeight = Math.max(20, wrappedName.length * 13 + 8);

    operations.push(makeRect(LEFT, y - rowHeight + 6, RIGHT - LEFT, rowHeight, 0.7));
    operations.push(makeText(columns.code + 6, y - 8, item.code, 10));
    wrappedName.forEach((line, index) => {
      operations.push(makeText(columns.description + 6, y - 8 - index * 13, line, 10));
    });
    operations.push(makeText(columns.qty, y - 8, item.quantity, 10));
    operations.push(makeText(columns.unitPrice - textWidthEstimate(item.unitPrice, 10), y - 8, item.unitPrice, 10));
    operations.push(makeText(columns.amount - textWidthEstimate(item.amount, 10), y - 8, item.amount, 10));
    y -= rowHeight;
  }

  y -= 14;
  operations.push(makeFilledRect(RIGHT - 214, y - 64, 214, 64, [0.97, 0.98, 1], [0.72, 0.8, 0.9]));
  operations.push(makeText(RIGHT - 198, y - 16, `Makine Fiyati: ${formatCurrency(quote.machinePriceUsd)}`, 10));
  operations.push(makeText(RIGHT - 198, y - 32, `Opsiyon Toplami: ${formatCurrency(quote.optionsTotalUsd)}`, 10));
  operations.push(makeBoldText(RIGHT - 198, y - 50, `Genel Toplam: ${formatCurrency(quote.grandTotalUsd)}`, 13));
  y -= 84;

  operations.push(makeFilledRect(LEFT, y - 46, RIGHT - LEFT, 46, [0.985, 0.989, 0.997], [0.82, 0.86, 0.9]));
  operations.push(makeBoldText(LEFT + 12, y - 18, "Yaziyla Tutar", 11));
  addWrappedText(operations, LEFT + 132, y - 18, amountToWords(quote.grandTotalUsd), 10, RIGHT - LEFT - 144, 13);
  y -= 62;

  operations.push(makeFilledRect(LEFT, y - 96, RIGHT - LEFT, 96, [1, 1, 1], [0.8, 0.84, 0.9]));
  operations.push(makeBoldText(LEFT + 12, y - 18, "Diger Sartlar", 12));
  addWrappedText(
    operations,
    LEFT + 12,
    y - 38,
    quote.notes || "Standart ticari sartlar gecerlidir. Teslimat planlamasi, kurulum kapsami ve egitim detaylari siparis asamasinda netlestirilebilir.",
    10,
    RIGHT - LEFT - 24,
    13
  );

  operations.push(makeLine(LEFT, 54, RIGHT, 54, 0.8));
  operations.push(makeText(LEFT, 38, `${quote.customer.name} icin hazirlandi`, 9));
  operations.push(makeText(RIGHT - 126, 38, `Teklif ${quote.quoteCode}`, 9));

  return operations.join("\n");
}

function buildPdfBuffer(content) {
  const objects = [];

  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const contentLength = Buffer.byteLength(content, "utf8");
  const contentObjectId = addObject(`<< /Length ${contentLength} >>\nstream\n${content}\nendstream`);
  const fontObjectId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontObjectId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pagesObjectId = objects.length + 2;
  const pageObjectId = addObject(
    `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontObjectId} 0 R /F2 ${boldFontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`
  );
  const actualPagesObjectId = addObject(`<< /Type /Pages /Kids [${pageObjectId} 0 R] /Count 1 >>`);
  const catalogObjectId = addObject(`<< /Type /Catalog /Pages ${actualPagesObjectId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

export async function generateQuotePdf(id) {
  const quote = await getQuoteById(id);
  const content = buildPdfContent(quote);

  return {
    quote,
    buffer: buildPdfBuffer(content)
  };
}
