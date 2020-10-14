import { useMemo, useRef, useState } from 'react';
import { useLoader } from 'react-three-fiber';
import {
  AnimationClip,
  AnimationMixer,
  Camera,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  QuaternionKeyframeTrack,
  Vector3,
  VectorKeyframeTrack,
} from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { get } from 'lodash';

export interface MeshWithColor extends Mesh {
  color: Color;
}

export interface AnimationData {
  positions: Array<Vector3>;
  rotations: Array<Quaternion>;
}

function _extractAnimations(object: Group) {
  // NOTE: get correct clip per camera, and not first only
  const clip: AnimationClip = get(object, 'animations[0]');
  const [_vKTrack, _qKTrack] = clip.tracks;
  const vKTrack = _vKTrack as VectorKeyframeTrack;
  const qKTrack = _qKTrack as QuaternionKeyframeTrack;
  const vTrackSize = vKTrack.getValueSize();
  const qTrackSize = qKTrack.getValueSize();

  let positions: Array<Vector3> = [];
  let rotations: Array<Quaternion> = [];
  const vValues = vKTrack.values;
  const qValues = qKTrack.values;

  for (let i = 0; i < vValues.length; i = i + vTrackSize) {
    const vector = new Vector3(vValues[i], vValues[i + 1], vValues[i + 2]);
    positions.push(vector);
  }

  for (let i = 0; i < qValues.length; i = i + qTrackSize) {
    const quaternion = new Quaternion(qValues[i], qValues[i + 1], qValues[i + 2], qValues[i + 3]);
    rotations.push(quaternion);
  }

  return { rotations, positions };
}

function _isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh;
}

function _isCamera(object: Object3D): object is PerspectiveCamera {
  return (object as Camera).isCamera;
}

export function useLoadScene(
  url: string,
): {
  model: Mesh;
  camera?: PerspectiveCamera;
  animation?: AnimationData;
} {
  const modelRef = useRef<Mesh>(new Mesh());
  const cameraRef = useRef<PerspectiveCamera>();
  const animation = useRef<AnimationData>();

  const object = useLoader(FBXLoader, url);

  useMemo(() => {
    console.log(object);
    object.traverse((child) => {
      // console.log(child);
      if (_isMesh(child)) {
        let mesh = child as MeshWithColor;

        if (child.name.includes('SUR')) {
          const material = new MeshStandardMaterial({
            color: 0x0000000,
          });
          mesh.material = material;
          mesh.userData = { locked: true };
        } else {
          const material = new MeshStandardMaterial({
            color: 0xffffff,
          });
          mesh.material = material;
          mesh.color = new Color(0x00ff00);
        }

        modelRef.current.children.push(mesh);
      } else if (_isCamera(child) && child.name.includes('360')) {
        cameraRef.current = child;
        // set up look at
        const target = child.children.find((_child) => _child.name.includes('Target'));
        if (target != null) {
          cameraRef.current.userData = { lookAt: target.position };
        }
      }
    });

    animation.current = _extractAnimations(object);
  }, []);

  return { model: modelRef.current, camera: cameraRef.current, animation: animation.current };
}
