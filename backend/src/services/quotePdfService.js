import { getQuoteById } from "./quoteService.js";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LEFT = 48;
const RIGHT = PAGE_WIDTH - 48;
const TOP = PAGE_HEIGHT - 48;
const COMPANY_NAME = "Tumex Mümessillik ve Dış Ticaret Ltd. Şti.";
const COMPANY_LINES = [
  "Birlik Mah. 408. Sok. No:9/2 Evkur Birlik Apt.",
  "Çankaya / Ankara",
  "info@tum-ex.com  |  +90 530 712 4897"
];
const BRAND = [0.12, 0.34, 0.69];
const BRAND_DARK = [0.08, 0.18, 0.34];
const INK = [0.11, 0.15, 0.23];
const MUTED = [0.38, 0.45, 0.54];
const BORDER = [0.79, 0.84, 0.9];
const PANEL = [0.97, 0.98, 0.995];
const PANEL_ALT = [0.94, 0.96, 0.99];
const WHITE = [1, 1, 1];

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
  return new Intl.DateTimeFormat("tr-TR").format(parsed);
}

function addDays(value, days) {
  const parsed = value ? new Date(value) : new Date();
  parsed.setDate(parsed.getDate() + days);
  return parsed;
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

function colorCommands(rgb, mode = "rg") {
  return `${rgb[0]} ${rgb[1]} ${rgb[2]} ${mode}`;
}

function makeTextWithFont(font, x, y, text, size = 11, fillRgb = INK) {
  return `BT /${font} ${size} Tf ${colorCommands(fillRgb)} 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET 0 0 0 rg`;
}

function makeText(x, y, text, size = 11, fillRgb = INK) {
  return makeTextWithFont("F1", x, y, text, size, fillRgb);
}

function makeBoldText(x, y, text, size = 11, fillRgb = INK) {
  return makeTextWithFont("F2", x, y, text, size, fillRgb);
}

function makeRightText(x, y, text, size = 11, fillRgb = INK, bold = false) {
  const width = textWidthEstimate(text, size);
  return bold
    ? makeBoldText(x - width, y, text, size, fillRgb)
    : makeText(x - width, y, text, size, fillRgb);
}

function makeLine(x1, y1, x2, y2, width = 1) {
  return `${width} w ${x1} ${y1} m ${x2} ${y2} l S`;
}

function makePolyline(points, width = 1, strokeRgb = INK) {
  if (!points.length) {
    return "";
  }

  const [first, ...rest] = points;
  return `${colorCommands(strokeRgb, "RG")} ${width} w ${first[0]} ${first[1]} m ${rest
    .map(([x, y]) => `${x} ${y} l`)
    .join(" ")} S 0 0 0 RG`;
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
      code: "MAKİNE",
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
    "sıfır",
    "bir",
    "iki",
    "üç",
    "dört",
    "beş",
    "altı",
    "yedi",
    "sekiz",
    "dokuz",
    "on",
    "on bir",
    "on iki",
    "on üç",
    "on dört",
    "on beş",
    "on altı",
    "on yedi",
    "on sekiz",
    "on dokuz"
  ];
  const tens = ["", "", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];

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
      ? `${ones[Math.floor(number / 100)]} yüz ${integerToWords(remainder)}`
      : `${ones[Math.floor(number / 100)]} yüz`;
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

function addTumexLogo(operations, x, y) {
  const outer = [
    [x, y],
    [x + 38, y + 20],
    [x + 76, y],
    [x + 38, y - 20],
    [x, y]
  ];
  const inner = [
    [x + 17, y],
    [x + 38, y + 11],
    [x + 59, y],
    [x + 38, y - 11],
    [x + 17, y]
  ];

  operations.push(makePolyline(outer, 4.8, [0.24, 0.4, 0.95]));
  operations.push(makePolyline(inner, 2.4, [0.24, 0.4, 0.95]));
  operations.push(makeBoldText(x + 13, y - 5, "tumex", 16, [0.24, 0.4, 0.95]));
}

function buildPdfContent(quote) {
  const operations = [];
  const createdAt = quote.createdAt || quote.createdAtLegacy;
  const validityDate = addDays(createdAt, 15);

  operations.push(makeFilledRect(LEFT, TOP - 110, RIGHT - LEFT, 110, BRAND_DARK, BRAND_DARK));
  operations.push(makeFilledRect(LEFT, TOP - 110, 260, 110, WHITE, WHITE));
  addTumexLogo(operations, LEFT + 16, TOP - 38);
  operations.push(makeBoldText(LEFT + 108, TOP - 28, COMPANY_NAME, 13, BRAND_DARK));
  operations.push(makeText(LEFT + 108, TOP - 46, COMPANY_LINES[0], 9, MUTED));
  operations.push(makeText(LEFT + 108, TOP - 60, COMPANY_LINES[1], 9, MUTED));
  operations.push(makeText(LEFT + 108, TOP - 74, COMPANY_LINES[2], 9, MUTED));

  const metaX = RIGHT - 164;
  operations.push(makeFilledRect(metaX, TOP - 88, 164, 72, WHITE, BORDER));
  operations.push(makeBoldText(metaX + 12, TOP - 34, "TEKLİF", 18, BRAND_DARK));
  operations.push(makeText(metaX + 12, TOP - 52, `Teklif No`, 9, MUTED));
  operations.push(makeRightText(metaX + 150, TOP - 52, quote.quoteCode, 9, INK, true));
  operations.push(makeText(metaX + 12, TOP - 66, `Tarih`, 9, MUTED));
  operations.push(makeRightText(metaX + 150, TOP - 66, formatDate(createdAt), 9, INK));
  operations.push(makeText(metaX + 12, TOP - 80, `Geçerlilik`, 9, MUTED));
  operations.push(makeRightText(metaX + 150, TOP - 80, formatDate(validityDate), 9, INK));

  operations.push(makeBoldText(LEFT, TOP - 142, "Makine Teklifi", 23, BRAND_DARK));
  operations.push(
    makeText(
      LEFT,
      TOP - 160,
      `${quote.customer.name} için hazırlanmış ticari teklif özeti`,
      10,
      MUTED
    )
  );

  let y = TOP - 188;
  const leftCardWidth = 254;
  const rightCardX = LEFT + leftCardWidth + 20;
  const rightCardWidth = RIGHT - rightCardX;

  operations.push(makeFilledRect(LEFT, y - 118, leftCardWidth, 118, PANEL, BORDER));
  operations.push(makeFilledRect(rightCardX, y - 118, rightCardWidth, 118, PANEL, BORDER));
  operations.push(makeBoldText(LEFT + 14, y - 18, "Müşteri Bilgileri", 12, BRAND_DARK));
  operations.push(makeBoldText(rightCardX + 14, y - 18, "Proje Bilgileri", 12, BRAND_DARK));

  const customerLines = [
    quote.customer.name,
    quote.customer.attention ? `Dikkatine: ${quote.customer.attention}` : "",
    quote.customer.address,
    quote.customer.tel ? `Tel: ${quote.customer.tel}` : "",
    quote.customer.email ? `E-posta: ${quote.customer.email}` : "",
    quote.customer.taxOffice ? `Vergi Dairesi: ${quote.customer.taxOffice}` : ""
  ].filter(Boolean);

  let customerY = y - 38;
  customerLines.forEach((line) => {
    customerY = addWrappedText(operations, LEFT + 14, customerY, line, 10, leftCardWidth - 28, 13);
  });

  const projectLines = [
    `Malzeme: ${quote.materialNameSnapshot}`,
    `Kalınlık: ${formatNumber(quote.thicknessMm, " mm")}`,
    `Büküm Boyu: ${formatNumber(quote.bendLengthMm, " mm")}`,
    `Makine: ${quote.machineModelSnapshot}`,
    `Takım: ${quote.toolingNameSnapshot || "Standart"}`,
    `Opsiyon Sayısı: ${(quote.selectedOptions || []).length}`
  ];

  let projectY = y - 38;
  projectLines.forEach((line) => {
    projectY = addWrappedText(operations, rightCardX + 14, projectY, line, 10, rightCardWidth - 28, 13);
  });

  y -= 146;
  const tableTop = y;
  const columns = {
    code: LEFT,
    description: LEFT + 90,
    qty: RIGHT - 172,
    unitPrice: RIGHT - 112,
    amount: RIGHT - 24
  };

  operations.push(makeBoldText(LEFT, tableTop + 12, "Teklif Kalemleri", 12, BRAND_DARK));
  operations.push(makeFilledRect(LEFT, tableTop - 18, RIGHT - LEFT, 24, PANEL_ALT, BORDER));
  operations.push(makeBoldText(columns.code + 8, tableTop - 2, "Model", 9, BRAND_DARK));
  operations.push(makeBoldText(columns.description + 8, tableTop - 2, "Ürün Adı", 9, BRAND_DARK));
  operations.push(makeBoldText(columns.qty + 2, tableTop - 2, "Miktar", 9, BRAND_DARK));
  operations.push(makeBoldText(columns.unitPrice - 8, tableTop - 2, "Birim Fiyat", 9, BRAND_DARK));
  operations.push(makeBoldText(columns.amount - 28, tableTop - 2, "Tutar", 9, BRAND_DARK));

  y = tableTop - 34;
  const items = buildItems(quote);
  items.forEach((item, index) => {
    const wrappedName = wrapText(item.name, 10, columns.qty - columns.description - 16);
    const rowHeight = Math.max(24, wrappedName.length * 13 + 10);

    if (index % 2 === 0) {
      operations.push(makeFilledRect(LEFT, y - rowHeight + 6, RIGHT - LEFT, rowHeight, WHITE, BORDER));
    } else {
      operations.push(makeFilledRect(LEFT, y - rowHeight + 6, RIGHT - LEFT, rowHeight, PANEL, BORDER));
    }

    operations.push(makeBoldText(columns.code + 8, y - 10, item.code, 10, BRAND_DARK));
    wrappedName.forEach((line, index) => {
      operations.push(makeText(columns.description + 8, y - 10 - index * 13, line, 10));
    });
    operations.push(makeText(columns.qty + 6, y - 10, item.quantity, 10));
    operations.push(makeRightText(columns.unitPrice + 44, y - 10, item.unitPrice, 10));
    operations.push(makeRightText(columns.amount + 12, y - 10, item.amount, 10, INK, true));
    y -= rowHeight;
  });

  y -= 18;
  const notesWidth = RIGHT - LEFT - 186;
  operations.push(makeFilledRect(LEFT, y - 112, notesWidth, 112, WHITE, BORDER));
  operations.push(makeFilledRect(LEFT + notesWidth + 16, y - 112, 170, 112, PANEL_ALT, BORDER));
  operations.push(makeBoldText(LEFT + 12, y - 18, "Diğer Şartlar", 12, BRAND_DARK));
  addWrappedText(
    operations,
    LEFT + 12,
    y - 38,
    quote.notes || "Standart ticari şartlar geçerlidir. Teslimat planlaması, kurulum kapsamı ve eğitim detayları sipariş aşamasında netleştirilebilir.",
    10,
    notesWidth - 24,
    13
  );
  operations.push(makeBoldText(LEFT + notesWidth + 28, y - 18, "Toplam", 12, BRAND_DARK));
  operations.push(makeText(LEFT + notesWidth + 28, y - 40, "Makine Fiyatı", 9, MUTED));
  operations.push(makeRightText(RIGHT - 12, y - 40, formatCurrency(quote.machinePriceUsd), 10));
  operations.push(makeText(LEFT + notesWidth + 28, y - 58, "Opsiyon Toplamı", 9, MUTED));
  operations.push(makeRightText(RIGHT - 12, y - 58, formatCurrency(quote.optionsTotalUsd), 10));
  operations.push(makeLine(LEFT + notesWidth + 28, y - 68, RIGHT - 12, y - 68, 0.8));
  operations.push(makeText(LEFT + notesWidth + 28, y - 86, "Genel Toplam", 10, BRAND_DARK));
  operations.push(makeRightText(RIGHT - 12, y - 86, formatCurrency(quote.grandTotalUsd), 14, BRAND_DARK, true));
  y -= 128;

  operations.push(makeFilledRect(LEFT, y - 54, RIGHT - LEFT, 54, PANEL, BORDER));
  operations.push(makeBoldText(LEFT + 12, y - 20, "Yazıyla Tutar", 11, BRAND_DARK));
  addWrappedText(operations, LEFT + 128, y - 20, amountToWords(quote.grandTotalUsd), 10, RIGHT - LEFT - 140, 13);
  y -= 72;

  operations.push(makeLine(LEFT, 60, RIGHT, 60, 0.8));
  operations.push(makeText(LEFT, 42, `${quote.customer.name} için hazırlandı`, 9, MUTED));
  operations.push(makeRightText(RIGHT, 42, `Teklif ${quote.quoteCode}`, 9, MUTED));

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

export async function generateQuotePdf(id, user) {
  const quote = await getQuoteById(id, user);
  const content = buildPdfContent(quote);

  return {
    quote,
    buffer: buildPdfBuffer(content)
  };
}
