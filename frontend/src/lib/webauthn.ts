/**
 * WebAuthn browser-side helpers.
 * Handles credential creation (register) and credential assertion (authenticate).
 */

// ---------------------------------------------------------------------------
// Feature detection
// ---------------------------------------------------------------------------

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Encoding helpers
// ---------------------------------------------------------------------------

export function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// ---------------------------------------------------------------------------
// Decode server options → browser-native format
// ---------------------------------------------------------------------------

/**
 * Convert JSON registration options (from the server's options_to_json)
 * into the PublicKeyCredentialCreationOptions format that
 * navigator.credentials.create() expects.
 */
export function decodeRegistrationOptions(
  options: any
): PublicKeyCredentialCreationOptions {
  const decoded: PublicKeyCredentialCreationOptions = {
    ...options,
    challenge: base64urlToBuffer(options.challenge),
    user: {
      ...options.user,
      id: base64urlToBuffer(options.user.id),
    },
  };

  if (options.excludeCredentials) {
    decoded.excludeCredentials = options.excludeCredentials.map((c: any) => ({
      ...c,
      id: base64urlToBuffer(c.id),
    }));
  }

  return decoded;
}

/**
 * Convert JSON authentication options into PublicKeyCredentialRequestOptions.
 */
export function decodeAuthenticationOptions(
  options: any
): PublicKeyCredentialRequestOptions {
  const decoded: PublicKeyCredentialRequestOptions = {
    ...options,
    challenge: base64urlToBuffer(options.challenge),
  };

  if (options.allowCredentials) {
    decoded.allowCredentials = options.allowCredentials.map((c: any) => ({
      ...c,
      id: base64urlToBuffer(c.id),
    }));
  }

  return decoded;
}

// ---------------------------------------------------------------------------
// Encode browser responses → JSON for server
// ---------------------------------------------------------------------------

/**
 * Encode a registration credential into a plain JSON object
 * that the server's verify_registration_response can consume.
 */
export function encodeRegistrationCredential(
  credential: PublicKeyCredential
): Record<string, any> {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: bufferToBase64url(response.attestationObject),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
    },
  };
}

/**
 * Encode an authentication assertion into a plain JSON object
 * that the server's verify_authentication_response can consume.
 */
export function encodeAuthenticationCredential(
  credential: PublicKeyCredential
): Record<string, any> {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: bufferToBase64url(response.authenticatorData),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      signature: bufferToBase64url(response.signature),
      userHandle: response.userHandle
        ? bufferToBase64url(response.userHandle)
        : null,
    },
  };
}

// ---------------------------------------------------------------------------
// High-level register / authenticate
// ---------------------------------------------------------------------------

/**
 * Perform the full registration ceremony in the browser.
 * @param serverOptions — raw JSON from POST /api/webauthn/register/options/
 * @returns encoded credential ready to POST to /api/webauthn/register/verify/
 */
export async function registerCredential(
  serverOptions: any
): Promise<Record<string, any>> {
  const publicKeyOptions = decodeRegistrationOptions(serverOptions);

  const credential = (await navigator.credentials.create({
    publicKey: publicKeyOptions,
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error("Cadastro cancelado pelo usuário");
  }

  return encodeRegistrationCredential(credential);
}

/**
 * Perform the full authentication ceremony in the browser.
 * @param serverOptions — raw JSON from POST /api/webauthn/auth/options/
 * @returns encoded assertion ready to POST to /api/webauthn/auth/verify/
 */
export async function authenticateCredential(
  serverOptions: any
): Promise<Record<string, any>> {
  const publicKeyOptions = decodeAuthenticationOptions(serverOptions);

  const assertion = (await navigator.credentials.get({
    publicKey: publicKeyOptions,
  })) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error("Autenticação cancelada pelo usuário");
  }

  return encodeAuthenticationCredential(assertion);
}
