# Umbra-CIP — Cardano Improvement Proposal (Draft)
### Estándar de Credenciales Soulbound Privadas para Cardano + Midnight

---

**CIP:** XXXX (pendiente asignación)
**Title:** Umbra — Privacy-Preserving Soulbound Credential Standard
**Status:** Draft
**Category:** Standards
**Authors:** AdaSouls Labs
**Created:** 2026-03-30
**License:** Apache-2.0

---

## Abstract

Umbra defines a standard for issuing, claiming, revoking, and verifying **non-transferable (soulbound) credentials** across Cardano and Midnight. It combines Cardano's public registry capabilities with Midnight's zero-knowledge proof infrastructure to enable organizations of any type — DAOs, clubs, hospitals, universities, cooperatives — to issue verifiable credentials that preserve holder privacy through selective disclosure.

This CIP specifies:
1. The credential data structure and lifecycle
2. Standard schemas for common credential types
3. The smart contract interface for issuers and verifiers
4. The ZK proof protocol for privacy-preserving verification
5. Wallet integration guidelines

---

## Motivation

### The Problem

Organizations need to issue verifiable credentials to their members. Current approaches in Web3 have fundamental limitations:

- **Public NFTs** expose all membership data on-chain. Anyone can see which organizations a wallet belongs to, breaking holder privacy.
- **Centralized databases** offer no verifiability, no portability, and no user sovereignty.
- **Transferable tokens** can be sold, defeating the purpose of identity-bound credentials.

### Why Cardano + Midnight

Midnight's Kachina protocol provides native ZK proof generation within smart contracts. Combined with Cardano's public ledger for registry and anchoring, this creates a unique opportunity for a **privacy-native credential standard** that doesn't exist elsewhere in Web3.

### Why a Standard

Without a standard, each organization will build bespoke credential systems that are incompatible with each other. Umbra provides:
- A common credential format that wallets can recognize and display
- Standard schemas that reduce implementation effort to near-zero
- Interoperability between applications (a credential from org A can be verified by app B)
- A shared registry that prevents issuer impersonation

---

## Specification

### 1. Credential Structure

An Umbra credential is a non-transferable, privacy-preserving token bound to a wallet address. The full credential data is stored in Midnight's shielded ledger; only the issuer registry and revocation anchors are stored on Cardano.

```typescript
interface UmbraCredential {
  // Schema identification
  schemaId: UmbraSchemaId;       // e.g. "umbra:v1:membership"
  schemaVersion: string;          // Semantic version, e.g. "1.0.0"

  // Issuing organization (public — registered in Cardano)
  issuer: {
    orgId: string;                // PolicyId of the issuer on Cardano
    orgName: string;              // Human-readable name
    orgType: UmbraOrgType;        // See §1.1
    publicKey: string;            // Issuer's verification key
  };

  // Holder data (shielded — stored only in Midnight)
  subject: {
    walletHash: string;           // Hash of the holder's wallet address
    memberId?: string;            // Internal org identifier (encrypted)
    metadata?: Record<string, unknown>; // Additional data (shielded)
  };

  // Validity
  issuedAt: number;               // Unix timestamp
  expiresAt?: number;             // Unix timestamp (undefined = never expires)

  // Lifecycle state
  status: "PENDING" | "CLAIMED" | "REVOKED" | "EXPIRED";

  // Selective disclosure configuration
  disclosureFields: string[];     // Fields the holder may reveal in ZK proofs

  // Integrity
  credentialProof: string;        // Issuer's signature over the credential hash
}
```

#### 1.1 Organization Types

```typescript
type UmbraOrgType =
  | "DAO"          // Decentralized autonomous organization
  | "CLUB"         // Sports, social, cultural club
  | "HOSPITAL"     // Hospital, clinic, medical center
  | "UNIVERSITY"   // University, academy, institute
  | "CORP"         // Private company
  | "COOPERATIVE"  // Cooperative, union
  | "GOVERNMENT"   // Government agency
  | "OTHER";
```

#### 1.2 Credential IDs

Credential IDs follow the format: `umbra:cred:<contract-address>:<index>`

Proof IDs follow the format: `umbra:proof:<nonce>`

### 2. Standard Schemas

