import PDFDocument from "pdfkit";
import { fileURLToPath } from "node:url";

import { getQuoteById } from "./quoteService.js";

const PAGE_MARGIN = 42;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const COLORS = {
  brand: "#2563eb",
  brandDark: "#16315f",
  text: "#18212f",
  muted: "#5e6b7f",
  border: "#d7dfeb",
  panel: "#f5f8fc",
  panelAlt: "#edf3ff",
  white: "#ffffff"
};

const COMPANY_NAME = "Tumex Mümessillik ve Dış Tic. Ltd. Şti.";
const COMPANY_LINES = [
  "İvedik OSB Melih Gökçek Blv.",
  "63/33 Yenimahalle Ankara / Türkiye",
  "info@tum-ex.com  |  +90 530 712 4897"
];

const REGULAR_FONT = fileURLToPath(new URL("../../assets/fonts/Verdana.ttf", import.meta.url));
const BOLD_FONT = fileURLToPath(new URL("../../assets/fonts/Verdana-Bold.ttf", import.meta.url));
const LOGO_PATH = fileURLToPath(new URL("../../assets/tumex-logo.png", import.meta.url));

function sanitizeText(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .trim();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatOfferCurrency(value) {
  const amount = Number(value || 0);

  if (Number.isInteger(amount)) {
    return `${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)}.-`;
  }

  return formatCurrency(amount);
}

function formatNumber(value, suffix = "") {
  const parsed = Number(value || 0);
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(parsed)}${suffix}`;
}

function formatDate(value) {
  const parsed = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("tr-TR").format(parsed);
}

function formatDateCompact(value) {
  const parsed = value ? new Date(value) : new Date();
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function buildCustomerCode(name) {
  const normalized = sanitizeText(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const firstWord = normalized
    .split(/[^a-z0-9]+/)
    .find(Boolean);

  return `${firstWord || "musteri"}-01`;
}

function splitAddressIntoTwoLines(address) {
  const cleaned = sanitizeText(address);

  if (!cleaned) {
    return ["", ""];
  }

  const explicitLines = String(address)
    .split(/\n+/)
    .map((line) => sanitizeText(line))
    .filter(Boolean);

  if (explicitLines.length >= 2) {
    return [explicitLines[0], explicitLines.slice(1).join(" ")];
  }

  const breakHints = [" No:", " No ", " Mah.", " Mah ", " Sok.", " Sok ", " Blv.", " Blv ", " Bulvarı ", " Caddesi "];

  for (const hint of breakHints) {
    const index = cleaned.indexOf(hint);
    if (index > 12) {
      const splitIndex = index + hint.length;
      return [
        cleaned.slice(0, splitIndex).trim(),
        cleaned.slice(splitIndex).trim()
      ];
    }
  }

  const words = cleaned.split(/\s+/);
  const midpoint = Math.ceil(words.length / 2);
  return [
    words.slice(0, midpoint).join(" "),
    words.slice(midpoint).join(" ")
  ];
}

function addDays(value, days) {
  const parsed = value ? new Date(value) : new Date();
  parsed.setDate(parsed.getDate() + days);
  return parsed;
}

function buildItems(quote) {
  const items = [
    {
      code: quote.machineModelSnapshot,
      name: "Ana Makine",
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
    return remainder ? `${tens[Math.floor(number / 10)]} ${ones[remainder]}` : tens[Math.floor(number / 10)];
  }

  if (number < 1000) {
    const hundreds = Math.floor(number / 100);
    const remainder = number % 100;
    const prefix = hundreds === 1 ? "yüz" : `${ones[hundreds]} yüz`;
    return remainder ? `${prefix} ${integerToWords(remainder)}` : prefix;
  }

  if (number < 1000000) {
    const thousands = Math.floor(number / 1000);
    const remainder = number % 1000;
    const prefix = thousands === 1 ? "bin" : `${integerToWords(thousands)} bin`;
    return remainder ? `${prefix} ${integerToWords(remainder)}` : prefix;
  }

  const millions = Math.floor(number / 1000000);
  const remainder = number % 1000000;
  const prefix = `${integerToWords(millions)} milyon`;
  return remainder ? `${prefix} ${integerToWords(remainder)}` : prefix;
}

function amountToWords(value) {
  const amount = Number(value || 0);
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  const parts = [`${integerToWords(Math.max(dollars, 0))} Amerika Birleşik Devletleri Doları`];

  if (cents > 0) {
    parts.push(`${integerToWords(cents)} sent`);
  }

  const text = parts.join(" ve ");
  return `Yalnız ${text.charAt(0).toUpperCase() + text.slice(1)}.`;
}

function drawTumexLogo(doc, x, y) {
  doc.image(LOGO_PATH, x, y, {
    fit: [116, 50],
    align: "left",
    valign: "center"
  });
}

function drawAttentionSection(doc, x, y, width, customer) {
  const lineWidth = width - 12;
  const rowHeight = 18;
  const textOffsetY = 4;
  const [addressLineOne, addressLineTwo] = splitAddressIntoTwoLines(customer.address || "");

  const attentionLines = [
    { text: customer.attention ? `Sn. ${customer.attention}` : "Sn.", align: "left", indent: 0 },
    { text: customer.name || "", align: "left", indent: 0 },
    { text: addressLineOne, align: "left", indent: 0 },
    { text: addressLineTwo, align: "left", indent: 0 },
    { text: `Tel: ${customer.tel || ""} | E-posta: ${customer.email || ""}`, align: "left", indent: 0 },
    { text: `Vergi Dairesi: ${customer.taxOffice || ""}`, align: "left", indent: 0 }
  ];

  doc.font(REGULAR_FONT).fontSize(9).fillColor("#111111").text("DİKKATİNE:", x, y, {
    width,
    lineBreak: false
  });
  doc
    .strokeColor("#8f8f8f")
    .lineWidth(0.8)
    .moveTo(x, y + 14)
    .lineTo(x + lineWidth, y + 14)
    .stroke();

  let rowY = y + rowHeight;
  attentionLines.forEach(({ text, align, indent = 0 }) => {
    const cleaned = sanitizeText(text);
    const isAddressLine = cleaned === addressLineOne || cleaned === addressLineTwo;
    const fontSize = isAddressLine ? 8.6 : 9;
    const textOptions = {
      width: lineWidth - indent,
      lineBreak: false,
      align
    };

    doc
      .font(REGULAR_FONT)
      .fontSize(fontSize)
      .fillColor("#111111")
      .text(cleaned, x + indent, rowY + textOffsetY, textOptions);

    const dividerY = rowY + rowHeight - 2;
    doc
      .strokeColor("#8f8f8f")
      .lineWidth(0.8)
      .moveTo(x, dividerY)
      .lineTo(x + lineWidth, dividerY)
      .stroke();

    rowY += rowHeight;
  });

  return rowY;
}

function drawMetaCard(doc, x, y, width, quote) {
  const createdAt = quote.createdAt || quote.createdAtLegacy;
  const validityDate = addDays(createdAt, 15);
  const tableX = x + 10;
  const tableY = y + 34;
  const rowHeight = 15.5;
  const labelWidth = 70;
  const valueWidth = width - labelWidth - 10;

  const rows = [
    ["TARİH", formatDateCompact(createdAt)],
    ["TEKLİF #", quote.quoteCode],
    ["GEÇERLİLİK", formatDateCompact(validityDate)],
    ["MÜŞTERİ #", buildCustomerCode(quote.customer.name)]
  ];

  doc.font(BOLD_FONT).fontSize(18).fillColor("#111111");
  const titleWidth = doc.widthOfString("TEKLİF");
  doc.text("TEKLİF", x + width - titleWidth, y + 2, { lineBreak: false });

  doc.save();
  doc.lineWidth(0.8).strokeColor("#b8b8b8");
  doc.rect(tableX + labelWidth, tableY, valueWidth, rowHeight * rows.length).stroke();
  for (let index = 1; index < rows.length; index += 1) {
    const rowY = tableY + rowHeight * index;
    doc.moveTo(tableX + labelWidth, rowY).lineTo(tableX + labelWidth + valueWidth, rowY).stroke();
  }
  doc.restore();

  rows.forEach(([label, value], index) => {
    const rowY = tableY + index * rowHeight + 4;
    doc.font(REGULAR_FONT).fontSize(8.5).fillColor("#111111").text(label, tableX, rowY, {
      width: labelWidth - 6,
      align: "right",
      lineBreak: false
    });
    doc
      .font(REGULAR_FONT)
      .fontSize(8.5)
      .fillColor("#111111")
      .text(value, tableX + labelWidth + 8, rowY, {
        width: valueWidth - 16,
        align: "center",
        lineBreak: false
      });
  });
}

function drawTable(doc, x, y, width, items) {
  const columns = {
    code: 105,
    name: 190,
    qty: 48,
    unitPrice: 84,
    amount: 84
  };
  const columnX = {
    code: x + 12,
    name: x + columns.code,
    qty: x + columns.code + columns.name,
    unitPrice: x + columns.code + columns.name + columns.qty,
    amount: x + columns.code + columns.name + columns.qty + columns.unitPrice
  };

  doc.rect(x, y, width, 24).fillAndStroke(COLORS.panelAlt, COLORS.border);
  doc.font(BOLD_FONT).fontSize(8.5).fillColor(COLORS.brandDark);
  doc.text("Model", columnX.code, y + 8, { lineBreak: false });
  doc.text("Ürün Adı", columnX.name, y + 8, { lineBreak: false });
  doc.text("Miktar", columnX.qty, y + 8, { lineBreak: false });
  doc.text("Birim Fiyat", columnX.unitPrice, y + 8, { lineBreak: false });
  doc.text("Tutar", columnX.amount, y + 8, { lineBreak: false });

  let cursorY = y + 30;
  items.forEach((item, index) => {
    const fillColor = index % 2 === 0 ? COLORS.white : COLORS.panel;
    const rowTop = cursorY;
    const itemHeight = Math.max(
      28,
      doc.heightOfString(item.name, { width: columns.name - 18, align: "left" }) + 14
    );

    doc.rect(x, rowTop, width, itemHeight).fillAndStroke(fillColor, COLORS.border);
    doc.font(BOLD_FONT).fontSize(9).fillColor(COLORS.brandDark).text(item.code, columnX.code, rowTop + 9, {
      width: columns.code - 16
    });
    doc.font(REGULAR_FONT).fontSize(9).fillColor(COLORS.text).text(item.name, columnX.name, rowTop + 9, {
      width: columns.name - 18
    });
    doc.text(item.quantity, columnX.qty, rowTop + 9, { width: columns.qty - 8 });
    doc.text(item.unitPrice, columnX.unitPrice, rowTop + 9, {
      width: columns.unitPrice - 8,
      align: "right"
    });
    doc.font(BOLD_FONT).text(item.amount, columnX.amount, rowTop + 9, {
      width: columns.amount - 12,
      align: "right"
    });

    cursorY += itemHeight + 6;
  });

  return cursorY;
}

function drawFooter(doc, quote) {
  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(PAGE_MARGIN, PAGE_HEIGHT - 56)
    .lineTo(PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 56)
    .stroke();

  doc.font(REGULAR_FONT).fontSize(8).fillColor(COLORS.muted);
  doc.text(`${quote.customer.name} için hazırlandı`, PAGE_MARGIN, PAGE_HEIGHT - 44, { lineBreak: false });

  const footerText = `Teklif ${quote.quoteCode}`;
  doc.text(footerText, PAGE_WIDTH - PAGE_MARGIN - doc.widthOfString(footerText), PAGE_HEIGHT - 44, { lineBreak: false });
}

function buildPdfBuffer(quote) {
  const doc = new PDFDocument({
    size: "A4",
    margins: {
      top: PAGE_MARGIN,
      bottom: PAGE_MARGIN,
      left: PAGE_MARGIN,
      right: PAGE_MARGIN
    },
    bufferPages: true,
    autoFirstPage: true
  });

  doc.registerFont("tumex-regular", REGULAR_FONT);
  doc.registerFont("tumex-bold", BOLD_FONT);

  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(COLORS.white);

  const headerHeight = 108;
  const headerY = PAGE_MARGIN;
  const metaWidth = 208;
  const brandWidth = CONTENT_WIDTH - metaWidth - 12;

  drawMetaCard(doc, PAGE_MARGIN + brandWidth + 8, headerY + 18, metaWidth, quote);

  const logoX = PAGE_MARGIN + 10;
  const logoY = headerY + 10;
  const textX = PAGE_MARGIN + 8;
  const textWidth = brandWidth - 16;

  drawTumexLogo(doc, logoX, logoY);
  doc.font(BOLD_FONT).fontSize(8.9).fillColor("#111111").text(COMPANY_NAME, textX, headerY + 60, {
    width: textWidth,
    lineBreak: false
  });

  let companyY = headerY + 76;
  COMPANY_LINES.forEach((line) => {
    doc.font(REGULAR_FONT).fontSize(8.8).fillColor("#111111").text(line, textX, companyY, {
      width: textWidth,
      lineGap: 0.5
    });
    companyY = doc.y + 2;
  });

  const dividerY = Math.max(companyY + 8, headerY + 104);

  doc
    .strokeColor("#111111")
    .lineWidth(0.8)
    .moveTo(PAGE_MARGIN, dividerY)
    .lineTo(PAGE_WIDTH - PAGE_MARGIN, dividerY)
    .stroke();

  const attentionBottomY = drawAttentionSection(doc, PAGE_MARGIN, dividerY + 16, CONTENT_WIDTH * 0.52, quote.customer);

  const tableBottomY = drawTable(doc, PAGE_MARGIN, attentionBottomY + 18, CONTENT_WIDTH, buildItems(quote));

  const totalsY = tableBottomY + 12;
  doc.rect(PAGE_MARGIN, totalsY, CONTENT_WIDTH, 22).fillAndStroke(COLORS.white, COLORS.border);
  doc.font(BOLD_FONT).fontSize(10).fillColor("#111111").text("GENEL TOPLAM", PAGE_MARGIN + CONTENT_WIDTH - 184, totalsY + 6, {
    width: 110,
    align: "right",
    lineBreak: false
  });
  doc.font(BOLD_FONT).fontSize(10).fillColor("#111111").text(formatOfferCurrency(quote.grandTotalUsd), PAGE_MARGIN + CONTENT_WIDTH - 68, totalsY + 6, {
    width: 60,
    align: "right",
    lineBreak: false
  });

  const wordsY = totalsY + 22;
  doc.rect(PAGE_MARGIN, wordsY, CONTENT_WIDTH, 22).fillAndStroke(COLORS.white, COLORS.border);
  doc.font(REGULAR_FONT).fontSize(8.7).fillColor("#111111").text(amountToWords(quote.grandTotalUsd), PAGE_MARGIN + 10, wordsY + 6, {
    width: CONTENT_WIDTH - 20,
    align: "right",
    lineBreak: false
  });

  const notesY = wordsY + 30;
  const notesHeight = 126;
  doc.rect(PAGE_MARGIN, notesY, CONTENT_WIDTH, notesHeight).fillAndStroke(COLORS.white, COLORS.border);
  doc.font(BOLD_FONT).fontSize(11).fillColor("#111111").text("Diğer Şartlar", PAGE_MARGIN + 6, notesY + 6, {
    lineBreak: false
  });
  doc
    .strokeColor(COLORS.border)
    .lineWidth(0.8)
    .moveTo(PAGE_MARGIN, notesY + 20)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, notesY + 20)
    .stroke();

  if (sanitizeText(quote.notes)) {
    doc.font(REGULAR_FONT).fontSize(8.8).fillColor("#111111").text(
      sanitizeText(quote.notes),
      PAGE_MARGIN + 8,
      notesY + 28,
      { width: CONTENT_WIDTH - 16, lineGap: 2 }
    );
  }

  drawFooter(doc, quote);
  doc.end();

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function generateQuotePdf(id, user) {
  const quote = await getQuoteById(id, user);
  const buffer = await buildPdfBuffer(quote);

  return {
    quote,
    buffer
  };
}
