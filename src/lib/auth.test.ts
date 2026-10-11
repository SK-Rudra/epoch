import { afterEach, describe, expect, it, vi } from "vitest";
import { isAllowedEmail } from "./auth";

describe("isAllowedEmail", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts the allowed email, ignoring case and spaces", () => {
    vi.stubEnv("ALLOWED_EMAIL", "Me@Example.com");
    expect(isAllowedEmail(" me@example.COM ")).toBe(true);
  });

  it("rejects any other email", () => {
    vi.stubEnv("ALLOWED_EMAIL", "me@example.com");
    expect(isAllowedEmail("someone@example.com")).toBe(false);
    expect(isAllowedEmail(null)).toBe(false);
  });

  it("rejects everyone when ALLOWED_EMAIL is not set", () => {
    vi.stubEnv("ALLOWED_EMAIL", "");
    expect(isAllowedEmail("")).toBe(false);
    expect(isAllowedEmail("me@example.com")).toBe(false);
  });
});
