import { useState, useRef, useCallback } from "react";

const C = {
  primary:"#3366FF", primaryLight:"#EEF2FF", primaryText:"#1A3FCC",
  success:"#00B894", successLight:"#E8F8F5", successText:"#007A63",
  warning:"#F59E0B", warningLight:"#FFFBEB", warningText:"#92400E",
  danger:"#EF4444", dangerLight:"#FEF2F2", dangerText:"#991B1B",
  gray50:"#F7F8FA", gray100:"#F2F4F7", gray200:"#E5E8EF",
  gray400:"#9CA3AF", gray600:"#6B7280", gray800:"#1F2937", gray900:"#111827",
  white:"#FFFFFF",
};
const R = { sm:10, md:12, lg:16, full:999 };
const F = { xs:11, sm:13, base:15, lg:17, xl:20, xxl:24 };

const genId = () => Math.random().toString(36).slice(2,9);
const genToken = () => Math.random().toString(36).slice(2,14);
const nowStr = () => new Date().toLocaleString("ko-KR");
const daysDiff = (d) => { if(!d) return null; return Math.ceil((new Date(d)-new Date())/(1000*60*60*24)); };
const timeAgo = (str) => {
  if(!str) return "";
  try {
    const d = new Date() - new Date(str); const m = Math.floor(d/60000);
    if(m<1) return "방금 전"; if(m<60) return `${m}분 전`;
    const h = Math.floor(m/60); if(h<24) return `${h}시간 전`;
    return `${Math.floor(h/24)}일 전`;
  } catch { return ""; }
};

const DEMO = { id:"demo", name:"김임대", email:"demo@test.com", pw:"1234", isAdmin:true, joinedAt:nowStr() };
const SPACES = ["거실","방1","화장실","주방"];
const DEFAULT_CI_MSG = `안녕하세요, [주소] 임대인입니다 😊\n입실 확인 링크를 보내드려요.\n아래 링크에 접속하셔서 현관 비밀번호와 방 상태를 확인해주세요!`;
const DEFAULT_CO_MSG = `안녕하세요, [주소] 임대인입니다 😊\n퇴실 확인 링크를 보내드려요.\n아래 링크에 접속하셔서 현관 비밀번호와 보증금 반환 계좌를 입력해주세요!`;

