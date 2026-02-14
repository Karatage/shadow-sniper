# Contributing to ShadowSniper

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

1. **Fork and clone:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/shadow-sniper.git
   cd shadow-sniper
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start local dev stack:**
   ```bash
   cd docker && docker-compose up -d
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

## Project Structure

```
shadow-sniper/
├── contract/
│   ├── src/
│   │   ├── shadow_sniper.compact   # Core smart contract
│   │   └── test/                   # Contract tests
│   └── managed/                    # Generated TypeScript bindings
├── api/
│   └── src/
│       ├── shadow-sniper-api.ts    # API wrapper
│       ├── types.ts                # Type definitions
│       └── utils/                  # RNG, time utilities
├── cli/
│   └── src/
│       ├── index.ts                # CLI entry point
│       └── commands/               # Command implementations
├── operator/
│   └── src/                        # Automated operator service
└── docker/                         # Local dev environment
```

## Development Workflow

### Making Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

3. **Build and test:**
   ```bash
   npm run build
   npm test
   ```

4. **Commit with conventional commits:**
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug in X"
   git commit -m "docs: update README"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions or modifications
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

### Testing

```bash
# Run all tests
npm test

# Test specific workspace
npm test --workspace=contract
npm test --workspace=api

# Test contract manually
cd docker && docker-compose up -d
npx shadow-sniper deploy --operator <ADDRESS>
# ... test game flow
```

## Contributing Areas

### Phase 1 (Current)
- ✅ Contract implementation
- ✅ API wrapper
- ✅ CLI tool
- Contract unit tests (in progress)
- Integration tests

### Phase 2 (Token Integration)
- NIGHT token `receive()` / `send()` integration
- Fee withdrawal implementation
- Token flow testing

### Phase 3 (Operator Service)
- Automated round management
- Secret derivation and storage
- Health monitoring

### Phase 4 (Web UI)
- React frontend
- Wallet integration (Lace)
- Real-time updates
- Leaderboards

### Other Areas
- Documentation improvements
- Bug fixes
- Performance optimizations
- Security audits

## Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Use Prettier (run `npm run format`)
- **Linting**: ESLint configured (run `npm run lint`)
- **Naming**: camelCase for functions/variables, PascalCase for types/classes

## Contract Development

### Writing Compact Code

```compact
// Always use disclose for public data
disclose {
  ledger.someField = value;
}

// Use assertions for validation
assert(condition, "Error message");

// Document complex logic
// Explanation of what this does...
let result = complexCalculation();
```

### Testing Contracts

```typescript
// contract/src/test/shadow_sniper.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('ShadowSniper', () => {
  it('should handle single player refund', async () => {
    // Test implementation
  });
});
```

## API Development

### Adding New API Methods

```typescript
// api/src/shadow-sniper-api.ts
export class ShadowSniperAPI {
  async newMethod(param: string): Promise<Result> {
    this.ensureConnected();
    // Validation
    // Call contract
    // Return result
  }
}
```

### Adding Utility Functions

```typescript
// api/src/utils/new-util.ts
export function utilityFunction(input: Type): Output {
  // Implementation
}
```

## CLI Development

### Adding New Commands

```typescript
// cli/src/commands/new-command.ts
import { ShadowSniperAPI } from '@shadow-sniper/api';

export interface NewCommandOptions {
  // Define options
}

export async function newCommand(options: NewCommandOptions): Promise<void> {
  // Implementation
}
```

```typescript
// cli/src/index.ts
import { newCommand } from './commands/new-command.js';

program
  .command('new-command')
  .description('Description')
  .requiredOption('--option <value>', 'Description')
  .action(async (options) => {
    await newCommand(options);
  });
```

## Documentation

- Update README.md for user-facing changes
- Add inline comments for complex logic
- Update QUICKSTART.md for workflow changes
- Document breaking changes in PR description

## Security

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Email security@[project-domain] (when available)
3. Include detailed description and reproduction steps

## Questions?

- Open a [GitHub Discussion](https://github.com/Karatage/shadow-sniper/discussions)
- Ask in [Midnight Discord](https://discord.gg/midnight)
- Check existing issues and docs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
