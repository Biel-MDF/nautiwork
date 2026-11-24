/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // O projeto não usa next/image. Com o otimizador desligado, /_next/image responde 404,
  // o que fecha falhas do Next 14 nesse endpoint que só foram corrigidas na linha 15.5.x.
  images: { unoptimized: true },
};
