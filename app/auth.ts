export function assertNoPrivateKeyInEnvironment():void{if(process.env.GITHUB_PRIVATE_KEY?.includes("BEGIN"))throw new Error("Refusing inline GitHub private key material in environment.");}
