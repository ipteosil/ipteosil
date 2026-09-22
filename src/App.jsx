import { useState, useRef, useCallback, useEffect } from "react";

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
const whenStr = (iso) => {
  if(!iso) return "";
  const d=new Date(iso); if(isNaN(d)) return "";
  const t=d.toLocaleTimeString("ko-KR",{hour:"numeric",minute:"2-digit",hour12:true});
  const days=Math.round((new Date().setHours(0,0,0,0)-new Date(d).setHours(0,0,0,0))/86400000);
  if(days<=0) return `오늘 ${t}`;
  if(days===1) return `어제 ${t}`;
  return `${d.getMonth()+1}월 ${d.getDate()}일 ${t}`;
};
const blankProperty = (id, ownerId, name) => ({
  id, ownerId, name, address:"", dong:"", ho:"", noPw:false, password:"",
  spaces:[...SPACES], refPhotos:{},
});
const blankContract = (propertyId) => ({
  id:genId(), propertyId, status:"active",
  checkinToken:genToken(), checkoutToken:genToken(), createdAt:nowStr(),
  deposit:"", monthly:"", startDate:"", endDate:"", tenantName:"", tenantPhone:"",
  checkinSubmitted:false, checkoutSubmitted:false,
  checkinSentAt:null, checkoutSentAt:null,
});
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
const fillAddr = (msg, prop) => {
  const label=[prop.address,prop.dong,prop.ho].filter(Boolean).join(" ");
  return msg.replace("[주소] ", label?`${label} `:"");
};

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
  const [exitToast, setExitToast] = useState(false);
  const [confirmDlg, setConfirmDlg] = useState(null);

  const stackRef = useRef([]);
  const exitRequestedRef = useRef(false);
  const exitTimerRef = useRef(null);
  useEffect(() => { stackRef.current = stack; }, [stack]);

  const push = useCallback((v,ctx={}) => {
    history.pushState(null, '');
    setStack(s=>[...s,{v,ctx}]);
  }, []);
  const pop = useCallback(() => history.back(), []);
  const cur = stack[stack.length-1];

  useEffect(() => {
    // 앱 진입 시 센티널 하나 푸시 — 이게 없으면 첫 뒤로가기가 바로 앱 밖으로 나감
    history.pushState(null, '');

    const onPop = () => {
      // 항상 즉시 재푸시 → 앱이 의도치 않게 닫히는 걸 막음
      history.pushState(null, '');

      if (stackRef.current.length > 0) {
        // 서브 화면이 있으면 한 단계 뒤로
        setStack(s => s.length > 0 ? s.slice(0,-1) : s);
        exitRequestedRef.current = false;
      } else {
        // 루트 화면(홈/랜딩/로그인)에서 뒤로가기
        if (exitRequestedRef.current) {
          // 2초 안에 두 번째 누름 → 종료
          clearTimeout(exitTimerRef.current);
          setExitToast(false);
          exitRequestedRef.current = false;
          window.close(); // 카카오 인앱브라우저 등에서 WebView 닫힘
        } else {
          // 첫 번째 누름 → 토스트 표시
          exitRequestedRef.current = true;
          setExitToast(true);
          exitTimerRef.current = setTimeout(() => {
            exitRequestedRef.current = false;
            setExitToast(false);
          }, 2000);
        }
      }
    };

    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      clearTimeout(exitTimerRef.current);
    };
  }, []);

  const askConfirm = (message,onOk,opts={}) => setConfirmDlg({message,onOk,...opts});
  const confirmModal = confirmDlg && <ConfirmModal {...confirmDlg} onClose={()=>setConfirmDlg(null)}/>;

  // ── PWA 설치 (홈 화면에 추가) ──
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;
    const dismissed = localStorage.getItem("pwaBannerDismissed") === "1";
    const onBip = (e) => { e.preventDefault(); setDeferredInstallPrompt(e); if(!dismissed) setShowInstallBanner(true); };
    window.addEventListener("beforeinstallprompt", onBip);
    if (isIOS && !dismissed) setShowInstallBanner(true);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismissInstallBanner = () => { setShowInstallBanner(false); localStorage.setItem("pwaBannerDismissed","1"); };
  const handleInstallClick = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      setDeferredInstallPrompt(null);
      setShowInstallBanner(false);
    } else if (isIOS) {
      setShowIosGuide(true);
    }
  };

  const ensureFirstRoom = (uid) => updateDb(s=>{
    if(s.properties.some(p=>p.ownerId===uid)) return s;
    const id=genId();
    return {...s,properties:[...s.properties,blankProperty(id,uid,"방 1")],contracts:[...s.contracts,blankContract(id)]};
  });

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
        updateDb(s=>({...s,contracts:s.contracts.map(c=>{
          if(c.id!==co.id) return c;
          const p=s.properties.find(x=>x.id===c.propertyId);
          return {...c,checkinSubmitted:true,checkinData:{...d,time:nowStr(),at:new Date().toISOString()},baseline:{spaces:[...(p?.spaces||[])],refPhotos:{...(p?.refPhotos||{})}}};
        })}));
        setLinkToken(null); setLinkDone("checkin");
      }}/>;
    } else {
      if(co.checkoutSubmitted) return <LinkPage icon="✅" title="이미 제출됐어요" sub="퇴실 확인은 한 번만 가능해요." onBack={()=>setLinkToken(null)}/>;
      return <CheckoutForm co={co} prop={prop} onSubmit={d=>{
        updateDb(s=>({...s,contracts:s.contracts.map(c=>c.id===co.id?{...c,checkoutSubmitted:true,checkoutData:{...d,time:nowStr(),at:new Date().toISOString()},status:"submitted"}:c)}));
        setLinkToken(null); setLinkDone("checkout");
      }}/>;
    }
  }
  if(linkDone) return <LinkDone type={linkDone} onBack={()=>setLinkDone(null)}/>;
  if(!user && showLanding) return <LandingPage reviews={(db.reviews||[]).filter(r=>r.featured)} onStart={()=>setShowLanding(false)}/>;
  if(!user) return <AuthPage users={db.users}
    onLogin={u=>{setUser(u);ensureFirstRoom(u.id);log(u.id,"login");}}
    onRegister={u=>{const nu={...u,id:genId(),isAdmin:false,joinedAt:nowStr()};upDb({users:[...db.users,nu]});setUser(nu);ensureFirstRoom(nu.id);log(nu.id,"register");}}
  />;

  const myProps = db.properties.filter(p=>p.ownerId===user.id);

  // ── sub-views ──
  if(cur?.v==="addProp") return (
    <AddPropPage prop={cur.ctx.prop}
      onSave={p=>{
        updateDb(s=>({...s,properties:s.properties.map(x=>x.id===cur.ctx.prop.id?{...x,...p}:x)}));
        pop();
      }} onBack={pop}/>
  );

  if(cur?.v==="pastReports") {
    const prop=db.properties.find(p=>p.id===cur.ctx.propId);
    const past=db.contracts.filter(c=>c.propertyId===cur.ctx.propId&&c.status==="ended").reverse();
    return <PastReportsPage prop={prop} past={past} onViewRecord={id=>push("record",{coId:id})}
      onDelete={id=>updateDb(s=>({...s,contracts:s.contracts.filter(c=>c.id!==id)}))} onBack={pop}/>;
  }

  if(cur?.v==="contractMemo") {
    const co=db.contracts.find(c=>c.id===cur.ctx.coId);
    return <ContractMemoPage co={co}
      onSave={patch=>{updateDb(s=>({...s,contracts:s.contracts.map(c=>c.id===co.id?{...c,...patch}:c)}));pop();}}
      onBack={pop}/>;
  }

  if(cur?.v==="checkinSetup") {
    const prop=db.properties.find(p=>p.id===cur.ctx.propId);
    const co=db.contracts.find(c=>c.id===cur.ctx.coId);
    return <CheckinSetupPage prop={prop} co={co}
      onSaveProp={patch=>updateDb(s=>({...s,properties:s.properties.map(p=>p.id===prop.id?{...p,...patch}:p)}))}
      onSimCheckin={t=>setLinkToken(t)}
      onMarkSent={()=>updateDb(s=>({...s,contracts:s.contracts.map(c=>c.id===co.id?{...c,checkinSentAt:new Date().toISOString()}:c)}))}
      onBack={pop}/>;
  }

  if(cur?.v==="checkoutSetup") {
    const prop=db.properties.find(p=>p.id===cur.ctx.propId);
    const co=db.contracts.find(c=>c.id===cur.ctx.coId);
    return <CheckoutSetupPage prop={prop} co={co}
      onSaveProp={patch=>updateDb(s=>({...s,properties:s.properties.map(p=>p.id===prop.id?{...p,...patch}:p)}))}
      onSimCheckout={t=>setLinkToken(t)}
      onMarkSent={()=>updateDb(s=>({...s,contracts:s.contracts.map(c=>c.id===co.id?{...c,checkoutSentAt:new Date().toISOString()}:c)}))}
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
        onEndContract={co?.status!=="ended" ? () => askConfirm("계약을 마무리할까요? 이 기록은 지난 계약으로 저장돼요.",()=>{
          updateDb(s=>({...s,contracts:[...s.contracts.map(c=>c.id===co.id?{...c,status:"ended",endedAt:nowStr()}:c),blankContract(co.propertyId)]}));
          const hasReviewed=(db.reviews||[]).some(r=>r.userId===user.id);
          if(hasReviewed) pop(); else setShowReviewPopup(true);
        },{okLabel:"마무리하기"}) : null}
        onBack={pop}/>
      {confirmModal}
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
        {tab==="home" && <HomeTab user={user} props={myProps} contracts={db.contracts}
          onRenameProp={(id,name)=>updateDb(s=>({...s,properties:s.properties.map(p=>p.id===id?{...p,name}:p)}))}
          onReorderProps={ids=>updateDb(s=>{
            const byId=Object.fromEntries(s.properties.map(p=>[p.id,p]));
            let i=0;
            return {...s,properties:s.properties.map(p=>p.ownerId===user.id?byId[ids[i++]]:p)};
          })}
          onEditProp={prop=>push("addProp",{prop})}
          onStartNewTenant={prop=>askConfirm("새 입주자를 시작할까요? 현재 계약 기록은 지난 계약으로 이동하고, 새 입주/퇴실 링크가 발급돼요.",()=>{
            updateDb(s=>({...s,contracts:[...s.contracts.map(c=>c.propertyId===prop.id&&c.status!=="ended"?{...c,status:"ended",endedAt:nowStr()}:c),blankContract(prop.id)]}));
          },{okLabel:"새 입주자 시작"})}
          onDeleteProp={prop=>askConfirm("삭제하면 이 방의 모든 기록이 사라져요. 그래도 삭제할까요?",()=>{
            updateDb(s=>({...s,properties:s.properties.filter(p=>p.id!==prop.id),contracts:s.contracts.filter(c=>c.propertyId!==prop.id)}));
          },{okLabel:"삭제",danger:true})}
          onOpenMemo={coId=>push("contractMemo",{coId})}
          onOpenCheckin={(propId,coId)=>push("checkinSetup",{propId,coId})}
          onOpenCheckout={(propId,coId)=>push("checkoutSetup",{propId,coId})}
          onViewRecord={coId=>push("record",{coId})}
          onOpenPast={propId=>push("pastReports",{propId})}
          onAddProp={()=>{
            const id=genId();
            updateDb(s=>({...s,properties:[...s.properties,blankProperty(id,user.id,`방 ${myProps.length+1}`)],contracts:[...s.contracts,blankContract(id)]}));
          }}
          showInstallBanner={showInstallBanner}
          onInstallClick={handleInstallClick}
          onDismissInstallBanner={dismissInstallBanner}/>}
        {tab==="channel" && <ChannelTab items={db.channels} isAdmin={user.isAdmin} onEdit={item=>push("channelEdit",{item})} onAdd={type=>push("channelEdit",{item:{type,title:"",body:"",url:"",date:new Date().toLocaleDateString("ko-KR")}})}/>}
        {tab==="share" && <ShareTab/>}
        {tab==="settings" && <SettingsTab user={user} contactEmail={db.contactEmail} onLogout={()=>{setUser(null);setStack([]);setTab("home");setShowLanding(false);}} onUpdateEmail={e=>upDb({contactEmail:e})}
          canInstallPwa={!isStandalone} onInstallClick={handleInstallClick}/>}
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
      {exitToast && (
        <div style={{position:"fixed",bottom:76,left:"50%",transform:"translateX(-50%)",
          background:"rgba(0,0,0,0.75)",color:"#fff",borderRadius:R.full,
          padding:"10px 22px",fontSize:F.sm,fontWeight:600,
          whiteSpace:"nowrap",zIndex:200,pointerEvents:"none"}}>
          한 번 더 누르면 앱이 종료돼요
        </div>
      )}
      {confirmModal}
      {showIosGuide && <IosInstallModal onClose={()=>setShowIosGuide(false)}/>}
    </div>
  );
}

