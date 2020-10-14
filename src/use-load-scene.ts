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
import { get, last } from 'lodash';

export enum ObjectType {
  BUILDING = 'BUILDING',
  FLOOR = 'FLOOR',
  UNIT = 'UNIT',
}

export interface Data {
  _ID?: string;
  parent?: string;
  locked?: boolean;
}

export interface CustomMesh extends Mesh {
  color: Color;
  userData: Data;
}

export interface AnimationData {
  positions: Array<Vector3>;
  rotations: Array<Quaternion>;
}

function _buildData(name: string, meshes: Array<CustomMesh>): Data {
  // this should use listing info instead
  const nameChunks = name.split('_-_');
  const maxID = last(nameChunks)?.split('_')[1];
  const parentPartialName = nameChunks.slice(0, -2).join('_-_') + '_-_ID';
  const parentID = meshes.find((mesh) => mesh.name.includes(parentPartialName))?.uuid;
  return { _ID: maxID, parent: parentID };
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
  model: Group;
  camera?: PerspectiveCamera;
  animation?: AnimationData;
} {
  const modelRef = useRef<Group>(new Group());
  const cameraRef = useRef<PerspectiveCamera>();
  const animation = useRef<AnimationData>();

  const object = useLoader(FBXLoader, url);

  useMemo(() => {
    let meshes: Array<CustomMesh> = [];

    object.traverse((child) => {
      if (_isMesh(child)) {
        let mesh = child as CustomMesh;

        if (child.name.includes('SUR')) {
          const material = new MeshStandardMaterial({
            color: 0x0000000,
          });
          mesh.material = material;
          mesh.userData = { locked: true };
          modelRef.current.children.push(mesh);
        } else {
          const material = new MeshStandardMaterial({
            color: 0xffffff,
          });
          mesh.material = material;
          mesh.color = new Color(0x00ff00);
          meshes.push(mesh);
        }
      } else if (_isCamera(child) && child.name.includes('360')) {
        cameraRef.current = child;
        // set up look at
        const target = child.children.find((_child) => _child.name.includes('Target'));
        if (target != null) {
          cameraRef.current.userData = { lookAt: target.position };
        }
      }
    });

    for (const mesh of meshes) {
      const data = _buildData(mesh.name, meshes);
      mesh.userData = data;
      modelRef.current.children.push(mesh);
    }
    animation.current = _extractAnimations(object);
  }, []);

  return { model: modelRef.current, camera: cameraRef.current, animation: animation.current };
}
