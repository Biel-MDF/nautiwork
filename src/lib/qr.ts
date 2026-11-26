// QR code que abre o site. Módulos escuros sobre fundo claro (contraste que qualquer câmera lê),
// com margem de 4 módulos, como pede a norma do QR code.
import QRCode from "qrcode";
import { siteUrl } from "./app-url";

export const QR_COLORS = { dark: "#0b2545", light: "#ffffff" };

/** Endereço que o QR abre: a página inicial do site. */
export function qrTarget() {
  return `${siteUrl()}/`;
}

export function qrSvg(target = qrTarget()) {
  return QRCode.toString(target, { type: "svg", errorCorrectionLevel: "M", margin: 4, color: QR_COLORS });
}

export function qrPng(target = qrTarget(), width = 1024) {
  return QRCode.toBuffer(target, { type: "png", errorCorrectionLevel: "M", margin: 4, width, color: QR_COLORS });
}
