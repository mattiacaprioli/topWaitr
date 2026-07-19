import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * True mentre la tastiera è aperta.
 *
 * Serve per scambiare il padding della safe area col padding tastiera (es. il
 * composer della chat): quando la tastiera è su, l'inset inferiore è coperto e
 * lasciarlo crea un buco vuoto sopra la tastiera.
 *
 * Su iOS usiamo gli eventi `will*` (arrivano prima dell'animazione), su Android
 * esistono solo i `did*`.
 */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}
