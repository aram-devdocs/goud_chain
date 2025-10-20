import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c as a}from"./clsx-B-dksMZM.js";function c({striped:d=!1,className:o,children:r,..._}){return e.jsx("div",{className:"overflow-x-auto",children:e.jsx("table",{className:a("w-full text-sm",{"[&_tbody_tr:nth-child(even)]:bg-zinc-900/30":d},o),..._,children:r})})}function m({className:d,children:o,...r}){return e.jsx("thead",{className:a("bg-zinc-900 border-b border-zinc-800",d),...r,children:o})}function T({className:d,children:o,...r}){return e.jsx("tbody",{className:a("[&_tr]:border-b [&_tr]:border-zinc-800 [&_tr:last-child]:border-0","[&_tr]:hover:bg-zinc-900/50 [&_tr]:transition-colors",d),...r,children:o})}function s({className:d,children:o,...r}){return e.jsx("tr",{className:a(d),...r,children:o})}function t({className:d,children:o,...r}){return e.jsx("th",{className:a("px-4 py-3 text-left font-medium text-zinc-400",d),...r,children:o})}function n({className:d,children:o,...r}){return e.jsx("td",{className:a("px-4 py-3 text-zinc-300",d),...r,children:o})}c.__docgenInfo={description:"",methods:[],displayName:"Table",props:{striped:{required:!1,tsType:{name:"boolean"},description:"Enable zebra striping",defaultValue:{value:"false",computed:!1}}},composes:["HTMLAttributes"]};m.__docgenInfo={description:"",methods:[],displayName:"Thead"};T.__docgenInfo={description:"",methods:[],displayName:"Tbody"};s.__docgenInfo={description:"",methods:[],displayName:"Tr"};t.__docgenInfo={description:"",methods:[],displayName:"Th"};n.__docgenInfo={description:"",methods:[],displayName:"Td"};const A={title:"Atoms/Table",component:c,parameters:{layout:"padded"},tags:["autodocs"]},l={render:()=>e.jsxs(c,{children:[e.jsx(m,{children:e.jsxs(s,{children:[e.jsx(t,{children:"Name"}),e.jsx(t,{children:"Email"}),e.jsx(t,{children:"Role"})]})}),e.jsxs(T,{children:[e.jsxs(s,{children:[e.jsx(n,{children:"John Doe"}),e.jsx(n,{children:"john@example.com"}),e.jsx(n,{children:"Admin"})]}),e.jsxs(s,{children:[e.jsx(n,{children:"Jane Smith"}),e.jsx(n,{children:"jane@example.com"}),e.jsx(n,{children:"User"})]}),e.jsxs(s,{children:[e.jsx(n,{children:"Bob Johnson"}),e.jsx(n,{children:"bob@example.com"}),e.jsx(n,{children:"User"})]})]})]})},x={render:()=>e.jsxs(c,{striped:!0,children:[e.jsx(m,{children:e.jsxs(s,{children:[e.jsx(t,{children:"Block #"}),e.jsx(t,{children:"Timestamp"}),e.jsx(t,{children:"Hash"}),e.jsx(t,{children:"Data Count"})]})}),e.jsxs(T,{children:[e.jsxs(s,{children:[e.jsx(n,{className:"font-mono",children:"1234"}),e.jsx(n,{className:"text-zinc-400",children:"2 minutes ago"}),e.jsx(n,{className:"font-mono text-xs",children:"0x1a2b3c..."}),e.jsx(n,{children:"5"})]}),e.jsxs(s,{children:[e.jsx(n,{className:"font-mono",children:"1233"}),e.jsx(n,{className:"text-zinc-400",children:"5 minutes ago"}),e.jsx(n,{className:"font-mono text-xs",children:"0x4d5e6f..."}),e.jsx(n,{children:"3"})]}),e.jsxs(s,{children:[e.jsx(n,{className:"font-mono",children:"1232"}),e.jsx(n,{className:"text-zinc-400",children:"8 minutes ago"}),e.jsx(n,{className:"font-mono text-xs",children:"0x7g8h9i..."}),e.jsx(n,{children:"7"})]}),e.jsxs(s,{children:[e.jsx(n,{className:"font-mono",children:"1231"}),e.jsx(n,{className:"text-zinc-400",children:"12 minutes ago"}),e.jsx(n,{className:"font-mono text-xs",children:"0xjk1l2m..."}),e.jsx(n,{children:"2"})]})]})]})},i={render:()=>e.jsxs(c,{children:[e.jsx(m,{children:e.jsxs(s,{children:[e.jsx(t,{children:"Timestamp"}),e.jsx(t,{children:"Event Type"}),e.jsx(t,{children:"IP Hash"}),e.jsx(t,{children:"Event ID"})]})}),e.jsxs(T,{children:[e.jsxs(s,{children:[e.jsx(n,{className:"font-mono text-xs",children:"2024-01-20 14:23:15"}),e.jsx(n,{children:e.jsx("span",{className:"px-2 py-1 text-xs border bg-green-900/20 border-green-700 text-green-400",children:"AccountCreated"})}),e.jsx(n,{className:"font-mono text-xs text-zinc-400",children:"a1b2c3d4e5f6g7h8..."}),e.jsx(n,{className:"font-mono text-xs",children:"evt_1234567890abcdef..."})]}),e.jsxs(s,{children:[e.jsx(n,{className:"font-mono text-xs",children:"2024-01-20 14:22:45"}),e.jsx(n,{children:e.jsx("span",{className:"px-2 py-1 text-xs border bg-blue-900/20 border-blue-700 text-blue-400",children:"AccountLogin"})}),e.jsx(n,{className:"font-mono text-xs text-zinc-400",children:"i9j8k7l6m5n4o3p2..."}),e.jsx(n,{className:"font-mono text-xs",children:"evt_fedcba0987654321..."})]})]})]})};var h,j,p;l.parameters={...l.parameters,docs:{...(h=l.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <Table>
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Email</Th>
          <Th>Role</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td>John Doe</Td>
          <Td>john@example.com</Td>
          <Td>Admin</Td>
        </Tr>
        <Tr>
          <Td>Jane Smith</Td>
          <Td>jane@example.com</Td>
          <Td>User</Td>
        </Tr>
        <Tr>
          <Td>Bob Johnson</Td>
          <Td>bob@example.com</Td>
          <Td>User</Td>
        </Tr>
      </Tbody>
    </Table>
}`,...(p=(j=l.parameters)==null?void 0:j.docs)==null?void 0:p.source}}};var b,f,u;x.parameters={...x.parameters,docs:{...(b=x.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => <Table striped>
      <Thead>
        <Tr>
          <Th>Block #</Th>
          <Th>Timestamp</Th>
          <Th>Hash</Th>
          <Th>Data Count</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td className="font-mono">1234</Td>
          <Td className="text-zinc-400">2 minutes ago</Td>
          <Td className="font-mono text-xs">0x1a2b3c...</Td>
          <Td>5</Td>
        </Tr>
        <Tr>
          <Td className="font-mono">1233</Td>
          <Td className="text-zinc-400">5 minutes ago</Td>
          <Td className="font-mono text-xs">0x4d5e6f...</Td>
          <Td>3</Td>
        </Tr>
        <Tr>
          <Td className="font-mono">1232</Td>
          <Td className="text-zinc-400">8 minutes ago</Td>
          <Td className="font-mono text-xs">0x7g8h9i...</Td>
          <Td>7</Td>
        </Tr>
        <Tr>
          <Td className="font-mono">1231</Td>
          <Td className="text-zinc-400">12 minutes ago</Td>
          <Td className="font-mono text-xs">0xjk1l2m...</Td>
          <Td>2</Td>
        </Tr>
      </Tbody>
    </Table>
}`,...(u=(f=x.parameters)==null?void 0:f.docs)==null?void 0:u.source}}};var N,g,y;i.parameters={...i.parameters,docs:{...(N=i.parameters)==null?void 0:N.docs,source:{originalSource:`{
  render: () => <Table>
      <Thead>
        <Tr>
          <Th>Timestamp</Th>
          <Th>Event Type</Th>
          <Th>IP Hash</Th>
          <Th>Event ID</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td className="font-mono text-xs">2024-01-20 14:23:15</Td>
          <Td>
            <span className="px-2 py-1 text-xs border bg-green-900/20 border-green-700 text-green-400">
              AccountCreated
            </span>
          </Td>
          <Td className="font-mono text-xs text-zinc-400">
            a1b2c3d4e5f6g7h8...
          </Td>
          <Td className="font-mono text-xs">evt_1234567890abcdef...</Td>
        </Tr>
        <Tr>
          <Td className="font-mono text-xs">2024-01-20 14:22:45</Td>
          <Td>
            <span className="px-2 py-1 text-xs border bg-blue-900/20 border-blue-700 text-blue-400">
              AccountLogin
            </span>
          </Td>
          <Td className="font-mono text-xs text-zinc-400">
            i9j8k7l6m5n4o3p2...
          </Td>
          <Td className="font-mono text-xs">evt_fedcba0987654321...</Td>
        </Tr>
      </Tbody>
    </Table>
}`,...(y=(g=i.parameters)==null?void 0:g.docs)==null?void 0:y.source}}};const I=["Default","Striped","AuditLogs"];export{i as AuditLogs,l as Default,x as Striped,I as __namedExportsOrder,A as default};
