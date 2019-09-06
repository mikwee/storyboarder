const THREE = require('three')
const { useMemo, useRef, useCallback } = React = require('react')
const useGltf = require('../hooks/use-gltf')
const { useRender, useThree, useUpdate } = require('react-three-fiber')
require('../three/GPUPickers/utils/Object3dExtension')

const CLOSE_DISTANCE = 7
const VIRTUAL_CAMERA_LAYER = 1

const materialFactory = () => new THREE.MeshLambertMaterial({
  color: 0xcccccc,
  emissive: 0x0,
  flatShading: false
})

const meshFactory = source => {
  const mesh = source.clone()

  const material = materialFactory()

  if (mesh.material.map) {
    material.map = mesh.material.map
    material.map.needsUpdate = true
  }
  mesh.material = material

  return mesh
}

const VirtualCamera = React.memo(({ aspectRatio, sceneObject, isSelected }) => {
  const { gl, scene, camera } = useThree()

  const ref = useRef(null)

  const virtualCamera = useUpdate(self => {
    self.updateProjectionMatrix()
    self.layers.set(VIRTUAL_CAMERA_LAYER)
  })

  const filepath = useMemo(
    () => `/data/system/objects/camera.glb`,
    [sceneObject]
  )
  const gltf = useGltf(filepath)

  const renderTarget = useRef()
  const size = 1 / 3
  const resolution = 512
  const previousTime = useRef([null])

  const getRenderTarget = useCallback(() => {
    if (!renderTarget.current) {
      renderTarget.current = new THREE.WebGLRenderTarget(resolution * aspectRatio, resolution)
    }
    return renderTarget.current
  }, [resolution, aspectRatio])

  const renderCamera = () => {
    if (virtualCamera.current && getRenderTarget()) {
      gl.vr.enabled = false
      scene.autoUpdate = false
      gl.setRenderTarget(getRenderTarget())

      gl.render(scene, virtualCamera.current)

      gl.setRenderTarget(null)
      scene.autoUpdate = true
      gl.vr.enabled = true
    }
  }

  useMemo(() => {
    if (isSelected) {
      renderCamera()
    }
  }, [ref.current, isSelected])

  const meshes = useMemo(() => {
    if (gltf) {
      const children = []
      gltf.scene.traverse(child => {
        if (child.isMesh) {
          children.push(
            <primitive
              key={sceneObject.id}
              object={meshFactory(child)}
            />
          )
        }
      })
      return children
    }
    return []
  }, [gltf])

  const heightShader = useMemo(
    () => new THREE.MeshBasicMaterial({
      map: getRenderTarget().texture,
      side: THREE.FrontSide
    }),
    [getRenderTarget]
  )

  const cameraView = useMemo(() => {
    return <group>
      <mesh
        userData={{ type: 'view' }}
        position={[0, 0.3, 0]}
        material={heightShader}
      >
        <planeGeometry attach='geometry' args={[size * aspectRatio, size]} />
      </mesh>
    </group>
  }, [])

  useRender(() => {
    if (!ref.current) return

    let isClose = false

    // check if virtual camera in view and close

    const frustum = new THREE.Frustum()
    const cameraViewProjectionMatrix = new THREE.Matrix4()

    camera.updateMatrixWorld() // make sure the camera matrix is updated
    cameraViewProjectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
    frustum.setFromMatrix(cameraViewProjectionMatrix)
    // frustum is now ready to check all the objects you need

    const mesh = ref.current.children.find(c => c.isMesh)
    const isInView = frustum.intersectsObject(mesh)

    if (isInView) {
      const distance = ref.current.worldPosition().distanceTo(camera.worldPosition())
      isClose = distance < CLOSE_DISTANCE ? true : false
    } else {
      isClose = false
    }

    if (!previousTime.current) previousTime.current = 0

    const currentTime = Date.now()
    const delta = currentTime - previousTime.current

    if (delta > 500) {
      previousTime.current = currentTime
    } else {
      if ((!isSelected && !isClose)) return
    }

    renderCamera()
  }, false, [isSelected, ref.current, meshes])

  return <group
    ref={ref}
    onController={() => null}
    userData={{
      type: 'virtual-camera',
      id: sceneObject.id
    }}
    position={[sceneObject.x, sceneObject.z, sceneObject.y]}
    rotation={[sceneObject.tilt, sceneObject.rotation, sceneObject.roll]}

  >
    {cameraView}
    {meshes}
    <group position={[0, 0, -0.2]}>
      <perspectiveCamera
        ref={virtualCamera}
        aspect={aspectRatio}
        fov={sceneObject.fov}
        near={0.01}
        far={1000}
      />
    </group>
  </group>
})

VirtualCamera.VIRTUAL_CAMERA_LAYER = VIRTUAL_CAMERA_LAYER

module.exports = VirtualCamera
