import { Projalf } from "projalf"
const project = new Projalf({
  cdkVersion: "2.1.0",
  defaultReleaseBranch: "main",
  devDeps: ["projalf"],
  name: "dashboard-mgt-bff",
  projenrcTs: true,

  watchIncludes: ["src/**/*.ts", "src/**/*.tsx"],

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,  /* The "name" in package.json. */
})
project.addTask("deploy:watch", {
  exec: "cdk deploy --all --method=direct --outputs-file=test.output.json --watch --hotswap-fallback --require-approval=never",
  receiveArgs: true,
})
project.synth()