// ── CONFIRM MODAL (브라우저 기본 팝업 대신) ─────────────
function ConfirmModal({message,okLabel="확인",danger,okOnly,onOk,onClose}) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:R.lg,padding:"24px 20px 16px",maxWidth:340,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <p style={{fontSize:F.base,color:C.gray900,lineHeight:1.6,marginBottom:20,textAlign:"center",whiteSpace:"pre-line"}}>{message}</p>
        <div style={{display:"flex",gap:8}}>
          {!okOnly && <button onClick={onClose} style={{flex:1,padding:"13px",background:C.gray100,borderRadius:R.md,fontSize:F.base,fontWeight:600,color:C.gray600,border:"none",cursor:"pointer"}}>취소</button>}
          <button onClick={()=>{onClose();onOk?.();}} style={{flex:1,padding:"13px",background:danger?C.danger:C.primary,borderRadius:R.md,fontSize:F.base,fontWeight:700,color:C.white,border:"none",cursor:"pointer"}}>{okLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── PWA 설치 안내 (iOS) ────────────────────────────
// 사파리 실제 공유 버튼 아이콘 (SF Symbol "square.and.arrow.up") — 이모지로는 실물과 달라 직접 그림
const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"-4px",margin:"0 2px"}}>
    <path d="M5 10 V18.5 A2 2 0 0 0 7 20.5 H17 A2 2 0 0 0 19 18.5 V10"/>
    <line x1="12" y1="3.5" x2="12" y2="14.5"/>
    <path d="M8.2 7 L12 3.2 L15.8 7"/>
  </svg>
);

function IosInstallModal({onClose}) {
  const steps = [
    ["1", <>화면 아래 공유 버튼(<ShareIcon/>)을 눌러주세요</>],
    ["2", '"홈 화면에 추가"를 찾아 눌러주세요'],
    ["3", '오른쪽 위 "추가"를 누르면 끝!\n다음부턴 홈 화면 아이콘으로 바로 열려요'],
  ];
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:R.lg,padding:"24px 20px 16px",maxWidth:340,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <p style={{fontSize:32,textAlign:"center",marginBottom:8}}>📲</p>
        <p style={{fontSize:F.lg,fontWeight:700,color:C.gray900,textAlign:"center",marginBottom:20}}>아이폰에 설치하기</p>
        {steps.map(([n,text])=>(
          <div key={n} style={{display:"flex",gap:12,marginBottom:16}}>
            <div style={{width:24,height:24,borderRadius:R.full,background:C.primaryLight,color:C.primaryText,fontSize:F.sm,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{n}</div>
            <p style={{fontSize:F.base,color:C.gray800,lineHeight:1.6,whiteSpace:"pre-line"}}>{text}</p>
          </div>
        ))}
        <PrimaryBtn label="확인했어요" onClick={onClose} style={{marginTop:4}}/>
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
const lpImg = (name) => `/landing/${name}.jpg`;

function LpSection({title,sub,bg,children}) {
  return (
    <div style={{padding:"40px 20px",background:bg||C.white}}>
      {title && <h2 style={{fontSize:22,fontWeight:800,color:C.gray900,lineHeight:1.35,textAlign:"center",marginBottom:sub?10:22}}>{title}</h2>}
      {sub && <p style={{fontSize:F.sm,color:C.gray600,lineHeight:1.75,textAlign:"center",marginBottom:22}}>{sub}</p>}
      {children}
    </div>
  );
}

function LpPhoto({src,label,tone,ratio="4/3"}) {
  const col=tone==="bad"?C.danger:tone==="good"?C.success:C.gray600;
  return (
    <div style={{flex:1,minWidth:0}}>
      <div style={{aspectRatio:ratio,borderRadius:R.md,overflow:"hidden",background:C.gray100,border:tone?`2px solid ${col}`:"none"}}>
        <img src={src} alt={label} loading="lazy" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
      </div>
      {label && <p style={{fontSize:F.xs,fontWeight:700,color:col,marginTop:6,textAlign:"center",lineHeight:1.5}}>{label}</p>}
    </div>
  );
}

function LpReportCard() {
  return (
    <div style={{background:C.white,borderRadius:R.lg,padding:"14px",boxShadow:"0 12px 32px rgba(0,0,0,0.22)",textAlign:"left"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:F.sm,fontWeight:700,color:C.gray900}}>📋 최종 보고서</span>
        <span style={{fontSize:F.xs,fontWeight:600,background:C.primaryLight,color:C.primaryText,borderRadius:R.full,padding:"3px 10px"}}>📬 사진 도착</span>
      </div>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:F.xs,color:C.gray600,fontWeight:600,lineHeight:1.4,marginBottom:5}}>입주할 때 임대인이<br/>이렇게 찍으면</p>
          <img src={lpImg("loft-before")} alt="입주할 때 임대인이 찍은 사진" style={{width:"100%",aspectRatio:"4/3",objectFit:"cover",borderRadius:R.sm,display:"block"}}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:F.xs,color:C.primary,fontWeight:600,lineHeight:1.4,marginBottom:5}}>이사 갈 때 임차인이<br/>이렇게 찍어요</p>
          <img src={lpImg("loft-after")} alt="이사 갈 때 임차인이 찍은 사진" style={{width:"100%",aspectRatio:"4/3",objectFit:"cover",borderRadius:R.sm,display:"block"}}/>
        </div>
      </div>
    </div>
  );
}

function LpFaq({q,a}) {
  const [open,setOpen]=useState(false);
  return (
    <div style={{borderBottom:`1px solid ${C.gray200}`}}>
      <button onClick={()=>setOpen(o=>!o)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,width:"100%",padding:"16px 2px",background:"none",border:"none",textAlign:"left",cursor:"pointer"}}>
        <span style={{fontSize:F.base,fontWeight:600,color:C.gray900,lineHeight:1.5}}>{q}</span>
        <span style={{fontSize:18,color:C.gray400,flexShrink:0}}>{open?"−":"＋"}</span>
      </button>
      {open && <p style={{fontSize:F.sm,color:C.gray600,lineHeight:1.8,padding:"0 2px 16px",whiteSpace:"pre-line"}}>{a}</p>}
    </div>
  );
}

