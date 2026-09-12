import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { UserFacingError } from "@/lib/errors";
import {
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MIME_TYPES,
  type DocumentFile,
} from "./api";

/**
 * Scelta di un documento sul telefono, pronto per lo Storage.
 *
 * ⚠️ Solo nativo: importa due moduli Expo. Non va importato da `web/`, dove il
 * file arriva già da un `<input type="file">`.
 */

/** Null se l'utente annulla. */
export async function pickDocument(): Promise<DocumentFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: [...DOCUMENT_MIME_TYPES],
    // Obbligatorio: senza, su Android l'uri punta a un content provider che
    // expo-file-system non sa leggere.
    copyToCacheDirectory: true,
    multiple: false,
  });
  const asset = res.canceled ? null : res.assets[0];
  if (!asset) return null;

  // Il limite è anche sul bucket, ma di là si torna un 413 con un corpo scarno:
  // tradotto in toast diventerebbe un messaggio che non dice cosa fare.
  if (asset.size != null && asset.size > DOCUMENT_MAX_BYTES) {
    throw new UserFacingError("Il file supera 10 MB. Riducilo e riprova.");
  }

  // ⚠️ NON `await (await fetch(uri)).blob()`: su React Native quel Blob si
  // costruisce senza errori e carica **0 byte**. Lo Storage accetta l'oggetto,
  // la riga si salva, e il documento risulta vuoto solo a chi prova ad aprirlo.
  // Questa è l'API di expo-file-system (SDK 56), che legge i byte veri.
  const bytes = await new File(asset.uri).arrayBuffer();

  return {
    bytes,
    fileName: asset.name,
    mimeType: asset.mimeType ?? "application/octet-stream",
    sizeBytes: asset.size ?? null,
  };
}
