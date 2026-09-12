import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";

/**
 * Scelta della foto profilo sul telefono, pronta per `uploadAvatar`.
 *
 * ⚠️ Solo nativo: importa tre moduli Expo. Non va importato da `web/` — lì la
 * stessa cosa la fa `web/src/lib/avatarFile.ts` con un canvas.
 *
 * Lo stesso lato del web (512 px) e la stessa compressione: l'avatar compare in
 * elenchi lunghi, e una foto da 12 megapixel appena ritagliata pesa un paio di
 * MB da scaricare a ogni riga.
 */
const SIDE = 512;
const QUALITY = 0.85;

export type PickedAvatar = { bytes: ArrayBuffer; contentType: string };

/** Null se l'utente annulla. */
export async function pickAvatar(): Promise<PickedAvatar | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    // Il ritaglio quadrato lo fa il sistema, con la sua interfaccia: è già
    // quello che la gente si aspetta quando sceglie una foto profilo.
    allowsEditing: true,
    aspect: [1, 1],
    // Nessuna compressione qui: si comprime una volta sola, dopo il
    // ridimensionamento, altrimenti si perde qualità due volte.
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return null;

  // Solo la larghezza: se il ritaglio non fosse quadrato, forzare anche
  // l'altezza schiaccerebbe la foto. Il cerchio dell'avatar ritaglia da sé.
  const rendered = await ImageManipulator.manipulate(result.assets[0].uri)
    .resize({ width: SIDE })
    .renderAsync();
  const image = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: QUALITY,
  });

  // Nuova API di expo-file-system (SDK 56), come in `uploadCertification`.
  const bytes = await new File(image.uri).arrayBuffer();
  return { bytes, contentType: "image/jpeg" };
}
