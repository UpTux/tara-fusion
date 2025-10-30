
import { SecurityProperty } from "../types";

const threatNameMapping: Record<SecurityProperty, string> = {
    [SecurityProperty.NON_REPUDIATION]: "Repudiation of",
    [SecurityProperty.INTEGRITY]: "Manipulation of",
    [SecurityProperty.FRESHNESS]: "Replay of",
    [SecurityProperty.CORRECTNESS]: "Invalidation of",
    [SecurityProperty.CONFIDENTIALITY]: "Extraction of",
    [SecurityProperty.AVAILABILITY]: "Blocking of",
    [SecurityProperty.AUTHORIZATION]: "Unauthorized access to",
    [SecurityProperty.AUTHENTICITY]: "Forgery of",
};

export function generateThreatName(property: SecurityProperty, assetName: string): string {
    const prefix = threatNameMapping[property] || "Threat to";
    return `${prefix} ${assetName}`;
}
