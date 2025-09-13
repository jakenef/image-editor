import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

function run(args: string[]): void {
  try {
    if (args.length < 3) {
      usage();
      return;
    }

    const inputFile: string = args[0] !== undefined ? args[0] : "";
    const outputFile: string = args[1] !== undefined ? args[1] : "";
    const filter: string = args[2] !== undefined ? args[2] : "";

    let image: Image = read(inputFile);

    if (filter == "motionblur") {
      // the only one that needs 4 args, check it first
      if (args.length != 4) {
        usage();
        return;
      }

      let length = 1;
      try {
        length = Number.parseInt(args[3] ?? "");
      } catch (e) {
        //ignore
      }

      if (length < 0) {
        usage();
        return;
      }

      motionblur(image, length);
    } else {
      // if not motionblur and doesn't have 3 args, we don't want it
      if (args.length != 3) {
        usage();
        return;
      }

      if (filter === "grayscale" || filter === "greyscale") {
        grayscale(image);
      } else if (filter === "invert") {
        invert(image);
      } else if (filter === "emboss") {
        emboss(image);
      } else {
        usage();
      }
    }
    write(image, outputFile);
  } catch (e) {
    console.log(e);
  }
}

function usage(): void {
  console.log(
    "USAGE: npm run start -- <in-file> <out-file> <grayscale | invert | emboss | motionblur> {motion-blur-length}"
  );
}

function motionblur(image: Image, length: number) {
  if (length < 1) {
    return;
  }

  for (let x = 0; x < image.getWidth(); x++) {
    for (let y = 0; y < image.getHeight(); y++) {
      const currentColor: Color = image.get(x, y);

      const maxX: number = Math.min(image.getWidth() - 1, x + length - 1);
      for (let i = x + 1; i <= maxX; i++) {
        const tmpColor: Color = image.get(i, y);
        currentColor.red += tmpColor.red;
        currentColor.green += tmpColor.green;
        currentColor.blue += tmpColor.blue;
      }

      const delta: number = maxX - x + 1;
      currentColor.red = Math.floor(currentColor.red / delta);
      currentColor.green = Math.floor(currentColor.green / delta);
      currentColor.blue = Math.floor(currentColor.blue / delta);
    }
  }
}

function grayscale(image: Image) {}

function invert(image: Image) {}

function emboss(image: Image) {}

function read(inputFile: string): Image {
  let image: Image | null = null;
  const text = readFileSync(inputFile, "utf-8");

  const stripped = text.replace(/#[^\n]*\n/g, "\n");

  const tokens = stripped.trim().split(/\s+/);
  let i = 0;

  //skip P3
  const format = tokens[i++];

  //parse width and height
  const width = parseInt(tokens[i++]!, 10);
  const height = parseInt(tokens[i++]!, 10);
  parseInt(tokens[i++]!, 10); // skip max color value

  const img = new Image(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let color: Color = new Color();
      color.red = parseInt(tokens[i++]!, 10);
      color.green = parseInt(tokens[i++]!, 10);
      color.blue = parseInt(tokens[i++]!, 10);
      img.set(x, y, color);
    }
  }
  return img;
}

function write(image: Image, outputFile: string) {
  let output = `P3\n${image.getWidth()} ${image.getHeight()}\n255\n`;
  for (let y = 0; y < image.getHeight(); y++) {
    for (let x = 0; x < image.getWidth(); x++) {
      const color = image.get(x, y);
      output += `${x === 0 ? "" : " "}${color?.red} ${color?.green} ${
        color?.blue
      }`;
    }
    output += "\n";
  }
  mkdirSync(dirname(outputFile), { recursive: true });

  writeFileSync(outputFile, output, "utf-8");
}

class Color {
  red: number = 0;
  green: number = 0;
  blue: number = 0;
}

class Image {
  pixels: Color[][];

  constructor(width: number, height: number) {
    this.pixels = Array.from({ length: width }, () =>
      Array.from({ length: height }, () => new Color())
    );
  }

  get(x: number, y: number): Color {
    return this.pixels[x]![y]!;
  }

  set(x: number, y: number, c: Color): void {
    this.pixels[x]![y]! = c;
  }

  getWidth(): number {
    return this.pixels.length;
  }

  getHeight(): number {
    return this.pixels[0]!.length;
  }
}

run(process.argv.slice(2));
