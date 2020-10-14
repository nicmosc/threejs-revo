import React, { Fragment, useEffect, useRef, useState } from 'react';

import { useLoadScene, MeshWithColor } from './use-load-scene';
import { useFrame, useThree } from 'react-three-fiber';
import { Mesh, PerspectiveCamera, Vector2, Vector3, VectorKeyframeTrack } from 'three';

import { Controls } from './Controls';
import { Pan } from './App';

import file from './files/teapot-v2.FBX';

function _pan(camera: PerspectiveCamera, pan: Pan) {
  const { dx, dy } = pan;
  const center = new Vector3(0, 0, 0);
  const panOffset = new Vector3();
  const offset = new Vector3();

  // half of the fov is center to top of screen
  offset.copy(camera.position).sub(center);
  let targetDistance = offset.length();
  targetDistance = targetDistance * Math.tan(((camera.fov / 2) * Math.PI) / 180.0);

  // we use only clientHeight here so aspect ratio does not distort speed
  // pan left
  const vX = new Vector3();
  vX.setFromMatrixColumn(camera.matrix, 0); // get X column of objectMatrix
  vX.multiplyScalar(-(2 * dx * targetDistance) / window.innerHeight);
  panOffset.add(vX);

  // pan up
  const vY = new Vector3();
  vY.setFromMatrixColumn(camera.matrix, 0); // get X column of objectMatrix
  vY.multiplyScalar(-(2 * dy * targetDistance) / window.innerHeight);
  panOffset.add(vY);

  camera.lookAt(panOffset);
  camera.position.copy(center).add(offset);
}

interface VirtualSceneProps {
  currentFrame: number;
  zoom: number;
  pan: Pan;
}

export const VirtualScene = ({ currentFrame, zoom, pan }: VirtualSceneProps) => {
  const [activeId, setActiveId] = useState<string>();
  const cameraRef = useRef<PerspectiveCamera>();

  const { model, camera: loadedCamera, animation } = useLoadScene(file);
  const { raycaster, mouse, camera: _camera, setDefaultCamera, forceResize, scene } = useThree();

  const handleMouseMove = () => {
    raycaster.setFromCamera(mouse, _camera);

    const intersects = raycaster.intersectObjects([model], true);

    if (intersects.length > 0) {
      // new object
      const { uuid, userData } = intersects[0].object;
      if (activeId !== uuid && !userData.locked) {
        setActiveId(uuid);
      } else if (userData.locked) {
        setActiveId(undefined);
      }
    } else {
      setActiveId(undefined);
    }
  };

  useFrame(() => {
    // if we have an animation and no pan is set
    if (animation != null) {
      const { positions, rotations } = animation;
      const currentPosition = positions[currentFrame];
      const currentRotation = rotations[currentFrame];

      _camera.position.set(currentPosition.x, currentPosition.y, currentPosition.z);
      _camera.setRotationFromQuaternion(currentRotation);

      if (loadedCamera?.userData.lookAt != null) {
        _camera.lookAt = loadedCamera.userData.lookAt;
      }
    }
  });

  useEffect(() => {
    _camera.zoom = (loadedCamera?.zoom ?? 1) * zoom;
    _camera.updateProjectionMatrix();
  }, [zoom]);

  useEffect(() => {
    // need to recalculate mouse positions after CSS transform
    forceResize();
  }, [pan]);

  useEffect(() => void setDefaultCamera(cameraRef.current!), []);

  const { fov, zoom: cameraZoom, aspect, focus, userData } = loadedCamera ?? {};

  return (
    <Fragment>
      {/* {loadedCamera != null ? <Controls camera={loadedCamera} /> : null} */}
      <ambientLight />
      <perspectiveCamera
        ref={cameraRef}
        fov={fov}
        zoom={cameraZoom}
        aspect={aspect}
        focus={focus}
        lookAt={userData?.lookAt}
      />
      {model.children.map((child) => {
        const mesh = child as MeshWithColor;
        const active = child.uuid === activeId;
        return (
          <primitive
            onPointerOver={handleMouseMove}
            onPointerOut={handleMouseMove}
            key={child.uuid}
            object={child}>
            <meshStandardMaterial
              // transparent={active}
              // colorWrite={active}
              // color={active ? mesh.color : 0x000000}
              color={active ? mesh.color : 0xffffff}
            />
          </primitive>
        );
      })}
    </Fragment>
  );
};
