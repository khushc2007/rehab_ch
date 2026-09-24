import { useHandStore } from "@/store/handStore";

export default function ConnectionOverlay(){
  const connected=useHandStore(s=>s.connected),sim=useHandStore(s=>s.simMode);
  const label=connected?"LIVE":sim?"SIM":"OFFLINE";
  const color=connected?"#2ea853":sim?"#0F6E5E":"#d9534f";
  return <div className="connection" style={{color}}><span className="status-dot" style={{background:color}} />{label}</div>;
}