import { pool } from "../db/postgres.js";

function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function uuidOrNull(value) {
  return isUuid(value) ? value : null;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseJsonField(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    return JSON.parse(value);
  }

  return value;
}

function mapQuoteRow(row) {
  return {
    id: row.id,
    legacyNo: row.legacy_no == null ? "" : String(row.legacy_no),
    quoteCode: row.quote_code,
    customer: parseJsonField(row.customer, {}),
    ownerUserId: row.owner_user_id,
    ownerUsername: row.owner_username || "",
    documentType: row.document_type || "quote",
    currencyCode: row.currency_code || "USD",
    materialId: row.material_id,
    materialNameSnapshot: row.material_name_snapshot,
    thicknessMm: toNumberOrNull(row.thickness_mm),
    bendLengthMm: toNumberOrNull(row.bend_length_mm),
    machineId: row.machine_id,
    machineModelSnapshot: row.machine_model_snapshot,
    serviceDescription: row.service_description || "",
    toolingId: row.tooling_id,
    toolingNameSnapshot: row.tooling_name_snapshot || "",
    selectedOptions: parseJsonField(row.selected_options, []),
    machinePriceUsd: toNumberOrNull(row.machine_price_usd),
    optionsTotalUsd: toNumberOrNull(row.options_total_usd),
    grandTotalUsd: toNumberOrNull(row.grand_total_usd),
    notes: row.notes || "",
    otherTerms: row.other_terms || "",
    bankDetails: row.bank_details || "",
    createdAtLegacy: row.created_at_legacy || "",
    rawData: parseJsonField(row.raw_data, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getAllQuotes() {
  const result = await pool.query(`
    SELECT
      id,
      legacy_no,
      quote_code,
      customer,
      owner_user_id,
      owner_username,
      document_type,
      currency_code,
      material_id,
      material_name_snapshot,
      thickness_mm,
      bend_length_mm,
      machine_id,
      machine_model_snapshot,
      service_description,
      tooling_id,
      tooling_name_snapshot,
      selected_options,
      machine_price_usd,
      options_total_usd,
      grand_total_usd,
      notes,
      other_terms,
      bank_details,
      created_at_legacy,
      raw_data,
      created_at,
      updated_at
    FROM quotes
    ORDER BY created_at DESC
  `);

  return result.rows.map(mapQuoteRow);
}

export async function getQuotesByOwnerUserId(ownerUserId) {
  const result = await pool.query(
    `
    SELECT
      id,
      legacy_no,
      quote_code,
      customer,
      owner_user_id,
      owner_username,
      document_type,
      currency_code,
      material_id,
      material_name_snapshot,
      thickness_mm,
      bend_length_mm,
      machine_id,
      machine_model_snapshot,
      service_description,
      tooling_id,
      tooling_name_snapshot,
      selected_options,
      machine_price_usd,
      options_total_usd,
      grand_total_usd,
      notes,
      other_terms,
      bank_details,
      created_at_legacy,
      raw_data,
      created_at,
      updated_at
    FROM quotes
    WHERE owner_user_id = $1
    ORDER BY created_at DESC
    `,
    [ownerUserId]
  );

  return result.rows.map(mapQuoteRow);
}

export async function getQuotesByOwner(ownerUserId, ownerUsername) {
  if (ownerUserId) {
    const result = await pool.query(
      `
      SELECT
        id,
        legacy_no,
        quote_code,
        customer,
        owner_user_id,
        owner_username,
        document_type,
        currency_code,
        material_id,
        material_name_snapshot,
        thickness_mm,
        bend_length_mm,
        machine_id,
        machine_model_snapshot,
        service_description,
        tooling_id,
        tooling_name_snapshot,
        selected_options,
        machine_price_usd,
        options_total_usd,
        grand_total_usd,
        notes,
        other_terms,
        bank_details,
        created_at_legacy,
        raw_data,
        created_at,
        updated_at
      FROM quotes
      WHERE owner_user_id = $1 OR (owner_user_id IS NULL AND owner_username = $2)
      ORDER BY created_at DESC
      `,
      [ownerUserId, ownerUsername]
    );

    return result.rows.map(mapQuoteRow);
  }

  const result = await pool.query(
    `
    SELECT
      id,
      legacy_no,
      quote_code,
      customer,
      owner_user_id,
      owner_username,
      document_type,
      currency_code,
      material_id,
      material_name_snapshot,
      thickness_mm,
      bend_length_mm,
      machine_id,
      machine_model_snapshot,
      service_description,
      tooling_id,
      tooling_name_snapshot,
      selected_options,
      machine_price_usd,
      options_total_usd,
      grand_total_usd,
      notes,
      other_terms,
      bank_details,
      created_at_legacy,
      raw_data,
      created_at,
      updated_at
    FROM quotes
    WHERE owner_user_id IS NULL AND owner_username = $1
    ORDER BY created_at DESC
    `,
    [ownerUsername]
  );

  return result.rows.map(mapQuoteRow);
}

export async function getQuoteById(id) {
  const result = await pool.query(
    `
    SELECT
      id,
      legacy_no,
      quote_code,
      customer,
      owner_user_id,
      owner_username,
      document_type,
      currency_code,
      material_id,
      material_name_snapshot,
      thickness_mm,
      bend_length_mm,
      machine_id,
      machine_model_snapshot,
      service_description,
      tooling_id,
      tooling_name_snapshot,
      selected_options,
      machine_price_usd,
      options_total_usd,
      grand_total_usd,
      notes,
      other_terms,
      bank_details,
      created_at_legacy,
      raw_data,
      created_at,
      updated_at
    FROM quotes
    WHERE id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapQuoteRow(result.rows[0]);
}

export async function countQuotesByCodePrefix(prefix) {
  const result = await pool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM quotes
    WHERE quote_code LIKE $1
    `,
    [`${prefix}%`]
  );

  return result.rows[0].count;
}

export async function hasQuoteCode(quoteCode) {
  const result = await pool.query(
    `
    SELECT 1
    FROM quotes
    WHERE quote_code = $1
    LIMIT 1
    `,
    [quoteCode]
  );

  return result.rows.length > 0;
}

export async function createQuote(quoteData) {
  const {
    legacyNo,
    quoteCode,
    customer,
    ownerUserId,
    ownerUsername,
    documentType,
    currencyCode,
    materialId,
    materialNameSnapshot,
    thicknessMm,
    bendLengthMm,
    machineId,
    machineModelSnapshot,
    serviceDescription,
    toolingId,
    toolingNameSnapshot,
    selectedOptions,
    machinePriceUsd,
    optionsTotalUsd,
    grandTotalUsd,
    notes,
    otherTerms,
    bankDetails,
    createdAtLegacy
  } = quoteData;

  const result = await pool.query(
    `
    INSERT INTO quotes (
      legacy_no,
      quote_code,
      customer,
      owner_user_id,
      owner_username,
      document_type,
      currency_code,
      material_id,
      material_name_snapshot,
      thickness_mm,
      bend_length_mm,
      machine_id,
      machine_model_snapshot,
      service_description,
      tooling_id,
      tooling_name_snapshot,
      selected_options,
      machine_price_usd,
      options_total_usd,
      grand_total_usd,
      notes,
      other_terms,
      bank_details,
      created_at_legacy,
      raw_data
    )
    VALUES (
      $1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9,
      $10, $11, $12, $13, $14, $15, $16, $17::jsonb,
      $18, $19, $20, $21, $22, $23, $24, $25::jsonb
    )
    RETURNING
      id,
      legacy_no,
      quote_code,
      customer,
      owner_user_id,
      owner_username,
      document_type,
      currency_code,
      material_id,
      material_name_snapshot,
      thickness_mm,
      bend_length_mm,
      machine_id,
      machine_model_snapshot,
      service_description,
      tooling_id,
      tooling_name_snapshot,
      selected_options,
      machine_price_usd,
      options_total_usd,
      grand_total_usd,
      notes,
      other_terms,
      bank_details,
      created_at_legacy,
      raw_data,
      created_at,
      updated_at
    `,
    [
      legacyNo || null,
      quoteCode,
      JSON.stringify(customer),
      uuidOrNull(ownerUserId),
      ownerUsername,
      documentType || "quote",
      currencyCode || "USD",
      uuidOrNull(materialId),
      materialNameSnapshot,
      thicknessMm,
      bendLengthMm,
      uuidOrNull(machineId),
      machineModelSnapshot,
      serviceDescription || "",
      uuidOrNull(toolingId),
      toolingNameSnapshot || "",
      JSON.stringify(selectedOptions || []),
      machinePriceUsd,
      optionsTotalUsd,
      grandTotalUsd,
      notes || "",
      otherTerms || "",
      bankDetails || "",
      createdAtLegacy || "",
      JSON.stringify(quoteData)
    ]
  );

  return mapQuoteRow(result.rows[0]);
}

export async function updateQuote(id, quoteData) {
  const {
    legacyNo,
    quoteCode,
    customer,
    ownerUserId,
    ownerUsername,
    documentType,
    currencyCode,
    materialId,
    materialNameSnapshot,
    thicknessMm,
    bendLengthMm,
    machineId,
    machineModelSnapshot,
    serviceDescription,
    toolingId,
    toolingNameSnapshot,
    selectedOptions,
    machinePriceUsd,
    optionsTotalUsd,
    grandTotalUsd,
    notes,
    otherTerms,
    bankDetails,
    createdAtLegacy
  } = quoteData;

  const result = await pool.query(
    `
    UPDATE quotes
    SET
      legacy_no = $1,
      quote_code = $2,
      customer = $3::jsonb,
      owner_user_id = $4,
      owner_username = $5,
      document_type = $6,
      currency_code = $7,
      material_id = $8,
      material_name_snapshot = $9,
      thickness_mm = $10,
      bend_length_mm = $11,
      machine_id = $12,
      machine_model_snapshot = $13,
      service_description = $14,
      tooling_id = $15,
      tooling_name_snapshot = $16,
      selected_options = $17::jsonb,
      machine_price_usd = $18,
      options_total_usd = $19,
      grand_total_usd = $20,
      notes = $21,
      other_terms = $22,
      bank_details = $23,
      created_at_legacy = $24,
      raw_data = $25::jsonb,
      updated_at = NOW()
    WHERE id = $26
    RETURNING
      id,
      legacy_no,
      quote_code,
      customer,
      owner_user_id,
      owner_username,
      document_type,
      currency_code,
      material_id,
      material_name_snapshot,
      thickness_mm,
      bend_length_mm,
      machine_id,
      machine_model_snapshot,
      service_description,
      tooling_id,
      tooling_name_snapshot,
      selected_options,
      machine_price_usd,
      options_total_usd,
      grand_total_usd,
      notes,
      other_terms,
      bank_details,
      created_at_legacy,
      raw_data,
      created_at,
      updated_at
    `,
    [
      legacyNo || null,
      quoteCode,
      JSON.stringify(customer),
      uuidOrNull(ownerUserId),
      ownerUsername,
      documentType || "quote",
      currencyCode || "USD",
      uuidOrNull(materialId),
      materialNameSnapshot,
      thicknessMm,
      bendLengthMm,
      uuidOrNull(machineId),
      machineModelSnapshot,
      serviceDescription || "",
      uuidOrNull(toolingId),
      toolingNameSnapshot || "",
      JSON.stringify(selectedOptions || []),
      machinePriceUsd,
      optionsTotalUsd,
      grandTotalUsd,
      notes || "",
      otherTerms || "",
      bankDetails || "",
      createdAtLegacy || "",
      JSON.stringify(quoteData),
      id
    ]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapQuoteRow(result.rows[0]);
}

export async function deleteQuote(id) {
  const result = await pool.query(
    `
    DELETE FROM quotes
    WHERE id = $1
    RETURNING
      id,
      legacy_no,
      quote_code,
      customer,
      owner_user_id,
      owner_username,
      document_type,
      currency_code,
      material_id,
      material_name_snapshot,
      thickness_mm,
      bend_length_mm,
      machine_id,
      machine_model_snapshot,
      service_description,
      tooling_id,
      tooling_name_snapshot,
      selected_options,
      machine_price_usd,
      options_total_usd,
      grand_total_usd,
      notes,
      other_terms,
      bank_details,
      created_at_legacy,
      raw_data,
      created_at,
      updated_at
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapQuoteRow(result.rows[0]);
}