// 사용 방법 한 단계(입주할 때 / 퇴실할 때 / 최종 보고서)
function LpShot({img,cap}) {
  return (
    <div style={{maxWidth:320,margin:"4px auto 16px"}}>
      <img src={lpImg(img)} alt={cap} loading="lazy" style={{width:"100%",display:"block",borderRadius:R.md,border:`1px solid ${C.gray200}`,boxShadow:"0 6px 18px rgba(0,0,0,0.08)"}}/>
      {cap && <p style={{fontSize:F.xs,fontWeight:600,color:C.gray600,textAlign:"center",marginTop:8,lineHeight:1.5}}>{cap}</p>}
    </div>
  );
}
// steps: [{t, img?, cap?}] — 그림은 해당 단계 바로 아래에 붙음
function LpPhase({icon,title,color,steps}) {
  return (
    <div style={{background:C.white,borderRadius:R.lg,padding:"18px 16px 4px",marginBottom:12,border:`1px solid ${C.gray100}`}}>
      <span style={{display:"inline-block",fontSize:F.sm,fontWeight:800,color:C.white,background:color,borderRadius:R.full,padding:"5px 14px",marginBottom:12}}>{icon} {title}</span>
      {steps.map((s,i)=>(
        <div key={i}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:s.img?10:12}}>
            <span style={{width:22,height:22,borderRadius:"50%",background:C.gray100,color:C.gray800,fontSize:F.xs,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</span>
            <p style={{fontSize:F.base,color:C.gray800,lineHeight:1.6}}>{s.t}</p>
          </div>
          {s.img && <LpShot img={s.img} cap={s.cap}/>}
        </div>
      ))}
    </div>
  );
}

function LandingPage({reviews,onStart}) {
  const worries=[
    "임차인이 나갔는데 멀리 있어서 가볼 수가 없어요",
    "보증금은 돌려줘야 하는데, 청소는 해놓고 나갔는지 모르겠어요",
    "현관 비밀번호는 바꿨는지, 공과금은 정산했는지 알 수가 없어요",
  ];
  const perks=[
    {emoji:"👀",title:"멀리서도 확인해요",desc:"직접 가보지 않아도 퇴실 상태를 사진으로 봐요"},
    {emoji:"✅",title:"체크리스트 때문에 빠뜨리지 않아요",desc:"비밀번호, 공과금, 반환 계좌를 채워야 제출돼요"},
    {emoji:"📐",title:"내가 정한 양식대로 받아요",desc:"꼭 확인해야 하는 공간을 정할 수 있어요"},
    {emoji:"🔗",title:"링크 하나면 끝이에요",desc:"임차인은 앱을 깔 필요가 없어요"},
  ];
  const targets=["직장 다니면서 임대업 하시는 분","퇴실 때마다 방을 확인하러 다니는 게 부담스러운 분","단기임대·에어비앤비 운영하시는 분","고시원·다가구 관리하시는 분"];
  const faqs=[
    {q:"임차인이 사진을 안 찍으면요?",a:"필수 항목이 빠지면 제출이 안 돼요.\n💡 계약할 때 “퇴실 사진 제출 후 보증금을 정산해요”라고 미리 알려 주시면 더 확실해요."},
    {q:"앱에서 사진을 자동으로 비교해 주나요?",a:"아니요, 비교는 직접 하셔야 해요. 입주 전과 퇴실 후 사진을 나란히 보여 드리니, 먼저 사진으로 확인하고 자세한 건 임차인과 전화로 확인해 보세요."},
    {q:"사진이 법적 증거가 되나요?",a:"분쟁이 생겼을 때 근거 자료로 쓸 수 있어요. 법적 효력을 보장하지는 않아요."},
    {q:"보증금도 앱에서 보내 주나요?",a:"아니요. 반환 계좌를 받아서 보여 드려요. 송금은 직접 해야 해요."},
  ];
  const heroBg=`linear-gradient(135deg, ${C.primary} 0%, #5B8DFF 100%)`;
  return (
    <div style={{minHeight:"100vh",background:C.white,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",overflowY:"auto",wordBreak:"keep-all",overflowWrap:"break-word"}}>
      {/* 1. 첫 화면 */}
      <div style={{background:heroBg,padding:"36px 20px 40px",textAlign:"center"}}>
        <span style={{display:"inline-block",fontSize:F.xs,fontWeight:700,color:C.white,background:"rgba(255,255,255,0.18)",borderRadius:R.full,padding:"5px 12px",marginBottom:16}}>🏠 퇴실 확인, 이제 사진으로</span>
        <p style={{fontSize:F.base,color:"rgba(255,255,255,0.88)",lineHeight:1.6,marginBottom:8}}>이사 나갈 때마다<br/>직접 가서 확인하기 어렵죠?</p>
        <h1 style={{fontSize:30,fontWeight:800,color:C.white,lineHeight:1.35,marginBottom:22}}>이제 <span style={{color:"#FFE08A"}}>사진 비교</span>해 보고<br/>보증금 돌려주세요</h1>
        <LpReportCard/>
        <p style={{display:"inline-block",fontSize:F.xs,fontWeight:700,color:C.white,background:"rgba(255,255,255,0.18)",borderRadius:R.full,padding:"7px 14px",marginTop:14}}>📌 짐이 남아 있다는 걸 사진으로 알 수 있어요</p>
        <p style={{fontSize:F.sm,color:"rgba(255,255,255,0.92)",lineHeight:1.7,margin:"14px 0 22px"}}>임차인이 링크 하나로 사진을 보내면,<br/>입주 전과 나란히 비교되는 보고서가 도착해요.</p>
        <button onClick={onStart} style={{padding:"16px 40px",background:C.white,color:C.primary,borderRadius:R.full,fontSize:F.base,fontWeight:700,border:"none",cursor:"pointer",boxShadow:"0 4px 18px rgba(0,0,0,0.18)"}}>무료로 시작하기 →</button>
        <p style={{fontSize:F.xs,color:"rgba(255,255,255,0.7)",marginTop:10}}>앱 설치 없음 · 완전 무료</p>
      </div>

      {/* 2. 불안 */}
      <LpSection bg={C.gray50}>
        <p style={{fontSize:20,fontWeight:800,color:C.gray900,textAlign:"center",lineHeight:1.5,marginBottom:16}}>이미 보증금은 돌려줬는데,<br/>집에 가 보니 이런 상태라면?</p>
        <div style={{display:"flex",gap:10}}>
          <LpPhoto src={lpImg("worry")} label=""/>
          <LpPhoto src={lpImg("room-after")} label=""/>
        </div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.gray900,lineHeight:1.35,textAlign:"center",margin:"44px 0 22px"}}>이런 걱정, 해보셨죠?</h2>
        {worries.map(w=>(
          <div key={w} style={{display:"flex",alignItems:"flex-start",gap:10,background:C.white,borderRadius:R.md,padding:"13px 14px",marginBottom:8,border:`1px solid ${C.gray100}`}}>
            <span style={{fontSize:18,lineHeight:1,flexShrink:0,marginTop:1}}>✅</span>
            <span style={{fontSize:F.sm,color:C.gray800,lineHeight:1.6}}>{w}</span>
          </div>
        ))}
      </LpSection>

      {/* 3. 전환 */}
      <LpSection title="임차인이라면 이런 사진 올릴 수 있을까요?" sub={<>보증금을 돌려받으려면 사진을 올려야 해요.<br/>사진을 찍어야 하니까, 임차인은<br/>자연스럽게 정리하게 돼요.</>}>
        <p style={{fontSize:F.base,fontWeight:700,color:C.gray800,textAlign:"center",marginBottom:14}}>만약 냉장고 사진을 올려 둔다면?</p>
        <div style={{display:"flex",gap:10,maxWidth:340,margin:"0 auto"}}>
          <LpPhoto src={lpImg("fridge-before")} ratio="3/4" tone="good" label="입주 전 ✅ 이렇게 깨끗했어요"/>
          <LpPhoto src={lpImg("fridge-after")} ratio="3/4" tone="bad" label="퇴실 후 ❌ 청소 안 된 상태로는 올리기 어렵겠죠?"/>
        </div>
      </LpSection>

      {/* 4. 사용 방법 (사용설명서) */}
      <LpSection title="이렇게 사용해요" bg={C.gray50}>
        <LpPhase icon="📥" title="입주할 때" color={C.primary} steps={[
          {t:"나갈 때 확인하고 싶은 공간의 사진을 올려 두고",img:"app-setup-1",cap:"임대인이 미리 올려 둔 사진이에요. 오른쪽은 임차인이 퇴실할 때 올려요"},
          {t:"집 비밀번호와 함께 링크를 보내요",img:"app-copy-1",cap:"[메시지 + 링크 복사]를 누르고, 문자나 카톡에 붙여넣기"},
        ]}/>
        <LpPhase icon="🚪" title="퇴실할 때" color="#E74C3C" steps={[
          {t:"퇴실 링크를 보내면"},
          {t:"임차인은 기존 공간과 같은 자리를 사진 찍어 올려요",img:"app-checkout-1",cap:"입주 전 사진을 보면서 같은 자리를 찍어요"},
          {t:"공과금과 비밀번호도 적어야 해요"},
        ]}/>
        <LpPhase icon="📋" title="최종 보고서" color={C.success} steps={[
          {t:"최종 보고서를 확인하고, 문제가 없으면",img:"app-report-1",cap:"입주 전과 퇴실 후를 공간별로 나란히 비교해요"},
          {t:"보증금을 돌려주세요"},
        ]}/>
      </LpSection>

      {/* 5. 장점 */}
      <LpSection title="이런 점이 달라져요">
        {perks.map(p=>(
          <div key={p.title} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:C.gray50,borderRadius:R.lg,marginBottom:10,border:`1px solid ${C.gray100}`}}>
            <span style={{fontSize:28,flexShrink:0,lineHeight:1}}>{p.emoji}</span>
            <div>
              <p style={{fontSize:F.base,fontWeight:700,color:C.gray900,marginBottom:2}}>{p.title}</p>
              <p style={{fontSize:F.sm,color:C.gray600,lineHeight:1.6}}>{p.desc}</p>
            </div>
          </div>
        ))}
      </LpSection>

      {/* 6. 이런 분께 */}
      <LpSection title="이런 분께 좋아요" bg={C.gray50}>
        {targets.map(t=>(
          <div key={t} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 4px",borderBottom:`1px solid ${C.gray200}`}}>
            <span style={{color:C.success,fontSize:18,flexShrink:0}}>✔</span>
            <span style={{fontSize:F.base,color:C.gray800}}>{t}</span>
          </div>
        ))}
      </LpSection>

      {/* 후기 (쌓이면 표시) */}
      {reviews.length>0 && (
        <LpSection title="실사용 후기">
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
        </LpSection>
      )}

      {/* 7. 자주 묻는 질문 */}
      <LpSection title="자주 묻는 질문" bg={reviews.length>0?C.gray50:C.white}>
        <div style={{borderTop:`1px solid ${C.gray200}`}}>
          {faqs.map(f=><LpFaq key={f.q} q={f.q} a={f.a}/>)}
        </div>
      </LpSection>

      {/* 8. 마지막 버튼 */}
      <div style={{background:heroBg,padding:"44px 20px 52px",textAlign:"center"}}>
        <h2 style={{fontSize:24,fontWeight:800,color:C.white,lineHeight:1.4,marginBottom:22}}>다음 퇴실은,<br/>사진 받고 반환하세요</h2>
        <button onClick={onStart} style={{padding:"16px 40px",background:C.white,color:C.primary,borderRadius:R.full,fontSize:F.base,fontWeight:700,border:"none",cursor:"pointer",boxShadow:"0 4px 18px rgba(0,0,0,0.18)"}}>지금 무료로 시작하기 →</button>
        <p style={{fontSize:F.xs,color:"rgba(255,255,255,0.7)",marginTop:10}}>앱 설치 없음 · 완전 무료</p>
      </div>
    </div>
  );
}

