import { useUpdate } from 'react-three-fiber'
import React, { useMemo, useRef, useEffect } from 'react'
import { SHOT_LAYERS } from '../../utils/ShotLayers'

const Light = React.memo(({ gltf, sceneObject, isSelected, children }) => {
  const mesh = useMemo(() => gltf.scene.children[0].clone(), [gltf])

  const spotLight = useUpdate(
    self => {
      self.target.position.set(0, 0, sceneObject.distance)
      self.add(self.target)
      self.layers.enable(SHOT_LAYERS)
    }, [sceneObject.distance])
  

  const ref = useUpdate(self => {
    self.rotation.x = 0
    self.rotation.z = 0
    self.rotation.y = sceneObject.rotation || 0
    self.rotateX(sceneObject.tilt || 0)
    self.rotateZ(sceneObject.roll || 0)
  }, [sceneObject.rotation, sceneObject.tilt, sceneObject.roll])



  let lightColor = 0x8c78f1

  if (isSelected) {
    lightColor = 0x7256ff
  }
  const { x, y, z, visible, locked } = sceneObject
  return (
    <group
      ref={ ref }
      onController={ visible ? () => null : null }
      visible={ visible }
      userData={{
        id: sceneObject.id,
        type: "light",
        locked: locked
      }}
      position={ [x, z, y] }
    >
      <primitive
        object={ mesh } 
        rotation={[-Math.PI/2, Math.PI, 0]}
        userData={{ 
          type: "light",
        }}
      >
        <meshBasicMaterial
          attach="material"
          color={lightColor}
          flatShading={false}
        />
      </primitive>

      <spotLight
        ref={ spotLight }
        color={ 0xffffff }
        intensity={ sceneObject.intensity} 
        position={ [0, 0, 0] }
        rotation={ [Math.PI / 2, 0, 0] }
        angle={ sceneObject.angle }
        distance={ sceneObject.distance }
        penumbra={ sceneObject.penumbra }
        decay={ sceneObject.decay }
      />

      {children}
    </group>
  )
})

export default Light