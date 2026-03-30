# Umbra Issuer Organization Template

Template repository for organizations that want to issue soulbound credentials using the Umbra Protocol.

**Fork and deploy in 1 hour.**

## What's Included

- Pre-configured SDK setup for issuing credentials
- Admin dashboard (Next.js) for managing credentials
- Scripts for org registration, credential issuance, and bulk emit
- Environment configuration for testnet and mainnet

## Quick Start

### 1. Clone and Install

```bash
# Use this template on GitHub, or:
git clone https://github.com/umbra-protocol/issuer-org-template my-org
cd my-org
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your:
- Organization details (name, type)
- Blockfrost API key
- Admin wallet path
- Network (preprod for testing, mainnet for production)

### 3. Register Your Organization

```bash
npm run register
```

This registers your organization on the Cardano registry. Save the Org ID from the output.

### 4. Issue Credentials

```bash
# Single credential
npm run emit -- --wallet addr1... --schema soulbound:v1:membership

# Bulk from CSV
npm run bulk-emit -- --file members.csv
```

### 5. Launch Admin Dashboard

```bash
npm run dev
# Open http://localhost:3000
```

## Project Structure

```
├── scripts/
│   ├── register-org.ts      # One-time org registration
│   ├── emit-credential.ts   # Issue a single credential
│   ├── bulk-emit.ts         # Bulk issue from CSV
│   └── check-org.ts         # Verify registration
├── src/
│   ├── app/                 # Next.js admin dashboard
│   ├── lib/
│   │   └── umbra.ts         # SDK configuration
│   └── components/          # Dashboard UI components
├── .env.example
└── package.json
```

## CSV Format for Bulk Emit

```csv
walletAddress,schema,resourceId,accessLevel,tier,expiresAt
addr1abc...,soulbound:v1:membership,,,FULL_MEMBER,2027-12-31
addr1def...,soulbound:v1:access,my-platform:main,MEMBER,,2027-12-31
```

## Schemas

| Schema | Use Case |
|---|---|
| `soulbound:v1:membership` | Club/DAO memberships |
| `soulbound:v1:certificate` | Diplomas, completions |
| `soulbound:v1:professional` | Licenses, registrations |
| `soulbound:v1:access` | Platform/service access |

## Documentation

Full protocol documentation: https://umbra.aldea.world/docs
