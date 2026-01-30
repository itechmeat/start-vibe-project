import type { SpinnerHandle, SpinnerPort } from '../../app/ports/index.js';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export class TerminalSpinnerAdapter implements SpinnerPort {
  start(message: string): SpinnerHandle {
    if (!process.stdout.isTTY) {
      console.log(message);
      return {
        update: () => {},
        stop: (finalMessage?: string) => {
          if (finalMessage) {
            console.log(finalMessage);
          }
        },
      };
    }

    let frameIndex = 0;
    let currentMessage = message;

    const render = () => {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${SPINNER_FRAMES[frameIndex]} ${currentMessage}`);
      frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
    };

    render();
    const timer = setInterval(render, 80);
    timer.unref();

    return {
      update: (newMessage: string) => {
        currentMessage = newMessage;
      },
      stop: (finalMessage?: string) => {
        clearInterval(timer);
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        console.log(finalMessage ?? currentMessage);
      },
    };
  }
}
