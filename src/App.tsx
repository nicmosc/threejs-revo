import React, { Fragment, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, MouseEvent } from 'react-three-fiber';

import { VirtualScene } from './VirtualScene';
import { BeautyViewer } from './BeautyViewer';

export interface Pan {
  dx: number;
  dy: number;
}

export const App = () => {
  // TODO the max should be determined from loading the 360 visuals
  const [frame, setFrame] = useState(0);
  const frameRef = useRef<number>(0);
  const xPosRef = useRef<number>();
  const yPosRef = useRef<number>();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({ dx: 0, dy: 0 });
  const [activeEntityId, setActiveEntityId] = useState<string>();

  const handleRotate = (e: MouseEvent) => {
    if (xPosRef.current == null) {
      xPosRef.current = e.clientX;
    }
    if (e.clientX - xPosRef.current < -5) {
      xPosRef.current = e.clientX;
      frameRef.current = frameRef.current === 59 ? 0 : frameRef.current + 1;
    } else if (e.clientX - xPosRef.current > 5) {
      xPosRef.current = e.clientX;
      frameRef.current = frameRef.current === 0 ? 59 : frameRef.current - 1;
    }
    setFrame(frameRef.current);
  };

  const handlePan = (e: MouseEvent) => {
    if (xPosRef.current != null && yPosRef.current != null) {
      const panValues = {
        dx: pan.dx + (xPosRef.current - e.clientX),
        dy: pan.dy + (yPosRef.current - e.clientY),
      };
      setPan(panValues);
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    // right click, but only if zoom is enabled
    if (e.button === 2 && zoom !== 1) {
      // save current client Positions
      xPosRef.current = e.clientX;
      yPosRef.current = e.clientY;

      window.addEventListener('mousemove', handlePan);
    } else {
      window.addEventListener('mousemove', handleRotate);
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    window.removeEventListener('mousemove', handleRotate);
    window.removeEventListener('mousemove', handlePan);
  };

  const handleWheelScroll = (e: WheelEvent) => {
    const difference = e.deltaY;
    if (difference > 50) {
      setPan({ dx: 0, dy: 0 });
      setZoom(1);
    } else if (difference < -50) {
      setZoom(2);
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('wheel', handleWheelScroll);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('wheel', handleWheelScroll);
    };
  }, [zoom]);

  return (
    <Fragment>
      <Canvas
        style={{
          opacity: 0.7,
          // ...panningStyle,
        }}>
        <Suspense fallback="Loading">
          <VirtualScene
            onClickEntity={setActiveEntityId}
            activeEntityId={activeEntityId}
            currentFrame={frame}
            zoom={zoom}
            pan={pan}
          />
        </Suspense>
      </Canvas>

      {/* <BeautyViewer
        activeEntityId={activeEntityId}
        frames={60}
        currentFrame={frame}
        zoom={zoom}
        pan={pan}
      /> */}
    </Fragment>
  );
};