Umbra defines four standard schemas. Organizations MAY define custom schemas via the registry, but SHOULD use standard schemas when applicable to maximize interoperability.

#### 2.1 `umbra:v1:membership` — Organization Membership

General-purpose membership credential for any organization.

| Field | Required | Disclosable | Description |
|---|---|---|---|
| `orgId` | Yes | Yes | Issuer's PolicyId |
| `walletHash` | Yes | No | Holder's wallet hash |
| `issuedAt` | Yes | No | Issuance timestamp |
| `memberId` | No | No | Internal member ID |
| `memberSince` | No | Yes | Membership start date |
| `tier` | No | Yes | Membership tier |
| `expiresAt` | No | No | Expiration timestamp |

#### 2.2 `umbra:v1:certificate` — Achievement/Completion

Certificate for courses, programs, or achievements.

| Field | Required | Disclosable | Description |
|---|---|---|---|
| `orgId` | Yes | Yes | Issuer's PolicyId |
| `walletHash` | Yes | No | Holder's wallet hash |
| `achievementName` | Yes | Yes | Name of the achievement |
| `issuedAt` | Yes | Yes | Issuance timestamp |
| `grade` | No | No | Grade or score |
| `courseId` | No | No | Course identifier |
| `validUntil` | No | No | Validity period |

#### 2.3 `umbra:v1:professional` — Professional Credential

Licensed professional credentials (medical, legal, engineering, etc.).

| Field | Required | Disclosable | Description |
|---|---|---|---|
| `orgId` | Yes | No | Issuer's PolicyId |
| `walletHash` | Yes | No | Holder's wallet hash |
| `professionCode` | Yes | Yes | Standardized profession code |
| `licenseNumber` | Yes | Yes | License/registration number |
| `issuedAt` | Yes | No | Issuance timestamp |
| `specialty` | No | No | Professional specialty |
| `validUntil` | No | No | License validity |
| `issuingAuthority` | No | Yes | Authority name |

#### 2.4 `umbra:v1:access` — Service/Platform Access

Access control for digital platforms, games, or services.

| Field | Required | Disclosable | Description |
|---|---|---|---|
| `orgId` | Yes | No | Issuer's PolicyId |
| `walletHash` | Yes | No | Holder's wallet hash |
| `resourceId` | Yes | Yes | Resource identifier |
| `issuedAt` | Yes | No | Issuance timestamp |
| `accessLevel` | No | Yes | Access tier (e.g. "MEMBER", "TRIAL") |
| `expiresAt` | No | No | Access expiration |

### 3. Architecture — Two-Layer Model

```
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                      │
│   Frontends  │  dApps  │  Wallets  │  Admin dashboards   │
├─────────────────────────────────────────────────────────┤
│                 Umbra SDK (TypeScript)                    │
│   emit() │ claim() │ revoke() │ generateProof()          │
│   verifyProof() │ checkAccess()                          │
├──────────────────────┬──────────────────────────────────┤
│   MIDNIGHT LAYER     │      CARDANO LAYER               │
│  (Shielded/Private)  │      (Public/Anchor)             │
│                      │                                  │
│  UmbraCredential     │  UmbraRegistry                   │
│  Contract            │  Contract                        │
│  - Credential state  │  - Issuer registry               │
│  - ZK Proof gen      │  - Schema registry               │
│  - Selective disclose│  - Revocation anchors            │
└──────────────────────┴──────────────────────────────────┘
```

**Cardano Layer (public):** Stores the issuer registry, schema definitions, and revocation anchors. Everything that needs to be publicly verifiable without revealing holder data.

**Midnight Layer (private):** Stores individual credential state, generates ZK proofs, and handles selective disclosure. All holder data remains shielded.

### 4. Smart Contract Interface

#### 4.1 Midnight Contract — UmbraCredentialContract (Compact)

Implementations MUST provide these circuits:

