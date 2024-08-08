import init, { encrypt } from "../../public/rabe/rabe_wasm";
import { createClient } from "@/lib/supabase";
import { uploadToIPFS } from "@/utils/ipfs";
import { createToken, generateTokenId } from "@/utils/smartContract";
import { ethers } from "ethers";
import { sha256 } from 'crypto-js';

interface Key {
  type: string;
  key: string;
}

async function requestPublicKey(): Promise<string> {
  const client = createClient();
  const { data: keys } = await client.from("keys").select("type,key");
  const pk = (keys as Key[])?.find((key) => key.type === "pk");

  if (!pk) {
    throw new Error("Public key not found");
  }

  return pk.key;
}

async function storeData(plaintext: string, accessPolicy: string, dataOwnerAddress: string): Promise<void> {
  try {
    const publicKey = await requestPublicKey();
    const tokenId = await generateTokenId(dataOwnerAddress);
    const ciphertext = encrypt(plaintext, publicKey, accessPolicy);
    const dataToUpload = {
      ciphertext,
      accessPolicy
    };
    const ipfsHash = await uploadToIPFS(JSON.stringify(dataToUpload));
    await createToken(ipfsHash, dataOwnerAddress);

    console.log("Data stored and token created successfully");
  } catch (error) {
    console.error("Error storing data:", error);
  }
}

async function generateTokenId(dataOwnerAddress: string): Promise<string> {
    return sha256(dataOwnerAddress).toString();
  } 

async function createToken( ipfsHash: string, dataOwnerAddress: string): Promise<void> {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(contractAddress, contractABI, signer);
  const tx = await contract.createToken(ipfsHash, dataOwnerAddress);
  await tx.wait();
  console.log("Token created");
}
