import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FC, useState } from "react";
import styles from "../styles/Home.module.css";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";

export const TransferTokens: FC = () => {
  const [txSig, setTxSig] = useState("");
  const [tokenAccount, setTokenAccount] = useState("");
  const [balance, setBalance] = useState("");
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const link = () => {
    return txSig
      ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet`
      : "";
  };

  const transferTo = async (event) => {
    event.preventDefault();
    if (!connection || !publicKey) {
      return;
    }
    const transaction = new web3.Transaction();

    const mintPubKey = new web3.PublicKey(event.target.mint.value);
    const recipientPubKey = new web3.PublicKey(event.target.recipient.value);
    const amount = event.target.amount.value;

    const senderAssociatedTokenAccount = await getAssociatedTokenAddress(
        mintPubKey,
        publicKey,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    console.log(senderAssociatedTokenAccount.toBase58());

    // first create both associated token accounts for source and destination
    const recipientAssociatedTokenAccount = await getAssociatedTokenAddress(
      mintPubKey,
      recipientPubKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    console.log(recipientAssociatedTokenAccount.toBase58());

    transaction.add(
        createTransferInstruction(
          senderAssociatedTokenAccount,
          recipientAssociatedTokenAccount,
          publicKey,
          amount,
        )
      )

    const signature = await sendTransaction(transaction, connection);

    await connection.confirmTransaction(signature, "confirmed");

    setTxSig(signature);
    setTokenAccount(senderAssociatedTokenAccount.toString());

    const account = await getAccount(connection, senderAssociatedTokenAccount);
    setBalance(account.amount.toString());
  };

  return (
    <div>
      <br />
      {publicKey ? (
        <form onSubmit={transferTo} className={styles.form}>
          <label htmlFor="mint">Transfer the Tokens:</label>
          <input
            id="mint"
            type="text"
            className={styles.formField}
            placeholder="Enter Token Mint"
            required
          />
          <label htmlFor="recipient">Recipient:</label>
          <input
            id="recipient"
            type="text"
            className={styles.formField}
            placeholder="Enter Recipient PublicKey(wallet)"
            required
          />
          <label htmlFor="amount">Amount Tokens to send:</label>
          <input
            id="amount"
            type="text"
            className={styles.formField}
            placeholder="e.g. 100"
            required
          />
          <button type="submit" className={styles.formButton}>
            Transfer Tokens
          </button>
        </form>
      ) : (
        <span></span>
      )}
      {txSig ? (
        <div>
          <p>Token Balance: {balance} </p>
          <p>View your transaction on </p>
          <a href={link()}>Solana Explorer</a>
        </div>
      ) : null}
    </div>
  );
};
