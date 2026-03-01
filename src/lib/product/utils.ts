import { Units, UnitsPeriodAfterOpeningUnit } from "@/lib/appwrite/appwrite";

export const getExpiryDate = (unit: Units) => {
  const exp = unit.expiresAt ? new Date(unit.expiresAt) : null;

  let pao: null | Date = null;

  if (
    unit.openedAt &&
    unit.periodAfterOpeningDuration &&
    unit.periodAfterOpeningUnit
  ) {
    pao = new Date(unit.openedAt);
    if (unit.periodAfterOpeningUnit === UnitsPeriodAfterOpeningUnit.MONTHS) {
      pao.setMonth(pao.getMonth() + unit.periodAfterOpeningDuration);
    } else {
      pao.setFullYear(pao.getFullYear() + unit.periodAfterOpeningDuration);
    }
  }

  return (
    [exp, pao].filter(Boolean).sort((a, b) => a!.getTime() - b!.getTime())[0] ??
    null
  );
};
