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

const COMPANY_NAME = "Tumex Mümessillik ve Dış Ticaret Ltd. Şti.";
const COMPANY_LINES = [
  "İvedik OSB Melih Gökçek Blv.",
  "63/33 Yenimahalle",
  "Ankara / Türkiye",
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
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function drawTumexLogo(doc, x, y) {
  doc.image(LOGO_PATH, x, y, {
    fit: [138, 60],
    align: "left",
    valign: "center"
  });
}

function drawInfoCard(doc, x, y, width, title, lines) {
  const innerWidth = width - 24;

  doc
    .save()
    .roundedRect(x, y, width, 112, 0)
    .fillAndStroke(COLORS.white, COLORS.border)
    .restore();

  doc.font(BOLD_FONT).fontSize(11).fillColor(COLORS.brandDark).text(title, x + 12, y + 12, { width: innerWidth });

  let cursorY = y + 34;
  for (const line of lines) {
    const cleaned = sanitizeText(line);
    if (!cleaned) {
      continue;
    }

    doc.font(REGULAR_FONT).fontSize(9.5).fillColor(COLORS.text).text(cleaned, x + 12, cursorY, {
      width: innerWidth,
      lineGap: 2
    });

    cursorY = doc.y + 4;
  }
}

function drawMetaCard(doc, x, y, width, quote) {
  const rowLabelX = x + 14;
  const rowValueX = x + width - 14;
  const createdAt = quote.createdAt || quote.createdAtLegacy;
  const validityDate = addDays(createdAt, 15);

  doc.rect(x, y, width, 88).fillAndStroke(COLORS.white, COLORS.border);
  doc.font(BOLD_FONT).fontSize(17).fillColor(COLORS.brandDark).text("TEKLİF", x + 14, y + 12, { lineBreak: false });

  const rows = [
    ["Teklif No", quote.quoteCode],
    ["Tarih", formatDate(createdAt)],
    ["Geçerlilik", formatDate(validityDate)]
  ];

  let rowY = y + 38;
  rows.forEach(([label, value]) => {
    doc.font(REGULAR_FONT).fontSize(8.5).fillColor(COLORS.muted).text(label, rowLabelX, rowY, { lineBreak: false });
    doc
      .font(BOLD_FONT)
      .fontSize(8.5)
      .fillColor(COLORS.text)
      .text(value, rowValueX - doc.widthOfString(value), rowY, { lineBreak: false });
    rowY += 16;
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

  doc.font(BOLD_FONT).fontSize(11).fillColor(COLORS.brandDark).text("Teklif Kalemleri", x, y - 18, { lineBreak: false });

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

  const headerHeight = 110;
  const headerY = PAGE_MARGIN;
  const metaWidth = 164;
  const brandWidth = CONTENT_WIDTH - metaWidth - 18;

  doc.rect(PAGE_MARGIN, headerY, brandWidth, headerHeight).fillAndStroke(COLORS.white, COLORS.border);
  doc.rect(PAGE_MARGIN + brandWidth + 18, headerY, metaWidth, headerHeight).fill(COLORS.brandDark);
  drawMetaCard(doc, PAGE_MARGIN + brandWidth + 28, headerY + 12, metaWidth - 20, quote);

  drawTumexLogo(doc, PAGE_MARGIN + 12, headerY + 22);
  doc.font(BOLD_FONT).fontSize(13).fillColor(COLORS.brandDark).text(COMPANY_NAME, PAGE_MARGIN + 164, headerY + 18, {
    width: brandWidth - 180
  });

  let companyY = headerY + 42;
  COMPANY_LINES.forEach((line) => {
    doc.font(REGULAR_FONT).fontSize(9).fillColor(COLORS.muted).text(line, PAGE_MARGIN + 164, companyY, {
      width: brandWidth - 180
    });
    companyY += 15;
  });

  doc.font(BOLD_FONT).fontSize(24).fillColor(COLORS.brandDark).text("Makine Teklifi", PAGE_MARGIN, headerY + 136, {
    lineBreak: false
  });
  doc.font(REGULAR_FONT).fontSize(10).fillColor(COLORS.muted).text(
    `${quote.customer.name} için hazırlanmış ticari teklif özeti`,
    PAGE_MARGIN,
    headerY + 166,
    { width: CONTENT_WIDTH }
  );

  const cardY = headerY + 198;
  const cardGap = 18;
  const cardWidth = (CONTENT_WIDTH - cardGap) / 2;
  drawInfoCard(doc, PAGE_MARGIN, cardY, cardWidth, "Müşteri Bilgileri", [
    quote.customer.name,
    quote.customer.attention ? `Dikkatine: ${quote.customer.attention}` : "",
    quote.customer.address,
    quote.customer.tel ? `Tel: ${quote.customer.tel}` : "",
    quote.customer.email ? `E-posta: ${quote.customer.email}` : "",
    quote.customer.taxOffice ? `Vergi Dairesi: ${quote.customer.taxOffice}` : ""
  ]);

  drawInfoCard(doc, PAGE_MARGIN + cardWidth + cardGap, cardY, cardWidth, "Proje Bilgileri", [
    `Malzeme: ${quote.materialNameSnapshot}`,
    `Kalınlık: ${formatNumber(quote.thicknessMm, " mm")}`,
    `Büküm Boyu: ${formatNumber(quote.bendLengthMm, " mm")}`,
    `Makine: ${quote.machineModelSnapshot}`,
    `Takım: ${quote.toolingNameSnapshot || "Standart"}`,
    `Opsiyon Sayısı: ${(quote.selectedOptions || []).length}`
  ]);

  const tableBottomY = drawTable(doc, PAGE_MARGIN, cardY + 140, CONTENT_WIDTH, buildItems(quote));

  const notesY = tableBottomY + 12;
  const totalsWidth = 168;
  const notesWidth = CONTENT_WIDTH - totalsWidth - 16;

  doc.rect(PAGE_MARGIN, notesY, notesWidth, 108).fillAndStroke(COLORS.white, COLORS.border);
  doc.font(BOLD_FONT).fontSize(11).fillColor(COLORS.brandDark).text("Diğer Şartlar", PAGE_MARGIN + 12, notesY + 12);
  doc.font(REGULAR_FONT).fontSize(9).fillColor(COLORS.text).text(
    quote.notes ||
      "Standart ticari şartlar geçerlidir. Teslimat planlaması, kurulum kapsamı ve eğitim detayları sipariş aşamasında netleştirilebilir.",
    PAGE_MARGIN + 12,
    notesY + 34,
    { width: notesWidth - 24, lineGap: 3 }
  );

  const totalsX = PAGE_MARGIN + notesWidth + 16;
  doc.rect(totalsX, notesY, totalsWidth, 108).fillAndStroke(COLORS.panel, COLORS.border);
  doc.font(BOLD_FONT).fontSize(11).fillColor(COLORS.brandDark).text("Toplam", totalsX + 12, notesY + 12);

  const totalRows = [
    ["Makine Fiyatı", formatCurrency(quote.machinePriceUsd)],
    ["Opsiyon Toplamı", formatCurrency(quote.optionsTotalUsd)]
  ];

  let totalsY = notesY + 40;
  totalRows.forEach(([label, value]) => {
    doc.font(REGULAR_FONT).fontSize(8.5).fillColor(COLORS.muted).text(label, totalsX + 12, totalsY);
    doc.font(REGULAR_FONT).fontSize(9).fillColor(COLORS.text).text(value, totalsX + 12, totalsY, {
      width: totalsWidth - 24,
      align: "right"
    });
    totalsY += 18;
  });

  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(totalsX + 12, totalsY + 2)
    .lineTo(totalsX + totalsWidth - 12, totalsY + 2)
    .stroke();

  doc.font(BOLD_FONT).fontSize(10).fillColor(COLORS.brandDark).text("Genel Toplam", totalsX + 12, totalsY + 12);
  doc.font(BOLD_FONT).fontSize(13).fillColor(COLORS.brandDark).text(formatCurrency(quote.grandTotalUsd), totalsX + 12, totalsY + 10, {
    width: totalsWidth - 24,
    align: "right"
  });

  const wordsY = notesY + 126;
  doc.rect(PAGE_MARGIN, wordsY, CONTENT_WIDTH, 56).fillAndStroke(COLORS.panelAlt, COLORS.border);
  doc.font(BOLD_FONT).fontSize(10.5).fillColor(COLORS.brandDark).text("Yazıyla Tutar", PAGE_MARGIN + 12, wordsY + 18);
  doc.font(REGULAR_FONT).fontSize(9).fillColor(COLORS.text).text(amountToWords(quote.grandTotalUsd), PAGE_MARGIN + 130, wordsY + 18, {
    width: CONTENT_WIDTH - 142
  });

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
