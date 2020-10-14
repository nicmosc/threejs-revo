import { useEffect, useState } from 'react';

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener('load', () => {
      resolve(image);
    });
    image.src = url;
  });
}

export function useLoadImages(
  url: string,
  total: number,
): { isLoading: boolean; images?: Array<HTMLImageElement> } {
  const [images, setImages] = useState<Array<HTMLImageElement>>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImages = async () => {
      const promises: Array<Promise<HTMLImageElement>> = [...new Array(total)].map((_, i) =>
        // 26760-REV-S1
        loadImage(`${url}/Tea_${String(i).padStart(4, '0')}.jpg`),
      );
      const images = await Promise.all(promises);
      setImages(images);
      setIsLoading(false);
    };
    loadImages();
  }, []);

  return { images, isLoading };
}
