import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c as y}from"./clsx-B-dksMZM.js";import{S as s}from"./enums-Cb1UhVYP.js";function a({size:l=s.Medium,className:M}){return e.jsx("div",{className:y("inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent",{"h-4 w-4":l===s.Small,"h-8 w-8":l===s.Medium,"h-12 w-12":l===s.Large},M),role:"status",children:e.jsx("span",{className:"sr-only",children:"Loading..."})})}a.__docgenInfo={description:"",methods:[],displayName:"Spinner",props:{size:{required:!1,tsType:{name:"SpinnerSize"},description:"",defaultValue:{value:"SpinnerSize.Medium",computed:!0}},className:{required:!1,tsType:{name:"string"},description:""}}};const A={title:"Atoms/Spinner",component:a,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{size:{control:"select",options:Object.values(s)}}},r={args:{size:s.Small}},n={args:{size:s.Medium}},i={args:{size:s.Large}},t={args:{size:s.Medium},render:()=>e.jsxs("div",{className:"flex items-end gap-8",children:[e.jsxs("div",{className:"flex flex-col items-center gap-2",children:[e.jsx(a,{size:s.Small}),e.jsx("span",{className:"text-xs text-zinc-400",children:"Small"})]}),e.jsxs("div",{className:"flex flex-col items-center gap-2",children:[e.jsx(a,{size:s.Medium}),e.jsx("span",{className:"text-xs text-zinc-400",children:"Medium"})]}),e.jsxs("div",{className:"flex flex-col items-center gap-2",children:[e.jsx(a,{size:s.Large}),e.jsx("span",{className:"text-xs text-zinc-400",children:"Large"})]})]})},c={args:{size:s.Large},render:()=>e.jsxs("div",{className:"flex flex-col items-center justify-center h-64 gap-4",children:[e.jsx(a,{size:s.Large}),e.jsx("p",{className:"text-zinc-400",children:"Loading data..."})]})};var o,m,d;r.parameters={...r.parameters,docs:{...(o=r.parameters)==null?void 0:o.docs,source:{originalSource:`{
  args: {
    size: SpinnerSize.Small
  }
}`,...(d=(m=r.parameters)==null?void 0:m.docs)==null?void 0:d.source}}};var p,x,S;n.parameters={...n.parameters,docs:{...(p=n.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    size: SpinnerSize.Medium
  }
}`,...(S=(x=n.parameters)==null?void 0:x.docs)==null?void 0:S.source}}};var u,g,z;i.parameters={...i.parameters,docs:{...(u=i.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    size: SpinnerSize.Large
  }
}`,...(z=(g=i.parameters)==null?void 0:g.docs)==null?void 0:z.source}}};var f,N,j;t.parameters={...t.parameters,docs:{...(f=t.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    size: SpinnerSize.Medium
  },
  render: () => <div className="flex items-end gap-8">
      <div className="flex flex-col items-center gap-2">
        <Spinner size={SpinnerSize.Small} />
        <span className="text-xs text-zinc-400">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size={SpinnerSize.Medium} />
        <span className="text-xs text-zinc-400">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size={SpinnerSize.Large} />
        <span className="text-xs text-zinc-400">Large</span>
      </div>
    </div>
}`,...(j=(N=t.parameters)==null?void 0:N.docs)==null?void 0:j.source}}};var v,L,h;c.parameters={...c.parameters,docs:{...(v=c.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    size: SpinnerSize.Large
  },
  render: () => <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Spinner size={SpinnerSize.Large} />
      <p className="text-zinc-400">Loading data...</p>
    </div>
}`,...(h=(L=c.parameters)==null?void 0:L.docs)==null?void 0:h.source}}};const T=["Small","Medium","Large","AllSizes","LoadingState"];export{t as AllSizes,i as Large,c as LoadingState,n as Medium,r as Small,T as __namedExportsOrder,A as default};
