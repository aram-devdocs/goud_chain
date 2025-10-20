import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{r as M}from"./index-Dz3UJJSw.js";import{c as O}from"./clsx-B-dksMZM.js";import"./_commonjsHelpers-CqkleIqs.js";const p=M.forwardRef(({columns:r=1,gap:n,rowGap:a,colGap:s,className:D,children:w,...H},L)=>{const i=typeof r=="object";return e.jsx("div",{ref:L,className:O("grid",{"grid-cols-1":!i&&r===1,"grid-cols-2":!i&&r===2,"grid-cols-3":!i&&r===3,"grid-cols-4":!i&&r===4,"grid-cols-6":!i&&r===6,"grid-cols-12":!i&&r===12,"sm:grid-cols-2":i&&r.sm===2,"sm:grid-cols-3":i&&r.sm===3,"sm:grid-cols-4":i&&r.sm===4,"md:grid-cols-2":i&&r.md===2,"md:grid-cols-3":i&&r.md===3,"md:grid-cols-4":i&&r.md===4,"md:grid-cols-6":i&&r.md===6,"lg:grid-cols-2":i&&r.lg===2,"lg:grid-cols-3":i&&r.lg===3,"lg:grid-cols-4":i&&r.lg===4,"lg:grid-cols-6":i&&r.lg===6,"xl:grid-cols-4":i&&r.xl===4,"xl:grid-cols-6":i&&r.xl===6,"gap-0":n===0&&!a&&!s,"gap-1":n===1&&!a&&!s,"gap-2":n===2&&!a&&!s,"gap-3":n===3&&!a&&!s,"gap-4":n===4&&!a&&!s,"gap-5":n===5&&!a&&!s,"gap-6":n===6&&!a&&!s,"gap-8":n===8&&!a&&!s,"gap-10":n===10&&!a&&!s,"gap-12":n===12&&!a&&!s,"gap-y-0":a===0,"gap-y-1":a===1,"gap-y-2":a===2,"gap-y-3":a===3,"gap-y-4":a===4,"gap-y-5":a===5,"gap-y-6":a===6,"gap-y-8":a===8,"gap-y-10":a===10,"gap-y-12":a===12,"gap-x-0":s===0,"gap-x-1":s===1,"gap-x-2":s===2,"gap-x-3":s===3,"gap-x-4":s===4,"gap-x-5":s===5,"gap-x-6":s===6,"gap-x-8":s===8,"gap-x-10":s===10,"gap-x-12":s===12},D),...H,children:w})});p.displayName="Grid";p.__docgenInfo={description:"",methods:[],displayName:"Grid",props:{columns:{required:!1,tsType:{name:"union",raw:`| 1
| 2
| 3
| 4
| 6
| 12
| { sm?: number; md?: number; lg?: number; xl?: number }`,elements:[{name:"literal",value:"1"},{name:"literal",value:"2"},{name:"literal",value:"3"},{name:"literal",value:"4"},{name:"literal",value:"6"},{name:"literal",value:"12"},{name:"signature",type:"object",raw:"{ sm?: number; md?: number; lg?: number; xl?: number }",signature:{properties:[{key:"sm",value:{name:"number",required:!1}},{key:"md",value:{name:"number",required:!1}},{key:"lg",value:{name:"number",required:!1}},{key:"xl",value:{name:"number",required:!1}}]}}]},description:`Number of columns (responsive)
Can be a single number or object with breakpoints

See component documentation for supported responsive combinations
@default 1`,defaultValue:{value:"1",computed:!1}},gap:{required:!1,tsType:{name:"union",raw:"0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12",elements:[{name:"literal",value:"0"},{name:"literal",value:"1"},{name:"literal",value:"2"},{name:"literal",value:"3"},{name:"literal",value:"4"},{name:"literal",value:"5"},{name:"literal",value:"6"},{name:"literal",value:"8"},{name:"literal",value:"10"},{name:"literal",value:"12"}]},description:`Gap between items (4px grid)
@default 4`},rowGap:{required:!1,tsType:{name:"union",raw:"0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12",elements:[{name:"literal",value:"0"},{name:"literal",value:"1"},{name:"literal",value:"2"},{name:"literal",value:"3"},{name:"literal",value:"4"},{name:"literal",value:"5"},{name:"literal",value:"6"},{name:"literal",value:"8"},{name:"literal",value:"10"},{name:"literal",value:"12"}]},description:"Row gap (if different from column gap)"},colGap:{required:!1,tsType:{name:"union",raw:"0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12",elements:[{name:"literal",value:"0"},{name:"literal",value:"1"},{name:"literal",value:"2"},{name:"literal",value:"3"},{name:"literal",value:"4"},{name:"literal",value:"5"},{name:"literal",value:"6"},{name:"literal",value:"8"},{name:"literal",value:"10"},{name:"literal",value:"12"}]},description:"Column gap (if different from row gap)"}},composes:["HTMLAttributes"]};const K={title:"Primitives/Grid",component:p,parameters:{layout:"padded"},tags:["autodocs"]},l=({children:r})=>e.jsx("div",{className:"bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex items-center justify-center min-h-[80px]",children:e.jsx("p",{className:"text-white text-sm font-medium",children:r})}),m={args:{columns:2,gap:4,children:e.jsxs(e.Fragment,{children:[e.jsx(l,{children:"Item 1"}),e.jsx(l,{children:"Item 2"}),e.jsx(l,{children:"Item 3"}),e.jsx(l,{children:"Item 4"})]})}},t={args:{columns:3,gap:4,children:e.jsxs(e.Fragment,{children:[e.jsx(l,{children:"1"}),e.jsx(l,{children:"2"}),e.jsx(l,{children:"3"}),e.jsx(l,{children:"4"}),e.jsx(l,{children:"5"}),e.jsx(l,{children:"6"})]})}},d={args:{columns:4,gap:4,children:e.jsx(e.Fragment,{children:Array.from({length:8},(r,n)=>e.jsx(l,{children:n+1},n))})}},o={args:{columns:{sm:2,md:3,lg:4},gap:4,children:e.jsx(e.Fragment,{children:Array.from({length:8},(r,n)=>e.jsxs(l,{children:["Item ",n+1]},n))})},parameters:{docs:{description:{story:"Responsive grid: 1 column on mobile, 2 on small screens, 3 on medium, 4 on large"}}}},c={args:{columns:3,gap:2,children:e.jsx(e.Fragment,{children:Array.from({length:6},(r,n)=>e.jsx(l,{children:n+1},n))})}},g={args:{columns:2,gap:8,children:e.jsx(e.Fragment,{children:Array.from({length:4},(r,n)=>e.jsxs(l,{children:["Item ",n+1]},n))})}},u={args:{columns:3,rowGap:8,colGap:4,children:e.jsx(e.Fragment,{children:Array.from({length:6},(r,n)=>e.jsx(l,{children:n+1},n))})},parameters:{docs:{description:{story:"Row gap (32px) larger than column gap (16px)"}}}};var h,x,v;m.parameters={...m.parameters,docs:{...(h=m.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    columns: 2,
    gap: 4,
    children: <>
        <GridItem>Item 1</GridItem>
        <GridItem>Item 2</GridItem>
        <GridItem>Item 3</GridItem>
        <GridItem>Item 4</GridItem>
      </>
  }
}`,...(v=(x=m.parameters)==null?void 0:x.docs)==null?void 0:v.source}}};var f,I,y;t.parameters={...t.parameters,docs:{...(f=t.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    columns: 3,
    gap: 4,
    children: <>
        <GridItem>1</GridItem>
        <GridItem>2</GridItem>
        <GridItem>3</GridItem>
        <GridItem>4</GridItem>
        <GridItem>5</GridItem>
        <GridItem>6</GridItem>
      </>
  }
}`,...(y=(I=t.parameters)==null?void 0:I.docs)==null?void 0:y.source}}};var j,b,_;d.parameters={...d.parameters,docs:{...(j=d.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    columns: 4,
    gap: 4,
    children: <>
        {Array.from({
        length: 8
      }, (_, i) => <GridItem key={i}>{i + 1}</GridItem>)}
      </>
  }
}`,...(_=(b=d.parameters)==null?void 0:b.docs)==null?void 0:_.source}}};var G,R,A;o.parameters={...o.parameters,docs:{...(G=o.parameters)==null?void 0:G.docs,source:{originalSource:`{
  args: {
    columns: {
      sm: 2,
      md: 3,
      lg: 4
    },
    gap: 4,
    children: <>
        {Array.from({
        length: 8
      }, (_, i) => <GridItem key={i}>Item {i + 1}</GridItem>)}
      </>
  },
  parameters: {
    docs: {
      description: {
        story: 'Responsive grid: 1 column on mobile, 2 on small screens, 3 on medium, 4 on large'
      }
    }
  }
}`,...(A=(R=o.parameters)==null?void 0:R.docs)==null?void 0:A.source}}};var T,k,C;c.parameters={...c.parameters,docs:{...(T=c.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    columns: 3,
    gap: 2,
    children: <>
        {Array.from({
        length: 6
      }, (_, i) => <GridItem key={i}>{i + 1}</GridItem>)}
      </>
  }
}`,...(C=(k=c.parameters)==null?void 0:k.docs)==null?void 0:C.source}}};var S,F,q;g.parameters={...g.parameters,docs:{...(S=g.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    columns: 2,
    gap: 8,
    children: <>
        {Array.from({
        length: 4
      }, (_, i) => <GridItem key={i}>Item {i + 1}</GridItem>)}
      </>
  }
}`,...(q=(F=g.parameters)==null?void 0:F.docs)==null?void 0:q.source}}};var N,E,z;u.parameters={...u.parameters,docs:{...(N=u.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    columns: 3,
    rowGap: 8,
    colGap: 4,
    children: <>
        {Array.from({
        length: 6
      }, (_, i) => <GridItem key={i}>{i + 1}</GridItem>)}
      </>
  },
  parameters: {
    docs: {
      description: {
        story: 'Row gap (32px) larger than column gap (16px)'
      }
    }
  }
}`,...(z=(E=u.parameters)==null?void 0:E.docs)==null?void 0:z.source}}};const Q=["TwoColumns","ThreeColumns","FourColumns","ResponsiveGrid","TightGap","SpaciousGap","DifferentRowColGap"];export{u as DifferentRowColGap,d as FourColumns,o as ResponsiveGrid,g as SpaciousGap,t as ThreeColumns,c as TightGap,m as TwoColumns,Q as __namedExportsOrder,K as default};
