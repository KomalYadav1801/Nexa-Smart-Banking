import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

type RequestOtpInput = {
  accessToken: string;
  from: string;
  amount: number;
  mode: string;
  beneficiaryId?: string;
  toAccount?: string;
  remarks?: string;
};

type VerifyOtpInput = {
  accessToken: string;
  challengeId: string;
  otp: string;
};

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured on the server`);
  }
  return value;
}

function admin() {
  return createClient(
    env("SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

async function getUser(accessToken: string) {
  if (!accessToken?.trim()) {
    throw new Error("Session expired. Please login again.");
  }

  /*
   * Validate the user's JWT with the publishable client.
   * The service-role client must NOT be used to authenticate
   * a browser session because it is an admin credential.
   */
  const userClient = createClient(
    env("SUPABASE_URL"),
    env("SUPABASE_PUBLISHABLE_KEY"),
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    throw new Error(
      `Session validation failed: ${error?.message ?? "User not found"}`,
    );
  }

  return user;
}

function normalizeIndianPhone(phone: string): string {
  const value = phone.trim().replace(/[()\s-]/g, "");

  if (/^\+91\d{10}$/.test(value)) return value;
  if (/^91\d{10}$/.test(value)) return `+${value}`;
  if (/^\d{10}$/.test(value)) return `+91${value}`;

  throw new Error(
    "Please save a valid Indian mobile number in Profile & Security.",
  );
}

function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)}******${phone.slice(-4)}`;
}

function twilioAuth(): string {
  return `Basic ${Buffer.from(
    `${env("TWILIO_ACCOUNT_SID")}:${env("TWILIO_AUTH_TOKEN")}`,
  ).toString("base64")}`;
}

