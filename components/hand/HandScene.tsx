import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import HandModel from "./HandModel";
import OrientationWidget from "./OrientationWidget";
import ConnectionOverlay from "./ConnectionOverlay";

export default function HandScene(){
  return <div className="scene">
    <ConnectionOverlay/>
    <Canvas shadows frameloop="always" gl={{antialias:true}}>
      <color attach="background" args={["#0a0a0a"]}/>
      <fogExp2 attach="fog" args={["#0a0a0a",0.08]}/>
      <PerspectiveCamera makeDefault fov={45} position={[0,1.5,4]} />
      <ambientLight intensity={0.3} color="#ffffff"/>
      <directionalLight castShadow position={[3,5,2]} intensity={1.4} color="#ffe8d0" shadow-mapSize={[2048,2048]}/>
      <directionalLight position={[-3,2,1]} intensity={0.6} color="#b0c8ff"/>
      <pointLight position={[0,-2,2]} intensity={0.8} color="#0F6E5E" distance={8}/>
      <pointLight position={[0,-3,0]} intensity={0.15}/>
      <mesh receiveShadow rotation-x={-Math.PI/2} position={[0,-2.95,0]}>
        <planeGeometry args={[12,12]}/>
        <shadowMaterial opacity={0.22}/>
      </mesh>
      <Suspense fallback={null}><HandModel/></Suspense>
      <OrbitControls enableDamping dampingFactor={0.08} minPolarAngle={Math.PI/4} maxPolarAngle={Math.PI/1.8} minAzimuthAngle={-35*Math.PI/180} maxAzimuthAngle={35*Math.PI/180} minDistance={2.5} maxDistance={7} enableZoom={!false}/>
      <OrientationWidget/>
    </Canvas>
  </div>;
}