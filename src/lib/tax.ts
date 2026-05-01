// src/lib/tax.ts

export const GST_RATE = 0.18; // 18% Total GST
export const CGST_RATE = 0.09; // 9% CGST
export const SGST_RATE = 0.09; // 9% SGST

/**
 * Amazon Standard: Prices shown to retail users are usually "Inclusive of Tax".
 * This function takes the final price and calculates exactly how much of it was base price vs GST.
 * Perfect for generating your PDF Invoices.
 */
export function calculateTaxBreakdown(inclusivePrice: number, quantity: number = 1) {
  const totalInclusive = inclusivePrice * quantity;
  // Formula: Base = Total / (1 + Rate)
  const basePrice = totalInclusive / (1 + GST_RATE);
  const totalGST = totalInclusive - basePrice;
  const cgst = totalGST / 2;
  const sgst = totalGST / 2;

  return {
    basePrice: Number(basePrice.toFixed(2)),
    cgst: Number(cgst.toFixed(2)),
    sgst: Number(sgst.toFixed(2)),
    totalGST: Number(totalGST.toFixed(2)),
    totalInclusive: Number(totalInclusive.toFixed(2)),
  };
}

/**
 * If your uncle inputs prices into the database EXCLUSIVE of tax, 
 * use this to add the 18% before showing it to the user.
 */
export function addGST(exclusivePrice: number) {
  return Number((exclusivePrice * (1 + GST_RATE)).toFixed(2));
}