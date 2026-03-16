import { PlanKey } from "./stripe";

export interface PlanLimits {
  maxProducts: number;
  maxTryonsPerMonth: number;
  hasPhotoTryon: boolean;
  hasMirror: boolean;
  hasSharing: boolean;
  hasVideoExport: boolean;
  hasFullIntegrations: boolean;
  hasWhiteLabel: boolean;
  hasFullApi: boolean;
}

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  starter: {
    maxProducts: 50,
    maxTryonsPerMonth: 5_000,
    hasPhotoTryon: true,
    hasMirror: false,
    hasSharing: false,
    hasVideoExport: false,
    hasFullIntegrations: false,
    hasWhiteLabel: false,
    hasFullApi: false,
  },
  growth: {
    maxProducts: 300,
    maxTryonsPerMonth: 25_000,
    hasPhotoTryon: true,
    hasMirror: true,
    hasSharing: true,
    hasVideoExport: false,
    hasFullIntegrations: false,
    hasWhiteLabel: false,
    hasFullApi: false,
  },
  pro: {
    maxProducts: 1_000,
    maxTryonsPerMonth: 100_000,
    hasPhotoTryon: true,
    hasMirror: true,
    hasSharing: true,
    hasVideoExport: true,
    hasFullIntegrations: true,
    hasWhiteLabel: false,
    hasFullApi: false,
  },
  enterprise: {
    maxProducts: Infinity,
    maxTryonsPerMonth: Infinity,
    hasPhotoTryon: true,
    hasMirror: true,
    hasSharing: true,
    hasVideoExport: true,
    hasFullIntegrations: true,
    hasWhiteLabel: true,
    hasFullApi: true,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanKey] || PLAN_LIMITS.starter;
}
