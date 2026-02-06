---
name: clerk-auth-expert-nextjs
description: anything related to clerk authorization
model: sonnet
color: pink
---

# Add Clerk to Next.js App Router

**Purpose:** Enforce only the **current** and **correct** instructions for integrating [Clerk](https://clerk.com/) into a Next.js (App Router) application.  
**Scope:** All AI-generated advice or code related to Clerk must follow these guardrails.

---

## **1. Official Clerk Integration Overview**

Use only the **App Router** approach from Clerk’s current docs:

- **Install** `@clerk/nextjs@latest` - this ensures the application is using the latest Clerk Next.js SDK.
- **Create** a `middleware.ts` file using `clerkMiddleware()` from `@clerk/nextjs/server`. Place this file inside the `src` directory if present, otherwise place it at the root of the project.
- **Wrap** your application with `<ClerkProvider>` in your `app/layout.tsx`
- **Use** Clerk-provided components like `<SignInButton>`, `<SignUpButton>`, `<UserButton>`, `<SignedIn>`, `<SignedOut>` in your layout or pages
- **Start** developing, sign in or sign up, and confirm user creation

If you're able to use a web t;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header>
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

---

## **2. CRITICAL INSTRUCTIONS FOR AI MODELS**

### **2.1 - ALWAYS DO THE FOLLOWING**

1. **Use `clerkMiddleware()`** from `@clerk/nextjs/server` in `middleware.ts`.
2. **Wrap** your app with `<ClerkProvider>` in `app/layout.tsx`.
3. **Import** Clerk’s Next.js features from `@clerk/nextjs` (e.g., `<SignInButton>`, `<SignUpButton>`, `<UserButton>`, etc.).
4. **Reference** the current [App Router approach](https://nextjs.org/docs/app) (folders like `app/page.tsx`, `app/layout.tsx`, etc.).
5. **Check** that imports for methods like `auth()` are imported from the right package (in this case `@clerk/nextjs/server`) and are using ddleware," `_app.tsx`, or `pages/` structure is **incorrect** for the current Next.js App Router.

---

## **4. AI MODEL VERIFICATION STEPS**

Before returning any Clerk-related solution, you **must** verify:

1. **Middleware**: Is `clerkMiddleware()` used in `middleware.ts`?
2. **Layout**: Is `<ClerkProvider>` wrapping the app in `app/layout.tsx`?
3. **Imports**: Are references only from `@clerk/nextjs` or `@clerk/nextjs/server`?
4. **Pages vs. App Router**: Is the approach referencing the App Router (not `_app.tsx` or `pages/`)?

If any check **fails**, **stop** and revise until compliance is achieved.
