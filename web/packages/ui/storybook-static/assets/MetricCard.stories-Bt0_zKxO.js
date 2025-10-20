import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c as t}from"./clsx-B-dksMZM.js";import{f as R}from"./format-BJ_07i_r.js";function r({label:L,value:z,description:D,lastUpdated:d,variant:M="blue",className:O,...j}){const a={blue:{bg:"from-blue-950/50 to-blue-900/30",border:"border-blue-800/50",label:"text-blue-300",value:"text-blue-400",description:"text-blue-300/60"},green:{bg:"from-green-950/50 to-green-900/30",border:"border-green-800/50",label:"text-green-300",value:"text-green-400",description:"text-green-300/60"},purple:{bg:"from-purple-950/50 to-purple-900/30",border:"border-purple-800/50",label:"text-purple-300",value:"text-purple-400",description:"text-purple-300/60"},yellow:{bg:"from-yellow-950/50 to-yellow-900/30",border:"border-yellow-800/50",label:"text-yellow-300",value:"text-yellow-400",description:"text-yellow-300/60"},red:{bg:"from-red-950/50 to-red-900/30",border:"border-red-800/50",label:"text-red-300",value:"text-red-400",description:"text-red-300/60"},zinc:{bg:"from-zinc-900/50 to-zinc-800/30",border:"border-zinc-700/50",label:"text-zinc-300",value:"text-zinc-100",description:"text-zinc-400"}}[M];return e.jsxs("div",{className:t("bg-gradient-to-br rounded-lg p-6 border",a.bg,a.border,O),...j,children:[e.jsx("div",{className:t("text-xs mb-2 font-medium",a.label),children:L}),e.jsx("div",{className:t("text-4xl font-bold mb-1",a.value),children:z}),e.jsx("div",{className:t("text-xs",a.description),children:D}),d&&e.jsxs("div",{className:"text-xs text-zinc-500 mt-2",children:["Updated ",R(d)]})]})}r.__docgenInfo={description:"",methods:[],displayName:"MetricCard",props:{label:{required:!0,tsType:{name:"string"},description:"Metric label (small text at top)"},value:{required:!0,tsType:{name:"union",raw:"string | number",elements:[{name:"string"},{name:"number"}]},description:"Main metric value (large number)"},description:{required:!0,tsType:{name:"string"},description:"Description below the value"},lastUpdated:{required:!1,tsType:{name:"number"},description:'Timestamp for "Updated X ago" text'},variant:{required:!1,tsType:{name:"union",raw:"'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'zinc'",elements:[{name:"literal",value:"'blue'"},{name:"literal",value:"'green'"},{name:"literal",value:"'purple'"},{name:"literal",value:"'yellow'"},{name:"literal",value:"'red'"},{name:"literal",value:"'zinc'"}]},description:"Color variant for gradient and text",defaultValue:{value:"'blue'",computed:!1}}},composes:["HTMLAttributes"]};const B={title:"Molecules/MetricCard",component:r,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["blue","green","purple","yellow","red","zinc"]}}},l={args:{label:"BLOCKCHAIN",value:"1,234",description:"Total Blocks",lastUpdated:Date.now(),variant:"blue"}},n={args:{label:"COLLECTIONS",value:"42",description:"Your Data",lastUpdated:Date.now()-12e4,variant:"green"}},i={args:{label:"NETWORK",value:"4",description:"Connected Peers",lastUpdated:Date.now()-6e4,variant:"purple"}},o={args:{label:"CONNECTION",value:"Live",description:"WebSocket Status",variant:"zinc"}},s={args:{label:"METRIC",value:"100",description:"Description",lastUpdated:Date.now()},render:()=>e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsx(r,{label:"BLUE",value:"123",description:"Blue variant",variant:"blue"}),e.jsx(r,{label:"GREEN",value:"456",description:"Green variant",variant:"green"}),e.jsx(r,{label:"PURPLE",value:"789",description:"Purple variant",variant:"purple"}),e.jsx(r,{label:"YELLOW",value:"321",description:"Yellow variant",variant:"yellow"}),e.jsx(r,{label:"RED",value:"654",description:"Red variant",variant:"red"}),e.jsx(r,{label:"ZINC",value:"987",description:"Zinc variant",variant:"zinc"})]})};var c,p,u;l.parameters={...l.parameters,docs:{...(c=l.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    label: 'BLOCKCHAIN',
    value: '1,234',
    description: 'Total Blocks',
    lastUpdated: Date.now(),
    variant: 'blue'
  }
}`,...(u=(p=l.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};var v,b,m;n.parameters={...n.parameters,docs:{...(v=n.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    label: 'COLLECTIONS',
    value: '42',
    description: 'Your Data',
    lastUpdated: Date.now() - 120000,
    variant: 'green'
  }
}`,...(m=(b=n.parameters)==null?void 0:b.docs)==null?void 0:m.source}}};var g,x,C;i.parameters={...i.parameters,docs:{...(g=i.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    label: 'NETWORK',
    value: '4',
    description: 'Connected Peers',
    lastUpdated: Date.now() - 60000,
    variant: 'purple'
  }
}`,...(C=(x=i.parameters)==null?void 0:x.docs)==null?void 0:C.source}}};var w,N,f;o.parameters={...o.parameters,docs:{...(w=o.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    label: 'CONNECTION',
    value: 'Live',
    description: 'WebSocket Status',
    variant: 'zinc'
  }
}`,...(f=(N=o.parameters)==null?void 0:N.docs)==null?void 0:f.source}}};var E,y,T;s.parameters={...s.parameters,docs:{...(E=s.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    label: 'METRIC',
    value: '100',
    description: 'Description',
    lastUpdated: Date.now()
  },
  render: () => <div className="grid grid-cols-2 gap-4">
      <MetricCard label="BLUE" value="123" description="Blue variant" variant="blue" />
      <MetricCard label="GREEN" value="456" description="Green variant" variant="green" />
      <MetricCard label="PURPLE" value="789" description="Purple variant" variant="purple" />
      <MetricCard label="YELLOW" value="321" description="Yellow variant" variant="yellow" />
      <MetricCard label="RED" value="654" description="Red variant" variant="red" />
      <MetricCard label="ZINC" value="987" description="Zinc variant" variant="zinc" />
    </div>
}`,...(T=(y=s.parameters)==null?void 0:y.docs)==null?void 0:T.source}}};const k=["Blockchain","Collections","Network","Connection","AllVariants"];export{s as AllVariants,l as Blockchain,n as Collections,o as Connection,i as Network,k as __namedExportsOrder,B as default};
