import { useState, useEffect, useCallback } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

export interface UseKeyboardResult {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  dismissKeyboard: () => void;
}

export const useKeyboard = (): UseKeyboardResult => {
  const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (e: KeyboardEvent) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    };

    const onKeyboardHide = () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return {
    isKeyboardVisible,
    keyboardHeight,
    dismissKeyboard,
  };
};
