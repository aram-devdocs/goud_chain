import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c as E}from"./clsx-B-dksMZM.js";import{B as w}from"./Button-DCQss83x.js";import{B as q}from"./enums-Cb1UhVYP.js";import"./index-Dz3UJJSw.js";import"./_commonjsHelpers-CqkleIqs.js";function j({title:C,description:n,icon:c,action:i,className:T}){return e.jsxs("div",{className:E("flex flex-col items-center justify-center py-12 px-6 text-center",T),children:[c&&e.jsx("div",{className:"mb-4 text-zinc-500",children:c}),e.jsx("h3",{className:"text-lg font-semibold text-white mb-2",children:C}),n&&e.jsx("p",{className:"text-sm text-zinc-500 max-w-md mb-4",children:n}),i&&e.jsx(w,{variant:q.Primary,onClick:i.onClick,children:i.label})]})}j.__docgenInfo={description:"",methods:[],displayName:"EmptyState",props:{title:{required:!0,tsType:{name:"string"},description:"Title text"},description:{required:!1,tsType:{name:"string"},description:"Description text"},icon:{required:!1,tsType:{name:"ReactNode"},description:"Optional icon or illustration"},action:{required:!1,tsType:{name:"signature",type:"object",raw:`{
  label: string
  onClick: () => void
}`,signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"onClick",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!0}}]}},description:"Optional action button"},className:{required:!1,tsType:{name:"string"},description:"Custom className"}}};const O={title:"Molecules/EmptyState",component:j,parameters:{layout:"padded"},tags:["autodocs"]},t={args:{title:"No data available",description:"There is no data to display at this time."}},r={args:{title:"No collections yet",description:"Submit some data to get started!",action:{label:"Submit Data",onClick:()=>alert("Navigate to submit page")}}},a={args:{title:"No audit logs found",description:"Try adjusting your filters to see more results."}},s={args:{title:"No peers connected",description:"Your node is not connected to any peers. Check your network configuration.",action:{label:"Refresh",onClick:()=>alert("Refresh peers")}}},o={args:{title:"Waiting for audit events",description:"Events will appear here as they happen in real-time."}};var l,d,p;t.parameters={...t.parameters,docs:{...(l=t.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    title: 'No data available',
    description: 'There is no data to display at this time.'
  }
}`,...(p=(d=t.parameters)==null?void 0:d.docs)==null?void 0:p.source}}};var m,u,g;r.parameters={...r.parameters,docs:{...(m=r.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    title: 'No collections yet',
    description: 'Submit some data to get started!',
    action: {
      label: 'Submit Data',
      onClick: () => alert('Navigate to submit page')
    }
  }
}`,...(g=(u=r.parameters)==null?void 0:u.docs)==null?void 0:g.source}}};var y,f,h;a.parameters={...a.parameters,docs:{...(y=a.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    title: 'No audit logs found',
    description: 'Try adjusting your filters to see more results.'
  }
}`,...(h=(f=a.parameters)==null?void 0:f.docs)==null?void 0:h.source}}};var x,N,b;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    title: 'No peers connected',
    description: 'Your node is not connected to any peers. Check your network configuration.',
    action: {
      label: 'Refresh',
      onClick: () => alert('Refresh peers')
    }
  }
}`,...(b=(N=s.parameters)==null?void 0:N.docs)==null?void 0:b.source}}};var v,k,S;o.parameters={...o.parameters,docs:{...(v=o.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    title: 'Waiting for audit events',
    description: 'Events will appear here as they happen in real-time.'
  }
}`,...(S=(k=o.parameters)==null?void 0:k.docs)==null?void 0:S.source}}};const P=["Default","WithAction","NoAuditLogs","NoPeers","WaitingForEvents"];export{t as Default,a as NoAuditLogs,s as NoPeers,o as WaitingForEvents,r as WithAction,P as __namedExportsOrder,O as default};
