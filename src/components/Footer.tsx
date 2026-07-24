import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="mt-16 w-full bg-einstein">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <p className="text-neutral-100 text-sm">
          POC de métricas de qualidade — time de pacientes, Portal Einstein.
        </p>
        <Image
          alt="CI&T"
          className="h-5 w-auto"
          height={20}
          src="/logo-cit-white.png"
          width={80}
        />
      </div>
    </footer>
  );
}
