import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c as Y}from"./clsx-B-dksMZM.js";function a({variant:r="default",size:g="md",className:Q,children:U,...X}){return e.jsx("span",{className:Y("inline-flex items-center font-medium rounded border",{"bg-zinc-900/20 border-zinc-700 text-zinc-400":r==="default","bg-blue-900/20 border-blue-700 text-blue-400":r==="primary","bg-green-900/20 border-green-700 text-green-400":r==="success","bg-red-900/20 border-red-700 text-red-400":r==="error","bg-yellow-900/20 border-yellow-700 text-yellow-400":r==="warning","bg-cyan-900/20 border-cyan-700 text-cyan-400":r==="info","px-1.5 py-0.5 text-xs":g==="sm","px-2 py-1 text-xs":g==="md","px-2.5 py-1 text-sm":g==="lg"},Q),...X,children:U})}a.__docgenInfo={description:"",methods:[],displayName:"Badge",props:{variant:{required:!1,tsType:{name:"union",raw:`| 'default'
| 'primary'
| 'success'
| 'error'
| 'warning'
| 'info'`,elements:[{name:"literal",value:"'default'"},{name:"literal",value:"'primary'"},{name:"literal",value:"'success'"},{name:"literal",value:"'error'"},{name:"literal",value:"'warning'"},{name:"literal",value:"'info'"}]},description:"Visual variant",defaultValue:{value:"'default'",computed:!1}},size:{required:!1,tsType:{name:"union",raw:"'sm' | 'md' | 'lg'",elements:[{name:"literal",value:"'sm'"},{name:"literal",value:"'md'"},{name:"literal",value:"'lg'"}]},description:"Size variant",defaultValue:{value:"'md'",computed:!1}}},composes:["HTMLAttributes"]};const ee={title:"Atoms/Badge",component:a,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["default","primary","success","error","warning","info"]},size:{control:"select",options:["sm","md","lg"]}}},s={args:{children:"Default"}},n={args:{variant:"primary",children:"Primary"}},t={args:{variant:"success",children:"Success"}},c={args:{variant:"error",children:"Error"}},i={args:{variant:"warning",children:"Warning"}},o={args:{variant:"info",children:"Info"}},l={args:{size:"sm",children:"Small"}},d={args:{size:"md",children:"Medium"}},m={args:{size:"lg",children:"Large"}},p={render:()=>e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx(a,{variant:"default",children:"Default"}),e.jsx(a,{variant:"primary",children:"Primary"}),e.jsx(a,{variant:"success",children:"Success"}),e.jsx(a,{variant:"error",children:"Error"}),e.jsx(a,{variant:"warning",children:"Warning"}),e.jsx(a,{variant:"info",children:"Info"})]})},u={render:()=>e.jsxs("div",{className:"flex flex-col gap-2",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(a,{variant:"success",children:"AccountCreated"}),e.jsx("span",{className:"text-zinc-400 text-sm",children:"Account Created"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(a,{variant:"primary",children:"AccountLogin"}),e.jsx("span",{className:"text-zinc-400 text-sm",children:"Login Event"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(a,{variant:"info",children:"DataSubmitted"}),e.jsx("span",{className:"text-zinc-400 text-sm",children:"Data Submission"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(a,{variant:"warning",children:"DataDecrypted"}),e.jsx("span",{className:"text-zinc-400 text-sm",children:"Decryption Event"})]})]})};var x,v,f;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    children: 'Default'
  }
}`,...(f=(v=s.parameters)==null?void 0:v.docs)==null?void 0:f.source}}};var h,y,S;n.parameters={...n.parameters,docs:{...(h=n.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    variant: 'primary',
    children: 'Primary'
  }
}`,...(S=(y=n.parameters)==null?void 0:y.docs)==null?void 0:S.source}}};var j,B,N;t.parameters={...t.parameters,docs:{...(j=t.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    variant: 'success',
    children: 'Success'
  }
}`,...(N=(B=t.parameters)==null?void 0:B.docs)==null?void 0:N.source}}};var b,z,w;c.parameters={...c.parameters,docs:{...(b=c.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    variant: 'error',
    children: 'Error'
  }
}`,...(w=(z=c.parameters)==null?void 0:z.docs)==null?void 0:w.source}}};var D,E,A;i.parameters={...i.parameters,docs:{...(D=i.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    variant: 'warning',
    children: 'Warning'
  }
}`,...(A=(E=i.parameters)==null?void 0:E.docs)==null?void 0:A.source}}};var L,I,P;o.parameters={...o.parameters,docs:{...(L=o.parameters)==null?void 0:L.docs,source:{originalSource:`{
  args: {
    variant: 'info',
    children: 'Info'
  }
}`,...(P=(I=o.parameters)==null?void 0:I.docs)==null?void 0:P.source}}};var T,W,M;l.parameters={...l.parameters,docs:{...(T=l.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    size: 'sm',
    children: 'Small'
  }
}`,...(M=(W=l.parameters)==null?void 0:W.docs)==null?void 0:M.source}}};var V,C,_;d.parameters={...d.parameters,docs:{...(V=d.parameters)==null?void 0:V.docs,source:{originalSource:`{
  args: {
    size: 'md',
    children: 'Medium'
  }
}`,...(_=(C=d.parameters)==null?void 0:C.docs)==null?void 0:_.source}}};var q,H,O;m.parameters={...m.parameters,docs:{...(q=m.parameters)==null?void 0:q.docs,source:{originalSource:`{
  args: {
    size: 'lg',
    children: 'Large'
  }
}`,...(O=(H=m.parameters)==null?void 0:H.docs)==null?void 0:O.source}}};var R,k,F;p.parameters={...p.parameters,docs:{...(R=p.parameters)==null?void 0:R.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
    </div>
}`,...(F=(k=p.parameters)==null?void 0:k.docs)==null?void 0:F.source}}};var G,J,K;u.parameters={...u.parameters,docs:{...(G=u.parameters)==null?void 0:G.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="success">AccountCreated</Badge>
        <span className="text-zinc-400 text-sm">Account Created</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="primary">AccountLogin</Badge>
        <span className="text-zinc-400 text-sm">Login Event</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="info">DataSubmitted</Badge>
        <span className="text-zinc-400 text-sm">Data Submission</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="warning">DataDecrypted</Badge>
        <span className="text-zinc-400 text-sm">Decryption Event</span>
      </div>
    </div>
}`,...(K=(J=u.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};const ae=["Default","Primary","Success","Error","Warning","Info","Small","Medium","Large","AllVariants","EventTypes"];export{p as AllVariants,s as Default,c as Error,u as EventTypes,o as Info,m as Large,d as Medium,n as Primary,l as Small,t as Success,i as Warning,ae as __namedExportsOrder,ee as default};
