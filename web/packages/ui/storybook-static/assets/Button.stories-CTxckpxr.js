import{j as a}from"./jsx-runtime-D_zvdyIk.js";import{B as e}from"./Button-DCQss83x.js";import{B as r,a as n}from"./enums-Cb1UhVYP.js";import"./index-Dz3UJJSw.js";import"./_commonjsHelpers-CqkleIqs.js";import"./clsx-B-dksMZM.js";const X={title:"Atoms/Button",component:e,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{variant:{control:"select",options:Object.values(r)},size:{control:"select",options:Object.values(n)},disabled:{control:"boolean"}}},t={args:{variant:r.Primary,children:"Primary Button"}},s={args:{variant:r.Secondary,children:"Secondary Button"}},o={args:{variant:r.Danger,children:"Danger Button"}},i={args:{variant:r.Ghost,children:"Ghost Button"}},d={args:{size:n.Small,children:"Small Button"}},c={args:{size:n.Medium,children:"Medium Button"}},l={args:{size:n.Large,children:"Large Button"}},u={args:{disabled:!0,children:"Disabled Button"}},m={render:()=>a.jsxs("div",{className:"flex flex-col gap-4",children:[a.jsxs("div",{className:"flex gap-4",children:[a.jsx(e,{variant:r.Primary,children:"Primary"}),a.jsx(e,{variant:r.Secondary,children:"Secondary"}),a.jsx(e,{variant:r.Danger,children:"Danger"}),a.jsx(e,{variant:r.Ghost,children:"Ghost"})]}),a.jsxs("div",{className:"flex gap-4",children:[a.jsx(e,{variant:r.Primary,disabled:!0,children:"Primary Disabled"}),a.jsx(e,{variant:r.Secondary,disabled:!0,children:"Secondary Disabled"}),a.jsx(e,{variant:r.Danger,disabled:!0,children:"Danger Disabled"}),a.jsx(e,{variant:r.Ghost,disabled:!0,children:"Ghost Disabled"})]})]})},p={render:()=>a.jsxs("div",{className:"flex items-center gap-4",children:[a.jsx(e,{size:n.Small,children:"Small"}),a.jsx(e,{size:n.Medium,children:"Medium"}),a.jsx(e,{size:n.Large,children:"Large"})]})};var B,g,h;t.parameters={...t.parameters,docs:{...(B=t.parameters)==null?void 0:B.docs,source:{originalSource:`{
  args: {
    variant: ButtonVariant.Primary,
    children: 'Primary Button'
  }
}`,...(h=(g=t.parameters)==null?void 0:g.docs)==null?void 0:h.source}}};var S,v,y;s.parameters={...s.parameters,docs:{...(S=s.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    variant: ButtonVariant.Secondary,
    children: 'Secondary Button'
  }
}`,...(y=(v=s.parameters)==null?void 0:v.docs)==null?void 0:y.source}}};var x,b,D;o.parameters={...o.parameters,docs:{...(x=o.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    variant: ButtonVariant.Danger,
    children: 'Danger Button'
  }
}`,...(D=(b=o.parameters)==null?void 0:b.docs)==null?void 0:D.source}}};var z,j,V;i.parameters={...i.parameters,docs:{...(z=i.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    variant: ButtonVariant.Ghost,
    children: 'Ghost Button'
  }
}`,...(V=(j=i.parameters)==null?void 0:j.docs)==null?void 0:V.source}}};var f,G,P;d.parameters={...d.parameters,docs:{...(f=d.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    size: ButtonSize.Small,
    children: 'Small Button'
  }
}`,...(P=(G=d.parameters)==null?void 0:G.docs)==null?void 0:P.source}}};var L,M,N;c.parameters={...c.parameters,docs:{...(L=c.parameters)==null?void 0:L.docs,source:{originalSource:`{
  args: {
    size: ButtonSize.Medium,
    children: 'Medium Button'
  }
}`,...(N=(M=c.parameters)==null?void 0:M.docs)==null?void 0:N.source}}};var A,O,E;l.parameters={...l.parameters,docs:{...(A=l.parameters)==null?void 0:A.docs,source:{originalSource:`{
  args: {
    size: ButtonSize.Large,
    children: 'Large Button'
  }
}`,...(E=(O=l.parameters)==null?void 0:O.docs)==null?void 0:E.source}}};var _,R,T;u.parameters={...u.parameters,docs:{...(_=u.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    disabled: true,
    children: 'Disabled Button'
  }
}`,...(T=(R=u.parameters)==null?void 0:R.docs)==null?void 0:T.source}}};var k,q,w;m.parameters={...m.parameters,docs:{...(k=m.parameters)==null?void 0:k.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button variant={ButtonVariant.Primary}>Primary</Button>
        <Button variant={ButtonVariant.Secondary}>Secondary</Button>
        <Button variant={ButtonVariant.Danger}>Danger</Button>
        <Button variant={ButtonVariant.Ghost}>Ghost</Button>
      </div>
      <div className="flex gap-4">
        <Button variant={ButtonVariant.Primary} disabled>
          Primary Disabled
        </Button>
        <Button variant={ButtonVariant.Secondary} disabled>
          Secondary Disabled
        </Button>
        <Button variant={ButtonVariant.Danger} disabled>
          Danger Disabled
        </Button>
        <Button variant={ButtonVariant.Ghost} disabled>
          Ghost Disabled
        </Button>
      </div>
    </div>
}`,...(w=(q=m.parameters)==null?void 0:q.docs)==null?void 0:w.source}}};var C,F,H;p.parameters={...p.parameters,docs:{...(C=p.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-4">
      <Button size={ButtonSize.Small}>Small</Button>
      <Button size={ButtonSize.Medium}>Medium</Button>
      <Button size={ButtonSize.Large}>Large</Button>
    </div>
}`,...(H=(F=p.parameters)==null?void 0:F.docs)==null?void 0:H.source}}};const Y=["Primary","Secondary","Danger","Ghost","Small","Medium","Large","Disabled","AllVariants","AllSizes"];export{p as AllSizes,m as AllVariants,o as Danger,u as Disabled,i as Ghost,l as Large,c as Medium,t as Primary,s as Secondary,d as Small,Y as __namedExportsOrder,X as default};
