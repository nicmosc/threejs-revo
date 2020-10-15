import React, { Fragment, useEffect, useRef, useState } from 'react';

import { useLoadScene, CustomMesh } from './use-load-scene';
import { useFrame, useThree } from 'react-three-fiber';
import { PerspectiveCamera, Vector3 } from 'three';

import { Pan } from './App';

import file from 'files/teapot-3-levels.FBX';

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
  activeEntityId?: string;
  onClickEntity: (id: string) => void;
}

export const VirtualScene = ({
  currentFrame,
  zoom,
  pan,
  activeEntityId,
  onClickEntity,
}: VirtualSceneProps) => {
  const [activeId, setActiveId] = useState<string>();
  const cameraRef = useRef<PerspectiveCamera>();

  const { model, cameras: loadedCameras, animations: loadedAnimations } = useLoadScene(file);
  const { raycaster, mouse, camera: _camera, setDefaultCamera, forceResize } = useThree();

  // Define a default camera when no entities are active
  const activeCamera = loadedCameras?.[activeEntityId ?? 'A'];
  const activeAnimation = loadedAnimations?.[activeEntityId ?? 'A'];

  const handleMouseMove = () => {
    raycaster.setFromCamera(mouse, _camera);

    const allIntersects = raycaster.intersectObjects([model], true);
    const intersects = allIntersects.filter((intersection) => intersection.object.visible);

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
    if (activeAnimation != null) {
      const { positions, rotations } = activeAnimation;
      const currentPosition = positions[currentFrame];
      const currentRotation = rotations[currentFrame];

      _camera.position.set(currentPosition.x, currentPosition.y, currentPosition.z);
      _camera.setRotationFromQuaternion(currentRotation);
    } else if (activeCamera != null) {
      _camera.position.set(
        activeCamera.position.x,
        activeCamera.position.y,
        activeCamera.position.z,
      );
      _camera.setRotationFromQuaternion(activeCamera.quaternion);
    }
    if (activeCamera?.userData.lookAt != null) {
      _camera.lookAt(activeCamera.userData.lookAt);
    }
    if (activeCamera?.fov) {
      (_camera as PerspectiveCamera).fov = activeCamera?.fov;
    }
  });

  useEffect(() => {
    _camera.zoom = (activeCamera?.zoom ?? 1) * zoom;
    _camera.updateProjectionMatrix();
  }, [zoom, activeEntityId]);

  useEffect(() => {
    // need to recalculate mouse positions after CSS transform
    forceResize();
  }, [pan]);

  useEffect(() => void setDefaultCamera(cameraRef.current!), []);

  if (activeCamera == null) {
    return null;
  }

  const { fov, zoom: cameraZoom, aspect, focus, position, rotation } = activeCamera;

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
        position={position}
        rotation={rotation}
      />
      {model.children.map((child) => {
        const mesh = child as CustomMesh;
        const active = mesh.uuid === activeId;
        const { locked, parent } = mesh.userData;
        const visible = locked || parent == activeEntityId;
        return (
          <primitive
            visible={visible}
            onPointerOver={handleMouseMove}
            onPointerOut={handleMouseMove}
            onClick={locked || !visible ? null : () => onClickEntity(mesh.userData._ID!)}
            key={child.uuid}
            object={child}>
            <meshStandardMaterial
              transparent={active}
              colorWrite={active}
              color={active ? mesh.color : 0x000000}
              // color={active ? mesh.color : 0xffffff}
            />
          </primitive>
        );
      })}
    </Fragment>
  );
};
