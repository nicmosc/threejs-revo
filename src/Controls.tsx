import React, { useEffect, useRef } from 'react';
import { extend, ReactThreeFiber, useFrame, useThree } from 'react-three-fiber';
import { PerspectiveCamera } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

extend({ OrbitControls });

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      orbitControls: ReactThreeFiber.Object3DNode<OrbitControls, typeof OrbitControls>;
    }
  }
}

interface ControlsProps {
  camera: PerspectiveCamera;
}

export const Controls = ({ camera }: ControlsProps) => {
  const ref = useRef<OrbitControls>();
  const { gl, setDefaultCamera } = useThree();

  useEffect(() => void setDefaultCamera(camera), []);

  useFrame(() => {
    if (ref.current != null) {
      ref.current?.update();
    }
  });

  return <orbitControls enabled ref={ref} args={[camera, gl.domElement]} />;
};