// ── AUTH ──────────────────────────────────────────
// ── 개인정보 안내 박스 / 동의 항목 ───────────────────────
function PrivacyNote({children}) {
  return (
    <div style={{background:C.gray50,border:`1px solid ${C.gray200}`,borderRadius:R.md,padding:"12px 14px",marginBottom:12,fontSize:F.xs,color:C.gray600,lineHeight:1.7}}>
      <p style={{fontWeight:700,color:C.gray800,marginBottom:2}}>🔒 개인정보 안내</p>
      {children}
    </div>
  );
}
function ConsentRow({checked,onChange,label,detail}) {
  const [open,setOpen]=useState(false);
  return (
    <div style={{width:"100%",marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <label style={{display:"flex",alignItems:"center",gap:8,flex:1,fontSize:F.sm,color:C.gray800,cursor:"pointer"}}>
          <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/>{label}
        </label>
        <button type="button" onClick={()=>setOpen(o=>!o)} style={{background:"none",border:"none",fontSize:F.xs,color:C.gray400,textDecoration:"underline",cursor:"pointer"}}>{open?"닫기":"보기"}</button>
      </div>
      {open && <div style={{background:C.gray50,borderRadius:R.md,padding:"10px 12px",marginTop:6,fontSize:F.xs,color:C.gray600,lineHeight:1.7,whiteSpace:"pre-line"}}>{detail}</div>}
    </div>
  );
}
const CONSENT_REQUIRED="· 수집 항목: 이름, 이메일, 비밀번호\n· 이용 목적: 회원 가입·관리, 서비스 제공\n· 보유 기간: 회원 탈퇴 시까지 (탈퇴 후 30일 뒤 완전히 삭제)\n· 동의하지 않으면 회원가입이 어려워요";
const CONSENT_PHONE="· 수집 항목: 휴대폰번호\n· 이용 목적: 서비스 알림 발송, 문의 응대\n· 보유 기간: 회원 탈퇴 시까지 (탈퇴 후 30일 뒤 완전히 삭제)\n· 동의하지 않아도 서비스는 그대로 이용할 수 있어요";

function AuthPage({users,onLogin,onRegister}) {
  const [mode,setMode]=useState("login");
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [pw,setPw]=useState(""); const [err,setErr]=useState("");
  const [phone,setPhone]=useState(""); const [agreePrivacy,setAgreePrivacy]=useState(false); const [agreePhone,setAgreePhone]=useState(false);
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
    const ph=phone.trim();
    if(ph&&!/^01[016789]-?\d{3,4}-?\d{4}$/.test(ph)){setErr("휴대폰번호 형식을 확인해주세요. (예: 010-1234-5678)");return;}
    if(!agreePrivacy){setErr("[필수] 개인정보 수집·이용에 동의해주세요.");return;}
    if(ph&&!agreePhone){setErr("휴대폰번호를 적으셨다면 [선택] 휴대폰번호 수집·이용 동의도 체크해주세요.");return;}
    onRegister({name,email,pw,phone:ph,loginMethod:"email",consents:{privacy:nowStr(),phone:ph?nowStr():null}});
  }
  return (
    <div style={{minHeight:"100vh",background:C.gray50,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
    <div style={{width:"100%",maxWidth:480,background:C.white,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",boxSizing:"border-box"}}>
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
        <Inp value={pw} onChange={setPw} placeholder="비밀번호" type="password" style={{marginBottom:10}}/>
        <Inp value={phone} onChange={setPhone} placeholder="휴대폰번호 (선택) 010-1234-5678" type="tel" style={{marginBottom:4}}/>
        <p style={{fontSize:F.xs,color:C.gray400,marginBottom:14,alignSelf:"flex-start"}}>임차인 확인 알림을 받고 싶을 때 적어주세요. 나중에도 적을 수 있어요</p>
        <ConsentRow checked={agreePrivacy} onChange={setAgreePrivacy} label="[필수] 개인정보 수집·이용 동의" detail={CONSENT_REQUIRED}/>
        <ConsentRow checked={agreePhone} onChange={setAgreePhone} label="[선택] 휴대폰번호 수집·이용 동의" detail={CONSENT_PHONE}/>
        {err && <p style={{color:C.danger,fontSize:F.sm,margin:"4px 0 12px",alignSelf:"flex-start"}}>{err}</p>}
        <PrimaryBtn label="가입하기" onClick={doRegister} style={{margin:"8px 0 16px"}}/>
        <p style={{fontSize:F.sm,color:C.gray600}}>이미 계정이 있으신가요? <span style={{color:C.primary,fontWeight:600,cursor:"pointer"}} onClick={()=>setMode("login")}>로그인</span></p>
      </>}
    </div>
    </div>
  );
}

// ── 터치해서 이름 바꾸기 ─────────────────────────────
function EditableName({value,fallback,onSave}) {
  const [editing,setEditing]=useState(false);
  const [text,setText]=useState(value);
  function commit(){ onSave(text.trim()); setEditing(false); }
  if(editing) return (
    <div onClick={e=>e.stopPropagation()} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
      <input autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder="방 이름"
        onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}}
        style={{fontFamily:"inherit",fontSize:F.base,fontWeight:600,color:C.gray800,background:C.gray100,border:`1.5px solid ${C.primary}`,borderRadius:R.sm,padding:"6px 8px",outline:"none",width:140,boxSizing:"border-box"}}/>
      <button onClick={commit} style={{padding:"7px 12px",background:C.primary,color:C.white,borderRadius:R.sm,fontSize:F.sm,fontWeight:700,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>확인</button>
      <button onClick={()=>setEditing(false)} style={{padding:"7px 10px",background:C.gray100,color:C.gray600,borderRadius:R.sm,fontSize:F.sm,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>취소</button>
    </div>
  );
  return (
    <p onClick={e=>{e.stopPropagation();setText(value);setEditing(true);}} style={{fontSize:F.base,fontWeight:600,marginBottom:2,cursor:"text",display:"inline-block"}}>
      {value||fallback} <span style={{fontSize:F.xs,color:C.gray400,fontWeight:400}}>✎</span>
    </p>
  );
}

// ── ROOM STATUS ROW (세로 진행선 + 한 줄 현황) ─────────
// state: "done"(초록 ✓) / "current"(파랑) / "todo"(회색)
function RoomStatusRow({emoji,label,status,statusColor,locked,lockedText,onClick,state,prevDone,first,last}) {
  const line=(on)=>({position:"absolute",left:10,width:2,background:on?C.success:C.gray200});
  return (
    <div onClick={locked?undefined:e=>{e.stopPropagation();onClick();}} style={{display:"flex",alignItems:"stretch",cursor:locked?"default":"pointer"}}>
      <div style={{width:22,position:"relative",flexShrink:0}}>
        {!first && <div style={{...line(prevDone),top:0,height:"50%"}}/>}
        {!last && <div style={{...line(state==="done"),top:"50%",bottom:0}}/>}
        <div style={{position:"absolute",left:4,top:"50%",transform:"translateY(-50%)",width:14,height:14,borderRadius:"50%",boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",color:C.white,fontSize:9,fontWeight:700,
          background:state==="done"?C.success:state==="current"?C.primary:C.white,
          border:state==="todo"?`2px solid ${C.gray200}`:"none"}}>{state==="done"&&"✓"}</div>
      </div>
      <div style={{flex:1,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",marginLeft:8,opacity:locked?0.5:1}}>
        <span style={{fontSize:F.sm,color:C.gray800,fontWeight:state==="current"?700:400}}>{emoji} {label}</span>
        <span style={{fontSize:F.xs,fontWeight:600,color:locked?C.gray400:(statusColor||C.gray600)}}>{locked?lockedText:status}{!locked&&" ›"}</span>
      </div>
    </div>
  );
}

// ── HOME TAB ──────────────────────────────────────
const REORDER_STEP = 64; // 순서 편집 카드 높이(56) + 간격(8)
function HomeTab({user,props,contracts,onRenameProp,onReorderProps,onEditProp,onStartNewTenant,onDeleteProp,onOpenMemo,onOpenCheckin,onOpenCheckout,onViewRecord,onOpenPast,onAddProp,showInstallBanner,onInstallClick,onDismissInstallBanner}) {
  const [menuFor,setMenuFor]=useState(null);
  const menuProp=props.find(p=>p.id===menuFor);
  const [reorder,setReorder]=useState(false);
  const [drag,setDrag]=useState(null);
  const press=useRef(null);

  function startPress(e){
    if(reorder||props.length<2||e.target.closest("input,button")) return;
    const x=e.clientX,y=e.clientY;
    press.current={x,y,t:setTimeout(()=>{press.current=null;navigator.vibrate?.(30);setReorder(true);},500)};
  }
  function movePress(e){
    const p=press.current;
    if(p&&(Math.abs(e.clientX-p.x)>10||Math.abs(e.clientY-p.y)>10)) endPress();
  }
  function endPress(){ if(press.current){clearTimeout(press.current.t);press.current=null;} }
  function moveRoom(id,to){
    const ids=props.map(p=>p.id).filter(x=>x!==id);
    ids.splice(Math.max(0,Math.min(props.length-1,to)),0,id);
    onReorderProps(ids);
  }
  const activeContracts=props.map(p=>contracts.find(c=>c.propertyId===p.id&&c.status!=="ended")).filter(Boolean);
  const waitCheckin=activeContracts.filter(c=>c.checkinSentAt&&!c.checkinSubmitted).length;
  const waitCheckout=activeContracts.filter(c=>c.checkinSubmitted&&c.checkoutSentAt&&!c.checkoutSubmitted).length;
  const reportReady=activeContracts.filter(c=>c.checkoutSubmitted).length;
  const timeline=props.map(p=>{
    const a=contracts.find(c=>c.propertyId===p.id&&c.status!=="ended");
    const d=a?.endDate?daysDiff(a.endDate):null;
    return{p,a,d,hasPhoto:a?.checkoutSubmitted&&a.status!=="ended"};
  }).filter(x=>x.d!==null&&x.d<=30).sort((a,b)=>a.d-b.d);

  return (
    <div style={{padding:"24px 16px"}}>
      {menuProp && <ActionSheet title={menuProp.name||menuProp.address||"이름 없는 방"} onClose={()=>setMenuFor(null)} items={[
        {label:"방 이름·주소 수정",onClick:()=>onEditProp(menuProp)},
        ...(props.length>1?[{label:"↕ 방 순서 바꾸기",onClick:()=>setReorder(true)}]:[]),
        {label:"🔄 새 입주자 시작하기",onClick:()=>onStartNewTenant(menuProp)},
        {label:"방 삭제",danger:true,onClick:()=>onDeleteProp(menuProp)},
      ]}/>}
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:F.xl,fontWeight:700,color:C.gray900,marginBottom:4}}>안녕하세요, {user.name}님 👋</h2>
        <p style={{fontSize:F.sm,color:C.gray600}}>오늘도 편안한 임대 되세요</p>
      </div>
      {showInstallBanner && (
        <div style={{background:C.primaryLight,border:`1px solid ${C.primary}30`,borderRadius:R.lg,padding:"14px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:26,flexShrink:0}}>📲</span>
          <div style={{flex:1}}>
            <p style={{fontSize:F.sm,fontWeight:700,color:C.primaryText,marginBottom:2}}>앱처럼 설치하고 더 빠르게 써보세요</p>
            <p style={{fontSize:F.xs,color:C.primaryText,marginBottom:10}}>매번 주소 검색 안 해도, 홈 화면 아이콘 눌러서 바로 열려요</p>
            <div style={{display:"flex",gap:8}}>
              <button onClick={onInstallClick} style={{padding:"8px 14px",background:C.primary,color:C.white,borderRadius:R.md,fontSize:F.xs,fontWeight:700,border:"none",cursor:"pointer"}}>홈 화면에 추가</button>
              <button onClick={onDismissInstallBanner} style={{padding:"8px 14px",background:"none",color:C.primaryText,borderRadius:R.md,fontSize:F.xs,fontWeight:600,border:"none",cursor:"pointer"}}>나중에</button>
            </div>
          </div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
        <StatCard label="입실 확인 대기" value={waitCheckin} emoji="🔑" color={waitCheckin>0?C.warning:C.gray400}/>
        <StatCard label="퇴실 제출 대기" value={waitCheckout} emoji="🚪" color={waitCheckout>0?C.warning:C.gray400}/>
        <StatCard label="확인할 보고서" value={reportReady} emoji="📋" color={reportReady>0?C.primary:C.gray400}/>
      </div>
      {timeline.length>0 && <>
        <SectionLabel label="다가오는 계약 만료"/>
        <div style={{background:C.white,borderRadius:R.lg,border:`1px solid ${C.gray200}`,overflow:"hidden",marginBottom:20}}>
          {timeline.map(({p,a,d,hasPhoto},i)=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i<timeline.length-1?`1px solid ${C.gray100}`:"none"}}>
              <div style={{width:10,height:10,borderRadius:"50%",flexShrink:0,background:d<=7?C.danger:d<=14?C.warning:C.success}}/>
              <span style={{fontSize:F.sm,fontWeight:600,color:d<0?C.danger:C.gray600,minWidth:56}}>{d<0?`${-d}일 지남`:d===0?"오늘":`${d}일 후`}</span>
              <div style={{flex:1}}>
                <span style={{fontSize:F.base}}>{p.name||p.address||"이름 없는 방"}</span>
                {hasPhoto && <span style={{marginLeft:8,fontSize:F.xs,background:C.primaryLight,color:C.primaryText,borderRadius:R.full,padding:"2px 8px",fontWeight:600}}>📬 사진 도착</span>}
              </div>
              <span style={{fontSize:F.sm,color:C.gray400}}>{a?.tenantName||""}</span>
            </div>
          ))}
        </div>
      </>}
      {reorder ? (
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <SectionLabel label="방 순서 바꾸기" noMargin/>
          <button onClick={()=>setReorder(false)} style={{padding:"7px 16px",background:C.primary,color:C.white,borderRadius:R.full,fontSize:F.sm,fontWeight:700,border:"none",cursor:"pointer"}}>완료</button>
        </div>
      ) : <SectionLabel label={`내 방 (${props.length})`}/>}
      {reorder && <p style={{fontSize:F.xs,color:C.gray400,marginBottom:10}}>≡ 을 끌거나 ▲ ▼ 를 눌러서 순서를 바꾸세요</p>}
      {props.length===0 && <Empty emoji="🏘️" text="아직 등록된 방이 없어요" sub="아래 버튼으로 첫 번째 방을 추가해보세요"/>}
      {reorder && props.map((prop,idx)=>{
        const dragging=drag?.id===prop.id;
        return (
          <div key={prop.id} style={{height:REORDER_STEP-8,marginBottom:8,display:"flex",alignItems:"center",gap:8,padding:"0 8px 0 4px",boxSizing:"border-box",background:C.white,border:`1px solid ${dragging?C.primary:C.gray200}`,borderRadius:R.lg,position:"relative",zIndex:dragging?5:1,
            transform:dragging?`translateY(${drag.dy-(idx-drag.startIdx)*REORDER_STEP}px)`:"none",boxShadow:dragging?"0 8px 24px rgba(0,0,0,0.15)":"none"}}>
            <div
              onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setDrag({id:prop.id,startY:e.clientY,startIdx:idx,base:props.map(p=>p.id),dy:0});}}
              onPointerMove={e=>{
                if(!dragging) return;
                const dy=e.clientY-drag.startY;
                const to=Math.max(0,Math.min(props.length-1,drag.startIdx+Math.round(dy/REORDER_STEP)));
                setDrag({...drag,dy});
                if(to!==idx){const ids=drag.base.filter(x=>x!==prop.id);ids.splice(to,0,prop.id);onReorderProps(ids);}
              }}
              onPointerUp={()=>setDrag(null)} onPointerCancel={()=>setDrag(null)}
              style={{width:40,height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:C.gray400,cursor:"grab",touchAction:"none",userSelect:"none"}}>≡</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:F.base,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{prop.name||prop.address||"이름 없는 방"}</p>
            </div>
            <button onClick={()=>moveRoom(prop.id,idx-1)} disabled={idx===0} aria-label="위로" style={{width:36,height:36,background:C.gray100,border:"none",borderRadius:R.sm,fontSize:F.sm,color:idx===0?C.gray200:C.gray600,cursor:idx===0?"default":"pointer"}}>▲</button>
            <button onClick={()=>moveRoom(prop.id,idx+1)} disabled={idx===props.length-1} aria-label="아래로" style={{width:36,height:36,background:C.gray100,border:"none",borderRadius:R.sm,fontSize:F.sm,color:idx===props.length-1?C.gray200:C.gray600,cursor:idx===props.length-1?"default":"pointer"}}>▼</button>
          </div>
        );
      })}
      {!reorder && props.map(prop=>{
        const a=contracts.find(c=>c.propertyId===prop.id&&c.status!=="ended");
        const st=getStatus(a); const cfg=ST[st];
        return (
          <div key={prop.id} onPointerDown={startPress} onPointerMove={movePress} onPointerUp={endPress} onPointerCancel={endPress} onPointerLeave={endPress} onContextMenu={e=>e.preventDefault()}
            style={{background:C.white,borderRadius:R.lg,border:`1px solid ${C.gray200}`,padding:"16px",marginBottom:10,userSelect:"none",WebkitTouchCallout:"none"}}>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div>
                  <EditableName value={prop.name||""} fallback={prop.address||"이름 없는 방"} onSave={name=>onRenameProp(prop.id,name)}/>
                  <p style={{fontSize:F.sm,color:C.gray600}}>{prop.address?[prop.address,prop.dong,prop.ho].filter(Boolean).join(" "):"주소 미입력"}</p>
                </div>
                <button onClick={()=>setMenuFor(prop.id)} aria-label="더보기" style={{background:"none",border:"none",color:C.gray400,fontSize:22,lineHeight:1,padding:"2px 8px",cursor:"pointer"}}>⋯</button>
              </div>
              {a ? <div style={{display:"flex",alignItems:"center",gap:8}}><Dot color={cfg?.dot}/><span style={{fontSize:F.sm,color:C.gray600}}>{cfg?.label}</span>{a.endDate&&<span style={{fontSize:F.xs,color:C.gray400,marginLeft:"auto"}}>~{a.endDate}</span>}</div>
                : <span style={{fontSize:F.sm,color:C.gray400}}>계약 없음</span>}
            </div>
            {a && <div style={{marginTop:4}}>
              <RoomStatusRow first emoji="📝" label="메모" state={a.tenantName?"done":"todo"} status={a.tenantName||"나중에 적어도 돼요"} onClick={()=>onOpenMemo(a.id)}/>
              <RoomStatusRow prevDone={!!a.tenantName} emoji="🔑" label="입실 링크" state={a.checkinSubmitted?"done":"current"} status={a.checkinSubmitted?`✓ 확인함 · ${whenStr(a.checkinData?.at)}`:a.checkinSentAt?"보냄 · 확인 기다리는 중":"아직 안 보냈어요"} statusColor={a.checkinSubmitted?C.success:a.checkinSentAt?C.warning:C.gray600} onClick={()=>onOpenCheckin(prop.id,a.id)}/>
              <RoomStatusRow prevDone={a.checkinSubmitted} emoji="🚪" label="퇴실 링크" state={a.checkoutSubmitted?"done":a.checkinSubmitted?"current":"todo"} status={a.checkoutSubmitted?`✓ 제출함 · ${whenStr(a.checkoutData?.at)}`:a.checkoutSentAt?"보냄 · 제출 기다리는 중":"퇴실할 때 보내세요"} statusColor={a.checkoutSubmitted?C.success:a.checkoutSentAt?C.warning:C.gray600} locked={!a.checkinSubmitted} lockedText="퇴실할 때 보내는 링크예요" onClick={()=>onOpenCheckout(prop.id,a.id)}/>
              <RoomStatusRow last prevDone={a.checkoutSubmitted} emoji="📋" label="최종 보고서" state={a.checkoutSubmitted?"current":"todo"} status="확인 가능" statusColor={C.primary} locked={!a.checkoutSubmitted} lockedText="퇴실 제출 후 확인 가능" onClick={()=>onViewRecord(a.id)}/>
            </div>}
            {(()=>{
              const pastCount=contracts.filter(c=>c.propertyId===prop.id&&c.status==="ended").length;
              return pastCount>0 && (
                <div style={{textAlign:"right",marginTop:2}}>
                  <button onClick={()=>onOpenPast(prop.id)} style={{background:"none",border:"none",padding:"8px 0 0 12px",fontSize:F.xs,color:C.gray400,cursor:"pointer"}}>지난 보고서 {pastCount}건 ›</button>
                </div>
              );
            })()}
          </div>
        );
      })}
      <button onClick={onAddProp} style={{width:"100%",padding:"15px",background:C.primary,borderRadius:R.lg,fontSize:F.base,fontWeight:700,color:C.white,marginTop:4,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span style={{fontSize:20}}>＋</span> 방 추가하기
      </button>
    </div>
  );
}

// ── PAST REPORTS (지난 보고서 목록) ─────────────────
function PastReportsPage({prop,past,onViewRecord,onDelete,onBack}) {
  const [askId,setAskId]=useState(null);
  return (
    <Page>
      {askId && <ConfirmModal message="이 보고서를 삭제할까요? 사진과 기록이 모두 사라지고 되돌릴 수 없어요." okLabel="삭제" danger onOk={()=>onDelete(askId)} onClose={()=>setAskId(null)}/>}
      <NavBar title="지난 보고서" onBack={onBack}/>
      <div style={{padding:"16px 16px 32px"}}>
        <p style={{fontSize:F.sm,color:C.gray600,marginBottom:16}}>{prop.name||prop.address||"이름 없는 방"}</p>
        {past.length===0 ? <Empty emoji="📁" text="지난 보고서가 아직 없어요" sub="계약을 마무리하면 여기에 저장돼요"/> : (
          <SCard title={`총 ${past.length}건`}>
            {past.map((co,i)=>(
              <div key={co.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<past.length-1?`1px solid ${C.gray100}`:"none"}}>
                <div>
                  <p style={{fontSize:F.base,fontWeight:600}}>{co.tenantName||"(임차인 미입력)"}</p>
                  <p style={{fontSize:F.sm,color:C.gray400}}>{co.startDate&&co.endDate?`${co.startDate} ~ ${co.endDate}`:`마무리: ${co.endedAt||"-"}`}</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <button onClick={()=>onViewRecord(co.id)} style={{padding:"6px 14px",background:C.gray100,borderRadius:R.full,fontSize:F.sm,color:C.gray600,border:"none",cursor:"pointer"}}>보고서 보기</button>
                  <button onClick={()=>setAskId(co.id)} style={{padding:"6px 12px",background:C.dangerLight,borderRadius:R.full,fontSize:F.sm,color:C.danger,border:"none",cursor:"pointer"}}>삭제</button>
                </div>
              </div>
            ))}
          </SCard>
        )}
      </div>
    </Page>
  );
}

// ── 하단에서 올라오는 메뉴 (더보기) ────────────────────
function ActionSheet({title,items,onClose}) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:600,display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",background:"rgba(0,0,0,0.4)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.white,borderRadius:"20px 20px 0 0",padding:"18px 16px 28px",width:"100%",maxWidth:480,boxSizing:"border-box"}}>
        {title && <p style={{fontSize:F.sm,color:C.gray400,textAlign:"center",marginBottom:10}}>{title}</p>}
        {items.map(it=>(
          <button key={it.label} onClick={()=>{onClose();it.onClick();}} style={{display:"block",width:"100%",padding:"15px",background:"none",border:"none",borderBottom:`1px solid ${C.gray100}`,fontSize:F.base,fontWeight:600,color:it.danger?C.danger:C.gray800,cursor:"pointer"}}>{it.label}</button>
        ))}
        <button onClick={onClose} style={{display:"block",width:"100%",padding:"15px",marginTop:8,background:C.gray100,border:"none",borderRadius:R.md,fontSize:F.base,fontWeight:600,color:C.gray600,cursor:"pointer"}}>닫기</button>
      </div>
    </div>
  );
}

// ── 크기 조절 메모장 (우측 하단 손잡이를 끌어서 늘이고 줄임) ──
function MemoPad({value,onChange,placeholder}) {
  const [h,setH]=useState(180);
  const drag=useRef(null);
  return (
    <div style={{position:"relative"}}>
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{fontFamily:"inherit",fontSize:F.base,color:C.gray800,background:C.gray100,border:"1.5px solid transparent",borderRadius:R.md,padding:"13px 14px",outline:"none",width:"100%",boxSizing:"border-box",resize:"none",height:h,lineHeight:1.7,display:"block"}}
        onFocus={e=>{e.target.style.borderColor=C.primary;e.target.style.background=C.white;}}
        onBlur={e=>{e.target.style.borderColor="transparent";e.target.style.background=C.gray100;}}/>
      <div
        onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);drag.current={y:e.clientY,h};}}
        onPointerMove={e=>{if(drag.current)setH(Math.max(100,Math.min(700,drag.current.h+e.clientY-drag.current.y)));}}
        onPointerUp={()=>{drag.current=null;}}
        onPointerCancel={()=>{drag.current=null;}}
        style={{position:"absolute",right:4,bottom:4,width:28,height:28,cursor:"ns-resize",touchAction:"none",display:"flex",alignItems:"flex-end",justifyContent:"flex-end",padding:4,boxSizing:"border-box"}}>
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M13 3L3 13M13 8L8 13" stroke={C.gray400} strokeWidth="1.6" strokeLinecap="round"/></svg>
      </div>
    </div>
  );
}

