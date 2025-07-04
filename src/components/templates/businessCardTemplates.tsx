export type DesignTemplate = {
  bgColor: string;
  waveColor: string;
  waveOpacity: number;
  wavePath: string;
};

export const templates: DesignTemplate[] = [
  // 1. Onda Verde sobre Blanco
  {
    bgColor: '#FFFFFF',
    waveColor: '#4CAF50',
    waveOpacity: 0.2,
    wavePath: 'M0.00,49.98 C150,200 350,-50 500,49.98 L500,0 L0,0 Z',
  },
  // 2. Corte Diagonal Celeste
  {
    bgColor: '#E3F2FD',
    waveColor: '#2196F3',
    waveOpacity: 1,
    wavePath: 'M0,120 L500,30 L500,0 L0,0 Z',
  },
  // 3. Líneas Horizontales Naranja
  {
    bgColor: '#FFFFFF',
    waveColor: '#FF9800',
    waveOpacity: 1,
    wavePath: 'M0,50 L500,50 L500,60 L0,60 Z M0,100 L500,100 L500,110 L0,110 Z',
  },
  // 4. Corte en Zigzag Lavanda
  {
    bgColor: '#F3E5F5',
    waveColor: '#9C27B0',
    waveOpacity: 1,
    wavePath: 'M0,70 L50,50 L100,90 L150,60 L200,100 L500,100 L500,0 L0,0 Z',
  },
  // 5. Bloque Dorado sobre Gris Claro
  {
    bgColor: '#F5F5F5',
    waveColor: '#FFD700',
    waveOpacity: 1,
    wavePath: 'M0,0 L250,0 L250,150 L0,150 Z',
  },
  // 6. Bloques Geométricos Verde Neón
  {
    bgColor: '#FFFFFF',
    waveColor: '#00E676',
    waveOpacity: 0.3,
    wavePath: 'M0,0 L100,0 L300,150 L0,150 Z M300,0 L500,0 L500,150 L300,150 Z',
  },
  // 7. Triángulo Gris Suave
  {
    bgColor: '#FAFAFA',
    waveColor: '#BDBDBD',
    waveOpacity: 0.2,
    wavePath: 'M0,0 L500,0 L0,150 Z',
  },
];