```compact
// Issue a new credential (called by issuer)
export circuit issue(
  credential: CredentialState,
  issuerSignature: Signature
) -> CredentialId

// Holder claims their credential with ZK ownership proof
export circuit claim(
  credentialId: CredentialId,
  walletProof: Proof
) -> ClaimedCredential

// Revoke a credential (issuer only)
export circuit revoke(
  credentialId: CredentialId,
  issuerSignature: Signature
) -> RevocationReceipt

// Generate ZK membership proof (the core privacy function)
export circuit generateMembershipProof(
  credentialId: CredentialId,
  resourceId: Bytes[32],
  disclosureFields: Bytes[32][]
) -> MembershipProof

// Verify a ZK proof (called by frontends or contracts)
export circuit verifyMembershipProof(
  proof: MembershipProof,
  expectedOrgId: Bytes[32],
  expectedResourceId: Bytes[32]
) -> Bool
```

#### 4.2 Cardano Contract — UmbraRegistry (Aiken)

Implementations MUST provide these validators:

```aiken
type RegistryAction {
  RegisterIssuer      // Register a new issuing organization
  UpdateIssuer        // Update issuer metadata
  DeactivateIssuer    // Deactivate an issuer
  RegisterSchema      // Register a credential schema
  PublishRevocation   // Publish a revocation anchor
}
```

**Issuer Registration** requires: `org_name`, `org_type`, `admin_vkh` (verification key hash), `schemas` list, `is_active` flag.

**Schema Registration** requires: `schema_id`, `registered_by` (issuer), `required_fields`, `optional_fields`, `disclosable_fields`.

**Revocation** requires: `credential_hash`, `revocation_anchor` (opaque — does not reveal holder), `revoked_by` (issuer vkh), `revoked_at` timestamp.

### 5. SDK Interface

Compliant SDKs MUST implement three modules:

#### 5.1 Issuer Module

```typescript
class UmbraIssuer {
  emit(input: UmbraEmitInput): Promise<UmbraCredentialId>
  emitTrial(walletAddress: string, resourceId: string, durationDays: number): Promise<UmbraCredentialId>
  revoke(credentialId: UmbraCredentialId): Promise<void>
}
```

#### 5.2 Holder Module

```typescript
class UmbraHolder {
  listPending(): Promise<UmbraCredential[]>
  listOwned(): Promise<UmbraCredential[]>
  claim(credentialId: UmbraCredentialId): Promise<void>
  claimAll(): Promise<UmbraCredentialId[]>
  findValidAccess(resourceId: string, orgId?: string): Promise<UmbraCredential | undefined>
  generateProof(credentialId: UmbraCredentialId, resourceId: string, disclosureFields?: string[]): Promise<UmbraMembershipProof>
}
```

#### 5.3 Verifier Module

```typescript
class UmbraVerifier {
  verifyProof(proof: UmbraMembershipProof): Promise<UmbraProofVerificationResult>
  checkAccess(walletAddress: string, options: { resourceId: string; orgId?: string }): Promise<AccessCheckResult>
}
```

### 6. ZK Proof Protocol

#### 6.1 Proof Generation

When a holder generates a membership proof:

1. The holder's wallet secret key derives a `walletHash` inside the Midnight ZK circuit
2. The circuit verifies the credential exists and is CLAIMED for that `walletHash`
3. The circuit checks the credential is not REVOKED or EXPIRED
4. A unique `nonce` is generated to prevent replay attacks
5. Only the fields specified in `disclosureFields` are included in the proof output
6. The proof is returned as an opaque blob that can be verified without the holder's identity

#### 6.2 Proof Verification

A verifier receives the proof and:

1. Calls `verifyMembershipProof()` with the proof and expected `orgId`/`resourceId`
2. The circuit cryptographically verifies the proof is valid
3. Returns `true`/`false` — the verifier learns ONLY that the holder has a valid credential, nothing else

#### 6.3 What the Verifier Sees vs. Doesn't See

| Sees | Does NOT See |
|---|---|
| Valid credential exists for the expected org | Holder's wallet address |
| Credential is not revoked/expired | Holder's name or identity |
| Disclosed fields (if any) | Other credentials the holder has |
| Proof is fresh (nonce) | Transaction history |

### 7. Credential Lifecycle

```
           issue()          claim()
CREATED ──────────► PENDING ────────► CLAIMED
                                        │
                                  revoke() │
                                        ▼
                                     REVOKED

  Automatic expiration:
  CLAIMED + (now > expiresAt) → EXPIRED
```

