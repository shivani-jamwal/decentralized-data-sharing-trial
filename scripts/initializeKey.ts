import init, { setup } from "../../../../public/rabe/rabe_wasm";
import wasmUrl from "../../../../wasm_config";
import { createClient } from "@/lib/supabase";

async function initializeKeys() {
  await init(wasmUrl);
  const { pk, msk } = setup(); // Generate PK and MSK

  const client = createClient();
  await client.from("keys").insert([
    { type: "pk", key: pk },
    { type: "msk", key: msk }
  ]);

  console.log("Keys initialized and stored successfully");
}

initializeKeys().catch(console.error);
