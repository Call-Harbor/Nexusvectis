/**
 * Entity Security Helper - Ensures organization_id is always set on all operations
 * Prevents data mixing between organizations
 */

import { base44 } from "@/api/base44Client";

let cachedOrgId = null;

/**
 * Get the current user's organization_id
 * Caches the result to avoid repeated lookups
 */
export async function getOrgId() {
  if (cachedOrgId) return cachedOrgId;
  
  try {
    const user = await base44.auth.me();
    cachedOrgId = user?.organization_id || user?.data?.organization_id;
    return cachedOrgId;
  } catch {
    console.error("Failed to get organization_id");
    return null;
  }
}

/**
 * Add organization_id to entity data before creation/update
 * @param {object} data - Entity data
 * @param {string} orgId - Organization ID (optional, will fetch if not provided)
 * @returns {Promise<object>} Data with organization_id guaranteed
 */
export async function ensureOrgId(data, orgId = null) {
  if (!data) return data;
  
  const finalOrgId = orgId || cachedOrgId || await getOrgId();
  if (!finalOrgId) {
    throw new Error("Cannot create entity: organization_id is required but user is not authenticated");
  }
  
  return {
    ...data,
    organization_id: finalOrgId
  };
}

/**
 * Bulk ensure org_id on array of entities
 */
export async function ensureOrgIdBulk(dataArray, orgId = null) {
  if (!Array.isArray(dataArray)) return dataArray;
  
  const finalOrgId = orgId || cachedOrgId || await getOrgId();
  if (!finalOrgId) {
    throw new Error("Cannot create entities: organization_id is required but user is not authenticated");
  }
  
  return dataArray.map(data => ({
    ...data,
    organization_id: finalOrgId
  }));
}

/**
 * Safe entity creation - always includes organization_id
 */
export async function safeCreate(entityName, data, orgId = null) {
  const safeData = await ensureOrgId(data, orgId);
  return base44.entities[entityName].create(safeData);
}

/**
 * Safe bulk creation
 */
export async function safeBulkCreate(entityName, dataArray, orgId = null) {
  const safeData = await ensureOrgIdBulk(dataArray, orgId);
  return base44.entities[entityName].bulkCreate(safeData);
}

/**
 * Safe entity update - verifies org_id ownership before updating
 */
export async function safeUpdate(entityName, recordId, data, orgId = null) {
  const finalOrgId = orgId || cachedOrgId || await getOrgId();
  
  // Verify the record belongs to this organization
  const existing = await base44.entities[entityName].get(recordId);
  if (existing?.organization_id !== finalOrgId) {
    throw new Error(`Access denied: Record does not belong to your organization`);
  }
  
  const safeData = await ensureOrgId(data, finalOrgId);
  return base44.entities[entityName].update(recordId, safeData);
}

/**
 * Safe entity delete - verifies org_id ownership
 */
export async function safeDelete(entityName, recordId, orgId = null) {
  const finalOrgId = orgId || cachedOrgId || await getOrgId();
  
  // Verify the record belongs to this organization
  const existing = await base44.entities[entityName].get(recordId);
  if (existing?.organization_id !== finalOrgId) {
    throw new Error(`Access denied: Record does not belong to your organization`);
  }
  
  return base44.entities[entityName].delete(recordId);
}

/**
 * Get only this organization's records
 */
export async function getOrgRecords(entityName, additionalFilter = {}, orgId = null) {
  const finalOrgId = orgId || cachedOrgId || await getOrgId();
  const filter = {
    ...additionalFilter,
    organization_id: finalOrgId
  };
  return base44.entities[entityName].filter(filter);
}

/**
 * Clear cached org ID (call on logout)
 */
export function clearOrgIdCache() {
  cachedOrgId = null;
}