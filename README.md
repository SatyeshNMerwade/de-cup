This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Admin access

Current login: `satyesh` / `4Z1uQr9Oi37`

There's no self-service "forgot password" flow — this app has no email sending capability, and realistically only has a couple of admin accounts. If an admin forgets their password (or you need to create/update one from the shell), use the seed script directly:

```bash
npx tsx scripts/seed-db.ts --username <username> --display-name "<Display Name>" --password "<new password>" [--role SUPER_ADMIN|ADMIN]
```

Re-running it with an existing `--username` updates that account's password/display name/role in place (min 8 characters). A `SUPER_ADMIN` can also reset another admin's password in-app from **Admin → Users**, without needing shell access — this CLI path is only needed to reset your *own* password, or to create the very first account on a fresh database.

Five wrong password attempts in a row locks that account out for 15 minutes.
