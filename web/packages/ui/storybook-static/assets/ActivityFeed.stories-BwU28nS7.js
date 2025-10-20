import{j as t}from"./jsx-runtime-D_zvdyIk.js";import{c as $}from"./clsx-B-dksMZM.js";import{f as H}from"./format-BJ_07i_r.js";import{C as M,a as q,b as F}from"./Card-Dr1Akg1L.js";const R=e=>{switch(e){case"blockchain":return"BLOCK";case"collection":return"DATA";case"peer":return"PEER";case"audit":return"AUDIT";case"metrics":return"STATS";default:return"INFO"}},_=e=>{switch(e){case"blockchain":return"bg-blue-500/20 text-blue-400";case"collection":return"bg-green-500/20 text-green-400";case"peer":return"bg-purple-500/20 text-purple-400";case"audit":return"bg-yellow-500/20 text-yellow-400";case"metrics":return"bg-zinc-500/20 text-zinc-400";default:return"bg-blue-500/20 text-blue-400"}};function k({activities:e,onClear:a,maxHeight:z="400px",maxItems:D=10}){const I=e.slice(0,D);return t.jsxs(M,{className:"overflow-hidden",children:[t.jsxs(q,{className:"bg-zinc-900/50 px-6 py-4 border-b border-zinc-800 flex flex-row items-center justify-between mb-0",children:[t.jsx(F,{children:"Recent Activity"}),e.length>0&&a&&t.jsx("button",{onClick:a,className:"text-xs text-zinc-400 hover:text-white transition",type:"button",children:"Clear"})]}),t.jsxs("div",{className:"divide-y divide-zinc-800",style:{maxHeight:z,overflowY:"auto"},children:[I.map(i=>t.jsx("div",{className:"px-6 py-3 hover:bg-zinc-900/50 transition",children:t.jsxs("div",{className:"flex items-start gap-3",children:[t.jsx("div",{className:$("text-xs font-mono font-bold px-2 py-1 rounded",_(i.type)),children:R(i.type)}),t.jsxs("div",{className:"flex-1 min-w-0",children:[t.jsx("p",{className:"text-sm text-white",children:i.message}),t.jsx("p",{className:"text-xs text-zinc-500 mt-1",children:H(i.timestamp)})]})]})},i.id)),e.length===0&&t.jsxs("div",{className:"px-6 py-12 text-center text-zinc-500",children:[t.jsx("p",{children:"No recent activity"}),t.jsx("p",{className:"text-xs mt-1",children:"Events will appear here as they happen"})]})]})]})}k.__docgenInfo={description:"",methods:[],displayName:"ActivityFeed",props:{activities:{required:!0,tsType:{name:"Array",elements:[{name:"ActivityEvent"}],raw:"ActivityEvent[]"},description:"Array of activity events"},onClear:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Callback when clear button is clicked"},maxHeight:{required:!1,tsType:{name:"string"},description:"Maximum height for scrollable area (default: 400px)",defaultValue:{value:"'400px'",computed:!1}},maxItems:{required:!1,tsType:{name:"number"},description:"Maximum number of activities to display (default: 10)",defaultValue:{value:"10",computed:!1}}}};const U={title:"Molecules/ActivityFeed",component:k,parameters:{layout:"padded"},tags:["autodocs"]},s=[{id:"1",type:"blockchain",message:"New block #1234 created by validator node-1",timestamp:Date.now()-3e4},{id:"2",type:"collection",message:'New collection "user-data" created',timestamp:Date.now()-12e4},{id:"3",type:"peer",message:"Peer node-2 connected",timestamp:Date.now()-18e4},{id:"4",type:"audit",message:"User logged in successfully",timestamp:Date.now()-3e5},{id:"5",type:"metrics",message:"Cache hit rate: 98.5%",timestamp:Date.now()-45e4}],r={args:{activities:s}},c={args:{activities:s,onClear:()=>console.log("Clear clicked")}},n={args:{activities:[]}},o={args:{activities:[s[0]]}},m={args:{activities:[...s,...s.map((e,a)=>({...e,id:`${e.id}-dup-${a}`,timestamp:e.timestamp-6e5}))],maxHeight:"300px"}},l={args:{activities:[...s,...s.map((e,a)=>({...e,id:`${e.id}-dup-${a}`,timestamp:e.timestamp-6e5}))],maxItems:5}};var d,p,u;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    activities: sampleActivities
  }
}`,...(u=(p=r.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};var x,g,v;c.parameters={...c.parameters,docs:{...(x=c.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    activities: sampleActivities,
    onClear: () => console.log('Clear clicked')
  }
}`,...(v=(g=c.parameters)==null?void 0:g.docs)==null?void 0:v.source}}};var h,y,f;n.parameters={...n.parameters,docs:{...(h=n.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    activities: []
  }
}`,...(f=(y=n.parameters)==null?void 0:y.docs)==null?void 0:f.source}}};var b,A,w;o.parameters={...o.parameters,docs:{...(b=o.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    activities: [sampleActivities[0]!]
  }
}`,...(w=(A=o.parameters)==null?void 0:A.docs)==null?void 0:w.source}}};var C,j,N;m.parameters={...m.parameters,docs:{...(C=m.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    activities: [...sampleActivities, ...sampleActivities.map((a, i) => ({
      ...a,
      id: \`\${a.id}-dup-\${i}\`,
      timestamp: a.timestamp - 600000
    }))],
    maxHeight: '300px'
  }
}`,...(N=(j=m.parameters)==null?void 0:j.docs)==null?void 0:N.source}}};var E,S,T;l.parameters={...l.parameters,docs:{...(E=l.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    activities: [...sampleActivities, ...sampleActivities.map((a, i) => ({
      ...a,
      id: \`\${a.id}-dup-\${i}\`,
      timestamp: a.timestamp - 600000
    }))],
    maxItems: 5
  }
}`,...(T=(S=l.parameters)==null?void 0:S.docs)==null?void 0:T.source}}};const V=["Default","WithClearButton","Empty","SingleEvent","CustomMaxHeight","LimitedItems"];export{m as CustomMaxHeight,r as Default,n as Empty,l as LimitedItems,o as SingleEvent,c as WithClearButton,V as __namedExportsOrder,U as default};
