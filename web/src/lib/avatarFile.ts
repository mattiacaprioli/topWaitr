/**
 * Preparazione della foto profilo prima del caricamento.
 *
 * Da scrivania si scelgono file da 8 MP presi col telefono: caricarli così
 * significa sprecare banda in salita e poi farli riscaricare a ogni elenco in
 * cui compare quella faccia. Il ritaglio quadrato lo fa qui il browser, una
 * volta, invece che il CSS su ogni schermata.
 */

/** Lato del quadrato finale: basta per l'avatar più grande che mostriamo (96 px)
 *  su schermi a densità doppia, con margine. */
const SIDE = 512;
const QUALITY = 0.85;

export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";

/** Ritaglia al centro, ridimensiona e converte in JPEG. */
export async function prepareAvatar(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Scegli un file immagine.");
  }

  // Il formato di default delle foto iPhone (HEIC) non lo decodifica nessun
  // browser: senza questo, chi trascina una foto appena scaricata dal telefono
  // riceverebbe un messaggio del motore di rendering, in inglese.
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(
      "Formato non supportato dal browser: usa un file JPG, PNG o WEBP."
    );
  });

  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = SIDE;
    canvas.height = SIDE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Immagine non elaborabile su questo browser.");
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, SIDE, SIDE);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );
    if (!blob) throw new Error("Immagine non elaborabile su questo browser.");
    return blob;
  } finally {
    // Il bitmap tiene la memoria finché non lo si chiude, anche dopo il disegno.
    bitmap.close();
  }
}
