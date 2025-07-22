# Requirements Specification: Web Translator Migration to React Router v7

## Project Overview
Migrate an existing v0-generated Next.js web translator prototype to React Router v7 running on Cloudflare Workers.

## Functional Requirements

### 1. Translation Feature
- **F1.1** Support bidirectional translation between English and Japanese only
- **F1.2** Use OpenAI o4-mini model via Vercel AI SDK for translation
- **F1.3** Implement translation caching using Cloudflare KV with 7-day TTL (cache only raw translated text, not rendered markdown)
- **F1.4** Handle translation errors gracefully with user-friendly error messages
- **F1.5** Preserve markdown formatting in translations
- **F1.6** Route all AI SDK requests through Cloudflare AI Gateway for observability and tracing
- **F1.7** Support streaming responses from AI SDK for real-time translation output display

### 2. User Interface
- **F2.1** Preserve the existing v0 prototype visual design:
  - Two-card layout (source and target)
  - Swap button centered between cards
  - Blue border for source card, purple for target card
  - Character count in card footers
- **F2.2** Implement language swap functionality
- **F2.3** Provide copy-to-clipboard feature for translated text
- **F2.4** Include client-side markdown preview toggle for translated content (only available after translation completes)
- **F2.5** Show loading state on the "Translate" button during translation (button text changes and/or shows spinner)
- **F2.6** Support dark mode (already in prototype)
- **F2.7** Implement syntax highlighting for code blocks in markdown preview using Shiki.js
- **F2.8** Display streaming translation output in real-time as it arrives from the AI model
- **F2.9** Disable markdown preview toggle during translation (button inactive while streaming)
- **F2.10** Automatically turn off markdown preview when starting a new translation

### 3. Language Support
- **F3.1** Support only two languages: English and Japanese
- **F3.2** No auto-detection feature required
- **F3.3** Default source language: English
- **F3.4** Default target language: Japanese

## Technical Requirements

### 4. Architecture
- **T4.1** Use React Router v7 (formerly Remix) as the framework
- **T4.2** Deploy on Cloudflare Workers with Static Assets
- **T4.3** Use Cloudflare Vite Plugin for development and build
- **T4.4** Implement server-side translation with streaming support (no client-side API calls)
- **T4.5** Use TypeScript for type safety
- **T4.6** Use React Router's streaming capabilities to deliver translation results progressively
- **T4.7** Use pnpm as the package manager (not npm or yarn)

### 5. Integration Requirements
- **T5.1** Use Vercel AI SDK (`ai` package) with `@ai-sdk/openai`
- **T5.2** Configure OpenAI API key as Cloudflare Worker secret
- **T5.3** Use Cloudflare KV for translation caching
- **T5.4** Use `wrangler.jsonc` configuration format (not TOML)
- **T5.5** Configure Cloudflare AI Gateway for AI SDK request routing and observability
- **T5.6** Use Shiki.js for client-side syntax highlighting in markdown preview

### 6. Security & Access
- **T6.1** Protect the application with Cloudflare Access
- **T6.2** Restrict access to a single email address (personal use)
- **T6.3** No public access allowed
- **T6.4** API key must be stored as Worker secret, not in code

### 7. Performance
- **T7.1** Cache only complete translated text (not partial streams) to minimize API calls
- **T7.2** Serve static assets efficiently via Workers Static Assets
- **T7.3** Implement proper loading states to improve perceived performance
- **T7.4** Render markdown and apply syntax highlighting on the client side for better performance
- **T7.5** Use streaming to reduce time-to-first-byte and improve perceived translation speed

## Non-Functional Requirements

### 8. Code Quality
- **N8.1** Clean implementation (no direct code copying from v0 prototype)
- **N8.2** Follow React Router v7 best practices
- **N8.3** Use existing shadcn/ui components where applicable
- **N8.4** Proper error handling throughout the application
- **N8.5** Use Biome for linting and formatting (not ESLint or Prettier)

### 9. Testing Requirements
- **N9.1** Implement basic tests for critical functionality only (single-user app)
- **N9.2** Use React Router's recommended testing approach with `createRoutesStub`
- **N9.3** Test translation action (successful translation and error handling)
- **N9.4** Use Testing Library (`@testing-library/react`) as per React Router recommendations
- **N9.5** No need for comprehensive test coverage - focus on core translation functionality

### 10. User Experience
- **N10.1** Maintain the clean, modern aesthetic of the v0 prototype
- **N10.2** Desktop-only design (no mobile support required)
- **N10.3** Provide immediate feedback for all user actions
- **N10.4** Clear error messages when translation fails

## Out of Scope
- **O1** Deployment configuration (user will handle)
- **O2** Rate limiting (personal use only)
- **O3** Usage analytics or tracking
- **O4** Support for additional languages beyond English/Japanese
- **O5** User authentication beyond Cloudflare Access
- **O6** Translation history or saved translations

## Constraints
- **C1** Must use o4-mini model specifically (as confirmed by user)
- **C2** Must preserve the visual design of the v0 prototype
- **C3** No external dependencies beyond specified (OpenAI, Cloudflare, Shiki.js, Testing Library)
- **C4** Single-user application (no multi-tenancy)
- **C5** All AI requests must go through Cloudflare AI Gateway

## Success Criteria
- **S1** Successful migration from Next.js to React Router v7
- **S2** Working translation between English and Japanese
- **S3** All UI features from prototype are functional
- **S4** Application protected by Cloudflare Access
- **S5** Translations are cached and retrieved correctly
- **S6** AI Gateway integration provides request tracing and observability
- **S7** Markdown preview with syntax highlighting works correctly on client side
- **S8** Basic tests pass for translation functionality using React Router testing patterns
- **S9** Translation output streams smoothly to the UI as it's generated