import Image from 'next/image';

export default function Header() {
  return (
    <header className="w-full border-neutral-300 border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Image
          alt="Hospital Israelita Albert Einstein"
          className="h-8 w-auto"
          height={37}
          priority
          src="/logo-einstein.svg"
          width={160}
        />
        <div className="flex items-center rounded bg-einstein px-3 py-2">
          <Image
            alt="CI&T"
            className="h-5 w-auto"
            height={20}
            src="/logo-cit-white.png"
            width={80}
          />
        </div>
      </div>
    </header>
  );
}
