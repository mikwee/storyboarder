import ShadingEffect from "./ShadingEffect"
import IconSprites from '../../shot-generator/components/IconsComponent/IconSprites';
class DepthShading extends ShadingEffect {

    constructor( renderer ){
        super(renderer)
        this.objectsFilter = (object) => {
            return object.type === "Sprite"
            || object.parent instanceof IconSprites 
            || object.parent.parent.userData.type !== "character" 
            && object.parent.userData.type !== "object"
            && object.parent.userData.type !== "environment" 
            && object.userData.type !== "attachable" 
            && object.userData.type !== 'image'
        }
        this.depthMaterials = {}
        this.originalMaterials = {}
    }

    cleanupCache() {
        super.cleanupCache();
        let depthMaterials = Object.keys(this.depthMaterials);
        for ( var i = 0, il = depthMaterials.length; i < il; i ++ ) {
            let depthMaterial = this.depthMaterials[depthMaterials[i]];
            depthMaterial.dispose();
            this.depthMaterials[depthMaterials[i]] = undefined;
        }
        this.depthMaterials = undefined;
        this.originalMaterials = undefined;
    }

    getShaderMaterial( material ) {
        if(!this.depthMaterials[material.uuid]) {
            let depthMaterial = new THREE.MeshDepthMaterial(
                { 
                    depthTest: true,
                    depthWrite: true,
                    side: THREE.FrontSide,
                });
            this.depthMaterials[material.uuid] = depthMaterial;

            this.originalMaterials[depthMaterial.uuid] = material;
        }

        this.depthMaterials[material.uuid].skinning = material.skinning;
        this.depthMaterials[material.uuid].morphTargets = material.morphTargets;
        this.depthMaterials[material.uuid].morphNormals = material.morphNormals;
        this.depthMaterials[material.uuid].fog = material.fog;
        this.depthMaterials[material.uuid].needsUpdate = true;
        return this.depthMaterials[material.uuid];
    }

    getOriginalMaterial( material ) {
        return this.originalMaterials[material.uuid];
    }

    setDepthShading( getMaterial ) {
        for(let i = 0; i < this.objects.length; i++) {
            let object = this.objects[i];
            if ( Array.isArray( object.material ) ) {
                for ( var j = 0, jl = object.material.length; j < jl; j ++ ) {
    
                    object.material[ j ] = getMaterial( object.material[ j] );
    
                }
    
            } else {
    
                let outlineMaterial = getMaterial( object.material );
                object.material = outlineMaterial;
                
            }   
        }
    }

    render( scene, camera ) {
        super.render(scene, camera)
        this.setDepthShading((object) => this.getShaderMaterial(object));
        this.renderer.render(scene, camera);
        this.setDepthShading((object) => this.getOriginalMaterial(object));
    }
}

export default DepthShading;