import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">Nothing lives at this address.</p>
      <Link href="/" className="text-sm underline underline-offset-4">
        Back to DE Cup
      </Link>
    </div>
  );
}
