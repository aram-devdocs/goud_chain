import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c}from"./clsx-B-dksMZM.js";function t({title:b,description:x,variant:r="secondary",className:C,...k}){return e.jsxs("button",{type:"button",className:c("rounded-lg p-4 transition text-left w-full",{"bg-white text-black hover:bg-zinc-200":r==="primary","bg-zinc-900 border border-zinc-800 hover:bg-zinc-800":r==="secondary"},C),...k,children:[e.jsx("div",{className:c("font-semibold mb-1",{"text-black":r==="primary","text-white":r==="secondary"}),children:b}),e.jsx("div",{className:c("text-sm",{"text-zinc-700":r==="primary","text-zinc-400":r==="secondary"}),children:x})]})}t.__docgenInfo={description:"",methods:[],displayName:"ActionCard",props:{title:{required:!0,tsType:{name:"string"},description:"Action title"},description:{required:!0,tsType:{name:"string"},description:"Action description"},variant:{required:!1,tsType:{name:"union",raw:"'primary' | 'secondary'",elements:[{name:"literal",value:"'primary'"},{name:"literal",value:"'secondary'"}]},description:"Visual variant",defaultValue:{value:"'secondary'",computed:!1}}},composes:["ButtonHTMLAttributes"]};const S={title:"Molecules/ActionCard",component:t,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{variant:{control:"select",options:["primary","secondary"]}}},o={args:{title:"Submit Data",description:"Create encrypted collection",variant:"primary"}},i={args:{title:"Browse Collections",description:"View and decrypt your data",variant:"secondary"}},a={args:{title:"Submit Data",description:"Create encrypted collection"},render:()=>e.jsxs("div",{className:"grid grid-cols-3 gap-4",children:[e.jsx(t,{title:"Submit Data",description:"Create encrypted collection",variant:"primary",onClick:()=>console.log("Submit clicked")}),e.jsx(t,{title:"Browse Collections",description:"View and decrypt your data",onClick:()=>console.log("Browse clicked")}),e.jsx(t,{title:"Explore Blockchain",description:"View blocks and analytics",onClick:()=>console.log("Explore clicked")})]})};var n,s,l;o.parameters={...o.parameters,docs:{...(n=o.parameters)==null?void 0:n.docs,source:{originalSource:`{
  args: {
    title: 'Submit Data',
    description: 'Create encrypted collection',
    variant: 'primary'
  }
}`,...(l=(s=o.parameters)==null?void 0:s.docs)==null?void 0:l.source}}};var d,p,m;i.parameters={...i.parameters,docs:{...(d=i.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    title: 'Browse Collections',
    description: 'View and decrypt your data',
    variant: 'secondary'
  }
}`,...(m=(p=i.parameters)==null?void 0:p.docs)==null?void 0:m.source}}};var u,y,g;a.parameters={...a.parameters,docs:{...(u=a.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    title: 'Submit Data',
    description: 'Create encrypted collection'
  },
  render: () => <div className="grid grid-cols-3 gap-4">
      <ActionCard title="Submit Data" description="Create encrypted collection" variant="primary" onClick={() => console.log('Submit clicked')} />
      <ActionCard title="Browse Collections" description="View and decrypt your data" onClick={() => console.log('Browse clicked')} />
      <ActionCard title="Explore Blockchain" description="View blocks and analytics" onClick={() => console.log('Explore clicked')} />
    </div>
}`,...(g=(y=a.parameters)==null?void 0:y.docs)==null?void 0:g.source}}};const f=["Primary","Secondary","QuickActions"];export{o as Primary,a as QuickActions,i as Secondary,f as __namedExportsOrder,S as default};
