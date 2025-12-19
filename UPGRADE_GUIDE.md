# Guide to Setting Up and Upgrading the **Gemverse Casino** Repository

## 1. Overview

The Kimi AI conversation provided an extensive technical specification for building a *GEMVERSE Casino* web application using **Next.js**, **Supabase**/**PostgreSQL**, **Prisma**, and modern TypeScript/React tooling.  Rather than containing a downloadable code archive, the conversation generated multiple source files within the chat.  Below is a forward‑looking plan and actionable steps for establishing a working project structure on GitHub and integrating the generated code.

> **Important Note:** Only the shell scripts (`start.sh`), `Dockerfile`, and `docker-compose.yml` were present in the existing GitHub repository `gemverse-casino-automated`.  No application code (e.g., `package.json`, Next.js pages) was committed.  To fully realise the Kimi AI specification, you need to create the project structure locally and then push the files to GitHub.

## 2. Preparing the Local Development Environment

1. **Install Node.js (v18+) and npm** if you have not already.
2. **Install Docker Desktop** and enable the WSL 2 integration on Windows.  The Docker docs describe enabling WSL features (`wsl --install`, `wsl --update`), installing Docker Desktop, and starting Docker Engine【240156833530973†L1045-L1104】.
3. Verify `docker compose` is available.  If the command is not recognised, install or reinstall Docker Compose and ensure the executable is in your system `PATH`【529491485172307†L106-L178】.

## 3. Bootstrapping the Next.js Project

The conversation suggests a **Next.js 14** app with TypeScript, Tailwind CSS, ShadCN UI, and Zustand.  To scaffold this:

1. Open a terminal and run:

   ```bash
   npx create-next-app@latest gemverse-casino -e with-typescript-tw-zustand
   cd gemverse-casino
   ```

   - This sets up a **TypeScript** project with **Tailwind** and **Zustand** state management preconfigured.

2. Add **Supabase** and **Prisma**:

   ```bash
   npm install @supabase/supabase-js @supabase/auth-ui-react @prisma/client
   npm install -D prisma
   npx prisma init
   ```

   - Configure your **Supabase** credentials in `.env` and update `prisma/schema.prisma` with the database connection string (also used in `DATABASE_URL` inside `docker-compose.yml`).

3. Copy the `Dockerfile`, `docker-compose.yml`, and `start.sh` from the existing repository.  These files define services for Postgres and your Next.js app; the `start.sh` script waits for the database before running migrations and starting the dev server【432272495912652†L0-L14】.

## 4. Integrating the Permission System

The Kimi conversation created a comprehensive **permission and role management** system.  The core logic (simplified for brevity) is shown below; create `src/lib/permission.ts` in your Next.js project and populate it accordingly:

```ts
// src/lib/permission.ts
export enum Permission {
  VIEW_USERS = "VIEW_USERS",
  EDIT_USERS = "EDIT_USERS",
  BAN_USERS = "BAN_USERS",
  // ... include all permissions defined by Kimi
}

export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  PLAYER = "PLAYER"
}

const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  [Role.OWNER]: new Set([...Object.values(Permission)]),
  [Role.ADMIN]: new Set([Permission.VIEW_USERS, Permission.EDIT_USERS, /* other admin perms */]),
  [Role.PLAYER]: new Set()  // players have no management permissions
};

export class PermissionManager {
  static hasPermission(role: Role, permission: Permission): boolean {
    if (role === Role.OWNER) return true;
    return ROLE_PERMISSIONS[role].has(permission);
  }

  // Additional methods: hasAnyPermission, hasAllPermissions, etc.
  // The full version from Kimi also includes checks for modifying users, protecting actions,
  // and validating permission transitions【464131720977430†screenshot】.
}
```

- Adjust the permission names and logic to match the full enumeration generated in the conversation【859959143170380†screenshot】.
- Use this module throughout your API routes and page components to enforce access control.

## 5. Creating Page Routes and API Endpoints

The conversation includes numerous tasks such as:

- **Authentication**: pages for registering (`/register`), logging in (`/login`), and verifying emails.
- **Account Dashboard**: deposit, withdrawal, and transaction history features.
- **Games**: modules for Mines, Plinko, Crash.
- **Admin and Owner Dashboards**: user management, viewing game statistics, editing site settings.

Because the chat generated code for each route, you will need to manually transfer those implementations into your project.  For each file created in the Kimi interface (e.g., `app/api/auth/[...nextauth]/route.ts`, `app/dashboard/page.tsx`, `app/admin/users/page.tsx`), follow this process:

1. In the Kimi conversation, open the file via the interface and copy the full source code.
2. In your local repository, replicate the directory structure and create a matching file (for example, `app/api/auth/[...nextauth]/route.ts`).
3. Paste the code into the file, preserving imports and TypeScript annotations.
4. Repeat for every file listed in the Kimi conversation.

Unfortunately, there is no automated way to bulk-download these snippets; you must copy each file manually.

## 6. Database Schema and Seeding

The conversation specified a **PostgreSQL** schema with tables for users, gems, transactions, games, and roles.  Translate this into your `prisma/schema.prisma` file, for example:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  hashedPwd String
  role      Role     @default(PLAYER)
  // ...
}

enum Role {
  OWNER
  ADMIN
  PLAYER
}

// Define models for Gem, Transaction, Game, etc.
```

After editing `schema.prisma`, run:

```bash
npx prisma migrate dev --name init
```

This will create migration files and update the database.  Use `npx prisma generate` to regenerate the Prisma client.

## 7. Committing and Pushing to GitHub

1. Initialise a Git repository in your local project directory (if not already):

   ```bash
   git init
   git remote add origin https://github.com/kieranhoath3-ui/gemverse-casino.git
   ```

2. Add and commit your new files:

   ```bash
   git add .
   git commit -m "Initial implementation of Gemverse Casino – base setup, permission system, and scaffolding"
   ```

3. Push to GitHub:

   ```bash
   git push -u origin main
   ```

   - Ensure you are authenticated (via personal access token or GitHub CLI).  If the repository is private, confirm your credentials.

## 8. Running the Application with Docker Compose

With all files in place, build and run the services:

```bash
docker compose up --build
```

Docker will:

- Start a **Postgres** container and create the `gemverse` database.
- Build the **Next.js** app container using the `Dockerfile`.
- Execute the `start.sh` script, which waits for the database to be ready, applies Prisma migrations, and starts the development server【432272495912652†L0-L14】.

Visit `http://localhost:3000` in your browser to see the app.

## 9. Future Enhancements and Next Steps

- **Testing**: Add unit and integration tests for the permission manager, API routes, and React components.
- **CI/CD**: Configure GitHub Actions to run tests and build containers on each push.
- **Security**: Harden authentication using environment variables for secrets; implement rate limiting and input validation.
- **Deployment**: Consider deploying to **Vercel** or a **Docker** host with `docker-compose` in production.

## 10. Conclusion

Although the Kimi conversation contains a rich blueprint for the **Gemverse Casino**, it does not automatically push files to your GitHub repository.  Use this guide to bootstrap the project, integrate the permission system, copy the generated code manually, and push a fully functional version to GitHub.  Ensure you follow security best practices and iterate on the features based on the original specification and your own requirements.
