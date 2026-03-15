# GlowPilot: Setup & Run Instructions

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Node.js**: Version 18.x or higher
  - Download from [nodejs.org](https://nodejs.org/)
  - Or install via [nvm](https://github.com/nvm-sh/nvm) (recommended)
- **npm**: Comes with Node.js (version 9.x or higher)
- **Git**: For version control
  - Download from [git-scm.com](https://git-scm.com/)

### Optional but Recommended
- **Bun**: Alternative package manager (faster than npm)
  - Install: `curl -fsSL https://bun.sh/install | bash`
- **VS Code**: Recommended IDE
  - Download from [code.visualstudio.com](https://code.visualstudio.com/)
  - Recommended extensions:
    - ESLint
    - Prettier
    - Tailwind CSS IntelliSense
    - TypeScript Vue Plugin (Volar)

## Initial Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/cawatso3/glowpilot-co-pilot.git

# Navigate to the project directory
cd glowpilot-co-pilot
```

### 2. Install Dependencies

Choose one of the following methods:

**Using npm (standard):**
```bash
npm install
```

**Using bun (faster):**
```bash
bun install
```

This will install all dependencies listed in `package.json`, including:
- React and React DOM
- Vite build tool
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Supabase client
- TanStack Query
- And all other required packages

### 3. Environment Configuration

Create a `.env` file in the root directory of the project:

```bash
# Copy the example env file (if it exists)
cp .env.example .env

# Or create a new .env file
touch .env
```

Add the following environment variables to your `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Third-party Integration Keys
VITE_ACUITY_CLIENT_ID=your_acuity_client_id
VITE_ACUITY_CLIENT_SECRET=your_acuity_client_secret

VITE_SQUARE_APPLICATION_ID=your_square_app_id
VITE_SQUARE_ACCESS_TOKEN=your_square_access_token

VITE_VAGARO_API_KEY=your_vagaro_api_key

VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token

VITE_RESEND_API_KEY=your_resend_api_key
```

#### Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com/) and sign up/login
2. Create a new project or use an existing one
3. Navigate to **Project Settings** > **API**
4. Copy the following:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

**Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

### 4. Database Setup (Supabase)

If you're setting up a new Supabase project, you'll need to create the database schema:

1. Navigate to your Supabase project dashboard
2. Go to **SQL Editor**
3. Run the migration scripts located in `supabase/migrations/` (if available)
4. Or manually create the required tables based on the schema in `src/integrations/supabase/types.ts`

**Key Tables Required:**
- `profiles` - User profiles and settings
- `clients` - Client information
- `content_ideas` - Content planning and scheduling
- `appointments` - Calendar and booking data
- `calendar_gaps` - Available time slots
- `reviews` - Review aggregation
- `campaigns` - Marketing campaigns
- `integrations` - Third-party service connections

### 5. Verify Installation

Check that everything is installed correctly:

```bash
# Check Node.js version
node --version
# Should output v18.x.x or higher

# Check npm version
npm --version
# Should output 9.x.x or higher

# Verify dependencies are installed
ls node_modules
# Should show a list of installed packages
```

## Running the Application

### Development Mode

Start the development server with hot module replacement (HMR):

**Using npm:**
```bash
npm run dev
```

**Using bun:**
```bash
bun run dev
```

The application will start on **http://localhost:8080**

You should see output similar to:
```
VITE v5.4.19  ready in 500 ms

➜  Local:   http://localhost:8080/
➜  Network: http://192.168.1.x:8080/
➜  press h + enter to show help
```

**Development Features:**
- ✅ Hot Module Replacement (instant updates on file save)
- ✅ TypeScript type checking
- ✅ ESLint error reporting
- ✅ Source maps for debugging
- ✅ Fast refresh for React components

### Production Build

Create an optimized production build:

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

The build output will be in the `dist/` directory.

### Development Build

Create a development build (useful for debugging):

```bash
npm run build:dev
```

## Available Scripts

All scripts are defined in `package.json`:

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start development server on port 8080 |
| `build` | `vite build` | Build for production |
| `build:dev` | `vite build --mode development` | Build with development settings |
| `preview` | `vite preview` | Preview production build locally |
| `lint` | `eslint .` | Run ESLint to check code quality |
| `test` | `vitest run` | Run all tests once |
| `test:watch` | `vitest` | Run tests in watch mode |

## Testing

### Unit Tests

Run the test suite using Vitest:

```bash
# Run all tests once
npm run test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

### End-to-End Tests

Run E2E tests using Playwright:

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npx playwright test

# Run E2E tests in UI mode
npx playwright test --ui
```

## Code Quality

### Linting

Check code quality and style:

```bash
# Run ESLint
npm run lint

# Auto-fix linting issues
npm run lint -- --fix
```

### Type Checking

TypeScript type checking is automatic during development, but you can run it manually:

```bash
# Check types
npx tsc --noEmit
```

## Troubleshooting

### Common Issues

#### 1. Port 8080 Already in Use

**Error:** `Port 8080 is already in use`

**Solution:**
```bash
# Find and kill the process using port 8080
lsof -ti:8080 | xargs kill -9

# Or change the port in vite.config.ts
```

#### 2. Module Not Found Errors

**Error:** `Cannot find module '@/components/...'`

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 3. Supabase Connection Issues

**Error:** `Invalid API key` or `Failed to fetch`

**Solution:**
- Verify your `.env` file has correct Supabase credentials
- Check that `VITE_` prefix is present on all environment variables
- Restart the dev server after changing `.env` file

#### 4. TypeScript Errors

**Error:** Type errors in the IDE or build

**Solution:**
```bash
# Restart TypeScript server in VS Code
# Command Palette (Cmd+Shift+P) > "TypeScript: Restart TS Server"

# Or regenerate types
npm run build
```

#### 5. Styling Issues

**Error:** Tailwind classes not working

**Solution:**
```bash
# Ensure Tailwind is properly configured
# Check tailwind.config.ts and postcss.config.js

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Getting Help

If you encounter issues not covered here:

1. **Check the Console**: Look for error messages in browser DevTools (F12)
2. **Check Terminal**: Look for build errors in the terminal running `npm run dev`
3. **Clear Cache**: Try clearing browser cache and Vite cache
4. **Restart**: Restart the dev server
5. **GitHub Issues**: Check existing issues or create a new one

## Development Workflow

### Recommended Workflow

1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Make Changes**
   - Edit files in `src/`
   - Changes auto-reload in browser

3. **Check Types & Lint**
   ```bash
   npm run lint
   ```

4. **Run Tests**
   ```bash
   npm run test
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

6. **Preview Production Build**
   ```bash
   npm run preview
   ```

### Git Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Description of changes"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

## Project Structure Quick Reference

```
glowpilot/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom React hooks
│   ├── integrations/   # External services (Supabase)
│   ├── lib/            # Utility functions
│   ├── types/          # TypeScript types
│   └── App.tsx         # Main app component
├── public/             # Static assets
├── docs/               # Documentation
├── .env                # Environment variables (create this)
├── vite.config.ts      # Vite configuration
├── tailwind.config.ts  # Tailwind configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Next Steps

After successfully running the application:

1. **Explore the Codebase**: Familiarize yourself with the project structure
2. **Read Architecture Docs**: Check `docs/blueprints/architecture.md`
3. **Understand the Problem**: Read `docs/blueprints/purpose-and-problem.md`
4. **Set Up Integrations**: Configure third-party services (Acuity, Square, etc.)
5. **Customize**: Modify components and features as needed
6. **Deploy**: Follow deployment instructions for your hosting platform

## Deployment

### Lovable Platform (Recommended)

1. Visit your [Lovable project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID)
2. Click **Share** → **Publish**
3. Your app will be deployed automatically

### Other Platforms

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Manual Deployment:**
```bash
# Build the app
npm run build

# Upload the dist/ folder to your hosting provider
```

## Environment-Specific Configuration

### Development
- Source maps enabled
- Hot module replacement
- Detailed error messages
- No minification

### Production
- Minified code
- Optimized assets
- Tree shaking
- No source maps (for security)

## Performance Tips

1. **Use Production Build**: Always test with `npm run build` before deploying
2. **Optimize Images**: Compress images in `public/` folder
3. **Code Splitting**: Lazy load routes and components where possible
4. **Monitor Bundle Size**: Check build output for large dependencies
5. **Cache Strategy**: Leverage TanStack Query caching effectively

## Security Best Practices

1. **Never Commit `.env`**: Keep secrets out of version control
2. **Use Environment Variables**: For all API keys and sensitive data
3. **Update Dependencies**: Regularly run `npm audit` and update packages
4. **HTTPS Only**: Always use HTTPS in production
5. **Row Level Security**: Ensure Supabase RLS policies are properly configured

## Support & Resources

- **Documentation**: `docs/blueprints/`
- **GitHub Repository**: https://github.com/cawatso3/glowpilot-co-pilot
- **Supabase Docs**: https://supabase.com/docs
- **Vite Docs**: https://vitejs.dev/
- **React Docs**: https://react.dev/
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **shadcn/ui Docs**: https://ui.shadcn.com/

---

**Happy Coding! 🚀**
