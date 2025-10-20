import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{r as C}from"./index-Dz3UJJSw.js";import{c as D}from"./clsx-B-dksMZM.js";import"./_commonjsHelpers-CqkleIqs.js";function a({level:m=1,as:O,className:R,children:$,...k}){const l=O??m,B=`h${m}`;return C.createElement(B,{className:D("font-bold text-white",{"text-4xl":l===1,"text-3xl":l===2,"text-2xl":l===3,"text-xl":l===4,"text-lg":l===5,"text-base":l===6},R),...k},$)}a.__docgenInfo={description:"",methods:[],displayName:"Heading",props:{level:{required:!1,tsType:{name:"union",raw:"1 | 2 | 3 | 4 | 5 | 6",elements:[{name:"literal",value:"1"},{name:"literal",value:"2"},{name:"literal",value:"3"},{name:"literal",value:"4"},{name:"literal",value:"5"},{name:"literal",value:"6"}]},description:"Heading level (h1-h6)",defaultValue:{value:"1",computed:!1}},as:{required:!1,tsType:{name:"union",raw:"1 | 2 | 3 | 4 | 5 | 6",elements:[{name:"literal",value:"1"},{name:"literal",value:"2"},{name:"literal",value:"3"},{name:"literal",value:"4"},{name:"literal",value:"5"},{name:"literal",value:"6"}]},description:"Visual styling (can differ from semantic level)"}},composes:["HTMLAttributes"]};const P={title:"Atoms/Heading",component:a,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{level:{control:"select",options:[1,2,3,4,5,6]},as:{control:"select",options:[1,2,3,4,5,6]}}},n={args:{level:1,children:"Heading Level 1"}},s={args:{level:2,children:"Heading Level 2"}},r={args:{level:3,children:"Heading Level 3"}},i={args:{level:4,children:"Heading Level 4"}},t={args:{level:5,children:"Heading Level 5"}},d={args:{level:6,children:"Heading Level 6"}},c={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsx(a,{level:1,children:"Heading Level 1"}),e.jsx(a,{level:2,children:"Heading Level 2"}),e.jsx(a,{level:3,children:"Heading Level 3"}),e.jsx(a,{level:4,children:"Heading Level 4"}),e.jsx(a,{level:5,children:"Heading Level 5"}),e.jsx(a,{level:6,children:"Heading Level 6"})]})},o={render:()=>e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-zinc-500 mb-1",children:"Semantic h3, styled as h1:"}),e.jsx(a,{level:3,as:1,children:"Large Visual Heading"})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-zinc-500 mb-1",children:"Semantic h1, styled as h4:"}),e.jsx(a,{level:1,as:4,children:"Small Visual Heading"})]})]})};var v,g,p;n.parameters={...n.parameters,docs:{...(v=n.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    level: 1,
    children: 'Heading Level 1'
  }
}`,...(p=(g=n.parameters)==null?void 0:g.docs)==null?void 0:p.source}}};var H,u,x;s.parameters={...s.parameters,docs:{...(H=s.parameters)==null?void 0:H.docs,source:{originalSource:`{
  args: {
    level: 2,
    children: 'Heading Level 2'
  }
}`,...(x=(u=s.parameters)==null?void 0:u.docs)==null?void 0:x.source}}};var h,L,j;r.parameters={...r.parameters,docs:{...(h=r.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    level: 3,
    children: 'Heading Level 3'
  }
}`,...(j=(L=r.parameters)==null?void 0:L.docs)==null?void 0:j.source}}};var S,f,y;i.parameters={...i.parameters,docs:{...(S=i.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    level: 4,
    children: 'Heading Level 4'
  }
}`,...(y=(f=i.parameters)==null?void 0:f.docs)==null?void 0:y.source}}};var N,V,b;t.parameters={...t.parameters,docs:{...(N=t.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    level: 5,
    children: 'Heading Level 5'
  }
}`,...(b=(V=t.parameters)==null?void 0:V.docs)==null?void 0:b.source}}};var z,A,E;d.parameters={...d.parameters,docs:{...(z=d.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    level: 6,
    children: 'Heading Level 6'
  }
}`,...(E=(A=d.parameters)==null?void 0:A.docs)==null?void 0:E.source}}};var T,_,w;c.parameters={...c.parameters,docs:{...(T=c.parameters)==null?void 0:T.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">
      <Heading level={1}>Heading Level 1</Heading>
      <Heading level={2}>Heading Level 2</Heading>
      <Heading level={3}>Heading Level 3</Heading>
      <Heading level={4}>Heading Level 4</Heading>
      <Heading level={5}>Heading Level 5</Heading>
      <Heading level={6}>Heading Level 6</Heading>
    </div>
}`,...(w=(_=c.parameters)==null?void 0:_.docs)==null?void 0:w.source}}};var q,I,M;o.parameters={...o.parameters,docs:{...(q=o.parameters)==null?void 0:q.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">
      <div>
        <p className="text-xs text-zinc-500 mb-1">Semantic h3, styled as h1:</p>
        <Heading level={3} as={1}>
          Large Visual Heading
        </Heading>
      </div>
      <div>
        <p className="text-xs text-zinc-500 mb-1">Semantic h1, styled as h4:</p>
        <Heading level={1} as={4}>
          Small Visual Heading
        </Heading>
      </div>
    </div>
}`,...(M=(I=o.parameters)==null?void 0:I.docs)==null?void 0:M.source}}};const Q=["H1","H2","H3","H4","H5","H6","AllLevels","SemanticVsVisual"];export{c as AllLevels,n as H1,s as H2,r as H3,i as H4,t as H5,d as H6,o as SemanticVsVisual,Q as __namedExportsOrder,P as default};
