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

function normalizeMultilineText(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

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

function formatCurrencyByCode(value, currencyCode = "USD") {
  if (currencyCode === "TRY") {
    const amount = Number(value || 0);
    const formattedNumber = new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `TL ${formattedNumber}`;
  }

  return new Intl.NumberFormat(currencyCode === "TRY" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatOfferCurrency(value, currencyCode = "USD") {
  const amount = Number(value || 0);

  if (currencyCode === "TRY") {
    return formatCurrencyByCode(amount, "TRY");
  }

  if (Number.isInteger(amount)) {
    return `${new Intl.NumberFormat(currencyCode === "TRY" ? "tr-TR" : "en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)}.-`;
  }

  return formatCurrencyByCode(amount, currencyCode);
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

function keepColonValueTogether(firstLine, secondLine) {
  if (!firstLine || !secondLine) {
    return [firstLine, secondLine];
  }

  const normalizedFirstLine = firstLine.trim();
  const normalizedSecondLine = secondLine.trim();

  if (!/:$/.test(normalizedFirstLine) && !/\b[^ ]*:\s*$/.test(normalizedFirstLine)) {
    return [normalizedFirstLine, normalizedSecondLine];
  }

  const [nextToken, ...restTokens] = normalizedSecondLine.split(/\s+/);
  if (!nextToken) {
    return [normalizedFirstLine, normalizedSecondLine];
  }

  return [
    `${normalizedFirstLine}${nextToken}`,
    restTokens.join(" ").trim()
  ];
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
      return keepColonValueTogether(
        cleaned.slice(0, splitIndex).trim(),
        cleaned.slice(splitIndex).trim()
      );
    }
  }

  const words = cleaned.split(/\s+/);
  const midpoint = Math.ceil(words.length / 2);
  return keepColonValueTogether(
    words.slice(0, midpoint).join(" "),
    words.slice(midpoint).join(" ")
  );
}

function addDays(value, days) {
  const parsed = value ? new Date(value) : new Date();
  parsed.setDate(parsed.getDate() + days);
  return parsed;
}

function buildItems(quote) {
  if (quote.documentType === "service_proforma") {
    return [
      {
        code: "SERVİS",
        name: quote.serviceDescription || "Yapılacak iş",
        quantity: "1",
        unitPrice: formatCurrencyByCode(quote.grandTotalUsd, quote.currencyCode),
        amount: formatCurrencyByCode(quote.grandTotalUsd, quote.currencyCode)
      }
    ];
  }

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

function amountToWordsByCurrency(value, currencyCode = "USD") {
  if (currencyCode === "TRY") {
    const amount = Number(value || 0);
    const lira = Math.floor(amount);
    const kurus = Math.round((amount - lira) * 100);
    const parts = [`${integerToWords(Math.max(lira, 0))} Türk Lirası`];

    if (kurus > 0) {
      parts.push(`${integerToWords(kurus)} kuruş`);
    }

    const text = parts.join(" ve ");
    return `Yalnız ${text.charAt(0).toUpperCase() + text.slice(1)}.`;
  }

  return amountToWords(value);
}

function drawTumexLogo(doc, x, y) {
  doc.image(LOGO_PATH, x, y, {
    fit: [116, 50],
    align: "left",
    valign: "center"
  });
}

function tokenizeForWrapping(text) {
  const tokens = sanitizeText(text).split(/\s+/).filter(Boolean);
  const mergedTokens = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const current = tokens[index];
    const next = tokens[index + 1];

    if (current?.endsWith(":") && next) {
      mergedTokens.push(`${current}\u00A0${next}`);
      index += 1;
      continue;
    }

    mergedTokens.push(current);
  }

  return mergedTokens;
}

function wrapTextToRows(doc, text, maxWidth, fontSize) {
  const tokens = tokenizeForWrapping(text);
  const rows = [];

  doc.font(REGULAR_FONT).fontSize(fontSize);

  let currentRow = "";
  tokens.forEach((token) => {
    const candidate = currentRow ? `${currentRow} ${token}` : token;

    if (!currentRow || doc.widthOfString(candidate) <= maxWidth) {
      currentRow = candidate;
      return;
    }

    rows.push(currentRow);
    currentRow = token;
  });

  if (currentRow) {
    rows.push(currentRow);
  }

  return rows;
}

function buildAttentionLines(doc, customer, lineWidth) {
  const lines = [];
  const pushWrappedRows = (text, fontSize, extra = {}) => {
    wrapTextToRows(doc, text, lineWidth, fontSize).forEach((row) => {
      lines.push({ text: row, fontSize, ...extra });
    });
  };

  pushWrappedRows(customer.attention ? `Sn. ${customer.attention}` : "Sn.", 9.2, {
    fontName: BOLD_FONT,
    color: COLORS.brandDark
  });
  pushWrappedRows(customer.name || "", 9, {
    fontName: BOLD_FONT,
    color: COLORS.text
  });
  pushWrappedRows(customer.address || "", 8.6, {
    fontName: REGULAR_FONT,
    color: COLORS.text
  });

  const phoneText = sanitizeText(`Tel: ${customer.tel || ""}`);
  const emailText = sanitizeText(`E-posta: ${customer.email || ""}`);
  const combinedContactText = sanitizeText(`${phoneText} | ${emailText}`);

  doc.font(REGULAR_FONT).fontSize(9);
  if (combinedContactText && doc.widthOfString(combinedContactText) <= lineWidth) {
    pushWrappedRows(combinedContactText, 9, {
      fontName: REGULAR_FONT,
      color: COLORS.text
    });
  } else {
    if (phoneText) {
      pushWrappedRows(phoneText, 9, {
        fontName: REGULAR_FONT,
        color: COLORS.text
      });
    }

    if (emailText) {
      pushWrappedRows(emailText, 8.4, {
        fontName: REGULAR_FONT,
        color: COLORS.text
      });
    }
  }

  pushWrappedRows(`Vergi Dairesi: ${customer.taxOffice || ""}`, 9, {
    fontName: REGULAR_FONT,
    color: COLORS.text
  });
  return lines;
}

function drawAttentionSection(doc, x, y, width, customer) {
  const paddingX = 6;
  const lineWidth = width - paddingX * 2;
  const minRowHeight = 18;
  const rowVerticalPadding = 5;
  const attentionLines = buildAttentionLines(doc, customer, lineWidth);

  doc.font(BOLD_FONT).fontSize(10.2).fillColor(COLORS.brandDark).text("DİKKATİNE", x, y, {
    width: width,
    lineBreak: false
  });
  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(x, y + 16)
    .lineTo(x + width, y + 16)
    .stroke();

  let rowY = y + 20;
  attentionLines.forEach(({ text, fontSize = 9, fontName = REGULAR_FONT, color = COLORS.text }, index) => {
    const cleaned = sanitizeText(text);
    const textOptions = {
      width: lineWidth,
      lineBreak: true,
      align: "left"
    };
    doc.font(fontName).fontSize(fontSize);
    const contentHeight = doc.heightOfString(cleaned, {
      width: lineWidth,
      align: "left"
    });
    const rowHeight = Math.max(minRowHeight, contentHeight + rowVerticalPadding * 2);

    if (index % 2 === 1) {
      doc.rect(x, rowY, width, rowHeight).fill(COLORS.panel);
    }

    doc
      .font(fontName)
      .fontSize(fontSize)
      .fillColor(color)
      .text(cleaned, x + paddingX, rowY + rowVerticalPadding, textOptions);

    const dividerY = rowY + rowHeight;
    doc
      .strokeColor(COLORS.border)
      .lineWidth(0.8)
      .moveTo(x, dividerY)
      .lineTo(x + width, dividerY)
      .stroke();

    rowY += rowHeight;
  });

  return rowY;
}

function drawMetaCard(doc, x, y, width, quote) {
  const createdAt = quote.createdAt || quote.createdAtLegacy;
  const validityDate = addDays(createdAt, 15);
  const panelPadding = 8;
  const titleY = y + 2;
  const tableY = y + 34;
  const rowHeight = 18;
  const labelWidth = 72;
  const valueWidth = width - labelWidth - panelPadding;
  const valueX = x + labelWidth + panelPadding;

  const rows = [
    ["TARİH", formatDateCompact(createdAt)],
    ["TEKLİF #", quote.quoteCode],
    ["GEÇERLİLİK", formatDateCompact(validityDate)],
    ["MÜŞTERİ #", buildCustomerCode(quote.customer.name)]
  ];

  const documentTitle = quote.documentType === "service_proforma" ? "Proforma Fatura" : "TEKLİF";
  doc.font(BOLD_FONT).fontSize(17).fillColor("#111111");
  const titleWidth = doc.widthOfString(documentTitle);
  doc.text(documentTitle, x + width - titleWidth, titleY, { lineBreak: false });

  doc.save();
  doc.rect(valueX, tableY, valueWidth, rowHeight * rows.length).fillAndStroke(COLORS.panel, COLORS.border);
  doc.lineWidth(0.8).strokeColor(COLORS.border);
  for (let index = 1; index < rows.length; index += 1) {
    const rowY = tableY + rowHeight * index;
    doc.moveTo(valueX, rowY).lineTo(valueX + valueWidth, rowY).stroke();
  }
  doc.restore();

  rows.forEach(([label, value], index) => {
    const rowY = tableY + index * rowHeight + 5;
    doc.font(REGULAR_FONT).fontSize(8.4).fillColor(COLORS.text).text(label, x, rowY, {
      width: labelWidth - 8,
      align: "right",
      lineBreak: false
    });
    doc
      .font(index === 1 ? BOLD_FONT : REGULAR_FONT)
      .fontSize(8.7)
      .fillColor(COLORS.text)
      .text(value, valueX + 8, rowY, {
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
  const isServiceProforma = items.length === 1 && items[0].code === "SERVİS";
  doc.text(isServiceProforma ? "Tür" : "Model", columnX.code, y + 8, { lineBreak: false });
  doc.text(isServiceProforma ? "Yapılacak İş" : "Ürün Adı", columnX.name, y + 8, { lineBreak: false });
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

  const footerLabel = quote.documentType === "service_proforma" ? "Proforma Fatura" : "Teklif";
  const footerText = `${footerLabel} ${quote.quoteCode}`;
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

  const dividerY = Math.max(companyY + 16, headerY + 116);

  doc
    .strokeColor("#111111")
    .lineWidth(0.8)
    .moveTo(PAGE_MARGIN, dividerY)
    .lineTo(PAGE_WIDTH - PAGE_MARGIN, dividerY)
    .stroke();

  const attentionBottomY = drawAttentionSection(doc, PAGE_MARGIN, dividerY + 16, CONTENT_WIDTH * 0.52, quote.customer);

  const tableBottomY = drawTable(doc, PAGE_MARGIN, attentionBottomY + 18, CONTENT_WIDTH, buildItems(quote));

  const totalsY = tableBottomY + 12;
  const totalValueWidth = quote.currencyCode === "TRY" ? 96 : 60;
  const totalLabelWidth = 126;
  const totalValueX = PAGE_MARGIN + CONTENT_WIDTH - totalValueWidth - 10;
  const totalLabelX = totalValueX - totalLabelWidth - 8;
  doc.rect(PAGE_MARGIN, totalsY, CONTENT_WIDTH, 22).fillAndStroke(COLORS.white, COLORS.border);
  doc.font(BOLD_FONT).fontSize(10).fillColor("#111111").text("GENEL TOPLAM", totalLabelX, totalsY + 6, {
    width: totalLabelWidth,
    align: "right",
    lineBreak: false
  });
  doc.font(BOLD_FONT).fontSize(10).fillColor("#111111").text(formatOfferCurrency(quote.grandTotalUsd, quote.currencyCode), totalValueX, totalsY + 6, {
    width: totalValueWidth,
    align: "right",
    lineBreak: false
  });

  const wordsY = totalsY + 22;
  doc.rect(PAGE_MARGIN, wordsY, CONTENT_WIDTH, 22).fillAndStroke(COLORS.white, COLORS.border);
  doc.font(REGULAR_FONT).fontSize(8.7).fillColor("#111111").text(amountToWordsByCurrency(quote.grandTotalUsd, quote.currencyCode), PAGE_MARGIN + 10, wordsY + 6, {
    width: CONTENT_WIDTH - 20,
    align: "right",
    lineBreak: false
  });

  const notesY = wordsY + 30;
  const notesText = sanitizeText(quote.otherTerms);
  const notesTextWidth = CONTENT_WIDTH - 16;
  const notesTextOptions = { width: notesTextWidth, lineGap: 2 };
  const notesTextHeight = notesText
    ? doc.font(REGULAR_FONT).fontSize(8.8).heightOfString(notesText, notesTextOptions)
    : 0;
  const notesHeight = Math.max(48, 28 + notesTextHeight + 10);
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

  if (notesText) {
    doc.font(REGULAR_FONT).fontSize(8.8).fillColor("#111111").text(
      notesText,
      PAGE_MARGIN + 8,
      notesY + 28,
      notesTextOptions
    );
  }

  if (quote.documentType === "service_proforma") {
    const bankY = notesY + notesHeight + 12;
    const bankHeight = 86;
    doc.rect(PAGE_MARGIN, bankY, CONTENT_WIDTH, bankHeight).fillAndStroke(COLORS.white, COLORS.border);
    doc.font(BOLD_FONT).fontSize(11).fillColor("#111111").text("Banka Detayları", PAGE_MARGIN + 6, bankY + 6, {
      lineBreak: false
    });
    doc
      .strokeColor(COLORS.border)
      .lineWidth(0.8)
      .moveTo(PAGE_MARGIN, bankY + 20)
      .lineTo(PAGE_MARGIN + CONTENT_WIDTH, bankY + 20)
      .stroke();

    const bankDetails = normalizeMultilineText(quote.bankDetails);
    if (bankDetails) {
      doc.font(REGULAR_FONT).fontSize(8.8).fillColor("#111111").text(
        bankDetails,
        PAGE_MARGIN + 8,
        bankY + 28,
        { width: CONTENT_WIDTH - 16, lineGap: 2 }
      );
    }
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