// ── SHARED UI ──────────────────────────────────────
const Page = ({children}) => <div style={{minHeight:"100vh",background:C.gray50,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>{children}</div>;

const NavBar = ({title,onBack,right}) => (
  <div style={{display:"flex",alignItems:"center",padding:"14px 16px",background:C.white,borderBottom:`1px solid ${C.gray100}`,position:"sticky",top:0,zIndex:10}}>
    <button onClick={onBack} style={{background:"none",border:"none",color:C.primary,fontSize:F.base,fontWeight:600,cursor:"pointer",padding:"0 12px 0 0"}}>‹ 뒤로</button>
    <span style={{flex:1,fontSize:F.base,fontWeight:700,color:C.gray900}}>{title}</span>
    {right && <div style={{display:"flex",gap:8}}>{right}</div>}
  </div>
);

const SCard = ({title,children}) => (
  <div style={{background:C.white,borderRadius:R.lg,padding:"16px",marginBottom:12,border:`1px solid ${C.gray100}`}}>
    {title && <p style={{fontSize:F.sm,fontWeight:700,color:C.gray600,marginBottom:12}}>{title}</p>}
    {children}
  </div>
);

const DataRow = ({label,value,action}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.gray50}`,fontSize:F.base}}>
    <span style={{color:C.gray600}}>{label}</span>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontWeight:500,color:C.gray900}}>{value}</span>{action}
    </div>
  </div>
);

const PrimaryBtn = ({label,onClick,style:s}) => (
  <button onClick={onClick} style={{width:"100%",padding:"15px",background:C.primary,color:C.white,borderRadius:R.lg,fontSize:F.base,fontWeight:700,border:"none",cursor:"pointer",...s}}>{label}</button>
);
const OutlineBtn = ({label,onClick,style:s}) => (
  <button onClick={onClick} style={{width:"100%",padding:"14px",background:C.white,border:`1.5px solid ${C.primary}`,borderRadius:R.lg,fontSize:F.base,fontWeight:600,color:C.primary,cursor:"pointer",...s}}>{label}</button>
);
const GhostBtn = ({label,onClick}) => (
  <button onClick={onClick} style={{width:"100%",padding:"11px",background:"none",border:`1.5px dashed ${C.gray200}`,borderRadius:R.md,fontSize:F.base,color:C.gray600,cursor:"pointer"}}>{label}</button>
);
const FixedBottom = ({children}) => (
  <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,padding:"12px 16px 20px",background:C.white,borderTop:`1px solid ${C.gray100}`,boxSizing:"border-box",zIndex:50}}>{children}</div>
);
const FieldLabel = ({label}) => <p style={{fontSize:F.sm,fontWeight:600,color:C.gray600,marginBottom:6}}>{label}</p>;
const Inp = ({value,onChange,placeholder,type="text",style:s}) => (
  <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type}
    style={{fontFamily:"inherit",fontSize:F.base,color:C.gray800,background:C.gray100,border:"1.5px solid transparent",borderRadius:R.md,padding:"13px 14px",outline:"none",width:"100%",boxSizing:"border-box",...s}}
    onFocus={e=>{e.target.style.borderColor=C.primary;e.target.style.background=C.white;}}
    onBlur={e=>{e.target.style.borderColor="transparent";e.target.style.background=C.gray100;}}
  />
);
const Textarea = ({value,onChange,placeholder,minHeight=80}) => (
  <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{fontFamily:"inherit",fontSize:F.base,color:C.gray800,background:C.gray100,border:"1.5px solid transparent",borderRadius:R.md,padding:"13px 14px",outline:"none",width:"100%",boxSizing:"border-box",resize:"vertical",minHeight,lineHeight:1.7}}
    onFocus={e=>{e.target.style.borderColor=C.primary;e.target.style.background=C.white;}}
    onBlur={e=>{e.target.style.borderColor="transparent";e.target.style.background=C.gray100;}}
  />
);
const Checkbox = ({checked,onChange,label}) => (
  <label style={{display:"flex",alignItems:"center",gap:8,fontSize:F.sm,color:C.gray600,cursor:"pointer",margin:"6px 0"}}>
    <input type="checkbox" checked={checked} onChange={onChange}/>{label}
  </label>
);
const Toggle = ({on,onChange}) => (
  <div onClick={onChange} style={{width:46,height:26,borderRadius:R.full,background:on?C.primary:C.gray200,cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
    <div style={{width:20,height:20,borderRadius:"50%",background:C.white,position:"absolute",top:3,left:on?23:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
  </div>
);
const ErrBox = ({text}) => (
  <div style={{background:C.dangerLight,borderRadius:R.md,padding:"10px 14px",marginBottom:10,fontSize:F.sm,color:C.dangerText,border:`1px solid ${C.danger}30`}}>{text}</div>
);
const InfoBanner = ({text,sub,type="info"}) => {
  const bg={success:C.successLight,info:C.primaryLight,warning:C.warningLight};
  const tc={success:C.successText,info:C.primaryText,warning:C.warningText};
  return (
    <div style={{background:bg[type],borderRadius:R.md,padding:"10px 12px",margin:"10px 0",border:`1px solid ${tc[type]}30`}}>
      <p style={{fontSize:F.sm,fontWeight:600,color:tc[type],marginBottom:sub?2:0}}>{text}</p>
      {sub && <p style={{fontSize:F.xs,color:tc[type]}}>{sub}</p>}
    </div>
  );
};
const SectionLabel = ({label,noMargin}) => <p style={{fontSize:F.sm,fontWeight:700,color:C.gray600,marginBottom:noMargin?0:10}}>{label}</p>;
const StatCard = ({label,value,emoji,color}) => (
  <div style={{background:C.white,borderRadius:R.lg,padding:"16px 12px",textAlign:"center",border:`1px solid ${C.gray100}`}}>
    <p style={{fontSize:26,marginBottom:4}}>{emoji}</p>
    <p style={{fontSize:F.xl,fontWeight:700,color,marginBottom:2}}>{value}</p>
    <p style={{fontSize:F.xs,color:C.gray400}}>{label}</p>
  </div>
);
const Empty = ({emoji,text,sub}) => (
  <div style={{textAlign:"center",padding:"24px 0",color:C.gray400}}>
    <p style={{fontSize:32,marginBottom:8}}>{emoji}</p>
    <p style={{fontSize:F.base,fontWeight:500,marginBottom:4}}>{text}</p>
    {sub && <p style={{fontSize:F.sm}}>{sub}</p>}
  </div>
);
const Dot = ({color}) => <div style={{width:8,height:8,borderRadius:"50%",background:color||C.gray200,flexShrink:0}}/>;
const Divider = ({label}) => (
  <div style={{width:"100%",display:"flex",alignItems:"center",gap:12,margin:"8px 0"}}>
    <div style={{flex:1,height:"1px",background:C.gray200}}/>
    <span style={{fontSize:F.sm,color:C.gray400}}>{label}</span>
    <div style={{flex:1,height:"1px",background:C.gray200}}/>
  </div>
);
const AddBtn = ({onClick}) => (
  <button onClick={onClick} style={{background:C.primaryLight,border:`1px solid ${C.primary}30`,borderRadius:R.full,padding:"4px 14px",fontSize:F.sm,color:C.primary,fontWeight:600,cursor:"pointer"}}>+ 작성</button>
);
const TxtBtn = ({label,onClick,color}) => (
  <button onClick={onClick} style={{background:"none",border:"none",fontSize:F.sm,color:color||C.primary,fontWeight:600,padding:"0 4px",cursor:"pointer"}}>{label}</button>
);

// 사진 크게 보기 모달
const PhotoModal = ({src,onClose}) => {
  if(!src) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <img src={src} style={{maxWidth:"100%",maxHeight:"90vh",borderRadius:R.md,objectFit:"contain"}}/>
      <button onClick={onClose} style={{position:"absolute",top:20,right:20,background:"none",border:"none",color:C.white,fontSize:28,cursor:"pointer"}}>✕</button>
    </div>
  );
};

// 커스텀 날짜 선택기
function DatePicker({value,onChange,placeholder,style}) {
  const [open,setOpen]=useState(false);
  const today=new Date();
  const parse=v=>{if(!v)return{y:today.getFullYear(),m:today.getMonth()+1,d:today.getDate()};const[y,mo,da]=v.split("-");return{y:+y,m:+mo,d:+da};};
  const init=parse(value);
  const [y,setY]=useState(init.y);
  const [m,setM]=useState(init.m);
  const [d,setD]=useState(init.d);
  const maxD=new Date(y,m,0).getDate();
  const safeD=Math.min(d,maxD);
  function confirm(){
    const ds=String(safeD).padStart(2,"0");const ms=String(m).padStart(2,"0");
    onChange(`${y}-${ms}-${ds}`);setOpen(false);
  }
  function open2(){
    const p=parse(value);setY(p.y);setM(p.m);setD(p.d);setOpen(true);
  }
  const display=value?`${value.slice(0,4)}년 ${parseInt(value.slice(5,7))}월 ${parseInt(value.slice(8,10))}일`:placeholder||"날짜 선택";
  return (
    <>
      <div onClick={open2} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.gray100,borderRadius:R.md,padding:"13px 14px",cursor:"pointer",marginBottom:0,...style}}>
        <span style={{fontSize:F.base,color:value?C.gray800:C.gray400}}>{display}</span>
        <span style={{fontSize:18}}>📅</span>
      </div>
      {open&&(
        <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:600,display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",background:"rgba(0,0,0,0.4)"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:"20px 20px 0 0",padding:"20px 16px 36px",boxShadow:"0 -4px 30px rgba(0,0,0,0.18)",width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",fontSize:F.base,color:C.gray400,cursor:"pointer",padding:"4px 8px"}}>취소</button>
              <span style={{fontSize:F.base,fontWeight:700,color:C.gray900}}>날짜 선택</span>
              <button onClick={confirm} style={{background:C.primary,border:"none",borderRadius:R.md,fontSize:F.base,fontWeight:700,color:C.white,cursor:"pointer",padding:"6px 18px"}}>확인</button>
            </div>
            {/* 연도 */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,marginBottom:20,background:C.gray100,borderRadius:R.lg,padding:"4px"}}>
              <button onClick={()=>setY(v=>v-1)} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",padding:"10px 20px",color:C.gray800,fontWeight:700,borderRadius:R.md}}>‹</button>
              <span style={{flex:1,textAlign:"center",fontSize:F.xxl,fontWeight:700,color:C.gray900}}>{y}년</span>
              <button onClick={()=>setY(v=>v+1)} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",padding:"10px 20px",color:C.gray800,fontWeight:700,borderRadius:R.md}}>›</button>
            </div>
            {/* 월 */}
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16,justifyContent:"center"}}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(mo=>(
                <button key={mo} onClick={()=>setM(mo)} style={{padding:"8px 0",width:"calc(25% - 6px)",borderRadius:R.md,background:mo===m?C.primary:C.gray100,color:mo===m?C.white:C.gray800,border:"none",cursor:"pointer",fontSize:F.sm,fontWeight:mo===m?700:400}}>{mo}월</button>
              ))}
            </div>
            {/* 일 */}
            <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"flex-start"}}>
              {Array.from({length:maxD},(_,i)=>i+1).map(da=>(
                <button key={da} onClick={()=>setD(da)} style={{width:"calc(14.28% - 5px)",aspectRatio:"1/1",borderRadius:R.md,background:da===safeD?C.primary:C.gray100,color:da===safeD?C.white:C.gray800,border:"none",cursor:"pointer",fontSize:F.sm,fontWeight:da===safeD?700:400,display:"flex",alignItems:"center",justifyContent:"center"}}>{da}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const PhotoGrid = ({photos,tall}) => {
  const [modal,setModal] = useState(null);
  return (
    <>
      <PhotoModal src={modal} onClose={()=>setModal(null)}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
        {photos.map((p,i) => {
          const src = typeof p === "string" ? p : p.src;
          const memo = typeof p === "object" && p.memo ? p.memo : null;
          return (
            <div key={i}>
              <img src={src} onClick={()=>setModal(src)} style={{width:"100%",aspectRatio:tall?"3/4":"1/1",objectFit:"cover",borderRadius:R.md,cursor:"pointer"}}/>
              {memo && <p style={{fontSize:F.xs,color:C.gray600,marginTop:3,lineHeight:1.4,wordBreak:"break-all"}}>{memo}</p>}
            </div>
          );
        })}
      </div>
    </>
  );
};

// ── STATUS ────────────────────────────────────────
const getStatus = (co) => {
  if(!co) return null;
  if(co.status==="ended") return "ended";
  if(co.checkoutSubmitted) return "checkout_done";
  if(co.checkinSubmitted) return "checkout_waiting";
  return "checkin_waiting";
};
const ST = {
  checkin_waiting:{dot:C.warning,label:"입실 대기중",desc:"손님이 아직 입실 확인을 하지 않았어요",next:"입실 링크를 손님에게 전달해주세요"},
  checkout_waiting:{dot:C.warning,label:"퇴실 대기중",desc:"손님이 아직 퇴실 사진을 올리지 않았어요",next:"퇴실 링크를 손님에게 전달해주세요"},
  checkout_done:{dot:C.primary,label:"사진 도착!",desc:"손님이 퇴실 사진을 올렸어요 📬",next:"사진을 확인하고 계약을 마무리해주세요"},
  ended:{dot:C.gray400,label:"계약 종료",desc:"이 계약은 마무리됐어요",next:""},
};
const STEP_KEYS = ["checkin_waiting","checkout_waiting","checkout_done","ended"];
const StepBar = ({st}) => {
  const steps=[{k:"checkin_waiting",l:"입실 대기"},{k:"checkout_waiting",l:"입실 완료"},{k:"checkout_done",l:"퇴실 완료"},{k:"ended",l:"종료"}];
  const cur=STEP_KEYS.indexOf(st);
  return (
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"10px 0 6px"}}>
      {steps.map((s,i) => {
        const done=i<cur; const active=i===cur;
        const col=active?C.primary:done?C.success:C.gray200;
        return (
          <div key={s.k} style={{display:"flex",alignItems:"center"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:12,height:12,borderRadius:"50%",background:col}}/>
              <span style={{fontSize:F.xs,color:col,fontWeight:active?700:400,whiteSpace:"nowrap"}}>{s.l}</span>
            </div>
            {i<steps.length-1 && <div style={{width:30,height:2,background:done?C.success:C.gray200,margin:"0 3px 14px"}}/>}
          </div>
        );
      })}
    </div>
  );
};

// ── MAIN APP ──────────────────────────────────────
export default function App() {
  const [db, setDb] = useState({
    users:[DEMO], properties:[], contracts:[],
    channels:[
      {id:"n1",type:"notice",title:"입퇴실 도우미 오픈!",body:"서비스가 시작됐어요 😊",date:"2025.05.01"},
      {id:"c1",type:"content",title:"퇴거 분쟁 실제 사례 모음",body:"보증금 못 받은 실제 사례와 예방법을 정리했어요.",url:"https://naver.com",date:"2025.05.10"},
      {id:"f1",type:"faq",title:"링크가 만료됐어요",body:"링크는 발급 후 30일이 지나면 자동으로 만료돼요.",date:"2025.04.20"},
    ],
    contactEmail:"help@ipteosil.com", logs:[], reviews:[],
  });

  // setDb를 ref로 고정 — 클로저 문제 완전 해결
  const setDbRef = useRef(setDb);
  setDbRef.current = setDb;

  const updateDb = useCallback((updater) => {
    setDbRef.current(updater);
  }, []);

  const upDb = (patch) => setDb(s=>({...s,...patch}));

  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [stack, setStack] = useState([]);
  const [linkToken, setLinkToken] = useState(()=>{
    const p=new URLSearchParams(window.location.search);
    return p.get("token")||null;
  });
  const [linkDone, setLinkDone] = useState(null);
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  const push = (v,ctx={}) => setStack(s=>[...s,{v,ctx}]);
  const pop = () => setStack(s=>s.slice(0,-1));
  const cur = stack[stack.length-1];

  const log = (uid,action) => {
    const e={id:genId(),userId:uid,action,time:nowStr()};
    updateDb(s=>({...s,logs:[e,...(s.logs||[])].slice(0,500)}));
  };

  // ── link routing ──
  if(linkToken) {
    const co = db.contracts.find(c=>c.checkinToken===linkToken||c.checkoutToken===linkToken);
    if(!co||co.status==="ended") return <LinkPage icon="🔒" title="이 링크는 닫혔어요" sub="계약이 종료되어 링크가 만료됐어요." onBack={()=>setLinkToken(null)}/>;
    const prop = db.properties.find(p=>p.id===co.propertyId);
    if(co.checkinToken===linkToken) {
      if(co.checkinSubmitted) return <LinkPage icon="✅" title="이미 제출됐어요" sub="입실 확인은 한 번만 가능해요." onBack={()=>setLinkToken(null)}/>;
      return <CheckinForm co={co} prop={prop} onSubmit={d=>{
        updateDb(s=>({...s,contracts:s.contracts.map(c=>c.id===co.id?{...c,checkinSubmitted:true,checkinData:{...d,time:nowStr()}}:c)}));
        setLinkToken(null); setLinkDone("checkin");
      }}/>;
    } else {
      if(co.checkoutSubmitted) return <LinkPage icon="✅" title="이미 제출됐어요" sub="퇴실 확인은 한 번만 가능해요." onBack={()=>setLinkToken(null)}/>;
      return <CheckoutForm co={co} prop={prop} onSubmit={d=>{
        updateDb(s=>({...s,contracts:s.contracts.map(c=>c.id===co.id?{...c,checkoutSubmitted:true,checkoutData:{...d,time:nowStr()},status:"submitted"}:c)}));
        setLinkToken(null); setLinkDone("checkout");
      }}/>;
    }
  }
  if(linkDone) return <LinkDone type={linkDone} onBack={()=>setLinkDone(null)}/>;
  if(!user && showLanding) return <LandingPage reviews={(db.reviews||[]).filter(r=>r.featured)} onStart={()=>setShowLanding(false)}/>;
  if(!user) return <AuthPage users={db.users}
    onLogin={u=>{setUser(u);log(u.id,"login");}}
    onRegister={u=>{const nu={...u,id:genId(),isAdmin:false,joinedAt:nowStr()};upDb({users:[...db.users,nu]});setUser(nu);log(nu.id,"register");}}
  />;

  const myProps = db.properties.filter(p=>p.ownerId===user.id);

  // ── sub-views ──
  if(cur?.v==="addProp") return (
    <AddPropPage prop={cur.ctx.prop}
      onSave={p=>{
        if(cur.ctx.prop) updateDb(s=>({...s,properties:s.properties.map(x=>x.id===cur.ctx.prop.id?{...x,...p}:x)}));
        else updateDb(s=>({...s,properties:[...s.properties,{...p,id:genId(),ownerId:user.id}]}));
        pop();
      }} onBack={pop}/>
  );

  if(cur?.v==="propDetail") {
    const prop=db.properties.find(p=>p.id===cur.ctx.id);
    const cos=db.contracts.filter(c=>c.propertyId===cur.ctx.id);
    const active=cos.find(c=>c.status!=="ended");
    const past=cos.filter(c=>c.status==="ended").slice(-2);
    return <PropDetailPage prop={prop} active={active} past={past}
      onEdit={()=>push("addProp",{prop})}
      onDelete={()=>{if(window.confirm("삭제하면 모든 기록이 사라져요. 그래도 삭제할까요?")){updateDb(s=>({...s,properties:s.properties.filter(p=>p.id!==prop.id),contracts:s.contracts.filter(c=>c.propertyId!==prop.id)}));pop();}}}
      onNewContract={()=>push("newContract",{propId:prop.id})}
      onSimCheckin={t=>setLinkToken(t)}
      onSimCheckout={t=>setLinkToken(t)}
      onViewRecord={id=>push("record",{coId:id})}
      onSaveMsg={(type,msg)=>updateDb(s=>({...s,properties:s.properties.map(p=>p.id===prop.id?{...p,[type==="checkin"?"checkinMsg":"checkoutMsg"]:msg}:p)}))}
      onBack={pop}
    />;
  }

  if(cur?.v==="newContract") {
    const prop=db.properties.find(p=>p.id===cur.ctx.propId);
    return <NewContractPage prop={prop}
      onSave={d=>{updateDb(s=>({...s,contracts:[...s.contracts,{id:genId(),propertyId:cur.ctx.propId,status:"active",checkinToken:genToken(),checkoutToken:genToken(),createdAt:nowStr(),...d,checkinSubmitted:false,checkoutSubmitted:false}]}));pop();}}
      onBack={pop}/>;
  }

  if(cur?.v==="record") {
    const co=db.contracts.find(c=>c.id===cur.ctx.coId);
    const prop=db.properties.find(p=>p.id===co?.propertyId);
    return <>
      {showReviewPopup && <ReviewModal
        onSubmit={r=>{updateDb(s=>({...s,reviews:[...(s.reviews||[]).filter(x=>x.userId!==user.id),{...r,id:genId(),userId:user.id,userName:user.name,time:nowStr()}]}));}}
        onClose={()=>{setShowReviewPopup(false);pop();}}
      />}
      <RecordPage co={co} prop={prop}
        onEndContract={co?.status!=="ended" ? () => {
          if(window.confirm("계약을 마무리할까요?")) {
            updateDb(s=>({...s,contracts:s.contracts.map(c=>c.id===co.id?{...c,status:"ended",endedAt:nowStr()}:c)}));
            setShowReviewPopup(true);
          }
        } : null}
        onBack={pop}/>
    </>;
  }

  if(cur?.v==="adminUser") return <AdminUserPage u={cur.ctx.u} logs={(db.logs||[]).filter(l=>l.userId===cur.ctx.u.id)} onBack={pop}/>;
  if(cur?.v==="channelEdit") return <ChannelEditPage item={cur.ctx.item}
    onSave={item=>{if(item.id)updateDb(s=>({...s,channels:s.channels.map(c=>c.id===item.id?item:c)}));else updateDb(s=>({...s,channels:[{...item,id:genId()},...s.channels]}));pop();}}
    onDelete={id=>{updateDb(s=>({...s,channels:s.channels.filter(c=>c.id!==id)}));pop();}}
    onBack={pop}/>;

  const tabs=[
    {id:"home",emoji:"🏠",label:"홈"},
    {id:"channel",emoji:"📢",label:"채널"},
    {id:"share",emoji:"👥",label:"공유"},
    {id:"settings",emoji:"⚙️",label:"설정"},
    ...(user.isAdmin?[{id:"admin",emoji:"🔧",label:"관리자"}]:[]),
  ];

  return (
    <div style={{minHeight:"100vh",background:C.gray50,display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{flex:1,overflowY:"auto",paddingBottom:72}}>
        {tab==="home" && <HomeTab user={user} props={myProps} contracts={db.contracts} onPropClick={id=>push("propDetail",{id})} onAddProp={()=>push("addProp")}/>}
        {tab==="channel" && <ChannelTab items={db.channels} isAdmin={user.isAdmin} onEdit={item=>push("channelEdit",{item})} onAdd={type=>push("channelEdit",{item:{type,title:"",body:"",url:"",date:new Date().toLocaleDateString("ko-KR")}})}/>}
        {tab==="share" && <ShareTab/>}
        {tab==="settings" && <SettingsTab user={user} contactEmail={db.contactEmail} onLogout={()=>{setUser(null);setStack([]);setTab("home");setShowLanding(false);}} onUpdateEmail={e=>upDb({contactEmail:e})}/>}
        {tab==="admin" && user.isAdmin && <AdminTab db={db} onUserClick={u=>push("adminUser",{u})} onToggleReviewFeatured={id=>updateDb(s=>({...s,reviews:(s.reviews||[]).map(r=>r.id===id?{...r,featured:!r.featured}:r)}))}/>}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.white,borderTop:`1.5px solid ${C.gray200}`,zIndex:100,boxSizing:"border-box"}}>
        <div style={{display:"flex"}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 4px 12px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:22}}>{t.emoji}</span>
              <span style={{fontSize:13,fontWeight:tab===t.id?600:400,color:tab===t.id?C.primary:C.gray400}}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── REVIEW MODAL ──────────────────────────────────
function ReviewModal({onSubmit,onClose}) {
  const [stars,setStars]=useState(5);
  const [text,setText]=useState("");
  const [done,setDone]=useState(false);

  if(done) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:C.white,borderRadius:R.lg,padding:"36px 24px",maxWidth:340,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <p style={{fontSize:52,marginBottom:12}}>🙏</p>
        <h2 style={{fontSize:F.xl,fontWeight:700,marginBottom:8,color:C.gray900}}>후기 써주셔서 감사해요!</h2>
        <p style={{fontSize:F.base,color:C.gray600,marginBottom:24,lineHeight:1.6}}>소중한 의견이 서비스 개선에<br/>큰 도움이 돼요 😊</p>
        <PrimaryBtn label="확인" onClick={onClose}/>
      </div>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:R.lg,padding:"28px 20px",maxWidth:360,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <p style={{fontSize:40,textAlign:"center",marginBottom:8}}>🎉</p>
        <p style={{fontSize:F.xl,fontWeight:700,color:C.gray900,textAlign:"center",marginBottom:6}}>계약 마무리를 축하해요!</p>
        <p style={{fontSize:F.sm,color:C.gray600,textAlign:"center",marginBottom:20,lineHeight:1.6}}>입퇴실 도우미 사용은 어떠셨나요?<br/>한 줄 후기를 남겨주세요 😊</p>
        <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:16}}>
          {[1,2,3,4,5].map(s=>(
            <span key={s} onClick={()=>setStars(s)} style={{fontSize:38,cursor:"pointer",opacity:s<=stars?1:0.2,transition:"opacity 0.15s"}}>⭐</span>
          ))}
        </div>
        <Textarea value={text} onChange={setText} placeholder="어떤 점이 좋았나요? (선택)" minHeight={80}/>
        <PrimaryBtn label="후기 남기기" onClick={()=>{onSubmit({stars,text});setDone(true);}} style={{marginTop:12}}/>
      </div>
    </div>
  );
}

// ── LANDING PAGE ───────────────────────────────────
function LandingPage({reviews,onStart}) {
  const features=[
    {emoji:"📸",title:"입·퇴실 사진 비교",desc:"공간별 입주 전 사진을 등록해두면 퇴실 사진과 나란히 비교할 수 있어요"},
    {emoji:"🔗",title:"링크 한 번에 전달",desc:"입실·퇴실 확인 링크를 문자나 카카오톡으로 바로 보내세요. 앱 설치 불필요!"},
    {emoji:"⚖️",title:"보증금 분쟁 예방",desc:"사진과 기록이 증거로 남아있으면 보증금 분쟁을 사전에 막을 수 있어요"},
  ];
  return (
    <div style={{minHeight:"100vh",background:C.white,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",overflowY:"auto"}}>
      <div style={{background:`linear-gradient(135deg, ${C.primary} 0%, #5B8DFF 100%)`,padding:"52px 24px 44px",textAlign:"center"}}>
        <p style={{fontSize:56,marginBottom:12}}>🏠</p>
        <h1 style={{fontSize:28,fontWeight:700,marginBottom:8,color:C.white,lineHeight:1.3}}>입퇴실 도우미</h1>
        <p style={{fontSize:F.base,color:"rgba(255,255,255,0.88)",lineHeight:1.7,marginBottom:32}}>방 상태 기록부터 보증금 정산까지<br/>임대인의 든든한 파트너</p>
        <button onClick={onStart} style={{padding:"16px 40px",background:C.white,color:C.primary,borderRadius:R.full,fontSize:F.base,fontWeight:700,border:"none",cursor:"pointer",boxShadow:"0 4px 18px rgba(0,0,0,0.18)"}}>무료로 시작하기 →</button>
        <p style={{fontSize:F.xs,color:"rgba(255,255,255,0.6)",marginTop:10}}>앱 설치 없음 · 완전 무료</p>
      </div>

      <div style={{padding:"32px 20px 8px"}}>
        <p style={{fontSize:F.lg,fontWeight:700,textAlign:"center",marginBottom:20,color:C.gray900}}>이런 분들에게 딱이에요</p>
        {features.map((f,i)=>(
          <div key={i} style={{display:"flex",gap:14,padding:"16px",background:C.gray50,borderRadius:R.lg,marginBottom:10,border:`1px solid ${C.gray100}`}}>
            <span style={{fontSize:32,flexShrink:0,lineHeight:1}}>{f.emoji}</span>
            <div>
              <p style={{fontSize:F.base,fontWeight:700,color:C.gray900,marginBottom:4}}>{f.title}</p>
              <p style={{fontSize:F.sm,color:C.gray600,lineHeight:1.6}}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {reviews.length>0 && (
        <div style={{padding:"20px 20px 8px"}}>
          <p style={{fontSize:F.lg,fontWeight:700,textAlign:"center",marginBottom:16,color:C.gray900}}>실사용 후기</p>
          {reviews.map((r,i)=>(
            <div key={i} style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:R.lg,padding:"16px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:C.primaryLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:F.base,fontWeight:700,color:C.primary}}>{r.userName?.[0]||"?"}</div>
                  <span style={{fontSize:F.sm,fontWeight:600,color:C.gray800}}>{r.userName}</span>
                </div>
                <span style={{fontSize:13}}>{"⭐".repeat(r.stars)}</span>
              </div>
              {r.text&&<p style={{fontSize:F.sm,color:C.gray600,lineHeight:1.6}}>{r.text}</p>}
            </div>
          ))}
        </div>
      )}

      <div style={{padding:"20px 20px 48px"}}>
        <PrimaryBtn label="지금 바로 시작하기" onClick={onStart}/>
      </div>
    </div>
  );
}

// ── AUTH ──────────────────────────────────────────
function AuthPage({users,onLogin,onRegister}) {
  const [mode,setMode]=useState("login");
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [pw,setPw]=useState(""); const [err,setErr]=useState("");
  function doLogin(){
    if(!email||!pw){setErr("이메일과 비밀번호를 입력해주세요.");return;}
    const u=users.find(u=>u.email===email&&u.pw===pw);
    if(!u){setErr("이메일 또는 비밀번호가 맞지 않아요.");return;}
    onLogin(u);
  }
  function doRegister(){
    if(!name||!email||!pw){setErr("모두 입력해주세요.");return;}
    const dup=users.find(u=>u.email===email);
    if(dup){setErr(`이미 가입된 이메일이에요. ${dup.loginMethod||"이메일"}로 가입하셨어요.`);return;}
    onRegister({name,email,pw,loginMethod:"email"});
  }
  return (
    <div style={{minHeight:"100vh",background:C.gray50,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
    <div style={{width:"100%",maxWidth:480,background:C.white,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px",boxSizing:"border-box"}}>
      <div style={{marginBottom:36,textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:12}}>🏠</div>
        <h1 style={{fontSize:F.xxl,fontWeight:700,color:C.gray900,marginBottom:8}}>입퇴실 도우미</h1>
        <p style={{fontSize:F.base,color:C.gray600,lineHeight:1.6}}>방 상태 기록, 분쟁 없이 임대하세요</p>
      </div>
      {mode==="login" ? <>
        <button onClick={()=>onLogin(DEMO)} style={{width:"100%",padding:"14px",background:"#FEE500",borderRadius:R.lg,fontSize:F.base,fontWeight:700,color:"#3C1E1E",marginBottom:10,border:"none",cursor:"pointer"}}>카카오로 시작하기</button>
        <button onClick={()=>onLogin(DEMO)} style={{width:"100%",padding:"14px",background:"#03C75A",borderRadius:R.lg,fontSize:F.base,fontWeight:700,color:C.white,marginBottom:10,border:"none",cursor:"pointer"}}>네이버로 시작하기</button>
        <Divider label="또는"/>
        <Inp value={email} onChange={setEmail} placeholder="이메일 (vamos1013@naver.com)" type="email" style={{marginBottom:10}}/>
        <Inp value={pw} onChange={setPw} placeholder="비밀번호" type="password" style={{marginBottom:err?6:16}}/>
        {err && <p style={{color:C.danger,fontSize:F.sm,marginBottom:12,alignSelf:"flex-start"}}>{err}</p>}
        <PrimaryBtn label="로그인" onClick={doLogin} style={{marginBottom:10}}/>
        <OutlineBtn label="🚀 데모 계정으로 시작하기" onClick={()=>onLogin(DEMO)} style={{marginBottom:16}}/>
        <p style={{fontSize:F.sm,color:C.gray600}}>계정이 없으신가요? <span style={{color:C.primary,fontWeight:600,cursor:"pointer"}} onClick={()=>setMode("register")}>회원가입</span></p>
      </> : <>
        <Inp value={name} onChange={setName} placeholder="이름 (홍길동)" style={{marginBottom:10}}/>
        <Inp value={email} onChange={setEmail} placeholder="이메일" type="email" style={{marginBottom:10}}/>
        <Inp value={pw} onChange={setPw} placeholder="비밀번호" type="password" style={{marginBottom:err?6:16}}/>
        {err && <p style={{color:C.danger,fontSize:F.sm,marginBottom:12,alignSelf:"flex-start"}}>{err}</p>}
        <PrimaryBtn label="가입하기" onClick={doRegister} style={{marginBottom:16}}/>
        <p style={{fontSize:F.sm,color:C.gray600}}>이미 계정이 있으신가요? <span style={{color:C.primary,fontWeight:600,cursor:"pointer"}} onClick={()=>setMode("login")}>로그인</span></p>
      </>}
    </div>
    </div>
  );
}

// ── HOME TAB ──────────────────────────────────────
function HomeTab({user,props,contracts,onPropClick,onAddProp}) {
  const active=props.filter(p=>contracts.find(c=>c.propertyId===p.id&&c.status!=="ended"));
  const vacant=props.filter(p=>!contracts.find(c=>c.propertyId===p.id&&c.status!=="ended"));
  const timeline=props.map(p=>{
    const a=contracts.find(c=>c.propertyId===p.id&&c.status!=="ended");
    const d=a?.endDate?daysDiff(a.endDate):null;
    return{p,a,d,hasPhoto:a?.checkoutSubmitted&&a.status!=="ended"};
  }).filter(x=>x.d!==null&&x.d<=30).sort((a,b)=>a.d-b.d);

  return (
    <div style={{padding:"24px 16px"}}>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:F.xl,fontWeight:700,color:C.gray900,marginBottom:4}}>안녕하세요, {user.name}님 👋</h2>
        <p style={{fontSize:F.sm,color:C.gray600}}>오늘도 편안한 임대 되세요</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
        <StatCard label="전체" value={props.length} emoji="🏘️" color={C.primary}/>
        <StatCard label="입주중" value={active.length} emoji="✅" color={C.success}/>
        <StatCard label="공실" value={vacant.length} emoji="🔑" color={C.warning}/>
      </div>
      {timeline.length>0 && <>
        <SectionLabel label="다가오는 계약 만료"/>
        <div style={{background:C.white,borderRadius:R.lg,border:`1px solid ${C.gray200}`,overflow:"hidden",marginBottom:20}}>
          {timeline.map(({p,a,d,hasPhoto},i)=>(
            <div key={p.id} onClick={()=>onPropClick(p.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i<timeline.length-1?`1px solid ${C.gray100}`:"none",cursor:"pointer"}}>
              <div style={{width:10,height:10,borderRadius:"50%",flexShrink:0,background:d<=7?C.danger:d<=14?C.warning:C.success}}/>
              <span style={{fontSize:F.sm,fontWeight:600,color:C.gray600,minWidth:48}}>{d}일 후</span>
              <div style={{flex:1}}>
                <span style={{fontSize:F.base}}>{p.address} {p.ho}</span>
                {hasPhoto && <span style={{marginLeft:8,fontSize:F.xs,background:C.primaryLight,color:C.primaryText,borderRadius:R.full,padding:"2px 8px",fontWeight:600}}>📬 사진 도착</span>}
              </div>
              <span style={{fontSize:F.sm,color:C.gray400}}>{a?.tenantName||""}</span>
            </div>
          ))}
        </div>
      </>}
      <SectionLabel label={`내 방 (${props.length})`}/>
      {props.length===0 && <Empty emoji="🏘️" text="아직 등록된 방이 없어요" sub="아래 버튼으로 첫 번째 방을 추가해보세요"/>}
      {props.map(prop=>{
        const a=contracts.find(c=>c.propertyId===prop.id&&c.status!=="ended");
        const st=getStatus(a); const cfg=ST[st];
        return (
          <div key={prop.id} onClick={()=>onPropClick(prop.id)} style={{background:C.white,borderRadius:R.lg,border:`1px solid ${C.gray200}`,padding:"16px",marginBottom:10,cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div>
                <p style={{fontSize:F.base,fontWeight:600,marginBottom:2}}>{prop.address}</p>
                <p style={{fontSize:F.sm,color:C.gray600}}>{[prop.dong,prop.ho].filter(Boolean).join(" ")}</p>
              </div>
              <span style={{color:C.gray400,fontSize:20}}>›</span>
            </div>
            {a ? <div style={{display:"flex",alignItems:"center",gap:8}}><Dot color={cfg?.dot}/><span style={{fontSize:F.sm,color:C.gray600}}>{cfg?.label}</span>{a.endDate&&<span style={{fontSize:F.xs,color:C.gray400,marginLeft:"auto"}}>~{a.endDate}</span>}</div>
              : <span style={{fontSize:F.sm,color:C.gray400}}>계약 없음</span>}
          </div>
        );
      })}
      <button onClick={onAddProp} style={{width:"100%",padding:"15px",background:C.primary,borderRadius:R.lg,fontSize:F.base,fontWeight:700,color:C.white,marginTop:4,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span style={{fontSize:20}}>＋</span> 방 추가하기
      </button>
    </div>
  );
}

// ── PROP DETAIL ───────────────────────────────────
function PropDetailPage({prop,active,past,onEdit,onDelete,onNewContract,onSimCheckin,onSimCheckout,onViewRecord,onSaveMsg,onBack}) {
  const [showPw,setShowPw]=useState(false);
  const [ciMsg,setCiMsg]=useState(prop.checkinMsg||DEFAULT_CI_MSG.replace("[주소]",`${prop.address} ${prop.ho}`));
  const [coMsg,setCoMsg]=useState(prop.checkoutMsg||DEFAULT_CO_MSG.replace("[주소]",`${prop.address} ${prop.ho}`));
  const [ciSaved,setCiSaved]=useState(false);
  const [coSaved,setCoSaved]=useState(false);
  const [copiedCi,setCopiedCi]=useState(false);
  const [copiedCo,setCopiedCo]=useState(false);
  const st=getStatus(active); const cfg=ST[st];

  function copyLink(type) {
    const token=type==="checkin"?active?.checkinToken:active?.checkoutToken;
    const msg=type==="checkin"?ciMsg:coMsg;
    const url=`${window.location.origin}${window.location.pathname}?token=${token}`;
    navigator.clipboard?.writeText(`${msg}\n\n${url}`).catch(()=>{});
    if(type==="checkin"){setCopiedCi(true);setTimeout(()=>setCopiedCi(false),2000);}
    else{setCopiedCo(true);setTimeout(()=>setCopiedCo(false),2000);}
  }

  return (
    <Page>
      <NavBar title={prop.address} onBack={onBack} right={<><TxtBtn label="수정" onClick={onEdit}/><TxtBtn label="삭제" onClick={onDelete} color={C.danger}/></>}/>
      <div style={{padding:"16px 16px 32px"}}>
        <p style={{fontSize:F.sm,color:C.gray600,marginBottom:20}}>{[prop.dong,prop.ho].filter(Boolean).join(" ")}</p>

        <SCard title="현재 계약">
          {active ? <>
            <StepBar st={st}/>
            {cfg && <InfoBanner text={cfg.desc} sub={cfg.next} type={st==="checkout_done"?"success":"info"}/>}
            <DataRow label="임차인" value={active.tenantName||"(미입력)"}/>
            <DataRow label="보증금" value={active.deposit?`${Number(active.deposit).toLocaleString()}만원`:"(미입력)"}/>
            <DataRow label="월세" value={active.monthly?`${Number(active.monthly).toLocaleString()}만원`:"(미입력)"}/>
            <DataRow label="계약 시작" value={active.startDate||"(미입력)"}/>
            <DataRow label="계약 종료" value={active.endDate||"(미입력)"}/>

            {/* 입실 링크 */}
            <div style={{marginTop:16}}>
              <p style={{fontSize:F.sm,fontWeight:700,color:C.gray600,marginBottom:6}}>입실 링크 발급 {active.checkinSubmitted&&<span style={{color:C.success,marginLeft:6}}>✓ 완료</span>}</p>
              <Textarea value={ciMsg} onChange={v=>{setCiMsg(v);setCiSaved(false);}} placeholder="메시지 입력" minHeight={90}/>
              <div style={{display:"flex",gap:8,marginTop:8,marginBottom:8}}>
                <button onClick={()=>copyLink("checkin")} style={{flex:1,padding:"10px",background:copiedCi?C.success:C.primary,color:C.white,borderRadius:R.md,fontSize:F.sm,fontWeight:700,border:"none",cursor:"pointer"}}>
                  {copiedCi?"✓ 복사됐어요!":"📋 메시지 + 링크 복사"}
                </button>
                <button onClick={()=>{onSaveMsg?.("checkin",ciMsg);setCiSaved(true);}} style={{padding:"10px 14px",background:ciSaved?C.successLight:C.gray100,borderRadius:R.md,fontSize:F.sm,color:ciSaved?C.successText:C.gray600,border:ciSaved?`1px solid ${C.success}30`:"none",cursor:"pointer",fontWeight:ciSaved?700:400}}>
                  {ciSaved?"✓ 저장됨":"저장"}
                </button>
              </div>
              <button onClick={()=>onSimCheckin(active.checkinToken)} style={{width:"100%",padding:"9px",background:"none",border:`1.5px solid ${C.primary}`,borderRadius:R.md,fontSize:F.sm,color:C.primary,fontWeight:600,cursor:"pointer"}}>📱 입실 링크 테스트</button>
            </div>

            {/* 퇴실 링크 */}
            <div style={{marginTop:16,opacity:active.checkinSubmitted?1:0.4}}>
              <p style={{fontSize:F.sm,fontWeight:700,color:C.gray600,marginBottom:6}}>퇴실 링크 발급 {active.checkoutSubmitted&&<span style={{color:C.success,marginLeft:6}}>✓ 완료</span>}</p>
              {!active.checkinSubmitted ? (
                <p style={{fontSize:F.xs,color:C.gray400}}>입실 확인 후 사용할 수 있어요</p>
              ) : <>
                <Textarea value={coMsg} onChange={v=>{setCoMsg(v);setCoSaved(false);}} placeholder="메시지 입력" minHeight={90}/>
                <div style={{display:"flex",gap:8,marginTop:8,marginBottom:8}}>
                  <button onClick={()=>copyLink("checkout")} style={{flex:1,padding:"10px",background:copiedCo?C.success:C.primary,color:C.white,borderRadius:R.md,fontSize:F.sm,fontWeight:700,border:"none",cursor:"pointer"}}>
                    {copiedCo?"✓ 복사됐어요!":"📋 메시지 + 링크 복사"}
                  </button>
                  <button onClick={()=>{onSaveMsg?.("checkout",coMsg);setCoSaved(true);}} style={{padding:"10px 14px",background:coSaved?C.successLight:C.gray100,borderRadius:R.md,fontSize:F.sm,color:coSaved?C.successText:C.gray600,border:coSaved?`1px solid ${C.success}30`:"none",cursor:"pointer",fontWeight:coSaved?700:400}}>
                    {coSaved?"✓ 저장됨":"저장"}
                  </button>
                </div>
                <button onClick={()=>onSimCheckout(active.checkoutToken)} style={{width:"100%",padding:"9px",background:"none",border:`1.5px solid ${C.primary}`,borderRadius:R.md,fontSize:F.sm,color:C.primary,fontWeight:600,cursor:"pointer"}}>📱 퇴실 링크 테스트</button>
              </>}
            </div>

            {active.checkoutSubmitted && (
              <div style={{marginTop:14}}>
                <button onClick={()=>onViewRecord(active.id)} style={{width:"100%",padding:"15px",background:C.success,color:C.white,borderRadius:R.lg,fontSize:F.base,fontWeight:700,border:"none",cursor:"pointer"}}>📋 제출 내용 확인하기</button>
              </div>
            )}
          </> : <>
            <Empty emoji="📋" text="진행 중인 계약이 없어요" sub=""/>
            <PrimaryBtn label="새 계약 시작하기" onClick={onNewContract} style={{marginTop:12}}/>
          </>}
        </SCard>

        {active?.checkinSubmitted && active.checkinData && (
          <SCard title="입실 기록 확인">
            <p style={{fontSize:F.xs,color:C.gray400,marginBottom:8}}>제출: {active.checkinData.time}</p>
            {active.checkinData.extras?.length>0 ? <>
              <p style={{fontSize:F.sm,fontWeight:600,marginBottom:8}}>여기도 봐주세요 ({active.checkinData.extras.length}장)</p>
              <PhotoGrid photos={active.checkinData.extras} tall/>
            </> : <p style={{fontSize:F.sm,color:C.gray400}}>추가 사진 없음</p>}
          </SCard>
        )}

        <SCard title="방 정보">
          <DataRow label="주소" value={prop.address}/>
          <DataRow label="현관 비밀번호" value={prop.noPw?"없음":(showPw?prop.password:"••••••")} action={!prop.noPw&&<span onClick={()=>setShowPw(s=>!s)} style={{fontSize:F.sm,color:C.primary,cursor:"pointer",fontWeight:600}}>{showPw?"숨기기":"보기"}</span>}/>
          <DataRow label="공간" value={(prop.spaces||[]).join(", ")}/>
        </SCard>

        {past.length>0 && (
          <SCard title={`지난 계약 (최근 ${past.length}건)`}>
            {past.map((co,i)=>(
              <div key={co.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<past.length-1?`1px solid ${C.gray100}`:"none"}}>
                <div>
                  <p style={{fontSize:F.base}}>{co.tenantName||"(임차인 미입력)"}</p>
                  <p style={{fontSize:F.sm,color:C.gray400}}>{co.startDate} ~ {co.endDate}</p>
                </div>
                <button onClick={()=>onViewRecord(co.id)} style={{padding:"6px 14px",background:C.gray100,borderRadius:R.full,fontSize:F.sm,color:C.gray600,border:"none",cursor:"pointer"}}>기록 보기</button>
              </div>
            ))}
          </SCard>
        )}
      </div>
    </Page>
  );
}

// ── ADD PROP ──────────────────────────────────────
function AddPropPage({prop,onSave,onBack}) {
  const [address,setAddress]=useState(prop?.address||"");
  const [noDong,setNoDong]=useState(!prop?.dong);
  const [dong,setDong]=useState(prop?.dong||"");
  const [ho,setHo]=useState(prop?.ho||"");
  const [noPw,setNoPw]=useState(prop?.noPw||false);
  const [pw,setPw]=useState(prop?.password||"");
  const [notice,setNotice]=useState(prop?.notice||"");
  const [noticeSaved,setNoticeSaved]=useState(false);
  const [spaces,setSpaces]=useState(prop?.spaces||[...SPACES]);
  const [newSp,setNewSp]=useState("");
  const [refPhotos,setRefPhotos]=useState(prop?.refPhotos||{});
  const [editIdx,setEditIdx]=useState(null);
  const [pendingName,setPendingName]=useState("");
  const fileRefs=useRef({});
  function hPhoto(sp,e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setRefPhotos(s=>({...s,[sp]:ev.target.result}));r.readAsDataURL(f);}

  function doSave() {
    if(!address){alert("📍 주소를 입력해주세요.\n주소는 필수 항목이에요.");return;}
    onSave({address,dong:noDong?"":dong,ho,noPw,password:noPw?"":pw,notice,spaces,refPhotos});
  }

  return (
    <Page>
      <NavBar title={prop?"방 수정":"방 추가하기"} onBack={onBack}/>
      <div style={{padding:"16px 16px 100px"}}>
        <SCard title="📍 주소">
          <FieldLabel label="주소 (필수)"/>
          <Inp value={address} onChange={setAddress} placeholder="서울시 마포구 공덕동 123-4" style={{marginBottom:12}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <FieldLabel label="동"/>
              {!noDong ? <Inp value={dong} onChange={setDong} placeholder="101동"/> : <p style={{fontSize:F.sm,color:C.gray400,padding:"13px 0"}}>생략됨</p>}
              <label style={{display:"flex",alignItems:"center",gap:6,fontSize:F.sm,color:C.gray400,marginTop:6,cursor:"pointer"}}><input type="checkbox" checked={noDong} onChange={e=>setNoDong(e.target.checked)}/>동이 없어요</label>
            </div>
            <div><FieldLabel label="호수"/><Inp value={ho} onChange={setHo} placeholder="305호"/></div>
          </div>
        </SCard>

        <SCard title="🔑 현관 비밀번호">
          <Checkbox checked={noPw} onChange={e=>setNoPw(e.target.checked)} label="비밀번호가 없어요"/>
          {!noPw && <>
            <p style={{fontSize:F.sm,color:C.gray600,margin:"8px 0"}}>입실 링크에서 손님한테 자동으로 전달돼요</p>
            <Inp value={pw} onChange={setPw} placeholder="예: 1234#"/>
          </>}
        </SCard>

        <SCard title="📋 손님 안내사항">
          <p style={{fontSize:F.sm,color:C.gray600,marginBottom:10}}>주차, 분리수거, 와이파이 등을 자유롭게 적어주세요</p>
          <Textarea value={notice} onChange={v=>{setNotice(v);setNoticeSaved(false);}} placeholder={"· 주차: 지하 1층 101번\n· 분리수거: 화·목 저녁 8시\n· 와이파이: iptime / 1234"} minHeight={100}/>
          <button onClick={()=>setNoticeSaved(true)} style={{marginTop:8,padding:"8px 18px",background:noticeSaved?C.successLight:C.gray100,borderRadius:R.md,fontSize:F.sm,color:noticeSaved?C.successText:C.gray600,border:noticeSaved?`1px solid ${C.success}30`:"none",cursor:"pointer",fontWeight:noticeSaved?700:400}}>
            {noticeSaved?"✓ 저장됨 — 다음 계약에도 적용돼요":"저장하기"}
          </button>
        </SCard>

        <SCard title="📸 입주 전/후 사진 비교">
          <p style={{fontSize:F.sm,color:C.gray600,marginBottom:12}}>공간마다 입주 전 사진을 올려두면 퇴실할 때 나란히 비교할 수 있어요</p>
          {spaces.map((sp,i)=>(
            <div key={i} style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                {editIdx===i ? (
                  <div style={{display:"flex",gap:6,flex:1,marginRight:8}}>
                    <Inp value={pendingName} onChange={setPendingName} placeholder={sp} style={{flex:1}}/>
                    <button onClick={()=>{if(pendingName.trim())setSpaces(spaces.map((s,j)=>j===i?pendingName:s));setEditIdx(null);setPendingName("");}} style={{padding:"0 14px",background:C.primary,color:C.white,borderRadius:R.md,fontSize:F.sm,fontWeight:600,border:"none",cursor:"pointer"}}>확인</button>
                    <button onClick={()=>{setEditIdx(null);setPendingName("");}} style={{padding:"0 10px",background:C.gray100,borderRadius:R.md,fontSize:F.sm,color:C.gray600,border:"none",cursor:"pointer"}}>취소</button>
                  </div>
                ) : (
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:F.base,fontWeight:600}}>{sp}</span>
                    <button onClick={()=>{setEditIdx(i);setPendingName(sp);}} style={{background:"none",fontSize:F.xs,color:C.primary,padding:"2px 8px",border:`1px solid ${C.primary}`,borderRadius:R.full,cursor:"pointer"}}>수정</button>
                  </div>
                )}
                <button onClick={()=>setSpaces(spaces.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.gray400,fontSize:18,cursor:"pointer",padding:"0 4px",flexShrink:0}}>✕</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div>
                  <p style={{fontSize:F.xs,fontWeight:600,color:C.primary,marginBottom:4}}>입주 전 (임대인)</p>
                  <div onClick={()=>fileRefs.current[sp]?.click()} style={{aspectRatio:"3/4",background:C.primaryLight,borderRadius:R.md,border:`2px dashed ${C.primary}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden"}}>
                    <input ref={el=>fileRefs.current[sp]=el} type="file" accept="image/*" style={{display:"none"}} onChange={e=>hPhoto(sp,e)}/>
                    {refPhotos[sp] ? <img src={refPhotos[sp]} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:28}}>📷</span>}
                  </div>
                </div>
                <div>
                  <p style={{fontSize:F.xs,fontWeight:600,color:C.gray400,marginBottom:4}}>입주 후 (임차인)</p>
                  <div style={{aspectRatio:"3/4",background:C.gray100,borderRadius:R.md,border:`2px dashed ${C.gray200}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:F.sm,color:C.gray400}}>대기중</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <Inp value={newSp} onChange={setNewSp} placeholder="공간 이름 추가 (예: 방2)" style={{flex:1}}/>
            <button onClick={()=>{if(newSp.trim()&&spaces.length<10){setSpaces([...spaces,newSp.trim()]);setNewSp("");}}} style={{padding:"0 18px",background:C.primary,color:C.white,borderRadius:R.md,fontSize:F.sm,fontWeight:600,border:"none",cursor:"pointer"}}>추가</button>
          </div>
          <p style={{fontSize:F.xs,color:C.gray400,marginTop:6}}>추가 버튼을 누르면 새 공간을 만들 수 있어요 (최대 10개)</p>
        </SCard>
      </div>
      <FixedBottom><PrimaryBtn label="저장하기" onClick={doSave}/></FixedBottom>
    </Page>
  );
}

// ── NEW CONTRACT ──────────────────────────────────
function NewContractPage({prop,onSave,onBack}) {
  const [deposit,setDeposit]=useState("");
  const [monthly,setMonthly]=useState("");
  const [startDate,setStartDate]=useState("");
  const [endDate,setEndDate]=useState("");
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");

  function doSave() {
    if(!deposit){alert("💰 보증금을 입력해주세요.");return;}
    if(!monthly){alert("💰 월세를 입력해주세요.");return;}
    if(!startDate){alert("📅 계약 시작일을 선택해주세요.");return;}
    if(!endDate){alert("📅 계약 종료일을 선택해주세요.");return;}
    onSave({deposit,monthly,startDate,endDate,tenantName:name,tenantPhone:phone});
  }

  return (
    <Page>
      <NavBar title="새 계약 시작하기" onBack={onBack}/>
      <div style={{padding:"16px 16px 100px"}}>
        <p style={{fontSize:F.sm,color:C.gray600,marginBottom:20}}>{prop.address} {prop.ho}</p>
        <SCard title="계약 정보">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><FieldLabel label="보증금 (만원) *"/><Inp value={deposit} onChange={setDeposit} placeholder="500" type="number"/></div>
            <div><FieldLabel label="월세 (만원) *"/><Inp value={monthly} onChange={setMonthly} placeholder="50" type="number"/></div>
          </div>
          <FieldLabel label="계약 시작일 *"/>
          <DatePicker value={startDate} onChange={setStartDate} placeholder="시작일 선택" style={{marginBottom:10}}/>
          <FieldLabel label="계약 종료일 *"/>
          <DatePicker value={endDate} onChange={setEndDate} placeholder="종료일 선택"/>
        </SCard>
        <SCard title="임차인 정보">
          <p style={{fontSize:F.sm,color:C.gray600,marginBottom:12}}>나중에 적어도 괜찮아요 😊</p>
          <FieldLabel label="이름"/><Inp value={name} onChange={setName} placeholder="홍길동" style={{marginBottom:10}}/>
          <FieldLabel label="연락처"/><Inp value={phone} onChange={setPhone} placeholder="010-0000-0000"/>
        </SCard>
      </div>
      <FixedBottom><PrimaryBtn label="계약 시작하기" onClick={doSave}/></FixedBottom>
    </Page>
  );
}

// ── RECORD PAGE ───────────────────────────────────
function RecordPage({co,prop,onBack,onEndContract}) {
  const ci=co?.checkinData; const cout=co?.checkoutData;
  const [modal,setModal]=useState(null);
  return (
    <Page>
      <PhotoModal src={modal} onClose={()=>setModal(null)}/>
      <NavBar title="계약 기록" onBack={onBack}/>
      <div style={{padding:"16px 16px 32px"}}>
        <p style={{fontSize:F.sm,color:C.gray600,marginBottom:20}}>{prop?.address} {prop?.ho}</p>
        {ci && (
          <SCard title="입실 기록">
            <p style={{fontSize:F.xs,color:C.gray400,marginBottom:8}}>제출: {ci.time}</p>
            {ci.extras?.length>0 ? <>
              <p style={{fontSize:F.sm,fontWeight:600,marginBottom:8}}>여기도 봐주세요</p>
              <PhotoGrid photos={ci.extras} tall/>
            </> : <p style={{fontSize:F.sm,color:C.gray400}}>추가 사진 없음</p>}
          </SCard>
        )}
        {cout && (
          <SCard title="퇴실 기록">
            <p style={{fontSize:F.xs,color:C.gray400,marginBottom:8}}>제출: {cout.time}</p>
            <DataRow label="퇴실 비밀번호" value={cout.password||"-"}/>
            {cout.account && <DataRow label="반환 계좌" value={`${cout.account.bank} ${cout.account.number} (${cout.account.name})`}/>}
            <div style={{marginTop:12}}>
              {(prop?.spaces||[]).map(sp=>(
                <div key={sp} style={{marginBottom:14}}>
                  <p style={{fontSize:F.sm,fontWeight:600,marginBottom:6}}>{sp}</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[["입주 전",prop?.refPhotos?.[sp],C.gray400],["퇴실 후",cout.photos?.[sp],C.primary]].map(([l,src,col])=>(
                      <div key={l}>
                        <p style={{fontSize:F.xs,color:col,marginBottom:3}}>{l}</p>
                        {src ? <img src={src} onClick={()=>setModal(src)} style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",borderRadius:R.md,cursor:"pointer"}}/>
                          : <div style={{aspectRatio:"3/4",background:C.gray100,borderRadius:R.md,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:F.xs,color:C.gray400}}>없음</span></div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {["전기","가스","수도"].map(k=>(
              <div key={k} style={{padding:"7px 0",borderBottom:`1px solid ${C.gray100}`,fontSize:F.sm}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:C.gray600}}>{k}</span>
                  {cout.utilities?.[k]?.skip ? <span style={{color:C.gray400}}>해당없음</span>
                    : cout.utilities?.[k]?.photo ? <span style={{color:C.success,cursor:"pointer",textDecoration:"underline"}} onClick={()=>setModal(cout.utilities[k].photo)}>✓ 사진 보기</span>
                    : <span style={{color:C.gray400}}>미제출</span>}
                </div>
              </div>
            ))}
            {cout.extras?.length>0 && <>
              <p style={{fontSize:F.sm,fontWeight:600,margin:"12px 0 8px"}}>여기도 봐주세요</p>
              <PhotoGrid photos={cout.extras} tall/>
            </>}
          </SCard>
        )}
        {onEndContract && (
          <div style={{marginTop:8,paddingBottom:16}}>
            <PrimaryBtn label="계약 마무리하기" onClick={onEndContract}/>
          </div>
        )}
      </div>
    </Page>
  );
}

// ── CHECKIN FORM ──────────────────────────────────
function CheckinForm({co,prop,onSubmit}) {
  const [extras,setExtras]=useState([]);
  const [noExtra,setNoExtra]=useState(false);
  const [showPw,setShowPw]=useState(false);
  const extraRef=useRef(null);
  return (
    <div style={{minHeight:"100vh",background:C.gray50,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:C.primary,padding:"20px 16px 16px"}}>
        <p style={{fontSize:F.sm,color:"rgba(255,255,255,0.8)",marginBottom:4}}>입실 안내</p>
        <h2 style={{fontSize:F.lg,fontWeight:700,color:C.white}}>{prop?.address} {prop?.ho}</h2>
      </div>
      <div style={{padding:"16px 16px 100px"}}>
        <SCard title="현관 비밀번호 🔑">
          {prop?.noPw ? (
            <p style={{fontSize:F.base,color:C.gray600}}>이 방은 별도 비밀번호가 없어요</p>
          ) : (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.primaryLight,borderRadius:R.md,padding:"12px 16px"}}>
              <span style={{fontSize:F.xl,fontWeight:700,letterSpacing:4,color:C.primaryText}}>{showPw?prop?.password:"••••••"}</span>
              <button onClick={()=>setShowPw(s=>!s)} style={{background:C.white,border:`1.5px solid ${C.primary}`,borderRadius:R.full,padding:"6px 14px",fontSize:F.sm,color:C.primary,fontWeight:600,cursor:"pointer"}}>{showPw?"숨기기":"보기"}</button>
            </div>
          )}
        </SCard>
        {prop?.notice && <SCard title="입주 안내 📋"><pre style={{fontSize:F.base,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"inherit",color:C.gray800}}>{prop.notice}</pre></SCard>}
        <SCard title="입주 전 방 상태 🏠">
          <p style={{fontSize:F.sm,color:C.gray600,marginBottom:6}}>입주하기 전 방 상태예요. 꼼꼼히 확인해주세요.</p>
          <div style={{background:C.warningLight,border:`1px solid ${C.warning}40`,borderRadius:R.md,padding:"10px 12px",marginBottom:12,fontSize:F.sm,color:C.warningText}}>
            💡 퇴실할 때 같은 공간을 사진으로 찍어서 비교하게 돼요. 지금 사진을 잘 확인해두세요!
          </div>
          {(prop?.spaces||[]).length===0 ? <p style={{fontSize:F.sm,color:C.gray400}}>등록된 사진이 없어요</p> : (
            (prop?.spaces||[]).map(sp=>(
              <div key={sp} style={{marginBottom:14}}>
                <p style={{fontSize:F.sm,fontWeight:600,marginBottom:6}}>{sp}</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div>
                    <p style={{fontSize:F.xs,fontWeight:600,color:C.primary,marginBottom:4}}>입주 전</p>
                    {prop?.refPhotos?.[sp] ? <img src={prop.refPhotos[sp]} style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",borderRadius:R.md}}/>
                      : <div style={{aspectRatio:"3/4",background:C.gray100,borderRadius:R.md,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:F.sm,color:C.gray400}}>사진 없음</span></div>}
                  </div>
                  <div>
                    <p style={{fontSize:F.xs,fontWeight:600,color:C.gray400,marginBottom:4}}>퇴실 후</p>
                    <div style={{aspectRatio:"3/4",background:C.gray100,borderRadius:R.md,border:`2px dashed ${C.gray200}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
                      <span style={{fontSize:24}}>📷</span>
                      <span style={{fontSize:F.xs,color:C.gray400,textAlign:"center",padding:"0 8px",lineHeight:1.4}}>퇴실할 때 사진을 올려주세요</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </SCard>
        <SCard title="여기도 봐주세요 📸">
          <p style={{fontSize:F.base,color:C.gray800,marginBottom:4,fontWeight:500}}>입주할 때 이런 상태였어요.</p>
          <p style={{fontSize:F.sm,color:C.gray600,marginBottom:12}}>더 남겨두고 싶은 부분이 있다면 사진을 찍고 메모를 남겨주세요. 나중에 분쟁을 예방할 수 있어요.</p>
          <input ref={extraRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setExtras(s=>[...s,{src:ev.target.result,memo:""}]);r.readAsDataURL(f);}}/>
          {extras.map((item,i)=>(
            <div key={i} style={{background:C.gray50,borderRadius:R.md,padding:"10px",marginBottom:8,display:"flex",gap:10,alignItems:"flex-start"}}>
              <img src={item.src} style={{width:72,height:96,objectFit:"cover",borderRadius:R.sm,flexShrink:0}}/>
              <div style={{flex:1}}>
                <Inp value={item.memo} onChange={v=>setExtras(s=>s.map((x,j)=>j===i?{...x,memo:v}:x))} placeholder="이 사진에 메모 (선택)" style={{fontSize:F.sm,marginBottom:6}}/>
                <button onClick={()=>setExtras(s=>s.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.danger,fontSize:F.xs,cursor:"pointer",padding:0}}>삭제</button>
              </div>
            </div>
          ))}
          <Checkbox checked={noExtra} onChange={e=>{setNoExtra(e.target.checked);if(e.target.checked)setExtras([]);}} label="따로 남길 사진이 없어요"/>
          {!noExtra && <GhostBtn label="📷 사진 추가하기" onClick={()=>extraRef.current?.click()}/>}
        </SCard>
      </div>
      <FixedBottom><PrimaryBtn label="확인 완료" onClick={()=>onSubmit({extras,noExtra})}/></FixedBottom>
    </div>
  );
}

// ── CHECKOUT FORM ─────────────────────────────────
function CheckoutForm({co,prop,onSubmit}) {
  const [pw,setPw]=useState(""); const [pwErr,setPwErr]=useState(false);
  const [noDeposit,setNoDeposit]=useState(false);
  const [bank,setBank]=useState(""); const [acct,setAcct]=useState(""); const [acctName,setAcctName]=useState("");
  const [acctErr,setAcctErr]=useState(false);
  const [photos,setPhotos]=useState({});
  const [utils,setUtils]=useState({전기:{skip:false,photo:null},가스:{skip:false,photo:null},수도:{skip:false,photo:null}});
  const [extras,setExtras]=useState([]); const [noExtra,setNoExtra]=useState(false);
  const fileRefs=useRef({}); const utilRefs=useRef({}); const extraRef=useRef(null);
  const pwRef=useRef(null); const acctRef=useRef(null);
  const spaces=prop?.spaces||[]; const refPhotos=prop?.refPhotos||{};

  function hPhoto(sp,e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhotos(s=>({...s,[sp]:ev.target.result}));r.readAsDataURL(f);}
  function hUtil(k,e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setUtils(s=>({...s,[k]:{...s[k],photo:ev.target.result}}));r.readAsDataURL(f);}

  function doSubmit() {
    if(!pw.trim()){
      setPwErr(true);
      setTimeout(()=>pwRef.current?.scrollIntoView({behavior:"smooth",block:"center"}),50);
      return;
    }
    if(!noDeposit&&(!bank||!acct||!acctName)){
      setAcctErr(true);
      setTimeout(()=>acctRef.current?.scrollIntoView({behavior:"smooth",block:"center"}),50);
      return;
    }
    // 공과금 — 사진도 없고 체크박스도 안 한 항목
    const missingUtil=["전기","가스","수도"].filter(k=>!utils[k]?.skip&&!utils[k]?.photo);
    if(missingUtil.length>0){
      alert(`⚡ 공과금 항목을 확인해주세요.\n\n${missingUtil.join(", ")} 항목에\n사진을 올리거나 "해당사항 없어요"를 체크해주세요.`);
      return;
    }
    // 기준사진 있는 공간 필수 체크
    const missing=spaces.filter(sp=>refPhotos[sp]&&!photos[sp]);
    if(missing.length>0){
      alert(`📸 아직 사진을 찍지 않은 공간이 있어요.\n${missing.join(", ")}\n\n입주 전 사진이 있는 공간은 퇴실 사진을 찍어야 해요.`);
      return;
    }
    onSubmit({password:pw,account:noDeposit?null:{bank,number:acct,name:acctName},photos,utilities:utils,extras});
  }

  return (
    <div style={{minHeight:"100vh",background:C.gray50,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:"#E74C3C",padding:"20px 16px 16px"}}>
        <p style={{fontSize:F.sm,color:"rgba(255,255,255,0.8)",marginBottom:4}}>퇴실 체크</p>
        <h2 style={{fontSize:F.lg,fontWeight:700,color:C.white}}>{prop?.address} {prop?.ho}</h2>
      </div>
      <div style={{padding:"16px 16px 100px"}}>
        <div ref={pwRef}>
          <SCard title="현관 비밀번호 🔑">
            <p style={{fontSize:F.sm,color:C.gray600,marginBottom:10}}>퇴실 시 비밀번호를 적어주세요. 변경하셨다면 새 번호로 적어주세요.</p>
            {pwErr && <ErrBox text="비밀번호를 입력해주세요. 비밀번호가 없으면 제출할 수 없어요 🔑"/>}
            <Inp value={pw} onChange={v=>{setPw(v);setPwErr(false);}} placeholder="예: 1234#" style={{borderColor:pwErr?C.danger:undefined}}/>
          </SCard>
        </div>
        <div ref={acctRef}>
          <SCard title="보증금 반환 계좌 💰">
            <Checkbox checked={noDeposit} onChange={e=>{setNoDeposit(e.target.checked);setAcctErr(false);}} label="보증금이 없어요"/>
            {!noDeposit && <>
              {acctErr && <ErrBox text="보증금 반환 계좌를 입력해주세요. 계좌 정보가 없으면 보증금을 돌려받기 어려울 수 있어요 💰"/>}
              <div style={{marginTop:10}}>
                <FieldLabel label="은행"/><Inp value={bank} onChange={v=>{setBank(v);setAcctErr(false);}} placeholder="예: 국민은행" style={{marginBottom:10}}/>
                <FieldLabel label="계좌번호"/><Inp value={acct} onChange={setAcct} placeholder="000-000-000000" style={{marginBottom:10}}/>
                <FieldLabel label="예금주"/><Inp value={acctName} onChange={setAcctName} placeholder="홍길동"/>
              </div>
            </>}
          </SCard>
        </div>
        <SCard title="퇴실 사진 📸">
          <p style={{fontSize:F.sm,color:C.gray600,marginBottom:12}}>입주할 때 이런 상태였어요. 같은 공간을 찍어주세요.</p>
          {spaces.map(sp=>(
            <div key={sp} style={{marginBottom:16}}>
              <p style={{fontSize:F.sm,fontWeight:600,marginBottom:6}}>{sp}{refPhotos[sp]&&<span style={{color:C.danger,fontSize:F.xs}}> *필수</span>}</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div>
                  <p style={{fontSize:F.xs,color:C.gray400,marginBottom:3}}>입주 전</p>
                  {refPhotos[sp] ? <img src={refPhotos[sp]} style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",borderRadius:R.md}}/>
                    : <div style={{aspectRatio:"3/4",background:C.gray100,borderRadius:R.md,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:F.sm,color:C.gray400}}>📭 없음</span></div>}
                </div>
                <div onClick={()=>fileRefs.current[sp]?.click()} style={{cursor:"pointer"}}>
                  <p style={{fontSize:F.xs,color:"#E74C3C",marginBottom:3}}>지금 상태 📷</p>
                  <input ref={el=>fileRefs.current[sp]=el} type="file" accept="image/*" style={{display:"none"}} onChange={e=>hPhoto(sp,e)}/>
                  {photos[sp] ? <img src={photos[sp]} style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",borderRadius:R.md,border:"2px solid #E74C3C"}}/>
                    : <div style={{aspectRatio:"3/4",background:"#FFF5F5",borderRadius:R.md,border:"2px dashed #E74C3C",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
                      <span style={{fontSize:24}}>📷</span>
                      <span style={{fontSize:F.xs,color:"#E74C3C",textAlign:"center",padding:"0 6px",lineHeight:1.4}}>터치해서 사진을 올려주세요</span>
                    </div>}
                </div>
              </div>
            </div>
          ))}
        </SCard>
        <SCard title="공과금 ⚡">
          <p style={{fontSize:F.sm,color:C.gray600,marginBottom:12}}>정산 영수증이나 이체 내역을 캡처해서 올려주세요.</p>
          {["전기","가스","수도"].map(k=>(
            <div key={k} style={{background:C.gray50,borderRadius:R.md,padding:"12px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:F.base,fontWeight:600}}>{k}</span>
                <Checkbox checked={!!utils[k]?.skip} onChange={()=>setUtils(s=>({...s,[k]:{skip:!s[k]?.skip,photo:null}}))} label="해당사항 없어요"/>
              </div>
              {!utils[k]?.skip && <>
                <input ref={el=>utilRefs.current[k]=el} type="file" accept="image/*" style={{display:"none"}} onChange={e=>hUtil(k,e)}/>
                {utils[k]?.photo ? (
                  <div style={{position:"relative"}}>
                    <img src={utils[k].photo} style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",borderRadius:R.md}}/>
                    <span style={{position:"absolute",top:6,right:6,background:C.success,color:C.white,borderRadius:R.full,fontSize:F.xs,padding:"3px 8px",fontWeight:600}}>✓</span>
                  </div>
                ) : <GhostBtn label="📷 사진 올리기" onClick={()=>utilRefs.current[k]?.click()}/>}
              </>}
            </div>
          ))}
        </SCard>
        <SCard title="여기도 봐주세요 📸">
          <p style={{fontSize:F.sm,color:C.gray600,marginBottom:12}}>추가로 남기고 싶은 부분이 있다면 사진을 올리고 메모를 남겨주세요.</p>
          <input ref={extraRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setExtras(s=>[...s,{src:ev.target.result,memo:""}]);r.readAsDataURL(f);}}/>
          {extras.map((item,i)=>(
            <div key={i} style={{background:C.gray50,borderRadius:R.md,padding:"10px",marginBottom:8,display:"flex",gap:10,alignItems:"flex-start"}}>
              <img src={item.src} style={{width:72,height:96,objectFit:"cover",borderRadius:R.sm,flexShrink:0}}/>
              <div style={{flex:1}}>
                <Inp value={item.memo} onChange={v=>setExtras(s=>s.map((x,j)=>j===i?{...x,memo:v}:x))} placeholder="이 사진에 메모 (선택)" style={{fontSize:F.sm,marginBottom:6}}/>
                <button onClick={()=>setExtras(s=>s.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.danger,fontSize:F.xs,cursor:"pointer",padding:0}}>삭제</button>
              </div>
            </div>
          ))}
          <Checkbox checked={noExtra} onChange={e=>{setNoExtra(e.target.checked);if(e.target.checked)setExtras([]);}} label="따로 남길 사진이 없어요"/>
          {!noExtra && <GhostBtn label="📷 사진 추가하기" onClick={()=>extraRef.current?.click()}/>}
        </SCard>
        <div style={{background:C.warningLight,border:`1px solid ${C.warning}40`,borderRadius:R.md,padding:"12px 14px",marginBottom:16,fontSize:F.sm,color:C.warningText}}>제출 후에는 수정할 수 없어요. 내용을 한 번 더 확인해주세요.</div>
      </div>
      <FixedBottom><PrimaryBtn label="제출하기" onClick={doSubmit}/></FixedBottom>
    </div>
  );
}

// ── CHANNEL ───────────────────────────────────────
function ChannelTab({items,isAdmin,onEdit,onAdd}) {
  const notices=items.filter(i=>i.type==="notice");
  const contents=items.filter(i=>i.type==="content");
  const faqs=items.filter(i=>i.type==="faq");
  return (
    <div style={{padding:"24px 16px"}}>
      <h2 style={{fontSize:F.xl,fontWeight:700,marginBottom:20}}>채널 📢</h2>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <SectionLabel label="공지사항" noMargin/>{isAdmin&&<AddBtn onClick={()=>onAdd("notice")}/>}
      </div>
      {notices.length===0&&<Empty emoji="📌" text="공지사항이 없어요" sub=""/>}
      {notices.map(n=>(
        <div key={n.id} style={{background:C.primaryLight,borderRadius:R.lg,padding:"14px 16px",marginBottom:8,border:`1px solid ${C.primary}30`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <p style={{fontSize:F.base,fontWeight:600,color:C.primaryText,marginBottom:4}}>📌 {n.title}</p>
              <p style={{fontSize:F.sm,color:C.primaryText,lineHeight:1.6}}>{n.body}</p>
              <p style={{fontSize:F.xs,color:C.primary,marginTop:4}}>{n.date}</p>
            </div>
            {isAdmin&&<button onClick={()=>onEdit(n)} style={{background:"none",border:"none",fontSize:F.sm,color:C.primary,cursor:"pointer",padding:"0 0 0 8px"}}>수정</button>}
          </div>
        </div>
      ))}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"20px 0 10px"}}>
        <SectionLabel label="임대인클래스 콘텐츠" noMargin/>{isAdmin&&<AddBtn onClick={()=>onAdd("content")}/>}
      </div>
      {contents.length===0&&<Empty emoji="📝" text="콘텐츠가 없어요" sub=""/>}
      {contents.map(c=>(
        <div key={c.id} style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:R.lg,padding:"14px 16px",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1,cursor:c.url?"pointer":"default"}} onClick={()=>c.url&&window.open(c.url,"_blank")}>
              <p style={{fontSize:F.base,fontWeight:600,marginBottom:4}}>{c.title}</p>
              <p style={{fontSize:F.sm,color:C.gray600,lineHeight:1.6,marginBottom:4}}>{c.body}</p>
              {c.url&&<p style={{fontSize:F.sm,color:C.primary,fontWeight:600}}>읽으러 가기 →</p>}
              <p style={{fontSize:F.xs,color:C.gray400}}>{c.date}</p>
            </div>
            {isAdmin&&<button onClick={()=>onEdit(c)} style={{background:"none",border:"none",fontSize:F.sm,color:C.gray400,cursor:"pointer",padding:"0 0 0 8px",flexShrink:0}}>수정</button>}
          </div>
        </div>
      ))}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"20px 0 10px"}}>
        <SectionLabel label="자주 묻는 질문" noMargin/>{isAdmin&&<AddBtn onClick={()=>onAdd("faq")}/>}
      </div>
      {faqs.length===0&&<Empty emoji="❓" text="FAQ가 없어요" sub=""/>}
      {faqs.map(f=><FaqItem key={f.id} item={f} isAdmin={isAdmin} onEdit={()=>onEdit(f)}/>)}
    </div>
  );
}

function FaqItem({item,isAdmin,onEdit}) {
  const [open,setOpen]=useState(false);
  return (
    <div style={{borderBottom:`1px solid ${C.gray200}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 4px",cursor:"pointer"}} onClick={()=>setOpen(s=>!s)}>
        <span style={{fontSize:F.base,fontWeight:500,flex:1}}>Q. {item.title}</span>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {isAdmin&&<button onClick={e=>{e.stopPropagation();onEdit();}} style={{background:"none",fontSize:F.xs,color:C.gray400,padding:"2px 8px",border:`1px solid ${C.gray200}`,borderRadius:R.full,cursor:"pointer"}}>수정</button>}
          <span style={{color:open?C.primary:C.gray400,fontSize:18,display:"inline-block",transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>∨</span>
        </div>
      </div>
      {open&&<div style={{padding:"4px 4px 16px",fontSize:F.sm,color:C.gray600,lineHeight:1.8}}>{item.body}</div>}
    </div>
  );
}

function ChannelEditPage({item,onSave,onDelete,onBack}) {
  const [title,setTitle]=useState(item?.title||"");
  const [body,setBody]=useState(item?.body||"");
  const [url,setUrl]=useState(item?.url||"");
  const typeLabel={notice:"공지사항",content:"콘텐츠",faq:"FAQ"};
  return (
    <Page>
      <NavBar title={`${typeLabel[item?.type]||""} ${item?.id?"수정":"작성"}`} onBack={onBack}/>
      <div style={{padding:"16px 16px 100px"}}>
        <SCard title="내용 작성">
          <FieldLabel label="제목"/><Inp value={title} onChange={setTitle} placeholder="제목을 입력해주세요" style={{marginBottom:12}}/>
          <FieldLabel label="내용"/><Textarea value={body} onChange={setBody} placeholder="내용을 입력해주세요" minHeight={120}/>
          {item?.type==="content"&&<><FieldLabel label="링크 (선택)"/><Inp value={url} onChange={setUrl} placeholder="https://..."/></>}
        </SCard>
        {item?.id&&<button onClick={()=>{if(window.confirm("삭제할까요?"))onDelete(item.id);}} style={{width:"100%",padding:"12px",background:"none",border:`1px solid ${C.danger}`,borderRadius:R.lg,fontSize:F.base,color:C.danger,cursor:"pointer",marginTop:8}}>삭제하기</button>}
      </div>
      <FixedBottom><PrimaryBtn label="저장하기" onClick={()=>{if(!title||!body)return alert("제목과 내용을 입력해주세요.");onSave({...item,title,body,url,date:item?.date||new Date().toLocaleDateString("ko-KR")});}}/></FixedBottom>
    </Page>
  );
}

// ── SHARE ─────────────────────────────────────────
function ShareTab() {
  const [copied,setCopied]=useState(false);
  const shareUrl=window.location.origin;
  const shareText="방 상태 기록부터 보증금 정산까지! 임대인의 든든한 파트너 '입퇴실 도우미'를 추천해요 😊";
  const targets=[{emoji:"🏠",text:"단기임대 운영 중인 분"},{emoji:"🏢",text:"고시원·다가구 관리하시는 분"},{emoji:"⚖️",text:"퇴실 분쟁이 걱정되는 분"},{emoji:"📱",text:"임차인과 연락이 번거로운 분"}];
  function doKakao(){
    if(navigator.share){navigator.share({title:"입퇴실 도우미",text:shareText,url:shareUrl}).catch(()=>{});}
    else{alert("카카오톡 앱을 실행해서 직접 공유해주세요 😊\n\n"+shareUrl);}
  }
  function doCopy(){
    navigator.clipboard?.writeText(shareUrl).catch(()=>{});
    setCopied(true);setTimeout(()=>setCopied(false),2000);
  }
  return (
    <div style={{padding:"24px 16px"}}>
      <h2 style={{fontSize:F.xl,fontWeight:700,marginBottom:8}}>주변에 알려주세요 👥</h2>
      <p style={{fontSize:F.base,color:C.gray600,marginBottom:28,lineHeight:1.6}}>입퇴실 도우미가 도움이 됐다면<br/>주변 임대인 분들께 알려주세요 😊</p>
      <button onClick={doKakao} style={{display:"block",width:"100%",padding:"15px",background:"#FEE500",borderRadius:R.lg,fontSize:F.base,fontWeight:700,color:"#3C1E1E",marginBottom:12,border:"none",cursor:"pointer"}}>카카오톡으로 공유하기</button>
      <div style={{width:"100%",marginBottom:28}}>
        <button onClick={doCopy} style={{display:"block",width:"100%",padding:"15px",background:C.white,border:`2px solid ${copied?C.success:C.gray200}`,borderRadius:R.lg,fontSize:F.base,fontWeight:600,color:copied?C.success:C.gray800,cursor:"pointer",transition:"color 0.2s,border-color 0.2s"}}>
          {copied ? "✅ 링크가 복사됐어요!" : "🔗 링크 복사하기"}
        </button>
      </div>
      <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:R.lg,padding:"20px"}}>
        <p style={{fontSize:F.base,fontWeight:700,color:C.gray800,marginBottom:14}}>이런 분들에게 추천해주세요!</p>
        {targets.map((t,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<targets.length-1?`1px solid ${C.gray100}`:"none"}}>
            <span style={{fontSize:24,flexShrink:0}}>{t.emoji}</span>
            <span style={{fontSize:F.base,color:C.gray800,flex:1}}>{t.text}</span>
            <span style={{color:C.success,fontSize:18}}>✅</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────
function SettingsTab({user,contactEmail,onLogout,onUpdateEmail}) {
  const [notifs,setNotifs]=useState({expire:true,checkout:true,checkin:true});
  const [email,setEmail]=useState(contactEmail||"");
  const [editEmail,setEditEmail]=useState(false);
  return (
    <div style={{padding:"24px 16px"}}>
      <h2 style={{fontSize:F.xl,fontWeight:700,marginBottom:20}}>설정 ⚙️</h2>
      <SCard title="내 정보">
        <DataRow label="이름" value={user.name}/>
        <DataRow label="이메일" value={user.email}/>
        <DataRow label="가입 방법" value={user.loginMethod||"이메일"}/>
      </SCard>
      <SCard title="알림 설정">
        <p style={{fontSize:F.sm,color:C.gray600,marginBottom:12}}>카카오 알림톡으로 알려드려요 (추후 지원 예정)</p>
        {[["expire","계약 만료 알림","계약 종료일이 가까워지면 알려드려요"],["checkout","퇴실 사진 알림","손님이 퇴실 사진을 올리면 알려드려요"],["checkin","입실 확인 알림","손님이 입실 확인을 완료하면 알려드려요"]].map(([k,l,sub])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.gray100}`}}>
            <div><p style={{fontSize:F.base,fontWeight:500}}>{l}</p><p style={{fontSize:F.xs,color:C.gray400,marginTop:2}}>{sub}</p></div>
            <Toggle on={notifs[k]} onChange={()=>setNotifs(s=>({...s,[k]:!s[k]}))}/>
          </div>
        ))}
      </SCard>
      <SCard title="문의하기">
        <p style={{fontSize:F.sm,color:C.gray600,marginBottom:10}}>궁금한 점이 있으면 이메일로 연락해주세요</p>
        {editEmail ? (
          <div style={{display:"flex",gap:8}}>
            <Inp value={email} onChange={setEmail} placeholder="help@ipteosil.com" style={{flex:1}}/>
            <button onClick={()=>{onUpdateEmail(email);setEditEmail(false);}} style={{padding:"0 16px",background:C.primary,color:C.white,borderRadius:R.md,fontSize:F.sm,fontWeight:600,border:"none",cursor:"pointer"}}>저장</button>
          </div>
        ) : (
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <p style={{fontSize:F.base,color:C.primary,fontWeight:600}}>{contactEmail||"(미설정)"}</p>
            <button onClick={()=>setEditEmail(true)} style={{background:"none",border:"none",fontSize:F.sm,color:C.gray400,cursor:"pointer"}}>수정</button>
          </div>
        )}
      </SCard>
      <button onClick={onLogout} style={{width:"100%",padding:"14px",background:"none",border:`1.5px solid ${C.gray200}`,borderRadius:R.lg,fontSize:F.base,fontWeight:600,color:C.gray600,marginBottom:10,cursor:"pointer"}}>로그아웃</button>
      <button onClick={()=>{if(window.confirm("정말 탈퇴하시겠어요?\n\n탈퇴하면 등록하신 방 정보, 사진, 계약 기록이 모두 삭제돼요.\n삭제된 데이터는 30일 후 완전히 사라지며 복구할 수 없어요.\n그래도 탈퇴하시겠어요?"))alert("탈퇴 처리됐어요.");}} style={{width:"100%",padding:"14px",background:"none",border:"none",fontSize:F.sm,color:C.gray400,cursor:"pointer"}}>회원 탈퇴</button>
    </div>
  );
}

// ── ADMIN ─────────────────────────────────────────
function AdminTab({db,onUserClick,onToggleReviewFeatured}) {
  const users=(db.users||[]).filter(u=>!u.isAdmin);
  const logs=db.logs||[]; const props=db.properties||[]; const contracts=db.contracts||[];
  const withProp=users.filter(u=>props.find(p=>p.ownerId===u.id));
  const withLink=users.filter(u=>{const up=props.filter(p=>p.ownerId===u.id);return contracts.find(c=>up.find(p=>p.id===c.propertyId));});
  const withSubmit=users.filter(u=>{const up=props.filter(p=>p.ownerId===u.id);return contracts.find(c=>up.find(p=>p.id===c.propertyId)&&(c.checkinSubmitted||c.checkoutSubmitted));});
  const [showLandingPreview,setShowLandingPreview]=useState(false);
  const featuredReviews=(db.reviews||[]).filter(r=>r.featured);
  const ended=contracts.filter(c=>c.status==="ended");
  const funnel=[{l:"가입",n:users.length},{l:"매물 등록",n:withProp.length},{l:"링크 발급",n:withLink.length},{l:"제출 완료",n:withSubmit.length},{l:"계약 종료",n:ended.length}];
  const maxN=funnel[0].n||1;
  return (
    <div style={{padding:"24px 16px"}}>
      <h2 style={{fontSize:F.xl,fontWeight:700,marginBottom:20}}>관리자 페이지 🔧</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {[["전체 회원",users.length,"👤"],["등록 매물",props.length,"🏠"],["발급 링크",contracts.length,"🔗"],["계약 종료",ended.length,"✅"]].map(([l,v,e])=>(
          <div key={l} style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:R.lg,padding:"16px",textAlign:"center"}}>
            <p style={{fontSize:28,marginBottom:4}}>{e}</p>
            <p style={{fontSize:F.xxl,fontWeight:700,color:C.primary,marginBottom:4}}>{v}</p>
            <p style={{fontSize:F.sm,color:C.gray600}}>{l}</p>
          </div>
        ))}
      </div>
      <SCard title="유저 퍼널">
        {funnel.map((f,i)=>(
          <div key={i} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:F.sm,fontWeight:500}}>{f.l}</span>
              <span style={{fontSize:F.sm,color:C.gray600}}>{f.n}명 ({maxN?Math.round(f.n/maxN*100):0}%)</span>
            </div>
            <div style={{height:8,background:C.gray100,borderRadius:R.full}}>
              <div style={{height:"100%",width:`${maxN?f.n/maxN*100:0}%`,background:C.primary,borderRadius:R.full}}/>
            </div>
          </div>
        ))}
      </SCard>
      <SCard title="최근 활동">
        {logs.length===0 ? <Empty emoji="📋" text="아직 활동 기록이 없어요" sub=""/> :
        logs.slice(0,20).map((l,i)=>{
          const u=db.users?.find(u=>u.id===l.userId);
          return (
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<19?`1px solid ${C.gray100}`:"none"}}>
              <div style={{flex:1}}><span style={{fontSize:F.sm,fontWeight:500}}>{u?.name||"알 수 없음"}</span><span style={{fontSize:F.sm,color:C.gray600}}> · {l.action}</span></div>
              <span style={{fontSize:F.xs,color:C.gray400,flexShrink:0,marginLeft:8}}>{timeAgo(l.time)}</span>
            </div>
          );
        })}
      </SCard>
      <SCard title="회원 목록">
        {users.length===0 ? <Empty emoji="👤" text="가입한 회원이 없어요" sub=""/> :
        users.map(u=>{
          const ul=logs.filter(l=>l.userId===u.id); const last=ul[0];
          const uProps=props.filter(p=>p.ownerId===u.id);
          return (
            <div key={u.id} onClick={()=>onUserClick(u)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.gray100}`,cursor:"pointer"}}>
              <div><p style={{fontSize:F.base,fontWeight:500,marginBottom:2}}>{u.name}</p><p style={{fontSize:F.sm,color:C.gray400}}>{u.email} · 매물 {uProps.length}개</p></div>
              <div style={{textAlign:"right"}}><p style={{fontSize:F.xs,color:C.gray400,marginBottom:2}}>{last?timeAgo(last.time):"미접속"}</p><span style={{color:C.gray400,fontSize:18}}>›</span></div>
            </div>
          );
        })}
      </SCard>
      {showLandingPreview && (
        <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",flexDirection:"column"}}>
          <div style={{background:"rgba(0,0,0,0.7)",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <span style={{color:"#fff",fontWeight:700,fontSize:F.sm}}>랜딩 페이지 미리보기</span>
            <button onClick={()=>setShowLandingPreview(false)} style={{background:"none",border:"none",color:"#fff",fontSize:22,cursor:"pointer",lineHeight:1}}>✕</button>
          </div>
          <div style={{flex:1,overflowY:"auto",maxWidth:480,width:"100%",margin:"0 auto",background:C.white}}>
            <LandingPage reviews={featuredReviews} onStart={()=>setShowLandingPreview(false)}/>
          </div>
        </div>
      )}
      <SCard title="후기 관리">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <p style={{fontSize:F.xs,color:C.gray400}}>랜딩 노출 ON 으로 설정한 후기가 공유 링크 첫 화면에 표시돼요</p>
          <button onClick={()=>setShowLandingPreview(true)} style={{flexShrink:0,marginLeft:10,padding:"5px 10px",background:C.primaryLight,border:"none",borderRadius:R.md,fontSize:F.xs,fontWeight:600,color:C.primary,cursor:"pointer"}}>미리보기</button>
        </div>
        {(db.reviews||[]).length===0 ? <Empty emoji="⭐" text="아직 후기가 없어요" sub=""/> :
        (db.reviews||[]).map((r,i)=>(
          <div key={r.id||i} style={{padding:"12px 0",borderBottom:i<(db.reviews||[]).length-1?`1px solid ${C.gray100}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div>
                <span style={{fontSize:F.base,fontWeight:600}}>{r.userName}</span>
                <span style={{fontSize:14,marginLeft:6}}>{"⭐".repeat(r.stars)}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                <span style={{fontSize:F.xs,color:r.featured?C.success:C.gray400,fontWeight:r.featured?700:400}}>{r.featured?"랜딩 노출":"미노출"}</span>
                <Toggle on={!!r.featured} onChange={()=>onToggleReviewFeatured?.(r.id)}/>
              </div>
            </div>
            {r.text&&<p style={{fontSize:F.sm,color:C.gray600,lineHeight:1.5}}>{r.text}</p>}
            <p style={{fontSize:F.xs,color:C.gray400,marginTop:3}}>{timeAgo(r.time)}</p>
          </div>
        ))}
      </SCard>
    </div>
  );
}

function AdminUserPage({u,logs,onBack}) {
  return (
    <Page>
      <NavBar title="회원 상세" onBack={onBack}/>
      <div style={{padding:"16px 16px 32px"}}>
        <SCard title="기본 정보">
          <DataRow label="이름" value={u.name}/>
          <DataRow label="이메일" value={u.email}/>
          <DataRow label="가입일" value={u.joinedAt?.slice(0,10)||"-"}/>
          <DataRow label="가입 방법" value={u.loginMethod||"이메일"}/>
        </SCard>
        <SCard title="활동 로그">
          {logs.length===0 ? <Empty emoji="📋" text="활동 기록이 없어요" sub=""/> :
          logs.map((l,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<logs.length-1?`1px solid ${C.gray100}`:"none",fontSize:F.sm}}>
              <span style={{color:C.gray800}}>{l.action}</span>
              <div style={{textAlign:"right"}}>
                <p style={{margin:0,color:C.gray400,fontSize:F.xs}}>{timeAgo(l.time)}</p>
                <p style={{margin:0,color:C.gray400,fontSize:F.xs}}>{l.time?.slice(0,16)}</p>
              </div>
            </div>
          ))}
        </SCard>
      </div>
    </Page>
  );
}

// ── LINK PAGES ────────────────────────────────────
function LinkPage({icon,title,sub,onBack}) {
  return (
    <div style={{minHeight:"100vh",background:C.white,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <span style={{fontSize:56,marginBottom:16}}>{icon}</span>
      <h2 style={{fontSize:F.xl,fontWeight:700,marginBottom:8,color:C.gray900}}>{title}</h2>
      <p style={{fontSize:F.base,color:C.gray600,lineHeight:1.7}}>{sub}</p>
      {onBack&&<button onClick={onBack} style={{marginTop:24,padding:"12px 28px",background:"none",border:`1.5px solid ${C.gray200}`,borderRadius:R.full,fontSize:F.base,color:C.gray600,cursor:"pointer"}}>뒤로</button>}
    </div>
  );
}

function LinkDone({type,onBack}) {
  return (
    <div style={{minHeight:"100vh",background:C.white,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <span style={{fontSize:56,marginBottom:16}}>{type==="checkin"?"✅":"🙏"}</span>
      <h2 style={{fontSize:F.xl,fontWeight:700,marginBottom:12,color:C.gray900}}>{type==="checkin"?"입실 확인 완료!":"퇴실 제출 완료!"}</h2>
      <p style={{fontSize:F.base,color:C.gray600,lineHeight:1.8,whiteSpace:"pre-line"}}>
        {type==="checkin"?"방 상태가 잘 기록됐어요.\n편안한 입주 되세요 😊":"퇴실 내용이 임대인에게 잘 전달됐어요.\n보증금 정산은 임대인이 확인 후 진행돼요.\n수고하셨어요!"}
      </p>
      <button onClick={onBack} style={{marginTop:20,padding:"14px 40px",background:C.primary,color:C.white,borderRadius:R.full,fontSize:F.base,fontWeight:700,border:"none",cursor:"pointer"}}>확인</button>
    </div>
  );
}