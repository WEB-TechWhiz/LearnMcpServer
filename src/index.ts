import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";


const server = new McpServer({
    name:"my-first-mcp",
    version:"1.0.0",
    capabilities:{
        tools:{},
    },
});

server.tool(
    "add-number",
    "Add two number",
    {
        a:z.number().describe("First number"),
        b:z.number().describe("First number"),
    },
    ({a,b})=>{
        return{
            content:[{type:"text",text:`Total is ${a+b}`}]
        }
    }
); 
server.tool(
    "get_github_repos",
    "Get Github repositories from the given username",
    {
        username:z.string().describe("Github username")
    },
    async({username})=>{

        const res =await fetch (`https://api.github.com/users/${username}/repos`,{
            headers:{"user-Agent":"MCP server"},
        });
        
        if(!res.ok)throw new Error("Github API error!");

        const repos = await res.json();
        const repoList = repos.map((repo:any, i:number) => `${i + 1}. ${repo.name}`).join("\n\n");

        return{
            content:[{type:"text",text:`Github repositories for ${username}:(${repos.length} repos):\n\n${repoList}`}],
        };
    }
); 

server.resource(
    "apartment_rules",
    "rules://all",{
        description:"Resource for all apartment rules",
        MIMEType:"text/plain",
    },
    async(uri)=>{
      const uriString = uri.toString()   
    const _filename= fileURLToPath(import.meta.url)
    const  _dirname=path.dirname(_filename);
const rules= await fs.readFile(
    path.resolve(_dirname,"../src/Data/rules.doc"),"utf-8"
);
return{
    contents:[
        {
            uri:uriString,
            MIMEType: "text/plain",
            text:rules,
        }
    ]
}
    }
)
server.prompt(
  "explain-sql",
  "Explain the given SQL query",
  {
    sql: z.string().describe("This SQL query to explain"),
  },
  ({ sql }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Give me a detailed explanation of the following SQL query in plain English: ${sql}. Make it very detailed and beginner-friendly.`,
          },
        },
      ],
    };
  }
);

async function main() {
     const transport = new StdioServerTransport
     await server.connect(transport)
}
main().catch((error)=>{
    console.error("Error in main!",error);
    process.exit(1);
})