import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{r as W}from"./index-Dz3UJJSw.js";import{c as _}from"./clsx-B-dksMZM.js";import"./_commonjsHelpers-CqkleIqs.js";const r=W.forwardRef(({label:p,error:s,helperText:m,className:I,...a},z)=>e.jsxs("div",{className:"flex flex-col",children:[e.jsxs("div",{className:"flex items-center",children:[e.jsx("input",{ref:z,type:"checkbox",className:_("w-4 h-4 rounded border-zinc-700 bg-zinc-900","text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black","disabled:opacity-50 disabled:cursor-not-allowed","cursor-pointer",{"border-red-500":s},I),"aria-invalid":s?"true":"false","aria-describedby":s?`${a.id}-error`:m?`${a.id}-helper`:void 0,...a}),p&&e.jsx("label",{htmlFor:a.id,className:"ml-2 text-sm text-zinc-300 cursor-pointer select-none",children:p})]}),s&&e.jsx("p",{id:`${a.id}-error`,className:"text-xs text-red-500 mt-1",children:s}),!s&&m&&e.jsx("p",{id:`${a.id}-helper`,className:"text-xs text-zinc-500 mt-1",children:m})]}));r.displayName="Checkbox";r.__docgenInfo={description:"",methods:[],displayName:"Checkbox",props:{label:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:"Label text or element"},error:{required:!1,tsType:{name:"string"},description:"Error message"},helperText:{required:!1,tsType:{name:"string"},description:"Helper text"}},composes:["Omit"]};const P={title:"Atoms/Checkbox",component:r,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{label:{control:"text"},error:{control:"text"},helperText:{control:"text"},disabled:{control:"boolean"},checked:{control:"boolean"}}},t={args:{label:"Accept terms and conditions"}},o={args:{label:"I have saved my API key",checked:!0}},c={args:{label:"Remember me",helperText:"Keep me logged in on this device"}},d={args:{label:"Required checkbox",error:"You must accept to continue"}},l={args:{label:"Disabled option",disabled:!0}},n={args:{label:"Disabled and checked",disabled:!0,checked:!0}},i={render:()=>e.jsxs("div",{className:"space-y-3",children:[e.jsx(r,{label:"Option 1"}),e.jsx(r,{label:"Option 2",checked:!0}),e.jsx(r,{label:"Option 3"}),e.jsx(r,{label:"Option 4 (disabled)",disabled:!0})]})};var b,u,x;t.parameters={...t.parameters,docs:{...(b=t.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    label: 'Accept terms and conditions'
  }
}`,...(x=(u=t.parameters)==null?void 0:u.docs)==null?void 0:x.source}}};var h,g,k;o.parameters={...o.parameters,docs:{...(h=o.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    label: 'I have saved my API key',
    checked: true
  }
}`,...(k=(g=o.parameters)==null?void 0:g.docs)==null?void 0:k.source}}};var f,y,C;c.parameters={...c.parameters,docs:{...(f=c.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    label: 'Remember me',
    helperText: 'Keep me logged in on this device'
  }
}`,...(C=(y=c.parameters)==null?void 0:y.docs)==null?void 0:C.source}}};var j,v,N;d.parameters={...d.parameters,docs:{...(j=d.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    label: 'Required checkbox',
    error: 'You must accept to continue'
  }
}`,...(N=(v=d.parameters)==null?void 0:v.docs)==null?void 0:N.source}}};var D,O,R;l.parameters={...l.parameters,docs:{...(D=l.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    label: 'Disabled option',
    disabled: true
  }
}`,...(R=(O=l.parameters)==null?void 0:O.docs)==null?void 0:R.source}}};var T,S,w;n.parameters={...n.parameters,docs:{...(T=n.parameters)==null?void 0:T.docs,source:{originalSource:`{
  args: {
    label: 'Disabled and checked',
    disabled: true,
    checked: true
  }
}`,...(w=(S=n.parameters)==null?void 0:S.docs)==null?void 0:w.source}}};var E,q,A;i.parameters={...i.parameters,docs:{...(E=i.parameters)==null?void 0:E.docs,source:{originalSource:`{
  render: () => <div className="space-y-3">
      <Checkbox label="Option 1" />
      <Checkbox label="Option 2" checked />
      <Checkbox label="Option 3" />
      <Checkbox label="Option 4 (disabled)" disabled />
    </div>
}`,...(A=(q=i.parameters)==null?void 0:q.docs)==null?void 0:A.source}}};const Y=["Default","Checked","WithHelperText","WithError","Disabled","DisabledChecked","MultipleCheckboxes"];export{o as Checked,t as Default,l as Disabled,n as DisabledChecked,i as MultipleCheckboxes,d as WithError,c as WithHelperText,Y as __namedExportsOrder,P as default};