// ── CONTRACT MEMO ─────────────────────────────────
function ContractMemoPage({co,onSave,onBack}) {
  const [memo,setMemo]=useState(co.memo||"");
  const [deposit,setDeposit]=useState(co.deposit||"");
  const [monthly,setMonthly]=useState(co.monthly||"");
  const [startDate,setStartDate]=useState(co.startDate||"");
  const [endDate,setEndDate]=useState(co.endDate||"");
  const [tenantName,setTenantName]=useState(co.tenantName||"");
  const [tenantPhone,setTenantPhone]=useState(co.tenantPhone||"");

  function doSave() {
    onSave({deposit,monthly,startDate,endDate,tenantName,tenantPhone,memo});
  }

  return (
    <Page>
      <NavBar title="메모" onBack={onBack}/>
      <div style={{padding:"16px 16px 100px"}}>
        <p style={{fontSize:F.sm,color:C.gray600,marginBottom:16}}>임차인 정보와 계약 조건을 자유롭게 기록해두세요. 언제든 나중에 적어도 되고, 임대인만 볼 수 있어요</p>
        <SCard title="임차인 정보">
          <FieldLabel label="이름"/><Inp value={tenantName} onChange={setTenantName} placeholder="홍길동" style={{marginBottom:10}}/>
          <FieldLabel label="연락처"/><Inp value={tenantPhone} onChange={setTenantPhone} placeholder="010-0000-0000"/>
        </SCard>
        <SCard title="계약 조건">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><FieldLabel label="보증금 (만원)"/><Inp value={deposit} onChange={setDeposit} placeholder="500" type="number"/></div>
            <div><FieldLabel label="월세 (만원)"/><Inp value={monthly} onChange={setMonthly} placeholder="50" type="number"/></div>
          </div>
          <FieldLabel label="계약 시작일"/>
          <DatePicker value={startDate} onChange={setStartDate} placeholder="시작일 선택" style={{marginBottom:10}}/>
          <FieldLabel label="계약 종료일"/>
          <DatePicker value={endDate} onChange={setEndDate} placeholder="종료일 선택"/>
        </SCard>
        <SCard title="✏️ 자유 메모">
          <MemoPad value={memo} onChange={setMemo} placeholder={"자유롭게 적어두세요\n예: 에어컨 고장 수리 예정, 월세 매달 5일 입금 약속 등"}/>
          <p style={{fontSize:F.xs,color:C.gray400,marginTop:6}}>우측 하단 손잡이를 끌면 메모장 크기를 조절할 수 있어요</p>
        </SCard>
      </div>
      <FixedBottom><PrimaryBtn label="저장하기" onClick={doSave}/></FixedBottom>
    </Page>
  );
}

