import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{C as a,a as n,b as s,c as t}from"./Card-Dr1Akg1L.js";import"./clsx-B-dksMZM.js";const z={title:"Molecules/Card",component:a,parameters:{layout:"padded"},tags:["autodocs"]},r={args:{children:e.jsx("p",{className:"text-zinc-300",children:"Simple card with default styling"})}},d={render:()=>e.jsxs(a,{children:[e.jsx(n,{children:e.jsx(s,{children:"Card Title"})}),e.jsx(t,{children:e.jsx("p",{children:"Card content goes here. This is a basic card with header and content sections."})})]})},c={render:()=>e.jsxs(a,{children:[e.jsx(n,{children:e.jsx(s,{children:"Chain Statistics"})}),e.jsx(t,{children:e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-zinc-400 text-sm",children:"Total Blocks"}),e.jsx("span",{className:"text-white font-medium font-mono",children:"1,234"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-zinc-400 text-sm",children:"Active Peers"}),e.jsx("span",{className:"text-white font-medium font-mono",children:"4"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-zinc-400 text-sm",children:"Sync Status"}),e.jsx("span",{className:"text-green-500 font-medium",children:"Synced"})]})]})})]})},i={render:()=>e.jsx(a,{children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-zinc-400 text-sm mb-1",children:"Data Collections"}),e.jsx("p",{className:"text-white text-3xl font-bold",children:"42"})]}),e.jsx("div",{className:"text-green-500 text-sm",children:"+12%"})]})})},l={render:()=>e.jsxs("div",{className:"grid grid-cols-3 gap-4",children:[e.jsxs(a,{children:[e.jsx(n,{children:e.jsx(s,{children:"Card 1"})}),e.jsx(t,{children:e.jsx("p",{children:"First card content"})})]}),e.jsxs(a,{children:[e.jsx(n,{children:e.jsx(s,{children:"Card 2"})}),e.jsx(t,{children:e.jsx("p",{children:"Second card content"})})]}),e.jsxs(a,{children:[e.jsx(n,{children:e.jsx(s,{children:"Card 3"})}),e.jsx(t,{children:e.jsx("p",{children:"Third card content"})})]})]})};var o,m,x;r.parameters={...r.parameters,docs:{...(o=r.parameters)==null?void 0:o.docs,source:{originalSource:`{
  args: {
    children: <p className="text-zinc-300">Simple card with default styling</p>
  }
}`,...(x=(m=r.parameters)==null?void 0:m.docs)==null?void 0:x.source}}};var C,p,h;d.parameters={...d.parameters,docs:{...(C=d.parameters)==null?void 0:C.docs,source:{originalSource:`{
  render: () => <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Card content goes here. This is a basic card with header and content
          sections.
        </p>
      </CardContent>
    </Card>
}`,...(h=(p=d.parameters)==null?void 0:p.docs)==null?void 0:h.source}}};var j,u,f;c.parameters={...c.parameters,docs:{...(j=c.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: () => <Card>
      <CardHeader>
        <CardTitle>Chain Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-zinc-400 text-sm">Total Blocks</span>
            <span className="text-white font-medium font-mono">1,234</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400 text-sm">Active Peers</span>
            <span className="text-white font-medium font-mono">4</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400 text-sm">Sync Status</span>
            <span className="text-green-500 font-medium">Synced</span>
          </div>
        </div>
      </CardContent>
    </Card>
}`,...(f=(u=c.parameters)==null?void 0:u.docs)==null?void 0:f.source}}};var N,v,g;i.parameters={...i.parameters,docs:{...(N=i.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-sm mb-1">Data Collections</p>
          <p className="text-white text-3xl font-bold">42</p>
        </div>
        <div className="text-green-500 text-sm">+12%</div>
      </div>
    </Card>
}`,...(g=(v=i.parameters)==null?void 0:v.docs)==null?void 0:g.source}}};var S,T,w;l.parameters={...l.parameters,docs:{...(S=l.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: () => <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Card 1</CardTitle>
        </CardHeader>
        <CardContent>
          <p>First card content</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Card 2</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Second card content</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Card 3</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Third card content</p>
        </CardContent>
      </Card>
    </div>
}`,...(w=(T=l.parameters)==null?void 0:T.docs)==null?void 0:w.source}}};const M=["Default","WithHeader","ChainStats","MetricCard","MultipleCards"];export{c as ChainStats,r as Default,i as MetricCard,l as MultipleCards,d as WithHeader,M as __namedExportsOrder,z as default};
