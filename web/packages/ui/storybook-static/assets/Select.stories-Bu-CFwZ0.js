import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{r as q}from"./index-Dz3UJJSw.js";import{c as u}from"./clsx-B-dksMZM.js";import"./_commonjsHelpers-CqkleIqs.js";const c=q.forwardRef(({label:d,error:o,helperText:s,fullWidth:p=!1,className:A,children:D,...t},E)=>e.jsxs("div",{className:u("flex flex-col",{"w-full":p}),children:[d&&e.jsx("label",{htmlFor:t.id,className:"block text-sm font-medium text-zinc-300 mb-1",children:d}),e.jsx("select",{ref:E,className:u("bg-zinc-900 border rounded px-3 py-2 text-white text-sm","focus:outline-none focus:border-white transition-colors","disabled:opacity-50 disabled:cursor-not-allowed",{"border-red-500":o,"border-zinc-700":!o,"w-full":p},A),"aria-invalid":o?"true":"false","aria-describedby":o?`${t.id}-error`:s?`${t.id}-helper`:void 0,...t,children:D}),o&&e.jsx("p",{id:`${t.id}-error`,className:"text-xs text-red-500 mt-1",children:o}),!o&&s&&e.jsx("p",{id:`${t.id}-helper`,className:"text-xs text-zinc-500 mt-1",children:s})]}));c.displayName="Select";c.__docgenInfo={description:"",methods:[],displayName:"Select",props:{label:{required:!1,tsType:{name:"string"},description:"Label text"},error:{required:!1,tsType:{name:"string"},description:"Error message"},helperText:{required:!1,tsType:{name:"string"},description:"Helper text"},fullWidth:{required:!1,tsType:{name:"boolean"},description:"Full width",defaultValue:{value:"false",computed:!1}}},composes:["SelectHTMLAttributes"]};const H={title:"Atoms/Select",component:c,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{label:{control:"text"},error:{control:"text"},helperText:{control:"text"},disabled:{control:"boolean"},fullWidth:{control:"boolean"}}},i={args:{label:"Select an option",children:e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"",children:"Choose..."}),e.jsx("option",{value:"option1",children:"Option 1"}),e.jsx("option",{value:"option2",children:"Option 2"}),e.jsx("option",{value:"option3",children:"Option 3"})]})}},l={args:{label:"Event Type",helperText:"Select the type of event to filter",children:e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"all",children:"All Events"}),e.jsx("option",{value:"AccountCreated",children:"Account Created"}),e.jsx("option",{value:"AccountLogin",children:"Login"}),e.jsx("option",{value:"DataSubmitted",children:"Data Submitted"})]})}},r={args:{label:"Required Field",error:"This field is required",children:e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"",children:"Choose..."}),e.jsx("option",{value:"1",children:"Option 1"}),e.jsx("option",{value:"2",children:"Option 2"})]})}},a={args:{label:"Disabled Select",disabled:!0,children:e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"",children:"Choose..."}),e.jsx("option",{value:"1",children:"Option 1"})]})}},n={args:{label:"Full Width Select",fullWidth:!0,children:e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"",children:"Choose..."}),e.jsx("option",{value:"1",children:"Option 1"}),e.jsx("option",{value:"2",children:"Option 2"})]})}};var h,m,x;i.parameters={...i.parameters,docs:{...(h=i.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    label: 'Select an option',
    children: <>
        <option value="">Choose...</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </>
  }
}`,...(x=(m=i.parameters)==null?void 0:m.docs)==null?void 0:x.source}}};var v,b,f;l.parameters={...l.parameters,docs:{...(v=l.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    label: 'Event Type',
    helperText: 'Select the type of event to filter',
    children: <>
        <option value="all">All Events</option>
        <option value="AccountCreated">Account Created</option>
        <option value="AccountLogin">Login</option>
        <option value="DataSubmitted">Data Submitted</option>
      </>
  }
}`,...(f=(b=l.parameters)==null?void 0:b.docs)==null?void 0:f.source}}};var g,j,S;r.parameters={...r.parameters,docs:{...(g=r.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    label: 'Required Field',
    error: 'This field is required',
    children: <>
        <option value="">Choose...</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </>
  }
}`,...(S=(j=r.parameters)==null?void 0:j.docs)==null?void 0:S.source}}};var O,y,T;a.parameters={...a.parameters,docs:{...(O=a.parameters)==null?void 0:O.docs,source:{originalSource:`{
  args: {
    label: 'Disabled Select',
    disabled: true,
    children: <>
        <option value="">Choose...</option>
        <option value="1">Option 1</option>
      </>
  }
}`,...(T=(y=a.parameters)==null?void 0:y.docs)==null?void 0:T.source}}};var F,C,W;n.parameters={...n.parameters,docs:{...(F=n.parameters)==null?void 0:F.docs,source:{originalSource:`{
  args: {
    label: 'Full Width Select',
    fullWidth: true,
    children: <>
        <option value="">Choose...</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </>
  }
}`,...(W=(C=n.parameters)==null?void 0:C.docs)==null?void 0:W.source}}};const R=["Default","WithHelperText","WithError","Disabled","FullWidth"];export{i as Default,a as Disabled,n as FullWidth,r as WithError,l as WithHelperText,R as __namedExportsOrder,H as default};