// ── CHECKIN SETUP ──────────────────────────────────
function CheckinSetupPage({prop,co,onSaveProp,onSimCheckin,onMarkSent,onBack}) {
  const [noPw,setNoPw]=useState(prop.noPw||false);
  const [pw,setPw]=useState(prop.password||"");
  const [spaces,setSpaces]=useState(prop.spaces||[...SPACES]);
  const [newSp,setNewSp]=useState("");
  const [refPhotos,setRefPhotos]=useState(prop.refPhotos||{});
  const [editIdx,setEditIdx]=useState(null);
  const [pendingName,setPendingName]=useState("");
  const [ciMsg,setCiMsg]=useState(prop.checkinMsg||fillAddr(DEFAULT_CI_MSG,prop));
  const [copied,setCopied]=useState(false);
  const [saved,setSaved]=useState(false);
  const hadPhotos=useRef(Object.keys(prop.refPhotos||{}).length>0);
  const fileRefs=useRef({});

  function hPhoto(sp,e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setRefPhotos(s=>({...s,[sp]:ev.target.result}));r.readAsDataURL(f);}

  function doSave() {
    onSaveProp({noPw,password:noPw?"":pw,spaces,refPhotos,checkinMsg:ciMsg});
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  }
  function copyLink() {
    doSave();
    const url=`${window.location.origin}${window.location.pathname}?token=${co.checkinToken}`;
    navigator.clipboard?.writeText(`${ciMsg}\n\n${url}`).catch(()=>{});
    onMarkSent();
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }

  return (
    <Page>
      <NavBar title="입실 링크 만들기" onBack={onBack}/>
      <div style={{padding:"16px 16px 100px"}}>
        {co.checkinData && (
          <SCard title="✅ 임차인이 남긴 입실 기록">
            <p style={{fontSize:F.xs,color:C.gray400,marginBottom:8}}>제출: {co.checkinData.time}</p>
            {co.checkinData.extras?.length>0 ? <>
              <p style={{fontSize:F.sm,fontWeight:600,marginBottom:8}}>여기도 봐주세요 ({co.checkinData.extras.length}장)</p>
              <PhotoGrid photos={co.checkinData.extras} tall/>
            </> : <p style={{fontSize:F.sm,color:C.gray400}}>추가로 남긴 사진은 없어요</p>}
          </SCard>
        )}
        <SCard title="🔑 현관 비밀번호">
          <Checkbox checked={noPw} onChange={e=>setNoPw(e.target.checked)} label="비밀번호가 없어요"/>
          {!noPw && <>
            <p style={{fontSize:F.sm,color:C.gray600,margin:"8px 0"}}>입실 링크에서 손님한테 자동으로 전달돼요</p>
            <Inp value={pw} onChange={setPw} placeholder="예: 1234#"/>
          </>}
        </SCard>

        <SCard title="📸 현재 방 상태 사진">
          <p style={{fontSize:F.sm,color:C.gray600,marginBottom:hadPhotos.current&&!co.checkinSubmitted?6:12}}>공간마다 지금 상태 사진을 올려두면 퇴실할 때 나란히 비교할 수 있어요</p>
          {hadPhotos.current&&!co.checkinSubmitted && <p style={{fontSize:F.xs,color:C.primaryText,background:C.primaryLight,borderRadius:R.sm,padding:"8px 10px",marginBottom:12,lineHeight:1.6}}>💡 이전에 올려 둔 사진이에요. 그대로 써도 되고, 바꿔도 돼요</p>}
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
                  <p style={{fontSize:F.xs,fontWeight:600,color:C.primary,marginBottom:4}}>지금 상태 (임대인)</p>
                  <div onClick={()=>fileRefs.current[sp]?.click()} style={{aspectRatio:"3/4",background:C.primaryLight,borderRadius:R.md,border:`2px dashed ${C.primary}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden"}}>
                    <input ref={el=>fileRefs.current[sp]=el} type="file" accept="image/*" style={{display:"none"}} onChange={e=>hPhoto(sp,e)}/>
                    {refPhotos[sp] ? <img src={refPhotos[sp]} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:28}}>📷</span>}
                  </div>
                </div>
                <div>
                  <p style={{fontSize:F.xs,fontWeight:600,color:C.gray400,marginBottom:4}}>퇴실할 때 (임차인)</p>
                  <div style={{aspectRatio:"3/4",background:C.gray100,borderRadius:R.md,border:`2px dashed ${C.gray200}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
                    <span style={{fontSize:24}}>📷</span>
                    <span style={{fontSize:F.xs,color:C.gray400,textAlign:"center",padding:"0 8px",lineHeight:1.4}}>퇴실할 때 임차인이 올릴 거예요</span>
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

        <SCard title="💌 임차인에게 보낼 메시지">
          <p style={{fontSize:F.xs,color:C.gray400,marginBottom:8}}>주차, 와이파이 같은 안내사항도 이 메시지에 자유롭게 적어주세요</p>
          <Textarea value={ciMsg} onChange={setCiMsg} placeholder="메시지 입력" minHeight={120}/>
        </SCard>

        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <button onClick={copyLink} style={{flex:1,padding:"12px",background:copied?C.success:C.primary,color:C.white,borderRadius:R.md,fontSize:F.sm,fontWeight:700,border:"none",cursor:"pointer"}}>
            {copied?"✓ 복사됐어요!":"📋 메시지 + 링크 복사"}
          </button>
        </div>
        <button onClick={()=>{doSave();onSimCheckin(co.checkinToken);}} style={{width:"100%",padding:"9px",background:"none",border:`1.5px solid ${C.primary}`,borderRadius:R.md,fontSize:F.sm,color:C.primary,fontWeight:600,cursor:"pointer"}}>📱 입실 링크 테스트</button>
      </div>
      <FixedBottom><PrimaryBtn label={saved?"✓ 저장됐어요":"저장하기"} onClick={doSave} style={saved?{background:C.success}:undefined}/></FixedBottom>
    </Page>
  );
}

// ── CHECKOUT SETUP ─────────────────────────────────
function CheckoutSetupPage({prop,co,onSaveProp,onSimCheckout,onMarkSent,onBack}) {
  const [coMsg,setCoMsg]=useState(prop.checkoutMsg||fillAddr(DEFAULT_CO_MSG,prop));
  const [copied,setCopied]=useState(false);
  const [saved,setSaved]=useState(false);

  function doSave() {
    onSaveProp({checkoutMsg:coMsg});
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  }
  function copyLink() {
    doSave();
    const url=`${window.location.origin}${window.location.pathname}?token=${co.checkoutToken}`;
    navigator.clipboard?.writeText(`${coMsg}\n\n${url}`).catch(()=>{});
    onMarkSent();
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }

  return (
    <Page>
      <NavBar title="퇴실 링크 만들기" onBack={onBack}/>
      <div style={{padding:"16px 16px 100px"}}>
        <SCard title="💌 임차인에게 보낼 메시지">
          <Textarea value={coMsg} onChange={setCoMsg} placeholder="메시지 입력" minHeight={120}/>
        </SCard>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <button onClick={copyLink} style={{flex:1,padding:"12px",background:copied?C.success:C.primary,color:C.white,borderRadius:R.md,fontSize:F.sm,fontWeight:700,border:"none",cursor:"pointer"}}>
            {copied?"✓ 복사됐어요!":"📋 메시지 + 링크 복사"}
          </button>
        </div>
        <button onClick={()=>{doSave();onSimCheckout(co.checkoutToken);}} style={{width:"100%",padding:"9px",background:"none",border:`1.5px solid ${C.primary}`,borderRadius:R.md,fontSize:F.sm,color:C.primary,fontWeight:600,cursor:"pointer"}}>📱 퇴실 링크 테스트</button>
      </div>
      <FixedBottom><PrimaryBtn label={saved?"✓ 저장됐어요":"저장하기"} onClick={doSave} style={saved?{background:C.success}:undefined}/></FixedBottom>
    </Page>
  );
}

// ── ADD PROP ──────────────────────────────────────
function AddPropPage({prop,onSave,onBack}) {
  const [name,setName]=useState(prop?.name||"");
  const [address,setAddress]=useState(prop?.address||"");
  const [noDong,setNoDong]=useState(!prop?.dong);
  const [dong,setDong]=useState(prop?.dong||"");
  const [ho,setHo]=useState(prop?.ho||"");

  function doSave() {
    onSave({name,address,dong:noDong?"":dong,ho});
  }

  return (
    <Page>
      <NavBar title="방 정보 수정" onBack={onBack}/>
      <div style={{padding:"16px 16px 100px"}}>
        <SCard title="🏷️ 방 이름">
          <FieldLabel label="방 이름"/>
          <Inp value={name} onChange={setName} placeholder="예: 공덕 오피스텔 305호" style={{marginBottom:4}}/>
          <p style={{fontSize:F.xs,color:C.gray400}}>내 방 목록에 표시되는 이름이에요. 나중에 언제든 바꿀 수 있어요</p>
        </SCard>

        <SCard title="📍 주소">
          <FieldLabel label="주소"/>
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
      </div>
      <FixedBottom><PrimaryBtn label="저장하기" onClick={doSave}/></FixedBottom>
    </Page>
  );
}

// ── RECORD PAGE ───────────────────────────────────
function RecordPage({co,prop,onBack,onEndContract}) {
  const ci=co?.checkinData; const cout=co?.checkoutData;
  const baseSpaces=co?.baseline?.spaces||prop?.spaces||[]; const baseRef=co?.baseline?.refPhotos||prop?.refPhotos||{};
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
              {baseSpaces.map(sp=>(
                <div key={sp} style={{marginBottom:14}}>
                  <p style={{fontSize:F.sm,fontWeight:600,marginBottom:6}}>{sp}</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[["입주 전",baseRef[sp],C.gray400],["퇴실 후",cout.photos?.[sp],C.primary]].map(([l,src,col])=>(
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
        <PrivacyNote>
          <p>· 남기신 사진과 메모는 퇴실할 때 방 상태를 비교하고 보증금 분쟁을 예방하는 목적으로만 임대인에게 보관돼요.</p>
          <p>· 임대인이 기록을 삭제하면 함께 삭제돼요.</p>
          <p>· '확인 완료'를 누르면 위 내용에 동의한 것으로 봐요.</p>
        </PrivacyNote>
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
  const pwRef=useRef(null); const acctRef=useRef(null); const photoSecRef=useRef(null); const utilSecRef=useRef(null);
  const [tried,setTried]=useState(false);
  const spaces=co?.baseline?.spaces||prop?.spaces||[]; const refPhotos=co?.baseline?.refPhotos||prop?.refPhotos||{};
  const missingPhotos=spaces.filter(sp=>refPhotos[sp]&&!photos[sp]);
  const missingUtil=["전기","가스","수도"].filter(k=>!utils[k]?.skip&&!utils[k]?.photo);

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
    if(missingPhotos.length>0){
      setTried(true);
      setTimeout(()=>photoSecRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),50);
      return;
    }
    if(missingUtil.length>0){
      setTried(true);
      setTimeout(()=>utilSecRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),50);
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
              <p style={{fontSize:F.xs,color:C.gray400,margin:"6px 0 4px"}}>🔒 계좌 정보는 보증금 반환 목적으로만 임대인에게 전달돼요</p>
              {acctErr && <ErrBox text="보증금 반환 계좌를 입력해주세요. 계좌 정보가 없으면 보증금을 돌려받기 어려울 수 있어요 💰"/>}
              <div style={{marginTop:10}}>
                <FieldLabel label="은행"/><Inp value={bank} onChange={v=>{setBank(v);setAcctErr(false);}} placeholder="예: 국민은행" style={{marginBottom:10}}/>
                <FieldLabel label="계좌번호"/><Inp value={acct} onChange={setAcct} placeholder="000-000-000000" style={{marginBottom:10}}/>
                <FieldLabel label="예금주"/><Inp value={acctName} onChange={setAcctName} placeholder="홍길동"/>
              </div>
            </>}
          </SCard>
        </div>
        <div ref={photoSecRef}>
        <SCard title="퇴실 사진 📸">
          <p style={{fontSize:F.sm,color:C.gray600,marginBottom:12}}>입주할 때 이런 상태였어요. 같은 공간을 찍어주세요.</p>
          {tried&&missingPhotos.length>0 && <ErrBox text={`사진을 올리지 않은 공간이 있어서 제출할 수 없어요: ${missingPhotos.join(", ")}. 입주 전 사진이 있는 공간은 같은 자리를 찍어서 올려주세요 📸`}/>}
          {spaces.map(sp=>(
            <div key={sp} style={{marginBottom:16}}>
              <p style={{fontSize:F.sm,fontWeight:600,marginBottom:6}}>{sp}{refPhotos[sp]&&<span style={{color:C.danger,fontSize:F.xs}}> *필수</span>}{tried&&missingPhotos.includes(sp)&&<span style={{color:C.danger,fontSize:F.xs}}> · 사진을 올려주세요</span>}</p>
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
        </div>
        <div ref={utilSecRef}>
        <SCard title="공과금 ⚡">
          <p style={{fontSize:F.sm,color:C.gray600,marginBottom:12}}>정산 영수증이나 이체 내역을 캡처해서 올려주세요.</p>
          {tried&&missingUtil.length>0 && <ErrBox text={`공과금 항목을 확인해주세요: ${missingUtil.join(", ")}. 사진을 올리거나 "해당사항 없어요"를 체크해야 제출할 수 있어요 ⚡`}/>}
          {["전기","가스","수도"].map(k=>(
            <div key={k} style={{background:C.gray50,borderRadius:R.md,padding:"12px",marginBottom:8,border:tried&&missingUtil.includes(k)?`1.5px solid ${C.danger}`:"1.5px solid transparent"}}>
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
        </div>
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
        <PrivacyNote>
          <p>· 입력하신 반환 계좌(은행·계좌번호·예금주)와 사진은 보증금 정산과 방 상태 확인 목적으로만 임대인에게 전달돼요.</p>
          <p>· 임대인이 기록을 삭제하면 함께 삭제돼요.</p>
          <p>· '제출하기'를 누르면 위 내용에 동의한 것으로 봐요.</p>
        </PrivacyNote>
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
  const [err,setErr]=useState("");
  const [askDelete,setAskDelete]=useState(false);
  const typeLabel={notice:"공지사항",content:"콘텐츠",faq:"FAQ"};
  return (
    <Page>
      {askDelete && <ConfirmModal message="삭제할까요?" okLabel="삭제" danger onOk={()=>onDelete(item.id)} onClose={()=>setAskDelete(false)}/>}
      <NavBar title={`${typeLabel[item?.type]||""} ${item?.id?"수정":"작성"}`} onBack={onBack}/>
      <div style={{padding:"16px 16px 100px"}}>
        {err && <ErrBox text={err}/>}
        <SCard title="내용 작성">
          <FieldLabel label="제목"/><Inp value={title} onChange={setTitle} placeholder="제목을 입력해주세요" style={{marginBottom:12}}/>
          <FieldLabel label="내용"/><Textarea value={body} onChange={setBody} placeholder="내용을 입력해주세요" minHeight={120}/>
          {item?.type==="content"&&<><FieldLabel label="링크 (선택)"/><Inp value={url} onChange={setUrl} placeholder="https://..."/></>}
        </SCard>
        {item?.id&&<button onClick={()=>setAskDelete(true)} style={{width:"100%",padding:"12px",background:"none",border:`1px solid ${C.danger}`,borderRadius:R.lg,fontSize:F.base,color:C.danger,cursor:"pointer",marginTop:8}}>삭제하기</button>}
      </div>
      <FixedBottom><PrimaryBtn label="저장하기" onClick={()=>{if(!title||!body){setErr("제목과 내용을 모두 입력해주세요.");return;}onSave({...item,title,body,url,date:item?.date||new Date().toLocaleDateString("ko-KR")});}}/></FixedBottom>
    </Page>
  );
}

// ── SHARE ─────────────────────────────────────────
function ShareTab() {
  const [copied,setCopied]=useState(false);
  const shareUrl=window.location.origin;
  const [kakaoHint,setKakaoHint]=useState(false);
  const shareText="방 상태 기록부터 보증금 정산까지! 임대인의 든든한 파트너 '입퇴실 도우미'를 추천해요 😊";
  const targets=[{emoji:"💼",text:"직장 다니면서 임대업 하시는 분"},{emoji:"🏠",text:"단기임대 운영 중인 분"},{emoji:"🏢",text:"고시원·다가구 관리하시는 분"},{emoji:"⚖️",text:"퇴실 분쟁이 걱정되는 분"},{emoji:"📱",text:"임차인과 연락이 부담스러운 분"}];
  function doKakao(){
    if(navigator.share){navigator.share({title:"입퇴실 도우미",text:shareText,url:shareUrl}).catch(()=>{});}
    else{navigator.clipboard?.writeText(shareUrl).catch(()=>{});setKakaoHint(true);}
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
      {kakaoHint && <InfoBanner text="링크를 복사했어요 😊" sub="카카오톡 앱을 열어서 붙여넣기로 직접 공유해주세요" type="success"/>}
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
function SettingsTab({user,contactEmail,onLogout,onUpdateEmail,canInstallPwa,onInstallClick}) {
  const [notifs,setNotifs]=useState({expire:true,checkout:true,checkin:true});
  const [email,setEmail]=useState(contactEmail||"");
  const [editEmail,setEditEmail]=useState(false);
  const [withdraw,setWithdraw]=useState(null);
  return (
    <div style={{padding:"24px 16px"}}>
      {withdraw==="ask" && <ConfirmModal message={"정말 탈퇴하시겠어요?\n\n탈퇴하면 등록하신 방 정보, 사진, 계약 기록이 모두 삭제돼요.\n삭제된 데이터는 30일 후 완전히 사라지며 복구할 수 없어요.\n그래도 탈퇴하시겠어요?"} okLabel="탈퇴하기" danger onOk={()=>setWithdraw("done")} onClose={()=>setWithdraw(null)}/>}
      {withdraw==="done" && <ConfirmModal message="탈퇴 처리됐어요." okOnly onClose={()=>setWithdraw(null)}/>}
      <h2 style={{fontSize:F.xl,fontWeight:700,marginBottom:20}}>설정 ⚙️</h2>
      <SCard title="내 정보">
        <DataRow label="이름" value={user.name}/>
        <DataRow label="이메일" value={user.email}/>
        <DataRow label="가입 방법" value={user.loginMethod||"이메일"}/>
      </SCard>
      {canInstallPwa && (
        <SCard title="앱 설정">
          <div onClick={onInstallClick} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
            <div><p style={{fontSize:F.base,fontWeight:500}}>홈 화면에 추가</p><p style={{fontSize:F.xs,color:C.gray400,marginTop:2}}>앱처럼 아이콘 눌러 바로 실행돼요</p></div>
            <span style={{color:C.gray400,fontSize:18}}>›</span>
          </div>
        </SCard>
      )}
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
      <button onClick={()=>setWithdraw("ask")} style={{width:"100%",padding:"14px",background:"none",border:"none",fontSize:F.sm,color:C.gray400,cursor:"pointer"}}>회원 탈퇴</button>
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