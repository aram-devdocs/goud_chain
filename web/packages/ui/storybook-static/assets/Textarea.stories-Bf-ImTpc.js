import{j as a}from"./jsx-runtime-D_zvdyIk.js";import{r as O}from"./index-Dz3UJJSw.js";import{c as m}from"./clsx-B-dksMZM.js";import"./_commonjsHelpers-CqkleIqs.js";const c=O.forwardRef(({label:p,error:e,helperText:n,fullWidth:u=!1,rows:L=4,className:R,...r},z)=>a.jsxs("div",{className:m("flex flex-col",{"w-full":u}),children:[p&&a.jsx("label",{htmlFor:r.id,className:"block text-sm font-medium text-zinc-300 mb-1",children:p}),a.jsx("textarea",{ref:z,rows:L,className:m("bg-zinc-900 border rounded px-3 py-2 text-white text-sm","focus:outline-none focus:border-white transition-colors","disabled:opacity-50 disabled:cursor-not-allowed","resize-y",{"border-red-500":e,"border-zinc-700":!e,"w-full":u},R),"aria-invalid":e?"true":"false","aria-describedby":e?`${r.id}-error`:n?`${r.id}-helper`:void 0,...r}),e&&a.jsx("p",{id:`${r.id}-error`,className:"text-xs text-red-500 mt-1",children:e}),!e&&n&&a.jsx("p",{id:`${r.id}-helper`,className:"text-xs text-zinc-500 mt-1",children:n})]}));c.displayName="Textarea";c.__docgenInfo={description:"",methods:[],displayName:"Textarea",props:{label:{required:!1,tsType:{name:"string"},description:"Label text"},error:{required:!1,tsType:{name:"string"},description:"Error message"},helperText:{required:!1,tsType:{name:"string"},description:"Helper text"},fullWidth:{required:!1,tsType:{name:"boolean"},description:"Full width",defaultValue:{value:"false",computed:!1}},rows:{required:!1,tsType:{name:"number"},description:"Number of visible rows",defaultValue:{value:"4",computed:!1}}},composes:["TextareaHTMLAttributes"]};const k={title:"Atoms/Textarea",component:c,parameters:{layout:"padded"},tags:["autodocs"],argTypes:{label:{control:"text"},error:{control:"text"},helperText:{control:"text"},disabled:{control:"boolean"},fullWidth:{control:"boolean"},rows:{control:"number"}}},t={args:{label:"Description",placeholder:"Enter your description here..."}},s={args:{label:"JSON Data",helperText:"Enter valid JSON data",placeholder:'{"key": "value"}',rows:8}},l={args:{label:"Required Field",error:"This field cannot be empty",placeholder:"Enter text..."}},o={args:{label:"Disabled Textarea",disabled:!0,value:"This field is disabled"}},i={args:{label:"Full Width Textarea",fullWidth:!0,placeholder:"This textarea spans the full width",rows:6}},d={args:{label:"Large Text Area",rows:12,placeholder:"A textarea with 12 rows for longer content..."}};var x,h,b;t.parameters={...t.parameters,docs:{...(x=t.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    label: 'Description',
    placeholder: 'Enter your description here...'
  }
}`,...(b=(h=t.parameters)==null?void 0:h.docs)==null?void 0:b.source}}};var f,g,T;s.parameters={...s.parameters,docs:{...(f=s.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    label: 'JSON Data',
    helperText: 'Enter valid JSON data',
    placeholder: '{"key": "value"}',
    rows: 8
  }
}`,...(T=(g=s.parameters)==null?void 0:g.docs)==null?void 0:T.source}}};var w,y,v;l.parameters={...l.parameters,docs:{...(w=l.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    label: 'Required Field',
    error: 'This field cannot be empty',
    placeholder: 'Enter text...'
  }
}`,...(v=(y=l.parameters)==null?void 0:y.docs)==null?void 0:v.source}}};var E,N,W;o.parameters={...o.parameters,docs:{...(E=o.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    label: 'Disabled Textarea',
    disabled: true,
    value: 'This field is disabled'
  }
}`,...(W=(N=o.parameters)==null?void 0:N.docs)==null?void 0:W.source}}};var D,S,F;i.parameters={...i.parameters,docs:{...(D=i.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    label: 'Full Width Textarea',
    fullWidth: true,
    placeholder: 'This textarea spans the full width',
    rows: 6
  }
}`,...(F=(S=i.parameters)==null?void 0:S.docs)==null?void 0:F.source}}};var j,q,A;d.parameters={...d.parameters,docs:{...(j=d.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    label: 'Large Text Area',
    rows: 12,
    placeholder: 'A textarea with 12 rows for longer content...'
  }
}`,...(A=(q=d.parameters)==null?void 0:q.docs)==null?void 0:A.source}}};const V=["Default","WithHelperText","WithError","Disabled","FullWidth","LargeRows"];export{t as Default,o as Disabled,i as FullWidth,d as LargeRows,l as WithError,s as WithHelperText,V as __namedExportsOrder,k as default};
