import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c as d}from"./clsx-B-dksMZM.js";function a({value:u,max:c=100,variant:_="primary",showLabel:H=!1,label:m,className:R,...k}){const p=Math.min(100,Math.max(0,u/c*100)),z={primary:"bg-blue-500",success:"bg-green-500",warning:"bg-yellow-500",error:"bg-red-500"};return e.jsxs("div",{className:d("w-full",R),...k,children:[(H||m)&&e.jsxs("div",{className:"flex justify-between mb-1 text-xs text-zinc-400",children:[e.jsx("span",{children:m||"Progress"}),e.jsxs("span",{children:[p.toFixed(0),"%"]})]}),e.jsx("div",{className:"w-full bg-zinc-800 rounded-full h-2",children:e.jsx("div",{className:d("h-2 rounded-full transition-all",z[_]),style:{width:`${p}%`},role:"progressbar","aria-valuenow":u,"aria-valuemin":0,"aria-valuemax":c})})]})}a.__docgenInfo={description:"",methods:[],displayName:"ProgressBar",props:{value:{required:!0,tsType:{name:"number"},description:"Progress value (0-100)"},max:{required:!1,tsType:{name:"number"},description:"Maximum value",defaultValue:{value:"100",computed:!1}},variant:{required:!1,tsType:{name:"union",raw:"'primary' | 'success' | 'warning' | 'error'",elements:[{name:"literal",value:"'primary'"},{name:"literal",value:"'success'"},{name:"literal",value:"'warning'"},{name:"literal",value:"'error'"}]},description:"Visual variant",defaultValue:{value:"'primary'",computed:!1}},showLabel:{required:!1,tsType:{name:"boolean"},description:"Show percentage label",defaultValue:{value:"false",computed:!1}},label:{required:!1,tsType:{name:"string"},description:"Custom label"}},composes:["HTMLAttributes"]};const A={title:"Molecules/ProgressBar",component:a,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{value:{control:{type:"range",min:0,max:100,step:5}},variant:{control:"select",options:["primary","success","warning","error"]},showLabel:{control:"boolean"}}},r={args:{value:60}},s={args:{value:75,showLabel:!0,label:"Upload Progress"}},l={args:{value:45,variant:"primary",showLabel:!0,label:"Primary"}},n={args:{value:100,variant:"success",showLabel:!0,label:"Complete"}},o={args:{value:80,variant:"warning",showLabel:!0,label:"Warning"}},t={args:{value:25,variant:"error",showLabel:!0,label:"Error"}},i={args:{value:50},render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsx(a,{value:100,variant:"success",showLabel:!0,label:"Step 1: Hash Chain Validation"}),e.jsx(a,{value:100,variant:"success",showLabel:!0,label:"Step 2: Merkle Root Verification"}),e.jsx(a,{value:50,variant:"primary",showLabel:!0,label:"Step 3: Signature Validation"}),e.jsx(a,{value:0,showLabel:!0,label:"Step 4: Timestamp Validation"})]})};var g,v,b;r.parameters={...r.parameters,docs:{...(g=r.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    value: 60
  }
}`,...(b=(v=r.parameters)==null?void 0:v.docs)==null?void 0:b.source}}};var h,w,y;s.parameters={...s.parameters,docs:{...(h=s.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    value: 75,
    showLabel: true,
    label: 'Upload Progress'
  }
}`,...(y=(w=s.parameters)==null?void 0:w.docs)==null?void 0:y.source}}};var f,x,L;l.parameters={...l.parameters,docs:{...(f=l.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    value: 45,
    variant: 'primary',
    showLabel: true,
    label: 'Primary'
  }
}`,...(L=(x=l.parameters)==null?void 0:x.docs)==null?void 0:L.source}}};var S,P,j;n.parameters={...n.parameters,docs:{...(S=n.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    value: 100,
    variant: 'success',
    showLabel: true,
    label: 'Complete'
  }
}`,...(j=(P=n.parameters)==null?void 0:P.docs)==null?void 0:j.source}}};var V,T,B;o.parameters={...o.parameters,docs:{...(V=o.parameters)==null?void 0:V.docs,source:{originalSource:`{
  args: {
    value: 80,
    variant: 'warning',
    showLabel: true,
    label: 'Warning'
  }
}`,...(B=(T=o.parameters)==null?void 0:T.docs)==null?void 0:B.source}}};var M,N,C;t.parameters={...t.parameters,docs:{...(M=t.parameters)==null?void 0:M.docs,source:{originalSource:`{
  args: {
    value: 25,
    variant: 'error',
    showLabel: true,
    label: 'Error'
  }
}`,...(C=(N=t.parameters)==null?void 0:N.docs)==null?void 0:C.source}}};var E,W,q;i.parameters={...i.parameters,docs:{...(E=i.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    value: 50
  },
  render: () => <div className="space-y-4">
      <ProgressBar value={100} variant="success" showLabel label="Step 1: Hash Chain Validation" />
      <ProgressBar value={100} variant="success" showLabel label="Step 2: Merkle Root Verification" />
      <ProgressBar value={50} variant="primary" showLabel label="Step 3: Signature Validation" />
      <ProgressBar value={0} showLabel label="Step 4: Timestamp Validation" />
    </div>
}`,...(q=(W=i.parameters)==null?void 0:W.docs)==null?void 0:q.source}}};const F=["Default","WithLabel","Primary","Success","Warning","Error","ValidationProgress"];export{r as Default,t as Error,l as Primary,n as Success,i as ValidationProgress,o as Warning,s as WithLabel,F as __namedExportsOrder,A as default};
