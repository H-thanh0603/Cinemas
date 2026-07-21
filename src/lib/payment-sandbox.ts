/** Demo payment gateway rules (no real money). */

export const SANDBOX_CARD_SUCCESS = "4242424242424242";
export const SANDBOX_CARD_FAIL = "4000000000000002";

export type SandboxPayInput = {
  method: string;
  /** Digits only for card */
  cardNumber?: string;
  /** "success" | "fail" for wallet/transfer buttons */
  outcome?: "success" | "fail";
};

export type SandboxPayResult =
  | { ok: true; txnId: string }
  | { ok: false; error: string };

export function runSandboxPayment(input: SandboxPayInput): SandboxPayResult {
  const txnId = `SBX-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

  if (input.method === "CREDIT_CARD") {
    const digits = (input.cardNumber ?? "").replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) {
      return { ok: false, error: "Số thẻ không hợp lệ (sandbox: 13–19 số)" };
    }
    if (digits === SANDBOX_CARD_FAIL || digits.endsWith("0002")) {
      return {
        ok: false,
        error: "Ngân hàng từ chối thẻ (sandbox fail card)",
      };
    }
    // Accept any Luhn-looking length; prefer demo success card
    return { ok: true, txnId };
  }

  if (input.method === "E_WALLET" || input.method === "BANK_TRANSFER") {
    if (input.outcome === "fail") {
      return { ok: false, error: "Giao dịch ví/CK thất bại (sandbox)" };
    }
    return { ok: true, txnId };
  }

  return { ok: false, error: "Phương thức không hỗ trợ sandbox" };
}
