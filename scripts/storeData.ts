import { encrypt } from "../../../../public/rabe/rabe_wasm";
import { createClient } from "@/lib/supabase";
import { uploadToIPFS } from "@/utils/ipfs";
import { createToken } from "@/utils/smartContract";

async function storeData(data: string, accessPolicy: string, tokenId: string) {
  const client = createClient();
  const { data: keys } = await client.from("keys").select("type,key");
  const pk = keys?.find((key) => key.type == "pk");

  if (!pk) {
    throw new Error("Public key not found");
  }

  const encryptedData = encrypt(data, pk.key, accessPolicy);
  const ipfsHash = await uploadToIPFS(encryptedData, accessPolicy);

  await createToken(tokenId, ipfsHash);

  console.log("Data stored and token created successfully");
}

// Example usage
storeData("your-data-here", "your-access-policy-here", "your-token-id-here").catch(console.error);
