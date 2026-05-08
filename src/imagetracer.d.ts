declare module 'imagetracerjs' {
  export interface TracerOptions {
    numberofcolors?: number;
    pathomit?: number;
    ltres?: number;
    qtres?: number;
    linefilter?: boolean;
    scale?: number;
    roundcoords?: number;
    [key: string]: any;
  }

  export function imagedataToSVG(
    imgd: ImageData,
    options?: TracerOptions
  ): string;

  export function imageToSVG(
    url: string,
    options?: TracerOptions,
    callback?: (svg: string) => void
  ): void;

  const ImageTracer: {
    imagedataToSVG: typeof imagedataToSVG;
    imageToSVG: typeof imageToSVG;
  };

  export default ImageTracer;
}
