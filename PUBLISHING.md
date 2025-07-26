# NPM Publishing Guide

This document explains how to publish **@llmbase/mcp-servers** to npm, both manually and automatically via GitHub Actions.

## 🚀 Automatic Publishing (Recommended)

### Prerequisites

1. **GitHub Repository Setup**
   - Repository must be public or have npm publishing permissions
   - GitHub Actions must be enabled

2. **Required Secrets**
   
   Configure these in GitHub Repository Settings → Secrets and variables → Actions:

   ```
   NPM_TOKEN - Your npm authentication token
   GITHUB_TOKEN - Automatically provided by GitHub Actions
   ```

### Getting NPM Token

1. **Create npm account** at [npmjs.com](https://www.npmjs.com)
2. **Generate Access Token**:
   ```bash
   npm login
   npm token create --read-only
   ```
3. **Add to GitHub Secrets** as `NPM_TOKEN`

### Publishing Methods

#### Method 1: Tag-based Release (Recommended)

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

The GitHub Action will automatically:
- Build the project
- Run tests and validation
- Create a GitHub release
- Publish to npm

#### Method 2: Manual Workflow Dispatch

1. Go to **GitHub Actions** tab in your repository
2. Select **"Publish to npm"** workflow  
3. Click **"Run workflow"**
4. Choose version bump: `patch`, `minor`, or `major`
5. Click **"Run workflow"**

This will:
- Bump the version in `package.json`
- Create a git tag
- Build and publish to npm
- Create a GitHub release

## 🔧 Manual Publishing

### Prerequisites

```bash
# Install dependencies
bun install

# Login to npm
npm login

# Verify login
npm whoami
```

### Publishing Steps

1. **Version Bump**
   ```bash
   # Patch (1.0.0 → 1.0.1)
   npm version patch

   # Minor (1.0.0 → 1.1.0)  
   npm version minor

   # Major (1.0.0 → 2.0.0)
   npm version major
   ```

2. **Build Project**
   ```bash
   bun run build
   ```

3. **Validate Package**
   ```bash
   # Check what will be published
   npm pack --dry-run

   # Test package locally
   npm pack
   tar -tzf *.tgz
   ```

4. **Publish to npm**
   ```bash
   npm publish
   ```

5. **Push Changes**
   ```bash
   git push origin main
   git push origin --tags
   ```

## 📋 Pre-publish Checklist

### Code Quality
- [ ] All TypeScript errors resolved (`bun run build`)
- [ ] Linting passes (`bun run lint`)
- [ ] Code is formatted (`bun run format`)
- [ ] No console.log statements in production code

### Documentation  
- [ ] README.md is comprehensive and up-to-date
- [ ] ENDPOINTS.md documents all API endpoints
- [ ] CLAUDE.md provides development context
- [ ] CHANGELOG.md updated with new version changes

### Package Configuration
- [ ] `package.json` version incremented
- [ ] Correct main/module/types paths in `package.json`
- [ ] All required files included in `files` array
- [ ] Keywords and description are accurate
- [ ] Repository URL is correct

### Build Verification
- [ ] `dist/` folder contains compiled files
- [ ] `dist/index.js` and `dist/index.d.ts` exist
- [ ] TypeScript declarations are complete
- [ ] No unnecessary files in build output

### Testing
- [ ] Manual API testing completed
- [ ] MCP client integration tested
- [ ] No sensitive data in published files
- [ ] Package size is reasonable (< 1MB)

## 🔍 Post-publish Verification

### NPM Package
1. **Check npm registry**:
   ```bash
   npm info @llmbase/mcp-servers
   ```

2. **Verify installation**:
   ```bash
   mkdir test-install
   cd test-install
   npm init -y
   npm install @llmbase/mcp-servers
   node -e "console.log(require('@llmbase/mcp-servers'))"
   ```

### GitHub Release
- [ ] Release created with correct tag
- [ ] Release notes are informative
- [ ] All assets attached correctly

### Live Deployment
- [ ] https://mcp.llmbase.ai is accessible
- [ ] All endpoints respond correctly
- [ ] MCP integration works with Claude Desktop

## 📊 Package Analytics

Monitor your package performance:

- **npm Stats**: https://www.npmjs.com/package/@llmbase/mcp-servers
- **GitHub Insights**: Repository → Insights → Traffic
- **Download Statistics**: 
  ```bash
  npm info @llmbase/mcp-servers --json | jq '.downloads'
  ```

## 🐛 Troubleshooting

### Build Issues

**Problem**: TypeScript compilation fails
```bash
error TS2345: Argument of type '...' is not assignable
```

**Solution**: 
- Check `tsconfig.json` configuration
- Ensure all dependencies have correct types
- Verify `@types/` packages are installed

### Publishing Issues

**Problem**: `npm publish` fails with authentication error
```bash
npm ERR! 401 Unauthorized
```

**Solution**:
```bash
npm login
# Re-enter credentials
npm whoami  # Verify login
```

**Problem**: Version already exists
```bash
npm ERR! 403 Forbidden - You cannot publish over the pre-existing version
```

**Solution**:
```bash
npm version patch  # Increment version
npm publish
```

### GitHub Actions Issues

**Problem**: Workflow fails at npm publish step
- Check `NPM_TOKEN` secret is configured
- Verify token has publish permissions
- Ensure package name doesn't conflict

**Problem**: Build fails in CI
- Check all dependencies are in `package.json`
- Verify TypeScript configuration
- Ensure all required files are committed

## 🔄 Version Management

### Semantic Versioning

Follow [semver](https://semver.org/) standards:

- **PATCH** (1.0.1): Bug fixes, internal changes
- **MINOR** (1.1.0): New features, backwards compatible
- **MAJOR** (2.0.0): Breaking changes

### Version Scripts

Package includes helpful npm scripts:

```bash
npm version patch && npm run build && npm publish
```

This automatically:
1. Increments patch version
2. Runs formatting and linting
3. Builds the project
4. Commits version changes
5. Creates git tag
6. Pushes to remote

## 📁 Package Contents

The published package includes:

```
@llmbase/mcp-servers/
├── dist/                 # Compiled JavaScript + TypeScript declarations
│   ├── index.js
│   ├── index.d.ts
│   └── ...
├── src/                  # Source TypeScript files  
├── wrangler.jsonc        # Cloudflare Workers configuration
├── README.md             # Package documentation
├── ENDPOINTS.md          # API reference
├── CLAUDE.md             # Development guide
├── LICENSE               # MIT license
└── package.json          # Package metadata
```

## 🎯 Best Practices

### Before Publishing
1. **Test thoroughly** with real MCP clients
2. **Update documentation** for any API changes
3. **Review diff** of changes since last version
4. **Check dependencies** for security updates

### Release Notes
Always include in GitHub releases:
- **What's New**: Features and improvements
- **Breaking Changes**: API modifications
- **Bug Fixes**: Issues resolved
- **Installation**: Updated install instructions

### Security
- **Never commit** sensitive tokens or keys
- **Review dependencies** for vulnerabilities
- **Use secrets** for all authentication tokens
- **Enable 2FA** on npm account

## 🚨 Emergency Procedures

### Unpublish Package
```bash
# Only within 24 hours of publishing
npm unpublish @llmbase/mcp-servers@1.0.0

# For critical security issues
npm unpublish @llmbase/mcp-servers --force
```

### Deprecate Version
```bash
npm deprecate @llmbase/mcp-servers@1.0.0 "Security vulnerability, use 1.0.1+"
```

### Update Description
```bash
# Update package.json, then:
npm publish
```

## 📞 Support

For publishing issues:
- **GitHub Issues**: Project repository issues
- **npm Support**: support@npmjs.com  
- **Cloudflare Workers**: Cloudflare Community

---

**Ready to publish?** Follow the automatic publishing method for the smoothest experience! 🚀