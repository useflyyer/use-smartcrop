# use-smartcrop

This is the React Hook version of [jwagner/smartcrop.js](https://github.com/jwagner/smartcrop.js/) + [lokesh/color-thief](https://github.com/lokesh/color-thief) with Typescript support.

We made this hook for [Flayyer.com](https://flayyer.com?ref=github) to enable developers to create content-aware marketing and social images but it is useful for any kind of project.

![example of content aware cropping](.github/image.jpeg)

## Usage

Install this dependency:

```sh
yarn add use-smartcrop
```

By default images are loading with `crossOrigin=""` prop. [See this StackOverflow thread](https://stackoverflow.com/questions/22097747/how-to-fix-getimagedata-error-the-canvas-has-been-tainted-by-cross-origin-data).

Common case usage:

```tsx
import React from "react";
import { useSmartcrop, SmartcropStatus } from "use-smartcrop";

function App() {
  const src = "https://images.pexels.com/photos/1496286/pexels-photo-1496286.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260";
  const cropped = useSmartcrop(src, { width: 200, height: 400, minScale: 1.0 });

  const status = cropped.status // 0 = LOADING, 1 = LOADED, -1 = FAILED
  if (status === SmartcropStatus.FAILED) {
    const error = cropped.error; // `Error` if status is FAILED
    console.error(error);
  }

  const paletteWholeImage = cropped.getPalette();
  const paletteSection = cropped.getPalette({ x: 10, y: 20, width: 50, height: 50 });

  return (
    <img src={cropped.src} crossOrigin="" />
  );
}
```

Using custom props (`React.ComponentProps<"img">`) for the underlying `img` used to load the image.

```tsx
// Typescript example

const imgProps = { src, crossOrigin: "" } as const // ⛔️ Will trigger infinite renders.
const cropped = useSmartcrop(imgProps, { width: 200, height: 400, minScale: 1.0 });

const imgProps = useMemo(() => ({ src, crossOrigin: "" }) as const, [src]); // ✅ good!
const cropped = useSmartcrop(imgProps, { width: 200, height: 400, minScale: 1.0 });
```
