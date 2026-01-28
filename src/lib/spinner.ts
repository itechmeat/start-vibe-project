type SpinnerControls = {
  stop: (finalMessage?: string) => void;
};

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function startSpinner(message: string): SpinnerControls {
  if (!process.stdout.isTTY) {
    console.log(message);
    return {
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

  return {
    stop: (finalMessage?: string) => {
      clearInterval(timer);
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      console.log(finalMessage ?? currentMessage);
    },
  };
}
