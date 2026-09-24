import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useHandStore } from "@/store/handStore";

export default function OrientationWidget(){
  const r=useHandStore(s=>s.wristRoll),p=useHandStore(s=>s.wristPitch),y=useHandStore(s=>s.wristYaw);
  return <Html fullscreen>
    <div style={{position:"absolute",left:18,bottom:18,width:80,height:80,background:"rgba(17,17,17,.3)",border:"1px solid #222",fontFamily:"monospace",pointerEvents:"none"}}>
      <div style={{fontSize:8,color:"#777",padding:"5px"}}>ORIENTATION</div>
      <div style={{position:"absolute",inset:"22px 16px 8px",display:"grid",placeItems:"center"}}>
        <div style={{width:28,height:28,border:"1px solid #aaa",transform:`perspective(80px) rotateX(${p}deg) rotateY(${y}deg) rotateZ(${r}deg)`}}>
          <span style={{position:"absolute",color:"#f55",fontSize:9,right:-11,top:-6}}>X</span>
          <span style={{position:"absolute",color:"#5f5",fontSize:9,left:-9,bottom:-7}}>Y</span>
          <span style={{position:"absolute",color:"#59f",fontSize:9,right:-10,bottom:-7}}>Z</span>
        </div>
      </div>
    </div>
  </Html>;
}