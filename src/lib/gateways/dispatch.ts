import * as easypaisa from "./easypaisa";
import * as jazzcash from "./jazzcash";
import * as safepay from "./safepay";
import type { CallbackResult, GatewayId, Handover, StartArgs } from "./index";

/**
 * One place that knows which gateway is which.
 *
 * Kept apart from index.ts so the gateway modules can import the shared types
 * from there without the two files importing each other. Everything outside
 * this folder calls these two functions and never names a gateway module.
 */

const MODULES = {
  jazzcash,
  easypaisa,
  safepay,
} satisfies Record<
  GatewayId,
  {
    startPayment: (args: StartArgs) => Handover | Promise<Handover>;
    verifyCallback: (params: Record<string, string>) => CallbackResult;
  }
>;

export function isGatewayId(value: string): value is GatewayId {
  return value in MODULES;
}

export async function startPayment(id: GatewayId, args: StartArgs): Promise<Handover> {
  return MODULES[id].startPayment(args);
}

export function verifyCallback(id: GatewayId, params: Record<string, string>): CallbackResult {
  return MODULES[id].verifyCallback(params);
}
