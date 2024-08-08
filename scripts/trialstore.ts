// Import necessary modules and functions
import init, { encrypt } from "../public/rabe/rabe_wasm";
import { createClient } from "@/lib/supabase";
import { uploadToIPFS } from "@/utils/ipfs";
import { createToken, generateTokenId } from "@/utils/smartContract";
import { ethers } from "ethers";
import { sha256 } from 'crypto-js';

interface Key {
  type: string;
  key: string;
}

// Step 1: Request PK (Public Key) from the Key Generation Server
async function requestPublicKey(): Promise<string> {
  const client = createClient();
  
  // Retrieve the public key from the database
  const { data: keys } = await client.from("keys").select("type,key");
  const pk = (keys as Key[])?.find((key) => key.type === "pk");

  if (!pk) {
    throw new Error("Public key not found");
  }

  // Step 2: Return the PK to the Data Owner
  return pk.key;
}

// Function to store data with encryption and token creation
async function storeData(plaintext: string, accessPolicy: string, dataOwnerAddress: string): Promise<void> {
  try {
    // Step 2: Retrieve the public key
    const publicKey = await requestPublicKey();

    // Step 3: Encrypt the data using the public key and the defined access policy
    const ciphertext = encrypt(plaintext, publicKey, accessPolicy);

    // Prepare the data to be uploaded, including the ciphertext and access policy
    const dataToUpload = {
      ciphertext,
      accessPolicy
      // A_pass and A_fail could be added here if necessary
    };

    // Step 4: Upload the encrypted data and policy to IPFS and get the IPFS hash
    const ipfsHash = await uploadToIPFS(JSON.stringify(dataToUpload));
   
    // Step 5: Generate a unique token ID based on the data owner's address
    const tokenId = await generateTokenId(dataOwnerAddress);
    // Step 5: Create a token on the blockchain with the IPFS hash and the data owner's address
    await createToken(ipfsHash, dataOwnerAddress);

    console.log("Data stored and token created successfully");
  } catch (error) {
    console.error("Error storing data:", error);
  }
}

async function generateTokenId(dataOwnerAddress: string): Promise<string> {
    return sha256(dataOwnerAddress).toString();
} 


async function createToken(ipfsHash: string, dataOwnerAddress: string): Promise<void> {
  const provider = new ethers.providers.Web3Provider(window.ethereum);

  await provider.send("eth_requestAccounts", []);

  const signer = provider.getSigner();
  const contract = new ethers.Contract(contractAddress, contractABI, signer);
  const tx = await contract.createToken(ipfsHash, dataOwnerAddress);
  await tx.wait();
  console.log("Token created");
}