async function sendTwilioOtp(phone: string): Promise<string> {
  const body = new URLSearchParams({
    To: phone,
    Channel: "sms",
  });

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${env(
      "TWILIO_VERIFY_SERVICE_SID",
    )}/Verifications`,
    {
      method: "POST",
      headers: {
        Authorization: twilioAuth(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const text = await response.text();

  let json: { sid?: string; message?: string } = {};

  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }

  if (!response.ok || !json.sid) {
    throw new Error(
      json.message ||
        `Unable to send OTP (${response.status}). Check Twilio Verify configuration.`,
    );
  }

  return json.sid;
}

async function verifyTwilioOtp(
  phone: string,
  otp: string,
): Promise<boolean> {
  const body = new URLSearchParams({
    To: phone,
    Code: otp,
  });

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${env(
      "TWILIO_VERIFY_SERVICE_SID",
    )}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: twilioAuth(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const text = await response.text();

  let json: { status?: string; message?: string } = {};

  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }

  if (!response.ok) {
    throw new Error(
      json.message || "Unable to verify OTP",
    );
  }

  return json.status === "approved";
}

async function userRpc<T>(
  accessToken: string,
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  /*
   * Use the user's JWT as the authorization context.
   * Supabase automatically sends the publishable key as `apikey`.
   * This avoids manually constructing REST headers and prevents
   * a stale/incorrect server API-key header from causing
   * "Invalid API key" during the OTP request.
   */
  const client = createClient(
    env("SUPABASE_URL"),
    env("SUPABASE_PUBLISHABLE_KEY"),
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const { data, error } = await client.rpc(
    functionName,
    body as never,
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as T;
}

export const requestTransferOtp = createServerFn({
  method: "POST",
})
  .inputValidator((data: RequestOtpInput) => data)
  .handler(async ({ data }) => {
    const user = await getUser(data.accessToken);

    if (!data.from) {
      throw new Error("Please select a source account");
    }

    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error("Transfer amount must be greater than zero");
    }

    const mode = String(data.mode || "IMPS").toUpperCase();

    // Re-check transfer risk on the server immediately before OTP.
    const risk = await userRpc<{
      success: boolean;
      party: string;
      amount: number | string;
      mode: string;
      risk_score: number | string;
      risk_level: "low" | "medium" | "high";
      risk_reasons: unknown;
    }>(data.accessToken, "check_transfer_risk", {
      _from_account: data.from,
      _amount: data.amount,
      _mode: mode,
      _beneficiary_id: data.beneficiaryId ?? null,
      _to_account: data.toAccount ?? null,
    });

    if (!risk?.success) {
      throw new Error("Unable to calculate transfer risk");
    }

    const userScoped = createClient(
      env("SUPABASE_URL"),
      env("SUPABASE_PUBLISHABLE_KEY"),
      {
        global: {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const { data: profile, error: profileError } = await userScoped
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .maybeSingle();

    /*
     * Fall back to the trusted server client only if the profile
     * row is not visible through the user's RLS policy.
     */
    let profileRow = profile;

    if (!profileRow && !profileError) {
      const adminClient = admin();
      const { data: adminProfile, error: adminProfileError } = await adminClient
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .maybeSingle();

      if (adminProfileError) {
        throw new Error(adminProfileError.message);
      }

      profileRow = adminProfile;
    }

    if (profileError) {
      throw new Error(profileError.message);
    }

    const phone = normalizeIndianPhone(String(profileRow?.phone ?? ""));

    const client = admin();

    await client
      .from("transfer_otp_challenges")
      .update({ status: "cancelled" })
      .eq("user_id", user.id)
      .eq("status", "pending");

    const twilioSid = await sendTwilioOtp(phone);

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000,
    ).toISOString();

    const { data: challenge, error: insertError } = await client
      .from("transfer_otp_challenges")
      .insert({
        user_id: user.id,
        from_account: data.from,
        amount: data.amount,
        mode,
        beneficiary_id: data.beneficiaryId ?? null,
        to_account: data.toAccount ?? null,
        remarks: (data.remarks ?? "").trim(),
        phone_e164: phone,
        twilio_verification_sid: twilioSid,
        risk_score: Number(risk.risk_score ?? 0),
        risk_level: risk.risk_level ?? "low",
        risk_reasons: Array.isArray(risk.risk_reasons)
          ? risk.risk_reasons
          : [],
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id, expires_at")
      .single();

    if (insertError || !challenge) {
      throw new Error(
        insertError?.message || "Unable to create OTP challenge",
      );
    }

    return {
      challengeId: challenge.id,
      expiresAt: challenge.expires_at,
      destination: maskPhone(phone),
      party: risk.party,
      amount: Number(risk.amount),
      mode: risk.mode,
      risk_score: Number(risk.risk_score ?? 0),
      risk_level: risk.risk_level,
      risk_reasons: risk.risk_reasons,
    };
  });

export const verifyTransferOtpAndComplete = createServerFn({
  method: "POST",
})
  .inputValidator((data: VerifyOtpInput) => data)
  .handler(async ({ data }) => {
    const user = await getUser(data.accessToken);

    if (!/^\d{6}$/.test(data.otp.trim())) {
      throw new Error("Enter the 6-digit OTP");
    }

    const client = admin();

    const { data: challenge, error } = await client
      .from("transfer_otp_challenges")
      .select("*")
      .eq("id", data.challengeId)
      .eq("user_id", user.id)
      .single();

    if (error || !challenge) {
      throw new Error("OTP request was not found");
    }

    if (challenge.status !== "pending") {
      throw new Error(
        "This OTP is no longer active. Please request a new OTP.",
      );
    }

    if (new Date(challenge.expires_at).getTime() <= Date.now()) {
      await client
        .from("transfer_otp_challenges")
        .update({ status: "expired" })
        .eq("id", challenge.id)
        .eq("user_id", user.id);

      throw new Error("OTP expired. Please request a new OTP.");
    }

    const approved = await verifyTwilioOtp(
      challenge.phone_e164,
      data.otp.trim(),
    );

    if (!approved) {
      throw new Error("Incorrect OTP");
    }

    // Claim the challenge. Only a still-pending challenge can be claimed.
    const { data: claimed, error: claimError } = await client
      .from("transfer_otp_challenges")
      .update({
        status: "verified",
        verified_at: new Date().toISOString(),
      })
      .eq("id", challenge.id)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .select("id")
      .single();

    if (claimError || !claimed) {
      throw new Error("OTP challenge could not be claimed");
    }

    try {
      // The server-only service-role client is used here so the old
      // browser-direct transfer RPC cannot bypass the OTP gate.
      const secureResult = await client.rpc(
        "execute_transfer_after_otp",
        {
          _user_id: user.id,
          _from_account: challenge.from_account,
          _amount: Number(challenge.amount),
          _mode: challenge.mode,
          _beneficiary_id: challenge.beneficiary_id,
          _to_account: challenge.to_account,
          _remarks: challenge.remarks,
          _category: "transfer",
          _otp_challenge_id: challenge.id,
        },
      );

      if (secureResult.error) {
        throw new Error(secureResult.error.message);
      }

      return secureResult.data;
    } catch (error) {
      await client
        .from("transfer_otp_challenges")
        .update({ status: "failed" })
        .eq("id", challenge.id)
        .eq("user_id", user.id);

      throw error;
    }
  });
