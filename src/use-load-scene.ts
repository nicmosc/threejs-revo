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

function _getMaxID(name: string): string | undefined {
  const nameChunks = name.split('_-_');
  return last(nameChunks)?.split('_')[1];
}

function _buildData(name: string, meshes: Array<CustomMesh>): Data {
  // this should use listing info instead
  const nameChunks = name.split('_-_');
  const maxID = _getMaxID(name);
  const parentPartialName = nameChunks.slice(0, -2).join('_-_') + '_-_ID';
  const parentMesh = meshes.find((mesh) => mesh.name.includes(parentPartialName));
  const parentID = parentMesh != null ? _getMaxID(parentMesh.name) : undefined;
  return { _ID: maxID, parent: parentID };
}

function _extractAnimations(object: Group): Record<string, AnimationData> | undefined {
  const animations: Array<AnimationClip> | undefined = get(object, 'animations');

  if (animations == null) {
    return undefined;
  }

  return animations.reduce((memo, clip: AnimationClip) => {
    const [_vKTrack, _qKTrack] = clip.tracks;
    const vKTrack = _vKTrack as VectorKeyframeTrack;
    const qKTrack = _qKTrack as QuaternionKeyframeTrack;
    const vTrackSize = vKTrack.getValueSize();
    const qTrackSize = qKTrack.getValueSize();
    // use this somehow
    const camName = vKTrack.name.split('.')[0];

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

    return { ...memo, ['A']: { rotations, positions } };
  }, {}) as Record<string, AnimationData>;
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
  cameras?: Record<string, PerspectiveCamera>;
  animations?: Record<string, AnimationData>;
} {
  const modelRef = useRef<Group>(new Group());
  const camerasRef = useRef<Record<string, PerspectiveCamera>>({});
  const animations = useRef<Record<string, AnimationData>>();

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
      } else if (_isCamera(child)) {
        // automate this
        console.log(child);
        const linkedMaxID = child.name.includes('360') ? 'A' : '12';
        // set up look at
        const target = child.children.find((_child) => _child.name.includes('Target'));
        if (target != null) {
          child.userData = { lookAt: target.position };
        }
        camerasRef.current[linkedMaxID] = child;
      }
    });

    for (const mesh of meshes) {
      const data = _buildData(mesh.name, meshes);
      mesh.userData = data;
      modelRef.current.children.push(mesh);
    }
    animations.current = _extractAnimations(object);
  }, []);

  return { model: modelRef.current, cameras: camerasRef.current, animations: animations.current };
}
