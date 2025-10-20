import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{r as N}from"./index-Dz3UJJSw.js";import{c as P}from"./clsx-B-dksMZM.js";import"./_commonjsHelpers-CqkleIqs.js";const s=N.forwardRef(({error:r,className:n,...c},p)=>e.jsx("input",{ref:p,className:P("w-full px-3 py-2 bg-zinc-900 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black transition-colors",{"border-zinc-700 focus:border-white focus:ring-white":!r,"border-red-500 focus:border-red-500 focus:ring-red-500":r},n),...c}));s.displayName="Input";s.__docgenInfo={description:"",methods:[],displayName:"Input",props:{error:{required:!1,tsType:{name:"boolean"},description:""}},composes:["InputHTMLAttributes"]};const a=N.forwardRef(({className:r,children:n,...c},p)=>e.jsx("label",{ref:p,className:P("block text-sm font-medium text-zinc-300",r),...c,children:n}));a.displayName="Label";a.__docgenInfo={description:"",methods:[],displayName:"Label",composes:["LabelHTMLAttributes"]};const q={title:"Atoms/Input",component:s,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{disabled:{control:"boolean"},type:{control:"select",options:["text","email","password","number","url","tel"]}}},o={args:{placeholder:"Enter your email"},render:r=>e.jsxs("div",{children:[e.jsx(a,{htmlFor:"email",children:"Email"}),e.jsx(s,{id:"email",...r})]})},t={args:{type:"password",placeholder:"Enter your password"},render:r=>e.jsxs("div",{children:[e.jsx(a,{htmlFor:"password",children:"Password"}),e.jsx(s,{id:"password",...r})]})},d={args:{disabled:!0,value:"Cannot edit this"},render:r=>e.jsxs("div",{children:[e.jsx(a,{htmlFor:"disabled",children:"Disabled Input"}),e.jsx(s,{id:"disabled",...r})]})},l={args:{type:"password",placeholder:"Paste your API key",className:"font-mono text-sm"},render:r=>e.jsxs("div",{children:[e.jsx(a,{htmlFor:"apikey",children:"API Key"}),e.jsx(s,{id:"apikey",...r})]})},i={args:{required:!0,placeholder:"Enter collection name"},render:r=>e.jsxs("div",{children:[e.jsx(a,{htmlFor:"collection",children:"Collection Name *"}),e.jsx(s,{id:"collection",...r})]})};var m,u,b;o.parameters={...o.parameters,docs:{...(m=o.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter your email'
  },
  render: args => <div>
      <Label htmlFor="email">Email</Label>
      <Input id="email" {...args} />
    </div>
}`,...(b=(u=o.parameters)==null?void 0:u.docs)==null?void 0:b.source}}};var g,h,x;t.parameters={...t.parameters,docs:{...(g=t.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    type: 'password',
    placeholder: 'Enter your password'
  },
  render: args => <div>
      <Label htmlFor="password">Password</Label>
      <Input id="password" {...args} />
    </div>
}`,...(x=(h=t.parameters)==null?void 0:h.docs)==null?void 0:x.source}}};var f,y,w;d.parameters={...d.parameters,docs:{...(f=d.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    disabled: true,
    value: 'Cannot edit this'
  },
  render: args => <div>
      <Label htmlFor="disabled">Disabled Input</Label>
      <Input id="disabled" {...args} />
    </div>
}`,...(w=(y=d.parameters)==null?void 0:y.docs)==null?void 0:w.source}}};var j,I,v;l.parameters={...l.parameters,docs:{...(j=l.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    type: 'password',
    placeholder: 'Paste your API key',
    className: 'font-mono text-sm'
  },
  render: args => <div>
      <Label htmlFor="apikey">API Key</Label>
      <Input id="apikey" {...args} />
    </div>
}`,...(v=(I=l.parameters)==null?void 0:I.docs)==null?void 0:v.source}}};var L,E,F;i.parameters={...i.parameters,docs:{...(L=i.parameters)==null?void 0:L.docs,source:{originalSource:`{
  args: {
    required: true,
    placeholder: 'Enter collection name'
  },
  render: args => <div>
      <Label htmlFor="collection">Collection Name *</Label>
      <Input id="collection" {...args} />
    </div>
}`,...(F=(E=i.parameters)==null?void 0:E.docs)==null?void 0:F.source}}};const R=["Default","Password","Disabled","MonospaceApiKey","Required"];export{o as Default,d as Disabled,l as MonospaceApiKey,t as Password,i as Required,R as __namedExportsOrder,q as default};
