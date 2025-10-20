import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{r as O}from"./index-Dz3UJJSw.js";import{c as P}from"./clsx-B-dksMZM.js";import"./_commonjsHelpers-CqkleIqs.js";const u=O.forwardRef(({direction:t="vertical",spacing:n=4,align:s,justify:a,wrap:E=!1,className:L,children:M,...D},J)=>e.jsx("div",{ref:J,className:P("flex",{"flex-col":t==="vertical","flex-row":t==="horizontal","flex-wrap":E,"gap-0":n===0,"gap-1":n===1,"gap-2":n===2,"gap-3":n===3,"gap-4":n===4,"gap-5":n===5,"gap-6":n===6,"gap-8":n===8,"gap-10":n===10,"gap-12":n===12,"items-start":s==="start","items-center":s==="center","items-end":s==="end","items-stretch":s==="stretch","justify-start":a==="start","justify-center":a==="center","justify-end":a==="end","justify-between":a==="between","justify-around":a==="around","justify-evenly":a==="evenly"},L),...D,children:M}));u.displayName="Stack";u.__docgenInfo={description:"",methods:[],displayName:"Stack",props:{direction:{required:!1,tsType:{name:"union",raw:"'vertical' | 'horizontal'",elements:[{name:"literal",value:"'vertical'"},{name:"literal",value:"'horizontal'"}]},description:`Stack direction
@default 'vertical'`,defaultValue:{value:"'vertical'",computed:!1}},spacing:{required:!1,tsType:{name:"union",raw:"0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12",elements:[{name:"literal",value:"0"},{name:"literal",value:"1"},{name:"literal",value:"2"},{name:"literal",value:"3"},{name:"literal",value:"4"},{name:"literal",value:"5"},{name:"literal",value:"6"},{name:"literal",value:"8"},{name:"literal",value:"10"},{name:"literal",value:"12"}]},description:`Spacing between children (4px grid)
@default 4`,defaultValue:{value:"4",computed:!1}},align:{required:!1,tsType:{name:"union",raw:"'start' | 'center' | 'end' | 'stretch'",elements:[{name:"literal",value:"'start'"},{name:"literal",value:"'center'"},{name:"literal",value:"'end'"},{name:"literal",value:"'stretch'"}]},description:"Alignment of children"},justify:{required:!1,tsType:{name:"union",raw:"'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'",elements:[{name:"literal",value:"'start'"},{name:"literal",value:"'center'"},{name:"literal",value:"'end'"},{name:"literal",value:"'between'"},{name:"literal",value:"'around'"},{name:"literal",value:"'evenly'"}]},description:"Justify content"},wrap:{required:!1,tsType:{name:"boolean"},description:`Allow wrapping
@default false`,defaultValue:{value:"false",computed:!1}}},composes:["HTMLAttributes"]};const X={title:"Primitives/Stack",component:u,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{direction:{control:"radio",options:["vertical","horizontal"]},spacing:{control:"select",options:[0,1,2,3,4,5,6,8,10,12]},align:{control:"select",options:["start","center","end","stretch"]},justify:{control:"select",options:["start","center","end","between","around","evenly"]}}},r=({children:t})=>e.jsx("div",{className:"bg-zinc-800 border border-zinc-700 rounded-lg p-4",children:e.jsx("p",{className:"text-white text-sm",children:t})}),o={args:{direction:"vertical",spacing:4,children:e.jsxs(e.Fragment,{children:[e.jsx(r,{children:"Item 1"}),e.jsx(r,{children:"Item 2"}),e.jsx(r,{children:"Item 3"})]})}},i={args:{direction:"horizontal",spacing:4,children:e.jsxs(e.Fragment,{children:[e.jsx(r,{children:"Item 1"}),e.jsx(r,{children:"Item 2"}),e.jsx(r,{children:"Item 3"})]})}},l={args:{direction:"vertical",spacing:2,children:e.jsxs(e.Fragment,{children:[e.jsx(r,{children:"Tight spacing (8px)"}),e.jsx(r,{children:"Between items"}),e.jsx(r,{children:"Compact layout"})]})}},c={args:{direction:"vertical",spacing:8,children:e.jsxs(e.Fragment,{children:[e.jsx(r,{children:"Spacious layout"}),e.jsx(r,{children:"More breathing room"}),e.jsx(r,{children:"32px gap"})]})}},d={args:{direction:"vertical",spacing:4,align:"center",children:e.jsxs(e.Fragment,{children:[e.jsx(r,{children:"Centered"}),e.jsx(r,{children:"Alignment"}),e.jsx(r,{children:"Items"})]})}},m={args:{direction:"horizontal",spacing:4,align:"center",justify:"center",className:"min-h-[200px]",children:e.jsxs(e.Fragment,{children:[e.jsx(r,{children:"Centered"}),e.jsx(r,{children:"Both ways"})]})}},p={args:{direction:"horizontal",justify:"between",className:"w-full",children:e.jsxs(e.Fragment,{children:[e.jsx(r,{children:"Left"}),e.jsx(r,{children:"Right"})]})}},x={args:{direction:"horizontal",spacing:4,wrap:!0,children:e.jsxs(e.Fragment,{children:[e.jsx(r,{children:"Item 1"}),e.jsx(r,{children:"Item 2"}),e.jsx(r,{children:"Item 3"}),e.jsx(r,{children:"Item 4"}),e.jsx(r,{children:"Item 5"}),e.jsx(r,{children:"Item 6"})]})}};var h,g,B;o.parameters={...o.parameters,docs:{...(h=o.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    direction: 'vertical',
    spacing: 4,
    children: <>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </>
  }
}`,...(B=(g=o.parameters)==null?void 0:g.docs)==null?void 0:B.source}}};var v,j,f;i.parameters={...i.parameters,docs:{...(v=i.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    direction: 'horizontal',
    spacing: 4,
    children: <>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
      </>
  }
}`,...(f=(j=i.parameters)==null?void 0:j.docs)==null?void 0:f.source}}};var w,I,y;l.parameters={...l.parameters,docs:{...(w=l.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    direction: 'vertical',
    spacing: 2,
    children: <>
        <Box>Tight spacing (8px)</Box>
        <Box>Between items</Box>
        <Box>Compact layout</Box>
      </>
  }
}`,...(y=(I=l.parameters)==null?void 0:I.docs)==null?void 0:y.source}}};var S,z,b;c.parameters={...c.parameters,docs:{...(S=c.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    direction: 'vertical',
    spacing: 8,
    children: <>
        <Box>Spacious layout</Box>
        <Box>More breathing room</Box>
        <Box>32px gap</Box>
      </>
  }
}`,...(b=(z=c.parameters)==null?void 0:z.docs)==null?void 0:b.source}}};var T,C,N;d.parameters={...d.parameters,docs:{...(T=d.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    direction: 'vertical',
    spacing: 4,
    align: 'center',
    children: <>
        <Box>Centered</Box>
        <Box>Alignment</Box>
        <Box>Items</Box>
      </>
  }
}`,...(N=(C=d.parameters)==null?void 0:C.docs)==null?void 0:N.source}}};var F,k,q;m.parameters={...m.parameters,docs:{...(F=m.parameters)==null?void 0:F.docs,source:{originalSource:`{
  args: {
    direction: 'horizontal',
    spacing: 4,
    align: 'center',
    justify: 'center',
    className: 'min-h-[200px]',
    children: <>
        <Box>Centered</Box>
        <Box>Both ways</Box>
      </>
  }
}`,...(q=(k=m.parameters)==null?void 0:k.docs)==null?void 0:q.source}}};var A,H,V;p.parameters={...p.parameters,docs:{...(A=p.parameters)==null?void 0:A.docs,source:{originalSource:`{
  args: {
    direction: 'horizontal',
    justify: 'between',
    className: 'w-full',
    children: <>
        <Box>Left</Box>
        <Box>Right</Box>
      </>
  }
}`,...(V=(H=p.parameters)==null?void 0:H.docs)==null?void 0:V.source}}};var R,W,_;x.parameters={...x.parameters,docs:{...(R=x.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    direction: 'horizontal',
    spacing: 4,
    wrap: true,
    children: <>
        <Box>Item 1</Box>
        <Box>Item 2</Box>
        <Box>Item 3</Box>
        <Box>Item 4</Box>
        <Box>Item 5</Box>
        <Box>Item 6</Box>
      </>
  }
}`,...(_=(W=x.parameters)==null?void 0:W.docs)==null?void 0:_.source}}};const Y=["VerticalDefault","Horizontal","TightSpacing","SpaciousSpacing","CenteredItems","HorizontalCentered","SpaceBetween","WithWrap"];export{d as CenteredItems,i as Horizontal,m as HorizontalCentered,p as SpaceBetween,c as SpaciousSpacing,l as TightSpacing,o as VerticalDefault,x as WithWrap,Y as __namedExportsOrder,X as default};
