import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{r as q}from"./index-Dz3UJJSw.js";import{c as D}from"./clsx-B-dksMZM.js";import"./_commonjsHelpers-CqkleIqs.js";const o=q.forwardRef(({maxWidth:r="xl",noPadding:y=!1,className:F,children:R,...T},_)=>e.jsx("div",{ref:_,className:D("mx-auto w-full",{"max-w-screen-sm":r==="sm","max-w-screen-md":r==="md","max-w-screen-lg":r==="lg","max-w-screen-xl":r==="xl","max-w-screen-2xl":r==="2xl","max-w-full":r==="full","px-4 sm:px-6 lg:px-8":!y},F),...T,children:R}));o.displayName="Container";o.__docgenInfo={description:"",methods:[],displayName:"Container",props:{maxWidth:{required:!1,tsType:{name:"union",raw:"'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'",elements:[{name:"literal",value:"'sm'"},{name:"literal",value:"'md'"},{name:"literal",value:"'lg'"},{name:"literal",value:"'xl'"},{name:"literal",value:"'2xl'"},{name:"literal",value:"'full'"}]},description:`Maximum width constraint
@default 'xl'`,defaultValue:{value:"'xl'",computed:!1}},noPadding:{required:!1,tsType:{name:"boolean"},description:`Remove horizontal padding
@default false`,defaultValue:{value:"false",computed:!1}}},composes:["HTMLAttributes"]};const O={title:"Primitives/Container",component:o,parameters:{layout:"fullscreen"},tags:["autodocs"],argTypes:{maxWidth:{control:"select",options:["sm","md","lg","xl","2xl","full"],description:"Maximum width constraint"},noPadding:{control:"boolean",description:"Remove horizontal padding"}}},a={args:{children:e.jsx("div",{className:"bg-zinc-800 border border-zinc-700 rounded-lg p-6",children:e.jsx("p",{className:"text-white",children:"Container with default max-width (xl) and responsive padding"})})}},s={args:{maxWidth:"sm",children:e.jsx("div",{className:"bg-zinc-800 border border-zinc-700 rounded-lg p-6",children:e.jsx("p",{className:"text-white",children:"Small container (max-width: 640px)"})})}},d={args:{maxWidth:"md",children:e.jsx("div",{className:"bg-zinc-800 border border-zinc-700 rounded-lg p-6",children:e.jsx("p",{className:"text-white",children:"Medium container (max-width: 768px)"})})}},i={args:{maxWidth:"lg",children:e.jsx("div",{className:"bg-zinc-800 border border-zinc-700 rounded-lg p-6",children:e.jsx("p",{className:"text-white",children:"Large container (max-width: 1024px)"})})}},n={args:{maxWidth:"xl",children:e.jsx("div",{className:"bg-zinc-800 border border-zinc-700 rounded-lg p-6",children:e.jsx("p",{className:"text-white",children:"Extra large container (max-width: 1280px)"})})}},t={args:{maxWidth:"full",children:e.jsx("div",{className:"bg-zinc-800 border border-zinc-700 rounded-lg p-6",children:e.jsx("p",{className:"text-white",children:"Full width container (no max-width constraint)"})})}},l={args:{noPadding:!0,children:e.jsx("div",{className:"bg-zinc-800 border border-zinc-700 rounded-lg p-6",children:e.jsx("p",{className:"text-white",children:"Container with no horizontal padding"})})}};var c,m,p;a.parameters={...a.parameters,docs:{...(c=a.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    children: <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <p className="text-white">
          Container with default max-width (xl) and responsive padding
        </p>
      </div>
  }
}`,...(p=(m=a.parameters)==null?void 0:m.docs)==null?void 0:p.source}}};var x,u,g;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    maxWidth: 'sm',
    children: <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <p className="text-white">Small container (max-width: 640px)</p>
      </div>
  }
}`,...(g=(u=s.parameters)==null?void 0:u.docs)==null?void 0:g.source}}};var h,b,w;d.parameters={...d.parameters,docs:{...(h=d.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    maxWidth: 'md',
    children: <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <p className="text-white">Medium container (max-width: 768px)</p>
      </div>
  }
}`,...(w=(b=d.parameters)==null?void 0:b.docs)==null?void 0:w.source}}};var v,N,z;i.parameters={...i.parameters,docs:{...(v=i.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    maxWidth: 'lg',
    children: <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <p className="text-white">Large container (max-width: 1024px)</p>
      </div>
  }
}`,...(z=(N=i.parameters)==null?void 0:N.docs)==null?void 0:z.source}}};var f,j,S;n.parameters={...n.parameters,docs:{...(f=n.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    maxWidth: 'xl',
    children: <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <p className="text-white">Extra large container (max-width: 1280px)</p>
      </div>
  }
}`,...(S=(j=n.parameters)==null?void 0:j.docs)==null?void 0:S.source}}};var C,E,L;t.parameters={...t.parameters,docs:{...(C=t.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    maxWidth: 'full',
    children: <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <p className="text-white">
          Full width container (no max-width constraint)
        </p>
      </div>
  }
}`,...(L=(E=t.parameters)==null?void 0:E.docs)==null?void 0:L.source}}};var M,P,W;l.parameters={...l.parameters,docs:{...(M=l.parameters)==null?void 0:M.docs,source:{originalSource:`{
  args: {
    noPadding: true,
    children: <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <p className="text-white">Container with no horizontal padding</p>
      </div>
  }
}`,...(W=(P=l.parameters)==null?void 0:P.docs)==null?void 0:W.source}}};const k=["Default","Small","Medium","Large","ExtraLarge","Full","NoPadding"];export{a as Default,n as ExtraLarge,t as Full,i as Large,d as Medium,l as NoPadding,s as Small,k as __namedExportsOrder,O as default};
