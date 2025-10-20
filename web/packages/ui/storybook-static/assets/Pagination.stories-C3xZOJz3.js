import{j as a}from"./jsx-runtime-D_zvdyIk.js";import{r as k}from"./index-Dz3UJJSw.js";import{c as w}from"./clsx-B-dksMZM.js";import{B as m}from"./Button-DCQss83x.js";import{a as d,B as u}from"./enums-Cb1UhVYP.js";import"./_commonjsHelpers-CqkleIqs.js";function i({currentPage:e,totalPages:t,totalItems:c,onPageChange:l,className:q}){const B=e>0,_=e<t-1;return a.jsxs("div",{className:w("flex justify-between items-center px-4 py-3 bg-zinc-900 border-t border-zinc-800",q),children:[a.jsx(m,{variant:u.Secondary,size:d.Small,onClick:()=>l(e-1),disabled:!B,children:"Previous"}),a.jsxs("span",{className:"text-sm text-zinc-400",children:["Page ",e+1," of ",t,c!==void 0&&` (${c} total)`]}),a.jsx(m,{variant:u.Secondary,size:d.Small,onClick:()=>l(e+1),disabled:!_,children:"Next"})]})}i.__docgenInfo={description:"",methods:[],displayName:"Pagination",props:{currentPage:{required:!0,tsType:{name:"number"},description:"Current page (0-indexed)"},totalPages:{required:!0,tsType:{name:"number"},description:"Total number of pages"},totalItems:{required:!1,tsType:{name:"number"},description:"Total items count"},onPageChange:{required:!0,tsType:{name:"signature",type:"function",raw:"(page: number) => void",signature:{arguments:[{type:{name:"number"},name:"page"}],return:{name:"void"}}},description:"Callback when page changes"},className:{required:!1,tsType:{name:"string"},description:"Custom className"}}};const O={title:"Molecules/Pagination",component:i,parameters:{layout:"padded"},tags:["autodocs"]},n={args:{currentPage:0,totalPages:10,onPageChange:e=>console.log("Page changed to:",e)}},r={args:{currentPage:2,totalPages:8,totalItems:156,onPageChange:e=>console.log("Page changed to:",e)}},s={args:{currentPage:0,totalPages:5,totalItems:100,onPageChange:e=>console.log("Page changed to:",e)}},o={args:{currentPage:4,totalPages:5,totalItems:100,onPageChange:e=>console.log("Page changed to:",e)}},g={args:{currentPage:0,totalPages:10,totalItems:195,onPageChange:()=>{}},render:()=>{const[e,t]=k.useState(0);return a.jsxs("div",{children:[a.jsx("div",{className:"mb-4 p-4 bg-zinc-900 border border-zinc-800 rounded",children:a.jsxs("p",{className:"text-sm text-zinc-400",children:["Current page: ",e+1]})}),a.jsx(i,{currentPage:e,totalPages:10,totalItems:195,onPageChange:t})]})}};var p,P,h;n.parameters={...n.parameters,docs:{...(p=n.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    currentPage: 0,
    totalPages: 10,
    onPageChange: page => console.log('Page changed to:', page)
  }
}`,...(h=(P=n.parameters)==null?void 0:P.docs)==null?void 0:h.source}}};var x,C,b;r.parameters={...r.parameters,docs:{...(x=r.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    currentPage: 2,
    totalPages: 8,
    totalItems: 156,
    onPageChange: page => console.log('Page changed to:', page)
  }
}`,...(b=(C=r.parameters)==null?void 0:C.docs)==null?void 0:b.source}}};var f,v,I;s.parameters={...s.parameters,docs:{...(f=s.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    currentPage: 0,
    totalPages: 5,
    totalItems: 100,
    onPageChange: page => console.log('Page changed to:', page)
  }
}`,...(I=(v=s.parameters)==null?void 0:v.docs)==null?void 0:I.source}}};var y,z,S;o.parameters={...o.parameters,docs:{...(y=o.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    currentPage: 4,
    totalPages: 5,
    totalItems: 100,
    onPageChange: page => console.log('Page changed to:', page)
  }
}`,...(S=(z=o.parameters)==null?void 0:z.docs)==null?void 0:S.source}}};var j,N,T;g.parameters={...g.parameters,docs:{...(j=g.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    currentPage: 0,
    totalPages: 10,
    totalItems: 195,
    onPageChange: () => {}
  },
  render: () => {
    const [currentPage, setCurrentPage] = useState(0);
    const totalPages = 10;
    return <div>
        <div className="mb-4 p-4 bg-zinc-900 border border-zinc-800 rounded">
          <p className="text-sm text-zinc-400">
            Current page: {currentPage + 1}
          </p>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={195} onPageChange={setCurrentPage} />
      </div>;
  }
}`,...(T=(N=g.parameters)==null?void 0:N.docs)==null?void 0:T.source}}};const R=["Default","WithTotalItems","FirstPage","LastPage","Interactive"];export{n as Default,s as FirstPage,g as Interactive,o as LastPage,r as WithTotalItems,R as __namedExportsOrder,O as default};
