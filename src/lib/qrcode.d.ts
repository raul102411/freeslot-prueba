// types/qrcode.d.ts

declare module 'qrcode' {
  interface QRCodeRenderersOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  function toCanvas(
    canvas: HTMLCanvasElement | null,
    text: string,
    options?: QRCodeRenderersOptions
  ): Promise<void>;

  function toDataURL(
    text: string,
    options?: QRCodeRenderersOptions
  ): Promise<string>;

  const QRCode: {
    toCanvas: typeof toCanvas;
    toDataURL: typeof toDataURL;
  };

  export default QRCode;
}
