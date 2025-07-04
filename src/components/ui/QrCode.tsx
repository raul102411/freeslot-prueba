// components/ui/QrCode.tsx
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type Props = {
  value: string;
  size?: number;
};

export default function QrCode({ value, size = 256 }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    QRCode.toDataURL(value, { width: size, margin: 2 })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [value, size]);

  return qrDataUrl ? (
    <img src={qrDataUrl} alt="QR Code" width={size} height={size} />
  ) : (
    <p>Generando QR...</p>
  );
}
