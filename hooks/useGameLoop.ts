
import React from 'react';
import { GAME_TICK_RATE } from '../constants';

export const useGameLoop = (callback: () => void, isPaused: boolean) => {
  const callbackRef = React.useRef(callback);

  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  React.useEffect(() => {
    if (isPaused) {
      return;
    }

    const intervalId = setInterval(() => {
      callbackRef.current();
    }, GAME_TICK_RATE);

    return () => clearInterval(intervalId);
  }, [isPaused]);
};