- **PENDING**: Credential issued by org, waiting for holder to claim. Holder must prove wallet ownership via ZK proof.
- **CLAIMED**: Active credential. Holder can generate membership proofs.
- **REVOKED**: Permanently invalidated by issuer. Revocation anchor published on Cardano without revealing holder identity.
- **EXPIRED**: Automatically invalid when `expiresAt` is reached. Does not require on-chain action.

### 8. Wallet Integration Guidelines

Wallets supporting Umbra SHOULD:

1. **Detect Umbra credentials** by querying the holder's shielded state in Midnight
2. **Display credential status** (PENDING, CLAIMED, REVOKED, EXPIRED) with visual indicators
3. **Prompt claim flow** when PENDING credentials are detected
4. **Provide proof generation UI** allowing the holder to choose disclosure fields
5. **Show organization metadata** (name, type) from the Cardano registry
6. **Never expose** the raw credential data to third parties without holder consent

### 9. Compliance Considerations

Umbra adopts Midnight's model of **selective privacy with optional compliance**:

- Organizations MAY configure credentials with compliance-related fields
- Holders MAY generate proofs that include KYC/AML data if a context requires it
- The protocol takes no position on which data must be mandatory — that is each organization's decision
- Organizations in regulated sectors (health, finance) SHOULD consult legal advisors before deploying

---

## Rationale

### Why Soulbound (Non-Transferable)?

Credentials represent identity-bound attributes (membership, license, degree). Allowing transfer would undermine their meaning. Umbra credentials are bound to a wallet hash and cannot be transferred to another wallet.

### Why Two Chains?

A single-chain approach cannot satisfy both privacy and public verifiability. Midnight provides ZK-native privacy for holder data, while Cardano provides a public, auditable registry for issuers and schemas. The revocation anchor pattern bridges both: the fact of revocation is public, but the holder's identity is not.

### Why Standard Schemas?

Without schemas, each organization defines its own credential format, making interoperability impossible. The four standard schemas cover >90% of real-world use cases while remaining extensible through custom schema registration.

---

## Use Cases

| Organization | Schema | Use Case |
|---|---|---|
| DAO | `umbra:v1:access` | Gated access to governance platforms and digital worlds |
| University | `umbra:v1:certificate` | Academic diplomas and course completions |
| Hospital | `umbra:v1:professional` | Verifiable medical licenses |
| Sports Club | `umbra:v1:membership` | Digital membership cards |
| Cooperative | `umbra:v1:membership` | Cooperativist credentials |
| Enterprise | `umbra:v1:access` | Employee access to internal systems |
| Medical Board | `umbra:v1:professional` | On-chain professional registration |

---

## Reference Implementation

The reference implementation is maintained at the Umbra Protocol repository:

- **Core types**: `@umbra-protocol/core`
- **SDK**: `@umbra-protocol/sdk`
- **React components**: `@umbra-protocol/react`
- **Midnight contract**: `contracts/midnight/UmbraCredentialContract.compact`
- **Cardano registry**: `contracts/cardano/validators/registry.ak`

### Quick Start

```bash
npm install @umbra-protocol/sdk

npx umbra-protocol register-org \
  --name "My Organization" \
  --type CLUB \
  --wallet admin-wallet.json \
  --schemas umbra:v1:membership
```

```typescript
import { UmbraIssuer, UmbraHolder, UmbraVerifier } from "@umbra-protocol/sdk";

// Issue a credential
const credId = await issuer.emit({
  schema: "umbra:v1:membership",
  subject: { walletAddress: "addr1...", tier: "FULL_MEMBER" },
});

// Holder claims and generates proof
await holder.claim(credId);
const proof = await holder.generateProof(credId, "my-resource", ["orgId"]);

// Verifier checks access — never sees the holder's identity
const { isValid } = await verifier.verifyProof(proof);
```

---

## Path to Adoption

1. **ALDEA DAO** serves as the anchor use case, validating the protocol with real users accessing ALDEA World
2. **Public mint** in ADA lowers the barrier to entry for new members
3. **SDK + CLI + Templates** reduce integration effort to under one hour for new organizations
4. **Pilot organizations** (non-ALDEA) validate that the standard works independently of any single organization
5. **Community review** via CIP process ensures the standard reflects ecosystem needs

---

## Copyright

This CIP is licensed under Apache-2.0.
