# ToolsBox

[简体中文](./README.md) | [English](./README.en.md)

[![CI](https://img.shields.io/github/actions/workflow/status/Bluestar-coder/ToolsBox/ci.yml?branch=main&label=CI)](https://github.com/Bluestar-coder/ToolsBox/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![Tauri](https://img.shields.io/badge/Tauri-2-24c8db)
![License](https://img.shields.io/badge/License-MIT-green)

ToolsBox is a comprehensive productivity toolkit for developers, security engineers, QA teams, and operations teams. It delivers a unified Web and desktop experience across common workflows including encoding, cryptography, time processing, code formatting, network debugging, QR code recognition, IP/network analysis, and composable transformation pipelines.

Built with React, TypeScript, Vite, and Tauri, the project is designed around four principles:

- A unified entry point for high-frequency engineering utilities
- Local-first processing for better data control
- A modular architecture that remains maintainable as the product grows
- Quality gates and automation designed to support ongoing refactoring

## Product Overview

ToolsBox currently covers 10 major tool domains:

| Domain | Description |
| --- | --- |
| Encoding / Decoding | Base encodings, text encodings, radix conversion, image/Base64 conversion |
| Cryptography | Symmetric encryption, asymmetric cryptography, hashing, KDF, JWT, classical ciphers, Chinese cryptography |
| Time Tools | Time parsing, calculations, batch conversion, timezone handling, unique ID generation |
| Code Formatting | JSON, SQL, HTTP payload formatting, and multi-language formatting |
| Regex Tools | Testing, replacing, splitting, and reusable patterns |
| QR Code Tools | QR code generation, camera scanning, image recognition, clipboard recognition |
| Diff | Text, code, and JSON comparison |
| HTTP Debug | HTTP request debugging, variables, history, and response inspection |
| IP / Network Tools | IP conversion, CIDR, subnet planning, geolocation, and port reference |
| Recipe | CyberChef-inspired chained transformation workflows |

## Core Capabilities

### Encoding / Decoding

- Base64, Base16, Base32, Base32Hex, Base36, Base58, Base62, Base64URL, Base85, Base91
- URL encoding, HTML entities, Unicode, and Escape transformations
- Binary, octal, decimal, hexadecimal, and custom radix conversion
- Image to Base64 and Base64 to image workflows

### Cryptography

#### Symmetric Encryption

- AES with CBC, ECB, CFB, OFB, and CTR across 128/192/256-bit keys
- DES and 3DES
- AES-GCM, AES-SIV, ChaCha20-Poly1305
- RC2, RC4, RC4Drop, Blowfish

#### Asymmetric Cryptography and Signatures

- RSA for encryption, decryption, signing, and verification
- ECDSA on secp256k1, P-256, and P-384
- Ed25519, X25519, and ECDH

#### Hashing, KDF, and Tokens

- Hashing: MD5, SHA-1, SHA-256, SHA-384, SHA-512
- KDF: PBKDF2, HKDF
- MAC: HMAC-MD5, HMAC-SHA1, HMAC-SHA256, HMAC-SHA512
- JWT decoding, verification, and generation

#### Classical and Chinese Cryptography

- Classical ciphers such as Caesar, ROT13, ROT47, Atbash, Affine, Vigenere, Playfair, Bacon, Rail Fence, Columnar Transposition, and Morse
- Chinese cryptography: SM2, SM3, SM4, ZUC

### Time Tools

- Smart parsing for timestamps, ISO values, and common date-time formats
- Time difference and arithmetic
- Batch conversion and timezone processing
- Code generation for JavaScript, Python, Java, Go, and more
- UUID v1/v4, GUID, NanoID, ULID, Snowflake ID, and ObjectId generation

### Code Formatting

- JSON formatting, minification, and validation
- SQL formatting, minification, and statement analysis
- HTTP request and response payload formatting
- Multi-language support for JavaScript, TypeScript, HTML, CSS, SCSS, LESS, XML, YAML, Markdown, GraphQL, PHP, and more

### Regex Tools

- Real-time highlighting
- Capture group inspection
- Replace and split workflows
- Reusable regex templates

### QR Code Tools

- QR code generation with configurable size, margin, error correction, foreground, and background colors
- Camera scanning, image upload recognition, and clipboard-based recognition
- Native `BarcodeDetector` used when available
- Automatic fallback to `jsQR` when native detection is unavailable

### Network Debugging

#### HTTP Debug

- GET, POST, PUT, DELETE, PATCH, HEAD, and OPTIONS support
- JSON, Form, Multipart, Raw, and Binary payloads
- `{{variable}}` template substitution
- Request history and structured response inspection
- Desktop mode removes browser CORS limitations for local debugging

#### WebSocket Debug

- `ws://` and `wss://` support
- Text and binary messages
- Timeline-style message logs
- Auto-reconnect configuration
- Custom subprotocol support

### IP / Network Analysis

- IPv4 and IPv6 conversion
- CIDR calculation, network address, and broadcast derivation
- Subnet planning and subnet mask conversion
- IP geolocation and batch lookup
- Port reference search with risk labeling

### Recipe Workflows

- Chained step composition for repeatable transformations
- Suitable for reusable data-processing flows
- Designed for complex multi-step conversion scenarios

## Delivery Modes

| Mode | Best For | Description |
| --- | --- | --- |
| Web | Quick browser access, cross-platform usage | Zero-install workflow for everyday utility use |
| Tauri Desktop | Local debugging, cross-origin requests, desktop workflows | Stronger local capabilities with a more native desktop experience |

### Tauri Desktop Highlights

- HTTP debugging without browser CORS restrictions
- Window state persistence
- Native desktop startup and runtime experience
- Desktop smoke automation support

## Language Support

- Simplified Chinese
- English

## Quality Assurance

ToolsBox is not positioned as a loose collection of utilities. Quality gates, coverage controls, and desktop automation are built into the delivery process.

### Test and Gate Commands

```bash
# Code quality
npm run lint

# Fast regression on core modules
npm run test:core

# Full test suite with grouped coverage thresholds
npm run test:coverage:core

# Browser smoke test
npm run test:e2e:smoke

# Tauri desktop smoke test
npm run test:e2e:tauri

# Tauri security baseline
npm run security:tauri:check
```

### Coverage Strategy

Coverage gating is implemented in `scripts/check-core-coverage.mjs`. Instead of relying on a single global threshold, the project uses grouped thresholds across:

- `encoder`
- `core`
- `recipe`
- `formatter`
- `http-debug`
- `ip-network`
- `qrcode`
- `regex`
- `diff`
- `crypto-core`
- `time`
- `plugins`
- `infrastructure`

This makes the quality model more resilient for a modular product and reduces the chance that local regressions are hidden by global averages.

### CI and Desktop Automation

- CI workflow: `.github/workflows/ci.yml`
- Tauri desktop smoke is wired into CI and runs on a macOS runner
- Desktop smoke script: `scripts/tauri-desktop-smoke.mjs`
- Current smoke scope includes `tauri dev` boot, port cleanup, macOS window activation, built-in window capture, luminance analysis, blank-screen detection, and artifact upload

## Security and Privacy

- Most processing is executed locally and does not depend on a remote application backend
- Browser-mode HTTP requests are subject to CORS; the Tauri desktop build is recommended for cross-origin debugging
- Tauri security baseline script: `scripts/check-tauri-security.mjs`
- Current baseline requires:
  - `app.security.csp` must not fall back to `null`
  - required directives include `default-src`, `script-src`, `base-uri`, `form-action`, and `object-src`
  - `connect-src` keeps `http/https/ws/wss` to support debugging scenarios

Operational guidance:

- ECB is not recommended for production use; prefer CBC, GCM, CTR, or other AEAD modes
- RC4 and similar legacy algorithms are included for learning and compatibility, not for modern secure deployment
- Users are responsible for protecting private keys, secrets, and tokens processed through the toolkit

## Technology Stack

- React 19
- TypeScript 5.9
- Ant Design 6
- Vite 7
- Tauri 2
- React Router 7
- i18next
- Vitest + Testing Library
- Prettier / sql-formatter
- qrcode / BarcodeDetector / jsQR
- crypto-js / @noble/curves / @noble/ciphers / sm-crypto / jose

## Quick Start

### Web

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

### Tauri Desktop

```bash
npm install
npm run tauri dev
```

Run the desktop smoke test:

```bash
npm run test:e2e:tauri
```

Notes:

- The script starts `npm run tauri dev` by default
- The current smoke flow targets macOS desktop verification
- Local runs no longer depend on an external screenshot helper and use the built-in macOS window capture path
- Reuse an existing Vite/Tauri environment with `TOOLSBOX_TAURI_SKIP_START=1`
- Use `TOOLSBOX_TAURI_ARTIFACT_DIR` to persist the screenshot, luminance analysis, and Tauri log output

Build the desktop application:

```bash
npm run tauri build
```

## Engineering Architecture

### Module Catalog

- Module metadata is centralized in `src/modules/catalog.ts`
- Routing, navigation, titles, and type-parameter validation all share the same catalog
- This keeps module growth and module renaming consistent across the product

### Runtime Loading

- The dashboard and side navigation subscribe to the runtime module list via `src/hooks/useModules.ts`
- High-dependency modules such as `CodeFormatter` and `QRCodeTool` load by tab
- Heavy capabilities have been split by runtime entry point to avoid unnecessary dependency loading

### Plugin and Extension Model

- Plugin manager: `src/plugins/PluginManager.ts`
- Plugin behavior is covered by dedicated tests and coverage gates
- This creates a more stable boundary for future extension work

## Repository Structure

```text
.
├── src/                     # Web frontend source
│   ├── components/          # Shared UI components
│   ├── context/             # React context layers
│   ├── hooks/               # Custom hooks
│   ├── i18n/                # Localization setup
│   ├── modules/             # Product modules and module catalog
│   ├── pages/               # Route-level pages
│   ├── plugins/             # Plugin system
│   ├── router/              # Routing configuration
│   ├── utils/               # Shared utilities
│   └── types/               # Shared types
├── src-tauri/               # Tauri desktop source and configuration
├── scripts/                 # Build, test, and gate scripts
├── .github/workflows/       # CI workflows
├── TAURI_TEST_GUIDE.md      # Desktop testing guide
├── TAURI_STATUS_SUMMARY.md  # Desktop capability summary
└── README.en.md
```

## Related Documentation

- [Tauri Test Guide](./TAURI_TEST_GUIDE.md)
- [Tauri Status Summary](./TAURI_STATUS_SUMMARY.md)

## Browser Support

Supports current versions of Chrome, Firefox, Safari, and Edge.

## License

MIT License
